// NPC exchange. SQLite owns the reservation and settlement. Local-only play stays available.
const BARTER545_WAIT_MS = 30 * 60 * 1000;
const BARTER545_GOODS = { scrap: [18, 's1'], copper: [28, 'b1'] };
function barter545Offers(item) {
  if (!Object.hasOwn(BARTER545_GOODS, item)) return [];
  const [food, collectible] = BARTER545_GOODS[item];
  return [{ id: 'meal', food }, { id: 'collector', item: collectible }];
}

let barter545Busy = false, barter545Sending = false;
function barter545Error(code) { return Object.assign(new Error(code), { code }); }

function barter545Reconcile(remote) {
  if (!remote || SAVE_LOCK) return;
  // Even a short offline session may contain a unique find. The chooser lets its owner keep a copy.
  neighborhoodSaveRemote = remote;
  ALT_SAVE = null;
  SAVE_LOCK = true;
  const en = I18N.lang === 'en';
  openModal(`<h3>${en ? 'Your server profile has been updated' : 'Профиль на сервере обновился'}</h3>
    <p>${en ? 'Load the server profile to see the item and the latest offer. You can download a copy of your progress on this device first.' : 'Загрузи профиль с сервера, чтобы увидеть актуальное объявление и вещи. Перед загрузкой можно скачать копию прогресса с этого устройства.'}</p>
    <div class="btns"><button class="btn wide" data-act="adminSyncBackup">${en ? 'Download device copy' : 'Скачать мою копию'}</button>
    <button class="btn primary wide" data-act="neighborhoodSaveUseServer">${en ? 'Load profile' : 'Загрузить профиль'}</button></div>`, { center: true, locked: true });
}

// A local tick or a tap can still be saved to the device while awaiting a response.
// Do not send that intermediate (pre-exchange) state back to the server.
const barter545OriginalWrite = serverWrite, barter545OriginalFinal = serverFinal, barter545OriginalSeen = serverSeen;
serverWrite = function (force) {
  if (!barter545Sending) return barter545OriginalWrite(force);
};
serverFinal = function () {
  if (!barter545Sending) return barter545OriginalFinal();
};
serverSeen = function (remote) {
  if (barter545Sending) return;
  if (remote && (remote.barterRev545 || 0) !== (S.barterRev545 || 0)) {
    if ((remote.rev || 0) >= serverBase) barter545Reconcile(remote);
    return;
  }
  return barter545OriginalSeen(remote);
};

const barter545OriginalAdopt = adoptOrAsk;
adoptOrAsk = function (remote) {
  if (barter545Busy || (remote.barterRev545 || 0) !== (S.barterRev545 || 0)) {
    barter545Reconcile(remote);
    return;
  }
  return barter545OriginalAdopt(remote);
};

const barter545BeforePrestige = prestigeProfile;
prestigeProfile = function () {
  const keep = barter545BeforePrestige();
  if (S.barterRev545) keep.barterRev545 = S.barterRev545;
  return keep;
};

async function barter545Request(action, body) {
  if (!onlineOn()) throw barter545Error('offline');
  let result;
  try { result = await apiPost('barter545/' + action, body); }
  catch (_) { throw barter545Error('sync'); }
  if (!result?.ok) throw barter545Error(result?.error || 'sync');
  return result;
}

async function barter545CheckProfile() {
  const remote = await serverGet().catch(() => null);
  if (!remote || SAVE_LOCK) return;
  if ((remote.barterRev545 || 0) !== (S.barterRev545 || 0)) barter545Reconcile(remote);
  else if (remote.rev > serverBase) serverSeen(remote);
}

async function barter545Read() {
  if (!LOADED || SAVE_LOCK || ALT_SAVE || barter545Sending) throw barter545Error('busy');
  const result = await barter545Request('state', {});
  if (result.marker !== (S.barterRev545 || 0)) {
    await barter545CheckProfile();
    throw barter545Error('stale');
  }
  return result;
}

function barter545Apply(receipt) {
  if (receipt.action === 'post') {
    if (!(S.inv?.[receipt.item] >= 1)) return false;
    addItem(receipt.item, -1);
  } else if (receipt.action === 'cancel') {
    addItem(receipt.item, 1);
  } else if (receipt.offer === 'meal') {
    S.food = Math.min(maxFood(), S.food + receipt.food);
  } else if (receipt.duplicate) {
    S.dups528 = (S.dups528 || 0) + 1;
  } else if (receipt.collectible) {
    if (S.coll?.[receipt.collectible]) return false;
    S.coll = S.coll || {};
    S.coll[receipt.collectible] = receipt.foundAt;
    track('collectible');
    if (receipt.setCompleted) {
      addCaps(receipt.caps);
      track('collectionDone');
    }
  } else return false;
  S.barterRev545 = receipt.marker;
  return true;
}

async function barter545Change(action, args) {
  if (!onlineOn()) throw barter545Error('offline');
  if (barter545Busy || SAVE_LOCK || ALT_SAVE) throw barter545Error('busy');
  if (!serverReady || !LOADED) throw barter545Error('sync');
  barter545Busy = true;
  let resync = false;
  try {
    // Flush all prior changes, including finds that were not uploaded yet.
    const profile = S;
    save();
    clearTimeout(srvTimer);
    for (let tries = 0; srvBusy && tries < 30; tries++) await wait(100);
    if (srvBusy || SAVE_LOCK || ALT_SAVE) throw barter545Error('sync');
    await serverWrite();
    if (!serverReady || srvBusy || SAVE_LOCK || ALT_SAVE || S !== profile || serverBase !== S.rev) throw barter545Error('sync');
    const base = serverBase, marker = S.barterRev545 || 0;
    barter545Sending = true;
    resync = true;
    const result = await barter545Request(action, { ...args, base, marker, device: DEVICE_ID });
    // Background progress on this device survives. A different device/revision requires an explicit re-read.
    const receipt = result.receipt;
    if (SAVE_LOCK || ALT_SAVE || S !== profile || !receipt || (S.barterRev545 || 0) !== marker ||
        serverBase !== base || result.rev !== base + 1 || result.marker !== marker + 1 ||
        receipt.marker !== result.marker || !barter545Apply(receipt)) throw barter545Error('stale');
    serverBase = result.rev;
    S.rev = Math.max(S.rev || 0, result.rev);
    REV_FLOOR = Math.max(REV_FLOOR, S.rev);
    resync = false;
    barter545Sending = false;
    save(true);
    updateHud();
    return result;
  } catch (err) {
    if (err.code && !['sync', 'stale', 'closed', 'occupied'].includes(err.code)) resync = false;
    throw err;
  } finally {
    barter545Sending = false;
    try { if (resync) await barter545CheckProfile(); }
    finally { barter545Busy = false; }
  }
}
function barter545Post(item) { return barter545Change('post', { item }); }
function barter545Cancel(postId) { return barter545Change('cancel', { postId }); }
function barter545Claim(postId, offer) { return barter545Change('claim', { postId, offer }); }
