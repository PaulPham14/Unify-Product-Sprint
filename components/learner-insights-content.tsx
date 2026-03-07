"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { format } from "date-fns"

const INSTRUCTOR_COHORT_ID = "cohort_ai_001"

type ImpactLevel = "positive" | "moderate" | "negative"

function impactFromScore(score: number): ImpactLevel {
  if (score >= 75) return "positive"
  if (score >= 50) return "moderate"
  return "negative"
}

function impactClass(impact: ImpactLevel): string {
  switch (impact) {
    case "positive":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "moderate":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    case "negative":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  }
}

function masteryLabel(aggregate: number): string {
  if (aggregate >= 80) return "Strong Mastery"
  if (aggregate >= 60) return "Moderate Mastery"
  return "Developing Mastery"
}

function confidenceLabel(aggregate: number): string {
  if (aggregate >= 80) return "High"
  if (aggregate >= 50) return "Medium"
  return "Low"
}

function riskBucketLabel(bucket: string): string {
  switch (bucket) {
    case "high_mastery": return "High Mastery"
    case "on_track": return "On Track"
    case "at_risk": return "At Risk"
    case "disengaged": return "Disengaged"
    default: return ""
  }
}

function riskBucketClass(bucket: string): string {
  switch (bucket) {
    case "high_mastery": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "on_track": return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400"
    case "at_risk": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
    case "disengaged": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default: return "bg-muted text-muted-foreground"
  }
}

export function LearnerInsightsContent() {
  const convexAvailable = useConvexAvailable()
  if (!convexAvailable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto bg-background p-6">
        <p className="text-center text-sm text-muted-foreground">
          Connect your Convex backend to view learner insights.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Add <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_CONVEX_URL</code> to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code> and run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">npx convex dev</code>.
        </p>
      </div>
    )
  }
  return <LearnerInsightsContentInner />
}

