import { useState, useEffect } from 'react';
import { AnimatedLogo } from './AnimatedLogo';

export function Footer() {
  const [quote, setQuote] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<{providerName: string, modelId: string} | null>(null);

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

    // Fetch model info from API
    const fetchModelInfo = (retries = 2) => {
      fetch('/api/model-info')
        .then(res => {
          if (res.status === 429) {
            // Silently ignore rate limits for non-critical info
            return null;
          }
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data && data.providerName && data.modelId) {
            setModelInfo(data);
          }
        })
        .catch(err => {
          if (retries > 0 && !err.message.includes('429')) {
            setTimeout(() => fetchModelInfo(retries - 1), 2000);
          } else {
            // Only log if it's not a rate limit
            if (!err.message.includes('429')) {
              console.error('Failed to fetch model info:', err);
            }
          }
        });
    };

    fetchModelInfo();
  }, []);

  return (
    <footer className="w-full text-center py-6 border-t border-blue-100/50 text-slate-500 mt-auto relative z-10 bg-white/60 backdrop-blur-sm print-hide">
      <div className="flex items-center justify-center gap-3 mb-4 px-6 max-w-2xl mx-auto">
        <AnimatedLogo size={28} grayscale={true} />
        {quote ? (
          <span className="font-serif italic text-[15px] text-slate-600 leading-relaxed text-left">"{quote}"</span>
        ) : (
          <span className="font-serif font-bold text-xl text-slate-400">lifeTeller</span>
        )}
      </div>
      <p className="text-sm px-4">免责声明: 本程序基于传统易学文化，预测结果仅供娱乐参考，切勿过度迷信。命运掌握在自己手中。</p>
      <p className="mt-3 text-sm">
        © {new Date().getFullYear()} lifeTeller. 
        {modelInfo ? (
          <span className="ml-1 opacity-80">Powered by {modelInfo.providerName} ({modelInfo.modelId})</span>
        ) : (
          <span className="ml-1 opacity-80">by AI.</span>
        )}
      </p>
    </footer>
  );
}
