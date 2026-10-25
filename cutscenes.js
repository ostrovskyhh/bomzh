// Анимированные мультики: после важных глав сюжета, перед боссом, при переезде, на свадьбе,
// при разводе и на вершине карьеры. Кадр — сцена, персонажи с репликами в облачках, предметы и эффекты.

// Кадр: bg — номер сцены жилья (0–6) или 'red' / 'gold' / 'night'; night — ночной фильтр; cam — 'shake' или 'zoom'.
// actors: a — valera, edik, mihalych, shnyr, barsik, girl, zinka или эмодзи; x — позиция в %; anim — in-left, in-right,
// bounce, shake, jump, fall, float, drive; say — реплика в облачке. props — предметы { e, x, y, anim }. fx — что сыплется сверху
const CUTS = {
  // ---------- Сюжет ----------
  ch_fight: [
    { bg: 2, actors: [{ a: 'valera', x: 50, mood: 'happy', anim: 'bounce', say: 'Кто следующий?!' }], props: [{ e: '🥊', x: 78, y: 30, anim: 'float' }], text: 'Слава о драках Валеры разлетелась по району.' },
    { bg: 2, actors: [{ a: 'shnyr', x: 24, anim: 'in-left', say: 'Пошли со мной! Лёгкие деньги!' }, { a: 'valera', x: 62 }], fx: '💸', text: 'Шнырь появился, как всегда, внезапно.' },
    { bg: 2, actors: [{ a: 'valera', x: 38 }, { a: 'mihalych', x: 76, anim: 'in-right', say: 'Не слушай его, Валера!' }], text: 'Михалыч, как всегда, вовремя.' },
    { bg: 2, cam: 'zoom', actors: [{ a: 'shnyr', x: 18 }, { a: 'valera', x: 50, mood: 'ok', anim: 'shake', say: 'Хм…' }, { a: 'mihalych', x: 82 }], text: 'Пора выбирать свою дорогу…' },
  ],
  path_honest: [
    { bg: 2, actors: [{ a: 'valera', x: 36, mood: 'happy', say: 'Я с тобой, Михалыч' }, { a: 'mihalych', x: 66, anim: 'jump', say: 'Вот это мужик!' }], fx: '❤️', text: 'Честный путь. Работа будет платить на 10% больше.' },
    { bg: 2, actors: [{ a: 'shnyr', x: 50, anim: 'shake', say: 'Ну и сиди на копейках!' }], text: 'Шнырь обиделся. Но ненадолго — ему ещё бутылки покупать.' },
  ],
  path_dark: [
    { bg: 2, night: true, actors: [{ a: 'valera', x: 36, say: 'Ладно, Шнырь. Я в деле' }, { a: 'shnyr', x: 66, anim: 'jump', say: 'Вот это разговор!' }], fx: '💸', text: 'Тёмная дорожка. Драки +20%, рынок +15%.' },
    { bg: 2, night: true, actors: [{ a: 'mihalych', x: 50, mood: 'sad', anim: 'shake', say: 'Эх, Валера, Валера…' }], text: 'Михалыч качает головой, но остаётся другом.' },
  ],
  ch_edik1: [
    { bg: 3, actors: [{ a: 'valera', x: 30, anim: 'in-left', say: 'Где же ты, Эдик…' }], props: [{ e: '🍉', x: 72, y: 70 }, { e: '🥩', x: 86, y: 72 }], text: 'Рынок. Где-то здесь видели Эдика.' },
    { bg: 3, actors: [{ a: 'valera', x: 26, mood: 'sad' }, { a: 'edik', x: 70, anim: 'in-right', say: 'Валера?! Ты ещё живой?' }], text: 'Эдик. В том самом костюме, купленном на деньги Валеры.' },
    { bg: 3, actors: [{ a: 'valera', x: 26, mood: 'ok', say: 'Верни квартиру!' }, { a: 'edik', x: 70, anim: 'bounce', say: 'Ха-ха-ха!' }], text: '' },
    { bg: 3, cam: 'shake', actors: [{ a: 'valera', x: 26, mood: 'sad', anim: 'shake' }, { a: '🚙', x: 70, anim: 'drive' }], fx: '💨', text: 'Эдик прыгнул в джип и умчался, обдав Валеру грязью.' },
    { bg: 3, cam: 'zoom', actors: [{ a: 'valera', x: 50, mood: 'ok', anim: 'bounce', say: 'Я тебя достану, Эдик!' }], text: 'Теперь это личное.' },
  ],
  ch_barsik: [
    { bg: 3, night: true, actors: [{ a: 'valera', x: 36, anim: 'in-left', say: 'Рыжая шерсть…' }], props: [{ e: '🔍', x: 64, y: 50, anim: 'float' }, { e: '🐾', x: 80, y: 82 }], text: 'Зацепка у гаражей: рыжая шерсть и следы лап.' },
    { bg: 3, night: true, actors: [{ a: 'valera', x: 30, say: 'Кис-кис-кис…' }, { a: 'barsik', x: 74, anim: 'in-right', say: 'Мяу?' }], text: 'Из-за мусорки показался рыжий хвост.' },
    { bg: 4, actors: [{ a: 'valera', x: 40, mood: 'happy', anim: 'jump', say: 'Барсик!!!' }, { a: 'barsik', x: 64, anim: 'jump', say: 'Мурр!' }], fx: '❤️', text: 'Барсик нашёлся! Теперь вы снова вместе.' },
  ],
  ch_edik2: [
    { bg: 5, actors: [{ a: 'valera', x: 28, anim: 'in-left' }], props: [{ e: '🏰', x: 72, y: 40, anim: 'float' }], text: 'Элитный район. За этим забором — дом Эдика.' },
    { bg: 5, actors: [{ a: 'valera', x: 26 }, { a: 'edik', x: 70, anim: 'bounce', say: 'Охрана! Уберите бомжа!' }], text: 'Эдик кричит с балкона.' },
    { bg: 5, night: true, cam: 'zoom', actors: [{ a: 'valera', x: 50, mood: 'ok', anim: 'shake', say: 'Завтра. Всё решится завтра' }], text: 'Валера уходит, но обещает вернуться.' },
  ],
  boss: [
    { bg: 6, night: true, actors: [{ a: 'edik', x: 70, anim: 'in-right', say: 'Ну что, Валера…' }], text: 'Последний разговор.' },
    { bg: 6, night: true, actors: [{ a: 'valera', x: 28, mood: 'ok', anim: 'in-left', say: 'Верни мою жизнь' }, { a: 'edik', x: 70, say: 'Отбери, если сможешь' }], text: '' },
    { bg: 'red', cam: 'shake', actors: [{ a: 'valera', x: 30, anim: 'shake' }, { a: 'edik', x: 70, anim: 'shake' }], fx: '💥', text: 'БОЙ!' },
  ],
  ch_final: [
    { bg: 6, cam: 'shake', actors: [{ a: 'valera', x: 32, mood: 'happy', say: 'Это за Барсика!' }, { a: 'edik', x: 70, anim: 'fall' }], fx: '⭐', text: 'Эдик повержен!' },
    { bg: 6, actors: [{ a: 'edik', x: 64, mood: 'sad', anim: 'shake', say: 'Забирай… всё забирай…' }], props: [{ e: '🔑', x: 34, y: 50, anim: 'float' }], text: 'Ключи от квартиры снова у Валеры.' },
    { bg: 5, actors: [{ a: 'mihalych', x: 20, anim: 'jump', say: 'Ура!' }, { a: 'valera', x: 50, mood: 'happy', anim: 'jump' }, { a: 'barsik', x: 78, anim: 'jump' }], fx: '🎉', text: 'Конец? Нет — только начало новой жизни!' },
  ],

  // ---------- Тёмная дорожка ----------
  ch_d_crew: [
    { bg: 3, night: true, actors: [{ a: 'shnyr', x: 24, say: 'Знакомься, это наши' }, { a: '🧔‍♂️', x: 58, anim: 'in-right' }, { a: '💪', x: 80, anim: 'in-right' }], text: 'Гаражи. Шнырь привёл Кривого и Гошу Лома.' },
    { bg: 3, night: true, actors: [{ a: 'valera', x: 34, mood: 'ok', say: 'Работаем по-честному. Между собой' }, { a: 'shnyr', x: 70, anim: 'bounce', say: 'Конечно, Валера!' }], text: 'Шнырь улыбается слишком широко…' },
    { bg: 3, night: true, cam: 'zoom', actors: [{ a: 'valera', x: 50, mood: 'happy', anim: 'jump', say: 'Бригада в сборе!' }], fx: '💸', text: 'У Валеры появилась своя бригада.' },
  ],
  boss_d_racket: [
    { bg: 3, actors: [{ a: 'valera', x: 26, anim: 'in-left' }, { a: '🦍', x: 72, anim: 'in-right', say: 'Чё, рынок захотел?' }], props: [{ e: '🥩', x: 50, y: 70 }], text: 'Бугай — два метра мышц и ни одной мысли.' },
    { bg: 'red', cam: 'shake', actors: [{ a: 'valera', x: 30, anim: 'shake', say: 'Рынок теперь мой' }, { a: '🦍', x: 70, anim: 'shake' }], fx: '💥', text: 'БОЙ!' },
  ],
  ch_d_racket: [
    { bg: 3, cam: 'shake', actors: [{ a: 'valera', x: 32, mood: 'happy', say: 'Следующий!' }, { a: '🦍', x: 70, anim: 'fall' }], fx: '⭐', text: 'Бугай повержен на глазах у всего рынка.' },
    { bg: 3, actors: [{ a: 'valera', x: 30, mood: 'happy' }, { a: 'shnyr', x: 70, anim: 'jump', say: 'Ларьки теперь платят нам!' }], fx: '💸', text: 'Продавцы несут конверты уже Валере.' },
    { bg: 5, night: true, actors: [{ a: 'edik', x: 50, mood: 'sad', anim: 'shake', say: 'Кто посмел?!' }], text: 'Где-то в элитном районе Эдик разбил бокал.' },
  ],
  ch_d_casino: [
    { bg: 'gold', night: true, actors: [{ a: 'valera', x: 30, mood: 'ok', say: 'Ещё карту' }, { a: '🤵', x: 70, say: 'Вы везунчик, Валерий' }], props: [{ e: '🃏', x: 50, y: 60, anim: 'float' }], text: '«Золотая крышка». Люди Эдика за соседним столом.' },
    { bg: 'gold', night: true, actors: [{ a: '🕴️', x: 66, say: 'Документы шеф держит в сейфе на складе' }, { a: 'valera', x: 30 }], text: 'После третьей бутылки охранник Эдика разговорился.' },
    { bg: 'night', cam: 'zoom', actors: [{ a: 'valera', x: 50, mood: 'happy', say: 'Склад, значит…' }], text: 'Теперь Валера знает, где искать.' },
  ],
  boss_d_betrayal: [
    { bg: 3, night: true, actors: [{ a: '🧔‍♂️', x: 30, say: 'Шнырь сливал тебя Эдику' }, { a: 'valera', x: 64, mood: 'sad', anim: 'shake', say: 'Не может быть…' }], text: 'Кривой показывает переписку Шныря с Эдиком.' },
    { bg: 3, night: true, actors: [{ a: 'valera', x: 28, mood: 'ok', say: 'Как ты мог, Шнырь?' }, { a: 'shnyr', x: 70, anim: 'bounce', say: 'Это бизнес, ничего личного!' }], text: 'У гаражей. Один на один.' },
    { bg: 'red', cam: 'shake', actors: [{ a: 'valera', x: 30, anim: 'shake' }, { a: 'shnyr', x: 70, anim: 'shake' }], fx: '💥', text: 'БОЙ!' },
  ],
  ch_d_betrayal: [
    { bg: 3, night: true, actors: [{ a: 'valera', x: 32, mood: 'ok' }, { a: 'shnyr', x: 70, mood: 'sad', anim: 'fall' }], text: 'Шнырь лежит. Карман порван, из него сыплются Эдиковы деньги.' },
    { bg: 3, night: true, actors: [{ a: 'shnyr', x: 64, mood: 'sad', say: 'Валерка, прости! Я всё расскажу!' }, { a: 'valera', x: 30, say: 'Уходи из города' }], text: '' },
    { bg: 3, actors: [{ a: 'valera', x: 40, mood: 'happy', say: 'Теперь бригада моя' }, { a: '🧔‍♂️', x: 64, anim: 'jump' }, { a: '💪', x: 84, anim: 'jump' }], fx: '⭐', text: 'Кривой и Гоша Лом остаются с Валерой.' },
  ],
  ch_d_heist: [
    { bg: 'night', actors: [{ a: 'valera', x: 30, anim: 'in-left', say: 'Тихо…' }, { a: '🔦', x: 70, anim: 'float' }], text: 'Три часа ночи. Склад Эдика.' },
    { bg: 'night', cam: 'shake', actors: [{ a: '🚨', x: 50, anim: 'bounce' }, { a: 'valera', x: 28, anim: 'shake', say: 'Сигнализация!' }], text: 'Гоша Лом задел ящик.' },
    { bg: 'night', actors: [{ a: '🚗', x: 50, anim: 'drive' }], fx: '💸', text: 'Ушли! Чёрная касса Эдика — в багажнике «Жигулей».' },
    { bg: 6, night: true, cam: 'zoom', actors: [{ a: 'edik', x: 50, mood: 'sad', anim: 'shake', say: 'ВАЛЕРА!!!' }], text: 'Эдик остался без денег. Теперь он сам придёт драться.' },
  ],
  // ---------- Честный путь ----------
  ch_h_shelter: [
    { bg: 2, actors: [{ a: 'valera', x: 32, mood: 'happy', say: 'Налетай, мужики!' }, { a: '👵', x: 70, say: 'Добро возвращается' }], props: [{ e: '🥣', x: 52, y: 70, anim: 'bounce' }], text: 'Ночлежка. Валера разливает суп тем, кто вчера был им самим.' },
    { bg: 2, actors: [{ a: 'mihalych', x: 50, anim: 'jump', say: 'Вот теперь ты человек, Валера' }], fx: '❤️', text: 'Михалыч гордится.' },
  ],
  ch_h_court: [
    { bg: 'gold', actors: [{ a: '👨‍⚖️', x: 50, anim: 'bounce', say: 'Слушается дело…' }], text: 'Районный суд. Валера против Эдика.' },
    { bg: 'gold', actors: [{ a: 'valera', x: 28, mood: 'ok', say: 'Подпись поддельная!' }, { a: 'edik', x: 70, mood: 'sad', anim: 'shake', say: 'Это клевета!' }], props: [{ e: '📜', x: 50, y: 40, anim: 'float' }], text: 'Экспертиза: подпись на договоре — не Валерина.' },
    { bg: 'gold', cam: 'zoom', actors: [{ a: 'valera', x: 50, mood: 'happy', anim: 'jump' }], fx: '⭐', text: 'Суд признал сделку незаконной. Эдику остаётся только драться.' },
  ],
  // ---------- Общие ----------
  ch_love: [
    { bg: 4, night: true, actors: [{ a: 'valera', x: 46, mood: 'sad', say: 'Поговорить бы с кем…' }], text: 'Вечер. Тихо. Даже Барсик спит.' },
    { bg: 5, actors: [{ a: 'valera', x: 34, mood: 'happy', say: 'Ты моя' }, { a: 'girl', x: 66, anim: 'jump' }], fx: '❤️', text: 'Теперь вечера проходят совсем иначе.' },
  ],
  ch_family: [
    { bg: 6, actors: [{ a: 'valera', x: 30, mood: 'happy' }, { a: 'girl', x: 52 }, { a: 'barsik', x: 74, anim: 'jump' }], fx: '❤️', text: 'Особняк, жена, кот. Всё, о чём мечтал на лавке.' },
    { bg: 6, actors: [{ a: 'mihalych', x: 50, anim: 'bounce', say: 'А я говорил!' }], text: 'Михалыч приходит в гости каждое воскресенье.' },
  ],
  ch_legend: [
    { bg: 0, actors: [{ a: 'valera', x: 50, mood: 'happy', say: 'Я помню эту лавку' }], text: 'Новый круг. Та же лавка, но Валера уже другой.' },
    { bg: 0, cam: 'zoom', actors: [{ a: 'mihalych', x: 26, anim: 'jump' }, { a: 'valera', x: 50, mood: 'happy', anim: 'jump' }, { a: 'barsik', x: 76, anim: 'jump' }], fx: '👑', text: 'Легенда района. Путь начинается заново.' },
  ],

  // ---------- Переезды ----------
  house_1: [
    { bg: 0, night: true, actors: [{ a: 'valera', x: 50, mood: 'sad', anim: 'shake', say: 'Брр… холодно' }], fx: '❄️', text: 'Ещё одна ночь на лавке.' },
    { bg: 1, actors: [{ a: 'valera', x: 40, mood: 'happy', anim: 'in-left', say: 'Своя коробка!' }], props: [{ e: '📦', x: 70, y: 72, anim: 'bounce' }], text: 'Первая недвижимость Валеры.' },
    { bg: 1, actors: [{ a: 'valera', x: 30, mood: 'happy' }, { a: 'mihalych', x: 72, anim: 'in-right', say: 'С новосельем!' }], props: [{ e: '🕊️', x: 52, y: 22, anim: 'float' }], text: 'Михалыч принёс в подарок старое одеяло.' },
  ],
  house_2: [
    { bg: 1, actors: [{ a: 'valera', x: 50, mood: 'sad', anim: 'shake', say: 'Коробка размокла…' }], fx: '💧', text: 'Дождь — главный враг картона.' },
    { bg: 2, actors: [{ a: 'valera', x: 32, say: 'Подай топор!' }, { a: 'mihalych', x: 70, anim: 'bounce', say: 'Держи!' }], props: [{ e: '🪵', x: 52, y: 80 }, { e: '🪓', x: 52, y: 55, anim: 'float' }], text: 'Строим шалаш вместе с Михалычем.' },
    { bg: 2, night: true, actors: [{ a: 'valera', x: 34, mood: 'happy', say: 'Свой костёр!' }, { a: 'mihalych', x: 70, mood: 'happy' }], props: [{ e: '🔥', x: 52, y: 78, anim: 'bounce' }], fx: '✨', text: 'Первая ночь у своего огня.' },
  ],
  house_3: [
    { bg: 2, actors: [{ a: 'shnyr', x: 50, anim: 'in-right', say: 'Есть гараж. Почти не краденый' }], text: 'Шнырь знает, где что плохо лежит.' },
    { bg: 3, actors: [{ a: 'valera', x: 40, mood: 'happy', anim: 'in-left', say: 'Железная дверь!' }], props: [{ e: '💡', x: 70, y: 30, anim: 'float' }], text: 'И лампочка! Почти цивилизация.' },
    { bg: 3, cam: 'shake', actors: [{ a: 'valera', x: 40, mood: 'ok', anim: 'shake', say: 'Ну хоть не дождь' }], props: [{ e: '🔧', x: 78, y: 50, anim: 'shake' }], text: 'За стенкой сосед-автомеханик начал сверлить.' },
  ],
  house_4: [
    { bg: 3, actors: [{ a: 'valera', x: 40, anim: 'in-left', say: 'Переезжаю!' }], props: [{ e: '🧳', x: 62, y: 76 }, { e: '🍾', x: 74, y: 78 }], text: 'Всё имущество влезло в одну сумку. И пакет бутылок.' },
    { bg: 4, actors: [{ a: 'valera', x: 30 }, { a: 'zinka', x: 72, anim: 'in-right', say: 'Опять бутылками кухню заставишь?' }], text: 'Соседка Зинка встречает новенького.' },
    { bg: 4, night: true, cam: 'shake', actors: [{ a: 'valera', x: 46, mood: 'sad', say: 'Зато кровать!' }], props: [{ e: '🎸', x: 78, y: 40, anim: 'bounce' }, { e: '🎵', x: 66, y: 25, anim: 'float' }], text: 'Соседи до утра поют под гитару.' },
  ],
  house_5: [
    { bg: 4, actors: [{ a: 'valera', x: 40, anim: 'in-left', say: 'Неужели…' }], props: [{ e: '🔑', x: 66, y: 45, anim: 'float' }], text: 'Ключи от своей квартиры.' },
    { bg: 5, actors: [{ a: 'valera', x: 48, mood: 'happy', anim: 'jump', say: 'Своя квартира!' }], fx: '⭐', text: 'Почти как раньше.' },
    { bg: 5, actors: [{ a: 'valera', x: 40, mood: 'happy', say: 'Горячая вода!!!' }], props: [{ e: '🛁', x: 70, y: 70, anim: 'bounce' }, { e: '🫧', x: 72, y: 40, anim: 'float' }], text: 'Час в ванной. Лучший час за много лет.' },
    { bg: 5, night: true, actors: [{ a: 'valera', x: 46, mood: 'ok', say: 'Осталось найти Эдика' }], props: [{ e: '🖼️', x: 74, y: 35 }], text: 'Над кроватью — старая фотография с Барсиком.' },
  ],
  house_6: [
    { bg: 5, actors: [{ a: '🚘', x: 50, anim: 'in-left' }], fx: '✨', text: 'К воротам подъезжает лимузин.' },
    { bg: 6, cam: 'zoom', actors: [{ a: 'valera', x: 48, mood: 'happy', anim: 'jump', say: 'Особняк!' }], fx: '🎉', text: 'Бассейн, сад, колонны. Месть подаётся с бассейном.' },
    { bg: 6, actors: [{ a: 'valera', x: 28, mood: 'happy', say: 'Подумаю' }, { a: 'edik', x: 72, mood: 'sad', anim: 'in-right', say: 'Возьми охранником, а?' }], text: 'Угадай, кто пришёл проситься на работу.' },
    { bg: 6, actors: [{ a: 'mihalych', x: 50, anim: 'jump', say: 'А бассейн с подогревом?' }], fx: '💦', text: 'Михалыч уже в плавках.' },
  ],

  // ---------- Семья ----------
  wedding: [
    { bg: 'gold', actors: [{ a: 'valera', x: 30, mood: 'happy', anim: 'in-left' }, { a: 'girl', x: 70, anim: 'in-right' }], props: [{ e: '💒', x: 50, y: 22, anim: 'float' }], text: 'ЗАГС. Все гости в сборе.' },
    { bg: 'gold', actors: [{ a: 'valera', x: 34, mood: 'happy', say: 'Да!' }, { a: 'girl', x: 66, say: 'Да!' }], props: [{ e: '💍', x: 50, y: 45, anim: 'bounce' }], text: '«Согласны ли вы…»' },
    { bg: 'gold', actors: [{ a: 'mihalych', x: 36, anim: 'shake', say: 'Я не плачу, это соринка' }, { a: 'shnyr', x: 72, say: 'Где тут бар?' }], text: 'Гости ведут себя… как обычно.' },
    { bg: 'gold', cam: 'zoom', actors: [{ a: 'valera', x: 40, mood: 'happy', anim: 'jump' }, { a: 'girl', x: 62, anim: 'jump' }], fx: '💐', text: 'Горько!' },
  ],
  divorce: [
    { bg: 'red', cam: 'shake', actors: [{ a: 'valera', x: 30, mood: 'sad' }, { a: 'girl', x: 70, anim: 'shake', say: 'Всё! Развод!' }], text: 'Гроза в семье.' },
    { bg: 'red', actors: [{ a: 'valera', x: 50, mood: 'sad', say: 'Может, договоримся?' }], props: [{ e: '⚖️', x: 50, y: 22, anim: 'bounce' }], text: 'Впереди делёж имущества…' },
  ],

  // ---------- Вершина карьеры ----------
  top_clerk: [
    { bg: 'gold', actors: [{ a: 'valera', x: 32, mood: 'happy', anim: 'in-left', say: 'Глава района!' }], props: [{ e: '🏛️', x: 72, y: 40, anim: 'float' }], fx: '⭐', text: 'Бывший бомж возглавил район.' },
    { bg: 'gold', actors: [{ a: 'valera', x: 32, mood: 'happy' }, { a: 'shnyr', x: 70, anim: 'in-right', say: 'Ларёк без разрешения можно?' }], text: 'Старые знакомые уже стоят в очереди.' },
  ],
  top_deputy: [
    { bg: 'gold', actors: [{ a: 'valera', x: 50, mood: 'happy', anim: 'jump', say: 'Заседание открыто!' }], fx: '🎉', text: 'Спикер парламента. Кто бы мог подумать.' },
    { bg: 'gold', actors: [{ a: 'valera', x: 32, mood: 'happy' }, { a: 'mihalych', x: 70, anim: 'bounce', say: 'Пенсию лавочникам поднимешь?' }], text: 'Первый законопроект уже готов.' },
  ],
  top_director: [
    { bg: 5, actors: [{ a: 'valera', x: 40, mood: 'happy', anim: 'in-left', say: 'Генеральный!' }], props: [{ e: '🏢', x: 76, y: 38, anim: 'float' }], fx: '💸', text: 'Кабинет с видом на тот самый парк, где была лавка.' },
  ],
};

