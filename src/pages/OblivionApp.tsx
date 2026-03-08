import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Search, Filter, Star, CheckCircle2, 
  ExternalLink, Mail, Info, Terminal, Settings, AlertTriangle, 
  BarChart3, Database, History, User, Save, Copy
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast, Toaster } from 'sonner';
import { Service, ServiceProgress, Identity, DeletionEvent } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
export function OblivionApp() {
  const [data, setData] = useState<{ services: Service[]; progress: ServiceProgress[]; identity: Identity; logs: DeletionEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [filters, setFilters] = useState({ category: 'All', difficulty: 'All', favorites: false, pending: false });
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  useEffect(() => { fetchProtocolData(); }, []);
  const fetchProtocolData = async () => {
    try {
      const res = await api<any>('/api/oblivion/data');
      setData(res);
    } catch (e) { toast.error("PROTOCOL UPLINK FAILED"); }
    finally { setLoading(false); }
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
    } catch (e) { toast.error("SYNC FAILED"); }
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
    } catch (e) { toast.error("ENHANCEMENT FAILED"); }
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
  if (loading || !data) return (
    <div className="h-screen flex items-center justify-center bg-background cyber-grid">
      <div className="text-center space-y-4">
        <Terminal className="w-12 h-12 text-primary animate-pulse mx-auto" />
        <h2 className="text-primary font-mono tracking-widest uppercase">Initializing Oblivion v5...</h2>
      </div>
    </div>
  );
  const doneCount = data.progress.filter(p => p.done).length;
  const progressPercent = Math.round((doneCount / data.services.length) * 100);
  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tighter text-neon flex items-center gap-3">
              <Shield className="w-10 h-10" /> OBLIVION <span className="text-muted-foreground font-light">v5.0</span>
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-mono">
              Identity Erasure & Memory Management System
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="glass-cyber px-4 py-2 flex flex-col items-end">
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Risk Index</span>
              <span className="text-xl font-bold text-red-500">{100 - progressPercent}%</span>
            </div>
            <div className="glass-cyber px-4 py-2 flex flex-col min-w-[150px]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-muted-foreground uppercase font-mono">Progress</span>
                <span className="text-xs font-bold text-primary">{progressPercent}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
              </div>
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
                  <Input 
                    placeholder="Search Node..." 
                    className="pl-8 bg-slate-900/50 border-primary/20 font-mono text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Category</label>
                  <select 
                    className="w-full bg-slate-900 border border-primary/20 rounded p-1 text-xs text-foreground font-mono"
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Difficulty</label>
                  <div className="flex gap-1">
                    {['All', 'easy', 'medium', 'hard'].map(d => (
                      <button
                        key={d}
                        onClick={() => setFilters(f => ({ ...f, difficulty: d }))}
                        className={`flex-1 text-[8px] py-1 rounded border transition-colors uppercase font-bold ${filters.difficulty === d ? 'bg-primary text-background border-primary' : 'bg-slate-900 border-primary/20'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFilters(f => ({ ...f, favorites: !f.favorites }))}
                    className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 text-[10px] uppercase font-bold transition-all ${filters.favorites ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 'bg-slate-900 text-muted-foreground border border-primary/10'}`}
                  >
                    <Star size={10} /> Saved
                  </button>
                  <button 
                    onClick={() => setFilters(f => ({ ...f, pending: !f.pending }))}
                    className={`flex-1 py-1.5 rounded flex items-center justify-center gap-1 text-[10px] uppercase font-bold transition-all ${filters.pending ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-slate-900 text-muted-foreground border border-primary/10'}`}
                  >
                    <CheckCircle2 size={10} /> Pending
                  </button>
                </div>
              </div>
            </div>
            <div className="glass-cyber p-4">
              <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                <User size={14} /> Identity Profile
              </div>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between border-b border-primary/10 pb-1">
                  <span className="text-muted-foreground">NAME</span>
                  <span>{data.identity.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-1">
                  <span className="text-muted-foreground">EMAIL</span>
                  <span>{data.identity.email}</span>
                </div>
                <div className="flex justify-between border-b border-primary/10 pb-1">
                  <span className="text-muted-foreground">LOCATION</span>
                  <span className="truncate max-w-[120px]">{data.identity.address}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full text-[10px] h-7 border-primary/20 hover:bg-primary/10">
                  <Settings size={12} className="mr-1" /> CONFIGURE LMP
                </Button>
              </div>
            </div>
          </aside>
          <main className="lg:col-span-3 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-900 border border-primary/20 p-1 w-full flex justify-start h-auto gap-2">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-xs px-6 py-2">Services Grid</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-xs px-6 py-2">Episodic Stream</TabsTrigger>
                <TabsTrigger value="brokers" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-xs px-6 py-2">Data Brokers</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredServices.map(service => {
                      const progress = data.progress.find(p => p.id === service.id);
                      return (
                        <motion.div
                          layout
                          key={service.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <Card className={`glass-cyber overflow-hidden group transition-all duration-300 ${progress?.done ? 'opacity-50 grayscale hover:grayscale-0' : 'hover:border-primary/50 hover:shadow-primary/5'}`}>
                            <CardContent className="p-4 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{service.name}</h3>
                                  <Badge variant="outline" className="text-[8px] h-4 border-primary/30 uppercase font-mono">
                                    {service.category}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <button 
                                    onClick={() => toggleStatus(service.id, 'favorite')}
                                    className={`p-1.5 rounded-md transition-all ${progress?.favorite ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-600 hover:text-slate-400'}`}
                                  >
                                    <Star size={16} fill={progress?.favorite ? "currentColor" : "none"} />
                                  </button>
                                  <button 
                                    onClick={() => toggleStatus(service.id, 'done')}
                                    className={`p-1.5 rounded-md transition-all ${progress?.done ? 'text-primary bg-primary/10' : 'text-slate-600 hover:text-slate-400'}`}
                                  >
                                    <CheckCircle2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground uppercase">Difficulty</span>
                                  <span className={`font-bold uppercase ${service.difficulty === 'easy' ? 'text-emerald-500' : service.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {service.difficulty}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground uppercase">Method</span>
                                  <span className="text-slate-300 uppercase truncate">{service.contactMethod.replace('-', ' ')}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground uppercase">Confidence</span>
                                  <span className="text-slate-300 uppercase">{service.confidence}%</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground uppercase">Wait Time</span>
                                  <span className="text-slate-300 uppercase">{service.waitDays} Days</span>
                                </div>
                              </div>
                              {(service.requiresVerification || service.requiresDocs) && (
                                <div className="flex gap-2">
                                  {service.requiresVerification && <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-[8px] h-4">VERIF REQUIRED</Badge>}
                                  {service.requiresDocs && <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-[8px] h-4">DOCS NEEDED</Badge>}
                                </div>
                              )}
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  onClick={() => window.open(service.url, '_blank')}
                                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-[10px] h-8 border border-primary/20 font-bold"
                                >
                                  <ExternalLink size={12} className="mr-2" /> PORTAL
                                </Button>
                                <Button 
                                  onClick={() => generateEmail(service)}
                                  className="flex-1 bg-primary text-background hover:bg-primary/90 text-[10px] h-8 font-bold"
                                >
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
                <div className="glass-cyber rounded-lg overflow-hidden border-primary/20">
                  <div className="p-4 border-b border-primary/10 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Terminal size={14} /> Protocol Event History
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{data.logs.length} ENTRIES</span>
                  </div>
                  <div className="divide-y divide-primary/5 max-h-[600px] overflow-y-auto scrollbar-hide font-mono text-xs">
                    {data.logs.map((log, i) => (
                      <div key={log.id} className="p-4 hover:bg-primary/5 transition-colors flex gap-4">
                        <span className="text-muted-foreground shrink-0">{formatDistanceToNow(log.timestamp)} ago</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[8px] h-4 px-1 ${log.type === 'identity_update' ? 'text-yellow-500 border-yellow-500/30' : 'text-primary border-primary/30'}`}>
                              {log.type.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{log.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      <AnimatePresence>
        {emailModal && selectedService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
              onClick={() => setEmailModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl glass-cyber p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-primary uppercase">Draft: {selectedService.name}</h2>
                  <p className="text-[10px] text-muted-foreground font-mono">Template: GDPR Article 17 (Identity Auto-Injected)</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setEmailModal(false)}>✕</Button>
              </div>
              <textarea 
                className="w-full h-80 bg-slate-900 border border-primary/20 rounded-lg p-4 font-mono text-xs leading-relaxed text-slate-300 focus:ring-1 focus:ring-primary outline-none"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" className="border-primary/20 text-xs font-bold" onClick={async () => {
                  await navigator.clipboard.writeText(emailDraft);
                  toast.success("CONTENT COPIED TO CLIPBOARD");
                  await api('/api/oblivion/log', { method: 'POST', body: JSON.stringify({ type: 'draft_generated', content: `Copied deletion request draft for ${selectedService.name}` }) });
                  fetchProtocolData();
                }}>
                  <Copy size={14} className="mr-2" /> COPY
                </Button>
                <Button className="bg-primary text-background font-bold text-xs">
                  <ExternalLink size={14} className="mr-2" /> OPEN MAIL CLIENT
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toaster richColors position="bottom-right" theme="dark" />
    </div>
  );
}