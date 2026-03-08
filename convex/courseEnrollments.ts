import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    return await ctx.db
      .query("course_enrollments")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("course_enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("course_enrollments")
      .withIndex("by_courseId_userId", (q) =>
        q.eq("courseId", args.courseId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("course_enrollments", args);
  },
});
