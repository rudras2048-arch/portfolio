/**
 * ============================================================================
 * templates/share/robots.js
 * Generates dist/robots.txt strictly from content/content.json.
 * ============================================================================
 */

const { getCanonicalUrl } = require('./config');

/**
 * Generates standards-compliant robots.txt content strictly using verified data.
 *
 * @param {Object} content - Canonical content from content/content.json
 * @returns {string} Clean robots.txt string
 */
function generateRobotsTxt(content) {
  const sitemapUrl = getCanonicalUrl(content, 'sitemap.xml');
  const authorName = (content && content.personal && content.personal.name) || 'Rudra Sharma';

  return `# ==============================================================================
# Robots.txt for ${authorName} Portfolio
# Architecture: Single Source of Truth from content/content.json
# ==============================================================================

User-agent: *
Allow: /

# Canonical Sitemap Declaration
Sitemap: ${sitemapUrl}
`;
}

module.exports = {
  generateRobotsTxt
};
