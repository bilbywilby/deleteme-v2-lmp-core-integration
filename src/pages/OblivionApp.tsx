import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Search, Filter, Star, CheckCircle2,
  ExternalLink, Mail, Terminal, Settings, User, Copy, X, Dog, Plus, ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast, Toaster } from 'sonner';
import { Service, ServiceProgress, Identity, DeletionEvent, CustomService } from '@shared/types';
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
  const [configModal, setConfigModal] = useState(false);
  const [customServiceModal, setCustomServiceModal] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const [newCustomSvc, setNewCustomSvc] = useState<Partial<CustomService>>({ name: '', category: 'SaaS', difficulty: 'medium', contactMethod: 'email', url: '', waitDays: 30 });
  useEffect(() => { 
    const timer = setTimeout(() => setIsSplashVisible(false), 1500);
    fetchProtocolData();
    return () => clearTimeout(timer);
  }, []);
  const fetchProtocolData = async () => {
    try {
      const res = await api<any>('/api/oblivion/data');
      setData(res);
      setEditingIdentity(res.identity);
      // Sync LocalStorage to LMP if needed (One-time migration)
      const legacyFavs = localStorage.getItem('oblivion_favs');
      if (legacyFavs && res.progress.length === 0) {
        const favIds = JSON.parse(legacyFavs) as string[];
        for (const id of favIds) {
          await api('/api/oblivion/progress', { method: 'POST', body: JSON.stringify({ id, favorite: true }) });
        }
        fetchProtocolData();
      }
    } catch (e) {
      toast.error("PROTOCOL UPLINK FAILED");
    } finally {
      setLoading(false);
    }
  };
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
  const generateEmail = async (service: Service) => {
    setSelectedService(service);
    setEmailModal(true);
    try {
      const res = await api<{ content: string }>('/api/enhance-email', {
        method: 'POST',
        body: JSON.stringify({ serviceId: service.id, type: 't-gdpr' })
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
          <h2 className="text-primary font-display font-bold tracking-[0.3em] uppercase glitch-entry">OBLIVION V5</h2>
          <div className="h-[1px] w-48 bg-primary/20 mx-auto overflow-hidden">
            <motion.div initial={{ x: -200 }} animate={{ x: 200 }} transition={{ duration: 1.5, repeat: Infinity }} className="h-full w-24 bg-primary" />
          </div>
          <p className="text-[10px] text-muted-foreground font-mono animate-pulse">ESTABLISHING SECURE PROTOCOL...</p>
        </div>
      </motion.div>
    </div>
  );
  if (loading || !data) return null;
  const doneCount = data.progress.filter(p => p.done).length;
  const progressPercent = Math.round((doneCount / data.services.length) * 100);
  const getDifficultyClass = (diff: string) => {
    switch(diff) {
      case 'easy': return 'text-emerald-500 card-glow-emerald';
      case 'medium': return 'text-amber-500 card-glow-amber';
      case 'hard': return 'text-rose-500 card-glow-rose';
      default: return 'text-slate-400';
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-20 grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <HuskyLogo />
            <div className="space-y-1">
              <h1 className="text-4xl font-bold font-display tracking-tighter text-neon">OBLIVION <span className="text-muted-foreground font-light text-2xl">v5.0</span></h1>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-mono">Identity Erasure & Memory Management</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={() => setCustomServiceModal(true)} variant="outline" className="border-primary/20 hover:bg-primary/10 text-[10px] font-bold h-10">
              <Plus size={14} className="mr-2" /> ADD NODE
            </Button>
            <div className="glass-cyber px-4 py-2 flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Risk Index</span>
              <span className="text-xl font-bold text-rose-500">{100 - progressPercent}%</span>
            </div>
            <ThemeToggle className="relative top-0 right-0" />
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <aside className="space-y-6 lg:sticky lg:top-8">
            <div className="glass-cyber p-4 space-y-4">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                <Filter size={14} /> Matrix Filters
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Search Node..." className="pl-8 bg-slate-900/50 border-primary/20 font-mono text-xs h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Category</label>
                  <select className="w-full bg-slate-900 border border-primary/20 rounded p-1.5 text-xs text-foreground font-mono" onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={filters.favorites ? "default" : "outline"} onClick={() => setFilters(f => ({...f, favorites: !f.favorites}))} className="flex-1 text-[10px] h-7">
                    <Star size={12} className="mr-1" /> FAVS
                  </Button>
                  <Button size="sm" variant={filters.pending ? "default" : "outline"} onClick={() => setFilters(f => ({...f, pending: !f.pending}))} className="flex-1 text-[10px] h-7">
                    PENDING
                  </Button>
                </div>
              </div>
            </div>
            <div className="glass-cyber p-4">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                <User size={14} /> Identity Profile
              </div>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between border-b border-primary/10 pb-1 uppercase">
                  <span className="text-muted-foreground">OPERATOR</span>
                  <span className="text-primary">{data.identity.userName || 'UNIDENTIFIED'}</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-1">
                  <span className="text-muted-foreground">EMAIL</span>
                  <span className="truncate max-w-[120px]">{data.identity.email}</span>
                </div>
                <Button onClick={() => setConfigModal(true)} variant="outline" size="sm" className="w-full text-[10px] h-8 border-primary/20 hover:bg-primary/10 mt-2">
                  <Settings size={12} className="mr-1" /> CONFIGURE IDENTITY
                </Button>
              </div>
            </div>
          </aside>
          <main className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-900 border border-primary/20 p-1 w-full flex justify-start h-auto gap-2">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-xs px-6 py-2">Services Grid</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-xs px-6 py-2">Episodic Stream</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredServices.map(service => {
                      const progress = data.progress.find(p => p.id === service.id);
                      const glowClass = getDifficultyClass(service.difficulty);
                      return (
                        <motion.div layout key={service.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                          <Card className={`glass-cyber overflow-hidden group transition-all duration-300 ${progress?.done ? 'opacity-40 grayscale' : 'hover:border-primary/50'} ${glowClass}`}>
                            <CardContent className="p-4 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors font-display">{service.name}</h3>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[8px] h-4 border-primary/30 uppercase font-mono">{service.category}</Badge>
                                    <Badge variant="outline" className={`text-[8px] h-4 border-current uppercase font-mono ${glowClass}`}>{service.difficulty}</Badge>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => toggleStatus(service.id, 'favorite')} className={`p-1.5 rounded-md transition-all ${progress?.favorite ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-600'}`}>
                                    <Star size={16} fill={progress?.favorite ? "currentColor" : "none"} />
                                  </button>
                                  <button onClick={() => toggleStatus(service.id, 'done')} className={`p-1.5 rounded-md transition-all ${progress?.done ? 'text-primary bg-primary/10' : 'text-slate-600'}`}>
                                    <CheckCircle2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" onClick={() => window.open(service.url, '_blank')} className="flex-1 bg-slate-950 text-[10px] h-8 border-primary/20 font-bold hover:bg-slate-900">
                                  <ExternalLink size={12} className="mr-2" /> PORTAL
                                </Button>
                                <Button onClick={() => generateEmail(service)} className="flex-1 bg-primary text-background hover:bg-primary/90 text-[10px] h-8 font-bold">
                                  <Mail size={12} className="mr-2" /> DRAFT
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
                <div className="glass-cyber rounded-lg overflow-hidden divide-y divide-primary/5">
                  {data.logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-primary/5 transition-colors flex gap-4 font-mono text-xs">
                      <span className="text-muted-foreground shrink-0">{formatDistanceToNow(log.timestamp)} ago</span>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[8px] h-4 px-1">{log.type.toUpperCase()}</Badge>
                        <p className="text-slate-300 leading-relaxed">{log.content}</p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setEmailModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl glass-cyber p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                <h2 className="text-xl font-bold text-primary font-display uppercase tracking-widest">Drafting Node: {selectedService.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => setEmailModal(false)} className="hover:text-primary"><X /></Button>
              </div>
              <textarea className="w-full h-80 bg-slate-950 border border-primary/20 rounded-lg p-6 font-mono text-xs text-slate-300 focus:ring-1 focus:ring-primary outline-none resize-none" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" className="border-primary/20" onClick={async () => {
                  await navigator.clipboard.writeText(emailDraft);
                  toast.success("CONTENT COPIED TO NEURAL BUFFER");
                }}><Copy size={14} className="mr-2" /> COPY BUFFER</Button>
                <Button className="bg-primary text-background" onClick={() => {
                  const mailto = `mailto:${selectedService.privateEmail || ''}?subject=Right to Erasure Request - ${selectedService.name}&body=${encodeURIComponent(emailDraft)}`;
                  window.location.href = mailto;
                }}>
                  <Mail size={14} className="mr-2" /> OPEN MAIL CLIENT
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        {customServiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setCustomServiceModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md glass-cyber p-6 space-y-6">
              <h2 className="text-xl font-bold text-primary font-display uppercase">Register Custom Node</h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Service Name</label>
                  <Input placeholder="e.g. My Old Blog" className="bg-slate-950 border-primary/20 font-mono text-xs" value={newCustomSvc.name} onChange={e => setNewCustomSvc({...newCustomSvc, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase">Target URL</label>
                  <Input placeholder="https://..." className="bg-slate-950 border-primary/20 font-mono text-xs" value={newCustomSvc.url} onChange={e => setNewCustomSvc({...newCustomSvc, url: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase">Category</label>
                    <select className="w-full bg-slate-950 border border-primary/20 rounded p-1.5 text-xs text-foreground font-mono" value={newCustomSvc.category} onChange={e => setNewCustomSvc({...newCustomSvc, category: e.target.value})}>
                      {['SaaS', 'Social', 'FinTech', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase">Difficulty</label>
                    <select className="w-full bg-slate-950 border border-primary/20 rounded p-1.5 text-xs text-foreground font-mono" value={newCustomSvc.difficulty} onChange={e => setNewCustomSvc({...newCustomSvc, difficulty: e.target.value as any})}>
                      {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                <Button variant="ghost" onClick={() => setCustomServiceModal(false)} className="text-[10px] h-8">CANCEL</Button>
                <Button onClick={addCustomService} className="bg-primary text-background font-bold text-[10px] h-8">INITIALIZE NODE</Button>
              </div>
            </motion.div>
          </div>
        )}
        {configModal && editingIdentity && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setConfigModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md glass-cyber p-6 space-y-6">
              <h2 className="text-xl font-bold text-primary font-display uppercase">Identity Sync</h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-mono">Operator ID</label>
                  <Input value={editingIdentity.userName} className="bg-slate-950 border-primary/20 font-mono text-xs" onChange={(e) => setEditingIdentity({...editingIdentity, userName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-mono">Primary Email</label>
                  <Input value={editingIdentity.email} className="bg-slate-950 border-primary/20 font-mono text-xs" onChange={(e) => setEditingIdentity({...editingIdentity, email: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-mono">Full Legal Name</label>
                  <Input value={editingIdentity.fullName} className="bg-slate-950 border-primary/20 font-mono text-xs" onChange={(e) => setEditingIdentity({...editingIdentity, fullName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-mono">LMP Access Key (UI Only)</label>
                  <Input type="password" value={editingIdentity.apiKey} className="bg-slate-950 border-primary/20 font-mono text-xs" onChange={(e) => setEditingIdentity({...editingIdentity, apiKey: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                <Button variant="ghost" onClick={() => setConfigModal(false)} className="text-[10px] h-8">ABORT</Button>
                <Button className="bg-primary text-background font-bold text-[10px] h-8" onClick={async () => {
                  await api('/api/oblivion/identity', { method: 'POST', body: JSON.stringify(editingIdentity) });
                  toast.success("IDENTITY UPLINK COMPLETE");
                  setConfigModal(false);
                  fetchProtocolData();
                }}>SYNC LMP</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster richColors position="bottom-right" theme="dark" />
    </div>
  );
}