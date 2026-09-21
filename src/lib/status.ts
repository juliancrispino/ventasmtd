import { daysSince } from "@/lib/dates"
import type { Business, CityList, ProspectStatus, Settings } from "@/lib/types"

export function getProspectStatus(
  business: Business,
  followUpDays: number
): ProspectStatus {
  if (business.respondedOk) return "ok"
  if (business.respondedNo) return "no"
  if (business.lastMessageAt) {
    return daysSince(business.lastMessageAt) >= followUpDays
      ? "followup"
      : "recent"
  }
  if (business.contacted) return "recent"
  return "pending"
}

export const STATUS_LABEL: Record<ProspectStatus, string> = {
  pending: "Pendiente",
  recent: "Contactado",
  followup: "Recontactar",
  ok: "Respondió OK",
  no: "Respuesta negativa",
}

export function listStats(list: CityList, followUpDays: number) {
  return summarize(list.businesses, followUpDays)
}

export function summarize(businesses: Business[], followUpDays: number) {
  const stats = {
    total: businesses.length,
    pending: 0,
    recent: 0,
    followup: 0,
    ok: 0,
    no: 0,
    withPhone: 0,
  }
  for (const business of businesses) {
    stats[getProspectStatus(business, followUpDays)] += 1
    if (business.phone.trim()) stats.withPhone += 1
  }
  return stats
}

export function allStats(lists: CityList[], settings: Settings) {
  return summarize(
    lists.flatMap((list) => list.businesses),
    settings.followUpDays
  )
}
