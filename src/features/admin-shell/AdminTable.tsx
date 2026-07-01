import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table as UiTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type AdminTableProps<TData> = {
  columns: Array<ColumnDef<TData>>
  data: TData[]
  emptyLabel?: string
  isLoading?: boolean
}

export function AdminTable<TData>({ columns, data, emptyLabel = "No records", isLoading = false }: AdminTableProps<TData>) {
  "use no memo"
  const { t } = useTranslation()

  // Keep TanStack Table outside React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <UiTable className="min-w-[760px]">
          <TableHeader className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="px-3 py-2 font-semibold" key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell className="px-3 py-8 text-center text-muted-foreground" colSpan={columns.length}>
                  {t("admin.table.loading")}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="hover:bg-muted/40" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="px-3 py-2 align-middle" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="px-3 py-8 text-center text-muted-foreground" colSpan={columns.length}>
                  {emptyLabel === "No records" ? t("admin.table.empty") : emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </UiTable>
      </div>
    </div>
  )
}

type AdminPaginationProps = {
  onPageChange: (page: number) => void
  page: number
  total: number
  totalPages: number
}

export function AdminPagination({ onPageChange, page, total, totalPages }: AdminPaginationProps) {
  const { t } = useTranslation()
  const safeTotalPages = Math.max(totalPages, 1)
  const visiblePages = getVisiblePages(page, safeTotalPages)

  return (
    <div className="flex flex-col gap-3 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">
        {t("admin.table.pageSummary", { page, total: safeTotalPages, count: total })}
      </span>
      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={page <= 1}
              className={cn(page <= 1 && "pointer-events-none opacity-40")}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (page > 1) onPageChange(page - 1)
              }}
            />
          </PaginationItem>
          {visiblePages.map((item) => (
            <PaginationItem key={item}>
              {typeof item === "number" ? (
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(event) => {
                    event.preventDefault()
                    if (item !== page) onPageChange(item)
                  }}
                >
                  {item}
                </PaginationLink>
              ) : (
                <PaginationEllipsis />
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              aria-disabled={page >= safeTotalPages}
              className={cn(page >= safeTotalPages && "pointer-events-none opacity-40")}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (page < safeTotalPages) onPageChange(page + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pageSet = new Set<number>()

  for (let current = 1; current <= 3; current += 1) {
    pageSet.add(current)
  }

  for (let current = totalPages - 2; current <= totalPages; current += 1) {
    pageSet.add(current)
  }

  for (let current = Math.max(1, page - 1); current <= Math.min(totalPages, page + 1); current += 1) {
    pageSet.add(current)
  }

  const sortedPages = Array.from(pageSet).sort((left, right) => left - right)
  const pages: Array<number | string> = []

  sortedPages.forEach((current, index) => {
    const previous = sortedPages[index - 1]

    if (previous && current - previous > 1) {
      pages.push(`ellipsis-${previous}-${current}`)
    }

    pages.push(current)
  })

  return pages
}

type AdminBadgeProps = {
  children: React.ReactNode
  tone?: "danger" | "info" | "success" | "warning"
}

export function AdminBadge({ children, tone = "info" }: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "info" && "bg-muted text-muted-foreground",
        tone === "success" && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        tone === "warning" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      )}
    >
      {children}
    </span>
  )
}
