import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all budget plans for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;
    
    const plans = await ctx.db
      .query("budgetPlans")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    return plans;
  },
});

// Create a new budget plan
export const create = mutation({
  args: {
    title: v.string(),
    totalBudget: v.number(),
    items: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        category: v.string(),
        completed: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;
    
    const planId = await ctx.db.insert("budgetPlans", {
      title: args.title,
      totalBudget: args.totalBudget,
      items: args.items,
      userId,
      createdAt: Date.now(),
      completed: false,
    });
    
    return planId;
  },
});

// Update a budget plan
export const update = mutation({
  args: {
    id: v.id("budgetPlans"),
    title: v.optional(v.string()),
    totalBudget: v.optional(v.number()),
    items: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          price: v.number(),
          quantity: v.number(),
          category: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;
    
    // Get the existing plan
    const existingPlan = await ctx.db.get(args.id);
    if (!existingPlan) {
      throw new Error("Budget plan not found");
    }
    
    // Check if the user owns this plan
    if (existingPlan.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    // Update with only the fields that were provided
    const updates: Record<string, any> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.totalBudget !== undefined) updates.totalBudget = args.totalBudget;
    if (args.items !== undefined) updates.items = args.items;
    if (args.completed !== undefined) updates.completed = args.completed;
    
    // If nothing to update, return early
    if (Object.keys(updates).length === 0) {
      return args.id;
    }
    
    // Update the plan
    await ctx.db.patch(args.id, updates);
    
    return args.id;
  },
});

// Delete a budget plan
export const deletePlan = mutation({
  args: { id: v.id("budgetPlans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;
    
    // Get the existing plan
    const existingPlan = await ctx.db.get(args.id);
    if (!existingPlan) {
      throw new Error("Budget plan not found");
    }
    
    // Check if the user owns this plan
    if (existingPlan.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    // Delete the plan
    await ctx.db.delete(args.id);
    
    return true;
  },
});

// Mark an item as completed or uncompleted in a plan
export const markItemCompleted = mutation({
  args: {
    planId: v.id("budgetPlans"),
    itemId: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;
    
    // Get the existing plan
    const existingPlan = await ctx.db.get(args.planId);
    if (!existingPlan) {
      throw new Error("Budget plan not found");
    }
    
    // Check if the user owns this plan
    if (existingPlan.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    // Update the item's completed status
    const updatedItems = existingPlan.items.map((item: any) => {
      if (item.id === args.itemId) {
        return { ...item, completed: args.completed };
      }
      return item;
    });
    
    // Update the plan
    await ctx.db.patch(args.planId, { items: updatedItems });
    
    return true;
  },
});

// Get a specific budget plan by ID
export const getById = query({
  args: { id: v.id("budgetPlans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    const userId = identity.subject;
    
    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Budget plan not found");
    }
    
    // Check if the user owns this plan
    if (plan.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    return plan;
  },
}); 