/* =========================================================================
     produto-hytera-bd506.html — interações específicas desta página
     Galeria, lightbox, spec-tabs
     (form/FAQ/header/footer/reveal já cobertas pelo shared/app.js)
     Imagens reais do BD506 (sem fotos de pessoas — LGPD).
     ========================================================================= */
  (function () {
    'use strict';

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    const IMG_BASE = 'img/produtos/bd506/';

    /* ---- galeria (somente imagens reais; nenhuma com pessoas) ---- */
    // Galeria LIDERA com fotos comerciais (foto oficial Hytera + foto do aparelho);
    // diagramas reais (controles/acessórios) vêm como slides secundários, claramente rotulados.
    const GALLERY = [
      { id: 'oficial',   tag: 'BD506',              mid: 'bd506-oficial-frente.webp', full: 'bd506-oficial-frente.webp' },
      { id: 'produto',   tag: 'Vista do aparelho',  mid: 'bd506-5-768.jpg', full: 'bd506-5.jpg' },
      { id: 'diagrama',  tag: 'Controles',          mid: 'bd506-1-768.png', full: 'bd506-1.png' },
      { id: 'acessorios',tag: 'Acessórios padrão',  mid: 'bd506-4.png',     full: 'bd506-4.png' },
    ];

    let current = 0;
    const imgWrap   = $('#imgWrap');
    const thumbsBox = $('#thumbs');
    const viewerTag = $('#viewerTag');

    // injeta imagens
    GALLERY.forEach((g, i) => {
      const img = new Image();
      img.src = IMG_BASE + g.mid;
      img.alt = 'Hytera BD506: ' + g.tag;
      img.className = 'viewer__img' + (i === 0 ? ' active' : '');
      img.dataset.i = i;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = i === 0 ? 'sync' : 'async';
      if (i === 0) img.fetchPriority = 'high';
      imgWrap.appendChild(img);
    });

    // thumbs
    GALLERY.forEach((g, i) => {
      const b = document.createElement('button');
      b.className = 'thumb' + (i === 0 ? ' active' : '');
      b.dataset.i = i;
      b.dataset.n = String(i + 1).padStart(2, '0');
      b.setAttribute('aria-label', 'Ver ' + g.tag);
      const im = new Image();
      im.src = IMG_BASE + g.mid;
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
      if (viewerTag) viewerTag.textContent = GALLERY[i].tag.toUpperCase();
    }

    const prev = $('#prev'), next = $('#next'), stage = $('#stage');
    if (prev) prev.addEventListener('click', e => { e.stopPropagation(); goTo(current - 1); });
    if (next) next.addEventListener('click', e => { e.stopPropagation(); goTo(current + 1); });

    if (stage) {
      stage.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(current); }
      });
      let tX = 0;
      stage.addEventListener('touchstart', e => { tX = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend',   e => { const dx = e.changedTouches[0].clientX - tX; if (Math.abs(dx) > 45) goTo(current + (dx < 0 ? 1 : -1)); }, { passive: true });
    }

    /* ---- lightbox ---- */
    const lb = $('#lightbox'), lbImg = $('#lbImg'), lbFrame = $('#lbFrame'), lbCounter = $('#lbCounter');
    let zoomed = false;

    function openLightbox(i) {
      current = (i + GALLERY.length) % GALLERY.length;
      lbImg.src = IMG_BASE + GALLERY[current].full;
      lbImg.alt = 'Hytera BD506: ' + GALLERY[current].tag + ' (ampliado)';
      if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + GALLERY.length + '  ·  ' + GALLERY[current].tag;
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      resetZoom(); goTo(current);
    }
    function closeLightbox() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; resetZoom();
    }
    function resetZoom() {
      zoomed = false; lbFrame.classList.remove('zoomed'); lbImg.style.transform = 'scale(1)';
    }
    if (stage) stage.addEventListener('click', () => openLightbox(current));
    if ($('#lbClose')) $('#lbClose').addEventListener('click', closeLightbox);
    if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    if (lbFrame) {
      lbFrame.addEventListener('click', e => { e.stopPropagation(); zoomed = !zoomed; lbFrame.classList.toggle('zoomed', zoomed); if (!zoomed) lbImg.style.transform = 'scale(1)'; });
      lbFrame.addEventListener('mousemove', e => {
        if (!zoomed) return;
        const r = lbFrame.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * -100;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * -100;
        lbImg.style.transform = 'scale(2.1) translate(' + (x * 0.5) + 'px,' + (y * 0.5) + 'px)';
      });
    }
    document.addEventListener('keydown', e => {
      if (!lb || !lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft')  openLightbox(current - 1);
      if (e.key === 'ArrowRight') openLightbox(current + 1);
    });

    /* ---- spec-tabs ---- */
    $$('.spec-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const k = tab.dataset.tab;
        $$('.spec-tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
        $$('.spec-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === k));
      });
    });

  })();
