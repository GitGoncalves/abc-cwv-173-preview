(function () {
    'use strict';

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const esc = window.ABC.esc; // anti-XSS — canônico de shared/app.js

    const IMG_BASE = 'img/produtos/r5/';

    const GALLERY = [
      { id: 'frente',       tag: 'Frente',        mid: 'r5-frente.png',       full: 'r5-frente.png' },
      { id: 'lateral-esq',  tag: 'Lateral esq.',  mid: 'r5-lateral-esq.jpeg', full: 'r5-lateral-esq.jpeg' },
      { id: 'lateral-dir',  tag: 'Lateral dir.',  mid: 'r5-lateral-dir.jpeg', full: 'r5-lateral-dir.jpeg' },
      { id: 'topo',         tag: 'Topo',           mid: 'r5-topo.jpeg',        full: 'r5-topo.jpeg' },
      { id: 'traseira',     tag: 'Traseira',       mid: 'r5-traseira.jpeg',    full: 'r5-traseira.jpeg' },
    ];

    let current = 0;
    const imgWrap   = $('#imgWrap');
    const thumbsBox = $('#thumbs');
    const viewerTag = $('#viewerTag');

    GALLERY.forEach((g, i) => {
      const img = new Image();
      img.src = IMG_BASE + g.mid;
      img.alt = 'Motorola R5: ' + g.tag;
      img.className = 'viewer__img' + (i === 0 ? ' active' : '');
      img.dataset.i = i;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = i === 0 ? 'sync' : 'async';
      if (i === 0) img.fetchPriority = 'high';
      imgWrap.appendChild(img);
    });

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

    /* lightbox */
    const lb = $('#lightbox'), lbImg = $('#lbImg'), lbFrame = $('#lbFrame'), lbCounter = $('#lbCounter');
    let zoomed = false;

    function openLightbox(i) {
      current = (i + GALLERY.length) % GALLERY.length;
      lbImg.src = IMG_BASE + GALLERY[current].full;
      lbImg.alt = 'Motorola R5: ' + GALLERY[current].tag + ' (ampliado)';
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

    /* hotspots */
    const HOTSPOTS = [
      { n: '01', t: 'Antena robusta', d: 'Antena VHF/UHF projetada para resistir ao uso pesado em campo. Trocável: se quebrar, a gente substitui sem enviar o rádio para conserto.' },
      { n: '02', t: 'Seletor de canais', d: 'Botão giratório para trocar de canal sem olhar. Até 256 canais na versão LKP (com display) para organizar equipes, setores e grupos de comunicação.' },
      { n: '03', t: 'Alto-falante com cancelamento de ruído por IA', d: 'Volume de 101 phons com algoritmo de IA que filtra ruído de máquina, vento e ambiente industrial. A voz sai nítida mesmo no meio de muito barulho.' },
      { n: '04', t: 'Botão PTT e laterais', d: 'PTT grande, fácil de achar com luva ou EPI. Botões laterais programáveis para emergência, ativar BT ou função favorita da sua operação.' },
      { n: '05', t: 'Conector de acessórios', d: 'Encaixe selado (IP67) para microfone-alto-falante remoto (RSM) e acessórios de áudio. A proteção contra água e poeira se mantém mesmo com o acessório conectado.' },
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

    /* spec-tabs */
    $$('.spec-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const k = tab.dataset.tab;
        $$('.spec-tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
        $$('.spec-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === k));
      });
    });

    /* filtro acessórios */
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
            if (card.classList.contains('tag-confirm')) return;
            const show = cat === 'todos' || card.dataset.cat === cat;
            card.style.display = show ? '' : 'none';
          });
        });
      });
    })();

    /* Monte seu Kit */
    (function () {
      const WA_NUMBER = '551139961976';
      const checks    = $$('.kit-check');
      const nomeInp   = $('#kitNome');
      const empInp    = $('#kitEmpresa');
      const summList  = $('#kitSummaryList');
      const ctaBtn    = $('#kitCtaBtn');

      if (!ctaBtn || !summList) return;

      function updateSummary() {
        const selecionados = checks.filter(c => c.checked);
        if (selecionados.length === 0) {
          summList.innerHTML = '<span class="kit-empty">Marque os acessórios ao lado para montar seu kit.</span>';
        } else {
          summList.innerHTML = selecionados.map(c =>
            '<div class="kit-line"><span class="kit-line__name">' + esc(c.dataset.name) + '</span><span class="kit-line__pn">' + esc(c.dataset.pn) + '</span></div>'
          ).join('');
        }
        const nomeOk = nomeInp && nomeInp.value.trim().length >= 2;
        ctaBtn.disabled = !(selecionados.length > 0 && nomeOk);
      }

      checks.forEach(c => {
        c.addEventListener('change', function () {
          const item = this.closest('.kit-item');
          if (item) item.classList.toggle('checked', this.checked);
          updateSummary();
        });
        const label = c.closest('.kit-item');
        if (label) {
          label.addEventListener('click', function (e) {
            if (e.target === c) return;
            c.checked = !c.checked;
            c.dispatchEvent(new Event('change'));
          });
        }
      });

      if (nomeInp) nomeInp.addEventListener('input', updateSummary);

      ctaBtn.addEventListener('click', function () {
        const nome    = nomeInp  ? nomeInp.value.trim()  : '';
        const empresa = empInp   ? empInp.value.trim()   : '';
        const selecionados = checks.filter(c => c.checked);
        if (selecionados.length === 0) return;
        if (!nome) { if (nomeInp) nomeInp.focus(); return; }
        const linhas = selecionados.map(c => '  - ' + c.dataset.name + ' (' + c.dataset.pn + ')').join('\n');
        let msg = 'Olá, quero cotar um kit do Motorola R5:\n\n*Rádio:*\n  - Motorola MOTOTRBO R5\n\n*Acessórios selecionados:*\n' + linhas;
        if (empresa) msg += '\n\n*Empresa:* ' + empresa;
        msg += '\n\n*Nome:* ' + nome;
        const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
        window.open(url, '_blank', 'noopener,noreferrer');
      });

      updateSummary();
    })();

  })();
