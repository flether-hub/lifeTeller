import { useState, useEffect } from 'react';

export function Footer() {
  const [quote, setQuote] = useState<string | null>(null);

  useEffect(() => {
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
    <footer className="w-full text-center py-10 border-t border-blue-100/50 text-slate-500 mt-auto relative z-10 bg-white/60 backdrop-blur-sm print-hide">
      <div className="flex items-center justify-center gap-3 mb-4 px-6 max-w-2xl mx-auto">
        <svg viewBox="0 0 100 100" className="w-7 h-7 text-slate-300 shrink-0" fill="currentColor">
          <path d="M 50 20 A 30 30 0 0 1 50 80 A 15 15 0 0 0 50 50 A 15 15 0 0 1 50 20 Z" fill="currentColor" />
          <path d="M 50 20 A 30 30 0 0 0 50 80 A 15 15 0 0 0 50 50 A 15 15 0 0 1 50 20 Z" fill="#e2e8f0" />
          <circle cx="50" cy="35" r="4" fill="#e2e8f0" />
          <circle cx="50" cy="65" r="4" fill="currentColor" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
        </svg>
        {quote ? (
          <span className="font-serif italic text-[15px] text-slate-600 leading-relaxed text-left">"{quote}"</span>
        ) : (
          <span className="font-serif font-bold text-xl text-slate-400">lifeTeller</span>
        )}
      </div>
      <p className="text-sm px-4">免责声明: 本程序基于传统易学文化，预测结果仅供娱乐参考，切勿过度迷信。命运掌握在自己手中。</p>
      <p className="mt-3 text-sm">© {new Date().getFullYear()} lifeTeller. by AI.</p>
    </footer>
  );
}
