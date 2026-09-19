"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { CHART_GRID, RAMP } from "@/lib/chart-palette"
import { formatHour, formatNumber } from "@/lib/format"

const config = {
  bookings: { label: "Bookings" },
} satisfies ChartConfig

/**
 * When in the day clients want service. One measure across an ordered scale,
 * so the ramp is used ordinally: busier hours sit darker, and the order of the
 * hours is already carried by the axis.
 */
export function HourlyDemandChart({
  data,
}: {
  data: { hour: number; bookings: number }[]
}) {
  const peak = Math.max(...data.map((entry) => entry.bookings), 1)

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={CHART_GRID} strokeWidth={1} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          // 24 ticks never fit; letting recharts drop the ones that would
          // collide keeps the axis readable at any card width, where a fixed
          // interval runs the hour labels into each other in a narrow column.
          interval="preserveStartEnd"
          minTickGap={28}
          tickFormatter={(hour: number) => formatHour(hour)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={36}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ fill: CHART_GRID, fillOpacity: 0.4 }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => {
                const hour = (payload?.[0]?.payload as { hour?: number })?.hour
                return hour === undefined ? "" : formatHour(hour)
              }}
              formatter={(value) => (
                <span className="font-medium tabular-nums">
                  {formatNumber(Number(value))} bookings
                </span>
              )}
            />
          }
        />
        <Bar dataKey="bookings" maxBarSize={18} radius={[4, 4, 0, 0]}>
          {data.map((entry) => {
            // Four ordered steps keyed to share of peak, so the darkest band
            // marks the genuine rush rather than merely the tallest bar.
            const share = entry.bookings / peak
            const step = share > 0.75 ? 3 : share > 0.5 ? 2 : share > 0.25 ? 1 : 0
            return <Cell key={entry.hour} fill={RAMP[step]} />
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
