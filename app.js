'use strict';

const VISTAS = [
  { id: 'resumen', e: '🏠', n: 'Inicio' },
  { id: 'tarimas', e: '🪵', n: 'Tarimas' },
  { id: 'stretch', e: '🧻', n: 'Stretch' },
  { id: 'gasoil', e: '⛽', n: 'Gasoil' },
  { id: 'cal', e: '🪣', n: 'Cal' },
  { id: 'informe', e: '🖨️', n: 'Informes', der: true },
  { id: 'movimientos', e: '🧾', n: 'Movimientos', der: true },
  { id: 'admin', e: '⚙️', n: 'Administración', der: true }
];
const ICO = {
  refrescar: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/></svg>',
  luna: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  sol: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>',
  usuario: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c1.4-3.8 4.3-5.6 7.5-5.6s6.1 1.8 7.5 5.6"/></svg>',
  candado: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  imprimir: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/></svg>',
  libro: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M9 7h6"/></svg>',
  ayuda: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.6"/><path d="M12 16.8v.2"/></svg>',
  lista: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
  fabrica: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20.5V10l5 3V10l5 3V6.5l3-.5v14.5z"/><path d="M16 9h4v11.5h-4M3 20.5h18"/></svg>'
};
const icoTema = () => temaActual() === 'dark' ? ICO.sol : ICO.luna;
const BNAV = [
  { id: 'resumen', e: '🏠', n: 'Inicio' },
  { id: 'insumo', e: '📦', n: 'Insumos' },
  { id: 'informe', e: '🖨️', n: 'Informes' },
  { id: 'movimientos', e: '🧾', n: 'Movimientos' },
  { id: 'admin', e: '⚙️', n: 'Admin.' }
];
const ADMIN_SEC = [
  { id: 'registrar', e: '➕', n: 'Registrar', admin: false, reg: true },
  { id: 'reposicion', e: '🛒', n: 'Reposición', admin: true },
  { id: 'usuarios', e: '👥', n: 'Usuarios', admin: true },
  { id: 'conexion', e: '🔌', n: 'Conexión', admin: true },
  { id: 'cuenta', e: '👤', n: 'Mi cuenta', admin: false }
];
const PERIODOS_UI = [
  { id: 'hist', e: '📚', n: 'Histórico' },
  { id: 'u365', e: '📅', n: 'Últimos 365 días' },
  { id: 'ytd', e: '🗓️', n: 'Año vs. anterior' },
  { id: 'trim', e: '📊', n: 'Último trimestre' }
];
const ESTADO = { ok: '🟢 Normal', warn: '🟠 Pedir', bad: '🔴 Crítico', na: '⚪ Sin datos' };
const FRASES = ['Conectando con la planilla…', 'Leyendo stock de tarimas y stretch…', 'Leyendo la cisterna de gasoil…', 'Calculando coberturas…', 'Preparando indicadores…'];
const DIAS_SEM = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const cv = n => getComputedStyle(ST.cvEl || document.documentElement).getPropertyValue(n).trim();
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

function guardando(on, txt) {
  const o = $('overlay');
  if (txt) $('overlayTxt').textContent = txt;
  o.classList.toggle('on', !!on);
  loader(on);
}

function esqueleto() {
  app().innerHTML = `<section class="vista"><div class="hero"><div><div class="skel" style="width:180px;height:12px"></div><div class="skel" style="width:280px;height:32px;margin-top:10px"></div></div></div>
    <div class="ins-grid">${ORDEN.map(id => `<div class="card ins-card skel-card" style="--c:var(--c-${id})"><div class="ins-cab"><span class="ins-ico">${INSUMOS[id].ico}</span><div><h3>${INSUMOS[id].nombre}</h3><div class="sub">Cargando…</div></div></div><div class="skel" style="height:112px"></div><div class="skel" style="height:54px"></div></div>`).join('')}</div></section>`;
}

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
  $('nav').innerHTML = VISTAS.map((x, i) => (x.der && !VISTAS[i - 1].der ? '<span class="nav-sep"></span>' : '') + `<a href="#/${x.id}" class="${x.id === v ? 'on' : ''}${x.der ? ' der' : ''}">${INSUMOS[x.id] ? `<span class="nav-ic" style="--c2:var(--c-${x.id}-2)">${INSUMOS[x.id].ico}</span>` : ''}${x.n}</a>`).join('');
  $('bnav').innerHTML = BNAV.map(x => {
    const act = x.id === 'insumo' ? INSUMOS[v] : x.id === v;
    const href = x.id === 'insumo' ? '#/' + ST.insumo : '#/' + x.id;
    return `<a href="${href}" class="${act ? 'on' : ''}"><span class="e">${x.id === 'insumo' && INSUMOS[ST.insumo] ? INSUMOS[ST.insumo].ico : x.e}</span>${x.n}</a>`;
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
  $('btnTema').innerHTML = icoTema();
  $('btnTema').title = n === 'dark' ? 'Pasar a modo claro' : 'Pasar a modo oscuro';
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
    const lin = (f, c) => f === null ? '' : `<line class="ref ${c}" x1="8" x2="104" y1="${y0 + h * (1 - f)}" y2="${y0 + h * (1 - f)}"/>`;
    cuerpo = `<defs><clipPath id="c${uid}"><rect x="8" y="${y0}" width="96" height="${h}" rx="31"/></clipPath></defs>
      <rect class="fondo" x="8" y="${y0}" width="96" height="${h}" rx="31"/>
      <g clip-path="url(#c${uid})"><g class="sube"><rect class="liq" x="0" y="${top}" width="112" height="${y0 + h - top}"/></g>
      <path class="liq2 ola" d="M-10 ${top} q 10 -5 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 t 20 0 v 8 h -140 z"/>
      <rect class="brillo" x="20" y="${y0 + 8}" width="60" height="5" rx="2.5"/></g>
      <rect class="marco" x="8" y="${y0}" width="96" height="${h}" rx="31"/>
      ${lin(fPP, 'pp')}${lin(fSS, 'ss')}
      <rect class="marco" x="48" y="17" width="16" height="9" rx="2"/>
      <line class="marco" x1="26" y1="88" x2="22" y2="100"/><line class="marco" x1="86" y1="88" x2="90" y2="100"/>
      <text x="56" y="108" text-anchor="middle">${pct} %</text>`;
  } else if (id === 'stretch') {
    const y0 = 12, h = 84, top = y0 + h * (1 - fr);
    const lin = (f, c) => f === null ? '' : `<line class="ref ${c}" x1="24" x2="88" y1="${y0 + h * (1 - f)}" y2="${y0 + h * (1 - f)}"/>`;
    let capas = '';
    for (let yy = top + 5; yy < y0 + h; yy += 6) capas += `<line x1="30" x2="82" y1="${yy}" y2="${yy}" stroke="rgba(255,255,255,.35)" stroke-width="1"/>`;
    cuerpo = `<defs><clipPath id="c${uid}"><rect x="30" y="${y0}" width="52" height="${h}" rx="10"/></clipPath></defs>
      <rect class="fondo" x="30" y="${y0}" width="52" height="${h}" rx="10"/>
      <g clip-path="url(#c${uid})"><g class="sube"><rect class="film" x="20" y="${top}" width="72" height="${y0 + h - top}"/></g>${capas}<rect class="brillo" x="36" y="${y0}" width="7" height="${h}"/></g>
      <rect class="marco" x="30" y="${y0}" width="52" height="${h}" rx="10"/>
      <rect class="marco" x="50" y="4" width="12" height="8" rx="2"/><rect class="marco" x="50" y="96" width="12" height="8" rx="2"/>
      ${lin(fPP, 'pp')}${lin(fSS, 'ss')}
      <text x="56" y="110" text-anchor="middle">${pct} %</text>`;
  } else if (id === 'tarimas') {
    const n = 8, llenas = Math.round(fr * n);
    for (let i = 0; i < n; i++) {
      const y = 92 - i * 10.5, on = i < llenas;
      const cls = on ? 'liq' : 'vacio';
      const veta = on ? `<line x1="18" x2="94" y1="${y + 2}" y2="${y + 2}" stroke="var(--c2)" stroke-width=".6" opacity=".55"/>` : '';
      cuerpo += `<g class="${on ? 'aparece' : ''}" style="animation-delay:${i * 60}ms"><rect class="${cls}" x="14" y="${y}" width="84" height="4" rx="1.5"/>${veta}
        <rect class="${cls}" x="16" y="${y + 4}" width="10" height="5" rx="1"/><rect class="${cls}" x="51" y="${y + 4}" width="10" height="5" rx="1"/><rect class="${cls}" x="86" y="${y + 4}" width="10" height="5" rx="1"/>${on ? `<rect class="borde" x="14" y="${y}" width="84" height="9" rx="1.5"/>` : ''}</g>`;
    }
    const ref = (f, c) => f === null ? '' : `<line class="ref ${c}" x1="6" x2="106" y1="${101 - f * n * 10.5}" y2="${101 - f * n * 10.5}"/>`;
    cuerpo += ref(fPP, 'pp') + ref(fSS, 'ss') + `<text x="56" y="110" text-anchor="middle">${pct} %</text>`;
  } else {
    const pos = [[10, 74], [42, 74], [74, 74], [26, 50], [58, 50], [10, 26], [42, 26], [74, 26], [42, 4]];
    const llenas = Math.round(fr * pos.length);
    pos.forEach((q, i) => {
      const on = i < llenas;
      cuerpo += `<g class="${on ? 'aparece' : ''}" style="animation-delay:${i * 60}ms"><rect class="${on ? 'liq' : 'vacio'}" x="${q[0]}" y="${q[1]}" width="28" height="21" rx="6"/>${on ? `<rect class="borde" x="${q[0]}" y="${q[1]}" width="28" height="21" rx="6"/><line x1="${q[0] + 4}" x2="${q[0] + 24}" y1="${q[1] + 4}" y2="${q[1] + 4}" stroke="var(--c2)" stroke-width=".8"/><text class="tx-cal" x="${q[0] + 14}" y="${q[1] + 15}" text-anchor="middle">CAL</text>` : ''}</g>`;
    });
    cuerpo += `<text x="56" y="110" text-anchor="middle">${pct} %</text>`;
  }
  return `<svg class="ilus" viewBox="0 0 112 112" style="--c:var(--c-${id});--c2:var(--c-${id}-2)" role="img" aria-label="Nivel de stock ${pct} % de la capacidad de referencia"${extra || ''}>${cuerpo}</svg>`;
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
    const sem = semanal(id, 12);
    const semTxt = sem.dias < 84 ? `últimos ${sem.dias} días` : 'últimas 12 semanas';
    return `<article class="card hover ins-card ${x.estado}" style="--c:var(--c-${id});--c2:var(--c-${id}-2);--i:${i}" data-ir="${id}" data-ak="insCard" tabindex="0">
      <div class="ins-cab"><span class="ins-ico">${I.ico}</span><div><h3>${I.nombre}</h3><div class="sub">${I.desc}</div></div><span class="tag est-tag">${ESTADO[x.estado]}</span>${btnAyuda('insCard')}</div>
      <div class="ins-cuerpo">${ilus(id, x.stock, x)}
        <div class="ins-num"><div class="v">${fmt(x.stock)}<small>${I.u}</small></div>
          ${id === 'stretch' && x.ultimo ? `<div class="bob">≈ ${fmt(x.ultimo.stockBob)} bobinas</div>` : ''}
          <div class="cob" title="Stock actual ÷ consumo medio">⏳ <b>${fmt(x.cobertura, 1)}</b> días</div></div></div>
      <div class="ins-spark" data-ak="spark"><div class="spark-lect" id="spl-${id}">Stock de los últimos 60 días · pasá el puntero</div><canvas id="sp-${id}"></canvas></div>
      <div class="ins-pie dos">
        <div data-ak="consSem"><span>Consumo promedio por semana</span><b>${fmt(sem.cons, I.dec)} <small>${I.u}</small></b></div>
        <div data-ak="ingSem"><span>Ingresos promedio por semana</span><b>${fmt(sem.ing, I.dec)} <small>${I.u}</small></b></div>
        <p class="pie-nota">${semTxt} · PP ${fmt(x.pp)} ${I.u}</p>
      </div></article>`;
  }).join('');

  const maxD = Math.min(60, Math.max.apply(null, ORDEN.map(id => Math.max(M[id].cobertura || 0, M[id].diasPP || 0))) * 1.12) || 30;
  const cob = ORDEN.map(id => {
    const x = M[id], I = INSUMOS[id];
    const w = Math.min(100, 100 * (x.cobertura || 0) / maxD);
    return `<div class="cob-fila ${x.estado}"><div class="n"><span class="e">${I.ico}</span>${I.nombre}</div>
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
    return `<div class="tend-fila"><span class="e">${I.ico}</span><div><b>${fmt(k.lDia, I.dec)} ${I.u}/día</b><div class="sub">Antes: ${fmt(kp.lDia, I.dec)} ${I.u}/día · ingresos ${fmt(k.ingTotal)} ${I.u}</div></div><span class="flecha ${cls}">${fl}</span></div>`;
  }).join('');

  app().innerHTML = `<section class="vista">
    <div class="hero"><div><div class="eyebrow">${fechaLarga(M.hoy)} · Planta Cevil</div><h1>Insumos <span>críticos</span></h1>
      <p class="sub">Stock al último registro y cobertura con el consumo medio de cada insumo.</p></div>
      <div class="hero-der"><div class="resumen-chips">${chips}</div><div class="hero-acc">${btnGlosario()}${btnImprimir('general', 'Imprimir informe general')}</div></div></div>
    <div class="ins-grid stagger">${cards}</div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><div class="t"><h3>⏳ Días de cobertura</h3><span class="sub">Stock actual ÷ consumo medio</span></div>${btnAyuda('coberturaLista')}</div>
        <div class="cob-lista">${cob}</div>
        <div class="cob-ley"><span><i style="background:var(--warn)"></i>Punto de pedido</span><span><i style="background:var(--bad)"></i>Stock de seguridad</span></div></div>
      <div class="card"><div class="card-h"><div class="t"><h3>📈 Últimos 30 días</h3><span class="sub">Consumo diario contra los 30 días anteriores</span></div>${btnAyuda('tend')}</div><div class="tend">${tend}</div></div>
    </div>
    <div class="card"><div class="card-h"><div class="t"><h3>🔔 Alertas</h3><span class="sub">Lo que conviene revisar hoy</span></div></div><div class="alertas">${alertas().map((a, i) => `<div class="alerta ${a[0]}" style="animation-delay:${i * 40}ms"><span class="e">${a[1]}</span><span>${esc(a[2])}</span></div>`).join('')}</div></div>
  </section>`;

  app().querySelectorAll('[data-ir]').forEach(el => {
    el.onclick = e => { if (e.target.closest('[data-ayuda]') || document.body.classList.contains('modo-ayuda')) return; location.hash = '#/' + el.dataset.ir; };
    el.onkeydown = e => { if (e.key === 'Enter') location.hash = '#/' + el.dataset.ir; };
  });
  ORDEN.forEach(id => sparkline(id));
}

function sparkline(id) {
  const x = ST.modelo[id];
  const s = x.serie.filter(r => r.stock !== null && r.stock !== undefined).slice(-60);
  const c = colorIns(id);
  grafico('sp-' + id, {
    type: 'line',
    data: { labels: s.map(r => fFecha(r.f)), datasets: [
      { data: s.map(r => r.stock), borderColor: c, borderWidth: 2, pointRadius: 0, fill: true, tension: .25,
        backgroundColor: ctx => { const { ctx: g, chartArea: a } = ctx.chart; if (!a) return alfa(c, .15); const gr = g.createLinearGradient(0, a.top, 0, a.bottom); gr.addColorStop(0, alfa(c, .35)); gr.addColorStop(1, alfa(c, 0)); return gr; } },
      { data: s.map(() => x.pp), borderColor: cv('--warn'), borderWidth: 1.2, borderDash: [4, 3], pointRadius: 0 }
    ] },
    options: { maintainAspectRatio: false, animation: { duration: 700 }, layout: { padding: { top: 4 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false, external: ctx => {
        const el = $('spl-' + id);
        if (!el) return;
        const t = ctx.tooltip;
        if (!t || t.opacity === 0 || !t.dataPoints || !t.dataPoints.length) { el.classList.remove('on'); el.textContent = 'Stock de los últimos 60 días · pasá el puntero'; return; }
        const r = s[t.dataPoints[0].dataIndex];
        el.classList.add('on');
        el.innerHTML = `<b>${fFecha(r.f)}</b> · stock <b>${fmt(r.stock)} ${INSUMOS[id].u}</b> · PP ${fmt(x.pp)}`;
      } } },
      scales: { x: { display: false }, y: { display: false, beginAtZero: true } }, interaction: { mode: 'index', intersect: false },
      onHover: (e, el, ch) => { ch.canvas.style.cursor = 'crosshair'; } },
    plugins: [{ id: 'guia', afterDraw: ch => { const a = ch.tooltip && ch.tooltip.getActiveElements(); if (!a || !a.length) return; const x0 = a[0].element.x, g = ch.ctx; g.save(); g.strokeStyle = alfa(c, .6); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, ch.chartArea.top); g.lineTo(x0, ch.chartArea.bottom); g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(x0, a[0].element.y, 3.5, 0, 6.3); g.fill(); g.restore(); } }]
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
    if (verInventario() && (!ctrl || dn(M.hoy) - dn(ctrl.f) > 14)) al.push(['info', '🔍', `${I.nombre}: ${ctrl ? 'el último control físico fue el ' + fFecha(ctrl.f) : 'no hay controles físicos registrados'}.`]);
  });
  const tar = {};
  M.tarimas.serie.forEach(r => { tar[r.f] = r.cons; });
  const sinCons = M.stretch.serie.filter(r => r.f >= isoDn(dn(M.fin) - 13) && r.f <= M.fin && !r.consCargado && tar[r.f] > 0).map(r => fFecha(r.f).slice(0, 5));
  if (sinCons.length) al.push(['warn', '🧻', `Stretch: hay pallets producidos sin consumo de stretch cargado (${sinCons.join(', ')}).`]);
  if (verInventario()) [['tarimas', 'Tarimas'], ['stretch', 'Stretch']].forEach(([id, n]) => {
    const inv = M[id].inventario.slice(-1)[0];
    if (inv && inv.sis && Math.abs(inv.sis - inv.fis) / inv.sis > 0.05) al.push(['warn', '📋', `${n}: el último inventario (${fFecha(inv.f)}) difiere ${pct(100 * (inv.sis - inv.fis) / inv.sis)} del sistema (físico ${fmt(inv.fis)} · sistema ${fmt(inv.sis)}).`]);
  });
  if (!al.length) al.push(['ok', '✅', 'Todo en orden: sin alertas.']);
  const orden = { bad: 0, warn: 1, info: 2, ok: 3 };
  return al.sort((a, b) => orden[a[0]] - orden[b[0]]);
}

const AYUDA = {
  lDia: ['Consumo diario promedio', 'Consumo del período ÷ días calendario (cuenta domingos y días sin consumo). Si el período empieza antes que los datos, se cuenta desde el primer dato. La variación compara con el período indicado debajo.'],
  lDiaOp: ['Consumo por día operativo', 'Promedio de los días en que hubo consumo (mayor a cero). Sirve para dimensionar un día normal de producción.'],
  cons: ['Consumo total', 'Suma del consumo del período. Pico: el día de mayor consumo, con su fecha.'],
  consSem: ['Consumo promedio por semana', 'Consumo de las últimas 12 semanas completas (o desde el primer dato, si hay menos) ÷ días × 7.'],
  ingSem: ['Ingresos promedio por semana', 'Ingresos de proveedores de las últimas 12 semanas (o desde el primer dato) ÷ días × 7. En gasoil, cargas de cisterna.'],
  spark: ['Curva de stock', 'Stock de fin de día de los últimos 60 días. La línea punteada es el punto de pedido. Pasá el puntero por la curva para ver el valor de cada día.'],
  consT1: ['Consumo del turno 1', 'Bolsas consumidas en el turno 1 (22:00 a 6:00) por día, según el Informe de Producción, y su parte del consumo total.'],
  ajustes: ['Ajustes por control físico e inventario', 'Control de las 6:00: contado − stock del sistema a esa hora. Inventario: (sistema − físico) ÷ sistema. Solo lo ven administradores, Responsable de Compras y usuarios autorizados.'],
  movsIns: ['Últimos movimientos', 'Ingresos, envíos, descartes y cargas más recientes del insumo. «Ver todos» abre el historial completo.'],
  ing: ['Ingresos', 'Suma de lo recibido de proveedores en el período. Entregas: cantidad de remitos con ingreso. Por entrega: ingresos ÷ entregas.'],
  stockProm: ['Stock y cobertura promedio', 'Stock promedio: promedio del stock de fin de día del período. Cobertura promedio = stock promedio ÷ consumo diario promedio del período: cuántos días de consumo había en depósito. Mínimo: el stock más bajo registrado.'],
  diasSS: ['Días bajo stock de seguridad', 'Días en que el stock de fin de día quedó por debajo del stock de seguridad (SS) vigente hoy.'],
  descarte: ['Descarte de tarimas', 'Tarimas rotas o no aptas. Porcentaje = descartadas ÷ (consumidas + descartadas).'],
  difInv: ['Inventario físico contra sistema', '(Stock del sistema − conteo físico) ÷ stock del sistema, sumando los inventarios del período. Positivo: hay menos de lo que indica el sistema. Solo lo ven usuarios autorizados.'],
  grPallet: ['Stretch por pallet', 'Kg de stretch consumidos ÷ tarimas consumidas, en los días que tienen ambos datos, expresado en gramos por pallet.'],
  bobDia: ['Bobinas por día', 'Consumo diario de stretch en kg ÷ 15 kg por bobina.'],
  kgBob: ['Kg por bobina recibida', 'Kg recibidos ÷ bobinas recibidas en los ingresos del período. Si da menos de 15 kg, la planilla subestima las bobinas en stock.'],
  despachos: ['Despachos', 'Cargas de combustible registradas por el surtidor (Cintelink). L por despacho = litros ÷ despachos.'],
  unidades: ['Unidades con consumo', 'Cantidad de unidades distintas que cargaron. Top 3: porcentaje del consumo que concentran las tres unidades que más cargaron.'],
  cobertura: ['Cobertura', 'Stock actual ÷ consumo medio. Consumo medio: mediana de los días con consumo (tarimas y stretch: últimos 120 días; cal: últimos 21) y promedio diario de los últimos 90 días en gasoil.'],
  ss: ['Stock de seguridad (SS)', 'Días SS × consumo medio. Si el stock baja de este valor, el insumo queda en rojo (crítico).'],
  pp: ['Punto de pedido (PP)', 'Días PP × consumo medio. Si el stock baja de este valor hay que lanzar el pedido (naranja).'],
  insCard: ['Tarjeta del insumo', 'Stock: último stock registrado en la planilla. Días: stock ÷ consumo medio (cobertura). El dibujo muestra el nivel respecto de 1,5 veces el punto de pedido (en gasoil, respecto de la capacidad útil de la cisterna); las líneas punteadas marcan PP (naranja) y SS (rojo). Tocá la tarjeta para ver el detalle.'],
  tend: ['Últimos 30 días', 'Consumo diario promedio de los últimos 30 días completos contra los 30 días anteriores. Flecha arriba: se consume más.'],
  coberturaLista: ['Días de cobertura', 'Stock actual ÷ consumo medio de cada insumo. Las marcas indican los días de SS y de PP configurados.'],
  comparativa: ['Comparativa de períodos', 'Los mismos indicadores para cada período. 2025* y 2026*: del 1 de enero al último día completo de cada año. T3: julio a septiembre. La variación del año compara con el año anterior y la del trimestre con el mismo trimestre del año anterior.'],
  deptos: ['Consumo por departamento', 'Litros y L/día de cada departamento. Cada unidad cuenta en el departamento de su último registro. Var.: L/día del período contra el L/día del período comparado.'],
  unidadesGas: ['Consumo por unidad', 'L/día = litros ÷ días calendario del período. L/día activo = litros ÷ días desde la primera carga de la unidad (gris si son menos de 30 días). Días entre cargas = días activos ÷ despachos. L/h (máquinas) y km/L (camiones) se estiman con horómetro u odómetro, descartando lecturas incoherentes.'],
  proveedores: ['Ingresos por proveedor', 'Cantidad recibida, entregas y participación de cada proveedor en el período.'],
  stock: ['Evolución del stock', 'Stock de fin de día. Las líneas punteadas son el punto de pedido y el stock de seguridad vigentes hoy.'],
  mensual: ['Consumo diario por mes', 'Consumo del mes ÷ días del mes con datos. Las barras del período elegido están resaltadas.'],
  cargas: ['Cargas de cisterna', 'Litros descargados por el proveedor en la cisterna, registrados en Cargas_y_Ajustes.']
};

const GLOSARIO = [
  ['SS', 'Stock de seguridad: mínimo para no quedarse sin insumo mientras llega el pedido.'],
  ['PP', 'Punto de pedido: stock en el que hay que lanzar la compra.'],
  ['Cobertura', 'Días que alcanza el stock al consumo medio.'],
  ['Consumo medio', 'Mediana de los días con consumo de 120 días (tarimas y stretch) o promedio diario calendario de 21 días (cal) y 90 días (gasoil).'],
  ['u', 'Unidades (tarimas).'], ['kg', 'Kilogramos (stretch).'], ['bob.', 'Bobinas de stretch (15 kg cada una por defecto).'], ['L', 'Litros (gasoil).'],
  ['L/día', 'Litros por día calendario.'], ['L/h', 'Litros por hora de motor (máquinas, con horómetro).'], ['km/L', 'Kilómetros por litro (camiones, con odómetro).'],
  ['CV', 'Coeficiente de variación: desvío estándar ÷ promedio. Mide la irregularidad del consumo.'],
  ['Part.', 'Participación sobre el total.'], ['Var.', 'Variación porcentual contra el período comparado.'], ['Comp.', 'Valor del período comparado.'],
  ['Día operativo', 'Día con consumo mayor a cero.'], ['T1 · T2 · T3', 'Turnos: T1 22:00–06:00, T2 06:00–14:00, T3 14:00–22:00. Control físico y consumo T1 se toman a las 6:00.'],
  ['2025* · 2026*', 'Mismo tramo de cada año: del 1 de enero al último día completo.'], ['T1 a T4 (trimestres)', 'T1 ene–mar, T2 abr–jun, T3 jul–sep, T4 oct–dic.'],
  ['Reserva', 'Litros que no se pueden usar en el fondo de la cisterna (1.100 L).'], ['Cintelink', 'Sistema del surtidor que registra cada despacho de gasoil.']
];

const btnAyuda = k => k && AYUDA[k] ? `<button type="button" class="ayuda-btn" data-ayuda="${k}" aria-label="Cómo se calcula: ${esc(AYUDA[k][0])}">?</button>` : '';

function abrirAyuda(btn) {
  const a = AYUDA[btn.dataset.ayuda];
  if (!a) return;
  const p = $('pop');
  p.innerHTML = `<b>${esc(a[0])}</b><p>${esc(a[1])}</p><a href="#" data-glosario>Ver glosario de abreviaturas</a>`;
  p.classList.add('on');
  const r = btn.getBoundingClientRect();
  const w = Math.min(320, window.innerWidth - 24);
  p.style.width = w + 'px';
  p.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
  const alto = p.offsetHeight;
  p.style.top = (r.bottom + 8 + alto > window.innerHeight ? Math.max(12, r.top - alto - 8) : r.bottom + 8) + 'px';
}

function cerrarAyuda() { $('pop').classList.remove('on'); }

function abrirGlosario() {
  cerrarAyuda();
  const d = $('dlgGlosario');
  $('glosarioLista').innerHTML = GLOSARIO.map(g => `<dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd>`).join('');
  d.showModal();
}

const btnGlosario = () => `<button type="button" class="btn sm" data-glosario>${ICO.libro}Glosario</button>`;
const btnImprimir = (scope, txt) => verReportes() ? `<button type="button" class="btn sm pri" data-imprimir="${scope}">${ICO.imprimir}${txt || 'Imprimir informe'}</button>` : '';

function ayudaEn(el) {
  const a = AYUDA[el.dataset.ak];
  if (!a) return;
  const p = $('pop');
  p.innerHTML = `<b>${esc(a[0])}</b><p>${esc(a[1])}</p>`;
  p.classList.add('on');
  const r = el.getBoundingClientRect();
  const w = Math.min(320, window.innerWidth - 24);
  p.style.width = w + 'px';
  p.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + Math.min(r.width, 260) / 2 - w / 2 + 20)) + 'px';
  const alto = p.offsetHeight;
  p.style.top = (r.bottom + 8 + alto > window.innerHeight ? Math.max(12, r.top - alto - 8) : r.bottom + 8) + 'px';
  document.querySelectorAll('.ak-on').forEach(x => x.classList.remove('ak-on'));
  el.classList.add('ak-on');
}

function alternarModoAyuda(forzar) {
  const on = typeof forzar === 'boolean' ? forzar : !document.body.classList.contains('modo-ayuda');
  document.body.classList.toggle('modo-ayuda', on);
  $('btnModoAyuda').classList.toggle('on', on);
  $('btnModoAyuda').querySelector('span').textContent = on ? 'Salir de ayuda' : 'Ayuda';
  if (!on) { cerrarAyuda(); document.querySelectorAll('.ak-on').forEach(x => x.classList.remove('ak-on')); }
  else toast('Modo ayuda: pasá el puntero (o tocá) un indicador para ver cómo se obtiene', 'ok');
}

function kpiHtml(e, l, v, u, d, cls, ak) {
  return `<div class="kpi kacc ${cls || ''}"${ak ? ` data-ak="${ak}"` : ''}>${btnAyuda(ak)}<div class="l"><span class="e">${e}</span>${l}</div><div class="v">${v}${u ? `<small>${u}</small>` : ''}</div><div class="d">${d || '&nbsp;'}</div></div>`;
}

function cardHtml(titulo, sub, cuerpo, extra, ak) {
  return `<div class="card"${extra || ''}${ak ? ` data-ak="${ak}"` : ''}><div class="card-h"><div class="t"><h3>${titulo}</h3>${sub ? `<span class="sub">${sub}</span>` : ''}</div>${btnAyuda(ak)}</div>${cuerpo}</div>`;
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
    kpiHtml('📉', 'Consumo diario', fmt(k.lDia, dec), u + '/día', cmp || 'Consumo ÷ días calendario', '', 'lDia'),
    kpiHtml('🏭', 'Por día operativo', fmt(k.lDiaOp, dec), u + '/día', `${fmt(k.diasConsumo)} días con consumo`, '', 'lDiaOp'),
    kpiHtml('🔥', 'Consumo total', fmt(k.cons), u, `Pico ${fmt(k.pico, dec)} el ${fFecha(k.fechaPico)}`, '', 'cons'),
    kpiHtml('📥', 'Ingresos', fmt(k.ingTotal), u, `${fmt(k.entregas)} entregas · ${fmt(k.entregaProm, dec)} por entrega`, '', 'ing'),
    kpiHtml('📦', 'Stock promedio', fmt(k.stockProm), u, `⏳ Cobertura promedio <b>${fmt(k.coberturaProm, 1)} días</b> · mínimo ${fmt(k.stockMin)}`, '', 'stockProm'),
    kpiHtml('🚨', 'Días bajo SS', fmt(k.diasBajoSS), 'días', `de ${fmt(k.diasConStock)} con stock registrado`, k.diasBajoSS > 0 ? 'bad' : 'ok', 'diasSS')
  ];
  if (id === 'tarimas') ks.push(
    kpiHtml('🗑️', 'Descarte', fmt(k.descarte), u, `${pct(k.descartePct)} de las tarimas usadas`, '', 'descarte'),
    ...(verInventario() ? [kpiHtml('📋', 'Inventario vs. sistema', pct(k.difInv), '', `${fmt(k.inventarios)} inventarios`, Math.abs(k.difInv || 0) > 5 ? 'warn' : '', 'difInv')] : []));
  if (id === 'stretch') ks.push(
    kpiHtml('🎁', 'Stretch por pallet', fmt(k.grPallet), 'g', 'Kg de stretch ÷ tarimas consumidas', '', 'grPallet'),
    kpiHtml('🌀', 'Bobinas por día', fmt(k.bobDia, 1), 'bob.', `${fmt(ST.datos.params.kgPorBobina)} kg por bobina`, '', 'bobDia'),
    kpiHtml('⚖️', 'Kg por bobina recibida', fmt(k.kgBobina, 1), 'kg', 'Promedio de los ingresos', '', 'kgBob'),
    ...(verInventario() ? [kpiHtml('📋', 'Inventario vs. sistema', pct(k.difInv), '', `${fmt(k.inventarios)} inventarios`, Math.abs(k.difInv || 0) > 5 ? 'warn' : '', 'difInv')] : []));
  if (id === 'gasoil') ks.push(
    kpiHtml('🧾', 'Despachos', fmt(k.despachos), '', `${fmt(k.lDespacho, 1)} L por despacho`, '', 'despachos'),
    kpiHtml('🚛', 'Unidades con consumo', fmt(k.unidades), '', `Top 3 unidades: ${pct(k.top3)} del consumo`, '', 'unidades'));
  if (id === 'cal') {
    const t1 = sumar(x.serie.filter(r => r.f >= p.a && r.f <= p.b), 'consT1');
    ks.push(kpiHtml('🌙', 'Consumo turno 1', fmt(k.diasDatos ? t1 / k.diasDatos : null, 1), 'bolsas/día', `${pct(k.cons ? 100 * t1 / k.cons : null)} del consumo total`, '', 'consT1'));
  }

  const seg = ORDEN.map(i => `<button data-ins="${i}" class="${i === id ? 'on' : ''}"><span>${INSUMOS[i].ico}</span>${INSUMOS[i].nombre}</button>`).join('');
  const segP = PERIODOS_UI.map(q => `<button data-per="${q.id}" class="${q.id === ST.per ? 'on' : ''}"><span>${q.e}</span>${q.n}</button>`).join('');
  const ctrl = ultimoControl(x);
  app().innerHTML = `<section class="vista">
    <div class="seg solo-movil" id="segIns" style="margin-bottom:14px">${seg}</div>
    <div class="card det-hero ${x.estado}" style="--c:var(--c-${id})">
      <span class="ins-ico">${I.ico}</span>
      <div><div class="eyebrow">${I.desc}</div><h1>${I.nombre}</h1>
        <div class="datos"><span class="grande">${fmt(x.stock)} <small>${u}</small></span>
          <span class="tag est-tag">${ESTADO[x.estado]}</span>
          <span class="cob">⏳ <b>${fmt(x.cobertura, 1)}</b> días</span>
          <span class="sub">Consumo medio ${fmt(x.medio, dec)} ${u}/día · PP ${fmt(x.pp)} · SS ${fmt(x.ss)} · último control ${ctrl ? fFecha(ctrl.f) : '—'}</span></div></div>
      ${ilus(id, x.stock, x)}
    </div>
    <div class="barra-per"><div class="seg" id="segPer">${segP}</div><div class="hero-acc">${btnGlosario()}${btnImprimir(id, 'Imprimir informe de ' + I.nombre)}</div></div><p class="rango">🗓️ ${rango}</p>
    <div class="kpis stagger">${ks.map((h, i) => h.replace('class="kpi', `style="--i:${i}" class="kpi`)).join('')}</div>
    <div class="grid g2">
      ${cardHtml('📦 Evolución del stock', id === 'gasoil' ? `Disponible, sin la reserva de ${fmt(ST.datos.params.reservaCisterna)} L` : 'Con punto de pedido y stock de seguridad actuales', '<div class="chart lg"><canvas id="chStock"></canvas></div>', '', 'stock')}
      ${cardHtml('📊 Consumo diario por mes', `${u}/día · resaltado el período elegido`, '<div class="chart lg"><canvas id="chMensual"></canvas></div>', '', 'mensual')}
    </div>
    <div id="esp"></div>
    <div id="esp2"></div>
  </section>`;

  $('segIns').querySelectorAll('button').forEach(b => { b.onclick = () => { location.hash = '#/' + b.dataset.ins; }; });
  $('segPer').querySelectorAll('button').forEach(b => { b.onclick = () => { ST.per = b.dataset.per; LS.set('ic_per', ST.per); vistaInsumo(id); }; });
  requestAnimationFrame(() => { moverPill($('segIns')); moverPill($('segPer')); });

  const ci = colorIns(id);
  const s = x.serie.filter(r => r.f >= p.a && r.f <= p.b && r.stock !== null && r.stock !== undefined);
  grafico('chStock', {
    type: 'line',
    data: { labels: s.map(r => fFecha(r.f).slice(0, 6) + r.f.slice(2, 4)), datasets: [
      { label: 'Stock', data: s.map(r => r.stock), borderColor: ci, borderWidth: 2, pointRadius: 0, fill: true, tension: 0,
        backgroundColor: ctx => { const { ctx: g, chartArea: a } = ctx.chart; if (!a) return alfa(ci, .15); const gr = g.createLinearGradient(0, a.top, 0, a.bottom); gr.addColorStop(0, alfa(ci, .35)); gr.addColorStop(1, alfa(ci, .02)); return gr; } },
      { label: 'Punto de pedido', data: s.map(() => x.pp), borderColor: cv('--warn'), borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 },
      { label: 'Stock de seguridad', data: s.map(() => x.ss), borderColor: cv('--bad'), borderDash: [3, 3], borderWidth: 1.5, pointRadius: 0 }
    ] },
    options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { title: c => fFecha(s[c[0].dataIndex].f), label: c => c.dataset.label + ': ' + fmt(c.parsed.y, dec) + ' ' + u } } }, scales: { x: Object.assign(ejeX(), { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } }), y: ejeY(0) } }
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
  extrasInsumo(id, p);
}

function verTodos(titulo, html) {
  const d = $('dlgDetalle');
  $('detTitulo').innerHTML = titulo;
  $('detCuerpo').innerHTML = html;
  d.showModal();
  $('detCuerpo').scrollTop = 0;
}

const btnVerTodos = (clave, n, txt) => `<button type="button" class="btn sm ver-todos" data-vertodos="${clave}">${ICO.lista}${txt || 'Ver todos'} (${fmt(n)})</button>`;

function extrasInsumo(id, p) {
  const x = ST.modelo[id], I = INSUMOS[id];
  ST.verTodos = ST.verTodos || {};
  const movs = listaMovimientos(id).filter(m => m.tipo !== 'Control físico' && m.tipo !== 'Inventario' && m.tipo !== 'Medición sonda');
  ST.verTodos.movs = [`${I.ico} Movimientos de ${I.nombre.toLowerCase()}`, `<div class="mov-lista">${filasMov(movs, false)}</div>`];
  const cMov = cardHtml('🧾 Últimos movimientos', 'Los 6 más recientes', `<div class="mov-lista">${filasMov(movs.slice(0, 6), false)}</div>${movs.length > 6 ? `<div class="pie-card">${btnVerTodos('movs', movs.length)}</div>` : ''}`, '', 'movsIns');
  let cAj = '';
  if (verInventario() && id !== 'gasoil') {
    const ctr = x.serie.filter(r => r.ctrl !== null && r.ctrl !== undefined).slice().reverse();
    const inv = (x.inventario || []).filter(r => r.sis).slice().reverse();
    const uC = id === 'stretch' ? 'bob.' : I.u;
    const filaC = r => `<tr><td>${fFecha(r.f)}</td><td class="n">${fmt(r.ctrl)}</td><td class="n">${fmt(r.aj !== null && r.aj !== undefined ? r.ctrl - r.aj : null)}</td><td class="n"><span class="${(r.aj || 0) < 0 ? 'up' : 'dn'}">${r.aj > 0 ? '+' : ''}${fmt(r.aj)}</span></td></tr>`;
    const filaI = r => { const d = 100 * (r.sis - r.fis) / r.sis; return `<tr><td>${fFecha(r.f)}</td><td class="n">${fmt(r.fis)}</td><td class="n">${fmt(r.sis)}</td><td class="n">${fmt(r.fis - r.sis)}</td><td class="n"><span class="${Math.abs(d) > 5 ? 'up' : 'dn'}">${pct(d)}</span></td></tr>`; };
    const tC = l => `<div class="tw"><table><thead><tr><th>Control 6:00</th><th class="n">Contado [${uC}]</th><th class="n">Sistema [${uC}]</th><th class="n">Ajuste</th></tr></thead><tbody>${l.map(filaC).join('')}</tbody></table></div>`;
    const tI = l => `<div class="tw"><table><thead><tr><th>Inventario</th><th class="n">Físico</th><th class="n">Sistema</th><th class="n">Diferencia</th><th class="n">Dif. %</th></tr></thead><tbody>${l.map(filaI).join('')}</tbody></table></div>`;
    ST.verTodos.ctr = [`🔍 Controles físicos de las 6:00 · ${I.nombre}`, ctr.length ? tC(ctr) : '<div class="empty">Sin controles</div>'];
    ST.verTodos.inv = [`📋 Inventario físico vs. sistema · ${I.nombre}`, inv.length ? tI(inv) : '<div class="empty">Sin inventarios</div>'];
    const ajTot = sumar(ctr.filter(r => r.f >= p.a && r.f <= p.b && r.aj !== null && r.aj !== undefined), 'aj');
    const cuerpo = `<div class="aj-res"><div><span>Ajuste acumulado del período</span><b>${ajTot > 0 ? '+' : ''}${fmt(ajTot)} ${uC}</b></div><div><span>Controles cargados</span><b>${fmt(ctr.length)}</b></div>${id !== 'cal' ? `<div><span>Inventarios</span><b>${fmt(inv.length)}</b></div>` : ''}</div>
      ${ctr.length ? tC(ctr.slice(0, 5)) : '<div class="empty">📭 Sin controles físicos cargados</div>'}
      ${id !== 'cal' && inv.length ? tI(inv.slice(0, 4)) : ''}
      <div class="pie-card">${ctr.length > 5 ? btnVerTodos('ctr', ctr.length, 'Todos los controles') : ''}${inv.length > 4 ? btnVerTodos('inv', inv.length, 'Todos los inventarios') : ''}</div>`;
    cAj = cardHtml('🔐 Ajustes por control físico e inventario', 'Uso interno · contra el stock del sistema', cuerpo, '', 'ajustes');
  }
  $('esp2').innerHTML = `<div class="grid ${cAj ? 'g2' : ''}">${cMov}${cAj}</div>` + cardHtml('📋 Comparativa de períodos', 'Histórico, últimos 365 días, año en curso contra el anterior y trimestres', tablaComparativa(id), '', 'comparativa');
  app().querySelectorAll('[data-vertodos]').forEach(b => { b.onclick = () => { const v = ST.verTodos[b.dataset.vertodos]; if (v) verTodos(v[0], v[1]); }; });
}

function tablaProveedores(movs, u, dec, conBob, limite) {
  const g = {};
  movs.forEach(m => { const k = m.prov || '(sin proveedor)'; g[k] = g[k] || { n: 0, q: 0, bob: 0 }; g[k].n += m.cant > 0 ? 1 : 0; g[k].q += m.cant; g[k].bob += m.bob || 0; });
  const tot = sumar(Object.values(g), 'q');
  const todas = Object.entries(g).sort((a, b) => b[1].q - a[1].q);
  if (!todas.length) return '<div class="empty">📭 Sin ingresos en el período</div>';
  const filas = limite ? todas.slice(0, limite) : todas;
  const resto = todas.length - filas.length;
  const max = Math.max.apply(null, filas.map(f => f[1].q).concat([1]));
  return `<div class="tw"><table><thead><tr><th>Proveedor</th><th class="n">Entregas</th><th class="n">Cantidad [${u}]</th><th class="n">Participación</th><th class="n">Por entrega</th>${conBob ? '<th class="n">Bobinas</th><th class="n">Kg/bobina</th>' : ''}</tr></thead><tbody>` +
    filas.map(([p, x]) => `<tr><td>🏷️ ${esc(p)}</td><td class="n">${fmt(x.n)}</td><td class="n">${fmt(x.q, dec)}</td><td class="n">${pct(tot ? 100 * x.q / tot : null)}<span class="minibar"><span style="width:${100 * Math.max(x.q, 0) / max}%;background:var(--accent)"></span></span></td><td class="n">${fmt(x.n ? x.q / x.n : null, dec)}</td>${conBob ? `<td class="n">${fmt(x.bob)}</td><td class="n">${fmt(x.bob ? x.q / x.bob : null, 1)}</td>` : ''}</tr>`).join('') +
    (resto > 0 ? `<tr class="tenue"><td colspan="${conBob ? 7 : 5}">… y ${resto} proveedores más</td></tr>` : '') +
    `<tr class="total"><td>Total</td><td class="n">${fmt(sumar(todas.map(f => f[1].n)))}</td><td class="n">${fmt(tot, dec)}</td><td class="n">100,0 %</td><td></td>${conBob ? '<td></td><td></td>' : ''}</tr></tbody></table></div>`;
}

function espTarimas(p) {
  const x = ST.modelo.tarimas;
  const mv = movsPeriodo(x, p).filter(m => m.tipo === 'Ingreso');
  const vi = verInventario();
  $('esp').innerHTML = `<div class="grid ${vi ? 'g2' : ''}">${cardHtml('🏷️ Ingresos por proveedor', 'Período elegido · los 5 principales', tablaProveedores(mv, 'u', 0, false, 5), '', 'proveedores')}${vi ? cardHtml('📋 Inventario físico vs. sistema', 'Últimos 12 inventarios · diferencia (sistema − físico) ÷ sistema · rojo si supera 5 %', '<div class="chart"><canvas id="chE1"></canvas></div>', '', 'difInv') : ''}</div>` +
    cardHtml('🔁 Consumo, ingresos y descarte por mes', 'Unidades · últimos 18 meses', '<div class="chart lg"><canvas id="chE2"></canvas></div>');
  const inv = x.inventario.filter(r => r.sis).slice(-12);
  if (vi) grafico('chE1', {
    type: 'bar',
    data: { labels: inv.map(r => fFecha(r.f).slice(0, 5)), datasets: [{ data: inv.map(r => 100 * (r.sis - r.fis) / r.sis), borderRadius: 5, backgroundColor: inv.map(r => Math.abs((r.sis - r.fis) / r.sis) > 0.05 ? cv('--bad') : cv('--ok')) }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => pct(c.parsed.y) + ` · físico ${fmt(inv[c.dataIndex].fis)} · sistema ${fmt(inv[c.dataIndex].sis)}` } } }, scales: { x: ejeX(), y: Object.assign(ejeY(0), { beginAtZero: true }) } }
  });
  const g = {};
  x.serie.filter(r => r.f <= ST.modelo.fin).forEach(r => { const m = r.f.slice(0, 7); g[m] = g[m] || { c: 0, i: 0, d: 0 }; g[m].c += r.cons; g[m].i += r.ing; g[m].d += r.desc; });
  const ms = Object.keys(g).sort().slice(-18);
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
  const vi = verInventario();
  $('esp').innerHTML = `<div class="grid ${vi ? 'g3' : 'g2'}">${cardHtml('🏷️ Ingresos por proveedor', 'Período elegido · los 5 principales', tablaProveedores(mv, 'kg', 1, true, 5), '', 'proveedores')}${cardHtml('🎁 Stretch por pallet', 'Gramos por tarima consumida · últimos 18 meses', '<div class="chart"><canvas id="chE1"></canvas></div>', '', 'grPallet')}${vi ? cardHtml('📋 Inventario físico vs. sistema', 'Bobinas · últimos 12 inventarios', '<div class="chart"><canvas id="chE2"></canvas></div>', '', 'difInv') : ''}</div>`;
  const tar = {};
  ST.modelo.tarimas.serie.forEach(r => { tar[r.f] = r.cons; });
  const g = {};
  x.serie.filter(r => r.f <= ST.modelo.fin && r.cons > 0 && tar[r.f] > 0).forEach(r => { const m = r.f.slice(0, 7); g[m] = g[m] || { kg: 0, p: 0 }; g[m].kg += r.cons; g[m].p += tar[r.f]; });
  const ms = Object.keys(g).sort().slice(-18);
  const ci = colorIns('stretch');
  grafico('chE1', {
    type: 'line',
    data: { labels: ms.map(fMes), datasets: [{ label: 'g/pallet', data: ms.map(m => 1000 * g[m].kg / g[m].p), borderColor: ci, backgroundColor: ci, pointRadius: 3.5, tension: .25 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.y) + ' g/pallet' } } }, scales: { x: ejeX(), y: Object.assign(ejeY(0), { beginAtZero: false }) } }
  });
  const inv = x.inventario.slice(-12);
  if (vi) grafico('chE2', {
    type: 'bar',
    data: { labels: inv.map(r => fFecha(r.f).slice(0, 5)), datasets: [{ label: 'Físico', data: inv.map(r => r.fis), backgroundColor: ci, borderRadius: 5 }, { label: 'Sistema', data: inv.map(r => r.sis), backgroundColor: cv('--line-2'), borderRadius: 5 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: ejeX(), y: ejeY(0) } }
  });
}

function espCal(p) {
  const x = ST.modelo.cal;
  const s = x.serie.filter(r => r.f >= p.a && r.f <= p.b).slice(-45);
  $('esp').innerHTML = `<div class="grid g-21">${cardHtml('📆 Consumo diario', 'Bolsas por día y del turno 1 · últimos 45 días del período', '<div class="chart"><canvas id="chE1"></canvas></div>', '', 'consT1')}${cardHtml('📥 Ingresos', 'Período elegido · MovimientosCal', tablaProveedores(movsPeriodo(x, p).map(m => Object.assign({}, m, { prov: m.obs || '(sin detalle)' })), 'bolsas', 0, false, 5), '', 'proveedores')}</div>`;
  grafico('chE1', {
    type: 'bar',
    data: { labels: s.map(r => fFecha(r.f).slice(0, 5)), datasets: [{ label: 'Consumo', data: s.map(r => r.cons), backgroundColor: colorIns('cal'), borderRadius: 5 }, { label: 'Turno 1', data: s.map(r => r.consT1), type: 'line', borderColor: cv('--s1'), backgroundColor: cv('--s1'), pointRadius: 2.5 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: ejeX(), y: ejeY(0) } }
  });
}

const EM_DEP = { 'Máquinas cargadoras': '🚜', 'Camiones': '🚛', 'Autoelevadores': '🏗️', 'Camionetas': '🛻', 'Generador': '⚡', 'Mantenimiento': '🔧', 'Otros': '❔', 'Sin identificar (#)': '❔' };
const vtxt = v => v === null || v === undefined ? '—' : v > 999 ? '> +999 %' : delta(v);

function tablaComparativa(id) {
  const I = INSUMOS[id], x = ST.modelo[id], dec = I.dec;
  const P = periodos(ST.modelo.fin, x.inicio);
  const cols = [['hist', 'Histórico'], ['u365', 'Últ. 365 d'], ['ytd_ant', P.ytd_ant.a.slice(0, 4) + '*'], ['ytd', P.ytd.a.slice(0, 4) + '*'], ['trim_yoy', P.trim_yoy.nombre], ['trim_ant', P.trim_ant.nombre], ['trim', P.trim.nombre]];
  const K = {};
  cols.forEach(([c]) => { K[c] = kpis(id, P[c]); });
  const filas = [
    ['Días del período', 'dias', 0], [`Consumo [${I.u}/día]`, 'lDia', dec], [`Consumo total [${I.u}]`, 'cons', 0], ['Ingresos [' + I.u + ']', 'ingTotal', 0],
    [`Día pico [${I.u}]`, 'pico', 0], ['Días sin consumo', 'diasSin', 0], ['Variabilidad diaria (CV)', 'cv', 2], ['Stock promedio', 'stockProm', 0], ['Cobertura promedio [días]', 'coberturaProm', 1]
  ];
  if (id === 'gasoil') filas.push(['Despachos', 'despachos', 0], ['Litros por despacho', 'lDespacho', 1], ['Unidades con consumo', 'unidades', 0], ['Top 3 unidades [%]', 'top3', 1]);
  if (id === 'tarimas') filas.push(['Descarte [u]', 'descarte', 0], ['Descarte [%]', 'descartePct', 1]);
  if (id === 'stretch') filas.push(['Stretch por pallet [g]', 'grPallet', 0]);
  return `<div class="tw"><table class="comp"><thead><tr><th>Indicador</th>${cols.map(c => `<th class="n">${esc(c[1])}</th>`).join('')}</tr></thead><tbody>${filas.map(f => `<tr><td>${f[0]}</td>${cols.map(c => `<td class="n">${fmt(K[c[0]][f[1]], f[2])}</td>`).join('')}</tr>`).join('')}
    <tr class="total"><td>Variación del consumo diario</td>${cols.map(c => { const p = P[c[0]]; const d = p.cmp ? compara(K[c[0]], K[p.cmp]) : null; return `<td class="n"><span class="${dClase(d)}">${d === null ? '' : delta(d)}</span></td>`; }).join('')}</tr></tbody></table></div>
    <p class="nota">* Mismo tramo del año: del 01/01 al ${fFecha(P.ytd.b).slice(0, 5)}. La variación del año en curso se compara con el año anterior y la del último trimestre con el mismo trimestre del año anterior.</p>`;
}

function tablaUnidadesGasoil(p, P, opciones) {
  const o = opciones || {};
  const U = gasoilUnidades(p, P);
  const conC = !!p.cmp;
  const deps = {};
  U.forEach(r => { (deps[r.d] = deps[r.d] || []).push(r); });
  const orden = Object.entries(deps).sort((a, b) => sumar(b[1], 'l') - sumar(a[1], 'l'));
  const max = Math.max.apply(null, U.map(r => r.lDia).concat([1]));
  const nc = conC ? 11 : 9;
  const lista = o.top ? orden.map(([d, rs]) => [d, rs.slice(0, o.top)]) : orden;
  return `<div class="tw${o.top ? '' : ' max'}"><table><thead><tr><th>Unidad</th><th class="n">L/día</th><th class="n" title="Litros ÷ días desde la primera carga de la unidad">L/día activo</th><th class="n">Litros</th><th class="n">Part.</th><th class="n">Despachos</th><th class="n">L/despacho</th><th class="n">Días entre cargas</th><th class="n">L/h · km/L</th>${conC ? '<th class="n">L/día comp.</th><th class="n">Var.</th>' : ''}</tr></thead><tbody>` +
    lista.map(([d, rs]) => `<tr class="grupo"><td colspan="${nc}">${EM_DEP[d] || '🚗'} ${esc(d)} · ${fmt(sumar(rs, 'lDia'), 1)} L/día</td></tr>` + rs.map(r => `<tr><td>${esc(r.u)}</td><td class="n">${fmt(r.lDia, 1)}<span class="minibar"><span style="width:${100 * r.lDia / max}%"></span></span></td><td class="n${r.diasAct < 30 ? ' tenue' : ''}">${fmt(r.lDiaAct, 1)}</td><td class="n">${fmt(r.l)}</td><td class="n">${pct(r.part)}</td><td class="n">${fmt(r.n)}</td><td class="n">${fmt(r.lDesp, 1)}</td><td class="n">${fmt(r.intervalo, 1)}</td><td class="n">${r.lh ? fmt(r.lh, 2) + ' L/h' : r.kml ? fmt(r.kml, 2) + ' km/L' : '—'}</td>${conC ? `<td class="n">${r.nueva ? '—' : fmt(r.lDiaCmp, 1)}</td><td class="n"><span class="${dClase(r.delta)}">${r.nueva ? '🆕 Nueva' : vtxt(r.delta)}</span></td>` : ''}</tr>`).join('')).join('') + '</tbody></table></div>';
}

function tablaDeptosGasoil(p, P) {
  const G = agruparGasoil(p, P);
  const conC = !!G.c;
  const dv = (l, lc) => conC ? (lc ? 100 * (l / G.dias - lc / G.diasC) / (lc / G.diasC) : null) : null;
  const deps = Object.entries(G.dep).sort((a, b) => b[1].l - a[1].l);
  return `<div class="tw"><table><thead><tr><th>Departamento</th><th class="n">Unid.</th><th class="n">Litros</th><th class="n">L/día</th><th class="n">Part.</th>${conC ? '<th class="n">L/día comp.</th><th class="n">Var.</th>' : ''}</tr></thead><tbody>` +
    deps.map(([d, x]) => { const v = dv(x.l, G.depC[d]); return `<tr><td>${EM_DEP[d] || '🚗'} ${esc(d)}</td><td class="n">${x.u.size}</td><td class="n">${fmt(x.l)}</td><td class="n">${fmt(x.l / G.dias, 1)}</td><td class="n">${pct(100 * x.l / G.tot)}</td>${conC ? `<td class="n">${G.depC[d] ? fmt(G.depC[d] / G.diasC, 1) : '—'}</td><td class="n"><span class="${dClase(v)}">${G.depC[d] ? vtxt(v) : '🆕 Nuevo'}</span></td>` : ''}</tr>`; }).join('') +
    `<tr class="total"><td>Total planta</td><td class="n">${fmt(sumar(deps.map(d => d[1].u.size)))}</td><td class="n">${fmt(G.tot)}</td><td class="n">${fmt(G.tot / G.dias, 1)}</td><td class="n">100,0 %</td>${conC ? '<td></td><td></td>' : ''}</tr></tbody></table></div>`;
}

function datosMensualGasoil() {
  const x = ST.modelo.gasoil, fin = ST.modelo.fin;
  const totD = {};
  x.tx.forEach(t => { totD[t.d] = (totD[t.d] || 0) + t.l; });
  const top = Object.entries(totD).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  const series = top.concat(['Resto']);
  const g = {}, dias = {};
  x.serie.filter(r => r.f <= fin).forEach(r => { const m = r.f.slice(0, 7); dias[m] = (dias[m] || 0) + 1; });
  x.tx.filter(t => t.f <= fin).forEach(t => { const m = t.f.slice(0, 7), s = top.includes(t.d) ? t.d : 'Resto'; g[m + '|' + s] = (g[m + '|' + s] || 0) + t.l; });
  const ms = Object.keys(dias).sort().slice(-18);
  return { ms, series, val: (m, s) => (g[m + '|' + s] || 0) / dias[m] };
}

function graficoDeptosMes(idCanvas, animar) {
  const D = datosMensualGasoil();
  grafico(idCanvas, {
    type: 'bar',
    data: { labels: D.ms.map(fMes), datasets: D.series.map((s, i) => ({ label: s, data: D.ms.map(m => D.val(m, s)), backgroundColor: cv(PALETA[i]), borderRadius: 3 })) },
    options: { animation: animar === false ? false : undefined, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: animar === false ? { font: { size: 9 }, boxHeight: 6, padding: 6 } : {} }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + fmt(c.parsed.y, 1) + ' L/día' } } }, scales: { x: Object.assign(ejeX(), { stacked: true }, animar === false ? { ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } } : {}), y: Object.assign(ejeY(0), { stacked: true }, animar === false ? { ticks: { font: { size: 9 }, callback: v => fmt(v) } } : {}) } }
  });
}

function espGasoil(p, P) {
  const cargas = movsPeriodo(ST.modelo.gasoil, p).filter(m => m.tipo === 'Carga cisterna').slice().reverse();
  const filaC = m => `<div class="mov"><span class="e">🛢️</span><div class="t"><b>${fFecha(m.f)}</b><div class="sub">${esc(m.obs || 'Carga de cisterna')}</div></div><div class="q">${fmt(m.cant)} L</div></div>`;
  ST.verTodos = ST.verTodos || {};
  ST.verTodos.cargas = ['🛢️ Cargas de cisterna del período', `<div class="mov-lista">${cargas.map(filaC).join('')}</div>`];
  ST.verTodos.unidades = ['🚛 Consumo diario promedio por unidad · todas', tablaUnidadesGasoil(p, P)];
  const nU = gasoilUnidades(p, P).length;
  const tCargas = cargas.length ? `<div class="mov-lista">${cargas.slice(0, 5).map(filaC).join('')}</div><p class="nota">${cargas.length} cargas · ${fmt(sumar(cargas, 'cant'))} L · ${fmt(sumar(cargas, 'cant') / cargas.length)} L por carga</p>${cargas.length > 5 ? `<div class="pie-card">${btnVerTodos('cargas', cargas.length, 'Todas las cargas')}</div>` : ''}` : '<div class="empty">📭 Sin cargas en el período (el registro empieza en 2026)</div>';
  $('esp').innerHTML = `<div class="grid g-21">${cardHtml('🏢 Consumo por departamento', 'Cada unidad cuenta en el departamento de su último registro', tablaDeptosGasoil(p, P), '', 'deptos')}${cardHtml('🛢️ Cargas de cisterna', 'Período elegido', tCargas, '', 'cargas')}</div>` +
    cardHtml('🚛 Unidades de mayor consumo', 'Las 3 principales de cada departamento', tablaUnidadesGasoil(p, P, { top: 3 }) + `<div class="pie-card">${btnVerTodos('unidades', nU, 'Todas las unidades')}</div>`, '', 'unidadesGas') +
    cardHtml('📊 Consumo por departamento y mes', 'L/día · últimos 18 meses', '<div class="chart lg"><canvas id="chE1"></canvas></div>', '', 'deptos');
  graficoDeptosMes('chE1');
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
  const ops = OPS[ins].filter(o => o.id !== 'inventario' || verInventario());
  if (!ops.find(o => o.id === ST.regOp)) ST.regOp = ops[0].id;
  const op = ops.find(o => o.id === ST.regOp);
  const M = ST.modelo;
  $('adm').innerHTML = `<div class="grid g-21">
      <div class="card">
        <div class="paso"><span class="nro">1</span><h3>¿Qué insumo?</h3></div>
        <div class="tiles grandes" id="tIns">${ORDEN.map(i => `<button type="button" class="tile ${i === ins ? 'on' : ''}" data-ins="${i}"><span class="e">${INSUMOS[i].ico}</span><span><b>${INSUMOS[i].nombre}</b><br><small>${M ? fmt(M[i].stock) + ' ' + INSUMOS[i].u : ''}</small></span></button>`).join('')}</div>
        <div class="paso" style="margin-top:18px"><span class="nro">2</span><h3>¿Qué operación?</h3></div>
        <div class="tiles" id="tOps">${ops.map(o => `<button type="button" class="tile ${o.id === op.id ? 'on' : ''}" data-op="${o.id}"><span class="e">${o.emoji}</span><b>${o.nombre}</b></button>`).join('')}</div>
        <div class="paso" style="margin-top:18px"><span class="nro">3</span><h3>Datos</h3></div>
        <div class="ayuda-op"><span>💡</span><span>${esc(op.ayuda || '')}</span></div>
        <form id="formReg" autocomplete="off">
          <div class="form">${op.campos.map(c => campoHtml(c, op, ins)).join('')}</div>
          <div class="vista-previa vacia" id="prev">👀 Completá los datos para ver cómo queda el stock</div>
          <div class="acciones"><button class="btn" type="reset">🧹 Limpiar</button><button class="btn pri brillo" type="submit" id="btnGuardar">💾 Guardar</button></div>
        </form>
      </div>
      <div class="card"><div class="card-h"><div class="t"><h3>${INSUMOS[ins].ico} Últimos registros</h3><span class="sub">${INSUMOS[ins].nombre}</span></div></div><div class="mov-lista">${filasMov(listaMovimientos(ins).slice(0, 12), false)}</div></div>
    </div>`;
  $('tIns').querySelectorAll('[data-ins]').forEach(b => { b.onclick = () => { ST.regIns = b.dataset.ins; ST.regOp = null; vistaRegistrar(); }; });
  $('tOps').querySelectorAll('[data-op]').forEach(b => { b.onclick = () => { ST.regOp = b.dataset.op; vistaRegistrar(); }; });
  const f = $('formReg');
  f.oninput = () => vistaPrevia(ins, op);
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
  const p = { accion: op.id, insumo: ins };
  op.campos.forEach(c => { if (c === 'sobrescribir') p.sobrescribir = fd.get('sobrescribir') === 'on'; else if (c === 'provTexto') p.proveedor = fd.get('proveedor'); else p[c] = fd.get(c); });
  const b = $('btnGuardar');
  b.disabled = true;
  b.textContent = '⏳ Guardando…';
  guardando(true, 'Guardando en la planilla…');
  try {
    const msg = await apiPost(p);
    toast(msg || 'Registrado', 'ok');
    await cargar(true);
  } catch (err) {
    toast(err.message, 'bad');
    b.disabled = false;
    b.textContent = '💾 Guardar';
  } finally { guardando(false); }
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
    <div class="bar"><div class="seg" id="segMov">${ORDEN.map(i => `<button data-ins="${i}" class="${i === ins ? 'on' : ''}"><span>${INSUMOS[i].ico}</span>${INSUMOS[i].nombre}</button>`).join('')}</div>
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
  $('listaMov').innerHTML = filasMov(l.slice(0, 200), esAdmin());
  $('movNota').textContent = total > 200 ? `Se muestran 200 de ${total} registros. Filtrá por fecha para ver el resto.` : `${total} registros.${esAdmin() ? ' Los controles físicos e inventarios se corrigen desde la planilla.' : ' Para anular registros ingresá como administrador.'}`;
  $('listaMov').querySelectorAll('[data-anular]').forEach(b => {
    b.onclick = async () => {
      const [hoja, fila, f, q] = b.dataset.anular.split('|');
      if (!(await confirmar(`¿Anular el registro del ${fFecha(f)} (${fmt(+q, 1)})? Se elimina la fila ${fila} de la planilla.`))) return;
      guardando(true, 'Anulando registro…');
      try { toast(await apiPost({ accion: 'anular', hoja, fila: +fila, fecha: f, cantidad: +q }), 'ok'); await cargar(true); }
      catch (err) { toast(err.message, 'bad'); }
      finally { guardando(false); }
    };
  });
}

function vistaReposicion() {
  const M = ST.modelo;
  $('adm').innerHTML = `<p class="sub" style="margin-bottom:14px">Stock de seguridad = días SS × consumo medio · Punto de pedido = días PP × consumo medio. Se guardan en la hoja «Necesidades».</p>
    <div class="param-grid stagger">${ORDEN.map((id, i) => {
      const x = M[id], I = INSUMOS[id];
      return `<div class="card param" style="--c:var(--c-${id});--c2:var(--c-${id}-2);--i:${i}" data-id="${id}">
        <div class="ins-cab"><span class="ins-ico">${I.ico}</span><div><h3>${I.nombre}</h3><div class="sub">Consumo medio ${fmt(x.medio, I.dec)} ${I.u}/día</div></div>${x.paramGuardado ? '' : '<span class="tag t-mut">por defecto</span>'}</div>
        ${['SS', 'PP'].map(k => `<div class="stepper-fila"><div class="l">${k === 'SS' ? '🛡️ Stock de seguridad' : '🛒 Punto de pedido'}<small>días de consumo</small></div>
          <div class="stepper"><button type="button" data-paso="-1" data-k="${k}">−</button><input type="number" min="1" step="1" value="${k === 'SS' ? x.diasSS : x.diasPP}" data-k="${k}"><button type="button" data-paso="1" data-k="${k}">+</button></div></div>`).join('')}
        <div class="calc"><div><span>SS</span><b data-o="SS">${fmt(x.ss)}</b></div><div><span>PP</span><b data-o="PP">${fmt(x.pp)}</b></div><div><span>Stock</span><b>${fmt(x.stock)}</b></div></div>
        <button class="btn pri" data-guardar="${id}">💾 Guardar</button></div>`;
    }).join('')}</div>`;
  $('adm').querySelectorAll('.param').forEach(card => {
    const id = card.dataset.id, x = M[id];
    const recalc = () => {
      ['SS', 'PP'].forEach(k => { const v = +card.querySelector(`input[data-k="${k}"]`).value; card.querySelector(`[data-o="${k}"]`).textContent = x.medio ? fmt(Math.ceil(v * x.medio)) : '—'; });
    };
    card.querySelectorAll('[data-paso]').forEach(b => { b.onclick = () => { const inp = card.querySelector(`input[data-k="${b.dataset.k}"]`); inp.value = Math.max(1, (+inp.value || 0) + +b.dataset.paso); recalc(); }; });
    card.querySelectorAll('input').forEach(i => { i.oninput = recalc; });
    card.querySelector('[data-guardar]').onclick = async ev => {
      const b = ev.currentTarget;
      b.disabled = true;
      guardando(true, 'Guardando parámetros…');
      try {
        toast(await apiPost({ accion: 'parametros', insumo: id, diasSS: +card.querySelector('input[data-k="SS"]').value, diasPP: +card.querySelector('input[data-k="PP"]').value }), 'ok');
        await cargar(true);
      } catch (err) { toast(err.message, 'bad'); b.disabled = false; } finally { guardando(false); }
    };
  });
}

function vistaConexion() {
  const c = conexion();
  $('adm').innerHTML = `<div class="card"><div class="card-h"><div class="t"><h3>🔌 Conexión con la planilla</h3><span class="sub">URL de la aplicación web de Apps Script y clave de lectura. Se guardan solo en este navegador; la URL por defecto está en config.js.</span></div></div>
    <form class="form" id="formCx" autocomplete="off"><label class="f w2">URL /exec<input id="cUrl" type="url" value="${esc(c.url || '')}" placeholder="https://script.google.com/macros/s/.../exec"></label><label class="f">Clave de lectura<input id="cKey" type="password" value="${esc(c.key || '')}" placeholder="Opcional"></label>
    <div class="full acciones" style="margin-top:0"><button class="btn pri" type="submit">🔌 Guardar y probar</button></div></form></div>
    <div class="card"><div class="card-h"><div class="t"><h3>👤 Sesión</h3><span class="sub">Ingresaste como <b>${esc((sesion() || {}).usuario || '')}</b>. La sesión vence a las ${sesion() ? new Date(sesion().vence).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}.</span></div></div>
    <button class="btn dan" id="btnSalir2">🚪 Cerrar sesión</button></div>`;
  $('formCx').onsubmit = async e => {
    e.preventDefault();
    LS.set('ic_url', $('cUrl').value.trim());
    LS.set('ic_key', $('cKey').value.trim());
    await cargar(true);
    if (ST.datos) toast('Conexión correcta', 'ok');
  };
  $('btnSalir2').onclick = salir;
}

function vistaLogin() {
  app().innerHTML = `<section class="vista login-wrap">
    <div class="card login">
      <span class="logo-tile"><img src="img/logo-cmp.png" alt=""></span>
      <div class="eyebrow">Acceso con usuario validado</div>
      <h2>🔐 Administración</h2>
      <p class="sub">Elegí tu usuario e ingresá tu clave. Los permisos dependen del rol que te asignó el administrador.</p>
      <form id="formLogin" class="login-form" autocomplete="on">
        <label class="f">👤 Usuario<span id="lUsrCampo"><select id="lUsuario" required disabled><option>Cargando usuarios…</option></select></span></label>
        <label class="f">🔑 Clave<input id="lClave" type="password" required autocomplete="current-password"></label>
        <button class="btn pri brillo" type="submit" id="btnLogin">Ingresar</button>
      </form>
      <p class="login-nota" id="lNota">¿No figurás en la lista? Pedile al administrador que te cree un usuario.</p>
    </div></section>`;
  cargarListaUsuarios();
  $('formLogin').onsubmit = async e => {
    e.preventDefault();
    const b = $('btnLogin');
    b.disabled = true;
    b.innerHTML = '<span class="spin"></span> Verificando…';
    try {
      const usuario = String($('lUsuario').value || '').trim().toLowerCase();
      if (!usuario) throw new Error('Elegí tu usuario');
      const r = await apiPost({ accion: 'login', usuario, clave: $('lClave').value });
      LS.set('ic_usuario', usuario);
      LS.set('ic_ses', { token: r.token, vence: r.vence, usuario: r.usuario, nombre: r.nombre, rol: r.rol, verInventario: !!r.verInventario });
      toast('Bienvenido/a, ' + (r.nombre || r.usuario), 'ok');
      pintarSesion();
      LS.set('ic_cache', null);
      await cargar(true);
    } catch (err) {
      toast(err.message, 'bad');
      $('lClave').classList.add('inv');
      b.disabled = false;
      b.textContent = 'Ingresar';
    }
  };
}

async function cargarListaUsuarios() {
  const previo = LS.get('ic_usuario', '');
  const libre = nota => {
    $('lUsrCampo').innerHTML = `<input id="lUsuario" type="text" maxlength="40" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ej. ezequiel" value="${esc(previo)}">`;
    if (nota) $('lNota').textContent = nota;
  };
  try {
    const r = await apiPost({ accion: 'listaUsuarios' });
    if (!$('lUsrCampo')) return;
    const l = r.usuarios || [];
    if (!l.length) { libre('Primer ingreso: escribí el usuario que vas a usar y la clave maestra (ADMIN_KEY). Ese usuario queda como administrador.'); return; }
    $('lUsrCampo').innerHTML = `<select id="lUsuario" required autocomplete="username"><option value="">Elegí tu usuario…</option>${l.map(u => `<option value="${esc(u.usuario)}" ${u.usuario === previo ? 'selected' : ''}>${esc(u.nombre)} (${esc(u.usuario)})</option>`).join('')}</select>`;
    if (previo && l.find(u => u.usuario === previo)) $('lClave').focus();
  } catch (err) {
    if ($('lUsrCampo')) libre('No se pudo leer la lista de usuarios: escribí tu usuario.');
  }
}

