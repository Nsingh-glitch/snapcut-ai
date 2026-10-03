import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, Zap, Shield, Code, Star, ArrowRight, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Remove backgrounds in under 5 seconds with cutting-edge AI processing.",
  },
  {
    icon: Star,
    title: "Pixel Perfect",
    description: "High-quality results that preserve fine details like hair and edges.",
  },
  {
    icon: Upload,
    title: "Bulk Processing",
    description: "Upload and process multiple images at once. Perfect for e-commerce.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Images auto-delete after 24 hours. Your data stays private.",
  },
  {
    icon: Code,
    title: "Developer API",
    description: "Integrate background removal into your apps with our REST API.",
  },
  {
    icon: ArrowRight,
    title: "Multiple Formats",
    description: "Support for JPG, PNG, and WEBP up to 10MB and 5000x5000px.",
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for trying out",
    features: ["5 images per day", "Standard quality", "720p max resolution", "Community support"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "For professionals & teams",
    features: ["Unlimited images", "HD quality output", "5000x5000 resolution", "Priority processing", "API access", "Priority support"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Credits",
    price: "₹199",
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

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(Boolean(session)));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(200,98%,53%,0.08)_0%,_transparent_70%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border neon-border text-primary mb-6">
              ✨ AI-Powered Background Removal
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Remove Backgrounds
              <br />
              <span className="gradient-text">In Seconds</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload your image. Get a clean, transparent background instantly.
              No design skills needed. Powered by advanced AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button variant="hero" size="lg" className="text-base px-9 py-6 gap-2 shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/40 focus-visible:ring-2 focus-visible:ring-primary/70" asChild>
                <Link to="/dashboard">
                  <Upload className="h-5 w-5" />
                  Remove Background Free
                </Link>
              </Button>
              <Button variant="glass" size="lg" className="text-base px-8 py-6" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">5 free images daily · No credit card required</p>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative max-w-4xl mx-auto text-left"
          >
            <div className="glass-card rounded-2xl p-5 md:p-7 neon-border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Live comparison</p>
                  <h2 className="mt-1 text-xl md:text-2xl font-semibold text-foreground">See the difference</h2>
                </div>
                <p className="hidden text-xs text-muted-foreground sm:block">Drag the divider to compare</p>
              </div>
              <BeforeAfterSlider originalImage="/sample-before.svg" processedImage="/sample-after.svg" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">SnapCut AI</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Professional-grade background removal powered by the latest AI models.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="glass-card rounded-2xl p-6 neon-border transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center mb-4 group-hover:glow-primary transition-shadow">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start free, upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`rounded-2xl p-6 transition-all duration-300 ${
                  plan.popular
                    ? "glass-card border-2 border-primary/50 glow-primary relative"
                    : "glass-card neon-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium gradient-btn text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="font-semibold text-lg text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "hero" : "glass"}
                  className="w-full"
                  asChild
                >
                  <Link to="/pricing">{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="glass-card rounded-2xl p-12 text-center neon-border max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="gradient-text">Get Started?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of creators and businesses using SnapCut AI to remove backgrounds instantly.
            </p>
            <Button variant="hero" size="lg" className="text-base px-8 py-6" asChild>
              <Link to={isLoggedIn ? "/dashboard" : "/register"}>
                {isLoggedIn ? "Go to Dashboard" : "Create Free Account"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
