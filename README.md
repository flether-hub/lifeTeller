# LifeTeller - AI 易经八字推演系统

这是一个基于 React + Vite + Express (Node.js) / Cloudflare Pages + SQLite / D1 Database 构建的 AI 八字算命应用。

## 📊 项目概况

- **代码总量**：约 6000 行核心业务代码（前端 React 与分离服务端逻辑，含智能排版体系）。
- **网站架构**：
  - **前端视图 (Frontend)**：React 18 + Vite 作为运行框架，Tailwind CSS + motion 实现精致 UI 视觉与微动效，采用响应式流式布局，适配多端。
  - **边缘/节点服务端 (Backend)**：采用两套独立的入口以适配多种部署环境：
    - `server.ts` 配合 Better-SQLite3 用于基于容器（如 Google Cloud Run、Docker）的独立服务器模式。
    - `functions/api/[[path]].ts` 配合 Cloudflare D1 适用于全 Serverless Edge Node 部署。
  - **AI 枢纽 (AI Hub)**：通过 SSE (Server-Sent Events) 双向流式分块输出，直连 Google Gemini (v2.0 Flash) 或 阿里云百炼 (Qwen) 大语言模型，完成命运解析。
  - **数据存储 (Database)**：采用 SQLite 数据库架构建立高一致性的数据关系引擎，支持额度限制、黑名单拦截、访问留痕等安全策略，确保测算数据快速、持久的读写。

## 核心特性
- **AI 驱动**：支持自动选择 Google Gemini 侧或阿里云百炼（Kimi/Qwen），提供极具深度、文学性和命理专业性的流式全方位推演。
- **动态全端**：高度抛光的 UI/UX 体验设计，平滑的视觉过渡效果与排版。
- **本地保留**：支持完整测算结果直接导出为高清 PDF / 沉浸式图文长图（Image）。
- **聚合管控后台**：包含访问留痕、IP安全管制、全国地图空间分布热力图、资源配额动态修改。

## 🚀 部署参考与指南

本系统提供两种不同的部署形态。如果您使用 Google Cloud Run 等容器服务，可直接依赖 Node.js (Vite + Express)；若是全静态 Serverless 方案，则可参见保留的 Cloudflare 步骤修订版。

### 方式 A：容器化部署 (推荐如 Google Cloud Run, Docker)

1. 配置环境变量：`GEMINI_API_KEY`, `ADMIN_PASSWORD`, `JWT_SECRET`。
2. 构建并启动镜像，Node.js 环境直接运行 `npm run start` 即可在 `3000` 端口开启全栈服务。数据默认落盘至当前执行目录的 `lifeteller_v3.db`。

### 方式 B：部署到 Cloudflare Pages (全栈 Edge 模式)

*(注：原部署步骤修订保留)*

本程序同时支持同源无服务器部署（Vite 前端打包预建 + Cloudflare Functions 后端执行），配合 D1 (Edge SQLite) 实现全球极速访问。

1. **数据库准备 (D1 Database)**：
   - 进入 Cloudflare Dashboard (dash.cloudflare.com)。
   - 导航至 **Workers & Pages** -> **D1**，选择 **Create database** -> **Dashboard** （建议名称 `lifeteller_db`）。
   - 复制生成的 **Database ID**。在 D1 详情页 Console 执行本项目根目录下 `schema.sql` 中的所有建表语句。
2. **项目配置更新**：打开根目录下 `wrangler.toml` 文件，将 `database_id` 替换为你获取的 ID。
3. **在 Cloudflare Pages 创设项目**：
   - 连接 GitHub 并在 Pages 内导入该仓库资源。
   - 配置环境：Framework Preset = `Vite`，Build command = `npm run build`，输出目录 = `dist`。
   - **关键绑定**：Settings -> Functions -> **D1 database bindings** -> 添加绑定 -> 名称务必填 `DB`，选中刚创建的数据库实例（请确保生产和预览均已添加）。
   - **环境变量**：Settings -> Environment Variables -> 添加 `GEMINI_API_KEY`、`JWT_SECRET`（防伪凭证密钥）、`ADMIN_PASSWORD` (后台密码)。
4. 重试触发最后一次部署，即可通过形如 `*.pages.dev` 的域访问系统。

---

## 🛠 开发环境总结与调试

- **NodeJS + 容器服务**: `npm run dev`（运行 `server.ts`）。热更新友好，前端与 API 一体化。
- **Edge Runtime**: 服务于 Cloudflare 环境的 `functions/api/[[path]].ts`，二者业务逻辑严格对齐。

本地运行准备步骤：
1. `npm install`
2. 复制 `.env.example` 为 `.env` 并配置对应 Key。
3. 执行 `npm run dev` 开始调试。
