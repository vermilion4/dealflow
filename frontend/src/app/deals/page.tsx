"use client"

import { useCallback } from "react"
import useSWR from "swr"
import { BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { DealCard } from "@/components/deals/deal-card"
import { listDeals } from "@/lib/api"
import { useSSE } from "@/lib/sse"
import type { Deal } from "@/lib/types"

export default function DealsPage() {
  const { data: deals, mutate, isLoading } = useSWR<Deal[]>(
    "deals",
    () => listDeals(),
    { refreshInterval: 5000 }
  )

  const handleSSE = useCallback(() => {
    mutate()
  }, [mutate])

  useSSE(handleSSE)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Deals</h2>
        <p className="text-muted-foreground">
          Qualified prospects with fit analysis and scores
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : !deals || deals.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-7 h-7 text-muted-foreground" />}
          title="No deals yet"
          description="Deals appear here after prospects are researched and qualified by the AI pipeline."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  )
}
