
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
  Bell
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import BudgetManager from './components/BudgetManager';
import ExpenseTracker from './components/ExpenseTracker';
import GeminiAdvisor from './components/GeminiAdvisor';
import Settings from './components/Settings';
import Auth from './components/Auth';
import ReminderManager from './components/ReminderManager';
import { FinancialState, Expense, Category, Currency, AppNotification, NotificationType, Theme, User, Reminder, NotificationPreferences } from './types';

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
  reminders: [],
  monthlyIncome,
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
  ]
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sb_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [state, setState] = useState<FinancialState>(() => getInitialState());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load user specific data when user changes
  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`sb_data_${user.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (!parsed.reminders) parsed.reminders = [];
        if (!parsed.notificationPreferences) {
          parsed.notificationPreferences = {
            weeklyReports: true,
            budgetThresholds: true,
            aiInsights: true,
            securityAlerts: true
          };
        }
        setState(parsed);
      } else {
        // App will handle the initial state merge in handleAuthSuccess if coming from smart setup
      }
    }
  }, [user]);

  // Persist data when state changes
  useEffect(() => {
    if (user && state) {
      localStorage.setItem(`sb_data_${user.id}`, JSON.stringify(state));
      // Apply theme class globally
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

  // Reminder Sentinel Check Logic
  useEffect(() => {
    if (!user || state.reminders.length === 0) return;

    const checkReminders = () => {
      let updatedReminders = [...state.reminders];
      let hasChange = false;

      updatedReminders.forEach((reminder, index) => {
        if (reminder.triggered) return;

        if (reminder.type === 'budget_threshold') {
          const budget = state.budgets.find(b => b.category === reminder.category);
          if (budget && budget.limit > 0) {
            const spent = state.expenses
              .filter(e => e.category === reminder.category)
              .reduce((sum, e) => sum + e.amount, 0);
            
            const percentageUsed = (spent / budget.limit) * 100;
            if (percentageUsed >= (reminder.threshold || 0)) {
              notify(`Sentinel Alert: ${reminder.category} budget reached ${reminder.threshold}%`, 'warning');
              updatedReminders[index] = { ...reminder, triggered: true };
              hasChange = true;
            }
          }
        } else if (reminder.type === 'upcoming_expense' && reminder.dueDate) {
          const due = new Date(reminder.dueDate);
          const now = new Date();
          if (due.toDateString() === now.toDateString() || due < now) {
            notify(`Sentinel Alert: Upcoming outflow "${reminder.title}" is due.`, 'info');
            updatedReminders[index] = { ...reminder, triggered: true };
            hasChange = true;
          }
        }
      });

      if (hasChange) {
        setState(prev => ({ ...prev, reminders: updatedReminders }));
      }
    };

    const interval = setInterval(checkReminders, 60000);
    checkReminders();

    return () => clearInterval(interval);
  }, [state.expenses, state.budgets, state.reminders, user, notify]);

  const handleAuthSuccess = (authenticatedUser: User, initialData?: Partial<FinancialState>) => {
    if (initialData) {
      const mergedState = { ...getInitialState(initialData.monthlyIncome), ...initialData };
      setState(mergedState as FinancialState);
      localStorage.setItem(`sb_data_${authenticatedUser.id}`, JSON.stringify(mergedState));
    }
    setUser(authenticatedUser);
    localStorage.setItem('sb_current_user', JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sb_current_user');
    notify('Logged out successfully', 'info');
  };

  const formatMoney = useCallback((amount: number) => {
    const locales: Record<Currency, string> = {
      [Currency.USD]: 'en-US',
      [Currency.EUR]: 'de-DE',
      [Currency.ZAR]: 'en-ZA',
      [Currency.GBP]: 'en-GB',
      [Currency.JPY]: 'ja-JP'
    };

    return new Intl.NumberFormat(locales[state.currency] || 'en-US', {
      style: 'currency',
      currency: state.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, [state.currency]);

  const addExpense = (expense: Expense) => {
    const budget = state.budgets.find(b => b.category === expense.category);
    if (budget) {
      const currentSpent = state.expenses
        .filter(e => e.category === expense.category)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalNew = currentSpent + expense.amount;
      if (totalNew > budget.limit) {
        notify(`Budget exceeded for ${expense.category}! (${formatMoney(totalNew)} > ${formatMoney(budget.limit)})`, 'warning');
      } else {
        notify(`Logged: ${expense.description} (${formatMoney(expense.amount)})`, 'success');
      }
    } else {
      notify(`Expense added to ${expense.category}`, 'success');
    }

    setState(prev => ({
      ...prev,
      expenses: [expense, ...prev.expenses]
    }));
  };

  const deleteExpense = (id: string) => {
    notify('Expense record deleted', 'info');
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  const updateBudget = (category: Category, limit: number) => {
    notify(`${category} budget set to ${formatMoney(limit)}`, 'success');
    setState(prev => {
      const existing = prev.budgets.find(b => b.category === category);
      if (existing) {
        return {
          ...prev,
          budgets: prev.budgets.map(b => b.category === category ? { ...b, limit } : b)
        };
      }
      return {
        ...prev,
        budgets: [...prev.budgets, { category, limit }]
      };
    });
  };

  const addReminder = (reminder: Reminder) => {
    notify(`Sentinel "${reminder.title}" deployed`, 'success');
    setState(prev => ({
      ...prev,
      reminders: [reminder, ...prev.reminders]
    }));
  };

  const deleteReminder = (id: string) => {
    notify('Sentinel decommissioned', 'info');
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== id)
    }));
  };

  const updateIncome = (income: number) => {
    notify('Monthly yield projections updated', 'success');
    setState(prev => {
      const currentMonth = getCurrentMonthLabel();
      const updatedHistory = [...prev.incomeHistory];
      const existingEntryIndex = updatedHistory.findIndex(entry => entry.month === currentMonth);

      if (existingEntryIndex !== -1) {
        updatedHistory[existingEntryIndex] = { ...updatedHistory[existingEntryIndex], amount: income };
      } else {
        updatedHistory.push({ month: currentMonth, amount: income });
        if (updatedHistory.length > 12) updatedHistory.shift();
      }

      return {
        ...prev,
        monthlyIncome: income,
        incomeHistory: updatedHistory
      };
    });
  };

  const updateCurrency = (currency: Currency) => {
    notify(`Base currency initialized: ${currency}`, 'info');
    setState(prev => ({ ...prev, currency }));
  };

  const updateTheme = (theme: Theme) => {
    notify(`Interface adjusted to ${theme} mode`, 'info');
    setState(prev => ({ ...prev, theme }));
  };

  const updateNotificationPreferences = (prefs: NotificationPreferences) => {
    notify('Notification preferences synchronized', 'success');
    setState(prev => ({ ...prev, notificationPreferences: prefs }));
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`group relative flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-300 ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-white' : 'group-hover:text-indigo-600 transition-colors'} />
        <span className="font-semibold text-sm">{label}</span>
        {isActive && (
          <div className="absolute right-3">
             <ChevronRight size={14} className="opacity-50" />
          </div>
        )}
      </Link>
    );
  };

  if (!user) {
    return (
      <>
        <div className="fixed top-6 right-6 z-[100] space-y-4 pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto flex items-center space-x-4 px-5 py-4 rounded-3xl shadow-2xl border-2 animate-slideInRight bg-white dark:bg-slate-900 border-indigo-500/10 min-w-[320px]">
              <span className="text-sm font-bold flex-1">{n.message}</span>
            </div>
          ))}
        </div>
        <Auth onAuthSuccess={handleAuthSuccess} notify={notify} />
      </>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="fixed top-6 right-6 z-[100] space-y-4 pointer-events-none">
          {notifications.map(n => (
            <div 
              key={n.id} 
              className={`pointer-events-auto flex items-center space-x-4 px-5 py-4 rounded-3xl shadow-2xl border-2 animate-slideInRight min-w-[320px] ${
                n.type === 'success' ? 'bg-white dark:bg-slate-900 border-emerald-500/10 text-emerald-900 dark:text-emerald-50' :
                n.type === 'warning' ? 'bg-white dark:bg-slate-900 border-amber-500/10 text-amber-900 dark:text-amber-50' :
                n.type === 'error' ? 'bg-white dark:bg-slate-900 border-rose-500/10 text-rose-900 dark:text-rose-50' :
                'bg-white dark:bg-slate-900 border-indigo-500/10 text-indigo-900 dark:text-indigo-50'
              }`}
            >
              <div className={`p-2 rounded-xl ${
                n.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                n.type === 'error' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
                'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              }`}>
                {n.type === 'success' && <CheckCircle2 size={20} />}
                {n.type === 'warning' && <AlertTriangle size={20} />}
                {n.type === 'error' && <AlertCircle size={20} />}
                {n.type === 'info' && <Info size={20} />}
              </div>
              <span className="text-sm font-bold flex-1">{n.message}</span>
              <button 
                onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>
          ))}
        </div>

        <aside className="hidden lg:flex flex-col w-80 glass border-r border-slate-200/50 dark:border-slate-800/50 p-8 space-y-10 sticky top-0 h-screen z-10 transition-colors">
          <div className="flex items-center space-x-3.5 group cursor-pointer">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform">
              <Wallet className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">SmartBudgets</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">AI Assistant</span>
            </div>
          </div>
          
          <nav className="flex-1 space-y-2.5">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/budgets" icon={PieChart} label="Budgets" />
            <NavItem to="/expenses" icon={PlusCircle} label="Expenses" />
            <NavItem to="/sentinels" icon={Bell} label="Reminders" />
            <NavItem to="/advisor" icon={Sparkles} label="AI Advisor" />
            <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
          </nav>

          <div className="pt-8 space-y-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3 p-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <UserIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.email}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-all font-semibold text-sm"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <header className="lg:hidden glass border-b border-slate-200/50 dark:border-slate-800/50 p-5 sticky top-0 z-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-1.5 rounded-xl shadow-lg">
              <Wallet className="text-white" size={20} />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">SmartBudgets</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-500 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md pt-24 px-8 animate-fadeIn">
            <nav className="space-y-4">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/budgets" icon={PieChart} label="Budgets" />
              <NavItem to="/expenses" icon={PlusCircle} label="Expenses" />
              <NavItem to="/sentinels" icon={Bell} label="Reminders" />
              <NavItem to="/advisor" icon={Sparkles} label="AI Advisor" />
              <NavItem to="/settings" icon={SettingsIcon} label="Settings" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-5 py-3.5 rounded-2xl text-rose-600 font-semibold"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-6 lg:p-12 overflow-y-auto transition-colors no-scrollbar">
          <div className="max-w-6xl mx-auto space-y-12">
            <Routes>
              <Route path="/" element={<Dashboard state={state} formatMoney={formatMoney} />} />
              <Route path="/budgets" element={<BudgetManager state={state} updateBudget={updateBudget} formatMoney={formatMoney} />} />
              <Route path="/expenses" element={<ExpenseTracker state={state} addExpense={addExpense} deleteExpense={deleteExpense} formatMoney={formatMoney} />} />
              <Route path="/sentinels" element={<ReminderManager state={state} addReminder={addReminder} deleteReminder={deleteReminder} formatMoney={formatMoney} />} />
              <Route path="/advisor" element={<GeminiAdvisor state={state} notify={notify} />} />
              <Route path="/settings" element={<Settings state={state} updateIncome={updateIncome} updateCurrency={updateCurrency} updateTheme={updateTheme} updateNotificationPreferences={updateNotificationPreferences} />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
