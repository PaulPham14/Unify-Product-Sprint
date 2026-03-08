import test from "node:test"
import assert from "node:assert/strict"

import { getRiskBucketForMasteryScore } from "./scoreUtils"

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
