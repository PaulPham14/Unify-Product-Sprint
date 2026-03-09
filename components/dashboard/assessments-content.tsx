"use client"

import { useMemo, useState } from "react"
import { useAction, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ROWS_PER_PAGE = 20

type AssessmentInsight = NonNullable<
  ReturnType<typeof useQuery<typeof api.dashboardCourses.listAssessmentInsights>>
>[number]

function StatusPill({ status }: { status: string }) {
  const inProgress = status === "in_progress"
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
        inProgress ? "bg-[#f3e6ff] text-[#9727fc]" : "bg-[#e1f3de] text-[#259800]"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${inProgress ? "bg-[#9727fc]" : "bg-[#259800]"}`}
        aria-hidden
      />
      {inProgress ? "In Progress" : "Done"}
    </span>
  )
}

export function DashboardAssessmentsContent() {
  const convexAvailable = useConvexAvailable()
  const courses = useQuery(api.dashboardCourses.list, {})
  const reseedDashboardDemo = useAction(api.demoData.reseedLearningIntelligenceDashboard)
  const [seeding, setSeeding] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [page, setPage] = useState(1)

  const effectiveCourseId = selectedCourseId || courses?.[0]?.courseId || ""
  const assessments = useQuery(
    api.dashboardCourses.listAssessmentInsights,
    effectiveCourseId ? { courseId: effectiveCourseId } : "skip",
  )

  const totalPages = useMemo(() => {
    const total = assessments?.length ?? 0
    return Math.max(1, Math.ceil(total / ROWS_PER_PAGE))
  }, [assessments])

  const pagedRows = useMemo(() => {
    if (!assessments) return []
    const start = (page - 1) * ROWS_PER_PAGE
    return assessments.slice(start, start + ROWS_PER_PAGE)
  }, [assessments, page])

  const handleSeedDemoData = async () => {
    setSeeding(true)
    try {
      await reseedDashboardDemo({})
    } finally {
      setSeeding(false)
    }
  }

  if (!convexAvailable) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Connect Convex to view assessments.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-[40px] font-bold tracking-[0.6px] text-black">Assessments</h1>

        <div className="flex items-center justify-between">
          <Select
            value={effectiveCourseId}
            onValueChange={(value) => {
              setSelectedCourseId(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-auto min-w-[170px] rounded-[10px] border-[1.5px] border-[#eee] bg-white px-[15px] py-[10px] text-xs font-medium text-black shadow-none">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses?.map((course) => (
                <SelectItem key={course.courseId} value={course.courseId}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-medium text-black hover:bg-[#f7f7f7] disabled:opacity-50"
            >
              {seeding ? "Reseeding..." : "Reseed detailed data"}
            </button>
            <button
              type="button"
              className="rounded-[10px] bg-[#7f23ff] px-[10px] py-[10px] text-xs font-medium text-white"
            >
              Create New Assessment
            </button>
          </div>
        </div>

        <section className="rounded-[14px] border-2 border-[#eee] bg-white p-4">
          <div className="pb-2">
            <p className="text-[14px] font-medium text-black">Assessment Insights</p>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-5 rounded-[4px] bg-[#5b5b5b] py-[5px] text-center text-xs font-bold text-white">
              <span>Task Type</span>
              <span>Course/ Module</span>
              <span>Due Date</span>
              <span>Status</span>
              <span>Average Score</span>
            </div>

            {pagedRows.map((row: AssessmentInsight, idx) => {
              const rowBg =
                row.severity === "low"
                  ? "bg-[#ffddd9]"
                  : row.severity === "moderate"
                    ? "bg-[#fdf6c7]"
                    : "bg-transparent"
              const dueDate = new Date(row.dueDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })

              return (
                <div
                  key={`${row.assessmentType}-${idx}`}
                  className={`grid grid-cols-5 items-center rounded-[4px] py-[6px] text-center text-xs text-black ${rowBg}`}
                >
                  <span>{row.assessmentType}</span>
                  <span>{row.courseModuleLabel}</span>
                  <span>{dueDate}</span>
                  <span className="flex justify-center">
                    <StatusPill status={row.status} />
                  </span>
                  <span className={row.severity === "moderate" ? "font-medium" : ""}>
                    {row.averageScoreLabel}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-black">
              <span>Show</span>
              <span className="rounded border border-[#afafaf] bg-white px-2 py-1">20</span>
              <span>Row</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded bg-[#f9f9f9] px-2 py-1 text-[#5b5b5b]"
              >
                {"<"}
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const num = i + 1
                const active = num === page
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`rounded px-2 py-1 ${active ? "font-bold text-[#9727fc]" : "text-[#5b5b5b]"}`}
                  >
                    {num}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded bg-[#f2f2f2] px-2 py-1 text-[#5b5b5b]"
              >
                {">"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
