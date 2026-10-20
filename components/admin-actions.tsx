"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ActionDialog, DialogField } from "@/components/action-dialog"
import { CountrySelect } from "@/components/country-select"
import { countryOfE164, DEFAULT_COUNTRY_ISO, toLocalFormat } from "@/lib/phone"
import { setUserSuspension, updateUser } from "@/lib/actions/users"
import {
  clearIdentityHold,
  rejectProviderPhoto,
  verifyProvider,
} from "@/lib/actions/providers"
import { overrideBooking, resolveDispute } from "@/lib/actions/bookings"
import { deleteReview } from "@/lib/actions/reviews"
import { retrySettlement } from "@/lib/actions/settlements"
import { BOOKING_STATUSES, STATUS_META, ROLE_LABELS } from "@/lib/booking"
import { formatCurrency } from "@/lib/format"
import type { BookingStatus, Role } from "@/lib/types"

const SELECT_CLASSES =
  "h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function SuspendUserButton({
  userId,
  username,
  isSuspended,
}: {
  userId: string
  username: string
  isSuspended: boolean
}) {
  if (isSuspended) {
    return (
      <ActionDialog
        action={setUserSuspension}
        title={`Reinstate ${username}?`}
        description="They will be able to sign in to the mobile app again straight away, and will be told their account is active."
        submitLabel="Reinstate account"
        pendingLabel="Reinstating…"
        trigger={<Button variant="outline">Reinstate</Button>}
      >
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="suspend" value="false" />
      </ActionDialog>
    )
  }

  return (
    <ActionDialog
      action={setUserSuspension}
      title={`Suspend ${username}?`}
      description="They are signed out immediately and cannot sign back in. Bookings already in flight are not cancelled — handle those separately."
      submitLabel="Suspend account"
      submitVariant="destructive"
      pendingLabel="Suspending…"
      trigger={<Button variant="destructive">Suspend</Button>}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="suspend" value="true" />
      <DialogField
        label="Reason"
        hint="Sent to the account holder, so write it for them to read."
      >
        <Textarea
          name="reason"
          required
          rows={3}
          placeholder="Repeated no-shows reported by providers."
        />
      </DialogField>
    </ActionDialog>
  )
}

export function EditUserButton({
  userId,
  username,
  email,
  mobile,
  role,
}: {
  userId: string
  username: string
  email: string
  mobile: string
  role: Role
}) {
  return (
    <ActionDialog
      action={updateUser}
      title="Edit account"
      description="Changing a role to Provider also creates the provider profile they need to publish services."
      submitLabel="Save changes"
      pendingLabel="Saving…"
      trigger={<Button variant="outline">Edit</Button>}
    >
      <input type="hidden" name="userId" value={userId} />
      <DialogField label="Name">
        <Input name="username" defaultValue={username} />
      </DialogField>
      <DialogField label="Email">
        <Input name="email" type="email" defaultValue={email} />
      </DialogField>
      <DialogField label="Mobile">
        {/* Shown split the way it was entered — the country beside the local
            number — rather than as the stored `+233241234567`. Retyping either
            half is enough; the action recombines them into E.164. */}
        <div className="flex gap-2">
          <CountrySelect
            defaultValue={countryOfE164(mobile)?.iso2 ?? DEFAULT_COUNTRY_ISO}
          />
          <Input name="mobile" defaultValue={toLocalFormat(mobile)} />
        </div>
      </DialogField>
      <DialogField label="Role">
        <select name="role" defaultValue={role} className={SELECT_CLASSES}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option
              key={value}
              value={value}
              className="bg-background text-foreground"
            >
              {label}
            </option>
          ))}
        </select>
      </DialogField>
    </ActionDialog>
  )
}

export function VerifyProviderButtons({
  providerId,
  businessName,
  hasBusinessDocument = false,
}: {
  providerId: string
  businessName: string
  /**
   * Whether a business registration was submitted alongside the ID. It decides
   * which badge the approval can award — the stronger one is never offered
   * against a certificate nobody sent, and the API refuses it either way.
   */
  hasBusinessDocument?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionDialog
        action={verifyProvider}
        title={`Approve ${businessName}?`}
        description={
          hasBusinessDocument
            ? "They go live on the marketplace immediately and are notified in the app. Choose which badge their documents earn."
            : "They go live on the marketplace immediately with the ID-verified badge, and are notified in the app."
        }
        submitLabel="Approve provider"
        pendingLabel="Approving…"
        trigger={<Button>Approve</Button>}
      >
        <input type="hidden" name="providerId" value={providerId} />
        <input type="hidden" name="status" value="APPROVED" />
        {hasBusinessDocument ? (
          <DialogField
            label="Award badge"
            hint="Approving at ID only keeps a sound identity check while turning down the business certificate — it costs them nothing they already had."
          >
            <select
              name="approvedTier"
              defaultValue="BUSINESS"
              className={SELECT_CLASSES}
            >
              <option
                value="BUSINESS"
                className="bg-background text-foreground"
              >
                Business verified — ID and registration both check out
              </option>
              <option value="ID" className="bg-background text-foreground">
                ID verified — identity only
              </option>
            </select>
          </DialogField>
        ) : null}
      </ActionDialog>

      <ActionDialog
        action={verifyProvider}
        title={`Reject ${businessName}'s documents?`}
        description="They come off the marketplace, lose any badge they hold and are asked to resubmit. Your reason is what they see."
        submitLabel="Reject documents"
        submitVariant="destructive"
        pendingLabel="Rejecting…"
        trigger={<Button variant="outline">Reject</Button>}
      >
        <input type="hidden" name="providerId" value={providerId} />
        <input type="hidden" name="status" value="REJECTED" />
        <DialogField
          label="Reason"
          hint="Be specific — this is the only guidance they get before resubmitting."
        >
          <Textarea
            name="rejectionReason"
            required
            rows={3}
            placeholder="The ID photo is too blurred to read the expiry date."
          />
        </DialogField>
      </ActionDialog>
    </div>
  )
}

