const ACH_NEW72=[
  ['trade72','Своя цена','💱','crimeSale72',[1,10,50],'обменов добычи'],
  ['loot72','Склад с характером','📦','crimeLoot72',[5,25,100],'успешных дел с добычей'],
  ['quote72','Поймать волну','📈','crimeHighSale72',[3,10,30],'продаж на 10% выше базы'],
  ['cities72','Межгород','🌍',()=>new Set(S.crimeSaleCities72||[]).size,[1,2,4],'городов обмена'],
  ['skills72','Мастерство','🧠','trickUp',[3,10,25],'улучшений навыков'],
  ['uses72','В нужный момент','✨','trick',[10,50,200],'активаций навыков'],
  ['family72','Заботливый дом','🏡','familyCare',[5,30,100],'забот о семье'],
  ['pets72','Верный друг','🐾','petPlay',[10,50,150],'игр с питомцами'],
  ['honest72','Доброе имя','🤝','honestStory',[1,6,12],'честных поручений'],
  ['bottles72','Бутылочная экономика','🍾',()=>S.stats.bottlesSpent||0,[10000,100000,1000000],'бутылок потрачено'],
  ['cars72','По ступенькам автосалона','🚙','transport',[3,8,20],'покупок транспорта'],
  ['homes72','Ключи от дома','🔑','house',[3,10,20],'покупок жилья']
];
function achRewardLabel72(r){return [r.caps?`${r.caps} крышек`:'',r.xp?`${r.xp} опыта`:'',r.bottles?`${fmt(r.bottles)} бутылок`:'',r.frame?`рамка «${r.frame==='market72'?'Знаток рынка':'Мастер навыков'}»`:''].filter(Boolean).join(' + ');}
ACH_NEW72.forEach(([id,name,emoji,key,goals,unit],i)=>{
  const rewards72=i%3===0?[{caps:2,xp:50},{caps:4,bottles:3000},{caps:8,xp:500}]:i%3===1?[{bottles:1000,xp:50},{bottles:5000,xp:150},{caps:8,bottles:15000}]:[{caps:2},{caps:5,xp:150},{caps:10,xp:500}];
  if(id==='quote72')rewards72[2].frame='market72';if(id==='skills72')rewards72[2].frame='scholar72';
  ACHS.push({id,name,emoji,goals,unit,rewards72,...(typeof key==='function'?{fn:key}:{key})});
});
for(const [id,name,how] of [['market72','Знаток рынка','Достижение «Поймать волну III»'],['scholar72','Мастер навыков','Достижение «Мастерство III»']])FRAMES.push({id,name,how,need:()=>!!S.achRewards72?.includes(id)});
const achClaimBefore72=ACTIONS.achClaim;
ACTIONS.achClaim=(id,btn)=>{
  const a=ACHS.find(a=>a.id===id);if(!a)return;
  if(!a.rewards72){achClaimBefore72(id,btn);return;}
  if(!achReady(a))return;
  const t=achTier(a),r=a.rewards72[t];S.ach[id]=t+1;
  if(r.caps)addCaps(r.caps);if(r.bottles)addBottles(r.bottles);if(r.xp)addXp(r.xp);
  if(r.frame)S.achRewards72=[...new Set([...(S.achRewards72||[]),r.frame])];
  save();sfx('ach');confetti(40);toast(achRewardLabel72(r),'good');
};
