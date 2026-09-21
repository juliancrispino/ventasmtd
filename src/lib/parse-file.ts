import Papa from "papaparse"
import { parseFlexibleDate } from "@/lib/dates"
import { CSV_DELIMITER, CSV_HEADERS } from "@/lib/csv"
import type { ParseResult, ParsedRow } from "@/lib/types"

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

const COLUMN_ALIASES: Record<keyof ParsedRow, string[]> = {
  city: ["ciudad", "city", "pueblo", "localidad"],
  name: ["nombre", "name", "negocio", "local", "comercio", "salon"],
  category: ["rubro", "categoria", "category", "tipo", "giro"],
  address: [
    "ubicacion",
    "direccion",
    "address",
    "domicilio",
    "location",
    "calle",
  ],
  phone: [
    "telefono",
    "numero de telefono",
    "numero",
    "phone",
    "whatsapp",
    "celular",
    "tel",
    "celular whatsapp",
  ],
  social: [
    "redes sociales",
    "redes",
    "instagram",
    "social",
    "ig",
    "red social",
  ],
  contacted: ["contactado", "contacted"],
  respondedOk: [
    "respondio ok",
    "respondiook",
    "interesado",
    "respuesta ok",
  ],
  respondedNo: [
    "respondio negativo",
    "respuesta negativa",
    "negativo",
    "respondiendo negativo",
    "respondiendo negati",
  ],
  lastMessageAt: [
    "ultimo mensaje",
    "ultimo mensaje enviado",
    "last message",
    "fecha ultimo",
    "fecha de contacto",
  ],
}

function matchField(header: string): keyof ParsedRow | null {
  const key = normalizeKey(header)
  if (!key || key === "contactar") return null
  const entries = Object.entries(COLUMN_ALIASES) as [keyof ParsedRow, string[]][]
  for (const [field, aliases] of entries) {
    if (aliases.some((alias) => key === alias)) return field
  }
  for (const [field, aliases] of entries) {
    if (aliases.some((alias) => key.startsWith(`${alias} `))) return field
  }
  return null
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value
  const text = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return ["true", "1", "si", "yes", "ok", "x", "verdadero"].includes(text)
}

function cellText(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }
  return String(value).trim()
}

function mapRows(rawRows: Record<string, unknown>[]): ParseResult {
  const detectedColumns = rawRows[0] ? Object.keys(rawRows[0]) : []
  const headerToField = new Map<string, keyof ParsedRow>()
  const mappedFields = new Set<keyof ParsedRow>()
  for (const header of detectedColumns) {
    const field = matchField(header)
    if (field && !mappedFields.has(field)) {
      headerToField.set(header, field)
      mappedFields.add(field)
    }
  }

  const warnings: string[] = []
  if (!mappedFields.has("name")) {
    warnings.push(
      "No encontré una columna de nombre. Descargá el molde CSV y copiá exactamente esos encabezados."
    )
  }
  if (!mappedFields.has("phone")) {
    warnings.push(
      "No encontré una columna de teléfono. En el molde se llama “numero de telefono”."
    )
  }
  if (!mappedFields.has("city")) {
    warnings.push(
      "No encontré la columna ciudad. Si no la completás acá, tenés que indicar la ciudad antes de importar."
    )
  }

  const firstHeader = detectedColumns[0]
  const rows: ParsedRow[] = []
  let skipped = 0

  for (const raw of rawRows) {
    const get = (field: keyof ParsedRow) => {
      for (const [header, mapped] of headerToField.entries()) {
        if (mapped === field) return raw[header]
      }
      return undefined
    }

    const name =
      cellText(get("name")) || (firstHeader ? cellText(raw[firstHeader]) : "")
    const category = cellText(get("category"))
    const address = cellText(get("address"))
    const phone = cellText(get("phone"))
    const social = cellText(get("social"))
    const city = cellText(get("city"))

    if (!name && !phone && !address) {
      skipped += 1
      continue
    }

    rows.push({
      city,
      name: name || "Sin nombre",
      category,
      address,
      phone,
      social,
      contacted: parseBoolean(get("contacted")),
      respondedOk: parseBoolean(get("respondedOk")),
      respondedNo: parseBoolean(get("respondedNo")),
      lastMessageAt: parseFlexibleDate(get("lastMessageAt")),
    })
  }

  if (rows.length === 0) {
    warnings.push("El archivo no tiene filas con datos para importar.")
  }

  return { rows, skipped, detectedColumns, warnings }
}

function parseCsv(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, unknown>>(text.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  })
  if (parsed.errors.length && !parsed.data.length) {
    return {
      rows: [],
      skipped: 0,
      detectedColumns: [],
      warnings: [
        parsed.errors[0]?.message || "No se pudo leer el CSV. Usá el molde de la página.",
      ],
    }
  }
  return mapRows(parsed.data.filter((row) => row && Object.keys(row).length > 0))
}

export async function parseProspectFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase()
  const isCsv =
    name.endsWith(".csv") ||
    name.endsWith(".txt") ||
    file.type.includes("csv") ||
    file.type === "text/plain"

  if (isCsv) {
    return parseCsv(await file.text())
  }

  const XLSX = await import("xlsx")
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return {
      rows: [],
      skipped: 0,
      detectedColumns: [],
      warnings: ["El Excel no tiene hojas."],
    }
  }
  const sheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  })
  return mapRows(json)
}

export function toCsv(
  rows: Array<{
    city?: string
    name: string
    category: string
    address: string
    phone: string
    social: string
    contacted: boolean
    respondedOk: boolean
    respondedNo: boolean
    lastMessageAt: string | null
  }>,
  cityFallback = ""
): string {
  return Papa.unparse(
    {
      fields: [...CSV_HEADERS],
      data: rows.map((row) => [
        row.city || cityFallback,
        row.name,
        row.category,
        row.address,
        row.phone,
        row.social,
        row.contacted ? "TRUE" : "FALSE",
        row.respondedOk ? "TRUE" : "FALSE",
        row.respondedNo ? "TRUE" : "FALSE",
        row.lastMessageAt ?? "",
      ]),
    },
    { delimiter: CSV_DELIMITER }
  )
}

export function templateCsv(): string {
  return Papa.unparse({ fields: [...CSV_HEADERS], data: [] }, { delimiter: CSV_DELIMITER })
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([`\uFEFF${content}`], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
