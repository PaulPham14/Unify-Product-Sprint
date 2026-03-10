import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  computeScoresFromResults,
  getRiskBucketForMasteryScore,
  type ComputedScores,
} from "./scoreUtils";

const DEMO_COHORT_ID = "cohort_ai_001";
const DEMO_INSTRUCTOR_USER_ID = "user_inst_001";
const DEMO_INSTRUCTOR_EMAIL = "maya.patel@aiacademy.org";
const DEMO_INSTRUCTOR_NAME = "Dr. Maya Patel";
const DEMO_NOW_SEC = unix("2026-03-08T17:00:00Z");
const OLD_DEMO_COURSE_IDS = ["course_zoom", "course_unify_taxes"] as const;
const DEMO_COURSE_IDS = [
  "course_ai_fundamentals",
  "course_ai_sales_strategy",
  "course_ai_workflow_bootcamp",
] as const;
const TARGETED_COURSE_IDS = [...OLD_DEMO_COURSE_IDS, ...DEMO_COURSE_IDS] as const;
const HISTORY_CUTOFFS = [
  unix("2026-01-19T17:00:00Z"),
  unix("2026-02-02T17:00:00Z"),
  unix("2026-02-16T17:00:00Z"),
  unix("2026-03-01T17:00:00Z"),
  DEMO_NOW_SEC,
] as const;
const PERIODS = [
  { key: "2026-01", cutoffSec: unix("2026-01-31T23:59:59Z") },
  { key: "2026-02", cutoffSec: unix("2026-02-28T23:59:59Z") },
  { key: "2026-03", cutoffSec: DEMO_NOW_SEC },
] as const;

type DemoCourseId = (typeof DEMO_COURSE_IDS)[number];
type ArchetypeKey =
  | "high_mastery"
  | "strong"
  | "steady"
  | "inconsistent"
  | "at_risk"
  | "disengaged";

type ModuleDef = {
  moduleId: string;
  title: string;
  description: string;
  order: number;
  difficulty: number;
  concepts: Array<{
    conceptId: string;
    title: string;
    difficulty: number;
    contentType: "video" | "text" | "audio";
  }>;
};

type CourseDef = {
  courseId: DemoCourseId;
  title: string;
  targetCompletionDate: string;
  courseStartSec: number;
  modules: ModuleDef[];
  learners: LearnerProfile[];
};

type LearnerProfile = {
  key: string;
  name: string;
  email: string;
  jobTitle: string;
  organization: string;
  personaTag: string;
  archetype: ArchetypeKey;
  createdAtSec: number;
};

type ArchetypeDef = {
  application: number;
  retrieval: number;
  retention: number;
  engagement: number;
  confidence: number;
  attempts: number;
  sessionFrequency: number;
  inactiveTabRate: number;
  contentReplayCount: number;
  reReadCount: number;
  discussionContributionCount: number;
  helpRequestCount: number;
  completionBias: number;
  lastActiveDaysAgo: number;
};

type SeededTaskResult = {
  assessmentId?: string;
  assignmentWeight?: number;
  attempts?: number;
  confidenceScore?: number;
  conceptIds: string[];
  contentReplayCount?: number;
  courseId: string;
  discussionContributionCount?: number;
  helpRequestCount?: number;
  inactiveTabRate?: number;
  instructorApproved?: boolean;
  maxScore: number;
  moduleId: string;
  responseTimeAvgSec?: number;
  resultId: string;
  retentionDelayDays?: number;
  reReadCount?: number;
  rubricScore?: number;
  score: number;
  sessionFrequency?: number;
  taskId: string;
  taskType: string;
  timeOnTaskSec?: number;
  userId: string;
  completedAt: number;
  cohortId: string;
};

const ARCHETYPES: Record<ArchetypeKey, ArchetypeDef> = {
  high_mastery: {
    application: 92,
    retrieval: 90,
    retention: 86,
    engagement: 88,
    confidence: 84,
    attempts: 1,
    sessionFrequency: 5.4,
    inactiveTabRate: 0.05,
    contentReplayCount: 1,
    reReadCount: 1,
    discussionContributionCount: 4,
    helpRequestCount: 1,
    completionBias: 0.98,
    lastActiveDaysAgo: 1,
  },
  strong: {
    application: 85,
    retrieval: 82,
    retention: 78,
    engagement: 81,
    confidence: 76,
    attempts: 1.2,
    sessionFrequency: 4.7,
    inactiveTabRate: 0.07,
    contentReplayCount: 1,
    reReadCount: 1,
    discussionContributionCount: 3,
    helpRequestCount: 1.2,
    completionBias: 0.94,
    lastActiveDaysAgo: 3,
  },
  steady: {
    application: 77,
    retrieval: 75,
    retention: 70,
    engagement: 76,
    confidence: 69,
    attempts: 1.4,
    sessionFrequency: 3.9,
    inactiveTabRate: 0.09,
    contentReplayCount: 1.4,
    reReadCount: 1.3,
    discussionContributionCount: 2,
    helpRequestCount: 1.5,
    completionBias: 0.9,
    lastActiveDaysAgo: 5,
  },
  inconsistent: {
    application: 68,
    retrieval: 71,
    retention: 60,
    engagement: 64,
    confidence: 61,
    attempts: 1.9,
    sessionFrequency: 3.1,
    inactiveTabRate: 0.12,
    contentReplayCount: 2,
    reReadCount: 2,
    discussionContributionCount: 1,
    helpRequestCount: 2,
    completionBias: 0.82,
    lastActiveDaysAgo: 10,
  },
  at_risk: {
    application: 56,
    retrieval: 59,
    retention: 48,
    engagement: 52,
    confidence: 50,
    attempts: 2.4,
    sessionFrequency: 2.3,
    inactiveTabRate: 0.17,
    contentReplayCount: 2.8,
    reReadCount: 2.4,
    discussionContributionCount: 0.5,
    helpRequestCount: 2.8,
    completionBias: 0.71,
    lastActiveDaysAgo: 18,
  },
  disengaged: {
    application: 43,
    retrieval: 45,
    retention: 35,
    engagement: 34,
    confidence: 42,
    attempts: 2.8,
    sessionFrequency: 1.2,
    inactiveTabRate: 0.24,
    contentReplayCount: 3.5,
    reReadCount: 3,
    discussionContributionCount: 0,
    helpRequestCount: 3.5,
    completionBias: 0.58,
    lastActiveDaysAgo: 42,
  },
};

