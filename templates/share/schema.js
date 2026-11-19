/**
 * ============================================================================
 * templates/share/schema.js
 * Generates Schema.org JSON-LD (Person, WebSite, ItemLists)
 * strictly from content/content.json.
 * ============================================================================
 */

const { getCanonicalUrl, getDeploymentDomain } = require('./config');

/**
 * Builds the complete Schema.org JSON-LD graph object strictly from verified facts.
 *
 * @param {Object} content - Canonical content from content/content.json
 * @returns {Object} JSON-LD object with @context and @graph
 */
function buildSchemaGraph(content) {
  const p = (content && content.personal) || {};
  const m = (content && content.meta) || {};
  const h = (content && content.hero) || {};
  const domain = getDeploymentDomain(content) + '/';

  const portraitPath = (h.portrait && h.portrait.path)
    ? h.portrait.path.replace(/^\/+/, '')
    : 'assets/rudra-pitch-portrait.jpg';
  const portraitUrl = getCanonicalUrl(content, portraitPath);

  // Filter verified social links strictly (no "TBD" values)
  const sameAs = [p.linkedin, p.github, p.twitter].filter(
    url => url && typeof url === 'string' && url.trim() !== '' && url !== 'TBD'
  );

  // 1. WebSite Node
  const websiteNode = {
    "@type": "WebSite",
    "@id": `${domain}#website`,
    "url": domain,
    "name": `${p.name} — ${p.headline}`,
    "description": m.description || p.bio_statement,
    "inLanguage": "en-US",
    "publisher": {
      "@id": `${domain}#person`
    }
  };

  // 2. Person Node
  const personNode = {
    "@type": "Person",
    "@id": `${domain}#person`,
    "name": p.name,
    "givenName": p.name ? p.name.split(' ')[0] : 'Rudra',
    "familyName": p.name ? p.name.split(' ').slice(1).join(' ') : 'Sharma',
    "headline": p.headline,
    "description": p.bio_statement,
    "url": domain,
    "email": p.email && p.email !== 'TBD' ? `mailto:${p.email}` : undefined,
    "image": portraitUrl,
    "sameAs": sameAs,
    "alumniOf": p.institution && p.institution !== 'TBD' ? {
      "@type": "CollegeOrUniversity",
      "name": p.institution
    } : undefined,
    "affiliation": p.institution && p.institution !== 'TBD' ? {
      "@type": "CollegeOrUniversity",
      "name": p.institution
    } : undefined
  };

  if (p.degree && p.degree !== 'TBD') {
    personNode.hasCredential = [
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "degree",
        "name": p.degree,
        "recognizedBy": {
          "@type": "CollegeOrUniversity",
          "name": p.institution || "Rishihood University"
        }
      }
    ];
  }

  // 3. ItemList for Verified Competitions
  const comps = Array.isArray(content.competitions) ? content.competitions : [];
  const competitionListNode = {
    "@type": "ItemList",
    "@id": `${domain}#competitions`,
    "name": "Verified Competition Accomplishments & Podiums",
    "description": `Audited competition record and performance telemetry for ${p.name} across national and collegiate competitions.`,
    "numberOfItems": comps.length,
    "itemListElement": comps.map((comp, idx) => {
      const award = {
        "@type": "Award",
        "name": `${comp.placement} — ${comp.title}`,
        "description": comp.field_context || (comp.story && comp.story.result) || comp.title,
        "provider": comp.host && comp.host !== 'TBD' ? {
          "@type": "CollegeOrUniversity",
          "name": comp.host
        } : undefined,
        "location": comp.event ? `${comp.host} · ${comp.event}` : comp.host,
        "startDate": comp.date !== 'TBD' ? comp.date : undefined,
        "url": `${domain}#competitions`
      };

      if (comp.evidence_url && comp.evidence_url !== 'TBD') {
        award.image = getCanonicalUrl(content, comp.evidence_url);
      }

      return {
        "@type": "ListItem",
        "position": idx + 1,
        "name": `${comp.placement} — ${comp.title}`,
        "item": award
      };
    })
  };

  // 4. ItemList for Software Ventures & Systems
  const vens = Array.isArray(content.ventures) ? content.ventures : [];
  const ventureListNode = {
    "@type": "ItemList",
    "@id": `${domain}#ventures`,
    "name": "Ventures & Software Systems",
    "description": `Software products, simulation engines, and AI research ventures initiated and engineered by ${p.name}.`,
    "numberOfItems": vens.length,
    "itemListElement": vens.map((ven, idx) => {
      const isResearch = (ven.category && ven.category.includes('RESEARCH')) || ven.status === 'idea';
      const item = {
        "@type": isResearch ? "ResearchProject" : "SoftwareApplication",
        "name": ven.name,
        "description": ven.thesis || ven.problem || ven.name,
        "url": `${domain}#ventures`
      };

      if (!isResearch) {
        if (ven.category && ven.category.includes('DESKTOP')) {
          item.applicationCategory = "DeveloperApplication";
          item.operatingSystem = "Desktop OS";
        } else if (ven.category && ven.category.includes('SAAS')) {
          item.applicationCategory = "BusinessApplication";
        } else {
          item.applicationCategory = "EducationalApplication";
        }
      }

      return {
        "@type": "ListItem",
        "position": idx + 1,
        "name": ven.name,
        "item": item
      };
    })
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
 * Renders the HTML <script> tag for embedding inside <head>.
 *
 * @param {Object} content - Canonical content from content/content.json
 * @returns {string} HTML script tag with JSON-LD
 */
function renderJsonLd(content) {
  const schemaObj = buildSchemaGraph(content);
  return `  <script type="application/ld+json" class="seo-schema-script">\n${JSON.stringify(schemaObj, null, 2)}\n  </script>`;
}

module.exports = {
  buildSchemaGraph,
  renderJsonLd
};
