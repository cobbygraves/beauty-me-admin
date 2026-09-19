import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 pb-1",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}

export function SectionHeading({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-sm font-medium">{title}</h2>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}

export function EmptyRow({
  message,
  colSpan,
}: {
  message: string
  colSpan: number
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="p-10 text-center text-sm text-muted-foreground"
      >
        {message}
      </td>
    </tr>
  )
}
