export const config = {
  runtime: 'edge',
};

const planToPriceMap = {
  'pro': 499,
  'credits': 199,
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { planId, customerEmail, customerName } = body;

    if (!planId || !planToPriceMap[planId]) {
      return new Response(JSON.stringify({ error: 'Invalid plan specified' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const appId = process.env.VITE_CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.VITE_CASHFREE_MODE || 'sandbox';

    if (!appId || !secretKey) {
      return new Response(JSON.stringify({ error: 'Cashfree credentials missing on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
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
          return_url: `https://${req.headers.get('host')}/payment-result?order_id={order_id}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Failed to create order' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      order_id: orderId,
      payment_session_id: data.payment_session_id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