function LearnerInsightsContentInner() {
  const [selectedLearnerId, setSelectedLearnerId] = useState<Id<"user"> | "">("")
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all")
  const [chartMonth, setChartMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })

  const cohortLearners = useQuery(api.users.listByCohort, {
    cohortId: INSTRUCTOR_COHORT_ID,
  })
  const modules = useQuery(api.modules.listByCohort, {
    cohortId: INSTRUCTOR_COHORT_ID,
  })
  const selectedLearner = useQuery(
    api.users.get,
    selectedLearnerId ? { id: selectedLearnerId } : "skip"
  )
  const taskResults = useQuery(
    api.taskResults.listByUser,
    selectedLearner?.userId ? { userId: selectedLearner.userId } : "skip"
  )

  const learners = useMemo(() => {
    if (!cohortLearners) return []
    return cohortLearners.filter((u) => u.role === "learner")
  }, [cohortLearners])

  const lessonProgressData = useMemo(() => {
    if (!taskResults?.length || !selectedLearner?.userId) return []
    const [year, month] = chartMonth.split("-").map(Number)
    const start = new Date(year, month - 1, 1).getTime() / 1000
    const end = new Date(year, month, 0, 23, 59, 59).getTime() / 1000
    const filtered = taskResults.filter(
      (r) => r.completedAt >= start && r.completedAt <= end && (selectedModuleId === "all" || r.moduleId === selectedModuleId)
    )
    const weekStarts: Record<number, { quizzes: number[]; assignments: number[] }> = {}
    for (let w = 0; w < 4; w++) {
      const t = start + w * 7 * 24 * 3600
      weekStarts[t] = { quizzes: [], assignments: [] }
    }
    const sortedStarts = Object.keys(weekStarts)
      .map(Number)
      .sort((a, b) => a - b)
    for (const r of filtered) {
      const weekStart = sortedStarts.find((s) => r.completedAt >= s && r.completedAt < s + 7 * 24 * 3600) ?? sortedStarts[0]
      if (!weekStarts[weekStart]) continue
      const pct = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0
      const type = (r.taskType ?? "").toLowerCase()
      if (type.includes("quiz")) weekStarts[weekStart].quizzes.push(pct)
      else weekStarts[weekStart].assignments.push(pct)
    }
    return sortedStarts.map((start, i) => {
      const q = weekStarts[start]?.quizzes ?? []
      const a = weekStarts[start]?.assignments ?? []
      return {
        week: `Week ${i + 1}`,
        Quizzes: q.length ? Math.round(q.reduce((s, x) => s + x, 0) / q.length) : 0,
        Assignments: a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0,
      }
    })
  }, [taskResults, selectedLearner?.userId, chartMonth, selectedModuleId])

  const applicationScore = selectedLearner?.applicationScore ?? 0
  const retrievalScore = selectedLearner?.comprehensionScore ?? 0
  const retentionScore = selectedLearner?.retentionScore ?? 0
  const behaviourScore = selectedLearner?.behavioralScore ?? 0
  const storedMastery = selectedLearner?.masteryScore
  const aggregateMastery = useMemo(() => {
    if (storedMastery != null) return storedMastery
    const weights = [0.4, 0.3, 0.2, 0.1]
    const values = [applicationScore, retrievalScore, retentionScore, behaviourScore]
    return values.reduce((acc, v, i) => acc + (v ?? 0) * (weights[i] ?? 0), 0)
  }, [storedMastery, applicationScore, retrievalScore, retentionScore, behaviourScore])
  const displayMastery = Math.min(100, Math.max(0, Math.round(aggregateMastery * 100) / 100))
  const masteryScore = storedMastery != null ? storedMastery : Math.round(aggregateMastery * 100) / 100
  const riskBucket = selectedLearner?.riskBucket ?? selectedLearner?.riskLevel ?? ""
  const recalculateScores = useMutation(api.scores.recalculateScoresForUser)
  const [recalculating, setRecalculating] = useState(false)
  const handleRecalculate = async () => {
    if (!selectedLearner?.userId) return
    setRecalculating(true)
    try {
      await recalculateScores({ userId: selectedLearner.userId })
    } finally {
      setRecalculating(false)
    }
  }

  const chartConfig = useMemo(
    () => ({
      Quizzes: { label: "Quizzes", color: "var(--chart-1)" },
      Assignments: { label: "Assignments", color: "var(--chart-2)" },
    }),
    []
  )

  const monthOptions = useMemo(() => {
    const out: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      out.push({
        value: format(d, "yyyy-MM"),
        label: format(d, "MMMM yyyy"),
      })
    }
    return out
  }, [])

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-foreground">Learner Insights</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Course / Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules?.map((m) => (
                  <SelectItem key={m.moduleId} value={m.moduleId}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedLearnerId || "none"}
              onValueChange={(v) => setSelectedLearnerId(v === "none" ? "" : (v as Id<"user">))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select learner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select learner</SelectItem>
                {learners.map((u) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name || u.userId || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLearnerId && selectedLearner?.userId && (
              <button
                type="button"
                onClick={handleRecalculate}
                disabled={recalculating}
                className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
              >
                {recalculating ? "Recalculating…" : "Recalculate scores"}
              </button>
            )}
          </div>
        </div>

        {!selectedLearnerId ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground">
            Select a learner to view insights.
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-4 text-sm font-medium text-foreground">
                Individual Performance Insights
              </h2>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Lesson Progress</span>
                    <Select value={chartMonth} onValueChange={setChartMonth}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
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
                      <LineChart data={lessonProgressData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="Quizzes" stroke="var(--color-Quizzes)" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Assignments" stroke="var(--color-Assignments)" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex justify-end">
                    <Select value={chartMonth} onValueChange={setChartMonth}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
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
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-28 w-28">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted stroke-[2.5]"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray="100"
                          d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                        />
                        <path
                          className="text-primary stroke-[2.5]"
                          fill="none"
                          strokeDasharray={`${displayMastery} 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-foreground">{Math.round(displayMastery)}</span>
                        <span className="text-xs text-muted-foreground">out of 100</span>
                      </div>
                    </div>
                    <div className="w-full space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Application</span>
                        <span className="font-medium">{Math.round(applicationScore)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retrieval</span>
                        <span className="font-medium">{Math.round(retrievalScore)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retention</span>
                        <span className="font-medium">{Math.round(retentionScore)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Behaviour</span>
                        <span className="font-medium">{Math.round(behaviourScore)}%</span>
                      </div>
                    </div>
                    <div className="w-full border-t border-border pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Aggregate</span>
                        <span className="font-semibold">{Math.min(100, Math.max(0, masteryScore))} out of 100</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${impactClass(impactFromScore(aggregateMastery))}`}>
                        {masteryLabel(aggregateMastery)}
                      </span>
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${riskBucketClass(riskBucket)}`}>
                        {riskBucketLabel(riskBucket) || `Confidence: ${confidenceLabel(aggregateMastery)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InsightCard
                title="Retrieval Practice"
                score={retrievalScore}
                observations={[
                  "Quiz accuracy: " + (retrievalScore ? `${Math.min(100, Math.round(retrievalScore * 0.95))}%` : "—"),
                  "Retry attempts: " + (retrievalScore < 60 ? "High" : retrievalScore < 80 ? "Moderate" : "Low"),
                  "Response time: " + (retrievalScore < 50 ? "Slow" : "Normal"),
                ]}
              />
              <InsightCard
                title="Applied Tasks"
                score={applicationScore}
                observations={[
                  "Project rubric: " + (applicationScore >= 75 ? "strong" : applicationScore >= 50 ? "adequate" : "needs work"),
                  "Assignment performance: " + (applicationScore >= 70 ? "consistent" : "variable"),
                ]}
              />
              <InsightCard
                title="Retention"
                score={retentionScore}
                observations={[
                  retentionScore < 65 ? "Week-over-week recall drop" : "Stable recall",
                  retentionScore < 60 ? "Reinforcement missing" : "Reinforcement on track",
                ]}
              />
              <InsightCard
                title="Learning Behaviour"
                score={behaviourScore}
                observations={[
                  "Video replays: " + (behaviourScore >= 70 ? "high" : "moderate"),
                  "Discussion engagement: " + (behaviourScore >= 65 ? "good" : "low"),
                ]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InsightCard({
  title,
  score,
  observations,
}: {
  title: string
  score: number
  observations: string[]
}) {
  const impact = impactFromScore(score)
  const displayScore = Math.min(100, Math.max(0, Math.round(score)))

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${impactClass(impact)}`}>
          Impact: {impact === "positive" ? "Positive" : impact === "moderate" ? "Moderate" : "Negative"}
        </span>
      </div>
      <p className="mb-3 text-2xl font-semibold text-foreground">
        {displayScore} <span className="text-sm font-normal text-muted-foreground">out of 100</span>
      </p>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {observations.map((obs, i) => (
          <li key={i}>{obs}</li>
        ))}
      </ul>
    </div>
  )
}
