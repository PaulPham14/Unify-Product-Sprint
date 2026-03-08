"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, ExternalLink } from "lucide-react"
import { PieChart, Pie, Cell } from "recharts"

const ROWS_PER_PAGE = 6

const DIAGNOSIS_COLORS = {
  highMastery: "#3cc3df",
  onTrack: "#ff8a9e",
  atRisk: "#9727fc",
  disengaged: "#ffae4c",
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function StatusPill({ status }: { status: string }) {
  const isDone = status === "done"
  return (
    <span
      className="inline-flex items-center gap-[10px] rounded-full px-[10px] py-[5px] text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: isDone ? "#e1f3de" : "#f3e6ff" }}
    >
      <span
        className="inline-block size-[8px] rounded-full"
        style={{ backgroundColor: isDone ? "#259800" : "#9727fc" }}
      />
      <span style={{ color: isDone ? "#259800" : "#9727fc" }}>
        {isDone ? "Done" : "In Progress"}
      </span>
    </span>
  )
}

function MonthSelector() {
  return (
    <button className="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-black hover:bg-gray-50">
      March 2026
      <ChevronDown className="h-4 w-4 -rotate-90 text-black" />
    </button>
  )
}

function CohortDiagnosisChart({ course }: { course: NonNullable<ReturnType<typeof useQuery<typeof api.dashboardCourses.getByCourseId>>> }) {
  const data = [
    { name: "High Mastery", value: course.diagnosisHighMastery, color: DIAGNOSIS_COLORS.highMastery },
    { name: "On Track", value: course.diagnosisOnTrack, color: DIAGNOSIS_COLORS.onTrack },
    { name: "At Risk", value: course.diagnosisAtRisk, color: DIAGNOSIS_COLORS.atRisk },
    { name: "Disengaged", value: course.diagnosisDisengaged, color: DIAGNOSIS_COLORS.disengaged },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black">Cohort Diagnosis</span>
        <MonthSelector />
      </div>
      <div className="flex items-center gap-10">
        <PieChart width={162} height={162}>
          <Pie
            data={data}
            cx={81}
            cy={81}
            innerRadius={45}
            outerRadius={78}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
        <div className="flex flex-col gap-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-black">
                {item.name} = {item.value} students
              </span>
            </div>
          ))}
          <span className="text-xs text-black">
            <span className="font-semibold">Total: </span>
            {course.totalStudents} Students
          </span>
        </div>
      </div>
    </div>
  )
}

