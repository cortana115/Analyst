import { motion } from "framer-motion";
import { type Domain } from "@shared/schema";
import { domainConfig } from "@/lib/domains";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface BlobLoaderProps {
  domain: Domain;
  className?: string;
}

export default function BlobLoader({ domain, className }: BlobLoaderProps) {
  const config = domainConfig[domain];
  
  return (
    <motion.div 
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: [0.8, 1.1, 0.9],
        opacity: 1,
      }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut",
      }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150" />
        <Avatar className="h-12 w-12 ring-2 ring-blue-500/50 relative">
          <AvatarImage src={config.avatar} alt={config.title} />
          <AvatarFallback className="bg-gray-800 text-sm font-bold">
            {config.title[0]}
          </AvatarFallback>
        </Avatar>
      </div>
    </motion.div>
  );
}
