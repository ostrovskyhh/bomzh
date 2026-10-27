// Бой 2.0 (3.2): интерактивная драка, где решает спортзал.
// Атака: у соперника видна стойка («в блоке» или «открыт»), выбираешь удар или мощный и попадаешь в зону
// на бегущей полоске — в золотую середину это крит, серия точных ударов даёт комбо.
// Защита: соперник замахивается, вокруг кулака сужается кольцо. «Уклон» в последний момент — ноль урона
// и контратака ×1.3, слишком рано — получишь по полной. «Блок» надёжнее, но мощный удар его пробивает.
// Хитрецы и тактики делают финты: кольцо исчезает, а кто дёрнулся — теряет выносливость.
// Что даёт зал: сила — урон; форма — здоровье, восстановление выносливости, шире зона точного удара
// и дольше окно уклона. Есть «Авто-бой» для тех, кто не хочет жать: он слабее ручного.
// Файл подключён сразу после fights.js — обёртки из других файлов (тренировки, питомцы) работают поверх.

const F3_ROUNDS = 8;
const F3_MOVES = {
  hit: { name: 'Удар', emoji: '👊', st: 8, mult: 1, zone: 0.34, speed: 1.25 },
  heavy: { name: 'Мощный', emoji: '💥', st: 22, mult: 1.9, zone: 0.2, speed: 1 },
};
// Поведение соперника по стилю: как часто держит блок, бьёт мощным и делает финт
const F3_STYLE = { brawler: { block: 0.15, heavy: 0.4, feint: 0 }, tactic: { block: 0.3, heavy: 0.25, feint: 0.22 }, coward: { block: 0.45, heavy: 0.12, feint: 0.12 } };
let F3_LAST = null; // итог последнего боя: { ko, perfect, dodges } — нужен турниру

fighterStats = function (f) {
  const lvl = f.level || 1, form = f.form || 0, str = f.strength || 0, tier = f.tier || 0;
  return {
    hp: Math.round((70 + form * 0.9 + lvl * 1.5) * (f.hpMult || 1)),
    atk: 6 + str * 0.28 + lvl * 0.3 + tier * 1.5,
    def: 2 + form * 0.06 + tier,
  };
};
// Мощь бойца — одно число для сравнения и лиг турнира (та же формула на сервере, bot/tour.py)
function fighterScore(f) { return Math.round((f.strength || 0) * 2 + (f.form || 0) * 1.5 + (f.level || 0) * 3 + (f.tier || 0) * 10); }
// Что зал даёт в бою — для подсказок
function f3Zone(me, base) { return base * (1 + (me.form || 0) * 0.005) * (me.st < 20 ? 0.7 : 1); }
function f3Window(me, en, heavy) { return clamp((heavy ? 820 : 1050) + (me.form || 0) * 4 - (en.form || 0) * 2.5, 520, 1500); }
function f3DodgeWin(me) { return 230 + (me.form || 0) * 2; }
function f3Regen(x) { return 8 + (x.form || 0) * 0.12; }

