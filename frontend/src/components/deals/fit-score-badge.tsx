"use client"

import { cn } from "@/lib/utils"

interface FitScoreBadgeProps {
  score: number | null
  size?: "sm" | "md" | "lg"
}

export function FitScoreBadge({ score, size = "md" }: FitScoreBadgeProps) {
  if (score === null || score === undefined) {
    const naSize = {
      sm: "h-8 w-8 text-[10px]",
      md: "h-12 w-12 text-xs",
      lg: "h-16 w-16 text-sm",
    }
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full border-2 font-medium",
          naSize[size],
          "bg-gray-50 text-gray-400 border-gray-200"
        )}
      >
        N/A
      </div>
    )
  }

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
  }

  const getColor = (s: number) => {
    if (s >= 70) return "bg-green-100 text-green-700 border-green-300"
    if (s >= 40) return "bg-yellow-100 text-yellow-700 border-yellow-300"
    return "bg-red-100 text-red-700 border-red-300"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border-2 font-bold",
        sizeClasses[size],
        getColor(score)
      )}
    >
      {score}
    </div>
  )
}
