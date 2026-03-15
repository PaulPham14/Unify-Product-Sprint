import { query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_COHORT_ID = "cohort_ai_001";
const SERIES_COLORS = ["#025dfe", "#3cc3df", "#ff8a9e", "#ffae4c", "#22c55e", "#6366f1"];

export const getCourseProgressTrend = query({
  args: { cohortId: v.optional(v.string()) },
  handler: async (ctx, { cohortId: inputCohortId }) => {
    const cohortId = inputCohortId ?? DEFAULT_COHORT_ID;

    const [modules, courseDocs, snapshots] = await Promise.all([
      ctx.db
        .query("modules")
        .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
        .collect(),
      ctx.db.query("courses").collect(),
      ctx.db
        .query("course_mastery_history")
        .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
        .collect(),
    ]);

    // Keep last 4 weekly buckets for Figma-like Week 1..Week 4 axis.
    const nowSec = Date.now() / 1000;
    const oneWeek = 7 * 24 * 3600;
    const starts = [3, 2, 1, 0].map((wAgo) => nowSec - (wAgo + 1) * oneWeek);
    const ends = [3, 2, 1, 0].map((wAgo) => nowSec - wAgo * oneWeek);
    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];

    const courseTitleById = new Map(courseDocs.map((c) => [c.courseId, c.title]));
    const moduleToCourseId = new Map(
      modules
        .filter((m) => !!m.courseId)
        .map((m) => [m.moduleId, m.courseId as string]),
    );

    const courseIdsFromModules = modules
      .map((m) => m.courseId)
      .filter((id): id is string => !!id);
    const courseIdsFromSnapshots = snapshots
      .map((s) => s.courseId ?? moduleToCourseId.get(s.moduleId))
      .filter((id): id is string => !!id);
    const allCourseIds = Array.from(new Set([...courseIdsFromModules, ...courseIdsFromSnapshots]));

    const courseList = allCourseIds.map((courseId, i) => ({
      courseId,
      title: courseTitleById.get(courseId) ?? courseId,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    }));

    if (courseList.length === 0) {
      return {
        courses: [] as Array<{ courseId: string; title: string; color: string }>,
        chartData: [] as Array<Record<string, number | string>>,
      };
    }

    // Build chart so Course Progress starts low and increases over weeks (Week 1 = oldest, Week 4 = latest).
    // When a week has no data, use the previous week's value (never pull a high recent value into an older week).
    const chartData: Array<Record<string, number | string>> = [];
    for (let i = 0; i < weekLabels.length; i++) {
      const start = starts[i];
      const end = ends[i];
      const row: Record<string, number | string> = { week: weekLabels[i] };

      for (const c of courseList) {
        const inBucket = snapshots.filter((s) => {
          const snapshotCourseId = s.courseId ?? moduleToCourseId.get(s.moduleId);
          return snapshotCourseId === c.courseId && s.calculatedAt >= start && s.calculatedAt < end;
        });
        if (inBucket.length > 0) {
          row[c.courseId] = Math.round(
            inBucket.reduce((acc, s) => acc + s.masteryScore, 0) / inBucket.length
          );
          continue;
        }

        const prevValue = i > 0 ? (chartData[i - 1][c.courseId] as number | undefined) : undefined;
        row[c.courseId] = typeof prevValue === "number" ? prevValue : 0;
      }

      chartData.push(row);
    }

    return {
      courses: courseList,
      chartData,
    };
  },
});
