---
name: Agricultural Intelligence
colors:
  surface: '#fef9ed'
  surface-dim: '#dedace'
  surface-bright: '#fef9ed'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3e7'
  surface-container: '#f2ede2'
  surface-container-high: '#ede8dc'
  surface-container-highest: '#e7e2d6'
  on-surface: '#1d1c15'
  on-surface-variant: '#3f4941'
  inverse-surface: '#323029'
  inverse-on-surface: '#f5f0e4'
  outline: '#6f7a70'
  outline-variant: '#bfc9be'
  surface-tint: '#166c3e'
  primary: '#006134'
  on-primary: '#ffffff'
  primary-container: '#287a4a'
  on-primary-container: '#b4ffc7'
  inverse-primary: '#87d89f'
  secondary: '#36684e'
  on-secondary: '#ffffff'
  secondary-container: '#b8efcd'
  on-secondary-container: '#3c6e54'
  tertiary: '#006122'
  on-tertiary: '#ffffff'
  tertiary-container: '#267b38'
  on-tertiary-container: '#b9ffb9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a2f5b9'
  primary-fixed-dim: '#87d89f'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522b'
  secondary-fixed: '#b8efcd'
  secondary-fixed-dim: '#9dd2b2'
  on-secondary-fixed: '#002112'
  on-secondary-fixed-variant: '#1d5037'
  tertiary-fixed: '#a0f6a4'
  tertiary-fixed-dim: '#84da8b'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#00531c'
  background: '#fef9ed'
  on-background: '#1d1c15'
  surface-variant: '#e7e2d6'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-1:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-1-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-2:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-3:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-large:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-default:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-medium:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses high-precision agricultural telemetry and geospatial earth observation. Inspired by traditional terraced water distribution networks (Subak) combined with modern satellite remote sensing, the system moves deliberately away from sterile corporate SaaS tropes and generic floating white cards. 

Instead, it relies on tectonic, structural color blocking, earthy yet radiant tonal palettes, and clean, high-density data visualizations. The emotional tone is authoritative, living, and scientifically grounded: complex multivariate indices (NDVI, LST, precipitation anomalies, SHAP values) are surfaced with calm clarity against warm, organic backgrounds. Layouts evoke partitioned, cultivated landscapes through framed field plots, geometric segmentation, and rhythmic horizontal tiers.

## Colors

The palette directly models real-world agrarian metrics: vegetative indices, irrigation hydrology, and thermal stress patterns.

- **Primary Canvas & Surfaces**:
  - `Warm Cream` (`#F7F2E6`): Foundation ground plane across all full-page views, creating a tactile, parchment-like readability that reduces digital eye strain.
  - `Sage` (`#C8DDAF`): Grounded secondary surface used for nested panels, secondary filters, map card wrappers, and summary stat panels.
  - `Dark Green` (`#164A32`): High-authority anchor used for primary command sidebars, dark analytical panels, top-level plot navigation, and high-impact structural blocks.

- **Interactive & Metrics**:
  - `Primary Green` (`#287A4A`): High-priority affirmative actions, focal telemetry metrics, active toggle states, and key data paths.
  - `Fresh Green` (`#55A85F`): Canopy density, NDVI vegetation vigor indicators, positive yield delta, and healthy bio-mass tracking.
  - `Muted Olive Gold` (`#C4A83F`): Land Surface Temperature (LST), solar irradiance, predictive inference markers, and yield model highlights.
  - `Rainfall Blue` (`#4D9FC1`): Soil moisture saturation, meteorological precipitation events, and water management overlays.
  - `Warning/Negative Red` (`#D66B57`): Thermal stress thresholds, deficit water alerts, negative SHAP feature importance, and pathogen alerts.

- **Typography & Boundaries**:
  - `Primary Text` (`#19382A`): Deep chlorophyll tint for absolute legibility on cream and sage surfaces.
  - `Muted Text` (`#68766D`): Descriptive telemetry metadata, unit notations, and secondary labels.
  - `Border / Divisor` (`#DDE5D3`): Structural plot lines, grid boundaries, and panel frames.

## Typography

The design system standardizes exclusively on **Plus Jakarta Sans**, utilizing its geometric yet humanist structure to bridge scientific rigor with field-operational accessibility. 

- **Display & Headings**: Tightly tracked display and heading tiers (`-0.02em` to `-0.01em`) ground the interface with clean, modern confidence. They should be set in `#19382A` over light backgrounds or `#F7F2E6` over Dark Green (`#164A32`) headers.
- **Body & Data Readings**: Set at a crisp 14px scale with neutral letter tracking for dense telemetry feeds, sensor tables, and geospatial legends.
- **Labels & Micro-data**: The 11px / 600 weight token is reserved for technical nomenclature, map layers, coordinate readouts, index scales, and SHAP axis identifiers. Always set in uppercase with `0.04em` letter spacing for legibility under harsh outdoor lighting conditions.

## Layout & Spacing

Layouts are structured as an architectural mosaic inspired by terraced agriculture. The screen is segmented into clear, contiguous fields of information rather than isolated floating cards.

