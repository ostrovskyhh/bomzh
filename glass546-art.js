// The same pane patterns appear on the workbench and in Valera's home.
function glassLampArt546(pattern) {
  if (pattern !== 'amber' && pattern !== 'wave') return '';
  const amber = pattern === 'amber';
  const frame = amber ? '#76503a' : '#315354';
  const ink = amber ? '#412f31' : '#273d45';
  const panes = amber ? `
    <path d="M28 36 47 31 66 37 77 51 75 72 60 87 39 89 22 77 17 58Z" fill="#efa444"/>
    <path d="m28 36 13 6-5 15-19 1Zm13 6 16-3 8 15-18 6Z" fill="#ffe387"/>
    <path d="m57 39 9-2 11 14-12 3ZM36 57l11 3-5 16-20 1Z" fill="#d97d39"/>
    <path d="m47 60 18-6 10 18-16-1Z" fill="#ffd56c"/>
    <path d="m42 76 17-5 1 16-21 2Z" fill="#ef9a39"/>
    <path d="m28 36 13 6 16-3 9-2m-25 5-5 15 11 3 18-6 12-3m-60 7 19-1-14 20 20-1 17-5 16 1M57 39l8 15-6 17-12-11-5 16-3 13m20-18 1 16" fill="none" stroke="#8b653d" stroke-width="1.9"/>
    <path d="m25 50 6-8m14 5 4-2" fill="none" stroke="#fff6c9" stroke-width="3"/>
    <path d="M17 58q5 15 12 22l11 9-7-1-13-10-5-16Z" fill="#965430" stroke="none" opacity=".62"/>
    <path d="M20 38q4-9 13-12l13-7 17 10 8 8-5 4-12-6-16 2-11 5Z" fill="#a87847"/>
    <path d="m23 36 15-5 15-2 13 7m-22-12 2 5m8-2 6 5" fill="none" stroke="#e2ba74" stroke-width="2.6"/>
    <path d="m26 82 12 6 20-1 12-8-4 11-11 5-16 1-11-5Z" fill="${frame}"/>
    <path d="m39 97 4 6 10-1 3-7" fill="#92643c"/>
  ` : `
    <path d="m25 31 41-1 4 48-10 10-25-1-13-11Z" fill="#5baea9"/>
    <path d="m26 32 12 3-2 51-14-10Z" fill="#468297"/>
    <path d="m38 35 20-1 2 52-24 1Z" fill="#8ed7c4"/>
    <path d="m58 34 8-4 4 48-10 10Z" fill="#4c8896"/>
    <path d="M24 57q9 6 19-7t24-8l1 11q-9-3-20 9t-24 7Z" fill="#e4edbd" stroke="#397d85" stroke-width="2"/>
    <path d="M25 71q9 5 21-6t22-9v10q-10 1-19 11t-22 6Z" fill="#4f99a8" stroke="none"/>
    <path d="m38 35-2 51m22-52 2 52" fill="none" stroke="#477e78" stroke-width="2.2"/>
    <path d="m43 40-.5 6m-12-4-.7 9" fill="none" stroke="#f0f7cf" stroke-width="2.7"/>
    <path d="m19 31 8-7 12-3 8-9 10 9 12 3 6 7-8 4-10-3-18 3-12-3-7 2Z" fill="#527e76"/>
    <path d="m28 27 12-2 7-7m8 7 9 3" fill="none" stroke="#b6c88b" stroke-width="2.6"/>
    <path d="m22 76 14 8 23 1 11-9-3 13-9 4-20 1-13-7Z" fill="${frame}"/>
    <path d="m35 94 10 10 7-1 7-10" fill="#487177"/>
    <path d="m44 96 3 4" stroke="#e9c981" stroke-width="2.8"/>
  `;
  return `<svg aria-hidden="true" focusable="false" class="glass546-lamp-art" data-pattern="${pattern}" viewBox="0 0 96 110">
    <g stroke="${ink}" stroke-width="3.1" stroke-linejoin="round" stroke-linecap="round">
      <path d="${amber ? 'M36 26c-9-23 22-28 22 0' : 'M39 22c-8-24 21-24 17 0'}" fill="none"/>
      <g class="glass546-panes">${panes}</g>
    </g></svg>`;
}

