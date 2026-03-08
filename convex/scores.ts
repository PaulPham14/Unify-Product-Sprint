/**
 * Score recalculation per spec:
 * - Overall mastery = Application 40% + Retrieval 30% + Retention 20% + Behavior 10%
 * - Retrieval: quizzes, knowledge checks (score, attempts, response time, score delta retakes)
 * - Application: assignments (grades, weights, instructor approval, rubric)
 * - Retention: follow-up / same question later (retentionDelayDays, score)
 * - Behavior: session frequency/recency, drop-off, inactive tabs (>15% significant)
 * - Bucket: High Mastery 85-100, On Track 65-84, At Risk 50-64, Disengaged 0-49 or inactive
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { computeScoresFromResults } from "./scoreUtils";

/** Recalculate the four component scores, overall mastery, and risk bucket for a user from their task_results. Call after inserting or updating task results. */
export const recalculateScoresForUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) return null;

    const results = await ctx.db
      .query("task_results")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const nowSec = Date.now() / 1000;
    const computed = computeScoresFromResults(results, user, nowSec);

    await ctx.db.patch(user._id, {
      ...computed,
      riskLevel: computed.riskBucket,
      lastScoreUpdateAt: nowSec,
    });

    await ctx.db.insert("score_history", {
      userId,
      applicationScore: computed.applicationScore,
      comprehensionScore: computed.comprehensionScore,
      retentionScore: computed.retentionScore,
      behavioralScore: computed.behavioralScore,
      masteryScore: computed.masteryScore,
      riskBucket: computed.riskBucket,
      calculatedAt: nowSec,
    });

    // Also persist per-course (module) mastery snapshots for cohort-level trend charts.
    const moduleIds = Array.from(new Set(results.map((r) => r.moduleId)));
    const moduleDocs = await Promise.all(
      moduleIds.map(async (moduleId) => {
        const moduleDoc = await ctx.db
          .query("modules")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
          .unique();
        return [moduleId, moduleDoc] as const;
      })
    );
    const moduleDocMap = new Map(moduleDocs);
    for (const moduleId of moduleIds) {
      const moduleResults = results.filter((r) => r.moduleId === moduleId);
      if (moduleResults.length === 0) continue;
      const perCourse = computeScoresFromResults(moduleResults, user, nowSec);
      const moduleDoc = moduleDocMap.get(moduleId);
      await ctx.db.insert("course_mastery_history", {
        cohortId: user.cohortId,
        courseId: moduleDoc?.courseId,
        userId,
        moduleId,
        applicationScore: perCourse.applicationScore,
        comprehensionScore: perCourse.comprehensionScore,
        insightsScore: perCourse.insightsScore,
        retentionScore: perCourse.retentionScore,
        behavioralScore: perCourse.behavioralScore,
        masteryScore: perCourse.masteryScore,
        riskBucket: perCourse.riskBucket,
        calculatedAt: nowSec,
      });
    }

    return user._id;
  },
});
