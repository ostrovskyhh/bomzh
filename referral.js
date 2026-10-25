// Рефералка: у каждого игрока свой код (английское слово из 6 букв), он виден в настройках.
// Новичок вводит код друга в поле «Кодовое слово» → +1000 ₽ и опыт ×1.5 на 30 минут, владельцу кода — 500 ₽.
// Коды и награды хранит сервер в боте (bot/referral.py), до него игра достукивается через ngrok.

const REF_BOOST_MIN = 30;
const REF_BOOST_MULT = 1.5;

EFFECTS.refboost = { name: 'Подарок друга', emoji: '🤝', kind: 'good', desc: `Опыт ×${REF_BOOST_MULT} за приглашение` };
xpMult = (function (orig) { return () => orig() * (hasEffect('refboost') ? REF_BOOST_MULT : 1); })(xpMult);

let REF = null; // { code, invited, pending, used } — ответ сервера

// Подпись Telegram: по ней сервер узнаёт игрока. Вне Telegram её нет
function refInitData() { return (tg && tg.initData) || ''; }

async function refCall(path, extra = {}) {
  if (!REF_API) throw new Error('off');
  if (!refInitData()) throw new Error('notg');
  const r = await fetch(`${REF_API}/api/ref/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
    body: JSON.stringify({ initData: refInitData(), ...extra }),
  });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}

function refErrorText(e) {
  if (e.message === 'off') return 'Приглашения пока не работают';
  if (e.message === 'notg') return 'Коды друзей работают только в игре внутри Telegram';
  return 'Сервер недоступен, попробуй позже';
}

// Узнать свой код и забрать награды за приглашённых друзей
async function refSync() {
  try {
    REF = await refCall('me');
    if (REF.pending > 0) {
      const { amount } = await refCall('claim');
      if (amount > 0) {
        addMoney(amount);
        track('refReward', amount / 500);
        save();
        resultModal({ emoji: '🤝', title: 'Друзья пришли по твоему коду!', text: `За приглашения: <b style="color:var(--gold)">+${fmt(amount)} ₽</b>. Всего приглашено: ${REF.invited}`, btn: 'Класс!' });
        sfx('coin');
      }
    }
  } catch (e) { REF = REF || null; }
  return REF;
}

HOOKS.init.push(() => { if (REF_API) setTimeout(refSync, 4000); });

async function useRefCode(word) {
  if (S.refUsed) { toast('Ты уже вводил код друга', 'bad'); return; }
  try {
    const res = await refCall('use', { code: word });
    if (!res.ok) { toast(res.error || 'Код не подошёл', 'bad'); sfx('error'); return; }
    S.refUsed = true;
    addMoney(res.bonus);
    addEffect('refboost', REF_BOOST_MIN);
    track('refUsed');
    save();
    confetti(60);
    sfx('levelup');
    resultModal({ emoji: '🎁', title: 'Подарок от друга!', text: `Код друга${res.owner ? ` (${esc(res.owner)})` : ''} принят!<br><b style="color:var(--gold)">+${fmt(res.bonus)} ₽</b> и опыт ×${REF_BOOST_MULT} на ${REF_BOOST_MIN} минут.`, btn: 'Спасибо!' });
  } catch (e) { toast(refErrorText(e), 'bad'); }
}

// Блок «Пригласи друга» в настройках
openSettings = (function (orig) {
  return function () {
    orig();
    const row = document.querySelector('#modalRoot .code-row, #modalRoot .admin-btn');
    if (!row) return;
    row.insertAdjacentHTML('beforebegin', `<div class="ref-box" id="refBox">${refBoxHTML()}</div>`);
    const inp = $('codeWord');
    if (inp) { inp.type = 'text'; inp.placeholder = S.refUsed ? 'Кодовое слово' : 'Код друга или кодовое слово'; }
    if (REF_API && refInitData()) refSync().then(() => { const b = $('refBox'); if (b) b.innerHTML = refBoxHTML(); });
  };
})(openSettings);

function refBoxHTML() {
  if (!REF_API) return '';
  if (!refInitData()) return '<b>🤝 Пригласи друга</b><small>Твой код появится, когда откроешь игру через Telegram</small>';
  if (!REF) return '<b>🤝 Пригласи друга</b><small>Загружаем твой код…</small>';
  return `<b>🤝 Пригласи друга</b>
    <div class="ref-code"><span>${REF.code.toUpperCase()}</span><button class="btn small" data-act="refCopy">📋</button><button class="btn small primary" data-act="refShare">Поделиться</button></div>
    <small>Друг вводит код в поле ниже и получает +1000 ₽ и опыт ×1.5 на 30 минут, а ты — 500 ₽. Приглашено: ${REF.invited}</small>`;
}

function refInviteText() {
  return `Залетай в «Симулятор бомжа»! Введи мой код ${REF.code.toUpperCase()} в настройках игры и получи +1000 ₽ на старте 🍾`;
}

Object.assign(ACTIONS, {
  refCopy: async () => {
    if (!REF) return;
    try { await navigator.clipboard.writeText(REF.code.toUpperCase()); toast('Код скопирован', 'good'); } catch (e) { toast(`Твой код: ${REF.code.toUpperCase()}`); }
  },
  refShare: () => {
    if (!REF) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(BOT_LINK || 'https://t.me')}&text=${encodeURIComponent(refInviteText())}`;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank');
  },
});

// Поле «Кодовое слово»: сначала проверяем админское слово, иначе это код друга
ACTIONS.codeWord = (function (adminCheck) {
  return async () => {
    const inp = $('codeWord');
    if (!inp) return;
    const word = inp.value.trim().toLowerCase();
    if (!word) return;
    const h = await sha256(word);
    if (h && h === ADMIN_HASH) { await adminCheck(); return; }
    if (/^[a-z0-9]{6}$/.test(word)) { inp.value = ''; await useRefCode(word); return; }
    inp.value = '';
    sfx('error');
    toast('Неверное кодовое слово', 'bad');
  };
})(ACTIONS.codeWord);
