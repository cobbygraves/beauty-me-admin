import Link from "next/link"
import { SearchXIcon } from "lucide-react"

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <SearchXIcon className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="font-heading text-xl font-semibold">Nothing here</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        That record does not exist, or the id in the URL is malformed.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-primary hover:underline"
      >
        Back to the dashboard
      </Link>
    </div>
  )
}
