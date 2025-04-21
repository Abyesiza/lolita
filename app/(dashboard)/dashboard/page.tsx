"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useTheme } from "next-themes";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler
);

type BudgetLimit = {
  _id: string;
  category: string;
  monthlyLimit: number;
  dailyLimit?: number;
  warningThreshold?: number;
};

// Interface for transaction type to avoid using any
interface Transaction {
  amount: number;
  category: string;
}

// Add these helper functions before the Dashboard component
const getExpensesByCategory = (transactions: Transaction[]) => {
  const categorySums = new Map<string, number>();
  transactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      const currentSum = categorySums.get(t.category) || 0;
      categorySums.set(t.category, currentSum + Math.abs(t.amount));
    });
  
  const totalExpenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 1; // Avoid division by zero
  
  return Array.from(categorySums.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / totalExpenses) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);
};

// Define a tooltip context interface to avoid using 'any'
interface ChartTooltipContext {
  dataset: {
    label?: string;
  };
  raw: unknown;
}

const getDailyBudgetTotal = (budgetLimits: BudgetLimit[]) => {
  if (!budgetLimits || budgetLimits.length === 0) return 0;
  return budgetLimits.reduce((total, limit) => {
    // Check for dailyLimit first
    if (limit.dailyLimit) {
      return total + limit.dailyLimit;
    }
    // If no dailyLimit but has monthlyLimit, calculate daily equivalent
    if (limit.monthlyLimit) {
      return total + (limit.monthlyLimit / 30);
    }
    return total;
  }, 0);
};

const getMonthlyBudgetTotal = (budgetLimits: BudgetLimit[]) => {
  if (!budgetLimits || budgetLimits.length === 0) return 0;
  return budgetLimits.reduce((total, limit) => {
    // Check for monthlyLimit first
    if (limit.monthlyLimit) {
      return total + limit.monthlyLimit;
    }
    // If no monthlyLimit but has dailyLimit, calculate monthly equivalent
    if (limit.dailyLimit) {
      return total + (limit.dailyLimit * 30);
    }
    return total;
  }, 0);
};

const getAverageWarningThreshold = (budgetLimits: BudgetLimit[]) => {
  if (!budgetLimits || budgetLimits.length === 0) return 80; // Default warning threshold
  const sum = budgetLimits.reduce((total, limit) => total + (limit.warningThreshold || 80), 0);
  return sum / budgetLimits.length;
};

const generateWarningMessages = (
  todayExpenses: number,
  monthExpenses: number,
  dailyBudgetLimit: number,
  monthlyBudgetLimit: number,
  dailyWarning: number,
  monthlyWarning: number
) => {
  const messages: string[] = [];
  
  // Daily budget warnings
  if (dailyBudgetLimit > 0) {
    if (todayExpenses >= dailyBudgetLimit) {
      messages.push("You've exceeded your daily budget limit!");
    } else if (todayExpenses >= dailyWarning) {
      messages.push("You&apos;re approaching your daily budget limit!");
    }
  }
  
  // Monthly budget warnings
  if (monthlyBudgetLimit > 0) {
    if (monthExpenses >= monthlyBudgetLimit) {
      messages.push("You've exceeded your monthly budget limit!");
    } else if (monthExpenses >= monthlyWarning) {
      messages.push("You&apos;re approaching your monthly budget limit!");
    }
  }
  
  return messages;
};

// Update the FinancialData interface
type FinancialData = {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  todayIncome: number;
  todayExpenses: number;
  monthIncome: number;
  monthExpenses: number;
  expensesByCategory: { category: string; amount: number; percentage: number; }[];
  dailyStats: { date: string; income: number; expenses: number; }[];
  budgetProgress: { daily: number; monthly: number; };
  warningMessages: string[];
};

