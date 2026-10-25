// «Что нового»: после обновления игрок один раз видит окно с кратким списком изменений.
// Как выпустить обновление: допиши НОВУЮ запись в самое начало CHANGELOG (v — новый номер версии),
// поменяй ?v= в index.html на тот же номер и загрузи файлы на GitHub.

const CHANGELOG = [
  { v: '1.4', title: 'Лото, карьера и подсказки', items: [
    '🎟️ В «Досуге» новая вкладка «Лото»: моментальные билеты от 50 ₽ до 20 000 ₽ и русское лото с Михалычем и бабой Зиной',
    '📮 Почтальону стало проще, а за столкновение снимается только одно очко. На всех «дорожных» работах Валера едет на своём транспорте — или идёт пешком',
    '🏛️ Чиновникам и депутатам стало сложнее: сроки действия документов, взятки-ловушки, установки фракции меняются посреди заседания, на решение — секунды',
    '📜 При приёме на работу и повышении — приказ со штампом и анимацией',
    '🎯 Нажми на цель главы или задание дня — игра покажет, где это сделать, и подсветит нужное',
    '📰 Это окно: теперь после каждого обновления будет коротко видно, что нового',
  ] },
  { v: '1.3', title: 'Сюжет и спортзал', items: [
    '😈 Тёмная дорожка стала полноценной историей: своя бригада, Бугай с рынка, ночь в казино, предательство Шныря и склад Эдика',
    '🏋️ В спортзале каждое упражнение — мини-игра, прирост зависит от результата',
    '🎬 Мультики листаются вручную, их можно пересмотреть во вкладке «Сюжет»',
    '🔴 Красные точки показывают конкретный раздел, где ждёт награда',
  ] },
];
const CURRENT_VERSION = CHANGELOG[0].v;

function openNews(fromVersion) {
  const idx = CHANGELOG.findIndex((c) => c.v === fromVersion);
  const list = fromVersion === 'all' ? CHANGELOG : idx > 0 ? CHANGELOG.slice(0, idx) : CHANGELOG.slice(0, 1);
  openModal(`<div class="big-art" style="height:90px"><div class="rays"></div><div class="big-emoji" style="line-height:90px">📰</div></div>
    <h3>Что нового</h3>
    <div class="news-list">${list.map((c) => `<h4>Версия ${c.v} · ${c.title}</h4><ul>${c.items.map((i) => `<li>${i}</li>`).join('')}</ul>`).join('')}</div>
    <div class="btns"><button class="btn primary wide" data-act="close">Круто, играть!</button></div>`, { center: true });
  sfx('notify');
}

// Показываем один раз после обновления. Новичкам (ещё не видели интро) — не показываем
HOOKS.tick.push(() => {
  if (S.seenVersion === CURRENT_VERSION) return;
  if (!S.storySeen) return;
  if (!S.seenVersion && (S.stats.taps || 0) < 30) { S.seenVersion = CURRENT_VERSION; return; }
  if (modalOpen() || S.busy || (S.tut && !S.tut.done)) return;
  const from = S.seenVersion;
  S.seenVersion = CURRENT_VERSION;
  save();
  openNews(from);
});

openSettings = (function (orig) {
  return function () {
    orig();
    const note = document.querySelector('#modalRoot .test-note');
    if (note) note.textContent = `Симулятор бомжа · версия ${CURRENT_VERSION}`;
    const journal = document.querySelector('#modalRoot [data-act="journal"]');
    if (journal) journal.insertAdjacentHTML('beforebegin', '<button class="btn wide" data-act="news">📰 Что нового</button>');
  };
})(openSettings);
ACTIONS.news = () => openNews('all');
