/* Shared PDP behavior for IP6 product + pet-product sections.
   Each section marks its root with [data-ip6-pdp] and tags elements with
   data-* hooks; this script wires plan/format/gallery/price for every instance. */
(function () {
  function money(c) { return '$' + (c / 100).toFixed(2); }

  function initPdp(root) {
    var planInput = root.querySelector('[data-plan-input]');
    var vidInput = root.querySelector('[data-vid-input]');
    var atc = root.querySelector('[data-atc]');
    var subNow = root.querySelector('[data-sub-now]'),
        subWas = root.querySelector('[data-sub-was]'),
        otNow = root.querySelector('[data-ot-now]');
    var main = root.querySelector('[data-main-img]');
    var state = { price: parseInt(root.getAttribute('data-onetime'), 10) || 0, plan: 'subscribe' };

    function refresh() {
      var s = Math.round(state.price * 0.85);
      if (subNow) subNow.textContent = money(s);
      if (subWas) subWas.textContent = money(state.price);
      if (otNow) otNow.textContent = money(state.price);
      if (atc) atc.textContent = money(state.plan === 'subscribe' ? s : state.price);
    }

    root.querySelectorAll('.plan').forEach(function (p) {
      p.addEventListener('click', function () {
        root.querySelectorAll('.plan').forEach(function (x) {
          x.setAttribute('data-active', 'false');
          x.setAttribute('aria-checked', 'false');
        });
        p.setAttribute('data-active', 'true');
        p.setAttribute('aria-checked', 'true');
        state.plan = p.getAttribute('data-plan');
        var id = p.getAttribute('data-selling-plan');
        if (planInput) {
          if (state.plan === 'subscribe' && id) { planInput.value = id; planInput.disabled = false; }
          else { planInput.value = ''; planInput.disabled = true; }
        }
        refresh();
      });
    });

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

    refresh();
  }

  function boot() { document.querySelectorAll('[data-ip6-pdp]').forEach(initPdp); }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
