
import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Inbox, Upload, FileText, CheckCircle2, Loader2, Zap, Cpu, ChevronLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { User as UserType, FinancialState, Category, Currency } from '../types';
import { simulateEmailDispatch, analyzeBankStatement, simulatePasswordReset } from '../services/geminiService';
import SetupWizard from './SetupWizard';
import Logo from './Logo';

interface Props {
  onAuthSuccess: (user: UserType, initialData?: Partial<FinancialState>) => void;
  notify: (msg: string, type: any) => void;
}

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'SMART_SETUP' | 'MANUAL_SETUP' | 'VERIFY_ANALYSIS' | 'CONFIRMATION';

const Auth: React.FC<Props> = ({ onAuthSuccess, notify }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempUser, setTempUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (view === 'LOGIN') {
      setIsLoading(false);
      setFeedback(null);
    }
  }, [view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
        const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
          onAuthSuccess({ id: user.id, email: user.email, name: user.name });
          notify(`Authentication successful. Welcome back.`, 'success');
        } else {
          notify('Credentials rejected. Check email and security key.', 'error');
          setIsLoading(false);
        }
      } catch (err) {
        notify('Internal system error during authentication.', 'error');
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleRegisterStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setIsLoading(true);
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      notify('Email already registered.', 'error');
      setIsLoading(false);
      return;
    }
    const newUser = { id: Math.random().toString(36).substr(2, 9), email, password, name };
    setTempUser(newUser);
    setIsLoading(false);
    setView('SMART_SETUP');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const resetMsg = await simulatePasswordReset(email);
      setFeedback(resetMsg);
      setView('CONFIRMATION');
      notify('Recovery protocol initiated.', 'info');
    } catch (err) {
      notify('Could not initiate recovery.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    notify(`Neural analysis of ${file.name} in progress...`, "info");
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const result = await analyzeBankStatement(base64String, file.type);
        if (result) {
          setAnalysisResult(result);
          setView('VERIFY_ANALYSIS');
          notify("Data intelligence extracted successfully.", "success");
        } else {
          notify("Intelligence extraction failed.", "error");
        }
      } catch (err) {
        notify("Neural processing error.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const finalizeRegistration = async (initialData?: Partial<FinancialState>) => {
    if (!tempUser) return;
    setIsLoading(true);
    try {
      const welcomeEmail = await simulateEmailDispatch(tempUser.name, tempUser.email);
      setFeedback(welcomeEmail || null);
      const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
      users.push({ ...tempUser });
      localStorage.setItem('sb_users', JSON.stringify(users));
      notify('Smart Profile initialized.', 'success');
      setView('CONFIRMATION');
      setTimeout(() => {
        onAuthSuccess(tempUser, initialData);
      }, 4000);
    } catch (err) {
      notify('Failed to finalize profile.', 'error');
      setIsLoading(false);
    }
  };

  if (view === 'MANUAL_SETUP') {
    return <SetupWizard userName={tempUser?.name || ''} onComplete={(data) => finalizeRegistration(data)} />;
  }

  if (view === 'CONFIRMATION') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-12 border border-indigo-100 dark:border-indigo-900/30 text-center text-slate-900 dark:text-white">
          <div className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-full mb-8">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={48} />
          </div>
          <h2 className="text-3xl font-black mb-4">Sequence Synchronized</h2>
          <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 text-left">
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <p className="whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{feedback}</p>
            </div>
          </div>
          <div className="mt-12 flex items-center justify-center space-x-3 text-indigo-600 animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest">Entering Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'SMART_SETUP') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-xl text-center">
          <Logo size={100} showText={false} className="mb-10 animate-float" />
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Neural Onboarding</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-12 font-medium leading-relaxed max-w-md mx-auto">Skip manual set up by uploading a bank statement. QR Intelligence will automatically build your financial DNA.</p>
          <div onClick={() => !isLoading && fileInputRef.current?.click()} className={`group bg-white dark:bg-slate-900 p-16 rounded-[4rem] border-4 border-dashed transition-all cursor-pointer shadow-sm hover:shadow-xl ${isLoading ? 'border-indigo-400 animate-pulse pointer-events-none' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500'}`}>
            <input type="file" ref={fileInputRef} hidden accept="image/*,.pdf" onChange={handleFileUpload} />
            {isLoading ? <RefreshCw size={56} className="text-indigo-600 animate-spin mx-auto" /> : <Upload size={48} className="text-indigo-600 mx-auto" />}
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-6">Deploy Document</p>
          </div>
          <button onClick={() => setView('MANUAL_SETUP')} className="mt-12 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 mx-auto">
            <span>Manual Initialization</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'VERIFY_ANALYSIS') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-12 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-5 mb-12 text-slate-900 dark:text-white">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl shadow-lg"><ShieldCheck size={32} className="text-emerald-600" /></div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">Intelligence Verified</h3>
              <p className="text-sm text-slate-400">Neural scan results are ready for deployment.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2rem] border dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monthly Yield</p>
              <p className="text-3xl font-black text-indigo-600">${analysisResult?.estimatedMonthlyIncome}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2rem] border dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Records</p>
              <p className="text-3xl font-black text-indigo-600">{analysisResult?.expenses?.length} Events</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => finalizeRegistration(analysisResult)} className="flex-1 bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase hover:bg-indigo-700 transition-all shadow-xl active:scale-95">Accept Profile</button>
            <button onClick={() => setView('SMART_SETUP')} className="px-8 py-6 rounded-[2rem] border-2 dark:border-slate-800 text-slate-400 font-black uppercase text-xs">Rescan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      <div className="w-full max-w-lg relative z-10 animate-fadeIn text-center">
        <Logo size={100} className="mb-8" />
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">Smart Budgets</h1>
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 dark:border-slate-800 text-left mt-8">
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-[1.75rem] mb-12">
            <button onClick={() => setView('LOGIN')} className={`flex-1 py-4 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all ${view === 'LOGIN' || view === 'FORGOT_PASSWORD' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}>Sign In</button>
            <button onClick={() => setView('REGISTER')} className={`flex-1 py-4 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all ${view === 'REGISTER' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}>Register</button>
          </div>
          <form onSubmit={view === 'LOGIN' ? handleLogin : view === 'REGISTER' ? handleRegisterStart : handleForgotPassword} className="space-y-8">
            {view === 'REGISTER' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-black" required />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Protocol</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@quantum-reach.ai" className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-black" required />
            </div>
            {view !== 'FORGOT_PASSWORD' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1 text-slate-900 dark:text-white">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Key</label>
                  {view === 'LOGIN' && <button type="button" onClick={() => setView('FORGOT_PASSWORD')} className="text-[9px] font-black text-indigo-600 hover:underline uppercase">Forgot?</button>}
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-black" required />
              </div>
            )}
            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : (view === 'LOGIN' ? 'Access System' : view === 'REGISTER' ? 'Initiate sequence' : 'Send Recovery')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
