import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import snapcutLogo from "@/assets/snapcut-logo.png";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col lg:grid lg:grid-cols-2 overflow-hidden relative selection:bg-blue-500/30 text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full z-0" />

      {/* Left Column: Authentication Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <div className="text-center mb-8 lg:text-left">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 transition-colors">
                <img src={snapcutLogo} alt="SnapCut AI" className="h-8 w-8" />
              </div>
              <span className="text-xl font-bold gradient-text">SnapCut AI</span>
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-slate-400 mt-2">Sign in to your account to continue</p>
          </div>

          <div className="glass-card bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            {/* Subtle glow border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl z-[-1] blur-[1px] opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <Button variant="glass" className="w-full mb-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all py-6 text-white" type="button" onClick={handleGoogleSignIn} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0f172a] px-2 text-slate-500">or email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-10 bg-white/5 border-white/10 text-white focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-white/5 border-white/10 text-white focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button variant="hero" className="w-full py-6 font-semibold shadow-lg shadow-blue-500/20 text-white" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Sign in to account"}
              </Button>
            </form>
          </div>

          <p className="text-center lg:text-left text-sm text-slate-400 mt-6">
            New to SnapCut?{" "}
            <Link to="/register" className="text-blue-400 font-medium hover:text-blue-300 transition-colors underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Column: Marketing Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10 border-l border-white/5">
        <div className="text-center space-y-10">
          <div className="relative inline-block">
            {/* Logo glow background */}
            <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
            <div className="logo-float">
              <img 
                src={snapcutLogo} 
                alt="SnapCut AI" 
                className="h-32 w-32 mx-auto relative z-10 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]" 
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Remove Backgrounds <br /> 
              Like <span className="text-blue-500">Magic</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-md mx-auto leading-relaxed">
              Join thousands of creators using AI-powered background removal for their projects.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-8">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-blue-400 font-bold text-xl mb-1">99%</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-purple-400 font-bold text-xl mb-1">&lt; 3s</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Processing</div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .logo-float {
          animation: float 4s ease-in-out infinite;
        }
      `}} />
    </div>
  );
}
