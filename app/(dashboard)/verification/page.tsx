import Link from "next/link"
import type { Metadata } from "next"
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileTextIcon,
  ShieldAlertIcon,
  UserRoundIcon,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
import {
  ClearIdentityHoldButton,
  RejectPhotoButton,
  SuspendUserButton,
  VerifyProviderButtons,
} from "@/components/admin-actions"
import { ToneBadge } from "@/components/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAnalyticsOverview, listProviders } from "@/lib/admin-api"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/lib/format"
import { formatMobile } from "@/lib/phone"

export const metadata: Metadata = { title: "Verification queue" }

export default async function VerificationPage() {
  const [queue, holds, overview] = await Promise.all([
    listProviders({ verification: "PENDING", sort: "createdAt", limit: 50 }),
    listProviders({ identityHold: "true", limit: 50 }),
    getAnalyticsOverview(),
  ])

  const { totals } = overview

  return (
    <>
      <PageHeader
        title="Verification queue"
        description="Nothing reaches the marketplace until it clears this queue, so it is the gate on supply. A government ID is all that is required; a business registration is optional and earns the stronger badge clients see. Oldest submissions first."
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

      {holds.items.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlertIcon className="size-4 text-destructive" aria-hidden />
            <h2 className="font-heading text-base font-medium">
              Identity reports
            </h2>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            These providers have two or more standing reports from clients that
            someone else turned up, so they are off the marketplace. Rule on
            each report in Disputes: a report ruled in the provider’s favour
            comes off their count and can lift the pause on its own. Clear the
            hold if they check out; suspend the account if someone else is doing
            their jobs.
          </p>
          <ul className="grid gap-4 xl:grid-cols-2">
            {holds.items.map((provider) => {
              const name = provider.businessName || provider.username
              const hold = provider.identityHold
              return (
                <li key={provider._id}>
                  <Card className="h-full border-destructive/40">
                    <CardHeader>
                      <CardTitle>
                        <Link
                          href={`/providers/${provider.userId}`}
                          className="hover:underline"
                        >
                          {name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {provider.username} · {formatMobile(provider.mobile)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <FacePhoto
                          url={provider.photoUrl}
                          label="Approved photo"
                        />
                        <div className="flex flex-col gap-1 text-sm">
                          <p>
                            Reported{" "}
                            {hold?.lastReportedAt
                              ? formatDateTime(hold.lastReportedAt)
                              : "—"}
                          </p>
                          <p className="text-muted-foreground">
                            {formatNumber(hold?.reportCount ?? 1)} report
                            {(hold?.reportCount ?? 1) === 1 ? "" : "s"} on this
                            account in total
                          </p>
                          {hold?.lastBookingId ? (
                            <Link
                              href={`/bookings/${hold.lastBookingId}`}
                              className="w-fit text-sm underline-offset-4 hover:underline"
                            >
                              View the reported booking
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ClearIdentityHoldButton
                          providerId={provider._id}
                          businessName={name}
                        />
                        <SuspendUserButton
                          userId={provider.userId}
                          username={provider.username}
                          isSuspended={provider.isSuspended}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

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

                  {/* Approving publishes this photo to clients as the face
                      to check at their door, so it is laid out to be
                      compared with the ID before anything else. */}
                  <div className="flex items-start gap-4">
                    <FacePhoto
                      url={provider.verification.photoUrl}
                      label="Submitted photo"
                    />
                    <div className="flex flex-col gap-2">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Open the ID and check this is the same person, a real
                        photo of a face (not a logo or a picture of a picture),
                        and recent. Approving shows it to every client who books
                        them.
                      </p>
                      {provider.verification.photoUrl ? (
                        <div>
                          <RejectPhotoButton
                            providerId={provider._id}
                            businessName={
                              provider.businessName || provider.username
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DocumentChip
                      href={provider.verification.idDocumentUrl}
                      label="ID"
                    />
                    <DocumentChip
                      href={provider.verification.licenseDocumentUrl}
                      label="business registration"
                      optional
                    />
                    {provider.verification.licenseNumber ? (
                      <span className="inline-flex items-center rounded-4xl bg-muted px-3 py-1.5 text-xs font-medium">
                        No. {provider.verification.licenseNumber}
                      </span>
                    ) : null}
                  </div>

                  {provider.verification.approvedTier === "ID" ? (
                    <p className="rounded-xl bg-status-good/10 p-3 text-xs">
                      Already live as Verified — this is an upgrade request.
                      They stay listed and badged whichever way you decide.
                    </p>
                  ) : null}

                  <VerifyProviderButtons
                    providerId={provider._id}
                    businessName={provider.businessName || provider.username}
                    hasBusinessDocument={Boolean(
                      provider.verification.licenseDocumentUrl
                    )}
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

function FacePhoto({ url, label }: { url?: string | null; label: string }) {
  if (!url) {
    return (
      <span className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-center text-[11px] text-muted-foreground">
        <UserRoundIcon className="size-5" aria-hidden />
        No photo
      </span>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block shrink-0"
      title={`${label} — open full size`}
    >
      {/* Served from S3, which next/image has no build-time config for. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="size-24 rounded-xl object-cover"
        loading="lazy"
      />
    </a>
  )
}

function DocumentChip({
  href,
  label,
  optional = false,
}: {
  href?: string | null
  label: string
  /** Reads as a choice the provider made rather than a gap to chase. */
  optional?: boolean
}) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-4xl border border-border px-3 py-1.5 text-xs text-muted-foreground">
        <FileTextIcon className="size-3" aria-hidden />
        {optional ? `No ${label}` : `${label} missing`}
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
