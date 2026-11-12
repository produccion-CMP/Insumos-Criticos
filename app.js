'use strict';

const VISTAS = [
  { id: 'resumen', e: '🏠', n: 'Inicio' },
  { id: 'tarimas', e: '🪵', n: 'Tarimas' },
  { id: 'stretch', e: '🧻', n: 'Stretch' },
  { id: 'gasoil', e: '⛽', n: 'Gasoil' },
  { id: 'cal', e: '🪣', n: 'Cal' },
  { id: 'registrar', e: '➕', n: 'Registrar' },
  { id: 'movimientos', e: '🧾', n: 'Movimientos' },
  { id: 'parametros', e: '⚙️', n: 'Ajustes' }
];
const BNAV = [
  { id: 'resumen', e: '🏠', n: 'Inicio' },
  { id: 'insumo', e: '📦', n: 'Insumos' },
  { id: 'registrar', e: '➕', n: 'Registrar' },
  { id: 'movimientos', e: '🧾', n: 'Movim.' },
  { id: 'parametros', e: '⚙️', n: 'Ajustes' }
];
const PERIODOS_UI = [
  { id: 'hist', e: '📚', n: 'Histórico' },
  { id: 'u365', e: '📅', n: 'Últimos 365 días' },
  { id: 'ytd', e: '🗓️', n: 'Año vs. anterior' },
  { id: 'trim', e: '📊', n: 'Último trimestre' }
];
const ESTADO = { ok: '🟢 Normal', warn: '🟠 Pedir', bad: '🔴 Crítico', na: '⚪ Sin datos' };
const FRASES = ['Contando tarimas…', 'Midiendo la cisterna…', 'Pesando bobinas de stretch…', 'Apilando bolsas de cal…', 'Calculando coberturas…'];
const DIAS_SEM = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const cv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const colorIns = id => cv('--c-' + id);
const colorEst = e => cv({ ok: '--ok', warn: '--warn', bad: '--bad', na: '--muted' }[e] || '--muted');
const alfa = (hex, a) => { const h = hex.replace('#', ''); if (h.length !== 6) return hex; return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; };
const app = () => $('app');

function toast(msg, tipo) {
  const t = document.createElement('div');
  const ic = { ok: '✅', bad: '❌', warn: '⚠️' }[tipo] || 'ℹ️';
  t.className = 'toast ' + (tipo || '');
  t.innerHTML = `<span class="ic">${ic}</span><span>${esc(msg)}</span>`;
  $('toasts').appendChild(t);
  setTimeout(() => { t.classList.add('sale'); setTimeout(() => t.remove(), 320); }, tipo === 'bad' ? 6500 : 3800);
}

function confirmar(texto, ico) {
  return new Promise(res => {
    const d = $('dlg');
    $('dlgTexto').textContent = texto;
    d.querySelector('.dlg-ico').textContent = ico || '🗑️';
    d.returnValue = '';
    d.onclose = () => res(d.returnValue === 'si');
    d.showModal();
  });
}

function loader(on) { $('toploader').classList.toggle('on', !!on); }

function estadoRed(tipo, txt) {
  const r = $('red');
  r.className = 'estado-red' + (tipo === 'off' ? ' off' : tipo === 'cache' ? ' cache' : '');
  r.querySelector('span').textContent = txt;
}

function moverPill(cont) {
  if (!cont) return;
  let pill = cont.querySelector(':scope > .pill');
  if (!pill) { pill = document.createElement('span'); pill.className = 'pill'; cont.prepend(pill); }
  const on = cont.querySelector(':scope > .on');
  if (!on) { pill.style.width = '0'; return; }
  pill.style.left = on.offsetLeft + 'px';
  pill.style.width = on.offsetWidth + 'px';
}

function pintarNav() {
  const v = ST.vista;
  const prev = $('nav').querySelector('.pill');
  const pl = prev ? prev.style.left : '', pw = prev ? prev.style.width : '';
  $('nav').innerHTML = VISTAS.map(x => `<a href="#/${x.id}" class="${x.id === v ? 'on' : ''}" title="${x.n}"><span class="e">${x.e}</span><span class="tx">${x.n}</span></a>`).join('');
  $('bnav').innerHTML = BNAV.map(x => {
    const act = x.id === 'insumo' ? INSUMOS[v] : x.id === v;
    const href = x.id === 'insumo' ? '#/' + ST.insumo : '#/' + x.id;
    return `<a href="${href}" class="${act ? 'on' : ''}"><span class="e">${x.id === 'insumo' && INSUMOS[ST.insumo] ? INSUMOS[ST.insumo].emoji : x.e}</span>${x.n}</a>`;
  }).join('');
  if (pl) { const p = document.createElement('span'); p.className = 'pill'; p.style.left = pl; p.style.width = pw; $('nav').prepend(p); }
  requestAnimationFrame(() => requestAnimationFrame(() => moverPill($('nav'))));
}

function reloj() {
  const d = new Date();
  $('relojHora').textContent = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const t = turnoActual(d);
  $('relojTurno').textContent = 'Turno ' + t.t;
  $('relojRango').textContent = t.txt;
  $('relojAvance').style.width = Math.round(100 * t.avance) + '%';
}

function temaActual() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function alternarTema() {
  const n = temaActual() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', n);
  LS.set('ic_tema', n);
  $('btnTema').textContent = n === 'dark' ? '☀️' : '🌙';
  render();
}

function destruir(id) { if (ST.charts[id]) { ST.charts[id].destroy(); delete ST.charts[id]; } }
function destruirTodos() { Object.keys(ST.charts).forEach(destruir); }

function grafico(id, cfg) {
  destruir(id);
  const el = $(id);
  if (!el || !window.Chart) return null;
  Chart.defaults.font.family = cv('--font') || 'Plus Jakarta Sans, sans-serif';
  Chart.defaults.font.weight = 600;
  Chart.defaults.color = cv('--muted');
  Chart.defaults.borderColor = cv('--line');
  Chart.defaults.plugins.tooltip.backgroundColor = cv('--text');
  Chart.defaults.plugins.tooltip.titleColor = cv('--bg');
  Chart.defaults.plugins.tooltip.bodyColor = cv('--bg');
  Chart.defaults.plugins.tooltip.cornerRadius = 10;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxHeight = 8;
  ST.charts[id] = new Chart(el, cfg);
  return ST.charts[id];
}

const ejeY = dec => ({ beginAtZero: true, ticks: { callback: v => fmt(v, dec) }, grid: { color: cv('--line') }, border: { display: false } });
const ejeX = () => ({ grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } });

function capacidad(x, id) {
  if (id === 'gasoil' && ST.datos) return litrosSonda(219) - ST.datos.params.reservaCisterna;
  return Math.max((x.pp || 0) * 1.5, (x.stock || 0) * 1.1, 1);
}

