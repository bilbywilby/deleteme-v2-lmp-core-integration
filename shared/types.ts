export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type MemoryLayer = 'parametric' | 'ephemeral' | 'semantic' | 'episodic';
export interface LmpLayerStatus {
  layer: MemoryLayer;
  status: 'idle' | 'active' | 'synced';
  description: string;
}
export interface ClientMeta {
  browser: string;
  os: string;
  timezone: string;
  ip?: string;
  userAgent: string;
}
export interface MemoryRetrievalPolicy {
  layers: MemoryLayer[];
  minScore: number;
  maxResults: number;
}
export interface MemoryQuery {
  sessionId: string;
  query: string;
  policy: MemoryRetrievalPolicy;
  contextHash?: string;
}
export interface MemoryResult {
  content: string;
  layer: MemoryLayer;
  score: number;
  latency: number;
  metadata?: any;
}
export interface SessionStartPayload {
  userId: string;
  clientMeta: ClientMeta;
  initPayload?: any;
}
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ContactMethod = 'direct-link' | 'email' | 'ticket' | 'phone' | 'postal';
export type TemplateType = 'gdpr' | 'ccpa';
export interface Service {
  id: string;
  name: string;
  category: string;
  difficulty: Difficulty;
  contactMethod: ContactMethod;
  confidence: number;
  url: string;
  privateEmail?: string;
  waitDays: number;
  requiresVerification: boolean;
  requiresDocs: boolean;
  notes?: string;
  isImpossible?: boolean;
}
export interface CustomService extends Service {
  isCustom: boolean;
  ownerId: string;
}
export interface Broker extends Service {
  optOutUrl: string;
}
export interface ServiceProgress {
  id: string;
  done: boolean;
  favorite: boolean;
  notes: string;
  updatedAt: number;
}
export interface DeletionEvent {
  id: string;
  sessionId: string;
  type: 'initialization' | 'draft_generated' | 'email_sent' | 'manual_update' | 'archived' | 'broker_opt_out' | 'identity_update' | 'custom_service_created';
  content: string;
  timestamp: number;
  idempotencyKey?: string;
  metadata?: {
    templateType?: TemplateType;
    similarityScore?: number;
    [key: string]: any;
  };
}
export interface SessionCheckpoint {
  id: string;
  userId: string;
  state: any;
  version: number;
  updatedAt: number;
  clientMeta?: ClientMeta;
  contextHash?: string;
}
export interface MemoryRetrievalResult {
  content: string;
  score: number;
  layer: MemoryLayer;
  metadata?: any;
  latency?: number;
}
export interface LmpQuery {
  type: MemoryLayer;
  context: string;
  policy?: TemplateType;
  threshold?: number;
}
export interface Identity {
  fullName: string;
  email: string;
  address: string;
  phone: string;
  dob: string;
  userName?: string;
  apiKey?: string;
  checkpointId?: string;
}
export interface Session {
  id: string;
  targetService: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: number;
  lastActive: number;
  currentDraft?: string;
}
export interface SemanticTemplate {
  id: string;
  service: string;
  type: TemplateType;
  template: string;
  effectiveness: number;
}
export interface User {
  id: string;
  name: string;
}