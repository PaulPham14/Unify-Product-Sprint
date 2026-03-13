"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
import { buildDashboardHref } from "@/lib/dashboard-route-state"
import { X } from "lucide-react"
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

type RubricItem = {
  criterion: string
  description: string
  weightPct: number
}

const DEFAULT_RUBRIC: RubricItem[] = [
  {
    criterion: "Problem Identification",
    description:
      "The team presents the link between pain points and product features clearly.",
    weightPct: 25,
  },
  {
    criterion: "Strategic Thinking & Differentiation",
    description:
      "The team explains defensible strategy and why the solution is needed now.",
    weightPct: 20,
  },
  {
    criterion: "Technical Feasibility",
    description:
      "The team demonstrates technical awareness and tradeoff understanding.",
    weightPct: 15,
  },
  {
    criterion: "Business Viability & Impact",
    description: "Unit economics and measurable impact plans are articulated.",
    weightPct: 20,
  },
  {
    criterion: "Communication",
    description: "Data-driven storytelling and response quality are strong.",
    weightPct: 20,
  },
]

function StatusPill({ status }: { status: string }) {
  const notStarted = status === "not_started"
  const inProgress = status === "in_progress"
  const label = notStarted ? "Not started" : inProgress ? "In Progress" : "Done"
  const style = notStarted
    ? "bg-[#f0f0f0] text-[#5b5b5b]"
    : inProgress
      ? "bg-[#eaf2ff] text-[#025dfe]"
      : "bg-[#e1f3de] text-[#259800]"
  const dotStyle = notStarted ? "bg-[#5b5b5b]" : inProgress ? "bg-[#025dfe]" : "bg-[#259800]"
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotStyle}`} aria-hidden />
      {label}
    </span>
  )
}

type AssessmentDetailProps = {
  assessmentCourseId?: string | null
  assessmentId?: string | null
  assessmentOrder?: string | null
  assessmentType?: string | null
}

export function DashboardAssessmentsContent({
  assessmentCourseId,
  assessmentId,
  assessmentOrder,
  assessmentType: assessmentTypeParam,
}: AssessmentDetailProps = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const convexAvailable = useConvexAvailable()
  const courses = useQuery(api.dashboardCourses.list, {})
  const reseedDashboardDemo = useAction(api.demoData.reseedLearningIntelligenceDashboard)
  const backfillTimeSpent = useAction(api.demoData.backfillTimeSpentForAssessments)
  const seedDemoDataIfEmpty = useAction(api.demoData.seedDemoDataIfEmpty)
  const createAssessment = useMutation(api.dashboardCourses.createAssessment)
  const setScoreReleaseStatus = useMutation(api.dashboardCourses.setScoreReleaseStatus)
  const hasTriedAutoSeed = useRef(false)
  const [loadTimeout, setLoadTimeout] = useState(false)

  const assessmentCourseIdFromUrl = searchParams.get("assessmentCourseId") ?? assessmentCourseId ?? null
  const assessmentIdRaw = searchParams.get("assessmentId") ?? assessmentId ?? null
  const assessmentOrderRaw = searchParams.get("assessmentOrder") ?? assessmentOrder ?? null
  const assessmentTypeRaw = searchParams.get("assessmentType") ?? assessmentTypeParam ?? null
  const assessmentIdFromUrl = assessmentIdRaw === "undefined" ? null : assessmentIdRaw
  const assessmentOrderFromUrl = assessmentOrderRaw === "undefined" ? null : assessmentOrderRaw
  const assessmentTypeFromUrl = assessmentTypeRaw === "undefined" ? null : assessmentTypeRaw

  const [seeding, setSeeding] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createMessage, setCreateMessage] = useState<string>("")
  const [createError, setCreateError] = useState<string>("")
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedModuleId, setSelectedModuleId] = useState<string>("")
  const [page, setPage] = useState(1)

  const [name, setName] = useState("")
  const [assessmentType, setAssessmentType] = useState<"assignment" | "quiz">("assignment")
  const [aiAssistedGrading, setAiAssistedGrading] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [rubric, setRubric] = useState<RubricItem[]>(DEFAULT_RUBRIC)

  const effectiveCourseId = selectedCourseId || courses?.[0]?.courseId || ""
  const courseModules = useQuery(
    api.modules.listByCourse,
    effectiveCourseId ? { courseId: effectiveCourseId } : "skip",
  )
  const assessments = useQuery(
    api.dashboardCourses.listAssessmentInsights,
    effectiveCourseId ? { courseId: effectiveCourseId } : "skip",
  )

  const showDetail =
    Boolean(assessmentCourseIdFromUrl) &&
    (
      Boolean(assessmentIdFromUrl?.trim()) ||
      (assessmentOrderFromUrl != null && assessmentOrderFromUrl !== "") ||
      Boolean(assessmentTypeFromUrl?.trim())
    )
  const detailOrder =
    assessmentOrderFromUrl != null && assessmentOrderFromUrl !== ""
      ? Number(assessmentOrderFromUrl)
      : undefined
  const detailOrderValid = detailOrder === undefined || Number.isFinite(detailOrder)
  const detailQueryArg =
    showDetail &&
    assessmentCourseIdFromUrl &&
    (assessmentIdFromUrl?.trim() || detailOrderValid || assessmentTypeFromUrl?.trim())
  const detail = useQuery(
    api.dashboardCourses.getAssessmentDetail,
    detailQueryArg
      ? {
          courseId: assessmentCourseIdFromUrl!,
          assessmentId: assessmentIdFromUrl?.trim() || undefined,
          order: assessmentIdFromUrl?.trim() ? undefined : (detailOrderValid ? detailOrder : undefined),
          assessmentType: assessmentTypeFromUrl?.trim() || undefined,
        }
      : "skip",
  )

  useEffect(() => {
    if (!showDetail || detail !== undefined) return
    const t = setTimeout(() => setLoadTimeout(true), 8000)
    return () => clearTimeout(t)
  }, [showDetail, detail])

  useEffect(() => {
    if (!convexAvailable || hasTriedAutoSeed.current || courses === undefined) return
    if (courses.length > 0) return
    hasTriedAutoSeed.current = true
    seedDemoDataIfEmpty({}).catch(() => {})
  }, [convexAvailable, courses, seedDemoDataIfEmpty])

  useEffect(() => {
    if (!courseModules || courseModules.length === 0) {
      setSelectedModuleId("")
      return
    }
    if (!selectedModuleId || !courseModules.some((m) => m.moduleId === selectedModuleId)) {
      const sorted = [...courseModules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setSelectedModuleId(sorted[0]?.moduleId ?? "")
    }
  }, [courseModules, selectedModuleId])

  const totalPages = useMemo(() => {
    const total = assessments?.length ?? 0
    return Math.max(1, Math.ceil(total / ROWS_PER_PAGE))
  }, [assessments])

  const pagedRows = useMemo(() => {
    if (!assessments) return []
    const start = (page - 1) * ROWS_PER_PAGE
    return assessments.slice(start, start + ROWS_PER_PAGE)
  }, [assessments, page])

  const rubricTotal = useMemo(
    () => rubric.reduce((sum, row) => sum + Number(row.weightPct || 0), 0),
    [rubric],
  )

  const balanceRubricTo100 = () => {
    if (rubric.length === 0) return
    const total = rubric.reduce((sum, row) => sum + Number(row.weightPct || 0), 0)
    if (total <= 0) {
      const equal = Math.floor((100 / rubric.length) * 100) / 100
      const remainder = Math.round((100 - equal * (rubric.length - 1)) * 100) / 100
      setRubric(
        rubric.map((row, i) => ({
          ...row,
          weightPct: i === rubric.length - 1 ? remainder : equal,
        })),
      )
      return
    }
    const scale = 100 / total
    const scaled = rubric.map((row, i) => {
      const value = Number(row.weightPct || 0) * scale
      return { ...row, weightPct: Math.round(value * 100) / 100 }
    })
    const sum = scaled.reduce((s, r) => s + r.weightPct, 0)
    const diff = Math.round((100 - sum) * 100) / 100
    if (diff !== 0 && scaled.length > 0) {
      const last = scaled.length - 1
      scaled[last] = { ...scaled[last], weightPct: Math.round((scaled[last].weightPct + diff) * 100) / 100 }
    }
    setRubric(scaled)
  }

  const canCreate =
    name.trim().length > 0 &&
    effectiveCourseId.length > 0 &&
    selectedModuleId.length > 0 &&
    rubric.length > 0 &&
    Math.abs(rubricTotal - 100) < 0.01

  const handleSeedDemoData = async () => {
    setSeeding(true)
    try {
      await reseedDashboardDemo({})
    } finally {
      setSeeding(false)
    }
  }

  const handleCreateAssessment = async () => {
    if (!canCreate) return
    setCreating(true)
    setCreateError("")
    setCreateMessage("")
    try {
      await createAssessment({
        courseId: effectiveCourseId,
        moduleId: selectedModuleId,
        name: name.trim(),
        assessmentKind: assessmentType,
        dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        aiAssistedGrading,
        instructions: instructions.trim() || undefined,
        rubric: rubric.map((r) => ({
          criterion: r.criterion.trim(),
          description: r.description.trim() || undefined,
          weightPct: Number(r.weightPct),
        })),
      })

      setShowCreateForm(false)
      setName("")
      setAssessmentType("assignment")
      setAiAssistedGrading(false)
      setInstructions("")
      setRubric(DEFAULT_RUBRIC)
      setPage(1)
      setCreateMessage("Assessment created successfully.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create assessment."
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  if (!convexAvailable) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Connect Convex to view assessments.</p>
      </div>
    )
  }

  const backToListHref = buildDashboardHref({ page: "dashboard", dashboardSubPage: "assessments" })

  const closeDetail = () => router.push(backToListHref)

  const showDetailModal = Boolean(detailQueryArg && assessmentCourseIdFromUrl)

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-[#fafafa] p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <h1 className="text-[30px] font-bold leading-normal tracking-[0.6px] text-foreground">
            {showCreateForm ? "New Assessment" : "Assessments"}
          </h1>

        {showCreateForm ? (
          <section className="rounded-[14px] border-2 border-[#eee] bg-white p-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Name*</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Give your assessment a name"
                  className="w-full rounded-[14px] border-2 border-[#eee] px-4 py-3 text-xs text-black placeholder:text-[#adadad] outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Course/ Module*</label>
                <div className="flex gap-4">
                  <Select value={effectiveCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="h-auto rounded-[10px] border-[1.5px] border-[#eee] px-4 py-2.5 text-xs shadow-none">
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
                  <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                    <SelectTrigger className="h-auto rounded-[10px] border-[1.5px] border-[#eee] px-4 py-2.5 text-xs shadow-none">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseModules
                        ?.slice()
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((module) => (
                          <SelectItem key={module.moduleId} value={module.moduleId}>
                            Module {module.order ?? "-"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">Assessment Type*</label>
                <Select
                  value={assessmentType}
                  onValueChange={(v) => setAssessmentType(v as "assignment" | "quiz")}
                >
                  <SelectTrigger className="h-auto w-[220px] rounded-[10px] border-[1.5px] border-[#eee] px-4 py-2.5 text-xs shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-black">
                  AI-Assisted Grading <span className="text-[#5b5b5b]">(optional)</span>
                </p>
                <p className="text-xs text-[#5b5b5b]">
                  Mandatory instructor sign-off before any score is released
                </p>
                <label className="flex items-center gap-2 text-xs text-black">
                  <input
                    type="checkbox"
                    checked={aiAssistedGrading}
                    onChange={(e) => setAiAssistedGrading(e.target.checked)}
                  />
                  Yes, I would like AI-Assisted grading for this assessment
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Instructions <span className="text-[#5b5b5b]">(optional)</span>
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Add a description for your assessment or further state how you would like AI to grade the assessment"
                  className="min-h-[120px] w-full rounded-[14px] border-2 border-[#eee] p-4 text-xs text-black placeholder:text-[#adadad] outline-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-black">Rubric*</label>
                <div className="rounded-[10px] border-2 border-[#eee] p-4">
                  <div className="mb-4 grid grid-cols-[1fr_180px] text-sm font-medium text-[#025dfe]">
                    <span>Criterion</span>
                    <span className="text-right">Weighting</span>
                  </div>
                  <div className="space-y-4">
                    {rubric.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_180px] gap-4">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={row.criterion}
                            onChange={(e) => {
                              const next = [...rubric]
                              next[idx] = { ...row, criterion: e.target.value }
                              setRubric(next)
                            }}
                            placeholder="Enter criterion name"
                            className="w-full rounded-[8px] border-2 border-[#e5e5e5] bg-white px-3 py-2 text-sm font-medium text-black placeholder:text-[#adadad] outline-none focus:border-[#025dfe] focus:ring-1 focus:ring-[#025dfe]/20"
                            aria-label="Criterion name"
                          />
                          <textarea
                            value={row.description}
                            onChange={(e) => {
                              const next = [...rubric]
                              next[idx] = { ...row, description: e.target.value }
                              setRubric(next)
                            }}
                            placeholder="Description (optional)"
                            className="min-h-[40px] w-full rounded-[8px] border-2 border-[#e5e5e5] bg-white px-3 py-2 text-xs text-black placeholder:text-[#adadad] outline-none focus:border-[#025dfe] focus:ring-1 focus:ring-[#025dfe]/20"
                            aria-label="Criterion description"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={row.weightPct}
                              onChange={(e) => {
                                const raw = e.target.value === "" ? 0 : Number(e.target.value)
                                const clamped = Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : 0))
                                const next = [...rubric]
                                next[idx] = { ...row, weightPct: clamped }
                                setRubric(next)
                              }}
                              className="w-16 rounded-[8px] border-2 border-[#e5e5e5] bg-white px-2 py-1.5 text-right text-sm font-medium text-black outline-none focus:border-[#025dfe] focus:ring-1 focus:ring-[#025dfe]/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              aria-label="Weight percentage"
                            />
                            <span className="text-sm font-medium text-[#025dfe]">%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={row.weightPct}
                            onChange={(e) => {
                              const next = [...rubric]
                              next[idx] = { ...row, weightPct: Number(e.target.value) }
                              setRubric(next)
                            }}
                            className="w-full accent-[#025dfe]"
                            aria-label="Weight slider"
                          />
                          <div className="flex justify-between text-[10px] text-[#adadad]">
                            <span>0%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setRubric((prev) => [
                      ...prev,
                      { criterion: "New Criterion", description: "", weightPct: 0 },
                    ])
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border-2 border-[#eee] text-xs font-medium text-[#4a5565]"
                >
                  + Add Criterion
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6b7280]">Rubric total</span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${
                        Math.abs(rubricTotal - 100) < 0.01
                          ? "bg-[#dcfce7] text-[#166534]"
                          : "bg-[#fee2e2] text-[#991b1b]"
                      }`}
                    >
                      {Math.round(rubricTotal * 100) / 100}%
                    </span>
                    {Math.abs(rubricTotal - 100) >= 0.01 && (
                      <span className="text-xs text-[#9ca3af]">— must equal 100%</span>
                    )}
                    {Math.abs(rubricTotal - 100) < 0.01 && (
                      <span className="text-xs text-[#259800]" aria-hidden>✓</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={balanceRubricTo100}
                    className="rounded-[8px] border border-[#b8d1ff] bg-[#eaf2ff] px-3 py-1.5 text-xs font-medium text-[#025dfe] hover:bg-[#dce9ff]"
                  >
                    Balance to 100%
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-8 border-t border-[#e5e7eb] pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs font-medium text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAssessment}
                disabled={!canCreate || creating}
                className="rounded-[10px] bg-[#025dfe] px-4 py-2.5 text-xs font-medium text-white disabled:opacity-50 hover:bg-[#014dda] active:bg-[#013fba]"
              >
                {creating ? "Creating..." : "Create Assessment"}
              </button>
            </div>
            {createError ? (
              <p className="mt-3 text-xs text-[#d1001f]">{createError}</p>
            ) : createMessage ? (
              <p className="mt-3 text-xs text-[#259800]">{createMessage}</p>
            ) : null}
          </section>
        ) : (
          <>
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
                  onClick={async () => {
                    setBackfilling(true)
                    setCreateMessage("")
                    try {
                      const { patched } = await backfillTimeSpent()
                      setCreateMessage(patched > 0 ? `Populated time spent for ${patched} result(s). Open an assessment to see it.` : "Time spent already populated.")
                    } catch (e) {
                      setCreateError(e instanceof Error ? e.message : "Backfill failed")
                    } finally {
                      setBackfilling(false)
                    }
                  }}
                  disabled={seeding || backfilling}
                  className="rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-medium text-black hover:bg-[#f7f7f7] disabled:opacity-50"
                >
                  {backfilling ? "Populating..." : "Populate time spent"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="rounded-[10px] bg-[#025dfe] px-[10px] py-[10px] text-xs font-medium text-white hover:bg-[#014dda] active:bg-[#013fba]"
                >
                  Create New Assessment
                </button>
              </div>
            </div>
            {createMessage ? (
              <p className="text-xs text-[#259800]">{createMessage}</p>
            ) : null}

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
                  const rowCourseId = (row as { courseId?: string }).courseId ?? effectiveCourseId
                  const hasValidOrder =
                    typeof row.order === "number" && Number.isFinite(row.order)
                  const orderParam =
                    row.assessmentId ? undefined : hasValidOrder ? String(row.order) : undefined
                  const hasDetailId =
                    Boolean(row.assessmentId?.trim()) ||
                    (orderParam != null && orderParam !== "") ||
                    Boolean(row.assessmentType?.trim())
                  const detailHref =
                    rowCourseId && hasDetailId
                      ? buildDashboardHref({
                          page: "dashboard",
                          dashboardSubPage: "assessments",
                          assessmentCourseId: rowCourseId,
                          assessmentId: row.assessmentId?.trim() || undefined,
                          assessmentOrder: orderParam,
                          assessmentType: row.assessmentType?.trim() || undefined,
                        })
                      : null

                  const rowContent = (
                    <>
                      <span>{row.assessmentType}</span>
                      <span>{row.courseModuleLabel}</span>
                      <span>{dueDate}</span>
                      <span className="flex justify-center">
                        <StatusPill status={row.status} />
                      </span>
                      <span className={row.severity === "moderate" ? "font-medium" : ""}>
                        {row.averageScoreLabel}
                      </span>
                    </>
                  )

                  const rowClassName = `grid grid-cols-5 items-center rounded-[4px] py-[6px] text-center text-xs text-black no-underline ${rowBg} ${
                    detailHref ? "cursor-pointer transition-colors hover:bg-[#f0f0f0]" : ""
                  }`

                  if (detailHref) {
                    return (
                      <Link
                        key={`${row.assessmentType}-${idx}`}
                        href={detailHref}
                        className={rowClassName}
                        scroll={false}
                      >
                        {rowContent}
                      </Link>
                    )
                  }
                  return (
                    <div key={`${row.assessmentType}-${idx}`} className={rowClassName}>
                      {rowContent}
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
                        className={`rounded px-2 py-1 ${active ? "font-bold text-[#025dfe]" : "text-[#5b5b5b]"}`}
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
          </>
        )}
      </div>
    </div>

      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assessment-detail-title"
          onClick={closeDetail}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[14px] border-2 border-[#eee] bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {detail === undefined && (
              <div className="flex flex-col items-center justify-center gap-4 p-12">
                <p className="text-sm text-[#5b5b5b]">Loading…</p>
                {loadTimeout && (
                  <button type="button" onClick={closeDetail} className="text-sm font-medium text-[#025dfe] underline">
                    Back to Assessments
                  </button>
                )}
              </div>
            )}
            {detail === null && (
              <div className="flex flex-col items-center justify-center gap-4 p-12">
                <p className="text-sm text-[#5b5b5b]">Assessment not found.</p>
                <button type="button" onClick={closeDetail} className="text-sm font-medium text-[#025dfe] underline">
                  Back to Assessments
                </button>
              </div>
            )}
            {detail != null && detail !== undefined && (
              <>
                <div className="flex shrink-0 items-center justify-between border-b border-[#e0e0e0] p-4">
                  <h2 id="assessment-detail-title" className="text-base font-medium text-black">
                    {detail.assessmentName}
                  </h2>
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="rounded p-1 text-[#5b5b5b] hover:bg-[#f0f0f0]"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex shrink-0 gap-4 border-b border-[#e0e0e0] p-4">
                  <div className="flex flex-1 flex-col gap-2 rounded-[14px] border-2 border-[#eee] bg-white p-4">
                    <p className="text-[30px] font-semibold leading-none text-[#025dfe]">
                      {detail.learnerGrades.filter((g) => g.submittedAt != null).length}/
                      {detail.learnerGrades.length}
                    </p>
                    <p className="text-sm font-medium text-[#5b5b5b]">Submissions</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 rounded-[14px] border-2 border-[#eee] bg-white p-4">
                    <p className="text-[30px] font-semibold leading-none text-[#025dfe]">
                      {detail.averageScoreLabel}
                    </p>
                    <p className="text-sm font-medium text-[#5b5b5b]">Average Score</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 rounded-[14px] border-2 border-[#eee] bg-white p-4">
                    <p className="text-[30px] font-semibold leading-none text-[#025dfe]">
                      {detail.averageTimeSpentLabel ?? "—"}
                    </p>
                    <p className="text-sm font-medium text-[#5b5b5b]">Average Time Spent</p>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <div className="flex flex-col px-4 pb-4 pt-4">
                    <div className="flex w-full min-w-[600px] items-center rounded-[4px] bg-[#5b5b5b] py-2">
                      <div className="flex flex-1 items-center justify-center px-2.5">
                        <span className="text-xs font-bold leading-normal text-white">Learner</span>
                      </div>
                      <div className="flex flex-1 items-center justify-center px-2.5">
                        <span className="text-xs font-bold leading-normal text-white">Score</span>
                      </div>
                      <div className="flex flex-1 items-center justify-center px-2.5">
                        <span className="text-xs font-bold leading-normal text-white">Time Spent</span>
                      </div>
                      <div className="flex flex-1 items-center justify-center px-2.5">
                        <span className="text-xs font-bold leading-normal text-white">Completed On</span>
                      </div>
                      <div className="flex flex-1 items-center justify-center px-2.5">
                        <span className="text-xs font-bold leading-normal text-white">Release Score</span>
                      </div>
                    </div>
                    {detail.learnerGrades.map((row) => {
                      const completedOn =
                        row.submittedAt != null
                          ? new Date(
                              row.submittedAt < 1e12 ? row.submittedAt * 1000 : row.submittedAt,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"
                      const timeSpentLabel =
                        row.timeSpentSec != null && row.timeSpentSec > 0
                          ? (() => {
                              const mins = Math.floor(row.timeSpentSec! / 60)
                              const secs = Math.round(row.timeSpentSec! % 60)
                              return mins > 0
                                ? `${mins} min${mins !== 1 ? "s" : ""} ${secs} sec${secs !== 1 ? "s" : ""}`
                                : `${secs} sec${secs !== 1 ? "s" : ""}`
                            })()
                          : "—"
                      return (
                        <div
                          key={String(row.learnerId)}
                          className="flex w-full min-w-[600px] items-center border-b border-[#eee] last:border-b-0"
                        >
                          <div className="flex flex-1 items-center px-2.5 py-3">
                            <span className="text-sm text-black">{row.learnerName}</span>
                          </div>
                          <div className="flex flex-1 items-center justify-center px-2.5 py-3">
                            <span className="text-sm text-black">{row.scoreLabel ?? "—"}</span>
                          </div>
                          <div className="flex flex-1 items-center justify-center px-2.5 py-3">
                            <span className="text-sm text-black">{timeSpentLabel}</span>
                          </div>
                          <div className="flex flex-1 items-center justify-center px-2.5 py-3">
                            <span className="text-sm text-black">{completedOn}</span>
                          </div>
                          <div className="flex flex-1 items-center justify-center gap-2 px-2.5 py-3">
                            {row.releaseStatus != null ? (
                              <span className="rounded-full bg-[#e5e5e5] px-2.5 py-1 text-xs font-medium text-[#5b5b5b]">
                                Sent
                                {row.releaseStatus.released ? " (Released)" : " (Not released)"}
                              </span>
                            ) : (detail.assessmentId && (row.userId ?? (typeof row.learnerId === "string" ? row.learnerId : undefined))) ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const userId = row.userId ?? (typeof row.learnerId === "string" ? row.learnerId : "")
                                    if (!userId || !detail.assessmentId) return
                                    setScoreReleaseStatus({
                                      courseId: detail.courseId,
                                      assessmentId: detail.assessmentId,
                                      userId,
                                      released: true,
                                    })
                                  }}
                                  className="rounded-full bg-[#e1f3de] px-2.5 py-1 text-xs font-medium text-[#259800] transition-opacity hover:opacity-90"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const userId = row.userId ?? (typeof row.learnerId === "string" ? row.learnerId : "")
                                    if (!userId || !detail.assessmentId) return
                                    setScoreReleaseStatus({
                                      courseId: detail.courseId,
                                      assessmentId: detail.assessmentId,
                                      userId,
                                      released: false,
                                    })
                                  }}
                                  className="rounded-full bg-[#ffddd9] px-2.5 py-1 text-xs font-medium text-[#d1001f] transition-opacity hover:opacity-90"
                                >
                                  No
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-[#9ca3af]">—</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </>
  )
}