const COURSE_DEFINITIONS: Record<DemoCourseId, CourseDef> = {
  course_ai_fundamentals: {
    courseId: "course_ai_fundamentals",
    title: "AI Fundamentals",
    targetCompletionDate: "2026-03-31",
    courseStartSec: unix("2026-01-06T17:00:00Z"),
    modules: [
      {
        moduleId: "mod_ai_01",
        title: "Introduction to AI & Machine Learning",
        description:
          "Core concepts of artificial intelligence, history, and modern applications of ML.",
        order: 1,
        difficulty: 0.2,
        concepts: [
          {
            conceptId: "con_ai_01_a",
            title: "What is Artificial Intelligence?",
            difficulty: 0.1,
            contentType: "video",
          },
          {
            conceptId: "con_ai_01_b",
            title: "Supervised vs Unsupervised Learning",
            difficulty: 0.15,
            contentType: "text",
          },
          {
            conceptId: "con_ai_01_c",
            title: "AI Ethics & Bias",
            difficulty: 0.25,
            contentType: "audio",
          },
        ],
      },
      {
        moduleId: "mod_ai_02",
        title: "Data Preprocessing & Feature Engineering",
        description:
          "Techniques for cleaning data, handling missing values, and creating meaningful features.",
        order: 2,
        difficulty: 0.42,
        concepts: [
          {
            conceptId: "con_ai_02_a",
            title: "Data Cleaning Pipelines",
            difficulty: 0.35,
            contentType: "text",
          },
          {
            conceptId: "con_ai_02_b",
            title: "Feature Scaling & Normalization",
            difficulty: 0.45,
            contentType: "video",
          },
        ],
      },
      {
        moduleId: "mod_ai_03",
        title: "Neural Networks & Deep Learning",
        description:
          "Fundamentals of neural network architecture, backpropagation, and gradient descent.",
        order: 3,
        difficulty: 0.72,
        concepts: [
          {
            conceptId: "con_ai_03_a",
            title: "Perceptrons & Activation Functions",
            difficulty: 0.62,
            contentType: "video",
          },
          {
            conceptId: "con_ai_03_b",
            title: "Backpropagation & Gradient Descent",
            difficulty: 0.8,
            contentType: "text",
          },
          {
            conceptId: "con_ai_03_c",
            title: "Convolutional Neural Networks",
            difficulty: 0.76,
            contentType: "audio",
          },
        ],
      },
      {
        moduleId: "mod_ai_04",
        title: "Natural Language Processing",
        description:
          "Text analysis, tokenization, embeddings, and transformer architectures.",
        order: 4,
        difficulty: 0.58,
        concepts: [
          {
            conceptId: "con_ai_04_a",
            title: "Tokenization & Word Embeddings",
            difficulty: 0.52,
            contentType: "text",
          },
          {
            conceptId: "con_ai_04_b",
            title: "Attention Mechanisms & Transformers",
            difficulty: 0.66,
            contentType: "video",
          },
        ],
      },
      {
        moduleId: "mod_ai_05",
        title: "Model Evaluation & Deployment",
        description:
          "Metrics for model performance, cross-validation, and deploying models to production.",
        order: 5,
        difficulty: 0.5,
        concepts: [
          {
            conceptId: "con_ai_05_a",
            title: "Precision, Recall & F1 Score",
            difficulty: 0.44,
            contentType: "text",
          },
          {
            conceptId: "con_ai_05_b",
            title: "Model Serving & MLOps",
            difficulty: 0.58,
            contentType: "video",
          },
        ],
      },
    ],
    learners: [
      learner("af_01", "Elena Park", "elena.park@northstarlabs.com", "Senior Product Manager", "Northstar Labs", "curious-operator", "high_mastery", "2026-01-03T15:00:00Z"),
      learner("af_02", "Owen Fitzgerald", "owen.fitzgerald@apexventures.co", "Strategy Analyst", "Apex Ventures", "fast-starter", "high_mastery", "2026-01-04T15:00:00Z"),
      learner("af_03", "Mina Lopez", "mina.lopez@harborhealth.io", "Program Lead", "Harbor Health", "systems-thinker", "strong", "2026-01-05T15:00:00Z"),
      learner("af_04", "Jordan Bell", "jordan.bell@cedarcapital.com", "Operations Manager", "Cedar Capital", "steady-builder", "strong", "2026-01-05T17:00:00Z"),
      learner("af_05", "Sofia Ramachandran", "sofia.r@brightpath.org", "Learning Experience Designer", "BrightPath", "reflective-practitioner", "steady", "2026-01-06T15:00:00Z"),
      learner("af_06", "Marcus Lee", "marcus.lee@bridgepoint.co", "Customer Success Lead", "Bridgepoint", "hands-on-generalist", "steady", "2026-01-07T15:00:00Z"),
      learner("af_07", "Talia Green", "talia.green@stonewoodpartners.com", "RevOps Manager", "Stonewood Partners", "inconsistent-executor", "inconsistent", "2026-01-07T17:00:00Z"),
      learner("af_08", "Nikhil Sethi", "nikhil.sethi@orbitlegal.com", "Business Systems Analyst", "Orbit Legal", "needs-reinforcement", "at_risk", "2026-01-08T15:00:00Z"),
      learner("af_09", "Rosa Delgado", "rosa.delgado@meridianretail.com", "Training Specialist", "Meridian Retail", "overloaded-learner", "at_risk", "2026-01-09T15:00:00Z"),
      learner("af_10", "Caleb Turner", "caleb.turner@havenbio.org", "Implementation Manager", "Haven Bio", "disconnected-learner", "disengaged", "2026-01-09T17:00:00Z"),
    ],
  },
  course_ai_sales_strategy: {
    courseId: "course_ai_sales_strategy",
    title: "AI for Sales & Business Strategy",
    targetCompletionDate: "2026-04-04",
    courseStartSec: unix("2026-01-13T17:00:00Z"),
    modules: [
      {
        moduleId: "mod_sales_01",
        title: "AI for Revenue Research",
        description:
          "Use AI to sharpen market understanding, account prioritization, and buyer intelligence.",
        order: 1,
        difficulty: 0.28,
        concepts: [
          { conceptId: "con_sales_01_a", title: "ICP Segmentation with AI", difficulty: 0.22, contentType: "video" },
          { conceptId: "con_sales_01_b", title: "Account Prioritization Signals", difficulty: 0.3, contentType: "text" },
          { conceptId: "con_sales_01_c", title: "Voice-of-Customer Synthesis", difficulty: 0.34, contentType: "audio" },
          { conceptId: "con_sales_01_d", title: "Opportunity Brief Generation", difficulty: 0.36, contentType: "text" },
        ],
      },
      {
        moduleId: "mod_sales_02",
        title: "AI-Assisted Pipeline Execution",
        description:
          "Apply AI to call prep, outreach drafting, and post-call follow-up.",
        order: 2,
        difficulty: 0.5,
        concepts: [
          { conceptId: "con_sales_02_a", title: "Personalized Outreach Drafting", difficulty: 0.46, contentType: "video" },
          { conceptId: "con_sales_02_b", title: "Call Prep Copilots", difficulty: 0.5, contentType: "text" },
          { conceptId: "con_sales_02_c", title: "Objection Pattern Analysis", difficulty: 0.58, contentType: "audio" },
          { conceptId: "con_sales_02_d", title: "Next-Step Automation", difficulty: 0.54, contentType: "video" },
        ],
      },
      {
        moduleId: "mod_sales_03",
        title: "Strategic Planning with AI",
        description:
          "Translate AI outputs into decisions, forecasts, and executive narratives.",
        order: 3,
        difficulty: 0.68,
        concepts: [
          { conceptId: "con_sales_03_a", title: "Market Landscape Scanning", difficulty: 0.62, contentType: "text" },
          { conceptId: "con_sales_03_b", title: "Scenario Planning", difficulty: 0.7, contentType: "video" },
          { conceptId: "con_sales_03_c", title: "Forecast Narrative Building", difficulty: 0.72, contentType: "audio" },
          { conceptId: "con_sales_03_d", title: "Board-Ready Synthesis", difficulty: 0.74, contentType: "text" },
        ],
      },
      {
        moduleId: "mod_sales_04",
        title: "Governance and Team Adoption",
        description:
          "Create prompt workflows, guardrails, and adoption rituals for commercial teams.",
        order: 4,
        difficulty: 0.44,
        concepts: [
          { conceptId: "con_sales_04_a", title: "Prompt Workflow Standards", difficulty: 0.38, contentType: "video" },
          { conceptId: "con_sales_04_b", title: "Evaluation Criteria for GTM AI", difficulty: 0.45, contentType: "text" },
          { conceptId: "con_sales_04_c", title: "Risk and Compliance in Revenue AI", difficulty: 0.5, contentType: "audio" },
          { conceptId: "con_sales_04_d", title: "Change Management for Sellers", difficulty: 0.42, contentType: "text" },
        ],
      },
    ],
    learners: [
      learner("sales_01", "Camila Reyes", "camila.reyes@latticegrowth.com", "VP of Sales", "Lattice Growth", "executive-champion", "high_mastery", "2026-01-11T15:00:00Z"),
      learner("sales_02", "Darren Brooks", "darren.brooks@fieldspan.io", "Revenue Operations Director", "Fieldspan", "analytical-operator", "strong", "2026-01-11T17:00:00Z"),
      learner("sales_03", "Priyanka Desai", "priyanka.desai@novabridge.ai", "Enterprise AE", "NovaBridge", "high-potential-practitioner", "strong", "2026-01-12T15:00:00Z"),
      learner("sales_04", "Ben Carter", "ben.carter@summitventuregroup.com", "Chief of Staff", "Summit Venture Group", "strategic-generalist", "steady", "2026-01-12T17:00:00Z"),
      learner("sales_05", "Alyssa Monroe", "alyssa.monroe@arcadiahealth.com", "Business Development Lead", "Arcadia Health", "steady-builder", "steady", "2026-01-13T15:00:00Z"),
      learner("sales_06", "Ravi Malhotra", "ravi.malhotra@claritypay.co", "RevOps Manager", "ClarityPay", "fast-iterating-operator", "steady", "2026-01-13T17:00:00Z"),
      learner("sales_07", "Jasmine Cole", "jasmine.cole@northforkcapital.com", "Partnerships Manager", "Northfork Capital", "inconsistent-executor", "inconsistent", "2026-01-14T15:00:00Z"),
      learner("sales_08", "Luis Ortega", "luis.ortega@gridlineenergy.com", "Regional Sales Manager", "Gridline Energy", "needs-coaching", "at_risk", "2026-01-14T17:00:00Z"),
      learner("sales_09", "Naomi Schultz", "naomi.schultz@verdanalytics.io", "GTM Program Manager", "VerdAnalytics", "overextended-manager", "at_risk", "2026-01-15T15:00:00Z"),
      learner("sales_10", "Trevor Mills", "trevor.mills@cobaltlogistics.com", "Account Executive", "Cobalt Logistics", "disengaged-skeptic", "disengaged", "2026-01-15T17:00:00Z"),
    ],
  },
  course_ai_workflow_bootcamp: {
    courseId: "course_ai_workflow_bootcamp",
    title: "AI Workflow Automation Bootcamp",
    targetCompletionDate: "2026-04-10",
    courseStartSec: unix("2026-01-20T17:00:00Z"),
    modules: [
      {
        moduleId: "mod_ops_01",
        title: "Workflow Mapping and Automation Opportunities",
        description:
          "Map process bottlenecks and identify automation candidates with measurable impact.",
        order: 1,
        difficulty: 0.3,
        concepts: [
          { conceptId: "con_ops_01_a", title: "Process Inventory", difficulty: 0.22, contentType: "text" },
          { conceptId: "con_ops_01_b", title: "Bottleneck Detection", difficulty: 0.3, contentType: "video" },
          { conceptId: "con_ops_01_c", title: "ROI Framing", difficulty: 0.34, contentType: "audio" },
          { conceptId: "con_ops_01_d", title: "Handoff Mapping", difficulty: 0.32, contentType: "text" },
        ],
      },
      {
        moduleId: "mod_ops_02",
        title: "No-Code Automation Foundations",
        description:
          "Build reliable automations with triggers, transformations, and error-handling patterns.",
        order: 2,
        difficulty: 0.56,
        concepts: [
          { conceptId: "con_ops_02_a", title: "Trigger and Action Patterns", difficulty: 0.5, contentType: "video" },
          { conceptId: "con_ops_02_b", title: "API Connectors", difficulty: 0.58, contentType: "text" },
          { conceptId: "con_ops_02_c", title: "Data Formatting", difficulty: 0.52, contentType: "audio" },
          { conceptId: "con_ops_02_d", title: "Error Handling", difficulty: 0.62, contentType: "video" },
        ],
      },
      {
        moduleId: "mod_ops_03",
        title: "AI-Augmented Operations",
        description:
          "Use AI in operational workflows for intake, routing, summarization, and quality loops.",
        order: 3,
        difficulty: 0.66,
        concepts: [
          { conceptId: "con_ops_03_a", title: "Document Triage", difficulty: 0.6, contentType: "text" },
          { conceptId: "con_ops_03_b", title: "Support Ticket Summarization", difficulty: 0.64, contentType: "video" },
          { conceptId: "con_ops_03_c", title: "Knowledge Routing", difficulty: 0.68, contentType: "audio" },
          { conceptId: "con_ops_03_d", title: "QA Feedback Loops", difficulty: 0.72, contentType: "text" },
        ],
      },
      {
        moduleId: "mod_ops_04",
        title: "Measurement, Governance, and Rollout",
        description:
          "Operationalize AI workflows with metrics, review loops, and rollout playbooks.",
        order: 4,
        difficulty: 0.48,
        concepts: [
          { conceptId: "con_ops_04_a", title: "SLA and Throughput Metrics", difficulty: 0.44, contentType: "video" },
          { conceptId: "con_ops_04_b", title: "Human-in-the-Loop Checkpoints", difficulty: 0.5, contentType: "text" },
          { conceptId: "con_ops_04_c", title: "Auditability", difficulty: 0.52, contentType: "audio" },
          { conceptId: "con_ops_04_d", title: "Rollout Playbooks", difficulty: 0.46, contentType: "text" },
        ],
      },
    ],
    learners: [
      learner("ops_01", "Harper Nguyen", "harper.nguyen@brightframe.io", "Operations Excellence Lead", "BrightFrame", "systems-builder", "high_mastery", "2026-01-18T15:00:00Z"),
      learner("ops_02", "Samir Patel", "samir.patel@atlaslegalgroup.com", "Legal Ops Manager", "Atlas Legal Group", "detail-oriented-operator", "strong", "2026-01-18T17:00:00Z"),
      learner("ops_03", "Chloe Bennett", "chloe.bennett@forgelearning.org", "L&D Program Manager", "Forge Learning", "playbook-maker", "steady", "2026-01-19T15:00:00Z"),
      learner("ops_04", "Victor Alvarez", "victor.alvarez@signalfreight.com", "Process Improvement Lead", "Signal Freight", "steady-builder", "steady", "2026-01-19T17:00:00Z"),
      learner("ops_05", "Maya Johnson", "maya.johnson@urbanwellness.com", "Customer Support Operations Lead", "Urban Wellness", "hands-on-learner", "steady", "2026-01-20T15:00:00Z"),
      learner("ops_06", "Dina El-Sayed", "dina.elsayed@oakridgeadvisors.com", "Chief of Staff", "Oakridge Advisors", "cross-functional-operator", "inconsistent", "2026-01-20T17:00:00Z"),
      learner("ops_07", "Noah Kim", "noah.kim@peaktrail.co", "Automation Specialist", "PeakTrail", "needs-repetition", "inconsistent", "2026-01-21T15:00:00Z"),
      learner("ops_08", "Fatima Noor", "fatima.noor@willowbank.org", "Member Experience Manager", "Willowbank", "overloaded-manager", "at_risk", "2026-01-21T17:00:00Z"),
      learner("ops_09", "Grant Holloway", "grant.holloway@tritonmanufacturing.com", "Operations Analyst", "Triton Manufacturing", "skeptical-adopter", "at_risk", "2026-01-22T15:00:00Z"),
      learner("ops_10", "Leah Morton", "leah.morton@civicbridge.net", "Program Coordinator", "CivicBridge", "dropped-off-learner", "disengaged", "2026-01-22T17:00:00Z"),
    ],
  },
};

