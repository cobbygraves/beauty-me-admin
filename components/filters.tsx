"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * Filters live in the URL, not in component state.
 *
 * Every list in this dashboard is filtered, sorted and paginated on the server,
 * so the query string is the single source of truth: a filtered view is
 * linkable, survives a reload, and can't drift out of step with the rows it
 * describes. This form just serialises its own fields into that query string.
 */
export function FilterForm({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = React.useTransition()
  const formRef = React.useRef<HTMLFormElement>(null)

  const apply = React.useCallback(
    (form: HTMLFormElement) => {
      const params = new URLSearchParams()

      for (const [key, value] of new FormData(form).entries()) {
        if (typeof value !== "string") continue
        const trimmed = value.trim()
        if (trimmed) params.set(key, trimmed)
      }

      // Any filter change invalidates the current page number — page 7 of the
      // old result set is rarely page 7 of the new one.
      const query = params.toString()
      startTransition(() => router.push(query ? `${pathname}?${query}` : pathname))
    },
    [pathname, router]
  )

  return (
    <form
      ref={formRef}
      className={cn(
        "flex flex-wrap items-end gap-2 [&_select]:min-w-0",
        className
      )}
      onSubmit={(event) => {
        event.preventDefault()
        apply(event.currentTarget)
      }}
      onChange={(event) => {
        // Text inputs submit on Enter or blur; everything else applies
        // immediately, which is what makes the toolbar feel like a filter
        // rather than a form.
        const target = event.target as HTMLElement
        if (target instanceof HTMLInputElement && target.type === "search") {
          return
        }
        apply(event.currentTarget)
      }}
    >
      {children}
      <button type="submit" className="sr-only">
        Apply filters
      </button>
      <span
        aria-live="polite"
        className={cn(
          "ml-auto flex h-9 items-center gap-2 text-xs text-muted-foreground transition-opacity",
          isPending ? "opacity-100" : "opacity-0"
        )}
      >
        <Spinner className="size-3.5" />
        Updating
      </span>
    </form>
  )
}

const CONTROL_CLASSES =
  "h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:hover:bg-input/50"

export function SearchField({
  name = "q",
  defaultValue,
  placeholder = "Search",
  className,
}: {
  name?: string
  defaultValue?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(CONTROL_CLASSES, "w-full pl-9")}
      />
    </div>
  )
}

export interface FilterOption {
  value: string
  label: string
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  allLabel = "All",
  className,
}: {
  name: string
  label: string
  options: FilterOption[]
  defaultValue?: string
  /** Text for the unset option; omit the option entirely by passing null. */
  allLabel?: string | null
  className?: string
}) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={defaultValue ?? ""}
      className={cn(CONTROL_CLASSES, "pr-8", className)}
    >
      {allLabel === null ? null : <option value="">{allLabel}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Preserves a value across a filter change without giving it a visible control —
 * used to keep a detail page's subject id in the query string.
 */
export function HiddenField({
  name,
  value,
}: {
  name: string
  value?: string | number
}) {
  if (value === undefined || value === "") return null
  return <input type="hidden" name={name} value={String(value)} />
}
