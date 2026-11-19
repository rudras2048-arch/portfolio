const { CDPClient } = require('./gates/cdp-client.js');
const { LocalStaticServer } = require('./gates/server.js');
const path = require('path');

async function testNoScript() {
  const distDir = path.resolve(__dirname, '../dist');
  const server = new LocalStaticServer(distDir, 8098);
  const serverUrl = await server.start();
  console.log('Server started on', serverUrl);

  const client = new CDPClient(9450);
  await client.launch();

  // Disable JavaScript
  await client.send('Emulation.setScriptExecutionDisabled', { value: true });

  await client.navigate(`${serverUrl}/index.html`);
  await new Promise(r => setTimeout(r, 1000));

  const result = await client.evaluate(`
    (() => {
      const elements = Array.from(document.querySelectorAll('.ab-reveal, .reveal, #about, #hero, #competitions, #ventures, #contact'));
      return elements.map(el => {
        const style = window.getComputedStyle(el);
        return {
          id: el.id,
          className: el.className,
          opacity: style.opacity,
          visibility: style.visibility,
          display: style.display
        };
      });
    })()
  `);

  console.log('NoScript inspection results:', result);

  await client.close();
  await server.stop();
}

testNoScript().catch(console.error);
