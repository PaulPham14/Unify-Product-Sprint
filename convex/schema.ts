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
    createdAt: v.float64(),
    description: v.string(),
    instructorId: v.string(),
    moduleId: v.string(),
    order: v.float64(),
    title: v.string(),
  })
    .index("by_instructorId", ["instructorId"])
    .index("by_cohortId", ["cohortId"])
    .index("by_moduleId", ["moduleId"]),

  task_results: defineTable({
    attempts: v.optional(v.float64()),
    assignmentWeight: v.optional(v.float64()),
    cohortId: v.optional(v.string()),
    completedAt: v.float64(),
    conceptIds: v.optional(v.array(v.string())),
    createdAt: v.optional(v.float64()),
    dropOffConceptId: v.optional(v.string()),
    inactiveTabRate: v.optional(v.float64()),
    instructorApproved: v.optional(v.union(v.null(), v.boolean())),
    maxScore: v.float64(),
    moduleId: v.string(),
    responseTimeAvgSec: v.optional(v.float64()),
    resultId: v.string(),
    retentionDelayDays: v.optional(v.union(v.null(), v.float64())),
    rubricScore: v.optional(v.union(v.null(), v.float64())),
    score: v.float64(),
    scoreDeltaAcrossRetakes: v.optional(v.float64()),
    sessionFrequency: v.optional(v.float64()),
    taskId: v.string(),
    taskType: v.string(),
    userId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_taskId", ["taskId"])
    .index("by_cohortId", ["cohortId"])
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

  user: defineTable({
    applicationScore: v.optional(v.float64()),
    behavioralScore: v.optional(v.float64()),
    cohortId: v.string(),
    comprehensionScore: v.optional(v.float64()),
    createdAt: v.float64(),
    email: v.string(),
    insightsScore: v.optional(v.float64()),
    lastActiveAt: v.optional(v.float64()),
    lastScoreUpdateAt: v.optional(v.float64()),
    masteryScore: v.optional(v.float64()),
    name: v.string(),
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
