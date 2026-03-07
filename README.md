Data schema:
User has 2 types: instructor or learner.

Course
  └ Modules
      └ Concepts
          └ Lessons (text, video, audio)
          └ Tasks (assignment, quiz, survey)
      └ task_results (per user: score, time to completion, attempts, etc.)

**Mastery scores** (stored on `user`, recalculated from `task_results`):
- **Overall mastery** = Application 40% + Retrieval 30% + Retention 20% + Behavior 10%
- **Retrieval:** quizzes / knowledge checks (score, attempts, response time, score delta retakes)
- **Application:** assignments (grades, weights, instructor approval, rubric)
- **Retention:** follow-up / same question later (`retentionDelayDays`, score)
- **Behavior:** session frequency/recency, inactive tabs (>15% significant), drop-off
- **Cohort bucket:** High Mastery (85–100), On Track (65–84), At Risk (50–64), Disengaged (0–49 or inactive 30+ days)

→ **Full breakdown:** [docs/SCORE_BREAKDOWN.md](docs/SCORE_BREAKDOWN.md) (formulas, thresholds, dashboard labels, file reference)

## Convex backend

The app uses [Convex](https://convex.dev) as the database. Schema, queries, and mutations live in `/convex/`.

### Setup

1. Install deps: `npm install`
2. Link a Convex project and generate types: `npx convex dev` (log in, create or link a project; this creates `convex/_generated` and `.env.local` with `NEXT_PUBLIC_CONVEX_URL`)
3. Run the app: `npm run dev`

### Convex layout

- **Schema:** `convex/schema.ts` — tables: `user`, `cohort`, `modules`, `concept`, `lesson`, `tasks`, `task_results`. User stores `masteryScore`, `riskBucket`, and the four component scores (updated by `scores.recalculateScoresForUser`).
- **Queries:** `users`, `cohorts`, `modules`, `concepts`, `lessons`, `tasks`, `taskResults`
- **Mutations:** `users.create` / `users.patch`, `taskResults.insert` / `taskResults.patch`, `scores.recalculateScoresForUser`

After inserting or updating task results, call `scores.recalculateScoresForUser({ userId })` so the learner’s mastery scores and bucket stay up to date (or use “Recalculate scores” on Learner Insights).

### Usage from the frontend

```ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const user = useQuery(api.users.get, { id: userId });
const tasks = useQuery(api.tasks.listByConcept, { conceptId });
await useMutation(api.taskResults.insert)({ userId, taskId, moduleId, taskType, score, maxScore, completedAt, resultId });
await useMutation(api.scores.recalculateScoresForUser)({ userId });
```