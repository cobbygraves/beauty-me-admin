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
  // Absent on an ID-only submission, where the API awards the only tier the
  // documents can support.
  const approvedTier = optionalField(formData, "approvedTier")

  if (!providerId) return errorState("Missing provider.")
  if (status !== "APPROVED" && status !== "REJECTED") {
    return errorState("Choose approve or reject.")
  }
  if (status === "REJECTED" && !rejectionReason) {
    return errorState("Say why — the provider is shown this reason.")
  }
  if (approvedTier && approvedTier !== "ID" && approvedTier !== "BUSINESS") {
    return errorState("Choose which badge to award.")
  }

  try {
    await apiFetch(`/admin/providers/${providerId}/verify`, {
      method: "PATCH",
      body: { status, rejectionReason, approvedTier },
    })
  } catch (error) {
    return toErrorState(error, "Could not record that decision.")
  }

  refresh()
  return successState(
    status === "APPROVED"
      ? approvedTier === "BUSINESS"
        ? "Business verified — they are live with the strongest badge."
        : "ID verified — they are live on the marketplace."
      : "Verification rejected, the provider delisted and notified."
  )
}
