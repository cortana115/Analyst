import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { domains, insertUserSchema, practiceAreas } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { WelcomeStep } from "./steps/WelcomeStep";

// Steps in the onboarding process
const STEPS = [
  "welcome",
  "role",
  "details",
  "account",
  "tailored",
  "preferences",
  "confirmation"
] as const;

type Step = typeof STEPS[number];

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [location, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      domain: undefined,
      practiceArea: undefined,
      organizationSize: "",
      yearsExperience: undefined,
      preferences: {
        features: [],
        notifications: true,
        theme: "system"
      }
    }
  });

  const currentStepIndex = STEPS.indexOf(step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return <WelcomeStep onNext={nextStep} />;
      default:
        return <div>Step {step} to be implemented</div>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {STEPS.length}
          </p>
        </div>

        <form onSubmit={form.handleSubmit((data) => {
          if (step === "confirmation") {
            // Submit the form
            console.log("Form data:", data);
            setLocation("/dashboard");
          } else {
            nextStep();
          }
        })}>
          {renderStep()}

          {step !== "welcome" && (
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === "welcome"}
              >
                Back
              </Button>
              <Button type="submit">
                {step === "confirmation" ? "Complete" : "Next"}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}