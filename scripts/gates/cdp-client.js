const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

class CDPClient {
  constructor(port = 9333) {
    this.port = port;
    this.chromeProc = null;
    this.tmpDir = null;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
    this.eventListeners = new Map();
  }

  async launch(extraArgs = []) {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-gates-'));
    const chromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      'google-chrome',
      'chromium'
    ];

    let chromeBinary = chromePaths.find(p => fs.existsSync(p));
    if (!chromeBinary) {
      chromeBinary = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }

    const args = [
      '--headless=new',
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.tmpDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--allow-file-access-from-files',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--safebrowsing-disable-auto-update',
      '--no-sandbox',
      ...extraArgs
    ];

    this.chromeProc = spawn(chromeBinary, args, {
      stdio: 'pipe'
    });

    this.chromeProc.on('error', (err) => {
      console.error('Failed to spawn Chrome:', err);
    });

    // Wait for Chrome remote debugging port to be ready
    let connected = false;
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 150));
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
        if (res.ok) {
          connected = true;
          break;
        }
      } catch (e) {}
    }

    if (!connected) {
      throw new Error(`Failed to connect to Chrome on port ${this.port}`);
    }

    // Get page target websocket url
    let wsUrl = null;
    try {
      const listRes = await fetch(`http://127.0.0.1:${this.port}/json/list`);
      const list = await listRes.json();
      const page = list.find(t => t.type === 'page');
      if (page) {
        wsUrl = page.webSocketDebuggerUrl;
      }
    } catch (e) {}

    if (!wsUrl) {
      const newRes = await fetch(`http://127.0.0.1:${this.port}/json/new`, { method: 'PUT' });
      const target = await newRes.json();
      wsUrl = target.webSocketDebuggerUrl;
    }

    await this.connectWs(wsUrl);
    return this;
  }

  async connectWs(wsUrl) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) {
              reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              resolve(msg.result);
            }
          } else if (msg.method) {
            const listeners = this.eventListeners.get(msg.method) || [];
            for (const l of listeners) {
              try { l(msg.params); } catch (e) { console.error('Listener error', e); }
            }
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
    });
  }

  on(method, handler) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(handler);
  }

  async send(method, params = {}) {
    const id = this.msgId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async navigate(url, timeoutMs = 10000) {
    await this.send('Page.enable');
    await this.send('Runtime.enable');
    await this.send('DOM.enable');

    return new Promise(async (resolve, reject) => {
      let fired = false;
      const timer = setTimeout(() => {
        if (!fired) {
          fired = true;
          resolve(); // resolve on timeout to not hang
        }
      }, timeoutMs);

      this.on('Page.loadEventFired', () => {
        if (!fired) {
          fired = true;
          clearTimeout(timer);
          resolve();
        }
      });

      try {
        await this.send('Page.navigate', { url });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  async setViewport({ width, height, deviceScaleFactor = 1, mobile = false, hasTouch = false }) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile,
      hasTouch
    });
  }

  async captureScreenshot(outputPath) {
    const result = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(result.data, 'base64');
    if (outputPath) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, buffer);
    }
    return buffer;
  }

  async pressTab(shift = false) {
    const modifiers = shift ? 8 : 0;
    await this.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
      modifiers
    });
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
      nativeVirtualKeyCode: 9,
      modifiers
    });
    await new Promise(r => setTimeout(r, 60));
  }

  async pressKey(key, code, windowsVirtualKeyCode) {
    await this.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key,
      code,
      windowsVirtualKeyCode,
      nativeVirtualKeyCode: windowsVirtualKeyCode,
      text: key.length === 1 ? key : (key === 'Enter' ? '\r' : undefined)
    });
    if (key.length === 1 || key === 'Enter') {
      await this.send('Input.dispatchKeyEvent', {
        type: 'char',
        key,
        code,
        windowsVirtualKeyCode,
        nativeVirtualKeyCode: windowsVirtualKeyCode,
        text: key === 'Enter' ? '\r' : key
      });
    }
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode,
      nativeVirtualKeyCode: windowsVirtualKeyCode
    });
    await new Promise(r => setTimeout(r, 80));
  }

  async close() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
    if (this.chromeProc) {
      try { this.chromeProc.kill('SIGKILL'); } catch (e) {}
    }
    if (this.tmpDir && fs.existsSync(this.tmpDir)) {
      try { fs.rmSync(this.tmpDir, { recursive: true, force: true }); } catch (e) {}
    }
  }
}

module.exports = { CDPClient };
