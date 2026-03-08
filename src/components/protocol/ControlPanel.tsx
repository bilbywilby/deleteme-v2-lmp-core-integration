import React, { useEffect, useState } from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUI } from '@/context/UIContext';
import { useDebounce } from '@/lib/hooks';
export const ControlPanel = React.memo(() => {
  const { search, setSearch, resetFilters } = useUI();
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);
  return (
    <div className="glass-cyber p-5 space-y-6">
      <div className="flex items-center justify-between text-primary text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-3">
        <div className="flex items-center gap-2">
          <Filter size={14} /> Matrix Filters
        </div>
        <button 
          onClick={resetFilters}
          className="text-muted-foreground hover:text-primary transition-colors"
          title="Reset all filters"
        >
          <RotateCcw size={12} />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <Input 
          placeholder="Search Nodes..." 
          className="bg-black/40 border-primary/20 text-xs font-mono h-10 rounded-none pl-9 focus:border-primary/50 transition-colors"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          aria-label="Search services"
        />
      </div>
    </div>
  );
});
ControlPanel.displayName = 'ControlPanel';