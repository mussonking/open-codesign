---
version: alpha
name: Cursor
description: Cursor Dev Tools design reference inspired by public brand materials.
colors:
  primary: "#FFFFFF"
  secondary: "#0A0A0A"
  background: "#000000"
  surface: "#0F0F0F"
  surfaceRaised: "#1A1A1A"
  text: "#F5F5F5"
  muted: "#888888"
  border: "#262626"
  accent: "#A6A6A6"
typography:
  display:
    fontFamily: GT America, Inter, system-ui, sans-serif
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -0.03em
  body:
    fontFamily: Inter, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.011em
  mono:
    fontFamily: JetBrains Mono, SF Mono, ui-monospace, monospace
    fontWeight: 400
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
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

Cursor's marketing surface is severe and editorial — pure black background, large white display type, almost no chrome, and one or two video clips of the editor in motion. The brand presents itself like a tech publication: confident, monochrome, type-led. The product itself is a VS Code fork with subtle Cursor-specific affordances (the AI sidebar, the inline diff overlay) that respect VS Code's existing visual language.

The signature feel is "less than minimal" — the marketing site can fit on one screen and still say everything.

## Colors

- `primary` (`#FFFFFF`) — white; primary CTAs and headline copy on the black canvas.
- `background` (`#000000`) — pure black; the marketing canvas.
- `surface` (`#0F0F0F`) — section bands that need separation from background.
- `surfaceRaised` (`#1A1A1A`) — cards, inline editor mockups.
- `text` (`#F5F5F5`) — body copy on dark.
- `muted` (`#888888`) — secondary copy, captions, footer.
- `border` (`#262626`) — hairline; barely visible.

The brand intentionally lacks a colored accent — the AI's "magic" is conveyed through motion (typewriter effects, diff highlighting) rather than a brand color.

## Typography

Display uses GT America (or Inter as fallback) at weight 500, very tight tracking (-0.03em), 1.05 line-height. Hero headlines are large (64-96 px). Body is Inter 400, 1.55 line-height.

Mono (JetBrains Mono) appears in code mockups, diff illustrations, and the AI prompt UI. Hierarchy is enforced by scale and weight — color stays monochrome.

## Layout

Marketing pages use a centered single-column layout with max width ~1080 px and large vertical breaks (96-128 px). The page is short by design — hero, three feature blocks, footer. Inside the editor the layout is VS Code's: activity bar, sidebar, editor group, panel — Cursor adds a right-hand AI chat panel.

## Elevation & Depth

The brand is essentially flat. Editor mockups float on the page with a faint `md` shadow against the black background. No glassmorphism, no glow, no neon. Diff overlays inside the editor use color (green/red) as the only chromatic moments in the entire experience.

## Components

- **Buttons**: 36-44 px height, 6 px radius. Primary: solid white background, black text, no border. Secondary: transparent with 1 px white border at 30% opacity.
- **Cards**: 8-12 px radius, `surfaceRaised` background, 1 px hairline border, no shadow on default state.
- **Inline editor mockups**: framed in a `surfaceRaised` window chrome with three traffic-light dots, mono code inside.
- **Inputs**: 40 px height, 6 px radius, 1 px `border` that brightens to white on focus.
- **Pills / labels**: rounded-full, 12 px text, `surface` background.

## Do's & Don'ts

**Do**
- Start from pure black and add only what's necessary.
- Keep the headline short and large (64-96 px), GT America or Inter at weight 500, tight tracking.
- Frame editor mockups with traffic-light window chrome and mono code.
- Use white as both text color and primary CTA fill.
- Let motion (cursor blinks, typewriter reveal, diff sweep) provide the energy.

**Don't**
- Add a brand accent color — the brand is monochrome.
- Use rounded corners larger than 12 px on chrome.
- Decorate with gradients, glows, or neon outlines.
- Show the full editor UI on the marketing surface; show focused mockups instead.
- Stack many CTAs — one primary action per page.

## Responsive Behavior

The single-column marketing layout stacks naturally on mobile; hero headlines drop from ~96 px to ~36 px and section breaks compress from 128 to 64 px. Editor mockups scale down with their window chrome intact, never reflowing internal layout. The product editor follows VS Code's responsive behavior (panel collapse, etc.) on smaller windows.

## Agent Prompt Guide

When asked to design "in the style of Cursor":
1. Begin from a pure black canvas with white type. No accent color.
2. Set the hero in GT America or Inter at weight 500, 64-96 px, tight tracking.
3. Demonstrate the product with a framed editor mockup (traffic-light chrome, mono code) rather than a screenshot of the full UI.
4. Use a single white primary CTA button, no border, no shadow.
5. Keep the page short and editorial — a hero, two or three feature blocks, footer.

---
*Inspired by Cursor. Tokens derived from publicly available CSS / press
materials. Not affiliated with brand owners. Source structure based on
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT).*
