import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CalendarCheckIcon,
  RotateCcwIcon,
  XCircleIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StatTile, StatLine } from "@/components/stat-tile"
import { BookingStatusBadge, ToneBadge } from "@/components/status-badge"
import { EditUserButton, SuspendUserButton } from "@/components/admin-actions"
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
import { getUserDetail } from "@/lib/admin-api"
import { ApiError } from "@/lib/api"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  initialsOf,
} from "@/lib/format"
import { formatMobile } from "@/lib/phone"
import { ROLE_LABELS } from "@/lib/booking"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  try {
    const detail = await getUserDetail(id)
    return { title: detail.user.username }
  } catch {
    return { title: "Client" }
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let detail
  try {
    detail = await getUserDetail(id)
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      notFound()
    }
    throw error
  }

  const { user, stats, recentBookings } = detail

  return (
    <>
      <Link
        href="/clients"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden />
        All clients
      </Link>

      <PageHeader
        title={user.username}
        description={`${ROLE_LABELS[user.role] ?? user.role} · joined ${
          user.createdAt ? formatDate(user.createdAt) : "—"
        }`}
        actions={
          <>
            <EditUserButton
              userId={user._id}
              username={user.username}
              email={user.email}
              mobile={user.mobile}
              role={user.role}
            />
            <SuspendUserButton
              userId={user._id}
              username={user.username}
              isSuspended={Boolean(user.isSuspended)}
            />
          </>
        }
      />

      {user.isSuspended ? (
        <p className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <XCircleIcon className="size-4 shrink-0" aria-hidden />
          This account is suspended. They cannot sign in to the mobile app.
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          emphasis
          label="Lifetime value"
          value={formatCurrency(stats.value)}
          hint="Every booking they have paid for"
          icon={BanknoteIcon}
        />
        <StatTile
          label="Bookings"
          value={formatNumber(stats.bookings)}
          hint={`${formatNumber(stats.completed)} completed`}
          icon={CalendarCheckIcon}
        />
        <StatTile
          label="Fell through"
          value={formatNumber(stats.cancelled)}
          hint="Cancelled, declined or no-show"
          icon={XCircleIcon}
        />
        <StatTile
          label="Refunded"
          value={formatCurrency(stats.refunded)}
          hint="Returned to this client"
          icon={RotateCcwIcon}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              What the client set up, and how they pay.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initialsOf(user.username)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{user.username}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatLine label="Mobile" value={formatMobile(user.mobile)} />
              <StatLine
                label="Status"
                value={
                  <ToneBadge
                    tone={user.isSuspended ? "danger" : "success"}
                    label={user.isSuspended ? "Suspended" : "Active"}
                  />
                }
              />
              <StatLine
                label="Saved card"
                value={
                  user.paystackAuthorizationLast4
                    ? `${user.paystackAuthorizationBank ?? "Card"} •••• ${
                        user.paystackAuthorizationLast4
                      }`
                    : "None saved"
                }
              />
              <StatLine
                label="Unread alerts"
                value={formatNumber(stats.unreadNotifications)}
              />
              <StatLine
                label="Reviews written"
                value={formatNumber(stats.reviewCount)}
              />
              <StatLine
                label="Average rating given"
                value={
                  stats.reviewCount ? stats.avgRating.toFixed(1) : "None yet"
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent bookings</CardTitle>
            <CardDescription>
              The ten most recent, newest first.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      This client has not booked anything yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentBookings.map((booking) => (
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
                        {booking.counterpartyName}
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
      </section>
    </>
  )
}
