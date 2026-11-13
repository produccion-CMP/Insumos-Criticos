'use strict';

const CONF = Object.assign({ SCRIPT_URL: '', API_KEY: '', PLANTA: '' }, window.APP_CONFIG || {});

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

const conexion = () => ({ url: LS.get('ic_url', '') || CONF.SCRIPT_URL, key: LS.get('ic_key', '') || CONF.API_KEY });

const INSUMOS = {
  tarimas: { emoji: '🪵', desc: 'Pallets de madera', nombre: 'Tarimas', u: 'u', uLarga: 'tarimas', dec: 0, color: '#a0522d', medio: { metodo: 'mediana', dias: 120 }, defSS: 7, defPP: 21, necesidad: 'Tarimas' },
  stretch: { emoji: '🧻', desc: 'Film de embalaje', nombre: 'Stretch', u: 'kg', uLarga: 'kg', dec: 1, color: '#0270ba', medio: { metodo: 'mediana', dias: 120 }, defSS: 12, defPP: 25, necesidad: 'Stretch' },
  gasoil: { emoji: '⛽', desc: 'Cisterna de planta', nombre: 'Gasoil', u: 'L', uLarga: 'litros', dec: 0, color: '#3d8b37', medio: { metodo: 'promedio', dias: 90 }, defSS: 3, defPP: 7, necesidad: 'Gasoil' },
  cal: { emoji: '🪣', desc: 'Bolsas para molienda', nombre: 'Cal', u: 'bolsas', uLarga: 'bolsas', dec: 0, color: '#7a8592', medio: { metodo: 'mediana', dias: 21 }, defSS: 3, defPP: 7, necesidad: 'Cal' }
};
const ORDEN = ['tarimas', 'stretch', 'gasoil', 'cal'];
const PALETA = ['--s1', '--s3', '--s4', '--s8', '--s7', '--s2', '--s5', '--s6'];

const ST = { datos: null, modelo: null, vista: 'resumen', insumo: 'tarimas', per: 'hist', charts: {}, regIns: 'tarimas', regOp: null, movIns: 'tarimas' };

const nf = {};
function fmt(v, dec = 0) {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  const k = 'd' + dec;
  if (!nf[k]) nf[k] = new Intl.NumberFormat('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return nf[k].format(v);
}
const pct = v => (v === null || v === undefined || !isFinite(v)) ? '—' : fmt(v, 1) + ' %';
const delta = v => (v === null || v === undefined || !isFinite(v)) ? '—' : (v > 0 ? '+' : '') + fmt(v, 1) + ' %';
const dClase = v => (v === null || !isFinite(v)) ? '' : (v > 0 ? 'up' : 'dn');
const fFecha = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—';
const dn = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
const isoDn = d => new Date(d * 864e5).toISOString().slice(0, 10);
const sumar = (a, k) => a.reduce((s, r) => s + (Number(k ? r[k] : r) || 0), 0);
const mediana = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const percentil = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; };
const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const hoyLocal = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fMes = m => MESES[+m.slice(5, 7) - 1] + ' ' + m.slice(2, 4);

async function apiGet() {
  const { url, key } = conexion();
  if (!url) throw new Error('Configurá la URL de Apps Script en Administración → Conexión');
  const ses = sesion();
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(key || '') + (ses ? '&token=' + encodeURIComponent(ses.token) : '') + '&t=' + Date.now());
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error al leer los datos');
  if (ses) {
    if (!j.perfil) { LS.set('ic_ses', null); if (window.onSesionVencida) window.onSesionVencida(); }
    else LS.set('ic_ses', Object.assign({}, ses, j.perfil));
  }
  return j.data;
}

function sesion() {
  const s = LS.get('ic_ses', null);
  return s && s.token && s.vence > Date.now() ? s : null;
}
const esAdmin = () => { const s = sesion(); return !!(s && s.rol === 'admin'); };
const puedeRegistrar = () => { const s = sesion(); return !!(s && (s.rol === 'admin' || s.rol === 'operador')); };
const verInventario = () => { const s = sesion(); return !!(s && (s.rol === 'admin' || s.verInventario)); };

