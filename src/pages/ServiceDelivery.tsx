import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

export default function ServiceDelivery() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8 gradient-text">Service Delivery Policy</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground text-sm md:text-base">
            <p>Last Updated: March 12, 2026</p>
            <p>At SnapCut AI, we are committed to providing a seamless and instant digital service. This policy outlines how we deliver our background removal services to you.</p>
            
            <h2 className="text-xl font-semibold text-foreground mt-8">1. Instant Delivery</h2>
            <p>As a SaaS (Software as a Service) platform, our services are delivered digitally and instantly. Upon successful upload and processing, the background-removed image is made available for download in your dashboard immediately.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">2. Credits and Subscriptions</h2>
            <p>When you purchase a subscription or credits through Cashfree, they are credited to your SnapCut AI account instantly after payment confirmation. You can view your balance in the dashboard.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">3. Processing Times</h2>
            <p>While we aim for sub-5-second processing, delivery times may vary based on image size, complexity, and current server load. If an image fails to process, you will not be charged a credit.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">4. Download Availability</h2>
            <p>Processed images are available for download for 24 hours. After this period, images are permanently deleted from our servers for your privacy and security.</p>

            <h2 className="text-xl font-semibold text-foreground mt-8">5. Technical Support</h2>
            <p>If you experience any issues with the delivery of your processed images or credits, please contact us at support@snapcutai.com. We aim to respond to all delivery-related inquiries within 24 hours.</p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
