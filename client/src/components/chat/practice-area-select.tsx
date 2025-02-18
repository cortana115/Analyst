import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Domain } from "@shared/schema";
import { domainConfig } from "@/lib/domains";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PracticeAreaSelectProps {
  domain: Domain;
  onPracticeAreaSelect: (practiceAreaId: string) => void;
  onFocusAreaSelect: (focusAreaId: string) => void;
  selectedPracticeArea?: string;
  selectedFocusArea?: string;
  className?: string;
}

export default function PracticeAreaSelect({
  domain,
  onPracticeAreaSelect,
  onFocusAreaSelect,
  selectedPracticeArea,
  selectedFocusArea,
  className
}: PracticeAreaSelectProps) {
  const config = domainConfig[domain];
  const [activePracticeArea, setActivePracticeArea] = useState(selectedPracticeArea);
  const [isLoading, setIsLoading] = useState(false);
  const currentPracticeArea = config.practiceAreas?.find(pa => pa.id === activePracticeArea);

  const handlePracticeAreaChange = async (value: string) => {
    setIsLoading(true);
    setActivePracticeArea(value);
    onPracticeAreaSelect(value);
    // Simulate loading for smoother transition
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2">
        <Select
          value={activePracticeArea}
          onValueChange={handlePracticeAreaChange}
        >
          <SelectTrigger className="w-full bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
            <SelectValue placeholder="Select practice area" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900/95 border-gray-700">
            <SelectGroup>
              <SelectLabel>Practice Areas</SelectLabel>
              {config.practiceAreas?.map((area) => (
                <TooltipProvider key={area.id} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem 
                        value={area.id}
                        className="relative transition-colors hover:bg-gray-800"
                      >
                        <div className="py-1">
                          <div className="font-medium truncate">{area.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate">{area.description}</div>
                        </div>
                      </SelectItem>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="start"
                      className="bg-gray-900 text-gray-200 border-gray-700 max-w-xs"
                    >
                      <div className="space-y-2">
                        <p className="font-medium">{area.name}</p>
                        <p className="text-sm text-gray-300">{area.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex justify-center py-8"
            >
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </motion.div>
          ) : currentPracticeArea && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {currentPracticeArea.focusAreas.map((focus) => (
                <TooltipProvider key={focus.id} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={selectedFocusArea === focus.id ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => onFocusAreaSelect(focus.id)}
                          className={cn(
                            "w-full text-xs text-left justify-start border-gray-700 transition-all duration-200 py-2 px-3",
                            selectedFocusArea === focus.id
                              ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 shadow-lg shadow-blue-500/10"
                              : "hover:bg-gray-800/50 hover:border-gray-600"
                          )}
                        >
                          <span className="truncate">{focus.name}</span>
                        </Button>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="bg-gray-900 text-gray-200 border-gray-700"
                    >
                      <p className="text-sm">{focus.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}