function actorHTML(ac, i) {
  const who = ac.a;
  const look = { mood: ac.mood || 'ok' };
  const sets = {
    valera: () => valeraSVG(S.eq, look),
    edik: () => valeraSVG({ hat: 'cilinder', body: 'kostum', shoes: 'boots' }, { mood: ac.mood || 'happy' }),
    mihalych: () => valeraSVG({ hat: 'ushanka', body: 'telnyashka', shoes: 'tapki' }, { mood: ac.mood || 'happy' }),
    shnyr: () => valeraSVG({ hat: 'kepka', body: 'rvan', shoes: 'kedy' }, { mood: ac.mood || 'ok' }),
    barsik: () => PET_ART.cat,
    girl: () => `<div class="cs-emoji">${S.girlfriend ? GIRLS.find((g) => g.id === S.girlfriend).emoji : '👰'}</div>`,
    zinka: () => '<div class="cs-emoji">👩‍🦰</div>',
  };
  const names = { edik: 'Эдик', mihalych: 'Михалыч', shnyr: 'Шнырь', zinka: 'Зинка' };
  const body = sets[who] ? sets[who]() : `<div class="cs-emoji">${who}</div>`;
  const small = who === 'barsik' ? ' small' : '';
  const flip = ac.x > 55 && who !== 'barsik' && sets[who] && who !== 'girl' && who !== 'zinka';
  const say = ac.say ? `<div class="cs-say ${ac.x > 60 ? 'r' : ac.x < 40 ? 'l' : ''}" style="animation-delay:${0.35 + i * 0.5}s">${ac.say}</div>` : '';
  return `<div class="cs-actor ${ac.anim || ''}${small}${flip ? ' face-left' : ''}" style="left:${ac.x}%">
    ${say}${names[who] ? `<div class="cs-tag">${names[who]}</div>` : ''}<div class="cs-body">${body}</div></div>`;
}

