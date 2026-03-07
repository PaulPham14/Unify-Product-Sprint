import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get a concept by Convex document _id */
export const get = query({
  args: { id: v.id("concept") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** List concepts for a module */
export const listByModule = query({
  args: { moduleId: v.string() },
  handler: async (ctx, { moduleId }) => {
    return await ctx.db
      .query("concept")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId))
      .collect();
  },
});
