// Одежда 4.2: в каждом городе вся одежда и обувь своя — не только названия (msk.js, mex.js), но и рисунок:
// бини и федора в Москвабаде, сомбреро и шляпа мариачи в Мексике; худи, пуховик-кокон, пончо, серапе;
// лоферы, кроссовки «Аир», уарачи и ковбойские сапоги. Механика вещей (id, уровни, бонусы) прежняя.

function cityArt(table, key, msk, mex) {
  const zas = table[key];
  if (msk) MSK_RESKIN.push((on) => { if (on) table[key] = msk; else if (table[key] === msk) table[key] = zas; });
  if (mex) MEX_RESKIN.push((on) => { if (on) table[key] = mex; else if (table[key] === mex) table[key] = zas; });
}

// ---------- Шапки ----------
cityArt(HATS, 'shapka',
  `<path d="M50 58Q50 24 80 24Q110 24 110 58Z" fill="#E8E4DA"/><rect x="47" y="50" width="66" height="12" rx="6" fill="#C9C2B4"/>
   <path d="M60 50v12M72 50v12M84 50v12M96 50v12" stroke="#B5AD9E" stroke-width="2"/><circle cx="80" cy="20" r="8" fill="#F28B82"/>`,
  `<ellipse cx="80" cy="50" rx="42" ry="8" fill="#E8C873"/><path d="M60 49Q62 24 80 24Q98 24 100 49Z" fill="#E8C873"/>
   <path d="M62 36h36M64 30h32M44 50h72" stroke="#C9A24E" stroke-width="1.5"/><rect x="60" y="42" width="40" height="5" fill="#B3122E"/>`);
cityArt(HATS, 'ushanka',
  `<rect x="42" y="54" width="14" height="28" rx="7" fill="#E9E9EE"/><rect x="104" y="54" width="14" height="28" rx="7" fill="#E9E9EE"/>
   <path d="M48 58Q48 26 80 26Q112 26 112 58Z" fill="#9EA3AD"/><rect x="44" y="48" width="72" height="13" rx="6.5" fill="#E9E9EE"/>
   <path d="M60 36q20-6 40 0" stroke="#8A8F99" stroke-width="2" fill="none"/>`,
  `<ellipse cx="80" cy="50" rx="56" ry="11" fill="#C0392B"/><ellipse cx="80" cy="48" rx="50" ry="8" fill="#E74C3C"/>
   <path d="M62 48Q60 14 80 12Q100 14 98 48Z" fill="#E74C3C"/><path d="M62 40h36" stroke="#F2C744" stroke-width="4"/>
   <path d="M30 50q50 14 100 0" stroke="#F2C744" stroke-width="2.5" fill="none" stroke-dasharray="4 3"/><circle cx="80" cy="26" r="3" fill="#F2C744"/>`);
cityArt(HATS, 'kepka',
  `<path d="M50 54Q50 28 80 28Q110 28 110 52Z" fill="#141418"/><path d="M98 50Q126 48 134 56Q112 61 96 56Z" fill="#141418"/>
   <text x="78" y="47" text-anchor="middle" font-size="11" font-weight="900" fill="#F4F4F0">МБ</text><circle cx="80" cy="29" r="2.5" fill="#333"/>`,
  `<path d="M50 56Q50 26 80 26Q110 26 110 56Z" fill="#C0392B"/><path d="M108 50l16 6-14 6z" fill="#A93226"/>
   <circle cx="64" cy="40" r="2.5" fill="#fff"/><circle cx="78" cy="34" r="2.5" fill="#fff"/><circle cx="92" cy="40" r="2.5" fill="#fff"/><circle cx="72" cy="48" r="2.5" fill="#fff"/><circle cx="88" cy="50" r="2.5" fill="#fff"/>`);
cityArt(HATS, 'cilinder',
  `<path d="M56 46Q58 20 80 20Q102 20 104 46Z" fill="#5A4636"/><path d="M68 22q12 6 24 0" stroke="#45352A" stroke-width="3" fill="none"/>
   <rect x="56" y="38" width="48" height="7" fill="#2B2018"/><ellipse cx="80" cy="47" rx="38" ry="6" fill="#5A4636"/>`,
  `<ellipse cx="80" cy="50" rx="50" ry="10" fill="#1C1C22"/><path d="M62 49Q62 18 80 16Q98 18 98 49Z" fill="#1C1C22"/>
   <path d="M62 42h36" stroke="#C9CDD4" stroke-width="3"/><path d="M36 52q44 12 88 0" stroke="#C9CDD4" stroke-width="2" fill="none" stroke-dasharray="2 4"/>
   <circle cx="70" cy="30" r="2" fill="#C9CDD4"/><circle cx="90" cy="30" r="2" fill="#C9CDD4"/>`);

