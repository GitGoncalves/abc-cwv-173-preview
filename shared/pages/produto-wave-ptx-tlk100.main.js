/* =========================================================================
     Wave PTX TLK 100 — interações da página (vanilla JS, sem dependências)
     ========================================================================= */
  (function () {
    'use strict';

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    /* -----------------------------------------------------------------------
       1. GALERIA — imagens reais do produto (do clone WP)
       wave-radio-shadow = hero/visor principal (fundo limpo)
       si500 = ângulos adicionais (frente/costas/lados)
    ----------------------------------------------------------------------- */
    const BASE = 'img/produtos/tlk100/';
    const GALLERY = [
      { id: 'frente',   tag: 'Frente',     mid: 'wave-radio-shadow-500x500.png',  full: 'wave-radio-shadow.png' },
      { id: 'frente2',  tag: 'Frontal',    mid: 'si500_front_324x324.jpg',        full: 'si500_front_324x324.jpg' },
      { id: 'costas',   tag: 'Costas',     mid: 'si500_back_324x324.jpg',         full: 'si500_back_324x324.jpg' },
      { id: 'esq',      tag: 'Lateral esq.', mid: 'si500_left_324x324.jpg',       full: 'si500_left_324x324.jpg' },
      { id: 'dir',      tag: 'Lateral dir.', mid: 'si500_right_324x324.jpg',      full: 'si500_right_324x324.jpg' },
    ];

    let current = 0;
    const imgWrap   = $('#imgWrap');
    const thumbsBox = $('#thumbs');
    const viewerTag = $('#viewerTag');

    if (imgWrap && thumbsBox) {
      GALLERY.forEach(function (g, i) {
        var img = new Image(500, 500);
        img.src = BASE + g.mid;
        img.alt = 'Motorola Wave PTX TLK 100: ' + g.tag;
        img.className = 'viewer__img' + (i === 0 ? ' active' : '');
        img.dataset.i = i;
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = i === 0 ? 'sync' : 'async';
        if (i === 0) img.fetchPriority = 'high';
        imgWrap.appendChild(img);
      });

      GALLERY.forEach(function (g, i) {
        var b = document.createElement('button');
        b.className = 'thumb' + (i === 0 ? ' active' : '');
        b.dataset.i = i;
        b.dataset.n = String(i + 1).padStart(2, '0');
        b.setAttribute('aria-label', 'Ver ' + g.tag);
        var im = new Image();
        im.src = BASE + g.mid;
        im.alt = g.tag;
        im.loading = 'lazy';
        b.appendChild(im);
        b.addEventListener('click', function () { goTo(i); });
        thumbsBox.appendChild(b);
      });
    }

    function goTo(i) {
      i = (i + GALLERY.length) % GALLERY.length;
      current = i;
      $$('.viewer__img', imgWrap).forEach(function (el) { el.classList.toggle('active', +el.dataset.i === i); });
      $$('.thumb', thumbsBox).forEach(function (el) { el.classList.toggle('active', +el.dataset.i === i); });
      if (viewerTag) viewerTag.textContent = GALLERY[i].tag.toUpperCase();
    }

    var prevBtn = $('#prev'), nextBtn = $('#next'), stage = $('#stage');
    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); goTo(current + 1); });

    if (stage) {
      stage.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(current); }
      });
      var tStartX = 0;
      stage.addEventListener('touchstart', function (e) { tStartX = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - tStartX;
        if (Math.abs(dx) > 45) goTo(current + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    /* -----------------------------------------------------------------------
       2. LIGHTBOX + ZOOM real
    ----------------------------------------------------------------------- */
    var lb        = $('#lightbox');
    var lbImg     = $('#lbImg');
    var lbFrame   = $('#lbFrame');
    var lbCounter = $('#lbCounter');
    var zoomed    = false;

    function openLightbox(i) {
      current = (i + GALLERY.length) % GALLERY.length;
      if (lbImg) { lbImg.src = BASE + GALLERY[current].full; lbImg.alt = 'Wave PTX TLK 100: ' + GALLERY[current].tag; }
      if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + GALLERY.length + '  ·  ' + GALLERY[current].tag;
      if (lb) { lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); }
      document.body.style.overflow = 'hidden';
      resetZoom();
      goTo(current);
    }
    function closeLightbox() {
      if (lb) { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
      document.body.style.overflow = '';
      resetZoom();
    }
    function resetZoom() {
      zoomed = false;
      if (lbFrame) lbFrame.classList.remove('zoomed');
      if (lbImg) lbImg.style.transform = 'scale(1)';
    }

    if (stage) stage.addEventListener('click', function () { openLightbox(current); });
    var lbClose = $('#lbClose');
    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lb) lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });

    if (lbFrame) {
      lbFrame.addEventListener('click', function (e) {
        e.stopPropagation();
        zoomed = !zoomed;
        lbFrame.classList.toggle('zoomed', zoomed);
        if (!zoomed && lbImg) lbImg.style.transform = 'scale(1)';
      });
      lbFrame.addEventListener('mousemove', function (e) {
        if (!zoomed || !lbImg) return;
        var r = lbFrame.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width  - 0.5) * -100;
        var y = ((e.clientY - r.top)  / r.height - 0.5) * -100;
        lbImg.style.transform = 'scale(2.1) translate(' + (x * 0.5) + 'px,' + (y * 0.5) + 'px)';
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!lb || !lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft')  openLightbox(current - 1);
      if (e.key === 'ArrowRight') openLightbox(current + 1);
    });

    /* -----------------------------------------------------------------------
       3. SPECS — abas
    ----------------------------------------------------------------------- */
    $$('.spec-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var id = tab.dataset.tab;
        $$('.spec-tab').forEach(function (t) { t.classList.remove('active'); });
        $$('.spec-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = document.querySelector('[data-panel="' + id + '"]');
        if (panel) panel.classList.add('active');
      });
    });

    /* -----------------------------------------------------------------------
       4. FAQ — accordion
    ----------------------------------------------------------------------- */
    $$('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      var ans = item.querySelector('.faq-a');
      if (!btn || !ans) return;
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        $$('.faq-item').forEach(function (fi) {
          fi.classList.remove('open');
          var a = fi.querySelector('.faq-a');
          if (a) a.style.maxHeight = null;
          var b = fi.querySelector('.faq-q');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('open');
          ans.style.maxHeight = ans.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    /* -----------------------------------------------------------------------
       5. SPEC BARS — animar ao entrar na tela
    ----------------------------------------------------------------------- */
    function animateBars() {
      $$('.spec-bar .fill').forEach(function (fill) {
        var w = fill.dataset.w;
        if (w) fill.style.width = w;
      });
    }
    if ('IntersectionObserver' in window) {
      var specSection = document.querySelector('#specs');
      if (specSection) {
        new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { animateBars(); obs.disconnect(); }
          });
        }, { threshold: 0.15 }).observe(specSection);
      }
    } else { animateBars(); }

    /* -----------------------------------------------------------------------
       6. FORMULÁRIO — monta mensagem WhatsApp (sem persistência fantasma)
    ----------------------------------------------------------------------- */
    var form = $('#quoteForm');
    var successBox = $('#formSuccess');
    var resetBtn = $('#resetForm');

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;
        $$('.field[required] input, .field[required] select', form).forEach(function (f) {
          var field = f.closest('.field');
          if (!f.value.trim()) { field.classList.add('invalid'); valid = false; }
          else field.classList.remove('invalid');
        });
        var emailField = $('#email', form);
        if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
          emailField.closest('.field').classList.add('invalid');
          valid = false;
        }
        if (!valid) { form.querySelector('.field.invalid input, .field.invalid select').focus(); return; }

        var ctx  = form.dataset.ctx || '';
        var nome = ($('#nome', form) || {}).value || '';
        var emp  = ($('#empresa', form) || {}).value || '';
        var tel  = ($('#telefone', form) || {}).value || '';
        var mod  = ($('#modalidade', form) || {}).value || '';
        var qtd  = ($('#qtd', form) || {}).value || '';
        var msg  = ($('#msg', form) || {}).value || '';

        var modMap = { locacao:'Locação', venda:'Compra', ambos:'Ainda decidindo', assistencia:'Assistência/manutenção' };
        var parts = ['Olá, ABC! Tenho interesse ' + ctx + '.'];
        parts.push('Nome: ' + nome);
        if (emp) parts.push('Empresa: ' + emp);
        parts.push('Telefone: ' + tel);
        if (mod) parts.push('Interesse: ' + (modMap[mod] || mod));
        if (qtd) parts.push('Quantidade: ' + qtd + ' rádios');
        if (msg) parts.push('Operação: ' + msg);

        window.open('https://wa.me/551139961976?text=' + encodeURIComponent(parts.join('\n')), '_blank', 'noopener');

        form.style.display = 'none';
        if (successBox) { successBox.classList.add('show'); }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (form) { form.reset(); form.style.display = ''; }
        if (successBox) successBox.classList.remove('show');
      });
    }

    /* -----------------------------------------------------------------------
       7. STICKY CTA MOBILE — esconde quando formulário está visível
    ----------------------------------------------------------------------- */
    var stickyCta = $('#stickyCta');
    var cotacaoSec = $('#cotacao');
    if (stickyCta && cotacaoSec && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          stickyCta.style.display = e.isIntersecting ? 'none' : '';
        });
      }, { threshold: 0.1 }).observe(cotacaoSec);
    }

  })();
