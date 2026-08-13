"use server"

import { refresh } from "next/cache"

import { apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import {
  optionalField,
  requiredField,
  toErrorState,
} from "@/lib/actions/helpers"

/**
 * Approves or rejects a provider's identity documents.
 *
 * A rejection must say why: the reason is what the provider is shown, and
 * without it they have nothing to act on before resubmitting.
 */
export async function verifyProvider(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const providerId = requiredField(formData, "providerId")
  const status = requiredField(formData, "status")
  const rejectionReason = optionalField(formData, "rejectionReason")

  if (!providerId) return errorState("Missing provider.")
  if (status !== "APPROVED" && status !== "REJECTED") {
    return errorState("Choose approve or reject.")
  }
  if (status === "REJECTED" && !rejectionReason) {
    return errorState("Say why — the provider is shown this reason.")
  }

  try {
    await apiFetch(`/admin/providers/${providerId}/verify`, {
      method: "PATCH",
      body: { status, rejectionReason },
    })
  } catch (error) {
    return toErrorState(error, "Could not record that decision.")
  }

  refresh()
  return successState(
    status === "APPROVED"
      ? "Provider verified — they can now take bookings."
      : "Verification rejected and the provider notified."
  )
}
