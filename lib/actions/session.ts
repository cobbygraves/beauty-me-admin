"use server"

import { redirect } from "next/navigation"

import { API_BASE_URL, apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import {
  clearSessionCookies,
  getAccessToken,
  setSessionCookies,
} from "@/lib/session"
import type { AuthResponse } from "@/lib/types"
import { requiredField, toErrorState } from "@/lib/actions/helpers"

/**
 * Signs an operator in against the BeautyHub API and stores the resulting
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

  let session: AuthResponse
  try {
    session = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: { mobile, pin },
    })
  } catch (error) {
    return toErrorState(error, "Could not sign you in. Please try again.")
  }

  if (session.role !== "ADMIN") {
    return errorState(
      "That account is not an administrator. The BeautyHub apps are where clients and providers sign in."
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