export const reseedLearningIntelligenceDashboard = action({
  args: {},
  returns: v.object({
    coursesSeeded: v.float64(),
    learnersSeeded: v.float64(),
    cohortLearnerCount: v.float64(),
    courseIds: v.array(v.string()),
  }),
  handler: async (ctx): Promise<{
    coursesSeeded: number;
    learnersSeeded: number;
    cohortLearnerCount: number;
    courseIds: string[];
  }> => {
    await ctx.runMutation(internal.demoData.cleanupDashboardSlice, {});
    await ctx.runMutation(internal.demoData.ensureInstructorAndCohort, {});

    for (const courseId of DEMO_COURSE_IDS) {
      await ctx.runMutation(internal.demoData.seedCourseCatalog, { courseId });
    }

    let learnerCount = 0;
    for (const courseId of DEMO_COURSE_IDS) {
      for (const learnerProfile of COURSE_DEFINITIONS[courseId].learners) {
        await ctx.runMutation(internal.demoData.seedLearnerCourseData, {
          courseId,
          learnerKey: learnerProfile.key,
        });
        learnerCount += 1;
      }
      await ctx.runMutation(internal.demoData.finalizeCourseAggregates, { courseId });
    }

    const cohort = await ctx.runMutation(internal.demoData.finalizeCohortRecord, {});

    return {
      coursesSeeded: DEMO_COURSE_IDS.length,
      learnersSeeded: learnerCount,
      cohortLearnerCount: cohort.learnerCount,
      courseIds: [...DEMO_COURSE_IDS],
    };
  },
});

