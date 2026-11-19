# ADVERSARIAL BREAKER AUDIT REPORT (v2.0)
**Document**: Automated Browser Penetration & Stress-Test Audit  
**Target**: `/Users/rudrasharma/Desktop/portfolio/index.v2.html`  
**Test Engine**: Google Chrome Headless (`v150.0.7871.187`) via Chrome DevTools Protocol (CDP) WebSocket & Node.js (`v26.12.0`)  
**Auditor**: Breaker Agent (Phase 2 Swarm)  
**Date**: November 17, 2026  

---

## 1. Executive Summary & Audit Scorecard

An aggressive, automated browser stress-test was conducted on `index.v2.html` across 5 core dimensions:
1. Keyboard-Only Navigation & Modal Focus Management
2. Ultra-Narrow Viewport (320px & 375px) Layout Integrity
3. Reduced Motion Compliance (`prefers-reduced-motion: reduce`)
4. JavaScript-Disabled / No-JS Fallback Rendering
5. Network Resilience, Offline Protocol (`file:///`), and Console Telemetry

### Overall Breaker Scorecard

| Test Dimension | Status | Pass / Total Tests | Critical Vulnerabilities |
| :--- | :---: | :---: | :--- |
| **1. Keyboard Navigation** | **PASS** | 12 / 12 | 0 Critical Bugs (Zero focus ring omissions, clean Escape restore, strict modal focus trapping) |
| **2. Ultra-Narrow Viewport (320px)** | **FAIL** | 4 / 8 | **2 Critical Overflow Bugs** (Pre-formatted terminal in ventures causing 638px blowout; un-wrapped email causing 411px blowout in Contact) |
| **3. Reduced Motion** | **WARN** | 6 / 7 | 1 Minor Usability Bug (Canvas stops cleanly, reveals render statically, but `.typed-cursor` keeps infinite blinking animation) |
| **4. JS-Disabled Fallback** | **FAIL** | 2 / 5 | **1 Critical Invisibility Bug** (No `<noscript>` style override; all 23 `.reveal` elements remain permanently invisible at `opacity: 0`) |
| **5. Network & Offline Resilience** | **PASS** | 9 / 10 | 0 Console Errors, 0 Uncaught Exceptions, 100% Local Disk Assets Present; 1 Empty `src=""` on closed lightbox |

---

## 2. Test Environment & Harness Architecture

Automated testing was executed directly against headless Google Chrome using native WebSocket connections to the Chrome DevTools Protocol (CDP). No third-party wrapper libraries were utilized.

- **Browser Executable**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **User Agent**: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.187 Safari/537.36`
- **Protocol Evaluated**: Direct filesystem protocol: `file:///Users/rudrasharma/Desktop/portfolio/index.v2.html`
- **Test Harness Directory**: `/Users/rudrasharma/Desktop/portfolio/breaker_tests/`
  - `cdp_client.js`: Asynchronous Promise-based CDP WebSocket wrapper.
  - `test_keyboard.js`: Tab sequence, focus indicators, modal trapping, drawer keyboard toggles.
  - `test_viewport.js`: Emulated 320x568 and 375x667 layouts, DOM element horizontal protrusion detection, touch targets (WCAG 2.5.5 / 2.5.8), typography legibility.
  - `test_reduced_motion.js`: Emulated `prefers-reduced-motion: reduce`, canvas loop cancellation, static reveal evaluation, typewriter behavior.
  - `test_no_js.js`: `Emulation.setScriptExecutionDisabled({ value: true })`, `<noscript>` audit, fallback stat integrity, content visibility.
  - `test_network_offline.js`: Console log listeners, uncaught exception listeners, network request tracker, disk asset validator.

---

## 3. Dimension 1: Keyboard-Only Navigation & Focus Management

