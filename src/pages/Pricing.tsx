import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useCashfree } from "@/hooks/use-cashfree";

const plans = [
  {
    name: "Free",
    planId: "free",
    price: 0,
    priceLabel: "₹0",
    period: "forever",
    description: "Perfect for trying out",
    features: ["5 images per day", "Standard quality", "720p max resolution", "Community support"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    planId: "pro",
    price: 499,
    priceLabel: "₹499",
    period: "/month",
    description: "For professionals & teams",
    features: ["Unlimited images", "HD quality output", "5000x5000 resolution", "Priority processing", "API access", "Priority support"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Credits",
    planId: "credits",
    price: 199,
    priceLabel: "₹199",
    period: "/50 credits",
    description: "Pay as you go",
    features: ["50 image credits", "HD quality output", "5000x5000 resolution", "No expiry", "API access"],
    cta: "Buy Credits",
    popular: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function PricingPage() {
  const { triggerPayment } = useCashfree();
  const session = localStorage.getItem("snapcut_user_session");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 gradient-text"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
          >
            Choose the plan that's right for you. Whether you're an individual creator or a growing team, we have you covered.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className={`rounded-2xl p-8 transition-all duration-300 flex flex-col ${
                plan.popular
                  ? "glass-card border-2 border-primary/50 glow-primary relative scale-105 z-10"
                  : "glass-card neon-border"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold gradient-btn text-primary-foreground shadow-lg">
                  MOST POPULAR
                </span>
              )}
              <div className="mb-8">
                <h3 className="font-bold text-2xl text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-foreground">{plan.priceLabel}</span>
                  <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.price === 0 ? (
                <Button
                  variant="glass"
                  className="w-full py-6 text-base font-bold shadow-lg"
                  asChild
                >
                  <Link to={session ? "/dashboard" : "/register"}>{plan.cta}</Link>
                </Button>
              ) : (
                <Button
                  variant={plan.popular ? "hero" : "glass"}
                  className="w-full py-6 text-base font-bold shadow-lg"
                  onClick={() => triggerPayment(plan.planId)}
                >
                  {plan.cta}
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-16 gradient-text">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-card rounded-xl p-6 neon-border">
              <h3 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">Yes, you can cancel your subscription at any time from your dashboard. You will keep access until the end of your billing period.</p>
            </div>
            <div className="glass-card rounded-xl p-6 neon-border">
              <h3 className="font-semibold text-foreground mb-2">Are payments secure?</h3>
              <p className="text-sm text-muted-foreground">Absolutely. We use Cashfree for all transactions, ensuring your payment data is processed with industry-standard encryption.</p>
            </div>
            <div className="glass-card rounded-xl p-6 neon-border">
              <h3 className="font-semibold text-foreground mb-2">What happens to my unused credits?</h3>
              <p className="text-sm text-muted-foreground">Credits purchased through the "Credits" plan never expire. Use them whenever you need!</p>
            </div>
            <div className="glass-card rounded-xl p-6 neon-border">
              <h3 className="font-semibold text-foreground mb-2">What file formats are supported?</h3>
              <p className="text-sm text-muted-foreground">We support JPG, PNG, and WEBP formats up to 10MB and 5000x5000 resolution.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
