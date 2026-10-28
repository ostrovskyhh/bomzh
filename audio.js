// Звук: всё синтезируется на лету через WebAudio — ни одного аудиофайла, игра не тяжелеет.
// Sound.play('tap') — короткий эффект, Sound.music('lounge') / Sound.music(null) — фоновая музыка.

const Sound = (() => {
  let ctx = null, master, sfxBus, musicBus, reverbIn;
  let track = null, timer = null, nextTime = 0, step = 0;

  const opts = () => (typeof S !== 'undefined' && S.settings) || { sfx: true, music: true };
  // Громкость 0–100 и звуковая тема: classic, retro (квадратные «пищалки»), soft (тихо и мягко)
  const musicVol = () => (opts().musicVol ?? 70) / 100;
  const sfxVol = () => (opts().sfxVol ?? 80) / 100;
  const theme = () => opts().sfxTheme || 'classic';

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.85;
    master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    // Реверб из сгенерированного импульса — придаёт звукам объём
    const conv = ctx.createConvolver();
    conv.buffer = impulse(2.2, 2.8);
    const wet = ctx.createGain(); wet.gain.value = 0.28;
    conv.connect(wet); wet.connect(master);
    reverbIn = conv;
    return ctx;
  }

  function impulse(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  let noiseBuf = null;
  function noiseBuffer() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function out(node, bus, rv) {
    node.connect(bus);
    if (rv) { const s = ctx.createGain(); s.gain.value = rv; node.connect(s); s.connect(reverbIn); }
  }

  // Тон с огибающей: f — частота, slide — куда съезжает, filter — {type, f, q}
  function tone({ f = 440, type = 'sine', t = 0, dur = 0.15, vol = 0.3, attack = 0.004, slide = null, filter = null, rv = 0, bus = sfxBus, vibrato = 0 }) {
    if (bus === sfxBus && theme() === 'retro') { type = 'square'; vol *= 0.45; rv = 0; filter = filter || { f: 4000 }; }
    if (bus === sfxBus && theme() === 'soft') { type = type === 'square' || type === 'sawtooth' ? 'triangle' : type; vol *= 0.55; rv = Math.max(rv, 0.3); }
    // «Стекло» (Москвабад): звонкие чистые синусы чуть выше и с хвостом — как интерфейс дорогого смартфона
    // Маракасы (Мексика): мягкий треугольник и шорох сверху
    if (bus === sfxBus && theme() === 'maracas') { type = 'triangle'; vol *= 0.7; if (!tone.shaking) { tone.shaking = true; try { noise({ t, dur: 0.06, vol: vol * 0.5, type: 'highpass', f: 5200 }); } finally { tone.shaking = false; } } }
    if (bus === sfxBus && theme() === 'glass') { type = 'sine'; f *= 1.26; if (slide) slide *= 1.26; vol *= 0.6; rv = Math.max(rv, 0.25); dur = Math.min(dur, 0.35); }
    const now = ctx.currentTime + t;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, now + dur);
    if (vibrato) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 6; lg.gain.value = vibrato;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(now); lfo.stop(now + dur + 0.1);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    let node = o;
    if (filter) {
      const fl = ctx.createBiquadFilter();
      fl.type = filter.type || 'lowpass'; fl.frequency.value = filter.f; fl.Q.value = filter.q || 0.7;
      o.connect(fl); node = fl;
    }
    node.connect(g);
    out(g, bus, rv);
    o.start(now); o.stop(now + dur + 0.05);
  }

  // Шум: щелчки, шорохи, удары, тарелки
  function noise({ t = 0, dur = 0.1, vol = 0.3, type = 'bandpass', f = 2000, q = 1, sweep = null, rv = 0, bus = sfxBus, attack = 0.002 }) {
    const now = ctx.currentTime + t;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer();
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const fl = ctx.createBiquadFilter();
    fl.type = type; fl.frequency.setValueAtTime(f, now); fl.Q.value = q;
    if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(fl); fl.connect(g);
    out(g, bus, rv);
    src.start(now, Math.random() * 0.5); src.stop(now + dur + 0.05);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Гц
  const arp = (notes, gap, o) => notes.forEach((n, i) => tone({ f: N(n), t: i * gap, ...o }));

  const SFX = {
    click: () => tone({ f: 900, type: 'triangle', dur: 0.04, vol: 0.06 }),
    tap: () => {
      const p = 1 + (Math.random() - 0.5) * 0.12;
      tone({ f: 1480 * p, dur: 0.14, vol: 0.09, rv: 0.15 });
      tone({ f: 2330 * p, dur: 0.09, vol: 0.05 });
      tone({ f: 170 * p, slide: 80, type: 'triangle', dur: 0.07, vol: 0.14 });
    },
    crit: () => { SFX.tap(); arp([84, 88, 91, 96], 0.045, { type: 'triangle', dur: 0.22, vol: 0.09, rv: 0.35 }); },
    coin: () => { tone({ f: N(88), dur: 0.12, vol: 0.12, rv: 0.2 }); tone({ f: N(93), t: 0.07, dur: 0.35, vol: 0.12, rv: 0.25 }); },
    buy: () => {
      noise({ dur: 0.04, vol: 0.2, type: 'highpass', f: 3000 });
      tone({ f: 160, type: 'square', dur: 0.05, vol: 0.06, filter: { f: 900 } });
      tone({ f: N(96), t: 0.08, dur: 0.6, vol: 0.12, rv: 0.4 });
      tone({ f: N(103), t: 0.08, dur: 0.5, vol: 0.05, rv: 0.4 });
    },
    good: () => arp([76, 80], 0.07, { dur: 0.18, vol: 0.06, rv: 0.25 }),
    bad: () => arp([62, 58], 0.09, { type: 'triangle', dur: 0.2, vol: 0.07, filter: { f: 1500 } }),
    error: () => { tone({ f: 140, type: 'square', dur: 0.12, vol: 0.07, filter: { f: 700 } }); tone({ f: 120, type: 'square', t: 0.13, dur: 0.14, vol: 0.07, filter: { f: 700 } }); },
    levelup: () => {
      arp([72, 76, 79, 84, 88], 0.08, { type: 'triangle', dur: 0.3, vol: 0.1, rv: 0.4 });
      [72, 76, 79, 84].forEach((n) => tone({ f: N(n), t: 0.45, dur: 1.2, vol: 0.06, rv: 0.5, vibrato: 3 }));
    },
    ach: () => {
      arp([79, 84, 88], 0.09, { type: 'triangle', dur: 0.3, vol: 0.1, rv: 0.4 });
      [79, 83, 86, 91].forEach((n) => tone({ f: N(n), t: 0.3, dur: 1, vol: 0.05, rv: 0.5 }));
    },
    quest: () => arp([81, 86, 88, 93], 0.06, { dur: 0.6, vol: 0.07, rv: 0.6, vibrato: 2 }),
    trash: () => { for (let i = 0; i < 6; i++) noise({ t: i * 0.18, dur: 0.12, vol: 0.12, f: 900 + Math.random() * 700, q: 3 }); },
    loot: () => { noise({ dur: 0.25, vol: 0.12, type: 'highpass', f: 1500, sweep: 6000 }); arp([84, 88, 91, 96, 100], 0.05, { dur: 0.3, vol: 0.07, rv: 0.5 }); },
    lootBad: () => { tone({ f: 110, slide: 55, type: 'triangle', dur: 0.4, vol: 0.2 }); arp([60, 57, 53], 0.12, { type: 'sawtooth', dur: 0.25, vol: 0.04, filter: { f: 900 } }); },
    eat: () => { for (let i = 0; i < 3; i++) noise({ t: i * 0.11, dur: 0.07, vol: 0.18, type: 'bandpass', f: 1800 + i * 300, q: 2 }); },
    sleep: () => arp([79, 76, 72, 67], 0.22, { dur: 0.7, vol: 0.05, rv: 0.6 }),
    wake: () => arp([67, 72, 76, 79], 0.1, { dur: 0.4, vol: 0.06, rv: 0.4 }),
    gym: () => { tone({ f: 90, slide: 50, type: 'triangle', dur: 0.2, vol: 0.3 }); noise({ t: 0.02, dur: 0.15, vol: 0.12, type: 'lowpass', f: 600 }); },
    card: () => noise({ dur: 0.09, vol: 0.16, type: 'bandpass', f: 2500, sweep: 5000, q: 0.8 }),
    flip: () => { noise({ dur: 0.06, vol: 0.14, type: 'highpass', f: 3000 }); tone({ f: 700, slide: 1200, dur: 0.06, vol: 0.04 }); },
    chip: () => { tone({ f: 2600, dur: 0.05, vol: 0.08 }); tone({ f: 3300, t: 0.035, dur: 0.05, vol: 0.06 }); noise({ dur: 0.03, vol: 0.08, type: 'highpass', f: 4000 }); },
    spin: () => { for (let i = 0; i < 14; i++) tone({ f: 1100, type: 'square', t: i * 0.07, dur: 0.02, vol: 0.025, filter: { f: 2500 } }); },
    tick: () => tone({ f: 1500, type: 'square', dur: 0.015, vol: 0.03, filter: { f: 3000 } }),
    reelStop: () => { tone({ f: 180, slide: 90, type: 'triangle', dur: 0.12, vol: 0.2 }); noise({ dur: 0.04, vol: 0.1, type: 'highpass', f: 2500 }); },
    win: () => { arp([79, 84, 88, 91], 0.07, { type: 'triangle', dur: 0.35, vol: 0.1, rv: 0.4 }); SFX.coin(); },
    jackpot: () => {
      arp([72, 76, 79, 84, 88, 91, 96], 0.07, { type: 'square', dur: 0.25, vol: 0.05, filter: { f: 3000 }, rv: 0.4 });
      for (let i = 0; i < 8; i++) tone({ f: N(96 + (i % 3) * 4), t: 0.5 + i * 0.08, dur: 0.3, vol: 0.06, rv: 0.4 });
      [72, 76, 79, 84].forEach((n) => tone({ f: N(n), t: 0.5, dur: 1.6, vol: 0.06, rv: 0.6, type: 'triangle' }));
    },
    lose: () => arp([67, 64, 60], 0.13, { dur: 0.3, vol: 0.07, rv: 0.3 }),
    dice: () => { for (let i = 0; i < 7; i++) noise({ t: i * 0.06 + Math.random() * 0.02, dur: 0.04, vol: 0.15, type: 'bandpass', f: 3000 + Math.random() * 2000, q: 4 }); },
    rocket: () => tone({ f: 300, slide: 900, type: 'sawtooth', dur: 0.4, vol: 0.03, filter: { f: 1500 } }),
    boom: () => { noise({ dur: 0.7, vol: 0.4, type: 'lowpass', f: 1200, sweep: 80 }); tone({ f: 80, slide: 30, type: 'triangle', dur: 0.5, vol: 0.35 }); },
    cashout: () => { SFX.coin(); arp([84, 91], 0.08, { dur: 0.3, vol: 0.08, rv: 0.4 }); },
    punch: () => { noise({ dur: 0.12, vol: 0.45, type: 'lowpass', f: 700 }); tone({ f: 95, slide: 40, type: 'triangle', dur: 0.15, vol: 0.4 }); },
    heavy: () => { noise({ dur: 0.2, vol: 0.55, type: 'lowpass', f: 900 }); tone({ f: 70, slide: 30, type: 'triangle', dur: 0.3, vol: 0.5 }); },
    block: () => { tone({ f: 320, type: 'square', dur: 0.06, vol: 0.08, filter: { f: 1400 } }); noise({ dur: 0.05, vol: 0.15, f: 1500, q: 2 }); },
    whoosh: () => noise({ dur: 0.22, vol: 0.15, type: 'bandpass', f: 400, sweep: 2500, q: 1.5 }),
    ko: () => { SFX.heavy(); arp([55, 52, 48], 0.16, { type: 'sawtooth', dur: 0.35, vol: 0.05, filter: { f: 800 }, t: 0.2 }); },
    bell: () => { tone({ f: N(88), dur: 1.2, vol: 0.1, rv: 0.6 }); tone({ f: N(88) * 2.76, dur: 0.6, vol: 0.03, rv: 0.6 }); },
    bark: () => { [0, 0.18].forEach((t) => { noise({ t, dur: 0.09, vol: 0.2, f: 900, q: 1.5 }); tone({ t, f: 420, slide: 260, type: 'sawtooth', dur: 0.09, vol: 0.06, filter: { f: 1200 } }); }); },
    meow: () => {
      tone({ f: 650, slide: 950, dur: 0.18, vol: 0.06, vibrato: 12, rv: 0.2 });
      tone({ t: 0.18, f: 950, slide: 520, dur: 0.3, vol: 0.06, vibrato: 12, rv: 0.2 });
    },
    chirp: () => { tone({ f: 1800, slide: 2600, dur: 0.07, vol: 0.05 }); tone({ t: 0.09, f: 2000, slide: 2900, dur: 0.07, vol: 0.05 }); },
    squeak: () => tone({ f: 2400, slide: 3200, dur: 0.08, vol: 0.05, vibrato: 30 }),
    notify: () => tone({ f: N(84), dur: 0.4, vol: 0.06, rv: 0.4 }),
    break: () => { noise({ dur: 0.3, vol: 0.3, type: 'highpass', f: 1500 }); tone({ f: 200, slide: 60, type: 'square', dur: 0.25, vol: 0.06, filter: { f: 800 } }); },
  };

  // ---------- Музыка: лаунж-джаз для казино, генерируется в реальном времени ----------
  // ii–V–I–VI в до мажоре: Dm9 · G13 · Cmaj9 · A7(b9)
  const LOUNGE = {
    bpm: 88,
    chords: [
      { root: 38, notes: [62, 65, 69, 72, 76] },
      { root: 43, notes: [59, 64, 65, 69, 71] },
      { root: 36, notes: [59, 62, 64, 67, 71] },
      { root: 45, notes: [61, 64, 67, 70, 73] },
    ],
    scale: [72, 74, 76, 79, 81, 84, 86, 88],
  };

  function scheduleLounge(t, s) {
    const beat = 60 / LOUNGE.bpm;
    const bar = Math.floor(s / 8) % LOUNGE.chords.length;
    const ch = LOUNGE.chords[bar];
    const eighth = s % 8;
    const swing = eighth % 2 === 1 ? beat * 0.16 : 0;
    const at = t + swing - ctx.currentTime;
    const m = { bus: musicBus };

    // Райд-тарелка и щётки
    if (eighth % 2 === 0 || Math.random() < 0.35) noise({ ...m, t: at, dur: 0.18, vol: eighth % 4 === 2 ? 0.05 : 0.03, type: 'highpass', f: 7000 });
    if (eighth % 4 === 2) noise({ ...m, t: at, dur: 0.12, vol: 0.035, type: 'bandpass', f: 2200, q: 0.7 });
    // Шагающий бас на четверти
    if (eighth % 2 === 0) {
      const walk = [ch.root, ch.root + 7, ch.root + 3 + (bar % 2), ch.root + 5];
      const n = eighth === 6 ? LOUNGE.chords[(bar + 1) % 4].root + (Math.random() < 0.5 ? 1 : -1) : walk[eighth / 2];
      tone({ ...m, t: at, f: N(n), type: 'triangle', dur: beat * 0.9, vol: 0.16, attack: 0.01, filter: { f: 500 } });
    }
    // Электропиано: аккорды на 2 и 4 долю
    if (eighth === 2 || eighth === 6 || (eighth === 7 && Math.random() < 0.3)) {
      ch.notes.forEach((n, i) => {
        tone({ ...m, t: at + i * 0.012, f: N(n), dur: beat * 1.4, vol: 0.022, attack: 0.012, rv: 0.4, filter: { f: 2200 } });
        tone({ ...m, t: at + i * 0.012, f: N(n) * 2, dur: beat * 0.6, vol: 0.006, rv: 0.4 });
      });
    }
    // Виброфон: ленивая импровизация
    if (eighth % 2 === 0 && Math.random() < 0.32) {
      const pool = LOUNGE.scale.filter((n) => ch.notes.some((c) => (c - n) % 12 === 0) || Math.random() < 0.4);
      const n = pool[Math.floor(Math.random() * pool.length)] || 76;
      tone({ ...m, t: at, f: N(n), dur: beat * 2.2, vol: 0.045, attack: 0.006, vibrato: 2.5, rv: 0.55 });
    }
  }

  // ---------- Лоу-фай для главного экрана: бочка-снейр, мягкие аккорды, треск винила ----------
  const LOFI = { bpm: 78, chords: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]], roots: [33, 29, 36, 31], scale: [69, 72, 74, 76, 79, 81] };
  function scheduleLofi(t, s) {
    const beat = 60 / LOFI.bpm;
    const bar = Math.floor(s / 8) % 4, e = s % 8;
    const swing = e % 2 === 1 ? beat * 0.12 : 0;
    const at = t + swing - ctx.currentTime;
    const m = { bus: musicBus };
    if (e === 0 || e === 5) tone({ ...m, t: at, f: 60, slide: 38, type: 'sine', dur: 0.35, vol: 0.32 });
    if (e === 2 || e === 6) noise({ ...m, t: at, dur: 0.16, vol: 0.09, type: 'bandpass', f: 1800, q: 0.8 });
    if (e % 2 === 1 || Math.random() < 0.3) noise({ ...m, t: at, dur: 0.05, vol: 0.02, type: 'highpass', f: 8000 });
    if (Math.random() < 0.5) noise({ ...m, t: at + Math.random() * beat, dur: 0.01, vol: 0.012, type: 'highpass', f: 5000 }); // треск
    if (e === 0) LOFI.chords[bar].forEach((n, i) => tone({ ...m, t: at + i * 0.03, f: N(n), dur: beat * 3.6, vol: 0.022, attack: 0.05, rv: 0.4, filter: { f: 1400 } }));
    if (e === 0 || e === 4) tone({ ...m, t: at, f: N(LOFI.roots[bar]), type: 'triangle', dur: beat * 1.8, vol: 0.12, filter: { f: 400 } });
    if (e % 2 === 0 && Math.random() < 0.22) tone({ ...m, t: at, f: N(pickN(LOFI.scale)), dur: beat * 1.5, vol: 0.03, rv: 0.5, vibrato: 2 });
  }

  // ---------- Дворовый вальс: гармошка и гитара на три четверти ----------
  const WALTZ = { bpm: 150, chords: [[57, 60, 64], [52, 56, 59], [57, 60, 64], [50, 53, 57], [52, 56, 59], [57, 60, 64]], roots: [45, 40, 45, 38, 40, 45], scale: [69, 71, 72, 74, 76, 77, 79, 81] };
  function scheduleWaltz(t, s) {
    const beat = 60 / WALTZ.bpm;
    const bar = Math.floor(s / 3) % WALTZ.chords.length, e = s % 3;
    const at = t - ctx.currentTime;
    const m = { bus: musicBus };
    if (e === 0) tone({ ...m, t: at, f: N(WALTZ.roots[bar]), type: 'triangle', dur: beat * 0.9, vol: 0.16, filter: { f: 600 } });
    else WALTZ.chords[bar].forEach((n) => tone({ ...m, t: at, f: N(n), type: 'sawtooth', dur: beat * 0.55, vol: 0.012, filter: { f: 1600 }, vibrato: 3 }));
    if (e === 0 || Math.random() < 0.4) {
      const n = pickN(WALTZ.scale.filter((x) => WALTZ.chords[bar].some((c) => (c - x) % 12 === 0)).concat(pickN(WALTZ.scale)));
      tone({ ...m, t: at, f: N(n), type: 'sawtooth', dur: beat * (e === 0 ? 1.8 : 0.9), vol: 0.025, filter: { f: 2200 }, vibrato: 4, rv: 0.3 });
    }
  }

  // ---------- 8-бит: чиптюн-арпеджио и квадратный бас ----------
  const CHIP = { bpm: 128, prog: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], scale: [72, 74, 76, 79, 81, 84] };
  function scheduleChip(t, s) {
    const beat = 60 / CHIP.bpm / 2;
    const bar = Math.floor(s / 16) % 4, e = s % 16;
    const at = t - ctx.currentTime;
    const m = { bus: musicBus };
    const ch = CHIP.prog[bar];
    tone({ ...m, t: at, f: N(ch[e % 3] + 12), type: 'square', dur: beat * 0.8, vol: 0.018, filter: { f: 3500 } });
    if (e % 4 === 0) tone({ ...m, t: at, f: N(ch[0] - 24), type: 'square', dur: beat * 1.6, vol: 0.04, filter: { f: 800 } });
    if (e % 8 === 4) noise({ ...m, t: at, dur: 0.06, vol: 0.06, type: 'highpass', f: 3000 });
    if (e % 4 === 2 && Math.random() < 0.6) tone({ ...m, t: at, f: N(pickN(CHIP.scale)), type: 'square', dur: beat * 1.8, vol: 0.02, filter: { f: 4000 } });
  }

  // ---------- Москвабад: дип-хаус «в метро» — ровная бочка, хэты на слабую долю, минорные септаккорды ----------
  const METRO = { bpm: 120, chords: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 58, 62, 65], [52, 55, 59, 62]], roots: [33, 29, 31, 28], pluck: [69, 72, 74, 76, 79] };
  function scheduleMetro(t, s) {
    const six = 60 / METRO.bpm / 4;
    const bar = Math.floor(s / 16) % 4, e = s % 16;
    const at = t - ctx.currentTime;
    const m = { bus: musicBus };
    if (e % 4 === 0) tone({ ...m, t: at, f: 58, slide: 40, type: 'sine', dur: 0.28, vol: 0.34 });
    if (e % 4 === 2) noise({ ...m, t: at, dur: 0.09, vol: 0.05, type: 'highpass', f: 7500 });
    if (e === 4 || e === 12) noise({ ...m, t: at, dur: 0.14, vol: 0.06, type: 'bandpass', f: 1500, q: 0.9, rv: 0.3 });
    if ([2, 3, 6, 10, 11, 14].includes(e)) tone({ ...m, t: at, f: N(METRO.roots[bar] + (e === 14 ? 7 : 0)), type: 'triangle', dur: six * 1.6, vol: 0.13, filter: { f: 420 } });
    if (e === 0) METRO.chords[bar].forEach((n, i) => tone({ ...m, t: at + i * 0.02, f: N(n), type: 'sawtooth', dur: six * 14, vol: 0.008, attack: 0.25, rv: 0.5, filter: { f: 1100 } }));
    if (e % 2 === 1 && Math.random() < 0.18) tone({ ...m, t: at, f: N(pickN(METRO.pluck)), dur: six * 3, vol: 0.03, rv: 0.55, filter: { f: 3000 } });
  }

  // ---------- Москвабад: неоновый синтвейв — ночной проспект, арпеджио и гулкий снейр ----------
  const NEON = { bpm: 100, prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], roots: [45, 41, 36, 43], lead: [69, 71, 72, 74, 76, 79] };
  function scheduleNeon(t, s) {
    const eighth = 60 / NEON.bpm / 2;
    const bar = Math.floor(s / 8) % 4, e = s % 8;
    const at = t - ctx.currentTime;
    const m = { bus: musicBus };
    const ch = NEON.prog[bar];
    if (e === 0 || e === 4) tone({ ...m, t: at, f: 62, slide: 42, type: 'sine', dur: 0.3, vol: 0.3 });
    if (e === 2 || e === 6) noise({ ...m, t: at, dur: 0.22, vol: 0.08, type: 'bandpass', f: 1700, q: 0.7, rv: 0.6 });
    tone({ ...m, t: at, f: N(NEON.roots[bar] - (e % 2 ? 0 : 12)), type: 'sawtooth', dur: eighth * 0.85, vol: 0.05, filter: { f: 500 } });
    tone({ ...m, t: at, f: N(ch[e % 3] + 12), type: 'square', dur: eighth * 0.7, vol: 0.012, rv: 0.35, filter: { f: 2600 } });
    if (e === 0 && Math.random() < 0.7) tone({ ...m, t: at, f: N(pickN(NEON.lead)), type: 'sawtooth', dur: eighth * 5, vol: 0.022, attack: 0.08, vibrato: 4, rv: 0.6, filter: { f: 2200 } });
  }

  // ---------- Мексика (4.0): мариачи — вальсовый «умпа-па», гитаррон, перебор гитары и труба ----------
  const MARIACHI = { bpm: 150, chords: [[60, 64, 67], [55, 59, 62], [55, 59, 62], [60, 64, 67], [53, 57, 60], [60, 64, 67], [55, 59, 62], [60, 64, 67]],
    roots: [36, 31, 31, 36, 29, 36, 31, 36], tune: [76, 79, 77, 76, 74, 72, 74, 76, 79, 81, 79, 77, 76, 74, 72, 71] };
  function scheduleMariachi(t, s) {
    const beat = 60 / MARIACHI.bpm;
    const bar = Math.floor(s / 3) % 8, e = s % 3;
    const at = t - ctx.currentTime;
    const m = { bus: musicBus };
    const ch = MARIACHI.chords[bar];
    if (e === 0) tone({ ...m, t: at, f: N(MARIACHI.roots[bar]), type: 'triangle', dur: beat * 0.9, vol: 0.16, filter: { f: 600 } });
    else ch.forEach((n, i) => tone({ ...m, t: at + i * 0.012, f: N(n), type: 'triangle', dur: beat * 0.45, vol: 0.03, filter: { f: 2800 } }));
    // Труба: фраза на сильные доли, с вибрато
    if (e === 0 && bar % 2 === 0) { const n = MARIACHI.tune[(s / 3 + bar) % 16 | 0]; tone({ ...m, t: at, f: N(n), type: 'sawtooth', dur: beat * 1.6, vol: 0.03, attack: 0.03, vibrato: 6, rv: 0.25, filter: { f: 2400 } }); }
    if (e === 2 && Math.random() < 0.3) noise({ ...m, t: at, dur: 0.05, vol: 0.04, type: 'highpass', f: 6000 });
  }
  // ---------- Мексика: кумбия — гуиро «шкряб-шкряб», качающийся бас и аккордеон ----------
  const CUMBIA = { bpm: 96, prog: [[57, 60, 64], [52, 56, 59], [57, 60, 64], [52, 56, 59]], roots: [45, 40, 45, 40], acc: [69, 72, 71, 69, 68, 69, 72, 76] };
  function scheduleCumbia(t, s) {
    const eighth = 60 / CUMBIA.bpm / 2;
    const bar = Math.floor(s / 8) % 4, e = s % 8;
    const at = t - ctx.currentTime;
    const m = { bus: musicBus };
    noise({ ...m, t: at, dur: e % 2 ? 0.05 : 0.12, vol: 0.035, type: 'bandpass', f: 4200, q: 2 }); // гуиро
    if (e === 0 || e === 3 || e === 4) tone({ ...m, t: at, f: N(CUMBIA.roots[bar] + (e === 3 ? 7 : 0)), type: 'triangle', dur: eighth * 1.4, vol: 0.14, filter: { f: 500 } });
    if (e === 2 || e === 6) tone({ ...m, t: at, f: 180, slide: 120, type: 'sine', dur: 0.12, vol: 0.12 });
    if (e % 2 === 1) CUMBIA.prog[bar].forEach((n) => tone({ ...m, t: at, f: N(n + 12), type: 'square', dur: eighth * 0.6, vol: 0.008, filter: { f: 2000 } }));
    if (Math.random() < 0.35) tone({ ...m, t: at, f: N(CUMBIA.acc[(s + bar) % 8]), type: 'sawtooth', dur: eighth * 1.6, vol: 0.016, vibrato: 5, rv: 0.2, filter: { f: 2200 } });
  }

  // Original Paris motifs: a three-beat musette and a restrained jazz quartet.
  const FR_MUSIC={chords:[[62,65,69],[67,70,74],[60,64,67],[57,61,64]],roots:[38,43,36,33],tune:[74,77,76,74,72,69,72,73,74,77,81,79,77,76,73,74]};
  function scheduleMusette(t,s){
    const beat=60/126,bar=Math.floor(s/3)%4,e=s%3,at=t-ctx.currentTime,m={bus:musicBus};
    if(e===0)tone({...m,t:at,f:N(FR_MUSIC.roots[bar]),type:'triangle',dur:beat*.8,vol:.12,filter:{f:650}});
    else FR_MUSIC.chords[bar].forEach((n,i)=>tone({...m,t:at+i*.008,f:N(n),type:'sawtooth',dur:beat*.65,vol:.012,vibrato:4,filter:{f:1700},rv:.2}));
    tone({...m,t:at,f:N(FR_MUSIC.tune[s%16]),type:'sawtooth',dur:beat*.85,vol:.022,vibrato:5,filter:{f:2100},rv:.25});
  }
  function scheduleFrJazz(t,s){
    const beat=60/102/2,bar=Math.floor(s/8)%4,e=s%8,at=t-ctx.currentTime,m={bus:musicBus};
    if(e%2===0)tone({...m,t:at,f:N(FR_MUSIC.roots[bar]+(e===4?7:0)),type:'triangle',dur:beat*1.5,vol:.1,filter:{f:500}});
    if(e===1||e===5)FR_MUSIC.chords[bar].forEach(n=>tone({...m,t:at,f:N(n),type:'sine',dur:beat*2.5,vol:.022,rv:.3}));
    if(e===3||e===7)tone({...m,t:at,f:N(FR_MUSIC.tune[(s+2)%16]),type:'triangle',dur:beat*1.7,vol:.025,vibrato:3,rv:.3});
    if(e%2===1)noise({...m,t:at,dur:.06,vol:.015,type:'highpass',f:6000});
  }
  const pickN = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // Каждой мелодии — свой «шаг» сетки и планировщик
  const TRACKS = {
    musette:{step:()=>60/126,play:scheduleMusette},
    frjazz:{step:()=>60/102/2,play:scheduleFrJazz},
    lounge: { step: () => 60 / LOUNGE.bpm / 2, play: scheduleLounge },
    lofi: { step: () => 60 / LOFI.bpm / 2, play: scheduleLofi },
    waltz: { step: () => 60 / WALTZ.bpm, play: scheduleWaltz },
    chip: { step: () => 60 / CHIP.bpm / 2, play: scheduleChip },
    metro: { step: () => 60 / METRO.bpm / 4, play: scheduleMetro },
    neon: { step: () => 60 / NEON.bpm / 2, play: scheduleNeon },
    mariachi: { step: () => 60 / MARIACHI.bpm, play: scheduleMariachi },
    cumbia: { step: () => 60 / CUMBIA.bpm / 2, play: scheduleCumbia },
  };

  function scheduler() {
    const tr = TRACKS[track] || TRACKS.lounge;
    while (nextTime < ctx.currentTime + 0.15) {
      tr.play(nextTime, step);
      nextTime += tr.step();
      step++;
    }
  }

  function music(name) {
    if (!init()) return;
    if (name && !opts().music) name = null;
    if (name === track) return;
    track = name;
    const now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(musicBus.gain.value, now);
    if (name) {
      step = 0; nextTime = now + 0.1;
      if (!timer) timer = setInterval(scheduler, 30);
      musicBus.gain.linearRampToValueAtTime(0.75 * musicVol(), now + 1.5);
    } else {
      musicBus.gain.linearRampToValueAtTime(0, now + 0.8);
      setTimeout(() => { if (!track && timer) { clearInterval(timer); timer = null; } }, 900);
    }
  }

  // Применить громкость из настроек сразу, без перезапуска
  function applyVolume() {
    if (!ctx) return;
    sfxBus.gain.value = 0.6 * sfxVol();
    if (track) { musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(0.75 * musicVol(), ctx.currentTime); }
  }

  function play(name) {
    if (!opts().sfx || !SFX[name]) return;
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    sfxBus.gain.value = 0.6 * sfxVol();
    try { SFX[name](); } catch (e) { /* звук не критичен */ }
  }

  // Браузеры разрешают звук только после первого касания
  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }
  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  return { play, music, unlock, applyVolume, get track() { return track; } };
})();
