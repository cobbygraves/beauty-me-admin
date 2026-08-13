import Link from "next/link"
import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
import { ToneBadge } from "@/components/status-badge"
import { DateRangePicker } from "@/components/date-range-picker"
import { rangeToQuery, resolveRangeDays } from "@/lib/date-range"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { BookingsChart } from "@/components/charts/bookings-chart"
import { GrowthChart } from "@/components/charts/growth-chart"
import { HourlyDemandChart } from "@/components/charts/hourly-demand-chart"
import { RankedBarChart } from "@/components/charts/ranked-bar-chart"
import { ShareBar } from "@/components/charts/share-bar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getAnalyticsBreakdown,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getTopClients,
  getTopProviders,
} from "@/lib/admin-api"
import {
  MOMO_PROVIDER_LABELS,
  PAYMENT_CHANNEL_LABELS,
  STATUS_META,
} from "@/lib/booking"
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/lib/format"

export const metadata: Metadata = { title: "Analytics" }

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { days: daysParam } = await searchParams
  const days = resolveRangeDays(daysParam)
  const range = rangeToQuery(days)

  const [overview, timeseries, breakdown, topProviders, topClients] =
    await Promise.all([
      getAnalyticsOverview(range),
      getAnalyticsTimeseries(range),
      getAnalyticsBreakdown(range),
      getTopProviders({ ...range, limit: 10 }),
      getTopClients({ ...range, limit: 10 }),
    ])

  const { current, previous, deltas } = overview

  const channelSegments = breakdown.channelBreakdown.map((entry) => ({
    label: entry.momoProvider
      ? `${MOMO_PROVIDER_LABELS[entry.momoProvider]} mobile money`
      : (PAYMENT_CHANNEL_LABELS[entry.channel] ?? entry.channel),
    value: entry.amount,
    display: formatCurrency(entry.amount),
  }))

  const statusRows = breakdown.statusBreakdown
    .map((row) => ({
      label: STATUS_META[row.status]?.label ?? row.status,
      value: row.count,
      secondary: formatCurrency(row.value),
    }))
    .sort((a, b) => b.value - a.value)

  const serviceRows = breakdown.topServices.map((row) => ({
    label: row.name,
    value: row.bookings,
    secondary: formatCurrency(row.revenue),
  }))

  const categoryRows = breakdown.categoryBreakdown.slice(0, 8).map((row) => ({
    label: row.name,
    value: row.revenue,
    secondary: `${formatNumber(row.bookings)} bookings`,
  }))

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Last ${days} days (${formatDate(
          overview.range.from
        )} – ${formatDate(overview.range.to)}), compared with the ${days} days before.`}
        actions={<DateRangePicker days={days} />}
      />

      <section
        aria-label="Period figures"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          emphasis
          label="Gross bookings"
          value={formatCurrencyCompact(current.gmv)}
          delta={deltas.gmv}
          hint={`was ${formatCurrencyCompact(previous.gmv)}`}
        />
        <StatTile
          label="Platform revenue"
          value={formatCurrencyCompact(current.platformRevenue)}
          delta={deltas.platformRevenue}
          hint={`was ${formatCurrencyCompact(previous.platformRevenue)}`}
        />
        <StatTile
          label="Average booking"
          value={formatCurrency(current.avgBookingValue)}
          delta={deltas.avgBookingValue}
          hint={`was ${formatCurrency(previous.avgBookingValue)}`}
        />
        <StatTile
          label="Completion rate"
          value={formatPercent(current.completionRate)}
          delta={deltas.completionRate}
          hint={`${formatNumber(current.completedBookings)} of ${formatNumber(
            current.bookings
          )} bookings`}
        />
        <StatTile
          label="Refunds"
          value={formatCurrencyCompact(current.refunds)}
          delta={deltas.refunds}
          upIsGood={false}
          hint={`was ${formatCurrencyCompact(previous.refunds)}`}
        />
        <StatTile
          label="Provider payouts"
          value={formatCurrencyCompact(current.payouts)}
          delta={deltas.payouts}
          hint={`was ${formatCurrencyCompact(previous.payouts)}`}
        />
        <StatTile
          label="Fell through"
          value={formatNumber(current.failedBookings)}
          delta={deltas.failedBookings}
          upIsGood={false}
          hint="Cancelled, declined or no-show"
        />
        <StatTile
          label="New providers"
          value={formatNumber(current.newProviders)}
          delta={deltas.newProviders}
          hint={`${formatNumber(current.newClients)} new clients`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>
            Gross value charged each day, and what the platform keeps after
            payouts and refunds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={timeseries.series} />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking flow</CardTitle>
            <CardDescription>
              How many requests were raised, and how many reached the client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingsChart data={timeseries.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign-ups</CardTitle>
            <CardDescription>
              New accounts per day, split by which side of the marketplace they
              joined.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthChart data={timeseries.series} />
          </CardContent>
        </Card>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking outcomes</CardTitle>
            <CardDescription>
              Every booking raised in this window, by the state it is in now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBarChart
              data={statusRows}
              format="number"
              maxHeight={320}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by category</CardTitle>
            <CardDescription>
              Recovered from the provider&rsquo;s live service list, since a
              booking snapshots only the service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBarChart
              data={categoryRows}
              format="currency"
              maxHeight={320}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most booked services</CardTitle>
            <CardDescription>
              By volume. The tooltip carries the revenue each brought in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBarChart
              data={serviceRows}
              format="number"
              maxHeight={320}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>How clients pay</CardTitle>
              <CardDescription>
                Share of settled value by payment method.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShareBar segments={channelSegments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>When clients book</CardTitle>
              <CardDescription>
                Appointments by hour of day — where provider supply needs to be.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HourlyDemandChart data={breakdown.hourlyDemand} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top providers</CardTitle>
            <CardDescription>
              By completed job value in this window.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Fell through</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProviders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No completed jobs in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  topProviders.map((provider) => (
                    <TableRow key={provider.providerId}>
                      <TableCell>
                        <Link
                          href={`/providers/${provider.providerId}`}
                          className="font-medium hover:underline"
                        >
                          {provider.businessName || provider.username}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(provider.completedJobs)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(provider.cancelled)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(provider.gross)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {provider.reviewCount
                          ? provider.avgRating.toFixed(1)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clients</CardTitle>
            <CardDescription>By spend in this window.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No bookings in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  topClients.map((client) => (
                    <TableRow key={client.clientId}>
                      <TableCell>
                        <Link
                          href={`/clients/${client.clientId}`}
                          className="font-medium hover:underline"
                        >
                          {client.username}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(client.bookings)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(client.completed)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(client.spend)}
                      </TableCell>
                      <TableCell>
                        <ToneBadge
                          tone={client.isSuspended ? "danger" : "success"}
                          label={client.isSuspended ? "Suspended" : "Active"}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
