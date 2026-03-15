"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { ChevronDown, ChevronRight, ChevronUp, ShieldAlert } from "lucide-react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { buildCohortDiagnosisHref } from "@/lib/cohort-diagnosis"

const INSTRUCTOR_COHORT_ID = "cohort_ai_001"

/** Attention items for the For You dashboard (design: Figma 309-4386). Can be wired to Convex later. */
const ATTENTION_ITEMS = [
  {
    id: "mastery",
    message: "may need more attention, average mastery score",
    value: "51%",
    segment: "At Risk" as const,
  },
  {
    id: "video-drop",
    message: "have high video drop rate of",
    value: "50%",
    segment: "At Risk" as const,
  },
  {
    id: "assessment",
    message: "high assessment incomplete rate of",
    value: "33%",
    segment: "At Risk" as const,
  },
] as const

export function DashboardForYouContent() {
  const convexAvailable = useConvexAvailable()
  const [month, setMonth] = useState("march_2026")
  const [attentionExpanded, setAttentionExpanded] = useState(true)
  const trend = useQuery(api.cohortMastery.getCourseProgressTrend, {
    cohortId: INSTRUCTOR_COHORT_ID,
  })
  const listWorstModuleInsightsQuery = (api.dashboardCourses as unknown as Record<string, unknown>)
    .listWorstModuleInsights as never
  const worstModuleInsights = useQuery(listWorstModuleInsightsQuery, { limit: 3 }) as
    | Array<{
        courseId: string
        moduleId: string
        moduleLabel: string
        courseTitle: string
        averageScore: number
        cohortRiskBucket: string
      }>
    | undefined
  const scrollRef = useRef<HTMLDivElement>(null)

  const monthOptions = [
    { value: "march_2026", label: "March 2026" },
    { value: "february_2026", label: "February 2026" },
    { value: "january_2026", label: "January 2026" },
  ]

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {}
    if (!trend?.courses) return cfg
    for (const c of trend.courses) {
      cfg[c.courseId] = { label: c.title, color: c.color }
    }
    return cfg
  }, [trend?.courses])

  const lastUpdatedLabel = useMemo(() => {
    const now = new Date()
    return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()
  }, [])

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  if (!convexAvailable) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL to enable data.
      </div>
    )
  }

  if (!trend) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading course performance…
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Same top section as Home -> For You */}
        <div className="px-8 pb-6 pt-10">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold text-foreground">Hi Kasey</h1>
          </div>
        </div>

        {/* Attention banner (Figma 309-4386) */}
        <div className="mx-auto max-w-4xl px-8">
          <section
            className="flex flex-col gap-4 rounded-[14px] border-2 border-[#d40e2b] bg-white p-4"
            data-node-id="309:4386"
          >
            <div className="flex w-full items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center text-[#d40e2b]">
                  <ShieldAlert className="h-6 w-6" aria-hidden />
                </div>
                <p className="text-sm font-medium text-[#d40e2b]">Attention</p>
                <p className="text-xs font-normal text-muted-foreground">last updated 1:29pm</p>
              </div>
              <button
                type="button"
                onClick={() => setAttentionExpanded((e) => !e)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-expanded={attentionExpanded}
                aria-label={attentionExpanded ? "Collapse attention" : "Expand attention"}
              >
                {attentionExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            {attentionExpanded && (
              <div className="w-full rounded-[14px] bg-[#fff3f3] p-2.5">
                <ul className="list-disc space-y-2.5 pl-5">
                  {ATTENTION_ITEMS.map((item, i) => {
                    const courseLabel = trend.courses[0]?.title ?? "AI Fundamentals"
                    const courseId = trend.courses[0]?.courseId ?? "course_ai_fundamentals"
                    const moduleNum = 5 - i
                    const insightsHref = buildCohortDiagnosisHref({
                      courseId,
                      segment: item.segment,
                    })
                    return (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <span className="flex-1 font-medium text-foreground">
                          {`${courseLabel} / Module ${moduleNum} ${item.message} `}
                          <span className="font-bold">{item.value}</span>
                        </span>
                        <Link
                          href={insightsHref}
                          className="shrink-0 text-xs font-normal text-[#7f23ff] underline"
                        >
                          View Insights
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>

        <div className="mx-auto max-w-4xl px-8">
          <section className="mt-2">
            <h2 className="text-sm font-semibold text-foreground">Jump Back In</h2>
            <div className="relative mt-3">
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
              >
                {trend.courses.length === 0 ? (
                  <div className="flex flex-shrink-0 items-center justify-center rounded-xl border border-border bg-card px-8 py-6 text-sm text-muted-foreground">
                    No courses yet
                  </div>
                ) : (
                  trend.courses.map((course, index) => {
                    const latestRow = trend.chartData[trend.chartData.length - 1]
                    const progress = (latestRow && typeof latestRow[course.courseId] === "number")
                      ? Number(latestRow[course.courseId])
                      : 0
                    const gradientClass =
                      index % 3 === 0
                        ? "from-[#4a8fff] to-[#025dfe]"
                        : index % 3 === 1
                          ? "from-[#79a8ff] to-[#2f76ff]"
                          : "from-[#b8d1ff] to-[#6ea3ff]"
                    return (
                      <div
                        key={course.courseId}
                        className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card"
                      >
                        <div
                          className={`flex h-28 w-44 flex-col justify-end bg-gradient-to-br p-4 ${gradientClass}`}
                          style={index === trend.courses.length - 1 && trend.courses.length > 2 ? { opacity: 0.8 } : undefined}
                        >
                          <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                            Course
                          </span>
                          <span className="truncate text-base font-semibold text-white" title={course.title}>
                            {course.title}
                          </span>
                        </div>
                        <div className="flex h-28 w-56 flex-col justify-between p-4">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                            Course
                          </span>
                          <div>
                            <span className="truncate block text-sm font-semibold text-foreground" title={course.title}>
                              {course.title}
                            </span>
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                              <div className="h-1.5 w-24 rounded-full bg-secondary">
                                <div
                                  className="h-1.5 rounded-full bg-primary"
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-[14px] border-2 border-[#d40e2b] bg-white p-4">
          <div className="rounded-[10px] bg-[#f2f2f2] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-[#d40e2b]" aria-hidden />
                <span className="text-sm font-medium text-[#d40e2b]">Attention</span>
                <span className="text-xs text-black">last updated {lastUpdatedLabel}</span>
              </div>
              <ChevronUp className="h-5 w-5 text-black" aria-hidden />
            </div>

            <div className="rounded-[14px] bg-[#fff3f3] p-3">
              <ul className="space-y-2">
                {(worstModuleInsights ?? []).map((row) => (
                  <li
                    key={`${row.courseId}:${row.moduleId}`}
                    className="flex items-start justify-between gap-3 text-sm text-black"
                  >
                    <span className="pl-1 leading-[1.4]">
                      <span className="mr-2 align-middle text-black">•</span>
                      {row.courseTitle}/ {row.moduleLabel} may need more attention, average mastery score{" "}
                      <span className="font-bold">{Math.round(row.averageScore)}%</span>
                    </span>
                    <Link
                      href={`/dashboard/module-insight?courseId=${encodeURIComponent(row.courseId)}&moduleId=${encodeURIComponent(row.moduleId)}`}
                      className="shrink-0 text-xs text-[#7f23ff] underline hover:no-underline"
                    >
                      View Insights
                    </Link>
                  </li>
                ))}
                {worstModuleInsights && worstModuleInsights.length === 0 ? (
                  <li className="text-sm text-[#5b5b5b]">No module insights available yet.</li>
                ) : null}
              </ul>
            </div>
          </div>
        </section>

        <h2 className="text-[14px] font-semibold tracking-[0.28px] text-black">
          Course Performance Insights
        </h2>

        <section className="rounded-[14px] border-2 border-[#eee] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-medium text-black">Course Progress</span>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-auto gap-2 border-0 bg-transparent p-2 text-[14px] font-medium text-black shadow-none">
                <SelectValue />
                <ChevronDown className="h-5 w-5 shrink-0 text-black" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-[240px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={trend.chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="8 8" stroke="#d6d6d6" />
                <XAxis dataKey="week" tick={{ fontSize: 14 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 14 }} tickFormatter={(v) => `${v}%`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {trend.courses.map((c) => (
                  <Line
                    key={c.courseId}
                    type="monotone"
                    dataKey={c.courseId}
                    stroke={c.color}
                    strokeWidth={2.4}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-6">
            {trend.courses.map((c) => (
              <span key={c.courseId} className="flex items-center gap-2 text-[10px] font-light text-black">
                <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: c.color }} />
                {c.title}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
