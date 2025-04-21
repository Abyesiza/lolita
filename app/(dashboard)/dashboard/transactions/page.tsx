"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import TransactionForm from "@/app/components/forms/TransactionForm";
import { Id } from "@/convex/_generated/dataModel";

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.list) || [];
  const deleteTransaction = useMutation(api.transactions.remove);
  
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  
  // Handle successful transaction addition
  const handleTransactionSuccess = () => {
    setShowForm(false);
  };
  
  // Handle transaction deletion
  const handleDeleteTransaction = async (id: Id<"transactions">) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction({ id });
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  // Handle print transaction history
  const handlePrint = () => {
    window.print();
  };
  
  // Filter transactions
  const filteredTransactions = transactions
    .filter(transaction => 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(transaction => 
      filterCategory ? transaction.category === filterCategory : true
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Get unique categories for filter
  const categories = Array.from(new Set(transactions.map(t => t.category)));
  
  return (
    <div className="space-y-6 transactions-history" data-print-date={new Date().toLocaleDateString()}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-playfair">Transactions</h1>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="text-primary text-sm flex items-center hover:bg-primary/5 py-1 px-2 rounded-md transition-colors"
            aria-label="Print transaction history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Print
          </button>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary px-4 py-2 rounded flex items-center gap-2 font-montserrat"
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
                Add Transaction
              </>
            )}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4 font-playfair">Add New Transaction</h2>
          <TransactionForm onSuccess={handleTransactionSuccess} />
        </div>
      )}
      
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6 print-filters">
          <div className="flex-grow">
            <label htmlFor="search" className="block text-sm font-medium mb-1 font-montserrat">
              Search Transactions
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray rounded font-montserrat"
              placeholder="Search by description or category..."
            />
          </div>
          <div className="md:w-1/4">
            <label htmlFor="category-filter" className="block text-sm font-medium mb-1 font-montserrat">
              Filter by Category
            </label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 border border-gray rounded font-montserrat bg-background text-foreground"
              style={{ appearance: 'menulist' }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto transactions-table">
          {filteredTransactions.length > 0 ? (
            <table className="w-full font-montserrat">
              <thead>
                <tr className="border-b border-gray">
                  <th className="text-left p-2 text-gray-dark">Description</th>
                  <th className="text-left p-2 text-gray-dark">Category</th>
                  <th className="text-left p-2 text-gray-dark">Date</th>
                  <th className="text-right p-2 text-gray-dark">Amount</th>
                  <th className="text-right p-2 text-gray-dark actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-gray hover:bg-gray-light">
                    <td className="p-3">{transaction.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-light">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="p-3 text-gray-dark">
                      {transaction.date}
                      {transaction.time && (
                        <span className="ml-2 text-xs text-gray-dark">
                          {transaction.time}
                        </span>
                      )}
                    </td>
                    <td className={`p-3 text-right ${transaction.amount >= 0 ? 'text-success' : 'text-error'}`}>
                      {transaction.amount >= 0 ? '+' : ''}UGX {Math.abs(transaction.amount).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => handleDeleteTransaction(transaction._id)}
                        className="text-error hover:text-error-dark"
                        title="Delete transaction"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-dark font-montserrat">
              {transactions.length === 0 ? (
                <>
                  <p>No transactions found. Add your first transaction to get started!</p>
                  <button 
                    onClick={() => setShowForm(true)}
                    className="mt-4 btn-primary px-4 py-2 rounded"
                  >
                    Add Transaction
                  </button>
                </>
              ) : (
                <p>No transactions match your search filters. Try adjusting your search parameters.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 