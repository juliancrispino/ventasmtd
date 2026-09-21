import {
  ClockAlert,
  Handshake,
  MessageCircleMore,
  Store,
  ThumbsDown,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { summarize } from "@/lib/status"

type Stats = ReturnType<typeof summarize>

const ITEMS: {
  key: keyof Stats
  label: string
  hint: string
  icon: typeof Store
  color: string
}[] = [
  {
    key: "total",
    label: "Negocios",
    hint: "En todas las listas",
    icon: Store,
    color: "text-teal-700 bg-teal-50",
  },
  {
    key: "pending",
    label: "Pendientes",
    hint: "Todavía no contactados",
    icon: MessageCircleMore,
    color: "text-zinc-700 bg-zinc-100",
  },
  {
    key: "followup",
    label: "Recontactar",
    hint: "Más de 15 días sin respuesta",
    icon: ClockAlert,
    color: "text-amber-800 bg-amber-50",
  },
  {
    key: "ok",
    label: "Respondieron OK",
    hint: "Interesados o en conversación",
    icon: Handshake,
    color: "text-emerald-800 bg-emerald-50",
  },
  {
    key: "no",
    label: "Respuesta negativa",
    hint: "No les interesa por ahora",
    icon: ThumbsDown,
    color: "text-rose-800 bg-rose-50",
  },
]

export function StatsCards({
  stats,
  followUpDays,
}: {
  stats: Stats
  followUpDays: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {ITEMS.map((item) => {
        const Icon = item.icon
        const hint =
          item.key === "followup"
            ? `Más de ${followUpDays} días sin respuesta`
            : item.hint
        return (
          <Card key={item.key} size="sm" className="bg-white shadow-sm">
            <CardContent className="flex items-start gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.color}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-semibold tracking-tight">
                  {stats[item.key]}
                </p>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
