import React, { useState } from 'react';
import { User as UserIcon, Wallet, Globe, ShieldCheck, Lock, ArrowRight, Check, Moon, Sun, Palette, Mail, Bell, PieChart, Sparkles, Shield, Cpu, Target, Zap, Trash2, Plus, DollarSign, ExternalLink, ShieldAlert } from 'lucide-react';
import { FinancialState, Currency, Theme, NotificationPreferences, Category, IncomeSource, User, SubscriptionTier } from '../types';

interface Props {
  state: FinancialState;
  user: User;
  updateIncome: (income: number) => void;
  addIncomeSource: (source: IncomeSource) => void;
  deleteIncomeSource: (id: string) => void;
  updateCurrency: (currency: Currency) => void;
  updateTheme: (theme: Theme) => void;
  updateNotificationPreferences: (prefs: NotificationPreferences) => void;
  updateUserName: (name: string) => void;
  updateBudget: (category: Category, limit: number) => void;
  updateAlarsAutonomy: (autonomy: boolean) => void;
  formatMoney: (amount: number) => string;
  onUpgradeClick: () => void;
}

const Settings: React.FC<Props> = ({ 
  state, user, updateIncome, addIncomeSource, deleteIncomeSource, updateCurrency, updateTheme, 
  updateNotificationPreferences, updateUserName, updateAlarsAutonomy, formatMoney, onUpgradeClick 
}) => {
  const [displayName, setDisplayName] = useState(user.name);
  const [incomeTotal, setIncomeTotal] = useState(state.monthlyIncome.toString());
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceAmount, setNewSourceAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const isFree = user.subscription.tier === SubscriptionTier.FREE;

  const handleGlobalSync = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserName(displayName);
    if (Number(incomeTotal) !== state.monthlyIncome) {
      updateIncome(Number(incomeTotal));
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceAmount) return;
    addIncomeSource({
      id: Math.random().toString(36).substr(2, 9),
      name: newSourceName,
      amount: Number(newSourceAmount)
    });
    setNewSourceName('');
    setNewSourceAmount('');
  };

  const PreferenceToggle = ({ label, icon: Icon, active, onToggle, danger, locked }: { label: string, icon: any, active: boolean, onToggle: () => void, danger?: boolean, locked?: boolean }) => (
    <div className={`flex items-center justify-between py-5 border-b dark:border-slate-800 last:border-0 ${locked ? 'opacity-50' : ''}`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-2xl ${active ? (danger ? 'bg-rose-600' : 'bg-indigo-600') : 'bg-slate-100 dark:bg-slate-800'} text-white relative`}>
          <Icon size={18} />
          {locked && <Lock size={10} className="absolute -top-1 -right-1 text-rose-500 bg-white dark:bg-slate-900 rounded-full" />}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black dark:text-white uppercase tracking-tight">{label}</span>
          {danger && <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">Autonomous Control Mode</span>}
          {locked && <span className="text-[9px] font-black text-rose-500 uppercase mt-0.5">Premium Feature</span>}
        </div>
      </div>
      <button 
        onClick={locked ? onUpgradeClick : onToggle} 
        className={`h-8 w-14 rounded-full transition-all relative ${active ? (danger ? 'bg-rose-600' : 'bg-indigo-600') : 'bg-slate-200 dark:bg-slate-700 shadow-inner'}`}
      >
        <div className={`h-6 w-6 bg-white rounded-full absolute top-1 transition-all shadow-md ${active ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in max-w-5xl pb-12">
      <header className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter glow-text-neon">Configuration</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Calibrate your neural profile and system-wide parameters.</p>
        </div>
        <div className="flex flex-col items-end">
           <span className="mono text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Active License</span>
           <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 ${isFree ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500' : 'bg-indigo-600 text-white'}`}>
             <span>{user.subscription.tier} PROTOCOL</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Licensing Management */}
          <section className="glass-panel p-10 rounded-[3rem] border-l-4 border-indigo-600">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-600/10 p-3 rounded-2xl text-indigo-400"><ShieldCheck size={24} /></div>
                <h3 className="text-2xl font-black dark:text-white">Neural Licensing</h3>
              </div>
              <button onClick={onUpgradeClick} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center space-x-2 hover:underline">
                <span>Manage Billing</span>
                <ExternalLink size={12} />
              </button>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] flex items-center justify-between">
               <div>
                  <p className="text-white font-black">{isFree ? 'Standard Access' : 'Full ALARS Authorization'}</p>
                  <p className="text-slate-500 text-xs font-medium mt-1">{isFree ? '10 daily prompts remaining today.' : 'Unlimited neural processing active.'}</p>
               </div>
               {isFree && (
                 <button onClick={onUpgradeClick} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">
                   Upgrade Now
                 </button>
               )}
            </div>
          </section>

          {/* Neural Assistant Mode */}
          <section className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl border border-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
               <Zap size={140} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-indigo-600 p-3 rounded-2xl"><Zap size={24} /></div>
                <h3 className="text-2xl font-black tracking-tight">ALARS Governance</h3>
              </div>
              <p className="text-slate-400 font-medium mb-10 max-w-lg">Enable autonomous workspace management. When active, ALARS can execute budget adjustments, goal setting, and yield management without manual confirmation.</p>
              <PreferenceToggle 
                label="ALARS Autonomy" 
                icon={Zap} 
                active={state.alarsAutonomy} 
                onToggle={() => updateAlarsAutonomy(!state.alarsAutonomy)} 
                danger
                locked={isFree}
              />
            </div>
          </section>

          <form onSubmit={handleGlobalSync} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-4 mb-10 border-b dark:border-slate-800 pb-8">
              <Cpu className="text-indigo-600" />
              <h3 className="text-2xl font-black dark:text-white">System Identification</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Label</label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full pl-14 pr-4 py-5 rounded-[1.5rem] bg-white border dark:border-slate-800 outline-none font-bold text-black" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Global Currency</label>
                <div className="relative">
                  <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={state.currency} 
                    onChange={e => updateCurrency(e.target.value as Currency)}
                    className="w-full pl-14 pr-4 py-5 rounded-[1.5rem] bg-white border dark:border-slate-800 outline-none font-bold text-black appearance-none"
                  >
                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t dark:border-slate-800 flex items-center justify-between">
              <button type="submit" className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center space-x-3 hover:bg-indigo-700 transition-all active:scale-95">
                <span>Synchronize System</span>
                <ArrowRight size={16} />
              </button>
              {showSuccess && <div className="text-emerald-500 font-black uppercase tracking-widest text-[10px] flex items-center space-x-2"><Check size={14} /><span>Logic Sync Verified</span></div>}
            </div>
          </form>
        </div>

        <div className="space-y-10">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-black dark:text-white mb-8">Interface Engine</h3>
            <div className="flex items-center justify-between py-5 border-b dark:border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Theme</span>
                <span className="text-sm font-bold dark:text-slate-200">System Visuals</span>
              </div>
              <button onClick={() => updateTheme(state.theme === 'light' ? 'dark' : 'light')} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-indigo-600 hover:scale-105 transition-transform">
                {state.theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>
            <PreferenceToggle label="Reports" icon={PieChart} active={state.notificationPreferences.weeklyReports} onToggle={() => {}} />
            <PreferenceToggle label="AI Insights" icon={Sparkles} active={state.notificationPreferences.aiInsights} onToggle={() => {}} />
            <PreferenceToggle label="Security" icon={Shield} active={state.notificationPreferences.securityAlerts} onToggle={() => {}} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
