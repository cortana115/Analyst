import { useQuery } from "@tanstack/react-query";
import { type Message } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronRight, History } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatHistorySidebarProps {
  onThreadSelect: (threadId: string) => void;
  currentThreadId: string;
}

export function ChatHistorySidebar({ onThreadSelect, currentThreadId }: ChatHistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  
  const { data: threads = [] } = useQuery<{ threadId: string; messages: Message[] }[]>({
    queryKey: ["/api/threads"],
    enabled: !!user,
  });

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50"
        onClick={toggleSidebar}
      >
        <ChevronRight className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed left-0 top-0 h-full w-[300px] bg-gray-900/95 border-r border-gray-800 z-40"
          >
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-2 px-4">
                <History className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-200">Chat History</h2>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-5rem)] p-4">
              {threads.length === 0 ? (
                <div className="text-sm text-gray-400 text-center p-4">
                  No chat history yet
                </div>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => {
                    const lastMessage = thread.messages[thread.messages.length - 1];
                    const preview = lastMessage?.content.slice(0, 50) + "...";
                    
                    return (
                      <Button
                        key={thread.threadId}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left",
                          currentThreadId === thread.threadId && "bg-blue-500/20"
                        )}
                        onClick={() => onThreadSelect(thread.threadId)}
                      >
                        <div className="flex items-start gap-2">
                          <MessageCircle className="h-4 w-4 mt-1 shrink-0" />
                          <div className="overflow-hidden">
                            <div className="text-sm font-medium">
                              Thread {thread.threadId.slice(0, 8)}
                            </div>
                            {preview && (
                              <div className="text-xs text-gray-400 truncate">
                                {preview}
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
