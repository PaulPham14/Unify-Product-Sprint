# Demo Data Model Audit

## What changed

The production demo data model now supports course-scoped learner analytics without changing any existing route contracts or removing any fields.

### Added table

- `course_enrollments`
  - Purpose: represent distinct learner rosters per course while preserving the app's current single-cohort assumptions.
  - Why: the dashboard previously inferred course membership indirectly from module activity, which made cohort diagnosis and course analytics brittle.

### Added optional fields

- `task_results.courseId`
  - Purpose: tie raw evidence directly to a course.
- `task_results.timeOnTaskSec`, `contentReplayCount`, `reReadCount`, `discussionContributionCount`, `helpRequestCount`, `confidenceScore`
  - Purpose: support realistic engagement and confidence signals in demo data.
- `course_mastery_history.courseId`
  - Purpose: make module history explicitly course-scoped.
- `course_mastery_history.insightsScore`
  - Purpose: persist the composite learner insights score alongside module mastery history.
- `concept_mastery_scores.applicationScore`, `comprehensionScore`, `engagementScore`, `insightsScore`, `isAtRisk`
  - Purpose: store concept-level analytics that align with the instructor dashboard story.
- `user.jobTitle`, `organization`, `personaTag`
  - Purpose: make learner profiles feel realistic in a live demo and support future segmentation.

## Why the previous model was insufficient

- Learners only belonged to a cohort, not to a course.
- Course history was inferred from `moduleId`, not stored explicitly.
- Engagement was represented narrowly, which made demo learner behavior feel synthetic.
- `insightsScore` existed on `user` but was not consistently backed by seeded raw evidence.
- The old seed path produced `seed_demo_module` activity that did not align with the actual course catalog powering the dashboard.

## What stayed the same

- No existing schema fields were removed or renamed.
- Existing page routes and dashboard queries remain compatible.
- AI Fundamentals stays in the demo catalog unchanged at the course/module/concept level.

## Result

The demo dataset can now support:

- distinct course rosters inside one shared instructor cohort
- realistic learner mastery, comprehension, retention, and engagement variation
- course diagnosis counts that match learner-level evidence
- module and concept views backed by actual seeded data instead of UI constants
