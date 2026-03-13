"use client"

import { useMemo, useRef, useState } from "react"
import { useQuery } from "convex/react"
import Link from "next/link"
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

const INSTRUCTOR_COHORT_ID = "cohort_ai_001"

export function DashboardForYouContent() {
  const convexAvailable = useConvexAvailable()
  const [month, setMonth] = useState("march_2026")
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

        <div className="mx-auto max-w-4xl px-8">
          <section className="mt-2">
            <h2 className="text-sm font-semibold text-foreground">Jump Back In</h2>
            <div className="relative mt-3">
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
              >
                <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-violet-500 to-purple-600 p-4">
                    <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Course
                    </span>
                    <span className="text-base font-semibold text-white">AI for Sales & Business Strategy</span>
                  </div>
                  <div className="flex h-28 w-56 flex-col justify-between p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Course
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-foreground">AI for Sales & Business Strategy</span>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">0%</span>
                        <div className="h-1.5 w-24 rounded-full bg-secondary">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: "0%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-violet-400 to-purple-500 p-4">
                    <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Course
                    </span>
                    <span className="text-base font-semibold text-white">Unify Taxes</span>
                  </div>
                  <div className="flex h-28 w-56 flex-col justify-between p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Course
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-foreground">Unify Taxes</span>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">0%</span>
                        <div className="h-1.5 w-24 rounded-full bg-secondary">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: "0%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-purple-300 to-violet-400 p-4 opacity-80">
                    <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Course
                    </span>
                    <span className="text-base font-semibold text-white">{"U..."}</span>
                  </div>
                </div>
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