function glassFurnace546() {
  return `<g stroke="#453831" stroke-linejoin="round" stroke-linecap="round">
    <path d="m48 57 2-31 9-5V7l18-1 1 23-8 4 1 25" fill="#56605b" stroke-width="3"/>
    <path d="m54 29 13-2m-11-7 19-1m-20-9 17-1" fill="none" stroke="#94a298" stroke-width="3"/>
    <path d="M18 122v-27q0-41 38-49 32-6 58 18 16 15 17 49l-4 14-99 3Z" fill="#be7653" stroke-width="3"/>
    <path d="M19 93q7-33 37-43 22-8 45 6l8 7q-25-13-48-6-27 7-42 36Z" fill="#e4a875" stroke="none"/>
    <path d="m107 60 13 13 8 26 2 21-5 7-23-1q8-22 5-41Z" fill="#925e49" stroke="none"/>
    <path d="m31 72 14 1 3-11m37-12 1 9 14 1m10 16 14 1m-17 12 17 1m-12 14 15-1M19 99l14 1m-9-16 13 2m63 28 22 1m-88 5 8 1" fill="none" stroke="#945f4a" stroke-width="2"/>
    <path d="M34 119q-1-13 2-24 4-23 23-29 23-9 40 12 9 12 8 36l-4 8Z" fill="#d9a075" stroke-width="2.3"/>
    <path d="M44 115q-1-31 17-41 24-12 34 15 4 9 3 24Z" fill="#563b38" stroke-width="2.8"/>
    <path d="M49 109q0-24 12-30 18-13 29 10l3 20Z" fill="#84604a" stroke="none"/>
    <g class="glass546-fire" stroke="none">
      <path d="M47 114q-1-16 8-22-1 8 4 9-3-17 11-27-1 13 7 16 3-7 2-13 14 11 16 36Z" fill="#f4a14d"/>
      <path d="M56 112q-1-10 6-16 0 6 4 7 7-6 6-14 9 8 8 14l4-6 7 15Z" fill="#ffde81"/>
      <path d="M63 113q0-6 6-9l3 4 4-6q5 4 5 10Z" fill="#fff4bd"/>
    </g>
    <path d="m36 115 64-2 8 5-2 5-71 2-6-5Z" fill="#6d6354" stroke-width="2.7"/>
    <path d="m34 119 67-2" fill="none" stroke="#c99e69" stroke-width="2.2"/>
    <path d="m21 125 107-3 3 6-5 5-104 2-7-5Z" fill="#7f6453" stroke-width="2.5"/>
    <path d="m28 127 21 1m56-3 14-1" fill="none" stroke="#b79773" stroke-width="2"/>
  </g>`;
}

function glassForgeArt546(pattern) {
  return `<span class="glass546-forge-art" aria-hidden="true">
    <svg class="glass546-blowpipe" viewBox="0 0 124 76" focusable="false">
      <path d="m7 59 57-19" stroke="#4d4942" stroke-width="5" stroke-linecap="round"/>
      <path d="m8 58 48-15" stroke="#acb6a2" stroke-width="2" stroke-linecap="round"/>
      <path d="m13 58 13-4" stroke="#b68b61" stroke-width="5" stroke-linecap="round"/>
      <g class="glass546-hot-glass">
        <path d="M60 38q4-1 6-5 4-11 17-10 10 0 13 9 3 13-9 17-9 3-16-3-5-4-10-3Z" fill="#f4ae59" stroke="#ad613c" stroke-width="2"/>
        <path d="M75 30q6-7 13-3" fill="none" stroke="#fff4ab" stroke-width="3" stroke-linecap="round"/>
      </g>
    </svg>${glassLampArt546(pattern)}</span>`;
}

