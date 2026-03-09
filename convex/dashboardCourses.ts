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
