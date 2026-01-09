
import React, { useState, useMemo } from 'react';
import { FinancialState, Category, Reminder, ReminderType } from '../types';
import { Bell, BellRing, Clock, ShieldAlert, Plus, Trash2, Calendar, Target, CheckCircle2, AlertTriangle } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.random().toString(36).substr(2, 9);
    
    const newReminder: Reminder = {
      id,
      type,
      title: title || (type === 'budget_threshold' ? `${category} Ceiling Alert` : 'Upcoming Outflow'),
      category: type === 'budget_threshold' ? category : undefined,
      threshold: type === 'budget_threshold' ? Number(threshold) : undefined,
      dueDate: type === 'upcoming_expense' ? dueDate : undefined,
      triggered: false,
      createdAt: new Date().toISOString()
    };

    addReminder(newReminder);
    setTitle('');
    setDueDate('');
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      <header>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Sentinel System</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Configure proactive alerts for budget thresholds and scheduled capital outflows.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 sticky top-12">
            <div className="flex items-center space-x-3 mb-8">
               <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Bell className="text-white" size={22} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Sentinel</h3>
            </div>

            <div className="space-y-6">
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-6">
                <button 
                  type="button"
                  onClick={() => setType('budget_threshold')}
                  className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'budget_threshold' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  Budget %
                </button>
                <button 
                  type="button"
                  onClick={() => setType('upcoming_expense')}
                  className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${type === 'upcoming_expense' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  Fixed Date
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sentinel Label</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'budget_threshold' ? 'e.g. Grocery Alert' : 'e.g. Rent Due'}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                />
              </div>

              {type === 'budget_threshold' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Track Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none font-bold text-slate-700 dark:text-slate-200"
                    >
                      {Object.values(Category).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation % Threshold</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none font-bold text-slate-700 dark:text-slate-200"
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none font-bold text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl dark:shadow-none flex items-center justify-center space-x-3 group active:scale-95"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                <span>Deploy Sentinel</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100/50 dark:border-slate-800/50 overflow-hidden min-h-[500px]">
            <div className="px-10 py-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-900 dark:bg-slate-800 p-2 rounded-xl text-white">
                   <ShieldAlert size={18} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Active Sentinels</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Surveillance Active</span>
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {state.reminders.length === 0 ? (
                <div className="p-24 text-center">
                  <div className="bg-slate-50 dark:bg-slate-950 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BellRing size={40} className="text-slate-200 dark:text-slate-800" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active sentinels in orbit</p>
                </div>
              ) : state.reminders.map((r) => (
                <div key={r.id} className="p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group relative">
                  <div className="flex items-center space-x-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ring-4 ring-slate-50 dark:ring-slate-800/50 ${r.triggered ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500'}`}>
                       {r.type === 'budget_threshold' ? <Target size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{r.title}</h4>
                      <div className="flex items-center space-x-3 mt-1.5">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                          {r.type === 'budget_threshold' ? `Threshold: ${r.threshold}%` : `Due: ${new Date(r.dueDate!).toLocaleDateString()}`}
                        </span>
                        {r.triggered && (
                          <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                             <AlertTriangle size={12} />
                             <span className="text-[10px] font-black uppercase">Fired</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                    <div className="hidden sm:block">
                       <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                         r.triggered ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                       }`}>
                         {r.triggered ? 'Threshold Breached' : 'Watching'}
                       </div>
                    </div>
                    <button 
                      onClick={() => deleteReminder(r.id)}
                      className="p-3 text-slate-300 dark:text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all"
                    >
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
