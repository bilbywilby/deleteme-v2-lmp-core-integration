import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Search, Filter, Star, CheckCircle2,
  ExternalLink, Mail, Terminal, Settings, User, Copy, X, Dog, Plus, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast, Toaster } from 'sonner';
import { Service, ServiceProgress, Identity, DeletionEvent, CustomService, TemplateType } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
function HuskyLogo() {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
      <div className="relative glass-cyber p-2 rounded-xl border-primary/40">
        <Dog className="w-8 h-8 text-neon" />
      </div>
      <div className="absolute -bottom-1 -right-1 bg-primary text-background text-[8px] font-bold px-1 rounded border border-primary">
        D△
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
    const timer = setTimeout(() => setIsSplashVisible(false), 1200);
    fetchProtocolData();
    return () => clearTimeout(timer);
  }, [fetchProtocolData]);
  // Keyboard Shortcuts
  useHotkeys('esc', () => {
    setEmailModal(false);
    setCustomServiceModal(false);
    setSettingsOpen(false);
  });
  useHotkeys('e', () => {
    if (selectedService) generateEmail(selectedService, activeProtocol);
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
      toast.success(`${field.toUpperCase()} STATUS UPDATED`);
    } catch (e) {
      toast.error("SYNC FAILED");
    }
  };
  const addCustomService = async () => {
    if (!newCustomSvc.name || !newCustomSvc.url) return toast.error("VALIDATION ERROR");
    try {
      await api('/api/oblivion/custom-service', { method: 'POST', body: JSON.stringify(newCustomSvc) });
      toast.success("CUSTOM NODE REGISTERED");
      setCustomServiceModal(false);
      fetchProtocolData();
    } catch (e) {
      toast.error("REGISTRATION FAILED");
    }
  };
  const generateEmail = async (service: Service, protocol: TemplateType = 'gdpr') => {
    setSelectedService(service);
    setActiveProtocol(protocol);
    setEmailModal(true);
    try {
      const res = await api<{ content: string }>('/api/enhance-email', {
        method: 'POST',
        body: JSON.stringify({ serviceId: service.id, templateId: protocol === 'gdpr' ? 't-gdpr' : 't-ccpa' })
      });
      setEmailDraft(res.content);
    } catch (e) {
      toast.error("ENHANCEMENT FAILED");
    }
  };
  const filteredServices = useMemo(() => {
    if (!data) return [];
    return data.services.filter(s => {
      const p = data.progress.find(pr => pr.id === s.id);
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filters.category === 'All' || s.category === filters.category;
      const matchesDiff = filters.difficulty === 'All' || s.difficulty === filters.difficulty;
      const matchesFav = !filters.favorites || p?.favorite;
      const matchesPending = !filters.pending || !p?.done;
      return matchesSearch && matchesCat && matchesDiff && matchesFav && matchesPending;
    });
  }, [data, search, filters]);
  const categories = useMemo(() => ['All', ...new Set(data?.services.map(s => s.category) || [])], [data]);
  if (isSplashVisible) return (
    <div className="h-screen flex items-center justify-center bg-background cyber-grid scanline">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
        <HuskyLogo />
        <div className="space-y-2">
          <h2 className="text-primary font-display font-bold tracking-[0.3em] uppercase glitch-entry">OBLIVION v5.0</h2>
          <div className="h-[1px] w-48 bg-primary/20 mx-auto overflow-hidden">
            <motion.div initial={{ x: -200 }} animate={{ x: 200 }} transition={{ duration: 1.5, repeat: Infinity }} className="h-full w-24 bg-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground font-mono animate-pulse uppercase tracking-widest">Protocol Handshake...</p>
        </div>
      </motion.div>
    </div>
  );
  if (loading || !data) return null;
  const doneCount = data.progress.filter(p => p.done).length;
  const progressPercent = Math.round((doneCount / data.services.length) * 100);
  const pendingCount = data.services.length - doneCount;
  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-20 grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <HuskyLogo />
            <div className="space-y-1">
              <h1 className="text-4xl font-bold font-display tracking-tighter text-neon uppercase">OBLIVION <span className="text-muted-foreground font-light text-2xl">v5</span></h1>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-mono">Advanced Erasure Framework</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <button onClick={() => setFilters(f => ({ ...f, pending: true, favorites: false }))} className="glass-cyber px-4 py-2 flex flex-col items-center hover:bg-primary/5 transition-colors">
                <span className="text-[9px] text-muted-foreground uppercase font-mono">Pending</span>
                <span className="text-lg font-bold text-amber-500">{pendingCount}</span>
              </button>
              <button onClick={() => setFilters(f => ({ ...f, favorites: true, pending: false }))} className="glass-cyber px-4 py-2 flex flex-col items-center hover:bg-primary/5 transition-colors">
                <span className="text-[9px] text-muted-foreground uppercase font-mono">Pinned</span>
                <span className="text-lg font-bold text-emerald-500">{data.progress.filter(p => p.favorite).length}</span>
              </button>
              <button onClick={() => setFilters(f => ({ ...f, pending: false, favorites: false }))} className="glass-cyber px-4 py-2 flex flex-col items-center hover:bg-primary/5 transition-colors">
                <span className="text-[9px] text-muted-foreground uppercase font-mono">Risk</span>
                <span className="text-lg font-bold text-rose-500">{100 - progressPercent}%</span>
              </button>
            </div>
            <Button onClick={() => setSettingsOpen(true)} variant="outline" className="border-primary/20 hover:bg-primary/10 text-[10px] font-bold h-10 px-4">
              <Settings size={14} className="mr-2" /> OPS
            </Button>
            <ThemeToggle className="relative top-0 right-0" />
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <aside className="space-y-6 lg:sticky lg:top-8">
            <div className="glass-cyber p-4 space-y-4">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                <Filter size={14} /> Matrix Control
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Node Search..." className="pl-8 bg-slate-900/50 border-primary/20 font-mono text-xs h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Category</label>
                  <select className="w-full bg-slate-900 border border-primary/20 rounded p-1.5 text-xs text-foreground font-mono" onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={filters.favorites ? "default" : "outline"} onClick={() => setFilters(f => ({...f, favorites: !f.favorites}))} className="flex-1 text-[10px] h-7 font-bold">
                    <Star size={12} className="mr-1" /> STARRED
                  </Button>
                  <Button size="sm" variant={filters.pending ? "default" : "outline"} onClick={() => setFilters(f => ({...f, pending: !f.pending}))} className="flex-1 text-[10px] h-7 font-bold">
                    ACTIVE
                  </Button>
                </div>
                <Button onClick={() => setCustomServiceModal(true)} variant="outline" className="w-full border-dashed border-primary/40 text-[10px] h-9 font-bold hover:bg-primary/5">
                  <Plus size={14} className="mr-1" /> INJECT NODE
                </Button>
              </div>
            </div>
            <div className="glass-cyber p-4 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Terminal size={40} />
              </div>
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                <Terminal size={14} /> Neural Status
              </div>
              <div className="space-y-2 font-mono text-[9px]">
                <div className="flex justify-between border-b border-primary/10 pb-1">
                  <span className="text-muted-foreground">LMP_LINK</span>
                  <span className="text-emerald-500">ENCRYPTED</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-1">
                  <span className="text-muted-foreground">NODES</span>
                  <span className="text-primary">{data.services.length}</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-1">
                  <span className="text-muted-foreground">UPTIME</span>
                  <span className="text-primary">100.0%</span>
                </div>
              </div>
            </div>
          </aside>
          <main className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-950/50 border border-primary/20 p-1 w-full flex justify-start h-auto gap-2 backdrop-blur-sm">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-xs px-8 py-2.5 rounded-none font-display">Service Matrix</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-xs px-8 py-2.5 rounded-none font-display">Episodic Logs</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="pt-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredServices.map(service => {
                      const progress = data.progress.find(p => p.id === service.id);
                      const indicatorClass = `card-indicator-${service.difficulty}`;
                      return (
                        <motion.div layout key={service.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                          <Card className={`glass-cyber overflow-hidden group transition-all duration-300 ${indicatorClass} ${progress?.done ? 'opacity-30 grayscale blur-[0.5px]' : 'hover:border-primary/50'}`}>
                            <CardContent className="p-4 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors font-display uppercase">{service.name}</h3>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-[8px] h-4 border-primary/30 uppercase font-mono">{service.category}</Badge>
                                    <Badge variant="outline" className={`text-[8px] h-4 border-current uppercase font-mono ${service.isImpossible ? 'badge-impossible' : ''}`}>
                                      {service.isImpossible ? 'IMPOSSIBLE' : service.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => toggleStatus(service.id, 'favorite')} className={`p-1.5 rounded-md transition-all ${progress?.favorite ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-600 hover:text-slate-400'}`}>
                                    <Star size={16} fill={progress?.favorite ? "currentColor" : "none"} />
                                  </button>
                                  <button onClick={() => toggleStatus(service.id, 'done')} className={`p-1.5 rounded-md transition-all ${progress?.done ? 'text-primary bg-primary/10' : 'text-slate-600 hover:text-primary/50'}`}>
                                    <CheckCircle2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" onClick={() => window.open(service.url, '_blank')} className="flex-1 bg-slate-950 text-[10px] h-8 border-primary/20 font-bold hover:bg-slate-900 font-mono">
                                  <ExternalLink size={12} className="mr-2" /> PORTAL
                                </Button>
                                <Button onClick={() => generateEmail(service, 'gdpr')} className="flex-1 bg-primary text-background hover:bg-primary/90 text-[10px] h-8 font-bold font-mono">
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
              </TabsContent>
              <TabsContent value="logs" className="pt-4">
                <div className="glass-cyber rounded-none overflow-hidden divide-y divide-primary/10">
                  {data.logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-primary/5 transition-colors flex gap-6 font-mono text-xs">
                      <span className="text-muted-foreground shrink-0 w-24">{formatDistanceToNow(log.timestamp)} ago</span>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[8px] h-4 px-1 rounded-none border-primary/40 uppercase">{log.type.replace('_', ' ')}</Badge>
                           {log.metadata?.templateType && <Badge className="text-[7px] h-3 px-1 bg-primary/20 text-primary uppercase">{log.metadata.templateType}</Badge>}
                        </div>
                        <p className="text-slate-300 leading-relaxed font-mono">{log.content}</p>
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-2xl glass-cyber p-0 space-y-0 overflow-hidden">
              <div className="flex justify-between items-center bg-primary text-background p-4">
                <h2 className="text-xl font-bold font-display uppercase tracking-widest flex items-center gap-2">
                   <Terminal size={20} /> DRAFT_PROTOCOL: {selectedService.name}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setEmailModal(false)} className="hover:bg-background/20 text-background"><X /></Button>
              </div>
              <Tabs value={activeProtocol} onValueChange={(v) => generateEmail(selectedService, v as TemplateType)} className="w-full">
                <TabsList className="bg-slate-900 w-full rounded-none h-12 p-0 border-b border-primary/20">
                   <TabsTrigger value="gdpr" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full font-bold text-xs rounded-none border-r border-primary/20">GDPR ARTICLE 17</TabsTrigger>
                   <TabsTrigger value="ccpa" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary h-full font-bold text-xs rounded-none">CCPA RIGHT TO DELETE</TabsTrigger>
                </TabsList>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-950 p-4 border border-primary/10 rounded font-mono text-[10px] flex items-center gap-2 text-primary">
                    <AlertTriangle size={14} /> DRAFT_BUFFER ENCRYPTED WITH LMP v5.0
                  </div>
                  <textarea 
                    className="w-full h-80 bg-black/50 border border-primary/20 rounded-none p-6 font-mono text-xs text-slate-300 focus:ring-1 focus:ring-primary outline-none resize-none custom-scrollbar" 
                    value={emailDraft} 
                    onChange={(e) => setEmailDraft(e.target.value)} 
                  />
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                    <Button variant="outline" className="border-primary/20 font-bold text-[10px] h-10 rounded-none" onClick={async () => {
                      await navigator.clipboard.writeText(emailDraft);
                      toast.success("CONTENT COPIED TO NEURAL BUFFER");
                    }}><Copy size={14} className="mr-2" /> COPY BUFFER</Button>
                    <Button className="bg-primary text-background font-bold text-[10px] h-10 rounded-none" onClick={() => {
                      const mailto = `mailto:${selectedService.privateEmail || ''}?subject=${encodeURIComponent(activeProtocol === 'gdpr' ? 'Right to Erasure Request' : 'CCPA Right to Delete Request')} - ${selectedService.name}&body=${encodeURIComponent(emailDraft)}`;
                      window.location.href = mailto;
                    }}>
                      <Mail size={14} className="mr-2" /> DISPATCH VIA LOCAL SMTP
                    </Button>
                  </div>
                </div>
              </Tabs>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="bg-slate-950 border-l border-primary/30 w-full sm:max-w-md text-foreground glass-cyber">
          <SheetHeader className="space-y-1 mb-8">
            <SheetTitle className="text-2xl font-display font-bold text-primary uppercase tracking-tighter">OPERATIONS_PANEL</SheetTitle>
            <SheetDescription className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest">Identity Sync & Protocol Config</SheetDescription>
          </SheetHeader>
          {editingIdentity && (
            <div className="space-y-6">
               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-primary font-bold uppercase font-mono">Operator ID</label>
                    <Input value={editingIdentity.userName} className="bg-black/40 border-primary/20 font-mono text-xs h-10 rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, userName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-primary font-bold uppercase font-mono">Uplink Email</label>
                    <Input value={editingIdentity.email} className="bg-black/40 border-primary/20 font-mono text-xs h-10 rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, email: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-primary font-bold uppercase font-mono">Full Legal Name</label>
                    <Input value={editingIdentity.fullName} className="bg-black/40 border-primary/20 font-mono text-xs h-10 rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, fullName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-primary font-bold uppercase font-mono">Access Key</label>
                    <Input type="password" value={editingIdentity.apiKey} className="bg-black/40 border-primary/20 font-mono text-xs h-10 rounded-none" onChange={(e) => setEditingIdentity({...editingIdentity, apiKey: e.target.value})} />
                  </div>
               </div>
               <div className="pt-6 border-t border-primary/20 space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/10 space-y-2">
                    <h4 className="text-[10px] font-bold uppercase text-primary">Protocol Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex flex-col">
                          <span className="text-[8px] text-muted-foreground uppercase">Sync Count</span>
                          <span className="text-xl font-bold font-display">{data.progress.length}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] text-muted-foreground uppercase">LMP Integrity</span>
                          <span className="text-xl font-bold font-display">99.9%</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSettingsOpen(false)} className="flex-1 text-[10px] font-bold h-11 rounded-none border-primary/20 uppercase">Abort</Button>
                    <Button className="flex-1 bg-primary text-background font-bold text-[10px] h-11 rounded-none uppercase" onClick={async () => {
                      await api('/api/oblivion/identity', { method: 'POST', body: JSON.stringify(editingIdentity) });
                      toast.success("IDENTITY UPLINK COMPLETE");
                      setSettingsOpen(false);
                      fetchProtocolData();
                    }}>Sync LMP</Button>
                  </div>
               </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <AnimatePresence>
        {customServiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setCustomServiceModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md glass-cyber p-0 space-y-0 overflow-hidden">
              <div className="bg-primary text-background p-4 flex justify-between items-center">
                 <h2 className="text-xl font-bold font-display uppercase tracking-tighter">Inject_Custom_Node</h2>
                 <Button variant="ghost" size="icon" onClick={() => setCustomServiceModal(false)} className="hover:bg-background/20 text-background"><X /></Button>
              </div>
              <div className="p-6 space-y-6 bg-slate-950/40">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-primary uppercase font-bold">Node Name</label>
                    <Input placeholder="e.g. Obscure Forum v1" className="bg-black/50 border-primary/20 font-mono text-xs h-10 rounded-none" value={newCustomSvc.name} onChange={e => setNewCustomSvc({...newCustomSvc, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-primary uppercase font-bold">Root URL</label>
                    <Input placeholder="https://hidden-service.net/..." className="bg-black/50 border-primary/20 font-mono text-xs h-10 rounded-none" value={newCustomSvc.url} onChange={e => setNewCustomSvc({...newCustomSvc, url: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-primary uppercase font-bold">Category</label>
                      <select className="w-full bg-black/50 border border-primary/20 rounded-none h-10 px-2 text-xs text-foreground font-mono" value={newCustomSvc.category} onChange={e => setNewCustomSvc({...newCustomSvc, category: e.target.value})}>
                        {['SaaS', 'Social', 'FinTech', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-primary uppercase font-bold">Risk Level</label>
                      <select className="w-full bg-black/50 border border-primary/20 rounded-none h-10 px-2 text-xs text-foreground font-mono" value={newCustomSvc.difficulty} onChange={e => setNewCustomSvc({...newCustomSvc, difficulty: e.target.value as any})}>
                        {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                  <Button variant="ghost" onClick={() => setCustomServiceModal(false)} className="text-[10px] h-10 rounded-none font-bold uppercase">Decline</Button>
                  <Button onClick={addCustomService} className="bg-primary text-background font-bold text-[10px] h-10 px-8 rounded-none uppercase">Initialize Injection</Button>
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