"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

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

const config = {
  newClients: { label: "Clients", color: SERIES[0] },
  newProviders: { label: "Providers", color: SERIES[1] },
} satisfies ChartConfig

/**
 * Sign-ups per day, stacked because the two sides sum to something meaningful —
 * total new accounts — and a marketplace is read by whether both sides are
 * growing together.
 */
export function GrowthChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
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
          cursor={{ fill: CHART_GRID, fillOpacity: 0.4 }}
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
        {/* The 2px stroke in the surface colour is the gap that separates the
            two stacked segments — a border around the mark would add ink that
            isn't data. */}
        <Bar
          dataKey="newClients"
          stackId="signups"
          fill={SERIES[0]}
          maxBarSize={24}
          stroke="var(--card)"
          strokeWidth={2}
        />
        <Bar
          dataKey="newProviders"
          stackId="signups"
          fill={SERIES[1]}
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
          stroke="var(--card)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}
