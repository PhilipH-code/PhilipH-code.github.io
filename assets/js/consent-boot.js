/* Consent-Boot: läuft synchron im <head>, damit der Banner beim Erstbesuch
   mit dem ERSTEN Paint erscheint (sonst wird er auf langsamen Verbindungen
   zum verspäteten LCP-Element) und Wiederkehrer ihn nie aufblitzen sehen.
   Nur eine Klasse am Wurzelelement — alles Weitere macht consent.js. */
(function () {
  var need = 0;
  try { need = parseInt(document.currentScript.getAttribute("data-v"), 10) || 0; } catch (e) {}
  var open = true;
  try {
    var c = JSON.parse(localStorage.getItem("rs-consent"));
    if (c && c.v === need) open = false;
  } catch (e) {}
  if (open) document.documentElement.classList.add("rs-consent-open");
})();
