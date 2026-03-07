import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get a lesson by _id */
export const get = query({
  args: { id: v.id("lesson") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

/** List lessons for a module (text, video, audio content) */
export const listByModule = query({
  args: { moduleId: v.string() },
  handler: async (ctx, { moduleId }) => {
    return await ctx.db
      .query("lesson")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});

/** List lessons for a concept */
export const listByConcept = query({
  args: { conceptId: v.string() },
  handler: async (ctx, { conceptId }) => {
    return await ctx.db
      .query("lesson")
      .withIndex("by_conceptId", (q) => q.eq("conceptId", conceptId))
      .collect();
  },
});
