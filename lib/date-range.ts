/**
 * Reporting-window helpers.
 *
 * Deliberately a plain module rather than living beside the picker component:
 * the picker is a Client Component, and a Server Component cannot call a
 * function exported from a `"use client"` module — it can only render it. The
 * pages that resolve the window server-side import from here instead.
 */

/** Every analytics window is a `days` query parameter, so a report is a link. */
export const RANGE_PRESETS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
] as const

export const DEFAULT_RANGE_DAYS = 30

/** Clamps the query parameter to a known preset so nothing arbitrary gets in. */
export function resolveRangeDays(value: string | undefined): number {
  const parsed = Number(value)
  const match = RANGE_PRESETS.find((preset) => preset.days === parsed)
  return match?.days ?? DEFAULT_RANGE_DAYS
}

/** Turns the window into the `from`/`to` pair the analytics endpoints take. */
export function rangeToQuery(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: to.toISOString() }
}
