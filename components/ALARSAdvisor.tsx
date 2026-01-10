
import React, { useState, useEffect, useRef } from 'react';
import { FinancialState, NotificationType, Category, Goal, Reminder, ReminderType, IncomeSource } from '../types';
import { getALARSResponse } from '../services/geminiService';
import { Send, User, Loader2, Zap, Cpu, Terminal, Activity, MessageSquare, Trash2, DollarSign } from 'lucide-react';

interface Props {
  state: FinancialState;
  notify: (message: string, type?: NotificationType) => void;
  updateBudget: (cat: Category, limit: number) => void;
  updateIncome: (amount: number) => void;
  addIncomeSource: (source: IncomeSource) => void;
  deleteIncomeSource: (id: string) => void;
  addGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
}

interface Message {
  role: 'user' | 'alars';
  content: string;
  operations?: string[];
}

const ALARSAdvisor: React.FC<Props> = ({ state, notify, updateBudget, updateIncome, addIncomeSource, deleteIncomeSource, addGoal, deleteGoal, addReminder, deleteReminder }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'alars', content: "ALARS Intelligence Unit Online. Logical parameters initialized. I am ready to autonomously manage your workspace objectives. How shall we optimize your trajectory today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const historyRef = useRef<{ role: string; parts: { text: string }[] }[]>([
    { role: 'model', parts: [{ text: "ALARS Intelligence Unit Online. Logical parameters initialized. I am ready to autonomously manage your workspace objectives. How shall we optimize your trajectory today?" }] }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    historyRef.current.push({ role: 'user', parts: [{ text: userMsg }] });
    setIsLoading(true);

    try {
      const response = await getALARSResponse(state, historyRef.current);
      let content = response.text || "";
      const ops: string[] = [];

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          
          if (fc.name === "update_monthly_income") {
            const amount = Number(args.amount);
            ops.push(`CMD: Synchronize Total Yield -> ${amount}`);
            if (state.alarsAutonomy) {
              updateIncome(amount);
            }
          } else if (fc.name === "add_income_source") {
            const amount = Number(args.amount);
            ops.push(`CMD: Deploy Yield Stream [${args.name}] -> ${amount}`);
            if (state.alarsAutonomy) {
              addIncomeSource({
                id: Math.random().toString(36).substr(2, 9),
                name: args.name,
                amount
              });
            }
          } else if (fc.name === "delete_income_source") {
            const sourceToDelete = state.incomeSources.find(s => s.name.toLowerCase() === args.name.toLowerCase());
            if (sourceToDelete) {
              ops.push(`CMD: Neutralize Yield Stream [${args.name}]`);
              if (state.alarsAutonomy) deleteIncomeSource(sourceToDelete.id);
            } else {
              ops.push(`ERR: Stream [${args.name}] not found.`);
            }
          } else if (fc.name === "update_budget_limit") {
            const limit = Number(args.limit);
            ops.push(`CMD: Adjust ${args.category} -> ${limit}`);
            if (state.alarsAutonomy) updateBudget(args.category as Category, limit);
          } else if (fc.name === "create_financial_goal") {
            const amt = Number(args.targetAmount);
            ops.push(`CMD: Create Objective [${args.name}] Value: ${amt}`);
            if (state.alarsAutonomy) {
              addGoal({
                id: Math.random().toString(36).substr(2, 9),
                name: args.name,
                targetAmount: amt,
                currentAmount: 0,
                category: (args.category as Category) || Category.SAVINGS,
                createdAt: new Date().toISOString()
              });
            }
          } else if (fc.name === "delete_financial_goal") {
            const goalToDelete = state.goals.find(g => g.name.toLowerCase() === args.name.toLowerCase());
            if (goalToDelete) {
              ops.push(`CMD: Neutralize Objective [${args.name}]`);
              if (state.alarsAutonomy) deleteGoal(goalToDelete.id);
            } else {
              ops.push(`ERR: Objective [${args.name}] not found.`);
            }
          } else if (fc.name === "schedule_sentinel_reminder") {
            ops.push(`CMD: Deploy Sentinel [${args.title}]`);
            if (state.alarsAutonomy) {
              addReminder({
                id: Math.random().toString(36).substr(2, 9),
                type: args.type as ReminderType,
                title: args.title,
                category: args.category as Category,
                threshold: args.threshold ? Number(args.threshold) : undefined,
                dueDate: args.dueDate,
                isRecurring: args.isRecurring || args.type === 'recurring_debit',
                dayOfMonth: args.dayOfMonth ? Number(args.dayOfMonth) : undefined,
                amount: args.amount ? Number(args.amount) : undefined,
                triggered: false,
                createdAt: new Date().toISOString()
              });
            }
          } else if (fc.name === "delete_sentinel_reminder") {
            const reminderToDelete = state.reminders.find(r => r.title.toLowerCase() === args.title.toLowerCase());
            if (reminderToDelete) {
              ops.push(`CMD: Neutralize Sentinel [${args.title}]`);
              if (state.alarsAutonomy) deleteReminder(reminderToDelete.id);
            } else {
              ops.push(`ERR: Sentinel [${args.title}] not found.`);
            }
          }
        }
        
        if (!state.alarsAutonomy) {
          content += "\n\n**PROTOCOL HOLD**: Autonomy disabled. Enable 'ALARS Autonomy' to allow automated execution.";
        }
      }

      if (!content && ops.length > 0) content = "System parameters updated according to logic directives.";
      else if (!content) content = "Neural path clear. Awaiting next command.";

      historyRef.current.push({ role: 'model', parts: [{ text: content }] });
      setMessages(prev => [...prev, { role: 'alars', content, operations: ops }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'alars', content: "CRITICAL: Neural sync lost. Resetting logic buffer..." }]);
      historyRef.current = [{ role: 'model', parts: [{ text: "Re-synced. Directive?" }] }];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-xl ring-2 ring-indigo-500/20">
             <Zap className="text-indigo-400" size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">ALARS Core</h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${state.alarsAutonomy ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Autonomy: {state.alarsAutonomy ? 'ENABLED' : 'READY'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 h-[750px] flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
          <div className="grid grid-cols-8 gap-10 rotate-12 scale-150">
            {Array.from({ length: 40 }).map((_, i) => (<Cpu key={i} size={100} className="text-slate-900" />))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/20 dark:bg-slate-950/20 relative z-10 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${msg.role === 'user' ? 'bg-indigo-600 ml-5' : 'bg-slate-900 dark:bg-slate-800 mr-5'}`}>
                  {msg.role === 'user' ? <User size={22} className="text-white" /> : <Cpu size={22} className="text-indigo-400" />}
                </div>
                <div className={`p-8 rounded-[2.5rem] text-[15px] font-medium leading-relaxed shadow-xl border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.operations && msg.operations.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-100/50 dark:border-slate-700/50">
                      <div className="flex items-center space-x-2 mb-4">
                         <Terminal size={14} className="text-indigo-400" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logic Stream</span>
                      </div>
                      <div className="space-y-3">
                        {msg.operations.map((op, i) => (
                          <div key={i} className="flex items-center space-x-3 text-xs font-bold font-mono py-3 px-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                            {op.includes('Yield') ? <DollarSign size={14} className="text-indigo-500" /> : op.startsWith('CMD') ? <Activity size={14} className="text-emerald-500" /> : <Trash2 size={14} className="text-rose-500" />}
                            <span className="text-indigo-600 dark:text-indigo-400">{op}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-4 space-x-4 animate-pulse">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600">Syncing Intelligence...</span>
            </div>
          )}
        </div>

        <div className="p-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t-2 border-slate-100 dark:border-slate-800 relative z-10">
          <form onSubmit={handleSend} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Inject directive (e.g., 'Add side hustle income of 200' or 'cancel my car goal')" 
              className="relative w-full pl-10 pr-28 py-7 rounded-[2.5rem] bg-white border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-600 outline-none transition-all font-bold text-black placeholder:text-slate-400 shadow-xl" 
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-5 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-indigo-600 text-white px-10 py-5 rounded-[1.75rem] font-black uppercase tracking-widest text-xs hover:scale-105 disabled:opacity-30 shadow-2xl active:scale-95 transition-all flex items-center space-x-2">
              <Send size={18} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ALARSAdvisor;
