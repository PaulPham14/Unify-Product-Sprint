import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Get a user by Convex document _id */
export const get = query({
  args: { id: v.id("user") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** Get a user by external userId string (e.g. from auth) */
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("user")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/** Get a user by email */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("user")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

/** List users in a cohort */
export const listByCohort = query({
  args: { cohortId: v.string() },
  handler: async (ctx, { cohortId }) => {
    return await ctx.db
      .query("user")
      .withIndex("by_cohortId", (q) => q.eq("cohortId", cohortId))
      .collect();
  },
});

/** Create or update user (upsert by email or userId) */
export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    cohortId: v.string(),
    role: v.string(),
    createdAt: v.float64(),
    userId: v.optional(v.string()),
    applicationScore: v.optional(v.float64()),
    behavioralScore: v.optional(v.float64()),
    comprehensionScore: v.optional(v.float64()),
    insightsScore: v.optional(v.float64()),
    jobTitle: v.optional(v.string()),
    retentionScore: v.optional(v.float64()),
    riskLevel: v.optional(v.string()),
    lastActiveAt: v.optional(v.float64()),
    organization: v.optional(v.string()),
    personaTag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("user", args);
  },
});

/** Update a user by _id */
export const patch = mutation({
  args: {
    id: v.id("user"),
    name: v.optional(v.string()),
    cohortId: v.optional(v.string()),
    role: v.optional(v.string()),
    applicationScore: v.optional(v.float64()),
    behavioralScore: v.optional(v.float64()),
    comprehensionScore: v.optional(v.float64()),
    insightsScore: v.optional(v.float64()),
    jobTitle: v.optional(v.string()),
    retentionScore: v.optional(v.float64()),
    riskLevel: v.optional(v.string()),
    riskBucket: v.optional(v.string()),
    masteryScore: v.optional(v.float64()),
    lastScoreUpdateAt: v.optional(v.float64()),
    lastActiveAt: v.optional(v.float64()),
    organization: v.optional(v.string()),
    personaTag: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, updates);
    return id;
  },
});