export const cleanupDashboardSlice = internalMutation({
  args: {},
  handler: async (ctx) => {
    const courseRows = await ctx.db.query("courses").collect();
    for (const row of courseRows) {
      if (OLD_DEMO_COURSE_IDS.includes(row.courseId as (typeof OLD_DEMO_COURSE_IDS)[number])) {
        await ctx.db.delete(row._id);
      }
    }

    const learnerUsers = (await ctx.db.query("user").collect()).filter(
      (user) => user.cohortId === DEMO_COHORT_ID && user.role === "learner"
    );
    const learnerUserIds = new Set(
      learnerUsers.map((user) => user.userId).filter((userId): userId is string => Boolean(userId))
    );

    const courseEnrollments = await ctx.db.query("course_enrollments").collect();
    for (const enrollment of courseEnrollments) {
      if (
        enrollment.cohortId === DEMO_COHORT_ID ||
        TARGETED_COURSE_IDS.includes(enrollment.courseId as (typeof TARGETED_COURSE_IDS)[number])
      ) {
        await ctx.db.delete(enrollment._id);
      }
    }

    const moduleDocs = await ctx.db.query("modules").collect();
    const targetedModuleIds = new Set(
      moduleDocs
        .filter(
          (moduleDoc) =>
            moduleDoc.courseId != null &&
            TARGETED_COURSE_IDS.includes(moduleDoc.courseId as (typeof TARGETED_COURSE_IDS)[number])
        )
        .map((moduleDoc) => moduleDoc.moduleId)
    );

    const concepts = await ctx.db.query("concept").collect();
    for (const concept of concepts) {
      if (targetedModuleIds.has(concept.moduleId)) {
        await ctx.db.delete(concept._id);
      }
    }

    const lessons = await ctx.db.query("lesson").collect();
    for (const lesson of lessons) {
      if (targetedModuleIds.has(lesson.moduleId)) {
        await ctx.db.delete(lesson._id);
      }
    }

    const tasks = await ctx.db.query("tasks").collect();
    for (const task of tasks) {
      if (targetedModuleIds.has(task.moduleId)) {
        await ctx.db.delete(task._id);
      }
    }

    for (const moduleDoc of moduleDocs) {
      if (targetedModuleIds.has(moduleDoc.moduleId)) {
        await ctx.db.delete(moduleDoc._id);
      }
    }

    const taskResults = await ctx.db.query("task_results").collect();
    for (const result of taskResults) {
      if (
        result.cohortId === DEMO_COHORT_ID ||
        result.moduleId === "seed_demo_module" ||
        (result.courseId != null &&
          TARGETED_COURSE_IDS.includes(result.courseId as (typeof TARGETED_COURSE_IDS)[number])) ||
        learnerUserIds.has(result.userId)
      ) {
        await ctx.db.delete(result._id);
      }
    }

    const scoreHistoryRows = await ctx.db.query("score_history").collect();
    for (const row of scoreHistoryRows) {
      if (learnerUserIds.has(row.userId)) {
        await ctx.db.delete(row._id);
      }
    }

    const courseHistoryRows = await ctx.db.query("course_mastery_history").collect();
    for (const row of courseHistoryRows) {
      if (
        row.cohortId === DEMO_COHORT_ID ||
        learnerUserIds.has(row.userId) ||
        row.moduleId === "seed_demo_module" ||
        (row.courseId != null &&
          TARGETED_COURSE_IDS.includes(row.courseId as (typeof TARGETED_COURSE_IDS)[number]))
      ) {
        await ctx.db.delete(row._id);
      }
    }

    const conceptMasteryRows = await ctx.db.query("concept_mastery_scores").collect();
    for (const row of conceptMasteryRows) {
      if (
        row.cohortId === DEMO_COHORT_ID ||
        TARGETED_COURSE_IDS.includes(row.courseId as (typeof TARGETED_COURSE_IDS)[number])
      ) {
        await ctx.db.delete(row._id);
      }
    }

    const moduleInsights = await ctx.db.query("module_insights").collect();
    for (const row of moduleInsights) {
      if (TARGETED_COURSE_IDS.includes(row.courseId as (typeof TARGETED_COURSE_IDS)[number])) {
        await ctx.db.delete(row._id);
      }
    }

    const assessments = await ctx.db.query("course_assessments").collect();
    for (const row of assessments) {
      if (TARGETED_COURSE_IDS.includes(row.courseId as (typeof TARGETED_COURSE_IDS)[number])) {
        await ctx.db.delete(row._id);
      }
    }

    for (const learner of learnerUsers) {
      await ctx.db.delete(learner._id);
    }
  },
});

