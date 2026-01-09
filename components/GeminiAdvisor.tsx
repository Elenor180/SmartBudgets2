
import React, { useState, useEffect, useRef } from 'react';
import { FinancialState, NotificationType } from '../types';
import { getFinancialAdvice, getFinancialHealthReport } from '../services/geminiService';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Zap, ShieldCheck } from 'lucide-react';

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
    { role: 'ai', content: "Welcome to your premium financial workspace. I'm Gemini, your dedicated AI advisor. I've analyzed your current spending patterns and I'm ready to help you optimize your wealth. What would you like to explore today?" }
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
      setHealthReport(report || "No report generated.");
      notify('Premium Health Intelligence Generated', 'success');
    } catch (e) {
      notify('Failed to generate intelligence report', 'error');
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
      setMessages(prev => [...prev, { role: 'ai', content: "My connection to the financial network was interrupted. Please try again shortly." }]);
      notify('Network latency detected', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-100">
               <Sparkles className="text-white" size={24} />
            </div>
            <span>AI Advisor</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Neural-powered financial strategy and insights.</p>
        </div>
        <button 
          onClick={generateHealthReport}
          disabled={isHealthLoading}
          className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-sm hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center space-x-3 group active:scale-95"
        >
          {isHealthLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="group-hover:text-amber-400 transition-colors" />}
          <span className="uppercase tracking-widest">Generate Insight Report</span>
        </button>
      </header>

      {healthReport && (
        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-200 animate-slideUp relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white/20 p-2 rounded-xl">
                 <ShieldCheck size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase tracking-widest text-indigo-100">Intelligence Analysis</h3>
            </div>
            <div className="prose prose-invert prose-lg max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed opacity-90">{healthReport}</p>
            </div>
            <button 
              onClick={() => setHealthReport(null)}
              className="mt-8 text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl transition-colors border border-white/10"
            >
              Close Intelligence Feed
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100/50 h-[700px] flex flex-col overflow-hidden group">
        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50/30"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 ml-5' : 'bg-white border border-slate-100 mr-5'}`}>
                  {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-indigo-600" />}
                </div>
                <div className={`p-6 rounded-[2rem] text-[15px] font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] flex-row items-center">
                <div className="w-12 h-12 rounded-[1.25rem] bg-white border border-slate-100 mr-5 flex items-center justify-center shadow-md">
                  <Loader2 size={20} className="text-indigo-400 animate-spin" />
                </div>
                <div className="flex space-x-2.5 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-10 bg-white border-t border-slate-50">
          <form onSubmit={handleSend} className="relative group/form">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the advisor... (e.g., 'Optimize my entertainment budget')"
              className="w-full pl-8 pr-20 py-6 rounded-[2rem] bg-slate-100/50 border-2 border-transparent focus:border-indigo-600 focus:bg-white outline-none transition-all font-semibold text-slate-700 shadow-inner"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-4 rounded-3xl hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-indigo-200 active:scale-90"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {["Wealth Strategy", "Budget Audit", "Emergency Savings"].map(suggest => (
              <button 
                key={suggest}
                onClick={() => setInput(`Give me a ${suggest.toLowerCase()} based on my data.`)}
                className="whitespace-nowrap px-5 py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiAdvisor;
