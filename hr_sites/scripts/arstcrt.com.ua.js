// source: https://arstcrt.com.ua/
// extracted: 2026-05-07T21:20:47.245Z
// scripts: 1

// === script #1 (length=3058) ===
(() => {
  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const FLOWERS = ["🌸", "🌼", "🌷"];

  const ZONE_RATIO = 0.15; // 15% екрану

  const CFG = {
    minSize: 12,
    maxSize: 20,
    minVy: 0.05,
    maxVy: 0.25,
    minVx: -0.1,
    maxVx: 0.1,
    sway: 0.5,
    alpha: 0.9,
    fadeZoneRatio: 0.35 // частина зони для fade
  };

  // контейнер зони
  const zone = document.createElement("div");
  Object.assign(zone.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: `${ZONE_RATIO * 100}vh`,
    pointerEvents: "none",
    zIndex: "9999"
  });
  document.body.appendChild(zone);

  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { alpha: true });
  Object.assign(c.style, {
    width: "100%",
    height: "100%"
  });
  zone.appendChild(c);

  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = window.innerWidth;
    H = Math.floor(window.innerHeight * ZONE_RATIO);
    c.width = W * DPR;
    c.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // кількість адаптивна від площі зони
    CFG.count = Math.min(40, Math.floor((W * H) / 20000));
    CFG.fadeZone = Math.floor(H * CFG.fadeZoneRatio);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  const flowers = [];
  function spawn() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      size: rand(CFG.minSize, CFG.maxSize),
      vy: rand(CFG.minVy, CFG.maxVy),
      vx: rand(CFG.minVx, CFG.maxVx),
      phase: rand(0, Math.PI * 2),
      emoji: pick(FLOWERS),
      a: rand(0.6, 0.95)
    };
  }

  function refill() {
    while (flowers.length < CFG.count) flowers.push(spawn());
    while (flowers.length > CFG.count) flowers.pop();
  }
  refill();

  let t0 = performance.now();
  function tick(t) {
    const dt = Math.min(33, t - t0);
    t0 = t;

    ctx.clearRect(0, 0, W, H);

    for (const f of flowers) {
      f.phase += 0.0015 * dt;
      f.x += f.vx * dt + Math.sin(f.phase) * CFG.sway * 0.1 * dt;
      f.y += f.vy * dt;

      // wrap only inside zone
      if (f.y > H + 30) { Object.assign(f, spawn(), { y: -30 }); }
      if (f.x < -30) f.x = W + 30;
      if (f.x > W + 30) f.x = -30;

      const startFadeY = H - CFG.fadeZone;
      const k = (f.y - startFadeY) / CFG.fadeZone;
      const fade = 1 - clamp01(k);

      ctx.globalAlpha = CFG.alpha * f.a * fade;
      ctx.font = `${f.size}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.fillText(f.emoji, f.x, f.y);
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
