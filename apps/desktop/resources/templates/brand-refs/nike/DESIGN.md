---
version: alpha
name: Nike
description: Nike Retail design reference inspired by public brand materials.
colors:
  primary: "#000000"
  secondary: "#FFFFFF"
  background: "#FFFFFF"
  surface: "#F5F5F5"
  text: "#111111"
  muted: "#757575"
  border: "#E5E5E5"
  accent: "#FA5400"
  brandRed: "#CE0E2D"
typography:
  display:
    fontFamily: Nike Futura, Futura, Helvetica Neue, Inter, system-ui, sans-serif
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.01em
  body:
    fontFamily: Helvetica Neue, Inter, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  mono:
    fontFamily: ui-monospace, SFMono-Regular, monospace
    fontWeight: 400
rounded:
  none: 0px
  sm: 0px
  md: 0px
  lg: 0px
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
  6xl: 128px
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

Nike.com is editorial sportswear publishing. Hero sections are dominated by oversized athlete photography or product hero shots, with an enormous bold headline (Futura-style, often condensed and uppercase), a one-line subhead, and a single pill CTA. The grid is sharp — square corners are the default, the swoosh provides the only "curve" — and content reads like a magazine cover.

The brand is monochrome with the occasional brand-red or seasonal accent — color comes from product photography.

## Colors

- `primary` (`#000000`) — black; the swoosh, primary CTAs, headlines.
- `secondary` (`#FFFFFF`) — white; CTAs on dark hero bands.
- `background` (`#FFFFFF`) — white in default e-commerce surface.
- `surface` (`#F5F5F5`) — pale gray section bands and skeleton loaders.
- `text` (`#111111`) — near-black body copy.
- `muted` (`#757575`) — secondary copy, sizing labels.
- `border` (`#E5E5E5`) — hairline.
- Seasonal accents (the famous Nike orange `#FA5400` and historical `#CE0E2D` red) appear contextually on launch campaigns but are not default UI chrome.

## Typography

Nike's brand wordmark uses a customized Futura. Marketing display uses Futura Extra Bold (or Helvetica Neue 800/900 as fallback), tight 1.0 line-height, letterforms often set in uppercase eyebrow labels. Body is Helvetica Neue 400 (or Inter), 1.5 line-height.

Hierarchy: hero (72-128 px / 800 / often uppercase) → eyebrow (12-14 px / uppercase / tracked +0.05em) → body (14-16 px / 400) → caption (12 px). Numerals are tabular for sizing tables.

## Layout

12-column grid, max width ~1440 px. Section padding 48-96 px. Hero bands often go full-bleed with edge-to-edge photography. Product grids reflow from 4-up to 2-up to 1-up. Long-form storytelling pages alternate full-bleed hero photographs with text-and-image bands.

## Elevation & Depth

The brand is essentially flat. No drop shadows on default chrome. Elevation comes from photography (product on white with subtle floor shadow) and from full-bleed hero contrast. Modals use soft `md` shadow over a dimmed backdrop. No glassmorphism.

## Components

- **Buttons**: pill-shaped (rounded-full), 44-52 px height, generous padding. Primary: solid black with white text on light bands; solid white with black text on dark bands. No border, no shadow.
- **Product cards**: borderless, square cropped product image at the top, mono-styled label below (product name in body weight, category caption in `muted`, price right-aligned).
- **Hero text**: huge bold display, often broken across lines manually for editorial pacing.
- **Inputs**: 48 px height, square corners, 1 px black border (no rounding).
- **Filters**: text-based with chevrons; rarely use chips.

## Do's & Don'ts

**Do**
- Lead with full-bleed athlete or product photography and a huge bold headline.
- Use Futura Extra Bold (or Helvetica Neue 800/900) for hero copy, often uppercase.
- Default to square corners on chrome — only the pill CTA is rounded.
- Show product cards borderless on white with square crops.
- Use a single black or white pill CTA per hero — clarity over choice.

**Don't**
- Use rounded corners on cards or inputs — the brand is sharp-edged.
- Decorate with gradients or glows.
- Cluster multiple CTAs in the hero.
- Use serif type for editorial copy.
- Color the swoosh; it's black or white only (or the legacy brand red on heritage assets).

## Responsive Behavior

Below 960 px hero photography retains its full-bleed crop while text scales from ~128 px to ~48 px. Product grids reflow 4-up → 3-up → 2-up. The mega-nav collapses behind a hamburger; filters move into a bottom-sheet drawer. Square-corner aesthetic is preserved at every breakpoint.

## Agent Prompt Guide

When asked to design "in the style of Nike":
1. Lead with full-bleed athlete or product photography; one pill CTA, one headline, one subhead.
2. Set the hero in Futura Extra Bold or Helvetica Neue 800 — large (72-128 px), often uppercase, tight 1.0 line-height.
3. Default to square corners everywhere except the pill CTA (rounded-full).
4. Use a black-on-white or white-on-black palette; let product photography supply color.
5. Build product grids with borderless square-crop tiles and three-line meta below.

---
*Inspired by Nike. Tokens derived from publicly available CSS / press
materials. Not affiliated with brand owners. Source structure based on
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT).*
