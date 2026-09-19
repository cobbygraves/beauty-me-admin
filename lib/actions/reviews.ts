"use server"

import { refresh } from "next/cache"

import { apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import { requiredField, toErrorState } from "@/lib/actions/helpers"

/**
 * Takes a review down. The API unwinds its contribution to the provider's
 * rating in the same atomic update, so moderating an abusive one-star review
 * doesn't leave the provider's average permanently dented.
 */
export async function deleteReview(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const reviewId = requiredField(formData, "reviewId")
  const reason = requiredField(formData, "reason")

  if (!reviewId) return errorState("Missing review.")
  if (reason.length < 8) {
    return errorState("Give a reason of at least 8 characters — it is logged.")
  }

  try {
    await apiFetch(`/admin/reviews/${reviewId}`, {
      method: "DELETE",
      body: { reason },
    })
  } catch (error) {
    return toErrorState(error, "Could not remove this review.")
  }

  refresh()
  return successState("Review removed and the provider's rating recalculated.")
}
