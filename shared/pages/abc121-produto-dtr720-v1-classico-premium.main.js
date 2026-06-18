/* =========================================================================
     produto-v1.html (V1 Clássico-Premium / ABC-121) — interações específicas
     Lightbox (1 imagem oficial) + hotspots da galeria.
     Header/footer/form/FAQ/reveal já são cobertos pelo shared/app.js.
     ========================================================================= */
  (function () {
    'use strict';
    // esc() canônico do shared/app.js (carregado acima, sem defer) — anti-XSS
    // em innerHTML. Sem fallback: se app.js não carregou, a página não opera.
    var esc = window.ABC.esc;
    var IMG = '../img/produtos/dtr720/dtr720-full.jpg';

    /* ---- Lightbox ---- */
    var lbx = document.getElementById('lbx');
    var lbxImg = document.getElementById('lbxImg');
    var lbxClose = document.getElementById('lbxClose');
    function openLbx() {
      lbxImg.src = IMG;
      lbx.classList.add('open');
      lbx.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeLbx() {
      lbx.classList.remove('open');
      lbx.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    ['heroStage', 'galStage'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', openLbx);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLbx(); }
      });
    });
    if (lbxClose) lbxClose.addEventListener('click', closeLbx);
    if (lbx) lbx.addEventListener('click', function (e) { if (e.target === lbx) closeLbx(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lbx.classList.contains('open')) closeLbx();
    });

    /* ---- Hotspots da galeria ---- */
    var HOTS = [
      { n: '1', t: 'Antena 900 MHz', d: 'Ajustada à faixa ISM 900 MHz com tecnologia FHSS. Trocável: se quebrar no campo, a gente substitui sem mandar o rádio para conserto.' },
      { n: '2', t: 'Display gráfico colorido', d: 'Tela colorida com retroiluminação ajustável para ver canal, contatos e menu. Facilita organizar a frota e operar sem erro.' },
      { n: '3', t: 'Alto-falante frontal', d: 'Áudio digital alto e claro. A tecnologia FHSS reduz interferência, deixando a voz nítida mesmo com muito rádio por perto.' },
      { n: '4', t: 'Teclado de navegação', d: 'Acesso direto a contatos e funções: chamada individual, grupo público e grupo privativo pelo menu na tela.' },
      { n: '5', t: 'Botões programáveis', d: 'Configuramos os botões para a função favorita da sua operação. Com VibraCall, o rádio também avisa por vibração em ambiente barulhento.' }
    ];
    var box = document.getElementById('ghotspots');
    if (box) {
      HOTS.forEach(function (h, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ghot' + (i === 0 ? ' active' : '');
        b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.innerHTML = '<span class="ghot__n">' + esc(h.n) + '</span><span><span class="ghot__b">' + esc(h.t) + '</span><span class="ghot__d">' + esc(h.d) + '</span></span>';
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(box.children, function (c) {
            c.classList.remove('active'); c.setAttribute('aria-pressed', 'false');
          });
          b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
        });
        box.appendChild(b);
      });
    }
  })();
