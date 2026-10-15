/* ============ Cielo de fondo: estrellas, estrellas fugaces y pétalos ============ */
(function () {
  var lienzo = document.getElementById('lienzo');
  var ctx = lienzo.getContext('2d');
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, tiempo = 0, desplazo = 0, proxima = 240;

  var colores = ['234,163,184', '217,82,122', '235,213,169', '248,236,240'];
  var estrellas = [];
  var petalos = [];
  var corazones = [];
  var fugaces = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function ajustar() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    lienzo.width = Math.round(W * dpr);
    lienzo.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    crearEstrellas();
    if (reducir) pintar();
  }

  function crearEstrellas() {
    var n = Math.min(260, Math.round((W * H) / 3500));
    var tonos = ['248,236,240', '248,236,240', '235,213,169', '234,163,184'];
    estrellas = [];
    for (var i = 0; i < n; i++) {
      var z = rand(0.2, 1);
      estrellas.push({
        x: rand(0, W), y: rand(0, H), z: z,
        r: rand(0.4, 1.5) * (0.6 + z * 0.6),
        f: rand(0, 6.28), v: rand(0.01, 0.035),
        c: tonos[Math.floor(Math.random() * tonos.length)]
      });
    }
  }

  function nuevoPetalo(desdeArriba) {
    return {
      x: rand(0, W),
      y: desdeArriba ? rand(-60, -10) : rand(0, H),
      s: rand(5, 10),
      vy: rand(0.3, 0.8),
      deriva: rand(0.4, 1.2),
      fase: rand(0, 6.28),
      giro: rand(-0.02, 0.02),
      ang: rand(0, 6.28),
      vuelco: rand(0.012, 0.03),
      c: colores[Math.floor(Math.random() * 3)],
      a: rand(0.25, 0.55)
    };
  }

  function pintarEstrellas() {
    for (var i = 0; i < estrellas.length; i++) {
      var s = estrellas[i];
      var yy = (((s.y - desplazo * s.z * 0.25) % H) + H) % H;
      var a = reducir ? 0.75 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tiempo * s.v + s.f));
      ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(s.x, yy, s.r, 0, 6.2832);
      ctx.fill();
    }
  }

  function pintar() {
    ctx.clearRect(0, 0, W, H);
    pintarEstrellas();
  }

  function dibujarPetalo(p) {
    var esc = Math.max(Math.abs(Math.cos(tiempo * p.vuelco + p.fase)), 0.25);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.ang);
    ctx.scale(esc, 1);
    ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
    ctx.beginPath();
    ctx.moveTo(0, -p.s);
    ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.8, p.s * 0.5, 0, p.s);
    ctx.bezierCurveTo(-p.s * 0.8, p.s * 0.5, -p.s * 0.9, -p.s * 0.6, 0, -p.s);
    ctx.fill();
    ctx.restore();
  }

  function dibujarCorazon(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.75, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.fill();
  }

  function lanzarFugaz() {
    var desdeIzq = Math.random() < 0.5;
    fugaces.push({
      x: desdeIzq ? rand(0, W * 0.5) : rand(W * 0.5, W),
      y: rand(0, H * 0.35),
      vx: (desdeIzq ? 1 : -1) * rand(7, 11),
      vy: rand(3, 5),
      vida: 1
    });
  }

  function cuadro() {
    var i, p, h, f, g;

    /* Mientras el universo está abierto, este cielo descansa. */
    if (document.documentElement.getAttribute('data-universo')) {
      window.requestAnimationFrame(cuadro);
      return;
    }

    tiempo += 1;
    ctx.clearRect(0, 0, W, H);
    pintarEstrellas();

    if (tiempo >= proxima) {
      lanzarFugaz();
      proxima = tiempo + rand(320, 640);
    }

    for (i = fugaces.length - 1; i >= 0; i--) {
      f = fugaces[i];
      f.x += f.vx;
      f.y += f.vy;
      f.vida -= 0.014;
      if (f.vida <= 0 || f.x < -80 || f.x > W + 80 || f.y > H + 80) { fugaces.splice(i, 1); continue; }
      g = ctx.createLinearGradient(f.x, f.y, f.x - f.vx * 9, f.y - f.vy * 9);
      g.addColorStop(0, 'rgba(255,244,234,' + (0.95 * f.vida).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(234,163,184,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x - f.vx * 9, f.y - f.vy * 9);
      ctx.stroke();
    }

    for (i = 0; i < petalos.length; i++) {
      p = petalos[i];
      p.y += p.vy;
      p.x += Math.sin(tiempo * 0.01 + p.fase) * p.deriva * 0.6;
      p.ang += p.giro;
      if (p.y > H + 24) { petalos[i] = nuevoPetalo(true); continue; }
      dibujarPetalo(p);
    }

    for (i = corazones.length - 1; i >= 0; i--) {
      h = corazones[i];
      h.x += h.vx;
      h.y += h.vy;
      h.vy += 0.045;
      h.vx *= 0.995;
      h.vida -= 0.011;
      if (h.vida <= 0) { corazones.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(' + h.c + ',' + h.vida.toFixed(3) + ')';
      dibujarCorazon(h.x, h.y, h.s);
    }

    window.requestAnimationFrame(cuadro);
  }

  function explotar(cx, cy) {
    if (reducir) return;
    for (var i = 0; i < 38; i++) {
      var ang = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      var vel = rand(2, 6.5);
      corazones.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel,
        s: rand(10, 24),
        vida: 1,
        c: colores[Math.floor(Math.random() * 2)]
      });
    }
  }

  window.addEventListener('resize', ajustar);
  window.addEventListener('scroll', function () {
    desplazo = window.pageYOffset || 0;
    if (reducir) pintar();
  }, { passive: true });

  ajustar();

  if (!reducir) {
    var cantidad = W < 600 ? 8 : 16;
    for (var k = 0; k < cantidad; k++) petalos.push(nuevoPetalo(false));
    cuadro();
  }

  window.__explotar = explotar;
})();

