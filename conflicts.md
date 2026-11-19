# Fact Reconciliation & Discrepancy Audit (`conflicts.md`)

**Date:** November 17, 2026  
**Auditor:** Agent 1 (Architect)  
**Status:** Complete — Pending Site Owner Decisions  
**Target Repository:** `/Users/rudrasharma/Desktop/portfolio`

---

## 1. Executive Summary & Audit Scope

As part of the production-grade static build migration, a comprehensive multi-source audit was conducted across all representations of truth in the portfolio:
1. `content/content.json` (Canonical single source of truth)
2. `content.json` (Root legacy data file)
3. `index.v2.html` (Integrated single-file HTML & rendered DOM)
4. Embedded JSON payload (`<script id="portfolio-content-data">` and `window.__PORTFOLIO_CONTENT__`)
5. Embedded JSON-LD schema (`<script type="application/ld+json" class="seo-schema-script">`)
6. `index.html` (Original legacy v1 portfolio)

### Core Architectural Policy Enforced
- `content/content.json` is the **ONLY** source of facts.
- Never invent facts, metrics, quotes, or links. Unknown = `"TBD"` in JSON.
- The static build **FAILS** with exit code 1 if any literal `"TBD"` is rendered to a visible page.
- `"Verified"` badges only render when a valid, non-null `evidence_url` exists in JSON.
- **Rule of Non-Intervention**: Discrepancies and conflicting claims are **NOT** arbitrarily chosen or guessed by the AI agent; they are cataloged below for explicit site owner determination.

---

## 2. Master Discrepancy Matrix

| ID | Dimension | Canonical `content/content.json` | Rendered `index.v2.html` | Embedded JSON Payload | JSON-LD Schema | Severity / Owner Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CONF-01** | **Evidence URLs** | Present on 4 competitions & 3 ventures (`stratum`, `flow-state`, `krama`); `null` for `tathya` | Referenced in DOM links/images | **MISSING** (Key absent across all entities) | Included as image URLs | **High**: Embedded JSON lacked `evidence_url` properties. Synced in static generator. |
| **CONF-02** | **Visible "TBD" Rendered** | `competitions[2].team.members[1] = "TBD"` | **Line 5693 renders literal "Rudra Sharma, TBD"** | `"TBD"` in array | N/A | **Critical (Build Breaker)**: Build script filters out "TBD" teammates; Owner must provide 2nd teammate name. |
| **CONF-03** | **Telemetry Modal "TBD"** | Financial fields in non-cash competitions marked `"TBD"` | Telemetry modal JS renders `"₹TBD"` or `"TBD"` on click | `"TBD"` | N/A | **Critical (Build Breaker)**: Modal JS must suppress non-applicable financial fields instead of printing "TBD". |
| **CONF-04** | **Executive Bio Phrasing** | `bio_statement`: "Curiosity starts the work. Execution proves it..." | Line 4828: "Builder of software tools, local utilities, and early venture prototypes..." | Matches canonical `bio_statement` | Matches canonical `bio_statement` | **Medium**: Recruiter mode uses calibrated skeptic wording. Owner to decide if canonical JSON should adopt it. |
| **CONF-05** | **JSON-LD Schema Inventions** | Keys absent in JSON: no `jobTitle`, no `knowsAbout` | Not rendered in visible HTML | Not present | Injects `jobTitle: "Undergraduate Builder & CS Researcher"` and 6 `knowsAbout` topics | **Medium**: Schema generator invented fields not in `content.json`. Owner to approve schema extensions. |
| **CONF-06** | **Canonical Domain** | `meta.canonical_url = "https://YOUR-DOMAIN.com/"` | `<link rel="canonical" href="https://YOUR-DOMAIN.com/">` | `"https://YOUR-DOMAIN.com/"` | `"https://YOUR-DOMAIN.com/"` | **Medium**: Placeholder domain must be configured before production deployment. |
| **CONF-07** | **Venture Schema Typing** | Stratum: `status: "idea"` (Concept stage) | "Concept and pitch stage" | `status: "idea"` | Typed as `@type: "SoftwareApplication"` | **Low**: Stratum is not yet a deployed application. Owner to decide if Schema.org should type as `SoftwareApplication` or `ResearchProject`. |
| **CONF-08** | **Operating Margin Metric** | Ledger has raw numbers (₹300 seed, ₹45 costs, ₹2,400 revenue); no margin % | Line 4894: `(>98% margin)` derived from ₹45 cost vs ₹2,400 revenue | Raw numbers only | Raw numbers only | **Low**: Skeptic calibrated calculation. Owner to confirm whether `>98% margin` is officially adopted into JSON. |
| **CONF-09** | **Verified Quick Stats vs URLs** | `hero.stats[3]` has `verified: true` (Projects), but Tathya has `evidence_url: null` | Renders 4 stat cards; no per-card verified badge | `verified: true` | N/A | **Low**: Clarification needed on whether `hero.stats` verified flag is gated by collective evidence or individual URLs. |
| **CONF-10** | **Squad Names Unresolved** | `squad_name = "TBD"` for Cash Rush, Bootcamp, DCRUST; only CINE-SELL has `"Team Big 4"` | Cards display host/venue without squad name | `"TBD"` | N/A | **Low**: Owner to supply official team/squad names if desired. |
| **CONF-11** | **Social Handles & Location** | `github: "TBD"`, `twitter: "TBD"`, `location: "TBD"` | Omitted cleanly from contact section and recruiter drawer | `"TBD"` | Omitted from `sameAs` | **Low**: Handled safely (omitted). Owner to supply GitHub/Twitter usernames when ready. |
| **CONF-12** | **Non-Financial Competition Schema** | CINE-SELL and Builders' Bootcamp have `"TBD"` for seed fund, costs, multiplier | Omitted from card Pillar 03 | `"TBD"` | N/A | **Low**: Distinction between "Unknown" vs "Not Applicable" for non-trading competitions. |

---

## 3. Detailed Itemized Conflict Breakdown

### CONF-01: Evidence URLs Omission in Legacy Root `content.json` and Embedded Payloads
- **Discrepancy:**  
  `content/content.json` was updated to include explicit `evidence_url` fields for all competitions and ventures:
  - `competitions[0].evidence_url = "assets/cash-rush-ashoka.jpg"`
  - `competitions[1].evidence_url = "assets/cinesell-iim-amritsar.jpg"`
  - `competitions[2].evidence_url = "assets/builders-bootcamp-demo-day.jpg"`
  - `competitions[3].evidence_url = "assets/dcrust-podium-team.jpg"`
  - `ventures[0].evidence_url = null` (Tathya)
  - `ventures[1].evidence_url = "assets/stratum-preview.png"`
  - `ventures[2].evidence_url = "assets/flowstate-receipt.png"`
  - `ventures[3].evidence_url = "assets/krama-preview.jpg"`  
  However, the legacy root `content.json` and the embedded payload `<script id="portfolio-content-data">` inside `index.v2.html` completely lacked these 8 fields.
- **Architect Resolution:** The static build generator injects the complete, canonical `content/content.json` (including all `evidence_url` keys) directly into `<script id="portfolio-content-data">` and `window.__PORTFOLIO_CONTENT__`. Root `content.json` is synced.

---

### CONF-02: Visible Literal "TBD" in Builders' Bootcamp Squad
- **Discrepancy:**  
  In `index.v2.html` line 5693:
  ```html
  <span class="fr-squad-names">Rudra Sharma, TBD</span>
  ```
  `content/content.json` records:
  ```json
  "team": {
    "squad_name": "TBD",
    "size": "TBD",
    "members": ["Rudra Sharma", "TBD"]
  }
  ```
  Joining the array directly resulted in visible text displaying `"Rudra Sharma, TBD"`. This violates Portfolio Rule #2: *"Unknown = 'TBD' in JSON, and the build FAILS if any 'TBD' is rendered to a visible page."*
