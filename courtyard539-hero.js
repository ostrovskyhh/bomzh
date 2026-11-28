// A seated paper-cartoon puppet. Wardrobe colors, accessories and the bottle
// come from the same catalogs used by the shop and the player's save.
function courtyardEyes544(expression) {
  if (expression === 'asleep') {
    return '<path d="M56 61q6 7 14 2m11-2q7 6 14-1" fill="none" stroke="#493038" stroke-width="3.2"/>';
  }
  const down = expression === 'sad';
  const right = expression === 'happy' ? 3 : 0;
  return `<g class="eyes" stroke="#463137" stroke-width="1.9">
    <ellipse cx="64" cy="61" rx="9" ry="${down ? 8 : 10.3}" fill="#fff6db" transform="rotate(-8 64 61)"/>
    <ellipse cx="88" cy="59" rx="11" ry="${down ? 8.5 : 12.2}" fill="#fff6db" transform="rotate(9 88 59)"/>
    <g transform="translate(${right} ${down ? 2 : 0})" fill="#382e39" stroke="none">
      <ellipse cx="65" cy="62" rx="4.4" ry="6.2"/><ellipse cx="89" cy="59.5" rx="5" ry="7.5"/>
      <g fill="#fff9e4"><circle cx="66.4" cy="59.2" r="1.9"/><circle cx="90.8" cy="56.1" r="2.2"/></g>
    </g></g>`;
}

function courtyardMouth544(expression) {
  if (expression === 'happy') {
    return `<path d="M66 81q12 7 31-1-1 12-10 16-12 4-21-15z" fill="#542d36" stroke="#502f32" stroke-width="1.9"/>
      <path d="M70 83q10 4 20 1l-1 4q-1 2-4 1l-1-2-1 2q-7 2-13-6z" fill="#fff4d3" stroke="none"/>
      <path d="M78 93q5-5 13-3-6 9-13 3z" fill="#f18b78" stroke="none"/>`;
  }
  if (expression === 'asleep') {
    return '<ellipse cx="83" cy="86" rx="4.1" ry="5" fill="#59343b" stroke="none"/>';
  }
  return `<path d="${expression === 'sad' ? 'M72 91q5-8 15-4' : 'M68 82q11 10 26-1'}" fill="none" stroke="#643534" stroke-width="3"/>`;
}

