// Вся графика игры: векторные SVG, собираются кодом.
// Персонаж собирается из слоёв (обувь, одежда, шапка), локации — отдельные сцены.

const SKIN = '#F1C7A1';
const SKIN_DARK = '#E0A784';

const DEFS = `
<defs>
  <pattern id="stripes" width="10" height="10" patternUnits="userSpaceOnUse">
    <rect width="10" height="10" fill="#F4F4F0"/><rect y="5" width="10" height="5" fill="#2F5DA8"/>
  </pattern>
  <pattern id="bricks" width="40" height="20" patternUnits="userSpaceOnUse">
    <rect width="40" height="20" fill="#8C5A48"/>
    <path d="M0 0H40M0 10H40M20 0V10M0 10V20M40 10V20" stroke="#6E4335" stroke-width="2"/>
  </pattern>
  <pattern id="wallpaper" width="24" height="24" patternUnits="userSpaceOnUse">
    <rect width="24" height="24" fill="#B9C49A"/><rect width="8" height="24" fill="#AAB78B"/>
    <circle cx="16" cy="12" r="2" fill="#94A275"/>
  </pattern>
  <pattern id="wood" width="60" height="16" patternUnits="userSpaceOnUse">
    <rect width="60" height="16" fill="#B58A5E"/><path d="M0 16H60M30 0V16" stroke="#9A7149" stroke-width="2"/>
  </pattern>
</defs>`;

// ---------- Персонаж ----------

const SHOES = {
  none: `
    <ellipse cx="64" cy="226" rx="13" ry="6" fill="${SKIN}"/><ellipse cx="96" cy="226" rx="13" ry="6" fill="${SKIN}"/>
    <path d="M54 226h4M100 226h4" stroke="${SKIN_DARK}" stroke-width="2"/>`,
  tapki: `
    <ellipse cx="62" cy="226" rx="17" ry="7" fill="#3E7CC9"/><ellipse cx="98" cy="226" rx="17" ry="7" fill="#3E7CC9"/>
    <rect x="54" y="217" width="16" height="6" rx="3" fill="#2C5E9E"/><rect x="90" y="217" width="16" height="6" rx="3" fill="#2C5E9E"/>`,
  kedy: `
    <rect x="44" y="214" width="34" height="16" rx="8" fill="#F5F5F5"/><rect x="82" y="214" width="34" height="16" rx="8" fill="#F5F5F5"/>
    <rect x="44" y="226" width="34" height="5" rx="2.5" fill="#D9D9D9"/><rect x="82" y="226" width="34" height="5" rx="2.5" fill="#D9D9D9"/>
    <path d="M52 220l10-4M90 220l10-4" stroke="#E04646" stroke-width="3" stroke-linecap="round"/>`,
  base: `
    <path d="M50 206h26v20a5 5 0 0 1-5 5H44a6 6 0 0 1 0-12h6z" fill="#7A5230"/>
    <path d="M84 206h26v13h6a6 6 0 0 1 0 12H89a5 5 0 0 1-5-5z" fill="#7A5230"/>
    <path d="M42 228h34M84 228h34" stroke="#4E331C" stroke-width="3"/>
    <path d="M56 212h12M92 212h12" stroke="#C9A77A" stroke-width="1.5" stroke-dasharray="2 2"/>`,
  boots: `
    <path d="M50 200h26v26a5 5 0 0 1-5 5H42a6 6 0 0 1 0-12h8z" fill="#1E1E22"/>
    <path d="M84 200h26v19h8a6 6 0 0 1 0 12H89a5 5 0 0 1-5-5z" fill="#1E1E22"/>
    <path d="M44 222h10M106 222h10" stroke="#5A5A66" stroke-width="2" stroke-linecap="round"/>`,
};

const BODIES = {
  rvan: { jacket: '#7B5B3A', pants: '#4A4F5C', shirt: '#D9D2C3', extra: `
    <rect x="52" y="140" width="14" height="12" fill="#5E7A4A" transform="rotate(-8 59 146)"/>
    <path d="M53 141l12 1M53 151l12-1" stroke="#3F5532" stroke-width="1.5" stroke-dasharray="2 2"/>
    <rect x="96" y="112" width="11" height="10" fill="#8E3B3B" transform="rotate(10 101 117)"/>
    <path d="M44 166l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6" fill="none" stroke="#5B4029" stroke-width="2"/>` },
  telnyashka: { jacket: 'url(#stripes)', pants: '#2C3442', shirt: 'url(#stripes)', extra: '' },
  base: { jacket: '#8DB6D9', pants: '#5A5F6B', shirt: '#8DB6D9', extra: `
    <path d="M66 94l14 12 14-12" fill="none" stroke="#6E98BE" stroke-width="5" stroke-linejoin="round"/>
    <path d="M80 108v58" stroke="#6E98BE" stroke-width="2"/>
    <circle cx="80" cy="120" r="2" fill="#F4F4F0"/><circle cx="80" cy="136" r="2" fill="#F4F4F0"/><circle cx="80" cy="152" r="2" fill="#F4F4F0"/>
    <rect x="44" y="160" width="72" height="8" fill="#3E2E22"/><rect x="74" y="159" width="12" height="10" rx="2" fill="#C9A23A"/>` },
  pukhovik: { jacket: '#D2483F', pants: '#2F3A4A', shirt: '#2B2B2B', extra: `
    <path d="M46 116h68M46 136h68M46 156h68" stroke="#A8332C" stroke-width="2.5"/>
    <rect x="52" y="90" width="56" height="14" rx="7" fill="#E9E1D3"/>` },
  malinovy: { jacket: '#B0154A', pants: '#1E1E24', shirt: '#151515', extra: `
    <path d="M66 100q14 30 28 0" fill="none" stroke="#F2C744" stroke-width="3.5"/>
    <circle cx="80" cy="114" r="5" fill="#F2C744"/>` },
  kostum: { jacket: '#23252B', pants: '#23252B', shirt: '#F7F7F7', extra: `
    <path d="M77 100h6l3 6-6 24-6-24z" fill="#C8202F"/>
    <rect x="98" y="116" width="10" height="4" rx="1" fill="#F7F7F7"/>` },
};

