import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Domain } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Paperclip, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FileUpload from "./file-upload";
import { useToast } from "@/hooks/use-toast";
import { domainConfig } from "@/lib/domains";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/hooks/use-websocket";

interface MessageInputProps {
  domain: Domain;
  threadId: string;
  onStreamingUpdate: (content: string) => void;
  onGeneratingChange: (isGenerating: boolean) => void;
  practiceAreaId?: string;
  focusAreaId?: string;
  selectedFeature?: string | null;
  onSelect?: (featureId: string | null) => void;
}

interface ActiveUser {
  userId: string;
  isTyping: boolean;
  lastSeen: number;
}

export default function MessageInput({
  domain,
  threadId,
  onStreamingUpdate,
  onGeneratingChange,
  practiceAreaId,
  focusAreaId,
  selectedFeature,
  onSelect,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const config = domainConfig[domain];
  const { sendMessage, userId } = useWebSocket(threadId, domain);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedFeature && selectedPracticeArea) {
      const practiceArea = config.practiceAreas?.find(pa => pa.id === selectedPracticeArea);
      const focusAreaExists = practiceArea?.focusAreas.some(fa => fa.id === selectedFeature);
      if (!focusAreaExists) {
        onSelect?.(null);
      }
    }
  }, [selectedPracticeArea]);

  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'user_joined':
          setActiveUsers(prev => [...prev, {
            userId: data.userId,
            isTyping: false,
            lastSeen: data.timestamp
          }]);
          break;

        case 'user_left':
          setActiveUsers(prev => prev.filter(user => user.userId !== data.userId));
          break;

        case 'typing':
          setActiveUsers(prev => prev.map(user =>
            user.userId === data.userId
              ? { ...user, isTyping: data.isTyping }
              : user
          ));
          break;
      }
    };

    window.addEventListener('message', handleWebSocketMessage);
    return () => window.removeEventListener('message', handleWebSocketMessage);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;

      onGeneratingChange(true);
      onStreamingUpdate("");

      const controller = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          domain,
          threadId,
          role: "user",
          practiceArea: practiceAreaId,
          focusArea: focusAreaId,
          timestamp: Date.now(),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      let streamedContent = '';
      let streamBuffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                } else if (data.done) {
                  return data.messageId;
                } else if (data.content) {
                  streamBuffer += data.content;
                  const words = streamBuffer.split(' ');

                  for (let i = 0; i < words.length - 1; i++) {
                    streamedContent += words[i] + ' ';
                    onStreamingUpdate(streamedContent);
                    await new Promise(resolve => setTimeout(resolve, 20));
                  }

                  streamBuffer = words[words.length - 1];
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }

        if (streamBuffer) {
          streamedContent += streamBuffer;
          onStreamingUpdate(streamedContent);
        }
      } catch (error) {
        controller.abort();
        throw error;
      } finally {
        reader.releaseLock();
        onGeneratingChange(false);
      }
    },
    onSuccess: () => {
      setMessage("");
      onStreamingUpdate("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${threadId}`] });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to send message. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      onGeneratingChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      mutation.mutate();
    }
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendMessage({ 
      type: 'typing', 
      threadId, 
      userId,
      isTyping: true 
    });

    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({ 
        type: 'typing', 
        threadId, 
        userId,
        isTyping: false 
      });
    }, 1000);
  };

  const getCurrentFeatureName = () => {
    if (!selectedPracticeArea || !selectedFeature) return null;
    const practiceArea = config.practiceAreas?.find(pa => pa.id === selectedPracticeArea);
    const focusArea = practiceArea?.focusAreas.find(fa => fa.id === selectedFeature);
    if (practiceArea && focusArea) {
      return `${practiceArea.name} - ${focusArea.name}`;
    }
    return null;
  };

  const featureName = getCurrentFeatureName();

  const renderTypingIndicators = () => {
    const typingUsers = activeUsers.filter(user => user.userId !== userId && user.isTyping);

    if (typingUsers.length === 0) return null;

    return (
      <div className="absolute -top-6 left-0 text-sm text-gray-400">
        {typingUsers.length === 1 ? (
          <span>Someone is typing...</span>
        ) : (
          <span>{typingUsers.length} people are typing...</span>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-4 relative">
      <Dialog open={isFileModalOpen} onOpenChange={setIsFileModalOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload files to enhance the conversation. Supported formats include PDF, TXT, and more.
            </DialogDescription>
          </DialogHeader>
          <FileUpload domain={domain} onUploadComplete={() => setIsFileModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-10 w-10 border-gray-700 transition-colors ${
                        (selectedPracticeArea || selectedFeature) ? 'bg-blue-600/20 border-blue-500/50' : ''
                        }`}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                  className="bg-gray-900 text-gray-200 border-gray-700"
                  sideOffset={5}
                >
                  Select Practice Area & Focus
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent
              align="start"
              className="w-[280px] max-w-[90vw] bg-gray-900 border-gray-700 p-2"
              side="top"
              sideOffset={5}
            >
              <DropdownMenuLabel className="text-sm font-medium text-gray-200">
                Select Practice Area
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700/50 my-2" />
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedPracticeArea(null);
                  onSelect?.(null);
                }}
                className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  !selectedPracticeArea ? 'bg-blue-600/20 text-blue-200' : 'hover:bg-gray-800'
                  }`}
              >
                <div>
                  <div className="font-medium">General Practice</div>
                  <div className="text-xs text-gray-400 mt-0.5">All areas of expertise</div>
                </div>
              </DropdownMenuItem>

              {config.practiceAreas?.map((area) => (
                <DropdownMenuSub key={area.id}>
                  <DropdownMenuSubTrigger
                    className={`px-3 py-2 rounded-md transition-colors my-1 ${
                      selectedPracticeArea === area.id ? 'bg-blue-600/20 text-blue-200' : 'hover:bg-gray-800'
                      }`}
                  >
                    <div>
                      <div className="font-medium">{area.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {area.focusAreas.length} focus areas available
                      </div>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      className="bg-gray-900 border-gray-700 w-[280px] max-w-[90vw] p-2"
                      alignOffset={-5}
                      sideOffset={5}
                    >
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedPracticeArea(area.id);
                          onSelect?.(null);
                        }}
                        className="px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
                      >
                        <div className="font-medium">Overview</div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700/50 my-2" />
                      {area.focusAreas.map((focus) => (
                        <TooltipProvider key={focus.id} delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedPracticeArea(area.id);
                                  onSelect?.(focus.id);
                                }}
                                className={`px-3 py-2 rounded-md transition-colors ${
                                  selectedFeature === focus.id ? 'bg-blue-600/20 text-blue-200' : 'hover:bg-gray-800'
                                  }`}
                              >
                                <div className="w-full">
                                  <div className="font-medium">{focus.name}</div>
                                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                                    {focus.description}
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              align="start"
                              className="bg-gray-900 text-gray-200 border-gray-700 max-w-[280px]"
                              sideOffset={5}
                            >
                              {focus.description}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-gray-700 transition-all hover:bg-gray-800"
                  onClick={() => setIsFileModalOpen(true)}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="bg-gray-900 text-gray-200 border-gray-700"
                sideOffset={5}
              >
                Upload Reference Files
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="relative flex-1">
          {renderTypingIndicators()}
          <Input
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleMessageKeyDown}
            placeholder={`Ask ${config.title} anything...`}
            disabled={mutation.isPending}
            className="flex-1 bg-gray-800/50 border-gray-700 focus:ring-blue-500/40 focus:border-blue-500/40"
          />
        </div>

        <Button
          type="submit"
          disabled={mutation.isPending || !message.trim()}
          className="bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {featureName && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-8 left-0 bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md text-sm border border-blue-500/20"
          >
            {featureName}
          </motion.div>
        )}
      </AnimatePresence>

      {activeUsers.length > 1 && (
        <div className="absolute -top-8 right-0 flex items-center gap-2">
          <div className="flex -space-x-2">
            {activeUsers.slice(0, 3).map((user) => (
              <div
                key={user.userId}
                className="h-6 w-6 rounded-full bg-blue-500 border-2 border-gray-900 flex items-center justify-center text-xs font-medium text-white"
              >
                {user.userId.slice(0, 2)}
              </div>
            ))}
          </div>
          {activeUsers.length > 3 && (
            <span className="text-sm text-gray-400">
              +{activeUsers.length - 3} more
            </span>
          )}
        </div>
      )}
    </form>
  );
}