// The garage belongs to the account. Orders use the hero's current resources;
// the network can use assets but never takes ownership or changes their income.
const NEIGHBORHOOD534_HOUR = 3600000;
const NEIGHBORHOOD534_LIMIT = 1000000;
const NEIGHBORHOOD534_MILESTONES = [3, 6, 12];

const NEIGHBORHOOD534_ROUTES = {
  workshop: {
    label: ['Мастерская', 'Workshop'],
    description: ['Михалыч отдаёт дальний бокс под ремонт вещей соседей.', 'Mikhailych offers the back bay for repairing things for the neighbors.'],
    consequence: ['На верстаке появятся инструменты. Первое дело — починить тележку пекаря. Заявки на ремонт требуют больше сил и приносят больше денег.', 'Tools go on the workbench. Fix the baker’s cart first. Repair orders take more energy and pay more.'],
    fullOrder: { energy: 6, reward: 180 },
    quickOrder: { energy: 4, reward: 115 },
    first: {
      title: ['Тележка до рассвета', 'A cart before dawn'],
      description: ['У пекаря перекосило колесо. Утром нужно развезти хлеб. Михалыч предлагает заменить втулку или выправить колесо до первой развозки.', 'The baker’s cart has a crooked wheel and bread goes out in the morning. Replace the bushing or straighten the wheel for the first delivery.'],
      careful: ['Заменить втулку', 'Replace the bushing', 'Тележка снова держит тяжёлый груз. Пекарь рекомендует мастерскую соседям.', 'The cart can carry a heavy load again. The baker recommends the workshop to the neighbors.'],
      quick: ['Выправить колесо', 'Straighten the wheel', 'Хлеб успели развезти. Пекарь вернётся за новой втулкой после развозки.', 'The bread went out on time. The baker will return for a new bushing after the delivery.'],
    },
    recurring: [
      [['Велосипед почтальона', 'The postie’s bicycle'], ['Цепь слетела на середине маршрута.', 'The chain came off halfway through the round.'], ['Перебрать привод', 'Service the drivetrain'], ['Вернуть цепь на место', 'Refit the chain']],
      [['Колёса дворовой тележки', 'Wheels for the yard cart'], ['Завхозу нужно развезти коробки до закрытия рынка.', 'The caretaker needs to deliver boxes before the market closes.'], ['Настроить обе оси', 'Align both axles'], ['Починить проблемное колесо', 'Fix the troublesome wheel']],
      [['Дверь соседской кладовой', 'The neighbors’ storage door'], ['За дверью инструменты двора, а она цепляется за порог.', 'The yard’s tools are inside, but the door catches on the threshold.'], ['Выровнять дверную коробку', 'Square the door frame'], ['Подогнать петли', 'Adjust the hinges']],
    ],
    milestones: [
      [['Книга приёма', 'The repair register'], ['Соседи записывают поломки заранее. Теперь приносят и музыкальные инструменты.', 'Neighbors can book repairs. The workshop now takes musical instruments as well.'],
        [['Двое из духового оркестра', 'Two from the brass band'], ['Футляры разболтались перед репетицией.', 'The cases came loose before rehearsal.'], ['Перебрать оба футляра', 'Refit both cases'], ['Закрепить срочный футляр', 'Secure the urgent case']]],
      [['Стенд инструментов', 'The tool wall'], ['Местные мастера собрали инструменты на общей стене. Можно брать заказы от районного театра.', 'Local makers stocked a shared tool wall. The neighborhood theater now sends jobs.'],
        [['Реквизит к премьере', 'Props for opening night'], ['Театру нужно привести в порядок выдвижную стойку и ящик с реквизитом.', 'The theater needs a rolling stand and a prop box repaired.'], ['Починить обе вещи', 'Repair both pieces'], ['Подготовить стойку к сцене', 'Get the stand stage-ready']]],
      [['Именная вывеска', 'A name on the sign'], ['На фасаде появилась вывеска мастерской. Теперь заказы приносят и с соседних улиц.', 'The workshop has its own sign. People from nearby streets bring their orders.'],
        [['Тележка с соседней улицы', 'A cart from the next street'], ['Новый клиент просит спасти тележку перед ярмаркой.', 'A new customer asks you to rescue a cart in time for the fair.'], ['Обновить тележку', 'Refurbish the cart'], ['Подготовить к первой поездке', 'Get it ready for its first trip']]],
    ],
  },
  market: {
    label: ['Свой сервис', 'Own service'],
    description: ['Соседние лавки отдают коробки на хранение и выдачу. Ты открываешь свою службу доставки по двору.', 'The market stalls send boxes here for storage and pickup. You start your own neighborhood delivery service.'],
    consequence: ['В боксе появятся стеллажи. Первое дело — найти получателей коробок. Заказы на выдачу и доставку требуют меньше сил и приносят меньше денег.', 'Shelves go in the bay. Find the recipients of the first boxes. Pickup and delivery orders use less energy and pay less.'],
    fullOrder: { energy: 5, reward: 150 },
    quickOrder: { energy: 3, reward: 90 },
    first: {
      title: ['Три коробки для двора', 'Three boxes for the yard'],
      description: ['На двух коробках дождь размыл адреса. Можно обойти лавки и сверить весь список или отвезти подписанную коробку, а остальные оставить на сухой полке.', 'Rain washed the labels off two boxes. Check with the stalls to match the whole list, or deliver the labeled box and keep the others dry.'],
      careful: ['Сверить весь список', 'Verify the full list', 'Все три коробки нашли хозяев. Лавки оставили тебе список постоянных получателей.', 'All three boxes found their owners. The stalls gave you a list of regular recipients.'],
      quick: ['Отвезти подписанную', 'Deliver the labeled box', 'Срочная посылка вручена. Две другие ждут получателей под крышей.', 'The urgent parcel arrived. The other two are sheltered until their recipients turn up.'],
    },
    recurring: [
      [['Посылки к закрытию рынка', 'Parcels at closing time'], ['Два покупателя придут уже после закрытия лавок.', 'Two customers can only come after the stalls close.'], ['Собрать оба заказа', 'Put together both orders'], ['Подготовить срочный заказ', 'Prepare the urgent order']],
      [['Поставка для киоска', 'Supplies for the kiosk'], ['Привезли коробки двух продавцов и перепутали накладные.', 'Two sellers’ boxes arrived with their paperwork mixed up.'], ['Разобрать всю партию', 'Sort out the full shipment'], ['Отложить спорные коробки', 'Set the disputed boxes aside']],
      [['Утренняя развозка', 'The morning round'], ['Часть покупателей зайдёт сама, если развозка задержится.', 'Some customers can come by if delivery runs late.'], ['Обойти весь двор', 'Deliver around the whole yard'], ['Доставить только тяжёлое', 'Deliver only the heavy packages']],
    ],
    milestones: [
      [['Книга адресов', 'The address book'], ['Лавки оставили адреса постоянных клиентов. Появился заказ от булочной.', 'The stalls shared their regular customers’ addresses. The bakery now sends orders.'],
        [['Хлеб к завтраку', 'Bread for breakfast'], ['Булочная собрала корзины и просит обойти старый двор.', 'The bakery packed baskets for the old courtyard.'], ['Доставить все корзины', 'Deliver all the baskets'], ['Выйти по ранним адресам', 'Deliver to the early addresses']]],
      [['Стол комплектовки', 'The packing table'], ['В боксе появился стол для нескольких партий. Цветочница теперь отдаёт сюда букеты.', 'There is a bench for packing several shipments. The florist now drops bouquets off here.'],
        [['Букеты к субботе', 'Bouquets for Saturday'], ['Цветочница привезла тюльпаны и ромашки для двух заказов.', 'The florist brought tulips and daisies for two orders.'], ['Собрать полный заказ', 'Prepare the whole order'], ['Собрать букеты к утру', 'Prepare the morning bouquets']]],
      [['Табличка доставки', 'The delivery sign'], ['На фасаде появилась табличка сервиса. Теперь сюда обращаются и с соседних улиц.', 'The service has its own sign. Customers from nearby streets come here now.'],
        [['Первая заявка с соседней улицы', 'The first order from the next street'], ['Новый клиент забыл забрать покупку до закрытия.', 'A new customer missed the stall closing time.'], ['Довезти покупки по адресу', 'Deliver the purchases'], ['Оставить заказ под навесом', 'Leave the order under the canopy']]],
    ],
  },
};

