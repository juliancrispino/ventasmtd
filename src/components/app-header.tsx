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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[oklch(0.28_0.045_200)] text-white">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal-400 text-[oklch(0.22_0.05_200)] shadow-sm">
            <CalendarCheck className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">
              Mi Turno Digital
            </span>
            <span className="block truncate text-xs text-white/65">
              CRM de prospección
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
            nativeButton={false}
            render={<a href={MOLDE_PATH} download="molde-negocios.csv" />}
          >
            <Download />
            <span className="hidden sm:inline">Molde CSV</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 />
            <span className="hidden sm:inline">Mensaje y ajustes</span>
          </Button>
          <Button
            size="sm"
            className="bg-teal-400 text-[oklch(0.22_0.05_200)] hover:bg-teal-300"
            onClick={() => setUploadOpen(true)}
          >
            <Upload />
            Importar CSV
          </Button>
        </div>
      </div>
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  )
}
