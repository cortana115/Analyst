import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Domain, type File, fileCategories } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, FileType, Loader2, Upload, Lock, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface KnowledgeBaseManagerProps {
  domain: Domain;
}

export default function KnowledgeBaseManager({ domain }: KnowledgeBaseManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: [`/api/files/${domain}`, true],
  });

  const knowledgeBaseFiles = files.filter(f => f.category === fileCategories.KNOWLEDGE_BASE);

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

        await apiRequest("POST", "/api/files", {
          name: file.name,
          content: content.split("base64,")[1] || content,
          fileType: file.type,
          domain,
          size: file.size,
          createdAt: Date.now(),
          isAdminOnly: true,
          category: fileCategories.KNOWLEDGE_BASE,
        });

        queryClient.invalidateQueries({ queryKey: [`/api/files/${domain}`] });

        toast({
          title: "Success",
          description: "Knowledge base file uploaded successfully",
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
    <Card className="bg-gray-900/50 border-gray-800">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Knowledge Base Files</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <Input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="kb-file-upload"
            accept=".txt,.pdf,.doc,.docx"
          />
          <label
            htmlFor="kb-file-upload"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Uploading..." : "Upload Knowledge Base File"}
          </label>
          <p className="text-sm text-muted-foreground">
            Max file size: 5MB
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : knowledgeBaseFiles.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground bg-muted/10">
            <p>No knowledge base files uploaded</p>
            <p className="text-sm mt-1">
              Upload files to enhance the AI's base knowledge
            </p>
          </Card>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {knowledgeBaseFiles.map((file) => (
                <Card key={file.id} className="p-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {file.fileType.startsWith("text/") ? (
                        <FileText className="h-5 w-5 text-primary" />
                      ) : (
                        <FileType className="h-5 w-5 text-primary" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{file.name}</p>
                          <Lock className="h-4 w-4 text-yellow-500" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{format(file.createdAt * 1000, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}
