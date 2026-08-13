"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ActionDialog, DialogField } from "@/components/action-dialog"
import {
  createCategory,
  retireCategory,
  updateCategory,
} from "@/lib/actions/catalog"
import type { AdminCategory } from "@/lib/types"

export function CreateCategoryButton() {
  return (
    <ActionDialog
      action={createCategory}
      title="New service category"
      description="Categories are what clients browse by, and what providers file each service under."
      submitLabel="Create category"
      pendingLabel="Creating…"
      trigger={
        <Button>
          <PlusIcon />
          New category
        </Button>
      }
    >
      <DialogField label="Name">
        <Input name="name" required placeholder="Braiding" />
      </DialogField>
      <DialogField label="Description" hint="Optional, shown in the app.">
        <Textarea
          name="description"
          rows={2}
          placeholder="Knotless braids, cornrows and protective styles."
        />
      </DialogField>
      <DialogField label="Icon URL" hint="Optional image shown on the category tile.">
        <Input name="icon" placeholder="https://…" />
      </DialogField>
    </ActionDialog>
  )
}

export function EditCategoryButton({ category }: { category: AdminCategory }) {
  return (
    <ActionDialog
      action={updateCategory}
      title={`Edit ${category.name}`}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      trigger={
        <Button variant="outline" size="sm">
          Edit
        </Button>
      }
    >
      <input type="hidden" name="categoryId" value={category._id} />
      <DialogField label="Name">
        <Input name="name" defaultValue={category.name} required />
      </DialogField>
      <DialogField label="Description">
        <Textarea
          name="description"
          rows={2}
          defaultValue={category.description ?? ""}
        />
      </DialogField>
      <DialogField label="Icon URL">
        <Input name="icon" defaultValue={category.icon ?? ""} />
      </DialogField>
    </ActionDialog>
  )
}

export function ToggleCategoryButton({
  category,
}: {
  category: AdminCategory
}) {
  if (category.isActive) {
    return (
      <ActionDialog
        action={retireCategory}
        title={`Retire ${category.name}?`}
        description={
          category.providerCount
            ? `${category.providerCount} provider${
                category.providerCount === 1 ? "" : "s"
              } list services under this category. Retiring it hides the category from the app; their existing services and bookings are untouched.`
            : "It disappears from the app. Nothing is deleted, so you can bring it back at any time."
        }
        submitLabel="Retire category"
        submitVariant="destructive"
        pendingLabel="Retiring…"
        trigger={
          <Button variant="ghost" size="sm">
            Retire
          </Button>
        }
      >
        <input type="hidden" name="categoryId" value={category._id} />
      </ActionDialog>
    )
  }

  return (
    <ActionDialog
      action={updateCategory}
      title={`Bring back ${category.name}?`}
      description="It becomes selectable in the app again straight away."
      submitLabel="Reinstate category"
      pendingLabel="Reinstating…"
      trigger={
        <Button variant="outline" size="sm">
          Reinstate
        </Button>
      }
    >
      <input type="hidden" name="categoryId" value={category._id} />
      <input type="hidden" name="isActive" value="true" />
    </ActionDialog>
  )
}
