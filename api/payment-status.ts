import { getAdminClient, getAuthenticatedUser } from "../server/auth.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({
        error: "Order ID is required",
      });
    }

    // Authenticate logged-in user
    const user = await getAuthenticatedUser(req);

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const mode = process.env.CASHFREE_MODE || "sandbox";

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: "Cashfree credentials missing on server",
      });
    }

    const baseUrl =
      mode === "production"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    // --------------------------------------------------
    // 1. Verify order belongs to this user
    // --------------------------------------------------

    const admin = getAdminClient();

    const { data: purchase, error: purchaseError } = await admin
      .from("credit_purchases")
      .select("order_id, user_id, status, credits, amount")
      .eq("order_id", String(order_id))
      .eq("user_id", user.id)
      .maybeSingle();

    if (purchaseError) {
      console.error(
        "[payment-status] purchase lookup failed:",
        purchaseError
      );

      return res.status(500).json({
        error: "Failed to verify payment ownership",
      });
    }

    if (!purchase) {
      return res.status(404).json({
        error: "Payment order not found for this user",
      });
    }

    // --------------------------------------------------
    // 2. Get Cashfree order status
    // --------------------------------------------------

    const orderResponse = await fetch(
      `${baseUrl}/${encodeURIComponent(String(order_id))}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": "2023-08-01",
        },
      }
    );

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error(
        "[payment-status] Cashfree order lookup failed:",
        orderData
      );

      return res.status(orderResponse.status).json({
        error:
          orderData.message || "Failed to fetch order status",
      });
    }

    let ui_status = "PENDING";
    let latest_payment_status = null;
    let payment_message = null;

    // --------------------------------------------------
    // 3. Determine payment status
    // --------------------------------------------------

    if (orderData.order_status === "PAID") {
      ui_status = "SUCCESS";
    } else {
      const paymentsResponse = await fetch(
        `${baseUrl}/${encodeURIComponent(String(order_id))}/payments`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": appId,
            "x-client-secret": secretKey,
            "x-api-version": "2023-08-01",
          },
        }
      );

      const paymentsData = await paymentsResponse.json();

      if (
        paymentsResponse.ok &&
        Array.isArray(paymentsData) &&
        paymentsData.length > 0
      ) {
        const latestPayment =
          paymentsData[paymentsData.length - 1];

        latest_payment_status =
          latestPayment.payment_status || null;

        payment_message =
          latestPayment.payment_message || null;

        if (latest_payment_status === "SUCCESS") {
          ui_status = "SUCCESS";
        } else if (
          latest_payment_status === "FAILED" ||
          latest_payment_status === "VOID"
        ) {
          ui_status = "FAILED";
        } else if (
          latest_payment_status === "USER_DROPPED"
        ) {
          ui_status = "USER_DROPPED";
        } else if (
          latest_payment_status === "CANCELLED"
        ) {
          ui_status = "CANCELLED";
        }
      }
    }

    // --------------------------------------------------
    // 4. Payment successful → add credits
    // --------------------------------------------------

    if (ui_status === "SUCCESS") {
      const { data: creditResult, error: creditError } =
        await admin.rpc("complete_credit_purchase", {
          p_order_id: String(order_id),
          p_user_id: user.id,
        });

      if (creditError) {
        console.error(
          "[payment-status] credit purchase failed:",
          creditError
        );

        return res.status(500).json({
          error:
            "Payment verified, but credits could not be added.",
        });
      }

      const result = creditResult?.[0];

      if (!result) {
        return res.status(500).json({
          error:
            "Payment verified, but credit update returned no result.",
        });
      }

      return res.status(200).json({
        order_status: orderData.order_status,
        latest_payment_status,
        payment_message,
        order_amount: orderData.order_amount,
        ui_status,

        creditsAdded: result.credits_added,
        creditsRemaining: result.credits_remaining,
        imagesProcessed: result.images_processed,
      });
    }

    // --------------------------------------------------
    // 5. Payment not successful
    // --------------------------------------------------

    return res.status(200).json({
      order_status: orderData.order_status,
      latest_payment_status,
      payment_message,
      order_amount: orderData.order_amount,
      ui_status,
    });
  } catch (error: any) {
    console.error("[payment-status] error:", error);

    return res.status(error?.statusCode || 500).json({
      error:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
}