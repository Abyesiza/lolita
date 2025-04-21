"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Define common expense categories
const EXPENSE_CATEGORIES = [
  "Food",
  "Utilities",
  "Transport",
  "Entertainment",
  "Housing",
  "Shopping",
  "Health",
  "Education",
  "Other"
];

type BudgetLimit = {
  _id: Id<"budgetLimits">;
  category: string;
  monthlyLimit: number;
  dailyLimit?: number;
  warningThreshold?: number;
  createdAt: number;
  updatedAt: number;
};

export default function BudgetPage() {
  // Get budget limits from Convex
  const budgetLimits = useQuery(api.budgetLimits.list) || [];
  
  // Mutations
  const createBudgetLimit = useMutation(api.budgetLimits.create);
  const updateBudgetLimit = useMutation(api.budgetLimits.update);
  const removeBudgetLimit = useMutation(api.budgetLimits.remove);
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<Id<"budgetLimits"> | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    monthlyLimit: "",
    dailyLimit: "",
    warningThreshold: "80",
  });
  
  // Get categories that already have budget limits
  const existingCategories = new Set(budgetLimits.map(limit => limit.category));
  
  // Available categories (ones that don't have a budget limit yet)
  const availableCategories = editingId
    ? EXPENSE_CATEGORIES
    : EXPENSE_CATEGORIES.filter(category => !existingCategories.has(category));
  
  // Handle edit button
  const handleEditBudgetLimit = (limit: BudgetLimit) => {
    setEditingId(limit._id);
    setFormData({
      category: limit.category,
      monthlyLimit: limit.monthlyLimit.toString(),
      dailyLimit: limit.dailyLimit?.toString() || "",
      warningThreshold: limit.warningThreshold?.toString() || "80",
    });
    setShowForm(true);
  };
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Reset form to default state
  const resetForm = () => {
    setFormData({
      category: "",
      monthlyLimit: "",
      dailyLimit: "",
      warningThreshold: "80",
    });
    setEditingId(null);
    setShowForm(false);
    setIsSubmitting(false);
  };
  
  // Add new budget limit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        // Update existing budget limit
        await updateBudgetLimit({
          id: editingId,
          monthlyLimit: parseFloat(formData.monthlyLimit),
          dailyLimit: formData.dailyLimit ? parseFloat(formData.dailyLimit) : undefined,
          warningThreshold: parseFloat(formData.warningThreshold),
        });
      } else {
        // Create new budget limit
        await createBudgetLimit({
          category: formData.category,
          monthlyLimit: parseFloat(formData.monthlyLimit),
          dailyLimit: formData.dailyLimit ? parseFloat(formData.dailyLimit) : undefined,
          warningThreshold: parseFloat(formData.warningThreshold),
        });
      }
      
      resetForm();
    } catch (error) {
      console.error("Error with budget limit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a budget limit
  const handleDeleteBudgetLimit = async (id: Id<"budgetLimits">) => {
    if (confirm("Are you sure you want to delete this budget limit?")) {
      try {
        await removeBudgetLimit({ id });
      } catch (error) {
        console.error("Error deleting budget limit:", error);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-playfair">Budget Limits</h1>
        <button 
          onClick={() => {
            if (showForm && editingId) {
              resetForm();
            } else {
              setShowForm(!showForm);
            }
          }} 
          className="btn-primary px-4 py-2 rounded-md flex items-center gap-2 font-montserrat"
          disabled={availableCategories.length === 0 && !editingId}
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Budget Limit
            </>
          )}
        </button>
      </div>
      
      {/* Introduction text */}
      <div className="bg-primary/10 p-4 rounded-md font-montserrat text-sm">
        <p>Budget limits help you track and control your spending. Set monthly and daily limits for different categories to get warnings when you approach them.</p>
      </div>
      
      {/* Add/Edit Budget Limit Form */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 font-playfair">
            {editingId ? "Edit Budget Limit" : "Create New Budget Limit"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 font-montserrat">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Expense Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border border-gray rounded-md"
                required
                disabled={!!editingId}
              >
                <option value="">Select a category</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="monthlyLimit" className="block text-sm font-medium mb-1">
                  Monthly Limit (UGX)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-dark">
                    UGX
                  </span>
                  <input
                    type="number"
                    id="monthlyLimit"
                    name="monthlyLimit"
                    value={formData.monthlyLimit}
                    onChange={handleChange}
                    className="w-full p-2 pl-12 border border-gray rounded-md"
                    placeholder="0"
                    step="1000"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="dailyLimit" className="block text-sm font-medium mb-1">
                  Daily Limit (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-dark">
                    UGX
                  </span>
                  <input
                    type="number"
                    id="dailyLimit"
                    name="dailyLimit"
                    value={formData.dailyLimit}
                    onChange={handleChange}
                    className="w-full p-2 pl-12 border border-gray rounded-md"
                    placeholder="0"
                    step="100"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="warningThreshold" className="block text-sm font-medium mb-1">
                Warning Threshold (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="warningThreshold"
                  name="warningThreshold"
                  value={formData.warningThreshold}
                  onChange={handleChange}
                  className="flex-1"
                  min="50"
                  max="100"
                  step="5"
                />
                <span className="w-10 text-right">{formData.warningThreshold}%</span>
              </div>
              <p className="text-xs text-gray-dark mt-1">
                You&apos;ll be warned when spending reaches this percentage of your limit.
              </p>
            </div>
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-md transition disabled:opacity-70"
              >
                {isSubmitting 
                  ? (editingId ? "Updating..." : "Creating...") 
                  : (editingId ? "Update Budget Limit" : "Create Budget Limit")}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Budget Limits List */}
      {budgetLimits.length > 0 ? (
        <div className="space-y-4">
          {budgetLimits.map(limit => (
            <div key={limit._id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold font-playfair">{limit.category}</h3>
                  <p className="text-sm text-gray-dark font-montserrat">
                    {limit.warningThreshold ? `Warn at ${limit.warningThreshold}%` : "Warn at 80%"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditBudgetLimit(limit)}
                    className="p-2 text-primary hover:bg-gray-light rounded-md"
                    title="Edit budget limit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteBudgetLimit(limit._id)}
                    className="p-2 text-error hover:bg-gray-light rounded-md"
                    title="Delete budget limit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div className="bg-gray-light p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-1 font-montserrat">Monthly Limit</h4>
                  <p className="text-xl font-semibold font-montserrat">UGX {limit.monthlyLimit.toLocaleString()}</p>
                </div>
                
                {limit.dailyLimit && (
                  <div className="bg-gray-light p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-1 font-montserrat">Daily Limit</h4>
                    <p className="text-xl font-semibold font-montserrat">UGX {limit.dailyLimit.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-dark card p-6 font-montserrat">
          You haven&apos;t set any budget limits yet. Create your first limit to start managing your spending!
        </div>
      )}
      
      {/* Tips Card */}
      <div className="card p-6 bg-primary/10">
        <h2 className="text-xl font-semibold mb-4 font-playfair">Budget Tips</h2>
        <div className="space-y-3 font-montserrat">
          <p className="text-sm">
            <span className="font-medium">💡 Start Small:</span> Begin by setting limits for categories where you spend the most.
          </p>
          <p className="text-sm">
            <span className="font-medium">🎯 Be Realistic:</span> Set limits based on your actual spending patterns, not aspirational goals.
          </p>
          <p className="text-sm">
            <span className="font-medium">📊 Review Regularly:</span> Adjust your budget limits monthly based on your financial situation.
          </p>
          <p className="text-sm">
            <span className="font-medium">⚠️ Warning Thresholds:</span> Customize when you get warnings to give yourself time to adjust spending.
          </p>
        </div>
      </div>
    </div>
  );
} 