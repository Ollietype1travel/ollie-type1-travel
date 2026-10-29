/* Travel preferences survey. No dependencies, no cookies, no analytics.
   Identity comes from the server, never from the URL:
   - After a Kit signup redirect: the page asks /api/preferences/session for a short-lived token.
   - From an emailed link (?s=<id>&t=<token>): the single-use token is checked on submit.
   Anything in the URL is removed from the address bar immediately. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var API = '/api/preferences/';
  var FLEX = "I'm flexible", BROWSING = 'Just browsing';
  var ui = { checking: $('pf-checking'), link: $('pf-link'), form: $('pf-form'), saved: $('pf-saved'), skipped: $('pf-skipped') };
  var identity = null; // { token } or { s, t }
  var pendingSession = null; // set while a sign-up is still being confirmed
  var siteKey = (document.querySelector('meta[name="turnstile-sitekey"]') || {}).content || '';
  var hasTurnstile = siteKey && siteKey.indexOf('REPLACE_') !== 0;

  function show(name) {
    Object.keys(ui).forEach(function (k) { ui[k].hidden = k !== name; });
    var h = ui[name].querySelector('h1');
    if (h && (name === 'saved' || name === 'skipped')) { h.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  }

  // ---- Turnstile (loaded only when a site key is configured) ----
  // onInteractive runs if Cloudflare needs the visitor to tick the box, so its container can be shown.
  function turnstileToken(containerId, onInteractive) {
    return new Promise(function (resolve) {
      if (!hasTurnstile) { resolve(''); return; }
      function render() {
        window.turnstile.render('#' + containerId, {
          sitekey: siteKey, appearance: 'interaction-only', callback: resolve, 'error-callback': function () { resolve(''); }, 'expired-callback': function () { resolve(''); },
          'before-interactive-callback': onInteractive || function () {}
        });
      }
      if (window.turnstile) { render(); return; }
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.onload = render; s.onerror = function () { resolve(''); };
      document.head.appendChild(s);
    });
  }

  function post(path, body) {
    return fetch(API + path, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit', cache: 'no-store'
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (d) { d.status = r.status; return d; }); });
  }

  // ---- Start: work out who is here, then clean the URL ----
  function init() {
    var p = new URLSearchParams(location.search);
    var email = p.get('email') || p.get('email_address') || '';
    if (!email) {
      // Kit does not document its parameter name, so accept an email from any parameter.
      p.forEach(function (v) { if (!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().replace(/ /g, '+'))) email = v.trim(); });
    }
    // A raw "+" in a URL is read as a space; put it back so addresses like name+tag@gmail.com survive.
    email = email.trim().replace(/ /g, '+');
    var s = p.get('s'), t = p.get('t');
    if (location.search) history.replaceState(null, '', location.pathname);

    if (s && t) { identity = { s: s, t: t }; show('form'); return; }
    if (email) {
      // Show the survey straight away and confirm the sign-up behind it. Saving waits for this
      // if it hasn't finished; only a visitor who needs to tick the robot check sees it.
      show('form');
      pendingSession = turnstileToken('pf-turnstile-check', function () { show('checking'); }).then(function (ts) {
        return post('session', { email: email, turnstile: ts });
      }).then(function (d) {
        if (d.ok && d.token) { identity = { token: d.token }; if (!ui.checking.hidden) show('form'); }
        else { $('pf-link-msg').textContent = "I couldn't match that sign-up automatically. For your privacy, I'll email you a personal link to your preferences instead." + ' (code ' + (d.status || '?') + (d.error ? ' ' + d.error : '') + (d.reason ? ' ' + d.reason : '') + ')'; show('link'); }
      }, function () { show('link'); });
      return;
    }
    show('link');
  }

  // ---- Request a personal link ----
  $('pf-link-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('pf-link-email').value.trim(), err = $('pf-link-error');
    err.hidden = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; err.hidden = false; return; }
    var btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
    turnstileToken('pf-turnstile-link').then(function (ts) {
      return post('link', { email: email, turnstile: ts });
    }).then(function (d) {
      btn.disabled = false;
      if (d.ok) { $('pf-link-sent').hidden = false; $('pf-link-form').hidden = true; }
      else { err.textContent = 'Something went wrong. Please try again in a moment.'; err.hidden = false; }
    }, function () { btn.disabled = false; err.textContent = 'Something went wrong. Please try again in a moment.'; err.hidden = false; });
  });

  // ---- Destination dropdowns ----
  Array.prototype.forEach.call(document.querySelectorAll('.pf-region'), function (region) {
    var toggle = region.querySelector('.pf-region-toggle'), count = region.querySelector('.pf-region-count');
    var boxes = region.querySelectorAll('input[type=checkbox]');
    toggle.addEventListener('click', function () { toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); });
    function update() {
      var n = region.querySelectorAll('input:checked').length;
      count.textContent = n ? n + ' selected' : '';
      region.classList.toggle('has-selection', n > 0);
    }
    Array.prototype.forEach.call(boxes, function (b) { b.addEventListener('change', update); });
  });

  // ---- Mutually exclusive pills ----
  function exclusive(groupId, special) {
    var boxes = document.querySelectorAll('#' + groupId + ' input');
    Array.prototype.forEach.call(boxes, function (b) {
      b.addEventListener('change', function () {
        if (!b.checked) return;
        Array.prototype.forEach.call(boxes, function (o) {
          if (o === b) return;
          if (b.value === special || o.value === special) o.checked = false;
        });
      });
    });
  }
  exclusive('pf-months', FLEX);
  exclusive('pf-years', BROWSING);

  // Radios: tap the selected one again to clear it (every question is optional).
  Array.prototype.forEach.call(document.querySelectorAll('#pf-companions input'), function (r) {
    r.addEventListener('click', function () {
      if (r.dataset.was === '1') { r.checked = false; r.dataset.was = ''; }
      else { Array.prototype.forEach.call(document.querySelectorAll('#pf-companions input'), function (o) { o.dataset.was = ''; }); r.dataset.was = '1'; }
    });
  });

  function values(name) {
    return Array.prototype.map.call(document.querySelectorAll('input[name="' + name + '"]:checked'), function (i) { return i.value; });
  }
  function collect() {
    var comp = values('companions');
    return { destinations: values('destinations'), months: values('months'), years: values('years'), budget: $('budget').value, age: $('age').value, companions: comp[0] || '' };
  }

  // ---- Submit and skip ----
  $('pf-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('pf-error'), btn = $('pf-save');
    err.hidden = true;
    var a = collect();
    if (!a.destinations.length && !a.months.length && !a.years.length && !a.budget && !a.age && !a.companions) {
      err.textContent = 'Pick at least one answer, or choose "Skip for now".'; err.hidden = false; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
    }
    btn.disabled = true; btn.textContent = 'SAVING…';
    Promise.resolve(pendingSession).then(function () {
      // A sign-up that could not be confirmed has already switched to the link screen.
      if (!identity) { btn.disabled = false; btn.textContent = 'SAVE MY PREFERENCES →'; return; }
      return post('submit', Object.assign({ answers: a }, identity)).then(onSaved, onSaveError);
    });
    function onSaved(d) {
      if (d.ok) { show('saved'); return; }
      btn.disabled = false; btn.textContent = 'SAVE MY PREFERENCES →';
      if (d.status === 403) { err.textContent = 'This link has expired or has already been used. Request a new one below.'; identity = null; show('link'); return; }
      err.textContent = d.status === 400 ? 'Some answers could not be read. Please check them and try again.' : "Sorry, that didn't save. Your answers are still here, so please try again in a moment.";
      err.hidden = false; err.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    function onSaveError() {
      btn.disabled = false; btn.textContent = 'SAVE MY PREFERENCES →';
      err.textContent = "Sorry, that didn't save. Your answers are still here, so please try again in a moment."; err.hidden = false;
    }
  });
  $('pf-skip').addEventListener('click', function () { show('skipped'); });

  init();
})();
