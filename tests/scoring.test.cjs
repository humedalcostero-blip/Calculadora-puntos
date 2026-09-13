const {test} = require('node:test');
const assert = require('node:assert/strict');
const E = require('../score-engine');
const players = n => Array.from({length:n},(_,i)=>({id:`p${i}`,name:`Jugador ${i+1}`,color:i}));
const make = (mode, count=3, overrides={}) => E.newGame('game',mode,E.MODES[mode].name,players(count),{...E.defaultConfig(mode),...overrides});
const seven = fields => ({...E.SEVEN,...fields});
test('Catán base: poblados, ciudades, cartas y logros suman 13',()=>{
  const g=make('catan');Object.assign(g.stats.p0,{settlements:3,cities:2,vpCards:2,longestRoad:true,largestArmy:true});
  assert.equal(E.total(g,'p0'),13);
});
test('Catán C&C: la ciudad metrópolis vale cuatro puntos, y Mayor Ejército no puntúa',()=>{
  const g=make('catan',3,{citiesKnights:true});Object.assign(g.stats.p0,{settlements:1,cities:1,metropolises:1,largestArmy:true,defender:2,merchant:true});
  assert.equal(E.total(g,'p0'),8);
});
test('Regresión: las metrópolis NO se cuentan dos veces en la fuerza bárbara',()=>{
  const g=make('catan',4,{citiesKnights:true});Object.assign(g.stats.p0,{cities:2,basic:1});Object.assign(g.stats.p1,{cities:2,basic:1});Object.assign(g.stats.p2,{cities:1,metropolises:1});g.stats.p3.basic=1;
  assert.deepEqual(E.defense(g),{attack:5,strength:3,safe:false,affected:['p0','p1']});
});
test('Defensa: igualdad resiste, empate de mayores defensores no concede un ganador único',()=>{
  const g=make('catan',3,{citiesKnights:true});g.stats.p0.cities=2;g.stats.p0.basic=1;g.stats.p1.basic=1;
  assert.deepEqual(E.defense(g),{attack:2,strength:2,safe:true,affected:['p0','p1']});
});
test('Defensa pondera la fuerza, no la cantidad de caballeros',()=>{
  const g=make('catan',3,{citiesKnights:true});g.stats.p0.cities=1;g.stats.p0.basic=2;g.stats.p1.mighty=1;
  assert.equal(E.defense(g).strength,5);assert.deepEqual(E.defense(g).affected,['p1']);
});
test('Catan: opciones desactivadas no contribuyen; ajustes negativos sí',()=>{
  const g=make('catan');Object.assign(g.stats.p0,{harborCaptain:true,scenario:7,merchant:true,defender:2,custom:-3});
  assert.equal(E.total(g,'p0'),-3);g.config.harbor=true;g.config.seafarers=true;assert.equal(E.total(g,'p0'),6);
});
test('Catán valida piezas, tres metrópolis y exclusividad',()=>{
  const g=make('catan');g.stats.p0.cities=1;g.stats.p0.metropolises=2;assert.throws(()=>E.validateGame(g),/incluidas/);
  g.stats.p0.cities=2;g.stats.p1.cities=2;g.stats.p1.metropolises=2;assert.throws(()=>E.validateGame(g),/tres/);
  g.stats.p1.metropolises=0;g.stats.p0.longestRoad=true;g.stats.p1.longestRoad=true;assert.throws(()=>E.validateGame(g),/exclusiva/);
  g.stats.p1.longestRoad=false;g.stats.p0.mighty=3;assert.throws(()=>E.validateGame(g));
});
test('Ciencia: vacío, cuadrados y conjuntos',()=>{
  assert.equal(E.science(seven({})).score,0);
  assert.equal(E.science(seven({scienceTablet:3})).score,9);
  assert.equal(E.science(seven({scienceTablet:1,scienceGear:1,scienceCompass:1})).score,10);
  assert.equal(E.science(seven({scienceTablet:3,scienceGear:2,scienceCompass:1})).score,21);
});
test('Ciencia: el comodín puede completar conjunto o aumentar un cuadrado',()=>{
  assert.equal(E.science(seven({scienceTablet:1,scienceGear:1,scienceWild:1})).score,10);
  assert.equal(E.science(seven({scienceTablet:4,scienceWild:1})).score,25);
});
test('Ciencia: optimización contrastada con asignación recursiva independiente, 625 casos',()=>{
  function brute(counts,wild) {if(!wild)return counts[0]**2+counts[1]**2+counts[2]**2+7*Math.min(...counts);return Math.max(...[0,1,2].map(i=>{const next=[...counts];next[i]++;return brute(next,wild-1);}));}
  for(let a=0;a<5;a++)for(let b=0;b<5;b++)for(let c=0;c<5;c++)for(let w=0;w<5;w++) assert.equal(E.science(seven({scienceTablet:a,scienceGear:b,scienceCompass:c,scienceWild:w})).score,brute([a,b,c],w));
});
test('7 Wonders: cada 3 monedas, derrotas negativas y puntuación completa',()=>{
  const g=make('seven');Object.assign(g.stats.p0,{wonder:7,coins:8,defeat:2,victory1:2,victory3:1,victory5:2,civil:12,commercial:5,guilds:6,scienceTablet:1,scienceGear:1,scienceCompass:1});
  assert.equal(E.total(g,'p0'),55);assert.equal(E.sevenParts(g.stats.p0).Tesorería,2);
  for(const [coins,pv] of [[0,0],[1,0],[2,0],[3,1],[5,1],[6,2]])assert.equal(E.sevenParts(seven({coins})).Tesorería,pv);
});
test('7 Wonders: desempate por monedas; empate real comparte puesto',()=>{
  const g=make('seven');g.stats.p0.civil=10;g.stats.p0.coins=2;g.stats.p1.civil=10;g.stats.p1.coins=1;g.stats.p2.civil=10;g.stats.p2.coins=2;
  const rows=E.ranking(g);assert.deepEqual(rows.map(p=>p.id),['p0','p2','p1']);assert.deepEqual(rows.map(p=>p.rank),[1,1,3]);
});
test('7 Wonders: expansiones, deudas y ajustes',()=>{
  const g=make('seven');Object.assign(g.stats.p0,{leaders:8,cities:5,debt:4,extra:-2});assert.equal(E.total(g,'p0'),7);
});
test('Rondas: positivos, negativos, cero y empate verdadero',()=>{
  const g=make('free');g.rounds=[{id:'r1',scores:{p0:20,p1:0,p2:10}},{id:'r2',scores:{p0:-10,p1:10,p2:0}}];
  assert.deepEqual(E.ranking(g).map(p=>[p.total,p.rank]),[[10,1],[10,1],[10,1]]);
});
test('Carioca: menor gana incluso con puntajes negativos',()=>{
  const g=make('cumulative');g.rounds=[{id:'r1',scores:{p0:0,p1:-10,p2:100}}];assert.equal(E.ranking(g)[0].id,'p1');
});
test('Llegar o superar la meta cierra; no todos los que la cruzan son ganadores',()=>{
  const g=make('limit');g.rounds=[{id:'r1',scores:{p0:110,p1:120,p2:80}}];assert.equal(E.reached(g),true);assert.equal(E.ranking(g)[0].id,'p1');
  g.config.target=121;assert.equal(E.reached(g),false);
});
test('Personalizado: multiplicadores positivos, negativos y cantidades negativas',()=>{
  const g=make('custom',2,{kind:'sheet',categories:[{id:'gems',name:'Gemas',factor:3},{id:'penalty',name:'Penalizaciones',factor:-2}]});g.stats.p0={gems:4,penalty:3};g.stats.p1={gems:-1,penalty:0};
  assert.equal(E.total(g,'p0'),6);assert.equal(E.total(g,'p1'),-3);
});
test('UNO: una mano solo asigna puntos positivos a un ganador',()=>{
  const g=make('uno');g.rounds=[{id:'r1',scores:{p0:30,p1:20,p2:0}}];assert.throws(()=>E.validateGame(g),/una sola/);g.rounds[0].scores.p1=0;assert.doesNotThrow(()=>E.validateGame(g));g.rounds[0].scores.p1=-1;assert.throws(()=>E.validateGame(g));
});
test('Entradas: rechaza vacíos, decimales, exponentes, infinito, valores enormes y objetos',()=>{
  for(const value of ['', '1.5','1e3','Infinity',NaN,Infinity,1.5,1000000,{},[],null,true])assert.throws(()=>E.integer(value));
  for(const value of [0,-50,'12','-12'])assert.equal(E.integer(value),Number(value));
});
test('Importación: normaliza cadenas numéricas antes de sumar',()=>{
  const g=make('free');g.rounds=[{id:'r1',scores:{p0:'12',p1:'3',p2:0}},{id:'r2',scores:{p0:'8',p1:0,p2:0}}];assert.equal(E.total(E.validateGame(g),'p0'),20);
  const s=make('seven');s.stats.p0.civil='12';assert.equal(E.total(E.validateGame(s),'p0'),12);
});
test('Importación: rechaza estructura corrupta, ids peligrosos, estadísticas incompletas y comodines excesivos',()=>{
  assert.throws(()=>E.validateGame({}));
  const g=make('seven');g.stats.p0.scienceWild=21;assert.throws(()=>E.validateGame(g));g.stats.p0.scienceWild=0;delete g.stats.p0.coins;assert.throws(()=>E.validateGame(g));
  const h=make('free');h.players[0].id='__proto__';assert.throws(()=>E.validateGame(h));
});
test('Límites de participantes y reglas personalizadas',()=>{
  assert.throws(()=>make('seven',2));assert.throws(()=>make('seven',8));assert.throws(()=>make('catan',2));assert.throws(()=>make('uno',11));assert.doesNotThrow(()=>make('free',12));
  assert.throws(()=>make('custom',2,{kind:'sheet',categories:[]}));assert.throws(()=>make('limit',2,{target:0}));
});
test('Copia JSON conserva todas las puntuaciones y la clasificación',()=>{
  for(const mode of Object.keys(E.MODES)){const g=make(mode);const restored=E.validateGame(JSON.parse(JSON.stringify(g)));assert.deepEqual(E.ranking(restored),E.ranking(g));}
});
