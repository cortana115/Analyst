import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LoadingAvatars() {
  const avatars = [
    "/avatars/law-avatar.jpeg",
    "/avatars/finance-avatar.jpeg"
  ];
  
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % avatars.length);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-4 py-8">
      {avatars.map((avatar, index) => (
        <div
          key={avatar}
          className={cn(
            "w-12 h-12 rounded-full overflow-hidden transition-all duration-300 transform",
            activeIndex === index ? "scale-110 translate-y-[-8px]" : "scale-90 opacity-50"
          )}
        >
          <img
            src={avatar}
            alt={`Assistant ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      <div className="ml-3 text-muted-foreground animate-pulse">
        Thinking...
      </div>
    </div>
  );
}
