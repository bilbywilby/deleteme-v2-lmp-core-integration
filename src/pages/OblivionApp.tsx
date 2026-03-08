import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Search, Filter, Star, CheckCircle2,
  ExternalLink, Mail, Terminal, Settings, User, Copy, X, Dog, Plus, ChevronRight, AlertTriangle, Cpu, Globe, RefreshCcw
} from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast, Toaster } from 'sonner';
import { Service, ServiceProgress, Identity, DeletionEvent, CustomService, TemplateType } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
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
  const { session, setSession, loading: sessionLoading } = useSession();
  const [data, setData] = useState<{ services: Service[]; progress: ServiceProgress[]; identity: Identity; logs: DeletionEvent[] } | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [filters, setFilters] = useState({ category: 'All', difficulty: 'All', favorites: false, pending: false });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [activeProtocol, setActiveProtocol] = useState<TemplateType>('gdpr');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customServiceModal, setCustomServiceModal] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const [newCustomSvc, setNewCustomSvc] = useState<Partial<CustomService>>({ name: '', category: 'SaaS', difficulty: 'medium', contactMethod: 'email', url: '', waitDays: 30 });
  const { enhance, isEnhancing } = useSemanticEmailEnhancement();
  const { results: semanticMem, retrieve: retrieveSemantic, loading: memLoading } = useMemoryRetrieval(selectedService);
  const { saveCheckpoint, isSyncing, hasConflict, setHasConflict } = useCheckpoint(session, () => {
    toast.error("PROTOCOL COLLISION DETECTED");
  });
  const fetchProtocolData = useCallback(async () => {
    try {
      const res = await api<any>('/api/oblivion/data');
      setData(res);
      setEditingIdentity(res.identity);
    } catch (e) { toast.error("PROTOCOL UPLINK FAILED"); }
    finally { setAppLoading(false); }
  }, []);
  useEffect(() => { fetchProtocolData(); }, [fetchProtocolData]);
  useEffect(() => {
    if (data && !appLoading) {
      const timer = setTimeout(() => saveCheckpoint(data.progress), 3000);
      return () => clearTimeout(timer);
    }
  }, [data, saveCheckpoint, appLoading]);
  useKeyboardShortcut('Escape', () => { setEmailModal(false); setCustomServiceModal(false); setSettingsOpen(false); });
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
    } catch (e) { toast.error("DATA COLLISION"); }
  };
  const generateEmailDraft = async (service: Service, protocol: TemplateType = 'gdpr') => {
    setSelectedService(service);
    setActiveProtocol(protocol);
    setEmailModal(true);
    setEmailDraft('');
    const res = await enhance(service.id, protocol, service.name);
    if (res) {
      setEmailDraft(res.content);
      setSimilarityScore(res.score);
      retrieveSemantic('semantic');
    }
  };
  const { standardMatrix, deepWebMatrix } = useMemo(() => {
    if (!data) return { standardMatrix: [], deepWebMatrix: [] };
    const filtered = data.services.filter(s => {
      const p = data.progress.find(pr => pr.id === s.id);
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filters.category === 'All' || s.category === filters.category;
      const matchesDiff = filters.difficulty === 'All' || s.difficulty === filters.difficulty;
      return matchesSearch && matchesCat && matchesDiff && (!filters.favorites || p?.favorite) && (!filters.pending || !p?.done);
    });
    return { standardMatrix: filtered.filter(s => !s.isImpossible), deepWebMatrix: filtered.filter(s => s.isImpossible) };
  }, [data, search, filters]);
  if (sessionLoading || appLoading || !data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-background cyber-grid scanline">
      <HuskyLogo />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center space-y-4">
        <h2 className="text-primary font-display font-bold tracking-[0.4em] uppercase text-xl">NEURAL LINKING...</h2>
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">Synchronizing Episodic Buffers</div>
      </motion.div>
    </div>
  );
  const doneCount = data.progress.filter(p => p.done).length;
  const progressPercent = (doneCount / data.services.length) * 100;
  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-24 grain">
      {hasConflict && (
        <div className="bg-amber-500 text-black py-2 px-4 flex justify-between items-center font-mono text-xs font-bold sticky top-0 z-[110]">
          <div className="flex items-center gap-2"><AlertTriangle size={14} /> SESSION VERSION MISMATCH DETECTED</div>
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
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-mono mt-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                  Session: {session?.id.slice(0, 8)} ::: V{session?.version}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="stat-chip" onClick={() => setFilters(f => ({ ...f, difficulty: 'easy' }))}>
                <span className="text-[8px] text-muted-foreground uppercase">Low Risk</span>
                <span className="text-lg font-bold text-emerald-500">{data.services.filter(s => s.difficulty === 'easy').length}</span>
              </div>
              <div className="stat-chip" onClick={() => setFilters(f => ({ ...f, difficulty: 'medium' }))}>
                <span className="text-[8px] text-muted-foreground uppercase">Med Risk</span>
                <span className="text-lg font-bold text-amber-500">{data.services.filter(s => s.difficulty === 'medium').length}</span>
              </div>
              <div className="stat-chip" onClick={() => setFilters(f => ({ ...f, difficulty: 'hard' }))}>
                <span className="text-[8px] text-muted-foreground uppercase">Critical</span>
                <span className="text-lg font-bold text-rose-500">{data.services.filter(s => s.difficulty === 'hard').length}</span>
              </div>
              <Button onClick={() => setSettingsOpen(true)} variant="outline" className="h-auto py-2 px-6 border-primary/30 rounded-none font-bold text-[10px] uppercase"><Settings size={14} className="mr-2" /> Identity</Button>
              <ThemeToggle className="static" />
            </div>
          </div>
          <div className="space-y-2">
             <div className="flex justify-between items-end px-1">
                <span className="text-[9px] font-mono text-primary uppercase font-bold">Erasure Integrity</span>
                <span className="text-[9px] font-mono text-muted-foreground">{Math.floor(progressPercent)}% LMP Coverage</span>
             </div>
             <Progress value={progressPercent} className="h-1 bg-slate-900 border border-primary/10 rounded-none" />
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <div className="glass-cyber p-5 space-y-6">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-3"><Filter size={14} /> Matrix Filters</div>
              <div className="space-y-5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-primary/40" />
                  <Input placeholder="Search Nodes..." className="pl-9 bg-black/40 border-primary/20 text-xs font-mono h-10 rounded-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Sector Category</label>
                  <select className="w-full bg-black/60 border border-primary/20 rounded-none h-10 px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/40 outline-none" onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
                    {['All', ...new Set(data.services.map(s => s.category))].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={filters.favorites ? "default" : "outline"} onClick={() => setFilters(f => ({...f, favorites: !f.favorites}))} className="text-[9px] h-9 font-bold rounded-none"><Star size={12} className="mr-2" /> PINNED</Button>
                  <Button variant={filters.pending ? "default" : "outline"} onClick={() => setFilters(f => ({...f, pending: !f.pending}))} className="text-[9px] h-9 font-bold rounded-none">ACTIVE</Button>
                </div>
              </div>
            </div>
            {selectedService && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-cyber p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-3"><Zap size={14} /> Semantic Context</div>
                <div className="space-y-3">
                  {memLoading ? <div className="text-[9px] animate-pulse">ANALYZING MEMORY LAYERS...</div> : semanticMem.slice(0, 2).map((res, i) => (
                    <div key={i} className="p-2 bg-primary/5 border border-primary/10 text-[9px] font-mono leading-tight">
                      <div className="text-primary/40 mb-1 flex justify-between"><span>SUCCESS PATTERN {i+1}</span><span>{(res.score * 100).toFixed(0)}% Match</span></div>
                      <p className="line-clamp-2 italic opacity-60">"{res.content}"</p>
                    </div>
                  ))}
                  {semanticMem.length === 0 && !memLoading && <div className="text-[9px] text-muted-foreground italic">NO PRIOR SEMANTIC PATTERNS FOUND</div>}
                </div>
              </motion.div>
            )}
          </aside>
          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950/50 border border-primary/10 p-1 w-full flex justify-start h-auto gap-2 rounded-none mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Target Matrix</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Event Stream</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="mt-0">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {standardMatrix.map(service => {
                      const progress = data.progress.find(p => p.id === service.id);
                      return (
                        <motion.div key={service.id} variants={itemVariants} layout>
                          <Card className={`glass-cyber h-full transition-all card-indicator-${service.difficulty} ${progress?.done ? 'opacity-30' : 'hover:border-primary/50'}`}>
                            <CardContent className="p-5 space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-base font-display uppercase">{service.name}</h3>
                                  <Badge variant="outline" className="text-[8px] h-4 border-primary/20 uppercase font-mono">{service.category}</Badge>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => toggleStatus(service.id, 'favorite')} className={`p-1.5 rounded-sm ${progress?.favorite ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-600'}`}><Star size={15} fill={progress?.favorite ? "currentColor" : "none"} /></button>
                                  <button onClick={() => toggleStatus(service.id, 'done')} className={`p-1.5 rounded-sm ${progress?.done ? 'text-primary bg-primary/10' : 'text-slate-600'}`}><CheckCircle2 size={15} /></button>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4 border-t border-primary/5">
                                <Button variant="outline" onClick={() => window.open(service.url, '_blank')} className="flex-1 text-[9px] h-8 border-primary/10 font-bold font-mono rounded-none"><ExternalLink size={12} className="mr-2" /> PORTAL</Button>
                                <Button onClick={() => generateEmailDraft(service, 'gdpr')} className="flex-1 bg-primary text-background text-[9px] h-8 font-bold font-mono rounded-none"><Zap size={12} className="mr-2" /> ENHANCE</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </TabsContent>
              <TabsContent value="logs">
                 <div className="glass-cyber rounded-none overflow-hidden divide-y divide-primary/10">
                  {data.logs.map((log) => (
                    <div key={log.id} className="p-5 hover:bg-primary/5 transition-colors flex gap-8 font-mono text-[10px]">
                      <span className="text-muted-foreground shrink-0 w-24 tabular-nums">{formatDistanceToNow(log.timestamp)} ago</span>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[8px] h-4 px-1 rounded-none border-primary/30 text-primary/80 uppercase">{log.type.replace('_', ' ')}</Badge>
                           <span className="ml-auto text-primary/20 text-[8px]">LOG::{log.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed font-mono text-xs">{log.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      <AnimatePresence>
        {emailModal && selectedService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setEmailModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-cyber p-0 overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center bg-primary text-background p-4 border-b border-primary">
                <h2 className="text-lg font-bold font-display uppercase tracking-widest flex items-center gap-2"><Terminal size={18} /> Protocol_Draft: {selectedService.name}</h2>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono bg-black/20 px-2 py-1 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Confidence: {(similarityScore * 100).toFixed(0)}%
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setEmailModal(false)} className="hover:bg-background/20 text-background h-8 w-8"><X /></Button>
                </div>
              </div>
              <Tabs value={activeProtocol} onValueChange={(v) => generateEmailDraft(selectedService, v as TemplateType)}>
                <TabsList className="bg-slate-900 w-full rounded-none h-12 p-0 border-b border-primary/10">
                   <TabsTrigger value="gdpr" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-full font-bold text-[10px] rounded-none border-r border-primary/10">GDPR_AR17</TabsTrigger>
                   <TabsTrigger value="ccpa" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-full font-bold text-[10px] rounded-none">CCPA_R2D</TabsTrigger>
                </TabsList>
                <div className="p-6 space-y-5">
                  <div className="relative min-h-[300px] bg-black/60 border border-primary/10 p-6">
                    {isEnhancing ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <motion.div animate={{ opacity: [1, 0.4, 1], rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="text-[10px] font-mono text-primary uppercase animate-pulse">Decrypting Protocol Buffer...</span>
                      </div>
                    ) : (
                      <textarea className="w-full h-80 bg-transparent border-none p-0 font-mono text-xs text-slate-300 focus:ring-0 outline-none resize-none custom-scrollbar" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                    <Button variant="outline" className="border-primary/20 font-bold text-[10px] h-11 rounded-none uppercase" onClick={async () => { await navigator.clipboard.writeText(emailDraft); toast.success("BUFFER COPIED"); }}><Copy size={14} className="mr-2" /> Copy Buffer</Button>
                    <Button className="bg-primary text-background font-bold text-[10px] h-11 rounded-none uppercase" onClick={() => { window.location.href = `mailto:${selectedService.privateEmail || ''}?subject=${encodeURIComponent(activeProtocol.toUpperCase() + ' Erasure')} - ${selectedService.name}&body=${encodeURIComponent(emailDraft)}`; }}>
                      <Mail size={14} className="mr-2" /> Dispatch Request
                    </Button>
                  </div>
                </div>
              </Tabs>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="bg-slate-950 border-l border-primary/20 w-full sm:max-w-md text-foreground glass-cyber overflow-y-auto">
          <SheetHeader className="mb-8"><SheetTitle className="text-2xl font-display font-bold text-primary uppercase">Identity_Sync</SheetTitle></SheetHeader>
          {editingIdentity && (
            <div className="space-y-8 pb-10">
               <div className="space-y-5">
                  <div className="space-y-1.5"><label className="text-[9px] text-primary font-bold uppercase font-mono">Operator ID</label><Input value={editingIdentity.userName} className="bg-black/40 border-primary/10 font-mono text-xs h-11 rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, userName: e.target.value})} /></div>
                  <div className="space-y-1.5"><label className="text-[9px] text-primary font-bold uppercase font-mono">Verified Uplink</label><Input value={editingIdentity.email} className="bg-black/40 border-primary/10 font-mono text-xs h-11 rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, email: e.target.value})} /></div>
               </div>
               <Button className="w-full bg-primary text-background font-bold text-[10px] h-12 rounded-none uppercase" onClick={async () => { await api('/api/oblivion/identity', { method: 'POST', body: JSON.stringify(editingIdentity) }); toast.success("IDENTITY SYNCHRONIZED"); setSettingsOpen(false); fetchProtocolData(); }}>Initialize Sync</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Toaster richColors position="bottom-right" theme="dark" />
    </div>
  );
}