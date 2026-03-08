import { query } from "./_generated/server";
import { v } from "convex/values";

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("score_history")
      .withIndex("by_userId_calculatedAt", (q) => q.eq("userId", userId))
      .collect();
  },
});
