import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { domainConfig } from "@/lib/domains";
import { type Domain } from "@shared/schema";

const languages = [
  { code: "en", text: "🇬🇧 Put {name} to work" },
  { code: "ja", text: "🇯🇵 {name} を仕事に" },
  { code: "fr", text: "🇫🇷 Mettez {name} au travail" },
  { code: "ar", text: "🇸🇦 ضع {name} للعمل" },
];

interface LanguageButtonProps {
  domain: Domain;
  onClick: () => void;
  className?: string;
}

export default function LanguageButton({ domain, onClick, className }: LanguageButtonProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const config = domainConfig[domain];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % languages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Button
      onClick={onClick}
      size="lg"
      className={`relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-lg px-12 py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="block"
        >
          {languages[currentIndex].text.replace("{name}", config.title)}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}