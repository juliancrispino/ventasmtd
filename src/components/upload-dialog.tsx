"use client"

import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Download, FileSpreadsheet, MapPin, Upload } from "lucide-react"
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
import { importRows } from "@/lib/store"
import { parseProspectFile } from "@/lib/parse-file"
import { DATOS_PRUEBA_PATH, MOLDE_PATH } from "@/lib/csv"
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [detected, setDetected] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)

  const citiesInFile = useMemo(() => {
    const names = new Set(
      rows.map((row) => row.city.trim()).filter(Boolean)
    )
    return [...names]
  }, [rows])

  function reset() {
    setTitle("")
    setFileName("")
    setRows([])
    setWarnings([])
    setDetected([])
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
      const fileCities = [
        ...new Set(result.rows.map((row) => row.city.trim()).filter(Boolean)),
      ]
      if (!title && !appendToListId && fileCities.length === 1) {
        setTitle(fileCities[0])
      }
      if (result.rows.length) {
        toast.success(`${result.rows.length} negocios leídos de ${file.name}`)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo. Usá el molde CSV."
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
    const missingCity = rows.some((row) => !row.city.trim())
    if (!appendToListId && missingCity && !title.trim()) {
      toast.error("Completá la ciudad o usá el molde con la columna ciudad.")
      return
    }
    const result = importRows(rows, fileName, {
      appendToListId,
      fallbackCity: title.trim() || undefined,
    })
    toast.success(
      `Se importaron ${result.added} negocios en ${result.listsTouched.join(", ")}.`
    )
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
            {appendToListId ? "Agregar archivo a esta lista" : "Importar CSV"}
          </DialogTitle>
          <DialogDescription>
            Usá el molde para que las columnas coincidan siempre. Si el archivo
            trae la columna ciudad, se arma una lista por cada pueblo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={MOLDE_PATH} download="molde-negocios.csv" />}
            >
              <Download />
              Descargar molde
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={DATOS_PRUEBA_PATH} download="datos-prueba-mar-del-plata.csv" />}
            >
              <Download />
              CSV de prueba
            </Button>
          </div>

          {!appendToListId && (
            <div className="grid gap-2">
              <Label htmlFor="city-title">Ciudad o pueblo (si no viene en el CSV)</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="city-title"
                  className="pl-8"
                  placeholder="Mar del Plata, Tandil, Balcarce…"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
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
              {fileName || "Arrastrá el CSV del molde, o hacé clic para elegir"}
            </span>
            <span className="text-xs text-muted-foreground">
              Columnas: ciudad; nombre; rubro; ubicacion; numero de telefono;
              redes sociales
            </span>
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

          {citiesInFile.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Ciudades en el archivo: {citiesInFile.join(" · ")}
            </p>
          )}

          {detected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Columnas detectadas: {detected.join(" · ")}
            </p>
          )}

          {rows.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <div className="bg-muted/60 px-3 py-2 text-xs">
                Vista previa · {rows.length} filas
              </div>
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-1.5 font-medium">Ciudad</th>
                      <th className="px-3 py-1.5 font-medium">Nombre</th>
                      <th className="px-3 py-1.5 font-medium">Rubro</th>
                      <th className="px-3 py-1.5 font-medium">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 8).map((row, index) => (
                      <tr key={`${row.name}-${index}`} className="border-b last:border-0">
                        <td className="px-3 py-1.5">{row.city || title || "—"}</td>
                        <td className="px-3 py-1.5 font-medium">{row.name}</td>
                        <td className="px-3 py-1.5">{row.category || "—"}</td>
                        <td className="px-3 py-1.5">{row.phone || "—"}</td>
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
            Importar a la base
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
