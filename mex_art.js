// Графика Мексики (4.0): 7 сцен жилья и новые животные. Как msk_art.js — зависит только от art.js,
// город спрашивает city() в момент рисования.

Object.assign(PET_ART, {
  chihuahua: `<svg viewBox="0 0 80 70"><path class="wag" d="M58 40q10-10 6-20" stroke="#D9A066" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="44" cy="46" rx="16" ry="10" fill="#E2B074"/><path d="M34 54v10M40 55v9M50 55v9M56 54v10" stroke="#C99258" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="26" cy="34" r="12" fill="#E2B074"/><path d="M16 28L8 8l14 12zM34 26l8-18-4 20z" fill="#E2B074"/><path d="M17 26L12 13l8 9zM33 24l5-11-2 12z" fill="#F4C9C9"/>
    <circle cx="22" cy="33" r="3.2" fill="#1C1C22"/><circle cx="31" cy="33" r="3.2" fill="#1C1C22"/><circle cx="23" cy="32" r="1" fill="#fff"/><circle cx="32" cy="32" r="1" fill="#fff"/>
    <ellipse cx="26" cy="40" rx="3" ry="2" fill="#1C1C22"/><path d="M14 22q12-14 26 0l-3 3q-10-8-20 0z" fill="#C0392B"/><path d="M12 22h30" stroke="#F2C744" stroke-width="2"/></svg>`,
  axolotl: `<svg viewBox="0 0 80 70"><path class="wag" d="M60 46q14 2 16-8q-8 4-16 2z" fill="#F7A8C4"/><ellipse cx="44" cy="46" rx="18" ry="10" fill="#F7B6CE"/>
    <ellipse cx="22" cy="40" rx="13" ry="11" fill="#F7B6CE"/><path d="M10 32l-8-6M10 38l-9 0M11 44l-8 5M34 32l8-6M34 38l9 0M33 44l8 5" stroke="#E84393" stroke-width="3" stroke-linecap="round"/>
    <circle cx="17" cy="38" r="2.4" fill="#1C1C22"/><circle cx="27" cy="38" r="2.4" fill="#1C1C22"/><path d="M18 45q4 3 8 0" stroke="#B03A6A" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M32 55l-2 7M44 56v7M54 55l2 7" stroke="#F7A8C4" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  iguana: `<svg viewBox="0 0 80 70"><path class="wag" d="M60 50q16 0 18 12q-10-6-20-6z" fill="#6DBE45"/><ellipse cx="42" cy="48" rx="20" ry="9" fill="#7CCB52"/>
    <path d="M28 40l4-7 4 7 4-7 4 7 4-7 4 7" stroke="#3E8E2A" stroke-width="2.5" fill="none" stroke-linejoin="round"/><ellipse cx="18" cy="44" rx="12" ry="8" fill="#7CCB52"/>
    <circle cx="14" cy="41" r="2.4" fill="#1C1C22"/><path d="M8 48q6 4 12 1" stroke="#3E8E2A" stroke-width="2" fill="none"/><ellipse cx="22" cy="51" rx="4" ry="3" fill="#F2C744"/>
    <path d="M28 55l-4 8M36 56l-2 8M50 56l2 8M58 55l4 8" stroke="#5DAA3A" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  hummingbird: `<svg viewBox="0 0 80 70"><path class="wag" d="M44 30L66 6l-4 22z" fill="#2ECC71" opacity=".85"/><path d="M40 32L26 8l-2 22z" fill="#27AE60" opacity=".8"/>
    <ellipse cx="40" cy="40" rx="14" ry="10" fill="#16A085"/><ellipse cx="38" cy="44" rx="9" ry="6" fill="#E84393"/><circle cx="52" cy="34" r="8" fill="#1ABC9C"/>
    <circle cx="54" cy="32" r="2" fill="#1C1C22"/><path d="M59 35l20 3-20 1z" fill="#3A3A3A"/><path d="M26 44l-14 8 16-2z" fill="#16A085"/>
    <path d="M36 50v6M42 50v6" stroke="#333" stroke-width="2"/></svg>`,
});

