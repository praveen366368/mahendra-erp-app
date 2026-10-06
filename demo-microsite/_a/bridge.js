/* Offline demo only (copied into web/public/demo-microsite/_a/bridge.js by scripts/microsite_snapshot.py).
 * The saved microsite runs inside the app's "Student journey" screen with no server behind it, so:
 * - an enquiry form submit is answered here: the form shows the thank-you message and the app is told,
 *   so it can show the student as a new Microsite lead;
 * - links to pages outside this branch's saved pages do nothing. */
(function () {
  'use strict';
  var FORM_LABELS = { quick: 'Quick enquiry', course: 'Course enquiry', batch: 'Batch enquiry', contact: 'Contact us',
    callback: 'Call-back request', package: 'Package enquiry' };

  function utm() {
    try { return JSON.parse(sessionStorage.getItem('mh_utm') || '{}'); } catch (e) { return {}; }
  }

  function field(form, name) {
    var el = form.elements.namedItem(name);
    if (!el) return '';
    if (el.tagName === 'SELECT') return el.selectedIndex > 0 ? el.options[el.selectedIndex].text : '';
    return (el.value || '').trim();
  }

  window.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (!form || form.getAttribute('action') !== '/enquiry') return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    if (!form.reportValidity()) return;
    var type = field(form, 'form_type') || 'quick';
    var lead = {
      type: 'merp-microsite-enquiry',
      form_type: type,
      form_label: FORM_LABELS[type] || 'Enquiry',
      name: field(form, 'name'),
      phone_last4: field(form, 'phone').replace(/\D/g, '').slice(-4),
      // A package form has no course list: the package's name (the page title) stands in for it.
      course: field(form, 'course_id') || (type === 'package' ? ((document.querySelector('h1') || {}).textContent || '').trim() : ''),
      message: field(form, 'message'),
      page: (location.pathname.split('/').pop() || 'home.html').replace('.html', ''),
      utm_source: utm().utm_source || '',
    };
    var done = document.createElement('div');
    done.className = 'alert alert-success';
    done.setAttribute('role', 'status');
    done.innerHTML = '<strong>Thank you!</strong> Your enquiry has been sent. Our counsellor will call you soon.';
    form.replaceWith(done);
    try { window.parent.postMessage(lead, location.origin); } catch (e) { /* opened on its own */ }
  }, true);

  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[data-demo-off]') : null;
    if (!a) return;
    ev.preventDefault();
    try { window.parent.postMessage({ type: 'merp-microsite-offpage', label: (a.textContent || '').trim() }, location.origin); } catch (e) { /* ignore */ }
  }, true);
})();
