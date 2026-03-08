"use client"

import { Suspense } from "react"
import { CohortDiagnosisContent } from "@/components/dashboard/cohort-diagnosis-content"
import { DashboardRouteShell } from "@/components/dashboard/dashboard-route-shell"

export default function CohortDiagnosisPage() {
  return (
    <DashboardRouteShell dashboardSubPage="courses">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center bg-white p-6 text-sm text-muted-foreground">
            Loading cohort diagnosis…
          </div>
        }
      >
        <CohortDiagnosisContent />
      </Suspense>
    </DashboardRouteShell>
  )
}