async function apiPost(payload) {
  const { url, key } = conexion();
  if (!url) throw new Error('Configurá la URL de Apps Script en Administración › Conexión');
  const ses = sesion();
  const r = await fetch(url, { method: 'POST', body: JSON.stringify(Object.assign({ key, token: ses ? ses.token : null }, payload)) });
  const j = await r.json();
  if (!j.ok) {
    if (/Sesión vencida|Sesión .*requerida/i.test(j.error || '')) { LS.set('ic_ses', null); if (window.onSesionVencida) window.onSesionVencida(); }
    throw new Error(j.error || 'No se pudo guardar');
  }
  return j.msg !== undefined ? j.msg : j;
}

function construirModelo(D) {
  const M = {};
  const hoy = D.hoy;
  const fin = isoDn(dn(hoy) - 1);
  M.hoy = hoy;
  M.conInventario = !!(D.tarimas.inventario || D.stretch.inventario);
  M.fin = fin;

  M.tarimas = {
    serie: D.tarimas.diario.map(r => ({ f: r[0], ini: r[1], ing: r[2] || 0, env: r[3] || 0, cons: r[4] || 0, desc: r[5] || 0, sist: r[6], ctrl: r[7], consT1: r[8], aj: r[9], stock: r[10] })),
    movs: D.tarimas.movs.map(r => ({ hoja: 'movTarimas', fila: r[0], f: r[1], cant: r[2], prov: r[3], remito: r[4], obs: r[5], tipo: r[3] === 'Envío' ? 'Envío' : 'Ingreso' })),
    descarte: D.tarimas.descarte.map(r => ({ hoja: 'descarteTarimas', fila: r[0], f: r[1], cant: r[2], prov: r[3], obs: r[4], tipo: 'Descarte' })),
    inventario: (D.tarimas.inventario || []).map(r => ({ f: r[0], fis: r[1], sis: r[2] }))
  };

  M.stretch = {
    serie: D.stretch.diario.map(r => ({ f: r[0], ini: r[1], ing: r[2] || 0, ingBob: r[3] || 0, env: r[4] || 0, envBob: r[5] || 0, cons: r[6] || 0, consBob: r[7] || 0, sist: r[8], ctrl: r[9], consT1: r[10], aj: r[11], stock: r[12], stockBob: r[13], consCargado: r[6] !== null })),
    movs: D.stretch.movs.map(r => ({ hoja: 'movStretch', fila: r[0], f: r[1], cant: r[2], bob: r[3], prov: r[4], remito: r[5], obs: r[6], tipo: r[4] === 'Envío' ? 'Envío' : (r[2] < 0 ? 'Devolución' : 'Ingreso') })),
    inventario: (D.stretch.inventario || []).map(r => ({ f: r[0], fis: r[1], sis: r[2] }))
  };

  M.cal = {
    serie: D.cal.diario.map(r => ({ f: r[0], ini: r[1], ing: r[2] || 0, env: 0, cons: r[3] || 0, sist: r[4], ctrl: r[5], consT1: r[6], aj: r[7], stock: r[8] })),
    movs: D.cal.movs.map(r => ({ hoja: 'movCal', fila: r[0], f: r[1], cant: r[2], prov: '', obs: r[3], tipo: 'Ingreso' }))
  };

  const ultDep = {};
  D.gasoil.tx.forEach(t => { ultDep[t[2]] = t[3]; });
  const nomU = u => (u === '#' ? 'Sin identificar (#)' : u);
  const nomD = d => (d === 'Maquinas cargadoras' ? 'Máquinas cargadoras' : (!d || /^RECUPERADO/i.test(d) ? 'Otros' : d));
  const tx = D.gasoil.tx.map(t => ({ f: t[0], hora: t[1], u: nomU(t[2]), d: nomD(ultDep[t[2]]), l: t[4], op: t[5] || '(sin operador)', odo: t[6] }));
  const porDia = {};
  tx.forEach(t => { porDia[t.f] = (porDia[t.f] || 0) + t.l; });
  const cd = {};
  D.gasoil.diario.forEach(r => { cd[r[0]] = r; });
  const fechas = tx.map(t => t.f).concat(Object.keys(cd)).sort();
  const serieG = [];
  if (fechas.length) {
    for (let d = dn(fechas[0]); d <= dn(hoy); d++) {
      const f = isoDn(d), r = cd[f];
      serieG.push({ f, cons: porDia[f] || 0, ing: r ? (r[2] || 0) : 0, env: 0, sonda: r ? r[3] : null, stock: r ? r[6] : null, stockTot: r ? r[5] : null, aj: r && r[3] !== null && r[4] !== null ? r[3] - r[4] - (r[2] || 0) : null, ctrl: r ? r[3] : null });
    }
  }
  M.gasoil = {
    serie: serieG,
    tx,
    movs: D.gasoil.movs.map(r => ({ hoja: 'cargasAjustes', fila: r[0], f: r[1], hora: r[2], tipo: r[3] === 'Carga Gasoil' ? 'Carga cisterna' : (r[3] === 'Medición Sonda' ? 'Medición sonda' : r[3]), valor: r[4], cant: r[3] === 'Carga Gasoil' ? r[4] : r[5], litros: r[5], prov: '', obs: r[6] }))
  };

  ORDEN.forEach(id => {
    const ins = M[id];
    ins.inicio = ins.serie.length ? ins.serie[0].f : hoy;
    const conStock = ins.serie.filter(r => r.stock !== null && r.stock !== undefined);
    ins.ultimo = conStock.length ? conStock[conStock.length - 1] : null;
    ins.medio = consumoMedio(id, ins, hoy);
    const nec = (D.necesidades || []).find(n => n.insumo.toLowerCase() === INSUMOS[id].necesidad.toLowerCase());
    ins.diasSS = nec && nec.diasSS ? nec.diasSS : INSUMOS[id].defSS;
    ins.diasPP = nec && nec.diasPP ? nec.diasPP : INSUMOS[id].defPP;
    ins.paramGuardado = !!(nec && nec.diasSS && nec.diasPP);
    ins.ss = ins.medio !== null ? Math.ceil(ins.diasSS * ins.medio) : null;
    ins.pp = ins.medio !== null ? Math.ceil(ins.diasPP * ins.medio) : null;
    ins.stock = ins.ultimo ? ins.ultimo.stock : null;
    ins.cobertura = ins.stock !== null && ins.medio ? ins.stock / ins.medio : null;
    ins.estado = ins.stock === null || ins.ss === null ? 'na' : (ins.stock < ins.ss ? 'bad' : (ins.stock < ins.pp ? 'warn' : 'ok'));
  });
  return M;
}

