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
  Mail
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
import { FinancialState, Expense, Category, Currency, AppNotification, NotificationType, Theme, User, Reminder, NotificationPreferences, Goal, IncomeSource, SubscriptionTier, SubscriptionInfo, OwnerConfig } from './types';
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
    const interval = setInterval(() => {
      if (user?.isAdmin) {
        if (user.email.toLowerCase() !== ownerConfig.ownerEmail.toLowerCase()) {
          notify("Security Anomaly: Admin Session Integrity Compromised", "error");
          handleLogout();
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, ownerConfig]);

  useEffect(() => {
    const today = getTodayString();
    if (state.alarsLastPromptDate !== today) {
      setState(prev => ({
        ...prev,
        alarsDailyPromptsUsed: 0,
        alarsLastPromptDate: today
      }));
    }
  }, [state.alarsLastPromptDate]);

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

  useEffect(() => {
    const encrypted = btoa(JSON.stringify(ownerConfig));
    localStorage.setItem('sb_owner_config_vault', encrypted);
    if (user && user.email.toLowerCase() === ownerConfig.ownerEmail.toLowerCase() && !user.isAdmin) {
       setUser({...user, isAdmin: true});
    }
  }, [ownerConfig, user]);

  const handleAuthSuccess = (authenticatedUser: User, initialData?: Partial<FinancialState>) => {
    if (initialData) {
      const mergedState = { ...getInitialState(initialData.monthlyIncome), ...initialData };
      setState(mergedState as FinancialState);
    }
    setUser(authenticatedUser);
    localStorage.setItem('sb_current_user', JSON.stringify(authenticatedUser));
  };

  const handleUpgrade = (info: SubscriptionInfo) => {
    if (!user) return;
    const updatedUser = { ...user, subscription: info };
    setUser(updatedUser);
    localStorage.setItem('sb_current_user', JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    const updatedUsers = users.map((u: any) => u.id === updatedUser.id ? { ...u, subscription: info } : u);
    localStorage.setItem('sb_users', JSON.stringify(updatedUsers));
    notify(`Capital routed to Treasury. Tier updated: ${info.tier}`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setShowOwnerConsole(false);
    localStorage.removeItem('sb_current_user');
  };

  const incrementPromptUsage = () => {
    setState(prev => ({ ...prev, alarsDailyPromptsUsed: prev.alarsDailyPromptsUsed + 1 }));
  };

  const formatMoney = useCallback((amount: number) => {
    const locale = getCurrencyLocale(state.currency);
    return new Intl.NumberFormat(locale, {
      style: 'currency', 
      currency: state.currency,
    }).format(amount);
  }, [state.currency]);

  const addGoal = (goal: Goal) => {
    const isFree = user?.subscription.tier === SubscriptionTier.FREE;
    if (isFree && state.goals.length >= 3) {
      notify("Neural Buffer Exceeded: Max 3 Goals allowed on FREE protocol.", 'warning');
      setShowSubscription(true);
      return;
    }
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

  const NavItem = ({ to, icon: Icon, label, locked, onClick }: { to: string, icon: any, label: string, locked?: boolean, onClick?: () => void }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
      <Link to={to} onClick={onClick} className={`flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
        <div className="flex items-center space-x-3">
          <Icon size={20} />
          <span className="font-semibold text-sm">{label}</span>
        </div>
        {locked && <Lock size={12} className="text-slate-600 group-hover:text-indigo-400" />}
      </Link>
    );
  };

  const NavigationContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'p-6' : 'p-0'}`}>
      {!mobile && <Logo size={48} layout="horizontal" className="mb-10" />}
      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem to="/goals" icon={Target} label="Objectives" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem to="/budgets" icon={PieChart} label="Budgets" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem to="/expenses" icon={PlusCircle} label="Ledger" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem to="/sentinels" icon={Bell} label="Sentinels" onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem to="/alars" icon={Zap} label="ALARS Core" locked={isFree} onClick={() => setIsMobileMenuOpen(false)} />
        <NavItem to="/settings" icon={SettingsIcon} label="Config" onClick={() => setIsMobileMenuOpen(false)} />
      </nav>

      <div className="pt-8 border-t dark:border-slate-800 space-y-4">
        {user?.isAdmin && (
          <div 
            onClick={() => { setShowOwnerConsole(true); setIsMobileMenuOpen(false); }}
            className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 hover:bg-rose-500/20 cursor-pointer transition-all flex items-center justify-between group shadow-[0_0_15px_rgba(225,29,72,0.15)]"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert size={18} className="text-rose-500 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="mono text-[9px] font-black text-rose-500 uppercase tracking-widest">Secure Vault</span>
                <span className="mono text-[7px] text-rose-400/60 uppercase flex items-center gap-1"><Mail size={8} /> Gmail Linked</span>
              </div>
            </div>
            <ShieldCheck size={12} className="text-rose-500/50" />
          </div>
        )}

        <div 
          onClick={() => { setShowSubscription(true); setIsMobileMenuOpen(false); }}
          className={`p-5 rounded-[2rem] cursor-pointer transition-all border-2 border-dashed ${isFree ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10' : 'bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="mono text-[8px] font-black uppercase tracking-widest text-slate-500">Plan Status</span>
            <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${isFree ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
              {user?.subscription.tier}
            </div>
          </div>
          <p className={`text-xs font-black ${isFree ? 'text-rose-400' : 'text-indigo-400'}`}>
            {isFree ? 'License: Limited' : 'License: Neural Max'}
          </p>
        </div>

        <div className="flex items-center space-x-3 px-2">
           <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                {user?.name[0]}
              </div>
              {user?.isAdmin && (
                <div className="absolute -top-1 -right-1 bg-rose-600 border-2 border-white dark:border-slate-950 w-3.5 h-3.5 rounded-full flex items-center justify-center">
                   <ShieldAlert size={8} className="text-white" />
                </div>
              )}
           </div>
           <div className="flex-1 overflow-hidden">
             <p className="text-sm font-black truncate dark:text-white">{user?.name}</p>
             <p className="text-[10px] text-slate-400 truncate uppercase tracking-tighter">{user?.isAdmin ? 'System Owner' : user?.email}</p>
           </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-5 py-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl font-bold transition-all">
          <LogOut size={18} /><span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!user) return <Auth onAuthSuccess={handleAuthSuccess} notify={notify} ownerEmail={ownerConfig.ownerEmail} ownerVaultPassword={ownerConfig.vaultPassword} ownerSMTP={ownerConfig.smtpConfig} />;

  const isFree = user.subscription.tier === SubscriptionTier.FREE;

  return (
    <HashRouter>
      <div className={`flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden ${user.isAdmin ? 'border-2 border-rose-600/10' : ''}`}>
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 z-50">
          <Logo size={32} layout="horizontal" showText={false} />
          <span className="font-black tracking-tighter text-indigo-600 text-lg">Smart Budgets</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-white dark:bg-slate-950 animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
              <Logo size={32} layout="horizontal" showText={false} />
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600 dark:text-slate-300">
                <X size={24} />
              </button>
            </div>
            <NavigationContent mobile />
          </div>
        )}

        {showSubscription && (
          <SubscriptionManager 
            currentTier={user.subscription.tier} 
            onUpgrade={handleUpgrade} 
            onClose={() => setShowSubscription(false)} 
            ownerConfig={ownerConfig}
          />
        )}

        {showOwnerConsole && user.isAdmin && (
          <OwnerConsole 
            config={ownerConfig} 
            onSave={(newCfg) => {
              setOwnerConfig(newCfg);
              setShowOwnerConsole(false);
              notify("Vault Encryption Updated", "success");
            }} 
            onClose={() => setShowOwnerConsole(false)} 
          />
        )}

        <div className="fixed top-6 right-6 z-[100] space-y-4 pointer-events-none max-w-[calc(100vw-48px)]">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto flex items-center space-x-4 px-5 py-4 rounded-3xl shadow-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/10 animate-slide-up">
              <span className="text-sm font-bold truncate">{n.message}</span>
            </div>
          ))}
        </div>

        <aside className="hidden lg:flex flex-col w-80 glass border-r dark:border-slate-800 p-8 space-y-10 sticky top-0 h-screen overflow-y-auto no-scrollbar">
          <NavigationContent />
        </aside>

        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-[calc(100vh-64px)] lg:h-screen no-scrollbar">
          <div className="max-w-6xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard state={state} formatMoney={formatMoney} />} />
              <Route path="/goals" element={<GoalTracker state={state} addGoal={addGoal} updateProgress={updateGoalProgress} deleteGoal={(id) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id)}))} formatMoney={formatMoney} />} />
              <Route path="/budgets" element={<BudgetManager state={state} updateBudget={updateBudget} formatMoney={formatMoney} />} />
              <Route path="/expenses" element={<ExpenseTracker state={state} addExpense={(e) => setState(prev => ({ ...prev, expenses: [e, ...prev.expenses] }))} deleteExpense={(id) => setState(prev => ({ ...prev, expenses: prev.expenses.filter(ex => ex.id !== id)}))} formatMoney={formatMoney} />} />
              <Route path="/sentinels" element={<ReminderManager state={state} addReminder={(r) => setState(prev => ({...prev, reminders: [r, ...prev.reminders]}))} deleteReminder={(id) => setState(prev => ({...prev, reminders: prev.reminders.filter(rem => rem.id !== id)}))} formatMoney={formatMoney} />} />
              <Route path="/alars" element={<ALARSAdvisor state={state} user={user} incrementPromptUsage={incrementPromptUsage} notify={notify} updateBudget={updateBudget} updateIncome={updateIncome} addIncomeSource={addIncomeSource} deleteIncomeSource={deleteIncomeSource} addGoal={addGoal} deleteGoal={(id) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id)}))} addReminder={(r) => setState(prev => ({...prev, reminders: [r, ...prev.reminders]}))} deleteReminder={(id) => setState(prev => ({...prev, reminders: prev.reminders.filter(rem => rem.id !== id)}))} onUpgradeClick={() => setShowSubscription(true)} />} />
              <Route path="/settings" element={<Settings state={state} user={user} updateIncome={updateIncome} addIncomeSource={addIncomeSource} deleteIncomeSource={deleteIncomeSource} updateCurrency={(currency) => setState(prev => ({...prev, currency}))} updateTheme={(theme) => setState(prev => ({...prev, theme}))} updateNotificationPreferences={(p) => setState(prev => ({...prev, notificationPreferences: p}))} updateUserName={(name) => { if(user) { const u = {...user, name}; setUser(u); localStorage.setItem('sb_current_user', JSON.stringify(u)); } }} updateBudget={updateBudget} updateAlarsAutonomy={(a) => setState(prev => ({...prev, alarsAutonomy: a}))} formatMoney={formatMoney} onUpgradeClick={() => setShowSubscription(true)} />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;