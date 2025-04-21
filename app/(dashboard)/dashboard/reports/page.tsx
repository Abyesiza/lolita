"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  BarController,
  LineController,
  ArcElement,
  ChartOptions,
  TooltipItem,
  LegendItem,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  PiggyBank,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Card } from "@/app/components/ui/card";
import { format, parseISO, isValid, getDaysInMonth, getYear } from "date-fns";
import Link from "next/link";

// Register Chartjs components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

// Define report period type
type ReportPeriod = "weekly" | "monthly" | "yearly";

// Define types for report data
type CategoryData = { category: string; amount: number; percentage: number };
type DayData = { date: string; expenses: number; income: number };
type WeekData = { weekNumber: number; expenses: number; income: number };
type MonthData = { month: number; expenses: number; income: number };

type PeriodData = {
  income: number;
  expenses: number;
  topCategories: CategoryData[];
};

type ReportData = {
  weekly: PeriodData & { weeklyBreakdown: DayData[] };
  monthly: PeriodData & { monthlyBreakdown: WeekData[] };
  yearly: PeriodData & { yearlyBreakdown: MonthData[] };
  categoryBreakdown?: Record<string, number>;
  netBalance?: number;
  avgDailyExpense?: number;
  savingsRate?: number;
  budgetTips?: string[];
  totalIncome?: number;
  totalExpenses?: number;
  budgetWarnings?: string[];
};

// Define type for budget limits
type BudgetLimit = {
  _id: string;
  category: string;
  monthlyLimit: number;
  dailyLimit?: number;
  warningThreshold?: number;
};

// Add SavingsGoal type
type SavingsGoal = {
  _id: Id<"savingsGoals">;
  _creationTime?: number;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO date string
  createdAt: number; // Using createdAt instead of created
  color?: string;
  icon?: string;
  notes?: string;
};

// Calculate the average warning threshold from all budget limits
function getAverageWarningThreshold(budgetLimits: BudgetLimit[]): number {
  if (!budgetLimits || budgetLimits.length === 0) {
    return 80; // Default warning threshold if no limits set
  }
  
  const sum = budgetLimits.reduce((total, limit) => {
    return total + (limit.warningThreshold || 80);
  }, 0);
  
  return sum / budgetLimits.length;
}

// Calculate trend line using simple linear regression
function calculateTrendLine(data: number[]): number[] {
  if (!data || data.length <= 1) {
    return Array(data?.length || 0).fill(data[0] || 0);
  }
  
  // Calculate the regression line: y = mx + b
  const n = data.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
  const meanY = data.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope (m) and y-intercept (b)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (indices[i] - meanX) * (data[i] - meanY);
    denominator += (indices[i] - meanX) ** 2;
  }
  
  const m = denominator !== 0 ? numerator / denominator : 0;
  const b = meanY - m * meanX;
  
  // Generate trend line data points
  return indices.map(x => m * x + b);
}

// Helper functions to calculate total budgets
function getDailyBudgetTotal(limits: BudgetLimit[]): number {
  return limits.reduce((sum, limit) => sum + (limit.dailyLimit || 0), 0);
}

function getMonthlyBudgetTotal(limits: BudgetLimit[]): number {
  return limits.reduce((sum, limit) => sum + limit.monthlyLimit, 0);
}

// Helper function to determine the week number in a month (1-5)
function getWeekNumberInMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const dayOfWeekOffset = firstDayOfMonth.getDay();
  return Math.ceil((dayOfMonth + dayOfWeekOffset) / 7);
}

// Calculate savings rate based on net balance for selected period
const calculateSavingsRate = (
  period: ReportPeriod,
  weeklyData: PeriodData,
  monthlyData: PeriodData,
  yearlyData: PeriodData,
  netBalance: number | undefined
) => {
  const data = period === "weekly" ? weeklyData :
               period === "monthly" ? monthlyData : yearlyData;

  if (data.income > 0) {
    const actualSavings = netBalance ?? 0;
    return (actualSavings / data.income) * 100;
  }
  return 0;
};

// Generate budget tips based on spending patterns and financial data
const generateBudgetTips = (
  period: ReportPeriod,
  weeklyData: PeriodData,
  monthlyData: PeriodData,
  yearlyData: PeriodData,
  budgetLimits: BudgetLimit[],
  savingsRate: number
) => {
  const tips: string[] = [];
  
  const data = period === "weekly" ? weeklyData :
               period === "monthly" ? monthlyData : yearlyData;
  
  if (savingsRate < 10) {
    tips.push("Try to save at least 10-20% of your income for financial security.");
  } else if (savingsRate >= 20) {
    tips.push("Great job saving! You're saving more than 20% of your income.");
  }
  
  // Category-specific tips
  if (data.topCategories.length > 0) {
    data.topCategories.forEach(category => {
      const budgetLimit = budgetLimits.find(limit => limit.category === category.category);
      
      if (category.category === "Food") {
        if (category.percentage > 30) {
          tips.push(`Food expenses (${category.percentage}%) are high. Consider meal planning and cooking at home more often.`);
        }
        if (budgetLimit) {
          const dailySpending = category.amount / (period === "weekly" ? 7 : period === "monthly" ? 30 : 365);
          if (dailySpending > budgetLimit.dailyLimit) {
            tips.push(`Your daily food spending (UGX ${dailySpending.toFixed(0)}) exceeds your daily limit (UGX ${budgetLimit.dailyLimit}). Try to reduce eating out.`);
          }
        }
      }
      
      if (category.category === "Transport") {
        if (category.percentage > 20) {
          tips.push(`Transport costs (${category.percentage}%) are high. Consider carpooling or using public transport more often.`);
        }
        if (budgetLimit) {
          const weeklySpending = category.amount / (period === "weekly" ? 1 : period === "monthly" ? 4 : 52);
          if (weeklySpending * 4 > budgetLimit.monthlyLimit * 0.8) {
            tips.push(`Your transport spending is approaching the monthly limit. Consider alternative transportation methods.`);
          }
        }
      }
      
      if (category.percentage > 40 && category.category !== "Food" && category.category !== "Transport") {
        tips.push(`Your biggest expense category is ${category.category} at ${category.percentage}% of spending. Consider ways to reduce this.`);
      }
    });
  }
  
  // Overall budget tips
  if (budgetLimits.length > 0) {
    const monthlyBudgetTotal = getMonthlyBudgetTotal(budgetLimits);
    if (period === "monthly" && monthlyData.expenses > monthlyBudgetTotal * 0.9) {
      tips.push("You're approaching your monthly budget limits. Consider adjusting your spending for the rest of the month.");
    }
    
    // Check daily budgets for food and transport
    const foodLimit = budgetLimits.find(limit => limit.category === "Food");
    const transportLimit = budgetLimits.find(limit => limit.category === "Transport");
    
    if (foodLimit?.dailyLimit) {
      const dailyFoodSpending = (data.topCategories.find(c => c.category === "Food")?.amount || 0) / 
        (period === "weekly" ? 7 : period === "monthly" ? 30 : 365);
      if (dailyFoodSpending > foodLimit.dailyLimit) {
        tips.push(`Your daily food spending (UGX ${dailyFoodSpending.toFixed(0)}) exceeds your daily limit (UGX ${foodLimit.dailyLimit}).`);
      }
    }
    
    if (transportLimit?.monthlyLimit) {
      const monthlyTransportSpending = (data.topCategories.find(c => c.category === "Transport")?.amount || 0) / 
        (period === "weekly" ? 4 : period === "monthly" ? 1 : 12);
      if (monthlyTransportSpending > transportLimit.monthlyLimit * 0.8) {
        tips.push(`Your transport spending is approaching the monthly limit. Consider alternative transportation methods.`);
      }
    }
  } else {
    tips.push("Set up budget limits to track your spending against financial goals.");
  }
  
  if (data.income > 0 && data.expenses > data.income) {
    tips.push("Your expenses currently exceed your income. Review spending or explore ways to increase income.");
  } else if (data.income > 0 && data.expenses > data.income * 0.9) {
    tips.push("Your expenses are close to your income (over 90%). Keep an eye on spending to maintain a positive balance.");
  }
  
  return tips;
};

