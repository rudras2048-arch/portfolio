#!/usr/bin/env node
/**
 * ============================================================================
 * ADVERSARIAL STRESS-TEST SUITE FOR PORTFOLIO V2
 * ============================================================================
 * Condition 1: 320px ultra-narrow mobile viewport
 * Condition 2: Reduced motion (prefers-reduced-motion: reduce)
 * Condition 3: JavaScript disabled (<noscript> fallback)
 * Condition 4: Slow 3G network simulation (Progressive rendering & CLS)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { CDPClient } = require('./cdp-client.js');
const { LocalStaticServer } = require('./server.js');

async function runAdversarialSuite() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        PORTFOLIO V2 ADVERSARIAL STRESS-TEST SUITE                ║');
  console.log('║        Aggressive Edge Condition Telemetry & Verification        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const rootDir = path.resolve(__dirname, '../../');
  const distDir = path.join(rootDir, 'dist');
  const reportsDir = path.join(rootDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const server = new LocalStaticServer(distDir, 8099);
  const serverUrl = await server.start();
  console.log(`[INFO] Adversarial test server running at ${serverUrl}`);

  const results = {
    c1_320px: null,
    c2_reducedMotion: null,
    c3_noScript: null,
    c4_slow3g: null
  };

  // --------------------------------------------------------------------------
  // TEST 1: 320px ULTRA-NARROW MOBILE VIEWPORT
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 1] 320px Ultra-Narrow Mobile Viewport ---');
  {
    const client = new CDPClient(9461);
    await client.launch();
    await client.setViewport({
      width: 320,
      height: 568,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });

    await client.navigate(`${serverUrl}/index.html`);
    await new Promise(r => setTimeout(r, 1200));

    const metrics = await client.evaluate(`
      (() => {
        const innerW = window.innerWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyScrollW = document.body.scrollWidth;

        // 1. Horizontal overflow
        const overflowing = [];
        for (const el of document.querySelectorAll('*')) {
          if (['SCRIPT', 'STYLE', 'HEAD', 'TEMPLATE'].includes(el.tagName)) continue;
          if (el.tagName === 'DIALOG' && !el.open) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const rect = el.getBoundingClientRect();
          if (rect.right > innerW + 1.0) {
            overflowing.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className || null,
              width: Math.round(rect.width * 10) / 10,
              right: Math.round(rect.right * 10) / 10,
              overflowPx: Math.round((rect.right - innerW) * 10) / 10,
              snippet: (el.textContent || '').trim().slice(0, 40)
            });
          }
        }

        // 2. Text legibility
        const illegibleText = [];
        for (const el of document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, li')) {
          if (['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const text = (el.textContent || '').trim();
          if (!text) continue;
          const fontSize = parseFloat(style.fontSize) || 16;
          // Primary content should be at least 11px on mobile
          if (fontSize < 11) {
            illegibleText.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              text: text.slice(0, 30),
              fontSize
            });
          }
        }

        // 3. Touch targets
        const touchTargets = [];
        for (const el of document.querySelectorAll('button, input, select, textarea, [role=\"button\"], [role=\"tab\"]')) {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          touchTargets.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: (el.className || '').toString().slice(0, 30),
            text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 25),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isUnderMin: rect.width < 24 || rect.height < 24
          });
        }

        const tinyTargets = touchTargets.filter(t => t.isUnderMin);

        return {
          innerW,
          scrollW,
          bodyScrollW,
          overflowPx: Math.max(0, scrollW - innerW, bodyScrollW - innerW),
          overflowingElements: overflowing,
          illegibleTextCount: illegibleText.length,
          illegibleTextSamples: illegibleText.slice(0, 5),
          totalTouchTargets: touchTargets.length,
          tinyTargetsCount: tinyTargets.length,
          tinyTargets: tinyTargets.slice(0, 8)
        };
      })()
    `);

    const screenshotPath = path.join(reportsDir, 'adversarial-320px.png');
    await client.captureScreenshot(screenshotPath);

    const passed = metrics.overflowPx === 0 && metrics.illegibleTextCount === 0 && metrics.tinyTargetsCount === 0;
    results.c1_320px = {
      passed,
      metrics,
      screenshot: screenshotPath
    };

    console.log(`  - Horizontal Overflow: ${metrics.overflowPx}px (Elements: ${metrics.overflowingElements.length}) -> ${metrics.overflowPx === 0 ? '✔ PASS' : '✖ FAIL'}`);
    console.log(`  - Text Legibility (<10px text): ${metrics.illegibleTextCount} elements -> ${metrics.illegibleTextCount === 0 ? '✔ PASS' : '✖ FAIL'}`);
    console.log(`  - Touch Targets Analyzed: ${metrics.totalTouchTargets} (Sub-24px: ${metrics.tinyTargetsCount})`);
    if (metrics.tinyTargetsCount > 0) {
      console.log('    Noticeable small targets:', metrics.tinyTargets);
    }
    console.log(`  - Screenshot captured: ${screenshotPath}`);

    await client.close();
  }

  // --------------------------------------------------------------------------
  // TEST 2: REDUCED MOTION (prefers-reduced-motion: reduce)
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 2] Reduced Motion (prefers-reduced-motion: reduce) ---');
  {
    const client = new CDPClient(9462);
    await client.launch();

    // Emulate reduced motion
    await client.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });

    await client.navigate(`${serverUrl}/index.html`);
    await new Promise(r => setTimeout(r, 1200));

    const motionTelemetry = await client.evaluate(`
      new Promise((resolve) => {
        const reducedMatch = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const canvasEngine = window.__CANVAS_ENGINE || {};
        
        // Check cursor (if present in DOM)
        const cursorEl = document.querySelector('.typed-cursor');
        const hasCursor = Boolean(cursorEl);
        const cursorStyle = cursorEl ? window.getComputedStyle(cursorEl) : {};
        const cursorAnim = cursorStyle.animationName || cursorStyle.animation || 'none';
        const cursorOpacity = cursorStyle.opacity;

        // Check reveals
        const reveals = Array.from(document.querySelectorAll('.reveal, .ab-reveal')).map(el => {
          const s = window.getComputedStyle(el);
          return {
            id: el.id || '',
            className: el.className,
            opacity: s.opacity,
            transform: s.transform,
            transitionDuration: s.transitionDuration
          };
        });

        const revealsStatic = reveals.every(r => parseFloat(r.opacity) >= 0.99 && (r.transform === 'none' || r.transform.includes('matrix(1, 0, 0, 1, 0, 0)')));

        // Monitor requestAnimationFrame calls over 500ms
        let rafCalls = 0;
        const originalRaf = window.requestAnimationFrame;
        window.requestAnimationFrame = function(cb) {
          rafCalls++;
          return originalRaf.apply(this, arguments);
        };

        setTimeout(() => {
          resolve({
            reducedMatch,
            canvasActive: canvasEngine.active,
            canvasReduced: canvasEngine.reduced,
            canvasPausedClass: document.querySelector('.pf-canvas-layer')?.classList.contains('pf-canvas-paused'),
            canvasStaticClass: document.querySelector('.pf-canvas-layer')?.classList.contains('pf-canvas-static'),
            rafCalls500ms: rafCalls,
            cursorAnim,
            cursorOpacity,
            hasCursor,
            revealsCount: reveals.length,
            revealsStatic,
            revealsFailing: reveals.filter(r => !(parseFloat(r.opacity) >= 0.99 && (r.transform === 'none' || r.transform.includes('matrix(1, 0, 0, 1, 0, 0)')))).slice(0, 5)
          });
        }, 500);
      })
    `);

    const screenshotPath = path.join(reportsDir, 'adversarial-reduced-motion.png');
    await client.captureScreenshot(screenshotPath);

    const canvasStopped = motionTelemetry.canvasActive === false;
    const cursorStatic = !motionTelemetry.hasCursor || (motionTelemetry.cursorAnim === 'none' && motionTelemetry.cursorOpacity === '1');
    const passed = motionTelemetry.reducedMatch && canvasStopped && motionTelemetry.revealsStatic && cursorStatic;

    results.c2_reducedMotion = {
      passed,
      motionTelemetry,
      screenshot: screenshotPath
    };

    console.log(`  - Media Query Match: ${motionTelemetry.reducedMatch ? '✔ PASS' : '✖ FAIL'}`);
    console.log(`  - Canvas Loop Stopped: active=${motionTelemetry.canvasActive}, reduced=${motionTelemetry.canvasReduced} -> ${canvasStopped ? '✔ PASS' : '✖ FAIL'}`);
    console.log(`  - Reveals Render Statically (opacity=1, transform=none): ${motionTelemetry.revealsStatic ? '✔ PASS' : '✖ FAIL'} (Failing: ${motionTelemetry.revealsFailing.length})`);
    console.log(`  - Cursor Does Not Blink: anim="${motionTelemetry.cursorAnim}", opacity=${motionTelemetry.cursorOpacity} -> ${cursorStatic ? '✔ PASS' : '✖ FAIL'}`);
    console.log(`  - Screenshot captured: ${screenshotPath}`);

    await client.close();
  }

  // --------------------------------------------------------------------------
  // TEST 3: JAVASCRIPT DISABLED (<noscript> fallback)
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 3] JavaScript Disabled (<noscript> fallback) ---');
  {
    const client = new CDPClient(9463);
    await client.launch();

    // Disable JavaScript execution in Chrome
    await client.send('Emulation.setScriptExecutionDisabled', { value: true });

    await client.navigate(`${serverUrl}/index.html`);
    await new Promise(r => setTimeout(r, 1200));

    // Note: Since script execution is disabled on the page, client.evaluate might not run in page context.
    // However, Chrome CDP Runtime.evaluate still executes in DevTools isolated context or we can test using DOM.getDocument!
    let domCheck = null;
    try {
      domCheck = await client.evaluate(`
        (() => {
          const bodyStyle = window.getComputedStyle(document.body);
          const sections = ['#hero', '#about', '#competitions', '#ventures', '#contact'];
          const sectionStates = sections.map(sel => {
            const el = document.querySelector(sel);
            if (!el) return { selector: sel, found: false };
            const s = window.getComputedStyle(el);
            return {
              selector: sel,
              found: true,
              opacity: s.opacity,
              visibility: s.visibility,
              display: s.display
            };
          });

          // Check all reveal elements
          const zeroOpacityEls = [];
          for (const el of document.querySelectorAll('.reveal, .ab-reveal, .stat-card, .case-card, .venture-card, .contact-card, .ab-card, .ab-milestone')) {
            const s = window.getComputedStyle(el);
            if (s.opacity === '0' || s.visibility === 'hidden') {
              zeroOpacityEls.push({
                tag: el.tagName.toLowerCase(),
                id: el.id || null,
                className: el.className || null,
                opacity: s.opacity,
                visibility: s.visibility,
                text: (el.textContent || '').trim().slice(0, 30)
              });
            }
          }

          return {
            bodyBackground: bodyStyle.backgroundColor,
            sectionStates,
            zeroOpacityCount: zeroOpacityEls.length,
            zeroOpacityElements: zeroOpacityEls
          };
        })()
      `);
    } catch (evalErr) {
      console.warn('Script execution is disabled so Runtime.evaluate threw:', evalErr.message);
    }

    const screenshotPath = path.join(reportsDir, 'adversarial-noscript.png');
    await client.captureScreenshot(screenshotPath);

    const hasZeroOpacityContent = domCheck && domCheck.zeroOpacityCount > 0;
    const passed = domCheck && !hasZeroOpacityContent;

    results.c3_noScript = {
      passed,
      domCheck,
      screenshot: screenshotPath
    };

    console.log(`  - Page sections rendered: ${domCheck ? '✔' : '✖'}`);
    if (domCheck) {
      console.log(`  - Zero-opacity content leaks: ${domCheck.zeroOpacityCount} -> ${domCheck.zeroOpacityCount === 0 ? '✔ PASS' : '✖ FAIL (Broken Content)'}`);
      if (domCheck.zeroOpacityCount > 0) {
        console.log('    Failing 0-opacity elements:', domCheck.zeroOpacityElements);
      }
    }
    console.log(`  - Screenshot captured: ${screenshotPath}`);

    await client.close();
  }

  // --------------------------------------------------------------------------
  // TEST 4: SLOW 3G NETWORK SIMULATION
  // --------------------------------------------------------------------------
  console.log('\n--- [TEST 4] Slow 3G Network Simulation & Layout Shift ---');
  {
    const client = new CDPClient(9464);
    await client.launch();

    // Enable Network and emulate Slow 3G
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400, // 400ms latency
      downloadThroughput: (400 * 1024) / 8, // 400 kbps
      uploadThroughput: (400 * 1024) / 8, // 400 kbps
      connectionType: 'cellular3g'
    });

    console.log('  Navigating on Simulated Slow 3G (400ms latency, 400kbps)...');
    const navStart = Date.now();
    await client.navigate(`${serverUrl}/index.html`, 25000);
    const navEnd = Date.now();
    console.log(`  Navigation settled in ${navEnd - navStart}ms.`);

    await new Promise(r => setTimeout(r, 2000));

    const clsAndMetrics = await client.evaluate(`
      (() => {
        const nav = performance.getEntriesByType('navigation')[0] || {};
        const paints = performance.getEntriesByType('paint') || [];
        const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime || 0;

        // Measure layout shift entries
        const layoutShifts = performance.getEntriesByType('layout-shift') || [];
        let clsScore = 0;
        const shifts = [];
        for (const entry of layoutShifts) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
            shifts.push({
              value: entry.value,
              startTime: Math.round(entry.startTime)
            });
          }
        }

        // Verify key structural elements rendered
        const hasHero = !!document.querySelector('#hero');
        const hasAbout = !!document.querySelector('#about');
        const hasComps = !!document.querySelector('#competitions');
        const hasVentures = !!document.querySelector('#ventures');
        const hasContact = !!document.querySelector('#contact');

        return {
          fcpMs: Math.round(fcp),
          domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime) || 0,
          clsScore: Math.round(clsScore * 1000) / 1000,
          shiftCount: shifts.length,
          structuralIntegrity: hasHero && hasAbout && hasComps && hasVentures && hasContact
        };
      })()
    `);

    const screenshotPath = path.join(reportsDir, 'adversarial-slow3g.png');
    await client.captureScreenshot(screenshotPath);

    const passed = clsAndMetrics.clsScore <= 0.1 && clsAndMetrics.structuralIntegrity;
    results.c4_slow3g = {
      passed,
      clsAndMetrics,
      screenshot: screenshotPath
    };

    console.log(`  - First Contentful Paint: ${clsAndMetrics.fcpMs}ms`);
    console.log(`  - Cumulative Layout Shift (CLS): ${clsAndMetrics.clsScore} (Target <= 0.10) -> ${clsAndMetrics.clsScore <= 0.1 ? '✔ PASS' : '✖ FAIL'}`);
    console.log(`  - Structural Integrity: ${clsAndMetrics.structuralIntegrity ? '✔ PASS' : '✖ FAIL'}`);
    console.log(`  - Screenshot captured: ${screenshotPath}`);

    await client.close();
  }

  await server.stop();

  // Summary
  console.log('\n==================================================================');
  console.log('             ADVERSARIAL STRESS-TEST SCORECARD                   ');
  console.log('==================================================================');
  console.log(`Condition 1 (320px Mobile):    ${results.c1_320px.passed ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`Condition 2 (Reduced Motion):   ${results.c2_reducedMotion.passed ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`Condition 3 (JS Disabled):      ${results.c3_noScript.passed ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`Condition 4 (Slow 3G Network):  ${results.c4_slow3g.passed ? '✔ PASS' : '✖ FAIL'}`);
  console.log('==================================================================');

  const allPassed = results.c1_320px.passed && results.c2_reducedMotion.passed && results.c3_noScript.passed && results.c4_slow3g.passed;
  console.log(`Overall Adversarial Status: ${allPassed ? '✔ ALL PASSED' : '⛔ ADVERSARIAL FAILURES DETECTED'}\n`);

  fs.writeFileSync(path.join(reportsDir, 'adversarial_test_results.json'), JSON.stringify(results, null, 2));

  return { allPassed, results };
}

if (require.main === module) {
  runAdversarialSuite().catch(err => {
    console.error('Adversarial suite crashed:', err);
    process.exit(1);
  });
}

module.exports = { runAdversarialSuite };