/**
 * Turns down the provider's face photo on its own. Their listing, badge and
 * any documents still under review are left alone.
 */
export function RejectPhotoButton({
  providerId,
  businessName,
}: {
  providerId: string
  businessName: string
}) {
  return (
    <ActionDialog
      action={rejectProviderPhoto}
      title={`Reject ${businessName}'s photo?`}
      description="Only the photo is turned down. They keep their listing, badge and anything else under review, and are asked to take a new photo. Your reason is what they see."
      submitLabel="Reject photo"
      submitVariant="destructive"
      pendingLabel="Rejecting…"
      trigger={
        <Button variant="outline" size="sm">
          Reject photo only
        </Button>
      }
    >
      <input type="hidden" name="providerId" value={providerId} />
      <DialogField
        label="Reason"
        hint="Tell them what to fix — this is all the guidance they get."
      >
        <Textarea
          name="reason"
          required
          rows={3}
          placeholder="Your face is in shadow. Take it facing a window, without sunglasses."
        />
      </DialogField>
    </ActionDialog>
  )
}

/**
 * Clears a client's identity report. There is no "uphold" counterpart: a
 * provider found to be sending someone else is dealt with by suspending the
 * account, which is its own button.
 */
export function ClearIdentityHoldButton({
  providerId,
  businessName,
}: {
  providerId: string
  businessName: string
}) {
  return (
    <ActionDialog
      action={clearIdentityHold}
      title={`Clear the hold on ${businessName}?`}
      description="They go back on the marketplace and can take bookings straight away. Only do this once you are satisfied the right person is doing their jobs."
      submitLabel="Clear hold"
      pendingLabel="Clearing…"
      trigger={<Button variant="outline">Clear hold</Button>}
    >
      <input type="hidden" name="providerId" value={providerId} />
      <DialogField
        label="What did you check?"
        hint="Kept on their record. Say who you spoke to and what convinced you."
      >
        <Textarea
          name="note"
          required
          rows={3}
          placeholder="Called the client and the provider. Client had the wrong address; the provider matched their photo on a video call."
        />
      </DialogField>
    </ActionDialog>
  )
}

export function OverrideBookingButton({
  bookingId,
  currentStatus,
}: {
  bookingId: string
  currentStatus: BookingStatus
}) {
  return (
    <ActionDialog
      action={overrideBooking}
      title="Override booking status"
      description="This bypasses the normal state machine and stamps whatever refund or payout the new status implies. It is recorded against your name in the audit trail."
      submitLabel="Apply override"
      submitVariant="destructive"
      pendingLabel="Applying…"
      trigger={<Button variant="destructive">Override status</Button>}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <DialogField
        label="Move to"
        hint={`Currently ${STATUS_META[currentStatus].label}.`}
      >
        <select
          name="status"
          defaultValue={currentStatus}
          className={SELECT_CLASSES}
        >
          {BOOKING_STATUSES.map((status) => (
            <option
              key={status}
              value={status}
              className="bg-background text-foreground"
            >
              {STATUS_META[status].label}
            </option>
          ))}
        </select>
      </DialogField>
      <DialogField
        label="Reason"
        hint="At least 8 characters. Written to the booking's permanent history."
      >
        <Textarea
          name="reason"
          required
          rows={3}
          placeholder="Provider unreachable for 3 days; refunding the client in full."
        />
      </DialogField>
    </ActionDialog>
  )
}

/**
 * The only exit from a disputed payout — nothing releases a frozen one on its
 * own. The two outcomes are irreversible the moment the transfer or refund
 * lands, so both the choice and the note are made explicit rather than
 * defaulted.
 */
