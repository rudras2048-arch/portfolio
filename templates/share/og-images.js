/**
 * ============================================================================
 * templates/share/og-images.js
 * Generates section-specific OpenGraph images (Hero, Competitions, Ventures, Contact)
 * in dist/assets/og/ adhering to design system tokens (1200x630 SVG + PNG).
 * Strictly standard XML / SVG well-formed, zero-dependency.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getDeploymentDomain, getCanonicalUrl } = require('./config');

// Escape XML special characters
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Splits text into lines for SVG <tspan> rendering without foreignObject
 */
function wrapSvgLines(text, maxChars = 32, maxLines = 4) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let current = '';

  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

/**
 * Shared SVG base layout shell with tactical grid, glow, and typography tokens
 */
function renderSvgShell({ kicker, title, subtitle, contentBody, footerTag, sectionNum }) {
  const safeKicker = escapeXml(String(kicker || '').toUpperCase());
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeSection = escapeXml(sectionNum || 'SEC // 00');
  const safeFooter = escapeXml(String(footerTag || 'VERIFIED FIELD RECORD · CLASS OF 2030').toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0C0C0E" />
      <stop offset="60%" stop-color="#111115" />
      <stop offset="100%" stop-color="#16161C" />
    </linearGradient>

    <!-- Tactical Accent Gradient -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#A5BA28" />
      <stop offset="100%" stop-color="#BEE024" />
    </linearGradient>

    <!-- Subtle Radial Glow -->
    <radialGradient id="cornerGlow" cx="90%" cy="10%" r="60%">
      <stop offset="0%" stop-color="#A5BA28" stop-opacity="0.16" />
      <stop offset="50%" stop-color="#A5BA28" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#A5BA28" stop-opacity="0" />
    </radialGradient>

    <!-- Grid Pattern -->
    <pattern id="tacticalGrid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.03" />
    </pattern>

    <style>
      .font-mono { font-family: 'JetBrains Mono', 'Menlo', 'Consolas', monospace; }
      .font-display { font-family: 'Syne', -apple-system, sans-serif; font-weight: 700; }
      .font-body { font-family: 'DM Sans', -apple-system, sans-serif; }
      .font-serif { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; }
    </style>
  </defs>

  <!-- Base Canvas -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect width="1200" height="630" fill="url(#tacticalGrid)" />
  <rect width="1200" height="630" fill="url(#cornerGlow)" />

  <!-- Outer Structural Hairline Border -->
  <rect x="24" y="24" width="1152" height="582" rx="18" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5" />

  <!-- Top Header / Navigation HUD -->
  <g transform="translate(64, 60)">
    <!-- Beacon Dot -->
    <circle cx="6" cy="6" r="5" fill="#A5BA28" />
    <circle cx="6" cy="6" r="9" fill="none" stroke="#A5BA28" stroke-opacity="0.35" stroke-width="1.5" />
    
    <text x="28" y="10" class="font-mono" font-size="12" font-weight="600" fill="#A5BA28" letter-spacing="2">
      RUDRA SHARMA // EVIDENCE, NOT NOISE
    </text>

    <text x="1072" y="10" text-anchor="end" class="font-mono" font-size="12" font-weight="500" fill="#5C5A53" letter-spacing="1.5">
      ${safeSection}
    </text>
    <line x1="0" y1="28" x2="1072" y2="28" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
  </g>

  <!-- Main Hero Block -->
  <g transform="translate(64, 120)">
    <!-- Kicker Eyebrow -->
    <text x="0" y="20" class="font-mono" font-size="13" font-weight="600" fill="#9C988D" letter-spacing="2.5">
      ${safeKicker}
    </text>

    <!-- Main Title -->
    <text x="0" y="80" class="font-display" font-size="52" fill="#F5EFE6" letter-spacing="-1">
      ${safeTitle}
    </text>

    <!-- Subtitle / Statement -->
    <text x="0" y="120" class="font-body" font-size="18" fill="#9C988D" font-weight="400">
      ${safeSubtitle}
    </text>
  </g>

  <!-- Section-Specific Content Injection -->
  <g transform="translate(64, 275)">
    ${contentBody}
  </g>

  <!-- Bottom Metadata / Watermark Footer -->
  <g transform="translate(64, 565)">
    <line x1="0" y1="0" x2="1072" y2="0" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
    <text x="0" y="24" class="font-mono" font-size="12" font-weight="600" fill="#A5BA28" letter-spacing="1.5">
      ${safeFooter}
    </text>
    <text x="1072" y="24" text-anchor="end" class="font-mono" font-size="12" fill="#5C5A53">
      B.Tech CS &amp; Data Science · Rishihood University
    </text>
  </g>
</svg>`;
}

/**
 * 1. Hero Section OpenGraph Image
 */
function renderHeroOg(content) {
  const p = (content && content.personal) || {};
  const stats = (content && content.hero && content.hero.stats) || [];

  const cardsSvg = stats.map((s, idx) => {
    const x = idx * 274;
    const safeLabel = escapeXml(String(s.label || '').toUpperCase());
    return `
    <g transform="translate(${x}, 0)">
      <rect width="254" height="235" rx="14" fill="#131317" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
      <rect x="0" y="0" width="254" height="4" fill="url(#accentGrad)" opacity="0.8" rx="2" />
      <text x="24" y="65" class="font-mono" font-size="38" font-weight="700" fill="#F5EFE6">${escapeXml(s.value)}</text>
      <text x="24" y="105" class="font-mono" font-size="14" font-weight="600" fill="#A5BA28" letter-spacing="1">${safeLabel}</text>
      <text x="24" y="145" class="font-body" font-size="14" fill="#9C988D">${escapeXml(s.description)}</text>
      <g transform="translate(24, 185)">
        <rect width="90" height="24" rx="12" fill="#A5BA28" fill-opacity="0.12" stroke="#A5BA28" stroke-opacity="0.3" stroke-width="1" />
        <text x="45" y="16" text-anchor="middle" class="font-mono" font-size="10" font-weight="600" fill="#A5BA28">AUDITED</text>
      </g>
    </g>`;
  }).join('');

  return renderSvgShell({
    sectionNum: 'OVERVIEW // 00',
    kicker: p.headline || "First-Year B.Tech CS & Data Science · Builder · Rishihood '30",
    title: p.name || 'Rudra Sharma',
    subtitle: p.bio_statement || 'Curiosity starts the work. Execution proves it.',
    contentBody: cardsSvg,
    footerTag: '2 CHAMPIONSHIPS · TOP 5 NATIONAL FINALIST · 4 VENTURES'
  });
}

/**
 * 2. Competitions Section OpenGraph Image
 */
function renderCompetitionsOg(content) {
  const comps = (content && content.competitions) || [];

  const cardsSvg = comps.map((comp, idx) => {
    const x = idx * 274;
    const highlight = comp.tags && comp.tags[0] ? comp.tags[0] : (comp.placement || '');
    const dateHost = `${comp.host || ''} · ${comp.date || ''}`;
    const safePlacement = escapeXml(String(comp.placement || '').toUpperCase());

    return `
    <g transform="translate(${x}, 0)">
      <rect width="254" height="235" rx="14" fill="#131317" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
      <rect x="0" y="0" width="254" height="4" fill="#A5BA28" opacity="0.9" rx="2" />
      <text x="20" y="38" class="font-mono" font-size="11" font-weight="600" fill="#A5BA28" letter-spacing="1">${safePlacement}</text>
      <text x="20" y="75" class="font-display" font-size="18" fill="#F5EFE6">${escapeXml(comp.title)}</text>
      <text x="20" y="105" class="font-body" font-size="13" fill="#9C988D">${escapeXml(dateHost)}</text>
      <rect x="20" y="130" width="214" height="45" rx="8" fill="#1B1B22" stroke="#FFFFFF" stroke-opacity="0.05" />
      <text x="30" y="158" class="font-mono" font-size="12" font-weight="600" fill="#BEE024">${escapeXml(highlight)}</text>
      <g transform="translate(20, 192)">
        <circle cx="6" cy="6" r="4" fill="#A5BA28" />
        <text x="18" y="10" class="font-mono" font-size="10" fill="#5C5A53">VERIFIED EVIDENCE</text>
      </g>
    </g>`;
  }).join('');

  return renderSvgShell({
    sectionNum: 'RECORD // 01',
    kicker: 'Verified Competitive Field Record',
    title: 'Championships & National Podiums',
    subtitle: 'Campus startup simulations, margin optimization, and venture sprints.',
    contentBody: cardsSvg,
    footerTag: 'ASHOKA CASH RUSH #1 · IIM AMRITSAR TOP 5 · BOOTCAMP DEMO DAY #1'
  });
}

/**
 * 3. Ventures Section OpenGraph Image
 */
function renderVenturesOg(content) {
  const vens = (content && content.ventures) || [];

  const cardsSvg = vens.map((ven, idx) => {
    const x = idx * 274;
    const safeBadge = escapeXml(String(ven.badge || ven.status || '').toUpperCase());
    const safeStatus = escapeXml(String(ven.status || '').toUpperCase());
    const lines = wrapSvgLines(ven.thesis || ven.problem || '', 30, 4);

    return `
    <g transform="translate(${x}, 0)">
      <rect width="254" height="235" rx="14" fill="#131317" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
      <rect x="0" y="0" width="254" height="4" fill="url(#accentGrad)" opacity="0.8" rx="2" />
      <text x="20" y="38" class="font-mono" font-size="11" font-weight="600" fill="#A5BA28">${safeBadge}</text>
      <text x="20" y="75" class="font-display" font-size="19" fill="#F5EFE6">${escapeXml(ven.name)}</text>
      <text x="20" y="110" class="font-body" font-size="12" fill="#9C988D">
        ${lines.map((l, lIdx) => `<tspan x="20" dy="${lIdx === 0 ? 0 : 18}">${escapeXml(l)}</tspan>`).join('')}
      </text>
      <g transform="translate(20, 192)">
        <rect width="110" height="22" rx="11" fill="#1B1B22" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
        <text x="55" y="15" text-anchor="middle" class="font-mono" font-size="10" fill="#A5BA28">${safeStatus}</text>
      </g>
    </g>`;
  }).join('');

  return renderSvgShell({
    sectionNum: 'SYSTEMS // 02',
    kicker: 'Ventures & Software Systems',
    title: 'Systems Built Beyond Classroom',
    subtitle: 'Indian dialect LLM evals, simulation engines, focus OS, and student utilities.',
    contentBody: cardsSvg,
    footerTag: 'TATHYA RESEARCH · STRATUM SIMULATOR · FLOW STATE · KRAMA OS'
  });
}

/**
 * 4. Contact Section OpenGraph Image
 */
function renderContactOg(content) {
  const p = (content && content.personal) || {};

  const bodySvg = `
    <g transform="translate(0, 0)">
      <!-- Channel 1: Email -->
      <g transform="translate(0, 0)">
        <rect width="520" height="105" rx="14" fill="#131317" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
        <text x="28" y="38" class="font-mono" font-size="12" font-weight="600" fill="#A5BA28" letter-spacing="1">PRIMARY TRANSMISSION // EMAIL</text>
        <text x="28" y="75" class="font-mono" font-size="20" font-weight="600" fill="#F5EFE6">${escapeXml(p.email || 'rudra.s26042@csds.rishihood.edu.in')}</text>
      </g>

      <!-- Channel 2: LinkedIn -->
      <g transform="translate(552, 0)">
        <rect width="520" height="105" rx="14" fill="#131317" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
        <text x="28" y="38" class="font-mono" font-size="12" font-weight="600" fill="#A5BA28" letter-spacing="1">PROFESSIONAL NETWORK // LINKEDIN</text>
        <text x="28" y="75" class="font-mono" font-size="18" font-weight="500" fill="#F5EFE6">linkedin.com/in/rudra-sharma-7bb78b410</text>
      </g>

      <!-- Channel 3: Academic Base -->
      <g transform="translate(0, 125)">
        <rect width="1072" height="95" rx="14" fill="#131317" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1" />
        <text x="28" y="38" class="font-mono" font-size="12" font-weight="600" fill="#5C5A53" letter-spacing="1">ACADEMIC RESIDENCE</text>
        <text x="28" y="70" class="font-body" font-size="18" fill="#F5EFE6">B.Tech Computer Science &amp; Data Science · Rishihood University (Class of 2030)</text>
      </g>
    </g>
  `;

  return renderSvgShell({
    sectionNum: 'TRANSMISSION // 03',
    kicker: 'Direct Transmission Channels',
    title: 'Initiate Direct Transmission',
    subtitle: 'Available for technical collaboration, venture evaluation, and research discussions.',
    contentBody: bodySvg,
    footerTag: 'DIRECT CHANNELS · NO TELEMETRY INTERMEDIARIES'
  });
}

/**
 * Attempts to convert SVG to PNG using Google Chrome headless without adding external npm dependencies.
 */
function convertSvgToPngWithChrome(svgPath, pngPath) {
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser'
  ];

  let chromeExe = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      chromeExe = p;
      break;
    }
  }

  if (!chromeExe) return false;

  try {
    const fileUrl = `file://${path.resolve(svgPath)}`;
    const cmd = `"${chromeExe}" --headless --disable-gpu --window-size=1200,630 --hide-scrollbars --screenshot="${pngPath}" "${fileUrl}"`;
    execSync(cmd, { stdio: 'ignore', timeout: 8000 });
    return fs.existsSync(pngPath);
  } catch (err) {
    return false;
  }
}

