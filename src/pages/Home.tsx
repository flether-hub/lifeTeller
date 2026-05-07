import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Bagua } from "../components/Bagua";
import {
  Sparkles,
  MapPin,
  User,
  Users,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  MessageSquareText,
  Loader2,
  History,
  Bot,
  StopCircle,
  Heart,
} from "lucide-react";
import { cn } from "../lib/utils";
import { FortuneChart } from "../components/FortuneChart";
import { StarryBackground } from "../components/StarryBackground";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { FortuneResultView } from "../components/FortuneResultView";
import { Solar, Lunar } from "lunar-javascript";
import { useReading } from "../context/ReadingContext";
import { useLanguage } from "../context/LanguageContext";
import { useQuota } from "../context/QuotaContext";
import { generateExportData } from "../lib/exportUtils";

const PROVINCES = [
  "北京",
  "天津",
  "河北",
  "山西",
  "内蒙古",
  "辽宁",
  "吉林",
  "黑龙江",
  "上海",
  "江苏",
  "浙江",
  "安徽",
  "福建",
  "江西",
  "山东",
  "河南",
  "湖北",
  "湖南",
  "广东",
  "广西",
  "海南",
  "重庆",
  "四川",
  "贵州",
  "云南",
  "西藏",
  "陕西",
  "甘肃",
  "青海",
  "宁夏",
  "新疆",
  "台湾",
  "香港",
  "澳门",
  "海外",
];

const SHICHEN = [
  { label: "子时 (23:00-01:00)", value: "子时" },
  { label: "丑时 (01:00-03:00)", value: "丑时" },
  { label: "寅时 (03:00-05:00)", value: "寅时" },
  { label: "卯时 (05:00-07:00)", value: "卯时" },
  { label: "辰时 (07:00-09:00)", value: "辰时" },
  { label: "巳时 (09:00-11:00)", value: "巳时" },
  { label: "午时 (11:00-13:00)", value: "午时" },
  { label: "未时 (13:00-15:00)", value: "未时" },
  { label: "申时 (15:00-17:00)", value: "申时" },
  { label: "酉时 (17:00-19:00)", value: "酉时" },
  { label: "戌时 (19:00-21:00)", value: "戌时" },
  { label: "亥时 (21:00-23:00)", value: "亥时" },
];

const TONE_OPTIONS = [
  "通俗易懂",
  "幽默风趣",
  "严肃认真",
  "文言古籍",
  "温柔鼓励",
  "毒舌犀利",
  "极简高深",
];

const MODE_OPTIONS = ["精要解读", "深度解读"];

interface FortuneResult {
  summary: string;
  recent: string;
  career: string;
  wealth: string;
  family: string;
  health: string;
  decades: Array<{
    ageRange: string;
    description: string;
    career: number;
    wealth: number;
    family: number;
    health: number;
  }>;
  luckyNumbers: string;
  luckyColors: string;
  iChingQuote: string;
}

