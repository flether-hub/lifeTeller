import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";

interface FortuneResult {
  summary: string;
  recent: string;
  career: string;
  wealth: string;
  family: string;
  health: string;
  decades: Array<{
    ageRange: string;
    description: string;
    career: number;
    wealth: number;
    family: number;
    health: number;
  }>;
  luckyNumbers: string;
  luckyColors: string;
  iChingQuote: string;
}

interface ReadingContextType {
  isReading: boolean;
  setIsReading: (v: boolean) => void;
  result: FortuneResult | null;
  setResult: (v: FortuneResult | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
  debugLogs: string[];
  setDebugLogs: (v: string[] | ((prev: string[]) => string[])) => void;
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

const maskLogs = (logs: string[]) =>
  logs.map((l) => l.replace(/AIza[0-9A-Za-z-_]{35}/g, "AIzaSy***"));
const maskError = (e: string | null) =>
  e ? e.replace(/AIza[0-9A-Za-z-_]{35}/g, "AIzaSy***") : null;

export function ReadingProvider({ children }: { children: ReactNode }) {
  const [isReading, setIsReading] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [error, setErrorState] = useState<string | null>(() => {
    return localStorage.getItem("kv_error") || null;
  });
  const [debugLogs, setDebugLogsState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("kv_debugLogs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const setIsReadingWrapped = (v: boolean) => {
    setIsReading(v);
  };

  const setError = (v: string | null) => {
    const masked = maskError(v);
    setErrorState(masked);
    if (masked) {
      localStorage.setItem("kv_error", masked);
    } else {
      localStorage.removeItem("kv_error");
    }
  };

  const setDebugLogs = (v: string[] | ((prev: string[]) => string[])) => {
    setDebugLogsState((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      const masked = maskLogs(next);
      localStorage.setItem("kv_debugLogs", JSON.stringify(masked));
      return masked;
    });
  };

  return (
    <ReadingContext.Provider
      value={{
        isReading,
        setIsReading: setIsReadingWrapped,
        result,
        setResult,
        error,
        setError,
        debugLogs,
        setDebugLogs,
      }}
    >
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error("useReading must be used within a ReadingProvider");
  }
  return context;
}
