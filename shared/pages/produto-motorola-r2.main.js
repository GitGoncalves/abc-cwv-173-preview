/* =========================================================================
     produto-motorola-r2.html — interações específicas desta página
     Galeria, lightbox, hotspots, spec-tabs
     (form/FAQ/header/footer/reveal já cobertas pelo shared/app.js)
     ========================================================================= */
  (function () {
    'use strict';

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const esc = window.ABC.esc; // anti-XSS — canônico de shared/app.js

    const IMG_BASE = 'img/produtos/abc-r2-hd/';

    /* ---- galeria ---- */
    const GALLERY = [
      { id: 'frente',           tag: 'Frente',            mid: 'r2-hd-frente-800x800.png',               full: 'r2-hd-frente-scaled.png' },
      { id: 'frente-34',        tag: 'Frente 3/4',        mid: 'r2-hd-frente-34-direita-800x800.png',    full: 'r2-hd-frente-34-direita-scaled.png' },
      { id: 'lateral-1',        tag: 'Lateral (PTT)',     mid: 'r2-hd-lateral-1-800x800.png',            full: 'r2-hd-lateral-1-scaled.png' },
      { id: 'lateral-2',        tag: 'Lateral (acess.)',  mid: 'r2-hd-lateral-2-800x800.png',            full: 'r2-hd-lateral-2-scaled.png' },
      { id: 'topo',             tag: 'Topo (controles)',  mid: 'r2-hd-topo-800x800.png',                 full: 'r2-hd-topo-scaled.png' },
      { id: 'traseira',         tag: 'Traseira',          mid: 'r2-hd-traseira-800x800.png',             full: 'r2-hd-traseira-scaled.png' },
      { id: 'traseira-34-dir',  tag: 'Traseira 3/4 dir.', mid: 'r2-hd-traseira-34-direita-800x800.png',  full: 'r2-hd-traseira-34-direita-scaled.png' },
      { id: 'traseira-34-esq',  tag: 'Traseira 3/4 esq.', mid: 'r2-hd-traseira-34-esquerda-800x800.png', full: 'r2-hd-traseira-34-esquerda-scaled.png' },
    ];

    let current = 0;
    const imgWrap   = $('#imgWrap');
    const thumbsBox = $('#thumbs');
    const viewerTag = $('#viewerTag');

    // injecta imagens
    GALLERY.forEach((g, i) => {
      const img = new Image(800, 800);
      img.src = IMG_BASE + g.mid;
      img.alt = 'Motorola R2: ' + g.tag;
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
      // swipe
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
      lbImg.alt = 'Motorola R2: ' + GALLERY[current].tag + ' (ampliado)';
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

    /* ---- hotspots ---- */
    const HOTSPOTS = [
      { n: '01', t: 'Antena robusta', d: 'Antena UHF/VHF projetada para resistir ao uso pesado. Trocável: se quebrar no campo, a gente substitui sem mandar o rádio para conserto.' },
      { n: '02', t: 'Seletor de canais', d: 'Botão giratório de 16 posições por banco para trocar de canal sem olhar. São 64 canais no total para organizar equipes e setores.' },
      { n: '03', t: 'Alto-falante de alto volume', d: 'Saída de áudio de até 3 W com supressão de ruído SINC+. A voz sai clara mesmo em galpão, evento ou oficina barulhenta.' },
      { n: '04', t: 'Botão PTT e laterais', d: 'PTT grande, fácil de achar com luva. Mais 2 botões programáveis para emergência, varredura ou função favorita da sua operação.' },
      { n: '05', t: 'Conector de acessórios', d: 'Encaixe vedado para microfone-alto-falante (RSM), fone de vigilância e kits de áudio. Tudo IP55, mantendo a proteção contra água e poeira.' },
    ];
    const hsContent = $('#hotspotContent');
    const hsDots    = $('#hotspotDots');
    if (hsContent && hsDots) {
      HOTSPOTS.forEach((h, i) => {
        const dot = document.createElement('button');
        dot.className = i === 0 ? 'active' : '';
        dot.setAttribute('aria-label', 'Ver ' + h.t);
        dot.addEventListener('click', () => selectHS(i));
        hsDots.appendChild(dot);
      });
      function selectHS(i) {
        const h = HOTSPOTS[i];
        hsContent.innerHTML = '<span class="num">PONTO ' + esc(h.n) + '</span><h3>' + esc(h.t) + '</h3><p>' + esc(h.d) + '</p>';
        $$('.hotspot').forEach(el => el.classList.toggle('active', +el.dataset.h === i + 1));
        $$('#hotspotDots button').forEach((el, idx) => el.classList.toggle('active', idx === i));
      }
      $$('.hotspot').forEach(el => el.addEventListener('click', () => selectHS(+el.dataset.h - 1)));
      selectHS(0);
    }

    /* ---- spec-tabs ---- */
    $$('.spec-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const k = tab.dataset.tab;
        $$('.spec-tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
        $$('.spec-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === k));
      });
    });

    /* ---- Filtro de acessórios homologados ---- */
    (function () {
      const filterBtns = $$('.acc-hom__filter-btn');
      const cards = $$('.acc-hom-card', document);
      if (!filterBtns.length) return;
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const cat = btn.dataset.cat;
          cards.forEach(card => {
            const show = cat === 'todos' || card.dataset.cat === cat;
            card.style.display = show ? '' : 'none';
          });
        });
      });
    })();

    /* ---- Monte seu Kit — JS REAL (sem backend, sem fantasma) ---- */
    (function () {
      const WA_NUMBER = '551139961976';
      const checks    = $$('.kit-check');
      const nomeInp   = $('#kitNome');
      const empInp    = $('#kitEmpresa');
      const summList  = $('#kitSummaryList');
      const ctaBtn    = $('#kitCtaBtn');

      if (!ctaBtn || !summList) return;

      /* Atualiza a lista de resumo e habilita/desabilita o botão */
      function updateSummary() {
        const selecionados = checks.filter(c => c.checked);
        if (selecionados.length === 0) {
          summList.innerHTML = '<span class="kit-empty">Marque os acessórios ao lado para montar seu kit.</span>';
        } else {
          summList.innerHTML = selecionados.map(c =>
            '<div class="kit-line"><span class="kit-line__name">' + esc(c.dataset.name) + '</span><span class="kit-line__pn">' + esc(c.dataset.pn) + '</span></div>'
          ).join('');
        }
        // habilita só se tiver ao menos um item E nome preenchido
        const nomeOk = nomeInp && nomeInp.value.trim().length >= 2;
        ctaBtn.disabled = !(selecionados.length > 0 && nomeOk);
      }

      /* Marca/desmarca e aplica classe visual */
      checks.forEach(c => {
        c.addEventListener('change', function () {
          const item = this.closest('.kit-item');
          if (item) item.classList.toggle('checked', this.checked);
          updateSummary();
        });
        // clique no label inteiro (sem propagar para o input duas vezes)
        const label = c.closest('.kit-item');
        if (label) {
          label.addEventListener('click', function (e) {
            // se o clique foi no próprio input, não duplicar
            if (e.target === c) return;
            c.checked = !c.checked;
            c.dispatchEvent(new Event('change'));
          });
        }
      });

      /* Atualiza ao digitar o nome */
      if (nomeInp) nomeInp.addEventListener('input', updateSummary);

      /* CTA: monta mensagem e abre wa.me */
      ctaBtn.addEventListener('click', function () {
        const nome    = nomeInp  ? nomeInp.value.trim()  : '';
        const empresa = empInp   ? empInp.value.trim()   : '';

        const selecionados = checks.filter(c => c.checked);
        if (selecionados.length === 0) return;
        if (!nome) { if (nomeInp) nomeInp.focus(); return; }

        const linhas = selecionados.map(c => '  - ' + c.dataset.name + ' (' + c.dataset.pn + ')').join('\n');
        let msg = 'Olá, quero cotar um kit do Motorola R2:\n\n*Rádio:*\n  - Motorola MOTOTRBO R2\n\n*Acessórios selecionados:*\n' + linhas;
        if (empresa) msg += '\n\n*Empresa:* ' + empresa;
        msg += '\n\n*Nome:* ' + nome;

        const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
        window.open(url, '_blank', 'noopener,noreferrer');
      });

      /* Inicia com o estado correto */
      updateSummary();
    })();

  })();
