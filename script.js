(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fotos mostradas se a lista automática da pasta img/portfolio não puder ser lida
  var PADRAO = ['01.jpg', '02.jpg', '03.jpg', '04.jpg', '05.jpg', '06.jpg'];
  var PASTA = 'img/portfolio/';

  document.getElementById('ano').textContent = new Date().getFullYear();

  // cabeçalho sólido ao rolar + parallax leve do hero
  var top = document.getElementById('top');
  var hero = document.querySelector('[data-parallax]');
  function onScroll() {
    var y = window.scrollY;
    top.classList.toggle('solid', y > 60);
    if (hero && !reduce && y < window.innerHeight) hero.style.transform = 'translateY(' + y * 0.08 + 'px)';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // revelar ao rolar + contador
  var io = new IntersectionObserver(function (items) {
    items.forEach(function (it) {
      if (!it.isIntersecting) return;
      it.target.classList.add('in');
      it.target.querySelectorAll('[data-count]').forEach(count);
      io.unobserve(it.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  function count(el) {
    var end = +el.dataset.count, pre = el.dataset.prefix || '', t0 = null;
    if (reduce) { el.textContent = pre + end.toLocaleString('pt-BR'); return; }
    (function step(t) {
      t0 = t0 || t;
      var p = Math.min((t - t0) / 1600, 1);
      el.textContent = pre + Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  // ---------- Galeria automática ----------
  // Lê a pasta img/portfolio do próprio repositório (GitHub Pages).
  // Foto nova enviada para a pasta aparece sozinha, em ordem alfabética/numérica.
  var grid = document.getElementById('grid');
  var fotos = [];

  function natural(a, b) { return a.localeCompare(b, 'pt', { numeric: true }); }
  function ehImagem(n) { return /\.(jpe?g|png|webp|avif)$/i.test(n); }

  function listar() {
    var h = location.hostname, seg = location.pathname.split('/')[1] || '';
    if (!/\.github\.io$/.test(h)) return Promise.reject();
    var user = h.split('.')[0];
    var repo = seg && seg.indexOf('.') < 0 ? seg : h;
    try { var c = sessionStorage.getItem('fotos'); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) {}
    return fetch('https://api.github.com/repos/' + user + '/' + repo + '/contents/img/portfolio')
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (itens) {
        var nomes = itens.map(function (i) { return i.name; }).filter(ehImagem).sort(natural);
        if (!nomes.length) throw 0;
        try { sessionStorage.setItem('fotos', JSON.stringify(nomes)); } catch (e) {}
        return nomes;
      });
  }

  function montar(nomes) {
    fotos = nomes.map(function (n) { return PASTA + encodeURIComponent(n); });
    grid.textContent = '';
    fotos.forEach(function (src, i) {
      var f = document.createElement('figure');
      f.className = 'ph reveal';
      f.tabIndex = 0;
      f.setAttribute('role', 'button');
      f.setAttribute('aria-label', 'Ampliar foto ' + (i + 1));
      var im = new Image();
      im.src = src; im.loading = 'lazy'; im.decoding = 'async';
      im.alt = 'Maquiagem por Thayná Cobo, foto ' + (i + 1);
      f.appendChild(im);
      f.addEventListener('click', function () { abrir(i); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(i); } });
      grid.appendChild(f);
      io.observe(f);
    });
  }

  listar().catch(function () { return PADRAO; }).then(montar);

  // ---------- Lightbox ----------
  var lb = document.getElementById('lb'), big = lb.querySelector('img'), atual = 0, voltarPara = null;
  function mostrar(i) { atual = (i + fotos.length) % fotos.length; big.src = fotos[atual]; }
  function abrir(i) { voltarPara = document.activeElement; mostrar(i); lb.hidden = false; lb.querySelector('.lb-x').focus(); }
  function fechar() { lb.hidden = true; if (voltarPara) voltarPara.focus(); }
  lb.querySelector('.lb-x').addEventListener('click', fechar);
  lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); mostrar(atual - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); mostrar(atual + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === big) fechar(); });
  addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') fechar();
    if (e.key === 'ArrowLeft') mostrar(atual - 1);
    if (e.key === 'ArrowRight') mostrar(atual + 1);
  });
})();
