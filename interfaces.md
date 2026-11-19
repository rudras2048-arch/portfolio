# COMPONENT INTERFACES CONTRACT (v2.0)
**Theme**: "EVIDENCE, NOT NOISE"  
**Scope**: Phases 1–3 Component Architecture, Insertion Anchors, Data Contracts & State Management  
**Location**: `/Users/rudrasharma/Desktop/portfolio/interfaces.md`

---

## 1. Master Architecture & Section Sequence Contract

To maintain structural clarity and editorial pacing, **the section sequence in `index.html` is immutable**. New sections and components must mount at exact insertion anchors without displacing the primary narrative:

```
[Fixed Nav Bar: .nav-wrap]
  │
  ├── [Hero Section: #hero]
  │     └── [Anchor: Recruiter Mode Executive Drawer (.rm-summary-drawer)]
  │
  ├── [NEW SECTION: About / Builder Journey: #about (.ab-section)]
  │
  ├── [Competitions & Field Record: #competitions]
  │     └── [Anchor: Deep Dive Telemetry Modal Host (#cs-modal)]
  │
  ├── [Ventures & Systems: #ventures]
  │
  ├── [Transmission & Contact: #contact]
  │
  └── [Master Schema & JSON-LD: Injected into <head>]
```

---

## 2. Global Data Ingestion & Offline Safety Contract

### Offline / `file://` Protocol Guard
Portfolios are frequently evaluated locally (`file:///.../index.html`). Standard `fetch('content.json')` will fail due to local origin CORS policies in modern Chromium and WebKit browsers.

**Mandatory Contract**:
1. `content.json` is the canonical JSON file on disk.
2. `index.html` provides a synchronous fallback data payload via:
   ```html
   <script id="portfolio-content-data" type="application/json">
     /* JSON contents of content.json */
   </script>
   ```
   or global constant:
   ```javascript
   window.__PORTFOLIO_CONTENT__ = { /* ...content.json... */ };
   ```
3. Every global component init function must accept an optional `content` parameter, defaulting gracefully:
   ```javascript
   function getPortfolioData(content) {
     if (content) return content;
     if (window.__PORTFOLIO_CONTENT__) return window.__PORTFOLIO_CONTENT__;
     const el = document.getElementById('portfolio-content-data');
     if (el) {
       try { return JSON.parse(el.textContent); } catch (e) { console.error('Data parse error', e); }
     }
     return null;
   }
   ```

---

## 3. Component Interface Specifications

### Component 1: SEO & Structured Data Engine
- **Target Phase**: Phase 1
- **Target HTML Mount Point**:
  - Insertion anchor: Inside `<head>`, immediately preceding `</head>`.
  - Injected node: `<script type="application/ld+json" class="seo-schema-script">`
- **Schema Keys Read from `content.json`**:
  - `personal.name`
  - `personal.headline`
  - `personal.email`
  - `personal.linkedin`
  - `personal.degree`
  - `personal.institution`
  - `personal.resume_url`
  - `hero.stats`
  - `competitions[].title`, `competitions[].host`, `competitions[].event`, `competitions[].date`, `competitions[].placement`
  - `ventures[].name`, `ventures[].thesis`, `ventures[].status`
- **Global JS Init Function**:
  ```javascript
  window.initSEOAndSchema = function(content) { ... }
  ```
  - **Signature**: `(content?: object) => void`
  - **Idempotency**: Verifies whether `.seo-schema-script` already exists; updates or skips without duplicating.
- **State Management & Interaction Contract**:
  - Pure declarative execution.
  - Injects valid Schema.org graph containing `Person`, `WebSite`, and `ItemList` (verified achievements).

---

### Component 2: Recruiter Mode & Executive Brief
- **Target Phase**: Phase 2
- **Target HTML Mount Points**:
  1. **Toggle Switch Anchor**: Inside `.nav-wrap nav`, appended as a peer after `.nav-links` (prior to `#burger` on mobile).
     ```html
     <button id="rm-toggle" class="rm-toggle-btn" aria-pressed="false" aria-label="Toggle Recruiter Mode">
       <span class="rm-toggle-badge">EXECUTIVE</span>
       <span class="rm-toggle-label">Recruiter Mode</span>
     </button>
     ```
  2. **Executive Summary Drawer Anchor**: Inside `<section id="hero">`, appended directly after `<div class="hero-stats-row reveal">` before the closing `</section>`.
     ```html
     <div id="rm-summary-drawer" class="rm-summary-drawer" aria-hidden="true" hidden>
       <!-- High-density recruiter scorecard: instant credentials, ROI, proof links, PDF resume button -->
     </div>
     ```