function consumoMedio(id, ins, hoy) {
  const cfg = INSUMOS[id].medio;
  const desde = isoDn(dn(hoy) - cfg.dias);
  const s = ins.serie.filter(r => r.f > desde && r.f < hoy);
  if (!s.length) return null;
  if (cfg.metodo === 'promedio') return sumar(s, 'cons') / s.length;
  return mediana(s.map(r => r.cons).filter(v => v > 0));
}

function periodos(fin, inicio) {
  const y = +fin.slice(0, 4), m = +fin.slice(5, 7), d = +fin.slice(8, 10);
  const sig = isoDn(dn(fin) + 1);
  let qy = +sig.slice(0, 4), qn = Math.floor((+sig.slice(5, 7) - 1) / 3) - 1;
  if (qn < 0) { qn = 3; qy -= 1; }
  const trim = (yy, n) => { while (n < 0) { n += 4; yy -= 1; } const a = isoDn(Date.UTC(yy, n * 3, 1) / 864e5); const b = isoDn(Date.UTC(yy, n * 3 + 3, 1) / 864e5 - 1); return { a, b, nombre: 'T' + (n + 1) + ' ' + yy }; };
  const t = trim(qy, qn), tp = trim(qy, qn - 1), ty = trim(qy - 1, qn);
  const finAnt = isoDn(Math.min(Date.UTC(y - 1, m - 1, d), Date.UTC(y - 1, m, 1) - 864e5) / 864e5);
  return {
    hist: { a: inicio, b: fin, nombre: 'Histórico' },
    u365: { a: isoDn(dn(fin) - 364), b: fin, nombre: 'Últimos 365 días' },
    ytd: { a: y + '-01-01', b: fin, nombre: y + ' (año en curso)', cmp: 'ytd_ant' },
    ytd_ant: { a: (y - 1) + '-01-01', b: finAnt, nombre: 'mismo tramo de ' + (y - 1) },
    trim: { a: t.a, b: t.b, nombre: t.nombre, cmp: 'trim_yoy', cmp2: 'trim_ant' },
    trim_yoy: Object.assign(ty, {}),
    trim_ant: Object.assign(tp, {}),
    u30: { a: isoDn(dn(fin) - 29), b: fin, nombre: 'Últimos 30 días' },
    p30: { a: isoDn(dn(fin) - 59), b: isoDn(dn(fin) - 30), nombre: '30 días previos' }
  };
}

