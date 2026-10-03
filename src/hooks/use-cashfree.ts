import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    Cashfree: any;
  }
}

export const useCashfree = () => {
  const navigate = useNavigate();

  const triggerPayment = useCallback(async (planId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate("/login");
        return;
      }

      const mode = import.meta.env.VITE_CASHFREE_MODE || "sandbox";

      if (!window.Cashfree) {
        throw new Error("Cashfree checkout is unavailable. Please try again.");
      }

      toast.info("Initializing secure payment...");

      // Initialize Cashfree SDK
      const cashfree = window.Cashfree({
        mode: mode,
      });

      // Fetch real session ID from our internal API
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          planId,
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
  }, [navigate]);

  return { triggerPayment };
};
