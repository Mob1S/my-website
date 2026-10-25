# Hello, I'm Mob1S

个人网站 — F1 赛车主题的交互式作品集

> 🌐 **线上地址**: [mob1s.top](https://mob1s.top)
>
> 📖 **开源声明**: 本项目仅供交流学习使用，请勿直接用于商业用途。

## 设计风格

- **Carbon Telemetry** — 碳纤维纹理 + 霓虹绿灯光
- **F1 Dashboard** — 赛车遥测数据风格的 UI
- **Monza Circuit** — 蒙扎赛道轮廓作为视觉元素

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 / TypeScript | 首页组件、共享地图和聊天状态 |
| Vite | 开发、热更新与生产构建 |
| HTML5 / CSS3 / Vanilla JS | 保留的详情页、画廊和管理后台 |
| Three.js | WebGL 粒子效果 |
| Anime.js | 动画引擎 |
| CSS Variables | 主题系统 |

## 页面结构

```
index.html          — 首页 (Hero + F1 主题)
detail.html         — 人物详情页
map-detail.html     — 地图详情页
city-detail.html    — 城市详情页
gallery.html        — 画廊浏览页
credits.html        — 致谢页面
purpose-about.html  — 关于页面
purpose-ai.html     — AI 页面
purpose-hobbies.html — 爱好页面
purpose-map.html    — 地图页面
f1_preview.html     — F1 预览页
```

## 数据与管理

```
admin/
├── admin.html              — 管理后台（可视化编辑）
├── server.js               — Node.js 服务端
└── data/                   — JSON 数据存储
    ├── traveled-cities.json  — 已到访城市
    ├── city-images.json      — 城市画廊图片
    ├── person-images.json    — 人物画廊图片
    ├── hobby-images.json     — 爱好画廊图片
    ├── hobby-meta.json       — 爱好元数据
    ├── person-meta.json      — 人物元数据
    └── site-config.json      — 站点配置（致谢等）

data/
├── 110000_full.json  (北京)
├── 120000_full.json  (天津)
├── 130000_full.json  (河北)
├── ...
└── 820000_full.json  (澳门)
```

## 核心文件

| 文件 | 说明 |
|------|------|
| `src/App.vue` | Vue 首页入口与上下双层共享状态 |
| `src/components/` | 首页区域、布局和效果组件 |
| `src/composables/` | 导航、地图、聊天与遮罩生命周期 |
| `src/services/` | 运行时内容加载和 SSE 流解析 |
| `src/styles/` | Vue 首页主题与响应式布局 |
| `style.css` | 旧页面继续使用的样式 |
| `script.js` | 迁移前的脚本，Vue 首页不再加载 |
| `map-data.js` | 地图数据（异步加载） |
| `gallery-data.js` | 画廊数据模块 |
| `F1_SVG_wb.svg` | F1 赛车 SVG 图标 |

## 设计系统

### 颜色变量

```css
--carbon: #0a0a0c        /* 碳纤维黑 */
--neon: #bfff00          /* 霓虹绿 */
--amber: #ff8c00         /* 琥珀色 */
--titanium: #a0a0aa      /* 钛灰色 */
```

### 字体

- **首页标题 / 西文正文**：Manrope Variable，本地加载，使用较轻的标题字重和紧凑字距。
- **中文正文**：优先使用苹方、微软雅黑等系统无衬线字体。
- **遥测 / 终端**：IBM Plex Mono，本地加载；字体许可随构建输出到 `licenses/`。
- 旧 HTML 页面继续沿用原 Orbitron / Space Mono 字体设置。

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Mob1S/my-website.git

# Node.js >= 22.12（建议 Node 24）
npm ci
npm run dev

# 管理后台（另一个终端，默认 3000）
npm run admin -- --password=YOUR_PASSWORD

# AI 后端（需要本地 .env，默认 3001；保持现有服务设置）
npm run server

# 验证与构建
npm test
npm run build
npm run test:browser
npm run preview
```

浏览器回归会自动启动独立的构建预览并生成 `test-results/` 截图。Windows 默认使用已安装的 Edge；其他系统请先运行 `npx playwright install chromium`。可用 `PLAYWRIGHT_CHANNEL` 环境变量指定浏览器通道。

开发首页默认位于 `http://127.0.0.1:5173/`，构建预览位于 `http://127.0.0.1:4173/`。请通过 Vite 打开首页，直接打开源代码 `index.html` 或使用普通静态服务器不能编译 Vue。`npm start` 保留 CommonJS 后端启动方式，在存在 `dist/` 时提供构建后的首页。Windows 如有同名 npm 命令冲突，可使用 `npm.cmd`。

开发与预览中，`/api/chat`、`/api/health` 代理到 3001，其余管理 API 代理到 3000；管理界面可访问 `/admin/admin.html`。管理服务仍独立启动，迁移不新增线上管理 API 路由。聊天保留现有输入行为和暂停说明，不自动修改后端服务开关。

本次完成首阶段首页迁移：保留 `/index.html`、五个区域锚点、详情页与画廊的原 URL 和查询参数。Vue Router、Pinia 及其他页面的 Vue 化留待后续按需引入。

## 部署

`npm run build` 完成类型检查、Vite 构建、旧页面按清单复制和资源校验。`dist/` 可由静态服务器承载；现有 AI API 仍由 Node 服务提供。

`admin/data/` 和 `images/` 是后台维护的运行时内容，不会打包到 `dist/`。常规发布保留服务器上的这两个目录。空环境需先单独准备内容；本地 `npm run preview` 只映射这两个内容目录，不能当作生产服务器使用。

PowerShell 执行 `./deploy.ps1` 会构建并生成 `deploy/releases/<时间戳>/` 前端发布包，不覆盖原有 `deploy/out/`。可选上传需显式指定真实站点路径：

```powershell
./deploy.ps1 -Upload -Server user@host -ServerRoot /absolute/site/path
```

脚本先上传资源，最后替换首页，保留旧哈希资源和上一版首页以便回退；不会上传环境文件、服务端源码或后台 JSON。服务器源码变更需要按现有运维流程单独更新。生产 Nginx 的站点根目录应指向发布包内容所在目录，继续单独配置 `/api/` 代理。本次实现没有执行线上上传。

也可以将构建产物部署到以下静态服务，并单独配置内容目录和 API：

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

## 声明

- 本网站已部署上线：**[mob1s.top](https://mob1s.top)**
- 开源代码仅供**交流学习**，请勿直接复制用于商业项目
- 如需借鉴，请注明出处
- F1、FORMULA 1 及相关标志为 Formula One Licensing B.V. 的商标，本项目为个人粉丝作品，与 F1 无关联

## License

MIT License

Copyright (c) 2026 Mob1S

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
