import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Wand2, ShieldCheck, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LMPVisualizer } from '@/components/ui/lmp-visualizer';
import { EventTimeline } from '@/components/ui/event-timeline';
import { api } from '@/lib/api-client';
import { Session, MemoryLayer, DeletionEvent, SemanticTemplate } from '@shared/types';
import { toast, Toaster } from 'sonner';
export function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session & { events: DeletionEvent[] } | null>(null);
  const [activeLayer, setActiveLayer] = useState<MemoryLayer>('ephemeral');
  const [isProcessing, setIsProcessing] = useState(false);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if (sessionId) fetchSession();
  }, [sessionId]);
  const fetchSession = async () => {
    try {
      const data = await api<any>(`/api/sessions/${sessionId}`);
      setSession(data);
      setDraft(data.currentDraft || '');
    } catch (err) {
      toast.error('Session not found');
      navigate('/');
    }
  };
  const enhanceDraft = async () => {
    if (!session) return;
    setIsProcessing(true);
    setActiveLayer('semantic');
    try {
      // Simulate protocol thinking time
      await new Promise(r => setTimeout(r, 1200));
      const res = await api<SemanticTemplate>('/api/enhance-email', {
        method: 'POST',
        body: JSON.stringify({ service: session.targetService })
      });
      setDraft(res.template);
      setActiveLayer('ephemeral');
      await api(`/api/sessions/${sessionId}/checkpoint`, {
        method: 'POST',
        body: JSON.stringify({ type: 'draft_generated', content: `Enhanced draft for ${session.targetService} using semantic template ${res.id}` })
      });
      toast.success('LMP Enrichment Complete');
      fetchSession();
    } catch (err) {
      toast.error('Failed to access semantic layer');
    } finally {
      setIsProcessing(false);
    }
  };
  const checkpoint = async (type: string, content: string) => {
    setIsProcessing(true);
    setActiveLayer('episodic');
    try {
      await api(`/api/sessions/${sessionId}/checkpoint`, {
        method: 'POST',
        body: JSON.stringify({ type, content })
      });
      fetchSession();
    } finally {
      setIsProcessing(false);
      setActiveLayer('ephemeral');
    }
  };
  if (!session) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-6">
        <nav className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2" size={16} />
            Exit Protocol
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[10px] font-mono text-slate-300">SESSION SECURED</span>
            </div>
          </div>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <section className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-display font-bold">{session.targetService} Protocol</h2>
                  <p className="text-sm text-muted-foreground font-mono mt-1">Ref: {session.id}</p>
                </div>
                <Button 
                  onClick={enhanceDraft} 
                  disabled={isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-500 font-mono text-xs"
                >
                  <Wand2 size={16} className="mr-2" />
                  ENHANCE CONTEXT
                </Button>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000"></div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="relative w-full h-[400px] bg-slate-950 border border-slate-800 rounded-xl p-6 font-mono text-sm text-slate-300 resize-none focus:ring-2 focus:ring-blue-500/50 outline-none leading-relaxed"
                  placeholder="Drafting deletion request..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  className="border-slate-800 text-slate-400 font-mono"
                  onClick={() => checkpoint('manual_update', 'Draft saved manually')}
                >
                  CHECKPOINT
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500 font-mono">
                  <Send size={16} className="mr-2" />
                  EXECUTE REQUEST
                </Button>
              </div>
            </section>
          </div>
          <aside className="lg:col-span-4 space-y-6">
            <LMPVisualizer activeLayer={activeLayer} isProcessing={isProcessing} />
            <Card className="bg-slate-950 border-slate-800 text-slate-300">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded bg-blue-500/10 text-blue-500">
                  <Cpu size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Latency</p>
                  <p className="text-sm font-mono font-bold">142ms <span className="text-emerald-500">STABLE</span></p>
                </div>
              </CardContent>
            </Card>
          </aside>
          <section className="lg:col-span-12">
            <EventTimeline events={session.events} />
          </section>
        </div>
      </div>
      <Toaster richColors position="top-center" theme="dark" />
    </div>
  );
}