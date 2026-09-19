import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { getQueueCounts } from "@/lib/admin-api"
import { requireAdmin } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Gate first, then fetch: an expired session should redirect rather than
  // fire off queue queries with a dead token.
  const user = await requireAdmin()
  const queue = await getQueueCounts()

  return (
    <SidebarProvider>
      <AppSidebar user={user} badges={queue} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <p className="text-sm text-muted-foreground">
            {queue.activeBookings === 0
              ? "No bookings in flight"
              : `${queue.activeBookings} booking${
                  queue.activeBookings === 1 ? "" : "s"
                } in flight`}
          </p>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