const NEIGHBORHOOD534_PROJECTS = [
  {
    id: 'lights',
    label: ['Свет в дальнем боксе', 'Lights in the back bay'],
    description: ['Проведи свет от охраны. Под лампой можно работать с мелкими деталями и читать накладные.', 'Run a light from the caretaker’s booth. The lamp makes small parts and faded labels readable.'],
    consequence: ['В боксе загорится свет. Откроется навес, а подробные заказы после открытия доски будут стоить на 1 энергию меньше.', 'The bay lights up. You can build the canopy, and full jobs use 1 less energy once the board is up.'],
    energy: 5, money: 100,
  },
  {
    id: 'shelter',
    label: ['Навес у ворот', 'A canopy at the gate'],
    description: ['Под навесом вещи останутся сухими, а соседи смогут забирать заказы даже в дождь.', 'Under the canopy, things stay dry and neighbors can collect orders even in the rain.'],
    consequence: ['Над входом появится крыша. Откроется доска заявок, а короткие заказы будут стоить на 1 энергию меньше.', 'A roof goes above the entrance. You can add the order board, and quick jobs will use 1 less energy.'],
    energy: 7, money: 220,
  },
  {
    id: 'signboard',
    label: ['Доска заказов', 'The order board'],
    description: ['Повесь доску, чтобы соседи оставляли заявки в одном месте.', 'Put up one place for neighbors to leave their requests.'],
    consequence: ['У входа появится доска. После каждого выполненного заказа следующий станет доступен через 6 часов. Взятые заявки не сгорают.', 'An order board goes up at the entrance. A new order is available 6 hours after finishing one. Accepted orders stay open.'],
    energy: 8, money: 350,
  },
];

