"use client"

import { useMemo, useState } from "react"
import { AtSign, MessageCircle, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContactDialog } from "@/components/contact-dialog"
import { ROW_STYLES, StatusBadge } from "@/components/status-badge"
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
  { id: "ok", label: "Respondió OK" },
  { id: "no", label: "Negativos" },
]

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
    if (field === "contacted" && !checked) {
      patch.lastMessageAt = business.lastMessageAt
    }
    updateBusiness(list.id, business.id, patch)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar por nombre, teléfono, rubro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
          <p className="font-medium">No hay negocios con ese filtro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Probá otra búsqueda o cargá un archivo para esta ciudad.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="sticky left-0 z-10 min-w-48 bg-muted/40">
                  Nombre
                </TableHead>
                <TableHead className="min-w-36">Rubro</TableHead>
                <TableHead className="min-w-48">Ubicación</TableHead>
                <TableHead className="min-w-36">WhatsApp</TableHead>
                <TableHead className="min-w-32">Redes</TableHead>
                <TableHead className="text-center">Contactado</TableHead>
                <TableHead className="text-center">OK</TableHead>
                <TableHead className="text-center">Negativa</TableHead>
                <TableHead className="min-w-36">Último mensaje</TableHead>
                <TableHead className="min-w-28">Estado</TableHead>
                <TableHead className="sticky right-0 z-10 bg-muted/40 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((business) => {
                const status = getProspectStatus(business, settings.followUpDays)
                const ig = instagramUrl(business.social)
                return (
                  <TableRow
                    key={business.id}
                    className={cn("border-l-4", ROW_STYLES[status])}
                  >
                    <TableCell className="sticky left-0 z-10 bg-inherit font-medium">
                      {business.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {business.category || "—"}
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {business.address || "—"}
                    </TableCell>
                    <TableCell>
                      {hasPhone(business.phone) ? formatPhone(business.phone) : "—"}
                    </TableCell>
                    <TableCell>
                      {business.social ? (
                        ig ? (
                          <a
                            href={ig}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-800 hover:underline"
                          >
                            <AtSign className="size-3.5" />
                            {business.social.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          business.social
                        )
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={business.contacted}
                          onCheckedChange={(checked) =>
                            toggle(business, "contacted", Boolean(checked))
                          }
                          aria-label={`Contactado ${business.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={business.respondedOk}
                          onCheckedChange={(checked) =>
                            toggle(business, "respondedOk", Boolean(checked))
                          }
                          aria-label={`Respondió OK ${business.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={business.respondedNo}
                          onCheckedChange={(checked) =>
                            toggle(business, "respondedNo", Boolean(checked))
                          }
                          aria-label={`Respuesta negativa ${business.name}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="leading-tight">
                        <p className="text-sm">{formatRelative(business.lastMessageAt)}</p>
                        {status === "followup" && (
                          <p className="text-xs font-medium text-amber-800">
                            Pasaron más de {settings.followUpDays} días
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 bg-inherit">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          disabled={!hasPhone(business.phone)}
                          onClick={() => setContact(business)}
                        >
                          <MessageCircle />
                          Contactar
                        </Button>
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
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            Mostrando {rows.length} de {list.businesses.length} negocios
          </p>
        </div>
      )}

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