### Test Protocol
1. **Sequential Tab Navigation**: 120 sequential `Tab` and `Shift+Tab` key dispatches from document body to footer.
2. **Focus Indicator Contrast**: Computed style audit of `outlineStyle`, `outlineWidth`, `outlineColor`, and `boxShadow` on every active element.
3. **Recruiter Mode Keyboard Toggle**: `Enter` and `Space` activation on `#rm-toggle`; `Escape` dismissal from inside `#rm-summary-drawer` verifying focus restoration.
4. **Venture Deep-Dive Accordions**: `Enter`, `Space`, and `Escape` toggle tests on `#cs-trigger-tathya`, `#cs-trigger-stratum`, `#cs-trigger-flow-state`, `#cs-trigger-krama`.
5. **Telemetry Modal (`#cs-modal`)**: Open via `.cs-deepdive-btn`, Tab-trapping verification across 12 cycles, `Escape` key close and trigger focus restoration.
6. **Field Record Lightbox (`#fr-lightbox`)**: Open via `.fr-inspect-btn`, Tab-trapping verification across 8 cycles, `Escape` key close and trigger focus restoration.

### Results & Findings
- **Total Focusable Elements Discovered**: 120 elements reachable in logical top-to-bottom DOM order.
- **Focus Ring Integrity**: **0 missing focus rings**. Every focusable element maintains high-contrast focus rings (`var(--accent)` 2px outline or box-shadow ring).
- **Recruiter Mode Toggle**:
  - `Enter` on `#rm-toggle`: Opens drawer (`hidden: false`, `aria-hidden: "false"`, `body.rm-mode-active`).
  - `Tab` into drawer: Moves focus directly to `#rm-resume-link`.
  - `Escape` key inside drawer: Instantly collapses drawer (`hidden: true`, `aria-hidden: "true"`, `body.rm-mode-active` removed) and returns active focus to `#rm-toggle`.
  - `Space` key on `#rm-toggle`: Cleanly toggles open/close state.
- **Venture Accordions**:
  - `Enter`/`Space` expands the respective drawer (`aria-expanded: "true"`, drawer display: `grid`).
  - `Escape` collapses drawer (`aria-expanded: "false"`) and retains focus on trigger button.
- **Modal Dialog Focus Trapping (`#cs-modal`)**:
  - Opening `.cs-deepdive-btn` shifts focus directly to `#cs-modal-close`.
  - 12 sequential Tab key presses confirmed focus **never escapes** `#cs-modal`, cycling exclusively between `.cs-modal__close` and interactive buttons inside `.cs-modal__content`.
  - Pressing `Escape` invokes `dialog.close()`, unlocks `body.cs-modal-open`, and returns focus directly to the opening `.cs-deepdive-btn`.
- **Lightbox Dialog Focus Trapping (`#fr-lightbox`)**:
  - Opening `.fr-inspect-btn` shifts focus to `#fr-lightbox-close`.
  - 8 sequential Tab presses confirmed focus remains strictly inside `#fr-lightbox`.
  - Pressing `Escape` closes lightbox and restores focus to `.fr-inspect-btn`.

---

## 4. Dimension 2: Ultra-Narrow Viewport (320px) & Touch Targets

### Test Protocol
Emulated viewports:
- **Ultra-Narrow Compact Mobile**: `320px x 568px` (iPhone SE 1st gen / compact Android)
- **Standard Mobile**: `375px x 667px` (iPhone 8 / SE 2nd gen)
Measurements:
- `document.documentElement.scrollWidth` vs `window.innerWidth`
- Deep DOM scan for any element where `rect.right > innerWidth + 1.0px`
- Touch target bounding rect measurements against WCAG 2.5.5 (44x44px target size)

### Critical Failures Found

