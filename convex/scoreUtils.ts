/**
 * Pure score calculation used by scores.recalculateScoresForUser and seed.
 * Inputs are plain objects (no Convex Doc dependency).
 */

const INACTIVE_TAB_THRESHOLD = 0.15;
const DISENGAGED_DAYS = 30;

export type MasteryWeights = {
  applicationPct: number;
  retrievalPct: number;
  retentionPct: number;
  behaviourPct: number;
};

export type DiagnosisThresholds = {
  highMasteryMin: number;
  onTrackMin: number;
  atRiskMin: number;
};

export type CourseDashboardConfig = {
  masteryWeights: MasteryWeights;
  diagnosisThresholds: DiagnosisThresholds;
};

const DEFAULT_MASTERY_WEIGHTS: MasteryWeights = {
  applicationPct: 40,
  retrievalPct: 30,
  retentionPct: 20,
  behaviourPct: 10,
};

const DEFAULT_DIAGNOSIS_THRESHOLDS: DiagnosisThresholds = {
  highMasteryMin: 85,
  onTrackMin: 70,
  atRiskMin: 50,
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function getDefaultCourseDashboardConfig(): CourseDashboardConfig {
  return {
    masteryWeights: { ...DEFAULT_MASTERY_WEIGHTS },
    diagnosisThresholds: { ...DEFAULT_DIAGNOSIS_THRESHOLDS },
  };
}

export function resolveCourseDashboardConfig(
  config: Partial<CourseDashboardConfig> | null | undefined
): CourseDashboardConfig {
  const defaults = getDefaultCourseDashboardConfig();
  return {
    masteryWeights: {
      ...defaults.masteryWeights,
      ...(config?.masteryWeights ?? {}),
    },
    diagnosisThresholds: {
      ...defaults.diagnosisThresholds,
      ...(config?.diagnosisThresholds ?? {}),
    },
  };
}

export function validateMasteryWeights(weights: MasteryWeights) {
  const entries = Object.entries(weights);
  if (entries.some(([, value]) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error("Mastery weights must be between 0 and 100.");
  }

  const total = round2(entries.reduce((sum, [, value]) => sum + value, 0));
  if (total !== 100) {
    throw new Error("Mastery weights must sum to 100.");
  }
}

export function validateDiagnosisThresholds(thresholds: DiagnosisThresholds) {
  const { highMasteryMin, onTrackMin, atRiskMin } = thresholds;
  const values = [highMasteryMin, onTrackMin, atRiskMin];
  if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
    throw new Error("Diagnosis thresholds must be between 0 and 100.");
  }
  if (!(highMasteryMin > onTrackMin && onTrackMin > atRiskMin)) {
    throw new Error("Diagnosis thresholds must descend without overlap.");
  }
}

export function computeMasteryFromComponents({
  applicationScore,
  retrievalScore,
  retentionScore,
  behaviourScore,
  masteryWeights = DEFAULT_MASTERY_WEIGHTS,
}: {
  applicationScore: number;
  retrievalScore: number;
  retentionScore: number;
  behaviourScore: number;
  masteryWeights?: MasteryWeights;
}) {
  validateMasteryWeights(masteryWeights);
  return (
    applicationScore * (masteryWeights.applicationPct / 100) +
    retrievalScore * (masteryWeights.retrievalPct / 100) +
    retentionScore * (masteryWeights.retentionPct / 100) +
    behaviourScore * (masteryWeights.behaviourPct / 100)
  );
}

export function getDiagnosisBucketForMasteryScore({
  masteryScore,
  daysSinceActive,
  hasActivityData,
  diagnosisThresholds = DEFAULT_DIAGNOSIS_THRESHOLDS,
}: {
  masteryScore: number;
  daysSinceActive: number;
  hasActivityData: boolean;
  diagnosisThresholds?: DiagnosisThresholds;
}) {
  validateDiagnosisThresholds(diagnosisThresholds);

  if (daysSinceActive > DISENGAGED_DAYS && hasActivityData) {
    return "disengaged";
  }
  if (masteryScore >= diagnosisThresholds.highMasteryMin) {
    return "high_mastery";
  }
  if (masteryScore >= diagnosisThresholds.onTrackMin) {
    return "on_track";
  }
  if (masteryScore >= diagnosisThresholds.atRiskMin) {
    return "at_risk";
  }
  return "disengaged";
}

type ResultLike = {
  taskType?: string | null;
  score: number;
  maxScore: number;
  attempts?: number | null;
  assignmentWeight?: number | null;
  confidenceScore?: number | null;
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
  insightsScore: number;
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
  return getDiagnosisBucketForMasteryScore({
    masteryScore,
    daysSinceActive,
    hasActivityData,
    diagnosisThresholds: DEFAULT_DIAGNOSIS_THRESHOLDS,
  });
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
  const confidenceResults = results.filter(
    (result) => result.confidenceScore != null
  );
  const avgConfidence = confidenceResults.length
    ? confidenceResults.reduce((sum, result) => sum + (result.confidenceScore ?? 0), 0) /
      confidenceResults.length
    : 70;
  let behaviorScore = 100;
  if (avgInactive > INACTIVE_TAB_THRESHOLD) behaviorScore -= Math.min(40, avgInactive * 80);
  if (daysSinceActive > DISENGAGED_DAYS) behaviorScore -= 40;
  else if (daysSinceActive > 14) behaviorScore -= 20;
  behaviorScore += Math.min(15, (avgSessionFreq / 10) * 15);
  behaviorScore = Math.max(0, Math.min(100, behaviorScore));

  const insightsScore = Math.max(
    0,
    Math.min(
      100,
      applicationScore * 0.3 +
        retrievalScore * 0.25 +
        retentionScore * 0.15 +
        behaviorScore * 0.2 +
        avgConfidence * 0.1
    )
  );

  const masteryScore = computeMasteryFromComponents({
    applicationScore,
    retrievalScore,
    retentionScore,
    behaviourScore: behaviorScore,
    masteryWeights: DEFAULT_MASTERY_WEIGHTS,
  });

  const riskBucket = getRiskBucketForMasteryScore({
    masteryScore,
    daysSinceActive,
    hasActivityData: results.length > 0,
  });

  return {
    applicationScore: round2(applicationScore),
    comprehensionScore: round2(retrievalScore),
    retentionScore: round2(retentionScore),
    behavioralScore: round2(behaviorScore),
    insightsScore: round2(insightsScore),
    masteryScore: round2(masteryScore),
    riskBucket,
  };
}
