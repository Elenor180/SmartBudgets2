
import React, { useState, useRef } from 'react';
import { Wallet, Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Inbox, Upload, FileText, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { User as UserType, FinancialState, Category, Currency } from '../types';
import { simulateEmailDispatch, analyzeBankStatement } from '../services/geminiService';

interface Props {
  onAuthSuccess: (user: UserType, initialData?: Partial<FinancialState>) => void;
  notify: (msg: string, type: any) => void;
}

type Step = 'CREDENTIALS' | 'SMART_SETUP' | 'VERIFY_ANALYSIS';

const Auth: React.FC<Props> = ({ onAuthSuccess, notify }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<Step>('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailContent, setEmailContent] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempUser, setTempUser] = useState<UserType | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLogin) {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);
        
        if (user) {
          onAuthSuccess({ id: user.id, email: user.email, name: user.name });
          notify(`Welcome back, ${user.name}!`, 'success');
        } else {
          notify('Invalid credentials', 'error');
          setIsLoading(false);
        }
      }, 1000);
    } else {
      const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        notify('Account already exists', 'error');
        setIsLoading(false);
        return;
      }
      
      const newUser = { id: Math.random().toString(36).substr(2, 9), email, password, name };
      setTempUser(newUser);
      setIsLoading(false);
      setStep('SMART_SETUP');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    notify("Processing statement with AI...", "info");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const result = await analyzeBankStatement(base64String, file.type);
      
      if (result) {
        setAnalysisResult(result);
        setStep('VERIFY_ANALYSIS');
      } else {
        notify("Analysis failed. Try another clear image.", "error");
      }
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const finalizeRegistration = async (useAnalysis: boolean) => {
    if (!tempUser) return;
    setIsLoading(true);

    // 1. Send welcome email
    const welcomeEmail = await simulateEmailDispatch(tempUser.name, tempUser.email);
    setEmailContent(welcomeEmail || null);

    // 2. Persist user
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    users.push({ ...tempUser, password });
    localStorage.setItem('sb_users', JSON.stringify(users));

    const initialData: Partial<FinancialState> | undefined = useAnalysis && analysisResult ? {
      expenses: analysisResult.expenses.map((e: any) => ({ ...e, id: Math.random().toString(36).substr(2, 9) })),
      budgets: analysisResult.suggestedBudgets,
      monthlyIncome: analysisResult.estimatedMonthlyIncome
    } : undefined;

    notify('Account active! Profile synchronized.', 'success');
    
    setTimeout(() => {
      onAuthSuccess(tempUser, initialData);
    }, 2500);
  };

  if (emailContent && !isLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="w-full max-w-2xl relative z-10 animate-slideUp">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl">
                <Inbox className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Email Dispatched</h2>
                <p className="text-sm text-slate-400 font-medium">A welcome message has been sent to {tempUser?.email}</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <p className="whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-300">{emailContent}</p>
              </div>
            </div>
            <div className="mt-10 flex items-center space-x-3 text-slate-400 animate-pulse">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <p className="text-xs font-black uppercase tracking-widest">Redirecting to workspace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'SMART_SETUP') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="w-full max-w-xl relative z-10 animate-fadeIn text-center">
           <div className="inline-flex items-center justify-center bg-indigo-600 p-4 rounded-3xl shadow-xl shadow-indigo-500/20 mb-8">
            <Zap className="text-white" size={36} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Smart Inception</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Upload a bank statement (PNG/JPG) to let Gemini AI configure your initial workspace categories and budgets automatically.</p>
          
          <div 
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`group bg-white dark:bg-slate-900 p-12 rounded-[3rem] border-4 border-dashed transition-all cursor-pointer ${isLoading ? 'border-indigo-400 animate-pulse' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500'}`}
          >
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Processing Artifacts...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Upload size={40} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white mb-2">Drop Statement Image</p>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">or click to browse local storage</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => finalizeRegistration(false)}
            className="mt-10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 mx-auto"
          >
            <span>Skip and Setup Manually</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'VERIFY_ANALYSIS') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="w-full max-w-2xl relative z-10 animate-slideUp">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-4 mb-10">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg">
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Analysis Verified</h3>
                <p className="text-sm text-slate-400 font-medium">Gemini has extracted the following intelligence.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Income</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${analysisResult.estimatedMonthlyIncome}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logged Records</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{analysisResult.expenses.length} Entries</p>
              </div>
            </div>

            <div className="space-y-4 mb-10 max-h-[200px] overflow-y-auto pr-4 no-scrollbar">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proposed Budgets</p>
              {analysisResult.suggestedBudgets.map((b: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">{b.category}</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">${b.limit}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => finalizeRegistration(true)}
              className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center space-x-3 active:scale-95"
            >
              <span>Initialize Workspace</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse"></div>

      <div className="w-full max-w-lg relative z-10 animate-fadeIn">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 mb-6">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">SmartBudgets AI</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Your premium gateway to financial freedom.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={120} />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-10">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-[1.25rem] text-sm font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-[1.25rem] text-sm font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-xl dark:shadow-none flex items-center justify-center space-x-3 group active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Enter Workspace' : 'Continue'}</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 flex items-center justify-center space-x-4 text-slate-400 dark:text-slate-500">
          <ShieldCheck size={18} />
          <p className="text-xs font-bold uppercase tracking-widest">End-to-End Encrypted Session</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
