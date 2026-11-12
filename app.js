'use strict';

const CONF = Object.assign({ SCRIPT_URL: '', API_KEY: '', PLANTA: '' }, window.APP_CONFIG || {});

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

const conexion = () => ({ url: LS.get('ic_url', '') || CONF.SCRIPT_URL, key: LS.get('ic_key', '') || CONF.API_KEY });

const INSUMOS = {
  tarimas: { nombre: 'Tarimas', u: 'u', uLarga: 'tarimas', dec: 0, color: '#a0522d', medio: { metodo: 'mediana', dias: 120 }, defSS: 7, defPP: 21, necesidad: 'Tarimas' },
  stretch: { nombre: 'Stretch', u: 'kg', uLarga: 'kg', dec: 1, color: '#0270ba', medio: { metodo: 'mediana', dias: 120 }, defSS: 12, defPP: 25, necesidad: 'Stretch' },
  gasoil: { nombre: 'Gasoil', u: 'L', uLarga: 'litros', dec: 0, color: '#3d8b37', medio: { metodo: 'promedio', dias: 90 }, defSS: 3, defPP: 7, necesidad: 'Gasoil' },
  cal: { nombre: 'Cal', u: 'bolsas', uLarga: 'bolsas', dec: 0, color: '#7a8592', medio: { metodo: 'mediana', dias: 21 }, defSS: 3, defPP: 7, necesidad: 'Cal' }
};
const ORDEN = ['tarimas', 'stretch', 'gasoil', 'cal'];
const PALETA = ['#0270ba', '#3d8b37', '#d98e1f', '#b01917', '#6a4c93', '#8c949c', '#1b9aaa', '#a0522d'];

const ST = { datos: null, modelo: null, tab: 'resumen', insumo: 'tarimas', per: 'hist', charts: {} };

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

function toast(msg, error) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast ver' + (error ? ' error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast' + (error ? ' error' : ''); }, error ? 6000 : 3500);
}

function confirmar(texto) {
  return new Promise(res => {
    const d = $('dlg');
    $('dlgTexto').textContent = texto;
    d.returnValue = '';
    d.onclose = () => res(d.returnValue === 'si');
    d.showModal();
  });
}

async function apiGet() {
  const { url, key } = conexion();
  if (!url) throw new Error('Configurá la URL de Apps Script en la pestaña Parámetros');
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(key || '') + '&t=' + Date.now());
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error al leer los datos');
  return j.data;
}

