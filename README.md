# lifeTeller - AI 八字命理推演系统

这是一个基于 React + Vite + Cloudflare Pages + D1 Database 构建的 AI 八字算命应用。

## 核心特性
- **AI 驱动**：使用 Google Gemini Pro/Flash 模型进行多维度命理推演。
- **动态全端**：支持响应式设计，完美适配 PC 与移动端。
- **本地存储**：测算记录支持 PDF 导出与长图保存。
- **管理后台**：内置地理分布可视化、系统限制配置与记录管理。

## 🚀 极简部署指南 (Cloudflare Pages + Git)

本应用已完美适配 Cloudflare 自动化部署。只需将代码推送到 GitHub，Cloudflare 即可自动完成构建和分发。

### 第一步：创建 D1 数据库
1. 登录 [Cloudflare 控制面板](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** > **D1**。
3. 点击 **Create database**，命名为 `lifeteller_db`。
4. 在控制台中执行以下 SQL (来自项目根目录的 `schema.sql`) 以初始化表结构。

### 第二步：配置 Pages 项目
1. 在 GitHub 上创建一个新仓库并推送代码。
2. 在 Cloudflare Pages 中点击 **Connect to git**。
3. 选择该仓库，构建设置选择：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 在项目 **Settings** > **Functions** > **D1 database bindings** 中：
   - 添加绑定，**Variable name** 设为 `DB`，选择您刚刚创建的 `lifeteller_db`。
5. 在项目 **Settings** > **Environment variables** 中添加：
   - `GEMINI_API_KEY`: 您的 Google AI Studio API Key。
   - `JWT_SECRET`: 任意长随机字符串（用于登录加密）。
   - `ADMIN_PASSWORD`: 管理后台密码（可选，默认 admin）。

### 第三步：完成！
后续您只需 `git push`，网站就会自动更新部署。

---

## 🛠 本地开发与调试
如果您只是想在本地运行：
1. `npm install`
2. 在 `.env` 中设置 `GEMINI_API_KEY`
3. `npm run dev`

## 技术栈
- **Frontend**: React 18, Tailwind CSS, motion, Recharts, Lucide React
- **Backend**: Cloudflare Pages Functions (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite on Edge)
- **AI**: @google/genai (Gemini)