// Generate warnings about budget issues
const generateBudgetWarnings = (
  period: ReportPeriod,
  weeklyData: PeriodData,
  monthlyData: PeriodData,
  yearlyData: PeriodData,
  netBalance: number | undefined
) => {
  const warnings: string[] = [];
  
  const data = period === "weekly" ? weeklyData : 
              period === "monthly" ? monthlyData : yearlyData;
  
  if ((netBalance ?? 0) < 0) {
    warnings.push(`Your ${period} expenses (UGX ${data.expenses.toLocaleString()}) exceed your income (UGX ${data.income.toLocaleString()}). Net difference: UGX ${(netBalance ?? 0).toLocaleString()}.`);
  }
  
  const savingsRate = calculateSavingsRate(period, weeklyData, monthlyData, yearlyData, netBalance);
  if (data.income > 0 && savingsRate < 5) {
      warnings.push(`Your savings rate (${savingsRate.toFixed(1)}%) is low. Aim for 10-20% or more if possible.`);
  }
  
  // Category-specific warnings
  if (data.topCategories.length > 0) {
    data.topCategories.forEach(category => {
      if (category.category === "Food" && category.percentage > 35) {
        warnings.push(`Food expenses (${category.percentage}%) are significantly high. Consider reviewing your meal planning and grocery shopping habits.`);
      }
      
      if (category.category === "Transport" && category.percentage > 25) {
        warnings.push(`Transport costs (${category.percentage}%) are significantly high. Consider alternative transportation methods or carpooling.`);
      }
      
      if (category.percentage > 30 && category.category !== "Food" && category.category !== "Transport" && category.category !== "Housing" && category.category !== "Rent") {
        warnings.push(`${category.category} makes up ${category.percentage}% of your expenses, which is unusually high.`);
      }
    });
  }
  
  return warnings;
};

