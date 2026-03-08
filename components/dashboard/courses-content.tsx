"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, ExternalLink, Pointer } from "lucide-react"

const ROWS_PER_PAGE = 6

const DIAGNOSIS_COLORS = {
  highMastery: "#3cc3df",
  onTrack: "#ff8a9e",
  atRisk: "#9727fc",
  disengaged: "#ffae4c",
}

const INSTRUCTOR_COHORT_ID = "cohort_ai_001"

const RISK_BUCKET_MAP: Record<string, string> = {
  "High Mastery": "high_mastery",
  "On Track": "on_track",
  "At Risk": "at_risk",
  "Disengaged": "disengaged",
}

const MASTERY_GAUGE_RADIUS = 62
const MASTERY_GAUGE_START_ANGLE = 150
const MASTERY_GAUGE_SWEEP_ANGLE = 240
const MASTERY_GAUGE_TICK_COUNT = 11

function getPolarPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}

type LearnerDoc = {
  _id: string
  name: string
  riskBucket?: string
  role: string
}

type CourseDoc = NonNullable<
  ReturnType<typeof useQuery<typeof api.dashboardCourses.getByCourseId>>
>
type AssessmentList = NonNullable<
  ReturnType<typeof useQuery<typeof api.dashboardCourses.listAssessments>>
>
type ModuleInsightList = NonNullable<
  ReturnType<typeof useQuery<typeof api.dashboardCourses.listModuleInsights>>
>

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
    <button className="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-black transition-colors hover:bg-gray-50">
      March 2026
      <ChevronDown className="h-5 w-5 text-black" />
    </button>
  )
}

function DiagnosisHoverCard({
  segmentName,
  studentCount,
}: {
  segmentName: string
  studentCount: number
}) {
  const href = `/dashboard/cohort-diagnosis?segment=${encodeURIComponent(segmentName)}`
  return (
    <div className="flex w-full min-w-[280px] max-w-[312px] flex-col gap-4 rounded-[14px] border-2 border-[#eee] bg-white p-4 shadow-lg">
      <div className="flex w-full items-end justify-between leading-normal text-black">
        <span className="text-[14px] font-medium">{segmentName}</span>
        <span className="text-[12px] font-normal whitespace-nowrap">
          {studentCount} {studentCount === 1 ? "Student" : "Students"}
        </span>
      </div>
      <Link
        href={href}
        className="flex w-full shrink-0 items-center justify-center gap-[10px] rounded-[5px] bg-[#7f23ff] px-[10px] py-[5px] text-[10px] font-medium leading-normal text-white transition-opacity hover:opacity-90"
      >
        <Pointer className="size-[11px] shrink-0" aria-hidden />
        Click to View People
      </Link>
    </div>
  )
}

