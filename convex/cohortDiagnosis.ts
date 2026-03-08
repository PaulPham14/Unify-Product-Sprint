import { v } from "convex/values"

import { query } from "./_generated/server"
import { buildDiagnosisLearnerRows } from "./cohortDiagnosis.helpers"

const diagnosisRiskBucketValidator = v.union(
  v.literal("high_mastery"),
  v.literal("on_track"),
  v.literal("at_risk"),
  v.literal("disengaged")
)

export const listLearnersByCourseAndSegment = query({
  args: {
    cohortId: v.string(),
    courseId: v.string(),
    riskBucket: diagnosisRiskBucketValidator,
  },
  returns: v.object({
    rows: v.array(
      v.object({
        learnerId: v.id("user"),
        externalUserId: v.string(),
        learnerName: v.string(),
        masteryScore: v.float64(),
        riskBucket: diagnosisRiskBucketValidator,
        snapshotCount: v.float64(),
        latestCalculatedAt: v.float64(),
      })
    ),
    totalCount: v.float64(),
  }),
  handler: async (ctx, { cohortId, courseId, riskBucket }) => {
    const [courseModules, cohortUsers, cohortSnapshots] = await Promise.all([
      ctx.db
        .query("modules")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .collect(),
      ctx.db
        .query("user")
        .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
        .collect(),
      ctx.db
        .query("course_mastery_history")
        .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
        .collect(),
    ])

    const rows = buildDiagnosisLearnerRows({
      moduleIds: courseModules.map((module) => module.moduleId),
      selectedRiskBucket: riskBucket,
      snapshots: cohortSnapshots,
      users: cohortUsers,
      nowSec: Date.now() / 1000,
    })

    return {
      rows,
      totalCount: rows.length,
    }
  },
})