function ilus(id, stock, x, extra) {
  const cap = capacidad(x, id);
  const fr = Math.max(0, Math.min(1, (stock || 0) / cap));
  const fSS = x.ss ? Math.min(1, x.ss / cap) : null;
  const fPP = x.pp ? Math.min(1, x.pp / cap) : null;
  const pct = Math.round(fr * 100);
  const uid = id + Math.random().toString(36).slice(2, 7);
  let cuerpo = '';
  if (id === 'gasoil') {
    const y0 = 26, h = 62, top = y0 + h * (1 - fr);
    const lin = f => f === null ? '' : `<line class="ref ${f === fSS ? 'ss' : 'pp'}" x1="8" x2="104" y1="${y0 + h * (1 - f)}" y2="${y0 + h * (1 - f)}"/>`;
    cuerpo = `<defs><clipPath id="c${uid}"><rect x="8" y="${y0}" width="96" height="${h}" rx="31"/></clipPath></defs>
      <rect class="fondo" x="8" y="${y0}" width="96" height="${h}" rx="31"/>
      <g clip-path="url(#c${uid})"><g class="sube"><rect class="liq" x="0" y="${top}" width="112" height="${y0 + h - top}"/></g>
      <path class="liq2 ola" d="M-10 ${top} q 10 -5 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 v 8 h -140 z"/></g>
      <rect class="marco" x="8" y="${y0}" width="96" height="${h}" rx="31"/>
      ${lin(fPP)}${lin(fSS)}
      <rect class="marco" x="48" y="17" width="16" height="9" rx="2"/>
      <line class="marco" x1="26" y1="88" x2="22" y2="100"/><line class="marco" x1="86" y1="88" x2="90" y2="100"/>
      <text x="56" y="108" text-anchor="middle">${pct} %</text>`;
  } else if (id === 'stretch') {
    const y0 = 12, h = 84, top = y0 + h * (1 - fr);
    const lin = (f, c) => f === null ? '' : `<line class="ref ${c}" x1="24" x2="88" y1="${y0 + h * (1 - f)}" y2="${y0 + h * (1 - f)}"/>`;
    let rayas = '';
    for (let i = 1; i < 7; i++) rayas += `<line x1="${30 + i * 7.5}" x2="${30 + i * 7.5}" y1="${y0}" y2="${y0 + h}" stroke="rgba(255,255,255,.25)" stroke-width="1"/>`;
    cuerpo = `<defs><clipPath id="c${uid}"><rect x="30" y="${y0}" width="52" height="${h}" rx="10"/></clipPath></defs>
      <rect class="fondo" x="30" y="${y0}" width="52" height="${h}" rx="10"/>
      <g clip-path="url(#c${uid})"><g class="sube"><rect class="liq" x="20" y="${top}" width="72" height="${y0 + h - top}"/></g>${rayas}</g>
      <rect class="marco" x="30" y="${y0}" width="52" height="${h}" rx="10"/>
      <rect class="marco" x="50" y="4" width="12" height="8" rx="2"/><rect class="marco" x="50" y="96" width="12" height="8" rx="2"/>
      ${lin(fPP, 'pp')}${lin(fSS, 'ss')}
      <text x="56" y="110" text-anchor="middle">${pct} %</text>`;
  } else if (id === 'tarimas') {
    const n = 8, llenas = Math.round(fr * n);
    for (let i = 0; i < n; i++) {
      const y = 92 - i * 10.5, on = i < llenas;
      const cls = on ? 'liq' : 'vacio';
      cuerpo += `<g class="${on ? 'aparece' : ''}" style="animation-delay:${i * 60}ms"><rect class="${cls}" x="14" y="${y}" width="84" height="4" rx="1.5"/>
        <rect class="${cls}" x="16" y="${y + 4}" width="10" height="5" rx="1"/><rect class="${cls}" x="51" y="${y + 4}" width="10" height="5" rx="1"/><rect class="${cls}" x="86" y="${y + 4}" width="10" height="5" rx="1"/></g>`;
    }
    const ref = (f, c) => f === null ? '' : `<line class="ref ${c}" x1="6" x2="106" y1="${101 - f * n * 10.5}" y2="${101 - f * n * 10.5}"/>`;
    cuerpo += ref(fPP, 'pp') + ref(fSS, 'ss') + `<text x="56" y="110" text-anchor="middle">${pct} %</text>`;
  } else {
    const pos = [[10, 74], [42, 74], [74, 74], [26, 50], [58, 50], [10, 26], [42, 26], [74, 26], [42, 4]];
    const llenas = Math.round(fr * pos.length);
    pos.forEach((p, i) => {
      const on = i < llenas;
      cuerpo += `<g class="${on ? 'aparece' : ''}" style="animation-delay:${i * 60}ms"><rect class="${on ? 'liq' : 'vacio'}" x="${p[0]}" y="${p[1]}" width="28" height="21" rx="6"/>${on ? `<text x="${p[0] + 14}" y="${p[1] + 14}" text-anchor="middle" style="fill:#fff;font-size:7px">CAL</text>` : ''}</g>`;
    });
    cuerpo += `<text x="56" y="110" text-anchor="middle">${pct} %</text>`;
  }
  return `<svg class="ilus" viewBox="0 0 112 112" role="img" aria-label="Nivel de stock ${pct} % de la capacidad de referencia"${extra || ''}>${cuerpo}</svg>`;
}

function fechaLarga(iso) {
  const d = new Date(iso + 'T12:00:00');
  return `${DIAS_SEM[d.getDay()]} ${d.getDate()} de ${MESES_L[d.getMonth()]}`;
}

function vistaResumen() {
  const M = ST.modelo;
  const cuenta = { ok: 0, warn: 0, bad: 0, na: 0 };
  ORDEN.forEach(id => { cuenta[M[id].estado]++; });
  const chips = ['bad', 'warn', 'ok'].filter(e => cuenta[e]).map(e => `<span class="tag ${{ ok: 't-ok', warn: 't-warn', bad: 't-bad' }[e]}">${ESTADO[e].split(' ')[0]} ${cuenta[e]} ${{ ok: 'normal', warn: 'para pedir', bad: 'crítico' }[e]}${cuenta[e] > 1 && e !== 'warn' ? (e === 'ok' ? 'es' : 's') : ''}</span>`).join('');
  const cards = ORDEN.map((id, i) => {
    const I = INSUMOS[id], x = M[id];
    const ult = (x.movs || []).filter(m => m.tipo === 'Ingreso' || m.tipo === 'Carga cisterna').slice(-1)[0];
    return `<article class="card hover ins-card ${x.estado}" style="--c:var(--c-${id});--i:${i}" data-ir="${id}" tabindex="0">
      <div class="ins-cab"><span class="ins-ico">${I.emoji}</span><div><h3>${I.nombre}</h3><div class="sub">${I.desc}</div></div><span class="tag est-tag">${ESTADO[x.estado]}</span></div>
      <div class="ins-cuerpo">${ilus(id, x.stock, x)}
        <div class="ins-num"><div class="v">${fmt(x.stock)}<small>${I.u}</small></div>
          ${id === 'stretch' && x.ultimo ? `<div class="bob">≈ ${fmt(x.ultimo.stockBob)} bobinas</div>` : ''}
          <div class="cob">⏳ <b>${fmt(x.cobertura, 1)}</b> días</div></div></div>
      <div class="ins-spark"><canvas id="sp-${id}"></canvas></div>
      <div class="ins-pie">
        <div><span>Consumo/día</span><b>${fmt(x.medio, I.dec)} ${I.u}</b></div>
        <div><span>Punto pedido</span><b>${fmt(x.pp)} ${I.u}</b></div>
        <div><span>Último ingreso</span><b>${ult ? fFecha(ult.f).slice(0, 5) + ' · ' + fmt(ult.cant) : '—'}</b></div>
      </div></article>`;
  }).join('');

  const maxD = Math.min(60, Math.max.apply(null, ORDEN.map(id => Math.max(M[id].cobertura || 0, M[id].diasPP || 0))) * 1.12) || 30;
  const cob = ORDEN.map(id => {
    const x = M[id], I = INSUMOS[id];
    const w = Math.min(100, 100 * (x.cobertura || 0) / maxD);
    return `<div class="cob-fila ${x.estado}"><div class="n"><span class="e">${I.emoji}</span>${I.nombre}</div>
      <div class="cob-pista"><div class="rel" style="width:${w}%"></div>
      <span class="mk ss" style="left:${100 * x.diasSS / maxD}%" data-l="SS ${x.diasSS} d"></span>
      <span class="mk pp" style="left:${100 * x.diasPP / maxD}%" data-l="PP ${x.diasPP} d"></span></div>
      <div class="d">${fmt(x.cobertura, 1)} d</div></div>`;
  }).join('');

  const P = periodos(M.fin, '2000-01-01');
  const tend = ORDEN.map(id => {
    const k = kpis(id, P.u30), kp = kpis(id, P.p30), d = compara(k, kp), I = INSUMOS[id];
    const cls = d === null ? 'eq' : Math.abs(d) < 2 ? 'eq' : d > 0 ? 'up' : 'dn';
    const fl = d === null ? '—' : (cls === 'eq' ? '➡️ ' : cls === 'up' ? '↗️ ' : '↘️ ') + delta(d);
    return `<div class="tend-fila"><span class="e">${I.emoji}</span><div><b>${fmt(k.lDia, I.dec)} ${I.u}/día</b><div class="sub">Antes: ${fmt(kp.lDia, I.dec)} ${I.u}/día · ingresos ${fmt(k.ingTotal)} ${I.u}</div></div><span class="flecha ${cls}">${fl}</span></div>`;
  }).join('');

  app().innerHTML = `<section class="vista">
    <div class="hero"><div><div class="eyebrow">${fechaLarga(M.hoy)} · Planta Cevil</div><h1>Insumos <span>críticos</span></h1>
      <p class="sub">Stock al último registro y cobertura con el consumo medio de cada insumo.</p></div>
      <div class="resumen-chips">${chips}</div></div>
    <div class="ins-grid stagger">${cards}</div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><div class="t"><h3>⏳ Días de cobertura</h3><span class="sub">Stock actual ÷ consumo medio</span></div></div>
        <div class="cob-lista">${cob}</div>
        <div class="cob-ley"><span><i style="background:var(--warn)"></i>Punto de pedido</span><span><i style="background:var(--bad)"></i>Stock de seguridad</span></div></div>
      <div class="card"><div class="card-h"><div class="t"><h3>📈 Últimos 30 días</h3><span class="sub">Consumo diario contra los 30 días anteriores</span></div></div><div class="tend">${tend}</div></div>
    </div>
    <div class="card"><div class="card-h"><div class="t"><h3>🔔 Alertas</h3><span class="sub">Lo que conviene revisar hoy</span></div></div><div class="alertas">${alertas().map((a, i) => `<div class="alerta ${a[0]}" style="animation-delay:${i * 40}ms"><span class="e">${a[1]}</span><span>${esc(a[2])}</span></div>`).join('')}</div></div>
  </section>`;

  app().querySelectorAll('[data-ir]').forEach(el => {
    el.onclick = () => { location.hash = '#/' + el.dataset.ir; };
    el.onkeydown = e => { if (e.key === 'Enter') location.hash = '#/' + el.dataset.ir; };
  });
  ORDEN.forEach(id => sparkline(id));
}

