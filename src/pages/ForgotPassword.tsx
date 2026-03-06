import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import snapcutLogo from "@/assets/snapcut-logo.png";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(200,98%,53%,0.06)_0%,_transparent_50%)]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={snapcutLogo} alt="SnapCut AI" className="h-10 w-10" />
            <span className="text-xl font-bold gradient-text">SnapCut AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send you a reset link</p>
        </div>

        <div className="glass-card rounded-2xl p-6 neon-border">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full gradient-btn flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Check your email</h3>
              <p className="text-sm text-muted-foreground">We sent a password reset link to <strong className="text-foreground">{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" className="pl-10 bg-muted/30 border-border" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <Button variant="hero" className="w-full" type="submit">Send Reset Link</Button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