#### Bug 2.1: Pre-Formatted Terminal in Venture Cards Blows Out Mobile Viewport to 638px
- **Severity**: **CRITICAL (Breaks mobile layout)**
- **Location**: `.ventures-grid` / `.venture-card` / `.term pre.term-body` (Lines 1276–1280, 1370–1377, 5979, 6109, 6239, 6373)
- **Observed Behavior**:
  - In `index.v2.html`, `.ventures-grid` has `grid-template-columns: repeat(2, 1fr);` (and `grid-template-columns: 1fr;` at `@media (max-width: 960px)`).
  - CSS Grid items have a default `min-width: auto` (which resolves to `min-content`).
  - Inside each `.venture-card`, the simulated terminal preview `<pre class="term-body">` contains code with `white-space: pre` (e.g., `$ tathya eval --lang haryanvi --set gov-schemes`).
  - This single-line pre element has a min-content width of **570px**.
  - As a result, `.venture-card` cannot shrink below 570px + 64px padding = **638.2px**!
  - This forces `.ventures-grid` and `main.page-spine` to stretch to **638px**, generating **318px of horizontal scroll spill** on a 320px device!
- **Remediation**:
  Add `min-width: 0;` to `.venture-card` and change the responsive grid definition:
  ```css
  .ventures-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  }
  .venture-card {
    min-width: 0; /* Prevents pre.term-body from blowing out grid column */
  }
  .term-body {
    overflow-x: auto;
    max-width: 100%;
  }
  ```

#### Bug 2.2: Institutional Email Address Blows Out Contact Section to 411px
- **Severity**: **HIGH (Horizontal scrolling on 320px screens)**
- **Location**: `#contact .contact-card .channel-box #emailVal` (Lines 1474–1510, 6867–6873)
- **Observed Behavior**:
  - The contact channel displays `rudra.s26042@csds.rishihood.edu.in` (38 characters in monospace font `JetBrains Mono` at `12.5px`).
  - The text string alone requires 285px.
  - `.channel-box` applies `padding: 14px 18px` (36px total) and contains a peer element `[COPY]` (55px).
  - `.channel-box` has `display: flex; justify-content: space-between; align-items: center;` without `flex-wrap: wrap`.
  - Neither `.channel-box` nor `.info-val` has `overflow-wrap: anywhere` or `word-break: break-all`.
  - Consequently, `.channel-box` is forced to a minimum width of **388px**, stretching `.contact-card` to **410px**.
  - On a 320px screen (where container width is 272px), this causes **138px of horizontal overflow**!
- **Remediation**:
  ```css
  .channel-box .info-val {
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  @media (max-width: 480px) {
    .channel-box {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
  ```

#### Bug 2.3: Hero Meta Pill Inline-Flex Width Exceeds 320px Viewport Margin
- **Severity**: **MEDIUM**
- **Location**: `.hero-meta-pill` (Lines 657–670, 4661–4664)
- **Observed Behavior**:
  - Text: `First-Year B.Tech CS & Data Science · Builder · Rishihood '30`
  - Style: `display: inline-flex; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 14px;`
  - Total rendered width: **388px**.
  - On a 320px viewport with 24px padding (272px container), the pill protrudes past the screen edge unless flex wrapping is enabled.
- **Remediation**:
  ```css
  .hero-meta-pill {
    flex-wrap: wrap;
    max-width: 100%;
    line-height: 1.5;
  }
  ```

### Touch Targets Audit (WCAG 2.5.5 / 2.5.8)
Out of 41 evaluated interactive controls on mobile:
- **Passing (>= 44x44px)**: 19 targets
- **Below 44x44px Threshold**: 22 targets
  - `button#burger`: **27px x 20px** (Primary mobile menu button should have a touch bounding target of at least 44x44px).
  - `button.fr-inspect-btn`: **143px x 28px** (Height 28px < 44px).
  - `a.fr-direct-link`: **90px x 17px** (Height 17px < 44px).
  - `button.filter-btn`: **157px x 34px** (Height 34px < 44px).
  - `button.fr-gallery-thumb`: **58px x 42px** (Height 42px is near 44px, easily fixable).

---

## 5. Dimension 3: Reduced Motion (`prefers-reduced-motion: reduce`)

