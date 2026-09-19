import "server-only"

import { redirect } from "next/navigation"

import { apiFetch, SessionExpiredError } from "@/lib/api"
import type { User } from "@/lib/types"

/**
 * The signed-in operator, read from the API rather than decoded from the token.
 *
 * The access token is a snapshot taken at sign-in, so a role change or a
 * suspension applied afterwards is only visible through this call.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiFetch<User>("/auth/me")
  } catch (error) {
    if (error instanceof SessionExpiredError) return null
    throw error
  }
}

/**
 * Gate for every dashboard route. A non-admin with a valid session is bounced
 * rather than shown an empty console — the mobile apps are where clients and
 * providers belong.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) redirect("/login")
  if (user.role !== "ADMIN") redirect("/login?error=forbidden")

  return user
}
