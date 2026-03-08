import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
interface Filters {
  category: string;
  difficulty: string;
  favorites: boolean;
  pending: boolean;
}
interface UIContextType {
  search: string;
  setSearch: (val: string) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  activeTab: string;
  setActiveTab: (val: string) => void;
  resetFilters: () => void;
}
const UIContext = createContext<UIContextType | undefined>(undefined);
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const [filters, setFilters] = useState<Filters>({
    category: 'All',
    difficulty: 'All',
    favorites: false,
    pending: false
  });
  const resetFilters = useCallback(() => {
    setFilters({
      category: 'All',
      difficulty: 'All',
      favorites: false,
      pending: false
    });
    setSearch('');
  }, []);
  const value = useMemo(() => ({
    search,
    setSearch,
    filters,
    setFilters,
    activeTab,
    setActiveTab,
    resetFilters
  }), [search, filters, activeTab, resetFilters]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
}