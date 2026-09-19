"use client"

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { rampStep } from "@/lib/chart-palette"
import { formatCurrencyCompact, formatNumber } from "@/lib/format"

export interface RankedDatum {
  label: string
  value: number
  /** Shown in the tooltip beneath the value — e.g. "18 bookings". */
  secondary?: string
}

/**
 * How to render the measure. A discriminator rather than a formatter function,
 * because a Server Component cannot hand a function across the client boundary
 * — the pages that render this chart are all server-rendered.
 */
export type RankedFormat = "number" | "currency"

const FORMATTERS: Record<RankedFormat, (value: number) => string> = {
  number: formatNumber,
  currency: formatCurrencyCompact,
}

/**
 * Comparing magnitude across named things — categories, services, statuses.
 *
 * One measure, so it takes the single-hue magnitude ramp rather than a
 * categorical scale: colouring each bar a different hue would spend the
 * identity channel re-encoding what bar length already says. Horizontal,
 * because category names are words and words want a straight left edge.
 */
/** Vertical space one bar plus its share of the band gets. */
const ROW_HEIGHT = 34
const CHART_PADDING = 16

/**
 * Floor for the plot area. Below roughly this, the axis and margins eat the
 * band and the bar itself stops being drawn — so a one-row breakdown is given
 * room rather than collapsing to a bare label.
 */
const MIN_HEIGHT = 120

export function RankedBarChart({
  data,
  format = "number",
  maxHeight = 320,
  emptyMessage = "Nothing recorded in this period.",
}: {
  data: RankedDatum[]
  format?: RankedFormat
  /** Ceiling for a long list; short lists shrink to fit. */
  maxHeight?: number
  emptyMessage?: string
}) {
  const valueFormatter = FORMATTERS[format]

  // Height follows the row count rather than being fixed: a two-row breakdown
  // in a 300px box reads as a mostly-empty card, which looks like missing data
  // rather than a small result set.
  const height = Math.min(
    maxHeight,
    Math.max(data.length * ROW_HEIGHT + CHART_PADDING, MIN_HEIGHT)
  )

  if (!data.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  const config = {
    value: { label: "Value" },
  } satisfies ChartConfig

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 56, top: 4, bottom: 4 }}
      >
        <XAxis type="number" dataKey="value" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={132}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={{ fill: "var(--chart-grid)", fillOpacity: 0.4 }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelKey="label"
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium tabular-nums">
                    {valueFormatter(Number(value))}
                  </span>
                  {(item?.payload as RankedDatum | undefined)?.secondary ? (
                    <span className="text-muted-foreground">
                      {(item?.payload as RankedDatum).secondary}
                    </span>
                  ) : null}
                </div>
              )}
            />
          }
        />
        <Bar dataKey="value" maxBarSize={20} radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.label} fill={rampStep(index, data.length)} />
          ))}
          {/* Direct labels at the bar tips: this is also the relief channel
              that keeps the lighter ramp steps readable. */}
          <LabelList
            dataKey="value"
            position="right"
            offset={8}
            className="fill-muted-foreground"
            fontSize={11}
            formatter={(value) => valueFormatter(Number(value ?? 0))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
