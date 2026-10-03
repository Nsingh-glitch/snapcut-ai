import { getAdminClient, getAuthenticatedUser } from './auth.js';

const packages = {
  starter: { amount: 49, credits: 10 },
  standard: { amount: 99, credits: 25 },
  pro: { amount: 499, credits: 50 },
  'credit-pro': { amount: 199, credits: 60 },
  credits: { amount: 199, credits: 50 },
};

function getCashfreeConfig() {
  const appId = process.env.CASHFREE_APP_ID || process.env.VITE_CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const mode = process.env.CASHFREE_MODE || 'sandbox';
  console.info('[cashfree] configuration', {
    hasCashfreeAppId: Boolean(appId),
    hasCashfreeSecret: Boolean(secretKey),
    cashfreeMode: mode,
  });
  if (!appId || !secretKey) {
    const error = new Error('Cashfree configuration is missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY.');
    error.statusCode = 503;
    error.code = 'CASHFREE_CONFIG_MISSING';
    throw error;
  }
  return { appId, secretKey, mode };
}

function getCashfreeUrl(mode, orderId = '') {
  const base = mode === 'production' ? 'https://api.cashfree.com/pg/orders' : 'https://sandbox.cashfree.com/pg/orders';
  return `${base}${orderId ? `/${encodeURIComponent(orderId)}` : ''}`;
}