// ---------- Обувь ----------
cityArt(SHOES, 'tapki',
  `<ellipse cx="62" cy="227" rx="16" ry="6" fill="#141418"/><ellipse cx="98" cy="227" rx="16" ry="6" fill="#141418"/>
   <rect x="52" y="210" width="20" height="14" rx="5" fill="#F4F4F0"/><rect x="88" y="210" width="20" height="14" rx="5" fill="#F4F4F0"/>
   <rect x="50" y="218" width="24" height="6" rx="3" fill="#2A2A30"/><rect x="86" y="218" width="24" height="6" rx="3" fill="#2A2A30"/>`,
  `<ellipse cx="62" cy="227" rx="16" ry="6" fill="#8B5A2B"/><ellipse cx="98" cy="227" rx="16" ry="6" fill="#8B5A2B"/>
   <path d="M50 222l24-6M50 216l24 6M86 222l24-6M86 216l24 6" stroke="#5C3A1A" stroke-width="3"/>`);
cityArt(SHOES, 'base',
  `<rect x="44" y="214" width="34" height="15" rx="7" fill="#DDE1E8"/><rect x="82" y="214" width="34" height="15" rx="7" fill="#DDE1E8"/>
   <rect x="44" y="226" width="34" height="5" rx="2.5" fill="#F4F4F0"/><rect x="82" y="226" width="34" height="5" rx="2.5" fill="#F4F4F0"/>
   <path d="M50 218h8M58 222h8M88 218h8M96 222h8" stroke="#1E1E22" stroke-width="3"/>`,
  `<rect x="44" y="214" width="34" height="14" rx="7" fill="#E9DCC0"/><rect x="82" y="214" width="34" height="14" rx="7" fill="#E9DCC0"/>
   <rect x="44" y="225" width="34" height="6" rx="3" fill="#B8935A"/><rect x="82" y="225" width="34" height="6" rx="3" fill="#B8935A"/>
   <path d="M46 228h30M84 228h30" stroke="#8A6A3A" stroke-width="1.5" stroke-dasharray="2 2"/>`);
