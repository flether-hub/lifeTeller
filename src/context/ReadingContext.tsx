import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FortuneResult {
  summary: string;
  recent: string;
  career: string;
  wealth: string;
  family: string;
  health: string;
  decades: Array<{ageRange: string, description: string, career: number, wealth: number, family: number, health: number}>;
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

export function ReadingProvider({ children }: { children: ReactNode }) {
  const [isReading, setIsReading] = useState(false);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  return (
    <ReadingContext.Provider value={{
      isReading, setIsReading,
      result, setResult,
      error, setError,
      debugLogs, setDebugLogs
    }}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading() {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
}
