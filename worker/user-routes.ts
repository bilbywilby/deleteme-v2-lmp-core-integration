import { Hono } from "hono";
import type { Env } from './core-utils';
import {
  ServiceDefinitionEntity,
  ServiceProgressEntity,
  IdentityEntity,
  EventLogEntity,
  GlobalMemoryEntity,
  CustomServiceEntity
} from "./entities";
import { ok, bad, isStr, Index } from './core-utils';
import type { CustomService } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Unified data fetch for Dashboard
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
  // Create custom service
  app.post('/api/oblivion/custom-service', async (c) => {
    const body = await c.req.json() as CustomService;
    if (!body.name || !body.url) return bad(c, "Name and URL required");
    const service = await CustomServiceEntity.create(c.env, {
      ...body,
      id: body.id || crypto.randomUUID(),
      isCustom: true,
      ownerId: "main"
    });
    await new EventLogEntity(c.env, 'main').addEvent({
      sessionId: 'main',
      type: 'custom_service_created',
      content: `Custom service node registered: ${service.name}`
    });
    return ok(c, service);
  });
  // Toggle progress (done/favorite)
  app.post('/api/oblivion/progress', async (c) => {
    const body = await c.req.json() as { id: string; done?: boolean; favorite?: boolean; notes?: string };
    const ent = new ServiceProgressEntity(c.env, body.id);
    const state = await ent.mutate(s => ({
      ...s,
      id: body.id,
      done: body.done ?? s.done,
      favorite: body.favorite ?? s.favorite,
      notes: body.notes ?? s.notes,
      updatedAt: Date.now()
    }));
    const idx = new Index<string>(c.env, ServiceProgressEntity.indexName);
    await idx.add(body.id);
    return ok(c, state);
  });
  // Update Identity
  app.post('/api/oblivion/identity', async (c) => {
    const body = await c.req.json();
    const ent = new IdentityEntity(c.env, 'main');
    await ent.save(body);
    await new EventLogEntity(c.env, 'main').addEvent({
      sessionId: 'main',
      type: 'identity_update',
      content: 'LMP Identity Profile Synchronized'
    });
    return ok(c, body);
  });
  // Intelligent template enhancement
  app.post('/api/enhance-email', async (c) => {
    const { serviceId, type } = await c.req.json() as { serviceId: string; type: string };
    const identity = await new IdentityEntity(c.env, 'main').getState();
    const memory = await new GlobalMemoryEntity(c.env, 'main').getState();
    let tpl = memory.templates.find(t => t.id === type) || memory.templates[0];
    let content = tpl.template;
    content = content.replace(/{{fullName}}/g, identity.fullName || "");
    content = content.replace(/{{email}}/g, identity.email || "");
    content = content.replace(/{{address}}/g, identity.address || "");
    content = content.replace(/{{phone}}/g, identity.phone || "");
    content = content.replace(/{{dob}}/g, identity.dob || "");
    return ok(c, { content });
  });
  app.post('/api/oblivion/log', async (c) => {
    const { type, content } = await c.req.json();
    const event = await new EventLogEntity(c.env, 'main').addEvent({
      sessionId: 'main',
      type,
      content
    });
    return ok(c, event);
  });
}