cityArt(SHOES, 'kedy',
  `<rect x="44" y="213" width="34" height="16" rx="8" fill="#F7F7F7"/><rect x="82" y="213" width="34" height="16" rx="8" fill="#F7F7F7"/>
   <rect x="44" y="225" width="34" height="6" rx="3" fill="#3A8DFF"/><rect x="82" y="225" width="34" height="6" rx="3" fill="#3A8DFF"/>
   <path d="M50 222q10 2 22-8M88 222q10 2 22-8" stroke="#141418" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  `<rect x="44" y="213" width="34" height="16" rx="8" fill="#1E8449"/><rect x="82" y="213" width="34" height="16" rx="8" fill="#1E8449"/>
   <rect x="44" y="225" width="34" height="6" rx="3" fill="#F4F0E6"/><rect x="82" y="225" width="34" height="6" rx="3" fill="#F4F0E6"/>
   <path d="M52 220l8-5 8 5M90 220l8-5 8 5" stroke="#C0392B" stroke-width="3" fill="none"/>`);
cityArt(SHOES, 'boots',
  `<path d="M50 206h26v20a5 5 0 0 1-5 5H44a6 6 0 0 1 0-12h6z" fill="#5A3A22"/><path d="M84 206h26v13h6a6 6 0 0 1 0 12H89a5 5 0 0 1-5-5z" fill="#5A3A22"/>
   <path d="M48 218h14M98 218h14" stroke="#C9A24E" stroke-width="2.5"/><circle cx="58" cy="222" r="2" fill="#C9A24E"/><circle cx="104" cy="222" r="2" fill="#C9A24E"/>`,
  `<path d="M50 186h26v40a5 5 0 0 1-5 5H42a6 6 0 0 1 0-12h8z" fill="#8B4A1E"/><path d="M84 186h26v33h8a6 6 0 0 1 0 12H89a5 5 0 0 1-5-5z" fill="#8B4A1E"/>
   <path d="M54 192q8 8 0 16M88 192q8 8 0 16" stroke="#F2C744" stroke-width="2" fill="none"/><rect x="64" y="228" width="8" height="4" fill="#3A1E0A"/><rect x="104" y="228" width="8" height="4" fill="#3A1E0A"/>`);

// ---------- Куртки, рубашки, костюмы ----------
cityArt(BODIES, 'rvan',
  { jacket: '#6E7280', pants: '#3A3F4A', shirt: '#B9BDC6', extra: `<path d="M70 98v16M90 98v16" stroke="#E9E9EE" stroke-width="2"/><rect x="62" y="140" width="36" height="14" rx="4" fill="#5E6270"/>` },
  { jacket: '#C0392B', pants: '#6E4A2A', shirt: '#F2C744', extra: `<path d="M44 100l72 0-6 62H50z" fill="#C0392B"/><path d="M46 116h68M47 130h66M48 144h64" stroke="#F2C744" stroke-width="5"/>
    <path d="M46 123h68M48 137h64" stroke="#1E8449" stroke-width="3"/><path d="M50 162l2 6M60 162l1 6M70 162v6M80 162v6M90 162v6M100 162l-1 6M110 162l-2 6" stroke="#F2C744" stroke-width="2"/>` });
cityArt(BODIES, 'telnyashka',
  { jacket: '#1E3A5F', pants: '#2C3442', shirt: '#1E3A5F', extra: `<text x="80" y="134" text-anchor="middle" font-size="13" font-weight="900" fill="#F4F4F0">МБАД</text>` },
  { jacket: '#F4F0E6', pants: '#C2A878', shirt: '#F4F0E6', extra: `<path d="M62 104v56M98 104v56M70 104v56M90 104v56" stroke="#DCD3C0" stroke-width="2"/><circle cx="80" cy="116" r="2" fill="#B8935A"/><circle cx="80" cy="132" r="2" fill="#B8935A"/><circle cx="80" cy="148" r="2" fill="#B8935A"/>` });
cityArt(BODIES, 'base',
  { jacket: '#E8E4DA', pants: '#C2A878', shirt: '#E8E4DA', extra: `<path d="M66 94l14 12 14-12" fill="none" stroke="#CFC8B8" stroke-width="5"/><rect x="58" y="112" width="10" height="9" rx="2" fill="#D6CFBF"/>` },
  { jacket: '#1ABC9C', pants: '#F4F0E6', shirt: '#1ABC9C', extra: `<circle cx="60" cy="116" r="5" fill="#E84393"/><circle cx="96" cy="124" r="5" fill="#F2C744"/><circle cx="72" cy="146" r="5" fill="#F2C744"/>
    <circle cx="100" cy="150" r="5" fill="#E84393"/><circle cx="84" cy="112" r="4" fill="#fff"/><path d="M66 94l14 12 14-12" fill="none" stroke="#16A085" stroke-width="5"/>` });
cityArt(BODIES, 'pukhovik',
  { jacket: '#2B2F3A', pants: '#2F3A4A', shirt: '#E9E1D3', extra: `<path d="M46 112q34 8 68 0M46 130q34 8 68 0M46 148q34 8 68 0" stroke="#1C2028" stroke-width="3" fill="none"/><rect x="50" y="88" width="60" height="16" rx="8" fill="#3A3F4C"/>` },
  { jacket: '#8E44AD', pants: '#3A2A1A', shirt: '#F39C12', extra: `<path d="M46 108h68M46 124h68M46 140h68M46 156h68" stroke="#F39C12" stroke-width="5"/><path d="M46 116h68M46 148h68" stroke="#1ABC9C" stroke-width="3"/>` });
cityArt(BODIES, 'malinovy',
  { jacket: '#5B2A86', pants: '#1E1E24', shirt: '#141418', extra: `<path d="M66 100l14 22 14-22" fill="none" stroke="#7A44A8" stroke-width="4"/><rect x="96" y="112" width="10" height="5" rx="1" fill="#C9A24E"/>` },
  { jacket: '#1C1C22', pants: '#1C1C22', shirt: '#F4F0E6', extra: `<path d="M70 98q10 10 20 0" fill="#B3122E"/><circle cx="62" cy="112" r="2.2" fill="#C9CDD4"/><circle cx="62" cy="124" r="2.2" fill="#C9CDD4"/>
    <circle cx="98" cy="112" r="2.2" fill="#C9CDD4"/><circle cx="98" cy="124" r="2.2" fill="#C9CDD4"/><path d="M50 140q30 10 60 0" stroke="#C9CDD4" stroke-width="2" fill="none" stroke-dasharray="3 3"/>` });
cityArt(BODIES, 'kostum',
  { jacket: '#3A4A5E', pants: '#3A4A5E', shirt: '#F7F7F7', extra: `<path d="M68 104h24v30H68z" fill="#2C394A"/><path d="M77 100h6l3 6-6 26-6-26z" fill="#7FB3E8"/><rect x="98" y="116" width="10" height="4" rx="1" fill="#F7F7F7"/>` },
  { jacket: '#F5F1E6', pants: '#F5F1E6', shirt: '#7FB3E8', extra: `<path d="M66 100l14 20 14-20" fill="none" stroke="#E2DCCB" stroke-width="4"/><rect x="96" y="114" width="10" height="5" rx="1" fill="#E84393"/>` });

// Перерисовать Валеру после смены города
MSK_RESKIN.push(() => { if (typeof renderedLook !== 'undefined') renderedLook = ''; });
MEX_RESKIN.push(() => { if (typeof renderedLook !== 'undefined') renderedLook = ''; });
