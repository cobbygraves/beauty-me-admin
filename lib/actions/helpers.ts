import "server-only"

import { ApiError } from "@/lib/api"
import { errorState, type ActionState } from "@/lib/action-state"

/**
 * Turns whatever a mutation threw into a state a form can render.
 *
 * The API's validation messages are written for humans and are the most useful
 * thing to show, so an `ApiError` surfaces its own message; anything else is
 * reported generically rather than leaking an internal stack.
 */
export function toErrorState(error: unknown, fallback: string): ActionState {
  if (error instanceof ApiError) return errorState(error.message)
  if (error instanceof Error && error.message) return errorState(error.message)
  return errorState(fallback)
}

/** Reads a required text field, trimmed. */
export function requiredField(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

/** Reads an optional text field, returning undefined when blank. */
export function optionalField(
  formData: FormData,
  name: string
): string | undefined {
  const value = requiredField(formData, name)
  return value ? value : undefined
}
