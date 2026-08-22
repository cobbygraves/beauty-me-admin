import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BanknoteIcon,
  BriefcaseIcon,
  ExternalLinkIcon,
  FileTextIcon,
  StarIcon,
  WalletIcon,
} from "lucide-react"

import { PageHeader, SectionHeading } from "@/components/page-header"
import { StatLine, StatTile } from "@/components/stat-tile"
import {
  BookingStatusBadge,
  OnlineBadge,
  ToneBadge,
  VerificationBadge,
} from "@/components/status-badge"
import {
  SuspendUserButton,
  VerifyProviderButtons,
} from "@/components/admin-actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getProviderDetail } from "@/lib/admin-api"
import { ApiError } from "@/lib/api"
import { VERIFICATION_META } from "@/lib/booking"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  initialsOf,
} from "@/lib/format"
import { formatMobile } from "@/lib/phone"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  try {
    const detail = await getProviderDetail(id)
    return {
      title: detail.profile.businessName || detail.user?.username || "Provider",
    }
  } catch {
    return { title: "Provider" }
  }
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let detail
  try {
    detail = await getProviderDetail(id)
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      notFound()
    }
    throw error
  }

  const { profile, user, categories, stats, recentBookings, reviews } = detail
  const displayName = profile.businessName || user?.username || "Provider"
  const verification = profile.verification
  const meta = VERIFICATION_META[verification.status]

  return (
    <>
      <Link
        href="/providers"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden />
        All providers
      </Link>

      <PageHeader
        title={displayName}
        description={
          user
            ? `${user.username} · ${formatMobile(user.mobile)} · joined ${
                profile.createdAt ? formatDate(profile.createdAt) : "—"
              }`
            : "The user account behind this profile no longer exists."
        }
        actions={
          user ? (
            <SuspendUserButton
              userId={user._id}
              username={user.username}
              isSuspended={Boolean(user.isSuspended)}
            />
          ) : null
        }
      />

      <section className="flex flex-wrap items-center gap-2">
        <VerificationBadge status={verification.status} />
        <OnlineBadge isOnline={profile.isOnline} />
        <ToneBadge
          tone={profile.payoutVerified ? "success" : "muted"}
          label={profile.payoutVerified ? "Payouts ready" : "No payout account"}
        />
        {user?.isSuspended ? (
          <ToneBadge tone="danger" label="Account suspended" />
        ) : null}
        <span className="text-sm text-muted-foreground">{meta.blurb}</span>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          emphasis
          label="Revenue earned"
          value={formatCurrency(stats.gross)}
          hint={`${formatCurrency(stats.payout)} paid out`}
          icon={BanknoteIcon}
        />
        <StatTile
          label="Jobs completed"
          value={formatNumber(stats.completed)}
          hint={`of ${formatNumber(stats.bookings)} booked`}
          icon={BriefcaseIcon}
        />
        <StatTile
          label="Awaiting payout"
          value={formatCurrency(stats.pendingPayout)}
          hint="Settlement in flight"
          icon={WalletIcon}
        />
        <StatTile
          label="Rating"
          value={
            profile.reviewCount ? profile.avgRating.toFixed(2) : "Not rated"
          }
          hint={`${formatNumber(profile.reviewCount)} reviews`}
          icon={StarIcon}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Verification</CardTitle>
            <CardDescription>{meta.blurb}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatLine
                label="Licence number"
                value={verification.licenseNumber || "Not provided"}
              />
              <StatLine
                label="Last reviewed"
                value={
                  verification.reviewedAt
                    ? formatDateTime(verification.reviewedAt)
                    : "Never"
                }
              />
            </div>

            {verification.rejectionReason ? (
              <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <strong className="font-medium">Rejected:</strong>{" "}
                {verification.rejectionReason}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <DocumentLink
                href={verification.idDocumentUrl}
                label="Identity document"
              />
              <DocumentLink
                href={verification.licenseDocumentUrl}
                label="Licence document"
              />
            </div>

            {/* An already-approved provider keeps both controls: revoking a
                verification after the fact is exactly what an operator needs
                when a document turns out to be forged. */}
            {verification.status === "UNSUBMITTED" ? (
              <p className="text-sm text-muted-foreground">
                Nothing to review — this provider has not submitted documents
                yet.
              </p>
            ) : (
              <VerifyProviderButtons
                providerId={profile._id}
                businessName={displayName}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
            <CardDescription>What clients see in the app.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initialsOf(displayName)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {user?.email ?? "—"}
                </span>
              </div>
            </div>

            {profile.bio ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bio written yet.
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              {categories.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No categories chosen.
                </span>
              ) : (
                categories.map((category) => (
                  <span
                    key={category._id}
                    className="rounded-4xl bg-muted px-2.5 py-1 text-xs font-medium"
                  >
                    {category.name}
                  </span>
                ))
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatLine
                label="Payout channel"
                value={
                  profile.payoutChannel === "mobile_money"
                    ? "Mobile money"
                    : profile.payoutChannel === "bank"
                      ? "Bank account"
                      : "Not set up"
                }
              />
              <StatLine
                label="Payout account"
                value={
                  profile.payoutAccountNumber
                    ? `${profile.payoutAccountName ?? ""} ${
                        profile.payoutAccountNumber
                      }`.trim()
                    : "—"
                }
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <SectionHeading
            title="Services"
            description="Published prices. A booking snapshots these, so later edits never change existing jobs."
          />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profile.services.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    This provider has not published any services.
                  </TableCell>
                </TableRow>
              ) : (
                profile.services.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell className="font-medium">
                      {service.name}
                    </TableCell>
                    <TableCell className="max-w-sm text-muted-foreground">
                      <span className="block truncate">
                        {service.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDuration(service.durationMinutes)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(service.price)}
                    </TableCell>
                    <TableCell>
                      <ToneBadge
                        tone={service.isActive ? "success" : "muted"}
                        label={service.isActive ? "Bookable" : "Hidden"}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {profile.portfolio.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>
              Work this provider is showing to clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {profile.portfolio.map((item) => (
                <li
                  key={item._id}
                  className="overflow-hidden rounded-xl ring-1 ring-foreground/10"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    {/* Portfolio images live on S3 under a bucket this app has
                        no build-time knowledge of, so they are rendered as
                        plain images rather than through next/image's optimiser. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.caption || "Portfolio item"}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent jobs</CardTitle>
            <CardDescription>The ten most recent bookings.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No bookings yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentBookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <Link
                          href={`/bookings/${booking._id}`}
                          className="font-medium hover:underline"
                        >
                          {booking.serviceName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {booking.clientName}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(booking.price)}
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent reviews</CardTitle>
            <CardDescription>
              What clients said. Moderate from the Reviews page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No reviews yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <li key={review._id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
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
                                ? "size-3 fill-current text-status-warning"
                                : "size-3 text-muted-foreground/30"
                            }
                          />
                        ))}
                      </span>
                      <span className="text-sm font-medium">
                        {review.clientName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {review.createdAt ? formatDate(review.createdAt) : ""}
                      </span>
                    </div>
                    {review.comment ? (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function DocumentLink({
  href,
  label,
}: {
  href?: string | null
  label: string
}) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-4xl border border-border px-3 py-1.5 text-sm text-muted-foreground">
        <FileTextIcon className="size-3.5" aria-hidden />
        {label} — not uploaded
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-4xl border border-border bg-input/30 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-input/50"
    >
      <FileTextIcon className="size-3.5" aria-hidden />
      {label}
      <ExternalLinkIcon className="size-3" aria-hidden />
    </a>
  )
}