function courtyardFace544(eq, expression, sick) {
  const skin = sick ? '#e3cd99' : '#ffc991';
  const cheek = sick ? '#c9af7c' : '#ed9879';
  const cap = eq.hat !== 'none' && Object.hasOwn(HATS, eq.hat) && HATS[eq.hat];
  const hasTuft = !cap || ['headband', 'flowers', 'crown'].includes(eq.hat);
  const brow = expression === 'sad' ? 'M54 51q5 2 13-3m16-3q7 7 15 6'
    : expression === 'asleep' ? 'M54 53q5-3 13 0m16-4q6-3 13-1'
    : 'M52 50q5-7 14-5m16-4q8-8 16-3';
  return `<g class="court543-face" data-expression="${expression}" transform="rotate(${expression === 'asleep' ? -9 : -4} 76 86)">
    <path d="M40 70q-9-5-10-18l-5 2q-2-11 6-20-5 0-8-3 7-3 12-10 9-10 24-10 17-11 36 1 14 0 25 15l-6 1q9 10 5 27l-7 14z" fill="#70412f"/>
    <path d="M38 63q-11-7-15 2-5 10 5 16 6 4 12-1m67-20q9-5 13 4 3 10-8 14-5 0-7-4" fill="${cheek}"/>
    <path d="M27 69q3-4 8 2m78-4 3-1" fill="none" stroke="#a75545" stroke-width="2"/>
    <path class="court543-skin" d="M39 47q5-21 32-23 23-4 34 11 7 9 8 24 2 12-3 23-7 16-24 21-17 6-32-3-19-10-19-27-2-16 4-26z" fill="${skin}"/>
    <path d="M41 48q5-13 19-19-12 11-14 24-2 12 4 19-5 1-8-3-4-9-1-21z" fill="#fff2c7" opacity=".69" stroke="none"/>
    <path d="M103 39q7 7 8 19 0 6-3 10l-5 5q6-19 0-34z" fill="${cheek}" stroke="none"/>
    <path d="M39 52q-4 19 4 28 3 6 12 8-5-10-2-13 4 4 8 4 9-2 17 0 11 0 17-3 8-2 12-11 4 3 4 8 0 12-7 19l3 1q-5 7-13 8l2 2q-6 5-15 4-10 6-20-1l-2 2q-10-1-15-11-8-1-10-9l4 1q-10-12-5-30z" fill="#995939" stroke="#593d32" stroke-width="2.4"/>
    <path d="M39 74q3 12 14 16l-2-6q6 8 13 11 8 5 18 4-8 7-15 2l2 3q-13-1-17-10l-1 2q-10-6-12-15z" fill="#b97042" stroke="none"/>
    <path d="M85 101q9-2 15-9l1-4 2 1 5-8q-2 11-11 17l-5 1-3 3z" fill="#784334" stroke="none"/>
    <path d="M41 82q4 5 7 5m-1 7 5 3m7 4 5 2m30-6 4-3" fill="none" stroke="#c7804d" stroke-width="2"/>
    <path d="M46 72q5-4 10 1m43-4q5-5 9-3" fill="none" stroke="${cheek}" stroke-width="6.2"/>
    <path d="m47 72 .1-.1m5 1 .1-.1m51-5 .1-.1m4-2 .1-.1" stroke="#a85a43" stroke-width="2.1"/>
    ${courtyardEyes544(expression)}
    <path d="${brow}" fill="none" stroke="#633c32" stroke-width="4.2"/>
    ${courtyardMouth544(expression)}
    <path d="M74 67q3-6 10-6 10-1 13 6 3 7-5 10-8 4-16 0-6-3-2-10z" fill="${sick ? '#c6aa79' : '#ef9675'}" stroke="#935347" stroke-width="2"/>
    <path d="M79 66q3-2 7-2" fill="none" stroke="${sick ? '#efdec0' : '#ffd6a3'}" stroke-width="3"/>
    ${hasTuft ? `<path d="M34 59q-6-11 0-23l-6 1q1-11 13-19-4-1-7-5 8 1 14-2 9-5 17-4-4-6-4-10 6 7 16 8 10 1 17 8 14-2 24 9l-7 1q8 6 7 17-8-8-18-7 3 4 2 9-5-6-13-6 3 7-4 15 1-9-6-12-4 11-18 14 6-6 5-12-7 3-13 9l1-6q-12 6-14 17z" fill="#774430"/>
      <path d="M35 38q2-13 15-19 6-3 14-4l-6 4q12-6 24-1 6 2 8 6-8-4-15-3-8 1-15 7l3-6q-15 5-25 17l3-7z" fill="#ac6b3e" stroke="none"/>
      <path d="M55 24q9-6 18-6m14 2 3 3m6 0q8-1 13 4" fill="none" stroke="#da975a" stroke-width="1.8"/>
      <path d="M42 44q3-8 10-14m25 2q4-5 1-7" fill="none" stroke="#593b31" stroke-width="1.9"/>` :
      '<path d="M37 44q0-9 8-11l3 7-7 20-3-5-3 3z" fill="#75442f"/>'}
    ${cap ? `<g class="court543-hat" transform="translate(74 40) scale(1.25 .84) translate(-80 -52)" stroke="#473336" stroke-width="1.4">${cap}</g>` : ''}
    ${sick ? '<path class="court543-ill" data-expression="'+expression+'" d="M108 48q2 6 4 8 3 5-1 7-5 2-6-3-1-4 3-12z" fill="#a5d9dd" stroke="#4d747c" stroke-width="1.5"/>' : ''}
  </g>`;
}