export const ensureInstructorAndCohort = internalMutation({
  args: {},
  handler: async (ctx) => {
    const instructor = await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", DEMO_INSTRUCTOR_USER_ID))
      .unique();

    if (instructor) {
      await ctx.db.patch(instructor._id, {
        email: DEMO_INSTRUCTOR_EMAIL,
        name: DEMO_INSTRUCTOR_NAME,
        cohortId: DEMO_COHORT_ID,
        role: "instructor",
        jobTitle: "Faculty Director, Applied AI",
        organization: "Disco Academy",
        personaTag: "instructor",
        createdAt: instructor.createdAt || unix("2026-01-02T16:00:00Z"),
      });
    } else {
      await ctx.db.insert("user", {
        email: DEMO_INSTRUCTOR_EMAIL,
        name: DEMO_INSTRUCTOR_NAME,
        cohortId: DEMO_COHORT_ID,
        role: "instructor",
        createdAt: unix("2026-01-02T16:00:00Z"),
        userId: DEMO_INSTRUCTOR_USER_ID,
        jobTitle: "Faculty Director, Applied AI",
        organization: "Disco Academy",
        personaTag: "instructor",
      });
    }

    const cohort = await ctx.db
      .query("cohort")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", DEMO_COHORT_ID))
      .unique();

    const cohortPatch = {
      cohortName: "Spring 2026 Learning Intelligence Demo Cohort",
      createdAt: unix("2026-01-03T16:00:00Z"),
      endDate: "2026-04-15",
      instructorId: DEMO_INSTRUCTOR_USER_ID,
      learnerIds: [] as string[],
      moduleId: "mod_ai_01",
      startDate: "2026-01-06",
      status: "active",
    };

    if (cohort) {
      await ctx.db.patch(cohort._id, cohortPatch);
    } else {
      await ctx.db.insert("cohort", {
        cohortId: DEMO_COHORT_ID,
        ...cohortPatch,
      });
    }
  },
});

export const seedCourseCatalog = internalMutation({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const course = getCourseDefinition(courseId);
    const courseDoc = await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q) => q.eq("courseId", course.courseId))
      .unique();

    const placeholderMetrics = {
      title: course.title,
      cohortHealthScore: 0,
      studentsAtRisk: 0,
      frictionModules: [],
      totalStudents: course.learners.length,
      diagnosisHighMastery: 0,
      diagnosisOnTrack: 0,
      diagnosisAtRisk: 0,
      diagnosisDisengaged: 0,
      masteryScore: 0,
      applicationScore: 0,
      applicationMax: 40,
      retrievalScore: 0,
      retrievalMax: 30,
      retentionScore: 0,
      retentionMax: 20,
      behaviourScore: 0,
      behaviourMax: 10,
    };

    if (courseDoc) {
      await ctx.db.patch(courseDoc._id, placeholderMetrics);
    } else {
      await ctx.db.insert("courses", {
        courseId: course.courseId,
        ...placeholderMetrics,
      });
    }

    for (const moduleDef of course.modules) {
      await ctx.db.insert("modules", {
        moduleId: moduleDef.moduleId,
        courseId: course.courseId,
        cohortId: DEMO_COHORT_ID,
        instructorId: DEMO_INSTRUCTOR_USER_ID,
        title: moduleDef.title,
        description: moduleDef.description,
        order: moduleDef.order,
        createdAt: course.courseStartSec + moduleDef.order * 86400,
      });

      for (let conceptIndex = 0; conceptIndex < moduleDef.concepts.length; conceptIndex += 1) {
        const conceptDef = moduleDef.concepts[conceptIndex];
        await ctx.db.insert("concept", {
          conceptId: conceptDef.conceptId,
          moduleId: moduleDef.moduleId,
          title: conceptDef.title,
        });

        await ctx.db.insert("lesson", {
          conceptId: conceptDef.conceptId,
          contentType: conceptDef.contentType,
          moduleId: moduleDef.moduleId,
          order: conceptIndex + 1,
          title: `${conceptDef.title} Workshop`,
        });

        await ctx.db.insert("tasks", {
          taskId: quizTaskId(conceptDef.conceptId),
          conceptId: conceptDef.conceptId,
          moduleId: moduleDef.moduleId,
          title: `${conceptDef.title} Knowledge Check`,
          type: "quiz",
          maxScore: 100,
        });
        await ctx.db.insert("tasks", {
          taskId: assignmentTaskId(conceptDef.conceptId),
          conceptId: conceptDef.conceptId,
          moduleId: moduleDef.moduleId,
          title: `${conceptDef.title} Applied Assignment`,
          type: "assignment",
          maxScore: 100,
          assignmentWeight: 1 + moduleDef.difficulty * 0.35,
        });
        await ctx.db.insert("tasks", {
          taskId: retentionTaskId(conceptDef.conceptId),
          conceptId: conceptDef.conceptId,
          moduleId: moduleDef.moduleId,
          title: `${conceptDef.title} Retention Check`,
          type: "quiz",
          maxScore: 100,
        });
      }
    }
  },
});

