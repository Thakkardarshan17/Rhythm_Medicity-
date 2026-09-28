import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DropdownCategory, DropdownOption } from '../types/dropdown';
import { DropdownService, DEFAULT_DROPDOWN_CATEGORIES, DEFAULT_DROPDOWN_OPTIONS } from '../services/dropdownService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DropdownContextType {
  categories: DropdownCategory[];
  options: DropdownOption[];
  loading: boolean;
  refreshDropdowns: () => Promise<void>;
  getOptions: (categoryKey: string, onlyActive?: boolean) => DropdownOption[];
  getActiveOptions: (categoryKey: string) => DropdownOption[];
  getOptionNames: (categoryKey: string, onlyActive?: boolean) => string[];
  getOptionCodes: (categoryKey: string, onlyActive?: boolean) => string[];
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const DropdownProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<DropdownCategory[]>(DEFAULT_DROPDOWN_CATEGORIES);
  const [options, setOptions] = useState<DropdownOption[]>(DEFAULT_DROPDOWN_OPTIONS);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [cats, opts] = await Promise.all([
        DropdownService.getCategories(),
        DropdownService.getAllOptions(),
      ]);
      setCategories(cats);
      setOptions(opts);
    } catch (err) {
      console.error('Error loading dropdowns in DropdownProvider:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    // Supabase Realtime synchronization
    if (isSupabaseConfigured()) {
      const catSub = supabase
        .channel('dropdown_categories_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'dropdown_categories' },
          () => {
            fetchAll();
          }
        )
        .subscribe();

      const optSub = supabase
        .channel('dropdown_options_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'dropdown_options' },
          () => {
            fetchAll();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(catSub);
        supabase.removeChannel(optSub);
      };
    }
  }, [fetchAll]);

  const getOptions = useCallback(
    (categoryKey: string, onlyActive: boolean = false): DropdownOption[] => {
      const filtered = options.filter((o) => o.category_key === categoryKey);
      const sorted = filtered.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      if (onlyActive) {
        return sorted.filter((o) => o.status === 'active');
      }
      return sorted;
    },
    [options]
  );

  const getActiveOptions = useCallback(
    (categoryKey: string): DropdownOption[] => {
      return getOptions(categoryKey, true);
    },
    [getOptions]
  );

  const getOptionNames = useCallback(
    (categoryKey: string, onlyActive: boolean = true): string[] => {
      const opts = getOptions(categoryKey, onlyActive);
      return opts.map((o) => o.name);
    },
    [getOptions]
  );

  const getOptionCodes = useCallback(
    (categoryKey: string, onlyActive: boolean = true): string[] => {
      const opts = getOptions(categoryKey, onlyActive);
      return opts.map((o) => o.code);
    },
    [getOptions]
  );

  const contextValue = useMemo(
    () => ({
      categories,
      options,
      loading,
      refreshDropdowns: fetchAll,
      getOptions,
      getActiveOptions,
      getOptionNames,
      getOptionCodes,
    }),
    [categories, options, loading, fetchAll, getOptions, getActiveOptions, getOptionNames, getOptionCodes]
  );

  return <DropdownContext.Provider value={contextValue}>{children}</DropdownContext.Provider>;
};

export const useDropdowns = (): DropdownContextType => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdowns must be used within a DropdownProvider');
  }
  return context;
};

/**
 * Convenient React hook to get options for a specific category
 */
export const useDropdownOptions = (categoryKey: string, onlyActive: boolean = true) => {
  const { getOptions, loading } = useDropdowns();
  const options = useMemo(() => getOptions(categoryKey, onlyActive), [getOptions, categoryKey, onlyActive]);
  return { options, loading };
};
