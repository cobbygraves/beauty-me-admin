import type { Tone } from "@/lib/booking"

/**
 * The BeautyHub chart palette.
 *
 * Slots are CSS variables (defined in `app/globals.css`) rather than literal
 * hexes so light and dark swap in one place. Assign them **in order** and never
 * cycle: the ordering is what makes the palette colourblind-safe, and a
 * generated ninth hue would be indistinguishable from an existing one.
 *
 * Derivation and evidence — every ordering with the brand magenta pinned to
 * slot 1 was enumerated and scored, and this one clears every gate in both
 * modes against the real card surfaces (`#ffffff` light, `#1d161e` dark):
 *
 *   - adjacent CVD separation  ΔE 9.2 light / 9.4 dark  (target ≥ 8)
 *   - normal-vision floor      ΔE 24.0 light / 20.9 dark (floor ≥ 15)
 *   - leading three slots also clear the harder all-pairs gate in both modes,
 *     which is what a three-series line or area chart actually needs, since
 *     all three marks share the plot at once.
 *
 * One caveat is load-bearing: on the light surface slot 3 (2.82:1) and slot 5
 * (2.17:1) fall just under 3:1. Charts using them must carry a relief channel —
 * a legend plus the values reachable as text (tooltip, stat tile, or the table
 * beside the chart). Every chart in this dashboard does.
 */
export const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
] as const

/**
 * Magnitude ramp — the brand's own single-hue magenta scale, light→dark.
 * Use for "how much", never for identity.
 */
export const RAMP = [
  "var(--ramp-1)",
  "var(--ramp-2)",
  "var(--ramp-3)",
  "var(--ramp-4)",
] as const

/** Reserved state colours. Never used as a series, always paired with a label. */
export const STATUS_COLORS = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
} as const

export const CHART_GRID = "var(--chart-grid)"
export const CHART_AXIS = "var(--chart-axis)"

/**
 * Picks a ramp step by rank, so a sorted bar chart reads darkest-first without
 * the caller doing index arithmetic. Ranks past the ramp settle on its lightest
 * step rather than wrapping back to dark, which would misstate magnitude.
 */
export function rampStep(rank: number, total: number): string {
  if (total <= 1) return RAMP[RAMP.length - 1]
  const position = Math.min(rank, total - 1) / (total - 1)
  const index = Math.round((1 - position) * (RAMP.length - 1))
  return RAMP[Math.max(0, Math.min(RAMP.length - 1, index))]
}

/** Maps a semantic tone onto its reserved colour (charts only — badges use Tailwind classes). */
export function toneColor(tone: Tone): string {
  switch (tone) {
    case "success":
      return STATUS_COLORS.good
    case "pending":
      return STATUS_COLORS.warning
    case "danger":
      return STATUS_COLORS.critical
    case "active":
      return SERIES[0]
    default:
      return CHART_AXIS
  }
}
