/**
 * ============================================================================
 * TATHYA RESEARCH CONSOLE LIVE COMPONENT (v0.2)
 * Real algorithmic BPE encoding via window.TathyaTokenizer + live editing +
 * separate Token Count / Token IDs / Grapheme Clusters / UTF-8 Bytes + JSON export.
 * ============================================================================
 */
(function () {
  'use strict';

  function escapeText(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var TATHYA_PRESETS = {
    haryanvi: {
      dialect: 'haryanvi',
      name: 'Haryanvi',
      scriptLabel: 'हरियाणवी',
      scriptHint: 'Colloquial Devanagari Orthography',
      categoryDisplay: 'CIVIC SCHEMES',
      prompt: 'म्हारी सरकार की लाडो योजना के के फायदे सैं?',
      standard_hindi: 'हमारी सरकार की लाडो योजना के क्या लाभ हैं?'
    },
    punjabi: {
      dialect: 'punjabi',
      name: 'Punjabi',
      scriptLabel: 'ਪੰਜਾਬੀ',
      scriptHint: 'Gurmukhi Cross-Script Input',
      categoryDisplay: 'HEALTHCARE',
      prompt: 'ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਵਿਚ ਪਰਚੀ ਕਟਵਾਉਣ ਦਾ ਕੀ ਤਰੀਕਾ ਹੈ?',
      standard_hindi: 'सरकारी अस्पताल में पर्ची कटवाने का क्या तरीका है?'
    },
    bhojpuri: {
      dialect: 'bhojpuri',
      name: 'Bhojpuri',
      scriptLabel: 'भोजपुरी',
      scriptHint: 'Purvanchal Dialect Syntax',
      categoryDisplay: 'GOVERNANCE',
      prompt: 'ई राशन कार्ड बनावे खातिर कवन कवन कागजात चाहीं?',
      standard_hindi: 'यह राशन कार्ड बनवाने के लिए कौन-कौन से दस्तावेज चाहिए?'
    }
  };

  window.initTathyaExplorer = function () {
    var container = document.querySelector('.tfe-explorer');
    if (!container) return null;
    if (container.dataset.tfeInitialized === 'true') {
      return window.__TATHYA_EXPLORER_INSTANCE || null;
    }

    var Tokenizer = window.TathyaTokenizer;
    if (!Tokenizer || typeof Tokenizer.encode !== 'function') {
      console.warn('[TathyaExplorer] window.TathyaTokenizer missing.');
      return null;
    }

    var tabs = Array.prototype.slice.call(container.querySelectorAll('.tfe-tab'));
    var stageBtns = Array.prototype.slice.call(container.querySelectorAll('.tfe-stage-btn'));
    var stagePanes = {
      tokenizer: container.querySelector('#tfe-stage-tokenizer'),
      eval: container.querySelector('#tfe-stage-eval'),
      verification: container.querySelector('#tfe-stage-verification')
    };

    var categoryValEl = container.querySelector('#tfe-category-val');
    var ratioValEl = container.querySelector('#tfe-ratio-val');
    var scriptHintEl = container.querySelector('#tfe-dialect-script-hint');

    var diaInput = container.querySelector('#tfe-dialect-prompt');
    var stdInput = container.querySelector('#tfe-standard-prompt');
    var resetBtn = container.querySelector('#tfe-reset-preset');
    var exportBtn = container.querySelector('#tfe-export-json');

    var diaTokMetricEl = container.querySelector('#tfe-dia-tok-count');
    var diaGraphMetricEl = container.querySelector('#tfe-dia-graph-count');
    var diaByteMetricEl = container.querySelector('#tfe-dia-byte-count');

    var stdTokMetricEl = container.querySelector('#tfe-std-tok-count');
    var stdGraphMetricEl = container.querySelector('#tfe-std-graph-count');
    var stdByteMetricEl = container.querySelector('#tfe-std-byte-count');

    var fragCountEl = container.querySelector('#tfe-frag-count');
    var stdCountEl = container.querySelector('#tfe-std-count');
    var diaTokensEl = container.querySelector('#tfe-dialect-tokens');
    var stdTokensEl = container.querySelector('#tfe-standard-tokens');
    var diaIdsEl = container.querySelector('#tfe-dialect-ids');
    var stdIdsEl = container.querySelector('#tfe-standard-ids');
    var byteSeqEl = container.querySelector('#tfe-byte-seq');
    var liveEl = container.querySelector('#tfe-live');

    var currentDialect = 'haryanvi';
    var latestMeasurement = null;

    function buildChips(tokens, isStandard) {
      return tokens
        .filter(function (tok) { return !tok.isWhitespace; })
        .map(function (tok) {
          var cls = isStandard
            ? 'tfe-chip tfe-chip--clean'
            : ((tok.isByteFallback || tok.isFragmented) ? 'tfe-chip tfe-chip--frag' : 'tfe-chip tfe-chip--whole');
          return '<span class="' + cls + '" title="Token ID #' + tok.id + ' · ' + tok.byteLength + ' UTF-8 B">' +
            '<span>' + escapeText(tok.text) + '</span>' +
            '<span class="tfe-chip-id">#' + tok.id + '</span>' +
          '</span>';
        })
        .join('');
    }

    function runLiveTokenization() {
      var diaText = diaInput ? diaInput.value : TATHYA_PRESETS[currentDialect].prompt;
      var stdText = stdInput ? stdInput.value : TATHYA_PRESETS[currentDialect].standard_hindi;

      var diaEnc = Tokenizer.encode(diaText);
      var stdEnc = Tokenizer.encode(stdText);

      if (diaTokMetricEl) diaTokMetricEl.textContent = 'Tokens: ' + diaEnc.tokenCount;
      if (diaGraphMetricEl) diaGraphMetricEl.textContent = 'Graphemes: ' + diaEnc.graphemeCount;
      if (diaByteMetricEl) diaByteMetricEl.textContent = 'UTF-8 Bytes: ' + diaEnc.utf8Bytes;

      if (stdTokMetricEl) stdTokMetricEl.textContent = 'Tokens: ' + stdEnc.tokenCount;
      if (stdGraphMetricEl) stdGraphMetricEl.textContent = 'Graphemes: ' + stdEnc.graphemeCount;
      if (stdByteMetricEl) stdByteMetricEl.textContent = 'UTF-8 Bytes: ' + stdEnc.utf8Bytes;

      if (ratioValEl) {
        var ratio = (diaEnc.tokenCount / Math.max(1, stdEnc.tokenCount)).toFixed(2);
        ratioValEl.textContent = diaEnc.tokenCount + ' vs ' + stdEnc.tokenCount + ' tokens (' + ratio + '×)';
      }

      if (fragCountEl) {
        fragCountEl.textContent = diaEnc.tokenCount + ' tokens · ' + diaEnc.byteFallbackCount + ' byte fallbacks · ' + diaEnc.utf8Bytes + ' B';
      }
      if (stdCountEl) {
        stdCountEl.textContent = stdEnc.tokenCount + ' tokens · ' + stdEnc.byteFallbackCount + ' byte fallbacks · ' + stdEnc.utf8Bytes + ' B';
      }

      if (diaTokensEl) diaTokensEl.innerHTML = buildChips(diaEnc.tokens, false);
      if (stdTokensEl) stdTokensEl.innerHTML = buildChips(stdEnc.tokens, true);

      if (diaIdsEl) {
        diaIdsEl.innerHTML = '<strong>Token IDs:</strong> <code>[' + escapeText(diaEnc.tokenIds.join(', ')) + ']</code>';
      }
      if (stdIdsEl) {
        stdIdsEl.innerHTML = '<strong>Token IDs:</strong> <code>[' + escapeText(stdEnc.tokenIds.join(', ')) + ']</code>';
      }
      if (byteSeqEl) {
        byteSeqEl.innerHTML = '<strong>Leading UTF-8 Hex:</strong> <code>' + escapeText(diaEnc.hexBytePreview || '—') + '</code>';
      }

      latestMeasurement = {
        timestamp: new Date().toISOString(),
        preset: currentDialect,
        engine: diaEnc.engine,
        vocabSize: diaEnc.vocabSize,
        dialect: {
          input: diaEnc.text,
          tokenCount: diaEnc.tokenCount,
          graphemeCount: diaEnc.graphemeCount,
          utf8Bytes: diaEnc.utf8Bytes,
          byteFallbackCount: diaEnc.byteFallbackCount,
          tokenIds: diaEnc.tokenIds,
          tokens: diaEnc.tokens.map(function (t) { return { id: t.id, text: t.rawText, bytes: t.byteLength }; })
        },
        standardHindi: {
          input: stdEnc.text,
          tokenCount: stdEnc.tokenCount,
          graphemeCount: stdEnc.graphemeCount,
          utf8Bytes: stdEnc.utf8Bytes,
          byteFallbackCount: stdEnc.byteFallbackCount,
          tokenIds: stdEnc.tokenIds,
          tokens: stdEnc.tokens.map(function (t) { return { id: t.id, text: t.rawText, bytes: t.byteLength }; })
        }
      };
    }

    function switchDialect(dialectId, updateFocus) {
      var preset = TATHYA_PRESETS[dialectId];
      if (!preset) return;
      currentDialect = dialectId;

      tabs.forEach(function (tab) {
        var isSelected = tab.getAttribute('data-dialect') === dialectId;
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');
        if (isSelected && updateFocus) tab.focus();
      });

      if (categoryValEl) {
        categoryValEl.innerHTML = escapeText(preset.categoryDisplay) + ' · <span id="tfe-dialect-val">' + escapeText(preset.name + ' (' + preset.dialect + ')') + '</span>';
      }
      if (scriptHintEl) scriptHintEl.textContent = preset.scriptHint;
      if (diaInput) diaInput.value = preset.prompt;
      if (stdInput) stdInput.value = preset.standard_hindi;

      runLiveTokenization();

      if (liveEl) {
        liveEl.textContent = 'Loaded ' + preset.name + ' preset and updated client-side BPE token measurements.';
      }
    }

    function switchStage(stageKey) {
      stageBtns.forEach(function (btn) {
        var active = btn.getAttribute('data-stage') === stageKey;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      Object.keys(stagePanes).forEach(function (k) {
        var pane = stagePanes[k];
        if (pane) pane.hidden = k !== stageKey;
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        switchDialect(tab.getAttribute('data-dialect'), false);
      });
      tab.addEventListener('keydown', function (e) {
        var newIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          newIndex = (index + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          newIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          e.preventDefault();
          newIndex = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          newIndex = tabs.length - 1;
        }
        if (newIndex >= 0) {
          switchDialect(tabs[newIndex].getAttribute('data-dialect'), true);
        }
      });
    });

    stageBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchStage(btn.getAttribute('data-stage'));
      });
    });

    if (diaInput) diaInput.addEventListener('input', runLiveTokenization);
    if (stdInput) stdInput.addEventListener('input', runLiveTokenization);
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        switchDialect(currentDialect, false);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (!latestMeasurement) runLiveTokenization();
        try {
          var blob = new Blob([JSON.stringify(latestMeasurement, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'tathya-tokenizer-' + currentDialect + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          if (typeof window.__showPortfolioToast === 'function') {
            window.__showPortfolioToast('Exported Tathya tokenizer JSON report (' + currentDialect + ')');
          }
        } catch (err) {
          if (typeof window.__showPortfolioToast === 'function') {
            window.__showPortfolioToast('JSON ready in window.__TATHYA_EXPLORER_INSTANCE.getLatest()');
          }
        }
      });
    }

    runLiveTokenization();
    container.dataset.tfeInitialized = 'true';

    var instance = {
      switchDialect: function (id) { switchDialect(id, true); },
      switchStage: switchStage,
      getActiveDialect: function () { return currentDialect; },
      getLatest: function () { return latestMeasurement; },
      presets: TATHYA_PRESETS
    };

    window.__TATHYA_EXPLORER_INSTANCE = instance;
    return instance;
  };
})();
