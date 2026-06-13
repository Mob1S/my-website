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
| HTML5 / CSS3 | 页面结构与样式 |
| Vanilla JS | 交互逻辑 |
| Three.js | WebGL 粒子效果 |
| Anime.js | 动画引擎 |
| CSS Variables | 主题系统 |

## 页面结构

```
index.html          — 首页 (Hero + F1 主题)
detail.html         — 详情页
map-detail.html     — 地图详情页
city-detail.html    — 城市详情页
purpose-about.html  — 关于页面
purpose-ai.html     — AI 页面
purpose-hobbies.html — 爱好页面
purpose-map.html    — 地图页面
f1_preview.html     — F1 预览页
```

## 数据文件

```
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
| `script.js` | 主脚本 — 交互逻辑、动画、粒子系统 |
| `style.css` | 样式表 — Carbon Telemetry 设计系统 |
| `map-data.js` | 地图数据 |
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

- **Display**: Orbitron (标题/数字)
- **Mono**: Space Mono (正文/代码)

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Mob1S/my-website.git

# 打开 index.html
# 或使用本地服务器
npx serve .
```

## 部署

纯静态网站，可部署到任意静态托管服务：

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

MIT — 仅供学习交流