function MasteryGauge({ course }: { course: NonNullable<ReturnType<typeof useQuery<typeof api.dashboardCourses.getByCourseId>>> }) {
  const score = course.masteryScore
  const filled = (score / 100) * 180
  const gaugeData = [
    { value: filled },
    { value: 180 - filled },
  ]
  const bgData = [{ value: 180 }]

  const breakdowns = [
    { label: "Application", score: course.applicationScore, max: course.applicationMax },
    { label: "Retrieval", score: course.retrievalScore, max: course.retrievalMax },
    { label: "Retention", score: course.retentionScore, max: course.retentionMax },
    { label: "Behaviour", score: course.behaviourScore, max: course.behaviourMax },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black">Cohort Mastery Score</span>
        <MonthSelector />
      </div>
      <div className="flex items-center gap-8">
        <div className="relative flex shrink-0 flex-col items-center">
          <PieChart width={168} height={100}>
            <Pie data={bgData} cx={84} cy={90} startAngle={180} endAngle={0} innerRadius={60} outerRadius={82} dataKey="value" stroke="none">
              <Cell fill="#e8e8e8" />
            </Pie>
            <Pie data={gaugeData} cx={84} cy={90} startAngle={180} endAngle={0} innerRadius={60} outerRadius={82} dataKey="value" stroke="none">
              <Cell fill="#9727fc" />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
          <div className="absolute bottom-0 flex flex-col items-center">
            <span className="text-[30px] font-bold text-[#9727fc]">{score}</span>
            <span className="text-[10px] text-black">out of 100</span>
          </div>
        </div>
        <div className="flex flex-col gap-[10px]">
          {breakdowns.map((b) => (
            <div key={b.label} className="flex w-48 items-center justify-between text-xs">
              <span className="text-black">{b.label}</span>
              <span className="font-medium text-[#9727fc]">{b.score} / {b.max}</span>
            </div>
          ))}
          <div className="h-px w-48 bg-[#ccc]" />
          <div className="flex w-48 flex-col items-end">
            <span className="text-sm font-bold text-black">{score}</span>
            <span className="text-[10px] text-black">out of 100</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssessmentTable({ assessments }: { assessments: NonNullable<ReturnType<typeof useQuery<typeof api.dashboardCourses.listAssessments>>> }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(assessments.length / ROWS_PER_PAGE))
  const pageRows = assessments.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []
    for (let i = 1; i <= Math.min(5, totalPages); i++) pages.push(i)
    if (totalPages > 6) pages.push("...")
    if (totalPages > 5) pages.push(totalPages)
    return pages
  }, [totalPages])

  const firstDoneIdx = pageRows.findIndex((r) => r.status === "done")

  function rowBg(row: (typeof assessments)[number], idx: number) {
    if (row.status !== "done" || row.averageScore == null) return undefined
    if (row.averageScore < 65) return "#ffddd9"
    if (idx === firstDoneIdx) return "#fdf6c7"
    return undefined
  }

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="py-2">
        <span className="text-sm font-medium text-black">Assessment Insights</span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-start rounded-[4px] bg-[#5b5b5b] py-[5px]">
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Assessment Type</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Module/ Lesson</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Due Date</span>
          </div>
          <div className="flex w-[170px] shrink-0 items-center justify-center">
            <span className="text-xs font-bold text-white">Status</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Average Score</span>
          </div>
        </div>

        {pageRows.map((row, idx) => (
          <div
            key={row._id}
            className="flex h-[27px] w-full items-center rounded-[4px]"
            style={{ backgroundColor: rowBg(row, idx) }}
          >
            <div className="flex flex-1 items-center px-[10px]">
              <span className="truncate text-xs text-black">{row.assessmentType}</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="truncate text-xs text-black">{row.moduleLesson}</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="truncate text-xs text-black">{formatDate(row.dueDate)}</span>
            </div>
            <div className="flex w-[170px] shrink-0 items-center justify-center">
              <StatusPill status={row.status} />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="text-xs font-medium text-black">
                {row.averageScore != null ? `${row.averageScore}%` : "-"}
              </span>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-[156px]">
          <div className="flex items-center gap-[10px]">
            <span className="text-[10px] font-medium text-black">Show</span>
            <div className="flex h-[27px] items-center gap-[10px] rounded-[4px] border border-[#afafaf] bg-white px-[10px]">
              <span className="text-[10px] font-medium text-black">{ROWS_PER_PAGE}</span>
              <ChevronDown className="h-4 w-4 text-black" />
            </div>
            <span className="text-[10px] font-medium text-black">Row</span>
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex size-[34px] items-center justify-center rounded bg-[#f9f9f9] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 text-black" />
            </button>
            <div className="flex items-center">
              {pageNumbers.map((p, i) => (
                <button
                  key={i}
                  onClick={() => typeof p === "number" && setPage(p)}
                  className="flex w-[35px] items-center justify-center rounded p-[10px]"
                >
                  <span
                    className={`text-[10px] ${
                      p === page
                        ? "font-bold text-[#9727fc]"
                        : "font-medium text-[#5b5b5b]"
                    }`}
                  >
                    {p}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex size-[34px] items-center justify-center rounded bg-[#f2f2f2] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardCoursesContent() {
  const convexAvailable = useConvexAvailable()
  const courses = useQuery(api.dashboardCourses.list)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const activeCourseId = selectedCourseId ?? courses?.[0]?.courseId ?? null
  const course = useQuery(
    api.dashboardCourses.getByCourseId,
    activeCourseId ? { courseId: activeCourseId } : "skip"
  )
  const assessments = useQuery(
    api.dashboardCourses.listAssessments,
    activeCourseId ? { courseId: activeCourseId } : "skip"
  )

  if (!convexAvailable) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL to enable data.
      </div>
    )
  }

  if (!courses || !course || !assessments) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading courses…
      </div>
    )
  }

  const stats = [
    {
      value: `${course.cohortHealthScore}%`,
      label: "Cohort Health Score",
      action: "menu" as const,
    },
    {
      value: String(course.studentsAtRisk),
      label: "Students At Risk",
      action: "link" as const,
    },
    {
      value: course.frictionModules.join(", "),
      label: "Modules Causing Friction",
      action: "link" as const,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6">
      <div className="flex flex-col gap-16">
        {/* Top section: dropdown + stat cards */}
        <div className="flex flex-col gap-4">
          <div className="relative w-fit">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-[10px] rounded-[10px] border-[1.5px] border-[#eee] bg-white px-[15px] py-[10px] text-xs font-medium text-black"
            >
              {course.title}
              <ChevronDown className="h-[17px] w-[17px] text-black" />
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-[#eee] bg-white py-1 shadow-md">
                {courses.map((c) => (
                  <button
                    key={c.courseId}
                    onClick={() => {
                      setSelectedCourseId(c.courseId)
                      setDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-gray-50 ${
                      c.courseId === activeCourseId
                        ? "font-medium text-black"
                        : "text-[#5b5b5b]"
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col justify-between rounded-xl border-2 border-[#eee] bg-white px-6 py-5"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[30px] font-bold leading-none text-[#9727fc]">
                    {stat.value}
                  </span>
                  <button className="text-[#5b5b5b] hover:text-black">
                    {stat.action === "menu" ? (
                      <MoreHorizontal className="h-4 w-4" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <span className="mt-6 text-sm font-medium text-[#5b5b5b]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cohort Performance Insights */}
        <div className="flex flex-col gap-8">
          <h2 className="text-sm font-semibold tracking-[0.28px] text-black">
            Cohort Performance Insights
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <CohortDiagnosisChart course={course} />
              <MasteryGauge course={course} />
            </div>
            <AssessmentTable assessments={assessments} />
          </div>
        </div>
      </div>
    </div>
  )
}
