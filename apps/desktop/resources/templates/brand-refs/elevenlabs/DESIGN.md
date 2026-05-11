---
version: alpha
name: ElevenLabs
description: ElevenLabs AI design reference inspired by public brand materials.
colors:
  primary: "#000000"
  secondary: "#FFFFFF"
  background: "#FFFFFF"
  surface: "#F4F4F4"
  text: "#0A0A0A"
  muted: "#737373"
  border: "#E5E5E5"
  accent: "#000000"
typography:
  display:
    fontFamily: Söhne, Inter Display, Inter, system-ui, sans-serif
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -0.025em
  body:
    fontFamily: Söhne, Inter, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.005em
  mono:
    fontFamily: JetBrains Mono, ui-monospace, monospace
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

ElevenLabs is monochrome to a fault — black, white, two grays, and audio waveforms doing the visual work. The brand identity is type-led and editorial; the marketing surface looks like a tasteful audio-tech magazine. The hero is usually a single oversized headline + an inline audio player demonstrating the voice synthesis. No bright accents, no gradients.

The product UI inherits the same monochrome — black play buttons, gray waveforms, hairline borders.

## Colors

- `primary` (`#000000`) — black; primary CTAs, brand wordmark, play buttons.
- `background` (`#FFFFFF`) — white in light mode (default).
- `surface` (`#F4F4F4`) — pale gray section bands and audio player backgrounds.
- `text` (`#0A0A0A`) — near-black body copy.
- `muted` (`#737373`) — secondary copy, captions, timestamps.
- `border` (`#E5E5E5`) — hairline.

The brand intentionally avoids accent color — voice waveforms supply the visual rhythm.

## Typography

Söhne (or Inter Display as fallback) at weight 500 for display, tight tracking (-0.025em), 1.05 line-height. Body Inter 400, 1.55 line-height. The brand never goes above weight 500 on display.

Hierarchy: hero (64-96 px) → section (32-40 px) → body (16 px) → caption/mono (13 px). Mono appears for voice IDs, timecodes, and code samples.

## Layout

12-column grid, max content width ~1200 px. Section padding 96-128 px. Marketing pages use single-column editorial layouts punctuated by inline audio players. Product dashboard uses a 240 px sidebar with a fluid main area; voice library views are dense card grids.

## Elevation & Depth

Essentially flat. Modals and popovers use soft `md` shadow on a dimmed backdrop. Voice cards lift gently on hover. Audio waveforms animate during playback (the bars rise and fall in `muted`) — this is the only motion-based depth in the brand.

## Components

- **Buttons**: 36-40 px height, 6-8 px radius. Primary: solid black with white text, no border, no shadow. Secondary: white with 1 px black border.
- **Audio player**: pill-shaped wrapper, black play/pause button on the left, gray waveform spanning the rest, mono timecode at the right.
- **Voice cards**: white on `surface`, 8-12 px radius, hairline border, voice name + sample play button + tags.
- **Inputs**: 40 px height, 6 px radius, 1 px `border` that thickens to black on focus.
- **Tags / chips**: rounded-full, `surface` background, 12 px text in `muted`.

## Do's & Don'ts

**Do**
- Lead with a single oversized monochrome headline plus an inline audio player.
- Use black as the only accent color — no chromatic CTAs.
- Set display in Söhne or Inter at weight 500; never bolder.
- Render waveforms in `muted` gray with subtle playback animation.
- Keep chrome editorial — hairline borders, generous whitespace.

**Don't**
- Introduce a brand accent color — the brand is rigorously monochrome.
- Decorate with gradients or glows.
- Use bold (700+) weights on display copy.
- Color the waveforms; they stay gray.
- Cluster CTAs; one primary action per band.

## Responsive Behavior

Below 960 px the single-column editorial layout reduces side padding from 96 to 24 px. Hero headlines drop from ~96 px to ~36 px. Audio players retain the full pill shape with the waveform compressing rather than truncating. Voice card grids reflow from 4-up to 2-up to 1-up.

## Agent Prompt Guide

When asked to design "in the style of ElevenLabs":
1. Default to monochrome — white background, near-black text, gray accents only.
2. Lead with one oversized hero headline (64-96 px, weight 500, Söhne or Inter, tight tracking).
3. Embed an inline audio player as the hero proof — black play button, gray waveform, mono timecode.
4. Use black-on-white primary CTAs; secondary CTAs are white with 1 px black border.
5. Animate waveforms during playback in `muted` gray — the only motion in the brand.

---
*Inspired by ElevenLabs. Tokens derived from publicly available CSS / press
materials. Not affiliated with brand owners. Source structure based on
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT).*
