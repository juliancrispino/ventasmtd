import { normalizePhone } from "@/lib/phone"
import type { Business } from "@/lib/types"

export function fillTemplate(
  template: string,
  business: Business,
  city: string
): string {
  return template
    .replaceAll("{{nombre}}", business.name || "equipo")
    .replaceAll("{{rubro}}", business.category || "negocio")
    .replaceAll("{{ciudad}}", city || "la zona")
    .replaceAll("{{direccion}}", business.address || "")
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const digits = normalizePhone(phone)
  if (digits.length < 8) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function instagramUrl(social: string): string | null {
  const value = social.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  const handle = value
    .replace(/^@/, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^www\.instagram\.com\//i, "")
    .split(/[/?]/)[0]
  if (!handle) return null
  if (/instagram|facebook|tiktok|maps/i.test(value) && value.includes(".")) {
    return value.startsWith("http") ? value : `https://${value}`
  }
  return `https://instagram.com/${handle}`
}
