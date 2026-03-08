import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("courses").collect();
    if (existing.length > 0) {
      for (const doc of existing) await ctx.db.delete(doc._id);
      const existingAssessments = await ctx.db.query("course_assessments").collect();
      for (const doc of existingAssessments) await ctx.db.delete(doc._id);
    }

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

    for (const c of coursesData) {
      await ctx.db.insert("courses", c);
    }

    const aiAssessments = [
      { courseId: "course_ai_fundamentals", assessmentType: "Assignment 2", moduleLesson: "User Research/ Module 5", dueDate: new Date("2026-03-15").getTime(), status: "in_progress", order: 1 },
      { courseId: "course_ai_fundamentals", assessmentType: "Quiz 4", moduleLesson: "User Research/ Module 4", dueDate: new Date("2026-03-08").getTime(), status: "in_progress", order: 2 },
      { courseId: "course_ai_fundamentals", assessmentType: "Assignment 1", moduleLesson: "User Research/ Module 4", dueDate: new Date("2026-03-06").getTime(), status: "done", averageScore: 70, order: 3 },
      { courseId: "course_ai_fundamentals", assessmentType: "Quiz 3", moduleLesson: "User Research/ Module 3", dueDate: new Date("2026-03-04").getTime(), status: "done", averageScore: 62, order: 4 },
      { courseId: "course_ai_fundamentals", assessmentType: "Quiz 2", moduleLesson: "User Research/ Module 2", dueDate: new Date("2026-02-28").getTime(), status: "done", averageScore: 83, order: 5 },
      { courseId: "course_ai_fundamentals", assessmentType: "Quiz 1", moduleLesson: "User Research/ Module 1", dueDate: new Date("2026-02-20").getTime(), status: "done", averageScore: 81, order: 6 },
      { courseId: "course_ai_fundamentals", assessmentType: "Assignment 3", moduleLesson: "User Research/ Module 6", dueDate: new Date("2026-03-22").getTime(), status: "in_progress", order: 7 },
      { courseId: "course_ai_fundamentals", assessmentType: "Quiz 5", moduleLesson: "User Research/ Module 5", dueDate: new Date("2026-03-18").getTime(), status: "in_progress", order: 8 },
      { courseId: "course_ai_fundamentals", assessmentType: "Mid-Term", moduleLesson: "User Research/ Module 3", dueDate: new Date("2026-02-15").getTime(), status: "done", averageScore: 76, order: 9 },
      { courseId: "course_ai_fundamentals", assessmentType: "Quiz 0", moduleLesson: "User Research/ Module 1", dueDate: new Date("2026-02-10").getTime(), status: "done", averageScore: 89, order: 10 },
    ];

    const zoomAssessments = [
      { courseId: "course_zoom", assessmentType: "Quiz 3", moduleLesson: "Video Conferencing/ Module 3", dueDate: new Date("2026-03-10").getTime(), status: "in_progress", order: 1 },
      { courseId: "course_zoom", assessmentType: "Assignment 1", moduleLesson: "Video Conferencing/ Module 2", dueDate: new Date("2026-03-02").getTime(), status: "done", averageScore: 88, order: 2 },
      { courseId: "course_zoom", assessmentType: "Quiz 2", moduleLesson: "Video Conferencing/ Module 2", dueDate: new Date("2026-02-25").getTime(), status: "done", averageScore: 91, order: 3 },
      { courseId: "course_zoom", assessmentType: "Quiz 1", moduleLesson: "Video Conferencing/ Module 1", dueDate: new Date("2026-02-18").getTime(), status: "done", averageScore: 85, order: 4 },
    ];

    const taxAssessments = [
      { courseId: "course_unify_taxes", assessmentType: "Quiz 4", moduleLesson: "Tax Prep/ Module 4", dueDate: new Date("2026-03-12").getTime(), status: "in_progress", order: 1 },
      { courseId: "course_unify_taxes", assessmentType: "Assignment 2", moduleLesson: "Tax Prep/ Module 3", dueDate: new Date("2026-03-05").getTime(), status: "done", averageScore: 55, order: 2 },
      { courseId: "course_unify_taxes", assessmentType: "Quiz 3", moduleLesson: "Tax Prep/ Module 3", dueDate: new Date("2026-02-27").getTime(), status: "done", averageScore: 60, order: 3 },
      { courseId: "course_unify_taxes", assessmentType: "Assignment 1", moduleLesson: "Tax Prep/ Module 2", dueDate: new Date("2026-02-20").getTime(), status: "done", averageScore: 52, order: 4 },
      { courseId: "course_unify_taxes", assessmentType: "Quiz 2", moduleLesson: "Tax Prep/ Module 2", dueDate: new Date("2026-02-14").getTime(), status: "done", averageScore: 64, order: 5 },
      { courseId: "course_unify_taxes", assessmentType: "Quiz 1", moduleLesson: "Tax Prep/ Module 1", dueDate: new Date("2026-02-07").getTime(), status: "done", averageScore: 71, order: 6 },
    ];

    const allAssessments = [...aiAssessments, ...zoomAssessments, ...taxAssessments];
    for (const a of allAssessments) {
      await ctx.db.insert("course_assessments", a);
    }

    return { courses: coursesData.length, assessments: allAssessments.length };
  },
});
