/* Buy controls: one-time or Subscribe & save, quantity, "Add to cart" (stays on the page, header count updates) and "Pre Order Now" (adds, then checkout). */
(function () {
  function add(variant, qty, plan) {
    var item = { id: +variant, quantity: qty };
    if (plan) item.selling_plan = +plan;
    return fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ items: [item] }) })
      .then(function (r) { if (!r.ok) throw new Error('add failed'); return fetch('/cart.js', { headers: { Accept: 'application/json' } }); })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        // Horizon's cart icon listens for "cart:update" and redraws its count from data.itemCount.
        var e = new Event('cart:update', { bubbles: true });
        e.detail = { resource: cart, sourceId: 'ip6-buy', data: { itemCount: cart.item_count, source: 'ip6-buy' } };
        document.dispatchEvent(e);
        return cart;
      });
  }
  document.querySelectorAll('[data-buy]').forEach(function (box) {
    var variant = box.getAttribute('data-variant'), qty = 1, plan = '';
    var out = box.querySelector('[data-qty-value]'), minus = box.querySelector('[data-qty="-1"]'), plus = box.querySelector('[data-qty="1"]');
    var price = box.querySelector('[data-price]'), order = box.querySelector('[data-order]');
    function setQty(n) { qty = Math.max(1, Math.min(20, n)); out.textContent = qty; minus.disabled = qty === 1; plus.disabled = qty === 20; }
    if (minus) minus.addEventListener('click', function () { setQty(qty - 1); });
    if (plus) plus.addEventListener('click', function () { setQty(qty + 1); });
    box.querySelectorAll('input[name^="plan-"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (!r.checked) return;
        plan = r.value;
        price.textContent = '';
        [['now', 'data-plan-price'], ['was', 'data-plan-was'], ['tag', 'data-plan-tag']].forEach(function (p) {
          var t = r.getAttribute(p[1]); if (!t) return;
          var s = document.createElement('span'); s.className = p[0]; s.textContent = t; price.appendChild(s);
        });
        if (order) order.textContent = plan ? order.getAttribute('data-label-sub') : order.getAttribute('data-label-once');
      });
    });
    box.querySelectorAll('[data-add]').forEach(function (btn) {
      var label = btn.textContent, timer;
      btn.addEventListener('click', function () {
        btn.disabled = true;
        add(variant, qty, plan).then(function () {
          btn.textContent = 'Added'; clearTimeout(timer);
          timer = setTimeout(function () { btn.textContent = label; }, 1800);
        }).catch(function () {}).then(function () { btn.disabled = false; });
      });
    });
    box.querySelectorAll('[data-order]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.disabled = true;
        add(variant, qty, plan).then(function () { window.location.href = '/checkout'; }).catch(function () { btn.disabled = false; });
      });
    });
  });
})();
