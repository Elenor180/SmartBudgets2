
import React, { useState } from 'react';
import { FinancialState, Category, Reminder, ReminderType } from '../types';
import { Bell, BellRing, Clock, ShieldAlert, Plus, Trash2, Calendar, Target, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCurrencySymbol } from '../services/currencyUtils';

interface Props {
  state: FinancialState;
  addReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  formatMoney: (amount: number) => string;
}

const ReminderManager: React.FC<Props> = ({ state, addReminder, deleteReminder, formatMoney }) => {
  const [type, setType] = useState<ReminderType>('budget_threshold');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [threshold, setThreshold] = useState('80');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);
    
    const newReminder: Reminder = {
      id,
      type: isRecurring ? 'recurring_debit' : type,
      title: title || 'Scheduled Sentinel',
      category: (type === 'budget_threshold' || isRecurring) ? category : undefined,
      threshold: type === 'budget_threshold' ? Number(threshold) : undefined,
      dueDate: type === 'upcoming_expense' ? dueDate : undefined,
      amount: amount ? Number(amount) : undefined,
      isRecurring,
      dayOfMonth: isRecurring ? Number(dayOfMonth) : undefined,
      triggered: false,
      createdAt: new Date().toISOString()
    };

    addReminder(newReminder);
    setTitle('');
    setDueDate('');
    setAmount('');
  };

  const symbol = getCurrencySymbol(state.currency);

  return (
    <div className="space-y-12 animate-fadeIn">
      <header>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Sentinel System</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Configure proactive alerts for budget thresholds and RECURRING capital outflows.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100/50 dark:border-slate-800/50 sticky top-12">
            <div className="flex items-center space-x-3 mb-8">
               <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg">
                  <Bell className="text-white" size={22} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Sentinel</h3>
            </div>

            <div className="space-y-6">
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-6">
                <button 
                  type="button"
                  onClick={() => { setType('budget_threshold'); setIsRecurring(false); }}
                  className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'budget_threshold' && !isRecurring ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  Threshold
                </button>
                <button 
                  type="button"
                  onClick={() => { setType('upcoming_expense'); setIsRecurring(false); }}
                  className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'upcoming_expense' && !isRecurring ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  Fixed Date
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsRecurring(true); setType('recurring_debit'); }}
                  className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${isRecurring ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  Recurring
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sentinel Label</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Netflix Subscription" className="w-full px-6 py-4 rounded-2xl bg-white border dark:border-slate-800 outline-none font-bold text-black shadow-inner" />
              </div>

              {isRecurring ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Day of Month</label>
                      <input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white border dark:border-slate-800 outline-none font-bold text-black" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 font-bold">{symbol}</span>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-8 pr-4 py-4 rounded-2xl bg-white border dark:border-slate-800 outline-none font-bold text-black" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                    <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full px-6 py-4 rounded-2xl bg-white border dark:border-slate-800 outline-none font-bold text-black">
                      {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </>
              ) : type === 'budget_threshold' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Threshold (%)</label>
                    <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white border dark:border-slate-800 outline-none font-bold text-black" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-white border dark:border-slate-800 outline-none font-bold text-black" required />
                </div>
              )}

              <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2">
                <Plus size={20} />
                <span>Deploy Sentinel</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 overflow-hidden min-h-[600px]">
            <div className="px-10 py-8 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 p-2 rounded-xl text-white"><ShieldAlert size={18} /></div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Surveillance Grid</h3>
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {state.reminders.length === 0 ? (
                <div className="p-32 text-center opacity-40">
                  <BellRing size={64} className="mx-auto mb-6" />
                  <p className="font-black uppercase tracking-[0.3em] text-xs">No active sentinels</p>
                </div>
              ) : state.reminders.map((r) => (
                <div key={r.id} className="p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                  <div className="flex items-center space-x-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${r.isRecurring ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                       {r.isRecurring ? <RefreshCw size={24} className="animate-spin-slow" /> : r.type === 'budget_threshold' ? <Target size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{r.title}</h4>
                      <div className="flex items-center space-x-3 mt-1.5">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                          {r.isRecurring ? `Recurring (Day ${r.dayOfMonth})` : r.type === 'budget_threshold' ? `${r.threshold}% Threshold` : `Due: ${r.dueDate}`}
                        </span>
                        {r.amount && <span className="text-[10px] font-black text-slate-400 uppercase">{formatMoney(r.amount)}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${r.triggered ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600'}`}>
                      {r.triggered ? 'Fired / Alerted' : 'Watching'}
                    </div>
                    <button onClick={() => deleteReminder(r.id)} className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderManager;
