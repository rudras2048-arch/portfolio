# DESIGN SYSTEM TOKENS CONTRACT (v2.0)
**Theme**: "EVIDENCE, NOT NOISE" — High-Interactive Luxury Editorial  
**Source of Truth**: Extracted directly from `/Users/rudrasharma/Desktop/portfolio/index.html`  
**Target Consumer**: Swarm Agents (About, Case Studies, Field Record, Recruiter Mode, Performance, SEO)

---

## 1. CSS Custom Properties (`:root`)

All subsequent agents must use CSS custom properties defined in `:root`. **Never introduce rogue hex color values or arbitrary font stacks.**

```css
:root {
  /* Surface & Background Hierarchy — Personal Lab Graphite */
  --bg: #101216;                         /* Deep graphite canvas */
  --bg2: #161920;                        /* Elevated card & container surface */
  --bg3: #1E222B;                        /* Active states, sub-cards, nested surfaces */
  --bg-card: rgba(22, 25, 32, 0.88);     /* Glassmorphic card fill */

  /* Text & Editorial Hierarchy */
  --text-bone: #F4F4F5;                  /* Warm white primary headline & editorial text */
  --text-muted: #A3AAB7;                 /* Muted grey secondary body, subtitle copy */
  --text-dim: #9CA4B3;                   /* Tertiary kickers, timestamps (AA contrast compliant) */

  /* Dual Technical + Execution Accents */
  --accent: #C4F06A;                     /* Acid lime execution primary accent */
  --accent-bright: #D6F888;              /* High-energy hover, active badges */
  --accent-soft: rgba(196, 240, 106, 0.13);
  --accent-glow: rgba(196, 240, 106, 0.30);
  --lab-accent: #A5B4FC;                 /* Electric periwinkle engineering / research accent */
  --lab-bright: #C7D2FE;
  --lab-soft: rgba(165, 180, 252, 0.13);

  /* Structural Rules & Borders */
  --rule: rgba(255, 255, 255, 0.09);     /* Thin structural hairline border */
  --rule-hover: rgba(165, 180, 252, 0.42); /* Interactive border accent */

  /* Layout & Geometry */
  --card-radius: 14px;                   /* Clean restrained card radius */
  --container-max: 1220px;               /* Fixed maximum container width */

  /* Typography Stacks */
  --font-display: 'Syne', system-ui, -apple-system, sans-serif;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
}
```

---

## 2. Typography Token Specification

| Role | Font Family Token | Weight / Style | Optical Sizing / Settings | Usage Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `var(--font-display)` | 700, 800 | Normal | Hero H1 (`Rudra Sharma`), Section Numbers |
| **Serif** | `var(--font-serif)` | 400, Italic | Italic editorial flourishes | Pull quotes, headline contrasts (`.stagger`), reflections |
| **Body** | `var(--font-body)` | 300..700 | 9..40 opsz | Paragraphs, case study narrative, bio copy, buttons |
| **Monospace** | `var(--font-mono)` | 400, 500, 600, 700 | `font-feature-settings: "tnum" 1, "zero" 1;` | Telemetry figures, terminal outputs, tags, timestamps |

### Modular Type Scale
- **Hero Title**: `clamp(3.2rem, 7vw, 5.6rem)` | `line-height: 1.02` | `letter-spacing: -0.035em`
- **Section Heading**: `clamp(2.0rem, 4vw, 2.8rem)` | `line-height: 1.15` | `letter-spacing: -0.025em`
- **Card Title / H3**: `1.35rem` – `1.55rem` | `font-weight: 700`
- **Body Lead**: `1.05rem` – `1.15rem` | `line-height: 1.6`
- **Body Standard**: `0.95rem` – `1.0rem` | `line-height: 1.6`
- **Kicker / Eyebrow**: `11px` – `12px` | `letter-spacing: 0.14em` | `text-transform: uppercase`
- **Data / Telemetry Value**: `1.1rem` – `1.4rem` | `font-family: var(--font-mono)` | `font-weight: 700`

---

## 3. Geometry, Radii & Spacing

### Radii Scale
- `--card-radius`: `18px` (Outer primary cards: `.case-card`, `.venture-card`, modals)
- `Secondary Card / Inner Container`: `12px` – `14px` (Telemetry grids, terminal windows)
- `Interactive Elements / Badges`: `9999px` (Pills, filter buttons, nav container, beacon tags)
- `Scrollbar Thumb`: `4px`

### Spacing Scale
- `Padding Section (Desktop)`: `120px 24px`
- `Padding Section (Mobile)`: `80px 16px`
- `Card Internal Padding (Desktop)`: `36px`
- `Card Internal Padding (Mobile)`: `22px` – `24px`
- `Component Gaps`: `8px` (tight), `12px` (compact), `16px` (regular), `24px` (wide), `32px` (grid gap)