function cutBg(bg) {
  if (typeof bg === 'number') return sceneSVG(bg);
  const g = { red: ['#3A0D12', '#A11A2B'], gold: ['#5A3A0A', '#E0A92E'], night: ['#0B1530', '#25365E'] }[bg] || ['#222', '#444'];
  return `<div class="cs-grad" style="background:linear-gradient(160deg,${g[0]},${g[1]})"></div>`;
}

let CUT = null;
// Кадры листаются вручную: «Далее» / «Назад» или тап по картинке. Тап во время печати — сразу весь текст
function playCutscene(id, onDone) {
  const frames = CUTS[id];
  if (!frames || (S.settings && S.settings.cuts === false)) { if (onDone) onDone(); return; }
  if (!S.cutSeen) S.cutSeen = {};
  S.cutSeen[id] = true;
  CUT = { id, frames, i: -1, onDone, timer: null, typing: false };
  openModal(`<div class="cs">
      <div class="cs-stage" id="csStage"></div>
      <div class="cs-caption" id="csCap"></div>
      <div class="cs-dots" id="csDots">${frames.map(() => '<i></i>').join('')}</div>
      <div class="cs-foot">
        <button class="btn small" data-act="cutSkip" data-silent="1">Пропустить ⏭</button>
        <div class="cs-nav"><button class="btn small" id="csBack" data-act="cutBack" data-silent="1">◀</button>
        <button class="btn primary" id="csNext" data-act="cutNextBtn" data-silent="1">Далее ▶</button></div></div>
    </div>`, { center: true, locked: true });
  $('csStage').onclick = () => cutTap();
  $('csCap').onclick = () => cutTap();
  cutNext();
}

