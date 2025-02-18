import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { defaultSystemPrompts, type Domain } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { domainConfig } from "@/lib/domains";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemPromptEditorProps {
  domain: Domain;
  onUpdate: () => void;
  selectedFeature?: string | null;
}

export default function SystemPromptEditor({ domain, onUpdate, selectedFeature }: SystemPromptEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const config = domainConfig[domain];

  // Get the default prompts for the domain and its features
  const domainPrompts = defaultSystemPrompts[domain] as 
    | { default: string; [key: string]: string }
    | string;

  // Initialize prompts state with all prompts (main + sub-features)
  const [prompts, setPrompts] = useState<{ [key: string]: string }>(() => {
    if (typeof domainPrompts === 'string') {
      return { default: domainPrompts };
    }
    return domainPrompts;
  });

  const [activeTab, setActiveTab] = useState('default');

  const handleAdminLogin = () => {
    const password = window.prompt("Enter password:");
    if (password === "password") {
      setIsAdmin(true);
      toast({
        title: "Success",
        description: "Admin access granted",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid password",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      // Save both main prompt and sub-feature prompts
      await Promise.all(
        Object.entries(prompts).map(([featureId, prompt]) =>
          apiRequest("POST", "/api/system-prompts", {
            domain,
            prompt,
            subFeatureId: featureId === 'default' ? null : featureId,
            updatedAt: Date.now(),
          })
        )
      );

      setIsEditing(false);
      onUpdate();
      toast({
        title: "Success",
        description: "System prompts updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update system prompts",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setPrompts(typeof domainPrompts === 'string' ? { default: domainPrompts } : domainPrompts);
    setIsEditing(false);
  };

  const updatePrompt = (featureId: string, newPrompt: string) => {
    setPrompts(prev => ({
      ...prev,
      [featureId]: newPrompt
    }));
  };

  if (!isEditing) {
    const currentPrompt = selectedFeature ? prompts[selectedFeature] : prompts.default;

    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-200">System Prompt</h3>
            {isAdmin ? (
              <Button variant="outline" onClick={() => setIsEditing(true)} 
                className="bg-gray-800 hover:bg-gray-700 border-gray-700">
                Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={handleAdminLogin}
                className="bg-gray-800 hover:bg-gray-700 border-gray-700">
                Admin Login
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-400 whitespace-pre-wrap">{currentPrompt}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <div className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-200">Edit System Prompts</h3>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="default">Main Prompt</TabsTrigger>
            {config.subFeatures.map(feature => (
              <TabsTrigger key={feature.id} value={feature.id}>
                {feature.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="default">
            <Textarea
              value={prompts.default}
              onChange={(e) => updatePrompt('default', e.target.value)}
              className="min-h-[200px] bg-gray-800/50 border-gray-700 text-gray-200 focus:ring-blue-500/50"
            />
          </TabsContent>

          {config.subFeatures.map(feature => (
            <TabsContent key={feature.id} value={feature.id}>
              <Textarea
                value={prompts[feature.id] || ''}
                onChange={(e) => updatePrompt(feature.id, e.target.value)}
                className="min-h-[200px] bg-gray-800/50 border-gray-700 text-gray-200 focus:ring-blue-500/50"
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleReset}
            className="bg-gray-800 hover:bg-gray-700 border-gray-700">
            Reset to Default
          </Button>
          <Button onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </Card>
  );
}