export const seedLearnerCourseData = internalMutation({
  args: {
    courseId: v.string(),
    learnerKey: v.string(),
  },
  handler: async (ctx, { courseId, learnerKey }) => {
    const course = getCourseDefinition(courseId);
    const learnerProfile = getLearnerProfile(course, learnerKey);
    const archetype = ARCHETYPES[learnerProfile.archetype];
    const userId = learnerUserId(learnerProfile.key);
    const lastActiveAt = DEMO_NOW_SEC - archetype.lastActiveDaysAgo * 86400;

    const userDocId = await ctx.db.insert("user", {
      applicationScore: 0,
      behavioralScore: 0,
      cohortId: DEMO_COHORT_ID,
      comprehensionScore: 0,
      createdAt: learnerProfile.createdAtSec,
      email: learnerProfile.email,
      insightsScore: 0,
      jobTitle: learnerProfile.jobTitle,
      lastActiveAt,
      masteryScore: 0,
      name: learnerProfile.name,
      organization: learnerProfile.organization,
      personaTag: learnerProfile.personaTag,
      retentionScore: 0,
      riskBucket: "on_track",
      riskLevel: "on_track",
      role: "learner",
      userId,
    });

    const generated = generateLearnerSeed(course, learnerProfile, userId, DEMO_NOW_SEC);
    for (const result of generated.results) {
      await ctx.db.insert("task_results", result);
    }

    const finalScores = computeDemoScores(generated.results, { lastActiveAt }, DEMO_NOW_SEC);

    await ctx.db.patch(userDocId, {
      applicationScore: finalScores.applicationScore,
      behavioralScore: finalScores.behavioralScore,
      comprehensionScore: finalScores.comprehensionScore,
      insightsScore: finalScores.insightsScore,
      lastActiveAt,
      lastScoreUpdateAt: DEMO_NOW_SEC,
      masteryScore: finalScores.masteryScore,
      retentionScore: finalScores.retentionScore,
      riskBucket: finalScores.riskBucket,
      riskLevel: finalScores.riskBucket,
    });

    await ctx.db.insert("course_enrollments", {
      cohortId: DEMO_COHORT_ID,
      courseId: course.courseId,
      enrolledAt: learnerProfile.createdAtSec,
      enrollmentId: `enrollment_${course.courseId}_${learnerProfile.key}`,
      lastActivityAt: lastActiveAt,
      status: finalScores.riskBucket === "disengaged" ? "inactive" : "active",
      userId,
      completionPct: generated.completionPct,
      insightsScore: finalScores.insightsScore,
      isAtRisk: finalScores.riskBucket === "at_risk" || finalScores.riskBucket === "disengaged",
      targetCompletionDate: course.targetCompletionDate,
    });

    for (const cutoffSec of HISTORY_CUTOFFS) {
      const pointResults = generated.results.filter((result) => result.completedAt <= cutoffSec);
      const userAtPoint = { lastActiveAt: Math.min(lastActiveAt, cutoffSec) };
      const pointScores = computeDemoScores(pointResults, userAtPoint, cutoffSec);

      await ctx.db.insert("score_history", {
        userId,
        applicationScore: pointScores.applicationScore,
        comprehensionScore: pointScores.comprehensionScore,
        retentionScore: pointScores.retentionScore,
        behavioralScore: pointScores.behavioralScore,
        masteryScore: pointScores.masteryScore,
        riskBucket: pointScores.riskBucket,
        calculatedAt: cutoffSec,
      });

      for (const moduleDef of course.modules) {
        const moduleResults = pointResults.filter((result) => result.moduleId === moduleDef.moduleId);
        const moduleScores = computeDemoScores(moduleResults, userAtPoint, cutoffSec);
        await ctx.db.insert("course_mastery_history", {
          cohortId: DEMO_COHORT_ID,
          courseId: course.courseId,
          userId,
          moduleId: moduleDef.moduleId,
          applicationScore: moduleScores.applicationScore,
          comprehensionScore: moduleScores.comprehensionScore,
          insightsScore: moduleScores.insightsScore,
          retentionScore: moduleScores.retentionScore,
          behavioralScore: moduleScores.behavioralScore,
          masteryScore: moduleScores.masteryScore,
          riskBucket: moduleScores.riskBucket,
          calculatedAt: cutoffSec,
        });
      }
    }

    for (const period of PERIODS) {
      const userAtPoint = { lastActiveAt: Math.min(lastActiveAt, period.cutoffSec) };
      for (const moduleDef of course.modules) {
        for (const conceptDef of moduleDef.concepts) {
          const conceptResults = generated.results.filter(
            (result) =>
              result.completedAt <= period.cutoffSec &&
              result.conceptIds.includes(conceptDef.conceptId)
          );
          const conceptScores = computeDemoScores(conceptResults, userAtPoint, period.cutoffSec);
          await ctx.db.insert("concept_mastery_scores", {
            cohortId: DEMO_COHORT_ID,
            courseId: course.courseId,
            moduleId: moduleDef.moduleId,
            conceptId: conceptDef.conceptId,
            userId,
            applicationScore: conceptScores.applicationScore,
            comprehensionScore: conceptScores.comprehensionScore,
            engagementScore: conceptScores.behavioralScore,
            insightsScore: conceptScores.insightsScore,
            isAtRisk:
              conceptScores.riskBucket === "at_risk" ||
              conceptScores.riskBucket === "disengaged",
            masteryScore: conceptScores.masteryScore,
            calculatedAt: period.cutoffSec,
            periodKey: period.key,
          });
        }
      }
    }
  },
});

export const finalizeCourseAggregates = internalMutation({
  args: { courseId: v.string() },
  handler: async (ctx, { courseId }) => {
    const course = getCourseDefinition(courseId);
    const enrollments = await ctx.db
      .query("course_enrollments")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
    const users = await Promise.all(
      enrollments.map(async (enrollment) =>
        ctx.db
          .query("user")
          .withIndex("by_userId", (q) => q.eq("userId", enrollment.userId))
          .unique()
      )
    );
    const learnerDocs = users.filter((user): user is NonNullable<typeof user> => user !== null);

    const historyRows = await ctx.db
      .query("course_mastery_history")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();

    const latestSnapshots = new Map<string, (typeof historyRows)[number]>();
    for (const row of historyRows) {
      const key = `${row.userId}:${row.moduleId}`;
      const existing = latestSnapshots.get(key);
      if (!existing || row.calculatedAt > existing.calculatedAt) {
        latestSnapshots.set(key, row);
      }
    }

    const moduleAverages = course.modules.map((moduleDef) => {
      const learnerScores = enrollments.map((enrollment) => {
        const snapshot = latestSnapshots.get(`${enrollment.userId}:${moduleDef.moduleId}`);
        return snapshot?.masteryScore ?? 0;
      });
      const averageScore = round2(average(learnerScores));
      return {
        moduleId: moduleDef.moduleId,
        moduleLabel: `Module ${moduleDef.order}`,
        averageScore,
        cohortRiskBucket: moduleRiskLabel(averageScore),
      };
    });

    for (const moduleAverage of moduleAverages) {
      await ctx.db.insert("module_insights", {
        courseId,
        moduleId: moduleAverage.moduleId,
        moduleLabel: moduleAverage.moduleLabel,
        courseTitle: course.title,
        averageScore: moduleAverage.averageScore,
        cohortRiskBucket: moduleAverage.cohortRiskBucket,
      });
    }

    const diagnosisCounts = {
      high_mastery: 0,
      on_track: 0,
      at_risk: 0,
      disengaged: 0,
    };
    for (const learnerDoc of learnerDocs) {
      const moduleScores = course.modules.map((moduleDef) => {
        const snapshot = latestSnapshots.get(`${learnerDoc.userId}:${moduleDef.moduleId}`);
        return snapshot?.masteryScore ?? 0;
      });
      const averagedMastery = average(moduleScores);
      const lastActiveAt = learnerDoc.lastActiveAt ?? DEMO_NOW_SEC;
      const riskBucket = getRiskBucketForMasteryScore({
        masteryScore: averagedMastery,
        daysSinceActive: (DEMO_NOW_SEC - lastActiveAt) / 86400,
        hasActivityData: moduleScores.length > 0,
      });
      diagnosisCounts[riskBucket as keyof typeof diagnosisCounts] += 1;
    }

    const avgApplication = average(learnerDocs.map((user) => user.applicationScore ?? 0));
    const avgRetrieval = average(learnerDocs.map((user) => user.comprehensionScore ?? 0));
    const avgRetention = average(learnerDocs.map((user) => user.retentionScore ?? 0));
    const avgBehaviour = average(learnerDocs.map((user) => user.behavioralScore ?? 0));
    const cohortHealthScore = Math.round(
      average(learnerDocs.map((user) => user.insightsScore ?? user.masteryScore ?? 0))
    );
    const applicationContribution = Math.round(avgApplication * 0.4);
    const retrievalContribution = Math.round(avgRetrieval * 0.3);
    const retentionContribution = Math.round(avgRetention * 0.2);
    const behaviourContribution = Math.round(avgBehaviour * 0.1);
    const frictionModules = [...moduleAverages]
      .sort((left, right) => left.averageScore - right.averageScore)
      .slice(0, 2)
      .map((moduleAverage) => `#${moduleAverage.moduleLabel.replace("Module ", "")}`);

    const courseDoc = await ctx.db
      .query("courses")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .unique();
    if (!courseDoc) {
      throw new Error(`Missing course document for ${courseId}`);
    }

    await ctx.db.patch(courseDoc._id, {
      title: course.title,
      cohortHealthScore,
      studentsAtRisk: diagnosisCounts.at_risk + diagnosisCounts.disengaged,
      frictionModules,
      totalStudents: learnerDocs.length,
      diagnosisHighMastery: diagnosisCounts.high_mastery,
      diagnosisOnTrack: diagnosisCounts.on_track,
      diagnosisAtRisk: diagnosisCounts.at_risk,
      diagnosisDisengaged: diagnosisCounts.disengaged,
      masteryScore:
        applicationContribution + retrievalContribution + retentionContribution + behaviourContribution,
      applicationScore: applicationContribution,
      applicationMax: 40,
      retrievalScore: retrievalContribution,
      retrievalMax: 30,
      retentionScore: retentionContribution,
      retentionMax: 20,
      behaviourScore: behaviourContribution,
      behaviourMax: 10,
    });

    const results = await ctx.db
      .query("task_results")
      .withIndex("by_courseId", (q) => q.eq("courseId", courseId))
      .collect();
    const assessmentRows = buildCourseAssessments(course, results);
    for (const assessmentRow of assessmentRows) {
      await ctx.db.insert("course_assessments", assessmentRow);
    }
  },
});

