import type { ProspectStatus } from "@/lib/types"
import { STATUS_LABEL } from "@/lib/status"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STYLES: Record<ProspectStatus, string> = {
  pending: "bg-zinc-100 text-zinc-700",
  recent: "bg-sky-100 text-sky-800",
  followup: "bg-amber-100 text-amber-900",
  ok: "bg-emerald-100 text-emerald-800",
  no: "bg-rose-100 text-rose-800",
}

export function StatusBadge({ status }: { status: ProspectStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", STYLES[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

export const ROW_STYLES: Record<ProspectStatus, string> = {
  pending: "border-l-zinc-300",
  recent: "border-l-sky-400 bg-sky-50/50",
  followup: "border-l-amber-500 bg-amber-50",
  ok: "border-l-emerald-500 bg-emerald-50/70",
  no: "border-l-rose-400 bg-rose-50/70",
}
