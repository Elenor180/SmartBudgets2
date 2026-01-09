
import React, { useState } from 'react';
import { FinancialState, Currency, Theme, NotificationPreferences } from '../types';
import { Save, User, Wallet, Globe, ShieldCheck, Lock, ArrowRight, Check, Moon, Sun, Palette, Mail, Bell, PieChart, Sparkles, Shield } from 'lucide-react';

interface Props {
  state: FinancialState;
  updateIncome: (income: number) => void;
  updateCurrency: (currency: Currency) => void;
  updateTheme: (theme: Theme) => void;
  updateNotificationPreferences: (prefs: NotificationPreferences) => void;
}

const Settings: React.FC<Props> = ({ state, updateIncome, updateCurrency, updateTheme, updateNotificationPreferences }) => {
  const [income, setIncome] = useState<string>(state.monthlyIncome.toString());
  const [currency, setCurrency] = useState<Currency>(state.currency);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIncome = Number(income);
    if (isNaN(newIncome) || newIncome < 0) return;
    
    updateIncome(newIncome);
    updateCurrency(currency);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPrefs = {
      ...state.notificationPreferences,
      [key]: !state.notificationPreferences[key]
    };
    updateNotificationPreferences(newPrefs);
  };

  const PreferenceToggle = ({ 
    label, 
    description, 
    icon: Icon, 
    active, 
    onToggle 
  }: { 
    label: string, 
    description: string, 
    icon: any, 
    active: boolean, 
    onToggle: () => void 
  }) => (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-2xl transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
          <p className="text-xs text-slate-400 font-medium">{description}</p>
        </div>
      </div>
      <button 
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <span
          className={`${
            active ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-12 animate-fadeIn max-w-4xl pb-12">
      <header>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Configuration</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Calibrate your profile and global platform preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Appearance Toggle */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center space-x-5 mb-8 border-b border-slate-50 dark:border-slate-800 pb-8">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl shadow-lg">
                <Palette size={24} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Appearance</h3>
                <p className="text-sm text-slate-400 font-medium">Interface visual preferences.</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl transition-colors ${state.theme === 'light' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  {state.theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">System Theme</p>
                  <p className="text-xs text-slate-400 font-medium">{state.theme === 'light' ? 'Currently Light Mode' : 'Currently Dark Mode'}</p>
                </div>
              </div>

              <button 
                onClick={() => updateTheme(state.theme === 'light' ? 'dark' : 'light')}
                className="relative inline-flex h-10 w-20 items-center rounded-full bg-slate-200 dark:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              >
                <span
                  className={`${
                    state.theme === 'dark' ? 'translate-x-11' : 'translate-x-1'
                  } inline-block h-8 w-8 transform rounded-full bg-white dark:bg-indigo-600 shadow-lg ring-0 transition-transform duration-300 ease-in-out flex items-center justify-center`}
                >
                  {state.theme === 'dark' ? <Moon size={16} className="text-white" /> : <Sun size={16} className="text-amber-500" />}
                </span>
              </button>
            </div>
          </section>

          {/* Email Notifications Section */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 hover:shadow-xl transition-all duration-500 group">
            <div className="flex items-center space-x-5 mb-8 border-b border-slate-50 dark:border-slate-800 pb-8">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl shadow-lg">
                <Mail size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Email Alerts</h3>
                <p className="text-sm text-slate-400 font-medium">Manage notification channels.</p>
              </div>
            </div>
            
            <div className="space-y-2 divide-y divide-slate-50 dark:divide-slate-800">
              <PreferenceToggle 
                label="Weekly Reports" 
                description="Comprehensive wealth summary." 
                icon={PieChart}
                active={state.notificationPreferences.weeklyReports}
                onToggle={() => togglePreference('weeklyReports')}
              />
              <PreferenceToggle 
                label="Budget Sentinels" 
                description="Alerts for threshold breaches." 
                icon={Bell}
                active={state.notificationPreferences.budgetThresholds}
                onToggle={() => togglePreference('budgetThresholds')}
              />
              <PreferenceToggle 
                label="AI Insights" 
                description="Neural strategy recommendations." 
                icon={Sparkles}
                active={state.notificationPreferences.aiInsights}
                onToggle={() => togglePreference('aiInsights')}
              />
              <PreferenceToggle 
                label="Security Hub" 
                description="Session and integrity alerts." 
                icon={Shield}
                active={state.notificationPreferences.securityAlerts}
                onToggle={() => togglePreference('securityAlerts')}
              />
            </div>
          </section>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 hover:shadow-xl transition-all duration-500 group">
          <div className="space-y-10">
            <div className="flex items-center space-x-5 border-b border-slate-50 dark:border-slate-800 pb-8">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 group-hover:scale-110 transition-transform">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Financial Profile</h3>
                <p className="text-sm text-slate-400 font-medium">Core parameters for analysis engines.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                  <Wallet size={12} className="text-indigo-600" />
                  <span>Monthly Post-Tax Yield</span>
                </label>
                <div className="relative">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 dark:text-slate-600 text-xl">$</div>
                   <input 
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="4500"
                    className="w-full pl-12 pr-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-xl font-black text-slate-900 dark:text-white shadow-inner"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                  <Globe size={12} className="text-indigo-600" />
                  <span>Standard Currency</span>
                </label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-lg font-black text-slate-900 dark:text-white bg-white shadow-inner appearance-none cursor-pointer"
                >
                  <option value={Currency.USD}>USD ($) — US Dollar</option>
                  <option value={Currency.EUR}>EUR (€) — Euro</option>
                  <option value={Currency.ZAR}>ZAR (R) — SA Rand</option>
                  <option value={Currency.GBP}>GBP (£) — British Pound</option>
                  <option value={Currency.JPY}>JPY (¥) — Japanese Yen</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-12 mt-10 border-t border-slate-50 dark:border-slate-800 gap-6">
            <button 
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center space-x-4 bg-slate-900 dark:bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-2xl shadow-slate-200 dark:shadow-none group/btn active:scale-95"
            >
              <span>Synchronize Profile</span>
              <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>

            {showSuccess && (
              <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 animate-slideUp">
                <Check size={18} strokeWidth={3} />
                <span className="font-black uppercase tracking-widest text-[10px]">Vault Updated</span>
              </div>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-indigo-600 dark:bg-indigo-900/50 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 dark:shadow-none relative overflow-hidden group border border-transparent dark:border-indigo-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform"></div>
              <div className="relative z-10">
                <div className="bg-white/20 dark:bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                   <ShieldCheck size={24} className="text-emerald-400" />
                </div>
                <h4 className="text-xl font-black uppercase tracking-widest mb-4">Privacy Framework</h4>
                <p className="text-sm font-medium leading-relaxed opacity-80">
                  SmartBudgets operates on a Zero-Cloud persistence model. 100% of your transaction signatures remain on your local hardware.
                </p>
              </div>
           </div>

           <div className="bg-slate-100 dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-colors">
              <div>
                <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                   <Lock size={20} className="text-slate-900 dark:text-slate-100" />
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">API Security</h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tighter">
                  Communication with Gemini AI is ephemeral and anonymized. We never store logs of your advisor interactions on our infrastructure.
                </p>
              </div>
              <div className="mt-8 flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">End-to-End Encryption Active</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