function cutTap() {
  const c = CUT;
  if (!c) return;
  if (c.typing) { c.full(); return; }
  cutNext();
}

function cutBack() {
  const c = CUT;
  if (!c || c.i <= 0) return;
  c.i -= 2;
  cutNext();
}

function cutNext() {
  const c = CUT;
  if (!c || !$('csStage')) return;
  clearTimeout(c.timer);
  c.i++;
  if (c.i >= c.frames.length) { cutEnd(); return; }
  $('csBack').disabled = c.i === 0;
  $('csNext').textContent = c.i === c.frames.length - 1 ? 'Готово ✓' : 'Далее ▶';
  const f = c.frames[c.i];
  const fx = f.fx ? Array.from({ length: 14 }, (_, k) => `<span class="cs-fx" style="left:${rand(2, 94)}%;animation-delay:${(k * 0.18).toFixed(2)}s">${f.fx}</span>`).join('') : '';
  const props = (f.props || []).map((p) => `<span class="cs-prop ${p.anim || ''}" style="left:${p.x}%;top:${p.y}%">${p.e}</span>`).join('');
  const stage = $('csStage');
  stage.className = `cs-stage ${f.cam ? 'cam-' + f.cam : ''} ${f.night ? 'night' : ''}`;
  stage.innerHTML = `<div class="cs-bg">${cutBg(f.bg)}</div>${props}${f.actors.map(actorHTML).join('')}${fx}<div class="cs-vignette"></div>`;
  $('csDots').querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k <= c.i));
  // Подпись печатается по буквам; дальше игрок листает сам
  const cap = $('csCap');
  const text = f.text || f.actors.filter((a) => a.say).map((a) => a.say).join(' — ');
  cap.textContent = '';
  let n = 0;
  c.typing = true;
  c.full = () => { clearTimeout(c.timer); c.typing = false; if ($('csCap')) $('csCap').textContent = text; };
  const type = () => {
    if (CUT !== c || !$('csCap')) return;
    n += 2;
    cap.textContent = text.slice(0, n);
    if (n < text.length) c.timer = setTimeout(type, 28);
    else c.typing = false;
  };
  type();
  sfx(f.fx === '💥' || f.cam === 'shake' ? 'heavy' : f.fx === '❤️' ? 'good' : f.fx === '🎉' || f.fx === '⭐' ? 'win' : 'whoosh');
  if (f.cam === 'shake') haptic('heavy');
}

