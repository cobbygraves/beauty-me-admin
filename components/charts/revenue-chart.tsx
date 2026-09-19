"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CHART_GRID, SERIES } from "@/lib/chart-palette"
import { formatCompact, formatCurrency, formatAxisDate } from "@/lib/format"
import { formatFullDate } from "@/components/charts/chart-utils"
import type { SeriesPoint } from "@/lib/types"

const config = {
  gmv: { label: "Gross bookings", color: SERIES[0] },
  platformRevenue: { label: "Platform revenue", color: SERIES[1] },
} satisfies ChartConfig

/**
 * Money over time. Two series only — gross and what the platform actually
 * keeps — because a third line (payouts) is just the gap between them and adds
 * ink without adding information.
 */
export function RevenueChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          {/* A wash, never a saturated block — the line carries the value. */}
          <linearGradient id="fill-gmv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="fill-platform" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES[1]} stopOpacity={0.16} />
            <stop offset="100%" stopColor={SERIES[1]} stopOpacity={0.01} />
          </linearGradient>
        </defs>

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
          width={52}
          tickFormatter={(value: number) => formatCompact(value)}
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
                    {formatCurrency(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="gmv"
          type="monotone"
          stroke={SERIES[0]}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#fill-gmv)"
        />
        <Area
          dataKey="platformRevenue"
          type="monotone"
          stroke={SERIES[1]}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="url(#fill-platform)"
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