export const finalizeCohortRecord = internalMutation({
  args: {},
  returns: v.object({ learnerCount: v.float64() }),
  handler: async (ctx) => {
    const learnerUsers = (await ctx.db
      .query("user")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", DEMO_COHORT_ID))
      .collect())
      .filter((user) => user.role === "learner" && Boolean(user.userId))
      .sort((left, right) => left.name.localeCompare(right.name));

    const cohort = await ctx.db
      .query("cohort")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", DEMO_COHORT_ID))
      .unique();

    if (!cohort) {
      throw new Error(`Missing cohort ${DEMO_COHORT_ID}`);
    }

    await ctx.db.patch(cohort._id, {
      learnerIds: learnerUsers
        .map((user) => user.userId)
        .filter((userId): userId is string => Boolean(userId)),
      moduleId: "mod_ai_01",
    });

    return { learnerCount: learnerUsers.length };
  },
});

function getCourseDefinition(courseId: string): CourseDef {
  const course = COURSE_DEFINITIONS[courseId as DemoCourseId];
  if (!course) {
    throw new Error(`Unknown demo course: ${courseId}`);
  }
  return course;
}

function getLearnerProfile(course: CourseDef, learnerKey: string): LearnerProfile {
  const learnerProfile = course.learners.find((learner) => learner.key === learnerKey);
  if (!learnerProfile) {
    throw new Error(`Unknown learner ${learnerKey} for ${course.courseId}`);
  }
  return learnerProfile;
}

function generateLearnerSeed(
  course: CourseDef,
  learnerProfile: LearnerProfile,
  userId: string,
  nowSec: number
): { completionPct: number; results: SeededTaskResult[] } {
  const archetype = ARCHETYPES[learnerProfile.archetype];
  const lastActiveAt = nowSec - archetype.lastActiveDaysAgo * 86400;
  const allConcepts = course.modules.flatMap((moduleDef) =>
    moduleDef.concepts.map((conceptDef) => ({ moduleDef, conceptDef }))
  );
  const totalPotentialResults = allConcepts.length * 3;
  const results: SeededTaskResult[] = [];

  for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex += 1) {
    const moduleDef = course.modules[moduleIndex];
    const moduleStartSec = course.courseStartSec + moduleIndex * 13 * 86400;

    for (let conceptIndex = 0; conceptIndex < moduleDef.concepts.length; conceptIndex += 1) {
      const conceptDef = moduleDef.concepts[conceptIndex];
      const conceptSeed = seededNumber(`${course.courseId}:${learnerProfile.key}:${conceptDef.conceptId}`);
      const conceptStartSec = moduleStartSec + conceptIndex * 3 * 86400;
      const quizCompletedAt = conceptStartSec + 6 * 3600;
      const assignmentCompletedAt = conceptStartSec + 32 * 3600;
      const retentionCompletedAt = Math.min(nowSec - 86400, conceptStartSec + 16 * 86400);
      const difficultyPenalty = (moduleDef.difficulty + conceptDef.difficulty) * 10;
      const quizPct = clamp(archetype.retrieval - difficultyPenalty + conceptSeed * 6, 28, 98);
      const assignmentPct = clamp(archetype.application - difficultyPenalty * 0.85 + conceptSeed * 5, 22, 99);
      const retentionPct = clamp(archetype.retention - difficultyPenalty + conceptSeed * 4.5, 18, 97);
      const confidenceScore = clamp(archetype.confidence - difficultyPenalty * 0.2 + conceptSeed * 4, 22, 96);
      const sessionFrequency = clamp(archetype.sessionFrequency + conceptSeed * 0.8, 0.6, 6.2);
      const inactiveTabRate = clamp(archetype.inactiveTabRate - conceptSeed * 0.01, 0.02, 0.32);
      const replayCount = Math.max(0, Math.round(archetype.contentReplayCount + conceptSeed * 1.2));
      const rereadCount = Math.max(0, Math.round(archetype.reReadCount + conceptSeed));
      const discussionCount = Math.max(0, Math.round(archetype.discussionContributionCount + conceptSeed));
      const helpRequests = Math.max(0, Math.round(archetype.helpRequestCount + Math.abs(conceptSeed)));
      const quizAttempts = Math.max(1, Math.round(archetype.attempts + (quizPct < 65 ? 1 : 0)));
      const assignmentApproved = assignmentPct >= 58;
      const timeOnTaskSec = Math.round(
        820 + moduleDef.difficulty * 240 + conceptDef.difficulty * 180 + Math.abs(conceptSeed) * 120
      );
      const completionGate = seededNumber(`${learnerProfile.key}:${conceptDef.conceptId}:completion`);
      const quizAssessmentId = buildAssessmentId(course.courseId, moduleDef.order, "quiz");
      const assignmentAssessmentId = buildAssessmentId(course.courseId, moduleDef.order, "assignment");

      const quizRow: SeededTaskResult = {
        assessmentId: quizAssessmentId,
        attempts: quizAttempts,
        confidenceScore,
        conceptIds: [conceptDef.conceptId],
        contentReplayCount: replayCount,
        courseId: course.courseId,
        discussionContributionCount: discussionCount,
        helpRequestCount: helpRequests,
        inactiveTabRate,
        maxScore: 100,
        moduleId: moduleDef.moduleId,
        reReadCount: rereadCount,
        responseTimeAvgSec: Math.round(34 + moduleDef.difficulty * 16 + Math.abs(conceptSeed) * 8),
        resultId: `result_${userId}_${quizTaskId(conceptDef.conceptId)}`,
        score: round2(quizPct),
        sessionFrequency,
        taskId: quizTaskId(conceptDef.conceptId),
        taskType: "quiz",
        timeOnTaskSec,
        userId,
        completedAt: quizCompletedAt,
        cohortId: DEMO_COHORT_ID,
      };
      const assignmentRow: SeededTaskResult = {
        assessmentId: assignmentAssessmentId,
        assignmentWeight: round2(1 + moduleDef.difficulty * 0.35),
        confidenceScore: clamp(confidenceScore + 2, 22, 98),
        conceptIds: [conceptDef.conceptId],
        contentReplayCount: replayCount,
        courseId: course.courseId,
        discussionContributionCount: discussionCount,
        helpRequestCount: helpRequests,
        inactiveTabRate,
        instructorApproved: assignmentApproved,
        maxScore: 100,
        moduleId: moduleDef.moduleId,
        reReadCount: rereadCount,
        responseTimeAvgSec: Math.round(80 + moduleDef.difficulty * 30 + Math.abs(conceptSeed) * 12),
        resultId: `result_${userId}_${assignmentTaskId(conceptDef.conceptId)}`,
        rubricScore: round2(clamp(assignmentPct + 4 + conceptSeed * 3, 25, 100)),
        score: round2(assignmentPct),
        sessionFrequency,
        taskId: assignmentTaskId(conceptDef.conceptId),
        taskType: "assignment",
        timeOnTaskSec: timeOnTaskSec + 420,
        userId,
        completedAt: assignmentCompletedAt,
        cohortId: DEMO_COHORT_ID,
      };
      const retentionRow: SeededTaskResult = {
        attempts: Math.max(1, quizAttempts - 1),
        confidenceScore: clamp(confidenceScore - 4, 20, 95),
        conceptIds: [conceptDef.conceptId],
        contentReplayCount: replayCount + 1,
        courseId: course.courseId,
        discussionContributionCount: discussionCount,
        helpRequestCount: helpRequests,
        inactiveTabRate: clamp(inactiveTabRate + 0.01, 0.02, 0.32),
        maxScore: 100,
        moduleId: moduleDef.moduleId,
        reReadCount: rereadCount + 1,
        responseTimeAvgSec: Math.round(38 + moduleDef.difficulty * 14 + Math.abs(conceptSeed) * 6),
        resultId: `result_${userId}_${retentionTaskId(conceptDef.conceptId)}`,
        retentionDelayDays: 14,
        score: round2(retentionPct),
        sessionFrequency,
        taskId: retentionTaskId(conceptDef.conceptId),
        taskType: "quiz",
        timeOnTaskSec: Math.round(timeOnTaskSec * 0.7),
        userId,
        completedAt: retentionCompletedAt,
        cohortId: DEMO_COHORT_ID,
      };

      for (const row of [quizRow, assignmentRow, retentionRow]) {
        if (
          row.completedAt <= lastActiveAt &&
          completionGate <= archetype.completionBias
        ) {
          results.push(row);
        }
      }
    }
  }

  return {
    completionPct: Math.round((results.length / totalPotentialResults) * 100),
    results,
  };
}