function cutEnd() {
  const c = CUT;
  if (!c) return;
  clearTimeout(c.timer);
  CUT = null;
  closeModal();
  track('cutscene');
  if (c.onDone) c.onDone();
}

ACTIONS.cutSkip = () => cutEnd();
ACTIONS.cutBack = () => cutBack();
ACTIONS.cutNextBtn = () => { if (CUT && CUT.typing) CUT.full(); else cutNext(); };

// ---------- Галерея: пересмотреть увиденные мультики ----------

const CUT_TITLES = {
  ch_fight: '👊 Слава на районе', path_honest: '😇 Честный путь', path_dark: '😈 Тёмная дорожка', ch_d_crew: '🦊 Своя бригада',
  boss_d_racket: '🥩 Бугай с рынка', ch_d_racket: '🥩 Рынок наш', ch_edik1: '🕵️ Эдик на рынке', ch_h_shelter: '🥣 Тёплый суп', ch_barsik: '🐈 Барсик нашёлся',
  ch_d_casino: '🎰 Ночь в казино', ch_love: '💘 Не хлебом единым', ch_h_court: '⚖️ Суд против Эдика', boss_d_betrayal: '🐀 Крыса в бригаде',
  ch_d_betrayal: '🐀 Предатель наказан', ch_edik2: '🏰 Логово Эдика', ch_d_heist: '🔦 Склад Эдика', boss: '😈 Последний разговор', ch_final: '🎉 Эдик повержен',
  ch_family: '💒 Семейное счастье', ch_legend: '👑 Легенда района',
  house_1: '📦 Коробка', house_2: '⛺ Шалаш', house_3: '🚪 Гараж', house_4: '🛏️ Общага', house_5: '🛁 Квартира', house_6: '🏰 Особняк',
  wedding: '💍 Свадьба', divorce: '💔 Развод', top_clerk: '🏛️ Глава района', top_deputy: '🎖️ Спикер', top_director: '🏢 Генеральный',
};
function cutSeenList() { return Object.keys(CUT_TITLES).filter((id) => CUTS[id] && S.cutSeen && S.cutSeen[id]); }
function cutGalleryCount() { return cutSeenList().length; }
function cutForQuest(qid) { return ['ch_' + qid, 'boss_' + qid].find((id) => CUTS[id] && S.cutSeen && S.cutSeen[id]) || null; }

