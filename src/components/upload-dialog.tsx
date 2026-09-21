"use client"

import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { FileSpreadsheet, MapPin, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  addList,
  appendRows,
  countAppended,
  createListFromRows,
  useAppStore,
} from "@/lib/store"
import { parseProspectFile } from "@/lib/parse-file"
import type { ParsedRow } from "@/lib/types"
import { cn } from "@/lib/utils"

type UploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appendToListId?: string
}

export function UploadDialog({
  open,
  onOpenChange,
  appendToListId,
}: UploadDialogProps) {
  const { lists } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [detected, setDetected] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [targetListId, setTargetListId] = useState(appendToListId ?? "new")

  const targetList = lists.find((list) => list.id === targetListId)

  const duplicateInfo = useMemo(() => {
    if (targetListId === "new") return null
    return countAppended(targetListId, rows)
  }, [targetListId, rows])

  function reset() {
    setTitle("")
    setFileName("")
    setRows([])
    setWarnings([])
    setDetected([])
    setTargetListId(appendToListId ?? "new")
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    setParsing(true)
    try {
      const result = await parseProspectFile(file)
      setFileName(file.name)
      setRows(result.rows)
      setWarnings(result.warnings)
      setDetected(result.detectedColumns)
      if (!title && !appendToListId) {
        const guessed = file.name
          .replace(/\.(csv|xlsx|xls|txt)$/i, "")
          .replace(/[-_]+/g, " ")
        setTitle(guessed)
      }
      if (result.rows.length) {
        toast.success(`${result.rows.length} negocios leídos de ${file.name}`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo. Probá CSV o Excel."
      )
    } finally {
      setParsing(false)
    }
  }

  function handleImport() {
    if (!rows.length) {
      toast.error("Cargá un CSV o Excel antes de importar.")
      return
    }
    if (targetListId === "new") {
      const city = title.trim()
      if (!city) {
        toast.error("Indicá la ciudad o pueblo de esta lista.")
        return
      }
      const list = createListFromRows(city, rows, fileName)
      addList(list)
      toast.success(`Lista “${city}” creada con ${rows.length} negocios.`)
    } else if (targetList) {
      const { added, duplicates } = countAppended(targetListId, rows)
      appendRows(targetListId, rows, fileName)
      toast.success(
        `Se agregaron ${added} negocios a ${targetList.title}${
          duplicates ? ` (${duplicates} duplicados por teléfono omitidos)` : ""
        }.`
      )
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {appendToListId ? "Agregar archivo a esta lista" : "Cargar lista de negocios"}
          </DialogTitle>
          <DialogDescription>
            Subí un CSV o Excel con nombre, rubro, ubicación, teléfono y redes.
            Cada lista se agrupa por ciudad o pueblo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {!appendToListId && (
            <div className="grid gap-2">
              <Label htmlFor="city-title">Ciudad o pueblo</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="city-title"
                  className="pl-8"
                  placeholder="Mar del Plata, Tandil, Balcarce…"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setTargetListId("new")
                  }}
                />
              </div>
            </div>
          )}

          {!appendToListId && lists.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="target-list">Destino</Label>
              <select
                id="target-list"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={targetListId}
                onChange={(event) => setTargetListId(event.target.value)}
              >
                <option value="new">Crear lista nueva</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    Agregar a {list.title} ({list.businesses.length})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              void handleFile(event.dataTransfer.files[0])
            }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
              dragging
                ? "border-teal-600 bg-teal-50"
                : "border-border bg-muted/40 hover:bg-muted"
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-teal-100 text-teal-800">
              {parsing ? (
                <Upload className="size-5 animate-pulse" />
              ) : (
                <FileSpreadsheet className="size-5" />
              )}
            </span>
            <span className="text-sm font-medium">
              {fileName || "Arrastrá un CSV o Excel, o hacé clic para elegir"}
            </span>
            <span className="text-xs text-muted-foreground">
              Columnas esperadas: nombre, rubro, ubicacion, numero de teléfono,
              redes sociales
            </span>
            <a
              href="/plantilla-negocios.csv"
              onClick={(event) => event.stopPropagation()}
              className="text-xs font-medium text-teal-800 underline underline-offset-2"
            >
              Descargar plantilla CSV
            </a>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />

          {warnings.map((warning) => (
            <p key={warning} className="text-xs text-amber-800">
              {warning}
            </p>
          ))}

          {detected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Columnas detectadas: {detected.join(" · ")}
            </p>
          )}

          {rows.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between bg-muted/60 px-3 py-2 text-xs">
                <span>
                  Vista previa · {rows.length} filas
                  {duplicateInfo
                    ? ` · ${duplicateInfo.added} nuevas, ${duplicateInfo.duplicates} duplicadas`
                    : ""}
                </span>
              </div>
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-1.5 font-medium">Nombre</th>
                      <th className="px-3 py-1.5 font-medium">Rubro</th>
                      <th className="px-3 py-1.5 font-medium">Teléfono</th>
                      <th className="hidden px-3 py-1.5 font-medium sm:table-cell">
                        Ubicación
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row, index) => (
                      <tr key={`${row.name}-${index}`} className="border-b last:border-0">
                        <td className="px-3 py-1.5 font-medium">{row.name}</td>
                        <td className="px-3 py-1.5">{row.category || "—"}</td>
                        <td className="px-3 py-1.5">{row.phone || "—"}</td>
                        <td className="hidden px-3 py-1.5 sm:table-cell">
                          {row.address || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!rows.length || parsing}>
            {targetListId === "new" ? "Crear lista" : "Agregar a la lista"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
