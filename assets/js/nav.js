/* ==========================================================================
   nav.js — progressive enhancement for the header.

   Everything here is an upgrade to markup that already works. With scripting
   switched off the navigation renders as a scrollable strip (see the .no-js
   rules in components.css), every link is reachable, and no content is
   withheld. This file only ever makes that experience nicer.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;

  /* Signals that scripting is available. The stylesheet uses .no-js to pick
     the fallback navigation, so removing it switches on the disclosure menu. */
  root.classList.remove("no-js");

  /* ----------------------------------------------------------------------
     THEME
     The stylesheet already honours prefers-color-scheme on its own, so this
     only has to deal with an explicit choice the visitor has made before.
     Because the script is deferred there is a brief moment where a visitor
     whose stored choice differs from their OS setting sees the OS theme. The
     alternative is an inline blocking script, which the brief rules out.
     ---------------------------------------------------------------------- */
  var STORE = "coldopen:theme";

  function readStoredTheme() {
    try {
      var v = localStorage.getItem(STORE);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;   /* private mode, or storage disabled */
    }
  }

  function currentTheme() {
    if (root.hasAttribute("data-theme")) return root.getAttribute("data-theme");
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme, persist) {
    root.setAttribute("data-theme", theme);
    if (persist) {
      try { localStorage.setItem(STORE, theme); } catch (e) { /* ignore */ }
    }
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        theme === "light" ? "Switch to dark theme" : "Switch to light theme"
      );
    }
  }

  var stored = readStoredTheme();
  if (stored) applyTheme(stored, false);

  var themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    applyTheme(currentTheme(), false);
    themeToggle.addEventListener("click", function () {
      applyTheme(currentTheme() === "light" ? "dark" : "light", true);
    });
  }

  /* ----------------------------------------------------------------------
     MOBILE DISCLOSURE MENU
     ---------------------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        nav.setAttribute("data-open", "true");
      } else {
        nav.removeAttribute("data-open");
      }
    };

    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    /* Escape closes the menu and returns focus to the control that opened it,
       which is what a keyboard user expects from a disclosure. */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    /* A click anywhere outside the open panel dismisses it. */
    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    /* Returning to a wide viewport must not leave the panel state stranded. */
    var wide = window.matchMedia("(min-width: 56rem)");
    var onWide = function (event) { if (event.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  }

  /* ----------------------------------------------------------------------
     CURRENT PAGE
     The visual highlight comes from data-page on <body> so that the nav
     markup can stay byte-identical across all twelve pages. Screen readers
     need aria-current as well, and that is added here.
     ---------------------------------------------------------------------- */
  var here = window.location.pathname.split("/").pop() || "index.html";
  var links = document.querySelectorAll(".primary-nav a, .site-footer a");
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute("href");
    if (href === here) links[i].setAttribute("aria-current", "page");
  }

  /* ----------------------------------------------------------------------
     ANCHOR AD — one per page, and it must be dismissible.
     The dismissal is remembered for the session only.
     ---------------------------------------------------------------------- */
  var anchor = document.querySelector(".ad-anchor");
  if (anchor) {
    var DISMISSED = "coldopen:anchor-dismissed";
    var isDismissed = false;
    try { isDismissed = sessionStorage.getItem(DISMISSED) === "1"; } catch (e) { }

    if (isDismissed) {
      anchor.remove();
    } else {
      anchor.hidden = false;
      var close = anchor.querySelector(".ad-anchor__close");
      if (close) {
        close.addEventListener("click", function () {
          anchor.remove();
          try { sessionStorage.setItem(DISMISSED, "1"); } catch (e) { }
        });
      }
    }
  }
})();
