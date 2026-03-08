import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Search, Filter, Star, CheckCircle2,
  ExternalLink, Mail, Terminal, Settings, User, Copy, X, Dog, Plus, ChevronRight, AlertTriangle, Cpu, Globe, RefreshCcw, Clock
} from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast, Toaster } from 'sonner';
import { Service, ServiceProgress, Identity, DeletionEvent, CustomService, TemplateType } from '@shared/types';
import { useSession, useCheckpoint, useSemanticEmailEnhancement, useMemoryRetrieval } from '@/hooks/use-lmp';
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};
function HuskyLogo() {
  return (
    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full animate-pulse" />
      <div className="relative glass-cyber p-2 rounded-lg border-primary/30"><Dog className="w-7 h-7 text-neon" /></div>
      <div className="absolute -bottom-1 -right-1 bg-primary text-background text-[7px] font-bold px-1 rounded border border-primary">V5</div>
    </motion.div>
  );
}
export function OblivionApp() {
  const { session, loading: sessionLoading } = useSession();
  const [data, setData] = useState<{ services: Service[]; progress: ServiceProgress[]; identity: Identity; logs: DeletionEvent[] } | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [filters, setFilters] = useState({ category: 'All', difficulty: 'All', favorites: false, pending: false });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [activeProtocol, setActiveProtocol] = useState<TemplateType>('gdpr');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const { enhance, isEnhancing } = useSemanticEmailEnhancement();
  const { results: memoryResults, retrieve: retrieveMemory, loading: memLoading } = useMemoryRetrieval(selectedService);
  const { saveCheckpoint, isSyncing, hasConflict, setHasConflict, resolution } = useCheckpoint(session, (conflictData) => {
    toast.error("PROTOCOL COLLISION DETECTED");
  });
  const fetchProtocolData = useCallback(async () => {
    try {
      const res = await api<any>('/api/oblivion/data');
      setData(res);
      setEditingIdentity(res.identity);
    } catch (e) { 
      toast.error("PROTOCOL UPLINK FAILED"); 
    } finally { 
      setAppLoading(false); 
    }
  }, []);
  useEffect(() => { fetchProtocolData(); }, [fetchProtocolData]);
  useEffect(() => {
    if (data && !appLoading) {
      const timer = setTimeout(() => saveCheckpoint('progress', data.progress), 3000);
      return () => clearTimeout(timer);
    }
  }, [data, saveCheckpoint, appLoading]);
  useKeyboardShortcut('Escape', () => { setEmailModal(false); setSettingsOpen(false); });
  const toggleStatus = async (id: string, field: 'done' | 'favorite') => {
    if (!data) return;
    const current = data.progress.find(p => p.id === id) || { id, done: false, favorite: false, notes: '' };
    const nextValue = !current[field];
    try {
      const updated = await api<ServiceProgress>('/api/oblivion/progress', {
        method: 'POST',
        body: JSON.stringify({ id, [field]: nextValue })
      });
      setData(prev => prev ? ({ ...prev, progress: prev.progress.some(p => p.id === id) ? prev.progress.map(p => p.id === id ? updated : p) : [...prev.progress, updated] }) : null);
      toast.success(`${field.toUpperCase()} SYNCED`);
    } catch (e) { 
      toast.error("DATA COLLISION"); 
    }
  };
  const generateEmailDraft = async (service: Service, protocol: TemplateType = 'gdpr') => {
    setSelectedService(service);
    setActiveProtocol(protocol);
    setEmailModal(true);
    setEmailDraft('');
    const res = await enhance(service.id, protocol, service.name);
    if (res) {
      setEmailDraft(res.content);
      setConfidence(res.confidence);
      retrieveMemory(['semantic', 'episodic', 'parametric']);
    }
  };
  const { standardMatrix } = useMemo(() => {
    if (!data) return { standardMatrix: [] };
    const filtered = data.services.filter(s => {
      const p = data.progress.find(pr => pr.id === s.id);
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filters.category === 'All' || s.category === filters.category;
      const matchesDiff = filters.difficulty === 'All' || s.difficulty === filters.difficulty;
      return matchesSearch && matchesCat && matchesDiff && (!filters.favorites || p?.favorite) && (!filters.pending || !p?.done);
    });
    return { standardMatrix: filtered.filter(s => !s.isImpossible) };
  }, [data, search, filters]);
  if (sessionLoading || appLoading || !data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-background cyber-grid scanline">
      <HuskyLogo />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center space-y-4">
        <h2 className="text-primary font-display font-bold tracking-[0.4em] uppercase text-xl">NEURAL LINKING...</h2>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-mono">
           <Globe size={12} className="animate-spin" />
           <span>Client Handshake Synchronized</span>
        </div>
      </motion.div>
    </div>
  );
  const progressPercent = (data.progress.filter(p => p.done).length / data.services.length) * 100;
  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-24 grain">
      {hasConflict && (
        <div className="bg-amber-500 text-black py-2 px-4 flex justify-between items-center font-mono text-xs font-bold sticky top-0 z-[110]">
          <div className="flex items-center gap-2"><AlertTriangle size={14} /> {resolution || "SESSION VERSION MISMATCH DETECTED"}</div>
          <div className="flex gap-4">
            <button onClick={() => window.location.reload()} className="underline">RELOAD MATRIX</button>
            <button onClick={() => setHasConflict(false)} className="underline">IGNORE</button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="space-y-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <HuskyLogo />
              <div>
                <h1 className="text-3xl font-bold font-display tracking-tight text-neon uppercase">OBLIVION <span className="text-muted-foreground font-light text-xl">ZENITH</span></h1>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-mono mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                    ID: {session?.id.slice(0, 8)} ::: V{session?.version}
                  </div>
                  {session?.contextHash && (
                    <div className="border-l border-primary/20 pl-4 flex items-center gap-1.5">
                      <Cpu size={10} className="text-primary/50" />
                      HASH: <span className="text-primary/70">{session.contextHash}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setSettingsOpen(true)} variant="outline" className="h-auto py-2 px-6 border-primary/30 rounded-none font-bold text-[10px] uppercase"><User size={14} className="mr-2" /> Identity</Button>
              <ThemeToggle className="static" />
            </div>
          </div>
          <Progress value={progressPercent} className="h-1 bg-slate-900 border border-primary/10 rounded-none" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <div className="glass-cyber p-5 space-y-6">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-3"><Filter size={14} /> Matrix Filters</div>
              <Input placeholder="Search Nodes..." className="bg-black/40 border-primary/20 text-xs font-mono h-10 rounded-none" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {selectedService && (
              <div className="glass-cyber p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-3"><Zap size={14} /> Hybrid Memory</div>
                <div className="space-y-3">
                  {memLoading ? <div className="text-[9px] animate-pulse">ANALYZING LMP LAYERS...</div> : memoryResults.map((res, i) => (
                    <div key={i} className="p-2 bg-primary/5 border border-primary/10 text-[9px] font-mono leading-tight">
                      <div className="text-primary/40 mb-1 flex justify-between uppercase">
                        <span>{res.layer} @ {res.latency}ms</span>
                        <span>{(res.score * 100).toFixed(0)}%</span>
                      </div>
                      <p className="line-clamp-2 italic opacity-60">"{res.content}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950/50 border border-primary/10 p-1 w-full flex justify-start h-auto gap-2 rounded-none mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Target Matrix</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Event Stream</TabsTrigger>
              </TabsList>
              <TabsContent value="services">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {standardMatrix.map(service => {
                    const progress = data.progress.find(p => p.id === service.id);
                    return (
                      <motion.div key={service.id} variants={itemVariants} layout>
                        <Card className={`glass-cyber h-full transition-all card-indicator-${service.difficulty} ${progress?.done ? 'opacity-30' : 'hover:border-primary/50'}`}>
                          <CardContent className="p-5 space-y-4">
                            <h3 className="font-bold text-base font-display uppercase">{service.name}</h3>
                            <div className="flex gap-2 pt-4">
                              <Button variant="outline" onClick={() => window.open(service.url, '_blank')} className="flex-1 text-[9px] h-8 border-primary/10 font-bold font-mono rounded-none">PORTAL</Button>
                              <Button onClick={() => generateEmailDraft(service)} className="flex-1 bg-primary text-background text-[9px] h-8 font-bold font-mono rounded-none">ENHANCE</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      <AnimatePresence>
        {emailModal && selectedService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setEmailModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-cyber p-0 overflow-hidden">
              <div className="bg-primary text-background p-4 flex justify-between items-center">
                <h2 className="text-lg font-bold font-display uppercase"><Terminal size={18} className="inline mr-2" /> Protocol_Draft</h2>
                <div className="text-[10px] font-mono bg-black/20 px-2 py-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Confidence: {(confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-black/60 border border-primary/10 p-6 min-h-[300px]">
                  {isEnhancing ? (
                     <div className="flex flex-col items-center justify-center h-full gap-4 text-primary animate-pulse font-mono text-[10px]">
                       <Cpu size={24} /> <span>Decrypting Semantic Patterns...</span>
                     </div>
                  ) : (
                    <textarea className="w-full h-80 bg-transparent border-none p-0 font-mono text-xs text-slate-300 outline-none resize-none" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" className="font-bold text-[10px] rounded-none uppercase" onClick={() => setEmailModal(false)}>Close</Button>
                  <Button className="bg-primary text-background font-bold text-[10px] rounded-none uppercase" onClick={() => { navigator.clipboard.writeText(emailDraft); toast.success("BUFFER COPIED"); }}>Copy Buffer</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="bg-slate-950 border-l border-primary/20 w-full sm:max-w-md text-foreground glass-cyber">
          <SheetHeader className="mb-8"><h2 className="text-2xl font-display font-bold text-primary uppercase">Identity_Sync</h2></SheetHeader>
          {editingIdentity && (
            <div className="space-y-8">
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-primary font-bold uppercase">Operator ID</label>
                    <Input value={editingIdentity.userName ?? ""} className="bg-black/40 border-primary/10 font-mono text-xs rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, userName: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-primary font-bold uppercase">Uplink Email</label>
                    <Input value={editingIdentity.email ?? ""} className="bg-black/40 border-primary/10 font-mono text-xs rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-primary font-bold uppercase">Full Name</label>
                    <Input value={editingIdentity.fullName ?? ""} className="bg-black/40 border-primary/10 font-mono text-xs rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, fullName: e.target.value})} />
                  </div>
               </div>
               <Button 
                className="w-full bg-primary text-background font-bold text-[10px] h-12 rounded-none uppercase" 
                onClick={async () => { 
                  try {
                    await api('/api/oblivion/identity', { method: 'POST', body: JSON.stringify(editingIdentity) }); 
                    toast.success("IDENTITY SYNCHRONIZED"); 
                    setSettingsOpen(false); 
                    fetchProtocolData(); 
                  } catch (e) {
                    toast.error("IDENTITY SYNC FAILED");
                  }
                }}
              >
                Initialize Sync
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Toaster richColors position="bottom-right" theme="dark" />
    </div>
  );
}