export default function Home() {
  const [name, setName] = useState(
    () => localStorage.getItem("last_name") || "",
  );
  const [gender, setGender] = useState(
    () => localStorage.getItem("last_gender") || "男",
  );
  const [calendarType, setCalendarType] = useState(
    () => localStorage.getItem("last_calendarType") || "阳历",
  );
  const [date, setDate] = useState(
    () => localStorage.getItem("last_date") || "2000-01-01",
  );
  const [time, setTime] = useState(
    () => localStorage.getItem("last_time") || SHICHEN[0].value,
  );
  const [province, setProvince] = useState(
    () => localStorage.getItem("last_province") || PROVINCES[0],
  );
  const [tone, setTone] = useState(
    () => localStorage.getItem("last_tone") || TONE_OPTIONS[1],
  );
  const [mode, setMode] = useState(
    () => localStorage.getItem("last_mode") || MODE_OPTIONS[0],
  );

  const [reportUserInfo, setReportUserInfo] = useState<any>(null);

  const {
    isReading,
    setIsReading,
    result,
    setResult,
    error,
    setError,
    debugLogs,
    setDebugLogs,
  } = useReading();
  const { language, t } = useLanguage();
  const [showDebug, setShowDebug] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportReadyUrl, setExportReadyUrl] = useState<string | null>(null);
  const [exportType, setExportType] = useState<"pdf" | "image">("pdf");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (log: string) => {
    setDebugLogs((prev) => [...prev, log]);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsReading(false);
      setError("推演已手动中断。");
      addLog("[AI] 推演已手动终止，天机复归。");
    }
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [debugLogs, error]);

  const [hasLastReading, setHasLastReading] = useState(false);
  useEffect(() => {
    try {
      const item = localStorage.getItem("last_reading");
      if (item) setHasLastReading(true);
    } catch (e) {}
  }, []);

  const handleRestoreLastReading = useCallback(() => {
    try {
      const item = localStorage.getItem("last_reading");
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && parsed.result) {
          const cleanDate = (d: string) => {
            if (!d) return "";
            if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(d)) return d;
            const matches = d.match(/(\d+)/g);
            if (matches && matches.length >= 3) {
              return `${matches[0]}-${matches[1]}-${matches[2]}`;
            }
            return d;
          };

          setName(parsed.userInfo?.name || "");
          setGender(parsed.userInfo?.gender || "男");
          setDate(cleanDate(parsed.userInfo?.rawDate || parsed.userInfo?.date || ""));
          setTime(parsed.userInfo?.time || SHICHEN[0].value);
          setProvince(parsed.userInfo?.province || PROVINCES[0]);
          setCalendarType(parsed.userInfo?.rawCalendarType || parsed.userInfo?.calendarType || "阳历");
          
          setReportUserInfo(parsed.userInfo);
          setError(null);
          setIsReading(false);
          setResult(parsed.result);
          
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setHasLastReading(false);
          localStorage.removeItem("last_reading");
        }
      }
    } catch (e) {
      console.error(e);
      setHasLastReading(false);
      localStorage.removeItem("last_reading");
      alert("抱歉，未能成功恢复历史测算记录，请重新测算。");
    }
  }, [setName, setGender, setDate, setTime, setProvince, setCalendarType, setResult, setError, setIsReading, t]);

  const { config, refreshConfig: fetchConfig } = useQuota();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !province) {
      setError("缘主，请填写姓名和出生地，以保算命准确。");
      return;
    }

    // 姓名合规检查：不能有英文，不能超过6个汉字，必须是纯中文
    const trimmedName = (name || "").trim();
    if (/[a-zA-Z]/.test(trimmedName)) {
      setError("缘主，姓名中不能包含英文字符，请使用中文姓名。");
      return;
    }
    if (!trimmedName || !/^[\u4e00-\u9fa5]+$/.test(trimmedName)) {
      setError("缘主，请使用中文字符填写完整姓名。");
      return;
    }
    if (trimmedName.length > 6) {
      setError("缘主，姓名长度请保持在6个汉字以内。");
      return;
    }
    if (!date) {
      setError("缘主，请至少年月日输入准确的出生日期");
      return;
    }

    const validateAndFormatDate = (dateStr: string, type: string) => {
      const parts = dateStr.split(/[-/._\s]/).filter(Boolean);
      if (parts.length < 3) return null;
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const d = parseInt(parts[2]);

      if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
      if (y < 1900 || y > 2100) return null;

      try {
        if (type === "阳历") {
          const solar = Solar.fromYmd(y, m, d);
          if (solar.getYear() !== y || solar.getMonth() !== m || solar.getDay() !== d) {
            return null;
          }
          return { solar, lunar: solar.getLunar() };
        } else {
          // 阴历校验
          const lunar = Lunar.fromYmd(y, m, d);
          // 验证阴历日期是否存在
          const solar = lunar.getSolar();
          const backLunar = solar.getLunar();
          // 如果 backLunar 的年月日与输入不符，说明日期非法（例如输入了30日但该月只有29日）
          if (backLunar.getYear() !== y || Math.abs(backLunar.getMonth()) !== m || backLunar.getDay() !== d) {
            return null;
          }
          return { lunar, solar };
        }
      } catch (e) {
        return null;
      }
    };

    const dateResult = validateAndFormatDate(date, calendarType);

    if (!dateResult) {
      setError(
        `缘主，您输入的${calendarType}日期不合法，请确保格式为 yyyy-mm-dd (例如: 1990-1-1) 且日期在 1900~2100 间确实存在。`,
      );
      return;
    }

    localStorage.setItem("last_name", name);
    localStorage.setItem("last_gender", gender);
    localStorage.setItem("last_calendarType", calendarType);
    localStorage.setItem("last_date", date);
    localStorage.setItem("last_time", time);
    localStorage.setItem("last_province", province);
    localStorage.setItem("last_tone", tone);
    localStorage.setItem("last_mode", mode);
    
    // 统一转换为阴历进行展示和作为 Prompt 参数
    const { lunar } = dateResult;
    const lunarDisplayDate = `${lunar.getYear()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsReading(true);
    setResult(null);
    setError(null);
    setDebugLogs([]);

    try {
      const checkRes = await fetch("/api/fortune/check", { 
        method: "POST",
        signal: abortController.signal
      });
      
      // Always refresh config after a check attempt (especially if it fails)
      setTimeout(fetchConfig, 500);

      const checkText = await checkRes.text();
      let checkData: any = {};
      try {
        checkData = JSON.parse(checkText);
      } catch (e) {
        if (!checkRes.ok) throw new Error(checkText || checkRes.statusText);
      }

      if (checkData.error) {
        throw new Error(checkData.error);
      }

      if (!checkRes.ok) {
        throw new Error("Rate limit exceeded");
      }

      const prompt = `你是一位精通中国传统命理学的大师，深谙《易经》、阴阳五行、天干地支与八字命理。
