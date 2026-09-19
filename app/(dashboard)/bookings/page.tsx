import Link from "next/link"
import type { Metadata } from "next"
import { TriangleAlertIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { FilterForm, SearchField, SelectField } from "@/components/filters"
import { PaginationBar } from "@/components/pagination-bar"
import {
  BookingStatusBadge,
  PaymentStatusBadge,
} from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listBookings } from "@/lib/admin-api"
import { BOOKING_STATUSES, STATUS_META } from "@/lib/booking"
import { formatCurrency, formatDateTime, formatRelative } from "@/lib/format"

export const metadata: Metadata = { title: "Bookings" }

const PAYMENT_OPTIONS = [
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Payment pending" },
  { value: "FAILED", label: "Payment failed" },
]

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "-scheduledAt", label: "Latest appointment" },
  { value: "scheduledAt", label: "Earliest appointment" },
  { value: "-price", label: "Highest value" },
]

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const result = await listBookings({
    q: params.q,
    status: params.status,
    paymentStatus: params.paymentStatus,
    needsAttention: params.needsAttention,
    sort: params.sort,
    page,
    limit: 20,
  })

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every job on the platform. Open one to see its full audit trail, or to force it out of a stuck state."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 px-0">
          <FilterForm className="px-(--card-spacing)">
            <SearchField
              defaultValue={params.q}
              placeholder="Search service, address or person"
              className="w-full sm:w-72"
            />
            <SelectField
              name="status"
              label="Booking status"
              options={BOOKING_STATUSES.map((status) => ({
                value: status,
                label: STATUS_META[status].label,
              }))}
              defaultValue={params.status}
              allLabel="Any status"
            />
            <SelectField
              name="paymentStatus"
              label="Payment"
              options={PAYMENT_OPTIONS}
              defaultValue={params.paymentStatus}
              allLabel="Any payment"
            />
            <SelectField
              name="needsAttention"
              label="Attention"
              options={[{ value: "true", label: "Money stuck" }]}
              defaultValue={params.needsAttention}
              allLabel="All bookings"
            />
            <SelectField
              name="sort"
              label="Sort"
              options={SORT_OPTIONS}
              defaultValue={params.sort}
              allLabel={null}
            />
          </FilterForm>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Raised</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No bookings match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <Link
                        href={`/bookings/${booking._id}`}
                        className="flex items-center gap-1.5 font-medium hover:underline"
                      >
                        {booking.paymentReconciliationNeeded ||
                        booking.refundStatus === "FAILED" ||
                        booking.payoutStatus === "FAILED" ? (
                          <TriangleAlertIcon
                            className="size-3.5 shrink-0 text-status-critical"
                            aria-label="Money stuck on this booking"
                          />
                        ) : null}
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
                      <PaymentStatusBadge status={booking.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {booking.createdAt ? formatRelative(booking.createdAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <PaginationBar
            page={result.page}
            limit={result.limit}
            total={result.total}
            searchParams={params}
            className="px-(--card-spacing)"
          />
        </CardContent>
      </Card>
    </>
  )
}
