import "server-only"

import { cookies } from "next/headers"

/**
 * The dashboard keeps its own session cookies rather than forwarding the API's.
 *
 * Every call to the BeautyHub API is made server-side from this app, so the
 * browser never holds an API credential: it holds these two httpOnly cookies,
 * and the Next server is the only thing that ever sends a bearer token. That
 * also sidesteps cross-origin cookie rules once the API and the dashboard sit
 * on different hosts.
 */
export const ACCESS_TOKEN_COOKIE = "bh_admin_access"
export const REFRESH_TOKEN_COOKIE = "bh_admin_refresh"

/** Matches the API's own access-token lifetime (`signAccessToken`, 1d). */
export const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60

/** Matches the API's refresh-token lifetime (`signRefreshToken`, 7d). */
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}

/**
 * Only callable from a Server Action, Route Handler or Proxy — Server
 * Components render after headers are sent and cannot set cookies.
 */
export async function setSessionCookies(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const store = await cookies()
  store.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    cookieOptions(ACCESS_TOKEN_MAX_AGE)
  )
  if (refreshToken) {
    store.set(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      cookieOptions(REFRESH_TOKEN_MAX_AGE)
    )
  }
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies()
  store.delete(ACCESS_TOKEN_COOKIE)
  store.delete(REFRESH_TOKEN_COOKIE)
}
