// Code-native art matches the existing 360 × 420 home scene and stays sharp on phones.
let FR_ART_SEQ=0;
function frTower(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="#b69668" stroke-width="3"><path d="M0 0L-25 118M0 0l25 118M-25 118q25-42 50 0M-17 78h34M-11 53h22M-5 24H5M-18 77L9 54M18 77L-9 54M-11 52L4 25M11 52L-4 25M-28 118h56M0-9V0"/></g>`;}
function frFacades(y=170){return [0,64,128,192,256,320].map((x,i)=>`<g><rect x="${x}" y="${y+i%2*10}" width="62" height="118" fill="${i%2?'#bcb0a5':'#ddd1b9'}"/><path d="M${x-4} ${y+i%2*10}l8-24h46l12 24z" fill="#434f68"/>${[0,1,2].map(r=>[0,1,2].map(c=>`<rect x="${x+8+c*18}" y="${y+14+r*30+i%2*10}" width="9" height="17" rx="3" fill="${(r+c+i)%3?'#777c89':'#f9d78b'}"/><path d="M${x+6+c*18} ${y+32+r*30+i%2*10}h14" stroke="#3f464e"/>`).join('')).join('')}</g>`).join('');}
function frPostcardSVG(){const id='frPost'+(++FR_ART_SEQ);return `<svg viewBox="0 0 600 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="#24344f"/><stop offset="1" stop-color="#bd9a91"/></linearGradient></defs><rect width="600" height="220" fill="url(#${id})"/><circle cx="350" cy="40" r="18" fill="#ead7b2"/>${frTower(464,12,1.4)}<g transform="translate(-14 0)">${frFacades(157)}</g><g transform="translate(520 0)">${frFacades(170)}</g><path d="M15 20l-5 15M115 5l-5 15M215 30l-5 15M315 5l-5 15M415 45l-5 15M525 20l-5 15M580 60l-5 15" stroke="#bfc9dd" opacity=".25"/><rect y="207" width="600" height="13" fill="#374f67"/></svg>`;}
function frEiffelHomeSVG(){
  const id='frEiffel'+(++FR_ART_SEQ);
  const braces=[[13,38,3,6],[38,58,6,10],[63,83,11,14],[83,104,14,19],[110,133,20,26],[133,157,26,33]];
  const windows=Array.from({length:7},(_,i)=>{const x=i*23-12,y=219+(i%3)*4;return `<g><path d="M${x} ${y}v-31l5-10h12l6 10v31" fill="${i%2?'#bfae98':'#d6c5aa'}"/><path d="M${x-2} ${y-31}l7-12h12l8 12z" fill="#384754"/>${[0,1].map(r=>[0,1].map(c=>`<path d="M${x+4+c*9} ${y-25+r*13}h4v8h-4z" fill="${(i+r+c)%3?'#4a5560':'#f7d99b'}"/>`).join('')).join('')}</g>`;}).join('');
  return `<svg class="fr-eiffel-scene" role="img" aria-label="Вечерняя набережная Сены с видом на освещённую Эйфелеву башню" viewBox="0 0 360 420" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#182d49"/><stop offset=".48" stop-color="#746983"/><stop offset="1" stop-color="#edb894"/></linearGradient>
      <linearGradient id="${id}-water" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#567787"/><stop offset="1" stop-color="#203e51"/></linearGradient>
      <linearGradient id="${id}-stone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c8b59c"/><stop offset="1" stop-color="#82776d"/></linearGradient>
      <linearGradient id="${id}-tower" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffdfa3"/><stop offset=".45" stop-color="#d9a55b"/><stop offset="1" stop-color="#9c693e"/></linearGradient>
      <radialGradient id="${id}-halo"><stop stop-color="#f9d69a" stop-opacity=".3"/><stop offset="1" stop-color="#f9d69a" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-lamp"><stop stop-color="#ffe7b3" stop-opacity=".7"/><stop offset="1" stop-color="#f7d080" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="360" height="420" fill="url(#${id}-sky)"/>
    <circle cx="107" cy="71" r="19" fill="#f3e3c7" opacity=".8"/><circle cx="114" cy="64" r="19" fill="#3d4662"/>
    <g fill="#f4dfb9" opacity=".7"><circle cx="177" cy="41" r=".9"/><circle cx="224" cy="27" r="1.1"/><circle cx="314" cy="63" r=".8"/><circle cx="145" cy="105" r=".8"/><circle cx="335" cy="109" r="1"/></g>
    <path d="M108 152q26-10 54-1m-15 21q22-7 45-1M20 126q25-8 43-2" stroke="#e0b3ad" stroke-width="7" opacity=".16" stroke-linecap="round" fill="none"/>
    <path d="M0 231l25-7 21 3 20-10 22 8 20-4 23 8 28-6 19 7 18-5 21 7 31-6 26 6 25-8 21 4 36-4 23 9v46H0z" fill="#626b77" opacity=".5"/>
    <g data-fr-detail="left-bank">${windows}<path d="M0 238h166v8H0z" fill="#596573"/><path d="M0 245h175" stroke="#d3b898" stroke-width="3"/></g>
    <ellipse cx="268" cy="158" rx="108" ry="142" fill="url(#${id}-halo)"/>
    <g data-fr-detail="eiffel-tower" transform="translate(270 64) scale(1.1 .9)" fill="none" stroke="url(#${id}-tower)" stroke-linejoin="round">
      <path d="M0-15V8M-3 8L-10 58-19 105-34 160-55 211M3 8L10 58 19 105 34 160 55 211" stroke-width="3.2"/>
      <path d="M-28 211Q-22 169 0 169Q22 169 28 211" stroke-width="3"/>
      ${braces.map(([a,b,x,y])=>`<path d="M${-x} ${a}L${y} ${b}M${x} ${a}L${-y} ${b}" stroke-width="1.1" opacity=".85"/>`).join('')}
      <path d="M-34 164l8 19-17 8 13 17M34 164l-8 19 17 8-13 17M-41 183l20 11M41 183l-20 11" stroke-width="1.4"/>
      <path d="M-5 14h10v9H-5zM-12 57h24v5h-24zM-23 103h46v6h-46zM-38 158h76v7h-76z" fill="#d5a164" stroke="#ffdda3" stroke-width="1"/>
      <path d="M-58 213h34M24 213h34" stroke-width="4"/>
      <g class="fr-eiffel-lights" fill="#fff0c4" stroke="none"><circle cx="0" cy="6" r="1.8"/><circle cx="-9" cy="58" r="1.5"/><circle cx="13" cy="83" r="1.2"/><circle cx="-21" cy="107" r="1.6"/><circle cx="22" cy="125" r="1.2"/><circle cx="-31" cy="159" r="1.6"/><circle cx="35" cy="163" r="1.4"/><circle cx="-43" cy="189" r="1.4"/><circle cx="47" cy="201" r="1.5"/></g>
    </g>
    <path d="M0 252Q130 245 360 256V333H0z" fill="url(#${id}-water)"/>
    <g class="fr-eiffel-reflection" data-fr-detail="seine" stroke="#e8ba76" stroke-linecap="round" opacity=".55"><path d="M265 267h12m-20 7h29m-26 8h23m-34 8h43m-39 8h29m-47 9h64" stroke-width="2"/></g>
    <g stroke="#b8c3c2" opacity=".22" stroke-linecap="round"><path d="M8 266h35m13 16h45m18-15h28M9 309h49m45-8h28m-7 17h53m-5-34h35m106-12h39M296 316h52"/></g>
    <g data-fr-detail="bridge"><path d="M70 248H360V266H333q-11-17-23 0h-26q-11-17-23 0h-27q-11-17-23 0h-26q-11-17-23 0h-27q-11-17-23 0H70z" fill="#a89888"/><path d="M70 248H360" stroke="#e1c7a7" stroke-width="4"/><path d="M71 241h289m-280 0v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6m17-6v6" stroke="#545659" stroke-width="1.2"/></g>
    <g data-fr-detail="riverboat" transform="translate(32 284)"><path d="M0 10h66l-9 10H13z" fill="#e4d6bd"/><path d="M14 0h38l6 10H8z" fill="#627b89"/><path d="M18 2h8v6h-8m12-6h8v6h-8m12-6h8v6h-8" fill="#ffe0a2"/><path d="M11 26h42m-45 5h27" stroke="#a6b4b7" opacity=".45"/></g>
    <path d="M0 328L360 306V420H0z" fill="#5e6469"/>
    <path d="M0 330L360 308M0 344L360 320M0 366l360-33M0 396l360-48M36 329L4 420m79-95-6 95m57-98 27 98m27-101 65 101m-12-105 92 105" stroke="#b9b1a3" stroke-width="1" opacity=".3"/>
    <path d="M0 308L360 288v19L0 332z" fill="url(#${id}-stone)"/><path d="M0 306L360 286v7L0 315z" fill="#dec9a7"/><path d="M0 329L360 306" stroke="#535c61" stroke-width="3"/><path d="M55 311v17m75-21v17m75-21v17m75-21v17" stroke="#817a71" opacity=".5"/>
    <ellipse cx="44" cy="354" rx="57" ry="24" fill="url(#${id}-lamp)"/>
    <g data-fr-detail="bench" transform="translate(18 335)"><ellipse cx="49" cy="54" rx="57" ry="7" fill="#29353d" opacity=".45"/><path d="M9 15v38m77-38v38" stroke="#263c3e" stroke-width="5"/><path d="M3 0h89v5H3zm0 9h89v5H3zm-7 14h103v7H-4z" fill="#ad825e" stroke="#5d4e43" stroke-width="1"/><path d="M6 1h80M6 10h80M1 25h90" stroke="#d0ac7e" opacity=".6"/><path d="M-3 21v-9h9m91 9v-9h-9" stroke="#304346" stroke-width="3" fill="none"/></g>
    <g data-fr-detail="belongings"><path d="M25 381q14-7 36 0l16 17H16z" fill="#496461" stroke="#2c4447"/><path d="M20 390l47 1M37 379l13 17" stroke="#82928a" opacity=".5"/><path d="M75 346l3-17 15-3 8 23z" fill="#bca17b"/><path d="M81 329l5-21q5-5 7 0l-4 20" fill="#dcba7b" stroke="#b19362"/><path d="M86 309l4 2m-6 4 5 2m-6 4 5 2" stroke="#f0d497"/><path d="M299 378h10l-2 13h-6z" fill="#decbb1"/><path d="M298 377h12" stroke="#806a59" stroke-width="2"/></g>
    <g data-fr-detail="lamp" stroke="#263f47" stroke-linecap="round"><path d="M42 350V191q0-12 11-12" fill="none" stroke-width="4"/><path d="M35 353h14" stroke-width="6"/><circle cx="55" cy="185" r="27" fill="url(#${id}-lamp)" stroke="none"/><path d="M47 177h16l-3 18H50z" fill="#f6d39a" stroke-width="2"/><path d="M44 177l11-8 11 8z" fill="#263f47" stroke-width="2"/><path d="M55 166v4" stroke-width="2"/></g>
    <g data-fr-detail="gaston" transform="translate(313 344)"><ellipse cx="0" cy="20" rx="13" ry="3" fill="#283b44" opacity=".4"/><path d="M-10 12q-3-10 7-12q9-4 13 5l-1 10q-12 5-19-3z" fill="#8c9b9e"/><path d="M-9 9q11-8 15 4q-7 5-13-1" fill="#526c78"/><path d="M4 1l-1 5" stroke="#79a59b" stroke-width="3"/><circle cx="8" cy="3" r="1.1" fill="#17272d"/><path d="M11 4l5 2-5 2" fill="#c7a36a"/><path d="M-1 16v4m5-4v4" stroke="#b9937d"/></g>
    <g data-fr-detail="trees" fill="#19343d"><path d="M0 0h52Q35 17 51 37Q23 53 43 75Q17 79 27 104Q6 111 11 139L0 150z"/><path d="M0 60q24-41 65-35Q39 7 17 0H0z"/><path d="M0 21q20 32 29 57M0 49q28-17 44-14" stroke="#2c4146" stroke-width="4" fill="none"/><path d="M360 0h-27q18 24-7 32q18 6 10 23q18-4 24 17z"/></g>
    <path d="M0 416q75-12 130 4H0zM360 391q-15 7-24 29h24" fill="#263e42"/>
  </svg>`;
}
function frSceneSVG(level){
  const h=Math.max(0,Math.min(6,level));
  if(h===0)return frEiffelHomeSVG();
  const id='frSky'+(++FR_ART_SEQ);
  const sky=`<defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="#28354f"/><stop offset="1" stop-color="#d9b5a1"/></linearGradient></defs><rect width="360" height="420" fill="url(#${id})"/><circle cx="62" cy="63" r="23" fill="#f8e4be" opacity=".8"/>${[35,92,158,202,310].map((x,i)=>`<circle cx="${x}" cy="${29+i%3*19}" r="1" fill="#ffeac9"/>`).join('')}${frTower(279,85,.85)}${frFacades(180)}`;
  const quay='<path d="M0 280q100-15 180 0t180 0v70H0z" fill="#43647d"/><path d="M0 303q90-12 180 0t180 0M0 321q90-12 180 0t180 0" stroke="#d6c4a1" opacity=".4" fill="none"/><rect y="345" width="360" height="75" fill="#8d827e"/>';
  let room='';
  if(h===1)room=quay+'<path d="M2 390l76-94 76 94z" fill="#47736c"/><path d="M78 296v94h50z" fill="#315450"/><path d="M78 329l-21 61h42z" fill="#182c39"/><text x="283" y="390" font-size="29">🥖</text>';
  if(h===2)room='<rect width="360" height="300" fill="#b88b77"/><rect x="125" y="69" width="110" height="160" rx="26" fill="#7d9fb4"/><path d="M180 69v160M125 148h110" stroke="#eddbbe" stroke-width="6"/><rect y="300" width="360" height="120" fill="#826859"/><path d="M10 174h97v157H10M10 244h97" stroke="#473a36" stroke-width="7" fill="none"/><rect x="15" y="177" width="88" height="29" fill="#d2bc93"/><rect x="15" y="252" width="88" height="29" fill="#728d90"/><text x="264" y="183" font-size="35">🧳</text>';
  if(h===3)room='<path d="M0 0h360v80L200 0 0 220z" fill="#776863"/><path d="M0 218L200 0l160 80v220H0" fill="#c1a58b"/><path d="M46 169l85-98 48 42-85 98z" fill="#7695ac" stroke="#e8d5b9" stroke-width="7"/><rect y="300" width="360" height="120" fill="#9f7a59"/><rect x="222" y="222" width="122" height="72" fill="#e1bca0"/><text x="260" y="209" font-size="28">☕</text>';
  if(h===4)room='<rect width="360" height="300" fill="#bca99c"/><rect x="21" y="60" width="100" height="207" rx="44" fill="#647b95"/><rect x="240" y="60" width="100" height="207" rx="44" fill="#647b95"/><path d="M72 61v206M290 61v206M21 169h100M240 169h100" stroke="#eedfc3" stroke-width="6"/><rect x="144" y="99" width="74" height="85" fill="#d9c599"/><text x="154" y="159" font-size="48">🎨</text><rect y="300" width="360" height="120" fill="#9d7e62"/><path d="M8 323l172 44 172-44M8 365l172 44 172-44" stroke="#b89673" fill="none"/>';
  if(h===5)room='<rect x="0" width="360" height="22" fill="#4b4c50"/><path d="M12 0v310M348 0v310M180 0v290M0 142h360" stroke="#373d49" stroke-width="9"/><rect y="300" width="360" height="120" fill="#b8a080"/><path d="M0 298h360" stroke="#d9c7a6" stroke-width="10"/><text x="34" y="274" font-size="42">🎷</text><text x="294" y="284" font-size="36">🪴</text>';
  if(h===6)room='<rect width="360" height="310" fill="#e8d7b6"/><path d="M22 295V90q52-84 104 0v205M234 295V90q52-84 104 0v205" fill="#62748f" stroke="#bea171" stroke-width="9"/><path d="M73 51v244M285 51v244" stroke="#ddc89c" stroke-width="5"/><path d="M178 0v55m-44 0q44 48 88 0" stroke="#cba55f" stroke-width="5" fill="none"/><text x="149" y="104" font-size="48">⚜</text><rect y="310" width="360" height="110" fill="#9f7758"/><path d="M0 366h360M90 310v110M270 310v110" stroke="#bd9972" stroke-width="2"/>';
  return `<svg viewBox="0 0 360 420" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${sky}${room}</svg>`;
}
sceneSVG=(function(orig){return level=>typeof isFrance==='function'&&isFrance()?frSceneSVG(level):orig(level);})(sceneSVG);
function frPetArt(kind){
  const bird=kind==='pigeon'||kind==='parrot',dog=kind==='dog',ferret=kind==='rat';
  const color=bird?(kind==='parrot'?'#f0e6cf':'#8b9bb0'):dog?'#b0a49c':ferret?'#9b795f':kind==='cat'?'#d2a475':'#a28c72';
  return `<svg viewBox="0 0 80 70"><ellipse cx="44" cy="49" rx="${ferret?25:19}" ry="${bird?15:13}" fill="${color}"/><path class="wag" d="M60 48q15-14 13 1" stroke="${color}" stroke-width="6" fill="none"/><circle cx="25" cy="36" r="${dog?15:12}" fill="${color}"/>${bird?'<path d="M13 37L2 41l13 3z" fill="#d6a163"/>':`<path d="M15 29L13 ${dog?6:16}l12 10M32 27l9-13-1 22" fill="${color}"/>`}<circle cx="20" cy="36" r="2" fill="#252a38"/><circle cx="29" cy="36" r="2" fill="#252a38"/><path d="M21 44q5 3 8-1" stroke="#403c3d" fill="none"/><path d="M30 59v7M53 59v7" stroke="${color}" stroke-width="5"/><path d="M12 23q14-14 28 0l-3 5H15z" fill="#344c6b"/><path d="M24 14l4-3" stroke="#344c6b" stroke-width="3"/><path d="M32 45l12 3-5 6-8-5" fill="#b14e61"/></svg>`;
}
