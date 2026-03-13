import { useCallback } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Cashfree: any;
  }
}

export const useCashfree = () => {
  const triggerPayment = useCallback(async (planId: string) => {
    try {
      const appId = import.meta.env.VITE_CASHFREE_APP_ID;
      const mode = import.meta.env.VITE_CASHFREE_MODE || "sandbox";

      if (!appId || appId.includes("REPLACE_WITH")) {
        toast.error("Cashfree App ID is missing in .env file.");
        return;
      }

      // Get user session for order details
      const session = localStorage.getItem("snapcut_user_session");
      const user = session ? JSON.parse(session) : null;

      toast.info("Initializing secure payment...");

      // Initialize Cashfree SDK
      const cashfree = window.Cashfree({
        mode: mode,
      });

      // Fetch real session ID from our internal API
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          customerEmail: user?.email,
          customerName: user?.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "An unknown server error occurred" }));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.payment_session_id) {
        // Redirect the user to the Cashfree checkout page
        await cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_self", // Use _self for full page redirect
        });
      } else {
        throw new Error("Invalid session response from server.");
      }

    } catch (error) {
      console.error("Cashfree Initialization Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load payment gateway.");
    }
  }, []);

  return { triggerPayment };
};
