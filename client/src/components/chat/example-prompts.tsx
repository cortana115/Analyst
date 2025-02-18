import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { type Domain } from "@shared/schema";
import { domainConfig } from "@/lib/domains";

interface ExamplePromptsProps {
  domain: Domain;
  practiceAreaId?: string;
  focusAreaId?: string;
}

const prompts = {
  law: {
    default: [
      "What legal considerations should I keep in mind?",
      "Review this legal document",
      "Explain my legal rights",
    ],
    corporate: {
      default: [
        "Review our company bylaws",
        "Help with corporate compliance",
        "Draft a shareholder agreement",
      ],
      "due-diligence": [
        "Review these M&A documents",
        "Check for potential legal risks",
        "Analyze financial statements",
      ],
      "drafting": [
        "Draft an NDA agreement",
        "Create a partnership contract",
        "Review employment agreement",
      ],
      "execution-formalities": [
        "Guide me through document signing",
        "Verify execution requirements",
        "Check corporate formalities",
      ],
    },
    "intellectual-property": {
      default: [
        "Protect my intellectual property",
        "File a trademark application",
        "Review patent strategy",
      ],
      "trademark-application": [
        "Check trademark availability",
        "File a trademark application",
        "Respond to trademark office action",
      ],
      "patent-review": [
        "Review patent application",
        "Check patent infringement",
        "Analyze prior art",
      ],
      "ip-strategy": [
        "Develop IP protection strategy",
        "License intellectual property",
        "Enforce IP rights",
      ],
    },
    "litigation": {
      default: [
        "Analyze case strength",
        "Review legal strategy",
        "Prepare for court",
      ],
      "case-analysis": [
        "Review case precedents",
        "Analyze similar cases",
        "Evaluate legal arguments",
      ],
      "evidence-review": [
        "Organize evidence",
        "Review witness statements",
        "Analyze document authenticity",
      ],
      "strategy": [
        "Develop litigation strategy",
        "Plan settlement approach",
        "Prepare court timeline",
      ],
    },
  },
  finance: {
    default: [
      "Analyze market trends",
      "Review investment options",
      "Plan retirement strategy",
    ],
    investment: {
      default: [
        "Review portfolio performance",
        "Suggest investment strategy",
        "Analyze market risks",
      ],
      "portfolio-analysis": [
        "Check portfolio balance",
        "Analyze investment returns",
        "Review asset allocation",
      ],
      "risk-assessment": [
        "Evaluate market risks",
        "Check investment exposure",
        "Analyze volatility impact",
      ],
      "asset-allocation": [
        "Optimize asset mix",
        "Rebalance portfolio",
        "Suggest allocation changes",
      ],
    },
    "market-analysis": {
      default: [
        "Analyze market trends",
        "Review sector performance",
        "Check economic indicators",
      ],
      "technical-analysis": [
        "Review price patterns",
        "Analyze market indicators",
        "Check trading signals",
      ],
      "fundamental-analysis": [
        "Analyze company financials",
        "Review industry metrics",
        "Evaluate growth potential",
      ],
      "market-research": [
        "Research market trends",
        "Analyze competitor data",
        "Review industry reports",
      ],
    },
    "financial-planning": {
      default: [
        "Create financial plan",
        "Plan retirement savings",
        "Review tax strategy",
      ],
      "retirement": [
        "Calculate retirement needs",
        "Review retirement accounts",
        "Plan withdrawal strategy",
      ],
      "tax-strategy": [
        "Optimize tax efficiency",
        "Plan tax deductions",
        "Review tax implications",
      ],
      "estate-planning": [
        "Plan wealth transfer",
        "Review estate taxes",
        "Structure inheritance",
      ],
    },
  },
  medicine: {
    default: [
      "Check these symptoms",
      "Review medical research",
      "Explain treatment options",
    ],
    clinical: {
      default: [
        "Review patient symptoms",
        "Check treatment options",
        "Monitor recovery progress",
      ],
      "diagnosis": [
        "Analyze these symptoms",
        "Check possible conditions",
        "Review test results",
      ],
      "treatment": [
        "Compare treatment options",
        "Review medication effects",
        "Plan recovery timeline",
      ],
      "monitoring": [
        "Track recovery progress",
        "Monitor vital signs",
        "Check treatment response",
      ],
    },
    "research": {
      default: [
        "Find latest research",
        "Review clinical trials",
        "Analyze study results",
      ],
      "literature-review": [
        "Find recent studies",
        "Review research papers",
        "Compare trial results",
      ],
      "clinical-trials": [
        "Check trial outcomes",
        "Review methodology",
        "Analyze trial data",
      ],
      "evidence-synthesis": [
        "Compare study findings",
        "Review meta-analyses",
        "Evaluate evidence strength",
      ],
    },
    "specialty": {
      default: [
        "Get specialist insight",
        "Review complex cases",
        "Check treatment protocols",
      ],
      "cardiology": [
        "Review heart symptoms",
        "Check cardiac tests",
        "Monitor heart health",
      ],
      "neurology": [
        "Analyze brain scans",
        "Review nerve symptoms",
        "Check treatment progress",
      ],
      "oncology": [
        "Review cancer markers",
        "Check treatment options",
        "Monitor therapy response",
      ],
    },
  },
};

export default function ExamplePrompts({ domain, practiceAreaId, focusAreaId }: ExamplePromptsProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const config = domainConfig[domain];

  // Get the appropriate prompts based on selection
  const getPrompts = () => {
    const domainPrompts = prompts[domain];
    if (!practiceAreaId) return domainPrompts.default;
    if (!focusAreaId) return domainPrompts[practiceAreaId]?.default || domainPrompts.default;
    return domainPrompts[practiceAreaId]?.[focusAreaId] || domainPrompts[practiceAreaId]?.default || domainPrompts.default;
  };

  const currentPrompts = getPrompts();

  useEffect(() => {
    setCurrentPromptIndex(0); // Reset index when selection changes
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % currentPrompts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [domain, practiceAreaId, focusAreaId, currentPrompts.length]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 p-4 mb-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPromptIndex + practiceAreaId + focusAreaId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center px-4"
        >
          <p className="text-sm text-gray-400 mb-2">Try asking {config.title.split(' ').pop()}:</p>
          <p className="text-lg text-gray-200 font-medium">
            "{currentPrompts[currentPromptIndex]}"
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}