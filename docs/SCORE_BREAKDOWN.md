# Score & Insights Breakdown

This document explains how learner mastery scores are computed, stored, and displayed in the Learner Insights dashboard.

---

## 1. Overview

Each learner has **four component scores** (0–100) and one **overall mastery score** (0–100). A **cohort risk bucket** (High Mastery, On Track, At Risk, Disengaged) is derived from mastery and recency. All of this is computed from `task_results` and the `user` document and stored on the **user** document in Convex.

| Component   | Weight | What it measures |
|------------|--------|-------------------|
| Application | 40% | Can the learner *do* it? (assignments, projects, rubrics) |
| Retrieval   | 30% | Can they *recall* it? (quizzes, knowledge checks) |
| Retention   | 20% | Does it *stick*? (follow-up / same question later) |
| Behavior    | 10% | How they *engage* (sessions, recency, focus) |

**Overall mastery** =  
`0.4 × Application + 0.3 × Retrieval + 0.2 × Retention + 0.1 × Behavior`

---

## 2. Where the data lives

- **Convex `user` table**  
  Stores the **output** of the calculation (and is the source of truth for the dashboard):
  - `applicationScore`, `comprehensionScore` (retrieval), `retentionScore`, `behavioralScore`
  - `masteryScore`, `riskBucket`, `lastScoreUpdateAt`, `lastActiveAt`

- **Convex `task_results` table**  
  Stores the **input** for the calculation (one row per user × task completion):
  - `userId`, `taskId`, `moduleId`, `taskType` (e.g. `"quiz"`, `"assignment"`)
  - `score`, `maxScore`, `completedAt`
  - Optional: `attempts`, `responseTimeAvgSec`, `assignmentWeight`, `rubricScore`, `instructorApproved`, `retentionDelayDays`, `sessionFrequency`, `inactiveTabRate`, `dropOffConceptId`, etc.

Scores are **recalculated** (not stored per task) by the backend using all of a user’s `task_results`. After new or updated task results, you should call `scores.recalculateScoresForUser({ userId })` so the user document is updated.

---

## 3. How each component score is computed

Logic lives in **`convex/scoreUtils.ts`** (used by `scores.recalculateScoresForUser` and the seed).

### 3.1 Retrieval (30%) — “Can they recall it?”

**Source:** Task results whose `taskType` is treated as quiz / knowledge check:

- `quiz`
- `knowledge_check` / `knowledge check` / `check your understanding`

**Formula:**

1. For each such result: **raw %** = `(score / maxScore) × 100`.
2. **Attempt penalty:**  
   `penalized = raw% × (1 / (1 + 0.08 × max(0, attempts - 1)))`.  
   So more attempts reduce the contribution of that result.
3. **Retrieval score** = average of these penalized values (0 if there are no quiz-type results).

**Relevant `task_results` fields:** `taskType`, `score`, `maxScore`, `attempts` (optional).  
`responseTimeAvgSec` is not used in the current formula but is available for future use (e.g. “response time: Normal/Slow” on the dashboard).

---

### 3.2 Application (40%) — “Can they do it?”

**Source:** Task results whose `taskType` contains `assignment`.

**Formula:**

1. For each assignment result:
   - **Weight** `w` = `assignmentWeight ?? 1`.
   - **Value** = `(score / maxScore) × 100`.
   - If `rubricScore` is present: `value = 0.7 × value + 0.3 × rubricScore`.
   - If `instructorApproved === false`: `value *= 0.8`.
2. **Application score** = weighted average:  
   `sum(value × w) / sum(w)` (0 if there are no assignment results).

**Relevant `task_results` fields:** `taskType`, `score`, `maxScore`, `assignmentWeight`, `rubricScore`, `instructorApproved`.

---

### 3.3 Retention (20%) — “Does it stick?”

**Source:** Any task result with **`retentionDelayDays`** set and &gt; 0 (e.g. follow-up quiz or same/similar question asked later).

**Formula:**

- **Retention score** = average of `(score / maxScore) × 100` over those results (0 if there are none).

**Relevant `task_results` fields:** `retentionDelayDays`, `score`, `maxScore`.

---

### 3.4 Behavior (10%) — “How do they engage?”

**Source:** All of the user’s task results (for averages) and the **user** document (for recency).

**Formula (starts at 100, then adjustments):**

1. **Inactive tabs:**  
   If **average** `inactiveTabRate` across results **&gt; 0.15** (15%):  
   subtract `min(40, avgInactive × 80)`.
2. **Recency (from `user.lastActiveAt`):**  
   - If `daysSinceActive > 30`: subtract 40.  
   - Else if `daysSinceActive > 14`: subtract 20.
3. **Session frequency (bonus):**  
   Add `min(15, (avgSessionFreq / 10) × 15)`.
4. **Behavior score** = result clamped to **0–100**.

