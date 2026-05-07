// source: https://techgleam.com.ua/
// extracted: 2026-05-07T21:22:55.587Z
// scripts: 3

// === script #1 (length=3104) ===
(function () {
  var CUTOFF_HOUR = 18;
  var CUTOFF_MIN  = 0;

  var style = document.createElement('style');
  style.textContent = [
    '.shipTimerWrap{margin-top:14px;margin-bottom:10px;display:block;width:100%;max-width:340px;box-sizing:border-box;font-family:inherit,system-ui,-apple-system,sans-serif;}',
    '.ship-timer-row{display:flex;align-items:center;gap:12px;padding:8px 12px;border:1px solid #dcdcdc;border-radius:8px;background:#fff;box-sizing:border-box;}',
    '.ship-timer-icon{display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;flex-shrink:0;}',
    '.ship-timer-text{font-size:13px;line-height:1.2;color:#333;font-weight:500;text-align:left;flex:1;}',
    '.ship-timer-time{font-variant-numeric:tabular-nums;font-weight:700;font-size:14px;color:#000;background:#f4f4f4;padding:2px 6px;border-radius:4px;white-space:nowrap;flex-shrink:0;}',
    '.ship-cutoff-note{margin-top:6px;font-size:11px;color:#888;text-align:left;padding-left:2px;}',
    '@media(max-width:768px){.shipTimerWrap{max-width:100%;}}'
  ].join('');
  document.head.appendChild(style);

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function secondsLeft() {
    var now    = new Date();
    var cutoff = new Date();
    cutoff.setHours(CUTOFF_HOUR, CUTOFF_MIN, 0, 0);
    return Math.floor((cutoff - now) / 1000);
  }

  function fmt(sec) {
    if (sec <= 0) return null;
    return pad(Math.floor(sec / 3600)) + ':' +
           pad(Math.floor((sec % 3600) / 60)) + ':' +
           pad(sec % 60);
  }

  function insertTimer() {
    if (document.getElementById('shipTimerWrap')) return true;
    if (secondsLeft() <= 0) return true;

    var orderDiv = document.querySelector('.product-order')
                || document.querySelector('.product-card__order-box')
                || document.querySelector('.product-card__purchase');

    if (!orderDiv) return false;

    var wrap = document.createElement('div');
    wrap.id = 'shipTimerWrap';
    wrap.className = 'shipTimerWrap';
    wrap.innerHTML =
      '<div class="ship-timer-row">' +
        '<div class="ship-timer-icon">📦</div>' +
        '<div class="ship-timer-text">Відправимо сьогодні</div>' +
        '<div class="ship-timer-time" id="shipTime">--:--:--</div>' +
      '</div>' +
      '<div class="ship-cutoff-note">При замовленні до 18:00</div>';

    orderDiv.parentNode.insertBefore(wrap, orderDiv.nextSibling);

    var display = document.getElementById('shipTime');
    (function tick() {
      var t = fmt(secondsLeft());
      if (!t) { wrap.style.display = 'none'; return; }
      display.textContent = t;
      setTimeout(tick, 1000);
    })();

    return true;
  }

  function initWithRetry(attempts) {
    if (insertTimer()) return;
    if (attempts <= 0) return;
    setTimeout(function () { initWithRetry(attempts - 1); }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initWithRetry(15); });
  } else {
    initWithRetry(15);
  }
})();

