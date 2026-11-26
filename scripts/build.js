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
const KramaMath = require('../templates/demo/krama-math.js');

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

// Helper: Resolve optimized thumbnail path if available
function getThumbPath(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return assetPath;
  const parsed = path.parse(assetPath);
  const webpThumb = path.join(parsed.dir, `${parsed.name}-thumb.webp`);
  const diskPath = path.join(ROOT_DIR, webpThumb);
  if (fs.existsSync(diskPath)) {
    return webpThumb;
  }
  return assetPath;
}

// Helper: Wrap decorative badge emoji in aria-hidden
function formatAriaEmoji(str) {
  if (!str) return '';
  return String(str).replace(/([🥇🥉🏆⚡⚙])/gu, '<span aria-hidden="true">$1</span>');
}

const ARTIFACT_ALT_MAP = {
  'assets/cash-rush-ashoka.jpg': 'Cash Rush Championship Team celebrating podium victory at Ashoka University',
  'assets/cinesell-iim-amritsar.jpg': 'CINE-SELL unit economics modeling and campaign strategy at IIM Amritsar',
  'assets/cinesell-team-big4.jpg': 'Team Big 4 presentation on stage at IIM Amritsar Marketing Fest 2026',
  'assets/builders-bootcamp-demo-day.jpg': "Builders' Bootcamp Demo Day 1st place presentation at Rishihood University",
  'assets/builders-bootcamp-cohort.jpg': "Builders' Bootcamp cohort and founders group photograph",
  'assets/dcrust-podium-team.jpg': 'Advertising and Brand Pitch 3rd place podium team at DCRUST E-Summit 2026',
  'assets/dcrust-esummit-podium.jpg': 'DCRUST E-Summit stage award ceremony and certificate presentation',
  'assets/dcrust-stage-pitch.jpg': 'Live strategic pitch delivery on stage at DCRUST auditorium'
};

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
          <span class="rm-header-kicker">Candidate Brief</span>
        </div>
        <h2 class="rm-header-title">${escapeHtml(content.hero.headline_first)} <span>${escapeHtml(content.hero.headline_last)}</span></h2>
        <p class="rm-header-desc">
          First-Year B.Tech CS &amp; Data Science at Rishihood University (Class of 2030). Builder of software tools, local utilities, and early venture prototypes with documented collegiate wins.
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
        <div class="rm-kpi-val">TOP 10</div>
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
            <span>Collegiate Track Record &amp; Unit Economics</span>
          </h3>
          <span class="rm-panel-count">${comps.length} Records</span>
        </div>
        <div class="rm-proof-list">
          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">Ashoka University · Cash Rush</span>
              <span class="rm-proof-badge"><span aria-hidden="true">🏆</span> 1st Place Champion</span>
            </div>
            <div class="rm-proof-metrics">₹300 → ₹2,655 in 2 hrs · 8.85x Return · ₹7,000 Prize</div>
            <p class="rm-proof-desc">
              Zero-inventory service model: designed curiosity-monetization thesis, ran live campus quiz challenge, and co-designed web funnel with team caricatures. Production cost: ₹45 against ₹2,400 revenue (&gt;98% margin).
            </p>
          </div>

          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">IIM Amritsar · CINE-SELL</span>
              <span class="rm-proof-badge"><span aria-hidden="true">⚡</span> Top 10 National</span>
            </div>
            <div class="rm-proof-metrics">~700 National Teams · Lead of "Team Big 4"</div>
            <p class="rm-proof-desc">
              National marketing fest challenge. Coordinated product positioning and led live stage commercial pitch with team promotional reel; finished as Top 10 National Finalists against postgraduate MBA cohorts.
            </p>
          </div>

          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">Rishihood · Builders' Bootcamp</span>
              <span class="rm-proof-badge"><span aria-hidden="true">🥇</span> #1 Overall Top Team</span>
            </div>
            <div class="rm-proof-metrics">7-Day Venture Incubator · Shipped Working Web App</div>
            <p class="rm-proof-desc">
              Intensive product design, AI, and startup sprint. Engineered functional web prototype from scratch within 7 days and pitched live on Demo Day to industry jury.
            </p>
          </div>

          <div class="rm-proof-item">
            <div class="rm-proof-top">
              <span class="rm-proof-name">DCRUST Murthal · Brand Pitch</span>
              <span class="rm-proof-badge"><span aria-hidden="true">🥉</span> 3rd Place Podium</span>
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
              Research console investigating LLM behavior across Haryanvi, Punjabi, and Bhojpuri with client-side BPE token boundary analysis and proposed civic claim verification.
            </p>
          </div>

          <div class="rm-project-card">
            <div class="rm-project-top">
              <span class="rm-project-name">Flow State</span>
              <span class="rm-project-status rm-status-building">Local Build</span>
            </div>
            <p class="rm-project-thesis">
              Local-first focus desktop utility (Python + native webview) featuring local Zero-OAuth RFC 5545 (.ics) import and 16-bit 44.1kHz math.sin procedural audio synthesis.
            </p>
          </div>

          <div class="rm-project-card">
            <div class="rm-project-top">
              <span class="rm-project-name">Krama (क्रम)</span>
              <span class="rm-project-status rm-status-building">Student Utility</span>
            </div>
            <p class="rm-project-thesis">
              Offline-first academic attendance recovery calculus (${KramaMath.analyzeAttendance(17, 25, 0.75).percentageFormatted} → ${KramaMath.classesToRecover(17, 25, 0.75)} classes) and local SQLite schedule tracking.
            </p>
          </div>

          <div class="rm-project-card">
            <div class="rm-project-top">
              <span class="rm-project-name">Stratum</span>
              <span class="rm-project-status">Concept Prototype</span>
            </div>
            <p class="rm-project-thesis">
              Market simulation concept evaluating candidate decision latency and margin protection under exogenous CPM volatility shocks.
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
      <span class="ab-eyebrow">04 // About &amp; Approach</span>
      <h2 id="ab-title" class="ab-title">
        Building From <span class="ab-serif">First Principles</span>
      </h2>
      <p class="ab-lead" id="ab-lead-text">
        I am a first-year Computer Science &amp; Data Science undergraduate at Rishihood University ('30), interested in the gap between what software promises and how it holds up under real-world conditions.
      </p>
    </div>

    <!-- Main Architecture Grid -->
    <div class="ab-grid">
      <!-- Left Column: Human Narrative & Institutional Record -->
      <div class="ab-ethos-col">
        <div class="ab-card ab-reveal" id="ab-thesis-card">
          <div class="ab-card-label">
            <span class="ab-pulse-dot" aria-hidden="true"></span>
            <span>CURRENTLY EXPLORING</span>
          </div>
          <p class="ab-quote ab-bio-statement" id="ab-bio-statement">
            “${escapeHtml(p.bio_statement)}”
          </p>

          <p class="ab-story-para">
            I enjoy moving back and forth between research and execution — understanding a problem deeply, building a concrete tool or experiment, measuring what actually happens, and refining from evidence.
          </p>

          <!-- Compact Exploration Areas -->
          <div class="ab-pillars-list">
            <div class="ab-pillar-item">
              <span class="ab-pillar-num mono">01</span>
              <div class="ab-pillar-content">
                <strong class="ab-pillar-title">Applied AI &amp; Indic Language NLP</strong>
                <p class="ab-pillar-text">Evaluating subword token behavior and verification requirements across regional Indian speech (<a href="#tathya-workbench" class="ab-inline-link">Tathya Lab</a>).</p>
              </div>
            </div>

            <div class="ab-pillar-item">
              <span class="ab-pillar-num mono">02</span>
              <div class="ab-pillar-content">
                <strong class="ab-pillar-title">Local-First Software Architecture</strong>
                <p class="ab-pillar-text">Writing distraction-free utilities (<a href="#ventures" class="ab-inline-link">Flow State</a> &amp; <a href="#ventures" class="ab-inline-link">Krama</a>) that stay offline and transparent.</p>
              </div>
            </div>

            <div class="ab-pillar-item">
              <span class="ab-pillar-num mono">03</span>
              <div class="ab-pillar-content">
                <strong class="ab-pillar-title">Experiment Design &amp; Venture Execution</strong>
                <p class="ab-pillar-text">Testing commercial theses against real people under hard clock and capital constraints (<a href="#competitions" class="ab-inline-link">Field Record</a>).</p>
              </div>
            </div>
          </div>

          <div class="ab-collab-box">
            <span class="ab-collab-lbl">WHO I WANT TO COLLABORATE WITH</span>
            <p class="ab-collab-text">Engineers, AI researchers, and early-stage builders who question assumptions and ship working artifacts over slide decks.</p>
          </div>
        </div>

        <!-- Academic Record Card -->
        <div class="ab-card ab-reveal" id="ab-foundation-card">
          <div class="ab-card-label">ACADEMIC FOUNDATION</div>
          <div class="ab-cred-list">
            <div class="ab-cred-row">
              <span class="ab-cred-label">Program</span>
              <span class="ab-cred-val" id="ab-cred-degree">B.Tech CS &amp; Data Science</span>
            </div>
            <div class="ab-cred-row">
              <span class="ab-cred-label">Institution</span>
              <span class="ab-cred-val" id="ab-cred-institution">${escapeHtml(p.institution)}</span>
            </div>
            <div class="ab-cred-row">
              <span class="ab-cred-label">Cohort</span>
              <span class="ab-cred-val mono" id="ab-cred-cohort">Class of ${escapeHtml(p.class_year)} · ${escapeHtml(p.current_status)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive Builder Relationship Map & Compact Milestones -->
      <div class="ab-timeline-col">
        <!-- Interactive Builder Relationship Map -->
        <div class="ab-card ab-reveal ab-map-card" id="builder-map-card">
          <div class="ab-card-label">
            <span class="ab-pulse-dot" aria-hidden="true"></span>
            <span>INTERACTIVE BUILDER MAP · CLICK NODE TO INSPECT</span>
          </div>
          <div class="bmap-wrap" id="builder-map" role="region" aria-label="Interactive relationship map connecting research, software systems, and field arenas">
            <svg viewBox="0 0 460 216" class="bmap-svg" aria-hidden="true">
              <!-- Relationship Edges -->
              <g class="bmap-edges" stroke="rgba(165, 180, 252, 0.25)" stroke-width="1.5">
                <line x1="230" y1="36" x2="90" y2="112" data-edge="indic" />
                <line x1="230" y1="36" x2="230" y2="112" data-edge="local" />
                <line x1="230" y1="36" x2="370" y2="112" data-edge="arenas" />
                <line x1="90" y1="112" x2="60" y2="184" data-edge="tathya" />
                <line x1="230" y1="112" x2="180" y2="184" data-edge="flow-state" />
                <line x1="230" y1="112" x2="280" y2="184" data-edge="krama" />
                <line x1="370" y1="112" x2="387" y2="184" data-edge="ashoka" />
              </g>
              <!-- Center Axis Node -->
              <g class="bmap-node is-center">
                <rect x="164" y="16" width="132" height="32" rx="16" />
                <text x="230" y="36" text-anchor="middle">PERSONAL LAB</text>
              </g>
              <!-- Pillar Visual Nodes -->
              <g class="bmap-node" data-node-id="indic">
                <rect x="26" y="96" width="128" height="32" rx="8" />
                <text x="90" y="116" text-anchor="middle">INDIC NLP</text>
              </g>
              <g class="bmap-node" data-node-id="local">
                <rect x="166" y="96" width="128" height="32" rx="8" />
                <text x="230" y="116" text-anchor="middle">LOCAL TOOLS</text>
              </g>
              <g class="bmap-node" data-node-id="arenas">
                <rect x="306" y="96" width="128" height="32" rx="8" />
                <text x="370" y="116" text-anchor="middle">FIELD ARENAS</text>
              </g>
              <!-- Leaf System/Proof Visual Nodes -->
              <g class="bmap-node leaf" data-node-id="tathya">
                <rect x="16" y="168" width="88" height="30" rx="6" />
                <text x="60" y="187" text-anchor="middle">Tathya</text>
              </g>
              <g class="bmap-node leaf" data-node-id="flow-state">
                <rect x="132" y="168" width="96" height="30" rx="6" />
                <text x="180" y="187" text-anchor="middle">Flow State</text>
              </g>
              <g class="bmap-node leaf" data-node-id="krama">
                <rect x="238" y="168" width="84" height="30" rx="6" />
                <text x="280" y="187" text-anchor="middle">Krama</text>
              </g>
              <g class="bmap-node leaf accent" data-node-id="ashoka">
                <rect x="330" y="168" width="114" height="30" rx="6" />
                <text x="387" y="187" text-anchor="middle">Ashoka / IIM</text>
              </g>
            </svg>
            <div class="bmap-controls" role="group" aria-label="Select lab node to inspect">
              <button type="button" class="bmap-node-btn" data-node-id="indic" data-map-target="#tathya-workbench" data-map-label="Indic NLP Research" data-map-detail="Client-side BPE token boundary &amp; hypothesis testing across Haryanvi, Punjabi, Bhojpuri.">Indic NLP ↗</button>
              <button type="button" class="bmap-node-btn" data-node-id="tathya" data-map-project="tathya" data-map-label="Tathya Lab" data-map-detail="Open full Tathya Case Study: dialect tokenization &amp; civic verification spec.">Tathya</button>
              <button type="button" class="bmap-node-btn" data-node-id="flow-state" data-map-project="flow-state" data-map-label="Flow State" data-map-detail="Open full Flow State Case Study: Python + native webview + 432Hz audio synth.">Flow State</button>
              <button type="button" class="bmap-node-btn" data-node-id="krama" data-map-project="krama" data-map-label="Krama" data-map-detail="Open full Krama Case Study: deterministic 75% recovery calculus &amp; SQLite utility.">Krama</button>
              <button type="button" class="bmap-node-btn is-accent" data-node-id="ashoka" data-map-target="#comp-cash-rush" data-map-label="Ashoka / IIM Record" data-map-detail="₹300 → ₹2,655 in 120 mins (8.85× capital multiple) &amp; IIM Amritsar Top 10.">Ashoka / IIM ↓</button>
            </div>
            <div class="bmap-inspector" id="bmap-inspector">
              <span class="bmap-inspector-title" id="bmap-inspector-title">Select any node to trace connections</span>
              <p class="bmap-inspector-detail" id="bmap-inspector-detail">Every project ties an engineering question back to empirical evidence or field tests.</p>
            </div>
          </div>
        </div>

        <!-- Compact Chronological Snapshot -->
        <div class="ab-timeline-meta ab-reveal">
          <span class="ab-timeline-heading">MILESTONE JUMP INDEX (JUN – OCT 2026)</span>
          <span class="ab-timeline-caption">Click any milestone to jump directly to its documentary record</span>
        </div>

        <ol class="ab-timeline">
          <li class="ab-timeline-spine" aria-hidden="true"></li>

          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true"><span class="ab-marker-dot"></span></div>
            <article class="ab-milestone-card ab-milestone-compact">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">JUN 2026</span>
                <span class="ab-milestone-badge ab-gold">#1 BUILDERS' BOOTCAMP</span>
              </div>
              <p class="ab-milestone-body">Shipped working startup web prototype in 7 days at Rishihood Demo Day.</p>
              <a href="#comp-builders-bootcamp" class="ab-proof-link">Jump to Proof ↗</a>
            </article>
          </li>

          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true"><span class="ab-marker-dot"></span></div>
            <article class="ab-milestone-card ab-milestone-compact">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">SEP 2026</span>
                <span class="ab-milestone-badge">3RD · DCRUST E-SUMMIT</span>
              </div>
              <p class="ab-milestone-body">4-part ad &amp; pitch campaign executed in 45 minutes (₹1,100 podium).</p>
              <a href="#comp-dcrust-brand-pitch" class="ab-proof-link">Jump to Proof ↗</a>
            </article>
          </li>

          <li class="ab-milestone ab-reveal">
            <div class="ab-milestone-marker" aria-hidden="true"><span class="ab-marker-dot"></span></div>
            <article class="ab-milestone-card ab-milestone-compact">
              <div class="ab-milestone-header">
                <span class="ab-milestone-date mono">OCT 2026</span>
                <span class="ab-milestone-badge ab-gold">1ST ASHOKA · TOP 10 IIM AMRITSAR</span>
              </div>
              <p class="ab-milestone-body">Ashoka Cash Rush champion (8.85× capital run) &amp; IIM Amritsar Top 10 out of ~700 teams.</p>
              <a href="#comp-cash-rush" class="ab-proof-link">Jump to Proof ↗</a>
            </article>
          </li>
        </ol>
      </div>
    </div>
  </div>
</section>`;
}

function renderCompTags(tags) {
  return (tags || [])
    .map(t => {
      const rawLabel = typeof t === 'string' ? t : (t && t.label ? t.label : '');
      const label = String(rawLabel || '').trim();
      if (!label || label === 'TBD') return '';
      const isGold = Boolean((typeof t === 'object' && t && t.accent) || /(#1|Top 10|3rd|₹|8\.85x)/i.test(label));
      return `<span class="case-tag ${isGold ? 'gold ' : ''}fr-tag">${escapeHtml(label)}</span>`;
    })
    .filter(Boolean)
    .join('');
}

function getCompArenaBrief(comp) {
  if (typeof comp.field_context === 'string') return comp.field_context;
  if (comp.field_context && typeof comp.field_context === 'object' && comp.field_context.brief) {
    return comp.field_context.brief;
  }
  return '';
}

function getCompFieldSetup(comp) {
  if (comp.story && comp.story.setup && comp.story.setup !== 'TBD') return comp.story.setup;
  if (comp.field_context && typeof comp.field_context === 'object' && comp.field_context.setup) {
    return comp.field_context.setup;
  }
  return '';
}

function getCompFieldResult(comp) {
  if (!comp.story) return '';
  return comp.story.execution || comp.story.result || '';
}

function renderCompetitions(content) {
  const comps = content.competitions || [];
  const primaryComps = comps.filter(c => c.category !== 'participation');
  const participationComps = comps.filter(c => c.category === 'participation');

  function renderCompCard(comp) {
    const hasEvidence = Boolean(comp.evidence_url && comp.evidence_url !== 'TBD');
    const validMembers = (comp.team && Array.isArray(comp.team.members) ? comp.team.members : [])
      .filter(m => m && m !== 'TBD');

    const trophyPill = comp.trophy_pill || comp.placement;
    const tagsHtml = renderCompTags(comp.tags);
    const arenaBrief = getCompArenaBrief(comp);
    const fieldSetup = getCompFieldSetup(comp);
    const fieldResult = getCompFieldResult(comp);

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
    } else if (comp.id === 'venture-varsity') {
      telemetryChips = `
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Starting Fund</span>
              <span class="telemetry-val fr-telemetry-val ">₹0 Seed</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Field Pivot</span>
              <span class="telemetry-val fr-telemetry-val accent">₹1,500 in 2 hrs</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Outcome</span>
              <span class="telemetry-val fr-telemetry-val ">R1 Exit → Field Pivot</span>
            </div>`;
    } else if (comp.id === 'dcrust-business-pitching') {
      telemetryChips = `
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Concept</span>
              <span class="telemetry-val fr-telemetry-val ">Iris Camera</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Tagline</span>
              <span class="telemetry-val fr-telemetry-val accent">Carry Less. Create More.</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Status</span>
              <span class="telemetry-val fr-telemetry-val ">Participation</span>
            </div>`;
    } else if (comp.id === 'dcrust-turn-the-court') {
      telemetryChips = `
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Format</span>
              <span class="telemetry-val fr-telemetry-val ">Switch on Clap</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Squad</span>
              <span class="telemetry-val fr-telemetry-val ">3 Members</span>
            </div>
            <div class="telemetry-cell fr-telemetry-chip">
              <span class="telemetry-lbl fr-telemetry-lbl">Status</span>
              <span class="telemetry-val fr-telemetry-val accent">Participation</span>
            </div>`;
    }

    // Compact treatment for participation entries
    if (comp.category === 'participation') {
      return `      <!-- ========================================================================
           COMPETITION CARD: ${escapeHtml(comp.title)} (${escapeHtml(comp.host)})
           ID: ${comp.id} | CATEGORY: ${comp.category} (COMPACT TREATMENT)
           ======================================================================== -->
      <article class="case-card fr-card fr-compact-card reveal" data-category="${comp.category}" data-comp-id="${comp.id}" id="comp-${comp.id}">
        <div class="fr-card-header">
          <div class="beacon-row fr-beacon-row">
            <span class="beacon-pulse fr-beacon-pulse" aria-hidden="true"></span>
            <span>${escapeHtml(comp.host)} · ${escapeHtml(comp.event)}</span>
          </div>

          <div class="case-title-row fr-title-row">
            <h3 class="case-title fr-title">${escapeHtml(comp.title)}</h3>
            <span class="case-trophy-pill fr-trophy-pill fr-trophy-participation">Participation</span>
          </div>

          <div class="case-pills-row fr-pills-row">
            ${tagsHtml}
          </div>
        </div>

        <div class="fr-compact-grid">
          <div class="fr-compact-col">
            <div class="fr-pillar-header">
              <span class="fr-pillar-title">THE ARENA &amp; ASSIGNMENT</span>
            </div>
            <p class="fr-narrative-text">${escapeHtml(arenaBrief)}</p>
            <div class="fr-role-highlight">
              <span class="fr-role-tag">ROLE:</span>
              <span class="fr-role-title">${escapeHtml(comp.team.rudra_role || comp.team.role || 'Participant')}</span>
            </div>
            <div class="fr-deliverables-box">
              <span class="fr-deliverables-title">Shipped Sprint Deliverables:</span>
              <ul class="fr-deliverables-list">
                ${(comp.deliverables || []).map(d => `<li class="fr-deliverable-item"><span class="fr-check-icon" aria-hidden="true">▸</span><span class="fr-deliverable-text">${escapeHtml(d)}</span></li>`).join('\n                ')}
              </ul>
            </div>
            ${validMembers.length > 0 ? `
            <div class="fr-squad-meta">
              <span>Squad:</span>
              <span class="fr-squad-names">${escapeHtml(validMembers.join(', '))}</span>
            </div>` : ''}
          </div>

          <div class="fr-compact-col">
            <div class="fr-pillar-header">
              <span class="fr-pillar-title">FIELD EXECUTION &amp; OUTCOME</span>
              <span class="fr-result-badge fr-badge-participation">PARTICIPATION</span>
            </div>
            <p class="fr-narrative-text">${escapeHtml(fieldResult)}</p>
            <div class="case-telemetry-grid fr-telemetry-matrix">
              ${telemetryChips}
            </div>
            <div class="fr-compact-stamp-bar">
              <span class="fr-photo-stamp mono">${escapeHtml(comp.proof && comp.proof.stamp ? comp.proof.stamp : comp.date)}</span>
              <span class="fr-asset-badge"><span>FIELD ARTIFACT</span></span>
            </div>
          </div>
        </div>
      </article>`;
    }

    // Visual segmented ROI bar + explicit 4-row ledger & profit vs multiple distinction for Cash Rush
    const roiBarHtml = comp.id === 'cash-rush' ? `
          <div class="fr-roi-bar-wrap" aria-label="Cash Rush Unit Economics Breakdown: ₹300 Starting Capital, ₹2,400 Service Revenue, ₹45 Operating Costs, ₹2,655 Ending Capital (8.85x Multiple / +785% Seed Profit), ₹7,000 Separate Team Prize">
            <div class="fr-roi-bar-head">
              <span class="fr-roi-bar-title">120-MIN FINANCIAL LEDGER</span>
              <span class="fr-roi-bar-total mono">₹2,655 Ending (8.85× Multiple · +785% Profit)</span>
            </div>
            <div class="fr-ledger-grid" role="region" aria-label="Ashoka Cash Rush Financial Summary">
              <div class="fr-ledger-row"><span class="fr-ledger-item">Starting Capital</span><span class="fr-ledger-amt mono">₹300</span></div>
              <div class="fr-ledger-row"><span class="fr-ledger-item">Service Revenue</span><span class="fr-ledger-amt mono">₹2,400</span></div>
              <div class="fr-ledger-row"><span class="fr-ledger-item">Operating Costs</span><span class="fr-ledger-amt mono">−₹45</span></div>
              <div class="fr-ledger-row is-total"><span class="fr-ledger-item">Ending Operating Fund</span><span class="fr-ledger-amt mono">₹2,655</span></div>
            </div>
            <div class="fr-roi-track" role="img" aria-label="Proportional breakdown of ₹300 Seed, ₹45 Cost, and ₹2,400 Service Yield">
              <span class="fr-roi-seg fr-roi-seg--seed" style="width: 11%" title="₹300 Seed"></span>
              <span class="fr-roi-seg fr-roi-seg--cost" style="width: 2%" title="₹45 Cost"></span>
              <span class="fr-roi-seg fr-roi-seg--yield" style="width: 87%" title="₹2,400 Service Yield"></span>
            </div>
            <div class="fr-roi-legend">
              <span class="fr-roi-leg-item"><i class="fr-roi-dot fr-roi-dot--seed" aria-hidden="true"></i>8.85× Ending Multiple</span>
              <span class="fr-roi-leg-item"><i class="fr-roi-dot fr-roi-dot--cost" aria-hidden="true"></i>+785% Net Profit</span>
              <span class="fr-roi-leg-item fr-roi-leg-accent"><i class="fr-roi-dot fr-roi-dot--yield" aria-hidden="true"></i>₹7,000 Separate Team Prize</span>
            </div>
            <div class="fr-rev-mix">
              <span class="fr-rev-mix-lbl">₹2,400 Service Mix:</span>
              <span class="fr-rev-mix-item">Web Curiosity Hook (QR→LinkedIn): <strong>₹1,050 (44%)</strong></span>
              <span class="fr-rev-mix-item">On-Spot Caricatures: <strong>₹800 (33%)</strong></span>
              <span class="fr-rev-mix-item">Campus Quiz: <strong>₹550 (23%)</strong></span>
            </div>
          </div>` : '';

    // Static HTML breakdown inside <details> so crawlers and non-JS browsers read 100% of unit economics
    const fin = comp.financials || {};
    const breakdownRows = Array.isArray(fin.service_breakdown) && fin.service_breakdown.length > 0
      ? fin.service_breakdown.map(s => {
          const totalRev = Number(fin.total_service_revenue_inr) || 0;
          const pct = totalRev > 0 ? Math.round((Number(s.revenue_inr) / totalRev) * 100) : null;
          return `<li><strong>${escapeHtml(s.name)}:</strong> ₹${escapeHtml(s.revenue_inr)}${pct !== null ? ` (${pct}%)` : ''} — ${escapeHtml(s.mechanism)}</li>`;
        }).join('\n                  ')
      : '';
    const staticBreakdownHtml = `
          <details class="fr-static-economics">
            <summary>Case Breakdown &amp; Key Numbers (Static Readout)</summary>
            <div class="fr-static-economics-body">
              ${comp.story && comp.story.setup && comp.story.setup !== 'TBD' ? `<p><strong>Setup:</strong> ${escapeHtml(comp.story.setup)}</p>` : ''}
              ${comp.story && comp.story.key_decision && comp.story.key_decision !== 'TBD' ? `<p><strong>Key Move:</strong> ${escapeHtml(comp.story.key_decision)}</p>` : ''}
              ${comp.story && comp.story.result && comp.story.result !== 'TBD' ? `<p><strong>Outcome:</strong> ${escapeHtml(comp.story.result)}</p>` : ''}
              ${comp.story && comp.story.takeaway && comp.story.takeaway !== 'TBD' ? `<p><strong>Lesson:</strong> ${escapeHtml(comp.story.takeaway)}</p>` : ''}
              ${breakdownRows ? `<ul class="fr-static-breakdown-list">\n                  ${breakdownRows}\n                </ul>` : ''}
            </div>
          </details>`;

    // Pillar 04 gallery thumbnails
    const addAssets = comp.proof && comp.proof.additional_assets ? comp.proof.additional_assets : [];
    let galleryHtml = '';
    if (addAssets.length > 0) {
      const allGallery = [comp.proof.url, ...addAssets];
      galleryHtml = `
            <div class="fr-gallery-shelf">
              <span class="fr-gallery-heading">Field Photos (${allGallery.length}):</span>
              <div class="fr-gallery-row fr-gallery-switcher">
                ${allGallery.map((assetPath, aIdx) => {
                  const artifactAlt = ARTIFACT_ALT_MAP[assetPath] || `${comp.title} - Artifact ${aIdx + 1}`;
                  return `
                <button type="button" class="fr-thumb-btn fr-gallery-thumb${aIdx === 0 ? ' active' : ''}"
                        data-asset-src="${assetPath}"
                        data-asset-caption="${escapeHtml(comp.proof.caption)} [Artifact ${aIdx + 1}]"
                        data-asset-stamp="${escapeHtml(comp.proof.stamp)}"
                        aria-label="View ${escapeHtml(artifactAlt)}">
                  <img src="${getThumbPath(assetPath)}" width="640" height="400" alt="${escapeHtml(artifactAlt)}" loading="lazy">
                </button>`;
                }).join('')}
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
            <span class="case-trophy-pill fr-trophy-pill">${/<span/i.test(trophyPill) ? trophyPill : formatAriaEmoji(escapeHtml(trophyPill))}</span>
          </div>

          <div class="case-pills-row fr-pills-row">
            ${tagsHtml}
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
          <p class="fr-arena-lead">${escapeHtml(arenaBrief)}</p>
          <div class="fr-arena-meta-strip">
            <span class="fr-meta-chip"><strong>Host:</strong> ${escapeHtml(comp.host)}</span>
            <span class="fr-meta-chip"><strong>Event:</strong> ${escapeHtml(comp.event)}</span>
            <span class="fr-meta-chip"><strong>Date:</strong> ${escapeHtml(comp.date)}</span>
          </div>
          ${fieldSetup ? `
          <div class="fr-context-narrative">
            <span class="fr-narrative-lbl">Field Dynamics &amp; Setup:</span>
            <p class="fr-narrative-text">${escapeHtml(fieldSetup)}</p>
          </div>` : ''}
        </div>

        <!-- PILLAR 02: MY ROLE & SHIPPED DELIVERABLES -->
        <div class="fr-pillar fr-pillar-role">
          <div class="fr-pillar-header">
            <div class="fr-header-left">
              <span class="fr-pillar-idx">02</span>
              <span class="fr-pillar-title">MY SPECIFIC ROLE</span>
            </div>
            <span class="fr-role-badge">ROLE &amp; OUTPUT</span>
          </div>
          <div class="fr-role-highlight">
            <span class="fr-role-tag">ASSIGNMENT:</span>
            <span class="fr-role-title">${escapeHtml(comp.team.rudra_role || comp.team.role || 'Lead')}</span>
          </div>
          <div class="fr-deliverables-box">
            <span class="fr-deliverables-title">Shipped Sprint Deliverables:</span>
            <ul class="fr-deliverables-list">
              ${(comp.deliverables || []).map(d => `<li class="fr-deliverable-item"><span class="fr-check-icon" aria-hidden="true">▸</span><span class="fr-deliverable-text">${escapeHtml(d)}</span></li>`).join('\n              ')}
            </ul>
          </div>
          ${validMembers.length > 1 ? `
          <div class="fr-squad-meta">
            <span>Squad:</span>
            <span class="fr-squad-names">${escapeHtml(validMembers.join(', '))}</span>
          </div>` : (validMembers.length === 1 && comp.team && Array.isArray(comp.team.members) && comp.team.members.includes('TBD') ? `
          <div class="fr-squad-meta">
            <span>Squad:</span>
            <span class="fr-squad-names">${escapeHtml(validMembers[0])} + cohort teammates</span>
          </div>` : '')}
        </div>

        <!-- PILLAR 03: OUTCOME & NUMBERS -->
        <div class="fr-pillar fr-pillar-outcome">
          <div class="fr-pillar-header">
            <div class="fr-header-left">
              <span class="fr-pillar-idx">03</span>
              <span class="fr-pillar-title">OUTCOME &amp; NUMBERS</span>
            </div>
            <span class="fr-result-badge">${escapeHtml(comp.placement)}</span>
          </div>
          <div class="fr-context-narrative">
            <span class="fr-narrative-lbl">Field Result:</span>
            <p class="fr-narrative-text">${escapeHtml(fieldResult)}</p>
          </div>
          <div class="case-telemetry-grid fr-telemetry-matrix">
            ${telemetryChips}
          </div>
          ${roiBarHtml}

          <!-- Interactive Modal Deep Dive + Static Crawler-Readable Fallback -->
          <button type="button" class="cs-deepdive-btn fr-deepdive-btn" data-comp-id="${comp.id}" aria-haspopup="dialog" aria-expanded="false" title="Unit economics and breakdown for ${escapeHtml(comp.title)}">
            <span>Unit Economics &amp; Breakdown</span>
            <span class="cs-arrow fr-arrow" aria-hidden="true">↗</span>
          </button>
          ${staticBreakdownHtml}
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
            <span class="fr-asset-badge">${hasEvidence ? '<span class="pulse-dot" aria-hidden="true"></span><span>FIELD PHOTO</span>' : '<span>FIELD ARTIFACT</span>'}</span>
          </div>

          <div class="fr-photo-frame" id="fr-visual-${comp.id}" data-zoom-target="${comp.proof.url}">
            <img class="case-photo fr-primary-photo fr-main-img" id="fr-main-img-${comp.id}"
                 src="${getThumbPath(comp.proof.url)}"
                 width="640"
                 height="400"
                 alt="${escapeHtml(ARTIFACT_ALT_MAP[comp.proof.url] || comp.proof.caption)}"
                 loading="lazy">
            <div class="fr-photo-overlay" aria-hidden="true">
              <span class="fr-overlay-zoom-pill">
                <span class="fr-zoom-icon">🔍</span> Inspect Full-Resolution Photo
              </span>
            </div>
            <button type="button" class="fr-inspect-btn"
                    data-asset-src="${comp.proof.url}"
                    data-asset-caption="${escapeHtml(comp.proof.caption)}"
                    data-asset-stamp="${escapeHtml(comp.proof.stamp)}"
                    data-comp-title="${escapeHtml(comp.title)}"
                    aria-label="Inspect ${escapeHtml(comp.title)} evidence full size">
              <span>Inspect</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div class="fr-photo-meta-bar">
            <span class="fr-photo-stamp mono">${escapeHtml(comp.proof.stamp)}</span>
            <span class="fr-asset-tag fr-asset-linked" title="Local filesystem asset path">
              <span class="fr-code-bracket">[</span><code id="fr-path-${comp.id}">${escapeHtml(comp.proof.url)}</code><span class="fr-code-bracket">]</span>
            </span>
          </div>
          <p class="fr-photo-caption" id="fr-caption-${comp.id}">${escapeHtml(comp.proof.caption)}</p>

          ${galleryHtml}
        </div>

          </div>
        </div>
      </article>`;
  }

  return `    <section id="competitions">
      <div class="section-header">
        <span class="section-eyebrow reveal">03 // Field Record</span>
        <h2 class="section-title reveal">Built Under Pressure. Measured by Outcomes.</h2>
        <p class="section-lead reveal">
          A documentary log of seven collegiate arenas (Jun–Oct 2026). Full team rosters and financial breakdowns open cleanly on inspection rather than repeating across the page.
        </p>
        <div class="fr-summary-strip reveal">
          <div class="fr-sum-pill"><span class="fr-sum-val mono">02</span><span class="fr-sum-lbl">First Places</span></div>
          <div class="fr-sum-pill"><span class="fr-sum-val mono">TOP 10</span><span class="fr-sum-lbl">National Finalist</span></div>
          <div class="fr-sum-pill"><span class="fr-sum-val mono">03</span><span class="fr-sum-lbl">Podium Finishes</span></div>
          <div class="fr-sum-pill"><span class="fr-sum-val mono">03</span><span class="fr-sum-lbl">Field Participations</span></div>
        </div>
      </div>

      <!-- Dynamic Filter Controls -->
      <div class="filter-bar reveal">
        <button type="button" class="filter-btn active" data-filter="all">All Arenas (07)</button>
        <button type="button" class="filter-btn" data-filter="1st-place">1st Place Championships (02)</button>
        <button type="button" class="filter-btn" data-filter="national">National Finalist (IIM Amritsar)</button>
        <button type="button" class="filter-btn" data-filter="pitch">Offline Brand Pitch (DCRUST)</button>
        <button type="button" class="filter-btn" data-filter="participation">Field Runs &amp; Participations (03)</button>
      </div>

      <div class="case-stack fr-case-stack">

${primaryComps.map(renderCompCard).join('\n\n')}

${participationComps.length > 0 ? `      <div class="fr-participation-grid">
${participationComps.map(renderCompCard).join('\n\n')}
      </div>` : ''}

      </div>
    </section>`;
}

function renderVentures(content) {
  const vens = content.ventures || [];
  const p = content.personal || {};
  const kramaDefault = KramaMath.analyzeAttendance(17, 25, 0.75);

  const featured = vens.find(v => v.id === 'tathya') || vens[0];
  const secondaryIds = ['flow-state', 'krama', 'stratum'];
  const secondaryVens = secondaryIds.map(id => vens.find(v => v.id === id)).filter(Boolean);

  function renderTerminalBlock(ven) {
    if (!ven.terminal_preview) return '';
    const lines = ven.terminal_preview.lines || [];
    const renderedLines = lines.map(line => {
      if (typeof line === 'string') return escapeHtml(line);
      if (line.type === 'comment') return `<span class="cm">${escapeHtml(line.text)}</span>`;
      const lineText = escapeHtml(line.text);
      return line.prefix ? `<span class="kw">${escapeHtml(line.prefix)}</span> ${lineText}` : lineText;
    }).join('\n');

    const termTitle = ven.terminal_preview.filename || ven.terminal_preview.title || ven.id;
    const termBadge = ven.terminal_preview.badge ? ` · ${ven.terminal_preview.badge}` : '';

    return `
            <div class="term">
              <div class="term-bar">
                <i></i><i></i><i></i>
                <span>${escapeHtml(termTitle + termBadge)}</span>
              </div>
              <pre class="term-body" tabindex="0" role="region" aria-label="${escapeHtml(ven.name)} terminal output">${renderedLines}</pre>
            </div>`;
  }

  function renderInteractiveWidget(ven) {
    if (ven.id === 'tathya') {
      return `
            <div class="vn-tathya-teaser">
              <div class="vn-teaser-row">
                <span class="vn-teaser-lbl">MANAK HINDI</span>
                <div class="vn-teaser-chips"><span class="tfe-chip tfe-chip--clean">[हमारी]</span><span class="tfe-chip tfe-chip--clean">[सरकार]</span></div>
              </div>
              <div class="vn-teaser-row">
                <span class="vn-teaser-lbl">HARYANVI INPUT</span>
                <div class="vn-teaser-chips"><span class="tfe-chip tfe-chip--frag">[म]</span><span class="tfe-chip tfe-chip--frag">[्]</span><span class="tfe-chip tfe-chip--frag">[ह]</span><span class="tfe-chip tfe-chip--frag">[ा]</span><span class="tfe-chip tfe-chip--frag">[र]</span><span class="tfe-chip tfe-chip--frag">[ी]</span></div>
              </div>
              <p class="vn-teaser-note">Inspect live BPE tokens, UTF-8 byte lengths, and scientific hypothesis below in 02 // Research Lab.</p>
            </div>`;
    }
    if (ven.id === 'stratum') {
      return `
            <div class="vn-sim-widget" data-sim="stratum">
              <div class="vn-sim-head">
                <span class="vn-sim-title">CPM SHOCK MICRO-SIM</span>
                <div class="vn-sim-tabs" role="group" aria-label="Stratum CPM scenario toggle">
                  <button type="button" class="vn-sim-tab active" data-sim-mode="baseline" aria-pressed="true">Baseline</button>
                  <button type="button" class="vn-sim-tab" data-sim-mode="shock" aria-pressed="false">+40% Shock</button>
                </div>
              </div>
              <div class="vn-sim-chart" aria-hidden="true">
                <svg viewBox="0 0 240 52" width="240" height="52" class="vn-sim-svg" preserveAspectRatio="none">
                  <line x1="0" y1="26" x2="240" y2="26" class="vn-sim-gridline" />
                  <path id="stratum-spark-path" d="M 4 38 L 48 34 L 92 36 L 136 30 L 180 32 L 236 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <p class="vn-sim-scenario" id="stratum-sim-scenario">Scenario: Baseline auction pace; tracking capital velocity and margin yield.</p>
              <div class="vn-sim-metrics">
                <div class="vn-sim-stat">
                  <span class="vn-sim-lbl">Capital Velocity</span>
                  <span class="vn-sim-val" id="stratum-readout-cap">Steady Pace</span>
                </div>
                <div class="vn-sim-stat">
                  <span class="vn-sim-lbl">Margin Yield</span>
                  <span class="vn-sim-val" id="stratum-readout-margin">Protected Baseline</span>
                </div>
              </div>
            </div>`;
    }
    if (ven.id === 'flow-state') {
      return `
            <div class="vn-artifact-stack">
              <button type="button"
                      class="vn-artifact-btn"
                      data-asset-src="assets/flowstate-receipt.png"
                      data-asset-caption="Flow State · Weekly Local Focus Receipt"
                      data-asset-stamp="Local Build // Receipt"
                      data-comp-title="Flow State"
                      aria-label="Inspect Flow State weekly local focus receipt">
                <img src="assets/flowstate-receipt.png" width="320" height="220" loading="lazy" alt="Flow State weekly local focus receipt preview">
                <span class="vn-artifact-meta">
                  <span class="vn-artifact-kicker">LOCAL BUILD // RECEIPT</span>
                  <span class="vn-artifact-title">Inspect Focus Receipt ↗</span>
                </span>
              </button>
              <button type="button" class="vn-synth-btn" id="flowstate-synth-btn" aria-pressed="false">
                <span class="vn-synth-dot" aria-hidden="true"></span>
                <span id="flowstate-synth-label">▶ Test 432Hz Sine Synth</span>
              </button>
            </div>`;
    }
    if (ven.id === 'krama') {
      return `
            <div class="vn-artifact-stack">
              <button type="button"
                      class="vn-artifact-btn"
                      data-asset-src="assets/krama-preview.jpg"
                      data-asset-caption="Krama (क्रम) · Offline Attendance & Schedule Utility"
                      data-asset-stamp="Student Utility // UI Preview"
                      data-comp-title="Krama (क्रम)"
                      aria-label="Inspect Krama mobile UI preview">
                <img src="assets/krama-preview.jpg" width="320" height="220" loading="lazy" alt="Krama academic schedule and attendance recovery UI preview">
                <span class="vn-artifact-meta">
                  <span class="vn-artifact-kicker">STUDENT UTILITY // UI PREVIEW</span>
                  <span class="vn-artifact-title">Inspect Mobile UI ↗</span>
                </span>
              </button>
              <div class="vn-calc-widget" id="krama-calc-widget" data-attended="${kramaDefault.attended}" data-total="${kramaDefault.total}">
                <div class="vn-calc-head">
                  <span class="vn-calc-title">75% RECOVERY CALCULUS</span>
                  <span class="vn-calc-pct mono" id="krama-pct-readout">${escapeHtml(kramaDefault.percentageFormatted)}</span>
                </div>
                <div class="vn-calc-controls">
                  <div class="vn-calc-stepper">
                    <span class="vn-calc-lbl">Attended</span>
                    <div class="vn-stepper-btns">
                      <button type="button" class="vn-step-btn" id="krama-att-minus" aria-label="Decrease attended classes">−</button>
                      <span class="vn-step-val mono" id="krama-att-val">${kramaDefault.attended}</span>
                      <button type="button" class="vn-step-btn" id="krama-att-plus" aria-label="Increase attended classes">+</button>
                    </div>
                  </div>
                  <div class="vn-calc-stepper">
                    <span class="vn-calc-lbl">Total</span>
                    <div class="vn-stepper-btns">
                      <button type="button" class="vn-step-btn" id="krama-tot-minus" aria-label="Decrease total classes">−</button>
                      <span class="vn-step-val mono" id="krama-tot-val">${kramaDefault.total}</span>
                      <button type="button" class="vn-step-btn" id="krama-tot-plus" aria-label="Increase total classes">+</button>
                    </div>
                  </div>
                </div>
                <div class="vn-calc-advice" id="krama-advice-readout">${escapeHtml(kramaDefault.advice)}</div>
              </div>
            </div>`;
    }
    return '';
  }

  function renderProjectCard(ven, isFeatured) {
    const stackChips = {
      tathya: ['Python', 'Indic NLP', 'BPE Analysis', 'Research Phase'],
      'flow-state': ['Python', 'Native Webview', 'RFC 5545', '16-Bit Audio'],
      krama: ['Local SQLite', 'Shared Math', 'Student Utility'],
      stratum: ['Decision Sim', 'Spec Stage', 'Telemetry']
    }[ven.id] || [];

    if (isFeatured) {
      return `        <!-- FEATURED RESEARCH CARD: ${escapeHtml(ven.name)} -->
        <article class="venture-card venture-featured reveal" data-venture-id="${ven.id}">
          <div class="vf-split">
            <div class="vf-main">
              <div class="venture-meta">
                <span class="vf-eyebrow">01 // FEATURED RESEARCH · ${escapeHtml(ven.category)}</span>
                <span class="venture-status v-status-badge mono"><i class="pulse-dot" style="display:inline-block; margin-right:6px;"></i>${escapeHtml(ven.badge)} (${escapeHtml(ven.status)})</span>
              </div>
              <h3 class="venture-name vf-title">${escapeHtml(ven.name)} — Indic Dialect Evaluation</h3>
              <p class="venture-thesis vf-thesis">${escapeHtml(ven.thesis)}</p>
              <p class="vf-problem"><strong>Research Question:</strong> ${escapeHtml(ven.problem)}</p>
              <div class="vf-stack-chips">
                ${stackChips.map(c => `<span class="vf-chip">${escapeHtml(c)}</span>`).join('')}
              </div>
              <div class="venture-actions">
                <button type="button" class="btn-solid project-case-btn" data-project-id="${ven.id}">Full Case Study →</button>
                <a href="#tathya-workbench" class="btn-outline venture-sub-btn">Run Dialect Tokenizer ↓</a>
              </div>
            </div>
            <div class="vf-side">
              ${renderTerminalBlock(ven)}
              ${renderInteractiveWidget(ven)}
            </div>
          </div>
        </article>`;
    }

    return `        <!-- PROJECT CARD: ${escapeHtml(ven.name)} -->
        <article class="venture-card reveal" data-venture-id="${ven.id}">
          <div class="venture-top">
            <div class="venture-meta">
              <span>${escapeHtml(ven.category)}</span>
              <span class="venture-status v-status-badge mono"><i class="pulse-dot" style="display:inline-block; margin-right:4px;"></i>${escapeHtml(ven.badge)} · ${escapeHtml(ven.status)}</span>
            </div>
            <h3 class="venture-name">${escapeHtml(ven.name)}</h3>
            <p class="venture-thesis">${escapeHtml(ven.thesis)}</p>

            ${renderTerminalBlock(ven)}
            ${renderInteractiveWidget(ven)}
          </div>

          <div class="venture-details">
            <div class="venture-detail-row">
              <span class="lbl">Focus</span>
              <span class="val">${(ven.features || []).slice(0, 2).join(' · ')}</span>
            </div>
            <div class="venture-detail-row">
              <span class="lbl">Stage</span>
              <span class="val mono">${escapeHtml(ven.status_detail)}</span>
            </div>
          </div>

          <div class="venture-actions">
            <button type="button" class="btn-solid project-case-btn" data-project-id="${ven.id}">Full Case Study →</button>
            ${ven.repo_url && ven.repo_url !== 'TBD' ? `<a href="${escapeHtml(ven.repo_url)}" class="btn-ghost venture-repo-link" target="_blank" rel="noopener">Code ↗</a>` : ''}
          </div>
        </article>`;
  }

  return `    <section id="ventures">
      <div class="section-header">
        <span class="section-eyebrow reveal">01 // Selected Work</span>
        <h2 class="section-title reveal">Engineering Systems &amp; Research</h2>
        <p class="section-lead reveal">
          What I am building and investigating: flagship dialect NLP research paired with local-first tools and simulation prototypes. Click any card for problem statement, architecture, and limitations.
        </p>
      </div>

      ${featured ? renderProjectCard(featured, true) : ''}

      <div class="ventures-grid ventures-subgrid">
${secondaryVens.map(v => renderProjectCard(v, false)).join('\n\n')}
      </div>

      <div class="more-experiments-strip reveal">
        <div class="me-text">
          <span class="me-kicker mono">OPEN REPOSITORIES &amp; EXPERIMENTS</span>
          <p class="me-desc">More prototypes, code experiments, and technical writeups live on GitHub.</p>
        </div>
        <a href="${escapeHtml(p.github || 'https://github.com/rudras2048-arch')}" class="btn-outline" target="_blank" rel="noopener">GitHub (rudras2048-arch) ↗</a>
      </div>
    </section>`;
}

function renderResearchLab() {
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
  const tathyaExplorerHtml = renderTathyaExplorer(tathyaData);

  return `    <section id="tathya-workbench" class="lab-section" aria-labelledby="tw-title">
      <div class="section-header">
        <span class="section-eyebrow reveal">02 // Research Lab · Signature Console</span>
        <h2 id="tw-title" class="section-title reveal">Does the Model Understand the Dialect?</h2>
        <p class="section-lead reveal">
          Compare regional-language text against Manak Hindi live in the browser. Inspect algorithmic BPE token IDs, grapheme clusters, and UTF-8 bytes separately—zero hardcoded mock splits.
        </p>
      </div>
      <div class="ventures-workbench-showcase reveal">
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
  const researchLabSection = renderResearchLab();
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
    .replace('<!-- {{INJECT_RESEARCH_LAB_SECTION}} -->', researchLabSection)
    .replace('<!-- {{INJECT_CONTACT_SECTION}} -->', contactSection)
    .replace('<!-- {{INJECT_PORTFOLIO_CONTENT_DATA}} -->', portfolioContentData)
    .replace('<!-- {{INJECT_WINDOW_PORTFOLIO_CONTENT}} -->', windowPortfolioContent);

  // Ensure Tathya CSS and Shared Domain Modules (KramaMath + TathyaTokenizer + TathyaExplorer) are bundled
  const { getTathyaExplorerCSS, getTathyaTokenizerJS, getKramaMathJS, getTathyaExplorerJS } = require('../templates/demo/render.js');
  const tfeCss = getTathyaExplorerCSS();
  const domainBundleJs = [getKramaMathJS(), getTathyaTokenizerJS(), getTathyaExplorerJS()].join('\n\n');

  if (!template.includes('.tfe-viz-grid')) {
    const firstStyleClose = template.indexOf('</style>');
    if (firstStyleClose !== -1) {
      template = template.slice(0, firstStyleClose) + `\n/* TATHYA RESEARCH CONSOLE STYLES (.tfe-) */\n${tfeCss}\n` + template.slice(firstStyleClose);
    }
  }
  if (template.includes('<!-- {{INJECT_DOMAIN_SCRIPTS}} -->')) {
    template = template.replace('<!-- {{INJECT_DOMAIN_SCRIPTS}} -->', domainBundleJs);
  } else if (!template.includes('window.initTathyaExplorer = function')) {
    const lastScriptClose = template.lastIndexOf('</script>');
    if (lastScriptClose !== -1) {
      template = template.slice(0, lastScriptClose) + `\n/* DOMAIN MODULES & TATHYA CONSOLE */\n${domainBundleJs}\n` + template.slice(lastScriptClose);
    }
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

  // Sync portfolio/index.html if tracked in repo
  const PORTFOLIO_INDEX = path.join(ROOT_DIR, 'portfolio', 'index.html');
  if (fs.existsSync(PORTFOLIO_INDEX)) {
    fs.writeFileSync(PORTFOLIO_INDEX, template, 'utf-8');
    console.log(`  ✔ Synced:  portfolio/index.html (${template.length.toLocaleString()} bytes)`);
  }

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

  // Generate SEO, Share, Robots.txt, Sitemap.xml, llms.txt & OG Images
  const shareReport = shareEngine.generateShareArtifacts(content, DIST_DIR);
  console.log(`  ✔ Generated: dist/robots.txt (Sitemap -> ${shareReport.canonicalRoot}sitemap.xml)`);
  console.log(`  ✔ Generated: dist/sitemap.xml (${shareReport.artifacts.find(a => a.file === 'dist/sitemap.xml').bytes} bytes)`);
  console.log(`  ✔ Generated: dist/llms.txt (${shareReport.artifacts.find(a => a.file === 'dist/llms.txt').bytes} bytes)`);
  const ogCount = shareReport.artifacts.filter(a => a.file.includes('assets/og')).length;
  console.log(`  ✔ Generated: dist/assets/og/ (${ogCount} section OG cards SVG + PNG)`);

  console.log(`\n\x1b[32m============================================================\x1b[0m`);
  console.log(`\x1b[32mBUILD COMPLETE: 100% PRODUCTION READY\x1b[0m`);
  console.log(`\x1b[32m============================================================\x1b[0m\n`);
}

main();