function CohortDiagnosisChart({ course, learners }: { course: CourseDoc; learners?: LearnerDoc[] }) {
  const router = useRouter()
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  const data = [
    { name: "High Mastery", value: course.diagnosisHighMastery, color: DIAGNOSIS_COLORS.highMastery },
    { name: "On Track", value: course.diagnosisOnTrack, color: DIAGNOSIS_COLORS.onTrack },
    { name: "At Risk", value: course.diagnosisAtRisk, color: DIAGNOSIS_COLORS.atRisk },
    { name: "Disengaged", value: course.diagnosisDisengaged, color: DIAGNOSIS_COLORS.disengaged },
  ]
  const pieData = [data[1], data[0], data[3], data[2]].filter(
    (entry): entry is (typeof data)[number] => Boolean(entry)
  )

  const hoveredData = useMemo(() => {
    if (!hoveredSegment) return null
    const entry = data.find((d) => d.name === hoveredSegment)
    const count = entry?.value ?? 0
    return {
      segmentName: hoveredSegment,
      studentCount: count,
    }
  }, [hoveredSegment, data])

  const handleSegmentClick = (segmentName: string) => {
    router.push(`/dashboard/cohort-diagnosis?segment=${encodeURIComponent(segmentName)}`)
  }

  return (
    <div className="flex h-[244px] flex-1 flex-col rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-medium text-black">Cohort Diagnosis</span>
        <MonthSelector />
      </div>
      <div className="flex flex-1 items-center justify-center overflow-x-auto">
        <div className="inline-flex items-center gap-[40px]">
          <div
            className="relative h-[162px] w-[161px] shrink-0"
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={72}
                  dataKey="value"
                  startAngle={235}
                  endAngle={-125}
                  paddingAngle={4}
                  cornerRadius={8}
                  stroke="#ffffff"
                  strokeWidth={4}
                  onClick={(_: unknown, index: number) =>
                    pieData[index]?.name && handleSegmentClick(pieData[index].name)
                  }
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      style={{ cursor: "pointer", outline: "none" }}
                      onMouseEnter={() => setHoveredSegment(entry.name)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {hoveredData && (
              <div
                className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2"
                onMouseEnter={() => setHoveredSegment(hoveredData.segmentName)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <DiagnosisHoverCard
                  segmentName={hoveredData.segmentName}
                  studentCount={hoveredData.studentCount}
                />
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-start justify-center gap-4">
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
    </div>
  )
}

function MasteryGauge({ course }: { course: CourseDoc }) {
  const score = course.masteryScore
  const breakdowns = [
    { label: "Application", score: course.applicationScore, max: course.applicationMax },
    { label: "Retrieval", score: course.retrievalScore, max: course.retrievalMax },
    { label: "Retention", score: course.retentionScore, max: course.retentionMax },
    { label: "Behaviour", score: course.behaviourScore, max: course.behaviourMax },
  ]

  const arcFraction = Math.min(1, Math.max(0, score / 100))
  const gaugeCircumference = 2 * Math.PI * MASTERY_GAUGE_RADIUS
  const gaugeSweepLength = gaugeCircumference * (MASTERY_GAUGE_SWEEP_ANGLE / 360)
  const gaugeProgressLength = gaugeSweepLength * arcFraction
  const tickAngles = Array.from(
    { length: MASTERY_GAUGE_TICK_COUNT },
    (_, index) =>
      MASTERY_GAUGE_START_ANGLE +
      (index * MASTERY_GAUGE_SWEEP_ANGLE) / (MASTERY_GAUGE_TICK_COUNT - 1)
  )

  return (
    <div className="flex h-[244px] flex-1 flex-col rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-medium text-black">Cohort Mastery Score</span>
        <MonthSelector />
      </div>
      <div className="flex flex-1 items-center justify-center overflow-x-auto">
        <div className="inline-flex items-center gap-[32px]">
          <div className="relative h-[166px] w-[168px] shrink-0">
            <svg className="h-full w-full" viewBox="0 0 168 166" fill="none">
              <circle
                cx="84"
                cy="83"
                r={MASTERY_GAUGE_RADIUS}
                stroke="#e4e4e4"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${gaugeSweepLength} ${gaugeCircumference}`}
                transform="rotate(150 84 83)"
              />
              <circle
                cx="84"
                cy="83"
                r={MASTERY_GAUGE_RADIUS}
                stroke="#9727fc"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${gaugeProgressLength} ${gaugeCircumference}`}
                transform="rotate(150 84 83)"
              />
              {tickAngles.map((angle, index) => {
                const start = getPolarPoint(84, 83, 49, angle)
                const end = getPolarPoint(84, 83, 56, angle)
                return (
                  <line
                    key={index}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#d3d3d3"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-center text-[30px] font-bold leading-none text-[#9727fc]">
                {score}
              </span>
              <span className="mt-[6px] text-[10px] leading-none text-[#888]">out of 100</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end justify-center gap-[10px]">
            {breakdowns.map((b) => (
              <div key={b.label} className="flex w-[192px] items-center justify-between text-xs leading-none">
                <span className="text-black">{b.label}</span>
                <span className="font-medium text-[#9727fc]">{b.score} / {b.max}</span>
              </div>
            ))}
            <div className="h-px w-[192px] bg-[#ccc]" />
            <div className="flex w-[48px] flex-col items-end">
              <span className="text-sm font-bold text-black">{score}</span>
              <span className="text-[10px] text-black">out of 100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MODULE_INSIGHTS_ROW_OPTIONS = [5, 10] as const

function CohortRiskPill({ riskBucket }: { riskBucket: string }) {
  const risk = riskBucket === "Low" ? "low" : riskBucket === "High" ? "high" : "moderate"
  const bg = risk === "low" ? "#e1f3de" : risk === "high" ? "#ffddd9" : "#ffebda"
  const text = risk === "low" ? "#259800" : risk === "high" ? "#d1001f" : "#cf5d00"
  const label = risk === "low" ? "Risk: Low" : risk === "high" ? "Risk: High" : "Risk: Moderate"
  return (
    <span
      className="inline-flex items-center rounded-full px-[10px] py-[5px] text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  )
}

function ModuleInsightsTable({ insights }: { insights: ModuleInsightList | undefined }) {
  const list = insights ?? []
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const totalPages = Math.max(1, Math.ceil(list.length / rowsPerPage))
  const pageRows = list.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = []
    for (let i = 1; i <= Math.min(5, totalPages); i++) pages.push(i)
    if (totalPages > 6) pages.push("...")
    if (totalPages > 5) pages.push(totalPages)
    return pages
  }, [totalPages])
  const isEmpty = list.length === 0

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="py-2">
        <span className="text-sm font-medium text-black">Module Insights</span>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-start rounded-[4px] bg-[#5b5b5b] py-[5px]">
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Course/Module</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Cohort Performance</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Average Score</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className="text-xs font-bold text-white">Insights</span>
          </div>
        </div>
        {isEmpty ? (
          <div className="flex h-[60px] w-full items-center justify-center rounded-[4px] bg-[#f9f9f9]">
            <span className="text-xs text-[#5b5b5b]">No module insights yet. Seed course data to populate.</span>
          </div>
        ) : (
          pageRows.map((row) => (
            <div key={row._id} className="flex h-[27px] w-full items-center rounded-[4px]">
              <div className="flex flex-1 items-center px-[10px]">
                <span className="truncate text-xs text-black">
                  {row.courseTitle}/ {row.moduleLabel}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <CohortRiskPill riskBucket={row.cohortRiskBucket} />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <span className="text-xs font-medium text-black">{Math.round(row.averageScore)}%</span>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <Link
                  href={`/dashboard/module-insight?courseId=${encodeURIComponent(row.courseId)}&moduleId=${encodeURIComponent(row.moduleId)}`}
                  className="text-xs font-medium text-[#9727fc] underline hover:no-underline"
                >
                  View Insights
                </Link>
              </div>
            </div>
          ))
        )}
        <div className="flex items-center gap-[156px]">
          <div className="flex items-center gap-[10px]">
            <span className="text-[10px] font-medium text-black">Show</span>
            <div className="relative flex h-[27px] items-center">
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="h-full min-w-[52px] cursor-pointer appearance-none rounded-[4px] border border-[#afafaf] bg-white pl-[10px] pr-7 text-[10px] font-medium text-black focus:outline-none focus:ring-1 focus:ring-[#afafaf]"
              >
                {MODULE_INSIGHTS_ROW_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1 h-4 w-4 text-black" aria-hidden />
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
                      p === page ? "font-bold text-[#9727fc]" : "font-medium text-[#5b5b5b]"
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

function AssessmentTable({ assessments }: { assessments: AssessmentList }) {
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
  if (!convexAvailable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto bg-background p-6">
        <p className="text-center text-sm text-muted-foreground">
          Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL to enable data.
        </p>
      </div>
    )
  }
  return <DashboardCoursesContentInner />
}

function DashboardCoursesContentInner() {
  const courses = useQuery(api.dashboardCourses.list)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const seedCourses = useMutation(api.seedCourses.seed)
  const [seeding, setSeeding] = useState(false)
  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedCourses()
    } finally {
      setSeeding(false)
    }
  }

  const cohortLearners = useQuery(api.users.listByCohort, { cohortId: INSTRUCTOR_COHORT_ID })

  const activeCourseId = selectedCourseId ?? courses?.[0]?.courseId ?? null
  const course = useQuery(
    api.dashboardCourses.getByCourseId,
    activeCourseId ? { courseId: activeCourseId } : "skip"
  )
  const assessments = useQuery(
    api.dashboardCourses.listAssessments,
    activeCourseId ? { courseId: activeCourseId } : "skip"
  )
  const moduleInsights = useQuery(
    api.dashboardCourses.listModuleInsights,
    activeCourseId ? { courseId: activeCourseId } : "skip"
  )

  if (!courses) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading courses…
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white p-6">
        <p className="text-sm text-muted-foreground">No courses found.</p>
        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {seeding ? "Seeding…" : "Seed course data"}
        </button>
      </div>
    )
  }

  if (!course || !assessments) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading course details…
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-[30px] font-bold leading-normal tracking-[0.6px] text-foreground">
              {course.title}
            </h1>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
            >
              {seeding ? "Seeding…" : "Seed course data"}
            </button>
          </div>
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

        <div className="flex flex-col gap-8">
          <h2 className="text-sm font-semibold tracking-[0.28px] text-black">
            Cohort Performance Insights
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <CohortDiagnosisChart course={course} learners={cohortLearners as LearnerDoc[] | undefined} />
              <MasteryGauge course={course} />
            </div>
            <ModuleInsightsTable insights={moduleInsights ?? undefined} />
            <AssessmentTable assessments={assessments} />
          </div>
        </div>
      </div>
    </div>
  )
}
