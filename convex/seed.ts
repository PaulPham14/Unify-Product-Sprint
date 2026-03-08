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

      // Insert current snapshot into score_history
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

      // Seed 8 weeks of historical score snapshots leading up to current scores.
      // Each week shows gradual progression with some noise so charts look realistic.
      const weeksOfHistory = 8;
      const learnerIdx = users.indexOf(user);
      for (let w = weeksOfHistory; w >= 1; w--) {
        const weekTs = nowSec - w * oneWeek;
        const progress = (weeksOfHistory - w) / weeksOfHistory;
        const jitter = () => (((learnerIdx * 7 + w * 13) % 11) - 5) * 0.8;

        const histApp = Math.round(Math.max(0, Math.min(100,
          computed.applicationScore * (0.55 + 0.45 * progress) + jitter()
        )) * 100) / 100;
        const histRet = Math.round(Math.max(0, Math.min(100,
          computed.comprehensionScore * (0.50 + 0.50 * progress) + jitter()
        )) * 100) / 100;
        const histRetention = Math.round(Math.max(0, Math.min(100,
          computed.retentionScore * (0.45 + 0.55 * progress) + jitter()
        )) * 100) / 100;
        const histBehavior = Math.round(Math.max(0, Math.min(100,
          computed.behavioralScore * (0.70 + 0.30 * progress) + jitter()
        )) * 100) / 100;
        const histMastery = Math.round((
          histApp * 0.4 + histRet * 0.3 + histRetention * 0.2 + histBehavior * 0.1
        ) * 100) / 100;

        let histBucket: string;
        if (histMastery >= 85) histBucket = "high_mastery";
        else if (histMastery >= 65) histBucket = "on_track";
        else if (histMastery >= 50) histBucket = "at_risk";
        else histBucket = "disengaged";

        await ctx.db.insert("score_history", {
          userId,
          applicationScore: histApp,
          comprehensionScore: histRet,
          retentionScore: histRetention,
          behavioralScore: histBehavior,
          masteryScore: histMastery,
          riskBucket: histBucket,
          calculatedAt: weekTs,
        });
      }
    }

    return { seeded: learners.length, inserted, message: `Seeded ${learners.length} learners, ${inserted} task results, plus ${learners.length * 9} score history snapshots.` };
  },
});
