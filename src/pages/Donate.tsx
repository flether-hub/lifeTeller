import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { StarryBackground } from '../components/StarryBackground';
import { Heart, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Donate() {
  const [config, setConfig] = useState<{ totalLeft: number, ipLeft: number } | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/config')
      .then(async r => {
        const text = await r.text();
        try { return JSON.parse(text); } catch { return {}; }
      })
      .then(data => setConfig(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen font-sans text-slate-800 flex flex-col relative overflow-x-hidden select-none">
      <StarryBackground />
      <Header config={config} />
      
      <main className="flex-1 flex items-center justify-center p-4 pt-20 pb-12 z-10 w-full relative">
        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl w-full max-w-lg border border-blue-100 shadow-2xl relative z-10 text-center group">
          <button 
            onClick={() => navigate('/')} 
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-100/50 hover:bg-slate-200 rounded-full"
            title="关闭"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
          
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner">
            <Heart size={28} className="sm:w-8 sm:h-8 text-rose-500 animate-pulse" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 mb-4 px-2">支持我们的发展</h2>
          
          <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-4">
            感谢您使用 <strong className="font-bold text-slate-800">lifeTeller</strong>。本站的大模型调用与服务器托管均由开发者本人自费承担。如果这里的测算曾为您带来启发，欢迎随缘打赏，您的支持将全额用于抵扣服务器与AI调用成本，助力项目长存。愿您岁岁平安！
          </p>

          <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8 flex flex-col items-center">
            <h3 className="text-sm sm:text-base font-medium text-slate-700 mb-4 sm:mb-6">微信扫码赞助</h3>
            
            {/* Placeholder for QR Code */}
            <div id="qr-code-container" className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] bg-white rounded-xl flex flex-col items-center justify-center overflow-hidden relative mb-4 sm:mb-6 shadow-sm border border-slate-100">
              <img 
                src="/payment.png"
                alt="微信助力二维码" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <button 
              onClick={async () => {
                const el = document.getElementById('qr-code-container');
                if (!el) return;
                try {
                  const { toJpeg } = await import('html-to-image');
                  const url = await toJpeg(el, { 
                    quality: 0.95,
                    pixelRatio: 2,
                    backgroundColor: '#ffffff',
                    skipFonts: true
                  });
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'payment.png';
                  a.click();
                } catch (e) {
                  console.error('Failed to save QR code', e);
                  alert('保存失败，请重试');
                }
              }}
              className="text-sm px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-medium tracking-wide shadow-sm mt-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            >
              保存收款码为图片
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
