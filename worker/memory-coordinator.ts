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
} from "@shared/types";
import type { Env } from "./core-utils";
export class MemoryCoordinator {
  static async retrieve(env: Env, query: MemoryQuery): Promise<MemoryResult[]> {
    const startTime = Date.now();
    const results: MemoryResult[] = [];
    const layers = query.policy.layers;
    // Use batch processing for efficiency where possible
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
        layerItems = [
          { content: "Verify identity context before execution.", type: "rule" },
          { content: "GDPR Article 17 requires 30-day compliance.", type: "rule" },
          { content: "Maintain idempotency for high-latency protocols.", type: "rule" }
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
        score: parseFloat(m.score.toFixed(4)),
        latency: layerLatency,
        metadata: { ...m.item, clusterId: Math.floor(m.score * 10) }
      }));
    });
    const nestedResults = await Promise.all(layerTasks);
    nestedResults.forEach(batch => results.push(...batch));
    return results.sort((a, b) => b.score - a.score);
  }
  /**
   * Analyzes episodic logs for recurring patterns using clustering.
   */
  static async analyzeTrends(env: Env) {
    const logs = await new EventLogEntity(env, 'main').getState();
    if (logs.events.length < 5) return { trends: [], count: logs.events.length };
    const { clusters } = await SemanticEngine.clusterPatterns(
      logs.events,
      (e) => e.content,
      3
    );
    return {
      trends: clusters.map((c, i) => ({
        id: `trend-${i}`,
        size: c.items.length,
        summary: c.items[0]?.content || "Pattern detected",
        sampleIds: c.items.slice(0, 3).map(it => it.id)
      })),
      count: logs.events.length
    };
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