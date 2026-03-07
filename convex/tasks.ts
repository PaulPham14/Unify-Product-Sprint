import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get a task by Convex document _id */
export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** Get tasks for a concept */
export const listByConcept = query({
  args: { conceptId: v.string() },
  handler: async (ctx, { conceptId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_conceptId", (q) => q.eq("conceptId", conceptId))
      .collect();
  },
});

/** List tasks for a module */
export const listByModule = query({
  args: { moduleId: v.string() },
  handler: async (ctx, { moduleId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});
