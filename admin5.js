// Рассылка 4.5: кому (все, онлайн, город, VIP, уровни, конкретные игроки), шаблоны, кнопка в окне,
// срок показа, живой предпросмотр «как увидит игрок», счётчик получателей и история с «кто видел» и остановкой.

const BC_BTNS = {
  donate: ['🟡', 'Открыть донат', () => openDonate()],
  shop: ['🛒', 'В магазин', () => showScreen('shop')],
  casino: ['🎰', 'В казино', () => showScreen('fun', 'casino')],
  cases: ['📦', 'К кейсам', () => ACTIONS.cases()],
  story: ['📖', 'К сюжету', () => showScreen('tasks', 'story')],
  tour: ['🏆', 'К турниру', () => showScreen('fun', 'fights')],
  gang: ['🏴', 'В банду', () => showScreen('fun', 'clan')],
  pass: ['🎫', 'К батл-пассу', () => showScreen('tasks', 'pass')],
};
ACTIONS.bcGo = (id) => { closeModal(); const b = BC_BTNS[id]; if (b) setTimeout(b[2], 80); };

const BC_EMOJI = ['📢', '🎉', '🔥', '🎁', '🏆', '⚠️', '🛠️', '💰', '🌵', '❤️'];
const BC_AUD = [['all', '👥 Всем'], ['online', '🟢 Кто в игре'], ['city', '📍 Город'], ['vip', '👑 VIP'], ['level', '⭐ Уровни'], ['player', '🎯 Конкретным']];
const BC_TPL = [
  { e: '🛠️', t: 'Технические работы', x: 'Сегодня с 03:00 до 03:30 по Москве сервер на обслуживании. Прогресс не потеряется — просто зайди чуть позже.', btn: '' },
  { e: '🔥', t: 'Акция в донате', x: 'Только сегодня — скидки на наборы и крышки. Загляни в донат, пока акция не кончилась!', btn: 'donate' },
  { e: '🎉', t: 'Вышло обновление', x: 'В игре много нового — закрой и заново открой игру, чтобы всё увидеть.', btn: '' },
  { e: '🏆', t: 'Турнир сегодня', x: 'Сегодня вторник — турнир! Бои открываются каждый час, побеждает сильнейший.', btn: 'tour' },
  { e: '🎁', t: 'Подарок от администрации', x: 'Спасибо, что играешь! Загляни в игру — тебя ждёт сюрприз.', btn: '' },
];
let BC = { aud: { kind: 'all', city: 'zas', min: 1, max: 99, uids: '' }, emoji: '📢', title: '', text: '', btn: '', days: 7, bot: false, count: null, hist: null, timer: 0 };

