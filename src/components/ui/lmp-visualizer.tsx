import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, Brain, History, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemoryLayer } from '@shared/types';
interface LMPVisualizerProps {
  activeLayer?: MemoryLayer;
  isProcessing?: boolean;
}
const LAYERS: { id: MemoryLayer; name: string; icon: any; color: string; desc: string }[] = [
  { id: 'parametric', name: 'Parametric', icon: Brain, color: 'text-purple-400', desc: 'System Rules & Logic' },
  { id: 'semantic', name: 'Semantic', icon: Zap, color: 'text-blue-400', desc: 'Context & Patterns' },
  { id: 'ephemeral', name: 'Ephemeral', icon: Database, color: 'text-emerald-400', desc: 'Live Session State' },
  { id: 'episodic', name: 'Episodic', icon: History, color: 'text-orange-400', desc: 'Immutable Event Log' },
];
export function LMPVisualizer({ activeLayer, isProcessing }: LMPVisualizerProps) {
  return (
    <div className="relative flex flex-col gap-4 p-6 bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm overflow-hidden min-h-[400px]">
      <div className="absolute top-0 right-0 p-4">
        <div className={cn(
          "h-2 w-2 rounded-full animate-pulse",
          isProcessing ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-slate-700"
        )} />
      </div>
      <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4">LMP Memory Stack</h3>
      <div className="flex flex-col gap-3 relative z-10">
        {LAYERS.map((layer, idx) => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <motion.div
              key={layer.id}
              initial={false}
              animate={{
                scale: isActive ? 1.02 : 1,
                x: isActive ? 8 : 0,
                backgroundColor: isActive ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.4)',
                borderColor: isActive ? 'rgba(59, 130, 246, 0.5)' : 'rgba(30, 41, 59, 1)'
              }}
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
                isActive ? "shadow-lg shadow-blue-500/10" : ""
              )}
            >
              <div className={cn("p-2 rounded-md bg-slate-800", layer.color)}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{layer.name}</span>
                  {isActive && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded"
                    >
                      READING
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{layer.desc}</p>
              </div>
              {idx < LAYERS.length - 1 && (
                <div className="absolute -bottom-3 left-8 w-px h-3 bg-slate-800" />
              )}
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            exit={{ opacity: 0 }}
            className="absolute left-8 top-12 w-px bg-gradient-to-b from-blue-500 via-purple-500 to-transparent z-0 opacity-50"
          />
        )}
      </AnimatePresence>
      <div className="mt-auto pt-6 border-t border-slate-800/50">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <ArrowRight size={12} />
          <span>LAYERED MEMORY PROTOCOL V2.0</span>
        </div>
      </div>
    </div>
  );
}