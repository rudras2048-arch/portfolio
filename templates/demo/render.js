/**
 * ============================================================================
 * TATHYA EXPLORER SERVER-SIDE RENDERER (v0.2 Research Workbench)
 * Contract: tokens.md & interfaces.md
 * Source Data: /data/tathya.json & templates/demo/tathya-tokenizer.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const TathyaTokenizer = require('./tathya-tokenizer.js');

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
  return fs.readFileSync(path.join(__dirname, 'tathya-explorer.css'), 'utf8');
}

function getTathyaTokenizerJS() {
  return fs.readFileSync(path.join(__dirname, 'tathya-tokenizer.js'), 'utf8');
}

function getKramaMathJS() {
  return fs.readFileSync(path.join(__dirname, 'krama-math.js'), 'utf8');
}

function getTathyaExplorerJS() {
  return fs.readFileSync(path.join(__dirname, 'tathya-explorer.js'), 'utf8');
}

function renderTokenChipsSSR(tokens, isStandard) {
  return tokens
    .filter(tok => !tok.isWhitespace)
    .map(tok => {
      let cls = 'tfe-chip tfe-chip--whole';
      if (isStandard) {
        cls = 'tfe-chip tfe-chip--clean';
      } else if (tok.isByteFallback || tok.isFragmented) {
        cls = 'tfe-chip tfe-chip--frag';
      }
      return `<span class="${cls}" title="Token ID #${tok.id} · ${tok.byteLength} UTF-8 B"><span>${escapeHtml(tok.text)}</span><span class="tfe-chip-id">#${tok.id}</span></span>`;
    })
    .join('');
}

/**
 * Renders the HTML markup for the Tathya Research Console v0.2
 * @param {Object} [tathyaData] Parsed content of data/tathya.json
 * @returns {string} HTML string
 */
