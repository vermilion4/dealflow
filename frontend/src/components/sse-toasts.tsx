"use client"

import { useCallback } from "react"
import { useSSE } from "@/lib/sse"
import { useToast } from "@/components/ui/toast"

/** Maps SSE events to toast notifications. */
export function SSEToasts() {
  const { toast } = useToast()

  const handleSSE = useCallback(
    (event: { event_type: string; data: Record<string, unknown> }) => {
      switch (event.event_type) {
        case "pipeline_failed": {
          const error = String(event.data.error || "Unknown error")
          const isCredits =
            error.includes("402") || error.includes("Payment Required")
          toast({
            title: isCredits ? "Credit limit reached" : "Pipeline failed",
            description: isCredits
              ? "You've hit your Airia usage limit. Check your billing dashboard."
              : error.length > 120
              ? error.slice(0, 120) + "..."
              : error,
            variant: "error",
          })
          break
        }
        case "pipeline_started":
          toast({
            title: "Pipeline started",
            description: "AI agents are processing your prospect.",
            variant: "info",
          })
          break
        case "outreach_sent":
          toast({
            title: "Outreach sent",
            description: "Email has been delivered successfully.",
            variant: "success",
          })
          break
      }
    },
    [toast]
  )

  useSSE(handleSSE)

  return null
}
