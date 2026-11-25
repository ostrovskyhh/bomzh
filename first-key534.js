const FIRST_KEY_PRODUCT_534 = 'first_key534';
const FIRST_KEY_STARS_534 = 99;
let firstKeyInvoiceBusy534 = false;

function firstKeyOwned534() {
  return S.garageFirstKey534 === true;
}

function firstKeyText534(ru, en) {
  return typeof I18N !== 'undefined' && I18N.lang === 'en' ? en : ru;
}

PREM_GIVE[FIRST_KEY_PRODUCT_534] = receipt => {
  if (receipt?.rights?.garageFirstKey534 !== true) return '';
  S.garageFirstKey534 = true;
  return firstKeyText534('🔑 Первый ключ · оформление гаража открыто', '🔑 First Key · garage decor unlocked');
};

ACTIONS.firstKeyBuy534 = async () => {
  const story = S.neighborhood534;
  if (firstKeyInvoiceBusy534 || firstKeyOwned534() || !['workshop', 'market'].includes(story?.route)
      || !Number.isSafeInteger(story.firstJobAt) || story.firstJobAt <= 0) return;
  if (!onlineOn() || !tg?.openInvoice) {
    toast(firstKeyText534('Открой игру внутри Telegram, чтобы купить оформление.', 'Open the game in Telegram to buy the decor.'), 'bad');
    return;
  }
  firstKeyInvoiceBusy534 = true;
  try {
    // Sync the completed order before the invoice endpoint checks purchase eligibility.
    const deadline = performance.now() + 1500;
    while (srvBusy && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    await serverWrite();
    if (!SAVE_LOCK) await ACTIONS.prem(FIRST_KEY_PRODUCT_534);
  } finally {
    firstKeyInvoiceBusy534 = false;
  }
};

const firstKeyProfileBefore534 = prestigeProfile;
prestigeProfile = () => {
  const profile = firstKeyProfileBefore534();
  if (firstKeyOwned534()) profile.garageFirstKey534 = true;
  return profile;
};
