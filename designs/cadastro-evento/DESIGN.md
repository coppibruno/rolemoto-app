---
name: Rolê Moto
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb693'
  primary: '#ffb693'
  on-primary: '#561f00'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#a04100'
  secondary: '#ffd799'
  on-secondary: '#432c00'
  secondary-container: '#feb300'
  on-secondary-container: '#6a4800'
  tertiary: '#00daf3'
  on-tertiary: '#00363d'
  tertiary-container: '#00a8bb'
  on-tertiary-container: '#00373e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#ffdeac'
  secondary-fixed-dim: '#ffba38'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#9cf0ff'
  tertiary-fixed-dim: '#00daf3'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
typography:
  display-hero:
    fontFamily: Barlow Condensed
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Barlow Condensed
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Barlow Condensed
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Barlow Condensed
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: 0.02em
  headline-sm:
    fontFamily: Barlow Condensed
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  telemetry-num:
    fontFamily: Barlow Condensed
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 28px
    letterSpacing: 0.03em
  badge-label:
    fontFamily: Barlow Condensed
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-min: 48px
  touch-target: 56px
  gutter-sm: 12px
  gutter-md: 16px
  margin-mobile: 16px
  margin-tablet: 24px
  card-padding-sm: 12px
  card-padding-md: 16px
  card-padding-lg: 20px
---

## Brand & Style

This design system channels the thrill, mechanical precision, and camaraderie of modern motorcycling culture. Tailored for mobile-first PWA scenarios—frequently engaged mounted on handlebars, at roadside pit stops, or in low-light night rides—the interface balances utilitarian clarity with aggressive, modern automotive aesthetics.

The visual direction merges **High-Contrast Dark Mode** with **Tactile Cockpit Instrumentation**:
- **Atmosphere:** Deep asphalt and carbon surfaces layered with high-visibility safety amber and electric orange signal cues reminiscent of performance tachometers, turn indicators, and forged metal chassis.
- **Personality:** Kinetic, dependable, high-octane, communal. Never toy-like; always calibrated, sharp, and purposeful.
- **Emotional Response:** Inspires confidence, alertness, and brotherhood on the road while maintaining glanceable ergonomics during active trips.

## Colors

The color palette is built for rapid optical recognition under outdoor daylight and extreme night-glare conditions.

- **Primary (`#FF6B00` - Electric Apex Orange):** The primary beacon for interactive controls, live convoy beacons, primary actions, and navigational waypoints.
- **Secondary (`#FFB300` - Tach Amber):** Used for warnings, pacing telemetry, intermediate ride styles, and secondary data highlights.
- **Tertiary (`#00E5FF` - Hyper Cyan):** Reserved for technical instrumentation, connected intercom signals, and real-time GPS telemetry states.
- **Neutral (`#121316` - Asphalt Black):** Base background tone, accompanied by dark graphite elevation surfaces (`#1A1C20`, `#22252B`, `#2D323A`) and cold metallic boundary strokes (`#353A44`).
- **Semantic Status Signals:**
  - *Agressiva (Fast Pace):* `#FF334B` (Ignition Crimson)
  - *Moderada (Steady Pace):* `#FFB300` (Tach Amber)
  - *Tranquila (Cruising Pace):* `#00E676` (Baja Green)

## Typography

The typographic hierarchy pairs the high-velocity, industrial presence of **Barlow Condensed** with the clear legibility of **Plus Jakarta Sans**.

- **Display & Headings (Barlow Condensed):** Uppercase-biased headers, section intros, tactical indicators, and digital telemetry meters. The condensed profile optimizes spatial efficiency on compact mobile screens, allowing long Portuguese ride designations to fit without awkward breaks.
- **Body Copy (Plus Jakarta Sans):** Balanced geometric humanist forms maintain high legibility even during ambient road vibrations and rapid glances.
- **Numerals & Metrics:** Speed values, rider counts, distances, and ETA markers strictly adopt `telemetry-num` styling using tabular numerals to avoid layout jitter during live updates.

## Layout & Spacing

Designed primarily for single-handed mobile navigation and touch targets optimized for riders wearing gloved hands.

