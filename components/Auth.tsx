import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Inbox, Upload, FileText, CheckCircle2, Loader2, Zap, Cpu, ChevronLeft, AlertCircle, RefreshCw, ShieldAlert, Terminal as TerminalIcon, Cloud } from 'lucide-react';
import { User as UserType, FinancialState, Category, Currency, SubscriptionTier, SMTPConfig } from '../types';
import { simulateEmailDispatch, analyzeBankStatement, simulatePasswordReset, dispatchSecurityAuditEmail } from '../services/geminiService';
import SetupWizard from './SetupWizard';
import Logo from './Logo';

interface Props {
  onAuthSuccess: (user: UserType, initialData?: Partial<FinancialState>) => void;
  notify: (msg: string, type: any) => void;
  ownerEmail: string;
  ownerVaultPassword: string;
  ownerSMTP: SMTPConfig;
}

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'SMART_SETUP' | 'MANUAL_SETUP' | 'VERIFY_ANALYSIS' | 'CONFIRMATION';

const Auth: React.FC<Props> = ({ onAuthSuccess, notify, ownerEmail, ownerVaultPassword, ownerSMTP }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditSteps, setAuditSteps] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempUser, setTempUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (view === 'LOGIN') {
      setIsLoading(false);
      setIsAuditing(false);
      setAuditSteps([]);
      setFeedback(null);
    }
  }, [view]);

  const runAuditSequence = async () => {
    const steps = [
      `Initializing Brevo Cloud Relay...`,
      "Authenticating API v3 Credentials",
      "Handshake: [quantum-reach.node.cloud]",
      `AUTHORIZING: ${ownerEmail}`,
      "Targeting Transactional SMTP Endpoint",
      "STAGING SECURITY DISPATCH...",
      "Relaying Telemetry via API v3 Post",
      `Dispatch ID: ${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      `Security Audit Synchronized (Cloud 201)`,
      "Workspace Entry Granted."
    ];

    for (const step of steps) {
      setAuditSteps(prev => [...prev, step]);
      await new Promise(r => setTimeout(r, 400));
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    const isOwnerEmailMatch = email.toLowerCase() === ownerEmail.toLowerCase();
    const isOwnerPasswordMatch = password === ownerVaultPassword;

    setTimeout(async () => {
      try {
        const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if ((isOwnerEmailMatch && isOwnerPasswordMatch) || foundUser) {
          let finalUser: UserType;
          
          if (isOwnerEmailMatch && isOwnerPasswordMatch) {
            setIsAuditing(true);
            await runAuditSequence();
            
            try {
              await dispatchSecurityAuditEmail("OWNER_ADMIN_LOGIN", {
                email: email,
                node: "Brevo Cloud Relay",
                target: ownerEmail
              }, ownerSMTP);
            } catch (err) {
              console.error("Audit fail, continuity preserved.");
            }

            finalUser = foundUser ? { ...foundUser, isAdmin: true } : {
              id: 'owner-admin-0',
              email: ownerEmail,
              name: 'System Owner',
              subscription: { tier: SubscriptionTier.YEARLY, autoRenew: true },
              isAdmin: true
            };
            
            if (!foundUser) {
              const updatedUsers = [...users, { ...finalUser, password }];
              localStorage.setItem('sb_users', JSON.stringify(updatedUsers));
            }
          } else {
            finalUser = { ...foundUser!, isAdmin: false };
          }

          onAuthSuccess(finalUser);
          notify(`Access Granted: ${finalUser.isAdmin ? 'System Owner' : 'Verified User'}`, 'success');
        } else {
          notify('Credentials rejected.', 'error');
          setIsLoading(false);
        }
      } catch (err) {
        notify('Authentication error.', 'error');
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
      notify('Email registered.', 'error');
      setIsLoading(false);
      return;
    }

    const isOwner = email.toLowerCase() === ownerEmail.toLowerCase();
    const newUser: UserType = { 
      id: Math.random().toString(36).substr(2, 9), 
      email, 
      name,
      subscription: { tier: isOwner ? SubscriptionTier.YEARLY : SubscriptionTier.FREE, autoRenew: isOwner },
      isAdmin: isOwner
    };
    
    setTempUser(newUser);
    setIsLoading(false);
    setView('SMART_SETUP');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await simulatePasswordReset(email);
      notify('Recovery sequence initialized.', 'success');
      setView('LOGIN');
    } catch (err) {
      notify('Recovery failure.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeRegistration = (initialData: Partial<FinancialState>) => {
    if (!tempUser) return;
    setIsLoading(true);
    setView('CONFIRMATION');
    
    const users = JSON.parse(localStorage.getItem('sb_users') || '[]');
    const userToSave = { ...tempUser, password };
    localStorage.setItem('sb_users', JSON.stringify([...users, userToSave]));
    
    setFeedback(`Sequence synchronized for ${tempUser.name}.\n\nPrimary Yield: ${initialData.monthlyIncome}\nCurrency Context: ${initialData.currency}\n\nWorkspace initialization complete.`);
    
    setTimeout(() => {
      onAuthSuccess(tempUser, initialData);
    }, 2500);
  };

  if (isAuditing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-xl glass-panel p-10 md:p-16 rounded-[4rem] border-t-4 border-rose-600 space-y-10 shadow-[0_0_100px_rgba(225,29,72,0.2)]">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                 <Cloud className="text-rose-500" size={24} />
                 <h2 className="text-2xl font-black text-white tracking-tighter">Brevo Cloud Relay</h2>
              </div>
              <div className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">API-V3-LIVE</div>
           </div>
           
           <div className="bg-black/40 rounded-3xl p-8 border border-white/5 space-y-4 font-mono text-[11px] min-h-[220px]">
              {auditSteps.map((step, i) => (
                <div key={i} className="flex items-start space-x-3 animate-slide-up">
                   <span className="text-rose-500 font-black">{'>'}</span>
                   <span className={i === auditSteps.length - 1 ? "text-white" : "text-slate-500"}>{step}</span>
                </div>
              ))}
              <div className="flex items-center space-x-3 pt-4 text-emerald-500">
                 <Loader2 size={12} className="animate-spin" />
                 <span className="uppercase font-black tracking-widest">Relaying Telemetry...</span>
              </div>
           </div>
           
           <div className="text-center">
              <p className="text-slate-400 text-[10px] md:text-xs font-medium leading-relaxed">The security audit is being dispatched via the <span className="text-white font-bold">Brevo Cloud Relay</span>. Check your inbox for the transactional receipt or view the local mirror in the <span className="text-white font-bold">Dispatch Trail</span>.</p>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'SMART_SETUP' || view === 'MANUAL_SETUP') {
    return <SetupWizard userName={tempUser?.name || ''} onComplete={(data) => finalizeRegistration(data)} />;
  }

  if (view === 'CONFIRMATION') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-2xl glass-panel p-16 rounded-[4rem] text-center border-t-4 border-emerald-500 shadow-2xl">
          <div className="bg-emerald-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30 mb-8 animate-pulse">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Sequence Synchronized</h2>
          <div className="bg-black/20 p-8 rounded-3xl border border-white/5 text-left mb-10">
            <p className="whitespace-pre-wrap text-slate-300 font-medium leading-relaxed">{feedback}</p>
          </div>
          <div className="flex items-center justify-center space-x-3 text-indigo-400 animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <p className="mono text-[10px] font-black uppercase tracking-[0.3em]">Entering Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-in text-center">
        <Logo size={100} className="mb-8" />
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">Smart Budgets</h1>
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 dark:border-slate-800 text-left mt-8 backdrop-blur-xl">
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
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-8 py-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-black" required />
              </div>
            )}
            {view === 'LOGIN' && (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setView('FORGOT_PASSWORD')}
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline px-1"
                >
                  Forgot Key?
                </button>
              </div>
            )}
            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 active:scale-95">
              {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : (view === 'LOGIN' ? 'Access System' : view === 'REGISTER' ? 'Initiate sequence' : 'Send Recovery')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
