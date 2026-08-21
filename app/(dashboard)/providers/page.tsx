import Link from "next/link"
import type { Metadata } from "next"
import { StarIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { FilterForm, SearchField, SelectField } from "@/components/filters"
import { PaginationBar } from "@/components/pagination-bar"
import {
  OnlineBadge,
  ToneBadge,
  VerificationBadge,
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
import { listCategories, listProviders } from "@/lib/admin-api"
import { formatCurrency, formatNumber, initialsOf } from "@/lib/format"

export const metadata: Metadata = { title: "Providers" }

const VERIFICATION_OPTIONS = [
  { value: "PENDING", label: "Awaiting review" },
  { value: "APPROVED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "UNSUBMITTED", label: "Not submitted" },
]

const ONLINE_OPTIONS = [
  { value: "true", label: "Online now" },
  { value: "false", label: "Offline" },
]

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "-avgRating", label: "Highest rated" },
  { value: "-reviewCount", label: "Most reviewed" },
  { value: "businessName", label: "Business A–Z" },
]

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const [result, categories] = await Promise.all([
    listProviders({
      q: params.q,
      verification: params.verification,
      online: params.online,
      categoryId: params.categoryId,
      sort: params.sort,
      page,
      limit: 20,
    }),
    listCategories(),
  ])

  return (
    <>
      <PageHeader
        title="Providers"
        description="Everyone offering services on Beautys. Only verified providers with a payout account can be booked."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 px-0">
          <FilterForm className="px-(--card-spacing)">
            <SearchField
              defaultValue={params.q}
              placeholder="Search business, name or mobile"
              className="w-full sm:w-72"
            />
            <SelectField
              name="verification"
              label="Verification"
              options={VERIFICATION_OPTIONS}
              defaultValue={params.verification}
              allLabel="Any verification"
            />
            <SelectField
              name="online"
              label="Availability"
              options={ONLINE_OPTIONS}
              defaultValue={params.online}
              allLabel="Any availability"
            />
            <SelectField
              name="categoryId"
              label="Category"
              options={categories.map((category) => ({
                value: category._id,
                label: category.name,
              }))}
              defaultValue={params.categoryId}
              allLabel="Any category"
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
                <TableHead>Provider</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="text-right">Services</TableHead>
                <TableHead className="text-right">Jobs done</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead>Payouts</TableHead>
                <TableHead>Now</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No providers match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                result.items.map((provider) => (
                  <TableRow key={provider._id}>
                    <TableCell>
                      <Link
                        href={`/providers/${provider.userId}`}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {initialsOf(
                            provider.businessName || provider.username
                          )}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium">
                            {provider.businessName || provider.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {provider.mobile}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {provider.isSuspended ? (
                        <ToneBadge tone="danger" label="Suspended" />
                      ) : (
                        <VerificationBadge
                          status={provider.verification.status}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(provider.activeServices)}
                      {provider.minPrice !== null ? (
                        <span className="block text-xs text-muted-foreground">
                          from {formatCurrency(provider.minPrice)}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(provider.completedCount)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(provider.grossRevenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {provider.reviewCount ? (
                        <span className="inline-flex items-center gap-1">
                          <StarIcon
                            className="size-3 fill-current text-status-warning"
                            aria-hidden
                          />
                          {provider.avgRating.toFixed(1)}
                          <span className="text-xs text-muted-foreground">
                            ({provider.reviewCount})
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">New</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ToneBadge
                        tone={provider.payoutVerified ? "success" : "muted"}
                        label={provider.payoutVerified ? "Ready" : "Not set up"}
                      />
                    </TableCell>
                    <TableCell>
                      <OnlineBadge isOnline={provider.isOnline} />
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
