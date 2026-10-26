// Аватарки: вместо буквы имени — значок за заслуги. Открываются за достижения, сюжет, драки,
// питомцев и т.д. Видны на главном экране, в топе и в чате (вместе с рамкой).

const AVATARS = [
  { id: 'letter', face: null, name: 'Буква имени', how: '', need: () => true },
  { id: 'bottle', face: '🍾', name: 'Бутылочник', how: '5 000 тапов', need: () => counter('taps') >= 5000 },
  { id: 'trash', face: '🗑️', name: 'Король помойки', how: '150 раз порыться в мусорке', need: () => counter('trash') >= 150 },
  { id: 'worker', face: '👷', name: 'Трудяга', how: '100 смен на работе', need: () => (S.stats.shifts || 0) >= 100 },
  { id: 'nerd', face: '🎓', name: 'Профессор', how: 'Окончить университет', need: () => S.edu >= 4 },
  { id: 'boxer', face: '🥊', name: 'Боец', how: '50 побед в драках', need: () => (S.fight && S.fight.wins >= 50) },
  { id: 'gambler', face: '🎰', name: 'Игрок', how: '100 игр в казино', need: () => counter('casino') >= 100 },
  { id: 'rps', face: '✊', name: 'Хитрец', how: '10 побед в КНБ над живыми', need: () => (S.rpsWins || 0) >= 10 },
  { id: 'house', face: '🏡', name: 'Домовладелец', how: 'Купить квартиру', need: () => (S.ownedHousing || 0) >= 5 },
  { id: 'rich', face: '💎', name: 'Миллионер', how: 'Заработать 1 000 000 ₽ за всё время', need: () => S.stats.earned >= 1e6 },
  { id: 'pet', face: '🐾', name: 'Друг животных', how: 'Питомец 5-го уровня дружбы', need: () => typeof petMaxLevel === 'function' && petMaxLevel() >= 5 },
  { id: 'saint', face: '😇', name: 'Праведник', how: 'Честный путь в сюжете', need: () => S.quest && S.quest.path === 'honest' },
  { id: 'devil', face: '😈', name: 'Тёмная лошадка', how: 'Тёмная дорожка в сюжете', need: () => S.quest && S.quest.path === 'dark' },
  { id: 'edik', face: '🏆', name: 'Победитель Эдика', how: 'Пройти сюжет до конца', need: () => counter('bossWin') > 0 && typeof currentQuest === 'function' && (!currentQuest() || ['family', 'legend'].includes(currentQuest().id)) },
  { id: 'champ', face: '🥇', name: 'Чемпион района', how: 'Выиграть турнир по вторникам', need: () => counter('tourPrize') > 0 },
  { id: 'season', face: '🎫', name: 'Ветеран сезона', how: '30-й уровень батл-пасса', need: () => !!S.passFrame },
  { id: 'vip', face: '👑', name: 'Авторитет', how: 'Активный VIP', need: () => isVip() },
  { id: 'legend', face: '🌟', name: 'Легенда', how: 'Начать новый круг (престиж)', need: () => (S.prestige || 0) >= 1 },
];

function avatarById(id) { return AVATARS.find((a) => a.id === id); }
function currentAvatar() { const a = avatarById(S.avatar); return a && a.face && a.need() ? a : null; }
// Что показать в кружке: значок аватарки или первая буква имени
function avaFace(name, avatarId) {
  const a = avatarId && avatarById(avatarId);
  return a && a.face ? `<span class="ava-in" style="background:${avaBg(a.id)}">${a.face}</span>` : esc((name || '?')[0].toUpperCase());
}
// У каждой аватарки свой фон: градиент по её id (одинаковый у всех игроков)
const AVA_BG = { bottle: ['#1B5E20', '#3CCB5A'], trash: ['#3A3A3A', '#7A7A7A'], boxer: ['#5A1414', '#E0412E'], rich: ['#0E4D6A', '#7FDBFF'], vip: ['#4A2A8A', '#B06CFF'],
  devil: ['#3A0A0A', '#B3122E'], saint: ['#8A7A2A', '#FFF3B0'], legend: ['#6A4A00', '#F2C744'], season: ['#3A1A6A', '#B06CFF'], champ: ['#7A5A10', '#F2C744'] };
function avaBg(id) {
  let c = AVA_BG[id];
  if (!c) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360; c = [`hsl(${h} 55% 28%)`, `hsl(${(h + 40) % 360} 70% 52%)`]; }
  return `linear-gradient(135deg, ${c[0]}, ${c[1]})`;
}

HOOKS.hud.push(() => {
  const el = $('avatar');
  if (!el) return;
  const a = currentAvatar();
  const face = a ? a.face : playerName()[0].toUpperCase();
  if (el.dataset.face !== face) { el.textContent = face; el.dataset.face = face; }
  // Класс ставим каждый раз: рамку выставляют заново (progress.js) и иначе фон «слетал» обратно в золотой
  el.classList.toggle('emoji-ava', !!a);
  el.style.background = a ? avaBg(a.id) : '';
});

myStats = (function (orig) { return () => { const a = currentAvatar(); return { ...orig(), avatar: a ? a.id : '' }; }; })(myStats);

// Новая аватарка открылась — сообщаем один раз
HOOKS.tick.push(() => {
  if (Math.random() > 0.05 || !S.storySeen) return;
  if (!S.avatarsSeen) S.avatarsSeen = AVATARS.filter((a) => a.need()).map((a) => a.id); // старым игрокам не спамим
  const fresh = AVATARS.find((a) => a.face && a.need() && !S.avatarsSeen.includes(a.id));
  if (!fresh) return;
  S.avatarsSeen.push(fresh.id);
  sfx('ach');
  toast(`${fresh.face} Новая аватарка «${fresh.name}»! Выбери её в «Задания → Достижения»`, 'good');
});

// Выбор — наверху «Достижений», над рамками
const _achTabAva = EXTRA_TABS.tasks.ach;
EXTRA_TABS.tasks.ach = () => {
  const cur = currentAvatar();
  const open = AVATARS.filter((a) => a.need()).length;
  return `<div class="subhead">😎 Аватарка · ${open} из ${AVATARS.length} · видна в топе и чате</div>
    <div class="frames avatars">${AVATARS.map((a) => {
      const ok = a.need();
      const on = a.face ? cur && cur.id === a.id : !cur;
      return `<button class="frame-pick ${on ? 'on' : ''}" data-act="pickAvatar" data-id="${a.id}" ${ok ? '' : `disabled data-why="Откроется: ${a.how}"`}>
        <div class="avatar ${a.face ? 'emoji-ava' : ''} frame-${currentFrame()}" ${a.face && ok ? `style="background:${avaBg(a.id)}"` : ''}>${a.face ? (ok ? a.face : '🔒') : esc(playerName()[0])}</div><small>${a.name}</small></button>`;
    }).join('')}</div>` + _achTabAva();
};
ACTIONS.pickAvatar = (id) => {
  const a = avatarById(id);
  if (!a || !a.need()) return;
  S.avatar = a.face ? id : '';
  sfx('chip');
  toast(a.face ? `${a.face} Аватарка «${a.name}»` : 'Снова буква имени', 'good');
  updateHud();
  if (typeof topSubmit === 'function' && onlineOn()) topSubmit().catch(() => {});
};
