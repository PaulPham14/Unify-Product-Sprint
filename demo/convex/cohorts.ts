import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get a cohort by Convex document _id */
export const get = query({
  args: { id: v.id("cohort") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** Get a cohort by cohortId string */
export const getByCohortId = query({
  args: { cohortId: v.string() },
  handler: async (ctx, { cohortId }) => {
    return await ctx.db
      .query("cohort")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .unique();
  },
});

/** List cohorts for an instructor */
export const listByInstructor = query({
  args: { instructorId: v.string() },
  handler: async (ctx, { instructorId }) => {
    return await ctx.db
      .query("cohort")
      .withIndex("by_instructorId", (q) => q.eq("instructorId", instructorId))
      .collect();
  },
});

/** List cohorts by status */
export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, { status }) => {
    return await ctx.db
      .query("cohort")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
  },
});
