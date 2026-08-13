import Image from "next/image"
import type { Metadata } from "next"

import { LoginForm } from "@/app/login/login-form"

export const metadata: Metadata = {
  title: "Sign in",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            src="/brand-icon.png"
            alt=""
            width={56}
            height={56}
            className="size-14 rounded-2xl"
            priority
          />
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              BeautyHub Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in with the mobile number and PIN on your administrator
              account.
            </p>
          </div>
        </div>

        <LoginForm
          initialError={
            error === "forbidden"
              ? "That account is not an administrator."
              : undefined
          }
        />

        <p className="text-center text-xs text-muted-foreground">
          Clients and providers use the BeautyHub mobile app — this console is
          for platform operators.
        </p>
      </div>
    </main>
  )
}
