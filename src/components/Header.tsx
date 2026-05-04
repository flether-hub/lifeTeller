import { Link, useLocation } from 'react-router-dom';
import { Settings, Ticket, Heart, Globe, Moon, Shield, ScrollText, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AIOracleAnimation } from './AIOracleAnimation';
import { AnimatedLogo } from './AnimatedLogo';

export function Header({ config }: { config?: { totalLeft: number, ipLeft: number } }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    setIsAdminLoggedIn(!!localStorage.getItem('admin_token'));
    const handleStorageChange = () => {
      setIsAdminLoggedIn(!!localStorage.getItem('admin_token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 z-50 shadow-sm flex items-center justify-between px-6 py-1">
      <div className="flex items-center gap-3">
        <Link 
          to="/" 
          className="flex items-center gap-3 transition-all relative group"
          title="返回首页"
        >
          <AnimatedLogo size={40} />
          <span className="font-serif text-slate-800 font-bold text-xl tracking-widest hidden sm:block">lifeTeller</span>
        </Link>
      </div>

      <div className="hidden md:flex flex-1 mx-4">
        <AIOracleAnimation />
      </div>

      <div className="flex items-center gap-5 text-sm text-slate-600">
        {!isAdmin && config ? (
          <>
            {/* Donate Icon */}
            <Link to="/donate" className="group relative flex items-center justify-center p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors" title="捐赠支持">
              <Heart size={20} className="group-hover:scale-110 transition-transform" fill="currentColor" />
            </Link>

            {/* Total balance icon */}
            <div className="group relative flex items-center gap-1 cursor-help" title={`全网今日剩余签位: ${config.totalLeft}`}>
              <ScrollText size={18} className="text-slate-500" />
              <span className="font-mono text-slate-700 font-bold">{config.totalLeft}</span>
            </div>

            {/* User balance icon */}
            <div className="group relative flex items-center gap-1 cursor-help" title={config.ipLeft > 0 ? `您今日剩余签位: ${config.ipLeft}` : "今日签位已用完"}>
              <UserCircle size={18} className={config.ipLeft > 0 ? "text-emerald-600" : "text-rose-500"} />
              <span className={`font-mono font-bold ${config.ipLeft > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                {config.ipLeft}
              </span>
              
              {/* Custom tooltip for empty slots */}
              {config.ipLeft === 0 && (
                <div className="absolute top-full right-0 mt-3 w-64 p-3 bg-white border border-rose-200 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-rose-700">
                  <p className="font-bold mb-1">今日签位已用完</p>
                  <p>为了防止滥用，每位访客每天有固定求签次数。您的签位将在北京时间(东八区) 0:00 重置，请明日再来！</p>
                </div>
              )}
            </div>

            {/* Admin Login Icon */}
            <Link to="/admin" className="p-2 rounded-full hover:bg-slate-200 transition-colors group" title={isAdminLoggedIn ? "已登录后台" : "后台登录"}>
              {isAdminLoggedIn ? (
                <Shield size={20} className="text-blue-500 group-hover:text-blue-600" />
              ) : (
                <Settings size={20} className="text-slate-400 group-hover:text-slate-700" />
              )}
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
