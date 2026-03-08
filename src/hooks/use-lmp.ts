import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { 
  SessionCheckpoint, 
  MemoryRetrievalResult, 
  MemoryLayer, 
  DeletionEvent, 
  Service, 
  TemplateType 
} from '@shared/types';
export function useSession() {
  const [session, setSession] = useState<SessionCheckpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const initSession = useCallback(async () => {
    try {
      const res = await api<SessionCheckpoint>('/api/sessions/init', { method: 'POST' });
      setSession(res);
      return res;
    } catch (e) {
      toast.error("SESSION INITIALIZATION FAILED");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    initSession();
  }, [initSession]);
  return { session, setSession, loading };
}
export function useCheckpoint(session: SessionCheckpoint | null, onConflict: () => void) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const lastSavedRef = useRef<string>("");
  const saveCheckpoint = useCallback(async (state: any) => {
    if (!session || isSyncing) return;
    const stateStr = JSON.stringify(state);
    if (stateStr === lastSavedRef.current) return;
    setIsSyncing(true);
    try {
      const res = await api<SessionCheckpoint>('/api/checkpoints/save', {
        method: 'POST',
        body: JSON.stringify({ id: session.id, state, version: session.version })
      });
      lastSavedRef.current = stateStr;
      setHasConflict(false);
      return res;
    } catch (e: any) {
      if (e.message === "Conflict") {
        setHasConflict(true);
        onConflict();
      }
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [session, isSyncing, onConflict]);
  return { saveCheckpoint, isSyncing, hasConflict, setHasConflict };
}
export function useMemoryRetrieval(service: Service | null) {
  const [results, setResults] = useState<MemoryRetrievalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const retrieve = useCallback(async (layer: MemoryLayer) => {
    if (!service) return;
    setLoading(true);
    try {
      const res = await api<MemoryRetrievalResult[]>(`/api/memory/retrieve/${layer}`, {
        method: 'POST',
        body: JSON.stringify({ context: service.name + " " + service.category })
      });
      setResults(res);
    } catch (e) {
      toast.error(`MEM_ACCESS_DENIED: ${layer.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  }, [service]);
  return { results, retrieve, loading };
}
export function useSemanticEmailEnhancement() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const enhance = useCallback(async (serviceId: string, protocol: TemplateType, context?: string) => {
    setIsEnhancing(true);
    try {
      const res = await api<{ content: string; score: number }>('/api/enhance-email', {
        method: 'POST',
        body: JSON.stringify({ 
          serviceId, 
          templateId: protocol === 'gdpr' ? 't-gdpr' : 't-ccpa',
          context 
        })
      });
      return res;
    } catch (e) {
      toast.error("SEMANTIC_UPLINK_ERROR");
      return null;
    } finally {
      setIsEnhancing(false);
    }
  }, []);
  return { enhance, isEnhancing };
}