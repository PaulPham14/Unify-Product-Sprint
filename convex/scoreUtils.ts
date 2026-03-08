/**
 * Pure score calculation used by scores.recalculateScoresForUser and seed.
 * Inputs are plain objects (no Convex Doc dependency).
 */

const MASTERY_WEIGHTS = { application: 0.4, retrieval: 0.3, retention: 0.2, behavior: 0.1 };
const BUCKET_HIGH = 85;
const BUCKET_ON_TRACK = 65;
const BUCKET_AT_RISK = 50;
const INACTIVE_TAB_THRESHOLD = 0.15;
const DISENGAGED_DAYS = 30;

type ResultLike = {
  taskType?: string | null;
  score: number;
  maxScore: number;
  attempts?: number | null;
  assignmentWeight?: number | null;
  rubricScore?: number | null;
  instructorApproved?: boolean | null;
  retentionDelayDays?: number | null;
  inactiveTabRate?: number | null;
  sessionFrequency?: number | null;
};

type UserLike = {
  lastActiveAt?: number | null;
};

export type ComputedScores = {
  applicationScore: number;
  comprehensionScore: number;
  retentionScore: number;
  behavioralScore: number;
  masteryScore: number;
  riskBucket: string;
};

export function getRiskBucketForMasteryScore({
  masteryScore,
  daysSinceActive,
  hasActivityData,
}: {
  masteryScore: number;
  daysSinceActive: number;
  hasActivityData: boolean;
}) {
  if (daysSinceActive > DISENGAGED_DAYS && hasActivityData) {
    return "disengaged";
  }
  if (masteryScore >= BUCKET_HIGH) {
    return "high_mastery";
  }
  if (masteryScore >= BUCKET_ON_TRACK) {
    return "on_track";
  }
  if (masteryScore >= BUCKET_AT_RISK) {
    return "at_risk";
  }
  return "disengaged";
}

export function computeScoresFromResults(
  results: ResultLike[],
  user: UserLike,
  nowSec: number = Date.now() / 1000
): ComputedScores {
  const lastActive = user.lastActiveAt ?? nowSec;
  const daysSinceActive = (nowSec - lastActive) / 86400;

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

  const masteryScore =
    applicationScore * MASTERY_WEIGHTS.application +
    retrievalScore * MASTERY_WEIGHTS.retrieval +
    retentionScore * MASTERY_WEIGHTS.retention +
    behaviorScore * MASTERY_WEIGHTS.behavior;

  const riskBucket = getRiskBucketForMasteryScore({
    masteryScore,
    daysSinceActive,
    hasActivityData: results.length > 0,
  });

  return {
    applicationScore: Math.round(applicationScore * 100) / 100,
    comprehensionScore: Math.round(retrievalScore * 100) / 100,
    retentionScore: Math.round(retentionScore * 100) / 100,
    behavioralScore: Math.round(behaviorScore * 100) / 100,
    masteryScore: Math.round(masteryScore * 100) / 100,
    riskBucket,
  };
}
