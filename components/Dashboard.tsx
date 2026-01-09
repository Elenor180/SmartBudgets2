
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart as RePieChart, Pie
} from 'recharts';
import { FinancialState, Category } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';

interface Props {
  state: FinancialState;
  formatMoney: (amount: number) => string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

const Dashboard: React.FC<Props> = ({ state, formatMoney }) => {
  const totalSpent = useMemo(() => 
    state.expenses.reduce((sum, e) => sum + e.amount, 0), 
  [state.expenses]);

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

  const savings = Math.max(state.monthlyIncome - totalSpent, 0);

  return (
    <div className="space-y-12 animate-fadeIn transition-colors">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Financial Overview</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Real-time performance of your monthly capital.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Live Sync Enabled</span>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Spending" 
          value={formatMoney(totalSpent)} 
          subValue="Since 1st of month"
          icon={<TrendingDown className="text-rose-500" />} 
          color="bg-rose-50 dark:bg-rose-950/30"
          trend="Down 12%"
        />
        <StatCard 
          label="Net Savings" 
          value={formatMoney(savings)} 
          subValue="Potential balance"
          icon={<TrendingUp className="text-emerald-500" />} 
          color="bg-emerald-50 dark:bg-emerald-950/30"
          trend="Up 8%"
        />
        <StatCard 
          label="Gross Income" 
          value={formatMoney(state.monthlyIncome)} 
          subValue="Monthly recurring"
          icon={<DollarSign className="text-indigo-500" />} 
          color="bg-indigo-50 dark:bg-indigo-950/30"
        />
        <StatCard 
          label="Budgets Set" 
          value={state.budgets.length.toString()} 
          subValue="Active limits"
          icon={<Activity className="text-amber-500" />} 
          color="bg-amber-50 dark:bg-amber-950/30"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Income Trend Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart3 className="text-indigo-600 group-hover:rotate-12 transition-transform" size={22} />
                <span>Earnings Flow</span>
              </h3>
              <p className="text-sm text-slate-400 font-medium">Performance over the last 12 months.</p>
            </div>
            <button className="text-indigo-600 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.incomeHistory}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={state.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                  dy={15}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    backgroundColor: state.theme === 'dark' ? '#0f172a' : '#ffffff',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                    padding: '15px' 
                  }}
                  itemStyle={{ color: state.theme === 'dark' ? '#f8fafc' : '#1e293b' }}
                  formatter={(value: number) => [formatMoney(value), 'Income']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 flex flex-col">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-indigo-600/10 p-2 rounded-xl">
               <PieIcon className="text-indigo-600" size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Spending Mix</h3>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={spentByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {spentByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none stroke-white dark:stroke-slate-900 stroke-2" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: state.theme === 'dark' ? '#0f172a' : '#ffffff',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                  itemStyle={{ color: state.theme === 'dark' ? '#f8fafc' : '#1e293b' }}
                  formatter={(value: number, name: string) => [formatMoney(value), name]}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Spent Total</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{formatMoney(totalSpent).split('.')[0]}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4 max-h-[160px] overflow-y-auto pr-2 no-scrollbar">
            {spentByCategory.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full ring-4 ring-slate-50 dark:ring-slate-800" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{entry.name}</span>
                </div>
                <span className="text-xs font-black text-slate-400">{entry.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Status Section */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-2xl">
             <Activity className="text-amber-600" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Budget Pulse</h3>
            <p className="text-sm text-slate-400 font-medium">Monitoring utilization across your primary categories.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {budgetUsage.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active budgets found</p>
            </div>
          ) : budgetUsage.map((b) => (
            <div key={b.category} className="group p-2 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-lg leading-none mb-2">{b.category}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category Balance</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatMoney(b.spent)}</p>
                  <p className="text-[10px] font-bold text-slate-400">Limit: {formatMoney(b.limit)}</p>
                </div>
              </div>
              <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${
                    b.percent > 90 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 
                    b.percent > 70 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                    'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  }`} 
                  style={{ width: `${Math.min(b.percent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase">{Math.round(b.percent)}% Used</span>
                 <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{formatMoney(Math.max(b.limit - b.spent, 0))} Left</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string, subValue: string, icon: React.ReactNode, color: string, trend?: string }> = ({ label, value, subValue, icon, color, trend }) => (
  <div className="bg-white dark:bg-slate-900 p-7 rounded-[2rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] dark:opacity-[0.07] group-hover:scale-150 transition-transform ${color.split(' ')[0]}`} />
    
    <div className="flex items-start justify-between relative z-10">
      <div className={`p-4 rounded-2xl ${color} shadow-sm group-hover:rotate-12 transition-transform`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${trend.includes('Up') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
          {trend}
        </span>
      )}
    </div>
    
    <div className="mt-8 relative z-10">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{value}</p>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{subValue}</p>
    </div>
  </div>
);

export default Dashboard;
