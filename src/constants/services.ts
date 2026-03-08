import { Shield, Mail, Link, MessageSquare, Phone, MapPin } from 'lucide-react';
import { Difficulty, ContactMethod } from '@shared/types';
export const DIFF_META: Record<Difficulty, { label: string; color: string; bg: string; border: string }> = {
  easy: {
    label: 'EASY',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-500/30'
  },
  medium: {
    label: 'MEDIUM',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-500/30'
  },
  hard: {
    label: 'HARD',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-500/30'
  }
};
export const CONTACT_METHOD_MAP: Record<ContactMethod, { icon: any; label: string }> = {
  'direct-link': { icon: Link, label: 'Portal' },
  'email': { icon: Mail, label: 'Email' },
  'ticket': { icon: MessageSquare, label: 'Ticket' },
  'phone': { icon: Phone, label: 'Phone' },
  'postal': { icon: MapPin, label: 'Postal' }
};
export const CATEGORY_LIST = [
  'All',
  'Social',
  'FinTech',
  'Data Broker',
  'E-commerce',
  'SaaS',
  'Health',
  'Infrastructure'
];
export const CONFIDENCE_THRESHOLD = 0.85;
export const SYNC_INTERVAL = 3000;