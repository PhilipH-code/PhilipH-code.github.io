/* ============================================================
   Café Reitschule — Einwilligungs-Manager (§ 25 TTDSG, DSGVO)
   Kein Tracking. Speichert nur die Entscheidung selbst.
   ============================================================ */
(function () {
  "use strict";

  var cfgEl = document.getElementById("consent-config");
  var banner = document.getElementById("consent-banner");
  var dialog = document.getElementById("consent-dialog");
  if (!cfgEl || !banner || !dialog) return;

  var cfg = { version: 1, fonts: false, pixel: "" };
  try { cfg = JSON.parse(cfgEl.textContent); } catch (err) {}

  var KEY = "rs-consent";

  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && c.v === cfg.version) return c;
    } catch (err) {}
    return null;
  }

  function writeConsent(external, marketing) {
    var c = { v: cfg.version, ts: new Date().toISOString(), external: !!external, marketing: !!marketing };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (err) {}
    return c;
  }

  function applyConsent(c) {
    /* Externe Dienste erst nach Einwilligung laden (derzeit: Adobe Fonts, wenn aktiviert) */
    if (c && c.external && cfg.fonts && !document.getElementById("rs-fonts")) {
      var l = document.createElement("link");
      l.id = "rs-fonts";
      l.rel = "stylesheet";
      l.href = "https://use.typekit.net/mms4gti.css";
      document.head.appendChild(l);
    }
    /* Meta Pixel: nur mit Einwilligung, nur wenn im Admin konfiguriert */
    if (c && c.marketing && cfg.pixel && !window.fbq) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,"script","https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", cfg.pixel);
      window.fbq("track", "PageView");
    }
  }

  var toggle = document.getElementById("consent-toggle-external");
  var toggleM = document.getElementById("consent-toggle-marketing");

  function setToggle(t, on) {
    t.classList.toggle("is-on", !!on);
    t.setAttribute("aria-checked", on ? "true" : "false");
  }

  function hideBanner() {
    banner.hidden = true;
    document.body.classList.remove("has-consent-banner");
  }

  function decide(external, marketing) {
    var c = writeConsent(external, marketing);
    applyConsent(c);
    hideBanner();
    if (dialog.open) dialog.close();
    window.rsConsentPending = false;
  }

  /* Banner nur zeigen, wenn noch keine (gültige) Entscheidung vorliegt */
  var current = readConsent();
  window.rsConsentPending = !current;
  if (current) {
    applyConsent(current);
  } else {
    banner.hidden = false;
    document.body.classList.add("has-consent-banner");
  }

  function openSettings() {
    var c = readConsent();
    setToggle(toggle, c ? c.external : false);
    setToggle(toggleM, c ? c.marketing : false);
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  [toggle, toggleM].forEach(function (t) {
    t.addEventListener("click", function () { setToggle(t, !t.classList.contains("is-on")); });
  });

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-consent]");
    if (el) {
      var action = el.getAttribute("data-consent");
      if (action === "all") decide(true, true);
      if (action === "necessary") decide(false, false);
      if (action === "save") decide(toggle.classList.contains("is-on"), toggleM.classList.contains("is-on"));
      if (action === "settings" || action === "open") { e.preventDefault(); openSettings(); }
      if (action === "close") dialog.close();
      return;
    }
    if (e.target === dialog) dialog.close();
  });
})();