const HATS = {
  none: `<path d="M52 52q-2-20 16-24q4-8 14-4q14-4 20 8q12 6 6 22q-8-12-28-12t-28 10z" fill="#5A4A3A"/>`,
  shapka: `
    <path d="M50 60Q50 26 80 26Q110 26 110 60Z" fill="#3B6FB6"/>
    <rect x="47" y="52" width="66" height="12" rx="6" fill="#2A548E"/>
    <path d="M58 52v12M68 52v12M78 52v12M88 52v12M98 52v12" stroke="#244878" stroke-width="2"/>
    <circle cx="80" cy="24" r="8" fill="#F4F4F0"/>`,
  ushanka: `
    <rect x="42" y="54" width="14" height="28" rx="7" fill="#A47B52"/><rect x="104" y="54" width="14" height="28" rx="7" fill="#A47B52"/>
    <path d="M48 58Q48 26 80 26Q112 26 112 58Z" fill="#6B4A2E"/>
    <rect x="44" y="48" width="72" height="13" rx="6.5" fill="#A47B52"/>
    <circle cx="80" cy="40" r="5" fill="#E2B33B"/>`,
  kepka: `
    <path d="M50 54Q50 30 82 30Q110 32 110 52Z" fill="#6E6E6E"/>
    <path d="M58 50Q92 42 124 52Q102 60 58 57Z" fill="#4E4E4E"/>
    <path d="M60 44q20-8 44-4" fill="none" stroke="#5A5A5A" stroke-width="2"/>`,
  cilinder: `
    <rect x="58" y="4" width="44" height="44" rx="3" fill="#1B1B1F"/>
    <rect x="58" y="34" width="44" height="8" fill="#8E1B2E"/>
    <ellipse cx="80" cy="48" rx="34" ry="6" fill="#1B1B1F"/>`,
};

// Сезонные шапки (выдаются только в праздничных ивентах)
Object.assign(HATS, {
  pumpkin: `
    <path d="M46 52q-4-26 34-28q38 2 34 28q-6 10-34 10t-34-10z" fill="#F08A24"/>
    <path d="M62 28q-6 12 0 30M98 28q6 12 0 30M80 24v34" stroke="#C96A12" stroke-width="2.5" fill="none"/>
    <rect x="76" y="12" width="8" height="14" rx="3" fill="#5E7A2E"/>
    <path d="M62 40l5-6 5 6zM88 40l5-6 5 6z" fill="#3A1F05"/>`,
  santa: `
    <path d="M50 54Q52 24 82 22Q104 24 118 44L110 50Q100 34 84 34Q66 36 64 54Z" fill="#D0302F"/>
    <rect x="46" y="48" width="68" height="13" rx="6.5" fill="#F4F4F0"/>
    <circle cx="117" cy="47" r="8" fill="#F4F4F0"/>`,
  flowers: `
    <path d="M52 50q28-14 56 0" stroke="#5E9A45" stroke-width="5" fill="none"/>
    <circle cx="56" cy="48" r="6" fill="#F07F9A"/><circle cx="68" cy="42" r="6" fill="#FFD25A"/><circle cx="80" cy="40" r="6" fill="#F07F9A"/>
    <circle cx="92" cy="42" r="6" fill="#B06CFF"/><circle cx="104" cy="48" r="6" fill="#FFD25A"/>
    <circle cx="68" cy="42" r="2" fill="#fff"/><circle cx="92" cy="42" r="2" fill="#fff"/>`,
  pilotka: `
    <path d="M50 50L60 34H104L112 50Z" fill="#5A6B3A"/>
    <path d="M60 34L82 46L104 34" stroke="#45542C" stroke-width="2" fill="none"/>
    <path d="M70 40l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#D0302F"/>`,
  graduate: `
    <rect x="58" y="34" width="44" height="16" rx="3" fill="#1E1E24"/>
    <path d="M40 34L80 20L120 34L80 46Z" fill="#26262E"/>
    <path d="M80 33L108 38V54" stroke="#F2C744" stroke-width="2.5" fill="none"/><circle cx="108" cy="56" r="4" fill="#F2C744"/>`,
  jester: `
    <path d="M52 52Q48 30 30 22Q50 22 66 36L80 18L94 36Q110 22 130 22Q112 30 108 52Z" fill="#B0154A"/>
    <path d="M80 18L94 36Q110 22 130 22Q112 30 108 52H80Z" fill="#2F5DA8"/>
    <circle cx="30" cy="22" r="5" fill="#F2C744"/><circle cx="80" cy="16" r="5" fill="#F2C744"/><circle cx="130" cy="22" r="5" fill="#F2C744"/>
    <rect x="48" y="48" width="64" height="9" rx="4" fill="#F2C744"/>`,
});

