// The compact city panel keeps both earning rates visible between taps.
function home543UpdateRates() {
  const strip = $('home543Yield');
  if (!strip || currentScreen !== 'game' || !document.body.classList.contains('courtyard539')) return;
  const en = I18N.lang === 'en';
  if (strip.lang !== I18N.lang) {
    strip.lang = I18N.lang;
    $('home543TapLabel').textContent = en ? 'Bottles per tap' : 'Бутылок за тап';
    $('home543PityLabel').textContent = en ? 'Alms per hour' : 'Милостыня в час';
  }
  const rate = tapPower();
  const perTap = Number(rate.toFixed(1)).toLocaleString(en ? 'en-US' : 'ru-RU');
  // cityMoney supplies the city's exchange rate and Russian-format separators.
  const amount = cityMoney(pityPerSec() * 3600);
  const perHour = en ? amount.replace(',', '.').replace(/(\d)[ \u00a0\u202f](?=\d)/g, '$1,') : amount;
  if ($('home543Tap').textContent !== perTap) $('home543Tap').textContent = perTap;
  if ($('home543Pity').textContent !== perHour) $('home543Pity').textContent = perHour;
}

HOOKS.init.push(() => {
  const strip = document.createElement('dl');
  strip.id = 'home543Yield';
  strip.setAttribute('data-i18n-ignore', '');
  strip.innerHTML = '<div><dt id="home543TapLabel"></dt><dd><i class="ic" aria-hidden="true">' + ICONS.bottle + '</i><b id="home543Tap"></b></dd></div>' +
    '<div><dt id="home543PityLabel"></dt><dd><i class="ic" data-ic="coin" aria-hidden="true">' + ICONS.coin + '</i><b id="home543Pity"></b></dd></div>';
  $('scene').after(strip);
  home543UpdateRates();
});

HOOKS.hud.push(home543UpdateRates);