function vistaAdmin() {
  const s = sesion();
  if (!s) { vistaLogin(); return; }
  const secs = ADMIN_SEC.filter(x => (!x.admin || esAdmin()) && (!x.reg || puedeRegistrar()));
  if (!secs.find(x => x.id === ST.admSec)) ST.admSec = puedeRegistrar() ? 'registrar' : 'cuenta';
  const rolTxt = (ROL_TXT[s.rol] || s.rol) + (s.rol === 'operador' && s.verInventario ? ' · ve inventarios' : '');
  app().innerHTML = `<section class="vista">
    <div class="hero"><div><div class="eyebrow">👤 ${esc(s.nombre || s.usuario)} · ${rolTxt}</div><h1>Admini<span>stración</span></h1><p class="sub">Todo lo que modifica las planillas está acá. Cada acción queda registrada con tu usuario.</p></div>
      <div class="seg" id="segAdm">${secs.map(x => `<button data-sec="${x.id}" class="${x.id === ST.admSec ? 'on' : ''}"><span>${x.e}</span>${x.n}</button>`).join('')}</div></div>
    <div id="adm"></div></section>`;
  $('segAdm').querySelectorAll('button').forEach(b => { b.onclick = () => { ST.admSec = b.dataset.sec; vistaAdmin(); }; });
  requestAnimationFrame(() => moverPill($('segAdm')));
  const v = { registrar: vistaRegistrar, reposicion: vistaReposicion, usuarios: vistaUsuarios, conexion: vistaConexion, cuenta: vistaCuenta }[ST.admSec];
  v();
}

