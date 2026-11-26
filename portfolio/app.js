window.__PORTFOLIO_CONTENT__ = (function() {
  try {
    var el = document.getElementById('portfolio-content-data');
    return el ? JSON.parse(el.textContent) : {};
  } catch (e) {
    return {};
  }
})();
  /* --- 1. Base Portfolio Core Scripting --- */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scroll Progress & Sticky Navbar Scroll State
    const nav = document.getElementById('nav');
    const progressBar = document.getElementById('progress');
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.width = (h > 0 ? (window.scrollY / h * 100) : 0) + '%';
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    // 2. Mobile Hamburger Toggle
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (burger && mobileMenu) {
      burger.addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.querySelectorAll('#mobileMenu a, #mobileMenu button:not(#rm-toggle-mobile)').forEach(a => {
        a.addEventListener('click', () => {
          document.body.classList.remove('menu-open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
      const rmToggleMobile = document.getElementById('rm-toggle-mobile');
      if (rmToggleMobile) {
        rmToggleMobile.addEventListener('click', (e) => {
          e.preventDefault();
          document.body.classList.remove('menu-open');
          burger.setAttribute('aria-expanded', 'false');
          const rmToggle = document.getElementById('rm-toggle');
          if (rmToggle) {
            rmToggle.click();
            rmToggleMobile.setAttribute('aria-expanded', rmToggle.getAttribute('aria-expanded') || 'false');
          }
        });
      }
      mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
          document.body.classList.remove('menu-open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
          document.body.classList.remove('menu-open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Shared Clipboard & Toast Helpers (Single Source of Truth)
    window.__showPortfolioToast = function(message) {
      const toast = document.getElementById('rm-toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('rm-toast-visible');
      clearTimeout(toast._toastTimer);
      toast._toastTimer = setTimeout(() => {
        toast.classList.remove('rm-toast-visible');
      }, 2800);
    };

    window.__copyPortfolioText = function(text, onSuccess, onError) {
      function legacyCopy() {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.top = '-9999px';
          ta.style.left = '-9999px';
          ta.style.opacity = '0';
          ta.setAttribute('readonly', '');
          document.body.appendChild(ta);
          ta.focus({ preventScroll: true });
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          if (onSuccess) onSuccess();
        } catch (err) {
          if (onError) onError(err);
          else if (onSuccess) onSuccess();
        }
      }
      if (navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (onSuccess) onSuccess();
        }).catch(legacyCopy);
      } else {
        legacyCopy();
      }
    };

    // 3. Live Typewriter Terminal (Synced to content.json)
    const heroData = (window.__PORTFOLIO_CONTENT__ && window.__PORTFOLIO_CONTENT__.hero) || {};
    const promptLabelEl = document.querySelector('.hero-tagline-prompt .prompt');
    if (promptLabelEl && heroData.terminal_prompt) {
      promptLabelEl.textContent = heroData.terminal_prompt;
    }
    const typedPhrases = (Array.isArray(heroData.typewriter_phrases) && heroData.typewriter_phrases.length > 0)
      ? heroData.typewriter_phrases
      : [
          "researching how llms fail on punjabi, haryanvi & bhojpuri",
          "1st place cash rush winner at ashoka university",
          "top 10 national finalist at iim amritsar (~700 teams)",
          "1st place winner at builders' bootcamp demo day",
          "working on stratum, flow state and krama"
        ];
    let pIdx = 0;
    let cIdx = typedPhrases[0].length;
    let deleting = true;
    const typedEl = document.getElementById('typedOutput');

    function runTypewriter() {
      if (!typedEl) return;
      const current = typedPhrases[pIdx] || '';
      cIdx = deleting ? Math.max(0, cIdx - 1) : Math.min(current.length, cIdx + 1);
      typedEl.textContent = current.substring(0, cIdx);

      let speed = deleting ? 24 : 45;
      if (!deleting && cIdx === current.length) {
        speed = 2200;
        deleting = true;
      } else if (deleting && cIdx === 0) {
        deleting = false;
        pIdx = (pIdx + 1) % typedPhrases.length;
        speed = 400;
      }
      setTimeout(runTypewriter, speed);
    }
    if (typedEl) {
      typedEl.textContent = typedPhrases[0];
      if (!reduced) {
        setTimeout(runTypewriter, 2200);
      }
    }

    // 4. Dynamic Count-Up Stat Numbers
    const statObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        statObserver.unobserve(entry.target);
        const targetVal = +entry.target.dataset.count;
        if (isNaN(targetVal)) return;
        if (reduced) {
          entry.target.textContent = String(targetVal).padStart(2, '0');
          return;
        }

        let curr = 0;
        const interval = setInterval(() => {
          curr += 1;
          if (curr >= targetVal) {
            curr = targetVal;
            clearInterval(interval);
          }
          entry.target.textContent = String(curr).padStart(2, '0');
        }, 80);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-num[data-count]').forEach(el => statObserver.observe(el));

    // 5. Scroll Reveal Observer
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 6. Direct Institutional Email Copy (#copyBox) with Instant Checkmark & Toast
    (function bindCopyBox() {
      const copyBox = document.getElementById('copyBox');
      const copyTag = document.getElementById('copyTag');
      if (!copyBox || !copyTag) return;

      let resetTimer = null;
      function handleCopyEmail(e) {
        if (e) e.preventDefault();
        const valEl = copyBox.querySelector('.info-val');
        const fallbackEmail = (window.__PORTFOLIO_CONTENT__ && window.__PORTFOLIO_CONTENT__.personal && window.__PORTFOLIO_CONTENT__.personal.email) || 'rudra.s26042@csds.rishihood.edu.in';
        const email = ((valEl && valEl.textContent) || fallbackEmail).trim();

        window.__copyPortfolioText(email, () => {
          copyBox.classList.add('copied');
          copyTag.textContent = '[COPIED ✓]';
          window.__showPortfolioToast('Email copied to clipboard: ' + email);
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            copyBox.classList.remove('copied');
            copyTag.textContent = '[COPY]';
          }, 2400);
        });
      }

      copyBox.addEventListener('click', handleCopyEmail);
      copyBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCopyEmail(e);
        }
      });
    })();

  /* --- 2. SEO & Schema Engine --- */
/**
 * SEO & Schema.org Structured Data Engine (Phase 1)
 * Idempotent runtime initialization & dynamic schema graph generation
 */
(function() {
  'use strict';

  // Centralized deployment domain configuration
  var FALLBACK_DOMAIN = 'https://rudras-portfolio.netlify.app';

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
   * Determines current base domain safely across local file:// and web origins
   * Reads centralized canonical_url from data when available
   * @param {Object} [data] - Portfolio content data
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
    return FALLBACK_DOMAIN;
  }

  /**
   * Updates or creates a <meta> element idempotently
   * @param {string} attrName - 'name' or 'property'
   * @param {string} attrVal - meta key
   * @param {string} contentVal - meta value
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
   * Generates Schema.org JSON-LD object graph strictly using verified data
   * @param {Object} data - Verified content.json structure
   * @param {string} baseDomain - Canonical base URL
   * @returns {Object} Valid Schema.org JSON-LD graph
   */
  function buildSchemaGraph(data, baseDomain) {
    var personal = data.personal || {};
    var hero = data.hero || {};
    var comps = Array.isArray(data.competitions) ? data.competitions : [];
    var ventures = Array.isArray(data.ventures) ? data.ventures : [];

    var canonicalUrl = baseDomain.replace(/\/+$/, '') + '/';
    var portraitUrl = (hero.portrait && hero.portrait.path)
      ? canonicalUrl + hero.portrait.path.replace(/^\/+/, '')
      : canonicalUrl + 'assets/rudra-pitch-portrait.jpg';

    // 1. WebSite Node
    var websiteNode = {
      "@type": "WebSite",
      "@id": canonicalUrl + "#website",
      "url": canonicalUrl,
      "name": personal.name ? (personal.name + " — Builder · Rishihood '30") : "Rudra Sharma — Builder · Rishihood '30",
      "description": "Single source of truth for Rudra Sharma portfolio: Evidence, Not Noise.",
      "inLanguage": "en-US",
      "publisher": {
        "@id": canonicalUrl + "#person"
      }
    };

    // 2. Person Node
    var personNode = {
      "@type": "Person",
      "@id": canonicalUrl + "#person",
      "name": personal.name || "Rudra Sharma",
      "givenName": personal.name ? personal.name.split(' ')[0] : "Rudra",
      "familyName": personal.name ? personal.name.split(' ').slice(1).join(' ') : "Sharma",
      "jobTitle": "Undergraduate Builder & CS Researcher",
      "headline": personal.headline || "First-Year B.Tech CS & Data Science · Builder · Rishihood '30",
      "description": personal.bio_statement || "First-year CS & Data Science undergraduate at Rishihood University ('30). Builder of software tools, local utilities, and early venture prototypes, learning through live execution.",
      "url": canonicalUrl,
      "image": portraitUrl,
      "sameAs": []
    };

    if (personal.email && personal.email !== 'TBD') {
      personNode.email = "mailto:" + personal.email;
    }

    if (personal.linkedin && personal.linkedin !== 'TBD') {
      personNode.sameAs.push(personal.linkedin);
    }

    if (personal.github && personal.github !== 'TBD') {
      personNode.sameAs.push(personal.github);
    }

    if (personal.institution && personal.institution !== 'TBD') {
      personNode.alumniOf = {
        "@type": "CollegeOrUniversity",
        "name": personal.institution
      };
      personNode.affiliation = {
        "@type": "CollegeOrUniversity",
        "name": personal.institution
      };
    }

    if (personal.degree && personal.degree !== 'TBD') {
      personNode.hasCredential = [
        {
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": "degree",
          "name": personal.degree,
          "recognizedBy": {
            "@type": "CollegeOrUniversity",
            "name": personal.institution || "Rishihood University"
          }
        }
      ];
    }

    personNode.knowsAbout = [
      "Computer Science",
      "Data Science",
      "Machine Learning & Dialect Evaluation",
      "Market Simulation Systems",
      "Offline-First Software Systems",
      "Venture Strategy"
    ];

    // 3. ItemList for Verified Competitions
    var competitionListElements = comps.map(function(comp, idx) {
      var itemImg = comp.proof && comp.proof.url && comp.proof.url !== 'TBD'
        ? canonicalUrl + comp.proof.url.replace(/^\/+/, '')
        : undefined;

      var awardObj = {
        "@type": "Award",
        "name": (comp.placement || "Podium") + " — " + comp.title,
        "description": comp.field_context || comp.story && comp.story.result || comp.title,
        "location": (comp.host || "") + (comp.event ? " · " + comp.event : ""),
        "url": canonicalUrl + "#competitions"
      };

      if (comp.host && comp.host !== 'TBD') {
        awardObj.provider = {
          "@type": "CollegeOrUniversity",
          "name": comp.host
        };
      }

      if (comp.date && comp.date !== 'TBD') {
        // Map e.g. "October 2026" or "June 2026"
        var d = comp.date;
        if (d.indexOf('October 2026') !== -1) awardObj.startDate = "2026-10";
        else if (d.indexOf('June 2026') !== -1) awardObj.startDate = "2026-06";
        else if (d.indexOf('September 2026') !== -1) awardObj.startDate = "2026-09";
        else awardObj.startDate = d;
      }

      if (itemImg) {
        awardObj.image = itemImg;
      }

      return {
        "@type": "ListItem",
        "position": idx + 1,
        "name": (comp.placement || "Podium") + " — " + comp.title,
        "item": awardObj
      };
    });

    var competitionListNode = {
      "@type": "ItemList",
      "@id": canonicalUrl + "#competitions",
      "name": "Verified Competition Accomplishments & Podiums",
      "description": "Audited competition record and performance telemetry for Rudra Sharma across national and collegiate competitions.",
      "numberOfItems": competitionListElements.length,
      "itemListElement": competitionListElements
    };

    // 4. ItemList for Ventures & Systems
    var ventureListElements = ventures.map(function(ven, idx) {
      var isResearch = ven.category && ven.category.indexOf('RESEARCH') !== -1;
      var itemType = isResearch ? "ResearchProject" : "SoftwareApplication";

      var itemNode = {
        "@type": itemType,
        "name": ven.name,
        "description": ven.thesis || ven.problem || ven.name,
        "url": canonicalUrl + "#ventures"
      };

      if (!isResearch) {
        if (ven.category && ven.category.indexOf('DESKTOP') !== -1) {
          itemNode.applicationCategory = "DeveloperApplication";
          itemNode.operatingSystem = "Desktop OS";
        } else if (ven.category && ven.category.indexOf('SAAS') !== -1) {
          itemNode.applicationCategory = "BusinessApplication";
        } else {
          itemNode.applicationCategory = "EducationalApplication";
        }
      }

      return {
        "@type": "ListItem",
        "position": idx + 1,
        "name": ven.name,
        "item": itemNode
      };
    });

    var ventureListNode = {
      "@type": "ItemList",
      "@id": canonicalUrl + "#ventures",
      "name": "Ventures & Software Systems",
      "description": "Software products, simulation engines, and AI research ventures initiated and engineered by Rudra Sharma.",
      "numberOfItems": ventureListElements.length,
      "itemListElement": ventureListElements
    };

    return {
      "@context": "https://schema.org",
      "@graph": [
        websiteNode,
        personNode,
        competitionListNode,
        ventureListNode
      ]
    };
  }

  /**
   * Main Initialization Function
   * @param {Object} [content]
   */
  window.initSEOAndSchema = function(content) {
    var data = getPortfolioData(content);
    var baseDomain = getBaseDomain(data);
    var canonicalUrl = baseDomain.replace(/\/+$/, '') + '/';

    if (data) {
      var personal = data.personal || {};
      var hero = data.hero || {};
      var portraitPath = (hero.portrait && hero.portrait.path)
        ? hero.portrait.path.replace(/^\/+/, '')
        : 'assets/rudra-pitch-portrait.jpg';
      var portraitUrl = canonicalUrl + portraitPath;

      var metaDesc = (personal.name || "Rudra Sharma") + ", " +
        (personal.degree || "first-year B.Tech CS & Data Science at Rishihood University (Class of 2030)") +
        ". 1st place champion at Ashoka Cash Rush and Builders' Bootcamp; top 10 national finalist at IIM Amritsar's CINE-SELL (~700 teams).";

      var ogTitle = (personal.name || "Rudra Sharma") + " — " + (personal.headline || "Builder · Rishihood '30");
      var ogDesc = personal.bio_statement ||
        "First-year B.Tech CS & Data Science at Rishihood University. 2 Championships, Top 10 National Finalist at IIM Amritsar (~700 teams).";

      // Dynamically update standard metadata
      setOrCreateMeta('name', 'description', metaDesc);
      setOrCreateMeta('property', 'og:title', ogTitle);
      setOrCreateMeta('property', 'og:description', ogDesc);
      setOrCreateMeta('property', 'og:url', canonicalUrl);
      setOrCreateMeta('property', 'og:image', portraitUrl);
      setOrCreateMeta('name', 'twitter:title', ogTitle);
      setOrCreateMeta('name', 'twitter:description', ogDesc);
      setOrCreateMeta('name', 'twitter:image', portraitUrl);
      setOrCreateMeta('name', 'twitter:url', canonicalUrl);

      // Canonical link tag update
      var canonicalEl = document.querySelector('link[rel="canonical"]');
      if (canonicalEl) {
        canonicalEl.setAttribute('href', canonicalUrl);
      }

      // Generate & inject or update Schema.org JSON-LD
      var schemaObj = buildSchemaGraph(data, baseDomain);
      var scriptEl = document.querySelector('script.seo-schema-script');
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.type = 'application/ld+json';
        scriptEl.className = 'seo-schema-script';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schemaObj, null, 2);
    }
  };

  /**
   * Tactical Share & Clipboard helper with design-token-compliant HUD toast
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
      // Fallback
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

  // Safe automatic execution on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.initSEOAndSchema();
    });
  } else {
    window.initSEOAndSchema();
  }
})();

  /* --- 3. Performance & Adaptive Canvas Engine --- */
/**
 * Adaptive Particle Wavefield Canvas Engine
 * Meets all Component 5 criteria from interfaces.md:
 * 1. Pause requestAnimationFrame loop when canvas/hero is offscreen or tab is hidden.
 * 2. Cut density/resolution grid on low-end hardware and mobile viewports (window.innerWidth < 768).
 * 3. Respect prefers-reduced-motion: reduce (halt loop, render single static frame, hide glow).
 * 4. Zero visual regression on high-end desktop.
 * 5. Adaptive frame budget guard: downsize resolution if FPS < 40 across 120 consecutive frames.
 */
(function() {
  'use strict';

  // Global Engine state store
  window.__CANVAS_ENGINE = window.__CANVAS_ENGINE || {
    fps: 60,
    active: true,
    reduced: false,
    deviceTier: 'high' // 'high' | 'medium' | 'low'
  };

  window.initAdaptiveCanvas = function() {
    const canvas = document.getElementById('field');
    if (!canvas) {
      console.warn('[pf] #field canvas element not found.');
      return {
        pause: function() {},
        resume: function() {},
        getFPS: function() { return 60; },
        setReduced: function() {}
      };
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Apply performance containment class
    canvas.classList.add('pf-canvas-layer');

    const glowEl = document.getElementById('glow');
    const heroEl = document.getElementById('hero');

    // Engine internal states
    let W = 0, H = 0;
    let t = 0;
    let mx = 0.5, my = 0.35, tx = 0.5, ty = 0.35;
    let rafId = null;
    let isLoopRunning = false;
    let isTabVisible = !document.hidden;
    let isHeroVisible = true;
    let isManualPaused = false;
    let isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // FPS & Adaptive budget tracking
    let lastFrameTime = performance.now();
    let smoothedFps = 60;
    let consecutiveLowFrames = 0;
    const LOW_FPS_THRESHOLD = 40;
    const CONSECUTIVE_LIMIT = 120;

    // Hardware & Device Tier Profiling
    function profileDeviceTier() {
      const isMobileViewport = window.innerWidth < 768;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = navigator.deviceMemory || 8; // GB (Chromium)

      if (isMobileViewport || cores < 4 || memory < 4) {
        return 'low';
      }
      if (cores <= 6 || memory <= 4) {
        return 'medium';
      }
      return 'high';
    }

    let deviceTier = profileDeviceTier();
    window.__CANVAS_ENGINE.deviceTier = deviceTier;
    window.__CANVAS_ENGINE.reduced = isReduced;

    // Grid Density Configuration
    let cols = 80;
    let rows = 46;
    let DPR = Math.min(window.devicePixelRatio || 1, 2);

    function computeGridConfig() {
      const w = window.innerWidth;
      const tier = window.__CANVAS_ENGINE.deviceTier;

      if (w < 480) {
        cols = 36;
        rows = 22;
        DPR = Math.min(window.devicePixelRatio || 1, 1.25);
      } else if (w < 768 || tier === 'low') {
        cols = 44;
        rows = 26;
        DPR = Math.min(window.devicePixelRatio || 1, 1.25);
      } else if (tier === 'medium') {
        cols = 64;
        rows = 38;
        DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      } else {
        // High-end desktop: ZERO visual regression
        cols = 80;
        rows = 46;
        DPR = Math.min(window.devicePixelRatio || 1, 2);
      }
    }

    function resizeCanvas() {
      computeGridConfig();
      W = canvas.width = Math.floor(window.innerWidth * DPR);
      H = canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';

      if (isReduced) {
        drawStaticFrame();
      }
    }

    // Static frame for prefers-reduced-motion: reduce
    function drawStaticFrame() {
      if (!ctx || W === 0 || H === 0) return;
      ctx.clearRect(0, 0, W, H);
      canvas.classList.add('pf-canvas-static');

      const gx = W / (cols - 1);
      const gy = H / (rows - 1);

      // Render calm resting dot grid (single frame)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const px = i * gx;
          const py = j * gy;
          const idleWave = Math.sin(i * 0.16) * Math.cos(j * 0.19);
          const y = py + idleWave * 0.2 * H * 0.04;
          const a = Math.max(0.04, 0.10 + idleWave * 0.04);
          const size = 1.3;

          ctx.fillStyle = 'rgba(156, 152, 141, ' + a.toFixed(3) + ')';
          ctx.fillRect(px, y, size * DPR, size * DPR);
        }
      }
    }

    // High-performance animated frame
    function drawFrame() {
      ctx.clearRect(0, 0, W, H);
      const gx = W / (cols - 1);
      const gy = H / (rows - 1);

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const px = i * gx;
          const py = j * gy;
          const dist = Math.hypot(i / cols - mx, j / rows - my);
          const idleWave = Math.sin(i * 0.16 + t) * Math.cos(j * 0.19 + t * 0.75);
          const mouseSwell = Math.exp(-dist * 2.8);
          const y = py + (idleWave * (0.2 + 0.8 * mouseSwell) + Math.exp(-dist * 3.4) * 0.8) * H * 0.04;
          const a = Math.max(0.04, 0.12 + idleWave * 0.05 + mouseSwell * 0.45);
          const size = 1.3 + mouseSwell * 1.2;

          // Base tone: var(--text-muted) equivalent
          ctx.fillStyle = 'rgba(156, 152, 141, ' + a.toFixed(3) + ')';
          ctx.fillRect(px, y, size * DPR, size * DPR);

          // Accent swell: var(--accent) tactical chartreuse
          if (mouseSwell > 0.28) {
            ctx.fillStyle = 'rgba(165, 186, 40, ' + ((mouseSwell - 0.28) * 0.85).toFixed(3) + ')';
            ctx.fillRect(px, y, size * DPR, size * DPR);
          }
        }
      }
    }

    // Adaptive animation loop
    function loopCanvas(currentTime) {
      if (!isLoopRunning) return;

      // Delta time & FPS Telemetry
      const delta = currentTime - lastFrameTime;
      lastFrameTime = currentTime;

      if (delta > 0 && delta < 500) {
        const instantFps = 1000 / delta;
        smoothedFps = smoothedFps * 0.92 + instantFps * 0.08;
        window.__CANVAS_ENGINE.fps = Math.round(smoothedFps);

        // Frame Budget Guard: Check for sustained frame drop (< 40 fps across 120 frames)
        if (instantFps < LOW_FPS_THRESHOLD) {
          consecutiveLowFrames++;
          if (consecutiveLowFrames >= CONSECUTIVE_LIMIT && window.__CANVAS_ENGINE.deviceTier !== 'low') {
            // Adaptive downgrade
            window.__CANVAS_ENGINE.deviceTier = (window.__CANVAS_ENGINE.deviceTier === 'high') ? 'medium' : 'low';
            consecutiveLowFrames = 0;
            resizeCanvas();
          }
        } else if (consecutiveLowFrames > 0) {
          consecutiveLowFrames--;
        }
      }

      t += 0.014;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;

      drawFrame();

      rafId = requestAnimationFrame(loopCanvas);
    }

    function shouldAnimate() {
      return !isReduced && !isManualPaused && isTabVisible && isHeroVisible;
    }

    function syncState() {
      const active = shouldAnimate();
      window.__CANVAS_ENGINE.active = active;

      if (active) {
        canvas.classList.remove('pf-canvas-paused', 'pf-canvas-static');
        if (glowEl && !isReduced) glowEl.classList.remove('pf-glow-hidden');

        if (!isLoopRunning) {
          isLoopRunning = true;
          lastFrameTime = performance.now();
          rafId = requestAnimationFrame(loopCanvas);
        }
      } else {
        canvas.classList.add('pf-canvas-paused');
        if (isLoopRunning) {
          isLoopRunning = false;
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
        if (isReduced) {
          if (glowEl) glowEl.classList.add('pf-glow-hidden');
          drawStaticFrame();
        }
      }
    }

    // IntersectionObserver: Pause when hero/canvas is offscreen
    let heroObserver = null;
    if (heroEl && 'IntersectionObserver' in window) {
      heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          isHeroVisible = entry.isIntersecting;
          syncState();
        });
      }, {
        rootMargin: '100px 0px 100px 0px',
        threshold: 0
      });
      heroObserver.observe(heroEl);
    } else {
      isHeroVisible = true;
    }

    // VisibilityChange: Pause when tab is hidden
    function onVisibilityChange() {
      isTabVisible = !document.hidden;
      syncState();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Media Query Listener for prefers-reduced-motion
    let motionQuery = null;
    function handleMotionChange(e) {
      isReduced = e.matches;
      window.__CANVAS_ENGINE.reduced = isReduced;
      syncState();
    }

    if (window.matchMedia) {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', handleMotionChange);
      } else if (motionQuery.addListener) {
        motionQuery.addListener(handleMotionChange);
      }
    }

    // Throttled Pointer tracking
    const hasHover = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : true;
    function onPointerMove(e) {
      if (isReduced || !isLoopRunning) return;
      tx = e.clientX / window.innerWidth;
      ty = e.clientY / window.innerHeight;

      if (glowEl && hasHover) {
        glowEl.style.left = e.clientX + 'px';
        glowEl.style.top = e.clientY + 'px';
      }
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // Window Resize handling
    let resizeTimer = null;
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        resizeCanvas();
      }, 100);
    }
    window.addEventListener('resize', onResize, { passive: true });

    // Initial setup
    resizeCanvas();
    syncState();

    // Exported controller object
    return {
      pause: function() {
        isManualPaused = true;
        syncState();
      },
      resume: function() {
        isManualPaused = false;
        syncState();
      },
      getFPS: function() {
        return window.__CANVAS_ENGINE.fps;
      },
      setReduced: function(val) {
        isReduced = Boolean(val);
        window.__CANVAS_ENGINE.reduced = isReduced;
        syncState();
      },
      destroy: function() {
        if (rafId) cancelAnimationFrame(rafId);
        isLoopRunning = false;
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);
        if (heroObserver) heroObserver.disconnect();
      }
    };
  };

  // Self-initialize on DOM readiness
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (!window.__CANVAS_CONTROLLER) {
        window.__CANVAS_CONTROLLER = window.initAdaptiveCanvas();
      }
    });
  } else {
    if (!window.__CANVAS_CONTROLLER) {
      window.__CANVAS_CONTROLLER = window.initAdaptiveCanvas();
    }
  }
})();

  /* --- 4. Recruiter Mode Engine --- */
