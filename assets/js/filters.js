/* ==========================================================================
   filters.js — the games library filter/sort, and the article scroll-spy.

   The twelve review cards are present in games.html as ordinary markup, so
   with scripting off the full library is readable and every card links out
   correctly. This file adds filtering, sorting, a live result count, an empty
   state and shareable URLs on top of that.

   GAMES below is the record set the controls operate on. Each entry is tied
   to its card through data-slug, so the array drives the logic while the
   markup stays the single source of the content itself.
   ========================================================================== */
(function () {
  "use strict";

  var GAMES = [
    { slug: "ashfall",          title: "Ashfall Parade",     genre: "action",     platforms: ["pc", "console"],   year: 2025, score: 86 },
    { slug: "solaris",          title: "Solaris Drift",      genre: "racing",     platforms: ["pc"],              year: 2024, score: 78 },
    { slug: "deadline-protocol", title: "Deadline Protocol", genre: "strategy",   platforms: ["pc"],              year: 2025, score: 91 },
    { slug: "filament",         title: "Filament and Bone",  genre: "puzzle",     platforms: ["pc", "handheld"],  year: 2024, score: 83 },
    { slug: "tidewrack",        title: "Tidewrack",          genre: "adventure",  platforms: ["console"],         year: 2025, score: 74 },
    { slug: "nightshift",       title: "Nightshift Courier", genre: "simulation", platforms: ["pc", "console"],   year: 2023, score: 88 },
    { slug: "undertow",         title: "Undertow",           genre: "action",     platforms: ["handheld"],        year: 2025, score: 69 },
    { slug: "cadence",          title: "Cadence Machine",    genre: "puzzle",     platforms: ["pc", "console"],   year: 2024, score: 93 },
    { slug: "orbital-mechanic", title: "Orbital Mechanic",   genre: "strategy",   platforms: ["pc"],              year: 2023, score: 81 },
    { slug: "hauling",          title: "The Long Hauling",   genre: "simulation", platforms: ["console"],         year: 2025, score: 76 },
    { slug: "claw",             title: "Claw Season",        genre: "racing",     platforms: ["handheld"],        year: 2024, score: 72 },
    { slug: "pale-fire",        title: "Pale Fire Station",  genre: "adventure",  platforms: ["pc", "console"],   year: 2025, score: 85 }
  ];

  var library = document.querySelector("[data-library]");

  if (library) {
    var results = library.querySelector("[data-results]");
    var empty = library.querySelector("[data-empty]");
    var count = library.querySelector("[data-count]");
    var reset = library.querySelector("[data-reset]");
    var genreSel = library.querySelector("#filter-genre");
    var platformSel = library.querySelector("#filter-platform");
    var yearSel = library.querySelector("#filter-year");
    var sortSel = library.querySelector("#filter-sort");

    /* Card lookup by slug. A card with no matching record is left visible
       rather than being hidden by a mistake in the data. */
    var cards = {};
    var nodes = results.querySelectorAll("[data-slug]");
    for (var i = 0; i < nodes.length; i++) {
      cards[nodes[i].getAttribute("data-slug")] = nodes[i];
    }

    var SORTS = {
      newest: function (a, b) { return b.year - a.year || b.score - a.score; },
      oldest: function (a, b) { return a.year - b.year || b.score - a.score; },
      score: function (a, b) { return b.score - a.score; },
      title: function (a, b) { return a.title.localeCompare(b.title); }
    };

    function readHash() {
      var state = { genre: "all", platform: "all", year: "all", sort: "newest" };
      var hash = window.location.hash.replace(/^#/, "");
      if (!hash) return state;
      hash.split("&").forEach(function (pair) {
        var bits = pair.split("=");
        var key = decodeURIComponent(bits[0]);
        var value = decodeURIComponent(bits[1] || "");
        if (key in state && value) state[key] = value;
      });
      if (!SORTS[state.sort]) state.sort = "newest";
      return state;
    }

    function writeHash(state) {
      var parts = [];
      ["genre", "platform", "year"].forEach(function (key) {
        if (state[key] && state[key] !== "all") parts.push(key + "=" + state[key]);
      });
      if (state.sort !== "newest") parts.push("sort=" + state.sort);
      var next = parts.length ? "#" + parts.join("&") : " ";
      /* replaceState keeps the back button useful: filtering is not a page. */
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", parts.length ? next : window.location.pathname);
      } else if (parts.length) {
        window.location.hash = parts.join("&");
      }
    }

    function matches(game, state) {
      if (state.genre !== "all" && game.genre !== state.genre) return false;
      if (state.platform !== "all" && game.platforms.indexOf(state.platform) === -1) return false;
      if (state.year !== "all" && String(game.year) !== state.year) return false;
      return true;
    }

    function apply(state, updateHash) {
      var visible = GAMES.filter(function (g) { return matches(g, state); });
      visible.sort(SORTS[state.sort]);

      /* Hide everything, then re-append the survivors in sort order. Reusing
         the existing nodes means no markup is generated by script. */
      GAMES.forEach(function (g) {
        var card = cards[g.slug];
        if (card) card.setAttribute("data-hidden", "true");
      });
      visible.forEach(function (g) {
        var card = cards[g.slug];
        if (!card) return;
        card.removeAttribute("data-hidden");
        results.appendChild(card);
      });

      var n = visible.length;
      if (count) {
        count.textContent = n === GAMES.length
          ? "Showing all " + n + " reviews"
          : "Showing " + n + " of " + GAMES.length + " reviews";
      }
      if (empty) empty.hidden = n !== 0;
      if (results) results.hidden = n === 0;
      if (reset) reset.hidden = (state.genre === "all" && state.platform === "all" &&
                                 state.year === "all" && state.sort === "newest");
      if (updateHash) writeHash(state);
    }

    function stateFromControls() {
      return {
        genre: genreSel ? genreSel.value : "all",
        platform: platformSel ? platformSel.value : "all",
        year: yearSel ? yearSel.value : "all",
        sort: sortSel ? sortSel.value : "newest"
      };
    }

    function syncControls(state) {
      if (genreSel) genreSel.value = state.genre;
      if (platformSel) platformSel.value = state.platform;
      if (yearSel) yearSel.value = state.year;
      if (sortSel) sortSel.value = state.sort;
    }

    [genreSel, platformSel, yearSel, sortSel].forEach(function (control) {
      if (control) {
        control.addEventListener("change", function () { apply(stateFromControls(), true); });
      }
    });

    if (reset) {
      reset.addEventListener("click", function () {
        var state = { genre: "all", platform: "all", year: "all", sort: "newest" };
        syncControls(state);
        apply(state, true);
        if (genreSel) genreSel.focus();
      });
    }

    window.addEventListener("hashchange", function () {
      var state = readHash();
      syncControls(state);
      apply(state, false);
    });

    /* The filter bar is useless without scripting, so the markup ships it
       hidden and it is revealed here. */
    var bar = library.querySelector("[data-filter-bar]");
    if (bar) bar.hidden = false;

    var initial = readHash();
    syncControls(initial);
    apply(initial, false);
  }

  /* ----------------------------------------------------------------------
     SCROLL-SPY for the article and guide tables of contents.
     Marks the entry for the heading currently nearest the top of the reading
     area with aria-current, which is both the styling hook and the thing a
     screen reader announces.
     ---------------------------------------------------------------------- */
  var toc = document.querySelector("[data-toc]");
  if (toc) {
    var entries = Array.prototype.slice.call(toc.querySelectorAll("a[href^='#']"));
    var targets = entries
      .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
      .filter(Boolean);

    if (targets.length) {
      var ticking = false;

      /* The current entry is the last heading past the reading line, a third
         of the way down. Measuring directly avoids any event-order guessing. */
      var mark = function () {
        ticking = false;
        var line = window.innerHeight / 3;
        var best = targets[0];
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].getBoundingClientRect().top <= line) best = targets[i];
        }
        for (var j = 0; j < entries.length; j++) {
          if (entries[j].getAttribute("href") === "#" + best.id) {
            entries[j].setAttribute("aria-current", "true");
          } else {
            entries[j].removeAttribute("aria-current");
          }
        }
      };

      var request = function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(mark);
      };

      window.addEventListener("scroll", request, { passive: true });
      window.addEventListener("resize", request);
      mark();
    }
  }
})();
