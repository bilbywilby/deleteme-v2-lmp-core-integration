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
export interface DeletionEvent {
  id: string;
  sessionId: string;
  type: 'initialization' | 'draft_generated' | 'email_sent' | 'manual_update' | 'archived';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
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
  template: string;
  effectiveness: number;
}
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number;
}