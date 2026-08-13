import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"

/**
 * Server-rendered pagination.
 *
 * The page number is a query parameter like every other filter, so each page is
 * a real, linkable URL and the browser's back button does the obvious thing.
 */
export function PaginationBar({
  page,
  limit,
  total,
  searchParams,
  className,
}: {
  page: number
  limit: number
  total: number
  /** The current query string, so paging preserves every active filter. */
  searchParams: Record<string, string | undefined>
  className?: string
}) {
  const lastPage = Math.max(1, Math.ceil(total / limit))
  const first = total === 0 ? 0 : (page - 1) * limit + 1
  const last = Math.min(page * limit, total)

  function hrefFor(target: number): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value)
    }
    if (target <= 1) params.delete("page")
    else params.set("page", String(target))
    const query = params.toString()
    return query ? `?${query}` : "?"
  }

  const linkClasses =
    "inline-flex h-8 items-center gap-1 rounded-4xl border border-border bg-input/30 px-3 text-sm font-medium transition-colors hover:bg-input/50"
  const disabledClasses =
    "inline-flex h-8 items-center gap-1 rounded-4xl border border-border px-3 text-sm font-medium text-muted-foreground opacity-50"

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 pt-1",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${formatNumber(first)}–${formatNumber(last)} of ${formatNumber(total)}`}
      </p>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClasses} rel="prev">
            <ChevronLeftIcon className="size-3.5" aria-hidden />
            Previous
          </Link>
        ) : (
          <span className={disabledClasses} aria-hidden>
            <ChevronLeftIcon className="size-3.5" />
            Previous
          </span>
        )}

        <span className="px-1 text-xs text-muted-foreground tabular-nums">
          Page {page} of {lastPage}
        </span>

        {page < lastPage ? (
          <Link href={hrefFor(page + 1)} className={linkClasses} rel="next">
            Next
            <ChevronRightIcon className="size-3.5" aria-hidden />
          </Link>
        ) : (
          <span className={disabledClasses} aria-hidden>
            Next
            <ChevronRightIcon className="size-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}
