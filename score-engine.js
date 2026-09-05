/* Shared pure scoring functions. No browser dependencies. */
(function (root) {
  'use strict';
  const MODES = {
    limit: { name: 'Puntos con meta', icon: 'flag', description: 'Una carrera hasta el puntaje elegido.', kind: 'rounds', order: 'high', target: 100 },
    cumulative: { name: 'Carioca', icon: 'cards', description: 'Acumula por rondas. Menos es mejor.', kind: 'rounds', order: 'low', target: 0 },
    free: { name: 'Puntuación libre', icon: 'plus', description: 'Suma, resta y termina cuando quieras.', kind: 'rounds', order: 'high', target: 0 },
    catan: { name: 'Catán', icon: 'hex', description: 'Construcciones, logros y expansiones.', kind: 'sheet', order: 'high', target: 10 },
    seven: { name: '7 Wonders', icon: 'columns', description: 'Ciencia, monedas y todas las categorías.', kind: 'sheet', order: 'high', target: 0 },
    uno: { name: 'UNO', icon: 'cards', description: 'Puntos para quien gana cada mano.', kind: 'rounds', order: 'high', target: 500 },
    domino: { name: 'Dominó', icon: 'dice', description: 'Anota por persona o por equipo.', kind: 'rounds', order: 'high', target: 100 },
    custom: { name: 'Tu propio juego', icon: 'sliders', description: 'Crea tus reglas y categorías de puntos.', kind: 'rounds', order: 'high', target: 0 }
  };
  const CATAN = { settlements: 0, cities: 0, metropolises: 0, vpCards: 0, longestRoad: false, largestArmy: false, harborCaptain: false, defender: 0, merchant: false, scenario: 0, custom: 0, basic: 0, strong: 0, mighty: 0 };
  const SEVEN = { wonder: 0, coins: 0, defeat: 0, victory1: 0, victory3: 0, victory5: 0, civil: 0, commercial: 0, guilds: 0, scienceTablet: 0, scienceGear: 0, scienceCompass: 0, scienceWild: 0, leaders: 0, cities: 0, debt: 0, extra: 0 };
  const clone = value => JSON.parse(JSON.stringify(value));
  function integer(value, min = -999999, max = 999999) {
    if (typeof value !== 'number' && typeof value !== 'string') throw Error('Escribe un número entero.');
    if (typeof value === 'string' && !/^-?\d+$/.test(value.trim())) throw Error('Escribe un número entero, sin decimales.');
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < min || n > max) throw Error(`Usa un número entero entre ${min} y ${max}.`);
    return n;
  }
  function science(s) {
    const base = [s.scienceTablet, s.scienceGear, s.scienceCompass].map(n => integer(n, 0, 99));
    const wild = integer(s.scienceWild, 0, 20);
    let best = { score: -1, counts: base };
    for (let a = 0; a <= wild; a++) for (let b = 0; b <= wild - a; b++) {
      const counts = [base[0] + a, base[1] + b, base[2] + wild - a - b];
      const score = counts.reduce((sum, n) => sum + n * n, 0) + 7 * Math.min(...counts);
      if (score > best.score) best = { score, counts };
    }
    return best;
  }
  function catanParts(s, c) {
    return { Poblados: s.settlements, Ciudades: s.cities * 2, 'Cartas de victoria': s.vpCards,
      'Gran ruta': s.longestRoad ? 2 : 0, 'Mayor ejército': !c.citiesKnights && s.largestArmy ? 2 : 0,
      'Capitán del puerto': c.harbor && s.harborCaptain ? 2 : 0,
      Metrópolis: c.citiesKnights ? s.metropolises * 2 : 0, Defensor: c.citiesKnights ? s.defender : 0,
      Mercader: c.citiesKnights && s.merchant ? 1 : 0, Escenario: c.seafarers || c.other ? s.scenario : 0, Ajustes: s.custom };
  }
  function sevenParts(s) {
    return { Maravilla: s.wonder, Tesorería: Math.floor(s.coins / 3), Militar: -s.defeat + s.victory1 + s.victory3 * 3 + s.victory5 * 5,
      Civiles: s.civil, Comerciales: s.commercial, Gremios: s.guilds, Ciencia: science(s).score,
      Líderes: s.leaders, Ciudades: s.cities, Deudas: -s.debt, 'Otros ajustes': s.extra };
  }
  const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);
  function defense(g) {
    const rows = g.players.map(p => ({ id: p.id, strength: g.stats[p.id].basic + 2 * g.stats[p.id].strong + 3 * g.stats[p.id].mighty, vulnerable: g.stats[p.id].cities > g.stats[p.id].metropolises }));
    const attack = g.players.reduce((n, p) => n + g.stats[p.id].cities, 0);
    const strength = rows.reduce((n, p) => n + p.strength, 0);
    const safe = strength >= attack;
    const eligible = safe ? rows : rows.filter(p => p.vulnerable);
    const extreme = eligible.length ? (safe ? Math.max(...eligible.map(p => p.strength)) : Math.min(...eligible.map(p => p.strength))) : 0;
    return { attack, strength, safe, affected: attack ? eligible.filter(p => p.strength === extreme).map(p => p.id) : [] };
  }
  const kind = g => g.mode === 'custom' ? g.config.kind : MODES[g.mode].kind;
  function parts(g, id) {
    if (g.mode === 'catan') return catanParts(g.stats[id], g.config);
    if (g.mode === 'seven') return sevenParts(g.stats[id]);
    if (kind(g) === 'sheet') return Object.fromEntries(g.config.categories.map(c => [c.name, (g.stats[id][c.id] || 0) * c.factor]));
    return { Rondas: g.rounds.reduce((total, r) => total + r.scores[id], 0) };
  }
  const total = (g, id) => sum(parts(g, id));
  function ranking(g) {
    const rows = g.players.map(p => ({ ...p, total: total(g, p.id), coins: g.mode === 'seven' ? g.stats[p.id].coins : 0 }));
    const compare = (a, b) => (g.config.order === 'low' ? a.total - b.total : b.total - a.total) || b.coins - a.coins;
    rows.sort(compare);
    rows.forEach((p, i) => { p.rank = i && compare(p, rows[i - 1]) === 0 ? rows[i - 1].rank : i + 1; });
    return rows;
  }
  const reached = g => g.config.target > 0 && g.players.some(p => total(g, p.id) >= g.config.target);
  const defaultConfig = mode => ({ order: MODES[mode].order, target: MODES[mode].target, roundLimit: 0, kind: 'rounds', citiesKnights: false, seafarers: false, harbor: false, other: false, categories: [] });
  function newGame(id, mode, name, players, config) {
    return validateGame({ version: 2, id, mode, name: name || MODES[mode].name, players: clone(players), config: clone(config), rounds: [], stats: Object.fromEntries(players.map(p => [p.id, mode === 'catan' ? clone(CATAN) : mode === 'seven' ? clone(SEVEN) : {}])), draft: {}, finished: false, winnerId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  function validateCatan(s) {
    for (const [key, initial] of Object.entries(CATAN)) {
      if (typeof initial === 'boolean') { if (typeof s[key] !== 'boolean') throw Error('Bonificación de Catán inválida.'); }
      else s[key] = integer(s[key], key === 'custom' ? -999999 : 0, ({ settlements: 9, cities: 4, metropolises: 3, basic: 2, strong: 2, mighty: 2 })[key] || 999999);
    }
    if (s.metropolises > s.cities) throw Error('Las metrópolis deben estar incluidas en las ciudades.');
    if (s.settlements + s.cities > 9) throw Error('El conjunto de piezas permite hasta 9 construcciones. Usa un ajuste para escenarios con piezas adicionales.');
  }
  function validateGame(input) {
    if (!input || input.version !== 2 || !Object.hasOwn(MODES, input.mode)) throw Error('El archivo no es una partida compatible.');
    const g = clone(input);
    const textOK = (s, max = 40) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
    const idOK = s => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(s) && !['__proto__', 'constructor', 'prototype'].includes(s);
    if (!idOK(g.id) || !textOK(g.name, 60)) throw Error('Nombre o identificador de partida inválido.');
    if (!Array.isArray(g.players) || g.players.length < 2 || g.players.length > 12) throw Error('La partida necesita entre 2 y 12 participantes.');
    if (g.mode === 'seven' && (g.players.length < 3 || g.players.length > 7)) throw Error('7 Wonders necesita de 3 a 7 jugadores.');
    if (g.mode === 'catan' && (g.players.length < 3 || g.players.length > 6)) throw Error('Catán necesita de 3 a 6 jugadores; 5–6 requiere la ampliación.');
    if (g.mode === 'uno' && g.players.length > 10) throw Error('UNO admite hasta 10 jugadores.');
    const ids = new Set(), names = new Set();
    for (const p of g.players) {
      if (!idOK(p.id) || !textOK(p.name, 28) || ids.has(p.id) || names.has(p.name.trim().toLocaleLowerCase())) throw Error('Los participantes deben tener nombres distintos.');
      ids.add(p.id); names.add(p.name.trim().toLocaleLowerCase()); p.color = integer(p.color, 0, 11);
    }
    const c = g.config;
    if (!c || !['high', 'low'].includes(c.order) || !['rounds', 'sheet'].includes(c.kind)) throw Error('Reglas de puntuación inválidas.');
    c.target = integer(c.target, 0); c.roundLimit = integer(c.roundLimit, 0, 500);
    for (const k of ['citiesKnights', 'seafarers', 'harbor', 'other']) if (typeof c[k] !== 'boolean') throw Error('Configuración de expansiones inválida.');
    if (!Array.isArray(c.categories) || c.categories.length > 16) throw Error('Usa hasta 16 categorías.');
    const catIds = new Set(), catNames = new Set();
    for (const cat of c.categories) {
      if (!idOK(cat.id) || !textOK(cat.name, 32) || catIds.has(cat.id) || catNames.has(cat.name.toLocaleLowerCase())) throw Error('Las categorías deben tener nombres distintos.');
      cat.factor = integer(cat.factor, -100, 100); catIds.add(cat.id); catNames.add(cat.name.toLocaleLowerCase());
    }
    if (g.mode === 'custom' && c.kind === 'sheet' && !c.categories.length) throw Error('Agrega al menos una categoría.');
    if (['limit', 'uno', 'catan'].includes(g.mode) && c.target === 0) throw Error('Este modo necesita una meta mayor que cero.');
    if (['catan', 'seven', 'uno', 'limit'].includes(g.mode) && c.order !== 'high') throw Error('En este modo gana el mayor puntaje.');
    if (!Array.isArray(g.rounds) || g.rounds.length > 500) throw Error('El máximo es de 500 rondas por partida.');
    for (const r of g.rounds) {
      if (!idOK(r.id) || !r.scores) throw Error('Ronda inválida.');
      r.scores = Object.fromEntries([...ids].map(id => [id, integer(r.scores[id])]));
      if (g.mode === 'uno' && (Object.values(r.scores).some(n => n < 0) || Object.values(r.scores).filter(n => n > 0).length > 1)) throw Error('En UNO los puntos de la mano se asignan a una sola persona.');
    }
    if (new Set(g.rounds.map(r => r.id)).size !== g.rounds.length) throw Error('Hay rondas duplicadas.');
    if (!g.stats || !g.draft || typeof g.finished !== 'boolean' || (g.winnerId !== null && !ids.has(g.winnerId))) throw Error('Datos de partida inválidos.');
    for (const id of ids) {
      if (g.draft[id] !== undefined && g.draft[id] !== '') integer(g.draft[id]);
      const s = g.stats[id]; if (!s || typeof s !== 'object' || Array.isArray(s)) throw Error('Ficha de jugador inválida.');
      if (g.mode === 'catan') validateCatan(s);
      else if (g.mode === 'seven') for (const key of Object.keys(SEVEN)) s[key] = integer(s[key], key === 'extra' ? -999999 : 0, key === 'scienceWild' ? 20 : key.startsWith('science') ? 99 : 999999);
      else if (kind(g) === 'sheet') for (const cat of c.categories) s[cat.id] = integer(s[cat.id] ?? 0);
    }
    if (g.mode === 'catan') {
      if (g.players.reduce((n, p) => n + g.stats[p.id].metropolises, 0) > 3) throw Error('Solo hay tres metrópolis en la partida.');
      for (const k of ['longestRoad', 'largestArmy', 'harborCaptain', 'merchant']) if (g.players.filter(p => g.stats[p.id][k]).length > 1) throw Error('Una bonificación exclusiva no puede pertenecer a dos jugadores.');
    }
    if (![g.createdAt, g.updatedAt].every(d => typeof d === 'string' && Number.isFinite(Date.parse(d)))) throw Error('Fecha de partida inválida.');
    return g;
  }
  const api = { MODES, CATAN, SEVEN, clone, integer, science, catanParts, sevenParts, defense, parts, total, ranking, reached, kind, defaultConfig, newGame, validateGame, validateCatan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScoreEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
