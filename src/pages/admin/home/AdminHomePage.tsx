import { List } from "@phosphor-icons/react"
import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { hasAdminPermission, type AdminPermissionKey } from "@/features/admin-permissions"
import { usePermissionsQuery } from "@/features/auth"
import { cn } from "@/lib/utils"

const adminNavItems: Array<{ key: AdminPermissionKey; to: string }> = [
  { key: "dashboard", to: "/admin/dashboard" },
  { key: "aiImages", to: "/admin/aimg" },
  { key: "tournaments", to: "/admin/tournaments" },
  { key: "events", to: "/admin/events" },
  { key: "badges", to: "/admin/badges" },
  { key: "users", to: "/admin/users" },
  { key: "rewards", to: "/admin/rewards" },
  { key: "announcement", to: "/admin/announcement" },
  { key: "posts", to: "/admin/posts" },
  { key: "postFiles", to: "/admin/postFiles" },
  { key: "packFeedback", to: "/admin/packFeedback" },
  { key: "packTags", to: "/admin/packTags" },
]

export function AdminHomePage() {
  const { t } = useTranslation()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const permissionsQuery = usePermissionsQuery()
  const permissions = permissionsQuery.data?.adminPermissions
  const visibleNavItems = adminNavItems.filter((item) => hasAdminPermission(permissions, item.key))
  const currentItem = visibleNavItems.find((item) => (
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  ))

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)] lg:grid-rows-1">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b bg-card px-4 py-2.5 lg:hidden">
        <div className="min-w-0">
          <div className="text-xs font-medium text-muted-foreground">{t("admin.shell.title")}</div>
          <div className="truncate text-sm font-semibold">
            {currentItem ? t(`admin.nav.${currentItem.key}`) : t("admin.nav.admin")}
          </div>
        </div>
        <Button
          aria-label={t("admin.shell.openMenu")}
          onClick={() => setIsMenuOpen(true)}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <List className="size-5" weight="bold" />
        </Button>
        <Sheet onOpenChange={setIsMenuOpen} open={isMenuOpen}>
          <SheetContent className="w-[min(18rem,85vw)]" side="left">
            <SheetHeader>
              <SheetTitle>{t("admin.shell.title")}</SheetTitle>
              <SheetDescription>{t("admin.shell.description")}</SheetDescription>
            </SheetHeader>
            <AdminNavigation items={visibleNavItems} onNavigate={() => setIsMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden border-r bg-card p-3 lg:block lg:min-h-0 lg:overflow-auto">
        <div className="px-2 pb-3">
          <h1 className="font-heading text-2xl font-semibold">{t("admin.shell.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.shell.description")}</p>
        </div>
        <AdminNavigation items={visibleNavItems} />
      </aside>
      <div className="min-h-0 min-w-0 overflow-auto bg-background p-3 sm:p-5">
        <Outlet />
      </div>
    </section>
  )
}

type AdminNavigationProps = {
  items: typeof adminNavItems
  onNavigate?: () => void
}

function AdminNavigation({ items, onNavigate }: AdminNavigationProps) {
  const { t } = useTranslation()

  return (
    <nav className="space-y-1 px-3 pb-4 lg:px-0 lg:pb-0">
      {items.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground",
            )
          }
          onClick={onNavigate}
        >
          {t(`admin.nav.${item.key}`)}
        </NavLink>
      ))}
    </nav>
  )
}
