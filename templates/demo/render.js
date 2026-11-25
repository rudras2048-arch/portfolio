/**
 * ============================================================================
 * TATHYA EXPLORER SERVER-SIDE RENDERER
 * Author: Agent 4 (Demo) / Upgraded v2.1
 * Contract: tokens.md & interfaces.md
 * Source: /data/tathya.json
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTathyaExplorerCSS() {
  const cssPath = path.join(__dirname, 'tathya-explorer.css');
  return fs.readFileSync(cssPath, 'utf8');
}

function getTathyaExplorerJS() {
  const jsPath = path.join(__dirname, 'tathya-explorer.js');
  return fs.readFileSync(jsPath, 'utf8');
}

function formatUtf8BytesNode(str, maxBytes = 12) {
  const buf = Buffer.from(String(str || ''), 'utf8');
  const slice = buf.subarray(0, maxBytes);
  const hex = Array.from(slice).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  return buf.length > slice.length
    ? `${hex} … (${buf.length} UTF-8 bytes)`
    : `${hex} (${buf.length} UTF-8 bytes)`;
}

/**
 * Renders the HTML markup for the Tathya LLM Failure Explorer
 * @param {Object} [tathyaData] Parsed content of data/tathya.json
 * @returns {string} HTML string
 */
function renderTathyaExplorer(tathyaData) {
  if (!tathyaData) {
    const dataPath = path.resolve(__dirname, '..', '..', 'data', 'tathya.json');
    tathyaData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  const datasetName = tathyaData.dataset || 'tathya-eval-preview';
  const version = tathyaData.version || '0.1.0';
  const status = (tathyaData.status || 'research_preview').replace(/_/g, ' ').toUpperCase();

  // Initial dialect sample (Haryanvi)
  const samples = tathyaData.samples || [];
  const haryanvi = samples.find(s => s.dialect === 'haryanvi') || samples[0] || {};
  const initialCategoryDisplay = (haryanvi.category || 'civic_schemes').replace(/_/g, ' ').toUpperCase();

  const promptText = haryanvi.prompt || 'म्हारी सरकार की लाडो योजना के के फायदे सैं?';
  const standardText = haryanvi.standard_hindi || 'हमारी सरकार की लाडो योजना के क्या लाभ हैं?';
  const dialectByteLen = Buffer.byteLength(promptText, 'utf8');
  const standardByteLen = Buffer.byteLength(standardText, 'utf8');

  const initialDialectTokens = [
    { t: 'म्', frag: true },
    { t: 'हा', frag: true },
    { t: 'री', frag: true },
    { t: 'सरकार', frag: false },
    { t: 'की', frag: false },
    { t: 'ला', frag: true },
    { t: 'डो', frag: true },
    { t: 'योजना', frag: false },
    { t: 'के', frag: false },
    { t: 'के', frag: false },
    { t: 'फाय', frag: true },
    { t: 'दे', frag: true },
    { t: 'सै', frag: true },
    { t: 'ं', frag: true },
    { t: '?', frag: false }
  ];

  const initialStandardTokens = [
    { t: 'हमारी' },
    { t: 'सरकार' },
    { t: 'की' },
    { t: 'लाडो' },
    { t: 'योजना' },
    { t: 'के' },
    { t: 'क्या' },
    { t: 'लाभ' },
    { t: 'हैं' },
    { t: '?' }
  ];

  const dialectChipsHtml = initialDialectTokens
    .map(tok => `<span class="${tok.frag ? 'tfe-chip tfe-chip--frag' : 'tfe-chip tfe-chip--whole'}">[${escapeHtml(tok.t)}]</span>`)
    .join('');

  const standardChipsHtml = initialStandardTokens
    .map(tok => `<span class="tfe-chip tfe-chip--clean">[${escapeHtml(tok.t)}]</span>`)
    .join('');

  return `            <!-- TATHYA LLM FAILURE EXPLORER (templates/demo/) -->
            <div class="tfe-explorer" id="tfe-explorer" role="region" aria-label="Tathya LLM Failure Explorer">
              <!-- Explorer Top Bar -->
              <div class="tfe-top-bar">
                <div class="tfe-top-bar__left">
                  <span class="tfe-indicator" aria-hidden="true"><span class="pulse-dot"></span></span>
                  <span class="tfe-kicker">LLM Failure Explorer // Dialect Benchmarks</span>
                </div>
                <div class="tfe-top-bar__right">
                  <span class="tfe-badge" id="tfe-dataset-badge">DATASET: ${escapeHtml(datasetName)} v${escapeHtml(version)}</span>
                </div>
              </div>

              <!-- Dynamic Dialect Switcher (Tabs) -->
              <div class="tfe-dialects" role="tablist" aria-label="Select Indic dialect test vector">
                <button type="button" class="tfe-tab" role="tab" id="tfe-tab-haryanvi" aria-selected="true" aria-controls="tfe-panel" tabindex="0" data-dialect="haryanvi">
                  <span class="tfe-tab__num">01</span>
                  <span class="tfe-tab__name">Haryanvi</span>
                  <span class="tfe-tab__script">हरियाणवी</span>
                </button>
                <button type="button" class="tfe-tab" role="tab" id="tfe-tab-punjabi" aria-selected="false" aria-controls="tfe-panel" tabindex="-1" data-dialect="punjabi">
                  <span class="tfe-tab__num">02</span>
                  <span class="tfe-tab__name">Punjabi</span>
                  <span class="tfe-tab__script">ਪੰਜਾਬੀ</span>
                </button>
                <button type="button" class="tfe-tab" role="tab" id="tfe-tab-bhojpuri" aria-selected="false" aria-controls="tfe-panel" tabindex="-1" data-dialect="bhojpuri">
                  <span class="tfe-tab__num">03</span>
                  <span class="tfe-tab__name">Bhojpuri</span>
                  <span class="tfe-tab__script">भोजपुरी</span>
                </button>
              </div>

              <!-- Metadata Telemetry Bar -->
              <div class="tfe-meta-bar">
                <div class="tfe-meta-item">
                  <span class="tfe-meta-lbl">CATEGORY</span>
                  <span class="tfe-meta-val tfe-category-val" id="tfe-category-val">${escapeHtml(initialCategoryDisplay)}</span>
                </div>
                <div class="tfe-meta-item">
                  <span class="tfe-meta-lbl">STATUS</span>
                  <span class="tfe-meta-val" id="tfe-status-val">${escapeHtml(status)}</span>
                </div>
                <div class="tfe-meta-item">
                  <span class="tfe-meta-lbl">ACTIVE VECTOR</span>
                  <span class="tfe-meta-val" id="tfe-dialect-val">Haryanvi (haryanvi)</span>
                </div>
              </div>

              <!-- Active Test Vector Panel -->
              <div id="tfe-panel" class="tfe-panel" role="tabpanel" aria-labelledby="tfe-tab-haryanvi">
                <!-- Comparative Prompt Cards -->
                <div class="tfe-compare-grid">
                  <div class="tfe-compare-col tfe-compare-col--dialect">
                    <div class="tfe-col-header">
                      <span class="tfe-col-badge tfe-col-badge--dialect">NON-STANDARD DIALECT INPUT</span>
                      <span class="tfe-col-hint" id="tfe-dialect-script-hint">Colloquial Devanagari Orthography</span>
                    </div>
                    <div class="tfe-prompt-box">
                      <p class="tfe-prompt-text tfe-prompt-text--dialect" id="tfe-dialect-prompt">${escapeHtml(promptText)}</p>
                    </div>
                  </div>

                  <div class="tfe-compare-col tfe-compare-col--standard">
                    <div class="tfe-col-header">
                      <span class="tfe-col-badge tfe-col-badge--standard">STANDARD HINDI EQUIVALENT</span>
                      <span class="tfe-col-hint">Manak Hindi Target</span>
                    </div>
                    <div class="tfe-prompt-box">
                      <p class="tfe-prompt-text tfe-prompt-text--standard" id="tfe-standard-prompt">${escapeHtml(standardText)}</p>
                    </div>
                  </div>
                </div>

                <!-- Side-by-Side Token Fragmentation Visualizer -->
                <div class="tfe-token-viz" id="tfe-token-viz">
                  <div class="tfe-viz-header">
                    <span class="tfe-viz-title">TOKEN FRAGMENTATION VISUALIZER</span>
                    <div class="tfe-viz-spotlight" id="tfe-viz-spotlight">
                      <span class="tfe-spot-clean">हमारी → <code>[हमारी]</code></span>
                      <span class="tfe-spot-sep" aria-hidden="true">vs</span>
                      <span class="tfe-spot-frag">म्हारी → <code>[म्][हा][री]</code></span>
                    </div>
                  </div>

                  <div class="tfe-viz-grid">
                    <div class="tfe-viz-col tfe-viz-col--frag">
                      <div class="tfe-viz-col-head">
                        <span class="tfe-viz-col-lbl">DIALECT SUBWORD FRAGMENTS</span>
                        <span class="tfe-viz-count mono" id="tfe-frag-count">${initialDialectTokens.length} segments · ${dialectByteLen} UTF-8 bytes</span>
                      </div>
                      <div class="tfe-token-row" id="tfe-dialect-tokens">${dialectChipsHtml}</div>
                      <div class="tfe-byte-seq" id="tfe-byte-seq"><strong>Marker UTF-8 Bytes (म्हारी):</strong> <code>${escapeHtml(formatUtf8BytesNode('म्हारी', 12))}</code></div>
                    </div>

                    <div class="tfe-viz-col tfe-viz-col--std">
                      <div class="tfe-viz-col-head">
                        <span class="tfe-viz-col-lbl">STANDARD HINDI TOKENS</span>
                        <span class="tfe-viz-count mono" id="tfe-std-count">${initialStandardTokens.length} whole tokens · ${standardByteLen} UTF-8 bytes</span>
                      </div>
                      <div class="tfe-token-row" id="tfe-standard-tokens">${standardChipsHtml}</div>
                      <p class="tfe-viz-note" id="tfe-viz-note">Colloquial markers "म्हारी" and "सैं" lack whole-word Manak Hindi entries and fracture across conjunct and matra boundaries.</p>
                    </div>
                  </div>
                </div>

                <!-- Token Fragmentation Analysis Box -->
                <div class="tfe-analysis-box">
                  <div class="tfe-analysis-header">
                    <span class="tfe-analysis-icon" aria-hidden="true">⚡</span>
                    <span class="tfe-analysis-title">Token Fragmentation &amp; Failure Mechanism</span>
                  </div>
                  <div class="tfe-analysis-body" id="tfe-analysis-body">
                    <p class="tfe-analysis-p"><strong>Tokenizer Breakdown:</strong> Standard Indic LLM tokenizers trained on formal web Hindi (Manak Hindi) lack vocabulary IDs for regional colloquial markers (<code>म्हारी</code>, <code>सैं</code>). Words are shattered into byte-level subword fragments, inflating token length.</p>
                    <p class="tfe-analysis-p"><strong>Downstream Failure Mode:</strong> Attention weights dilute across inflated byte sequences, causing critical entity degradation over state welfare policy (<code>लाडो योजना</code>) and resulting in civic query hallucinations.</p>
                    <p class="tfe-analysis-p"><strong>Tathya Verification Layer:</strong> Normalizes colloquial orthography and assertion boundaries against audited municipal scheme records before response generation.</p>
                  </div>
                </div>
              </div>

              <!-- Live Region for Screen Readers -->
              <div id="tfe-live" class="tfe-sr-only" aria-live="polite" aria-atomic="true"></div>
            </div>`;
}

module.exports = {
  renderTathyaExplorer,
  getTathyaExplorerCSS,
  getTathyaExplorerJS
};
