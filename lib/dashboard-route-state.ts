export type AppPageId = "home" | "dashboard" | "learning" | "events" | "chat" | "admin"
export type AppHomeSubPage =
  | "for-you"
  | "academy"
  | "announcements"
  | "questions"
  | "member-events"
  | "resources"
export type AppDashboardSubPage = "for-you" | "courses" | "learners"

export type DashboardRouteState = {
  page: AppPageId
  homeSubPage: AppHomeSubPage
  dashboardSubPage: AppDashboardSubPage
  learnerId: string | null
}

const VALID_PAGES = new Set<AppPageId>([
  "home",
  "dashboard",
  "learning",
  "events",
  "chat",
  "admin",
])

const VALID_HOME_SUBPAGES = new Set<AppHomeSubPage>([
  "for-you",
  "academy",
  "announcements",
  "questions",
  "member-events",
  "resources",
])

const VALID_DASHBOARD_SUBPAGES = new Set<AppDashboardSubPage>([
  "for-you",
  "courses",
  "learners",
])

export function buildDashboardHref({
  page,
  homeSubPage,
  dashboardSubPage,
  learnerId,
}: Partial<DashboardRouteState> & { page: AppPageId }) {
  const params = new URLSearchParams({ page })

  if (homeSubPage) {
    params.set("homeSubPage", homeSubPage)
  }

  if (dashboardSubPage) {
    params.set("dashboardSubPage", dashboardSubPage)
  }

  if (learnerId) {
    params.set("learnerId", learnerId)
  }

  return `/?${params.toString()}`
}

export function parseDashboardRouteState(
  searchParams: Pick<URLSearchParams, "get">
): DashboardRouteState {
  const page = searchParams.get("page")
  const homeSubPage = searchParams.get("homeSubPage")
  const dashboardSubPage = searchParams.get("dashboardSubPage")
  const learnerId = searchParams.get("learnerId")

  return {
    page: VALID_PAGES.has(page as AppPageId) ? (page as AppPageId) : "home",
    homeSubPage: VALID_HOME_SUBPAGES.has(homeSubPage as AppHomeSubPage)
      ? (homeSubPage as AppHomeSubPage)
      : "for-you",
    dashboardSubPage: VALID_DASHBOARD_SUBPAGES.has(
      dashboardSubPage as AppDashboardSubPage
    )
      ? (dashboardSubPage as AppDashboardSubPage)
      : "courses",
    learnerId: learnerId || null,
  }
}