/* ============ Galería: fotos de la 1 a la 6 ============ */
(function () {
  var visor = document.getElementById('g-visor');
  var diapos = visor.querySelectorAll('.g-diapo');
  var minis = document.getElementById('g-miniaturas').children;
  var progreso = document.getElementById('g-progreso');
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var actual = -1, reloj = 0, inicioX = null;

  function mostrar(i, conCorazones) {
    i = (i + diapos.length) % diapos.length;
    if (i === actual) return;
    if (actual >= 0) diapos[actual].classList.remove('activa');
    diapos[i].classList.add('activa');
    for (var k = 0; k < minis.length; k++) minis[k].setAttribute('aria-current', k === i ? 'true' : 'false');
    progreso.classList.remove('corre');
    void progreso.offsetWidth;
    if (!reducir) progreso.classList.add('corre');
    actual = i;
    if (conCorazones && window.__explotar) {
      var r = visor.getBoundingClientRect();
      window.__explotar(r.left + r.width / 2, r.top + r.height * 0.55);
    }
  }

  function automatico() {
    window.clearInterval(reloj);
    if (!reducir) reloj = window.setInterval(function () { mostrar(actual + 1); }, 4500);
  }

  function ir(i) { mostrar(i, true); automatico(); }

  document.getElementById('g-prev').addEventListener('click', function () { ir(actual - 1); });
  document.getElementById('g-sig').addEventListener('click', function () { ir(actual + 1); });
  Array.prototype.forEach.call(minis, function (b, k) {
    b.addEventListener('click', function () { ir(k); });
  });

  /* Deslizar con el dedo */
  visor.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    inicioX = e.clientX;
  });
  window.addEventListener('pointerup', function (e) {
    if (inicioX === null) return;
    var dx = e.clientX - inicioX;
    inicioX = null;
    if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
  });
  visor.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') ir(actual - 1);
    if (e.key === 'ArrowRight') ir(actual + 1);
  });

  mostrar(0);
  automatico();
})();

