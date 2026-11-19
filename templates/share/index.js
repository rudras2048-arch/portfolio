/**
 * ============================================================================
 * templates/share/index.js
 * Master Entry Point for Agent 3 (Share) SEO & OpenGraph Engine.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { getDeploymentDomain, getCanonicalUrl, DEFAULT_DOMAIN } = require('./config');
const { generateRobotsTxt } = require('./robots');
const { generateSitemapXml } = require('./sitemap');
const { buildSchemaGraph, renderJsonLd } = require('./schema');
const { renderHeadMeta } = require('./meta');
const {
  renderHeroOg,
  renderCompetitionsOg,
  renderVenturesOg,
  renderContactOg,
  generateOgImages
} = require('./og-images');

/**
 * Generates all static share artifacts (robots.txt, sitemap.xml, OG images)
 * into the target distribution directory.
 *
 * @param {Object} [content] - Canonical content object (loads content/content.json if omitted)
 * @param {string} [distDir] - Output distribution directory (defaults to ../../dist)
 * @returns {Object} Report of generated artifacts
 */
function generateShareArtifacts(content, distDir) {
  const rootDir = path.resolve(__dirname, '..', '..');
  const targetDist = distDir || path.join(rootDir, 'dist');
  const targetContent = content || JSON.parse(fs.readFileSync(path.join(rootDir, 'content', 'content.json'), 'utf-8'));

  fs.mkdirSync(targetDist, { recursive: true });

  const artifacts = [];

  // 1. Generate dist/robots.txt
  const robotsTxt = generateRobotsTxt(targetContent);
  const robotsPath = path.join(targetDist, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  artifacts.push({ file: 'dist/robots.txt', bytes: Buffer.byteLength(robotsTxt), type: 'text/plain' });

  // 2. Generate dist/sitemap.xml
  const sitemapXml = generateSitemapXml(targetContent);
  const sitemapPath = path.join(targetDist, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  artifacts.push({ file: 'dist/sitemap.xml', bytes: Buffer.byteLength(sitemapXml), type: 'application/xml' });

  // 3. Generate section OG images in dist/assets/og/
  const ogDir = path.join(targetDist, 'assets', 'og');
  const ogFiles = generateOgImages(targetContent, ogDir);
  for (const f of ogFiles) {
    const rel = path.relative(targetDist, f);
    const stat = fs.statSync(f);
    artifacts.push({ file: `dist/${rel}`, bytes: stat.size, type: f.endsWith('.svg') ? 'image/svg+xml' : 'image/png' });
  }

  // Also mirror OG images to root assets/og/ so they exist for local file preview
  const rootOgDir = path.join(rootDir, 'assets', 'og');
  fs.mkdirSync(rootOgDir, { recursive: true });
  for (const f of fs.readdirSync(ogDir)) {
    fs.copyFileSync(path.join(ogDir, f), path.join(rootOgDir, f));
  }

  return {
    domain: getDeploymentDomain(targetContent),
    canonicalRoot: getCanonicalUrl(targetContent),
    artifacts
  };
}

module.exports = {
  DEFAULT_DOMAIN,
  getDeploymentDomain,
  getCanonicalUrl,
  generateRobotsTxt,
  generateSitemapXml,
  buildSchemaGraph,
  renderJsonLd,
  renderHeadMeta,
  renderHeroOg,
  renderCompetitionsOg,
  renderVenturesOg,
  renderContactOg,
  generateOgImages,
  generateShareArtifacts
};