function sparkline(id) {
  const x = ST.modelo[id];
  const s = x.serie.filter(r => r.stock !== null && r.stock !== undefined).slice(-60);
  const c = colorEst(x.estado);
  grafico('sp-' + id, {
    type: 'line',
    data: { labels: s.map(r => fFecha(r.f)), datasets: [
      { data: s.map(r => r.stock), borderColor: c, borderWidth: 2, pointRadius: 0, fill: true, tension: .25,
        backgroundColor: ctx => { const { ctx: g, chartArea: a } = ctx.chart; if (!a) return alfa(c, .15); const gr = g.createLinearGradient(0, a.top, 0, a.bottom); gr.addColorStop(0, alfa(c, .35)); gr.addColorStop(1, alfa(c, 0)); return gr; } },
      { data: s.map(() => x.pp), borderColor: cv('--warn'), borderWidth: 1.2, borderDash: [4, 3], pointRadius: 0 }
    ] },
    options: { maintainAspectRatio: false, animation: { duration: 700 }, plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: k => (k.datasetIndex ? 'Punto de pedido ' : 'Stock ') + fmt(k.parsed.y) } } }, scales: { x: { display: false }, y: { display: false, beginAtZero: true } }, interaction: { mode: 'index', intersect: false } }
  });
}

function alertas() {
  const M = ST.modelo, al = [];
  ORDEN.forEach(id => {
    const x = M[id], I = INSUMOS[id];
    if (x.estado === 'bad') al.push(['bad', '🚨', `${I.nombre}: ${fmt(x.stock)} ${I.u}, por debajo del stock de seguridad (${fmt(x.ss)} ${I.u}). Cobertura de ${fmt(x.cobertura, 1)} días.`]);
    else if (x.estado === 'warn') al.push(['warn', '🛒', `${I.nombre}: ${fmt(x.stock)} ${I.u}, por debajo del punto de pedido (${fmt(x.pp)} ${I.u}). Lanzar pedido.`]);
    if (x.ultimo && dn(M.hoy) - dn(x.ultimo.f) > 2) al.push(['warn', '🕒', `${I.nombre}: el último dato de stock es del ${fFecha(x.ultimo.f)}.`]);
    const ctrl = ultimoControl(x);
    if (!ctrl || dn(M.hoy) - dn(ctrl.f) > 14) al.push(['info', '🔍', `${I.nombre}: ${ctrl ? 'el último control físico fue el ' + fFecha(ctrl.f) : 'no hay controles físicos registrados'}.`]);
  });
  const tar = {};
  M.tarimas.serie.forEach(r => { tar[r.f] = r.cons; });
  const sinCons = M.stretch.serie.filter(r => r.f >= isoDn(dn(M.fin) - 13) && r.f <= M.fin && !r.consCargado && tar[r.f] > 0).map(r => fFecha(r.f).slice(0, 5));
  if (sinCons.length) al.push(['warn', '🧻', `Stretch: hay pallets producidos sin consumo de stretch cargado (${sinCons.join(', ')}).`]);
  [['tarimas', 'Tarimas'], ['stretch', 'Stretch']].forEach(([id, n]) => {
    const inv = M[id].inventario.slice(-1)[0];
    if (inv && inv.sis && Math.abs(inv.sis - inv.fis) / inv.sis > 0.05) al.push(['warn', '📋', `${n}: el último inventario (${fFecha(inv.f)}) difiere ${pct(100 * (inv.sis - inv.fis) / inv.sis)} del sistema (físico ${fmt(inv.fis)} · sistema ${fmt(inv.sis)}).`]);
  });
  if (!al.length) al.push(['ok', '✅', 'Todo en orden: sin alertas.']);
  const orden = { bad: 0, warn: 1, info: 2, ok: 3 };
  return al.sort((a, b) => orden[a[0]] - orden[b[0]]);
}

function kpiHtml(e, l, v, u, d, cls) {
  return `<div class="kpi kacc ${cls || ''}"><div class="l"><span class="e">${e}</span>${l}</div><div class="v">${v}${u ? `<small>${u}</small>` : ''}</div><div class="d">${d || '&nbsp;'}</div></div>`;
}

function cardHtml(titulo, sub, cuerpo, extra) {
  return `<div class="card"${extra || ''}><div class="card-h"><div class="t"><h3>${titulo}</h3>${sub ? `<span class="sub">${sub}</span>` : ''}</div></div>${cuerpo}</div>`;
}

