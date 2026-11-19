#!/usr/bin/env node
/**
 * ============================================================================
 * PORTFOLIO V2 AUTOMATED RELEASE CHECK PIPELINE (/release-check)
 * ============================================================================
 * Orchestrates all architectural quality gates:
 *   Gate 1: Static Build Engine (npm run build)
 *   Gate 2: Leak Prevention (TBD, YOUR-DOMAIN, broken asset paths)
 *   Gate 3: axe-core WCAG 2.1 AA/AAA & Quality Targets (Perf 90, A11y 100, SEO 100)
 *   Gate 4: Local Asset & External Link Integrity
 *   Gate 5: Content Grounding Diff vs content/content.json
 *   Gate 6: Headless Chrome CDP Viewport (320/768/1440) & Keyboard Walkthrough
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { runGate1Build } = require('./gate-1-build.js');
const { runGate2Leaks } = require('./gate-2-leaks.js');
const { runGate3A11yQuality } = require('./gate-3-a11y-quality.js');
const { runGate4Links } = require('./gate-4-links.js');
const { runGate5DiffContent } = require('./gate-5-diff-content.js');
const { runGate6ViewportsKeyboard } = require('./gate-6-viewports-keyboard.js');

async function main() {
  const startTime = Date.now();
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        PORTFOLIO V2 AUTOMATED RELEASE-CHECK PIPELINE             ║');
  console.log('║        Strict Verification Gate & Adversarial Audit              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  const rootDir = path.resolve(__dirname, '../../');
  const reportsDir = path.join(rootDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const scorecard = [];

  // GATE 1: Build Engine
  const g1 = runGate1Build();
  scorecard.push({
    gate: 'G-01',
    name: 'Static Build Engine',
    target: 'Clean npm run build generation into dist/',
    measured: `${(g1.htmlSize / 1024).toFixed(1)} KB HTML, ${g1.assetsCount} assets`,
    passed: g1.passed,
    data: g1
  });

  if (!g1.passed) {
    console.error('\n✖ Gate 1 failed. Aborting subsequent gates.');
    finish(scorecard, startTime, false);
    return;
  }

  // GATE 2: Leak Prevention
  const g2 = runGate2Leaks();
  scorecard.push({
    gate: 'G-02',
    name: 'Leak Prevention',
    target: '0 visible TBD, YOUR-DOMAIN, broken asset paths',
    measured: `${g2.totalLeaks} leaks found (TBD: ${g2.visibleTbds.length}, Domain: ${g2.yourDomainLeaks.length}, Missing Assets: ${g2.missingAssetFiles.length})`,
    passed: g2.passed,
    data: g2
  });

  // GATE 3: Accessibility & Quality Targets
  const g3 = await runGate3A11yQuality(8091);
  scorecard.push({
    gate: 'G-03',
    name: 'Lighthouse & axe-core Quality',
    target: 'Perf >= 90 | A11y = 100 | SEO = 100 (0 axe violations)',
    measured: `Perf: ${g3.measured.perf} | A11y: ${g3.measured.a11y} | SEO: ${g3.measured.seo} (${g3.axe.totalViolations} axe violations)`,
    passed: g3.passed,
    data: g3
  });

  // GATE 4: Link & Asset Integrity
  const g4 = await runGate4Links();
  scorecard.push({
    gate: 'G-04',
    name: 'Link & Asset Integrity',
    target: '100% local assets & external URLs valid (0 broken)',
    measured: `Local: ${g4.localAssets.passed}/${g4.localAssets.total} | Anchors: ${g4.internalAnchors.passed}/${g4.internalAnchors.total} | Ext: ${g4.externalUrls.passed}/${g4.externalUrls.total}`,
    passed: g4.passed,
    data: g4
  });

  // GATE 5: Content Grounding Diff
  const g5 = await runGate5DiffContent(8092);
  scorecard.push({
    gate: 'G-05',
    name: 'Content Grounding Diff',
    target: '0 ungrounded claims vs content/content.json',
    measured: `${g5.totalMismatches} discrepancy/discrepancies (Critical: ${g5.criticalCount}, High: ${g5.highCount})`,
    passed: g5.passed,
    data: g5
  });

  // GATE 6: Viewport & Keyboard Walkthrough
  const g6 = await runGate6ViewportsKeyboard(8093);
  scorecard.push({
    gate: 'G-06',
    name: 'Interactive & Visual Audit',
    target: 'Flawless keyboard pass, zero 320/768/1440px overflow',
    measured: `Viewports: ${g6.allViewportsPassed ? 'PASS' : 'FAIL'} | Keyboard: ${g6.allInteractionsPassed ? 'PASS' : 'FAIL'}`,
    passed: g6.passed,
    data: g6
  });

  const allPassed = scorecard.every(s => s.passed);
  finish(scorecard, startTime, allPassed);
}

function finish(scorecard, startTime, allPassed) {
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const rootDir = path.resolve(__dirname, '../../');
  const reportsDir = path.join(rootDir, 'reports');

  // Print Summary Table
  console.log('\n==================================================================');
  console.log('                 RELEASE CHECK FINAL SCORECARD                    ');
  console.log('==================================================================');
  console.log('Gate  | Status | Measured Value');
  console.log('------+--------+--------------------------------------------------');
  scorecard.forEach(s => {
    const statusText = s.passed ? ' PASS ' : ' FAIL ';
    console.log(`${s.gate.padEnd(5)} | ${statusText} | ${s.measured}`);
  });
  console.log('==================================================================');
  console.log(`Execution completed in ${durationSec}s. Overall: ${allPassed ? '✔ ALL GATES PASSED' : '✖ MERGE BLOCKED'}\n`);

  // Generate Report Markdown
  const markdownReport = generateMarkdownReport(scorecard, durationSec, allPassed);
  const reportPath = path.join(reportsDir, 'release_check_report.md');
  fs.writeFileSync(reportPath, markdownReport);
  console.log(`Saved comprehensive report to: ${reportPath}`);

  // Save Telemetry JSON
  const summaryJsonPath = path.join(reportsDir, 'release_check_summary.json');
  fs.writeFileSync(summaryJsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    durationSeconds: parseFloat(durationSec),
    allPassed,
    gates: scorecard
  }, null, 2));
  console.log(`Saved structured telemetry to: ${summaryJsonPath}`);

  // Also write to brain artifact directory if active conversation path is known
  const brainDir = '/Users/rudrasharma/.gemini/antigravity/brain/a668cf00-55cd-46e0-9a31-87bf3d557c06';
  if (fs.existsSync(brainDir)) {
    try {
      fs.writeFileSync(path.join(brainDir, 'release_check_report.md'), markdownReport);
      // Copy screenshot artifacts into brain dir as well
      const artifactScreenshots = [
        'viewport-320px.png',
        'viewport-768px.png',
        'viewport-1440px.png',
        'recruiter-mode-open.png',
        'cs-modal-open.png',
        'fr-lightbox-open.png'
      ];
      artifactScreenshots.forEach(shot => {
        const srcShot = path.join(reportsDir, shot);
        if (fs.existsSync(srcShot)) {
          fs.copyFileSync(srcShot, path.join(brainDir, shot));
        }
      });
      console.log(`Copied report and visual artifacts to brain conversation directory.`);
    } catch (e) {
      console.warn('Note: Could not copy to brain dir:', e.message);
    }
  }

  process.exit(allPassed ? 0 : 1);
}

function generateMarkdownReport(scorecard, durationSec, allPassed) {
  const g1 = scorecard.find(s => s.gate === 'G-01')?.data || {};
  const g2 = scorecard.find(s => s.gate === 'G-02')?.data || {};
  const g3 = scorecard.find(s => s.gate === 'G-03')?.data || {};
  const g4 = scorecard.find(s => s.gate === 'G-04')?.data || {};
  const g5 = scorecard.find(s => s.gate === 'G-05')?.data || {};
  const g6 = scorecard.find(s => s.gate === 'G-06')?.data || {};

  return `# Portfolio v2 Automated Release-Check Audit Report

**Generated:** ${new Date().toUTCString()}  
**Pipeline Duration:** ${durationSec}s  
**Overall Release Status:** ${allPassed ? '✅ **RELEASE APPROVED (PASS)**' : '⛔ **MERGE BLOCKED (FAIL)**'}

---

## 1. Executive Summary & Gate Scorecard

| Gate | Domain | Target | Measured Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| **G-01** | **Static Build Engine** | Clean \`npm run build\` generation into \`dist/\` | ${scorecard.find(s => s.gate === 'G-01')?.measured} | **${g1.passed ? 'PASS' : 'FAIL'}** |
| **G-02** | **Leak Prevention** | 0 visible TBD, YOUR-DOMAIN, broken asset paths | ${scorecard.find(s => s.gate === 'G-02')?.measured} | **${g2.passed ? 'PASS' : 'FAIL'}** |
| **G-03** | **Lighthouse & axe-core** | Perf ≥ 90, A11y = 100, SEO = 100 (0 axe bugs) | ${scorecard.find(s => s.gate === 'G-03')?.measured} | **${g3.passed ? 'PASS' : 'FAIL'}** |
| **G-04** | **Link & Asset Integrity** | 100% local assets & external URLs valid | ${scorecard.find(s => s.gate === 'G-04')?.measured} | **${g4.passed ? 'PASS' : 'FAIL'}** |
| **G-05** | **Content Grounding Diff** | 100% fidelity with \`content/content.json\` | ${scorecard.find(s => s.gate === 'G-05')?.measured} | **${g5.passed ? 'PASS' : 'FAIL'}** |
| **G-06** | **Interactive & Visual** | Flawless keyboard pass, zero 320/768/1440px overflow | ${scorecard.find(s => s.gate === 'G-06')?.measured} | **${g6.passed ? 'PASS' : 'FAIL'}** |

---

## 2. Gate 01: Static Build Engine (\`npm run build\`)

- **Execution Status:** ${g1.passed ? 'SUCCESS (Exit Code 0)' : 'FAILED'}
- **Build Duration:** ${g1.durationMs}ms
- **Generated Artifacts:**
  - \`dist/index.html\` (${(g1.htmlSize / 1024).toFixed(1)} KB)
  - \`dist/assets/\` (${g1.assetsCount} static files copied)

\`\`\`
${g1.stdout?.trim() || g1.error}
\`\`\`

---

## 3. Gate 02: Leak Prevention Audit

- **Total Leaks Identified:** ${g2.totalLeaks || 0}
- **Visible "TBD" Leaks:** ${g2.visibleTbds?.length || 0}
- **"YOUR-DOMAIN" Leaks:** ${g2.yourDomainLeaks?.length || 0}
- **Absolute Local Path Leaks:** ${g2.localAssetPathLeaks?.length || 0}
- **Broken / Missing Assets:** ${g2.missingAssetFiles?.length || 0}

${g2.visibleTbds?.length > 0 ? `
### Visible TBD Findings
${g2.visibleTbds.map((t, idx) => `- **${idx + 1}. [Line ${t.line || '?'}]** \`${t.snippet || t.text}\``).join('\n')}
` : '✔ Zero visible TBD strings detected in rendered DOM.'}

${g2.yourDomainLeaks?.length > 0 ? `
### YOUR-DOMAIN Placeholder Findings (${g2.yourDomainLeaks.length} occurrences)
${g2.yourDomainLeaks.slice(0, 10).map((d, idx) => `- **${idx + 1}. [Line ${d.line}]** \`${d.snippet}\``).join('\n')}
${g2.yourDomainLeaks.length > 10 ? `*...and ${g2.yourDomainLeaks.length - 10} more*` : ''}
` : '✔ Zero ungrounded domain placeholders detected.'}

${g2.missingAssetFiles?.length > 0 ? `
### Missing Local Asset References
${g2.missingAssetFiles.map((m, idx) => `- **${idx + 1}.** \`${m.reference}\` (Resolved: \`${m.resolvedPath}\`)`).join('\n')}
` : '✔ All local asset references resolve to valid disk files.'}

---

## 4. Gate 03: Quality Targets & Accessibility (axe-core)

- **Target Thresholds:** Performance ≥ 90 | Accessibility = 100 | SEO = 100
- **Measured Scores:**
  - **Performance:** **${g3.measured?.perf} / 90** ${g3.measured?.perf >= 90 ? '(PASS)' : '(FAIL)'}
  - **Accessibility:** **${g3.measured?.a11y} / 100** ${g3.measured?.a11y === 100 && g3.axe?.totalViolations === 0 ? '(PASS)' : '(FAIL)'}
  - **SEO:** **${g3.measured?.seo} / 100** ${g3.measured?.seo === 100 ? '(PASS)' : '(FAIL)'}

### axe-core WCAG 2.1 AA/AAA Violations Summary
- **Total Violations:** ${g3.axe?.totalViolations || 0}
- **Critical Impact:** ${g3.axe?.violationCounts?.critical || 0}
- **Serious Impact:** ${g3.axe?.violationCounts?.serious || 0}
- **Moderate Impact:** ${g3.axe?.violationCounts?.moderate || 0}
- **Minor Impact:** ${g3.axe?.violationCounts?.minor || 0}
- **Passed Rules Count:** ${g3.axe?.passesCount || 0}

${g3.axe?.violations?.length > 0 ? `
| Impact | Rule ID | Description / Help | Occurrences |
| :---: | :--- | :--- | :---: |
${g3.axe.violations.map(v => `| **${v.impact.toUpperCase()}** | \`${v.id}\` | ${v.help} | ${v.nodesCount} |`).join('\n')}
` : '✔ Flawless zero-violation WCAG 2.1 AA/AAA compliance.'}

${g3.perfIssues?.length > 0 ? `
### Performance Diagnostics
${g3.perfIssues.map(p => `- ⚠️ ${p}`).join('\n')}
` : ''}

${g3.seoIssues?.length > 0 ? `
### SEO Diagnostics
${g3.seoIssues.map(s => `- ⚠️ ${s}`).join('\n')}
` : ''}

---

## 5. Gate 04: Link & Asset Integrity Audit

- **Local Assets:** ${g4.localAssets?.passed} of ${g4.localAssets?.total} passed (${g4.localAssets?.failed} failed)
- **Internal Section Anchors:** ${g4.internalAnchors?.passed} of ${g4.internalAnchors?.total} passed (${g4.internalAnchors?.failed} failed)
- **External URLs:** ${g4.externalUrls?.passed} of ${g4.externalUrls?.total} passed (${g4.externalUrls?.failed} failed, ${g4.externalUrls?.blocked} bot-challenged/auth)

### External URL Verification Table

| Status | HTTP Code | URL Target |
| :---: | :---: | :--- |
${(g4.externalUrls?.items || []).map(u => `| **${u.status}** | ${u.statusCode} | \`${u.url}\` |`).join('\n')}

---

## 6. Gate 05: Content Grounding Diff (\`content/content.json\`)

- **Rule:** \`content/content.json\` is the ONLY source of facts.
- **Total Discrepancies:** ${g5.totalMismatches || 0}
  - Critical Divergences: ${g5.criticalCount || 0}
  - High Severity Divergences: ${g5.highCount || 0}

${g5.mismatches?.length > 0 ? `
| Severity | Location / Section | Rendered Text | Canonical \`content.json\` | Detail |
| :---: | :--- | :--- | :--- | :--- |
${g5.mismatches.map(m => `| **${m.severity}** | ${m.area} | \`${m.rendered.slice(0, 35)}\` | \`${m.contentJson.slice(0, 35)}\` | ${m.detail} |`).join('\n')}
` : '✔ 100% strict adherence to content.json.'}

---

## 7. Gate 06: Headless Chrome CDP Viewport & Keyboard Walkthrough

### Viewport Responsiveness Audit

| Viewport | Target Dimensions | Horizontal Overflow | Result | Artifact |
| :---: | :---: | :---: | :---: | :--- |
| **Mobile** | 320 x 568 (DPR 2) | ${g6.viewports?.['320px']?.metrics?.overflowPx || 0}px | **${g6.viewports?.['320px']?.passed ? 'PASS' : 'FAIL'}** | \`reports/viewport-320px.png\` |
| **Tablet** | 768 x 1024 (DPR 2) | ${g6.viewports?.['768px']?.metrics?.overflowPx || 0}px | **${g6.viewports?.['768px']?.passed ? 'PASS' : 'FAIL'}** | \`reports/viewport-768px.png\` |
| **Desktop** | 1440 x 900 (DPR 1) | ${g6.viewports?.['1440px']?.metrics?.overflowPx || 0}px | **${g6.viewports?.['1440px']?.passed ? 'PASS' : 'FAIL'}** | \`reports/viewport-1440px.png\` |

### Keyboard Navigation & Dialog Trap Verification

- **Sequential Tab Navigation:** Logical DOM traversal through brand link, navigation anchors, recruiter toggle, and social actions.
- **Recruiter Mode (#rm-toggle):**
  - \`Enter\` / \`Space\` triggers expansion of \`#rm-summary-drawer\` (\`hidden = false\`).
  - \`Enter\` closes drawer and restores focus.
  - **Status:** **${g6.interactions?.find(i => i.step === 'recruiter_mode_keyboard')?.passed ? 'PASS' : 'FAIL'}**
- **Competition Telemetry Modal (#cs-modal):**
  - Opens via keyboard trigger.
  - \`Escape\` closes modal and restores focus to trigger.
  - **Status:** **${g6.interactions?.find(i => i.step === 'cs_modal_keyboard')?.passed ? 'PASS' : 'FAIL'}**
- **Field Record Lightbox (#fr-lightbox):**
  - Opens on Enter and closes cleanly on Escape.
  - **Status:** **${g6.interactions?.find(i => i.step === 'fr_lightbox_keyboard')?.passed ? 'PASS' : 'FAIL'}**

---

## 8. Actionable Remediation Plan to Unblock Release

To bring all gates to **100% PASS**:

1. **Centralize Canonical Domain (Gate 2 & 4)**:
   - Configure single production domain in \`content/content.json\` to eliminate \`YOUR-DOMAIN\` occurrences in meta tags, sitemap, and JSON-LD schema.
2. **Suppress Teammate TBD (Gate 2 & 5)**:
   - For Builders' Bootcamp squad, suppress \`"TBD"\` rendering in the UI when the squad member is unconfirmed.
3. **Align Recruiter Mode Claims with Evidence (Gate 5)**:
   - Update Recruiter Mode copy from "production software systems" to "software systems & utilities" and replace "Sole 1st-year team" with "First-year team vs postgraduate MBA cohorts" to match \`content.json\`.
4. **Fix 320px Ultra-Narrow Overflow (Gate 6)**:
   - Apply \`min-width: 0\` and \`overflow-wrap: break-word\` on the navigation container and venture card terminal blocks.
5. **Resolve axe-core Serious Violations (Gate 3)**:
   - Correct \`aria-hidden="true"\` on focusable elements and ensure WCAG AA color contrast on badge subtext.
`;
}

main().catch(err => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
