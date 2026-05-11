---
version: alpha
name: Coinbase
description: Coinbase Fintech design reference inspired by public brand materials.
colors:
  primary: "#0052FF"
  secondary: "#0A0B0D"
  background: "#FFFFFF"
  surface: "#F5F8FF"
  text: "#0A0B0D"
  muted: "#5B616E"
  border: "#DEE1E6"
  accent: "#0052FF"
  successGreen: "#05B169"
  errorRed: "#CF202F"
  warningAmber: "#F0B90B"
typography:
  display:
    fontFamily: Coinbase Display, Coinbase Sans, Inter, system-ui, sans-serif
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.022em
  body:
    fontFamily: Coinbase Sans, Inter, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  mono:
    fontFamily: Coinbase Mono, JetBrains Mono, ui-monospace, monospace
    fontWeight: 400
rounded:
  none: 0px
  sm: 6px
  md: 12px
  lg: 20px
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

Coinbase looks like a serious bank that ships software. The brand color is the unmistakable royal blue (`#0052FF`) — used confidently on hero CTAs and the cube logo. Marketing pages favor large editorial photography (often wide-eyed portraits or product screens), white backgrounds, generous whitespace, and a custom typeface (Coinbase Sans / Display) developed in-house.

The product dashboard is calmer — white background, blue accent, dense data tables, financial-grade typography with tabular numerals.

## Colors

- `primary` (`#0052FF`) — Coinbase blue; primary CTAs, charts, links.
- `text` (`#0A0B0D`) — near-black; primary copy.
- `background` (`#FFFFFF`) — white in light mode (default).
- `surface` (`#F5F8FF`) — pale blue section bands and card backgrounds.
- `muted` (`#5B616E`) — secondary copy, captions.
- `border` (`#DEE1E6`) — hairline.
- `successGreen` (`#05B169`) — gains, positive deltas.
- `errorRed` (`#CF202F`) — losses, negative deltas.
- `warningAmber` (`#F0B90B`) — pending or caution states.

## Typography

Coinbase Sans (custom, by Coinbase) is the brand face. Display weight 500 (the brand prefers medium over bold), -0.022em tracking, 1.1 line-height. Body weight 400, 1.5 line-height. Inter is the safe fallback.

Hierarchy: hero (56-72 px) → section (32-40 px) → body (16 px) → caption (13 px). Numerals are tabular everywhere financial data appears.

## Layout

12-column grid, max width ~1200 px. Generous section padding (64-96 px). Dashboard uses a 240 px sidebar + main with optional right rail for transaction details. Asset detail pages combine a large chart at the top with a dense holdings table below.

## Elevation & Depth

The brand is mostly flat with rounded soft elevation. Cards lift on hover with a soft `sm` shadow. Modals use `md` shadow. Charts are flat — no glow, no gradient fills underneath the line. The signature "asset card" gets a soft drop shadow on hover that lifts ~2 px.

## Components

- **Buttons**: 44-48 px height (taller than typical), 12 px radius. Primary: solid Coinbase blue with white text, no border, no shadow. Secondary: white with 1 px `text` border.
- **Cards**: 12-20 px radius, white on `surface`, 1 px hairline or soft `sm` shadow.
- **Charts**: line/area charts in Coinbase blue with green/red deltas; gridlines in `border`.
- **Asset rows**: 56-64 px tall, asset icon + name + price + 24h change column, mono on numeric cells.
- **Inputs**: 48 px height, 8 px radius, 1 px border that brightens to blue on focus.

## Do's & Don'ts

**Do**
- Anchor the page on Coinbase blue (`#0052FF`) for primary CTAs and chart strokes.
- Use Coinbase Sans (or Inter) at weight 500 on display, never bolder.
- Show financial data in tabular numerals.
- Use green for gains, red for losses; never invert the convention.
- Keep buttons tall (44-48 px) with 12 px radii — feels banking-grade.

**Don't**
- Use a secondary brand color — blue does the work.
- Decorate charts with gradient fills or glows.
- Show prices in proportional figures.
- Use rounded-full corners on primary CTAs; 12 px radius is the brand norm.
- Cluster many CTAs; the user is making financial decisions — clarity wins.

## Responsive Behavior

Below ~960 px the dashboard sidebar collapses behind a tab bar; charts remain full-width and reflow vertically with the holdings table. Below ~640 px asset rows compress to icon + name + price stack with the 24h change moving to a second line. Hero headlines drop from ~72 px to ~36 px. Buttons retain their tall proportions on touch.

## Agent Prompt Guide

When asked to design "in the style of Coinbase":
1. Anchor on Coinbase blue (`#0052FF`) primary CTAs against a clean white canvas.
2. Set display in Coinbase Sans or Inter at weight 500, tight tracking, never bolder.
3. Build dashboard rows with asset icon + name + price + 24h-change columns; tabular numerals on all numeric cells.
4. Use green for gains, red for losses; flat charts with no gradient fills.
5. Make CTAs tall (44-48 px) with 12 px radii — the brand wants to feel trustworthy.

---
*Inspired by Coinbase. Tokens derived from publicly available CSS / press
materials. Not affiliated with brand owners. Source structure based on
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT).*
