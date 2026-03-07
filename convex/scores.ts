/**
 * Score recalculation per spec:
 * - Overall mastery = Application 40% + Retrieval 30% + Retention 20% + Behavior 10%
 * - Retrieval: quizzes, knowledge checks (score, attempts, response time, score delta retakes)
 * - Application: assignments (grades, weights, instructor approval, rubric)
 * - Retention: follow-up / same question later (retentionDelayDays, score)
 * - Behavior: session frequency/recency, drop-off, inactive tabs (>15% significant)
 * - Bucket: High Mastery 85-100, On Track 65-84, At Risk 50-64, Disengaged 0-49 or inactive
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MASTERY_WEIGHTS = { application: 0.4, retrieval: 0.3, retention: 0.2, behavior: 0.1 };
const BUCKET_HIGH = 85;
const BUCKET_ON_TRACK = 65;
const BUCKET_AT_RISK = 50;
const INACTIVE_TAB_THRESHOLD = 0.15;
const DISENGAGED_DAYS = 30;

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
    const lastActive = user.lastActiveAt ?? nowSec;
    const daysSinceActive = (nowSec - lastActive) / 86400;

    // —— Retrieval (30%): quiz / knowledge-check ——
    const quizTypes = ["quiz", "knowledge_check", "knowledge check", "check your understanding"];
    const quizResults = results.filter((r) =>
      quizTypes.some((t) => (r.taskType ?? "").toLowerCase().includes(t))
    );
    let retrievalScore = 0;
    if (quizResults.length > 0) {
      const withPenalty = quizResults.map((r) => {
        const pct = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
        const attemptPenalty = 1 / (1 + 0.08 * Math.max(0, (r.attempts ?? 1) - 1));
        return pct * attemptPenalty;
      });
      retrievalScore = withPenalty.reduce((a, b) => a + b, 0) / withPenalty.length;
    }

    // —— Application (40%): assignments (weights, rubric, instructor approval) ——
    const assignmentResults = results.filter((r) =>
      (r.taskType ?? "").toLowerCase().includes("assignment")
    );
    let applicationScore = 0;
    if (assignmentResults.length > 0) {
      let weightedSum = 0;
      let weightSum = 0;
      for (const r of assignmentResults) {
        const w = r.assignmentWeight ?? 1;
        const pct = r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0;
        let value = pct;
        if (r.rubricScore != null) value = 0.7 * value + 0.3 * r.rubricScore;
        if (r.instructorApproved === false) value *= 0.8;
        weightedSum += value * w;
        weightSum += w;
      }
      applicationScore = weightSum > 0 ? weightedSum / weightSum : 0;
    }

    // —— Retention (20%): follow-up / same question later ——
    const retentionResults = results.filter(
      (r) => r.retentionDelayDays != null && r.retentionDelayDays > 0
    );
    let retentionScore = 0;
    if (retentionResults.length > 0) {
      retentionScore =
        retentionResults.reduce((acc, r) => {
          return acc + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0);
        }, 0) / retentionResults.length;
    }

    // —— Behavior (10%): session frequency, recency, inactive tabs ——
    const avgInactive = results.length
      ? results.reduce((a, r) => a + (r.inactiveTabRate ?? 0), 0) / results.length
      : 0;
    const avgSessionFreq = results.length
      ? results.reduce((a, r) => a + (r.sessionFrequency ?? 0), 0) / results.length
      : 0;
    let behaviorScore = 100;
    if (avgInactive > INACTIVE_TAB_THRESHOLD) behaviorScore -= Math.min(40, avgInactive * 80);
    if (daysSinceActive > DISENGAGED_DAYS) behaviorScore -= 40;
    else if (daysSinceActive > 14) behaviorScore -= 20;
    behaviorScore += Math.min(15, (avgSessionFreq / 10) * 15);
    behaviorScore = Math.max(0, Math.min(100, behaviorScore));

    // Overall mastery (0–100)
    const masteryScore =
      applicationScore * MASTERY_WEIGHTS.application +
      retrievalScore * MASTERY_WEIGHTS.retrieval +
      retentionScore * MASTERY_WEIGHTS.retention +
      behaviorScore * MASTERY_WEIGHTS.behavior;

    // Cohort diagnosis bucket
    let riskBucket: string;
    if (daysSinceActive > DISENGAGED_DAYS && results.length > 0) {
      riskBucket = "disengaged";
    } else if (masteryScore >= BUCKET_HIGH) {
      riskBucket = "high_mastery";
    } else if (masteryScore >= BUCKET_ON_TRACK) {
      riskBucket = "on_track";
    } else if (masteryScore >= BUCKET_AT_RISK) {
      riskBucket = "at_risk";
    } else {
      riskBucket = "disengaged";
    }

    await ctx.db.patch(user._id, {
      applicationScore: Math.round(applicationScore * 100) / 100,
      comprehensionScore: Math.round(retrievalScore * 100) / 100,
      retentionScore: Math.round(retentionScore * 100) / 100,
      behavioralScore: Math.round(behaviorScore * 100) / 100,
      masteryScore: Math.round(masteryScore * 100) / 100,
      riskBucket,
      riskLevel: riskBucket,
      lastScoreUpdateAt: nowSec,
    });

    return user._id;
  },
});
