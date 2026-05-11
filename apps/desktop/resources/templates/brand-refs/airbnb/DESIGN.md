---
version: alpha
name: Airbnb
description: Airbnb Consumer design reference inspired by public brand materials.
colors:
  primary: "#FF385C"
  secondary: "#222222"
  background: "#FFFFFF"
  surface: "#F7F7F7"
  text: "#222222"
  muted: "#717171"
  border: "#DDDDDD"
  accent: "#FF385C"
  gradientFrom: "#E61E4D"
  gradientTo: "#BD1E59"
  superhostRed: "#E31C5F"
typography:
  display:
    fontFamily: Cereal, Circular, Inter, system-ui, sans-serif
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  body:
    fontFamily: Cereal, Circular, Inter, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  mono:
    fontFamily: ui-monospace, SFMono-Regular, monospace
    fontWeight: 400
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
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

Airbnb's visual identity is human, warm, and travel-photography-driven. The Bélo logo is rounded and tactile; the brand color is a saturated coral-red ("Rausch") that feels welcoming rather than corporate. Pages are built around large square or 4:3 photography of homes and experiences, arranged in dense responsive grids.

Type is humanist (Cereal, the proprietary face) with rounded terminals. Iconography follows the same logic — outline icons with rounded corners and ends.

## Colors

- `primary` (`#FF385C`) — Rausch; the unmistakable Airbnb coral-red. Used on the search button, hero CTAs, and the wishlist heart.
- `text` (`#222222`) — near-black; primary copy.
- `surface` (`#F7F7F7`) — pale gray section bands and skeleton loading states.
- `border` (`#DDDDDD`) — hairline; used heavily on the search bar and listing cards.
- `gradientFrom` → `gradientTo` — the Rausch-to-magenta gradient on the primary CTA.

The product avoids secondary accent colors; coral does the entire job, supported by listing photography.

## Typography

Cereal (custom, by Dalton Maag) is the brand face — geometric humanist with rounded terminals. Display weight 700, ~1.15 line-height; body 400, ~1.5 line-height. Inter or Circular are fallbacks.

Hierarchy uses 4-5 type sizes — large hero (40-56 px), section heading (22-26 px), card title (16 px), body (14-16 px), caption (12 px). Numerals are tabular in pricing and ratings.

## Layout

12-column grid, max width ~1280 px in product. Listing grids reflow from 4-up to 3-up to 2-up to 1-up across breakpoints. Section padding 48-96 px on marketing; 24-32 px in product. Map + listings split-view uses a 50/50 or 60/40 horizontal split on desktop.

## Elevation & Depth

The default surface is flat with hairline borders. Cards lift on hover with a soft `md` shadow. Modal sheets slide up from the bottom on mobile and use full-screen takeovers on desktop with a strong dimmed backdrop. Maps overlay floating cards with `lg` shadow. No glassmorphism or color tints.

## Components

- **Search bar**: pill-shaped, 1 px border, soft shadow, four field segments separated by faint dividers, coral search icon button at the right.
- **Buttons**: primary pill or rounded-md (8 px) with the Rausch gradient on hero CTAs, solid coral elsewhere; secondary is white with 1 px black border.
- **Listing cards**: borderless, large rounded image (12-16 px radius), title + meta + price in a tight stack below.
- **Star ratings**: filled black star + decimal rating + count in parens; never colored.
- **Wishlist heart**: outline by default, fills coral on save with a small bounce.

## Do's & Don'ts

**Do**
- Lead with large square or 4:3 home photography in dense responsive grids.
- Reserve coral (`#FF385C`) for the wishlist heart and the primary CTA.
- Use the Rausch-to-magenta gradient on the most decisive CTA only.
- Round listing image corners (12-16 px) — Airbnb avoids hard square crops.
- Show prices and ratings in tabular numerals.

**Don't**
- Introduce a secondary accent color — coral does the whole job.
- Use heavy borders on listing cards — they live borderless.
- Color the star rating — it stays filled black.
- Decorate with gradients beyond the single hero CTA.
- Use pure black for text — `#222222` is the brand value.

## Responsive Behavior

Below 950 px the search bar transforms into a single tappable pill. Below 744 px the listing grid becomes a single column with edge-to-edge images. Map + list view collapses to a tabbed swap. Mobile sheets slide from the bottom rather than centered modals; the wishlist heart remains in the top-right of every card at every breakpoint.

## Agent Prompt Guide

When asked to design "in the style of Airbnb":
1. Build the page around a dense grid of square or 4:3 photographs with 12-16 px rounded corners.
2. Anchor the hero on a coral-red (`#FF385C`) pill CTA, optionally with the Rausch→magenta gradient.
3. Use Cereal (or Inter as fallback) — 700 weight on headings, 400 on body, humanist proportions.
4. Keep chrome warm and rounded — pill search bar, soft hover shadows, rounded image corners.
5. Show ratings as filled black stars with decimal value, never colored.

---
*Inspired by Airbnb. Tokens derived from publicly available CSS / press
materials. Not affiliated with brand owners. Source structure based on
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT).*
