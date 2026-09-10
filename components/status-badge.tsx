import { cn } from "@/lib/utils"
import {
  PAYMENT_STATUS_META,
  SETTLEMENT_STATUS_META,
  STATUS_META,
  tierMetaOf,
  TRANSACTION_STATUS_META,
  VERIFICATION_META,
  type Tone,
} from "@/lib/booking"
import type {
  BookingStatus,
  PaymentStatus,
  SettlementStatus,
  VerificationStatus,
  VerificationTier,
} from "@/lib/types"

/**
 * Semantic state, shown as a tinted pill.
 *
 * Every badge carries its label, so the colour is a reinforcement and never the
 * message — which is what keeps `warning` and `serious` usable despite sitting
 * under 3:1 against a light surface.
 */
const TONE_CLASSES: Record<Tone, string> = {
  pending:
    "bg-status-warning/15 text-[color-mix(in_oklch,var(--status-warning),black_28%)] dark:bg-status-warning/20 dark:text-status-warning",
  active:
    "bg-primary/10 text-primary dark:bg-primary/20 dark:text-[color-mix(in_oklch,var(--primary),white_45%)]",
  success:
    "bg-status-good/12 text-[color-mix(in_oklch,var(--status-good),black_18%)] dark:bg-status-good/20 dark:text-status-good",
  danger:
    "bg-status-critical/12 text-status-critical dark:bg-status-critical/20 dark:text-[color-mix(in_oklch,var(--status-critical),white_22%)]",
  muted: "bg-muted text-muted-foreground",
}

function ToneBadge({
  tone,
  label,
  className,
}: {
  tone: Tone
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
      />
      {label}
    </span>
  )
}

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  return <ToneBadge tone={meta.tone} label={meta.label} className={className} />
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus
  className?: string
}) {
  const meta = PAYMENT_STATUS_META[status]
  return <ToneBadge tone={meta.tone} label={meta.label} className={className} />
}

export function SettlementStatusBadge({
  status,
  label,
  className,
}: {
  status: SettlementStatus
  /** Prefix such as "Refund" / "Payout", so two of these never read alike. */
  label?: string
  className?: string
}) {
  const meta = SETTLEMENT_STATUS_META[status]
  return (
    <ToneBadge
      tone={meta.tone}
      label={label ? `${label} ${meta.label.toLowerCase()}` : meta.label}
      className={className}
    />
  )
}

export function TransactionStatusBadge({
  status,
  className,
}: {
  status: "PENDING" | "SUCCEEDED" | "FAILED"
  className?: string
}) {
  const meta = TRANSACTION_STATUS_META[status]
  return <ToneBadge tone={meta.tone} label={meta.label} className={className} />
}

export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus
  className?: string
}) {
  const meta = VERIFICATION_META[status]
  return <ToneBadge tone={meta.tone} label={meta.label} className={className} />
}

/**
 * What the marketplace shows for this provider. Distinct from
 * `VerificationBadge`, which reports where their newest submission stands - the
 * two disagree on purpose while an ID-verified provider has a business
 * registration under review.
 */
export function TierBadge({
  tier,
  className,
}: {
  tier: VerificationTier | undefined
  className?: string
}) {
  const meta = tierMetaOf(tier)
  return <ToneBadge tone={meta.tone} label={meta.label} className={className} />
}

export function OnlineBadge({
  isOnline,
  className,
}: {
  isOnline: boolean
  className?: string
}) {
  return (
    <ToneBadge
      tone={isOnline ? "success" : "muted"}
      label={isOnline ? "Online" : "Offline"}
      className={className}
    />
  )
}

export { ToneBadge }
