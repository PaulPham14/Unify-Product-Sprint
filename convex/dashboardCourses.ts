import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { buildCourseLearnerRows } from "./cohortDiagnosis.helpers";
import {
  computeMasteryFromComponents,
  getDefaultCourseDashboardConfig,
  resolveCourseDashboardConfig,
  validateDiagnosisThresholds,
  validateMasteryWeights,
} from "./scoreUtils";

const masteryWeightsValidator = v.object({
  applicationPct: v.float64(),
  retrievalPct: v.float64(),
  retentionPct: v.float64(),
  behaviourPct: v.float64(),
});

const diagnosisThresholdsValidator = v.object({
  highMasteryMin: v.float64(),
  onTrackMin: v.float64(),
  atRiskMin: v.float64(),
});

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function moduleRiskLabel(averageScore: number) {
  if (averageScore >= 80) return "Low";
  if (averageScore >= 65) return "Moderate";
  return "High";
}

function buildLatestSnapshotMap<
  T extends {
    userId: string;
    moduleId: string;
    calculatedAt: number;
  },
>(snapshots: T[]) {
  const latestSnapshots = new Map<string, T>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.userId}:${snapshot.moduleId}`;
    const current = latestSnapshots.get(key);
    if (!current || snapshot.calculatedAt > current.calculatedAt) {
      latestSnapshots.set(key, snapshot);
    }
  }
  return latestSnapshots;
}

async function getCourseDashboardConfigDoc(ctx: QueryCtx | MutationCtx, courseId: string) {
  return await ctx.db
    .query("course_dashboard_configs")
    .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
    .unique();
}

async function upsertCourseDashboardConfig(
  ctx: MutationCtx,
  courseId: string,
  updates: Partial<ReturnType<typeof getDefaultCourseDashboardConfig>>
) {
  const now = Date.now();
  const existing = await getCourseDashboardConfigDoc(ctx, courseId);
  const nextConfig = resolveCourseDashboardConfig({
    masteryWeights: existing?.masteryWeights,
    diagnosisThresholds: existing?.diagnosisThresholds,
    ...updates,
  });

  if (existing) {
    await ctx.db.patch(existing._id, {
      ...nextConfig,
      updatedAt: now,
    });
    return;
  }

  await ctx.db.insert("course_dashboard_configs", {
    courseId,
    ...nextConfig,
    updatedAt: now,
  });
}

async function loadCourseAggregationInputs(
  ctx: QueryCtx,
  courseId: string
) {
  const [configDoc, modules, enrollments, snapshots] = await Promise.all([
    getCourseDashboardConfigDoc(ctx, courseId),
    ctx.db
      .query("modules")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect(),
    ctx.db
      .query("course_enrollments")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect(),
    ctx.db
      .query("course_mastery_history")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect(),
  ]);

  const enrolledUserIds = new Set(enrollments.map((enrollment) => enrollment.userId));
  const cohortId = enrollments[0]?.cohortId ?? modules[0]?.cohortId ?? null;
  const cohortUsers = cohortId
    ? await ctx.db
        .query("user")
        .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
        .collect()
    : [];

  const userMap = new Map(
    cohortUsers
      .filter((user) => user.userId)
      .map((user) => [user.userId as string, user])
  );

  const missingUserIds = [...enrolledUserIds].filter((userId) => !userMap.has(userId));
  const missingUsers = await Promise.all(
    missingUserIds.map((userId) =>
      ctx.db
        .query("user")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique()
    )
  );
  for (const user of missingUsers) {
    if (user?.userId) userMap.set(user.userId, user);
  }

  const courseUsers = enrollments.flatMap((enrollment) => {
    const user = userMap.get(enrollment.userId);
    if (!user || user.role !== "learner") return [];
    return [user];
  });

  return {
    modules,
    snapshots,
    courseUsers,
    config: resolveCourseDashboardConfig(configDoc),
  };
}

function buildDynamicModuleInsights({
  courseId,
  courseTitle,
  modules,
  courseUsers,
  snapshots,
  masteryWeights,
}: {
  courseId: string;
  courseTitle: string;
  modules: Array<{ moduleId: string; order?: number; title?: string }>;
  courseUsers: Array<{ userId?: string | null }>;
  snapshots: Array<{
    userId: string;
    moduleId: string;
    applicationScore: number;
    comprehensionScore: number;
    retentionScore: number;
    behavioralScore: number;
    calculatedAt: number;
  }>;
  masteryWeights: ReturnType<typeof getDefaultCourseDashboardConfig>["masteryWeights"];
}) {
  const latestSnapshots = buildLatestSnapshotMap(snapshots);
  const sortedModules = [...modules].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

  return sortedModules.map((moduleDoc, index) => {
    const learnerScores =
      courseUsers.length > 0
        ? courseUsers.map((user) => {
            const externalUserId = user.userId;
            if (!externalUserId) return 0;
            const snapshot = latestSnapshots.get(`${externalUserId}:${moduleDoc.moduleId}`);
            if (!snapshot) return 0;
            return computeMasteryFromComponents({
              applicationScore: snapshot.applicationScore,
              retrievalScore: snapshot.comprehensionScore,
              retentionScore: snapshot.retentionScore,
              behaviourScore: snapshot.behavioralScore,
              masteryWeights,
            });
          })
        : snapshots
            .filter((snapshot) => snapshot.moduleId === moduleDoc.moduleId)
            .map((snapshot) =>
              computeMasteryFromComponents({
                applicationScore: snapshot.applicationScore,
                retrievalScore: snapshot.comprehensionScore,
                retentionScore: snapshot.retentionScore,
                behaviourScore: snapshot.behavioralScore,
                masteryWeights,
              })
            );

    const averageScore = round2(average(learnerScores));

    return {
      courseId,
      moduleId: moduleDoc.moduleId,
      moduleLabel: `Module ${moduleDoc.order ?? index + 1}`,
      courseTitle,
      averageScore,
      cohortRiskBucket: moduleRiskLabel(averageScore),
    };
  });
}

async function getComputedModuleInsights(ctx: QueryCtx, courseId: string) {
  const course = await ctx.db
    .query("courses")
    .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
    .unique();
  if (!course) return [];

  const { modules, snapshots, courseUsers, config } = await loadCourseAggregationInputs(ctx, courseId);
  const hasDynamicLearnerData = courseUsers.length > 0 || snapshots.length > 0;
  if (!hasDynamicLearnerData) {
    const rows = await ctx.db
      .query("module_insights")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
    return rows.sort((a, b) =>
      a.moduleLabel.localeCompare(b.moduleLabel, undefined, { numeric: true })
    );
  }

  return buildDynamicModuleInsights({
    courseId,
    courseTitle: course.title,
    modules,
    courseUsers,
    snapshots,
    masteryWeights: config.masteryWeights,
  });
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const getByCourseId = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .unique();
    if (!course) return null;

    const { modules, snapshots, courseUsers, config } = await loadCourseAggregationInputs(ctx, courseId);
    const hasDynamicLearnerData = courseUsers.length > 0 || snapshots.length > 0;
    if (!hasDynamicLearnerData) {
      return {
        ...course,
        applicationMax: config.masteryWeights.applicationPct,
        retrievalMax: config.masteryWeights.retrievalPct,
        retentionMax: config.masteryWeights.retentionPct,
        behaviourMax: config.masteryWeights.behaviourPct,
        dashboardConfig: config,
      };
    }

    const learnerRows = buildCourseLearnerRows({
      moduleIds: modules.map((module) => module.moduleId),
      snapshots,
      users: courseUsers,
      masteryWeights: config.masteryWeights,
      diagnosisThresholds: config.diagnosisThresholds,
      nowSec: Date.now() / 1000,
    });

    const diagnosisCounts = {
      high_mastery: 0,
      on_track: 0,
      at_risk: 0,
      disengaged: 0,
    };
    for (const row of learnerRows) {
      diagnosisCounts[row.riskBucket] += 1;
    }

    const avgApplication = average(learnerRows.map((row) => row.applicationScore));
    const avgRetrieval = average(learnerRows.map((row) => row.retrievalScore));
    const avgRetention = average(learnerRows.map((row) => row.retentionScore));
    const avgBehaviour = average(learnerRows.map((row) => row.behaviourScore));

    const applicationContribution = Math.round(
      avgApplication * (config.masteryWeights.applicationPct / 100)
    );
    const retrievalContribution = Math.round(
      avgRetrieval * (config.masteryWeights.retrievalPct / 100)
    );
    const retentionContribution = Math.round(
      avgRetention * (config.masteryWeights.retentionPct / 100)
    );
    const behaviourContribution = Math.round(
      avgBehaviour * (config.masteryWeights.behaviourPct / 100)
    );

    const masteryScore =
      applicationContribution +
      retrievalContribution +
      retentionContribution +
      behaviourContribution;

    return {
      ...course,
      totalStudents: courseUsers.length || course.totalStudents,
      studentsAtRisk: diagnosisCounts.at_risk + diagnosisCounts.disengaged,
      diagnosisHighMastery: diagnosisCounts.high_mastery,
      diagnosisOnTrack: diagnosisCounts.on_track,
      diagnosisAtRisk: diagnosisCounts.at_risk,
      diagnosisDisengaged: diagnosisCounts.disengaged,
      cohortHealthScore: masteryScore,
      masteryScore,
      applicationScore: applicationContribution,
      applicationMax: config.masteryWeights.applicationPct,
      retrievalScore: retrievalContribution,
      retrievalMax: config.masteryWeights.retrievalPct,
      retentionScore: retentionContribution,
      retentionMax: config.masteryWeights.retentionPct,
      behaviourScore: behaviourContribution,
      behaviourMax: config.masteryWeights.behaviourPct,
      dashboardConfig: config,
    };
  },
});

export const updateMasteryWeights = mutation({
  args: {
    courseId: v.string(),
    masteryWeights: masteryWeightsValidator,
  },
  handler: async (ctx, { courseId, masteryWeights }) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .unique();
    if (!course) throw new Error("Course not found.");

    validateMasteryWeights(masteryWeights);
    await upsertCourseDashboardConfig(ctx, courseId, { masteryWeights });
    return { ok: true };
  },
});

export const updateDiagnosisThresholds = mutation({
  args: {
    courseId: v.string(),
    diagnosisThresholds: diagnosisThresholdsValidator,
  },
  handler: async (ctx, { courseId, diagnosisThresholds }) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .unique();
    if (!course) throw new Error("Course not found.");

    validateDiagnosisThresholds(diagnosisThresholds);
    await upsertCourseDashboardConfig(ctx, courseId, { diagnosisThresholds });
    return { ok: true };
  },
});

export const backfillCourseDashboardConfigs = mutation({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    let createdCount = 0;

    for (const course of courses) {
      const existing = await getCourseDashboardConfigDoc(ctx, course.courseId);
      if (existing) continue;

      const defaults = getDefaultCourseDashboardConfig();
      await ctx.db.insert("course_dashboard_configs", {
        courseId: course.courseId,
        ...defaults,
        updatedAt: Date.now(),
      });
      createdCount += 1;
    }

    return { createdCount };
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

export const createAssessment = mutation({
  args: {
    courseId: v.string(),
    moduleId: v.string(),
    name: v.string(),
    assessmentKind: v.union(v.literal("assignment"), v.literal("quiz")),
    dueDate: v.float64(),
    aiAssistedGrading: v.boolean(),
    instructions: v.optional(v.string()),
    rubric: v.array(
      v.object({
        criterion: v.string(),
        description: v.optional(v.string()),
        weightPct: v.float64(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .unique();
    if (!course) throw new Error("Course not found.");

    const moduleDoc = await ctx.db
      .query("modules")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .unique();
    if (!moduleDoc) throw new Error("Module not found.");
    if (moduleDoc.courseId !== args.courseId) {
      throw new Error("Selected module does not belong to selected course.");
    }

    const cleanedName = args.name.trim();
    if (!cleanedName) throw new Error("Assessment name is required.");

    const filteredRubric = args.rubric
      .map((item) => ({
        criterion: item.criterion.trim(),
        description: item.description?.trim(),
        weightPct: item.weightPct,
      }))
      .filter((item) => item.criterion.length > 0 && item.weightPct > 0);

    const rubricTotal = filteredRubric.reduce((sum, item) => sum + item.weightPct, 0);
    if (filteredRubric.length === 0) throw new Error("At least one rubric criterion is required.");
    if (Math.abs(rubricTotal - 100) > 0.01) {
      throw new Error("Rubric weighting must total 100%.");
    }

    const existingRows = await ctx.db
      .query("course_assessments")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
    const nextOrder = existingRows.length > 0 ? Math.max(...existingRows.map((r) => r.order)) + 1 : 1;

    await ctx.db.insert("course_assessments", {
      courseId: args.courseId,
      assessmentType: cleanedName,
      assessmentName: cleanedName,
      assessmentKind: args.assessmentKind,
      moduleId: args.moduleId,
      moduleLesson: `${course.title}/ Module ${moduleDoc.order ?? "-"}`,
      dueDate: args.dueDate,
      status: "in_progress",
      averageScore: undefined,
      order: nextOrder,
      aiAssistedGrading: args.aiAssistedGrading,
      instructions: args.instructions?.trim() || undefined,
      rubric: filteredRubric,
    });

    return { ok: true };
  },
});

function scoreLabelFromPct(scorePct: number | null) {
  if (scorePct == null) return null;
  return `${Math.round(scorePct)}%`;
}

export const listAssessmentInsights = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const [course, modules, assessments, enrollments, taskResults, users] = await Promise.all([
      ctx.db
        .query("courses")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .unique(),
      ctx.db
        .query("modules")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .collect(),
      ctx.db
        .query("course_assessments")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .collect(),
      ctx.db
        .query("course_enrollments")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .collect(),
      ctx.db
        .query("task_results")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
        .collect(),
      ctx.db.query("user").collect(),
    ]);

    if (!course) return [];

    const sortedModules = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const userByExternalId = new Map(
      users
        .filter((u) => Boolean(u.userId))
        .map((u) => [u.userId as string, u]),
    );

    return [...assessments]
      .sort((a, b) => a.order - b.order)
      .map((assessment) => {
        const moduleNumFromLabel = Number((assessment.assessmentType.match(/(\d+)/)?.[1] ?? "0").trim());
        const taskTypeLabel =
          assessment.assessmentKind ??
          (assessment.assessmentType.toLowerCase().includes("assignment") ? "assignment" : "quiz");
        const moduleDoc =
          (assessment.moduleId
            ? sortedModules.find((m) => m.moduleId === assessment.moduleId)
            : null) ??
          sortedModules.find((m) => (m.order ?? 0) === moduleNumFromLabel) ??
          null;
        const expectedSuffix = taskTypeLabel === "assignment" ? "_assignment" : "_quiz";
        const matchedTaskResults = taskResults.filter((result) => {
          if (moduleDoc && result.moduleId !== moduleDoc.moduleId) return false;
          if (!result.taskId.endsWith(expectedSuffix)) return false;
          // Exclude retention quiz rows for "Quiz N" lines.
          if (taskTypeLabel === "quiz" && result.taskId.endsWith("_retention")) return false;
          return true;
        });

        const learnerGrades = enrollments
          .map((enrollment) => {
            const learner = userByExternalId.get(enrollment.userId);
            const learnerRows = matchedTaskResults.filter((row) => row.userId === enrollment.userId);
            const learnerPct =
              learnerRows.length > 0
                ? average(
                    learnerRows.map((row) =>
                      row.maxScore > 0 ? (row.score / row.maxScore) * 100 : 0,
                    ),
                  )
                : null;
            return {
              learnerId: learner?._id ?? enrollment.userId,
              learnerName: learner?.name ?? enrollment.userId,
              rawScore: learnerPct,
              scoreLabel: scoreLabelFromPct(learnerPct),
            };
          })
          .sort((a, b) => a.learnerName.localeCompare(b.learnerName));

        const classAverage =
          learnerGrades.length > 0
            ? average(
                learnerGrades
                  .map((g) => g.rawScore)
                  .filter((value): value is number => value != null),
              )
            : null;

        const moduleDisplayOrder = moduleDoc?.order ?? moduleNumFromLabel;

        return {
          assessmentType: assessment.assessmentType,
          courseModuleLabel: `${course.title}/ Module ${moduleDisplayOrder || "-"}`,
          dueDate: assessment.dueDate,
          status: assessment.status,
          averageScore: classAverage == null ? null : round2(classAverage),
          averageScoreLabel: classAverage == null ? "-" : `${Math.round(classAverage)}%`,
          severity:
            classAverage == null
              ? "neutral"
              : classAverage < 65
                ? "low"
                : classAverage < 75
                  ? "moderate"
                  : "good",
          learnerGrades,
        };
      });
  },
});

export const listModuleInsights = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    return await getComputedModuleInsights(ctx, courseId);
  },
});

export const getModuleInsight = query({
  args: { courseId: v.string(), moduleId: v.string() },
  handler: async (ctx, { courseId, moduleId }) => {
    const rows = await getComputedModuleInsights(ctx, courseId);
    return rows.find((r) => r.moduleId === moduleId) ?? null;
  },
});

export const getCourseDashboardConfig = query({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const config = await getCourseDashboardConfigDoc(ctx, courseId);
    return resolveCourseDashboardConfig(config);
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

const AT_RISK_MASTERY_THRESHOLD = 75;
const AT_RISK_BUCKETS = new Set(["at_risk", "disengaged"]);
const MAX_INSIGHTS = 5;

function takeWorstInsights(items: Array<{ severity: number; text: string }>, max: number): string[] {
  return items
    .sort((a, b) => a.severity - b.severity)
    .slice(0, max)
    .map((x) => x.text);
}

/** At-risk learners only (low mastery or at_risk/disengaged), with insights for each. Empty when no one is doing bad. */
export const getLowestPerformingAttention = query({
  args: {
    cohortId: v.string(),
    courseId: v.optional(v.string()),
  },
  handler: async (ctx, { cohortId, courseId }) => {
    const users = await ctx.db
      .query("user")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .collect();
    const learners = users.filter((u) => u.role === "learner");
    if (learners.length === 0) return [];

    const atRiskLearners = learners.filter((u) => {
      const bucket = (u.riskBucket ?? "").toLowerCase();
      const mastery = u.masteryScore ?? 0;
      return AT_RISK_BUCKETS.has(bucket) || mastery < AT_RISK_MASTERY_THRESHOLD;
    });
    if (atRiskLearners.length === 0) return [];

    const history = await ctx.db
      .query("course_mastery_history")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .collect();
    const taskResultsAll = await ctx.db.query("task_results").collect();
    const modulesAll = await ctx.db.query("modules").collect();

    const out: Array<{
      learnerId: unknown;
      learnerName: string;
      masteryScore: number;
      riskBucket: string;
      moduleLabel: string;
      quizScorePct: number | null;
      videoReplayCount: number | null;
      assignmentIncomplete: boolean;
      insights: string[];
    }> = [];

    for (const learner of atRiskLearners) {
      const userId = learner.userId ?? String(learner._id);
      let learnerHistory = history.filter((h) => h.userId === userId);
      if (courseId) {
        learnerHistory = learnerHistory.filter((h) => h.courseId === courseId);
      }

      const masteryScore = Math.round(learner.masteryScore ?? 0);
      const riskBucket = (learner.riskBucket ?? "at_risk").toLowerCase();
      const insightItems: Array<{ severity: number; text: string }> = [];

      // Severity 1 = worst, 2 = bad, 3 = moderate

      // Overall & risk
      if (masteryScore < AT_RISK_MASTERY_THRESHOLD) {
        insightItems.push({ severity: 1, text: `Overall mastery ${masteryScore}% (below ${AT_RISK_MASTERY_THRESHOLD}% target).` });
      }
      if (AT_RISK_BUCKETS.has(riskBucket)) {
        insightItems.push({
          severity: riskBucket === "disengaged" ? 1 : 2,
          text: riskBucket === "disengaged"
            ? "Disengaged — inactive or very low engagement; may need re-engagement."
            : "At risk — performance or engagement below expectations.",
        });
      }

      let moduleLabel = "this module";
      let quizScorePct: number | null = null;
      let videoReplayCount: number | null = null;
      let assignmentIncomplete = false;

      const userTaskResults = taskResultsAll.filter((r) => r.userId === userId);

      if (learnerHistory.length > 0) {
        const worst = learnerHistory.reduce((prev, cur) =>
          cur.masteryScore < prev.masteryScore ? cur : prev
        );
        const moduleDoc = modulesAll.find((m) => m.moduleId === worst.moduleId);
        moduleLabel = moduleDoc?.title ?? worst.moduleId;

        const moduleResults = userTaskResults.filter((r) => r.moduleId === worst.moduleId);
        const quizResults = moduleResults.filter((r) =>
          (r.taskType ?? "").toLowerCase().includes("quiz")
        );
        if (quizResults.length > 0) {
          quizScorePct = Math.round(
            (quizResults.reduce((s, r) => s + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) /
              quizResults.length)
          );
          if (quizScorePct < 60) {
            insightItems.push({ severity: 1, text: `Quiz score in ${moduleLabel}: ${quizScorePct}% — below passing.` });
          } else if (quizScorePct < 75) {
            insightItems.push({ severity: 2, text: `Quiz score in ${moduleLabel}: ${quizScorePct}% — room for improvement.` });
          }
        }
        const replay = moduleResults.reduce((s, r) => s + (r.contentReplayCount ?? 0), 0);
        if (replay > 0) {
          videoReplayCount = replay;
          if (replay >= 3) {
            insightItems.push({ severity: 2, text: `Video replayed ${replay}x in ${moduleLabel} — may need concept walkthrough.` });
          } else {
            insightItems.push({ severity: 3, text: `Video replay ${replay}x in ${moduleLabel}.` });
          }
        }
        const tasksInModule = await ctx.db
          .query("tasks")
          .withIndex("by_moduleId", (q) => q.eq("moduleId", worst.moduleId))
          .collect();
        const assignmentTasks = tasksInModule.filter((t) =>
          (t.type ?? "").toLowerCase().includes("assignment")
        );
        assignmentIncomplete =
          assignmentTasks.length > 0 &&
          assignmentTasks.some((t) => {
            const res = moduleResults.find((r) => r.taskId === t.taskId || r.taskId === t.task_id);
            return !res || res.rubricScore == null;
          });
        if (assignmentIncomplete) {
          insightItems.push({ severity: 1, text: `Assignment incomplete in ${moduleLabel}.` });
        }
        const assignmentResults = moduleResults.filter((r) => {
          const t = assignmentTasks.find((t) => t.taskId === r.taskId || t.task_id === r.taskId);
          return t && r.rubricScore != null;
        });
        const lowRubric = assignmentResults.filter((r) => r.rubricScore != null && r.rubricScore < 60);
        if (lowRubric.length > 0) {
          insightItems.push({ severity: 2, text: `Assignment rubric(s) below 60% in ${moduleLabel}.` });
        }
      } else {
        insightItems.push({ severity: 1, text: "No module activity yet — encourage engagement." });
      }

      // Component scores
      const appScore = learner.applicationScore != null ? Math.round(learner.applicationScore) : null;
      const compScore = learner.comprehensionScore != null ? Math.round(learner.comprehensionScore) : null;
      const retScore = learner.retentionScore != null ? Math.round(learner.retentionScore) : null;
      const behScore = learner.behavioralScore != null ? Math.round(learner.behavioralScore) : null;
      if (appScore != null && appScore < 60) insightItems.push({ severity: 2, text: `Application score low (${appScore}%).` });
      if (compScore != null && compScore < 60) insightItems.push({ severity: 2, text: `Retrieval/comprehension low (${compScore}%).` });
      if (retScore != null && retScore < 60) insightItems.push({ severity: 2, text: `Retention low (${retScore}%) — consider reinforcement.` });
      if (behScore != null && behScore < 60) insightItems.push({ severity: 2, text: `Behaviour score low (${behScore}%).` });

      // Cross-module
      const totalReplay = userTaskResults.reduce((s, r) => s + (r.contentReplayCount ?? 0), 0);
      const totalReread = userTaskResults.reduce((s, r) => s + (r.reReadCount ?? 0), 0);
      const highAttempts = userTaskResults.filter((r) => (r.attempts ?? 0) > 2);
      const helpRequests = userTaskResults.reduce((s, r) => s + (r.helpRequestCount ?? 0), 0);
      if (totalReplay >= 5 && (videoReplayCount == null || totalReplay > videoReplayCount)) {
        insightItems.push({ severity: 3, text: `High content replay (${totalReplay}x) overall.` });
      }
      if (totalReread >= 3) insightItems.push({ severity: 3, text: `Re-read count high (${totalReread}).` });
      if (highAttempts.length >= 2) insightItems.push({ severity: 3, text: "Multiple tasks with 3+ attempts." });
      if (helpRequests >= 2) insightItems.push({ severity: 3, text: `Help requested ${helpRequests} time(s).` });

      const insights = takeWorstInsights(insightItems, MAX_INSIGHTS);
      out.push({
        learnerId: learner._id,
        learnerName: learner.name ?? "Unknown",
        masteryScore,
        riskBucket,
        moduleLabel,
        quizScorePct,
        videoReplayCount: videoReplayCount != null && videoReplayCount > 0 ? videoReplayCount : null,
        assignmentIncomplete,
        insights: insights.length > 0 ? insights : ["Low mastery or at-risk; review progress with learner."],
      });
    }

    return out;
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
