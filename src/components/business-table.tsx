"use client"

import { useMemo, useState } from "react"
import { Search, Trash2 } from "lucide-react"
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
import { AddBusinessDialog } from "@/components/add-business-dialog"
import { StatusBadge } from "@/components/status-badge"
import { deleteBusiness, updateBusiness } from "@/lib/store"
import { hasPhone } from "@/lib/phone"
import { formatRelative } from "@/lib/dates"
import { getProspectStatus } from "@/lib/status"
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

const ROW_BG: Record<ProspectStatus, string> = {
  pending: "bg-white",
  recent: "bg-sky-50",
  followup: "bg-amber-50",
  ok: "bg-emerald-50",
  no: "bg-rose-50",
}

const ROW_BORDER: Record<ProspectStatus, string> = {
  pending: "border-l-zinc-400",
  recent: "border-l-sky-500",
  followup: "border-l-amber-500",
  ok: "border-l-emerald-500",
  no: "border-l-rose-500",
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
  const [editing, setEditing] = useState<Business | null>(null)

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
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 bg-white pl-9 text-base lg:h-8 lg:text-sm"
            placeholder="Buscar nombre, teléfono, rubro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <select
            className="h-11 w-full rounded-lg border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-8 lg:w-auto lg:text-sm"
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

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            className="h-8 min-w-0 px-2.5"
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
        <>
          <div className="space-y-1.5 lg:hidden">
            {rows.map((business) => {
              const status = getProspectStatus(business, settings.followUpDays)
              return (
                <article
                  key={business.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border border-l-4 py-1.5 pr-1 pl-2",
                    ROW_BG[status],
                    ROW_BORDER[status]
                  )}
                >
                  <div
                    className="min-w-0 flex-1"
                    onClick={() => setEditing(business)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setEditing(business)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <p className="truncate text-sm font-semibold leading-tight">
                      {business.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground leading-tight">
                      {business.category || "Sin rubro"}
                      {status === "followup" ? " · recontactar" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <EmojiToggle
                      emoji="✏️"
                      label={`Editar ${business.name}`}
                      onPressedChange={() => setEditing(business)}
                    />
                    <EmojiToggle
                      emoji="📤"
                      label={`Contactado ${business.name}`}
                      pressed={business.contacted}
                      onPressedChange={(pressed) =>
                        toggle(business, "contacted", pressed)
                      }
                    />
                    <EmojiToggle
                      emoji="👍"
                      label={`Respondió OK ${business.name}`}
                      pressed={business.respondedOk}
                      tone="ok"
                      onPressedChange={(pressed) =>
                        toggle(business, "respondedOk", pressed)
                      }
                    />
                    <EmojiToggle
                      emoji="👎"
                      label={`Respuesta negativa ${business.name}`}
                      pressed={business.respondedNo}
                      tone="no"
                      onPressedChange={(pressed) =>
                        toggle(business, "respondedNo", pressed)
                      }
                    />
                    <EmojiToggle
                      emoji="💬"
                      label={`WhatsApp ${business.name}`}
                      disabled={!hasPhone(business.phone)}
                      onPressedChange={() => setContact(business)}
                    />
                  </div>
                </article>
              )
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rubro</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Redes</TableHead>
                  <TableHead className="text-center">Contactado</TableHead>
                  <TableHead className="text-center">OK</TableHead>
                  <TableHead className="text-center">Negativa</TableHead>
                  <TableHead>Último mensaje</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((business) => {
                  const status = getProspectStatus(business, settings.followUpDays)
                  return (
                    <TableRow
                      key={business.id}
                      className={cn("border-l-4", ROW_BG[status], ROW_BORDER[status])}
                    >
                      <TableCell className="min-w-44">
                        <TableField
                          value={business.name}
                          ariaLabel={`Nombre de ${business.name}`}
                          onSave={(name) => {
                            if (!name) {
                              toast.error("El nombre no puede quedar vacío.")
                              return
                            }
                            updateBusiness(list.id, business.id, { name })
                          }}
                        />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <TableField
                          value={business.category}
                          ariaLabel={`Rubro de ${business.name}`}
                          placeholder="Rubro"
                          onSave={(category) =>
                            updateBusiness(list.id, business.id, { category })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-48">
                        <TableField
                          value={business.address}
                          ariaLabel={`Ubicación de ${business.name}`}
                          placeholder="Ubicación"
                          onSave={(address) =>
                            updateBusiness(list.id, business.id, { address })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-40">
                        <TableField
                          value={business.phone}
                          ariaLabel={`Teléfono de ${business.name}`}
                          placeholder="WhatsApp"
                          onSave={(phone) =>
                            updateBusiness(list.id, business.id, { phone })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-36">
                        <TableField
                          value={business.social}
                          ariaLabel={`Redes de ${business.name}`}
                          placeholder="@instagram"
                          onSave={(social) =>
                            updateBusiness(list.id, business.id, { social })
                          }
                        />
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
                              Más de {settings.followUpDays} días
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            disabled={!hasPhone(business.phone)}
                            onClick={() => setContact(business)}
                          >
                            💬 Contactar
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
          </div>
        </>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        Mostrando {rows.length} de {list.businesses.length} negocios.
        En la computadora, hacé clic en un dato para corregirlo. En el celular,
        tocá el nombre o ✏️.
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
      <AddBusinessDialog
        key={editing?.id ?? "edit-closed"}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        listId={list.id}
        business={editing}
      />
    </div>
  )
}

function TableField({
  value,
  onSave,
  placeholder,
  ariaLabel,
}: {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  ariaLabel: string
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(value)

  return (
    <Input
      aria-label={ariaLabel}
      className="h-8 min-w-32 border-transparent bg-transparent px-1.5 shadow-none hover:border-input focus-visible:border-ring"
      value={focused ? draft : value}
      placeholder={placeholder || "—"}
      onFocus={() => {
        setDraft(value)
        setFocused(true)
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        setFocused(false)
        const next = draft.trim()
        if (next !== value.trim()) onSave(next)
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur()
        }
        if (event.key === "Escape") {
          setDraft(value)
          event.currentTarget.blur()
        }
      }}
    />
  )
}

function EmojiToggle({
  emoji,
  label,
  pressed,
  disabled,
  tone,
  onPressedChange,
}: {
  emoji: string
  label: string
  pressed?: boolean
  disabled?: boolean
  tone?: "ok" | "no"
  onPressedChange: (pressed: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "flex size-9 items-center justify-center rounded-md text-[17px] leading-none",
        pressed && tone === "ok" && "bg-emerald-200",
        pressed && tone === "no" && "bg-rose-200",
        pressed && !tone && "bg-teal-200",
        !pressed && "bg-transparent",
        disabled && "opacity-35"
      )}
    >
      {emoji}
    </button>
  )
}