### Test Protocol
CDP emulation via:
```javascript
await client.send('Emulation.setEmulatedMedia', {
  media: 'screen',
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
});
```

### Results & Findings
- **Media Query Match**: `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`
- **Canvas Engine State**:
  - `window.__CANVAS_ENGINE.active === false` (rAF animation loop successfully terminated).
  - `window.__CANVAS_ENGINE.reduced === true` (Static fallback dot grid drawn once).
  - `#glow` radial cursor light: `pf-glow-hidden` added, `display: none` applied.
- **Staggered Reveals & Milestone Cards**:
  - **32 / 32 elements** statically visible (`opacity: 1`, `transform: none`). Zero elements stuck waiting for scroll or intersection observation.
- **CSS Transitions**:
  - Audit of `#rm-summary-drawer`, `.cs-drawer`, `#cs-modal`, `#fr-lightbox`, `.nav-wrap`, `.reveal`, `.stat-card` confirmed transition duration reduced to `1e-05s` (0.00001s) or `0s`.
- **Typewriter Prompt**:
  - Full static phrase `researching how llms fail on punjabi, haryanvi & bhojpuri` rendered immediately. No character-by-character typing loop.
- **Vulnerability Found (Minor)**:
  - `.typed-cursor` continues executing its infinite CSS keyframe animation:
    `animation: blinkCursor 1.1s step-start infinite;`
  - Under `prefers-reduced-motion: reduce`, all non-essential blinking should be paused:
    ```css
    @media (prefers-reduced-motion: reduce) {
      .typed-cursor {
        animation: none !important;
        opacity: 1 !important;
      }
    }
    ```

---

## 6. Dimension 4: JavaScript-Disabled / No-JS Fallback

### Test Protocol
CDP emulation via:
```javascript
await client.send('Emulation.setScriptExecutionDisabled', { value: true });
```
Page reloaded and DOM rendered without executing any client-side JavaScript.

### Critical Failures Found

#### Bug 4.1: Entire Portfolio Content Stuck at `opacity: 0` Without JavaScript
- **Severity**: **CRITICAL (Page unreadable if JS disabled or fails)**
- **Location**: `.reveal` CSS rule (Lines 636–642, `index.v2.html`)
- **Observed Behavior**:
  - The CSS defines `.reveal` as:
    ```css
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal.in {
      opacity: 1;
      transform: none;
    }
    ```
  - The `.in` class is appended dynamically at runtime via `IntersectionObserver` in JavaScript.
  - In `index.v2.html`, there is **zero `<noscript>` tag anywhere in the document**.
  - When JavaScript is disabled:
    - `totalReveals: 23`
    - `visibleCount: 0`
    - `hiddenCount: 23`
    - All 23 key elements—including the hero headline (`h1.hero-headline`), the hero bio statement, the count-up stat cards, the competition cards, and venture cards—**remain permanently transparent at `opacity: 0`**!
- **Remediation**:
  Add an immediate `<noscript>` block inside `<head>`:
  ```html
  <noscript>
    <style>
      .reveal, .stat-card, .ab-milestone-card, .case-card, .venture-card {
        opacity: 1 !important;
        transform: none !important;
      }
      .pf-canvas-layer, #glow {
        display: none !important;
      }
    </style>
  </noscript>
  ```

#### Fallback Verification (Passed)
- Initial hardcoded HTML values for count-up stats rendered correctly:
  - `02` Championships
  - `TOP 5` National Finalist
  - `03` Podiums
  - `04` Projects
  No blank values or `0` placeholders were exposed.
- Sections `#about`, `#competitions`, `#ventures`, `#contact` exist in semantic HTML order.

---

## 7. Dimension 5: Network Resilience, Offline & `file://` Testing

### Test Protocol
Navigated to `file:///Users/rudrasharma/Desktop/portfolio/index.v2.html` and monitored CDP `Network` and `Runtime` events.

