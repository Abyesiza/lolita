"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";


export default function SavingsPage() {
  // Get savings goals from Convex
  const savingsGoals = useQuery(api.savingsGoals.list) || [];
  
  // Mutations
  const createSavingsGoal = useMutation(api.savingsGoals.create);
  const addFundsToGoal = useMutation(api.savingsGoals.addFunds);
  const transferFromEarnings = useMutation(api.savingsGoals.transferFromEarnings);
  const removeSavingsGoal = useMutation(api.savingsGoals.remove);
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    notes: ""
  });
  
  // State for custom transfer amount
  const [transferAmounts, setTransferAmounts] = useState<Record<string, string>>({});
  const [showTransferInput, setShowTransferInput] = useState<Record<string, boolean>>({});
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Add new savings goal
  const handleAddSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createSavingsGoal({
        title: formData.title,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        deadline: formData.deadline || undefined,
        notes: formData.notes || undefined,
      });
      
      // Reset form
      setFormData({
        title: "",
        targetAmount: "",
        currentAmount: "",
        deadline: "",
        notes: ""
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error creating savings goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update savings goal amount by adding funds
  const handleAddFunds = async (id: Id<"savingsGoals">, amount: number) => {
    try {
      await addFundsToGoal({ id, amount });
    } catch (error) {
      console.error("Error adding funds:", error);
    }
  };
  
  // Transfer from earnings to savings
  const handleTransferFromEarnings = async (id: Id<"savingsGoals">, amount: number) => {
    try {
      await transferFromEarnings({ 
        id, 
        amount,
        description: `Transfer to savings goal`
      });
      // Reset custom amount input
      setTransferAmounts(prev => ({...prev, [id]: ''}));
      setShowTransferInput(prev => ({...prev, [id]: false}));
    } catch (error) {
      console.error("Error transferring funds:", error);
    }
  };
  
  // Handle change in custom transfer amount
  const handleTransferAmountChange = (id: Id<"savingsGoals">, value: string) => {
    setTransferAmounts(prev => ({...prev, [id]: value}));
  };
  
  // Toggle custom transfer input
  const toggleTransferInput = (id: Id<"savingsGoals">) => {
    setShowTransferInput(prev => ({...prev, [id]: !prev[id]}));
  };
  
  // Delete a savings goal
  const handleDeleteGoal = async (id: Id<"savingsGoals">) => {
    if (confirm("Are you sure you want to delete this savings goal?")) {
      try {
        await removeSavingsGoal({ id });
      } catch (error) {
        console.error("Error deleting savings goal:", error);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-playfair">Savings Goals</h1>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary px-4 py-2 rounded-md flex items-center gap-2 font-montserrat"
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
              New Savings Goal
            </>
          )}
        </button>
      </div>
      
      {showForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 font-playfair">Create New Savings Goal</h2>
          <form onSubmit={handleAddSavingsGoal} className="space-y-4 font-montserrat">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Goal Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-gray rounded-md"
                placeholder="e.g., Emergency Fund, Vacation, etc."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="targetAmount" className="block text-sm font-medium mb-1">
                  Target Amount (UGX)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-dark">
                    UGX
                  </span>
                  <input
                    type="number"
                    id="targetAmount"
                    name="targetAmount"
                    value={formData.targetAmount}
                    onChange={handleChange}
                    className="w-full p-2 pl-12 border border-gray rounded-md"
                    placeholder="0"
                    step="1"
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="currentAmount" className="block text-sm font-medium mb-1">
                  Current Amount (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-dark">
                    UGX
                  </span>
                  <input
                    type="number"
                    id="currentAmount"
                    name="currentAmount"
                    value={formData.currentAmount}
                    onChange={handleChange}
                    className="w-full p-2 pl-12 border border-gray rounded-md"
                    placeholder="0"
                    step="1"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium mb-1">
                Target Date (Optional)
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full p-2 border border-gray rounded-md"
              />
            </div>
            
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
                rows={3}
                placeholder="Add details about your savings goal..."
              />
            </div>
            
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-md transition disabled:opacity-70"
              >
                {isSubmitting ? "Creating..." : "Create Savings Goal"}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.map(goal => {
          const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
          const remainingAmount = goal.targetAmount - goal.currentAmount;
          
          return (
            <div key={goal._id} className="card p-6 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold font-playfair">{goal.title}</h3>
                <button 
                  onClick={() => handleDeleteGoal(goal._id)}
                  className="text-error hover:text-error-dark"
                  title="Delete goal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
              
              {goal.deadline && (
                <p className="text-sm text-gray-dark mb-4 font-montserrat">
                  Target date: {new Date(goal.deadline).toLocaleDateString()}
                </p>
              )}
              
              <div className="flex justify-between text-sm mb-1 font-montserrat">
                <span>UGX {goal.currentAmount.toLocaleString()}</span>
                <span>UGX {goal.targetAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-center text-sm mt-1 font-montserrat">
                {progressPercentage}% complete
              </div>
              
              <p className="text-sm mb-2 font-montserrat">
                UGX {remainingAmount.toLocaleString()} left to reach your goal
              </p>
              
              {goal.notes && (
                <p className="text-sm text-gray-dark mt-2 mb-4 font-montserrat">{goal.notes}</p>
              )}
              
              <div className="mt-auto pt-4 space-y-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAddFunds(goal._id, 10000)} 
                    className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition font-montserrat"
                  >
                    Add 10,000
                  </button>
                  <button 
                    onClick={() => handleAddFunds(goal._id, 50000)} 
                    className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition font-montserrat"
                  >
                    Add 50,000
                  </button>
                </div>
                
                {/* Transfer from Earnings section */}
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm font-medium mb-2 font-montserrat">Transfer from Earnings</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleTransferFromEarnings(goal._id, 10000)} 
                      className="flex-1 py-2 bg-success hover:bg-success/80 text-white rounded-md transition font-montserrat text-sm"
                    >
                      Transfer 10,000
                    </button>
                    <button 
                      onClick={()  => toggleTransferInput(goal._id)} 
                      className="py-2 px-3 bg-gray-light hover:bg-gray text-foreground rounded-md transition font-montserrat"
                    >
                      {showTransferInput[goal._id] ? 'Cancel' : 'Custom'}
                    </button>
                  </div>
                  
                  {showTransferInput[goal._id] && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="number"
                        className="flex-1 p-2 border border-gray rounded-md text-sm"
                        placeholder="Enter amount"
                        value={transferAmounts[goal._id] || ''}
                        onChange={(e) => handleTransferAmountChange(goal._id, e.target.value)}
                      />
                      <button
                        onClick={() => handleTransferFromEarnings(goal._id, parseInt(transferAmounts[goal._id] || '0'))}
                        className="py-2 px-4 bg-success hover:bg-success/80 text-white rounded-md transition font-montserrat text-sm"
                        disabled={!transferAmounts[goal._id] || parseInt(transferAmounts[goal._id] || '0') <= 0}
                      >
                        Transfer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {savingsGoals.length === 0 && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-dark">
            You haven&apos;t created any savings goals yet. Start saving toward your financial goals.
          </p>
        </div>
      )}
    </div>
  );
} 