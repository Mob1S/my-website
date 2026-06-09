# 更新日志

## v1.6.0 — 2026-06-09 — F1 赛车遮罩

### 新增
- **F1 赛车俯视投影遮罩** — 圆孔遮罩替换为 F1 赛车形状，鼠标移动时车头跟随、车身朝移动方向旋转
- **SVG 路径动态渲染** — 提取 `F1_SVG_wb.svg` 路径数据，每帧生成带旋转变换的 SVG data URI，通过 `mask-composite: subtract` 从全覆盖遮罩中减去车形
- **600×600 固定视口** — 车鼻居中，旋转任意角度不裁切
- **方向响应优化** — 角度变化阈值 0.1°，跟随灵敏
- **标注预览工具** `f1_preview.html` — 框选车体范围、标出车头位置，生成坐标代码

### 变更
- Hero 副标题恢复为英文 "Full send. No lift. Always pushing the limit."

---

## v1.5.0 — 2026-06-08 — AI 后端加固 & 云端部署

### 修复
- **AI 聊天超时** — 移除 `req.on('close')` 监听器，curl/Nginx 发送完请求体后会触发 close，导致上游 MIMO API 请求被过早取消
- **`/api/*` 路由被静态文件拦截** — `express.static` 注册顺序移到 API 路由之后

### 新增
- **健康检查** `GET /api/health` — 服务状态、模型名、运行时长
- **请求超时保护** 60s — AbortController 防止 AI 接口无响应时连接挂死
- **优雅关闭** — 响应 SIGTERM/SIGINT，PM2 重启不丢请求
- **进程崩溃保护** — 捕获 uncaughtException / unhandledRejection
- **前端自动重试** — 5xx 或网络异常时重连 2 次，间隔 2s
- **Nginx 配置** `nginx.conf` — SSE 流式响应专用代理配置
- **PM2 配置** `ecosystem.config.js` — 崩溃自动重启，256M 内存限制
- **一键 Nginx 脚本** `setup-nginx.sh` — 兼容宝塔 / Ubuntu / CentOS

### 安全
- `.gitignore` 忽略 `server.js`、`.env`、`.claude/`、`.superpowers/`（含 API Key 和个人数据）

---

## v1.4.1 — AI 流式输出 & 终端遮罩保护

### 新增
- **AI 聊天流式输出** — API 改为 SSE 流式传输，前端逐字实时渲染回复
- **终端遮罩保护** — 圆孔中心进入终端 60px 范围时自动抑制 mask，保持终端碳纤维主题纯净
- 流式输出过滤思考内容（reasoning_content），仅显示最终回复

### 修复
- SECTOR 04 聊天终端上下层错位 — 克隆保持完整 DOM 结构

---

## v1.4 — MY_MAP 模块 & 设计规范修复

### 新增
- **MY_MAP 地图模块** — 全新中国地图交互系统
  - 省份地图详情页 (`map-detail.html`)
  - 城市详情页 (`city-detail.html`)
  - 地图数据模块 (`map-data.js`)
  - 省份介绍页 (`purpose-map.html`)
- 设计规范文档：双层遮罩揭示系统设计规范
- 省份地图改进设计规范

### 修复
- **双层遮罩对齐问题** — 修复聊天界面双层遮罩错位
- **遮罩抑制行为** — 优化遮罩显示/隐藏逻辑

---

## v1.3 — 遮罩修正 & 方格旗实装

### 新增
- **方格旗角落元素实装** — 尺寸提升至 80px，opacity 0.35，带 135° 渐变淡出遮罩
- **遮罩首次出现位置修正** — 鼠标首次移动时遮罩直接出现在鼠标位置，不再从屏幕中心滑出

### 移除
- DELTA HUD 角落元素（-0.312）— HTML 及 CSS 全部清理

### 修复
- 进入网站时遮罩默认隐藏，鼠标移动后才激活
- 彩蛋弹窗出现时暂停双层遮罩，避免底层文字穿透弹窗；弹窗关闭后恢复

---

## v1.2 — 赛道彩蛋 & 界面精简

### 新增
- **Monza 赛道描摹彩蛋** — 用鼠标沿着赛道描摹，触发隐藏彩蛋
  - 8 个顺序检查点，沿 SVG 路径分布
  - 进度圆点逐个点亮，完成全部后弹出 F1 风格弹窗（黑金配色 + 碳纤维纹理）
  - 提示文字首次交互后淡出
  - 路径采样接近检测（30px 容差），鼠标划过文字不会中断进度
  - 事件绑定在 heroSection 上，解决鼠标经过文字触发 mouseleave 重置的问题
  - `hero-inner` 设置 `pointer-events: none`，鼠标事件穿透文字到达 SVG

### 移除
- Hero 导航按钮（INIT SEQUENCE、PIT LANE）— HTML、CSS、JS 全部清理
- 速度折线图（speed-trace polyline）— SVG、CSS、响应式规则
- SCROLL 滚动指示器 — 元素、CSS 动画、入场动画

### 修复
- 下层赛道颜色加深 — 底层路径 0.4 透明度，虚线路径 0.6 透明度
- 彩蛋 `completed` 状态未重置 — 鼠标离开后永久失效的 bug
- 鼠标经过 hero 文字时触发 mouseleave 导致检查点进度重置

---

## v1.1 — Carbon Telemetry 重新设计

- F1 遥测仪表 / 碳纤维美学全面重设计
- 双层遮罩揭示系统（深色碳纤维顶层 + 白纸底层）
- Hero 区域 Monza 赛道 SVG 轮廓
- 遥测 HUD 角落（SECTOR、DELTA）
- 方格旗角落元素
- Anime.js 入场动画
- 响应式布局

---

## v1.0 — 初始版本

- 个人网站基础结构
- anime.js 动画集成
- Hero、About、Hobbies、Chat 四个板块
