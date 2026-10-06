/* Cookie consent (Google Consent Mode v2, basic mode: tags load only after consent), plus small
   media helpers: YouTube facades, lazy map frames, gallery lightbox, FAQ filter, auto-submit filters. */
(function () {
  'use strict';
  var MH = window.MH; if (!MH) return;
  var $ = MH.$, $$ = MH.$$, body = document.body;
  var KEY = 'mh_consent', gtmId = body.getAttribute('data-gtm') || '', notice = body.getAttribute('data-notice') || '';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  var loaded = false;
  function apply(c) {
    gtag('consent', 'update', { analytics_storage: c.a ? 'granted' : 'denied', ad_storage: c.d ? 'granted' : 'denied',
      ad_user_data: c.d ? 'granted' : 'denied', ad_personalization: c.d ? 'granted' : 'denied' });
    if ((c.a || c.d) && gtmId && /^GTM-[A-Z0-9]+$/.test(gtmId) && !loaded) {
      loaded = true;
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + gtmId;
      document.head.appendChild(s);
    }
  }
  var banner = $('#cookie-banner');
  function save(a, d) {
    var prev = MH.store.get(KEY) || {}, c = { a: !!a, d: !!d, v: notice, id: prev.id || uuid(), ts: Date.now() };
    MH.store.set(KEY, c);
    MH.postJSON(MH.API + '/consent', { visitor_id: c.id, analytics: c.a, ads: c.d, notice_version: notice || null, page_path: location.pathname }, true).catch(function () {});
    if (banner) banner.hidden = true;
    apply(c);
  }
  var current = MH.store.get(KEY);
  if (current && current.v === notice) apply(current); else if (banner) banner.hidden = false;
  if (banner) {
    $('[data-consent-accept]', banner).addEventListener('click', function () { save(true, true); });
    $('[data-consent-reject]', banner).addEventListener('click', function () { save(false, false); });
    $('[data-consent-save]', banner).addEventListener('click', function () {
      save($('[data-consent=analytics]', banner).checked, $('[data-consent=ads]', banner).checked);
    });
  }
  $$('[data-cookie-settings]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); if (!banner) return;
      var c = MH.store.get(KEY) || {};
      $('[data-consent=analytics]', banner).checked = !!c.a; $('[data-consent=ads]', banner).checked = !!c.d;
      banner.hidden = false;
    });
  });

  /* ---------- YouTube facades (no iframe, no cookies until clicked) ---------- */
  $$('[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-yt'); if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.title = b.getAttribute('aria-label') || 'Video'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
      b.replaceWith(f);
    });
  });

  /* ---------- lazy map frame on the contact page ---------- */
  $$('[data-load-frame]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var host = btn.closest('[data-lazy-frame]'), f = document.createElement('iframe');
      f.src = host.getAttribute('data-lazy-frame'); f.title = host.getAttribute('data-title') || 'Map'; f.loading = 'lazy';
      host.innerHTML = ''; host.appendChild(f);
    });
  });

  /* ---------- gallery lightbox ---------- */
  var lb = $('#lightbox');
  if (lb) $$('[data-lightbox]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); var img = $('[data-lightbox-img]', lb), src = $('img', a);
      img.src = a.getAttribute('href'); img.alt = src ? src.alt : ''; MH.openDialog(lb);
    });
  });

  /* ---------- FAQ filter ---------- */
  $$('[data-faq-filter]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      $$('.faq').forEach(function (d) { d.hidden = q && d.textContent.toLowerCase().indexOf(q) < 0; });
      $$('.faq-group').forEach(function (g) { g.hidden = !$$('.faq', g).some(function (d) { return !d.hidden; }); });
    });
  });

  /* ---------- filters: changing the state reloads its city list ---------- */
  $$('form[data-autosubmit]').forEach(function (f) {
    var st = f.querySelector('select[name=state]');
    if (st) st.addEventListener('change', function () { var c = f.querySelector('select[name=city]'); if (c) c.value = ''; f.submit(); });
  });
})();