// Общие детали мексиканских сцен
const MEX_SKY = (top, bot) => { const id = `mx${top.slice(1)}${bot.slice(1)}`; return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs>
  <rect width="360" height="420" fill="url(#${id})"/>`; };
const MEX_FLAGS = (y = 18) => `<path d="M0 ${y}q90 22 180 0t180 0" stroke="#5B3A1E" stroke-width="1.5" fill="none"/>`
  + ['#E84393', '#F2C744', '#2ECC71', '#3498DB', '#E67E22', '#9B59B6', '#E74C3C', '#1ABC9C', '#F2C744', '#E84393'].map((c, i) => {
    const x = 10 + i * 35, yy = y + 4 + Math.sin((i / 9) * Math.PI) * 10;
    return `<path d="M${x} ${yy}h22l-2 16-5-5-4 6-4-6-5 5z" fill="${c}" opacity=".92"/>`;
  }).join('');
const MEX_SUN = (x, y, r = 34, c = '#FFD27A') => `<circle cx="${x}" cy="${y}" r="${r + 14}" fill="${c}" opacity=".25"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const MEX_CACTUS = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#3E9B4F"><rect x="-7" y="-70" width="14" height="70" rx="7"/><rect x="-26" y="-48" width="10" height="26" rx="5"/>
  <rect x="-26" y="-28" width="22" height="9" rx="4.5"/><rect x="16" y="-56" width="10" height="30" rx="5"/><rect x="4" y="-34" width="22" height="9" rx="4.5"/><circle cx="0" cy="-72" r="4" fill="#E84393"/></g>`;
const MEX_PALM = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q-6-60 6-110" stroke="#8B5A2B" stroke-width="9" fill="none" stroke-linecap="round"/>
  <g fill="#2E8B57"><path d="M6-110q-40-12-62 10q30-4 62-10z"/><path d="M6-110q40-14 64 8q-32-4-64-8z"/><path d="M6-110q-22-34-54-36q28 14 54 36z"/><path d="M6-110q20-36 52-34q-30 12-52 34z"/></g>
  <circle cx="2" cy="-104" r="5" fill="#6B4423"/><circle cx="11" cy="-103" r="5" fill="#6B4423"/></g>`;
const MEX_AGAVE = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#5FA59A"><path d="M0 0l-30-34 26 26zM0 0l30-34-26 26zM0 0l-8-48 8 44zM0 0l8-48-8 44zM0 0l-42-12 38 10zM0 0l42-12-38 10z"/></g>`;
const MEX_PYRAMID = (x, y, s = 1, c = '#B07A45') => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-60 0h120l-12-12h-96zM-48-12h96l-12-12h-72zM-36-24h72l-12-12h-48zM-24-36h48l-10-12h-28z"/>
  <rect x="-8" y="-60" width="16" height="12" fill="#8E5E31"/><path d="M-4 0v-48h8v48z" fill="#8E5E31" opacity=".5"/></g>`;

const MEX_SCENES = [
  // 0. Гамак под пальмой у порта
  () => `${MEX_SKY('#7FC8F8', '#FFE1A8')}${MEX_SUN(290, 70)}<rect y="230" width="360" height="70" fill="#2F86C9"/><path d="M0 238q30-6 60 0t60 0t60 0t60 0t60 0t60 0" stroke="#BFE6FF" stroke-width="3" fill="none"/>
    <path d="M200 228h120l-14 20h-94z" fill="#F4F0E6"/><rect x="236" y="200" width="44" height="28" fill="#E74C3C"/><rect x="250" y="186" width="8" height="16" fill="#555"/><text x="214" y="246" font-size="12" fill="#2F86C9" font-weight="bold">LA PALOMA</text>
    <rect y="300" width="360" height="120" fill="#E8C98E"/>${MEX_PALM(60, 330, 1.1)}${MEX_PALM(320, 340, 0.9)}<path d="M64 238q60 50 250 40" stroke="#C0392B" stroke-width="3" fill="none"/>
    <path d="M70 248q100 40 236 30l-4 12q-120 10-230-28z" fill="#E67E22" opacity=".85"/><text x="150" y="372" font-size="20">🦀</text><text x="250" y="395" font-size="18">🐚</text>`,
  // 1. Шалаш из листьев агавы в пустыне
  () => `${MEX_SKY('#F7B267', '#FCE38A')}${MEX_SUN(80, 90, 40, '#FFF2B3')}<path d="M0 260q90-40 180-10t180-20v170H0z" fill="#E0A458"/><rect y="300" width="360" height="120" fill="#D9934B"/>
    ${MEX_CACTUS(40, 330, 1)}${MEX_CACTUS(325, 320, 0.8)}${MEX_AGAVE(95, 330, 0.8)}<path d="M140 320l60-90 60 90z" fill="#7A8F3A"/><path d="M160 320l40-60 40 60z" fill="#5F7230"/><rect x="186" y="286" width="28" height="34" fill="#3E2A16"/>
    <path d="M150 300l50-74 50 74" stroke="#4E6127" stroke-width="3" fill="none"/><text x="260" y="390" font-size="22">🦂</text><text x="60" y="400" font-size="18">💀</text>`,
  // 2. Койка в «Casa de Amigos»
  () => `<rect width="360" height="420" fill="#2EB8A0"/><rect width="360" height="300" fill="#F4D35E"/><path d="M0 300h360v120H0z" fill="#B5651D"/>${MEX_FLAGS(14)}
    <rect x="20" y="120" width="120" height="70" fill="#8E5E31"/><rect x="24" y="124" width="112" height="26" fill="#E84393"/><rect x="24" y="160" width="112" height="26" fill="#3498DB"/>
    <rect x="20" y="190" width="120" height="8" fill="#5B3A1E"/><rect x="18" y="118" width="6" height="182" fill="#5B3A1E"/><rect x="136" y="118" width="6" height="182" fill="#5B3A1E"/>
    <rect x="220" y="90" width="100" height="90" rx="6" fill="#7FC8F8"/><path d="M270 90v90M220 135h100" stroke="#F4F0E6" stroke-width="5"/>${MEX_CACTUS(296, 176, 0.45)}
    <text x="230" y="250" font-size="40">🎸</text><text x="40" y="270" font-size="22">🌮</text><text x="18" y="96" font-size="15" fill="#5B3A1E" font-weight="bold">CASA DE AMIGOS</text>`,
  // 3. Комната в розовом доме
  () => `<rect width="360" height="420" fill="#F7A8C4"/><rect y="300" width="360" height="120" fill="#C0392B"/><path d="M0 300h360" stroke="#8E2A20" stroke-width="4"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * 46}" y="300" width="44" height="44" fill="${i % 2 ? '#E67E22' : '#F2C744'}" opacity=".35"/>`).join('')}
    <rect x="200" y="70" width="120" height="120" rx="60" fill="#7FC8F8"/><path d="M260 70v120M200 130h120" stroke="#fff" stroke-width="5"/>${MEX_CACTUS(240, 186, 0.5)}
    <circle cx="90" cy="70" r="20" fill="#ECF0F1"/><path d="M90 50v40M70 70h40" stroke="#95A5A6" stroke-width="5"/><rect x="88" y="30" width="4" height="20" fill="#7F8C8D"/>
    <rect x="30" y="210" width="130" height="60" rx="8" fill="#8E44AD"/><rect x="30" y="200" width="40" height="20" rx="6" fill="#ECF0F1"/><text x="230" y="290" font-size="30">🪅</text>`,
  // 4. Касита с патио
  () => `${MEX_SKY('#6EC3F4', '#FFF1C1')}${MEX_SUN(300, 60, 26)}<rect x="0" y="120" width="360" height="180" fill="#F5E6CA"/><rect x="0" y="110" width="360" height="16" fill="#C0392B"/>
    ${[40, 140, 240].map((x) => `<path d="M${x} 300v-110q40-50 80 0v110z" fill="#2C3E50" opacity=".25"/>`).join('')}${MEX_FLAGS(132)}
    <rect y="300" width="360" height="120" fill="#D35400"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 40} 300l20 20-20 20-20-20z" fill="#F2C744" opacity=".35"/>`).join('')}
    <circle cx="60" cy="240" r="40" fill="#2E8B57"/><circle cx="48" cy="230" r="6" fill="#F1C40F"/><circle cx="72" cy="246" r="6" fill="#F1C40F"/><rect x="56" y="270" width="8" height="40" fill="#8B5A2B"/>
    <path d="M10 160q170 40 340 0" stroke="#5B3A1E" stroke-width="1.5" fill="none"/>${[30, 80, 130, 180, 230, 280, 330].map((x, i) => `<circle cx="${x}" cy="${168 + Math.sin(i) * 6}" r="5" fill="#FFE08A"/>`).join('')}`,
  // 5. Вилла на побережье Канкуна
  () => `${MEX_SKY('#4FC3F7', '#E1F5FE')}${MEX_SUN(60, 70, 30, '#FFF59D')}<rect y="200" width="360" height="40" fill="#26C6DA"/><rect y="236" width="360" height="64" fill="#FFF3E0"/>
    <rect x="150" y="90" width="190" height="150" fill="#FAFAFA"/><rect x="150" y="80" width="190" height="14" fill="#E0E0E0"/>${[170, 230, 290].map((x) => `<rect x="${x}" y="110" width="40" height="50" rx="20" fill="#81D4FA"/>`).join('')}
    <rect x="200" y="180" width="70" height="60" fill="#80CBC4"/>${MEX_PALM(110, 260, 1)}${MEX_PALM(20, 260, 0.8)}<rect y="300" width="360" height="120" fill="#F5F5F5"/>
    <rect x="30" y="320" width="300" height="60" rx="14" fill="#29B6F6"/><path d="M50 340q20-8 40 0t40 0t40 0t40 0t40 0" stroke="#E1F5FE" stroke-width="3" fill="none"/><text x="60" y="410" font-size="22">🍹</text>`,
  // 6. Гасиенда с текилой и пирамидой на закате
  () => `${MEX_SKY('#FF7E5F', '#FEB47B')}${MEX_SUN(180, 150, 46, '#FFE29A')}${MEX_PYRAMID(290, 220, 1.1, '#9C6B3C')}
    <path d="M0 230q90-20 180 0t180 0v80H0z" fill="#C97B3E"/>${[30, 70, 110, 330].map((x) => MEX_AGAVE(x, 250, 0.6)).join('')}
    <rect x="20" y="150" width="240" height="150" fill="#F3E0C0"/><rect x="10" y="140" width="260" height="16" fill="#A0522D"/>${[34, 94, 154, 214].map((x) => `<path d="M${x} 300v-90q22-30 44 0v90z" fill="#7B4A2A" opacity=".55"/>`).join('')}
    ${MEX_FLAGS(166)}<rect y="300" width="360" height="120" fill="#8D4F2A"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 42}" y="300" width="40" height="40" fill="${i % 2 ? '#B5651D' : '#A0522D'}"/>`).join('')}
    <text x="290" y="290" font-size="28">🥃</text><text x="40" y="400" font-size="24">🎺</text>`,
];

sceneSVG = (function (orig) {
  return function (level) {
    if (typeof city !== 'function' || city() !== 'mex') return orig(level);
    const draw = MEX_SCENES[Math.min(level, MEX_SCENES.length - 1)];
    return `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${draw()}</svg>`;
  };
})(sceneSVG);
