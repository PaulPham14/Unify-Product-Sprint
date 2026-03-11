"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconSidebar, type PageId, type HomeSubPage, type DashboardSubPage } from "@/components/icon-sidebar"
import { NavSidebar } from "@/components/nav-sidebar"
import { PageHeader } from "@/components/top-bar"
import { MainContent } from "@/components/main-content"
import { LearningContent } from "@/components/learning-content"
import { EventsContent } from "@/components/events-content"
import { ChatContent } from "@/components/chat-content"
import { AdminContent } from "@/components/admin-content"
import { DashboardForYouContent } from "@/components/dashboard/for-you-content"
import { DashboardCoursesContent } from "@/components/dashboard/courses-content"
import { DashboardAssessmentsContent } from "@/components/dashboard/assessments-content"
import { LearnerInsightsContent } from "@/components/learner-insights-content"
import { AcademyContent } from "@/components/home/academy-content"
import { AnnouncementsContent } from "@/components/home/announcements-content"
import { QuestionsContent } from "@/components/home/questions-content"
import { MemberEventsContent } from "@/components/home/member-events-content"
import { ResourcesContent } from "@/components/home/resources-content"
import { buildDashboardHref, parseDashboardRouteState } from "@/lib/dashboard-route-state"

function RootPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeState = useMemo(
    () => parseDashboardRouteState(searchParams),
    [searchParams]
  )
  const [activePage, setActivePage] = useState<PageId>(routeState.page)
  const [homeSubPage, setHomeSubPage] = useState<HomeSubPage>(routeState.homeSubPage)
  const [dashboardSubPage, setDashboardSubPage] = useState<DashboardSubPage>(routeState.dashboardSubPage)

  useEffect(() => {
    setActivePage(routeState.page)
    setHomeSubPage(routeState.homeSubPage)
    setDashboardSubPage(routeState.dashboardSubPage)
  }, [routeState])

  const navigateToRootState = (href: string) => {
    router.replace(href)
  }

  const handleNavigate = (page: PageId) => {
    setActivePage(page)
    if (page === "home") {
      setHomeSubPage("for-you")
      navigateToRootState(buildDashboardHref({ page: "home", homeSubPage: "for-you" }))
    } else if (page === "dashboard") {
      setDashboardSubPage("for-you")
      navigateToRootState(
        buildDashboardHref({ page: "dashboard", dashboardSubPage: "for-you" })
      )
    } else {
      navigateToRootState(buildDashboardHref({ page }))
    }
  }

  const handleHomeSubPageChange = (subPage: HomeSubPage) => {
    setActivePage("home")
    setHomeSubPage(subPage)
    navigateToRootState(buildDashboardHref({ page: "home", homeSubPage: subPage }))
  }

  const handleDashboardSubPageChange = (subPage: DashboardSubPage) => {
    setActivePage("dashboard")
    setDashboardSubPage(subPage)
    navigateToRootState(
      buildDashboardHref({ page: "dashboard", dashboardSubPage: subPage })
    )
  }

  function renderHomeContent() {
    switch (homeSubPage) {
      case "for-you":
        return <MainContent />
      case "academy":
        return <AcademyContent />
      case "announcements":
        return <AnnouncementsContent />
      case "questions":
        return <QuestionsContent />
      case "member-events":
        return <MemberEventsContent />
      case "resources":
        return <ResourcesContent />
      default:
        return <MainContent />
    }
  }

  function renderDashboardContent() {
    switch (dashboardSubPage) {
      case "for-you":
        return <DashboardForYouContent />
      case "courses":
        return <DashboardCoursesContent />
      case "learners":
        return <LearnerInsightsContent initialLearnerId={routeState.learnerId} />
      case "assessments":
        return (
          <DashboardAssessmentsContent
            assessmentCourseId={routeState.assessmentCourseId}
            assessmentId={routeState.assessmentId}
            assessmentOrder={routeState.assessmentOrder}
          />
        )
      default:
        return <DashboardForYouContent />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <IconSidebar activePage={activePage} onNavigate={handleNavigate} />
      <NavSidebar
        activePage={activePage}
        homeSubPage={homeSubPage}
        onHomeSubPageChange={handleHomeSubPageChange}
        dashboardSubPage={dashboardSubPage}
        onDashboardSubPageChange={handleDashboardSubPageChange}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader activePage={activePage} homeSubPage={homeSubPage} dashboardSubPage={dashboardSubPage} />
        {activePage === "home" && renderHomeContent()}
        {activePage === "dashboard" && renderDashboardContent()}
        {activePage === "learning" && <LearningContent />}
        {activePage === "events" && <EventsContent />}
        {activePage === "chat" && <ChatContent />}
        {activePage === "admin" && <AdminContent />}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading dashboard…
        </div>
      }
    >
      <RootPageContent />
    </Suspense>
  )
}
