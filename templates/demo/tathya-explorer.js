/**
 * ============================================================================
 * TATHYA LLM FAILURE EXPLORER LIVE COMPONENT
 * Author: Agent 4 (Demo) / Upgraded v2.1
 * Contract: tokens.md & interfaces.md
 * Source Data: /data/tathya.json (tathya-eval-preview v0.1.0)
 * ============================================================================
 */

(function () {
  'use strict';

  function getUtf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') {
      return Array.from(new TextEncoder().encode(str));
    }
    var utf8 = unescape(encodeURIComponent(str));
    var out = [];
    for (var i = 0; i < utf8.length; i++) {
      out.push(utf8.charCodeAt(i));
    }
    return out;
  }

  function formatUtf8Sequence(str, maxBytes) {
    var bytes = getUtf8Bytes(str);
    var limit = typeof maxBytes === 'number' ? maxBytes : bytes.length;
    var slice = bytes.slice(0, limit);
    var hex = slice.map(function (b) {
      return (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
    }).join(' ');
    if (bytes.length > slice.length) {
      return hex + ' … (' + bytes.length + ' UTF-8 bytes)';
    }
    return hex + ' (' + bytes.length + ' UTF-8 bytes)';
  }

  function escapeText(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Grounded dataset test vectors strictly mapped from data/tathya.json
  var TATHYA_VECTORS = {
    haryanvi: {
      dialect: 'haryanvi',
      name: 'Haryanvi',
      scriptLabel: 'हरियाणवी',
      scriptHint: 'Colloquial Devanagari Orthography',
      category: 'civic_schemes',
      categoryDisplay: 'CIVIC SCHEMES',
      prompt: 'म्हारी सरकार की लाडो योजना के के फायदे सैं?',
      standard_hindi: 'हमारी सरकार की लाडो योजना के क्या लाभ हैं?',
      marker: 'म्हारी',
      markerChunks: ['म्', 'हा', 'री'],
      standardMarker: 'हमारी',
      standardMarkerChunks: ['हमारी'],
      dialectTokens: [
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
      ],
      standardTokens: [
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
      ],
      vizNote: 'Colloquial markers "म्हारी" and "सैं" lack whole-word Manak Hindi entries and fracture across conjunct and matra boundaries.',
      analysis: [
        {
          label: 'Tokenizer Breakdown',
          text: 'Standard Indic LLM tokenizers trained on formal web Hindi (Manak Hindi) lack vocabulary IDs for regional colloquial markers (<code>म्हारी</code>, <code>सैं</code>). Words are shattered into byte-level subword fragments, inflating token length.'
        },
        {
          label: 'Downstream Failure Mode',
          text: 'Attention weights dilute across inflated byte sequences, causing critical entity degradation over state welfare policy (<code>लाडो योजना</code>) and resulting in civic query hallucinations.'
        },
        {
          label: 'Tathya Verification Layer',
          text: 'Normalizes colloquial orthography and assertion boundaries against audited municipal scheme records before response generation.'
        }
      ]
    },
    punjabi: {
      dialect: 'punjabi',
      name: 'Punjabi',
      scriptLabel: 'ਪੰਜਾਬੀ',
      scriptHint: 'Gurmukhi Cross-Script Input',
      category: 'healthcare',
      categoryDisplay: 'HEALTHCARE',
      prompt: 'ਸਰਕਾਰੀ ਹਸਪਤਾਲ ਵਿਚ ਪਰਚੀ ਕਟਵਾਉਣ ਦਾ ਕੀ ਤਰੀਕਾ ਹੈ?',
      standard_hindi: 'सरकारी अस्पताल में पर्ची कटवाने का क्या तरीका है?',
      marker: 'ਪਰਚੀ',
      markerChunks: ['ਪਰ', 'ਚੀ'],
      standardMarker: 'पर्ची',
      standardMarkerChunks: ['पर्ची'],
      dialectTokens: [
        { t: 'ਸਰ', frag: true },
        { t: 'ਕਾ', frag: true },
        { t: 'ਰੀ', frag: true },
        { t: 'ਹਸ', frag: true },
        { t: 'ਪ', frag: true },
        { t: 'ਤਾ', frag: true },
        { t: 'ਲ', frag: true },
        { t: 'ਵਿਚ', frag: false },
        { t: 'ਪਰ', frag: true },
        { t: 'ਚੀ', frag: true },
        { t: 'ਕਟ', frag: true },
        { t: 'ਵਾ', frag: true },
        { t: 'ਉਣ', frag: true },
        { t: 'ਦਾ', frag: false },
        { t: 'ਕੀ', frag: false },
        { t: 'ਤਰੀ', frag: true },
        { t: 'ਕਾ', frag: true },
        { t: 'ਹੈ', frag: false },
        { t: '?', frag: false }
      ],
      standardTokens: [
        { t: 'सरकारी' },
        { t: 'अस्पताल' },
        { t: 'में' },
        { t: 'पर्ची' },
        { t: 'कटवाने' },
        { t: 'का' },
        { t: 'क्या' },
        { t: 'तरीका' },
        { t: 'है' },
        { t: '?' }
      ],
      vizNote: 'Cross-script Gurmukhi vocabulary under-representation splits clinical navigation terms ("ਪਰਚੀ", "ਕਟਵਾਉਣ") into short byte-level pieces.',
      analysis: [
        {
          label: 'Tokenizer Breakdown',
          text: 'Indic LLM tokenizers frequently exhibit severe Gurmukhi vocabulary under-representation compared to Devanagari. Common clinical navigation verbs and nouns (<code>ਕਟਵਾਉਣ</code>, <code>ਪਰਚੀ</code>) fragment into byte-level substrings.'
        },
        {
          label: 'Downstream Failure Mode',
          text: 'High subword token explosion in clinical navigation workflows disrupts transformer attention, causing procedure hallucination when citizens query hospital OPD registration protocols.'
        },
        {
          label: 'Tathya Verification Layer',
          text: 'Acoustic and phonemic normalization bridges Gurmukhi dialect variants into official public health departmental schemas.'
        }
      ]
    },
    bhojpuri: {
      dialect: 'bhojpuri',
      name: 'Bhojpuri',
      scriptLabel: 'भोजपुरी',
      scriptHint: 'Purvanchal Dialect Syntax',
      category: 'governance',
      categoryDisplay: 'GOVERNANCE',
      prompt: 'ई राशन कार्ड बनावे खातिर कवन कवन कागजात चाहीं?',
      standard_hindi: 'यह राशन कार्ड बनवाने के लिए कौन-कौन से दस्तावेज चाहिए?',
      marker: 'खातिर',
      markerChunks: ['खा', 'ति', 'र'],
      standardMarker: 'के लिए',
      standardMarkerChunks: ['के लिए'],
      dialectTokens: [
        { t: 'ई', frag: true },
        { t: 'राशन', frag: false },
        { t: 'कार्ड', frag: false },
        { t: 'बना', frag: true },
        { t: 'वे', frag: true },
        { t: 'खा', frag: true },
        { t: 'ति', frag: true },
        { t: 'र', frag: true },
        { t: 'क', frag: true },
        { t: 'वन', frag: true },
        { t: 'क', frag: true },
        { t: 'वन', frag: true },
        { t: 'काग', frag: true },
        { t: 'जात', frag: true },
        { t: 'चा', frag: true },
        { t: 'हीं', frag: true },
        { t: '?', frag: false }
      ],
      standardTokens: [
        { t: 'यह' },
        { t: 'राशन' },
        { t: 'कार्ड' },
        { t: 'बनवाने' },
        { t: 'के लिए' },
        { t: 'कौन-कौन' },
        { t: 'से' },
        { t: 'दस्तावेज' },
        { t: 'चाहिए' },
        { t: '?' }
      ],
      vizNote: 'Purvanchal markers ("ई", "खातिर", "कवन कवन", "चाहीं") lack standard token IDs and shatter across subword merges.',
      analysis: [
        {
          label: 'Tokenizer Breakdown',
          text: 'Purvanchal dialect markers (proximal demonstrative <code>ई</code>, purposive postposition <code>खातिर</code>, distributive <code>कवन कवन</code>, auxiliary <code>चाहीं</code>) have no whole-token entries in standard vocabularies and shatter into bytes.'
        },
        {
          label: 'Downstream Failure Mode',
          text: 'In public distribution (PDS ration card) queries, subword fragmentation dissolves semantic binding between required identity documentation (<code>कागजात</code>) and entitlement rules.'
        },
        {
          label: 'Tathya Verification Layer',
          text: 'Dual-pass evaluation pipeline parses colloquial morphosyntax and asserts boundary checks against audited civic entitlement checklists.'
        }
      ]
    }
  };

  /**
   * Initializes the Tathya LLM Failure Explorer
   * @param {Object} [customData] Optional overrides from data/tathya.json
   */
  window.initTathyaExplorer = function (customData) {
    var container = document.querySelector('.tfe-explorer');
    if (!container) return null;
    if (container.dataset.tfeInitialized === 'true') {
      return window.__TATHYA_EXPLORER_INSTANCE || null;
    }

    var tabs = Array.prototype.slice.call(container.querySelectorAll('.tfe-tab'));
    var categoryEl = container.querySelector('#tfe-category-val');
    var dialectValEl = container.querySelector('#tfe-dialect-val');
    var scriptHintEl = container.querySelector('#tfe-dialect-script-hint');
    var dialectPromptEl = container.querySelector('#tfe-dialect-prompt');
    var standardPromptEl = container.querySelector('#tfe-standard-prompt');
    var vizSpotlightEl = container.querySelector('#tfe-viz-spotlight');
    var fragCountEl = container.querySelector('#tfe-frag-count');
    var stdCountEl = container.querySelector('#tfe-std-count');
    var dialectTokensEl = container.querySelector('#tfe-dialect-tokens');
    var standardTokensEl = container.querySelector('#tfe-standard-tokens');
    var byteSeqEl = container.querySelector('#tfe-byte-seq');
    var vizNoteEl = container.querySelector('#tfe-viz-note');
    var analysisBodyEl = container.querySelector('#tfe-analysis-body');
    var liveEl = container.querySelector('#tfe-live');

    var currentDialect = 'haryanvi';

    function renderTokenViz(data) {
      var dialectBytes = getUtf8Bytes(data.prompt).length;
      var standardBytes = getUtf8Bytes(data.standard_hindi).length;

      if (vizSpotlightEl) {
        var stdChunks = data.standardMarkerChunks.map(function (c) {
          return '[' + escapeText(c) + ']';
        }).join('');
        var diaChunks = data.markerChunks.map(function (c) {
          return '[' + escapeText(c) + ']';
        }).join('');
        vizSpotlightEl.innerHTML =
          '<span class="tfe-spot-clean">' + escapeText(data.standardMarker) + ' → <code>' + stdChunks + '</code></span>' +
          '<span class="tfe-spot-sep" aria-hidden="true">vs</span>' +
          '<span class="tfe-spot-frag">' + escapeText(data.marker) + ' → <code>' + diaChunks + '</code></span>';
      }

      if (fragCountEl) {
        fragCountEl.textContent = data.dialectTokens.length + ' segments · ' + dialectBytes + ' UTF-8 bytes';
      }

      if (stdCountEl) {
        stdCountEl.textContent = data.standardTokens.length + ' whole tokens · ' + standardBytes + ' UTF-8 bytes';
      }

      if (dialectTokensEl) {
        dialectTokensEl.innerHTML = data.dialectTokens.map(function (tok) {
          var cls = tok.frag ? 'tfe-chip tfe-chip--frag' : 'tfe-chip tfe-chip--whole';
          return '<span class="' + cls + '">[' + escapeText(tok.t) + ']</span>';
        }).join('');
      }

      if (standardTokensEl) {
        standardTokensEl.innerHTML = data.standardTokens.map(function (tok) {
          return '<span class="tfe-chip tfe-chip--clean">[' + escapeText(tok.t) + ']</span>';
        }).join('');
      }

      if (byteSeqEl) {
        byteSeqEl.innerHTML = '<strong>Marker UTF-8 Bytes (' + escapeText(data.marker) + '):</strong> <code>' +
          escapeText(formatUtf8Sequence(data.marker, 12)) + '</code>';
      }

      if (vizNoteEl) {
        vizNoteEl.textContent = data.vizNote;
      }
    }

    function switchDialect(dialectId, updateFocus) {
      var data = TATHYA_VECTORS[dialectId];
      if (!data) return;

      currentDialect = dialectId;

      // Update tabs state
      tabs.forEach(function (tab) {
        var isSelected = tab.getAttribute('data-dialect') === dialectId;
        tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');
        if (isSelected && updateFocus) {
          tab.focus();
        }
      });

      // Update metadata and prompt comparison
      if (categoryEl) {
        categoryEl.textContent = data.categoryDisplay;
      }
      if (dialectValEl) {
        dialectValEl.textContent = data.name + ' (' + data.dialect + ')';
      }
      if (scriptHintEl) {
        scriptHintEl.textContent = data.scriptHint;
      }
      if (dialectPromptEl) {
        dialectPromptEl.textContent = data.prompt;
      }
      if (standardPromptEl) {
        standardPromptEl.textContent = data.standard_hindi;
      }

      // Update token fragmentation visualizer
      renderTokenViz(data);

      // Update analysis points
      if (analysisBodyEl) {
        analysisBodyEl.innerHTML = data.analysis.map(function (item) {
          return '<p class="tfe-analysis-p"><strong>' + item.label + ':</strong> ' + item.text + '</p>';
        }).join('');
      }

      // Announce for screen readers
      if (liveEl) {
        liveEl.textContent = 'Switched to ' + data.name + ' ' + data.categoryDisplay + ' test vector.';
      }
    }

    // Attach click and keyboard handlers
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        var dialectId = tab.getAttribute('data-dialect');
        switchDialect(dialectId, false);
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
          var targetTab = tabs[newIndex];
          var dialectId = targetTab.getAttribute('data-dialect');
          switchDialect(dialectId, true);
        }
      });
    });

    renderTokenViz(TATHYA_VECTORS[currentDialect]);
    container.dataset.tfeInitialized = 'true';

    var instance = {
      switchDialect: function (id) { switchDialect(id, true); },
      getActiveDialect: function () { return currentDialect; },
      vectors: TATHYA_VECTORS
    };

    window.__TATHYA_EXPLORER_INSTANCE = instance;
    return instance;
  };
})();
