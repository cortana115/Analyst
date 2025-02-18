import { type Message, type Domain } from "@shared/schema";
import { domainConfig } from "@/lib/domains";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, User } from "lucide-react";

interface MessageThreadProps {
  messages: Message[];
  isLoading: boolean;
  domain: Domain;
  streamingMessage?: string;
  isGenerating: boolean;
}

export default function MessageThread({ 
  messages, 
  isLoading, 
  domain, 
  streamingMessage,
  isGenerating 
}: MessageThreadProps) {
  const config = domainConfig[domain];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const element = scrollRef.current;
      const smoothScroll = () => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      };
      setTimeout(smoothScroll, 100);
    }
  }, [messages, streamingMessage]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full bg-gray-800/50" />
        <Skeleton className="h-20 w-full bg-gray-800/50" />
      </div>
    );
  }

  // Personality-based animation variants
  const getAvatarAnimation = (role: string) => {
    if (role === "user") return {};

    const baseAnimation = {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    };

    return {
      idle: {
        rotate: [-1, 1],
        transition: baseAnimation
      },
      thinking: {
        scale: [1, 1.05, 1],
        rotate: [-2, 2],
        transition: {
          ...baseAnimation,
          duration: 1.5
        }
      }
    };
  };

  return (
    <ScrollArea 
      className="h-[600px] pr-4 overflow-y-auto will-change-scroll" 
      ref={scrollRef}
      style={{ 
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="space-y-6 py-4 px-2">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 pb-4 border-b border-gray-800"
        >
          <motion.div 
            className="relative"
            animate="idle"
            variants={getAvatarAnimation("assistant")}
          >
            <Avatar className="h-14 w-14 ring-2 ring-gray-700/50">
              <AvatarImage src={config.avatar} alt={config.title} />
              <AvatarFallback className="bg-blue-500/20 text-blue-200">
                {config.title[0]}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
              {config.title}
            </h3>
            <p className="text-sm text-gray-400 mt-1">{config.description}</p>
          </div>
        </motion.div>

        <AnimatePresence mode="sync" initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0.8, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.8, y: -5 }}
              transition={{ 
                duration: 0.15,
                ease: [0.4, 0.0, 0.2, 1]
              }}
              layout="position"
              className={`flex gap-4 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <motion.div 
                className="relative"
                animate={message.role === "assistant" && isGenerating ? "thinking" : "idle"}
                variants={getAvatarAnimation(message.role)}
              >
                <Avatar className="h-8 w-8 ring-2 ring-gray-700/50 shrink-0">
                  {message.role === "user" ? (
                    <>
                      <AvatarFallback className="bg-gray-700">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarImage src={config.avatar} alt={config.title} />
                      <AvatarFallback className="bg-blue-500/20 text-blue-200">
                        {config.title[0]}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
              </motion.div>
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className={`group relative rounded-2xl px-4 py-3 transition-all duration-300 max-w-[85%] ${
                  message.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/20 text-gray-200 hover:bg-blue-600/30"
                    : "bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-800/70"
                }`}
              >
                {message.metadata?.practiceAreaId && (
                  <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                    <MessageCircle className="h-3 w-3" />
                    <span>
                      {message.metadata?.practiceAreaId}
                      {message.metadata?.focusAreaId && (
                        <>
                          <span className="mx-1">→</span>
                          {message.metadata?.focusAreaId}
                        </>
                      )}
                    </span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {(streamingMessage || isGenerating) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <motion.div 
              className="relative"
              animate="thinking"
              variants={getAvatarAnimation("assistant")}
            >
              <Avatar className="h-8 w-8 ring-2 ring-gray-700/50 shrink-0">
                <AvatarImage src={config.avatar} alt={config.title} />
                <AvatarFallback className="bg-blue-500/20 text-blue-200">
                  {config.title[0]}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl px-4 py-3 bg-gray-800/50 border border-gray-700/50 text-gray-300 max-w-[85%]"
            >
              <div className="prose prose-invert max-w-none min-h-[24px]">
                {streamingMessage && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingMessage}
                  </ReactMarkdown>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
}