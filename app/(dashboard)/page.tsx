import Link from "next/link"
import type { Metadata } from "next"
import {
  BadgeCheckIcon,
  BanknoteIcon,
  CalendarCheckIcon,
  CircleAlertIcon,
  ReceiptTextIcon,
  StarIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import { PageHeader, SectionHeading } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
import { BookingStatusBadge, OnlineBadge } from "@/components/status-badge"
import { DateRangePicker } from "@/components/date-range-picker"
import { rangeToQuery, resolveRangeDays } from "@/lib/date-range"
import { BookingsChart } from "@/components/charts/bookings-chart"
import { GrowthChart } from "@/components/charts/growth-chart"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { RankedBarChart } from "@/components/charts/ranked-bar-chart"
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
  getAdminActivity,
  getAnalyticsBreakdown,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getTopProviders,
  listBookings,
} from "@/lib/admin-api"
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/format"
import { STATUS_META } from "@/lib/booking"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { days: daysParam } = await searchParams
  const days = resolveRangeDays(daysParam)
  const range = rangeToQuery(days)

  // Independent reads, so they are started together rather than awaited in
  // sequence — the slowest one sets the page's latency, not their sum.
  const [overview, timeseries, breakdown, topProviders, recentBookings, activity] =
    await Promise.all([
      getAnalyticsOverview(range),
      getAnalyticsTimeseries(range),
      getAnalyticsBreakdown(range),
      getTopProviders({ ...range, limit: 6 }),
      listBookings({ limit: 8, sort: "-createdAt" }),
      getAdminActivity(),
    ])

  const { current, deltas, totals } = overview

  const statusRows = breakdown.statusBreakdown
    .map((row) => ({
      label: STATUS_META[row.status]?.label ?? row.status,
      value: row.count,
      secondary: formatCurrency(row.value),
    }))
    .sort((a, b) => b.value - a.value)

  const categoryRows = breakdown.categoryBreakdown.slice(0, 7).map((row) => ({
    label: row.name,
    value: row.revenue,
    secondary: `${formatNumber(row.bookings)} bookings`,
  }))

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Marketplace health over the last ${days} days, compared with the ${days} days before it.`}
        actions={<DateRangePicker days={days} />}
      />

      {totals.pendingVerifications > 0 ||
      totals.paymentsNeedingAttention > 0 ? (
        <section className="flex flex-wrap gap-3">
          {totals.pendingVerifications > 0 ? (
            <Link
              href="/verification"
              className="flex items-center gap-2.5 rounded-2xl bg-status-warning/10 px-4 py-3 text-sm ring-1 ring-status-warning/25 transition-colors hover:bg-status-warning/15"
            >
              <BadgeCheckIcon className="size-4 shrink-0" aria-hidden />
              <span>
                <strong className="font-semibold">
                  {totals.pendingVerifications}
                </strong>{" "}
                provider
                {totals.pendingVerifications === 1 ? "" : "s"} waiting on
                verification
              </span>
            </Link>
          ) : null}

          {totals.paymentsNeedingAttention > 0 ? (
            <Link
              href="/transactions?needsAttention=true"
              className="flex items-center gap-2.5 rounded-2xl bg-status-critical/10 px-4 py-3 text-sm ring-1 ring-status-critical/25 transition-colors hover:bg-status-critical/15"
            >
              <CircleAlertIcon className="size-4 shrink-0" aria-hidden />
              <span>
                <strong className="font-semibold">
                  {totals.paymentsNeedingAttention}
                </strong>{" "}
                booking
                {totals.paymentsNeedingAttention === 1 ? "" : "s"} with money
                stuck
              </span>
            </Link>
          ) : null}
        </section>
      ) : null}

      <section
        aria-label="Headline figures"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatTile
          emphasis
          label="Gross bookings"
          value={formatCurrencyCompact(current.gmv)}
          delta={deltas.gmv}
          hint={`${formatNumber(current.transactionCount)} charges settled`}
          icon={BanknoteIcon}
        />
        <StatTile
          label="Platform revenue"
          value={formatCurrencyCompact(current.platformRevenue)}
          delta={deltas.platformRevenue}
          hint={`${formatCurrencyCompact(current.payouts)} paid out to providers`}
          icon={TrendingUpIcon}
        />
        <StatTile
          label="Bookings"
          value={formatNumber(current.bookings)}
          delta={deltas.bookings}
          hint={`${formatPercent(current.completionRate)} completed`}
          icon={CalendarCheckIcon}
        />
        <StatTile
          label="New accounts"
          value={formatNumber(current.newUsers)}
          delta={deltas.newUsers}
          hint={`${formatNumber(current.newClients)} clients · ${formatNumber(
            current.newProviders
          )} providers`}
          icon={UserPlusIcon}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>
              Gross value charged, and what the platform keeps once payouts and
              refunds are netted out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={timeseries.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketplace</CardTitle>
            <CardDescription>Where the two sides stand today.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <StatTile
              label="Clients"
              value={formatNumber(totals.totalClients)}
              hint={`${formatNumber(totals.suspendedUsers)} suspended`}
              icon={UsersIcon}
            />
            <StatTile
              label="Providers"
              value={formatNumber(totals.totalProviders)}
              hint={`${formatNumber(totals.approvedProviders)} verified`}
            />
            <StatTile
              label="Online now"
              value={formatNumber(totals.onlineProviders)}
              hint="Taking bookings"
            />
            <StatTile
              label="Average rating"
              value={totals.avgRating ? totals.avgRating.toFixed(2) : "—"}
              hint={`${formatNumber(totals.totalReviews)} reviews`}
              icon={StarIcon}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking flow</CardTitle>
            <CardDescription>
              Requests raised each day, and how many reached the client.
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
              New accounts per day. A marketplace is healthy when both sides
              grow together.
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
            <CardTitle>Where bookings end up</CardTitle>
            <CardDescription>
              Every booking raised in this window, by the state it is in now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBarChart
              data={statusRows}
              format="number"
              maxHeight={300}
              emptyMessage="No bookings were raised in this period."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by category</CardTitle>
            <CardDescription>
              Booking value by the service category the provider listed it
              under.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBarChart
              data={categoryRows}
              format="currency"
              maxHeight={300}
              emptyMessage="No categorised bookings in this period."
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top providers</CardTitle>
            <CardDescription>
              Ranked by completed job value in this window.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead />
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
                          className="flex flex-col gap-0.5 hover:underline"
                        >
                          <span className="font-medium">
                            {provider.businessName || provider.username}
                          </span>
                          {provider.businessName ? (
                            <span className="text-xs text-muted-foreground">
                              {provider.username}
                            </span>
                          ) : null}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(provider.completedJobs)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(provider.gross)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {provider.reviewCount
                          ? provider.avgRating.toFixed(1)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <OnlineBadge isOnline={provider.isOnline} />
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
            <CardTitle>Admin activity</CardTitle>
            <CardDescription>
              Recent manual overrides, taken from the booking audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No booking has needed a manual override.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {activity.slice(0, 6).map((entry, index) => (
                  <li
                    key={`${entry.bookingId}-${index}`}
                    className="flex flex-col gap-1.5 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <BookingStatusBadge status={entry.status} />
                      <Link
                        href={`/bookings/${entry.bookingId}`}
                        className="font-medium hover:underline"
                      >
                        {entry.serviceName}
                      </Link>
                    </div>
                    {entry.note ? (
                      <p className="text-muted-foreground">{entry.note}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {entry.adminName} · {formatRelative(entry.changedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <SectionHeading
            title="Latest bookings"
            description="The most recent activity across the marketplace."
            actions={
              <Link
                href="/bookings"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all
              </Link>
            }
          />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No bookings yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentBookings.items.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <Link
                        href={`/bookings/${booking._id}`}
                        className="font-medium hover:underline"
                      >
                        {booking.serviceName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.clientName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.providerName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(booking.scheduledAt)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(booking.price)}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ReceiptTextIcon className="size-3.5" aria-hidden />
        Platform revenue is what remains of a settled charge once the provider
        payout and any refund are deducted, so a fully refunded booking
        contributes nothing.
      </p>
    </>
  )
}
