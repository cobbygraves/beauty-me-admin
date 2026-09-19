"use server"

import { refresh } from "next/cache"

import { apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import { requiredField, toErrorState } from "@/lib/actions/helpers"

/**
 * Clears the retry breaker on an abandoned settlement and drives it again.
 *
 * Deliberately manual. The sweep stopped for a reason, and whatever that
 * reason was — an empty Paystack balance, a bad recipient code, transfer OTP
 * still enabled on the account — is still true until someone fixes it.
 * Retrying before then just spends the retry budget again and puts the row
 * straight back on this list.
 */
export async function retrySettlement(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const bookingId = requiredField(formData, "bookingId")
  if (!bookingId) return errorState("Missing booking.")

  try {
    await apiFetch(`/admin/settlements/${bookingId}/retry`, { method: "POST" })
  } catch (error) {
    return toErrorState(error, "Could not retry this settlement.")
  }

  refresh()
  return successState(
    "Retry sent. Paystack takes a moment to confirm — the payout status will update on its own."
  )
}
