"use client"

import { useState } from "react"
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
import { LearnerInsightsContent } from "@/components/learner-insights-content"
import { AcademyContent } from "@/components/home/academy-content"
import { AnnouncementsContent } from "@/components/home/announcements-content"
import { QuestionsContent } from "@/components/home/questions-content"
import { MemberEventsContent } from "@/components/home/member-events-content"
import { ResourcesContent } from "@/components/home/resources-content"

export default function Page() {
  const [activePage, setActivePage] = useState<PageId>("home")
  const [homeSubPage, setHomeSubPage] = useState<HomeSubPage>("for-you")
  const [dashboardSubPage, setDashboardSubPage] = useState<DashboardSubPage>("for-you")

  const handleNavigate = (page: PageId) => {
    setActivePage(page)
    if (page === "home") {
      setHomeSubPage("for-you")
    }
    if (page === "dashboard") {
      setDashboardSubPage("for-you")
    }
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
        return <LearnerInsightsContent />
      default:
        return <DashboardForYouContent />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <IconSidebar activePage={activePage} onNavigate={handleNavigate} />
      <NavSidebar activePage={activePage} homeSubPage={homeSubPage} onHomeSubPageChange={setHomeSubPage} dashboardSubPage={dashboardSubPage} onDashboardSubPageChange={setDashboardSubPage} />
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
