"use client"

import { UserPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ActionDialog, DialogField } from "@/components/action-dialog"
import { CountrySelect } from "@/components/country-select"
import { createAdmin } from "@/lib/actions/users"

export function CreateAdminButton() {
  return (
    <ActionDialog
      action={createAdmin}
      title="Add an administrator"
      description="They sign in to this console with the mobile number and PIN you set here. Share the PIN with them directly and ask them to change it."
      submitLabel="Create administrator"
      pendingLabel="Creating…"
      trigger={
        <Button>
          <UserPlusIcon />
          Add administrator
        </Button>
      }
    >
      <DialogField label="Name">
        <Input name="username" required placeholder="Ama Mensah" />
      </DialogField>
      <DialogField label="Email">
        <Input
          name="email"
          type="email"
          required
          placeholder="ama@beautys.com"
        />
      </DialogField>
      <DialogField label="Mobile number" hint="What they sign in with.">
        <div className="flex gap-2">
          <CountrySelect />
          <Input name="mobile" required placeholder="0244000000" />
        </div>
      </DialogField>
      <DialogField label="PIN" hint="4 to 6 digits.">
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          required
          placeholder="••••"
        />
      </DialogField>
    </ActionDialog>
  )
}