function glassRack546(mode, produced, capacity) {
  const tall = mode === 'rack';
  const shelfLevels = tall ? [52, 83, 113] : [83, 113];
  const slots = shelfLevels.length * 6;
  // The drawing represents shelf occupancy. The workbench separately shows the exact count.
  const filled = Math.min(slots, Math.ceil(Math.max(0, produced) * slots / capacity));
  const rackTop = tall ? 25 : 56;
  let shelves = '';
  let plates = '';
  shelfLevels.forEach((level, row) => {
    shelves += `<path d="m0 ${level} 105-2 5 5-2 3-108 2Z" fill="#a66c48" stroke="#574236" stroke-width="2.1"/>
      <path d="m4 ${level+2} 96-1" fill="none" stroke="#dfb782" stroke-width="1.8"/>`;
    for (let col = 0; col < 6; col++) {
      if ((shelfLevels.length - 1 - row) * 6 + col >= filled) continue;
      const x = 7 + col * 15;
      plates += `<g transform="translate(${x} ${level-3})" stroke-linejoin="round">
        <path d="m0 0 2-16 11-4 3 1-1 17-12 4Z" fill="${col%3===1 ? '#acdcd2' : '#80c1af'}" stroke="#355c58" stroke-width="1.6"/>
        <path d="m4-3 2-10 5-2" fill="none" stroke="#e2f3db" stroke-width="1.5"/>
      </g>`;
    }
  });
  return `<g transform="translate(268 0)" stroke-linejoin="round">
    <path d="M6 126V${rackTop}l6-2v${126-rackTop}Zm93-2V${rackTop-2}l6-1v${126-rackTop}Z" fill="#946d50" stroke="#59493c" stroke-width="2"/>
    <path d="m11 ${rackTop+1} 90-1" fill="none" stroke="#96775c" stroke-width="4"/>${shelves}${plates}
    <path d="M2 129V${rackTop+1}l5-2V128Zm105-2V${rackTop-1}l5-1V126Z" fill="#bf9163" stroke="#5c4c3e" stroke-width="2"/>
  </g>`;
}

