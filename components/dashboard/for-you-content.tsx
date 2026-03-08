"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { ChevronDown } from "lucide-react"
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

  const monthOptions = [
    { value: "march_2026", label: "March 2026" },
    { value: "february_2026", label: "February 2026" },
    { value: "january_2026", label: "January 2026" },
  ]

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {}
    if (!trend?.courses) return cfg
    for (const c of trend.courses) {
      cfg[c.moduleId] = { label: c.title, color: c.color }
    }
    return cfg
  }, [trend?.courses])

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
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <h2 className="text-[14px] font-semibold tracking-[0.28px] text-black">
          Course Performance Insights
        </h2>

        <section className="rounded-[14px] border-2 border-[#eee] bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[14px] font-medium text-black">Cohort Progress</span>
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
                    key={c.moduleId}
                    type="monotone"
                    dataKey={c.moduleId}
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
              <span key={c.moduleId} className="flex items-center gap-2 text-[10px] font-light text-black">
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
