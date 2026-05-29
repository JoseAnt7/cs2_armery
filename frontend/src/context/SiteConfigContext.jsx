import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchPublicSettings } from '../api/client';

const SiteConfigContext = createContext({
  settings: null,
  refresh: async () => {},
});

export function SiteConfigProvider({ children }) {
  const [settings, setSettings] = useState(null);

  const refresh = useCallback(async () => {
    const data = await fetchPublicSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

