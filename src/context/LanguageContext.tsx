import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as OpenCC from 'opencc-js';

type Language = 'zh-CN' | 'zh-TW';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (text: string) => string;
  translateObject: (obj: any) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'zh-CN' || saved === 'zh-TW') return saved;
    
    // Default to browser setting
    const browserLang = window.navigator.language.toLowerCase();
    if (browserLang.includes('tw') || browserLang.includes('hk') || browserLang.includes('mo')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  });

  const [converter, setConverter] = useState<any>(null);

  useEffect(() => {
    // Initializing converters
    // For Simplified to Traditional
    const s2t = OpenCC.Converter({ from: 'cn', to: 'twp' }); // twp for Taiwan phrase
    // For Traditional to Simplified
    const t2s = OpenCC.Converter({ from: 'tw', to: 'cn' });
    
    setConverter({ s2t, t2s });
    localStorage.setItem('app_language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'zh-CN' ? 'zh-TW' : 'zh-CN'));
  };

  const t = (text: string): string => {
    if (!text || !converter) return text;
    if (language === 'zh-TW') {
      return converter.s2t(text);
    } else {
      return text; 
    }
  };

  const translateObject = (obj: any): any => {
    if (!obj || language === 'zh-CN' || !converter) return obj;
    
    if (typeof obj === 'string') {
      return t(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => translateObject(item));
    }
    
    if (typeof obj === 'object') {
      const newObj: any = {};
      for (const key in obj) {
        newObj[key] = translateObject(obj[key]);
      }
      return newObj;
    }
    
    return obj;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, translateObject }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
