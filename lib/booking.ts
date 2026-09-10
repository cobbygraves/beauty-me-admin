import type {
  BookingStatus,
  PaymentStatus,
  SettlementStatus,
  VerificationStatus,
  VerificationTier,
} from "@/lib/types"

/**
 * Admin-side mirror of `server/src/booking/booking-state-machine.ts`, kept in
 * step with `mobile/lib/booking.ts` so a status reads the same word everywhere.
 *
 * The admin override endpoint deliberately bypasses this map — an operator
 * unsticking a deadlocked booking is exactly the case the state machine can't
 * express — so this copy drives labelling and the "this is an unusual jump"
 * warning rather than gating the control.
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  AWAITING_PAYMENT: ["PENDING", "CANCELLED"],
  PENDING: ["ACCEPTED", "DECLINED", "CANCELLED"],
  ACCEPTED: ["EN_ROUTE", "CANCELLED"],
  DECLINED: [],
  EN_ROUTE: ["ARRIVED", "CANCELLED", "NO_SHOW"],
  ARRIVED: ["IN_PROGRESS", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

export const BOOKING_STATUSES: BookingStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]

export const TERMINAL_STATUSES: BookingStatus[] = [
  "DECLINED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]

export const ACTIVE_STATUSES: BookingStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING",
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
]

export function isTerminal(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function isTransitionAllowed(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Semantic tones. These map to the reserved status colours, never to a chart
 * series — and every badge that wears one also carries its text label, which is
 * what keeps the meaning off colour alone.
 */
export type Tone = "pending" | "active" | "success" | "danger" | "muted"

interface StatusMeta {
  label: string
  tone: Tone
  /** What an operator needs to know about a booking sitting in this state. */
  blurb: string
}

export const STATUS_META: Record<BookingStatus, StatusMeta> = {
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    tone: "pending",
    blurb:
      "The client has not approved the charge yet. Auto-resolves against Paystack after the timeout.",
  },
  PENDING: {
    label: "Requested",
    tone: "pending",
    blurb:
      "Paid and waiting on the provider to accept. Auto-cancels and refunds if they never respond.",
  },
  ACCEPTED: {
    label: "Confirmed",
    tone: "active",
    blurb: "The provider has committed to the job.",
  },
  DECLINED: {
    label: "Declined",
    tone: "danger",
    blurb: "The provider turned the request down. The client was refunded in full.",
  },
  EN_ROUTE: {
    label: "On the way",
    tone: "active",
    blurb: "The provider is travelling to the client.",
  },
  ARRIVED: {
    label: "Arrived",
    tone: "active",
    blurb: "The provider is on site and has not started yet.",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "active",
    blurb: "The service is underway.",
  },
  COMPLETED: {
    label: "Completed",
    tone: "success",
    blurb: "Service delivered and the payout released to the provider.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "danger",
    blurb:
      "Cancelled before delivery. The refund depends on how late it was called off.",
  },
  NO_SHOW: {
    label: "No-show",
    tone: "danger",
    blurb: "The client was not there. The provider was paid for the trip.",
  },
}

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: Tone }
> = {
  PENDING: { label: "Pending", tone: "pending" },
  PAID: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
}

export const SETTLEMENT_STATUS_META: Record<
  SettlementStatus,
  { label: string; tone: Tone }
> = {
  NONE: { label: "None", tone: "muted" },
  PENDING: { label: "Pending", tone: "pending" },
  SUCCEEDED: { label: "Settled", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
}

export const VERIFICATION_META: Record<
  VerificationStatus,
  { label: string; tone: Tone; blurb: string }
> = {
  UNSUBMITTED: {
    label: "Not submitted",
    tone: "muted",
    blurb: "This provider has not uploaded any documents yet.",
  },
  PENDING: {
    label: "Awaiting review",
    tone: "pending",
    blurb: "Documents are in the queue and need an approve or reject decision.",
  },
  APPROVED: {
    label: "Verified",
    tone: "success",
    blurb: "Documents approved. This provider can take bookings.",
  },
  REJECTED: {
    label: "Rejected",
    tone: "danger",
    blurb: "Documents were rejected. The provider has been asked to resubmit.",
  },
}

/**
 * The badge a client sees on the marketplace card, from an operator's side.
 *
 * `NONE` is not a rejection - it is simply "not listed", the state every
 * provider is in before their first approval and the one a rejection returns
 * them to.
 */
export const TIER_META: Record<
  VerificationTier,
  { label: string; tone: Tone; blurb: string }
> = {
  NONE: {
    label: "Not listed",
    tone: "muted",
    blurb: "Not on the marketplace — clients cannot find or book them.",
  },
  ID: {
    label: "ID verified",
    tone: "active",
    blurb: "Government ID checked. Listed, with the standard badge.",
  },
  BUSINESS: {
    label: "Business verified",
    tone: "success",
    blurb:
      "Government ID and business registration both checked. Listed with the strongest badge.",
  },
}

/**
 * Reads a tier safely. A profile written before the field existed - and never
 * touched by the backfill - comes back without one through the aggregation
 * pipelines, which don't apply schema defaults.
 */
export function tierMetaOf(tier: VerificationTier | undefined) {
  return TIER_META[tier ?? "NONE"] ?? TIER_META.NONE
}

export const TRANSACTION_STATUS_META: Record<
  "PENDING" | "SUCCEEDED" | "FAILED",
  { label: string; tone: Tone }
> = {
  PENDING: { label: "Pending", tone: "pending" },
  SUCCEEDED: { label: "Succeeded", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
}

/** The happy path, in order — drives the audit timeline. */
export const TIMELINE_STEPS: { status: BookingStatus; label: string }[] = [
  { status: "PENDING", label: "Requested" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "EN_ROUTE", label: "On the way" },
  { status: "ARRIVED", label: "Arrived" },
  { status: "IN_PROGRESS", label: "Service started" },
  { status: "COMPLETED", label: "Completed" },
]

export const PAYMENT_CHANNEL_LABELS: Record<string, string> = {
  mobile_money: "Mobile money",
  card: "Card",
}

export const MOMO_PROVIDER_LABELS: Record<string, string> = {
  mtn: "MTN",
  vod: "Telecel",
  atl: "AirtelTigo",
}

export const ROLE_LABELS: Record<string, string> = {
  SUBSCRIBER: "Client",
  PROVIDER: "Provider",
  ADMIN: "Admin",
}