async function vistaUsuarios() {
  $('adm').innerHTML = `<div class="grid g-21"><div class="card"><div class="card-h"><div class="t"><h3>👥 Usuarios</h3><span class="sub">Hoja «UsuariosApp». Las claves se guardan cifradas (hash con sal); nadie puede leerlas.</span></div><button class="btn sm pri" id="btnNuevoU">➕ Nuevo usuario</button></div><div id="listaU"><div class="empty"><span class="spin"></span> Cargando usuarios…</div></div></div>
    <div class="card" id="formUCard"></div></div>`;
  $('btnNuevoU').onclick = () => formUsuario(null);
  formUsuario(null);
  try {
    const r = await apiPost({ accion: 'usuarios' });
    ST.usuarios = r.usuarios || [];
    pintarUsuarios();
  } catch (err) { $('listaU').innerHTML = `<div class="empty">⚠️ ${esc(err.message)}</div>`; }
}

function pintarUsuarios() {
  const yo = sesion().usuario;
  $('listaU').innerHTML = `<div class="tabla-wrap"><table><thead><tr><th>Usuario</th><th>Rol</th><th>Ver inventarios</th><th>Estado</th><th>Último ingreso</th><th></th></tr></thead><tbody>${ST.usuarios.map((u, i) => `<tr class="${u.activo ? '' : 'inactivo'}">
      <td><b>${esc(u.nombre || u.usuario)}</b><br><small class="muted">${esc(u.usuario)}${u.usuario === yo ? ' · vos' : ''}</small></td>
      <td><span class="tag ${u.rol === 'admin' ? 't-acc' : u.rol === 'compras' ? 't-info' : 't-mut'}">${{ admin: '🛡️', compras: '🛒', operador: '🧰' }[u.rol] || ''} ${ROL_TXT[u.rol] || u.rol}</span></td>
      <td>${u.rol !== 'operador' ? '<span class="muted">Siempre</span>' : `<label class="switch"><input type="checkbox" data-inv="${i}" ${u.verInventario ? 'checked' : ''}><span></span></label>`}</td>
      <td>${u.activo ? '🟢 Activo' : '⚪ Inactivo'}</td>
      <td><small>${esc(u.ultimo || '—')}</small></td>
      <td class="n"><button class="btn sm" data-edit="${i}">✏️ Editar</button></td></tr>`).join('')}</tbody></table></div>`;
  $('listaU').querySelectorAll('[data-edit]').forEach(b => { b.onclick = () => formUsuario(ST.usuarios[+b.dataset.edit]); });
  $('listaU').querySelectorAll('[data-inv]').forEach(c => {
    c.onchange = async () => {
      const u = ST.usuarios[+c.dataset.inv];
      c.disabled = true;
      try {
        toast(await apiPost({ accion: 'guardarUsuario', usuarioId: u.usuario, nombre: u.nombre, rol: u.rol, verInventario: c.checked, activo: u.activo }), 'ok');
        u.verInventario = c.checked;
      } catch (err) { c.checked = !c.checked; toast(err.message, 'bad'); } finally { c.disabled = false; }
    };
  });
}

