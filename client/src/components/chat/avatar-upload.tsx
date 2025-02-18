import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type Domain } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { domainConfig } from "@/lib/domains";

interface AvatarUploadProps {
  domain: Domain;
  isAdmin: boolean;
}

export default function AvatarUpload({ domain, isAdmin }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const config = domainConfig[domain];

  if (!isAdmin) {
    return null;
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await apiRequest("POST", `/api/domains/${domain}/avatar`, {
          avatar: content.split("base64,")[1],
          type: file.type,
        });

        queryClient.invalidateQueries({ queryKey: ['/api/domains'] });
        queryClient.invalidateQueries({ queryKey: ['/api/avatars'] });

        toast({
          title: "Success",
          description: `Avatar updated for ${config.title}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update avatar",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        event.target.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Avatar Settings - {config.title}</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700">
            <img
              src={config.avatar}
              alt={`${config.title} Avatar`}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-4">
              Upload a new avatar image for the {config.title.toLowerCase()} assistant.
              The image should be clear and professional.
            </p>

            <div className="flex items-center gap-4">
              <Input
                type="file"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="hidden"
                id={`avatar-upload-${domain}`}
                accept="image/*"
              />
              <label
                htmlFor={`avatar-upload-${domain}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Change Avatar"}
              </label>
              <p className="text-sm text-muted-foreground">
                Max file size: 2MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}