"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import { DashboardRouteShell } from "@/components/dashboard/dashboard-route-shell"
import { buildDashboardHref } from "@/lib/dashboard-route-state"
import { ChevronLeft } from "lucide-react"

function StatusPill({ status }: { status: string }) {
  const notStarted = status === "not_started"
  const inProgress = status === "in_progress"
  const label = notStarted ? "Not started" : inProgress ? "In Progress" : "Done"
  const style = notStarted
    ? "bg-[#f0f0f0] text-[#5b5b5b]"
    : inProgress
      ? "bg-[#f3e6ff] text-[#9727fc]"
      : "bg-[#e1f3de] text-[#259800]"
  const dotStyle = notStarted ? "bg-[#5b5b5b]" : inProgress ? "bg-[#9727fc]" : "bg-[#259800]"
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotStyle}`} aria-hidden />
      {label}
    </span>
  )
}

function AssessmentInsightContent() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get("courseId") ?? ""
  const assessmentId = searchParams.get("assessmentId") ?? ""
  const convexAvailable = useConvexAvailable()

  const detail = useQuery(
    api.dashboardCourses.getAssessmentDetail,
    courseId && assessmentId ? { courseId, assessmentId } : "skip",
  )

  const backHref = buildDashboardHref({ page: "dashboard", dashboardSubPage: "assessments" })

  if (!convexAvailable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Convex is not configured.</p>
        <Link
          href={backHref}
          className="text-sm font-medium text-[#9727fc] underline hover:no-underline"
        >
          Back to Assessments
        </Link>
      </div>
    )
  }

  if (!courseId || !assessmentId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">
          Missing course or assessment. Open this page from the Assessments table.
        </p>
        <Link
          href={backHref}
          className="text-sm font-medium text-[#9727fc] underline hover:no-underline"
        >
          Back to Assessments
        </Link>
      </div>
    )
  }

  if (detail === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Loading…</p>
      </div>
    )
  }

  if (detail === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Assessment not found.</p>
        <Link
          href={backHref}
          className="text-sm font-medium text-[#9727fc] underline hover:no-underline"
        >
          Back to Assessments
        </Link>
      </div>
    )
  }

  const dueDate = new Date(detail.dueDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-[#5b5b5b] hover:text-black"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Assessments
        </Link>

        <header className="mb-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-black">
              {detail.assessmentName}
            </h1>
            <StatusPill status={detail.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#5b5b5b]">
            <span>{detail.courseModuleLabel}</span>
            <span>Due {dueDate}</span>
            <span className="font-medium text-black">
              Class average: {detail.averageScoreLabel}
            </span>
          </div>
        </header>

        {detail.instructions ? (
          <section className="mb-8 rounded-[14px] border-2 border-[#eee] bg-[#f9f9f9] p-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5b5b5b]">
              Instructions
            </h2>
            <p className="text-sm text-black whitespace-pre-wrap">{detail.instructions}</p>
          </section>
        ) : null}

        {detail.rubric && detail.rubric.length > 0 ? (
          <section className="mb-8 rounded-[14px] border-2 border-[#eee] bg-white p-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#5b5b5b]">
              Rubric
            </h2>
            <ul className="space-y-2">
              {detail.rubric.map((item, i) => (
                <li key={i} className="flex flex-col gap-0.5 text-sm">
                  <span className="font-medium text-black">
                    {item.criterion}
                    <span className="ml-2 text-[#5b5b5b]">({item.weightPct}%)</span>
                  </span>
                  {item.description ? (
                    <span className="text-xs text-[#5b5b5b]">{item.description}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-[14px] border-2 border-[#eee] bg-white">
          <div className="border-b border-[#eee] p-4">
            <h2 className="text-sm font-bold text-black">Student grades</h2>
            <p className="mt-0.5 text-xs text-[#5b5b5b]">
              {detail.learnerGrades.length} enrolled learner
              {detail.learnerGrades.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#5b5b5b] text-xs font-bold text-white">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3 text-center">Submitted</th>
                  <th className="px-4 py-3 text-center">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {detail.learnerGrades.map((row) => (
                  <tr
                    key={String(row.learnerId)}
                    className="border-b border-[#eee] last:border-b-0 hover:bg-[#f9f9f9]"
                  >
                    <td className="px-4 py-3 font-medium text-black">{row.learnerName}</td>
                    <td className="px-4 py-3 text-center text-black">
                      {row.scoreLabel ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-[#5b5b5b]">
                      {row.submittedAt != null
                        ? new Date(
                            row.submittedAt < 1e12 ? row.submittedAt * 1000 : row.submittedAt,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-[#5b5b5b]">
                      {row.attempts != null ? String(row.attempts) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function AssessmentInsightPage() {
  return (
    <DashboardRouteShell dashboardSubPage="assessments">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center bg-white p-6">
            <p className="text-sm text-[#5b5b5b]">Loading…</p>
          </div>
        }
      >
        <AssessmentInsightContent />
      </Suspense>
    </DashboardRouteShell>
  )
}
