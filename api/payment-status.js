export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const order_id = searchParams.get('order_id');

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
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

    const orderUrl = mode === 'production' 
      ? `https://api.cashfree.com/pg/orders/${order_id}`
      : `https://sandbox.cashfree.com/pg/orders/${order_id}`;

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
      return new Response(JSON.stringify({ error: orderData.message || 'Failed to fetch order status' }), {
        status: orderResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let ui_status = 'PENDING';
    let latest_payment_status = null;
    let payment_message = null;

    if (orderData.order_status === 'PAID') {
      ui_status = 'SUCCESS';
    } else {
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
        const latestPayment = paymentsData[paymentsData.length - 1];
        latest_payment_status = latestPayment.payment_status;
        payment_message = latestPayment.payment_message;

        if (latest_payment_status === 'SUCCESS') ui_status = 'SUCCESS';
        else if (latest_payment_status === 'FAILED' || latest_payment_status === 'VOID') ui_status = 'FAILED';
        else if (latest_payment_status === 'USER_DROPPED') ui_status = 'USER_DROPPED';
        else if (latest_payment_status === 'CANCELLED') ui_status = 'CANCELLED';
      }
    }

    return new Response(JSON.stringify({ 
      order_status: orderData.order_status,
      latest_payment_status,
      payment_message,
      order_amount: orderData.order_amount,
      ui_status
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
