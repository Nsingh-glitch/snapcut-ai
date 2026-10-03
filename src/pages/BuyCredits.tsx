import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCashfree } from "@/hooks/use-cashfree";
import { supabase } from "@/lib/supabase";

const packages = [
  { name: "Starter", planId: "starter", price: "₹49", credits: 10, description: "A quick boost for occasional edits." },
  { name: "Standard", planId: "standard", price: "₹99", credits: 25, description: "For a steady stream of product images." },
  { name: "Pro", planId: "credit-pro", price: "₹199", credits: 60, description: "Best value for frequent background removal." },
];

export default function BuyCreditsPage() {
  const navigate = useNavigate();
  const { triggerPayment } = useCashfree();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      setCheckingSession(false);
    });
  }, [navigate]);

  if (checkingSession) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" /> Sample credit packs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Buy Credits</h1>
          <p className="text-muted-foreground text-lg">
            Demo packages for testing the Cashfree sandbox checkout. One credit processes one image.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {packages.map((item, index) => (
            <motion.div
              key={item.planId}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="glass-card rounded-2xl p-6 neon-border flex flex-col"
            >
              <h2 className="text-xl font-semibold text-foreground">{item.name}</h2>
              <p className="text-sm text-muted-foreground mt-2 min-h-10">{item.description}</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-foreground">{item.price}</span>
                <p className="text-primary font-medium mt-2">+{item.credits} credits</p>
              </div>
              <div className="space-y-2 mb-8 text-sm text-muted-foreground flex-1">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> No expiry in demo mode</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Verified server-side</p>
              </div>
              <Button variant={index === 2 ? "hero" : "glass"} className="w-full" onClick={() => triggerPayment(item.planId)}>
                Buy {item.name}
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          <Link to="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
