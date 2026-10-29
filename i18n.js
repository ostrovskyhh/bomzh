// Display-only localization. Saved identifiers, economy and quest rules stay language-neutral.
const I18N = (() => {
  const messages = EN_MESSAGES;
  const CYR = /[А-Яа-яЁё]/;
  const originals = new WeakMap(), attributes = new WeakMap(), cache = new Map();
  const names = new Set();
  const ATTRS = ['title', 'aria-label', 'placeholder', 'alt', 'data-why'];
  const IGNORE = 'script,style,code,pre,textarea,[contenteditable="true"],[data-i18n-ignore],[data-i18n-user],.c2-text,.c2-bubble>b,.chat-msg:not(.c2-msg),.g-motto,.district-notice,.avatar,.top-ava,.chat-ava,#pname';
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const escapeRE = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const EDGE = /^[\s«»"'“”„.,!?…:;·|]+|[\s«»"'“”„.,!?…:;·|]+$/g;
  const aliases = new Map(), phrases = new Map();
  let lang = 'ru', patterns, applying = false, manualBeforeLoad = null, deviceChoice = null;
  try {
    const stored = localStorage.getItem('bomzh.language');
    if (stored === 'ru' || stored === 'en') deviceChoice = stored;
    const previous = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    const device = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || navigator.language || '';
    const saved = previous?.settings?.language;
    lang = saved === 'ru' || saved === 'en' ? saved : stored === 'ru' || stored === 'en' ? stored : previous?.storySeen || previous?.stats?.taps > 0 ? 'ru' : /^en\b/i.test(device) ? 'en' : 'ru';
  } catch (_) { /* Storage is optional in private browsing. */ }

  let lexiconReady = false;
  function ensureLexicon() {
    if (lexiconReady) return;
    lexiconReady = true;
  for (const [ru, en] of Object.entries(messages)) {
    if (/\{\d+\}/.test(ru)) continue;
    const clean = ru.replace(EDGE, '');
    if (clean) aliases.set(clean.toLowerCase(), en.replace(EDGE, ''));
    if (!/^[А-Яа-яЁё]+(?:[ -][А-Яа-яЁё]+)*$/.test(ru)) continue;
    let branch = phrases;
    for (const word of ru.toLowerCase().split(/[ -]+/)) {
      if (!branch.has(word)) branch.set(word, new Map());
      branch = branch.get(word);
    }
    branch.set('', en);
  }
  }

  function phraseText(text) {
    const words = [...text.matchAll(/[А-Яа-яЁё]+/g)];
    let cursor = 0, output = '';
    for (let i = 0; i < words.length; i++) {
      let branch = phrases, best = null, end = i;
      for (let j = i; j < words.length; j++) {
        if (j > i && !/^[ -]+$/.test(text.slice(words[j - 1].index + words[j - 1][0].length, words[j].index))) break;
        branch = branch.get(words[j][0].toLowerCase());
        if (!branch) break;
        if (branch.has('')) { best = branch.get(''); end = j; }
      }
      if (best === null) continue;
      output += text.slice(cursor, words[i].index) + best;
      cursor = words[end].index + words[end][0].length; i = end;
    }
    return output + text.slice(cursor);
  }

  function buildPatterns() {
    patterns = new Map();
    for (const [ru, en] of Object.entries(messages)) {
      const slots = [...ru.matchAll(/\{(\w+)\}/g)];
      if (!slots.length || slots.length > 10) continue;
      const words = (ru.replace(/\{\w+\}/g, '').match(/[А-Яа-яЁё]{2,}/g) || []).sort((a, b) => b.length - a.length);
      if (!words.length) continue;
      const word = words[0].toLowerCase();
      let cursor = 0, source = '';
      for (const slot of slots) {
        source += escapeRE(ru.slice(cursor, slot.index)) + '(.{0,1200}?)';
        cursor = slot.index + slot[0].length;
      }
      source += escapeRE(ru.slice(cursor));
      if (!patterns.has(word)) patterns.set(word, []);
      patterns.get(word).push({ re: new RegExp('^' + source + '$'), en, slots: slots.map(s => s[1]), unsafe: new Set(EN_UNSAFE_SLOTS[ru] || []), fixed: ru.length - slots.length * 3 });
    }
    for (const list of patterns.values()) list.sort((a, b) => b.fixed - a.fixed);
  }

  function translate(text, depth = 0) {
    text = String(text ?? '');
    if (lang !== 'en' || !CYR.test(text) || text.length > 12000) return text;
    ensureLexicon();
    const key = norm(text);
    const left = text.match(/^\s*/)[0], right = text.match(/\s*$/)[0];
    if (cache.has(key)) return left + cache.get(key) + right;
    let result = messages[key], protectedValues = false;
    if (result === undefined && !/\{\d+\}/.test(key)) {
      const clean = key.replace(EDGE, ''), alias = aliases.get(clean.toLowerCase());
      if (alias !== undefined) {
        const start = key.indexOf(clean);
        result = key.slice(0, start) + alias + key.slice(start + clean.length);
      }
    }
    if (result === undefined && depth < 5) {
      if (!patterns) buildPatterns();
      const words = new Set((key.match(/[А-Яа-яЁё]{2,}/g) || []).map(w => w.toLowerCase()));
      const candidates = [];
      for (const word of words) if (patterns.has(word)) candidates.push(...patterns.get(word));
      candidates.sort((a, b) => b.fixed - a.fixed);
      for (const pattern of candidates) {
        const match = pattern.re.exec(key);
        if (!match) continue;
        const values = {};
        pattern.slots.forEach((slot, i) => { const value = match[i + 1], protectedValue = pattern.unsafe.has(slot) || names.has(value); protectedValues ||= protectedValue; values[slot] = protectedValue ? value : translate(value, depth + 1); });
        result = pattern.en.replace(/\{(\w+)\}/g, (all, id) => values[id] ?? all);
        break;
      }
      if (result === undefined) {
        // Concatenated messages retain their punctuation and paragraph breaks.
        const pieces = text.split(/(\n+|\s+[·|]\s+|(?<=[.!?])\s+)/);
        if (pieces.length > 1) result = pieces.map(p => CYR.test(p) ? translate(p, depth + 1) : p).join('');
      }
    }
    if (result === undefined && depth < 5) {
      // Emoji / counters often surround a dynamically supplied item or NPC label.
      const first = key.search(CYR), letters = [...key.matchAll(/[А-Яа-яЁё]/g)];
      const last = letters.at(-1)?.index + 1;
      if (first > 0 || last < key.length) {
        const middle = translate(key.slice(first, last), depth + 1);
        if (!CYR.test(middle)) result = key.slice(0, first) + middle + key.slice(last);
      }
    }
    if (result === undefined) result = key;
    if (CYR.test(result) && !protectedValues) result = phraseText(result);
    if (cache.size > 5000) cache.clear();
    if (!CYR.test(result) || protectedValues) cache.set(key, result);
    return left + result + right;
  }

  function ignored(el) { return !el || !!el.closest(IGNORE); }
  function textNode(node) {
    if (ignored(node.parentElement)) return;
    const current = node.nodeValue;
    let record = originals.get(node);
    if (!record || current !== record.output) record = { input: current, output: current };
    const output = lang === 'en' ? translate(record.input) : record.input;
    const action = node.parentElement?.closest('button[data-act]')?.dataset.act;
    const contextual = lang === 'en' ? ({ bjHit: 'Hit', bjStand: 'Stand', bjDouble: 'Double down' })[action] : null;
    const display = contextual && node.parentElement.tagName === 'BUTTON' ? contextual : output;
    record.output = display; originals.set(node, record);
    if (current !== display) node.nodeValue = display;
  }
  function element(el) {
    if (ignored(el)) return;
    let records = attributes.get(el);
    if (!records) { records = {}; attributes.set(el, records); }
    for (const attr of ATTRS) {
      const value = el.getAttribute(attr);
      if (value === null) { delete records[attr]; continue; }
      let record = records[attr];
      if (!record || value !== record.output) record = { input: value, output: value };
      const output = lang === 'en' ? translate(record.input) : record.input;
      record.output = output; records[attr] = record;
      if (value !== output) el.setAttribute(attr, output);
    }
  }
  function tree(root = document.body) {
    if (!root || applying) return;
    applying = true;
    try {
      if (root.nodeType === 3) { textNode(root); return; }
      if (root.nodeType !== 1 && root.nodeType !== 9) return;
      if (root.nodeType === 1) element(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (node.nodeType === 1 && ignored(node)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let node;
      while ((node = walker.nextNode())) { if (node.nodeType === 3) textNode(node); else element(node); }
    } finally { applying = false; }
  }
  function refreshButtons() {
    document.querySelectorAll('[data-i18n-default-name]').forEach(el => { el.textContent = lang === 'en' ? 'Valera' : 'Валера'; });
    const user = tg?.initDataUnsafe?.user;
    if (!S.name && !(user?.first_name || user?.username) && document.getElementById('pname')) document.getElementById('pname').textContent = lang === 'en' ? 'Valera' : 'Валера';
    document.querySelectorAll('[data-act="setLanguage"]').forEach(b => {
      const selected = b.dataset.id === lang;
      b.classList.toggle('on', selected); b.setAttribute('aria-pressed', String(selected));
    });
  }
  function setLanguage(value, options = {}) {
    if (value !== 'en' && value !== 'ru') return false;
    lang = value; cache.clear();
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'Hobo Simulator' : 'Бомж';
    if (typeof S !== 'undefined') {
      S.settings ||= {}; S.settings.language = lang;
      if (S.name) names.add(S.name);
    }
    try { localStorage.setItem('bomzh.language', lang); } catch (_) {}
    tree(); refreshButtons();
    if (options.save !== false) {
      if (typeof LOADED !== 'undefined' && !LOADED) manualBeforeLoad = lang;
      if (typeof saveSoon === 'function') saveSoon();
      if (typeof apiPost === 'function' && typeof tg !== 'undefined' && tg?.initData) apiPost('language/set', { language: lang }).catch(() => {});
    }
    return true;
  }
  function rememberUsers(route, value) {
    if (!/(?:chat|online|duel|friends|gang|yard|district|case.*feed|dice)/.test(route)) return;
    const walk = (item, depth) => {
      if (!item || typeof item !== 'object' || depth > 7) return;
      const person = item.uid != null || item.pid != null || item.me !== undefined || item.role !== undefined || item.members !== undefined || item.badge !== undefined || item.stats !== undefined;
      if (person && typeof item.name === 'string') names.add(item.name);
      if (Array.isArray(item)) item.slice(0, 150).forEach(x => walk(x, depth + 1));
      else Object.values(item).forEach(x => walk(x, depth + 1));
    };
    walk(value, 0);
    if (names.size > 5000) { names.clear(); if (S.name) names.add(S.name); }
  }
  function originalText(el) {
    if (!el) return '';
    if (el.nodeType === 3) return originals.get(el)?.input ?? el.nodeValue;
    return Array.from(el.childNodes, n => originalText(n)).join('');
  }
  function languageCard() {
    return `<section class="language-card" data-i18n-ignore><div><b>🌐 Язык / Language</b><small>Можно сменить позже · Change anytime</small></div><div class="language-options" role="group" aria-label="Язык / Language"><button class="btn ${lang === 'ru' ? 'on' : ''}" data-act="setLanguage" data-id="ru" aria-pressed="${lang === 'ru'}">Русский</button><button class="btn ${lang === 'en' ? 'on' : ''}" data-act="setLanguage" data-id="en" aria-pressed="${lang === 'en'}">English</button></div></section>`;
  }
  HOOKS.load.push(() => {
    const saved = S.settings?.language;
    const existing = S.storySeen || (S.stats?.taps || 0) > 0;
    setLanguage(manualBeforeLoad || (saved === 'en' || saved === 'ru' ? saved : deviceChoice || (existing ? 'ru' : lang)), { save: false });
  });
  Object.assign(ACTIONS, { setLanguage: id => { setLanguage(id); haptic('light'); } });
  const observer = new MutationObserver(records => {
    const roots = new Set();
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(n => roots.add(n));
      else roots.add(record.target);
    }
    for (const root of roots) if (root.isConnected) tree(root);
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    for (const name of ['fillText', 'strokeText', 'measureText']) {
      const original = CanvasRenderingContext2D.prototype[name];
      CanvasRenderingContext2D.prototype[name] = function (text, ...args) { return original.call(this, translate(text), ...args); };
    }
  }
  for (const name of ['alert', 'confirm', 'prompt']) {
    const original = window[name];
    if (typeof original === 'function') window[name] = (text, ...args) => original.call(window, translate(text), ...args);
  }
  const telegram = window.Telegram?.WebApp;
  if (telegram) {
    for (const name of ['showAlert', 'showConfirm']) {
      const original = telegram[name];
      if (typeof original === 'function') telegram[name] = (text, ...args) => original.call(telegram, translate(text), ...args);
    }
    if (telegram.showPopup) {
      const original = telegram.showPopup;
      telegram.showPopup = (params, ...args) => original.call(telegram, { ...params, title: translate(params.title), message: translate(params.message), buttons: params.buttons?.map(b => ({ ...b, ...(b.text ? { text: translate(b.text) } : {}) })) }, ...args);
    }
  }
  document.documentElement.lang = lang;
  return { get lang() { return lang; }, t: translate, apply: tree, setLanguage, languageCard, originalText, rememberUsers, messages, ignored };
})();

