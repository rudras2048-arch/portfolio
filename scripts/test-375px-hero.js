const fs = require('fs');
const path = require('path');
const { CDPClient } = require('./gates/cdp-client.js');
const { LocalStaticServer } = require('./gates/server.js');

async function testMobileHero() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const reportsDir = path.join(rootDir, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const server = new LocalStaticServer(distDir, 8098);
  const serverUrl = await server.start();
  console.log(`Server started at ${serverUrl}`);

  const client = new CDPClient(9450);
  try {
    await client.launch();
    await client.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });

    await client.navigate(`${serverUrl}/index.html`);
    await new Promise(r => setTimeout(r, 1500));

    // Capture 375px screenshot
    const screenshotBuf = await client.captureScreenshot();
    const screenshotPath = path.join(reportsDir, 'viewport-375px.png');
    fs.writeFileSync(screenshotPath, screenshotBuf);
    console.log(`Saved 375px screenshot to: ${screenshotPath}`);

    // Evaluate elements
    const heroAudit = await client.evaluate(`
      (() => {
        const headline = document.querySelector('.hero-headline');
        const headlineRect = headline ? headline.getBoundingClientRect() : null;
        const stagger = headline ? headline.querySelector('.stagger') : null;
        const staggerRect = stagger ? stagger.getBoundingClientRect() : null;

        const statement = document.querySelector('.hero-statement');
        const statementRect = statement ? statement.getBoundingClientRect() : null;
        const statementStyle = statement ? window.getComputedStyle(statement) : null;

        const statCards = Array.from(document.querySelectorAll('.hero-stats-row .stat-card')).map(card => {
          const num = card.querySelector('.stat-num');
          const lbl = card.querySelector('.stat-label');
          const desc = card.querySelector('.stat-desc');
          const cardRect = card.getBoundingClientRect();
          const numStyle = num ? window.getComputedStyle(num) : null;
          const lblStyle = lbl ? window.getComputedStyle(lbl) : null;
          const descStyle = desc ? window.getComputedStyle(desc) : null;

          return {
            val: num ? num.innerText.trim() : null,
            valFontSize: numStyle ? numStyle.fontSize : null,
            lbl: lbl ? lbl.innerText.trim() : null,
            lblFontSize: lblStyle ? lblStyle.fontSize : null,
            desc: desc ? desc.innerText.trim() : null,
            descFontSize: descStyle ? descStyle.fontSize : null,
            rect: {
              top: Math.round(cardRect.top),
              left: Math.round(cardRect.left),
              width: Math.round(cardRect.width),
              right: Math.round(cardRect.right)
            },
            clippedRight: cardRect.right > window.innerWidth
          };
        });

        const ctas = Array.from(document.querySelectorAll('.hero-actions a')).map(a => ({
          text: a.innerText.trim(),
          className: a.className,
          bg: window.getComputedStyle(a).backgroundColor,
          color: window.getComputedStyle(a).color,
          fontSize: window.getComputedStyle(a).fontSize
        }));

        const footer = document.querySelector('footer.site-footer');
        const footerLinks = footer ? Array.from(footer.querySelectorAll('a')).map(a => ({
          href: a.getAttribute('href'),
          text: a.innerText.trim(),
          height: Math.round(a.getBoundingClientRect().height)
        })) : [];

        // Check if ANY element in page has font-size < 12px
        let sub12Count = 0;
        const sub12Samples = [];
        document.querySelectorAll('*').forEach(el => {
          if (['SCRIPT', 'STYLE', 'HEAD', 'TEMPLATE'].includes(el.tagName)) return;
          const text = (el.textContent || '').trim();
          if (!text) return;
          const fsPx = parseFloat(window.getComputedStyle(el).fontSize);
          if (fsPx < 11.9) {
            sub12Count++;
            if (sub12Samples.length < 5) {
              sub12Samples.push({ tag: el.tagName, class: el.className, text: text.slice(0, 30), fs: fsPx });
            }
          }
        });

        return {
          innerWidth: window.innerWidth,
          headline: {
            text: headline ? headline.innerText.trim().replace(/\\s+/g, ' ') : null,
            right: headlineRect ? Math.round(headlineRect.right) : null,
            clipped: headlineRect ? (headlineRect.right > window.innerWidth) : false,
            staggerRight: staggerRect ? Math.round(staggerRect.right) : null,
            staggerClipped: staggerRect ? (staggerRect.right > window.innerWidth) : false
          },
          statement: {
            text: statement ? statement.innerText.trim() : null,
            fontSize: statementStyle ? statementStyle.fontSize : null,
            color: statementStyle ? statementStyle.color : null
          },
          statCards,
          ctas,
          footerLinks,
          sub12Count,
          sub12Samples
        };
      })()
    `);

    console.log('\n--- 375PX MOBILE HERO AUDIT RESULTS ---');
    console.log('Viewport Width:', heroAudit.innerWidth);
    console.log('Headline Text:', heroAudit.headline.text);
    console.log('Headline Clipped at right edge:', heroAudit.headline.clipped, 'Stagger clipped:', heroAudit.headline.staggerClipped);
    console.log('Hero Statement:', heroAudit.statement.text);
    console.log('Hero Statement Font Size:', heroAudit.statement.fontSize);
    console.log('\nStat Cards (Readback):');
    heroAudit.statCards.forEach((c, i) => {
      console.log(`  Card ${i+1}: "${c.val}" (${c.valFontSize}) | "${c.lbl}" (${c.lblFontSize}) | "${c.desc}" (${c.descFontSize}) | Clipped: ${c.clippedRight}`);
    });
    console.log('\nHero CTAs:', heroAudit.ctas);
    console.log('\nFooter Conversion Links:', heroAudit.footerLinks);
    console.log('\nSub-12px elements in DOM count:', heroAudit.sub12Count);
    if (heroAudit.sub12Count > 0) {
      console.log('Sub-12 samples:', heroAudit.sub12Samples);
    }

    await client.close();
    await server.stop();

    const passed = !heroAudit.headline.clipped &&
                   !heroAudit.headline.staggerClipped &&
                   heroAudit.statCards.length === 4 &&
                   heroAudit.statCards.every(c => !c.clippedRight && parseFloat(c.valFontSize) >= 28 && parseFloat(c.lblFontSize) >= 13) &&
                   heroAudit.footerLinks.length >= 3 &&
                   heroAudit.sub12Count === 0;

    console.log('\nMobile 375px Acceptance Test Passed:', passed);
    process.exit(passed ? 0 : 1);
  } catch (err) {
    console.error('Error during 375px audit:', err);
    await client.close();
    await server.stop();
    process.exit(1);
  }
}

testMobileHero();
