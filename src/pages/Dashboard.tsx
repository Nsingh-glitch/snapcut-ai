import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import snapcutLogo from "@/assets/snapcut-logo.png";
import {
  Upload, Download, Image, CreditCard, Settings, LogOut,
  LayoutDashboard, History, Key, Zap, ChevronDown, Menu, X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Upload, label: "Upload", id: "upload" },
  { icon: History, label: "History", id: "history" },
  { icon: CreditCard, label: "Billing", id: "billing" },
  { icon: Key, label: "API Keys", id: "api-keys" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface HistoryItem {
  id: string;
  originalName: string;
  processedUrl: string;
  timestamp: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("snapcut_history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("snapcut_history", JSON.stringify(history));
  }, [history]);

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) return "Invalid format. Use JPG, PNG, or WEBP.";
    if (file.size > 10 * 1024 * 1024) return "File too large. Max 10MB.";
    return null;
  };

  const simulateProcessing = async (file: File) => {
    setProcessing(true);
    setResultReady(false);
    setProcessedImageUrl(null);

    try {
      const response = await fetch("https://random8171.app.n8n.cloud/webhook/remove-bg", {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to remove background. Please try again.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server did not return a valid JSON response.");
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Server returned an empty response.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("JSON parse error:", e, "Raw text:", text);
        throw new Error("Failed to parse server response.");
      }
      
      // Handle both { URL: "..." } and [{ URL: "..." }] formats
      const result = Array.isArray(data) ? data[0] : data;
      
      if (result && result.URL) {
        setProcessedImageUrl(result.URL);
        setResultReady(true);
        
        // Save to history
        const newHistoryItem: HistoryItem = {
          id: crypto.randomUUID(),
          originalName: file.name,
          processedUrl: result.URL,
          timestamp: Date.now(),
        };
        setHistory(prev => [newHistoryItem, ...prev]);
        
        toast.success("Background removed successfully!");
      } else {
        console.error("Missing URL in response:", result);
        throw new Error("Invalid response format: Missing image URL.");
      }
    } catch (error) {
      console.error("Processing error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process image.");
      setUploadedFile(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    
    // Revoke old URL if it exists
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    
    setUploadedFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    simulateProcessing(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== "upload" || uploadedFile) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab, uploadedFile]);

  const resetUpload = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    // Only revoke if it's a blob URL
    if (processedImageUrl && processedImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(processedImageUrl);
    }
    setUploadedFile(null);
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setProcessing(false);
    setResultReady(false);
  };

  const handleDownload = async (url?: string, fileName?: string) => {
    const downloadUrl = url || processedImageUrl;
    const name = fileName || (uploadedFile ? uploadedFile.name : "image");

    if (!downloadUrl) return;
    
    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `snapcut-${name.split(".")[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(blobUrl);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      window.open(downloadUrl, "_blank");
      toast.error("Failed to download automatically. Image opened in new tab.");
    }
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast.success("Item removed from history");
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
                    <p className="text-xs text-muted-foreground mb-1">JPG, PNG, WEBP · Max 10MB · Max 5000×5000</p>
                    <p className="text-[10px] text-primary/70 font-medium">Tip: You can also paste an image directly (Ctrl+V)</p>
                    <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileInputChange} />
                  </label>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 neon-border">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Original</h4>
                      <div className="rounded-xl overflow-hidden bg-muted/20 aspect-square flex items-center justify-center">
                        {originalImageUrl && (
                          <img
                            src={originalImageUrl}
                            alt="Original"
                            className="max-w-full max-h-full object-contain"
                          />
                        )}
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
                        className="rounded-xl overflow-hidden aspect-square flex items-center justify-center relative"
                        style={{
                          backgroundImage: "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
                        }}
                      >
                        {processing ? (
                          <div className="text-center z-10 bg-background/40 backdrop-blur-sm inset-0 absolute flex flex-col items-center justify-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3" />
                            <p className="text-sm text-muted-foreground">Processing...</p>
                          </div>
                        ) : resultReady && processedImageUrl ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full h-full flex items-center justify-center"
                          >
                            <img
                              src={processedImageUrl}
                              alt="Result"
                              className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                            <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg">
                              READY
                            </div>
                          </motion.div>
                        ) : (
                           <div className="text-center">
                            <Image className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-xs text-muted-foreground/50">Output will appear here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 justify-center">
                    {resultReady && (
                      <Button variant="hero" className="gap-2" onClick={handleDownload}>
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

          {activeTab === "history" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Removal History</h3>
                <Button 
                  variant="glass" 
                  size="sm" 
                  onClick={() => { setHistory([]); toast.success("History cleared"); }}
                  disabled={history.length === 0}
                >
                  Clear All
                </Button>
              </div>

              {history.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center neon-border">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No history yet. Start by removing a background!</p>
                  <Button variant="hero" className="mt-4" onClick={() => setActiveTab("upload")}>
                    Upload Image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card rounded-2xl overflow-hidden neon-border group flex flex-col"
                    >
                      <div className="aspect-square relative bg-muted/20 flex items-center justify-center overflow-hidden">
                        <div 
                          className="absolute inset-0 opacity-50"
                          style={{
                            backgroundImage: "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 10px 10px",
                          }}
                        />
                        <img 
                          src={item.processedUrl} 
                          alt={item.originalName} 
                          className="relative z-10 max-w-[90%] max-h-[90%] object-contain transition-transform group-hover:scale-110 duration-300"
                        />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 backdrop-blur-sm">
                          <Button size="icon" variant="hero" onClick={() => handleDownload(item.processedUrl, item.originalName)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="glass" className="text-destructive hover:text-destructive" onClick={() => deleteHistoryItem(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 border-t border-border">
                        <p className="text-sm font-medium text-foreground truncate" title={item.originalName}>
                          {item.originalName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(item.timestamp).toLocaleDateString()} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {!["upload", "dashboard", "history"].includes(activeTab) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-12 neon-border text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2 capitalize">{activeTab.replace("-", " ")}</h3>
              <p className="text-muted-foreground">This section will be available once backend is connected.</p>
            </motion.div>
          )}</div>
      </main>
    </div>
  );
}
