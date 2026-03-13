import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface Status {
  type: 'loading' | 'success' | 'error' | 'pending';
  title: string;
  message: string;
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>({ 
    type: 'loading', 
    title: 'Payment Verification',
    message: 'Verifying your payment... Please wait.' 
  });
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setStatus({ 
        type: 'error', 
        title: 'Payment Failed',
        message: 'No order ID found. Your payment cannot be verified.' 
      });
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment-status?order_id=${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        const { ui_status } = data;

        if (ui_status === 'SUCCESS') {
          setStatus({ 
            type: 'success', 
            title: 'Payment Successful',
            message: 'Payment successful. Thank you for your purchase.' 
          });
        } else if (ui_status === 'FAILED') {
          setStatus({ 
            type: 'error', 
            title: 'Payment Failed',
            message: 'Payment was not completed. Please try again.'
          });
        } else if (ui_status === 'USER_DROPPED') {
          setStatus({ 
            type: 'error', 
            title: 'Payment Incomplete',
            message: 'Payment was not completed.'
          });
        } else if (ui_status === 'CANCELLED') {
          setStatus({ 
            type: 'error', 
            title: 'Payment Cancelled',
            message: 'Payment was cancelled.'
          });
        } else {
          setStatus({ 
            type: 'pending', 
            title: 'Payment Pending',
            message: 'Your payment is still being processed.'
          });
        }
      } catch (error) {
        setStatus({ 
          type: 'error', 
          title: 'Verification Error',
          message: error instanceof Error ? error.message : 'An unknown error occurred during verification.' 
        });
      }
    };

    verifyPayment();
  }, [orderId]);

  const renderIcon = () => {
    switch (status.type) {
      case 'loading':
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="h-16 w-16 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 flex items-center justify-center py-20">
        <div className="text-center max-w-lg w-full glass-card neon-border p-8 md:p-12 rounded-2xl">
          <div className="mb-6 flex justify-center">{renderIcon()}</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
            {status.title}
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            {status.message}
          </p>
          
          <Button asChild variant="hero" className="w-full py-6 text-lg font-bold shadow-lg">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