function formUsuario(u) {
  const nuevo = !u;
  u = u || { usuario: '', nombre: '', rol: 'operador', verInventario: false, activo: true };
  $('formUCard').innerHTML = `<div class="card-h"><div class="t"><h3>${nuevo ? '➕ Nuevo usuario' : '✏️ ' + esc(u.nombre || u.usuario)}</h3><span class="sub">${nuevo ? 'El usuario ingresa con estos datos; pedile que cambie la clave en «Mi cuenta».' : 'Dejá la clave vacía para no cambiarla.'}</span></div></div>
    <form class="form" id="formU" autocomplete="off">
      <label class="f">Usuario<input id="uId" type="text" maxlength="40" required autocapitalize="none" spellcheck="false" placeholder="ej. jperez" value="${esc(u.usuario)}" ${nuevo ? '' : 'readonly'}></label>
      <label class="f">Nombre y apellido<input id="uNom" type="text" maxlength="60" required value="${esc(u.nombre || '')}"></label>
      <label class="f">Rol<select id="uRol"><option value="operador" ${u.rol === 'operador' ? 'selected' : ''}>🧰 Operador · registra movimientos</option><option value="compras" ${u.rol === 'compras' ? 'selected' : ''}>🛒 Responsable de Compras · informes, movimientos e inventarios</option><option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>🛡️ Administrador · todo</option></select></label>
      <label class="f">${nuevo ? 'Clave inicial' : 'Nueva clave'}<input id="uClave" type="password" minlength="6" ${nuevo ? 'required' : ''} autocomplete="new-password" placeholder="Mínimo 6 caracteres"></label>
      <label class="chk full"><input type="checkbox" id="uInv" ${u.verInventario || u.rol !== 'operador' ? 'checked' : ''}> <span>📋 Puede ver inventarios físicos vs. sistema</span></label>
      <label class="chk full"><input type="checkbox" id="uAct" ${u.activo ? 'checked' : ''}> <span>🟢 Usuario activo (desmarcá para bloquear el acceso)</span></label>
      <div class="full acciones" style="margin-top:0">${nuevo ? '' : '<button class="btn" type="button" id="uCancel">Cancelar</button>'}<button class="btn pri" type="submit">💾 ${nuevo ? 'Crear usuario' : 'Guardar cambios'}</button></div>
    </form>`;
  const sync = () => { const fijo = $('uRol').value !== 'operador'; $('uInv').disabled = fijo; if (fijo) $('uInv').checked = true; };
  $('uRol').onchange = sync; sync();
  if (!nuevo) $('uCancel').onclick = () => formUsuario(null);
  $('formU').onsubmit = async e => {
    e.preventDefault();
    guardando(true, 'Guardando usuario…');
    try {
      const msg = await apiPost({ accion: 'guardarUsuario', usuarioId: $('uId').value.trim().toLowerCase(), nombre: $('uNom').value.trim(), rol: $('uRol').value, verInventario: $('uInv').checked, activo: $('uAct').checked, clave: $('uClave').value || undefined });
      toast(msg, 'ok');
      vistaUsuarios();
    } catch (err) { toast(err.message, 'bad'); } finally { guardando(false); }
  };
}

