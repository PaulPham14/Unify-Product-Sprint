"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import {
  IconSidebar,
  type DashboardSubPage,
  type HomeSubPage,
  type PageId,
} from "@/components/icon-sidebar"
import { NavSidebar } from "@/components/nav-sidebar"
import { PageHeader } from "@/components/top-bar"
import { buildDashboardHref } from "@/lib/dashboard-route-state"

export function DashboardRouteShell({
  children,
  dashboardSubPage = "courses",
}: {
  children: ReactNode
  dashboardSubPage?: DashboardSubPage
}) {
  const router = useRouter()

  const navigateToRoot = (href: string) => {
    router.push(href)
  }

  const handlePageNavigate = (page: PageId) => {
    if (page === "home") {
      navigateToRoot(buildDashboardHref({ page: "home", homeSubPage: "for-you" }))
      return
    }

    if (page === "dashboard") {
      navigateToRoot(
        buildDashboardHref({ page: "dashboard", dashboardSubPage: "for-you" })
      )
      return
    }

    navigateToRoot(buildDashboardHref({ page }))
  }

  const handleHomeSubPageChange = (subPage: HomeSubPage) => {
    navigateToRoot(buildDashboardHref({ page: "home", homeSubPage: subPage }))
  }

  const handleDashboardSubPageChange = (subPage: DashboardSubPage) => {
    navigateToRoot(
      buildDashboardHref({ page: "dashboard", dashboardSubPage: subPage })
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <IconSidebar activePage="dashboard" onNavigate={handlePageNavigate} />
      <NavSidebar
        activePage="dashboard"
        homeSubPage="for-you"
        onHomeSubPageChange={handleHomeSubPageChange}
        dashboardSubPage={dashboardSubPage}
        onDashboardSubPageChange={handleDashboardSubPageChange}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader activePage="dashboard" dashboardSubPage={dashboardSubPage} />
        {children}
      </div>
    </div>
  )
}
