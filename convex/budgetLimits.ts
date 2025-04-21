import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// List all budget limits for the current user
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const budgetLimits = await ctx.db
      .query("budgetLimits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    
    return budgetLimits;
  },
});

// Get budget limit for a specific category
export const getByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const budgetLimit = await ctx.db
      .query("budgetLimits")
      .withIndex("by_userId_and_category", (q) => 
        q.eq("userId", userId).eq("category", args.category)
      )
      .first();
    
    return budgetLimit;
  },
});

// Create a new budget limit
export const create = mutation({
  args: {
    category: v.string(),
    monthlyLimit: v.number(),
    dailyLimit: v.optional(v.number()),
    warningThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    
    // Check if a budget limit already exists for this category
    const existingLimit = await ctx.db
      .query("budgetLimits")
      .withIndex("by_userId_and_category", (q) => 
        q.eq("userId", userId).eq("category", args.category)
      )
      .first();
    
    if (existingLimit) {
      throw new Error(`Budget limit for ${args.category} already exists. Use update instead.`);
    }
    
    const now = Date.now();
    const budgetLimitId = await ctx.db.insert("budgetLimits", {
      userId,
      category: args.category,
      monthlyLimit: args.monthlyLimit,
      dailyLimit: args.dailyLimit,
      warningThreshold: args.warningThreshold || 80, // Default to 80% warning threshold
      createdAt: now,
      updatedAt: now,
    });
    
    return budgetLimitId;
  },
});

// Update an existing budget limit
export const update = mutation({
  args: {
    id: v.id("budgetLimits"),
    monthlyLimit: v.optional(v.number()),
    dailyLimit: v.optional(v.number()),
    warningThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const budgetLimit = await ctx.db.get(args.id);
    
    if (!budgetLimit) {
      throw new Error("Budget limit not found");
    }
    
    if (budgetLimit.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    // Only update provided fields
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    if (args.monthlyLimit !== undefined) updates.monthlyLimit = args.monthlyLimit;
    if (args.dailyLimit !== undefined) updates.dailyLimit = args.dailyLimit;
    if (args.warningThreshold !== undefined) updates.warningThreshold = args.warningThreshold;
    
    await ctx.db.patch(args.id, updates);
    
    return args.id;
  },
});

// Delete a budget limit
export const remove = mutation({
  args: {
    id: v.id("budgetLimits"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    const budgetLimit = await ctx.db.get(args.id);
    
    if (!budgetLimit) {
      throw new Error("Budget limit not found");
    }
    
    if (budgetLimit.userId !== userId) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

// Check if spending exceeds budget limits
export const checkSpendingWarnings = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const userId = identity.subject;
    
    // Get transactions for the current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    
    // Get budget limits (filter by category if provided)
    let budgetLimitsQuery = ctx.db
      .query("budgetLimits")
      .withIndex("by_userId", (q) => q.eq("userId", userId));
    
    if (args.category !== undefined) {
      budgetLimitsQuery = ctx.db
        .query("budgetLimits")
        .withIndex("by_userId_and_category", (q) => {
          return q.eq("userId", userId).eq("category", args.category as string);
        });
    }
    
    const budgetLimits = await budgetLimitsQuery.collect();
    
    if (budgetLimits.length === 0) {
      return [];
    }
    
    // Get transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), firstDayOfMonth))
      .collect();
    
    // Calculate spending by category
    const spendingByCategory = new Map<string, { monthly: number, daily: number }>();
    
    for (const transaction of transactions) {
      if (transaction.amount < 0 && transaction.category) { // Only consider expenses with valid category
        const category = transaction.category;
        const amount = Math.abs(transaction.amount);
        const isToday = transaction.date === today;
        
        if (!spendingByCategory.has(category)) {
          spendingByCategory.set(category, { monthly: 0, daily: 0 });
        }
        
        const spending = spendingByCategory.get(category)!;
        spending.monthly += amount;
        
        if (isToday) {
          spending.daily += amount;
        }
      }
    }
    
    // Check for warnings
    const warnings = [];
    
    for (const limit of budgetLimits) {
      const spending = spendingByCategory.get(limit.category) || { monthly: 0, daily: 0 };
      const monthlyPercentage = (spending.monthly / limit.monthlyLimit) * 100;
      
      if (monthlyPercentage >= (limit.warningThreshold || 80)) {
        warnings.push({
          category: limit.category,
          type: "monthly",
          limit: limit.monthlyLimit,
          spent: spending.monthly,
          percentage: monthlyPercentage,
          remaining: limit.monthlyLimit - spending.monthly,
        });
      }
      
      if (limit.dailyLimit && spending.daily >= limit.dailyLimit) {
        warnings.push({
          category: limit.category,
          type: "daily",
          limit: limit.dailyLimit,
          spent: spending.daily,
          percentage: (spending.daily / limit.dailyLimit) * 100,
          remaining: limit.dailyLimit - spending.daily,
        });
      }
    }
    
    return warnings;
  },
}); 