import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

const siteTitle = "Jack House"

export function PageTitle() {
  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    document.title = resolvePageTitle(location.pathname, t)
  }, [location.pathname, t])

  return null
}

function resolvePageTitle(pathname: string, t: (key: string) => string) {
  const title = getRouteTitle(pathname, t)
  return title ? `${title} - ${siteTitle}` : siteTitle
}

function getRouteTitle(pathname: string, t: (key: string) => string) {
  if (pathname === "/") return null
  if (pathname === "/about") return t("common.about")
  if (pathname === "/forum" || pathname.startsWith("/forum/")) return t("common.forum")
  if (pathname.startsWith("/post/")) return t("common.post")
  if (pathname === "/pack" || pathname.startsWith("/pack/")) return t("common.pack")
  if (pathname === "/newPack") return t("pack.new.breadcrumb")
  if (pathname === "/tool") return t("tools.title")
  if (pathname === "/tool/omc") return t("mappackCreator.title")
  if (pathname === "/tool/oma") return t("maniaAnalyser.title")
  if (pathname === "/tool/acc") return t("accuracyCalculator.title")
  if (pathname === "/tool/aimg") return t("aiImage.title")
  if (pathname.startsWith("/event/")) return t("admin.nav.events")
  if (pathname === "/t" || pathname.startsWith("/t/")) return getTournamentTitle(pathname, t)
  if (pathname === "/user/edit") return t("common.editProfile")
  if (pathname.startsWith("/user/")) return t("common.profile")
  if (pathname.startsWith("/oauth/")) return t("common.login")
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return getAdminTitle(pathname, t)
  return t("common.notFound")
}

function getTournamentTitle(pathname: string, t: (key: string) => string) {
  if (/^\/t\/[^/]+\/bracket\/?$/.test(pathname)) return t("tournament.common.bracket")
  if (/^\/t\/[^/]+\/teams\/?$/.test(pathname)) return t("tournament.common.teams")
  if (/^\/t\/[^/]+\/qualifier\/?$/.test(pathname)) return t("tournament.common.qualifier")
  if (/^\/t\/[^/]+\/match\/[^/]+\/?$/.test(pathname)) return t("tournament.common.tournament")
  if (/^\/t\/[^/]+\/referee\/[^/]+\/?$/.test(pathname)) return t("tournament.common.referee")
  return t("common.tournaments")
}

function getAdminTitle(pathname: string, t: (key: string) => string) {
  if (pathname === "/admin" || pathname === "/admin/dashboard") return t("admin.nav.dashboard")
  if (pathname === "/admin/users") return t("admin.nav.users")
  if (pathname === "/admin/aimg") return t("admin.nav.aiImages")
  if (pathname === "/admin/announcement") return t("admin.nav.announcement")
  if (pathname === "/admin/posts") return t("admin.nav.posts")
  if (pathname === "/admin/postFiles") return t("admin.nav.postFiles")
  if (pathname === "/admin/events") return t("admin.nav.events")
  if (/^\/admin\/events\/[^/]+\/stage\/?$/.test(pathname)) return t("admin.nav.eventStages")
  if (pathname === "/admin/tournaments" || pathname.startsWith("/admin/tournaments/")) return t("admin.nav.tournaments")
  if (pathname === "/admin/badges") return t("admin.nav.badges")
  return t("admin.nav.admin")
}