function vistaCuenta() {
  const s = sesion();
  $('adm').innerHTML = `<div class="grid g2"><div class="card"><div class="card-h"><div class="t"><h3>👤 Mi sesión</h3><span class="sub">Vence a las ${new Date(s.vence).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}.</span></div></div>
      <dl class="datos-u"><dt>Usuario</dt><dd>${esc(s.usuario)}</dd><dt>Nombre</dt><dd>${esc(s.nombre || '—')}</dd><dt>Rol</dt><dd>${ROL_TXT[s.rol] || s.rol}</dd><dt>Inventarios</dt><dd>${s.verInventario ? '📋 Autorizado' : '🚫 Sin autorización'}</dd></dl>
      <button class="btn dan" id="btnSalir2">🚪 Cerrar sesión</button></div>
    <div class="card"><div class="card-h"><div class="t"><h3>🔑 Cambiar clave</h3><span class="sub">Mínimo 6 caracteres.</span></div></div>
      <form class="form" id="formClave" autocomplete="off"><label class="f full">Clave actual<input id="cAct" type="password" required autocomplete="current-password"></label><label class="f">Nueva clave<input id="cNue" type="password" minlength="6" required autocomplete="new-password"></label><label class="f">Repetir nueva clave<input id="cRep" type="password" minlength="6" required autocomplete="new-password"></label>
      <div class="full acciones" style="margin-top:0"><button class="btn pri" type="submit">💾 Cambiar clave</button></div></form></div></div>`;
  $('btnSalir2').onclick = salir;
  $('formClave').onsubmit = async e => {
    e.preventDefault();
    if ($('cNue').value !== $('cRep').value) { $('cRep').classList.add('inv'); toast('Las claves nuevas no coinciden', 'bad'); return; }
    guardando(true, 'Cambiando clave…');
    try { toast(await apiPost({ accion: 'cambiarClave', actual: $('cAct').value, nueva: $('cNue').value }), 'ok'); $('formClave').reset(); }
    catch (err) { toast(err.message, 'bad'); } finally { guardando(false); }
  };
}

async function salir() {
  const s = sesion();
  LS.set('ic_ses', null);
  LS.set('ic_cache', null);
  pintarSesion();
  toast('Sesión cerrada', 'ok');
  if (s) { try { await apiPost({ accion: 'logout', token: s.token }); } catch (e) {} }
  if (ST.modelo) { ST.datos.tarimas.inventario = null; ST.datos.stretch.inventario = null; ST.modelo = construirModelo(ST.datos); }
  render();
  cargar(true);
}

