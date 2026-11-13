(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fotos mostradas se a lista automática do repositório não puder ser lida
  var PADRAO = ['img/1.jpg', 'img/2.jpg', 'img/3.jpg', 'img/4.jpg', 'img/5.jpg', 'img/07.JPG', 'img/08.jpg', 'img/09.jpg', 'img/10.jpg', 'img/11.jpg'];
  // Arquivos do próprio site, que não entram na galeria
  var RESERVADOS = /^(favicon|logo|thayna|hero|her[oó]i)\b/i;

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
  // Lê os arquivos do próprio repositório (GitHub Pages).
  // Qualquer foto nova enviada aparece sozinha, em ordem numérica/alfabética pelo nome.
  var grid = document.getElementById('grid');
  var fotos = [];

  function natural(a, b) { return a.localeCompare(b, 'pt', { numeric: true }); }
  function ehImagem(n) { return /\.(jpe?g|png|webp|avif)$/i.test(n); }

  // Procura fotos na raiz do repositório e na pasta img, e devolve o caminho de cada uma.
  function listar() {
    var h = location.hostname, seg = location.pathname.split('/')[1] || '';
    if (!/\.github\.io$/.test(h)) return Promise.reject();
    var user = h.split('.')[0];
    var repo = seg && seg.indexOf('.') < 0 ? seg : h;
    try { var c = sessionStorage.getItem('fotos3'); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) {}
    function pasta(p) {
      return fetch('https://api.github.com/repos/' + user + '/' + repo + '/contents/' + p)
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; });
    }
    return Promise.all([pasta(''), pasta('img')]).then(function (r) {
      var achados = r[0].concat(r[1]).filter(function (i) {
        return i.type === 'file' && ehImagem(i.name) && !RESERVADOS.test(i.name);
      });
      achados.sort(function (x, y) { return natural(x.name, y.name); });
      var caminhos = achados.map(function (i) { return i.path; });
      if (!caminhos.length) throw 0;
      try { sessionStorage.setItem('fotos3', JSON.stringify(caminhos)); } catch (e) {}
      return caminhos;
    });
  }

  function montar(nomes) {
    fotos = nomes.map(function (n) { return encodeURI(n); });
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
      im.onerror = function () { f.remove(); };
      f.appendChild(im);
      f.addEventListener('click', function () { abrir(i); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(i); } });
      grid.appendChild(f);
      io.observe(f);
    });
  }

  listar().catch(function () { return PADRAO; }).then(montar);

  // Imagens do site com nomes alternativos (usa a primeira que existir)
  document.querySelectorAll('[data-imgs]').forEach(function (el) {
    var lista = el.dataset.imgs.split('|');
    (function tentar(i) {
      if (i >= lista.length) return;
      var im = new Image();
      im.onload = function () { el.style.setProperty('--img', 'url("' + encodeURI(lista[i]) + '")'); };
      im.onerror = function () { tentar(i + 1); };
      im.src = encodeURI(lista[i]);
    })(0);
  });

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
