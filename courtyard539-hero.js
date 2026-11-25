// The courtyard uses a seated pose built from the same equipment as the standing figure.
function courtyardPortrait539(eq, look = {}) {
  const body = BODIES[eq.body] || BODIES.rvan;
  const shoes = SHOES[eq.shoes] || SHOES.none;
  const hat = eq.hat && eq.hat !== 'none' ? HATS[eq.hat] : null;
  const stripedJacket = body.jacket === 'url(#stripes)';
  const stripedShirt = body.shirt === 'url(#stripes)';
  const jacket = stripedJacket ? 'url(#courtyard539-stripes)' : body.jacket;
  const shirt = stripedShirt ? 'url(#courtyard539-stripes)' : body.shirt;
  const skin = look.sick ? '#d6d694' : '#ffc495';
  const skinShade = look.sick ? '#9b9e68' : '#c97957';
  const blush = look.sick ? '#b8b178' : '#e57861';
  const beard = eq.body === 'kostum' ? '#4b372d' : '#5b3927';
  const sad = look.mood === 'sad';
  const happy = !sad && look.mood !== 'ok';
  const worn = body === BODIES.rvan && city() === 'zas';
  const brow = sad ? 'M59 60q8-2 15-7m12 0q7 5 15 7' : 'M56 58q7-7 17-4m12-2q8-5 17 0';
  const mouth = happy
    ? '<path d="M61 79q17 9 40-2-3 18-20 20-13 1-20-18z" fill="#45242a"/><path d="M66 82q15 4 30-2l-4 6q-9 6-21 2z" fill="#fff0d3" stroke="none"/><path d="m75 85 1 4m8-5 1 4m7-6 1 3" fill="none" stroke="#d5a688" stroke-width=".7"/><path d="M76 93q8-5 15-2-6 7-15 2z" fill="#e78572" stroke="none"/>'
    : `<path d="${sad ? 'M68 89q12-9 25-3' : 'M68 85q12 5 24-1'}" fill="none" stroke-linecap="round"/>`;

  const border = '#322521';
  const torso = 'M54 95q20-12 44-4 17 7 22 28l-7 32 7 18q-12 15-39 18-35-7-39-17 2-12-1-40-4-24 13-35z';
  const knees = 'M30 166q2-16 13-21 13-6 22 6 9 14 8 34l-4 33q-12 9-29 3-3-12-5-28-9-17-5-27zm62 23q2-19 11-31 7-12 20-12 13 2 14 17 3 12-3 26l-10 30q-16 5-36-4z';
  return `
<svg viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" class="valera-svg courtyard539-portrait">
  <defs>
    ${stripedJacket || stripedShirt ? '<pattern id="courtyard539-stripes" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#F4F4F0"/><rect y="5" width="10" height="5" fill="#2F5DA8"/></pattern>' : ''}
    <linearGradient id="courtyard539-skin" x2=".30" y2="1"><stop offset=".18" stop-color="${skin}"/><stop offset="1" stop-color="${skinShade}"/></linearGradient>
    <linearGradient id="courtyard539-fabric" x2=".70" y2="1"><stop stop-color="#ffcd86" stop-opacity=".29"/><stop offset=".43" stop-color="#efd2b3" stop-opacity=".06"/><stop offset="1" stop-color="#210f28" stop-opacity=".40"/></linearGradient>
  </defs>
  <ellipse cx="78" cy="230" rx="63" ry="8.2" fill="#493c38" opacity=".28"/>
  <g stroke="${border}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M48 111q-24 4-31 22-4 13 6 28l19 8 10-14m58-40q20-3 32 13 8 15-3 31l-18 8-13-16" fill="${jacket}"/>
    <path d="M22 143q0-12 12-20m101 6q5 8 1 16" fill="none" stroke="#ffd29c" stroke-width="3.4" opacity=".55"/>
    <path d="${torso}" fill="${jacket}"/>
    <path d="${torso}" fill="url(#courtyard539-fabric)" stroke="none"/>
    <path d="M49 109q6-9 18-14m-20 28-1 25m57-49q11 6 10 25" fill="none" stroke="#ffd29c" stroke-width="3.1" opacity=".59"/>
    <path d="M110 130q-3 22 4 37-16 12-35 13-19-3-31-12 16 3 25 1 25-4 37-39z" fill="${border}" opacity=".27" stroke="none"/>
    <path d="M64 96q17-7 34 0l-11 62-8 10-16-55z" fill="${shirt}" stroke="none"/>
  </g>
  ${body.extra}
  ${worn ? `
  <path d="m63 96-11 15 12 7-4 8 20 35-7-48zm32-3 12 18-11 8 2 8-9 14 1-28z" fill="#a77146" stroke="#5f3d2d" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M66 105q7 8 15 12m10-5 7-6" fill="none" stroke="#e2ad77" stroke-width="1.7" stroke-linecap="round"/>
  <g fill="#d4a06a" stroke="#4d342c" stroke-width="1.35"><circle cx="101" cy="139" r="2.7"/><circle cx="98" cy="152" r="2.7"/><circle cx="101" cy="164" r="2.7"/></g>` : ''}
  <g class="bottle-arm" stroke="${border}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M110 109q15-8 27-16l11 10q-5 25-21 35-13 3-19-13z" fill="${jacket}"/>
    <path d="M118 113q11-2 18-10" fill="none" stroke="#ffcd92" opacity=".45"/>
    <g transform="translate(139 96) rotate(15) scale(1.14) translate(-139 -135)" stroke="none">${bottleHandSVG(look.bottle)}</g>
    <path d="M129 98q0-5 5-7 7-2 12 3l2 9-5 12q-5 2-10-2-5-3-5-8z" fill="url(#courtyard539-skin)"/>
    <path d="M137 96l7 3m-8 1 7 3m-8 1 5 3" fill="none" stroke="${skinShade}" stroke-width="1.35"/>
  </g>
  <g stroke="${border}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M62 163q12 3 19 13 14-13 25-12l2 28-17 10q-12 6-29-2l-14-11z" fill="${body.pants}"/>
    <path d="${knees}" fill="${body.pants}"/>
    <path d="${knees}" fill="url(#courtyard539-fabric)" stroke="none"/>
    <path d="M37 179q9 10 18 7m-8 19q5 7 12 7m49-41q9-14 18-14m-17 43q9-17 10-28" fill="none" stroke="#e9d6b6" stroke-width="2.9" opacity=".43"/>
    <path d="M61 160q14 18 8 41m29-5q5-10 7-21M56 213l-5-12m57 7 13-4" fill="none" stroke="#211d28" stroke-width="2.15" opacity=".52"/>
    ${worn ? '<path d="m40 188 14-5 5 16-14 4z" fill="#a38b6a" stroke="#40322e" stroke-width="1.4"/><path d="m43 188 10-3 4 13-11 3z" fill="none" stroke="#efbd85" stroke-width=".95" stroke-dasharray="2 2"/>' : ''}
    <g transform="translate(80 -13) scale(1.23 1.06) translate(-80)" stroke-width="1.55">${shoes}</g>
  </g>
  <g stroke="${border}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M25 137q18 0 26 13l13 16-11 10q-12-12-24-18-11-6-4-21z" fill="${jacket}"/>
    <path d="M30 144q8 1 16 8" fill="none" stroke="#ecc090" opacity=".74" stroke-width="2.2"/>
    <path d="M53 161q7-2 13 2l11 7q5 6 2 12-1 2-4 1l-5-6 2 10q-1 4-4 2l-6-10 1 8q-1 4-4 2l-5-10q-12-7-1-18z" fill="url(#courtyard539-skin)"/>
    <path d="m59 166 8 4m-11-1 4 4" fill="none" stroke="${skinShade}" stroke-width="1.5"/>
    <path d="M65 82h22l6 15q-9 18-24 6z" fill="${skinShade}"/>
  </g>
  <g transform="translate(-1 8) rotate(-8 80 64)" stroke="${border}" stroke-width="2.55" stroke-linejoin="round">
    ${hat ? '' : '<path d="M44 65q-9-18 0-34l-6-1q5-9 13-10l-3-7q13-7 27 0 13-13 24-6l-1 5q14 0 21 11l-7 1q9 9 8 26l-8 13z" fill="#493124"/>'}
    <ellipse cx="46" cy="68" rx="9.4" ry="11" fill="${skin}"/>
    <ellipse cx="113" cy="66" rx="9" ry="10" fill="${skin}"/>
    <path d="M43 65q4-3 7 2m62-2q3-3 5 0" fill="none" stroke="${skinShade}" stroke-width="2" stroke-linecap="round"/>
    <path d="M47 52q4-20 19-23 19-7 34 3 14 9 14 28 0 20-13 31-15 14-32 9-19-7-23-27-3-14 1-21z" fill="url(#courtyard539-skin)"/>
    <path d="M50 68q8 9 17 7 9-6 14-4 10-1 17 3 9-1 14-12l-2 16q-5 12-11 17l-5 2-3 5-5-1-6 4-6-4-5 1-3-5q-17-8-16-29z" fill="${beard}"/>
    <path d="M54 78q5 9 12 15m38-16-6 12m-30 9 3 3M59 78l4 4m35-5-2 4m-15 15 1 4" fill="none" stroke="#dc9a64" stroke-width="1.8" stroke-linecap="round" opacity=".68"/>
    ${mouth}
    <g class="eyes" stroke-linecap="round">
      ${happy ? '<path d="M58 63q7-7 14-3m15-1q6-7 13-2" fill="none" stroke="#3a2826" stroke-width="2.9"/>'
        : '<ellipse cx="66" cy="62" rx="6.8" ry="7.3" fill="#fff7e8" stroke="none"/><ellipse cx="93" cy="60" rx="6.8" ry="7.3" fill="#fff7e8" stroke="none"/><ellipse cx="68" cy="63" rx="3.6" ry="4.7" fill="#3a2826" stroke="none"/><ellipse cx="95" cy="61" rx="3.6" ry="4.7" fill="#3a2826" stroke="none"/>'}
    </g>
    <path d="${brow}" fill="none" stroke="#432e26" stroke-width="2.9" stroke-linecap="round"/>
    <ellipse cx="58" cy="69" rx="5.4" ry="2.7" fill="${blush}" opacity=".68" stroke="none"/>
    <ellipse cx="102" cy="67" rx="4.8" ry="2.5" fill="${blush}" opacity=".68" stroke="none"/>
    <path d="M75 68q3-8 10-8 7 0 9 6 1 7-7 9-9 2-12-3z" fill="${blush}" stroke="#8a4b3d" stroke-width="1.65"/>
    <path d="M80 66q3-3 7-2" fill="none" stroke="${skin}" stroke-width="2.5" stroke-linecap="round"/>
    ${hat ? `<g transform="translate(0 -8)" stroke="none">${hat}</g>` : `
    <path d="M46 53q-5-7-2-16l-7 3q5-13 15-17l-6-4q9-6 20-5l1-6q10-3 16 7 8-7 15-4l-1 6q15-1 24 13l-8-1q7 7 4 19l-6-3q-4-11-15-14 0 7-8 13l1-10q-9 6-16 7l3-8q-13 7-19 16l1-8q-7 4-12 12z" fill="#533629"/>
    <path d="M51 35q7-12 20-12m16-3q16-2 23 10" fill="none" stroke="#c98c5a" stroke-width="2.7" stroke-linecap="round"/>
    <path d="M48 44q9-9 20-11m1-11 6 3m21 0q10 3 14 10m-5-1 5 7" fill="none" stroke="#bc8050" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`}
    ${look.sick ? '<path d="M107 48q4 7 0 10-4-3 0-10z" fill="#8fd0f5" stroke="#426d8e" stroke-width="1.15"/>' : ''}
  </g>
</svg>`;
}

const courtyardOldHero539 = valeraSVG;
const courtyardOldScene539 = renderScene;
let courtyardHomeRendering539 = false;

valeraSVG = function (eq, look) {
  if (courtyardHomeRendering539 && eq === S.eq && !activeSkin75()) {
    return courtyardPortrait539(eq, look);
  }
  return courtyardOldHero539.apply(this, arguments);
};

renderScene = function () {
  courtyardHomeRendering539 = document.body.classList.contains('courtyard539');
  try {
    return courtyardOldScene539.apply(this, arguments);
  } finally {
    courtyardHomeRendering539 = false;
  }
};