function pintarSesion() {
  const s = sesion();
  const b = $('btnSesion');
  b.innerHTML = s ? `${ICO.usuario}<span>${esc((s.nombre || s.usuario).split(' ')[0])}</span>` : `${ICO.candado}<span>Ingresar</span>`;
  b.title = s ? `Sesión de ${s.nombre || s.usuario} · clic para ver tu cuenta` : 'Ingresar con usuario y clave';
  b.classList.toggle('pri', !s);
}

const PER_INF = [
  { id: 'u30', e: '🗓️', n: 'Últimos 30 días' },
  { id: 'trim', e: '📊', n: 'Último trimestre' },
  { id: 'ytd', e: '📅', n: 'Año en curso' },
  { id: 'u365', e: '📆', n: 'Últimos 365 días' },
  { id: 'hist', e: '📚', n: 'Histórico' }
];
const ALCANCES = [{ id: 'general', e: ICO.fabrica, n: 'General' }].concat(ORDEN.map(id => ({ id, e: INSUMOS[id].ico, n: INSUMOS[id].nombre })));

function periodoInforme(id, pid) {
  const P = periodos(ST.modelo.fin, ST.modelo[id].inicio);
  const p = Object.assign({}, P[pid] || P.u30);
  if (pid === 'u30') { p.cmp = 'p30'; p.nombre = 'Últimos 30 días'; }
  if (pid === 'hist') p.nombre = 'Histórico';
  return { P, p };
}

function cabeceraInforme(titulo, p0, P) {
  const ses = sesion();
  const ahora = new Date();
  return `<header class="inf-cab"><img src="img/logo-cmp.png" alt=""><div><div class="inf-emp">Cerámica Marcos Paz · Planta Cevil</div><h2>${esc(titulo)}</h2><div class="inf-sub">Control de insumos críticos</div></div>
    <dl><dt>Período</dt><dd>${esc(p0.nombre)}: ${fFecha(p0.a)} al ${fFecha(p0.b)}</dd><dt>Comparado con</dt><dd>${p0.cmp ? esc(P[p0.cmp].nombre) + ' (' + fFecha(P[p0.cmp].a) + ' al ' + fFecha(P[p0.cmp].b) + ')' : '—'}</dd><dt>Emitido</dt><dd>${ahora.toLocaleDateString('es-AR')} ${ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</dd><dt>Emitido por</dt><dd>${esc(ses ? ses.nombre || ses.usuario : '—')}</dd></dl></header>`;
}

function glosarioInforme(claves) {
  const l = GLOSARIO.filter(g => claves.indexOf(g[0]) >= 0);
  return `<div class="inf-glos-wrap"><h3 class="inf-h">Abreviaturas y criterios</h3><dl class="inf-glos">${l.map(g => `<dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd>`).join('')}</dl></div>`;
}

function infKpi(l, v, sub, cls) { return `<div class="inf-kpi ${cls || ''}"><span>${l}</span><b>${v}</b><small>${sub || '&nbsp;'}</small></div>`; }

function graficoStockInf(cid, id, p) {
  const x = ST.modelo[id], ci = colorIns(id);
  const sr = x.serie.filter(r => r.f >= p.a && r.f <= p.b && r.stock !== null && r.stock !== undefined);
  grafico(cid, {
    type: 'line',
    data: { labels: sr.map(r => fFecha(r.f).slice(0, 5) + (p.b.slice(0, 4) !== p.a.slice(0, 4) ? '/' + r.f.slice(2, 4) : '')), datasets: [
      { label: 'Stock', data: sr.map(r => r.stock), borderColor: ci, backgroundColor: alfa(ci, .18), fill: true, pointRadius: 0, borderWidth: 1.6 },
      { label: 'PP', data: sr.map(() => x.pp), borderColor: cv('--warn'), borderDash: [5, 3], pointRadius: 0, borderWidth: 1.2 },
      { label: 'SS', data: sr.map(() => x.ss), borderColor: cv('--bad'), borderDash: [2, 2], pointRadius: 0, borderWidth: 1.2 }
    ] },
    options: { animation: false, devicePixelRatio: 2, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: Object.assign(ejeX(), { ticks: { maxTicksLimit: 6, maxRotation: 0, font: { size: 8.5 } } }), y: Object.assign(ejeY(0), { ticks: { callback: v => fmt(v), font: { size: 8.5 } } }) } }
  });
}

function graficoMensualInf(cid, id, p) {
  const ci = colorIns(id), men = mensual(id).slice(-24);
  grafico(cid, {
    type: 'bar',
    data: { labels: men.map(r => fMes(r.mes)), datasets: [{ data: men.map(r => r.v), borderRadius: 3, backgroundColor: men.map(r => (r.mes >= p.a.slice(0, 7) && r.mes <= p.b.slice(0, 7)) ? ci : alfa(ci, .3)) }] },
    options: { animation: false, devicePixelRatio: 2, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: Object.assign(ejeX(), { ticks: { maxTicksLimit: 8, maxRotation: 0, font: { size: 8.5 } } }), y: Object.assign(ejeY(0), { ticks: { callback: v => fmt(v), font: { size: 8.5 } } }) } }
  });
}

