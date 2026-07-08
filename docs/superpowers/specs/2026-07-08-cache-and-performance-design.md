# Cache & Performance Optimization Design

> 2026-07-08 | 解决 JSON 数据缓存不更新 + 服务器图片加载卡顿 + 手动部署混乱

## Problem

1. **数据更新不生效** — 本地管理面板改完人物数据，手动上传到服务器后，浏览器仍显示旧数据。清浏览器缓存也没用。
2. **图片加载卡顿** — 服务器上加载图片很慢，尤其是画廊页面。
3. **手动部署混乱** — 每次手动选文件上传，不知道哪些改了、哪些没改，根目录和 `upload_to_server/` 不一致。

## Root Causes

### 缓存问题（两层叠加）

| 层 | 问题 | 详情 |
|----|------|------|
| 前端 | HTML 中 `fetch()` JSON 没有缓存破坏参数 | 根目录 `city-detail.html`、`detail.html`、`gallery.html`、`credits.html` 的 fetch 不带 `?t=` 和 `{ cache: 'no-store' }`（`upload_to_server/` 里已修但根目录没修） |
| 服务器 | `Cache-Control: no-cache` 而非 `no-store` | `no-cache` 允许浏览器做条件请求（304），如果 ETag 不变就继续用旧缓存。Express 的 `express.static` 用文件大小+mtime 生成 ETag，如果上传工具保留了修改时间，ETag 不变 → 304 → 旧数据 |

### 图片加载

- 画廊页（`gallery.html`）一次性渲染所有卡片和 `<img>`，水平滚动条里有几十张图同时发起请求
- 详情页已用 `slice(0, 3)` 限制缩略图数量，不是瓶颈
- 图片已压缩（v1.7.1），但并发请求数量大导致带宽争抢

### 部署

- 根目录文件 ≠ `upload_to_server/` 文件（缓存修复只在后者生效）
- 没有自动化部署，手动选文件容易遗漏

## Solution

### 1. Cache Strategy — 三层联动

**所有 HTML/JS 文件统一加版本号：**

```javascript
// 在每个页面的 <script> 最顶部
var DATA_VERSION = '{{VERSION}}';  // 部署时自动替换为日期

// 所有 JSON fetch 统一格式：
fetch('admin/data/xxx.json?v=' + DATA_VERSION, { cache: 'no-store' })
```

影响文件：`detail.html`、`city-detail.html`、`map-detail.html`、`gallery.html`、`credits.html`、`gallery-data.js`、`map-data.js`

**服务器端 `no-cache` → `no-store`：**

- `upload_to_server/server.js` line 346: `'no-cache'` → `'no-store'`
- nginx `location ~* \.json$` block: `no-cache` → `no-store`

`no-store` 彻底禁止浏览器存储 JSON 响应，每次都是全新请求，不存在 304。

### 2. Image Loading — Intersection Observer 渐进加载

**画廊页（`gallery.html`）：**

- 首屏只渲染 6-8 张卡片（可视区 + 左右 buffer）
- 其余卡片用占位壳子（保留宽高，不放 `<img>`，碳纤维背景 + 霓虹边框）
- `IntersectionObserver` 监听，rootMargin 300px，卡片接近可视区时才注入 `<img>`
- 滚动方向感知：往右滚优先加载右边，反之亦然

**其他页面：**

- 确保所有 `<img>` 标签带 `loading="lazy"`（部分已有，统一补全）

**nginx 不改** — 图片层已有 7 天缓存 + 直接静态返回，配置够好。

### 3. Deploy Script — deploy.ps1

一个 PowerShell 脚本，放在项目根目录。

**命令：**

```
.\deploy.ps1             准备部署包到 deploy\out\，自动注入版本号
.\deploy.ps1 -upload user@host  SCP 上传到服务器
.\deploy.ps1 -diff        对比本地和上次部署的差异
```

**版本注入：**

源文件写 `{{VERSION}}` 占位符，脚本运行时替换为当天日期（`2026-07-08`）。不用手动改版本号。

**部署文件清单（内置在脚本中）：**

```
index.html, style.css, script.js
detail.html, city-detail.html, map-detail.html
gallery.html, credits.html
purpose-*.html, f1_preview.html, presentation.html
map-data.js, gallery-data.js
F1_SVG_wb.svg
admin/admin.html, admin/server.js, admin/data/*.json
anime-4.4.1/dist/bundles/anime.esm.min.js
备案图标.png
```

图片（`images/`）和 GeoJSON（`data/`）默认不包含 — 体积大，单独上传。

**清理：**

删除 `upload_to_server/` 目录及相关文件（`fix_png.py`、`fix_single.py`、`nginx-proxy-mob1s.conf`），根目录成为唯一真相来源。

## Architecture

```
                    deploy.ps1
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   读取源文件      注入 {{VERSION}}    复制到 deploy\out\
                        │
                        ▼
                  SCP → 服务器 /www/wwwroot/mob1s/
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     nginx:80     Express:3001    nginx 直接返回
     HTML/CSS/JS   JSON(no-store)  图片(7d cache)
```

## Files Changed

| File | Change |
|------|--------|
| `detail.html` | Add `DATA_VERSION`, cache-bust all JSON fetches |
| `city-detail.html` | Add `DATA_VERSION`, cache-bust all JSON fetches |
| `map-detail.html` | Add `DATA_VERSION`, cache-bust all JSON fetches |
| `gallery.html` | Add `DATA_VERSION`, cache-bust all JSON fetches, IntersectionObserver lazy loading |
| `credits.html` | Add `DATA_VERSION`, cache-bust all JSON fetches |
| `gallery-data.js` | Add `DATA_VERSION` to all fetch URLs |
| `map-data.js` | Add `DATA_VERSION` to all fetch URLs |
| `upload_to_server/server.js` | `no-cache` → `no-store` on line 346 |
| `deploy.ps1` | **New** — deploy script |
| `upload_to_server/` | **Delete** entire directory |
| `fix_png.py`, `fix_single.py` | **Delete** — unused scripts |
| `nginx-proxy-mob1s.conf` | Move to project root (reference only), update JSON cache header |

## What Stays the Same

- nginx image handling (expires 7d, direct static serve) — already optimal
- nginx main proxy caching (1min for HTML) — acceptable
- Image compression pipeline (admin panel auto-compress) — already in place
- Detail page thumbnail limits (`slice(0, 3)`) — already reasonable

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `no-store` 增加服务器请求量 | JSON 文件很小（几 KB），Express 读磁盘微秒级，无影响 |
| IntersectionObserver 在旧浏览器不兼容 | 加 polyfill 或 fallback 到 `loading="lazy"` |
| 部署脚本误覆盖服务器文件 | `-diff` 命令先预览差异，确认后再上传 |
| 版本号占位符 `{{VERSION}}` 可能出现在内容中 | 检查确认 `{{VERSION}}` 只用于版本号位置 |
