import React, { useState, useEffect, useRef } from 'react';
import { FinancialState, NotificationType, Category, Goal, Reminder, ReminderType, IncomeSource, SubscriptionTier, User as UserType } from '../types';
import { getALARSResponse } from '../services/geminiService';
import { Send, User, Loader2, Zap, Cpu, Terminal, Activity, MessageSquare, Trash2, DollarSign, Lock, ShieldAlert } from 'lucide-react';

interface Props {
  state: FinancialState;
  user: UserType;
  notify: (message: string, type?: NotificationType) => void;
  updateBudget: (cat: Category, limit: number) => void;
  updateIncome: (amount: number) => void;
  addIncomeSource: (source: IncomeSource) => void;
  deleteIncomeSource: (id: string) => void;
  addGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  incrementPromptUsage: () => void;
  onUpgradeClick: () => void;
}

interface Message {
  role: 'user' | 'alars';
  content: string;
  operations?: string[];
}

const ALARSAdvisor: React.FC<Props> = ({ state, user, notify, updateBudget, updateIncome, addIncomeSource, deleteIncomeSource, addGoal, deleteGoal, addReminder, deleteReminder, incrementPromptUsage, onUpgradeClick }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'alars', content: "ALARS Intelligence Unit Online. Logical parameters initialized. I am ready to autonomously manage your workspace objectives. How shall we optimize your trajectory today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isFree = user.subscription.tier === SubscriptionTier.FREE;
  const promptLimit = 10;
  const remainingPrompts = promptLimit - state.alarsDailyPromptsUsed;
  const isLocked = isFree && state.alarsDailyPromptsUsed >= promptLimit;

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
    if (isLocked) { notify("Prompt buffer exhausted.", "warning"); onUpgradeClick(); return; }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    historyRef.current.push({ role: 'user', parts: [{ text: userMsg }] });
    setIsLoading(true);

    try {
      const response = await getALARSResponse(state, historyRef.current);
      let content = response.text || "";
      const ops: string[] = [];
      incrementPromptUsage();

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          if (fc.name === "update_monthly_income") {
            const amount = Number(args.amount);
            ops.push(`CMD: Sync Yield -> ${amount}`);
            if (state.alarsAutonomy) updateIncome(amount);
          } else if (fc.name === "add_income_source") {
            const amount = Number(args.amount);
            ops.push(`CMD: Add Stream [${args.name}] -> ${amount}`);
            if (state.alarsAutonomy) addIncomeSource({ id: Math.random().toString(36).substr(2, 9), name: args.name, amount });
          } else if (fc.name === "delete_income_source") {
            const src = state.incomeSources.find(s => s.name.toLowerCase() === args.name.toLowerCase());
            if (src) { ops.push(`CMD: Remove Stream [${args.name}]`); if (state.alarsAutonomy) deleteIncomeSource(src.id); }
          } else if (fc.name === "update_budget_limit") {
            const limit = Number(args.limit);
            ops.push(`CMD: Adjust ${args.category} -> ${limit}`);
            if (state.alarsAutonomy) updateBudget(args.category as Category, limit);
          } else if (fc.name === "create_financial_goal") {
            const amt = Number(args.targetAmount);
            ops.push(`CMD: Goal [${args.name}] -> ${amt}`);
            if (state.alarsAutonomy) addGoal({ id: Math.random().toString(36).substr(2, 9), name: args.name, targetAmount: amt, currentAmount: 0, category: (args.category as Category) || Category.SAVINGS, createdAt: new Date().toISOString() });
          }
        }
      }
      historyRef.current.push({ role: 'model', parts: [{ text: content || "Logic synchronized." }] });
      setMessages(prev => [...prev, { role: 'alars', content: content || "Parameters updated.", operations: ops }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'alars', content: "CRITICAL: Sync lost." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-fade-in max-w-5xl mx-auto flex flex-col h-full overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="bg-slate-900 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-xl ring-2 ring-indigo-500/20">
             <Zap className="text-indigo-400" size={24} md:size={32} />
          </div>
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">ALARS Core</h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${state.alarsAutonomy ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                {user.subscription.tier} | {state.alarsAutonomy ? 'AUTONOMOUS' : 'PASSIVE'}
              </p>
            </div>
          </div>
        </div>

        {isFree && (
          <div className="glass-panel px-4 md:px-6 py-2 md:py-4 rounded-xl md:rounded-3xl flex items-center space-x-4">
            <div className="space-y-1">
               <p className="mono text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Neural Quota</p>
               <div className="h-1 w-24 md:w-32 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full bg-indigo-500`} style={{ width: `${(state.alarsDailyPromptsUsed / promptLimit) * 100}%` }} />
               </div>
            </div>
            <div className="text-right">
               <p className="text-xs font-black text-white">{remainingPrompts} Q</p>
            </div>
          </div>
        )}
      </header>

      {/* Dynamic height chat container */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl md:rounded-[3rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden relative flex-1 min-h-[400px] mb-6 ${isLocked ? 'grayscale' : ''}`}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-10 bg-slate-50/20 dark:bg-slate-950/20 relative z-10 no-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 ml-3 md:ml-5' : 'bg-slate-900 dark:bg-slate-800 mr-3 md:mr-5'}`}>
                  {msg.role === 'user' ? <User size={16} md:size={22} className="text-white" /> : <Cpu size={16} md:size={22} className="text-indigo-400" />}
                </div>
                <div className={`p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] text-sm md:text-[15px] font-medium leading-relaxed border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.operations && msg.operations.length > 0 && (
                    <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t border-slate-100 dark:border-slate-700 space-y-2">
                      {msg.operations.map((op, i) => (
                        <div key={i} className="flex items-center space-x-2 text-[10px] md:text-xs font-mono py-2 px-3 bg-slate-50 dark:bg-slate-950 rounded-xl border dark:border-slate-800">
                          <Activity size={12} className="text-emerald-500" />
                          <span className="text-indigo-600 dark:text-indigo-400 truncate">{op}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && <div className="flex items-center justify-center space-x-2 py-4"><Loader2 className="animate-spin text-indigo-600" size={20} /><span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Processing...</span></div>}
        </div>

        <div className="p-4 md:p-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t-2 border-slate-100 dark:border-slate-800 relative z-10">
          {isLocked ? (
             <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-4">Neural buffer exhausted for Standard Protocol.</p>
                <button onClick={onUpgradeClick} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px]">Upgrade Bandwidth</button>
             </div>
          ) : (
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Directive..." 
                className="flex-1 pl-6 pr-4 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] bg-white border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-600 outline-none font-bold text-black text-sm md:text-base" 
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="bg-slate-900 dark:bg-indigo-600 text-white p-4 md:px-8 md:py-6 rounded-2xl md:rounded-[2.5rem] hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
                <Send size={20} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ALARSAdvisor;
