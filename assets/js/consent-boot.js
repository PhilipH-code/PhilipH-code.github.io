/* Consent-Boot: läuft synchron im <head>, damit der Banner beim Erstbesuch
   mit dem ERSTEN Paint erscheint (sonst wird er auf langsamen Verbindungen
   zum verspäteten LCP-Element) und Wiederkehrer ihn nie aufblitzen sehen.
   Nur eine Klasse am Wurzelelement — alles Weitere macht consent.js.
   Als einziges synchrones Skript übernimmt es vier Handgriffe für den ersten
   Paint: html.no-js weg (Fallbacks ohne JavaScript greifen sonst kurz auch bei
   allen anderen), die gespeicherte Bewegungspause und das volle Stylesheet
   einschalten, das neben dem Critical CSS als media="print" lädt, also nie
   blockiert (CSP erlaubt kein onload im HTML), und den Menüknopf bedienen,
   bis main.js da ist. */
(function () {
  document.documentElement.classList.remove("no-js");
  /* Bewegung angehalten (Knopf in Galerie und Footer, main.js): gilt sofort */
  try { if (localStorage.getItem("rs-still") === "1") document.documentElement.classList.add("is-still"); } catch (e) {}
  var css = document.getElementById("css-full");
  if (css) {
    if (css.sheet) css.media = "all";
    else css.addEventListener("load", function () { css.media = "all"; });
  }
  var need = 0;
  try { need = parseInt(document.currentScript.getAttribute("data-v"), 10) || 0; } catch (e) {}
  /* data-v="0": Hinweis im Admin abgeschaltet, dann gibt es keinen Banner */
  var open = need > 0;
  if (open) try {
    var c = JSON.parse(localStorage.getItem("rs-consent"));
    if (c && c.v === need) open = false;
  } catch (e) {}
  if (open) document.documentElement.classList.add("rs-consent-open");

  /* Menüknopf ab dem ersten Paint: main.js kommt beim Erstbesuch auf langsamen
     Verbindungen erst Sekunden später (defer, niedrige Priorität), bis dahin
     wäre der Burger tot. Dieser Notgriff öffnet und schließt das Menü; sobald
     main.js den Burger bindet (window.rsNav), übernimmt es mit Fokus-Falle,
     Escape und Links. Die Stile des offenen Menüs stehen im Critical CSS. */
  document.addEventListener("click", function (e) {
    if (window.rsNav || !e.target.closest) return;
    var b = e.target.closest(".burger");
    var nav = b && document.getElementById("nav");
    if (!nav) return;
    var isOpen = nav.classList.toggle("is-open");
    b.setAttribute("aria-expanded", isOpen ? "true" : "false");
    var sc = document.querySelector(".page-scroll");
    if (sc) sc.style.overflow = isOpen ? "hidden" : "";
  });
})();