function bcAudText(a) {
  if (!a || a.kind === 'all') return 'всем';
  if (a.kind === 'online') return 'кто в игре';
  if (a.kind === 'city') return { zas: 'в Засранске', msk: 'в Москвабаде', mex: 'в Мексике' }[a.city] || 'в городе';
  if (a.kind === 'vip') return 'с VIP';
  if (a.kind === 'level') return `уровни ${a.min}–${a.max}`;
  if (a.kind === 'player') return `игрокам: ${(a.uids || []).length || String(a.uids || '').split(/[ ,]+/).filter(Boolean).length}`;
  return '';
}
function bcPreview() {
  const go = BC.btn && BC_BTNS[BC.btn];
  return `<div class="bc-pop bc-preview"><div class="bc-e">${esc(BC.emoji)}</div><h3>${esc(BC.title || 'Заголовок')}</h3><p>${esc(BC.text || 'Текст сообщения').replace(/\n/g, '<br>')}</p>
    <small class="fb-note">Сообщение от администрации · сейчас</small>
    <div class="btns" style="flex-direction:column;gap:6px">${go ? `<button class="btn primary wide" disabled>${go[0]} ${go[1]}</button><button class="btn wide" disabled>Позже</button>` : '<button class="btn primary wide" disabled>Понятно</button>'}</div></div>`;
}
function bcHistHTML() {
  const h = BC.hist;
  if (!adm4Online()) return '';
  if (!h) return '<div class="adm4-empty">Загружаю историю…</div>';
  if (!h.length) return '<div class="adm4-empty">Рассылок ещё не было</div>';
  return h.map((b) => `<div class="bc-h ${b.live ? 'live' : ''}"><span>${esc(b.emoji)}</span><div><b>${esc(b.title)}</b>
      <small>${timeStr(b.ts * 1000)} · ${bcAudText(b.aud)}${b.btn && BC_BTNS[b.btn] ? ` · кнопка «${BC_BTNS[b.btn][1]}»` : ''}</small>
      <small>👁 видели ${b.seen}${b.count ? ` из ${b.count}` : ''}${b.botTo ? ` · 🤖 в бота ${b.botTo}` : ''} · ${b.live ? `🟢 показывается до ${new Date(b.until * 1000).toLocaleDateString('ru-RU')}` : '⚪ завершена'}</small></div>
      ${b.live ? `<button class="btn small" data-act="bcStop" data-id="${b.id}">⏹</button>` : ''}</div>`).join('');
}
function bcHTML() {
  const a = BC.aud;
  const chip = (cur, val, label, act) => `<button class="${cur === val ? 'on' : ''}" data-act="${act}" data-id="${val}">${label}</button>`;
  const audExtra = a.kind === 'city' ? `<div class="bc-chips">${[['zas', '🏚️ Засранск'], ['msk', '🏙️ Москвабад'], ['mex', '🌵 Мексика']].map(([v, t]) => chip(a.city, v, t, 'bcCity')).join('')}</div>`
    : a.kind === 'level' ? `<div class="bc-row"><span>с</span><input id="bcLmin" type="number" inputmode="numeric" value="${a.min}"><span>по</span><input id="bcLmax" type="number" inputmode="numeric" value="${a.max}"><span>уровень</span></div>`
    : a.kind === 'player' ? `<input id="bcUids" placeholder="Telegram ID через пробел или запятую" value="${esc(a.uids)}"><small class="bc-hint">ID видно в карточке игрока во вкладке «Игроки»</small>` : '';
  const left = 600 - BC.text.length;
  return `<div class="adm4 bc"><div class="adm4-top"><div><b>📢 Рассылка</b><small>Окно у игроков при входе в игру</small></div><button class="adm4-refresh" data-act="adminMenu">✕</button></div>
    <div class="bc-step"><i>1</i><b>Кому</b></div>
    <div class="bc-chips">${BC_AUD.map(([v, t]) => chip(a.kind, v, t, 'bcAud')).join('')}</div>${audExtra}
    <div class="bc-count" id="bcCount">${!adm4Online() ? 'Счётчик получателей работает в Telegram' : BC.count === null ? 'Считаю получателей…' : `Получат: <b>${BC.count}</b> ${BC.count === 1 ? 'игрок' : 'игроков'}`}</div>
    <div class="bc-step"><i>2</i><b>Что сказать</b><small>шаблон, значок, текст</small></div>
    <div class="bc-tpls">${BC_TPL.map((t, i) => `<button data-act="bcTpl" data-id="${i}">${t.e} ${t.t}</button>`).join('')}</div>
    <div class="bc-emoji">${BC_EMOJI.map((e) => `<button class="${BC.emoji === e ? 'on' : ''}" data-act="bcEmoji" data-id="${e}">${e}</button>`).join('')}</div>
    <input id="bcTitle" maxlength="60" placeholder="Заголовок — коротко и ясно" value="${esc(BC.title)}">
    <textarea id="bcText" class="fb-text" maxlength="600" placeholder="Текст сообщения">${esc(BC.text)}</textarea><small class="bc-hint" id="bcLeft">Осталось ${left} знаков</small>
    <div class="bc-step"><i>3</i><b>Кнопка и срок</b></div>
    <div class="bc-chips">${chip(BC.btn, '', 'Без кнопки', 'bcBtn')}${Object.entries(BC_BTNS).map(([k, v]) => chip(BC.btn, k, `${v[0]} ${v[1]}`, 'bcBtn')).join('')}</div>
    <div class="bc-chips">${[1, 3, 7, 14].map((d) => chip(String(BC.days), String(d), `${d} ${d === 1 ? 'день' : d < 5 ? 'дня' : 'дней'}`, 'bcDays')).join('')}</div>
    <label class="bc-check"><input type="checkbox" id="bcBot" ${BC.bot ? 'checked' : ''}> 🤖 Ещё и сообщением от бота (кто не отключил напоминания)</label>
    <div class="bc-step"><i>4</i><b>Так увидит игрок</b></div>
    <div id="bcPrev">${bcPreview()}</div>
    <div class="btns" style="flex-direction:column;gap:8px"><button class="btn primary wide" data-act="bcSend" id="bcSendBtn">📢 Отправить ${bcAudText(a)}${BC.count ? ` · ${BC.count}` : ''}</button></div>
    <div class="bc-step"><i>🕘</i><b>Последние рассылки</b></div>
    <div id="bcHist">${bcHistHTML()}</div>
    <div class="btns"><button class="btn wide" data-act="adminMenu">⬅️ В админ-панель</button></div></div>`;
}
function bcAudPayload() {
  const a = BC.aud;
  const out = { kind: a.kind };
  if (a.kind === 'city') out.city = a.city;
  if (a.kind === 'level') { out.min = a.min; out.max = a.max; }
  if (a.kind === 'player') out.uids = a.uids;
  return out;
}
async function bcCount() {
  if (!adm4Online()) return;
  try {
    const r = await apiPost('admin/broadcast', { dry: true, aud: bcAudPayload() });
    BC.count = r.error ? null : r.count;
    const el = $('bcCount');
    if (el) el.innerHTML = r.error ? esc(r.error) : `Получат: <b>${r.count}</b> ${r.count === 1 ? 'игрок' : 'игроков'}`;
    const b = $('bcSendBtn');
    if (b && !b.dataset.confirm) b.textContent = `📢 Отправить ${bcAudText(BC.aud)}${BC.count ? ` · ${BC.count}` : ''}`;
  } catch (e) { /* без сервера — без счётчика */ }
}
async function bcLoadHist() {
  if (!adm4Online()) return;
  try { const r = await apiPost('admin/broadcasts'); BC.hist = r.items || []; const el = $('bcHist'); if (el) el.innerHTML = bcHistHTML(); } catch (e) { /* позже */ }
}
function bcRender(recount) {
  const sc = document.querySelector('#modalRoot .sheet'), top = sc && sc.querySelector('.bc') ? sc.scrollTop : 0;
  openModal(bcHTML(), { center: true });
  const s2 = document.querySelector('#modalRoot .sheet'); if (s2) s2.scrollTop = top;
  if (recount) { BC.count = null; clearTimeout(BC.timer); BC.timer = setTimeout(bcCount, 250); }
}
// Ввод текста — сразу в предпросмотр, без перерисовки окна
document.addEventListener('input', (e) => {
  const id = e.target && e.target.id;
  if (!['bcTitle', 'bcText', 'bcLmin', 'bcLmax', 'bcUids', 'bcBot'].includes(id)) return;
  if (id === 'bcTitle') BC.title = e.target.value;
  if (id === 'bcText') { BC.text = e.target.value; const l = $('bcLeft'); if (l) l.textContent = `Осталось ${600 - BC.text.length} знаков`; }
  if (id === 'bcBot') BC.bot = e.target.checked;
  if (id === 'bcLmin') BC.aud.min = Math.max(1, +e.target.value || 1);
  if (id === 'bcLmax') BC.aud.max = Math.max(1, +e.target.value || 99);
  if (id === 'bcUids') BC.aud.uids = e.target.value;
  if (['bcLmin', 'bcLmax', 'bcUids'].includes(id)) { clearTimeout(BC.timer); BC.timer = setTimeout(bcCount, 500); }
  const p = $('bcPrev'); if (p && (id === 'bcTitle' || id === 'bcText')) p.innerHTML = bcPreview();
});
document.addEventListener('change', (e) => { if (e.target && e.target.id === 'bcBot') BC.bot = e.target.checked; });

