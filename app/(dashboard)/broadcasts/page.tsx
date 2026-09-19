import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { BroadcastComposer } from "@/components/broadcast-composer"
import { PaginationBar } from "@/components/pagination-bar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAnalyticsOverview, listBroadcasts } from "@/lib/admin-api"
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format"

export const metadata: Metadata = { title: "Broadcasts" }

export default async function BroadcastsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)

  const [overview, history] = await Promise.all([
    getAnalyticsOverview(),
    listBroadcasts({ page, limit: 10 }),
  ])

  const { totals } = overview
  const audienceSizes = {
    // Suspended accounts are excluded by the API, so the reach shown here is
    // the honest upper bound rather than the raw account count.
    all: Math.max(totals.totalClients + totals.totalProviders - totals.suspendedUsers, 0),
    clients: totals.totalClients,
    providers: totals.totalProviders,
  }

  return (
    <>
      <PageHeader
        title="Broadcasts"
        description="Send an announcement to one side of the marketplace, or to everyone. Messages land in the app's alerts feed and as a push notification."
      />

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compose</CardTitle>
            <CardDescription>
              Write it the way a client or provider will read it — this goes
              straight to their phone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BroadcastComposer audienceSizes={audienceSizes} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sent</CardTitle>
            <CardDescription>
              Past broadcasts and how many recipients have opened them.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {history.items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nothing has been broadcast yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {history.items.map((broadcast, index) => (
                  <li
                    key={`${broadcast.title}-${index}`}
                    className="flex flex-col gap-1.5 py-4 first:pt-0"
                  >
                    <p className="font-medium">{broadcast.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {broadcast.body}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(broadcast.sentAt)} ·{" "}
                      {formatNumber(broadcast.recipients)} recipients ·{" "}
                      {formatPercent(
                        (broadcast.readCount / broadcast.recipients) * 100,
                        0
                      )}{" "}
                      opened
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <PaginationBar
              page={history.page}
              limit={history.limit}
              total={history.total}
              searchParams={params}
            />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
