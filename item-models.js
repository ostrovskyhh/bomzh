// Procedural solid meshes. No emoji planes: each family has its own silhouette and details.
const ItemModels = (() => {
  function kind(it) {
    const n = String(it.name || '').toLowerCase(), e = it.e || '';
    const rules = [
      ['toothbrush', /зубная щ/, ''], ['pen', /ручка.*монблан/, '🖋️'], ['club', /клюшка/, '⛳'],
      ['ribbon', /ленточк/, '🎗️'], ['orb', /янтарный шар|калебас/, '🔮'], ['candy', /карамель|конфет/, '🍬'],
      ['paperroll', /туалетная бумага/, '🧻'], ['cart', /тележка/, '🛒'], ['bottle', /одеколон|гель для|от комаров/, ''],
      ['plaster', /пластырь/, ''], ['siren', /мигалк/, ''], ['welder', /сварочный/, ''], ['still', /самогонный/, ''],
      ['mouse', /мышка/, '🖱️'], ['vacuum', /робот-пылесос/, ''], ['maracas', /маракас/, '🪇'],
      ['mask', /маска лучадора/, ''], ['banknotes', /пачка.*песо/, ''], ['watergun', /водяной пистолет/, ''],
      ['cigar', /сигар/, ''], ['cards', /колода|золотым тузом/, '🃏🎴'], ['lock', /сейфовый замок/, '🔐'],
      ['bag', /кейс.*хранение/, ''], ['house', /гасиенда/, ''], ['spoon', /ложка/, '🥄'], ['sponge', /губка/, '🧽'],
      ['pins', /булавок/, '🧷'], ['binoculars', /бинокль/, '🔭'], ['arcade', /игровой автомат/, '🎰'],
      ['glitter', /блёстк/, '💫'], ['microphone', /микрофон/, '🎤🎙️'],
      ['horse', /коня|конь/, '🐎'], ['bird', /павлин|орёл|орла/, '🦚🦅'], ['doll', /матрёшк/, '🪆'], ['dragon', /дракон/, '🐉'],
      ['key', /ключ|отмыч/, '🔑🗝️🚘'], ['crown', /корон/, '👑🫅'],
      ['diamond', /бриллиант|алмаз|кристалл/, '💎'], ['goldbar', /слиток/, '🟡'],
      ['ring', /кольц|ошейник/, '💍🐾'], ['necklace', /колье|бус|цепоч/, '📿'],
      ['medal', /медаль|орден|кубок/, '🥇🏅🎖️🏆'], ['coin', /монет/, '🪙'],
      ['laptop', /ноутбук/, '💻'], ['phone', /айфон|смартфон|телефон/, '📱'],
      ['headphones', /наушник|капельк/, '🎧'], ['camera', /полароид|фотоаппарат|камер/, '📸📷'],
      ['television', /телевизор|монитор/, '📺🖥️'], ['console', /приставк|тетрис|пейджер|калькулятор/, '🎮🕹️📟🧮'],
      ['radio', /магнитофон|радио|колонк/, '📻🎙️🔊'], ['watch', /часы|секундомер/, '⌚⏱️🕰️'],
      ['flashlight', /фонар/, '🔦'], ['drone', /дрон|вертолёт|спутник/, '🛸🚁🛰️'],
      ['record', /кассет|диск|диафильм/, '📼💿📀🎞️'], ['battery', /батаре|аккумулятор/, '🔋🪫'],
      ['keyboard', /клавиатур/, '⌨️'], ['chip', /процессор|чип|микросхем/, '🧠🧬'],
      ['glasses', /очки/, '🕶️🥽'], ['shoe', /сапог|ботинок|кроссов|кед/, '🥾👞👟'],
      ['hat', /кепк|панам|шляп|цилиндр|шапк/, '🧢👒🎩'], ['pants', /треник|брюк|шорт|штаны/, '🩳'],
      ['shirt', /дублёнк|кожанк|куртк|рубашк|футболк|майк|халат/, '🧥👕🎽🥋'],
      ['scarf', /шарф|носк|перчатк/, '🧣🧦🧤'], ['bag', /барсетк|чемодан|рюкзак|шоппер|сумк/, '👝🧳🎒🛍️'],
      ['extinguisher', /огнетушител/, '🧯'], ['bucket', /ведро/, '🪣'], ['ladder', /лестниц/, '🪜'],
      ['compass', /компас|эхолот/, '🧭📡'], ['rod', /спиннинг|леск|удочк|блесн|подсачек/, '🎣🪝🧵'],
      ['sword', /сабл|меч|нож/, '🗡️'], ['tool', /отвёртк|ключ гаеч|болт|молот|пила|струбцин/, '🔧🪛🔩🪚🗜️⚙️'],
      ['rope', /канат|верёвк|удлинител|шнур/, '🪢🔌'], ['bell', /колокол|звонок/, '🔔🛎️'],
      ['guitar', /гитар|скрипк/, '🎸🎻'], ['barbell', /гантел|штанг/, '🏋️'],
      ['dice', /кости|кубик/, '🎲'], ['ball', /мяч|бильярд/, '🏐🎱🏓'],
      ['plane', /самолёт/, '🛩️'], ['bike', /велосипед|бромптон|мопед|мотоцикл/, '🚲🚴🛵🏍️'],
      ['scooter', /самокат/, '🛴'], ['boat', /лодк|яхт/, '🛶🛥️'], ['car', /машин|автомобил/, '🚗🏎️🚙'],
      ['skateboard', /скейт/, '🛹'], ['wheel', /колес|шин/, '🛞'],
      ['document', /документ|расписк|пропуск|карт|билет|чек|акци|конверт|абонемент/, '📜🪪🧾📰🎫🎟️💳🧧🅿️🗺️'],
      ['frame', /картина|подлинник|nft|зеркал|акварел/, '🖼️🌲🎨🪞'], ['book', /книг|подшивк/, '📚'],
      ['plant', /монстер|горшк|растени/, '🪴'], ['vase', /ваза|урна|котелок/, '🏺⚱️🫖'],
      ['lamp', /ламп|свеч/, '🪔🕯️'], ['chair', /стул|стульчик/, '🪑'], ['sofa', /диван/, '🛋️'],
      ['tent', /палатк/, '⛺'], ['fish', /рыб|вобла|сом|рак-|лобстер/, '🐟🐠🐋🦞🦐🦀'],
      ['bottle', /вино|кристалл|термос|фляг|кефир|молок|смузи/, '🍷🍾🥃🥛🧃'],
      ['cup', /кофе|раф|бабл|чай|бокал|коктейл/, '☕🧋🍵🥂🍹🥤'],
      ['can', /банка|тушёнк|черв|огурц|мотыл|мёд/, '🥫🫙🍯'],
      ['egg', /яйц/, '🥚'], ['cake', /торт|пудинг/, '🎂🍮'], ['chocolate', /шоколад|масл|трюфел/, '🍫🧈'],
      ['bread', /батон|хлеб|тост|круассан|печенье/, '🍞🥐🍪🥑'],
      ['fruit', /авокад|лук|банан|арбуз|перец/, '🥑🧅🍌🍉🌶️'], ['food', /куриц|мясо|сыр|боул|буррито|тако/, '🍗🥩🧀🥗🌯🌮'],
      ['animal', /мишка|мишк|чебурашк|матрёшк|дракон|конь|павлин|лев|ягуар|пиньят/, '🧸🪆🐉🐎🦚🦁🐆🦅🪅'],
      ['statue', /стату|идол|фигурк|череп|остров|макет/, '🗽🗿💀🏝️🏙️🌞'],
    ];
    if (/гаеч/.test(n)) return 'tool';
    for (const [id, re, icons] of rules) if (re.test(n) || (e && icons.includes(e))) return id;
    return 'parcel';
  }
  function build(it) {
    const T = THREE, root = new T.Group();
    let seed = 2166136261;
    for (const ch of `${it.key || it.name}:${it.pat || 0}`) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const wear = typeof it.fl === 'number' ? Math.max(0, Math.min(1, it.fl)) : 0.12;
    const golden = /золот|позолоч|фаберже|корон/i.test(it.name || '') || it.e === '🟡';
    const green = /нефрит|малахит/i.test(it.name || '');
    const hue = rnd();
    const base = new T.Color().setHSL(hue, 0.32, 0.32);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const cx = canvas.getContext('2d'); cx.fillStyle = '#f5f3ed'; cx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 220; i++) { cx.fillStyle = `rgba(55,40,28,${wear * rnd() * 0.13})`; cx.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 3, 1 + rnd() * 2); }
    for (let i = 0; i < wear * 22; i++) { cx.strokeStyle = `rgba(75,58,37,${0.08 + wear * 0.25})`; cx.lineWidth = 0.5 + rnd(); cx.beginPath(); const x = rnd() * 128, y = rnd() * 128; cx.moveTo(x, y); cx.lineTo(x + rnd() * 24, y + rnd() * 8); cx.stroke(); }
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const mat = (color, metal = 0, rough = 0.55, detail = true) => new T.MeshStandardMaterial({ color,
      metalness: metal, roughness: Math.min(1, rough + wear * 0.25), map: detail ? texture : null });
    const m = { body: mat(green ? '#388f78' : golden ? '#e8b33e' : base),
      dark: mat('#20252e', 0.12, 0.6), black: mat('#101720', 0.2, 0.4),
      metal: mat('#b8c6d5', 0.83, 0.25), gold: mat('#eab840', 0.86, 0.23),
      white: mat('#e8e3d8', 0, 0.5), cloth: mat(base, 0, 0.95),
      red: mat('#b84238', 0.1, 0.65), wood: mat('#8a5330', 0, 0.72),
      green: mat('#3a8962', 0, 0.65), blue: mat('#378bc2', 0.2, 0.35),
      skin: mat('#d1a16e', 0, 0.8), rubber: mat('#25282b', 0, 0.95),
      glass: new T.MeshStandardMaterial({ color: '#93cadd', metalness: 0.3, roughness: 0.12, transparent: true, opacity: 0.72 }),
    };
    const add = (geo, material, x = 0, y = 0, z = 0, rotation = null) => {
      const mesh = new T.Mesh(geo, material); mesh.position.set(x, y, z);
      if (rotation) mesh.rotation.set(...rotation);
      mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
    };
    const box = (w, h, d, material, x = 0, y = 0, z = 0, r = 0.04) => {
      const a = Math.min(r, w / 3, h / 3, d / 3), shape = new T.Shape();
      shape.moveTo(-w / 2 + a, -h / 2); shape.lineTo(w / 2 - a, -h / 2);
      shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + a); shape.lineTo(w / 2, h / 2 - a);
      shape.quadraticCurveTo(w / 2, h / 2, w / 2 - a, h / 2); shape.lineTo(-w / 2 + a, h / 2);
      shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - a); shape.lineTo(-w / 2, -h / 2 + a);
      shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + a, -h / 2);
      const geo = new T.ExtrudeGeometry(shape, { depth: Math.max(0.002, d - a), bevelEnabled: a > 0, bevelSegments: 2, steps: 1, bevelSize: a / 2, bevelThickness: a / 2, curveSegments: 5 });
      geo.translate(0, 0, -(d - a) / 2); return add(geo, material, x, y, z);
    };
    const sphere = (r, material, x = 0, y = 0, z = 0, scale = [1, 1, 1]) => { const s = add(new T.SphereGeometry(r, 24, 16), material, x, y, z); s.scale.set(...scale); return s; };
    const cyl = (r1, r2, h, material, x = 0, y = 0, z = 0, rot = null, sides = 32) => add(new T.CylinderGeometry(r1, r2, h, sides), material, x, y, z, rot);
    const ring = (r, tube, material, x = 0, y = 0, z = 0, rot = null, arc = Math.PI * 2) => add(new T.TorusGeometry(r, tube, 10, 40, arc), material, x, y, z, rot);
    const tube = (points, radius, material) => add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map((p) => new T.Vector3(...p))), 24, radius, 8, false), material);
    const shape = (points, depth, material, x = 0, y = 0, z = 0) => {
      const s = new T.Shape(points.map((p) => new T.Vector2(...p)));
      const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, steps: 1 });
      g.translate(0, 0, -depth / 2); return add(g, material, x, y, z);
    };
    const label = (text, w, h, x, y, z, color = '#e4d9b7', bg = '#203344') => {
      const c = document.createElement('canvas'); c.width = 512; c.height = Math.max(128, Math.min(1024, Math.round(512 * h / w)));
      const p = c.getContext('2d'); p.fillStyle = bg; p.fillRect(0, 0, c.width, c.height);
      p.fillStyle = color; p.textAlign = 'center'; p.font = 'bold 46px sans-serif'; p.fillText(text, 256, c.height * (text === '09:41' ? 0.25 : 0.57), 470);
      if(text==='09:41')for(let row=0;row<3;row++)for(let col=0;col<3;col++){p.fillStyle=['#4d9fbe','#ce8957','#699d74','#8580b6'][(row+col)%4];p.fillRect(62+col*140,c.height*0.48+row*130,100,100);}
      const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
      return add(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, roughness: 0.75, side: T.DoubleSide }), x, y, z);
    };
    const wheel = (x, y, z, r = 0.35) => { ring(r, r * 0.16, m.rubber, x, y, z); cyl(r * 0.16, r * 0.16, 0.07, m.metal, x, y, z, [Math.PI / 2, 0, 0]); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5; tube([[x, y, z], [x + Math.cos(a) * r * 0.83, y + Math.sin(a) * r * 0.83, z]], 0.01, m.metal); } };
    const type = kind(it), metal = golden ? m.gold : m.metal;
    switch (type) {
      case 'toothbrush': box(0.16,1.65,0.12,m.blue,0,-0.15);box(0.27,0.54,0.13,m.white,0,0.9);for(let x=0;x<3;x++)for(let y=0;y<6;y++)box(0.04,0.04,0.12,m.white,-0.08+x*0.08,0.69+y*0.08,0.13);break;
      case 'pen': cyl(0.075,0.075,1.8,m.black);cyl(0.09,0.09,0.22,m.gold,0,0.55);add(new T.ConeGeometry(0.07,0.3,16),m.gold,0,-1.05,0,[Math.PI,0,0]);tube([[0.1,0.82,0],[0.1,0.25,0]],0.018,m.gold);break;
      case 'club': cyl(0.025,0.025,2.3,m.metal);cyl(0.05,0.05,0.65,m.dark,0,0.85);box(0.48,0.19,0.23,m.metal,0.18,-1.13);break;
      case 'ribbon': ring(0.45,0.09,m.gold,-0.4,0.25,0);ring(0.45,0.09,m.gold,0.4,0.25,0);box(0.18,0.95,0.04,m.gold,-0.22,-0.53).rotation.z=-0.25;box(0.18,0.95,0.04,m.gold,0.22,-0.53).rotation.z=0.25;sphere(0.16,m.gold,0,0.2,0);break;
      case 'orb': cyl(0.44,0.55,0.2,m.gold,0,-0.86);sphere(0.72,m.glass,0,0,0);ring(0.5,0.045,m.gold,0,-0.53,0,[Math.PI/2,0,0]);break;
      case 'candy': box(1.1,0.6,0.55,m.red);for(const s of [-1,1])add(new T.ConeGeometry(0.35,0.5,6),m.gold,s*0.85,0,0,[0,0,s*Math.PI/2]);break;
      case 'paperroll': cyl(0.67,0.67,0.95,m.white);cyl(0.23,0.23,0.015,m.wood,0,0.49);cyl(0.16,0.16,0.02,m.dark,0,0.502);box(0.7,0.8,0.025,m.white,0,-0.4,0.66);break;
      case 'cart':
        box(1.5,0.12,0.8,m.metal,0,-0.35);for(const z of [-0.42,0.42])for(let i=0;i<7;i++)tube([[-0.7+i*0.23,-0.3,z],[-0.7+i*0.23,0.55,z]],0.018,m.metal);for(const y of [-0.25,0,0.25,0.5])for(const z of [-0.42,0.42])tube([[-0.7,y,z],[0.7,y,z]],0.018,m.metal);tube([[0.7,-0.4,-0.4],[0.9,0.8,-0.4],[0.9,0.8,0.4],[0.7,-0.4,0.4]],0.035,m.red);for(const x of [-0.5,0.6])for(const z of [-0.4,0.4])wheel(x,-0.65,z,0.14);break;
      case 'plaster': box(0.6,1.75,0.04,m.skin,0,0,0,0.1);box(0.43,0.45,0.03,m.white,0,0,0.04);for(let i=0;i<5;i++)for(const s of [-1,1])sphere(0.025,m.wood,-0.18+(i%3)*0.18,s*(0.4+Math.floor(i/3)*0.2),0.04,[1,1,0.15]);break;
      case 'siren': cyl(0.7,0.7,0.2,m.dark,0,-0.5);sphere(0.64,m.red,0,-0.08,0,[1,0.9,1]);cyl(0.12,0.12,0.55,m.gold,0,-0.05);break;
      case 'welder': box(1.5,1.0,0.8,m.red);tube([[-0.4,0.54,0],[-0.4,0.8,0],[0.4,0.8,0],[0.4,0.54,0]],0.06,m.dark);for(let i=0;i<5;i++)box(0.8,0.03,0.03,m.dark,0,-0.25+i*0.12,0.42);tube([[0.6,-0.3,0.4],[1,-0.7,0.7],[0.3,-0.9,0.8],[-0.3,-0.7,0.8]],0.045,m.rubber);break;
      case 'still': cyl(0.6,0.6,1.0,m.gold,0,-0.2);sphere(0.6,m.gold,0,0.3,0,[1,0.4,1]);tube([[0,0.54,0],[0,1.1,0],[0.9,1.1,0],[0.9,-0.2,0]],0.045,m.gold);cyl(0.24,0.24,0.65,m.metal,0.9,-0.55);break;
      case 'mouse': sphere(0.7,m.dark,0,0,0,[0.8,0.4,1.3]);tube([[0,0.29,-0.05],[0,0.29,0.55]],0.012,m.metal);cyl(0.07,0.07,0.16,m.rubber,0,0.31,0.24,[Math.PI/2,0,0]);tube([[0,0,-0.9],[0,0.05,-1.4],[0.5,0.05,-1.65]],0.018,m.rubber);break;
      case 'vacuum': cyl(0.9,0.9,0.3,m.white);cyl(0.23,0.23,0.12,m.red,0,0.2,-0.2);box(0.5,0.08,0.1,m.black,0,0.01,0.87);for(let i=0;i<3;i++)tube([[0.65,-0.15,0.5],[0.95,-0.15,0.7+i*0.15]],0.016,m.dark);break;
      case 'maracas': for(const s of [-1,1]){sphere(0.38,m.body,s*0.43,0.45,0,[1,1.35,1]);cyl(0.06,0.07,1.1,m.wood,s*0.43,-0.45);ring(0.37,0.025,m.gold,s*0.43,0.4,0,[Math.PI/2,0,0]);}break;
      case 'mask': sphere(0.8,m.red,0,0,0,[0.85,1.1,0.25]);for(const s of [-1,1]){sphere(0.16,m.black,s*0.27,0.2,0.19,[1.2,0.6,0.15]);ring(0.17,0.03,m.gold,s*0.27,0.2,0.21);}sphere(0.1,m.skin,0,-0.06,0.25,[0.7,1.1,1.3]);box(0.25,0.09,0.02,m.dark,0,-0.4,0.2);break;
      case 'banknotes': for(let i=0;i<5;i++)box(1.8,0.012,0.85,i%2?m.white:m.green,0,i*0.025,0);box(0.3,0.15,0.88,m.skin,0,0.06);label('500',0.65,0.3,0.5,0.07,0.45);break;
      case 'watergun': box(1.4,0.36,0.4,m.gold,0,0.3);cyl(0.12,0.12,0.65,m.gold,0.8,0.3,0,[0,0,Math.PI/2]);box(0.3,0.9,0.35,m.red,-0.3,-0.25).rotation.z=-0.2;sphere(0.45,m.blue,-0.3,0.65,0,[1.2,0.55,0.7]);break;
      case 'cigar': cyl(0.15,0.13,2,m.wood);cyl(0.154,0.154,0.4,m.gold,0,0.3);cyl(0.14,0.14,0.08,m.dark,0,-1);break;
      case 'cards': for(let i=0;i<3;i++){const card=box(0.9,1.4,0.025,m.white,(i-1)*0.42,0,i*0.04);card.rotation.z=(1-i)*0.14;label(i===1?'A':'K',0.3,0.45,(i-1)*0.42,0,i*0.04+0.03,i===1?'#a73236':'#24313b','#e8e3d8');}break;
      case 'lock': box(1.15,0.92,0.4,m.gold,0,-0.3);ring(0.42,0.09,m.metal,0,0.45);cyl(0.12,0.12,0.02,m.dark,0,-0.2,0.23,[Math.PI/2,0,0]);box(0.09,0.2,0.02,m.dark,0,-0.36,0.23);break;
      case 'house': box(1.6,1.2,1.1,m.white,0,-0.2);add(new T.ConeGeometry(1.25,0.7,4),m.red,0,0.75,0,[0,Math.PI/4,0]);box(0.3,0.65,0.04,m.wood,0,-0.45,0.58);for(const x of [-0.5,0.5])box(0.3,0.33,0.03,m.blue,x,-0.02,0.58);break;
      case 'spoon': sphere(0.45,m.metal,0,0.62,0,[0.75,1,0.14]);box(0.12,1.4,0.07,m.metal,0,-0.45,0);break;
      case 'sponge': box(1.6,0.55,1,m.skin,0,0,0,0.12);box(1.56,0.14,0.97,m.green,0,0.32,0,0.08);for(let i=0;i<14;i++)sphere(0.035,m.wood,(rnd()-.5)*1.4,-0.05+(rnd()-.5)*0.3,0.51,[1,1,0.15]);break;
      case 'pins': box(1.4,0.22,0.9,m.blue,0,-0.35);for(let i=0;i<7;i++){const x=(rnd()-.5)*1.1,z=(rnd()-.5)*0.65;tube([[x,-0.22,z],[x,0.65,z]],0.012,m.metal);sphere(0.065,i%2?m.red:m.white,x,0.7,z);}break;
      case 'binoculars': for(const x of [-0.46,0.46]){cyl(0.36,0.28,1.15,m.dark,x,0,0,[Math.PI/2,0,0]);cyl(0.3,0.3,0.02,m.glass,x,0,0.6,[Math.PI/2,0,0]);}box(0.65,0.18,0.4,m.metal);break;
      case 'arcade': box(1.2,1.8,0.9,m.body,0,-0.3);box(1.15,0.75,0.25,m.dark,0,0.5,0.35);label('JACKPOT',0.92,0.53,0,0.5,0.49,'#ffe3a1','#47303f');box(1.2,0.16,0.42,m.gold,0,-0.15,0.5);sphere(0.08,m.red,-0.3,-0.02,0.55);break;
      case 'glitter': cyl(0.48,0.48,1.1,m.glass);cyl(0.49,0.49,0.12,m.gold,0,0.6);for(let i=0;i<24;i++)add(new T.OctahedronGeometry(0.06),m.gold,(rnd()-.5)*0.65,(rnd()-.5)*0.9,(rnd()-.5)*0.65);break;
      case 'microphone': cyl(0.14,0.19,1.25,m.dark,0,-0.4);sphere(0.34,m.metal,0,0.5);for(let i=0;i<4;i++)ring(0.31-i*0.025,0.012,m.dark,0,0.42+i*0.1,0,[Math.PI/2,0,0]);break;
      case 'horse': sphere(0.62,green?m.green:m.wood,0,0,0,[1.4,0.65,0.5]);sphere(0.35,green?m.green:m.wood,0.72,0.55,0,[0.75,1.4,0.7]);sphere(0.26,green?m.green:m.wood,0.98,0.65,0,[1.2,0.6,0.65]);for(const x of [-0.55,0.55])for(const z of [-0.22,0.22])cyl(0.07,0.06,0.95,green?m.green:m.wood,x,-0.55,z);tube([[-0.8,0.1,0],[-1.1,-0.1,0],[-1.15,-0.55,0]],0.07,m.dark);break;
      case 'bird': sphere(0.45,m.blue,0,-0.2,0,[0.8,1.2,0.65]);sphere(0.2,m.blue,0,0.5,0);add(new T.ConeGeometry(0.1,0.26,8),m.gold,0,0.5,0.25,[Math.PI/2,0,0]);for(let i=0;i<9;i++){const a=(i-4)*0.29;sphere(0.3,m.green,Math.sin(a)*0.8,Math.cos(a)*0.9+0.15,-0.45,[0.55,1.45,0.2]);sphere(0.08,m.gold,Math.sin(a)*0.95,Math.cos(a)*1.1+0.15,-0.37);}break;
      case 'doll': sphere(0.7,m.red,0,-0.35,0,[0.85,1.1,0.75]);sphere(0.43,m.red,0,0.56);sphere(0.3,m.skin,0,0.56,0.25,[1,1,0.25]);for(const x of [-0.1,0.1])sphere(0.025,m.black,x,0.6,0.33);sphere(0.2,m.gold,0,-0.2,0.53,[1,1.5,0.2]);break;
      case 'dragon': sphere(0.6,m.green,0,-0.2,0,[0.7,1.2,0.6]);sphere(0.35,m.green,0,0.63,0.08);sphere(0.24,m.green,0,0.6,0.38,[0.8,0.6,1]);for(const s of [-1,1]){shape([[s*0.25,0.2],[s*1.0,0.85],[s*0.85,-0.1],[s*0.5,0.0]],0.05,m.green);add(new T.ConeGeometry(0.07,0.3,8),m.gold,s*0.2,0.98,0);sphere(0.035,m.gold,s*0.15,0.73,0.37);}tube([[0,-0.55,-0.2],[0.45,-0.75,-0.65],[0.9,-0.4,-0.7]],0.07,m.green);break;
      case 'phone':
        box(1.02, 1.96, 0.16, metal); box(0.94, 1.86, 0.025, m.black, 0, 0, 0.095);
        label('09:41', 0.84, 1.61, 0, 0, 0.112, '#bbd9ee', '#172f48');
        box(0.26, 0.07, 0.02, m.black, 0, 0.82, 0.13); box(0.34, 0.04, 0.02, m.white, 0, -0.83, 0.13);
        box(0.45, 0.46, 0.045, m.dark, -0.22, 0.64, -0.12);
        for (const [x, y] of [[-0.33, 0.74], [-0.12, 0.61], [-0.33, 0.52]]) cyl(0.073, 0.073, 0.035, m.black, x, y, -0.16, [Math.PI / 2, 0, 0]);
        box(0.03, 0.28, 0.06, metal, 0.54, 0.3); break;
      case 'laptop':
        box(2.1, 0.12, 1.35, metal, 0, -0.55, 0.15); box(1.82, 1.26, 0.08, m.dark, 0, 0.1, -0.49).rotation.x = -0.18;
        label('BOMZH OS', 1.65, 1.03, 0, 0.13, -0.405, '#8ae4d1', '#19304a');
        for (let row = 0; row < 4; row++) for (let col = 0; col < 11; col++) box(0.12, 0.02, 0.12, m.black, -0.78 + col * 0.155, -0.47, -0.2 + row * 0.15, 0.008);
        box(0.6, 0.012, 0.3, m.dark, 0, -0.47, 0.6); break;
      case 'headphones':
        ring(0.75, 0.09, metal, 0, 0.25, 0, null, Math.PI);
        ring(0.73, 0.055, m.rubber, 0, 0.21, 0.02, null, Math.PI);
        for (const side of [-1, 1]) { box(0.16, 0.6, 0.12, metal, side * 0.75, 0); sphere(0.38, m.dark, side * 0.75, -0.38, 0, [0.65, 1.25, 0.9]); sphere(0.32, m.rubber, side * 0.63, -0.38, 0.05, [0.5, 1.23, 0.84]); } break;
      case 'camera':
        box(1.7, 1.08, 0.65, m.dark); box(0.65, 0.3, 0.55, metal, -0.15, 0.62);
        cyl(0.43, 0.5, 0.5, m.black, 0.1, 0, 0.48, [Math.PI / 2, 0, 0]);
        cyl(0.32, 0.32, 0.04, m.glass, 0.1, 0, 0.75, [Math.PI / 2, 0, 0]);
        ring(0.37, 0.035, metal, 0.1, 0, 0.76); box(0.28, 0.15, 0.05, m.white, -0.52, 0.3, 0.35);
        cyl(0.11, 0.11, 0.08, m.red, 0.55, 0.58); label('VIEW', 0.95, 0.63, 0, 0, -0.335); break;
      case 'television':
        box(2.08, 1.45, 0.65, m.wood); box(1.62, 1.16, 0.03, m.black, -0.12, 0, 0.35);
        label('BOMZH TV', 1.45, 1.0, -0.12, 0, 0.38, '#a2babb', '#244245');
        for (const y of [-0.27, 0.28]) cyl(0.1, 0.1, 0.07, metal, 0.85, y, 0.37, [Math.PI / 2, 0, 0]);
        tube([[-0.6, 0.75, 0], [-0.9, 1.3, 0]], 0.023, metal); tube([[0.2, 0.75, 0], [0.7, 1.25, 0]], 0.023, metal);
        for (const x of [-0.65, 0.65]) box(0.12, 0.25, 0.5, m.dark, x, -0.82); break;
      case 'console':
        box(1.3, 1.85, 0.3, m.body); box(0.99, 0.78, 0.04, m.dark, 0, 0.38, 0.17); label('LEVEL 01', 0.82, 0.6, 0, 0.38, 0.198, '#315b40', '#9bac73');
        box(0.4, 0.12, 0.07, m.black, -0.32, -0.35, 0.2); box(0.12, 0.4, 0.07, m.black, -0.32, -0.35, 0.2);
        for (const [x, y] of [[0.32, -0.27], [0.48, -0.48]]) cyl(0.095, 0.095, 0.06, m.red, x, y, 0.2, [Math.PI / 2, 0, 0]); break;
      case 'radio':
        box(2, 1.05, 0.6, m.body); for (const x of [-0.62, 0.62]) { cyl(0.35, 0.35, 0.04, m.black, x, -0.04, 0.33, [Math.PI / 2, 0, 0]); ring(0.28, 0.025, metal, x, -0.04, 0.36); sphere(0.13, m.dark, x, -0.04, 0.37, [1, 1, 0.4]); }
        box(0.49, 0.3, 0.04, m.dark, 0, 0.12, 0.33); label('FM 104', 0.42, 0.2, 0, 0.14, 0.36);
        tube([[-0.5, 0.55, 0], [-0.5, 0.9, 0], [0.5, 0.9, 0], [0.5, 0.55, 0]], 0.05, m.black); tube([[0.75, 0.55, 0], [1.0, 1.35, 0]], 0.02, metal); break;
      case 'watch':
        box(0.5, 2.4, 0.1, m.dark); cyl(0.59, 0.59, 0.22, metal, 0, 0, 0, [Math.PI / 2, 0, 0]); cyl(0.51, 0.51, 0.025, m.white, 0, 0, 0.13, [Math.PI / 2, 0, 0]);
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; sphere(0.025, m.gold, Math.sin(a) * 0.43, Math.cos(a) * 0.43, 0.16); }
        tube([[0, -0.12, 0.17], [0, 0.32, 0.17]], 0.025, m.dark); tube([[0, 0, 0.18], [0.25, -0.09, 0.18]], 0.018, m.red); box(0.55, 0.23, 0.08, metal, 0, 1.03); break;
      case 'flashlight':
        cyl(0.24, 0.24, 1.4, m.dark, 0, -0.2); cyl(0.46, 0.27, 0.4, metal, 0, 0.7);
        cyl(0.4, 0.4, 0.025, m.white, 0, 0.91); sphere(0.16, m.glass, 0, 0.94, 0, [1, 0.3, 1]);
        for (let i = 0; i < 5; i++) ring(0.25, 0.025, m.rubber, 0, -0.6 + i * 0.18, 0, [Math.PI / 2, 0, 0]); break;
      case 'battery': cyl(0.4, 0.4, 1.6, m.green); cyl(0.41, 0.41, 0.32, m.metal, 0, 0.64); cyl(0.14, 0.14, 0.1, m.metal, 0, 0.86); label('POWER', 0.62, 0.85, 0, -0.15, 0.402); break;
      case 'record':
        if (it.e === '📼' || /кассет/i.test(it.name)) { box(1.9, 1.15, 0.25, m.dark); box(1.6, 0.65, 0.015, m.white, 0, 0.12, 0.14); for (const x of [-0.45, 0.45]) { cyl(0.2, 0.2, 0.04, m.black, x, 0.09, 0.16, [Math.PI / 2, 0, 0]); ring(0.12, 0.035, m.metal, x, 0.09, 0.19); } label('SIDE A', 0.6, 0.2, 0, 0.44, 0.17); }
        else { cyl(1, 1, 0.06, m.metal, 0, 0, 0, [Math.PI / 2, 0, 0]); ring(0.17, 0.07, m.dark, 0, 0, 0.04); for (let i = 0; i < 6; i++) ring(0.4 + i * 0.09, 0.005, m.blue, 0, 0, 0.035); } break;
      case 'keyboard': box(2.4, 0.8, 0.15, m.dark); for (let y = 0; y < 4; y++) for (let x = 0; x < 13; x++) box(0.14, 0.13, 0.04, m.white, -1.06 + x * 0.177, 0.28 - y * 0.18, 0.11, 0.006); break;
      case 'chip': box(1.3, 1.3, 0.12, m.green); box(0.8, 0.8, 0.11, m.dark, 0, 0, 0.12); for (let i = 0; i < 8; i++) for (const s of [-1, 1]) { box(0.16, 0.045, 0.04, m.gold, s * 0.72, -0.5 + i * 0.14); box(0.045, 0.16, 0.04, m.gold, -0.5 + i * 0.14, s * 0.72); } break;
      case 'drone':
        sphere(0.5, m.body, 0, 0, 0, [1.2, 0.5, 1]); for (const x of [-0.8, 0.8]) for (const z of [-0.65, 0.65]) { tube([[0, 0, 0], [x, 0, z]], 0.07, m.dark); cyl(0.13, 0.13, 0.16, metal, x, 0.08, z); box(0.75, 0.025, 0.1, m.black, x, 0.2, z); } sphere(0.14, m.glass, 0, -0.26, 0.3); break;
      case 'shoe':
        m.cloth.color.set('#405a73'); box(0.86,0.15,1.96,m.white,0,-0.32,0.05,0.1);box(0.84,0.045,1.92,m.rubber,0,-0.41,0.05,0.08);
        shape([[-0.95,-0.22],[-0.93,0.02],[-0.62,0.17],[-0.22,0.26],[0.1,0.47],[0.65,0.52],[0.84,0.31],[0.85,-0.22]],0.69,m.cloth).rotation.y=Math.PI/2;
        const collar=ring(0.25,0.055,m.dark,0,0.5,-0.42,[Math.PI/2,0,0]);collar.scale.y=0.85;
        box(0.28,0.08,0.38,m.dark,0,0.35,-0.02).rotation.x=-0.25;
        for(let i=0;i<5;i++)tube([[-0.22,0.35-i*0.035,-0.06+i*0.13],[0.22,0.35-i*0.035,-0.06+i*0.13]],0.018,m.white);
        for(const s of [-1,1]){const stripe=shape([[-0.47,-0.08],[-0.1,0.03],[0.12,0.25],[0.04,-0.03],[-0.35,-0.17]],0.015,m.white,s*0.37);stripe.rotation.y=Math.PI/2;}
        break;
      case 'hat':
        sphere(0.79, m.cloth, 0, 0.03, 0, [1, 0.7, 1]); cyl(0.98, 1.0, 0.07, m.cloth, 0, -0.33);
        if (it.e === '🎩' || /цилиндр/.test(it.name)) { cyl(0.62, 0.67, 1.0, m.dark, 0, 0.4); cyl(0.68, 0.68, 0.15, m.red, 0, 0.0); }
        else box(1.25, 0.07, 0.8, m.cloth, 0, -0.3, 0.65, 0.1); break;
      case 'shirt':
        shape([[-0.46,-0.9],[0.46,-0.9],[0.48,0.38],[0.82,0.1],[1.06,0.57],[0.54,0.94],[0.24,0.98],[0.12,0.75],[-0.12,0.75],[-0.24,0.98],[-0.54,0.94],[-1.06,0.57],[-0.82,0.1],[-0.48,0.38]], 0.24, m.cloth);
        tube([[0, -0.83, 0.15], [0, 0.7, 0.15]], 0.015, metal); for (let i = 0; i < 5; i++) sphere(0.025, metal, 0.04, 0.45 - i * 0.25, 0.18);
        box(0.25, 0.25, 0.025, m.body, -0.25, 0.27, 0.16); break;
      case 'pants':
        shape([[-0.6,1],[0.6,1],[0.53,-1],[0.06,-1],[0,0.15],[-0.06,-1],[-0.53,-1]], 0.25, m.cloth); box(1.2, 0.12, 0.28, m.dark, 0, 0.94); box(0.14, 0.12, 0.035, metal, 0, 0.92, 0.17); for (const s of [-1, 1]) tube([[s * 0.5, 0.8, 0.16],[s * 0.44,-0.9,0.16]], 0.018, m.white); break;
      case 'scarf':
        ring(0.52, 0.18, m.cloth, 0, 0.48, 0, [0.8, 0, 0]); box(0.38, 1.42, 0.13, m.cloth, -0.34, -0.35, 0.24); box(0.38, 1.12, 0.13, m.cloth, 0.28, -0.21, 0.12); for (let i = 0; i < 6; i++) tube([[-0.49 + i * 0.06,-1.02,0.24],[-0.49 + i * 0.06,-1.18,0.24]], 0.015, m.cloth); break;
      case 'glasses':
        for (const s of [-1,1]) { ring(0.4, 0.04, metal, s * 0.48, 0, 0); sphere(0.38, m.glass, s * 0.48, 0, 0, [1,0.86,0.09]); tube([[s * 0.86,0.1,0],[s * 0.92,0.1,-0.85],[s * 0.8,0,-1.05]], 0.035, metal); } tube([[-0.1,0.08,0],[0,0.15,0],[0.1,0.08,0]], 0.035, metal); break;
      case 'bag':
        box(1.65, 1.25, 0.65, m.body, 0, -0.1, 0, 0.1); tube([[-0.4,0.56,0],[-0.4,0.95,0],[0.4,0.95,0],[0.4,0.56,0]], 0.065, m.dark);
        for (const x of [-0.56,0.56]) box(0.14, 1.2, 0.69, m.dark, x, -0.1); box(0.22,0.17,0.05,metal,0,0.06,0.37); box(1.6,0.035,0.02,metal,0,0.4,0.35); break;
      case 'bottle':
        add(new T.LatheGeometry([[0.25,-1],[0.36,-0.94],[0.36,0.35],[0.3,0.5],[0.13,0.68],[0.13,1]].map((p)=>new T.Vector2(...p)),32), golden ? m.gold : m.green);
        cyl(0.145,0.145,0.2,m.gold,0,0.95); label('РЕЗЕРВ',0.55,0.64,0,-0.18,0.365,'#39302c','#e2d8ba'); break;
      case 'can':
        cyl(0.57,0.57,1.25,m.metal); for(const y of [-0.62,0.62]) ring(0.56,0.025,metal,0,y,0,[Math.PI/2,0,0]);
        label(/черв|мотыл/i.test(it.name)?'НАЖИВКА':'ЗАПАС',0.92,0.75,0,0,0.575,'#ece1c0','#745438'); ring(0.14,0.025,m.dark,0,0.648,0,[Math.PI/2,0,0]); break;
      case 'cup':
        cyl(0.52,0.38,1.1,m.white); cyl(0.46,0.46,0.015,m.wood,0,0.56); ring(0.34,0.065,m.white,0.56,0.02,0,[0,Math.PI/2,0]);
        if(/бабл|смузи|коктейл|кофе/i.test(it.name)) { cyl(0.55,0.55,0.06,m.dark,0,0.58); tube([[0.15,0.56,0],[0.15,1.03,0],[0.35,1.18,0]],0.035,m.red); } break;
      case 'egg':
        sphere(0.72,golden?m.gold:m.white,0,0,0,[0.78,1.15,0.78]); if(golden) for(let i=0;i<3;i++) ring(0.53,0.025,m.gold,0,-0.3+i*0.3,0,[Math.PI/2,0,0]); break;
      case 'cake': cyl(0.85,0.85,0.65,m.white); cyl(0.86,0.86,0.1,m.red,0,0.37); for(let i=0;i<7;i++){const a=i*Math.PI*2/7;sphere(0.1,m.red,Math.cos(a)*0.62,0.5,Math.sin(a)*0.62);}break;
      case 'chocolate':
        box(1.2,1.85,0.2,m.wood);for(let x=0;x<3;x++)for(let y=0;y<4;y++)box(0.34,0.39,0.09,m.wood,-0.38+x*0.38,-0.65+y*0.44,0.15);box(1.22,0.65,0.24,golden?m.gold:m.red,0,-0.62,0);break;
      case 'bread': sphere(0.8,m.skin,0,0,0,[0.8,0.55,1.3]);for(let i=0;i<4;i++)tube([[-0.35,0.36,-0.6+i*0.38],[0,0.45,-0.48+i*0.38],[0.35,0.36,-0.37+i*0.38]],0.025,m.white);break;
      case 'fruit': sphere(0.7,m.green,0,-0.1,0,[0.85,1.1,0.85]);tube([[0,0.6,0],[0.1,0.9,0]],0.045,m.wood);sphere(0.25,m.green,0.24,0.78,0,[1,0.15,0.5]);break;
      case 'food': cyl(0.9,0.7,0.25,m.white,0,-0.4);sphere(0.55,m.skin,0,-0.05,0,[1.2,0.6,1]);for(let i=0;i<5;i++)sphere(0.15,i%2?m.green:m.red,(rnd()-.5)*1.1,0.2,(rnd()-.5)*0.9);break;
      case 'fish':
        sphere(0.7,golden?m.gold:m.blue,0,0,0,[1.4,0.65,0.45]);shape([[-0.85,0],[-1.45,0.55],[-1.45,-0.55]],0.1,golden?m.gold:m.blue);shape([[-0.2,0.3],[0.05,0.85],[0.4,0.33]],0.06,m.body);sphere(0.065,m.black,0.62,0.17,0.27);tube([[0.45,0.32,0.22],[0.3,0,0.32],[0.45,-0.32,0.22]],0.016,metal);break;
      case 'goldbar':
        shape([[-1,-0.35],[1,-0.35],[0.85,0.35],[-0.85,0.35]],0.95,m.gold);label('999.9',1.15,0.35,0,0,0.515,'#73470e','#deb345');break;
      case 'coin': cyl(0.85,0.85,0.13,m.gold,0,0,0,[Math.PI/2,0,0]);ring(0.74,0.025,m.gold,0,0,0.08);label('80',0.65,0.6,0,0,0.09,'#74501a','#e5bc62');break;
      case 'diamond':
        cyl(0.42,0.82,0.38,m.glass,0,0.35,0,null,8);add(new T.ConeGeometry(0.82,1.1,8),m.glass,0,-0.38,0,[Math.PI,0,0]);break;
      case 'crown':
        {
          const points=[],indices=[],segments=16;
          for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,y=i%2===0?0.58:0.02;for(const [r,h] of [[0.75,-0.5],[0.87,y],[0.68,-0.5],[0.8,y]])points.push(Math.cos(a)*r,h,Math.sin(a)*r);}
          for(let i=0;i<segments;i++){const a=i*4,b=((i+1)%segments)*4;indices.push(a,b,a+1,b,b+1,a+1,a+2,a+3,b+2,b+2,a+3,b+3,a+1,b+1,a+3,b+1,b+3,a+3,a,b,a+2,b,b+2,a+2);}
          const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();add(geometry,m.gold);
          ring(0.76,0.045,m.gold,0,-0.46,0,[Math.PI/2,0,0]);for(let i=0;i<8;i++){const a=i*Math.PI/4;sphere(0.07,i%2?m.blue:m.red,Math.cos(a)*0.79,-0.25,Math.sin(a)*0.79);}
        }break;
      case 'ring': ring(0.66,0.11,metal);sphere(0.23,m.glass,0,0.7,0,[1,0.8,1]);for(const x of [-0.17,0.17])tube([[x,0.57,0],[x,0.82,0]],0.035,metal);break;
      case 'necklace':
        for(let i=0;i<24;i++){const a=i*Math.PI/12;sphere(0.08,m.gold,Math.sin(a)*0.8,Math.cos(a),0);}add(new T.OctahedronGeometry(0.28),m.glass,0,-1.19,0);break;
      case 'medal': cyl(0.52,0.52,0.13,m.gold,0,-0.33,0,[Math.PI/2,0,0]);box(0.25,0.9,0.06,m.red,-0.18,0.55).rotation.z=0.3;box(0.25,0.9,0.06,m.blue,0.18,0.55).rotation.z=-0.3;add(new T.OctahedronGeometry(0.24),m.gold,0,-0.33,0.15);break;
      case 'key':
        ring(0.45,0.09,metal,0,0.6);box(0.16,1.2,0.16,metal,0,-0.35);for(let i=0;i<3;i++)box(0.3,0.12,0.16,metal,0.13,-0.8+i*0.23);break;
      case 'document':
        box(1.45,1.95,0.035,m.white);label('ДОКУМЕНТ',1.18,0.4,0,0.55,0.042,'#41454b','#e8e3d8');for(let i=0;i<6;i++)box(1.04-(i%3)*0.1,0.025,0.008,m.dark,-0.04,0.17-i*0.18,0.04);ring(0.16,0.018,m.red,0.32,-0.61,0.05);break;
      case 'frame':
        box(1.8,1.45,0.15,m.wood);box(1.57,1.22,0.04,m.gold,0,0,0.11);box(1.4,1.05,0.025,m.blue,0,0,0.15);sphere(0.13,m.gold,0.35,0.25,0.18,[1,1,0.1]);shape([[-0.67,-0.5],[-0.2,0.2],[0.25,-0.5]],0.02,m.green,0,0,0.19);shape([[-0.1,-0.5],[0.35,0.07],[0.68,-0.5]],0.02,m.dark,0,0,0.21);break;
      case 'book': box(1.4,1.8,0.42,m.red);box(1.31,1.69,0.33,m.white,0.04,0,0);label('ОГОНЁК',1.08,0.6,0,0.15,0.23,'#e1ce97','#973d37');break;
      case 'extinguisher':
        cyl(0.4,0.4,1.5,m.red,0,-0.15);sphere(0.4,m.red,0,0.6,0,[1,0.5,1]);box(0.15,0.25,0.15,metal,0,0.95);box(0.7,0.08,0.18,m.dark,0.16,1.12);tube([[0.18,0.94,0],[0.65,0.65,0],[0.66,-0.65,0]],0.045,m.rubber);label('ОП-5',0.6,0.65,0,-0.05,0.405,'#342d25','#e9e2cc');break;
      case 'bucket':
        cyl(0.67,0.49,1.1,m.metal);ring(0.67,0.035,metal,0,0.56,0,[Math.PI/2,0,0]);cyl(0.6,0.6,0.015,m.dark,0,0.57);ring(0.7,0.025,metal,0,0.52,0,null,Math.PI);break;
      case 'ladder': for(const x of [-0.55,0.55])box(0.12,2.3,0.13,m.metal,x);for(let i=0;i<6;i++)box(1.1,0.08,0.14,m.metal,0,-0.95+i*0.38);break;
      case 'compass':
        cyl(0.8,0.8,0.22,metal,0,0,0,[Math.PI/2,0,0]);cyl(0.7,0.7,0.02,m.white,0,0,0.13,[Math.PI/2,0,0]);shape([[0,0.56],[-0.12,0],[0.12,0]],0.02,m.red,0,0,0.17);shape([[0,-0.56],[-0.12,0],[0.12,0]],0.02,m.dark,0,0,0.17);ring(0.18,0.045,metal,0,0.95);break;
      case 'rod':
        tube([[-0.55,-1.1,0],[0.2,0.6,0],[0.6,1.5,0]],0.03,m.dark);tube([[-0.6,-1.1,0],[-0.35,-0.55,0]],0.065,m.wood);cyl(0.16,0.16,0.2,metal,-0.34,-0.58,0.12,[Math.PI/2,0,0]);tube([[0.6,1.5,0],[0.7,0.2,0],[0.6,-1.1,0]],0.008,m.white);ring(0.12,0.02,metal,0.61,-1.2,0,null,Math.PI*1.6);break;
      case 'sword':
        shape([[-0.12,-0.45],[0.12,-0.45],[0.12,1.2],[0,1.55],[-0.12,1.2]],0.06,m.metal);box(0.85,0.1,0.15,m.gold,0,-0.45);box(0.16,0.65,0.18,m.wood,0,-0.82);sphere(0.14,m.gold,0,-1.18,0);break;
      case 'tool':
        if(/отвёртк/.test(it.name)||it.e==='🪛'){cyl(0.12,0.17,0.85,m.red,0,-0.6);cyl(0.035,0.035,1.3,m.metal,0,0.45);box(0.12,0.2,0.035,m.metal,0,1.12);}
        else {box(0.22,1.6,0.16,metal,0,-0.1);ring(0.32,0.11,metal,0,0.88);box(0.23,0.5,0.22,m.dark,0,-0.7);}break;
      case 'rope': for(let i=0;i<5;i++)ring(0.65-i*0.09,0.035,m.skin,0,0,i*0.04);tube([[0.65,0,0],[0.95,-0.3,0],[0.7,-0.8,0]],0.035,m.skin);break;
      case 'bell': add(new T.LatheGeometry([[0.65,-0.6],[0.65,-0.5],[0.42,-0.35],[0.25,0.55],[0,0.62]].map((p)=>new T.Vector2(...p)),32),m.gold);ring(0.15,0.04,m.gold,0,0.78);sphere(0.1,m.dark,0,-0.7);break;
      case 'guitar':
        sphere(0.66,m.wood,0,-0.45,0,[1,1,0.3]);sphere(0.5,m.wood,0,0.15,0,[1,0.9,0.4]);cyl(0.21,0.21,0.02,m.dark,0,-0.25,0.22,[Math.PI/2,0,0]);box(0.19,1.3,0.12,m.wood,0,1.0);box(0.29,0.45,0.15,m.wood,0,1.76);for(let i=0;i<5;i++)tube([[-0.06+i*0.03,-0.7,0.25],[-0.06+i*0.03,1.85,0.11]],0.004,m.metal);break;
      case 'barbell': cyl(0.06,0.06,2.0,m.metal,0,0,0,[0,0,Math.PI/2]);for(const x of [-0.7,0.7]){cyl(0.55,0.55,0.25,m.dark,x,0,0,[0,0,Math.PI/2]);cyl(0.4,0.4,0.2,m.dark,x*1.32,0,0,[0,0,Math.PI/2]);}break;
      case 'dice':
        box(1.2,1.2,1.2,m.white,0,0,0,0.08);for(const [x,y] of [[-0.3,-0.3],[0,0],[0.3,0.3]])sphere(0.08,m.dark,x,y,0.62,[1,1,0.1]);for(const x of [-0.3,0.3])sphere(0.08,m.dark,x,0.62,0.2,[1,0.1,1]);sphere(0.08,m.dark,0.62,0,0,[0.1,1,1]);break;
      case 'ball': sphere(0.8,m.dark);cyl(0.28,0.28,0.01,m.white,0,0,0.805,[Math.PI/2,0,0]);label('8',0.33,0.33,0,0,0.82,'#16191b','#eee9df');break;
      case 'bike':
        wheel(-0.88,-0.48,0,0.47);wheel(0.88,-0.48,0,0.47);tube([[-0.88,-0.48,0],[-0.3,0.42,0],[0.1,-0.48,0],[-0.88,-0.48,0]],0.045,m.body);tube([[-0.3,0.42,0],[0.63,0.42,0],[0.1,-0.48,0]],0.045,m.body);tube([[0.88,-0.48,0],[0.55,0.7,0],[0.65,0.9,0.2]],0.035,metal);box(0.47,0.08,0.28,m.dark,-0.3,0.53);break;
      case 'scooter': box(1.7,0.1,0.4,m.body,0,-0.65);wheel(-0.7,-0.7,0,0.18);wheel(0.8,-0.7,0,0.18);tube([[0.75,-0.65,0],[0.55,1.0,0]],0.045,metal);tube([[0.55,1,-0.45],[0.55,1,0.45]],0.055,m.dark);break;
      case 'car':
        box(2.35,0.5,1.05,m.body,0,-0.2,0,0.1);box(1.15,0.53,0.91,m.dark,-0.1,0.3,0,0.1);box(0.68,0.35,0.93,m.glass,0.08,0.35,0);for(const x of [-0.75,0.75])for(const z of [-0.56,0.56])wheel(x,-0.5,z,0.29);for(const z of [-0.32,0.32])box(0.03,0.14,0.2,m.white,1.2,-0.12,z);break;
      case 'boat':
        shape([[-1.25,0.35],[1.1,0.35],[0.7,-0.4],[-0.85,-0.4]],0.85,m.white);box(1.4,0.12,0.82,m.wood,0,0.36);box(0.65,0.6,0.65,m.body,0.1,0.68);box(0.45,0.32,0.02,m.glass,0.1,0.73,0.34);tube([[0.1,1,0],[0.1,1.45,0]],0.025,metal);break;
      case 'plane':
        sphere(0.8,m.white,0,0,0,[1.8,0.27,0.3]);shape([[-0.6,0],[0.2,0.18],[0.9,0],[-0.1,-0.1]],0.08,m.body,0,0,0).rotation.x=Math.PI/2;box(0.65,0.06,2.5,m.white,-0.1);box(0.55,0.06,0.9,m.body,-1.1,0.14);box(0.35,0.4,0.04,m.body,-1.1,0.3);sphere(0.22,m.glass,0.85,0.15,0,[1.4,0.7,0.8]);break;
      case 'skateboard': box(2.1,0.1,0.55,m.wood,0,0,0,0.1);for(const x of [-0.7,0.7])for(const z of [-0.28,0.28])wheel(x,-0.16,z,0.12);break;
      case 'wheel': wheel(0,0,0,0.8);break;
      case 'vase': add(new T.LatheGeometry([[0.4,-1],[0.55,-0.8],[0.65,-0.2],[0.35,0.35],[0.28,0.75],[0.4,0.88]].map((p)=>new T.Vector2(...p)),40),golden?m.gold:m.blue);ring(0.4,0.025,metal,0,0.88,0,[Math.PI/2,0,0]);break;
      case 'plant':
        cyl(0.55,0.38,0.75,m.wood,0,-0.55);cyl(0.52,0.52,0.025,m.dark,0,-0.16);for(let i=0;i<7;i++){const a=i*Math.PI*2/7,x=Math.cos(a)*0.55,z=Math.sin(a)*0.55;tube([[0,-0.15,0],[x*0.5,0.35,z*0.5],[x,0.55,z]],0.02,m.green);sphere(0.34,m.green,x,0.6,z,[0.7,0.12,1.4]).rotation.z=-a;}break;
      case 'lamp': cyl(0.56,0.56,0.12,m.gold,0,-0.9);cyl(0.07,0.07,1.1,m.gold,0,-0.3);cyl(0.35,0.75,0.65,m.white,0,0.55);sphere(0.18,m.gold,0,0.35);break;
      case 'chair': box(1.0,0.13,0.9,m.wood,0,-0.05);box(1.0,1.0,0.12,m.wood,0,0.5,-0.4);for(const x of [-0.38,0.38])for(const z of [-0.32,0.32])box(0.09,0.95,0.09,m.metal,x,-0.6,z);break;
      case 'sofa': box(2.2,0.45,1.0,m.cloth,0,-0.3,0,0.12);box(2.2,0.9,0.28,m.cloth,0,0.25,-0.43,0.1);for(const x of [-1.02,1.02])box(0.3,0.6,1,m.cloth,x,0,0,0.1);for(const x of [-0.8,0.8])for(const z of [-0.3,0.3])box(0.12,0.3,0.12,m.wood,x,-0.65,z);break;
      case 'tent': shape([[-1,-0.7],[1,-0.7],[0,0.9]],1.25,m.cloth);shape([[-0.5,-0.68],[0.5,-0.68],[0,0.5]],0.02,m.dark,0,0,0.66);tube([[-1,-0.7,0.7],[0,0.9,0.7],[1,-0.7,0.7]],0.025,metal);break;
      case 'animal':
        sphere(0.65,green?m.green:m.skin,0,-0.3,0,[0.85,1.1,0.65]);sphere(0.52,green?m.green:m.skin,0,0.55,0);for(const s of [-1,1]){sphere(0.22,m.body,s*0.4,0.92,0);sphere(0.07,m.black,s*0.18,0.62,0.46);sphere(0.23,m.skin,s*0.42,-0.85,0.13,[1,0.7,1.4]);sphere(0.2,m.skin,s*0.58,-0.18,0,[0.8,1.5,0.9]);}sphere(0.1,m.black,0,0.4,0.54);break;
      case 'statue':
        box(1.0,0.3,0.8,m.dark,0,-1);sphere(0.23,golden?m.gold:m.green,0,0.85);cyl(0.27,0.4,1.25,golden?m.gold:m.green,0,0.03);tube([[-0.2,0.5,0],[-0.5,1.15,0],[-0.5,1.45,0]],0.075,golden?m.gold:m.green);add(new T.ConeGeometry(0.12,0.3,8),m.gold,-0.5,1.6,0);break;
      default:
        box(1.6,1.15,1.05,m.wood,0,0,0,0.06);box(0.18,1.18,1.08,m.skin);box(1.63,0.18,1.08,m.skin);label('ПОСЫЛКА',0.85,0.36,0,0,0.56,'#3c342a','#ceb78f');break;
    }
    // Center and fit every item; the inspector can use one camera for all families.
    const bounds = new T.Box3().setFromObject(root), size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3());
    root.children.forEach((child) => child.position.sub(center));
    root.scale.setScalar(2.35 / Math.max(size.x, size.y, size.z, 0.001));
    root.userData.modelKind = type;
    root.userData.materials = Object.values(m); root.userData.wearTexture = texture;
    return root;
  }
  function dispose(root) {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    root.traverse((node) => { if(node.geometry)geometries.add(node.geometry); if(node.material) for(const m of [node.material].flat()){materials.add(m);if(m.map)textures.add(m.map);} });
    for(const m of root.userData.materials || []) materials.add(m);
    if(root.userData.wearTexture)textures.add(root.userData.wearTexture);
    textures.forEach((t)=>t.dispose());materials.forEach((m)=>m.dispose());geometries.forEach((g)=>g.dispose());
  }
  return { kind, build, dispose };
})();
