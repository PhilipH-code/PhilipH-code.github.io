/* ============================================================
   Café Reitschule — Technik im Hintergrund.
   Kein Tracking, keine Cookies, keine externen Requests.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  /* ---------- Abgelaufene Termine ausblenden ----------
     Die Seiten sind statisch generiert; liegt der letzte Build ein paar Tage
     zurück, wären vergangene Termine noch sichtbar. data-expires trägt das
     Datum des Termins — ist es vorbei, verschwindet die Zeile clientseitig. */
  var now = new Date();
  var todayIso = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");
  Array.prototype.forEach.call(document.querySelectorAll("[data-expires]"), function (el) {
    if (el.getAttribute("data-expires") < todayIso) el.hidden = true;
  });

  /* Druck-Button (Menü-Seiten) — CSP-konform statt inline onclick */
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-print]")) window.print();
  });

  /* ---------- Mobile navigation ---------- */
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    function closeNav() {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Menü öffnen");
      document.body.style.overflow = "";
    }
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        var first = nav.querySelector("a, button");
        if (first) first.focus();
      }
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        closeNav();
        burger.focus();
        return;
      }
      /* Fokus-Falle: Tab bleibt im Vollbild-Menü (Burger gehört zum Zyklus) */
      if (e.key === "Tab") {
        var items = [burger].concat(Array.prototype.slice.call(
          nav.querySelectorAll("a[href], button:not([disabled])")
        )).filter(function (el) { return el.offsetParent !== null || el === burger; });
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Preloader & Auftritt ---------- */
  var loader = document.querySelector(".loader");
  var introSeen = false;
  try { introSeen = sessionStorage.getItem("rs-intro") === "1"; } catch (err) {}

  var readyDone = false;
  function setReady() {
    if (readyDone) return;
    readyDone = true;
    if (loader) {
      loader.classList.add("is-done");
      window.setTimeout(function () { loader.remove(); }, 1000);
    }
    body.classList.add("is-ready");
  }

  if (loader && !reduceMotion && !introSeen) {
    try { sessionStorage.setItem("rs-intro", "1"); } catch (err) {}
    /* main.js ist defer, läuft also erst nach dem DOM-Parsing. Vorhang kurz
       danach lüften — NICHT auf window.load warten (das würde auf langsamen
       Verbindungen das Hero und damit den LCP stark verzögern). */
    requestAnimationFrame(function () { window.setTimeout(setReady, 420); });
    window.setTimeout(setReady, 1800); /* Sicherheitsnetz */
  } else {
    if (loader) loader.remove();
    loader = null;
    setReady();
  }

  /* ---------- Hero: Buchstaben-Choreographie ---------- */
  /* Hero-Auftritt läuft jetzt komplett über CSS-Animationen (kein JS-Gate),
     damit das größte Element früh sichtbar ist und der LCP schnell bleibt. */

  /* ---------- Header state ---------- */
  var header = document.getElementById("header");
  var progress = document.querySelector(".progress");
  var heroMedia = document.querySelector(".hero__media");

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);

      // Scroll progress hairline
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress && max > 0) progress.style.width = (y / max) * 100 + "%";

      // Hero parallax (auf dem Wrapper, damit der Ken-Burns-Zoom des Bildes bleibt)
      if (heroMedia && !reduceMotion && y < window.innerHeight * 1.2) {
        heroMedia.style.transform = "translateY(" + y * 0.28 + "px)";
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();


  /* ---------- Statement: Wort für Wort ---------- */
  document.querySelectorAll(".statement__text").forEach(function (textEl) {
    if (reduceMotion) return;
    var words = textEl.textContent.replace(/\s+/g, " ").trim().split(" ");
    textEl.textContent = "";
    words.forEach(function (word, i) {
      var w = document.createElement("span");
      w.className = "w";
      w.style.setProperty("--i", i);
      w.textContent = word;
      textEl.appendChild(w);
      if (i < words.length - 1) textEl.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, .statement");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Animated counters (Plätze, Quadratmeter) ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduceMotion) { el.textContent = target.toLocaleString("de-DE"); return; }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("de-DE");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Sanfter Seitenwechsel ----------
     Nur als Fallback: Browser mit View Transitions übernehmen das nativ (CSS). */
  if (!reduceMotion && !("startViewTransition" in document)) {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      var link = e.target.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      var href = link.getAttribute("href");
      if (!href || href.charAt(0) === "#" || /^(https?:|mailto:|tel:)/i.test(href) || /\.pdf($|\?)/i.test(href)) return;
      e.preventDefault();
      body.classList.add("is-exiting");
      window.setTimeout(function () { window.location.href = href; }, 240);
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) body.classList.remove("is-exiting");
    });
  }

  /* ---------- Live-Status: Jetzt geöffnet / Schließtage ---------- */
  var badges = document.querySelectorAll("[data-open-badge]");
  if (badges.length) {
    var openingHours = { 0: [540, 1140], 1: [690, 1380], 2: [690, 1380], 3: [690, 1380], 4: [690, 1380], 5: [690, 1380], 6: [540, 1380] };
    var closures = [];
    /* Beschriftungen liefert die Seite (hours-data.t, per i18n) — DE-Fallback hier */
    var HT = {
      now: "Jetzt geöffnet · heute bis %s", today: "Öffnet heute um %s", tomorrow: "Öffnet morgen um %s",
      on: "Öffnet am %s um %s", closedToday: "Heute geschlossen", uhr: " Uhr",
      noteTomorrow: "Morgen", noteDays: "In %s Tagen (%s)", noteEarly: " nur bis %s geöffnet", noteClosed: " geschlossen"
    };
    var hoursEl = document.getElementById("hours-data");
    if (hoursEl) {
      try {
        var hd = JSON.parse(hoursEl.textContent);
        if (hd.s) { openingHours = hd.s; closures = hd.c || []; if (hd.t) HT = hd.t; }
        else openingHours = hd;
      } catch (err) {}
    }
    var fill = function (tpl) {
      var args = Array.prototype.slice.call(arguments, 1), i = 0;
      return String(tpl).replace(/%s/g, function () { return args[i++]; });
    };
    var fmtTime = function (min) {
      var h = Math.floor(min / 60), m = min % 60;
      if (HT.uhr === "") return h + ":" + (m < 10 ? "0" : "") + m;
      return h + (m ? ":" + (m < 10 ? "0" : "") + m : "") + HT.uhr;
    };
    var toMin = function (t) {
      var p = String(t || "").split(":");
      return p.length === 2 ? parseInt(p[0], 10) * 60 + parseInt(p[1], 10) : null;
    };
    try {
      var berlin = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
      var day = berlin.getDay();
      var mins = berlin.getHours() * 60 + berlin.getMinutes();
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      var isoOf = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
      var todayIso = isoOf(berlin);

      var closureOn = function (iso) {
        for (var i = 0; i < closures.length; i++) {
          var c = closures[i];
          if (iso >= c.date && iso <= (c.end || c.date)) return c;
        }
        return null;
      };

      var today = openingHours[day];
      var todayC = closureOn(todayIso);
      var text = "", isOpen = false;

      if (todayC && todayC.type === "ganz") {
        text = HT.closedToday + (todayC.label ? " · " + todayC.label : "");
      } else {
        var closeAt = today[1];
        if (todayC && todayC.type === "frueher" && toMin(todayC.time) !== null) closeAt = Math.min(closeAt, toMin(todayC.time));
        if (mins >= today[0] && mins < closeAt) {
          isOpen = true;
          text = fill(HT.now, fmtTime(closeAt));
          if (todayC && todayC.label) text += " (" + todayC.label + ")";
        } else if (mins < today[0]) {
          text = fill(HT.today, fmtTime(today[0]));
        } else {
          /* geschlossen: nächsten regulären Tag finden, Schließtage überspringen */
          var d2 = new Date(berlin);
          for (var n = 1; n <= 14; n++) {
            d2.setDate(d2.getDate() + 1);
            var c2 = closureOn(isoOf(d2));
            if (!c2 || c2.type !== "ganz") {
              var opensAt = fmtTime(openingHours[d2.getDay()][0]);
              text = n === 1 ? fill(HT.tomorrow, opensAt) : fill(HT.on, d2.getDate() + "." + (d2.getMonth() + 1) + ".", opensAt);
              break;
            }
          }
        }
      }

      /* Vorlauf-Hinweis auf kommende Schließtage (announce = Tage vorher) */
      var note = "";
      var da = new Date(berlin);
      for (var k = 1; k <= 14 && !note; k++) {
        da.setDate(da.getDate() + 1);
        var ca = closureOn(isoOf(da));
        if (ca && k <= (ca.announce === undefined ? 1 : ca.announce)) {
          var when = k === 1 ? HT.noteTomorrow : fill(HT.noteDays, k, da.getDate() + "." + (da.getMonth() + 1) + ".");
          var caMin = toMin(ca.time);
          note = when + (ca.type === "frueher" ? fill(HT.noteEarly, caMin !== null ? fmtTime(caMin) : ca.time) : HT.noteClosed) + (ca.label ? " · " + ca.label : "");
        }
      }

      badges.forEach(function (b) {
        b.textContent = text;
        if (note) {
          var s = document.createElement("span");
          s.className = "open-badge__note";
          s.textContent = note;
          b.appendChild(s);
        }
        b.classList.toggle("is-open", isOpen);
        b.hidden = false;
      });
    } catch (err) { /* Ohne Zeitzonen-Unterstützung bleibt der Hinweis verborgen */ }
  }

  /* ---------- Ankündigungs-Popup (Zeitfenster steuert der Admin) ---------- */
  var popupEl = document.getElementById("popup");
  var popupData = document.getElementById("popup-data");
  if (popupEl && popupData && typeof popupEl.showModal === "function") {
    try {
      var pd = JSON.parse(popupData.textContent);
      var now = Date.now();
      var startOk = !pd.start || now >= new Date(pd.start).getTime();
      var endOk = !pd.end || now <= new Date(pd.end).getTime();
      var seenKey = "rs-popup-" + (pd.start || "") + "-" + (pd.end || "");
      var seen = false;
      try { seen = sessionStorage.getItem(seenKey) === "1"; } catch (err) {}
      if (startOk && endOk && !seen && !window.rsConsentPending) {
        window.setTimeout(function () {
          popupEl.showModal();
          try { sessionStorage.setItem(seenKey, "1"); } catch (err) {}
        }, 2200);
        popupEl.querySelector(".popup__close").addEventListener("click", function () { popupEl.close(); });
        popupEl.addEventListener("click", function (e) {
          if (e.target === popupEl) popupEl.close();
        });
      }
    } catch (err) { /* fehlerhafte Popup-Daten: nichts anzeigen */ }
  }

  /* ---------- Anonyme Statistik (ohne Cookies, DNT wird respektiert) ---------- */
  var dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1";
  function track(params) {
    if (dnt || location.protocol === "file:") return;
    var q = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    var url = "t.php?" + q;
    if (navigator.sendBeacon) navigator.sendBeacon(url);
    else { var i = new Image(); i.src = url; }
  }
  track({ p: location.pathname, r: document.referrer || "" });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href], button");
    if (!a) return;
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href.indexOf("opentable") !== -1) track({ p: location.pathname, e: "reservieren" });
    else if (href.indexOf("tel:") === 0) track({ p: location.pathname, e: "anruf" });
    else if (href.indexOf("mailto:") === 0) track({ p: location.pathname, e: "email" });
  }, { passive: true });

  /* ---------- Flip-Karten: erster Tipp dreht, zweiter folgt dem Link ---------- */
  if (window.matchMedia("(hover: none)").matches) {
    document.querySelectorAll(".locard").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (!card.classList.contains("is-flipped")) {
          e.preventDefault();
          document.querySelectorAll(".locard.is-flipped").forEach(function (o) { o.classList.remove("is-flipped"); });
          card.classList.add("is-flipped");
        }
      });
    });
  }

  /* ---------- Kalender: Termine aufklappen ---------- */
  document.querySelectorAll(".cal-row__toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var row = btn.closest(".cal-row");
      var open = row.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.childNodes[0].textContent = open ? btn.getAttribute("data-less") : btn.getAttribute("data-more");
    });
  });

  /* ---------- Slider (Galerie & Bestuhlungspläne) ---------- */
  var sliders = [];
  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector(".slider__track");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".slider__slide"));
    var current = root.querySelector(".slider__count-current");
    var total = slides.length;
    if (!track || total === 0) return;
    if (total < 2) { root.classList.add("slider--single"); return; }
    var idx = 0, timer = null, resume = null;
    var delay = parseInt(root.getAttribute("data-autoplay"), 10) || 5000;
    function paint() {
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      if (current) current.textContent = ("0" + (idx + 1)).slice(-2);
      slides.forEach(function (s, i) {
        s.setAttribute("aria-hidden", i === idx ? "false" : "true");
        var f = s.querySelector(".slider__frame");
        if (f) f.tabIndex = i === idx ? 0 : -1;
      });
    }
    function go(i) { idx = (i + total) % total; paint(); }
    function play() { if (reduceMotion || timer) return; timer = setInterval(function () { go(idx + 1); }, delay); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    /* Bei Bedienung Auto-Lauf stoppen, nach 10 s wieder anwerfen */
    function nudge() { stop(); if (resume) clearTimeout(resume); resume = setTimeout(function () { resume = null; play(); }, 10000); }
    root.querySelector(".slider__arrow--next").addEventListener("click", function () { go(idx + 1); nudge(); });
    root.querySelector(".slider__arrow--prev").addEventListener("click", function () { go(idx - 1); nudge(); });
    /* Wischen (Touch/Pointer); ein echter Wisch öffnet nicht die Lightbox */
    var x0 = null, moved = false;
    root.addEventListener("pointerdown", function (e) { x0 = e.clientX; moved = false; });
    root.addEventListener("pointermove", function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 8) moved = true; });
    root.addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) { go(idx + (dx < 0 ? 1 : -1)); nudge(); }
    });
    root.querySelectorAll(".slider__frame").forEach(function (f) {
      f.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; } }, true);
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (!resume) play(); });
    sliders.push({ stop: stop, play: play });
    paint(); play();
  });

  /* ---------- Bild-Großansicht (Lightbox, gruppenfähig) ---------- */
  var lightbox = document.getElementById("lightbox");
  if (lightbox && typeof lightbox.showModal === "function") {
    var lbImg = lightbox.querySelector("img");
    var lbCap = lightbox.querySelector(".lightbox__caption");
    var lbCount = lightbox.querySelector(".lightbox__count");
    var lbList = [], lbAlts = [], lbIndex = 0;
    var lbPad = function (n) { return (n < 10 ? "0" : "") + n; };
    /* Blur-up: erst die (meist schon gecachte) w960-Variante zeigen, das
       Original leise nachladen und tauschen, sobald es da ist. */
    var lbToken = 0;
    var lbRender = function () {
      var full = lbList[lbIndex];
      var mid = full.replace(/\.(jpe?g|png)$/i, ".w960.$1");
      var token = ++lbToken;
      lbImg.onerror = function () { lbImg.onerror = null; lbImg.src = full; };
      lbImg.src = mid;
      if (mid !== full) {
        var pre = new Image();
        pre.onload = function () { if (token === lbToken) { lbImg.onerror = null; lbImg.src = full; } };
        pre.src = full;
      }
      lbImg.alt = lbAlts[lbIndex] || "Café Reitschule München";
      if (lbCap) lbCap.textContent = lbAlts[lbIndex] || "";
      if (lbCount) lbCount.textContent = lbList.length > 1 ? lbPad(lbIndex + 1) + " / " + lbPad(lbList.length) : "";
    };
    var lbShow = function (i) {
      lbIndex = (i + lbList.length) % lbList.length;
      /* kurzer Kreuzblenden-Moment beim Wechsel */
      lbImg.classList.add("is-switching");
      var done = function () { lbImg.classList.remove("is-switching"); lbImg.removeEventListener("load", done); };
      lbImg.addEventListener("load", done);
      lbRender();
    };
    document.querySelectorAll("[data-lightbox]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.getAttribute("data-lb-group");
        var sel = group ? '[data-lightbox][data-lb-group="' + group + '"]' : "[data-lightbox]";
        var btns = Array.prototype.slice.call(document.querySelectorAll(sel));
        lbList = btns.map(function (b) { return b.getAttribute("data-lightbox"); });
        lbAlts = btns.map(function (b) { var im = b.querySelector("img"); return im ? im.alt : ""; });
        lbIndex = Math.max(0, btns.indexOf(btn));
        lbRender();
        lightbox.showModal();
        sliders.forEach(function (s) { s.stop(); });
      });
    });
    lightbox.querySelector(".popup__close").addEventListener("click", function () { lightbox.close(); });
    /* Wisch-Gesten: horizontal blättern, kräftig nach unten schließen */
    var swipeX = 0, swipeY = 0, swipeArmed = false, lastSwipe = 0;
    lightbox.addEventListener("pointerdown", function (e) {
      if (e.target.closest("[data-lb], .popup__close")) return;
      swipeArmed = true;
      swipeX = e.clientX; swipeY = e.clientY;
    });
    lightbox.addEventListener("pointerup", function (e) {
      if (!swipeArmed) return;
      swipeArmed = false;
      var dx = e.clientX - swipeX, dy = e.clientY - swipeY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        lastSwipe = Date.now();
        lbShow(lbIndex + (dx < 0 ? 1 : -1));
      } else if (dy > 90 && dy > Math.abs(dx) * 1.5) {
        lastSwipe = Date.now();
        lightbox.close();
      }
    });
    lightbox.addEventListener("click", function (e) {
      if (Date.now() - lastSwipe < 400) return;  // der Klick gehörte zur Wisch-Geste
      var lb = e.target.closest("[data-lb]");
      if (lb) { lbShow(lbIndex + (lb.getAttribute("data-lb") === "next" ? 1 : -1)); return; }
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("close", function () { sliders.forEach(function (s) { s.play(); }); });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.open) return;
      if (e.key === "ArrowRight") lbShow(lbIndex + 1);
      if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
    });
  }

  /* ---------- Newsletter: Anmeldung ohne Seitenwechsel ---------- */
  var newsForm = document.querySelector(".news-form");
  if (newsForm) {
    var newsMsg = newsForm.querySelector(".news-form__msg");
    var newsBtn = newsForm.querySelector("button[type=submit]");
    var newsEmail = newsForm.querySelector("input[type=email]");
    /* Optionale Namensfelder erst ausklappen, wenn jemand loslegt */
    var expand = function () { newsForm.classList.add("is-expanded"); };
    if (newsEmail) { newsEmail.addEventListener("focus", expand); newsEmail.addEventListener("input", expand); }
    var showMsg = function (text, isErr) {
      if (!newsMsg) return;
      newsMsg.textContent = text;
      newsMsg.classList.toggle("is-err", !!isErr);
      newsMsg.hidden = false;
    };
    /* Beschriftungen kommen aus dem Markup (i18n): Original-Label merken,
       Fehlertext aus data-err — das JS bleibt sprachneutral. */
    var newsLabel = newsBtn ? newsBtn.textContent : "";
    var newsErr = newsForm.getAttribute("data-err") || "Bitte später noch einmal versuchen.";
    var newsRestore = function () {
      if (newsBtn) { newsBtn.disabled = false; newsBtn.textContent = newsLabel; }
    };
    newsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(newsForm);
      data.append("ajax", "1");
      if (newsBtn) { newsBtn.disabled = true; newsBtn.textContent = "…"; }
      fetch(newsForm.getAttribute("action"), {
        method: "POST",
        headers: { "X-Requested-With": "fetch" },
        body: data
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          showMsg(res.message, !res.ok);
          if (res.ok) newsForm.classList.add("is-done");
          else newsRestore();
        })
        .catch(function () {
          showMsg(newsErr, true);
          newsRestore();
        });
    });
  }

  /* ---------- Event-Anfrage: absenden ohne Reload, Status inline ---------- */
  var inqForm = document.querySelector(".inquiry-form");
  if (inqForm && window.fetch) {
    var inqBtn = inqForm.querySelector("button[type=submit]");
    var inqMsg = inqForm.querySelector(".inquiry-form__msg");
    var inqLabel = inqBtn ? inqBtn.textContent : "";
    var inqErr = inqForm.getAttribute("data-err") || "Bitte später noch einmal versuchen.";
    var inqShow = function (text, isErr) {
      if (!inqMsg) return;
      inqMsg.textContent = text;
      inqMsg.classList.toggle("is-err", !!isErr);
      inqMsg.hidden = false;
    };
    inqForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(inqForm);
      data.append("ajax", "1");
      if (inqBtn) { inqBtn.disabled = true; inqBtn.textContent = "…"; }
      fetch(inqForm.getAttribute("action"), {
        method: "POST",
        headers: { "X-Requested-With": "fetch" },
        body: data
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          inqShow(res.message, !res.ok);
          if (res.ok) {
            inqForm.classList.add("is-done");
            inqMsg.scrollIntoView({ block: "nearest", behavior: "smooth" });
          } else if (inqBtn) {
            inqBtn.disabled = false; inqBtn.textContent = inqLabel;
          }
        })
        .catch(function () {
          inqShow(inqErr, true);
          if (inqBtn) { inqBtn.disabled = false; inqBtn.textContent = inqLabel; }
        });
    });
  }

  /* ---------- Aktionsleiste (mobil): beim Runterscrollen ausblenden, beim Hochscrollen zeigen ---------- */
  var actionbar = document.querySelector(".actionbar");
  if (actionbar) {
    var lastY = window.scrollY;
    var barTicking = false;
    var updateBar = function () {
      var y = window.scrollY;
      var goingDown = y > lastY;
      /* Nahe am Seitenanfang immer sichtbar; kleine Schwelle gegen Zittern */
      if (Math.abs(y - lastY) > 6) {
        if (goingDown && y > 220) actionbar.classList.add("is-hidden");
        else actionbar.classList.remove("is-hidden");
        lastY = y;
      }
      barTicking = false;
    };
    window.addEventListener("scroll", function () {
      if (!barTicking) { window.requestAnimationFrame(updateBar); barTicking = true; }
    }, { passive: true });
  }

  /* ---------- Haus-Explorer: barrierearme Raumauswahl (Tab-Muster) ---------- */
  var haus = document.querySelector("[data-haus]");
  if (haus) {
    var hxTabs = Array.prototype.slice.call(haus.querySelectorAll("[data-haus-tab]"));
    var hxSelect = function (slug, focus) {
      hxTabs.forEach(function (tab) {
        var on = tab.getAttribute("data-haus-tab") === slug;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      Array.prototype.forEach.call(haus.querySelectorAll("[data-haus-panel]"), function (panel) {
        panel.hidden = panel.getAttribute("data-haus-panel") !== slug;
      });
    };
    haus.addEventListener("click", function (e) {
      var tab = e.target.closest("[data-haus-tab]");
      if (tab) hxSelect(tab.getAttribute("data-haus-tab"), false);
    });
    haus.addEventListener("keydown", function (e) {
      var tab = e.target.closest("[data-haus-tab]");
      if (!tab) return;
      var i = hxTabs.indexOf(tab), n = hxTabs.length, j = -1;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      if (j >= 0) { e.preventDefault(); hxSelect(hxTabs[j].getAttribute("data-haus-tab"), true); }
    });
    /* Deep-Link: events.html#raum-studio öffnet den Raum im Grundriss
       (Rückweg von den Raumseiten, teilbare Links) */
    var hxHash = location.hash.replace("#", "");
    if (hxHash && haus.querySelector('[data-haus-tab="' + hxHash + '"]')) {
      hxSelect(hxHash, false);
      var anchor = document.getElementById("grundriss");
      if (anchor) requestAnimationFrame(function () { anchor.scrollIntoView(); });
    }
  }

  /* ---------- Current year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
