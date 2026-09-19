"use server"

import { refresh } from "next/cache"

import { apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import { requiredField, toErrorState } from "@/lib/actions/helpers"

const AUDIENCES = ["ALL", "CLIENTS", "PROVIDERS"] as const

interface BroadcastResult {
  recipients: number
  pushed: number
  smsSent: number
}

/**
 * Fans a message out to a segment as an in-app notification and a push, with
 * SMS as an explicit opt-in — SMS costs money per recipient, so it is never
 * the default for a whole-userbase send.
 */
export async function sendBroadcast(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const audience = requiredField(formData, "audience")
  const title = requiredField(formData, "title")
  const body = requiredField(formData, "body")
  const alsoSms = formData.get("alsoSms") === "on"

  if (!AUDIENCES.includes(audience as (typeof AUDIENCES)[number])) {
    return errorState("Choose who should receive this.")
  }
  if (!title || !body) {
    return errorState("A broadcast needs both a title and a message.")
  }
  if (title.length > 80) {
    return errorState("Keep the title to 80 characters or fewer.")
  }
  if (body.length > 500) {
    return errorState("Keep the message to 500 characters or fewer.")
  }

  let result: BroadcastResult
  try {
    result = await apiFetch<BroadcastResult>("/admin/broadcasts", {
      method: "POST",
      body: { audience, title, body, alsoSms },
    })
  } catch (error) {
    return toErrorState(error, "Could not send this broadcast.")
  }

  refresh()
  return successState(
    `Sent to ${result.recipients} ${
      result.recipients === 1 ? "person" : "people"
    } · ${result.pushed} push${result.smsSent ? ` · ${result.smsSent} SMS` : ""}.`
  )
}
