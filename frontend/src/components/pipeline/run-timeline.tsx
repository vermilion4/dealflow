"use client"

import { cn } from "@/lib/utils"
import type { PipelineRun } from "@/lib/types"

const STEPS = [
  { key: "prospect_scout", label: "Scout" },
  { key: "fit_analyzer", label: "Analyzer" },
  { key: "pitch_craft", label: "PitchCraft" },
  { key: "awaiting_approval", label: "Approval" },
  { key: "outreach_pilot", label: "Pilot" },
]

function getStepStatus(run: PipelineRun, stepKey: string): string {
  const results = run.step_results || {}
  const stepData = results[stepKey]

  if (stepData) {
    let status = stepData.status
    // If the overall run is done but a step still says "running", correct it
    if (status === "running" && (run.status === "failed" || run.status === "completed")) {
      // If this was the last step touched, inherit the run status
      if (run.current_step === stepKey) {
        return run.status === "failed" ? "failed" : "completed"
      }
      return "completed"
    }
    return status
  }

  if (stepKey === "awaiting_approval") {
    if (run.status === "paused") return "running"
    if (results["outreach_pilot"]) return "completed"
    return "pending"
  }

  // Only show running if the run is actually still active
  if (run.current_step === stepKey && run.status === "running") return "running"
  return "pending"
}

export function RunTimeline({ run }: { run: PipelineRun }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const status = getStepStatus(run, step.key)
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                  status === "completed" && "border-green-500 bg-green-500 text-white",
                  status === "running" && "border-blue-500 bg-blue-50 text-blue-600",
                  status === "failed" && "border-red-500 bg-red-50 text-red-600",
                  status === "pending" && "border-gray-200 bg-gray-50 text-gray-300"
                )}
              >
                {status === "completed" ? (
                  <span>&#10003;</span>
                ) : status === "running" ? (
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                  </span>
                ) : status === "failed" ? (
                  <span>&#10005;</span>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-[10px] whitespace-nowrap",
                status === "running" ? "text-blue-600 font-medium" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 mx-1 mb-4",
                  status === "completed" ? "bg-green-400" : "bg-gray-200"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
