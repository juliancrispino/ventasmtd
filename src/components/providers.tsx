"use client"

import { useEffect } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { hydrateStore } from "@/lib/store"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void hydrateStore()
  }, [])

  return (
    <TooltipProvider delay={200}>
      {children}
      <Toaster />
    </TooltipProvider>
  )
}
