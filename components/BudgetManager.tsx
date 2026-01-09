
import React, { useState } from 'react';
import { FinancialState, Category } from '../types';
import { Save, ShieldCheck, Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="space-y-12 animate-fadeIn">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Budget Strategy</h2>
        <p className="text-slate-500 mt-2 font-medium">Engineer your spending limits to optimize capital growth.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 sticky top-12 hover:shadow-xl transition-shadow duration-500">
            <div className="flex items-center space-x-3 mb-8">
               <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
                  <Target className="text-white" size={22} />
               </div>
               <h3 className="text-xl font-bold text-slate-900">Configure Limit</h3>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Category)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700 bg-white shadow-inner appearance-none"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Ceiling</label>
                <div className="relative">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">$</div>
                   <input 
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all font-bold text-slate-700 shadow-inner"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center space-x-3 group active:scale-95"
              >
                <Save size={20} className="group-hover:scale-110 transition-transform" />
                <span>Deploy Budget</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100/50 overflow-hidden">
             <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                   <div className="bg-slate-900 p-2 rounded-xl text-white">
                      <TrendingUp size={18} />
                   </div>
                   <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Active Allocations</h3>
                </div>
                <div className="bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monitored: {state.budgets.length}</span>
                </div>
             </div>
             
             <div className="divide-y divide-slate-50">
                {state.budgets.length === 0 ? (
                  <div className="p-24 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                       <ShieldCheck size={40} className="text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No strategic limits defined yet</p>
                  </div>
                ) : state.budgets.map((b) => {
                  const spent = state.expenses
                    .filter(e => e.category === b.category)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const isOver = spent > b.limit;
                  const usage = b.limit > 0 ? (spent / b.limit) * 100 : 0;

                  return (
                    <div key={b.category} className="p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-all group">
                      <div className="flex items-center space-x-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ring-4 ring-slate-50 ${isOver ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                           {isOver ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900 leading-tight">{b.category}</h4>
                          <div className="flex items-center space-x-3 mt-1.5">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Intensity:</span>
                             <span className={`text-[10px] font-black uppercase ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>{usage.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-12">
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Limit</p>
                           <p className="text-2xl font-black text-slate-900 tracking-tighter">{formatMoney(b.limit)}</p>
                        </div>
                        <div className="hidden sm:block">
                           <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                             isOver ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                           }`}>
                             {isOver ? 'Violation' : 'In Range'}
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
             
             <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">SmartBudgets Enterprise Intelligence</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
