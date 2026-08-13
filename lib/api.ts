import "server-only"

import { getAccessToken } from "@/lib/session"

/**
 * Base URL of the BeautyHub NestJS API. Server-only, so it is deliberately not
 * `NEXT_PUBLIC_` — the browser never talks to the API directly.
 */
export const API_BASE_URL = (
  process.env.API_URL ?? "http://localhost:5000"
).replace(/\/$/, "")

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * The access token was missing, expired, or rejected. Thrown rather than
 * returned so a page never renders half a dashboard against a dead session.
 */
export class SessionExpiredError extends ApiError {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message, 401)
    this.name = "SessionExpiredError"
  }
}

/** Pulls a readable message out of the API's `{ error: { message } }` shape. */
function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback

  const shaped = body as {
    error?: { message?: string | string[] }
    message?: string | string[]
  }
  const message = shaped.error?.message ?? shaped.message
  if (Array.isArray(message)) return message.join(", ")
  return message ?? fallback
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Serialised as JSON. Use `rawBody` to send something else. */
  body?: unknown
  /** Skips attaching the session bearer token (used by the login call). */
  anonymous?: boolean
  /** Query parameters; `undefined` and `""` entries are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(
  path: string,
  query?: ApiFetchOptions["query"]
): string {
  const url = new URL(
    path.startsWith("/") ? path : `/${path}`,
    `${API_BASE_URL}/`
  )

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue
    url.searchParams.set(key, String(value))
  }

  return url.toString()
}

/**
 * Calls the BeautyHub API with the signed-in admin's bearer token.
 *
 * Admin data is never cached: an operator acting on a suspension or a payout
 * has to see the result of their own action, not a revalidated snapshot.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, anonymous, query, headers, ...init } = options

  const requestHeaders = new Headers(headers)
  requestHeaders.set("Content-Type", "application/json")

  if (!anonymous) {
    const token = await getAccessToken()
    if (!token) throw new SessionExpiredError()
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      ...init,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    throw new ApiError(
      `Could not reach the BeautyHub API at ${API_BASE_URL}. Check that the server is running and that API_URL points to it.`,
      503
    )
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const parsed: unknown = text ? safeJson(text) : null

  if (!response.ok) {
    if (response.status === 401) {
      throw new SessionExpiredError(
        messageFromBody(parsed, "Your session has expired.")
      )
    }
    throw new ApiError(
      messageFromBody(parsed, `Request failed with status ${response.status}`),
      response.status
    )
  }

  return parsed as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Mints a fresh access token from the refresh token, without touching cookies —
 * the caller decides where to persist it, since only a Proxy, Route Handler or
 * Server Action is allowed to write one.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
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
