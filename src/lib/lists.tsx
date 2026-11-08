import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCategories, getOccasions } from '@/db/lists';
import { DEFAULT_CATEGORIES, DEFAULT_OCCASIONS, type CategoryDef, type OccasionDef } from '@/types';

// Shares your category + occasion lists with every screen.
// Call reload() after changing them in Settings so all screens update.
type Lists = { categories: CategoryDef[]; occasions: OccasionDef[]; reload: () => Promise<void> };

const ListsContext = createContext<Lists>({
  categories: DEFAULT_CATEGORIES,
  occasions: DEFAULT_OCCASIONS,
  reload: async () => {},
});

export function ListsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [occasions, setOccasions] = useState(DEFAULT_OCCASIONS);

  const reload = useCallback(async () => {
    setCategories(await getCategories(db));
    setOccasions(await getOccasions(db));
  }, [db]);

  useEffect(() => {
    reload();
  }, [reload]);

  return <ListsContext.Provider value={{ categories, occasions, reload }}>{children}</ListsContext.Provider>;
}

export const useLists = () => useContext(ListsContext);