export function ResolveDisputeButton({
  bookingId,
  providerName,
  clientName,
  payoutAmount,
  price,
  transportFee = 0,
  identityReport = false,
}: {
  bookingId: string
  providerName: string
  clientName: string
  payoutAmount: number
  price: number
  transportFee?: number
  /**
   * The dispute came from "this isn't my provider". Nothing has been charged
   * or paid out yet, and the two rulings split the money differently.
   */
  identityReport?: boolean
}) {
  if (identityReport) {
    return (
      <ActionDialog
        action={resolveDispute}
        title="Rule on this identity report"
        description={`${clientName} said the person who arrived was not ${providerName}. If ${clientName} is right, they get all ${formatCurrency(price + transportFee)} back and ${providerName} gets nothing. If ${providerName} did attend, it settles as a late cancellation: ${providerName} gets the transport and the late-cancellation fee, and the rest is refunded. Upholding the client also keeps the report on ${providerName}'s record; two standing reports pause them. Neither ruling can be undone once the money moves.`}
        submitLabel="Apply ruling"
        submitVariant="destructive"
        pendingLabel="Applying…"
        trigger={<Button size="sm">Resolve</Button>}
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <DialogField label="Who was at the door?">
          <select
            name="resolution"
            defaultValue="REFUNDED"
            className={SELECT_CLASSES}
          >
            <option value="REFUNDED" className="bg-background text-foreground">
              Not the provider: refund {clientName} in full
            </option>
            <option value="RELEASED" className="bg-background text-foreground">
              The booked provider: settle as a late cancellation
            </option>
          </select>
        </DialogField>
        <DialogField
          label="Note"
          hint="At least 8 characters. Written to the booking's permanent history."
        >
          <Textarea
            name="note"
            required
            rows={3}
            placeholder="Video call with the provider matched their photo; client confirmed the person had left before they checked."
          />
        </DialogField>
      </ActionDialog>
    )
  }

  return (
    <ActionDialog
      action={resolveDispute}
      title="Resolve this dispute"
      description={`${clientName} reported a problem with this booking. Releasing pays ${providerName} ${formatCurrency(payoutAmount)}; refunding returns ${formatCurrency(price)} to ${clientName} and cancels the payout. Neither can be undone once the money moves.`}
      submitLabel="Apply ruling"
      submitVariant="destructive"
      pendingLabel="Applying…"
      trigger={<Button size="sm">Resolve</Button>}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <DialogField label="Ruling">
        <select
          name="resolution"
          defaultValue="RELEASED"
          className={SELECT_CLASSES}
        >
          <option value="RELEASED" className="bg-background text-foreground">
            Release the payout — pay {providerName}
          </option>
          <option value="REFUNDED" className="bg-background text-foreground">
            Refund the client — return the full price
          </option>
        </select>
      </DialogField>
      <DialogField
        label="Note"
        hint="At least 8 characters. Written to the booking's permanent history."
      >
        <Textarea
          name="note"
          required
          rows={3}
          placeholder="Spoke to both parties; provider re-did the service at no charge."
        />
      </DialogField>
    </ActionDialog>
  )
}

export function DeleteReviewButton({
  reviewId,
  providerName,
}: {
  reviewId: string
  providerName: string
}) {
  return (
    <ActionDialog
      action={deleteReview}
      title="Remove this review?"
      description={`It is deleted permanently and ${providerName}'s rating is recalculated without it.`}
      submitLabel="Remove review"
      submitVariant="destructive"
      pendingLabel="Removing…"
      trigger={
        <Button variant="ghost" size="sm">
          Remove
        </Button>
      }
    >
      <input type="hidden" name="reviewId" value={reviewId} />
      <DialogField
        label="Reason"
        hint="At least 8 characters. Logged with the action."
      >
        <Textarea
          name="reason"
          required
          rows={3}
          placeholder="Abusive language reported by the provider."
        />
      </DialogField>
    </ActionDialog>
  )
}

/**
 * Re-drives a settlement the sweep abandoned.
 *
 * Confirmed rather than a bare button: the retry itself is cheap, but doing
 * it before fixing the cause burns the retry budget again and the row
 * reappears here looking identical, which is how an operator stops trusting
 * the list.
 */
export function RetrySettlementButton({
  bookingId,
  providerName,
  payoutAmount,
  failures,
}: {
  bookingId: string
  providerName: string
  payoutAmount: number
  failures: number
}) {
  return (
    <ActionDialog
      action={retrySettlement}
      title="Retry this settlement"
      description={`This has failed ${failures} times, so automatic retries stopped. Fix the cause first — an empty Paystack balance, a wrong recipient account, or transfer OTP still switched on — then retry to send ${formatCurrency(payoutAmount)} to ${providerName}. Retrying before the cause is fixed just puts it straight back on this list.`}
      submitLabel="Retry now"
      pendingLabel="Sending…"
      trigger={
        <Button size="sm" variant="outline">
          Retry
        </Button>
      }
    >
      <input type="hidden" name="bookingId" value={bookingId} />
    </ActionDialog>
  )
}
