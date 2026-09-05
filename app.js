/* A la mesa — local-first, dependency-free interface. */
'use strict';
const E = ScoreEngine;
const $ = selector => document.querySelector(selector);
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = n => new Intl.NumberFormat('es-CL').format(n);
const uid = () => globalThis.crypto?.randomUUID?.() || `g${Date.now()}${Math.random().toString(36).slice(2)}`;
const COLORS = ['#dbe9d1','#f5dfbd','#d6e4f3','#ead9ec','#f2d4cf','#d2e9e3','#e5dfbd','#dddaf1','#f3e6ca','#ceded8','#e8d2de','#dae4bd'];
const KEY = 'alamesa-v2';
let data = { games: [], templates: [], theme: 'light', activeId: null };
let storageError = '', view = 'home', setup = null, gameId = null, editor = null, toastTimer, installPrompt;
let lastSavedRaw = null, storageConflict = false;
const histories = new Map();
try {
  const raw = localStorage.getItem(KEY);
  lastSavedRaw = raw;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.games) || parsed.games.length > 30) throw Error('Formato de partidas inválido.');
    data.games = parsed.games.map(E.validateGame);
    data.activeId = data.games.some(g => g.id === parsed.activeId) ? parsed.activeId : null;
    data.theme = parsed.theme === 'dark' ? 'dark' : 'light';
    data.templates = (Array.isArray(parsed.templates) ? parsed.templates : []).slice(0,12).filter(t => {
      try { E.newGame('template', 'custom', t.name, [{id:'p1',name:'Uno',color:0},{id:'p2',name:'Dos',color:1}], t.config); return true; } catch { return false; }
    });
  } else data.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
} catch { storageConflict = true; storageError = 'No se pudo recuperar el guardado. Se conserva sin sobrescribir. Exporta cualquier partida nueva antes de cerrar.'; }
function save() {
  try {
    if (storageConflict || localStorage.getItem(KEY) !== lastSavedRaw) {
      storageConflict = true;
      storageError = 'Hay un guardado distinto o dañado. Exporta tus cambios y recarga antes de seguir; no se sobrescribirá.';
    } else {
      const raw = JSON.stringify(data); localStorage.setItem(KEY, raw); lastSavedRaw = raw; storageError = '';
    }
  } catch { storageError = 'No se pudo guardar en este dispositivo. Exporta la partida para conservarla.'; }
  const status = $('#save-status');
  if (status) status.textContent = storageError ? 'Guardado no disponible' : 'Guardado en este dispositivo';
  const warning = $('#storage-warning');
  if (warning) { warning.hidden = !storageError; warning.textContent = storageError; }
}
const game = () => data.games.find(g => g.id === gameId);
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('show'); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3800); }
const paths = {
  plus:'<path d="M12 5v14M5 12h14"/>', arrow:'<path d="m9 5 7 7-7 7"/>', back:'<path d="m14 5-7 7 7 7"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>',
  dice:'<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M4 12h16"/><path d="M9 7h.01M15 17h.01M9 17h.01"/>',
  cards:'<rect x="7" y="3" width="12" height="17" rx="3"/><path d="M4 7v12a3 3 0 0 0 3 3m6-15v9m-3-6h6"/>',
  hex:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="m8 14 4-6 4 6Zm-2 3h12"/>',
  columns:'<path d="m3 7 9-4 9 4ZM4 21h16M6 10v7m6-7v7m6-7v7M4 18h16"/>',
  flag:'<path d="M5 21V4c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  sliders:'<path d="M4 6h5m4 0h7M4 12h9m4 0h3M4 18h2m4 0h10"/><circle cx="11" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
  history:'<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6m3-3v6l4 2"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
  moon:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  check:'<path d="m5 12 4 4L19 6"/>', shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  undo:'<path d="M4 10h10a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5"/>', redo:'<path d="M20 10H10a6 6 0 0 0 0 12m10-12-5-5m5 5-5 5"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>', trophy:'<path d="M8 3h8v8a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 3v5m-4 1h8"/>', edit:'<path d="m4 16 12-12 4 4L8 20H4Zm10-10 4 4"/>'
};
function icon(name, cls = '') { return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.dice}</svg>`; }
function avatar(p) { return `<span class="avatar" style="--player-color:${COLORS[p.color]}">${esc(p.name.trim().split(/\s+/).slice(0,2).map(s => [...s][0] || '').join('').toUpperCase())}</span>`; }
const button = (action, text, cls = 'secondary', extra = '') => `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
function nav(mobile = false) {
  const items = [['home','home','Jugar'],['library','history','Mis partidas'],['help','help','Guía']];
  return `<nav class="${mobile ? 'bottom-nav' : 'desktop-nav'}" aria-label="${mobile ? 'Navegación móvil' : 'Navegación principal'}">${items.map(([v,i,t]) => `<button class="nav-btn ${view === v || (v === 'home' && ['setup','game'].includes(view)) ? 'active' : ''}" data-action="nav" data-view="${v}" ${view === v ? 'aria-current="page"' : ''}>${mobile ? icon(i) : ''}${t}</button>`).join('')}</nav>`;
}
function render() {
  document.documentElement.dataset.theme = data.theme;
  const content = view === 'setup' ? setupHTML() : view === 'game' && game() ? gameHTML() : view === 'library' ? libraryHTML() : view === 'help' ? helpHTML() : homeHTML();
  $('#app').innerHTML = `<header class="header"><div class="header-inner"><button class="brand" data-action="nav" data-view="home" aria-label="A la mesa, inicio"><img src="icon.svg" alt="">A la mesa<span class="sr-only"> · Marcador de juegos</span></button>${nav()}<div class="header-tools"><span class="save-status"><span class="status-dot"></span><span id="save-status">${storageError ? 'Guardado no disponible' : 'Guardado en este dispositivo'}</span></span><button class="icon-btn" data-action="theme" aria-label="Activar modo ${data.theme === 'dark' ? 'claro' : 'oscuro'}">${icon(data.theme === 'dark' ? 'sun' : 'moon')}</button></div></div></header><main class="main" id="main" tabindex="-1"><div id="storage-warning" class="banner-error" role="alert" ${storageError ? '' : 'hidden'}>${esc(storageError)}</div>${content}</main>${nav(true)}`;
}
function go(v) { closeDialog(); view = v; render(); window.scrollTo({ top: 0 }); $('#main').focus({preventScroll:true}); }
function homeHTML() {
  const recent = data.games.find(g => g.id === data.activeId && !g.finished) || data.games.find(g => !g.finished);
  return `<div class="home-top"><div class="intro"><p class="eyebrow">MENOS CUENTAS. MÁS PARTIDAS.</p><h1>¿Qué jugamos hoy?</h1><p>Elige un juego. Reúne a tu mesa. Lleva los puntos.</p></div><span class="badge">${icon('dice')} Tu compañero de mesa</span></div>
  ${recent ? `<section class="panel resume"><div class="resume-icon">${icon(E.MODES[recent.mode].icon)}</div><div><p class="eyebrow">TU PARTIDA SIGUE AQUÍ</p><h2>${esc(recent.name)}</h2><p class="small">${recent.players.length} participantes · ${E.kind(recent) === 'rounds' ? `${recent.rounds.length} rondas guardadas` : 'Puntuación por categorías'}</p></div>${button('open',`Continuar ${icon('arrow')}`,'',`data-id="${recent.id}"`)}</section>` : ''}
  <div class="section-top"><h2>Elige tu juego</h2><span class="muted small">8 modos</span></div><div class="mode-grid">${Object.entries(E.MODES).map(([id,m]) => `<button class="mode-card" data-action="choose-mode" data-mode="${id}"><span class="game-icon">${icon(m.icon)}</span>${icon('arrow','arrow')}<strong>${m.name}</strong><small>${m.description}</small></button>`).join('')}</div>
  ${data.templates.length ? `<div class="section-top" style="margin-top:28px"><h2>Tus juegos personalizados</h2></div><div class="mode-grid">${data.templates.map((t,i) => `<button class="mode-card" data-action="template" data-index="${i}"><span class="game-icon">${icon('sliders')}</span><strong>${esc(t.name)}</strong><small>${t.config.kind === 'sheet' ? `${t.config.categories.length} categorías` : 'Por rondas'} · ${t.config.order === 'high' ? 'Mayor' : 'Menor'} puntaje gana</small></button>`).join('')}</div>` : ''}
  <p class="footnote">${icon('shield')} Sin cuentas. Tus partidas se guardan en este dispositivo.</p>`;
}
function startSetup(mode, template) {
  const last = data.games.find(g => g.id === data.activeId);
  const minimum = ['catan','seven'].includes(mode) ? 3 : 2;
  const max = mode === 'catan' ? 6 : mode === 'seven' ? 7 : mode === 'uno' ? 10 : 12;
  const players = last ? E.clone(last.players).slice(0,max) : [];
  while (players.length < minimum) players.push({ id: uid(), name: `Jugador ${players.length+1}`, color: players.length });
  setup = { mode, name: template?.name || E.MODES[mode].name, players, config: template ? E.clone(template.config) : E.defaultConfig(mode), saveTemplate: !!template };
  go('setup');
}
function numberField(id, label, value, note = '', min = 0, max = 999999) { return `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${value}" required>${note ? `<small>${note}</small>` : ''}</div>`; }
function setupHTML() {
  const s = setup, c = s.config, m = E.MODES[s.mode];
  const custom = s.mode === 'custom';
  const rounds = custom ? c.kind === 'rounds' : m.kind === 'rounds';
  return `${button('nav',`${icon('back')} Cambiar juego`,'ghost back','data-view="home"')}<div class="page-heading"><div><p class="eyebrow">PREPARA LA MESA</p><h1 style="margin-top:7px">${m.name}</h1></div><span class="game-icon">${icon(m.icon)}</span></div>
  <form id="setup-form"><div class="setup-layout"><section class="panel"><div class="section-top"><h2>¿Quiénes juegan?</h2><span class="badge">${s.players.length} participantes</span></div><div class="players">${s.players.map((p,i) => `<div class="player-edit">${avatar(p)}<label class="sr-only" for="name-${p.id}">Nombre del participante ${i+1}</label><input id="name-${p.id}" name="name-${p.id}" value="${esc(p.name)}" maxlength="28" autocomplete="off" required><button class="icon-btn" data-action="remove-player" data-id="${p.id}" type="button" aria-label="Quitar participante ${i+1}">${icon('close')}</button></div>`).join('')}</div>${button('add-player',`${icon('plus')} Agregar participante`,'secondary wide','style="margin-top:16px"')}<p class="hint" style="margin-top:14px">${s.mode === 'seven' ? 'De 3 a 7 jugadores. No corresponde a 7 Wonders Duel.' : s.mode === 'catan' ? 'De 3 a 4 jugadores; para 5 o 6 necesitas la ampliación.' : s.mode === 'uno' ? 'De 2 a 10 jugadores.' : 'De 2 a 12 participantes. También puedes usar nombres de equipos.'}</p></section>
  <section class="panel stack"><h2>Reglas de la partida</h2><div class="field"><label for="game-name">Nombre de la partida</label><input id="game-name" name="game-name" maxlength="60" value="${esc(s.name)}" required></div>
  ${custom ? `<div class="field"><label for="custom-kind">Cómo anotar</label><select id="custom-kind" name="custom-kind"><option value="rounds" ${c.kind === 'rounds' ? 'selected' : ''}>Por rondas</option><option value="sheet" ${c.kind === 'sheet' ? 'selected' : ''}>Por categorías</option></select></div>` : ''}
  ${['free','domino','custom','cumulative'].includes(s.mode) ? `<div class="field"><label for="order">Quién gana</label><select id="order" name="order"><option value="high" ${c.order === 'high' ? 'selected' : ''}>Mayor puntaje</option><option value="low" ${c.order === 'low' ? 'selected' : ''}>Menor puntaje</option></select></div>` : `<p class="note">${s.mode === 'seven' ? 'Gana el mayor puntaje; las monedas desempatan. La ciencia y la tesorería se calculan automáticamente.' : s.mode === 'uno' ? 'Quien gana la mano recibe los puntos de las cartas que les quedan a los demás. La meta clásica es 500.' : 'Gana el mayor puntaje. Configura la meta de tu mesa.'}</p>`}
  ${s.mode !== 'seven' ? numberField('target',s.mode === 'catan' ? 'Meta de victoria' : 'Meta de puntos',c.target, ['limit','uno','catan'].includes(s.mode) ? 'Puntos necesarios para terminar.' : '0 = sin meta. Con meta, se cierra cuando alguien la alcanza.', ['limit','uno','catan'].includes(s.mode) ? 1 : 0) : ''}
  ${rounds ? numberField('round-limit','Cantidad de rondas',c.roundLimit,'0 = sin límite de rondas.',0,500) : ''}
  ${s.mode === 'cumulative' ? '<p class="hint">Anota el valor de las cartas según la variante de Carioca de tu mesa. Puedes fijar cuántas rondas jugarán.</p>' : ''}
  ${s.mode === 'domino' ? '<p class="hint">Marcador flexible: anota los puntos de cada mano según la variante acordada. No decide cierres ni cuenta fichas automáticamente.</p>' : ''}
  ${s.mode === 'catan' ? `<div><h3>Expansiones y escenarios</h3>${[['citiesKnights','Ciudades y Caballeros','Metrópolis, caballeros y defensa. Meta habitual: 13.'],['seafarers','Navegantes','Puntos especiales del escenario.'],['harbor','Capitán del puerto','Bonificación de 2 puntos; ajusta la meta de tu escenario.'],['other','Otros escenarios','Puntos adicionales y misiones.']].map(([k,t,n])=>`<label class="check"><input type="checkbox" name="${k}" ${c[k]?'checked':''}><span><strong>${t}</strong><small class="muted">${n}</small></span></label>`).join('')}</div>` : ''}
  ${custom && c.kind === 'sheet' ? `<div><div class="section-top"><h3>Categorías</h3><span class="small muted">Puntos × valor</span></div><div class="categories">${c.categories.map(cat => `<div class="category-edit"><input name="cat-name-${cat.id}" aria-label="Nombre de categoría" value="${esc(cat.name)}" maxlength="32" required><input name="cat-factor-${cat.id}" aria-label="Valor por unidad de ${esc(cat.name)}" type="number" min="-100" max="100" step="1" value="${cat.factor}" required><button class="icon-btn" type="button" data-action="remove-category" data-id="${cat.id}" aria-label="Quitar ${esc(cat.name)}">${icon('close')}</button></div>`).join('')}</div>${button('add-category',`${icon('plus')} Agregar categoría`,'secondary wide','style="margin-top:12px"')}<p class="hint" style="margin-top:8px">Ejemplo: gemas × 3, penalizaciones × −1. Hasta 16 categorías.</p></div>` : ''}
  ${custom ? `<label class="check"><input name="save-template" type="checkbox" ${s.saveTemplate?'checked':''}><span>Guardar estas reglas en «Tus juegos»</span></label>` : ''}</section></div>
  <p id="setup-error" class="error" role="alert"></p><div class="setup-action"><p>Todo listo para una buena partida.</p><button class="btn" type="submit">Comenzar partida ${icon('arrow')}</button></div></form>`;
}
function readSetup() {
  const f = new FormData($('#setup-form')), c = setup.config;
  setup.name = String(f.get('game-name') || '').trim();
  setup.players.forEach(p => p.name = String(f.get(`name-${p.id}`) || '').trim());
  if (f.has('order')) c.order = f.get('order');
  if (f.has('target')) c.target = E.integer(f.get('target'),0);
  if (f.has('round-limit')) c.roundLimit = E.integer(f.get('round-limit'),0,500);
  c.categories.forEach(cat => { cat.name = String(f.get(`cat-name-${cat.id}`) || cat.name).trim(); if (f.has(`cat-factor-${cat.id}`)) cat.factor = E.integer(f.get(`cat-factor-${cat.id}`),-100,100); });
  if (f.has('custom-kind')) c.kind = f.get('custom-kind');
  for (const k of ['citiesKnights','seafarers','harbor','other']) if (setup.mode === 'catan') c[k] = f.has(k);
  setup.saveTemplate = f.has('save-template');
}
function rankHTML(g, editable = true) {
  return E.ranking(g).map(p => `<${editable && E.kind(g) === 'sheet' && !g.finished ? 'button' : 'div'} class="rank-row ${p.rank === 1 ? 'leader' : ''}" ${editable && E.kind(g) === 'sheet' && !g.finished ? `type="button" data-action="edit-player" data-id="${p.id}" aria-label="Editar puntos de ${esc(p.name)}"` : ''}><span class="rank">${p.rank === 1 ? icon('trophy') : p.rank}</span>${avatar(p)}<span class="rank-main"><strong>${esc(p.name)}</strong><small>${g.mode === 'seven' ? `${fmt(p.coins)} monedas · desempate` : E.kind(g) === 'sheet' && !g.finished ? 'Toca para anotar' : p.rank === 1 && E.ranking(g).filter(x=>x.rank===1).length>1 ? 'Empate en el primer lugar' : `Posición ${p.rank}`}</small></span><span class="points">${fmt(p.total)}<small>puntos</small></span>${E.kind(g)==='sheet' && !g.finished ? icon('arrow') : ''}</${editable && E.kind(g) === 'sheet' && !g.finished ? 'button' : 'div'}>`).join('');
}
function atEnd(g) { return E.reached(g) || (g.config.roundLimit > 0 && g.rounds.length >= g.config.roundLimit); }
function gameHTML() {
  const g = game(), m = E.MODES[g.mode], isRound = E.kind(g) === 'rounds', h = histories.get(g.id) || {undo:[],redo:[]};
  const rows = E.ranking(g), leaders = rows.filter(p=>p.rank===1), ended = atEnd(g);
  const winner = g.winnerId ? g.players.filter(p=>p.id===g.winnerId) : leaders;
  const pending = Object.values(g.draft).some(v=>v !== '');
  return `<div class="page-heading game-heading"><div><div class="game-title"><span class="game-icon">${icon(m.icon)}</span><h1>${esc(g.name)}</h1></div><div class="game-subtitle"><span class="badge green">${g.finished ? 'Finalizada' : isRound ? `Ronda ${g.rounds.length + 1}` : 'En juego'}</span><span class="badge">${g.config.order === 'low' ? 'Menor' : 'Mayor'} puntaje gana</span>${g.config.target ? `<span class="badge">Meta: ${fmt(g.config.target)}</span>` : ''}</div></div><div class="toolbar"><button class="icon-btn" data-action="game-menu" aria-label="Opciones de partida">${icon('more')}</button></div></div>
  ${g.finished ? `<section class="panel finish-banner"><p class="eyebrow">RESULTADO FINAL</p><h2>${winner.length > 1 ? 'Empate: ' : 'Victoria de '}${winner.map(p=>esc(p.name)).join(' y ')}</h2><p class="small">${g.mode === 'catan' && g.winnerId ? 'Victoria confirmada en su turno.' : `${fmt(leaders[0].total)} puntos${g.mode === 'seven' ? ' · desempate por monedas aplicado' : ''}.`}</p>${button('rematch',`${icon('dice')} Jugar de nuevo`)} ${button('reopen','Corregir resultado','ghost')}</section>` : ended ? `<section class="panel finish-banner"><p class="eyebrow">${E.reached(g) ? 'META ALCANZADA' : 'ÚLTIMA RONDA GUARDADA'}</p><h2>${g.mode === 'catan' ? 'Confirma la victoria en su turno' : 'La partida está lista para cerrar'}</h2><p class="small">${g.mode === 'catan' ? 'Llegar a la meta fuera de tu turno no declara la victoria.' : 'Revisa los puntos y finaliza para guardar el resultado.'}</p></section>` : ''}
  <div class="game-layout ${isRound ? '' : 'sheet'}"><section class="panel rounds-ranking"><div class="section-top"><h2>La mesa</h2><span class="badge">${g.players.length} jugadores</span></div><div class="scoreboard">${rankHTML(g)}</div>${g.mode === 'catan' ? '<p class="hint" style="margin-top:14px">Incluye las cartas de victoria al revisar el total. Los puntos ocultos se muestran en esta pantalla.</p>' : ''}</section>
  ${isRound && !g.finished ? `<section class="panel"><div class="section-top"><div><p class="eyebrow">${ended?'META ALCANZADA':'ANOTA LA RONDA'}</p><h2>${ended?'Revisa el historial':`Ronda ${g.rounds.length+1}`}</h2></div>${g.mode==='uno'?button('uno-helper','Contar cartas','ghost'):''}</div>${ended ? '<p class="hint">Puedes editar las rondas anteriores o deshacer la última antes de finalizar.</p>' : `<form id="round-form"><div>${g.players.map(p => `<div class="round-entry">${avatar(p)}<div><label for="round-${p.id}"><strong>${esc(p.name)}</strong></label><small id="preview-${p.id}">${fmt(E.total(g,p.id))} puntos actuales</small></div><div class="round-input">${g.mode!=='uno'?`<button type="button" class="sign" data-action="sign" data-id="${p.id}" aria-label="Cambiar signo de los puntos de ${esc(p.name)}">±</button>`:''}<input id="round-${p.id}" name="${p.id}" type="number" inputmode="numeric" step="1" min="${g.mode==='uno'?0:-999999}" max="999999" placeholder="—" value="${esc(g.draft[p.id]??'')}" aria-label="Puntos de ${esc(p.name)} en esta ronda"></div></div>`).join('')}</div><p class="round-preview">${g.mode==='uno'?'Asigna los puntos solo a quien ganó la mano.':'Puedes restar con ±. Escribe 0 si no hubo puntos.'}</p><p id="round-error" class="error" role="alert"></p><div class="round-footer"><button class="btn wide" type="submit">${icon('plus')} Guardar ronda</button></div></form>`}</section>` : ''}</div>
  ${g.mode==='catan' && g.config.citiesKnights ? defenseHTML(g) : ''}
  ${!g.finished ? `<div class="sticky-actions"><button class="icon-btn" data-action="undo" aria-label="Deshacer último cambio" ${h.undo.length?'':'disabled'}>${icon('undo')}</button><button class="icon-btn" data-action="redo" aria-label="Rehacer último cambio" ${h.redo.length?'':'disabled'}>${icon('redo')}</button>${isRound && !ended ? `<button class="btn" type="submit" form="round-form">${icon('plus')} Guardar ronda</button>` : button('finish',`${icon('check')} Finalizar partida`,'')}</div>` : ''}
  ${isRound ? `<section class="panel history"><div class="section-top"><h2>Historial de rondas</h2><span class="badge">${g.rounds.length} guardadas</span></div>${g.rounds.length ? g.rounds.map((r,i)=>`<div class="history-item"><div><strong>Ronda ${i+1}</strong><small>${g.players.map(p=>`${esc(p.name)}: ${r.scores[p.id]>0?'+':''}${fmt(r.scores[p.id])}`).join(' · ')}</small></div>${!g.finished ? `<button class="icon-btn" data-action="edit-round" data-index="${i}" aria-label="Editar ronda ${i+1}">${icon('edit')}</button>` : ''}</div>`).reverse().join('') : `<div class="empty">${icon('history')}<strong>Aquí empieza la historia.</strong>Las rondas que guardes aparecerán aquí.</div>`}</section>` : ''}
  <p class="footnote">${icon('shield')} ${pending ? 'Borrador de ronda guardado en este dispositivo.' : 'Tus cambios se guardan en este dispositivo.'}</p>`;
}
function defenseHTML(g) {
  const d = E.defense(g), names = d.affected.map(id=>esc(g.players.find(p=>p.id===id).name)).join(' y ');
  const explanation = !d.attack ? 'No hay ciudades que defender.' : d.safe ? d.affected.length===1 ? `${names} recibe 1 punto de Defensor al resolver el ataque.` : `${names}: empate en defensa. Cada uno toma una carta de progreso; nadie recibe puntos de Defensor.` : names ? `${names} debe reducir una ciudad a poblado. Las metrópolis están protegidas.` : 'No hay ciudades vulnerables que reducir.';
  return `<section class="panel history"><div class="section-top"><h2>Defensa de Catán</h2><span class="badge ${d.safe?'green':''}">${d.safe?'La isla resiste':'Defensa insuficiente'}</span></div><div class="defense-grid"><div class="metric"><span>Fuerza bárbara</span><strong>${d.attack}</strong></div><div class="metric"><span>Caballeros activos</span><strong>${d.strength}</strong></div></div><p class="hint">Cada ciudad, incluidas las metrópolis, cuenta una sola vez.</p><p class="note" style="margin-top:14px">${explanation}</p>${!g.finished ? button('resolve-attack','Resolver ataque y desactivar caballeros','secondary wide','style="margin-top:15px"'+(!d.attack?' disabled':'')) : ''}</section>`;
}
function libraryHTML() {
  return `<div class="page-heading"><div><p class="eyebrow">LAS BUENAS PARTIDAS SE RECUERDAN</p><h1 style="margin-top:8px">Mis partidas</h1></div><button class="icon-btn" data-action="import" aria-label="Importar una partida">${icon('upload')}</button></div><p class="hint" style="margin-bottom:22px">Guardadas en este navegador. Exporta una copia para llevarlas a otro dispositivo.</p><div class="library-grid">${data.games.length ? [...data.games].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(g=>`<section class="panel saved-game"><div class="section-top"><span class="game-icon">${icon(E.MODES[g.mode].icon)}</span><span class="badge ${g.finished?'':'green'}">${g.finished?'Finalizada':'En curso'}</span></div><div><h2>${esc(g.name)}</h2><p class="small muted" style="margin-top:8px">${new Date(g.updatedAt).toLocaleDateString('es-CL')} · ${g.players.length} participantes</p><p class="small muted">${g.players.map(p=>esc(p.name)).join(', ')}</p></div><div class="toolbar">${button('open',g.finished?'Ver resultado':'Continuar','',`data-id="${g.id}"`)}<button class="icon-btn" data-action="export" data-id="${g.id}" aria-label="Exportar ${esc(g.name)}">${icon('download')}</button><button class="icon-btn danger" data-action="delete" data-id="${g.id}" aria-label="Eliminar ${esc(g.name)}">${icon('close')}</button></div></section>`).join('') : `<section class="panel empty">${icon('history')}<strong>Tu próxima partida empieza aquí.</strong><p>Elige un juego y se guardará automáticamente.</p>${button('nav','Elegir juego','','data-view="home" style="margin-top:18px"')}</section>`}</div>${installPrompt ? button('install','Añadir a la pantalla de inicio','secondary','style="margin-top:20px"') : ''}`;
}
function helpHTML() {
  return `<div class="intro"><p class="eyebrow">REGLAS CLARAS, CUENTAS TRANQUILAS</p><h1>Una ayuda en la mesa.</h1><p>Lo necesario para empezar y saber qué se calcula.</p></div><div class="rules-list">
  <details open><summary>Tu primera partida, en tres pasos</summary><ol class="help-list"><li>Elige el juego, escribe los nombres y revisa quién gana.</li><li>En rondas, anota los puntos y pulsa «Guardar ronda». En Catán y 7 Wonders, toca a un jugador para abrir su ficha.</li><li>Revisa la clasificación y pulsa «Finalizar partida». Puedes corregir el resultado o jugar una revancha.</li></ol></details>
  <details><summary>Guardar, corregir y recuperar</summary><p>Las partidas y los borradores de rondas se guardan en este navegador. En las fichas, pulsa «Guardar puntos» para aplicar. «Deshacer» y «Rehacer» recuerdan los últimos 40 cambios mientras la aplicación esté abierta. Puedes editar cualquier ronda desde su historial.</p><p>En «Mis partidas», la flecha hacia abajo descarga una copia; la flecha hacia arriba la recupera. Borrar los datos del navegador elimina las partidas locales. El archivo de copia permite conservarlas. No hay sincronización entre dispositivos.</p><p>Con una primera carga completa desde un servidor compatible, la aplicación queda disponible sin conexión. Para tenerla a mano, usa «Añadir a pantalla de inicio» en el menú del navegador.</p></details>
  <details><summary>Catán: ciudades, metrópolis y victoria</summary><p>Los poblados valen 1 punto y las ciudades 2. En «Ciudades» cuenta también las que tienen metrópolis: cada metrópolis añade 2 puntos, pero no añade otra ciudad a la fuerza bárbara. Con Ciudades y Caballeros no se cuenta Mayor Ejército.</p><p>Las bonificaciones exclusivas se transfieren al nuevo titular. Solo hay tres metrópolis. Las rutas y la elegibilidad de los logros se comprueban en el tablero; esta aplicación lleva su puntuación. La victoria debe confirmarse en el turno del jugador.</p><p>Un empate de los mayores defensores da cartas de progreso, no puntos de Defensor. Al resolver un ataque se aplican el punto o la pérdida de ciudad y se desactivan los caballeros. Las decisiones sobre cartas y el tablero se realizan en la mesa.</p><p><a href="https://www.catan.com/sites/default/files/2021-06/catan_c_k_2020_rule_book_200708.pdf" target="_blank" rel="noopener">Reglas oficiales de Ciudades y Caballeros</a></p></details>
  <details><summary>7 Wonders: ciencia y desempate</summary><p>Para el juego clásico de 3 a 7 jugadores. Cada 3 monedas dan 1 punto; los símbolos de ciencia puntúan al cuadrado y cada conjunto de tres tipos añade 7. Los comodines se asignan buscando el máximo total.</p><p>Los puntos de cartas y Maravilla se ingresan ya calculados según su texto. En empate se comparan las monedas restantes; si también empatan, comparten posición. En «Expansiones y ajustes» puedes anotar puntos de Líderes, Ciudades y deudas. Los efectos especiales de expansiones, como modificar la ciencia, se anotan como ajuste; no se interpretan automáticamente. No es una calculadora de Duel ni de Architects.</p><p><a href="https://www.rprod.com/en/games/7-wonders" target="_blank" rel="noopener">7 Wonders · reglas del editor</a></p></details>
  <details><summary>UNO: puntúa quien gana la mano</summary><p>La variante clásica da todos los puntos de las cartas restantes a quien terminó su mano: cartas numéricas por su valor, acciones de +2, salto y cambio de sentido por 20, comodines clásicos por 50. La meta habitual es 500. «Contar cartas» hace esta suma y la prepara para el ganador.</p><p>Las ediciones especiales pueden cambiar los valores. Para acumular penalizaciones por jugador, usa «Tu propio juego» con menor puntaje y una meta acordada.</p><p><a href="https://service.mattel.com/instruction_sheets/M2062-0920.pdf" target="_blank" rel="noopener">Reglas de UNO · Mattel</a></p></details>
  <details><summary>Carioca, dominó y juegos de tu mesa</summary><p>Carioca acumula puntos por ronda y propone que gane el menor. Dominó permite anotar por persona o equipo y ajustar la meta. Ambos son marcadores: los valores de las cartas, fichas y cierres se acuerdan en la mesa según su variante.</p><p>En «Tu propio juego» puedes elegir rondas o hasta 16 categorías. Cada categoría multiplica la cantidad por su valor, incluso valores negativos para penalizaciones. Guarda las reglas para reutilizarlas.</p></details>
  <details><summary>Metas, rondas y empates</summary><p>Una meta se alcanza cuando cualquier participante llega o supera ese total, incluso si gana el menor puntaje. Si varias personas superan la meta en una ronda, la clasificación determina el resultado. Una cantidad de rondas de 0 significa que no hay límite configurado.</p><p>Los empates comparten posición y victoria; el orden de la lista no decide un ganador. Catán permite confirmar al jugador que gana en su propio turno.</p></details></div><p class="footnote">A la mesa es un marcador independiente, sin afiliación con los editores.</p>`;
}

