const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runGate1Build() {
  const startTime = Date.now();
  console.log('\n============================================================');
  console.log('GATE 1: RUNNING STATIC BUILD ENGINE (npm run build)');
  console.log('============================================================');

  const rootDir = path.resolve(__dirname, '../../');
  const distHtml = path.join(rootDir, 'dist/index.html');
  const distAssets = path.join(rootDir, 'dist/assets');

  try {
    const stdout = execSync('npm run build', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const durationMs = Date.now() - startTime;
    const htmlExists = fs.existsSync(distHtml);
    const htmlSize = htmlExists ? fs.statSync(distHtml).size : 0;
    const assetsCount = fs.existsSync(distAssets) ? fs.readdirSync(distAssets).length : 0;

    const passed = htmlExists && htmlSize > 0;

    console.log(stdout);
    console.log(`\n✔ Build completed in ${durationMs}ms`);
    console.log(`  - dist/index.html size: ${(htmlSize / 1024).toFixed(1)} KB`);
    console.log(`  - dist/assets/ file count: ${assetsCount}`);

    return {
      gate: 'G-01',
      name: 'Static Build Engine',
      passed,
      durationMs,
      htmlSize,
      assetsCount,
      stdout,
      error: null
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const output = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '');
    console.error(`\n✖ Build failed with exit code ${err.status}`);
    console.error(output);

    return {
      gate: 'G-01',
      name: 'Static Build Engine',
      passed: false,
      durationMs,
      htmlSize: 0,
      assetsCount: 0,
      stdout: output,
      error: err.message
    };
  }
}

module.exports = { runGate1Build };