- **Grid Architecture**:
  - **Desktop (≥ 1200px)**: 12-column structural grid anchored by a persistent 280px operational Dark Green sidebar. The analytical dashboard employs 20px (`1.25rem`) gutters and 32px (`2rem`) outer boundaries.
  - **Tablet (768px – 1199px)**: 8-column layout. Sidebar collapses to a streamlined rail (72px). Gutters shift to 16px (`1rem`).
  - **Mobile (< 768px)**: 4-column flow. Operational rail shifts to a bottom-anchored field toolbar. Margins drop to 16px (`1rem`) and gutters to 12px (`0.75rem`).
- **Terrace Stacking & Color Blocking**: Content clusters are placed within solid color blocks (`#F7F2E6` background carrying `#C8DDAF` or `#164A32` sub-containers) separated by crisp 1px borders (`#DDE5D3`). Avoid using excessive white canvas space to isolate elements; rely instead on proximity, border delineation, and structural tone changes.

## Elevation & Depth

This system avoids floating drop shadows and diffused neo-morphic blurs. Depth is achieved strictly through **tonal stratification and structural boundary framing**:

- **Ground Level (Base)**: The canvas sits on `Warm Cream` (`#F7F2E6`), representing raw topographical terrain.
- **Field Level (Level 1)**: Sub-panels, tabular sections, and tool clusters sit on tinted containers (`#C8DDAF` at 30–50% opacity or solid `#FFFFFF` framed by `#DDE5D3`). Borders are 1px solid `#DDE5D3`.
- **Command Level (Level 2)**: Persistent control decks, map controls, and critical sensor sidebars use high-contrast `Dark Green` (`#164A32`), creating authoritative visual hierarchy through extreme contrast rather than simulated 3D drop shadows.
- **Overlay & Popover Layer**: When geospatial plot inspectors or time-series tooltips hover above map viewports, they utilize a crisp 1px solid border (`#287A4A` or `#DDE5D3`) with a hyper-tight, non-diffused grounding shadow: `0 2px 4px rgba(22, 74, 50, 0.08)`.

## Shapes

The interface embraces a tailored architectural geometry. Corner radii are kept crisp and disciplined to evoke precision farming plots, irrigation gates, and scientific instruments.

- **Base Radius (`0.25rem` / 4px)**: Applied to input fields, buttons, table cell selections, status tags, and inline sensor chips.
- **Container Radius (`rounded-lg` / `0.5rem` / 8px)**: Applied to primary content panels, chart frames, map viewports, and modal dialogs.
- **Full Radius (`9999px`)**: Reserved strictly for circular icon-only map controls (e.g., zoom, layer switch, compass reset) and status indicator pips.

## Components

### Buttons
- **Primary Action**: Background `#287A4A`, text `#FFFFFF`, border none. Hover state shifts to `#164A32`. Padding: `8px 16px`. Shape: `rounded` (4px). Label: 14px/600.
- **Secondary Action**: Background transparent, text `#19382A`, border `1px solid #287A4A`. Hover: Background `#C8DDAF` at 25% opacity.
- **Destructive / Stress Action**: Background `#D66B57`, text `#FFFFFF`. Hover: Darkens by 10%.
- **Contextual Inverted (On Dark Green)**: Background `#C8DDAF`, text `#164A32`. Hover: `#FFFFFF`.

### Chips & Badges
- **NDVI / Growth Metric**: Background `#55A85F` (15% tint), text `#164A32`, border `1px solid #55A85F`. Typography: 11px/600 uppercase.
- **LST / Thermal Stress**: Background `#C4A83F` (15% tint), text `#19382A`, border `1px solid #C4A83F`.
- **Hydrology / Precipitation**: Background `#4D9FC1` (15% tint), text `#164A32`, border `1px solid #4D9FC1`.
- **Alert / Warning**: Background `#D66B57` (15% tint), text `#D66B57`, border `1px solid #D66B57`.

### Cards & Analytical Containers
- Discard plain white drop-shadow cards. Use solid blocks:
  - **Data Card**: Background `#FFFFFF` with `1px solid #DDE5D3`. Header bar optional `#C8DDAF` (20% opacity).
  - **Telemetry Summary Block**: Background `#C8DDAF` at 30% fill, border `1px solid #DDE5D3`, padding `16px`.
  - **Deep Inspector Panel**: Background `#164A32`, text `#F7F2E6`, with border `1px solid rgba(200, 221, 175, 0.2)`.

### Inputs & Field Selectors
- Background: `#FFFFFF` or `#F7F2E6`. Border: `1px solid #DDE5D3`. Text: `#19382A`.
- Active/Focused: Border `1px solid #287A4A` with zero outer ring glow; outline is replaced with a 2px inner or crisp edge focus.
- Placeholder text: `#68766D`.

### Checkboxes & Radio Controls
- Unchecked: `1px solid #68766D`, background `#FFFFFF`.
- Checked: Background `#287A4A`, border `#287A4A`, checkmark icon in `#F7F2E6`.

### Specialized Domain Components
- **Subak Plot Divider**: A 1px continuous rule in `#DDE5D3` with an embedded 11px uppercase label denoting sector coordinates or parcel registry tags.
- **SHAP Feature Impact Bar**: A two-directional stacked bar anchored at x=0; positive yield features extend right in `#55A85F`, negative drag impacts extend left in `#D66B57`.
- **Index Gradient Legend**: Multi-stop horizontal color strips (`#D66B57` → `#C4A83F` → `#C8DDAF` → `#55A85F` → `#164A32`) framed with 1px border and anchored with 11px/600 numeric intervals.