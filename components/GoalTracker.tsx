import React, { useState, useEffect } from 'react';
import { Target, Plus, TrendingUp, Home, Car, Briefcase, Trash2, ArrowUpRight, CheckCircle2, Zap, Clock } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="space-y-12 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
             <div className="bg-indigo-600/20 p-2 rounded-lg"><Target className="text-indigo-400" size={18} /></div>
             <span className="mono text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Capital Milestones</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter glow-text-neon">Strategic Objectives</h2>
          <p className="text-slate-400 mt-2 font-medium max-w-xl">Architect your financial future by engineering high-fidelity capital targets.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center space-x-3 hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Initialize Objective</span>
        </button>
      </header>

      {isAdding && (
        <div className="glass-panel p-10 rounded-[3.5rem] border-t-4 border-indigo-600 animate-slide-up shadow-[0_0_50px_rgba(99,102,241,0.1)]">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
            <div className="space-y-3">
              <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Objective Label</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Primary Reserve" className="w-full px-6 py-4 rounded-2xl bg-white border border-white/10 outline-none font-bold text-black shadow-inner" required />
            </div>
            <div className="space-y-3">
              <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Magnitude</label>
              <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="50000" className="w-full px-6 py-4 rounded-2xl bg-white border border-white/10 outline-none font-bold text-black shadow-inner" required />
            </div>
            <div className="space-y-3">
              <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sector</label>
              <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full px-6 py-4 rounded-2xl bg-white border border-white/10 outline-none font-bold text-black appearance-none cursor-pointer">
                <option value={Category.SAVINGS}>General Savings</option>
                <option value={Category.TRANSPORT}>Vehicle / Mobility</option>
                <option value={Category.RENT}>Real Estate / Shelter</option>
                <option value={Category.ENTERTAINMENT}>Lifestyle / Leisure</option>
              </select>
            </div>
            <div className="flex space-x-3 h-[60px]">
              <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-500 transition-all active:scale-95">Deploy</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 bg-white/5 border border-white/10 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Abort</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {state.goals.length === 0 ? (
          <div className="col-span-full py-32 text-center glass-panel rounded-[4rem] border-2 border-dashed border-white/10">
             <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 animate-float">
                <Target size={48} className="text-slate-700" />
             </div>
             <p className="mono text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">No Active Neural Targets</p>
          </div>
        ) : state.goals.map(goal => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const isComplete = progress >= 100;
          
          return (
            <div key={goal.id} className="glass-panel p-10 rounded-[3.5rem] border-t-2 border-white/5 group hover:neon-border transition-all duration-500 relative overflow-hidden flex flex-col">
              {/* Performance Glow Background */}
              <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex items-center space-x-6">
                  <div className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 ${isComplete ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'}`}>
                    {goal.category === Category.TRANSPORT && <Car size={28} />}
                    {goal.category === Category.RENT && <Home size={28} />}
                    {goal.category === Category.SAVINGS && <TrendingUp size={28} />}
                    {goal.category !== Category.TRANSPORT && goal.category !== Category.RENT && goal.category !== Category.SAVINGS && <Briefcase size={28} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{goal.name}</h3>
                    <div className="flex items-center space-x-3 mt-1.5">
                       <span className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest">{goal.category} Sector</span>
                       {isComplete && <span className="mono text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1 animate-pulse"><CheckCircle2 size={10} /> Fully Funded</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="p-3 bg-white/5 rounded-xl text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"><Trash2 size={18} /></button>
              </div>

              <div className="space-y-8 flex-1 relative z-10">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="mono text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Accumulated Capital</p>
                    <div className="text-3xl font-black text-white tracking-tighter flex items-baseline">
                      {formatMoney(goal.currentAmount).split('.')[0]}
                      <span className="text-sm font-bold text-slate-500 ml-3 uppercase tracking-widest">/ {formatMoney(goal.targetAmount)}</span>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${isComplete ? 'text-emerald-400 glow-text-emerald' : 'text-indigo-400 glow-text-neon'}`}>
                    {progress.toFixed(1)}%
                  </div>
                </div>

                {/* High-Fidelity Progress Bar */}
                <div className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div 
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${
                      isComplete ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)]' : 'bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                    }`} 
                    style={{ width: mounted ? `${Math.min(progress, 100)}%` : '0%' }}
                  >
                    {/* Animated Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -translate-x-full animate-[shimmer_3s_infinite]" style={{ animationDelay: `${Math.random() * 2}s` }} />
                  </div>
                </div>

                <div className="flex items-center space-x-4 pt-8 border-t border-white/5">
                  <div className="relative flex-1 group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs group-focus-within/input:text-indigo-400 transition-colors">INIT:</div>
                    <input 
                      type="number" 
                      value={contribution[goal.id] || ''} 
                      onChange={e => setContribution(prev => ({ ...prev, [goal.id]: e.target.value }))}
                      placeholder="Allocate capital..."
                      className="w-full pl-14 pr-4 py-4 rounded-2xl bg-black/40 border border-white/10 outline-none text-sm font-black text-white focus:border-indigo-500/50 transition-all placeholder:text-slate-800"
                    />
                  </div>
                  <button 
                    onClick={() => handleContribute(goal.id)}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center space-x-2 hover:bg-indigo-500 transition-all shadow-xl active:scale-95 group/btn"
                  >
                    <span>Relay Funds</span>
                    <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between text-slate-600 text-[8px] mono font-black uppercase tracking-[0.3em]">
                 <div className="flex items-center gap-2">
                    <Clock size={10} />
                    <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
                 </div>
                 <span>Node: 0x{goal.id.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalTracker;