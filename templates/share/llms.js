/**
 * ============================================================================
 * templates/share/llms.js
 * Generates dist/llms.txt (and root llms.txt) strictly from content/content.json.
 * Open llms.txt standard for AI search and agent retrieval.
 * ============================================================================
 */

const { getCanonicalUrl } = require('./config');

/**
 * Generates an llms.txt markdown summary from canonical content.
 *
 * @param {Object} content - Canonical content from content/content.json
 * @returns {string} Clean llms.txt markdown string
 */
function generateLlmsTxt(content) {
  const p = (content && content.personal) || {};
  const h = (content && content.hero) || {};
  const comps = (content && content.competitions) || [];
  const vens = (content && content.ventures) || [];

  const rootUrl = getCanonicalUrl(content);
  const resumeUrl = p.resume_url && p.resume_url !== 'TBD' ? getCanonicalUrl(content, p.resume_url) : '';
  const sitemapUrl = getCanonicalUrl(content, 'sitemap.xml');

  const lines = [
    `# ${p.name || 'Rudra Sharma'}`,
    '',
    `> ${p.headline || "First-Year B.Tech CS & Data Science · Builder · Rishihood '30"}`,
    '',
    p.bio_statement || '',
    '',
    h.statement ? `Thesis: ${h.statement}` : '',
    '',
    '## Canonical & Contact Links',
    `- Portfolio: ${rootUrl}`,
    resumeUrl ? `- Official Résumé (PDF): ${resumeUrl}` : '',
    p.linkedin && p.linkedin !== 'TBD' ? `- LinkedIn: ${p.linkedin}` : '',
    p.github && p.github !== 'TBD' ? `- GitHub: ${p.github}` : '',
    p.email && p.email !== 'TBD' ? `- Email: ${p.email}` : '',
    `- Sitemap: ${sitemapUrl}`,
    '',
    '## Key Metrics',
    ...(h.stats || []).map(s => `- **${s.value} ${s.label}**: ${s.description}`),
    '',
    '## Competitive Field Record',
    ...comps.map(c => {
      const role = c.team && (c.team.rudra_role || c.team.role);
      const outcome = c.story && (c.story.result || c.story.execution);
      const summary = [
        `### ${c.title} (${c.host} · ${c.event}, ${c.date})`,
        `- Placement: ${c.placement}`,
        role ? `- Role: ${role}` : '',
        outcome ? `- Outcome: ${outcome}` : ''
      ].filter(Boolean);
      return summary.join('\n');
    }),
    '',
    '## Ventures & Software Systems',
    ...vens.map(v => {
      const summary = [
        `### ${v.name} (${v.category} · ${v.badge})`,
        v.thesis ? `- Thesis: ${v.thesis}` : '',
        v.problem ? `- Problem: ${v.problem}` : '',
        v.status_detail ? `- Status: ${v.status_detail}` : ''
      ].filter(Boolean);
      return summary.join('\n');
    }),
    ''
  ];

  return lines.filter(line => line !== null && line !== undefined).join('\n').replace(/\n{3,}/g, '\n\n');
}

module.exports = {
  generateLlmsTxt
};
