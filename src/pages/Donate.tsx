import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { StarryBackground } from '../components/StarryBackground';
import { Heart, X, MessageSquare, Send, MapPin, User, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface Comment {
  id: number;
  location: string;
  content: string;
  created_at: string;
  ip: string;
}

export default function Donate() {
  const [config, setConfig] = useState<{ totalLeft: number, ipLeft: number } | undefined>(undefined);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Set user_uid cookie if not exists
    const cookies = document.cookie;
    if (!cookies.includes('user_uid=')) {
      const uid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      document.cookie = `user_uid=${uid}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }

    fetch('/api/config')
      .then(r => r.json())
      .then(data => setConfig(data))
      .catch(err => console.error(err));

    fetchComments();
  }, []);

  const fetchComments = () => {
    fetch('/api/comments')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setComments(data);
      })
      .catch(err => console.error(err));
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '发布失败');
      }
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 flex flex-col relative overflow-x-hidden select-none">
      <StarryBackground />
      <Header config={config} />
      
      <main className="flex-1 flex items-start justify-center px-2 sm:px-6 py-4 pt-24 pb-12 z-10 w-full relative max-w-6xl mx-auto">
        {/* Unified Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] w-full border border-blue-100 shadow-2xl relative z-10 flex flex-col lg:flex-row overflow-hidden min-h-[650px] group"
        >
          {/* Close Button - shared for the whole container now */}
          <button 
            onClick={() => navigate('/')} 
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-100/50 hover:bg-slate-200 rounded-full z-20"
            title={t("关闭")}
          >
            <X size={20} />
          </button>

          {/* Left Side: Support Section (40%) */}
          <div className="lg:w-[400px] p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col items-center text-center shrink-0">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Heart size={32} className="text-rose-500 animate-pulse" fill="currentColor" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 mb-4">{t("支持我们的发展")}</h2>
            
            <p className="text-sm sm:text-base text-slate-600 mb-8 leading-relaxed px-2">
              {t("感谢您使用")} <strong className="font-bold text-slate-800">lifeTeller</strong>。{t("本站算力与存储均自费承担。打赏将全额用于抵扣成本，助力项目长存。愿您平安喜乐！")}
            </p>

            <div className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center">
              <h3 className="text-sm sm:text-base font-medium text-slate-700 mb-6 font-serif">{t("微信扫码赞助")}</h3>
              
              <div id="qr-code-container" className="w-[200px] h-[200px] bg-white rounded-xl flex flex-col items-center justify-center overflow-hidden relative mb-6 shadow-sm border border-slate-100">
                <img 
                  src="/payment.jpg"
                  alt={t("微信助力二维码")} 
                  className="w-full h-full object-contain p-2" 
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
                    a.download = 'payment.jpg';
                    a.click();
                  } catch (e) {
                    console.error('Failed to save QR code', e);
                    alert(t('保存失败，请重试'));
                  }
                }}
                className="text-sm px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-medium tracking-wide shadow-sm mt-2 active:scale-95"
              >
                {t("保存收款码为图片")}
              </button>
            </div>
            
            <div className="mt-auto pt-8 text-xs text-slate-400">
               {t("您的每一分心意，都是我们继续前行的动力")}
            </div>
          </div>

          {/* Right Side: Comment Section (60%) */}
          <div className="flex-1 p-5 sm:p-10 flex flex-col min-h-[500px] md:min-h-0 bg-white/30 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 shrink-0">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-slate-800">{t("使用者评论反馈")}</h3>
                  <p className="text-xs text-slate-400 font-sans tracking-wider mt-1">{t("每一条建议我们都会认真倾听")}</p>
                </div>
              </div>
            </div>

            {/* Comment List */}
            <div className="flex-1 space-y-4 mb-8 overflow-y-auto max-h-[450px] pr-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {comments.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 text-sm italic">
                    {t("暂无评论，留下您的第一条足迹吧")}
                  </div>
                ) : (
                  comments.map((comment) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5 bg-white/60 hover:bg-white rounded-2xl border border-slate-100 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 overflow-hidden">
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-full shrink-0 max-w-[150px] sm:max-w-none">
                            <User size={10} className="text-slate-400 shrink-0" />
                            <span className="truncate">{comment.ip}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full text-blue-600 shrink-0 max-w-[120px] sm:max-w-none">
                            <MapPin size={10} className="text-blue-400 shrink-0" />
                            <span className="truncate">{t(comment.location)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 tabular-nums shrink-0">
                          <Clock size={10} />
                          {new Date(comment.created_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                        </div>
                      </div>
                      <p className="text-[13px] sm:text-sm text-slate-700 leading-relaxed break-all font-sans">
                        {t(comment.content)}
                      </p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Post Comment Container */}
            <div className="mt-auto pt-8 border-t border-slate-100 relative">
              <div className="relative group">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t("说点什么吧... (在这里留下您的愿望或对本站的建议)")}
                  className="w-full h-28 bg-slate-50 rounded-2xl border border-slate-200 p-5 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none placeholder:text-slate-400"
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <button
                  disabled={isSubmitting || !newComment.trim()}
                  onClick={handlePostComment}
                  className={`absolute bottom-4 right-4 p-2.5 bg-blue-600 text-white rounded-xl transition-all ${isSubmitting || !newComment.trim() ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-700 hover:scale-110 active:scale-90 shadow-xl shadow-blue-200'}`}
                >
                  <Send size={20} />
                </button>
              </div>
              {error && (
                <p className="text-xs text-rose-500 mt-2 ml-1 flex items-center gap-1.5 animate-pulse font-medium">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                  {t(error)}
                </p>
              )}
              <div className="mt-4 flex items-center justify-center gap-6">
                 <p className="text-xs text-slate-400 font-sans">
                  {t("每人每天限2条")}
                </p>
                <div className="h-3 w-[1px] bg-slate-100" />
                 <p className="text-xs text-slate-400 font-sans">
                  {t("恶意言论将被永久封禁 IP")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