export default function ReportsPage() {

  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("monthly");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get transactions from Convex
  const transactions = useQuery(api.transactions.list) || [];
  
  // Get budget limits from Convex
  const budgetLimits = useQuery(api.budgetLimits.list) || [];
  
  // Get savings goals from Convex
  const savingsGoals = useQuery(api.savingsGoals.list) || [];
  
  // Get budget plans from Convex
  const budgetPlans = useQuery(api.budgetPlans.list) || [];
  
  // Calculate financial data based on transactions
  const [reportData, setReportData] = useState<ReportData>({
    weekly: {
      income: 0,
      expenses: 0,
      topCategories: [],
      weeklyBreakdown: [],
    },
    monthly: {
      income: 0,
      expenses: 0,
      topCategories: [],
      monthlyBreakdown: [],
    },
    yearly: {
      income: 0,
      expenses: 0,
      topCategories: [],
      yearlyBreakdown: [],
    },
    budgetWarnings: [],
  });

  const memoizedTransactions = useMemo(() => transactions, [transactions]);
  const memoizedBudgetLimits = useMemo(() => budgetLimits, [budgetLimits]);
  const memoizedBudgetPlans = useMemo(() => budgetPlans, [budgetPlans]);

  useEffect(() => {
    if (transactions) {
      // Calculate financial data from transactions
      const processTransactionsData = () => {
        // Get current date info
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Weekly data - get transactions from the past 7 days
        const weekStart = new Date();
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        
        // Monthly data - get transactions from current month
        const monthStart = new Date(currentYear, currentMonth, 1);
        monthStart.setHours(0, 0, 0, 0);

        // Yearly data - get transactions from current year
        const yearStart = new Date(currentYear, 0, 1);
        yearStart.setHours(0, 0, 0, 0);
        
        // Initialize data structures
        const weeklyData: PeriodData & { weeklyBreakdown: DayData[] } = { 
          income: 0, 
          expenses: 0, 
          topCategories: [], 
          weeklyBreakdown: [] 
        };
        
        const monthlyData: PeriodData & { monthlyBreakdown: WeekData[] } = { 
          income: 0, 
          expenses: 0, 
          topCategories: [], 
          monthlyBreakdown: [] 
        };
        
        const yearlyData: PeriodData & { yearlyBreakdown: MonthData[] } = { 
          income: 0, 
          expenses: 0, 
          topCategories: [], 
          yearlyBreakdown: [] 
        };
        
        // Initialize category maps (only for expenses)
        const weeklyCategories = new Map<string, number>();
        const monthlyCategories = new Map<string, number>();
        const yearlyCategories = new Map<string, number>();
        
        // Initialize time period breakdowns with precise dates/numbers
        const weekDays = new Map<string, { expenses: number, income: number }>();
        
        // Create day entries for the last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(now.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0];
          weekDays.set(dateStr, { expenses: 0, income: 0 });
        }
        
        // Create week entries for the current month
        const monthWeeks = new Map<number, { expenses: number, income: number }>();
        for (let i = 1; i <= 5; i++) {
          monthWeeks.set(i, { expenses: 0, income: 0 });
        }
        
        // Create month entries for the current year
        const yearMonths = new Map<number, { expenses: number, income: number }>();
        for (let i = 0; i < 12; i++) {
          yearMonths.set(i, { expenses: 0, income: 0 });
        }
        
        // Process transactions if available
        if (transactions.length > 0) {
          transactions.forEach(transaction => {
            if (!transaction.date) return;
            
            // Parse date properly
            const tDate = new Date(transaction.date);
            if (!isValid(tDate)) return;
            
            tDate.setHours(0, 0, 0, 0);
            const tAmount = transaction.amount;
            const tCategory = transaction.category || "Uncategorized";
            const tMonthIndex = tDate.getMonth();
            const tWeekOfMonth = getWeekNumberInMonth(tDate);
            const tDateStr = tDate.toISOString().split('T')[0];
            
            // Determine which time periods this transaction belongs to
            const isThisWeek = tDate >= weekStart;
            const isThisMonth = tDate >= monthStart;
            const isThisYear = tDate >= yearStart;
            
            // Process for weekly report
            if (isThisWeek) {
              const dayData = weekDays.get(tDateStr);
              if (dayData) {
                if (tAmount > 0) {
                  weeklyData.income += tAmount;
                  dayData.income += tAmount;
                } else {
                  const expenseAmount = Math.abs(tAmount);
                  weeklyData.expenses += expenseAmount;
                  dayData.expenses += expenseAmount;
                  
                  // Add to expense categories
                  const currentCategoryAmount = weeklyCategories.get(tCategory) || 0;
                  weeklyCategories.set(tCategory, currentCategoryAmount + expenseAmount);
                }
              }
            }
            
            // Process for monthly report
            if (isThisMonth) {
              const weekData = monthWeeks.get(tWeekOfMonth);
              if (weekData) {
                if (tAmount > 0) {
                  monthlyData.income += tAmount;
                  weekData.income += tAmount;
                } else {
                  const expenseAmount = Math.abs(tAmount);
                  monthlyData.expenses += expenseAmount;
                  weekData.expenses += expenseAmount;
                  
                  // Add to expense categories
                  const currentCategoryAmount = monthlyCategories.get(tCategory) || 0;
                  monthlyCategories.set(tCategory, currentCategoryAmount + expenseAmount);
                }
              }
            }
            
            // Process for yearly report
            if (isThisYear) {
              const monthData = yearMonths.get(tMonthIndex);
              if (monthData) {
                if (tAmount > 0) {
                  yearlyData.income += tAmount;
                  monthData.income += tAmount;
                } else {
                  const expenseAmount = Math.abs(tAmount);
                  yearlyData.expenses += expenseAmount;
                  monthData.expenses += expenseAmount;
                  
                  // Add to expense categories
                  const currentCategoryAmount = yearlyCategories.get(tCategory) || 0;
                  yearlyCategories.set(tCategory, currentCategoryAmount + expenseAmount);
                }
              }
            }
          });
        } else {
          // Generate sample data if no transactions exist
          generateSampleData(weeklyData, monthlyData, yearlyData, weekDays, monthWeeks, yearMonths);
        }

        // --- Populate breakdowns after processing all transactions ---
        weeklyData.weeklyBreakdown = Array.from(weekDays.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

        monthlyData.monthlyBreakdown = Array.from(monthWeeks.entries())
            .filter(([_, data]) => data.income > 0 || data.expenses > 0)
            .map(([weekNumber, data]) => ({ weekNumber, ...data }))
            .sort((a, b) => a.weekNumber - b.weekNumber);

        yearlyData.yearlyBreakdown = Array.from(yearMonths.entries())
             .map(([month, data]) => ({ month, ...data }))
             .sort((a, b) => a.month - b.month);

        // Calculate financial metrics
        const netBalance = calculateNetBalance(reportPeriod, weeklyData, monthlyData, yearlyData);
        const avgDailyExpense = calculateAvgDailyExpense(reportPeriod, weeklyData, monthlyData, yearlyData);
        const savingsRate = calculateSavingsRate(reportPeriod, weeklyData, monthlyData, yearlyData, netBalance);

        // Generate budget tips based on spending patterns
        const budgetTips = generateBudgetTips(
          reportPeriod,
          weeklyData,
          monthlyData,
          yearlyData,
          budgetLimits,
          savingsRate
        );

        // Generate budget warnings
        const budgetWarnings = generateBudgetWarnings(
          reportPeriod,
          weeklyData,
          monthlyData,
          yearlyData,
          netBalance
        );
        
        // Process categories for all reporting periods
        // For the chart display, create global categoryBreakdown object
        const categoryBreakdown: Record<string, number> = {};
        let activeCategories: Map<string, number>;

        switch (reportPeriod) {
          case "weekly":
            activeCategories = weeklyCategories;
            break;
          case "monthly":
            activeCategories = monthlyCategories;
            break;
          case "yearly":
            activeCategories = yearlyCategories;
            break;
          default:
            activeCategories = new Map();
        }
        
        activeCategories.forEach((amount, category) => {
          categoryBreakdown[category] = amount;
        });

        // Set the report data
        setReportData({
          weekly: weeklyData,
          monthly: monthlyData,
          yearly: yearlyData,
          netBalance,
          avgDailyExpense,
          savingsRate,
          totalIncome: getIncomeForPeriod(reportPeriod, weeklyData, monthlyData, yearlyData),
          totalExpenses: getExpensesForPeriod(reportPeriod, weeklyData, monthlyData, yearlyData),
          budgetTips,
          budgetWarnings,
          categoryBreakdown
        });
      };
      
      processTransactionsData();
    }
  }, [transactions, reportPeriod, memoizedBudgetLimits, refreshTrigger, generateBudgetWarnings]);

  // Helper function to generate sample data
  const generateSampleData = (
    weeklyData: PeriodData & { weeklyBreakdown: DayData[] },
    monthlyData: PeriodData & { monthlyBreakdown: WeekData[] },
    yearlyData: PeriodData & { yearlyBreakdown: MonthData[] },
    weekDays: Map<string, { expenses: number, income: number }>,
    monthWeeks: Map<number, { expenses: number, income: number }>,
    yearMonths: Map<number, { expenses: number, income: number }>
  ) => {
    // Sample overall weekly data
    weeklyData.income = 450000;
    weeklyData.expenses = 220000;

    // Sample weekly breakdown
    let i = 0;
    for (const [dateStr, dayData] of weekDays.entries()) {
      const incomeValue = i % 2 === 0 ? 150000 / 3 : 0;
      const expenseValue = 30000 + (i * 5000);
      dayData.income = incomeValue;
      dayData.expenses = expenseValue;
      i++;
    }

    // Sample overall monthly data
    monthlyData.income = 1800000;
    monthlyData.expenses = 1100000;

    // Sample monthly breakdown
    i = 1;
    for (const [weekNum, weekData] of monthWeeks.entries()) {
      weekData.income = i === 1 || i === 3 ? 900000 / 2 : 0;
      weekData.expenses = 210000 + (i * 20000);
      i++;
    }

    // Sample overall yearly data
    yearlyData.income = 21600000;
    yearlyData.expenses = 14400000;

    // Sample yearly breakdown
    i = 0;
    for (const [monthIndex, monthData] of yearMonths.entries()) {
       monthData.income = (1800000 - (i * 50000));
       monthData.expenses = (1200000 + (i * 30000));
       i++;
    }

    // Create sample categories
    const categories = ["Food", "Transport", "Utilities", "Entertainment", "Shopping"];
    const categoryAmounts = [35, 25, 15, 15, 10]; // Percentage distribution
    
    weeklyData.topCategories = categories.map((category, index) => ({
      category,
      amount: (weeklyData.expenses * categoryAmounts[index]) / 100,
      percentage: categoryAmounts[index]
    }));
    
    monthlyData.topCategories = categories.map((category, index) => ({
      category,
      amount: (monthlyData.expenses * categoryAmounts[index]) / 100,
      percentage: categoryAmounts[index]
    }));
    
    yearlyData.topCategories = categories.map((category, index) => ({
      category,
      amount: (yearlyData.expenses * categoryAmounts[index]) / 100,
      percentage: categoryAmounts[index]
    }));
  };

  // Calculate net balance for selected period
  const calculateNetBalance = (
    period: ReportPeriod,
    weeklyData: PeriodData,
    monthlyData: PeriodData,
    yearlyData: PeriodData
  ) => {
    switch (period) {
      case "weekly":
        return weeklyData.income - weeklyData.expenses;
      case "monthly":
        return monthlyData.income - monthlyData.expenses;
      case "yearly":
        return yearlyData.income - yearlyData.expenses;
      default:
        return 0;
    }
  };

  // Calculate average daily expense for selected period
  const calculateAvgDailyExpense = (
    period: ReportPeriod,
    weeklyData: PeriodData,
    monthlyData: PeriodData,
    yearlyData: PeriodData
  ) => {
    switch (period) {
      case "weekly":
        return weeklyData.expenses / 7;
      case "monthly": {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return monthlyData.expenses / daysInMonth;
      }
      case "yearly":
        return yearlyData.expenses / 365;
      default:
        return 0;
    }
  };

  // Get income for the selected period
  const getIncomeForPeriod = (
    period: ReportPeriod,
    weeklyData: PeriodData,
    monthlyData: PeriodData,
    yearlyData: PeriodData
  ) => {
    switch (period) {
      case "weekly":
        return weeklyData.income;
      case "monthly":
        return monthlyData.income;
      case "yearly":
        return yearlyData.income;
      default:
        return 0;
    }
  };

  // Get expenses for the selected period
  const getExpensesForPeriod = (
    period: ReportPeriod,
    weeklyData: PeriodData,
    monthlyData: PeriodData,
    yearlyData: PeriodData
  ) => {
    switch (period) {
      case "weekly":
        return weeklyData.expenses;
      case "monthly":
        return monthlyData.expenses;
      case "yearly":
        return yearlyData.expenses;
      default:
        return 0;
    }
  };

  // Function to prepare enhanced chart data
  function prepareEnhancedChartData(reportData: ReportData, budgetLimits: BudgetLimit[], reportPeriod: ReportPeriod) {
    let labels: string[] = [];
    let incomeData: number[] = [];
    let expenseData: number[] = [];
    let budgetData: number[] = [];
    let warningData: number[] = [];
    let trendData: number[] = [];

    if (reportData) {
      if (reportPeriod === 'weekly' && reportData.weekly?.weeklyBreakdown?.length) {
        labels = reportData.weekly.weeklyBreakdown.map((item: DayData) => {
          try {
            const date = parseISO(item.date);
            if (!isValid(date)) return item.date;
            return format(date, 'EEE');
          } catch (error) {
            console.error("Error formatting date:", error, item.date);
            return item.date || '';
          }
        });
        incomeData = reportData.weekly.weeklyBreakdown.map((item: DayData) => item.income);
        expenseData = reportData.weekly.weeklyBreakdown.map((item: DayData) => item.expenses);
        
        const dailyBudget = getDailyBudgetTotal(budgetLimits);
        budgetData = Array(labels.length).fill(dailyBudget);
        
        const avgWarningThreshold = getAverageWarningThreshold(budgetLimits);
        warningData = budgetData.map(budget => budget * (avgWarningThreshold / 100));
        
      } else if (reportPeriod === 'monthly' && reportData.monthly?.monthlyBreakdown?.length) {
        labels = reportData.monthly.monthlyBreakdown.map((item: WeekData) => `Week ${item.weekNumber}`);
        incomeData = reportData.monthly.monthlyBreakdown.map((item: WeekData) => item.income);
        expenseData = reportData.monthly.monthlyBreakdown.map((item: WeekData) => item.expenses);
        
        const monthlyBudget = getMonthlyBudgetTotal(budgetLimits);
        const weeklyBudget = monthlyBudget / 4;
        budgetData = Array(labels.length).fill(weeklyBudget);
        
        const avgWarningThreshold = getAverageWarningThreshold(budgetLimits);
        warningData = budgetData.map(budget => budget * (avgWarningThreshold / 100));
        
      } else if (reportPeriod === 'yearly' && reportData.yearly?.yearlyBreakdown?.length) {
        labels = reportData.yearly.yearlyBreakdown.map((item: MonthData) => {
          try {
            if (item.month >= 0 && item.month <= 11) {
              const date = new Date();
              date.setMonth(item.month);
              return format(date, 'MMM');
            }
            return String(item.month);
          } catch (error) {
            console.error("Error formatting month:", error, item.month);
            return String(item.month);
          }
        });
        incomeData = reportData.yearly.yearlyBreakdown.map((item: MonthData) => item.income);
        expenseData = reportData.yearly.yearlyBreakdown.map((item: MonthData) => item.expenses);
        
        const monthlyBudget = getMonthlyBudgetTotal(budgetLimits);
        budgetData = Array(labels.length).fill(monthlyBudget);
        
        const avgWarningThreshold = getAverageWarningThreshold(budgetLimits);
        warningData = budgetData.map(budget => budget * (avgWarningThreshold / 100));
      }

      if (expenseData.length >= 2) {
        trendData = calculateTrendLine(expenseData);
      } else if (expenseData.length === 1) {
        trendData = [expenseData[0]];
      } else {
        trendData = [];
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Budget Limit',
          data: budgetData,
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
        {
          label: 'Warning Threshold',
          data: warningData,
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 2,
          borderDash: [3, 3],
          fill: false,
          pointRadius: 0,
        },
        {
          label: 'Expense Trend',
          data: trendData,
          borderColor: 'rgba(139, 92, 246, 1)',
          backgroundColor: 'rgba(139, 92, 246, 0)',
          borderWidth: 2,
          borderDash: [3, 2],
          pointRadius: 0,
          fill: false,
        }
      ],
      incomeData,
      expenseData,
      budgetData,
      warningData,
      trendData,
    };
  }

  // Function to prepare category chart data
  function prepareCategoryData() {
    if (!reportData || !reportData.categoryBreakdown || Object.keys(reportData.categoryBreakdown).length === 0) {
      if (!transactions || transactions.length === 0) {
        const sampleCategories = ["Food", "Transport", "Utilities", "Entertainment", "Shopping"];
        const sampleData = [35000, 25000, 15000, 15000, 10000];
        
        return {
          labels: sampleCategories,
          datasets: [
            {
              data: sampleData,
              backgroundColor: [
                'rgba(239, 68, 68, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(59, 130, 246, 0.7)',
                'rgba(139, 92, 246, 0.7)',
              ],
              borderColor: [
                'rgba(239, 68, 68, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(139, 92, 246, 1)',
              ],
              borderWidth: 1,
            }
          ]
        };
      }
      
      return null;
    }
    
    const sortedCategories = Object.entries(reportData.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    let otherAmount = 0;
    if (Object.keys(reportData.categoryBreakdown).length > 5) {
      const topCategoryNames = sortedCategories.map(([name]) => name);
      Object.entries(reportData.categoryBreakdown).forEach(([name, amount]) => {
        if (!topCategoryNames.includes(name)) {
          otherAmount += amount;
        }
      });
    }
    
    const labels = sortedCategories.map(([name]) => name);
    const data = sortedCategories.map(([, amount]) => amount);
    
    if (otherAmount > 0) {
      labels.push('Other');
      data.push(otherAmount);
    }
    
    const backgroundColors = [
      'rgba(239, 68, 68, 0.7)',
      'rgba(245, 158, 11, 0.7)',
      'rgba(16, 185, 129, 0.7)',
      'rgba(59, 130, 246, 0.7)',
      'rgba(139, 92, 246, 0.7)',
      'rgba(107, 114, 128, 0.7)',
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: backgroundColors.slice(0, labels.length).map(color => color.replace('0.7', '1')),
          borderWidth: 1,
        }
      ]
    };
  }
  
  // Function to prepare category budget comparison data
  function prepareCategoryBudgetComparisonData() {
    if (!budgetLimits || budgetLimits.length === 0) {
      if (!transactions || transactions.length === 0) {
        // Updated sample data with more realistic values
        const sampleCategories = ["Food", "Transport", "Utilities", "Entertainment"];
        const sampleSpending = [450000, 320000, 180000, 150000]; // More realistic spending amounts
        const sampleBudgets = [600000, 400000, 200000, 200000]; // More realistic budget limits
        const sampleWarning = sampleBudgets.map(budget => budget * 0.8);
        const samplePercentages = sampleSpending.map((spend, i) => 
          ((spend / sampleBudgets[i]) * 100).toFixed(1) + '%');
        
        const sampleBarColors = sampleSpending.map((spend, index) => 
          spend > sampleBudgets[index] ? 'rgba(239, 68, 68, 0.7)' :
          spend > sampleWarning[index] ? 'rgba(245, 158, 11, 0.7)' : 'rgba(16, 185, 129, 0.7)');
        
        return {
          chartData: {
            labels: sampleCategories,
            datasets: [
              {
                label: 'Spending',
                data: sampleSpending,
                backgroundColor: sampleBarColors,
                borderColor: sampleBarColors.map(color => color.replace('0.7', '1')),
                borderWidth: 1,
                barPercentage: 0.6,
                categoryPercentage: 0.8,
              }
            ]
          },
          budgetData: sampleBudgets,
          warningData: sampleWarning,
          percentages: samplePercentages
        };
      }
      
      return null;
    }
    
    const relevantLimits = budgetLimits.filter(limit => 
        limit.monthlyLimit > 0 &&
        reportData.categoryBreakdown &&
        reportData.categoryBreakdown[limit.category] !== undefined
    );
    
    if (relevantLimits.length === 0) return null;
    
    const comparisonData = relevantLimits.map(limit => {
        const spending = reportData.categoryBreakdown?.[limit.category] || 0;
        let budget: number;
        let warningThresholdValue: number;

        // Adjust budget calculation based on period
        if (reportPeriod === 'weekly') {
            budget = limit.monthlyLimit / 4; // Weekly budget
            warningThresholdValue = budget * ((limit.warningThreshold || 80) / 100);
        } else if (reportPeriod === 'monthly') {
            budget = limit.monthlyLimit;
            warningThresholdValue = budget * ((limit.warningThreshold || 80) / 100);
        } else {
            budget = limit.monthlyLimit * 12; // Yearly budget
            warningThresholdValue = budget * ((limit.warningThreshold || 80) / 100);
        }

        // Calculate percentage based on period-adjusted spending and budget
        const periodAdjustedSpending = reportPeriod === 'yearly' ? spending / 12 : 
                                     reportPeriod === 'weekly' ? spending * 4 : spending;
        
        const percentage = budget > 0 ? ((periodAdjustedSpending / budget) * 100) : 0;

        return {
            category: limit.category,
            spending: spending,
            budget: budget,
            warningThreshold: warningThresholdValue,
            percentage: percentage,
            percentageString: budget > 0 ? percentage.toFixed(1) + '%' : '0%'
        };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by percentage instead of spending

    const topComparisonData = comparisonData.slice(0, 8);

    const labels = topComparisonData.map(item => item.category);
    const spendingData = topComparisonData.map(item => item.spending);
    const budgetData = topComparisonData.map(item => item.budget);
    const warningData = topComparisonData.map(item => item.warningThreshold);
    const percentageStrings = topComparisonData.map(item => item.percentageString);

    const barColors = topComparisonData.map(item =>
      item.percentage > 100 ? 'rgba(239, 68, 68, 0.7)' :
      item.percentage > 80 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(16, 185, 129, 0.7)');
    
    return {
      chartData: {
        labels,
        datasets: [
          {
            label: 'Spending',
            data: spendingData,
            backgroundColor: barColors,
            borderColor: barColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1,
            barPercentage: 0.6,
            categoryPercentage: 0.8,
          }
        ]
      },
      budgetData,
      warningData,
      percentages: percentageStrings
    };
  }

  // Calculate savings goal progress for the selected period
  const calculateSavingsGoalProgress = (goal: SavingsGoal) => {
    const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
    
    const deadlineDate = goal.deadline ? parseISO(goal.deadline) : null;
    const createdDate = new Date(goal.createdAt);
    
    if (!deadlineDate || !isValid(deadlineDate) || !isValid(createdDate) || goal.targetAmount <= 0) {
      return {
        progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
        isOnTrack: false,
        remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
        requiredMonthlySaving: 0,
        daysRemaining: 0
      };
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    deadlineDate.setHours(0,0,0,0);
    createdDate.setHours(0,0,0,0);

    if (deadlineDate <= createdDate) {
         return {
            progress: (goal.currentAmount / goal.targetAmount) * 100,
            isOnTrack: goal.currentAmount >= goal.targetAmount,
            remainingAmount: Math.max(0, goal.targetAmount - goal.currentAmount),
            requiredMonthlySaving: 0,
            daysRemaining: 0
        };
    }

    const totalDurationDays = (deadlineDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = Math.max(0, Math.min(totalDurationDays, (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const expectedProgress = totalDurationDays > 0 ? (elapsedDays / totalDurationDays) * 100 : (goal.currentAmount >= goal.targetAmount ? 100 : 0);
    const currentProgress = (goal.currentAmount / goal.targetAmount) * 100;
    const isOnTrack = currentProgress >= expectedProgress;

    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    const monthsRemaining = daysRemaining / 30.44;
    const requiredMonthlySaving = monthsRemaining > 0 ? remainingAmount / monthsRemaining : (remainingAmount > 0 ? remainingAmount : 0);

    return {
      progress: currentProgress,
      isOnTrack,
      remainingAmount,
      requiredMonthlySaving,
      daysRemaining: Math.max(0, Math.floor(daysRemaining))
    };
  };

  // Calculate planned vs actual spending by category
  const plannedVsActualData = useMemo(() => {
    const now = new Date();
    let periodStartDate: Date;

    // Set period start date based on selected report period
    if (reportPeriod === "weekly") {
      periodStartDate = new Date();
      periodStartDate.setDate(now.getDate() - 6);
      periodStartDate.setHours(0,0,0,0);
    } else if (reportPeriod === "monthly") {
      periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodStartDate.setHours(0,0,0,0);
    } else {
      periodStartDate = new Date(now.getFullYear(), 0, 1);
      periodStartDate.setHours(0,0,0,0);
    }

    // Get relevant transactions for the period
    const relevantTransactions = transactions.filter(transaction => {
      if (!transaction.date) return false;
      const tDate = new Date(transaction.date);
      if (!isValid(tDate)) return false;
      tDate.setHours(0,0,0,0);
      return tDate >= periodStartDate;
    });

    // Get budget limits for comparison
    const categoryBudgets = new Map<string, number>();
    budgetLimits.forEach(limit => {
      if (reportPeriod === "weekly") {
        categoryBudgets.set(limit.category, limit.monthlyLimit / 4);
      } else if (reportPeriod === "monthly") {
        categoryBudgets.set(limit.category, limit.monthlyLimit);
      } else {
        categoryBudgets.set(limit.category, limit.monthlyLimit * 12);
      }
    });

    // Calculate actual spending by category
    const actualSpending = new Map<string, number>();
    relevantTransactions.forEach(transaction => {
      if (transaction.amount < 0) {
        const category = transaction.category || "Uncategorized";
        const amount = Math.abs(transaction.amount);
        actualSpending.set(category, (actualSpending.get(category) || 0) + amount);
      }
    });

    // Combine data for all categories that have either a budget or actual spending
    const allCategories = new Set([...categoryBudgets.keys(), ...actualSpending.keys()]);
    
    return Array.from(allCategories).map(category => {
      const planned = categoryBudgets.get(category) || 0;
      const actual = actualSpending.get(category) || 0;
      const difference = planned - actual;
      const percentageDiff = planned > 0 ? (actual / planned) * 100 : (actual > 0 ? 100 : 0);

      return {
        category,
        planned,
        actual,
        difference,
        percentageDiff,
        status: planned === 0 ? "Unplanned" :
                percentageDiff <= 80 ? `${percentageDiff.toFixed(0)}% (Good)` :
                percentageDiff <= 100 ? `${percentageDiff.toFixed(0)}% (On Target)` :
                percentageDiff <= 120 ? `${percentageDiff.toFixed(0)}% (Over)` :
                `${percentageDiff.toFixed(0)}% (High)`
      };
    }).sort((a, b) => b.actual - a.actual);
  }, [transactions, budgetLimits, reportPeriod]);

  // Prepare chart data
  const enhancedChartData = useMemo(() => prepareEnhancedChartData(reportData, memoizedBudgetLimits, reportPeriod), [reportData, memoizedBudgetLimits, reportPeriod]);
  const categoryChartData = useMemo(() => prepareCategoryData(), [reportData, memoizedTransactions, prepareCategoryData]);
  const categoryBudgetComparisonData = useMemo(() => prepareCategoryBudgetComparisonData(), [reportData, memoizedBudgetLimits, reportPeriod, memoizedTransactions, prepareCategoryBudgetComparisonData]);

  // Calculate totals once using useMemo
  const dailyBudgetTotal = useMemo(() => getDailyBudgetTotal(budgetLimits), [budgetLimits]);
  const monthlyBudgetTotal = useMemo(() => getMonthlyBudgetTotal(budgetLimits), [budgetLimits]);

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return 'UGX ' + value.toLocaleString();
            }
            return value;
          },
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        title: {
          display: true,
          text: 'Amount (UGX)',
          font: {
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
        title: {
          display: true,
          text: reportPeriod === 'weekly' ? 'Day' : reportPeriod === 'monthly' ? 'Week' : 'Month',
          font: {
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            weight: 'bold'
          },
          filter: function(item: LegendItem) {
            return !(reportPeriod === "yearly" && item.text === "Expense Trend");
          }
        }
      },
      tooltip: {
        callbacks: {
          title: function(context: TooltipItem<'line'>[]) {
            const title = context[0].label || '';
            return `${reportPeriod === 'weekly' ? 'Day' : reportPeriod === 'monthly' ? 'Week' : 'Month'}: ${title}`;
          },
          label: function(context: TooltipItem<'line'>) {
            const label = context.dataset.label || '';
            const value = context.raw as number || 0;
            const warningThresholdPercent = getAverageWarningThreshold(budgetLimits);
            
            if (label === 'Budget Limit') {
              return `${label}: UGX ${value.toLocaleString()} (Maximum)`;
            } else if (label === 'Warning Threshold') {
              return `${label}: UGX ${value.toLocaleString()} (${warningThresholdPercent}% of Budget)`;
            } else if (label === 'Expense Trend') {
              return `${label}: UGX ${value.toLocaleString()} (Projected)`;
            } else {
              return `${label}: UGX ${value.toLocaleString()}`;
            }
          },
          afterLabel: function(context: TooltipItem<'line'>) {
            const label = context.dataset.label || '';
            const value = context.raw as number || 0;
            
            if (label === 'Expenses') {
              const chartData = context.chart.data;
              const budgetDataset = chartData.datasets.find((d) => d.label === 'Budget Limit')?.data;
              const warningDataset = chartData.datasets.find((d) => d.label === 'Warning Threshold')?.data;
              
              if (budgetDataset && warningDataset) {
                const budget = budgetDataset[context.dataIndex] as number;
                const warning = warningDataset[context.dataIndex] as number;
                const percentage = ((value / budget) * 100).toFixed(1);
                const status = value > budget ? '❌ Over budget' : 
                             value > warning ? '⚠️ Approaching limit' : 
                             '✅ Within budget';
                return `${percentage}% of budget - ${status}`;
              }
            }
            return null;
          }
        }
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  // Function to refresh data
  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      setIsLoading(false);
    }, 500);
  };

  // At the end of the component, replace the return statement with this enhanced UI
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold font-playfair">Financial Reports</h1>
        
        <div className="join">
          <button
            onClick={() => setReportPeriod("weekly")}
            className={`join-item btn ${
              reportPeriod === "weekly" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setReportPeriod("monthly")}
            className={`join-item btn ${
              reportPeriod === "monthly" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setReportPeriod("yearly")}
            className={`join-item btn ${
              reportPeriod === "yearly" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Yearly
          </button>
          <button
            onClick={refreshData}
            className="ml-2 btn btn-ghost btn-sm" 
            aria-label="Refresh data"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quick Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-background shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-lg font-medium">Income</h3>
                  <div className="badge badge-success gap-1">
                    <ArrowUp className="w-3 h-3" /> Income
                  </div>
                </div>
                <p className="text-3xl font-bold text-success">
                  UGX {(reportData?.totalIncome || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {reportPeriod === "weekly" ? "This week" :
                   reportPeriod === "monthly" ? "This month" : "This year"}
                </p>
              </div>
            </div>
            
            <div className="card bg-background shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-lg font-medium">Expenses</h3>
                  <div className="badge badge-error gap-1">
                    <ArrowDown className="w-3 h-3" /> Outflow
                  </div>
                </div>
                <p className="text-3xl font-bold text-error">
                  UGX {(reportData?.totalExpenses || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {reportPeriod === "weekly" ? "This week" :
                   reportPeriod === "monthly" ? "This month" : "This year"}
                </p>
              </div>
            </div>
            
            <div className="card bg-background shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h3 className="card-title text-lg font-medium">Net Balance</h3>
                  <div className={`badge ${(reportData?.netBalance || 0) >= 0 ? 'badge-success' : 'badge-error'} gap-1`}>
                    {(reportData?.netBalance || 0) >= 0 ? 
                      <><PiggyBank className="w-3 h-3" /> Savings</> : 
                      <><TrendingUp className="w-3 h-3" /> Deficit</>}
                  </div>
                </div>
                <p className={`text-3xl font-bold ${
                  (reportData?.netBalance || 0) >= 0 ? 'text-success' : 'text-error'
                }`}>
                  UGX {Math.abs(reportData?.netBalance || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {(reportData?.netBalance || 0) >= 0 ? "Saved" : "Overspent"}
                </p>
              </div>
            </div>
          </div>

          {/* Income vs Expense Line Chart */}
          <div className="card bg-background shadow hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title text-lg font-medium">Income vs Expenses</h3>
                {reportData?.budgetWarnings && reportData.budgetWarnings.length > 0 && (
                  <div className="badge badge-warning gap-1">
                    <AlertTriangle className="w-3 h-3" /> Budget Alert
                  </div>
                )}
              </div>
              <div className="h-[350px]">
                {enhancedChartData ? (
                  <Line
                    data={{
                      labels: enhancedChartData.labels,
                      datasets: enhancedChartData.datasets
                    }}
                    options={chartOptions}
                  />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </div>
              
              {/* Budget alerts */}
              {reportData?.budgetWarnings && reportData.budgetWarnings.length > 0 && (
                <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Budget Alerts
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                    {reportData.budgetWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Financial insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="stat bg-base-200/50 rounded-box p-3">
                  <div className="stat-title text-xs">Average Daily Spending</div>
                  <div className="stat-value text-lg">UGX {(reportData?.avgDailyExpense || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="stat bg-base-200/50 rounded-box p-3">
                  <div className="stat-title text-xs">Daily Budget</div>
                  <div className="stat-value text-lg">UGX {dailyBudgetTotal.toLocaleString()}</div>
                  <div className="stat-desc text-xs">
                    {(reportData?.avgDailyExpense || 0) <= dailyBudgetTotal ? "Under budget 👍" : "Over budget 😟"}
                  </div>
                </div>
                <div className="stat bg-base-200/50 rounded-box p-3">
                  <div className="stat-title text-xs">Monthly Budget</div>
                  <div className="stat-value text-lg">UGX {monthlyBudgetTotal.toLocaleString()}</div>
                </div>
                <div className="stat bg-base-200/50 rounded-box p-3">
                  <div className="stat-title text-xs">Savings Rate</div>
                  <div className="stat-value text-lg">{(reportData?.savingsRate || 0).toFixed(1)}%</div>
                  <div className="stat-desc text-xs">
                    {(reportData?.savingsRate || 0) >= 20 ? "Excellent 🎉" : 
                     (reportData?.savingsRate || 0) >= 10 ? "Good 👍" : 
                     (reportData?.savingsRate || 0) >= 0 ? "Needs improvement 🔍" : "Negative savings 📉"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category breakdown doughnut chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-background shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-lg font-medium mb-4">Spending by Category</h3>
                <div className="h-[300px] flex justify-center">
                  {categoryChartData ? (
                    <Doughnut
                      data={categoryChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              boxWidth: 12,
                              padding: 15,
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context: TooltipItem<'doughnut'>) {
                                const label = context.label || '';
                                const value = context.raw as number;
                                const datasetData = context.chart.data.datasets[0]?.data;
                                if (!datasetData) return `${label}: UGX ${value.toLocaleString()}`;

                                const total = datasetData.reduce((a, b) => (a as number) + (b as number), 0) as number;
                                const percentage = total > 0 ? Math.round(value / total * 100) : 0;
                                return `${label}: UGX ${value.toLocaleString()} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No category data available</p>
                    </div>
                  )}
                </div>
                
                {/* Top expense categories */}
                {reportData?.weekly?.topCategories && reportData.weekly.topCategories.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Top Expense Categories</h4>
                    <div className="space-y-2">
                      {reportData.weekly.topCategories.slice(0, 3).map((category, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span>{category.category}</span>
                          <div className="flex items-center">
                            <span className="text-gray-700 dark:text-gray-300">
                              UGX {category.amount.toLocaleString()}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({category.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Budget vs Spending by Category */}
            <div className="card bg-background shadow hover:shadow-md transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-lg font-medium mb-4">Budget vs Spending by Category</h3>
                {categoryBudgetComparisonData ? (
                  <div className="space-y-4">
                    {categoryBudgetComparisonData.chartData.labels.map((category, index) => {
                      const spending = categoryBudgetComparisonData.chartData.datasets[0].data[index] as number;
                      const budget = categoryBudgetComparisonData.budgetData[index];
                      const percentage = (spending / budget) * 100;
                      const isOverBudget = spending > budget;
                      const isNearBudget = spending > categoryBudgetComparisonData.warningData[index];
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span className="font-medium">
                              {categoryBudgetComparisonData.percentages[index]}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-2.5 rounded-full ${
                                isOverBudget ? 'bg-red-500' : 
                                isNearBudget ? 'bg-amber-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>UGX {spending.toLocaleString()}</span>
                            <span>UGX {budget.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-[250px]">
                    <div className="text-center">
                      <p className="text-gray-500">No budget limits set</p>
                      <Link href="/dashboard/budget" className="btn btn-sm btn-outline mt-2">
                        Set Budget Limits
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* The Savings Goals section we added */}
          {savingsGoals.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Savings Goals Progress</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {savingsGoals.map(goal => {
                    const progress = calculateSavingsGoalProgress(goal);
                    return (
                      <div key={goal._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{goal.title}</h3>
                          <Badge variant={progress.isOnTrack ? "success" : "destructive"}>
                            {progress.isOnTrack ? "On Track" : "Behind"}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <Progress value={progress.progress} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Current: UGX {goal.currentAmount.toLocaleString()}</span>
                            <span>Target: UGX {goal.targetAmount.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-1">
                            <span className="text-muted-foreground">Remaining</span>
                            <p className="font-medium">UGX {progress.remainingAmount.toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-muted-foreground">Time Left</span>
                            <p className="font-medium">{progress.daysRemaining > 0 ? `${progress.daysRemaining} days` : (goal.currentAmount >= goal.targetAmount ? "Goal Reached" : "Deadline Passed")}</p>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <span className="text-muted-foreground">Required Monthly Saving</span>
                            <p className="font-medium">{progress.requiredMonthlySaving > 0 ? `UGX ${progress.requiredMonthlySaving.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
          
          {/* Budget Plans Correlation */}
          {budgetPlans.length > 0 && plannedVsActualData.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Planned vs. Actual Spending</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Chart for planned vs actual */}
                  <div className="h-[300px]">
                    <Bar
                      data={{
                        labels: plannedVsActualData
                          .sort((a, b) => b.actual - a.actual)
                          .slice(0, 5)
                          .map(item => item.category),
                        datasets: [
                          {
                            label: 'Planned',
                            data: plannedVsActualData
                              .sort((a, b) => b.actual - a.actual)
                              .slice(0, 5)
                              .map(item => item.planned),
                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                          },
                          {
                            label: 'Actual',
                            data: plannedVsActualData
                              .sort((a, b) => b.actual - a.actual)
                              .slice(0, 5)
                              .map(item => item.actual),
                            backgroundColor: 'rgba(239, 68, 68, 0.6)',
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Top 5 Categories - Planned vs Actual',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: UGX ${value.toLocaleString()}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return 'UGX ' + value.toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {/* Detailed breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Budget Adherence</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left pb-2">Category</th>
                            <th className="text-right pb-2">Budget</th>
                            <th className="text-right pb-2">Actual</th>
                            <th className="text-right pb-2">Difference</th>
                            <th className="text-right pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plannedVsActualData.map(item => (
                            <tr key={item.category} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="py-3">{item.category}</td>
                              <td className="text-right py-3">
                                {item.planned > 0 ? `UGX ${item.planned.toLocaleString()}` : 'No Budget Set'}
                              </td>
                              <td className="text-right py-3">UGX {item.actual.toLocaleString()}</td>
                              <td className={`text-right py-3 font-medium ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.planned > 0 ? (
                                  <>
                                    UGX {Math.abs(item.difference).toLocaleString()}
                                    {item.difference >= 0 ? ' Under' : ' Over'}
                                  </>
                                ) : (
                                  'Unplanned Expense'
                                )}
                              </td>
                              <td className="text-right py-3">
                                <Badge variant={
                                  item.planned === 0 ? "destructive" :
                                  item.percentageDiff <= 80 ? "success" :
                                  item.percentageDiff <= 100 ? "outline" :
                                  "destructive"
                                }>
                                  {item.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Insights */}
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Budget Insights
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {plannedVsActualData.some(item => item.percentageDiff > 110) && (
                        <li>
                          You&apos;re spending more than planned in: {
                            plannedVsActualData
                              .filter(item => item.percentageDiff > 110)
                              .map(item => item.category)
                              .slice(0, 3)
                              .join(", ")
                          }. Consider adjusting your budget or reducing expenses.
                        </li>
                      )}
                      
                      {plannedVsActualData.some(item => item.planned === 0 && item.actual > 0) && (
                        <li>
                          Unplanned spending occurred in: {
                            plannedVsActualData
                              .filter(item => item.planned === 0 && item.actual > 0)
                              .map(item => item.category)
                              .slice(0, 3)
                              .join(", ")
                          }. Consider adding these to future budgets.
                        </li>
                      )}
                      
                      {plannedVsActualData.some(item => item.percentageDiff < 90 && item.planned > 0) && (
                        <li>
                          Great job staying under budget (&lt;90% of plan) in: {
                            plannedVsActualData
                              .filter(item => item.percentageDiff < 90 && item.planned > 0)
                              .map((item) => item.category)
                              .slice(0, 3)
                              .join(", ")
                          }.
                        </li>
                      )}
                      
                      {plannedVsActualData.length > 0 && (
                        <li>
                          Overall {reportPeriod} status: {
                            plannedVsActualData.reduce((total, item) => total + item.actual, 0) <=
                            plannedVsActualData.reduce((total, item) => total + item.planned, 0)
                              ? "Spending is within the planned total." : "Spending exceeds the planned total."
                          }
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Rest of existing components */}
        </div>
      )}
    </div>
  );
}