"use client"

import { usePathname } from "next/navigation"

const titles: Record<string, string> = {
  "/prospects": "Prospects",
  "/deals": "Deals",
  "/approvals": "Approvals",
  "/pipeline": "Pipeline",
}

export function Header() {
  const pathname = usePathname()
  const title = Object.entries(titles).find(([path]) => pathname.startsWith(path))?.[1] || "Dashboard"

  return (
    <header className="flex h-14 items-center border-b px-6 pl-14 md:pl-6">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  )
}
