// Находки на работе и больше хлама для рынка Шныря.
// После каждой смены есть шанс унести «сувенир» (чем лучше отработал и выше должность — тем чаще),
// у каждой работы свой набор находок. Всё продаётся у Шныря по плавающим ценам.

Object.assign(ITEMS, {
  // мусорка и улица
  vinyl: { name: 'Пластинка «Мелодия»', emoji: '💿', base: 160, w: 9 },
  lighter: { name: 'Зажигалка Zippo', emoji: '🔥', base: 350, w: 6 },
  sneakers: { name: 'Кроссовки без шнурков', emoji: '👟', base: 140, w: 9 },
  radio: { name: 'Радиоприёмник «Океан»', emoji: '📻', base: 480, w: 5 },
  badge: { name: 'Советский значок', emoji: '🎖️', base: 260, w: 6 },
  camera: { name: 'Фотоаппарат «Зенит»', emoji: '📷', base: 1300, w: 2 },
  icon: { name: 'Старинная икона', emoji: '⛪', base: 9000, w: 0.5 },
  // рабочие находки (в мусорке не попадаются: w = 0)
  flyerstack: { name: 'Пачка листовок «Окна»', emoji: '📄', base: 15, w: 0 },
  crate: { name: 'Ящик «некондиции»', emoji: '📦', base: 90, w: 0 },
  parcel: { name: 'Невостребованная посылка', emoji: '🎁', base: 400, w: 0 },
  walkie: { name: 'Рация охранника', emoji: '📟', base: 700, w: 0 },
  dashcam: { name: 'Видеорегистратор', emoji: '📹', base: 1100, w: 0 },
  tester: { name: 'Пробник духов', emoji: '🧴', base: 250, w: 0 },
  laptop: { name: 'Списанный ноутбук', emoji: '💻', base: 4500, w: 0 },
  pen: { name: 'Перьевая ручка Parker', emoji: '🖋️', base: 1800, w: 0 },
  broom: { name: 'Казённая метла', emoji: '🧹', base: 40, w: 0 },
  stamp: { name: 'Редкая марка', emoji: '📮', base: 2500, w: 0 },
  spices: { name: 'Мешок специй', emoji: '🧂', base: 120, w: 0 },
  cuffs: { name: 'Списанные наручники', emoji: '⛓️', base: 600, w: 0 },
  globe: { name: 'Школьный глобус', emoji: '🌍', base: 350, w: 0 },
  stapler: { name: 'Степлер с гербом', emoji: '📎', base: 200, w: 0 },
  giftbox: { name: 'Подарок от «благодарных граждан»', emoji: '💼', base: 15000, w: 0 },
  medal: { name: 'Юбилейная медаль', emoji: '🏅', base: 5000, w: 0 },
});

// Что можно унести с какой работы: [id, вес]
const JOB_LOOT = {
  flyers: [['flyerstack', 10], ['sneakers', 2], ['lighter', 1]],
  loader: [['crate', 10], ['scrap', 6], ['copper', 3], ['spices', 3]],
  courier: [['parcel', 6], ['phone', 3], ['badge', 2]],
  guard: [['walkie', 5], ['phone', 4], ['watch', 2], ['lighter', 3]],
  taxi: [['dashcam', 4], ['phone', 5], ['ring', 1], ['lighter', 4]],
  seller: [['tester', 8], ['phone', 3], ['watch', 2]],
  manager: [['pen', 4], ['laptop', 1], ['stapler', 6], ['watch', 2]],
  director: [['laptop', 3], ['pen', 4], ['watch', 3], ['camera', 1]],
  dvornik: [['broom', 8], ['scrap', 6], ['copper', 3], ['badge', 2], ['coin', 0.3]],
  postman: [['parcel', 5], ['stamp', 2], ['radio', 2], ['vinyl', 3]],
  cook: [['spices', 8], ['crate', 4], ['samovar', 0.5]],
  police: [['cuffs', 4], ['walkie', 4], ['phone', 4], ['ring', 1]],
  teacher: [['globe', 6], ['pen', 2], ['badge', 3], ['stapler', 4]],
  clerk: [['stapler', 6], ['pen', 4], ['medal', 1], ['giftbox', 0.4]],
  deputy: [['giftbox', 2], ['medal', 3], ['laptop', 2], ['painting', 0.5], ['icon', 0.3]],
};
const JOB_LOOT_CHANCE = 0.22;

function rollJobLoot(jobId) {
  const pool = JOB_LOOT[jobId];
  if (!pool) return null;
  const total = pool.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  return (pool.find(([, w]) => (r -= w) < 0) || pool[0])[0];
}

// Смена закончилась → после окна с зарплатой, возможно, находка
const _finishJobLoot = finishJob;
finishJob = function (j, score, mg) {
  _finishJobLoot(j, score, mg);
  if (!(score > 0)) return;
  const perf = clamp(score / ((JOB_GAMES[j.id] && JOB_GAMES[j.id].target) || 1), 0, 1.25);
  const rank = typeof jobRank === 'function' ? jobRank(j.id) : 0;
  if (Math.random() > JOB_LOOT_CHANCE * (0.6 + perf * 0.5) * (1 + rank * 0.08)) return;
  const id = rollJobLoot(j.id);
  if (!id || !ITEMS[id]) return;
  addItem(id);
  track('jobLoot');
  setTimeout(() => { toast(`🎒 Унёс со смены: ${ITEMS[id].emoji} ${ITEMS[id].name} (~${fmt(itemPrice(id))} ₽ у Шныря)`, 'good'); sfx('loot'); }, 900);
  save();
};

// Подсказка в рынке: откуда берутся вещи
const _marketTabLoot = EXTRA_TABS.fun.market;
EXTRA_TABS.fun.market = () => _marketTabLoot().replace('Сумка пуста. Хлам находится в мусорках, его можно продать Шнырю.',
  'Сумка пуста. Хлам находится в мусорках, а со смен на работе иногда удаётся что-то унести — всё это можно продать Шнырю.');