function movsPeriodo(ins, p) { return (ins.movs || []).filter(m => m.f >= p.a && m.f <= p.b); }

function kpis(id, p) {
  const ins = ST.modelo[id];
  const a = p.a < ins.inicio ? ins.inicio : p.a;
  const dias = dn(p.b) - dn(p.a) + 1;
  const diasDatos = Math.max(dn(p.b) - dn(a) + 1, 0);
  const s = ins.serie.filter(r => r.f >= p.a && r.f <= p.b);
  const cons = sumar(s, 'cons');
  const consDias = s.map(r => r.cons);
  while (consDias.length < diasDatos) consDias.push(0);
  const pos = consDias.filter(v => v > 0);
  const stocks = s.map(r => r.stock).filter(v => v !== null && v !== undefined);
  const stockProm = stocks.length ? sumar(stocks) / stocks.length : null;
  const mv = movsPeriodo(ins, p);
  const ingresos = id === 'gasoil' ? mv.filter(m => m.tipo === 'Carga cisterna') : mv.filter(m => m.tipo === 'Ingreso' || m.tipo === 'Devolución');
  const ingTotal = id === 'gasoil' ? sumar(ingresos, 'cant') : sumar(s, 'ing');
  const entregas = ingresos.filter(m => m.cant > 0).length;
  const env = sumar(s, 'env');
  const ctrls = s.filter(r => r.ctrl !== null && r.ctrl !== undefined);
  const ajustes = s.filter(r => r.aj !== null && r.aj !== undefined);
  const k = {
    dias, diasDatos, cons, lDia: diasDatos ? cons / diasDatos : null, lDiaOp: pos.length ? sumar(pos) / pos.length : null,
    diasConsumo: pos.length, p90: percentil(consDias, 0.9), pico: consDias.length ? Math.max.apply(null, consDias) : null,
    ingTotal, entregas, entregaProm: entregas ? ingTotal / entregas : null, env,
    stockProm, stockMin: stocks.length ? Math.min.apply(null, stocks) : null,
    diasBajoSS: ins.ss !== null ? s.filter(r => r.stock !== null && r.stock !== undefined && r.stock < ins.ss).length : null,
    diasConStock: stocks.length,
    rotacion: stockProm ? cons / stockProm : null,
    coberturaProm: stockProm !== null && diasDatos && cons ? stockProm / (cons / diasDatos) : null,
    controles: ctrls.length, ajusteTotal: ajustes.length ? sumar(ajustes, 'aj') : null,
    ajusteAbsProm: ajustes.length ? sumar(ajustes.map(r => Math.abs(r.aj))) / ajustes.length : null
  };
  const sDias = s.filter(r => r.f >= a);
  const iPico = sDias.reduce((im, r, i) => (r.cons > (sDias[im] ? sDias[im].cons : -1) ? i : im), 0);
  k.fechaPico = sDias.length ? sDias[iPico].f : null;
  const hab = [], fde = [];
  sDias.forEach(r => { const wd = new Date(r.f + 'T12:00:00Z').getUTCDay(); (wd === 0 || wd === 6 ? fde : hab).push(r.cons); });
  k.lHabil = hab.length ? sumar(hab) / hab.length : null;
  k.lFinde = fde.length ? sumar(fde) / fde.length : null;
  k.diasSin = consDias.filter(v => !(v > 0)).length;
  const media = consDias.length ? sumar(consDias) / consDias.length : 0;
  k.cv = media > 0 && consDias.length > 1 ? Math.sqrt(sumar(consDias.map(v => (v - media) * (v - media))) / (consDias.length - 1)) / media : null;
  if (id === 'tarimas') {
    const desc = sumar(s, 'desc');
    k.descarte = desc;
    k.descartePct = k.cons ? 100 * desc / (k.cons + desc) : null;
    const inv = ins.inventario.filter(r => r.f >= p.a && r.f <= p.b && r.sis);
    k.difInv = inv.length ? 100 * sumar(inv.map(r => r.sis - r.fis)) / sumar(inv, 'sis') : null;
    k.inventarios = inv.length;
  }
  if (id === 'stretch') {
    const tar = {};
    ST.modelo.tarimas.serie.forEach(r => { tar[r.f] = r.cons; });
    const par = s.filter(r => r.cons > 0 && tar[r.f] > 0);
    k.kgPallet = par.length ? sumar(par, 'cons') / sumar(par.map(r => tar[r.f])) : null;
    k.grPallet = k.kgPallet !== null ? k.kgPallet * 1000 : null;
    k.bobDia = k.lDia !== null ? k.lDia / ST.datos.params.kgPorBobina : null;
    const inv = ins.inventario.filter(r => r.f >= p.a && r.f <= p.b && r.sis);
    k.difInv = inv.length ? 100 * sumar(inv.map(r => r.sis - r.fis)) / sumar(inv, 'sis') : null;
    k.inventarios = inv.length;
    const conKg = ingresos.filter(m => m.cant > 0 && m.bob > 0);
    k.kgBobina = conKg.length ? sumar(conKg, 'cant') / sumar(conKg, 'bob') : null;
    k.diasSinConsumoCargado = s.filter(r => !r.consCargado && tar[r.f] > 0).length;
  }
  if (id === 'gasoil') {
    const tx = ins.tx.filter(t => t.f >= p.a && t.f <= p.b);
    k.despachos = tx.length;
    k.lDespacho = tx.length ? sumar(tx, 'l') / tx.length : null;
    k.unidades = new Set(tx.map(t => t.u)).size;
    k.sinOdo = tx.length ? 100 * tx.filter(t => t.odo === null || t.odo <= 0 || t.odo === 9999 || t.odo === 99999).length / tx.length : null;
    const noct = sumar(tx.filter(t => { const h = +String(t.hora).slice(0, 2); return h >= 22 || h < 6; }), 'l');
    k.nocturno = k.cons ? 100 * noct / k.cons : null;
    const son = s.filter(r => r.aj !== null);
    k.mediciones = son.length;
    const porU = {};
    tx.forEach(t => { porU[t.u] = (porU[t.u] || 0) + t.l; });
    k.top3 = k.cons ? 100 * sumar(Object.values(porU).sort((x, y) => y - x).slice(0, 3)) / k.cons : null;
    k.difSonda = son.length ? sumar(son, 'aj') / son.length : null;
  }
  return k;
}