function glassWorkshopArt546({module, produced = 0, capacity, active = false} = {}) {
  const rack = module === 'rack';
  const limit = capacity || (rack ? 40 : 12);
  return `<svg class="glass546-workshop-art" aria-hidden="true" focusable="false" viewBox="0 0 400 152"
      data-working="${active && produced < limit}" data-module="${rack ? 'rack' : 'kiln'}">
    <path fill="#c9bf9a" d="M0 0h400v152H0z"/>
    <path d="M0 0h400v10L0 48Z" fill="#b1ad94"/>
    <path d="m0 110 400-5v47H0Z" fill="#bc9874"/>
    <path d="m0 133 400-13m-400 28 400-16m-268-24-29 44m108-46-3 46m92-47 39 47" fill="none" stroke="#a8896e" stroke-width="1.6"/>
    <g stroke="#817b65" stroke-width="2" stroke-linecap="round">
      <path d="m0 17 139-9 0 6L0 25Zm382-17-5 103 9 1 6-104" fill="#a78b69"/>
      <path d="m136 13 0 88 7-1-1-89" fill="#a78b69"/>
    </g>
    <g stroke-linejoin="round">
      <path d="m153 20 60-5v47l-60 3Z" fill="#81968b" stroke="#756e5b" stroke-width="3"/>
      <path d="m157 23 52-4v38l-52 5Z" fill="#a4cabb"/>
      <path d="m157 49 20-19 6 2-25 24Zm27 4 22-24v8l-19 20-8 1Z" fill="#cde2cf"/>
      <path d="m181 20 1 39m-26-16 53-4" stroke="#797e6c" stroke-width="2.5"/>
      <path d="m149 64 68-6v6l-67 5Z" fill="#a17d5f" stroke="#736653" stroke-width="2"/>
    </g>
    <g stroke="#82775f" fill="none" stroke-width="2" stroke-linecap="round">
      <path d="m7 47 16-2m-8-6v7M101 35l19-1m-9-6 1 6m109-9 21-1m-12 1v5m78-18 23-1m-8-5v5m36 29 17-2"/>
      <path d="m221 48 31-1m-26 2-3 19q-1 5 3 5l3-1 3-22m9 0-1 13 4 5 4-5 0-15"/>
    </g>
    <ellipse cx="211" cy="130" rx="177" ry="10" fill="#90775e" opacity=".38"/>
    ${rack ? '' : `<g transform="translate(132 34) scale(.69)">${glassFurnace546()}</g>`}
    ${glassFurnace546()}
    ${glassRack546(module, produced, limit)}
    <g stroke="#493a38" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M202 97q2-10 14-16l17-1q13 4 16 16l3 33-41 2-2-18-10-2Z" fill="#b47a4f"/>
      <path d="m217 83 2 9 12-1 4-10 4 2-2 15 5 31-29 1 1-36-2-8Z" fill="#59766d"/>
      <path d="m220 110 14-1-1 9-12 2Z" fill="#688578"/>
      <path d="m207 94-8 4-13-4-3 6 14 6q5 2 10-1l8-6" fill="#c99162"/>
      <g transform="translate(260 41) scale(-.42 .42)" stroke-width="3">${courtyardFace544(S.eq, 'happy', false)}</g>
      <path d="m184 96 52-17" stroke="#494d46" stroke-width="2.8"/>
      <path d="m177 95 8-1 6 2-2 5-12 4q-7-1-6-5Z" fill="${active ? '#ed9a48' : '#89bdad'}" stroke="#826846"/>
      <path d="m175 99 6-2" stroke="#ffebac" stroke-width="2.2"/>
      <path d="m209 91 6-4q4 0 5 3t-3 5l-5 1Z" fill="#eeb180"/>
    </g>
    <g stroke="#584938" stroke-linejoin="round" stroke-linecap="round">
      <path d="m142 105 74-3 14 5-1 5-89 4-4-6Z" fill="#af855c" stroke-width="2.6"/>
      <path d="m146 115-2 22 6-1 3-22m65-3 3 20 5 1-1-21" fill="#8b6c50" stroke-width="2"/>
      <path d="m141 109 81-3" stroke="#dfbe89" stroke-width="2"/>
      <path d="m150 104 46-8m-9 5 18 1 8-3" fill="none" stroke="#626860" stroke-width="2.6"/>
      <path d="m159 102 14-3" stroke="#bca87c" stroke-width="3.5"/>
      <path d="m232 116 24-5 13 7-3 18-24 4-11-8Z" fill="#bc8757" stroke-width="2.5"/>
      <path d="m233 116 11 7 23-5m-23 6-2 14" fill="none" stroke-width="2"/>
      <path d="m239 116 3-10 7 4 3-9 7 8-3 8-10 3Z" fill="#8fc0a8" stroke="#547568" stroke-width="1.6"/>
    </g>
  </svg>`;
}

function glassHomeLamp546() {
  if (currentScreen !== 'game') return;
  let stand = $('glass546HomeLamp');
  if (!S.glass546 && !stand) return;
  const pattern = glass546View().equipped;
  if (pattern !== 'amber' && pattern !== 'wave') {
    stand?.remove();
    return;
  }
  if (!stand) {
    stand = document.createElement('div');
    stand.id = 'glass546HomeLamp';
    stand.setAttribute('aria-hidden', 'true');
    $('valera').before(stand);
  }
  if (stand.dataset.pattern === pattern) return;
  stand.dataset.pattern = pattern;
  stand.innerHTML = `<svg aria-hidden="true" focusable="false" class="glass546-stand" viewBox="0 0 86 120">
    <ellipse cx="62" cy="111" rx="22" ry="4" fill="#4b4139" opacity=".42"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="m67 104-1-82q-1-17-14-16-15 2-16 17" stroke="#403b34" stroke-width="6"/>
      <path d="m67 99-2-78q-1-14-13-13-8 1-12 6" stroke="#b99d70" stroke-width="2.1"/>
      <path d="m50 108 5-5 11-3 9 3 4 6-12 3Z" fill="#86765d" stroke="#49463b" stroke-width="2.5"/>
    </g></svg>${glassLampArt546(pattern)}`;
}

HOOKS.hud.push(glassHomeLamp546);
