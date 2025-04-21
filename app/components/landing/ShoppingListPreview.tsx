"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingBag, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

// Type definitions for the data structure
interface PlanItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  completed: boolean;
}

interface BudgetPlan {
  _id: string;
  title: string;
  totalBudget: number;
  items: PlanItem[];
  completed: boolean;
}

export default function ShoppingListPreview() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  
  // Only fetch plans if the user is authenticated
  const plansQuery = useQuery(
    api.budgetPlans.list,
    // Only run the query if the user is signed in
    isSignedIn ? {} : "skip"
  );
  
  useEffect(() => {
    // Only set plans if the query succeeded and returned an array
    if (plansQuery && Array.isArray(plansQuery)) {
      setPlans(plansQuery as BudgetPlan[]);
    }
  }, [plansQuery]);
  
  // Show nothing if not signed in, still loading auth, no plans, or query error
  if (!isLoaded || !isSignedIn || !plans.length) {
    return null;
  }
  
  // Filter for only active (non-completed) plans
  const activePlans = plans.filter(plan => !plan.completed).slice(0, 3);
  
  if (activePlans.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold font-playfair flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2 text-primary opacity-80" /> 
          Your Active Shopping Lists
        </h2>
        <Link 
          href="/dashboard/planner" 
          className="text-primary text-sm hover:underline flex items-center"
        >
          View All <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activePlans.map(plan => {
          // Calculate progress
          const totalItems = plan.items.length;
          const completedItems = plan.items.filter(item => item.completed).length;
          const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          
          return (
            <div 
              key={plan._id} 
              className="border border-gray-light rounded-lg p-4 hover:border-primary transition-all cursor-pointer hover:shadow-sm"
              onClick={() => router.push('/dashboard/planner')}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium">{plan.title}</h3>
                <span className="text-sm font-medium">
                  UGX {plan.totalBudget.toLocaleString()}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-dark mb-1">
                  <span>{completedItems}/{totalItems} items</span>
                  <span>{progress}% complete</span>
                </div>
                <div className="w-full bg-gray-light/30 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-success h-1.5"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              {totalItems > 0 ? (
                <div className="space-y-1 max-h-16 overflow-hidden">
                  {plan.items.slice(0, 3).map((item: PlanItem) => (
                    <div key={item.id} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${
                        item.completed ? 'bg-success' : 'border border-gray'
                      }`}>
                        {item.completed && <Check className="w-2 h-2 text-white" />}
                      </div>
                      <span className={item.completed ? 'line-through opacity-70' : ''}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                  {totalItems > 3 && (
                    <div className="text-xs text-primary">
                      +{totalItems - 3} more items
                    </div>
                  )}
                </div>
              ) : (
                <span>No items added yet</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 