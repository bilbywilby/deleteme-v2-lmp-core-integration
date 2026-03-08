import type { User, Chat, ChatMessage, SemanticTemplate, Session, DeletionEvent } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'LMP Operator' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'System Logs' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'LMP Core Online', ts: Date.now() },
];
export const MOCK_TEMPLATES: SemanticTemplate[] = [
  {
    id: 't1',
    service: 'facebook',
    template: 'Subject: Right to Erasure Request (GDPR)\n\nI am writing to formally request the deletion of my account associated with this email under Article 17 of the GDPR...',
    effectiveness: 98
  },
  {
    id: 't2',
    service: 'instagram',
    template: 'To the Privacy Team,\n\nPlease remove all personal data and images associated with my handle. I am exercise my right to be forgotten...',
    effectiveness: 95
  },
  {
    id: 't3',
    service: 'google',
    template: 'Request for account closure and data purging. Please confirm when all secondary backups have been cleared...',
    effectiveness: 92
  }
];
export const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess-proto-1',
    targetService: 'Facebook',
    status: 'active',
    createdAt: Date.now() - 3600000,
    lastActive: Date.now(),
    currentDraft: 'Initial draft for Facebook removal...'
  }
];
export const MOCK_EVENTS: DeletionEvent[] = [
  {
    id: 'ev-1',
    sessionId: 'sess-proto-1',
    type: 'initialization',
    content: 'Protocol initialized for target: Facebook',
    timestamp: Date.now() - 3600000
  }
];