(function() {
  'use strict';

  // In-memory state management (Strictly persist NOTHING sensitive, zero localStorage/sessionStorage/cookies)
  window.__RECRUITER_MODE = {
    active: false,
    timestamp: null
  };

  /**
   * Safe data resolution adhering to offline / file:// protocol contract
   */
  function resolveContentData(content) {
    if (content && typeof content === 'object') return content;
    if (window.__PORTFOLIO_CONTENT__ && typeof window.__PORTFOLIO_CONTENT__ === 'object') {
      return window.__PORTFOLIO_CONTENT__;
    }
    const scriptEl = document.getElementById('portfolio-content-data');
    if (scriptEl && scriptEl.textContent) {
      try {
        return JSON.parse(scriptEl.textContent);
      } catch (e) {
        console.warn('[RecruiterMode] Failed to parse #portfolio-content-data JSON', e);
      }
    }
    return null;
  }

  /**
   * Helper to copy text to clipboard with fallback for non-secure / file:// origins
   */
  function copyTextToClipboard(text, onSuccess, onError) {
    if (typeof window.__copyPortfolioText === 'function') {
      window.__copyPortfolioText(text, onSuccess, onError);
      return;
    }
    if (onSuccess) onSuccess();
  }

  /**
   * Ensure mount points exist in DOM. If not present in HTML, inject dynamically.
   */
  function ensureDOMMounts() {
    // 1. Check or mount #rm-toggle in nav
    let toggleBtn = document.getElementById('rm-toggle');
    if (!toggleBtn) {
      const nav = document.querySelector('.nav-wrap nav') || document.querySelector('nav');
      if (nav) {
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'rm-toggle';
        toggleBtn.className = 'rm-toggle-btn';
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-controls', 'rm-summary-drawer');
        toggleBtn.setAttribute('aria-label', 'Toggle Recruiter Mode (30-second executive view)');
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = `
          <span class="rm-toggle-beacon" aria-hidden="true"></span>
          <span class="rm-toggle-badge">EXECUTIVE</span>
          <span class="rm-toggle-label">Recruiter Mode</span>
          <span class="rm-toggle-shortcut" aria-hidden="true">30s view</span>
        `;
        const burger = nav.querySelector('#burger');
        const actionPill = nav.querySelector('.nav-action-pill');
        if (actionPill) {
          nav.insertBefore(toggleBtn, actionPill);
        } else if (burger) {
          nav.insertBefore(toggleBtn, burger);
        } else {
          nav.appendChild(toggleBtn);
        }
      }
    }

    // 2. Check or mount #rm-summary-drawer in hero
    let drawerEl = document.getElementById('rm-summary-drawer');
    if (!drawerEl) {
      const hero = document.getElementById('hero') || document.querySelector('.hero-wrap');
      if (hero) {
        const statsRow = hero.querySelector('.hero-stats-row');
        drawerEl = document.createElement('div');
        drawerEl.id = 'rm-summary-drawer';
        drawerEl.className = 'rm-summary-drawer';
        drawerEl.setAttribute('role', 'region');
        drawerEl.setAttribute('aria-label', 'Executive Brief and Recruiter Summary');
        drawerEl.setAttribute('aria-hidden', 'true');
        drawerEl.hidden = true;
        if (statsRow && statsRow.parentNode) {
          statsRow.parentNode.insertBefore(drawerEl, statsRow.nextSibling);
        } else {
          hero.appendChild(drawerEl);
        }
      }
    }

    // 3. Check or mount #rm-toast
    let toast = document.getElementById('rm-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'rm-toast';
      toast.className = 'rm-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      toast.textContent = 'Email copied to clipboard: rudra.s26042@csds.rishihood.edu.in';
      document.body.appendChild(toast);
    }

    return { toggleBtn, drawerEl, toast };
  }

  /**
   * Main Recruiter Mode Initializer
   * Global signature per interfaces.md: window.initRecruiterMode(content)
   * @param {Object} [content] Optional content object conforming to content.json schema
   * @returns {{ toggle: Function, getState: Function }}
   */
  window.initRecruiterMode = function(content) {
    const data = resolveContentData(content);
    const { toggleBtn, drawerEl, toast } = ensureDOMMounts();

    if (!toggleBtn || !drawerEl) {
      console.warn('[RecruiterMode] Missing toggle button or drawer mount target');
      return {
        toggle: function() { return false; },
        getState: function() { return false; }
      };
    }

    const emailToCopy = (data && data.personal && data.personal.email) 
      ? data.personal.email 
      : 'rudra.s26042@csds.rishihood.edu.in';

    const resumeUrl = (data && data.personal && data.personal.resume_url)
      ? data.personal.resume_url
      : 'assets/rudra-sharma-resume.pdf';

    const linkedinUrl = (data && data.personal && data.personal.linkedin)
      ? data.personal.linkedin
      : 'https://www.linkedin.com/in/rudra-sharma-7bb78b410/';

    // Update dynamic anchor attributes if rendered
    const resumeLink = drawerEl.querySelector('#rm-resume-link');
    if (resumeLink) resumeLink.href = resumeUrl;
    const linkedinLink = drawerEl.querySelector('#rm-linkedin-link');
    if (linkedinLink) linkedinLink.href = linkedinUrl;

    let toastTimer = null;
    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('rm-toast-visible');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function() {
        toast.classList.remove('rm-toast-visible');
      }, 3000);
    }

    // Email Copy Button binding
    const copyBtn = drawerEl.querySelector('#rm-copy-email-btn');
    if (copyBtn && !copyBtn.dataset.rmBound) {
      copyBtn.dataset.rmBound = 'true';
      copyBtn.addEventListener('click', function(e) {
        e.preventDefault();
        copyTextToClipboard(emailToCopy, function() {
          showToast('Copied to clipboard: ' + emailToCopy);
          const textSpan = copyBtn.querySelector('#rm-copy-email-text');
          if (textSpan) {
            const original = textSpan.textContent;
            textSpan.textContent = 'Copied!';
            setTimeout(function() { textSpan.textContent = original; }, 2000);
          }
        }, function() {
          showToast('Email: ' + emailToCopy);
        });
      });
    }

    // Toggle implementation
    function setRecruiterState(nextActive) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.__RECRUITER_MODE.active = nextActive;
      window.__RECRUITER_MODE.timestamp = Date.now();

      // Update Body class
      document.body.classList.toggle('rm-mode-active', nextActive);

      // Update Toggle Button ARIA & classes
      toggleBtn.setAttribute('aria-pressed', nextActive ? 'true' : 'false');
      toggleBtn.setAttribute('aria-expanded', nextActive ? 'true' : 'false');
      toggleBtn.classList.toggle('rm-active', nextActive);

      const rmToggleMobile = document.getElementById('rm-toggle-mobile');
      if (rmToggleMobile) {
        rmToggleMobile.setAttribute('aria-pressed', nextActive ? 'true' : 'false');
        rmToggleMobile.setAttribute('aria-expanded', nextActive ? 'true' : 'false');
      }

      // Update Drawer ARIA & visibility
      if (nextActive) {
        drawerEl.hidden = false;
        drawerEl.setAttribute('aria-hidden', 'false');

        // Scroll cleanly below fixed #nav pill using exact offset + scroll-margin-top
        const navEl = document.getElementById('nav');
        const navClearance = navEl ? Math.ceil(navEl.getBoundingClientRect().bottom + 14) : (window.innerWidth <= 640 ? 88 : 96);
        const targetOffset = Math.max(window.innerWidth <= 640 ? 88 : 96, navClearance);
        const targetTop = Math.max(0, drawerEl.getBoundingClientRect().top + window.scrollY - targetOffset);
        try {
          window.scrollTo({ top: targetTop, behavior: reduced ? 'auto' : 'smooth' });
        } catch (e) {
          drawerEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }

        // Focus close button without triggering browser focus scroll under #nav
        const closeBtn = drawerEl.querySelector('#rm-close-btn');
        if (closeBtn) {
          setTimeout(function() {
            try { closeBtn.focus({ preventScroll: true }); } catch (e) { closeBtn.focus(); }
          }, 50);
        }
      } else {
        drawerEl.hidden = true;
        drawerEl.setAttribute('aria-hidden', 'true');
      }

      // Dispatch custom event per interfaces contract
      document.dispatchEvent(new CustomEvent('portfolio:recruiter-mode', {
        detail: { active: nextActive }
      }));

      return nextActive;
    }

    function toggle() {
      const next = !window.__RECRUITER_MODE.active;
      return setRecruiterState(next);
    }

    function getState() {
      return Boolean(window.__RECRUITER_MODE.active);
    }

    // Bind Toggle Button click (avoid multiple bindings)
    if (!toggleBtn.dataset.rmBound) {
      toggleBtn.dataset.rmBound = 'true';
      toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggle();
      });
    }

    // Bind Close Button inside Drawer (avoid multiple bindings)
    const closeBtn = drawerEl.querySelector('#rm-close-btn');
    if (closeBtn && !closeBtn.dataset.rmBound) {
      closeBtn.dataset.rmBound = 'true';
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        setRecruiterState(false);
        if (toggleBtn && window.getComputedStyle(toggleBtn).display !== 'none') {
          toggleBtn.focus();
        } else {
          const burger = document.getElementById('burger');
          if (burger) burger.focus();
        }
      });
    }

    // Keyboard navigation: Escape key collapses drawer and returns focus to toggle
    if (!window.__RM_ESCAPE_BOUND) {
      window.__RM_ESCAPE_BOUND = true;
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
          const cmdPal = document.getElementById('cmd-palette');
          const csModal = document.getElementById('cs-modal');
          const frLightbox = document.getElementById('fr-lightbox');
          const mobileMenu = document.getElementById('mobileMenu');
          if ((cmdPal && cmdPal.open) || (csModal && csModal.open) || (frLightbox && frLightbox.open) || (mobileMenu && mobileMenu.classList.contains('open'))) {
            return;
          }
          if (window.__RECRUITER_MODE && window.__RECRUITER_MODE.active) {
            setRecruiterState(false);
            if (toggleBtn && window.getComputedStyle(toggleBtn).display !== 'none') {
              toggleBtn.focus();
            } else {
              const burger = document.getElementById('burger');
              if (burger) burger.focus();
            }
          }
        }
      });
    }

    return {
      toggle: toggle,
      getState: getState
    };
  };

  // Auto-init on DOMContentLoaded or immediate execution if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.initRecruiterMode();
    });
  } else {
    window.initRecruiterMode();
  }
})();

  /* --- 5. About & Builder Journey Section Engine --- */