function getReturnUrl(req) {
  const forwardedProtocol = req.headers['x-forwarded-proto'];
  const protocol = forwardedProtocol || (req.headers.host?.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${req.headers.host}/payment-result?order_id={order_id}`;
}

function jsonError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : error.message,
    ...(error.code ? { code: error.code } : {}),
  });
}

export async function createOrderHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getAuthenticatedUser(req);
    const selectedPackage = packages[req.body?.planId];
    if (!selectedPackage) return res.status(400).json({ error: 'Invalid credits package.' });

    const { appId, secretKey, mode } = getCashfreeConfig();
    const orderId = `order_${crypto.randomUUID()}`;
    const admin = getAdminClient();
    const { error: purchaseError } = await admin.from('credit_purchases').insert({
      order_id: orderId,
      user_id: user.id,
      amount: selectedPackage.amount,
      credits: selectedPackage.credits,
      status: 'PENDING',
    });
    if (purchaseError) throw new Error('Could not create purchase record.');

    console.info('[cashfree] creating order', {
      userAuthenticated: true,
      userId: user.id,
      planId: req.body?.planId,
      cashfreeMode: mode,
    });

    let response;
    try {
      response = await fetch(getCashfreeUrl(mode), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
        body: JSON.stringify({
          order_amount: selectedPackage.amount,
          order_currency: 'INR',
          order_id: orderId,
          customer_details: {
            customer_id: user.id,
            customer_name: user.user_metadata?.full_name || 'SnapCut User',
            customer_email: user.email,
            customer_phone: '9999999999',
          },
          order_meta: { return_url: getReturnUrl(req) },
        }),
      });
    } catch (error) {
      console.error('[cashfree] request failed', { message: error instanceof Error ? error.message : 'network error' });
      const networkError = new Error('Could not connect to Cashfree.');
      networkError.statusCode = 502;
      throw networkError;
    }
    const data = await response.json();

    if (!response.ok) {
      console.warn('[cashfree] order rejected', {
        status: response.status,
        message: data.message || 'Cashfree rejected the order',
      });
      await admin.from('credit_purchases').update({ status: 'FAILED' }).eq('order_id', orderId);
      return res.status(response.status).json({ error: data.message || 'Failed to create order.' });
    }

    return res.status(200).json({ order_id: orderId, payment_session_id: data.payment_session_id });
  } catch (error) {
    return jsonError(res, error);
  }
}

export async function paymentStatusHandler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getAuthenticatedUser(req);
    const orderId = req.query?.order_id;
    if (!orderId || typeof orderId !== 'string') return res.status(400).json({ error: 'Order ID is required.' });

    console.info('[cashfree] verifying payment', {
      orderId,
      userAuthenticated: true,
      userId: user.id,
    });

    const admin = getAdminClient();
    const { data: purchase, error: purchaseError } = await admin
      .from('credit_purchases')
      .select('order_id, user_id, amount, credits, status')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();
    console.info('[cashfree] purchase lookup', {
      orderId,
      userId: user.id,
      purchaseFound: Boolean(purchase),
      purchaseStatus: purchase?.status || null,
      error: purchaseError?.message || null,
    });
    if (purchaseError || !purchase) {
      return res.status(404).json({
        error: 'Purchase order not found for this user.',
        code: 'ORDER_NOT_FOUND',
      });
    }

    const { appId, secretKey, mode } = getCashfreeConfig();
    const headers = {
      'Content-Type': 'application/json',
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': '2023-08-01',
    };
    const orderResponse = await fetch(getCashfreeUrl(mode, orderId), { headers });
    const orderData = await orderResponse.json();
    console.info('[cashfree] order status response', {
      orderId,
      httpStatus: orderResponse.status,
      orderStatus: orderData.order_status || null,
      message: orderData.message || orderData.error || null,
    });
    if (!orderResponse.ok) {
      return res.status(orderResponse.status === 404 ? 502 : orderResponse.status).json({
        error: orderData.message || orderData.error || 'Unable to verify payment with Cashfree.',
        code: orderResponse.status === 404 ? 'CASHFREE_ORDER_NOT_FOUND' : 'CASHFREE_VERIFY_FAILED',
      });
    }

    let uiStatus = orderData.order_status === 'PAID' ? 'SUCCESS' : 'PENDING';
    let paymentStatus = null;
    if (uiStatus !== 'SUCCESS') {
      const paymentsResponse = await fetch(`${getCashfreeUrl(mode, orderId)}/payments`, { headers });
      const paymentsData = await paymentsResponse.json();
      const latestPayment = Array.isArray(paymentsData) ? paymentsData.at(-1) : null;
      paymentStatus = latestPayment?.payment_status || null;
      console.info('[cashfree] payment status response', {
        orderId,
        httpStatus: paymentsResponse.status,
        paymentStatus,
        message: latestPayment?.payment_message || paymentsData.message || paymentsData.error || null,
      });
      if (!paymentsResponse.ok) {
        return res.status(paymentsResponse.status === 404 ? 502 : paymentsResponse.status).json({
          error: paymentsData.message || paymentsData.error || 'Unable to verify payment attempt with Cashfree.',
          code: paymentsResponse.status === 404 ? 'CASHFREE_PAYMENT_NOT_FOUND' : 'CASHFREE_PAYMENT_VERIFY_FAILED',
        });
      }
      if (paymentStatus === 'SUCCESS') {
        uiStatus = 'SUCCESS';
      } else if (['FAILED', 'VOID', 'USER_DROPPED', 'CANCELLED'].includes(paymentStatus)) {
        uiStatus = 'FAILED';
      }
    }
    

    if (uiStatus !== 'SUCCESS') {
      return res.json({ ui_status: uiStatus, order_status: orderData.order_status, latest_payment_status: paymentStatus });
    }

    const { data: creditResult, error: creditError } = await admin.rpc('complete_credit_purchase', {
      p_order_id: orderId,
      p_user_id: user.id,
    });
    if (creditError || !creditResult?.[0]) {
      console.error('[cashfree] credit completion failed', {
        orderId,
        userId: user.id,
        error: creditError?.message || 'RPC returned no result',
      });
      const creditErrorResponse = new Error('Payment verified, but credits could not be updated.');
      creditErrorResponse.statusCode = 502;
      creditErrorResponse.code = 'CREDIT_UPDATE_FAILED';
      throw creditErrorResponse;
    }

    const balance = creditResult[0];
    return res.json({
      ui_status: 'SUCCESS',
      order_status: orderData.order_status,
      creditsAdded: balance.credits_added,
      creditsRemaining: balance.credits_remaining,
      imagesProcessed: balance.images_processed,
    });
  } catch (error) {
    return jsonError(res, error);
  }
}
