import React from "react"
import { cn } from "@/lib/utils"
import { domainConfig } from "@/lib/domains"
import { domains } from "@shared/schema"
import { LoadingAvatars } from "./loading-avatars"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  fullscreen?: boolean
  variant?: 'law' | 'finance' | 'medicine'
  showAllAvatars?: boolean
}

function getAvatarForVariant(variant?: LoadingProps['variant']) {
  if (!variant) return domainConfig[domains.LAW].avatar // Default to law
  return domainConfig[variant].avatar
}

function getNameForVariant(variant?: LoadingProps['variant']) {
  if (!variant) return domainConfig[domains.LAW].title.split(' ')[1] // Default to law
  return domainConfig[variant].title.split(' ')[1] // Get just the name part
}

export function Loading({ fullscreen = true, variant, showAllAvatars = false, className, ...props }: LoadingProps) {
  const content = showAllAvatars ? (
    <div className="loading-container" data-theme={variant}>
      <LoadingAvatars />
      <p className="loading-text mt-4 text-muted-foreground">
        Loading your AI team...
      </p>
    </div>
  ) : (
    <div className="loading-container" data-theme={variant}>
      <div className="loading-avatar">
        <img 
          src={getAvatarForVariant(variant)} 
          alt={`${getNameForVariant(variant)} is thinking`}
          className="w-12 h-12 rounded-full" 
        />
      </div>
      <p className="loading-text mt-2 text-muted-foreground">
        {getNameForVariant(variant)} is thinking...
      </p>
    </div>
  );

  if (!fullscreen) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)} {...props}>
        {content}
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
      className
    )} data-theme={variant} {...props}>
      {content}
    </div>
  );
}

export function LoadingPage({ variant }: { variant?: LoadingProps['variant'] }) {
  return <Loading fullscreen variant={variant} />;
}

export function LoadingSpinner({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & Pick<LoadingProps, 'variant'>) {
  return (
    <div data-theme={variant}>
      <div className={cn("h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} {...props} />
    </div>
  );
}