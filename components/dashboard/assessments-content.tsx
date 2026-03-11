"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useConvexAvailable } from "@/app/ConvexClientProvider"
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
      ? "bg-[#f3e6ff] text-[#9727fc]"
      : "bg-[#e1f3de] text-[#259800]"
  const dotStyle = notStarted ? "bg-[#5b5b5b]" : inProgress ? "bg-[#9727fc]" : "bg-[#259800]"
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotStyle}`} aria-hidden />
      {label}
    </span>
  )
}

export function DashboardAssessmentsContent() {
  const convexAvailable = useConvexAvailable()
  const courses = useQuery(api.dashboardCourses.list, {})
  const reseedDashboardDemo = useAction(api.demoData.reseedLearningIntelligenceDashboard)
  const createAssessment = useMutation(api.dashboardCourses.createAssessment)

  const [seeding, setSeeding] = useState(false)
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

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-[40px] font-bold tracking-[0.6px] text-black">
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
                  <div className="mb-4 grid grid-cols-[1fr_180px] text-sm font-medium text-[#7f23ff]">
                    <span>Criterion</span>
                    <span className="text-right">Weighting</span>
                  </div>
                  <div className="space-y-4">
                    {rubric.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_180px] gap-4">
                        <div className="space-y-1">
                          <input
                            value={row.criterion}
                            onChange={(e) => {
                              const next = [...rubric]
                              next[idx] = { ...row, criterion: e.target.value }
                              setRubric(next)
                            }}
                            className="w-full border-0 p-0 text-sm font-medium text-black outline-none"
                          />
                          <textarea
                            value={row.description}
                            onChange={(e) => {
                              const next = [...rubric]
                              next[idx] = { ...row, description: e.target.value }
                              setRubric(next)
                            }}
                            className="min-h-[40px] w-full border-0 p-0 text-xs text-black outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-right text-sm font-medium text-[#7f23ff]">
                            {Math.round(row.weightPct)}%
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={row.weightPct}
                            onChange={(e) => {
                              const next = [...rubric]
                              next[idx] = { ...row, weightPct: Number(e.target.value) }
                              setRubric(next)
                            }}
                            className="w-full accent-[#7f23ff]"
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

                <p
                  className={`text-xs ${Math.abs(rubricTotal - 100) < 0.01 ? "text-[#259800]" : "text-[#d1001f]"}`}
                >
                  Rubric total: {Math.round(rubricTotal)}% (must equal 100%)
                </p>
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
              <button type="button" className="text-xs font-medium text-[#7f23ff]">
                Save
              </button>
              <button
                type="button"
                onClick={handleCreateAssessment}
                disabled={!canCreate || creating}
                className="rounded-[10px] bg-[#7f23ff] px-4 py-2.5 text-xs font-medium text-white disabled:opacity-50"
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
                  onClick={() => setShowCreateForm(true)}
                  className="rounded-[10px] bg-[#7f23ff] px-[10px] py-[10px] text-xs font-medium text-white"
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
                  const detailHref = effectiveCourseId
                    ? row.assessmentId
                      ? `/dashboard/assessment-insight?courseId=${encodeURIComponent(effectiveCourseId)}&assessmentId=${encodeURIComponent(row.assessmentId)}`
                      : `/dashboard/assessment-insight?courseId=${encodeURIComponent(effectiveCourseId)}&order=${encodeURIComponent(String(row.order))}`
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

                  const rowClassName = `grid grid-cols-5 items-center rounded-[4px] py-[6px] text-center text-xs text-black ${rowBg} ${
                    detailHref ? "cursor-pointer transition-colors hover:bg-[#f0f0f0]" : ""
                  }`

                  if (detailHref) {
                    return (
                      <Link
                        key={`${row.assessmentType}-${idx}`}
                        href={detailHref}
                        className={rowClassName}
                        style={{ textDecoration: "none", color: "inherit" }}
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
                        className={`rounded px-2 py-1 ${active ? "font-bold text-[#9727fc]" : "text-[#5b5b5b]"}`}
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
  )
}
