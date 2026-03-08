import { mutation } from "./_generated/server";

const INSTRUCTOR_ID = "instructor_001";
const COHORT_ID = "cohort_ai_001";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Clean up existing seeded data (idempotent)
    const existing = await ctx.db.query("courses").collect();
    for (const doc of existing) await ctx.db.delete(doc._id);

    const existingAssessments = await ctx.db.query("course_assessments").collect();
    for (const doc of existingAssessments) await ctx.db.delete(doc._id);

    const existingModules = await ctx.db.query("modules").collect();
    const seededModuleIds = new Set(modulesData.flatMap((g) => g.modules.map((m) => m.moduleId)));
    for (const doc of existingModules) {
      if (seededModuleIds.has(doc.moduleId)) await ctx.db.delete(doc._id);
    }

    const existingConcepts = await ctx.db.query("concept").collect();
    const seededConceptIds = new Set(
      modulesData.flatMap((g) => g.modules.flatMap((m) => m.concepts.map((c) => c.conceptId)))
    );
    for (const doc of existingConcepts) {
      if (doc.conceptId && seededConceptIds.has(doc.conceptId)) await ctx.db.delete(doc._id);
    }

    const existingModuleInsights = await ctx.db.query("module_insights").collect();
    for (const doc of existingModuleInsights) await ctx.db.delete(doc._id);

    // Seed courses
    for (const c of coursesData) {
      await ctx.db.insert("courses", c);
    }

    // Seed modules and concepts
    const now = Date.now();
    let moduleCount = 0;
    let conceptCount = 0;

    for (const group of modulesData) {
      for (const mod of group.modules) {
        await ctx.db.insert("modules", {
          moduleId: mod.moduleId,
          courseId: group.courseId,
          cohortId: COHORT_ID,
          instructorId: INSTRUCTOR_ID,
          title: mod.title,
          description: mod.description,
          order: mod.order,
          createdAt: now - (group.modules.length - mod.order) * 86400000,
        });
        moduleCount++;

        for (const concept of mod.concepts) {
          await ctx.db.insert("concept", {
            conceptId: concept.conceptId,
            moduleId: mod.moduleId,
            title: concept.title,
          });
          conceptCount++;
        }
      }
    }

    // Seed assessments
    const allAssessments = [...aiAssessments, ...zoomAssessments, ...taxAssessments];
    for (const a of allAssessments) {
      await ctx.db.insert("course_assessments", a);
    }

    // Seed module insights (average score per module; risk Low/Moderate/High; consistent with course masteryScore)
    for (const row of moduleInsightsData) {
      await ctx.db.insert("module_insights", row);
    }

    return {
      courses: coursesData.length,
      modules: moduleCount,
      concepts: conceptCount,
      assessments: allAssessments.length,
      moduleInsights: moduleInsightsData.length,
    };
  },
});

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const coursesData = [
  {
    courseId: "course_ai_fundamentals",
    title: "AI Fundamentals",
    cohortHealthScore: 72,
    studentsAtRisk: 18,
    frictionModules: ["#3", "#4"],
    totalStudents: 51,
    diagnosisHighMastery: 6,
    diagnosisOnTrack: 24,
    diagnosisAtRisk: 18,
    diagnosisDisengaged: 3,
    masteryScore: 75,
    applicationScore: 28,
    applicationMax: 40,
    retrievalScore: 22,
    retrievalMax: 30,
    retentionScore: 15,
    retentionMax: 20,
    behaviourScore: 10,
    behaviourMax: 10,
  },
  {
    courseId: "course_zoom",
    title: "Zoom",
    cohortHealthScore: 85,
    studentsAtRisk: 5,
    frictionModules: ["#2"],
    totalStudents: 38,
    diagnosisHighMastery: 12,
    diagnosisOnTrack: 18,
    diagnosisAtRisk: 5,
    diagnosisDisengaged: 3,
    masteryScore: 82,
    applicationScore: 34,
    applicationMax: 40,
    retrievalScore: 25,
    retrievalMax: 30,
    retentionScore: 16,
    retentionMax: 20,
    behaviourScore: 7,
    behaviourMax: 10,
  },
  {
    courseId: "course_unify_taxes",
    title: "Unify Taxes",
    cohortHealthScore: 61,
    studentsAtRisk: 22,
    frictionModules: ["#1", "#5"],
    totalStudents: 44,
    diagnosisHighMastery: 4,
    diagnosisOnTrack: 14,
    diagnosisAtRisk: 22,
    diagnosisDisengaged: 4,
    masteryScore: 58,
    applicationScore: 20,
    applicationMax: 40,
    retrievalScore: 18,
    retrievalMax: 30,
    retentionScore: 12,
    retentionMax: 20,
    behaviourScore: 8,
    behaviourMax: 10,
  },
];

