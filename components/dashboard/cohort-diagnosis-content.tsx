"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"

import { useConvexAvailable } from "@/app/ConvexClientProvider"
import { api } from "@/convex/_generated/api"
import {
  buildCohortDiagnosisHref,
  DIAGNOSIS_SEGMENT_OPTIONS,
  getDiagnosisSegmentOption,
} from "@/lib/cohort-diagnosis"
import { buildDashboardHref } from "@/lib/dashboard-route-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const INSTRUCTOR_COHORT_ID = "cohort_ai_001"
const PAGINATION_LEFT_ICON =
  "http://localhost:3845/assets/7a46e7316dfd34aa1b0193d99e39cc0d1036369a.svg"
const PAGINATION_RIGHT_ICON =
  "http://localhost:3845/assets/342fe9d5daaa5ad831e3f4f17629bc13d2f91d88.svg"
const ROWS_PER_PAGE_OPTIONS = ["10", "20", "50"]

type DiagnosisQueryResult = NonNullable<
  ReturnType<typeof useQuery<typeof api.cohortDiagnosis.listLearnersByCourseAndSegment>>
>

function DiagnosisFilterSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  ariaLabel: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-auto min-w-[152px] gap-[10px] rounded-[10px] border-[1.5px] border-[#eee] bg-white px-[15px] py-[10px] text-[12px] font-medium text-black shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-[#eee] bg-white">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-[12px] text-black">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CohortDiagnosisContent() {
  const convexAvailable = useConvexAvailable()

  if (!convexAvailable) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto bg-background p-6">
        <p className="text-center text-sm text-muted-foreground">
          Convex is not configured. Set `NEXT_PUBLIC_CONVEX_URL` to view cohort diagnosis details.
        </p>
      </div>
    )
  }

  return <CohortDiagnosisContentInner />
}

function CohortDiagnosisContentInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courses = useQuery(api.dashboardCourses.list)
  const [rowsPerPage, setRowsPerPage] = useState("20")
  const [currentPage, setCurrentPage] = useState(1)

  const requestedCourseId = searchParams.get("courseId")
  const selectedSegment = useMemo(
    () => getDiagnosisSegmentOption(searchParams.get("segment")),
    [searchParams]
  )

  const activeCourse = useMemo(() => {
    if (!courses?.length) return null
    return courses.find((course) => course.courseId === requestedCourseId) ?? courses[0]
  }, [courses, requestedCourseId])

  const normalizedHref = activeCourse
    ? buildCohortDiagnosisHref({
        courseId: activeCourse.courseId,
        segment: selectedSegment.label,
      })
    : null

  useEffect(() => {
    if (!normalizedHref) return

    const normalizedParams = new URLSearchParams(normalizedHref.split("?")[1] ?? "")
    const currentCourseId = searchParams.get("courseId") ?? ""
    const currentSegment = searchParams.get("segment") ?? ""

    if (
      currentCourseId !== normalizedParams.get("courseId") ||
      currentSegment !== normalizedParams.get("segment")
    ) {
      router.replace(normalizedHref)
    }
  }, [normalizedHref, router, searchParams])

  const diagnosisData = useQuery(
    api.cohortDiagnosis.listLearnersByCourseAndSegment,
    activeCourse
      ? {
          cohortId: INSTRUCTOR_COHORT_ID,
          courseId: activeCourse.courseId,
          riskBucket: selectedSegment.riskBucket,
        }
      : "skip"
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCourse?.courseId, rowsPerPage, selectedSegment.riskBucket])

  const totalRows: DiagnosisQueryResult["rows"] = diagnosisData?.rows ?? []
  const totalCount = diagnosisData?.totalCount ?? 0
  const rowsPerPageNumber = Number(rowsPerPage)
  const totalPages = Math.max(1, Math.ceil(totalRows.length / rowsPerPageNumber))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pagedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPageNumber
    return totalRows.slice(startIndex, startIndex + rowsPerPageNumber)
  }, [rowsPerPageNumber, safeCurrentPage, totalRows])

  if (!courses) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-6 text-sm text-muted-foreground">
        Loading cohort diagnosis…
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-6 text-sm text-muted-foreground">
        No courses found.
      </div>
    )
  }

  const handleCourseChange = (courseId: string) => {
    router.replace(
      buildCohortDiagnosisHref({
        courseId,
        segment: selectedSegment.label,
      })
    )
  }

  const handleSegmentChange = (segmentLabel: string) => {
    if (!activeCourse) return
    router.replace(
      buildCohortDiagnosisHref({
        courseId: activeCourse.courseId,
        segment: segmentLabel,
      })
    )
  }

  const courseOptions = courses.map((course) => ({
    value: course.courseId,
    label: course.title,
  }))

  const segmentOptions = DIAGNOSIS_SEGMENT_OPTIONS.map((segment) => ({
    value: segment.label,
    label: `${segment.label} Students`,
  }))

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6">
      <div className="mx-auto flex max-w-[941px] flex-col gap-8">
        <div className="flex flex-wrap items-start gap-4">
          <DiagnosisFilterSelect
            value={activeCourse?.courseId ?? courseOptions[0]?.value ?? ""}
            onValueChange={handleCourseChange}
            options={courseOptions}
            ariaLabel="Select course"
          />
          <DiagnosisFilterSelect
            value={selectedSegment.label}
            onValueChange={handleSegmentChange}
            options={segmentOptions}
            ariaLabel="Select diagnosis segment"
          />
        </div>

        <section className="flex w-full flex-col gap-4 rounded-[14px] border-2 border-[#eee] bg-white p-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col gap-[5px] text-black">
              <h1 className="text-[14px] font-medium">
                {selectedSegment.label} Students
              </h1>
              <p className="text-[12px]">
                {totalCount} {totalCount === 1 ? "Student" : "Students"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[1.25fr_1fr_1fr] rounded-[4.196px] bg-[#5b5b5b] py-[5px]">
              <div className="flex items-center justify-center">
                <span className="text-[12px] font-bold leading-6 text-white">
                  Learner
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[12px] font-bold leading-6 text-white">
                  Mastery Score
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-[12px] font-bold leading-6 text-white">
                  Insights
                </span>
              </div>
            </div>

            {diagnosisData === undefined ? (
              <div className="flex min-h-[280px] items-center justify-center text-[14px] text-[#5b5b5b]">
                Loading learners…
              </div>
            ) : pagedRows.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center text-center text-[14px] text-[#5b5b5b]">
                No learners currently match this diagnosis segment for the selected course.
              </div>
            ) : (
              pagedRows.map((row) => (
                <div
                  key={row.learnerId}
                  className="grid grid-cols-[1.25fr_1fr_1fr] items-center gap-2"
                >
                  <div className="px-[10px] py-[8px]">
                    <p className="truncate text-[14px] leading-6 text-black">
                      {row.learnerName}
                    </p>
                  </div>
                  <div className="flex items-center justify-center py-[8px]">
                    <p className="text-[14px] leading-6 text-black">
                      {row.masteryScore}/ 100
                    </p>
                  </div>
                  <div className="flex items-center justify-center py-[8px]">
                    <Link
                      href={buildDashboardHref({
                        page: "dashboard",
                        dashboardSubPage: "learners",
                        learnerId: row.learnerId,
                      })}
                      className="text-[14px] leading-normal text-[#025dfe] underline underline-offset-2 transition-opacity hover:opacity-80"
                    >
                      View Learner Insights
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-[10px]">
              <span className="text-[10px] font-medium leading-[1.4] text-black">
                Show
              </span>
              <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                <SelectTrigger className="h-[27px] min-w-[66px] gap-[10px] rounded-[4.258px] border-[1.064px] border-[#afafaf] bg-white px-[10px] py-0 text-[10px] font-medium text-black shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#eee] bg-white">
                  {ROWS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option} className="text-[10px] text-black">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[10px] font-medium leading-[1.4] text-black">
                Row
              </span>
            </div>

            <div className="flex items-center justify-center gap-[10px]">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] bg-[#f9f9f9] transition-opacity disabled:opacity-40"
              >
                <img src={PAGINATION_LEFT_ICON} alt="" className="h-[15px] w-[15px]" />
              </button>
              <div className="flex h-[35px] min-w-[35px] items-center justify-center rounded-[4px] px-[10px]">
                <span className="text-[10px] font-bold leading-[1.4] text-[#025dfe]">
                  {safeCurrentPage}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] bg-[#f2f2f2] transition-opacity disabled:opacity-40"
              >
                <img src={PAGINATION_RIGHT_ICON} alt="" className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