function compara(k, kc) { return kc && kc.lDia ? 100 * (k.lDia - kc.lDia) / kc.lDia : null; }

function ultimoControl(x) {
  const c = x.serie.filter(r => r.ctrl !== null && r.ctrl !== undefined).map(r => r.f).concat((x.inventario || []).map(r => r.f)).sort();
  return c.length ? { f: c[c.length - 1] } : null;
}

function mensual(id) {
  const ins = ST.modelo[id], fin = ST.modelo.fin;
  const acc = {}, dias = {};
  ins.serie.forEach(r => { if (r.f > fin) return; const m = r.f.slice(0, 7); acc[m] = (acc[m] || 0) + r.cons; dias[m] = (dias[m] || 0) + 1; });
  return Object.keys(acc).sort().map(m => ({ mes: m, v: acc[m] / dias[m] }));
}

function agruparGasoil(p, P) {
  const ins = ST.modelo.gasoil;
  const dias = Math.max(dn(p.b) - dn(p.a < ins.inicio ? ins.inicio : p.a) + 1, 1);
  const tx = ins.tx.filter(t => t.f >= p.a && t.f <= p.b);
  const c = p.cmp ? P[p.cmp] : null;
  const diasC = c ? Math.max(dn(c.b) - dn(c.a < ins.inicio ? ins.inicio : c.a) + 1, 1) : 1;
  const txc = c ? ins.tx.filter(t => t.f >= c.a && t.f <= c.b) : [];
  const tot = sumar(tx, 'l');
  const dep = {}, uni = {}, depC = {}, uniC = {};
  tx.forEach(t => {
    dep[t.d] = dep[t.d] || { l: 0, u: new Set(), n: 0 }; dep[t.d].l += t.l; dep[t.d].u.add(t.u); dep[t.d].n++;
    uni[t.u] = uni[t.u] || { l: 0, n: 0, d: t.d }; uni[t.u].l += t.l; uni[t.u].n++;
  });
  txc.forEach(t => { depC[t.d] = (depC[t.d] || 0) + t.l; uniC[t.u] = (uniC[t.u] || 0) + t.l; });
  return { dias, diasC, tot, dep, uni, depC, uniC, c };
}

