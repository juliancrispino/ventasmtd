export type Business = {
  id: string
  name: string
  category: string
  address: string
  phone: string
  social: string
  contacted: boolean
  respondedOk: boolean
  respondedNo: boolean
  lastMessageAt: string | null
}

export type CityList = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  sourceFileName?: string
  businesses: Business[]
}

export type Settings = {
  whatsappMessage: string
  followUpDays: number
}

export type PersistenceMode = "neon" | "local"

export type AppState = {
  version: 1
  lists: CityList[]
  settings: Settings
  hydrated: boolean
  persistence: PersistenceMode
  claimUrl: string | null
  cloudError: string | null
}

export type ProspectStatus = "pending" | "recent" | "followup" | "ok" | "no"

export type ParsedRow = {
  city: string
  name: string
  category: string
  address: string
  phone: string
  social: string
  contacted: boolean
  respondedOk: boolean
  respondedNo: boolean
  lastMessageAt: string | null
}

export type ParseResult = {
  rows: ParsedRow[]
  skipped: number
  detectedColumns: string[]
  warnings: string[]
}

export const DEFAULT_WHATSAPP_MESSAGE = `Hola {{nombre}}! 👋
Soy de Mi Turno Digital (https://miturnodigital.com.ar). Vi su {{rubro}} en {{ciudad}} y les escribo porque nuestro sistema de turnos online les puede servir para que sus clientas reserven 24/7 desde el celular, sin mensajes ni llamadas perdidas.

¿Les interesa que les cuente cómo funciona? Es simple de usar y se adapta a peluquerías, centros de estética y peluquerías caninas.`

export const DEFAULT_SETTINGS: Settings = {
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  followUpDays: 15,
}
