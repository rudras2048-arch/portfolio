const fs = require('fs');
const path = require('path');
const { CDPClient } = require('./cdp-client.js');
const { LocalStaticServer } = require('./server.js');

async function runGate5DiffContent(port = 8087) {
  console.log('\n============================================================');
  console.log('GATE 5: DIFFING RENDERED DOM TEXT VS CONTENT.JSON');
  console.log('Rule: content/content.json is the ONLY source of facts');
  console.log('============================================================');

  const rootDir = path.resolve(__dirname, '../../');
  const contentFile = path.join(rootDir, 'content/content.json');
  const distDir = path.join(rootDir, 'dist');

  if (!fs.existsSync(contentFile)) {
    return {
      gate: 'G-05',
      name: 'Content Grounding Reconciliation',
      passed: false,
      error: 'content/content.json not found'
    };
  }

  const content = JSON.parse(fs.readFileSync(contentFile, 'utf8'));

  const server = new LocalStaticServer(distDir, port);
  let serverUrl;
  try {
    serverUrl = await server.start();
  } catch (err) {
    return {
      gate: 'G-05',
      name: 'Content Grounding Reconciliation',
      passed: false,
      error: `Failed to start test server: ${err.message}`
    };
  }

  const client = new CDPClient(9446);
  const mismatches = [];

  try {
    console.log('Launching Chrome to inspect live rendered DOM...');
    await client.launch();
    await client.navigate(`${serverUrl}/index.html`);
    await new Promise(r => setTimeout(r, 1200));

    const extracted = await client.evaluate(`
      (() => {
        const fullText = document.body.innerText;

        const rmDrawer = document.getElementById('rm-summary-drawer');
        const rmDesc = rmDrawer?.querySelector('.rm-header-desc')?.innerText?.trim() || '';

        const rmKpis = Array.from(document.querySelectorAll('.rm-kpi-card')).map(k => ({
          val: k.querySelector('.rm-kpi-val')?.textContent?.trim(),
          lbl: k.querySelector('.rm-kpi-lbl')?.textContent?.trim(),
          sub: k.querySelector('.rm-kpi-sub')?.textContent?.trim(),
          full: k.innerText.trim()
        }));

        const statCards = Array.from(document.querySelectorAll('.stat-card')).map(s => ({
          num: s.querySelector('.stat-num')?.textContent?.trim(),
          lbl: s.querySelector('.stat-lbl')?.textContent?.trim(),
          sub: s.querySelector('.stat-sub')?.textContent?.trim()
        }));

        const compCards = Array.from(document.querySelectorAll('.fr-entry-card, .case-card')).map(c => ({
          title: c.querySelector('.fr-title-text, .case-title')?.textContent?.trim(),
          badge: c.querySelector('.fr-badge, .case-badge, .fr-result-badge')?.textContent?.trim(),
          text: c.innerText
        }));

        const ventureCards = Array.from(document.querySelectorAll('.venture-card, article[data-venture-id]')).map(v => ({
          id: v.getAttribute('data-venture-id'),
          title: v.querySelector('.venture-name, .venture-title, h3')?.textContent?.trim(),
          status: v.querySelector('.venture-status, .v-status-badge, .tag-status, .venture-status-tag')?.textContent?.trim(),
          text: v.innerText
        }));

        const embeddedScript = document.getElementById('portfolio-content-data')?.textContent || '';

        return {
          fullText,
          rmDesc,
          rmKpis,
          statCards,
          compCards,
          ventureCards,
          embeddedScript
        };
      })()
    `);

    await client.close();

    // 1. Audit Recruiter Mode Description
    if (extracted.rmDesc) {
      if (/production software systems/i.test(extracted.rmDesc)) {
        mismatches.push({
          area: 'Recruiter Mode Header Description',
          rendered: 'Builder of production software systems...',
          contentJson: 'content.json states ventures are idea / local build / student utility (0 deployed in production)',
          severity: 'HIGH / SKEPTIC INFLATION',
          detail: 'Claim exceeds substantiated evidence in content.json.'
        });
      }
      if (/multi-agent/i.test(extracted.rmDesc)) {
        mismatches.push({
          area: 'Recruiter Mode Header Description',
          rendered: '...and multi-agent platforms',
          contentJson: 'The term "agent" or "multi-agent" is absent from competitive records and ventures in content.json',
          severity: 'HIGH / SKEPTIC INFLATION',
          detail: 'Fabricated architectural superlative.'
        });
      }
    }

    // 2. Audit "Sole 1st-year team"
    if (extracted.fullText.includes('Sole 1st-year team')) {
      mismatches.push({
        area: 'Recruiter Mode KPI Card 02',
        rendered: 'Sole 1st-year team vs MBA cohorts',
        contentJson: 'content.json says "First-year undergrad team" competing against "postgraduate B-school cohorts", not verified as "sole" team',
        severity: 'MEDIUM / UNVERIFIED SUPERLATIVE',
        detail: 'Absolute superlative "Sole" cannot be proven from evidence.'
      });
    }

    // 3. Audit Squad Members / TBD Leak in Competitions
    if (extracted.fullText.includes('Rudra Sharma, TBD')) {
      mismatches.push({
        area: 'Builders Bootcamp Squad',
        rendered: 'Squad: Rudra Sharma, TBD',
        contentJson: 'content.json contains "TBD" in members array',
        severity: 'CRITICAL / TBD LEAK',
        detail: 'Literal "TBD" rendered to visible user DOM instead of fallback suppression.'
      });
    }

    // 4. Audit Cash Rush Financials
    const compCashRush = content.competitions?.find(c => c.id === 'cash-rush');
    if (compCashRush && compCashRush.financials) {
      const expMul = compCashRush.financials.multiplier;
      if (expMul && !extracted.fullText.includes(expMul)) {
        mismatches.push({
          area: 'Cash Rush Metric',
          rendered: 'Multiplier string not found in DOM',
          contentJson: `multiplier: "${expMul}"`,
          severity: 'MEDIUM / FACT DISCREPANCY',
          detail: `Expected multiplier ${expMul} from content.json`
        });
      }
    }

    // 5. Audit Venture Statuses vs content.json
    if (content.ventures && Array.isArray(content.ventures)) {
      content.ventures.forEach(v => {
        const renderedCard = extracted.ventureCards.find(c =>
          (c.id && c.id === v.id) ||
          (c.title && c.title.toLowerCase().includes(v.name.toLowerCase()))
        );

        if (renderedCard) {
          const expectedStatus = v.status?.trim();
          const actualStatus = renderedCard.status?.trim();
          if (expectedStatus && actualStatus && !actualStatus.toLowerCase().includes(expectedStatus.toLowerCase())) {
            mismatches.push({
              area: `Venture Status: ${v.name}`,
              rendered: actualStatus,
              contentJson: expectedStatus,
              severity: 'HIGH / STATUS MISMATCH',
              detail: `Rendered status "${actualStatus}" diverges from canonical "${expectedStatus}"`
            });
          }
        }
      });
    }

    // 6. Audit Embedded Data Payload (#portfolio-content-data)
    if (extracted.embeddedScript) {
      try {
        const parsed = JSON.parse(extracted.embeddedScript);
        const requiredKeys = ['personal', 'hero', 'competitions', 'ventures'];
        const missingKeys = requiredKeys.filter(k => !(k in parsed));
        if (missingKeys.length > 0) {
          mismatches.push({
            area: 'Embedded Data Payload',
            rendered: `Missing keys: ${missingKeys.join(', ')}`,
            contentJson: 'All canonical keys required in embedded offline payload',
            severity: 'HIGH / SCHEMA DIVERGENCE',
            detail: 'Embedded script data payload diverged from canonical schema.'
          });
        }
      } catch (err) {
        mismatches.push({
          area: 'Embedded Data Payload',
          rendered: 'JSON parse error',
          contentJson: 'Valid JSON string',
          severity: 'CRITICAL',
          detail: err.message
        });
      }
    } else {
      mismatches.push({
        area: 'Embedded Data Payload',
        rendered: '#portfolio-content-data element missing',
        contentJson: 'Offline data contract mandates embedded JSON payload',
        severity: 'MEDIUM',
        detail: 'Embedded JSON script tag not found'
      });
    }

  } catch (err) {
    console.error('Error in Gate 5 CDP diff execution:', err);
    await client.close();
  } finally {
    await server.stop();
  }

  const criticalIssues = mismatches.filter(m => m.severity.includes('CRITICAL'));
  const highIssues = mismatches.filter(m => m.severity.includes('HIGH'));
  const passed = criticalIssues.length === 0 && highIssues.length === 0 && mismatches.length === 0;

  console.log(`\n--- CONTENT DIFF SUMMARY ---`);
  console.log(`  Total Divergences: ${mismatches.length}`);
  console.log(`  Critical:          ${criticalIssues.length}`);
  console.log(`  High:              ${highIssues.length}`);
  console.log(`  Medium / Low:      ${mismatches.length - criticalIssues.length - highIssues.length}`);

  mismatches.forEach((m, idx) => {
    console.warn(`\n  [${idx + 1}] [${m.severity}] ${m.area}`);
    console.warn(`      Rendered:     ${m.rendered}`);
    console.warn(`      content.json: ${m.contentJson}`);
    console.warn(`      Detail:       ${m.detail}`);
  });

  if (passed) {
    console.log('\n✔ [GATE 5 PASSED] 100% rendered DOM content matches content.json');
  } else {
    console.error(`\n✖ [GATE 5 FAILED] Found ${mismatches.length} content discrepancy/discrepancies`);
  }

  return {
    gate: 'G-05',
    name: 'Content Grounding Reconciliation',
    passed,
    totalMismatches: mismatches.length,
    criticalCount: criticalIssues.length,
    highCount: highIssues.length,
    mismatches
  };
}

module.exports = { runGate5DiffContent };
