"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { AlertCircleIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { sendBroadcast } from "@/lib/actions/broadcasts"
import { IDLE_STATE } from "@/lib/action-state"
import { formatNumber } from "@/lib/format"

const AUDIENCES = [
  { value: "ALL", label: "Everyone", key: "all" },
  { value: "CLIENTS", label: "Clients only", key: "clients" },
  { value: "PROVIDERS", label: "Providers only", key: "providers" },
] as const

export function BroadcastComposer({
  audienceSizes,
}: {
  audienceSizes: { all: number; clients: number; providers: number }
}) {
  const [state, formAction, isPending] = useActionState(
    sendBroadcast,
    IDLE_STATE
  )
  const [audience, setAudience] = useState<string>("ALL")
  const [alsoSms, setAlsoSms] = useState(false)

  const selected = AUDIENCES.find((entry) => entry.value === audience)
  const reach = selected ? audienceSizes[selected.key] : 0

  const formRef = useRef<HTMLFormElement>(null)
  const lastHandled = useRef(state)

  useEffect(() => {
    if (state === lastHandled.current || state.status !== "success") return
    lastHandled.current = state

    toast.success(state.message ?? "Broadcast sent.")
    // A sent broadcast is not a draft to keep editing — clearing the form is
    // what stops the same message going out twice.
    formRef.current?.reset()
    setAlsoSms(false)
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Audience</legend>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((entry) => (
            <label
              key={entry.value}
              className={
                audience === entry.value
                  ? "flex cursor-pointer items-center gap-2 rounded-4xl border border-primary bg-primary/10 px-3.5 py-2 text-sm font-medium text-primary"
                  : "flex cursor-pointer items-center gap-2 rounded-4xl border border-border bg-input/30 px-3.5 py-2 text-sm transition-colors hover:bg-input/50"
              }
            >
              <input
                type="radio"
                name="audience"
                value={entry.value}
                checked={audience === entry.value}
                onChange={(event) => setAudience(event.target.value)}
                className="sr-only"
              />
              {entry.label}
              <span className="text-xs opacity-70 tabular-nums">
                {formatNumber(audienceSizes[entry.key])}
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Suspended accounts are always excluded.
        </p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="broadcast-title">Title</Label>
        <Input
          id="broadcast-title"
          name="title"
          required
          maxLength={80}
          placeholder="Weekend availability bonus"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="broadcast-body">Message</Label>
        <Textarea
          id="broadcast-body"
          name="body"
          required
          maxLength={500}
          rows={4}
          placeholder="Go online this Saturday and keep an extra 5% on every completed job."
        />
        <p className="text-xs text-muted-foreground">
          Delivered as an in-app notification and a push to anyone with the app
          installed.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-muted/50 p-3 text-sm">
        <input
          type="checkbox"
          name="alsoSms"
          checked={alsoSms}
          onChange={(event) => setAlsoSms(event.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">Also send as SMS</span>
          <span className="text-xs text-muted-foreground">
            Charged per recipient. Sending to {formatNumber(reach)} people would
            bill {formatNumber(reach)} messages — leave this off unless the
            message is urgent.
          </span>
        </span>
      </label>

      {state.status === "error" ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? <Spinner /> : <SendIcon />}
        {isPending
          ? "Sending…"
          : `Send to ${formatNumber(reach)} ${reach === 1 ? "person" : "people"}`}
      </Button>
    </form>
  )
}
