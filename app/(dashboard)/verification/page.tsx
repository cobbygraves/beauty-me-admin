import Link from "next/link"
import type { Metadata } from "next"
import { CheckCircle2Icon, ExternalLinkIcon, FileTextIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
import { VerifyProviderButtons } from "@/components/admin-actions"
import { ToneBadge } from "@/components/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAnalyticsOverview, listProviders } from "@/lib/admin-api"
import { formatCurrency, formatDate, formatNumber } from "@/lib/format"
import { formatMobile } from "@/lib/phone"

export const metadata: Metadata = { title: "Verification queue" }

export default async function VerificationPage() {
  const [queue, overview] = await Promise.all([
    listProviders({ verification: "PENDING", sort: "createdAt", limit: 50 }),
    getAnalyticsOverview(),
  ])

  const { totals } = overview

  return (
    <>
      <PageHeader
        title="Verification queue"
        description="Providers cannot be booked until their documents are approved, so this queue is the gate on marketplace supply. Oldest submissions first."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          emphasis
          label="Awaiting review"
          value={formatNumber(totals.pendingVerifications)}
          hint="Providers blocked on you"
        />
        <StatTile
          label="Verified"
          value={formatNumber(totals.approvedProviders)}
          hint="Able to take bookings"
        />
        <StatTile
          label="Rejected"
          value={formatNumber(totals.rejectedProviders)}
          hint="Asked to resubmit"
        />
        <StatTile
          label="Never submitted"
          value={formatNumber(totals.unsubmittedProviders)}
          hint="Signed up but not started"
        />
      </section>

      {queue.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-status-good/12">
              <CheckCircle2Icon
                className="size-6 text-[color-mix(in_oklch,var(--status-good),black_18%)] dark:text-status-good"
                aria-hidden
              />
            </span>
            <p className="font-heading text-base font-medium">
              The queue is clear
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Every provider who has submitted documents has had a decision. New
              submissions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {queue.items.map((provider) => (
            <li key={provider._id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/providers/${provider.userId}`}
                      className="hover:underline"
                    >
                      {provider.businessName || provider.username}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {provider.username} · {formatMobile(provider.mobile)} ·
                    submitted{" "}
                    {provider.createdAt ? formatDate(provider.createdAt) : "—"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  {provider.bio ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {provider.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No bio written.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <ToneBadge
                      tone={provider.activeServices ? "success" : "muted"}
                      label={`${formatNumber(provider.activeServices)} service${
                        provider.activeServices === 1 ? "" : "s"
                      }`}
                    />
                    {provider.minPrice !== null ? (
                      <span className="text-muted-foreground">
                        from {formatCurrency(provider.minPrice)}
                      </span>
                    ) : null}
                    <ToneBadge
                      tone={provider.payoutVerified ? "success" : "pending"}
                      label={
                        provider.payoutVerified
                          ? "Payout account ready"
                          : "No payout account"
                      }
                    />
                  </div>

                  {!provider.payoutVerified ? (
                    <p className="rounded-xl bg-status-warning/10 p-3 text-xs">
                      Approving is safe, but they still cannot be booked until
                      they add a payout account — the API refuses bookings for
                      providers who cannot be paid.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <DocumentChip
                      href={provider.verification.idDocumentUrl}
                      label="ID"
                    />
                    <DocumentChip
                      href={provider.verification.licenseDocumentUrl}
                      label="Licence"
                    />
                    {provider.verification.licenseNumber ? (
                      <span className="inline-flex items-center rounded-4xl bg-muted px-3 py-1.5 text-xs font-medium">
                        No. {provider.verification.licenseNumber}
                      </span>
                    ) : null}
                  </div>

                  <VerifyProviderButtons
                    providerId={provider._id}
                    businessName={provider.businessName || provider.username}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function DocumentChip({
  href,
  label,
}: {
  href?: string | null
  label: string
}) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-4xl border border-border px-3 py-1.5 text-xs text-muted-foreground">
        <FileTextIcon className="size-3" aria-hidden />
        {label} missing
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-4xl border border-border bg-input/30 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-input/50"
    >
      <FileTextIcon className="size-3" aria-hidden />
      View {label}
      <ExternalLinkIcon className="size-2.5" aria-hidden />
    </a>
  )
}
