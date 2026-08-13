import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  MapPinIcon,
  StarIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StatLine } from "@/components/stat-tile"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  SettlementStatusBadge,
  ToneBadge,
} from "@/components/status-badge"
import { OverrideBookingButton } from "@/components/admin-actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getBookingAudit } from "@/lib/admin-api"
import { ApiError } from "@/lib/api"
import {
  MOMO_PROVIDER_LABELS,
  PAYMENT_CHANNEL_LABELS,
  STATUS_META,
  isTransitionAllowed,
} from "@/lib/booking"
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatRelative,
} from "@/lib/format"
import type { ActorType } from "@/lib/types"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  try {
    const detail = await getBookingAudit(id)
    return { title: detail.booking.serviceName }
  } catch {
    return { title: "Booking" }
  }
}

const ACTOR_LABELS: Record<ActorType, string> = {
  CLIENT: "Client",
  PROVIDER: "Provider",
  ADMIN: "Admin",
  SYSTEM: "System",
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let detail
  try {
    detail = await getBookingAudit(id)
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      notFound()
    }
    throw error
  }

  const { booking, client, provider, transaction, review, statusHistory } =
    detail

  const moneyStuck =
    booking.paymentReconciliationNeeded ||
    booking.refundStatus === "FAILED" ||
    booking.payoutStatus === "FAILED"

  const [lng, lat] = booking.clientLocation.coordinates

  return (
    <>
      <Link
        href="/bookings"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden />
        All bookings
      </Link>

      <PageHeader
        title={booking.serviceName}
        description={`${formatCurrency(booking.price)} · ${formatDuration(
          booking.durationMinutes
        )} · ${booking.isScheduled ? "Scheduled" : "On demand"} for ${formatDateTime(
          booking.scheduledAt
        )}`}
        actions={
          <OverrideBookingButton
            bookingId={booking._id}
            currentStatus={booking.status}
          />
        }
      />

      <section className="flex flex-wrap items-center gap-2">
        <BookingStatusBadge status={booking.status} />
        <PaymentStatusBadge status={booking.paymentStatus} />
        {booking.refundStatus !== "NONE" ? (
          <SettlementStatusBadge status={booking.refundStatus} label="Refund" />
        ) : null}
        {booking.payoutStatus !== "NONE" ? (
          <SettlementStatusBadge status={booking.payoutStatus} label="Payout" />
        ) : null}
        <span className="text-sm text-muted-foreground">
          {STATUS_META[booking.status].blurb}
        </span>
      </section>

      {moneyStuck ? (
        <p className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {booking.paymentReconciliationNeeded
              ? "The charge outcome was ambiguous and is flagged for reconciliation against Paystack. Do not assume the client was or was not charged."
              : "A refund or payout on this booking failed to settle. Check Paystack before overriding the status."}
          </span>
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Audit trail</CardTitle>
            <CardDescription>
              Every status change, who made it, and why. Admin overrides carry a
              mandatory reason.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col">
              {statusHistory.map((entry, index) => {
                const previous = statusHistory[index - 1]
                // An entry that the state machine would not have allowed is
                // either an override or a data anomaly; either way it is worth
                // pointing at rather than rendering as routine.
                const isJump =
                  previous &&
                  !isTransitionAllowed(previous.status, entry.status)

                return (
                  <li key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        aria-hidden
                        className={
                          entry.actorType === "ADMIN"
                            ? "mt-1.5 size-2.5 shrink-0 rounded-full bg-status-critical"
                            : "mt-1.5 size-2.5 shrink-0 rounded-full bg-primary"
                        }
                      />
                      {index < statusHistory.length - 1 ? (
                        <span
                          aria-hidden
                          className="w-px flex-1 bg-border"
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col gap-1 pb-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <BookingStatusBadge status={entry.status} />
                        {isJump ? (
                          <ToneBadge tone="danger" label="Out of sequence" />
                        ) : null}
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{entry.actorName}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {ACTOR_LABELS[entry.actorType]} ·{" "}
                          {formatDateTime(entry.changedAt)}
                        </span>
                      </p>
                      {entry.note ? (
                        <p className="text-sm text-muted-foreground">
                          {entry.note}
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>

            {statusHistory.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No status history recorded.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Parties</CardTitle>
              <CardDescription>
                Contact details are visible to the two parties only while the
                job is live — this view is the exception.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Client</span>
                {client ? (
                  <Link
                    href={`/clients/${client._id}`}
                    className="font-medium hover:underline"
                  >
                    {client.username}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Account removed</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {client?.mobile ?? "—"}
                </span>
              </div>

              <Separator />

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Provider</span>
                {provider ? (
                  <Link
                    href={`/providers/${provider._id}`}
                    className="font-medium hover:underline"
                  >
                    {provider.username}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Account removed</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {provider?.mobile ?? "—"}
                </span>
              </div>

              <Separator />

              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPinIcon className="size-3" aria-hidden />
                  Service address
                </span>
                <span className="text-sm">{booking.clientAddress}</span>
                {lat && lng ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit text-xs font-medium text-primary hover:underline"
                  >
                    Open in Maps
                  </a>
                ) : null}
                {booking.eta?.minutes ? (
                  <span className="text-xs text-muted-foreground">
                    Last ETA: {booking.eta.minutes} min
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Money</CardTitle>
              <CardDescription>
                The charge is taken at booking; the payout and any refund settle
                afterwards.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <StatLine label="Charged" value={formatCurrency(booking.price)} />
              <StatLine
                label="Method"
                value={
                  booking.momoProvider
                    ? `${MOMO_PROVIDER_LABELS[booking.momoProvider]} mobile money`
                    : (PAYMENT_CHANNEL_LABELS[booking.paymentChannel] ??
                      booking.paymentChannel)
                }
              />
              <StatLine
                label="Refunded"
                value={
                  booking.refundAmount
                    ? formatCurrency(booking.refundAmount)
                    : "—"
                }
              />
              <StatLine
                label="Paid to provider"
                value={
                  booking.payoutAmount
                    ? formatCurrency(booking.payoutAmount)
                    : "—"
                }
              />
              <StatLine
                label="Paystack reference"
                value={
                  <span className="font-mono text-xs break-all">
                    {transaction?.paystackReference ?? "—"}
                  </span>
                }
              />
              <StatLine
                label="Platform keeps"
                value={formatCurrency(
                  booking.price - booking.payoutAmount - booking.refundAmount
                )}
              />
            </CardContent>
          </Card>

          {booking.cancellation?.reason ? (
            <Card>
              <CardHeader>
                <CardTitle>Cancellation</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm">{booking.cancellation.reason}</p>
                {booking.cancellation.cancelledAt ? (
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(booking.cancellation.cancelledAt)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {review ? (
            <Card>
              <CardHeader>
                <CardTitle>Review</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <span
                  className="inline-flex items-center gap-0.5"
                  aria-label={`${review.rating} out of 5`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <StarIcon
                      key={index}
                      aria-hidden
                      className={
                        index < review.rating
                          ? "size-3.5 fill-current text-status-warning"
                          : "size-3.5 text-muted-foreground/30"
                      }
                    />
                  ))}
                </span>
                {review.comment ? (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </>
  )
}