- **Schema Keys Read from `content.json`**:
  - `personal.name`, `personal.degree`, `personal.institution`, `personal.email`, `personal.linkedin`, `personal.resume_url`
  - `hero.stats` (2 Championships, Top 5 Finalist, 3 Podiums, 4 Projects)
  - `competitions[].financials` (Cash Rush 8.85x fund growth, ₹7k prize, ₹1.1k DCRUST prize)
  - `competitions[].deliverables`
  - `ventures[].status`, `ventures[].status_detail`
- **Global JS Init Function**:
  ```javascript
  window.initRecruiterMode = function(content) { ... }
  ```
  - **Signature**: `(content?: object) => { toggle: () => boolean, getState: () => boolean }`
- **State Management & Interaction Contract**:
  - **In-Memory State**:
    ```javascript
    window.__RECRUITER_MODE = {
      active: false,
      timestamp: null
    };
    ```
  - **Toggle Action**:
    1. Flips `window.__RECRUITER_MODE.active`.
    2. Toggles `document.body.classList.toggle('rm-mode-active', isActive)`.
    3. Toggles `aria-pressed="true|false"` on `#rm-toggle`.
    4. Reveals/hides `#rm-summary-drawer` (`hidden = !isActive`, `aria-hidden = !isActive`).
    5. Dispatches custom event:
       ```javascript
       document.dispatchEvent(new CustomEvent('portfolio:recruiter-mode', {
         detail: { active: isActive }
       }));
       ```
  - **Keyboard & Accessibility**:
    - Focusable via `Tab`. Toggled via `Enter` or `Space`.
    - Pressing `Escape` while Recruiter Mode drawer is focused collapses the drawer and returns focus to `#rm-toggle`.
  - **Reduced Motion Gate**:
    - In `prefers-reduced-motion: reduce`, the drawer toggles immediately with `display: block` / `display: none` (no slide/fade animations).

---

### Component 3: About & Builder Journey Section
- **Target Phase**: Phase 2
- **Target HTML Mount Point**:
  - **Section Anchor**: Inserted directly AFTER `<section class="hero-wrap" id="hero"></section>` and BEFORE `<section id="competitions">`.
    ```html
    <section id="about" class="ab-section">
      <div class="ab-container">
        <!-- Chronological builder journey & ethos -->
      </div>
    </section>
    ```
  - **Nav Link Anchor**: Inserted into `nav .nav-links` (after `#hero` link, before `#competitions` link):
    ```html
    <li><a href="#about" class="ab-nav-link">About</a></li>
    ```
    Also mirrors into `#mobileMenu`.
- **Schema Keys Read from `content.json`**:
  - `personal.name`
  - `personal.degree`
  - `personal.institution`
  - `personal.class_year`
  - `personal.bio_statement`
  - `hero.typewriter_phrases`
  - Milestones mapped chronologically from `competitions` & `ventures`:
    - June 2026: Builders' Bootcamp #1 Overall Top Team (7-day prototype sprint)
    - Sept 2026: DCRUST E-Summit 3rd Place Podium (45-min campaign prep)
    - Oct 2026: Ashoka Cash Rush 1st Place Champion & IIM Amritsar CINE-SELL Top 5 Finalist
    - Ongoing: Tathya research, Stratum simulation, Flow State build, Krama utility
- **Global JS Init Function**:
  ```javascript
  window.initAboutSection = function(content) { ... }
  ```
  - **Signature**: `(content?: object) => void`
  - Idempotent: If `#about` already exists, updates content without duplicating DOM nodes.
- **State Management & Interaction Contract**:
  - Staggered timeline milestone reveals hooked into `IntersectionObserver`.
  - In `prefers-reduced-motion: reduce`, all milestone cards are immediately rendered fully visible (`opacity: 1`, `transform: none`).

---

### Component 4: Case Study Deep Dives & Telemetry Modals
- **Target Phase**: Phase 3
- **Target HTML Mount Points**:
  1. **Trigger Buttons in Cards**: Inside each `<article class="case-card">` within `<section id="competitions">`.
     Inserted below `.case-telemetry-grid` or `.case-squad-row`:
     ```html
     <button class="cs-deepdive-btn" data-comp-id="cash-rush" aria-haspopup="dialog" aria-expanded="false">
       <span>Examine Unit Economics & Telemetry</span>
       <span class="cs-arrow" aria-hidden="true">↗</span>
     </button>
     ```
  2. **Modal Dialog Container**: Appended as the last child of `<body>` (or right inside `#competitions`):
     ```html
     <dialog id="cs-modal" class="cs-modal" aria-labelledby="cs-modal-title" aria-modal="true">
       <div class="cs-modal__backdrop"></div>
       <div class="cs-modal__window" role="document">
         <button class="cs-modal__close" aria-label="Close Case Study Details">✕</button>
         <div class="cs-modal__content" id="cs-modal-body"></div>
       </div>
     </dialog>
     ```
