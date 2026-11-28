// Settle a player trade against the saved profile, preserving taps earned during the request.
const marketLang547 = (ru, en) => I18N.lang === 'en' ? en : ru;
let marketWriting547 = false, marketTravelCheck547 = false;
function marketSyncBusy547() { return barter545Busy || marketWriting547 || SAVE_LOCK || !!ALT_SAVE; }
function marketRevision547() { return S.marketRev547 || 0; }
function marketRecovery547(remote, reason) {
  if (SAVE_LOCK) return;
  neighborhoodSaveRemote = remote;
  SAVE_LOCK = true;
  ALT_SAVE = null;
  const t = marketLang547;
  const message = reason ? t('Переход не сохранён. Загрузи профиль, открой рынок и заверши открытые сделки или расписки.', 'Travel was not saved. Load your profile and settle your open market orders or IOUs.')
    : t('На другом устройстве или на рынке изменился твой профиль. Можно скачать местную копию перед загрузкой.', 'Your profile changed on another device or at the market. You can download the device copy before loading it.');
  openModal(`<h3>${t('Обновление профиля','Profile update')}</h3><p>${message}</p><div class="btns"><button class="btn wide" data-act="adminSyncBackup">${t('Скачать мою копию','Download device copy')}</button><button class="btn primary wide" data-act="neighborhoodSaveUseServer">${t('Загрузить профиль','Load profile')}</button></div>`, {center:true, locked:true});
}

