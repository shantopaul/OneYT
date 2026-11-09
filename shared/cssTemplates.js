/* OneYT — shared/cssTemplates.js
 *
 * Custom CSS templates (Phase 20, PL-20). Pure: no
 * chrome.*, no DOM — unit tests can run it in Node.
 *
 * A template is a ready-made CSS snippet that does
 * something no setting does. Applying one appends its
 * CSS to the user's Custom CSS text under a marker
 * comment, so applying the same template twice is a
 * no-op and the block is easy to find (and delete) in
 * the Custom CSS box. Templates write into the existing
 * `appearance.customCSS` setting — the appearance
 * module then applies them through the validated
 * custom-CSS path, so there is no content-script change
 * and no new permission here.
 *
 * Why the template CSS uses raw YouTube selectors
 * instead of shared/selectors.js keys: template CSS is
 * user-CSS-shaped data (exactly what a user could type
 * into the Custom CSS box themselves), not module query
 * code — and the selector audit in
 * tests/selectors.test.js scans `content/` only, so
 * these strings never trip it. The selectors are still
 * sourced, not guessed: voice search from 3+
 * independent userstyles + a uBlock filter list, the
 * channel banner from the YouTube Custom UI Cleaner
 * userstyle, the rest from widely used userstyle
 * snippets. They are YouTube DOM hooks all the same —
 * if YouTube renames one, that template silently does
 * nothing, and the manual checklist asks for the live
 * check on a real YouTube page.
 */
(function () {
  'use strict';

  // Ready-made templates. `css` is one rule block (or two
  // for the watched-fade, home + compact rows) — each
  // passes validators.validateCustomCSS (asserted in
  // tests/cssTemplates.test.js).
  var CSS_TEMPLATES = [
    {
      id: 'hide-duration-badges',
      name: 'Hide duration badges',
      description: 'Hides the length badge (e.g. 12:34) on video thumbnails.',
      css: 'ytd-thumbnail-overlay-time-status-renderer { display: none !important; }',
    },
    {
      id: 'fade-watched-videos',
      name: 'Fade watched videos',
      description: 'Videos you already started watching look faded in the home feed and Up next.',
      css:
        'ytd-rich-item-renderer:has(ytd-thumbnail-overlay-resume-playback-renderer), ' +
        'ytd-compact-video-renderer:has(ytd-thumbnail-overlay-resume-playback-renderer) { opacity: 0.45; }',
    },
    {
      id: 'hide-video-badges',
      name: 'Hide video badges',
      description: 'Hides the "New", "LIVE" and "4K" badges on video thumbnails.',
      css: 'ytd-badge-supported-renderer { display: none !important; }',
    },
    {
      id: 'hide-home-metadata',
      name: 'Hide home metadata',
      description: 'Hides the views and age line under video titles on the home feed.',
      css: 'ytd-rich-item-renderer #metadata-line { display: none !important; }',
    },
    {
      id: 'hide-voice-search',
      name: 'Hide voice search',
      description: 'Hides the microphone (voice search) button next to the search box.',
      css: 'ytd-masthead #voice-search-button { display: none !important; }',
    },
    {
      id: 'hide-channel-banner',
      name: 'Hide channel banner',
      description: 'Hides the banner art at the top of channel pages.',
      css: '.banner-visible-area { display: none !important; height: 0 !important; }',
    },
  ];

  function templateMarker(id) {
    return '/* OneYT template: ' + id + ' */';
  }

  function getCssTemplate(id) {
    for (var i = 0; i < CSS_TEMPLATES.length; i++) {
      if (CSS_TEMPLATES[i].id === id) return CSS_TEMPLATES[i];
    }
    return null;
  }

  function listCssTemplates() {
    return CSS_TEMPLATES.slice();
  }

  // True when the template's marker comment is already in
  // the Custom CSS text — i.e. the template is applied.
  function isCssTemplateApplied(currentCss, templateId) {
    if (typeof currentCss !== 'string') return false;
    if (!getCssTemplate(templateId)) return false;
    return currentCss.indexOf(templateMarker(templateId)) !== -1;
  }

  // Apply a template to the current Custom CSS text.
  // Returns { css, applied, alreadyApplied }:
  // - unknown id → the text back, unchanged.
  // - already applied → the text back, unchanged.
  // - otherwise → the template block appended under its
  //   marker comment (blank line between blocks), and
  //   `applied` true. The input is never mutated.
  function applyCssTemplate(currentCss, templateId) {
    var template = getCssTemplate(templateId);
    var current = typeof currentCss === 'string' ? currentCss : '';
    if (!template) return { css: current, applied: false, alreadyApplied: false };
    if (isCssTemplateApplied(current, templateId)) {
      return { css: current, applied: false, alreadyApplied: true };
    }
    var block = templateMarker(template.id) + '\n' + template.css;
    var css = current.trim() ? current.replace(/\s+$/, '') + '\n\n' + block : block;
    return { css: css, applied: true, alreadyApplied: false };
  }

  var api = {
    CSS_TEMPLATES: CSS_TEMPLATES,
    templateMarker: templateMarker,
    getCssTemplate: getCssTemplate,
    listCssTemplates: listCssTemplates,
    isCssTemplateApplied: isCssTemplateApplied,
    applyCssTemplate: applyCssTemplate,
  };

  var ns = (globalThis.OneYT = globalThis.OneYT || {});
  ns.cssTemplates = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