function courtyardPortrait539(eq, look = {}) {
  const bodyId = Object.hasOwn(BODIES, eq.body) ? eq.body : 'rvan';
  const body = BODIES[bodyId];
  const fabric = color => color === 'url(#stripes)' ? 'url(#court544-stripes)' : color;
  const starter = city() === 'zas' && bodyId === 'rvan';
  const jacket = starter ? '#b77945' : fabric(body.jacket);
  const shirt = starter ? '#f2d9ac' : fabric(body.shirt);
  const pants = starter ? '#5a7280' : body.pants;
  const skin = look.sick ? '#e3cd99' : '#ffc991';
  const expression = S.busy?.type === 'sleep' ? 'asleep' : look.mood === 'sad' ? 'sad' : look.mood === 'ok' ? 'calm' : 'happy';
  const shoes = eq.shoes !== 'none' && Object.hasOwn(SHOES, eq.shoes) && SHOES[eq.shoes];
  const feet = shoes ? `<g transform="translate(80 -1) scale(1.29 1) translate(-80)" stroke-width="1.7">${shoes}</g>` :
    `<g fill="${skin}">
      <path d="M46 208q8-3 17 0l-1 12q0 5-8 7-10 4-20 1-5-1-6-5 0-4 5-6 5-1 9-2z"/>
      <path d="M93 210q8-4 17-1l4 8 8 1q8 2 9 7-1 5-9 5l-20-1q-7 0-8-5z"/>
      <path d="M33 220q3-1 3 3m2-5q3-1 4 2m74 0q3-1 4 2m1-2q3 0 4 2" fill="none" stroke="#af704f" stroke-width="1.55"/>
    </g>`;
  return `<svg viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" class="valera-svg courtyard539-portrait" data-toon="544">
    <defs><pattern id="court544-stripes" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f4edda"/><rect y="4" width="8" height="4" fill="#386593"/></pattern></defs>
    <ellipse cx="79" cy="230" rx="66" ry="6" fill="#432f35" opacity=".20"/>
    <g stroke="#443138" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <g fill="#935e43"><path d="m37 176 12 2-5 38-8-1zm65 2 12-1 5 39-8 1z"/>
        <path d="M29 171q25-5 48-3l49-3 3 12q-49 10-98 7z" fill="#cb905c"/>
        <path d="m37 175 39-1m18-3 23-2" fill="none" stroke="#e9b575" stroke-width="2.1"/></g>
      <g class="court543-outfit" data-outfit="${bodyId}">
        <path d="M39 145q21-4 43 3 23-13 41 3 12 10 7 26-5 13-30 14l-18-5-12 6-24-9q-15-10-7-38z" fill="${pants}"/>
        <path d="M55 99q13-9 34-9 23 2 29 16 4 16-3 32l8 25q-11 10-30 10l-15-5q-15 8-36 1l4-22-7-25q-2-14 16-23z" fill="${jacket}"/>
        <path d="m55 125 9 14-4 15-14 4 4-16zm51 12 6-9-1 16 7 16-25 7 5-11z" fill="#482c3b" opacity=".17" stroke="none"/>
        <path d="M60 99q13 2 32 0l-7 62q-9 4-15 0z" fill="${shirt}" stroke-width="1.7"/>
        <path d="M66 106q9 5 22 1l-1 5q-11 2-19-3zm7 35 11-12-2 7z" fill="#55404b" opacity=".18" stroke="none"/>
        <path d="m60 99-6 13 8 2-4 6 15 28-10-44m29-4 7 10-8 5 3 5-11 25 3-39" fill="${jacket}" stroke-width="1.85"/>
        <path d="m56 114 4 1m31 1 4-2m11 18 3-2" fill="none" stroke="#fff4cf" stroke-opacity=".62" stroke-width="2"/>
        ${starter ? '<path d="m98 117 13 2-2 10-12-2z" fill="#b9564a" stroke-width="1.3"/><path d="m99 119 2 1m5 5 2 1" stroke="#efd298" stroke-width="1.7"/><path d="m48 142 13 1-1 7-10-1z" fill="#879675" stroke-width="1.6"/><circle cx="88" cy="143" r="2" fill="#ecd397" stroke-width="1.2"/>' : `<g stroke="none">${body.extra || ''}</g>`}
        <path d="M32 151q10-12 21-6 15 8 18 31 2 13-5 35-11 8-28 2l1-22q-15-22-7-40zm55 24q8-21 20-29 13-8 22 2 12 12 6 28-7 18-19 39-13 6-28-3l6-28z" fill="${pants}"/>
        <path d="M35 160q1 12 12 21l6 6-3 15-10 1 2-13q-8-15-7-30zm90-12q7 5 8 13 1 10-8 25l-12 19-10-2q10-5 14-16l-1 5q8-15 11-28 2-8-2-16z" fill="#252534" stroke="none" opacity=".25"/>
        <path d="M39 153q4-7 12-5l5 3q-10-2-17 5zm69 1q6-8 14-6l3 3q-10-1-17 7z" fill="#fff2c7" stroke="none" opacity=".23"/>
        <path d="M35 157q4-6 9-7m62 2q7-6 13-4" fill="none" stroke="#ffefd0" stroke-opacity=".6" stroke-width="2.8"/>
        <path d="m38 168 10 7-5-9m78-6-10 12 8-3m-22 26-2 10m-34-19-3 15" fill="none" stroke="#382e37" stroke-opacity=".6" stroke-width="1.9"/>
        ${starter ? '<path d="m107 173 13 4-6 14-13-5z" fill="#c49c65" stroke-width="1.6"/><path d="m107 177-2 2m11 1 2 1m-11 5 2 1" fill="none" stroke="#734d42" stroke-width="1.3"/>' : ''}
        <g class="court544-shoes" data-footwear="${shoes ? eq.shoes : 'none'}">${feet}</g>
        <path d="m39 202 26 2-2 11q-13 4-26-1zm53 2 24 3-4 10q-13 2-24-4z" fill="${pants}" stroke-width="1.9"/>
        <path d="m42 206 18 1m36 2 14 2" stroke="#f7eacc" stroke-opacity=".53" stroke-width="1.6"/>
        <path d="M48 103q-14 2-21 16l-7 19q-4 11 5 16 7 4 14-3l14-25q6-16-5-23z" fill="${jacket}"/>
        <path d="M50 111q4 10-5 24l-8 13-7-4 10-10-5 2q9-11 15-25z" fill="#52333c" opacity=".19" stroke="none"/>
        <path d="M28 123q4-10 11-13" fill="none" stroke="#fff2d4" stroke-opacity=".60" stroke-width="2.3"/>
        <path d="m25 139 11 6-4 8-11-5z" fill="${jacket}" stroke-width="1.8"/>
        <path d="M23 148q6-2 12 2l7 7q4 5 1 8-3 2-6-1-2 4-6 2-4 2-7-1-7-9-1-17z" fill="${skin}"/>
        <path d="m29 157 3 6m2-7 4 6" fill="none" stroke="#b97754" stroke-width="1.45"/>
        <g transform="${expression === 'asleep' ? 'translate(-3 4) rotate(15 108 106)' : ''}"><g class="bottle-arm">
          <path d="M108 101q9 0 13 13l4 9 7-13 13 7q-6 22-16 26-12 5-23-14-9-17-2-25z" fill="${jacket}"/>
          <path d="M105 118q6 14 15 20 9 5 18-9-8 24-22 8-7-8-11-19z" fill="#482c3b" opacity=".24" stroke="none"/>
          <path d="m117 125 6 6m-13-23 3 4" fill="none" stroke="#ffe7bf" stroke-opacity=".67" stroke-width="2.2"/>
          <path d="m128 116 5-10 13 7-4 10z" fill="${jacket}" stroke-width="1.9"/>
          <g transform="translate(138 108) rotate(11) translate(-139 -135)" stroke="none">${bottleHandSVG(look.bottle)}</g>
          <path d="M132 112q-2-3-1-7l3-7q1-3 4-2 2 0 2 3l-1 4q4-2 7-1 5 1 4 6l-2 5q-1 5-6 6-5 1-10-7z" fill="${skin}" stroke-width="2.1"/>
          <path d="m141 106 6 1m-7 3 6 1m-7 3 4 1" fill="none" stroke="#b97754" stroke-width="1.35"/>
        </g></g>
      </g>
      ${courtyardFace544(eq, expression, look.sick)}
    </g></svg>`;
}


const courtyardOldHero539 = valeraSVG;
const courtyardOldScene539 = renderScene;
let courtyardHomeRendering539 = false;
let courtyardSleeping543 = false;

valeraSVG = function (eq, look) {
  if (courtyardHomeRendering539 && eq === S.eq && !activeSkin75()) {
    return courtyardPortrait539(eq, look);
  }
  return courtyardOldHero539.apply(this, arguments);
};

renderScene = function () {
  courtyardHomeRendering539 = document.body.classList.contains('courtyard539');
  const asleep = courtyardHomeRendering539 && S.busy?.type === 'sleep';
  if (asleep !== courtyardSleeping543) {
    courtyardSleeping543 = asleep;
    renderedLook = '';
  }
  try {
    return courtyardOldScene539.apply(this, arguments);
  } finally {
    courtyardHomeRendering539 = false;
  }
};