const NEIGHBORHOOD534_NETWORK = {
  workshops: {
    label: ['Материалы для мастерских', 'Workshop supplies'],
    description: ['Линь собирает запросы мастеров из городов, где Валера жил. Первой партии ждут мастера и Михалыч.', 'Lin gathers requests from the cities Valera lived in. The makers and Mikhailych are waiting for the first shipment.'],
    consequence: ['Сеть займётся запчастями, обменом инструментами и наборами для ремонта. Свой транспорт бережёт силы, а команда бизнеса помогает получить максимальную оплату.', 'The network deals in spare parts, tool swaps, and repair kits. Your own transport saves energy and a business team helps you earn the highest payment.'],
    team: { energy: 8, reward: 260 },
    vehicle: { energy: 4, reward: 260 },
    business: { energy: 6, reward: 365 },
    first: [['Первая партия материалов', 'The first shipment of supplies'], ['У Линя три списка. Выбери, кто соберёт и развезёт коробки мастерским.', 'Lin has three lists. Decide how to gather the boxes and get them to the workshops.']],
    recurring: [
      [['Полка запчастей', 'A shelf of spare parts'], ['Мастерским не хватает ходовых деталей. Собери общую партию.', 'The workshops are short of common parts. Assemble a shared shipment.']],
      [['Обмен инструментами', 'The tool exchange'], ['Михалыч и Линь нашли друг у друга нужные инструменты. Устрой обмен.', 'Mikhailych and Lin each have a tool the other needs. Arrange the exchange.']],
      [['Наборы для ремонта', 'Repair kits'], ['Мастера попросили простые наборы для дворовых заказов.', 'The makers have asked for simple kits for their neighborhood jobs.']],
    ],
    milestones: [
      [['Полка обмена', 'The swap shelf'], ['У Михалыча появилась полка для общих деталей. Открылась заявка на обмен крепежом.', 'Mikhailych set aside a shelf for shared parts. A fastener swap is now available.'],
        [['Коробка крепежа', 'A box of fasteners'], ['Три мастерские готовы поделиться разными винтами и креплениями.', 'Three workshops have different screws and fittings to share.']]],
      [['Общий каталог', 'The shared catalog'], ['Линь собрал список всех деталей. Теперь можно комплектовать заказы для незнакомых мастеров.', 'Lin compiled a parts list. You can now assemble orders for new makers.'],
        [['Список от молодой мастерской', 'A list from a new workshop'], ['Новые мастера прислали первый список запчастей.', 'A new workshop sent its first spare-parts list.']]],
      [['Вывеска союза мастерских', 'The makers’ network sign'], ['На карте появилась вывеска союза. Открылась совместная заявка от шести городов.', 'The makers’ sign is on the map. A joint order from six cities is available.'],
        [['Шесть коробок, шесть мастерских', 'Six boxes, six workshops'], ['Каждый мастер вложил полезную деталь для следующего города.', 'Each maker packed a useful part for the next city.']]],
    ],
  },
  fair: {
    label: ['Ярмарка городов', 'Six-city fair'],
    description: ['Торговцы из прошлых городов хотят выставить свои вещи рядом. Начни с пробного развоза по лавкам.', 'Sellers from the earlier cities want to show their wares together. Start with a trial run to the stalls.'],
    consequence: ['Сеть займётся ярмарками, витринами и обменом между лавками. Своя доставка приносит самую высокую оплату, а команда бизнеса бережёт силы.', 'The network runs fairs, sets up displays, and arranges swaps. Delivering on your own ride pays the most, while your business team saves energy.'],
    team: { energy: 7, reward: 245 },
    vehicle: { energy: 5, reward: 350 },
    business: { energy: 3, reward: 275 },
    first: [['Пробная ярмарка', 'The trial fair'], ['Торговцы прислали первые коробки. Выбери, как подготовить столы и довезти товары.', 'The sellers sent their first boxes. Decide how to prepare the stalls and move the goods.']],
    recurring: [
      [['Столы для гостей', 'Stalls for visiting sellers'], ['Два продавца приезжают впервые. Подготовь места для их вещей.', 'Two sellers are coming for the first time. Get their stalls ready.']],
      [['Витрина городов', 'A six-city display'], ['Соседи привезли любимые вещи из разных городов. Разложи их по витринам.', 'Neighbors brought their favorite things from different cities. Set up the display.']],
      [['Обмен между лавками', 'A swap between stalls'], ['После ярмарки осталось несколько коробок. Устрой обмен между продавцами.', 'A few boxes are left after the fair. Arrange a swap between the sellers.']],
    ],
    milestones: [
      [['Гостевой стол', 'The guest stall'], ['Для приезжих появился отдельный стол. Теперь заявки приходят от новых продавцов.', 'Visitors have a stall of their own. New sellers can send requests.'],
        [['Первый гость рынка', 'The market’s first guest'], ['Гостья привезла посуду и таблички, всё нужно разложить до открытия.', 'A visitor brought tableware and signs to set out before opening.']]],
      [['Афиша поездок', 'The travel noticeboard'], ['На доске появились направления поездок. Открылась развозка для выставки ремесла.', 'Travel routes went up on the noticeboard. Deliveries for the craft show are now available.'],
        [['Выставка ремесла', 'The craft show'], ['Заявки с двух улиц нужно собрать в одну выставку.', 'Two streets have sent items for one show.']]],
      [['Флаг ярмарки', 'The fair flag'], ['Над ярмаркой висит общий флаг. В заказах появился праздник шести городов.', 'A shared flag flies over the fair. The six-city celebration is now on the board.'],
        [['Стол на шесть городов', 'A table for six cities'], ['Торговцы собрали угощения и сувениры для общего стола.', 'Sellers gathered food and souvenirs for the shared table.']]],
    ],
  },
};