function litrosSonda(cm) {
  if (!(cm > 0)) return 0;
  const r = 109.5, L = 10.55;
  if (cm >= 219) return L * Math.PI * r * r / 10;
  const h = Math.min(cm + 10.5, 2 * r);
  return L * (r * r * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - h * h)) / 10;
}

const OPS = {
  tarimas: [
    { id: 'ingresoTarimas', emoji: '📥', nombre: 'Ingreso de proveedor', campos: ['fecha', 'cantidad', 'proveedor', 'remito', 'obs'], ayuda: 'Se agrega a MovimientosTarimas; suma al stock del día.' },
    { id: 'envioTarimas', emoji: '🚚', nombre: 'Envío a otra planta', campos: ['fecha', 'cantidad', 'remito', 'obs'], ayuda: 'Se registra con proveedor «Envío» y descuenta del stock.' },
    { id: 'descarteTarimas', emoji: '🗑️', nombre: 'Descarte', campos: ['fecha', 'cantidad', 'proveedor', 'obs'], ayuda: 'Tarimas rotas o no aptas; descuenta del stock.', provOpcional: true },
    { id: 'controlFisico', emoji: '🔍', nombre: 'Control físico 6:00', campos: ['fecha', 'cantidad'], ayuda: 'Conteo a las 6:00. El ajuste se calcula contra el stock del sistema a esa hora.', etiqueta: 'Tarimas contadas' },
    { id: 'inventario', emoji: '📋', nombre: 'Inventario físico', campos: ['fecha', 'cantidad'], ayuda: 'Se agrega a «InventarioVsSistema»; no ajusta el stock.', etiqueta: 'Tarimas contadas' }
  ],
  stretch: [
    { id: 'ingresoStretch', emoji: '📥', nombre: 'Ingreso de proveedor', campos: ['fecha', 'kg', 'bobinas', 'proveedor', 'remito', 'obs'], ayuda: 'Si dejás vacías las bobinas se calculan como kg ÷ 15. Para devoluciones al proveedor cargá kg negativos.' },
    { id: 'envioStretch', emoji: '🚚', nombre: 'Envío a otra planta', campos: ['fecha', 'kg', 'bobinas', 'remito', 'obs'], ayuda: 'Se registra con proveedor «Envío» y descuenta del stock.' },
    { id: 'consumoStretch', emoji: '🧮', nombre: 'Consumo del día', campos: ['fecha', 'kg', 'sobrescribir'], ayuda: 'Se escribe en StockDiarioStretch (columna Consumo Stretch [Kg]).' },
    { id: 'controlFisico', emoji: '🔍', nombre: 'Control físico 6:00', campos: ['fecha', 'cantidad'], ayuda: 'Conteo de bobinas a las 6:00.', etiqueta: 'Bobinas contadas' },
    { id: 'inventario', emoji: '📋', nombre: 'Inventario físico', campos: ['fecha', 'cantidad'], ayuda: 'Se agrega a «StretchInventarioVsSistema»; no ajusta el stock.', etiqueta: 'Bobinas contadas' }
  ],
  gasoil: [
    { id: 'cargaGasoil', emoji: '🛢️', nombre: 'Carga de cisterna', campos: ['fecha', 'hora', 'valor', 'obs'], ayuda: 'Litros descargados por el proveedor en la cisterna (Cargas_y_Ajustes).', etiqueta: 'Litros cargados' },
    { id: 'sondaGasoil', emoji: '📏', nombre: 'Medición de sonda', campos: ['fecha', 'hora', 'valor', 'obs'], ayuda: 'Altura en cm (0 a 219). Reemplaza el stock teórico de ese día.', etiqueta: 'Altura de sonda [cm]' }
  ],
  cal: [
    { id: 'ingresoCal', emoji: '📥', nombre: 'Ingreso de proveedor', campos: ['fecha', 'cantidad', 'provTexto', 'remito', 'obs'], ayuda: 'Se agrega a MovimientosCal.', etiqueta: 'Bolsas' },
    { id: 'controlFisico', emoji: '🔍', nombre: 'Control físico 6:00', campos: ['fecha', 'cantidad'], ayuda: 'Conteo de bolsas a las 6:00.', etiqueta: 'Bolsas contadas' }
  ]
};

