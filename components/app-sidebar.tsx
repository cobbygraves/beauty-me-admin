"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheckIcon,
  BellRingIcon,
  CalendarCheckIcon,
  ChartNoAxesCombinedIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  ScissorsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SignOutButton } from "@/components/sign-out-button"
import { initialsOf } from "@/lib/format"
import type { User } from "@/lib/types"

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboardIcon
  /** Count of work waiting on an operator, shown as a badge. */
  badgeKey?: "pendingVerifications" | "paymentsNeedingAttention"
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombinedIcon },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/clients", label: "Clients", icon: UsersIcon },
      { href: "/providers", label: "Providers", icon: SparklesIcon },
      {
        href: "/verification",
        label: "Verification",
        icon: BadgeCheckIcon,
        badgeKey: "pendingVerifications",
      },
      { href: "/bookings", label: "Bookings", icon: CalendarCheckIcon },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/transactions",
        label: "Payments",
        icon: CreditCardIcon,
        badgeKey: "paymentsNeedingAttention",
      },
      { href: "/reviews", label: "Reviews", icon: StarIcon },
      { href: "/categories", label: "Service catalog", icon: ScissorsIcon },
      { href: "/broadcasts", label: "Broadcasts", icon: BellRingIcon },
      { href: "/team", label: "Admin team", icon: ShieldCheckIcon },
    ],
  },
]

export function AppSidebar({
  user,
  badges,
}: {
  user: User
  badges: { pendingVerifications: number; paymentsNeedingAttention: number }
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-sidebar-accent"
        >
          {/* The launcher icon from the mobile app. It is full-bleed magenta and
              carries its own background, so it needs no light/dark swap. */}
          <Image
            src="/brand-icon.png"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-lg"
            priority
          />
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate font-heading text-sm font-semibold tracking-tight">
              Beautys
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Admin console
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href)
                  const badge = item.badgeKey ? badges[item.badgeKey] : 0

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        }
                      />
                      {badge ? (
                        <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initialsOf(user.username)}
          </span>
          <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user.username}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
        </div>
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
