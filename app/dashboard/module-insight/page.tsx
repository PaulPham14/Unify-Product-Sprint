"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import { TablePagination } from "@/components/dashboard/table-pagination"
import { DashboardRouteShell } from "@/components/dashboard/dashboard-route-shell"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { buildDashboardHref } from "@/lib/dashboard-route-state"
import { ChevronDown, ChevronLeft, ExternalLink, Info } from "lucide-react"
import { ActionModal, type ActionModalVariant } from "@/components/assign-review-quiz-modal"
import {
  Area,
  AreaChart,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

const THRESHOLDS = [
  { x: 90, label: "High Mastery Average", color: "#3cc3df" },
  { x: 75, label: "On Track Average", color: "#ff8a9e" },
  { x: 60, label: "At Risk Average", color: "#025dfe" },
  { x: 50, label: "Disengaged Average", color: "#ffae4c" },
]

const STEP = 2
const POINTS = Array.from({ length: Math.floor(100 / STEP) + 1 }, (_, i) => i * STEP)
const CONCEPT_ENGAGEMENT_ROW_OPTIONS = [10, 20, 50] as const

type ConceptEngagementList = NonNullable<
  ReturnType<typeof useQuery<typeof api.dashboardCourses.listConceptEngagementByModule>>
>

function gaussianKDE(scores: number[], bandwidth: number) {
  const kernel = (u: number) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI)
  return (x: number) => {
    if (scores.length === 0) return 0
    let sum = 0
    for (const s of scores) sum += kernel((x - s) / bandwidth)
    return sum / (scores.length * bandwidth)
  }
}

function buildDistribution(scores: number[], total: number) {
  const n = scores.length
  if (n === 0) return POINTS.map((x) => ({ bin: x, count: 0, pct: 0 }))

  const std = Math.max(
    1,
    Math.sqrt(scores.reduce((s, v) => s + (v - scores.reduce((a, b) => a + b, 0) / n) ** 2, 0) / n),
  )
  const bandwidth = 1.06 * std * Math.pow(n, -0.2)
  const kde = gaussianKDE(scores, bandwidth)

  return POINTS.map((x) => {
    const density = kde(x)
    const count = Math.round(density * n * STEP * 100) / 100
    const pct = Math.round(density * STEP * 100 * 100) / 100
    return { bin: x, count, pct }
  })
}

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

function buildPageNumbers(totalPages: number) {
  const pages: Array<number | "..."> = []
  for (let i = 1; i <= Math.min(5, totalPages); i += 1) pages.push(i)
  if (totalPages > 6) pages.push("...")
  if (totalPages > 5) pages.push(totalPages)
  return pages
}

function ConceptEngagementConsumedCell({ value }: { value: number }) {
  const roundedValue = Math.round(value)
  const safeValue = Math.max(0, Math.min(100, roundedValue))
  const markerValue = Math.max(2, Math.min(98, safeValue))

  return (
    <div className="flex w-[180px] flex-col items-end gap-[3px]">
      <span className="w-full text-right text-[12px] leading-[15.671px] text-black">
        {safeValue}%
      </span>
      <div className="relative h-[8px] w-full rounded-[100px] bg-[#d9d9d9]">
        <div
          className="absolute left-0 top-0 h-[8px] rounded-[100px] bg-[#025dfe]"
          style={{ width: `${safeValue}%` }}
        />
        <div
          className="absolute top-1/2 h-[7.826px] w-[7.826px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.6px] border-[#d9d9d9] bg-[#025dfe]"
          style={{ left: `${markerValue}%` }}
        />
      </div>
    </div>
  )
}

