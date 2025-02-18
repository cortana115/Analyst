import { domains, type Domain } from "@shared/schema";
import { domainConfig } from "@/lib/domains";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import LanguageButton from "./language-button";
import ExamplePrompts from "./example-prompts";

interface AvatarSelectProps {
  selectedDomain: Domain | null;
  onSelect: (domain: Domain) => void;
  onStartChat: () => void;
}

export default function AvatarSelect({ selectedDomain, onSelect, onStartChat }: AvatarSelectProps) {
  const [hoveredDomain, setHoveredDomain] = useState<Domain | null>(null);
  const [thoughtIndex, setThoughtIndex] = useState<number>(0);

  const thoughts = {
    [domains.LAW]: [
      "Analyzing legal precedents...",
      "Reviewing contract terms...",
      "Structuring compliance...",
    ],
    [domains.FINANCE]: [
      "Calculating portfolio risk...",
      "Optimizing asset allocation...",
      "Analyzing market trends...",
    ],
    [domains.MEDICINE]: [
      "Reviewing clinical data...",
      "Analyzing treatment options...",
      "Evaluating protocols...",
    ],
  };

  useEffect(() => {
    if (hoveredDomain) {
      const interval = setInterval(() => {
        setThoughtIndex(prev => (prev + 1) % thoughts[hoveredDomain].length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [hoveredDomain]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(Object.values(domains) as Domain[]).map((domain) => {
          const config = domainConfig[domain];
          const isSelected = domain === selectedDomain;

          return (
            <div
              key={domain}
              onClick={() => onSelect(domain)}
              onDoubleClick={() => onSelect(null)}
              className="cursor-pointer focus:outline-none transform transition-all duration-300 hover:scale-[1.02]"
            >
              <Card
                className={cn(
                  "relative w-full p-8 bg-gradient-to-b from-gray-900/90 to-gray-900/50 border-gray-800 backdrop-blur-sm transition-all duration-300 overflow-visible group",
                  isSelected
                    ? "ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
                    : "hover:border-gray-700"
                )}
                onClick={() => onSelect(domain)}
                onMouseEnter={() => setHoveredDomain(domain)}
                onMouseLeave={() => setHoveredDomain(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex flex-col items-center text-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Avatar className="h-32 w-32 ring-4 ring-gray-800/50 transition-transform duration-300 group-hover:scale-105 relative" online={true}>
                      <AvatarImage src={config.avatar} alt={config.title} onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                      }} />
                      <AvatarFallback className="bg-gray-800 text-2xl font-bold">
                        {config.title[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="w-full">
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      {config.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">{config.description}</p>
                    <div className="text-xs text-gray-500 mb-4">
                      {domain === domains.LAW && "Corporate Law • Intellectual Property • Litigation"}
                      {domain === domains.FINANCE && "Investment Management • Market Analysis • Financial Planning"}
                      {domain === domains.MEDICINE && "Clinical Practice • Medical Research • Patient Care"}
                    </div>
                    <div className="w-full px-2">
                      <ExamplePrompts domain={domain} />
                    </div>
                    {isSelected && (
                      <div className="absolute -bottom-px left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                    )}
                  </div>
                </div>
                {hoveredDomain === domain && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 z-10 min-w-[180px]"
                  >
                    <div className="relative bg-gray-900/90 backdrop-blur-sm text-sm p-3 rounded-2xl border border-gray-700/50">
                      {thoughts[domain][thoughtIndex]}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900/90 border-b border-r border-gray-700/50 transform rotate-45" />
                    </div>
                  </motion.div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
      {selectedDomain && domainConfig[selectedDomain] && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
          <LanguageButton
            domain={selectedDomain}
            onClick={onStartChat}
            className="shadow-xl"
          />
        </div>
      )}
    </div>
  );
}