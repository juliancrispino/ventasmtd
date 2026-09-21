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

export { instagramUrl, socialUrl } from "@/lib/social"