// Шапки за драки (выдаются за выход в новую лигу)
Object.assign(HATS, {
  bandana: `
    <path d="M48 56Q48 28 80 28Q112 28 112 56Z" fill="#C62828"/>
    <circle cx="64" cy="42" r="2" fill="#fff"/><circle cx="78" cy="36" r="2" fill="#fff"/><circle cx="94" cy="40" r="2" fill="#fff"/><circle cx="72" cy="50" r="2" fill="#fff"/><circle cx="90" cy="50" r="2" fill="#fff"/>
    <path d="M108 50l18 2-6 8zM108 52l14 12-8 4z" fill="#A61E1E"/>`,
  boxhelm: `
    <path d="M46 68Q44 24 80 24Q116 24 114 68H104Q104 42 80 42Q56 42 56 68Z" fill="#C62828"/>
    <rect x="42" y="54" width="16" height="26" rx="8" fill="#A61E1E"/><rect x="102" y="54" width="16" height="26" rx="8" fill="#A61E1E"/>
    <rect x="58" y="40" width="44" height="10" rx="5" fill="#A61E1E"/>
    <path d="M70 30q10-4 20 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>`,
  crown: `
    <path d="M54 52V24L67 38L80 16L93 38L106 24V52Z" fill="#F2C744"/>
    <rect x="52" y="46" width="56" height="9" rx="2" fill="#D9A520"/>
    <circle cx="67" cy="50" r="2.6" fill="#D0302F"/><circle cx="80" cy="50" r="2.6" fill="#2F7DD0"/><circle cx="93" cy="50" r="2.6" fill="#3BA55C"/>
    <circle cx="54" cy="24" r="3" fill="#FFE27A"/><circle cx="80" cy="16" r="3" fill="#FFE27A"/><circle cx="106" cy="24" r="3" fill="#FFE27A"/>`,
});

// ---------- Питомцы ----------
const PET_ART = {
  dog: `<svg viewBox="0 0 80 70"><path class="wag" d="M16 36q-10-10-6-22" stroke="#A9773F" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="42" rx="22" ry="13" fill="#B98446"/><rect x="18" y="48" width="7" height="16" rx="3" fill="#A9773F"/><rect x="40" y="48" width="7" height="16" rx="3" fill="#A9773F"/>
    <circle cx="56" cy="30" r="13" fill="#B98446"/><path d="M47 20q-7 5-4 16l7-7z" fill="#7A5230"/><ellipse cx="66" cy="34" rx="7" ry="5" fill="#D9AE7A"/>
    <circle cx="71" cy="32" r="2.6" fill="#2A2A2A"/><circle cx="57" cy="27" r="2.3" fill="#2A2A2A"/><path d="M64 40q2 7 5 4" fill="#E06B7A"/></svg>`,
  cat: `<svg viewBox="0 0 80 70"><path class="wag" d="M58 58q16-2 14-20" stroke="#E08A3A" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="42" cy="50" rx="18" ry="16" fill="#E8973F"/><path d="M30 44q12-6 24 0M30 52q12-6 24 0" stroke="#C26F22" stroke-width="3" fill="none"/>
    <circle cx="40" cy="26" r="14" fill="#E8973F"/><path d="M28 18l-2-12 10 7zM52 18l2-12-10 7z" fill="#E8973F"/>
    <ellipse cx="35" cy="25" rx="2.4" ry="3.4" fill="#2E5A2A"/><ellipse cx="45" cy="25" rx="2.4" ry="3.4" fill="#2E5A2A"/>
    <path d="M38 31h4l-2 2z" fill="#E06B7A"/><path d="M28 31h-8M28 33l-7 3M52 31h8M52 33l7 3" stroke="#fff" stroke-width="1"/></svg>`,
  pigeon: `<svg viewBox="0 0 80 70"><ellipse cx="36" cy="44" rx="20" ry="14" fill="#8A93A3"/><path d="M18 44q-12 2-14 10q12 0 18-6z" fill="#6B7383"/>
    <path d="M30 40q12 12 26 0" fill="#7B8494"/><circle cx="54" cy="28" r="10" fill="#8A93A3"/><path d="M48 34q6 6 12 0" fill="#5FA08A"/>
    <circle cx="57" cy="26" r="2" fill="#E2701C"/><circle cx="57" cy="26" r="1" fill="#000"/><path d="M63 28l8 2-8 2z" fill="#E2A33B"/>
    <path d="M32 58v8M40 58v8" stroke="#D96A5A" stroke-width="2.5"/></svg>`,
  rat: `<svg viewBox="0 0 80 70"><path class="wag" d="M14 50q-12 4-8 16" stroke="#E7A3A0" stroke-width="3" fill="none"/>
    <ellipse cx="36" cy="48" rx="22" ry="13" fill="#9A9A9F"/><path d="M52 40q16 4 18 10q-8 4-18 2z" fill="#9A9A9F"/>
    <circle cx="52" cy="36" r="7" fill="#B9B9BE"/><circle cx="52" cy="36" r="4" fill="#E7A3A0"/><circle cx="62" cy="44" r="2" fill="#000"/><circle cx="70" cy="50" r="2" fill="#E7A3A0"/>
    <path d="M70 50h8M70 51l7 3" stroke="#555" stroke-width=".8"/></svg>`,
  parrot: `<svg viewBox="0 0 80 70"><path d="M30 50q-8 14-2 20M36 52q-2 14 6 18" stroke="#2F5DA8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="38" cy="38" rx="14" ry="20" fill="#3FA0D9"/><path d="M28 34q-6 14 6 22" fill="#2F7DB8"/><circle cx="42" cy="18" r="12" fill="#3FA0D9"/>
    <circle cx="44" cy="15" r="3" fill="#fff"/><circle cx="45" cy="15" r="1.6" fill="#000"/><path d="M50 18q10 2 4 12q-2-6-6-6z" fill="#F2C744"/>
    <path d="M36 6q2-6 8-4" stroke="#F2C744" stroke-width="3" fill="none"/></svg>`,
  hedgehog: `<svg viewBox="0 0 80 70"><path d="M10 52q2-30 32-32q24 2 26 20l-6 2q2-8-2-8l2-6-8 2-2-6-6 4-4-6-4 6-6-4-2 6-8-2 2 8-8 0 4 6-8 4z" fill="#6B4E2E"/>
    <ellipse cx="40" cy="50" rx="26" ry="12" fill="#8A6A3E"/><ellipse cx="62" cy="48" rx="10" ry="8" fill="#D9B98A"/>
    <circle cx="72" cy="47" r="2.5" fill="#2A2A2A"/><circle cx="62" cy="44" r="2" fill="#2A2A2A"/></svg>`,
};

