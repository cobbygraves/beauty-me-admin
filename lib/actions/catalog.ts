"use server"

import { refresh } from "next/cache"

import { apiFetch } from "@/lib/api"
import { errorState, successState, type ActionState } from "@/lib/action-state"
import {
  optionalField,
  requiredField,
  toErrorState,
} from "@/lib/actions/helpers"

export async function createCategory(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = requiredField(formData, "name")
  if (!name) return errorState("Give the category a name.")

  try {
    await apiFetch("/catalog/categories", {
      method: "POST",
      body: {
        name,
        description: optionalField(formData, "description"),
        icon: optionalField(formData, "icon"),
      },
    })
  } catch (error) {
    return toErrorState(error, "Could not create this category.")
  }

  refresh()
  return successState(`“${name}” added to the catalog.`)
}

export async function updateCategory(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = requiredField(formData, "categoryId")
  if (!id) return errorState("Missing category.")

  const isActiveField = optionalField(formData, "isActive")

  const changes = {
    name: optionalField(formData, "name"),
    description: optionalField(formData, "description"),
    icon: optionalField(formData, "icon"),
    isActive: isActiveField === undefined ? undefined : isActiveField === "true",
  }

  const payload = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined)
  )

  if (!Object.keys(payload).length) return errorState("Nothing to save.")

  try {
    await apiFetch(`/catalog/categories/${id}`, {
      method: "PATCH",
      body: payload,
    })
  } catch (error) {
    return toErrorState(error, "Could not save this category.")
  }

  refresh()
  return successState("Category updated.")
}

/**
 * Retires a category. The API soft-deletes it, so providers who already list
 * services under it keep their history — it simply stops being offered.
 */
export async function retireCategory(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = requiredField(formData, "categoryId")
  if (!id) return errorState("Missing category.")

  try {
    await apiFetch(`/catalog/categories/${id}`, { method: "DELETE" })
  } catch (error) {
    return toErrorState(error, "Could not retire this category.")
  }

  refresh()
  return successState("Category retired — it is no longer offered in the app.")
}
