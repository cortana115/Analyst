
import { useState } from "react";
import { type Domain } from "@shared/schema";
import { domainConfig } from "@/lib/domains";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubFeature {
  id: string;
  name: string;
  description: string;
  subFeatures?: SubFeature[];
}

interface SubFeatureSelectProps {
  domain: Domain;
  onSelect: (featureId: string | null) => void;
  selectedFeature: string | null;
}

export default function SubFeatureSelect({
  domain,
  onSelect,
  selectedFeature
}: SubFeatureSelectProps) {
  const config = domainConfig[domain];
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>(
    config.subFeatures[0]?.id || ""
  );

  const currentPracticeArea = config.subFeatures.find(
    (feature) => feature.id === selectedPracticeArea
  );

  return (
    <div className="space-y-4">
      <Tabs
        value={selectedPracticeArea}
        onValueChange={setSelectedPracticeArea}
        className="w-full"
      >
        <TabsList className="w-full bg-gray-800/50">
          {config.subFeatures.map((area) => (
            <TabsTrigger
              key={area.id}
              value={area.id}
              className="flex-1 data-[state=active]:bg-gray-700/50"
            >
              {area.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {currentPracticeArea?.subFeatures?.map((feature) => {
          const isSelected = selectedFeature === feature.id;
          
          return (
            <Card
              key={feature.id}
              onClick={() => onSelect(isSelected ? null : feature.id)}
              className={`
                relative cursor-pointer p-3 transition-all duration-300
                hover:bg-gray-800/50 rounded-lg
                ${isSelected ? 'bg-gray-800/80 ring-1 ring-blue-500/50' : 'bg-gray-800/20'}
              `}
            >
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-start justify-between w-full">
                  <h4 className="font-semibold text-gray-200 truncate">{feature.name}</h4>
                  {isSelected && (
                    <Check className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-sm text-gray-400 line-clamp-2 break-words">
                  {feature.description}
                </p>
              </div>
              
              {isSelected && (
                <div className="absolute -bottom-px left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
