# Province Map Improvement Design

## Problem Statement

Current province detail page (`map-detail.html`) has two visual issues:

1. **Distorted proportions** — The `project()` function uses linear mapping of longitude/latitude to SVG coordinates without accounting for latitude distortion. This makes provinces appear horizontally stretched ("臃肿").

2. **Missing city boundaries** — Cities are shown only as dots without visible boundary lines between them. Users cannot see the geographic extent of each city.

## Design Goals

- Fix coordinate projection to display provinces with natural, accurate proportions
- Add city boundary lines within each province for clear visual separation
- Maintain existing functionality: footprint city highlighting, click-to-detail navigation
- Keep page load performance acceptable (dynamic API fetch)

## Technical Approach

### 1. Coordinate Projection Fix

Current projection (linear):
```js
function project(lng, lat) {
  const x = ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)) * mapW;
  const y = ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * mapH;
  return [x, y];
}
```

Problem: At different latitudes, 1 degree of longitude covers different ground distances. Linear mapping ignores this, causing horizontal distortion.

Fix: Apply cosine correction based on province center latitude:
```js
const latCenter = (bounds.latMin + bounds.latMax) / 2;
const cosLat = Math.cos(latCenter * Math.PI / 180);

function project(lng, lat) {
  const x = ((lng - bounds.lngMin) * cosLat / ((bounds.lngMax - bounds.lngMin) * cosLat)) * mapW;
  const y = ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * mapH;
  return [x, y];
}
```

This simplifies to the same formula for x, but the bounds calculation will use corrected values:
```js
const lngRange = (bounds.lngMax - bounds.lngMin) * cosLat;
const latRange = bounds.latMax - bounds.latMin;
const scale = Math.min(mapW / lngRange, mapH / latRange);
const offsetX = (mapW - lngRange * scale) / 2;
const offsetY = (mapH - latRange * scale) / 2;

function project(lng, lat) {
  const x = offsetX + (lng - bounds.lngMin) * cosLat * scale;
  const y = offsetY + (bounds.latMax - lat) * scale;
  return [x, y];
}
```

### 2. City Boundary Rendering

Data source: DataV GeoAtlas API
- URL: `https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json`
- Returns GeoJSON with city-level boundaries

Rendering approach:
1. Fetch province GeoJSON with city sub-regions
2. For each city feature, extract boundary coordinates
3. Convert GeoJSON coordinates to SVG path using corrected `project()` function
4. Render city boundaries as `<path>` elements with appropriate styling

Visual styling:
- **Footprint cities** (in TRAVELED_CITIES):
  - Border: `stroke: var(--neon)` (green)
  - Fill: `fill: rgba(191, 255, 0, 0.08)` (semi-transparent green)
  - Glow effect on hover
- **Normal cities**:
  - Border: `stroke: rgba(100, 140, 180, 0.3)` (dim blue-gray)
  - Fill: `fill: rgba(30, 40, 55, 0.6)` (dark blue-gray)
- **City dots**: Remain at city center coordinates, on top of boundaries

### 3. Data Flow

```
map-detail.html loads
  ↓
Read ?id={adcode} from URL
  ↓
Import CHINA_PROVINCES, TRAVELED_CITIES from map-data.js
  ↓
Fetch {adcode}_full.json from DataV API
  ↓
Parse GeoJSON features for each city
  ↓
For each city:
  - Generate SVG path from boundary coordinates
  - Check if city is in TRAVELED_CITIES
  - Apply appropriate styling
  - Render boundary + dot + label
```

### 4. File Changes

| File | Change |
|------|--------|
| `map-detail.html` | Rewrite `render()` to fetch city GeoJSON, add boundary paths, fix projection |

No changes needed to:
- `map-data.js` — Province data stays the same
- `script.js` — Main page map unchanged
- `index.html` — No structural changes
- `style.css` — City boundary styles will be inline in map-detail.html

### 5. Performance Considerations

- API fetch happens once per province page load
- DataV API is fast (CDN-backed)
- GeoJSON parsing is lightweight for ~20 cities per province
- SVG rendering is efficient for this number of paths

Fallback: If API fetch fails, fall back to current dot-only display.

### 6. Edge Cases

- **Hainan province**: Includes South China Sea islands — keep existing inset behavior
- **Municipalities** (Beijing, Shanghai, etc.): May have fewer sub-regions, handle gracefully
- **Autonomous prefectures**: May have different naming conventions

## Success Criteria

1. Province map proportions look natural (no horizontal stretching)
2. City boundaries are clearly visible with distinct styling for footprint vs normal cities
3. Clicking footprint cities still navigates to city-detail.html
4. Page load time remains under 2 seconds
5. Works for all 34 provinces