function openCutGallery() {
  const list = cutSeenList();
  openModal(`<h3>🎬 Мультики</h3><p>Все мультики, которые ты уже видел. Листай кадры сам — кнопками «Далее» и «Назад».</p>
    <div class="cut-list">${list.map((id) => `<button class="btn" data-act="cutReplay" data-id="${id}" data-from="gallery">${CUT_TITLES[id]}</button>`).join('')}</div>
    <div class="btns"><button class="btn primary wide" data-act="close">Закрыть</button></div>`, { center: true });
}
ACTIONS.cutGallery = () => openCutGallery();
ACTIONS.cutReplay = (id, btn) => playCutscene(id, btn && btn.dataset.from === 'gallery' ? openCutGallery : null);

// ---------- Где показываются мультики ----------

function cutOnce(id) {
  if (!S.cutSeen) S.cutSeen = {};
  if (S.cutSeen[id]) return false;
  S.cutSeen[id] = true;
  return true;
}

const _completeQuestCut = completeQuest;
completeQuest = (q) => { if (CUTS['ch_' + q.id]) playCutscene('ch_' + q.id, () => _completeQuestCut(q)); else _completeQuestCut(q); };

const _questPathCut = ACTIONS.questPath;
ACTIONS.questPath = (id) => { const q = currentQuest(); if (!q || !q.choice) return; playCutscene('path_' + id, () => { _questPathCut(id); refresh(); }); };

