
import React, { useState, useMemo } from 'react';
import { FinancialState, Category, Expense } from '../types';
import { Trash2, PlusCircle, Filter, X, Search, Calendar, Tag, CreditCard, AlertTriangle, CheckCircle2, Activity, Shield } from 'lucide-react';

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
    if (!budget) return { status: 'untracked' };

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
    <div className="space-y-12 animate-fade-in">
      <header className="border-b border-white/5 pb-8">
        <div className="flex items-center space-x-3 mb-2">
           <div className="bg-indigo-600/20 p-2 rounded-lg"><Activity className="text-indigo-400" size={18} /></div>
           <span className="mono text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Neural Ledger v3.1</span>
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter glow-text-neon">Audit Logs</h2>
        <p className="text-slate-400 mt-2 font-medium">Immutable record of capital outflows and consumption events.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="glass-panel p-10 rounded-[3rem] sticky top-12 border-l-4 border-indigo-600">
            <h3 className="text-2xl font-black text-white tracking-tight mb-10 flex items-center space-x-4">
               <div className="bg-white/10 p-2.5 rounded-xl">
                  <PlusCircle className="text-indigo-400" size={24} />
               </div>
               <span>Log Event</span>
            </h3>
            
            <div className="space-y-7">
              <div className="space-y-2">
                <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Event Description</label>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Server Allocation"
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-white/10 focus:border-indigo-500 outline-none transition-all font-bold text-black placeholder:text-slate-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Magnitude</label>
                  <div className="relative">
                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-white/10 focus:border-indigo-500 outline-none transition-all font-bold text-black placeholder:text-slate-700"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Timestamp</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-white/10 focus:border-indigo-500 outline-none transition-all font-bold text-black text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Protocol</label>
                <div className="relative">
                  <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-white/10 focus:border-indigo-500 outline-none transition-all font-bold text-black appearance-none cursor-pointer"
                  >
                    {Object.values(Category).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Neural Impact Analysis */}
              {budgetImpact && (
                <div className={`p-6 rounded-[2rem] border-2 animate-slide-up ${
                  budgetImpact.status === 'danger' 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                    : budgetImpact.status === 'untracked'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  <div className="flex items-center space-x-3 mb-2">
                    {budgetImpact.status === 'danger' ? <AlertTriangle size={16} /> : <Shield size={16} />}
                    <span className="mono text-[9px] font-black uppercase tracking-[0.2em]">Impact Analysis</span>
                  </div>
                  <p className="text-sm font-bold leading-tight">
                    {budgetImpact.status === 'danger' 
                      ? `Critical: Threshold breach by ${formatMoney(Math.abs(budgetImpact.remaining))}` 
                      : budgetImpact.status === 'untracked'
                      ? `Warning: No guardrail for ${category}.`
                      : `Secure: ${formatMoney(budgetImpact.remaining)} allocation remaining.`
                    }
                  </p>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl flex items-center justify-center space-x-4 group active:scale-95"
              >
                <PlusCircle size={22} className="group-hover:rotate-90 transition-transform" />
                <span>Append to Ledger</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-8">
          <div className="glass-panel rounded-[4rem] overflow-hidden flex flex-col h-full min-h-[700px]">
            <div className="px-12 py-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-600/20 p-3 rounded-2xl text-indigo-400">
                   <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Financial Audit Log</h3>
                  <div className="flex items-center space-x-2 mt-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                     <span className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest">Verified Integrity</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={`px-8 py-3.5 rounded-[1.75rem] transition-all flex items-center space-x-3 text-xs font-black uppercase tracking-widest border ${isFilterVisible ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                <Filter size={18} />
                <span>{isFilterVisible ? 'Dismiss Matrix' : 'Audit Matrix'}</span>
              </button>
            </div>

            {/* Matrix Filter */}
            {isFilterVisible && (
              <div className="p-10 bg-black/40 border-b border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide_up">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Type</label>
                    <select 
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-6 py-4 text-sm font-bold rounded-2xl border border-white/10 bg-white text-black outline-none focus:border-indigo-600 appearance-none"
                    >
                      <option value="All">All Categories</option>
                      {Object.values(Category).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest">Magnitude Range</label>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="number"
                        placeholder="Min"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="w-full px-5 py-4 text-sm font-bold rounded-2xl border border-white/10 bg-white text-black outline-none"
                      />
                      <input 
                        type="number"
                        placeholder="Max"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="w-full px-5 py-4 text-sm font-bold rounded-2xl border border-white/10 bg-white text-black outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between">
                   <div className="space-y-2">
                    <label className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest">Temporal Window</label>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-5 py-4 text-xs font-bold rounded-2xl border border-white/10 bg-white text-black outline-none"
                      />
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-5 py-4 text-xs font-bold rounded-2xl border border-white/10 bg-white text-black outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={resetFilters}
                    className="mt-6 mono text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center justify-center space-x-3 py-4 border border-rose-500/20 rounded-2xl hover:bg-rose-500/10 transition-colors"
                  >
                    <X size={16} />
                    <span>Clear Filter Protocol</span>
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-white/5 overflow-y-auto flex-1 no-scrollbar">
              {filteredExpenses.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center">
                  <div className="bg-white/5 p-12 rounded-full mb-8 border border-white/10 animate-pulse">
                    <Search size={56} className="text-slate-800" />
                  </div>
                  <h4 className="text-2xl font-black text-white tracking-tight">Zero Events Captured</h4>
                  <p className="text-slate-500 mt-2 font-medium">Reset temporal matrix or filters to reveal logs.</p>
                </div>
              ) : filteredExpenses.map((expense) => {
                const budget = state.budgets.find(b => b.category === expense.category);
                const isWarning = budget && (state.expenses.filter(e => e.category === expense.category && e.id === expense.id).length > 0); // Simplified check
                
                return (
                  <div key={expense.id} className="p-12 flex items-center justify-between hover:bg-white/5 transition-all group relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                    
                    <div className="flex items-center space-x-10">
                      <div className="bg-cyber-950 border border-white/10 w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl group-hover:border-indigo-500/50 transition-all duration-500 transform group-hover:scale-110">
                        <span className="mono text-[10px] font-black text-indigo-400 uppercase">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                        <span className="text-3xl font-black text-white leading-none">{new Date(expense.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-white tracking-tighter mb-1.5 group-hover:glow-text-neon transition-all">{expense.description}</h4>
                        <div className="flex items-center space-x-4">
                          <span className="mono text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-indigo-500/20">
                            {expense.category}
                          </span>
                          <span className="mono text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                            HEX: {expense.id.split('-')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-12">
                      <div className="text-right">
                        <span className="text-3xl font-black text-white tracking-tighter">{formatMoney(expense.amount)}</span>
                        <p className="mono text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Magnitude</p>
                      </div>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="p-4 text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-[1.5rem] transition-all opacity-0 group-hover:opacity-100 transform translate-x-10 group-hover:translate-x-0"
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-8 bg-black/40 border-t border-white/5 flex justify-center items-center">
              <div className="flex items-center space-x-8">
                 <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                    <span className="mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">Audited: {filteredExpenses.length}</span>
                 </div>
                 <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                    <span className="mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">Validated Logs</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
