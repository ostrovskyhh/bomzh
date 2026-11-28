// The workshop uses the same server-anchored clock as idle businesses.
// A batch only affects the player's own glass and lanterns.
const GLASS546_MODES = {
  kiln: { rate: 10, cap: 12 },
  rack: { rate: 8, cap: 40 },
};
const GLASS546_PATTERNS = ['amber', 'wave'];

function glass546FinishedChina() {
  // The oldest profiles can have completed the last chapter before the finale flag existed.
  return S.city === 'cn' && S.quest?.idx >= WORLD50.cn.chapters.length;
}

function glass546Eligible() {
  return S.fin528 > 0 || S.prestige >= 2 || S.glass546?.unlocked === true || glass546FinishedChina();
}

function glass546Count(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

function glass546KnownBatch(batch) {
  return batch && typeof batch.mode === 'string' && Object.hasOwn(GLASS546_MODES, batch.mode) && glass546Count(batch.id) > 0;
}

function glass546Batch(batch, now) {
  if (!glass546KnownBatch(batch) || !glass546Count(batch.startedAt)) return null;
  const { rate, cap } = GLASS546_MODES[batch.mode];
  const interval = 3600000 / rate;
  const elapsed = now === null ? 0 : Math.max(0, now - batch.startedAt);
  const ready = Math.min(cap, Math.floor(elapsed / interval));
  return {
    id: batch.id, mode: batch.mode, rate, cap, ready,
    remainingMs: now === null ? null : Math.max(0, batch.startedAt + interval * cap - now),
    nextMs: now === null ? null : ready === cap ? 0 : batch.startedAt + (ready + 1) * interval - now,
  };
}

function glass546View() {
  const state = S.glass546 || {};
  const clock = businessNow();
  const now = Number.isFinite(clock) && clock > 0 ? Math.floor(clock) : null;
  const patterns = Array.isArray(state.patterns) ? [...new Set(state.patterns.filter(p => GLASS546_PATTERNS.includes(p)))] : [];
  const last = state.last;
  const lastValid = glass546KnownBatch(last) && glass546Count(last.count) > 0 && last.count <= GLASS546_MODES[last.mode].cap;
  return {
    eligible: glass546Eligible(), clockReady: now !== null,
    stock: glass546Count(state.stock), active: glass546Batch(state.active, now),
    last: lastValid ? { id: last.id, mode: last.mode, count: last.count, full: last.count === GLASS546_MODES[last.mode].cap } : null,
    completed: glass546Count(state.completed), switched: glass546Count(state.switched),
    patterns, equipped: patterns.includes(state.equipped) ? state.equipped : (patterns[0] || null),
    craftCost: patterns.length ? 16 : 8,
  };
}

function glass546Guard() {
  if (!glass546Eligible()) return { ok: false, code: 'locked' };
  if (!LOADED || SAVE_LOCK || ALT_SAVE || (typeof marketSyncBusy547 === 'function' && marketSyncBusy547())) return { ok: false, code: 'busy' };
  return null;
}

function glass546Save(changes) {
  S.glass546 = { ...S.glass546, unlocked: true, ...changes };
  save(true);
  return { ok: true, code: 'ok' };
}

function glass546Start(mode) {
  const blocked = glass546Guard();
  if (blocked) return blocked;
  if (typeof mode !== 'string' || !Object.hasOwn(GLASS546_MODES, mode)) return { ok: false, code: 'invalid' };
  const view = glass546View();
  if (view.active) return { ok: false, code: 'active' };
  const now = businessNow();
  if (!Number.isFinite(now) || now <= 0) return { ok: false, code: 'clock' };
  const startedAt = Math.floor(now);
  const active = { id: Math.max(startedAt, (view.last?.id || 0) + 1), mode, startedAt };
  const changedMode = view.last && view.last.mode !== mode;
  const changes = { active, switched: view.switched + (changedMode ? 1 : 0) };
  if (view.completed === 1 && view.last && typeof S.glass546.secondBatchChangedMode !== 'boolean') {
    changes.secondBatchChangedMode = changedMode;
  }
  return glass546Save(changes);
}

function glass546Collect(id) {
  const blocked = glass546Guard();
  if (blocked) return blocked;
  const view = glass546View();
  const batch = view.active;
  if (!batch || batch.id !== id) return { ok: false, code: 'stale' };
  if (!view.clockReady) return { ok: false, code: 'clock' };
  if (!batch.ready) return { ok: false, code: 'empty' };
  const last = { id: batch.id, mode: batch.mode, count: batch.ready, full: batch.ready === batch.cap };
  return glass546Save({ active: null, last, stock: Math.min(Number.MAX_SAFE_INTEGER, view.stock + batch.ready), completed: view.completed + 1 });
}

function glass546Craft(pattern) {
  const blocked = glass546Guard();
  if (blocked) return blocked;
  if (!GLASS546_PATTERNS.includes(pattern)) return { ok: false, code: 'invalid' };
  const view = glass546View();
  if (view.patterns.includes(pattern)) return { ok: false, code: 'owned' };
  if (view.stock < view.craftCost) return { ok: false, code: 'materials' };
  return glass546Save({
    stock: view.stock - view.craftCost,
    patterns: [...view.patterns, pattern], equipped: pattern,
  });
}

function glass546Equip(pattern) {
  const blocked = glass546Guard();
  if (blocked) return blocked;
  if (!glass546View().patterns.includes(pattern)) {
    return { ok: false, code: 'invalid' };
  }
  if (S.glass546.equipped === pattern) return { ok: true, code: 'ok' };
  return glass546Save({ equipped: pattern });
}

const glass546PreviousPrestige = prestigeProfile;
prestigeProfile = function () {
  const profile = glass546PreviousPrestige();
  if (S.glass546) profile.glass546 = S.glass546;
  else if (!S.fin528 && glass546FinishedChina()) profile.glass546 = { unlocked: true };
  return profile;
};
