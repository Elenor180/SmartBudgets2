import React, { useState, useMemo } from 'react';
import { FinancialState, Category, Expense } from '../types';
import { Trash2, PlusCircle, Filter, X, Search, Calendar, Tag, CreditCard, AlertTriangle, CheckCircle2, Activity, Shield, Zap } from 'lucide-react';

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
    const spent = state.expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
    if (!budget) return { status: 'untracked', currentSpent: spent };
    const projectedTotal = spent + numAmt;
    return {
      status: projectedTotal > budget.limit ? 'danger' : 'safe',
      remaining: budget.limit - projectedTotal,
      projectedPercent: (projectedTotal / budget.limit) * 100,
      spent
    };
  }, [amount, category, state.expenses, state.budgets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || isNaN(Number(amount))) return;
    addExpense({ id: `${Date.now()}`, description, amount: Number(amount), category, date: new Date(date).toISOString() });
    setDescription(''); setAmount('');
  };

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const dateMatch = (!startDate || expenseDate >= new Date(startDate)) && (!endDate || expenseDate <= new Date(endDate + 'T23:59:59'));
      const categoryMatch = filterCategory === 'All' || expense.category === filterCategory;
      const amountMatch = (!minAmount || expense.amount >= Number(minAmount)) && (!maxAmount || expense.amount <= Number(maxAmount));
      return dateMatch && categoryMatch && amountMatch;
    });
  }, [state.expenses, filterCategory, startDate, endDate, minAmount, maxAmount]);

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in pb-10">
      <header className="border-b border-white/5 pb-6 md:pb-8">
        <div className="flex items-center space-x-3 mb-2">
           <div className="bg-indigo-600/20 p-1.5 rounded-lg"><Activity className="text-indigo-400" size={16} /></div>
           <span className="mono text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest">Neural Ledger v3.1</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter glow-text-neon">Audit Logs</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-10 rounded-2xl md:rounded-[3rem] border-l-4 border-indigo-600 space-y-6">
            <h3 className="text-xl md:text-2xl font-black text-white flex items-center space-x-3">
               <PlusCircle className="text-indigo-400" size={20} md:size={24} />
               <span>Log Event</span>
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="mono text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="..." className="w-full px-5 py-4 rounded-xl bg-white border border-white/10 outline-none font-bold text-black" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="mono text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Magnitude</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full px-5 py-4 rounded-xl bg-white border border-white/10 outline-none font-bold text-black" required />
                </div>
                <div className="space-y-1">
                  <label className="mono text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-white border border-white/10 outline-none font-bold text-black text-xs" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="mono text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol</label>
                <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full px-5 py-4 rounded-xl bg-white border border-white/10 outline-none font-bold text-black appearance-none">
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {budgetImpact && (
                <div className={`p-4 rounded-xl border-2 ${budgetImpact.status === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    {budgetImpact.status === 'danger' ? <AlertTriangle size={12} /> : <Shield size={12} />}
                    {budgetImpact.status.toUpperCase()} STATUS
                  </p>
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                Append to Ledger
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-8">
          <div className="glass-panel rounded-2xl md:rounded-[4rem] overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-6 md:px-12 py-6 md:py-10 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5">
              <h3 className="text-xl md:text-2xl font-black text-white">Financial Audit Log</h3>
              <button onClick={() => setIsFilterVisible(!isFilterVisible)} className="w-full sm:w-auto px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Filter size={14} /> Matrix
              </button>
            </div>

            {isFilterVisible && (
              <div className="p-6 md:p-10 bg-black/40 border-b border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white text-black font-bold text-xs" />
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white text-black font-bold text-xs">
                  <option value="All">All Categories</option>
                  {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            )}

            <div className="divide-y divide-white/5 overflow-y-auto no-scrollbar flex-1">
              {filteredExpenses.length === 0 ? (
                <div className="p-20 text-center opacity-40 uppercase font-black text-[10px] tracking-widest">No Logs Found</div>
              ) : filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-6 md:p-12 flex items-center justify-between hover:bg-white/5 transition-all group">
                  <div className="flex items-center space-x-4 md:space-x-10">
                    <div className="bg-cyber-950 border border-white/10 w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] flex flex-col items-center justify-center">
                      <span className="mono text-[8px] font-black text-indigo-400 uppercase">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="text-xl md:text-3xl font-black text-white">{new Date(expense.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="text-lg md:text-2xl font-black text-white tracking-tighter truncate max-w-[150px] md:max-w-xs">{expense.description}</h4>
                      <span className="mono text-[8px] font-black text-indigo-400 uppercase tracking-widest">{expense.category}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="text-xl md:text-3xl font-black text-white">{formatMoney(expense.amount)}</span>
                    <button onClick={() => deleteExpense(expense.id)} className="text-slate-600 hover:text-rose-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
