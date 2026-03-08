import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { History, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { DeletionEvent } from '@shared/types';
import { cn } from '@/lib/utils';
interface EventTimelineProps {
  events: DeletionEvent[];
}
const TYPE_CONFIG = {
  initialization: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  draft_generated: { icon: History, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  email_sent: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  manual_update: { icon: History, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  archived: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
};
export function EventTimeline({ events }: EventTimelineProps) {
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-mono text-slate-400 uppercase flex items-center gap-2">
          <History size={16} />
          Episodic Stream (Immutable)
        </h3>
        <span className="text-[10px] text-slate-600 font-mono">{events.length} LOGS RETRIEVED</span>
      </div>
      <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto custom-scrollbar">
        {sortedEvents.map((event, idx) => {
          const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.manual_update;
          const Icon = config.icon;
          return (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={event.id}
              className="p-4 flex gap-4 hover:bg-slate-900/30 transition-colors"
            >
              <div className="flex flex-col items-center gap-1 min-w-[100px] pt-1">
                <span className="text-[10px] font-mono text-slate-500">
                  {format(event.timestamp, 'HH:mm:ss')}
                </span>
                <span className="text-[8px] font-mono text-slate-600">
                  {format(event.timestamp, 'MMM dd')}
                </span>
              </div>
              <div className={cn("mt-1 p-1.5 rounded h-fit", config.bg, config.color)}>
                <Icon size={14} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-mono font-bold uppercase", config.color)}>
                    {event.type.replace('_', ' ')}
                  </span>
                  <span className="text-slate-700 font-mono text-[10px]"># {event.id.slice(0, 8)}</span>
                </div>
                <p className="text-sm text-slate-400 font-mono leading-relaxed">
                  {event.content}
                </p>
              </div>
            </motion.div>
          );
        })}
        {events.length === 0 && (
          <div className="p-12 text-center text-slate-600 font-mono text-xs">
            NO LOGS DETECTED IN CURRENT EPISODE
          </div>
        )}
      </div>
    </div>
  );
}