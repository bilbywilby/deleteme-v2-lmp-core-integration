import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, AlertTriangle, Layers, Terminal } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';
import { api } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LMPVisualizer } from '@/components/ui/lmp-visualizer';
import { EventTimeline } from '@/components/ui/event-timeline';
import { toast, Toaster } from 'sonner';
import { Service, ServiceProgress, Identity, DeletionEvent, TemplateType } from '@shared/types';
import { useSession, useCheckpoint, useSemanticEmailEnhancement, useMemoryRetrieval, useSemanticClusters } from '@/hooks/use-lmp';
import { UIProvider, useUI } from '@/context/UIContext';
// New Modular Components
import { ProtocolHeader } from '@/components/protocol/ProtocolHeader';
import { ControlPanel } from '@/components/protocol/ControlPanel';
import { ServiceCard } from '@/components/protocol/ServiceCard';
import { EmailDraftModal } from '@/components/protocol/EmailDraftModal';
function OblivionAppContent() {
  const { session, loading: sessionLoading } = useSession();
  const { search, filters, activeTab, setActiveTab } = useUI();
  const [data, setData] = useState<{ services: Service[]; progress: ServiceProgress[]; identity: Identity; logs: DeletionEvent[] } | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [activeProtocol, setActiveProtocol] = useState<TemplateType>('gdpr');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const { enhance, isEnhancing } = useSemanticEmailEnhancement();
  const { results: memoryResults, retrieve: retrieveMemory, loading: memLoading } = useMemoryRetrieval(session, selectedService);
  const { analyze: analyzeTrends, clusters: trends } = useSemanticClusters();
  const { saveCheckpoint, isSyncing, hasConflict, setHasConflict, resolution } = useCheckpoint(session, () => {
    toast.error("PROTOCOL COLLISION DETECTED");
  });
  const fetchData = useCallback(async () => {
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
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (data && !appLoading) {
      const timer = setTimeout(() => saveCheckpoint('progress', data.progress), 3000);
      return () => clearTimeout(timer);
    }
  }, [data, saveCheckpoint, appLoading]);
  useEffect(() => {
    if (activeTab === 'logs') analyzeTrends();
  }, [activeTab, analyzeTrends]);
  const handleEnhance = useCallback(async (service: Service) => {
    setSelectedService(service);
    setEmailModal(true);
    setEmailDraft('');
    const res = await enhance(service.id, activeProtocol, service.name);
    if (res) {
      setEmailDraft(res.content);
      setConfidence(res.confidence);
      retrieveMemory(['semantic', 'episodic', 'parametric']);
      fetchData();
    }
  }, [enhance, activeProtocol, retrieveMemory, fetchData]);
  useKeyboardShortcut('Escape', () => setEmailModal(false));
  useKeyboardShortcut('e', () => {
    if (selectedService && !emailModal) handleEnhance(selectedService);
  });
  const filteredMatrix = useMemo(() => {
    if (!data) return [];
    return data.services.filter(s => {
      const p = data.progress.find(pr => pr.id === s.id);
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filters.category === 'All' || s.category === filters.category;
      const matchesDiff = filters.difficulty === 'All' || s.difficulty === filters.difficulty;
      return matchesSearch && matchesCat && matchesDiff && (!filters.favorites || p?.favorite) && (!filters.pending || !p?.done);
    });
  }, [data, search, filters]);
  if (sessionLoading || appLoading || !data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-background cyber-grid scanline">
      <div className="relative glass-cyber p-4 rounded-lg border-primary/30 animate-pulse">
        <Terminal className="w-8 h-8 text-neon" />
      </div>
      <div className="mt-8 text-center space-y-4">
        <h2 className="text-primary font-display font-bold tracking-[0.4em] uppercase text-xl text-neon">INITIALIZING_ZENITH</h2>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-mono">
           <Globe size={12} className="animate-spin text-primary" />
           <span>NEURAL_HANDSHAKE_ACTIVE</span>
        </div>
      </div>
    </div>
  );
  const progressPercent = data.services.length > 0
    ? (data.progress.filter(p => p.done).length / data.services.length) * 100
    : 0;
  return (
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-24 grain">
      <AnimatePresence>
        {hasConflict && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} className="bg-amber-500 text-black py-2 px-4 flex justify-between items-center font-mono text-xs font-bold sticky top-0 z-[200]">
            <div className="flex items-center gap-2"><AlertTriangle size={14} /> {resolution || "VERSION_CONFLICT"}</div>
            <div className="flex gap-4">
              <button onClick={() => window.location.reload()} className="underline">RE-SYNC</button>
              <button onClick={() => setHasConflict(false)} className="underline">IGNORE</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProtocolHeader 
          session={session} 
          isSyncing={isSyncing} 
          onOpenSettings={() => setSettingsOpen(true)} 
        />
        <Progress value={progressPercent} className="h-1 bg-slate-900 border border-primary/10 rounded-none mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <ControlPanel />
            <LMPVisualizer activeLayer={memoryResults[0]?.layer} isProcessing={memLoading || isEnhancing} />
            {trends.length > 0 && (
              <div className="glass-cyber p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border-b border-emerald-500/10 pb-2">
                  <Layers size={12} /> Trend Analysis
                </div>
                {trends.map((t: any, idx: number) => (
                  <div key={idx} className="text-[9px] font-mono text-slate-400 bg-emerald-500/5 p-2 border-l border-emerald-500/30">
                    <span className="text-emerald-500 font-bold uppercase block mb-1">PATTERN: {t.id}</span>
                    {t.summary}
                  </div>
                ))}
              </div>
            )}
          </aside>
          <main className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950/50 border border-primary/10 p-1 w-full flex justify-start h-auto gap-2 rounded-none mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Target Matrix</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Event Stream</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredMatrix.map(service => (
                    <ServiceCard 
                      key={service.id} 
                      service={service} 
                      progress={data.progress.find(p => p.id === service.id)}
                      isSelected={selectedService?.id === service.id}
                      onClick={() => setSelectedService(service)}
                      onEnhance={handleEnhance}
                    />
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="logs" className="mt-0">
                <EventTimeline events={data.logs} />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
      <EmailDraftModal 
        isOpen={emailModal}
        onClose={() => setEmailModal(false)}
        serviceName={selectedService?.name ?? ''}
        draft={emailDraft}
        confidence={confidence}
        isEnhancing={isEnhancing}
        onDraftChange={setEmailDraft}
      />
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="bg-slate-950 border-l border-primary/20 w-full sm:max-w-md text-foreground glass-cyber">
          <SheetHeader className="mb-8"><h2 className="text-2xl font-display font-bold text-primary uppercase text-neon">Identity_Sync</h2></SheetHeader>
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
                className="w-full bg-primary text-background font-bold text-[10px] h-12 rounded-none uppercase hover:bg-primary/90 transition-colors"
                onClick={async () => {
                  try {
                    await api('/api/oblivion/identity', { method: 'POST', body: JSON.stringify(editingIdentity) });
                    toast.success("IDENTITY SYNCHRONIZED");
                    setSettingsOpen(false);
                    fetchData();
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
export function OblivionApp() {
  return (
    <UIProvider>
      <OblivionAppContent />
    </UIProvider>
  );
}