function informeGeneral(pid, pre) {
  const M = ST.modelo;
  const base = periodoInforme('gasoil', pid);
  const p0 = base.p;
  const filas = ORDEN.map(id => {
    const { P, p } = periodoInforme(id, pid);
    const k = kpis(id, p), kc = p.cmp ? kpis(id, P[p.cmp]) : null;
    return { id, k, d: compara(k, kc) };
  });
  const tarjetas = ORDEN.map(id => {
    const x = M[id], I = INSUMOS[id];
    return `<div class="inf-est ${x.estado}" style="--c:var(--c-${id});--c2:var(--c-${id}-2)">${ilus(id, x.stock, x)}<div><div class="inf-nom">${I.ico} ${I.nombre}</div><div class="inf-stock">${fmt(x.stock)} <small>${I.u}</small></div><div class="inf-cob">⏳ ${fmt(x.cobertura, 1)} días · <span class="est-tag tag">${ESTADO[x.estado]}</span></div><div class="inf-pp">PP ${fmt(x.pp)} · SS ${fmt(x.ss)} ${I.u}</div></div></div>`;
  }).join('');
  const tabla = `<table class="inf-tabla"><thead><tr><th>Insumo</th><th class="n">Consumo/día</th><th class="n">Var.</th><th class="n">Consumo total</th><th class="n">Ingresos</th><th class="n">Stock prom.</th><th class="n">Cobertura prom.</th><th class="n">Días bajo SS</th></tr></thead><tbody>${filas.map(f => { const I = INSUMOS[f.id]; return `<tr><td>${I.ico} ${I.nombre}</td><td class="n"><b>${fmt(f.k.lDia, I.dec)}</b> ${I.u}</td><td class="n"><span class="${dClase(f.d)}">${delta(f.d)}</span></td><td class="n">${fmt(f.k.cons)} ${I.u}</td><td class="n">${fmt(f.k.ingTotal)} ${I.u}</td><td class="n">${fmt(f.k.stockProm)} ${I.u}</td><td class="n">${fmt(f.k.coberturaProm, 1)} d</td><td class="n">${fmt(f.k.diasBajoSS)}</td></tr>`; }).join('')}</tbody></table>`;
  const vi = verInventario();
  const claves = id => {
    const k = filas.find(f => f.id === id).k, I = INSUMOS[id];
    const sem = semanal(id, 12);
    const l = [['Consumo diario', fmt(k.lDia, I.dec) + ' ' + I.u], ['Consumo por semana', fmt(sem.cons, I.dec) + ' ' + I.u], ['Ingresos por semana', fmt(sem.ing, I.dec) + ' ' + I.u], ['Día pico', fmt(k.pico) + ' (' + (k.fechaPico ? fFecha(k.fechaPico).slice(0, 5) : '—') + ')']];
    if (id === 'tarimas') { l.push(['Descarte', pct(k.descartePct)]); if (vi) l.push(['Inventario vs. sistema', pct(k.difInv)]); }
    if (id === 'stretch') { l.push(['Stretch por pallet', fmt(k.grPallet) + ' g']); if (vi) l.push(['Inventario vs. sistema', pct(k.difInv)]); }
    if (id === 'gasoil') l.push(['Despachos', fmt(k.despachos)], ['Top 3 unidades', pct(k.top3)]);
    return l.map(x => `<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
  };
  const bloques = ORDEN.map(id => `<div class="inf-bloque" style="--c:var(--c-${id})"><h4>${INSUMOS[id].ico} ${INSUMOS[id].nombre}</h4><div class="inf-claves">${claves(id)}</div><div class="inf-chart"><canvas id="${pre}-st-${id}"></canvas></div></div>`).join('');
  const al = alertas();
  const html = `<article class="informe">${cabeceraInforme('Informe general de insumos críticos', p0, base.P)}
      <h3 class="inf-h">1 · Estado actual del stock</h3><div class="inf-estado">${tarjetas}</div>
      <h3 class="inf-h">2 · Indicadores del período</h3>${tabla}
      <h3 class="inf-h">3 · Alertas y acciones</h3><ul class="inf-alertas">${al.map(a => `<li class="${a[0]}"><span>${a[1]}</span>${esc(a[2])}</li>`).join('')}</ul>
      <h3 class="inf-h">4 · Evolución del stock por insumo</h3><div class="inf-bloques">${bloques}</div>
      <div class="inf-sec"><h3 class="inf-h">5 · Gasoil por departamento</h3><div class="inf-gas"><div>${tablaDeptosGasoil(p0, base.P)}</div><div class="inf-chart alto"><canvas id="${pre}-dep"></canvas></div></div></div>
      <div class="inf-sec"><h3 class="inf-h">6 · Unidades de mayor consumo de gasoil</h3>${tablaUnidadesGasoil(p0, base.P, { top: 3 })}</div>
      ${glosarioInforme(['SS', 'PP', 'Cobertura', 'Consumo medio', 'u', 'kg', 'L', 'L/día', 'L/h', 'km/L', 'Part.', 'Var.', 'Comp.'])}
      <footer class="inf-pie">Fuente: planillas «Stock Insumos Criticos CEVIL» y «Combustible CMP». Consumo diario = consumo ÷ días calendario. Datos al ${fFecha(M.fin)}.</footer></article>`;
  return { html, dibujar: () => { ORDEN.forEach(id => graficoStockInf(`${pre}-st-${id}`, id, periodoInforme(id, pid).p)); graficoDeptosMes(`${pre}-dep`, false); } };
}

function informeInsumo(id, pid, pre) {
  const M = ST.modelo, x = M[id], I = INSUMOS[id], u = I.u, dec = I.dec;
  const { P, p } = periodoInforme(id, pid);
  const k = kpis(id, p);
  const kc = p.cmp ? kpis(id, P[p.cmp]) : null, kc2 = p.cmp2 ? kpis(id, P[p.cmp2]) : null;
  const d1 = compara(k, kc), d2 = compara(k, kc2);
  const vi = verInventario();
  const ult = (x.movs || []).filter(m => m.tipo === 'Ingreso' || m.tipo === 'Carga cisterna').slice(-1)[0];
  const ctrl = ultimoControl(x);
  const varTxt = [d1 !== null ? `<span class="${dClase(d1)}">${delta(d1)}</span> vs. ${esc(P[p.cmp].nombre)}` : '', d2 !== null ? `<span class="${dClase(d2)}">${delta(d2)}</span> vs. ${esc(P[p.cmp2].nombre)}` : ''].filter(Boolean).join(' · ');
  const ks = [
    infKpi(`Consumo diario [${u}/día]`, fmt(k.lDia, dec), varTxt || 'Consumo ÷ días calendario'),
    infKpi(`Por día operativo [${u}/día]`, fmt(k.lDiaOp, dec), `${fmt(k.diasConsumo)} días con consumo`),
    infKpi(`Consumo total [${u}]`, fmt(k.cons), `Pico ${fmt(k.pico, dec)}${k.fechaPico ? ' (' + fFecha(k.fechaPico).slice(0, 5) + ')' : ''}`),
    infKpi(`Ingresos [${u}]`, fmt(k.ingTotal), `${fmt(k.entregas)} entregas`),
    infKpi(`Stock promedio [${u}]`, fmt(k.stockProm), `Cobertura promedio ${fmt(k.coberturaProm, 1)} días · mín. ${fmt(k.stockMin)}`),
    infKpi('Días bajo SS', fmt(k.diasBajoSS), `de ${fmt(k.diasConStock)} días`, k.diasBajoSS > 0 ? 'bad' : '')
  ];
  const sem = semanal(id, 12);
  ks.splice(4, 0, infKpi(`Consumo / ingresos por semana [${u}]`, `${fmt(sem.cons, dec)} / ${fmt(sem.ing, dec)}`, sem.dias < 84 ? `últimos ${sem.dias} días` : 'últimas 12 semanas'));
  if (id === 'tarimas') { ks.push(infKpi('Descarte [u]', fmt(k.descarte), pct(k.descartePct) + ' de las usadas')); if (vi) ks.push(infKpi('Inventario vs. sistema', pct(k.difInv), `${fmt(k.inventarios)} inventarios`)); }
  if (id === 'stretch') { ks.push(infKpi('Stretch por pallet', fmt(k.grPallet) + ' g', 'Kg ÷ tarimas consumidas'), infKpi('Bobinas por día', fmt(k.bobDia, 1), ''), infKpi('Kg por bobina recibida', fmt(k.kgBobina, 1), '')); if (vi) ks.push(infKpi('Inventario vs. sistema', pct(k.difInv), `${fmt(k.inventarios)} inventarios`)); }
  if (id === 'gasoil') ks.push(infKpi('Despachos', fmt(k.despachos), `${fmt(k.lDespacho, 1)} L por despacho`), infKpi('Unidades con consumo', fmt(k.unidades), `Top 3: ${pct(k.top3)} del consumo`));
  if (id === 'cal') { const t1 = sumar(x.serie.filter(r => r.f >= p.a && r.f <= p.b), 'consT1'); ks.push(infKpi('Consumo turno 1 [bolsas/día]', fmt(k.diasDatos ? t1 / k.diasDatos : null, 1), pct(k.cons ? 100 * t1 / k.cons : null) + ' del total')); }
  if (vi && id !== 'gasoil') ks.push(infKpi('Ajuste por controles 6:00', fmt(k.ajusteTotal), `${fmt(k.controles)} controles · uso interno`));
  let esp = '';
  if (id === 'tarimas') {
    esp = `<div class="inf-sec"><h3 class="inf-h">5 · Ingresos por proveedor</h3>${tablaProveedores(movsPeriodo(x, p).filter(m => m.tipo === 'Ingreso'), 'u', 0)}</div>`;
    if (vi) esp += tablaInventarioInf(x, p, 'u');
  } else if (id === 'stretch') {
    esp = `<div class="inf-sec"><h3 class="inf-h">5 · Ingresos por proveedor</h3>${tablaProveedores(movsPeriodo(x, p).filter(m => m.tipo !== 'Envío'), 'kg', 1, true)}</div>`;
    if (vi) esp += tablaInventarioInf(x, p, 'bobinas');
  } else if (id === 'gasoil') {
    esp = `<div class="inf-sec"><h3 class="inf-h">5 · Consumo por departamento</h3><div class="inf-gas"><div>${tablaDeptosGasoil(p, P)}</div><div class="inf-chart alto"><canvas id="${pre}-dep"></canvas></div></div></div>
      <h3 class="inf-h">6 · Consumo diario promedio por unidad</h3>${tablaUnidadesGasoil(p, P, { top: 99 })}`;
  } else {
    esp = `<div class="inf-sec"><h3 class="inf-h">5 · Ingresos</h3>${tablaProveedores(movsPeriodo(x, p).map(m => Object.assign({}, m, { prov: m.obs || '(sin detalle)' })), 'bolsas', 0)}</div>`;
  }
  const claves = ['SS', 'PP', 'Cobertura', 'Consumo medio', 'CV', 'Día operativo', '2025* · 2026*', 'T1 a T4 (trimestres)', 'Var.', 'Comp.', 'Part.', u === 'u' ? 'u' : u === 'kg' ? 'kg' : u === 'L' ? 'L' : ''];
  if (id === 'stretch') claves.push('bob.');
  if (id === 'gasoil') claves.push('L/día', 'L/h', 'km/L', 'Reserva', 'Cintelink');
  const html = `<article class="informe">${cabeceraInforme('Informe de ' + I.nombre.toLowerCase(), p, P)}
      <h3 class="inf-h">1 · Estado actual</h3>
      <div class="inf-est-1 ${x.estado}" style="--c:var(--c-${id});--c2:var(--c-${id}-2)">${ilus(id, x.stock, x)}
        <div><div class="inf-nom">${I.ico} ${I.nombre} · ${I.desc}</div><div class="inf-stock">${fmt(x.stock)} <small>${u}</small>${id === 'stretch' && x.ultimo ? ` <small>(≈ ${fmt(x.ultimo.stockBob)} bobinas)</small>` : ''}</div><div class="inf-cob">⏳ ${fmt(x.cobertura, 1)} días de cobertura · <span class="est-tag tag">${ESTADO[x.estado]}</span></div></div>
        <dl><dt>Consumo medio</dt><dd>${fmt(x.medio, dec)} ${u}/día</dd><dt>Punto de pedido (${x.diasPP} d)</dt><dd>${fmt(x.pp)} ${u}</dd><dt>Stock de seguridad (${x.diasSS} d)</dt><dd>${fmt(x.ss)} ${u}</dd><dt>Último ingreso</dt><dd>${ult ? fFecha(ult.f) + ' · ' + fmt(ult.cant) + ' ' + u : '—'}</dd><dt>Último control</dt><dd>${ctrl ? fFecha(ctrl.f) : '—'}</dd></dl></div>
      <h3 class="inf-h">2 · Indicadores del período</h3><div class="inf-kpis">${ks.join('')}</div>
      <div class="inf-sec"><h3 class="inf-h">3 · Stock y consumo</h3><div class="inf-2"><div><h4>Evolución del stock [${u}]</h4><div class="inf-chart medio"><canvas id="${pre}-st"></canvas></div></div><div><h4>Consumo diario por mes [${u}/día]</h4><div class="inf-chart medio"><canvas id="${pre}-men"></canvas></div></div></div></div>
      <h3 class="inf-h">4 · Comparativa de períodos</h3>${tablaComparativa(id)}
      ${esp}
      ${glosarioInforme(claves)}
      <footer class="inf-pie">Fuente: ${id === 'gasoil' ? 'planilla «Combustible CMP» (DetalleCevil, Control_Diaro, Cargas_y_Ajustes)' : 'planilla «Stock Insumos Criticos CEVIL»'}. Datos al ${fFecha(M.fin)}.</footer></article>`;
  return { html, dibujar: () => { graficoStockInf(`${pre}-st`, id, p); graficoMensualInf(`${pre}-men`, id, p); if (id === 'gasoil') graficoDeptosMes(`${pre}-dep`, false); } };
}

function tablaInventarioInf(x, p, u) {
  const inv = x.inventario.filter(r => r.f >= p.a && r.f <= p.b && r.sis).slice(-10);
  if (!inv.length) return '';
  return `<div class="inf-sec"><h3 class="inf-h">Inventario físico contra sistema [${u}] · uso interno</h3><table><thead><tr><th>Fecha</th><th class="n">Físico</th><th class="n">Sistema</th><th class="n">Diferencia</th></tr></thead><tbody>${inv.map(r => { const d = 100 * (r.sis - r.fis) / r.sis; return `<tr><td>${fFecha(r.f)}</td><td class="n">${fmt(r.fis)}</td><td class="n">${fmt(r.sis)}</td><td class="n"><span class="${Math.abs(d) > 5 ? 'up' : 'dn'}">${pct(d)}</span></td></tr>`; }).join('')}</tbody></table></div>`;
}

function construirInforme(scope, pid, pre) {
  return scope === 'general' ? informeGeneral(pid, pre) : informeInsumo(scope, pid, pre);
}

function imprimir(scope, pid) {
  if (!ST.modelo) return;
  const cont = $('print');
  Object.keys(ST.charts).filter(k => k.startsWith('pr-')).forEach(destruir);
  const r = construirInforme(scope, pid, 'pr');
  cont.innerHTML = r.html;
  ST.cvEl = cont.querySelector('.informe');
  r.dibujar();
  ST.cvEl = null;
  document.body.classList.add('imprimiendo');
  guardando(true, 'Preparando el informe…');
  setTimeout(() => { guardando(false); window.print(); }, 450);
}

function finImpresion() {
  document.body.classList.remove('imprimiendo');
  Object.keys(ST.charts).filter(k => k.startsWith('pr-')).forEach(destruir);
  $('print').innerHTML = '';
}

function vistaInforme() {
  if (!ALCANCES.find(x => x.id === ST.infScope)) ST.infScope = 'general';
  if (!PER_INF.find(x => x.id === ST.perInf)) ST.perInf = 'u30';
  const r = construirInforme(ST.infScope, ST.perInf, 'pv');
  app().innerHTML = `<section class="vista">
    <div class="hero no-print"><div><div class="eyebrow">Reportes para producción</div><h1>Informes <span>imprimibles</span></h1><p class="sub">Elegí el alcance y el período; la vista previa es lo que sale impreso en A4.</p></div>
      <div class="hero-acc">${btnGlosario()}<button class="btn pri" id="btnImprimir">🖨️ Imprimir o guardar PDF</button></div></div>
    <div class="inf-ctrl no-print"><div class="seg" id="segScope">${ALCANCES.map(x => `<button data-s="${x.id}" class="${x.id === ST.infScope ? 'on' : ''}"><span>${x.e}</span>${x.n}</button>`).join('')}</div>
      <div class="seg" id="segInf">${PER_INF.map(x => `<button data-per="${x.id}" class="${x.id === ST.perInf ? 'on' : ''}"><span>${x.e}</span>${x.n}</button>`).join('')}</div></div>
    <div id="inf">${r.html}</div></section>`;
  $('segScope').querySelectorAll('button').forEach(b => { b.onclick = () => { ST.infScope = b.dataset.s; vistaInforme(); }; });
  $('segInf').querySelectorAll('button').forEach(b => { b.onclick = () => { ST.perInf = b.dataset.per; vistaInforme(); }; });
  requestAnimationFrame(() => { moverPill($('segScope')); moverPill($('segInf')); });
  $('btnImprimir').onclick = () => imprimir(ST.infScope, ST.perInf);
  ST.cvEl = $('inf').querySelector('.informe');
  r.dibujar();
  ST.cvEl = null;
}

function vistaSinDatos() {
  const c = conexion();
  app().innerHTML = `<section class="vista"><div class="hero"><div><div class="eyebrow">Primer uso</div><h1>Conectar con la <span>planilla</span></h1><p class="sub">Pegá la URL /exec de la aplicación web de Apps Script.</p></div></div>
    <div class="card"><form class="form" id="formCx0"><label class="f w2">URL /exec<input id="cUrl0" type="url" value="${esc(c.url || '')}" required></label><label class="f">Clave<input id="cKey0" type="password" value="${esc(c.key || '')}"></label><div class="full acciones" style="margin-top:0"><button class="btn pri" type="submit">🔌 Conectar</button></div></form></div></section>`;
  $('formCx0').onsubmit = async e => { e.preventDefault(); LS.set('ic_url', $('cUrl0').value.trim()); LS.set('ic_key', $('cKey0').value.trim()); await cargar(true); };
}

function vistaRestringida(v) {
  app().innerHTML = `<section class="vista login-wrap"><div class="card login">
    <span class="logo-tile"><img src="img/logo-cmp.png" alt=""></span>
    <div class="eyebrow">Acceso con usuario</div><h2>${ICO.candado} ${v === 'informe' ? 'Informes' : 'Movimientos'}</h2>
    <p class="sub">Esta sección está disponible para operadores, Responsable de Compras y administradores. Ingresá con tu usuario para verla.</p>
    <a class="btn pri" href="#/admin">Ingresar</a></div></section>`;
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
  if (!ST.modelo) { if (!conexion().url) vistaSinDatos(); else esqueleto(); return; }
  const v = ST.vista;
  if (v === 'resumen') vistaResumen();
  else if (INSUMOS[v]) vistaInsumo(v);
  else if ((v === 'informe' || v === 'movimientos') && !verReportes()) vistaRestringida(v);
  else if (v === 'informe') vistaInforme();
  else if (v === 'movimientos') vistaMovimientos();
  else if (v === 'admin') vistaAdmin();
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
  $('btnRefrescar').classList.add('girando');
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
    $('btnRefrescar').classList.remove('girando');
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
  $('btnTema').innerHTML = icoTema(); $('btnRefrescar').innerHTML = ICO.refrescar;
  $('btnTema').onclick = alternarTema;
  $('btnRefrescar').onclick = () => cargar(true);
  $('btnSesion').onclick = () => { if (sesion()) ST.admSec = 'cuenta'; location.hash = '#/admin'; if (ST.vista === 'admin') render(); };
  document.addEventListener('click', e => {
    if (document.body.classList.contains('modo-ayuda') && !e.target.closest('#btnModoAyuda, #pop, .top, .bottom-nav, dialog')) {
      const z = e.target.closest('[data-ak]');
      if (z) { e.preventDefault(); e.stopPropagation(); ST.akEl = z; ayudaEn(z); return; }
    }
    const a = e.target.closest('[data-ayuda]');
    if (a) { e.preventDefault(); e.stopPropagation(); if ($('pop').classList.contains('on') && ST.ayudaAct === a) { cerrarAyuda(); ST.ayudaAct = null; } else { ST.ayudaAct = a; abrirAyuda(a); } return; }
    const g = e.target.closest('[data-glosario]');
    if (g) { e.preventDefault(); abrirGlosario(); return; }
    const p = e.target.closest('[data-imprimir]');
    if (p) { e.preventDefault(); const sc = p.dataset.imprimir; imprimir(sc, sc === 'general' ? (ST.perInf || 'u30') : ST.per); return; }
    if (!e.target.closest('#pop')) cerrarAyuda();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { cerrarAyuda(); if (document.body.classList.contains('modo-ayuda')) alternarModoAyuda(false); } });
  const hoverFino = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  let tCierre = null;
  document.addEventListener('mouseover', e => {
    if (!hoverFino) return;
    if (document.body.classList.contains('modo-ayuda')) {
      const z = e.target.closest('[data-ak]');
      if (z && z !== ST.akEl) { ST.akEl = z; ayudaEn(z); }
      return;
    }
    const b = e.target.closest('.ayuda-btn');
    if (b) { clearTimeout(tCierre); ST.ayudaAct = b; abrirAyuda(b); return; }
    if (e.target.closest('#pop')) { clearTimeout(tCierre); return; }
    if ($('pop').classList.contains('on') && ST.ayudaAct) { clearTimeout(tCierre); tCierre = setTimeout(() => { cerrarAyuda(); ST.ayudaAct = null; }, 350); }
  });
  $('btnModoAyuda').onclick = () => alternarModoAyuda();
  $('btnModoAyuda').innerHTML = ICO.ayuda + '<span>Ayuda</span>';
  $('detCerrar').onclick = () => $('dlgDetalle').close();
  $('dlgDetalle').addEventListener('click', e => { if (e.target === $('dlgDetalle')) $('dlgDetalle').close(); });
  window.addEventListener('scroll', () => { cerrarAyuda(); ST.akEl = null; document.querySelectorAll('.ak-on').forEach(x => x.classList.remove('ak-on')); }, { passive: true });
  $('glosCerrar').onclick = () => $('dlgGlosario').close();
  $('dlgGlosario').addEventListener('click', e => { if (e.target === $('dlgGlosario')) $('dlgGlosario').close(); });
  window.addEventListener('afterprint', finImpresion);
  window.onSesionVencida = () => { pintarSesion(); toast('La sesión venció: volvé a ingresar', 'warn'); };
  pintarSesion();
  setInterval(() => { if (!sesion() && $('btnSesion').querySelector('span') && $('btnSesion').querySelector('span').textContent !== 'Ingresar') { pintarSesion(); if (ST.vista === 'admin') render(); } }, 60000);
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
