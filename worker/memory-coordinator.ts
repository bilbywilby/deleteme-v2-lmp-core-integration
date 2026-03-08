import { SemanticEngine } from "./semantic-engine";
import { 
  GlobalMemoryEntity, 
  EventLogEntity, 
  SessionCheckpointEntity 
} from "./entities";
import type { 
  MemoryQuery, 
  MemoryResult, 
  MemoryLayer, 
  Env 
} from "@shared/types";
export class MemoryCoordinator {
  static async retrieve(env: Env, query: MemoryQuery): Promise<MemoryResult[]> {
    const startTime = Date.now();
    const results: MemoryResult[] = [];
    const layers = query.policy.layers;
    const layerTasks = layers.map(async (layer) => {
      const layerStart = Date.now();
      let layerItems: any[] = [];
      let layerContentGetter = (item: any) => "";
      if (layer === 'semantic') {
        const memory = await new GlobalMemoryEntity(env, 'main').getState();
        layerItems = memory.templates;
        layerContentGetter = (t) => t.template;
      } else if (layer === 'episodic') {
        const log = await new EventLogEntity(env, 'main').getState();
        layerItems = log.events;
        layerContentGetter = (e) => e.content;
      } else if (layer === 'parametric') {
        // Mock system rules layer
        layerItems = [
          { content: "Always verify identity before data erasure.", type: "rule" },
          { content: "GDPR Article 17 requires 30-day compliance.", type: "rule" }
        ];
        layerContentGetter = (r) => r.content;
      }
      const matches = await SemanticEngine.similaritySearch(
        query.query, 
        layerItems, 
        layerContentGetter, 
        query.policy.minScore
      );
      const layerLatency = Date.now() - layerStart;
      return matches.slice(0, query.policy.maxResults).map(m => ({
        content: layerContentGetter(m.item),
        layer,
        score: m.score,
        latency: layerLatency,
        metadata: m.item
      }));
    });
    const nestedResults = await Promise.all(layerTasks);
    nestedResults.forEach(batch => results.push(...batch));
    // Hybrid ranking: Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }
  static async getSummary(env: Env, sessionId: string) {
    const checkpoint = await new SessionCheckpointEntity(env, sessionId).getState();
    const logs = await new EventLogEntity(env, 'main').getState();
    return {
      sessionId,
      version: checkpoint.version,
      lastSync: checkpoint.updatedAt,
      eventCount: logs.events.length,
      contextHash: checkpoint.contextHash,
      status: checkpoint.id ? 'active' : 'idle'
    };
  }
}