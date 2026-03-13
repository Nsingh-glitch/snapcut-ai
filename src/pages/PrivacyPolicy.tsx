import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8 gradient-text">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm md:text-base">
            <p>Last Updated: March 12, 2026</p>
            <p>Welcome to SnapCut AI. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and background removal services.</p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when you create an account, process images, or contact us for support. This includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account Information: Name, email address, and password.</li>
              <li>Usage Data: Images uploaded for background removal (deleted after 24 hours).</li>
              <li>Payment Information: Processed securely through Cashfree; we do not store your card details.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our background removal services.</li>
              <li>Process your transactions and manage your account.</li>
              <li>Communicate with you about updates, offers, and support.</li>
              <li>Ensure the security and integrity of our platform.</li>
            </ul>

            <h2 className="text-xl font-semibold text-foreground mt-8">3. Data Retention</h2>
            <p>Uploaded images are temporarily stored for processing and are automatically deleted from our servers after 24 hours to ensure your privacy. Account information is retained as long as your account is active.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">4. Third-Party Services</h2>
            <p>We use third-party services like Cashfree for payment processing and Cloudinary for temporary image hosting. These providers have their own privacy policies governing how they handle your data.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at support@snapcutai.com.</p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
