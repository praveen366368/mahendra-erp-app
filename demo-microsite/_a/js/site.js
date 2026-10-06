/* Mahendra's public site - progressive enhancement only; every page works without JS.
   No personal data is ever written to the console or to storage. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;
  var API = '/api/v1/public';
  var store = {
    get: function (k, s) { try { return JSON.parse((s ? sessionStorage : localStorage).getItem(k)); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  function getJSON(url) { return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw r; return r.json(); }); }
  function postJSON(url, data, keep) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data), keepalive: !!keep });
  }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  /* Hindi pages (?lang=hi): the enquiry form's own messages in Hindi too. */
  var HINDI = document.documentElement.lang === 'hi-IN';
  function L(en, hi) { return HINDI ? hi : en; }
  window.dataLayer = window.dataLayer || [];

  /* ---------- campaign attribution (whitelisted keys only) ---------- */
  var KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  (function () {
    var qs = new URLSearchParams(location.search), found = {}, any = false;
    KEYS.forEach(function (k) { var v = qs.get(k); if (v) { found[k] = v.slice(0, 150); any = true; } });
    if (any) store.set('mh_utm', found, true);
    if (!store.get('mh_ref', true) && document.referrer && document.referrer.indexOf(location.host) < 0) store.set('mh_ref', document.referrer.slice(0, 480), true);
  })();
  function attribution() { return store.get('mh_utm', true) || {}; }

  /* ---------- menu ---------- */
  var menuBtn = $('.menu-btn'), nav = $('#site-nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- open now, recomputed in IST (pages are edge-cached) ---------- */
  var DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  function ist() {
    var p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday);
    return { date: p.year + '-' + p.month + '-' + p.day, min: (+p.hour % 24) * 60 + (+p.minute), wd: wd };
  }
  function toMin(t) { var a = t.split(':'); return (+a[0]) * 60 + (+a[1]); }
  function fmt(m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
  function addDays(d, n) { var x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function periods(h, date, wd) { return (h.s && h.s[date]) ? h.s[date] : (h.r[DAYS[wd]] || []); }
  function openLabel(h) {
    if (h.st === 'permanently_closed') return [false, 'Permanently closed'];
    if (h.st === 'temporarily_closed') return [false, 'Temporarily closed'];
    var now = ist(), today = periods(h, now.date, now.wd), i, p;
    if (!DAYS.some(function (d) { return (h.r[d] || []).length; }) && !Object.keys(h.s || {}).length) return [null, 'Call for timings'];
    for (i = 0; i < today.length; i++) { p = today[i]; if (now.min >= toMin(p[0]) && now.min < toMin(p[1])) return [true, 'Open now · closes ' + fmt(toMin(p[1]))]; }
    for (i = 0; i < today.length; i++) { p = today[i]; if (now.min < toMin(p[0])) return [false, 'Closed · opens ' + fmt(toMin(p[0]))]; }
    for (i = 1; i < 8; i++) {
      var d = addDays(now.date, i), w = (now.wd + i) % 7, nx = periods(h, d, w);
      if (nx.length) return [false, 'Closed · opens ' + (i === 1 ? 'tomorrow' : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][w]) + ' ' + fmt(toMin(nx[0][0]))];
    }
    return [false, 'Closed'];
  }
  $$('[data-hours]').forEach(function (el) {
    try {
      var r = openLabel(JSON.parse(el.getAttribute('data-hours')));
      el.textContent = r[1]; el.classList.remove('is-open', 'is-closed', 'is-unknown');
      el.classList.add(r[0] === true ? 'is-open' : r[0] === false ? 'is-closed' : 'is-unknown');
    } catch (e) { /* keep server label */ }
  });

  /* ---------- click tracking (first-party + GTM) ---------- */
  function track(type, el) {
    var a = attribution();
    postJSON(API + '/events', { event_type: type, branch_id: el.getAttribute('data-branch') || body.getAttribute('data-branch') || null,
      batch_id: el.getAttribute('data-batch') || null, course_id: el.getAttribute('data-course') || null,
      page_type: (body.getAttribute('data-page') || '').replace(/[^a-z_]/g, '').slice(0, 40) || null,
      utm_source: a.utm_source || null, utm_medium: a.utm_medium || null, utm_campaign: a.utm_campaign || null }, true).catch(function () {});
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-track]') : null;
    if (!el) return;
    var type = el.getAttribute('data-track');
    window.dataLayer.push({ event: type + '_click', branch_id: el.getAttribute('data-branch') || body.getAttribute('data-branch') || '',
      batch_id: el.getAttribute('data-batch') || '' });
    track(type, el);
  });

  /* ---------- batch / course views: once per item per visit (no personal data) ---------- */
  (function () {
    var seen = store.get('mh_seen', true) || {};
    function view(el) {
      var type = el.getAttribute('data-view'), key = type + ':' + (el.getAttribute('data-batch') || el.getAttribute('data-course') || '') + ':' + (el.getAttribute('data-branch') || '');
      if (seen[key]) return;
      seen[key] = 1; store.set('mh_seen', seen, true);
      track(type, el);
    }
    var els = $$('[data-view]');
    els.filter(function (el) { return el.hasAttribute('data-view-load'); }).forEach(view);
    var rest = els.filter(function (el) { return !el.hasAttribute('data-view-load'); });
    if (!rest.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); view(en.target); } });
    }, { threshold: 0.6 });
    rest.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- share ---------- */
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = b.getAttribute('data-share'), title = b.getAttribute('data-share-title') || document.title;
      if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { b.setAttribute('aria-label', 'Link copied'); b.classList.add('copied'); });
      else window.open('https://wa.me/?text=' + encodeURIComponent(title + ' ' + url), '_blank', 'noopener');
    });
  });

  /* ---------- dialogs ---------- */
  function openDialog(d) { if (d && d.showModal) { d.showModal(); } else if (d) { d.setAttribute('open', ''); } }
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d || (e.target.closest && e.target.closest('[data-close]'))) d.close(); });
  });

  /* ---------- enquiry: open with context ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-enquire]') : null;
    if (!t) return;
    var ctx = ['data-branch-id', 'data-batch-id', 'data-course-id', 'data-form-type', 'data-package-id'].some(function (a) { return t.hasAttribute(a); });
    var dlg = $('#enquiry-dialog');
    if (!ctx && $('#enquiry form[data-enquiry]')) return; /* plain anchor to the inline form */
    if (!dlg) return;
    e.preventDefault();
    var f = $('form', dlg);
    if (!f || !f.elements.namedItem('name')) { openDialog(dlg); return; } /* already submitted: show the thank-you */
    resetForm(f);
    if (!f.getAttribute('data-init')) {  /* remember the page defaults once, restore them on every open */
      var lbl = $('[data-branch-label]', f), cl = $('[data-context-label]', f);
      f.setAttribute('data-init', '1'); f.setAttribute('data-ft', f.form_type.value);
      f.setAttribute('data-br', f.branch_id.value); f.setAttribute('data-brl', lbl ? lbl.textContent : '');
      f.setAttribute('data-pk', f.package_id ? f.package_id.value : ''); f.setAttribute('data-cx', cl && !cl.hidden ? cl.textContent : '');
    }
    f.branch_id.value = t.getAttribute('data-branch-id') || f.getAttribute('data-br');
    setLabel(f, '[data-branch-label]', t.getAttribute('data-branch-name') || f.getAttribute('data-brl'));
    f.batch_id.value = t.getAttribute('data-batch-id') || '';
    if (f.package_id) f.package_id.value = t.getAttribute('data-package-id') || f.getAttribute('data-pk');
    if (f.course_id) { f.course_id.value = t.getAttribute('data-course-id') || ''; syncSub(f); }
    f.form_type.value = t.getAttribute('data-form-type') || f.getAttribute('data-ft');
    var c = t.getAttribute('data-batch-name') ? 'Batch: ' + t.getAttribute('data-batch-name') : (t.getAttribute('data-context') || f.getAttribute('data-cx') || '');
    setLabel(f, '[data-context-label]', c);
    openDialog(dlg);
    var first = $('input[name=name]', f); if (first) first.focus();
  });
  function setLabel(f, sel, text) { var el = $(sel, f); if (!el) return; el.textContent = text || ''; var host = el.closest('p') || el; host.hidden = !text; }
  function resetForm(f) { $$('.fld-err', f).forEach(function (x) { x.remove(); }); var m = $('.form-msg', f); if (m) { m.textContent = ''; m.classList.remove('err'); } }

  /* ---------- enquiry: Course > Sub-course (only the chosen course's sub-courses) ---------- */
  function syncSub(f) {
    var cs = $('[data-course-select]', f), ss = $('[data-subcourse]', f), wrap = $('[data-subcourse-wrap]', f), any = false;
    if (!cs || !ss) return;
    $$('optgroup', ss).forEach(function (g) {
      var on = g.getAttribute('data-course') === cs.value; g.hidden = !on; g.disabled = !on; if (on) any = true;
    });
    var opt = ss.options[ss.selectedIndex];
    if (opt && opt.parentNode && opt.parentNode.disabled) ss.value = '';
    if (wrap) wrap.hidden = !any;
  }
  $$('form[data-enquiry]').forEach(function (f) {
    var cs = $('[data-course-select]', f);
    if (cs) { cs.addEventListener('change', function () { syncSub(f); }); syncSub(f); }
  });

  /* ---------- enquiry: branch picker (State > City > Branch) ---------- */
  function fill(sel, items, placeholder, valueKey) {
    sel.innerHTML = '<option value="">' + esc(placeholder) + '</option>' + items.map(function (i) {
      return '<option value="' + esc(i[valueKey || 'slug']) + '">' + esc(i.name) + '</option>'; }).join('');
    sel.disabled = !items.length;
  }
  $$('[data-branch-picker]').forEach(function (p) {
    var st = $('[data-geo=state]', p), ct = $('[data-geo=city]', p), br = $('[data-geo=branch]', p), loaded = false;
    p.addEventListener('toggle', function () {
      if (!p.open || loaded) return; loaded = true;
      getJSON(API + '/geo/states').then(function (d) { fill(st, d.items, 'Select state'); }).catch(function () {});
    });
    st.addEventListener('change', function () {
      fill(ct, [], 'Select city'); fill(br, [], 'Select branch');
      if (st.value) getJSON(API + '/geo/cities?state=' + encodeURIComponent(st.value)).then(function (d) { fill(ct, d.items, 'Select city'); });
    });
    ct.addEventListener('change', function () {
      fill(br, [], 'Select branch');
      if (ct.value) getJSON(API + '/geo/branches?state=' + encodeURIComponent(st.value) + '&city=' + encodeURIComponent(ct.value)).then(function (d) { fill(br, d.items, 'Select branch', 'id'); });
    });
  });

  /* ---------- enquiry: submit ---------- */
  function showErrors(f, fields) {
    (fields || []).forEach(function (x) {
      var name = String(x.field || '').replace(/^details\./, 'details.');
      var input = f.querySelector('[name="' + name + '"]') || (name === 'is_adult' ? $('[name=is_adult]', f) : null);
      if (!input) return;
      var holder = input.closest('.fld') || input.parentNode, s = document.createElement('span');
      s.className = 'fld-err'; s.textContent = String(x.message || 'Please check this field').replace(/^Value error, /, '');
      holder.appendChild(s);
    });
  }
  $$('form[data-enquiry]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault(); resetForm(f);
      var fd = new FormData(f), data = {}, details = {}, services = [], msg = $('.form-msg', f), btn = $('button[type=submit]', f);
      fd.forEach(function (v, k) {
        if (typeof v !== 'string' || v === '') return;
        if (k === 'services') services.push(v);
        else if (k.indexOf('details.') === 0) details[k.slice(8)] = k === 'details.students_count' ? parseInt(v, 10) : v;
        else if (k !== 'cf-turnstile-response' && k !== 'branch_pick') data[k] = v;
      });
      if (fd.get('branch_pick')) data.branch_id = fd.get('branch_pick');
      if (services.length) details.services = services;
      if (Object.keys(details).length) data.details = details;
      data.consent_marketing = !!fd.get('consent_marketing');
      if (!fd.get('is_adult')) { showErrors(f, [{ field: 'is_adult', message: L('Please answer this question.', 'कृपया इस सवाल का जवाब दें।') }]); return; }
      data.is_adult = fd.get('is_adult') === 'yes';
      if (fd.get('cf-turnstile-response')) data.turnstile_token = fd.get('cf-turnstile-response');
      data.page_url = location.href.split('#')[0].slice(0, 500);
      var ref = store.get('mh_ref', true); if (ref) data.referrer = ref;
      var a = attribution(); KEYS.forEach(function (k) { if (a[k]) data[k] = a[k]; });
      btn.disabled = true;
      postJSON(API + '/enquiry', data).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
      }).then(function (res) {
        btn.disabled = false;
        if (res.ok) {
          window.dataLayer.push({ event: 'lead', form_type: data.form_type || 'quick', branch_id: data.branch_id || '' });
          f.innerHTML = '<div class="enq-done"><h3>' + esc(L('Thank you!', 'धन्यवाद!')) + '</h3><p>' + esc(res.j.message) + '</p><p>' + esc(L('Your reference:', 'आपका संदर्भ:')) + ' <b>' + esc(res.j.reference) + '</b></p></div>';
          return;
        }
        var err = (res.j && res.j.error) || {};
        if (res.status === 422 && err.details && err.details.fields) showErrors(f, err.details.fields);
        else if (err.details && err.details.field) showErrors(f, [{ field: err.details.field, message: err.message }]);
        msg.classList.add('err'); msg.textContent = err.message || L('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया फिर से कोशिश करें।');
      }).catch(function () { btn.disabled = false; msg.classList.add('err'); msg.textContent = L('Network problem. Please check your connection and try again.', 'नेटवर्क समस्या। कृपया अपना कनेक्शन जाँचें और फिर से कोशिश करें।'); });
    });
  });

  /* ---------- optional mobile OTP (only rendered when the site switches it on) ---------- */
  $$('[data-otp-send]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('form'), out = $('[data-otp-msg]', f), phone = f.elements.namedItem('phone');
      if (!phone || !phone.value) { out.textContent = L('Enter your mobile number first.', 'पहले अपना मोबाइल नंबर लिखें।'); return; }
      b.disabled = true; out.textContent = L('Sending…', 'भेजा जा रहा है…');
      postJSON(API + '/otp', { phone: phone.value }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        b.disabled = false;
        out.textContent = res.ok ? L('Code sent on WhatsApp. It is valid for 10 minutes.', 'कोड व्हाट्सऐप पर भेज दिया गया है। यह 10 मिनट तक मान्य है।') : (((res.j || {}).error || {}).message || L('Could not send the code.', 'कोड नहीं भेजा जा सका।'));
        if (res.ok) { var c = f.elements.namedItem('otp_code'); if (c) c.focus(); }
      }).catch(function () { b.disabled = false; out.textContent = 'Network problem. Please try again.'; });
    });
  });

  /* ---------- ask a question (FAQs) -> Q&A inbox; a lead only with "call me back" ---------- */
  $$('form[data-question]').forEach(function (f) {
    var tog = $('[data-callback-toggle]', f), box = $('[data-callback-fields]', f);
    function sync() { if (box) box.hidden = !(tog && tog.checked); }
    if (tog) tog.addEventListener('change', sync); sync();
    f.addEventListener('submit', function (e) {
      e.preventDefault(); resetForm(f);
      var fd = new FormData(f), data = {}, msg = $('.form-msg', f), btn = $('button[type=submit]', f);
      ['name', 'question', 'email', 'branch_id', 'source_page', 'notice_version', 'website', 'otp_code'].forEach(function (k) {
        var v = fd.get(k); if (typeof v === 'string' && v !== '') data[k] = v;
      });
      data.want_callback = !!fd.get('want_callback');
      if (data.want_callback) {
        if (fd.get('phone')) data.phone = fd.get('phone');
        if (!fd.get('is_adult')) { showErrors(f, [{ field: 'is_adult', message: L('Please answer this question.', 'कृपया इस सवाल का जवाब दें।') }]); return; }
        data.is_adult = fd.get('is_adult') === 'yes';
        data.consent_marketing = !!fd.get('consent_marketing');
      }
      if (fd.get('cf-turnstile-response')) data.turnstile_token = fd.get('cf-turnstile-response');
      data.page_url = location.href.split('#')[0].split('?')[0].slice(0, 500);
      btn.disabled = true;
      postJSON(API + '/question', data).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
      }).then(function (res) {
        btn.disabled = false;
        if (res.ok) {
          window.dataLayer.push({ event: 'question', callback: data.want_callback });
          f.innerHTML = '<div class="enq-done"><h3>' + esc(L('Thank you!', 'धन्यवाद!')) + '</h3><p>' + esc(res.j.message) + '</p><p>' + esc(L('Your reference:', 'आपका संदर्भ:')) + ' <b>' + esc(res.j.reference) + '</b></p></div>';
          return;
        }
        var err = (res.j && res.j.error) || {};
        if (res.status === 422 && err.details && err.details.fields) showErrors(f, err.details.fields);
        else if (err.details && err.details.field) showErrors(f, [{ field: err.details.field, message: err.message }]);
        msg.classList.add('err'); msg.textContent = err.message || L('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया फिर से कोशिश करें।');
      }).catch(function () { btn.disabled = false; msg.classList.add('err'); msg.textContent = L('Network problem. Please check your connection and try again.', 'नेटवर्क समस्या। कृपया अपना कनेक्शन जाँचें और फिर से कोशिश करें।'); });
    });
  });

  /* ---------- subscribe ---------- */
  $$('form[data-subscribe]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var msg = $('.form-msg', f); msg.classList.remove('err');
      var d = { email: f.email.value.trim(), consent: f.consent.checked, page_url: location.pathname };
      if (f.branch_id && f.branch_id.value) d.branch_id = f.branch_id.value;
      if (f.website.value) d.website = f.website.value;
      postJSON(API + '/subscribe', d).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) { if (res.ok) { f.innerHTML = '<p class="form-msg">' + esc(res.j.message) + '</p>'; } else { msg.classList.add('err'); msg.textContent = (res.j.error && res.j.error.message) || 'Please check your e-mail address.'; } })
        .catch(function () { msg.classList.add('err'); msg.textContent = 'Network problem. Please try again.'; });
    });
  });

  /* ---------- checkout (plain form post): carry the visit's campaign tags and referrer ---------- */
  $$('form[data-checkout]').forEach(function (f) {
    f.addEventListener('submit', function () {
      var a = attribution(), ref = store.get('mh_ref', true);
      KEYS.forEach(function (k) {
        if (!a[k] || f.elements.namedItem(k)) return;
        var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = a[k]; f.appendChild(i);
      });
      if (ref && f.elements.namedItem('referrer')) f.elements.namedItem('referrer').value = ref;
    });
  });

  /* ---------- menu dropdown (Upcoming Batches & Courses): opens on hover on wide screens, click works everywhere ---------- */
  var wide = window.matchMedia ? window.matchMedia('(min-width: 900px)') : { matches: false };
  $$('details[data-hover-open]').forEach(function (d) {
    var li = d.parentNode, hover = false, sum = $('summary', d);
    li.addEventListener('mouseenter', function () { if (wide.matches) { hover = true; d.open = true; } });
    li.addEventListener('mouseleave', function () { if (wide.matches) { hover = false; d.open = false; } });
    if (sum) sum.addEventListener('click', function (e) { if (hover && d.open) e.preventDefault(); }); /* hovered: a click keeps it open */
  });
  document.addEventListener('click', function (e) {  /* a click elsewhere closes an open menu dropdown */
    $$('.nav details[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
  });

  /* ---------- packages carousel: prev / next buttons over a scroll-snap row ---------- */
  $$('[data-carousel]').forEach(function (row) {
    var box = row.closest('section'), prev = box && $('[data-car-prev]', box), next = box && $('[data-car-next]', box);
    if (!prev || !next) return;
    function step() { var c = row.firstElementChild; return c ? c.getBoundingClientRect().width + 14 : row.clientWidth; }
    function sync() { prev.disabled = row.scrollLeft <= 2; next.disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 2; }
    prev.addEventListener('click', function () { row.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { row.scrollBy({ left: step(), behavior: 'smooth' }); });
    row.addEventListener('scroll', sync, { passive: true });
    prev.hidden = next.hidden = row.scrollWidth <= row.clientWidth + 2;
    sync();
  });

  /* ---------- gallery: All / Interior / Additional pills filter instantly (links still work without JS) ---------- */
  $$('[data-gallery-filters]').forEach(function (bar) {
    var grid = $('[data-gallery-grid]');
    if (!grid) return;
    bar.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('[data-filter]') : null;
      if (!a) return;
      e.preventDefault();
      var g = a.getAttribute('data-filter');
      $$('[data-filter]', bar).forEach(function (x) { if (x === a) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
      $$('li[data-group]', grid).forEach(function (li) { li.hidden = g !== 'all' && li.getAttribute('data-group') !== g; });
    });
  });

  /* ---------- gallery video tiles: play our own video files in a dialog ---------- */
  var vdlg = $('#video-dialog');
  if (vdlg) {
    $$('[data-video]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var src = a.getAttribute('data-video');
        if (!/^\/files\/[\w\/.-]+$/.test(src)) return; /* only this site's public media */
        e.preventDefault();
        var v = $('video', vdlg); v.src = src; openDialog(vdlg); v.play && v.play().catch(function () {});
      });
    });
    vdlg.addEventListener('close', function () { var v = $('video', vdlg); v.pause(); v.removeAttribute('src'); v.load(); });
  }

  window.MH = { $: $, $$: $$, getJSON: getJSON, postJSON: postJSON, slug: slug, esc: esc, store: store, openDialog: openDialog, API: API };
})();
