import React, { useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Identity } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
interface SettingsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  identity: Identity | null;
  onIdentityUpdate: (identity: Identity) => void;
  onSuccess: () => void;
}
export const SettingsDrawer = React.memo(({
  isOpen,
  onOpenChange,
  identity,
  onIdentityUpdate,
  onSuccess
}: SettingsDrawerProps) => {
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  if (!identity) return null;
  const handleSave = async () => {
    try {
      await api('/api/oblivion/identity', { 
        method: 'POST', 
        body: JSON.stringify(identity) 
      });
      toast.success("IDENTITY SYNCHRONIZED");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast.error("IDENTITY SYNC FAILED");
    }
  };
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="bg-slate-950 border-l border-primary/20 w-full sm:max-w-md text-foreground glass-cyber">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-2xl font-display font-bold text-primary uppercase text-neon">
            Identity_Sync
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-[10px] font-mono uppercase">
            Configure operator credentials and legal context for protocol generation.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-8">
           <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-primary font-bold uppercase" htmlFor="operator-id">Operator ID</label>
                <Input 
                  id="operator-id"
                  ref={firstInputRef}
                  value={identity.userName ?? ""} 
                  className="bg-black/40 border-primary/10 font-mono text-xs rounded-none focus:border-primary/50" 
                  onChange={(e) => onIdentityUpdate({...identity, userName: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-primary font-bold uppercase" htmlFor="uplink-email">Uplink Email</label>
                <Input 
                  id="uplink-email"
                  value={identity.email ?? ""} 
                  className="bg-black/40 border-primary/10 font-mono text-xs rounded-none focus:border-primary/50" 
                  onChange={(e) => onIdentityUpdate({...identity, email: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-primary font-bold uppercase" htmlFor="full-name">Full Name</label>
                <Input 
                  id="full-name"
                  value={identity.fullName ?? ""} 
                  className="bg-black/40 border-primary/10 font-mono text-xs rounded-none focus:border-primary/50" 
                  onChange={(e) => onIdentityUpdate({...identity, fullName: e.target.value})} 
                />
              </div>
           </div>
           <Button
            className="w-full bg-primary text-background font-bold text-[10px] h-12 rounded-none uppercase hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            onClick={handleSave}
          >
            Initialize Sync
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});
SettingsDrawer.displayName = 'SettingsDrawer';