// ---------- Праздничные украшения сцены ----------
const SEASON_ART = {
  halloween: `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice">
    <rect width="360" height="420" fill="#3A1A50" opacity=".28"/><circle cx="290" cy="70" r="34" fill="#FFE7A8" opacity=".85"/>
    <g class="bat"><path d="M60 80q8-10 14 0q6-10 14 0q-8-2-14 6q-6-8-14-6z" fill="#1B1020"/></g>
    <g class="bat b2"><path d="M200 50q8-10 14 0q6-10 14 0q-8-2-14 6q-6-8-14-6z" fill="#1B1020"/></g>
    <g transform="translate(20 360)"><ellipse cx="24" cy="24" rx="26" ry="20" fill="#F08A24"/><path d="M14 18l5-6 5 6zM28 18l5-6 5 6zM12 30q12 8 24 0l-4 4-4-3-4 3-4-3z" fill="#FFD25A" class="glow"/><rect x="21" y="0" width="6" height="8" fill="#5E7A2E"/></g>
    <g transform="translate(300 368)"><ellipse cx="20" cy="20" rx="20" ry="16" fill="#E07B1A"/><path d="M11 15l4-5 4 5zM23 15l4-5 4 5zM10 25q10 6 20 0" fill="#FFD25A" class="glow"/></g></svg>`,
  newyear: `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice">
    <rect width="360" height="420" fill="#BFE3FF" opacity=".12"/>
    <path d="M0 18q45 26 90 0t90 0 90 0 90 0" stroke="#2F5238" stroke-width="3" fill="none"/>
    ${[20, 55, 90, 125, 160, 195, 230, 265, 300, 335].map((x, i) => `<circle cx="${x}" cy="${18 + (i % 2 ? 8 : 10)}" r="5" fill="${['#E5534B', '#F2C744', '#4FA3E0', '#6CC36A'][i % 4]}" class="bulb" style="animation-delay:${i * 0.2}s"/>`).join('')}
    <g transform="translate(300 300)"><path d="M20 0L40 34H30L44 60H-4L10 34H0Z" fill="#2F7A45"/><rect x="16" y="60" width="8" height="10" fill="#6B4E2E"/><path d="M20-6l2 5 5 .5-4 3 1.5 5-4.5-3-4.5 3 1.5-5-4-3 5-.5z" fill="#F2C744"/></g></svg>`,
  march8: `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice">
    ${[20, 50, 300, 330].map((x, i) => `<g transform="translate(${x} 370)"><path d="M0 50V10" stroke="#4E9A4A" stroke-width="3"/><path d="M-8 12q0-14 8-14q8 0 8 14q-8 6-16 0z" fill="${['#F07F9A', '#FFD25A', '#E5534B', '#B06CFF'][i]}"/></g>`).join('')}
    ${[60, 140, 220, 300].map((x, i) => `<path class="heart" style="animation-delay:${i * 1.2}s" d="M${x} 300c-6-8-16-2-10 6l10 10 10-10c6-8-4-14-10-6z" fill="#F07F9A"/>`).join('')}</svg>`,
  feb23: `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice">
    <path d="M0 0h360v14H0z" fill="#5A6B3A"/><path d="M0 14h360v6H0z" fill="#E2A33B"/>
    ${[40, 120, 200, 280].map((x, i) => `<path class="bulb" style="animation-delay:${i * 0.3}s" d="M${x} 40l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#D0302F"/>`).join('')}</svg>`,
  sept1: `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice">
    ${[30, 90, 160, 230, 300, 340].map((x, i) => `<path class="leaf" style="animation-delay:${i * 0.9}s" d="M${x} -10q10 0 12 10q-10 2-12-10z" fill="${['#E2A33B', '#D0602F', '#F2C744'][i % 3]}"/>`).join('')}
    <g transform="translate(300 360)"><path d="M10 0q-10 0-10 14v14h20V14q0-14-10-14z" fill="#F2C744"/><circle cx="10" cy="32" r="4" fill="#C9A23A"/><path d="M10 0v-8" stroke="#D0302F" stroke-width="3"/></g></svg>`,
  april1: `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice">
    ${[40, 100, 260, 320].map((x, i) => `<g class="balloon" style="animation-delay:${i * 0.7}s"><ellipse cx="${x}" cy="120" rx="16" ry="20" fill="${['#E5534B', '#4FA3E0', '#F2C744', '#6CC36A'][i]}"/><path d="M${x} 140q-6 20 4 40" stroke="#fff" fill="none"/></g>`).join('')}</svg>`,
};

// look: { mood: 'happy' | 'ok' | 'sad', sick: bool } — лицо меняется от радости и здоровья
const MOUTHS = {
  happy: 'M66 85q14 10 28 0',
  ok: 'M69 88h22',
  sad: 'M68 91q12-8 24 0',
};

