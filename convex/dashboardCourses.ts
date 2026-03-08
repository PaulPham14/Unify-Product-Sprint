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

export const getModuleInsight = query({
  args: { courseId: v.string(), moduleId: v.string() },
  handler: async (ctx, { courseId, moduleId }) => {
    const rows = await ctx.db
      .query("module_insights")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
    return rows.find((r) => r.moduleId === moduleId) ?? null;
  },
});

export const listConceptMasteryPeriods = query({
  args: { moduleId: v.string() },
  handler: async (ctx, { moduleId }) => {
    const rows = await ctx.db
      .query("concept_mastery_scores")
      .withIndex("by_moduleId_periodKey", (q) => q.eq("moduleId", moduleId))
      .collect();
    const keys = Array.from(new Set(rows.map((r) => r.periodKey))).sort().reverse();
    return keys;
  },
});

export const listConceptMasteryByModule = query({
  args: { moduleId: v.string(), periodKey: v.optional(v.string()) },
  handler: async (ctx, { moduleId, periodKey }) => {
    const concepts = await ctx.db
      .query("concept")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
      .collect();

    let scores = await ctx.db
      .query("concept_mastery_scores")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
      .collect();

    if (periodKey != null && periodKey !== "") {
      scores = scores.filter((s) => s.periodKey === periodKey);
    } else {
      const periods = await ctx.db
        .query("concept_mastery_scores")
        .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
        .collect();
      const latest = Array.from(new Set(periods.map((r) => r.periodKey))).sort().reverse()[0];
      if (latest) scores = scores.filter((s) => s.periodKey === latest);
    }

    const userIds = Array.from(new Set(scores.map((s) => s.userId)));
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await ctx.db
          .query("user")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();
        return [userId, user?.name ?? userId] as const;
      }),
    );
    const userNameMap = new Map(users);

    return concepts
      .map((conceptDoc) => {
        const conceptId = conceptDoc.conceptId ?? conceptDoc.concept_id;
        if (!conceptId) return null;
        const points = scores
          .filter((s) => s.conceptId === conceptId)
          .sort((a, b) => a.userId.localeCompare(b.userId))
          .map((s) => ({
            userId: s.userId,
            userName: userNameMap.get(s.userId) ?? s.userId,
            masteryScore: s.masteryScore,
          }));
        return {
          conceptId,
          conceptTitle: conceptDoc.title ?? conceptId,
          points,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  },
});
