import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart as RePieChart, Pie, BarChart, Bar
} from 'recharts';
import { FinancialState, Category } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, PieChart as PieIcon, ArrowUpRight, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface Props {
  state: FinancialState;
  formatMoney: (amount: number) => string;
}

const COLORS = ['#6366f1', '#38bdf8', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const Dashboard: React.FC<Props> = ({ state, formatMoney }) => {
  const totalSpent = useMemo(() => 
    state.expenses.reduce((sum, e) => sum + e.amount, 0), 
  [state.expenses]);

  const savings = Math.max(state.monthlyIncome - totalSpent, 0);
  const savingsRate = state.monthlyIncome > 0 ? (savings / state.monthlyIncome) * 100 : 0;

  const budgetUsage = useMemo(() => {
    return state.budgets.map(b => {
      const spent = state.expenses
        .filter(e => e.category === b.category)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        category: b.category,
        spent,
        limit: b.limit,
        percent: b.limit > 0 ? (spent / b.limit) * 100 : 0
      };
    });
  }, [state.expenses, state.budgets]);

  const auditStatus = useMemo(() => {
    const overBudgetCount = budgetUsage.filter(b => b.spent > b.limit).length;
    const warningCount = budgetUsage.filter(b => b.spent > b.limit * 0.8 && b.spent <= b.limit).length;
    return { overBudgetCount, warningCount };
  }, [budgetUsage]);

  const spentByCategory = useMemo(() => {
    const data = Object.values(Category).map(cat => {
      const value = state.expenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: cat,
        value,
        percentage: totalSpent > 0 ? ((value / totalSpent) * 100).toFixed(1) : '0'
      };
    }).filter(d => d.value > 0);
    return data.sort((a, b) => b.value - a.value);
  }, [state.expenses, totalSpent]);

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6 md:pb-8">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <ShieldCheck className="text-indigo-500 animate-pulse" size={16} md:size={20} />
            <span className="mono text-[8px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Surveillance Protocol Active</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter glow-text-neon leading-tight">Command Center</h2>
          <p className="text-slate-400 mt-2 font-medium text-sm md:text-base">Quantifying capital velocity and neural budget compliance.</p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="glass-panel px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl flex flex-col items-center flex-1 md:flex-none">
            <span className="mono text-[8px] md:text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Savings Engine</span>
            <span className={`text-lg md:text-xl font-black ${savingsRate > 20 ? 'text-emerald-400 glow-text-emerald' : 'text-indigo-400'}`}>{savingsRate.toFixed(1)}%</span>
          </div>
          <div className="glass-panel px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl flex flex-col items-center border-l-4 border-indigo-600 flex-1 md:flex-none">
             <span className="mono text-[8px] md:text-[10px] text-slate-500 uppercase font-bold tracking-tighter">System Health</span>
             <span className="text-lg md:text-xl font-black text-white">OPTIMAL</span>
          </div>
        </div>
      </header>

      {/* Audit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <CommandCard 
          label="Total Consumption" 
          value={formatMoney(totalSpent)} 
          subValue="Monthly Aggregate"
          icon={<Zap className="text-indigo-400" />} 
          trend={totalSpent > state.monthlyIncome * 0.5 ? "Critical" : "Stable"}
        />
        <CommandCard 
          label="Residual Capital" 
          value={formatMoney(savings)} 
          subValue="Liquidity Level"
          icon={<DollarSign className="text-emerald-400" />} 
          trend="Positive"
          isEmerald
        />
        <CommandCard 
          label="Neural Income" 
          value={formatMoney(state.monthlyIncome)} 
          subValue="Allocated Budget"
          icon={<TrendingUp className="text-blue-400" />} 
        />
        <CommandCard 
          label="Audit Alerts" 
          value={auditStatus.overBudgetCount.toString()} 
          subValue={`${auditStatus.warningCount} Warnings`}
          icon={<AlertCircle className={auditStatus.overBudgetCount > 0 ? "text-rose-500 animate-bounce" : "text-slate-500"} />} 
          isDanger={auditStatus.overBudgetCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Expenditure Trajectory */}
        <div className="xl:col-span-2 glass-panel p-6 md:p-10 rounded-2xl md:rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-transform group-hover:scale-110 hidden md:block">
             <Activity size={200} />
          </div>
          <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-3">
                <BarChart3 className="text-indigo-500" size={22} md:size={26} />
                <span>Capital Trajectory</span>
              </h3>
              <p className="mono text-[8px] md:text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-widest">Neural History Analysis</p>
            </div>
          </div>
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.incomeHistory}>
                <defs>
                  <linearGradient id="colorTrajectory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} 
                  dy={10}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    backgroundColor: '#0f172a',
                    padding: '12px' 
                  }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 800, fontSize: '12px' }}
                  labelStyle={{ color: '#6366f1', marginBottom: '4px', fontWeight: 900, textTransform: 'uppercase', fontSize: '9px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTrajectory)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Distribution */}
        <div className="glass-panel p-6 md:p-10 rounded-2xl md:rounded-[3rem] flex flex-col">
          <div className="flex items-center space-x-3 mb-6 md:mb-10">
            <div className="bg-indigo-600/20 p-2 md:p-3 rounded-xl md:rounded-2xl">
               <PieIcon className="text-indigo-400" size={20} md:size={24} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Consumption Mix</h3>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px] md:min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={spentByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {spentByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none stroke-cyber-950 stroke-2" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: '#0f172a'
                  }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="mono text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Spent</span>
              <p className="text-2xl md:text-3xl font-black text-white tracking-tighter glow-text-neon">{formatMoney(totalSpent).split('.')[0]}</p>
            </div>
          </div>

          <div className="mt-6 md:mt-10 space-y-3 max-h-[120px] md:max-h-[150px] overflow-y-auto no-scrollbar pr-2">
            {spentByCategory.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{entry.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                   <span className="mono text-[9px] font-bold text-slate-500">{formatMoney(entry.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Surveillance */}
      <div className="glass-panel p-6 md:p-12 rounded-2xl md:rounded-[4rem]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="bg-emerald-500/10 p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border border-emerald-500/20">
               <Activity className="text-emerald-500" size={24} md:size={28} />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">Compliance Feed</h3>
              <p className="mono text-[8px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Real-time consumption vs assigned ceilings</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {budgetUsage.map((b) => (
            <div key={b.category} className="group glass-panel p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div>
                  <h4 className="font-black text-white text-lg md:text-xl tracking-tight leading-none mb-1">{b.category}</h4>
                  <span className="mono text-[8px] font-bold text-slate-500 uppercase">Protocol Segment</span>
                </div>
                <div className="text-right">
                  <p className="text-lg md:text-2xl font-black text-indigo-400">{formatMoney(b.spent)}</p>
                  <p className="mono text-[8px] md:text-[10px] font-bold text-slate-500">Limit: {formatMoney(b.limit)}</p>
                </div>
              </div>
              
              <div className="relative w-full h-2 md:h-3 bg-white/5 rounded-full overflow-hidden mb-3 md:mb-4">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
                    b.percent > 95 ? 'bg-rose-500' : 
                    b.percent > 75 ? 'bg-amber-500' : 
                    'bg-emerald-500'
                  }`} 
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                    <span className={`mono text-[8px] font-black uppercase ${b.percent > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {b.percent > 100 ? 'Breach' : 'Clear'}
                    </span>
                 </div>
                 <span className="mono text-[8px] font-black text-slate-400">
                   {Math.round(b.percent)}% Load
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CommandCard: React.FC<{ label: string, value: string, subValue: string, icon: React.ReactNode, trend?: string, isEmerald?: boolean, isDanger?: boolean }> = ({ label, value, subValue, icon, trend, isEmerald, isDanger }) => (
  <div className={`glass-panel p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] flex flex-col justify-between hover:translate-y-[-4px] transition-all border-l-4 ${isDanger ? 'border-rose-600' : isEmerald ? 'border-emerald-600' : 'border-indigo-600'}`}>
    <div className="flex items-start justify-between">
      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5">
        {/* Fix size property error by validating element and casting to any */}
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
      </div>
      {trend && (
        <span className={`mono text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${isDanger || trend === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {trend}
        </span>
      )}
    </div>
    
    <div className="mt-6 md:mt-8">
      <p className="mono text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl md:text-4xl font-black tracking-tighter mb-1 ${isDanger ? 'text-rose-500' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{subValue}</p>
    </div>
  </div>
);

export default Dashboard;