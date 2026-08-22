"use client"

import { useActionState } from "react"
import { AlertCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CountrySelect } from "@/components/country-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { signIn } from "@/lib/actions/session"
import { IDLE_STATE } from "@/lib/action-state"

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(
    signIn,
    initialError
      ? { status: "error" as const, message: initialError }
      : IDLE_STATE
  )

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="mobile">Mobile number</Label>
        <div className="flex gap-2">
          <CountrySelect />
          <Input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            placeholder="0244000000"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pin">PIN</Label>
        <Input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="••••"
          required
        />
      </div>

      {state.status === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? <Spinner /> : null}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  )
}
