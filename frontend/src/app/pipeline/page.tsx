"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Workflow } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { RunTimeline } from "@/components/pipeline/run-timeline"
import { listPipelineRuns } from "@/lib/api"
import { useSSE } from "@/lib/sse"
import type { PipelineRun } from "@/lib/types"

const statusColors: Record<string, string> = {
  running: "bg-blue-100 text-blue-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
}

export default function PipelinePage() {
  const { data: runs, mutate, isLoading } = useSWR<PipelineRun[]>(
    "pipeline-runs",
    listPipelineRuns,
    { refreshInterval: 3000 }
  )

  const handleSSE = useCallback(() => {
    mutate()
  }, [mutate])

  useSSE(handleSSE)

  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pipeline</h2>
        <p className="text-muted-foreground">
          Track agent pipeline runs in real-time
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !runs || runs.length === 0 ? (
        <EmptyState
          icon={<Workflow className="w-7 h-7 text-muted-foreground" />}
          title="No pipeline runs yet"
          description="Pipeline activity will show up here in real-time as agents process your prospects."
        />
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <Card
              key={run.id}
              className="cursor-pointer"
              onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="shrink-0">
                    <CardTitle className="text-base">
                      {run.prospect?.company_name || `Run #${run.id}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={statusColors[run.status] || ""}>
                        {run.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(run.started_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <RunTimeline run={run} />
                </div>
              </CardHeader>

              {expandedId === run.id && run.step_results && (
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(run.step_results).map(([step, result]) => (
                      <div key={step} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize">
                            {step.replace(/_/g, " ")}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              result.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : result.status === "failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>
                        {result.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-sm text-destructive mt-1">{result.error}</p>
                        )}
                        {result.output && (
                          <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(result.output, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
