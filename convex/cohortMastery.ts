import { query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_COHORT_ID = "cohort_ai_001";
const SERIES_COLORS = ["#9727fc", "#3cc3df", "#ff8a9e", "#ffae4c", "#22c55e", "#6366f1"];

export const getCourseProgressTrend = query({
  args: { cohortId: v.optional(v.string()) },
  handler: async (ctx, { cohortId: inputCohortId }) => {
    const cohortId = inputCohortId ?? DEFAULT_COHORT_ID;

    const modules = await ctx.db
      .query("modules")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .collect();

    const snapshots = await ctx.db
      .query("course_mastery_history")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .collect();

    if (snapshots.length === 0) {
      return {
        courses: modules.map((m, i) => ({
          moduleId: m.moduleId,
          title: m.title,
          color: SERIES_COLORS[i % SERIES_COLORS.length],
        })),
        chartData: [] as Array<Record<string, number | string>>,
      };
    }

    // Keep last 4 weekly buckets for Figma-like Week 1..Week 4 axis.
    const nowSec = Date.now() / 1000;
    const oneWeek = 7 * 24 * 3600;
    const starts = [3, 2, 1, 0].map((wAgo) => nowSec - (wAgo + 1) * oneWeek);
    const ends = [3, 2, 1, 0].map((wAgo) => nowSec - wAgo * oneWeek);
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];

    const moduleMeta = new Map(modules.map((m, i) => [m.moduleId, {
      moduleId: m.moduleId,
      title: m.title,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }]));

    // Include modules from snapshots even if not in modules table.
    for (const s of snapshots) {
      if (!moduleMeta.has(s.moduleId)) {
        moduleMeta.set(s.moduleId, {
          moduleId: s.moduleId,
          title: s.moduleId,
          color: SERIES_COLORS[moduleMeta.size % SERIES_COLORS.length],
        });
      }
    }

    const courseList = Array.from(moduleMeta.values());

    const chartData = weekLabels.map((label, i) => {
      const start = starts[i];
      const end = ends[i];
      const row: Record<string, number | string> = { week: label };

      for (const c of courseList) {
        const inBucket = snapshots.filter(
          (s) => s.moduleId === c.moduleId && s.calculatedAt >= start && s.calculatedAt < end
        );
        if (inBucket.length > 0) {
          row[c.moduleId] = Math.round(
            inBucket.reduce((acc, s) => acc + s.masteryScore, 0) / inBucket.length
          );
          continue;
        }

        // If no bucket data, carry forward nearest historical point for smooth lines.
        const older = snapshots
          .filter((s) => s.moduleId === c.moduleId && s.calculatedAt < end)
          .sort((a, b) => b.calculatedAt - a.calculatedAt)[0];
        row[c.moduleId] = older ? Math.round(older.masteryScore) : 0;
      }

      return row;
    });

    return {
      courses: courseList,
      chartData,
    };
  },
});