**Relevant data:**  
- `task_results`: `inactiveTabRate`, `sessionFrequency` (averaged over user’s results).  
- `user`: `lastActiveAt` (Unix seconds).  
- Constant: **inactive tab threshold = 0.15**; **disengaged days = 30**.

---

## 4. Cohort risk bucket

After **mastery** and **days since active** are known:

| Condition | Bucket |
|-----------|--------|
| Has results and `daysSinceActive > 30` | **disengaged** |
| `masteryScore ≥ 85` | **high_mastery** |
| `masteryScore ≥ 65` and &lt; 85 | **on_track** |
| `masteryScore ≥ 50` and &lt; 65 | **at_risk** |
| Otherwise | **disengaged** |

These values are stored on the user as `riskBucket` (and mirrored in `riskLevel` for compatibility). Thresholds: **85**, **65**, **50**; disengaged after **30** days inactive.

---

## 5. Dashboard labels (observations under each score)

The **numbers** (scores, percentages) are from the **database** (user + task_results). The **short observation lines** under each main score (e.g. “Retry attempts: Moderate”, “Project rubric: adequate”) are **not** stored in the DB; they are **derived in the frontend** from the same scores, using fixed thresholds.

Defined in **`components/learner-insights-content.tsx`** when building the `observations` array for each `InsightCard`:

### Retrieval Practice

- **Quiz accuracy:** `retrievalScore × 0.95` (capped at 100%), or “—” if no score.
- **Retry attempts:**  
  - &lt; 60 → “High”  
  - &lt; 80 → “Moderate”  
  - else → “Low”
- **Response time:**  
  - &lt; 50 → “Slow”  
  - else → “Normal”

### Applied Tasks

- **Project rubric:**  
  - ≥ 75 → “strong”  
  - ≥ 50 → “adequate”  
  - else → “needs work”
- **Assignment performance:**  
  - ≥ 70 → “consistent”  
  - else → “variable”

### Retention

- First line:  
  - &lt; 65 → “Week-over-week recall drop”  
  - else → “Stable recall”
- Second line:  
  - &lt; 60 → “Reinforcement missing”  
  - else → “Reinforcement on track”

### Learning Behaviour

- **Video replays:** ≥ 70 → “high”, else “moderate”.
- **Discussion engagement:** ≥ 65 → “good”, else “low”.

So: **data is dynamic from the DB; the wording and thresholds for these labels are hardcoded in the UI.**

---

## 6. When scores are updated

- **Recalculation:**  
  `scores.recalculateScoresForUser({ userId })`  
  - Reads all `task_results` for that user and the `user` doc.  
  - Runs `computeScoresFromResults` (same logic as above).  
  - Writes the six values + `lastScoreUpdateAt` (and optionally `lastActiveAt`) back to the user.

- **When to call it:**  
  After inserting or updating task results for a learner (e.g. after `taskResults.insert` or `taskResults.patch`). The Learner Insights page also has a **“Recalculate scores”** button that calls this for the selected learner.

- **Seed:**  
  `seed.seedCohortLearnerMetrics({ cohortId })` creates demo `task_results` for all learners in the cohort and then recalculates (and patches) each user so the dashboard shows non-empty, varied metrics.

---

## 7. Quick reference: constants

| Constant | Value | Used in |
|----------|--------|---------|
| Application weight | 0.4 | Mastery formula |
| Retrieval weight   | 0.3 | Mastery formula |
| Retention weight   | 0.2 | Mastery formula |
| Behavior weight    | 0.1 | Mastery formula |
| High Mastery       | ≥ 85 | Risk bucket |
| On Track           | 65–84 | Risk bucket |
| At Risk            | 50–64 | Risk bucket |
| Disengaged (score) | &lt; 50 | Risk bucket |
| Disengaged (days)  | &gt; 30 days inactive | Risk bucket |
| Inactive tab threshold | 0.15 (15%) | Behavior score |
| Attempt penalty factor | 0.08 | Retrieval (per extra attempt) |
| Rubric blend       | 0.7×score + 0.3×rubricScore | Application |
| Instructor not approved penalty | ×0.8 | Application |

---

## 8. File reference

| File | Role |
|------|------|
| `convex/scoreUtils.ts` | Pure function `computeScoresFromResults(results, user, nowSec?)` → component scores + mastery + riskBucket. |
| `convex/scores.ts` | Mutation `recalculateScoresForUser({ userId })`: loads user + results, calls `computeScoresFromResults`, patches user. |
| `convex/seed.ts` | Mutation `seedCohortLearnerMetrics({ cohortId })`: inserts demo task_results per learner, then recomputes and patches each user. |
| `convex/schema.ts` | Defines `user` and `task_results` tables (and optional fields like `assignmentWeight`, `rubricScore`, `retentionDelayDays`, etc.). |
| `components/learner-insights-content.tsx` | Reads user (and task_results for the chart), displays scores and risk bucket from DB; builds observation labels from scores with fixed thresholds. |

For more on the Convex setup and when to call recalc, see the main [README](../README.md).
