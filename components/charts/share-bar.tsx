import { cn } from "@/lib/utils"
import { SERIES } from "@/lib/chart-palette"

export interface ShareSegment {
  label: string
  value: number
  /** Pre-formatted value shown in the key, e.g. "GH₵12,400". */
  display: string
}

/**
 * Part-to-whole as a single horizontal stacked bar plus a legend that states
 * every value in words.
 *
 * A stacked bar beats a pie here: the segments share one baseline, so the eye
 * compares lengths rather than angles. The legend is not decoration — it is the
 * relief channel that keeps the lighter slots readable, and it means the
 * numbers are available as text without hovering anything.
 */
export function ShareBar({
  segments,
  emptyMessage = "Nothing recorded in this period.",
  className,
}: {
  segments: ShareSegment[]
  emptyMessage?: string
  className?: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  if (!total) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  // More than six shares stops being readable as a bar; the tail is folded into
  // a single "Other" rather than reaching for a seventh hue.
  const ranked = [...segments].sort((a, b) => b.value - a.value)
  const shown = ranked.slice(0, SERIES.length - 1)
  const rest = ranked.slice(SERIES.length - 1)
  const rows = rest.length
    ? [
        ...shown,
        {
          label: "Other",
          value: rest.reduce((sum, segment) => sum + segment.value, 0),
          display: `${rest.length} more`,
        },
      ]
    : shown

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-4xl">
        {rows.map((row, index) => (
          <div
            key={row.label}
            style={{
              width: `${(row.value / total) * 100}%`,
              backgroundColor: SERIES[index],
            }}
            className="h-full first:rounded-l-4xl last:rounded-r-4xl"
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SERIES[index] }}
              />
              <span className="truncate">{row.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-muted-foreground">{row.display}</span>
              <span className="w-11 text-right font-medium tabular-nums">
                {((row.value / total) * 100).toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
