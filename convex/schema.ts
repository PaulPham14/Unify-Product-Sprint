import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cohort: defineTable({
    cohortId: v.string(),
    cohortName: v.optional(v.string()),
    createdAt: v.float64(),
    endDate: v.string(),
    instructorId: v.string(),
    learnerIds: v.optional(v.array(v.string())),
    moduleId: v.string(),
    startDate: v.string(),
    status: v.string(),
  })
    .index("by_instructorId", ["instructorId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_status", ["status"])
    .index("by_cohortId", ["cohortId"]),

  concept: defineTable({
    conceptId: v.optional(v.string()),
    concept_id: v.optional(v.string()),
    moduleId: v.string(),
    title: v.optional(v.string()),
  }).index("by_moduleId", ["moduleId"]),

  lesson: defineTable({
    conceptId: v.string(),
    contentType: v.string(),
    moduleId: v.string(),
    order: v.float64(),
    title: v.string(),
  })
    .index("by_moduleId", ["moduleId"])
    .index("by_conceptId", ["conceptId"]),

  modules: defineTable({
    cohortId: v.optional(v.string()),
    courseId: v.optional(v.string()),
    createdAt: v.float64(),
    description: v.string(),
    instructorId: v.string(),
    moduleId: v.string(),
    order: v.float64(),
    title: v.string(),
  })
    .index("by_instructorId", ["instructorId"])
    .index("by_cohortId", ["cohortId"])
    .index("by_courseId", ["courseId"])
    .index("by_moduleId", ["moduleId"]),

  task_results: defineTable({
    assessmentId: v.optional(v.string()),
    attempts: v.optional(v.float64()),
    assignmentWeight: v.optional(v.float64()),
    cohortId: v.optional(v.string()),
    completedAt: v.float64(),
    conceptIds: v.optional(v.array(v.string())),
    confidenceScore: v.optional(v.float64()),
    contentReplayCount: v.optional(v.float64()),
    courseId: v.optional(v.string()),
    createdAt: v.optional(v.float64()),
    discussionContributionCount: v.optional(v.float64()),
    dropOffConceptId: v.optional(v.string()),
    helpRequestCount: v.optional(v.float64()),
    inactiveTabRate: v.optional(v.float64()),
    instructorApproved: v.optional(v.union(v.null(), v.boolean())),
    maxScore: v.float64(),
    moduleId: v.string(),
    reReadCount: v.optional(v.float64()),
    responseTimeAvgSec: v.optional(v.float64()),
    resultId: v.string(),
    retentionDelayDays: v.optional(v.union(v.null(), v.float64())),
    rubricScore: v.optional(v.union(v.null(), v.float64())),
    score: v.float64(),
    scoreDeltaAcrossRetakes: v.optional(v.float64()),
    sessionFrequency: v.optional(v.float64()),
    taskId: v.string(),
    taskType: v.string(),
    timeOnTaskSec: v.optional(v.float64()),
    userId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_taskId", ["taskId"])
    .index("by_assessmentId", ["assessmentId"])
    .index("by_cohortId", ["cohortId"])
    .index("by_courseId", ["courseId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_userId_taskId", ["userId", "taskId"]),

  tasks: defineTable({
    assignmentWeight: v.optional(v.float64()),
    conceptId: v.string(),
    maxScore: v.optional(v.float64()),
    moduleId: v.string(),
    taskId: v.optional(v.string()),
    task_id: v.optional(v.string()),
    title: v.optional(v.string()),
    type: v.string(),
  })
    .index("by_conceptId", ["conceptId"])
    .index("by_moduleId", ["moduleId"]),

  courses: defineTable({
    courseId: v.string(),
    title: v.string(),
    cohortHealthScore: v.float64(),
    studentsAtRisk: v.float64(),
    frictionModules: v.array(v.string()),
    totalStudents: v.float64(),
    diagnosisHighMastery: v.float64(),
    diagnosisOnTrack: v.float64(),
    diagnosisAtRisk: v.float64(),
    diagnosisDisengaged: v.float64(),
    masteryScore: v.float64(),
    applicationScore: v.float64(),
    applicationMax: v.float64(),
    retrievalScore: v.float64(),
    retrievalMax: v.float64(),
    retentionScore: v.float64(),
    retentionMax: v.float64(),
    behaviourScore: v.float64(),
    behaviourMax: v.float64(),
  }).index("by_courseId", ["courseId"]),

  course_dashboard_configs: defineTable({
    courseId: v.string(),
    masteryWeights: v.object({
      applicationPct: v.float64(),
      retrievalPct: v.float64(),
      retentionPct: v.float64(),
      behaviourPct: v.float64(),
    }),
    diagnosisThresholds: v.object({
      highMasteryMin: v.float64(),
      onTrackMin: v.float64(),
      atRiskMin: v.float64(),
    }),
    updatedAt: v.float64(),
  }).index("by_courseId", ["courseId"]),

  course_enrollments: defineTable({
    cohortId: v.string(),
    courseId: v.string(),
    enrolledAt: v.float64(),
    enrollmentId: v.string(),
    lastActivityAt: v.float64(),
    status: v.string(),
    userId: v.string(),
    completionPct: v.optional(v.float64()),
    insightsScore: v.optional(v.float64()),
    isAtRisk: v.optional(v.boolean()),
    targetCompletionDate: v.optional(v.string()),
  })
    .index("by_courseId", ["courseId"])
    .index("by_userId", ["userId"])
    .index("by_cohortId", ["cohortId"])
    .index("by_courseId_userId", ["courseId", "userId"]),

  course_assessments: defineTable({
    courseId: v.string(),
    assessmentId: v.optional(v.string()),
    assessmentType: v.string(),
    assessmentKind: v.optional(v.string()),
    moduleLesson: v.string(),
    moduleId: v.optional(v.string()),
    assessmentName: v.optional(v.string()),
    aiAssistedGrading: v.optional(v.boolean()),
    instructions: v.optional(v.string()),
    rubric: v.optional(
      v.array(
        v.object({
          criterion: v.string(),
          description: v.optional(v.string()),
          weightPct: v.float64(),
        }),
      ),
    ),
    dueDate: v.float64(),
    status: v.string(),
    averageScore: v.optional(v.float64()),
    order: v.float64(),
  })
    .index("by_courseId", ["courseId"])
    .index("by_assessmentId", ["assessmentId"])
    .index("by_courseId_status", ["courseId", "status"]),

  score_history: defineTable({
    userId: v.string(),
    applicationScore: v.float64(),
    comprehensionScore: v.float64(),
    retentionScore: v.float64(),
    behavioralScore: v.float64(),
    masteryScore: v.float64(),
    riskBucket: v.string(),
    calculatedAt: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_calculatedAt", ["userId", "calculatedAt"]),

  course_mastery_history: defineTable({
    cohortId: v.string(),
    courseId: v.optional(v.string()),
    userId: v.string(),
    moduleId: v.string(),
    applicationScore: v.float64(),
    comprehensionScore: v.float64(),
    insightsScore: v.optional(v.float64()),
    retentionScore: v.float64(),
    behavioralScore: v.float64(),
    masteryScore: v.float64(),
    riskBucket: v.string(),
    calculatedAt: v.float64(),
  })
    .index("by_cohortId", ["cohortId"])
    .index("by_courseId", ["courseId"])
    .index("by_userId", ["userId"])
    .index("by_cohortId_moduleId_calculatedAt", ["cohortId", "moduleId", "calculatedAt"]),

  module_insights: defineTable({
    courseId: v.string(),
    moduleId: v.string(),
    moduleLabel: v.string(),
    courseTitle: v.string(),
    /** Module-level mastery score (0–100) for this module. */
    averageScore: v.float64(),
    /** Cohort-level overall risk label for "Cohort Performance" (Low / Moderate / High). */
    cohortRiskBucket: v.string(),
  })
    .index("by_courseId", ["courseId"]),

  concept_mastery_scores: defineTable({
    cohortId: v.string(),
    courseId: v.string(),
    moduleId: v.string(),
    conceptId: v.string(),
    userId: v.string(),
    applicationScore: v.optional(v.float64()),
    masteryScore: v.float64(),
    comprehensionScore: v.optional(v.float64()),
    calculatedAt: v.float64(),
    engagementScore: v.optional(v.float64()),
    insightsScore: v.optional(v.float64()),
    isAtRisk: v.optional(v.boolean()),
    /** Time period for filtering, e.g. "2026-01" for January 2026. Optional for backwards compatibility. */
    periodKey: v.optional(v.string()),
  })
    .index("by_courseId", ["courseId"])
    .index("by_moduleId", ["moduleId"])
    .index("by_moduleId_periodKey", ["moduleId", "periodKey"])
    .index("by_moduleId_conceptId", ["moduleId", "conceptId"])
    .index("by_userId", ["userId"]),

  user: defineTable({
    applicationScore: v.optional(v.float64()),
    behavioralScore: v.optional(v.float64()),
    cohortId: v.string(),
    comprehensionScore: v.optional(v.float64()),
    createdAt: v.float64(),
    email: v.string(),
    insightsScore: v.optional(v.float64()),
    jobTitle: v.optional(v.string()),
    lastActiveAt: v.optional(v.float64()),
    lastScoreUpdateAt: v.optional(v.float64()),
    masteryScore: v.optional(v.float64()),
    name: v.string(),
    organization: v.optional(v.string()),
    personaTag: v.optional(v.string()),
    retentionScore: v.optional(v.float64()),
    riskBucket: v.optional(v.string()),
    riskLevel: v.optional(v.string()),
    role: v.string(),
    userId: v.optional(v.string()),
  })
    .index("by_cohortId", ["cohortId"])
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]),
});
