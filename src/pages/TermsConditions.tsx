import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

export default function TermsConditions() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8 gradient-text">Terms & Conditions</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm md:text-base">
            <p>Last Updated: March 12, 2026</p>
            <p>By accessing or using SnapCut AI, you agree to be bound by these Terms & Conditions. Please read them carefully before using our services.</p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">1. Use of Service</h2>
            <p>SnapCut AI provides AI-powered background removal services. You must be at least 18 years old or have parental consent to use our platform. You are responsible for all activity that occurs under your account.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">2. User Content</h2>
            <p>You retain ownership of the images you upload. By uploading content, you grant SnapCut AI a temporary, non-exclusive license to process the image for the purpose of providing the background removal service. Images are deleted within 24 hours.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">3. Prohibited Conduct</h2>
            <p>You agree not to use SnapCut AI for any illegal purposes, including but not limited to processing copyrighted material without permission or uploading harmful content.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">4. Payments and Subscriptions</h2>
            <p>Payments are processed through Cashfree. All fees are non-refundable unless stated otherwise in our Refund Policy. We reserve the right to change our pricing at any time.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">5. Limitation of Liability</h2>
            <p>SnapCut AI is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of our service or any technical failures.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">6. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes will be resolved in the courts of Bangalore, Karnataka.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">7. Changes to Terms</h2>
            <p>We may update these Terms & Conditions from time to time. Your continued use of the service after changes are posted constitutes your acceptance of the new terms.</p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
