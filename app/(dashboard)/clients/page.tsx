import Link from "next/link"
import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { FilterForm, SearchField, SelectField } from "@/components/filters"
import { PaginationBar } from "@/components/pagination-bar"
import { ToneBadge } from "@/components/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listUsers } from "@/lib/admin-api"
import {
  formatCurrency,
  formatDate,
  formatNumber,
  initialsOf,
} from "@/lib/format"

export const metadata: Metadata = { title: "Clients" }

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "username", label: "Name A–Z" },
]

const STATUS_OPTIONS = [
  { value: "false", label: "Active only" },
  { value: "true", label: "Suspended only" },
]

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const result = await listUsers({
    role: "SUBSCRIBER",
    q: params.q,
    suspended: params.suspended,
    sort: params.sort,
    page,
    limit: 20,
  })

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone who books through the Beautys app. Lifetime value counts every booking they have paid for."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 px-0">
          <FilterForm className="px-(--card-spacing)">
            <SearchField
              defaultValue={params.q}
              placeholder="Search name, email or mobile"
              className="w-full sm:w-72"
            />
            <SelectField
              name="suspended"
              label="Account status"
              options={STATUS_OPTIONS}
              defaultValue={params.suspended}
              allLabel="All accounts"
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
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Lifetime value</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No clients match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell>
                      <Link
                        href={`/clients/${client._id}`}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {initialsOf(client.username)}
                        </span>
                        <span className="font-medium">{client.username}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex flex-col">
                        <span>{client.mobile}</span>
                        <span className="text-xs">{client.email}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(client.bookingCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(client.completedCount)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(client.lifetimeValue)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.createdAt ? formatDate(client.createdAt) : "—"}
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
