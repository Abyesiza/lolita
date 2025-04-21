import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table to store Clerk user information
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // Transactions table for financial records
  transactions: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    notes: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // Savings goals
  savingsGoals: defineTable({
    userId: v.string(),
    title: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    deadline: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Budget limits
  budgetLimits: defineTable({
    userId: v.string(),
    category: v.string(),
    monthlyLimit: v.number(),
    dailyLimit: v.optional(v.number()),
    warningThreshold: v.optional(v.number()), // Percentage (0-100) at which to show warnings
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]).index("by_userId_and_category", ["userId", "category"]),
  
  // Budget plans for shopping lists and purchase planning
  budgetPlans: defineTable({
    userId: v.string(),
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
    createdAt: v.number(),
    completed: v.boolean(),
  }).index("by_userId", ["userId"]),
}); 