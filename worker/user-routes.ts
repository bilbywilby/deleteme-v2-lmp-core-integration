import { Hono } from "hono";
import type { Env } from './core-utils';
import { SessionEntity, GlobalMemoryEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/sessions', async (c) => {
    await SessionEntity.ensureSeed(c.env);
    const result = await SessionEntity.list(c.env);
    return ok(c, result.items);
  });
  app.post('/api/sessions/start', async (c) => {
    const { targetService } = await c.req.json() as { targetService: string };
    if (!isStr(targetService)) return bad(c, 'targetService required');
    const id = crypto.randomUUID();
    const session = await SessionEntity.create(c.env, {
      id,
      targetService,
      status: 'active',
      createdAt: Date.now(),
      lastActive: Date.now(),
      events: [{
        id: crypto.randomUUID(),
        sessionId: id,
        type: 'initialization',
        content: `Protocol initiated for ${targetService}`,
        timestamp: Date.now()
      }]
    });
    return ok(c, session);
  });
  app.get('/api/sessions/:id', async (c) => {
    const session = new SessionEntity(c.env, c.req.param('id'));
    if (!await session.exists()) return notFound(c, 'Session not found');
    return ok(c, await session.getState());
  });
  app.post('/api/sessions/:id/checkpoint', async (c) => {
    const { type, content } = await c.req.json() as { type: any, content: string };
    const session = new SessionEntity(c.env, c.req.param('id'));
    if (!await session.exists()) return notFound(c, 'Session not found');
    const event = await session.addEvent({ sessionId: c.req.param('id'), type, content });
    return ok(c, event);
  });
  app.post('/api/enhance-email', async (c) => {
    const { service } = await c.req.json() as { service: string };
    const memory = new GlobalMemoryEntity(c.env, 'main');
    const template = await memory.getTemplate(service);
    if (!template) return bad(c, 'No semantic template found for this service');
    return ok(c, template);
  });
}