import { neon } from "@neondatabase/serverless"
import { DEFAULT_SETTINGS, type CityList, type Settings } from "@/lib/types"

export type CrmSnapshot = {
  lists: CityList[]
  settings: Settings
}

type ListaRow = {
  id: string
  titulo: string
  archivo_origen: string | null
  created_at: Date | string
  updated_at: Date | string
}

type NegocioRow = {
  id: string
  lista_id: string
  nombre: string
  rubro: string
  ubicacion: string
  whatsapp: string
  redes: string
  contactado: boolean
  respondio_ok: boolean
  respuesta_negativa: boolean
  ultimo_mensaje: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

type ConfigRow = {
  id: number
  mensaje_whatsapp: string
  dias_recontacto: number
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString()
}

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString()
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim())
}

export function getClaimUrl() {
  return (
    process.env.PUBLIC_POSTGRES_CLAIM_URL?.trim() ||
    process.env.NEXT_PUBLIC_POSTGRES_CLAIM_URL?.trim() ||
    null
  )
}

function getSql() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) return null
  return neon(url)
}

export async function loadCrmSnapshot(): Promise<CrmSnapshot | null> {
  const sql = getSql()
  if (!sql) return null

  const [listas, negocios, config] = (await Promise.all([
    sql`SELECT id, titulo, archivo_origen, created_at, updated_at FROM listas ORDER BY updated_at DESC`,
    sql`SELECT id, lista_id, nombre, rubro, ubicacion, whatsapp, redes, contactado, respondio_ok, respuesta_negativa, ultimo_mensaje, created_at, updated_at FROM negocios`,
    sql`SELECT id, mensaje_whatsapp, dias_recontacto FROM configuracion WHERE id = 1`,
  ])) as [ListaRow[], NegocioRow[], ConfigRow[]]

  const byList = new Map<string, NegocioRow[]>()
  for (const row of negocios) {
    const current = byList.get(row.lista_id) ?? []
    current.push(row)
    byList.set(row.lista_id, current)
  }

  const lists: CityList[] = listas.map((list) => ({
    id: list.id,
    title: list.titulo,
    createdAt: toIso(list.created_at),
    updatedAt: toIso(list.updated_at),
    sourceFileName: list.archivo_origen ?? undefined,
    businesses: (byList.get(list.id) ?? []).map((item) => ({
      id: item.id,
      name: item.nombre,
      category: item.rubro,
      address: item.ubicacion,
      phone: item.whatsapp,
      social: item.redes,
      contacted: item.contactado,
      respondedOk: item.respondio_ok,
      respondedNo: item.respuesta_negativa,
      lastMessageAt: toIsoOrNull(item.ultimo_mensaje),
    })),
  }))

  const settingsRow = config[0]
  return {
    lists,
    settings: {
      whatsappMessage: settingsRow?.mensaje_whatsapp || DEFAULT_SETTINGS.whatsappMessage,
      followUpDays: settingsRow?.dias_recontacto || DEFAULT_SETTINGS.followUpDays,
    },
  }
}

export async function saveCrmSnapshot(snapshot: CrmSnapshot) {
  const sql = getSql()
  if (!sql) {
    throw new Error("Falta DATABASE_URL. Creá una base Neon gratuita.")
  }

  const queries = [
    sql`DELETE FROM negocios`,
    sql`DELETE FROM listas`,
  ]

  for (const list of snapshot.lists) {
    queries.push(sql`
      INSERT INTO listas (id, titulo, archivo_origen, created_at, updated_at)
      VALUES (
        ${list.id},
        ${list.title},
        ${list.sourceFileName ?? null},
        ${list.createdAt},
        ${list.updatedAt}
      )
    `)
    for (const business of list.businesses) {
      queries.push(sql`
        INSERT INTO negocios (
          id, lista_id, nombre, rubro, ubicacion, whatsapp, redes,
          contactado, respondio_ok, respuesta_negativa, ultimo_mensaje
        ) VALUES (
          ${business.id},
          ${list.id},
          ${business.name},
          ${business.category},
          ${business.address},
          ${business.phone},
          ${business.social},
          ${business.contacted},
          ${business.respondedOk},
          ${business.respondedNo},
          ${business.lastMessageAt}
        )
      `)
    }
  }

  queries.push(sql`
    INSERT INTO configuracion (id, mensaje_whatsapp, dias_recontacto)
    VALUES (1, ${snapshot.settings.whatsappMessage}, ${snapshot.settings.followUpDays})
    ON CONFLICT (id) DO UPDATE SET
      mensaje_whatsapp = EXCLUDED.mensaje_whatsapp,
      dias_recontacto = EXCLUDED.dias_recontacto,
      updated_at = now()
  `)

  await sql.transaction(queries)
}
