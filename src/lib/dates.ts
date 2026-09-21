const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export function daysSince(iso: string): number {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 0
  return Math.floor((Date.now() - then) / 86_400_000)
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return DATE_FORMAT.format(date)
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "Sin contactar"
  const days = daysSince(iso)
  if (days <= 0) return "Hoy"
  if (days === 1) return "Ayer"
  return `Hace ${days} días`
}

export function parseFlexibleDate(value: unknown): string | null {
  if (value == null || value === "") return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = new Date(Math.round((value - 25569) * 86400 * 1000))
    if (!Number.isNaN(excelEpoch.getTime()) && excelEpoch.getFullYear() > 1990) {
      return excelEpoch.toISOString()
    }
  }
  const text = String(value).trim()
  if (!text) return null
  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  const ar = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (ar) {
    const day = Number(ar[1])
    const month = Number(ar[2])
    const year = Number(ar[3].length === 2 ? `20${ar[3]}` : ar[3])
    const date = new Date(year, month - 1, day)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  return null
}
