import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface AvatarUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
  userId: string;
}

export function AvatarUploadDialog({ isOpen, onClose, onUploadComplete, userId }: AvatarUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      onUploadComplete(publicUrl);
      toast.success("Profile picture updated!");
      onClose();
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background neon-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Update Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div 
          className={`mt-4 border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 ${
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="relative w-32 h-32">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-full border-2 border-primary" />
              <button 
                onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag and drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP (Max 2MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                id="avatar-input"
                accept="image/*"
                onChange={handleChange}
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="avatar-input" className="cursor-pointer">Choose File</label>
              </Button>
            </>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button 
            variant="hero" 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="min-w-[100px]"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Upload"}
            Save Picture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
