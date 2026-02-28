"use client"

import { useEffect, useRef, useCallback } from "react"
import type { SSEEvent } from "./types"

const SSE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api") + "/events/stream"

type SSEHandler = (event: SSEEvent) => void

// Global singleton SSE connection shared across all components
const listeners = new Set<SSEHandler>()
let eventSource: EventSource | null = null

function startGlobalSSE() {
  if (eventSource) return

  eventSource = new EventSource(SSE_URL)

  eventSource.onmessage = (e) => {
    if (!e.data) return
    try {
      const parsed = JSON.parse(e.data) as SSEEvent
      listeners.forEach((fn) => fn(parsed))
    } catch {
      // ignore malformed events
    }
  }

  eventSource.onerror = () => {
    // EventSource auto-reconnects on error, but if no listeners, close it
    if (listeners.size === 0) {
      stopGlobalSSE()
    }
  }
}

function stopGlobalSSE() {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

export function useSSE(onEvent: SSEHandler) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  const stableHandler: SSEHandler = useCallback((evt) => {
    handlerRef.current(evt)
  }, [])

  useEffect(() => {
    listeners.add(stableHandler)
    startGlobalSSE()

    return () => {
      listeners.delete(stableHandler)
      if (listeners.size === 0) {
        stopGlobalSSE()
      }
    }
  }, [stableHandler])
}
