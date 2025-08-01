import { useState, useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  onFileSelect: (file: File | null) => void;
  existingPhotoUrl?: string | null;
  onDeletePhoto?: () => void;
}

export default function PhotoUpload({ onFileSelect, existingPhotoUrl, onDeletePhoto }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [showExisting, setShowExisting] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingPhotoUrl) {
      setShowExisting(true);
      setPreview(null);
    }
  }, [existingPhotoUrl]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setShowExisting(false);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    } else {
      setPreview(null);
      setShowExisting(!!existingPhotoUrl);
      onFileSelect(null);
    }
  };

  const handleDeleteExisting = () => {
    setShowExisting(false);
    setPreview(null);
    onDeletePhoto?.();
    onFileSelect(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">Target Photo</label>
      <div
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              <img src={preview} alt="New photo preview" className="mx-auto max-h-32 rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileChange(null);
                }}
              >
                <X size={12} />
              </Button>
            </div>
            <p className="text-sm text-slate-600">Click to change image</p>
          </div>
        ) : showExisting && existingPhotoUrl ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              <img src={existingPhotoUrl} alt="Current photo" className="mx-auto max-h-32 rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteExisting();
                }}
              >
                <X size={12} />
              </Button>
            </div>
            <p className="text-sm text-slate-600">Click to replace image</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="mx-auto text-slate-400" size={48} />
            <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}