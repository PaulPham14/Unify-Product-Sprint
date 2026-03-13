"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RiskBadgeLevel = "high" | "moderate" | "positive"

function riskBadgeFromScore(score: number): { level: RiskBadgeLevel; label: string } {
  if (score >= 75) return { level: "positive", label: "Risk: Positive" }
  if (score >= 50) return { level: "moderate", label: "Risk: Moderate" }
  return { level: "high", label: "Risk: High" }
}

const RISK_BADGE_STYLES: Record<RiskBadgeLevel, string> = {
  high: "bg-[#ffddd9] text-[#d1001f]",
  moderate: "bg-[#ffebda] text-[#cf5d00]",
  positive: "bg-[#e1f3de] text-[#259800]",
}

export type ActionModalVariant = "review_quiz" | "concept_walkthrough" | "office_hours" | "spaced_quiz"

const VARIANT_CONFIG: Record<ActionModalVariant, { title: string }> = {
  review_quiz: { title: "Assign Review Quiz" },
  concept_walkthrough: { title: "Concept Walkthrough" },
  office_hours: { title: "Office Hours" },
  spaced_quiz: { title: "Send Spaced Quizzes" },
}

const SPACED_QUIZ_FREQUENCIES = [
  { id: "1", label: "1 week" },
  { id: "2", label: "2 weeks" },
  { id: "3", label: "3 weeks" },
  { id: "4", label: "4 weeks" },
] as const

export interface ActionModalLearner {
  _id: string
  name: string
  masteryScore?: number
  riskBucket?: string
}

export interface ActionModalCourse {
  courseId: string
  title: string
}

export interface ActionModalModule {
  moduleId: string
  title: string
  courseId?: string
}

