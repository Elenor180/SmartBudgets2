
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
    <div className="space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <ShieldCheck className="text-indigo-500 animate-pulse" size={20} />
            <span className="mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Surveillance Protocol Active</span>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter glow-text-neon">Command Center</h2>
          <p className="text-slate-400 mt-2 font-medium">Quantifying capital velocity and neural budget compliance.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="glass-panel px-6 py-4 rounded-3xl flex flex-col items-center">
            <span className="mono text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Savings Engine</span>
            <span className={`text-xl font-black ${savingsRate > 20 ? 'text-emerald-400 glow-text-emerald' : 'text-indigo-400'}`}>{savingsRate.toFixed(1)}%</span>
          </div>
          <div className="glass-panel px-6 py-4 rounded-3xl flex flex-col items-center border-l-4 border-indigo-600">
             <span className="mono text-[10px] text-slate-500 uppercase font-bold tracking-tighter">System Health</span>
             <span className="text-xl font-black text-white">OPTIMAL</span>
          </div>
        </div>
      </header>

      {/* Real-time Audit Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          subValue={`${auditStatus.warningCount} Threshold Warnings`}
          icon={<AlertCircle className={auditStatus.overBudgetCount > 0 ? "text-rose-500 animate-bounce" : "text-slate-500"} />} 
          isDanger={auditStatus.overBudgetCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Expenditure Trajectory */}
        <div className="xl:col-span-2 glass-panel p-10 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
             <Activity size={200} />
          </div>
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center space-x-3">
                <BarChart3 className="text-indigo-500" size={26} />
                <span>Capital Trajectory</span>
              </h3>
              <p className="mono text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-widest">Neural History Analysis</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
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
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                  dy={15}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    backgroundColor: '#0f172a',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
                    padding: '20px' 
                  }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 800 }}
                  labelStyle={{ color: '#6366f1', marginBottom: '8px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
                  formatter={(value: number) => [formatMoney(value), 'Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTrajectory)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Distribution */}
        <div className="glass-panel p-10 rounded-[3rem] flex flex-col">
          <div className="flex items-center space-x-3 mb-10">
            <div className="bg-indigo-600/20 p-3 rounded-2xl">
               <PieIcon className="text-indigo-400" size={24} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Consumption Mix</h3>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={spentByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={125}
                  paddingAngle={10}
                  dataKey="value"
                  animationDuration={2000}
                >
                  {spentByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none stroke-cyber-950 stroke-4" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    backgroundColor: '#0f172a',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' 
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value: number, name: string) => [formatMoney(value), name]}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="mono text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Portfolio</span>
              <p className="text-4xl font-black text-white tracking-tighter glow-text-neon">{formatMoney(totalSpent).split('.')[0]}</p>
            </div>
          </div>

          <div className="mt-10 space-y-4 max-h-[150px] overflow-y-auto no-scrollbar pr-2">
            {spentByCategory.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">{entry.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                   <span className="mono text-[10px] font-bold text-slate-500">{formatMoney(entry.value)}</span>
                   <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">{entry.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Compliance Surveillance */}
      <div className="glass-panel p-12 rounded-[4rem]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20">
               <Activity className="text-emerald-500" size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight">Compliance Feed</h3>
              <p className="mono text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mt-1">Real-time consumption vs assigned ceilings</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auditing System Active</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {budgetUsage.length === 0 ? (
            <div className="col-span-full py-20 text-center glass-panel rounded-[3rem] border-2 border-dashed border-white/5">
               <Zap size={40} className="text-slate-700 mx-auto mb-4" />
               <p className="mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">No primary ceilings established</p>
            </div>
          ) : budgetUsage.map((b) => (
            <div key={b.category} className="group glass-panel p-8 rounded-[2.5rem] border-transparent hover:border-white/10 transition-all duration-500 hover:translate-y-[-8px]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-white text-xl tracking-tight leading-none mb-1.5">{b.category}</h4>
                  <span className="mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol Segment</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-400 glow-text-neon">{formatMoney(b.spent)}</p>
                  <p className="mono text-[10px] font-bold text-slate-500 uppercase">Limit: {formatMoney(b.limit)}</p>
                </div>
              </div>
              
              <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden mb-4 shadow-inner">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-[1.5s] ease-out progress-glow ${
                    b.percent > 95 ? 'bg-gradient-to-r from-rose-600 to-rose-400 text-rose-500' : 
                    b.percent > 75 ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-amber-500' : 
                    'bg-gradient-to-r from-emerald-600 to-emerald-400 text-emerald-500'
                  }`} 
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                    {b.percent > 100 ? <AlertCircle size={12} className="text-rose-500" /> : <ShieldCheck size={12} className="text-emerald-500" />}
                    <span className={`mono text-[9px] font-black uppercase ${b.percent > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {b.percent > 100 ? 'Overload' : 'Secure'}
                    </span>
                 </div>
                 <span className="mono text-[9px] font-black text-slate-400 uppercase tracking-widest">
                   {Math.round(b.percent)}% Capacity
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
  <div className={`glass-panel p-8 rounded-[2.5rem] flex flex-col justify-between hover:translate-y-[-5px] transition-all duration-300 group overflow-hidden relative border-l-4 ${isDanger ? 'border-rose-600' : isEmerald ? 'border-emerald-600' : 'border-indigo-600'}`}>
    <div className={`absolute -right-4 -top-4 w-28 h-28 rounded-full opacity-[0.03] transition-transform group-hover:scale-125 ${isDanger ? 'bg-rose-500' : isEmerald ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
    
    <div className="flex items-start justify-between relative z-10">
      <div className={`p-4 rounded-2xl bg-white/5 shadow-inner transition-transform group-hover:rotate-12`}>
        {icon}
      </div>
      {trend && (
        <span className={`mono text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${isDanger || trend === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {trend}
        </span>
      )}
    </div>
    
    <div className="mt-8 relative z-10">
      <p className="mono text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className={`text-4xl font-black tracking-tighter mb-1.5 ${isDanger ? 'text-rose-500' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</p>
    </div>
  </div>
);

export default Dashboard;
