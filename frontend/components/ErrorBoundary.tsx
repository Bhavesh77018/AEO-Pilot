"use client";

import { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error("Error rendering component:", error);
    return (
      fallback || (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <p className="text-white/80 mb-2">Something went wrong</p>
            <p className="text-white/40 text-sm">Please try refreshing the page</p>
          </div>
        </div>
      )
    );
  }
}
