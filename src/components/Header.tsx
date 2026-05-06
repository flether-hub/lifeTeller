import { Link, useLocation } from 'react-router-dom';
import { Settings, Ticket, Heart, Globe, Moon, Shield, ScrollText, UserCircle, LogOut, Languages } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AIOracleAnimation } from './AIOracleAnimation';
import { AnimatedLogo } from './AnimatedLogo';
import { useLanguage } from '../context/LanguageContext';

export function Header({ config: propConfig }: { config?: { totalLeft: number, ipLeft: number } }) {
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => !!localStorage.getItem('admin_token'));
  const [localConfig, setLocalConfig] = useState(propConfig);

  useEffect(() => {
    const checkLogin = () => setIsAdminLoggedIn(!!localStorage.getItem('admin_token'));
    checkLogin();
    
    window.addEventListener('storage', checkLogin);
    // Also listen for a custom event if we dispatch it manually in the same window
    window.addEventListener('admin-login-changed', checkLogin);
    
    return () => {
      window.removeEventListener('storage', checkLogin);
      window.removeEventListener('admin-login-changed', checkLogin);
    };
  }, [location.pathname]);

  useEffect(() => {
    // Only fetch if propConfig is missing AND we don't have localConfig yet
    if (!propConfig && !localConfig) {
      // Add a small random delay to avoid thundering herd with Home.tsx
      const timer = setTimeout(() => {
        fetch("/api/config")
          .then(async (res) => {
            if (res.status === 429) return; // Silent on rate limit
            try {
              const data = JSON.parse(await res.text());
              setLocalConfig(data);
            } catch (e) {}
          })
          .catch(() => {});
      }, Math.random() * 500);
      return () => clearTimeout(timer);
    } else if (propConfig) {
      setLocalConfig(propConfig);
    }
  }, [propConfig, localConfig]);

  const config = localConfig;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAdminLoggedIn(false);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('admin-login-changed'));
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 shadow-sm flex justify-center">
      <div className="w-full max-w-6xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            className="flex items-center gap-2.5 transition-all relative group"
            title={t("返回首页")}
          >
            <AnimatedLogo size={32} />
            <span className="font-serif text-slate-800 font-bold text-base sm:text-lg tracking-widest">lifeTeller</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 mx-4">
          <AIOracleAnimation />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-sm text-slate-600">
          {/* Donate Icon */}
          {!isAdminLoggedIn && (
            <Link to="/donate" className="group relative flex items-center justify-center p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors" title={t("捐赠支持")}>
              <Heart size={18} className="group-hover:scale-110 transition-transform" fill="currentColor" />
            </Link>
          )}

          {/* Language Toggle Icon */}
          {!isAdminLoggedIn && (
            <button 
              onClick={toggleLanguage}
              className="group relative flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95" 
              title={language === 'zh-CN' ? "切換至繁體" : "切换至简体"}
            >
              <span className="text-xs font-bold text-slate-700">
                {language === 'zh-CN' ? '简' : '繁'}
              </span>
            </button>
          )}

          {/* Combined balance icon */}
          {config && (
            <div 
              className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full cursor-help hover:bg-slate-100 transition-colors" 
              title={t(`全网今日剩余签位: ${config.totalLeft}\n您今日剩余签位: ${config.ipLeft}`)}
            >
              <ScrollText size={16} className={config.ipLeft > 0 ? "text-slate-500" : "text-rose-500"} />
              <span className="font-mono font-bold text-slate-700 flex items-center text-xs">
                <span className="hidden sm:inline-flex items-center">
                  {config.totalLeft} <span className="text-slate-400 font-normal mx-1">/</span>
                </span>
                <span className={config.ipLeft > 0 ? "text-emerald-600" : "text-rose-600"}>{config.ipLeft}</span>
              </span>
              
              {/* Custom tooltip for empty slots */}
              {config.ipLeft === 0 && (
                <div className="absolute top-full right-0 mt-3 w-64 p-3 bg-white border border-rose-200 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-rose-700">
                  <p className="font-bold mb-1">{t("今日签位已用完")}</p>
                  <p>{t("为了防止滥用，每位访客每天有固定求签次数。您的签位将在北京时间(东八区) 0:00 重置，请明日再来！")}</p>
                </div>
              )}
            </div>
          )}

          {/* Admin Controls */}
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-1">
              <Link to="/admin" className="p-2 rounded-full hover:bg-slate-200 transition-colors group" title="管理后台">
                <Settings size={20} className="text-slate-500 group-hover:text-slate-800" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 transition-colors group"
                title="退出登录"
              >
                <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
              </button>
            </div>
          ) : (
            <Link to="/admin" className="p-2 rounded-full hover:bg-slate-200 transition-colors group" title="后台登录">
              <Settings size={20} className="text-slate-400 group-hover:text-slate-700" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
