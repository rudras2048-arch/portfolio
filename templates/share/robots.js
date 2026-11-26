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
  const llmsUrl = getCanonicalUrl(content, 'llms.txt');
  const authorName = (content && content.personal && content.personal.name) || 'Rudra Sharma';

  const aiAgents = [
    'Googlebot',
    'Google-Extended',
    'GoogleOther',
    'Gemini-Deep-Research',
    'OAI-SearchBot',
    'GPTBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-User',
    'Claude-SearchBot',
    'PerplexityBot',
    'Perplexity-User',
    'Applebot',
    'Applebot-Extended',
    'Amazonbot'
  ];

  const agentRules = aiAgents
    .map(agent => `User-agent: ${agent}\nAllow: /`)
    .join('\n\n');

  return `# ==============================================================================
# Robots.txt for ${authorName} Portfolio
# Architecture: Single Source of Truth from content/content.json
# Policy: Explicit opt-in for all search engines and AI crawlers/fetchers
# ==============================================================================

${agentRules}

User-agent: *
Allow: /

# AI-Friendly Structured Markdown Index (llms.txt)
# ${llmsUrl}

# Canonical Sitemap Declaration
Sitemap: ${sitemapUrl}
`;
}

module.exports = {
  generateRobotsTxt
};
