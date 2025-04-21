import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// List all savings goals for the current user
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const savingsGoals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    return savingsGoals;
  },
});

// Create a new savings goal
export const create = mutation({
  args: {
    title: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const savingsGoalId = await ctx.db.insert("savingsGoals", {
      userId,
      title: args.title,
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount || 0,
      deadline: args.deadline,
      notes: args.notes,
      createdAt: Date.now(),
    });
    
    return savingsGoalId;
  },
});

// Update an existing savings goal
export const update = mutation({
  args: {
    id: v.id("savingsGoals"),
    title: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    deadline: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const goal = await ctx.db.get(args.id);
    
    if (!goal) {
      throw new Error("Savings goal not found");
    }
    
    if (goal.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    // Only update provided fields
    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.targetAmount !== undefined) updates.targetAmount = args.targetAmount;
    if (args.currentAmount !== undefined) updates.currentAmount = args.currentAmount;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.notes !== undefined) updates.notes = args.notes;
    
    await ctx.db.patch(args.id, updates);
    
    return args.id;
  },
});

// Add funds to a savings goal
export const addFunds = mutation({
  args: {
    id: v.id("savingsGoals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const goal = await ctx.db.get(args.id);
    
    if (!goal) {
      throw new Error("Savings goal not found");
    }
    
    if (goal.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    const newAmount = goal.currentAmount + args.amount;
    await ctx.db.patch(args.id, {
      currentAmount: newAmount,
    });
    
    return args.id;
  },
});

// Delete a savings goal
export const remove = mutation({
  args: {
    id: v.id("savingsGoals"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const goal = await ctx.db.get(args.id);
    
    if (!goal) {
      throw new Error("Savings goal not found");
    }
    
    if (goal.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

// Transfer from earnings to savings goal
export const transferFromEarnings = mutation({
  args: {
    id: v.id("savingsGoals"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const goal = await ctx.db.get(args.id);
    
    if (!goal) {
      throw new Error("Savings goal not found");
    }
    
    if (goal.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    // Update the savings goal with the new amount
    const newAmount = goal.currentAmount + args.amount;
    await ctx.db.patch(args.id, {
      currentAmount: newAmount,
    });
    
    // Create a transaction record for this transfer
    const description = args.description || `Transfer to ${goal.title} savings goal`;
    await ctx.db.insert("transactions", {
      userId,
      description,
      amount: -args.amount, // Negative amount as it's an expense
      category: "Savings",
      date: new Date().toISOString().split('T')[0],
      notes: `Transfer to savings goal: ${goal.title}`,
      createdAt: Date.now(),
    });
    
    return args.id;
  },
}); 