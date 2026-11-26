/**
 * ============================================================================
 * templates/share/sitemap.js
 * Generates dist/sitemap.xml strictly from content/content.json.
 * ============================================================================
 */

const { getCanonicalUrl } = require('./config');

/**
 * Escapes XML entities in URL or text values.
 * @param {string} str
 * @returns {string}
 */
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
 * Generates standards-compliant XML sitemap strictly from canonical content.
 *
 * @param {Object} content - Canonical content from content/content.json
 * @returns {string} XML Sitemap string
 */
function generateSitemapXml(content) {
  const meta = (content && content.meta) || {};
  const personal = (content && content.personal) || {};
  // Always use today's build date for freshness — do not rely on static last_updated field
  const lastMod = new Date().toISOString().split('T')[0];

  const rootUrl = getCanonicalUrl(content);

  const urls = [
    {
      loc: rootUrl,
      lastmod: lastMod,
      changefreq: 'weekly',
      priority: '1.0'
    }
  ];

  // Include verified resume document if available
  if (personal.resume_url && personal.resume_url !== 'TBD') {
    urls.push({
      loc: getCanonicalUrl(content, personal.resume_url),
      lastmod: lastMod,
      changefreq: 'monthly',
      priority: '0.8'
    });
  }

  // Include AI-friendly llms.txt markdown index
  urls.push({
    loc: getCanonicalUrl(content, 'llms.txt'),
    lastmod: lastMod,
    changefreq: 'weekly',
    priority: '0.8'
  });

  const xmlEntries = urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;
}

module.exports = {
  generateSitemapXml
};
