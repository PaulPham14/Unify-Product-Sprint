import test from "node:test"
import assert from "node:assert/strict"

import {
  computeMasteryFromComponents,
  getDefaultCourseDashboardConfig,
  getDiagnosisBucketForMasteryScore,
  getRiskBucketForMasteryScore,
  validateDiagnosisThresholds,
  validateMasteryWeights,
} from "./scoreUtils"

test("getRiskBucketForMasteryScore returns on_track for mastery scores between 65 and 84", () => {
  assert.equal(
    getRiskBucketForMasteryScore({
      masteryScore: 72,
      daysSinceActive: 3,
      hasActivityData: true,
    }),
    "on_track"
  )
})

test("getRiskBucketForMasteryScore returns disengaged for inactive learners with activity data", () => {
  assert.equal(
    getRiskBucketForMasteryScore({
      masteryScore: 92,
      daysSinceActive: 45,
      hasActivityData: true,
    }),
    "disengaged"
  )
})

test("default course dashboard config matches figma defaults", () => {
  assert.deepEqual(getDefaultCourseDashboardConfig(), {
    masteryWeights: {
      applicationPct: 40,
      retrievalPct: 30,
      retentionPct: 20,
      behaviourPct: 10,
    },
    diagnosisThresholds: {
      highMasteryMin: 85,
      onTrackMin: 70,
      atRiskMin: 50,
    },
  })
})

test("computeMasteryFromComponents uses supplied mastery weights", () => {
  assert.equal(
    computeMasteryFromComponents({
      applicationScore: 80,
      retrievalScore: 70,
      retentionScore: 60,
      behaviourScore: 50,
      masteryWeights: {
        applicationPct: 10,
        retrievalPct: 20,
        retentionPct: 30,
        behaviourPct: 40,
      },
    }),
    60
  )
})

test("getDiagnosisBucketForMasteryScore uses configured thresholds", () => {
  assert.equal(
    getDiagnosisBucketForMasteryScore({
      masteryScore: 72,
      daysSinceActive: 1,
      hasActivityData: true,
      diagnosisThresholds: {
        highMasteryMin: 85,
        onTrackMin: 70,
        atRiskMin: 50,
      },
    }),
    "on_track"
  )
})

test("mastery weight validation rejects totals that do not equal 100", () => {
  assert.throws(() =>
    validateMasteryWeights({
      applicationPct: 40,
      retrievalPct: 20,
      retentionPct: 20,
      behaviourPct: 10,
    })
  )
})

test("diagnosis threshold validation rejects overlapping thresholds", () => {
  assert.throws(() =>
    validateDiagnosisThresholds({
      highMasteryMin: 85,
      onTrackMin: 85,
      atRiskMin: 50,
    })
  )
})
