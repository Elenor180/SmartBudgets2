
import React, { useState } from 'react';
import { Wallet, Target, ArrowRight, ArrowLeft, CheckCircle2, Cpu, Sparkles, TrendingUp, Info } from 'lucide-react';
import { FinancialState, Category, Currency } from '../types';
import { getCurrencySymbol } from '../services/currencyUtils';

interface Props {
  onComplete: (data: Partial<FinancialState>) => void;
  userName: string;
}

const SetupWizard: React.FC<Props> = ({ onComplete, userName }) => {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState('4500');
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [budgets, setBudgets] = useState({
    [Category.FOOD]: '500',
    [Category.RENT]: '1200',
    [Category.TRANSPORT]: '300'
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleFinish = () => {
    onComplete({
      monthlyIncome: Number(income),
      currency,
      budgets: Object.entries(budgets).map(([cat, limit]) => ({
        category: cat as Category,
        limit: Number(limit)
      }))
    });
  };

  const symbol = getCurrencySymbol(currency);

  const GUIDING_TIPS = [
    {
      title: "Yield Calibration",
      tip: "Start with your net income (after tax). Accurate yield data allows ALARS to calculate your real saving power."
    },
    {
      title: "Strategic Allocation",
      tip: "Be realistic with core categories like Rent and Food. Over-restricting here leads to early system fatigue."
    },
    {
      title: "System Initialization",
      tip: "Once online, enable ALARS Autonomy in settings to have your assistant manage these limits dynamically as your spending patterns evolve."
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Wizard */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <Cpu size={180} />
          </div>

          <div className="flex space-x-2 mb-12">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="animate-fadeIn space-y-10">
              <div className="space-y-4">
                <div className="bg-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg">
                  <Wallet className="text-white" size={32} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Yield Calibration</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Greetings, {userName.split(' ')[0]}. Establish your baseline monthly capital inflow.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full px-8 py-5 rounded-[1.5rem] bg-white border border-slate-100 dark:border-slate-800 outline-none font-bold text-black appearance-none"
                  >
                    {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Income</label>
                  <div className="relative">
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-xl">{symbol}</div>
                    <input 
                      type="number" 
                      value={income} 
                      onChange={e => setIncome(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 rounded-[1.5rem] bg-white border border-slate-100 dark:border-slate-800 outline-none font-bold text-2xl text-black"
                    />
                  </div>
                </div>
              </div>

              <button onClick={nextStep} className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-95">
                <span>Next Phase</span>
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn space-y-10">
              <div className="space-y-4">
                <div className="bg-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg">
                  <TrendingUp className="text-white" size={32} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Strategic Allocation</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Define the primary ceilings for your core capital outflows.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[Category.FOOD, Category.RENT, Category.TRANSPORT].map(cat => (
                  <div key={cat} className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{cat} Limit</label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">{symbol}</div>
                      <input 
                        type="number" 
                        value={budgets[cat as keyof typeof budgets]} 
                        onChange={e => setBudgets(prev => ({ ...prev, [cat]: e.target.value }))}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 outline-none font-bold text-black"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4 pt-4">
                <button onClick={prevStep} className="px-8 py-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center space-x-2">
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button onClick={nextStep} className="flex-1 bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-95">
                  <span>Next Phase</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn space-y-12 text-center">
              <div className="space-y-4">
                <div className="inline-flex bg-emerald-100 dark:bg-emerald-900/30 p-8 rounded-full mb-4">
                  <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={64} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Ready</h2>
              </div>

              <button onClick={handleFinish} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-95 group">
                <span>Enter Core ALARS Workspace</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Intelligence Tips Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Info size={100} />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center space-x-3">
                 <div className="bg-indigo-600 p-2 rounded-xl"><Sparkles size={18} /></div>
                 <h3 className="font-black uppercase tracking-widest text-xs">Guiding Intelligence</h3>
              </div>
              
              <div className="space-y-10">
                <div className={`transition-all duration-500 ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4 grayscale'}`}>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Phase 01: Yield</p>
                  <p className="text-sm font-medium leading-relaxed">{GUIDING_TIPS[0].tip}</p>
                </div>
                <div className={`transition-all duration-500 ${step === 2 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4 grayscale'}`}>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Phase 02: Allocation</p>
                  <p className="text-sm font-medium leading-relaxed">{GUIDING_TIPS[1].tip}</p>
                </div>
                <div className={`transition-all duration-500 ${step === 3 ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4 grayscale'}`}>
                  <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">Phase 03: Automation</p>
                  <p className="text-sm font-medium leading-relaxed">{GUIDING_TIPS[2].tip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SetupWizard;