(function() {
  'use strict';

  /**
   * Helper: Retrieve portfolio single source of truth data safely
   * Supports explicit argument, window.__PORTFOLIO_CONTENT__, or JSON script tag.
   */
  function getPortfolioData(content) {
    if (content && typeof content === 'object') return content;
    if (typeof window !== 'undefined' && window.__PORTFOLIO_CONTENT__) {
      return window.__PORTFOLIO_CONTENT__;
    }
    if (typeof document !== 'undefined') {
      const el = document.getElementById('portfolio-content-data');
      if (el) {
        try {
          return JSON.parse(el.textContent);
        } catch (e) {
          console.warn('[AboutBlock] Failed to parse #portfolio-content-data JSON', e);
        }
      }
    }
    return null;
  }

  /**
   * Global Init Function: window.initAboutSection(content)
   * Adheres strictly to interfaces.md Component 3 specification.
   */
  window.initAboutSection = function(content) {
    const data = getPortfolioData(content);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Ensure DOM Section Mount (Inserted between #hero and #competitions)
    let section = document.getElementById('about');
    if (!section) {
      // Find template or create element
      const template = document.querySelector('section#about.ab-section');
      if (template) {
        section = template;
      }
    }

    if (section) {
      const competitions = document.getElementById('competitions');
      const hero = document.getElementById('hero');
      if (competitions && competitions.parentNode) {
        // Guarantee insertion immediately BEFORE #competitions
        if (section.nextElementSibling !== competitions) {
          competitions.parentNode.insertBefore(section, competitions);
        }
      } else if (hero && hero.parentNode) {
        // Or immediately AFTER #hero
        if (hero.nextElementSibling !== section) {
          hero.parentNode.insertBefore(section, hero.nextSibling);
        }
      }
    }

    // 2. Hook Nav Item into .nav-links without breaking existing order
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      let aboutNavLi = navLinks.querySelector('a[href="#about"]')?.parentElement;
      if (!aboutNavLi) {
        aboutNavLi = document.createElement('li');
        aboutNavLi.innerHTML = '<a href="#about" class="ab-nav-link"><span class="idx">00</span>About</a>';
        
        const compLi = navLinks.querySelector('a[href="#competitions"]')?.parentElement;
        if (compLi) {
          navLinks.insertBefore(aboutNavLi, compLi);
        } else {
          navLinks.insertBefore(aboutNavLi, navLinks.firstChild);
        }
      }
    }

    // 3. Hook Nav Item into #mobileMenu without breaking existing order
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
      let aboutMobileA = mobileMenu.querySelector('a[href="#about"]');
      if (!aboutMobileA) {
        aboutMobileA = document.createElement('a');
        aboutMobileA.href = '#about';
        aboutMobileA.className = 'ab-mobile-link';
        aboutMobileA.innerHTML = '<span class="idx">00</span>About &amp; Trajectory';

        // Ensure clicking closes mobile drawer
        aboutMobileA.addEventListener('click', function() {
          document.body.classList.remove('menu-open');
          const burger = document.getElementById('burger');
          if (burger) burger.setAttribute('aria-expanded', 'false');
        });

        const compMobileA = mobileMenu.querySelector('a[href="#competitions"]');
        if (compMobileA) {
          mobileMenu.insertBefore(aboutMobileA, compMobileA);
        } else {
          mobileMenu.insertBefore(aboutMobileA, mobileMenu.firstChild);
        }
      }
    }

    // 4. Hydrate Verified Facts from content.json if available
    if (data && data.personal) {
      const p = data.personal;
      
      const bioEl = document.getElementById('ab-bio-statement');
      if (bioEl && p.bio_statement) {
        bioEl.textContent = '“' + p.bio_statement.replace(/^“|”$/g, '') + '”';
      }

      const degreeEl = document.getElementById('ab-cred-degree');
      if (degreeEl && p.degree) {
        // Degree formatting
        degreeEl.textContent = p.degree.split(',')[0] || p.degree;
      }

      const instEl = document.getElementById('ab-cred-institution');
      if (instEl && p.institution) {
        instEl.textContent = p.institution;
      }

      const cohortEl = document.getElementById('ab-cred-cohort');
      if (cohortEl) {
        const year = p.class_year ? ("Class of " + p.class_year) : "Class of 2030";
        const status = p.current_status || "First-Year";
        cohortEl.textContent = year + " · " + status;
      }
    }

    // 5. Staggered Intersection Reveal Observer (Reduced Motion Aware)
    const revealElements = document.querySelectorAll('.ab-reveal');
    if (reduced) {
      // In reduced motion, snap immediately to full visibility
      revealElements.forEach(function(el) {
        el.classList.add('ab-in');
      });
    } else if (typeof IntersectionObserver !== 'undefined') {
      const abObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('ab-in');
            abObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(function(el) {
        abObserver.observe(el);
      });
    } else {
      // Fallback: display immediately
      revealElements.forEach(function(el) {
        el.classList.add('ab-in');
      });
    }
  };

  // Auto-initialize if DOM is already parsed
  if (document.readyState !== 'loading') {
    window.initAboutSection();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      window.initAboutSection();
    });
  }
})();

  /* --- 6. Field Record Proof Layer Engine --- */
