import { IndexedEntity, Entity, Index } from "./core-utils";
import type { Identity, Service, Broker, ServiceProgress, DeletionEvent, SemanticTemplate, CustomService, SessionCheckpoint } from "@shared/types";
import { MOCK_IDENTITY, SERVICES, MOCK_TEMPLATES } from "@shared/mock-data";
import { Env } from "./core-utils";
export class IdentityEntity extends Entity<Identity> {
  static readonly entityName = "identity";
  static readonly initialState: Identity = {
    ...MOCK_IDENTITY,
    userName: "OPERATOR_01",
    apiKey: "",
    checkpointId: ""
  };
}
export class ServiceDefinitionEntity extends IndexedEntity<Service> {
  static readonly entityName = "service-def";
  static readonly indexName = "service-defs";
  static readonly initialState: Service = SERVICES[0];
  static seedData = SERVICES;
}
export class CustomServiceEntity extends IndexedEntity<CustomService> {
  static readonly entityName = "custom-service";
  static readonly indexName = "custom-services-idx";
  static readonly initialState: CustomService = {
    ...SERVICES[0],
    isCustom: true,
    ownerId: "main"
  };
}
export class ServiceProgressEntity extends IndexedEntity<ServiceProgress> {
  static readonly entityName = "service-progress";
  static readonly indexName = "service-progress-idx";
  static readonly initialState: ServiceProgress = { id: "", done: false, favorite: false, notes: "", updatedAt: 0 };
}
export class GlobalMemoryEntity extends Entity<{ templates: SemanticTemplate[] }> {
  static readonly entityName = "global-memory";
  static readonly initialState = { templates: MOCK_TEMPLATES };
  static async ensureSeed(env: Env): Promise<void> {
    const inst = new GlobalMemoryEntity(env, 'main');
    const exists = await inst.exists();
    if (!exists) {
      await inst.save({ templates: MOCK_TEMPLATES });
    }
  }
}
export class SessionCheckpointEntity extends IndexedEntity<SessionCheckpoint> {
  static readonly entityName = "session-checkpoint";
  static readonly indexName = "session-checkpoints-idx";
  static readonly initialState: SessionCheckpoint = {
    id: "",
    userId: "main",
    state: {},
    version: 0,
    updatedAt: 0
  };
}
export class EventLogEntity extends Entity<{ events: DeletionEvent[] }> {
  static readonly entityName = "event-log";
  static readonly initialState = { events: [] };
  async addEvent(event: Omit<DeletionEvent, 'id' | 'timestamp'>): Promise<DeletionEvent | null> {
    const existing = event.idempotencyKey
      ? (await this.getState()).events.find(e => e.idempotencyKey === event.idempotencyKey)
      : null;
    if (existing) return existing;
    const newEvent: DeletionEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    await this.mutate(s => ({
      ...s,
      events: [newEvent, ...s.events].slice(0, 500)
    }));
    return newEvent;
  }
}