const modulesData = [
  {
    courseId: "course_ai_fundamentals",
    modules: [
      {
        moduleId: "mod_ai_01",
        title: "Introduction to AI & Machine Learning",
        description: "Core concepts of artificial intelligence, history, and modern applications of ML.",
        order: 1,
        concepts: [
          { conceptId: "con_ai_01_a", title: "What is Artificial Intelligence?" },
          { conceptId: "con_ai_01_b", title: "Supervised vs Unsupervised Learning" },
          { conceptId: "con_ai_01_c", title: "AI Ethics & Bias" },
        ],
      },
      {
        moduleId: "mod_ai_02",
        title: "Data Preprocessing & Feature Engineering",
        description: "Techniques for cleaning data, handling missing values, and creating meaningful features.",
        order: 2,
        concepts: [
          { conceptId: "con_ai_02_a", title: "Data Cleaning Pipelines" },
          { conceptId: "con_ai_02_b", title: "Feature Scaling & Normalization" },
        ],
      },
      {
        moduleId: "mod_ai_03",
        title: "Neural Networks & Deep Learning",
        description: "Fundamentals of neural network architecture, backpropagation, and gradient descent.",
        order: 3,
        concepts: [
          { conceptId: "con_ai_03_a", title: "Perceptrons & Activation Functions" },
          { conceptId: "con_ai_03_b", title: "Backpropagation & Gradient Descent" },
          { conceptId: "con_ai_03_c", title: "Convolutional Neural Networks" },
        ],
      },
      {
        moduleId: "mod_ai_04",
        title: "Natural Language Processing",
        description: "Text analysis, tokenization, embeddings, and transformer architectures.",
        order: 4,
        concepts: [
          { conceptId: "con_ai_04_a", title: "Tokenization & Word Embeddings" },
          { conceptId: "con_ai_04_b", title: "Attention Mechanisms & Transformers" },
        ],
      },
      {
        moduleId: "mod_ai_05",
        title: "Model Evaluation & Deployment",
        description: "Metrics for model performance, cross-validation, and deploying models to production.",
        order: 5,
        concepts: [
          { conceptId: "con_ai_05_a", title: "Precision, Recall & F1 Score" },
          { conceptId: "con_ai_05_b", title: "Model Serving & MLOps" },
        ],
      },
    ],
  },
  {
    courseId: "course_zoom",
    modules: [
      {
        moduleId: "mod_zoom_01",
        title: "Getting Started with Zoom",
        description: "Account setup, interface overview, and scheduling your first meeting.",
        order: 1,
        concepts: [
          { conceptId: "con_zoom_01_a", title: "Account Setup & Settings" },
          { conceptId: "con_zoom_01_b", title: "Scheduling Meetings" },
        ],
      },
      {
        moduleId: "mod_zoom_02",
        title: "Advanced Meeting Features",
        description: "Breakout rooms, polls, screen sharing, and recording best practices.",
        order: 2,
        concepts: [
          { conceptId: "con_zoom_02_a", title: "Breakout Rooms & Polls" },
          { conceptId: "con_zoom_02_b", title: "Screen Sharing & Annotations" },
          { conceptId: "con_zoom_02_c", title: "Recording & Cloud Storage" },
        ],
      },
      {
        moduleId: "mod_zoom_03",
        title: "Zoom for Education",
        description: "Classroom management, engagement tools, and LMS integration.",
        order: 3,
        concepts: [
          { conceptId: "con_zoom_03_a", title: "Classroom Management Tools" },
          { conceptId: "con_zoom_03_b", title: "LMS Integration" },
        ],
      },
    ],
  },
  {
    courseId: "course_unify_taxes",
    modules: [
      {
        moduleId: "mod_tax_01",
        title: "Tax Fundamentals",
        description: "Overview of tax systems, filing requirements, and key terminology.",
        order: 1,
        concepts: [
          { conceptId: "con_tax_01_a", title: "Tax Brackets & Filing Status" },
          { conceptId: "con_tax_01_b", title: "Standard vs Itemized Deductions" },
        ],
      },
      {
        moduleId: "mod_tax_02",
        title: "Income & Deductions",
        description: "Types of income, above-the-line deductions, and common credits.",
        order: 2,
        concepts: [
          { conceptId: "con_tax_02_a", title: "W-2 vs 1099 Income" },
          { conceptId: "con_tax_02_b", title: "Tax Credits & Deductions" },
          { conceptId: "con_tax_02_c", title: "Self-Employment Tax" },
        ],
      },
      {
        moduleId: "mod_tax_03",
        title: "Business Taxation",
        description: "Corporate structures, pass-through entities, and quarterly estimated payments.",
        order: 3,
        concepts: [
          { conceptId: "con_tax_03_a", title: "Entity Types & Tax Implications" },
          { conceptId: "con_tax_03_b", title: "Estimated Quarterly Payments" },
        ],
      },
      {
        moduleId: "mod_tax_04",
        title: "Tax Planning & Strategy",
        description: "Year-round tax planning, retirement contributions, and capital gains optimization.",
        order: 4,
        concepts: [
          { conceptId: "con_tax_04_a", title: "Retirement Account Contributions" },
          { conceptId: "con_tax_04_b", title: "Capital Gains & Losses" },
          { conceptId: "con_tax_04_c", title: "Year-End Tax Planning Checklist" },
        ],
      },
    ],
  },
];

