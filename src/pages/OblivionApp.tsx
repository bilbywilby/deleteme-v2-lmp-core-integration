import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Search, Filter, Star, CheckCircle2,
  ExternalLink, Mail, Terminal, Settings, User, Copy, X, Dog, Plus, ChevronRight, AlertTriangle, Cpu, Globe
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
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};
function HuskyLogo() {
  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full animate-pulse" />
      <div className="relative glass-cyber p-2 rounded-lg border-primary/30">
        <Dog className="w-7 h-7 text-neon" />
      </div>
      <div className="absolute -bottom-1 -right-1 bg-primary text-background text-[7px] font-bold px-1 rounded border border-primary">
        V5
      </div>
    </motion.div>
  );
}
export function OblivionApp() {
  const [data, setData] = useState<{ services: Service[]; progress: ServiceProgress[]; identity: Identity; logs: DeletionEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [filters, setFilters] = useState({ category: 'All', difficulty: 'All', favorites: false, pending: false });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<TemplateType>('gdpr');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customServiceModal, setCustomServiceModal] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const [newCustomSvc, setNewCustomSvc] = useState<Partial<CustomService>>({ name: '', category: 'SaaS', difficulty: 'medium', contactMethod: 'email', url: '', waitDays: 30 });
  const fetchProtocolData = useCallback(async () => {
    try {
      const res = await api<any>('/api/oblivion/data');
      setData(res);
      setEditingIdentity(res.identity);
    } catch (e) {
      toast.error("PROTOCOL UPLINK FAILED");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 1500);
    fetchProtocolData();
    return () => clearTimeout(timer);
  }, [fetchProtocolData]);
  // Stable Keyboard Shortcuts Replacement
  useKeyboardShortcut('Escape', () => {
    setEmailModal(false);
    setCustomServiceModal(false);
    setSettingsOpen(false);
  });
  const toggleStatus = async (id: string, field: 'done' | 'favorite') => {
    if (!data) return;
    const current = data.progress.find(p => p.id === id) || { id, done: false, favorite: false, notes: '' };
    const nextValue = !current[field];
    try {
      const updated = await api<ServiceProgress>('/api/oblivion/progress', {
        method: 'POST',
        body: JSON.stringify({ id, [field]: nextValue })
      });
      setData(prev => prev ? ({
        ...prev,
        progress: prev.progress.some(p => p.id === id)
          ? prev.progress.map(p => p.id === id ? updated : p)
          : [...prev.progress, updated]
      }) : null);
      toast.success(`${field.toUpperCase()} SYNCED`);
    } catch (e) {
      toast.error("DATA COLLISION");
    }
  };
  const generateEmail = async (service: Service, protocol: TemplateType = 'gdpr') => {
    setSelectedService(service);
    setActiveProtocol(protocol);
    setEmailModal(true);
    setIsDecrypting(true);
    setEmailDraft('');
    try {
      const res = await api<{ content: string }>('/api/enhance-email', {
        method: 'POST',
        body: JSON.stringify({ serviceId: service.id, templateId: protocol === 'gdpr' ? 't-gdpr' : 't-ccpa' })
      });
      setTimeout(() => {
        setEmailDraft(res.content);
        setIsDecrypting(false);
      }, 800);
    } catch (e) {
      toast.error("ENHANCEMENT ABORTED");
      setIsDecrypting(false);
    }
  };
  const { standardMatrix, deepWebMatrix } = useMemo(() => {
    if (!data) return { standardMatrix: [], deepWebMatrix: [] };
    const filtered = data.services.filter(s => {
      const p = data.progress.find(pr => pr.id === s.id);
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filters.category === 'All' || s.category === filters.category;
      const matchesDiff = filters.difficulty === 'All' || s.difficulty === filters.difficulty;
      const matchesFav = !filters.favorites || p?.favorite;
      const matchesPending = !filters.pending || !p?.done;
      return matchesSearch && matchesCat && matchesDiff && matchesFav && matchesPending;
    });
    return {
      standardMatrix: filtered.filter(s => !s.isImpossible),
      deepWebMatrix: filtered.filter(s => s.isImpossible)
    };
  }, [data, search, filters]);
  if (isSplashVisible) return (
    <div className="h-screen flex flex-col items-center justify-center bg-background cyber-grid scanline">
      <HuskyLogo />
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="mt-8 text-center space-y-4"
      >
        <h2 className="text-primary font-display font-bold tracking-[0.4em] uppercase text-xl">OBLIVION v5.0</h2>
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em]">Layered Memory Protocol ::: Active</div>
      </motion.div>
    </div>
  );
  if (loading || !data) return null;
  const doneCount = data.progress.filter(p => p.done).length;
  const progressPercent = (doneCount / data.services.length) * 100;
  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-24 grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="space-y-8 mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
              <HuskyLogo />
              <div>
                <h1 className="text-3xl font-bold font-display tracking-tight text-neon uppercase">OBLIVION <span className="text-muted-foreground font-light text-xl">ZENITH</span></h1>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-mono mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Terminal Online ::: ID: {data.identity.userName}
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
              <Button onClick={() => setSettingsOpen(true)} variant="outline" className="h-auto py-2 px-6 border-primary/30 rounded-none font-bold text-[10px] uppercase">
                <Settings size={14} className="mr-2" /> Identity
              </Button>
              <ThemeToggle className="static" />
            </div>
          </div>
          <div className="space-y-2">
             <div className="flex justify-between items-end px-1">
                <span className="text-[9px] font-mono text-primary uppercase font-bold">Erasure Progress</span>
                <span className="text-[9px] font-mono text-muted-foreground">{Math.floor(progressPercent)}% Protocol Integrity</span>
             </div>
             <Progress value={progressPercent} className="h-1 bg-slate-900 border border-primary/10 rounded-none" />
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <div className="glass-cyber p-5 space-y-6">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-3">
                <Filter size={14} /> Matrix Access
              </div>
              <div className="space-y-5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-primary/40" />
                  <Input 
                    placeholder="Search Nodes..." 
                    className="pl-9 bg-black/40 border-primary/20 text-xs font-mono h-10 rounded-none" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Sector Category</label>
                  <select 
                    className="w-full bg-black/60 border border-primary/20 rounded-none h-10 px-3 text-xs font-mono focus:ring-1 focus:ring-primary/40 outline-none"
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                  >
                    {['All', ...new Set(data.services.map(s => s.category))].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={filters.favorites ? "default" : "outline"} 
                    onClick={() => setFilters(f => ({...f, favorites: !f.favorites}))} 
                    className="text-[9px] h-9 font-bold rounded-none"
                  >
                    <Star size={12} className="mr-2" /> PINNED
                  </Button>
                  <Button 
                    variant={filters.pending ? "default" : "outline"} 
                    onClick={() => setFilters(f => ({...f, pending: !f.pending}))} 
                    className="text-[9px] h-9 font-bold rounded-none"
                  >
                    ACTIVE
                  </Button>
                </div>
                <Button onClick={() => setCustomServiceModal(true)} variant="outline" className="w-full border-dashed border-primary/30 text-[9px] h-10 font-bold hover:bg-primary/5 rounded-none">
                  <Plus size={14} className="mr-2" /> INJECT CUSTOM NODE
                </Button>
              </div>
            </div>
            <div className="glass-cyber p-5 space-y-4">
               <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-3">
                <Cpu size={14} /> Diagnostic
              </div>
              <div className="space-y-2 font-mono text-[9px]">
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">LATENCY</span>
                    <span className="text-emerald-500">0.4ms</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">ENCRYPTION</span>
                    <span className="text-primary">LMP_v5</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">UPTIME</span>
                    <span className="text-primary">100.0%</span>
                 </div>
              </div>
            </div>
          </aside>
          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950/50 border border-primary/10 p-1 w-full flex justify-start h-auto gap-2 rounded-none mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Service Matrix</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Event Timeline</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="mt-0">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {standardMatrix.map(service => {
                        const progress = data.progress.find(p => p.id === service.id);
                        return (
                          <motion.div key={service.id} variants={itemVariants} layout className="h-full">
                            <Card className={`glass-cyber h-full flex flex-col transition-all duration-300 card-indicator-${service.difficulty} ${progress?.done ? 'opacity-40 grayscale blur-[0.3px]' : 'hover:border-primary/50'}`}>
                              <CardContent className="p-5 flex flex-col h-full space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="space-y-1">
                                    <h3 className="font-bold text-base tracking-tight group-hover:text-primary transition-colors font-display uppercase">{service.name}</h3>
                                    <Badge variant="outline" className="text-[8px] h-4 border-primary/20 uppercase font-mono">{service.category}</Badge>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => toggleStatus(service.id, 'favorite')} className={`p-1.5 rounded-sm transition-all ${progress?.favorite ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-600 hover:text-slate-400'}`}>
                                      <Star size={15} fill={progress?.favorite ? "currentColor" : "none"} />
                                    </button>
                                    <button onClick={() => toggleStatus(service.id, 'done')} className={`p-1.5 rounded-sm transition-all ${progress?.done ? 'text-primary bg-primary/10' : 'text-slate-600 hover:text-primary/50'}`}>
                                      <CheckCircle2 size={15} />
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-auto flex gap-2 pt-4 border-t border-primary/5">
                                  <Button variant="outline" onClick={() => window.open(service.url, '_blank')} className="flex-1 bg-black/40 text-[9px] h-8 border-primary/10 font-bold hover:bg-slate-900 font-mono rounded-none">
                                    <ExternalLink size={12} className="mr-2" /> PORTAL
                                  </Button>
                                  <Button onClick={() => generateEmail(service, 'gdpr')} className="flex-1 bg-primary text-background hover:bg-primary/90 text-[9px] h-8 font-bold font-mono rounded-none">
                                    <Zap size={12} className="mr-2" /> DRAFT
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  {deepWebMatrix.length > 0 && (
                    <div className="space-y-6">
                      <div className="deep-web-separator flex flex-col items-center justify-center gap-2">
                        <h2 className="text-rose-500 font-display font-bold tracking-[0.3em] uppercase text-sm mt-2">Deep Web Archive</h2>
                        <p className="text-[9px] font-mono text-rose-500/60 uppercase">Manual Intervention Required ::: Success Probability: Low</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {deepWebMatrix.map(service => (
                          <motion.div key={service.id} variants={itemVariants} layout>
                            <Card className="glass-cyber border-rose-500/20 card-indicator-hard opacity-80 hover:opacity-100 transition-opacity">
                              <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <h3 className="font-bold text-base font-display uppercase text-rose-500">{service.name}</h3>
                                    <Badge className="badge-impossible text-[8px] h-4 rounded-none font-mono">Impossible Node</Badge>
                                  </div>
                                  <Globe className="text-rose-500/40" size={18} />
                                </div>
                                <p className="text-[10px] font-mono text-muted-foreground leading-tight italic">This entity has no automated erasure protocol. Direct legal action or physical correspondence may be required.</p>
                                <Button variant="outline" onClick={() => window.open(service.url, '_blank')} className="w-full border-rose-500/20 text-[9px] h-8 font-bold font-mono text-rose-500 hover:bg-rose-500/5 rounded-none">
                                  ACCESS SECURITY POLICY
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
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
                           {log.metadata?.templateType && <Badge className="text-[7px] h-3 px-1 bg-primary/20 text-primary uppercase border-none">{log.metadata.templateType}</Badge>}
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-cyber p-0 space-y-0 overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center bg-primary text-background p-4 border-b border-primary">
                <h2 className="text-lg font-bold font-display uppercase tracking-widest flex items-center gap-2">
                   <Terminal size={18} /> Protocol_Draft: {selectedService.name}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setEmailModal(false)} className="hover:bg-background/20 text-background h-8 w-8"><X /></Button>
              </div>
              <Tabs value={activeProtocol} onValueChange={(v) => generateEmail(selectedService, v as TemplateType)}>
                <TabsList className="bg-slate-900 w-full rounded-none h-12 p-0 border-b border-primary/10">
                   <TabsTrigger value="gdpr" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-full font-bold text-[10px] rounded-none border-r border-primary/10">GDPR_AR17</TabsTrigger>
                   <TabsTrigger value="ccpa" className="flex-1 data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-full font-bold text-[10px] rounded-none">CCPA_R2D</TabsTrigger>
                </TabsList>
                <div className="p-6 space-y-5">
                  <div className="relative min-h-[300px] bg-black/60 border border-primary/10 p-6">
                    {isDecrypting ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                        <motion.div 
                          animate={{ opacity: [1, 0.4, 1], rotate: 360 }} 
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                        />
                        <span className="text-[10px] font-mono text-primary uppercase animate-pulse">Decrypting Protocol Buffer...</span>
                      </div>
                    ) : (
                      <textarea
                        className="w-full h-80 bg-transparent border-none p-0 font-mono text-xs text-slate-300 focus:ring-0 outline-none resize-none custom-scrollbar"
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                    <Button variant="outline" className="border-primary/20 font-bold text-[10px] h-11 rounded-none uppercase" onClick={async () => {
                      await navigator.clipboard.writeText(emailDraft);
                      toast.success("BUFFER COPIED");
                    }}><Copy size={14} className="mr-2" /> Copy Buffer</Button>
                    <Button className="bg-primary text-background font-bold text-[10px] h-11 rounded-none uppercase hover:bg-primary/90" onClick={() => {
                      const mailto = `mailto:${selectedService.privateEmail || ''}?subject=${encodeURIComponent(activeProtocol === 'gdpr' ? 'Right to Erasure Request' : 'CCPA Right to Delete Request')} - ${selectedService.name}&body=${encodeURIComponent(emailDraft)}`;
                      window.location.href = mailto;
                    }}>
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
          <SheetHeader className="space-y-1 mb-8">
            <SheetTitle className="text-2xl font-display font-bold text-primary uppercase tracking-tighter">Identity_Sync</SheetTitle>
            <SheetDescription className="text-muted-foreground text-[10px] font-mono uppercase tracking-[0.2em]">Layered Memory Calibration</SheetDescription>
          </SheetHeader>
          {editingIdentity && (
            <div className="space-y-8 pb-10">
               <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-primary font-bold uppercase font-mono tracking-widest">Operator Designation</label>
                    <Input value={editingIdentity.userName} className="bg-black/40 border-primary/10 font-mono text-xs h-11 rounded-none focus:border-primary/50" onChange={(e) => setEditingIdentity({...editingIdentity, userName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-primary font-bold uppercase font-mono tracking-widest">Primary Uplink (Email)</label>
                    <Input value={editingIdentity.email} className="bg-black/40 border-primary/10 font-mono text-xs h-11 rounded-none focus:border-primary/50" onChange={(e) => setEditingIdentity({...editingIdentity, email: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-primary font-bold uppercase font-mono tracking-widest">Legal Identity</label>
                    <Input value={editingIdentity.fullName} className="bg-black/40 border-primary/10 font-mono text-xs h-11 rounded-none focus:border-primary/50" onChange={(e) => setEditingIdentity({...editingIdentity, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-primary font-bold uppercase font-mono tracking-widest">Address Segment</label>
                    <Input value={editingIdentity.address} className="bg-black/40 border-primary/10 font-mono text-xs h-11 rounded-none focus:border-primary/50" onChange={(e) => setEditingIdentity({...editingIdentity, address: e.target.value})} />
                  </div>
               </div>
               <div className="p-5 bg-primary/5 border border-primary/10 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase text-primary tracking-widest flex items-center gap-2">
                    <Cpu size={14} /> Neural Integrity
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col">
                        <span className="text-[8px] text-muted-foreground uppercase">Sync Count</span>
                        <span className="text-xl font-bold font-display tracking-tighter">{data.progress.length}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[8px] text-muted-foreground uppercase">Stability</span>
                        <span className="text-xl font-bold font-display tracking-tighter">99.9%</span>
                     </div>
                  </div>
               </div>
               <div className="flex gap-4">
                <Button variant="outline" onClick={() => setSettingsOpen(false)} className="flex-1 text-[10px] font-bold h-12 rounded-none border-primary/20 uppercase">Abort</Button>
                <Button className="flex-1 bg-primary text-background font-bold text-[10px] h-12 rounded-none uppercase hover:bg-primary/90" onClick={async () => {
                  await api('/api/oblivion/identity', { method: 'POST', body: JSON.stringify(editingIdentity) });
                  toast.success("IDENTITY SYNCHRONIZED");
                  setSettingsOpen(false);
                  fetchProtocolData();
                }}>Initialize Sync</Button>
               </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <AnimatePresence>
        {customServiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setCustomServiceModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md glass-cyber p-0 space-y-0 overflow-hidden shadow-2xl">
              <div className="bg-primary text-background p-4 flex justify-between items-center">
                 <h2 className="text-lg font-bold font-display uppercase tracking-tighter">Inject_Node_Protocol</h2>
                 <Button variant="ghost" size="icon" onClick={() => setCustomServiceModal(false)} className="hover:bg-background/20 text-background h-8 w-8"><X /></Button>
              </div>
              <div className="p-7 space-y-6 bg-slate-950/40">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-primary uppercase font-bold tracking-widest">Node Name</label>
                    <Input placeholder="TARGET_NAME_01" className="bg-black/60 border-primary/10 font-mono text-xs h-11 rounded-none focus:border-primary/50" value={newCustomSvc.name} onChange={e => setNewCustomSvc({...newCustomSvc, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-primary uppercase font-bold tracking-widest">Target URL</label>
                    <Input placeholder="https://endpoint.local" className="bg-black/60 border-primary/10 font-mono text-xs h-11 rounded-none focus:border-primary/50" value={newCustomSvc.url} onChange={e => setNewCustomSvc({...newCustomSvc, url: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-primary uppercase font-bold tracking-widest">Sector</label>
                      <select className="w-full bg-black/60 border border-primary/10 rounded-none h-11 px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/40 outline-none" value={newCustomSvc.category} onChange={e => setNewCustomSvc({...newCustomSvc, category: e.target.value})}>
                        {['SaaS', 'Social', 'FinTech', 'Health', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-primary uppercase font-bold tracking-widest">Risk</label>
                      <select className="w-full bg-black/60 border border-primary/10 rounded-none h-11 px-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/40 outline-none" value={newCustomSvc.difficulty} onChange={e => setNewCustomSvc({...newCustomSvc, difficulty: e.target.value as any})}>
                        {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setCustomServiceModal(false)} className="text-[10px] h-11 rounded-none font-bold uppercase px-6">Cancel</Button>
                  <Button onClick={async () => {
                    if (!newCustomSvc.name || !newCustomSvc.url) return toast.error("VALIDATION ERROR");
                    try {
                      await api('/api/oblivion/custom-service', { method: 'POST', body: JSON.stringify(newCustomSvc) });
                      toast.success("NODE INJECTED");
                      setCustomServiceModal(false);
                      fetchProtocolData();
                    } catch (e) { toast.error("INJECTION FAILED"); }
                  }} className="bg-primary text-background font-bold text-[10px] h-11 px-8 rounded-none uppercase hover:bg-primary/90">Initialize Injection</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster richColors position="bottom-right" theme="dark" />
    </div>
  );
}