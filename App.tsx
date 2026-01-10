
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
  Zap
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
import { FinancialState, Expense, Category, Currency, AppNotification, NotificationType, Theme, User, Reminder, NotificationPreferences, Goal, IncomeSource } from './types';
import { getCurrencyLocale, getCurrencySymbol } from './services/currencyUtils';

const getCurrentMonthLabel = () => {
  return new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const getInitialState = (monthlyIncome = 4500): FinancialState => ({
  expenses: [],
  budgets: [
    { category: Category.FOOD, limit: 500 },
    { category: Category.RENT, limit: 1200 },
    { category: Category.TRANSPORT, limit: 200 },
  ],
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
    { month: getCurrentMonthLabel(), amount: monthlyIncome },
  ],
  alarsAutonomy: false
});

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sb_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [state, setState] = useState<FinancialState>(() => getInitialState());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`sb_data_${user.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (!parsed.reminders) parsed.reminders = [];
        if (!parsed.goals) parsed.goals = [];
        if (!parsed.incomeSources) parsed.incomeSources = [{ id: 'primary', name: 'Primary Yield', amount: parsed.monthlyIncome }];
        if (parsed.alarsAutonomy === undefined) parsed.alarsAutonomy = false;
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

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // Neural Sentinel Surveillance
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setState(prev => {
        let hasChange = false;
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const currentDay = now.getDate();

        const updatedReminders = prev.reminders.map(reminder => {
          // Recurring Logic
          if (reminder.isRecurring && reminder.dayOfMonth === currentDay) {
            if (reminder.lastTriggeredMonth !== currentMonthStr) {
              notify(`Recurring Sentinel: ${reminder.title} processed for ${currentMonthStr}`, 'info');
              hasChange = true;
              return { ...reminder, lastTriggeredMonth: currentMonthStr, triggered: true };
            }
          }

          // Budget Threshold logic
          if (reminder.type === 'budget_threshold' && !reminder.triggered) {
            const budget = prev.budgets.find(b => b.category === reminder.category);
            const spent = prev.expenses.filter(e => e.category === reminder.category).reduce((s, e) => s + e.amount, 0);
            if (budget && (spent / budget.limit) * 100 >= (reminder.threshold || 100)) {
              notify(`Ceiling Breached: ${reminder.category} at ${reminder.threshold}%`, 'warning');
              hasChange = true;
              return { ...reminder, triggered: true };
            }
          }
          return reminder;
        });

        return hasChange ? { ...prev, reminders: updatedReminders } : prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [user, notify]);

  const handleAuthSuccess = (authenticatedUser: User, initialData?: Partial<FinancialState>) => {
    if (initialData) {
      const mergedState = { ...getInitialState(initialData.monthlyIncome), ...initialData };
      setState(mergedState as FinancialState);
    }
    setUser(authenticatedUser);
    localStorage.setItem('sb_current_user', JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sb_current_user');
  };

  const formatMoney = useCallback((amount: number) => {
    const locale = getCurrencyLocale(state.currency);
    return new Intl.NumberFormat(locale, {
      style: 'currency', 
      currency: state.currency,
    }).format(amount);
  }, [state.currency]);

  const addExpense = (expense: Expense) => {
    setState(prev => ({ ...prev, expenses: [expense, ...prev.expenses] }));
    notify(`Capital outflow logged`, 'success');
  };

  const addGoal = (goal: Goal) => {
    setState(prev => ({ ...prev, goals: [goal, ...prev.goals] }));
    notify(`Objective initialized`, 'success');
  };

  const updateGoalProgress = (goalId: string, amount: number) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g),
      expenses: [{
        id: Math.random().toString(36).substr(2, 9),
        amount,
        category: Category.SAVINGS,
        description: `Goal Funding: ${prev.goals.find(g => g.id === goalId)?.name}`,
        date: new Date().toISOString()
      }, ...prev.expenses]
    }));
    notify(`Capital allocated`, 'success');
  };

  const deleteGoal = (id: string) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
    notify(`Objective neutralized`, 'info');
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

  const updateIncome = (amount: number) => {
    setState(prev => {
      // Manual income edit replaces sources with a single primary source
      const newTotal = amount;
      return {
        ...prev,
        monthlyIncome: newTotal,
        incomeSources: [{ id: 'primary', name: 'Primary Yield', amount: newTotal }],
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

  const addReminder = (r: Reminder) => {
    setState(prev => ({...prev, reminders: [r, ...prev.reminders]}));
    notify(`Sentinel deployed`, 'success');
  };

  const updateUserName = (newName: string) => {
    if (!user) return;
    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);
    localStorage.setItem('sb_current_user', JSON.stringify(updatedUser));
    notify('Identity label updated', 'success');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
        <Icon size={20} />
        <span className="font-semibold text-sm">{label}</span>
      </Link>
    );
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  if (!user) return <Auth onAuthSuccess={handleAuthSuccess} notify={notify} />;

  return (
    <HashRouter>
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="fixed top-6 right-6 z-[100] space-y-4 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto flex items-center space-x-4 px-5 py-4 rounded-3xl shadow-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/10 animate-slideUp">
              <span className="text-sm font-bold">{n.message}</span>
            </div>
          ))}
        </div>

        <aside className="hidden lg:flex flex-col w-80 glass border-r dark:border-slate-800 p-8 space-y-10 sticky top-0 h-screen">
          <Logo size={48} layout="horizontal" />
          <nav className="flex-1 space-y-2">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/goals" icon={Target} label="Objectives" />
            <NavItem to="/budgets" icon={PieChart} label="Budgets" />
            <NavItem to="/expenses" icon={PlusCircle} label="Ledger" />
            <NavItem to="/sentinels" icon={Bell} label="Sentinels" />
            <NavItem to="/alars" icon={Zap} label="ALARS Core" />
            <NavItem to="/settings" icon={SettingsIcon} label="Config" />
          </nav>
          <div className="pt-8 border-t dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-3">
               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">{user.name[0]}</div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-black truncate dark:text-white">{user.name}</p>
                 <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-5 py-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl font-bold transition-all">
              <LogOut size={18} /><span>Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard state={state} formatMoney={formatMoney} />} />
              <Route path="/goals" element={<GoalTracker state={state} addGoal={addGoal} updateProgress={updateGoalProgress} deleteGoal={deleteGoal} formatMoney={formatMoney} />} />
              <Route path="/budgets" element={<BudgetManager state={state} updateBudget={updateBudget} formatMoney={formatMoney} />} />
              <Route path="/expenses" element={<ExpenseTracker state={state} addExpense={addExpense} deleteExpense={(id) => setState(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id)}))} formatMoney={formatMoney} />} />
              <Route path="/sentinels" element={<ReminderManager state={state} addReminder={addReminder} deleteReminder={(id) => setState(prev => ({...prev, reminders: prev.reminders.filter(rem => rem.id !== id)}))} formatMoney={formatMoney} />} />
              <Route path="/alars" element={<ALARSAdvisor state={state} notify={notify} updateBudget={updateBudget} updateIncome={updateIncome} addIncomeSource={addIncomeSource} deleteIncomeSource={deleteIncomeSource} addGoal={addGoal} deleteGoal={deleteGoal} addReminder={addReminder} deleteReminder={(id) => setState(prev => ({...prev, reminders: prev.reminders.filter(rem => rem.id !== id)}))} />} />
              <Route path="/settings" element={<Settings state={state} updateIncome={updateIncome} addIncomeSource={addIncomeSource} deleteIncomeSource={deleteIncomeSource} updateCurrency={(currency) => setState(prev => ({...prev, currency}))} updateTheme={(theme) => setState(prev => ({...prev, theme}))} updateNotificationPreferences={(p) => setState(prev => ({...prev, notificationPreferences: p}))} updateUserName={updateUserName} updateBudget={updateBudget} updateAlarsAutonomy={(a) => setState(prev => ({...prev, alarsAutonomy: a}))} formatMoney={formatMoney} />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