export default function Dashboard() {
  const { user } = useUser();
  const transactionsQuery = useQuery(api.transactions.list);
  const budgetLimitsQuery = useQuery(api.budgetLimits.list);
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  // Use useMemo to prevent unnecessary re-renders
  const transactions = useMemo(() => transactionsQuery || [], [transactionsQuery]);
  const budgetLimits = useMemo(() => budgetLimitsQuery || [], [budgetLimitsQuery]);

  // Calculate financial data based on transactions
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    todayIncome: 0,
    todayExpenses: 0,
    monthIncome: 0,
    monthExpenses: 0,
    expensesByCategory: [],
    dailyStats: [],
    budgetProgress: { daily: 0, monthly: 0 },
    warningMessages: []
  });

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get today's transactions
      const todayTransactions = transactions.filter(t => {
        if (!t.date) return false;
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === today.toDateString();
      });
      
      // Get current month's transactions
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthTransactions = transactions.filter(t => {
        if (!t.date) return false;
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });
      
      // Get daily transactions for the past 7 days
      const past7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      const dailyStats = past7Days.map(dateStr => {
        const dayTransactions = transactions.filter(t => {
          if (!t.date) return false;
          return t.date.split('T')[0] === dateStr;
        });
        
        const income = dayTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
          
        const expenses = dayTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
          
        return {
          date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          income,
          expenses
        };
      });
      
      // Calculate total income and expenses
      const totalIncome = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalExpenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
      // Calculate total balance
      const totalBalance = totalIncome - totalExpenses;
      
      // Calculate today's income and expenses
      const todayIncome = todayTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const todayExpenses = todayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Calculate month's income and expenses
      const monthIncome = monthTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthExpenses = monthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
      // Calculate expenses by category
      const expensesByCategory = getExpensesByCategory(monthTransactions);
      
      // Calculate budget progress
      const dailyBudgetLimit = getDailyBudgetTotal(budgetLimits);
      const monthlyBudgetLimit = getMonthlyBudgetTotal(budgetLimits);
      
      // Calculate warning thresholds
      const avgWarningThreshold = getAverageWarningThreshold(budgetLimits);
      const dailyWarning = dailyBudgetLimit * (avgWarningThreshold / 100);
      const monthlyWarning = monthlyBudgetLimit * (avgWarningThreshold / 100);
      
      // Generate warning messages
      const warningMessages = generateWarningMessages(
        todayExpenses, 
        monthExpenses, 
        dailyBudgetLimit, 
        monthlyBudgetLimit,
        dailyWarning,
        monthlyWarning
      );
      
      // Update financial data
      setFinancialData({
        totalBalance,
        totalIncome,
        totalExpenses: Math.abs(totalExpenses),
        todayIncome,
        todayExpenses: Math.abs(todayExpenses),
        monthIncome,
        monthExpenses: Math.abs(monthExpenses),
        expensesByCategory,
        dailyStats,
        budgetProgress: {
          daily: dailyBudgetLimit > 0 ? Math.min(100, (Math.abs(todayExpenses) / dailyBudgetLimit) * 100) : 0,
          monthly: monthlyBudgetLimit > 0 ? Math.min(100, (Math.abs(monthExpenses) / monthlyBudgetLimit) * 100) : 0
        },
        warningMessages
      });
    }
  }, [transactions, budgetLimits]);

  // Add a new section for daily and monthly tracking
  const getTodayTransactions = (transactions: Doc<"transactions">[]) => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(t => t.date === today);
  };

  const getCurrentMonthTransactions = (transactions: Doc<"transactions">[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    
    return transactions.filter(t => t.date >= monthStart);
  };

  // Inside the dashboard component, add this code before the return statement
  const todayTransactions = getTodayTransactions(transactions);
  const monthTransactions = getCurrentMonthTransactions(transactions);

  // Calculate totals
  const todayIncome = todayTransactions
    .filter(t => t.amount > 0)
    .reduce((sum: number, t) => sum + t.amount, 0);

  const todayExpenses = todayTransactions
    .filter(t => t.amount < 0)
    .reduce((sum: number, t) => sum + Math.abs(t.amount), 0);

  const monthIncome = monthTransactions
    .filter(t => t.amount > 0)
    .reduce((sum: number, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.amount < 0)
    .reduce((sum: number, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName || "User"}
        </h1>
        <div className="text-sm text-gray-dark">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Today's Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 font-playfair">Today&apos;s Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-dark font-montserrat">Income</p>
                <p className="text-xl font-semibold text-success font-montserrat">
                  UGX {todayIncome.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-dark font-montserrat">Expenses</p>
                <p className="text-xl font-semibold text-error font-montserrat">
                  UGX {todayExpenses.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-dark font-montserrat">Balance</p>
                <p className={`text-xl font-semibold font-montserrat ${todayIncome - todayExpenses >= 0 ? 'text-success' : 'text-error'}`}>
                  UGX {(todayIncome - todayExpenses).toLocaleString()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard/transactions')}
              className="w-full py-2 text-sm bg-gray-light hover:bg-gray text-foreground rounded-md transition font-montserrat"
            >
              Add Transaction
            </button>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 font-playfair">This Month</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-dark font-montserrat">Income</p>
                <p className="text-xl font-semibold text-success font-montserrat">
                  UGX {monthIncome.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-dark font-montserrat">Expenses</p>
                <p className="text-xl font-semibold text-error font-montserrat">
                  UGX {monthExpenses.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-dark font-montserrat">Savings</p>
                <p className="text-xl font-semibold text-primary font-montserrat">
                  UGX {Math.max(0, monthIncome - monthExpenses).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${monthIncome >= monthExpenses ? 'bg-success' : 'bg-error'}`}
                style={{ width: `${monthIncome > 0 ? Math.min((monthIncome - monthExpenses) / monthIncome * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-dark text-center font-montserrat">
              {monthIncome > 0 
                ? (monthIncome > monthExpenses 
                    ? `Saving ${Math.round(((monthIncome - monthExpenses) / monthIncome) * 100)}% of income` 
                    : 'Spending exceeds income')
                : 'No income recorded this month'
              }
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => router.push('/dashboard/income')}
                className="flex-1 py-2 text-sm bg-success hover:bg-success/80 text-white rounded-md transition font-montserrat"
              >
                Record Income
              </button>
              <button 
                onClick={() => router.push('/dashboard/transactions')}
                className="flex-1 py-2 text-sm bg-error hover:bg-error/80 text-white rounded-md transition font-montserrat"
              >
                Record Expense
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Financial overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <h3 className="text-sm text-gray-dark mb-2 font-montserrat">Current Balance</h3>
          <p className="text-2xl font-bold font-montserrat">UGX {financialData.totalBalance.toLocaleString()}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm text-gray-dark mb-2 font-montserrat">Income</h3>
          <p className="text-2xl font-bold text-success font-montserrat">UGX {financialData.totalIncome.toLocaleString()}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm text-gray-dark mb-2 font-montserrat">Expenses</h3>
          <p className="text-2xl font-bold text-error font-montserrat">UGX {financialData.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm text-gray-dark mb-2 font-montserrat">Savings</h3>
          <p className="text-2xl font-bold text-primary font-montserrat">UGX {Math.max(0, financialData.totalIncome - financialData.totalExpenses).toLocaleString()}</p>
        </div>
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold font-playfair">Weekly Income vs Expenses</h3>
            {financialData.warningMessages.length > 0 && (
              <div className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 rounded-full text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Budget Alert
              </div>
            )}
          </div>
          
          <div className="h-[300px] w-full">
            {financialData.dailyStats.length > 0 ? (
              <div className="h-[300px] w-full">
                <Line
                  data={{
                    labels: financialData.dailyStats.map(stat => stat.date),
                    datasets: [
                      {
                        label: 'Income',
                        data: financialData.dailyStats.map(stat => stat.income),
                        borderColor: '#10b981', // Success green
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                      },
                      {
                        label: 'Expenses',
                        data: financialData.dailyStats.map(stat => stat.expenses),
                        borderColor: '#ef4444', // Error red
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                      },
                      {
                        label: 'Budget Limit',
                        data: Array(financialData.dailyStats.length).fill(getDailyBudgetTotal(budgetLimits)),
                        borderColor: '#3b82f6', // Blue
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0,
                      },
                      {
                        label: 'Warning Threshold',
                        data: Array(financialData.dailyStats.length).fill(
                          getDailyBudgetTotal(budgetLimits) * (getAverageWarningThreshold(budgetLimits) / 100)
                        ),
                        borderColor: '#f59e0b', // Amber
                        borderWidth: 2,
                        borderDash: [3, 3],
                        fill: false,
                        pointRadius: 0,
                      }
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return `UGX ${value.toLocaleString()}`;
                          }
                        },
                        grid: {
                          color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        }
                      },
                      x: {
                        grid: {
                          color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 15,
                          font: {
                            weight: 'bold'
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: ChartTooltipContext) {
                            const label = context.dataset.label || '';
                            const value = Number(context.raw);
                            
                            if (label === 'Budget Limit') {
                              return `${label}: UGX ${value.toLocaleString()} (Maximum)`;
                            } else if (label === 'Warning Threshold') {
                              return `${label}: UGX ${value.toLocaleString()} (${getAverageWarningThreshold(budgetLimits)}% of Budget)`;
                            } else {
                              return `${label}: UGX ${value.toLocaleString()}`;
                            }
                          }
                        }
                      }
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-dark">
                <p>No data available</p>
              </div>
            )}
          </div>
          
          {/* Budget warnings */}
          {financialData.warningMessages.length > 0 && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Budget Alerts
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                {financialData.warningMessages.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Expense Breakdown Donut Chart */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4 font-playfair">Expense Breakdown</h3>
          {financialData.expensesByCategory.length > 0 ? (
            <div className="h-[300px]">
              <Bar
                data={{
                  labels: financialData.expensesByCategory.slice(0, 5).map(category => category.category),
                  datasets: [
                    {
                      label: 'Expenses',
                      data: financialData.expensesByCategory.slice(0, 5).map(category => category.amount),
                      backgroundColor: [
                        'rgba(239, 68, 68, 0.7)',    // Red
                        'rgba(245, 158, 11, 0.7)',   // Amber
                        'rgba(16, 185, 129, 0.7)',   // Green
                        'rgba(59, 130, 246, 0.7)',   // Blue
                        'rgba(139, 92, 246, 0.7)'    // Purple
                      ],
                      borderColor: [
                        'rgba(239, 68, 68, 1)',    
                        'rgba(245, 158, 11, 1)',   
                        'rgba(16, 185, 129, 1)',   
                        'rgba(59, 130, 246, 1)',   
                        'rgba(139, 92, 246, 1)'
                      ],
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return `UGX ${value.toLocaleString()}`;
                        }
                      },
                      grid: {
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }
                    },
                    x: {
                      grid: {
                        color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context: ChartTooltipContext) {
                          const label = context.dataset.label || '';
                          const value = Number(context.raw);
                          const percentage = financialData.expensesByCategory.find(
                            c => c.amount === value
                          )?.percentage || 0;
                          return `${label}: UGX ${value.toLocaleString()} (${percentage}%)`;
                        }
                      }
                    }
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-[250px] text-gray-dark">
              <p>No expense data available</p>
            </div>
          )}
          
          <div className="mt-4">
            <div className="text-sm text-gray-dark mb-2 font-montserrat">Budget Utilization</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Daily Budget</span>
                  <span>
                    UGX {financialData.todayExpenses.toLocaleString()} / 
                    UGX {getDailyBudgetTotal(budgetLimits).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${financialData.budgetProgress.daily >= 100 ? 'bg-error' : financialData.budgetProgress.daily >= 80 ? 'bg-amber-500' : 'bg-success'}`}
                    style={{ width: `${financialData.budgetProgress.daily}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Monthly Budget</span>
                  <span>
                    UGX {financialData.monthExpenses.toLocaleString()} / 
                    UGX {getMonthlyBudgetTotal(budgetLimits).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${financialData.budgetProgress.monthly >= 100 ? 'bg-error' : financialData.budgetProgress.monthly >= 80 ? 'bg-amber-500' : 'bg-success'}`}
                    style={{ width: `${financialData.budgetProgress.monthly}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold font-playfair">Recent Transactions</h2>
          <a href="/dashboard/transactions" className="text-primary hover:underline text-sm font-montserrat">
            View All
          </a>
        </div>
        <div className="overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="w-full font-montserrat">
              <thead>
                <tr className="border-b border-gray">
                  <th className="text-left p-2 text-gray-dark">Description</th>
                  <th className="text-left p-2 text-gray-dark">Category</th>
                  <th className="text-left p-2 text-gray-dark">Date</th>
                  <th className="text-right p-2 text-gray-dark">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-gray hover:bg-gray-light">
                    <td className="p-3">{transaction.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-light">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="p-3 text-gray-dark">{transaction.date}</td>
                    <td className={`p-3 text-right ${transaction.amount >= 0 ? 'text-success' : 'text-error'}`}>
                      {transaction.amount >= 0 ? '+' : ''}UGX {Math.abs(transaction.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-gray-dark font-montserrat">
              <p>No transactions yet. Add your first transaction to get started!</p>
              <a 
                href="/dashboard/transactions" 
                className="mt-4 inline-block btn-primary px-4 py-2 rounded"
              >
                Add Transaction
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 