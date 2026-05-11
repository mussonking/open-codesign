---
version: alpha
name: Revolut
description: Revolut Fintech design reference inspired by public brand materials.
colors:
  primary: "#0666EB"
  secondary: "#191C1F"
  background: "#FFFFFF"
  surface: "#F5F6F8"
  text: "#191C1F"
  muted: "#6E7178"
  border: "#E4E6EA"
  accent: "#0666EB"
  brandBlack: "#000000"
  successGreen: "#00C46A"
  errorRed: "#FF5050"
typography:
  display:
    fontFamily: Aeonik, Inter, system-ui, sans-serif
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -0.025em
  body:
    fontFamily: Aeonik, Inter, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  mono:
    fontFamily: JetBrains Mono, ui-monospace, monospace
    fontWeight: 400
rounded:
  none: 0px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
spacing:
  unit: 4
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
  5xl: 96px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "{spacing.md}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
---

## Overview

Revolut is the slick European neobank — the marketing surface is dominated by photographic mockups of the iPhone app on glossy black or vivid colored backgrounds, with very large white headlines floating over them. The product (the iOS/Android app) is the design — marketing pages mostly exist to showcase it.

The aesthetic mixes premium fintech (black metal card photography) with playful product screens (color-coded categories, currency flags, animated transactions).

## Colors

- `primary` (`#0666EB`) — Revolut blue; primary CTAs and link color in app.
- `secondary` (`#191C1F`) — near-black; primary marketing background, dark hero bands.
- `background` (`#FFFFFF`) — white in light mode; black in marketing hero bands.
- `surface` (`#F5F6F8`) — pale gray section bands.
- `text` (`#191C1F`) — primary copy on light; white on dark.
- `muted` (`#6E7178`) — secondary copy.
- `border` (`#E4E6EA`) — hairline.
- `successGreen` / `errorRed` — credit/debit indicators in transaction lists.

The product app uses dynamic per-category colors (groceries = green, transport = teal, etc.) — the marketing palette stays calmer.

## Typography

Aeonik (Cotype) is the brand face — geometric sans with friendly proportions. Display weight 500, very tight tracking (-0.025em), 1.05 line-height. Body weight 400, 1.5 line-height. Inter is the safe fallback.

Hierarchy: hero (64-96 px) → section (32-40 px) → body (16-18 px) → caption (13 px). Numerals are tabular in transaction lists and balances.

## Layout

Marketing pages alternate full-bleed hero bands (often dark, with phone mockups) and lighter feature bands. 12-column grid, max width ~1240 px. Section padding 64-128 px. Mobile-first feel — even desktop pages center narrow content columns to mimic phone screens.

## Elevation & Depth

The marketing surface is rich with depth — phone mockups float in 3D with soft shadows; metal card photography lit dramatically. The product app itself is flat with rounded soft cards. Large radii (16-32 px) and gentle shadows are the elevation grammar; no neon, no glassmorphism.

## Components

- **Buttons**: 48-56 px height (tall), pill-shaped (rounded-full) on marketing, 12-16 px radius in product. Primary: black on white pages, white on dark hero bands.
- **App-screen mockups**: phone frames with rounded corners (32 px+), shadow drop, often shown at a 3/4 perspective tilt.
- **Cards**: large radii (16-24 px), white on `surface`, soft `sm` or `md` shadow.
- **Transaction rows**: 56-64 px tall, merchant icon + category color + name + amount, mono on amount column.
- **Inputs**: 48 px height, 12 px radius, 1 px border that brightens to blue on focus.

## Do's & Don'ts

**Do**
- Lead the marketing page with a perspective-tilted phone mockup against a dark or vivid colored band.
- Use large rounded corners (16-32 px) on cards and phone frames.
- Set display in Aeonik or Inter at weight 500, tight tracking.
- Use tall (48-56 px) pill CTAs.
- Show transaction rows with merchant icons + category colors + tabular amounts.

**Don't**
- Use small (≤8 px) corner radii on chrome — the brand is rounded.
- Color the app screens uniformly; per-category color is the spec.
- Use bold (700+) display weights.
- Show data tables; the brand prefers list rows.
- Decorate marketing with gradient washes; rely on photography for atmosphere.

## Responsive Behavior

Below 960 px the perspective-tilted phone mockups rotate to upright portrait orientation; hero headlines drop from ~96 px to ~40 px. Two-column feature bands collapse to single column. The product app is mobile-native — the desktop web experience mirrors the phone with a centered narrow column.

## Agent Prompt Guide

When asked to design "in the style of Revolut":
1. Build a dark or vivid hero band with a perspective-tilted phone mockup of the product.
2. Set hero text in Aeonik or Inter at weight 500 — large (64-96 px), tight tracking, white on dark.
3. Use tall (48-56 px) pill CTAs in white-on-dark or black-on-white.
4. Build transaction lists with merchant icon + category-color dot + name + tabular amount.
5. Apply large rounded corners (16-32 px) on cards and phone frames; soft shadows for depth.

---
*Inspired by Revolut. Tokens derived from publicly available CSS / press
materials. Not affiliated with brand owners. Source structure based on
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT).*
