/**
 * ============================================================================
 * templates/share/client-share.js
 * Client-side SEO, Schema.org graph, dynamic section OG updater, and share HUD.
 * Adheres strictly to interfaces.md and tokens.md contracts.
 * ============================================================================
 */

(function() {
  'use strict';

  var DEFAULT_DOMAIN = 'https://rudras-portfolio.netlify.app';

  /**
   * Safely retrieves portfolio data following offline/file:// contract in interfaces.md
   * @param {Object} [content]
   * @returns {Object|null}
   */
  function getPortfolioData(content) {
    if (content && typeof content === 'object') return content;
    if (window.__PORTFOLIO_CONTENT__ && typeof window.__PORTFOLIO_CONTENT__ === 'object') {
      return window.__PORTFOLIO_CONTENT__;
    }
    var el = document.getElementById('portfolio-content-data');
    if (el && el.textContent) {
      try {
        return JSON.parse(el.textContent);
      } catch (e) {
        console.error('[SEO] Data parse error from #portfolio-content-data:', e);
      }
    }
    return null;
  }

  /**
   * Resolves canonical base domain safely across origins
   * @param {Object} [data]
   * @returns {string}
   */
  function getBaseDomain(data) {
    try {
      if (window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
        return window.location.origin;
      }
    } catch (e) {}
    var d = data || getPortfolioData();
    if (d && d.meta && d.meta.canonical_url) {
      return d.meta.canonical_url.replace(/\/+$/, '');
    }
    return DEFAULT_DOMAIN;
  }

  /**
   * Idempotent meta tag helper
   * @param {string} attrName - 'name' or 'property'
   * @param {string} attrVal - key
   * @param {string} contentVal - value
   */
  function setOrCreateMeta(attrName, attrVal, contentVal) {
    if (!contentVal) return;
    var selector = 'meta[' + attrName + '="' + attrVal + '"]';
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentVal);
  }

  /**
   * Dynamically swaps OpenGraph and Twitter card images to match current active section
   * @param {string} section - 'hero' | 'competitions' | 'ventures' | 'contact'
   */
  function updateSectionOgMeta(section) {
    var baseDomain = getBaseDomain();
    var canonicalUrl = baseDomain.replace(/\/+$/, '') + '/';

    var ogMap = {
      hero: { image: 'og-hero.png', titleSuffix: 'Builder · Rishihood \'30', hash: '' },
      about: { image: 'og-hero.png', titleSuffix: 'Trajectory & Journey', hash: '#about' },
      competitions: { image: 'og-competitions.png', titleSuffix: 'Verified Competitions & Podiums', hash: '#competitions' },
      ventures: { image: 'og-ventures.png', titleSuffix: 'Ventures & Systems', hash: '#ventures' },
      contact: { image: 'og-contact.png', titleSuffix: 'Direct Transmission Channels', hash: '#contact' }
    };

    var target = ogMap[section] || ogMap.hero;
    var imageUrl = canonicalUrl + 'assets/og/' + target.image;
    var pageUrl = canonicalUrl + target.hash;

    setOrCreateMeta('property', 'og:image', imageUrl);
    setOrCreateMeta('property', 'og:image:secure_url', imageUrl);
    setOrCreateMeta('name', 'twitter:image', imageUrl);
    setOrCreateMeta('property', 'og:url', pageUrl);
    setOrCreateMeta('name', 'twitter:url', pageUrl);
  }

  /**
   * Global Init Function complying with interfaces.md
   * @param {Object} [content]
   */
  window.initSEOAndSchema = function(content) {
    var data = getPortfolioData(content);
    if (!data) return;

    var baseDomain = getBaseDomain(data);
    var canonicalUrl = baseDomain.replace(/\/+$/, '') + '/';
    var p = data.personal || {};

    var ogTitle = (p.name || 'Rudra Sharma') + ' — ' + (p.headline || 'Builder · Rishihood \'30');
    var ogDesc = p.bio_statement || 'First-year CS & Data Science undergraduate at Rishihood University (\'30). Builder of software tools, local utilities, and early venture prototypes, learning through live execution.';
    var defaultOgImg = canonicalUrl + 'assets/og/og-hero.png';

    setOrCreateMeta('name', 'description', ogDesc);
    setOrCreateMeta('property', 'og:title', ogTitle);
    setOrCreateMeta('property', 'og:description', ogDesc);
    setOrCreateMeta('property', 'og:url', canonicalUrl);
    setOrCreateMeta('property', 'og:image', defaultOgImg);
    setOrCreateMeta('name', 'twitter:title', ogTitle);
    setOrCreateMeta('name', 'twitter:description', ogDesc);
    setOrCreateMeta('name', 'twitter:image', defaultOgImg);
    setOrCreateMeta('name', 'twitter:url', canonicalUrl);

    // Update canonical link element
    var canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', canonicalUrl);
    }

    // Hash change dynamic OG updater
    window.addEventListener('hashchange', function() {
      var hash = (window.location.hash || '').replace('#', '').toLowerCase();
      if (hash) updateSectionOgMeta(hash);
    });

    // Check initial hash on load
    if (window.location.hash) {
      var initialHash = window.location.hash.replace('#', '').toLowerCase();
      updateSectionOgMeta(initialHash);
    }
  };

  /**
   * Tactical Share & Clipboard helper with design-token HUD toast
   * @param {Object} [options]
   */
  window.copyPortfolioShareLink = function(options) {
    var opts = options || {};
    var urlToCopy = opts.url || window.location.href;
    var message = opts.message || '[LINK COPIED TO CLIPBOARD]';

    function showToast() {
      var toast = document.querySelector('.seo-share-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'seo-share-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = '<span class="seo-share-toast__beacon" aria-hidden="true"></span><span class="seo-share-toast__text"></span>';
        document.body.appendChild(toast);
      }
      var textEl = toast.querySelector('.seo-share-toast__text');
      if (textEl) textEl.textContent = message;

      toast.classList.add('seo-share-toast--active');
      clearTimeout(toast._timer);
      toast._timer = setTimeout(function() {
        toast.classList.remove('seo-share-toast--active');
      }, 3000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlToCopy).then(showToast).catch(function() {
        showToast();
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = urlToCopy;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      showToast();
    }
  };

  // Auto-boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.initSEOAndSchema();
    });
  } else {
    window.initSEOAndSchema();
  }
})();