startFight = function (op, opts = {}) {
  const meF = opts.me || myFighter();
  const me = { ...meF, ...fighterStats(meF), st: 100 };
  const en = { ...op, ...fighterStats(op), st: 100 };
  me.max = me.hp; en.max = en.hp;
  FIGHT = { id: Date.now(), me, en, op, round: 0, busy: false, opts, combo: 0, counter: false, perfect: 0, dodges: 0 };
  openModal(`<div class="fight f3">
      <div class="f-round" id="fRound">Раунд 1 из ${F3_ROUNDS}</div>
      <div class="f-arena">
        <div class="f-side"><div class="f-name">${esc(me.name)}</div><div class="f-ava" id="fMeAva">${valeraSVG(S.eq, lookState())}</div>
          <div class="f-bar hp"><div id="fMeHp"></div><span id="fMeHpT"></span></div><div class="f-bar st"><div id="fMeSt"></div></div><div class="f3-tags" id="f3MeTags"></div></div>
        <div class="f-vs">VS</div>
        <div class="f-side"><div class="f-name">${esc(en.name)}</div><div class="f-ava flip" id="fEnAva">${valeraSVG(op.eq || { hat: 'none', body: 'base', shoes: 'base' }, { mood: 'ok' })}</div>
          <div class="f-bar hp"><div id="fEnHp"></div><span id="fEnHpT"></span></div><div class="f-bar st"><div id="fEnSt"></div></div><div class="f3-stance" id="f3Stance"></div></div>
      </div>
      <div class="f3-stage" id="f3Stage"></div>
      <div class="f-log" id="fLog">${opts.intro || 'Смотри на стойку соперника и выбирай удар'}</div>
      <div class="f3-foot"><label class="f3-auto"><input type="checkbox" id="f3Auto" ${S.fightAuto ? 'checked' : ''}> ⚡ Авто-бой <small>(слабее ручного)</small></label>
        <button class="btn small" data-act="f3Give">🏳️ Сдаться</button></div>
    </div>`, { center: true, locked: true });
  $('f3Auto').onchange = (e) => { S.fightAuto = e.target.checked; };
  sfx('bell');
  f3Bars();
  f3Round(FIGHT.id);
};

function f3Alive(id) { return FIGHT && FIGHT.id === id && $('f3Stage'); }
function f3Auto() { return !!S.fightAuto; }
function f3Bars() {
  const f = FIGHT;
  if (!f || !$('fMeHp')) return;
  const bar = (id, v, max) => { $(id).style.width = clamp(v / max, 0, 1) * 100 + '%'; };
  bar('fMeHp', f.me.hp, f.me.max); bar('fEnHp', f.en.hp, f.en.max);
  bar('fMeSt', f.me.st, 100); bar('fEnSt', f.en.st, 100);
  $('fMeHpT').textContent = `${Math.max(0, Math.ceil(f.me.hp))}/${f.me.max}`;
  $('fEnHpT').textContent = `${Math.max(0, Math.ceil(f.en.hp))}/${f.en.max}`;
  $('fRound').textContent = `Раунд ${Math.max(1, f.round)} из ${F3_ROUNDS}`;
  $('f3MeTags').innerHTML = `${f.combo >= 2 ? `<span class="t-combo">🔥 Комбо ×${f.combo}</span>` : ''}${f.counter ? '<span class="t-counter">⚡ Контратака</span>' : ''}`;
}
function f3Log(html) { if ($('fLog')) $('fLog').innerHTML = html; }
function f3Lunge(el, dir) {
  if (!el) return;
  const fl = el.classList.contains('flip') ? ' scaleX(-1)' : '';
  el.animate([{ transform: `translateX(0)${fl}` }, { transform: `translateX(${dir * 24}px)${fl}` }, { transform: `translateX(0)${fl}` }], { duration: 260 });
}
function f3Shake(el) { if (el) el.animate([{ filter: 'brightness(2.2) saturate(0)' }, { filter: 'none' }], { duration: 300 }); }

// ---------- Раунд: стойка соперника и выбор удара ----------
function f3Round(id) {
  const f = FIGHT;
  if (!f3Alive(id)) return;
  f.round++;
  if (f.round > F3_ROUNDS) { f3Finish(id, f.me.hp / f.me.max > f.en.hp / f.en.max, false); return; }
  const sty = F3_STYLE[f.en.style] || F3_STYLE.tactic;
  f.enBlock = Math.random() < sty.block + (f.en.hp < f.en.max * 0.3 ? 0.15 : 0);
  $('f3Stance').innerHTML = f.enBlock ? '<span class="st-block">🛡️ Держит блок</span>' : '<span class="st-open">👊 Открыт</span>';
  f3Bars();
  const btn = (k) => { const m = F3_MOVES[k]; const ok = f.me.st >= m.st; return `<button class="btn f-btn ${k === 'heavy' && f.enBlock ? 'hint' : ''}" data-k="${k}" ${ok ? '' : 'disabled'}><span>${m.emoji}</span>${m.name}<small>−${m.st} выносл.</small></button>`; };
  $('f3Stage').innerHTML = `<div class="f3-tip">${f.enBlock ? 'Соперник в блоке — обычный удар почти не пройдёт, <b>мощный пробьёт</b>' : 'Соперник открыт — <b>бей!</b>'}</div>
    <div class="f-btns f3-three">${btn('hit')}${btn('heavy')}<button class="btn f-btn" data-k="rest"><span>😮‍💨</span>Отдышаться<small>+25 выносл.</small></button></div>`;
  $('f3Stage').querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => f3Attack(id, b.dataset.k); });
  if (f3Auto()) setTimeout(() => { if (f3Alive(id) && $('f3Stage').querySelector('[data-k]')) f3Attack(id, f.enBlock && f.me.st >= 22 ? 'heavy' : f.me.st >= 8 ? 'hit' : 'rest'); }, 450);
}

