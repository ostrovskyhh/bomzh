// Pilot milestones and separate foreground visits. Gameplay never waits for analytics.
const neighborhood534Metrics = { visit: true, hiddenAt: 0, busy: false, next: 0, todo: new Set(), sent: new Set() };

function neighborhood534Metric(step) {
  if (!neighborhood534Metrics.sent.has(step)) neighborhood534Metrics.todo.add(step);
}

document.addEventListener('visibilitychange', () => {
  const metrics = neighborhood534Metrics;
  if (document.hidden) metrics.hiddenAt = Date.now();
  else if (metrics.hiddenAt && Date.now() - metrics.hiddenAt >= 30 * 60000) metrics.visit = true;
});

HOOKS.tick.push(async () => {
  const metrics = neighborhood534Metrics;
  const now = Date.now();
  if (!LOADED || document.hidden || metrics.busy || now < metrics.next || !onlineOn()) return;
  const district = S.neighborhood534;
  if (district?.enteredAt) neighborhood534Metric('garage');
  if (district?.route) neighborhood534Metric('route');
  if (district?.firstJobAt) neighborhood534Metric('first_order');
  for (let project = 1; project <= 3 && project <= (district?.stage || 0); project++) {
    neighborhood534Metric('project_' + project);
  }
  if (district?.network) neighborhood534Metric('network_route');
  if (district?.networkFirstDoneAt) neighborhood534Metric('network_order');
  const visit = metrics.visit;
  const steps = [...metrics.todo];
  if (!visit && !steps.length) return;
  const cohort = neighborhood534NetworkEligible() ? 'finale'
    : city() === 'zas' && !S.prestige && (S.quest?.idx || 0) < 8 ? 'early' : 'story';
  metrics.busy = true;
  metrics.next = now + 5000;
  try {
    const result = await apiPost('funnel/neighborhood', { cohort, steps, visit });
    if (!result?.ok) throw new Error('Neighborhood metrics unavailable');
    if (visit) metrics.visit = false;
    for (const step of steps) {
      metrics.todo.delete(step);
      metrics.sent.add(step);
    }
  } catch (error) {
    metrics.next = now + 60000;
  } finally {
    metrics.busy = false;
  }
});
