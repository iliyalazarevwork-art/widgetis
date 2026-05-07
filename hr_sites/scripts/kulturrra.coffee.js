// source: https://kulturrra.coffee/
// extracted: 2026-05-07T21:19:00.406Z
// scripts: 1

// === script #1 (length=12922) ===
const WIDGET_KEY = 'sessionId';
  const META_KEY   = 'sessionMeta.v1';
  const TTL_MS     = 60 * 60 * 1000;

  const now = () => Date.now();
  const rnd = () => crypto.randomUUID?.() || (now() + '-' + Math.random().toString(36).slice(2));

  function seedOrRefreshSession(){
    let meta; try { meta = JSON.parse(localStorage.getItem(META_KEY)||'null'); } catch {}
    if (!meta?.id || meta.expiresAt <= now()){
      meta = { id: rnd(), expiresAt: now() + TTL_MS };
    } else {
      meta.expiresAt = now() + TTL_MS;
    }
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    localStorage.setItem(WIDGET_KEY, meta.id);
    return meta.id;
  }
  const sessionId = seedOrRefreshSession();

  ['click','keydown','touchstart','visibilitychange','pageshow'].forEach(evt => {
    addEventListener(evt, () => seedOrRefreshSession(), { passive:true });
  });

  import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

  createChat({
    webhookUrl: 'https://n8n.fst-analytics.pp.ua/webhook/92975319-2354-4ced-9a35-7192286b0394/chat',
    chatSessionKey: WIDGET_KEY,
    loadPreviousSession: true,
    initialMessages: [],
    i18n: {
      en: {
        title: '',
        subtitle: "так, я справжній, так, я шарю у спешелті",
        footer: '',
        inputPlaceholder: 'Що підказати сьогодні?',
      },
    },
  });

  (() => {
  const placeBeta = () => {
    const header = document.querySelector('.n8n-chat .chat-header');
    if (!header || header.querySelector('.chat-beta-badge')) return !!header;
    const b = document.createElement('span');
    b.className = 'chat-beta-badge';
    b.textContent = 'Бета-версія';
    header.style.position = 'relative';
    header.appendChild(b);
    return true;
  };
  if (!placeBeta()) {
    new MutationObserver((_, o) => { if (placeBeta()) o.disconnect(); })
      .observe(document.body, { childList: true, subtree: true });
  }
})();

  (() => {
    const OPEN_KEY = 'n8nChat.open.v1';
    const SEL = {
      launcher: '.n8n-chat .chat-launcher, .chat-window-wrapper .chat-window-toggle, .n8n-chat button[aria-label]',
      window:   '.n8n-chat .chat-window'
    };

    const wasOpen = localStorage.getItem(OPEN_KEY) === '1';

    const isVisible = (el) => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };

    const isOpen = () => {
      const launcher = document.querySelector(SEL.launcher);
      if (launcher) {
        const exp = launcher.getAttribute('aria-expanded');
        if (exp !== null) return exp === 'true';
        const label = (launcher.getAttribute('aria-label') || '').toLowerCase();
        if (label.includes('close')) return true;
        if (label.includes('open')) return false;
      }
      return isVisible(document.querySelector(SEL.window));
    };

    const markOpenState = (() => {
      let t = null, last = null;
      const write = () => {
        const open = isOpen();
        if (open !== last) {
          localStorage.setItem(OPEN_KEY, open ? '1' : '0');
          last = open;
        }
        t = null;
      };
      return () => { if (!t) t = setTimeout(write, 50); };
    })();

    const watch = () => {
      const launcher = document.querySelector(SEL.launcher);
      const win = document.querySelector(SEL.window);
      const cfg = { attributes: true, attributeFilter: ['aria-expanded','aria-label','style','class'], subtree: false };

      const mo1 = new MutationObserver(markOpenState);
      const mo2 = new MutationObserver(markOpenState);
      if (launcher) mo1.observe(launcher, cfg);
      if (win) mo2.observe(win, cfg);

      const mo3 = new MutationObserver(markOpenState);
      mo3.observe(document.body, { childList: true, subtree: true });

      markOpenState();
    };

    const tryOpen = () => {
      const launcher = document.querySelector(SEL.launcher);
      if (!launcher) return false;
      if (wasOpen && !isOpen()) setTimeout(() => launcher.click(), 100);
      return true;
    };

    if (!tryOpen()) {
      const obs = new MutationObserver(() => { if (tryOpen()) obs.disconnect(); });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    const bootWatchers = () => {
      const haveBits = document.querySelector(SEL.launcher) || document.querySelector(SEL.window);
      if (haveBits) { watch(); return true; }
      return false;
    };
    if (!bootWatchers()) {
      const obs2 = new MutationObserver((_m, o) => { if (bootWatchers()) o.disconnect(); });
      obs2.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('click', (e) => {
      if (e.target.closest(SEL.launcher)) setTimeout(markOpenState, 0);
    }, true);
  })();

  (() => {
    const SESSION_KEY   = 'sessionId';
    const STORE_PREFIX  = 'n8nChat.history.v5.';
    const LIST_SELECTORS = [
      '.n8n-chat .chat-messages-list',
      '.n8n-chat [class*="messages"]',
      '.n8n-chat .chat-body',
      '.n8n-chat .chat-main'
    ];
    const MSG_SEL  = '.chat-message';
    const BODY_SEL = '.chat-message-markdown';

    const getSID   = () => localStorage.getItem(SESSION_KEY) || '';
    const storeKey = sid => `${STORE_PREFIX}${sid}`;

    const h32 = (s) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return (h >>> 0).toString(36);
    };

    const readCache = (sid) => {
      try { return JSON.parse(localStorage.getItem(storeKey(sid)) || 'null'); } catch { return null; }
    };
    const serializeList = (list) =>
      Array.from(list.querySelectorAll(MSG_SEL)).map(n => ({
        role: n.classList.contains('chat-message-from-user') ? 'user' : 'bot',
        html: (n.querySelector(BODY_SEL) || n).innerHTML
      }));

    const makeWriter = (sid) => {
      let timer = null;
      return (list) => {
        if (timer) return;
        timer = setTimeout(() => {
          try { localStorage.setItem(storeKey(sid), JSON.stringify({ ts: Date.now(), msgs: serializeList(list) })); }
          finally { timer = null; }
        }, 150);
      };
    };

    const findList = () => {
      for (const sel of LIST_SELECTORS) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      const first = document.querySelector('.n8n-chat ' + MSG_SEL);
      return first ? first.parentElement : null;
    };

    const appendMsgNode = (list, msg, mark) => {
      const el = document.createElement('div');
      el.className = `chat-message ${msg.role === 'user' ? 'chat-message-from-user' : 'chat-message-from-bot'}`;
      if (mark) el.dataset.src = mark;
      const body = document.createElement('div');
      body.className = 'chat-message-markdown';
      body.innerHTML = msg.html;
      el.appendChild(body);
      list.appendChild(el);
      return el;
    };

    const restoreFromCache = (list) => {
      const sid = getSID(); if (!sid) return false;
      const data = readCache(sid); if (!data?.msgs?.length) return false;
      for (const m of data.msgs) appendMsgNode(list, m, 'cache');
      list.scrollTop = list.scrollHeight;
      return true;
    };

    const boot = () => {
      const sid = getSID(); if (!sid) return false;
      const list = findList(); if (!list) return false;

      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      restoreFromCache(list);
      list.scrollTop = list.scrollHeight;

      const writeCache = makeWriter(sid);
      const seen = new WeakSet();
      let mutating = false;

      const mo = new MutationObserver(muts => {
        if (mutating) return;
        const toProcess = [];

        for (const m of muts) {
          m.addedNodes.forEach(n => {
            if (!(n instanceof HTMLElement)) return;
            let msg = n.matches?.(MSG_SEL) ? n : n.querySelector?.(MSG_SEL);
            if (!msg || seen.has(msg)) return;
            seen.add(msg);
            toProcess.push(msg);
          });
        }
        if (!toProcess.length) return;

        mutating = true;
        try {
          for (const msg of toProcess) {
            if (msg !== list.lastElementChild) list.appendChild(msg);
          }
        } finally { mutating = false; }

        writeCache(list);
        list.scrollTop = list.scrollHeight;
      });

      mo.observe(list, { childList: true, subtree: true });
      return true;
    };

    if (!boot()) {
      const obs = new MutationObserver((_m, o) => { if (boot()) o.disconnect(); });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('click', (e) => {
      const a = e.target.closest('.n8n-chat .chat-messages-list a');
      if (!a) return;
      e.preventDefault(); window.open(a.href, '_blank', 'noopener');
    });
  })();

  (() => {
    const SESSION_KEY  = 'sessionId';
    const META_KEY     = 'sessionMeta.v1';
    const STORE_VERS   = ['v5','v4','v3'];
    const GREETING     = 'Привіт, чим можу допомогти?';
    const LIST_SEL     = '.n8n-chat .chat-messages-list';

    const now = () => Date.now();
    const newId = () => (crypto.randomUUID?.() || `${now()}-${Math.random().toString(36).slice(2)}`);

    const getSID = () => localStorage.getItem(SESSION_KEY) || '';
    const setSID = (id, ttlMs=60*60*1000) => {
      localStorage.setItem(SESSION_KEY, id);
      localStorage.setItem(META_KEY, JSON.stringify({ id, expiresAt: now()+ttlMs }));
    };

    const clearHistoryFor = (sid) => {
      if (!sid) return;
      for (const v of STORE_VERS) localStorage.removeItem(`n8nChat.history.${v}.${sid}`);
    };

    const injectGreeting = (list, text) => {
      const msg = document.createElement('div');
      msg.className = 'chat-message chat-message-from-bot';
      msg.dataset.src = 'cache';
      const body = document.createElement('div');
      body.className = 'chat-message-markdown';
      body.textContent = text;
      msg.appendChild(body);
      list.appendChild(msg);
    };

    const writeCache = (sid, list) => {
      const msgs = [...list.querySelectorAll('.chat-message')].map(n => ({
        role: n.classList.contains('chat-message-from-user') ? 'user' : 'bot',
        html: (n.querySelector('.chat-message-markdown') || n).innerHTML
      }));
      localStorage.setItem(`n8nChat.history.v5.${sid}`, JSON.stringify({ ts: now(), msgs }));
    };

    const placeButton = () => {
      const header = document.querySelector('.n8n-chat .chat-header');
      if (!header || header.querySelector('.chat-new-btn')) return !!header;

      const btn = document.createElement('button');
      btn.className = 'chat-new-btn';
      btn.type = 'button';
      btn.textContent = '↻';

      btn.addEventListener('click', () => {
        const oldSid = getSID();
        clearHistoryFor(oldSid);

        const newSid = newId();
        setSID(newSid);

        const list = document.querySelector(LIST_SEL);
        if (list) {
          list.innerHTML = '';
          list.style.display = 'flex';
          list.style.flexDirection = 'column';
          // injectGreeting(list, GREETING);
          writeCache(newSid, list);
          list.scrollTop = list.scrollHeight;
        }
        location.reload();
      });

      header.style.position = 'relative';
      header.appendChild(btn);
      return true;
    };

    if (!placeButton()) {
      new MutationObserver((_, obs) => { if (placeButton()) obs.disconnect(); })
        .observe(document.body, { childList: true, subtree: true });
    }
  })();

  (() => {
    const HOOK = 'https://n8n.fst-analytics.pp.ua/webhook/92975319-2354-4ced-9a35-7192286b0394/chat';
    const origFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (url && url.startsWith(HOOK)) {
        if (init.body && typeof init.body === 'string' && init.headers && /json/i.test(init.headers['Content-Type']||'')) {
          try {
            const data = JSON.parse(init.body);
            data[WIDGET_KEY] = localStorage.getItem(WIDGET_KEY) || sessionId;
            init.body = JSON.stringify(data);
          } catch {}
        }
        if (init.body instanceof FormData) {
          init.body.set(WIDGET_KEY, localStorage.getItem(WIDGET_KEY) || sessionId);
        }
      }
      return origFetch(input, init);
    };
  })();
