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
import { MemoryCoordinator } from "./memory-coordinator";
import { ok, bad, Index } from './core-utils';
import type {
  SessionStartPayload,
  MemoryQuery,
  TemplateType,
  SessionCheckpoint,
  Identity
} from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/health', (c) => {
    return ok(c, {
      status: 'OBLIVION_ACTIVE',
      uptime: 0,
      lmp_version: '5.0.0-Hybrid'
    });
  });
  app.get('/api/oblivion/data', async (c) => {
    await ServiceDefinitionEntity.ensureSeed(c.env);
    await GlobalMemoryEntity.ensureSeed(c.env);
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
  app.post('/api/oblivion/identity', async (c) => {
    const identity = await c.req.json() as Identity;
    const ent = new IdentityEntity(c.env, 'main');
    await ent.save(identity);
    return ok(c, identity);
  });
  app.post('/api/sessions/start', async (c) => {
    const payload = await c.req.json() as SessionStartPayload;
    const id = crypto.randomUUID();
    const contextHash = SemanticEngine.generateContextHash(payload.clientMeta);
    const checkpoint = await SessionCheckpointEntity.create(c.env, {
      id,
      userId: payload.userId || 'main',
      state: { ...payload.initPayload, startedAt: Date.now() },
      version: 1,
      updatedAt: Date.now(),
      clientMeta: payload.clientMeta,
      contextHash
    });
    await new EventLogEntity(c.env, 'main').addEvent({
      sessionId: id,
      type: 'initialization',
      content: `Neural Session Started. Context Hash: ${contextHash}`,
      metadata: { client: payload.clientMeta }
    });
    return ok(c, checkpoint);
  });
  app.post('/api/memory/retrieve', async (c) => {
    const query = await c.req.json() as MemoryQuery;
    if (!query.sessionId) query.sessionId = 'main';
    const results = await MemoryCoordinator.retrieve(c.env, query);
    return ok(c, results);
  });
  app.post('/api/memory/analyze-trends', async (c) => {
    const trends = await MemoryCoordinator.analyzeTrends(c.env);
    return ok(c, trends);
  });
  app.post('/api/checkpoints/save', async (c) => {
    const { id, module, state, version } = await c.req.json();
    const ent = new SessionCheckpointEntity(c.env, id);
    try {
      const result = await ent.mutate(current => {
        const validation = SemanticEngine.validateVersionConflict(current.version, version);
        if (validation.conflict) {
          throw new Error(JSON.stringify({ code: 409, resolution: validation.resolution, current }));
        }
        return {
          ...current,
          state: { ...current.state, [module]: state },
          version: current.version + 1,
          updatedAt: Date.now()
        };
      });
      return ok(c, result);
    } catch (e: any) {
      try {
        const detail = JSON.parse(e.message);
        return c.json({ success: false, ...detail }, 409);
      } catch {
        return bad(c, e.message);
      }
    }
  });
  app.post('/api/emails/enhance', async (c) => {
    const { serviceId, userContext, templateId } = await c.req.json();
    const identity = await new IdentityEntity(c.env, 'main').getState();
    const memory = await new GlobalMemoryEntity(c.env, 'main').getState();
    const logs = await new EventLogEntity(c.env, 'main').getState();
    let tpl = memory.templates.find(t => t.id === templateId) || memory.templates[0];
    const matches = await SemanticEngine.similaritySearch(userContext || "", [tpl], t => t.template, 0.5);
    const confidence = matches.length > 0 ? matches[0].score : 0.85;
    let content = tpl.template;
    content = content.replace(/{{fullName}}/g, identity.fullName || "OPERATOR_NULL");
    content = content.replace(/{{email}}/g, identity.email || "");
    content = content.replace(/{{address}}/g, identity.address || "");
    content = content.replace(/{{phone}}/g, identity.phone || "");
    content = content.replace(/{{dob}}/g, identity.dob || "");
    await new EventLogEntity(c.env, 'main').addEvent({
      sessionId: 'main',
      type: 'draft_generated',
      content: `Enhanced draft generated for ${serviceId}. Confidence: ${(confidence * 100).toFixed(1)}%`,
      metadata: { templateType: tpl.type, score: confidence }
    });
    return ok(c, { content, confidence, usage: logs.events.length });
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
}