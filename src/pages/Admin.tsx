import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import {
  LogOut,
  Settings,
  List,
  Map as MapIcon,
  Home as HomeIcon,
  Eye,
  Trash2,
  X,
  Save,
  Sparkles,
  Cpu,
  MessageSquare,
  ShieldX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FortuneResultView } from "../components/FortuneResultView";
import { StarryBackground } from "../components/StarryBackground";
import { generateExportData } from "../lib/exportUtils";

export default function Admin() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"readings" | "map" | "settings" | "moderation">(
    "readings",
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('admin_token') || "");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Data states
  const [readings, setReadings] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [mapData, setMapData] = useState<any>({ points: [], provinces: [] });
  const [comments, setComments] = useState<any[]>([]);
  const [bannedIps, setBannedIps] = useState<any[]>([]);
  const [modSubTab, setModSubTab] = useState<"comments" | "bans">("comments");
  const [settings, setSettings] = useState<any>({
    total_daily_limit: "",
    ip_daily_limit: "",
    gemini_api_key: "",
    gemini_model_id: "gemini-2.0-flash",
    aliyun_api_key: "",
    model_provider: "gemini",
    aliyun_model_id: "qwen-plus",
  });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [selectedReading, setSelectedReading] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Export states
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportReadyUrl, setExportReadyUrl] = useState<string | null>(null);
  const [exportType, setExportType] = useState<"pdf" | "image">("pdf");

  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      setToken("");
      localStorage.removeItem("admin_token");
      window.dispatchEvent(new Event('storage'));
      return res; // Returning instead of throwing prevents Vite unhandled rejection error overlay
    }
    return res;
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, activeTab, page]);

  const loadData = async () => {
    try {
      const getJson = async (res: Response) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return {};
        }
      };

      if (activeTab === "readings") {
        const res = await fetchWithToken(
          `/api/admin/readings?page=${page}&limit=${limit}`,
        );
        const r = await getJson(res);
        setReadings(r.data);
        setTotal(r.total);
      } else if (activeTab === "map") {
        const res = await fetchWithToken("/api/admin/map-data");
        const m = await getJson(res);
        setMapData(m);
      } else if (activeTab === "settings") {
        const res = await fetchWithToken("/api/admin/settings");
        const s = await getJson(res);
        setSettings((prev: any) => ({ ...prev, ...s }));
      } else if (activeTab === "moderation") {
        const res1 = await fetchWithToken("/api/admin/comments");
        const c = await getJson(res1);
        setComments(Array.isArray(c) ? c : []);

        const res2 = await fetchWithToken("/api/admin/banned-ips");
        const b = await getJson(res2);
        setBannedIps(Array.isArray(b) ? b : []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    let data: any = {};
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data.error = text || "Login failed";
    }

    if (res.ok) {
      setToken(data.token);
      localStorage.setItem("admin_token", data.token);
      window.dispatchEvent(new Event('storage'));
    } else {
      setError(data.error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    await fetchWithToken("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setMsg("设置已保存");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    try {
      await fetchWithToken(`/api/admin/readings/${id}`, { method: "DELETE" });
      setReadings(readings.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
      alert("删除失败");
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!confirm("确定要删除这条评论吗？")) return;
    await fetchWithToken(`/api/admin/comments/${id}`, { method: "DELETE" });
    setComments(comments.filter(c => c.id !== id));
  };

  const handleBanIp = async (ip: string) => {
    const reason = prompt("请输入封禁原因", "恶意评论/广告");
    if (reason === null) return;
    await fetchWithToken("/api/admin/ban-ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, reason })
    });
    loadData();
  };

  const handleUnbanIp = async (ip: string) => {
    await fetchWithToken(`/api/admin/ban-ip/${ip}`, { method: "DELETE" });
    setBannedIps(bannedIps.filter(b => b.ip !== ip));
  };

  const viewReading = (reading: any) => {
    setSelectedReading(reading);
  };

  if (!token) {
    return (
      <div className="min-h-screen font-sans text-slate-800 flex flex-col relative overflow-x-hidden">
        <StarryBackground />
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 mt-16 z-10 w-full relative">
          <form
            onSubmit={handleLogin}
            className="bg-white/90 backdrop-blur-2xl p-8 rounded-2xl w-full max-w-sm border border-blue-100 shadow-2xl relative z-10"
          >
            <h2 className="text-2xl text-blue-800 font-serif font-bold mb-6 text-center">
              系统管理后台
            </h2>
            <div className="mb-4">
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="输入管理密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-blue-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {error && (
              <p className="text-rose-500 mb-4 text-sm text-center">{error}</p>
            )}
            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white p-3 rounded-xl font-bold font-serif tracking-widest transition shadow-md">
              登 录
            </button>
          </form>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-800 flex flex-col relative overflow-x-hidden">
      <StarryBackground />
      <Header />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden mt-16 z-10 pt-2 pb-6 px-6 gap-4 max-w-7xl mx-auto w-full h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white/90 backdrop-blur-2xl border border-blue-100 flex flex-col shadow-xl rounded-2xl overflow-hidden shrink-0">
          <div className="hidden md:flex p-6 border-b border-blue-50 items-center justify-center">
            <h1 className="text-xl font-bold font-serif text-blue-800">
              管理中心
            </h1>
          </div>
          <nav className="flex-none flex flex-row overflow-x-auto md:flex-col md:flex-1 p-2 md:p-4 gap-2 md:gap-0 md:space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab("readings")}
              className={`flex-1 shrink-0 md:flex-none md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-3 rounded-xl transition whitespace-nowrap ${activeTab === "readings" ? "bg-blue-50 text-blue-700 font-medium border border-blue-100 shadow-sm md:shadow-none md:border-transparent" : "bg-slate-50 md:bg-transparent text-slate-500 hover:bg-slate-100 md:hover:bg-slate-50"}`}
            >
              <List size={20} className="shrink-0" />{" "}
              <span className="hidden md:inline">查询记录</span>
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-1 shrink-0 md:flex-none md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-3 rounded-xl transition whitespace-nowrap ${activeTab === "map" ? "bg-blue-50 text-blue-700 font-medium border border-blue-100 shadow-sm md:shadow-none md:border-transparent" : "bg-slate-50 md:bg-transparent text-slate-500 hover:bg-slate-100 md:hover:bg-slate-50"}`}
            >
              <MapIcon size={20} className="shrink-0" />{" "}
              <span className="hidden md:inline">来源分布</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 shrink-0 md:flex-none md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-3 rounded-xl transition whitespace-nowrap ${activeTab === "settings" ? "bg-blue-50 text-blue-700 font-medium border border-blue-100 shadow-sm md:shadow-none md:border-transparent" : "bg-slate-50 md:bg-transparent text-slate-500 hover:bg-slate-100 md:hover:bg-slate-50"}`}
            >
              <Settings size={20} className="shrink-0" />{" "}
              <span className="hidden md:inline">系统设置</span>
            </button>
            <button
              onClick={() => setActiveTab("moderation")}
              className={`flex-1 shrink-0 md:flex-none md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-3 rounded-xl transition whitespace-nowrap ${activeTab === "moderation" ? "bg-blue-50 text-blue-700 font-medium border border-blue-100 shadow-sm md:shadow-none md:border-transparent" : "bg-slate-50 md:bg-transparent text-slate-500 hover:bg-slate-100 md:hover:bg-slate-50"}`}
            >
              <ShieldX size={20} className="shrink-0" />{" "}
              <span className="hidden md:inline">内容审核</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-white/95 border border-blue-100 shadow-xl rounded-2xl p-4 md:p-8 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
          {activeTab === "readings" && (
            <div>
              <h2 className="text-2xl font-serif text-blue-800 font-bold mb-6">
                查询记录
              </h2>
              <div className="bg-white rounded-xl overflow-x-auto border border-blue-100 shadow-sm">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-blue-100">
                    <tr>
                      <th className="p-4 font-medium text-slate-600 whitespace-nowrap">
                        序号
                      </th>
                      <th className="p-4 font-medium text-slate-600 whitespace-nowrap">
                        时间
                      </th>
                      <th className="p-4 font-medium text-slate-600 whitespace-nowrap">
                        受测者姓名
                      </th>
                      <th className="p-4 font-medium text-slate-600 whitespace-nowrap">
                        地域
                      </th>
                      <th className="p-4 font-medium text-slate-600 whitespace-nowrap">
                        IP地址
                      </th>
                      <th className="p-4 font-medium text-slate-600 text-right whitespace-nowrap">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {readings?.map((r, index) => {
                      const displayId = total - ((page - 1) * limit + index);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="p-4 text-slate-500 text-sm whitespace-nowrap">
                            #{displayId}
                          </td>
                          <td className="p-4 text-slate-600 whitespace-nowrap">
                            {r.created_at
                              ? new Date(r.created_at).toLocaleString()
                              : "-"}
                          </td>
                          <td className="p-4 font-medium text-blue-700 whitespace-nowrap">
                            {r.name}
                          </td>
                          <td className="p-4 text-slate-600 whitespace-nowrap text-xs">
                            {r.ip_location || "未知"}
                          </td>
                          <td className="p-4 font-mono text-sm text-slate-400 whitespace-nowrap">
                            {r.ip}
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => viewReading(r)}
                              className="text-blue-500 hover:text-blue-700 transition"
                              title="查看结果"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(r.id)}
                              className="text-rose-500 hover:text-rose-700 transition"
                              title="删除记录"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {(!readings || readings.length === 0) && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-400"
                        >
                          暂无记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {total > 0 && (
                <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                  <div className="text-sm text-slate-500 font-medium">
                    共 {total} 条记录
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      上一页
                    </button>
                    <span className="px-4 py-2 text-sm text-slate-600 font-medium flex items-center">
                      {page} / {Math.max(1, Math.ceil(total / limit))}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(total / limit)}
                      className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "map" && (
            <div className="h-full flex flex-col">
              <h2 className="text-2xl font-serif text-blue-800 font-bold mb-6 shrink-0">
                用户来源地理分布
              </h2>
              <div className="bg-slate-50 p-6 rounded-xl border border-blue-100 shadow-sm flex-1 relative overflow-hidden flex items-center justify-center min-h-[500px]">
                <ComposableMap
                  projection="geoMercator"
                  className="w-full h-full max-h-[600px]"
                >
                  <ZoomableGroup
                    zoom={1}
                    center={[104, 35]}
                    minZoom={1}
                    maxZoom={10}
                  >
                    <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#cbd5e1"
                            stroke="#f8fafc"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: "none" },
                              hover: { outline: "none", fill: "#94a3b8" },
                              pressed: { outline: "none" },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                    {mapData.points?.map((loc: any, i: number) => {
                      return (
                        <Marker key={i} coordinates={[loc.lon, loc.lat]}>
                          <g transform="translate(-8, -20)">
                            <path
                              d="M12 14v4M8 18h8M12 14C8.686 14 6 16.239 6 19v1h12v-1c0-2.761-2.686-5-6-5z"
                              fill="#4f46e5"
                              stroke="#4f46e5"
                              strokeWidth="1"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="8" r="4" fill="#4f46e5" />
                          </g>
                          <text
                            textAnchor="middle"
                            y={-22}
                            style={{
                              fill: "#0f172a",
                              fontSize: "10px",
                              fontWeight: "bold",
                              pointerEvents: "none",
                              textShadow:
                                "1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
                            }}
                          >
                            {loc.ip_location}
                            {loc.count ? ` (${loc.count})` : ""}
                          </text>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              </div>
            </div>
          )}

          {activeTab === "moderation" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-serif text-blue-800 font-bold pr-4 border-r border-slate-200">
                  内容审核
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setModSubTab("comments")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${modSubTab === 'comments' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    评论管理
                  </button>
                  <button 
                    onClick={() => setModSubTab("bans")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${modSubTab === 'bans' ? 'bg-rose-100 text-rose-700' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    封禁列表
                  </button>
                </div>
              </div>

              {modSubTab === "comments" ? (
                <div className="bg-white rounded-xl overflow-x-auto border border-blue-100 shadow-sm">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-blue-100">
                      <tr>
                        <th className="p-4 font-medium text-slate-600">IP / 位置</th>
                        <th className="p-4 font-medium text-slate-600">内容</th>
                        <th className="p-4 font-medium text-slate-600">时间</th>
                        <th className="p-4 font-medium text-slate-600 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {comments.map((c) => (
                        <tr key={c.id} className={`hover:bg-slate-50 transition ${c.is_deleted ? 'opacity-40 grayscale' : ''}`}>
                          <td className="p-4">
                            <div className="text-sm font-medium text-slate-800">{c.ip}</div>
                            <div className="text-[10px] text-slate-400">{c.location}</div>
                          </td>
                          <td className="p-4 w-1/2">
                            <p className="text-sm text-slate-600 line-clamp-2">{c.content}</p>
                          </td>
                          <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(c.created_at).toLocaleString()}
                          </td>
                          <td className="p-4 text-right space-x-3">
                            <button 
                              onClick={() => handleBanIp(c.ip)}
                              className="text-orange-500 hover:text-orange-700 transition" 
                              title="封禁 IP"
                            >
                              <ShieldX size={18} />
                            </button>
                            {!c.is_deleted && (
                              <button 
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-rose-500 hover:text-rose-700 transition" 
                                title="删除评论"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {comments.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">暂无评论数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-xl overflow-x-auto border border-blue-100 shadow-sm">
                  <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-blue-100">
                      <tr>
                        <th className="p-4 font-medium text-slate-600">封禁 IP</th>
                        <th className="p-4 font-medium text-slate-600">封禁原因</th>
                        <th className="p-4 font-medium text-slate-600">封禁时间</th>
                        <th className="p-4 font-medium text-slate-600 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {bannedIps.map((b) => (
                        <tr key={b.ip} className="hover:bg-slate-50 transition">
                          <td className="p-4 font-mono text-sm text-slate-800">{b.ip}</td>
                          <td className="p-4 text-sm text-slate-600">{b.reason}</td>
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(b.created_at).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleUnbanIp(b.ip)}
                              className="text-blue-500 hover:text-blue-700 transition font-medium text-sm"
                            >
                              解封
                            </button>
                          </td>
                        </tr>
                      ))}
                      {bannedIps.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">暂无黑名单数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-blue-800 font-bold">
                  系统配置
                </h2>
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
                  title="保存当前所有设置"
                >
                  <Save size={18} />
                  <span>保存设置</span>
                </button>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-blue-100 shadow-sm space-y-8 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-700 mb-2 font-medium ml-1">
                      每日全站总额度 (防刷限制)
                    </label>
                    <input
                      type="number"
                      value={settings.total_daily_limit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          total_daily_limit: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-blue-100 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2 font-medium ml-1">
                      单IP每日额度限制
                    </label>
                    <input
                      type="number"
                      value={settings.ip_daily_limit}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          ip_daily_limit: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-blue-100 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Gemini Configuration */}
                  <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${settings.model_provider === "gemini" ? "bg-blue-50/40 border-blue-200 ring-4 ring-blue-500/5" : "bg-slate-50/20 border-slate-100"}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          <Sparkles size={24} className="text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Google Gemini</h3>
                          <p className="text-xs text-slate-500">强大的多模态大模型</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, model_provider: "gemini" })}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          settings.model_provider === "gemini" 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {settings.model_provider === "gemini" ? "当前使用中" : "设为使用"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-xs text-slate-500 mb-2 ml-1 font-medium">Gemini Model ID</label>
                        <input
                          type="text"
                          value={settings.gemini_model_id || "gemini-2.0-flash"}
                          onChange={(e) => setSettings({ ...settings, gemini_model_id: e.target.value })}
                          placeholder="gemini-2.0-flash..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-2 ml-1 font-medium">API Key</label>
                        <input
                          type="password"
                          value={settings.gemini_api_key || ""}
                          onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                          placeholder="留空即使用环境变量..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aliyun Configuration */}
                  <div className={`p-4 sm:p-6 rounded-2xl border transition-all ${settings.model_provider === "aliyun" ? "bg-orange-50/40 border-orange-200 ring-4 ring-orange-500/5" : "bg-slate-50/20 border-slate-100"}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          <Cpu size={24} className="text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">阿里云百炼</h3>
                          <p className="text-xs text-slate-500">阿里通义千问大模型</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, model_provider: "aliyun" })}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          settings.model_provider === "aliyun" 
                          ? "bg-orange-600 text-white shadow-lg shadow-orange-200" 
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {settings.model_provider === "aliyun" ? "当前使用中" : "设为使用"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-xs text-slate-500 mb-2 ml-1 font-medium">Qwen Model ID</label>
                        <input
                          type="text"
                          value={settings.aliyun_model_id || "qwen-plus"}
                          onChange={(e) => setSettings({ ...settings, aliyun_model_id: e.target.value })}
                          placeholder="qwen-plus..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-2 ml-1 font-medium">API Key</label>
                        <input
                          type="password"
                          value={settings.aliyun_api_key || ""}
                          onChange={(e) => setSettings({ ...settings, aliyun_api_key: e.target.value })}
                          placeholder="请输入阿里云 API Key"
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {msg && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {msg}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />

      {selectedReading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4 border-b border-slate-100 bg-slate-50 print-hide relative">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-800 break-all pr-10 sm:pr-0">
                算命结果详情 - {selectedReading.name}
              </h3>
              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={async () => {
                    setExportType("pdf");
                    setExportModalOpen(true);
                    setExportReadyUrl(null);
                    try {
                      const { url } = await generateExportData(
                        "fortune-result-content",
                        selectedReading.name,
                        "pdf",
                      );
                      if (url) setExportReadyUrl(url);
                    } catch (err) {
                      console.error(err);
                      setExportModalOpen(false);
                      alert("导出失败，请重试");
                    }
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs sm:text-sm font-medium border border-indigo-200 shadow-sm whitespace-nowrap"
                >
                  导出PDF
                </button>
                <button
                  onClick={async () => {
                    setExportType("image");
                    setExportModalOpen(true);
                    setExportReadyUrl(null);
                    try {
                      const { url } = await generateExportData(
                        "fortune-result-content",
                        selectedReading.name,
                        "image",
                      );
                      if (url) setExportReadyUrl(url);
                    } catch (err) {
                      console.error(err);
                      setExportModalOpen(false);
                      alert("导出失败，请重试");
                    }
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-xs sm:text-sm font-medium border border-slate-200 shadow-sm whitespace-nowrap"
                >
                  导出长图
                </button>
                <button
                  onClick={() => setSelectedReading(null)}
                  className="absolute right-4 top-4 sm:static p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 font-serif text-slate-700 bg-slate-50/30 w-full relative pb-10">
              {(() => {
                try {
                  const res = JSON.parse(selectedReading.result_json || "{}");
                  return (
                    <div className="mx-auto bg-white shadow-sm">
                      <FortuneResultView
                        result={res}
                        userInfo={{
                          name: selectedReading.name,
                          gender: selectedReading.gender || "未知",
                          date: selectedReading.birth_date,
                          time: selectedReading.birth_time,
                          province: selectedReading.province,
                          calendarType: selectedReading.calendar_type,
                        }}
                      />
                    </div>
                  );
                } catch (e) {
                  return <p className="p-6">解析出错或无结果</p>;
                }
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center shadow-2xl border border-slate-100"
          >
            <h3 className="text-2xl font-bold mb-6 font-serif text-slate-800">
              导出报告
            </h3>
            {!exportReadyUrl ? (
              <div className="flex flex-col items-center">
                <p className="text-slate-500 text-sm animate-pulse mt-4 mb-2">
                  正在生成高速图片/PDF，请稍候...
                </p>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-3 mt-4">
                {exportType === "pdf" ? (
                  <a
                    href={exportReadyUrl || "#"}
                    download={`八字测算_${selectedReading?.name || "报告"}.pdf`}
                    onClick={() =>
                      setTimeout(() => setExportModalOpen(false), 500)
                    }
                    className="w-full text-center text-white bg-slate-800 hover:bg-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm tracking-widest"
                  >
                    点击下载 PDF
                  </a>
                ) : (
                  <a
                    href={exportReadyUrl || "#"}
                    download={`八字测算_${selectedReading?.name}.jpg`}
                    onClick={() =>
                      setTimeout(() => setExportModalOpen(false), 500)
                    }
                    className="w-full text-center text-white bg-slate-800 hover:bg-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm tracking-widest"
                  >
                    点击保存图片
                  </a>
                )}
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="w-full text-slate-500 hover:text-slate-800 text-sm py-2 transition-colors"
                >
                  关闭
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center shadow-2xl border border-slate-100"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <Trash2 size={32} className="text-rose-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-serif text-slate-800">
              确认删除？
            </h3>
            <p className="text-slate-500 text-center mb-8">
              此操作不可恢复，确定要删除这条记录吗？
            </p>
            <div className="flex w-full gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors shadow-sm"
              >
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
