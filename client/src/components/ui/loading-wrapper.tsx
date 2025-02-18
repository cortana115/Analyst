import React, { Suspense } from "react"
import { Loading } from "./loading"
import { useIsFetching } from "@tanstack/react-query"
import { useLocation } from "wouter"

interface LoadingWrapperProps {
  children: React.ReactNode
  variant?: 'law' | 'finance' | 'medicine'
}

export function LoadingWrapper({ children, variant }: LoadingWrapperProps) {
  const isFetching = useIsFetching()
  const [location] = useLocation()
  const [showInitialLoading, setShowInitialLoading] = React.useState(true)

  React.useEffect(() => {
    // Show initial loading animation for 2 seconds
    const timer = setTimeout(() => {
      setShowInitialLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Show all avatars during initial load
  if (showInitialLoading) {
    return <Loading variant={variant} showAllAvatars />;
  }

  // Only show loading on routes where we expect data fetching
  const shouldShowLoading = location === "/" && isFetching > 0

  return (
    <Suspense fallback={<Loading variant={variant} />}>
      {shouldShowLoading ? <Loading variant={variant} /> : children}
    </Suspense>
  )
}