Object.assign(ACTIONS, {
  bcOpen: () => { if (!S.admin) return; BC.count = null; bcRender(true); bcLoadHist(); },
  bcAud: (v) => { BC.aud.kind = v; bcRender(true); },
  bcCity: (v) => { BC.aud.city = v; bcRender(true); },
  bcTpl: (i) => { const t = BC_TPL[+i]; if (!t) return; Object.assign(BC, { emoji: t.e, title: t.t, text: t.x, btn: t.btn }); bcRender(); },
  bcEmoji: (e) => { BC.emoji = e; bcRender(); },
  bcBtn: (v) => { BC.btn = v; bcRender(); },
  bcDays: (v) => { BC.days = +v; bcRender(); },
  bcStop: (id) => admConfirm('Остановить рассылку? Её больше никто не увидит', async () => {
    try { const r = await apiPost('admin/broadcast_stop', { id: +id }); toast(r.error || '⏹ Рассылка остановлена', r.error ? 'bad' : 'good'); bcLoadHist(); } catch (e) { toast(refErrorText(e), 'bad'); }
  }),
  bcSend: async (_, btn) => {
    const title = BC.title.trim(), text = BC.text.trim();
    if (title.length < 2 || text.length < 2) { toast('Нужны заголовок и текст', 'bad'); return; }
    if (!adm4Online()) { toast('Рассылка работает в игре внутри Telegram', 'bad'); return; }
    if (btn.dataset.confirm !== '1') { btn.dataset.confirm = '1'; btn.textContent = `Точно отправить ${bcAudText(BC.aud)}${BC.count ? ` (${BC.count})` : ''}? Нажми ещё раз`; return; }
    try {
      const r = await apiPost('admin/broadcast', { title, text, emoji: BC.emoji, btn: BC.btn, days: BC.days, bot: BC.bot, aud: bcAudPayload() });
      if (r.error) { toast(r.error, 'bad'); delete btn.dataset.confirm; return; }
      toast(`📢 Отправлено: ${r.count} ${r.count === 1 ? 'игроку' : 'игрокам'}${r.botTo ? ` · в бота: ${r.botTo}` : ''}`, 'good');
      Object.assign(BC, { title: '', text: '', btn: '', hist: null });
      bcRender(); bcLoadHist();
    } catch (e) { toast(refErrorText(e), 'bad'); }
  },
});