function ConceptEngagementTable({
  rows,
}: {
  rows: ConceptEngagementList | undefined
}) {
  const list = rows ?? []
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    setPage(1)
  }, [rowsPerPage, list.length])

  const totalPages = Math.max(1, Math.ceil(list.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pageRows = useMemo(() => {
    const startIndex = (safePage - 1) * rowsPerPage
    return list.slice(startIndex, startIndex + rowsPerPage)
  }, [list, rowsPerPage, safePage])
  const pageNumbers = useMemo(() => buildPageNumbers(totalPages), [totalPages])

  return (
    <div className="rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="py-2">
        <span className="text-[14px] font-medium text-black">Concept Engagement</span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="overflow-x-auto">
          <div className="min-w-[908px]">
            <div className="grid grid-cols-[minmax(140px,1fr)_minmax(190px,1fr)_minmax(110px,1fr)_170px_minmax(220px,1fr)] items-start rounded-[4px] bg-[#5b5b5b] py-[5px]">
              <div className="flex items-center justify-center">
                <span className="text-[12px] font-bold leading-[1.5] text-white">Content</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[12px] font-bold leading-[1.5] text-white">Concept</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[12px] font-bold leading-[1.5] text-white">Viewed</span>
              </div>
              <div className="flex items-center justify-center gap-[5px]">
                <span className="text-[12px] font-bold leading-[1.5] text-white">Dropped</span>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-[12px] w-[12px] items-center justify-center text-white/90"
                      aria-label="What dropped means"
                    >
                      <Info className="h-[9.643px] w-[9.643px]" strokeWidth={2.2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={10}
                    className="w-[278px] rounded-[14px] border-2 border-[#eee] bg-white p-4 text-left text-[12px] font-normal leading-normal text-black shadow-none [&>svg]:bg-white [&>svg]:fill-white"
                  >
                    Percentage of learners who viewed and exited the page before consuming 40% of the content.
                  </TooltipContent>
                </UITooltip>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-center text-[12px] font-bold leading-[1.5] text-white">
                  Average Amount Consumed
                </span>
              </div>
            </div>

            {pageRows.length === 0 ? (
              <div className="flex h-[120px] items-center justify-center rounded-[8px] bg-[#f9f9f9]">
                <p className="text-xs text-[#5b5b5b]">No concept engagement data available for this module.</p>
              </div>
            ) : (
              pageRows.map((row) => (
                <div
                  key={row.analyticsId}
                  className="grid min-h-[27px] grid-cols-[minmax(140px,1fr)_minmax(190px,1fr)_minmax(110px,1fr)_170px_minmax(220px,1fr)] items-center"
                >
                  <div className="px-[10px] py-[7px]">
                    <span className="block truncate text-[12px] leading-[1.5] text-black">
                      {row.contentTitle}
                    </span>
                  </div>
                  <div className="px-[10px] py-[7px] text-center">
                    <span className="block truncate text-[12px] leading-[1.5] text-black">
                      {row.conceptTitle}
                    </span>
                  </div>
                  <div className="px-[10px] py-[7px] text-center">
                    <span className="block text-[12px] leading-[1.5] text-black">
                      {Math.round(row.viewedCount)} learners
                    </span>
                  </div>
                  <div className="px-[10px] py-[7px] text-center">
                    <span className="block text-[12px] leading-[1.5] text-black">
                      {Math.round(row.droppedPct)}%
                    </span>
                  </div>
                  <div className="flex justify-center px-[10px] py-[7px]">
                    <ConceptEngagementConsumedCell value={row.averageConsumedPct} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <TablePagination
          currentPage={safePage}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          onPageChange={setPage}
          leftSlot={
            <div className="flex items-center gap-[10px]">
              <span className="text-[10px] font-medium text-black">Show</span>
              <div className="relative flex h-[27px] items-center">
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className="h-full min-w-[60px] cursor-pointer appearance-none rounded-[4px] border border-[#afafaf] bg-white pl-[10px] pr-7 text-[10px] font-medium text-black focus:outline-none focus:ring-1 focus:ring-[#afafaf]"
                >
                  {CONCEPT_ENGAGEMENT_ROW_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 h-4 w-4 text-black" aria-hidden />
              </div>
              <span className="text-[10px] font-medium text-black">Row</span>
            </div>
          }
        />
      </div>
    </div>
  )
}

const RECOMMENDED_ACTIONS_PLACEHOLDER = [
  { title: "Retrieval Practice", action: "Assign review quiz" },
  { title: "Retention", action: "Send concept walkthrough" },
  { title: "Retrieval Practice", action: "Schedule office hours" },
]

function ModuleInsightContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const courseId = searchParams.get("courseId") ?? ""
  const moduleId = searchParams.get("moduleId") ?? ""
  const convexAvailable = useConvexAvailable()

  const modulesList = useQuery(
    api.modules.listByCourse,
    courseId ? { courseId } : "skip"
  )
  const insight = useQuery(
    api.dashboardCourses.getModuleInsight,
    courseId && moduleId ? { courseId, moduleId } : "skip"
  )
  const conceptSeries = useQuery(
    api.dashboardCourses.listConceptMasteryByModule,
    moduleId ? { moduleId } : "skip"
  )
  const conceptEngagement = useQuery(
    api.dashboardCourses.listConceptEngagementByModule,
    courseId && moduleId ? { courseId, moduleId } : "skip"
  )
  const cohortLearners = useQuery(api.users.listByCohort, { cohortId: "cohort_ai_001" })
  const coursesForModal = useQuery(api.dashboardCourses.list, {})
  const [activeModal, setActiveModal] = useState<ActionModalVariant | null>(null)

  const modalLearners = useMemo(() => {
    if (!cohortLearners) return []
    return cohortLearners
      .filter((u) => u.role === "learner")
      .map((l) => ({ _id: l._id, name: l.name, masteryScore: l.masteryScore, riskBucket: l.riskBucket }))
  }, [cohortLearners])

  const [selectedConceptId, setSelectedConceptId] = useState("")
  useEffect(() => {
    if (!conceptSeries || conceptSeries.length === 0) {
      setSelectedConceptId("")
      return
    }
    if (!selectedConceptId || !conceptSeries.some((c) => c.conceptId === selectedConceptId)) {
      setSelectedConceptId(conceptSeries[0].conceptId)
    }
  }, [conceptSeries, selectedConceptId])

  const selectedConcept = useMemo(() => {
    if (!conceptSeries || conceptSeries.length === 0) return null
    return conceptSeries.find((c) => c.conceptId === selectedConceptId) ?? conceptSeries[0]
  }, [conceptSeries, selectedConceptId])

  const [yAxisMode, setYAxisMode] = useState<"count" | "pct">("count")

  const totalStudents = useMemo(
    () => selectedConcept?.points.length ?? 0,
    [selectedConcept],
  )

  const chartData = useMemo(() => {
    if (!selectedConcept) return []
    const scores = selectedConcept.points.map((p) => p.masteryScore)
    return buildDistribution(scores, totalStudents)
  }, [selectedConcept, totalStudents])

  const maxCount = useMemo(() => Math.max(1, ...chartData.map((d) => d.count)), [chartData])

  const sortedModules = useMemo(
    () => (modulesList ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [modulesList],
  )

  const handleModuleChange = (newModuleId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("moduleId", newModuleId)
    router.replace(`/dashboard/module-insight?${params.toString()}`)
  }

  const backHref = buildDashboardHref({ page: "dashboard", dashboardSubPage: "courses" })

  if (!convexAvailable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Convex is not configured.</p>
        <Link href={backHref} className="text-sm font-medium text-[#025dfe] underline hover:no-underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!courseId || !moduleId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Missing course or module. Open this page from View Insights on the Courses page.</p>
        <Link href={backHref} className="text-sm font-medium text-[#025dfe] underline hover:no-underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (insight === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Loading…</p>
      </div>
    )
  }

  if (insight === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Module insight not found.</p>
        <Link href={backHref} className="text-sm font-medium text-[#025dfe] underline hover:no-underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const masteryPct = Math.round(insight.averageScore)

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-[#5b5b5b] hover:text-black"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-[24px] font-bold tracking-tight text-black">
                {insight.courseTitle}
              </h1>
              <div className="relative flex h-[36px] items-center">
                <select
                  value={moduleId}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  className="h-full min-w-[220px] cursor-pointer appearance-none rounded-[10px] border border-[#eee] bg-white pl-3 pr-9 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#025dfe]/30"
                >
                  {sortedModules.map((mod) => (
                    <option key={mod.moduleId} value={mod.moduleId}>
                      {mod.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-black" />
              </div>
            </div>
          </header>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-black">Recommended Actions To Take</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {RECOMMENDED_ACTIONS_PLACEHOLDER.map((item, i) => {
                const variant: ActionModalVariant | null =
                  item.action === "Assign review quiz" ? "review_quiz"
                  : item.action === "Send concept walkthrough" ? "concept_walkthrough"
                  : item.action === "Schedule office hours" ? "office_hours"
                  : null
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={variant ? () => setActiveModal(variant) : undefined}
                    className="relative rounded-[14px] border border-[#eee] bg-[#f9f9f9] p-5 text-left transition-shadow hover:shadow-md"
                  >
                    <span className="absolute right-3 top-3 text-[#5b5b5b]">
                      <ExternalLink className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold text-black">{item.title}</p>
                    <span className="mt-2 block text-xs font-medium text-[#025dfe] underline hover:no-underline">
                      {item.action}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-[0.28px] text-black">
              Module insights
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[14px] border-2 border-[#eee] bg-white p-5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#5b5b5b]">
                  Cohort performance
                </p>
                <div className="mt-2">
                  <CohortRiskPill riskBucket={insight.cohortRiskBucket} />
                </div>
              </div>
              <div className="rounded-[14px] border-2 border-[#eee] bg-white p-5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#5b5b5b]">
                  Module mastery score
                </p>
                <p className="mt-2 text-[30px] font-bold leading-none text-[#025dfe]">
                  {masteryPct}%
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-black">Module Performance Insights</h2>
            <div className="rounded-[14px] border-2 border-[#eee] bg-white p-6">
              <div className="mb-1">
                <span className="text-sm font-semibold text-black">Concept Insights</span>
              </div>

              <div className="mb-4 flex items-center gap-4">
                <div className="relative flex h-[32px] items-center">
                  <select
                    value={selectedConcept?.conceptId ?? ""}
                    onChange={(e) => setSelectedConceptId(e.target.value)}
                    className="h-full min-w-[220px] cursor-pointer appearance-none rounded-full border border-[#ddd] bg-white pl-3 pr-8 text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-[#ccc]"
                  >
                    {(conceptSeries ?? []).map((concept) => (
                      <option key={concept.conceptId} value={concept.conceptId}>
                        {concept.conceptTitle}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-black" />
                </div>

                <div className="flex h-[28px] overflow-hidden rounded-full border border-[#ddd]">
                  <button
                    onClick={() => setYAxisMode("count")}
                    className={`px-3 text-[10px] font-medium transition-colors ${yAxisMode === "count" ? "bg-[#025dfe] text-white" : "bg-white text-black hover:bg-gray-50"}`}
                  >
                    # of Students
                  </button>
                  <button
                    onClick={() => setYAxisMode("pct")}
                    className={`px-3 text-[10px] font-medium transition-colors ${yAxisMode === "pct" ? "bg-[#025dfe] text-white" : "bg-white text-black hover:bg-gray-50"}`}
                  >
                    % of Students
                  </button>
                </div>
              </div>

              {selectedConcept && chartData.length > 0 ? (
                <div className="flex gap-4">
                  <div className="h-[380px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 32 }}>
                        <defs>
                          <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#025dfe" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#025dfe" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="bin"
                          type="number"
                          domain={[0, 100]}
                          ticks={Array.from({ length: 26 }, (_, i) => i * 4)}
                          tick={{ fontSize: 9, fill: "#5b5b5b" }}
                          tickLine={false}
                          axisLine={{ stroke: "#ddd" }}
                        >
                          <Label
                            value="Mastery Score (%)"
                            position="insideBottom"
                            offset={-20}
                            style={{ fontSize: 11, fill: "#5b5b5b", fontWeight: 500 }}
                          />
                        </XAxis>
                        <YAxis
                          domain={yAxisMode === "count" ? [0, "auto"] : [0, "auto"]}
                          dataKey={yAxisMode === "count" ? "count" : "pct"}
                          allowDecimals={yAxisMode === "pct"}
                          tick={{ fontSize: 9, fill: "#5b5b5b" }}
                          tickFormatter={yAxisMode === "pct" ? (v) => `${v}%` : undefined}
                          tickLine={false}
                          axisLine={{ stroke: "#ddd" }}
                        >
                          <Label
                            value={yAxisMode === "count" ? "Number of Students" : "% of Students"}
                            angle={-90}
                            position="insideLeft"
                            offset={10}
                            style={{ fontSize: 11, fill: "#5b5b5b", fontWeight: 500 }}
                          />
                        </YAxis>
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 11 }}
                          labelFormatter={(value: string | number) => `${value}%`}
                          formatter={(value: number) =>
                            yAxisMode === "count"
                              ? [`${value}`, "Students"]
                              : [`${value}%`, "% of cohort"]
                          }
                        />

                        {THRESHOLDS.map((t) => (
                          <ReferenceLine key={t.x} x={t.x} stroke={t.color} strokeDasharray="5 4" strokeWidth={1.5} />
                        ))}

                        <Area
                          type="monotone"
                          dataKey={yAxisMode === "count" ? "count" : "pct"}
                          stroke="#025dfe"
                          strokeWidth={2.5}
                          fill="url(#bellGrad)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#025dfe" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col justify-center gap-3 pl-2 pr-2">
                    {THRESHOLDS.map((t) => (
                      <div key={t.x} className="flex items-center gap-2">
                        <span className="inline-block h-[10px] w-[10px] shrink-0 rounded-sm" style={{ backgroundColor: t.color }} />
                        <span className="whitespace-nowrap text-[11px] text-black">{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-[220px] items-center justify-center rounded-[8px] bg-[#f9f9f9]">
                  <p className="text-xs text-[#5b5b5b]">No concept-level data available for this module.</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <ConceptEngagementTable rows={conceptEngagement ?? undefined} />
          </section>
        </div>
      </div>

      {activeModal && (
        <ActionModal
          open
          variant={activeModal}
          onClose={() => setActiveModal(null)}
          learners={modalLearners}
          courses={coursesForModal ?? undefined}
          modules={sortedModules.map((m) => ({
            moduleId: m.moduleId,
            title: m.title,
            courseId: m.courseId,
          }))}
          defaultCourseId={courseId}
          defaultModuleId={moduleId}
        />
      )}
    </div>
  )
}

export default function ModuleInsightPage() {
  return (
    <DashboardRouteShell dashboardSubPage="courses">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center bg-white p-6">
            <p className="text-sm text-[#5b5b5b]">Loading…</p>
          </div>
        }
      >
        <ModuleInsightContent />
      </Suspense>
    </DashboardRouteShell>
  )
}
