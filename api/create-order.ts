const planToPriceMap = {
  'pro': 499,
  'credits': 199,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { planId, customerEmail, customerName } = req.body;

    if (!planId || !planToPriceMap[planId]) {
      return res.status(400).json({ error: 'Invalid plan specified' });
    }

    const appId = process.env.VITE_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.VITE_CASHFREE_MODE || 'sandbox';

    if (!appId || !secretKey) {
      return res.status(500).json({ error: 'Cashfree credentials missing on server' });
    }

    const amount = planToPriceMap[planId];
    const baseUrl = mode === 'production' 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';
      
    const orderId = `order_${Date.now()}`;

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
          return_url: `https://${req.headers.host}/payment-result?order_id={order_id}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to create order' });
    }

    return res.status(200).json({ 
      order_id: orderId,
      payment_session_id: data.payment_session_id 
    });

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
