import type { Metadata } from "next"
import { ShieldCheckIcon } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { CreateAdminButton } from "@/components/create-admin-button"
import { SuspendUserButton } from "@/components/admin-actions"
import { ToneBadge } from "@/components/status-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listAdmins } from "@/lib/admin-api"
import { requireAdmin } from "@/lib/auth"
import { formatDate, initialsOf } from "@/lib/format"
import { formatMobile } from "@/lib/phone"

export const metadata: Metadata = { title: "Admin team" }

export default async function TeamPage() {
  const [admins, currentUser] = await Promise.all([
    listAdmins(),
    requireAdmin(),
  ])

  return (
    <>
      <PageHeader
        title="Admin team"
        description="Everyone who can sign in to this console. Administrators can vet providers, override bookings and message the whole user base."
        actions={<CreateAdminButton />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
          <CardDescription>
            Suspending an administrator signs them out and blocks them from
            signing back in.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrator</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const isSelf = admin._id === currentUser._id
                return (
                  <TableRow key={admin._id}>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {initialsOf(admin.username)}
                        </span>
                        <span className="font-medium">{admin.username}</span>
                        {isSelf ? (
                          <ToneBadge tone="active" label="You" />
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex flex-col">
                        <span>{formatMobile(admin.mobile)}</span>
                        <span className="text-xs">{admin.email}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.createdAt ? formatDate(admin.createdAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <ToneBadge
                        tone={admin.isSuspended ? "danger" : "success"}
                        label={admin.isSuspended ? "Suspended" : "Active"}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-end">
                        {isSelf ? (
                          // Locking yourself out of the console you are
                          // standing in is never the intent.
                          <span className="text-xs text-muted-foreground">
                            Can&rsquo;t suspend yourself
                          </span>
                        ) : (
                          <SuspendUserButton
                            userId={admin._id}
                            username={admin.username}
                            isSuspended={Boolean(admin.isSuspended)}
                          />
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Every administrator has the same permissions. Booking overrides and
        review removals are stamped with the name of whoever made them, so the
        audit trail is the accountability mechanism.
      </p>
    </>
  )
}
