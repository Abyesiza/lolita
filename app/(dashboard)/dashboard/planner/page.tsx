"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  Plus, Trash2, Check, PencilLine, ShoppingBag, 
  AlertCircle, ArrowRight, DollarSign, 
  BarChart4, ChevronDown, Percent, Printer
} from "lucide-react";

interface PlanItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  completed: boolean;
}

interface BudgetPlan {
  _id?: Id<"budgetPlans">;
  title: string;
  items: PlanItem[];
  totalBudget: number;
  createdAt?: number;
  completed?: boolean;
}

export default function BudgetPlannerPage() {
  const budgetLimits = useQuery(api.budgetLimits.list) || [];
  const plansQuery = useQuery(api.budgetPlans.list);
  const createPlan = useMutation(api.budgetPlans.create);
  const updatePlan = useMutation(api.budgetPlans.update);
  const deletePlan = useMutation(api.budgetPlans.deletePlan);
  const createTransaction = useMutation(api.transactions.create);
  
  // Use useMemo to prevent re-renders
  const plans = useMemo(() => plansQuery || [], [plansQuery]);
  
  const [activePlan, setActivePlan] = useState<BudgetPlan | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [totalBudget, setTotalBudget] = useState(0);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [showPlansDrawer, setShowPlansDrawer] = useState(false);
  
  // Item form state
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemCategory, setItemCategory] = useState("Groceries");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  
  // First, add a state to track newly added items
  const [newlyAddedItemId, setNewlyAddedItemId] = useState<string | null>(null);
  
  // Category options based on existing budget limits and common categories
  const categoryOptions = [
    ...new Set([
      "Groceries",
      "Household",
      "Entertainment",
      "Clothing",
      "Electronics",
      ...budgetLimits.map(limit => limit.category)
    ])
  ].sort();
  
  // Add toast state here
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success'
  });
  
  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // Set active plan if one exists and none is active
  useEffect(() => {
    if (plans.length > 0 && !activePlan) {
      // Find first incomplete plan
      const incompletePlan = plans.find(plan => !plan.completed);
      if (incompletePlan) {
        setActivePlan(incompletePlan);
      } else {
        // Or just use the most recent plan
        setActivePlan(plans[0]);
      }
    }
  }, [plans, activePlan]);
  
  const handleCreateNewPlan = async () => {
    if (!planTitle || totalBudget <= 0) return;
    
    // Show loading state
    const originalTitle = planTitle;
    setPlanTitle("Creating plan...");
    
    try {
      // Create the plan
      const newPlanId = await createPlan({
        title: originalTitle,
        totalBudget,
        items: []
      });
      
      // Reset form
      setPlanTitle("");
      setTotalBudget(0);
      setShowNewPlanForm(false);
      
      // Attempt to find the newly created plan
      // We'll look again in a moment if it doesn't exist yet
      const createdPlan = plans.find(p => p._id === newPlanId);
      if (createdPlan) {
        setActivePlan(createdPlan);
      } else {
        // The plan creation was successful but the plan might not be
        // in our local cache yet, so we give it a moment to update
        console.log("Plan created, waiting for it to appear in plans...");
        
        // Set a fake temporary plan to show something is happening
        setActivePlan({
          _id: newPlanId, // Use the ID returned by createPlan
          title: originalTitle,
          totalBudget,
          items: [],
          createdAt: Date.now(),
          completed: false
        });
      }
    } catch (error) {
      console.error("Failed to create plan:", error);
      // Restore original form values
      setPlanTitle(originalTitle);
      // Show error to user
      alert("Failed to create plan. Please try again.");
    }
  };
  
  const handleAddItem = () => {
    if (!activePlan || !itemName || parseFloat(itemPrice) <= 0) return;
    
    const newItem: PlanItem = {
      id: Date.now().toString(),
      name: itemName,
      price: parseFloat(itemPrice),
      quantity: parseInt(itemQuantity) || 1,
      category: itemCategory,
      completed: false,
    };
    
    const updatedItems = editingItemId 
      ? activePlan.items.map(item => item.id === editingItemId ? newItem : item)
      : [...activePlan.items, newItem];
    
    // Optimistically update the UI first
    setActivePlan({
      ...activePlan,
      items: updatedItems
    });
    
    // Then update on the server
    updatePlan({
      id: activePlan._id!,
      items: updatedItems
    }).catch(error => {
      // If there's an error, revert the optimistic update
      console.error("Failed to add/update item:", error);
      setActivePlan(activePlan);
    });
    
    // Set the newly added item ID to highlight it
    setNewlyAddedItemId(newItem.id);
    
    // Clear the highlight after 2 seconds
    setTimeout(() => {
      setNewlyAddedItemId(null);
    }, 2000);
    
    // Reset form
    setItemName("");
    setItemPrice("");
    setItemQuantity("1");
    setEditingItemId(null);
    setShowItemForm(false);
  };
  
  const handleEditItem = (item: PlanItem) => {
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemQuantity(item.quantity.toString());
    setItemCategory(item.category);
    setEditingItemId(item.id);
    setShowItemForm(true);
  };
  
  const handleDeleteItem = (itemId: string) => {
    if (!activePlan) return;
    
    const updatedItems = activePlan.items.filter(item => item.id !== itemId);
    
    // Optimistically update the UI first
    setActivePlan({
      ...activePlan,
      items: updatedItems
    });
    
    // Then update on the server
    updatePlan({
      id: activePlan._id!,
      items: updatedItems
    }).catch(error => {
      // If there's an error, revert the optimistic update
      console.error("Failed to delete item:", error);
      setActivePlan(activePlan);
    });
  };
  
  const handleToggleComplete = (itemId: string) => {
    if (!activePlan) return;
    
    // Find the item to update
    const itemToUpdate = activePlan.items.find(item => item.id === itemId);
    if (!itemToUpdate) return;
    
    // Check if we're marking the item as completed (true) or uncompleted (false)
    const newCompletedState = !itemToUpdate.completed;
    
    // Create updated items array with the toggled item
    const updatedItems = activePlan.items.map(item => {
      if (item.id === itemId) {
        return { ...item, completed: newCompletedState };
      }
      return item;
    });
    
    // Optimistically update local state first for immediate feedback
    setActivePlan({
      ...activePlan,
      items: updatedItems
    });
    
    // If the item is being marked as completed, record it as a transaction
    if (newCompletedState) {
      try {
        // Calculate the total cost of this item (price * quantity)
        const transactionAmount = -(itemToUpdate.price * itemToUpdate.quantity);
        
        // Format today's date as YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // Create a transaction for this purchased item
        createTransaction({
          description: `${itemToUpdate.name} (from shopping list)`,
          amount: transactionAmount,
          category: itemToUpdate.category,
          date: today,
          notes: `Purchased from ${activePlan.title} shopping list`
        }).then(() => {
          // Show success feedback with toast
          showToast(`Transaction recorded: ${itemToUpdate.name}`);
        }).catch(error => {
          console.error("Failed to record transaction:", error);
          showToast(`Failed to record transaction: ${error.message}`, 'error');
        });
      } catch (error) {
        console.error("Error creating transaction:", error);
      }
    }
    
    // Update on the server
    updatePlan({
      id: activePlan._id!,
      items: updatedItems
    }).catch(error => {
      // If there's an error, revert the optimistic update
      console.error("Failed to update item:", error);
      setActivePlan(activePlan);
    });
  };
  
  const handleCompletePlan = () => {
    if (!activePlan) return;
    
    updatePlan({
      id: activePlan._id!,
      completed: true
    });
    
    // Reset active plan
    setActivePlan(null);
  };
  
  const handleDeletePlan = () => {
    if (!activePlan || !activePlan._id) {
      console.error("Cannot delete plan: No active plan or missing ID");
      return;
    }
    
    // Store plan details for error handling
    const planId = activePlan._id;
    const planTitle = activePlan.title;
    
    // Clear the active plan immediately for better UX
    setActivePlan(null);
    
    // Then delete on the server
    deletePlan({ id: planId })
      .catch(error => {
        console.error("Failed to delete plan:", error);
        alert(`Error: Could not delete "${planTitle}". Please try again.`);
        
        // We don&apos;t restore the plan here as it might be partially deleted
        // Let the user navigate or refresh to handle this rare error case
      });
  };
  
  // Calculate statistics for the active plan
  const calculatePlanStats = () => {
    if (!activePlan) {
      return { 
        totalPlanned: 0, 
        totalSpent: 0, 
        remaining: 0, 
        completedCount: 0, 
        totalCount: 0,
        progress: 0,
      };
    }
    
    const totalPlanned = activePlan.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const completedItems = activePlan.items.filter(item => item.completed);
    const totalSpent = completedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remaining = activePlan.totalBudget - totalSpent;
    const completedCount = completedItems.length;
    const totalCount = activePlan.items.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return { 
      totalPlanned, 
      totalSpent, 
      remaining, 
      completedCount, 
      totalCount,
      progress,
    };
  };
  
  const { totalPlanned, totalSpent, remaining, completedCount, totalCount, progress } = calculatePlanStats();
  
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };
  
  // Group items by category for better organization
  const groupedItems = () => {
    if (!activePlan) return {};
    
    return activePlan.items.reduce((groups: Record<string, PlanItem[]>, item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
      return groups;
    }, {});
  };
  
  const itemGroups = groupedItems();
  
  const renderPlanSelector = () => {
    if (plans.length === 0) return null;
    
    return (
      <div className="relative">
        <button 
          onClick={() => setShowPlansDrawer(!showPlansDrawer)}
          className="flex items-center gap-2 p-2 border border-gray-light rounded-md hover:border-primary transition-all w-full md:w-auto"
        >
          <span className="text-sm font-medium">
            {activePlan ? `Plan: ${activePlan.title}` : 'Select Plan'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>
        
        {showPlansDrawer && (
          <div className="absolute top-full left-0 z-10 mt-1 w-64 bg-background rounded-md shadow-lg border border-gray-light max-h-96 overflow-y-auto">
            {plans.map(plan => (
              <div 
                key={plan._id} 
                className={`p-3 border-b border-gray-light cursor-pointer hover:bg-primary/5 transition-colors flex items-center justify-between ${
                  activePlan && activePlan._id === plan._id ? 'bg-primary/10' : ''
                }`}
                onClick={() => {
                  setActivePlan(plan);
                  setShowPlansDrawer(false);
                }}
              >
                <div>
                  <div className="font-medium">{plan.title}</div>
                  <div className="text-xs text-gray-dark flex items-center gap-1">
                    <span>UGX {plan.totalBudget.toLocaleString()}</span>
                    {plan.completed && (
                      <span className="ml-1 text-success text-xs font-medium bg-success/10 px-1.5 py-0.5 rounded-full">Completed</span>
                    )}
                  </div>
                </div>
                {activePlan && activePlan._id === plan._id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h1 className="text-2xl font-bold font-playfair">Budget Planner</h1>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {renderPlanSelector()}
          
          {!showNewPlanForm && (
            <button 
              onClick={() => setShowNewPlanForm(true)}
              className="btn-primary px-4 py-2 rounded-md flex items-center text-white whitespace-nowrap"
              aria-label="Create new budget plan"
            >
              <Plus className="w-4 h-4 mr-2" /> New Plan
            </button>
          )}
        </div>
      </div>
      
      {/* New Plan Form */}
      {showNewPlanForm && (
        <div className="card p-6 bg-gradient-to-br from-primary/5 to-transparent border border-gray-light rounded-lg shadow-sm transition-all">
          <h2 className="text-xl font-semibold mb-4 font-playfair flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary opacity-70" />
            Create New Budget Plan
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Plan Title</label>
              <input
                type="text"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="Weekly Grocery Shopping"
                className="w-full p-3 border border-gray rounded-md pr-10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
              <ShoppingBag className="absolute right-3 top-9 text-gray-dark w-5 h-5 opacity-50" />
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium mb-1">Total Budget (UGX)</label>
              <input
                type="number"
                value={totalBudget || ""}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                placeholder="50000"
                className="w-full p-3 border border-gray rounded-md pr-10 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              />
              <span className="absolute right-3 top-9 text-gray-dark text-sm font-medium">UGX</span>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNewPlanForm(false)}
                className="px-4 py-2 border border-gray rounded-md hover:bg-gray-light/50 transition-colors"
                aria-label="Cancel creating new plan"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewPlan}
                className={`btn-primary px-4 py-2 rounded-md text-white flex items-center transition-all ${
                  !planTitle || totalBudget <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                }`}
                disabled={!planTitle || totalBudget <= 0}
                aria-label="Create new budget plan"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {!showNewPlanForm && plans.length === 0 && (
        <div className="card p-8 text-center border border-gray-light rounded-lg bg-white shadow-sm">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-primary opacity-60" />
          </div>
          <h2 className="text-xl font-semibold mb-2 font-playfair">No Budget Plans Yet</h2>
          <p className="text-gray-dark mb-6 max-w-md mx-auto">
            Create a budget plan to help you manage your shopping and stay within your budget.
            Track what you need to buy and check off items as you shop.
          </p>
          <button 
            onClick={() => setShowNewPlanForm(true)}
            className="btn-primary px-5 py-2.5 rounded-md inline-flex items-center text-white shadow-sm hover:shadow-md transition-all"
            aria-label="Create your first budget plan"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Your First Budget Plan
          </button>
        </div>
      )}
      
      {/* Active Plan */}
      {activePlan && (
        <div className="space-y-6">
          {/* Plan Summary */}
          <div className="card p-6 border border-gray-light rounded-lg bg-white shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full mt-1 hidden md:block">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold font-playfair">{activePlan.title}</h2>
                  <p className="text-gray-dark text-sm">Created on {new Date(activePlan.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={handleCompletePlan}
                  className={`btn-success px-3 py-1.5 rounded-md text-white text-sm flex items-center transition-all flex-1 md:flex-initial justify-center ${
                    activePlan.items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                  disabled={activePlan.items.length === 0}
                  aria-label="Mark plan as complete"
                >
                  <Check className="w-4 h-4 mr-1" /> Complete Plan
                </button>
                <button
                  onClick={handleDeletePlan}
                  className="bg-error px-3 py-1.5 rounded-md text-white text-sm flex items-center hover:bg-error/90 transition-colors flex-1 md:flex-initial justify-center"
                  aria-label="Delete plan"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </button>
              </div>
            </div>
            
            {/* Budget Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-success/5 to-transparent rounded-lg border border-gray-light">
                <h3 className="text-sm text-gray-dark mb-1 font-montserrat flex items-center">
                  <DollarSign className="w-4 h-4 mr-1 opacity-70" /> Total Budget
                </h3>
                <p className="text-xl font-bold text-success font-montserrat">UGX {activePlan.totalBudget.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-error/5 to-transparent rounded-lg border border-gray-light">
                <h3 className="text-sm text-gray-dark mb-1 font-montserrat flex items-center">
                  <BarChart4 className="w-4 h-4 mr-1 opacity-70" /> Spent So Far
                </h3>
                <p className="text-xl font-bold text-error font-montserrat">UGX {totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-gray-light">
                <h3 className="text-sm text-gray-dark mb-1 font-montserrat flex items-center">
                  <Percent className="w-4 h-4 mr-1 opacity-70" /> Remaining
                </h3>
                <p className={`text-xl font-bold font-montserrat ${remaining < 0 ? 'text-error' : 'text-primary'}`}>
                  UGX {remaining.toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex flex-col md:flex-row justify-between text-sm gap-1">
                <span className="flex items-center">
                  <Check className="w-4 h-4 mr-1 text-success" /> 
                  {completedCount}/{totalCount} items purchased
                </span>
                <span className="font-medium">
                  {progress}% complete
                  {progress === 100 && remaining >= 0 && (
                    <span className="ml-2 text-success text-xs bg-success/10 px-2 py-0.5 rounded-full">
                      Within Budget
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-gray/30 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary to-success h-2.5"
                  style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}
                ></div>
              </div>
            </div>
            
            {/* Budget Warnings */}
            {totalPlanned > activePlan.totalBudget && (
              <div className="p-4 bg-error/10 rounded-lg flex items-start gap-3 mb-6 border border-error/20">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-error">Budget Warning</h3>
                  <p className="text-sm text-gray-dark">
                    Your planned expenses (UGX {totalPlanned.toLocaleString()}) exceed your total budget by UGX {(totalPlanned - activePlan.totalBudget).toLocaleString()}.
                    Consider removing some items or increasing your budget.
                  </p>
                </div>
              </div>
            )}
            
            {remaining < 0 && (
              <div className="p-4 bg-error/10 rounded-lg flex items-start gap-3 mb-6 border border-error/20">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-error">Over Budget</h3>
                  <p className="text-sm text-gray-dark">
                    You&apos;ve exceeded your budget by UGX {Math.abs(remaining).toLocaleString()}.
                    Consider increasing your budget or removing remaining items.
                  </p>
                </div>
              </div>
            )}
            
            {/* Add Item Button */}
            <div className="mb-6">
              {!showItemForm ? (
                <button
                  onClick={() => setShowItemForm(true)}
                  className="w-full p-3 border border-dashed border-gray-light rounded-lg text-center text-gray-dark hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
                  aria-label="Add new item to shopping list"
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Item to Shopping List
                </button>
              ) : (
                <div className="border-gray-light rounded-lg p-4 bg-gray-light/10 border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold font-playfair">{editingItemId ? "Edit Item" : "Add New Item"}</h3>
                    <button
                      onClick={() => {
                        setShowItemForm(false);
                        setItemName("");
                        setItemPrice("");
                        setItemQuantity("1");
                        setEditingItemId(null);
                      }}
                      className="text-gray-dark hover:text-error transition-colors"
                      aria-label="Close item form"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs mb-1">Item Name</label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="Milk"
                        className="w-full p-2.5 border border-gray rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        onKeyDown={onKeyDown}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Category</label>
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        className="w-full p-2.5 border border-gray rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                      >
                        {categoryOptions.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs mb-1">Price (UGX)</label>
                      <input
                        type="number"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        placeholder="5000"
                        className="w-full p-2.5 border border-gray rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        onKeyDown={onKeyDown}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1">Quantity</label>
                      <input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        min="1"
                        className="w-full p-2.5 border border-gray rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        onKeyDown={onKeyDown}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddItem}
                      disabled={!itemName || !itemPrice || parseFloat(itemPrice) <= 0}
                      className={`btn-primary px-4 py-2 rounded-md text-white text-sm flex items-center ${
                        !itemName || !itemPrice || parseFloat(itemPrice) <= 0 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:shadow-md'
                      }`}
                      aria-label={editingItemId ? "Update item" : "Add item to list"}
                    >
                      {editingItemId ? (
                        <>
                          <Check className="w-4 h-4 mr-2" /> Update Item
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" /> Add to List
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Shopping List */}
            <div className="shopping-list">
              <h3 className="text-lg font-semibold mb-4 font-playfair flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-primary opacity-70" /> Shopping List
                </div>
                {activePlan.items.length > 0 && (
                  <button 
                    onClick={() => window.print()}
                    className="text-primary text-sm flex items-center hover:bg-primary/5 py-1 px-2 rounded-md transition-colors"
                    aria-label="Print shopping list"
                  >
                    <Printer className="w-4 h-4 mr-1" /> Print List
                  </button>
                )}
              </h3>
              
              {activePlan.items.length === 0 ? (
                <div className="text-center py-8 bg-gray-light/20 rounded-lg border border-gray-light">
                  <ShoppingBag className="w-12 h-12 text-gray-dark mx-auto mb-2 opacity-30" />
                  <p className="text-gray-dark">Your shopping list is empty. Add some items to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(itemGroups).map(([category, items]) => (
                    <div key={category} className="border rounded-md overflow-hidden">
                      <div className="bg-gray-light/30 py-2 px-4 font-medium flex items-center">
                        <span>{category}</span>
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                        <span className="ml-auto text-sm text-gray-dark">
                          UGX {items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-light">
                        {items.map((item) => (
                          <div 
                            key={item.id} 
                            className={`py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 transition-all ${
                              item.completed ? 'bg-gray-light/20' : 
                              newlyAddedItemId === item.id ? 'bg-primary/5 animate-highlight' : 
                              'hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <div 
                                className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 border cursor-pointer transition-all flex items-center justify-center ${
                                  item.completed 
                                    ? 'bg-success border-success text-white scale-110' 
                                    : 'border-gray hover:border-success hover:bg-success/10'
                                }`}
                                onClick={() => handleToggleComplete(item.id)}
                              >
                                {item.completed && <Check className="w-3 h-3 animate-fadeIn" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className={`block truncate ${item.completed ? 'line-through text-gray-dark' : 'font-medium'}`}>
                                  {item.name}
                                </span>
                                <span className="text-xs text-gray-dark block sm:hidden">
                                  UGX {(item.price * item.quantity).toLocaleString()} ({item.quantity} × {item.price.toLocaleString()})
                                </span>
                              </div>
                            </div>
                            
                            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-dark">
                              <span>{item.quantity} ×</span>
                              <span>UGX {item.price.toLocaleString()}</span>
                              <span>=</span>
                              <span className="font-medium">UGX {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-end gap-2 sm:w-auto w-full">
                              <button
                                onClick={() => handleEditItem(item)}
                                disabled={item.completed}
                                className={`p-1.5 rounded-md transition-colors ${
                                  item.completed 
                                    ? 'text-gray-dark cursor-not-allowed' 
                                    : 'text-primary hover:bg-primary/10'
                                }`}
                                aria-label="Edit item"
                              >
                                <PencilLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 rounded-md text-error hover:bg-error/10 transition-colors"
                                aria-label="Delete item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-light pt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-dark">
                      {totalCount} {totalCount === 1 ? 'item' : 'items'} total
                    </div>
                    <div className="font-medium text-lg">
                      Total: <span className="text-primary">UGX {totalPlanned.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Plan Selection */}
      {!showNewPlanForm && plans.length > 0 && !activePlan && (
        <div className="card p-6 border border-gray-light rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 font-playfair">Your Budget Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plans.map(plan => (
              <div 
                key={plan._id} 
                className="p-4 border rounded-md cursor-pointer hover:border-primary transition-colors hover:shadow-sm"
                onClick={() => setActivePlan(plan)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{plan.title}</h3>
                    <p className="text-sm text-gray-dark">
                      {new Date(plan.createdAt || 0).toLocaleDateString()} 
                      {plan.completed && <span className="ml-2 text-success text-xs bg-success/10 px-1.5 py-0.5 rounded-full">Completed</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">UGX {plan.totalBudget.toLocaleString()}</p>
                    <p className="text-sm text-gray-dark">
                      {plan.items.length} {plan.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    className="text-primary text-sm flex items-center hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePlan(plan);
                    }}
                  >
                    <ArrowRight className="w-4 h-4 ml-1" /> View Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md animate-slideIn ${
          toast.type === 'success' 
            ? 'bg-success/10 border border-success text-success' 
            : 'bg-error/10 border border-error text-error'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <p>{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
} 