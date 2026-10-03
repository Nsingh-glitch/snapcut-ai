import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import snapcutLogo from "@/assets/snapcut-logo.png";
import {
  Upload, Download, Image, CreditCard, Settings, LogOut,
  LayoutDashboard, History, Key, Zap, ChevronDown, Menu, X, Heart, User, Trash2, Camera, Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";
import { TransparencyBackground } from "@/components/TransparencyBackground";

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
  isFavorite?: boolean;
}

interface ProfileStats {
  creditsRemaining: number;
  imagesProcessed: number;
  plan: string;
}

type BulkStatus = "waiting" | "processing" | "completed" | "failed";

interface BulkItem {
  id: string;
  fileKey: string;
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  status: BulkStatus;
  error?: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    creditsRemaining: 0,
    imagesProcessed: 0,
    plan: "Free",
  });
  const [user, setUser] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    photoUrl: ""
  });
  const activeUserIdRef = useRef<string | null>(null);
  
  const navigate = useNavigate();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const resetWorkspace = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    bulkItems.forEach(item => URL.revokeObjectURL(item.originalUrl));
    setUploadedFile(null);
    setOriginalImageUrl(null);
    setOriginalAspectRatio(null);
    setProcessedImageUrl(null);
    setProcessing(false);
    setResultReady(false);
    setBulkItems([]);
    setBulkProcessing(false);
  };

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("credits_remaining, images_processed, plan")
        .eq("id", userId)
        .single();
      if (!error && data) {
        if (activeUserIdRef.current !== userId) return;
        setProfileStats({
          creditsRemaining: data.credits_remaining,
          imagesProcessed: data.images_processed,
          plan: data.plan,
        });
      }
    };

    const applySession = (session: { user: any } | null) => {
      if (!session) {
        activeUserIdRef.current = null;
        resetWorkspace();
        setHistory([]);
        setShowFavorites(false);
        setUser(null);
        setProfileStats({ creditsRemaining: 0, imagesProcessed: 0, plan: "Free" });
        navigate("/login");
        return;
      }
      const userChanged = activeUserIdRef.current !== session.user.id;
      activeUserIdRef.current = session.user.id;
      if (userChanged) {
        resetWorkspace();
        setShowFavorites(false);
        const saved = localStorage.getItem(`snapcut_history_${session.user.id}`);
        setHistory(saved ? JSON.parse(saved) : []);
      }
      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
        photoUrl: session.user.user_metadata?.avatar_url || ""
      };
      setUser(userData);
      setProfileData({
        name: userData.name,
        email: userData.email || "",
        photoUrl: userData.photoUrl
      });
      void loadProfile(session.user.id);
    };

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (activeUserIdRef.current) {
      localStorage.setItem(`snapcut_history_${activeUserIdRef.current}`, JSON.stringify(history));
    }
  }, [history]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: profileData.name,
          avatar_url: profileData.photoUrl
        }
      });
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        // Supabase doesn't allow users to delete themselves directly for security reasons
        // via the client SDK without a specific Edge Function or Admin API.
        // For now, we will sign them out and inform them.
        toast.info("Account deletion request submitted. Please contact support to finalize.");
        await handleSignOut();
      } catch (error: any) {
        toast.error("Failed to process request");
      }
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/login");
    }
  };

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
    const item = history.find(i => i.id === id);
    toast.success(item?.isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleAvatarUploadComplete = async (url: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      });
      if (error) throw error;
      setProfileData(prev => ({ ...prev, photoUrl: url }));
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile photo");
      throw error;
    }
  };

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
      const formData = new FormData();
      formData.append("image", file);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Please sign in to process images.");

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        body: formData,
      });

      const data = await response.json();
      if (activeUserIdRef.current !== sessionData.session.user.id) return;

      if (response.ok && data.success && data.processedUrl) {
        setProcessedImageUrl(data.processedUrl);
        setResultReady(true);
        setProfileStats(prev => ({
          ...prev,
          creditsRemaining: data.creditsRemaining,
          imagesProcessed: data.imagesProcessed,
        }));
        
        // Save to history
        const newHistoryItem: HistoryItem = {
          id: crypto.randomUUID(),
          originalName: file.name,
          processedUrl: data.processedUrl,
          timestamp: Date.now(),
        };
        setHistory(prev => [newHistoryItem, ...prev]);
        
        toast.success("Background removed successfully!");
      } else {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("Detailed Processing Error:", error);
      
      let errorMessage = "Failed to process image.";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage === "Failed to fetch") {
          errorMessage = "Network error: Connection to background removal server failed. This could be due to CORS or a network block.";
        }
      }
      
      toast.error(errorMessage);
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
    
    const imageUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => setOriginalAspectRatio(image.naturalWidth / image.naturalHeight);
    image.src = imageUrl;
    setUploadedFile(file);
    setOriginalImageUrl(imageUrl);
    simulateProcessing(file);
  };

  const updateBulkItem = (id: string, update: Partial<BulkItem>) => {
    setBulkItems(prev => prev.map(item => item.id === id ? { ...item, ...update } : item));
  };

  const getFileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

  const processBulkItems = async (items: BulkItem[]) => {
    if (bulkProcessing) return;
    setBulkProcessing(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("Please sign in to process images.");
      setBulkProcessing(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", sessionData.session.user.id)
      .single();
    if (profileError || !profile) {
      toast.error("Unable to read your current credit balance.");
      setBulkProcessing(false);
      return;
    }

    const availableCredits = Math.max(0, profile.credits_remaining);
    const processableItems = items.slice(0, availableCredits);
    const skippedItems = items.slice(availableCredits);
    skippedItems.forEach(item => updateBulkItem(item.id, {
      status: "failed",
      error: "Insufficient credits. Buy more credits to process this image.",
    }));
    if (skippedItems.length > 0) {
      toast.error("Some images were not started because you do not have enough credits.");
    }
    if (processableItems.length === 0) {
      setBulkProcessing(false);
      return;
    }

    let nextIndex = 0;
    let shouldStop = false;
    const processNext = async () => {
      while (!shouldStop) {
        const index = nextIndex++;
        if (index >= processableItems.length) return;
        const item = processableItems[index];
        updateBulkItem(item.id, { status: "processing", error: undefined });

        try {
          const formData = new FormData();
          formData.append("image", item.file);
          const response = await fetch("/api/remove-bg", {
            method: "POST",
            headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
            body: formData,
          });
          const data = await response.json();
          if (activeUserIdRef.current !== sessionData.session.user.id) return;
          if (!response.ok || !data.success || !data.processedUrl) {
            const message = data.error || `Server error: ${response.status}`;
            updateBulkItem(item.id, { status: "failed", error: message });
            if (data.code === "INSUFFICIENT_CREDITS") {
              shouldStop = true;
              toast.error("Not enough credits to process the remaining images.");
            }
            continue;
          }

          updateBulkItem(item.id, { status: "completed", processedUrl: data.processedUrl });
          setProfileStats(prev => ({
            ...prev,
            creditsRemaining: Math.max(0, data.creditsRemaining),
            imagesProcessed: data.imagesProcessed,
          }));
          setHistory(prev => [{
            id: crypto.randomUUID(),
            originalName: item.file.name,
            processedUrl: data.processedUrl,
            timestamp: Date.now(),
          }, ...prev]);
        } catch (error) {
          if (activeUserIdRef.current !== sessionData.session.user.id) return;
          updateBulkItem(item.id, {
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to process image.",
          });
        }
      }
    };

    await Promise.all([processNext(), processNext()]);
    setBulkProcessing(false);
  };

  const handleBulkFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const error = validateFile(file);
      if (error) toast.error(`${file.name}: ${error}`);
      return !error;
    });
    const existingKeys = new Set(bulkItems.map(item => item.fileKey));
    const uniqueFiles = validFiles.filter(file => {
      const fileKey = getFileKey(file);
      if (existingKeys.has(fileKey)) {
        toast.info(`${file.name} is already in the queue.`);
        return false;
      }
      existingKeys.add(fileKey);
      return true;
    });
    if (uniqueFiles.length === 0) return;

    const items = uniqueFiles.map(file => ({
      id: crypto.randomUUID(),
      fileKey: getFileKey(file),
      file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      status: "waiting" as BulkStatus,
    }));
    setUploadedFile(null);
    setOriginalImageUrl(null);
    setOriginalAspectRatio(null);
    setProcessedImageUrl(null);
    setResultReady(false);
    setBulkItems(prev => [...prev, ...items]);
    void processBulkItems(items);
  };

  const retryFailedItems = () => {
    if (bulkProcessing) return;
    const failedItems = bulkItems.filter(item => item.status === "failed");
    if (failedItems.length === 0) return;
    failedItems.forEach(item => updateBulkItem(item.id, { status: "waiting", error: undefined }));
    void processBulkItems(failedItems);
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) handleBulkFiles(files);
    else if (files[0]) handleFileSelect(files[0]);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 1) handleBulkFiles(files);
    else if (files[0]) handleFileSelect(files[0]);
    e.target.value = "";
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
    setOriginalAspectRatio(null);
    setProcessedImageUrl(null);
    setProcessing(false);
    setResultReady(false);
    bulkItems.forEach(item => URL.revokeObjectURL(item.originalUrl));
    setBulkItems([]);
    setBulkProcessing(false);
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

  const visibleHistory = showFavorites ? history.filter(item => item.isFavorite) : history;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <Link to="/" className="flex items-center gap-2 p-4 border-b border-border hover:opacity-80 transition-opacity">
          <img src={snapcutLogo} alt="SnapCut AI" className="h-8 w-8" />
          <span className="font-bold gradient-text">SnapCut AI</span>
        </Link>
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
              <span className="text-muted-foreground">Credits remaining</span>
              <span className="text-primary font-medium">{Math.max(0, profileStats.creditsRemaining)} credits</span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <p className="text-[10px] text-muted-foreground">
                <Link to="/buy-credits" className="text-primary hover:underline">Buy credits</Link>
              </p>
              <Button 
                variant="hero" 
                size="sm" 
                className="h-7 px-3 text-[10px]"
                onClick={() => navigate("/buy-credits")}
              >
                Top Up
              </Button>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
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
            <div className="w-8 h-8 rounded-full gradient-btn flex items-center justify-center text-xs font-bold text-primary-foreground uppercase">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {activeTab === "upload" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              {!uploadedFile && bulkItems.length === 0 ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`group glass-card rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 ${
                    dragActive ? "border-primary glow-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <label className="flex flex-col items-center justify-center py-20 px-5 cursor-pointer">
                    <div className="w-20 h-20 rounded-2xl gradient-btn flex items-center justify-center mb-6 glow-primary transition-transform duration-300 group-hover:scale-105">
                      <Upload className="h-10 w-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Drop images here</h3>
                    <p className="text-muted-foreground text-sm mb-4">or click to browse one or more files</p>
                    <p className="text-xs text-muted-foreground mb-1">JPG, PNG, WEBP · Max 10MB · Max 5000×5000</p>
                    <p className="text-[10px] text-primary/70 font-medium">Tip: You can also paste an image directly (Ctrl+V)</p>
                    <input type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileInputChange} />
                  </label>
                </div>
              ) : bulkItems.length > 0 ? (
                <div className="glass-card rounded-2xl p-5 md:p-6 neon-border">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Bulk removal</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {bulkItems.filter(item => item.status === "completed").length} / {bulkItems.length} completed
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="glass" size="sm" onClick={resetUpload} disabled={bulkProcessing}>Clear All</Button>
                      {bulkItems.some(item => item.status === "failed") && (
                        <Button variant="glass" size="sm" onClick={retryFailedItems} disabled={bulkProcessing}>Retry Failed</Button>
                      )}
                      <label className={`inline-flex items-center justify-center rounded-md border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors ${bulkProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/40"}`}>
                        <Upload className="h-4 w-4 mr-2" /> Upload More
                        <input type="file" multiple disabled={bulkProcessing} className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileInputChange} />
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bulkItems.map(item => (
                      <div key={item.id} className="rounded-xl border border-border bg-background/40 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                        <div className="grid grid-cols-2 gap-px bg-border aspect-[2/1]">
                          <div className="bg-muted/30 flex items-center justify-center overflow-hidden">
                            <img src={item.originalUrl} alt={item.file.name} className="h-full w-full object-contain p-2" />
                          </div>
                          <TransparencyBackground className="rounded-none">
                            {item.processedUrl ? (
                              <img src={item.processedUrl} alt={`${item.file.name} result`} className="h-full w-full object-contain p-2" />
                            ) : (
                              <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                {item.status === "processing" ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : "Output pending"}
                              </div>
                            )}
                          </TransparencyBackground>
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-medium text-foreground" title={item.file.name}>{item.file.name}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className={`text-xs font-medium ${item.status === "completed" ? "text-emerald-400" : item.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                              {item.status === "waiting" ? "Waiting" : item.status === "processing" ? "Processing" : item.status === "completed" ? "Completed" : "Failed"}
                            </span>
                            {item.processedUrl && <Button size="sm" variant="glass" onClick={() => handleDownload(item.processedUrl || undefined, item.file.name)}><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>}
                          </div>
                          {item.error && <p className="mt-2 text-xs text-destructive line-clamp-2">{item.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 neon-border">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Original</h4>
                      <div
                        className="relative w-full overflow-hidden rounded-xl bg-muted/20"
                        style={{ aspectRatio: originalAspectRatio || 1 }}
                      >
                        {originalImageUrl && (
                          <img
                            src={originalImageUrl}
                            alt="Original"
                            className="absolute inset-0 h-full w-full object-contain"
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
                        className="relative w-full overflow-hidden rounded-xl"
                        style={{ aspectRatio: originalAspectRatio || 1 }}
                      >
                        <TransparencyBackground className="absolute inset-0 rounded-none">
                        {processing ? (
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 text-center backdrop-blur-sm">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3" />
                            <p className="text-sm text-muted-foreground">Processing...</p>
                          </div>
                        ) : resultReady && processedImageUrl ? (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <img
                              src={processedImageUrl}
                              alt="Result"
                              className="absolute inset-0 h-full w-full object-contain"
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
                        </TransparencyBackground>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6 justify-center">
                    {resultReady && (
                      <Button variant="hero" className="gap-2" onClick={() => handleDownload()}>
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
                  { label: "Images Processed", value: String(profileStats.imagesProcessed), icon: Image, change: "All time" },
                  { label: "Credits Remaining", value: String(profileStats.creditsRemaining), icon: Zap, change: "Available now" },
                  { label: "Plan", value: profileStats.plan, icon: CreditCard, change: "View credits →" },
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
                <div className="flex items-center gap-2">
                <Button
                  variant={showFavorites ? "hero" : "glass"}
                  size="sm"
                  onClick={() => setShowFavorites(prev => !prev)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${showFavorites ? "fill-current" : ""}`} />
                  Favorites
                </Button>
                <Button 
                  variant="glass" 
                  size="sm" 
                  onClick={() => { setHistory([]); toast.success("History cleared"); }}
                  disabled={history.length === 0}
                >
                  Clear All
                </Button>
                </div>
              </div>

              {visibleHistory.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center neon-border">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">{showFavorites ? "No favorite images yet." : "No history yet. Start by removing a background!"}</p>
                  <Button variant="hero" className="mt-4" onClick={() => setActiveTab("upload")}>
                    Upload Image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleHistory.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card rounded-2xl overflow-hidden neon-border group flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
                    >
                      <TransparencyBackground className="aspect-square rounded-none flex items-center justify-center">
                        <img 
                          src={item.processedUrl} 
                          alt={item.originalName} 
                          className="relative z-10 max-w-[90%] max-h-[90%] object-contain transition-transform group-hover:scale-110 duration-300"
                        />
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20 backdrop-blur-sm">
                          <Button 
                            size="icon" 
                            variant="hero" 
                            title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            className={`${item.isFavorite ? "bg-red-500 hover:bg-red-600" : ""}`}
                            onClick={() => toggleFavorite(item.id)}
                          >
                            <Heart className={`h-4 w-4 ${item.isFavorite ? "fill-current" : ""}`} />
                          </Button>
                          <Button size="icon" variant="hero" title="Download image" aria-label="Download image" onClick={() => handleDownload(item.processedUrl, item.originalName)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="glass" title="Delete history item" aria-label="Delete history item" className="text-destructive hover:text-destructive" onClick={() => deleteHistoryItem(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TransparencyBackground>
                      <div className="p-4 border-t border-border flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate" title={item.originalName}>
                            {item.originalName}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(item.timestamp).toLocaleDateString()} · {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {item.isFavorite && (
                          <Heart className="h-4 w-4 text-red-500 fill-current flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="glass-card rounded-2xl p-6 md:p-8 neon-border">
                <h3 className="text-xl font-bold text-foreground mb-6">Profile Settings</h3>
                
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/20 group-hover:border-primary transition-colors">
                      {profileData.photoUrl ? (
                        <img src={profileData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => setIsAvatarDialogOpen(true)}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full gradient-btn flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera className="h-4 w-4 text-primary-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Click icon to update profile picture</p>
                </div>

                <AvatarUploadDialog 
                  isOpen={isAvatarDialogOpen}
                  onClose={() => setIsAvatarDialogOpen(false)}
                  onUploadComplete={handleAvatarUploadComplete}
                  userId={user?.id}
                />

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="settings-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="settings-name" 
                        value={profileData.name} 
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="pl-10 bg-muted/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="settings-email" 
                        value={profileData.email} 
                        disabled 
                        className="pl-10 bg-muted/10 opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Email changes require manual verification. Contact support.</p>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <Button variant="hero" type="submit" className="w-full" disabled={isUpdatingProfile}>
                      {isUpdatingProfile ? "Saving Changes..." : "Save Changes"}
                    </Button>
                    
                    <div className="border-t border-border mt-4 pt-6">
                      <h4 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h4>
                      <p className="text-xs text-muted-foreground mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                      <Button 
                        variant="glass" 
                        type="button" 
                        className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {!["upload", "dashboard", "history", "settings"].includes(activeTab) && (
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
