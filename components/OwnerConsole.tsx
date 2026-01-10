import React, { useState, useEffect } from 'react';
import { ShieldAlert, Landmark, Zap, Mail, Save, ChevronLeft, ShieldCheck, Database, RefreshCw, Key, Eye, EyeOff, Settings, Inbox, Cloud, Wifi, Send, List, Layout, Terminal, Lock } from 'lucide-react';
import { OwnerConfig } from '../types';
import { dispatchSecurityAuditEmail, dispatchEmailCampaign, AuditLogEntry } from '../services/geminiService';

interface Props {
  config: OwnerConfig;
  onSave: (config: OwnerConfig) => void;
  onClose: () => void;
}

const OwnerConsole: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [formData, setFormData] = useState<OwnerConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [masterKey, setMasterKey] = useState('');
  const [showSensitive, setShowSensitive] = useState(false);
  const [unlockError, setUnlockError] = useState(false);
  const [activeTab, setActiveTab] = useState<'treasury' | 'security' | 'audit'>('treasury');
  const [auditTrail, setAuditTrail] = useState<AuditLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Campaign Form State (Translated from Python Logic)
  const [campaignName, setCampaignName] = useState('System Broadcast via API');
  const [campaignSubject, setCampaignSubject] = useState('Important System Update');
  const [campaignHtml, setCampaignHtml] = useState('Congratulations! You successfully received this broadcast.');
  const [listIds, setListIds] = useState('1');
  const [isDispatching, setIsDispatching] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sb_security_audit_trail') || '[]');
    setAuditTrail(saved);
    if (saved.length > 0 && !selectedLog) {
      setSelectedLog(saved[0]);
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKey === config.vaultPassword) {
      setIsLocked(false);
      setUnlockError(false);
      
      const receipt = await dispatchSecurityAuditEmail("VAULT_DECRYPTED", { 
        status: "AUTHORIZED",
        relay: "BREVO_API_V3"
      }, config.smtpConfig);
      setAuditTrail(prev => [receipt, ...prev]);
      setSelectedLog(receipt);
    } else {
      setUnlockError(true);
      setMasterKey('');
      await dispatchSecurityAuditEmail("VAULT_DECRYPT_FAILURE", { 
        status: "UNAUTHORIZED_ATTEMPT"
      }, config.smtpConfig);
      setTimeout(() => setUnlockError(false), 2000);
    }
  };

  const handleCampaignDispatch = async () => {
    setIsDispatching(true);
    try {
      const ids = listIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const response = await dispatchEmailCampaign({
        name: campaignName,
        subject: campaignSubject,
        senderName: "Smart Budgets Admin",
        senderEmail: config.ownerEmail,
        htmlContent: campaignHtml,
        listIds: ids
      });

      await dispatchSecurityAuditEmail("EMAIL_CAMPAIGN_SENT", {
        campaignId: response.id,
        name: campaignName,
        targetLists: ids
      }, config.smtpConfig);

      alert(`Campaign Staged Successfully. ID: ${response.id}`);
    } catch (err) {
      alert(`Dispatch Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await dispatchSecurityAuditEmail("VAULT_CONFIG_UPDATED", {
        timestamp: new Date().toISOString(),
        node: "BREVO_SECURE_API"
      }, formData.smtpConfig);
      onSave({ ...formData, lastUpdated: new Date().toISOString() });
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
    }
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fade-in">
        <div className="w-full max-w-lg glass-panel p-10 md:p-16 rounded-[3rem] md:rounded-[4rem] border-t-4 border-rose-600 text-center space-y-10 shadow-[0_0_100px_rgba(225,29,72,0.2)]">
           <div className="bg-rose-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500/30 animate-pulse">
              <Lock size={40} className="text-rose-500" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white tracking-tighter">Treasury Vault Locked</h2>
              <p className="mono text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Authorization Required</p>
           </div>
           <form onSubmit={handleUnlock} className="space-y-6">
              <div className="relative group">
                 <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-rose-500 transition-colors" size={20} />
                 <input 
                   type="password"
                   value={masterKey}
                   onChange={e => setMasterKey(e.target.value)}
                   className={`w-full pl-16 pr-6 py-5 rounded-[2rem] bg-black/60 border-2 transition-all outline-none font-black text-white tracking-[0.5em] text-center placeholder:tracking-normal placeholder:text-slate-800 ${unlockError ? 'border-rose-600 animate-shake' : 'border-white/10 focus:border-rose-500'}`}
                   placeholder="Master Key"
                   autoFocus
                 />
              </div>
              <button type="submit" className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-all shadow-xl active:scale-95">
                Decrypt Vault
              </button>
              <button type="button" onClick={onClose} className="text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                Abort Protocol
              </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/98 backdrop-blur-3xl animate-fade-in overflow-hidden">
      <div className="w-full max-w-7xl h-full max-h-[900px] flex flex-col">
        <div className="flex justify-between items-center px-4 mb-6">
          <button onClick={onClose} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-xl md:text-3xl font-black text-rose-500 tracking-tighter flex items-center justify-center space-x-3">
              <ShieldAlert size={24} className="md:size-8" />
              <span>Owner Treasury Node</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
               <Cloud size={10} className="text-indigo-400" />
               <p className="mono text-[9px] text-slate-500 font-black uppercase tracking-widest">Brevo API-V3 Logic Online</p>
            </div>
          </div>
          <button onClick={() => setShowSensitive(!showSensitive)} className={`p-4 rounded-2xl transition-all ${showSensitive ? 'bg-rose-600 text-white' : 'bg-white/5 text-slate-400'}`}>
            {showSensitive ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="flex bg-white/5 p-1 rounded-[2rem] max-w-xl mx-auto w-full mb-6">
          <button onClick={() => setActiveTab('treasury')} className={`flex-1 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'treasury' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-500'}`}>
            <Database size={14} /><span>Treasury</span>
          </button>
          <button onClick={() => setActiveTab('audit')} className={`flex-1 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'audit' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-500'}`}>
            <Inbox size={14} /><span>Dispatch Trail</span>
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex-1 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeTab === 'security' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-500'}`}>
            <Settings size={14} /><span>Security</span>
          </button>
        </div>

        <div className="glass-panel flex-1 rounded-[2.5rem] md:rounded-[4rem] border-t-4 border-rose-600 shadow-[0_0_100px_rgba(225,29,72,0.1)] relative overflow-hidden flex flex-col">
          {activeTab === 'audit' ? (
            <div className="flex flex-1 h-full animate-fade-in overflow-hidden">
               <div className="hidden sm:flex w-80 border-r border-white/5 flex-col bg-black/20 overflow-hidden">
                  <div className="p-5 border-b border-white/5 flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <Mail size={12} /> Dispatch Buffer
                     </h3>
                     <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[8px] font-black">API-V3</span>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                     {auditTrail.map(entry => (
                        <div key={entry.id} onClick={() => setSelectedLog(entry)} className={`p-5 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${selectedLog?.id === entry.id ? 'bg-rose-600/10 border-l-4 border-l-rose-600' : ''}`}>
                           <div className="flex justify-between mb-1">
                              <span className={`mono text-[8px] font-black uppercase ${selectedLog?.id === entry.id ? 'text-rose-500' : 'text-slate-500'}`}>{entry.action}</span>
                              <span className="text-[7px] text-slate-600 font-bold">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <p className="text-[10px] text-slate-300 font-medium truncate">Telemetry relay success via Cloud Node...</p>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="flex-1 flex flex-col bg-black/40 overflow-hidden">
                  {selectedLog ? (
                     <div className="flex-1 p-6 md:p-10 space-y-8 animate-fade-in overflow-y-auto no-scrollbar">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-8">
                           <div className="space-y-4">
                              <h2 className="text-2xl font-black text-white tracking-tight">Report ID: {selectedLog.id}</h2>
                              <div className="flex items-center space-x-3">
                                 <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white text-[10px]">QR</div>
                                 <div>
                                    <p className="text-xs font-bold text-white">Security Relay <span className="text-indigo-400 font-black ml-2 text-[10px] uppercase tracking-widest">Brevo v3</span></p>
                                    <p className="text-[10px] text-slate-500">{selectedLog.destination}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="sm:text-right">
                              <span className="mono text-[10px] text-slate-500 font-black">{new Date(selectedLog.timestamp).toLocaleString()}</span>
                              <div className={`flex items-center sm:justify-end space-x-2 mt-2 ${selectedLog.status === 'DELIVERED' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 <Wifi size={12} className="animate-pulse" />
                                 <span className="mono text-[8px] font-black uppercase tracking-tighter">{selectedLog.status}</span>
                              </div>
                           </div>
                        </div>
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                           <pre className="whitespace-pre-wrap text-slate-300 font-medium leading-relaxed font-mono text-sm">{selectedLog.content}</pre>
                        </div>
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-10">
                        <Inbox size={64} className="mb-4 text-slate-500" />
                        <p className="uppercase font-black tracking-[0.4em] text-[10px]">Awaiting Telemetry</p>
                     </div>
                  )}
               </div>
            </div>
          ) : activeTab === 'treasury' ? (
            <div className="flex-1 p-6 md:p-12 space-y-10 animate-fade-in overflow-y-auto no-scrollbar">
              <div className="space-y-8">
                <div className="flex items-center space-x-4 border-b border-white/5 pb-6">
                  <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500"><Landmark size={20} /></div>
                  <h3 className="text-xl font-black text-white">Capital Routing Profile</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank Entity</label>
                    <input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white font-bold outline-none focus:border-rose-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Holder</label>
                    <input value={formData.accountHolder} onChange={e => setFormData({...formData, accountHolder: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white font-bold outline-none focus:border-rose-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Number</label>
                    <input type={showSensitive ? "text" : "password"} value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-rose-500 font-black outline-none focus:border-rose-500 tracking-widest" />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch Protocol</label>
                    <input value={formData.branchCode} onChange={e => setFormData({...formData, branchCode: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white font-bold outline-none focus:border-rose-500" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 md:p-12 space-y-12 animate-fade-in overflow-y-auto no-scrollbar">
               {/* Translated Python Logic: Campaign Dispatch Form */}
               <section className="bg-indigo-600/10 p-8 md:p-10 rounded-[2.5rem] border border-indigo-600/30">
                  <div className="flex items-center space-x-4 mb-8">
                     <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl">
                        <Zap size={24} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-white">Broadcast Protocol (API v3)</h3>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Translated from Python SIB-SDK</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                     <div className="space-y-3">
                        <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Campaign Label</label>
                        <input value={campaignName} onChange={e => setCampaignName(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white font-bold" />
                     </div>
                     <div className="space-y-3">
                        <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Target List IDs (Comma separated)</label>
                        <input value={listIds} onChange={e => setListIds(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-indigo-400 font-black" placeholder="e.g. 2, 7" />
                     </div>
                     <div className="md:col-span-2 space-y-3">
                        <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject Line</label>
                        <input value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white font-bold" />
                     </div>
                     <div className="md:col-span-2 space-y-3">
                        <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">HTML Content</label>
                        <textarea value={campaignHtml} onChange={e => setCampaignHtml(e.target.value)} rows={4} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-slate-300 font-medium font-mono text-sm" />
                     </div>
                  </div>

                  <button 
                    onClick={handleCampaignDispatch} 
                    disabled={isDispatching} 
                    className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center space-x-3 active:scale-95"
                  >
                    {isDispatching ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                    <span>Execute Broadcast Campaign</span>
                  </button>
               </section>

               <div className="space-y-8 border-t border-white/5 pt-10">
                <div className="flex items-center space-x-4 pb-4">
                  <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500"><Terminal size={20} /></div>
                  <h3 className="text-xl font-black text-white">System Keys</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Vault Master Key</label>
                    <input type={showSensitive ? "text" : "password"} value={formData.vaultPassword} onChange={e => setFormData({...formData, vaultPassword: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-rose-500 font-black tracking-widest" />
                  </div>
                  <div className="space-y-2">
                    <label className="mono text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin Control Email</label>
                    <input value={formData.ownerEmail} onChange={e => setFormData({...formData, ownerEmail: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-black/40 border border-white/10 text-white font-bold" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-auto p-8 bg-black/30 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><ShieldCheck size={20} /></div>
              <div><p className="text-[10px] font-black text-white uppercase tracking-widest">Encrypted Logic Relay: ACTIVE</p></div>
            </div>
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <button onClick={() => { setIsLocked(true); setShowSensitive(false); }} className="px-6 py-4 rounded-[2rem] border-2 border-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all">Seal Node</button>
              <button onClick={handleSubmit} disabled={isSaving} className="flex-1 md:flex-none bg-rose-600 text-white px-10 py-4 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-rose-500 transition-all flex items-center justify-center space-x-3">
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                <span>Commit Vault Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerConsole;