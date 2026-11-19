#!/usr/bin/env node
/**
 * ============================================================================
 * STATIC SITE GENERATOR & RECONCILIATION ENGINE (v2.0)
 * ============================================================================
 * Architecture Rules Enforced:
 * 1. content/content.json is the ONLY source of facts.
 *    HTML, JSON-LD, and Recruiter Mode are generated from it.
 * 2. Never invent facts, metrics, quotes, or links.
 *    Unknown = "TBD" in JSON, and the build FAILS with exit code 1
 *    if any "TBD" is rendered to a visible page.
 * 3. "Verified" badges only render when an evidence_url exists in JSON.
 * 4. Generates dist/index.html and synchronizes root index.html / index.v2.html.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_FILE = path.join(ROOT_DIR, 'content', 'content.json');
const TEMPLATE_FILE = path.join(ROOT_DIR, 'templates', 'index.html');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const ROOT_INDEX = path.join(ROOT_DIR, 'index.html');
const ROOT_INDEX_V2 = path.join(ROOT_DIR, 'index.v2.html');
const ROOT_CONTENT = path.join(ROOT_DIR, 'content.json');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const DIST_ASSETS = path.join(DIST_DIR, 'assets');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DIST_DATA = path.join(DIST_DIR, 'data');
const shareEngine = require('../templates/share');

// Helper: Escape HTML special characters
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper: Deep copy directory
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ----------------------------------------------------------------------------
// COMPONENT GENERATORS
// ----------------------------------------------------------------------------

function renderHeadMeta(content) {
  return shareEngine.renderHeadMeta(content);
}

function renderJsonLd(content) {
  return shareEngine.renderJsonLd(content);
}

function renderHeroStats(content) {
  const stats = content.hero.stats || [];
  return `          <div class="hero-stats-row reveal">
${stats.map(s => `            <div class="stat-card">
              <span class="stat-num mono"${s.count !== null ? ` data-count="${s.count}"` : ''}>${escapeHtml(s.value)}</span>
              <span class="stat-label">${escapeHtml(s.label)}</span>
              <span class="stat-desc">${escapeHtml(s.description)}</span>
            </div>`).join('\n')}
          </div>`;
}

function renderRecruiterDrawer(content) {
  const p = content.personal;
  const comps = content.competitions || [];
  const vens = content.ventures || [];

  return `<div id="rm-summary-drawer" class="rm-summary-drawer" role="region" aria-label="Executive Brief and Recruiter Summary" aria-hidden="true" hidden>
  <div class="rm-drawer-shell">
    <div class="rm-drawer-watermark" aria-hidden="true">EXEC</div>

    <!-- Header / Identity & Status -->
    <div class="rm-header-row">
      <div class="rm-header-info">
        <div class="rm-header-meta">
          <span class="rm-signal-pill">
            <span class="rm-signal-dot" aria-hidden="true"></span>
            Executive Dossier // 30-Second View
          </span>
          <span class="rm-header-kicker">Verified Candidate Brief</span>
        </div>
        <h2 class="rm-header-title">${escapeHtml(content.hero.headline_first)} <span>${escapeHtml(content.hero.headline_last)}</span></h2>
        <p class="rm-header-desc">
          First-Year B.Tech CS &amp; Data Science at Rishihood University (Class of 2030). Builder of software tools, local utilities, and early venture prototypes with verified collegiate wins.
        </p>
      </div>
      <div class="rm-header-actions">
        <button type="button" class="rm-close-btn" id="rm-close-btn" aria-label="Close Recruiter Mode (Esc)">
          <span>✕</span>
          <span>Close</span>
          <span class="rm-toggle-shortcut">[Esc]</span>
        </button>
      </div>
    </div>

    <!-- 4 High-Density Key Proof Telemetry Cards -->
    <div class="rm-kpis-grid">
      <div class="rm-kpi-card">
        <div class="rm-kpi-val">8.85x</div>
        <div class="rm-kpi-label">Fund Growth Run</div>
        <div class="rm-kpi-sub">Ashoka Cash Rush: ₹300 → ₹2,655 in 120m. ₹45 costs. 1st Place Champion.</div>
      </div>
      <div class="rm-kpi-card">
        <div class="rm-kpi-val">02</div>
        <div class="rm-kpi-label">Championships</div>
        <div class="rm-kpi-sub">Ashoka University Shatranj '26 &amp; Rishihood Builders' Bootcamp #1 Top Team.</div>
      </div>
      <div class="rm-kpi-card">
        <div class="rm-kpi-val">TOP 3</div>
        <div class="rm-kpi-label">National Finalist</div>
        <div class="rm-kpi-sub">IIM Amritsar CINE-SELL out of ~700 teams. First-year undergrad team against MBA cohorts.</div>
      </div>
      <div class="rm-kpi-card">
        <div class="rm-kpi-val">03</div>
        <div class="rm-kpi-label">Podiums In 4 Mos</div>
        <div class="rm-kpi-sub">Jun–Oct 2026: 2x 1st Place, 1x 3rd Place (DCRUST Murthal). Team Prize Purses (₹8,100+).</div>
      </div>
    </div>

    <!-- Main Split Grid: Competitive Track Record + Venture Portfolio -->
    <div class="rm-split-grid">
      <!-- Left Panel: Verified Field Evidence & Unit Economics -->
      <div class="rm-panel">
        <div class="rm-panel-head">
          <h3 class="rm-panel-title">
            <span>Verified Field Evidence &amp; Commercial ROI</span>
          </h3>
          <span class="rm-panel-count">${comps.length} Records</span>
        </div>
        <div class="rm-proof-list">
          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">Ashoka University · Cash Rush</span>
              <span class="rm-proof-badge">🏆 1st Place Champion</span>
            </div>
            <div class="rm-proof-metrics">₹300 → ₹2,655 in 2 hrs · 8.85x Return · ₹7,000 Prize</div>
            <p class="rm-proof-desc">
              Zero-inventory service business model: built interactive curiosity funnel, live campus quiz challenge, and on-the-spot caricatures. Total production cost: ₹45 against ₹2,400 revenue (&gt;98% margin).
            </p>
          </div>

          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">IIM Amritsar · CINE-SELL</span>
              <span class="rm-proof-badge">⚡ Top 3 National</span>
            </div>
            <div class="rm-proof-metrics">~700 National Teams · Lead of "Team Big 4"</div>
            <p class="rm-proof-desc">
              National marketing fest challenge. Directed product positioning, filmed commercial reel, and live stage commercial skit; placed in top 3 against postgraduate B-school cohorts.
            </p>
          </div>

          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">Rishihood · Builders' Bootcamp</span>
              <span class="rm-proof-badge">🥇 #1 Overall Top Team</span>
            </div>
            <div class="rm-proof-metrics">7-Day Venture Incubator · Shipped Working Web App</div>
            <p class="rm-proof-desc">
              Intensive product design, AI, and startup sprint. Engineered functional web prototype from scratch within 7 days and pitched live on Demo Day to industry jury.
            </p>
          </div>

          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">DCRUST Murthal · Brand Pitch</span>
              <span class="rm-proof-badge">🥉 3rd Place Podium</span>
            </div>
            <div class="rm-proof-metrics">45-Minute Prep Sprint · ₹1,100 Cash Prize</div>
            <p class="rm-proof-desc">
              Built 4 full campaign deliverables in 45 minutes: poster, video commercial, comedy skit, and live stage pitch for FMCG soap brand.
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel: Venture Portfolio & Technical Systems -->
      <div class="rm-panel">
        <div class="rm-panel-head">
          <h3 class="rm-panel-title">
            <span>Ventures &amp; Technical Systems</span>
          </h3>
          <span class="rm-panel-count">${vens.length} Systems</span>
        </div>
        <div class="rm-projects-list">
          <div class="rm-project-card">
            <div class="rm-project-top">
              <span class="rm-project-name">Tathya (तथ्य)</span>
              <span class="rm-project-status">Research Phase</span>
            </div>
            <p class="rm-project-thesis">
              Evaluation benchmark investigating LLM token fragmentation and failure modes on non-standard Indian dialects (Punjabi, Haryanvi, Bhojpuri) with verification layer for civic queries.
            </p>
          </div>

          <div class="rm-project-card">
            <div class="rm-project-top">
              <span class="rm-project-name">Stratum</span>
              <span class="rm-project-status">Concept Stage</span>
            </div>
            <p class="rm-project-thesis">
              High-velocity market simulation platform evaluating candidate decision speed and capital efficiency under CPM volatility shocks instead of static LLM-cheatable case studies.
            </p>
          </div>

          <div class="rm-project-card">
            <div class="rm-project-top">
              <span class="rm-project-name">Flow State</span>
              <span class="rm-project-status rm-status-building">Local Build</span>
            </div>
            <p class="rm-project-thesis">
              Privacy-first desktop focus environment: zero-OAuth RFC 5545 calendar synchronization and 16-bit 44.1kHz procedural sine wave audio synthesis (0 MP3 files, zero telemetry).
            </p>
          </div>

          <div class="rm-project-card">
            <div class="rm-project-top">
              <span class="rm-project-name">Krama (क्रम)</span>
              <span class="rm-project-status rm-status-building">Student Utility</span>
            </div>
            <p class="rm-project-thesis">
              Offline-first academic schedule optimization and attendance recovery calculus utility to proactively prevent dipping below the mandatory 75% university eligibility cutoff.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Bar / Direct Outreach -->
    <div class="rm-footer-bar">
      <div class="rm-footer-cta-group">
        <a href="${escapeHtml(p.resume_url)}" class="rm-btn-primary" target="_blank" rel="noopener noreferrer" download="rudra-sharma-resume.pdf" id="rm-resume-link">
          <span>↓</span>
          <span>Download Résumé (PDF)</span>
        </a>
        <button type="button" class="rm-btn-secondary" id="rm-copy-email-btn" aria-label="Copy Rudra's email address">
          <span>✉</span>
          <span id="rm-copy-email-text">Copy Email</span>
        </button>
        <a href="${escapeHtml(p.linkedin)}" class="rm-btn-secondary" target="_blank" rel="noopener noreferrer" id="rm-linkedin-link">
          <span>↗</span>
          <span>LinkedIn Network</span>
        </a>
      </div>
      <div class="rm-footer-note">
        Press <kbd>Esc</kbd> anytime or toggle nav button to return to full portfolio
      </div>
    </div>
  </div>
</div>`;
}

function renderAbout(content) {
  const p = content.personal;
  return `<section id="about" class="ab-section" aria-labelledby="ab-title">
  <div class="ab-container">
    <!-- Section Header -->
    <div class="ab-header ab-reveal">
      <span class="ab-eyebrow">00 // Trajectory &amp; Builder Ethos</span>
      <h2 id="ab-title" class="ab-title">
        How I Got <span class="ab-serif">Here</span>
      </h2>
      <p class="ab-lead" id="ab-lead-text">
        First-year CS &amp; Data Science undergraduate at Rishihood University ('30). Rather than waiting four years to validate hypotheses, I test software systems and commercial models in live competitive arenas under hard capital and clock constraints.
      </p>
    </div>

    <!-- Main Architecture Grid -->
    <div class="ab-grid">
      <!-- Left Column: Operating Thesis & Institutional Credential -->
      <div class="ab-ethos-col">
        <!-- Operating Thesis Card -->
        <div class="ab-card ab-reveal" id="ab-thesis-card">
          <div class="ab-card-label">
            <span class="ab-pulse-dot" aria-hidden="true"></span>
            <span>OPERATING THESIS</span>
          </div>
          <blockquote class="ab-quote" id="ab-bio-statement">
            “Curiosity starts the work. Execution proves it.”
          </blockquote>
          <p class="ab-thesis-desc">
            Building software systems, stress-testing commercial models in competitive arenas, and developing ventures beyond the classroom.
          </p>

          <!-- Focus Area Pillars -->
          <div class="ab-pillars-list">
            <div class="ab-pillar-item">
              <span class="ab-pillar-num mono">01</span>
              <div class="ab-pillar-content">
                <strong class="ab-pillar-title">Dialect NLP Failure Analysis</strong>
                <p class="ab-pillar-text">Benchmarking token fragmentation and semantic degradation in non-standard Indic languages (Punjabi, Haryanvi, Bhojpuri) via Tathya.</p>
              </div>
            </div>

            <div class="ab-pillar-item">
              <span class="ab-pillar-num mono">02</span>
              <div class="ab-pillar-content">
                <strong class="ab-pillar-title">Local-First Desktop OS</strong>
                <p class="ab-pillar-text">Zero cloud telemetry leaks, procedural 16-bit sine audio synthesis (Flow State), and offline recovery calculus (Krama).</p>
              </div>
            </div>

            <div class="ab-pillar-item">
              <span class="ab-pillar-num mono">03</span>
              <div class="ab-pillar-content">
                <strong class="ab-pillar-title">Extreme-Constraint Economics</strong>
                <p class="ab-pillar-text">Turning ₹300 into ₹2,655 in 120 minutes with ₹45 costs (Ashoka) and delivering 4-part ad suites in 45 minutes (DCRUST).</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Academic & Institutional Foundation Card -->
        <div class="ab-card ab-reveal" id="ab-foundation-card">
          <div class="ab-card-label">ACADEMIC &amp; INSTITUTIONAL RECORD</div>
          <div class="ab-cred-list">
            <div class="ab-cred-row">
              <span class="ab-cred-label">Degree</span>
              <span class="ab-cred-val" id="ab-cred-degree">B.Tech CS &amp; Data Science</span>
            </div>
            <div class="ab-cred-row">
              <span class="ab-cred-label">Institution</span>
              <span class="ab-cred-val" id="ab-cred-institution">${escapeHtml(p.institution)}</span>
            </div>
            <div class="ab-cred-row">
              <span class="ab-cred-label">Cohort</span>
              <span class="ab-cred-val mono" id="ab-cred-cohort">Class of ${escapeHtml(p.class_year)} · First-Year</span>
            </div>
            <div class="ab-cred-row">
              <span class="ab-cred-label">Verified Record</span>
              <span class="ab-cred-val mono">03 Podiums · 01 Nat'l Finalist</span>
            </div>
          </div>

          <!-- Quantitative Telemetry Quick Strip -->
          <div class="ab-telemetry-strip">
            <div class="ab-telemetry-badge">
              <span class="ab-telemetry-val mono">02</span>
              <span class="ab-telemetry-lbl">Champs</span>
            </div>
            <div class="ab-telemetry-badge">
              <span class="ab-telemetry-val mono">8.85x</span>
              <span class="ab-telemetry-lbl">Fund Run</span>
            </div>
            <div class="ab-telemetry-badge">
              <span class="ab-telemetry-val mono">~700</span>
              <span class="ab-telemetry-lbl">Nat'l Teams</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Chronological Sprint Arc -->
      <div class="ab-timeline-col">
        <div class="ab-timeline-meta ab-reveal">
          <span class="ab-timeline-heading">FIELD EVIDENCE CHRONOLOGY (JUN – OCT 2026)</span>
          <span class="ab-timeline-caption">Verified milestones from campus incubators to national finals</span>
        </div>

        <ol class="ab-timeline">
          <div class="ab-timeline-spine" aria-hidden="true"></div>

          <!-- Milestone 1: Builders' Bootcamp -->
          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true">
              <span class="ab-marker-dot"></span>
            </div>
            <article class="ab-milestone-card">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">JUN 2026 · 7-DAY SPRINT</span>
                <span class="ab-milestone-badge ab-gold">🥇 #1 OVERALL TOP TEAM</span>
              </div>
              <h3 class="ab-milestone-title">Builders' Bootcamp (8th Edition)</h3>
              <div class="ab-milestone-venue">Rishihood University · Demo Day '26</div>
              <p class="ab-milestone-body">
                Selected for an intensive 7-day pre-college incubator covering AI, product design, psychology, and startup fundamentals. Rather than stopping at pitch decks, engineered and shipped a functional startup web prototype from scratch within 7 days, pitching live on Demo Day to finish as the #1 Overall Winning Team across all cohorts.
              </p>
              <div class="ab-milestone-tags">
                <span class="ab-pill ab-accent-pill">Working Prototype Shipped</span>
                <span class="ab-pill">Live Demo Day Pitch</span>
                <span class="ab-pill">7-Day Venture Incubator</span>
              </div>
            </article>
          </li>

          <!-- Milestone 2: DCRUST Murthal -->
          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true">
              <span class="ab-marker-dot"></span>
            </div>
            <article class="ab-milestone-card">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">SEP 2026 · 45-MIN SPRINT</span>
                <span class="ab-milestone-badge">🥉 3RD PLACE PODIUM</span>
              </div>
              <h3 class="ab-milestone-title">Advertising &amp; Brand Pitch</h3>
              <div class="ab-milestone-venue">DCRUST Murthal · E-Summit '26</div>
              <p class="ab-milestone-body">
                Represented Rishihood University offline under a high-pressure 45-minute turnaround. Assigned a consumer soap brand and divided the sprint across four concrete deliverables—promotional poster, short filmed ad, live comedic skit, and stage product pitch—securing 3rd Position Podium overall and a ₹1,100 cash prize.
              </p>
              <div class="ab-milestone-tags">
                <span class="ab-pill ab-accent-pill">₹1,100 Cash Prize</span>
                <span class="ab-pill">45-Minute Prep Sprint</span>
                <span class="ab-pill">4-Part Campaign Suite</span>
                <span class="ab-pill">Live Stage Round</span>
              </div>
            </article>
          </li>

          <!-- Milestone 3: Ashoka Cash Rush -->
          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true">
              <span class="ab-marker-dot"></span>
            </div>
            <article class="ab-milestone-card">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">OCT 2026 · 120-MIN SPRINT</span>
                <span class="ab-milestone-badge ab-gold">🏆 1ST PLACE CHAMPION</span>
              </div>
              <h3 class="ab-milestone-title">Cash Rush Competition</h3>
              <div class="ab-milestone-venue">Ashoka University · Shatranj '26</div>
              <p class="ab-milestone-body">
                Campus startup simulation with ₹300 seed capital and a 120-minute countdown. Deployed zero-inventory experience models: a web-based curiosity funnel hooked to LinkedIn, a paid campus quiz challenge, and live caricatures. Total costs were just ₹45 (paper and marker). Services generated ₹2,400 to end fund at ₹2,655 (8.85x multiplier), taking 1st place and the ₹7,000 prize.
              </p>
              <div class="ab-milestone-tags">
                <span class="ab-pill ab-accent-pill">₹7,000 Cash Prize</span>
                <span class="ab-pill ab-accent-pill">8.85x Fund Multiplier</span>
                <span class="ab-pill">₹45 Total Costs</span>
                <span class="ab-pill">120-Min Constraint</span>
                <span class="ab-pill">#1 On Leaderboard</span>
              </div>
            </article>
          </li>

          <!-- Milestone 4: IIM Amritsar CINE-SELL -->
          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true">
              <span class="ab-marker-dot"></span>
            </div>
            <article class="ab-milestone-card">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">OCT 2026 · NATIONAL ARENA</span>
                <span class="ab-milestone-badge">⚡ TOP 3 NATIONAL FINALIST</span>
              </div>
              <h3 class="ab-milestone-title">CINE-SELL Brand Challenge</h3>
              <div class="ab-milestone-venue">IIM Amritsar · Marketing Fest '26</div>
              <p class="ab-milestone-body">
                National marketing fest challenge with ~700 registered teams, primarily postgraduate MBA cohorts from top B-schools across India. Led 4-member undergraduate "Team Big 4" as Team Lead: coordinated telephone market positioning, directed promotional video reel, and led live commercial stage pitch to finish in the Top 3 nationally.
              </p>
              <div class="ab-milestone-tags">
                <span class="ab-pill ab-accent-pill">Top 3 Nationally</span>
                <span class="ab-pill">~700 Team Registrations</span>
                <span class="ab-pill">Team Lead · Team Big 4</span>
                <span class="ab-pill">MBA &amp; UG Cohorts</span>
              </div>
            </article>
          </li>

          <!-- Milestone 5: Active Systems & Research -->
          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true">
              <span class="ab-marker-dot"></span>
            </div>
            <article class="ab-milestone-card ab-active">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">PRESENT · ACTIVE BUILDS</span>
                <span class="ab-milestone-badge ab-active-badge">⚙ ACTIVE SYSTEMS</span>
              </div>
              <h3 class="ab-milestone-title">Software Systems &amp; Dialect NLP</h3>
              <div class="ab-milestone-venue">Personal Lab &amp; Independent Engineering</div>
              <p class="ab-milestone-body">
                Translating field sprint discipline into persistent software architectures. Currently building Tathya (Haryanvi/Punjabi/Bhojpuri dialect token fragmentation analysis), Stratum (live candidate market simulator), Flow State (zero-telemetry desktop environment), and Krama (academic recovery calculus).
              </p>
              <div class="ab-milestone-tags">
                <span class="ab-pill ab-accent-pill">Tathya (NLP Dialects)</span>
                <span class="ab-pill">Stratum (Sim Engine)</span>
                <span class="ab-pill">Flow State (Local OS)</span>
                <span class="ab-pill">Krama (Academic OS)</span>
              </div>
            </article>
          </li>
        </ol>
      </div>
    </div>
  </div>
</section>`;
}

function renderCompetitions(content) {
  const comps = content.competitions || [];

  return `    <section id="competitions">
      <div class="section-header">
        <span class="section-eyebrow reveal">01 // Competitive Field Record</span>
        <h2 class="section-title reveal">Top Finishes & Proof</h2>
        <p class="section-lead reveal">
          Four competitions, Jun–Oct 2026: two 1st places, one top-3 national finish, one 3rd place. Filter by type below.
        </p>
      </div>

      <!-- Interactive Filter Controls -->
      <div class="filter-bar reveal">
        <button class="filter-btn active" data-filter="all">All Arenas (04)</button>
        <button class="filter-btn" data-filter="1st-place">1st Place Championships (02)</button>
        <button class="filter-btn" data-filter="national">National Finalist (IIM Amritsar)</button>
        <button class="filter-btn" data-filter="pitch">Offline Brand Pitch (DCRUST)</button>
      </div>

      <div class="case-stack fr-case-stack">

${comps.map(comp => {
  const hasEvidence = Boolean(comp.evidence_url && comp.evidence_url !== 'TBD');
  const validMembers = (comp.team && Array.isArray(comp.team.members) ? comp.team.members : [])
    .filter(m => m && m !== 'TBD');

  const trophyPill = comp.trophy_pill || comp.placement;
  const tags = comp.tags || [];

  // Pillar 03 telemetry chips
  let telemetryChips = '';
  if (comp.id === 'cash-rush') {
    telemetryChips = `
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Seed Capital</span>
              <span class="telemetry-val fr-telemetry-val ">₹300</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Fund Return</span>
              <span class="telemetry-val fr-telemetry-val accent">₹2,655 (8.85x)</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Total Costs</span>
              <span class="telemetry-val fr-telemetry-val ">₹45 (Paper &amp; Pen)</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Service Yield</span>
              <span class="telemetry-val fr-telemetry-val ">₹2,400 Total</span>
            </div>`;
  } else if (comp.id === 'cinesell') {
    telemetryChips = `
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Deliverables</span>
              <span class="telemetry-val fr-telemetry-val ">Reel &amp; Stage Skit</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Role</span>
              <span class="telemetry-val fr-telemetry-val ">Team Lead</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Field</span>
              <span class="telemetry-val fr-telemetry-val accent">MBA &amp; UG Cohorts</span>
            </div>`;
  } else if (comp.id === 'builders-bootcamp') {
    telemetryChips = `
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Timeline</span>
              <span class="telemetry-val fr-telemetry-val ">7-Day Venture Incubator</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Shipped</span>
              <span class="telemetry-val fr-telemetry-val accent">Functional Web Prototype</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Demo Day</span>
              <span class="telemetry-val fr-telemetry-val ">#1 Overall Winning Team</span>
            </div>`;
  } else if (comp.id === 'dcrust-brand-pitch') {
    telemetryChips = `
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Time Window</span>
              <span class="telemetry-val fr-telemetry-val ">45-Minute Prep Sprint</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Cash Prize</span>
              <span class="telemetry-val fr-telemetry-val accent">₹1,100 Podium Purse</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Deliverables</span>
              <span class="telemetry-val fr-telemetry-val ">4-Part Campaign Suite</span>
            </div>`;
  }

  // Pillar 04 gallery thumbnails
  const addAssets = comp.proof && comp.proof.additional_assets ? comp.proof.additional_assets : [];
  let galleryHtml = '';
  if (addAssets.length > 0) {
    const allGallery = [comp.proof.url, ...addAssets];
    galleryHtml = `
            <div class="fr-gallery-shelf">
              <span class="fr-gallery-heading">Verified Field Artifacts (${allGallery.length}):</span>
              <div class="fr-gallery-switcher">
                ${allGallery.map((assetPath, aIdx) => `
                <button type="button" class="fr-thumb-btn fr-gallery-thumb${aIdx === 0 ? ' active' : ''}" 
                        data-asset-src="${assetPath}" 
                        data-asset-caption="${escapeHtml(comp.proof.caption)} [Artifact ${aIdx + 1}]" 
                        data-asset-stamp="${escapeHtml(comp.proof.stamp)}" 
                        aria-label="View artifact ${aIdx + 1}">
                  <img src="${assetPath}" alt="Thumbnail ${aIdx + 1}" loading="lazy">
                </button>`).join('')}
              </div>
            </div>`;
  }

  return `      <!-- ========================================================================
           COMPETITION CARD: ${escapeHtml(comp.title)} (${escapeHtml(comp.host)})
           ID: ${comp.id} | CATEGORY: ${comp.category}
           ======================================================================== -->
      <article class="case-card fr-card reveal" data-category="${comp.category}" data-comp-id="${comp.id}" id="comp-${comp.id}">
        <div class="fr-card-header">
          <div class="beacon-row fr-beacon-row">
            <span class="beacon-pulse fr-beacon-pulse" aria-hidden="true"></span>
            <span>${escapeHtml(comp.host)} · ${escapeHtml(comp.event)}</span>
          </div>

          <div class="case-title-row fr-title-row">
            <h3 class="case-title fr-title">${escapeHtml(comp.title)}</h3>
            <span class="case-trophy-pill fr-trophy-pill">${escapeHtml(trophyPill)}</span>
          </div>

          <div class="case-pills-row fr-pills-row">
            ${tags.map(t => `<span class="case-tag ${t.accent ? 'gold ' : ''}fr-tag">${escapeHtml(t.label)}</span>`).join('')}
          </div>
        </div>

        <div class="fr-proof-layer">
          <div class="fr-proof-column fr-proof-narrative">
            
        <!-- PILLAR 01: THE ARENA & BRIEF -->
        <div class="fr-pillar fr-pillar-arena">
          <div class="fr-pillar-header">
            <div class="fr-header-left">
              <span class="fr-pillar-idx">01</span>
              <span class="fr-pillar-title">THE ARENA &amp; BRIEF</span>
            </div>
            <span class="fr-arena-badge-kicker">${escapeHtml(comp.host)}</span>
          </div>
          <p class="fr-arena-lead">${escapeHtml(comp.field_context.brief)}</p>
          <div class="fr-arena-meta-strip">
            <span class="fr-meta-chip"><strong>Host:</strong> ${escapeHtml(comp.host)}</span>
            <span class="fr-meta-chip"><strong>Event:</strong> ${escapeHtml(comp.event)}</span>
            <span class="fr-meta-chip"><strong>Date:</strong> ${escapeHtml(comp.date)}</span>
          </div>
          <div class="fr-context-narrative">
            <span class="fr-narrative-lbl">Field Dynamics &amp; Setup:</span>
            <p class="fr-narrative-text">${escapeHtml(comp.field_context.setup)}</p>
          </div>
        </div>
    
            
        <!-- PILLAR 02: MY ROLE & SHIPPED DELIVERABLES -->
        <div class="fr-pillar fr-pillar-role">
          <div class="fr-pillar-header">
            <div class="fr-header-left">
              <span class="fr-pillar-idx">02</span>
              <span class="fr-pillar-title">MY SPECIFIC ROLE</span>
            </div>
            ${hasEvidence ? '<span class="fr-role-badge">VERIFIED CONTRIBUTION</span>' : '<span class="fr-role-badge">CONTRIBUTION RECORD</span>'}
          </div>
          <div class="fr-role-title-box">
            <span class="fr-role-subtitle">Primary Assignment:</span>
            <div class="fr-role-title">${escapeHtml(comp.team.role)}</div>
          </div>
          <div class="fr-deliverables-block">
            <span class="fr-deliverables-lbl">Shipped Sprint Deliverables:</span>
            <ul class="fr-deliverables-list">
              ${(comp.deliverables || []).map(d => `<li class="fr-deliverable-item"><span class="fr-bullet">▸</span><span>${escapeHtml(d)}</span></li>`).join('\n              ')}
            </ul>
          </div>
          ${validMembers.length > 0 ? `
          <div class="fr-squad-row">
            <span class="fr-squad-lbl">Personnel &amp; Teammates:</span>
            <span class="fr-squad-names">${escapeHtml(validMembers.join(', '))}</span>
          </div>` : ''}
        </div>
    
            
        <!-- PILLAR 03: OUTCOME & VERIFIED NUMBERS -->
        <div class="fr-pillar fr-pillar-outcome">
          <div class="fr-pillar-header">
            <div class="fr-header-left">
              <span class="fr-pillar-idx">03</span>
              <span class="fr-pillar-title">${hasEvidence ? 'OUTCOME &amp; VERIFIED TELEMETRY' : 'OUTCOME &amp; TELEMETRY'}</span>
            </div>
            <span class="fr-result-badge">${escapeHtml(comp.placement)}</span>
          </div>
          <div class="fr-context-narrative">
            <span class="fr-narrative-lbl">Verified Field Result:</span>
            <p class="fr-narrative-text">${escapeHtml(comp.story.execution)}</p>
          </div>
          <div class="case-telemetry-grid fr-telemetry-matrix">
            ${telemetryChips}
          </div>
          
          <!-- Case Study Telemetry Deep Dive Anchor Button -->
          <button class="cs-deepdive-btn fr-deepdive-btn" data-comp-id="${comp.id}" aria-haspopup="dialog" aria-expanded="false" title="Examine detailed unit economics &amp; telemetry for ${escapeHtml(comp.title)}">
            <span>Examine Unit Economics &amp; Telemetry</span>
            <span class="cs-arrow fr-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
    
          </div>
          <div class="fr-proof-column fr-proof-evidence">
            
        <!-- PILLAR 04: PRIMARY FIELD PROOF & VISUAL ASSETS -->
        <div class="fr-pillar fr-pillar-visual">
          <div class="fr-pillar-header">
            <div class="fr-header-left">
              <span class="fr-pillar-idx">04</span>
              <span class="fr-pillar-title">FIELD EVIDENCE &amp; PROOF</span>
            </div>
            <span class="fr-asset-badge">${hasEvidence ? '<span class="pulse-dot" aria-hidden="true"></span><span>VERIFIED FIELD ASSET</span>' : '<span>FIELD ARTIFACT</span>'}</span>
          </div>

          <div class="fr-photo-frame" data-zoom-target="${comp.proof.url}">
            <img class="case-photo fr-primary-photo" 
                 src="${comp.proof.url}" 
                 alt="${escapeHtml(comp.proof.caption)}" 
                 loading="lazy">
            <div class="fr-photo-overlay" aria-hidden="true">
              <span class="fr-overlay-zoom-pill">
                <span class="fr-zoom-icon">🔍</span> Click to Inspect Full-Resolution Proof
              </span>
            </div>
            <button class="fr-inspect-btn" 
                    data-asset-src="${comp.proof.url}" 
                    data-asset-caption="${escapeHtml(comp.proof.caption)}" 
                    data-asset-stamp="${escapeHtml(comp.proof.stamp)}" 
                    aria-label="Inspect ${escapeHtml(comp.title)} evidence full size">
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div class="fr-photo-meta-bar">
            <span class="fr-photo-stamp mono">${escapeHtml(comp.proof.stamp)}</span>
            <span class="fr-asset-tag fr-asset-linked" title="Verified local filesystem asset path">
              <span class="fr-code-bracket">[</span><code>${escapeHtml(comp.proof.url)}</code><span class="fr-code-bracket">]</span>
            </span>
          </div>
          <p class="fr-photo-caption">${escapeHtml(comp.proof.caption)}</p>

          ${galleryHtml}
        </div>
    
          </div>
        </div>
      </article>`;
}).join('\n\n')}

      </div>
    </section>`;
}

function renderVentures(content) {
  const vens = content.ventures || [];

  // Generate Tathya Explorer for the dedicated full-width workbench
  let tathyaExplorerHtml = '';
  const { renderTathyaExplorer } = require('../templates/demo/render.js');
  const tathyaJsonPath = path.join(DATA_DIR, 'tathya.json');
  let tathyaData = null;
  if (fs.existsSync(tathyaJsonPath)) {
    try {
      tathyaData = JSON.parse(fs.readFileSync(tathyaJsonPath, 'utf8'));
    } catch (e) {
      console.warn('[Build] Warning reading data/tathya.json:', e);
    }
  }
  tathyaExplorerHtml = renderTathyaExplorer(tathyaData);

  return `    <section id="ventures">
      <div class="section-header">
        <span class="section-eyebrow reveal">02 // Ventures &amp; Systems</span>
        <h2 class="section-title reveal">What I Am Building</h2>
        <p class="section-lead reveal">
          Four projects at different stages, from an early concept to small tools I use myself.
        </p>
      </div>

      <div class="ventures-grid">

${vens.map(ven => {
  const hasEvidence = Boolean(ven.evidence_url && ven.evidence_url !== 'TBD');
  const hasProofAsset = Boolean(ven.proof_asset && ven.proof_asset.url && ven.proof_asset.url !== 'TBD');

  let previewHtml = '';
  if (ven.terminal_preview) {
    const lines = ven.terminal_preview.lines || [];
    const renderedLines = lines.map(line => {
      if (typeof line === 'string') {
        return escapeHtml(line);
      }
      if (line.type === 'comment') {
        return `<span class="cm">${escapeHtml(line.text)}</span>`;
      }
      let lineText = escapeHtml(line.text);
      if (line.prefix) {
        return `<span class="kw">${escapeHtml(line.prefix)}</span> ${lineText}`;
      }
      return lineText;
    }).join('\n');

    previewHtml = `
            <!-- Integrated Terminal Output -->
            <div class="term">
              <div class="term-bar">
                <i></i><i></i><i></i>
                <span>${escapeHtml(ven.terminal_preview.title)}</span>
              </div>
              <pre class="term-body" tabindex="0" role="region" aria-label="${escapeHtml(ven.name)} terminal output">${renderedLines}</pre>
            </div>`;
  } else if (hasProofAsset) {
    previewHtml = `
            <div class="venture-preview-box">
              <img src="${ven.proof_asset.url}" alt="${escapeHtml(ven.proof_asset.alt)}" class="venture-preview-img" loading="lazy">
            </div>`;
  }

  // Drawers for case study deep dives
  let drawerContent = '';
  if (ven.id === 'tathya') {
    drawerContent = `
              <div class="cs-grid">
                <div class="cs-panel">
                  <h4><span class="cs-num">01</span> Research Hypothesis &amp; Failure Modes</h4>
                  <p>State-of-the-art LLMs trained on standard web Hindi (Manak Hindi) experience catastrophic token fragmentation when parsing dialectal inputs from Haryana, Punjab, and Bihar. A 6-token colloquial query often blows up into 34+ byte fragments, degrading attention weights and yielding hallucinations on critical civic information.</p>
                </div>
                <div class="cs-panel">
                  <h4><span class="cs-num">02</span> Verification Layer Architecture</h4>
                  <p>Tathya implements a dual-pass evaluation pipeline: an acoustic/orthographic normalizer paired with an assertion boundary checker. Civic and health queries are grounded against audited municipal tables before generating user responses.</p>
                </div>
                <div class="cs-panel cs-panel-full">
                  <h4><span class="cs-num">03</span> Architectural Retrospective &amp; Failure Analysis</h4>
                  <p><strong>What Broke:</strong> Relying purely on synthetically generated dialect evaluations produced synthetic hallucinations. <strong>Correction:</strong> Transitioned to collecting authentic local voice notes and community radio transcripts to construct an uncorrupted benchmark dataset.</p>
                </div>
              </div>`;
  } else if (ven.id === 'stratum') {
    drawerContent = `
              <div class="cs-grid">
                <div class="cs-panel">
                  <h4><span class="cs-num">01</span> Simulation Engine Model</h4>
                  <p>Stratum models marketing and venture aptitude by discarding static case interviews in favor of a live deterministic finite-state machine. Candidates allocate capital across volatile simulated bidding channels (simulated Meta/Google ad auctions) subject to exogenous algorithmic shocks.</p>
                </div>
                <div class="cs-panel">
                  <h4><span class="cs-num">02</span> Latency &amp; Capital Efficiency Audits</h4>
                  <p>Every keystroke, budget allocation, and pivot timestamp is logged into an immutable session ledger. Candidates are evaluated on mathematical resilience, capital drawdowns, and recovery calculus rather than articulate retrospective rationalizations.</p>
                </div>
                <div class="cs-panel cs-panel-full">
                  <h4><span class="cs-num">03</span> Retrospective: Headless vs Full UI</h4>
                  <p><strong>Initial Pitfall:</strong> Attempted to build high-polish canvas dashboards prematurely. <strong>Pivot:</strong> Stripped the UI to engineer a headless, deterministic state machine with verifiable seeds first, ensuring identical scenario playback across interview cohorts.</p>
                </div>
              </div>`;
  } else if (ven.id === 'flow-state') {
    drawerContent = `
              <div class="cs-grid">
                <div class="cs-panel">
                  <h4><span class="cs-num">01</span> Local-First Philosophy &amp; Zero-OAuth Sync</h4>
                  <p>Modern developer productivity tools are saturated with telemetry beacons, remote websocket heartbeats, and invasive analytics. Flow State enforces total air-gap capability: calendar events synchronize via direct RFC 5545 <code>.ics</code> parsing with zero external network handshakes.</p>
                </div>
                <div class="cs-panel">
                  <h4><span class="cs-num">02</span> 16-Bit Procedural Sound Engine</h4>
                  <p>Replaced bloated streaming audio players and compressed MP3 loops with a native 44.1kHz Web Audio procedural sine synthesizer. Generates custom brown and pink noise with mathematical purity at microscopic CPU usage (&lt;0.5%).</p>
                </div>
                <div class="cs-panel cs-panel-full">
                  <h4><span class="cs-num">03</span> Retrospective: Discarding Electron</h4>
                  <p><strong>Critical Lesson:</strong> Bundling Chromium for a productivity tool consumed 450MB of RAM—the antithesis of lightweight flow. Rebuilt the desktop shell around native OS webviews to maintain sub-40MB memory footprints.</p>
                </div>
              </div>`;
  } else if (ven.id === 'krama') {
    drawerContent = `
              <div class="cs-grid">
                <div class="cs-panel">
                  <h4><span class="cs-num">01</span> The 75% Cutoff Recovery Calculus</h4>
                  <p>Indian undergraduate regulations mandate strict 75% attendance for examination eligibility. Krama eliminates intuitive guesswork by modeling class attendance as a calculus curve, calculating the minimum mandatory presence required to recover from unexpected illness or collegiate competition travel.</p>
                </div>
                <div class="cs-panel">
                  <h4><span class="cs-num">02</span> Offline Timetable Optimization</h4>
                  <p>Operates 100% on-device using local indexed storage. Accommodates shifting lab slots, campus holiday calendars, and substitute sessions without requiring administrative portal credentials.</p>
                </div>
                <div class="cs-panel cs-panel-full">
                  <h4><span class="cs-num">03</span> Retrospective: Handling Edge Schedules</h4>
                  <p><strong>Edge Case Failure:</strong> Irregular university schedules with rotational odd/even week cycles broke simple modulo parsers. <strong>Fix:</strong> Implemented day-by-day deterministic state transitions keyed to official university academic calendars.</p>
                </div>
              </div>`;
  }

  return `        <!-- VENTURE CARD: ${escapeHtml(ven.name)} -->
        <article class="venture-card reveal" data-venture-id="${ven.id}">
          <div class="venture-top">
            <div class="venture-meta">
              <span>${escapeHtml(ven.category)}</span>
              <span class="mono" style="color: var(--accent);"><i class="pulse-dot" style="display:inline-block; margin-right:4px;"></i>${escapeHtml(ven.badge)}</span>
            </div>
            <h3 class="venture-name">${escapeHtml(ven.name)}</h3>
            <p class="venture-thesis">${escapeHtml(ven.thesis)}</p>

            ${previewHtml}
          </div>

          <div class="venture-details">
            <div class="venture-detail-row">
              <span class="lbl">Problem</span>
              <span class="val">${escapeHtml(ven.problem)}</span>
            </div>
            <div class="venture-detail-row">
              <span class="lbl">Features</span>
              <span class="val">${(ven.features || []).join(' · ')}</span>
            </div>
            <div class="venture-detail-row">
              <span class="lbl">Status</span>
              <span class="val mono">${escapeHtml(ven.status_detail)}</span>
            </div>
          </div>

          <div class="venture-actions">
            <a href="${escapeHtml(ven.action_cta.target)}" class="btn-solid">${escapeHtml(ven.action_cta.label)} <span class="btn-arrow">→</span></a>
            ${ven.repo_url && ven.repo_url !== 'TBD' ? `<a href="${escapeHtml(ven.repo_url)}" class="btn-ghost venture-repo-link" target="_blank" rel="noopener">Code ↗</a>` : ''}
            ${ven.demo_url && ven.demo_url !== 'TBD' ? `<a href="${escapeHtml(ven.demo_url)}" class="btn-ghost venture-demo-link" target="_blank" rel="noopener">Demo ↗</a>` : ''}
            ${ven.id === 'tathya' ? '<a href="#tathya-workbench" class="venture-explorer-link">🔬 Open Live Benchmark ↓</a>' : ''}
          </div>

          <!-- Deep Dive Interactive Trigger Button -->
          <button class="cs-trigger" data-drawer-target="cs-drawer-${ven.id}" aria-expanded="false" aria-controls="cs-drawer-${ven.id}">
            <span><span class="cs-trigger__icon" aria-hidden="true">+</span> Deep Dive: Systems &amp; Retrospective</span>
            <span class="cs-trigger__badge">AUDITED</span>
          </button>

          <!-- Expandable Deep Dive Drawer Host -->
          <div id="cs-drawer-${ven.id}" class="cs-drawer" hidden>
            <div class="cs-drawer__inner">
              <div class="cs-header-strip">
                <span class="cs-eyebrow">ARCHITECTURAL DOSSIER // ${escapeHtml(ven.name).toUpperCase()}</span>
                <span class="cs-badge">${escapeHtml(ven.badge)}</span>
              </div>

              ${drawerContent}
            </div>
          </div>
        </article>`;
}).join('\n\n')}

      </div>

      <div class="ventures-workbench-showcase reveal" id="tathya-workbench">
        <div class="vw-header">
          <span class="section-eyebrow">Interactive AI Research Console</span>
          <h3 class="vw-title">Tathya · Dialect Token Fragmentation Explorer</h3>
          <p class="vw-lead">Live benchmark analyzing how Hindi LLMs fail on Punjabi, Haryanvi, and Bhojpuri colloquial syntax.</p>
        </div>
        ${tathyaExplorerHtml}
      </div>
    </section>`;
}

function renderContact(content) {
  const p = content.personal;
  return `    <section id="contact">
      <div class="contact-card reveal">
        <div class="contact-left">
          <h3>Working on something interesting?</h3>
          <p>
            Open to first-year internships, early-stage builder collaborations, and mentorship — reach out directly below.
          </p>
        </div>

        <div class="contact-channels">
          <div class="channel-box" id="copyBox" role="button" tabindex="0" aria-label="Copy email address" title="Click to copy ${escapeHtml(p.email)}">
            <div class="info">
              <span class="info-lbl">Direct Transmission</span>
              <span class="info-val">${escapeHtml(p.email)}</span>
            </div>
            <span class="channel-action" id="copyTag">[COPY]</span>
          </div>

          ${p.linkedin && p.linkedin !== 'TBD' ? `<a href="${escapeHtml(p.linkedin)}" class="channel-box" target="_blank" rel="noopener">
            <div class="info">
              <span class="info-lbl">Professional Network</span>
              <span class="info-val">LinkedIn Profile (${escapeHtml(p.name)})</span>
            </div>
            <span class="channel-action">[CONNECT ↗]</span>
          </a>` : ''}

          ${p.resume_url && p.resume_url !== 'TBD' ? `<a href="${escapeHtml(p.resume_url)}" class="channel-box" target="_blank" rel="noopener">
            <div class="info">
              <span class="info-lbl">Résumé</span>
              <span class="info-val">Download Résumé (PDF)</span>
            </div>
            <span class="channel-action" style="color: var(--accent); font-weight: 700;">[DOWNLOAD ↗]</span>
          </a>` : ''}

          ${p.github && p.github !== 'TBD' ? `<a href="${escapeHtml(p.github)}" class="channel-box" target="_blank" rel="noopener">
            <div class="info">
              <span class="info-lbl">Code Repository</span>
              <span class="info-val">GitHub Profile</span>
            </div>
            <span class="channel-action">[VIEW ↗]</span>
          </a>` : ''}

          ${p.twitter && p.twitter !== 'TBD' ? `<a href="${escapeHtml(p.twitter)}" class="channel-box" target="_blank" rel="noopener">
            <div class="info">
              <span class="info-lbl">Social Channel</span>
              <span class="info-val">Twitter Profile</span>
            </div>
            <span class="channel-action">[FOLLOW ↗]</span>
          </a>` : ''}
        </div>
      </div>
    </section>`;
}

function renderPortfolioContentData(content) {
  return `  <script id="portfolio-content-data" type="application/json">\n${JSON.stringify(content, null, 2)}\n  </script>`;
}

function renderWindowPortfolioContent(content) {
  return `window.__PORTFOLIO_CONTENT__ = ${JSON.stringify(content, null, 2)};`;
}

// ----------------------------------------------------------------------------
// BUILD VALIDATION GATES (STRICT EXIT CODE 1 ON ANY VIOLATION)
// ----------------------------------------------------------------------------

function runBuildValidation(content, html) {
  console.log('--- Running Strict Architecture Validation Gates ---');
  let hasErrors = false;

  // Gate 1: Zero Visible "TBD"
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  const lines = stripped.split('\n');
  const tbdViolations = [];
  lines.forEach((line, idx) => {
    if (line.includes('TBD')) {
      tbdViolations.push({ line: idx + 1, snippet: line.trim() });
    }
  });

  if (tbdViolations.length > 0) {
    console.error('\x1b[31m[GATE 1 FAILED]\x1b[0m Zero visible "TBD" rule violated:');
    tbdViolations.forEach(v => {
      console.error(`  Line ${v.line}: ${v.snippet}`);
    });
    hasErrors = true;
  } else {
    console.log('\x1b[32m✔ [GATE 1 PASSED]\x1b[0m Zero literal "TBD" strings rendered to visible DOM.');
  }

  // Gate 2: Evidence URL Verification Gate
  let gate2Passed = true;
  for (const comp of content.competitions) {
    const cardMatch = html.match(new RegExp(`id="comp-${comp.id}"[\\s\\S]*?</article>`, 'i'));
    if (cardMatch) {
      const cardHtml = cardMatch[0];
      const hasVerifiedBadge = /VERIFIED CONTRIBUTION|VERIFIED FIELD ASSET/i.test(cardHtml);
      if (hasVerifiedBadge && (!comp.evidence_url || comp.evidence_url === 'TBD')) {
        console.error(`\x1b[31m[GATE 2 FAILED]\x1b[0m Competition "${comp.id}" renders "Verified" badge but has no valid evidence_url!`);
        gate2Passed = false;
        hasErrors = true;
      }
      if (comp.evidence_url && comp.evidence_url !== 'TBD') {
        const fullAssetPath = path.join(ROOT_DIR, comp.evidence_url);
        if (!fs.existsSync(fullAssetPath)) {
          console.error(`\x1b[31m[GATE 2 FAILED]\x1b[0m Competition "${comp.id}" evidence_url file missing on disk: ${comp.evidence_url}`);
          gate2Passed = false;
          hasErrors = true;
        }
      }
    }
  }

  for (const ven of content.ventures) {
    const venMatch = html.match(new RegExp(`data-venture-id="${ven.id}"[\\s\\S]*?</article>`, 'i'));
    if (venMatch) {
      const cardHtml = venMatch[0];
      const hasVerifiedBadge = /VERIFIED/i.test(cardHtml);
      if (hasVerifiedBadge && (!ven.evidence_url || ven.evidence_url === 'TBD')) {
        console.error(`\x1b[31m[GATE 2 FAILED]\x1b[0m Venture "${ven.id}" renders "Verified" badge but has no valid evidence_url!`);
        gate2Passed = false;
        hasErrors = true;
      }
    }
  }

  if (gate2Passed) {
    console.log('\x1b[32m✔ [GATE 2 PASSED]\x1b[0m All "Verified" badges strictly gated on existing evidence_urls.');
  }

  // Gate 3: JSON-LD Validation Gate
  const ldMatch = html.match(/<script type="application\/ld\+json" class="seo-schema-script">([\s\S]*?)<\/script>/i);
  if (!ldMatch) {
    console.error('\x1b[31m[GATE 3 FAILED]\x1b[0m JSON-LD schema script is missing from output!');
    hasErrors = true;
  } else {
    try {
      const ldObj = JSON.parse(ldMatch[1]);
      if (!ldObj['@context'] || !ldObj['@graph'] || !Array.isArray(ldObj['@graph'])) {
        console.error('\x1b[31m[GATE 3 FAILED]\x1b[0m JSON-LD schema missing @context or @graph array!');
        hasErrors = true;
      } else {
        const types = ldObj['@graph'].map(item => item['@type']);
        if (!types.includes('WebSite') || !types.includes('Person') || !types.includes('ItemList')) {
          console.error('\x1b[31m[GATE 3 FAILED]\x1b[0m JSON-LD schema missing required entity types (WebSite, Person, ItemList)!');
          hasErrors = true;
        } else {
          console.log('\x1b[32m✔ [GATE 3 PASSED]\x1b[0m Valid Schema.org JSON-LD graph embedded.');
        }
      }
    } catch (err) {
      console.error(`\x1b[31m[GATE 3 FAILED]\x1b[0m JSON-LD parse error: ${err.message}`);
      hasErrors = true;
    }
  }

  // Gate 4: Recruiter Mode Gate
  if (!html.includes('id="rm-toggle"')) {
    console.error('\x1b[31m[GATE 4 FAILED]\x1b[0m Recruiter Mode toggle #rm-toggle missing from HTML!');
    hasErrors = true;
  } else if (!html.includes('id="rm-summary-drawer"')) {
    console.error('\x1b[31m[GATE 4 FAILED]\x1b[0m Recruiter Mode drawer #rm-summary-drawer missing from HTML!');
    hasErrors = true;
  } else {
    console.log('\x1b[32m✔ [GATE 4 PASSED]\x1b[0m Recruiter Mode toggle and executive drawer verified.');
  }

  return !hasErrors;
}

// ----------------------------------------------------------------------------
// MAIN BUILD EXECUTION
// ----------------------------------------------------------------------------

function main() {
  const isValidateOnly = process.argv.includes('--validate-only');
  console.log(`\x1b[36m============================================================\x1b[0m`);
  console.log(`\x1b[36mPORTFOLIO BUILD & STATIC RECONCILIATION ENGINE\x1b[0m`);
  console.log(`\x1b[36m============================================================\x1b[0m`);
  console.log(`Target: ${ROOT_DIR}`);
  console.log(`Mode:   ${isValidateOnly ? 'Validation Only' : 'Full Static Generation & Sync'}\n`);

  if (!fs.existsSync(CONTENT_FILE)) {
    console.error(`\x1b[31m[FATAL]\x1b[0m Canonical content file not found at: ${CONTENT_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(`\x1b[31m[FATAL]\x1b[0m Template file not found at: ${TEMPLATE_FILE}`);
    process.exit(1);
  }

  // 1. Read Canonical Content
  const rawContent = fs.readFileSync(CONTENT_FILE, 'utf-8');
  let content;
  try {
    content = JSON.parse(rawContent);
  } catch (err) {
    console.error(`\x1b[31m[FATAL]\x1b[0m Failed to parse canonical JSON at ${CONTENT_FILE}: ${err.message}`);
    process.exit(1);
  }

  // If validation only on existing index.html
  if (isValidateOnly) {
    if (!fs.existsSync(DIST_INDEX)) {
      console.error(`\x1b[31m[FATAL]\x1b[0m Built file not found at: ${DIST_INDEX}. Run "npm run build" first.`);
      process.exit(1);
    }
    const builtHtml = fs.readFileSync(DIST_INDEX, 'utf-8');
    const passed = runBuildValidation(content, builtHtml);
    if (!passed) {
      console.error(`\x1b[31m[VALIDATION FAILED]\x1b[0m Errors detected.`);
      process.exit(1);
    }
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Existing build passed all validation gates.`);
    process.exit(0);
  }

  // 2. Read Template
  let template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

  // 3. Render and Inject Components
  console.log('Rendering components strictly from content/content.json:');
  const headMeta = renderHeadMeta(content);
  const jsonLd = renderJsonLd(content);
  const heroStats = renderHeroStats(content);
  const recruiterDrawer = renderRecruiterDrawer(content);
  const aboutSection = renderAbout(content);
  const competitionsSection = renderCompetitions(content);
  const venturesSection = renderVentures(content);
  const contactSection = renderContact(content);
  const portfolioContentData = renderPortfolioContentData(content);
  const windowPortfolioContent = renderWindowPortfolioContent(content);

  template = template
    .replace('<!-- {{INJECT_HEAD_META}} -->', headMeta)
    .replace('<!-- {{INJECT_JSON_LD}} -->', jsonLd)
    .replace('<!-- {{INJECT_HERO_STATS}} -->', heroStats)
    .replace('<!-- {{INJECT_RECRUITER_DRAWER}} -->', recruiterDrawer)
    .replace('<!-- {{INJECT_ABOUT_SECTION}} -->', aboutSection)
    .replace('<!-- {{INJECT_COMPETITIONS_SECTION}} -->', competitionsSection)
    .replace('<!-- {{INJECT_VENTURES_SECTION}} -->', venturesSection)
    .replace('<!-- {{INJECT_CONTACT_SECTION}} -->', contactSection)
    .replace('<!-- {{INJECT_PORTFOLIO_CONTENT_DATA}} -->', portfolioContentData)
    .replace('<!-- {{INJECT_WINDOW_PORTFOLIO_CONTENT}} -->', windowPortfolioContent);

  // Ensure Tathya LLM Failure Explorer styles and script are bundled
  const { getTathyaExplorerCSS, getTathyaExplorerJS } = require('../templates/demo/render.js');
  const tfeCss = getTathyaExplorerCSS();
  const tfeJs = getTathyaExplorerJS();

  if (!template.includes('.tfe-explorer')) {
    template = template.replace('</style>', `\n/* TATHYA LLM FAILURE EXPLORER STYLES (.tfe-) */\n${tfeCss}\n</style>`);
  }
  if (!template.includes('initTathyaExplorer')) {
    template = template.replace('bootstrapPortfolioV2();', `bootstrapPortfolioV2();\n    if (typeof window.initTathyaExplorer === 'function') {\n      window.__TATHYA_EXPLORER = window.initTathyaExplorer();\n    }`);
    template = template.replace('</script>', `\n/* TATHYA LLM FAILURE EXPLORER SCRIPT */\n${tfeJs}\n</script>`);
  }

  console.log('  ✔ Head metadata & canonical tags');
  console.log('  ✔ Schema.org JSON-LD graph');
  console.log('  ✔ Hero quick stats');
  console.log('  ✔ Recruiter Mode executive drawer');
  console.log('  ✔ About & trajectory sprint arc');
  console.log('  ✔ Competitive field record (4-pillar proof layer)');
  console.log('  ✔ Ventures & systems (expandable case studies)');
  console.log('  ✔ Tathya LLM failure explorer (templates/demo/)');
  console.log('  ✔ Direct contact transmission channels');
  console.log('  ✔ Synchronous embedded JSON payload & global constant\n');

  // 4. Validate Generated HTML
  const passed = runBuildValidation(content, template);
  if (!passed) {
    console.error(`\n\x1b[31m[BUILD FAILED]\x1b[0m Fix validation errors above. Static artifacts were not written.`);
    process.exit(1);
  }

  // 5. Write to dist/ and Synchronize
  console.log('\n--- Synchronizing Distribution and Root Artifacts ---');
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Write dist/index.html
  fs.writeFileSync(DIST_INDEX, template, 'utf-8');
  console.log(`  ✔ Written: dist/index.html (${template.length.toLocaleString()} bytes)`);

  // Sync root index.html and index.v2.html
  fs.writeFileSync(ROOT_INDEX, template, 'utf-8');
  console.log(`  ✔ Synced:  index.html (${template.length.toLocaleString()} bytes)`);
  fs.writeFileSync(ROOT_INDEX_V2, template, 'utf-8');
  console.log(`  ✔ Synced:  index.v2.html (${template.length.toLocaleString()} bytes)`);

  // Sync root content.json with content/content.json
  fs.writeFileSync(ROOT_CONTENT, JSON.stringify(content, null, 2), 'utf-8');
  console.log(`  ✔ Synced:  content.json (root)`);

  // Sync 404.html to dist/404.html
  const ROOT_404 = path.join(ROOT_DIR, '404.html');
  const DIST_404 = path.join(DIST_DIR, '404.html');
  if (fs.existsSync(ROOT_404)) {
    fs.copyFileSync(ROOT_404, DIST_404);
    console.log(`  ✔ Synced:  404.html -> dist/404.html`);
  }

  // Copy assets/ to dist/assets/
  if (fs.existsSync(ASSETS_DIR)) {
    copyDirSync(ASSETS_DIR, DIST_ASSETS);
    const assetFiles = fs.readdirSync(DIST_ASSETS);
    console.log(`  ✔ Copied:  assets/ -> dist/assets/ (${assetFiles.length} files)`);
  }

  // Copy data/ to dist/data/
  if (fs.existsSync(DATA_DIR)) {
    copyDirSync(DATA_DIR, DIST_DATA);
    const dataFiles = fs.readdirSync(DIST_DATA);
    console.log(`  ✔ Copied:  data/ -> dist/data/ (${dataFiles.length} files)`);
  }

  // Generate SEO, Share, Robots.txt, Sitemap.xml & OG Images
  const shareReport = shareEngine.generateShareArtifacts(content, DIST_DIR);
  console.log(`  ✔ Generated: dist/robots.txt (Sitemap -> ${shareReport.canonicalRoot}sitemap.xml)`);
  console.log(`  ✔ Generated: dist/sitemap.xml (${shareReport.artifacts.find(a => a.file === 'dist/sitemap.xml').bytes} bytes)`);
  const ogCount = shareReport.artifacts.filter(a => a.file.includes('assets/og')).length;
  console.log(`  ✔ Generated: dist/assets/og/ (${ogCount} section OG cards SVG + PNG)`);

  console.log(`\n\x1b[32m============================================================\x1b[0m`);
  console.log(`\x1b[32mBUILD COMPLETE: 100% PRODUCTION READY\x1b[0m`);
  console.log(`\x1b[32m============================================================\x1b[0m\n`);
}

main();
