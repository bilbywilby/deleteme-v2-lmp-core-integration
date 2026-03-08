import { Hono } from "hono";
import type { Env } from './core-utils';
import {
  ServiceDefinitionEntity,
  ServiceProgressEntity,
  IdentityEntity,
  EventLogEntity,
  GlobalMemoryEntity,
  CustomServiceEntity,
  SessionCheckpointEntity
} from "./entities";
import { SemanticEngine } from "./semantic-engine";
import { ok, bad, isStr, Index, notFound } from './core-utils';
import type { CustomService, TemplateType, MemoryLayer, LmpQuery } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/oblivion/data', async (c) => {
    await ServiceDefinitionEntity.ensureSeed(c.env);
    const services = await ServiceDefinitionEntity.list(c.env);
    const customServices = await CustomServiceEntity.list(c.env);
    const progress = await ServiceProgressEntity.list(c.env);
    const identity = await new IdentityEntity(c.env, 'main').getState();
    const logs = await new EventLogEntity(c.env, 'main').getState();
    return ok(c, {
      services: [...services.items, ...customServices.items],
      progress: progress.items,
      identity,
      logs: logs.events
    });
  });
  app.post('/api/sessions/init', async (c) => {
    const id = crypto.randomUUID();
    const checkpoint = await SessionCheckpointEntity.create(c.env, {
      id,
      userId: 'main',
      state: { initializedAt: Date.now() },
      version: 1,
      updatedAt: Date.now()
    });
    return ok(c, checkpoint);
  });
  app.post('/api/checkpoints/save', async (c) => {
    const { id, state, version } = await c.req.json();
    const ent = new SessionCheckpointEntity(c.env, id);
    try {
      const result = await ent.mutate(current => {
        if (current.version !== version) {
          throw new Error("409 Conflict");
        }
        return {
          ...current,
          state,
          version: current.version + 1,
          updatedAt: Date.now()
        };
      });
      return ok(c, result);
    } catch (e: any) {
      if (e.message === "409 Conflict") return c.json({ success: false, error: "Conflict", code: 409 }, 409);
      return bad(c, e.message);
    }
  });
  app.post('/api/memory/retrieve/:type', async (c) => {
    const type = c.req.param('type') as MemoryLayer;
    const { context, threshold = 0.7 } = await c.req.json() as LmpQuery;
    if (type === 'semantic') {
      const memory = await new GlobalMemoryEntity(c.env, 'main').getState();
      const results = await SemanticEngine.similaritySearch(context, memory.templates, t => t.template, threshold);
      return ok(c, results.map(r => ({
        content: r.item.template,
        score: r.score,
        layer: 'semantic',
        metadata: { type: r.item.type, service: r.item.service }
      })));
    }
    if (type === 'episodic') {
      const log = await new EventLogEntity(c.env, 'main').getState();
      const results = await SemanticEngine.similaritySearch(context, log.events, e => e.content, threshold);
      return ok(c, results.map(r => ({
        content: r.item.content,
        score: r.score,
        layer: 'episodic',
        metadata: { type: r.item.type, timestamp: r.item.timestamp }
      })));
    }
    return bad(c, "Unsupported layer retrieval");
  });
  app.post('/api/enhance-email', async (c) => {
    const { serviceId, templateId, context } = await c.req.json();
    const identity = await new IdentityEntity(c.env, 'main').getState();
    const memory = await new GlobalMemoryEntity(c.env, 'main').getState();
    const logs = await new EventLogEntity(c.env, 'main').getState();
    // 1. Find similar successful patterns if context provided
    let tpl;
    if (context) {
      const semanticMatches = await SemanticEngine.similaritySearch(context, memory.templates, t => t.template, 0.6);
      if (semanticMatches.length > 0) tpl = semanticMatches[0].item;
    }
    if (!tpl) {
      tpl = templateId 
        ? memory.templates.find(t => t.id === templateId) 
        : memory.templates[0];
    }
    if (!tpl) tpl = memory.templates[0];
    // 2. Perform mock similarity check against history
    const historyMatches = await SemanticEngine.similaritySearch(tpl.template, logs.events, e => e.content, 0.85);
    const avgSuccessScore = historyMatches.length > 0 
      ? historyMatches.reduce((acc, m) => acc + m.score, 0) / historyMatches.length 
      : 0.95; // default high confidence for first-time use
    let content = tpl.template;
    content = content.replace(/{{fullName}}/g, identity.fullName || "OPERATOR_NULL");
    content = content.replace(/{{email}}/g, identity.email || "");
    content = content.replace(/{{address}}/g, identity.address || "");
    content = content.replace(/{{phone}}/g, identity.phone || "");
    content = content.replace(/{{dob}}/g, identity.dob || "");
    await new EventLogEntity(c.env, 'main').addEvent({
      sessionId: 'main',
      type: 'draft_generated',
      content: `Enhanced draft generated for ${serviceId}. Confidence Score: ${(avgSuccessScore * 100).toFixed(1)}%`,
      metadata: { templateType: tpl.type, similarityScore: avgSuccessScore }
    });
    return ok(c, { content, template: tpl, score: avgSuccessScore });
  });
  app.post('/api/oblivion/progress', async (c) => {
    const body = await c.req.json();
    const ent = new ServiceProgressEntity(c.env, body.id);
    const state = await ent.mutate(s => ({
      ...s,
      id: body.id,
      done: body.done ?? s.done,
      favorite: body.favorite ?? s.favorite,
      notes: body.notes ?? s.notes,
      updatedAt: Date.now()
    }));
    await new Index<string>(c.env, ServiceProgressEntity.indexName).add(body.id);
    return ok(c, state);
  });
  app.post('/api/oblivion/identity', async (c) => {
    const body = await c.req.json();
    await new IdentityEntity(c.env, 'main').save(body);
    await new EventLogEntity(c.env, 'main').addEvent({
      sessionId: 'main',
      type: 'identity_update',
      content: 'LMP Identity Profile Synchronized'
    });
    return ok(c, body);
  });
}