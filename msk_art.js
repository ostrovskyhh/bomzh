// Графика Москвабада (3.0): новые животные и 7 сцен жилья. Зависит только от art.js —
// поэтому её можно рисовать и в генераторе картинок (branding/render). Город спрашивает city() в момент рисования.

Object.assign(PET_ART, {
  magpie: `<svg viewBox="0 0 80 70"><path class="wag" d="M20 44L2 52l4 5 16-7z" fill="#1F2A44"/><ellipse cx="38" cy="42" rx="18" ry="12" fill="#1C1C22"/>
    <ellipse cx="40" cy="46" rx="11" ry="7" fill="#F4F4F0"/><path d="M28 36q10-6 20 2q-8 6-20 4z" fill="#2E5FA8"/><circle cx="54" cy="28" r="9" fill="#1C1C22"/>
    <circle cx="57" cy="26" r="2" fill="#fff"/><circle cx="57.5" cy="26" r="1" fill="#000"/><path d="M62 28l9 2-9 2z" fill="#3A3A3A"/>
    <path d="M34 54v9M42 54v9" stroke="#333" stroke-width="2.5"/><circle cx="68" cy="40" r="3.5" fill="#F2C744"/></svg>`,
  ferret: `<svg viewBox="0 0 80 70"><path class="wag" d="M12 48q-9-4-7-14" stroke="#7A5A3A" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="48" rx="24" ry="9" fill="#C9A27A"/><path d="M16 50q18 8 36 0" fill="#E9D3B5"/>
    <rect x="18" y="52" width="6" height="10" rx="3" fill="#7A5A3A"/><rect x="44" y="52" width="6" height="10" rx="3" fill="#7A5A3A"/>
    <ellipse cx="60" cy="40" rx="11" ry="9" fill="#E9D3B5"/><path d="M53 37q7-7 14 0q-7 4-14 0z" fill="#7A5A3A"/>
    <circle cx="57" cy="37" r="2" fill="#000"/><circle cx="64" cy="37" r="2" fill="#000"/><circle cx="70" cy="42" r="2" fill="#E07A8A"/>
    <circle cx="52" cy="32" r="3" fill="#C9A27A"/><circle cx="67" cy="32" r="3" fill="#C9A27A"/></svg>`,
  doberman: `<svg viewBox="0 0 80 70"><path class="wag" d="M14 34q-6-8-4-16" stroke="#1E1E22" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="40" rx="21" ry="12" fill="#1E1E22"/><rect x="18" y="46" width="6" height="18" rx="3" fill="#1E1E22"/><rect x="40" y="46" width="6" height="18" rx="3" fill="#1E1E22"/>
    <rect x="18" y="58" width="6" height="6" rx="2" fill="#B8742E"/><rect x="40" y="58" width="6" height="6" rx="2" fill="#B8742E"/>
    <circle cx="56" cy="28" r="12" fill="#1E1E22"/><path d="M48 19l-3-14 10 10z" fill="#1E1E22"/><path d="M59 17l5-13 3 14z" fill="#1E1E22"/>
    <ellipse cx="66" cy="33" rx="8" ry="5" fill="#B8742E"/><circle cx="71" cy="31" r="2.4" fill="#111"/><circle cx="58" cy="26" r="2.2" fill="#B8742E"/><circle cx="58" cy="26" r="1.1" fill="#000"/>
    <rect x="44" y="36" width="12" height="4" rx="2" fill="#C8202F"/></svg>`,
  capybara: `<svg viewBox="0 0 80 70"><ellipse cx="36" cy="44" rx="26" ry="15" fill="#A0703F"/><rect x="18" y="52" width="7" height="12" rx="3" fill="#8A5E33"/><rect x="44" y="52" width="7" height="12" rx="3" fill="#8A5E33"/>
    <rect x="50" y="24" width="24" height="20" rx="9" fill="#A0703F"/><ellipse cx="72" cy="37" rx="5" ry="6" fill="#7A522C"/>
    <path d="M58 30h5" stroke="#2A2A2A" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="53" cy="24" rx="3" ry="2.5" fill="#7A522C"/>
    <circle cx="62" cy="18" r="5" fill="#F2A33B"/><path d="M62 13v-4" stroke="#3A8A3A" stroke-width="2"/></svg>`,
  macaw: `<svg viewBox="0 0 80 70"><path d="M32 50q-6 16 0 20M38 52q2 14 10 16" stroke="#2F5DA8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="38" cy="38" rx="14" ry="20" fill="#D9302A"/><path d="M27 32q-6 16 8 24" fill="#F2C744"/><path d="M28 42q-2 10 8 14" fill="#2F7DD9"/>
    <circle cx="42" cy="18" r="12" fill="#D9302A"/><circle cx="45" cy="16" r="4" fill="#fff"/><circle cx="46" cy="16" r="1.8" fill="#000"/>
    <path d="M50 18q12 2 5 14q-3-7-7-7z" fill="#2A2A2A"/></svg>`,
  sphynx: `<svg viewBox="0 0 80 70"><path class="wag" d="M58 58q16-2 12-22" stroke="#E8B9A6" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="42" cy="50" rx="17" ry="15" fill="#EDC3B0"/><path d="M32 46q10-3 20 0" stroke="#D9A08C" stroke-width="2" fill="none"/>
    <circle cx="40" cy="27" r="13" fill="#EDC3B0"/><path d="M27 22l-7-17 14 9zM53 22l7-17-14 9z" fill="#EDC3B0"/>
    <ellipse cx="35" cy="26" rx="3" ry="3.6" fill="#5FB06A"/><ellipse cx="45" cy="26" rx="3" ry="3.6" fill="#5FB06A"/><ellipse cx="35" cy="26" rx="1" ry="3" fill="#111"/><ellipse cx="45" cy="26" rx="1" ry="3" fill="#111"/>
    <path d="M38 32h4l-2 2z" fill="#D96A7A"/><path d="M34 15q6 3 12 0" stroke="#D9A08C" stroke-width="1.5" fill="none"/></svg>`,
});

