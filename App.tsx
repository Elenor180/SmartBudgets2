import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  Sparkles, 
  PlusCircle, 
  Settings as SettingsIcon,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Bell,
  Cpu,
  Target,
  Zap,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Database,
  Mail,
  LineChart as LineChartIcon
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import BudgetManager from './components/BudgetManager';
import ExpenseTracker from './components/ExpenseTracker';
import ALARSAdvisor from './components/ALARSAdvisor';
import Settings from './components/Settings';
import Auth from './components/Auth';
import ReminderManager from './components/ReminderManager';
import GoalTracker from './components/GoalTracker';
import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import SubscriptionManager from './components/SubscriptionManager';
import OwnerConsole from './components/OwnerConsole';
import GraphicalInsights from './components/GraphicalInsights';
import { FinancialState, Expense, Category, Currency, AppNotification, NotificationType, Theme, User, Reminder, NotificationPreferences, Goal, IncomeSource, SubscriptionTier, SubscriptionInfo, OwnerConfig, IncomeRecord } from './types';
import { getCurrencyLocale, getCurrencySymbol } from './services/currencyUtils';

const getCurrentMonthLabel = () => {
  return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const getDefaultOwnerConfig = (): OwnerConfig => ({
  ownerEmail: 'costarandy380@gmail.com',
  vaultPassword: 'adminQRint',
  bankName: 'System Primary Reserve',
  accountHolder: 'Quantum Reach Treasury',
  accountNumber: 'TR-990-211-10',
  branchCode: '99000',
  stripePublicKey: '',
  paypalEmail: 'costarandy380@gmail.com',
  lastUpdated: new Date().toISOString(),
  smtpConfig: {
    host: 'smtp-relay.brevo.com',
    port: 587,
    username: 'costarandy380@gmail.com',
    appPassword: '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'
  }
});

const getInitialState = (monthlyIncome = 4500): FinancialState => ({
  expenses: [],
  budgets: [
    { category: Category.FOOD, limit: 500 },
    { category: Category.RENT, limit: 1200 },
    { category: Category.TRANSPORT, limit: 200 },
  ],
  overallLimit: 3000,
  goals: [],
  reminders: [],
  monthlyIncome,
  incomeSources: [
    { id: 'primary', name: 'Primary Yield', amount: monthlyIncome }
  ],
  currency: Currency.USD,
  theme: 'light',
  notificationPreferences: {
    weeklyReports: true,
    budgetThresholds: true,
    aiInsights: true,
    securityAlerts: true
  },
  incomeHistory: [
    { month: 'Oct 2024', amount: monthlyIncome * 0.9, expenses: monthlyIncome * 0.6 },
    { month: 'Nov 2024', amount: monthlyIncome * 0.95, expenses: monthlyIncome * 0.85 },
    { month: 'Dec 2024', amount: monthlyIncome, expenses: monthlyIncome * 0.6 },
    { month: getCurrentMonthLabel(), amount: monthlyIncome, expenses: 0 },
  ],
  alarsAutonomy: false,
  alarsDailyPromptsUsed: 0,
  alarsLastPromptDate: getTodayString()
});

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showOwnerConsole, setShowOwnerConsole] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [ownerConfig, setOwnerConfig] = useState<OwnerConfig>(() => {
    const saved = localStorage.getItem('sb_owner_config_vault');
    if (saved) {
      try {
        const parsed = JSON.parse(atob(saved));
        if (!parsed.smtpConfig) {
          parsed.smtpConfig = getDefaultOwnerConfig().smtpConfig;
        }
        return parsed;
      } catch (e) {
        return getDefaultOwnerConfig();
      }
    }
    return getDefaultOwnerConfig();
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sb_current_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.email.toLowerCase() === ownerConfig.ownerEmail.toLowerCase()) {
        u.isAdmin = true;
      } else {
        u.isAdmin = false;
      }
      return u;
    }
    return null;
  });

  const [state, setState] = useState<FinancialState>(() => getInitialState());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`sb_data_${user.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (!parsed.reminders) parsed.reminders = [];
        if (!parsed.goals) parsed.goals = [];
        if (!parsed.incomeSources) parsed.incomeSources = [{ id: 'primary', name: 'Primary Yield', amount: parsed.monthlyIncome }];
        if (parsed.overallLimit === undefined) parsed.overallLimit = 3000;
        setState(parsed);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && state) {
      localStorage.setItem(`sb_data_${user.id}`, JSON.stringify(state));
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [state, user]);

  const updateOverallLimit = (limit: number) => {
    setState(prev => ({ ...prev, overallLimit: limit }));
    notify(`Global Ceiling adjusted to ${limit}`, 'success');
  };

  const updateIncome = (amount: number) => {
    setState(prev => {
      const newTotal = amount;
      return {
        ...prev,
        monthlyIncome: newTotal,
        incomeHistory: prev.incomeHistory.map(h => 
          h.month === getCurrentMonthLabel() ? { ...h, amount: newTotal } : h
        )
      };
    });
    notify(`Monthly yield synchronized to ${amount}`, 'success');
  };

  const addIncomeSource = (source: IncomeSource) => {
    setState(prev => {
      const newSources = [...prev.incomeSources, source];
      const newTotal = newSources.reduce((s, src) => s + src.amount, 0);
      return {
        ...prev,
        incomeSources: newSources,
        monthlyIncome: newTotal,
        incomeHistory: prev.incomeHistory.map(h => 
          h.month === getCurrentMonthLabel() ? { ...h, amount: newTotal } : h
        )
      };
    });
    notify(`New yield source deployed: ${source.name}`, 'success');
  };

  const deleteIncomeSource = (id: string) => {
    setState(prev => {
      const newSources = prev.incomeSources.filter(s => s.id !== id);
      const newTotal = newSources.reduce((s, src) => s + src.amount, 0);
      return {
        ...prev,
        incomeSources: newSources,
        monthlyIncome: newTotal,
        incomeHistory: prev.incomeHistory.map(h => 
          h.month === getCurrentMonthLabel() ? { ...h, amount: newTotal } : h
        )
      };
    });
    notify(`Yield source neutralized`, 'info');
  };

  const updateBudget = (category: Category, limit: number) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.some(b => b.category === category) 
        ? prev.budgets.map(b => b.category === category ? { ...b, limit } : b)
        : [...prev.budgets, { category, limit }]
    }));
    notify(`${category} budget updated`, 'success');
  };

  const formatMoney = useCallback((amount: number) => {
    const locale = getCurrencyLocale(state.currency);
    return new Intl.NumberFormat(locale, {
      style: 'currency', 
      currency: state.currency,
    }).format(amount);
  }, [state.currency]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sb_current_user');
  };

  const NavItem = ({ to, icon: Icon, label, locked, onClick }: { to: string, icon: any, label: string, locked?: boolean, onClick?: () => void }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
      <Link 
        to={locked ? location.pathname : to} 
        onClick={(e) => {
          if (locked) {
            e.preventDefault();
            notify("Premium Neural Component: Upgrade Required", "warning");
            setShowSubscription(true);
          } else if (onClick) {
            onClick();
          }
        }} 
        className={`flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={20} />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        {locked && <Lock size={12} className="text-slate-600 group-hover:text-indigo-400" />}
      </Link>
    );
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!user) return <Auth onAuthSuccess={(u, d) => { setUser(u); d && setState(prev => ({...prev, ...d})); }} notify={notify} ownerEmail={ownerConfig.ownerEmail} ownerVaultPassword={ownerConfig.vaultPassword} ownerSMTP={ownerConfig.smtpConfig} />;

  const isFree = user.subscription.tier === SubscriptionTier.FREE;

  return (
    <HashRouter>
      <div className={`flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden ${user.isAdmin ? 'border-2 border-rose-600/10' : ''}`}>
        
        {showSubscription && (
          <SubscriptionManager 
            currentTier={user.subscription.tier} 
            onUpgrade={(info) => {
              const updatedUser = { ...user, subscription: info };
              setUser(updatedUser);
              localStorage.setItem('sb_current_user', JSON.stringify(updatedUser));
              setShowSubscription(false);
              notify("Neural Upgrade Successful", "success");
            }} 
            onClose={() => setShowSubscription(false)} 
            ownerConfig={ownerConfig}
          />
        )}

        <aside className="hidden lg:flex flex-col w-80 glass border-r dark:border-slate-800 p-8 space-y-10 sticky top-0 h-screen overflow-y-auto no-scrollbar">
          <Logo size={48} layout="horizontal" className="mb-10" />
          <nav className="flex-1 space-y-2">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/goals" icon={Target} label="Objectives" />
            <NavItem to="/budgets" icon={PieChart} label="Budgets" />
            <NavItem to="/alars" icon={Sparkles} label="Alars AI" />
            <NavItem to="/insights" icon={LineChartIcon} label="Neural Insights" locked={isFree} />
            <NavItem to="/expenses" icon={PlusCircle} label="Ledger" />
            <NavItem to="/settings" icon={SettingsIcon} label="Config" />
          </nav>
          <div className="pt-8 border-t dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-600">{user.name[0]}</div>
                <div className="truncate max-w-[120px]">
                   <p className="text-sm font-black dark:text-white">{user.name}</p>
                   <p className="text-[10px] text-slate-500 uppercase">{user.subscription.tier}</p>
                </div>
             </div>
             <button onClick={handleLogout} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"><LogOut size={18} /></button>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-screen no-scrollbar">
          <div className="max-w-6xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard state={state} formatMoney={formatMoney} />} />
              <Route path="/goals" element={<GoalTracker state={state} addGoal={(g) => setState(p => ({...p, goals: [g, ...p.goals]}))} updateProgress={(id, a) => {}} deleteGoal={(id) => setState(p => ({...p, goals: p.goals.filter(goal => goal.id !== id)}))} formatMoney={formatMoney} />} />
              <Route path="/budgets" element={<BudgetManager state={state} updateBudget={updateBudget} updateOverallLimit={updateOverallLimit} formatMoney={formatMoney} />} />
              <Route path="/alars" element={<ALARSAdvisor 
                state={state} 
                user={user} 
                notify={notify} 
                updateBudget={updateBudget} 
                updateIncome={updateIncome} 
                addIncomeSource={addIncomeSource} 
                deleteIncomeSource={deleteIncomeSource} 
                addGoal={(g) => setState(p => ({...p, goals: [g, ...p.goals]}))} 
                deleteGoal={(id) => setState(p => ({...p, goals: p.goals.filter(goal => goal.id !== id)}))} 
                addReminder={(r) => setState(p => ({...p, reminders: [r, ...p.reminders]}))} 
                deleteReminder={(id) => setState(p => ({...p, reminders: p.reminders.filter(rem => rem.id !== id)}))} 
                incrementPromptUsage={() => setState(p => ({ ...p, alarsDailyPromptsUsed: p.alarsDailyPromptsUsed + 1 }))}
                onUpgradeClick={() => setShowSubscription(true)} 
              />} />
              <Route path="/insights" element={<GraphicalInsights state={state} formatMoney={formatMoney} />} />
              <Route path="/expenses" element={<ExpenseTracker state={state} addExpense={(e) => setState(p => ({...p, expenses: [e, ...p.expenses]}))} deleteExpense={(id) => setState(p => ({...p, expenses: p.expenses.filter(exp => exp.id !== id)}))} formatMoney={formatMoney} />} />
              <Route path="/settings" element={<Settings state={state} user={user} updateIncome={updateIncome} addIncomeSource={addIncomeSource} deleteIncomeSource={deleteIncomeSource} updateCurrency={(c) => setState(p => ({...p, currency: c}))} updateTheme={(t) => setState(p => ({...p, theme: t}))} updateNotificationPreferences={(pref) => setState(p => ({...p, notificationPreferences: pref}))} updateUserName={(n) => setUser(u => u ? {...u, name: n} : null)} updateBudget={updateBudget} updateAlarsAutonomy={(a) => setState(p => ({...p, alarsAutonomy: a}))} formatMoney={formatMoney} onUpgradeClick={() => setShowSubscription(true)} />} />
            </Routes>
          </div>
        </main>

        <div className="fixed top-6 right-6 z-[100] space-y-4 pointer-events-none max-w-[calc(100vw-48px)]">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto flex items-center space-x-4 px-5 py-4 rounded-3xl shadow-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/10 animate-slide-up">
              <span className="text-sm font-bold truncate dark:text-white text-slate-900">{n.message}</span>
            </div>
          ))}
        </div>
      </div>
    </HashRouter>
  );
};

export default App;