function buildCourseAssessments(
  course: CourseDef,
  results: Array<{
    moduleId: string;
    taskType: string;
    retentionDelayDays?: number | null;
    maxScore: number;
    score: number;
  }>
) {
  const assessments: Array<{
    courseId: string;
    assessmentId: string;
    assessmentType: string;
    assessmentKind: string;
    assessmentName: string;
    moduleLesson: string;
    moduleId: string;
    dueDate: number;
    status: string;
    averageScore?: number;
    order: number;
  }> = [];

  let order = 1;
  for (const moduleDef of course.modules) {
    const moduleResults = results.filter((result) => result.moduleId === moduleDef.moduleId);
    const quizScores = moduleResults
      .filter((result) => result.taskType === "quiz" && result.retentionDelayDays == null)
      .map((result) => (result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0));
    const assignmentScores = moduleResults
      .filter((result) => result.taskType === "assignment")
      .map((result) => (result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0));
    const isFinalModule = moduleDef.order === course.modules.length;
    const quizDueDate = millisFromSec(course.courseStartSec + moduleDef.order * 12 * 86400);
    const assignmentDueDate = millisFromSec(course.courseStartSec + moduleDef.order * 12 * 86400 + 2 * 86400);

    assessments.push({
      courseId: course.courseId,
      assessmentId: buildAssessmentId(course.courseId, moduleDef.order, "quiz"),
      assessmentType: `Quiz ${moduleDef.order}`,
      assessmentKind: "quiz",
      assessmentName: `Quiz ${moduleDef.order}`,
      moduleLesson: `${moduleDef.title}/ Module ${moduleDef.order}`,
      moduleId: moduleDef.moduleId,
      dueDate: quizDueDate,
      status: isFinalModule ? "in_progress" : "done",
      averageScore: isFinalModule ? undefined : round2(average(quizScores)),
      order: order++,
    });
    assessments.push({
      courseId: course.courseId,
      assessmentId: buildAssessmentId(course.courseId, moduleDef.order, "assignment"),
      assessmentType: `Assignment ${moduleDef.order}`,
      assessmentKind: "assignment",
      assessmentName: `Assignment ${moduleDef.order}`,
      moduleLesson: `${moduleDef.title}/ Module ${moduleDef.order}`,
      moduleId: moduleDef.moduleId,
      dueDate: assignmentDueDate,
      status: moduleDef.order >= course.modules.length - 1 ? "in_progress" : "done",
      averageScore:
        moduleDef.order >= course.modules.length - 1 ? undefined : round2(average(assignmentScores)),
      order: order++,
    });
  }

  return assessments;
}

function computeDemoScores(
  results: SeededTaskResult[],
  user: { lastActiveAt?: number | null },
  nowSec: number
): ComputedScores {
  if (results.length === 0) {
    const lastActiveAt = user.lastActiveAt ?? nowSec;
    const daysSinceActive = (nowSec - lastActiveAt) / 86400;
    return {
      applicationScore: 0,
      behavioralScore: 0,
      comprehensionScore: 0,
      insightsScore: 0,
      masteryScore: 0,
      retentionScore: 0,
      riskBucket: getRiskBucketForMasteryScore({
        masteryScore: 0,
        daysSinceActive,
        hasActivityData: false,
      }),
    };
  }
  return computeScoresFromResults(results, user, nowSec);
}

function learner(
  key: string,
  name: string,
  email: string,
  jobTitle: string,
  organization: string,
  personaTag: string,
  archetype: ArchetypeKey,
  createdAtIso: string
): LearnerProfile {
  return {
    key,
    name,
    email,
    jobTitle,
    organization,
    personaTag,
    archetype,
    createdAtSec: unix(createdAtIso),
  };
}

function learnerUserId(key: string) {
  return `demo_${key}`;
}

function quizTaskId(conceptId: string) {
  return `${conceptId}_quiz`;
}

function assignmentTaskId(conceptId: string) {
  return `${conceptId}_assignment`;
}

function retentionTaskId(conceptId: string) {
  return `${conceptId}_retention`;
}

function buildAssessmentId(courseId: string, moduleOrder: number, kind: "quiz" | "assignment") {
  return `assessment_${courseId}_m${moduleOrder}_${kind}`;
}

function moduleRiskLabel(averageScore: number) {
  if (averageScore >= 80) return "Low";
  if (averageScore >= 65) return "Moderate";
  return "High";
}

function seededNumber(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }
  return ((hash % 1000) / 1000) * 2 - 1;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function unix(isoDate: string) {
  return Math.floor(new Date(isoDate).getTime() / 1000);
}

function millisFromSec(value: number) {
  return Math.round(value * 1000);
}
