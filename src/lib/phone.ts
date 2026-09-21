export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

export function normalizePhone(value: string): string {
  const digits = digitsOnly(value)
  if (!digits) return ""
  if (digits.startsWith("54")) return digits
  if (digits.startsWith("0")) return `54${digits.slice(1)}`
  if (digits.length === 10) return `54${digits}`
  return digits
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value)
  if (!digits) return value.trim()
  if (digits.startsWith("54") && digits.length >= 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)}-${digits.slice(8)}`
  }
  return `+${digits}`
}

export function hasPhone(value: string): boolean {
  return digitsOnly(value).length >= 8
}
