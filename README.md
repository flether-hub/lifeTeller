# lifeTeller - AI 八字命理推演系统

这是一个基于 React + Vite + Cloudflare Pages + D1 Database 构建的 AI 八字算命应用。

## 核心特性
- **AI 驱动**：使用 Google Gemini Pro/Flash 模型进行多维度命理推演。
- **动态全端**：支持响应式设计，完美适配 PC 与移动端。
- **本地存储**：测算记录支持 PDF 导出与长图保存。
- **管理后台**：内置地理分布可视化、系统限制配置与记录管理。

## 🚀 部署到 Cloudflare Pages (全栈 Edge 模式)

本程序采用前后端分离但同源部署的设计（Vite 前端 + Cloudflare Functions 后端），配合 D1 (Edge SQLite) 实现全球极速访问。

### 1. 数据库准备 (D1 Database)

1. **进入 Cloudflare 控制面板**：[dash.cloudflare.com](https://dash.cloudflare.com/)。
2. **创建 D1 实例**：导航至 **Workers & Pages** -> **D1**，点击 **Create database** -> **Dashboard**。
   - 数据库名称建议填写：`lifeteller_db`。
3. **获取 Database ID**：创建成功后，在数据库详情页复制 **ID** (如 `00b368a2-...`)。
4. **初始表结构**：
   - 在 D1 详情页点击 **Console**。
   - 复制本项目根目录下 `schema.sql` 的全部内容并执行。

### 2. 项目配置 (修改代码)

1. **更新 wrangler.toml**：
   - 打开根目录下的 `wrangler.toml`。
   - 将 `database_id` 替换为你第 1 步中获取的 ID。

### 3. 在 Cloudflare Pages 上创建项目

1. **连接 GitHub/GitLab**：在 Pages 页面点击 **Connect to git** 并选择本仓库。
2. **构建设置 (Build Settings)**：
   - **Framework preset**: `Vite` (或者手动设置如下)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. **关键绑定 (Bindings)**：
   - **非常重要**：在项目部署成功后（即使第一次部署失败也没关系），进入 **Settings** -> **Functions** -> **D1 database bindings**。
   - 点击 **Add binding**。
   - **Variable name**: 必须填写 `DB` (大写)。
   - **D1 database**: 选择你刚刚创建的 `lifeteller_db`。
   - **生产环境与预览环境**：建议在 Production 和 Preview 中都添加此绑定。
4. **环境变量 (Environment Variables)**：
   - 进入 **Settings** -> **Environment variables**。
   - 添加 `GEMINI_API_KEY`: 填写你的 Google AI API KEY。
   - 添加 `JWT_SECRET`: 填写一段随机字符串（用于管理员登录安全）。
   - 添加 `ADMIN_PASSWORD`: 设置管理后台密码 (默认 admin)。

### 4. 重新触发部署

1. 回到 **Deployments** 页面。
2. 在最新的部署（如果是 Failed 或 Initial）上点击 **Retry deployment**。
3. 部署成功后，你将获得一个 `*.pages.dev` 的二级域名，即可直接访问。

---

## 🛠 开发环境切换总结

- **本地开发 (NodeJS + SQLite)**: 运行 `npm run dev`，数据存储在本地 `lifeteller.db`。涉及代码为 `server.ts`。
- **线上环境 (Edge + D1)**: 代码推送到 Git 后，由 Cloudflare API 解析 `functions/` 目录运行。涉及代码为 `functions/api/[[path]].ts`。

---

## 🛠 本地开发与调试
1. `npm install`
2. 复制 `.env.example` 为 `.env` 并填写 `GEMINI_API_KEY`。
3. 本地运行 (使用 Node.js + SQLite)：`npm run dev`
4. 本地模拟 Cloudflare 环境 (可选)：使用 `npx wrangler pages dev dist`。

## 技术栈
- **Frontend**: React 18, Tailwind CSS, motion, Recharts, Lucide React
- **Backend**: Cloudflare Pages Functions (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite on Edge)
- **AI**: @google/genai (Gemini)