---

## 4. Elevation, Glassmorphism & Shadow Rules

- **Standard Card Elevation**:
  ```css
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--rule);
  border-radius: var(--card-radius);
  transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
  ```
- **Card Hover State**:
  ```css
  border-color: var(--rule-hover);
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45), 0 0 20px rgba(165, 186, 40, 0.08);
  ```
- **Fixed Nav Pill**:
  ```css
  background: rgba(14, 14, 18, 0.82);
  backdrop-filter: blur(16px);
  border: 1px solid var(--rule);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
  ```

---

## 5. Motion, Animations & Easing Contracts

### Canonical Timing Curves
- **Snappy Editorial Spring**: `cubic-bezier(0.16, 1, 0.3, 1)` (Modals, cards, dropdowns)
- **Standard UI Ease**: `ease` or `0.25s ease-out` (Color shifts, background transitions)
- **Linear Telemetry**: `linear` (Scroll progress indicators, ticker bars)

### Canonical Keyframes
1. `pulseBlink`:
   ```css
   @keyframes pulseBlink {
     0%, 100% { opacity: 1; transform: scale(1); }
     50% { opacity: 0.35; transform: scale(0.85); }
   }
   ```
2. `blinkCursor`:
   ```css
   @keyframes blinkCursor {
     0%, 49% { opacity: 1; }
     50%, 100% { opacity: 0; }
   }
   ```

---

## 6. Accessibility & prefers-reduced-motion Specification

Every agent delivering CSS animations, transitions, canvas loops, or typewriter effects MUST adhere strictly to the reduced-motion contract:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  html {
    scroll-behavior: auto !important;
  }
  .reveal, [class*="-reveal"] {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

### JavaScript Reduced Motion Gate
```javascript
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) {
  // 1. Immediately cancel requestAnimationFrame loops
  // 2. Render static frames without tweening
  // 3. Immediately display complete typewriter strings
  // 4. Snap count-up numbers directly to target values
}
```

---

## 7. STRICT CSS Class Prefix Matrix (Collision Isolation)

To eliminate any chance of style collision across parallel and sequential swarm agents, **each domain is assigned a mandatory CSS class prefix**.

> [!IMPORTANT]
> **NO AGENT MAY INTRODUCE UNPREFIXED CLASSES OR RESTYLE BARE HTML TAGS** (`body`, `h1`, `p`, `button`, `section`, etc.). All styles written by an agent must be scoped strictly to its assigned prefix.

| Domain / Agent | Assigned Prefix | Example Classes | Ownership Scope |
| :--- | :--- | :--- | :--- |
| **About / Journey** | `.ab-` | `.ab-section`, `.ab-timeline`, `.ab-milestone`, `.ab-bio-quote` | Chronological builder journey, education card, backstory |
| **Case Studies** | `.cs-` | `.cs-modal`, `.cs-deepdive-btn`, `.cs-telemetry-panel`, `.cs-financial-table` | Expandable deep-dives, financial breakdowns, modal triggers |
| **Field Record** | `.fr-` | `.fr-filter-bar`, `.fr-badge`, `.fr-trophy-pill`, `.fr-card-wrapper` | Competitive records grid, category filtering, proof gallery |
| **Recruiter Mode** | `.rm-` | `.rm-toggle-btn`, `.rm-summary-drawer`, `.rm-signal-pill`, `.rm-fast-facts` | Instant executive view, hiring metrics, one-click PDF triggers |
| **Performance** | `.pf-` | `.pf-canvas-worker`, `.pf-fps-meter`, `.pf-lazy-loader`, `.pf-throttle-guard` | Adaptive canvas rendering, frame-rate budget guards, asset optimization |
| **SEO / Share** | `.seo-` | `.seo-schema-script`, `.seo-meta-preview`, `.seo-share-toast`, `.seo-og-card` | JSON-LD schema injection, OpenGraph meta injection, share badges |

### Core Protected Classes (Do Not Delete or Overwrite)
The existing v1 foundation in `index.html` relies on these selectors:
- `#progress`, `#field`, `#glow`, `.grid-overlay`, `.nav-wrap`, `nav`, `.pulse-dot`
- `.hero-wrap`, `.hero-grid`, `.hero-meta-pill`, `.hero-headline`, `.hero-tagline-prompt`, `.hero-statement`, `.hero-stats-row`, `.stat-card`
- `.case-card`, `.case-title`, `.case-trophy-pill`, `.case-pills-row`, `.case-story`, `.case-telemetry-grid`, `.case-visual`
- `.venture-card`, `.venture-meta`, `.venture-name`, `.venture-thesis`, `.term`, `.term-bar`, `.term-body`
- `.contact-card`, `.channel-box`, `#btnCopyEmail`

Agents extending these sections must append new elements using their designated prefix rather than mutating core class definitions.
