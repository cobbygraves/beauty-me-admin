import { NextResponse, type NextRequest } from "next/server"

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/session"

const LOGIN_PATH = "/login"

/**
 * Optimistic session gate.
 *
 * Two jobs, both cheap: bounce a request with no session straight to the sign-in
 * page instead of rendering a dashboard that will only 401, and mint a new
 * access token when the old one has aged out but the refresh token is still
 * good. The refresh happens here because a Server Component cannot write a
 * cookie — and at once a day per operator, it is not the "slow data fetching in
 * Proxy" that the framework warns against.
 *
 * This is a first pass, not the authorisation boundary. Every route still calls
 * `requireAdmin()`, and the API re-checks the role on every request — a forged
 * cookie gets someone as far as a redirect and no further.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value

  if (pathname === LOGIN_PATH) {
    // Someone already signed in has no reason to see the form again.
    if (accessToken) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (accessToken) return NextResponse.next()

  if (refreshToken) {
    const renewed = await mintAccessToken(refreshToken)
    if (renewed) {
      const response = NextResponse.next()
      response.cookies.set(ACCESS_TOKEN_COOKIE, renewed, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      })
      return response
    }
  }

  const signIn = new URL(LOGIN_PATH, request.url)
  if (pathname !== "/") {
    // Remember where they were headed so the sign-in can hand them back.
    signIn.searchParams.set("next", `${pathname}${search}`)
  }

  const response = NextResponse.redirect(signIn)
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
  return response
}

async function mintAccessToken(refreshToken: string): Promise<string | null> {
  const baseUrl = (process.env.API_URL ?? "http://localhost:5000").replace(
    /\/$/,
    ""
  )

  try {
    const response = await fetch(`${baseUrl}/auth/refresh-token`, {
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: "no-store",
    })
    if (!response.ok) return null

    const body = (await response.json()) as { accessToken?: string }
    return body.accessToken ?? null
  } catch {
    return null
  }
}

export const config = {
  // Everything except Next's own assets and the public brand images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
