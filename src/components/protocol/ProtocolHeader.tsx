import React from 'react';
import { motion } from 'framer-motion';
import { Dog, Cpu, User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SessionCheckpoint } from '@shared/types';
interface ProtocolHeaderProps {
  session: SessionCheckpoint | null;
  isSyncing: boolean;
  onOpenSettings: () => void;
}
export const ProtocolHeader = React.memo(({ session, isSyncing, onOpenSettings }: ProtocolHeaderProps) => {
  return (
    <header className="space-y-8 mb-12" role="banner">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <motion.div 
            animate={{ y: [0, -3, 0] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
            className="relative flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full animate-pulse" />
            <div className="relative glass-cyber p-2 rounded-lg border-primary/30">
              <Dog className="w-7 h-7 text-neon" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-background text-[7px] font-bold px-1 rounded border border-primary">
              {isSyncing ? 'SYNC' : 'V5'}
            </div>
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-neon uppercase">
              OBLIVION <span className="text-muted-foreground font-light text-xl">ZENITH</span>
            </h1>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase font-mono mt-1">
              <div className="flex items-center gap-1.5" aria-label={`Session status: ${isSyncing ? 'Syncing' : 'Connected'}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                ID: {session?.id.slice(0, 8) ?? 'NULL'} ::: V{session?.version ?? 0}
              </div>
              {session?.contextHash && (
                <div className="border-l border-primary/20 pl-4 flex items-center gap-1.5">
                  <Cpu size={10} className="text-primary/50" />
                  HASH: <span className="text-primary/70 font-bold">{session.contextHash}</span>
                </div>
              )}
              {isSyncing && <span className="text-blue-400 animate-pulse text-[8px]">[SYNCING_BUFFER]</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={onOpenSettings} 
            variant="outline" 
            className="h-auto py-2 px-6 border-primary/30 rounded-none font-bold text-[10px] uppercase hover:bg-primary/5"
            aria-label="Open operator settings"
          >
            <User size={14} className="mr-2" /> Operator
          </Button>
          <ThemeToggle className="static" />
        </div>
      </div>
    </header>
  );
});
ProtocolHeader.displayName = 'ProtocolHeader';