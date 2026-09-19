import Link from "next/link"
import type { Metadata } from "next"
import {
  BanknoteIcon,
  RotateCcwIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { FilterForm, SearchField, SelectField } from "@/components/filters"
import { PaginationBar } from "@/components/pagination-bar"
import { StatTile } from "@/components/stat-tile"
import {
  SettlementStatusBadge,
  TransactionStatusBadge,
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
import { listTransactions } from "@/lib/admin-api"
import { MOMO_PROVIDER_LABELS, PAYMENT_CHANNEL_LABELS } from "@/lib/booking"
import { formatCurrency, formatDateTime } from "@/lib/format"

export const metadata: Metadata = { title: "Payments" }

const STATUS_OPTIONS = [
  { value: "SUCCEEDED", label: "Succeeded" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
]

const CHANNEL_OPTIONS = [
  { value: "mobile_money", label: "Mobile money" },
  { value: "card", label: "Card" },
]

const SETTLEMENT_OPTIONS = [
  { value: "PENDING", label: "In flight" },
  { value: "SUCCEEDED", label: "Settled" },
  { value: "FAILED", label: "Failed" },
  { value: "NONE", label: "Not applicable" },
]

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "-amount", label: "Largest first" },
]

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const result = await listTransactions({
    q: params.q,
    status: params.status,
    channel: params.channel,
    refundStatus: params.refundStatus,
    payoutStatus: params.payoutStatus,
    sort: params.sort,
    page,
    limit: 20,
  })

  const { summary } = result

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every charge taken through Paystack, with the refund and payout that settled against it. Totals below reflect the current filter, not just this page."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          emphasis
          label="Charged"
          value={formatCurrency(summary.amount)}
          hint="Gross across matching transactions"
          icon={BanknoteIcon}
        />
        <StatTile
          label="Refunded"
          value={formatCurrency(summary.refunded)}
          hint="Returned to clients"
          icon={RotateCcwIcon}
          upIsGood={false}
        />
        <StatTile
          label="Paid out"
          value={formatCurrency(summary.paidOut)}
          hint="Released to providers"
          icon={WalletIcon}
        />
        <StatTile
          label="Platform net"
          value={formatCurrency(summary.net)}
          hint="Charged less refunds and payouts"
          icon={TrendingUpIcon}
        />
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 px-0">
          <FilterForm className="px-(--card-spacing)">
            <SearchField
              defaultValue={params.q}
              placeholder="Search reference, person or service"
              className="w-full sm:w-72"
            />
            <SelectField
              name="status"
              label="Charge status"
              options={STATUS_OPTIONS}
              defaultValue={params.status}
              allLabel="Any charge status"
            />
            <SelectField
              name="channel"
              label="Channel"
              options={CHANNEL_OPTIONS}
              defaultValue={params.channel}
              allLabel="Any channel"
            />
            <SelectField
              name="refundStatus"
              label="Refund"
              options={SETTLEMENT_OPTIONS}
              defaultValue={params.refundStatus}
              allLabel="Any refund state"
            />
            <SelectField
              name="payoutStatus"
              label="Payout"
              options={SETTLEMENT_OPTIONS}
              defaultValue={params.payoutStatus}
              allLabel="Any payout state"
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
                <TableHead>Reference</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Charge</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Taken</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No transactions match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      <Link
                        href={`/bookings/${transaction.bookingId}`}
                        className="flex flex-col gap-0.5 hover:underline"
                      >
                        <span className="font-mono text-xs font-medium">
                          {transaction.paystackReference ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {transaction.momoProvider
                            ? MOMO_PROVIDER_LABELS[transaction.momoProvider]
                            : PAYMENT_CHANNEL_LABELS[transaction.channel]}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>{transaction.serviceName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.clientName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.providerName}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <TransactionStatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell>
                      {transaction.refundStatus === "NONE" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span className="flex flex-col gap-0.5">
                          <SettlementStatusBadge
                            status={transaction.refundStatus}
                          />
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(transaction.refundAmount)}
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.payoutStatus === "NONE" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <span className="flex flex-col gap-0.5">
                          <SettlementStatusBadge
                            status={transaction.payoutStatus}
                          />
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatCurrency(transaction.payoutAmount)}
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {transaction.createdAt
                        ? formatDateTime(transaction.createdAt)
                        : "—"}
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
