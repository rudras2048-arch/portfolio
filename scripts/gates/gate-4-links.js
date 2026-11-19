const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

function checkExternalUrl(url, canonicalBaseDomain, distDir) {
  return new Promise(resolve => {
    try {
      const parsed = new URL(url);

      // If URL points to the local canonical deployment domain (e.g. https://rudras-portfolio.netlify.app),
      // verify that the asset or page exists locally in dist/
      if (canonicalBaseDomain && (parsed.origin === canonicalBaseDomain || parsed.hostname === 'rudras-portfolio.netlify.app')) {
        let localRel = parsed.pathname.replace(/^\/+/, '');
        if (!localRel || localRel === '') localRel = 'index.html';
        const diskFile = path.join(distDir, localRel);
        const exists = fs.existsSync(diskFile);
        return resolve({
          url,
          statusCode: exists ? 200 : 404,
          statusMessage: exists ? 'Resolved locally against dist/' : 'Target path missing in dist/',
          status: exists ? 'PASS' : 'FAIL',
          isCanonicalAsset: true
        });
      }

      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;

      // Handle bare preconnect origins (like https://fonts.googleapis.com or https://fonts.gstatic.com)
      // which serve 404 at root GET but are valid preconnect targets
      if (parsed.pathname === '/' || parsed.pathname === '') {
        if (parsed.hostname.endsWith('fonts.googleapis.com') || parsed.hostname.endsWith('fonts.gstatic.com')) {
          return resolve({
            url,
            statusCode: 200,
            statusMessage: 'Valid preconnect origin host',
            status: 'PASS'
          });
        }
      }

      const req = lib.request(parsed, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000
      }, res => {
        let status = 'FAIL';
        if (res.statusCode >= 200 && res.statusCode < 400) {
          status = 'PASS';
        } else if (res.statusCode === 999 || res.statusCode === 403 || res.statusCode === 429) {
          status = 'BLOCKED/AUTH';
        }

        resolve({
          url,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          status
        });
        res.resume();
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          statusCode: 'TIMEOUT',
          statusMessage: 'Request timed out after 8s',
          status: 'FAIL'
        });
      });

      req.on('error', err => {
        resolve({
          url,
          statusCode: 'ERROR',
          statusMessage: err.message,
          status: 'FAIL'
        });
      });

      req.end();
    } catch (e) {
      resolve({
        url,
        statusCode: 'INVALID',
        statusMessage: e.message,
        status: 'FAIL'
      });
    }
  });
}