function listaMovimientos(ins) {
  const M = ST.modelo;
  if (!M) return [];
  const x = M[ins], u = INSUMOS[ins].u;
  let l = [];
  if (ins === 'gasoil') {
    l = x.movs.map(m => ({ f: m.f, tipo: m.tipo, det: m.tipo === 'Medición sonda' ? `${fmt(m.valor, 1)} cm → ${fmt(m.litros, 0)} L` : `${fmt(m.cant, 0)} L`, q: m.tipo === 'Medición sonda' ? m.valor : m.cant, prov: m.hora || '', obs: m.obs, hoja: m.hoja, fila: m.fila }));
  } else {
    l = x.movs.map(m => ({ f: m.f, tipo: m.tipo, det: `${fmt(m.cant, INSUMOS[ins].dec)} ${u}` + (m.bob ? ` · ${fmt(m.bob, 0)} bob.` : ''), q: m.cant, prov: m.prov, remito: m.remito, obs: m.obs, hoja: m.hoja, fila: m.fila }));
    if (x.descarte) l = l.concat(x.descarte.map(m => ({ f: m.f, tipo: 'Descarte', det: `${fmt(m.cant)} ${u}`, q: m.cant, prov: m.prov, obs: m.obs, hoja: m.hoja, fila: m.fila })));
    l = l.concat(x.serie.filter(r => r.ctrl !== null && r.ctrl !== undefined).map(r => ({ f: r.f, tipo: 'Control físico', det: `${fmt(r.ctrl, 0)} ${ins === 'stretch' ? 'bob.' : u}` + (r.aj !== null ? ` · ajuste ${fmt(r.aj, 0)}` : ''), prov: '', obs: '' })));
    if (x.inventario) l = l.concat(x.inventario.map(r => ({ f: r.f, tipo: 'Inventario', det: `${fmt(r.fis, 0)} vs. ${fmt(r.sis, 0)} sistema`, prov: '', obs: '' })));
  }
  return l.sort((a, b) => (a.f < b.f ? 1 : a.f > b.f ? -1 : (b.fila || 0) - (a.fila || 0)));
}

const EMOJI_TIPO = { 'Ingreso': '📥', 'Envío': '🚚', 'Descarte': '🗑️', 'Devolución': '↩️', 'Control físico': '🔍', 'Inventario': '📋', 'Carga cisterna': '🛢️', 'Medición sonda': '📏' };

const TURNOS = [{ t: 'T1', ini: 22, fin: 6, txt: '22:00 – 06:00' }, { t: 'T2', ini: 6, fin: 14, txt: '06:00 – 14:00' }, { t: 'T3', ini: 14, fin: 22, txt: '14:00 – 22:00' }];
function turnoActual(d) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 22 || h < 6) return { t: 'T1', txt: '22:00 – 06:00', avance: ((h >= 22 ? h - 22 : h + 2)) / 8 };
  if (h < 14) return { t: 'T2', txt: '06:00 – 14:00', avance: (h - 6) / 8 };
  return { t: 'T3', txt: '14:00 – 22:00', avance: (h - 14) / 8 };
}

