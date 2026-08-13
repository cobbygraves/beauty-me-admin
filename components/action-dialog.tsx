"use client"

import * as React from "react"
import { useActionState } from "react"
import { AlertCircleIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { IDLE_STATE, type ActionState } from "@/lib/action-state"

/**
 * A dialog wrapping one Server Action.
 *
 * Every operator action in this console goes through the same shape — explain
 * the consequence, take a reason where one is required, submit, then either
 * close on success or keep the dialog open with the API's own error message
 * still on screen. Doing that once here is what keeps a destructive action
 * from being one careless copy-paste away from losing its confirmation step.
 */
export function ActionDialog({
  trigger,
  title,
  description,
  submitLabel,
  submitVariant = "default",
  pendingLabel = "Working…",
  children,
  onSuccess,
  action,
}: {
  trigger: React.ReactNode
  title: string
  description?: React.ReactNode
  submitLabel: string
  submitVariant?: React.ComponentProps<typeof Button>["variant"]
  pendingLabel?: string
  /** Form fields — including any hidden ids the action needs. */
  children?: React.ReactNode
  onSuccess?: () => void
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
}) {
  const [open, setOpen] = React.useState(false)
  const [state, formAction, isPending] = useActionState(action, IDLE_STATE)
  const lastHandled = React.useRef<ActionState>(IDLE_STATE)

  React.useEffect(() => {
    if (state === lastHandled.current || state.status !== "success") return
    lastHandled.current = state

    toast.success(state.message ?? "Done.")
    setOpen(false)
    onSuccess?.()
  }, [state, onSuccess])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // A dismissed dialog shouldn't reopen still showing the last failure.
        if (!next) lastHandled.current = IDLE_STATE
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>

          {children ? (
            <div className="flex flex-col gap-4">{children}</div>
          ) : null}

          {state.status === "error" ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              {state.message}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              }
            />
            <Button type="submit" variant={submitVariant} disabled={isPending}>
              {isPending ? <Spinner /> : null}
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** A labelled field for use inside an `ActionDialog`. */
export function DialogField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}
