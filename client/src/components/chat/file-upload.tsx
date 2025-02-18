import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type Domain } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";

interface FileUploadProps {
  domain: Domain;
  isAdmin?: boolean;
}

export default function FileUpload({ domain, isAdmin = false }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const base64Content = content.includes('base64,') 
          ? content.split('base64,')[1] 
          : Buffer.from(content).toString('base64');

        await apiRequest("POST", "/api/files", {
          name: file.name,
          content: base64Content,
          fileType: file.type,
          domain,
          size: file.size,
          createdAt: Date.now(),
          isAdminOnly: isAdmin && isAdminOnly,
        });

        queryClient.invalidateQueries({ queryKey: [`/api/files/${domain}`] });

        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        // Reset the input
        event.target.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="file-upload"
          accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.avif"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Upload File"}
        </label>
        <p className="text-sm text-muted-foreground">
          Max file size: 5MB
        </p>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2">
          <Switch
            checked={isAdminOnly}
            onCheckedChange={setIsAdminOnly}
            id="admin-only"
          />
          <label
            htmlFor="admin-only"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Internal knowledge base only
            </div>
          </label>
        </div>
      )}
    </div>
  );
}