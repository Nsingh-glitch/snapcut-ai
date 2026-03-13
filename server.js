import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Securely map plan IDs to prices on the server
const planToPriceMap = {
  'pro': 499,
  'credits': 199,
};

async function createServer() {
  const app = express();
  const port = process.env.PORT || 8080;

  // Body parsing middleware
  app.use(express.json());

  // Simple logger for all requests
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Cashfree API credentials
  const appId = process.env.VITE_CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const mode = process.env.VITE_CASHFREE_MODE || 'sandbox';

  // API Routes (Directly on app for maximum visibility)
  app.get('/api/test', (req, res) => {
    console.log('--- API Test Route Hit ---');
    res.json({ message: 'API is working!' });
  });

  app.post('/api/create-order', async (req, res) => {
    console.log('\n--- Order Creation Started ---');
    console.log('Body:', JSON.stringify(req.body));
    try {
      const { planId, customerEmail, customerName } = req.body;
      console.log(`Plan ID: ${planId}, Email: ${customerEmail}`);

      if (!planId || !planToPriceMap[planId]) {
        console.error('Invalid planId received:', planId);
        return res.status(400).json({ error: 'Invalid plan specified' });
      }

      if (!appId || !secretKey) {
        console.error('Cashfree credentials missing in .env');
        return res.status(500).json({ error: 'Cashfree credentials missing on server' });
      }

      const amount = planToPriceMap[planId];
      const baseUrl = mode === 'production' 
        ? 'https://api.cashfree.com/pg/orders' 
        : 'https://sandbox.cashfree.com/pg/orders';
        
      const orderId = `order_${Date.now()}`;

      console.log(`Calling Cashfree API (${mode}) for Order: ${orderId}, Amount: ${amount}`);

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
        body: JSON.stringify({
          order_amount: amount,
          order_currency: 'INR',
          order_id: orderId,
          customer_details: {
            customer_id: `user_${customerEmail ? customerEmail.replace(/[^a-zA-Z0-9]/g, '_') : Date.now()}`,
            customer_name: customerName || 'Guest User',
            customer_email: customerEmail || 'guest@example.com',
            customer_phone: '9999999999',
          },
          order_meta: {
            return_url: `http://localhost:${port}/payment-result?order_id={order_id}`,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Cashfree API Error Response:', JSON.stringify(data, null, 2));
        return res.status(response.status).json({ error: data.message || 'Failed to create order' });
      }

      console.log('Order created successfully. Session ID obtained.');
      res.json({ 
        order_id: orderId,
        payment_session_id: data.payment_session_id 
      });

    } catch (error) {
      console.error('Order Creation Exception:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/payment-status', async (req, res) => {
    console.log('\n--- Status Check Started ---');
    try {
      const { order_id } = req.query;
      console.log(`Checking status for Order ID: ${order_id}`);

      if (!order_id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      if (!appId || !secretKey) {
        return res.status(500).json({ error: 'Cashfree credentials missing on server' });
      }

      const orderUrl = mode === 'production' 
        ? `https://api.cashfree.com/pg/orders/${order_id}`
        : `https://sandbox.cashfree.com/pg/orders/${order_id}`;

      // 1. Get Order Details
      const orderResponse = await fetch(orderUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error('Cashfree Order API Error:', orderData);
        return res.status(orderResponse.status).json({ error: orderData.message || 'Failed to fetch order status' });
      }

      let ui_status = 'PENDING';
      let latest_payment_status = null;
      let payment_message = null;
      let error_details = null;

      if (orderData.order_status === 'PAID') {
        ui_status = 'SUCCESS';
      } else {
        // 2. If not PAID, check individual payments
        const paymentsUrl = mode === 'production'
          ? `https://api.cashfree.com/pg/orders/${order_id}/payments`
          : `https://sandbox.cashfree.com/pg/orders/${order_id}/payments`;

        const paymentsResponse = await fetch(paymentsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': appId,
            'x-client-secret': secretKey,
            'x-api-version': '2023-08-01',
          },
        });

        const paymentsData = await paymentsResponse.json();

        if (paymentsResponse.ok && Array.isArray(paymentsData) && paymentsData.length > 0) {
          // 4. Select the latest payment attempt
          const latestPayment = paymentsData[paymentsData.length - 1];
          latest_payment_status = latestPayment.payment_status;
          payment_message = latestPayment.payment_message;
          error_details = latestPayment.payment_gateway_details || null;

          // 7. Determine ui_status using rules
          if (latest_payment_status === 'SUCCESS') {
            ui_status = 'SUCCESS';
          } else if (latest_payment_status === 'FAILED' || latest_payment_status === 'VOID') {
            ui_status = 'FAILED';
          } else if (latest_payment_status === 'USER_DROPPED') {
            ui_status = 'USER_DROPPED';
          } else if (latest_payment_status === 'CANCELLED') {
            ui_status = 'CANCELLED';
          } else if (latest_payment_status === 'NOT_ATTEMPTED' || latest_payment_status === 'PENDING') {
            ui_status = 'PENDING';
          } else {
            ui_status = 'PENDING';
          }
        }
      }

      console.log(`Order ${order_id} Result: order_status=${orderData.order_status}, latest_payment=${latest_payment_status}, ui_status=${ui_status}`);
      
      // 6. Return a normalized JSON response to frontend
      res.json({ 
        order_status: orderData.order_status,
        latest_payment_status,
        payment_message,
        error_details,
        order_amount: orderData.order_amount,
        ui_status
      });

    } catch (error) {
      console.error('Status Check Exception:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware in dev mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, () => {
    console.log(`\n  🚀 SnapCut AI combined server running at http://localhost:${port}`);
    console.log(`  🔗 App: http://localhost:${port}`);
    console.log(`  🔌 APIs: http://localhost:${port}/api/create-order\n`);
  });
}

createServer();