/* ============ El universo: viaje, galaxia, constelación y frases ============ */
(function () {
  var capa = document.getElementById('universo');
  var lienzo = document.getElementById('cosmos');
  var ctx = lienzo.getContext('2d');
  var cerrar = document.getElementById('u-cerrar');
  var fraseEl = document.getElementById('u-frase');
  var puntosEl = document.getElementById('u-puntos');
  var pagina = document.querySelector('.pagina');
  var abridores = document.querySelectorAll('[data-abrir-universo]');
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var frases = [
    'Entre todas las estrellas, la que más brilla para mí eres tú.',
    'Contigo hasta un día cualquiera se vuelve bonito.',
    'Verte sonreír es de las cosas más bonitas que me pasan.',
    'Mi fresita hermosa, qué suerte tengo de que existas.',
    'A tu lado, el mundo se siente tranquilo y bonito.',
    'Me encanta quién soy cuando estoy contigo.',
    'Eres lo primero en lo que pienso al despertar.',
    'Gracias por abrazar mi corazón con tanta ternura.',
    'Si pudiera elegir un lugar donde quedarme, sería a tu lado.',
    'Eres mi casualidad más bonita, mi fresita.',
    'Esto es para ti, con todo mi cariño.'
  ];

  var W = 0, H = 0, maxD = 0, R = 0;
  var raf = 0, t0 = 0, idx = 0, temporizador = 0, esperaFrase = 0, cierre = 0;
  var ultimoFoco = null, px = 0.5, py = 0.5, proxFugaz = 0;
  var estrellas = [], galaxia = [], fugaces = [], corazon = [], planetas = [];
  /* luz, color base y sombra de cada planeta */
  var tiposPlaneta = [
    { c: ['255,196,176', '214,58,72', '64,8,18'], anillo: false, luna: true },
    { c: ['255,238,204', '222,168,96', '78,38,18'], anillo: true, luna: false },
    { c: ['255,224,234', '232,128,160', '86,20,48'], anillo: false, luna: false },
    { c: ['226,236,255', '122,150,222', '24,28,70'], anillo: false, luna: false },
    { c: ['255,214,190', '196,92,60', '60,16,10'], anillo: true, luna: false }
  ];
  var tonos = ['248,236,240', '248,236,240', '235,213,169', '234,163,184'];
  var tonosGalaxia = ['234,163,184', '217,82,122', '235,213,169', '170,120,220', '248,236,240'];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function crear() {
    var i, u, r, arm, n, k, t, tam;
    maxD = Math.hypot(W, H) / 2;
    n = W < 600 ? 300 : 560;
    estrellas = [];
    for (i = 0; i < n; i++) {
      estrellas.push({
        a: rand(0, 6.2832), d: rand(0, maxD), v: rand(0.25, 1),
        r: rand(0.5, 1.4), f: rand(0, 6.28),
        c: tonos[Math.floor(Math.random() * tonos.length)]
      });
    }

    R = Math.min(W * 0.95, H * 0.78);
    n = W < 600 ? 1000 : 1800;
    galaxia = [];
    for (i = 0; i < n; i++) {
      arm = i % 3;
      u = Math.pow(Math.random(), 1.6);
      r = u * R;
      galaxia.push({
        r: r,
        th: arm * 2.0944 + u * 5.4 + rand(-0.4, 0.4) * (1 - u * 0.6),
        s: rand(0.6, 1.8),
        a: rand(0.25, 0.8) * (1 - u * 0.45),
        c: tonosGalaxia[Math.floor(Math.random() * tonosGalaxia.length)]
      });
    }

    var base = Math.min(W, H);
    planetas = tiposPlaneta.map(function (tp, j) {
      return {
        orb: R * (0.4 + j * 0.17),
        vel: 0.00016 / (1 + j * 0.45),
        fase: rand(0, 6.2832),
        r: base * [0.034, 0.05, 0.026, 0.03, 0.042][j],
        c: tp.c, anillo: tp.anillo, luna: tp.luna,
        incl: rand(-0.35, 0.35)
      };
    });

    n = 24;
    tam = Math.min(W * 0.5, H * 0.34) / 34;
    corazon = [];
    for (k = 0; k < n; k++) {
      t = (k / n) * 6.2832;
      corazon.push({
        x: W / 2 + 16 * Math.pow(Math.sin(t), 3) * tam,
        y: H * 0.27 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * tam
      });
    }
  }

  function ajustar() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    lienzo.width = Math.round(W * dpr);
    lienzo.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    crear();
  }

  function esfera(x, y, r, c, alfa) {
    var g = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.6);
    g.addColorStop(0, 'rgba(' + c[1] + ',' + (0.28 * alfa).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + c[1] + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 6.2832); ctx.fill();
    g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, 'rgba(' + c[0] + ',' + alfa.toFixed(3) + ')');
    g.addColorStop(0.45, 'rgba(' + c[1] + ',' + alfa.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + c[2] + ',' + alfa.toFixed(3) + ')');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }

  function anillo(x, y, r, incl, c, alfa, delante) {
    ctx.strokeStyle = 'rgba(' + c[0] + ',' + (0.6 * alfa).toFixed(3) + ')';
    ctx.lineWidth = Math.max(1, r * 0.22);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 2.05, r * 0.55, incl, delante ? 0 : Math.PI, delante ? Math.PI : 6.2832);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(' + c[1] + ',' + (0.45 * alfa).toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.8, r * 0.1);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 2.5, r * 0.68, incl, delante ? 0 : Math.PI, delante ? Math.PI : 6.2832);
    ctx.stroke();
  }

  var colorLuna = ['250,244,236', '200,190,190', '60,50,60'];

  function planeta(x, y, r, pl, alfa, el) {
    var la = el * 0.0012 + (pl.fase || 0);
    var lx = x + Math.cos(la) * r * 2.4, ly = y + Math.sin(la) * r * 0.9;
    var lunaDetras = pl.luna && Math.sin(la) < 0;
    if (lunaDetras) esfera(lx, ly, r * 0.28, colorLuna, alfa);
    if (pl.anillo) anillo(x, y, r, pl.incl, pl.c, alfa, false);
    esfera(x, y, r, pl.c, alfa);
    if (pl.anillo) anillo(x, y, r, pl.incl, pl.c, alfa, true);
    if (pl.luna && !lunaDetras) esfera(lx, ly, r * 0.28, colorLuna, alfa);
  }

  function cuadro(ahora) {
    var i, s, p, f, g, a, b, cs, sn, x1, y1, largo, alfa, v, mov;
    if (!t0) t0 = ahora;
    var el = ahora - t0;
    ctx.clearRect(0, 0, W, H);

    var warp = reducir ? 0 : Math.max(0, 1 - el / 2200);
    var w = warp * warp;
    var ox = (px - 0.5) * -26, oy = (py - 0.5) * -18;

    /* Galaxia */
    var gx = W / 2 + ox * 0.6, gy = H * 0.62 + oy * 0.6;
    g = ctx.createRadialGradient(gx, gy, 0, gx, gy, R * 0.6);
    g.addColorStop(0, 'rgba(255,236,214,0.32)');
    g.addColorStop(0.25, 'rgba(234,163,184,0.16)');
    g.addColorStop(1, 'rgba(190,30,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    var giro = reducir ? 0 : el * 0.00005;
    for (i = 0; i < galaxia.length; i++) {
      p = galaxia[i];
      var ang = p.th + giro * (1.5 - p.r / R);
      ctx.fillStyle = 'rgba(' + p.c + ',' + p.a.toFixed(3) + ')';
      ctx.fillRect(gx + Math.cos(ang) * p.r, gy + Math.sin(ang) * p.r * 0.42, p.s, p.s);
    }
    ctx.globalCompositeOperation = 'source-over';

    /* Estrellas en viaje */
    var cx = W / 2 + ox, cy = H * 0.5 + oy;
    ctx.lineCap = 'round';
    for (i = 0; i < estrellas.length; i++) {
      s = estrellas[i];
      v = reducir ? 0 : s.v * (0.25 + w * 22);
      mov = v * (0.5 + (s.d / maxD) * 1.5);
      s.d += mov;
      if (s.d > maxD * 1.05) { s.d = rand(0, 30); s.a = rand(0, 6.2832); }
      cs = Math.cos(s.a); sn = Math.sin(s.a);
      x1 = cx + cs * s.d; y1 = cy + sn * s.d;
      largo = mov * (1.5 + w * 8);
      alfa = Math.min(1, s.d / (maxD * 0.25)) * (reducir ? 0.8 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(el * 0.003 + s.f)));
      ctx.strokeStyle = 'rgba(' + s.c + ',' + alfa.toFixed(3) + ')';
      ctx.lineWidth = s.r;
      ctx.beginPath();
      ctx.moveTo(x1 - cs * largo, y1 - sn * largo);
      ctx.lineTo(x1 + 0.01, y1);
      ctx.stroke();
    }

    /* Planetas */
    var aparecer = reducir ? 1 : Math.min(1, Math.max(0, (el - 1400) / 1800));
    if (aparecer > 0) {
      var gigante = Math.min(W, H) * 0.24;
      planeta(W - gigante * 0.35 + ox * 0.2, H * 0.86 + oy * 0.2, gigante,
        { c: ['255,186,170', '178,30,52', '40,4,12'], anillo: true, incl: -0.32 }, aparecer, el);

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(235,213,169,' + (0.07 * aparecer).toFixed(3) + ')';
      for (i = 0; i < planetas.length; i++) {
        ctx.beginPath();
        ctx.ellipse(gx, gy, planetas[i].orb, planetas[i].orb * 0.42, 0, 0, 6.2832);
        ctx.stroke();
      }
      var orden = planetas.map(function (pl) {
        var ang = pl.fase + (reducir ? 0 : el * pl.vel);
        return { pl: pl, x: gx + Math.cos(ang) * pl.orb, y: gy + Math.sin(ang) * pl.orb * 0.42, z: Math.sin(ang) };
      }).sort(function (m, n2) { return m.z - n2.z; });
      for (i = 0; i < orden.length; i++) {
        p = orden[i];
        planeta(p.x, p.y, p.pl.r * (0.8 + 0.2 * p.z), p.pl, aparecer * (0.75 + 0.25 * p.z), el);
      }
    }

    /* Estrellas fugaces */
    if (!reducir && el > proxFugaz) {
      var izq = Math.random() < 0.5;
      fugaces.push({ x: izq ? rand(0, W * 0.5) : rand(W * 0.5, W), y: rand(0, H * 0.3), vx: (izq ? 1 : -1) * rand(7, 11), vy: rand(3, 5), vida: 1 });
      proxFugaz = el + rand(2500, 6000);
    }
    for (i = fugaces.length - 1; i >= 0; i--) {
      f = fugaces[i];
      f.x += f.vx; f.y += f.vy; f.vida -= 0.014;
      if (f.vida <= 0) { fugaces.splice(i, 1); continue; }
      g = ctx.createLinearGradient(f.x, f.y, f.x - f.vx * 9, f.y - f.vy * 9);
      g.addColorStop(0, 'rgba(255,244,234,' + (0.95 * f.vida).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(234,163,184,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x - f.vx * 9, f.y - f.vy * 9);
      ctx.stroke();
    }

    /* Corazón en constelación */
    var n = corazon.length;
    var prog = reducir ? 1 : Math.min(1, Math.max(0, (el - 1800) / 7000));
    var tramos = prog * n;
    var entero = Math.floor(tramos);
    var hx = ox * 0.3, hy = oy * 0.3;
    ctx.strokeStyle = 'rgba(235,213,169,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < entero && i < n; i++) {
      a = corazon[i]; b = corazon[(i + 1) % n];
      ctx.moveTo(a.x + hx, a.y + hy);
      ctx.lineTo(b.x + hx, b.y + hy);
    }
    if (entero < n) {
      a = corazon[entero]; b = corazon[(entero + 1) % n];
      var fr = tramos - entero;
      ctx.moveTo(a.x + hx, a.y + hy);
      ctx.lineTo(a.x + (b.x - a.x) * fr + hx, a.y + (b.y - a.y) * fr + hy);
    }
    ctx.stroke();

    ctx.shadowColor = 'rgba(234,163,184,0.9)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgb(255,244,234)';
    for (i = 0; i < n; i++) {
      if (i > tramos) break;
      p = corazon[i];
      ctx.beginPath();
      ctx.arc(p.x + hx, p.y + hy, 2.3 + 0.6 * (reducir ? 0 : Math.sin(el * 0.004 + i)), 0, 6.2832);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    if (!reducir) raf = window.requestAnimationFrame(cuadro);
  }

  function mostrar(i, inmediato) {
    idx = ((i % frases.length) + frases.length) % frases.length;
    var puntos = puntosEl.children;
    for (var k = 0; k < puntos.length; k++) {
      puntos[k].setAttribute('aria-current', k === idx ? 'true' : 'false');
    }
    window.clearTimeout(esperaFrase);
    fraseEl.classList.remove('visible');
    esperaFrase = window.setTimeout(function () {
      fraseEl.textContent = frases[idx];
      fraseEl.classList.add('visible');
    }, inmediato ? 30 : 600);
  }

  function reiniciarReloj() {
    window.clearInterval(temporizador);
    temporizador = window.setInterval(function () { mostrar(idx + 1); }, 7500);
  }

  function abrir() {
    ultimoFoco = document.activeElement;
    window.clearTimeout(cierre);
    capa.hidden = false;
    pagina.inert = true;
    document.documentElement.setAttribute('data-universo', '1');
    document.body.style.overflow = 'hidden';
    ajustar();
    t0 = 0;
    proxFugaz = 3500;
    fugaces = [];
    window.cancelAnimationFrame(raf);
    if (reducir) cuadro(performance.now()); else raf = window.requestAnimationFrame(cuadro);
    window.requestAnimationFrame(function () { capa.classList.add('abierto'); });
    mostrar(0, true);
    reiniciarReloj();
    cerrar.focus();
    if (window.__musica) window.__musica.universo(true);
  }

  function cerrarUniverso() {
    capa.classList.remove('abierto');
    window.clearInterval(temporizador);
    window.clearTimeout(esperaFrase);
    pagina.inert = false;
    document.documentElement.removeAttribute('data-universo');
    document.body.style.overflow = '';
    cierre = window.setTimeout(function () {
      capa.hidden = true;
      window.cancelAnimationFrame(raf);
    }, 650);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
    if (window.__musica) window.__musica.universo(false);
  }

  frases.forEach(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'u-punto';
    b.setAttribute('aria-label', 'Frase ' + (i + 1));
    b.setAttribute('aria-current', 'false');
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      mostrar(i);
      reiniciarReloj();
    });
    puntosEl.appendChild(b);
  });

  Array.prototype.forEach.call(abridores, function (b) { b.addEventListener('click', abrir); });
  cerrar.addEventListener('click', function (e) { e.stopPropagation(); cerrarUniverso(); });
  capa.addEventListener('click', function (e) {
    if (e.target.closest('button')) return;
    mostrar(idx + 1);
    reiniciarReloj();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !capa.hidden) cerrarUniverso();
  });
  window.addEventListener('pointermove', function (e) {
    if (capa.hidden) return;
    px = e.clientX / Math.max(W, 1);
    py = e.clientY / Math.max(H, 1);
  }, { passive: true });
  window.addEventListener('resize', function () { if (!capa.hidden) ajustar(); });
})();

