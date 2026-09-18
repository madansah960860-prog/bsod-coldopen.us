/* ==========================================================================
   consent.js — cookie consent wired to Google Consent Mode v2.

   Order of events, which matters: defaults are pushed to the dataLayer as
   DENIED before anything else; the banner is shown unless a choice is stored;
   and a consent *update* is pushed only once the visitor grants something.
   Nothing reaches localStorage until they choose, so a first-time reader who
   ignores the banner is neither tracked nor stored.

   DEPLOYMENT NOTE: when the real AdSense or gtag.js tag is uncommented, the
   consent default block below must execute before that tag loads. Move the
   `gtag('consent', 'default', ...)` call into an inline <script> in <head>
   placed above the vendor tag, or keep this file first in the script order
   and load the vendor tag from the callback at the bottom of this file.
   ========================================================================== */
(function () {
  "use strict";

  var STORE = "coldopen:consent";
  var VERSION = 1;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  /* DEFAULTS — every advertising and analytics purpose starts denied.
     functionality_storage and security_storage are granted: they carry no
     tracking, covering only the theme preference and anti-fraud. */
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });

  function read() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return null;
      var saved = JSON.parse(raw);
      return saved && saved.v === VERSION ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function save(choice) {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        v: VERSION,
        ads: !!choice.ads,
        analytics: !!choice.analytics,
        at: new Date().toISOString()
      }));
    } catch (e) { /* storage unavailable; the choice applies to this page only */ }
  }

  function push(choice) {
    gtag("consent", "update", {
      ad_storage: choice.ads ? "granted" : "denied",
      ad_user_data: choice.ads ? "granted" : "denied",
      ad_personalization: choice.ads ? "granted" : "denied",
      analytics_storage: choice.analytics ? "granted" : "denied"
    });
    /* Styling hook. A different attribute name from the banner's, so a
       selector can never match the wrong element. */
    document.documentElement.setAttribute(
      "data-consent-state",
      choice.ads ? "ads" : (choice.analytics ? "analytics" : "denied")
    );

    /* Hook for the real vendor tag. Loading it from here guarantees it can
       never run before a grant exists. */
    if (choice.ads && typeof window.loadAdVendor === "function") {
      window.loadAdVendor();
    }
  }

  var saved = read();
  if (saved) push(saved);

  var banner = document.querySelector("[data-consent-banner]");
  if (!banner) return;

  var adsBox = banner.querySelector("#consent-ads");
  var analyticsBox = banner.querySelector("#consent-analytics");
  var lastFocused = null;

  /* moveFocus is true only when the visitor asked for the banner. On a first
     visit the banner must not steal focus or scroll the page out from under
     someone who has already started reading. */
  function open(moveFocus) {
    lastFocused = document.activeElement;
    var current = read() || { ads: false, analytics: false };
    if (adsBox) adsBox.checked = !!current.ads;
    if (analyticsBox) analyticsBox.checked = !!current.analytics;
    banner.hidden = false;
    if (moveFocus) {
      var first = banner.querySelector("input, button");
      if (first) first.focus();
    }
  }

  function close() {
    banner.hidden = true;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  function decide(choice) {
    save(choice);
    push(choice);
    close();
  }

  banner.addEventListener("click", function (event) {
    var action = event.target.getAttribute && event.target.getAttribute("data-action");
    if (!action) return;
    if (action === "accept") decide({ ads: true, analytics: true });
    if (action === "reject") decide({ ads: false, analytics: false });
    if (action === "save") {
      decide({
        ads: adsBox ? adsBox.checked : false,
        analytics: analyticsBox ? analyticsBox.checked : false
      });
    }
  });

  /* Escape is treated as "not now": it dismisses without granting anything
     and without storing a choice, so the banner returns on the next visit. */
  banner.addEventListener("keydown", function (event) {
    if (event.key === "Escape") close();
  });

  /* Any "Cookie preferences" control on the page reopens the banner. */
  var openers = document.querySelectorAll("[data-consent-open]");
  for (var i = 0; i < openers.length; i++) {
    openers[i].addEventListener("click", function (event) {
      event.preventDefault();
      open(true);
    });
  }

  if (!saved) open(false);
})();