async function apiPost(payload) {
  const { url, key } = conexion();
  if (!url) throw new Error('Configurá la URL de Apps Script en la pestaña Parámetros');
  const r = await fetch(url, { method: 'POST', body: JSON.stringify(Object.assign({ key }, payload)) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'No se pudo guardar');
  return j.msg;
}

function construirModelo(D) {
  const M = {};
  const hoy = D.hoy;
  const fin = isoDn(dn(hoy) - 1);
  M.hoy = hoy;
  M.fin = fin;

  M.tarimas = {
    serie: D.tarimas.diario.map(r => ({ f: r[0], ini: r[1], ing: r[2] || 0, env: r[3] || 0, cons: r[4] || 0, desc: r[5] || 0, sist: r[6], ctrl: r[7], consT1: r[8], aj: r[9], stock: r[10] })),
    movs: D.tarimas.movs.map(r => ({ hoja: 'movTarimas', fila: r[0], f: r[1], cant: r[2], prov: r[3], remito: r[4], obs: r[5], tipo: r[3] === 'Envío' ? 'Envío' : 'Ingreso' })),
    descarte: D.tarimas.descarte.map(r => ({ hoja: 'descarteTarimas', fila: r[0], f: r[1], cant: r[2], prov: r[3], obs: r[4], tipo: 'Descarte' })),
    inventario: D.tarimas.inventario.map(r => ({ f: r[0], fis: r[1], sis: r[2] }))
  };

  M.stretch = {
    serie: D.stretch.diario.map(r => ({ f: r[0], ini: r[1], ing: r[2] || 0, ingBob: r[3] || 0, env: r[4] || 0, envBob: r[5] || 0, cons: r[6] || 0, consBob: r[7] || 0, sist: r[8], ctrl: r[9], consT1: r[10], aj: r[11], stock: r[12], stockBob: r[13], consCargado: r[6] !== null })),
    movs: D.stretch.movs.map(r => ({ hoja: 'movStretch', fila: r[0], f: r[1], cant: r[2], bob: r[3], prov: r[4], remito: r[5], obs: r[6], tipo: r[4] === 'Envío' ? 'Envío' : (r[2] < 0 ? 'Devolución' : 'Ingreso') })),
    inventario: D.stretch.inventario.map(r => ({ f: r[0], fis: r[1], sis: r[2] }))
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
    k.difSonda = son.length ? sumar(son, 'aj') / son.length : null;
  }
  return k;
}

function compara(k, kc) { return kc && kc.lDia ? 100 * (k.lDia - kc.lDia) / kc.lDia : null; }

function destruir(id) { if (ST.charts[id]) { ST.charts[id].destroy(); delete ST.charts[id]; } }

function grafico(id, cfg) {
  destruir(id);
  const el = $(id);
  if (!el || !window.Chart) return null;
  Chart.defaults.font.family = getComputedStyle(document.documentElement).fontFamily;
  Chart.defaults.color = '#5b6670';
  ST.charts[id] = new Chart(el, cfg);
  return ST.charts[id];
}

const ejeNum = dec => ({ ticks: { callback: v => fmt(v, dec) }, grid: { color: '#edf0f3' } });

function renderResumen() {
  const M = ST.modelo;
  $('resumenNota').textContent = 'Stock al último día con datos. Consumo medio: mediana de los días con consumo (tarimas y stretch: 120 días; cal: 21 días) y promedio diario de 90 días para gasoil.';
  const etiqueta = { ok: 'Normal', warn: 'Pedir', bad: 'Bajo stock de seguridad', na: 'Sin datos' };
  $('cardsEstado').innerHTML = ORDEN.map(id => {
    const I = INSUMOS[id], x = M[id];
    const max = Math.max(x.pp || 0, x.stock || 0) * 1.25 || 1;
    const w = x.stock !== null ? Math.min(100, 100 * x.stock / max) : 0;
    const col = { ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)', na: 'var(--suave)' }[x.estado];
    const ult = (x.movs || []).filter(m => m.tipo === 'Ingreso' || m.tipo === 'Carga cisterna').slice(-1)[0];
    const extra = id === 'stretch' && x.ultimo ? ` <small>(${fmt(x.ultimo.stockBob, 0)} bob.)</small>` : '';
    const ctrl = ultimoControl(x);
    return `<article class="card-estado ${x.estado}" data-ir="${id}" tabindex="0">
      <div class="cab"><span class="nom">${I.nombre}</span><span class="pill ${x.estado}">${etiqueta[x.estado]}</span></div>
      <div class="stock">${fmt(x.stock, 0)} <small>${I.u}</small>${extra}</div>
      <div class="cob">Cobertura: <b>${fmt(x.cobertura, 1)} días</b></div>
      <div class="barra" title="Stock vs. stock de seguridad y punto de pedido"><i style="width:${w}%;background:${col}"></i>${x.ss ? `<b style="left:${100 * x.ss / max}%"></b>` : ''}${x.pp ? `<b style="left:${100 * x.pp / max}%"></b>` : ''}</div>
      <div class="det">
        <span>Consumo medio</span><span>${fmt(x.medio, I.dec)} ${I.u}/día</span>
        <span>Stock de seguridad (${fmt(x.diasSS)} d)</span><span>${fmt(x.ss)} ${I.u}</span>
        <span>Punto de pedido (${fmt(x.diasPP)} d)</span><span>${fmt(x.pp)} ${I.u}</span>
        <span>Último ingreso</span><span>${ult ? fFecha(ult.f) + ' · ' + fmt(ult.cant, I.dec) : '—'}</span>
        <span>Último control físico</span><span>${ctrl ? fFecha(ctrl.f) : '—'}</span>
        <span>Datos al</span><span>${x.ultimo ? fFecha(x.ultimo.f) : '—'}</span>
      </div>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-ir]').forEach(el => {
    const ir = () => irTab(el.dataset.ir);
    el.onclick = ir;
    el.onkeydown = e => { if (e.key === 'Enter') ir(); };
  });

  grafico('chCobertura', {
    type: 'bar',
    data: {
      labels: ORDEN.map(id => INSUMOS[id].nombre),
      datasets: [
        { label: 'Cobertura actual', order: 1, data: ORDEN.map(id => M[id].cobertura), backgroundColor: ORDEN.map(id => ({ ok: '#2e8540', warn: '#d98e1f', bad: '#c0392b', na: '#8c949c' })[M[id].estado]) },
        { label: 'Días punto de pedido', order: 0, data: ORDEN.map(id => M[id].diasPP), type: 'line', showLine: false, pointStyle: 'line', pointRadius: 22, pointBorderWidth: 3, borderColor: '#1f2a36' },
        { label: 'Días stock de seguridad', order: 0, data: ORDEN.map(id => M[id].diasSS), type: 'line', showLine: false, pointStyle: 'line', pointRadius: 22, pointBorderWidth: 3, borderColor: '#c0392b' }
      ]
    },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.parsed.y, 1) + ' días' } } }, scales: { y: ejeNum(0) } }
  });

  const P = periodos(M.fin, '2000-01-01');
  $('tablaTendencia').innerHTML = '<thead><tr><th>Insumo</th><th>Últimos 30 d</th><th>30 d previos</th><th>Variación</th><th>Ingresos 30 d</th></tr></thead><tbody>' +
    ORDEN.map(id => {
      const k = kpis(id, P.u30), kp = kpis(id, P.p30), d = compara(k, kp), I = INSUMOS[id];
      return `<tr><td>${I.nombre}</td><td>${fmt(k.lDia, I.dec)} ${I.u}/día</td><td>${fmt(kp.lDia, I.dec)} ${I.u}/día</td><td class="${dClase(d)}">${delta(d)}</td><td>${fmt(k.ingTotal, I.dec)} ${I.u}</td></tr>`;
    }).join('') + '</tbody>';

  const al = [];
  ORDEN.forEach(id => {
    const x = M[id], I = INSUMOS[id];
    if (x.estado === 'bad') al.push(['bad', `${I.nombre}: stock (${fmt(x.stock)} ${I.u}) por debajo del stock de seguridad (${fmt(x.ss)} ${I.u}). Cobertura ${fmt(x.cobertura, 1)} días.`]);
    else if (x.estado === 'warn') al.push(['warn', `${I.nombre}: stock (${fmt(x.stock)} ${I.u}) por debajo del punto de pedido (${fmt(x.pp)} ${I.u}). Lanzar pedido.`]);
    if (x.ultimo && dn(M.hoy) - dn(x.ultimo.f) > 2) al.push(['warn', `${I.nombre}: el último dato de stock es del ${fFecha(x.ultimo.f)}.`]);
    const ctrl = ultimoControl(x);
    if (!ctrl || dn(M.hoy) - dn(ctrl.f) > 14) al.push(['warn', `${I.nombre}: ${ctrl ? 'el último control físico fue el ' + fFecha(ctrl.f) : 'no hay controles físicos registrados'}.`]);
  });
  const st = M.stretch.serie.filter(r => r.f >= isoDn(dn(M.fin) - 13) && r.f <= M.fin);
  const tar = {};
  M.tarimas.serie.forEach(r => { tar[r.f] = r.cons; });
  const sinCons = st.filter(r => !r.consCargado && tar[r.f] > 0).map(r => fFecha(r.f));
  if (sinCons.length) al.push(['warn', `Stretch: hay producción de pallets sin consumo de stretch cargado (${sinCons.join(', ')}).`]);
  const invT = M.tarimas.inventario.slice(-1)[0];
  if (invT && invT.sis && Math.abs(invT.sis - invT.fis) / invT.sis > 0.05) al.push(['warn', `Tarimas: el último inventario (${fFecha(invT.f)}) difiere ${pct(100 * (invT.sis - invT.fis) / invT.sis)} del sistema.`]);
  const invS = M.stretch.inventario.slice(-1)[0];
  if (invS && invS.sis && Math.abs(invS.sis - invS.fis) / invS.sis > 0.05) al.push(['warn', `Stretch: el último inventario (${fFecha(invS.f)}) difiere ${pct(100 * (invS.sis - invS.fis) / invS.sis)} del sistema.`]);
  if (!al.length) al.push(['ok', 'Sin alertas.']);
  $('listaAlertas').innerHTML = al.map(a => `<li class="${a[0]}">${esc(a[1])}</li>`).join('');
}

function ultimoControl(x) {
  const c = x.serie.filter(r => r.ctrl !== null && r.ctrl !== undefined).map(r => r.f).concat((x.inventario || []).map(r => r.f)).sort();
  return c.length ? { f: c[c.length - 1] } : null;
}

function kpiHtml(l, v, s) { return `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s || '&nbsp;'}</div></div>`; }

function renderInsumo() {
  const id = ST.insumo, I = INSUMOS[id], M = ST.modelo, ins = M[id];
  $('insTitulo').textContent = I.nombre;
  document.querySelectorAll('#periodos button').forEach(b => b.classList.toggle('activo', b.dataset.per === ST.per));
  const P = periodos(M.fin, ins.inicio);
  const p = P[ST.per];
  const k = kpis(id, p);
  const kc = p.cmp ? kpis(id, P[p.cmp]) : null;
  const kc2 = p.cmp2 ? kpis(id, P[p.cmp2]) : null;
  const d1 = compara(k, kc), d2 = compara(k, kc2);
  let rango = `${p.nombre}: ${fFecha(p.a)} al ${fFecha(p.b)} (${k.dias} días)`;
  if (p.a < ins.inicio) rango += ` · los datos comienzan el ${fFecha(ins.inicio)}`;
  if (kc) rango += ` · comparado con ${P[p.cmp].nombre} (${fFecha(P[p.cmp].a)} al ${fFecha(P[p.cmp].b)})`;
  if (kc2) rango += ` y ${P[p.cmp2].nombre}`;
  $('insRango').textContent = rango;
  const cmpTxt = [d1 !== null ? `<span class="${dClase(d1)}">${delta(d1)}</span> vs. ${esc(P[p.cmp].nombre)}` : '', d2 !== null ? `<span class="${dClase(d2)}">${delta(d2)}</span> vs. ${esc(P[p.cmp2].nombre)}` : ''].filter(Boolean).join(' · ');
  const u = I.u, dec = I.dec;
  const h = [
    kpiHtml(`Consumo diario promedio [${u}/día]`, fmt(k.lDia, dec), cmpTxt || 'Consumo ÷ días calendario'),
    kpiHtml(`Consumo por día operativo [${u}/día]`, fmt(k.lDiaOp, dec), `${fmt(k.diasConsumo)} días con consumo`),
    kpiHtml(`Consumo total [${u}]`, fmt(k.cons, 0), `P90 diario ${fmt(k.p90, dec)} · pico ${fmt(k.pico, dec)}`),
    kpiHtml(`Ingresos [${u}]`, fmt(k.ingTotal, 0), `${fmt(k.entregas)} entregas · ${fmt(k.entregaProm, dec)} ${u}/entrega`),
    kpiHtml(`Stock promedio [${u}]`, fmt(k.stockProm, 0), `Mínimo ${fmt(k.stockMin, 0)} ${u}`),
    kpiHtml('Cobertura promedio [días]', fmt(k.coberturaProm, 1), `Rotación ${fmt(k.rotacion, 1)} veces en el período`),
    kpiHtml('Días bajo stock de seguridad', fmt(k.diasBajoSS), `de ${fmt(k.diasConStock)} días con stock registrado`)
  ];
  if (id === 'tarimas') {
    h.push(kpiHtml('Descarte [u]', fmt(k.descarte), `${pct(k.descartePct)} de las tarimas usadas`));
    h.push(kpiHtml('Envíos a otras plantas [u]', fmt(k.env), '&nbsp;'));
    h.push(kpiHtml('Diferencia inventario vs. sistema', pct(k.difInv), `${fmt(k.inventarios)} inventarios en el período`));
    h.push(kpiHtml('Controles físicos 6:00', fmt(k.controles), `Ajuste acumulado ${fmt(k.ajusteTotal, 0)} u`));
  } else if (id === 'stretch') {
    h.push(kpiHtml('Stretch por pallet [g/pallet]', fmt(k.grPallet, 0), 'Kg de stretch ÷ tarimas consumidas'));
    h.push(kpiHtml('Bobinas por día', fmt(k.bobDia, 1), `${fmt(ST.datos.params.kgPorBobina)} kg por bobina`));
    h.push(kpiHtml('Kg por bobina recibida', fmt(k.kgBobina, 1), 'Promedio de los ingresos'));
    h.push(kpiHtml('Diferencia inventario vs. sistema', pct(k.difInv), `${fmt(k.inventarios)} inventarios en el período`));
    h.push(kpiHtml('Días con pallets sin stretch cargado', fmt(k.diasSinConsumoCargado), 'Revisar carga de consumo'));
  } else if (id === 'gasoil') {
    h.push(kpiHtml('Despachos', fmt(k.despachos), `${fmt(k.lDespacho, 1)} L por despacho`));
    h.push(kpiHtml('Unidades con consumo', fmt(k.unidades), '&nbsp;'));
    h.push(kpiHtml('Litros cargados 22–6 h', pct(k.nocturno), 'Control de despachos nocturnos'));
    h.push(kpiHtml('Despachos sin odómetro válido', pct(k.sinOdo), 'Vacío, 0, 9999 o 99999'));
    h.push(kpiHtml('Diferencia sonda vs. teórico [L]', fmt(k.difSonda, 0), `Promedio de ${fmt(k.mediciones)} mediciones`));
  } else if (id === 'cal') {
    h.push(kpiHtml('Controles físicos 6:00', fmt(k.controles), `Ajuste acumulado ${fmt(k.ajusteTotal, 0)} bolsas`));
  }
  $('insKpis').innerHTML = h.join('');

  const s = ins.serie.filter(r => r.f >= p.a && r.f <= p.b && r.stock !== null && r.stock !== undefined);
  $('tStock').textContent = `Evolución del stock [${u}]` + (id === 'gasoil' ? ' (disponible, sin reserva de ' + fmt(ST.datos.params.reservaCisterna) + ' L)' : '');
  grafico('chStock', {
    type: 'line',
    data: {
      labels: s.map(r => fFecha(r.f)),
      datasets: [
        { label: 'Stock', data: s.map(r => r.stock), borderColor: I.color, backgroundColor: I.color + '22', fill: true, pointRadius: 0, borderWidth: 1.8, tension: 0 },
        { label: 'Punto de pedido (actual)', data: s.map(() => ins.pp), borderColor: '#d98e1f', borderDash: [6, 4], pointRadius: 0, borderWidth: 1.5 },
        { label: 'Stock de seguridad (actual)', data: s.map(() => ins.ss), borderColor: '#c0392b', borderDash: [3, 3], pointRadius: 0, borderWidth: 1.5 }
      ]
    },
    options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.parsed.y, dec) } } }, scales: { x: { ticks: { maxTicksLimit: 8, autoSkip: true }, grid: { display: false } }, y: ejeNum(0) } }
  });

  const men = mensual(id);
  $('tMensual').textContent = `Consumo diario promedio por mes [${u}/día]`;
  grafico('chMensual', {
    type: 'bar',
    data: { labels: men.map(r => fMes(r.mes)), datasets: [{ label: `${u}/día`, data: men.map(r => r.v), backgroundColor: men.map(r => (r.mes >= p.a.slice(0, 7) && r.mes <= p.b.slice(0, 7)) ? I.color : I.color + '55') }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.y, dec) + ' ' + u + '/día' } } }, scales: { x: { grid: { display: false } }, y: ejeNum(0) } }
  });

  $('insEspecifico').innerHTML = '';
  if (id === 'tarimas') especificoTarimas(p);
  if (id === 'stretch') especificoStretch(p);
  if (id === 'gasoil') especificoGasoil(p, P);
  if (id === 'cal') especificoCal(p);
}

function mensual(id) {
  const ins = ST.modelo[id], fin = ST.modelo.fin;
  const acc = {}, dias = {};
  ins.serie.forEach(r => { if (r.f > fin) return; const m = r.f.slice(0, 7); acc[m] = (acc[m] || 0) + r.cons; dias[m] = (dias[m] || 0) + 1; });
  return Object.keys(acc).sort().map(m => ({ mes: m, v: acc[m] / dias[m] }));
}

function tablaProveedores(movs, u, dec, conBob) {
  const g = {};
  movs.forEach(m => { const k = m.prov || '(sin proveedor)'; g[k] = g[k] || { n: 0, q: 0, bob: 0 }; g[k].n += m.cant > 0 ? 1 : 0; g[k].q += m.cant; g[k].bob += m.bob || 0; });
  const tot = sumar(Object.values(g), 'q');
  const filas = Object.entries(g).sort((a, b) => b[1].q - a[1].q);
  if (!filas.length) return '<p class="vacio">Sin ingresos en el período.</p>';
  return `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Proveedor</th><th>Entregas</th><th>Cantidad [${u}]</th><th>Participación</th><th>Promedio por entrega</th>${conBob ? '<th>Bobinas</th><th>Kg/bobina</th>' : ''}</tr></thead><tbody>` +
    filas.map(([p, x]) => `<tr><td>${esc(p)}</td><td>${fmt(x.n)}</td><td>${fmt(x.q, dec)}</td><td>${pct(tot ? 100 * x.q / tot : null)}</td><td>${fmt(x.n ? x.q / x.n : null, dec)}</td>${conBob ? `<td>${fmt(x.bob, 0)}</td><td>${fmt(x.bob ? x.q / x.bob : null, 1)}</td>` : ''}</tr>`).join('') +
    `<tr class="total"><td>Total</td><td>${fmt(sumar(filas.map(f => f[1].n)))}</td><td>${fmt(tot, dec)}</td><td>100,0 %</td><td></td>${conBob ? '<td></td><td></td>' : ''}</tr></tbody></table></div>`;
}

function panelHtml(titulo, cuerpo) { return `<div class="panel"><h3>${titulo}</h3>${cuerpo}</div>`; }

function especificoTarimas(p) {
  const ins = ST.modelo.tarimas;
  const mv = movsPeriodo(ins, p).filter(m => m.tipo === 'Ingreso');
  $('insEspecifico').innerHTML = `<div class="grid-2">${panelHtml('Ingresos por proveedor', tablaProveedores(mv, 'u', 0))}${panelHtml('Inventario físico vs. sistema [%]', '<div class="chart-box h300"><canvas id="chEsp1"></canvas></div>')}</div>` +
    panelHtml('Consumo, ingresos y descarte por mes [u]', '<div class="chart-box h300"><canvas id="chEsp2"></canvas></div>');
  const inv = ins.inventario.filter(r => r.sis);
  grafico('chEsp1', {
    type: 'bar',
    data: { labels: inv.map(r => fFecha(r.f)), datasets: [{ label: 'Diferencia (sistema − físico) / sistema', data: inv.map(r => 100 * (r.sis - r.fis) / r.sis), backgroundColor: inv.map(r => Math.abs((r.sis - r.fis) / r.sis) > 0.05 ? '#c0392b' : '#3d8b37') }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => pct(c.parsed.y) + ` (físico ${fmt(inv[c.dataIndex].fis)} · sistema ${fmt(inv[c.dataIndex].sis)})` } } }, scales: { x: { grid: { display: false } }, y: ejeNum(0) } }
  });
  const g = {};
  ins.serie.filter(r => r.f <= ST.modelo.fin).forEach(r => { const m = r.f.slice(0, 7); g[m] = g[m] || { c: 0, i: 0, d: 0 }; g[m].c += r.cons; g[m].i += r.ing; g[m].d += r.desc; });
  const ms = Object.keys(g).sort();
  grafico('chEsp2', {
    type: 'bar',
    data: { labels: ms.map(fMes), datasets: [
      { label: 'Consumo', data: ms.map(m => g[m].c), backgroundColor: '#a0522d' },
      { label: 'Ingresos', data: ms.map(m => g[m].i), backgroundColor: '#0270ba' },
      { label: 'Descarte (eje der.)', data: ms.map(m => g[m].d), type: 'line', borderColor: '#c0392b', yAxisID: 'y2', pointRadius: 2 }
    ] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: ejeNum(0), y2: { position: 'right', grid: { display: false }, ticks: { callback: v => fmt(v) } } } }
  });
}

function especificoStretch(p) {
  const ins = ST.modelo.stretch;
  const mv = movsPeriodo(ins, p).filter(m => m.tipo !== 'Envío');
  $('insEspecifico').innerHTML = panelHtml('Ingresos por proveedor', tablaProveedores(mv, 'kg', 1, true)) + `<div class="grid-2">${panelHtml('Stretch por pallet por mes [g/pallet]', '<div class="chart-box h300"><canvas id="chEsp1"></canvas></div>')}${panelHtml('Inventario físico vs. sistema [bobinas]', '<div class="chart-box h300"><canvas id="chEsp2"></canvas></div>')}</div>`;
  const tar = {};
  ST.modelo.tarimas.serie.forEach(r => { tar[r.f] = r.cons; });
  const g = {};
  ins.serie.filter(r => r.f <= ST.modelo.fin && r.cons > 0 && tar[r.f] > 0).forEach(r => { const m = r.f.slice(0, 7); g[m] = g[m] || { kg: 0, p: 0 }; g[m].kg += r.cons; g[m].p += tar[r.f]; });
  const ms = Object.keys(g).sort();
  grafico('chEsp1', {
    type: 'line',
    data: { labels: ms.map(fMes), datasets: [{ label: 'g/pallet', data: ms.map(m => 1000 * g[m].kg / g[m].p), borderColor: '#0270ba', pointRadius: 3, tension: 0 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.y, 0) + ' g/pallet' } } }, scales: { x: { grid: { display: false } }, y: ejeNum(0) } }
  });
  const inv = ins.inventario;
  grafico('chEsp2', {
    type: 'bar',
    data: { labels: inv.map(r => fFecha(r.f)), datasets: [{ label: 'Físico', data: inv.map(r => r.fis), backgroundColor: '#0270ba' }, { label: 'Sistema', data: inv.map(r => r.sis), backgroundColor: '#8c949c' }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: ejeNum(0) } }
  });
}

function especificoCal(p) {
  const ins = ST.modelo.cal;
  const s = ins.serie.filter(r => r.f >= p.a && r.f <= p.b);
  $('insEspecifico').innerHTML = panelHtml('Consumo diario [bolsas]', '<div class="chart-box h300"><canvas id="chEsp1"></canvas></div>') +
    panelHtml('Ingresos del período', tablaProveedores(movsPeriodo(ins, p).map(m => Object.assign({}, m, { prov: m.obs || '(sin detalle)' })), 'bolsas', 0));
  grafico('chEsp1', {
    type: 'bar',
    data: { labels: s.map(r => fFecha(r.f)), datasets: [{ label: 'Consumo', data: s.map(r => r.cons), backgroundColor: '#7a8592' }, { label: 'Consumo turno 1', data: s.map(r => r.consT1), type: 'line', borderColor: '#0270ba', pointRadius: 2 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: ejeNum(0) } }
  });
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

function especificoGasoil(p, P) {
  const G = agruparGasoil(p, P);
  const conC = !!G.c;
  const dv = (l, lc) => conC ? (lc ? 100 * (l / G.dias - lc / G.diasC) / (lc / G.diasC) : null) : null;
  const deps = Object.entries(G.dep).sort((a, b) => b[1].l - a[1].l);
  const tDep = `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Departamento</th><th>Unidades</th><th>Litros</th><th>L/día</th><th>Participación</th>${conC ? '<th>L/día comparado</th><th>Variación</th>' : ''}</tr></thead><tbody>` +
    deps.map(([d, x]) => { const v = dv(x.l, G.depC[d]); return `<tr><td>${esc(d)}</td><td>${x.u.size}</td><td>${fmt(x.l, 0)}</td><td>${fmt(x.l / G.dias, 1)}</td><td>${pct(100 * x.l / G.tot)}</td>${conC ? `<td>${G.depC[d] ? fmt(G.depC[d] / G.diasC, 1) : '—'}</td><td class="${dClase(v)}">${G.depC[d] ? (v > 999 ? '> +999 %' : delta(v)) : 'Nuevo'}</td>` : ''}</tr>`; }).join('') + '</tbody></table></div>';
  const max = Math.max.apply(null, Object.values(G.uni).map(x => x.l).concat([1]));
  const tUni = `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Unidad</th><th>L/día</th><th>Litros</th><th>Participación</th><th>Despachos</th><th>L/despacho</th>${conC ? '<th>L/día comparado</th><th>Variación</th>' : ''}</tr></thead><tbody>` +
    deps.map(([d]) => `<tr class="grupo"><td colspan="${conC ? 8 : 6}">${esc(d)}</td></tr>` + Object.entries(G.uni).filter(e => e[1].d === d).sort((a, b) => b[1].l - a[1].l).map(([u, x]) => {
      const v = dv(x.l, G.uniC[u]);
      return `<tr><td>${esc(u)}</td><td>${fmt(x.l / G.dias, 1)} <span style="display:inline-block;width:60px;height:7px;background:#edf0f3;border-radius:3px;vertical-align:middle;margin-left:6px"><span style="display:block;height:100%;width:${100 * x.l / max}%;background:#3d8b37;border-radius:3px"></span></span></td><td>${fmt(x.l, 0)}</td><td>${pct(100 * x.l / G.tot)}</td><td>${fmt(x.n)}</td><td>${fmt(x.l / x.n, 1)}</td>${conC ? `<td>${G.uniC[u] ? fmt(G.uniC[u] / G.diasC, 1) : '—'}</td><td class="${dClase(v)}">${G.uniC[u] ? (v > 999 ? '> +999 %' : delta(v)) : 'Nueva'}</td>` : ''}</tr>`;
    }).join('')).join('') + '</tbody></table></div>';
  const cargas = movsPeriodo(ST.modelo.gasoil, p).filter(m => m.tipo === 'Carga cisterna');
  const tCargas = cargas.length ? `<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Litros</th><th class="txt">Observaciones</th></tr></thead><tbody>${cargas.slice().reverse().map(m => `<tr><td>${fFecha(m.f)}</td><td>${fmt(m.cant, 0)}</td><td class="txt">${esc(m.obs)}</td></tr>`).join('')}</tbody></table></div><p class="nota">${cargas.length} cargas · ${fmt(sumar(cargas, 'cant'), 0)} L · ${fmt(sumar(cargas, 'cant') / cargas.length, 0)} L por carga</p>` : '<p class="vacio">Sin cargas registradas en el período (el registro de cargas comienza en 2026).</p>';
  $('insEspecifico').innerHTML = panelHtml('Consumo por departamento', tDep) + panelHtml('Consumo diario por departamento y mes [L/día]', '<div class="chart-box h300"><canvas id="chEsp1"></canvas></div>') +
    panelHtml('Consumo diario promedio por unidad', tUni) + panelHtml('Cargas de cisterna', tCargas);
  const ins = ST.modelo.gasoil, fin = ST.modelo.fin;
  const totD = {};
  ins.tx.forEach(t => { totD[t.d] = (totD[t.d] || 0) + t.l; });
  const top = Object.entries(totD).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  const series = top.concat(['Resto']);
  const g = {}, dias = {};
  ins.serie.filter(r => r.f <= fin).forEach(r => { const m = r.f.slice(0, 7); dias[m] = (dias[m] || 0) + 1; });
  ins.tx.filter(t => t.f <= fin).forEach(t => { const m = t.f.slice(0, 7), s = top.includes(t.d) ? t.d : 'Resto'; g[m + '|' + s] = (g[m + '|' + s] || 0) + t.l; });
  const ms = Object.keys(dias).sort();
  grafico('chEsp1', {
    type: 'bar',
    data: { labels: ms.map(fMes), datasets: series.map((s, i) => ({ label: s, data: ms.map(m => (g[m + '|' + s] || 0) / dias[m]), backgroundColor: PALETA[i] })) },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.parsed.y, 1) + ' L/día' } } }, scales: { x: { stacked: true, grid: { display: false } }, y: Object.assign({ stacked: true }, ejeNum(0)) } }
  });
}

const OPS = {
  tarimas: [
    { id: 'ingresoTarimas', nombre: 'Ingreso de proveedor', campos: ['fecha', 'cantidad', 'proveedor', 'remito', 'obs'], ayuda: 'Se agrega a MovimientosTarimas; suma al stock del día.' },
    { id: 'envioTarimas', nombre: 'Envío a otra planta', campos: ['fecha', 'cantidad', 'remito', 'obs'], ayuda: 'Se registra con proveedor «Envío» y descuenta del stock.' },
    { id: 'descarteTarimas', nombre: 'Descarte', campos: ['fecha', 'cantidad', 'proveedor', 'obs'], ayuda: 'Tarimas rotas o no aptas; descuenta del stock.', provOpcional: true },
    { id: 'controlFisico', nombre: 'Control físico 6:00', campos: ['fecha', 'cantidad'], ayuda: 'Conteo a las 6:00. El ajuste se calcula contra el stock del sistema a esa hora.', etiqueta: 'Tarimas contadas' },
    { id: 'inventario', nombre: 'Inventario físico (comparación)', campos: ['fecha', 'cantidad'], ayuda: 'Se agrega a «InventarioVsSistema»; no ajusta el stock.', etiqueta: 'Tarimas contadas' }
  ],
  stretch: [
    { id: 'ingresoStretch', nombre: 'Ingreso de proveedor', campos: ['fecha', 'kg', 'bobinas', 'proveedor', 'remito', 'obs'], ayuda: 'Si dejás vacías las bobinas se calculan como kg ÷ 15. Para devoluciones al proveedor cargá kg negativos.' },
    { id: 'envioStretch', nombre: 'Envío a otra planta', campos: ['fecha', 'kg', 'bobinas', 'remito', 'obs'], ayuda: 'Se registra con proveedor «Envío» y descuenta del stock.' },
    { id: 'consumoStretch', nombre: 'Consumo del día [kg]', campos: ['fecha', 'kg', 'sobrescribir'], ayuda: 'Se escribe en StockDiarioStretch (columna Consumo Stretch [Kg]).' },
    { id: 'controlFisico', nombre: 'Control físico 6:00 [bobinas]', campos: ['fecha', 'cantidad'], ayuda: 'Conteo de bobinas a las 6:00.', etiqueta: 'Bobinas contadas' },
    { id: 'inventario', nombre: 'Inventario físico (comparación) [bobinas]', campos: ['fecha', 'cantidad'], ayuda: 'Se agrega a «StretchInventarioVsSistema»; no ajusta el stock.', etiqueta: 'Bobinas contadas' }
  ],
  gasoil: [
    { id: 'cargaGasoil', nombre: 'Carga de cisterna', campos: ['fecha', 'hora', 'valor', 'obs'], ayuda: 'Litros descargados por el proveedor en la cisterna (Cargas_y_Ajustes).', etiqueta: 'Litros cargados' },
    { id: 'sondaGasoil', nombre: 'Medición de sonda', campos: ['fecha', 'hora', 'valor', 'obs'], ayuda: 'Altura en cm (0 a 219). Reemplaza el stock teórico de ese día.', etiqueta: 'Altura de sonda [cm]' }
  ],
  cal: [
    { id: 'ingresoCal', nombre: 'Ingreso de proveedor', campos: ['fecha', 'cantidad', 'provTexto', 'remito', 'obs'], ayuda: 'Se agrega a MovimientosCal.', etiqueta: 'Bolsas' },
    { id: 'controlFisico', nombre: 'Control físico 6:00', campos: ['fecha', 'cantidad'], ayuda: 'Conteo de bolsas a las 6:00.', etiqueta: 'Bolsas contadas' }
  ]
};

function campoHtml(c, op, insumo) {
  const hoy = hoyLocal();
  const ahora = new Date().toTimeString().slice(0, 5);
  switch (c) {
    case 'fecha': return `<label>Fecha<input type="date" name="fecha" value="${hoy}" max="${hoy}" required></label>`;
    case 'hora': return `<label>Hora<input type="time" name="hora" value="${ahora}"></label>`;
    case 'cantidad': return `<label>${op.etiqueta || 'Cantidad [' + INSUMOS[insumo].u + ']'}<input type="number" name="cantidad" min="0" step="1" required inputmode="numeric"></label>`;
    case 'kg': return `<label>Kilos<input type="number" name="kg" step="0.1" required inputmode="decimal"></label>`;
    case 'bobinas': return `<label>Bobinas<input type="number" name="bobinas" step="1" inputmode="numeric" placeholder="kg ÷ 15"></label>`;
    case 'valor': return `<label>${op.etiqueta}<input type="number" name="valor" min="0" step="${op.id === 'sondaGasoil' ? '0.1' : '1'}" required inputmode="decimal"></label>`;
    case 'proveedor': {
      const lista = (ST.datos ? ST.datos.proveedores : []).filter(p => p.insumo.toLowerCase() === INSUMOS[insumo].nombre.toLowerCase() && p.proveedor !== 'Envío').map(p => p.proveedor);
      return `<label>Proveedor<select name="proveedor" ${op.provOpcional ? '' : 'required'}><option value="">${op.provOpcional ? '(sin proveedor)' : 'Elegir…'}</option>${lista.map(p => `<option>${esc(p)}</option>`).join('')}</select></label>`;
    }
    case 'provTexto': return '<label>Proveedor<input type="text" name="proveedor" maxlength="80"></label>';
    case 'remito': return '<label>Remito<input type="text" name="remito" maxlength="40"></label>';
    case 'obs': return '<label class="ancho">Observaciones<input type="text" name="obs" maxlength="200"></label>';
    case 'sobrescribir': return '<label class="check"><input type="checkbox" name="sobrescribir"> Sobrescribir si ya hay un consumo cargado</label>';
    default: return '';
  }
}

function opActual() {
  const ins = $('fInsumo').value;
  return { ins, op: OPS[ins].find(o => o.id === $('fOperacion').value) || OPS[ins][0] };
}

function renderOperaciones() {
  const ins = $('fInsumo').value;
  $('fOperacion').innerHTML = OPS[ins].map(o => `<option value="${o.id}">${o.nombre}</option>`).join('');
  renderCampos();
  renderUltimos();
}

function renderCampos() {
  const { ins, op } = opActual();
  $('fAyuda').textContent = op.ayuda || '';
  $('camposDinamicos').innerHTML = op.campos.map(c => campoHtml(c, op, ins)).join('');
  $('fPreview').textContent = '';
  $('camposDinamicos').querySelectorAll('input,select').forEach(el => { el.oninput = actualizarPreview; });
}

function litrosSonda(cm) {
  if (!(cm > 0)) return 0;
  const r = 109.5, L = 10.55;
  if (cm >= 219) return L * Math.PI * r * r / 10;
  const h = Math.min(cm + 10.5, 2 * r);
  return L * (r * r * Math.acos((r - h) / r) - (r - h) * Math.sqrt(2 * r * h - h * h)) / 10;
}

function actualizarPreview() {
  const { ins, op } = opActual();
  const fd = new FormData($('formRegistro'));
  const M = ST.modelo;
  let t = '';
  if (!M) { $('fPreview').textContent = ''; return; }
  const fecha = fd.get('fecha');
  const dia = M[ins].serie.find(r => r.f === fecha);
  if (op.id === 'sondaGasoil') {
    const cm = parseFloat(fd.get('valor'));
    if (cm > 0) {
      const l = litrosSonda(cm);
      t = `Equivale a ${fmt(l, 0)} L en cisterna (${fmt(l - ST.datos.params.reservaCisterna, 0)} L disponibles).`;
      if (dia && dia.stockTot !== null) t += ` Stock teórico del día: ${fmt(dia.stockTot, 0)} L.`;
    }
  } else if (op.id === 'controlFisico') {
    const q = parseFloat(fd.get('cantidad'));
    if (dia && isFinite(q)) {
      const sis = ins === 'stretch' ? (dia.ini !== null ? dia.ini / ST.datos.params.kgPorBobina - (dia.consT1 || 0) : null) : (dia.sist !== null ? dia.sist - (dia.consT1 || 0) : null);
      if (sis !== null) t = `Stock del sistema a las 6:00 ≈ ${fmt(sis, 0)} · ajuste resultante ${fmt(q - sis, 0)}.`;
    }
  } else if (op.id === 'inventario') {
    const q = parseFloat(fd.get('cantidad'));
    const s = M[ins].ultimo;
    if (s && isFinite(q)) {
      const sis = ins === 'stretch' ? s.stockBob : s.stock;
      t = `Stock del sistema (${fFecha(s.f)}): ${fmt(sis, 0)} · diferencia ${pct(sis ? 100 * (sis - q) / sis : null)}.`;
    }
  } else if (op.id === 'consumoStretch') {
    if (dia && dia.consCargado) t = `Ya hay ${fmt(dia.cons, 1)} kg cargados para esa fecha.`;
    const tar = M.tarimas.serie.find(r => r.f === fecha);
    const kg = parseFloat(fd.get('kg'));
    if (tar && tar.cons > 0 && kg > 0) t += ` ${fmt(1000 * kg / tar.cons, 0)} g/pallet sobre ${fmt(tar.cons)} pallets.`;
  } else {
    const q = parseFloat(fd.get('cantidad') || fd.get('kg') || fd.get('valor'));
    const s = M[ins].ultimo;
    if (s && isFinite(q)) {
      const signo = /envio|descarte/i.test(op.id) ? -1 : 1;
      t = `Stock actual ${fmt(s.stock, 0)} ${INSUMOS[ins].u} → ${fmt(s.stock + signo * q, 0)} ${INSUMOS[ins].u}.`;
    }
  }
  $('fPreview').textContent = t.trim();
}

async function enviarRegistro(e) {
  e.preventDefault();
  const { ins, op } = opActual();
  const fd = new FormData($('formRegistro'));
  const usuario = $('fUsuario').value.trim();
  LS.set('ic_usuario', usuario);
  const p = { accion: op.id, insumo: ins, usuario };
  op.campos.forEach(c => { if (c === 'sobrescribir') p.sobrescribir = fd.get('sobrescribir') === 'on'; else if (c === 'provTexto') p.proveedor = fd.get('proveedor'); else p[c] = fd.get(c); });
  const btn = $('btnGuardar');
  btn.disabled = true;
  btn.textContent = 'Guardando…';
  try {
    const msg = await apiPost(p);
    toast(msg || 'Registrado');
    renderCampos();
    await cargar(true);
  } catch (err) {
    toast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar';
  }
}

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

function filasMovs(l, conAnular) {
  return l.map(m => `<tr><td>${fFecha(m.f)}</td><td class="txt">${esc(m.tipo)}</td><td>${esc(m.det)}</td><td class="txt">${esc(m.prov || '')}</td><td class="txt">${esc(m.remito || '')}</td><td class="txt">${esc(m.obs || '')}</td>${conAnular ? `<td>${m.hoja ? `<button class="btn ghost mini" data-anular="${m.hoja}|${m.fila}|${m.f}|${m.q}">Anular</button>` : ''}</td>` : ''}</tr>`).join('');
}

function renderUltimos() {
  const ins = $('fInsumo').value;
  const l = listaMovimientos(ins).slice(0, 10);
  $('tablaUltimos').innerHTML = `<thead><tr><th>Fecha</th><th class="txt">Tipo</th><th>Detalle</th><th class="txt">${ins === 'gasoil' ? 'Hora' : 'Proveedor'}</th><th class="txt">Remito</th><th class="txt">Obs.</th></tr></thead><tbody>${filasMovs(l, false) || '<tr><td colspan="6" class="vacio">Sin registros</td></tr>'}</tbody>`;
}

function renderMovimientos() {
  const ins = $('mInsumo').value, desde = $('mDesde').value, hasta = $('mHasta').value, q = $('mBuscar').value.trim().toLowerCase();
  let l = listaMovimientos(ins);
  if (desde) l = l.filter(m => m.f >= desde);
  if (hasta) l = l.filter(m => m.f <= hasta);
  if (q) l = l.filter(m => [m.tipo, m.prov, m.remito, m.obs, m.det].join(' ').toLowerCase().includes(q));
  const total = l.length;
  l = l.slice(0, 300);
  $('tablaMovs').innerHTML = `<thead><tr><th>Fecha</th><th class="txt">Tipo</th><th>Detalle</th><th class="txt">${ins === 'gasoil' ? 'Hora' : 'Proveedor'}</th><th class="txt">Remito</th><th class="txt">Obs.</th><th></th></tr></thead><tbody>${filasMovs(l, true) || '<tr><td colspan="7" class="vacio">Sin registros</td></tr>'}</tbody>`;
  $('movsNota').textContent = total > 300 ? `Se muestran 300 de ${total} registros. Filtrá por fecha para ver el resto.` : `${total} registros. Los controles físicos e inventarios se corrigen desde la planilla.`;
  $('tablaMovs').querySelectorAll('[data-anular]').forEach(b => {
    b.onclick = async () => {
      const [hoja, fila, f, qq] = b.dataset.anular.split('|');
      if (!(await confirmar(`¿Anular el registro del ${fFecha(f)} (${qq})? Se elimina la fila ${fila} de la planilla.`))) return;
      try {
        toast(await apiPost({ accion: 'anular', hoja, fila: +fila, fecha: f, cantidad: +qq, usuario: LS.get('ic_usuario', '') }));
        await cargar(true);
      } catch (err) { toast(err.message, true); }
    };
  });
}

function renderParametros() {
  const M = ST.modelo;
  $('tablaParams').innerHTML = '<thead><tr><th>Insumo</th><th>Consumo medio</th><th>Días SS</th><th>Días PP</th><th>Stock de seguridad</th><th>Punto de pedido</th><th>Stock actual</th><th></th></tr></thead><tbody>' +
    ORDEN.map(id => {
      const x = M[id], I = INSUMOS[id];
      return `<tr><td>${I.nombre}${x.paramGuardado ? '' : ' <span class="pill na">por defecto</span>'}</td><td>${fmt(x.medio, I.dec)} ${I.u}/día</td>
        <td><input type="number" min="1" step="1" value="${x.diasSS}" id="pSS-${id}" style="width:70px"></td>
        <td><input type="number" min="1" step="1" value="${x.diasPP}" id="pPP-${id}" style="width:70px"></td>
        <td>${fmt(x.ss)} ${I.u}</td><td>${fmt(x.pp)} ${I.u}</td><td>${fmt(x.stock)} ${I.u}</td>
        <td><button class="btn mini" data-param="${id}">Guardar</button></td></tr>`;
    }).join('') + '</tbody>';
  $('tablaParams').querySelectorAll('[data-param]').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.param;
      b.disabled = true;
      try {
        toast(await apiPost({ accion: 'parametros', insumo: id, diasSS: +$('pSS-' + id).value, diasPP: +$('pPP-' + id).value, usuario: LS.get('ic_usuario', '') }));
        await cargar(true);
      } catch (err) { toast(err.message, true); } finally { b.disabled = false; }
    };
  });
}

function irTab(tab) {
  if (INSUMOS[tab]) { ST.insumo = tab; ST.tab = tab; } else ST.tab = tab;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('activo', b.dataset.tab === tab));
  document.querySelectorAll('.tab').forEach(s => s.classList.remove('activo'));
  const sec = INSUMOS[tab] ? 'insumo' : tab;
  $('tab-' + sec).classList.add('activo');
  if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
  render();
  window.scrollTo(0, 0);
}

function render() {
  if (!ST.modelo) return;
  if (ST.tab === 'resumen') renderResumen();
  else if (INSUMOS[ST.tab]) renderInsumo();
  else if (ST.tab === 'registrar') { renderUltimos(); actualizarPreview(); }
  else if (ST.tab === 'movimientos') renderMovimientos();
  else if (ST.tab === 'parametros') renderParametros();
}

async function cargar(forzar) {
  const est = $('estado');
  if (!forzar) {
    const cache = LS.get('ic_cache', null);
    if (cache) aplicarDatos(cache, true);
  }
  est.textContent = 'Actualizando…';
  try {
    const d = await apiGet();
    LS.set('ic_cache', d);
    aplicarDatos(d, false);
  } catch (err) {
    est.textContent = ST.datos ? 'Sin conexión · datos guardados' : 'Sin datos';
    toast(err.message, true);
    if (!ST.datos && !conexion().url) irTab('parametros');
  }
}

function aplicarDatos(d, desdeCache) {
  ST.datos = d;
  ST.modelo = construirModelo(d);
  const t = new Date(d.generado);
  $('estado').textContent = (desdeCache ? 'Guardado ' : 'Actualizado ') + t.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  render();
}

function init() {
  $('planta').textContent = CONF.PLANTA || '';
  document.querySelectorAll('#tabs button').forEach(b => { b.onclick = () => irTab(b.dataset.tab); });
  document.querySelectorAll('#periodos button').forEach(b => { b.onclick = () => { ST.per = b.dataset.per; render(); }; });
  $('btnRefrescar').onclick = () => cargar(true);
  $('fInsumo').onchange = renderOperaciones;
  $('fOperacion').onchange = () => { renderCampos(); };
  $('formRegistro').onsubmit = enviarRegistro;
  $('formRegistro').onreset = () => setTimeout(renderCampos, 0);
  $('fUsuario').value = LS.get('ic_usuario', '');
  ['mInsumo', 'mDesde', 'mHasta', 'mBuscar'].forEach(i => { $(i).oninput = renderMovimientos; });
  const c = conexion();
  $('cUrl').value = c.url || '';
  $('cKey').value = c.key || '';
  $('formConexion').onsubmit = async e => {
    e.preventDefault();
    LS.set('ic_url', $('cUrl').value.trim());
    LS.set('ic_key', $('cKey').value.trim());
    await cargar(true);
    if (ST.datos) toast('Conexión correcta');
  };
  renderOperaciones();
  const h = location.hash.replace('#', '');
  irTab(h && (INSUMOS[h] || $('tab-' + h)) ? h : 'resumen');
  cargar(false);
}

document.addEventListener('DOMContentLoaded', init);
