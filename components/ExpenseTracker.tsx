
import React, { useState, useMemo } from 'react';
import { FinancialState, Category, Expense } from '../types';
import { Trash2, PlusCircle, Filter, X, Search, Calendar, Tag, CreditCard, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  state: FinancialState;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  formatMoney: (amount: number) => string;
}

const ExpenseTracker: React.FC<Props> = ({ state, addExpense, deleteExpense, formatMoney }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  const budgetImpact = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return null;
    const numAmt = Number(amount);
    const budget = state.budgets.find(b => b.category === category);
    if (!budget) return { status: 'none' };

    const spent = state.expenses
      .filter(e => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const isOver = (spent + numAmt) > budget.limit;
    return {
      status: isOver ? 'danger' : 'safe',
      remaining: budget.limit - spent - numAmt,
      totalNew: spent + numAmt,
      limit: budget.limit
    };
  }, [amount, category, state.expenses, state.budgets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || isNaN(Number(amount))) return;
    
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    addExpense({
      id: uniqueId,
      description,
      amount: Number(amount),
      category,
      date: new Date(date).toISOString()
    });

    setDescription('');
    setAmount('');
  };

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const dateMatch = (!startDate || expenseDate >= new Date(startDate)) &&
                        (!endDate || expenseDate <= new Date(endDate + 'T23:59:59'));
      const categoryMatch = filterCategory === 'All' || expense.category === filterCategory;
      const amountMatch = (!minAmount || expense.amount >= Number(minAmount)) &&
                          (!maxAmount || expense.amount <= Number(maxAmount));
      return dateMatch && categoryMatch && amountMatch;
    });
  }, [state.expenses, filterCategory, startDate, endDate, minAmount, maxAmount]);

  const resetFilters = () => {
    setFilterCategory('All');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = filterCategory !== 'All' || startDate || endDate || minAmount || maxAmount;

  return (
    <div className="space-y-12 animate-fadeIn">
      <header>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Ledger & History</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Capture every movement of your capital with precision.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form Column */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 sticky top-12">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center space-x-2">
               <div className="bg-indigo-600 p-2 rounded-xl text-white">
                  <PlusCircle size={20} />
               </div>
               <span>Log Transaction</span>
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Amazon Cloud"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Value</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 bg-white shadow-inner"
                  >
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget Impact Indicator */}
              {budgetImpact && budgetImpact.status !== 'none' && (
                <div className={`p-4 rounded-2xl border flex items-start space-x-3 transition-all animate-slideUp ${
                  budgetImpact.status === 'danger' 
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400' 
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                }`}>
                  <div className="mt-0.5">
                    {budgetImpact.status === 'danger' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      {budgetImpact.status === 'danger' ? 'Budget Overload Detected' : 'Strategic Allocation'}
                    </p>
                    <p className="text-xs font-bold mt-1">
                      {budgetImpact.status === 'danger' 
                        ? `This will exceed ${category} budget by ${formatMoney(Math.abs(budgetImpact.remaining))}` 
                        : `${formatMoney(budgetImpact.remaining)} will remain in ${category} budget.`
                      }
                    </p>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl dark:shadow-none flex items-center justify-center space-x-3 group active:scale-95"
              >
                <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
                <span>Confirm Entry</span>
              </button>
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 overflow-hidden flex flex-col h-full min-h-[600px] max-h-[900px]">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 dark:bg-slate-800 p-2 rounded-xl text-white">
                   <Filter size={18} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Transaction Logs</h3>
                  {hasActiveFilters && (
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">Active Filters Applied</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={`px-6 py-2.5 rounded-2xl transition-all flex items-center space-x-2 text-xs font-black uppercase tracking-widest ${isFilterVisible ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <span>{isFilterVisible ? 'Dismiss' : 'Filters'}</span>
              </button>
            </div>

            {/* Filter Panel */}
            {isFilterVisible && (
              <div className="p-8 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-5 py-3 text-sm font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-600"
                    >
                      <option value="All">All Categories</option>
                      {Object.values(Category).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Value Range</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="number"
                        placeholder="Min"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="w-full px-5 py-3 text-sm font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white outline-none"
                      />
                      <span className="text-slate-300 dark:text-slate-600">to</span>
                      <input 
                        type="number"
                        placeholder="Max"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="w-full px-5 py-3 text-sm font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Window</label>
                    <div className="flex items-center space-x-3">
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-5 py-3 text-sm font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white outline-none"
                      />
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-5 py-3 text-sm font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={resetFilters}
                    className="mt-6 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center justify-center space-x-2 py-3 border-2 border-rose-100 dark:border-rose-900/30 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <X size={14} />
                    <span>Purge Filters</span>
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto flex-1 no-scrollbar">
              {filteredExpenses.length === 0 ? (
                <div className="p-24 text-center flex flex-col items-center justify-center">
                  <div className="bg-slate-50 dark:bg-slate-950 p-10 rounded-full mb-6">
                    <Filter size={48} className="text-slate-200 dark:text-slate-800" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Zero Matches Found</h4>
                  <p className="text-slate-400 mt-2 font-medium">Try broadening your search or filter criteria.</p>
                </div>
              ) : filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-10 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group relative">
                  {/* Category accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600/0 group-hover:bg-indigo-600 transition-all"></div>
                  
                  <div className="flex items-center space-x-8">
                    <div className="bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{new Date(expense.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{expense.description}</h4>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100/50 dark:border-indigo-900/30">
                          {expense.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          ID: {expense.id.split('-')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-10">
                    <div className="text-right">
                      <span className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter">{formatMoney(expense.amount)}</span>
                    </div>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="p-3 text-slate-300 dark:text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                Verified Records: {filteredExpenses.length} of {state.expenses.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