/**
 * Master generator for all OG image assets in output directory
 *
 * @param {Object} content - Canonical content from content/content.json
 * @param {string} outputDir - Path to output directory (e.g. dist/assets/og)
 * @returns {Array<string>} Generated file paths
 */
function generateOgImages(content, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });

  const targets = [
    { name: 'og-hero.svg', png: 'og-hero.png', render: renderHeroOg },
    { name: 'og-competitions.svg', png: 'og-competitions.png', render: renderCompetitionsOg },
    { name: 'og-ventures.svg', png: 'og-ventures.png', render: renderVenturesOg },
    { name: 'og-contact.svg', png: 'og-contact.png', render: renderContactOg }
  ];

  const generated = [];

  for (const t of targets) {
    const svgPath = path.join(outputDir, t.name);
    const svgContent = t.render(content);
    fs.writeFileSync(svgPath, svgContent, 'utf-8');
    generated.push(svgPath);

    const pngPath = path.join(outputDir, t.png);
    const converted = convertSvgToPngWithChrome(svgPath, pngPath);
    if (converted) {
      generated.push(pngPath);
    }
  }

  // Also write default aliases og-main.svg and og-main.png
  const heroSvg = path.join(outputDir, 'og-hero.svg');
  const mainSvg = path.join(outputDir, 'og-main.svg');
  if (fs.existsSync(heroSvg)) {
    fs.copyFileSync(heroSvg, mainSvg);
    generated.push(mainSvg);
  }
  const heroPng = path.join(outputDir, 'og-hero.png');
  const mainPng = path.join(outputDir, 'og-main.png');
  if (fs.existsSync(heroPng)) {
    fs.copyFileSync(heroPng, mainPng);
    generated.push(mainPng);
  }

  return generated;
}

module.exports = {
  renderHeroOg,
  renderCompetitionsOg,
  renderVenturesOg,
  renderContactOg,
  generateOgImages
};