/**
 * FIELD RECORD PROOF LAYER ENGINE (v2.0)
 * Scoped to prefix: .fr-
 * Compatible with category filters: #all, #1st-place, #national, #pitch
 */
(function() {
  'use strict';

  function getPortfolioData(content) {
    if (content) return content;
    if (typeof window !== 'undefined' && window.__PORTFOLIO_CONTENT__) return window.__PORTFOLIO_CONTENT__;
    const el = document.getElementById('portfolio-content-data');
    if (el) {
      try { return JSON.parse(el.textContent); } catch (e) { console.error('Data parse error', e); }
    }
    return null;
  }

  window.initFieldRecordProof = function(content) {
    const data = getPortfolioData(content);

    // 1. Evidence Lightbox Modal Management
    let lightbox = document.getElementById('fr-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('dialog');
      lightbox.id = 'fr-lightbox';
      lightbox.className = 'fr-lightbox';
      
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.innerHTML = `
        <div class="fr-lightbox-backdrop" id="fr-lightbox-backdrop"></div>
        <div class="fr-lightbox-window" role="document">
          <div class="fr-lightbox-header">
            <div class="fr-lightbox-title-wrap">
              <span class="fr-lightbox-title" id="fr-lightbox-title">Evidence Artifact</span>
              <span class="fr-lightbox-stamp" id="fr-lightbox-stamp">Field Evidence</span>
            </div>
            <button type="button" class="fr-lightbox-close" id="fr-lightbox-close" aria-label="Close evidence inspection modal">✕</button>
          </div>
          <div class="fr-lightbox-body">
            <img class="fr-lightbox-img" id="fr-lightbox-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Full resolution evidence photo">
          </div>
          <div class="fr-lightbox-footer">
            <div class="fr-lightbox-caption" id="fr-lightbox-caption"></div>
            <div class="fr-lightbox-meta">
              <span class="fr-lightbox-path" id="fr-lightbox-path"></span>
              <a href="#" target="_blank" rel="noopener" class="fr-lightbox-raw-btn" id="fr-lightbox-raw-btn">Raw Asset ↗</a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(lightbox);
    }

    const lbImg = document.getElementById('fr-lightbox-img');
    const lbTitle = document.getElementById('fr-lightbox-title');
    const lbStamp = document.getElementById('fr-lightbox-stamp');
    const lbCaption = document.getElementById('fr-lightbox-caption');
    const lbPath = document.getElementById('fr-lightbox-path');
    const lbRawBtn = document.getElementById('fr-lightbox-raw-btn');
    const lbClose = document.getElementById('fr-lightbox-close');
    const lbBackdrop = document.getElementById('fr-lightbox-backdrop');

    let previousActiveElement = null;

    function openLightbox(src, caption, stamp, compTitle) {
      previousActiveElement = document.activeElement;
      if (lbImg) lbImg.src = src;
      if (lbTitle) lbTitle.textContent = compTitle || 'Evidence Artifact';
      if (lbStamp) lbStamp.textContent = stamp || 'Field Evidence';
      if (lbCaption) lbCaption.textContent = caption || '';
      if (lbPath) lbPath.textContent = src;
      if (lbRawBtn) {
        lbRawBtn.href = src;
        lbRawBtn.target = '_blank';
        lbRawBtn.rel = 'noopener';
        lbRawBtn.setAttribute('download', '');
      }

      if (typeof lightbox.showModal === 'function') {
        lightbox.showModal();
      } else {
        lightbox.setAttribute('open', '');
      }
      
      document.body.classList.add('fr-lightbox-open');

      if (lbClose) lbClose.focus();
    }

    function closeLightbox() {
      if (!lightbox || !lightbox.hasAttribute('open')) return;
      if (typeof lightbox.close === 'function') {
        lightbox.close();
      } else {
        lightbox.removeAttribute('open');
      }
      
      document.body.classList.remove('fr-lightbox-open');
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    }

    if (lbClose) lbClose.onclick = closeLightbox;
    if (lbBackdrop) lbBackdrop.onclick = closeLightbox;

    lightbox.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'Tab') {
        const focusables = lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // 2. Wire Up Proof Inspect Buttons & Venture Artifact Lightbox Triggers
    document.querySelectorAll('.fr-inspect-btn, .vn-artifact-btn').forEach(btn => {
      btn.onclick = function(e) {
        e.stopPropagation();
        const src = btn.getAttribute('data-asset-src');
        const caption = btn.getAttribute('data-asset-caption');
        const stamp = btn.getAttribute('data-asset-stamp');
        const compTitle = btn.getAttribute('data-comp-title');
        if (src) openLightbox(src, caption, stamp, compTitle);
      };
    });

    // Click on main image or frame also opens inspection
    document.querySelectorAll('.fr-main-img, .fr-primary-photo, .fr-photo-frame').forEach(el => {
      el.style.cursor = 'pointer';
      el.onclick = function(e) {
        if (e.target.closest('.fr-inspect-btn')) return;
        const parent = el.closest('.fr-photo-frame') || el;
        const inspectBtn = parent ? parent.querySelector('.fr-inspect-btn') : null;
        if (inspectBtn) inspectBtn.click();
      };
    });

    // 3. Multi-Asset Gallery Switchers
    document.querySelectorAll('.fr-gallery-thumb').forEach(thumb => {
      thumb.onclick = function(e) {
        e.stopPropagation();
        const card = thumb.closest('.fr-card');
        const compId = thumb.getAttribute('data-comp-id') || (card ? card.getAttribute('data-comp-id') : null);
        const src = thumb.getAttribute('data-asset-src') || thumb.getAttribute('data-src');
        const caption = thumb.getAttribute('data-asset-caption') || thumb.getAttribute('data-caption');
        const stamp = thumb.getAttribute('data-asset-stamp');

        const parent = thumb.parentElement;
        if (parent) {
          parent.querySelectorAll('.fr-gallery-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        }

        if (compId && src) {
          const mainImg = document.getElementById('fr-main-img-' + compId);
          const captionEl = document.getElementById('fr-caption-' + compId);
          const pathEl = document.getElementById('fr-path-' + compId);
          const frame = document.getElementById('fr-visual-' + compId);
          const inspectBtn = frame ? frame.querySelector('.fr-inspect-btn') : null;

          if (mainImg) mainImg.src = src;
          if (captionEl && caption) captionEl.textContent = caption;
          if (pathEl) pathEl.textContent = src;
          if (inspectBtn) {
            inspectBtn.setAttribute('data-asset-src', src);
            if (caption) inspectBtn.setAttribute('data-asset-caption', caption);
            if (stamp) inspectBtn.setAttribute('data-asset-stamp', stamp);
          }
        }
      };
    });

    // 4. Category Filtering & Deep-Link Hash Compatibility
    const filterButtons = document.querySelectorAll('.filter-btn');
    const caseCards = document.querySelectorAll('.case-card');
    const participationGrids = document.querySelectorAll('.fr-participation-grid');
    const hideTimers = new WeakMap();

    function applyFilter(filterVal, updateUrlHash = true) {
      if (!filterVal) filterVal = 'all';

      // Update button active state
      filterButtons.forEach(btn => {
        const isMatch = btn.dataset.filter === filterVal;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      // Show/hide cards
      caseCards.forEach(card => {
        const matches = filterVal === 'all' || card.dataset.category === filterVal;
        if (matches) {
          if (hideTimers.has(card)) {
            clearTimeout(hideTimers.get(card));
            hideTimers.delete(card);
          }
          card.classList.remove('hidden');
          requestAnimationFrame(() => card.classList.remove('dimmed'));
        } else {
          card.classList.add('dimmed');
          hideTimers.set(card, setTimeout(() => card.classList.add('hidden'), 320));
        }
      });

      // Show/hide 3-col participation wrapper cleanly so hidden grids leave 0 gap
      participationGrids.forEach(grid => {
        const hasVisibleCard = filterVal === 'all' || filterVal === 'participation' ||
          Array.from(grid.querySelectorAll('.case-card')).some(c => c.dataset.category === filterVal);
        if (hasVisibleCard) {
          if (hideTimers.has(grid)) {
            clearTimeout(hideTimers.get(grid));
            hideTimers.delete(grid);
          }
          grid.classList.remove('hidden');
          requestAnimationFrame(() => grid.classList.remove('dimmed'));
        } else {
          grid.classList.add('dimmed');
          hideTimers.set(grid, setTimeout(() => grid.classList.add('hidden'), 320));
        }
      });

      if (updateUrlHash && window.history && window.history.replaceState) {
        if (filterVal === 'all') {
          const currentHash = window.location.hash;
          if (currentHash === '#all' || currentHash === '#1st-place' || currentHash === '#national' || currentHash === '#pitch' || currentHash === '#participation') {
            window.history.replaceState(null, '', '#competitions');
          }
        } else {
          window.history.replaceState(null, '', '#' + filterVal);
        }
      }
    }

    // Attach click listener to existing filter buttons
    filterButtons.forEach(btn => {
      btn.onclick = function() {
        applyFilter(btn.dataset.filter, true);
      };
    });

    // Read initial hash on page load
    function checkHashFilter() {
      const hash = (window.location.hash || '').replace(/^#/, '').trim();
      const validCategories = ['all', '1st-place', 'national', 'pitch', 'participation'];
      if (validCategories.includes(hash)) {
        applyFilter(hash, false);
      }
    }

    window.addEventListener('hashchange', checkHashFilter);
    checkHashFilter();

    return {
      openProof: openLightbox,
      closeProof: closeLightbox,
      setFilter: applyFilter
    };
  };

  // Auto-init on DOMContentLoaded or immediately if ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initFieldRecordProof());
  } else {
    window.initFieldRecordProof();
  }
})();

  /* --- 7. Case Study Deep-Dives Engine --- */
(function() {
  'use strict';

  window.__ACTIVE_CASE_STUDY = window.__ACTIVE_CASE_STUDY || {
    currentId: null,
    previousActiveElement: null
  };

  window.initCaseStudyDeepDives = function() {
    const venturesSection = document.getElementById('ventures');
    if (!venturesSection) {
      return {
        open: function() {},
        close: function() {},
        toggle: function() {},
        collapseAll: function() {},
        getState: function() { return null; }
      };
    }

    const cards = venturesSection.querySelectorAll('.venture-card');
    if (!cards || cards.length === 0) return;

    const ventureMapping = [
      { id: 'tathya', match: /tathya/i },
      { id: 'stratum', match: /stratum/i },
      { id: 'flow-state', match: /flow\s*state/i },
      { id: 'krama', match: /krama/i }
    ];

    function getVenturePair(id) {
      const card = venturesSection.querySelector('[data-venture-id="' + id + '"]');
      const trigger = document.getElementById('cs-trigger-' + id) || (card ? card.querySelector('.cs-trigger') : null);
      const drawerId = trigger ? (trigger.getAttribute('data-drawer-target') || trigger.getAttribute('aria-controls')) : ('cs-drawer-' + id);
      const drawer = (drawerId && document.getElementById(drawerId)) || document.getElementById('cs-drawer-' + id) || (card ? card.querySelector('.cs-drawer') : null);
      return { card, trigger, drawer };
    }

    function openDrawer(id) {
      const { trigger, drawer } = getVenturePair(id);
      if (!trigger || !drawer) return;

      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.__ACTIVE_CASE_STUDY.previousActiveElement = document.activeElement;
      window.__ACTIVE_CASE_STUDY.currentId = id;

      trigger.setAttribute('aria-expanded', 'true');
      const icon = trigger.querySelector('.cs-trigger-icon, .cs-trigger__icon');
      if (icon) icon.textContent = '−';
      const label = trigger.querySelector('.cs-trigger-label');
      if (label) label.textContent = 'Collapse Deep-Dive';

      drawer.hidden = false;
      drawer.removeAttribute('hidden');

      if (isReduced) {
        drawer.classList.add('cs-open');
      } else {
        void drawer.offsetHeight;
        drawer.classList.add('cs-open');
      }

      document.dispatchEvent(new CustomEvent('portfolio:case-study-toggle', {
        detail: { id: id, open: true }
      }));
    }

    function closeDrawer(id, restoreFocus) {
      const { trigger, drawer } = getVenturePair(id);
      if (!trigger || !drawer) return;

      const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      trigger.setAttribute('aria-expanded', 'false');
      const icon = trigger.querySelector('.cs-trigger-icon, .cs-trigger__icon');
      if (icon) icon.textContent = '+';
      const label = trigger.querySelector('.cs-trigger-label');
      if (label) label.textContent = 'Deep Dive: Systems & Retrospective';

      drawer.classList.remove('cs-open');

      if (window.__ACTIVE_CASE_STUDY.currentId === id) {
        window.__ACTIVE_CASE_STUDY.currentId = null;
      }

      if (isReduced) {
        drawer.hidden = true;
      } else {
        const onEnd = function(e) {
          if (e.target === drawer && e.propertyName === 'grid-template-rows') {
            drawer.removeEventListener('transitionend', onEnd);
            if (trigger.getAttribute('aria-expanded') === 'false') {
              drawer.hidden = true;
            }
          }
        };
        drawer.addEventListener('transitionend', onEnd);
        setTimeout(function() {
          if (trigger.getAttribute('aria-expanded') === 'false') {
            drawer.hidden = true;
          }
        }, 280);
      }

      if (restoreFocus && trigger) {
        trigger.focus();
      }

      document.dispatchEvent(new CustomEvent('portfolio:case-study-toggle', {
        detail: { id: id, open: false }
      }));
    }

    function toggleDrawer(id) {
      const { trigger } = getVenturePair(id);
      if (!trigger) return;
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeDrawer(id, false);
      } else {
        openDrawer(id);
      }
    }

    function collapseAll(restoreFocus) {
      let lastTrigger = null;
      venturesSection.querySelectorAll('.cs-trigger[aria-expanded="true"]').forEach(function(trig) {
        lastTrigger = trig;
        const card = trig.closest('.venture-card');
        const id = (card && card.getAttribute('data-venture-id')) || (trig.id || '').replace('cs-trigger-', '');
        if (id) closeDrawer(id, false);
      });
      if (restoreFocus && lastTrigger) {
        lastTrigger.focus();
      }
    }

    cards.forEach(function(card, index) {
      let ventureId = card.getAttribute('data-venture-id');
      if (!ventureId) {
        const titleEl = card.querySelector('.venture-name');
        const titleText = titleEl ? titleEl.textContent : '';
        for (let i = 0; i < ventureMapping.length; i++) {
          if (ventureMapping[i].match.test(titleText)) {
            ventureId = ventureMapping[i].id;
            break;
          }
        }
        if (!ventureId && index < ventureMapping.length) {
          ventureId = ventureMapping[index].id;
        }
        if (ventureId) card.setAttribute('data-venture-id', ventureId);
      }
      if (!ventureId) return;

      const { trigger, drawer } = getVenturePair(ventureId);
      if (!trigger || !drawer) return;

      if (!trigger._csBound) {
        trigger._csBound = true;
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          toggleDrawer(ventureId);
        });
        trigger.addEventListener('keydown', function(e) {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleDrawer(ventureId);
          } else if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
            e.preventDefault();
            e.stopPropagation();
            closeDrawer(ventureId, true);
          }
        });
      }

      const closeBtn = drawer.querySelector('.cs-close-drawer-btn');
      if (closeBtn && !closeBtn._csBound) {
        closeBtn._csBound = true;
        closeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          closeDrawer(ventureId, true);
        });
      }

      if (!drawer._csBound) {
        drawer._csBound = true;
        drawer.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeDrawer(ventureId, true);
          }
        });
      }
    });

    if (!window.__CS_DRAWER_ESCAPE_BOUND) {
      window.__CS_DRAWER_ESCAPE_BOUND = true;
      document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        const cmdPal = document.getElementById('cmd-palette');
        const csModal = document.getElementById('cs-modal');
        const frLightbox = document.getElementById('fr-lightbox');
        if ((cmdPal && cmdPal.open) || (csModal && csModal.open) || (frLightbox && frLightbox.open)) return;
        const openTriggers = venturesSection.querySelectorAll('.cs-trigger[aria-expanded="true"]');
        if (openTriggers.length > 0) {
          collapseAll(true);
        }
      });
    }

    return {
      open: openDrawer,
      close: function(id) { closeDrawer(id, false); },
      toggle: toggleDrawer,
      collapseAll: function() { collapseAll(false); },
      getState: function(id) {
        if (!id) return window.__ACTIVE_CASE_STUDY.currentId;
        const { trigger } = getVenturePair(id);
        return trigger ? trigger.getAttribute('aria-expanded') === 'true' : false;
      }
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.initCaseStudyDeepDives();
    });
  } else {
    window.initCaseStudyDeepDives();
  }
})();

  /* --- 8. Telemetry & Audited Unit Economics Modal Engine --- */
  window.initTelemetryModal = function(content) {
    function getPortfolioDataSafe(c) {
      if (c && typeof c === 'object') return c;
      if (window.__PORTFOLIO_CONTENT__ && typeof window.__PORTFOLIO_CONTENT__ === 'object') return window.__PORTFOLIO_CONTENT__;
      const el = document.getElementById('portfolio-content-data');
      if (el) {
        try { return JSON.parse(el.textContent); } catch (e) {}
      }
      return null;
    }

    function formatINR(val) {
      const n = Number(val);
      return Number.isFinite(n) ? n.toLocaleString('en-IN') : String(val);
    }

    function isPresent(val) {
      return val !== undefined && val !== null && val !== '' && val !== 'TBD';
    }

    const data = getPortfolioDataSafe(content);
    const modal = document.getElementById('cs-modal');
    if (!modal) return { open: function() {}, close: function() {} };

    const modalBody = document.getElementById('cs-modal-body');
    const modalTitle = document.getElementById('cs-modal-title');
    const modalMeta = document.getElementById('cs-modal-meta');
    const closeBtn = document.getElementById('cs-modal-close');
    const backdrop = document.getElementById('cs-modal-backdrop');

    let previousActiveElement = null;

    function openModal(compId) {
      if (!data || !Array.isArray(data.competitions)) return;
      const comp = data.competitions.find(c => c.id === compId) || data.competitions[0];
      if (!comp) return;

      previousActiveElement = document.activeElement;
      window.__ACTIVE_CASE_STUDY = window.__ACTIVE_CASE_STUDY || {};
      window.__ACTIVE_CASE_STUDY.currentId = compId;
      window.__ACTIVE_CASE_STUDY.previousActiveElement = previousActiveElement;

      if (modalTitle) modalTitle.textContent = comp.title;
      if (modalMeta) modalMeta.textContent = (comp.placement || 'Podium') + ' · ' + (comp.host || '') + (comp.event ? ' · ' + comp.event : '') + (comp.date ? ' (' + comp.date + ')' : '');

      let html = '';

      // Financials Ledger
      if (comp.financials) {
        const fin = comp.financials;
        html += '<div class="cs-modal-section">' +
          '<h4 class="cs-modal-heading">Unit Economics & Financial Breakdown</h4>' +
          '<div class="cs-telemetry-grid">' +
            (isPresent(fin.starting_capital_inr) ? '<div class="cs-telemetry-cell"><span class="cs-telemetry-lbl">Starting Capital</span><span class="cs-telemetry-val">₹' + formatINR(fin.starting_capital_inr) + '</span></div>' : '') +
            (isPresent(fin.ending_fund_inr) ? '<div class="cs-telemetry-cell"><span class="cs-telemetry-lbl">Ending Fund</span><span class="cs-telemetry-val cs-accent">₹' + formatINR(fin.ending_fund_inr) + '</span></div>' : '') +
            (isPresent(fin.multiplier) ? '<div class="cs-telemetry-cell"><span class="cs-telemetry-lbl">Growth Multiplier</span><span class="cs-telemetry-val cs-accent">' + fin.multiplier + '</span></div>' : '') +
            (isPresent(fin.time_window_minutes) ? '<div class="cs-telemetry-cell"><span class="cs-telemetry-lbl">Time Window</span><span class="cs-telemetry-val">' + fin.time_window_minutes + ' mins</span></div>' : '') +
            (isPresent(fin.total_costs_inr) ? '<div class="cs-telemetry-cell"><span class="cs-telemetry-lbl">Total Costs</span><span class="cs-telemetry-val">₹' + formatINR(fin.total_costs_inr) + '</span></div>' : '') +
            (isPresent(fin.cash_prize_inr) && Number(fin.cash_prize_inr) > 0 ? '<div class="cs-telemetry-cell"><span class="cs-telemetry-lbl">Cash Prize Won</span><span class="cs-telemetry-val cs-accent">₹' + formatINR(fin.cash_prize_inr) + '</span></div>' : '') +
          '</div>';

        // Visual Proportional ROI Bar when ending_fund_inr is present
        if (isPresent(fin.ending_fund_inr)) {
          const seed = isPresent(fin.starting_capital_inr) ? Math.max(0, Number(fin.starting_capital_inr)) : 0;
          const cost = isPresent(fin.total_costs_inr) ? Math.max(0, Number(fin.total_costs_inr)) : 0;
          const yieldAmt = isPresent(fin.total_service_revenue_inr) ? Math.max(0, Number(fin.total_service_revenue_inr)) : Math.max(0, Number(fin.ending_fund_inr));
          const totalScale = Math.max(1, seed + cost + yieldAmt);
          const seedPct = seed > 0 ? Math.max(4, Math.round((seed / totalScale) * 100)) : 0;
          const costPct = cost > 0 ? Math.max(2, Math.round((cost / totalScale) * 100)) : 0;
          const yieldPct = Math.max(10, 100 - seedPct - costPct);
          const multSuffix = isPresent(fin.multiplier) ? ' (' + fin.multiplier + ')' : '';

          html += '<div class="fr-roi-bar-wrap" aria-label="Proportional unit economics flow">' +
            '<div class="fr-roi-bar-head">' +
              '<span class="fr-roi-bar-title">PROPORTIONAL CAPITAL FLOW</span>' +
              '<span class="fr-roi-bar-total mono">₹' + formatINR(fin.ending_fund_inr) + ' Ending' + multSuffix + '</span>' +
            '</div>' +
            '<div class="fr-roi-track" role="img" aria-label="Seed, cost, and service yield proportions">' +
              (seedPct > 0 ? '<span class="fr-roi-seg fr-roi-seg--seed" style="width:' + seedPct + '%" title="₹' + formatINR(seed) + ' Seed"></span>' : '') +
              (costPct > 0 ? '<span class="fr-roi-seg fr-roi-seg--cost" style="width:' + costPct + '%" title="₹' + formatINR(cost) + ' Cost"></span>' : '') +
              '<span class="fr-roi-seg fr-roi-seg--yield" style="width:' + yieldPct + '%" title="₹' + formatINR(yieldAmt) + ' Service Yield"></span>' +
            '</div>' +
            '<div class="fr-roi-legend">' +
              '<span class="fr-roi-leg-item"><i class="fr-roi-dot fr-roi-dot--seed" aria-hidden="true"></i>₹' + formatINR(seed) + ' Seed</span>' +
              '<span class="fr-roi-leg-item"><i class="fr-roi-dot fr-roi-dot--cost" aria-hidden="true"></i>₹' + formatINR(cost) + ' Cost</span>' +
              '<span class="fr-roi-leg-item fr-roi-leg-accent"><i class="fr-roi-dot fr-roi-dot--yield" aria-hidden="true"></i>₹' + formatINR(yieldAmt) + ' Service Yield</span>' +
            '</div>' +
          '</div>';
        }

        if (Array.isArray(fin.service_breakdown) && fin.service_breakdown.length > 0) {
          html += '<div class="cs-service-table-wrap">' +
            '<span class="cs-service-heading">Itemized Revenue Yield Breakdown:</span>' +
            '<table class="cs-service-table">' +
              '<thead><tr><th>Service / Offering</th><th>Revenue</th><th>Mechanism</th></tr></thead>' +
              '<tbody>' +
                fin.service_breakdown.map(s => '<tr><td><strong>' + s.name + '</strong></td><td class="cs-accent">₹' + formatINR(s.revenue_inr) + '</td><td>' + s.mechanism + '</td></tr>').join('') +
              '</tbody>' +
            '</table>' +
          '</div>';
        }
        html += '</div>';
      }

      // Squad & Deliverables
      if (comp.team || (comp.deliverables && comp.deliverables.length)) {
        html += '<div class="cs-modal-section"><div class="cs-modal-split">';
        if (comp.team) {
          const validMembers = Array.isArray(comp.team.members) ? comp.team.members.filter(m => m && m !== 'TBD') : [];
          html += '<div>' +
            '<h4 class="cs-modal-heading">Squad & Role</h4>' +
            '<p class="cs-modal-p"><strong>Rudra\'s Role:</strong> <span class="cs-accent">' + (comp.team.rudra_role || comp.team.role || 'Lead') + '</span></p>' +
            (isPresent(comp.team.squad_name) ? '<p class="cs-modal-p"><strong>Squad:</strong> ' + comp.team.squad_name + (isPresent(comp.team.size) ? ' (' + comp.team.size + ' members)' : '') + '</p>' : '') +
            (validMembers.length > 0 ? '<p class="cs-modal-p"><strong>Personnel:</strong> ' + validMembers.join(', ') + '</p>' : '') +
          '</div>';
        }
        if (comp.deliverables && comp.deliverables.length) {
          html += '<div>' +
            '<h4 class="cs-modal-heading">Deliverables Shipped</h4>' +
            '<ul class="cs-modal-list">' +
              comp.deliverables.filter(d => d && d !== 'TBD').map(d => '<li>▸ ' + d + '</li>').join('') +
            '</ul>' +
          '</div>';
        }
        html += '</div></div>';
      }

      // Story & Field Protocol
      if (comp.story) {
        html += '<div class="cs-modal-section">' +
          '<h4 class="cs-modal-heading">Field Protocol & Strategy</h4>' +
          '<div class="cs-modal-story">' +
            (isPresent(comp.story.setup) ? '<p><strong>The Brief & Setup:</strong> ' + comp.story.setup + '</p>' : '') +
            (isPresent(comp.story.key_decision) ? '<p><strong>Key Execution Decision:</strong> ' + comp.story.key_decision + '</p>' : '') +
            (isPresent(comp.story.result) ? '<p><strong>Audited Outcome:</strong> ' + comp.story.result + '</p>' : '') +
          '</div>' +
          (isPresent(comp.story.takeaway) ? (
            '<blockquote class="cs-modal-takeaway">' +
              '<span>Core Field Takeaway:</span>' +
              '“' + comp.story.takeaway + '”' +
            '</blockquote>'
          ) : '') +
        '</div>';
      }

      // Evidence Asset inspect link (inline button, NOT position: absolute)
      if (comp.proof && isPresent(comp.proof.url)) {
        html += '<div class="cs-modal-section cs-modal-footer-proof">' +
          '<span>Evidence Artifact: <code>' + comp.proof.url + '</code></span>' +
          '<button type="button" class="btn-solid cs-modal-inspect-btn" data-asset-src="' + comp.proof.url + '" data-asset-caption="' + (comp.proof.caption || '') + '" data-asset-stamp="' + (comp.proof.stamp || '') + '" data-comp-title="' + comp.title + '">Inspect High-Res Artifact ↗</button>' +
        '</div>';
      }

      if (modalBody) modalBody.innerHTML = html;

      if (typeof modal.showModal === 'function') {
        modal.showModal();
      } else {
        modal.setAttribute('open', '');
      }
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cs-modal-open');
      if (closeBtn) closeBtn.focus();

      const inspectBtn = modalBody.querySelector('.cs-modal-inspect-btn');
      if (inspectBtn) {
        inspectBtn.onclick = function() {
          const src = inspectBtn.getAttribute('data-asset-src');
          const caption = inspectBtn.getAttribute('data-asset-caption');
          const stamp = inspectBtn.getAttribute('data-asset-stamp');
          const compTitle = inspectBtn.getAttribute('data-comp-title');
          closeModal();
          if (window.__FIELD_RECORD_PROOF && typeof window.__FIELD_RECORD_PROOF.openProof === 'function') {
            window.__FIELD_RECORD_PROOF.openProof(src, caption, stamp, compTitle);
          } else {
            const mainInspect = document.querySelector('.fr-inspect-btn[data-comp-title="' + comp.title + '"]');
            if (mainInspect) mainInspect.click();
          }
        };
      }
    }

    function closeModal() {
      if (!modal || !modal.hasAttribute('open')) return;
      if (typeof modal.close === 'function') {
        modal.close();
      } else {
        modal.removeAttribute('open');
      }
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cs-modal-open');
      if (window.__ACTIVE_CASE_STUDY) window.__ACTIVE_CASE_STUDY.currentId = null;
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    }

    if (closeBtn) closeBtn.onclick = closeModal;
    if (backdrop) backdrop.onclick = closeModal;
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });

    modal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.key === 'Tab') {
        const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    document.querySelectorAll('.cs-deepdive-btn').forEach(btn => {
      btn.onclick = function(e) {
        e.preventDefault();
        const compId = btn.getAttribute('data-comp-id');
        openModal(compId);
      };
    });

    return {
      open: openModal,
      close: closeModal
    };
  };

  /* --- 9. Venture Interactive Objects (Stratum Sim, Flow State Synth, Krama Calc) --- */
  window.initVentureInteractives = function() {
    // 9A. Stratum CPM Shock Micro-Simulator
    const stratumWidget = document.querySelector('.vn-sim-widget[data-sim="stratum"]');
    if (stratumWidget && !stratumWidget.dataset.bound) {
      stratumWidget.dataset.bound = 'true';
      const tabs = stratumWidget.querySelectorAll('.vn-sim-tab');
      const sparkPath = document.getElementById('stratum-spark-path');
      const chartWrap = stratumWidget.querySelector('.vn-sim-chart');
      const scenarioEl = document.getElementById('stratum-sim-scenario');
      const capEl = document.getElementById('stratum-readout-cap');
      const marginEl = document.getElementById('stratum-readout-margin');

      const modes = {
        baseline: {
          path: 'M 4 38 L 48 34 L 92 36 L 136 30 L 180 32 L 236 28',
          shock: false,
          scenario: 'Scenario: Baseline auction pace; tracking capital velocity and margin yield.',
          cap: 'Steady Pace',
          margin: 'Protected Baseline'
        },
        shock: {
          path: 'M 4 38 L 48 35 L 92 14 L 136 10 L 180 24 L 236 18',
          shock: true,
          scenario: 'Ad CPMs spike 40% mid-quarter. Reallocate budget to protect margin.',
          cap: 'Reallocate Budget',
          margin: 'Margin Protected'
        }
      };

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const modeKey = tab.getAttribute('data-sim-mode') || 'baseline';
          const cfg = modes[modeKey] || modes.baseline;
          tabs.forEach(t => {
            const active = t === tab;
            t.classList.toggle('active', active);
            t.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
          if (sparkPath) sparkPath.setAttribute('d', cfg.path);
          if (chartWrap) chartWrap.classList.toggle('vn-sim-shock', cfg.shock);
          if (scenarioEl) scenarioEl.textContent = cfg.scenario;
          if (capEl) capEl.textContent = cfg.cap;
          if (marginEl) marginEl.textContent = cfg.margin;
        });
      });
    }

    // 9B. Flow State 432Hz + 216Hz Web Audio Procedural Sine Synth
    const synthBtn = document.getElementById('flowstate-synth-btn');
    const synthLabel = document.getElementById('flowstate-synth-label');
    if (synthBtn && !synthBtn.dataset.bound) {
      synthBtn.dataset.bound = 'true';
      let audioCtx = null;
      let masterGain = null;
      let oscMain = null;
      let oscSub = null;
      let isPlaying = false;

      function updateSynthUI(playing) {
        synthBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
        synthBtn.classList.toggle('vn-synth-active', playing);
        if (synthLabel) {
          synthLabel.textContent = playing ? '■ Stop 432Hz Sine Synth' : '▶ Test 432Hz Sine Synth';
        }
      }

      function stopSynth() {
        isPlaying = false;
        updateSynthUI(false);
        try {
          if (audioCtx && masterGain) {
            const now = audioCtx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), now);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
          }
          const o1 = oscMain;
          const o2 = oscSub;
          oscMain = null;
          oscSub = null;
          setTimeout(() => {
            try { if (o1) o1.stop(); } catch (e) {}
            try { if (o2) o2.stop(); } catch (e) {}
          }, 95);
        } catch (e) {}
      }

      function startSynth() {
        isPlaying = true;
        updateSynthUI(true);
        try {
          const AudioCtor = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtor) {
            window.__showPortfolioToast('Flow State 432Hz Synth toggled (Web Audio API unavailable)');
            return;
          }
          if (!audioCtx) audioCtx = new AudioCtor();
          if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
            audioCtx.resume().catch(() => {});
          }
          const now = audioCtx.currentTime;
          masterGain = audioCtx.createGain();
          masterGain.gain.setValueAtTime(0.0001, now);
          masterGain.gain.linearRampToValueAtTime(0.035, now + 0.14);
          masterGain.connect(audioCtx.destination);

          oscMain = audioCtx.createOscillator();
          oscMain.type = 'sine';
          oscMain.frequency.setValueAtTime(432, now);

          oscSub = audioCtx.createOscillator();
          oscSub.type = 'sine';
          oscSub.frequency.setValueAtTime(216, now);

          const subGain = audioCtx.createGain();
          subGain.gain.setValueAtTime(0.45, now);

          oscMain.connect(masterGain);
          oscSub.connect(subGain);
          subGain.connect(masterGain);

          oscMain.start(now);
          oscSub.start(now);
        } catch (e) {
          // Graceful fallback if AudioContext blocked by browser autoplay policy
        }
      }

      window.__toggleFlowStateSynth = function() {
        if (isPlaying) stopSynth();
        else startSynth();
        return isPlaying;
      };

      synthBtn.addEventListener('click', window.__toggleFlowStateSynth);
    }

    // 9C. Krama 75% Attendance Recovery Mini-Calculator
    const kramaCalc = document.getElementById('krama-calc-widget');
    if (kramaCalc && !kramaCalc.dataset.bound) {
      kramaCalc.dataset.bound = 'true';
      let attended = parseInt(kramaCalc.getAttribute('data-attended') || '17', 10);
      let total = parseInt(kramaCalc.getAttribute('data-total') || '25', 10);

      const attValEl = document.getElementById('krama-att-val');
      const totValEl = document.getElementById('krama-tot-val');
      const pctEl = document.getElementById('krama-pct-readout');
      const adviceEl = document.getElementById('krama-advice-readout');

      function renderKramaCalc() {
        total = Math.max(1, total);
        attended = Math.max(0, Math.min(attended, total));
        kramaCalc.setAttribute('data-attended', String(attended));
        kramaCalc.setAttribute('data-total', String(total));

        let analysis;
        if (window.KramaMath && typeof window.KramaMath.analyzeAttendance === 'function') {
          analysis = window.KramaMath.analyzeAttendance(attended, total, 0.75);
        } else {
          const pct = (attended / total) * 100;
          const needed = pct < 75 ? Math.max(1, Math.ceil(3 * total - 4 * attended)) : 0;
          const buffer = pct >= 75 ? Math.max(0, Math.floor((4 * attended - 3 * total) / 3)) : 0;
          analysis = {
            percentage: pct,
            percentageFormatted: pct.toFixed(1) + '%',
            isEligible: pct >= 75,
            advice: pct < 75
              ? ('Attend next ' + needed + ' consecutive class' + (needed === 1 ? '' : 'es') + ' to recover 75.0%.')
              : (buffer > 0 ? ('Safe buffer: can skip ' + buffer + ' class' + (buffer === 1 ? '' : 'es') + ' while staying ≥75.0%.') : 'On 75.0% threshold — attend next class to build margin.')
          };
        }
        if (attValEl) attValEl.textContent = String(attended);
        if (totValEl) totValEl.textContent = String(total);
        if (pctEl) {
          pctEl.textContent = analysis.percentageFormatted;
          pctEl.classList.toggle('vn-calc-safe', analysis.isEligible);
        }
        if (adviceEl) {
          adviceEl.textContent = analysis.advice;
        }
      }

      const attMinus = document.getElementById('krama-att-minus');
      const attPlus = document.getElementById('krama-att-plus');
      const totMinus = document.getElementById('krama-tot-minus');
      const totPlus = document.getElementById('krama-tot-plus');

      if (attMinus) attMinus.addEventListener('click', () => { attended = Math.max(0, attended - 1); renderKramaCalc(); });
      if (attPlus) attPlus.addEventListener('click', () => {
        attended += 1;
        if (attended > total) total = attended;
        renderKramaCalc();
      });
      if (totMinus) totMinus.addEventListener('click', () => {
        total = Math.max(1, total - 1);
        if (attended > total) attended = total;
        renderKramaCalc();
      });
      if (totPlus) totPlus.addEventListener('click', () => { total += 1; renderKramaCalc(); });

      renderKramaCalc();
    }
  };

  /* --- 10. Signature ⌘K Command Palette Engine (#cmd-palette) --- */
  window.initCommandPalette = function(content) {
    const dialog = document.getElementById('cmd-palette');
    const input = document.getElementById('cmd-palette-input');
    const listEl = document.getElementById('cmd-palette-list');
    const emptyEl = document.getElementById('cmd-palette-empty');
    const closeBtn = document.getElementById('cmd-palette-close');
    const backdrop = document.getElementById('cmd-palette-backdrop');
    if (!dialog || !input || !listEl) return;

    const p = (content && content.personal) || (window.__PORTFOLIO_CONTENT__ && window.__PORTFOLIO_CONTENT__.personal) || {};
    const email = p.email || 'rudra.s26042@csds.rishihood.edu.in';
    const resumeUrl = p.resume_url || 'assets/rudra-sharma-resume.pdf';
    const githubUrl = p.github || 'https://github.com/rudras2048-arch';
    const linkedinUrl = p.linkedin || 'https://www.linkedin.com/in/rudra-sharma-7bb78b410/';

    const commands = [
      { id: 'jump-about', title: 'Jump to 00 // About & Trajectory', group: 'Section', keywords: 'about trajectory ethos rishihood', run: () => document.getElementById('about')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) },
      { id: 'jump-record', title: 'Jump to 01 // Competitive Field Record', group: 'Section', keywords: 'competitions record ashoka iim dcrust bootcamp', run: () => document.getElementById('competitions')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) },
      { id: 'jump-ventures', title: 'Jump to 02 // Ventures & Systems', group: 'Section', keywords: 'ventures tathya stratum flow state krama', run: () => document.getElementById('ventures')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) },
      { id: 'jump-tathya', title: 'Open Tathya Dialect Workbench', group: 'Lab', keywords: 'tathya dialect haryanvi punjabi bhojpuri token', run: () => document.getElementById('tathya-workbench')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) },
      { id: 'jump-contact', title: 'Jump to 03 // Direct Contact', group: 'Section', keywords: 'contact email reach out', run: () => document.getElementById('contact')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) },
      { id: 'toggle-rm', title: 'Toggle Executive Recruiter Mode (30s View)', group: 'Action', keywords: 'recruiter mode executive brief dossier', run: () => document.getElementById('rm-toggle')?.click() },
      { id: 'open-ashoka', title: 'Inspect Ashoka Cash Rush Telemetry (8.85x ROI)', group: 'Telemetry', keywords: 'ashoka cash rush modal telemetry ledger 8.85x', run: () => window.__TELEMETRY_MODAL && window.__TELEMETRY_MODAL.open('cash-rush') },
      { id: 'toggle-synth', title: 'Toggle Flow State 432Hz Sine Synthesizer', group: 'Audio', keywords: 'flow state 432hz audio synth sine', run: () => window.__toggleFlowStateSynth ? window.__toggleFlowStateSynth() : document.getElementById('flowstate-synth-btn')?.click() },
      { id: 'copy-email', title: 'Copy Institutional Email (' + email + ')', group: 'Action', keywords: 'copy email clipboard contact', run: () => {
        window.__copyPortfolioText(email, () => window.__showPortfolioToast('Copied to clipboard: ' + email));
      }},
      { id: 'open-resume', title: 'Open Official Résumé (PDF)', group: 'Link', keywords: 'resume pdf cv download', run: () => window.open(resumeUrl, '_blank', 'noopener') },
      { id: 'open-github', title: 'Open GitHub Profile (rudras2048-arch)', group: 'Link', keywords: 'github code repository', run: () => window.open(githubUrl, '_blank', 'noopener') },
      { id: 'open-linkedin', title: 'Open LinkedIn Profile', group: 'Link', keywords: 'linkedin network profile', run: () => window.open(linkedinUrl, '_blank', 'noopener') }
    ];

    let filtered = commands.slice();
    let activeIdx = 0;
    let prevActive = null;

    function renderList() {
      const q = (input.value || '').trim().toLowerCase();
      filtered = q
        ? commands.filter(c => (c.title + ' ' + c.group + ' ' + c.keywords).toLowerCase().includes(q))
        : commands.slice();
      activeIdx = Math.min(activeIdx, Math.max(0, filtered.length - 1));

      if (filtered.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      listEl.innerHTML = filtered.map((cmd, idx) =>
        '<button type="button" class="cmd-palette-item' + (idx === activeIdx ? ' active' : '') + '" role="option" aria-selected="' + (idx === activeIdx ? 'true' : 'false') + '" data-cmd-idx="' + idx + '">' +
          '<span class="cmd-palette-item-title">' + cmd.title + '</span>' +
          '<span class="cmd-palette-group">' + cmd.group + '</span>' +
        '</button>'
      ).join('');

      listEl.querySelectorAll('.cmd-palette-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.getAttribute('data-cmd-idx'), 10);
          executeItem(i);
        });
      });
    }

    function executeItem(idx) {
      const cmd = filtered[idx];
      if (!cmd) return;
      closePalette(false);
      cmd.run();
    }

    function openPalette() {
      if (dialog.hasAttribute('open')) return;
      prevActive = document.activeElement;
      document.body.classList.remove('menu-open');
      const burger = document.getElementById('burger');
      if (burger) burger.setAttribute('aria-expanded', 'false');

      input.value = '';
      activeIdx = 0;
      renderList();

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      dialog.setAttribute('aria-hidden', 'false');
      input.focus();
    }

    function closePalette(restoreFocus) {
      if (!dialog.hasAttribute('open')) return;
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
      dialog.setAttribute('aria-hidden', 'true');
      if (restoreFocus && prevActive && typeof prevActive.focus === 'function') {
        prevActive.focus();
      }
    }

    input.addEventListener('input', () => {
      activeIdx = 0;
      renderList();
    });

    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closePalette(true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filtered.length > 0) {
          activeIdx = (activeIdx + 1) % filtered.length;
          renderList();
          listEl.querySelector('.cmd-palette-item.active')?.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filtered.length > 0) {
          activeIdx = (activeIdx - 1 + filtered.length) % filtered.length;
          renderList();
          listEl.querySelector('.cmd-palette-item.active')?.scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter') {
        if (document.activeElement === closeBtn) return;
        e.preventDefault();
        executeItem(activeIdx);
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', () => closePalette(true));
    if (backdrop) backdrop.addEventListener('click', () => closePalette(true));
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closePalette(true);
    });

    ['cmd-palette-trigger', 'cmd-palette-trigger-mobile', 'cmd-palette-trigger-footer'].forEach(id => {
      const trigger = document.getElementById(id);
      if (trigger && !trigger.dataset.cmdBound) {
        trigger.dataset.cmdBound = 'true';
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          openPalette();
        });
      }
    });

    if (!window.__CMD_PALETTE_KEY_BOUND) {
      window.__CMD_PALETTE_KEY_BOUND = true;
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (dialog.hasAttribute('open')) closePalette(true);
          else openPalette();
        }
      });
    }

    return { open: openPalette, close: () => closePalette(true) };
  };

  /* --- 11. Specular Cursor Spotlight Engine --- */
  window.initSpecularSpotlight = function() {
    const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || isReduced) return;

    const cards = document.querySelectorAll('.case-card, .venture-card, .stat-card');
    cards.forEach(card => {
      if (card.dataset.spotBound) return;
      card.dataset.spotBound = 'true';
      let rafPending = false;
      let nextX = '50%';
      let nextY = '50%';

      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        nextX = (e.clientX - rect.left).toFixed(1) + 'px';
        nextY = (e.clientY - rect.top).toFixed(1) + 'px';
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(() => {
            card.style.setProperty('--spot-x', nextX);
            card.style.setProperty('--spot-y', nextY);
            rafPending = false;
          });
        }
      }, { passive: true });
    });

    const portraitCard = document.querySelector('.hero-portrait-card');
    if (portraitCard && !portraitCard.dataset.tiltBound) {
      portraitCard.dataset.tiltBound = 'true';
      portraitCard.addEventListener('pointermove', (e) => {
        const rect = portraitCard.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) - 0.5;
        const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) - 0.5;
        portraitCard.style.setProperty('--pt-rx', (-ny * 6).toFixed(2) + 'deg');
        portraitCard.style.setProperty('--pt-ry', (nx * 7).toFixed(2) + 'deg');
        portraitCard.style.setProperty('--pt-gx', (50 + nx * 50).toFixed(1) + '%');
        portraitCard.style.setProperty('--pt-gy', (50 + ny * 50).toFixed(1) + '%');
      }, { passive: true });
      portraitCard.addEventListener('pointerleave', () => {
        portraitCard.style.setProperty('--pt-rx', '0deg');
        portraitCard.style.setProperty('--pt-ry', '0deg');
        portraitCard.style.setProperty('--pt-gx', '50%');
        portraitCard.style.setProperty('--pt-gy', '30%');
      });
    }
  };

  window.initInstrumentTabsAndPipeline = function() {
    // Segmented Brief/Role Console Tabs inside primary competition cards
    document.querySelectorAll('.fr-card').forEach(card => {
      const tabBar = card.querySelector('.fr-pillar-tabs');
      if (!tabBar || card.dataset.tabsBound) return;
      card.dataset.tabsBound = 'true';
      card.classList.add('fr-tabs-ready');
      const tabs = tabBar.querySelectorAll('.fr-pillar-tab');
      const panels = card.querySelectorAll('.fr-pillar[data-fr-panel]');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-fr-tab');
          tabs.forEach(t => {
            const active = t.getAttribute('data-fr-tab') === target;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          panels.forEach(p => {
            p.classList.toggle('is-tab-active', p.getAttribute('data-fr-panel') === target);
          });
        });
      });
    });

    // Venture System Pipeline Strip quick-jump + spotlight pulse
    const isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.vn-pipe-node[data-jump-venture]').forEach(btn => {
      if (btn.dataset.pipeBound) return;
      btn.dataset.pipeBound = 'true';
      btn.addEventListener('click', () => {
        const vid = btn.getAttribute('data-jump-venture');
        const targetCard = document.querySelector('.venture-card[data-venture-id="' + vid + '"]');
        if (!targetCard) return;
        targetCard.scrollIntoView({ behavior: isReduced ? 'auto' : 'smooth', block: 'center' });
        targetCard.classList.remove('is-highlighted');
        void targetCard.offsetWidth;
        targetCard.classList.add('is-highlighted');
        setTimeout(() => targetCard.classList.remove('is-highlighted'), 1600);
      });
    });
  };


/* SHARED DOMAIN ENGINES (KramaMath + TathyaTokenizer) */
/**
 * ============================================================================
 * KRAMA ATTENDANCE RECOVERY CALCULUS — SHARED DOMAIN MODULE
 * Single pure calculation engine powering UI widgets, CLI, & unit tests.
 * ============================================================================
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KramaMath = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Computes attendance percentage (0..100).
   * @param {number} attended
   * @param {number} total
   * @returns {number}
   */
  function calculatePercentage(attended, total) {
    if (!Number.isInteger(attended) || !Number.isInteger(total) || attended < 0 || total <= 0 || attended > total) {
      throw new Error('Invalid attendance inputs');
    }
    return (attended / total) * 100;
  }

  /**
   * Computes exact consecutive classes required to reach target ratio (default 0.75).
   * Formula: ceil((target * total - attended) / (1 - target))
   * Example: (17, 25, 0.75) -> 7 (24 / 32 = 75.0%)
   * @param {number} attended
   * @param {number} total
   * @param {number} [target=0.75]
   * @returns {number}
   */
  function classesToRecover(attended, total, target) {
    var tgt = typeof target === 'number' ? target : 0.75;
    if (
      !Number.isInteger(attended) ||
      !Number.isInteger(total) ||
      attended < 0 ||
      total <= 0 ||
      attended > total ||
      !(tgt > 0 && tgt < 1)
    ) {
      throw new Error('Invalid attendance inputs');
    }
    if (attended / total >= tgt) {
      return 0;
    }
    return Math.ceil((tgt * total - attended - 1e-12) / (1 - tgt));
  }

  /**
   * Computes maximum consecutive classes that can be missed while remaining >= target.
   * @param {number} attended
   * @param {number} total
   * @param {number} [target=0.75]
   * @returns {number}
   */
  function safeSkipBuffer(attended, total, target) {
    var tgt = typeof target === 'number' ? target : 0.75;
    if (
      !Number.isInteger(attended) ||
      !Number.isInteger(total) ||
      attended < 0 ||
      total <= 0 ||
      attended > total ||
      !(tgt > 0 && tgt < 1)
    ) {
      throw new Error('Invalid attendance inputs');
    }
    if (attended / total < tgt) {
      return 0;
    }
    return Math.max(0, Math.floor((attended - tgt * total + 1e-12) / tgt));
  }

  /**
   * Returns complete structured status & plain-English advice for Krama UI / CLI.
   * @param {number} attended
   * @param {number} total
   * @param {number} [target=0.75]
   */
  function analyzeAttendance(attended, total, target) {
    var tgt = typeof target === 'number' ? target : 0.75;
    var percentage = calculatePercentage(attended, total);
    var recoveryNeeded = classesToRecover(attended, total, tgt);
    var skipBuffer = safeSkipBuffer(attended, total, tgt);
    var targetPctLabel = (tgt * 100).toFixed(1) + '%';

    var advice;
    if (recoveryNeeded > 0) {
      advice = 'Attend next ' + recoveryNeeded + ' consecutive class' + (recoveryNeeded === 1 ? '' : 'es') + ' to recover ' + targetPctLabel + '.';
    } else if (skipBuffer > 0) {
      advice = 'Safe buffer: can skip ' + skipBuffer + ' class' + (skipBuffer === 1 ? '' : 'es') + ' while staying ≥' + targetPctLabel + '.';
    } else {
      advice = 'On ' + targetPctLabel + ' threshold — attend next class to build margin.';
    }

    return {
      attended: attended,
      total: total,
      target: tgt,
      percentage: percentage,
      percentageFormatted: percentage.toFixed(1) + '%',
      isEligible: percentage >= tgt * 100 - 1e-9,
      recoveryNeeded: recoveryNeeded,
      skipBuffer: skipBuffer,
      advice: advice
    };
  }

  return {
    calculatePercentage: calculatePercentage,
    classesToRecover: classesToRecover,
    safeSkipBuffer: safeSkipBuffer,
    analyzeAttendance: analyzeAttendance
  };
}));

/**
 * ============================================================================
 * TATHYA REFERENCE BYTE-LEVEL BPE & GRAPHEME MICROSCOPE (v0.2 Client-Side)
 * ============================================================================
 * Honest, deterministic, lossless UTF-8 Byte-Pair Encoding implementation.
 * Token IDs 0..255 = raw UTF-8 bytes (byte-level fallback).
 * Token IDs 256+   = formal Manak Hindi (Devanagari) & Latin vocabulary stems
 *                    showing algorithmically why standard web-Hindi vocabularies
 *                    merge formal Hindi cleanly while fracturing colloquial
 *                    Haryanvi/Bhojpuri markers and Gurmukhi into byte/subword pieces.
 * Separately measures Token Count, Token IDs, Grapheme Clusters, & UTF-8 Bytes.
 * ============================================================================
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TathyaTokenizer = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function utf8Encode(str) {
    if (typeof TextEncoder !== 'undefined') {
      return Array.from(new TextEncoder().encode(str));
    }
    if (typeof Buffer !== 'undefined') {
      return Array.from(Buffer.from(str, 'utf8'));
    }
    var utf8 = unescape(encodeURIComponent(str));
    var out = [];
    for (var i = 0; i < utf8.length; i++) {
      out.push(utf8.charCodeAt(i));
    }
    return out;
  }

  function utf8Decode(bytes) {
    if (typeof TextDecoder !== 'undefined') {
      try {
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
      } catch (e) {}
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('utf8');
    }
    return bytes.map(function (b) { return String.fromCharCode(b); }).join('');
  }

  function countGraphemes(str) {
    var input = String(str || '');
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      try {
        var seg = new Intl.Segmenter('hi', { granularity: 'grapheme' });
        var n = 0;
        var it = seg.segment(input)[Symbol.iterator]();
        while (!it.next().done) n++;
        return n;
      } catch (e) {}
    }
    return Array.from(input).length;
  }

  // Build ordered BPE vocabulary (0..255 raw bytes, 256+ UTF-8 character/word merges).
  // Formal Manak Hindi / common civic stems appear at high frequency rank (lower ID).
  // No raw Gurmukhi or regional colloquial words ('म्हारी', 'सैं', 'खातिर', 'कवन', 'चाहीं', 'ਪਰਚੀ')
  // are added as whole-word merges, mimicking a Manak-Hindi/Web-corpus biased BPE model.
  var CORPUS_MERGE_TERMS = [
    // Core Devanagari matras / common syllables & frequent Manak Hindi civic corpus tokens
    'क', 'र', 'स', 'म', 'न', 'त', 'ल', 'प', 'ह', 'व', 'य', 'ज', 'द', 'ग', 'ब', 'च', 'त', 'श',
    'ा', 'ी', 'ि', 'े', 'ो', 'ु', 'ू', 'ै', 'ं', '्', '?', ' ',
    'का', 'के', 'की', 'को', 'में', 'से', 'ने', 'पर', 'है', 'हैं', 'और', 'यह', 'वह', 'क्या', 'कैसे',
    'लिए', 'के लिए', 'हम', 'हमारी', 'सरकार', 'लाडो', 'योजना', 'लाभ', 'फायदे',
    'सरकारी', 'अस्पताल', 'पर्ची', 'कटवाने', 'तरीका', 'राशन', 'कार्ड', 'बनवाने',
    'कौन', 'कौन-कौन', 'दस्तावेज', 'चाहिए', 'स्वास्थ्य', 'आवेदन', 'जिला', 'मंजूरी',
    'अधिकारी', 'नागरिक', 'सेवा', 'पोर्टल', 'खाता', 'पंजीकरण', 'सत्यापन',
    // Common ASCII/English tokens so mixed queries work cleanly
    'the', 'is', 'for', 'and', 'in', 'to', 'of', 'with', 'status', 'check', 'LLM', 'eval'
  ];

  function buildVocab() {
    var merges = []; // { leftId, rightId, newId, bytes }
    var pairRank = Object.create(null); // "leftId:rightId" -> { rank, newId }
    var idToBytes = [];
    var termToId = Object.create(null);

    for (var b = 0; b < 256; b++) {
      idToBytes[b] = [b];
    }

    var nextId = 256;
    function internMerge(leftId, rightId) {
      var key = leftId + ':' + rightId;
      if (pairRank[key]) return pairRank[key].newId;
      var newId = nextId++;
      var mergedBytes = idToBytes[leftId].concat(idToBytes[rightId]);
      idToBytes[newId] = mergedBytes;
      var rank = merges.length;
      merges.push({ leftId: leftId, rightId: rightId, newId: newId, bytes: mergedBytes });
      pairRank[key] = { rank: rank, newId: newId };
      return newId;
    }

    // Deduplicate terms cleanly and train sequential merges left-to-right per term
    var seen = Object.create(null);
    for (var i = 0; i < CORPUS_MERGE_TERMS.length; i++) {
      var term = CORPUS_MERGE_TERMS[i];
      if (!term || seen[term]) continue;
      seen[term] = true;
      var seq = utf8Encode(term);
      // Apply already-learned merges first so compound words merge into existing subwords
      seq = applyLearnedMerges(seq, pairRank);
      while (seq.length > 1) {
        var mergedId = internMerge(seq[0], seq[1]);
        seq = [mergedId].concat(seq.slice(2));
        if (seq.length > 1) {
          seq = applyLearnedMerges(seq, pairRank);
        }
      }
      if (seq.length === 1) {
        termToId[term] = seq[0];
      }
    }

    return {
      idToBytes: idToBytes,
      pairRank: pairRank,
      mergesCount: merges.length,
      vocabSize: nextId
    };
  }

  function applyLearnedMerges(ids, pairRank) {
    var seq = ids.slice();
    while (seq.length >= 2) {
      var bestRank = Infinity;
      var bestIdx = -1;
      var bestNewId = -1;
      for (var i = 0; i < seq.length - 1; i++) {
        var key = seq[i] + ':' + seq[i + 1];
        var entry = pairRank[key];
        if (entry && entry.rank < bestRank) {
          bestRank = entry.rank;
          bestIdx = i;
          bestNewId = entry.newId;
        }
      }
      if (bestIdx === -1) break;
      var nextSeq = [];
      for (var j = 0; j < seq.length; j++) {
        if (j === bestIdx) {
          nextSeq.push(bestNewId);
          j++; // skip j+1
        } else {
          nextSeq.push(seq[j]);
        }
      }
      seq = nextSeq;
    }
    return seq;
  }

  var VOCAB = buildVocab();

  /**
   * Splits input text along whitespace/punctuation pre-token chunks (preserving spaces & order)
   * then applies Byte-Level BPE over each chunk's UTF-8 bytes so spaces never merge across words
   * unless explicitly present in vocabulary (like "के लिए").
   */
  function pretokenize(text) {
    var str = String(text || '');
    if (!str) return [];
    // Keep exact substring losslessly by separating whitespace runs and non-whitespace tokens
    var parts = str.match(/\s+|[^\s?।!.,;:]+|[?।!.,;:]+/g);
    return parts || [str];
  }

  function formatHexBytes(bytes) {
    return bytes.map(function (b) {
      return (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
    }).join(' ');
  }

  /**
   * Encodes arbitrary string into real BPE tokens + separate byte & grapheme telemetry.
   * @param {string} inputText
   */
  function encode(inputText) {
    var text = String(inputText || '');
    var rawBytesAll = utf8Encode(text);
    var chunks = pretokenize(text);
    var tokenIds = [];
    var tokens = [];
    var byteFallbackCount = 0;

    for (var c = 0; c < chunks.length; c++) {
      var chunkStr = chunks[c];
      // Preserve single space tokens cleanly without displaying empty boxes
      var rawBytes = utf8Encode(chunkStr);
      var mergedIds = applyLearnedMerges(rawBytes, VOCAB.pairRank);

      for (var m = 0; m < mergedIds.length; m++) {
        var tid = mergedIds[m];
        var tBytes = VOCAB.idToBytes[tid];
        var decoded = utf8Decode(tBytes);
        var isWhitespace = /^\s+$/.test(chunkStr);
        var isRawByte = !isWhitespace && tid < 256 && tBytes[0] >= 0x80;
        if (isRawByte) {
          byteFallbackCount++;
        }
        var isMultiPiece = !isWhitespace && mergedIds.length > 1;
        var isFragmented = isRawByte || isMultiPiece || decoded.indexOf('\uFFFD') !== -1;
        var displayText = decoded === ' ' ? '␠' : (decoded.indexOf('\uFFFD') !== -1 ? '<0x' + formatHexBytes(tBytes) + '>' : decoded);

        tokenIds.push(tid);
        tokens.push({
          id: tid,
          text: displayText,
          rawText: decoded,
          hexBytes: formatHexBytes(tBytes),
          byteLength: tBytes.length,
          isByteFallback: isRawByte,
          isFragmented: isFragmented,
          isWhitespace: isWhitespace
        });
      }
    }

    var tokenCount = tokenIds.length;
    var utf8Bytes = rawBytesAll.length;
    var graphemeCount = countGraphemes(text);

    return {
      engine: 'tathya-bpe-v0.2',
      vocabSize: VOCAB.vocabSize,
      text: text,
      tokens: tokens,
      tokenIds: tokenIds,
      tokenCount: tokenCount,
      graphemeCount: graphemeCount,
      utf8Bytes: utf8Bytes,
      hexBytePreview: formatHexBytes(rawBytesAll.slice(0, 12)) + (rawBytesAll.length > 12 ? ' …' : ''),
      byteFallbackCount: byteFallbackCount,
      bytesPerToken: tokenCount > 0 ? Number((utf8Bytes / tokenCount).toFixed(2)) : 0
    };
  }

  /**
   * Decodes token IDs back to exact UTF-8 string (proves lossless bijection).
   * @param {number[]} tokenIds
   */
  function decode(tokenIds) {
    var allBytes = [];
    for (var i = 0; i < tokenIds.length; i++) {
      var b = VOCAB.idToBytes[tokenIds[i]];
      if (b) {
        for (var j = 0; j < b.length; j++) allBytes.push(b[j]);
      }
    }
    return utf8Decode(allBytes);
  }

  return {
    engine: 'tathya-bpe-v0.2',
    vocabSize: VOCAB.vocabSize,
    mergesCount: VOCAB.mergesCount,
    utf8Encode: utf8Encode,
    countGraphemes: countGraphemes,
    encode: encode,
    decode: decode
  };
}));

/* TATHYA LLM FAILURE EXPLORER SCRIPT */
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

      var dieSerialEl = document.getElementById('tfe-die-serial');
      var dieRatioEl = document.getElementById('tfe-die-ratio');
      var dieTokensEl = document.getElementById('tfe-die-tokens');
      var dieBytesEl = document.getElementById('tfe-die-bytes');
      if (dieSerialEl) dieSerialEl.textContent = 'SPEC // ' + currentDialect.toUpperCase();
      if (dieRatioEl) dieRatioEl.textContent = (diaEnc.tokenCount / Math.max(1, stdEnc.tokenCount)).toFixed(2) + '×';
      if (dieTokensEl) dieTokensEl.textContent = diaEnc.tokenCount + ' TOK';
      if (dieBytesEl) dieBytesEl.textContent = diaEnc.utf8Bytes + ' B';

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

      var cartridge = document.getElementById('tfe-specimen-cartridge');
      if (cartridge) {
        cartridge.classList.remove('is-docking');
        void cartridge.offsetWidth;
        cartridge.classList.add('is-docking');
      }

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

    var cartridgeEl = document.getElementById('tfe-specimen-cartridge');
    if (cartridgeEl && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cartridgeEl.addEventListener('pointermove', function (e) {
        var rect = cartridgeEl.getBoundingClientRect();
        var nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) - 0.5;
        var ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) - 0.5;
        cartridgeEl.style.setProperty('--die-rx', (-ny * 10).toFixed(2) + 'deg');
        cartridgeEl.style.setProperty('--die-ry', (nx * 12).toFixed(2) + 'deg');
      });
      cartridgeEl.addEventListener('pointerleave', function () {
        cartridgeEl.style.setProperty('--die-rx', '0deg');
        cartridgeEl.style.setProperty('--die-ry', '0deg');
      });
    }

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


  /* --- 12. Orchestrated Bootstrap --- */
(function() {
  function bootstrapPortfolioV2() {
    const content = window.__PORTFOLIO_CONTENT__;
    if (typeof window.initSEOAndSchema === 'function') {
      window.initSEOAndSchema(content);
    }
    if (typeof window.initAdaptiveCanvas === 'function') {
      window.__CANVAS_CONTROLLER = window.initAdaptiveCanvas();
    }
    if (typeof window.initRecruiterMode === 'function') {
      window.initRecruiterMode(content);
    }
    if (typeof window.initAboutSection === 'function') {
      window.initAboutSection(content);
    }
    if (typeof window.initFieldRecordProof === 'function') {
      window.__FIELD_RECORD_PROOF = window.initFieldRecordProof(content);
    }
    if (typeof window.initCaseStudyDeepDives === 'function') {
      window.initCaseStudyDeepDives(content);
    }
    if (typeof window.initTelemetryModal === 'function') {
      window.__TELEMETRY_MODAL = window.initTelemetryModal(content);
    }
    if (typeof window.initVentureInteractives === 'function') {
      window.initVentureInteractives(content);
    }
    if (typeof window.initCommandPalette === 'function') {
      window.__CMD_PALETTE = window.initCommandPalette(content);
    }
    if (typeof window.initSpecularSpotlight === 'function') {
      window.initSpecularSpotlight();
    }
    if (typeof window.initInstrumentTabsAndPipeline === 'function') {
      window.initInstrumentTabsAndPipeline();
    }
    if (typeof window.initTathyaExplorer === 'function') {
      window.__TATHYA_EXPLORER = window.initTathyaExplorer();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapPortfolioV2);
  } else {
    bootstrapPortfolioV2();
  }
})();