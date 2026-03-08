import test from "node:test"
import assert from "node:assert/strict"

import {
  DEFAULT_DIAGNOSIS_SEGMENT_LABEL,
  buildCohortDiagnosisHref,
  getDiagnosisSegmentOption,
} from "./cohort-diagnosis"

test("buildCohortDiagnosisHref encodes the selected course and segment", () => {
  assert.equal(
    buildCohortDiagnosisHref({
      courseId: "course_ai_fundamentals",
      segment: "On Track",
    }),
    "/dashboard/cohort-diagnosis?courseId=course_ai_fundamentals&segment=On%20Track"
  )
})

test("getDiagnosisSegmentOption returns the matching segment metadata", () => {
  assert.deepEqual(getDiagnosisSegmentOption("At Risk"), {
    label: "At Risk",
    riskBucket: "at_risk",
  })
})

test("getDiagnosisSegmentOption falls back to the default segment for invalid input", () => {
  assert.deepEqual(getDiagnosisSegmentOption("Not A Segment"), {
    label: DEFAULT_DIAGNOSIS_SEGMENT_LABEL,
    riskBucket: "on_track",
  })
})
