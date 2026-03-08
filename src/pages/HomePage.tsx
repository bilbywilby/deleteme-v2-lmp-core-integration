import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Activity, Zap, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { api } from '@/lib/api-client';
import { Session } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { toast, Toaster } from 'sonner';
export function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    fetchSessions();
  }, []);
  const fetchSessions = async () => {
    try {
      const data = await api<Session[]>('/api/sessions');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const startProtocol = async () => {
    if (!target) return toast.error('Enter a target service');
    try {
      const sess = await api<Session>('/api/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ targetService: target })
      });
      toast.success('Protocol Initialized');
      navigate(`/session/${sess.id}`);
    } catch (err) {
      toast.error('Failed to start protocol');
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
              <Activity size={14} className="animate-pulse" />
              SYSTEM STATUS: NOMINAL
            </div>
            <h1 className="text-4xl font-display font-bold">LMP Command Center</h1>
            <p className="text-muted-foreground text-lg">Orchestrate deletion workflows with layered memory persistence.</p>
          </div>
          <ThemeToggle className="relative top-0 right-0" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-slate-950 border-slate-800 text-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus size={20} className="text-blue-500" />
                Initialize Protocol
              </CardTitle>
              <CardDescription className="text-slate-400">
                Start a new context-aware deletion session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="Service Name (e.g. Facebook, X, Google)"
                  className="flex-1 bg-slate-900 border-slate-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                />
                <Button onClick={startProtocol} className="bg-blue-600 hover:bg-blue-500 text-white font-mono">
                  ACTIVATE
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Zap size={16} className="text-orange-500" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs text-muted-foreground">Parametric</span>
                <span className="text-xs font-mono">1.2k Rules</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full w-[45%]" />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-muted-foreground">Semantic</span>
                <span className="text-xs font-mono">84% Precision</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[84%]" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock size={20} className="text-slate-500" />
            Active Protocols
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-900 animate-pulse rounded-xl border border-slate-800" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-muted-foreground">No active protocols found. Start one above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => navigate(`/session/${sess.id}`)}
                  className="group relative text-left bg-slate-900/40 hover:bg-slate-900 border border-slate-800 p-5 rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/5 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} className="text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-100">{sess.targetService}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">ID: {sess.id.slice(0, 8)}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} />
                      {formatDistanceToNow(sess.lastActive)} ago
                    </div>
                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                      {sess.status.toUpperCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Toaster richColors position="bottom-right" theme="dark" />
    </div>
  );
}