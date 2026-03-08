import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get a module by Convex document _id */
export const get = query({
  args: { id: v.id("modules") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** Get a module by moduleId string */
export const getByModuleId = query({
  args: { moduleId: v.string() },
  handler: async (ctx, { moduleId }) => {
    return await ctx.db
      .query("modules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
      .unique();
  },
});

/** List modules for a cohort */
export const listByCohort = query({
  args: { cohortId: v.string() },
  handler: async (ctx, { cohortId }) => {
    return await ctx.db
      .query("modules")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .collect();
  },
});

/** List modules for an instructor */
export const listByInstructor = query({
  args: { instructorId: v.string() },
  handler: async (ctx, { instructorId }) => {
    return await ctx.db
      .query("modules")
      .withIndex("by_instructorId", (q) => q.eq("instructorId", instructorId))
      .collect();
  },
});

/** List modules for a course */
export const listByCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    return await ctx.db
      .query("modules")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
  },
});