// ---------- Атака: попади в зону на полоске ----------
function f3Attack(id, kind) {
  const f = FIGHT;
  if (!f3Alive(id) || f.busy) return;
  if (kind === 'rest') {
    f.me.st = clamp(f.me.st + 25, 0, 100);
    f.combo = 0;
    f3Log('😮‍💨 Ты отдышался: +25 выносливости');
    f3Bars();
    f3Defend(id);
    return;
  }
  const m = F3_MOVES[kind];
  if (f.me.st < m.st) return;
  f.me.st -= m.st;
  f.busy = true;
  f3Bars();
  const zoneW = f3Zone(f.me, m.zone), zone = rand(0.08, 0.92 - zoneW);
  $('f3Stage').innerHTML = `<div class="f3-tip">${m.emoji} Жми, когда метка в <b style="color:var(--green)">зелёной зоне</b>, в золотой середине — крит</div>
    <div class="f3-bar" id="f3Bar"><div class="f3-zone" style="left:${zone * 100}%;width:${zoneW * 100}%"><i></i></div><div class="f3-mark" id="f3Mark"></div></div>
    <button class="btn primary wide f3-tap" id="f3Tap">${m.emoji} Бей!</button>`;
  let pos = 0, dir = 1, last = performance.now(), done = false;
  const speed = m.speed * (1 + f.round * 0.03);
  const loop = (now) => {
    if (done || !f3Alive(id)) return;
    const dt = (now - last) / 1000; last = now;
    pos += dir * speed * dt;
    if (pos >= 1) { pos = 1; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; }
    $('f3Mark').style.left = pos * 100 + '%';
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const resolve = (q) => {
    if (done) return;
    done = true;
    f.busy = false;
    f3Hit(id, kind, q);
  };
  const tap = (e) => {
    if (e) e.preventDefault();
    const c = zone + zoneW / 2;
    resolve(Math.abs(pos - c) <= zoneW * 0.18 ? 'perfect' : pos >= zone && pos <= zone + zoneW ? 'good' : 'miss');
  };
  $('f3Tap').onpointerdown = tap;
  $('f3Bar').onpointerdown = tap;
  setTimeout(() => resolve('miss'), 2800); // замешкался — соперник ушёл с линии
  if (f3Auto()) setTimeout(() => resolve(Math.random() < 0.75 ? 'good' : 'miss'), 650);
}

async function f3Hit(id, kind, q) {
  const f = FIGHT;
  if (!f3Alive(id)) return;
  const m = F3_MOVES[kind];
  const qm = { perfect: 1.5, good: 1, miss: 0 }[q];
  let text;
  if (q === 'perfect') { f.combo++; f.perfect++; } else f.combo = 0;
  if (!qm) {
    text = `${m.emoji} Мимо!`;
    sfx('whoosh');
  } else {
    const block = f.enBlock ? (kind === 'heavy' ? 0.75 : 0.3) : 1;
    const combo = 1 + 0.1 * Math.min(5, Math.max(0, f.combo - 1));
    const counter = f.counter ? 1.3 : 1;
    const dmg = Math.max(1, Math.round(f.me.atk * m.mult * qm * block * combo * counter * rand(0.9, 1.1) - f.en.def * 0.4));
    f.counter = false;
    f3Lunge($('fMeAva'), 1);
    await wait(130);
    if (!f3Alive(id)) return;
    f.en.hp -= dmg;
    f3Shake($('fEnAva'));
    haptic(q === 'perfect' ? 'heavy' : 'medium');
    sfx(q === 'perfect' ? 'crit' : f.enBlock && kind === 'hit' ? 'block' : kind === 'heavy' ? 'heavy' : 'punch');
    floatAt($('fEnAva'), `−${dmg}${q === 'perfect' ? '!' : ''}`, 'bad');
    text = `${m.emoji} ${q === 'perfect' ? '<b style="color:var(--gold)">КРИТ!</b> ' : ''}${m.name}: ${dmg} урона${f.enBlock ? (kind === 'heavy' ? ' (пробил блок)' : ' (в блок)') : ''}${f.combo >= 2 ? ` · комбо ×${f.combo}` : ''}`;
  }
  f3Log(text);
  f3Bars();
  await wait(450);
  if (!f3Alive(id)) return;
  if (f.en.hp <= 0) { f3Finish(id, true, true); return; }
  f3Defend(id);
}

// ---------- Защита: кольцо сужается к удару ----------
function f3Defend(id) {
  const f = FIGHT;
  if (!f3Alive(id)) return;
  const sty = F3_STYLE[f.en.style] || F3_STYLE.tactic;
  const heavy = f.en.st >= 22 && Math.random() < sty.heavy + (f.me.hp < f.me.max * 0.25 ? 0.15 : 0);
  const feint = !heavy && !f.feinted && Math.random() < sty.feint; // два финта подряд не бывает
  f.en.st = clamp(f.en.st - (heavy ? 22 : 8), 0, 100);
  f.busy = true;
  f3Bars();
  $('f3Stage').innerHTML = `<div class="f3-def"><div class="f3-target ${heavy ? 'heavy' : ''}"><span>${heavy ? '🔥' : '👊'}</span><i class="f3-ring" id="f3Ring"></i></div>
      <div class="f3-tel" id="f3Tel">${heavy ? '<b style="color:var(--red)">МОЩНЫЙ!</b> Блок не спасёт — уклоняйся' : 'Замах! Уклон — когда кольцо сомкнётся'}</div></div>
    <div class="f-btns"><button class="btn f-btn" id="f3Dodge"><span>💨</span>Уклон<small>в последний момент</small></button>
      <button class="btn f-btn" id="f3Block" ${f.me.st >= 6 ? '' : 'disabled'}><span>🛡️</span>Блок<small>−6 выносл.</small></button></div>`;
  const T = f3Window(f.me, f.en, heavy) * (f.feinted ? 0.8 : 1), W = f3DodgeWin(f.me);
  const t0 = performance.now();
  let act = null, done = false, feintOver = !feint;
  const ring = $('f3Ring');
  const anim = ring.animate([{ transform: 'scale(2.6)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: feint ? T * 0.6 : T, easing: 'linear', fill: 'forwards' });
  if (feint) {
    anim.onfinish = () => {
      if (done || !f3Alive(id)) return;
      ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
      $('f3Tel').innerHTML = '🦊 <b>Финт!</b>';
      setTimeout(() => {
        if (done || !f3Alive(id)) return;
        done = true; f.busy = false;
        if (act === 'early') { f.me.st = clamp(f.me.st - 10, 0, 100); f3Log('🦊 Попался на финт: −10 выносливости'); }
        else f3Log('🦊 Финт — ты не дёрнулся, молодец');
        f.feinted = true;
        f3Defend(id); // настоящий удар сразу следом и быстрее
      }, 380);
    };
  }
  const press = (kind) => {
    if (done || act) return;
    const left = (feint ? T * 0.6 : T) - (performance.now() - t0);
    if (feint) { act = 'early'; $('f3Tel').innerHTML = 'Дёрнулся раньше…'; return; }
    if (kind === 'block') { act = 'block'; $('f3Block').classList.add('on'); return; }
    act = left <= W ? 'dodge' : 'early';
    $('f3Dodge').classList.add(act === 'dodge' ? 'on' : 'bad');
    if (act === 'early') $('f3Tel').innerHTML = '<b style="color:var(--red)">Рано!</b>';
  };
  $('f3Dodge').onpointerdown = (e) => { e.preventDefault(); press('dodge'); };
  $('f3Block').onpointerdown = (e) => { e.preventDefault(); if (f.me.st >= 6) press('block'); };
  if (f3Auto() && !feint) setTimeout(() => { if (f.me.st >= 6) press('block'); }, T * 0.5);
  if (feint) return;
  setTimeout(() => { if (!done && f3Alive(id)) { done = true; f.feinted = false; f3Impact(id, heavy, act); } }, T + 30);
}

async function f3Impact(id, heavy, act) {
  const f = FIGHT;
  if (!f3Alive(id)) return;
  f.busy = false;
  let dmg = Math.max(1, Math.round(f.en.atk * (heavy ? 1.8 : 1) * rand(0.9, 1.1) - f.me.def * 0.4));
  let text;
  f3Lunge($('fEnAva'), -1);
  await wait(130);
  if (!f3Alive(id)) return;
  if (act === 'dodge') {
    dmg = 0; f.counter = true; f.dodges++;
    sfx('whoosh'); haptic('light');
    floatAt($('fMeAva'), 'Уклон!', 'good');
    text = '💨 <b style="color:var(--green)">Ушёл от удара!</b> Контратака: следующий удар ×1.3';
  } else if (act === 'block') {
    f.me.st = clamp(f.me.st - 6, 0, 100);
    dmg = Math.max(1, Math.round(dmg * (heavy ? 0.75 : 0.35)));
    sfx('block'); haptic('medium');
    text = `🛡️ Блок: ${dmg} урона${heavy ? ' — мощный пробил' : ''}`;
  } else {
    sfx(heavy ? 'heavy' : 'punch'); haptic('heavy');
    text = `${heavy ? '🔥 Мощный' : '👊 Удар'} в цель: ${dmg} урона${act === 'early' ? ' — уклонился слишком рано' : ''}`;
  }
  if (dmg) { f.me.hp -= dmg; f3Shake($('fMeAva')); floatAt($('fMeAva'), `−${dmg}`, 'bad'); }
  f.me.st = clamp(f.me.st + f3Regen(f.me), 0, 100);
  f.en.st = clamp(f.en.st + f3Regen(f.en), 0, 100);
  f3Log(text);
  f3Bars();
  await wait(550);
  if (!f3Alive(id)) return;
  if (f.me.hp <= 0) { f3Finish(id, false, true); return; }
  f3Round(id);
}

async function f3Finish(id, won, ko) {
  const f = FIGHT;
  if (!f3Alive(id)) return;
  F3_LAST = { ko, won, perfect: f.perfect, dodges: f.dodges };
  $('f3Stage').innerHTML = `<div class="f3-end ${won ? 'win' : 'lose'}">${ko ? (won ? '💥 НОКАУТ!' : '😵 Нокаут…') : won ? '🏅 Победа по очкам' : 'Поражение по очкам'}</div>`;
  if (ko) sfx('ko');
  await wait(900);
  if (FIGHT && FIGHT.id === id) fightEnd(won);
}

ACTIONS.f3Give = () => {
  const f = FIGHT;
  if (!f) return;
  const go = () => { if (FIGHT === f) { f.me.hp = Math.min(f.me.hp, f.me.max * 0.6); f3Finish(f.id, false, true); } };
  if (tg && tg.showConfirm) tg.showConfirm('Сдаться? Бой засчитают как поражение', (ok) => ok && go()); else if (confirm('Сдаться?')) go();
};
