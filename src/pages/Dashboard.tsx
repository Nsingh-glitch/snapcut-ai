import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import snapcutLogo from "@/assets/snapcut-logo.png";
import {
  Upload, Download, Image, CreditCard, Settings, LogOut,
  LayoutDashboard, History, Key, Zap, ChevronDown, Menu, X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Upload, label: "Upload", id: "upload" },
  { icon: History, label: "History", id: "history" },
  { icon: CreditCard, label: "Billing", id: "billing" },
  { icon: Key, label: "API Keys", id: "api-keys" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultReady, setResultReady] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) return "Invalid format. Use JPG, PNG, or WEBP.";
    if (file.size > 10 * 1024 * 1024) return "File too large. Max 10MB.";
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const error = validateFile(file);
      if (error) return alert(error);
      setUploadedFile(file);
      simulateProcessing();
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) return alert(error);
      setUploadedFile(file);
      simulateProcessing();
    }
  };

  const simulateProcessing = () => {
    setProcessing(true);
    setResultReady(false);
    setTimeout(() => {
      setProcessing(false);
      setResultReady(true);
    }, 3000);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setProcessing(false);
    setResultReady(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <img src={snapcutLogo} alt="SnapCut AI" className="h-8 w-8" />
          <span className="font-bold gradient-text">SnapCut AI</span>
        </div>
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <div className="glass-card rounded-lg p-3 mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Daily Credits</span>
              <span className="text-primary font-medium">3/5</span>
            </div>
            <Progress value={60} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">
              <Link to="/#pricing" className="text-primary hover:underline">Upgrade for unlimited</Link>
            </p>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="font-semibold text-foreground capitalize">{activeTab.replace("-", " ")}</h2>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center text-xs font-bold text-primary-foreground">
              U
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {activeTab === "upload" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              {!uploadedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`glass-card rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                    dragActive ? "border-primary glow-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <label className="flex flex-col items-center justify-center py-20 cursor-pointer">
                    <div className="w-20 h-20 rounded-2xl gradient-btn flex items-center justify-center mb-6 glow-primary">
                      <Upload className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Drop your image here</h3>
                    <p className="text-muted-foreground text-sm mb-4">or click to browse</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · Max 10MB · Max 5000×5000</p>
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileSelect} />
                  </label>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 neon-border">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Original</h4>
                      <div className="rounded-xl overflow-hidden bg-muted/20 aspect-square flex items-center justify-center">
                        <img
                          src={URL.createObjectURL(uploadedFile)}
                          alt="Original"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      {processing ? (
                        <div className="w-12 h-12 rounded-full gradient-btn flex items-center justify-center animate-pulse">
                          <Zap className="h-5 w-5 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full gradient-btn flex items-center justify-center glow-primary">
                          <Zap className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Result</h4>
                      <div
                        className="rounded-xl overflow-hidden aspect-square flex items-center justify-center"
                        style={{
                          backgroundImage: resultReady
                            ? "none"
                            : "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
                        }}
                      >
                        {processing ? (
                          <div className="text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">Processing...</p>
                          </div>
                        ) : resultReady ? (
                          <div className="text-center">
                            <Image className="h-16 w-16 text-primary mx-auto mb-3" />
                            <p className="text-sm text-primary font-medium">Background Removed!</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 justify-center">
                    {resultReady && (
                      <Button variant="hero" className="gap-2">
                        <Download className="h-4 w-4" /> Download HD
                      </Button>
                    )}
                    <Button variant="glass" onClick={resetUpload}>
                      Upload Another
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Images Processed", value: "127", icon: Image, change: "+12 today" },
                  { label: "Credits Remaining", value: "3", icon: Zap, change: "Resets daily" },
                  { label: "Plan", value: "Free", icon: CreditCard, change: "Upgrade →" },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card rounded-2xl p-5 neon-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                        <p className="text-xs text-primary mt-1">{stat.change}</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-6 neon-border">
                <h3 className="font-semibold text-foreground mb-4">Recent Uploads</h3>
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No uploads yet. Start by removing a background!</p>
                  <Button variant="hero" className="mt-4" onClick={() => setActiveTab("upload")}>
                    Upload Image
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {!["upload", "dashboard"].includes(activeTab) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-12 neon-border text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2 capitalize">{activeTab.replace("-", " ")}</h3>
              <p className="text-muted-foreground">This section will be available once backend is connected.</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
