import { IndexedEntity, Entity } from "./core-utils";
import type { User, Session, DeletionEvent, SemanticTemplate } from "@shared/types";
import { MOCK_USERS, MOCK_SESSIONS, MOCK_EVENTS, MOCK_TEMPLATES } from "@shared/mock-data";
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
}
export type SessionState = Session & { events: DeletionEvent[] };
export class SessionEntity extends IndexedEntity<SessionState> {
  static readonly entityName = "session";
  static readonly indexName = "sessions";
  static readonly initialState: SessionState = {
    id: "",
    targetService: "",
    status: "active",
    createdAt: 0,
    lastActive: 0,
    events: []
  };
  static async ensureSeed(env: any): Promise<void> {
    const exists = await new Index(env, this.indexName).list();
    if (exists.length === 0) {
      for (const sess of MOCK_SESSIONS) {
        const fullSess: SessionState = {
          ...sess,
          events: MOCK_EVENTS.filter(e => e.sessionId === sess.id)
        };
        await new SessionEntity(env, sess.id).save(fullSess);
        await new Index(env, this.indexName).add(sess.id);
      }
    }
  }
  async addEvent(event: Omit<DeletionEvent, 'id' | 'timestamp'>): Promise<DeletionEvent> {
    const newEvent: DeletionEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    await this.mutate(s => ({
      ...s,
      lastActive: Date.now(),
      events: [...s.events, newEvent]
    }));
    return newEvent;
  }
  async updateDraft(draft: string): Promise<void> {
    await this.mutate(s => ({ ...s, currentDraft: draft, lastActive: Date.now() }));
  }
}
export class GlobalMemoryEntity extends Entity<{ templates: SemanticTemplate[] }> {
  static readonly entityName = "global-memory";
  static readonly initialState = { templates: MOCK_TEMPLATES };
  async getTemplate(service: string): Promise<SemanticTemplate | undefined> {
    const state = await this.getState();
    return state.templates.find(t => t.service.toLowerCase() === service.toLowerCase());
  }
}
import { Index } from "./core-utils";