import Link from "next/link"
import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { RetrySettlementButton } from "@/components/admin-actions"
import { SettlementStatusBadge } from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listStalledSettlements } from "@/lib/admin-api"
import { formatCurrency, formatRelative } from "@/lib/format"

export const metadata: Metadata = { title: "Stuck payouts" }

export default async function SettlementsPage() {
  const result = await listStalledSettlements()

  return (
    <>
      <PageHeader
        title="Stuck payouts"
        description={`Settlements that failed ${result.maxRetries} times, after which the hourly sweep stops retrying them. Nothing here moves on its own — a provider on this list is not getting paid until someone acts.`}
      />

      <Card>
        <CardContent className="flex flex-col gap-4 px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Waiting</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead className="text-right">Owed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-10 text-center text-muted-foreground"
                  >
                    Nothing is stuck. Every payout and refund is either settled
                    or still being retried.
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((row) => {
                  // A row can be here for either leg. Which one failed
                  // decides whose money is stranded, so it decides what the
                  // row says.
                  const isRefund = row.refundRetryCount >= result.maxRetries
                  const amount = isRefund ? row.refundAmount : row.payoutAmount
                  const failures = isRefund
                    ? row.refundRetryCount
                    : row.payoutRetryCount

                  return (
                    <TableRow key={row._id}>
                      <TableCell>
                        <Link
                          href={`/bookings/${row.bookingId}`}
                          className="font-medium hover:underline"
                        >
                          {row.serviceName}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {isRefund
                            ? `Refund to ${row.clientName}`
                            : "Payout"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.providerName}
                      </TableCell>
                      {/* The Paystack reference is what an operator searches
                          for in the Paystack dashboard to find out what
                          actually went wrong, so it earns a column. */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.paystackReference}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelative(row.createdAt)}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {failures}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(amount)}
                      </TableCell>
                      <TableCell>
                        <SettlementStatusBadge
                          status={
                            isRefund ? row.refundStatus : row.payoutStatus
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <RetrySettlementButton
                          bookingId={row.bookingId}
                          providerName={row.providerName}
                          payoutAmount={amount}
                          failures={failures}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Before retrying, check the cause in the Paystack dashboard. The usual
        three are an empty Paystack balance (transfers draw on it, and it
        empties each time Paystack settles to your bank), a recipient account
        that no longer resolves, and transfer OTP left enabled — which parks
        every transfer awaiting a code nothing in the app supplies.
      </p>
    </>
  )
}
