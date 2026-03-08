import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Layers, Terminal, Globe } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcuts';
import { api } from '@/lib/api-client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LMPVisualizer } from '@/components/ui/lmp-visualizer';
import { EventTimeline } from '@/components/ui/event-timeline';
import { toast, Toaster } from 'sonner';
import { Service, ServiceProgress, Identity, DeletionEvent, TemplateType } from '@shared/types';
import { useSession, useCheckpoint, useSemanticEmailEnhancement, useMemoryRetrieval, useSemanticClusters } from '@/hooks/use-lmp';
import { UIProvider, useUI } from '@/context/UIContext';
import { ProtocolHeader } from '@/components/protocol/ProtocolHeader';
import { ControlPanel } from '@/components/protocol/ControlPanel';
import { ServiceGrid } from '@/components/protocol/ServiceGrid';
import { EmailDraftModal } from '@/components/protocol/EmailDraftModal';
import { SettingsDrawer } from '@/components/protocol/SettingsDrawer';
function OblivionAppContent() {
  const { session, loading: sessionLoading } = useSession();
  const { search, filters, activeTab, setActiveTab } = useUI();
  const [data, setData] = useState<{ services: Service[]; progress: ServiceProgress[]; identity: Identity; logs: DeletionEvent[] } | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [emailModal, setEmailModal] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [activeProtocol] = useState<TemplateType>('gdpr');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
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
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (data && !appLoading) {
      const timer = setTimeout(() => saveCheckpoint('progress', data.progress), 3000);
      return () => clearTimeout(timer);
    }
  }, [data?.progress, saveCheckpoint, appLoading]);
  useEffect(() => {
    if (activeTab === 'logs') analyzeTrends();
  }, [activeTab, analyzeTrends]);
  const handleEnhance = useCallback(async (service: Service) => {
    if (!service) return;
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
    <div className="min-h-screen bg-background text-foreground cyber-grid scanline pb-24 grain overflow-x-hidden">
      <AnimatePresence>
        {hasConflict && (
          <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} className="bg-amber-500 text-black py-2 px-4 flex justify-between items-center font-mono text-xs font-bold sticky top-0 z-[200]">
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
            {trends && trends.length > 0 && (
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
          <main className="lg:col-span-3 min-h-[600px]" ref={containerRef}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-950/50 border border-primary/10 p-1 w-full flex justify-start h-auto gap-2 rounded-none mb-6">
                <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Target Matrix</TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-background uppercase font-bold text-[10px] px-8 py-3 rounded-none font-display">Event Stream</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="mt-0 outline-none">
                {containerWidth > 0 && (
                  <ServiceGrid
                    services={filteredMatrix}
                    progressData={data.progress}
                    selectedServiceId={selectedService?.id}
                    width={containerWidth}
                    onSelect={setSelectedService}
                    onEnhance={handleEnhance}
                  />
                )}
              </TabsContent>
              <TabsContent value="logs" className="mt-0 outline-none">
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
      <SettingsDrawer
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
        identity={editingIdentity}
        onIdentityUpdate={setEditingIdentity}
        onSuccess={fetchData}
      />
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