"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ActionDialog, DialogField } from "@/components/action-dialog"
import { CountrySelect } from "@/components/country-select"
import { countryOfE164, DEFAULT_COUNTRY_ISO, toLocalFormat } from "@/lib/phone"
import { setUserSuspension, updateUser } from "@/lib/actions/users"
import { verifyProvider } from "@/lib/actions/providers"
import { overrideBooking } from "@/lib/actions/bookings"
import { deleteReview } from "@/lib/actions/reviews"
import { BOOKING_STATUSES, STATUS_META, ROLE_LABELS } from "@/lib/booking"
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
            <option key={value} value={value}>
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
}: {
  providerId: string
  businessName: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionDialog
        action={verifyProvider}
        title={`Approve ${businessName}?`}
        description="They can start taking bookings immediately and are notified in the app."
        submitLabel="Approve provider"
        pendingLabel="Approving…"
        trigger={<Button>Approve</Button>}
      >
        <input type="hidden" name="providerId" value={providerId} />
        <input type="hidden" name="status" value="APPROVED" />
      </ActionDialog>

      <ActionDialog
        action={verifyProvider}
        title={`Reject ${businessName}'s documents?`}
        description="They stay unverified and are asked to resubmit. Your reason is what they see."
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
            <option key={status} value={status}>
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
