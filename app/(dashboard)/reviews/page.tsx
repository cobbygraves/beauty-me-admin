import Link from "next/link"
import type { Metadata } from "next"
import { StarIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { FilterForm, SearchField, SelectField } from "@/components/filters"
import { PaginationBar } from "@/components/pagination-bar"
import { DeleteReviewButton } from "@/components/admin-actions"
import { Card, CardContent } from "@/components/ui/card"
import { listReviews } from "@/lib/admin-api"
import { formatDate, initialsOf } from "@/lib/format"

export const metadata: Metadata = { title: "Reviews" }

const RATING_OPTIONS = [
  { value: "1", label: "1 star only" },
  { value: "2", label: "2 stars and below" },
  { value: "3", label: "3 stars and below" },
]

const SORT_OPTIONS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "rating", label: "Lowest rated first" },
  { value: "-rating", label: "Highest rated first" },
]

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const result = await listReviews({
    q: params.q,
    maxRating: params.maxRating,
    sort: params.sort,
    page,
    limit: 20,
  })

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Client feedback on completed jobs. Removing a review also unwinds its effect on the provider's average, so moderation never leaves a rating permanently dented."
      />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <FilterForm>
            <SearchField
              defaultValue={params.q}
              placeholder="Search comment or person"
              className="w-full sm:w-72"
            />
            <SelectField
              name="maxRating"
              label="Rating"
              options={RATING_OPTIONS}
              defaultValue={params.maxRating}
              allLabel="Any rating"
            />
            <SelectField
              name="sort"
              label="Sort"
              options={SORT_OPTIONS}
              defaultValue={params.sort}
              allLabel={null}
            />
          </FilterForm>

          {result.items.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">
              No reviews match these filters.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {result.items.map((review) => (
                <li
                  key={review._id}
                  className="flex flex-wrap items-start gap-4 py-4 first:pt-0"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {initialsOf(review.clientName)}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
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
                      <span className="text-sm font-medium">
                        {review.clientName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        on{" "}
                        <Link
                          href={`/providers/${review.providerId}`}
                          className="font-medium hover:underline"
                        >
                          {review.providerName}
                        </Link>
                      </span>
                    </div>

                    {review.comment ? (
                      <p className="text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Rating only, no comment written.
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      <Link
                        href={`/bookings/${review.bookingId}`}
                        className="hover:underline"
                      >
                        {review.serviceName}
                      </Link>
                      {review.createdAt ? ` · ${formatDate(review.createdAt)}` : ""}
                    </p>
                  </div>

                  <DeleteReviewButton
                    reviewId={review._id}
                    providerName={review.providerName}
                  />
                </li>
              ))}
            </ul>
          )}

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
