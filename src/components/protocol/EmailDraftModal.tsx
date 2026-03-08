import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
interface EmailDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  draft: string;
  confidence: number;
  isEnhancing: boolean;
  onDraftChange: (val: string) => void;
}
export const EmailDraftModal = React.memo(({
  isOpen,
  onClose,
  serviceName,
  draft,
  confidence,
  isEnhancing,
  onDraftChange
}: EmailDraftModalProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (isOpen && !isEnhancing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, isEnhancing]);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-background/95 backdrop-blur-xl z-[150]" />
      <DialogContent 
        className="max-w-2xl p-0 overflow-hidden border-none glass-cyber bg-transparent z-[151] shadow-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()} // Manual focus management for terminal feel
      >
        <div className="bg-primary text-background p-4 flex justify-between items-center">
          <DialogTitle className="text-sm font-bold font-display uppercase flex items-center gap-2 m-0">
            <Terminal size={16} aria-hidden="true" /> Protocol_Draft: {serviceName}
          </DialogTitle>
          <div className="text-[10px] font-mono bg-black/20 px-2 py-1 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full bg-emerald-500 ${isEnhancing ? 'animate-pulse' : ''}`} />
            Precision: {confidence.toFixed(4)}
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-black/60 border border-primary/10 p-6 min-h-[300px] relative">
            <AnimatePresence mode="wait">
              {isEnhancing ? (
                 <motion.div
                   key="loading"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="flex flex-col items-center justify-center absolute inset-0 gap-4 text-primary font-mono text-[10px]"
                 >
                   <Cpu size={32} className="animate-spin" />
                   <span className="tracking-[0.2em] animate-pulse">DECRYPTING_SEMANTIC_PATTERNS...</span>
                 </motion.div>
              ) : (
                <motion.textarea
                  key="content"
                  ref={textareaRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-80 bg-transparent border-none p-0 font-mono text-xs text-slate-300 outline-none resize-none custom-scrollbar"
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  aria-label="Email draft content"
                  spellCheck={false}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              className="font-bold text-[10px] rounded-none uppercase h-10 px-6 border-primary/20 hover:bg-primary/5" 
              onClick={onClose}
            >
              Cancel [ESC]
            </Button>
            <Button
              className="bg-primary text-background font-bold text-[10px] rounded-none uppercase h-10 px-8 hover:bg-primary/90 transition-all active:scale-95"
              onClick={() => {
                navigator.clipboard.writeText(draft);
                toast.success("BUFFER_COPIED_TO_CLIPBOARD");
              }}
            >
              <Copy size={12} className="mr-2" /> Copy Buffer
            </Button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-background/50 hover:text-background transition-colors outline-none focus:text-background"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>
      </DialogContent>
    </Dialog>
  );
});
EmailDraftModal.displayName = 'EmailDraftModal';