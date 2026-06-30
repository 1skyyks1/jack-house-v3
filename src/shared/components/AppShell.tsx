import { HouseIcon, InfoIcon, ListIcon, NewspaperIcon, PencilSimple, ShieldIcon, SignOutIcon, StackIcon, UserCircle } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { AuthDialog, authQueryKeys, useAuthStore, useCurrentUserQuery, usePermissionsQuery } from "@/features/auth"
import { logoutSession } from "@/features/auth/api/authApi"
import { hasAdminPermission } from "@/features/admin-permissions"
import jackHouseDarkLogo from "@/assets/pic/jackHouseDark.webp"
import jackHouseLightLogo from "@/assets/pic/jackHouseLight.webp"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { LanguageSwitch } from "./LanguageSwitch"
import { ThemeToggle } from "./ThemeToggle"

const publicNavItems = [
  { to: "/", labelKey: "common.home", icon: HouseIcon, end: true },
  { to: "/forum", labelKey: "common.forum", icon: NewspaperIcon, end: false },
  { to: "/pack", labelKey: "common.pack", icon: StackIcon, end: false },
  { to: "/about", labelKey: "common.about", icon: InfoIcon, end: false },
] as const

export function AppShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [hasScrolled, setHasScrolled] = useState(false)
  const [homeSectionIndex, setHomeSectionIndex] = useState(0)
  const isLogged = useAuthStore((state) => state.isLogged)
  const logout = useAuthStore((state) => state.logout)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const setSession = useAuthStore((state) => state.setSession)
  const authUserId = useAuthStore((state) => state.userId)
  const currentUserQuery = useCurrentUserQuery()
  const permissionsQuery = usePermissionsQuery()
  const queryClient = useQueryClient()
  const canSeeAdmin = hasAdminPermission(permissionsQuery.data?.adminPermissions, "admin")
  const currentUser = currentUserQuery.data
  const currentUserId = currentUser?.user_id ? String(currentUser.user_id) : authUserId
  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/")
  const isHomeRoute = location.pathname === "/"
  const headerScrolled = isHomeRoute ? homeSectionIndex > 0 : hasScrolled
  const useOverlayHeader = !isAdminRoute && !headerScrolled

  useEffect(() => {
    if (!currentUser) return

    const userId = String(currentUser.user_id)
    if (!isLogged || authUserId !== userId) {
      setSession({ userId })
    }
  }, [authUserId, currentUser, isLogged, setSession])

  useEffect(() => {
    if (isHomeRoute) {
      const handleHomeSectionChange = (event: Event) => {
        const detail = (event as CustomEvent<{ index?: number }>).detail
        setHomeSectionIndex(detail?.index ?? 0)
      }

      window.addEventListener("jackhouse:home-fullpage-change", handleHomeSectionChange as EventListener)

      return () => {
        window.removeEventListener("jackhouse:home-fullpage-change", handleHomeSectionChange as EventListener)
      }
    }

    const syncScrollState = () => {
      setHasScrolled(window.scrollY > 20)
    }

    syncScrollState()
    window.addEventListener("scroll", syncScrollState, { passive: true })

    return () => {
      window.removeEventListener("scroll", syncScrollState)
    }
  }, [isHomeRoute, location.pathname])

  const handleLogout = () => {
    void logoutSession().catch(() => undefined)
    logout()
    queryClient.removeQueries({ queryKey: authQueryKeys.currentUser })
    queryClient.removeQueries({ queryKey: authQueryKeys.permissions })
  }

  return (
    <div className={cn("min-h-dvh text-foreground", isAdminRoute ? "bg-background" : "bg-transparent")}>
      <header
        id="app-header"
        className={cn(
          "inset-x-0 top-0 z-40 transition-all duration-300",
          isHomeRoute && !isAdminRoute
            ? "fixed"
            : "sticky",
          isAdminRoute
            ? "border-b border-border/80 bg-background/94 backdrop-blur-lg dark:bg-background/92"
            : headerScrolled
            ? "border-b border-border/60 bg-background/82 shadow-[0_12px_44px_rgba(15,23,42,0.1)] backdrop-blur-2xl supports-backdrop-filter:bg-background/72 dark:border-white/10 dark:bg-background/78 dark:supports-backdrop-filter:bg-background/66 dark:shadow-[0_12px_44px_rgba(0,0,0,0.34)]"
            : isHomeRoute
              ? "border-b border-transparent bg-transparent"
              : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <NavLink
            to="/"
            className={cn(
              "flex h-10 items-center",
              isHomeRoute && "text-foreground dark:text-white",
            )}
          >
            <img alt="Jack House" className="hidden h-10 w-auto max-w-[8rem] object-contain sm:max-w-[10rem] dark:block" src={jackHouseDarkLogo} />
            <img alt="Jack House" className="h-10 w-auto max-w-[8rem] object-contain sm:max-w-[10rem] dark:hidden" src={jackHouseLightLogo} />
          </NavLink>

          <nav className="flex shrink-0 items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  aria-label={t("common.menu")}
                  className={cn(
                    "md:hidden",
                    useOverlayHeader
                      ? "border border-border/60 bg-background/55 text-foreground hover:bg-background/75 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  size="icon"
                  type="button"
                  variant={useOverlayHeader ? "outline" : "ghost"}
                >
                  <ListIcon className="size-4" weight="bold" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[18rem]" side="right">
                <SheetHeader>
                  <SheetTitle>{t("common.menu")}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 px-4 pb-4">
                  {publicNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)

                    return (
                      <SheetClose asChild key={item.to}>
                        <NavLink
                          className={cn(
                            "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
                            isActive && "bg-accent text-accent-foreground",
                          )}
                          end={item.end}
                          to={item.to}
                        >
                          <Icon className="size-4" weight="bold" />
                          {t(item.labelKey)}
                        </NavLink>
                      </SheetClose>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
            <div className="hidden items-center gap-1 md:flex">
              {publicNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
                        useOverlayHeader
                          ? "text-foreground/72 hover:bg-background/55 hover:text-foreground dark:text-white/72 dark:hover:bg-white/10 dark:hover:text-white"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          (useOverlayHeader
                            ? "bg-background/65 text-foreground dark:bg-white/14 dark:text-white"
                            : "bg-accent text-accent-foreground"),
                      )
                    }
                  >
                    <Icon className="size-4" weight="bold" />
                    <span className="hidden sm:inline">{t(item.labelKey)}</span>
                  </NavLink>
                )
              })}
            </div>
            <div className="ml-2 mr-3 flex items-center gap-2">
              <LanguageSwitch invert={useOverlayHeader} />
              <ThemeToggle disabled={isHomeRoute} invert={useOverlayHeader} />
            </div>
            {isLogged ? (
              <div className={cn("flex items-center gap-2 border-l pl-3", useOverlayHeader && "border-border/60 dark:border-white/12")}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className={cn(
                        "size-10 rounded-full p-1",
                        useOverlayHeader
                          ? "text-foreground/72 hover:bg-background/55 hover:text-foreground dark:text-white/72 dark:hover:bg-white/10 dark:hover:text-white"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      size="icon"
                      variant="ghost"
                    >
                      <Avatar>
                        {currentUser?.avatar ? <AvatarImage alt={currentUser.user_name} src={currentUser.avatar} /> : null}
                        <AvatarFallback>{getAvatarFallback(currentUser?.user_name)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {currentUserId ? (
                      <DropdownMenuItem onSelect={() => navigate(`/user/${currentUserId}`)}>
                        <UserCircle className="size-4" weight="bold" />
                        {t("common.profile")}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem onSelect={() => navigate("/user/edit")}>
                      <PencilSimple className="size-4" weight="bold" />
                      {t("common.editProfile")}
                    </DropdownMenuItem>
                    {canSeeAdmin ? (
                      <DropdownMenuItem onSelect={() => navigate("/admin/dashboard")}>
                        <ShieldIcon className="size-4" weight="bold" />
                        {t("common.admin")}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout} variant="destructive">
                      <SignOutIcon className="size-4" weight="bold" />
                      {t("common.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                type="button"
                className={cn(
                    useOverlayHeader &&
                    "border border-border/60 bg-background/55 text-foreground hover:bg-background/75 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
                )}
                onClick={() => openLoginDialog(window.location.pathname + window.location.search)}
                variant={useOverlayHeader ? "outline" : "default"}
              >
                {t("common.login")}
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main
        className={cn(
          "w-full",
          isAdminRoute ? "px-0 py-0" : isHomeRoute ? "px-0 py-0" : "mx-auto max-w-7xl px-4 py-6 sm:px-6",
        )}
      >
        <Outlet />
      </main>
      <AuthDialog />
    </div>
  )
}

function getAvatarFallback(name: string | null | undefined) {
  const normalizedName = name?.trim()
  return normalizedName ? normalizedName.slice(0, 2).toUpperCase() : "JH"
}
