/**
 * Seeds task_results and recomputes all metrics for every learner in a cohort.
 * Call from the dashboard "Seed demo data" to populate metrics so the dashboard is fully dynamic.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { computeScoresFromResults } from "./scoreUtils";

const DEMO_MODULE_ID = "seed_demo_module";
const DEMO_COHORT_ID = "cohort_ai_001";

/** Seed task_results for all learners in a cohort and recalculate their scores. Idempotent: run multiple times to refresh. */
export const seedCohortLearnerMetrics = mutation({
  args: { cohortId: v.optional(v.string()) },
  handler: async (ctx, { cohortId: inputCohortId }) => {
    const cohortId = inputCohortId ?? DEMO_COHORT_ID;
    const users = await ctx.db
      .query("user")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .collect();
    const learners = users.filter((u) => u.role === "learner");
    if (learners.length === 0) return { seeded: 0, message: "No learners in cohort" };

    const nowSec = Date.now() / 1000;
    const oneWeek = 7 * 24 * 3600;

    let inserted = 0;
    for (const user of learners) {
      const userId = user.userId ?? String(user._id);

      // Varied demo results so each learner gets different scores and buckets
      const seedResults: Array<{
        taskType: string;
        score: number;
        maxScore: number;
        attempts?: number;
        responseTimeAvgSec?: number;
        rubricScore?: number;
        instructorApproved?: boolean;
        retentionDelayDays?: number;
        sessionFrequency?: number;
        inactiveTabRate?: number;
        assignmentWeight?: number;
        completedAt: number;
      }> = [];

      const base = (users.indexOf(user) % 5) * 8;
      // Quizzes (retrieval)
      for (let i = 0; i < 4; i++) {
        seedResults.push({
          taskType: "quiz",
          score: Math.min(100, 55 + base + i * 6 + (i % 2) * 10),
          maxScore: 100,
          attempts: i === 0 ? 1 : 2,
          responseTimeAvgSec: 30 + i * 5,
          completedAt: nowSec - (4 - i) * oneWeek - i * 3600,
        });
      }
      // Assignments (application)
      for (let i = 0; i < 3; i++) {
        seedResults.push({
          taskType: "assignment",
          score: Math.min(100, 60 + base + i * 8),
          maxScore: 100,
          assignmentWeight: i === 0 ? 1.5 : 1,
          rubricScore: Math.min(100, 65 + base + i * 5),
          instructorApproved: i < 2,
          completedAt: nowSec - (3 - i) * oneWeek - (i + 2) * 3600,
        });
      }
      // One retention (follow-up) result
      seedResults.push({
        taskType: "quiz",
        score: Math.min(100, 50 + base + 5),
        maxScore: 100,
        retentionDelayDays: 14,
        completedAt: nowSec - oneWeek,
      });
      // Behavior signals (session + inactive)
      seedResults.push({
        taskType: "quiz",
        score: 70,
        maxScore: 100,
        sessionFrequency: 2 + (users.indexOf(user) % 3),
        inactiveTabRate: (users.indexOf(user) % 4) === 2 ? 0.18 : 0.08,
        completedAt: nowSec - 2 * 3600,
      });

      for (let i = 0; i < seedResults.length; i++) {
        const r = seedResults[i];
        await ctx.db.insert("task_results", {
          userId,
          taskId: `seed_${userId}_${i}`,
          moduleId: DEMO_MODULE_ID,
          taskType: r.taskType,
          score: r.score,
          maxScore: r.maxScore,
          completedAt: r.completedAt,
          resultId: `seed_result_${userId}_${i}_${nowSec}`,
          cohortId,
          attempts: r.attempts,
          responseTimeAvgSec: r.responseTimeAvgSec,
          rubricScore: r.rubricScore,
          instructorApproved: r.instructorApproved,
          retentionDelayDays: r.retentionDelayDays,
          sessionFrequency: r.sessionFrequency,
          inactiveTabRate: r.inactiveTabRate,
          assignmentWeight: r.assignmentWeight,
          createdAt: nowSec,
        });
        inserted++;
      }

      // Recalculate and patch user
      const allResults = await ctx.db
        .query("task_results")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      const computed = computeScoresFromResults(allResults, user, nowSec);
      await ctx.db.patch(user._id, {
        applicationScore: computed.applicationScore,
        comprehensionScore: computed.comprehensionScore,
        retentionScore: computed.retentionScore,
        behavioralScore: computed.behavioralScore,
        masteryScore: computed.masteryScore,
        riskBucket: computed.riskBucket,
        riskLevel: computed.riskBucket,
        lastScoreUpdateAt: nowSec,
        lastActiveAt: nowSec,
      });
    }

    return { seeded: learners.length, inserted, message: `Seeded ${learners.length} learners, ${inserted} task results.` };
  },
});