function renderTathyaExplorer(tathyaData) {
  if (!tathyaData) {
    const dataPath = path.resolve(__dirname, '..', '..', 'data', 'tathya.json');
    tathyaData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  const datasetName = tathyaData.dataset || 'tathya-eval-preview';
  const samples = tathyaData.samples || [];
  const haryanvi = samples.find(s => s.dialect === 'haryanvi') || samples[0] || {};
  const initialCategoryDisplay = (haryanvi.category || 'civic_schemes').replace(/_/g, ' ').toUpperCase();

  const promptText = haryanvi.prompt || 'म्हारी सरकार की लाडो योजना के के फायदे सैं?';
  const standardText = haryanvi.standard_hindi || 'हमारी सरकार की लाडो योजना के क्या लाभ हैं?';

  const diaEnc = TathyaTokenizer.encode(promptText);
  const stdEnc = TathyaTokenizer.encode(standardText);

  const diaIdsPreview = diaEnc.tokenIds.join(', ');
  const stdIdsPreview = stdEnc.tokenIds.join(', ');

  return `            <!-- TATHYA RESEARCH CONSOLE v0.2 (templates/demo/) -->
            <div class="tfe-explorer" id="tfe-explorer" role="region" aria-label="Tathya Dialect Research Console">
              <!-- Console Top Bar -->
              <div class="tfe-top-bar">
                <div class="tfe-top-bar__left">
                  <span class="tfe-indicator" aria-hidden="true"><span class="pulse-dot"></span></span>
                  <span class="tfe-kicker">Tathya // Research Console · Benchmark Preview v0.2</span>
                </div>
                <div class="tfe-top-bar__right">
                  <span class="tfe-badge" id="tfe-dataset-badge">ENGINE: ${escapeHtml(diaEnc.engine)} · EVAL SET: IN PROGRESS</span>
                </div>
              </div>

              <!-- Explicit Scientific Research Hypothesis -->
              <div class="tfe-hypothesis-banner">
                <span class="tfe-hyp-tag">RESEARCH HYPOTHESIS</span>
                <p class="tfe-hyp-text">
                  Regional language variation may affect LLM reliability through lexical coverage gaps, non-standard orthography, and semantic shifts. Tathya separates <strong>BPE tokens</strong>, <strong>integer token IDs</strong>, <strong>grapheme clusters</strong>, and <strong>UTF-8 byte lengths</strong> rather than assuming causality prior to controlled eval completion.
                </p>
              </div>

              <!-- Preset Vector Selector (Tabs) -->
              <div class="tfe-dialects" role="tablist" aria-label="Select Indic dialect preset vector">
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

              <!-- Stage Switcher (Live Microscope vs Eval Design vs Verification Schema) -->
              <div class="tfe-stage-bar" role="group" aria-label="Experiment stage selector">
                <div class="tfe-stage-pills">
                  <button type="button" class="tfe-stage-btn active" data-stage="tokenizer" aria-pressed="true">01 · Tokenizer Microscope (Live)</button>
                  <button type="button" class="tfe-stage-btn" data-stage="eval" aria-pressed="false">02 · Model Comparison Protocol</button>
                  <button type="button" class="tfe-stage-btn" data-stage="verification" aria-pressed="false">03 · Civic Verification Spec</button>
                </div>
                <button type="button" class="tfe-export-btn" id="tfe-export-json" title="Download real tokenizer JSON report">Export JSON ↗</button>
              </div>

              <!-- Metadata Telemetry Bar -->
              <div class="tfe-meta-bar">
                <div class="tfe-meta-item">
                  <span class="tfe-meta-lbl">DOMAIN / VECTOR</span>
                  <span class="tfe-meta-val tfe-category-val" id="tfe-category-val">${escapeHtml(initialCategoryDisplay)} · <span id="tfe-dialect-val">Haryanvi (haryanvi)</span></span>
                </div>
                <div class="tfe-meta-item">
                  <span class="tfe-meta-lbl">TOKEN RATIO (DIALECT / MANAK)</span>
                  <span class="tfe-meta-val" id="tfe-ratio-val">${diaEnc.tokenCount} vs ${stdEnc.tokenCount} tokens (${(diaEnc.tokenCount / Math.max(1, stdEnc.tokenCount)).toFixed(2)}×)</span>
                </div>
                <div class="tfe-meta-item">
                  <span class="tfe-meta-lbl">DATASET STATUS</span>
                  <span class="tfe-meta-val" id="tfe-status-val">${escapeHtml(datasetName)} · Live Client BPE</span>
                </div>
              </div>

              <!-- Active Test Vector Panel (Stage 1: Live Interactive Tokenizer Microscope) -->
              <div id="tfe-panel" class="tfe-panel" role="tabpanel" aria-labelledby="tfe-tab-haryanvi">
                <div id="tfe-stage-tokenizer" class="tfe-stage-pane">
                  <!-- Live Editable Comparative Inputs -->
                  <div class="tfe-compare-grid">
                    <div class="tfe-compare-col tfe-compare-col--dialect">
                      <div class="tfe-col-header">
                        <label for="tfe-dialect-prompt" class="tfe-col-badge tfe-col-badge--dialect">DIALECT INPUT (EDITABLE)</label>
                        <span class="tfe-col-hint" id="tfe-dialect-script-hint">Colloquial Devanagari Orthography</span>
                      </div>
                      <textarea id="tfe-dialect-prompt" class="tfe-prompt-input tfe-prompt-text--dialect" rows="2" spellcheck="false">${escapeHtml(promptText)}</textarea>
                      <div class="tfe-metrics-strip">
                        <span class="tfe-metric-pill" id="tfe-dia-tok-count">Tokens: ${diaEnc.tokenCount}</span>
                        <span class="tfe-metric-pill" id="tfe-dia-graph-count">Graphemes: ${diaEnc.graphemeCount}</span>
                        <span class="tfe-metric-pill" id="tfe-dia-byte-count">UTF-8 Bytes: ${diaEnc.utf8Bytes}</span>
                      </div>
                    </div>

                    <div class="tfe-compare-col tfe-compare-col--standard">
                      <div class="tfe-col-header">
                        <label for="tfe-standard-prompt" class="tfe-col-badge tfe-col-badge--standard">MANAK HINDI EQUIVALENT (EDITABLE)</label>
                        <button type="button" class="tfe-reset-btn" id="tfe-reset-preset">Reset Preset</button>
                      </div>
                      <textarea id="tfe-standard-prompt" class="tfe-prompt-input tfe-prompt-text--standard" rows="2" spellcheck="false">${escapeHtml(standardText)}</textarea>
                      <div class="tfe-metrics-strip">
                        <span class="tfe-metric-pill" id="tfe-std-tok-count">Tokens: ${stdEnc.tokenCount}</span>
                        <span class="tfe-metric-pill" id="tfe-std-graph-count">Graphemes: ${stdEnc.graphemeCount}</span>
                        <span class="tfe-metric-pill" id="tfe-std-byte-count">UTF-8 Bytes: ${stdEnc.utf8Bytes}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Side-by-Side Live BPE Token & ID Visualizer -->
                  <div class="tfe-token-viz" id="tfe-token-viz">
                    <div class="tfe-viz-header">
                      <span class="tfe-viz-title">LIVE CLIENT-SIDE BPE TOKEN BOUNDARIES &amp; INTEGER IDS</span>
                      <span class="tfe-viz-subtitle mono" id="tfe-viz-subtitle">Vocab: ${diaEnc.vocabSize} · Hindi-biased BPE merge table (raw UTF-8 fallback IDs &lt; 256)</span>
                    </div>

                    <div class="tfe-viz-grid">
                      <div class="tfe-viz-col tfe-viz-col--frag">
                        <div class="tfe-viz-col-head">
                          <span class="tfe-viz-col-lbl">DIALECT TOKEN OUTPUT</span>
                          <span class="tfe-viz-count mono" id="tfe-frag-count">${diaEnc.tokenCount} tokens · ${diaEnc.byteFallbackCount} byte fallbacks · ${diaEnc.utf8Bytes} B</span>
                        </div>
                        <div class="tfe-token-row" id="tfe-dialect-tokens">${renderTokenChipsSSR(diaEnc.tokens, false)}</div>
                        <div class="tfe-byte-seq" id="tfe-dialect-ids"><strong>Token IDs:</strong> <code>[${escapeHtml(diaIdsPreview)}]</code></div>
                        <div class="tfe-byte-seq" id="tfe-byte-seq"><strong>Leading UTF-8 Hex:</strong> <code>${escapeHtml(diaEnc.hexBytePreview)}</code></div>
                      </div>

                      <div class="tfe-viz-col tfe-viz-col--std">
                        <div class="tfe-viz-col-head">
                          <span class="tfe-viz-col-lbl">MANAK HINDI TOKEN OUTPUT</span>
                          <span class="tfe-viz-count mono" id="tfe-std-count">${stdEnc.tokenCount} tokens · ${stdEnc.byteFallbackCount} byte fallbacks · ${stdEnc.utf8Bytes} B</span>
                        </div>
                        <div class="tfe-token-row" id="tfe-standard-tokens">${renderTokenChipsSSR(stdEnc.tokens, true)}</div>
                        <div class="tfe-byte-seq" id="tfe-standard-ids"><strong>Token IDs:</strong> <code>[${escapeHtml(stdIdsPreview)}]</code></div>
                        <p class="tfe-viz-note" id="tfe-viz-note">Measured locally using real algorithmic BPE merges + TextEncoder UTF-8 bytes + Intl.Segmenter graphemes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Stage 2: Controlled Evaluation Protocol -->
                <div id="tfe-stage-eval" class="tfe-stage-pane tfe-stage-pane--protocol" hidden>
                  <div class="tfe-protocol-box">
                    <div class="tfe-analysis-header">
                      <span class="tfe-col-badge tfe-col-badge--standard">STAGE 02 · EVALUATION DESIGN (IN PROGRESS)</span>
                    </div>
                    <p class="tfe-analysis-p"><strong>Controlled Experimental Setup:</strong> Identical civic welfare prompts paired in colloquial regional form vs. normalized Manak Hindi are evaluated under uniform system instructions and temperature controls.</p>
                    <p class="tfe-analysis-p"><strong>Tracked Dependent Variables:</strong> (1) Factual accuracy against audited scheme PDFs, (2) Core entity preservation (scheme name &amp; eligibility criteria), and (3) Answer completeness. Tokenization splits from Stage 01 are logged strictly as an observed input feature—not pre-asserted as sole causation.</p>
                    <p class="tfe-analysis-p"><strong>Current Honesty Boundary:</strong> Live multi-LLM API execution is excluded from this static client bundle; published dataset scores will be released once the sample corpus reaches validation threshold.</p>
                  </div>
                </div>

                <!-- Stage 3: Verification Architecture Specification -->
                <div id="tfe-stage-verification" class="tfe-stage-pane tfe-stage-pane--protocol" hidden>
                  <div class="tfe-protocol-box">
                    <div class="tfe-analysis-header">
                      <span class="tfe-col-badge tfe-col-badge--dialect">STAGE 03 · CIVIC VERIFICATION ARCHITECTURE</span>
                    </div>
                    <p class="tfe-analysis-p"><strong>1. Source Retrieval:</strong> Map query intent to official public-benefit circulars or departmental scheme documents rather than parametric memory alone.</p>
                    <p class="tfe-analysis-p"><strong>2. Atomic Claim Extraction:</strong> Decompose candidate model responses into checkable assertions (eligibility income caps, required documents, application office).</p>
                    <p class="tfe-analysis-p"><strong>3. Support vs. Unsupported Flagging:</strong> Surface unsupported claims visibly before serving answers in regional healthcare or ration card workflows.</p>
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
  getTathyaTokenizerJS,
  getKramaMathJS,
  getTathyaExplorerJS
};