- **Owner Decision Needed:**
  - [ ] **Option A**: Provide the exact name of the second teammate (e.g., "Teammate Name").
  - [ ] **Option B**: Maintain "TBD" in JSON and allow generator to suppress unverified names, rendering only "Rudra Sharma".

---

### CONF-03: Modal Dialog Telemetry Rendering Literal "TBD"
- **Discrepancy:**  
  In `index.v2.html` lines 9920-9925:
  ```javascript
  '<div class="cs-telemetry-cell"><span class="cs-telemetry-lbl">Starting Capital</span><span class="cs-telemetry-val">' + (fin.starting_capital_inr !== 'TBD' ? '₹' + fin.starting_capital_inr : 'TBD') + '</span></div>'
  ```
  When clicking "Examine Unit Economics & Telemetry" on CINE-SELL or Builders' Bootcamp (which have no capital ledger), the dialog dynamically rendered literal `"TBD"` and `"₹TBD"`.
- **Architect Resolution:** The modal generator script is updated to conditionally omit non-applicable financial cells or render a clean descriptive state (e.g. "N/A — Marketing Strategy Arena") instead of literal `"TBD"`.

---

### CONF-04: Executive Bio Phrasing in Recruiter Mode vs Canonical Bio Statement
- **Discrepancy:**  
  In `content/content.json`:
  ```json
  "bio_statement": "Curiosity starts the work. Execution proves it. I build software systems, stress-test commercial models in competitive arenas, and develop ventures beyond the classroom."
  ```
  In `index.v2.html` Line 4828 (`#rm-summary-drawer .rm-header-desc`):
  ```html
  <p class="rm-header-desc">
    First-Year B.Tech CS &amp; Data Science at Rishihood University (Class of 2030). Builder of software tools, local utilities, and early venture prototypes with verified collegiate wins.
  </p>
  ```
  This text was adjusted during Phase 2 Skeptic Remediation (S1.1) to avoid over-claiming "production software systems".
- **Owner Decision Needed:**
  - [ ] **Option A**: Update `content/content.json` `personal.bio_statement` to align with the Skeptic-calibrated text.
  - [ ] **Option B**: Add a dedicated field `personal.executive_summary` in `content/content.json` for the Recruiter Mode drawer.
  - [ ] **Option C**: Revert Recruiter Mode drawer to match `personal.bio_statement` verbatim.

---

### CONF-05: Schema.org JSON-LD Uncanonical Metadata Inventions
- **Discrepancy:**  
  In `index.v2.html` `<script type="application/ld+json" class="seo-schema-script">`:
  - `jobTitle`: `"Undergraduate Builder & CS Researcher"` (Not in `content.json`)
  - `knowsAbout`: `["Computer Science", "Data Science", "Machine Learning & Dialect Evaluation", "Market Simulation Systems", "Offline-First Software Systems", "Venture Strategy"]` (Not in `content.json`)
  - WebSite `description`: `"Single source of truth for Rudra Sharma portfolio v2 upgrade: Evidence, Not Noise."` (`content.json` has `"Single source of truth for Rudra Sharma portfolio v2 upgrade."`)
- **Owner Decision Needed:**
  - [ ] **Option A**: Formally add `jobTitle` and `knowsAbout` into `content/content.json` schema under `personal`.
  - [ ] **Option B**: Strip `jobTitle` and `knowsAbout` from Schema generator, deriving all fields strictly from existing `current_status` and `ventures`.

---

### CONF-06: Production Canonical Domain Configuration
- **Discrepancy:**  
  Across `content.json`, HTML meta tags, and JSON-LD, the domain is specified as placeholder `https://YOUR-DOMAIN.com/`.
- **Owner Decision Needed:**
  - Specify the actual production domain (e.g., `https://rudras-portfolio.netlify.app` or `https://rudrasharma.me`) to finalize canonical tags.

