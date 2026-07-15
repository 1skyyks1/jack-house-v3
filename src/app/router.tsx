import type { ReactNode } from "react"
import { Navigate, createBrowserRouter } from "react-router-dom"
import { LazyRoute } from "./LazyRoute"
import {
  AboutPage,
  AdminAnnouncementsPage,
  AdminBadgesPage,
  AdminDashboardPage,
  AdminEventStagesPage,
  AdminEventsPage,
  AdminHomePage,
  AdminPostFilesPage,
  AdminPostsPage,
  AdminTournamentAuditPage,
  AdminTournamentBracketPage,
  AdminTournamentContentPage,
  AdminTournamentImportPage,
  AdminTournamentMappoolPage,
  AdminTournamentNewPage,
  AdminTournamentQualifierPage,
  AdminTournamentSettingsPage,
  AdminTournamentStaffPage,
  AdminTournamentTeamsPage,
  AdminTournamentsPage,
  AdminUsersPage,
  EventDetailPage,
  ForumEditorPage,
  ForumPage,
  HomePage,
  MappackCreatorPage,
  NewPackPage,
  NotFoundPage,
  OAuthCompletePage,
  PackDetailPage,
  PackListPage,
  PostDetailPage,
  TournamentPausedPage,
  TournamentBracketPage,
  TournamentDetailPage,
  TournamentLeaderboardPage,
  TournamentListPage,
  TournamentMappoolPage,
  TournamentMatchPage,
  TournamentQualifierPage,
  TournamentRefereePage,
  TournamentTeamsPage,
  UserEditPage,
  UserProfilePage,
} from "./lazyPages"
import { AppShell } from "@/shared/components/AppShell"
import { RequireAdminPermission, RequireTournamentAdmin } from "@/features/admin-permissions"
import { RequireAuth } from "@/features/auth"

function lazyElement(element: ReactNode) {
  return <LazyRoute>{element}</LazyRoute>
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: lazyElement(<HomePage />),
      },
      {
        path: "about",
        element: lazyElement(<AboutPage />),
      },
      {
        path: "tool/omc",
        element: lazyElement(<MappackCreatorPage />),
      },
      {
        path: "forum",
        element: lazyElement(<ForumPage />),
      },
      {
        path: "forum/editor/:id?",
        element: (
          <RequireAuth>
            {lazyElement(<ForumEditorPage />)}
          </RequireAuth>
        ),
      },
      {
        path: "post/:postId",
        element: lazyElement(<PostDetailPage />),
      },
      {
        path: "user/edit",
        element: (
          <RequireAuth>
            {lazyElement(<UserEditPage />)}
          </RequireAuth>
        ),
      },
      {
        path: "user/:userId",
        element: lazyElement(<UserProfilePage />),
      },
      {
        path: "oauth/complete",
        element: lazyElement(<OAuthCompletePage />),
      },
      {
        path: "pack",
        element: lazyElement(<PackListPage />),
      },
      {
        path: "pack/:packId",
        element: lazyElement(<PackDetailPage />),
      },
      {
        path: "newPack",
        element: (
          <RequireAuth>
            {lazyElement(<NewPackPage />)}
          </RequireAuth>
        ),
      },
      {
        path: "event/:eventId",
        element: lazyElement(<EventDetailPage />),
      },
      {
        path: "t",
        element: lazyElement(<TournamentListPage />),
      },
      {
        path: "t/:tid",
        element: lazyElement(<TournamentDetailPage />),
      },
      {
        path: "t/:tid/bracket",
        element: lazyElement(<TournamentBracketPage />),
      },
      {
        path: "t/:tid/teams",
        element: lazyElement(<TournamentTeamsPage />),
      },
      {
        path: "t/:tid/mappool",
        element: lazyElement(<TournamentMappoolPage />),
      },
      {
        path: "t/:tid/leaderboard",
        element: lazyElement(<TournamentLeaderboardPage />),
      },
      {
        path: "t/:tid/qualifier",
        element: lazyElement(<TournamentQualifierPage />),
      },
      {
        path: "t/:tid/match/:matchId",
        element: lazyElement(<TournamentMatchPage />),
      },
      {
        path: "t/:tid/referee/:matchId",
        element: (
          <RequireAuth>
            {lazyElement(<TournamentRefereePage />)}
          </RequireAuth>
        ),
      },
      {
        path: "t/:tid/*",
        element: lazyElement(<TournamentPausedPage />),
      },
      {
        path: "admin",
        element: (
          <RequireAuth>
            {lazyElement(<AdminHomePage />)}
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: <Navigate replace to="dashboard" />,
          },
          {
            path: "dashboard",
            element: (
              <RequireAdminPermission permission="dashboard">
                {lazyElement(<AdminDashboardPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "users",
            element: (
              <RequireAdminPermission permission="users">
                {lazyElement(<AdminUsersPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "announcement",
            element: (
              <RequireAdminPermission permission="announcement">
                {lazyElement(<AdminAnnouncementsPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "posts",
            element: (
              <RequireAdminPermission permission="posts">
                {lazyElement(<AdminPostsPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "postFiles",
            element: (
              <RequireAdminPermission permission="postFiles">
                {lazyElement(<AdminPostFilesPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "events",
            element: (
              <RequireAdminPermission permission="events">
                {lazyElement(<AdminEventsPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "tournaments",
            element: (
              <RequireAdminPermission permission="tournaments">
                {lazyElement(<AdminTournamentsPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "tournaments/new",
            element: (
              <RequireAdminPermission permission="tournaments">
                {lazyElement(<AdminTournamentNewPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "tournaments/:tid/settings",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentSettingsPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "tournaments/:tid/content",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentContentPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "tournaments/:tid/teams",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentTeamsPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "tournaments/:tid/import",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentImportPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "tournaments/:tid/mappool",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentMappoolPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "tournaments/:tid/qualifier",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentQualifierPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "tournaments/:tid/bracket",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentBracketPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "tournaments/:tid/staff",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentStaffPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "events/:eventId/stage",
            element: (
              <RequireAdminPermission permission="eventStages">
                {lazyElement(<AdminEventStagesPage />)}
              </RequireAdminPermission>
            ),
          },
          {
            path: "tournaments/:tid/audit",
            element: (
              <RequireTournamentAdmin>
                {lazyElement(<AdminTournamentAuditPage />)}
              </RequireTournamentAdmin>
            ),
          },
          {
            path: "badges",
            element: (
              <RequireAdminPermission permission="badges">
                {lazyElement(<AdminBadgesPage />)}
              </RequireAdminPermission>
            ),
          },
        ],
      },
      {
        path: "*",
        element: lazyElement(<NotFoundPage />),
      },
    ],
  },
])
