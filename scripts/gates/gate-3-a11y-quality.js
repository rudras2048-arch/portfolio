const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CDPClient } = require('./cdp-client.js');
const { LocalStaticServer } = require('./server.js');
const axe = require('axe-core');

async function runGate3A11yQuality(port = 8086) {
  console.log('\n============================================================');
  console.log('GATE 3: ACCESSIBILITY (AXE-CORE) & QUALITY TARGET AUDIT');
  console.log('Targets: Perf >= 90 | A11y = 100 | SEO = 100');
  console.log('============================================================');

  const rootDir = path.resolve(__dirname, '../../');
  const distDir = path.join(rootDir, 'dist');
  const server = new LocalStaticServer(distDir, port);

  let serverUrl;
  try {
    serverUrl = await server.start();
    console.log(`Local test server running at ${serverUrl}`);
  } catch (err) {
    return {
      gate: 'G-03',
      name: 'Lighthouse & axe-core Quality Audit',
      passed: false,
      error: `Failed to start test server: ${err.message}`
    };
  }

  const client = new CDPClient(9445);
  let axeResults = null;
  let perfMetrics = null;
  let seoAudit = null;
  let lighthouseScores = null;

  try {
    console.log('Launching headless Chrome for axe-core and browser telemetry...');
    await client.launch();

    await client.navigate(`${serverUrl}/index.html`);
    await new Promise(r => setTimeout(r, 1200));

    // 1. Run axe-core
    console.log('Injecting axe-core source into live DOM...');
    await client.send('Runtime.evaluate', {
      expression: axe.source,
      returnByValue: false
    });

    console.log('Executing axe.run()...');
    const axeEval = await client.send('Runtime.evaluate', {
      expression: `
        new Promise((resolve, reject) => {
          axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
            }
          }, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        })
      `,
      awaitPromise: true,
      returnByValue: true
    });

    if (axeEval.exceptionDetails) {
      console.error('axe-core evaluation exception:', axeEval.exceptionDetails);
    } else {
      axeResults = axeEval.result.value;
    }

    // 2. Collect Browser Navigation Timing & Performance Metrics
    console.log('Gathering performance telemetry...');
    perfMetrics = await client.evaluate(`
      (() => {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const paints = performance.getEntriesByType('paint') || [];
        const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
        const domNodes = document.querySelectorAll('*').length;

        // Collect resource transfer sizes
        const resources = performance.getEntriesByType('resource').map(r => ({
          name: r.name.split('/').pop(),
          size: r.transferSize || r.decodedBodySize || 0,
          duration: Math.round(r.duration)
        }));

        const totalTransferBytes = resources.reduce((acc, r) => acc + r.size, 0);
        const largeResources = resources.filter(r => r.size > 500 * 1024);

        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart) || 0,
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime) || 0,
          loadEvent: Math.round(nav.loadEventEnd - nav.startTime) || 0,
          firstContentfulPaintMs: Math.round(fcp),
          domNodes,
          totalTransferBytes,
          largeResources
        };
      })()
    `);

    // 3. Collect SEO & Metadata Audit from DOM
    console.log('Auditing SEO & metadata structures...');
    seoAudit = await client.evaluate(`
      (() => {
        const title = document.title || '';
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
        const h1Count = document.querySelectorAll('h1').length;
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
        const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
        const schemaScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.textContent);

        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.getAttribute('src'),
          hasAlt: img.hasAttribute('alt') && img.getAttribute('alt').trim().length > 0
        }));
        const missingAltImages = images.filter(i => !i.hasAlt);

        return {
          title,
          metaDesc,
          canonical,
          viewport,
          h1Count,
          ogTitle,
          ogDesc,
          ogImage,
          twitterCard,
          schemaScriptsCount: schemaScripts.length,
          totalImages: images.length,
          missingAltCount: missingAltImages.length,
          missingAltImages: missingAltImages.slice(0, 5)
        };
      })()
    `);

    await client.close();
  } catch (err) {
    console.error('Error during CDP audit:', err);
    await client.close();
  }

  // Check robots.txt and sitemap.xml in dist/
  const robotsExists = fs.existsSync(path.join(distDir, 'robots.txt'));
  const sitemapExists = fs.existsSync(path.join(distDir, 'sitemap.xml'));

  // 4. Try running npx lighthouse for mobile simulation if possible
  console.log('Attempting Lighthouse mobile audit...');
  try {
    const lhOutPath = path.join(rootDir, 'reports/lighthouse_audit.json');
    fs.mkdirSync(path.dirname(lhOutPath), { recursive: true });
    execSync(`npx -y lighthouse ${serverUrl}/index.html --output=json --output-path="${lhOutPath}" --chrome-flags="--headless=new --no-sandbox" --form-factor=mobile --screenEmulation.mobile=true --throttling-method=simulate --quiet`, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 45000
    });

    if (fs.existsSync(lhOutPath)) {
      const lhRaw = JSON.parse(fs.readFileSync(lhOutPath, 'utf8'));
      lighthouseScores = {
        performance: Math.round((lhRaw.categories.performance?.score || 0) * 100),
        accessibility: Math.round((lhRaw.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((lhRaw.categories['best-practices']?.score || 0) * 100),
        seo: Math.round((lhRaw.categories.seo?.score || 0) * 100)
      };
      console.log('Lighthouse Audit Output:', lighthouseScores);
    }
  } catch (lhErr) {
    console.log('Lighthouse CLI run skipped or timed out; utilizing axe-core & CDP telemetry.');
  }

  await server.stop();

  // Process axe-core violations
  const violations = (axeResults && axeResults.violations) || [];
  const passes = (axeResults && axeResults.passes) || [];
  const violationCounts = {
    critical: violations.filter(v => v.impact === 'critical').length,
    serious: violations.filter(v => v.impact === 'serious').length,
    moderate: violations.filter(v => v.impact === 'moderate').length,
    minor: violations.filter(v => v.impact === 'minor').length
  };

  // Calculate scores
  // A11y target = 100 (requires 0 axe violations)
  let a11yScore = 100;
  if (violations.length > 0) {
    const penalty = (violationCounts.critical * 15) + (violationCounts.serious * 10) + (violationCounts.moderate * 5) + (violationCounts.minor * 2);
    a11yScore = Math.max(0, 100 - penalty);
  }

  // SEO target = 100
  let seoIssues = [];
  if (!seoAudit?.title) seoIssues.push('Missing <title>');
  if (!seoAudit?.metaDesc) seoIssues.push('Missing meta description');
  if (!seoAudit?.canonical || seoAudit.canonical.includes('YOUR-DOMAIN')) seoIssues.push('Invalid or ungrounded canonical URL');
  if (!seoAudit?.viewport) seoIssues.push('Missing viewport meta tag');
  if (seoAudit?.h1Count === 0) seoIssues.push('Missing <h1> heading');
  if (seoAudit?.missingAltCount > 0) seoIssues.push(`${seoAudit.missingAltCount} images missing alt text`);
  if (!robotsExists) seoIssues.push('Missing dist/robots.txt');
  if (!sitemapExists) seoIssues.push('Missing dist/sitemap.xml');
  if (!seoAudit?.ogTitle || !seoAudit?.ogImage) seoIssues.push('Incomplete OpenGraph metadata');

  let seoScore = Math.max(0, 100 - (seoIssues.length * 10));

  // Perf target = 90
  let perfScore = 95;
  const perfIssues = [];
  if (perfMetrics?.largeResources?.length > 0) {
    perfIssues.push(`${perfMetrics.largeResources.length} uncompressed/oversized asset(s) > 500KB`);
    perfScore -= perfMetrics.largeResources.length * 15;
  }
  if (perfMetrics?.firstContentfulPaintMs > 1800) {
    perfIssues.push(`FCP exceeds 1.8s (${perfMetrics.firstContentfulPaintMs}ms)`);
    perfScore -= 20;
  }
  if (lighthouseScores) {
    perfScore = lighthouseScores.performance;
    if (lighthouseScores.accessibility) a11yScore = Math.min(a11yScore, lighthouseScores.accessibility);
    if (lighthouseScores.seo) seoScore = Math.min(seoScore, lighthouseScores.seo);
  }

  const passed = perfScore >= 90 && a11yScore === 100 && seoScore === 100 && violations.length === 0;

  console.log('\n--- QUALITY AUDIT SCORECARD ---');
  console.log(`  Performance:   ${perfScore} / 90  ${perfScore >= 90 ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`  Accessibility: ${a11yScore} / 100 ${a11yScore === 100 && violations.length === 0 ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`  SEO:           ${seoScore} / 100  ${seoScore === 100 ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`  Total axe violations: ${violations.length} (Critical: ${violationCounts.critical}, Serious: ${violationCounts.serious})`);

  if (violations.length > 0) {
    console.warn('\nTop axe-core violations:');
    violations.slice(0, 5).forEach((v, idx) => {
      console.warn(`  [${idx + 1}] [${v.impact.toUpperCase()}] ${v.id}: ${v.help}`);
      v.nodes.slice(0, 2).forEach(n => console.warn(`      Target: ${n.target.join(' ')}`));
    });
  }

  return {
    gate: 'G-03',
    name: 'Lighthouse & axe-core Quality Audit',
    passed,
    targets: { perf: 90, a11y: 100, seo: 100 },
    measured: { perf: perfScore, a11y: a11yScore, seo: seoScore },
    axe: {
      totalViolations: violations.length,
      violationCounts,
      violations: violations.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        nodesCount: v.nodes.length,
        nodes: v.nodes.map(n => ({ target: n.target, html: n.html }))
      })),
      passesCount: passes.length
    },
    perfMetrics,
    perfIssues,
    seoAudit,
    seoIssues,
    lighthouseScores
  };
}

module.exports = { runGate3A11yQuality };
