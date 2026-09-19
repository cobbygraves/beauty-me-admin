import { format, parseISO } from "date-fns"

/**
 * Recharts hands the tooltip label formatter the raw category value plus the
 * payload; the payload is where the original datum (and so the full date) is,
 * since the axis has already been shortened to "12 Jul".
 */
export function formatFullDate(
  payload: readonly { payload?: { date?: string } }[] | undefined
): string {
  const date = payload?.[0]?.payload?.date
  if (!date) return ""
  return format(parseISO(date), "EEEE d MMMM yyyy")
}
