
import React, { useState } from 'react';
import { FinancialState, Category } from '../types';
import { Save, ShieldCheck, Target, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { getCurrencySymbol } from '../services/currencyUtils';

interface Props {
  state: FinancialState;
  updateBudget: (category: Category, limit: number) => void;
  formatMoney: (amount: number) => string;
}

const BudgetManager: React.FC<Props> = ({ state, updateBudget, formatMoney }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.FOOD);
  const [limit, setLimit] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(Number(limit))) return;
    updateBudget(selectedCategory, Number(limit));
    setLimit('');
  };

  const symbol = getCurrencySymbol(state.currency);

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="border-b border-white/5 pb-8">
        <div className="flex items-center space-x-3 mb-2">
           <div className="bg-indigo-600/20 p-2 rounded-lg"><Target className="text-indigo-400" size={18} /></div>
           <span className="mono text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Protocol Configuration</span>
        </div>
        <h2 className="text-5xl font-black text-white tracking-tighter glow-text-neon">Asset Allocation</h2>
        <p className="text-slate-400 mt-2 font-medium max-w-2xl">Engineer consumption boundaries to maximize neural wealth generation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="glass-panel p-10 rounded-[3rem] sticky top-12 hover:neon-border transition-all duration-500">
            <div className="flex items-center space-x-4 mb-10">
               <div className="bg-indigo-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                  <Zap className="text-white" size={24} />
               </div>
               <h3 className="text-2xl font-black text-white tracking-tight">Set Ceiling</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Category)}
                  className="w-full px-6 py-5 rounded-2xl bg-white border border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-black appearance-none cursor-pointer"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Capital Limit</label>
                <div className="relative">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-500 text-xl">{symbol}</div>
                   <input 
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-white/10 focus:border-indigo-500 outline-none transition-all font-bold text-black text-xl placeholder:text-slate-700 shadow-inner"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_25px_rgba(99,102,241,0.3)] flex items-center justify-center space-x-3 group active:scale-95"
              >
                <Save size={20} className="group-hover:scale-110 transition-transform" />
                <span>Initialize Limit</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-8">
          <div className="glass-panel rounded-[3.5rem] overflow-hidden">
             <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center space-x-4">
                   <div className="bg-white/10 p-3 rounded-2xl text-white">
                      <TrendingUp size={22} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">Surveillance Log</h3>
                      <p className="mono text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Active Financial Guardrails</p>
                   </div>
                </div>
                <div className="bg-indigo-500/10 px-6 py-2 rounded-full border border-indigo-500/20">
                   <span className="mono text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active: {state.budgets.length}</span>
                </div>
             </div>
             
             <div className="divide-y divide-white/5">
                {state.budgets.length === 0 ? (
                  <div className="p-32 text-center flex flex-col items-center">
                    <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mb-8 border border-white/10 animate-float">
                       <ShieldCheck size={48} className="text-slate-700" />
                    </div>
                    <p className="mono text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">No Strategic Guards Configured</p>
                  </div>
                ) : state.budgets.map((b) => {
                  const spent = state.expenses
                    .filter(e => e.category === b.category)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const isOver = spent > b.limit;
                  const usage = b.limit > 0 ? (spent / b.limit) * 100 : 0;

                  return (
                    <div key={b.category} className="p-12 flex flex-col sm:flex-row sm:items-center justify-between gap-8 hover:bg-white/5 transition-all group relative overflow-hidden">
                      {/* Interactive hover glow */}
                      <div className={`absolute -right-20 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                      
                      <div className="flex items-center space-x-8 relative z-10">
                        <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-12 ${isOver ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                           {isOver ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white tracking-tight leading-none mb-2">{b.category}</h4>
                          <div className="flex items-center space-x-4">
                             <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span className="mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Load:</span>
                                <span className={`mono text-[10px] font-black uppercase ${isOver ? 'text-rose-500' : 'text-emerald-500'}`}>{usage.toFixed(1)}%</span>
                             </div>
                             {isOver && <span className="mono text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 rounded uppercase animate-pulse">Critical</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-16 relative z-10">
                        <div className="text-right">
                           <p className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Assigned Capacity</p>
                           <p className="text-3xl font-black text-white tracking-tighter glow-text-neon">{formatMoney(b.limit)}</p>
                        </div>
                        <div className="hidden sm:block">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                             isOver ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-white/5 border-white/10 text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-400/30'
                           }`}>
                             <ChevronRight size={24} />
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
             
             <div className="p-10 bg-black/20 border-t border-white/5 flex items-center justify-center">
                <p className="mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.5em]">Quantum Reach Strategic Framework</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