function valeraSVG(eq, look = {}) {
  const b = BODIES[eq.body] || BODIES.rvan;
  const beardColor = eq.body === 'kostum' ? '#4A3B2E' : '#6E5C4A';
  const SKIN = look.sick ? '#D3D49A' : '#F1C7A1';
  const SKIN_DARK = look.sick ? '#B9BB7E' : '#E0A784';
  const mouth = MOUTHS[look.mood] || MOUTHS.happy;
  const brows = look.mood === 'sad' ? 'M62 57q7-2 13-5M85 52q7 3 13 5' : 'M62 55q7-4 13 0M85 55q7-4 13 0';
  return `
<svg viewBox="0 0 160 240" xmlns="http://www.w3.org/2000/svg" class="valera-svg">
  <ellipse cx="80" cy="232" rx="54" ry="7" fill="rgba(0,0,0,.25)"/>
  <rect x="56" y="160" width="20" height="64" rx="8" fill="${b.pants}"/>
  <rect x="84" y="160" width="20" height="64" rx="8" fill="${b.pants}"/>
  ${SHOES[eq.shoes] || SHOES.none}
  <rect x="30" y="102" width="20" height="56" rx="10" fill="${b.jacket}"/>
  <circle cx="40" cy="160" r="9" fill="${SKIN}"/>
  <rect x="44" y="94" width="72" height="76" rx="18" fill="${b.jacket}"/>
  <path d="M70 96L80 128L90 96Z" fill="${b.shirt}"/>
  ${b.extra}
  <g class="bottle-arm">
    <rect x="110" y="100" width="20" height="50" rx="10" fill="${b.jacket}" transform="rotate(-25 120 104)"/>
    <rect x="132" y="108" width="14" height="36" rx="4" fill="#5FA05A"/>
    <rect x="135" y="97" width="8" height="13" rx="2" fill="#5FA05A"/>
    <rect x="134" y="118" width="10" height="10" fill="#F2E6B8"/>
    <rect x="135" y="93" width="8" height="5" rx="1" fill="#C9A23A"/>
    <circle cx="139" cy="146" r="9" fill="${SKIN}"/>
  </g>
  <rect x="72" y="84" width="16" height="14" fill="${SKIN_DARK}"/>
  <circle cx="50" cy="70" r="7" fill="${SKIN}"/><circle cx="110" cy="70" r="7" fill="${SKIN}"/>
  <circle cx="80" cy="66" r="30" fill="${SKIN}"/>
  <path d="M52 74Q56 104 80 104Q104 104 108 74Q100 88 80 88Q60 88 52 74Z" fill="${beardColor}"/>
  <path d="${mouth}" fill="none" stroke="#4A2E22" stroke-width="2.5" stroke-linecap="round"/>
  <g class="eyes">
    <ellipse cx="69" cy="64" rx="3.5" ry="4" fill="#2A2A2A"/><ellipse cx="91" cy="64" rx="3.5" ry="4" fill="#2A2A2A"/>
  </g>
  <path d="${brows}" fill="none" stroke="#4A3B2E" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="80" cy="75" rx="6" ry="5" fill="#E08B76"/>
  ${look.sick ? '<path d="M104 50q4 6 0 10q-4-4 0-10z" fill="#8FD0F5"/>' : ''}
  ${HATS[eq.hat] || HATS.none}
</svg>`;
}

// ---------- Локации (жильё) ----------

