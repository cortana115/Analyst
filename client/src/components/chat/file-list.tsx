import { useQuery } from "@tanstack/react-query";
import { type Domain, type File } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { FileText, FileType, Loader2, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface FileListProps {
  domain: Domain;
  isAdmin?: boolean;
}

export default function FileList({ domain, isAdmin = false }: FileListProps) {
  const { data: files = [], isLoading } = useQuery<File[]>({
    queryKey: [`/api/files/${domain}`, isAdmin],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground bg-muted/10">
        <p>No files uploaded yet</p>
        <p className="text-sm mt-1">
          {isAdmin 
            ? "Upload files to enhance the AI's knowledge base"
            : "Upload files to help the AI assistant provide better responses"}
        </p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[200px] pr-4">
      <div className="space-y-3">
        {files.map((file) => (
          <Card key={file.id} className="p-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-start gap-3">
              {file.fileType.startsWith("image/") ? (
                        <img 
                          src={`/api/files/${file.id}/content`} 
                          alt={file.name}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : file.fileType.startsWith("text/") ? (
                <FileText className="h-5 w-5 text-primary" />
              ) : (
                <FileType className="h-5 w-5 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{file.name}</p>
                  {file.isAdminOnly && (
                    <Lock className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{format(file.createdAt * 1000, 'MMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{file.uploadedBy}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}