import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto glass-card rounded-2xl p-8 md:p-12 neon-border"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-8 gradient-text">Refund & Cancellation Policy</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm md:text-base">
            <p>Last Updated: March 12, 2026</p>
            <p>Thank you for choosing SnapCut AI. We strive to provide the best AI background removal experience. This policy outlines our procedures for refunds and cancellations.</p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">1. Cancellation</h2>
            <p>You can cancel your subscription at any time through your dashboard settings. Upon cancellation, you will continue to have access to your plan features until the end of the current billing cycle. No further charges will be made to your payment method.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">2. Refunds</h2>
            <p>We offer refunds under the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Technical Failure: If our service fails to process your image correctly due to a server-side error and support cannot resolve it.</li>
              <li>Duplicate Billing: If you were accidentally charged twice for the same billing period.</li>
              <li>Subscription Mistake: Refund requests made within 24 hours of a new subscription, provided no more than 2 images have been processed.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8">3. Non-Refundable Items</h2>
            <p>Refunds will not be issued for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Used credits or processed images beyond the initial 2 images.</li>
              <li>Change of mind after the 24-hour grace period.</li>
              <li>User errors such as uploading low-quality or unsupported file formats.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8">4. Process</h2>
            <p>To request a refund, please email us at billing@snapcutai.com with your transaction ID and reason for the request. Refunds are processed back to the original payment method within 5-7 working days.</p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