// =====================================================================
// 3. Сцены жилья Москвабада — 7 новых картинок
// =====================================================================
const MSK_SKYLINE = (y, c = '#3A4A6A', lit = '#FFD978') => `<g fill="${c}"><rect x="0" y="${y + 40}" width="40" height="200"/><rect x="44" y="${y + 10}" width="30" height="230"/><rect x="78" y="${y + 30}" width="36" height="210"/>
  <polygon points="118,${y + 240} 118,${y - 20} 132,${y - 40} 146,${y - 20} 146,${y + 240}"/><rect x="150" y="${y + 20}" width="34" height="220"/><rect x="188" y="${y}" width="26" height="240"/>
  <rect x="218" y="${y + 36}" width="40" height="204"/><polygon points="262,${y + 240} 262,${y - 4} 280,${y - 30} 298,${y - 4} 298,${y + 240}"/><rect x="302" y="${y + 24}" width="30" height="216"/><rect x="336" y="${y + 6}" width="30" height="234"/></g>
  <g fill="${lit}">${Array.from({ length: 34 }, (_, i) => `<rect x="${(i * 53) % 350 + 6}" y="${y + 20 + ((i * 37) % 120)}" width="4" height="5"/>`).join('')}</g>`;
const MSK_SCENES = [
  // 0. Лавка у вокзала: площадь, вокзал с часами, башни
  () => `<rect width="360" height="420" fill="#F3B98A"/><rect width="360" height="200" fill="url(#mskDusk)"/>
    <defs><linearGradient id="mskDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A7FC4"/><stop offset="1" stop-color="#F3B98A"/></linearGradient></defs>
    ${MSK_SKYLINE(120, '#55618A', '#FFE7A8')}
    <rect x="40" y="150" width="280" height="120" fill="#C9A27A"/><rect x="40" y="140" width="280" height="14" fill="#9A7652"/>
    <polygon points="150,140 180,96 210,140" fill="#9A7652"/><circle cx="180" cy="124" r="13" fill="#F4F0E6" stroke="#5A4630" stroke-width="3"/><path d="M180 124v-8M180 124h6" stroke="#333" stroke-width="2"/>
    ${[70, 120, 230, 280].map((x) => `<path d="M${x} 270v-60q20-24 40 0v60z" fill="#7A5A3A"/>`).join('')}
    <rect x="0" y="270" width="360" height="150" fill="#B4B8C0"/><path d="M0 300H360M0 340H360M0 380H360M60 270L40 420M140 270L130 420M220 270L230 420M300 270L320 420" stroke="#9EA3AD" stroke-width="2"/>
    <rect x="22" y="290" width="70" height="8" rx="3" fill="#6B4A2E"/><rect x="22" y="302" width="70" height="8" rx="3" fill="#6B4A2E"/><rect x="28" y="310" width="5" height="20" fill="#3A3A3A"/><rect x="82" y="310" width="5" height="20" fill="#3A3A3A"/>
    <rect x="320" y="200" width="6" height="110" fill="#2E2E36"/><circle cx="323" cy="198" r="9" fill="#FFE7A8"/>`,
  // 1. Палатка в переходе: кафель, лампы, палатка
  () => `<rect width="360" height="420" fill="#D8DDD3"/>
    <g stroke="#BFC6BA" stroke-width="2">${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 24}H360"/>`).join('')}${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 24} 0V280"/>`).join('')}</g>
    <rect x="0" y="30" width="360" height="10" fill="#F4F7FF"/><rect x="40" y="26" width="90" height="8" rx="4" fill="#FFFFFF" opacity=".9"/><rect x="220" y="26" width="90" height="8" rx="4" fill="#FFFFFF" opacity=".9"/>
    <rect x="210" y="90" width="110" height="140" rx="6" fill="#2F5DA8"/><rect x="220" y="100" width="90" height="100" fill="#F2C744"/><text x="265" y="160" font-size="34" text-anchor="middle">🛍️</text>
    <rect x="0" y="280" width="360" height="140" fill="#8E9488"/><path d="M0 280H360" stroke="#6E7468" stroke-width="5"/>
    <path d="M20 290L70 200L120 290Z" fill="#3D8BD9"/><path d="M70 200L70 290" stroke="#2A6AB0" stroke-width="3"/><path d="M58 290L70 250L82 290Z" fill="#1E3F66"/>
    <rect x="130" y="276" width="60" height="16" rx="6" fill="#7A6A5A"/><text x="320" y="320" font-size="22">📦</text>`,
  // 2. Койка в хостеле: двухъярусная кровать, шкафчики, окно на город
  () => `<rect width="360" height="420" fill="#BFD6E6"/>
    <rect x="200" y="50" width="130" height="120" fill="#2B3A5E"/><g clip-path="url(#hw)">${MSK_SKYLINE(100, '#1E2A48', '#FFD978')}</g><defs><clipPath id="hw"><rect x="200" y="50" width="130" height="120"/></clipPath></defs>
    <rect x="200" y="50" width="130" height="120" fill="none" stroke="#F4F4F0" stroke-width="7"/><path d="M265 50V170" stroke="#F4F4F0" stroke-width="5"/>
    <rect x="20" y="70" width="130" height="200" fill="none" stroke="#5A6A7A" stroke-width="7"/><rect x="24" y="130" width="122" height="24" fill="#E05A5A"/><rect x="24" y="246" width="122" height="24" fill="#3FA0D9"/>
    <rect x="30" y="122" width="34" height="12" rx="5" fill="#fff"/><rect x="30" y="238" width="34" height="12" rx="5" fill="#fff"/><path d="M146 70V270" stroke="#5A6A7A" stroke-width="5"/><path d="M146 90h-14M146 110h-14" stroke="#5A6A7A" stroke-width="4"/>
    <rect x="0" y="270" width="360" height="150" fill="url(#wood)"/>
    ${[200, 252, 304].map((x) => `<rect x="${x}" y="190" width="46" height="80" rx="3" fill="#7A8AA0"/><circle cx="${x + 38}" cy="230" r="3" fill="#333"/>`).join('')}`,
  // 3. Капсула в коливинге: соты капсул с подсветкой
  () => `<rect width="360" height="420" fill="#20263A"/>
    ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${20 + c * 112}" y="${40 + r * 76}" width="100" height="66" rx="20" fill="#2E3754" stroke="#4FD1FF" stroke-width="3"/>
      <rect x="${30 + c * 112}" y="${52 + r * 76}" width="80" height="42" rx="14" fill="${(r + c) % 3 ? '#1B2133' : '#3B6A8A'}"/>`).join('')).join('')}
    <rect x="0" y="270" width="360" height="150" fill="#343B52"/><path d="M0 270H360" stroke="#4FD1FF" stroke-width="3"/>
    <text x="300" y="320" font-size="26">🔌</text><text x="40" y="330" font-size="26">🧳</text>`,
  // 4. Студия 12 м²: кровать, кухонька, окно
  () => `<rect width="360" height="420" fill="#EDE3D2"/>
    <rect x="120" y="50" width="130" height="130" fill="#7FB3E0"/><g clip-path="url(#sw)">${MSK_SKYLINE(110, '#5C7CA8', '#FFF4C2')}</g><defs><clipPath id="sw"><rect x="120" y="50" width="130" height="130"/></clipPath></defs>
    <rect x="120" y="50" width="130" height="130" fill="none" stroke="#fff" stroke-width="8"/>
    <rect x="260" y="170" width="100" height="100" fill="#F4F4F0"/><rect x="260" y="164" width="100" height="10" fill="#9A7652"/><circle cx="285" cy="152" r="7" fill="#3A3A3A"/><circle cx="315" cy="152" r="7" fill="#3A3A3A"/>
    <rect x="270" y="190" width="36" height="70" fill="#DCD6CA"/><rect x="314" y="190" width="36" height="70" fill="#DCD6CA"/>
    <rect x="0" y="210" width="110" height="60" rx="8" fill="#F2C744"/><rect x="0" y="198" width="40" height="22" rx="6" fill="#fff"/>
    <rect x="0" y="270" width="360" height="150" fill="url(#wood)"/><text x="80" y="160" font-size="34">🪴</text>`,
  // 5. Двушка в ЖК: панорамное окно, диван, телевизор
  () => `<rect width="360" height="420" fill="#E9E6E0"/>
    <rect x="20" y="40" width="320" height="180" fill="#8EC7F0"/><g clip-path="url(#pw)">${MSK_SKYLINE(80, '#4A6A96', '#FFF4C2')}</g><defs><clipPath id="pw"><rect x="20" y="40" width="320" height="180"/></clipPath></defs>
    <rect x="20" y="40" width="320" height="180" fill="none" stroke="#3A3A44" stroke-width="6"/><path d="M127 40V220M233 40V220" stroke="#3A3A44" stroke-width="4"/>
    <rect x="30" y="220" width="170" height="54" rx="14" fill="#5E6B7E"/><rect x="40" y="200" width="150" height="30" rx="12" fill="#6E7B90"/><rect x="60" y="210" width="30" height="20" rx="6" fill="#F2C744"/>
    <rect x="230" y="232" width="100" height="40" fill="#3A3A44"/><rect x="240" y="180" width="80" height="48" rx="3" fill="#1A1A22"/>
    <rect x="0" y="270" width="360" height="150" fill="#C9B79C"/><ellipse cx="180" cy="320" rx="110" ry="22" fill="#B39E80"/>`,
  // 6. Пентхаус: ночная панорама, бассейн, шезлонги
  () => `<rect width="360" height="420" fill="#121A33"/>
    ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 71) % 360}" cy="${(i * 29) % 90 + 6}" r="1.2" fill="#fff" opacity=".8"/>`).join('')}
    <circle cx="300" cy="50" r="18" fill="#FFF4C2"/>
    ${MSK_SKYLINE(90, '#26365E', '#FFD978')}
    <rect x="0" y="40" width="360" height="236" fill="none" stroke="#C9A23A" stroke-width="6"/><path d="M120 40V276M240 40V276" stroke="#C9A23A" stroke-width="3"/>
    <rect x="0" y="276" width="360" height="144" fill="#2A2A33"/><rect x="20" y="300" width="200" height="60" rx="12" fill="#3FB8E0"/><path d="M40 320q20-8 40 0t40 0t40 0" stroke="#BFF0FF" stroke-width="3" fill="none"/>
    <rect x="240" y="300" width="100" height="20" rx="6" fill="#F4F0E6"/><rect x="240" y="322" width="100" height="6" fill="#C9A23A"/><text x="300" y="296" font-size="22">🍾</text>`,
];
sceneSVG = (function (orig) {
  return function (level) {
    if (typeof city !== 'function' || city() !== 'msk') return orig(level);
    const draw = MSK_SCENES[Math.min(level, MSK_SCENES.length - 1)];
    return `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${draw()}</svg>`;
  };
})(sceneSVG);

