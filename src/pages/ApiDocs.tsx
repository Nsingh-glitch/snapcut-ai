import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Code, Copy, Check } from "lucide-react";
import { useState } from "react";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/remove-bg",
    description: "Remove background from an image",
    example: `curl -X POST https://api.snapcutai.com/v1/remove-bg \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg"`,
  },
  {
    method: "GET",
    path: "/api/v1/usage",
    description: "Get your API usage statistics",
    example: `curl https://api.snapcutai.com/v1/usage \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
  {
    method: "GET",
    path: "/api/v1/credits",
    description: "Check remaining credits",
    example: `curl https://api.snapcutai.com/v1/credits \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-background/50 rounded-lg p-4 mt-3">
      <button onClick={copy} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </button>
      <pre className="text-sm text-muted-foreground overflow-x-auto"><code>{code}</code></pre>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-28 pb-20 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">API</span> Documentation
          </h1>
          <p className="text-muted-foreground mb-8">
            Integrate SnapCut AI background removal into your applications.
          </p>

          <div className="glass-card rounded-2xl p-6 neon-border mb-8">
            <h2 className="font-semibold text-foreground mb-2">Authentication</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Include your API key in the Authorization header:
            </p>
            <CodeBlock code='Authorization: Bearer YOUR_API_KEY' />
          </div>

          <div className="space-y-6">
            {endpoints.map((ep) => (
              <div key={ep.path} className="glass-card rounded-2xl p-6 neon-border">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    ep.method === "POST" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                  }`}>
                    {ep.method}
                  </span>
                  <code className="text-sm text-foreground font-mono">{ep.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{ep.description}</p>
                <CodeBlock code={ep.example} />
              </div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-6 neon-border mt-8">
            <h2 className="font-semibold text-foreground mb-2">Rate Limits</h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Free: 5 requests/day</p>
              <p>• Pro: 1000 requests/minute</p>
              <p>• Credit Pack: Based on purchased credits</p>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
