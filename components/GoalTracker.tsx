
import React, { useState } from 'react';
import { Target, Plus, TrendingUp, Home, Car, Briefcase, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { FinancialState, Goal, Category } from '../types';

interface Props {
  state: FinancialState;
  addGoal: (goal: Goal) => void;
  updateProgress: (goalId: string, amount: number) => void;
  deleteGoal: (id: string) => void;
  formatMoney: (amount: number) => string;
}

const GoalTracker: React.FC<Props> = ({ state, addGoal, updateProgress, deleteGoal, formatMoney }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState<Category>(Category.SAVINGS);
  const [contribution, setContribution] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;
    const goal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      targetAmount: Number(target),
      currentAmount: 0,
      category,
      createdAt: new Date().toISOString()
    };
    addGoal(goal);
    setName('');
    setTarget('');
    setIsAdding(false);
  };

  const handleContribute = (goalId: string) => {
    const amount = Number(contribution[goalId]);
    if (isNaN(amount) || amount <= 0) return;
    updateProgress(goalId, amount);
    setContribution(prev => ({ ...prev, [goalId]: '' }));
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Objectives</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Engineer your capital towards life-defining assets.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
        >
          <Plus size={18} />
          <span>New Target</span>
        </button>
      </header>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-indigo-100 dark:border-indigo-900/30 animate-slideUp">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tesla Model 3" className="w-full px-5 py-3 rounded-xl bg-white border dark:border-slate-800 outline-none font-bold text-black" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Capital</label>
              <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="50000" className="w-full px-5 py-3 rounded-xl bg-white border dark:border-slate-800 outline-none font-bold text-black" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
              <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full px-5 py-3 rounded-xl bg-white border dark:border-slate-800 outline-none font-bold text-black">
                <option value={Category.SAVINGS}>General Savings</option>
                <option value={Category.TRANSPORT}>Vehicle</option>
                <option value={Category.RENT}>Real Estate</option>
                <option value={Category.ENTERTAINMENT}>Lifestyle</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="flex-1 bg-slate-900 dark:bg-indigo-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs">Initialize</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-slate-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {state.goals.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <Target size={48} className="text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active targets in simulation</p>
          </div>
        ) : state.goals.map(goal => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <div key={goal.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group hover:shadow-2xl transition-all duration-500">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl text-indigo-600 dark:text-indigo-400">
                    {goal.category === Category.TRANSPORT && <Car size={24} />}
                    {goal.category === Category.RENT && <Home size={24} />}
                    {goal.category === Category.SAVINGS && <TrendingUp size={24} />}
                    {goal.category !== Category.TRANSPORT && goal.category !== Category.RENT && goal.category !== Category.SAVINGS && <Briefcase size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{goal.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{goal.category} Objective</p>
                  </div>
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatMoney(goal.currentAmount)}
                    <span className="text-sm font-bold text-slate-400 ml-2">of {formatMoney(goal.targetAmount)}</span>
                  </div>
                  <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">{progress.toFixed(1)}%</div>
                </div>

                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t dark:border-slate-800">
                  <input 
                    type="number" 
                    value={contribution[goal.id] || ''} 
                    onChange={e => setContribution(prev => ({ ...prev, [goal.id]: e.target.value }))}
                    placeholder="Allocated sum..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white border dark:border-slate-800 outline-none text-sm font-bold text-black"
                  />
                  <button 
                    onClick={() => handleContribute(goal.id)}
                    className="bg-slate-900 dark:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2"
                  >
                    <span>Fund</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalTracker;
