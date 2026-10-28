/* Rotating ball-and-stick model of the IP6 molecule, the same renderer as ip6original.com (components/home/MoleculeModel). */
(function () {
  var ATOMS_RAW = [{"id": "C1", "element": "C", "position": [1.283, -0.775, 0.65]}, {"id": "C2", "element": "C", "position": [0.077, -1.623, 0.241]}, {"id": "C3", "element": "C", "position": [-1.212, -0.903, 0.642]}, {"id": "C4", "element": "C", "position": [-1.28, 0.454, -0.063]}, {"id": "C5", "element": "C", "position": [-0.073, 1.301, 0.347]}, {"id": "C6", "element": "C", "position": [1.216, 0.581, -0.054]}, {"id": "O11", "element": "O", "position": [2.487, -1.447, 0.275]}, {"id": "P1", "element": "P", "position": [3.613, -1.887, 1.339]}, {"id": "O21", "element": "O", "position": [2.997, -2.723, 2.393]}, {"id": "O31", "element": "O", "position": [4.76, -2.73, 0.587]}, {"id": "O41", "element": "O", "position": [4.263, -0.573, 2.006]}, {"id": "O12", "element": "O", "position": [0.092, -1.82, -1.175]}, {"id": "P2", "element": "P", "position": [0.169, -3.276, -1.856]}, {"id": "O22", "element": "O", "position": [-0.934, -4.12, -1.344]}, {"id": "O32", "element": "O", "position": [0.034, -3.129, -3.454]}, {"id": "O42", "element": "O", "position": [1.58, -3.963, -1.498]}, {"id": "O13", "element": "O", "position": [-2.339, -1.695, 0.259]}, {"id": "P3", "element": "P", "position": [-3.421, -2.247, 1.315]}, {"id": "O23", "element": "O", "position": [-2.729, -3.016, 2.374]}, {"id": "O33", "element": "O", "position": [-4.206, -1.008, 1.978]}, {"id": "O43", "element": "O", "position": [-4.471, -3.203, 0.557]}, {"id": "O14", "element": "O", "position": [-2.484, 1.126, 0.312]}, {"id": "P4", "element": "P", "position": [-3.61, 1.566, -0.751]}, {"id": "O24", "element": "O", "position": [-4.035, 0.385, -1.535]}, {"id": "O34", "element": "O", "position": [-4.878, 2.175, 0.032]}, {"id": "O44", "element": "O", "position": [-3.005, 2.68, -1.744]}, {"id": "O15", "element": "O", "position": [-0.136, 2.568, -0.311]}, {"id": "P5", "element": "P", "position": [-0.211, 3.966, 0.484]}, {"id": "O25", "element": "O", "position": [0.926, 4.059, 1.427]}, {"id": "O35", "element": "O", "position": [-0.137, 5.185, -0.566]}, {"id": "O45", "element": "O", "position": [-1.595, 4.046, 1.302]}, {"id": "O16", "element": "O", "position": [2.342, 1.373, 0.328]}, {"id": "P6", "element": "P", "position": [3.424, 1.926, -0.728]}, {"id": "O26", "element": "O", "position": [2.733, 2.695, -1.787]}, {"id": "O36", "element": "O", "position": [4.475, 2.882, 0.031]}, {"id": "O46", "element": "O", "position": [4.209, 0.686, -1.391]}, {"id": "H1", "element": "H", "position": [1.272, -0.625, 1.73]}, {"id": "H2", "element": "H", "position": [0.125, -2.589, 0.743]}, {"id": "H3", "element": "H", "position": [-1.224, -0.752, 1.721]}, {"id": "H4", "element": "H", "position": [-1.268, 0.303, -1.142]}, {"id": "H5", "element": "H", "position": [-0.085, 1.452, 1.426]}, {"id": "H6", "element": "H", "position": [1.227, 0.431, -1.134]}, {"id": "H31", "element": "H", "position": [5.474, -3.028, 1.168]}, {"id": "H41", "element": "H", "position": [4.686, 0.022, 1.372]}, {"id": "H32", "element": "H", "position": [0.072, -3.969, -3.931]}, {"id": "H42", "element": "H", "position": [2.349, -3.463, -1.804]}, {"id": "H33", "element": "H", "position": [-4.683, -0.458, 1.342]}, {"id": "H43", "element": "H", "position": [-5.154, -3.573, 1.133]}, {"id": "H34", "element": "H", "position": [-5.597, 2.462, -0.548]}, {"id": "H44", "element": "H", "position": [-2.705, 3.483, -1.297]}, {"id": "H35", "element": "H", "position": [-0.177, 6.06, -0.156]}, {"id": "H45", "element": "H", "position": [-2.384, 3.991, 0.746]}, {"id": "H36", "element": "H", "position": [5.157, 3.252, -0.546]}, {"id": "H46", "element": "H", "position": [4.687, 0.137, -0.754]}], BONDS_RAW = [{"from": "C1", "to": "C2", "order": 1}, {"from": "C1", "to": "C6", "order": 1}, {"from": "C1", "to": "O11", "order": 1}, {"from": "C1", "to": "H1", "order": 1}, {"from": "C2", "to": "C3", "order": 1}, {"from": "C2", "to": "O12", "order": 1}, {"from": "C2", "to": "H2", "order": 1}, {"from": "C3", "to": "C4", "order": 1}, {"from": "C3", "to": "O13", "order": 1}, {"from": "C3", "to": "H3", "order": 1}, {"from": "C4", "to": "C5", "order": 1}, {"from": "C4", "to": "O14", "order": 1}, {"from": "C4", "to": "H4", "order": 1}, {"from": "C5", "to": "C6", "order": 1}, {"from": "C5", "to": "O15", "order": 1}, {"from": "C5", "to": "H5", "order": 1}, {"from": "C6", "to": "O16", "order": 1}, {"from": "C6", "to": "H6", "order": 1}, {"from": "O11", "to": "P1", "order": 1}, {"from": "P1", "to": "O21", "order": 2}, {"from": "P1", "to": "O31", "order": 1}, {"from": "P1", "to": "O41", "order": 1}, {"from": "O31", "to": "H31", "order": 1}, {"from": "O41", "to": "H41", "order": 1}, {"from": "O12", "to": "P2", "order": 1}, {"from": "P2", "to": "O22", "order": 2}, {"from": "P2", "to": "O32", "order": 1}, {"from": "P2", "to": "O42", "order": 1}, {"from": "O32", "to": "H32", "order": 1}, {"from": "O42", "to": "H42", "order": 1}, {"from": "O13", "to": "P3", "order": 1}, {"from": "P3", "to": "O23", "order": 2}, {"from": "P3", "to": "O33", "order": 1}, {"from": "P3", "to": "O43", "order": 1}, {"from": "O33", "to": "H33", "order": 1}, {"from": "O43", "to": "H43", "order": 1}, {"from": "O14", "to": "P4", "order": 1}, {"from": "P4", "to": "O24", "order": 2}, {"from": "P4", "to": "O34", "order": 1}, {"from": "P4", "to": "O44", "order": 1}, {"from": "O34", "to": "H34", "order": 1}, {"from": "O44", "to": "H44", "order": 1}, {"from": "O15", "to": "P5", "order": 1}, {"from": "P5", "to": "O25", "order": 2}, {"from": "P5", "to": "O35", "order": 1}, {"from": "P5", "to": "O45", "order": 1}, {"from": "O35", "to": "H35", "order": 1}, {"from": "O45", "to": "H45", "order": 1}, {"from": "O16", "to": "P6", "order": 1}, {"from": "P6", "to": "O26", "order": 2}, {"from": "P6", "to": "O36", "order": 1}, {"from": "P6", "to": "O46", "order": 1}, {"from": "O36", "to": "H36", "order": 1}, {"from": "O46", "to": "H46", "order": 1}];
  var STYLE = {
    C: { radius: 0.38, light: "#a5adb6", color: "#39424c", dark: "#131b25" },
    H: { radius: 0.24, light: "#ffffff", color: "#e1e6ec", dark: "#8694a5" },
    O: { radius: 0.37, light: "#ffafa0", color: "#db342d", dark: "#811e1c" },
    P: { radius: 0.47, light: "#ffe3a0", color: "#e6a02b", dark: "#9b5812" }
  };
  var cen = [0, 1, 2].map(function (k) { return ATOMS_RAW.reduce(function (s, a) { return s + a.position[k]; }, 0) / ATOMS_RAW.length; });
  var ATOMS = ATOMS_RAW.map(function (a) { return { id: a.id, element: a.element, position: a.position.map(function (v, k) { return v - cen[k]; }) }; });
  var BONDS = BONDS_RAW.map(function (b) {
    return { from: ATOMS.findIndex(function (a) { return a.id === b.from; }), to: ATOMS.findIndex(function (a) { return a.id === b.to; }), order: b.order };
  });

  function mount(box) {
    var canvas = box.querySelector("canvas"), still = box.querySelector("img");
    var ctx = canvas && canvas.getContext("2d");
    if (!ctx) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var width = 0, height = 0, frame = 0, last = 0, yaw = 0.35, pitch = -0.32, clock = 0, visible = true, ready = false;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      if (!width || !height) return;
      var scale = (Math.min(width, height) / 14.8) * (1 + 0.02 * Math.sin(clock / 6100));
      var roll = 0.3 * Math.sin(clock / 7300);
      var cx = width / 2 + Math.sin(clock / 4100) * width * 0.012;
      var cy = height / 2 + Math.sin(clock / 3300) * height * 0.02;
      var cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosP = Math.cos(pitch), sinP = Math.sin(pitch), cosR = Math.cos(roll), sinR = Math.sin(roll);
      var pr = ATOMS.map(function (a) {
        var x = a.position[0], y = a.position[1], z = a.position[2];
        var x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY;
        var y2 = y * cosP - z1 * sinP, z2 = y * sinP + z1 * cosP;
        var persp = 34 / (34 - z2);
        return { x: cx + (x1 * cosR - y2 * sinR) * scale * persp, y: cy - (x1 * sinR + y2 * cosR) * scale * persp, z: z2, radius: STYLE[a.element].radius * scale * persp, element: a.element };
      });
      function alphaFor(z) { return Math.min(1, Math.max(0.62, 0.92 + 0.055 * z)); }
      var layers = [];
      BONDS.forEach(function (bond) {
        var a = pr[bond.from], b = pr[bond.to];
        if (!a || !b) return;
        var len = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
        for (var seg = 0; seg < 8; seg++) (function (seg) {
          var s0 = seg / 8, s1 = (seg + 1) / 8, zMid = a.z + (b.z - a.z) * ((s0 + s1) / 2);
          layers.push({ z: zMid, paint: function () {
            ctx.globalAlpha = alphaFor(zMid);
            for (var n = 0; n < bond.order; n++) {
              var off = bond.order === 2 ? (n === 0 ? -1 : 1) * scale * 0.085 : 0;
              ctx.beginPath();
              ctx.moveTo(a.x + (b.x - a.x) * s0 + nx * off, a.y + (b.y - a.y) * s0 + ny * off);
              ctx.lineTo(a.x + (b.x - a.x) * s1 + nx * off, a.y + (b.y - a.y) * s1 + ny * off);
              ctx.lineWidth = scale * (bond.order === 2 ? 0.095 : 0.145);
              ctx.lineCap = "round";
              ctx.strokeStyle = s0 < 0.5 ? STYLE[a.element].color : STYLE[b.element].color;
              ctx.stroke();
            }
          } });
        })(seg);
      });
      pr.forEach(function (p) {
        layers.push({ z: p.z, paint: function () {
          ctx.globalAlpha = alphaFor(p.z);
          var st = STYLE[p.element];
          var g = ctx.createRadialGradient(p.x - 0.35 * p.radius, p.y - 0.4 * p.radius, 0.05 * p.radius, p.x, p.y, p.radius);
          g.addColorStop(0, st.light); g.addColorStop(0.5, st.color); g.addColorStop(1, st.dark);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        } });
      });
      layers.sort(function (p, q) { return p.z - q.z; }).forEach(function (l) { l.paint(); });
      ctx.globalAlpha = 1;
    }
    function tick(now) {
      if (last) { var dt = Math.min(now - last, 64); yaw += dt * Math.PI * 2 / 12000; pitch += dt * Math.PI * 2 / 29000; clock += dt; }
      last = now; draw(); frame = requestAnimationFrame(tick);
    }
    function restart() {
      cancelAnimationFrame(frame); last = 0; draw();
      if (!reduce.matches && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
    new ResizeObserver(function () {
      var b = canvas.getBoundingClientRect(); width = b.width; height = b.height;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
      if (!ready && width) { ready = true; if (still) still.style.visibility = "hidden"; canvas.style.opacity = "1"; }
    }).observe(canvas);
    new IntersectionObserver(function (e) { visible = !!(e[0] && e[0].isIntersecting); restart(); }).observe(canvas);
    reduce.addEventListener("change", restart);
    document.addEventListener("visibilitychange", restart);
    restart();
  }
  document.querySelectorAll("[data-ip6-molecule]").forEach(mount);
})();