- **Schema Keys Read from `content.json`**:
  - `competitions[id].title`
  - `competitions[id].host`
  - `competitions[id].event`
  - `competitions[id].date`
  - `competitions[id].placement`
  - `competitions[id].tags`
  - `competitions[id].field_context`
  - `competitions[id].financials` (`starting_capital_inr`, `ending_fund_inr`, `multiplier`, `time_window_minutes`, `total_costs_inr`, `cost_items`, `service_breakdown`, `cash_prize_inr`)
  - `competitions[id].deliverables`
  - `competitions[id].team`
  - `competitions[id].story` (`setup`, `key_decision`, `result`, `takeaway`)
  - `competitions[id].proof` (`url`, `caption`, `stamp`, `additional_assets`)
- **Global JS Init Function**:
  ```javascript
  window.initCaseStudyDeepDives = function(content) { ... }
  ```
  - **Signature**: `(content?: object) => { open: (id: string) => void, close: () => void }`
- **State Management & Interaction Contract**:
  - **In-Memory State**:
    ```javascript
    window.__ACTIVE_CASE_STUDY = {
      currentId: null,
      previousActiveElement: null
    };
    ```
  - **Opening Protocol**:
    1. Saves `document.activeElement` to `previousActiveElement`.
    2. Renders telemetry tables and verified unit economics for selected competition into `#cs-modal-body`.
    3. Calls HTML5 `dialog.showModal()`.
    4. Adds `document.body.classList.add('cs-modal-open')` (locks body scrolling: `overflow: hidden`).
    5. Sets focus to `.cs-modal__close`.
  - **Closing Protocol**:
    1. Triggered on:
       - Close button click (`.cs-modal__close`).
       - Pressing `Escape` key.
       - Backdrop click outside `.cs-modal__window`.
    2. Calls `dialog.close()`.
    3. Removes `cs-modal-open` class from `document.body`.
    4. Sets `window.__ACTIVE_CASE_STUDY.currentId = null`.
    5. Returns focus to `previousActiveElement`.
  - **Keyboard Trap**:
    - Focus strictly trapped inside `.cs-modal__window` while open. `Tab` wraps around to first focusable element.
  - **Reduced Motion Gate**:
    - Zero scaling/opacity transition when `prefers-reduced-motion: reduce` is active.

---

### Component 5: Adaptive Canvas & FPS Telemetry
- **Target Phase**: Phase 1 / Performance
- **Target HTML Mount Point**:
  - Replaces or wraps existing `<canvas id="field"></canvas>`.
- **Schema Keys Read from `content.json`**: None (Hardware and visual engine).
- **Global JS Init Function**:
  ```javascript
  window.initAdaptiveCanvas = function() { ... }
  ```
  - **Signature**: `() => { pause: () => void, resume: () => void, getFPS: () => number, setReduced: (val: boolean) => void }`
- **State Management & Interaction Contract**:
  - **In-Memory State**:
    ```javascript
    window.__CANVAS_ENGINE = {
      fps: 60,
      active: true,
      reduced: false,
      deviceTier: 'high' // 'high' | 'medium' | 'low'
    };
    ```
  - **Reduced Motion Contract**:
    - Checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
    - If `true`, cancels `requestAnimationFrame` loop entirely.
    - Draws exactly ONE static low-opacity dot grid frame.
    - Hides `#glow` radial cursor spotlight.
  - **Tab Visibility Contract**:
    - Hooks `document.addEventListener('visibilitychange')`.
    - Halts loop when `document.hidden === true`.
  - **Adaptive Frame Budget**:
    - If measured FPS drops below 40 across 120 consecutive frames, downsizes resolution grid (columns drop from 80 to 44) to ensure no scroll jank.

---

## 4. Contract Verification Checklist for Agents

Before any agent marks its slice complete, it must verify against this matrix:

- [ ] **Data Integrity**: Does your component read exclusively from `content.json`? (No hardcoded competition figures or unverified claims).
- [ ] **Prefix Compliance**: Are all new CSS classes strictly prefixed (`.ab-`, `.cs-`, `.fr-`, `.rm-`, `.pf-`, `.seo-`)?
- [ ] **Variable Reuse**: Are all colors and fonts sourced from `:root` variables in `tokens.md`?
- [ ] **DOM Order**: Is the master section order strictly preserved?
- [ ] **Accessibility**: Does your component respond correctly to `Tab`, `Enter`, `Escape`, and `prefers-reduced-motion: reduce`?
- [ ] **Offline Readiness**: Does your component work cleanly if loaded via `file:///` without a live server?
