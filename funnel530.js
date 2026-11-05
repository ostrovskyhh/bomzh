// 5.30 · Воронка новых игроков: один раз сообщает серверу о каждом пройденном шаге первых дней.
const FUNNEL_530 = {
  open: () => true,
  intro: () => !!S.storySeen,
  tap: () => counter('taps') > 0 || !!(S.stats && S.stats.taps),
  sold: () => counter('sold') > 0,
  ch1: () => !!S.quest && S.quest.idx >= 1,
  ch3: () => !!S.quest && S.quest.idx >= 3,
  ch8: () => !!S.quest && S.quest.idx >= 8,
  day2: () => fs528Age() >= 20 * 3600000,
};
const FN_530 = { next: 0, busy: false };
async function funnelTick530() {
  if (!S.fs528 || FN_530.busy || Date.now() < FN_530.next || !onlineOn()) return;
  const done = S.fn530 || (S.fn530 = {});
  const steps = Object.keys(FUNNEL_530).filter((k) => !done[k] && FUNNEL_530[k]());
  FN_530.next = Date.now() + 5000;
  if (!steps.length) return;
  FN_530.busy = true;
  try {
    await apiPost('funnel/steps', { steps });
    steps.forEach((k) => { done[k] = 1; });
  } catch (e) { FN_530.next = Date.now() + 60000; } // игра не должна зависеть от учёта
  FN_530.busy = false;
}
HOOKS.tick.push(funnelTick530);
