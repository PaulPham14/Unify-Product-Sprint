"use client"

import { useEffect, useMemo, useState } from "react"
import { useAction, useMutation, useQuery } from "convex/react"
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
import { MoreHorizontal, ExternalLink, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react"

const INSTRUCTOR_COHORT_ID = "cohort_ai_001"
type TrendKey = "Mastery" | "Application" | "Retrieval" | "Retention" | "Behaviour"
const ALL_TRENDS: TrendKey[] = ["Mastery", "Application", "Retrieval", "Retention", "Behaviour"]
type ProgressRange = "all" | "1m" | "1w" | "1d"

type ImpactLevel = "positive" | "moderate" | "negative"

function impactFromScore(score: number): ImpactLevel {
  if (score >= 75) return "positive"
  if (score >= 50) return "moderate"
  return "negative"
}

function impactBadgeStyle(impact: ImpactLevel): string {
  switch (impact) {
    case "positive":
      return "bg-[#e1f3de] text-[#259800]"
    case "moderate":
      return "bg-[#ffebda] text-[#cf5d00]"
    case "negative":
      return "bg-[#ffddd9] text-[#d1001f]"
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

function masteryPillStyle(aggregate: number): string {
  if (aggregate >= 80) return "bg-[#e1f3de] text-[#259800]"
  if (aggregate >= 50) return "bg-[#ffebda] text-[#cf5d00]"
  return "bg-[#ffddd9] text-[#d1001f]"
}

interface AtRiskAttentionItem {
  learnerId: unknown;
  learnerName: string;
  masteryScore: number;
  riskBucket: string;
  moduleLabel: string;
  quizScorePct: number | null;
  videoReplayCount: number | null;
  assignmentIncomplete: boolean;
  insights: string[];
}

function AtRiskAttentionCard({ data }: { data: AtRiskAttentionItem }) {
  const [expanded, setExpanded] = useState(true)
  const name = data.learnerName
  const moduleLabel = data.moduleLabel || "this module"

  return (
    <section className="rounded-[14px] border-2 border-[#d40e2b] bg-white p-4">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="flex flex-wrap items-center gap-3">
          <ShieldAlert className="h-6 w-6 shrink-0 text-[#d40e2b]" aria-hidden />
          <span className="text-sm font-medium text-[#d40e2b]">Attention</span>
          <span className="text-sm font-medium text-black">
            {name} may not understand the core concept from {moduleLabel}
          </span>
          <span className="text-xs text-[#5b5b5b]">
            Mastery {data.masteryScore}% · {data.riskBucket === "disengaged" ? "Disengaged" : "At risk"}
          </span>
        </div>
        <span className="shrink-0 text-black">
          {expanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
        </span>
      </button>
      {expanded && (
        <div className="mt-4 rounded-[14px] bg-[#fff3f3] p-3">
          <ul className="flex flex-col gap-2 text-sm font-medium text-black list-disc pl-5">
            {data.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export function LearnerInsightsContent({
  initialLearnerId = null,
}: {
  initialLearnerId?: string | null
}) {
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
  return <LearnerInsightsContentInner initialLearnerId={initialLearnerId} />
}

function LearnerInsightsContentInner({
  initialLearnerId,
}: {
  initialLearnerId?: string | null
}) {
  const [selectedLearnerId, setSelectedLearnerId] = useState<Id<"user"> | "">(
    initialLearnerId ? (initialLearnerId as Id<"user">) : ""
  )
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all")
  const [selectedTrends, setSelectedTrends] = useState<TrendKey[]>(["Mastery"])
  const [progressRange, setProgressRange] = useState<ProgressRange>("all")

  const cohortLearners = useQuery(api.users.listByCohort, {
    cohortId: INSTRUCTOR_COHORT_ID,
  })
  const courses = useQuery(api.dashboardCourses.list, {})
  const lowestPerformingAttention = useQuery(
    api.dashboardCourses.getLowestPerformingAttention,
    { cohortId: INSTRUCTOR_COHORT_ID, courseId: selectedCourseId === "all" ? undefined : selectedCourseId }
  )
  const selectedLearner = useQuery(
    api.users.get,
    selectedLearnerId ? { id: selectedLearnerId } : "skip"
  )
  const scoreHistory = useQuery(
    api.scoreHistory.listByUser,
    selectedLearner?.userId ? { userId: selectedLearner.userId } : "skip"
  )

  const learners = useMemo(() => {
    if (!cohortLearners) return []
    return cohortLearners.filter((u) => u.role === "learner")
  }, [cohortLearners])

  useEffect(() => {
    if (!initialLearnerId) return
    setSelectedLearnerId(initialLearnerId as Id<"user">)
  }, [initialLearnerId])

  const masteryProgressData = useMemo(() => {
    if (!scoreHistory?.length) return []
    const sorted = [...scoreHistory].sort((a, b) => a.calculatedAt - b.calculatedAt)
    const nowSec = Date.now() / 1000
    const cutoff =
      progressRange === "1d"
        ? nowSec - 24 * 3600
        : progressRange === "1w"
          ? nowSec - 7 * 24 * 3600
          : progressRange === "1m"
            ? nowSec - 30 * 24 * 3600
            : null
    const filtered = cutoff == null ? sorted : sorted.filter((s) => s.calculatedAt >= cutoff)

    return filtered.map((s, i) => ({
      week:
        progressRange === "all"
          ? `Week ${i + 1}`
          : format(new Date(s.calculatedAt * 1000), progressRange === "1d" ? "HH:mm" : "MMM d"),
      Mastery: Math.round(s.masteryScore),
      Application: Math.round(s.applicationScore),
      Retrieval: Math.round(s.comprehensionScore),
      Retention: Math.round(s.retentionScore),
      Behaviour: Math.round(s.behavioralScore),
    }))
  }, [scoreHistory, progressRange])

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
  const recalculateScores = useMutation(api.scores.recalculateScoresForUser)
  const reseedDashboardDemo = useAction(api.demoData.reseedLearningIntelligenceDashboard)
  const [recalculating, setRecalculating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const handleRecalculate = async () => {
    if (!selectedLearner?.userId) return
    setRecalculating(true)
    try {
      await recalculateScores({ userId: selectedLearner.userId })
    } finally {
      setRecalculating(false)
    }
  }
  const handleSeedDemoData = async () => {
    setSeeding(true)
    try {
      await reseedDashboardDemo({})
    } finally {
      setSeeding(false)
    }
  }

  const chartConfig = useMemo(
    () => ({
      Mastery: { label: "Mastery", color: "#9727fc" },
      Application: { label: "Application", color: "#00bcd4" },
      Retrieval: { label: "Retrieval", color: "#ff9800" },
      Retention: { label: "Retention", color: "#ef4444" },
      Behaviour: { label: "Behaviour", color: "#6b7280" },
    }),
    []
  )

  const toggleTrend = (trend: TrendKey) => {
    setSelectedTrends((prev) => {
      if (prev.includes(trend)) {
        // Keep at least one visible series.
        return prev.length === 1 ? prev : prev.filter((t) => t !== trend)
      }
      return [...prev, trend]
    })
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top: Course + Student dropdowns, then actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Course breakdown" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses?.map((c) => (
                <SelectItem key={c.courseId} value={c.courseId}>
                  {c.title}
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
                  {u.name || (u.userId ? `Student ID ${u.userId}` : "Unknown")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={handleSeedDemoData}
            disabled={seeding}
            className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            {seeding ? "Reseeding…" : "Reseed demo data"}
          </button>
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

        {!selectedLearnerId ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 text-center text-muted-foreground">
            <p className="text-sm">Select a learner to view insights.</p>
            <p className="text-xs">No metrics yet? Click &quot;Reseed demo data&quot; to populate task results and scores for all learners in this cohort.</p>
          </div>
        ) : (
          <>
            {/* Main title: Individual Performance Insights */}
            <h1 className="text-center text-xl font-bold text-foreground">
              Individual Performance Insights
            </h1>

            {/* Attention — only for the selected learner when they are at risk */}
            {lowestPerformingAttention?.filter((item) => item.learnerId === selectedLearnerId).length ? (
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-foreground">Attention</h2>
                {lowestPerformingAttention
                  .filter((item) => item.learnerId === selectedLearnerId)
                  .map((item) => (
                    <AtRiskAttentionCard key={String(item.learnerId)} data={item} />
                  ))}
              </section>
            ) : null}

            {/* Action To Take — at top */}
            <section>
              <h2 className="mb-3 text-sm font-medium text-foreground">Action To Take</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="relative min-h-[100px] rounded-lg border border-border bg-card p-4" />
                <div className="relative min-h-[100px] rounded-lg border border-border bg-card p-4 flex items-center justify-center">
                  <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
                  <a href="#" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label="Open">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <div className="relative min-h-[100px] rounded-lg border border-border bg-card p-4">
                  <a href="#" className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" aria-label="Open">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </section>

            {/* Mastery Score Progression — full-width chart on top */}
            <section className="rounded-[14px] border-2 border-[#eee] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] font-medium text-black">Lesson Progress</span>
                <Select value={progressRange} onValueChange={(v) => setProgressRange(v as ProgressRange)}>
                  <SelectTrigger className="h-auto gap-2 border-0 bg-transparent p-2 text-[14px] font-medium text-black shadow-none">
                    <SelectValue />
                    <ChevronDown className="h-5 w-5 shrink-0 text-black" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="1m">1 Month</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[12px] font-medium text-black">Trend filter:</span>
                {ALL_TRENDS.map((trend) => {
                  const active = selectedTrends.includes(trend)
                  return (
                    <button
                      key={trend}
                      type="button"
                      onClick={() => toggleTrend(trend)}
                      className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                        active ? "bg-black text-white" : "bg-[#eee] text-black hover:bg-[#e2e2e2]"
                      }`}
                    >
                      {trend}
                    </button>
                  )
                })}
              </div>
              <div className="h-[240px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={masteryProgressData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {selectedTrends.includes("Mastery") && (
                      <Line type="monotone" dataKey="Mastery" stroke="#9727fc" strokeWidth={2.5} dot={{ r: 3 }} />
                    )}
                    {selectedTrends.includes("Application") && (
                      <Line type="monotone" dataKey="Application" stroke="#00bcd4" strokeWidth={2} dot={{ r: 3 }} />
                    )}
                    {selectedTrends.includes("Retrieval") && (
                      <Line type="monotone" dataKey="Retrieval" stroke="#ff9800" strokeWidth={2} dot={{ r: 3 }} />
                    )}
                    {selectedTrends.includes("Retention") && (
                      <Line type="monotone" dataKey="Retention" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    )}
                    {selectedTrends.includes("Behaviour") && (
                      <Line type="monotone" dataKey="Behaviour" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} />
                    )}
                  </LineChart>
                </ChartContainer>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
                {selectedTrends.includes("Mastery") && (
                  <span className="flex items-center gap-1.5 text-[12px] text-black">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#9727fc]" />
                    Mastery
                  </span>
                )}
                {selectedTrends.includes("Application") && (
                  <span className="flex items-center gap-1.5 text-[12px] text-black">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#00bcd4]" />
                    Application
                  </span>
                )}
                {selectedTrends.includes("Retrieval") && (
                  <span className="flex items-center gap-1.5 text-[12px] text-black">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#ff9800]" />
                    Retrieval
                  </span>
                )}
                {selectedTrends.includes("Retention") && (
                  <span className="flex items-center gap-1.5 text-[12px] text-black">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#ef4444]" />
                    Retention
                  </span>
                )}
                {selectedTrends.includes("Behaviour") && (
                  <span className="flex items-center gap-1.5 text-[12px] text-black">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#6b7280]" />
                    Behaviour
                  </span>
                )}
              </div>
            </section>

            {/* Mastery Score — exact Figma layout */}
            <section className="flex flex-col items-center gap-4 rounded-[14px] border-2 border-[#eee] bg-white px-6 py-5">
              <div className="flex w-full items-center justify-between">
                <span className="text-[14px] font-medium text-black">Mastery Score</span>
              </div>

              {/* Gauge + breakdown + pills row */}
              <div className="flex w-full items-end justify-between">
                <div className="ml-12 flex items-center gap-10">
                  {/* Gauge */}
                  <div className="relative ml-2 h-[166px] w-[168px] shrink-0">
                    <svg className="h-full w-full" viewBox="0 0 168 166" fill="none">
                      <path
                        d="M 20 140 A 72 72 0 1 1 148 140"
                        stroke="#eee"
                        strokeWidth="14"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 20 140 A 72 72 0 1 1 148 140"
                        stroke="#9727fc"
                        strokeWidth="14"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${(displayMastery / 100) * 330} 330`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                      <span className="text-[30px] font-bold text-[#9727fc]">{Math.round(displayMastery)}</span>
                      <span className="text-[10px] text-black">out of 100</span>
                    </div>
                  </div>

                  {/* Breakdown column */}
                  <div className="flex w-[192px] flex-col items-end gap-2.5">
                    <div className="flex w-full items-center justify-between text-[12px]">
                      <span className="text-black">Application</span>
                      <span className="font-medium text-[#9727fc]">40%</span>
                    </div>
                    <div className="flex w-full items-center justify-between text-[12px]">
                      <span className="text-black">Retrieval</span>
                      <span className="font-medium text-[#9727fc]">30%</span>
                    </div>
                    <div className="flex w-full items-center justify-between text-[12px]">
                      <span className="text-black">Retention</span>
                      <span className="font-medium text-[#9727fc]">20%</span>
                    </div>
                    <div className="flex w-full items-center justify-between text-[12px]">
                      <span className="text-black">Behaviour</span>
                      <span className="font-medium text-[#9727fc]">10%</span>
                    </div>
                    <hr className="w-full border-[#eee]" />
                    <div className="flex w-[48px] flex-col items-end text-black">
                      <span className="text-[14px] font-bold">{Math.min(100, Math.max(0, Math.round(masteryScore)))}</span>
                      <span className="text-[10px]">out of 100</span>
                    </div>
                  </div>
                </div>

                {/* Mastery + confidence pills */}
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-2.5 py-[5px] text-[12px] font-medium ${masteryPillStyle(aggregateMastery)}`}>
                    {masteryLabel(aggregateMastery)}
                  </span>
                  <span className={`rounded-full px-2.5 py-[5px] text-[12px] font-medium ${masteryPillStyle(aggregateMastery)}`}>
                    Confidence: {confidenceLabel(aggregateMastery)}
                  </span>
                </div>
              </div>

              {/* Full-width separator */}
              <hr className="w-full border-[#eee]" />

              {/* 2x2 breakdown cards — row 1 */}
              <div className="flex w-full gap-4">
                <InsightCard
                  title="Retrieval Practice"
                  score={retrievalScore}
                  observations={[
                    retrievalScore ? `Quiz accuracy: ${Math.min(100, Math.round(retrievalScore * 0.95))}%` : "Quiz accuracy: —",
                    "Retry attempts: " + (retrievalScore < 60 ? "High" : retrievalScore < 80 ? "Moderate" : "Low"),
                    "Slow response time",
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
              </div>

              {/* 2x2 breakdown cards — row 2 */}
              <div className="flex w-full gap-4">
                <InsightCard
                  title="Retention"
                  score={retentionScore}
                  observations={[
                    retentionScore < 65 ? "Week 2 recall drop" : "Stable recall",
                    retentionScore < 60 ? "Reinforcement missing" : "Reinforcement on track",
                  ]}
                />
                <InsightCard
                  title="Learning Behaviour"
                  score={behaviourScore}
                  observations={[
                    "Video replays " + (behaviourScore >= 70 ? "high" : "moderate"),
                    "Discussion engagement " + (behaviourScore >= 65 ? "good" : "low"),
                  ]}
                />
              </div>
            </section>
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
    <div className="flex w-full flex-col gap-4 rounded-[14px] border-2 border-[#eee] bg-white p-4">
      <div className="flex w-full items-center justify-between">
        <span className="text-[14px] font-medium text-black">{title}</span>
      </div>
      <div className="flex w-full items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[30px] font-bold text-black">{displayScore}</span>
          <span className="text-[14px] text-black">out of 100</span>
        </div>
        <span className={`rounded-full px-2.5 py-[5px] text-[12px] font-medium ${impactBadgeStyle(impact)}`}>
          Impact: {impact === "positive" ? "Positive" : impact === "moderate" ? "Moderate" : "Negative"}
        </span>
      </div>
      {observations.map((obs, i) => (
        <div
          key={i}
          className="flex w-full items-center rounded-[14px] bg-[#eee] p-2.5"
        >
          <span className="text-[12px] font-medium text-black">{obs}</span>
        </div>
      ))}
    </div>
  )
}
