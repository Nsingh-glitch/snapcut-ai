import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Code, Copy, Check } from "lucide-react";
import { useState } from "react";

const endpoints = [
  {
    method: "POST",
    path: "/api/remove-bg",
    description: "Remove the background from one JPG, PNG, or WEBP image. Maximum file size: 10MB.",
    example: `curl -X POST https://YOUR_SNAPCUT_HOST/api/remove-bg \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -F "image=@photo.jpg"`,
  },
  {
    method: "POST",
    path: "/api/create-order",
    description: "Create an authenticated Cashfree sandbox credit order.",
    example: `curl -X POST https://YOUR_SNAPCUT_HOST/api/create-order \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"planId":"starter"}'`,
  },
  {
    method: "GET",
    path: "/api/payment-status?order_id=ORDER_ID",
    description: "Verify the authenticated user's Cashfree order status.",
    example: `curl "https://YOUR_SNAPCUT_HOST/api/payment-status?order_id=ORDER_ID" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`,
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
              These routes require the authenticated Supabase access token from the current user session:
            </p>
            <CodeBlock code='Authorization: Bearer YOUR_ACCESS_TOKEN' />
            <p className="text-sm text-muted-foreground mt-4">
              The server verifies this token before processing requests. Never expose service-role credentials,
              remove.bg keys, Cashfree secrets, or private environment variables in browser code.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              A dedicated developer API-key system is not currently implemented. It can be added later without
              changing this authenticated session flow.
            </p>
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
                {ep.path === "/api/remove-bg" && (
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Request:</strong> multipart/form-data with the image field named <code>image</code>.</p>
                    <p><strong className="text-foreground">Success:</strong> <code>{'{ success, originalUrl, processedUrl, creditsRemaining, imagesProcessed }'}</code></p>
                    <p><strong className="text-foreground">Common errors:</strong> 400 invalid file, 401 missing or invalid session, 403 insufficient credits, 413 file too large.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