function marketMerge547(state, entries, base, marker) {
  // Validate the complete sequence before touching the local save. Older entries may have rolled off.
  let money = state.money, glass = state.glass546?.stock ?? 0;
  const inventory = {...(state.inv || {})};
  for (const e of entries) {
    if (e.base !== base || e.rev !== base + 1 || e.marker !== marker + 1 || !e.patch) return false;
    const p = e.patch;
    if (!Number.isSafeInteger(p.money) || !Number.isSafeInteger(p.glass) || !p.inv || typeof p.inv !== 'object') return false;
    if (p.money) {
      money += p.money;
      if (!Number.isFinite(money) || money < 0 || money > Number.MAX_SAFE_INTEGER) return false;
    }
    if (p.glass) {
      glass += p.glass;
      if (!state.glass546 || !Number.isSafeInteger(glass) || glass < 0) return false;
    }
    for (const [item, change] of Object.entries(p.inv)) {
      if (!['scrap','copper'].includes(item) || !Number.isSafeInteger(change)) return false;
      inventory[item] = (inventory[item] || 0) + change;
      if (!Number.isSafeInteger(inventory[item]) || inventory[item] < 0) return false;
    }
    marker = e.marker;
    base = e.rev;
  }
  state.money = money;
  state.inv = inventory;
  if (state.glass546) state.glass546.stock = glass;
  state.marketRev547 = marker;
  return true;
}
function marketApply547(entries, base, marker) {
  if (!marketMerge547(S,entries,base,marker)) return false;
  base = entries[entries.length-1].rev;
  serverBase = base;
  marketCheckpoint547(base,S.marketRev547);
  REV_FLOOR = Math.max(REV_FLOOR, base, S.rev || 0);
  serverReady = true;
  save(true);
  updateHud();
  return true;
}
// A device can have both offline taps and a sale made by someone else. Store only the last
// acknowledged revision on this device. Merge on launch only if every intervening write was a market receipt.
function marketCheckpointKey547() { return 'market547.checkpoint.' + (tg?.initDataUnsafe?.user?.id || DEVICE_ID); }
function marketCheckpoint547(rev, marker) {
  if (!Number.isSafeInteger(rev) || rev<=0 || !marker) return;
  try { localStorage.setItem(marketCheckpointKey547(), JSON.stringify([rev,marker])); } catch (_) {}
}
function marketStartup547(local, remote) {
  if (!local || !remote || !(remote.marketRev547 > (local.marketRev547||0)) ||
      (remote.city||'zas')!==(local.city||'zas') || (remote.prestige||0)!==(local.prestige||0)) return null;
  let point;
  try { point=JSON.parse(localStorage.getItem(marketCheckpointKey547())); } catch (_) { return null; }
  if (!point || point[1] !== (local.marketRev547||0) || !(local.rev>point[0])) return null;
  const log=Array.isArray(remote.marketLog547)?remote.marketLog547.filter(e=>e && e.marker>point[1]):[];
  const last=log[log.length-1];
  if (!last || last.marker!==remote.marketRev547 || last.rev!==remote.rev) return null;
  if (!marketMerge547(local,log,point[0],point[1])) return null;
  local.rev=Math.max(local.rev,remote.rev)+1;
  return local;
}
function marketReceive547(remote) {
  if (!remote || SAVE_LOCK || ALT_SAVE || remote.rev < serverBase) return false;
  const marker = marketRevision547();
  if (remote.marketRev547 === marker) return true;
  const log = Array.isArray(remote.marketLog547) ? remote.marketLog547.filter(e => e && e.marker > marker) : [];
  const last = log[log.length - 1];
  if (last && last.marker === remote.marketRev547 && last.rev === remote.rev &&
      (remote.city || 'zas') === (S.city || 'zas') && (remote.prestige || 0) === (S.prestige || 0) &&
      marketApply547(log, serverBase, marker)) return true;
  marketRecovery547(remote);
  return false;
}
const marketBeforeSeen547 = serverSeen, marketBeforeAdopt547 = adoptOrAsk;
serverSeen = function (remote) {
  if (barter545Sending) return;
  if (remote && (remote.marketRev547 || 0) !== marketRevision547()) return marketReceive547(remote);
  return marketBeforeSeen547(remote);
};
adoptOrAsk = function (remote) {
  if (remote && (remote.marketRev547 || 0) !== marketRevision547()) return marketReceive547(remote);
  return marketBeforeAdopt547(remote);
};
const marketBeforePrestige547 = prestigeProfile;
prestigeProfile = function () {
  const kept = marketBeforePrestige547();
  if (marketRevision547()) kept.marketRev547 = marketRevision547();
  return kept;
};
async function marketRequest547(area, action, data) {
  if (!onlineOn()) throw barter545Error('offline');
  if (area !== 'market' && area !== 'loans') throw barter545Error('invalid');
  return apiPost(area + '547/' + action, data);
}
function marketSnapshot547(area, state) {
  if (area === 'market') garageObserve547(state);
  if (typeof marketBoardSeen547 === 'function') marketBoardSeen547(area,state);
  return state;
}
async function marketRead547(area = 'market', args = {}) {
  if (!LOADED || SAVE_LOCK || ALT_SAVE || barter545Sending) throw barter545Error('busy');
  const result = await marketRequest547(area, 'state', args);
  if (!result?.ok) throw barter545Error(result?.error || 'sync');
  if (result.marker !== marketRevision547()) {
    const latest = await serverGet();
    if (!latest || !marketReceive547(latest) || result.marker !== marketRevision547()) throw barter545Error('stale');
  }
  return marketSnapshot547(area,result);
}
const marketPending547 = new Map();
function marketIntent547(area, action, args) {
  const owner = tg?.initDataUnsafe?.user?.id || DEVICE_ID;
  const signature = JSON.stringify(Object.entries(args).sort(([a],[b]) => a.localeCompare(b)));
  const key = ['market547.intent',owner,area,action,signature].join('.');
  let old = marketPending547.get(key);
  try { old = JSON.parse(localStorage.getItem(key)) || old; } catch (_) {}
  const data = old || {signature, rid: 'market547_' + Array.from(crypto.getRandomValues(new Uint8Array(18)), n=>n.toString(16).padStart(2,'0')).join('')};
  marketPending547.set(key, data);
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  return {rid:data.rid, done() { marketPending547.delete(key); try { localStorage.removeItem(key); } catch (_) {} }};
}
// A reset used to clear the browser before knowing whether the server accepted it.
// For a trading profile, keep playing the original save until settlement and the reset are acknowledged.
async function marketResetProfile547(keep = {}) {
  if (marketSyncBusy547()) return;
  const profile = S, t = marketLang547;
  try {
    const loans = await marketRead547('loans'), market = await marketRead547();
    const block = loans.blockPrestige || (market.needsSettlement && 'market_open');
    if (block) { marketTravelNotice547(block); return; }
    if (S !== profile || marketSyncBusy547()) return;
    for (let i=0; srvBusy && i<50; i++) await wait(100);
    if (srvBusy || marketSyncBusy547() || S !== profile) throw barter545Error('busy');
    barter545Busy = barter545Sending = true;
    try {
      const reset = {...freshState(), ...keep, marketRev547:marketRevision547(),
        ...(S.barterRev545 ? {barterRev545:S.barterRev545} : {}), savedAt:Date.now(), rev:Math.max(serverBase,S.rev || 0)+1};
      // Keep receipts and permanent entitlements that the save service validates on every device.
      for (const k of ['adminRevision','divorceRecoveryClaims','premiumUntil75','vipLegacyUntil75','vipUntil',
        'skins75','travelTickets75','paidClaims516','garageFirstKey534','promoVipClaims517','bjWalletRev',
        'prestigeGift73','prestigeOffer73']) if (Object.hasOwn(S,k)) reset[k]=S[k];
      const r = await serverCall('put',{data:JSON.stringify(reset),savedAt:reset.savedAt,base:serverBase,rev:reset.rev,marketReset:true,force:true});
      if (!r.ok || r.stale) {
        if (r.marketTransition) { marketTravelNotice547(r.marketTransition); return; }
        if (r.marketUpdated && r.data) marketReceive547(parseSave(r.data));
        throw barter545Error('stale');
      }
      S = r.data ? parseSave(r.data) : reset;
      serverBase = r.rev;
      if (cloudOk()) tg.CloudStorage.removeItems([SAVE_KEY+'_meta',SAVE_KEY],()=>{});
      adoptSave(S);
    } finally { barter545Busy = barter545Sending = false; }
  } catch (error) {
    if (!SAVE_LOCK) toast(t('Сброс пока не выполнен. Проверь соединение и состояние сделок.', 'Reset has not completed. Check your connection and open trades.'),'bad');
  }
}
async function marketChange547(area, action, args = {}) {
  if (!onlineOn()) throw barter545Error('offline');
  if (marketSyncBusy547() || !serverReady || !LOADED) throw barter545Error('busy');
  barter545Busy = marketWriting547 = true;
  const profile = S;
  try {
    for (let i=0; srvBusy && i<50; i++) await wait(100);
    if (srvBusy || SAVE_LOCK || ALT_SAVE) throw barter545Error('sync');
    save();
    clearTimeout(srvTimer);
    const flush = S.rev;
    await serverWrite();
    if (S !== profile || serverBase < flush || SAVE_LOCK || ALT_SAVE || srvBusy) throw barter545Error('sync');
    barter545Sending = true;
    const marker = marketRevision547(), base = serverBase, intent = marketIntent547(area,action,args);
    let result;
    try { result = await marketRequest547(area, action, {...args, base, marker, rid:intent.rid}); }
    catch (_) { throw barter545Error('unavailable'); }
    if (result?.ok || result?.error) intent.done();
    if (!result?.ok && !result?.replay) throw barter545Error(result?.error || 'sync');
    if (S !== profile || SAVE_LOCK || ALT_SAVE) throw barter545Error('stale');
    if (!result.replay && result?.receipt?.marker === result.marker &&
        marketApply547([{base, rev:result.rev, marker:result.marker, patch:result.patch}], base, marker)) return marketSnapshot547(area,result);
    const remote = await serverGet();
    if (!remote || !marketReceive547(remote)) throw barter545Error('stale');
    if (result.receipt?.action === action && marketRevision547() >= result.marker) {
      const state = await marketRequest547(area, 'state', {});
      if (state?.ok) return {...marketSnapshot547(area,state), receipt:result.receipt, replay:true};
    }
    throw barter545Error('stale');
  } finally {
    barter545Sending = barter545Busy = marketWriting547 = false;
  }
}
function marketTravelNotice547(code) {
  const t = marketLang547;
  const market = code === 'market_open';
  const message = market ? t('У тебя есть заявки, ставки или вклад в общий заказ. Можно завершить их перед дорогой. На твоём аукционе с действующей ставкой работа достанется победителю по текущей цене.', 'You have listings, bids or a group contribution. Settle them before travelling. Your auction with a bid will sell at its current price.')
   : code === 'loan_collateral' ? t('Провод хранится в залоге. Заёмщик может погасить долг или передать залог. Кредитор может простить долг либо получить залог после срока.', 'Wire is held as collateral. The borrower can repay or surrender it. The lender can forgive the balance or claim collateral after the due date.')
   : t('В новом круге рубли сбрасываются. Сначала дождись возврата или прости остаток в расписке.', 'Cash resets in a new run. Wait for repayment or forgive the remaining balance in your IOU.');
  openModal(`<h3>${t('Перед дорогой','Before you go')}</h3><p>${message}</p><div class="btns">${market ? `<button class="btn primary wide" data-act="marketSettleBefore547">${t('Завершить заявки и вернуть резервы','Settle listings and release reserves')}</button>` : ''}<button class="btn wide" data-act="marketOpen547" data-id="${market?'mine':'loans'}">${market?t('Мои сделки','My trades'):t('Мои расписки','My IOUs')}</button><button class="btn wide" data-act="close">${t('Остаться','Stay here')}</button></div>`, {center:true});
}
ACTIONS.marketSettleBefore547 = async () => {
  try {
    await marketChange547('market','prepareMove');
    closeModal(); toast(marketLang547('Заявки завершены. Теперь можно вернуться к переезду.', 'Listings settled. You can return to travel.'),'good');
  } catch (e) { toast(marketError547(e.code),'bad'); }
};
for (const key of ['moveGo','mexGo','frGo','worldMoveGo50','travelRedeem75','prestigeConfirm','prestigeConfirm73']) {
  const original = ACTIONS[key];
  if (!original) continue;
  ACTIONS[key] = function (...args) {
    if (!marketRevision547()) return original.apply(this,args);
    if (marketTravelCheck547 || marketSyncBusy547()) return;
    marketTravelCheck547 = true;
    const previous = S, from = city(), modal = $('modalRoot')?.firstElementChild;
    return (async () => {
      try {
        const loans = await marketRead547('loans'), market = await marketRead547('market');
        if (S !== previous || city() !== from || $('modalRoot')?.firstElementChild !== modal) return;
        const block = (key.startsWith('prestige') ? loans.blockPrestige : loans.blockMove) || (market.needsSettlement && 'market_open');
        if (block) marketTravelNotice547(block);
        else original.apply(this,args);
      } catch (e) { if (!SAVE_LOCK) toast(marketError547(e.code || 'sync'),'bad'); }
      finally { marketTravelCheck547 = false; }
    })();
  };
}
