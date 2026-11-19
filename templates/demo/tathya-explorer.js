/**
 * ============================================================================
 * TATHYA LLM FAILURE EXPLORER INTERACTIVE COMPONENT
 * Author: Agent 4 (Demo)
 * Contract: tokens.md & interfaces.md
 * Source Data: /data/tathya.json (tathya-eval-preview v0.1.0)
 * ============================================================================
 */

(function () {
  'use strict';

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
    var analysisBodyEl = container.querySelector('#tfe-analysis-body');
    var liveEl = container.querySelector('#tfe-live');

    var currentDialect = 'haryanvi';

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

      // Update content
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
