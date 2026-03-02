"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"

type ToastVariant = "success" | "error" | "info"

interface Toast {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback(
    ({ title, description, variant = "info" }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = nextId++
      setToasts((prev) => [...prev, { id, title, description, variant }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    },
    []
  )

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in bg-background",
              t.variant === "success" && "border-green-200 bg-green-50 dark:bg-green-950/20",
              t.variant === "error" && "border-red-200 bg-red-50 dark:bg-red-950/20",
              t.variant === "info" && "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.variant === "success" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              {t.variant === "error" && <XCircle className="w-5 h-5 text-red-600" />}
              {t.variant === "info" && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
