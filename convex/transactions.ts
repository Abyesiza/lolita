import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create a new transaction
export const create = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return ctx.db.insert("transactions", {
      userId: identity.subject,
      description: args.description,
      amount: args.amount,
      category: args.category,
      date: args.date,
      time: args.time,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

// List all transactions for the current user
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    
    if (!user) return null;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .collect();
    
    return transactions;
  },
});

// Get recent transactions for the current user
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const limit = args.limit || 5;

    return ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit);
  },
});

// Add a new transaction
export const add = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");

    const transactionId = await ctx.db.insert("transactions", {
      userId: user.userId,
      description: args.description,
      amount: args.amount,
      category: args.category,
      date: args.date,
      time: args.time,
      notes: args.notes,
    });

    return transactionId;
  },
});

// Remove a transaction
export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
    
    if (!user) throw new Error("User not found");

    const transaction = await ctx.db.get(args.id);
    if (!transaction) throw new Error("Transaction not found");
    
    // Ensure the user owns this transaction
    if (transaction.userId !== user.userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
}); 