- **Base Grid & Scaling:** Follows an 8px base rhythm with 4px micro-steps for tight badge insets and cockpit counters.
- **Layout Model:** Single-column fluid layout with an edge gutter of `16px` on mobile screens, constrained to a maximum content width of `560px` centered on larger devices to retain its dedicated cockpit feel.
- **Thumb Zones:** Primary ride interactions (e.g., "Iniciar Rolê", "SOS", "Ponto de Encontro") are locked inside an ergonomic bottom floating dock within the lower 35% of the viewport.
- **Touch Targets:** Interactive targets must strictly respect a minimum touch box of `48px × 48px`, expanding to `56px` for primary ride actions.

## Elevation & Depth

Visual hierarchy does not rely on heavy blurred shadows, which wash out on low-nit mobile screens under sunlight. Instead, depth is achieved through **Tonal Charcoal Stacking**, **Machined Hairline Borders**, and **Subtle Kinetic Luminescence**.

- **Layer 0 (Canvas):** `#121316` (Deep Asphalt).
- **Layer 1 (Cards & Modules):** `#1A1C20` bordered with `1px solid rgba(255, 255, 255, 0.08)`.
- **Layer 2 (Overlays, Floating Sheets & Modals):** `#22252B` bordered with `1px solid rgba(255, 107, 0, 0.22)`.
- **Accent Glows:** High-priority elements (e.g., active GPS route indicators, live SOS pins) use a focused neon edge: `box-shadow: 0 0 16px rgba(255, 107, 0, 0.28)`.
- **Slit Cutouts:** Dividers use a two-tone 1px recessed line (`#0D0E10` top, `#2D323A` bottom) evoking precision-milled automotive panels.

## Shapes

The design system employs a structured geometry balancing functional ergonomic curves with aerodynamic cuts:

- **Standard Cards & Modules:** `roundedness: 2` (0.5rem / 8px) radius keeps container edges compact, avoiding wasted internal space.
- **Pill Badges & Chips:** Completely rounded pill shapes (`9999px`) for ride tempo indicators, member statuses, and filter tags to instantly differentiate actionable labels from static square containers.
- **Hero Actions:** Outer radius of `12px` with interior chamfered accents on select telemetry containers to evoke sport-bike instrument clusters.

## Components

### Buttons
- **Primary ("Acelerar"):** `#FF6B00` background, high-contrast `#121316` text, bold condensed uppercase typography. Height: `52px`. Glow: `0 4px 14px rgba(255, 107, 0, 0.35)`. Subtle inset highlight along top border.
- **Secondary ("Pit Stop"):** Transparent fill with `1.5px solid #353A44` border, `#F5F6F8` text. Active state: `#22252B` background with amber border.
- **Danger ("SOS"):** Solid crimson `#FF334B` with pulsing ring for emergency roadside alerts.

### Cards & Ride Briefings
- Background `#1A1C20`, 1px boundary stroke `rgba(255, 255, 255, 0.08)`.
- Features modular header for route title, start time, distance, and the distinct **Pace Tag**.
- Interior telemetry row featuring speed/distance metrics formatted with tabular numbers.

### Pace Badges (Ritmo de Rolê)
- **Agressiva:** `#FF334B` background tint (`rgba(255, 51, 75, 0.15)`), border `1px solid #FF334B`, text `#FF334B`.
- **Moderada:** `#FFB300` background tint (`rgba(255, 179, 0, 0.15)`), border `1px solid #FFB300`, text `#FFB300`.
- **Tranquila:** `#00E676` background tint (`rgba(0, 230, 118, 0.15)`), border `1px solid #00E676`, text `#00E676`.
- Typography: Uppercase Barlow Condensed, bold tracking `+0.08em`.

### Chips & Route Filters
- Compact height `32px`, pill radius, background `#22252B`.
- Inactive state: `#8E95A2` label; Active state: `#FF6B00` border, `#FF6B00` label with faint inner glow.

### Form Inputs & Checkboxes
- **Inputs:** Dark field `#16171B` inset border with `1px solid #2D323A`. Focus transition to `1.5px solid #FF6B00`. Floating uppercase labels.
- **Toggles & Checkboxes:** Custom high-contrast switch with a neon amber thumb indicator, delivering unmistakable state confirmation during daylight glare.

### Specialized Component: Convoy Live Strip
- A sticky bottom/top telemetry widget presenting: Current Convoy Count (e.g., `12 MOTOS`), Tail Rider Gap (`+2.4 KM`), and Route Stage Beacon with animated amber strobe dot.