const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../score-engine');
const players=[{id:'ana',name:'Ana',color:0},{id:'luis',name:'Luis',color:1}];
const make=()=>E.newGame('carioca','cumulative','Nuestra mesa',players,E.defaultConfig('cumulative'));
test('Carioca empieza con diez objetivos, Escala sucia antes de Escala real',()=>{
  const g=make();assert.equal(g.config.roundLimit,10);assert.equal(g.config.order,'low');
  assert.deepEqual(g.config.cariocaRounds.map(r=>r.name),['Dos tríos','Un trío y una escala','Dos escalas','Tres tríos','Dos tríos y una escala','Un trío y dos escalas','Tres escalas','Cuatro tríos','Escala sucia','Escala real']);
  assert.match(g.config.cariocaRounds[8].description,/mezclar pintas/);
  assert.match(g.config.cariocaRounds[9].description,/misma pinta/);
  assert.equal(E.roundLabel(g),'Ronda 1 de 10 · Dos tríos');
});
test('La partida corta contiene exactamente los primeros siete objetivos',()=>{
  assert.deepEqual(E.cariocaPreset('seven'),E.cariocaPreset().slice(0,7));
  const g=make();g.config.cariocaRounds=E.cariocaPreset('seven');g.config.cariocaVariant='seven';g.config.roundLimit=7;
  for(let i=0;i<7;i++)E.appendRound(g,`r${i}`,{ana:0,luis:10});
  assert.equal(g.finished,true);assert.equal(E.cariocaProgress(g).index,-1);assert.equal(E.ranking(g)[0].id,'ana');
  assert.doesNotThrow(()=>E.validateGame(g));
});
test('Escribir un borrador no avanza; guardar lo asocia al objetivo actual',()=>{
  const g=make();g.draft={ana:'20',luis:'0'};assert.equal(E.cariocaProgress(g).index,0);
  E.appendRound(g,'r1',{ana:20,luis:0});assert.equal(g.rounds[0].objectiveId,'carioca-1');assert.equal(E.roundLabel(g),'Ronda 2 de 10 · Un trío y una escala');assert.deepEqual(g.draft,{});
});
test('Editar puntos conserva el objetivo y las descripciones',()=>{
  const g=make();E.appendRound(g,'r1',{ana:20,luis:0});E.appendRound(g,'r2',{ana:0,luis:30});
  const before=JSON.stringify(g.config.cariocaRounds);g.rounds[0].scores.ana=40;
  assert.equal(E.roundLabel(g,g.rounds[0]),'Ronda 1 de 10 · Dos tríos');assert.equal(JSON.stringify(g.config.cariocaRounds),before);
  assert.equal(E.total(g,'ana'),40);assert.equal(E.cariocaProgress(g).index,2);
});
test('Eliminar una ronda no renumera los objetivos de las siguientes',()=>{
  const g=make();for(let i=0;i<3;i++)E.appendRound(g,`r${i}`,{ana:10,luis:0});
  g.rounds.splice(0,1);assert.equal(E.roundLabel(g,g.rounds[0]),'Ronda 2 de 10 · Un trío y una escala');
  assert.equal(E.roundLabel(g),'Ronda 1 de 10 · Dos tríos');
  E.appendRound(g,'replacement',{ana:3,luis:2});assert.equal(g.rounds.at(-1).objectiveId,'carioca-1');assert.equal(E.cariocaProgress(g).index,3);
  assert.doesNotThrow(()=>E.validateGame(g));
});
test('Personalizar orden, nombres y descripciones se conserva en copias',()=>{
  const g=make();g.config.cariocaVariant='custom';g.config.cariocaRounds=[{id:'familia',name:'Ronda de la familia',description:'Completa la combinación acordada.'},...E.cariocaPreset().slice(8).reverse()];g.config.roundLimit=3;
  E.appendRound(g,'r1',{ana:5,luis:10});const restored=E.validateGame(JSON.parse(JSON.stringify(g)));
  assert.deepEqual(restored,g);assert.equal(E.roundLabel(restored),'Ronda 2 de 3 · Escala real');
});
test('La décima ronda finaliza automáticamente y comparte victoria en empate',()=>{
  const g=make();for(let i=0;i<9;i++)E.appendRound(g,`r${i}`,{ana:5,luis:5});
  assert.equal(g.finished,false);assert.equal(E.roundLabel(g),'Ronda 10 de 10 · Escala real');
  E.appendRound(g,'last',{ana:0,luis:0});assert.equal(g.finished,true);assert.deepEqual(E.ranking(g).map(p=>p.rank),[1,1]);assert.equal(E.roundLabel(g),'10 de 10 rondas completadas');
  assert.throws(()=>E.appendRound(g,'extra',{ana:0,luis:0}));assert.doesNotThrow(()=>E.validateGame(g));
});
test('Las instantáneas para deshacer y rehacer conservan el avance y el resultado',()=>{
  const g=make();for(let i=0;i<9;i++)E.appendRound(g,`r${i}`,{ana:5,luis:0});
  const before=E.clone(g);E.appendRound(g,'last',{ana:5,luis:0});const after=E.clone(g);
  assert.equal(E.validateGame(before).finished,false);assert.equal(E.cariocaProgress(before).index,9);
  assert.equal(E.validateGame(after).finished,true);assert.equal(E.cariocaProgress(after).index,-1);
});
test('Recuperar una partida antigua no inventa objetivos ni cambia su límite',()=>{
  const g=make();delete g.config.cariocaRounds;delete g.config.cariocaVariant;g.config.roundLimit=0;g.config.order='high';g.config.target=200;
  g.rounds=[{id:'old',scores:{ana:5,luis:3}}];const restored=E.validateGame(JSON.parse(JSON.stringify(g)));
  assert.equal(E.cariocaProgress(restored),null);assert.equal(E.roundLabel(restored),'Ronda 2');assert.equal(restored.config.roundLimit,0);assert.equal(restored.config.order,'high');
  E.appendRound(restored,'new',{ana:2,luis:3});assert.equal(restored.rounds[1].objectiveId,undefined);assert.doesNotThrow(()=>E.validateGame(restored));
});
test('Se rechazan copias con objetivos duplicados, desconocidos o sin descripciones',()=>{
  const g=make();E.appendRound(g,'r1',{ana:0,luis:0});
  const duplicate=E.clone(g);duplicate.rounds.push({...duplicate.rounds[0],id:'r2'});assert.throws(()=>E.validateGame(duplicate),/objetivos/);
  const unknown=E.clone(g);unknown.rounds[0].objectiveId='inexistente';assert.throws(()=>E.validateGame(unknown),/objetivos/);
  const empty=E.clone(g);empty.config.cariocaRounds[0].description='';assert.throws(()=>E.validateGame(empty),/descripciones/);
  const noPlan=E.clone(g);delete noPlan.config.cariocaRounds;assert.throws(()=>E.validateGame(noPlan),/Falta/);
});
test('Las reglas guiadas validan longitud, puntuación y textos acotados',()=>{
  const g=make();g.config.roundLimit=7;assert.throws(()=>E.validateGame(g));g.config.roundLimit=10;
  g.config.order='high';assert.throws(()=>E.validateGame(g));g.config.order='low';
  g.config.cariocaRounds[0].description='a'.repeat(401);assert.throws(()=>E.validateGame(g));
});
