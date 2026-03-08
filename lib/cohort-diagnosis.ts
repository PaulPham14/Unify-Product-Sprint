export type DiagnosisRiskBucket =
  | "high_mastery"
  | "on_track"
  | "at_risk"
  | "disengaged"

export type DiagnosisSegmentOption = {
  label: string
  riskBucket: DiagnosisRiskBucket
}

export const DEFAULT_DIAGNOSIS_SEGMENT_LABEL = "On Track"

export const DIAGNOSIS_SEGMENT_OPTIONS: DiagnosisSegmentOption[] = [
  { label: "High Mastery", riskBucket: "high_mastery" },
  { label: "On Track", riskBucket: "on_track" },
  { label: "At Risk", riskBucket: "at_risk" },
  { label: "Disengaged", riskBucket: "disengaged" },
]

export function getDiagnosisSegmentOption(
  label: string | null | undefined
): DiagnosisSegmentOption {
  return (
    DIAGNOSIS_SEGMENT_OPTIONS.find((option) => option.label === label) ??
    DIAGNOSIS_SEGMENT_OPTIONS.find(
      (option) => option.label === DEFAULT_DIAGNOSIS_SEGMENT_LABEL
    )!
  )
}

export function buildCohortDiagnosisHref({
  courseId,
  segment,
}: {
  courseId: string
  segment: string
}) {
  const normalizedSegment = getDiagnosisSegmentOption(segment).label
  return `/dashboard/cohort-diagnosis?courseId=${encodeURIComponent(
    courseId
  )}&segment=${encodeURIComponent(normalizedSegment)}`
}

export function getDiagnosisLabelForRiskBucket(
  riskBucket: DiagnosisRiskBucket
) {
  return (
    DIAGNOSIS_SEGMENT_OPTIONS.find((option) => option.riskBucket === riskBucket)
      ?.label ?? DEFAULT_DIAGNOSIS_SEGMENT_LABEL
  )
}
