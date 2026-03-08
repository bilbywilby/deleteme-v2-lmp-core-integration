import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  SessionCheckpoint,
  MemoryResult,
  MemoryLayer,
  Service,
  TemplateType,
  SessionStartPayload,
  MemoryQuery
} from '@shared/types';
export function useSession() {
  const [session, setSession] = useState<SessionCheckpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const initSession = useCallback(async () => {
    const clientMeta = {
      browser: navigator.userAgent.includes("Chrome") ? "Chrome" : "Other",
      os: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: navigator.userAgent
    };
    try {
      const res = await api<SessionCheckpoint>('/api/sessions/start', {
        method: 'POST',
        body: JSON.stringify({ userId: 'main', clientMeta } as SessionStartPayload)
      });
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
export function useCheckpoint(session: SessionCheckpoint | null, onConflict: (res: any) => void) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [resolution, setResolution] = useState<string | null>(null);
  const lastSavedRef = useRef<string>("");
  const saveCheckpoint = useCallback(async (module: string, state: any) => {
    if (!session || isSyncing) return;
    const stateStr = JSON.stringify(state);
    if (stateStr === lastSavedRef.current) return;
    setIsSyncing(true);
    try {
      const res = await api<SessionCheckpoint>('/api/checkpoints/save', {
        method: 'POST',
        body: JSON.stringify({ id: session.id, module, state, version: session.version })
      });
      lastSavedRef.current = stateStr;
      setHasConflict(false);
      setResolution(null);
      return res;
    } catch (e: any) {
      if (e.message.includes("409")) {
        setHasConflict(true);
        try {
          const errData = JSON.parse(e.message.replace("409 ", ""));
          setResolution(errData.resolution);
          onConflict(errData);
        } catch (parseError) {
          setResolution("Concurrent update collision");
        }
      }
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [session, isSyncing, onConflict]);
  return { saveCheckpoint, isSyncing, hasConflict, setHasConflict, resolution };
}
export function useMemoryRetrieval(service: Service | null) {
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const retrieve = useCallback(async (layers: MemoryLayer[] = ['semantic', 'episodic']) => {
    if (!service) return;
    setLoading(true);
    try {
      const query: MemoryQuery = {
        sessionId: 'main',
        query: `${service.name} ${service.category}`,
        policy: { layers, minScore: 0.6, maxResults: 5 }
      };
      const res = await api<MemoryResult[]>('/api/memory/retrieve', {
        method: 'POST',
        body: JSON.stringify(query)
      });
      setResults(res);
    } catch (e) {
      toast.error("HYBRID_MEM_ACCESS_DENIED");
    } finally {
      setLoading(false);
    }
  }, [service]);
  return { results, retrieve, loading };
}
export function useSemanticEmailEnhancement() {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const enhance = useCallback(async (serviceId: string, protocol: TemplateType, userContext?: string) => {
    setIsEnhancing(true);
    try {
      const res = await api<{ content: string; confidence: number }>('/api/emails/enhance', {
        method: 'POST',
        body: JSON.stringify({
          serviceId,
          templateId: protocol === 'gdpr' ? 't-gdpr' : 't-ccpa',
          userContext
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