/* ============ La foto: se desarma, se vuelve a armar y gira ============ */
(function () {
  var escena = document.getElementById('escena');
  var inclinar = document.getElementById('inclinar');
  var tarjeta = document.getElementById('tarjeta');
  var frente = document.getElementById('frente');
  var atras = document.getElementById('atras');
  var piezasEl = document.getElementById('piezas');
  var chispasEl = document.getElementById('chispas');
  var fraseEl = document.getElementById('atras-frase');
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLS = 4, FILAS = 5;
  var angulo = 0, ocupado = false, espera = 0;
  var piezas = [];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function esperar(ms) { return new Promise(function (ok) { window.setTimeout(ok, ms); }); }

  /* La frase de atrás aparece palabra por palabra */
  var palabras = fraseEl.textContent.trim().split(/\s+/);
  fraseEl.textContent = '';
  palabras.forEach(function (p, i) {
    var s = document.createElement('span');
    s.className = 'palabra';
    s.style.setProperty('--i', i);
    s.textContent = p;
    fraseEl.appendChild(s);
    if (i < palabras.length - 1) fraseEl.appendChild(document.createTextNode(' '));
  });

  /* Chispas que salen desde (x, y), en coordenadas de la escena */
  function chispas(x, y, cantidad, fuerza) {
    if (reducir) return;
    for (var i = 0; i < cantidad; i++) {
      var c = document.createElement('span');
      c.className = Math.random() < 0.3 ? 'chispa estrella' : 'chispa';
      chispasEl.appendChild(c);
      var ang = rand(0, 6.2832);
      var d = rand(0.4, 1) * fuerza;
      var dx = Math.cos(ang) * d, dy = Math.sin(ang) * d;
      var tam = rand(0.5, 1.3);
      var anim = c.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(' + tam + ') rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (x + dx * 0.7) + 'px,' + (y + dy * 0.7) + 'px) scale(' + tam + ') rotate(90deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy + 30) + 'px) scale(0) rotate(180deg)', opacity: 0 }
      ], { duration: rand(800, 1400), easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' });
      anim.onfinish = (function (el) { return function () { el.remove(); }; })(c);
    }
  }

  function centro() {
    return {
      x: inclinar.offsetLeft + inclinar.offsetWidth / 2,
      y: inclinar.offsetTop + inclinar.offsetHeight / 2,
      w: inclinar.offsetWidth,
      h: inclinar.offsetHeight
    };
  }

  /* Corta una copia del frente en piezas */
  function crearPiezas() {
    var W = tarjeta.offsetWidth, H = tarjeta.offsetHeight;
    var pw = W / COLS, ph = H / FILAS;
    piezasEl.textContent = '';
    piezas = [];
    for (var f = 0; f < FILAS; f++) {
      for (var k = 0; k < COLS; k++) {
        var x = Math.floor(k * pw), y = Math.floor(f * ph);
        var el = document.createElement('div');
        el.className = 'pieza';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = Math.ceil(pw) + 1 + 'px';
        el.style.height = Math.ceil(ph) + 1 + 'px';
        var copia = frente.cloneNode(true);
        copia.removeAttribute('id');
        Array.prototype.forEach.call(copia.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
        copia.style.cssText = 'left:' + -x + 'px;top:' + -y + 'px;width:' + W + 'px;height:' + H + 'px;right:auto;bottom:auto;box-shadow:none;';
        el.appendChild(copia);
        piezasEl.appendChild(el);

        /* se separa poco: lo justo para que se note la división */
        var cx = x + pw / 2 - W / 2, cy = y + ph / 2 - H / 2;
        var largo = Math.hypot(cx, cy) || 1;
        var empuje = rand(6, 12);
        piezas.push({
          el: el,
          fuera: 'translate3d(' + (cx / largo * empuje + cx * 0.09).toFixed(1) + 'px,' + (cy / largo * empuje + cy * 0.09).toFixed(1) + 'px,' + rand(8, 30).toFixed(0) + 'px) ' +
            'rotateX(' + rand(-7, 7).toFixed(1) + 'deg) rotateY(' + rand(-7, 7).toFixed(1) + 'deg) rotateZ(' + rand(-4, 4).toFixed(1) + 'deg) scale(.96)'
        });
      }
    }
  }

  function desarmar() {
    crearPiezas();
    frente.style.transition = 'none';
    frente.classList.add('oculta');
    void frente.offsetWidth;
    frente.style.transition = '';
    piezas.forEach(function (p) {
      p.anim = p.el.animate([
        { transform: 'none', opacity: 1 },
        { transform: p.fuera, opacity: 1 }
      ], { duration: 1000, delay: rand(0, 120), easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
    });
    window.requestAnimationFrame(function () { piezasEl.classList.add('brilla'); });
    chispasEnUniones(1);
    return esperar(1150 + 1000); /* se queda separada un momento, brillando */
  }

  /* Chispas en los cruces de la cuadrícula, donde se ve la división */
  function chispasEnUniones(cada) {
    var c = centro();
    for (var f = 1; f < FILAS; f++) {
      for (var k = 1; k < COLS; k++) {
        chispas(c.x - c.w / 2 + k * c.w / COLS, c.y - c.h / 2 + f * c.h / FILAS, cada, c.w * 0.18);
      }
    }
  }

  function armar() {
    var ultimo = 0;
    piezas.forEach(function (p) {
      var retraso = rand(0, 140);
      ultimo = Math.max(ultimo, retraso);
      if (p.anim) p.anim.cancel();
      p.anim = p.el.animate([
        { transform: p.fuera, opacity: 1 },
        { transform: 'none', opacity: 1 }
      ], { duration: 850, delay: retraso, easing: 'cubic-bezier(.6,0,.3,1.25)', fill: 'both' });
    });
    return esperar(ultimo + 850).then(function () {
      chispasEnUniones(2);
      piezasEl.classList.remove('brilla');
      frente.classList.remove('oculta');
      return esperar(380);
    }).then(function () {
      piezas.forEach(function (p) { if (p.anim) p.anim.cancel(); });
      piezasEl.textContent = '';
      piezas = [];
    });
  }

  function girar() {
    angulo += 180;
    tarjeta.style.transform = 'rotateY(' + angulo + 'deg)';
    return esperar(reducir ? 50 : 1500);
  }

  function ciclo() {
    window.clearTimeout(espera);
    ocupado = true;
    var inicio = reducir ? Promise.resolve() : desarmar().then(function () { return esperar(200); }).then(armar);
    inicio
      .then(girar)
      .then(function () {
        atras.classList.add('visible');
        var c = centro();
        chispas(c.x, c.y - c.h * 0.2, 16, c.w * 0.7);
        return esperar(5600);
      })
      .then(function () {
        atras.classList.remove('visible');
        return girar();
      })
      .then(function () {
        ocupado = false;
        espera = window.setTimeout(ciclo, 4500);
      });
  }

  if (!reducir) {
    tarjeta.style.transition = 'transform 1.4s cubic-bezier(.3,1.25,.4,1)';
    escena.addEventListener('pointermove', function (e) {
      var r = escena.getBoundingClientRect();
      inclinar.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 22).toFixed(1) + 'deg');
      inclinar.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 16).toFixed(1) + 'deg');
    });
    escena.addEventListener('pointerleave', function () {
      inclinar.style.setProperty('--ry', '0deg');
      inclinar.style.setProperty('--rx', '0deg');
    });
  }

  tarjeta.addEventListener('click', function () { if (!ocupado) ciclo(); });
  espera = window.setTimeout(ciclo, 3500);
})();

