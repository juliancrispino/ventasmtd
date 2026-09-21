"use client"

import { useMemo, useState } from "react"
import { AtSign, MapPin, MessageCircle, Phone, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ContactDialog } from "@/components/contact-dialog"
import { StatusBadge } from "@/components/status-badge"
import { deleteBusiness, updateBusiness } from "@/lib/store"
import { formatPhone, hasPhone } from "@/lib/phone"
import { formatRelative } from "@/lib/dates"
import { getProspectStatus } from "@/lib/status"
import { instagramUrl } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import type { Business, CityList, ProspectStatus, Settings } from "@/lib/types"

const FILTERS: { id: ProspectStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "followup", label: "Recontactar" },
  { id: "recent", label: "Contactados" },
  { id: "ok", label: "OK" },
  { id: "no", label: "Negativos" },
]

const CARD_STYLES: Record<ProspectStatus, string> = {
  pending: "border-l-zinc-400 bg-white",
  recent: "border-l-sky-500 bg-sky-50",
  followup: "border-l-amber-500 bg-amber-50",
  ok: "border-l-emerald-500 bg-emerald-50",
  no: "border-l-rose-500 bg-rose-50",
}

export function BusinessTable({
  list,
  settings,
}: {
  list: CityList
  settings: Settings
}) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<ProspectStatus | "all">("all")
  const [category, setCategory] = useState("all")
  const [contact, setContact] = useState<Business | null>(null)

  const categories = useMemo(() => {
    return [...new Set(list.businesses.map((item) => item.category).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, "es")
    )
  }, [list.businesses])

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return list.businesses.filter((item) => {
      const status = getProspectStatus(item, settings.followUpDays)
      if (filter !== "all" && status !== filter) return false
      if (category !== "all" && item.category !== category) return false
      if (!needle) return true
      return [item.name, item.category, item.address, item.phone, item.social]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [list.businesses, query, filter, category, settings.followUpDays])

  function toggle(
    business: Business,
    field: "contacted" | "respondedOk" | "respondedNo",
    checked: boolean
  ) {
    const patch: Partial<Business> = { [field]: checked }
    if (field === "respondedOk" && checked) {
      patch.respondedNo = false
      patch.contacted = true
    }
    if (field === "respondedNo" && checked) {
      patch.respondedOk = false
      patch.contacted = true
    }
    updateBusiness(list.id, business.id, patch)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-white pl-9 text-base md:text-sm"
            placeholder="Buscar nombre, teléfono, rubro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <select
            className="h-11 w-full rounded-lg border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">Todos los rubros</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            className="h-9 min-w-0 px-3"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-4 py-12 text-center">
          <p className="font-medium">No hay negocios con ese filtro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Probá otra búsqueda o importá un CSV.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((business) => {
            const status = getProspectStatus(business, settings.followUpDays)
            const ig = instagramUrl(business.social)
            return (
              <article
                key={business.id}
                className={cn(
                  "rounded-xl border border-l-4 p-3 shadow-sm",
                  CARD_STYLES[status]
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base leading-snug font-semibold">
                      {business.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {business.category || "Sin rubro"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <StatusBadge status={status} />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Eliminar ${business.name}`}
                      onClick={() => {
                        deleteBusiness(list.id, business.id)
                        toast.success(`${business.name} eliminado`)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 space-y-1 text-sm">
                  {business.address ? (
                    <p className="flex items-start gap-1.5 text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span>{business.address}</span>
                    </p>
                  ) : null}
                  {hasPhone(business.phone) ? (
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                      {formatPhone(business.phone)}
                    </p>
                  ) : null}
                  {business.social ? (
                    ig ? (
                      <a
                        href={ig}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-teal-800"
                      >
                        <AtSign className="size-3.5" />
                        {business.social.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <p>{business.social}</p>
                    )
                  ) : null}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {formatRelative(business.lastMessageAt)}
                  {status === "followup"
                    ? ` · pasaron más de ${settings.followUpDays} días`
                    : ""}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <FlagToggle
                    label="Contactado"
                    checked={business.contacted}
                    onToggle={(checked) => toggle(business, "contacted", checked)}
                  />
                  <FlagToggle
                    label="OK"
                    checked={business.respondedOk}
                    onToggle={(checked) => toggle(business, "respondedOk", checked)}
                    tone="ok"
                  />
                  <FlagToggle
                    label="Negativa"
                    checked={business.respondedNo}
                    onToggle={(checked) => toggle(business, "respondedNo", checked)}
                    tone="no"
                  />
                </div>

                <Button
                  className="mt-3 h-11 w-full text-base"
                  disabled={!hasPhone(business.phone)}
                  onClick={() => setContact(business)}
                >
                  <MessageCircle />
                  Contactar por WhatsApp
                </Button>
              </article>
            )
          })}
        </div>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        Mostrando {rows.length} de {list.businesses.length} negocios
      </p>

      <ContactDialog
        key={contact?.id ?? "closed"}
        open={Boolean(contact)}
        onOpenChange={(open) => {
          if (!open) setContact(null)
        }}
        listId={list.id}
        city={list.title}
        business={contact}
        settings={settings}
      />
    </div>
  )
}

function FlagToggle({
  label,
  checked,
  onToggle,
  tone,
}: {
  label: string
  checked: boolean
  onToggle: (checked: boolean) => void
  tone?: "ok" | "no"
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center rounded-lg border px-1 text-center text-[11px] font-medium leading-tight",
        checked && tone === "ok" && "border-emerald-600 bg-emerald-100 text-emerald-900",
        checked && tone === "no" && "border-rose-600 bg-rose-100 text-rose-900",
        checked && !tone && "border-teal-700 bg-teal-100 text-teal-950",
        !checked && "border-border bg-white text-muted-foreground"
      )}
    >
      {label}
    </button>
  )
}
