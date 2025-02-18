import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Welcome to Your AI Team
        </h1>
        <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          Meet your new AI employees - specialized assistants ready to revolutionize your professional workflow.
        </p>
      </div>
      <div className="mx-auto w-full max-w-sm space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What to expect:</h2>
            <ul className="space-y-2 text-left">
              <li className="flex items-center">
                <svg
                  className=" mr-2 h-4 w-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Choose your professional role
              </li>
              <li className="flex items-center">
                <svg
                  className=" mr-2 h-4 w-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Customize your experience
              </li>
              <li className="flex items-center">
                <svg
                  className=" mr-2 h-4 w-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Set up your preferences
              </li>
            </ul>
          </div>
        </Card>
        <Button onClick={onNext} className="w-full">
          Get Started
        </Button>
      </div>
    </div>
  );
}