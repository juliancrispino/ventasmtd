const NEXT_NETWORK_LABEL =
  /\s+(?:instagram|insta|ig|facebook|fb|tiktok)\s*[:\-–]/i

function labeledRemainder(value: string, labels: string[]): string | null {
  const names = labels.join("|")
  const match = value.match(
    new RegExp(`(?:^|[\\s,;|/])(?:${names})\\s*[:\\-–]\\s*(.+)`, "i")
  )
  if (!match?.[1]) return null
  return match[1].split(NEXT_NETWORK_LABEL)[0].trim()
}

function firstAtHandle(value: string): string | null {
  const match = value.match(/@([A-Za-z0-9._]+)/)
  return match?.[1] ?? null
}

function stripUrlTracking(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    ;["utm_source", "utm_medium", "utm_campaign", "igshid", "igsh"].forEach((key) => {
      parsed.searchParams.delete(key)
    })
    const search = parsed.searchParams.toString()
    parsed.search = search ? `?${search}` : ""
    return parsed.toString().replace(/\/$/, "")
  } catch {
    return url.replace(/\/$/, "")
  }
}

function instagramHandleFrom(text: string): string | null {
  const value = text.trim()
  if (!value) return null

  const fromAt = firstAtHandle(value)
  if (fromAt) return fromAt

  const urlMatch = value.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i
  )
  if (urlMatch?.[1] && !/^instagram$/i.test(urlMatch[1])) return urlMatch[1]

  const token = value
    .replace(/^https?:\/\//i, "")
    .replace(/^(?:www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#\s,;|]+/)[0]
    ?.replace(/[.,;:]+$/, "")

  if (token && /^[A-Za-z0-9._]+$/.test(token) && !/^(instagram|www)$/i.test(token)) {
    return token
  }
  return null
}

function facebookTargetFrom(text: string): string | null {
  const value = text.trim()
  if (!value) return null

  const fullUrl = value.match(
    /https?:\/\/(?:www\.)?(?:facebook\.com|fb\.com|fb\.me)\/[^\s]+/i
  )
  if (fullUrl) return stripUrlTracking(fullUrl[0])

  const domainPath = value.match(
    /(?:www\.)?(?:facebook\.com|fb\.com|fb\.me)\/[^\s]+/i
  )
  if (domainPath) {
    const hostPath = domainPath[0].replace(/^(?:www\.)/i, "")
    const host = hostPath.toLowerCase().startsWith("fb.me")
      ? "fb.me"
      : hostPath.toLowerCase().startsWith("fb.com")
        ? "www.facebook.com"
        : "www.facebook.com"
    const path = hostPath.replace(/^(?:facebook\.com|fb\.com|fb\.me)\//i, "")
    return stripUrlTracking(`https://${host}/${path}`)
  }

  const fromAt = firstAtHandle(value)
  if (fromAt) return `https://www.facebook.com/${fromAt}`

  const slug = value.replace(/^@/, "").split(/[/?#]/)[0].trim()
  if (/^[A-Za-z0-9.]+(?:-[A-Za-z0-9.]+)*$/.test(slug)) {
    return `https://www.facebook.com/${slug}`
  }

  if (slug.length > 1) {
    return `https://www.facebook.com/search/top/?q=${encodeURIComponent(slug)}`
  }
  return null
}

function tiktokUrlFrom(text: string): string | null {
  const fromAt = firstAtHandle(text)
  if (fromAt) return `https://www.tiktok.com/@${fromAt}`
  const urlMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?([A-Za-z0-9._]+)/i
  )
  if (urlMatch?.[1]) return `https://www.tiktok.com/@${urlMatch[1]}`
  return null
}

function expandRaw(raw: string): string {
  const value = raw.trim()
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string" && item.trim()).join(" ")
      }
    } catch {
      // El scraper a veces deja texto que parece JSON pero no lo es.
    }
  }
  return value
}

export function socialUrl(social: string): string | null {
  const value = expandRaw(social)
  if (!value || value === "-" || value === "—") return null

  const instagramPart = labeledRemainder(value, ["instagram", "insta", "ig"])
  const facebookPart = labeledRemainder(value, ["facebook", "fb"])
  const tiktokPart = labeledRemainder(value, ["tiktok"])

  if (instagramPart) {
    const handle = instagramHandleFrom(instagramPart)
    if (handle) return `https://www.instagram.com/${handle}`
  }

  if (facebookPart) {
    const url = facebookTargetFrom(facebookPart)
    if (url) return url
  }

  if (tiktokPart) {
    const url = tiktokUrlFrom(tiktokPart)
    if (url) return url
  }

  if (/instagram\.com/i.test(value) || /(?:^|[\s,;|/])(?:instagram|insta|ig)\b/i.test(value)) {
    const handle = instagramHandleFrom(value)
    if (handle) return `https://www.instagram.com/${handle}`
  }

  if (/facebook\.com|fb\.com|fb\.me/i.test(value) || /(?:^|[\s,;|/])(?:facebook|fb)\b/i.test(value)) {
    const url = facebookTargetFrom(value)
    if (url) return url
  }

  if (/tiktok\.com/i.test(value)) {
    const url = tiktokUrlFrom(value)
    if (url) return url
  }

  if (/^https?:\/\//i.test(value)) return stripUrlTracking(value)

  const handle = instagramHandleFrom(value)
  return handle ? `https://www.instagram.com/${handle}` : null
}

export function instagramUrl(social: string): string | null {
  return socialUrl(social)
}