const aiAssessments = [
  { courseId: "course_ai_fundamentals", assessmentType: "Assignment 2", moduleLesson: "Neural Networks/ Module 3", dueDate: new Date("2026-03-15").getTime(), status: "in_progress", order: 1 },
  { courseId: "course_ai_fundamentals", assessmentType: "Quiz 4", moduleLesson: "NLP/ Module 4", dueDate: new Date("2026-03-08").getTime(), status: "in_progress", order: 2 },
  { courseId: "course_ai_fundamentals", assessmentType: "Assignment 1", moduleLesson: "Neural Networks/ Module 3", dueDate: new Date("2026-03-06").getTime(), status: "done", averageScore: 70, order: 3 },
  { courseId: "course_ai_fundamentals", assessmentType: "Quiz 3", moduleLesson: "Data Preprocessing/ Module 2", dueDate: new Date("2026-03-04").getTime(), status: "done", averageScore: 62, order: 4 },
  { courseId: "course_ai_fundamentals", assessmentType: "Quiz 2", moduleLesson: "Data Preprocessing/ Module 2", dueDate: new Date("2026-02-28").getTime(), status: "done", averageScore: 83, order: 5 },
  { courseId: "course_ai_fundamentals", assessmentType: "Quiz 1", moduleLesson: "Intro to AI/ Module 1", dueDate: new Date("2026-02-20").getTime(), status: "done", averageScore: 81, order: 6 },
  { courseId: "course_ai_fundamentals", assessmentType: "Assignment 3", moduleLesson: "Model Evaluation/ Module 5", dueDate: new Date("2026-03-22").getTime(), status: "in_progress", order: 7 },
  { courseId: "course_ai_fundamentals", assessmentType: "Quiz 5", moduleLesson: "Model Evaluation/ Module 5", dueDate: new Date("2026-03-18").getTime(), status: "in_progress", order: 8 },
  { courseId: "course_ai_fundamentals", assessmentType: "Mid-Term", moduleLesson: "Data Preprocessing/ Module 2", dueDate: new Date("2026-02-15").getTime(), status: "done", averageScore: 76, order: 9 },
  { courseId: "course_ai_fundamentals", assessmentType: "Quiz 0", moduleLesson: "Intro to AI/ Module 1", dueDate: new Date("2026-02-10").getTime(), status: "done", averageScore: 89, order: 10 },
];

const zoomAssessments = [
  { courseId: "course_zoom", assessmentType: "Quiz 3", moduleLesson: "Zoom for Education/ Module 3", dueDate: new Date("2026-03-10").getTime(), status: "in_progress", order: 1 },
  { courseId: "course_zoom", assessmentType: "Assignment 1", moduleLesson: "Advanced Features/ Module 2", dueDate: new Date("2026-03-02").getTime(), status: "done", averageScore: 88, order: 2 },
  { courseId: "course_zoom", assessmentType: "Quiz 2", moduleLesson: "Advanced Features/ Module 2", dueDate: new Date("2026-02-25").getTime(), status: "done", averageScore: 91, order: 3 },
  { courseId: "course_zoom", assessmentType: "Quiz 1", moduleLesson: "Getting Started/ Module 1", dueDate: new Date("2026-02-18").getTime(), status: "done", averageScore: 85, order: 4 },
];

