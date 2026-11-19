/**
 * ============================================================================
 * templates/share/meta.js
 * Generates OpenGraph and Twitter card <meta> tags wired cleanly
 * to the single centralized deployment domain variable.
 * ============================================================================
 */

const { getDeploymentDomain, getCanonicalUrl } = require('./config');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders complete head metadata (canonical link, OpenGraph, Twitter Cards)
 * strictly derived from content/content.json and wired to centralized domain.
 *
 * @param {Object} content - Canonical content from content/content.json
 * @param {string} [section='hero'] - Target section ('hero', 'competitions', 'ventures', 'contact')
 * @returns {string} Clean HTML string with meta and link tags
 */
function renderHeadMeta(content, section = 'hero') {
  const p = (content && content.personal) || {};
  const m = (content && content.meta) || {};
  const h = (content && content.hero) || {};
  const domain = getDeploymentDomain(content) + '/';

  const title = `${escapeHtml(p.name)} — ${escapeHtml(p.headline)}`;
  const desc = escapeHtml(p.bio_statement);

  // Section-specific OG image resolution
  let ogImageName = 'og-hero.png';
  let ogSectionTitle = title;
  let ogSectionUrl = domain;

  if (section === 'competitions') {
    ogImageName = 'og-competitions.png';
    ogSectionTitle = `${escapeHtml(p.name)} — Verified Competitions & Podiums`;
    ogSectionUrl = `${domain}#competitions`;
  } else if (section === 'ventures') {
    ogImageName = 'og-ventures.png';
    ogSectionTitle = `${escapeHtml(p.name)} — Ventures & Software Systems`;
    ogSectionUrl = `${domain}#ventures`;
  } else if (section === 'contact') {
    ogImageName = 'og-contact.png';
    ogSectionTitle = `${escapeHtml(p.name)} — Direct Transmission Channels`;
    ogSectionUrl = `${domain}#contact`;
  }

  const ogImageUrl = `${domain}assets/og/${ogImageName}`;
  const ogSvgUrl = `${domain}assets/og/${ogImageName.replace('.png', '.svg')}`;
  const ogAlt = `${p.name} — ${section.toUpperCase()} Card (Evidence, Not Noise)`;

  return `  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="author" content="${escapeHtml(p.name)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#0C0C0E">
  <meta name="color-scheme" content="dark">

  <!-- Canonical Link (Centralized Domain) -->
  <link rel="canonical" href="${domain}">

  <!-- OpenGraph / Facebook Meta Tags -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeHtml(p.name)} Portfolio">
  <meta property="og:url" content="${ogSectionUrl}">
  <meta property="og:title" content="${ogSectionTitle}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:secure_url" content="${ogImageUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(ogAlt)}">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${ogSectionUrl}">
  <meta name="twitter:title" content="${ogSectionTitle}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImageUrl}">
  <meta name="twitter:image:alt" content="${escapeHtml(ogAlt)}">

  <!-- Section Deep-Link Vector Cards -->
  <link rel="alternate" type="image/svg+xml" href="${ogSvgUrl}" title="${escapeHtml(section)} Vector Card">`;
}

module.exports = {
  renderHeadMeta
};
