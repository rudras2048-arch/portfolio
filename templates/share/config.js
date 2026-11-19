/**
 * ============================================================================
 * templates/share/config.js
 * Centralized deployment domain configuration resolver.
 * Single source of truth for portfolio v2 domain and canonical URLs.
 * ============================================================================
 */

const DEFAULT_DOMAIN = 'https://rudras-portfolio.netlify.app';

/**
 * Returns the single centralized deployment domain without a trailing slash.
 * Follows strict resolution hierarchy:
 * 1. process.env.PORTFOLIO_DOMAIN or process.env.DEPLOY_DOMAIN (if configured)
 * 2. content.meta.canonical_url in content/content.json
 * 3. DEFAULT_DOMAIN ('https://rudras-portfolio.netlify.app')
 *
 * @param {Object} [content] - Parsed content/content.json object
 * @returns {string} Sanitized domain URL (e.g. 'https://rudras-portfolio.netlify.app')
 */
function getDeploymentDomain(content) {
  if (process.env.PORTFOLIO_DOMAIN && process.env.PORTFOLIO_DOMAIN.trim()) {
    return process.env.PORTFOLIO_DOMAIN.trim().replace(/\/+$/, '');
  }
  if (process.env.DEPLOY_DOMAIN && process.env.DEPLOY_DOMAIN.trim()) {
    return process.env.DEPLOY_DOMAIN.trim().replace(/\/+$/, '');
  }

  const meta = (content && content.meta) ? content.meta : {};
  const configured = meta.canonical_url || meta.deployment_domain || meta.domain || DEFAULT_DOMAIN;
  return String(configured).trim().replace(/\/+$/, '');
}

/**
 * Returns a fully qualified canonical URL for a path or section.
 *
 * @param {Object} [content] - Parsed content/content.json object
 * @param {string} [relativePath] - Optional relative path (e.g. 'assets/og/og-hero.svg' or '#competitions')
 * @returns {string} Absolute URL (e.g. 'https://rudras-portfolio.netlify.app/assets/og/og-hero.svg')
 */
function getCanonicalUrl(content, relativePath = '') {
  const domain = getDeploymentDomain(content);
  if (!relativePath) return `${domain}/`;
  if (relativePath.startsWith('#')) return `${domain}/${relativePath}`;
  const cleanPath = String(relativePath).replace(/^\/+/, '');
  return `${domain}/${cleanPath}`;
}

module.exports = {
  DEFAULT_DOMAIN,
  getDeploymentDomain,
  getCanonicalUrl
};
