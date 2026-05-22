# 更新日志

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
