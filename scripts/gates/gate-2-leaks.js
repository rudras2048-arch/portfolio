const fs = require('fs');
const path = require('path');

function runGate2Leaks() {
  console.log('\n============================================================');
  console.log('GATE 2: AUDITING LEAK PREVENTION (TBD, YOUR-DOMAIN, ASSET PATHS)');
  console.log('============================================================');

  const rootDir = path.resolve(__dirname, '../../');
  const distDir = path.join(rootDir, 'dist');
  const distFile = path.join(distDir, 'index.html');

  if (!fs.existsSync(distFile)) {
    return {
      gate: 'G-02',
      name: 'Leak Prevention',
      passed: false,
      error: 'dist/index.html not found. Run Gate 1 first.',
      leaks: []
    };
  }

  const html = fs.readFileSync(distFile, 'utf8');
  const lines = html.split('\n');

  const visibleTbds = [];
  const yourDomainLeaks = [];
  const localAssetPathLeaks = [];
  const missingAssetFiles = [];

  // 1. Strip non-rendered blocks (<script>, <style>, <!-- comments -->)
  let strippedHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  strippedHtml = strippedHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  strippedHtml = strippedHtml.replace(/<!--[\s\S]*?-->/g, '');

  // Check visible text nodes for literal "TBD"
  const tagRegex = />([^<]+)</g;
  let match;
  while ((match = tagRegex.exec(strippedHtml)) !== null) {
    const text = match[1].trim();
    if (/\bTBD\b/i.test(text)) {
      visibleTbds.push({
        text,
        index: match.index
      });
    }
  }

  // Find line numbers and snippets for visible TBDs
  visibleTbds.forEach(item => {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(item.text) && !lines[i].includes('<script') && !lines[i].includes('//') && !lines[i].includes('/*')) {
        item.line = i + 1;
        item.snippet = lines[i].trim();
        break;
      }
    }
  });

  // Also check visible attributes (alt, title, aria-label)
  const attrRegex = /\s(alt|title|aria-label)=["']([^"']*\bTBD\b[^"']*)["']/gi;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(strippedHtml)) !== null) {
    visibleTbds.push({
      attribute: attrMatch[1],
      snippet: attrMatch[2],
      reason: `Attribute ${attrMatch[1]} contains literal TBD`
    });
  }

  // 2. Check for "YOUR-DOMAIN"
  for (let i = 0; i < lines.length; i++) {
    if (/YOUR-DOMAIN/i.test(lines[i])) {
      yourDomainLeaks.push({
        line: i + 1,
        snippet: lines[i].trim()
      });
    }
  }

  // 3. Check for absolute local paths or raw file protocols
  for (let i = 0; i < lines.length; i++) {
    if (/\/Users\/|file:\/\/\//i.test(lines[i])) {
      localAssetPathLeaks.push({
        line: i + 1,
        snippet: lines[i].trim(),
        reason: 'Absolute local file or system path detected'
      });
    }
  }

  // Check for broken raw asset paths in visible text nodes
  let textAssetMatch;
  const textAssetRegex = />\s*(assets\/[^\s<]+)\s*</g;
  while ((textAssetMatch = textAssetRegex.exec(strippedHtml)) !== null) {
    const assetPath = textAssetMatch[1].trim();
    const cleanAsset = assetPath.split('?')[0].split('#')[0];
    const fullDiskPath = path.join(distDir, cleanAsset);
    if (!fs.existsSync(fullDiskPath)) {
      localAssetPathLeaks.push({
        snippet: assetPath,
        reason: 'Raw broken asset path rendered in DOM without backing file on disk'
      });
    }
  }

  // 4. Verify all referenced local asset files exist in dist/
  const srcHrefRegex = /(?:src|href|data-asset-src|poster)=["']([^"']+)["']/g;
  const foundAssets = new Set();
  let assetMatch;
  while ((assetMatch = srcHrefRegex.exec(html)) !== null) {
    const val = assetMatch[1].trim();
    if (!val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('#') || val.startsWith('data:') || val.startsWith('mailto:') || val.startsWith('tel:') || val.startsWith('javascript:')) {
      continue;
    }
    foundAssets.add(val);
  }

  for (const relAsset of foundAssets) {
    const cleanRel = relAsset.split('?')[0].split('#')[0];
    const fullAssetPath = path.join(distDir, cleanRel);
    if (!fs.existsSync(fullAssetPath)) {
      missingAssetFiles.push({
        reference: relAsset,
        resolvedPath: fullAssetPath,
        reason: 'Referenced asset does not exist in dist/'
      });
    }
  }

  const totalLeaks = visibleTbds.length + yourDomainLeaks.length + localAssetPathLeaks.length + missingAssetFiles.length;
  const passed = totalLeaks === 0;

  console.log(`Scan Summary:`);
  console.log(`  - Visible TBD leaks:          ${visibleTbds.length}`);
  console.log(`  - YOUR-DOMAIN leaks:          ${yourDomainLeaks.length}`);
  console.log(`  - Local absolute path leaks:  ${localAssetPathLeaks.length}`);
  console.log(`  - Broken / missing assets:    ${missingAssetFiles.length}`);
  console.log(`  Total Leaks:                  ${totalLeaks}`);

  if (visibleTbds.length > 0) {
    console.warn('\n[!] Visible TBD leaks:');
    visibleTbds.forEach((item, idx) => console.warn(`    ${idx + 1}. [Line ${item.line || '?'}] ${item.snippet || item.text}`));
  }
  if (yourDomainLeaks.length > 0) {
    console.warn('\n[!] YOUR-DOMAIN placeholder leaks:');
    yourDomainLeaks.slice(0, 5).forEach((item, idx) => console.warn(`    ${idx + 1}. [Line ${item.line}] ${item.snippet}`));
    if (yourDomainLeaks.length > 5) console.warn(`    ... and ${yourDomainLeaks.length - 5} more`);
  }
  if (localAssetPathLeaks.length > 0) {
    console.warn('\n[!] Absolute system path leaks:');
    localAssetPathLeaks.forEach((item, idx) => console.warn(`    ${idx + 1}. [Line ${item.line || '?'}] ${item.snippet}`));
  }
  if (missingAssetFiles.length > 0) {
    console.warn('\n[!] Missing asset references:');
    missingAssetFiles.forEach((item, idx) => console.warn(`    ${idx + 1}. ${item.reference}`));
  }

  if (passed) {
    console.log('\n✔ [GATE 2 PASSED] Zero leaks found in dist/');
  } else {
    console.error(`\n✖ [GATE 2 FAILED] Found ${totalLeaks} leak(s) in dist/`);
  }

  return {
    gate: 'G-02',
    name: 'Leak Prevention',
    passed,
    totalLeaks,
    visibleTbds,
    yourDomainLeaks,
    localAssetPathLeaks,
    missingAssetFiles
  };
}

module.exports = { runGate2Leaks };
