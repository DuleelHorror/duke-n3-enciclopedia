/* Enciclopedia del megamod: el "libro". Lee window.ENC (datos.js, GENERADO por genera_enciclopedia.py).
   Rutas (en el #, asi funciona abriendo index.html sin servidor y servida como web estatica):
     #             portada          #indice           indice de capitulos
     #c/<cap>/<p>  lista de un capitulo (pliego p)    #e/<id>  ficha de una entrada     #b/<texto>  busqueda
   Las FORMAS DE APARECER de un enemigo (tumbado, enterrado, agachado...) van dentro de su ficha (e.formas); su ruta
   vieja #e/<id de la forma> lleva a la ficha que la agrupa (D.alias).
   Movil: una sola pagina, menu de capitulos plegado en un boton, barra de abajo para pasar pagina y deslizar el dedo. */
(function () {
  'use strict';
  var D = window.ENC;
  var E = D.entradas;
  var ALIAS = D.alias || {};
  var libro = document.getElementById('libro');
  var nav = document.getElementById('nav');
  var q = document.getElementById('q');
  var CAP = {};
  D.capitulos.forEach(function (c) { CAP[c.id] = c; });
  var ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  var POR_PAGINA = 11;                       // entradas por pagina en las listas
  var ESTADO = { visto: 'Visto por el usuario', prueba: 'En prueba por el usuario', sin_ver: 'Sin ver por el usuario' };
  var actual = null;                        // ruta mostrada
  var maxVida = 1;
  Object.keys(E).forEach(function (k) { if (E[k].vida > maxVida) maxVida = E[k].vida; });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function n3(n) { return ('00' + n).slice(-3); }
  function cifra(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function idsDe(c) { var r = []; c.grupos.forEach(function (g) { r = r.concat(g.entradas); }); return r; }
  function corto(j) { return String(j || '').replace(/\s*\(.*\)\s*$/, ''); }

  // ---------------------------------------------------------------- piezas comunes
  function pagina(lado, html, folio, flechas) {
    return '<section class="pagina ' + lado + '"><div class="marco"></div>' +
      '<i class="esq a"></i><i class="esq b"></i><i class="esq c"></i><i class="esq d"></i>' +
      '<div class="contenido">' + html + '</div>' + (flechas || '') +
      (folio ? '<div class="folio">' + esc(folio) + '</div>' : '') + '</section>';
  }
  function pliego(izq, der) { return '<div class="pliego">' + izq + der + '</div>'; }
  function flecha(href, txt, titulo) {
    return href ? '<a class="flecha" href="' + href + '" title="' + esc(titulo || '') + '">' + txt + '</a>'
      : '<span class="flecha no">' + txt + '</span>';
  }
  function img(e, maxW, maxH, clase) {
    if (!e.img) return '<span class="silueta">?</span>';
    var s = Math.max(1, Math.min(8, Math.floor(Math.min(maxW / e.w, maxH / e.h))));
    if (e.w > maxW || e.h > maxH) s = Math.min(maxW / e.w, maxH / e.h);
    return '<img class="' + (clase || '') + '" src="' + esc(e.img) + '" width="' + Math.round(e.w * s) +
      '" height="' + Math.round(e.h * s) + '" alt="' + esc(e.nombre) + '" loading="lazy">';
  }
  function item(id) {
    var e = E[id];
    var oculto = !e.registrado;
    return '<a class="item' + (oculto ? ' oculto' : '') + '" href="#e/' + encodeURIComponent(id) + '">' +
      '<span class="n">' + n3(e.num) + '</span><span class="mini">' + (e.img ? '<img src="' + esc(e.img) +
      '" alt="" loading="lazy">' : '<span class="silueta">?</span>') + '</span>' +
      '<span class="nm">' + esc(e.nombre) + (oculto ? ' <i>(por llegar)</i>' : '<span class="punto ' + e.estado +
      '" title="' + ESTADO[e.estado] + '"></span>') + '<span class="jg">' + esc(e.clase || e.tipo_txt) + ' · ' +
      esc(corto(e.juego)) + '</span></span></a>';
  }

  // ---------------------------------------------------------------- vistas
  function vPortada() {
    var total = 0, reg = 0;
    D.capitulos.forEach(function (c) { total += c.total; reg += c.registrados; });
    // emblema: un jefe con dibujo (siempre el mismo: el de numero mas bajo)
    var jefe = idsDe(CAP.jefes || { grupos: [] }).map(function (i) { return E[i]; }).filter(function (e) { return e.img; })[0];
    return '<div class="portada" id="tapa"><i class="esq a"></i><i class="esq b"></i><i class="esq c"></i><i class="esq d"></i>' +
      '<div class="dentro"><div class="pre">Duke Nukem 3D · Megamod</div><h1>Enciclopedia</h1>' +
      '<div class="sub">Bestiario y armería de todos los mundos</div>' +
      '<div class="emblema">' + (jefe ? img(jefe, 150, 150) : '') + '</div>' +
      '<div class="cifras">' + cifra(reg) + ' entradas registradas en ' + D.capitulos.length + ' capítulos</div>' +
      '<a class="boton" href="#indice">Abrir el libro</a></div>' +
      '<div class="pie">Edición del ' + esc(D.generado) + '</div></div>';
  }

  function vIndice() {
    var lis = D.capitulos.map(function (c, k) {
      return '<li><a href="#c/' + c.id + '/0"><span class="rom">' + ROMANOS[k] + '.</span><span class="tt">' + esc(c.titulo) +
        '</span><span class="cnt"><b>' + c.registrados + '</b>/' + c.total + '</span><span class="sb">' + esc(c.sub) +
        '</span></a></li>';
    }).join('');
    var izq = '<h1 class="titulo-pag">Índice</h1><div class="subtitulo">Capítulos del libro</div><div class="filete"></div>' +
      '<ul class="indice">' + lis + '</ul>';
    var tot = { total: 0, reg: 0, vistos: 0 };
    D.capitulos.forEach(function (c) { tot.total += c.total; tot.reg += c.registrados; tot.vistos += c.vistos; });
    var porJuego = {};
    D.orden.forEach(function (id) { var e = E[id]; if (e.cap === 'enemigos' || e.cap === 'jefes' || e.cap === 'aliados' || e.cap === 'civiles') porJuego[corto(e.juego)] = (porJuego[corto(e.juego)] || 0) + 1; });
    var filas = Object.keys(porJuego).map(function (j) { return '<tr><td>' + esc(j) + '</td><td>' + porJuego[j] + '</td></tr>'; }).join('');
    var ult = D.orden.map(function (i) { return E[i]; }).filter(function (e) { return e.registrado && e.img; })
      .sort(function (a, b) { return b.num - a.num; }).slice(0, 6)
      .map(function (e) { return '<a href="#e/' + encodeURIComponent(e.id) + '"><span class="mini">' + img(e, 46, 46) + '</span>' + n3(e.num) + '</a>'; }).join('');
    var der = '<h1 class="titulo-pag">Registro</h1><div class="subtitulo">Lo que guarda este libro</div><div class="filete"></div>' +
      '<div class="texto"><p>Este libro se escribe solo: cada vez que se porta al mod un enemigo, un aliado, un arma o un vehículo ' +
      'y se regenera, aparece aquí con su número, su dibujo y sus datos sacados del propio mod.</p></div>' +
      '<h2 class="seccion">Cifras</h2><table class="tabla-resumen"><tr><td>Entradas registradas</td><td>' + tot.reg + ' / ' + tot.total +
      '</td></tr><tr><td>Vistas por el usuario en el juego</td><td>' + tot.vistos + '</td></tr>' + filas + '</table>' +
      '<h2 class="seccion">Leyenda</h2><div class="leyenda">' +
      '<span><i class="punto visto"></i>' + ESTADO.visto + '</span><span><i class="punto prueba"></i>' + ESTADO.prueba +
      '</span><span><i class="punto sin_ver"></i>' + ESTADO.sin_ver + ' (probado por registro)</span>' +
      '<span><span class="silueta" style="font-size:20px">?</span> Silueta: por llegar</span></div>' +
      '<h2 class="seccion">Últimas incorporaciones</h2><div class="ultimos">' + ult + '</div>';
    return pliego(pagina('izq', izq, 'i', '<div class="flechas">' + flecha('#', '◀', 'Portada') + '</div>'),
      pagina('der', der, 'ii', '<div class="flechas">' + flecha('#c/' + D.capitulos[0].id + '/0', '▶', 'Siguiente') + '</div>'));
  }

  function bloques(ids, titulos) {
    // reparte los ids en paginas de POR_PAGINA, con el titulo de grupo al cambiar
    var pags = [], cur = [], n = 0, ultimo = null;
    ids.forEach(function (id) {
      var g = titulos ? titulos[id] : null;
      var cab = (g && g !== ultimo) ? 1 : 0;
      if (n + 1 + cab * 0.6 > POR_PAGINA && cur.length) { pags.push(cur); cur = []; n = 0; ultimo = null; cab = g ? 1 : 0; }
      if (cab || (g && ultimo === null)) { cur.push('<div class="grupo">' + esc(g) + '</div>'); n += 0.6; }
      ultimo = g;
      cur.push(item(id)); n += 1;
    });
    if (cur.length) pags.push(cur);
    return pags;
  }

  function vCapitulo(cid, p) {
    var c = CAP[cid];
    if (!c) return null;
    var titulos = {};
    c.grupos.forEach(function (g) { g.entradas.forEach(function (i) { titulos[i] = g.titulo || null; }); });
    var pags = bloques(idsDe(c), titulos);
    var nPliegos = Math.max(1, Math.ceil((pags.length + 1) / 2));
    p = Math.max(0, Math.min(nPliegos - 1, p | 0));
    // pliego 0: a la izquierda la portadilla del capitulo y la primera pagina de la lista a la derecha
    var k = D.capitulos.indexOf(c);
    var izq, der, i0;
    function contenido(i) { return pags[i] ? '<div class="lista">' + pags[i].join('') + '</div>' : ''; }
    if (p === 0) {
      izq = '<div class="subtitulo" style="margin-top:20px">Capítulo ' + ROMANOS[k] + '</div><h1 class="titulo-pag grande">' +
        esc(c.titulo) + '</h1><div class="filete"></div><p class="nota" style="text-align:center;font-size:18px">' +
        esc(c.sub) + '</p><table class="tabla-resumen" style="margin-top:18px"><tr><td>Registrados</td><td>' + c.registrados +
        ' / ' + c.total + '</td></tr><tr><td>Vistos por el usuario</td><td>' + c.vistos + '</td></tr>' +
        c.grupos.filter(function (g) { return g.titulo; }).map(function (g) {
          return '<tr><td>' + esc(g.titulo) + '</td><td>' + g.entradas.length + '</td></tr>'; }).join('') + '</table>' +
        (c.total === 0 ? '<p class="vacio">Aún no hay nada en este capítulo.</p>' : '');
      der = contenido(0) || '<p class="vacio">Página en blanco: lo que llegue se apuntará aquí.</p>';
      i0 = -1;
    } else {
      i0 = 2 * p - 1;
      izq = contenido(i0);
      der = contenido(i0 + 1);
    }
    var prev = p > 0 ? '#c/' + cid + '/' + (p - 1) : (k > 0 ? '#c/' + D.capitulos[k - 1].id + '/0' : '#indice');
    var next = p < nPliegos - 1 ? '#c/' + cid + '/' + (p + 1) : (k < D.capitulos.length - 1 ? '#c/' + D.capitulos[k + 1].id + '/0' : null);
    var folio = 2 * p + 1;
    return pliego(pagina('izq', izq, String(folio), '<div class="flechas">' + flecha(prev, '◀', 'Anterior') + '</div>'),
      pagina('der', der, String(folio + 1), '<div class="flechas">' + flecha(next, '▶', 'Siguiente') + '</div>'));
  }

  function vEntrada(id) {
    var e = E[id];
    if (!e) return null;
    var pos = D.orden.indexOf(id);
    var prev = pos > 0 ? '#e/' + encodeURIComponent(D.orden[pos - 1]) : '#c/' + e.cap + '/0';
    var next = pos < D.orden.length - 1 ? '#e/' + encodeURIComponent(D.orden[pos + 1]) : null;
    var izq = '<div class="cab-ent"><span class="numero">Nº ' + n3(e.num) + '</span><span class="tipo ' + e.tipo + '">' +
      esc(e.tipo_txt) + '</span></div><h1 class="nombre">' + esc(e.nombre) + '</h1><div class="juego">' + esc(e.juego) +
      (e.clase ? ' · ' + esc(e.clase) : '') + '</div>' +
      '<div class="retrato' + (e.registrado ? '' : ' oculto') + '"><div class="ventana">' + img(e, 360, 300) + '</div></div>' +
      '<div class="claves"><span class="codigo">' + esc(e.clave) + '</span><span class="codigo">Ref. ' + esc(e.id) + '</span>' +
      (e.anim ? '<span class="codigo">Animación: ' + esc(e.anim) + (e.fotogramas > 1 ? ' · ' + e.fotogramas + ' fotogramas' : '') + '</span>' : '') +
      '</div><span class="sello ' + e.estado + '">' + (e.registrado ? ESTADO[e.estado] : 'Por llegar') + '</span>';
    var filas = '';
    if (e.vida != null) {
      var pct = Math.max(3, Math.round(100 * Math.log(1 + e.vida) / Math.log(1 + maxVida)));
      filas += '<tr><th>Vida</th><td><span class="vida">' + cifra(e.vida) + '</span><span class="barra"><i style="width:' + pct + '%"></i></span></td></tr>';
    }
    if (e.tam) filas += '<tr><th>Tamaño</th><td>' + esc(e.tam) + '</td></tr>';
    if (e.resist) {
      var deb = e.resist.filter(function (r) { return r[1] > 1; }), fue = e.resist.filter(function (r) { return r[1] < 1; });
      var f = function (r) { return '<span class="etiq">' + esc(r[0]) + ' ×' + String(r[1]).replace('.', ',') + '</span>'; };
      filas += '<tr><th>Fuerte contra</th><td class="fuerte">' + (fue.length ? fue.map(f).join('') : '—') + '</td></tr>';
      filas += '<tr><th>Débil contra</th><td class="debil">' + (deb.length ? deb.map(f).join('') : '—') + '</td></tr>';
    }
    if (e.ataques) filas += '<tr><th>Disparos</th><td>' + e.ataques.map(function (a) { return '<span class="etiq">' + esc(a) + '</span>'; }).join('') + '</td></tr>';
    if (e.sonidos) filas += '<tr><th>Sonidos</th><td>' + e.sonidos.map(function (a) { return '<span class="etiq">' + esc(a) + '</span>'; }).join('') + '</td></tr>';
    if (e.donde) filas += '<tr><th>Dónde verlo</th><td>' + esc(e.donde) + '</td></tr>';
    var der = '<h2 class="seccion">Datos</h2><table class="stats">' + filas + '</table>';
    if (e.desc) der += '<h2 class="seccion">Comportamiento</h2><div class="texto">' + e.desc.map(function (d) { return '<p>' + esc(d) + '</p>'; }).join('') + '</div>';
    if (e.notas) der += '<p class="nota">' + esc(e.notas) + '</p>';
    if (e.formas) der += formas(e);
    if (e.familia) der += '<h2 class="seccion">De la misma familia</h2><p class="nota">Otros miembros de la familia «' +
      esc(e.familia.nombre) + '» con vida, ataques o aspecto propios (cada uno con su ficha):</p><div class="lista">' +
      e.familia.ids.filter(function (i) { return E[i]; }).map(item).join('') + '</div>';
    if (e.fidelidad) der += '<h2 class="seccion">Fidelidad</h2><ul class="fid">' + e.fidelidad.map(function (f) {
      return '<li class="' + f[0] + '">' + esc(f[1]) + '</li>'; }).join('') + '</ul>';
    der += '<h2 class="seccion">Estado</h2><p>' + esc(e.estado_txt || ESTADO[e.estado]) + '</p>';
    return pliego(pagina('izq', izq, 'Nº ' + n3(e.num), '<div class="flechas">' + flecha(prev, '◀', 'Anterior') + '</div>'),
      pagina('der', der, CAP[e.cap].titulo, '<div class="flechas"><a class="flecha" href="#c/' + e.cap + '/0" title="Volver al capítulo">≡</a>' +
        flecha(next, '▶', 'Siguiente') + '</div>'));
  }

  function formas(e) {
    // la principal y cada forma de aparecer: miniatura (animada si la tiene), como aparece, que cambia y su nicho
    function fila(f, sit, principal) {
      return '<div class="forma' + (principal ? ' principal' : '') + '"><span class="mini">' + (f.img ? img(f, 64, 64) :
        '<span class="silueta">?</span>') + '</span><div class="fdat"><div class="fsit">' + esc(sit) +
        (principal ? ' <i>(forma principal)</i>' : '') + '</div><div class="fnom">' + esc(f.nombre) + ' · <span class="codigo">' +
        esc(f.clave) + (principal ? '' : ' · Nº ' + n3(f.num) + ' reservado') + '</span></div>' +
        (!principal && f.desc ? '<p>' + f.desc.map(esc).join(' ') + '</p>' : '') +
        (f.tam ? '<p class="fextra">Tamaño: ' + esc(f.tam) + '</p>' : '') +
        '<p class="fextra">' + esc(f.donde) + '</p></div></div>';
    }
    return '<h2 class="seccion" id="formas">Formas de aparecer</h2><p class="nota">El mismo enemigo (' +
      (e.vida != null ? 'misma vida, ' : '') + 'mismos ataques) colocado de ' + (e.formas.length + 1) +
      ' maneras. En el ZooTest cada forma tiene su nicho en la sala de su familia.</p><div class="formas">' +
      fila(e, e.forma_principal || 'Normal', true) + e.formas.map(function (f) { return fila(f, f.sit, false); }).join('') + '</div>';
  }

  function vBusqueda(texto) {
    var t = texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var ids = D.orden.filter(function (id) {
      var e = E[id];
      var h = [e.nombre, e.juego, e.tipo_txt, e.id, e.clave, (e.desc || []).join(' ')].concat((e.formas || []).map(function (f) {
        return [f.nombre, f.clave, f.id, f.sit].join(' '); })).join(' ').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '');
      return t.split(/\s+/).every(function (w) { return h.indexOf(w) >= 0; });
    });
    var pags = bloques(ids, null);
    var cab = '<h1 class="titulo-pag">Búsqueda</h1><div class="subtitulo">«' + esc(texto) + '»: ' + ids.length +
      ' entrada' + (ids.length === 1 ? '' : 's') + '</div><div class="filete"></div>';
    var izq = cab + (pags[0] ? '<div class="lista">' + pags[0].slice(0, POR_PAGINA - 2).join('') + '</div>' : '<p class="vacio">Nada con ese nombre en el libro.</p>');
    var resto = [];
    pags.forEach(function (p) { resto = resto.concat(p); });
    resto = resto.slice(POR_PAGINA - 2, POR_PAGINA * 2 - 2);
    var der = resto.length ? '<div class="lista">' + resto.join('') + '</div>' : '';
    if (ids.length > POR_PAGINA * 2 - 2) der += '<p class="nota">Hay más: afina la búsqueda.</p>';
    return pliego(pagina('izq', izq, 'Búsqueda'), pagina('der', der, ''));
  }

  // ---------------------------------------------------------------- rutas y paso de pagina
  function ruta() { return decodeURIComponent((location.hash || '#').slice(1)); }
  function posicion(r) {           // para saber si se pasa hacia delante o hacia atras
    if (!r) return -2;
    if (r === 'indice') return -1;
    var m = r.match(/^c\/([^/]+)\/?(\d*)/);
    if (m) { var k = D.capitulos.findIndex(function (c) { return c.id === m[1]; }); return k * 100000 + (+m[2] || 0); }
    m = r.match(/^e\/(.+)/);
    if (m && E[m[1]]) { var e = E[m[1]]; return D.capitulos.findIndex(function (c) { return c.id === e.cap; }) * 100000 + 500 + D.orden.indexOf(m[1]); }
    return 9e9;
  }
  function vista(r) {
    var m;
    if (!r) return vPortada();
    if (r === 'indice') return vIndice();
    if ((m = r.match(/^c\/([^/]+)\/?(\d*)/))) return vCapitulo(m[1], +m[2] || 0);
    if ((m = r.match(/^e\/(.+)/))) return vEntrada(m[1]);
    if ((m = r.match(/^b\/(.*)/))) return vBusqueda(m[1]);
    return null;
  }
  function marcaNav(r) {
    var cap = null, m;
    if ((m = r.match(/^c\/([^/]+)/))) cap = m[1];
    if ((m = r.match(/^e\/(.+)/)) && E[m[1]]) cap = E[m[1]].cap;
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      a.classList.toggle('activo', a.getAttribute('data-cap') === cap || (r === 'indice' && a.getAttribute('data-cap') === 'indice'));
    });
  }
  function estrecho() { return window.matchMedia('(max-width: 900px)').matches; }

  function muestra() {
    var r = ruta(), ma = r.match(/^e\/(.+)/);
    if (ma && !E[ma[1]] && ALIAS[ma[1]]) { location.replace('#e/' + encodeURIComponent(ALIAS[ma[1]])); return; }
    cierraMenu();
    var html = vista(r);
    if (html === null) { location.replace('#indice'); return; }
    var antes = actual;
    actual = r;
    marcaNav(r);
    var viejoPliego = libro.querySelector('.pliego');
    var tapa = libro.querySelector('#tapa');
    if (tapa && r && !estrecho()) {                 // se abre la tapa
      tapa.classList.add('abre');
      setTimeout(function () { libro.innerHTML = html; libro.firstChild.classList.add('aparece'); pasos(); }, 650);
      return;
    }
    var nuevo = document.createElement('div');
    nuevo.innerHTML = html;
    var nuevoPliego = nuevo.querySelector('.pliego');
    if (!viejoPliego || !nuevoPliego || estrecho() || antes === null) {
      libro.innerHTML = html;
      if (libro.firstChild) libro.firstChild.classList.add('aparece');
      window.scrollTo(0, 0);
      pasos();
      return;
    }
    var adelante = posicion(r) >= posicion(antes);
    var vIzq = viejoPliego.querySelector('.pagina.izq'), vDer = viejoPliego.querySelector('.pagina.der');
    var nIzq = nuevoPliego.querySelector('.pagina.izq'), nDer = nuevoPliego.querySelector('.pagina.der');
    var hoja = document.createElement('div');
    hoja.className = 'hoja ' + (adelante ? 'adelante' : 'atras');
    var cara = document.createElement('div'); cara.className = 'cara';
    var dorso = document.createElement('div'); dorso.className = 'cara dorso';
    cara.appendChild((adelante ? vDer : vIzq).cloneNode(true));
    dorso.appendChild((adelante ? nIzq : nDer).cloneNode(true));
    hoja.appendChild(cara); hoja.appendChild(dorso);
    var tapaFija = document.createElement('div');       // la pagina que no se mueve sigue viendose la vieja
    tapaFija.className = 'tapa ' + (adelante ? 'izq' : 'der');
    tapaFija.appendChild((adelante ? vIzq : vDer).cloneNode(true));
    libro.innerHTML = '';
    libro.appendChild(nuevoPliego);
    nuevoPliego.appendChild(tapaFija);
    nuevoPliego.appendChild(hoja);
    var fin = function () { if (tapaFija.parentNode) tapaFija.remove(); if (hoja.parentNode) hoja.remove(); };
    hoja.addEventListener('animationend', fin);
    setTimeout(fin, 1200);
    pasos();
  }

  // ---------------------------------------------------------------- pasar pagina: flechas, barra de abajo y dedo
  var bAnt = document.getElementById('ant'), bSig = document.getElementById('sig');
  function destinos() {
    if (!actual) return { ant: null, sig: '#indice' };          // portada
    var a = libro.querySelector('.pliego > .pagina.izq .flechas a.flecha');
    var s = libro.querySelector('.pliego > .pagina.der .flechas a.flecha:last-child');
    return { ant: a ? a.getAttribute('href') : null, sig: s ? s.getAttribute('href') : null };
  }
  function pon(b, href) {
    if (!b) return;
    if (href) { b.setAttribute('href', href); b.classList.remove('no'); b.removeAttribute('aria-disabled'); }
    else { b.removeAttribute('href'); b.classList.add('no'); b.setAttribute('aria-disabled', 'true'); }
  }
  function pasos() { var d = destinos(); pon(bAnt, d.ant); pon(bSig, d.sig); }
  function ve(href) { if (href) location.hash = href; }
  var toque = null;
  libro.addEventListener('touchstart', function (ev) {
    if (ev.touches.length !== 1) { toque = null; return; }
    toque = { x: ev.touches[0].clientX, y: ev.touches[0].clientY, t: Date.now() };
  }, { passive: true });
  libro.addEventListener('touchend', function (ev) {
    if (!toque || !ev.changedTouches.length) return;
    var dx = ev.changedTouches[0].clientX - toque.x, dy = ev.changedTouches[0].clientY - toque.y;
    var rapido = Date.now() - toque.t < 700;
    toque = null;
    if (!rapido || Math.abs(dx) < 60 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;   // es scroll, no deslizar
    var d = destinos();
    ve(dx < 0 ? d.sig : d.ant);
  }, { passive: true });

  // ---------------------------------------------------------------- menu de capitulos plegado (pantallas estrechas)
  var bMenu = document.getElementById('menu');
  function cierraMenu() { document.body.classList.remove('menu-abierto'); if (bMenu) bMenu.setAttribute('aria-expanded', 'false'); }
  if (bMenu) bMenu.addEventListener('click', function () {
    var abierto = document.body.classList.toggle('menu-abierto');
    bMenu.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });

  // ---------------------------------------------------------------- barra, teclado y buscador
  nav.innerHTML = '<a href="#" data-cap="portada">Portada</a><a href="#indice" data-cap="indice">Índice</a>' +
    D.capitulos.map(function (c) { return '<a href="#c/' + c.id + '/0" data-cap="' + c.id + '">' + esc(c.titulo) + '</a>'; }).join('');
  var tq = null;
  q.addEventListener('input', function () {
    clearTimeout(tq);
    tq = setTimeout(function () { var v = q.value.trim(); location.hash = v ? '#b/' + encodeURIComponent(v) : '#indice'; }, 250);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.target === q) return;
    var d = destinos(), h = null;
    if (ev.key === 'ArrowRight') h = d.sig;
    if (ev.key === 'ArrowLeft') h = d.ant;
    if (ev.key === 'Escape') { cierraMenu(); location.hash = '#indice'; return; }
    if (h) { location.hash = h; ev.preventDefault(); }
  });
  window.addEventListener('hashchange', muestra);
  muestra();
})();
