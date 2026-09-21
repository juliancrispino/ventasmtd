"use client"

import { useMemo, useState } from "react"
import { Download, FolderOpen, Search, Upload } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { ListCard } from "@/components/list-card"
import { StatsCards } from "@/components/stats-cards"
import { UploadDialog } from "@/components/upload-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { allStats } from "@/lib/status"
import { useAppStore } from "@/lib/store"
import { DATOS_PRUEBA_PATH, MOLDE_PATH } from "@/lib/csv"

export function Dashboard() {
  const { lists, settings, hydrated } = useAppStore()
  const [query, setQuery] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const stats = allStats(lists, settings)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return lists
    return lists.filter((list) =>
      [list.title, list.sourceFileName, ...list.businesses.map((item) => item.name)]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    )
  }, [lists, query])

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6">
        <div>
            <p className="text-sm font-medium text-teal-800">
              Prospección comercial
            </p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
              Listas por ciudad
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Importá el CSV del molde y contactá por WhatsApp para presentar{" "}
              <a
                href="https://miturnodigital.com.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-800 underline underline-offset-2"
              >
                miturnodigital.com.ar
              </a>
              .
            </p>
        </div>

        {hydrated ? <StatsCards stats={stats} followUpDays={settings.followUpDays} /> : <StatsSkeleton />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 bg-white pl-8 text-base md:text-sm"
              placeholder="Buscar ciudad o negocio…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {lists.length} {lists.length === 1 ? "lista" : "listas"}
          </p>
        </div>

        {!hydrated ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-xl bg-white/80 ring-1 ring-foreground/10"
              />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              <FolderOpen className="size-6" />
            </span>
            <h2 className="text-lg font-semibold">La base está vacía</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Descargá el molde CSV, completalo (o usá el archivo de prueba de
              Mar del Plata) e importalo. Cada ciudad arma su lista y todo
              queda en la base Neon (Postgres online).
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={MOLDE_PATH} download="molde-negocios.csv" />}
            >
                <Download />
                Descargar molde
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href={DATOS_PRUEBA_PATH} download="datos-prueba-mar-del-plata.csv" />}
              >
                <Download />
                CSV de prueba
              </Button>
              <Button onClick={() => setUploadOpen(true)}>
                <Upload />
                Importar CSV
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">Ninguna lista coincide</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Probá con otro nombre de ciudad o negocio.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((list) => (
              <ListCard key={list.id} list={list} settings={settings} />
            ))}
          </div>
        )}
      </main>
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl bg-white/80 ring-1 ring-foreground/10"
        />
      ))}
    </div>
  )
}
