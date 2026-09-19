import type { LucideIcon } from "lucide-react"
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDelta } from "@/lib/format"

/**
 * The dashboard's headline-number unit — a single current value with an
 * optional period-on-period delta.
 *
 * A one-bar bar chart is the wrong form for one number, so these carry the KPI
 * row and the charts below are left to show shape over time.
 */
export function StatTile({
  label,
  value,
  hint,
  delta,
  deltaLabel = "vs previous period",
  /** False where a rise is bad — refunds, cancellations, failed payouts. */
  upIsGood = true,
  icon: Icon,
  emphasis = false,
  className,
}: {
  label: string
  value: string
  hint?: string
  delta?: number | null
  deltaLabel?: string
  upIsGood?: boolean
  icon?: LucideIcon
  emphasis?: boolean
  className?: string
}) {
  const hasDelta = delta !== undefined
  const direction = !delta ? "flat" : delta > 0 ? "up" : "down"
  const isGood =
    direction === "flat" ? null : (direction === "up") === upIsGood

  const DeltaIcon =
    direction === "up"
      ? ArrowUpRightIcon
      : direction === "down"
        ? ArrowDownRightIcon
        : MinusIcon

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl p-5 ring-1 ring-foreground/10",
        emphasis ? "bg-primary/5 ring-primary/20" : "bg-card",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
        <span className="text-xs font-medium">{label}</span>
      </div>

      <span
        className={cn(
          "font-heading text-2xl leading-none font-semibold tracking-tight",
          emphasis && "text-primary"
        )}
      >
        {value}
      </span>

      {hasDelta || hint ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {hasDelta ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                isGood === null && "text-muted-foreground",
                isGood === true &&
                  "text-[color-mix(in_oklch,var(--status-good),black_18%)] dark:text-status-good",
                isGood === false && "text-status-critical"
              )}
            >
              <DeltaIcon className="size-3" aria-hidden />
              {formatDelta(delta)}
            </span>
          ) : null}
          <span className="text-muted-foreground">
            {hasDelta ? deltaLabel : hint}
          </span>
        </div>
      ) : null}

      {hasDelta && hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

/**
 * A compact label/value pair for detail panels, where a full tile would be too
 * much furniture for a single fact.
 */
export function StatLine({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
