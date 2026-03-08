"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import { DashboardRouteShell } from "@/components/dashboard/dashboard-route-shell"
import { buildDashboardHref } from "@/lib/dashboard-route-state"
import { ChevronDown, ChevronLeft, ExternalLink } from "lucide-react"
import {
  Area,
  AreaChart,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const THRESHOLDS = [
  { x: 90, label: "High Mastery Average", color: "#3cc3df" },
  { x: 75, label: "On Track Average", color: "#ff8a9e" },
  { x: 60, label: "At Risk Average", color: "#9727fc" },
  { x: 50, label: "Disengaged Average", color: "#ffae4c" },
]

const STEP = 2
const POINTS = Array.from({ length: Math.floor(100 / STEP) + 1 }, (_, i) => i * STEP)

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
  const moduleDoc = useQuery(
    api.modules.getByModuleId,
    moduleId ? { moduleId } : "skip"
  )
  const conceptSeries = useQuery(
    api.dashboardCourses.listConceptMasteryByModule,
    moduleId ? { moduleId } : "skip"
  )

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
        <Link href={backHref} className="text-sm font-medium text-[#9727fc] underline hover:no-underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!courseId || !moduleId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6">
        <p className="text-sm text-[#5b5b5b]">Missing course or module. Open this page from View Insights on the Courses page.</p>
        <Link href={backHref} className="text-sm font-medium text-[#9727fc] underline hover:no-underline">
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
        <Link href={backHref} className="text-sm font-medium text-[#9727fc] underline hover:no-underline">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const masteryPct = Math.round(insight.averageScore)

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
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
                  className="h-full min-w-[220px] cursor-pointer appearance-none rounded-[10px] border border-[#eee] bg-white pl-3 pr-9 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#9727fc]/30"
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
              {RECOMMENDED_ACTIONS_PLACEHOLDER.map((item, i) => (
                <div
                  key={i}
                  className="relative rounded-[14px] border border-[#eee] bg-[#f9f9f9] p-5"
                >
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-[#5b5b5b] hover:text-black"
                    aria-label="Open action"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-semibold text-black">{item.title}</p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-[#9727fc] underline hover:no-underline"
                  >
                    {item.action}
                  </button>
                </div>
              ))}
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
                <p className="mt-2 text-[30px] font-bold leading-none text-[#9727fc]">
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
                    className={`px-3 text-[10px] font-medium transition-colors ${yAxisMode === "count" ? "bg-[#9727fc] text-white" : "bg-white text-black hover:bg-gray-50"}`}
                  >
                    # of Students
                  </button>
                  <button
                    onClick={() => setYAxisMode("pct")}
                    className={`px-3 text-[10px] font-medium transition-colors ${yAxisMode === "pct" ? "bg-[#9727fc] text-white" : "bg-white text-black hover:bg-gray-50"}`}
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
                            <stop offset="0%" stopColor="#9727fc" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#9727fc" stopOpacity={0.02} />
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
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: "1px solid #eee", fontSize: 11 }}
                          labelFormatter={(v) => `${v}%`}
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
                          stroke="#9727fc"
                          strokeWidth={2.5}
                          fill="url(#bellGrad)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#9727fc" }}
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

          {moduleDoc?.description && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold tracking-[0.28px] text-black">
                About this module
              </h2>
              <div className="rounded-[14px] border-2 border-[#eee] bg-white p-5">
                <p className="text-sm text-[#5b5b5b]">{moduleDoc.description}</p>
              </div>
            </section>
          )}
        </div>
      </div>
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
