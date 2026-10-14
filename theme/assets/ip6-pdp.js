/* Shared PDP behavior for IP6 product + pet-product sections.
   Each section marks its root with [data-ip6-pdp] and tags elements with
   data-* hooks; this script wires plan/format/gallery/price/buy bar for
   every instance.

   Plans: .plan[data-plan="subscribe"] carries data-discount (percent) and
   data-cycle (days). A .plan[data-plan="onetime"] (pet section) or a
   [data-plan-onetime] text button (supplement section) switches to a
   one-time purchase. */
(function () {
  function money(c) { return '$' + (c / 100).toFixed(2); }

  function initPdp(root) {
    var planInput = root.querySelector('[data-plan-input]');
    var vidInput = root.querySelector('[data-vid-input]');
    var main = root.querySelector('[data-main-img]');
    var plans = Array.prototype.slice.call(root.querySelectorAll('.plan'));
    var oneTimeBtn = root.querySelector('[data-plan-onetime]');
    var state = { price: parseInt(root.getAttribute('data-onetime'), 10) || 0, plan: 'subscribe', discount: 15, cycle: 30 };

    function activePlan() {
      for (var i = 0; i < plans.length; i++) if (plans[i].getAttribute('data-active') === 'true') return plans[i];
      return null;
    }
    function setAll(sel, text) { root.querySelectorAll(sel).forEach(function (e) { e.textContent = text; }); }

    function refresh() {
      var current = state.plan === 'subscribe' ? Math.round(state.price * (1 - state.discount / 100)) : state.price;
      // Per-tier prices
      plans.forEach(function (p) {
        var d = parseInt(p.getAttribute('data-discount'), 10);
        if (isNaN(d)) d = 15;
        var now = p.querySelector('[data-plan-now]'), was = p.querySelector('[data-plan-was]');
        if (now) now.textContent = money(Math.round(state.price * (1 - d / 100)));
        if (was) was.textContent = money(state.price);
      });
      // Legacy hooks (pet section)
      setAll('[data-sub-now]', money(Math.round(state.price * 0.85)));
      setAll('[data-sub-was]', money(state.price));
      setAll('[data-ot-now]', money(state.price));
      // Current price everywhere (buy button, price line, sticky bar)
      setAll('[data-atc]', money(current));
      var pct = root.querySelector('[data-pct]');
      if (pct) pct.textContent = 'Save ' + state.discount + '%';
      setAll('[data-bar-plan]', state.plan === 'subscribe' ? 'Every ' + state.cycle + ' days' : 'One-time');
      root.setAttribute('data-mode', state.plan);
      if (oneTimeBtn) {
        oneTimeBtn.textContent = state.plan === 'onetime'
          ? (oneTimeBtn.getAttribute('data-label-sub') || 'Subscribe & save instead')
          : 'One-time purchase · ' + money(state.price);
      }
    }

    function selectPlan(p) {
      plans.forEach(function (x) { x.setAttribute('data-active', 'false'); x.setAttribute('aria-checked', 'false'); });
      if (p) { p.setAttribute('data-active', 'true'); p.setAttribute('aria-checked', 'true'); }
      state.plan = p ? (p.getAttribute('data-plan') || 'subscribe') : 'onetime';
      if (state.plan === 'subscribe') {
        var d = parseInt(p.getAttribute('data-discount'), 10);
        state.discount = isNaN(d) ? 15 : d;
        var c = parseInt(p.getAttribute('data-cycle'), 10);
        state.cycle = isNaN(c) ? 30 : c;
      }
      var id = p ? p.getAttribute('data-selling-plan') : null;
      if (planInput) {
        if (state.plan === 'subscribe' && id) { planInput.value = id; planInput.disabled = false; }
        else { planInput.value = ''; planInput.disabled = true; }
      }
      refresh();
    }

    plans.forEach(function (p) {
      p.addEventListener('click', function () { selectPlan(p); });
      p.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectPlan(p); } });
    });

    if (oneTimeBtn) {
      oneTimeBtn.addEventListener('click', function () {
        if (state.plan === 'onetime') {
          var first = plans.filter(function (p) { return p.getAttribute('data-plan') === 'subscribe'; })[0];
          selectPlan(first || null);
        } else {
          selectPlan(null);
        }
      });
    }

    var fmt = root.querySelector('.formats');
    if (fmt) {
      fmt.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          fmt.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
          if (vidInput) vidInput.value = b.getAttribute('data-vid');
          state.price = parseInt(b.getAttribute('data-price'), 10) || state.price;
          refresh();
        });
      });
    }

    root.querySelectorAll('.thumbs button').forEach(function (t) {
      t.addEventListener('click', function () {
        root.querySelectorAll('.thumbs button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        t.setAttribute('aria-pressed', 'true');
        if (main) main.src = t.getAttribute('data-src');
      });
    });

    // Sticky buy bar: show once the main button has scrolled above the viewport.
    var bar = root.querySelector('[data-buybar]');
    var anchor = root.querySelector('[data-atc-anchor]');
    if (bar && anchor && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        var e = entries[0]; if (!e) return;
        var on = !e.isIntersecting && e.boundingClientRect.top < 0;
        bar.classList.toggle('is-on', on);
        bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      }, { threshold: 0 });
      io.observe(anchor);
    }

    var initial = activePlan();
    if (initial) selectPlan(initial); else refresh();
  }

  function boot() { document.querySelectorAll('[data-ip6-pdp]').forEach(initPdp); }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