const SCENES = [
  // 0. Лавка в парке
  () => `
  <rect width="360" height="420" fill="#9FD3EA"/>
  <circle cx="300" cy="70" r="30" fill="#F7D774"/>
  <g class="cloud"><ellipse cx="60" cy="70" rx="40" ry="14" fill="#fff"/><ellipse cx="84" cy="60" rx="26" ry="14" fill="#fff"/></g>
  <g class="cloud slow"><ellipse cx="220" cy="120" rx="34" ry="11" fill="#fff"/><ellipse cx="236" cy="112" rx="20" ry="11" fill="#fff"/></g>
  <circle cx="40" cy="250" r="50" fill="#79B05A"/><circle cx="320" cy="245" r="56" fill="#79B05A"/>
  <rect x="0" y="270" width="360" height="150" fill="#86BD62"/>
  <path d="M120 420L160 270H200L240 420Z" fill="#CDB98E"/>
  <rect x="44" y="190" width="14" height="100" fill="#7A5634"/>
  <circle cx="51" cy="180" r="42" fill="#5E9A45"/><circle cx="28" cy="200" r="26" fill="#6FAA52"/>
  <rect x="20" y="300" width="96" height="10" rx="3" fill="#A9763F"/>
  <rect x="20" y="284" width="96" height="9" rx="3" fill="#A9763F"/>
  <rect x="28" y="310" width="7" height="24" fill="#5A3E28"/><rect x="100" y="310" width="7" height="24" fill="#5A3E28"/>
  <rect x="300" y="170" width="6" height="150" fill="#3A3F45"/><rect x="290" y="160" width="26" height="14" rx="4" fill="#3A3F45"/>
  <circle cx="303" cy="178" r="5" fill="#FFE69A"/>
  <rect x="270" y="300" width="34" height="46" rx="4" fill="#4E6B7A"/><rect x="266" y="294" width="42" height="9" rx="3" fill="#3C5563"/>
  <ellipse cx="250" cy="370" rx="10" ry="7" fill="#8A8F99"/><circle cx="258" cy="363" r="5" fill="#8A8F99"/><path d="M262 363l5 1-5 2z" fill="#E2A33B"/>`,

  // 1. Коробка в подворотне
  () => `
  <rect width="360" height="420" fill="url(#bricks)"/>
  <rect x="0" y="0" width="360" height="60" fill="#5B3A30"/>
  <rect x="230" y="90" width="70" height="60" fill="#3B4B5E"/><path d="M265 90v60M230 120h70" stroke="#5B3A30" stroke-width="5"/>
  <rect x="0" y="300" width="360" height="120" fill="#4B4B50"/>
  <ellipse cx="270" cy="380" rx="50" ry="10" fill="#6C7380"/>
  <rect x="10" y="230" width="140" height="100" fill="#C79A5E"/>
  <path d="M10 230l-6-30h70l6 30zM150 230l6-30H86l-6 30z" fill="#B5864C"/>
  <rect x="10" y="230" width="140" height="8" fill="#A87B44"/>
  <text x="80" y="290" text-anchor="middle" font-size="15" font-weight="700" fill="#8B5E2E" font-family="sans-serif">ХРУПКОЕ</text>
  <path d="M60 300h40" stroke="#8B5E2E" stroke-width="3"/>
  <rect x="270" y="250" width="80" height="70" rx="4" fill="#3F6B4A"/><rect x="264" y="242" width="92" height="12" rx="3" fill="#2F5238"/>`,

  // 2. Шалаш на пустыре
  () => `
  <rect width="360" height="420" fill="#E9905B"/>
  <circle cx="90" cy="150" r="40" fill="#F7C46A"/>
  <path d="M0 250V200h30v-30h24v40h30v-60h28v70h40v-30h30v50h36v-80h26v80h40v-40h30v50h26v50z" fill="#7A4E5E"/>
  <rect x="0" y="250" width="360" height="170" fill="#8A7752"/>
  <path d="M30 330L110 190L190 330Z" fill="#4F7A6B"/>
  <path d="M100 180l-80 160M120 180l80 160M110 175v20" stroke="#6B4E2E" stroke-width="7" stroke-linecap="round"/>
  <path d="M90 330l20-60 20 60z" fill="#2E4A40"/>
  <path d="M260 352h60M268 344l44 16M268 360l44-16" stroke="#5A3E28" stroke-width="7" stroke-linecap="round"/>
  <g class="flame"><path d="M290 340q-22-20 0-56q22 36 0 56z" fill="#F07F2E"/><path d="M290 340q-11-12 0-32q11 20 0 32z" fill="#FFD25A"/></g>`,

  // 3. Гараж
  () => `
  <rect width="360" height="420" fill="#2B3A55"/>
  <circle cx="40" cy="40" r="2" fill="#fff"/><circle cx="120" cy="70" r="1.5" fill="#fff"/><circle cx="210" cy="30" r="2" fill="#fff"/><circle cx="320" cy="60" r="1.5" fill="#fff"/><circle cx="270" cy="110" r="1.5" fill="#fff"/>
  <circle cx="290" cy="60" r="18" fill="#F2EBC9"/>
  <rect x="0" y="160" width="360" height="160" fill="#7D8B8F"/><rect x="0" y="150" width="360" height="14" fill="#5F6B6E"/>
  <rect x="10" y="190" width="100" height="130" fill="#56656B"/><rect x="250" y="190" width="100" height="130" fill="#56656B"/>
  <path d="M10 210h100M10 230h100M10 250h100M250 210h100M250 230h100M250 250h100" stroke="#4A585D" stroke-width="3"/>
  <rect x="125" y="190" width="110" height="130" fill="#F6D57A"/>
  <rect x="125" y="190" width="110" height="26" fill="#56656B"/>
  <rect x="140" y="250" width="40" height="30" fill="#B2864A"/><rect x="190" y="230" width="34" height="50" fill="#A64B3A"/>
  <rect x="0" y="320" width="360" height="100" fill="#3D4246"/>
  <path d="M0 370h360" stroke="#575C61" stroke-width="3" stroke-dasharray="20 16"/>`,

  // 4. Комната в общаге
  () => `
  <rect width="360" height="420" fill="url(#wallpaper)"/>
  <rect x="210" y="70" width="110" height="100" fill="#22314A"/>
  <circle cx="290" cy="100" r="12" fill="#F2EBC9"/>
  <path d="M210 120h110M265 70v100" stroke="#EDE7D9" stroke-width="6"/><rect x="204" y="64" width="122" height="112" fill="none" stroke="#EDE7D9" stroke-width="6"/>
  <rect x="0" y="300" width="360" height="120" fill="#8B6B4A"/>
  <rect x="10" y="250" width="120" height="70" rx="6" fill="#B33D3D"/><rect x="10" y="236" width="40" height="24" rx="8" fill="#EDE7D9"/>
  <rect x="10" y="316" width="10" height="20" fill="#5A3E28"/><rect x="120" y="316" width="10" height="20" fill="#5A3E28"/>
  <rect x="250" y="250" width="80" height="60" rx="6" fill="#4A4A50"/>
  <rect x="258" y="258" width="54" height="42" rx="6" fill="#8FB8C9" class="tv"/>
  <circle cx="320" cy="270" r="3" fill="#D04A4A"/>
  <path d="M275 250l-12-24M285 250l12-24" stroke="#4A4A50" stroke-width="3"/>
  <rect x="244" y="310" width="92" height="30" fill="#6B4E2E"/>
  <ellipse cx="190" cy="380" rx="90" ry="18" fill="#7A9A5A"/>`,

  // 5. Квартира
  () => `
  <rect width="360" height="420" fill="#E8DCCB"/>
  <rect x="190" y="50" width="150" height="160" fill="#9FD3EA"/>
  <path d="M200 210v-70h24v70zM230 210v-110h30v110zM266 210v-80h22v80zM294 210v-120h30v120z" fill="#7A9BB8"/>
  <path d="M190 130h150M265 50v160" stroke="#FFFFFF" stroke-width="7"/><rect x="186" y="46" width="158" height="168" fill="none" stroke="#FFFFFF" stroke-width="8"/>
  <rect x="30" y="80" width="70" height="54" fill="#F6F1E7" stroke="#B58A5E" stroke-width="6"/>
  <path d="M38 126l18-22 14 14 10-10 14 18z" fill="#6FAA52"/>
  <rect x="0" y="300" width="360" height="120" fill="url(#wood)"/>
  <rect x="10" y="250" width="140" height="64" rx="12" fill="#5B7DB1"/><rect x="10" y="226" width="140" height="36" rx="12" fill="#4D6C9C"/>
  <rect x="2" y="244" width="22" height="60" rx="10" fill="#4D6C9C"/><rect x="136" y="244" width="22" height="60" rx="10" fill="#4D6C9C"/>
  <rect x="292" y="270" width="30" height="40" rx="4" fill="#C2703D"/>
  <path d="M307 270q-30-30-10-60q10 30 10 60q0-40 24-56q-6 36-24 56z" fill="#4E9A4A"/>
  <rect x="226" y="230" width="4" height="80" fill="#3A3F45"/><path d="M210 230h36l-8-24h-20z" fill="#F2D27A"/>`,

  // 6. Особняк
  () => `
  <rect width="360" height="420" fill="#8FD0F5"/>
  <circle cx="60" cy="60" r="28" fill="#F7D774"/>
  <rect x="0" y="260" width="360" height="160" fill="#6CC36A"/>
  <path d="M40 120L180 50L320 120Z" fill="#9C4B3B"/>
  <rect x="50" y="120" width="260" height="150" fill="#F4ECDD"/>
  <rect x="50" y="120" width="260" height="12" fill="#E2D6C0"/>
  <rect x="70" y="140" width="12" height="120" fill="#FFFFFF"/><rect x="110" y="140" width="12" height="120" fill="#FFFFFF"/>
  <rect x="238" y="140" width="12" height="120" fill="#FFFFFF"/><rect x="278" y="140" width="12" height="120" fill="#FFFFFF"/>
  <rect x="150" y="190" width="60" height="80" rx="30" fill="#7A4A2E"/>
  <rect x="140" y="146" width="80" height="30" fill="#BFE3F2"/>
  <path d="M0 360h120q30 0 30 20v40H0z" fill="#4FC3E8"/><path d="M10 380q10-6 20 0t20 0 20 0" fill="none" stroke="#BFEFFF" stroke-width="3"/>
  <rect x="318" y="190" width="8" height="90" fill="#8A6A3E" transform="rotate(6 322 280)"/>
  <path d="M330 190q-30-10-46 10q24-4 46-10q-20-24-40-20q26 4 40 20q10-30 30-30q-16 12-30 30q30-8 36 10q-18-8-36-10z" fill="#3F9A4A"/>`,
];

