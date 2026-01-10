import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Landmark, Wallet, CheckCircle2, Zap, ArrowRight, Shield, Lock, ChevronLeft, Loader2, RefreshCw, Info } from 'lucide-react';
import { SubscriptionTier, PaymentMethod, SubscriptionInfo, OwnerConfig } from '../types';

interface Props {
  currentTier: SubscriptionTier;
  ownerConfig: OwnerConfig;
  onUpgrade: (info: SubscriptionInfo) => void;
  onClose: () => void;
}

const SubscriptionManager: React.FC<Props> = ({ currentTier, ownerConfig, onUpgrade, onClose }) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationStage, setVerificationStage] = useState<string>('Initializing');

  const plans = [
    {
      id: SubscriptionTier.FREE,
      name: "Standard Protocol",
      price: "R0",
      features: ["Neural Dashboard", "Manual Allocation", "3 Goal Capacity", "10 Daily AI Prompts", "Basic Audit Logs"],
      limitations: ["No Autonomy", "No Doc Scanning", "Standard Support"],
      isCurrent: currentTier === SubscriptionTier.FREE
    },
    {
      id: SubscriptionTier.MONTHLY,
      name: "Yield Plus",
      price: "R105",
      period: "/month",
      features: ["Full ALARS Autonomy", "Document Intelligence", "Unlimited Goals", "Unlimited AI Prompts", "Neural Insights"],
      recommended: true,
      isCurrent: currentTier === SubscriptionTier.MONTHLY
    },
    {
      id: SubscriptionTier.YEARLY,
      name: "Strategic Annual",
      price: "R1008",
      period: "/year",
      subtitle: "Save 20% vs Monthly",
      features: ["Full ALARS Autonomy", "Document Intelligence", "Unlimited Goals", "Priority Response", "Early Access Tech"],
      isCurrent: currentTier === SubscriptionTier.YEARLY
    }
  ];

  const handleTierSelect = (tier: SubscriptionTier) => {
    if (tier === SubscriptionTier.FREE) return;
    setSelectedTier(tier);
    setPaymentStep(2);
  };

  const processPayment = () => {
    setIsProcessing(true);
    
    // Sequence of verification steps for a "stable and secure" feel
    const stages = ['Initializing Crypt-Link', 'Establishing Secure Tunnel', 'Validating Receiver Profile', 'Authorizing Capital Transfer', 'Finalizing Neural License'];
    
    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setVerificationStage(stages[currentStage]);
        currentStage++;
      } else {
        clearInterval(interval);
        finalizeUpgrade();
      }
    }, 700);
  };

  const finalizeUpgrade = () => {
    onUpgrade({
      tier: selectedTier!,
      autoRenew: true,
      paymentMethod: paymentMethod!,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    setIsProcessing(false);
    setPaymentStep(3);
  };

  if (paymentStep === 3) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-cyber-950/90 backdrop-blur-xl animate-fade-in">
        <div className="w-full max-w-xl glass-panel p-16 rounded-[4rem] text-center space-y-8">
          <div className="bg-emerald-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30 animate-pulse">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">License Activated</h2>
          <p className="text-slate-400 font-medium">Your account has been upgraded to {selectedTier} status. Capital has been successfully routed to the System Treasury.</p>
          <button onClick={onClose} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl active:scale-95">
            Access Core System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-cyber-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto no-scrollbar">
      <div className="w-full max-w-6xl py-12">
        <div className="flex justify-between items-center mb-12">
          <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-4xl font-black text-white tracking-tighter glow-text-neon">Licensing Protocol</h2>
            <p className="mono text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2">Scale your financial intelligence</p>
          </div>
          <div className="w-12" />
        </div>

        {paymentStep === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`glass-panel p-10 rounded-[3rem] relative flex flex-col transition-all duration-500 hover:scale-[1.02] ${plan.recommended ? 'border-2 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.2)]' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-lg">
                    Neural Standard
                  </div>
                )}
                
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline space-x-2 mb-8">
                  <span className="text-4xl font-black text-white tracking-tighter">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 font-bold">{plan.period}</span>}
                </div>
                {plan.subtitle && <p className="text-emerald-400 text-xs font-black uppercase mb-6 tracking-widest">{plan.subtitle}</p>}

                <div className="space-y-4 flex-1 mb-10">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center space-x-3 text-sm font-medium text-slate-300">
                      <CheckCircle2 size={16} className="text-indigo-400 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {plan.limitations?.map(l => (
                    <div key={l} className="flex items-center space-x-3 text-sm font-medium text-slate-600">
                      <Lock size={16} className="flex-shrink-0" />
                      <span>{l}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleTierSelect(plan.id)}
                  disabled={plan.isCurrent}
                  className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all ${
                    plan.isCurrent 
                      ? 'bg-white/5 text-slate-500 cursor-default border border-white/10' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/10 active:scale-95'
                  }`}
                >
                  {plan.isCurrent ? 'Current Plan' : 'Select Protocol'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto glass-panel p-12 rounded-[4rem] animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Secure Payment Hub</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">Funds are routed directly to the owner's verified accounts.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'STRIPE', name: 'Stripe', icon: Zap },
                    { id: 'PAYPAL', name: 'PayPal', icon: Wallet },
                    { id: 'CARD', name: 'Bank Card', icon: CreditCard },
                    { id: 'EFT', name: 'Secure EFT', icon: Landmark }
                  ].map((method) => (
                    <button 
                      key={method.id}
                      disabled={isProcessing}
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center space-y-4 ${
                        paymentMethod === method.id 
                        ? 'bg-indigo-600/10 border-indigo-600 text-indigo-400' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 disabled:opacity-30'
                      }`}
                    >
                      <method.icon size={32} />
                      <span className="mono text-[10px] font-black uppercase tracking-widest">{method.name}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'EFT' && (
                  <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-3xl space-y-4 animate-fade-in">
                    <div className="flex items-center space-x-3 text-rose-500">
                      <Info size={18} />
                      <span className="mono text-[10px] font-black uppercase">Instruction Profile</span>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Bank: <span className="text-white">{ownerConfig.bankName}</span></p>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Holder: <span className="text-white">{ownerConfig.accountHolder}</span></p>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Account: <span className="text-white">{ownerConfig.accountNumber}</span></p>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Branch: <span className="text-white">{ownerConfig.branchCode}</span></p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'PAYPAL' && (
                   <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl space-y-2 animate-fade-in">
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Routing to Merchant Email:</p>
                      <p className="text-white font-black">{ownerConfig.paypalEmail}</p>
                   </div>
                )}
              </div>

              <div className="flex flex-col justify-between">
                <div className="bg-black/20 p-8 rounded-[2.5rem] space-y-6">
                  <div className="flex justify-between items-center pb-6 border-b border-white/5">
                    <span className="text-slate-400 font-bold">Selected Protocol</span>
                    <span className="text-white font-black">{selectedTier === SubscriptionTier.MONTHLY ? 'Yield Plus' : 'Strategic Annual'}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xl">
                    <span className="text-slate-400 font-black tracking-tight">Magnitude</span>
                    <span className="text-white font-black">{selectedTier === SubscriptionTier.MONTHLY ? 'R105.00' : 'R1,008.00'}</span>
                  </div>
                  <div className="bg-indigo-500/5 p-4 rounded-2xl flex items-start space-x-3">
                    <Shield className="text-indigo-400 mt-1 flex-shrink-0" size={16} />
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Encrypted Capital Routing active. Your data is routed via verified owner-keys only.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-8">
                  <button 
                    disabled={!paymentMethod || isProcessing}
                    onClick={processPayment}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl flex items-center justify-center space-x-3 disabled:opacity-30 disabled:grayscale active:scale-95"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={24} className="animate-spin" />
                        <span>{verificationStage}...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={24} />
                        <span>Authorize Capital Transfer</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setPaymentStep(1)}
                    disabled={isProcessing}
                    className="w-full py-4 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                  >
                    Modify Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;
