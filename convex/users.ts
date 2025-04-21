import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new user or update if exists
export const createOrUpdate = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingUser) {
      // Update existing user
      return ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        image: args.image,
      });
    }

    // Create new user
    return ctx.db.insert("users", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      image: args.image,
      createdAt: Date.now(),
    });
  },
});

// Get a user by Clerk User ID
export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get the currently authenticated user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
  },
}); 