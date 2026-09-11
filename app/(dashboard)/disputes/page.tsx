import Link from "next/link"
import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { FilterForm, SearchField } from "@/components/filters"
import { PaginationBar } from "@/components/pagination-bar"
import { ResolveDisputeButton } from "@/components/admin-actions"
import { BookingStatusBadge } from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listDisputes } from "@/lib/admin-api"
import { formatCurrency, formatDateTime, formatRelative } from "@/lib/format"

export const metadata: Metadata = { title: "Disputes" }

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const result = await listDisputes({ q: params.q, page, limit: 20 })

  return (
    <>
      <PageHeader
        title="Disputes"
        description="Payouts frozen because a client reported a problem. Nothing releases these automatically — a provider's money stays put until you rule on it, so work the list from the top."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 px-0">
          <FilterForm className="px-(--card-spacing)">
            <SearchField
              defaultValue={params.q}
              placeholder="Search service, address or person"
              className="w-full sm:w-72"
            />
          </FilterForm>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Their report</TableHead>
                <TableHead className="text-right">Held</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ruling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No client has an open report. Payouts are releasing on
                    schedule.
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <Link
                        href={`/bookings/${booking._id}`}
                        className="font-medium hover:underline"
                      >
                        {booking.serviceName}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {formatDateTime(booking.scheduledAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.clientName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.providerName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.payoutDisputedAt
                        ? formatRelative(booking.payoutDisputedAt)
                        : "—"}
                    </TableCell>
                    {/* The client's own words, and the whole reason this row
                        exists — worth the width even truncated. */}
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2 text-muted-foreground">
                        {booking.payoutDisputeReason ?? "No reason given"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(booking.payoutAmount)}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ResolveDisputeButton
                        bookingId={booking._id}
                        providerName={booking.providerName}
                        clientName={booking.clientName}
                        payoutAmount={booking.payoutAmount}
                        price={booking.price}
                      />
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
          />
        </CardContent>
      </Card>
    </>
  )
}
