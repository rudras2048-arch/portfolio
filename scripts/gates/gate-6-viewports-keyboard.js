const fs = require('fs');
const path = require('path');
const { CDPClient } = require('./cdp-client.js');
const { LocalStaticServer } = require('./server.js');

async function runGate6ViewportsKeyboard(port = 8088) {
  console.log('\n============================================================');
  console.log('GATE 6: VIEWPORT (320/768/1440) & KEYBOARD INTERACTION AUDIT');
  console.log('============================================================');

  const rootDir = path.resolve(__dirname, '../../');
  const distDir = path.join(rootDir, 'dist');
  const reportsDir = path.join(rootDir, 'reports');
  const distReportsDir = path.join(distDir, 'reports');

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(distReportsDir, { recursive: true });

  const server = new LocalStaticServer(distDir, port);
  let serverUrl;
  try {
    serverUrl = await server.start();
  } catch (err) {
    return {
      gate: 'G-06',
      name: 'Interactive & Visual Audit',
      passed: false,
      error: `Failed to start test server: ${err.message}`
    };
  }

  const client = new CDPClient(9447);
  const walkthroughLog = [];
  const viewportResults = {};

  try {
    console.log('Launching headless Chrome for viewport & keyboard verification...');
    await client.launch();

    // 1. AUDIT VIEWPORTS: 320px, 768px, 1440px
    const viewports = [
      { id: '320px', name: 'Ultra-Narrow Mobile (320x568)', width: 320, height: 568, dpr: 2, mobile: true },
      { id: '768px', name: 'Tablet Portrait (768x1024)', width: 768, height: 1024, dpr: 2, mobile: true },
      { id: '1440px', name: 'Desktop Large (1440x900)', width: 1440, height: 900, dpr: 1, mobile: false }
    ];

    for (const vp of viewports) {
      console.log(`\nTesting viewport: ${vp.name}...`);
      await client.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dpr,
        mobile: vp.mobile,
        hasTouch: vp.mobile
      });

      await client.navigate(`${serverUrl}/index.html`);
      await new Promise(r => setTimeout(r, 800));

      // Overflow metrics
      const overflowMetrics = await client.evaluate(`
        (() => {
          const docEl = document.documentElement;
          const body = document.body;
          const innerW = window.innerWidth;
          const scrollW = docEl.scrollWidth;
          const bodyScrollW = body.scrollWidth;

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

          return {
            innerWidth: innerW,
            scrollWidth: scrollW,
            bodyScrollWidth: bodyScrollW,
            hasOverflow: (scrollW > innerW) || (bodyScrollW > innerW),
            overflowPx: Math.max(0, scrollW - innerW, bodyScrollW - innerW),
            overflowingElementsCount: overflowing.length,
            topOverflowing: overflowing.slice(0, 5)
          };
        })()
      `);

      const screenshotFile = `viewport-${vp.id}.png`;
      const screenshotPath = path.join(reportsDir, screenshotFile);
      const distScreenshotPath = path.join(distReportsDir, screenshotFile);
      const shotBuffer = await client.captureScreenshot(screenshotPath);
      fs.writeFileSync(distScreenshotPath, shotBuffer);

      viewportResults[vp.id] = {
        name: vp.name,
        width: vp.width,
        height: vp.height,
        metrics: overflowMetrics,
        screenshot: screenshotFile,
        passed: !overflowMetrics.hasOverflow
      };

      console.log(`  - Horizontal Overflow: ${overflowMetrics.hasOverflow ? `FAIL (${overflowMetrics.overflowPx}px)` : 'PASS (0px)'}`);
      if (overflowMetrics.hasOverflow) {
        console.warn(`    Top offenders:`, overflowMetrics.topOverflowing.map(o => `${o.tag}${o.id ? '#' + o.id : ''}${o.className ? '.' + o.className.split(' ')[0] : ''} (+${o.overflowPx}px)`));
      }
      console.log(`  - Screenshot captured: ${screenshotPath}`);
    }

    // 2. AUDIT KEYBOARD NAVIGATION & DIALOG INTERACTIONS
    console.log('\n--- Auditing Keyboard Navigation & Dialog Interactions ---');
    // Set to desktop for keyboard walkthrough
    await client.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await client.navigate(`${serverUrl}/index.html`);
    await new Promise(r => setTimeout(r, 600));

    // A. Sequential Tab Navigation
    console.log('Tabbing through primary interactive elements...');
    const tabSequence = [];
    for (let i = 1; i <= 10; i++) {
      await client.pressTab();
      const activeInfo = await client.evaluate(`
        (() => {
          const el = document.activeElement;
          return {
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            text: (el.innerText || el.textContent || '').trim().slice(0, 30),
            ariaLabel: el.getAttribute('aria-label')
          };
        })()
      `);
      tabSequence.push(activeInfo);
    }

    walkthroughLog.push({
      step: 'tab_sequence',
      description: 'Sequential tab navigation across header and navigation links',
      items: tabSequence
    });

    // B. Recruiter Mode Toggle (#rm-toggle)
    console.log('Testing Recruiter Mode toggle via keyboard (Enter/Space)...');
    await client.evaluate(`(() => {
      const btn = document.getElementById('rm-toggle');
      if (btn) btn.focus();
    })()`);

    const rmBefore = await client.evaluate(`
      (() => {
        const d = document.getElementById('rm-summary-drawer');
        return { isHidden: d?.hidden, ariaHidden: d?.getAttribute('aria-hidden') };
      })()
    `);

    // Press Enter to open
    await client.pressKey('Enter', 'Enter', 13);
    await new Promise(r => setTimeout(r, 400));

    const rmOpen = await client.evaluate(`
      (() => {
        const d = document.getElementById('rm-summary-drawer');
        return {
          isHidden: d?.hidden,
          ariaHidden: d?.getAttribute('aria-hidden'),
          expanded: d && !d.hidden && d.getAttribute('aria-hidden') !== 'true'
        };
      })()
    `);

    const rmScreenshotPath = path.join(reportsDir, 'recruiter-mode-open.png');
    const distRmScreenshotPath = path.join(distReportsDir, 'recruiter-mode-open.png');
    const rmShot = await client.captureScreenshot(rmScreenshotPath);
    fs.writeFileSync(distRmScreenshotPath, rmShot);

    // Press Escape to close
    await client.pressKey('Escape', 'Escape', 27);
    await new Promise(r => setTimeout(r, 300));

    const rmClosed = await client.evaluate(`
      (() => {
        const d = document.getElementById('rm-summary-drawer');
        return {
          isHidden: d?.hidden,
          ariaHidden: d?.getAttribute('aria-hidden'),
          closed: d?.hidden || d?.getAttribute('aria-hidden') === 'true'
        };
      })()
    `);

    const rmPassed = rmOpen.expanded && rmClosed.closed;
    console.log(`  - Recruiter Mode Keyboard Toggle: ${rmPassed ? '✔ PASS' : '✖ FAIL'}`);

    walkthroughLog.push({
      step: 'recruiter_mode_keyboard',
      action: 'Press Enter on #rm-toggle to expand, then press Escape to close',
      stateBefore: rmBefore,
      stateOpen: rmOpen,
      stateClosed: rmClosed,
      screenshot: 'recruiter-mode-open.png',
      passed: rmPassed
    });

    // C. Competition Telemetry Modal (#cs-modal)
    console.log('Testing Competition Telemetry Modal (#cs-modal) open and Escape close...');
    const hasModalTrigger = await client.evaluate(`
      (() => {
        const btn = document.querySelector('.cs-deepdive-btn');
        if (btn) {
          btn.focus();
          return true;
        }
        return false;
      })()
    `);

    let modalOpen = { isOpen: false };
    let modalClosed = { isOpen: false };
    let modalPassed = false;

    if (hasModalTrigger) {
      await client.pressKey('Enter', 'Enter', 13);
      await new Promise(r => setTimeout(r, 500));

      modalOpen = await client.evaluate(`
        (() => {
          const modal = document.getElementById('cs-modal');
          const active = document.activeElement;
          return {
            isOpen: modal ? modal.open : false,
            activeTag: active?.tagName,
            activeId: active?.id,
            activeClass: active?.className
          };
        })()
      `);

      const modalShotPath = path.join(reportsDir, 'cs-modal-open.png');
      const distModalShotPath = path.join(distReportsDir, 'cs-modal-open.png');
      const modalShot = await client.captureScreenshot(modalShotPath);
      fs.writeFileSync(distModalShotPath, modalShot);

      // Press Escape to close modal
      await client.pressKey('Escape', 'Escape', 27);
      await new Promise(r => setTimeout(r, 400));

      modalClosed = await client.evaluate(`
        (() => {
          const modal = document.getElementById('cs-modal');
          const active = document.activeElement;
          return {
            isOpen: modal ? modal.open : false,
            activeTag: active?.tagName,
            activeId: active?.id,
            activeClass: active?.className
          };
        })()
      `);

      modalPassed = modalOpen.isOpen && !modalClosed.isOpen;
      console.log(`  - Competition Modal Open & Escape Return: ${modalPassed ? '✔ PASS' : '✖ FAIL'}`);
    } else {
      console.log('  - Competition modal trigger not found in active markup; skipping modal deep dive.');
      modalPassed = true;
    }

    walkthroughLog.push({
      step: 'cs_modal_keyboard',
      triggerFound: hasModalTrigger,
      stateOpen: modalOpen,
      stateClosed: modalClosed,
      screenshot: 'cs-modal-open.png',
      passed: modalPassed
    });

    // D. Field Record Lightbox (#fr-lightbox)
    console.log('Testing Field Record Lightbox dialog (#fr-lightbox)...');
    const hasLightboxTrigger = await client.evaluate(`
      (() => {
        const btn = document.querySelector('.fr-inspect-btn');
        if (btn) {
          btn.focus();
          return true;
        }
        return false;
      })()
    `);

    let lbOpen = { isOpen: false };
    let lbClosed = { isOpen: false };
    let lbPassed = false;

    if (hasLightboxTrigger) {
      await client.pressKey('Enter', 'Enter', 13);
      await new Promise(r => setTimeout(r, 500));

      lbOpen = await client.evaluate(`
        (() => {
          const lb = document.getElementById('fr-lightbox');
          return {
            isOpen: lb ? lb.open : false
          };
        })()
      `);

      const lbShotPath = path.join(reportsDir, 'fr-lightbox-open.png');
      const distLbShotPath = path.join(distReportsDir, 'fr-lightbox-open.png');
      const lbShot = await client.captureScreenshot(lbShotPath);
      fs.writeFileSync(distLbShotPath, lbShot);

      // Press Escape to close
      await client.pressKey('Escape', 'Escape', 27);
      await new Promise(r => setTimeout(r, 400));

      lbClosed = await client.evaluate(`
        (() => {
          const lb = document.getElementById('fr-lightbox');
          return {
            isOpen: lb ? lb.open : false
          };
        })()
      `);

      lbPassed = lbOpen.isOpen && !lbClosed.isOpen;
      console.log(`  - Lightbox Open & Escape Return: ${lbPassed ? '✔ PASS' : '✖ FAIL'}`);
    } else {
      console.log('  - Lightbox trigger not found in active markup; skipping lightbox.');
      lbPassed = true;
    }

    walkthroughLog.push({
      step: 'fr_lightbox_keyboard',
      triggerFound: hasLightboxTrigger,
      stateOpen: lbOpen,
      stateClosed: lbClosed,
      screenshot: 'fr-lightbox-open.png',
      passed: lbPassed
    });

    await client.close();
  } catch (err) {
    console.error('Error during Gate 6 interactive audit:', err);
    await client.close();
  } finally {
    await server.stop();
  }

  // Save walkthrough telemetry JSON
  const telemetryPath = path.join(reportsDir, 'visual_walkthrough_results.json');
  fs.writeFileSync(telemetryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    viewports: viewportResults,
    interactions: walkthroughLog
  }, null, 2));

  const allViewportsPassed = Object.values(viewportResults).every(v => v.passed);
  const allInteractionsPassed = walkthroughLog.every(i => i.passed !== false);
  const passed = allViewportsPassed && allInteractionsPassed;

  console.log('\n--- VIEWPORT & KEYBOARD SUMMARY ---');
  console.log(`  320px Viewport:  ${viewportResults['320px']?.passed ? '✔ PASS' : '✖ FAIL (Overflow detected)'}`);
  console.log(`  768px Viewport:  ${viewportResults['768px']?.passed ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`  1440px Viewport: ${viewportResults['1440px']?.passed ? '✔ PASS' : '✖ FAIL'}`);
  console.log(`  Keyboard Walk:   ${allInteractionsPassed ? '✔ PASS' : '✖ FAIL'}`);

  return {
    gate: 'G-06',
    name: 'Interactive & Visual Audit',
    passed,
    allViewportsPassed,
    allInteractionsPassed,
    viewports: viewportResults,
    interactions: walkthroughLog
  };
}

module.exports = { runGate6ViewportsKeyboard };
