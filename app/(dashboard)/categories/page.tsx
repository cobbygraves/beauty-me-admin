import Link from "next/link"
import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
import { ToneBadge } from "@/components/status-badge"
import {
  CreateCategoryButton,
  EditCategoryButton,
  ToggleCategoryButton,
} from "@/components/catalog-actions"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listCategories } from "@/lib/admin-api"
import { formatNumber } from "@/lib/format"

export const metadata: Metadata = { title: "Service catalog" }

export default async function CategoriesPage() {
  const categories = await listCategories()

  const active = categories.filter((category) => category.isActive)
  const unused = active.filter((category) => category.providerCount === 0)

  return (
    <>
      <PageHeader
        title="Service catalog"
        description="The categories clients browse by. Providers file each service they publish under one of these."
        actions={<CreateCategoryButton />}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          emphasis
          label="Live categories"
          value={formatNumber(active.length)}
          hint="Selectable in the app"
        />
        <StatTile
          label="Retired"
          value={formatNumber(categories.length - active.length)}
          hint="Hidden but recoverable"
        />
        <StatTile
          label="With no providers"
          value={formatNumber(unused.length)}
          hint="Live but nobody offers them"
        />
      </section>

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Providers</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="p-10 text-center text-muted-foreground"
                  >
                    No categories yet. Create the first one to let providers
                    publish services.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="max-w-md text-muted-foreground">
                      <span className="block truncate">
                        {category.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {category.providerCount ? (
                        <Link
                          href={`/providers?categoryId=${category._id}`}
                          className="hover:underline"
                        >
                          {formatNumber(category.providerCount)}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ToneBadge
                        tone={category.isActive ? "success" : "muted"}
                        label={category.isActive ? "Live" : "Retired"}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center justify-end gap-1">
                        <EditCategoryButton category={category} />
                        <ToggleCategoryButton category={category} />
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
