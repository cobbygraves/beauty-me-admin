"use client"

import { useEffect } from "react"
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Catch-all for a page whose data fetch failed — most often the API being
 * unreachable. It names the likely cause rather than showing a bare stack,
 * because the usual fix is "start the server" or "check API_URL".
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircleIcon className="size-6 text-destructive" aria-hidden />
      </span>
      <h1 className="font-heading text-xl font-semibold">
        This page could not load
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {error.message ||
          "Something went wrong fetching data from the Beautys API."}
      </p>
      <Button variant="outline" onClick={reset} className="mt-2">
        <RotateCcwIcon />
        Try again
      </Button>
    </div>
  )
}
