/*
  Home hero carousel, ported from ip6original.com (components/home/HeroSlideshow.tsx).
  Slide 1 is the product slide. Slides 2 to 6 each type their headline letter by
  letter, lift the tint to reveal the colour photo, hold, then move on. After the
  last slide the show returns to slide 1 and pauses. Dots jump to a slide and
  pause; the play/pause button toggles. Reduced motion shows text at once.
*/
(function () {
  var hero = document.querySelector("[data-ih-hero]");
  if (!hero) return;
  var SLIDES = JSON.parse(hero.querySelector("[data-ih-data]").textContent);
  var TYPE_MS = 42, TYPE_DELAY = 500, REVEAL_AFTER_TYPED = 350, REVEAL_MS = 1400, HOLD_AFTER_REVEAL = 2600, PRODUCT_HOLD = 9000;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = -1, typed = 0, revealed = false, paused = false, timers = [];
  var slideEls = [], textEls = [], videos = [], dotEls = [];
  var product = hero.querySelector("[data-ih-product]");
  var actions = hero.querySelector("[data-ih-actions]");
  var pauseBtn = hero.querySelector("[data-ih-pause]");

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function count(line) { return line.reduce(function (n, s) { return n + s.text.replace(/ /g, "").length; }, 0); }

  // Build slides 2 to 6: picture or video, then the tint layers.
  var slideBox = hero.querySelector("[data-ih-slides]");
  SLIDES.forEach(function (s, i) {
    var slide = el("div", "ih-slide" + (i === 0 ? " ih-slideCentered" : "") + (s.doctor ? " ih-doctorSlide" : "") + (i === 1 ? " ih-yogaSlide" : ""), { role: "group", "aria-roledescription": "slide", "aria-label": (i + 2) + " of " + (SLIDES.length + 1), "aria-hidden": "true" });
    var ph = el("div", "ih-ph");
    var style = "--pos:" + s.pos + ";--pos-m:" + (s.mpos || s.pos);
    if (s.video) {
      var v = el("video", "", { poster: s.src, muted: "", loop: "", playsinline: "", preload: "none", "aria-label": s.alt, style: style });
      v.muted = true;
      v.src = s.video;
      videos[i] = v;
      ph.appendChild(v);
    } else if (s.msrc) {
      var pic = el("picture");
      pic.appendChild(el("source", "", { media: "(max-width: 900px) and (orientation: portrait)", srcset: s.msrc }));
      pic.appendChild(el("img", "", { src: s.src, alt: s.alt, style: style, loading: "lazy" }));
      ph.appendChild(pic);
    } else {
      ph.appendChild(el("img", "", { src: s.src, alt: s.alt, style: style, loading: "lazy" }));
    }
    slide.appendChild(ph);
    slide.appendChild(el("div", "ih-shadow"));
    slide.appendChild(el("div", "ih-light"));
    slide.appendChild(el("div", "ih-dim"));
    slideBox.parentNode.insertBefore(slide, slideBox);
    slideEls[i] = slide;
  });
  slideBox.remove();

  // Words: every slide's text stacked in one cell; letters are spans so they can type in.
  var stack = hero.querySelector("[data-ih-texts]");
  SLIDES.forEach(function (s, i) {
    var t = el("div", "ih-text" + (i === 0 ? " ih-textCentered" : "") + (s.mobileHeadlineOnly ? " ih-headlineOnly" : "") + (s.mobileLow ? " ih-textLow" : "") + (s.mobileTopEyebrow ? " ih-textSplit" : ""), { "aria-hidden": "true" });
    var eb = el("p", "ih-eyebrow"); eb.textContent = s.eyebrow; t.appendChild(eb);
    var line = el("p", "ih-line", { role: "heading", "aria-level": "2" });
    s.line.forEach(function (seg) {
      var wrap = el(seg.em ? "em" : "span");
      Array.prototype.forEach.call(seg.text, function (ch) {
        if (ch === " ") { wrap.appendChild(document.createTextNode(" ")); return; }
        var c = el("span", "ih-chIn"); c.textContent = ch; wrap.appendChild(c);
      });
      line.appendChild(wrap);
    });
    t.appendChild(line);
    if (s.sub) { var sub = el("p", "ih-sub"); sub.textContent = s.sub; t.appendChild(sub); }
    stack.appendChild(t);
    textEls[i] = t;
  });

  // Dots: slide 1 (product) then one per slide.
  var dots = hero.querySelector("[data-ih-dots]");
  for (var d = -1; d < SLIDES.length; d++) {
    (function (idx) {
      var b = el("button", "ih-dot", { type: "button", "aria-label": "Go to slide " + (idx + 2) });
      b.addEventListener("click", function () { paused = true; go(idx); });
      dots.appendChild(b);
      dotEls.push(b);
    })(d);
  }

  function clear() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function render() {
    var s = SLIDES[cur];
    hero.className = "ih-hero" + (cur === -1 ? " ih-productActive" : "") + (s && s.doctor ? " ih-doctorActive" : "") + (cur === 1 ? " ih-yogaActive" : "") + (cur === 0 || cur === 2 ? " ih-viewportVideoActive" : "") + (cur === 3 ? " ih-beachActive" : "");
    product.classList.toggle("ih-on", cur === -1);
    product.setAttribute("aria-hidden", cur === -1 ? "false" : "true");
    product.querySelectorAll("a").forEach(function (a) { if (cur === -1) a.removeAttribute("tabindex"); else a.setAttribute("tabindex", "-1"); });
    actions.setAttribute("aria-hidden", cur === -1 ? "true" : "false");
    slideEls.forEach(function (sl, i) {
      var on = i === cur;
      sl.classList.toggle("ih-on", on);
      sl.classList.toggle("ih-reveal", on && revealed);
      sl.setAttribute("aria-hidden", on ? "false" : "true");
    });
    textEls.forEach(function (t, i) {
      var on = i === cur;
      t.classList.toggle("ih-textOn", on);
      t.classList.toggle("ih-textReveal", on && revealed);
      t.setAttribute("aria-hidden", on ? "false" : "true");
      var seen = 0;
      t.querySelectorAll(".ih-line span.ih-ch, .ih-line span.ih-chIn").forEach(function (c) {
        seen += 1;
        c.className = !on || seen <= typed ? "ih-chIn" : "ih-ch";
      });
    });
    dotEls.forEach(function (b, k) {
      var on = k - 1 === cur;
      b.className = on ? "ih-dotOn" : "ih-dot";
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    pauseBtn.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    pauseBtn.innerHTML = paused
      ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
  }

  function playVideos() {
    videos.forEach(function (v, i) {
      if (!v) return;
      if (i === cur && !reduce) { v.preload = "auto"; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else setTimeout(function () { if (i !== cur) v.pause(); }, 1200);
    });
  }

  // Run one slide: type, reveal, hold, advance.
  function run() {
    clear();
    if (cur === -1) {
      render();
      if (!reduce && !paused) later(function () { if (!paused) go(0, true); }, PRODUCT_HOLD);
      return;
    }
    var s = SLIDES[cur], total = count(s.line);
    if (reduce) { typed = total; revealed = true; render(); return; }
    typed = 0; revealed = false; render();
    for (var k = 1; k <= total; k++) (function (n) { later(function () { typed = n; render(); }, TYPE_DELAY + n * TYPE_MS); })(k);
    var typedAt = TYPE_DELAY + total * TYPE_MS;
    later(function () { revealed = true; render(); }, typedAt + REVEAL_AFTER_TYPED);
    later(function () {
      if (paused) return;
      if (cur === SLIDES.length - 1) { paused = true; go(-1, true); }
      else go(cur + 1, true);
    }, typedAt + REVEAL_AFTER_TYPED + REVEAL_MS + HOLD_AFTER_REVEAL);
  }
  function go(i, auto) {
    cur = i;
    if (!auto) paused = true;
    run();
    playVideos();
  }
  pauseBtn.addEventListener("click", function () {
    paused = !paused;
    if (!paused) run(); else { clear(); render(); }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) clear();
    else if (!paused) run();
  });

  // Fit to the window: below the header, above the FDA bar (as on ip6original.com).
  function fit() {
    var top = hero.getBoundingClientRect().top + window.scrollY;
    var bar = document.getElementById("ip6-disclaimer-bar");
    var barH = bar && !bar.hidden ? bar.getBoundingClientRect().height : 0;
    var vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    hero.style.setProperty("--product-visible-height", Math.max(0, vh - top - barH - 1) + "px");
  }
  fit();
  window.addEventListener("resize", fit);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", fit);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(fit);
    ro.observe(hero);
    var hdr = document.getElementById("header-group") || document.querySelector("header");
    if (hdr) ro.observe(hdr);
    var bar = document.getElementById("ip6-disclaimer-bar");
    if (bar) ro.observe(bar);
  }

  run();
})();