const _bossFightCut = ACTIONS.bossFight;
ACTIONS.bossFight = () => {
  const q = currentQuest();
  const id = q && (q.boss === true ? 'boss' : 'boss_' + q.id);
  if (!q || !q.boss || !CUTS[id] || cdLeft('boss') > 0 || S.health < 50 || !cutOnce('cut_' + id)) { _bossFightCut(); return; }
  playCutscene(id, () => _bossFightCut());
};

// Переезд: мультик один раз для каждого жилья (при покупке или аренде)
const _houseCut = ACTIONS.house, _rentCut = ACTIONS.rentHouse;
ACTIONS.house = (id) => {
  const i = +id, h = HOUSING[i];
  if (i <= S.ownedHousing || S.money < h.price || level() < h.level) return;
  if (CUTS['house_' + i] && cutOnce('house_' + i)) playCutscene('house_' + i, () => _houseCut(id));
  else _houseCut(id);
};
ACTIONS.rentHouse = (id) => {
  const i = +id, h = HOUSING[i];
  if (!h.rent || S.money < h.rent || level() < h.level || i === S.housing) return;
  if (CUTS['house_' + i] && cutOnce('house_' + i)) playCutscene('house_' + i, () => { _rentCut(id); refresh(); });
  else _rentCut(id);
};

const _finishWeddingCut = finishWedding;
finishWedding = (w, perf) => playCutscene('wedding', () => _finishWeddingCut(w, perf));

const _startDivorceCut = startDivorce;
startDivorce = (byWife, reason) => { if (!wife()) return; playCutscene('divorce', () => _startDivorceCut(byWife, reason)); };