const taxAssessments = [
  { courseId: "course_unify_taxes", assessmentType: "Quiz 4", moduleLesson: "Tax Planning/ Module 4", dueDate: new Date("2026-03-12").getTime(), status: "in_progress", order: 1 },
  { courseId: "course_unify_taxes", assessmentType: "Assignment 2", moduleLesson: "Business Tax/ Module 3", dueDate: new Date("2026-03-05").getTime(), status: "done", averageScore: 55, order: 2 },
  { courseId: "course_unify_taxes", assessmentType: "Quiz 3", moduleLesson: "Business Tax/ Module 3", dueDate: new Date("2026-02-27").getTime(), status: "done", averageScore: 60, order: 3 },
  { courseId: "course_unify_taxes", assessmentType: "Assignment 1", moduleLesson: "Income & Deductions/ Module 2", dueDate: new Date("2026-02-20").getTime(), status: "done", averageScore: 52, order: 4 },
  { courseId: "course_unify_taxes", assessmentType: "Quiz 2", moduleLesson: "Income & Deductions/ Module 2", dueDate: new Date("2026-02-14").getTime(), status: "done", averageScore: 64, order: 5 },
  { courseId: "course_unify_taxes", assessmentType: "Quiz 1", moduleLesson: "Tax Fundamentals/ Module 1", dueDate: new Date("2026-02-07").getTime(), status: "done", averageScore: 71, order: 6 },
];

// Module-level mastery score (%) per module; cohort-level risk is same for all modules in a course.
// Cohort risk from course health: cohortHealthScore >= 80 → Low, >= 60 → Moderate, else High.
// Module averageScore chosen so course-level mastery (mean of modules) aligns with coursesData.masteryScore.
const moduleInsightsData = [
  // AI Fundamentals: cohort health 72 → Moderate; course mastery 75; module mastery % per module
  { courseId: "course_ai_fundamentals", moduleId: "mod_ai_01", moduleLabel: "Module 1", courseTitle: "AI Fundamentals", averageScore: 81, cohortRiskBucket: "Moderate" },
  { courseId: "course_ai_fundamentals", moduleId: "mod_ai_02", moduleLabel: "Module 2", courseTitle: "AI Fundamentals", averageScore: 83, cohortRiskBucket: "Moderate" },
  { courseId: "course_ai_fundamentals", moduleId: "mod_ai_03", moduleLabel: "Module 3", courseTitle: "AI Fundamentals", averageScore: 62, cohortRiskBucket: "Moderate" },
  { courseId: "course_ai_fundamentals", moduleId: "mod_ai_04", moduleLabel: "Module 4", courseTitle: "AI Fundamentals", averageScore: 70, cohortRiskBucket: "Moderate" },
  { courseId: "course_ai_fundamentals", moduleId: "mod_ai_05", moduleLabel: "Module 5", courseTitle: "AI Fundamentals", averageScore: 79, cohortRiskBucket: "Moderate" },
  // Zoom: cohort health 85 → Low; course mastery 82
  { courseId: "course_zoom", moduleId: "mod_zoom_01", moduleLabel: "Module 1", courseTitle: "Zoom", averageScore: 85, cohortRiskBucket: "Low" },
  { courseId: "course_zoom", moduleId: "mod_zoom_02", moduleLabel: "Module 2", courseTitle: "Zoom", averageScore: 91, cohortRiskBucket: "Low" },
  { courseId: "course_zoom", moduleId: "mod_zoom_03", moduleLabel: "Module 3", courseTitle: "Zoom", averageScore: 70, cohortRiskBucket: "Low" },
  // Unify Taxes: cohort health 61 → High; course mastery 58
  { courseId: "course_unify_taxes", moduleId: "mod_tax_01", moduleLabel: "Module 1", courseTitle: "Unify Taxes", averageScore: 71, cohortRiskBucket: "High" },
  { courseId: "course_unify_taxes", moduleId: "mod_tax_02", moduleLabel: "Module 2", courseTitle: "Unify Taxes", averageScore: 58, cohortRiskBucket: "High" },
  { courseId: "course_unify_taxes", moduleId: "mod_tax_03", moduleLabel: "Module 3", courseTitle: "Unify Taxes", averageScore: 52, cohortRiskBucket: "High" },
  { courseId: "course_unify_taxes", moduleId: "mod_tax_04", moduleLabel: "Module 4", courseTitle: "Unify Taxes", averageScore: 51, cohortRiskBucket: "High" },
];
