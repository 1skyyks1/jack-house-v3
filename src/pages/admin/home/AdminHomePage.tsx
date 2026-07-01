import { NavLink, Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { hasAdminPermission, type AdminPermissionKey } from "@/features/admin-permissions"
import { usePermissionsQuery } from "@/features/auth"
import { cn } from "@/lib/utils"

const adminNavItems: Array<{ key: AdminPermissionKey; to: string }> = [
  { key: "dashboard", to: "/admin/dashboard" },
  { key: "tournaments", to: "/admin/tournaments" },
  { key: "events", to: "/admin/events" },
  { key: "badges", to: "/admin/badges" },
  { key: "users", to: "/admin/users" },
  { key: "announcement", to: "/admin/announcement" },
  { key: "posts", to: "/admin/posts" },
  { key: "postFiles", to: "/admin/postFiles" },
]

export function AdminHomePage() {
  const { t } = useTranslation()
  const permissionsQuery = usePermissionsQuery()
  const permissions = permissionsQuery.data?.adminPermissions

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)] lg:grid-rows-1">
      <aside className="border-b bg-card p-3 lg:min-h-0 lg:overflow-auto lg:border-b-0 lg:border-r">
        <div className="px-2 pb-3">
          <h1 className="font-heading text-2xl font-semibold">{t("admin.shell.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.shell.description")}</p>
        </div>
        <nav className="space-y-1">
          {adminNavItems
            .filter((item) => hasAdminPermission(permissions, item.key))
            .map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground",
                  )
                }
              >
                {t(`admin.nav.${item.key}`)}
              </NavLink>
            ))}
        </nav>
      </aside>
      <div className="min-h-0 min-w-0 overflow-auto bg-background p-5">
        <Outlet />
      </div>
    </section>
  )
}
