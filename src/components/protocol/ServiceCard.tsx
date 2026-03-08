import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Zap, Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Service, ServiceProgress } from '@shared/types';
import { DIFF_META, CONTACT_METHOD_MAP } from '@/constants/services';
import { cn } from '@/lib/utils';
interface ServiceCardProps {
  service: Service;
  progress?: ServiceProgress;
  isSelected: boolean;
  onClick: () => void;
  onEnhance: (service: Service) => void;
}
export const ServiceCard = React.memo(({ service, progress, isSelected, onClick, onEnhance }: ServiceCardProps) => {
  const diff = DIFF_META[service.difficulty];
  const method = CONTACT_METHOD_MAP[service.contactMethod];
  const Icon = method.icon;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        onClick={onClick}
        className={cn(
          "glass-cyber h-full transition-all cursor-pointer group",
          diff.border,
          progress?.done ? "opacity-30 grayscale" : "hover:border-primary/50",
          isSelected ? "border-primary/60 ring-1 ring-primary/20 bg-primary/5" : ""
        )}
        role="article"
      >
        <CardContent className="p-5 flex flex-col h-full gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-bold text-sm font-display uppercase tracking-wider group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">{service.category}</p>
            </div>
            {isSelected && (
              <Badge className="bg-primary text-background text-[8px] font-bold h-4 px-1.5 rounded-none">
                [SELECTED]
              </Badge>
            )}
          </div>
          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-[8px] font-bold rounded-none px-1.5 h-4", diff.color, diff.bg, "border-none")}>
                {diff.label}
              </Badge>
              <div className="flex-1 border-t border-primary/5" />
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon size={10} />
                <span className="text-[8px] font-mono">{method.label}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={(e) => { e.stopPropagation(); window.open(service.url, '_blank'); }} 
                className="flex-1 text-[9px] h-7 border-primary/10 font-bold font-mono rounded-none uppercase hover:bg-primary/5"
                aria-label={`Open ${service.name} portal`}
              >
                <ExternalLink size={10} className="mr-1.5" /> Portal
              </Button>
              <Button 
                onClick={(e) => { e.stopPropagation(); onEnhance(service); }} 
                disabled={progress?.done}
                className="flex-1 bg-primary text-background text-[9px] h-7 font-bold font-mono rounded-none uppercase hover:bg-primary/90 transition-colors"
                aria-label={`Enhance deletion protocol for ${service.name}`}
              >
                <Zap size={10} className="mr-1.5" /> Enhance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
ServiceCard.displayName = 'ServiceCard';