"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Download, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  exportBackup,
  importBackup,
  resetDatabase,
  updateSettings,
  useAppStore,
} from "@/lib/store"
import { DEFAULT_WHATSAPP_MESSAGE } from "@/lib/types"

export function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { settings, lists, persistence, claimUrl, cloudError } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState(settings.whatsappMessage)
  const [days, setDays] = useState(String(settings.followUpDays))

  function syncFromStore() {
    setMessage(settings.whatsappMessage)
    setDays(String(settings.followUpDays))
  }

  function save() {
    const followUpDays = Math.max(1, Number(days) || 15)
    updateSettings({ whatsappMessage: message, followUpDays })
    toast.success("Ajustes guardados")
    onOpenChange(false)
  }

  function downloadBackup() {
    const blob = new Blob([exportBackup()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `crm-miturnodigital-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function restoreBackup(file: File | undefined) {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as {
        version?: number
        lists?: unknown
        settings?: unknown
      }
      if (parsed.version !== 1 || !Array.isArray(parsed.lists)) {
        throw new Error("El archivo no es un backup válido.")
      }
      importBackup({
        version: 1,
        lists: parsed.lists as never,
        settings: (parsed.settings as never) ?? settings,
      })
      toast.success("Backup restaurado")
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo leer el backup"
      )
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) syncFromStore()
        onOpenChange(next)
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Mensaje y ajustes</SheetTitle>
          <SheetDescription>
            El mensaje se completa con el nombre, rubro y ciudad de cada
            negocio al abrir WhatsApp.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4">
          <div className="grid gap-2">
            <Label htmlFor="wa-message">Mensaje de WhatsApp</Label>
            <Textarea
              id="wa-message"
              rows={10}
              className="min-h-40"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Variables: {"{{nombre}}"}, {"{{rubro}}"}, {"{{ciudad}}"},{" "}
              {"{{direccion}}"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => setMessage(DEFAULT_WHATSAPP_MESSAGE)}
            >
              Restaurar mensaje original
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="followup-days">Días para recontactar</Label>
            <Input
              id="followup-days"
              type="number"
              min={1}
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si no hubo respuesta OK ni negativa, la fila se marca en
              amarillo cuando pasa este plazo.
            </p>
          </div>
          <div className="grid gap-2 rounded-xl border bg-muted/40 p-3">
            <p className="text-sm font-medium">Base de datos</p>
            <p className="text-xs text-muted-foreground">
              {persistence === "neon"
                ? `Importaciones y ajustes se guardan en Neon (Postgres online). ${lists.length} listas.`
                : `Ahora mismo los datos quedan en este navegador (${lists.length} listas). Conectá Neon para guardarlos online.`}
            </p>
            {cloudError && (
              <p className="text-xs text-rose-700">{cloudError}</p>
            )}
            {claimUrl && (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <a href={claimUrl} target="_blank" rel="noopener noreferrer" />
                }
              >
                Quedarte con esta base (gratis)
              </Button>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadBackup}>
                <Download />
                Descargar backup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload />
                Restaurar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  void resetDatabase()
                  toast.success("Base de datos vaciada")
                  onOpenChange(false)
                }}
              >
                <Trash2 />
                Vaciar base
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => void restoreBackup(event.target.files?.[0])}
              />
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={save}>Guardar ajustes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
