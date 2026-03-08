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
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ContactMethod = 'direct-link' | 'email' | 'ticket' | 'phone' | 'postal';
export type TemplateType = 'gdpr' | 'ccpa';
export interface Service {
  id: string;
  name: string;
  category: string;
  difficulty: Difficulty;
  contactMethod: ContactMethod;
  confidence: number; // 0-100
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
  id: string; // matches service id
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
  metadata?: {
    templateType?: TemplateType;
    [key: string]: any;
  };
}
export interface Identity {
  fullName: string;
  email: string;
  address: string;
  phone: string;
  dob: string;
  userName?: string;
  apiKey?: string;
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