// === script #2 (length=9396) ===
(function () {
  var H = "https://script.google.com/macros/s/AKfycbymbMv3Oi4j9XvXAbItFdV1wSiHYIN36LcXOCBq1eL0eGvXdUTXcK46ctouX97Pjw4/exec?t=br4Wp8nZ6xTm";
  var QK = "tg_order_queue_v1";
  var SK = "tg_order_sent_v1";
  var VK = "tg_visitor_id_v1";
  var CK = "tgvid";
  var flushing = false;
  var inFlight = {};

  function L() { try { console.log.apply(console, arguments); } catch (e) {} }
  function ni() { return new Date().toISOString(); }
  function iCP() { return /^\/checkout\/complete\/\d+\/?$/.test(window.location.pathname || ""); }
  function gOI() {
    var m = (window.location.pathname || "").match(/^\/checkout\/complete\/(\d+)\/?$/);
    return m ? m[1] : "";
  }
  function lj(k, d) {
    try {
      var v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) { return d; }
  }
  function sj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function gq() {
    var q = lj(QK, []);
    return Array.isArray(q) ? q : [];
  }
  function sq(q) { sj(QK, q.slice(-20)); }
  function gsm() {
    var m = lj(SK, {});
    return m && typeof m === "object" ? m : {};
  }
  function mS(id) {
    var s = gsm();
    s["" + id] = ni();
    sj(SK, s);
  }
  function aS(id) { return !!gsm()["" + id]; }
  function enq(p) {
    if (!p || !p.orderId) return;
    var q = gq();
    if (!q.some(function (x) { return "" + x.orderId === "" + p.orderId; })) {
      q.push(p);
      sq(q);
    }
  }
  function deq(id) {
    sq(gq().filter(function (x) { return "" + x.orderId !== "" + id; }));
  }
  function uid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (ch) {
      var r = Math.random() * 16 | 0;
      return (ch === "x" ? r : r & 3 | 8).toString(16);
    });
  }
  function gck(n) {
    var m = document.cookie.match("(?:^|;)\\s*" + n + "=([^;]*)");
    return m ? decodeURIComponent(m[1]) : "";
  }
  function sck(n, v, d) {
    document.cookie = n + "=" + encodeURIComponent(v) +
      "; expires=" + new Date(Date.now() + d * 864e5).toUTCString() +
      "; path=/; SameSite=Lax";
  }
  function gvid() {
    try {
      var ls = localStorage.getItem(VK);
      if (ls) { sck(CK, ls, 365); return ls; }
      var ck = gck(CK);
      if (ck) { localStorage.setItem(VK, ck); return ck; }
      var id = uid();
      localStorage.setItem(VK, id);
      sck(CK, id, 365);
      return id;
    } catch (e) { return "err"; }
  }
  function gcf() {
    try {
      var c = document.createElement("canvas");
      c.width = 300;
      c.height = 60;
      var x = c.getContext("2d");
      x.fillStyle = "#f4a500";
      x.fillRect(0, 0, 300, 60);
      x.fillStyle = "#1a3c5e";
      x.font = "18px Arial,sans-serif";
      x.textBaseline = "alphabetic";
      x.fillText("check 1234 abcd", 5, 42);
      x.fillStyle = "rgba(80,180,50,.85)";
      x.font = "13px Georgia,serif";
      x.fillText("AaBbCc 0987654321", 5, 22);
      return c.toDataURL("image/png").substring(0, 250);
    } catch (e) { return ""; }
  }
  function gwr() {
    try {
      var c = document.createElement("canvas");
      var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return "";
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "").substring(0, 120) : "";
    } catch (e) { return ""; }
  }
  function gfp() {
    try {
      var p = [
        (screen.width || 0) + "x" + (screen.height || 0),
        screen.colorDepth || 0,
        navigator.language || "",
        (navigator.userAgentData ? navigator.userAgentData.platform : "") || "",
        (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ""; } })(),
        navigator.hardwareConcurrency || 0,
        navigator.deviceMemory || 0,
        gcf(),
        gwr()
      ].join("|||");
      var h = 5381;
      for (var i = 0; i < p.length; i++) h = (((h << 5) + h) + p.charCodeAt(i)) & 0xffffffff;
      return (h >>> 0).toString(16);
    } catch (e) { return "err"; }
  }
  async function gip() {
    var ep = ["https://api64.ipify.org?format=json", "https://api.ipify.org?format=json", "https://ipapi.co/json/"];
    for (var i = 0; i < ep.length; i++) {
      try {
        var ct = new AbortController();
        var t = setTimeout(function () { ct.abort(); }, 4000);
        var r = await fetch(ep[i], { cache: "no-store", credentials: "omit", signal: ct.signal });
        clearTimeout(t);
        var d = await r.json();
        if (d && d.ip) return d.ip;
      } catch (e) {}
    }
    return "";
  }
  function jsonp(url, timeoutMs) {
    return new Promise(function (resolve) {
      var cb = "__tg_ip_cb_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      var script = document.createElement("script");
      var done = false;
      var timer;

      function finish(ok, data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (script.parentNode) script.parentNode.removeChild(script);
        window[cb] = function () {};
        setTimeout(function () {
          try { delete window[cb]; } catch (e) { window[cb] = undefined; }
        }, 60000);
        resolve({ ok: ok, data: data || null });
      }

      window[cb] = function (data) { finish(!!(data && data.ok), data); };
      script.async = true;
      script.onerror = function () { finish(false, null); };
      script.src = url + "&cb=" + encodeURIComponent(cb);
      timer = setTimeout(function () { finish(false, null); }, timeoutMs || 9000);
      (document.head || document.documentElement).appendChild(script);
    });
  }
  async function send(pl) {
    if (!pl || !pl.orderId) return false;
    if (inFlight["" + pl.orderId]) return false;
    inFlight["" + pl.orderId] = true;
    try {
      var p = {
        orderId: pl.orderId,
        ip: (pl.ip || "").substring(0, 50),
        visitorId: (pl.visitorId || "").substring(0, 50),
        fingerprint: (pl.fingerprint || "").substring(0, 20),
        renderer: (pl.renderer || "").substring(0, 100),
        ts: pl.ts || "",
        pageUrl: (pl.pageUrl || "").substring(0, 200),
        userAgent: (pl.userAgent || "").substring(0, 200)
      };
      var qs = Object.keys(p).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(p[k]);
      }).join("&");
      var res = await jsonp(H + "&" + qs, 20000);
      if (res.ok) {
        L("[ip-log] confirmed", pl.orderId, res.data && res.data.updated ? "updated" : "written");
        return true;
      }
      L("[ip-log] not confirmed", pl.orderId);
      return false;
    } catch (e) {
      L("[ip-log] failed", pl.orderId, e.message);
      return false;
    } finally {
      delete inFlight["" + pl.orderId];
    }
  }
  function sendUpdateWithRetry(id, pl, attempts) {
    setTimeout(function () {
      send(pl).then(function (ok) {
        if (ok) {
          mS(id);
          deq(id);
        } else if (attempts > 1) {
          sendUpdateWithRetry(id, pl, attempts - 1);
        }
      });
    }, 3000);
  }
  async function flush() {
    if (flushing) return;
    flushing = true;
    try {
      var q = gq();
      for (var i = 0; i < q.length; i++) {
        var it = q[i];
        if (!it || !it.orderId) continue;
        if (aS(it.orderId)) { deq(it.orderId); continue; }
        if (await send(it)) { mS(it.orderId); deq(it.orderId); }
      }
    } finally {
      flushing = false;
    }
  }
  async function run() {
    gvid();
    await flush();
    if (!iCP()) return;
    var id = gOI();
    if (!id || aS(id)) return;
    var ipPromise = gip();
    var ip = await Promise.race([
      ipPromise,
      new Promise(function (resolve) { setTimeout(function () { resolve(""); }, 5000); })
    ]);
    var pl = {
      orderId: "" + id,
      ip: ip || "",
      visitorId: gvid(),
      fingerprint: gfp(),
      renderer: gwr(),
      ts: ni(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent || ""
    };
    if (!ip) {
      ipPromise.then(function (lateIp) {
        if (!lateIp) return;
        var update = {
          orderId: pl.orderId,
          ip: lateIp,
          visitorId: pl.visitorId,
          fingerprint: pl.fingerprint,
          renderer: pl.renderer,
          ts: pl.ts,
          pageUrl: pl.pageUrl,
          userAgent: pl.userAgent
        };
        sendUpdateWithRetry(id, update, 5);
      });
    }
    enq(pl);
    if (await send(pl)) { mS(id); deq(id); return; }
    await new Promise(function (resolve) { setTimeout(resolve, 3000); });
    if (!aS(id) && await send(pl)) { mS(id); deq(id); return; }
    await new Promise(function (resolve) { setTimeout(resolve, 5000); });
    if (!aS(id) && await send(pl)) { mS(id); deq(id); }
  }

  window.addEventListener("pageshow", flush);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("online", flush);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();

// === script #3 (length=715) ===
(function () {
    const toggle = document.getElementById('contactToggle');
    const items  = document.getElementById('contactItems');
    const widget = document.getElementById('contactWidget');

    if (!toggle || !items || !widget) return;

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = items.classList.toggle('active');
      toggle.classList.toggle('active', isOpen); // active => show dots, stop ring (by CSS :not(.active))
    });

    document.addEventListener('click', function (e) {
      if (!widget.contains(e.target)) {
        items.classList.remove('active');
        toggle.classList.remove('active');
      }
    });
  })();