---

### CONF-07: Venture Schema Typing for Concept-Stage Projects (Stratum)
- **Discrepancy:**  
  In JSON-LD, Stratum is typed as `@type: "SoftwareApplication"`, whereas `content/content.json` categorizes it as `status: "idea"` ("Concept and pitch stage · sandbox design in progress").
- **Owner Decision Needed:**
  - [ ] **Option A**: Keep `@type: "SoftwareApplication"` with applicationCategory `"BusinessApplication"`.
  - [ ] **Option B**: Change Schema type to `@type: "ResearchProject"` or `@type: "CreativeWork"` until deployed.

---

### CONF-08: Cash Rush Operating Margin Percentage Representation
- **Discrepancy:**  
  In `index.v2.html` line 4894: `"Total production cost: ₹45 against ₹2,400 revenue (>98% margin)."`.  
  In `content/content.json`, only the raw numbers exist (`starting_capital_inr: 300`, `total_costs_inr: 45`, `total_service_revenue_inr: 2400`, `ending_fund_inr: 2655`). The margin percentage `(2400 - 45) / 2400 = 98.125%` was computed dynamically.
- **Owner Decision Needed:**
  - [ ] **Option A**: Add `"operating_margin_percentage": 98.1` directly to `competitions[0].financials` in `content.json`.
  - [ ] **Option B**: Keep formula in generator to calculate margin from revenue and cost fields automatically.

---

### CONF-09: Verified Status for Software Projects Quick Stat
- **Discrepancy:**  
  In `content/content.json` `hero.stats[3]`:
  ```json
  {
    "id": "projects",
    "value": "04",
    "count": 4,
    "label": "Projects",
    "description": "Tathya · Stratum · Flow State · Krama",
    "verified": true
  }
  ```
  However, Tathya has `evidence_url = null`. Under Portfolio Rule #3, `"Verified" badges only render when an evidence_url exists in JSON`.
- **Owner Decision Needed:**
  - [ ] **Option A**: Set `hero.stats[3].verified = false` until Tathya has a verified proof asset.
  - [ ] **Option B**: Maintain `verified = true` as a stat-strip flag, but gate individual project badges strictly on `evidence_url`.

---

### CONF-10: Unresolved Squad Names for Winning Competitions
- **Discrepancy:**  
  - Cash Rush (`competitions[0]`): `team.squad_name = "TBD"` (Teammates: Rudra Sharma, Raj Khatri, Sahaj Choukhani, Tripti Kaushik)
  - Builders' Bootcamp (`competitions[2]`): `team.squad_name = "TBD"`
  - DCRUST Murthal (`competitions[3]`): `team.squad_name = "TBD"` (Teammates: Rudra Sharma, Raj Khatri, Sahaj Choukhani, Tripti Kaushik)
- **Owner Decision Needed:**
  - Provide squad names if official team names existed, or confirm leaving squad names unrendered.

---

### CONF-11: Social Handles & Personal Location
- **Discrepancy:**  
  - `personal.github = "TBD"`
  - `personal.twitter = "TBD"`
  - `personal.location = "TBD"`
  Currently, these fields are omitted from rendered pages to comply with the zero-TBD rule.
- **Owner Decision Needed:**
  - Provide GitHub and Twitter profile URLs and city/location when ready to make them public.

---

## 4. Next Steps & Static Generator Behavior

During the initial static build:
1. **Zero-TBD Rule Enforcement**: Any item with `"TBD"` is automatically omitted from visible page rendering (no broken tags or placeholder text). If any visible DOM element displays literal `"TBD"`, the build process immediately terminates with exit code 1.
2. **Evidence URL Gating**: Every "Verified" badge or credential label is programmatically gated on `Boolean(item.evidence_url)`.
3. **Synchronization**: `npm run build` generates `dist/index.html` and synchronizes the canonical output with root `index.html` and `index.v2.html`.
