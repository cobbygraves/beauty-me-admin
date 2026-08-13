"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CHART_GRID, SERIES } from "@/lib/chart-palette"
import { formatAxisDate, formatNumber } from "@/lib/format"
import { formatFullDate } from "@/components/charts/chart-utils"
import type { SeriesPoint } from "@/lib/types"

/**
 * Booking lifecycle counts. All three are treated as neutral identities on the
 * categorical scale rather than mixing a "good" completed against a "bad"
 * cancelled — a chart that speaks one colour language at a time.
 */
const config = {
  bookings: { label: "Created", color: SERIES[0] },
  completed: { label: "Completed", color: SERIES[1] },
  cancelled: { label: "Fell through", color: SERIES[2] },
} satisfies ChartConfig

export function BookingsChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={28}
          tickFormatter={formatAxisDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatFullDate(payload)}
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label ?? name}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatNumber(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        {(["bookings", "completed", "cancelled"] as const).map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={config[key].color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </LineChart>
    </ChartContainer>
  )
}
