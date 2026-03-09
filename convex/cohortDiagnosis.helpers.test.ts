import test from "node:test"
import assert from "node:assert/strict"

import { buildDiagnosisLearnerRows } from "./cohortDiagnosis.helpers"

test("buildDiagnosisLearnerRows keeps only the latest snapshot per learner and module", () => {
  const rows = buildDiagnosisLearnerRows({
    moduleIds: ["mod_ai_01", "mod_ai_02"],
    selectedRiskBucket: "at_risk",
    nowSec: 1_710_086_400,
    users: [
      {
        _id: "user-doc-1",
        userId: "learner_1",
        name: "Cedric",
        role: "learner",
        lastActiveAt: 1_710_000_000,
      },
      {
        _id: "user-doc-2",
        userId: "learner_2",
        name: "Amara",
        role: "learner",
        lastActiveAt: 1_710_000_000,
      },
    ],
    snapshots: [
      {
        userId: "learner_1",
        moduleId: "mod_ai_01",
        applicationScore: 52,
        comprehensionScore: 52,
        retentionScore: 52,
        behavioralScore: 52,
        masteryScore: 52,
        calculatedAt: 1,
      },
      {
        userId: "learner_1",
        moduleId: "mod_ai_01",
        applicationScore: 68,
        comprehensionScore: 68,
        retentionScore: 68,
        behavioralScore: 68,
        masteryScore: 68,
        calculatedAt: 2,
      },
      {
        userId: "learner_1",
        moduleId: "mod_ai_02",
        applicationScore: 60,
        comprehensionScore: 60,
        retentionScore: 60,
        behavioralScore: 60,
        masteryScore: 60,
        calculatedAt: 2,
      },
      {
        userId: "learner_2",
        moduleId: "mod_ai_01",
        applicationScore: 91,
        comprehensionScore: 91,
        retentionScore: 91,
        behavioralScore: 91,
        masteryScore: 91,
        calculatedAt: 3,
      },
    ],
  })

  assert.deepEqual(rows, [
    {
      learnerId: "user-doc-1",
      externalUserId: "learner_1",
      learnerName: "Cedric",
      applicationScore: 64,
      retrievalScore: 64,
      retentionScore: 64,
      behaviourScore: 64,
      masteryScore: 64,
      riskBucket: "at_risk",
      snapshotCount: 2,
      latestCalculatedAt: 2,
    },
  ])
})

test("buildDiagnosisLearnerRows marks inactive learners as disengaged", () => {
  const rows = buildDiagnosisLearnerRows({
    moduleIds: ["mod_ai_01"],
    selectedRiskBucket: "disengaged",
    nowSec: 1_800_000_000,
    users: [
      {
        _id: "user-doc-3",
        userId: "learner_3",
        name: "Noor",
        role: "learner",
        lastActiveAt: 1_700_000_000,
      },
    ],
    snapshots: [
      {
        userId: "learner_3",
        moduleId: "mod_ai_01",
        applicationScore: 95,
        comprehensionScore: 95,
        retentionScore: 95,
        behavioralScore: 95,
        masteryScore: 95,
        calculatedAt: 10,
      },
    ],
  })

  assert.equal(rows[0]?.riskBucket, "disengaged")
})
