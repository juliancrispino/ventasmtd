"use client"

import Link from "next/link"
import { ClockAlert, MapPin, Store } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { listStats } from "@/lib/status"
import { formatDate } from "@/lib/dates"
import type { CityList, Settings } from "@/lib/types"

export function ListCard({
  list,
  settings,
}: {
  list: CityList
  settings: Settings
}) {
  const stats = listStats(list, settings.followUpDays)

  return (
    <Link href={`/listas/${list.id}`} className="block h-full">
      <Card className="h-full bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="size-4 shrink-0 text-teal-700" />
                <span className="truncate">{list.title}</span>
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Actualizada {formatDate(list.updatedAt)}
                {list.sourceFileName ? ` · ${list.sourceFileName}` : ""}
              </p>
            </div>
            {stats.followup > 0 && (
              <Badge className="border-0 bg-amber-100 text-amber-900">
                <ClockAlert className="size-3" />
                {stats.followup}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm">
            <Store className="size-4 text-muted-foreground" />
            <span className="font-semibold">{stats.total}</span> negocios
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Pendientes" value={stats.pending} />
            <Stat label="Contactados" value={stats.recent} />
            <Stat label="Respondió OK" value={stats.ok} tone="ok" />
            <Stat label="Negativos" value={stats.no} tone="no" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "ok" | "no"
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-2.5 py-2">
      <p className="text-muted-foreground">{label}</p>
      <p
        className={
          tone === "ok"
            ? "text-base font-semibold text-emerald-700"
            : tone === "no"
              ? "text-base font-semibold text-rose-700"
              : "text-base font-semibold"
        }
      >
        {value}
      </p>
    </div>
  )
}
