import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Get a task result by Convex document _id */
export const get = query({
  args: { id: v.id("task_results") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** List task results for a user */
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("task_results")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** List task results for a task */
export const listByTask = query({
  args: { taskId: v.string() },
  handler: async (ctx, { taskId }) => {
    return await ctx.db
      .query("task_results")
      .withIndex("by_taskId", (q) => q.eq("taskId", taskId))
      .collect();
  },
});

/** Get a user's result for a specific task (e.g. for upsert) */
export const getByUserAndTask = query({
  args: { userId: v.string(), taskId: v.string() },
  handler: async (ctx, { userId, taskId }) => {
    return await ctx.db
      .query("task_results")
      .withIndex("by_userId_taskId", (q) =>
        q.eq("userId", userId).eq("taskId", taskId)
      )
      .unique();
  },
});

/** Insert a task result. After calling this, call scores.recalculateScoresForUser({ userId }) to update the user's mastery scores. */
export const insert = mutation({
  args: {
    userId: v.string(),
    taskId: v.string(),
    moduleId: v.string(),
    taskType: v.string(),
    score: v.float64(),
    maxScore: v.float64(),
    completedAt: v.float64(),
    resultId: v.string(),
    assignmentWeight: v.optional(v.float64()),
    cohortId: v.optional(v.string()),
    confidenceScore: v.optional(v.float64()),
    conceptIds: v.optional(v.array(v.string())),
    contentReplayCount: v.optional(v.float64()),
    courseId: v.optional(v.string()),
    attempts: v.optional(v.float64()),
    discussionContributionCount: v.optional(v.float64()),
    dropOffConceptId: v.optional(v.string()),
    helpRequestCount: v.optional(v.float64()),
    responseTimeAvgSec: v.optional(v.float64()),
    inactiveTabRate: v.optional(v.float64()),
    reReadCount: v.optional(v.float64()),
    sessionFrequency: v.optional(v.float64()),
    retentionDelayDays: v.optional(v.union(v.null(), v.float64())),
    rubricScore: v.optional(v.union(v.null(), v.float64())),
    scoreDeltaAcrossRetakes: v.optional(v.float64()),
    instructorApproved: v.optional(v.union(v.null(), v.boolean())),
    timeOnTaskSec: v.optional(v.float64()),
    createdAt: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("task_results", {
      ...args,
      createdAt: args.createdAt ?? Date.now() / 1000,
    });
  },
});

/** Update a task result by _id */
export const patch = mutation({
  args: {
    id: v.id("task_results"),
    score: v.optional(v.float64()),
    attempts: v.optional(v.float64()),
    confidenceScore: v.optional(v.float64()),
    contentReplayCount: v.optional(v.float64()),
    discussionContributionCount: v.optional(v.float64()),
    helpRequestCount: v.optional(v.float64()),
    responseTimeAvgSec: v.optional(v.float64()),
    reReadCount: v.optional(v.float64()),
    rubricScore: v.optional(v.union(v.null(), v.float64())),
    instructorApproved: v.optional(v.union(v.null(), v.boolean())),
    timeOnTaskSec: v.optional(v.float64()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, updates);
    return id;
  },
});
