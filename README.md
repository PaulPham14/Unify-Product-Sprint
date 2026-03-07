Data schema:
User has 2 types: instructor or learner. 

Course
  └ Modules
      └ Concepts
          └ Tasks

## Convex backend

The app uses [Convex](https://convex.dev) as the database. Schema, queries, and mutations live in `/convex/`.

### Setup

1. Install deps: `npm install`
2. Link a Convex project and generate types: `npx convex dev` (log in, create or link a project; this creates `convex/_generated` and `.env.local` with `NEXT_PUBLIC_CONVEX_URL`)
3. Run the app: `npm run dev`

### Convex layout

- **Schema:** `convex/schema.ts` — tables: `user`, `cohort`, `modules`, `concept`, `tasks`, `task_results`. Indexes are defined for all non-_id filters.
- **Queries (reads):** `convex/users.ts`, `convex/cohorts.ts`, `convex/modules.ts`, `convex/concepts.ts`, `convex/tasks.ts`, `convex/taskResults.ts`
- **Mutations (writes):** `users.create` / `users.patch`, `taskResults.insert` / `taskResults.patch`

### Usage from the frontend

```ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// In a component:
const user = useQuery(api.users.get, { id: userId });
const tasks = useQuery(api.tasks.listByConcept, { conceptId });
await useMutation(api.taskResults.insert)({ userId, taskId, ... });
```