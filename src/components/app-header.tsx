"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarCheck, Download, Settings2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadDialog } from "@/components/upload-dialog"
import { SettingsSheet } from "@/components/settings-sheet"
import { MOLDE_PATH } from "@/lib/csv"

export function AppHeader() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[oklch(0.28_0.045_200)] pt-[env(safe-area-inset-top)] text-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-400 text-[oklch(0.22_0.05_200)] sm:size-9 sm:rounded-xl">
            <CalendarCheck className="size-4 sm:size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">
              Mi Turno Digital
            </span>
            <span className="hidden truncate text-xs text-white/65 sm:block">
              CRM de prospección
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10 hover:text-white sm:hidden"
            nativeButton={false}
            render={<a href={MOLDE_PATH} download="molde-negocios.csv" />}
            aria-label="Descargar molde CSV"
          >
            <Download />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            nativeButton={false}
            render={<a href={MOLDE_PATH} download="molde-negocios.csv" />}
          >
            <Download />
            Molde CSV
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setSettingsOpen(true)}
            aria-label="Mensaje y ajustes"
          >
            <Settings2 />
          </Button>
          <Button
            size="sm"
            className="h-8 bg-teal-400 px-2.5 text-[oklch(0.22_0.05_200)] hover:bg-teal-300 sm:h-8 sm:px-2.5"
            onClick={() => setUploadOpen(true)}
          >
            <Upload />
            Importar
          </Button>
        </div>
      </div>
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  )
}
