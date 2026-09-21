"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Download,
  FilePlus2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AddBusinessDialog } from "@/components/add-business-dialog"
import { BusinessTable } from "@/components/business-table"
import { StatsCards } from "@/components/stats-cards"
import { UploadDialog } from "@/components/upload-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteList, renameList, useAppStore } from "@/lib/store"
import { listStats } from "@/lib/status"
import { downloadTextFile, toCsv } from "@/lib/parse-file"

export function ListDetail({ listId }: { listId: string }) {
  const router = useRouter()
  const { lists, settings, hydrated } = useAppStore()
  const list = lists.find((item) => item.id === listId)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(list?.title ?? "")

  if (!hydrated) {
    return (
      <div className="flex min-h-full flex-col">
        <AppHeader />
        <div className="mx-auto w-full max-w-[1400px] px-4 py-10">
          <div className="h-40 animate-pulse rounded-xl bg-white/80 ring-1 ring-foreground/10" />
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="flex min-h-full flex-col">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 text-center">
          <h1 className="text-xl font-semibold">No encontramos esta lista</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Puede que la hayas borrado o que estés en otro navegador.
          </p>
          <Link href="/" className={buttonVariants()}>
            Volver al inicio
          </Link>
        </main>
      </div>
    )
  }

  const stats = listStats(list, settings.followUpDays)

  function exportCsv() {
    if (!list) return
    const csv = toCsv(list.businesses, list.title)
    downloadTextFile(
      `${list.title.toLowerCase().replace(/\s+/g, "-")}.csv`,
      csv
    )
  }

  function saveTitle() {
    if (!list) return
    const next = title.trim()
    if (!next) {
      toast.error("La ciudad no puede quedar vacía.")
      return
    }
    renameList(list.id, next)
    setEditing(false)
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Todas las listas
          </Link>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              {editing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-10 max-w-sm bg-white text-lg font-semibold"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveTitle()
                      if (event.key === "Escape") {
                        setTitle(list.title)
                        setEditing(false)
                      }
                    }}
                  />
                  <Button size="sm" onClick={saveTitle}>
                    Guardar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {list.title}
                  </h1>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Renombrar ciudad"
                    onClick={() => {
                      setTitle(list.title)
                      setEditing(true)
                    }}
                  >
                    <Pencil />
                  </Button>
                </div>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Contactá negocios de {list.title} para presentar Mi Turno Digital.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                <Plus />
                Negocio
              </Button>
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <FilePlus2 />
                Sumar archivo
              </Button>
              <Button variant="outline" onClick={exportCsv}>
                <Download />
                Exportar CSV
              </Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 />
                Borrar lista
              </Button>
            </div>
          </div>
        </div>

        <StatsCards stats={stats} followUpDays={settings.followUpDays} />
        <BusinessTable list={list} settings={settings} />
      </main>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        appendToListId={list.id}
      />
      <AddBusinessDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        listId={list.id}
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar la lista de {list.title}?</DialogTitle>
            <DialogDescription>
              Se eliminan {list.businesses.length} negocios y el seguimiento de
              contactos. Esta acción no se puede deshacer, salvo que tengas un
              backup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteList(list.id)
                toast.success(`Lista ${list.title} eliminada`)
                router.push("/")
              }}
            >
              Borrar lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
