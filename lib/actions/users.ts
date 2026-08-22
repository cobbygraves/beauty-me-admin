"use server"

import { refresh } from "next/cache"

import { apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import {
  optionalField,
  requiredField,
  toErrorState,
} from "@/lib/actions/helpers"
import { parseMobile } from "@/lib/phone"

export async function setUserSuspension(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = requiredField(formData, "userId")
  const suspend = requiredField(formData, "suspend") === "true"
  const reason = optionalField(formData, "reason")

  if (!userId) return errorState("Missing user.")
  if (suspend && !reason) {
    // The reason is forwarded to the account holder, so a suspension is never
    // a silent lockout.
    return errorState("Give a reason — the account holder is told why.")
  }

  try {
    await apiFetch(`/admin/users/${userId}/suspend`, {
      method: "PATCH",
      body: { suspend, reason },
    })
  } catch (error) {
    return toErrorState(error, "Could not update this account.")
  }

  refresh()
  return successState(suspend ? "Account suspended." : "Account reinstated.")
}

export async function updateUser(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = requiredField(formData, "userId")
  if (!userId) return errorState("Missing user.")

  const mobile = optionalField(formData, "mobile")
  const country = optionalField(formData, "country")

  // A number is only sent on if it parses, so an operator sees the problem
  // before the API does.
  let normalizedMobile: string | undefined
  if (mobile) {
    const parsed = parseMobile(mobile, country)
    if (!parsed.ok) return errorState(parsed.reason)
    normalizedMobile = parsed.value.e164
  }

  const payload = {
    username: optionalField(formData, "username"),
    email: optionalField(formData, "email"),
    mobile: normalizedMobile,
    role: optionalField(formData, "role"),
  }

  const changes = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  )

  if (!Object.keys(changes).length) {
    return errorState("Nothing to save.")
  }

  try {
    await apiFetch(`/admin/users/${userId}`, {
      method: "PATCH",
      body: changes,
    })
  } catch (error) {
    return toErrorState(error, "Could not save these details.")
  }

  refresh()
  return successState("Account updated.")
}

export async function createAdmin(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const payload = {
    username: requiredField(formData, "username"),
    email: requiredField(formData, "email"),
    mobile: requiredField(formData, "mobile"),
    pin: requiredField(formData, "pin"),
  }

  if (Object.values(payload).some((value) => !value)) {
    return errorState("Every field is required.")
  }

  if (!/^\d{4,6}$/.test(payload.pin)) {
    return errorState("The PIN must be 4 to 6 digits.")
  }

  // Stored in E.164, so the number the new admin signs in with is the number
  // written here — a local form would create an account they cannot reach.
  const parsedMobile = parseMobile(
    payload.mobile,
    optionalField(formData, "country")
  )
  if (!parsedMobile.ok) return errorState(parsedMobile.reason)

  try {
    await apiFetch("/admin/admins", {
      method: "POST",
      body: { ...payload, mobile: parsedMobile.value.e164 },
    })
  } catch (error) {
    return toErrorState(error, "Could not create this administrator.")
  }

  refresh()
  return successState(`${payload.username} can now sign in to the dashboard.`)
}
