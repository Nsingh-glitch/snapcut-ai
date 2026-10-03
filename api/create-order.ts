import { createClient } from "@supabase/supabase-js";

const planToCreditsMap: Record<
  string,
  { amount: number; credits: number }
> = {
  starter: { amount: 49, credits: 10 },
  standard: { amount: 99, credits: 25 },
  pro: { amount: 499, credits: 50 },
  "credit-pro": { amount: 199, credits: 60 },
  credits: { amount: 199, credits: 50 },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { planId, customerEmail, customerName } = req.body || {};

    // Validate plan
    const selectedPlan = planId ? planToCreditsMap[planId] : null;

    if (!selectedPlan) {
      return res.status(400).json({
        error: "Invalid plan specified",
      });
    }

    // Server-side credentials
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox";

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: "Cashfree credentials missing on server",
      });
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return res.status(500).json({
        error: "Supabase server credentials missing",
      });
    }

    // Authenticate user
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = authorization.slice("Bearer ".length);

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    const amount = selectedPlan.amount;
    const credits = selectedPlan.credits;

    const baseUrl =
      mode === "production"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const host = req.headers.host;

    // Create Cashfree order
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        order_amount: amount,
        order_currency: "INR",
        order_id: orderId,
        customer_details: {
          customer_id: `user_${user.id}`,
          customer_name:
            customerName ||
            user.user_metadata?.full_name ||
            "User",
          customer_email: customerEmail || user.email,
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: `https://${host}/payment-result?order_id={order_id}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Cashfree order creation failed:",
        data
      );

      return res.status(response.status).json({
        error:
          data.message || "Failed to create order",
      });
    }

    // Create pending purchase record
    const { error: purchaseError } = await supabaseAdmin
      .from("credit_purchases")
      .insert({
        order_id: orderId,
        user_id: user.id,
        amount: amount,
        credits: credits,
        status: "PENDING",
      });

    if (purchaseError) {
      console.error(
        "Failed to create credit purchase:",
        purchaseError
      );

      return res.status(500).json({
        error:
          "Payment order created, but purchase record could not be created",
      });
    }

    return res.status(200).json({
      order_id: orderId,
      payment_session_id: data.payment_session_id,
    });
  } catch (error: any) {
    console.error("Create order error:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
}