一位名叫 ${name}（性别：${gender}）的求测者，出生于【阴历】${lunarDisplayDate} ${time}，出生地为【${province}】，前来寻求指点。
请严格依据传统八字命理，为他推测四柱八字并推演命运。

### 核心任务：
1. 推算生辰八字（年、月、日、时柱，包含天干、地支，以及对应的天干五行和地支五行，总共8个字）。
2. 分析姓名与出生地对运势的影响。
3. 对流年大运进行 0 到 100 岁的十年分段评分（事业、财富、感情、健康四个维度）。
4. 提供开运建议（幸运数字、颜色）和易经格言。

### 输出准则（极其重要，违反将被视为失败）：
1. **必须**返回一个紧凑且合法的 JSON 对象。
2. **严禁**包含任何 Markdown 格式代码块（如 \`\`\`json）。
3. **严禁**输出省略号（如 "..." 或 "省略" 等）。所有字段、数组内容必须完整输出，不要偷懒！
4. **绝对禁止**在 JSON 属性值中使用换行符（\n），请改用空格或符号连接。
5. **必须包含以下所有顶层字段**，绝对不能遗漏：'bazi', 'nameLocationAnalysis', 'summary', 'recent', 'career', 'wealth', 'family', 'health', 'decades', 'luckyNumbers', 'luckyColors', 'iChingQuote'。
6. **严禁**在 JSON 外包含任何文本、标记符号（如 \` \` \`json）、开场白或结束语。返回内容必须可以直接被 JSON.parse() 解析。
7. **语气风格**：【${tone}】。
8. **字数要求**：${mode === "精要解读" ? "全文重点突出，总长要求在 800 字左右" : "全文详尽深刻，内容涵盖方方面面，总长要求在 1200 字以上，务必保证每个字段的内容充实且结构完整"}。
9. **内容质量控制**：严禁在字段内容中使用未转义的双引号（"），如果内容中必须出现引号，请改用中文引号（“”）或进行转义。
10. **数据完整性**：绝对禁止输出省略号。
11. **输出纯净度**：不要在 JSON 之外输出任何文字，包括类似 "这里是您的报告：" 之类的开场白。
12. **八字严谨性**：八字必须是四柱八个字。

### JSON 结构要求 (注意不要输出格式之外的注释，必须输出完整的列表数据)：
{
  "bazi": [
    {"pillar": "年柱", "gan": "天干", "ganWuXing": "天干五行", "zhi": "地支", "zhiWuXing": "地支五行"},
    {"pillar": "月柱", "gan": "天干", "ganWuXing": "天干五行", "zhi": "地支", "zhiWuXing": "地支五行"},
    {"pillar": "日柱", "gan": "天干", "ganWuXing": "天干五行", "zhi": "地支", "zhiWuXing": "地支五行"},
    {"pillar": "时柱", "gan": "天干", "ganWuXing": "天干五行", "zhi": "地支", "zhiWuXing": "地支五行"}
  ],
  "nameLocationAnalysis": "姓名与地理位置的综合解读文本...",
  "summary": "人生总体评分与核心命题...",
  "recent": "未来3年运势深度分析（必须详尽分析未来3年的运势走向，包含事业、财运、婚姻、健康）...",
  "career": "事业运势与建议...",
  "wealth": "财运走向与理财建议...",
  "family": "感情婚姻与家庭关系...",
  "health": "健康、体质与注意事项...",
  "decades": [
     {"ageRange": "0-10岁", "description": "0到10岁运势详解", "career": 70, "wealth": 45, "family": 80, "health": 90},
     {"ageRange": "10-20岁", "description": "10到20岁运势详解", "career": 70, "wealth": 45, "family": 80, "health": 90}
     // 务必继续输出 20-30岁、30-40岁 直到 90-100岁，总共必须是10个数组元素！不要省略！
  ],
  "luckyNumbers": "建议的 1-9 之间的 3 个互不重复的单数（奇数），以逗号分隔",
  "luckyColors": "建议的 3 种生旺颜色，以逗号分隔",
  "iChingQuote": "针对命局推演出的《易经》原文格言"
}`;

      addLog("正在连接天机命盘，准备调用大语言模型...");
      const genRes = await fetch("/api/fortune/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: abortController.signal
      });

      if (!genRes.ok) {
        const errText = await genRes.text();
        let errStr = errText || genRes.statusText;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error) {
            errStr =
              typeof errJson.error === "string"
                ? errJson.error
                : JSON.stringify(errJson.error);
          }
        } catch (e) {}
        if (errStr.includes("Rate exceeded") || errStr.includes("429"))
          errStr = "官方 AI 接口限制，请稍后重试。";
        else if (errStr.includes("503") || errStr.includes("high demand"))
          errStr = "官方 AI 接口当前拥挤 (503)，请稍后重试。";
        else if (errStr.includes("ApiError"))
          errStr = "官方 AI 接口请求失败，请稍后重试。";

        throw new Error(`请求失败: ${errStr}`);
      }

      const contentType = genRes.headers.get("Content-Type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("服务未就绪，请几秒后再操作（或刷新页面）。");
      }

      const reader = genRes.body?.getReader();
      if (!reader) throw new Error("无法读取服务器响应");

      const decoder = new TextDecoder();
      let fullText = "";
      let lastReportedLen = 0;
      const progressPhases = [
        { th: 20, msg: "天机枢纽通讯中，建立时空连接..." },
        { th: 50, msg: "大语言模型接入完成，天命数据同步..." },
        { th: 100, msg: "解析四柱八字，捕捉命理波动..." },
        { th: 200, msg: "洞察阴阳五行，确定命局格神..." },
        { th: 350, msg: "排演十年大运，观测岁运起伏..." },
        { th: 500, msg: "测算财富机运，挖掘潜藏商机..." },
        { th: 650, msg: "推求事业前程，定位职场方位..." },
        { th: 800, msg: "勘破家庭尘缘，剖析亲情羁绊..." },
        { th: 950, msg: "参详健康吉凶，预警脏腑盈亏..." },
        { th: 1100, msg: "感悟周易经意，生成人生谶言..." },
        { th: 1300, msg: "修饰命理文案，精校输出排版..." },
        { th: 1500, msg: "数据封装备份，准备最终呈现..." },
      ];

      addLog("[AI] 与天机枢纽握手成功，开始接收推演数据流...");

      while (true) {
        if (abortController.signal.aborted) throw new Error("推演已手动中断");
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        
        // Progressively emit friendly log messages instead of dumping raw JSON
        const len = fullText.length;
        for (const phase of progressPhases) {
          if (len >= phase.th && lastReportedLen < phase.th) {
            addLog(`[AI] ${phase.msg}`);
            lastReportedLen = phase.th;
          }
        }
      }

      if (fullText.trim().toLowerCase().startsWith("<!doctype html>") || fullText.trim().startsWith("<!")) {
        throw new Error("服务正在重启或无响应，请稍后再试。");
      }

      if (fullText.includes("--STREAM-ERROR--")) {
        throw new Error(
          "AI 推演过程中断:" + fullText.split("--STREAM-ERROR--")[1],
        );
      }

      let resultJson = fullText;
      if (resultJson.includes("--STREAM-START--\n")) {
        resultJson = resultJson.split("--STREAM-START--\n")[1];
      } else if (resultJson.includes("--STREAM-START--")) {
        resultJson = resultJson.split("--STREAM-START--")[1];
      }
      resultJson = resultJson
        .replace(/```(?:json)?/gi, "")
        .replace(/```/g, "")
        .trim();
      addLog("天机已现，后台生成成功，正在进行深度校验...");

      // Ultra-Robust JSON Extraction and Cleaning
      const extractAndParseJson = (rawText: string) => {
        let text = rawText.trim();
        
        // Step 0: Pre-clean non-printable characters and weird whitespace
        text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, " ");

        // Step 1: Remove Markdown code blocks if they exist
        const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
        let match;
        let bestCandidate = text;
        
        // Find the most likely JSON block
        while ((match = codeBlockRegex.exec(text)) !== null) {
          if (match[1].includes('"bazi"') || match[1].includes('"summary"')) {
            bestCandidate = match[1];
            break;
          }
        }
        
        text = bestCandidate.trim();
        
        // Step 2: Extract between first { and last } if still not parsing
        const tryParse = (str: string) => {
          try {
            // Remove trailing commas before parsing
            const cleaned = str.trim()
              .replace(/,\s*([}\]])/g, "$1") // trailing commas
              .replace(/\n/g, " ")           // literal newlines
              .replace(/\r/g, "");
            return JSON.parse(cleaned);
          } catch (e) {
            return null;
          }
        };

        let result = tryParse(text);
        if (result) return result;

        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          text = text.substring(firstBrace, lastBrace + 1);
          result = tryParse(text);
          if (result) return result;
        }

        // Final attempt: Heuristic cleaning
        // Try to fix unescaped quotes inside strings (very basic)
        // This regex looks for double quotes that are NOT preceded by : space { [ , and NOT followed by : , } ]
        // It's not perfect but can help
        try {
          const aggressiveClean = text
            .replace(/([^\s:{\[,])"([^\s:}\],])/g, '$1\\"$2')
            .replace(/\n/g, " ")
            .replace(/\r/g, "");
          result = tryParse(aggressiveClean);
          if (result) return result;
        } catch (e) {}

        return null;
      };

      let parsed = extractAndParseJson(resultJson);

      // Handle double-encoded JSON where the main object has a `result` string property
      if (parsed && typeof parsed === "object" && typeof parsed.result === "string") {
        try {
          const innerParsed = extractAndParseJson(parsed.result);
          if (innerParsed && typeof innerParsed === "object") {
            parsed = innerParsed;
          }
        } catch (e) {}
      }

      if (!parsed || typeof parsed !== "object") {
        throw new Error(
          `天机蒙尘：解析命理数据失败。AI 返回了非标准格式，请点击“重试”或更换语气后再测。`,
        );
      }

      // Step 4: Schema Validation & Default Filling
      const requiredFields = [
        "bazi",
        "summary",
        "recent",
        "career",
        "wealth",
        "family",
        "health",
        "decades",
        "iChingQuote",
      ];
      const missingFields = requiredFields.filter((f) => !parsed[f]);

      if (missingFields.length > 3) {
        // Too many missing fields
        throw new Error(
          `命局残缺：AI 生成的命理报告不完整，关键信息缺失。请尝试“深度解读”模式。`,
        );
      }

      // Fill defaults for minor missing fields
      const validated: any = {
        bazi: parsed.bazi || [],
        nameLocationAnalysis:
          parsed.nameLocationAnalysis ||
          "测算环境复杂，姓名与地利之气相互交织，利于稳中求进。",
        summary: parsed.summary || "命局中平，需修身养性，以待时机。",
        recent: parsed.recent || "近期运势交替，宜守不宜攻。",
        career: parsed.career || "事业平稳过渡，贵人在侧。",
        wealth: parsed.wealth || "财气内敛，建议开源节流。",
        family: parsed.family || "家庭和睦是福，宜多沟通。",
        health: parsed.health || "注意规律作息，平和心态。",
        decades: (parsed.decades || []).map((d: any) => {
          const parseScore = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
              const num = parseInt(val.match(/\d+/)?.[0] || '50');
              return isNaN(num) ? 50 : num;
            }
            return 50;
          };
          return {
            ageRange: d.ageRange || "未知阶段",
            description: d.description || "运势平稳",
            career: parseScore(d.career),
            wealth: parseScore(d.wealth),
            family: parseScore(d.family),
            health: parseScore(d.health),
          };
        }),
        luckyNumbers: (parsed.luckyNumbers || "1, 3, 9")
          .toString()
          .split(/[,，、\s]+/)
          .filter(Boolean)
          .slice(0, 3)
          .join(", "),
        luckyColors: (parsed.luckyColors || "青色, 褐色, 金色")
          .toString()
          .split(/[,，、\s]+/)
          .filter(Boolean)
          .map((c: any) => {
            const str = String(c || "");
            return str.length > 2 ? str.substring(0, 2) : str;
          })
          .slice(0, 3)
          .join(", "),
        iChingQuote: parsed.iChingQuote || "天行健，君子以自强不息。",
      };

      addLog("数据校验通过，正在合入天机命盘数据库...");
      await fetch("/api/fortune/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
          calendar_type: calendarType,
          date: date,
          time: time,
          province,
          resultJson: validated,
        }),
      });
      addLog("结果保存成功。");

    const lastReading = {
      userInfo: { 
        name, 
        gender, 
        date: lunarDisplayDate, 
        rawDate: date,
        rawCalendarType: calendarType,
        time: time, 
        province, 
        calendarType: "阴历" 
      },
      result: validated as FortuneResult,
    };
    try {
      localStorage.setItem("last_reading", JSON.stringify(lastReading));
    } catch (e) {}

    setReportUserInfo(lastReading.userInfo);
    setHasLastReading(true);
    setResult(validated as FortuneResult);
    setIsReading(false);
    abortControllerRef.current = null;
    
    // Refresh config after success
    fetchConfig();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === '推演已手动中断') {
        return; // Handled by handleStop
      }
      
      let finalErrorMessage = err.message;
      if (err.message === "Failed to fetch" || err.message.includes("NetworkError")) {
        finalErrorMessage = "网络连接异常，天机受阻。请检查您的网络连接或稍后重试。";
      }
      
      setError(finalErrorMessage);
      setIsReading(false);
      setShowDebug(true);
      addLog(finalErrorMessage);
      
      // Refresh config after failure to sync remaining counts
      fetchConfig();
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setDebugLogs([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 selection:bg-blue-500/30 overflow-x-hidden flex flex-col bg-[#f8f9fa]">
      {/* Fixed Header */}
      <Header config={config} />

      {/* Hero Section */}
      <div className="relative pt-20 pb-8 md:pt-24 md:pb-10 px-6 z-10 flex flex-col items-center flex-shrink-0">
        <StarryBackground />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 text-white/90 text-sm shadow-sm">
            <Sparkles size={14} className="text-amber-400" /> {t("AI 驱动易经八字推演")}
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3 tracking-tight drop-shadow-lg">
            {t("天命微茫·八字探微")}
          </h1>
          <p className="text-sm md:text-base text-slate-200 font-light leading-relaxed mb-4 drop-shadow">
            {t("深度解析您的生辰八字，融合传统易经与现代大模型技术，为您推演一生大运起伏、近期运势走向，并预测事业、财富、健康与姻缘的未来轨迹。")}
          </p>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="relative bg-[#f8f9fa] flex-1 z-20 w-full pt-8 pb-8 border-t border-slate-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <main className="container mx-auto px-6 max-w-6xl flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Main Content (Form/Loading/Result) */}
          <div
            className={cn(
              "w-full flex flex-col",
              result || isReading ? "max-w-4xl" : "lg:flex-1 max-w-3xl",
            )}
          >
            <AnimatePresence mode="wait">
              {!result && !isReading && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-6"
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Graphic Side */}
                    <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-8">
                      <Bagua isReading={false} />
                      <div className="mt-8 text-center text-sm text-slate-400">
                        <p>{t("一命二运三风水")}</p>
                        <p>{t("四积阴德五读书")}</p>
                      </div>
                    </div>

                    {/* Form Side */}
                    <div className="w-full md:w-2/3">
                      {hasLastReading && (
                        <div className="mb-6 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                            <div className="w-9 h-9 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center shrink-0">
                              <History size={14} className="text-slate-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] sm:text-xs font-medium text-slate-800 leading-tight">
                                {t("发现您有最近一次的测算记录")}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRestoreLastReading}
                            className={cn(
                              "px-3 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 text-[10px] sm:text-xs font-medium rounded-xl shadow-sm border border-slate-200 transition whitespace-nowrap ml-2 sm:ml-4 shrink-0",
                              config && (config.ipLeft <= 0 || config.totalLeft <= 0) && "purple-breathing border-violet-300 text-violet-700"
                            )}
                          >
                            {t("查看报告")}
                          </button>
                        </div>
                      )}
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <User size={16} className="text-slate-500" />{" "}
                              {t("阁下尊姓大名")}
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-sans"
                              placeholder={t("请输入真实中文姓名")}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <MapPin size={16} className="text-slate-500" />{" "}
                              {t("出生省份")}
                            </label>
                            <select
                              value={province}
                              onChange={(e) => setProvince(e.target.value)}
                              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {PROVINCES.map((p) => (
                                <option
                                  key={p}
                                  value={p}
                                  className="bg-white text-slate-800"
                                >
                                  {t(p)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <CalendarIcon
                                size={16}
                                className="text-slate-500"
                              />{" "}
                              {t("日历类型")}
                            </label>
                            <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                              {["阳历", "阴历"].map((type) => (
                                <button
                                  type="button"
                                  key={type}
                                  onClick={() => setCalendarType(type)}
                                  className={cn(
                                    "flex-1 py-2 text-sm rounded-lg transition-all",
                                    calendarType === type
                                      ? "bg-white text-slate-800 shadow-sm border border-slate-200 font-medium"
                                      : "text-slate-500 hover:text-slate-700",
                                  )}
                                >
                                  {t(type)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <CalendarDays
                                size={16}
                                className="text-slate-500"
                              />{" "}
                              {t("出生日期")}
                            </label>
                            <input
                              type="text"
                              required
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              placeholder={t("格式: yyyy-mm-dd (如 1990-1-1)")}
                              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all placeholder:text-slate-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <Clock size={16} className="text-slate-500" />{" "}
                              {t("出生时辰")}
                            </label>
                            <select
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {SHICHEN.map((t_item) => (
                                <option
                                  key={t_item.value}
                                  value={t_item.value}
                                  className="bg-white text-slate-800"
                                >
                                  {t(t_item.label)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <Users size={16} className="text-slate-500" />{" "}
                              {t("性别")}
                            </label>
                            <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200 mt-[2px] h-[48px] items-center">
                              {["男", "女"].map((g) => (
                                <button
                                  type="button"
                                  key={g}
                                  onClick={() => setGender(g)}
                                  className={cn(
                                    "flex-1 py-1.5 text-sm rounded-lg transition-all h-full",
                                    gender === g
                                      ? "bg-white text-slate-800 shadow-sm border border-slate-200 font-medium"
                                      : "text-slate-500 hover:text-slate-700",
                                  )}
                                >
                                  {t(g)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <Sparkles size={16} className="text-slate-500" />{" "}
                              {t("解读模式")}
                            </label>
                            <select
                              value={mode}
                              onChange={(e) => setMode(e.target.value)}
                              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {MODE_OPTIONS.map((m) => (
                                <option key={m} value={m}>
                                  {t(m)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                              <MessageSquareText
                                size={16}
                                className="text-slate-500"
                              />{" "}
                              {t("解读语气")}
                            </label>
                            <select
                              value={tone}
                              onChange={(e) => setTone(e.target.value)}
                              className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all appearance-none"
                            >
                              {TONE_OPTIONS.map((tone_item) => (
                                <option key={tone_item} value={tone_item}>
                                  {t(tone_item)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {error && (
                          <div className="text-rose-600 text-sm bg-rose-50 p-3 rounded-lg border border-rose-200">
                            <span className="font-bold">⚠️ {t("出错提示")}：</span>
                            {t(error)}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full mt-2 relative overflow-hidden rounded-xl bg-slate-800 text-white shadow-lg transition-all hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!config || config.ipLeft <= 0 || config.totalLeft <= 0}
                        >
                          <div className="relative flex items-center justify-center gap-2 px-6 py-4">
                            <Sparkles size={18} className="text-amber-400" />
                            <span className="text-lg font-bold tracking-widest text-white">
                              {config && (config.ipLeft <= 0 || config.totalLeft <= 0)
                                ? t("今日额度已用完，请明日再来")
                                : t("开演八字神机")}
                            </span>
                          </div>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Debug Logs Section */}
                  {debugLogs.length > 0 && showDebug && (
                    <div className="hidden" />
                  )}
                </motion.div>
              )}

              {isReading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-12 flex flex-col items-center flex-1"
                >
                  <div className="mb-6 w-full max-w-lg bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm h-48 overflow-y-auto text-left relative flex flex-col font-mono text-sm ring-1 ring-slate-900/5 select-text">
                    {!error && (
                      <button
                        onClick={handleStop}
                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors z-10"
                        title="中断推演"
                      >
                        <StopCircle size={20} />
                      </button>
                    )}
                    <div className="flex flex-col gap-2">
                      {debugLogs.map((log, index) => (
                        <div
                          key={index}
                          className="text-slate-600 break-words whitespace-pre-wrap border-b border-slate-100 last:border-0 pb-1 last:pb-0 flex items-start gap-2"
                        >
                          {log.startsWith("[AI]") ? (
                            <>
                              <Bot
                                size={14}
                                className="mt-1 text-blue-500 shrink-0"
                              />
                              <span>{log.replace("[AI]", "").trim()}</span>
                            </>
                          ) : (
                            <span>{log}</span>
                          )}
                        </div>
                      ))}
                      {error && (
                        <div className="text-rose-500 font-medium break-words mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100/50">
                          {error}
                        </div>
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                  <div className="scale-75 md:scale-100 origin-center">
                    <Bagua isReading={!error} />
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-slate-800 mt-6 animate-pulse tracking-wide md:tracking-widest drop-shadow-sm text-center px-6 max-w-sm">
                    {error ? t("推演中断") : t("正在参悟天地造化，推演流年大运...")}
                  </p>
                  <p className="text-slate-500 mt-2 font-light">
                    {error ? t("天数难测，请调整后重试") : t("命理玄奥，请稍候片刻")}
                  </p>
                  {error && (
                    <button
                      onClick={() => {
                        setIsReading(false);
                        setError(null);
                      }}
                      className="mt-8 px-8 py-3 bg-slate-800 text-white text-sm font-medium tracking-widest rounded-xl shadow-md hover:bg-slate-700 transition-all border border-slate-700 hover:shadow-lg"
                    >
                      {t("返回重试")}
                    </button>
                  )}
                </motion.div>
              )}

              {result && !isReading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full mt-8 overflow-hidden mb-8"
                >
                  <div className="p-8 pb-4 pt-8 space-y-8">
                    <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-4">
                      <button
                        onClick={async () => {
                          setExportType("pdf");
                          setExportModalOpen(true);
                          setExportReadyUrl(null);
                          try {
                            const { url } = await generateExportData(
                              "fortune-result-content",
                              reportUserInfo?.name || name,
                              "pdf",
                            );
                            if (url) setExportReadyUrl(url);
                          } catch (err) {
                            console.error(err);
                            setExportModalOpen(false);
                            alert(t("导出失败，请重试"));
                          }
                        }}
                        className="print-hide w-full sm:w-48 justify-center text-white hover:text-white text-sm font-medium tracking-widest border border-slate-800 bg-slate-800 hover:bg-slate-700 px-8 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
                      >
                        {t("导出PDF")}
                      </button>
                      <button
                        onClick={async () => {
                          setExportType("image");
                          setExportModalOpen(true);
                          setExportReadyUrl(null);
                          try {
                            const { url } = await generateExportData(
                              "fortune-result-content",
                              reportUserInfo?.name || name,
                              "image",
                            );
                            if (url) setExportReadyUrl(url);
                          } catch (err) {
                            console.error(err);
                            setExportModalOpen(false);
                            alert(t("导出失败，请重试"));
                          }
                        }}
                        className="print-hide w-full sm:w-48 justify-center text-slate-800 hover:text-slate-900 text-sm font-medium tracking-widest border border-slate-300 hover:bg-slate-100 px-8 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 bg-white"
                      >
                        {t("导出长图")}
                      </button>
                      <button
                        onClick={reset}
                        className="print-hide w-full sm:w-48 justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 text-sm font-medium tracking-widest px-8 py-3 rounded-xl transition-all flex items-center border border-slate-200 shadow-sm"
                      >
                        {t("返回重测")}
                      </button>
                    </div>
                  </div>

                  <FortuneResultView
                    result={result}
                    userInfo={reportUserInfo}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar: Reminder Bar */}
          {!result && !isReading && (
            <aside className="w-full lg:w-[320px] shrink-0 bg-white border border-slate-100 rounded-[1.5rem] p-6 text-left shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg tracking-widest mx-1">
                  {t("行期指北")}
                </h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                </div>
              </div>

              <div className="flex flex-col gap-5 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 text-lg font-bold leading-tight mt-[-2px]">
                    ✧
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-slate-800 font-bold mr-1">
                      {t("隐私承诺：")}
                    </strong>
                    {t("建议输入真实姓名和出生地。诚心敬意，方能窥见天机，报告仅暂存在您的浏览器中。")}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sky-500 text-lg font-bold leading-tight mt-[-2px]">
                    ✦
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-slate-800 font-bold mr-1">
                      {t("运行建议：")}
                    </strong>
                    {t("将本站网址复制到系统浏览器中打开，微信直接打开不支持导出报告。")}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 mt-0.5 shrink-0">
                    <Heart size={16} fill="currentColor" />
                  </span>
                  <span className="leading-relaxed">
                    <strong className="text-slate-800 font-bold mr-1">
                      {t("支持我们：")}
                    </strong>
                    {t("如果觉得算得准，欢迎对我们进行捐赠支持，以保证项目长存。")}
                    <Link
                      to="/donate"
                      className="text-red-500 font-bold hover:underline ml-1"
                    >
                      {t("去捐赠")}
                    </Link>
                  </span>
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center shadow-2xl border border-slate-100"
          >
            <h3 className="text-2xl font-bold mb-6 font-serif text-slate-800">
              {t("导出报告")}
            </h3>
            {!exportReadyUrl ? (
              <div className="flex flex-col items-center">
                <Bagua isReading={true} />
                <p className="text-slate-500 text-sm animate-pulse mt-4 mb-2">
                  {t("正在生成高速图片/PDF，请稍候...")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-3 mt-4">
                {exportType === "pdf" ? (
                  <a
                    href={exportReadyUrl || "#"}
                    download={`八字测算_${reportUserInfo?.name || name}.pdf`}
                    onClick={() =>
                      setTimeout(() => setExportModalOpen(false), 500)
                    }
                    className="w-full text-center text-white bg-slate-800 hover:bg-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm tracking-widest"
                  >
                    {t("点击下载 PDF")}
                  </a>
                ) : (
                  <a
                    href={exportReadyUrl || "#"}
                    download={`八字测算_${reportUserInfo?.name || name}.jpg`}
                    onClick={() =>
                      setTimeout(() => setExportModalOpen(false), 500)
                    }
                    className="w-full text-center text-white bg-slate-800 hover:bg-slate-700 font-bold py-3.5 rounded-xl transition-all shadow-sm tracking-widest"
                  >
                    {t("点击保存图片")}
                  </a>
                )}
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="w-full text-slate-500 hover:text-slate-800 text-sm py-2 transition-colors"
                >
                  {t("关闭")}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      {!result && <Footer />}
    </div>
  );
}
