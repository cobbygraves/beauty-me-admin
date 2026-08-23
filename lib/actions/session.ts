"use server"

import { redirect } from "next/navigation"

import { API_BASE_URL, apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import {
  clearSessionCookies,
  getAccessToken,
  setSessionCookies,
} from "@/lib/session"
import type { AuthResponse, LoginResponse } from "@/lib/types"
import { requiredField, toErrorState } from "@/lib/actions/helpers"
import { DEFAULT_COUNTRY_ISO, parseMobile } from "@/lib/phone"

/**
 * Signs an operator in against the Beautys API and stores the resulting
 * tokens in this app's own httpOnly cookies.
 *
 * The role check happens here rather than at the route: a client or provider
 * has valid credentials but no business holding a dashboard session at all, so
 * no cookie is written for them.
 */
export async function signIn(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const mobile = requiredField(formData, "mobile")
  const pin = requiredField(formData, "pin")

  if (!mobile || !pin) {
    return errorState("Enter your mobile number and PIN.")
  }

  // Normalised here so a typo is caught before a round trip, and so the API
  // receives the same E.164 number the account is stored under. The API
  // normalises again — this is a convenience, not the enforcement point.
  //
  // The form carries no country: administrators are Ghanaian, so the number is
  // always read as local to Ghana. A number typed with its own `+` country code
  // still parses as international, which keeps `+233...` working verbatim.
  const parsed = parseMobile(mobile, DEFAULT_COUNTRY_ISO)
  if (!parsed.ok) {
    return errorState(parsed.reason)
  }

  let response: LoginResponse
  try {
    response = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: { mobile: parsed.value.e164, pin },
    })
  } catch (error) {
    return toErrorState(error, "Could not sign you in. Please try again.")
  }

  // Only clients and providers get the SMS step, and the API withholds the
  // tokens until they pass it. Reaching this branch means the credentials were
  // valid but belong to a non-admin, so it is the same refusal as below --
  // spelled out rather than left to fall through a missing `role`.
  if ("otpRequired" in response) {
    return errorState(
      "That account is not an administrator. The Beautys apps are where clients and providers sign in."
    )
  }

  const session: AuthResponse = response

  if (session.role !== "ADMIN") {
    return errorState(
      "That account is not an administrator. The Beautys apps are where clients and providers sign in."
    )
  }

  await setSessionCookies(session.accessToken, session.refreshToken)
  redirect("/")
}

/**
 * Clears the dashboard session and blacklists the access token on the API, so
 * signing out is not merely a local cookie delete.
 */
export async function signOut(): Promise<void> {
  const token = await getAccessToken()

  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
    } catch {
      // A server that can't be reached shouldn't trap someone in a session
      // they've asked to end — the local cookies are cleared either way.
    }
  }

  await clearSessionCookies()
  redirect("/login")
}

/** Used by the session-expiry banner to confirm the token still works. */
export async function pingSession(): Promise<ActionState> {
  try {
    await apiFetch("/auth/me")
    return successState("Session is active.")
  } catch (error) {
    return toErrorState(error, "Session check failed.")
  }
}
