"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { DEFAULT_RANGE_DAYS, RANGE_PRESETS } from "@/lib/date-range"

/**
 * Switches the reporting window by rewriting the `days` query parameter, so
 * every view is a shareable URL and the server does the filtering.
 */
export function DateRangePicker({
  days,
  className,
}: {
  days: number
  className?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function hrefFor(preset: number): string {
    const params = new URLSearchParams(searchParams.toString())
    if (preset === DEFAULT_RANGE_DAYS) params.delete("days")
    else params.set("days", String(preset))
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-4xl border border-border bg-input/30 p-0.5",
        className
      )}
      role="group"
      aria-label="Reporting period"
    >
      {RANGE_PRESETS.map((preset) => {
        const isActive = preset.days === days
        return (
          <Link
            key={preset.days}
            href={hrefFor(preset.days)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-4xl px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {preset.label}
          </Link>
        )
      })}
    </div>
  )
}