export function ActionModal({
  open,
  onClose,
  variant,
  learners,
  courses,
  modules,
  defaultCourseId,
  defaultModuleId,
}: {
  open: boolean
  onClose: () => void
  variant: ActionModalVariant
  learners: ActionModalLearner[]
  courses: ActionModalCourse[] | undefined
  modules: ActionModalModule[] | undefined
  defaultCourseId?: string
  defaultModuleId?: string
}) {
  const config = VARIANT_CONFIG[variant]
  const [selectedCourse, setSelectedCourse] = useState(defaultCourseId ?? "")
  const [selectedModule, setSelectedModule] = useState(defaultModuleId ?? "")
  const [actionType, setActionType] = useState(variant)
  const [bookingLink, setBookingLink] = useState("")
  const [spacedQuizFrequencyWeeks, setSpacedQuizFrequencyWeeks] = useState("1")
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [sent, setSent] = useState(false)

  const filteredModules = useMemo(() => {
    if (!modules) return []
    if (!selectedCourse || selectedCourse === "all_courses") return modules
    return modules.filter((m) => m.courseId === selectedCourse)
  }, [modules, selectedCourse])

  const toggleLearner = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = learners.length > 0 && checkedIds.size === learners.length
  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set())
    else setCheckedIds(new Set(learners.map((l) => l._id)))
  }

  const handleSend = () => {
    setSent(true)
    setTimeout(() => {
      setSent(false)
      onClose()
    }, 1500)
  }

  useEffect(() => {
    if (open) {
      setSelectedCourse(defaultCourseId ?? "")
      setSelectedModule(defaultModuleId ?? "")
      setActionType(variant)
      setBookingLink("")
      setSpacedQuizFrequencyWeeks("1")
      setCheckedIds(new Set())
      setSent(false)
    }
  }, [open, defaultCourseId, defaultModuleId, variant])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex w-full max-w-[700px] flex-col rounded-[14px] border-2 border-[#eee] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#e0e0e0] p-4 rounded-t-[14px]">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-black">{config.title}</span>
            <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-[#5b5b5b]" />
            </button>
          </div>

          {variant === "spaced_quiz" ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-black">Send spaced quizzes</span>
              <Select value={spacedQuizFrequencyWeeks} onValueChange={setSpacedQuizFrequencyWeeks}>
                <SelectTrigger className="h-auto gap-2 rounded-[10px] border-[1.5px] border-[#eee] bg-white px-4 py-2.5 text-xs font-medium text-black shadow-none w-[120px]">
                  <SelectValue placeholder="How often" />
                </SelectTrigger>
                <SelectContent>
                  {SPACED_QUIZ_FREQUENCIES.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : variant === "office_hours" ? (
            <div className="rounded-[14px] border-2 border-[#eee] bg-white p-4">
              <input
                type="text"
                value={bookingLink}
                onChange={(e) => setBookingLink(e.target.value)}
                placeholder="Enter Calendy, Google Calendar or other booking links"
                className="w-full text-xs text-black placeholder:text-[#adadad] outline-none bg-transparent"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedModule("") }}>
                <SelectTrigger className="h-auto gap-2 rounded-[10px] border-[1.5px] border-[#eee] bg-white px-4 py-2.5 text-xs font-medium text-black shadow-none">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_courses">All Courses</SelectItem>
                  {courses?.map((c) => (
                    <SelectItem key={c.courseId} value={c.courseId}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="h-auto gap-2 rounded-[10px] border-[1.5px] border-[#eee] bg-white px-4 py-2.5 text-xs font-medium text-black shadow-none">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_modules">All Modules</SelectItem>
                  {filteredModules.map((m) => (
                    <SelectItem key={m.moduleId} value={m.moduleId}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {variant === "review_quiz" ? (
                <Select value={actionType} onValueChange={(v) => setActionType(v as ActionModalVariant)}>
                  <SelectTrigger className="h-auto gap-2 rounded-[10px] border-[1.5px] border-[#eee] bg-white px-4 py-2.5 text-xs font-medium text-black shadow-none">
                    <SelectValue placeholder="Review Quiz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review_quiz">Review Quiz</SelectItem>
                    <SelectItem value="practice_quiz">Practice Quiz</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={actionType} onValueChange={(v) => setActionType(v as ActionModalVariant)}>
                  <SelectTrigger className="h-auto gap-2 rounded-[10px] border-[1.5px] border-[#eee] bg-white px-4 py-2.5 text-xs font-medium text-black shadow-none">
                    <SelectValue placeholder="Concept Walkthrough" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concept_walkthrough">Concept Walkthrough</SelectItem>
                    <SelectItem value="guided_practice">Guided Practice</SelectItem>
                    <SelectItem value="worked_example">Worked Example</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex flex-col gap-4 bg-[#fafafa] p-4">
          <p className="text-xs text-black">{learners.length} Students</p>

          <div className="flex items-center rounded py-1.5 bg-[#5b5b5b]">
            <div className="flex flex-1 items-center gap-2 px-3">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="h-3 w-3 rounded-sm border border-white accent-[#025dfe]"
              />
              <span className="text-xs font-bold text-white">Learner</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="text-xs font-bold text-white">Mastery Score</span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <span className="text-xs font-bold text-white">Risk Level</span>
            </div>
          </div>

          <div className="flex max-h-[280px] flex-col gap-1 overflow-y-auto">
            {learners.map((l) => {
              const score = l.masteryScore ?? 0
              const badge = riskBadgeFromScore(score)
              return (
                <div key={l._id} className="flex items-center py-1">
                  <div className="flex flex-1 items-center gap-2 px-3">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(l._id)}
                      onChange={() => toggleLearner(l._id)}
                      className="h-3 w-3 rounded-sm border border-black accent-[#025dfe]"
                    />
                    <span className="text-sm text-black">{l.name}</span>
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <span className="text-sm text-black">{Math.round(score)}/ 100</span>
                  </div>
                  <div className="flex flex-1 items-center justify-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${RISK_BADGE_STYLES[badge.level]}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#e0e0e0] bg-white p-4 rounded-b-[14px]">
          <button
            type="button"
            onClick={handleSend}
            disabled={checkedIds.size === 0 || sent}
            className="rounded-[5px] bg-[#025dfe] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#014dda] active:bg-[#013fba] disabled:opacity-50"
          >
            {sent ? "Sent!" : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Backwards-compatible alias */
export const AssignReviewQuizModal = ActionModal
export type AssignReviewQuizLearner = ActionModalLearner
export type AssignReviewQuizCourse = ActionModalCourse
export type AssignReviewQuizModule = ActionModalModule