/* ============ Música: cancion.mp3 en la página, saturno.mp3 en el universo ============ */
(function () {
  var boton = document.getElementById('btn-musica');
  var etiqueta = document.getElementById('musica-texto');
  var cancion = document.getElementById('cancion');
  var saturno = document.getElementById('saturno');
  var INICIO_SATURNO = 40; /* segundo desde el que empieza saturno.mp3 (ej.: 1:15 = 75) */
  var activa = cancion;   /* nunca suenan las dos: antes de tocar una se detiene la otra */
  var encendida = true;   /* false solo si ella la pausa con el botón */

  function poner(activo) {
    boton.setAttribute('aria-pressed', activo ? 'true' : 'false');
    etiqueta.textContent = activo ? 'Pausar música' : 'Activar música';
  }

  function reproducir() {
    (activa === cancion ? saturno : cancion).pause();
    activa.play().then(function () { poner(true); }, function () { poner(false); });
  }

  function pausar() {
    cancion.pause();
    saturno.pause();
    poner(false);
  }

  /* Al terminar, saturno vuelve a empezar desde INICIO_SATURNO y no desde el 0 */
  saturno.addEventListener('ended', function () {
    saturno.currentTime = INICIO_SATURNO;
    if (activa === saturno && encendida) saturno.play();
  });

  boton.addEventListener('click', function () {
    encendida = activa.paused;
    if (encendida) reproducir(); else pausar();
  });

  /* Suena sola al entrar. Si el navegador lo bloquea, lo reintenta en cada toque hasta que suene
     (en celular solo touchend y click cuentan como permiso para reproducir, no touchstart) */
  var eventos = ['touchend', 'click', 'keydown'];
  function quitarEscucha() {
    eventos.forEach(function (ev) { document.removeEventListener(ev, primerToque, true); });
  }
  function primerToque(e) {
    if (!encendida || !activa.paused) return quitarEscucha();
    if (e.target.closest && e.target.closest('#btn-musica, [data-abrir-universo]')) return;
    reproducir();
  }
  eventos.forEach(function (ev) { document.addEventListener(ev, primerToque, true); });
  cancion.addEventListener('playing', quitarEscucha);
  reproducir();

  window.__musica = {
    universo: function (dentro) {
      activa = dentro ? saturno : cancion;
      if (dentro) { saturno.currentTime = INICIO_SATURNO; encendida = true; }
      if (encendida) reproducir(); else pausar();
    }
  };
})();