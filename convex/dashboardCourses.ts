import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const getByCourseId = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    return await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .unique();
  },
});

export const listAssessments = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const rows = await ctx.db
      .query("course_assessments")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const listModuleInsights = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const rows = await ctx.db
      .query("module_insights")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
    return rows.sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel, undefined, { numeric: true }));
  },
});
