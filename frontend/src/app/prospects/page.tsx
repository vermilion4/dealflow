"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProspectTable } from "@/components/prospects/prospect-table"
import { NewProspectDialog } from "@/components/prospects/new-prospect-dialog"
import { listProspects, listDeals } from "@/lib/api"
import { useSSE } from "@/lib/sse"
import type { Prospect, Deal } from "@/lib/types"

export default function ProspectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: prospects, mutate: mutateProspects, isLoading } = useSWR<Prospect[]>(
    "prospects",
    listProspects,
    { refreshInterval: 5000 }
  )
  const { data: deals, mutate: mutateDeals } = useSWR<Deal[]>(
    "deals",
    () => listDeals(),
    { refreshInterval: 5000 }
  )

  const handleSSE = useCallback(() => {
    mutateProspects()
    mutateDeals()
  }, [mutateProspects, mutateDeals])

  useSSE(handleSSE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prospects</h2>
          <p className="text-muted-foreground text-sm">
            Research and track potential customers
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          New Research
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <ProspectTable prospects={prospects || []} deals={deals || []} />
      )}

      <NewProspectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => mutateProspects()}
      />
    </div>
  )
}
