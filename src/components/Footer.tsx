import { useState, useEffect } from 'react';
import { AnimatedLogo } from './AnimatedLogo';
import { useReading } from '../context/ReadingContext';
import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const [quote, setQuote] = useState<string | null>(null);
  const { modelInfo } = useReading();
  const { t } = useLanguage();

  useEffect(() => {
    // Fetch quote from localStorage
    try {
      const item = localStorage.getItem('last_reading');
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed?.result?.iChingQuote) {
          setQuote(parsed.result.iChingQuote);
        }
      }
    } catch(e) {}
  }, []);

  return (
    <footer className="w-full text-center py-6 border-t border-blue-100/50 text-slate-500 mt-auto relative z-10 bg-white/60 backdrop-blur-sm print-hide">
      <div className="flex items-center justify-center gap-3 mb-4 px-6 max-w-2xl mx-auto">
        <AnimatedLogo size={28} grayscale={true} />
        {quote ? (
          <span className="font-serif italic text-[15px] text-slate-600 leading-relaxed text-left">"{t(quote)}"</span>
        ) : (
          <span className="font-serif font-bold text-xl text-slate-400">lifeTeller</span>
        )}
      </div>
      <p className="text-sm px-6">{t("免责声明: 本程序基于传统易学文化，预测结果仅供娱乐参考，切勿过度迷信。命运掌握在自己手中。")}</p>
      <p className="mt-3 text-sm">
        © {new Date().getFullYear()} lifeTeller. 
        {modelInfo ? (
          <span className="ml-1 opacity-80">Powered by {modelInfo.modelId}</span>
        ) : (
          <span className="ml-1 opacity-80">Technology by Gemini</span>
        )}
      </p>
    </footer>
  );
}
