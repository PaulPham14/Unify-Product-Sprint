"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function CohortDiagnosisContent() {
  const searchParams = useSearchParams()
  const segment = searchParams.get("segment") ?? "Unknown"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-xl font-semibold text-foreground">
        Cohort diagnosis: {segment}
      </h1>
      <p className="text-sm text-muted-foreground">
        This page will show the list of people in this segment. (Coming next.)
      </p>
      <Link
        href="/"
        className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}

export default function CohortDiagnosisPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background">Loading…</div>}>
      <CohortDiagnosisContent />
    </Suspense>
  )
}