function sceneSVG(level) {
  const draw = SCENES[Math.min(level, SCENES.length - 1)];
  return `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${draw()}</svg>`;
}

// ---------- Иконки ----------

const ICONS = {
  coin: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#E9B530"/><circle cx="12" cy="12" r="8" fill="#F6CF55"/><text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="800" fill="#A5741A" font-family="sans-serif">₽</text></svg>`,
  bottle: `<svg viewBox="0 0 24 24"><rect x="8" y="9" width="8" height="14" rx="2.5" fill="#5FA05A"/><rect x="10" y="3" width="4" height="7" rx="1" fill="#5FA05A"/><rect x="10" y="1.5" width="4" height="2.5" rx=".8" fill="#C9A23A"/><rect x="9" y="13" width="6" height="5" fill="#F2E6B8"/></svg>`,
  cap: `<svg viewBox="0 0 24 24"><path d="M12 1l2 2.2 2.9-.8.7 2.9 2.9.7-.8 2.9L22 11l-2.2 2 .8 2.9-2.9.7-.7 2.9-2.9-.8L12 21l-2-2.2-2.9.8-.7-2.9-2.9-.7.8-2.9L2 11l2.2-2-.8-2.9 2.9-.7.7-2.9 2.9.8z" fill="#E9B530"/><circle cx="12" cy="11" r="5.5" fill="#F6CF55"/></svg>`,
  energy: `<svg viewBox="0 0 24 24"><path d="M14 1L4 14h7l-2 9 11-14h-7z" fill="#FFC93C"/></svg>`,
  food: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="13" rx="10" ry="7" fill="#D9A15A"/><path d="M6 10l2 4M11 9l2 4M16 10l2 4" stroke="#B57B38" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  star: `<svg viewBox="0 0 24 24"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" fill="#FFB800"/></svg>`,
  heart: `<svg viewBox="0 0 24 24"><path d="M12 21C5 15.5 2 12.5 2 8.5A5 5 0 0 1 12 6a5 5 0 0 1 10 2.5c0 4-3 7-10 12.5z" fill="#E5534B"/></svg>`,
  smile: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4FA3E0"/><circle cx="8.5" cy="10" r="1.5" fill="#123"/><circle cx="15.5" cy="10" r="1.5" fill="#123"/><path d="M7.5 14q4.5 4 9 0" stroke="#123" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
  crown: `<svg viewBox="0 0 24 24"><path d="M3 18L2 7l5 4 5-7 5 7 5-4-1 11z" fill="#F2C744"/><rect x="3" y="18" width="18" height="3" rx="1" fill="#D9A72E"/></svg>`,
};

