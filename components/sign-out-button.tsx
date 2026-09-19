"use client"

import { useTransition } from "react"
import { LogOutIcon } from "lucide-react"

import { SidebarMenuButton } from "@/components/ui/sidebar"
import { signOut } from "@/lib/actions/session"

export function SignOutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <SidebarMenuButton
      tooltip="Sign out"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
    >
      <LogOutIcon />
      <span>{isPending ? "Signing out…" : "Sign out"}</span>
    </SidebarMenuButton>
  )
}
