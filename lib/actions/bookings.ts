"use server"

import { refresh } from "next/cache"

import { apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import { BOOKING_STATUSES, STATUS_META } from "@/lib/booking"
import type { BookingStatus } from "@/lib/types"
import { requiredField, toErrorState } from "@/lib/actions/helpers"

/**
 * Forces a booking into a new state, bypassing the state machine.
 *
 * This is the escape hatch for deadlocked disputes and providers who ghost
 * mid-job. It stamps the change with `actorType: ADMIN` and the mandatory
 * reason, which is what makes the status history usable as an audit trail —
 * so the reason is enforced here as well as on the API.
 */
export async function overrideBooking(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const bookingId = requiredField(formData, "bookingId")
  const status = requiredField(formData, "status") as BookingStatus
  const reason = requiredField(formData, "reason")

  if (!bookingId) return errorState("Missing booking.")
  if (!BOOKING_STATUSES.includes(status)) {
    return errorState("Choose a status to move this booking to.")
  }
  if (reason.length < 8) {
    return errorState(
      "Give a reason of at least 8 characters — it is written to the audit trail."
    )
  }

  try {
    await apiFetch(`/admin/bookings/${bookingId}/override`, {
      method: "PATCH",
      body: { status, reason },
    })
  } catch (error) {
    return toErrorState(error, "Could not override this booking.")
  }

  refresh()
  return successState(`Booking moved to ${STATUS_META[status].label}.`)
}
