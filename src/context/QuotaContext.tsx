import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface QuotaConfig {
  totalLeft: number;
  ipLeft: number;
}

interface QuotaContextType {
  config: QuotaConfig | undefined;
  refreshConfig: () => Promise<void>;
  loading: boolean;
}

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

export function QuotaProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<QuotaConfig | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const refreshConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      if (res.status === 429) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data && typeof data.totalLeft === 'number') {
        setConfig(data);
      }
    } catch (err) {
      // Damping the error log to avoid spamming
      if (process.env.NODE_ENV === 'development') {
        console.warn("Quota fetch failed (possibly transient):", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    
    // Refresh every 2 minutes
    const interval = setInterval(refreshConfig, 120000);
    
    // Refresh on tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshConfig();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshConfig]);

  return (
    <QuotaContext.Provider value={{ config, refreshConfig, loading }}>
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  const context = useContext(QuotaContext);
  if (context === undefined) {
    throw new Error('useQuota must be used within a QuotaProvider');
  }
  return context;
}