function eficiencia(tx, dep) {
  const v = tx.filter(t => t.odo !== null && t.odo > 0 && t.odo !== 9999 && t.odo !== 99999).sort((a, b) => (a.f + a.hora < b.f + b.hora ? -1 : 1));
  if (v.length < 6) return {};
  const med = v.map((t, i) => { const w = v.slice(Math.max(0, i - 3), i + 4).map(x => x.odo).sort((a, b) => a - b); return w[Math.floor(w.length / 2)]; });
  const k = v.filter((t, i) => Math.abs(t.odo - med[i]) <= 0.05 * Math.abs(med[i]) + 50);
  const dif = [];
  for (let i = 1; i < k.length; i++) dif.push({ d: k[i].odo - k[i - 1].odo, l: k[i].l });
  const pos = dif.filter(x => x.d > 0).map(x => x.d).sort((a, b) => a - b);
  if (!pos.length) return {};
  const lim = 5 * pos[Math.floor(pos.length / 2)];
  const ok = dif.filter(x => x.d > 0 && x.d < lim);
  if (ok.length < 4) return {};
  const L = sumar(ok, 'l'), D = sumar(ok, 'd');
  if (dep === 'Máquinas cargadoras' || dep === 'Autoelevadores') { const r = L / D; return r >= 1 && r <= 25 ? { lh: r } : {}; }
  if (dep === 'Camiones' || dep === 'Camionetas') { const r = D / L; return r >= 1 && r <= 12 ? { kml: r } : {}; }
  return {};
}

function gasoilUnidades(p, P) {
  const ins = ST.modelo.gasoil, fin = ST.modelo.fin;
  const dias = Math.max(dn(p.b) - dn(p.a < ins.inicio ? ins.inicio : p.a) + 1, 1);
  const vida = {};
  ins.tx.forEach(t => { if (t.f > fin) return; const v = (vida[t.u] = vida[t.u] || { a: t.f, b: t.f }); if (t.f < v.a) v.a = t.f; if (t.f > v.b) v.b = t.f; });
  const tx = ins.tx.filter(t => t.f >= p.a && t.f <= p.b);
  const tot = sumar(tx, 'l');
  const c = p.cmp ? P[p.cmp] : null;
  const diasC = c ? Math.max(dn(c.b) - dn(c.a < ins.inicio ? ins.inicio : c.a) + 1, 1) : 1;
  const lc = {};
  if (c) ins.tx.filter(t => t.f >= c.a && t.f <= c.b).forEach(t => { lc[t.u] = (lc[t.u] || 0) + t.l; });
  const g = {};
  tx.forEach(t => { (g[t.u] = g[t.u] || []).push(t); });
  return Object.keys(g).map(u => {
    const arr = g[u], v = vida[u] || { a: p.a, b: p.b };
    const s0 = Math.max(dn(p.a), dn(v.a));
    const e0 = dn(v.b) >= dn(fin) - 45 ? dn(p.b) : Math.min(dn(p.b), dn(v.b));
    const act = Math.max(e0 - s0 + 1, 1);
    const L = sumar(arr, 'l');
    const ef = eficiencia(arr, arr[0].d);
    const ldc = c ? (lc[u] || 0) / diasC : null;
    return { u, d: arr[0].d, l: L, lDia: L / dias, lDiaAct: L / act, diasAct: act, part: tot ? 100 * L / tot : null, n: arr.length, lDesp: L / arr.length, intervalo: act / arr.length, lh: ef.lh || null, kml: ef.kml || null, lDiaCmp: ldc, delta: ldc ? 100 * (L / dias - ldc) / ldc : null, nueva: c ? !lc[u] : false };
  }).sort((a, b) => b.l - a.l);
}

function gasoilOperadores(p) {
  const tx = ST.modelo.gasoil.tx.filter(t => t.f >= p.a && t.f <= p.b);
  const tot = sumar(tx, 'l'), g = {};
  tx.forEach(t => { g[t.op] = g[t.op] || { l: 0, n: 0 }; g[t.op].l += t.l; g[t.op].n++; });
  return Object.entries(g).map(([op, x]) => ({ op, l: x.l, n: x.n, part: tot ? 100 * x.l / tot : null })).sort((a, b) => b.l - a.l);
}