async function runGate4Links() {
  console.log('\n============================================================');
  console.log('GATE 4: AUDITING LOCAL ASSETS & EXTERNAL LINK INTEGRITY');
  console.log('============================================================');

  const rootDir = path.resolve(__dirname, '../../');
  const distDir = path.join(rootDir, 'dist');
  const distHtml = path.join(distDir, 'index.html');
  const contentFile = path.join(rootDir, 'content/content.json');

  let canonicalBase = null;
  if (fs.existsSync(contentFile)) {
    try {
      const c = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
      if (c?.meta?.canonical_url) {
        canonicalBase = new URL(c.meta.canonical_url).origin;
      }
    } catch (e) {}
  }

  if (!fs.existsSync(distHtml)) {
    return {
      gate: 'G-04',
      name: 'Link & Asset Integrity',
      passed: false,
      error: 'dist/index.html not found'
    };
  }

  const html = fs.readFileSync(distHtml, 'utf8');

  // Extract all URLs
  const hrefRegex = /href=["']([^"']+)["']/g;
  const srcRegex = /src=["']([^"']+)["']/g;
  const dataAssetRegex = /data-asset-src=["']([^"']+)["']/g;
  const posterRegex = /poster=["']([^"']+)["']/g;
  const contentRegex = /content=["'](https?:\/\/[^"']+)["']/g;

  const allUrls = new Set();
  let match;
  while ((match = hrefRegex.exec(html)) !== null) allUrls.add(match[1]);
  while ((match = srcRegex.exec(html)) !== null) allUrls.add(match[1]);
  while ((match = dataAssetRegex.exec(html)) !== null) allUrls.add(match[1]);
  while ((match = posterRegex.exec(html)) !== null) allUrls.add(match[1]);
  while ((match = contentRegex.exec(html)) !== null) allUrls.add(match[1]);

  const localAssets = [];
  const externalUrls = [];
  const internalAnchors = [];

  for (const rawUrl of allUrls) {
    const url = rawUrl.trim();
    if (!url || url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
    if (url.startsWith('#')) {
      if (url.length > 1) {
        internalAnchors.push(url);
      }
    } else if (/^https?:\/\//i.test(url)) {
      externalUrls.push(url);
    } else {
      localAssets.push(url);
    }
  }

  console.log(`Discovered:`);
  console.log(`  - ${localAssets.length} local asset references`);
  console.log(`  - ${internalAnchors.length} internal section anchors`);
  console.log(`  - ${externalUrls.length} external URLs`);

  // 1. Audit Local Assets
  const localResults = localAssets.map(asset => {
    const cleanPath = asset.split('?')[0].split('#')[0];
    const fullPath = path.join(distDir, cleanPath);
    const exists = fs.existsSync(fullPath);
    let size = 0;
    if (exists) {
      size = fs.statSync(fullPath).size;
    }
    return {
      reference: asset,
      resolvedPath: fullPath,
      exists,
      sizeBytes: size,
      status: exists && size > 0 ? 'PASS' : 'FAIL'
    };
  });

  // 2. Audit Internal Section Anchors
  const idRegex = /id=["']([^"']+)["']/g;
  const foundIds = new Set();
  let idMatch;
  while ((idMatch = idRegex.exec(html)) !== null) {
    foundIds.add(idMatch[1]);
  }

  const anchorResults = internalAnchors.map(anchor => {
    const targetId = anchor.slice(1);
    const exists = foundIds.has(targetId);
    return {
      anchor,
      targetId,
      exists,
      status: exists ? 'PASS' : 'FAIL'
    };
  });

  // 3. Audit External URLs
  console.log('\nChecking external links concurrently...');
  const extPromises = externalUrls.map(u => checkExternalUrl(u, canonicalBase, distDir));
  const extResults = await Promise.all(extPromises);

  const localFailed = localResults.filter(r => r.status === 'FAIL');
  const anchorFailed = anchorResults.filter(r => r.status === 'FAIL');
  const extFailed = extResults.filter(r => r.status === 'FAIL');

  const passed = localFailed.length === 0 && anchorFailed.length === 0 && extFailed.length === 0;

  console.log('\n--- LINK AUDIT SUMMARY ---');
  console.log(`  Local Assets:    ${localResults.length - localFailed.length}/${localResults.length} PASS (${localFailed.length} FAIL)`);
  console.log(`  Internal Anchors: ${anchorResults.length - anchorFailed.length}/${anchorResults.length} PASS (${anchorFailed.length} FAIL)`);
  console.log(`  External Links:  ${extResults.filter(r => r.status === 'PASS').length}/${extResults.length} PASS (${extFailed.length} FAIL, ${extResults.filter(r => r.status === 'BLOCKED/AUTH').length} BLOCKED/AUTH)`);

  if (localFailed.length > 0) {
    console.warn('\n✖ Failed Local Assets:');
    localFailed.forEach(f => console.warn(`    - ${f.reference} -> ${f.resolvedPath}`));
  }
  if (anchorFailed.length > 0) {
    console.warn('\n✖ Missing Internal Anchor Targets:');
    anchorFailed.forEach(f => console.warn(`    - ${f.anchor} (Target #${f.targetId} not in DOM)`));
  }
  if (extFailed.length > 0) {
    console.warn('\n✖ Failed External URLs:');
    extFailed.forEach(f => console.warn(`    - [${f.statusCode}] ${f.url} (${f.statusMessage})`));
  }

  return {
    gate: 'G-04',
    name: 'Link & Asset Integrity',
    passed,
    localAssets: {
      total: localResults.length,
      passed: localResults.length - localFailed.length,
      failed: localFailed.length,
      items: localResults
    },
    internalAnchors: {
      total: anchorResults.length,
      passed: anchorResults.length - anchorFailed.length,
      failed: anchorFailed.length,
      items: anchorResults
    },
    externalUrls: {
      total: extResults.length,
      passed: extResults.filter(r => r.status === 'PASS').length,
      failed: extFailed.length,
      blocked: extResults.filter(r => r.status === 'BLOCKED/AUTH').length,
      items: extResults
    }
  };
}

module.exports = { runGate4Links };
