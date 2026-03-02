"use client"

import type { ReactNode } from "react"
import { ToastProvider } from "@/components/ui/toast"
import { SSEToasts } from "@/components/sse-toasts"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SSEToasts />
      {children}
    </ToastProvider>
  )
}
