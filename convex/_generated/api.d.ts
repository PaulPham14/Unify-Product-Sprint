/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cohorts from "../cohorts.js";
import type * as concepts from "../concepts.js";
import type * as dashboardCourses from "../dashboardCourses.js";
import type * as lessons from "../lessons.js";
import type * as modules from "../modules.js";
import type * as scoreUtils from "../scoreUtils.js";
import type * as scores from "../scores.js";
import type * as seed from "../seed.js";
import type * as seedCourses from "../seedCourses.js";
import type * as taskResults from "../taskResults.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cohorts: typeof cohorts;
  concepts: typeof concepts;
  dashboardCourses: typeof dashboardCourses;
  lessons: typeof lessons;
  modules: typeof modules;
  scoreUtils: typeof scoreUtils;
  scores: typeof scores;
  seed: typeof seed;
  seedCourses: typeof seedCourses;
  taskResults: typeof taskResults;
  tasks: typeof tasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