const ITEM_ART = {
  baton: `<svg viewBox="0 0 48 48"><rect x="4" y="18" width="40" height="14" rx="7" fill="#D9A15A" transform="rotate(-20 24 25)"/><path d="M14 22l3 6M22 19l3 6M30 16l3 6" stroke="#B57B38" stroke-width="2" stroke-linecap="round"/></svg>`,
  shaurma: `<svg viewBox="0 0 48 48"><path d="M14 8h20l-4 36h-12z" fill="#F0D9A8"/><path d="M15 10q9 6 18 0" stroke="#7DB35A" stroke-width="4" fill="none"/><path d="M15 15q9 4 18 0" stroke="#D2483F" stroke-width="3" fill="none"/><rect x="16" y="26" width="16" height="14" fill="#E9E1D3"/></svg>`,
  obed: `<svg viewBox="0 0 48 48"><rect x="3" y="30" width="42" height="8" rx="3" fill="#8A9AA8"/><ellipse cx="18" cy="28" rx="11" ry="5" fill="#F4F4F0"/><ellipse cx="18" cy="27" rx="8" ry="3" fill="#D2483F"/><rect x="31" y="14" width="10" height="16" rx="2" fill="#BFE3F2"/><rect x="31" y="20" width="10" height="10" fill="#C27A3D"/></svg>`,
  core: `<svg viewBox="0 0 48 48"><path d="M16 10q8 4 16 0q-4 8 0 14q4 8 0 14q-8-4-16 0q4-8 0-14q-4-8 0-14z" fill="#F2E6B8"/><path d="M16 10q-6 0-6 6M32 10q6 0 6 6" stroke="#D2483F" stroke-width="5" fill="none"/><path d="M24 4v6" stroke="#6B4E2E" stroke-width="3"/><ellipse cx="24" cy="24" rx="2" ry="3" fill="#4A2E22"/></svg>`,
  coins: `<svg viewBox="0 0 48 48"><ellipse cx="18" cy="34" rx="12" ry="5" fill="#C9962A"/><ellipse cx="18" cy="31" rx="12" ry="5" fill="#E9B530"/><ellipse cx="30" cy="26" rx="12" ry="5" fill="#C9962A"/><ellipse cx="30" cy="23" rx="12" ry="5" fill="#F6CF55"/></svg>`,
  bag: `<svg viewBox="0 0 48 48"><path d="M8 18h32l-4 26H12z" fill="#EDE7D9" opacity=".9"/><rect x="14" y="8" width="7" height="22" rx="2" fill="#5FA05A"/><rect x="24" y="4" width="7" height="26" rx="2" fill="#4E8A9A"/><rect x="33" y="10" width="6" height="20" rx="2" fill="#8A5A3A"/><path d="M8 18h32l-4 26H12z" fill="#EDE7D9" opacity=".6"/></svg>`,
  watch: `<svg viewBox="0 0 48 48"><rect x="18" y="2" width="12" height="44" rx="4" fill="#8A6A3E"/><circle cx="24" cy="24" r="13" fill="#D9A72E"/><circle cx="24" cy="24" r="10" fill="#FFF8E6"/><path d="M24 24V16M24 24l6 3" stroke="#333" stroke-width="2" stroke-linecap="round"/></svg>`,
  goldcap: `<svg viewBox="0 0 48 48"><path d="M24 2l4 4.4 5.8-1.6 1.4 5.8 5.8 1.4-1.6 5.8L44 22l-4.4 4 1.6 5.8-5.8 1.4-1.4 5.8-5.8-1.6L24 42l-4-4.4-5.8 1.6-1.4-5.8-5.8-1.4 1.6-5.8L4 22l4.4-4-1.6-5.8 5.8-1.4 1.4-5.8 5.8 1.6z" fill="#E9B530"/><circle cx="24" cy="22" r="11" fill="#F6CF55"/><path d="M18 18l4 4 8-8" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/></svg>`,
  ticket: `<svg viewBox="0 0 48 48"><path d="M4 12h40v8a4 4 0 0 0 0 8v8H4v-8a4 4 0 0 0 0-8z" fill="#F07F9A"/><path d="M30 12v24" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/><text x="17" y="29" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="sans-serif">777</text></svg>`,
  phone: `<svg viewBox="0 0 48 48"><rect x="13" y="4" width="22" height="40" rx="4" fill="#3A3F45"/><rect x="16" y="9" width="16" height="26" fill="#8FB8C9"/><path d="M18 12l12 18M28 12l-6 10" stroke="#fff" stroke-width="1.5"/><circle cx="24" cy="39" r="2" fill="#6E7680"/></svg>`,
};

function trashCanSVG() {
  return `
<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="134" rx="44" ry="5" fill="rgba(0,0,0,.3)"/>
  <path d="M20 40h80l-8 92H28z" fill="#5D7A86"/>
  <path d="M40 52v68M60 52v68M80 52v68" stroke="#4A636E" stroke-width="5" stroke-linecap="round"/>
  <g class="trash-lid"><rect x="12" y="28" width="96" height="14" rx="5" fill="#4A636E"/><rect x="48" y="18" width="24" height="12" rx="4" fill="#3C525B"/></g>
  <path d="M30 40q6-10 14-4M78 38q8-8 14 0" stroke="#7DB35A" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;
}

// Превью одной вещи для магазина: персонаж обрезается до нужной части
function itemPreviewSVG(slot, id) {
  const eq = { hat: 'none', body: 'rvan', shoes: 'none' };
  eq[slot] = id;
  const viewBox = slot === 'hat' ? '30 0 100 90' : slot === 'shoes' ? '30 180 100 60' : '20 80 130 100';
  return valeraSVG(eq).replace('viewBox="0 0 160 240"', `viewBox="${viewBox}"`);
}

function sceneThumbSVG(level) {
  return sceneSVG(level).replace('preserveAspectRatio="xMidYMax slice"', 'preserveAspectRatio="xMidYMid slice"');
}