function vistaInsumo(id) {
  ST.insumo = id;
  const I = INSUMOS[id], M = ST.modelo, x = M[id];
  const P = periodos(M.fin, x.inicio);
  const p = P[ST.per];
  const k = kpis(id, p);
  const kc = p.cmp ? kpis(id, P[p.cmp]) : null;
  const kc2 = p.cmp2 ? kpis(id, P[p.cmp2]) : null;
  const d1 = compara(k, kc), d2 = compara(k, kc2);
  let rango = `${fFecha(p.a)} al ${fFecha(p.b)} · ${k.dias} días`;
  if (p.a < x.inicio) rango += ` · datos desde ${fFecha(x.inicio)}`;
  if (kc) rango += ` · vs. ${P[p.cmp].nombre}`;
  if (kc2) rango += ` y ${P[p.cmp2].nombre}`;
  const cmp = [d1 !== null ? `<span class="${dClase(d1)}">${d1 > 0 ? '↗️' : '↘️'} ${delta(d1)}</span> vs. ${esc(P[p.cmp].nombre)}` : '', d2 !== null ? `<span class="${dClase(d2)}">${d2 > 0 ? '↗️' : '↘️'} ${delta(d2)}</span> vs. ${esc(P[p.cmp2].nombre)}` : ''].filter(Boolean).join('<br>');
  const u = I.u, dec = I.dec;
  const ks = [
    kpiHtml('📉', 'Consumo diario', fmt(k.lDia, dec), u + '/día', cmp || 'Consumo ÷ días calendario'),
    kpiHtml('🏭', 'Por día operativo', fmt(k.lDiaOp, dec), u + '/día', `${fmt(k.diasConsumo)} días con consumo`),
    kpiHtml('🔥', 'Consumo total', fmt(k.cons), u, `P90 ${fmt(k.p90, dec)} · pico ${fmt(k.pico, dec)}`),
    kpiHtml('📥', 'Ingresos', fmt(k.ingTotal), u, `${fmt(k.entregas)} entregas · ${fmt(k.entregaProm, dec)} por entrega`),
    kpiHtml('📦', 'Stock promedio', fmt(k.stockProm), u, `Mínimo ${fmt(k.stockMin)} ${u}`),
    kpiHtml('⏳', 'Cobertura promedio', fmt(k.coberturaProm, 1), 'días', `Rotación ${fmt(k.rotacion, 1)} veces`),
    kpiHtml('🚨', 'Días bajo SS', fmt(k.diasBajoSS), 'días', `de ${fmt(k.diasConStock)} con stock registrado`, k.diasBajoSS > 0 ? 'bad' : 'ok')
  ];
  if (id === 'tarimas') ks.push(
    kpiHtml('🗑️', 'Descarte', fmt(k.descarte), u, `${pct(k.descartePct)} de las tarimas usadas`),
    kpiHtml('🚚', 'Envíos a otras plantas', fmt(k.env), u, ''),
    kpiHtml('📋', 'Inventario vs. sistema', pct(k.difInv), '', `${fmt(k.inventarios)} inventarios`, Math.abs(k.difInv || 0) > 5 ? 'warn' : ''),
    kpiHtml('🔍', 'Controles 6:00', fmt(k.controles), '', `Ajuste acumulado ${fmt(k.ajusteTotal)} u`));
  if (id === 'stretch') ks.push(
    kpiHtml('🎁', 'Stretch por pallet', fmt(k.grPallet), 'g', 'Kg de stretch ÷ tarimas consumidas'),
    kpiHtml('🧻', 'Bobinas por día', fmt(k.bobDia, 1), 'bob.', `${fmt(ST.datos.params.kgPorBobina)} kg por bobina`),
    kpiHtml('⚖️', 'Kg por bobina recibida', fmt(k.kgBobina, 1), 'kg', 'Promedio de los ingresos'),
    kpiHtml('📋', 'Inventario vs. sistema', pct(k.difInv), '', `${fmt(k.inventarios)} inventarios`, Math.abs(k.difInv || 0) > 5 ? 'warn' : ''),
    kpiHtml('❓', 'Pallets sin stretch', fmt(k.diasSinConsumoCargado), 'días', 'Revisar la carga de consumo', k.diasSinConsumoCargado ? 'warn' : ''));
  if (id === 'gasoil') ks.push(
    kpiHtml('🚜', 'Despachos', fmt(k.despachos), '', `${fmt(k.lDespacho, 1)} L por despacho`),
    kpiHtml('🚛', 'Unidades con consumo', fmt(k.unidades), '', ''),
    kpiHtml('🌙', 'Cargado 22–6 h', pct(k.nocturno), '', 'Control de despachos nocturnos'),
    kpiHtml('🧭', 'Sin odómetro válido', pct(k.sinOdo), '', 'Vacío, 0, 9999 o 99999', (k.sinOdo || 0) > 10 ? 'warn' : ''),
    kpiHtml('📏', 'Sonda vs. teórico', fmt(k.difSonda), 'L', `Promedio de ${fmt(k.mediciones)} mediciones`));
  if (id === 'cal') ks.push(kpiHtml('🔍', 'Controles 6:00', fmt(k.controles), '', `Ajuste acumulado ${fmt(k.ajusteTotal)} bolsas`));

  const seg = ORDEN.map(i => `<button data-ins="${i}" class="${i === id ? 'on' : ''}"><span>${INSUMOS[i].emoji}</span>${INSUMOS[i].nombre}</button>`).join('');
  const segP = PERIODOS_UI.map(q => `<button data-per="${q.id}" class="${q.id === ST.per ? 'on' : ''}"><span>${q.e}</span>${q.n}</button>`).join('');
  const ctrl = ultimoControl(x);
  app().innerHTML = `<section class="vista">
    <div class="seg" id="segIns" style="margin-bottom:14px">${seg}</div>
    <div class="card det-hero ${x.estado}" style="--c:var(--c-${id})">
      <span class="ins-ico">${I.emoji}</span>
      <div><div class="eyebrow">${I.desc}</div><h1>${I.nombre}</h1>
        <div class="datos"><span class="grande">${fmt(x.stock)} <small>${u}</small></span>
          <span class="tag est-tag">${ESTADO[x.estado]}</span>
          <span class="cob">⏳ <b>${fmt(x.cobertura, 1)}</b> días</span>
          <span class="sub">Consumo medio ${fmt(x.medio, dec)} ${u}/día · PP ${fmt(x.pp)} · SS ${fmt(x.ss)} · último control ${ctrl ? fFecha(ctrl.f) : '—'}</span></div></div>
      ${ilus(id, x.stock, x)}
    </div>
    <div class="barra-per"><div class="seg" id="segPer">${segP}</div><span class="rango">🗓️ ${rango}</span></div>
    <div class="kpis stagger">${ks.map((h, i) => h.replace('class="kpi', `style="--i:${i}" class="kpi`)).join('')}</div>
    <div class="grid g2">
      ${cardHtml('📦 Evolución del stock', id === 'gasoil' ? `Disponible, sin la reserva de ${fmt(ST.datos.params.reservaCisterna)} L` : 'Con punto de pedido y stock de seguridad actuales', '<div class="chart lg"><canvas id="chStock"></canvas></div>')}
      ${cardHtml('📊 Consumo diario por mes', `${u}/día · resaltado el período elegido`, '<div class="chart lg"><canvas id="chMensual"></canvas></div>')}
    </div>
    <div id="esp"></div>
  </section>`;

  $('segIns').querySelectorAll('button').forEach(b => { b.onclick = () => { location.hash = '#/' + b.dataset.ins; }; });
  $('segPer').querySelectorAll('button').forEach(b => { b.onclick = () => { ST.per = b.dataset.per; LS.set('ic_per', ST.per); vistaInsumo(id); }; });
  requestAnimationFrame(() => { moverPill($('segIns')); moverPill($('segPer')); });

  const ci = colorIns(id);
  const s = x.serie.filter(r => r.f >= p.a && r.f <= p.b && r.stock !== null && r.stock !== undefined);
  grafico('chStock', {
    type: 'line',
    data: { labels: s.map(r => fFecha(r.f)), datasets: [
      { label: 'Stock', data: s.map(r => r.stock), borderColor: ci, borderWidth: 2, pointRadius: 0, fill: true, tension: 0,
        backgroundColor: ctx => { const { ctx: g, chartArea: a } = ctx.chart; if (!a) return alfa(ci, .15); const gr = g.createLinearGradient(0, a.top, 0, a.bottom); gr.addColorStop(0, alfa(ci, .35)); gr.addColorStop(1, alfa(ci, .02)); return gr; } },
      { label: 'Punto de pedido', data: s.map(() => x.pp), borderColor: cv('--warn'), borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 },
      { label: 'Stock de seguridad', data: s.map(() => x.ss), borderColor: cv('--bad'), borderDash: [3, 3], borderWidth: 1.5, pointRadius: 0 }
    ] },
    options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.parsed.y, dec) + ' ' + u } } }, scales: { x: ejeX(), y: ejeY(0) } }
  });
  const men = mensual(id);
  grafico('chMensual', {
    type: 'bar',
    data: { labels: men.map(r => fMes(r.mes)), datasets: [{ label: u + '/día', data: men.map(r => r.v), borderRadius: 6, backgroundColor: men.map(r => (r.mes >= p.a.slice(0, 7) && r.mes <= p.b.slice(0, 7)) ? ci : alfa(ci, .28)) }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.y, dec) + ' ' + u + '/día' } } }, scales: { x: ejeX(), y: ejeY(0) } }
  });
  if (id === 'tarimas') espTarimas(p);
  if (id === 'stretch') espStretch(p);
  if (id === 'gasoil') espGasoil(p, P);
  if (id === 'cal') espCal(p);
}

function tablaProveedores(movs, u, dec, conBob) {
  const g = {};
  movs.forEach(m => { const k = m.prov || '(sin proveedor)'; g[k] = g[k] || { n: 0, q: 0, bob: 0 }; g[k].n += m.cant > 0 ? 1 : 0; g[k].q += m.cant; g[k].bob += m.bob || 0; });
  const tot = sumar(Object.values(g), 'q');
  const filas = Object.entries(g).sort((a, b) => b[1].q - a[1].q);
  if (!filas.length) return '<div class="empty">📭 Sin ingresos en el período</div>';
  const max = Math.max.apply(null, filas.map(f => f[1].q).concat([1]));
  return `<div class="tw"><table><thead><tr><th>Proveedor</th><th class="n">Entregas</th><th class="n">Cantidad [${u}]</th><th class="n">Participación</th><th class="n">Por entrega</th>${conBob ? '<th class="n">Bobinas</th><th class="n">Kg/bobina</th>' : ''}</tr></thead><tbody>` +
    filas.map(([p, x]) => `<tr><td>🏷️ ${esc(p)}</td><td class="n">${fmt(x.n)}</td><td class="n">${fmt(x.q, dec)}</td><td class="n">${pct(tot ? 100 * x.q / tot : null)}<span class="minibar"><span style="width:${100 * Math.max(x.q, 0) / max}%;background:var(--accent)"></span></span></td><td class="n">${fmt(x.n ? x.q / x.n : null, dec)}</td>${conBob ? `<td class="n">${fmt(x.bob)}</td><td class="n">${fmt(x.bob ? x.q / x.bob : null, 1)}</td>` : ''}</tr>`).join('') +
    `<tr class="total"><td>Total</td><td class="n">${fmt(sumar(filas.map(f => f[1].n)))}</td><td class="n">${fmt(tot, dec)}</td><td class="n">100,0 %</td><td></td>${conBob ? '<td></td><td></td>' : ''}</tr></tbody></table></div>`;
}

function espTarimas(p) {
  const x = ST.modelo.tarimas;
  const mv = movsPeriodo(x, p).filter(m => m.tipo === 'Ingreso');
  $('esp').innerHTML = `<div class="grid g2">${cardHtml('🏷️ Ingresos por proveedor', 'Período elegido', tablaProveedores(mv, 'u', 0))}${cardHtml('📋 Inventario físico vs. sistema', 'Diferencia (sistema − físico) ÷ sistema · rojo si supera 5 %', '<div class="chart"><canvas id="chE1"></canvas></div>')}</div>` +
    cardHtml('🔁 Consumo, ingresos y descarte por mes', 'Unidades', '<div class="chart lg"><canvas id="chE2"></canvas></div>');
  const inv = x.inventario.filter(r => r.sis);
  grafico('chE1', {
    type: 'bar',
    data: { labels: inv.map(r => fFecha(r.f).slice(0, 5)), datasets: [{ data: inv.map(r => 100 * (r.sis - r.fis) / r.sis), borderRadius: 5, backgroundColor: inv.map(r => Math.abs((r.sis - r.fis) / r.sis) > 0.05 ? cv('--bad') : cv('--ok')) }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => pct(c.parsed.y) + ` · físico ${fmt(inv[c.dataIndex].fis)} · sistema ${fmt(inv[c.dataIndex].sis)}` } } }, scales: { x: ejeX(), y: Object.assign(ejeY(0), { beginAtZero: true }) } }
  });
  const g = {};
  x.serie.filter(r => r.f <= ST.modelo.fin).forEach(r => { const m = r.f.slice(0, 7); g[m] = g[m] || { c: 0, i: 0, d: 0 }; g[m].c += r.cons; g[m].i += r.ing; g[m].d += r.desc; });
  const ms = Object.keys(g).sort();
  grafico('chE2', {
    type: 'bar',
    data: { labels: ms.map(fMes), datasets: [
      { label: 'Consumo', data: ms.map(m => g[m].c), backgroundColor: colorIns('tarimas'), borderRadius: 5 },
      { label: 'Ingresos', data: ms.map(m => g[m].i), backgroundColor: cv('--s1'), borderRadius: 5 },
      { label: 'Descarte (eje derecho)', data: ms.map(m => g[m].d), type: 'line', borderColor: cv('--bad'), backgroundColor: cv('--bad'), yAxisID: 'y2', pointRadius: 2.5, tension: .25 }
    ] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: ejeX(), y: ejeY(0), y2: { position: 'right', beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { callback: v => fmt(v) } } } }
  });
}

function espStretch(p) {
  const x = ST.modelo.stretch;
  const mv = movsPeriodo(x, p).filter(m => m.tipo !== 'Envío');
  $('esp').innerHTML = cardHtml('🏷️ Ingresos por proveedor', 'Período elegido · kg por bobina de cada proveedor', tablaProveedores(mv, 'kg', 1, true)) +
    `<div class="grid g2">${cardHtml('🎁 Stretch por pallet', 'Gramos por tarima consumida, por mes', '<div class="chart"><canvas id="chE1"></canvas></div>')}${cardHtml('📋 Inventario físico vs. sistema', 'Bobinas', '<div class="chart"><canvas id="chE2"></canvas></div>')}</div>`;
  const tar = {};
  ST.modelo.tarimas.serie.forEach(r => { tar[r.f] = r.cons; });
  const g = {};
  x.serie.filter(r => r.f <= ST.modelo.fin && r.cons > 0 && tar[r.f] > 0).forEach(r => { const m = r.f.slice(0, 7); g[m] = g[m] || { kg: 0, p: 0 }; g[m].kg += r.cons; g[m].p += tar[r.f]; });
  const ms = Object.keys(g).sort();
  const ci = colorIns('stretch');
  grafico('chE1', {
    type: 'line',
    data: { labels: ms.map(fMes), datasets: [{ label: 'g/pallet', data: ms.map(m => 1000 * g[m].kg / g[m].p), borderColor: ci, backgroundColor: ci, pointRadius: 3.5, tension: .25 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.y) + ' g/pallet' } } }, scales: { x: ejeX(), y: Object.assign(ejeY(0), { beginAtZero: false }) } }
  });
  const inv = x.inventario;
  grafico('chE2', {
    type: 'bar',
    data: { labels: inv.map(r => fFecha(r.f).slice(0, 5)), datasets: [{ label: 'Físico', data: inv.map(r => r.fis), backgroundColor: ci, borderRadius: 5 }, { label: 'Sistema', data: inv.map(r => r.sis), backgroundColor: cv('--line-2'), borderRadius: 5 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: ejeX(), y: ejeY(0) } }
  });
}

function espCal(p) {
  const x = ST.modelo.cal;
  const s = x.serie.filter(r => r.f >= p.a && r.f <= p.b);
  $('esp').innerHTML = `<div class="grid g2">${cardHtml('🪣 Consumo diario', 'Bolsas por día y del turno 1', '<div class="chart"><canvas id="chE1"></canvas></div>')}${cardHtml('📥 Ingresos', 'Período elegido', tablaProveedores(movsPeriodo(x, p).map(m => Object.assign({}, m, { prov: m.obs || '(sin detalle)' })), 'bolsas', 0))}</div>`;
  grafico('chE1', {
    type: 'bar',
    data: { labels: s.map(r => fFecha(r.f).slice(0, 5)), datasets: [{ label: 'Consumo', data: s.map(r => r.cons), backgroundColor: colorIns('cal'), borderRadius: 5 }, { label: 'Turno 1', data: s.map(r => r.consT1), type: 'line', borderColor: cv('--s1'), backgroundColor: cv('--s1'), pointRadius: 2.5 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: ejeX(), y: ejeY(0) } }
  });
}

function espGasoil(p, P) {
  const G = agruparGasoil(p, P);
  const conC = !!G.c;
  const dv = (l, lc) => conC ? (lc ? 100 * (l / G.dias - lc / G.diasC) / (lc / G.diasC) : null) : null;
  const vtxt = v => v === null ? '—' : v > 999 ? '> +999 %' : delta(v);
  const EM = { 'Máquinas cargadoras': '🚜', 'Camiones': '🚛', 'Autoelevadores': '🏗️', 'Camionetas': '🛻', 'Generador': '⚡', 'Mantenimiento': '🔧', 'Otros': '❔' };
  const deps = Object.entries(G.dep).sort((a, b) => b[1].l - a[1].l);
  const tDep = `<div class="tw"><table><thead><tr><th>Departamento</th><th class="n">Unid.</th><th class="n">Litros</th><th class="n">L/día</th><th class="n">Part.</th>${conC ? '<th class="n">L/día comp.</th><th class="n">Var.</th>' : ''}</tr></thead><tbody>` +
    deps.map(([d, x]) => { const v = dv(x.l, G.depC[d]); return `<tr><td>${EM[d] || '🚗'} ${esc(d)}</td><td class="n">${x.u.size}</td><td class="n">${fmt(x.l)}</td><td class="n">${fmt(x.l / G.dias, 1)}</td><td class="n">${pct(100 * x.l / G.tot)}</td>${conC ? `<td class="n">${G.depC[d] ? fmt(G.depC[d] / G.diasC, 1) : '—'}</td><td class="n"><span class="${dClase(v)}">${G.depC[d] ? vtxt(v) : '🆕 Nuevo'}</span></td>` : ''}</tr>`; }).join('') + '</tbody></table></div>';
  const max = Math.max.apply(null, Object.values(G.uni).map(x => x.l).concat([1]));
  const tUni = `<div class="tw max"><table><thead><tr><th>Unidad</th><th class="n">L/día</th><th class="n">Litros</th><th class="n">Part.</th><th class="n">Despachos</th><th class="n">L/despacho</th>${conC ? '<th class="n">L/día comp.</th><th class="n">Var.</th>' : ''}</tr></thead><tbody>` +
    deps.map(([d]) => `<tr class="grupo"><td colspan="${conC ? 8 : 6}">${EM[d] || '🚗'} ${esc(d)}</td></tr>` + Object.entries(G.uni).filter(e => e[1].d === d).sort((a, b) => b[1].l - a[1].l).map(([un, x]) => {
      const v = dv(x.l, G.uniC[un]);
      return `<tr><td>${esc(un)}</td><td class="n">${fmt(x.l / G.dias, 1)}<span class="minibar"><span style="width:${100 * x.l / max}%"></span></span></td><td class="n">${fmt(x.l)}</td><td class="n">${pct(100 * x.l / G.tot)}</td><td class="n">${fmt(x.n)}</td><td class="n">${fmt(x.l / x.n, 1)}</td>${conC ? `<td class="n">${G.uniC[un] ? fmt(G.uniC[un] / G.diasC, 1) : '—'}</td><td class="n"><span class="${dClase(v)}">${G.uniC[un] ? vtxt(v) : '🆕 Nueva'}</span></td>` : ''}</tr>`;
    }).join('')).join('') + '</tbody></table></div>';
  const cargas = movsPeriodo(ST.modelo.gasoil, p).filter(m => m.tipo === 'Carga cisterna');
  const tCargas = cargas.length ? `<div class="mov-lista">${cargas.slice().reverse().slice(0, 8).map(m => `<div class="mov"><span class="e">🛢️</span><div class="t"><b>${fFecha(m.f)}</b><div class="sub">${esc(m.obs || 'Carga de cisterna')}</div></div><div class="q">${fmt(m.cant)} L</div></div>`).join('')}</div><p class="nota">${cargas.length} cargas · ${fmt(sumar(cargas, 'cant'))} L · ${fmt(sumar(cargas, 'cant') / cargas.length)} L por carga</p>` : '<div class="empty">📭 Sin cargas en el período (el registro empieza en 2026)</div>';
  $('esp').innerHTML = `<div class="grid g-21">${cardHtml('🏢 Consumo por departamento', 'Período elegido', tDep)}${cardHtml('🛢️ Cargas de cisterna', 'Período elegido', tCargas)}</div>` +
    cardHtml('📊 Consumo diario por departamento y mes', 'L/día', '<div class="chart lg"><canvas id="chE1"></canvas></div>') +
    cardHtml('🚛 Consumo diario promedio por unidad', 'Agrupado por departamento', tUni);
  const x = ST.modelo.gasoil, fin = ST.modelo.fin;
  const totD = {};
  x.tx.forEach(t => { totD[t.d] = (totD[t.d] || 0) + t.l; });
  const top = Object.entries(totD).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  const series = top.concat(['Resto']);
  const g = {}, dias = {};
  x.serie.filter(r => r.f <= fin).forEach(r => { const m = r.f.slice(0, 7); dias[m] = (dias[m] || 0) + 1; });
  x.tx.filter(t => t.f <= fin).forEach(t => { const m = t.f.slice(0, 7), s = top.includes(t.d) ? t.d : 'Resto'; g[m + '|' + s] = (g[m + '|' + s] || 0) + t.l; });
  const ms = Object.keys(dias).sort();
  grafico('chE1', {
    type: 'bar',
    data: { labels: ms.map(fMes), datasets: series.map((s, i) => ({ label: s, data: ms.map(m => (g[m + '|' + s] || 0) / dias[m]), backgroundColor: cv(PALETA[i]), borderRadius: 3 })) },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.parsed.y, 1) + ' L/día' } } }, scales: { x: Object.assign(ejeX(), { stacked: true }), y: Object.assign(ejeY(0), { stacked: true }) } }
  });
}

function campoHtml(c, op, ins) {
  const hoy = hoyLocal();
  const ahora = new Date().toTimeString().slice(0, 5);
  switch (c) {
    case 'fecha': return `<label class="f">📅 Fecha<input type="date" name="fecha" value="${hoy}" max="${hoy}" required></label>`;
    case 'hora': return `<label class="f">🕐 Hora<input type="time" name="hora" value="${ahora}"></label>`;
    case 'cantidad': return `<label class="f">🔢 ${op.etiqueta || 'Cantidad [' + INSUMOS[ins].u + ']'}<input type="number" name="cantidad" min="0" step="1" required inputmode="numeric"></label>`;
    case 'kg': return '<label class="f">⚖️ Kilos<input type="number" name="kg" step="0.1" required inputmode="decimal"></label>';
    case 'bobinas': return '<label class="f">🧻 Bobinas<input type="number" name="bobinas" step="1" inputmode="numeric" placeholder="kg ÷ 15"></label>';
    case 'valor': return `<label class="f">${op.id === 'sondaGasoil' ? '📏' : '🛢️'} ${op.etiqueta}<input type="number" name="valor" min="0" step="${op.id === 'sondaGasoil' ? '0.1' : '1'}" required inputmode="decimal"></label>`;
    case 'proveedor': {
      const lista = (ST.datos ? ST.datos.proveedores : []).filter(p => p.insumo.toLowerCase() === INSUMOS[ins].nombre.toLowerCase() && p.proveedor !== 'Envío').map(p => p.proveedor);
      return `<label class="f">🏷️ Proveedor<select name="proveedor" ${op.provOpcional ? '' : 'required'}><option value="">${op.provOpcional ? '(sin proveedor)' : 'Elegir…'}</option>${lista.map(p => `<option>${esc(p)}</option>`).join('')}</select></label>`;
    }
    case 'provTexto': return '<label class="f">🏷️ Proveedor<input type="text" name="proveedor" maxlength="80"></label>';
    case 'remito': return '<label class="f">🧾 Remito<input type="text" name="remito" maxlength="40"></label>';
    case 'obs': return '<label class="f w2">💬 Observaciones<input type="text" name="obs" maxlength="200"></label>';
    case 'sobrescribir': return '<label class="chk full"><span class="switch"><input type="checkbox" name="sobrescribir"><span></span></span>Sobrescribir si ya hay un consumo cargado</label>';
    default: return '';
  }
}

function vistaRegistrar() {
  if (!OPS[ST.regIns]) ST.regIns = 'tarimas';
  const ins = ST.regIns;
  const ops = OPS[ins];
  if (!ops.find(o => o.id === ST.regOp)) ST.regOp = ops[0].id;
  const op = ops.find(o => o.id === ST.regOp);
  const M = ST.modelo;
  app().innerHTML = `<section class="vista">
    <div class="hero"><div><div class="eyebrow">Carga de datos</div><h1>Registrar <span>movimiento</span></h1><p class="sub">Se escribe directo en las planillas de la planta.</p></div></div>
    <div class="grid g-21">
      <div class="card">
        <div class="paso"><span class="nro">1</span><h3>¿Qué insumo?</h3></div>
        <div class="tiles grandes" id="tIns">${ORDEN.map(i => `<button type="button" class="tile ${i === ins ? 'on' : ''}" data-ins="${i}"><span class="e">${INSUMOS[i].emoji}</span><span><b>${INSUMOS[i].nombre}</b><br><small>${M ? fmt(M[i].stock) + ' ' + INSUMOS[i].u : ''}</small></span></button>`).join('')}</div>
        <div class="paso" style="margin-top:18px"><span class="nro">2</span><h3>¿Qué operación?</h3></div>
        <div class="tiles" id="tOps">${ops.map(o => `<button type="button" class="tile ${o.id === op.id ? 'on' : ''}" data-op="${o.id}"><span class="e">${o.emoji}</span><b>${o.nombre}</b></button>`).join('')}</div>
        <div class="paso" style="margin-top:18px"><span class="nro">3</span><h3>Datos</h3></div>
        <div class="ayuda-op"><span>💡</span><span>${esc(op.ayuda || '')}</span></div>
        <form id="formReg" autocomplete="off">
          <div class="form">${op.campos.map(c => campoHtml(c, op, ins)).join('')}<label class="f">👤 Registrado por<input id="fUsuario" type="text" maxlength="60" placeholder="Nombre y apellido" required value="${esc(LS.get('ic_usuario', ''))}"></label></div>
          <div class="vista-previa vacia" id="prev">👀 Completá los datos para ver cómo queda el stock</div>
          <div class="acciones"><button class="btn" type="reset">🧹 Limpiar</button><button class="btn pri brillo" type="submit" id="btnGuardar">💾 Guardar</button></div>
        </form>
      </div>
      <div class="card"><div class="card-h"><div class="t"><h3>${INSUMOS[ins].emoji} Últimos registros</h3><span class="sub">${INSUMOS[ins].nombre}</span></div></div><div class="mov-lista">${filasMov(listaMovimientos(ins).slice(0, 12), false)}</div></div>
    </div></section>`;
  $('tIns').querySelectorAll('[data-ins]').forEach(b => { b.onclick = () => { ST.regIns = b.dataset.ins; ST.regOp = null; vistaRegistrar(); }; });
  $('tOps').querySelectorAll('[data-op]').forEach(b => { b.onclick = () => { ST.regOp = b.dataset.op; vistaRegistrar(); }; });
  const f = $('formReg');
  f.oninput = () => vistaPrevia(ins, op);
  $('fUsuario').addEventListener('input', e => LS.set('ic_usuario', e.target.value.trim()));
  f.onreset = () => setTimeout(() => vistaPrevia(ins, op), 0);
  f.onsubmit = e => enviar(e, ins, op);
}

function vistaPrevia(ins, op) {
  const el = $('prev');
  const M = ST.modelo;
  if (!el || !M) return;
  const fd = new FormData($('formReg'));
  const x = M[ins], I = INSUMOS[ins];
  const fecha = fd.get('fecha');
  const dia = x.serie.find(r => r.f === fecha);
  let svg = '', html = '';
  if (op.id === 'sondaGasoil') {
    const cm = parseFloat(fd.get('valor'));
    if (cm > 0) {
      const l = litrosSonda(cm), disp = l - ST.datos.params.reservaCisterna;
      svg = ilus('gasoil', disp, x);
      html = `<b>${fmt(l)} L en cisterna</b>${fmt(disp)} L disponibles (sin reserva).${dia && dia.stockTot !== null ? `<br>Stock teórico del día: ${fmt(dia.stockTot)} L · diferencia ${fmt(l - dia.stockTot)} L.` : ''}`;
    }
  } else if (op.id === 'controlFisico') {
    const q = parseFloat(fd.get('cantidad'));
    if (dia && isFinite(q)) {
      const sis = ins === 'stretch' ? (dia.ini !== null ? dia.ini / ST.datos.params.kgPorBobina - (dia.consT1 || 0) : null) : (dia.sist !== null ? dia.sist - (dia.consT1 || 0) : null);
      if (sis !== null) html = `<div class="antes-despues"><div class="caja"><span>Sistema 6:00</span><b>${fmt(sis)}</b></div>➡️<div class="caja"><span>Contado</span><b>${fmt(q)}</b></div><div class="caja"><span>Ajuste</span><b class="${q - sis < 0 ? 'up' : 'dn'}">${fmt(q - sis)}</b></div></div>`;
    }
  } else if (op.id === 'inventario') {
    const q = parseFloat(fd.get('cantidad'));
    const s = x.ultimo;
    if (s && isFinite(q)) {
      const sis = ins === 'stretch' ? s.stockBob : s.stock;
      const d = sis ? 100 * (sis - q) / sis : null;
      html = `<div class="antes-despues"><div class="caja"><span>Sistema ${fFecha(s.f).slice(0, 5)}</span><b>${fmt(sis)}</b></div>🆚<div class="caja"><span>Físico</span><b>${fmt(q)}</b></div><div class="caja"><span>Diferencia</span><b class="${Math.abs(d || 0) > 5 ? 'up' : 'dn'}">${pct(d)}</b></div></div>`;
    }
  } else if (op.id === 'consumoStretch') {
    const kg = parseFloat(fd.get('kg'));
    const tar = M.tarimas.serie.find(r => r.f === fecha);
    const partes = [];
    if (dia && dia.consCargado) partes.push(`⚠️ Ya hay ${fmt(dia.cons, 1)} kg cargados para esa fecha.`);
    if (tar && tar.cons > 0 && kg > 0) partes.push(`<b>${fmt(1000 * kg / tar.cons)} g/pallet</b>sobre ${fmt(tar.cons)} pallets producidos ese día.`);
    html = partes.join('<br>');
  } else {
    const q = parseFloat(fd.get('cantidad') || fd.get('kg') || fd.get('valor'));
    const s = x.ultimo;
    if (s && isFinite(q)) {
      const signo = /envio|descarte/i.test(op.id) ? -1 : 1;
      const nuevo = s.stock + signo * q;
      svg = ilus(ins, nuevo, x);
      html = `<div class="antes-despues"><div class="caja"><span>Stock actual</span><b>${fmt(s.stock)}</b></div>${signo > 0 ? '➕' : '➖'}<div class="caja"><span>${signo > 0 ? 'Ingresa' : 'Sale'}</span><b>${fmt(q, I.dec)}</b></div>🟰<div class="caja"><span>Queda</span><b>${fmt(nuevo)} ${I.u}</b></div></div><div class="sub" style="margin-top:6px">⏳ ${fmt(x.medio ? nuevo / x.medio : null, 1)} días de cobertura</div>`;
    }
  }
  if (!html) { el.className = 'vista-previa vacia'; el.innerHTML = '👀 Completá los datos para ver cómo queda el stock'; return; }
  el.className = 'vista-previa' + (svg ? '' : ' sin-ilus');
  el.style.gridTemplateColumns = svg ? '' : '1fr';
  el.innerHTML = (svg ? `<div class="${x.estado === 'na' ? '' : ''}" style="--est:var(--c-${ins})">${svg}</div>` : '') + `<div class="txt">${html}</div>`;
}

async function enviar(e, ins, op) {
  e.preventDefault();
  const fd = new FormData($('formReg'));
  const usuario = $('fUsuario').value.trim();
  LS.set('ic_usuario', usuario);
  const p = { accion: op.id, insumo: ins, usuario };
  op.campos.forEach(c => { if (c === 'sobrescribir') p.sobrescribir = fd.get('sobrescribir') === 'on'; else if (c === 'provTexto') p.proveedor = fd.get('proveedor'); else p[c] = fd.get(c); });
  const b = $('btnGuardar');
  b.disabled = true;
  b.textContent = '⏳ Guardando…';
  loader(true);
  try {
    const msg = await apiPost(p);
    toast(msg || 'Registrado', 'ok');
    await cargar(true);
  } catch (err) {
    toast(err.message, 'bad');
    b.disabled = false;
    b.textContent = '💾 Guardar';
  } finally { loader(false); }
}

function filasMov(l, conAnular) {
  if (!l.length) return '<div class="empty">📭 Sin registros</div>';
  return l.map(m => `<div class="mov ${esc(m.tipo)}"><span class="e">${EMOJI_TIPO[m.tipo] || '•'}</span>
    <div class="t"><b>${esc(m.tipo)}</b> <span class="sub">· ${fFecha(m.f)}${m.prov ? ' · ' + esc(m.prov) : ''}</span><div class="sub">${[m.remito ? '🧾 ' + esc(m.remito) : '', m.obs ? '💬 ' + esc(m.obs) : ''].filter(Boolean).join(' · ') || '&nbsp;'}</div></div>
    <div class="q">${esc(m.det)}${conAnular && m.hoja ? `<button class="btn sm dan" data-anular="${m.hoja}|${m.fila}|${m.f}|${m.q}">🗑️ Anular</button>` : ''}</div></div>`).join('');
}

function vistaMovimientos() {
  const ins = ST.movIns;
  const fl = ST.movFiltro || { desde: '', hasta: '', q: '' };
  app().innerHTML = `<section class="vista">
    <div class="hero"><div><div class="eyebrow">Historial</div><h1>Movi<span>mientos</span></h1><p class="sub">Ingresos, envíos, descartes, controles e inventarios.</p></div></div>
    <div class="bar"><div class="seg" id="segMov">${ORDEN.map(i => `<button data-ins="${i}" class="${i === ins ? 'on' : ''}"><span>${INSUMOS[i].emoji}</span>${INSUMOS[i].nombre}</button>`).join('')}</div>
      <div class="filtros"><label class="f">Desde<input type="date" id="mDesde" value="${fl.desde}"></label><label class="f">Hasta<input type="date" id="mHasta" value="${fl.hasta}"></label><label class="f ancho">🔎 Buscar<input type="search" id="mBuscar" placeholder="Proveedor, remito, obs." value="${esc(fl.q)}"></label></div></div>
    <div class="card"><div class="mov-lista" id="listaMov"></div><p class="nota" id="movNota"></p></div></section>`;
  $('segMov').querySelectorAll('button').forEach(b => { b.onclick = () => { ST.movIns = b.dataset.ins; vistaMovimientos(); }; });
  requestAnimationFrame(() => moverPill($('segMov')));
  ['mDesde', 'mHasta', 'mBuscar'].forEach(i => { $(i).oninput = filtrarMov; });
  filtrarMov();
}

function filtrarMov() {
  const ins = ST.movIns;
  const fl = ST.movFiltro = { desde: $('mDesde').value, hasta: $('mHasta').value, q: $('mBuscar').value.trim() };
  let l = listaMovimientos(ins);
  if (fl.desde) l = l.filter(m => m.f >= fl.desde);
  if (fl.hasta) l = l.filter(m => m.f <= fl.hasta);
  if (fl.q) { const q = fl.q.toLowerCase(); l = l.filter(m => [m.tipo, m.prov, m.remito, m.obs, m.det].join(' ').toLowerCase().includes(q)); }
  const total = l.length;
  $('listaMov').innerHTML = filasMov(l.slice(0, 200), true);
  $('movNota').textContent = total > 200 ? `Se muestran 200 de ${total} registros. Filtrá por fecha para ver el resto.` : `${total} registros. Los controles físicos e inventarios se corrigen desde la planilla.`;
  $('listaMov').querySelectorAll('[data-anular]').forEach(b => {
    b.onclick = async () => {
      const [hoja, fila, f, q] = b.dataset.anular.split('|');
      if (!(await confirmar(`¿Anular el registro del ${fFecha(f)} (${fmt(+q, 1)})? Se elimina la fila ${fila} de la planilla.`))) return;
      loader(true);
      try { toast(await apiPost({ accion: 'anular', hoja, fila: +fila, fecha: f, cantidad: +q, usuario: LS.get('ic_usuario', '') }), 'ok'); await cargar(true); }
      catch (err) { toast(err.message, 'bad'); }
      finally { loader(false); }
    };
  });
}

function vistaParametros() {
  const M = ST.modelo;
  const c = conexion();
  app().innerHTML = `<section class="vista">
    <div class="hero"><div><div class="eyebrow">Configuración</div><h1>Ajustes de <span>reposición</span></h1><p class="sub">Stock de seguridad = días SS × consumo medio · Punto de pedido = días PP × consumo medio. Se guardan en la hoja «Necesidades».</p></div></div>
    <div class="param-grid stagger">${ORDEN.map((id, i) => {
      const x = M[id], I = INSUMOS[id];
      return `<div class="card param" style="--c:var(--c-${id});--i:${i}" data-id="${id}">
        <div class="ins-cab"><span class="ins-ico">${I.emoji}</span><div><h3>${I.nombre}</h3><div class="sub">Consumo medio ${fmt(x.medio, I.dec)} ${I.u}/día</div></div>${x.paramGuardado ? '' : '<span class="tag t-mut">por defecto</span>'}</div>
        ${['SS', 'PP'].map(k => `<div class="stepper-fila"><div class="l">${k === 'SS' ? '🛡️ Stock de seguridad' : '🛒 Punto de pedido'}<small>días de consumo</small></div>
          <div class="stepper"><button type="button" data-paso="-1" data-k="${k}">−</button><input type="number" min="1" step="1" value="${k === 'SS' ? x.diasSS : x.diasPP}" data-k="${k}"><button type="button" data-paso="1" data-k="${k}">+</button></div></div>`).join('')}
        <div class="calc"><div><span>SS</span><b data-o="SS">${fmt(x.ss)}</b></div><div><span>PP</span><b data-o="PP">${fmt(x.pp)}</b></div><div><span>Stock</span><b>${fmt(x.stock)}</b></div></div>
        <button class="btn pri" data-guardar="${id}">💾 Guardar</button></div>`;
    }).join('')}</div>
    <div class="card" style="margin-top:16px"><div class="card-h"><div class="t"><h3>🔌 Conexión</h3><span class="sub">URL de la aplicación web de Apps Script y clave de acceso (se guardan solo en este navegador)</span></div></div>
      <form class="form" id="formCx" autocomplete="off"><label class="f w2">URL /exec<input id="cUrl" type="url" value="${esc(c.url || '')}" placeholder="https://script.google.com/macros/s/.../exec"></label><label class="f">Clave<input id="cKey" type="password" value="${esc(c.key || '')}" placeholder="Opcional"></label>
      <div class="full acciones" style="margin-top:0"><button class="btn pri" type="submit">🔌 Guardar y probar</button></div></form></div>
  </section>`;
  app().querySelectorAll('.param').forEach(card => {
    const id = card.dataset.id, x = M[id];
    const recalc = () => {
      ['SS', 'PP'].forEach(k => { const v = +card.querySelector(`input[data-k="${k}"]`).value; card.querySelector(`[data-o="${k}"]`).textContent = x.medio ? fmt(Math.ceil(v * x.medio)) : '—'; });
    };
    card.querySelectorAll('[data-paso]').forEach(b => { b.onclick = () => { const inp = card.querySelector(`input[data-k="${b.dataset.k}"]`); inp.value = Math.max(1, (+inp.value || 0) + +b.dataset.paso); recalc(); }; });
    card.querySelectorAll('input').forEach(i => { i.oninput = recalc; });
    card.querySelector('[data-guardar]').onclick = async ev => {
      const b = ev.currentTarget;
      b.disabled = true;
      loader(true);
      try {
        toast(await apiPost({ accion: 'parametros', insumo: id, diasSS: +card.querySelector('input[data-k="SS"]').value, diasPP: +card.querySelector('input[data-k="PP"]').value, usuario: LS.get('ic_usuario', '') }), 'ok');
        await cargar(true);
      } catch (err) { toast(err.message, 'bad'); b.disabled = false; } finally { loader(false); }
    };
  });
  $('formCx').onsubmit = async e => {
    e.preventDefault();
    LS.set('ic_url', $('cUrl').value.trim());
    LS.set('ic_key', $('cKey').value.trim());
    await cargar(true);
    if (ST.datos) toast('Conexión correcta', 'ok');
  };
}

function vistaSinDatos() {
  const c = conexion();
  app().innerHTML = `<section class="vista"><div class="hero"><div><div class="eyebrow">Primer uso</div><h1>Conectar con la <span>planilla</span></h1><p class="sub">Pegá la URL /exec de la aplicación web de Apps Script.</p></div></div>
    <div class="card"><form class="form" id="formCx0"><label class="f w2">URL /exec<input id="cUrl0" type="url" value="${esc(c.url || '')}" required></label><label class="f">Clave<input id="cKey0" type="password" value="${esc(c.key || '')}"></label><div class="full acciones" style="margin-top:0"><button class="btn pri" type="submit">🔌 Conectar</button></div></form></div></section>`;
  $('formCx0').onsubmit = async e => { e.preventDefault(); LS.set('ic_url', $('cUrl0').value.trim()); LS.set('ic_key', $('cKey0').value.trim()); await cargar(true); };
}

function leerRuta() {
  const h = location.hash.replace(/^#\/?/, '') || 'resumen';
  return VISTAS.find(v => v.id === h) ? h : 'resumen';
}

function render() {
  ST.vista = leerRuta();
  if (INSUMOS[ST.vista]) ST.insumo = ST.vista;
  pintarNav();
  destruirTodos();
  if (!ST.modelo) { if (ST.vista === 'parametros' || !conexion().url) vistaSinDatos(); return; }
  const v = ST.vista;
  if (v === 'resumen') vistaResumen();
  else if (INSUMOS[v]) vistaInsumo(v);
  else if (v === 'registrar') vistaRegistrar();
  else if (v === 'movimientos') vistaMovimientos();
  else if (v === 'parametros') vistaParametros();
}

function ocultarSplash() {
  const s = $('splash');
  if (s && !s.classList.contains('fuera')) { s.classList.add('fuera'); clearInterval(ocultarSplash._t); }
}

async function cargar(forzar) {
  if (!forzar) {
    const cache = LS.get('ic_cache', null);
    if (cache) { aplicar(cache, true); ocultarSplash(); }
  }
  if (!conexion().url) { ocultarSplash(); estadoRed('off', 'Sin conexión'); render(); return; }
  loader(true);
  estadoRed('cache', 'Actualizando');
  try {
    const d = await apiGet();
    LS.set('ic_cache', d);
    aplicar(d, false);
  } catch (err) {
    estadoRed(ST.datos ? 'cache' : 'off', ST.datos ? 'Datos guardados' : 'Sin conexión');
    toast(err.message, 'bad');
    if (!ST.datos) render();
  } finally {
    loader(false);
    ocultarSplash();
  }
}

function aplicar(d, desdeCache) {
  ST.datos = d;
  ST.modelo = construirModelo(d);
  const t = new Date(d.generado);
  const hh = t.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
  estadoRed(desdeCache ? 'cache' : 'ok', (desdeCache ? 'Guardado ' : 'En línea · ') + hh);
  render();
}

function init() {
  ST.per = LS.get('ic_per', 'hist');
  $('btnTema').textContent = temaActual() === 'dark' ? '☀️' : '🌙';
  $('btnTema').onclick = alternarTema;
  $('btnRefrescar').onclick = () => cargar(true);
  let i = 0;
  ocultarSplash._t = setInterval(() => { $('splashTxt').textContent = FRASES[++i % FRASES.length]; }, 900);
  reloj();
  setInterval(reloj, 30000);
  window.addEventListener('hashchange', () => { render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  window.addEventListener('resize', () => { moverPill($('nav')); document.querySelectorAll('main .seg').forEach(moverPill); });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!document.documentElement.getAttribute('data-theme')) render(); });
  if (!location.hash) history.replaceState(null, '', '#/resumen');
  render();
  cargar(false);
}

document.addEventListener('DOMContentLoaded', init);