function neighborhood534Text(ru, en) {
  return typeof I18N !== 'undefined' && I18N.lang === 'en' ? en : ru;
}

function neighborhood534State() {
  const stored = S.neighborhood534;
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function neighborhood534Update() {
  return (S.neighborhood534 = neighborhood534State());
}

function neighborhood534Stamp() {
  return Math.floor(businessNow() ?? Date.now());
}

function neighborhood534NetworkEligible() {
  const state = neighborhood534State();
  return !!(state.networkChosenAt || S.fin528 || (city() === 'cn' && Number(S.quest?.idx) >= WORLD50.cn.chapters.length));
}

function neighborhood534Unlocked() {
  const state = neighborhood534State();
  return !!(state.enteredAt || state.route || neighborhood534NetworkEligible() || city() !== 'zas' || Number(S.quest?.idx) >= 3);
}

function neighborhood534Enter() {
  if (SAVE_LOCK || ALT_SAVE || !neighborhood534Unlocked() || neighborhood534State().enteredAt) return;
  neighborhood534Update().enteredAt = neighborhood534Stamp();
  save(true);
}

function neighborhood534Route(state) {
  return Object.hasOwn(NEIGHBORHOOD534_ROUTES, state.route) ? NEIGHBORHOOD534_ROUTES[state.route] : null;
}

function neighborhood534NetworkRoute(state) {
  return Object.hasOwn(NEIGHBORHOOD534_NETWORK, state.network) ? NEIGHBORHOOD534_NETWORK[state.network] : null;
}

function neighborhood534Stage(state) {
  return state.firstJobAt ? Math.max(0, Math.min(3, Math.floor(Number(state.stage) || 0))) : 0;
}

function neighborhood534Count(cycle) {
  return Math.max(0, Math.min(NEIGHBORHOOD534_LIMIT, Math.floor(Number(cycle?.count) || 0)));
}

function neighborhood534Energy(value) {
  return neighborhood534Text(`${value} энергии`, `${value} energy`);
}

function neighborhood534Option(id, label, consequence, energy, money = 0, reward = 0, disabledReason = '') {
  if (!disabledReason && energy > 0 && (Number(S.energy) || 0) < energy) {
    disabledReason = neighborhood534Text('Нужно восстановить энергию.', 'Recover some energy first.');
  }
  if (!disabledReason && money > 0 && (Number(S.money) || 0) < money) {
    disabledReason = neighborhood534Text('Не хватает денег.', 'You need more money.');
  }
  const cost = money > 0 ? cityMoney(money) : neighborhood534Energy(energy);
  return {
    id, label: neighborhood534Text(...label), description: '', consequence: neighborhood534Text(...consequence),
    energy, money, rewardAmount: reward, cost, reward: reward > 0 ? cityMoney(reward) : '',
    available: !disabledReason, disabledReason,
  };
}

function neighborhood534FirstJob(route) {
  const first = route.first;
  return {
    id: 'garage-first', kind: 'first', title: neighborhood534Text(...first.title), description: neighborhood534Text(...first.description),
    choices: [
      neighborhood534Option('careful', first.careful.slice(0, 2), first.careful.slice(2), 5, 0, 160),
      neighborhood534Option('quick', first.quick.slice(0, 2), first.quick.slice(2), 3, 0, 100),
    ],
  };
}

function neighborhood534CycleReady(cycle) {
  const now = businessNow();
  return Number.isFinite(now) && now >= (Number(cycle?.readyAt) || 0) && neighborhood534Count(cycle) < NEIGHBORHOOD534_LIMIT;
}

function neighborhood534CycleStatus(cycle, hours) {
  const now = businessNow();
  if (!Number.isFinite(now)) {
    return neighborhood534Text('Для новых заказов нужна связь с игрой. Уже взятое дело сохранено.', 'Connect to the game for new orders. Your accepted order is saved.');
  }
  const minutes = Math.max(0, Math.ceil(((Number(cycle?.readyAt) || 0) - now) / 60000));
  if (minutes) {
    const left = `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
    return neighborhood534Text(`Следующее дело через ${left}.`, `Next order in ${left}.`);
  }
  return neighborhood534Text(`Новый заказ через ${hours} ч после выполнения.`, `A new order is ready ${hours}h after completion.`);
}

function neighborhood534Recurring(route, count, offset) {
  // Debut each unlocked order at its milestone, then keep it in the rotation.
  const debut = NEIGHBORHOOD534_MILESTONES.indexOf(count);
  if (debut !== -1) return route.milestones[debut][2];
  const pool = route.recurring.concat(route.milestones.filter((_, i) => count >= NEIGHBORHOOD534_MILESTONES[i]).map(([, , job]) => job));
  return pool[(count + offset) % pool.length];
}

function neighborhood534MilestoneView(route, cycle) {
  if (!route) return [];
  const count = neighborhood534Count(cycle);
  return route.milestones.map(([title, description], index) => ({
    id: `milestone-${index + 1}`, title: neighborhood534Text(...title), description: neighborhood534Text(...description),
    needed: NEIGHBORHOOD534_MILESTONES[index], done: count >= NEIGHBORHOOD534_MILESTONES[index],
  }));
}

function neighborhood534LocalJob(state, route) {
  if (!state.firstJobAt) return neighborhood534FirstJob(route);
  const stage = neighborhood534Stage(state);
  if (stage < NEIGHBORHOOD534_PROJECTS.length) return null;
  const cycle = state.localityCycle;
  if (!cycle?.active && !neighborhood534CycleReady(cycle)) return null;
  const count = neighborhood534Count(cycle);
  const firstWasCareful = state.outcomes?.firstJob === 'careful';
  const [title, description, completeLabel, quickLabel] = neighborhood534Recurring(route, count, firstWasCareful ? 0 : 1);
  const fullEnergy = route.fullOrder.energy - (stage >= 1 ? 1 : 0);
  const quickEnergy = route.quickOrder.energy - (stage >= 2 ? 1 : 0);
  return {
    id: `local-${count}`, kind: 'local', title: neighborhood534Text(...title), description: neighborhood534Text(...description),
    choices: [
      neighborhood534Option('careful', completeLabel, ['Полный заказ готов. Соседи забрали всё сразу.', 'The full order is ready. The neighbors picked everything up together.'], fullEnergy, 0, route.fullOrder.reward),
      neighborhood534Option('quick', quickLabel, ['Срочная часть сделана. Остальное сосед сможет забрать позже.', 'The urgent part is done. The neighbor can collect the rest later.'], quickEnergy, 0, route.quickOrder.reward),
    ],
  };
}

function neighborhood534HasTransport() {
  const id = Number(S.transport);
  const currentWorks = Number.isInteger(id) && id > 0 && !!TRANSPORT[id] && !S.transportBroken;
  const parkedWorks = Array.isArray(S.fleet) && S.fleet.some((i) => Number.isInteger(i) && i > 0 && !!TRANSPORT[i] && !S.fleetBroken?.[i]);
  return currentWorks || parkedWorks;
}

function neighborhood534HasBusiness() {
  const local = Object.values(S.biz || {}).some((entry) => entry && Number(entry.lvl) >= 1 && !entry.broken);
  const managed = Array.isArray(S.managedBusinesses) && S.managedBusinesses.some((entry) => entry?.key && !entry.broken);
  return local || managed;
}

function neighborhood534NetworkJob(state, route) {
  const first = !state.networkFirstDoneAt;
  const cycle = state.networkCycle;
  if (!first && !cycle?.active && !neighborhood534CycleReady(cycle)) return null;
  const count = neighborhood534Count(cycle);
  const firstOption = ['team', 'vehicle', 'business'].indexOf(state.outcomes?.networkFirst);
  const [title, description] = first ? route.first : neighborhood534Recurring(route, count, Math.max(0, firstOption));
  return {
    id: first ? 'network-first' : `network-${count}`, kind: first ? 'network-first' : 'network',
    title: neighborhood534Text(...title), description: neighborhood534Text(...description),
    choices: [
      neighborhood534Option('team', ['Собраться с соседями', 'Gather the neighbors'], ['Соседи разобрали коробки по адресам и довезли всё вместе.', 'The neighbors sorted the boxes by address and delivered them together.'], route.team.energy, 0, route.team.reward),
      neighborhood534Option('vehicle', ['Развезти на своём транспорте', 'Use your transport'], ['Заказ развезли на твоём транспорте. Теперь коробки у получателей.', 'Your ride carried the shipment. The boxes are with the recipients.'], route.vehicle.energy, 0, route.vehicle.reward,
        neighborhood534HasTransport() ? '' : neighborhood534Text('Нужен исправный транспорт в этом городе.', 'You need working transport in this city.')),
      neighborhood534Option('business', ['Попросить команду бизнеса', 'Ask your business team'], ['Команда разложила коробки у себя и собрала общий заказ. Оплата за заявку начисляется отдельно.', 'Your team sorted the boxes at their premises and prepared the shipment. This order earns its own payment.'], route.business.energy, 0, route.business.reward,
        neighborhood534HasBusiness() ? '' : neighborhood534Text('Нужен работающий бизнес в этом или прошлом городе.', 'You need an operating business in this or an earlier city.')),
    ],
  };
}

function neighborhood534RouteChoices(catalog) {
  return Object.entries(catalog).map(([id, item]) => ({
    id, label: neighborhood534Text(...item.label), description: neighborhood534Text(...item.description),
    consequence: neighborhood534Text(...item.consequence), available: true,
  }));
}

function neighborhood534Active(state, job) {
  if (!job) return null;
  let active = state.active;
  if (job.kind === 'local') active = state.localityCycle?.active;
  if (job.kind === 'network-first') active = state.networkActive;
  if (job.kind === 'network') active = state.networkCycle?.active;
  return active?.id === job.id ? active : null;
}

function neighborhood534JobView(job, state) {
  if (!job) return { offer: null, active: null };
  const active = neighborhood534Active(state, job);
  if (!active) return { offer: { ...job, selected: '', consequence: '' }, active: null };
  const picked = job.choices.find((choice) => choice.id === active.choice);
  return { offer: null, active: {
    ...job, selected: picked?.id || '', consequence: picked?.consequence || '',
    completable: !!picked?.available, selectedChoice: picked || null,
  } };
}

function neighborhood534Projects(state) {
  const stage = neighborhood534Stage(state);
  return NEIGHBORHOOD534_PROJECTS.map((project, index) => ({
    id: project.id, label: neighborhood534Text(...project.label), description: neighborhood534Text(...project.description),
    consequence: neighborhood534Text(...project.consequence), done: index < stage, current: !!state.firstJobAt && index === stage,
    available: !!state.firstJobAt && index === stage, method: state.outcomes?.[project.id] || '',
    options: [
      neighborhood534Option('help', ['Сделать вместе с соседями', 'Build with the neighbors'], ['Работа займёт силы. Соседи помогут с материалами.', 'It costs energy. Neighbors will provide the materials.'], project.energy),
      neighborhood534Option('hire', ['Оплатить работу', 'Pay for the work'], ['Соседи всё соберут. Энергия останется на другие дела.', 'The neighbors will assemble it. Save your energy for other things.'], 0, project.money),
    ],
  }));
}

function neighborhood534View() {
  const state = neighborhood534State();
  const unlocked = neighborhood534Unlocked();
  const eligible = neighborhood534NetworkEligible();
  const route = neighborhood534Route(state);
  const networkRoute = neighborhood534NetworkRoute(state);
  const stage = neighborhood534Stage(state);
  const local = neighborhood534JobView(route ? neighborhood534LocalJob(state, route) : null, state);
  const network = neighborhood534JobView(eligible && networkRoute ? neighborhood534NetworkJob(state, networkRoute) : null, state);
  const firstOutcome = route && state.firstJobAt && ['careful', 'quick'].includes(state.outcomes?.firstJob) ? route.first[state.outcomes.firstJob] : null;
  const title = neighborhood534Text('Жизнь района', 'Neighborhood life');
  const entryTitle = route ? neighborhood534Text(...route.label) : neighborhood534Text('Гараж Михалыча', 'Mikhailych’s garage');
  let next = neighborhood534Text('Выбери, что открыть в старом гараже.', 'Decide what to open in the old garage.');
  if (local.active) next = local.active.title;
  else if (local.offer) next = local.offer.title;
  else if (route && stage < NEIGHBORHOOD534_PROJECTS.length) next = neighborhood534Text(...NEIGHBORHOOD534_PROJECTS[stage].label);
  else if (route) next = neighborhood534CycleStatus(state.localityCycle, 6);
  return {
    unlocked, lockedReason: neighborhood534Text('Заверши первые три главы Засранска.', 'Finish the first three chapters in Zasransk.'),
    title, stage, route: route ? state.route : '', routeLabel: route ? neighborhood534Text(...route.label) : '',
    entryTitle, entryDescription: next, next, firstOrderDone: !!state.firstJobAt,
    firstOutcome: firstOutcome ? neighborhood534Text(...firstOutcome.slice(2)) : '',
    cycleCount: neighborhood534Count(state.localityCycle), milestones: neighborhood534MilestoneView(route, state.localityCycle),
    completedCount: Number(!!state.firstJobAt) + Number(!!state.networkFirstDoneAt) + neighborhood534Count(state.localityCycle) + neighborhood534Count(state.networkCycle),
    choices: route ? [] : neighborhood534RouteChoices(NEIGHBORHOOD534_ROUTES),
    projects: neighborhood534Projects(state), ...local,
    network: {
      eligible, started: !!networkRoute, route: networkRoute ? state.network : '',
      routeLabel: networkRoute ? neighborhood534Text(...networkRoute.label) : '',
      firstOutcome: state.networkFirstDoneAt ? neighborhood534NetworkOutcome(state.outcomes?.networkFirst) : '',
      cycleCount: neighborhood534Count(state.networkCycle), milestones: neighborhood534MilestoneView(networkRoute, state.networkCycle),
      choices: eligible && !networkRoute ? neighborhood534RouteChoices(NEIGHBORHOOD534_NETWORK) : [], ...network,
      next: network.active?.title || network.offer?.title || (networkRoute ? neighborhood534CycleStatus(state.networkCycle, 24) :
        eligible ? neighborhood534Text('Выбери первое дело сети.', 'Choose the network’s first project.') :
          neighborhood534Text('Сеть откроется после финала Китая.', 'The network opens after the China finale.')),
    },
  };
}

function neighborhood534NetworkOutcome(option) {
  switch (option) {
    case 'team': return neighborhood534Text('Первый заказ развезли вместе с соседями.', 'The neighbors helped deliver the first order.');
    case 'vehicle': return neighborhood534Text('Первый заказ Валера развёз на своём транспорте.', 'Valera used his own transport for the first delivery.');
    case 'business': return neighborhood534Text('Первый заказ помогла собрать команда бизнеса.', 'The business team helped prepare the first order.');
    default: return '';
  }
}

function neighborhood534Playable() {
  return !SAVE_LOCK && !ALT_SAVE && neighborhood534Unlocked() && !S.busy;
}

function neighborhood534Refresh(message, kind = 'good') {
  save(true);
  refresh();
  if (message) toast(message, kind);
}

// Only the currently presented confirmation can select a permanent route.
let neighborhood534PendingChoice = null;
function neighborhood534ConfirmPanel(id, isNetwork) {
  if (!neighborhood534Playable()) return;
  const state = neighborhood534State();
  const catalog = isNetwork ? NEIGHBORHOOD534_NETWORK : NEIGHBORHOOD534_ROUTES;
  if (!Object.hasOwn(catalog, id)) return;
  if (isNetwork ? (!neighborhood534NetworkEligible() || neighborhood534NetworkRoute(state)) : neighborhood534Route(state)) return;
  const option = catalog[id];
  const key = `${isNetwork ? 'network' : 'garage'}:${id}`;
  neighborhood534PendingChoice = { key, save: S };
  const label = neighborhood534Text(...option.label);
  const confirm = neighborhood534Text('Выбрать этот путь', 'Choose this path');
  const cancel = neighborhood534Text('Вернуться к выбору', 'Go back');
  const notice = neighborhood534Text('Выбор сохранится на этом профиле, в том числе после престижа.', 'This choice remains on your profile, including after prestige.');
  openModal(`<section data-neighborhood534-choice="${esc(key)}"><h3>${esc(label)}</h3><p>${esc(neighborhood534Text(...option.consequence))}</p><p>${esc(notice)}</p><div class="btns"><button class="btn primary wide" data-act="neighborhood534ConfirmChoice" data-id="${esc(key)}">${esc(confirm)}</button><button class="btn wide" data-act="close">${esc(cancel)}</button></div></section>`, { center: true });
}

ACTIONS.neighborhood534Choose = (id) => neighborhood534ConfirmPanel(id, false);
ACTIONS.neighborhood534Network = (id) => neighborhood534ConfirmPanel(id, true);
ACTIONS.neighborhood534ConfirmChoice = (key) => {
  if (!neighborhood534Playable() || neighborhood534PendingChoice?.key !== key || neighborhood534PendingChoice.save !== S) return;
  if (document.querySelector('[data-neighborhood534-choice]')?.dataset.neighborhood534Choice !== key) return;
  const [type, id] = key.split(':');
  const state = neighborhood534Update();
  const now = neighborhood534Stamp();
  if (type === 'network') {
    if (!neighborhood534NetworkEligible() || neighborhood534NetworkRoute(state) || !Object.hasOwn(NEIGHBORHOOD534_NETWORK, id)) return;
    state.network = id;
    state.networkChosenAt = now;
    track('neighborhood534NetworkChosen');
  } else {
    if (neighborhood534Route(state) || !Object.hasOwn(NEIGHBORHOOD534_ROUTES, id)) return;
    state.route = id;
    state.chosenAt = now;
    track('neighborhood534GarageChosen');
  }
  state.enteredAt ||= now;
  neighborhood534PendingChoice = null;
  save(true);
  closeModal();
  toast(neighborhood534Text('Первое дело уже ждёт.', 'The first order is waiting.'), 'good');
};

function neighborhood534FindJob(id) {
  const state = neighborhood534State();
  const local = neighborhood534Route(state);
  const network = neighborhood534NetworkRoute(state);
  const localJob = local && neighborhood534LocalJob(state, local);
  if (localJob?.id === id) return localJob;
  const networkJob = network && neighborhood534NetworkEligible() && neighborhood534NetworkJob(state, network);
  return networkJob?.id === id ? networkJob : null;
}

function neighborhood534Cycle(state, key) {
  const existing = state[key];
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) return existing;
  return (state[key] = { count: 0, readyAt: 0, active: null });
}

ACTIONS.neighborhood534Enter = neighborhood534Enter;
ACTIONS.neighborhood534Accept = (id) => {
  if (!neighborhood534Playable()) return;
  const job = neighborhood534FindJob(id);
  if (!job || neighborhood534Active(neighborhood534State(), job)) return;
  const state = neighborhood534Update();
  const accepted = { id, choice: '', acceptedAt: neighborhood534Stamp() };
  if (job.kind === 'first') state.active = accepted;
  else if (job.kind === 'network-first') state.networkActive = accepted;
  else neighborhood534Cycle(state, job.kind === 'local' ? 'localityCycle' : 'networkCycle').active = accepted;
  neighborhood534Refresh();
};

ACTIONS.neighborhood534Decide = (argument) => {
  if (!neighborhood534Playable() || typeof argument !== 'string') return;
  const [id, option, extra] = argument.split(':');
  if (extra !== undefined) return;
  const job = neighborhood534FindJob(id);
  const active = neighborhood534Active(neighborhood534State(), job);
  const choice = job?.choices.find((value) => value.id === option);
  if (!active || !choice?.available || active.choice === option) return;
  active.choice = option;
  neighborhood534Refresh();
};

ACTIONS.neighborhood534Complete = (id) => {
  if (!neighborhood534Playable()) return;
  const job = neighborhood534FindJob(id);
  const state = neighborhood534State();
  const active = neighborhood534Active(state, job);
  const choice = job?.choices.find((value) => value.id === active?.choice);
  if (!active || !choice?.available) return;
  const recurring = job.kind === 'local' || job.kind === 'network';
  const now = recurring ? businessNow() : neighborhood534Stamp();
  if (!Number.isFinite(now)) {
    toast(neighborhood534Text('Подключись к игре, чтобы закрыть заказ. Выбор сохранён.', 'Connect to the game to close the order. Your choice is saved.'), 'bad');
    return;
  }
  if (job.kind === 'first') {
    state.active = null;
    state.firstJobAt = now;
    (state.outcomes ||= {}).firstJob = choice.id;
    track('neighborhood534FirstOrder');
  } else if (job.kind === 'network-first') {
    state.networkActive = null;
    state.networkFirstDoneAt = now;
    (state.outcomes ||= {}).networkFirst = choice.id;
    track('neighborhood534NetworkFirstOrder');
  } else {
    const cycle = neighborhood534Cycle(state, job.kind === 'local' ? 'localityCycle' : 'networkCycle');
    if (neighborhood534Count(cycle) >= NEIGHBORHOOD534_LIMIT) return;
    cycle.active = null;
    cycle.count = neighborhood534Count(cycle) + 1;
    cycle.readyAt = Math.floor(now) + (job.kind === 'local' ? 6 : 24) * NEIGHBORHOOD534_HOUR;
    track(job.kind === 'local' ? 'neighborhood534LocalOrder' : 'neighborhood534NetworkOrder');
  }
  S.energy -= choice.energy;
  addMoney(choice.rewardAmount);
  neighborhood534Refresh(choice.consequence);
};

ACTIONS.neighborhood534Build = (argument) => {
  if (!neighborhood534Playable() || typeof argument !== 'string') return;
  const [id, option, extra] = argument.split(':');
  if (extra !== undefined) return;
  const state = neighborhood534State();
  const project = neighborhood534Projects(state).find((value) => value.id === id && value.current);
  const choice = project?.options.find((value) => value.id === option);
  if (!choice?.available) return;
  S.energy -= choice.energy;
  S.money -= choice.money;
  (state.outcomes ||= {})[id] = option;
  state.stage = neighborhood534Stage(state) + 1;
  if (state.stage === NEIGHBORHOOD534_PROJECTS.length) state.projectsCompleteAt = neighborhood534Stamp();
  track('neighborhood534Project');
  neighborhood534Refresh(project.consequence);
};

const neighborhood534OriginalPrestigeProfile = prestigeProfile;
prestigeProfile = () => {
  const profile = neighborhood534OriginalPrestigeProfile();
  if (S.neighborhood534 !== undefined) profile.neighborhood534 = S.neighborhood534;
  return profile;
};
