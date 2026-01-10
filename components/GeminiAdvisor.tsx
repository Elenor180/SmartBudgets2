
import React, { useState, useEffect, useRef } from 'react';
import { FinancialState, NotificationType } from '../types';
import { getFinancialAdvice, getFinancialHealthReport } from '../services/geminiService';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Zap, ShieldCheck, Cpu } from 'lucide-react';

interface Props {
  state: FinancialState;
  notify: (message: string, type?: NotificationType) => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const GeminiAdvisor: React.FC<Props> = ({ state, notify }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi, I am here to help you make smart financial decisions. I am the Quantum Reach Intelligence engine for Smart Budgets, ready to optimize your wealth trajectory. What would you like to explore today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthReport, setHealthReport] = useState<string | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const generateHealthReport = async () => {
    setIsHealthLoading(true);
    try {
      const report = await getFinancialHealthReport(state);
      setHealthReport(report || "Intelligence generation failed.");
      notify('Strategic report generated', 'success');
    } catch (e) {
      notify('Health extraction failed', 'error');
    } finally {
      setIsHealthLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const advice = await getFinancialAdvice(state, userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: advice }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "System connection interrupted. Re-syncing..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg">
               <Cpu className="text-white" size={24} />
            </div>
            <span>Smart Coach</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Neural wealth optimization by Quantum Reach.</p>
        </div>
        <button 
          onClick={generateHealthReport}
          disabled={isHealthLoading}
          className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-sm hover:opacity-90 transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
        >
          {isHealthLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
          <span className="uppercase tracking-widest">Neural Health Report</span>
        </button>
      </header>

      {healthReport && (
        <div className="bg-gradient-to-br from-indigo-700 to-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl animate-slideUp relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheck size={24} className="text-emerald-400" />
              <h3 className="text-2xl font-black uppercase tracking-widest text-indigo-100">Neural Intelligence Feed</h3>
            </div>
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed opacity-90">{healthReport}</p>
            </div>
            <button onClick={() => setHealthReport(null)} className="mt-8 text-xs font-black uppercase tracking-widest bg-white/10 px-6 py-3 rounded-2xl">Dismiss Analysis</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 h-[650px] flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/30 dark:bg-slate-950/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 ml-5' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 mr-5'}`}>
                  {msg.role === 'user' ? <User size={20} className="text-white" /> : <Cpu size={20} className="text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className={`p-6 rounded-[2rem] text-[15px] font-medium leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border dark:border-slate-700 rounded-tl-none'}`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && <Loader2 className="animate-spin text-indigo-600 mx-auto" />}
        </div>

        <div className="p-10 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
          {/* Use onSubmit instead of the non-existent handleSend prop */}
          <form onSubmit={handleSend} className="relative">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Engage smart coach..." className="w-full pl-8 pr-20 py-6 rounded-[2rem] bg-white border-2 border-transparent focus:border-indigo-600 outline-none transition-all font-semibold text-black" />
            <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 dark:bg-indigo-600 text-white p-4 rounded-3xl hover:opacity-90 disabled:opacity-30 shadow-xl active:scale-90"><Send size={20} /></button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeminiAdvisor;