function commit(change, message, redraw = true) {
  const previous = E.clone(game());
  const next = E.clone(previous);
  change(next);
  next.updatedAt = new Date().toISOString();
  const valid = E.validateGame(next);
  const h = histories.get(valid.id) || { undo: [], redo: [] };
  h.undo.push(previous); if (h.undo.length > 40) h.undo.shift(); h.redo = [];
  histories.set(valid.id, h);
  data.games[data.games.findIndex(g=>g.id === valid.id)] = valid;
  save(); if (redraw) render(); if (message) toast(message);
}
function undo(redo = false) {
  const h = histories.get(gameId); if (!h) return;
  const from = redo ? h.redo : h.undo, to = redo ? h.undo : h.redo;
  if (!from.length) return;
  to.push(E.clone(game()));
  const restored = from.pop(); restored.updatedAt = new Date().toISOString();
  data.games[data.games.findIndex(g=>g.id===gameId)] = restored;
  save(); render(); toast(redo ? 'Cambio rehecho.' : 'Cambio deshecho.');
}
let returnFocus = null;
function openDialog(title, body, footer = '', onSubmit = null) {
  const dialog = $('#dialog');
  if (!dialog.open) returnFocus = document.activeElement;
  dialog.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button class="icon-btn" data-action="close-dialog" type="button" aria-label="Cerrar">${icon('close')}</button></div>${onSubmit ? '<form id="dialog-form">' : ''}<div class="dialog-body">${body}<p id="dialog-error" class="error editor-error" role="alert"></p></div>${footer ? `<div class="dialog-foot">${footer}</div>` : ''}${onSubmit ? '</form>' : ''}`;
  if (onSubmit) $('#dialog-form').onsubmit = event => { event.preventDefault(); try { onSubmit(new FormData(event.target)); } catch(e) { $('#dialog-error').textContent = e.message; } };
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
function closeDialog() {
  const dialog = $('#dialog'); if (!dialog.open) return;
  dialog.close(); editor = null;
  if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
  else $('#main')?.focus({preventScroll:true});
}
function confirmAction(title, text, label, action) {
  editor = null;
  openDialog(title, `<p>${text}</p>`, `${button('close-dialog','Cancelar','secondary')}<button class="btn" type="submit">${label}</button>`, () => { action(); closeDialog(); });
}
function sheetField(key, label, note = '', min = 0, max = 999999) {
  return `<div class="stepper-field"><div class="stepper-label"><label for="stat-${key}">${esc(label)}</label>${note?`<small>${esc(note)}</small>`:''}</div><div class="stepper"><button type="button" data-action="step" data-key="${key}" data-delta="-1" aria-label="Restar uno a ${esc(label)}">−</button><input id="stat-${key}" name="${key}" data-stat="${key}" type="number" inputmode="numeric" step="1" min="${min}" max="${max}" value="${editor.stats[key] ?? 0}" required><button type="button" data-action="step" data-key="${key}" data-delta="1" aria-label="Sumar uno a ${esc(label)}">+</button></div></div>`;
}
const sheetToggle = (key,label,note) => `<label class="check"><input type="checkbox" name="${key}" data-stat="${key}" ${editor.stats[key]?'checked':''}><span><strong>${label}</strong><small class="muted">${note}</small></span></label>`;
function editPlayer(id) {
  const g = game(), p = g.players.find(p=>p.id===id);
  editor = { id, stats: E.clone(g.stats[id]) };
  let fields = '';
  if (g.mode === 'catan') {
    const c = g.config;
    fields = `<section class="editor-section"><h3>En el tablero</h3>${sheetField('settlements','Poblados','1 punto. Incluye ciudades degradadas; al mejorar, resta el poblado.',0,9)}${sheetField('cities','Ciudades','2 puntos. Incluye las ciudades con metrópolis.',0,4)}${sheetField('vpCards','Cartas de victoria',c.citiesKnights?'Puntos de cartas como Constitución e Imprenta.':'Puntos de cartas de desarrollo.')}${c.citiesKnights?sheetField('metropolises','Metrópolis','2 puntos adicionales por ciudad mejorada.',0,3):''}</section>
    <section class="editor-section"><h3>Logros exclusivos</h3>${sheetToggle('longestRoad', 'Gran carretera / ruta comercial · +2', 'Asigna según la ruta continua del tablero.')}${!c.citiesKnights?sheetToggle('largestArmy','Mayor ejército · +2','Al menos 3 caballeros jugados; aplica las reglas de empate.'):''}${c.harbor?sheetToggle('harborCaptain','Capitán del puerto · +2','Solo con este escenario habilitado.'):''}${c.citiesKnights?sheetToggle('merchant','Mercader · +1','Para quien controla actualmente al Mercader.'):''}<p class="hint">Si el logro cambia de dueño, se quita automáticamente al anterior.</p></section>
    ${c.citiesKnights?`<section class="editor-section"><h3>Ciudades y Caballeros</h3>${sheetField('defender','Puntos de Defensor','1 por defensa ganada sin empate.')}${sheetField('basic','Caballeros básicos activos','1 de fuerza cada uno.',0,2)}${sheetField('strong','Caballeros fuertes activos','2 de fuerza cada uno.',0,2)}${sheetField('mighty','Caballeros poderosos activos','3 de fuerza cada uno.',0,2)}</section>`:''}
    <section class="editor-section"><h3>Escenarios y ajustes</h3>${c.seafarers||c.other?sheetField('scenario','Puntos de escenario','Incluye islas, misiones y fichas de victoria.'):''}${sheetField('custom','Ajuste de puntos','Positivo o negativo, según las reglas de tu mesa.',-999999)}</section>`;
  } else if (g.mode === 'seven') {
    fields = `<section class="editor-section"><h3>Puntos directos</h3>${[['wonder','Maravilla'],['civil','Cartas civiles (azules)'],['commercial','Cartas comerciales (amarillas)'],['guilds','Gremios (morados)']].map(([k,l])=>sheetField(k,l,'Anota los puntos, no el número de cartas.')).join('')}</section>
    <section class="editor-section"><h3>Tesorería</h3>${sheetField('coins','Monedas restantes','Cada 3 monedas = 1 punto; también desempatan.')}</section>
    <section class="editor-section"><h3>Conflictos militares</h3>${[['defeat','Fichas de derrota','−1 punto cada una.'],['victory1','Fichas de victoria I','+1 punto cada una.'],['victory3','Fichas de victoria II','+3 puntos cada una.'],['victory5','Fichas de victoria III','+5 puntos cada una.']].map(([k,l,n])=>sheetField(k,l,n)).join('')}</section>
    <section class="editor-section"><h3>Ciencia</h3>${[['scienceTablet','Tablillas'],['scienceGear','Engranajes'],['scienceCompass','Compases']].map(([k,l])=>sheetField(k,l,'Cantidad de símbolos.',0,99)).join('')}${sheetField('scienceWild','Símbolos a elección','Buscamos la mejor combinación posible.',0,20)}<p class="note" id="science-result" style="margin-top:14px"></p></section>
    <details class="editor-section"><summary>Expansiones y ajustes</summary><p class="hint" style="margin-top:12px">Anota los puntos ya resueltos de las cartas. Los efectos especiales se añaden como ajuste.</p>${sheetField('leaders','Líderes')}${sheetField('cities','Ciudades')}${sheetField('debt','Deudas','Puntos que se descuentan.')}${sheetField('extra','Otros ajustes','Incluye efectos especiales no calculados arriba.',-999999)}</details>`;
  } else {
    fields = `<p class="hint">Anota las cantidades. Cada valor se multiplica por los puntos de su categoría.</p>${g.config.categories.map(c=>sheetField(c.id,c.name,`${c.factor} puntos por unidad.`,-999999)).join('')}`;
  }
  openDialog(`${esc(p.name)} <span class="sr-only">· puntuación</span>`, `<div class="editor-total"><span>Total de ${esc(p.name)}</span><strong id="editor-total">${fmt(E.total(g,id))}</strong></div>${fields}<div class="breakdown" id="breakdown"></div>`, `${button('close-dialog','Cancelar','secondary')}<button class="btn" type="submit">${icon('check')} Guardar puntos</button>`, () => {
    const updated = readEditor();
    commit(next => {
      if (g.mode === 'catan') for (const k of ['longestRoad','largestArmy','harborCaptain','merchant']) if (updated[k]) next.players.forEach(p=>{ next.stats[p.id][k] = false; });
      next.stats[id] = updated;
    }, 'Puntos guardados.');
    closeDialog();
  });
  updateEditorPreview();
}
function readEditor() {
  const stats = E.clone(editor.stats);
  document.querySelectorAll('[data-stat]').forEach(input => { stats[input.dataset.stat] = input.type === 'checkbox' ? input.checked : E.integer(input.value,Number(input.min),Number(input.max)); });
  if (game().mode === 'catan') E.validateCatan(stats);
  return stats;
}
function updateEditorPreview() {
  try {
    const stats = readEditor(), candidate = E.clone(game()); candidate.stats[editor.id] = stats;
    $('#editor-total').textContent = fmt(E.total(candidate,editor.id));
    $('#breakdown').innerHTML = Object.entries(E.parts(candidate,editor.id)).filter(([,v])=>v!==0).map(([k,v])=>`<span>${esc(k)}: ${fmt(v)}</span>`).join('');
    if ($('#science-result')) { const science = E.science(stats); $('#science-result').textContent = `Ciencia: ${fmt(science.score)} puntos. Mejor combinación: ${science.counts[0]} tablillas, ${science.counts[1]} engranajes y ${science.counts[2]} compases.`; }
    $('#dialog-error').textContent = '';
  } catch(e) { $('#dialog-error').textContent = e.message; $('#editor-total').textContent = '—'; }
}
function readRound() {
  const scores = {}, missing = [];
  game().players.forEach(p=>{ const input = $(`#round-${p.id}`); if (!input.value.trim()) missing.push(p.name); else scores[p.id] = E.integer(input.value,game().mode==='uno'?0:-999999); });
  if (missing.length === game().players.length) throw Error('Anota al menos un puntaje antes de guardar.');
  if (game().mode !== 'uno' && missing.length) throw Error(`Faltan los puntos de ${missing.join(', ')}. Escribe 0 si no anotaron.`);
  game().players.forEach(p=>{ scores[p.id] ??= 0; });
  return scores;
}
function draftInput(input) {
  const g = game(), id = input.name;
  try {
    if (input.value !== '') E.integer(input.value,g.mode==='uno'?0:-999999);
    g.draft[id] = input.value; g.updatedAt = new Date().toISOString();
    const preview = $(`#preview-${id}`); if (preview) preview.textContent = input.value === '' ? `${fmt(E.total(g,id))} puntos actuales` : `${fmt(E.total(g,id))} → ${fmt(E.total(g,id)+Number(input.value))} puntos`;
    $('#round-error').textContent = ''; save();
  } catch(e) { $('#round-error').textContent = e.message; }
}
function editRound(index) {
  const g = game(), r = g.rounds[index];
  openDialog(`Editar ronda ${index+1}`, `<p class="hint" style="margin-bottom:16px">El total de todas las rondas se recalculará.</p><div class="stack">${g.players.map(p=>numberField(p.id,esc(p.name),r.scores[p.id],'',g.mode==='uno'?0:-999999)).join('')}</div>`, `${button('delete-round','Eliminar ronda','ghost danger',`data-index="${index}"`)}<button class="btn" type="submit">Guardar cambios</button>`, f=>{
    const scores = Object.fromEntries(g.players.map(p=>[p.id,E.integer(f.get(p.id),g.mode==='uno'?0:-999999)]));
    commit(next=>{next.rounds[index].scores=scores;},'Ronda corregida.'); closeDialog();
  });
}
function finishGame() {
  const g=game();
  if (Object.values(g.draft).some(v=>v!=='')) return toast('Guarda o borra los puntos pendientes de la ronda antes de finalizar.');
  if (g.mode==='catan') {
    const eligible = g.players.filter(p=>E.total(g,p.id)>=g.config.target);
    if (!eligible.length) return toast('Todavía nadie alcanzó la meta de Catán. La partida queda guardada y puedes continuar después.');
    openDialog('Confirmar victoria de Catán', `<p class="hint">Elige a quien alcanzó la meta durante su propio turno.</p><div class="field" style="margin-top:18px"><label for="winner">Ganador en su turno</label><select id="winner" name="winner">${eligible.map(p=>`<option value="${p.id}">${esc(p.name)} · ${fmt(E.total(g,p.id))} puntos</option>`).join('')}</select></div>`, '<button class="btn" type="submit">Confirmar victoria</button>', f=>{commit(n=>{n.finished=true;n.winnerId=f.get('winner');},'Resultado guardado.');closeDialog();});
  } else confirmAction('Finalizar partida','El resultado quedará guardado en «Mis partidas». Podrás corregirlo cuando lo necesites.','Guardar resultado',()=>commit(n=>{n.finished=true;},'Resultado guardado.'));
}
function resolveAttack() {
  const g=game(), d=E.defense(g);
  if (!d.attack) return;
  const names = d.affected.map(id=>esc(g.players.find(p=>p.id===id).name)).join(' y ');
  const detail = d.safe ? d.affected.length===1 ? `${names} recibe 1 punto de Defensor.` : `${names} toma una carta de progreso cada uno; no se otorgan puntos.` : `${names || 'Nadie'} pierde una ciudad, que pasa a ser un poblado.`;
  confirmAction('Resolver el ataque bárbaro',`${detail} Todos los caballeros quedarán desactivados. Aplica también los cambios en el tablero.`, 'Resolver ataque',()=>commit(n=>{
    if (d.safe && d.affected.length===1) n.stats[d.affected[0]].defender++;
    if (!d.safe) d.affected.forEach(id=>{n.stats[id].cities--;n.stats[id].settlements++;});
    n.players.forEach(p=>{n.stats[p.id].basic=0;n.stats[p.id].strong=0;n.stats[p.id].mighty=0;});
  },'Ataque resuelto. Puedes deshacer este cambio.'));
}
function unoHelper() {
  const g=game();
  openDialog('Contar cartas de UNO', `<p class="hint" style="margin-bottom:18px">Cuenta las cartas que quedaron en las manos de todos los demás.</p><div class="stack"><div class="field"><label for="uno-winner">Quién ganó la mano</label><select id="uno-winner" name="winner">${g.players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>${numberField('numbers','Suma de cartas numéricas',0,'Suma los valores impresos, del 0 al 9.')}${numberField('actions','Cantidad de cartas de acción',0,'+2, salto y cambio de sentido: 20 puntos cada una.')}${numberField('wilds','Cantidad de comodines clásicos',0,'Comodín y +4: 50 puntos cada uno.')}<p class="note" id="uno-total">Total de la mano: 0 puntos</p><p class="hint">Al aplicar se reemplaza el borrador de esta ronda. Las ediciones especiales pueden tener otros valores.</p></div>`, '<button class="btn" type="submit">Aplicar a esta ronda</button>', f=>{
    const total=E.integer(f.get('numbers'),0)+20*E.integer(f.get('actions'),0)+50*E.integer(f.get('wilds'),0); E.integer(total,0);
    commit(n=>{n.draft=Object.fromEntries(n.players.map(p=>[p.id,p.id===f.get('winner')?String(total):'0']));},'Puntos preparados. Guarda la ronda para sumarlos.');closeDialog();
  });
}
function download(contents, name, type) {
  const url=URL.createObjectURL(new Blob([contents],{type}));
  const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportGame(id) { const g=data.games.find(g=>g.id===id); download(JSON.stringify({ app:'A la mesa',version:2,game:g },null,2),`a-la-mesa-${g.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]/g,'-').slice(0,40)}.json`,'application/json'); }
function exportCSV() {
  const g=game(), safeCell=v=>`"${String(v).replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')}"`;
  const rows = [['Participante','Posición','Total',...(g.mode==='seven'?['Monedas']:[])],...E.ranking(g).map(p=>[p.name,p.rank,p.total,...(g.mode==='seven'?[p.coins]:[])])];
  if(E.kind(g)==='rounds') { rows.push([],['Ronda',...g.players.map(p=>p.name)]);g.rounds.forEach((r,i)=>rows.push([i+1,...g.players.map(p=>r.scores[p.id])])); }
  else { const categories=Object.keys(E.parts(g,g.players[0].id));rows.push([],['Participante',...categories]);g.players.forEach(p=>rows.push([p.name,...categories.map(k=>E.parts(g,p.id)[k])])); }
  download('\uFEFF'+rows.map(row=>row.map(safeCell).join(';')).join('\r\n'),'resultado-a-la-mesa.csv','text/csv;charset=utf-8');
}
function importGame() {
  const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
  input.onchange=async()=>{
    try {
      const file=input.files[0]; if(!file)return;if(file.size>2000000)throw Error('La copia es demasiado grande. El máximo es de 2 MB.');
      const parsed=JSON.parse(await file.text()), imported=E.validateGame(parsed.game);
      if(data.games.length>=30)throw Error('Ya hay 30 partidas. Exporta y elimina alguna antes de importar otra.');
      const duplicate=data.games.some(g=>g.id===imported.id); imported.id=uid(); if(duplicate)imported.name=`${imported.name.slice(0,52)} (copia)`;
      imported.updatedAt=new Date().toISOString();data.games.unshift(imported);data.activeId=imported.id;gameId=imported.id;save();go('game');toast('Partida recuperada.');
    }catch(e){toast(e instanceof SyntaxError?'El archivo no contiene una copia válida.':e.message);}
  };input.click();
}
function gameMenu() {
  const g=game();
  openDialog('Opciones de partida',`<div class="stack">${!g.finished?button('finish',`${icon('check')} Finalizar partida`,'wide'):''}${Object.values(g.draft).some(v=>v!=='')?button('clear-draft','Borrar puntos pendientes de la ronda','secondary wide'):''}${button('rename','Editar nombre y participantes','secondary wide')}${button('export',`${icon('download')} Descargar copia de la partida`,'secondary wide',`data-id="${g.id}"`)}${button('csv','Exportar resultado a Excel (CSV)','secondary wide')}${button('rematch','Nueva partida con esta mesa','secondary wide')}${button('nav','Guardar y volver al inicio','secondary wide','data-view="home"')}${button('rules','Ver ayuda del juego','ghost wide')}</div>`);
}
function renamePlayers() {
  const g=game();
  openDialog('Nombres de la mesa', `<div class="stack"><div class="field"><label for="rename-game">Partida</label><input id="rename-game" name="title" value="${esc(g.name)}" maxlength="60" required></div>${g.players.map((p,i)=>`<div class="field"><label for="rename-${p.id}">Participante ${i+1}</label><input id="rename-${p.id}" name="${p.id}" value="${esc(p.name)}" maxlength="28" required></div>`).join('')}</div>`, '<button class="btn" type="submit">Guardar nombres</button>', f=>{commit(n=>{n.name=f.get('title').trim();n.players.forEach(p=>p.name=f.get(p.id).trim());},'Nombres actualizados.');closeDialog();});
}

document.addEventListener('click', event=>{
  const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
  const action=el.dataset.action;
  try {
    if(action==='nav')go(el.dataset.view);
    else if(action==='theme'){data.theme=data.theme==='dark'?'light':'dark';save();render();}
    else if(action==='choose-mode')startSetup(el.dataset.mode);
    else if(action==='template')startSetup('custom',data.templates[Number(el.dataset.index)]);
    else if(action==='add-player') {readSetup();const max=setup.mode==='catan'?6:setup.mode==='seven'?7:setup.mode==='uno'?10:12;if(setup.players.length>=max)throw Error(`Este modo admite hasta ${max} participantes.`);let n=1;while(setup.players.some(p=>p.name===`Jugador ${n}`))n++;setup.players.push({id:uid(),name:`Jugador ${n}`,color:setup.players.length});render();const added=$(`#name-${setup.players.at(-1).id}`);added.focus();added.select();}
    else if(action==='remove-player'){readSetup();setup.players=setup.players.filter(p=>p.id!==el.dataset.id);render();}
    else if(action==='add-category'){readSetup();if(setup.config.categories.length>=16)throw Error('Puedes usar hasta 16 categorías.');setup.config.categories.push({id:uid(),name:`Categoría ${setup.config.categories.length+1}`,factor:1});render();}
    else if(action==='remove-category'){readSetup();setup.config.categories=setup.config.categories.filter(c=>c.id!==el.dataset.id);render();}
    else if(action==='open'){gameId=el.dataset.id;data.activeId=gameId;save();go('game');}
    else if(action==='close-dialog')closeDialog();
    else if(action==='edit-player')editPlayer(el.dataset.id);
    else if(action==='step'){const input=$(`#stat-${el.dataset.key}`);const value=E.integer(input.value||0,Number(input.min),Number(input.max))+Number(el.dataset.delta);if(value<Number(input.min)||value>Number(input.max))return;input.value=value;updateEditorPreview();}
    else if(action==='sign'){const input=$(`#round-${el.dataset.id}`);input.value=-E.integer(input.value||0);draftInput(input);input.focus();}
    else if(action==='undo')undo();
    else if(action==='redo')undo(true);
    else if(action==='edit-round')editRound(Number(el.dataset.index));
    else if(action==='delete-round'){const i=Number(el.dataset.index);confirmAction(`Eliminar ronda ${i+1}`, 'Se recalcularán todos los totales. Puedes deshacerlo.','Eliminar ronda',()=>commit(n=>{n.rounds.splice(i,1);},'Ronda eliminada.'));}
    else if(action==='finish')finishGame();
    else if(action==='reopen')commit(n=>{n.finished=false;n.winnerId=null;},'Ya puedes corregir la partida.');
    else if(action==='resolve-attack')resolveAttack();
    else if(action==='uno-helper')unoHelper();
    else if(action==='game-menu')gameMenu();
    else if(action==='clear-draft')confirmAction('Borrar borrador de ronda','Las rondas guardadas se conservan. Solo se borrarán los puntos que aún no sumaste.','Borrar borrador',()=>commit(n=>{n.draft={};},'Borrador eliminado.'));
    else if(action==='rename')renamePlayers();
    else if(action==='rules')go('help');
    else if(action==='export')exportGame(el.dataset.id);
    else if(action==='csv')exportCSV();
    else if(action==='import')importGame();
    else if(action==='delete'){const id=el.dataset.id;const g=data.games.find(g=>g.id===id);confirmAction('Eliminar partida',`Se eliminará «${esc(g.name)}» de este dispositivo. Descarga una copia si quieres conservarla.`,'Eliminar',()=>{data.games=data.games.filter(g=>g.id!==id);histories.delete(id);if(data.activeId===id)data.activeId=null;save();render();toast('Partida eliminada.');});}
    else if(action==='rematch'){const g=game();startSetup(g.mode,{name:g.name,config:g.config});setup.players=E.clone(g.players);render();}
    else if(action==='install'&&installPrompt){installPrompt.prompt();installPrompt=null;}
  } catch(e) { const target=$('#dialog[open] #dialog-error') || $('#setup-error');if(target)target.textContent=e.message;else toast(e.message); }
});
document.addEventListener('submit', event=>{
  if(event.target.id==='setup-form') {
    event.preventDefault();
    try {
      readSetup();if(data.games.length>=30)throw Error('Ya tienes 30 partidas. Exporta y elimina alguna desde «Mis partidas».');
      const g=E.newGame(uid(),setup.mode,setup.name,setup.players,setup.config);
      if(setup.saveTemplate && setup.mode==='custom') {
        const index=data.templates.findIndex(t=>t.name.toLocaleLowerCase()===setup.name.toLocaleLowerCase());
        if(index<0&&data.templates.length>=12)throw Error('Ya tienes 12 juegos guardados. Usa el mismo nombre para actualizar uno.');
        const template={name:setup.name,config:E.clone(setup.config)}; if(index>=0)data.templates[index]=template;else data.templates.push(template);
      }
      data.games.unshift(g);gameId=g.id;data.activeId=g.id;save();go('game');toast('La mesa está lista.');
    }catch(e){$('#setup-error').textContent=e.message;$('#setup-error').scrollIntoView({block:'center'});}
  } else if(event.target.id==='round-form') {
    event.preventDefault();
    try {
      if(game().finished||atEnd(game()))return;
      const scores=readRound();commit(n=>{n.rounds.push({id:uid(),scores});n.draft={};},'Ronda guardada.');
    }catch(e){$('#round-error').textContent=e.message;}
  }
});
document.addEventListener('input',event=>{
  if(event.target.closest('#round-form') && event.target.matches('input'))draftInput(event.target);
  if(event.target.matches('[data-stat]'))updateEditorPreview();
  if($('#uno-total')&&event.target.closest('#dialog-form')){
    try {const f=new FormData($('#dialog-form'));$('#uno-total').textContent=`Total de la mano: ${fmt(E.integer(f.get('numbers'),0)+20*E.integer(f.get('actions'),0)+50*E.integer(f.get('wilds'),0))} puntos`;}catch {$('#uno-total').textContent='Revisa las cantidades.';}
  }
});
document.addEventListener('change',event=>{
  if(event.target.closest('#setup-form')&&(event.target.id==='custom-kind'||event.target.name==='citiesKnights')){
    try {const was=setup.config.citiesKnights;readSetup();if(event.target.name==='citiesKnights'){if(!was&&setup.config.citiesKnights&&setup.config.target===10)setup.config.target=13;else if(was&&!setup.config.citiesKnights&&setup.config.target===13)setup.config.target=10;}if(setup.config.kind==='sheet'&&!setup.config.categories.length)setup.config.categories=[{id:uid(),name:'Puntos',factor:1}];render();}catch(e){$('#setup-error').textContent=e.message;}
  }
});
$('#dialog').addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
$('#dialog').addEventListener('click',event=>{if(event.target===$('#dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;if(view==='library')render();});
window.addEventListener('storage',event=>{if(event.key===KEY&&event.newValue!==lastSavedRaw){storageConflict=true;save();toast('La partida cambió en otra pestaña. Exporta tus cambios y recarga para continuar.');}});
if('serviceWorker' in navigator && ['http:','https:'].includes(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
