export type AppPageId = "home" | "dashboard" | "learning" | "events" | "chat" | "admin"
export type AppHomeSubPage =
  | "for-you"
  | "academy"
  | "announcements"
  | "questions"
  | "member-events"
  | "resources"
export type AppDashboardSubPage = "for-you" | "courses" | "learners" | "assessments"

export type DashboardRouteState = {
  page: AppPageId
  homeSubPage: AppHomeSubPage
  dashboardSubPage: AppDashboardSubPage
  learnerId: string | null
  /** When on assessments tab: open this assessment detail. */
  assessmentCourseId: string | null
  assessmentId: string | null
  assessmentOrder: string | null
  assessmentType: string | null
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
  "assessments",
])

export function buildDashboardHref({
  page,
  homeSubPage,
  dashboardSubPage,
  learnerId,
  assessmentCourseId,
  assessmentId,
  assessmentOrder,
  assessmentType,
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

  if (assessmentCourseId) {
    params.set("assessmentCourseId", assessmentCourseId)
  }
  if (assessmentId) {
    params.set("assessmentId", assessmentId)
  }
  if (assessmentOrder != null && assessmentOrder !== "") {
    params.set("assessmentOrder", assessmentOrder)
  }
  if (assessmentType) {
    params.set("assessmentType", assessmentType)
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
  const assessmentCourseId = searchParams.get("assessmentCourseId")
  const assessmentId = searchParams.get("assessmentId")
  const assessmentOrder = searchParams.get("assessmentOrder")
  const assessmentType = searchParams.get("assessmentType")

  return {
    page: VALID_PAGES.has(page as AppPageId) ? (page as AppPageId) : "dashboard",
    homeSubPage: VALID_HOME_SUBPAGES.has(homeSubPage as AppHomeSubPage)
      ? (homeSubPage as AppHomeSubPage)
      : "for-you",
    dashboardSubPage: VALID_DASHBOARD_SUBPAGES.has(
      dashboardSubPage as AppDashboardSubPage
    )
      ? (dashboardSubPage as AppDashboardSubPage)
      : "for-you",
    learnerId: learnerId || null,
    assessmentCourseId: assessmentCourseId || null,
    assessmentId: assessmentId || null,
    assessmentOrder: assessmentOrder || null,
    assessmentType: assessmentType || null,
  }
}
