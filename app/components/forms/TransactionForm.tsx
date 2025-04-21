"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Transaction categories
const CATEGORIES = [
  "Food",
  "Utilities",
  "Transport",
  "Entertainment",
  "Housing",
  "Shopping",
  "Health",
  "Education",
  "Income",
  "Savings",
  "Other"
];

// Income sources
const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Gifts",
  "Other"
];

export default function TransactionForm({ onSuccess }: { onSuccess?: () => void }) {
  const createTransaction = useMutation(api.transactions.create);
  const transferToSavings = useMutation(api.savingsGoals.addFunds);
  const [isExpense, setIsExpense] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [savingsPercent, setSavingsPercent] = useState(10);
  
  // Get savings goals for auto-save feature
  const savingsGoals = useQuery(api.savingsGoals.list) || [];
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    category: "Food",
    incomeSource: "Salary",
    notes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // When changing to income, set category to Income
  const handleTransactionTypeChange = (isExp: boolean) => {
    setIsExpense(isExp);
    if (!isExp) {
      setFormData({
        ...formData,
        category: "Income"
      });
    } else {
      setFormData({
        ...formData,
        category: "Food"
      });
    }
  };
  
  // Handle savings percent change
  const handleSavingsPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSavingsPercent(Math.min(Math.max(value, 0), 100)); // Limit between 0-100%
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert amount to number and apply negative sign if it's an expense
      const amountValue = parseFloat(formData.amount);
      const finalAmount = isExpense ? -Math.abs(amountValue) : Math.abs(amountValue);
      
      // Income category metadata with source
      const notes = isExpense 
        ? formData.notes 
        : `Source: ${formData.incomeSource}${formData.notes ? ` - ${formData.notes}` : ''}`;
      
      // Submit to Convex
      await createTransaction({
        description: formData.description,
        amount: finalAmount,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        notes: notes || undefined,
      });
      
      // Handle auto-save if enabled and this is income
      if (!isExpense && autoSave && selectedGoalId && savingsPercent > 0) {
        const savingsAmount = (amountValue * savingsPercent) / 100;
        if (savingsAmount > 0) {
          await transferToSavings({
            id: selectedGoalId as Id<"savingsGoals">,
            amount: savingsAmount
          });
        }
      }
      
      // Reset form
      setFormData({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: isExpense ? "Food" : "Income",
        incomeSource: "Salary",
        notes: ""
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-montserrat">
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-md font-montserrat ${
            isExpense
              ? "bg-error text-white"
              : "bg-gray-light text-gray-dark"
          }`}
          onClick={() => handleTransactionTypeChange(true)}
        >
          Expense
        </button>
        <button
          type="button"
          className={`flex-1 py-2 px-4 rounded-md font-montserrat ${
            !isExpense
              ? "bg-success text-white"
              : "bg-gray-light text-gray-dark"
          }`}
          onClick={() => handleTransactionTypeChange(false)}
        >
          Income
        </button>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border border-gray rounded-md"
          placeholder="What was this transaction for?"
          required
        />
      </div>
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">
          Amount (UGX)
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className="w-full p-2 border border-gray rounded-md"
          placeholder="Enter amount in UGX"
          min="0"
          step="1000"
          required
        />
      </div>
      
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1">
          Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full p-2 border border-gray rounded-md"
          required
        />
      </div>
      
      <div>
        <label htmlFor="time" className="block text-sm font-medium mb-1">
          Time
        </label>
        <input
          type="time"
          id="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          className="w-full p-2 border border-gray rounded-md"
        />
      </div>
      
      {isExpense ? (
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border border-gray rounded-md"
            required
          >
            {CATEGORIES.filter(cat => cat !== "Income").map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="incomeSource" className="block text-sm font-medium mb-1">
              Income Source
            </label>
            <select
              id="incomeSource"
              name="incomeSource"
              value={formData.incomeSource}
              onChange={handleChange}
              className="w-full p-2 border border-gray rounded-md"
              required
            >
              {INCOME_SOURCES.map(source => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          
          {/* Auto-save section for income */}
          {savingsGoals.length > 0 && (
            <div className="border border-gray p-3 rounded-md mt-4">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="autoSave"
                  checked={autoSave}
                  onChange={() => setAutoSave(!autoSave)}
                  className="mr-2"
                />
                <label htmlFor="autoSave" className="text-sm font-medium">
                  Automatically save a percentage
                </label>
              </div>
              
              {autoSave && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label htmlFor="savingsGoal" className="block text-xs font-medium mb-1">
                      Save to
                    </label>
                    <select
                      id="savingsGoal"
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="w-full p-2 border border-gray rounded-md text-sm"
                      required
                    >
                      <option value="">Select a savings goal</option>
                      {savingsGoals.map(goal => (
                        <option key={goal._id} value={goal._id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="savingsPercent" className="block text-xs font-medium mb-1">
                      Percentage to save: {savingsPercent}%
                    </label>
                    <input
                      type="range"
                      id="savingsPercent"
                      min="1"
                      max="100"
                      value={savingsPercent}
                      onChange={handleSavingsPercentChange}
                      className="w-full"
                    />
                    {formData.amount && (
                      <p className="text-xs text-gray-dark mt-1">
                        This will save UGX {Math.round((parseFloat(formData.amount || '0') * savingsPercent) / 100).toLocaleString()} to your selected goal.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full p-2 border border-gray rounded-md"
          rows={2}
          placeholder="Add any additional details..."
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 rounded-md transition-colors ${
          isSubmitting ? "bg-gray-light text-gray-dark" : "bg-primary hover:bg-primary-dark text-white"
        }`}
      >
        {isSubmitting ? "Saving..." : "Save Transaction"}
      </button>
    </form>
  );
} 