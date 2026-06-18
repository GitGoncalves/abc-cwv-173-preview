/* =========================================================================
     RC-I827R — interações reais (vanilla JS, sem dependências)
     ========================================================================= */
  (function () {
    'use strict';

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const esc = window.ABC.esc; // anti-XSS — canônico de shared/app.js
    const BASE = 'shared/assets/produto-rc-i827r/';

    /* -----------------------------------------------------------------------
       1. GALERIA — 5 imagens do produto (reais, do clone WP)
    ----------------------------------------------------------------------- */
    const GALLERY = [
      { id: 'frontal',    tag: 'Frontal',        src: 'RC-I827R-1.png' },
      { id: 'lateral',    tag: 'Vista lateral',  src: 'RC-I827R-2.png' },
      { id: 'contexto',   tag: 'Em uso',         src: 'RC-I827R-3.png' },
      { id: 'detalhe',    tag: 'Detalhe',        src: 'RC-I827R-4.png' },
      { id: 'acessorio',  tag: 'Docking Station',src: 'RC-I827R-5.png' },
    ];

    let current = 0;
    const imgWrap   = $('#imgWrap');
    const thumbsBox = $('#thumbs');
    const viewerTag = $('#viewerTag');

    if (!imgWrap || !thumbsBox || !viewerTag) return;

    // monta imagens do visor
    GALLERY.forEach((g, i) => {
      const img = new Image(500, 500);
      img.src = BASE + g.src;
      img.alt = 'Câmera Corporal RC-I827R: ' + g.tag;
      img.className = 'viewer__img' + (i === 0 ? ' active' : '');
      img.dataset.i = i;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = i === 0 ? 'sync' : 'async';
      if (i === 0) img.fetchPriority = 'high';
      imgWrap.appendChild(img);
    });

    // monta thumbnails
    GALLERY.forEach((g, i) => {
      const b = document.createElement('button');
      b.className = 'thumb' + (i === 0 ? ' active' : '');
      b.dataset.i = i;
      b.dataset.n = String(i + 1).padStart(2, '0');
      b.setAttribute('aria-label', 'Ver ' + g.tag);
      const im = new Image();
      im.src = BASE + g.src;
      im.alt = g.tag;
      im.loading = 'lazy';
      b.appendChild(im);
      b.addEventListener('click', () => goTo(i));
      thumbsBox.appendChild(b);
    });

    function goTo(i) {
      i = (i + GALLERY.length) % GALLERY.length;
      current = i;
      $$('.viewer__img', imgWrap).forEach(el => el.classList.toggle('active', +el.dataset.i === i));
      $$('.thumb', thumbsBox).forEach(el => el.classList.toggle('active', +el.dataset.i === i));
      viewerTag.textContent = GALLERY[i].tag.toUpperCase();
    }

    const prevBtn = $('#prev');
    const nextBtn = $('#next');
    if (prevBtn) prevBtn.addEventListener('click', e => { e.stopPropagation(); goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', e => { e.stopPropagation(); goTo(current + 1); });

    // teclado na galeria
    const stage = $('#stage');
    if (stage) {
      stage.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(current); }
      });
      // swipe
      let tStartX = 0;
      stage.addEventListener('touchstart', e => { tStartX = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - tStartX;
        if (Math.abs(dx) > 45) goTo(current + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    /* -----------------------------------------------------------------------
       2. LIGHTBOX + ZOOM
    ----------------------------------------------------------------------- */
    const lb        = $('#lightbox');
    const lbImg     = $('#lbImg');
    const lbFrame   = $('#lbFrame');
    const lbCounter = $('#lbCounter');
    let zoomed = false;

    function openLightbox(i) {
      current = (i + GALLERY.length) % GALLERY.length;
      lbImg.src = BASE + GALLERY[current].src;
      lbImg.alt = 'Câmera Corporal RC-I827R: ' + GALLERY[current].tag + ' (ampliada)';
      lbCounter.textContent = (current + 1) + ' / ' + GALLERY.length + '  ·  ' + GALLERY[current].tag;
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      resetZoom();
      goTo(current);
    }
    function closeLightbox() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      resetZoom();
    }
    function resetZoom() {
      zoomed = false;
      if (lbFrame) lbFrame.classList.remove('zoomed');
      if (lbImg) lbImg.style.transform = 'scale(1)';
    }

    if (stage) stage.addEventListener('click', () => openLightbox(current));
    const lbClose = $('#lbClose');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

    if (lbFrame) {
      lbFrame.addEventListener('click', e => {
        e.stopPropagation();
        zoomed = !zoomed;
        lbFrame.classList.toggle('zoomed', zoomed);
        if (!zoomed && lbImg) lbImg.style.transform = 'scale(1)';
      });
      lbFrame.addEventListener('mousemove', e => {
        if (!zoomed) return;
        const r = lbFrame.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * -100;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * -100;
        if (lbImg) lbImg.style.transform = 'scale(2.1) translate(' + (x * 0.5) + 'px,' + (y * 0.5) + 'px)';
      });
    }

    document.addEventListener('keydown', e => {
      if (!lb || !lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft')  openLightbox(current - 1);
      if (e.key === 'ArrowRight') openLightbox(current + 1);
    });

    /* -----------------------------------------------------------------------
       3. HOTSPOTS — partes da câmera
    ----------------------------------------------------------------------- */
    const HOTSPOTS = [
      { n: '01', t: 'Lente e câmera', d: 'Lente de grande angular com visão noturna por infravermelho. Captura vídeo em alta definição: grave ou transmita ao vivo para a central de monitoramento.' },
      { n: '02', t: 'Botão de pânico (SOS)', d: 'Acionamento imediato de alerta para a central de monitoramento. Em situações críticas, um único toque notifica a equipe de suporte e registra o momento automaticamente.' },
      { n: '03', t: 'Display', d: 'Tela que exibe status da câmera: bateria, sinal, gravação ativa, GPS e conectividade. O agente monitora o funcionamento do equipamento sem interromper a operação.' },
      { n: '04', t: 'Clip / presilha de fixação', d: 'Fixação corporal resistente para colete, cinto ou uniforme. Mantém a câmera estável durante movimentação intensa. O campo de visão da câmera acompanha o agente.' },
      { n: '05', t: 'Conector USB / Docking', d: 'Conexão para carregamento e transferência de dados. Encaixa diretamente na Docking Station inclusa. Carrega a câmera e sincroniza as gravações com o servidor automaticamente.' },
    ];

    const hsContent = $('#hotspotContent');
    const hsDots    = $('#hotspotDots');

    if (hsContent && hsDots) {
      HOTSPOTS.forEach((h, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Ver ' + h.t);
        dot.addEventListener('click', () => selectHotspot(i));
        hsDots.appendChild(dot);
      });

      function selectHotspot(i) {
        const h = HOTSPOTS[i];
        hsContent.innerHTML =
          '<div class="content"><span class="num">COMPONENTE ' + esc(h.n) + '</span>' +
          '<h3>' + esc(h.t) + '</h3><p>' + esc(h.d) + '</p></div>';
        $$('.hotspot').forEach(el => el.classList.toggle('active', +el.dataset.h === i + 1));
        $$('#hotspotDots button').forEach((el, idx) => el.classList.toggle('active', idx === i));
      }

      $$('.hotspot').forEach(el => el.addEventListener('click', () => selectHotspot(+el.dataset.h - 1)));
      selectHotspot(0); // estado inicial
    }

    /* -----------------------------------------------------------------------
       4. SPECS — tabs
    ----------------------------------------------------------------------- */
    $$('.spec-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const k = tab.dataset.tab;
        $$('.spec-tab').forEach(t => t.classList.toggle('active', t === tab));
        $$('.spec-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === k));
      });
    });

  })();
