import {
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isTomorrow,
  parseISO,
} from "date-fns"

/** Matches the API's `DEFAULT_CURRENCY` (Paystack Ghana) and the mobile apps. */
export const CURRENCY_SYMBOL = "GH₵"

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value
}

export function formatCurrency(amount: number | null | undefined): string {
  const value = Number(amount ?? 0)
  const rounded = Math.round(value * 100) / 100
  const hasFraction = rounded % 1 !== 0
  const [whole, fraction] = rounded.toFixed(hasFraction ? 2 : 0).split(".")
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `${CURRENCY_SYMBOL}${grouped}${fraction ? `.${fraction}` : ""}`
}

/**
 * Currency compacted for stat tiles, where a seven-digit GMV would otherwise
 * force the value to shrink out of the type scale.
 */
export function formatCurrencyCompact(
  amount: number | null | undefined
): string {
  const value = Number(amount ?? 0)
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    return `${CURRENCY_SYMBOL}${(value / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 10_000) {
    return `${CURRENCY_SYMBOL}${(value / 1_000).toFixed(1)}K`
  }
  return formatCurrency(value)
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-GB").format(Number(value ?? 0))
}

export function formatCompact(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return formatNumber(n)
}

export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 1
): string {
  return `${Number(value ?? 0).toFixed(fractionDigits)}%`
}

/** A signed delta for a stat tile: "+12.4%" / "−3.1%" / "—" with no baseline. */
export function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

export function formatDuration(minutes: number | null | undefined): string {
  const total = Math.max(0, Math.round(Number(minutes ?? 0)))
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (!rest) return `${hours} hr`
  return `${hours} hr ${rest} min`
}

export function formatTime(value: string | Date): string {
  return format(toDate(value), "h:mm a")
}

export function formatDate(value: string | Date): string {
  const date = toDate(value)
  return format(date, isThisYear(date) ? "EEE d MMM" : "d MMM yyyy")
}

/** "Today at 2:30 PM" / "Tomorrow at 9:00 AM" / "Sat 12 Jul at 9:00 AM" */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value)
  const time = format(date, "h:mm a")
  if (isToday(date)) return `Today at ${time}`
  if (isTomorrow(date)) return `Tomorrow at ${time}`
  return `${formatDate(date)} at ${time}`
}

/** "3 minutes ago" — used for audit trails and activity feeds. */
export function formatRelative(value: string | Date): string {
  return `${formatDistanceToNowStrict(toDate(value))} ago`
}

/** Axis tick for a daily series: "12 Jul". */
export function formatAxisDate(value: string): string {
  return format(parseISO(value), "d MMM")
}

export function formatRating(rating: number, reviewCount?: number): string {
  if (!reviewCount) return "New"
  return `${rating.toFixed(1)} (${reviewCount})`
}

export function initialsOf(name: string | undefined | null): string {
  const trimmed = (name ?? "").trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
}

/** "12:00" for an hour-of-day axis. */
export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`
}