### Results & Findings
- **Console Errors**: **0 console errors** (`results.consoleErrors = []`).
- **Uncaught Exceptions**: **0 exceptions thrown** (`results.uncaughtExceptions = []`).
- **Console Warnings**: **0 warnings** (`results.consoleWarnings = []`).
- **Disk Asset Validation**: **0 missing assets**. All 30 image/PDF paths referenced in the document exist and resolve on disk.
- **Offline / `file://` Data Fallback**:
  - Modern Chromium blocks `fetch('content.json')` over the `file:///` protocol due to origin null CORS restrictions.
  - `index.v2.html` flawlessly executed the offline fallback contract:
    - Global constant `window.__PORTFOLIO_CONTENT__` loaded synchronously.
    - Synchronous script payload `<script id="portfolio-content-data" type="application/json">` parsed with 100% data integrity.
    - Component init functions gracefully fell back without raising network errors.
- **Vulnerability Found (Minor)**:
  - `<img class="fr-lightbox-img" id="fr-lightbox-img" src="" alt="Full resolution evidence photo">` (Line 5933) initializes with `src=""`.
  - While harmless in standard browsing, empty `src` attributes cause DevTools to flag a broken image asset upon initial load.
  - **Remediation**: Initialize with a lightweight inline transparent placeholder:
    ```html
    <img class="fr-lightbox-img" id="fr-lightbox-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/1svg%3E" alt="Full resolution evidence photo">
    ```

---

## 8. Summary of Breaker Defects & Action Plan for Phase 3 Fixers

| Defect ID | Category | Severity | File / Component | Brief Description |
| :--- | :--- | :---: | :--- | :--- |
| **BRK-01** | Viewport 320px | **CRITICAL** | `index.v2.html` (Ventures Grid) | `pre.term-body` with `white-space: pre` expands `.venture-card` to 638px due to grid item `min-width: auto`. Needs `min-width: 0` on card. |
| **BRK-02** | Viewport 320px | **CRITICAL** | `index.v2.html` (Contact Channels) | Email `rudra.s26042@csds.rishihood.edu.in` inside flex container lacks word-break, blowing out `#contact` to 411px. Needs `word-break: break-word` and mobile flex-wrap. |
| **BRK-03** | No-JS Fallback | **CRITICAL** | `index.v2.html` (`<head>`) | Missing `<noscript>` style block. All 23 `.reveal` elements remain permanently invisible at `opacity: 0` if JS fails. |
| **BRK-04** | Viewport 320px | **MEDIUM** | `index.v2.html` (Hero Meta Pill) | `.hero-meta-pill` inline-flex takes 388px on 320px screen. Needs `flex-wrap: wrap; max-width: 100%`. |
| **BRK-05** | Accessibility | **MEDIUM** | `index.v2.html` (Mobile Burger & Buttons) | `button#burger` target size is 27x20px (< 44x44px). Needs `padding` / min-height expansion to satisfy WCAG 2.5.5. |
| **BRK-06** | Reduced Motion | **LOW** | `index.v2.html` (Typewriter Cursor) | `.typed-cursor` continues infinite blinking under reduced motion. Needs `animation: none; opacity: 1;`. |
| **BRK-07** | DOM Hygiene | **LOW** | `index.v2.html` (`#fr-lightbox`) | `<img id="fr-lightbox-img" src="">` has empty src on page load. Needs transparent SVG data URI. |

---

## 9. Test Artifacts Reference
All automated test scripts and raw JSON telemetry outputs are persisted on disk for instant reproduction:
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/cdp_client.js`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/test_keyboard.js`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/test_viewport.js`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/test_reduced_motion.js`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/test_no_js.js`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/test_network_offline.js`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/keyboard_results.json`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/viewport_results.json`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/reduced_motion_results.json`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/no_js_results.json`
- `/Users/rudrasharma/Desktop/portfolio/breaker_tests/network_offline_results.json`
