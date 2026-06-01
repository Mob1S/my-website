# Dual-Layer Mask Reveal — Design Spec

**Date**: 2026-05-22  
**Status**: Approved

## Summary

Replace the current two-layer translate-based parallax with a mouse-following mask reveal. The page renders two identical-content layers with contrasting color schemes. The top layer has a circular "hole" that follows the mouse cursor, revealing the bottom layer's alternate color scheme beneath.

## Color Schemes

**Top layer (masked, default visible):** Carbon + Neon Green
- Background: `#0a0a0c`
- Text: `#e8e8ec`
- Accent: `#bfff00`
- Muted text: `#90909a` / `#5a5a66`
- Cards/surfaces: `#14141a`
- Borders: `rgba(255,255,255,0.05)` / `rgba(255,255,255,0.08)`

**Bottom layer (revealed through mask):** Paper + Ink
- Background: `#f5f5f0`
- Text: `#1a1a1a`
- Accent: `#cbf902`
- Muted text: `#666666` / `#999999`
- Cards/surfaces: `#ffffff`
- Borders: `rgba(0,0,0,0.08)` / `rgba(0,0,0,0.12)`

## Mask Behavior

- **Shape**: Circle, radius 60px (diameter 120px)
- **Edge**: Hard cut, no feathering
- **Follow**: Spring-delayed lerp toward cursor position (coefficient ~0.08)
- **Default position**: Center of viewport when mouse is outside

## Technical Approach

Use CSS `mask-image` with a dynamically updated `radial-gradient` on the top layer container:

```css
.layer-top {
  mask-image: radial-gradient(
    circle 60px at <x>px <y>px,
    transparent 60px,
    black 60px
  );
}
```

- `transparent 60px` creates the hole (pixels are hidden)
- `black 60px` keeps the rest of the top layer visible
- Coordinates `<x>, <y>` updated via JS on mousemove

## Architecture

**HTML structure:**
```
.layer-bottom  → bottom layer (paper color scheme, all content duplicated)
.layer-top     → top layer (carbon color scheme, mask applied here)
```
Both layers contain structurally identical DOM. CSS variables control the color differences.

**CSS changes:**
- Define two sets of CSS variables: `--carbon-*` and `--paper-*`
- `.layer-bottom` uses paper variables
- `.layer-top` uses carbon variables, plus `mask-image`

**JS changes:**
- Single mousemove handler updating mask position
- Spring lerp in rAF loop for smooth following
- Remove old translate-based parallax code
- Remove CSS sparkle field (no longer needed)
- Keep Three.js particles if WebGL is available

**Files to modify:**
- `index.html` — restructure layers, duplicate content
- `style.css` — two color schemes, mask styling
- `script.js` — replace parallax with mask tracking, remove sparkle injection

## Edge Cases

- **Touch devices**: Use touchmove events, same mask behavior
- **Window resize**: Recalculate default mask center position
- **No JS / file:// protocol**: Bottom layer visible as fallback (top layer has no mask → fully opaque = carbon theme visible). Acceptable degradation.
- **Performance**: rAF-based lerp, no expensive operations per frame

## Scope

Single-feature change. Does NOT affect:
- Detail pages (detail.html)
- Navigation structure
- Content sections
- Chat terminal logic
- Three.js particle system (preserved as-is)
