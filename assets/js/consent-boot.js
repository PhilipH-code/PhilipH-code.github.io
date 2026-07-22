/* Consent-Boot: läuft synchron im <head>, damit der Banner beim Erstbesuch
   mit dem ERSTEN Paint erscheint (sonst wird er auf langsamen Verbindungen
   zum verspäteten LCP-Element) und Wiederkehrer ihn nie aufblitzen sehen.
   Nur eine Klasse am Wurzelelement — alles Weitere macht consent.js. */
(function () {
  var open = true;
  try {
    var c = JSON.parse(localStorage.getItem("rs-consent"));
    if (c && c.v) open = false;
  } catch (e) {}
  if (open) document.documentElement.classList.add("rs-consent-open");
})();
