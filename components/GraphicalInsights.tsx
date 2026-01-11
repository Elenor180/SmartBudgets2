import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, Label 
} from 'recharts';
import { FinancialState, Category, Expense } from '../types';
import { Activity, Filter, Info, TrendingUp, AlertCircle, Zap, ArrowUpRight } from 'lucide-react';

interface Props {
  state: FinancialState;
  formatMoney: (amount: number) => string;
}

const GraphicalInsights: React.FC<Props> = ({ state, formatMoney }) => {
  const [activeCategory, setActiveCategory] = useState<string>('TOTAL');

  // Helper to calculate daily cumulative spending for the current month
  const calculateCumulativeSpending = (expenses: Expense[], categoryFilter: string) => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const data = [];
    
    // Initial filter by month and optionally category
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      const isCurrentMonth = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const isCategoryMatch = categoryFilter === 'TOTAL' || e.category === categoryFilter;
      return isCurrentMonth && isCategoryMatch;
    });

    let cumulativeTotal = 0;
    
    // Create points for every day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), day);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), day, 23, 59, 59);
      
      const dayExpenses = currentMonthExpenses.filter(e => {
        const d = new Date(e.date);
        return d >= dayStart && d <= dayEnd;
      });
      
      const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
      cumulativeTotal += dayTotal;
      
      data.push({
        day,
        label: `${day} ${now.toLocaleDateString('en-US', { month: 'short' })}`,
        total: cumulativeTotal,
      });
    }
    
    return data;
  };

  const cumulativeData = useMemo(() => 
    calculateCumulativeSpending(state.expenses, activeCategory), 
  [state.expenses, activeCategory]);

  const ceiling = useMemo(() => {
    if (activeCategory === 'TOTAL') {
      return state.monthlyIncome;
    }
    const budget = state.budgets.find(b => b.category === activeCategory);
    return budget ? budget.limit : 0;
  }, [activeCategory, state.monthlyIncome, state.budgets]);

  const currentTotal = cumulativeData[cumulativeData.length - 1]?.total || 0;
  const usagePercent = ceiling > 0 ? (currentTotal / ceiling) * 100 : 0;
  
  // Logic for dynamic area color
  const getAreaColor = () => {
    if (usagePercent > 90) return '#f43f5e'; // Rose
    if (usagePercent > 70) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  const areaColor = getAreaColor();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const remaining = Math.max(ceiling - value, 0);
      return (
        <div className="glass-panel p-4 rounded-2xl border-2 border-white/5 shadow-2xl">
          <p className="mono text-[10px] font-black text-slate-500 uppercase mb-2">Temporal State: {payload[0].payload.label}</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Cumulative: <span className="text-indigo-400">{formatMoney(value)}</span></p>
            <p className="text-sm font-bold text-emerald-400">Remaining: <span>{formatMoney(remaining)}</span></p>
          </div>
          {value > ceiling && (
            <div className="mt-3 flex items-center space-x-2 text-rose-500">
              <AlertCircle size={14} />
              <span className="mono text-[8px] font-black uppercase">Ceiling Breached</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="text-indigo-500" size={18} />
            <span className="mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Neural Convergence Analysis</span>
          </div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter glow-text-neon leading-tight">Insight Engine</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Asymptotic spending patterns vs assigned capital ceilings.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setActiveCategory('TOTAL')}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'TOTAL' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}
          >
            Total System
          </button>
          {state.budgets.map(b => (
            <button 
              key={b.category}
              onClick={() => setActiveCategory(b.category)}
              className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === b.category ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}
            >
              {b.category}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div className="glass-panel p-10 rounded-[4rem] relative overflow-hidden group">
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="flex items-center justify-between mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                     <TrendingUp className="text-indigo-500" />
                     {activeCategory === 'TOTAL' ? 'Global Outflow Trajectory' : `${activeCategory} Segment Load`}
                  </h3>
                  <p className="mono text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Matrix Cumulative 0x{activeCategory.substr(0,3).toUpperCase()}</p>
               </div>
               <div className="text-right">
                  <p className="mono text-[9px] font-black text-slate-500 uppercase mb-1">Assigned Asymptote</p>
                  <p className="text-2xl font-black text-indigo-500">{formatMoney(ceiling)}</p>
               </div>
            </div>

            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={areaColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={areaColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} 
                    dy={10}
                  />
                  <YAxis hide domain={[0, ceiling * 1.2]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke={areaColor} 
                    strokeWidth={4} 
                    fill="url(#colorUsage)" 
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <ReferenceLine y={ceiling} stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={2}>
                    <Label 
                      value="CEILING" 
                      position="insideTopRight" 
                      fill="#f43f5e" 
                      fontSize={10} 
                      fontWeight={900} 
                      className="mono"
                    />
                  </ReferenceLine>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl border border-slate-800 space-y-8 h-full">
              <div className="flex items-center space-x-4">
                 <div className="bg-indigo-600 p-3 rounded-2xl"><Zap size={24} /></div>
                 <h3 className="text-2xl font-black">Neural Summary</h3>
              </div>
              
              <div className="space-y-8">
                 <div className="pb-6 border-b border-white/5">
                    <p className="mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">Current Aggregate</p>
                    <p className="text-4xl font-black tracking-tighter text-white">{formatMoney(currentTotal)}</p>
                 </div>
                 
                 <div className="pb-6 border-b border-white/5">
                    <p className="mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">Cap Utilization</p>
                    <div className="flex items-center space-x-4">
                       <p className={`text-4xl font-black tracking-tighter ${usagePercent > 90 ? 'text-rose-500' : 'text-emerald-400'}`}>
                          {usagePercent.toFixed(1)}%
                       </p>
                       <span className="text-[10px] font-black text-slate-500 uppercase leading-none">Limit<br/>Proximity</span>
                    </div>
                 </div>

                 <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center space-x-3 text-indigo-400 mb-2">
                       <Info size={16} />
                       <span className="mono text-[9px] font-black uppercase">Strategic Tip</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                       {usagePercent > 80 
                         ? "High load detected. Converging on ceiling limits. System suggests immediate outflow reduction."
                         : "Trajectory is stable. Neural guardrails indicate safe capital velocity for this node."}
                    </p>
                 </div>
              </div>
              
              <button className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-3 hover:bg-indigo-500 transition-all active:scale-95 shadow-xl">
                 <span>Export Neural Map</span>
                 <ArrowUpRight size={14} />
              </button>
           </section>
        </div>
      </div>
    </div>
  );
};

export default GraphicalInsights;