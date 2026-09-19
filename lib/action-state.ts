/**
 * The shape every Server Action in this app resolves to.
 *
 * Deliberately free of server-only imports: client components read this type
 * and the idle constant through `useActionState`.
 */
export interface ActionState {
  status: "idle" | "success" | "error"
  message?: string
}

export const IDLE_STATE: ActionState = { status: "idle" }

export function successState(message: string): ActionState {
  return { status: "success", message }
}

export function errorState(message: string): ActionState {
  return { status: "error", message }
}
