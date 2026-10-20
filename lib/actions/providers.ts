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
        ? "Certified — they are live with the strongest badge."
        : "Verified — they are live on the marketplace."
      : "Verification rejected, the provider delisted and notified."
  )
}

/**
 * Lifts the hold a client's "this isn't my provider" report placed on a
 * provider, putting them back on the marketplace.
 *
 * The note is required: it is the only record of why someone a client did not
 * recognise was judged safe to send to other clients' homes.
 */
export async function clearIdentityHold(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const providerId = requiredField(formData, "providerId")
  const note = optionalField(formData, "note")

  if (!providerId) return errorState("Missing provider.")
  if (!note) {
    return errorState("Record what you checked before clearing them.")
  }

  try {
    await apiFetch(`/admin/providers/${providerId}/identity-hold/clear`, {
      method: "PATCH",
      body: { note },
    })
  } catch (error) {
    return toErrorState(error, "Could not clear the hold.")
  }

  refresh()
  return successState("Hold cleared — they are back on the marketplace.")
}

/** Turns down the provider's face photo on its own; nothing else changes. */
export async function rejectProviderPhoto(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const providerId = requiredField(formData, "providerId")
  const reason = optionalField(formData, "reason")

  if (!providerId) return errorState("Missing provider.")
  if (!reason) {
    return errorState("Say why — the provider is shown this reason.")
  }

  try {
    await apiFetch(`/admin/providers/${providerId}/reject-photo`, {
      method: "PATCH",
      body: { reason },
    })
  } catch (error) {
    return toErrorState(error, "Could not reject the photo.")
  }

  refresh()
  return successState("Photo rejected — they have been asked for a new one.")
}
