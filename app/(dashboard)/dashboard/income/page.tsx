"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Income sources
const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Business",
  "Investments",
  "Gifts",
  "Other"
];

export default function IncomePage() {
  const transactions = useQuery(api.transactions.list) || [];
  const savingsGoals = useQuery(api.savingsGoals.list) || [];

  // Get only income transactions (positive amounts)
  const incomeTransactions = transactions.filter(t => t.amount > 0);
  
  // Calculate income statistics
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Group income by source
  const incomeBySource = new Map<string, number>();
  incomeTransactions.forEach(transaction => {
    // Extract source from notes (format: "Source: X - Additional notes")
    const sourceMatch = transaction.notes?.match(/Source: ([^-]+)/);
    const source = sourceMatch ? sourceMatch[1].trim() : "Unknown";
    
    const currentAmount = incomeBySource.get(source) || 0;
    incomeBySource.set(source, currentAmount + transaction.amount);
  });
  
  // Convert to array for display
  const incomeSourceData = Array.from(incomeBySource.entries())
    .map(([source, amount]) => ({
      source,
      amount,
      percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Income form state
  const createTransaction = useMutation(api.transactions.create);
  const transferToSavings = useMutation(api.savingsGoals.transferFromEarnings);
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    incomeSource: "Salary",
    notes: ""
  });
  
  const [autoSave, setAutoSave] = useState(false);
  const [savingsPercent, setSavingsPercent] = useState(10);
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle savings percent change
  const handleSavingsPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSavingsPercent(Math.min(Math.max(value, 0), 100)); // Limit between 0-100%
  };
  
  // Submit income form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert amount to number (income is always positive)
      const amountValue = parseFloat(formData.amount);
      
      // Format notes with source information
      const notes = `Source: ${formData.incomeSource}${formData.notes ? ` - ${formData.notes}` : ''}`;
      
      // Create transaction
      await createTransaction({
        description: formData.description,
        amount: amountValue, // Positive for income
        category: "Income",
        date: formData.date,
        notes: notes,
      });
      
      // Handle auto-save if enabled
      if (autoSave && selectedGoalId && savingsPercent > 0) {
        const savingsAmount = (amountValue * savingsPercent) / 100;
        if (savingsAmount > 0) {
          await transferToSavings({
            id: selectedGoalId as Id<"savingsGoals">,
            amount: savingsAmount,
            description: `Auto-save from ${formData.description}`
          });
        }
      }
      
      // Reset form
      setFormData({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        incomeSource: "Salary",
        notes: ""
      });
      
    } catch (error) {
      console.error("Error recording income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get month name for grouping
  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  
  // Group transactions by month
  const incomeByMonth = new Map<string, { transactions: typeof incomeTransactions, total: number }>();
  
  incomeTransactions.forEach(transaction => {
    const monthYear = getMonthName(transaction.date);
    
    if (!incomeByMonth.has(monthYear)) {
      incomeByMonth.set(monthYear, { transactions: [], total: 0 });
    }
    
    const monthData = incomeByMonth.get(monthYear)!;
    monthData.transactions.push(transaction);
    monthData.total += transaction.amount;
  });
  
  // Convert to array and sort by date (newest first)
  const monthlyIncomeData = Array.from(incomeByMonth.entries())
    .map(([month, data]) => ({
      month,
      transactions: data.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      total: data.total
    }))
    .sort((a, b) => {
      // Get the date from the first transaction in each group
      const dateA = a.transactions[0]?.date || "";
      const dateB = b.transactions[0]?.date || "";
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-playfair">Income Tracking</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income form */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 font-playfair">Record New Income</h2>
          <form onSubmit={handleSubmit} className="space-y-4 font-montserrat">
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Income Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border border-gray rounded-md"
                placeholder="e.g., Monthly Salary, Project Payment"
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
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Date Received
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
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-2 border border-gray rounded-md"
                rows={2}
                placeholder="Any additional details about this income"
              />
            </div>
            
            {/* Auto-save section */}
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
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 rounded-md transition-colors ${
                isSubmitting ? "bg-gray-light text-gray-dark" : "bg-success hover:bg-success/80 text-white"
              }`}
            >
              {isSubmitting ? "Recording..." : "Record Income"}
            </button>
          </form>
        </div>
        
        {/* Income statistics */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 font-playfair">Income Summary</h2>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2 font-montserrat">Total Income</h3>
              <p className="text-3xl font-bold text-success font-montserrat">
                UGX {totalIncome.toLocaleString()}
              </p>
            </div>
            
            <h3 className="text-lg font-medium mb-2 font-montserrat">Income by Source</h3>
            <div className="space-y-3">
              {incomeSourceData.map((source) => (
                <div key={source.source} className="space-y-1">
                  <div className="flex justify-between font-montserrat">
                    <span>{source.source}</span>
                    <span className="text-gray-dark">
                      UGX {source.amount.toLocaleString()} 
                      <span className="text-xs ml-1">({source.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full" 
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              
              {incomeSourceData.length === 0 && (
                <p className="text-sm text-gray-dark font-montserrat">
                  No income sources recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Income history by month */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 font-playfair">Income History</h2>
        
        {monthlyIncomeData.length > 0 ? (
          <div className="space-y-6">
            {monthlyIncomeData.map(monthData => (
              <div key={monthData.month} className="border-b border-gray pb-4 mb-4 last:border-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium font-montserrat">{monthData.month}</h3>
                  <span className="text-success font-medium font-montserrat">
                    UGX {monthData.total.toLocaleString()}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full font-montserrat">
                    <thead>
                      <tr className="border-b border-gray">
                        <th className="text-left p-2 text-gray-dark">Description</th>
                        <th className="text-left p-2 text-gray-dark">Source</th>
                        <th className="text-left p-2 text-gray-dark">Date</th>
                        <th className="text-right p-2 text-gray-dark">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthData.transactions.map(transaction => {
                        // Extract source from notes
                        const sourceMatch = transaction.notes?.match(/Source: ([^-]+)/);
                        const source = sourceMatch ? sourceMatch[1].trim() : "Unknown";
                        
                        return (
                          <tr key={transaction._id} className="border-b border-gray hover:bg-gray-light">
                            <td className="p-3">{transaction.description}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-gray-light">
                                {source}
                              </span>
                            </td>
                            <td className="p-3 text-gray-dark">{transaction.date}</td>
                            <td className="p-3 text-right text-success">
                              UGX {transaction.amount.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-dark font-montserrat">
            <p>No income records yet. Add your first income to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
} 