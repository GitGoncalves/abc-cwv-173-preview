/* =========================================================================
     produto-dtr720.html — interações específicas desta página
     Galeria, lightbox, hotspots, spec-tabs, Monte seu Kit (upsell + multi-produto)
     (form/FAQ/header/footer/reveal já cobertas pelo shared/app.js)
     ========================================================================= */
  (function () {
    'use strict';

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const esc = window.ABC.esc; // anti-XSS — canônico de shared/app.js

    const IMG_BASE = 'img/produtos/dtr720/';

    /* ---- galeria (1 foto oficial Motorola; estrutura pronta p/ mais ângulos) ---- */
    const GALLERY = [
      { id: 'frente', tag: 'Frente', mid: 'dtr720-800.jpg', full: 'dtr720-full.jpg' },
    ];

    let current = 0;
    const imgWrap   = $('#imgWrap');
    const thumbsBox = $('#thumbs');
    const viewerTag = $('#viewerTag');

    // injeta imagens
    GALLERY.forEach((g, i) => {
      const img = new Image(800, 800);
      img.src = IMG_BASE + g.mid;
      img.alt = 'Motorola DTR720, ' + g.tag;
      img.className = 'viewer__img' + (i === 0 ? ' active' : '');
      img.dataset.i = i;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = i === 0 ? 'sync' : 'async';
      if (i === 0) img.fetchPriority = 'high';
      imgWrap.appendChild(img);
    });

    // thumbs (só renderiza navegação se houver mais de 1 imagem)
    if (GALLERY.length > 1) {
      GALLERY.forEach((g, i) => {
        const b = document.createElement('button');
        b.className = 'thumb' + (i === 0 ? ' active' : '');
        b.dataset.i = i;
        b.setAttribute('aria-label', 'Ver ' + g.tag);
        const im = new Image();
        im.src = IMG_BASE + g.mid;
        im.alt = g.tag;
        im.loading = 'lazy';
        b.appendChild(im);
        b.addEventListener('click', () => goTo(i));
        thumbsBox.appendChild(b);
      });
    } else if (thumbsBox) {
      thumbsBox.style.display = 'none';
    }

    function goTo(i) {
      i = (i + GALLERY.length) % GALLERY.length;
      current = i;
      $$('.viewer__img', imgWrap).forEach(el => el.classList.toggle('active', +el.dataset.i === i));
      $$('.thumb', thumbsBox).forEach(el => el.classList.toggle('active', +el.dataset.i === i));
      if (viewerTag) viewerTag.textContent = GALLERY[i].tag.toUpperCase();
    }

    const prev = $('#prev'), next = $('#next'), stage = $('#stage');
    // com 1 só imagem, escondemos as setas (sem botão fantasma)
    if (GALLERY.length <= 1) { if (prev) prev.style.display = 'none'; if (next) next.style.display = 'none'; }
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
      lbImg.alt = 'Motorola DTR720, ' + GALLERY[current].tag + ' (ampliado)';
      if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + GALLERY.length + '  ·  ' + GALLERY[current].tag;
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      resetZoom(); goTo(current);
    }
    function closeLightbox() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; resetZoom();
    }
    function resetZoom() { zoomed = false; lbFrame.classList.remove('zoomed'); lbImg.style.transform = 'scale(1)'; }
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
      { n: '01', t: 'Antena 900 MHz', d: 'Antena ajustada à faixa ISM 900 MHz com tecnologia FHSS. Trocável: se quebrar no campo, a gente substitui sem mandar o rádio para conserto.' },
      { n: '02', t: 'Display gráfico colorido', d: 'Tela colorida com retroiluminação ajustável para ver canal, contatos e menu. Facilita organizar a frota e operar sem erro.' },
      { n: '03', t: 'Alto-falante frontal', d: 'Áudio digital alto e claro. A tecnologia FHSS reduz interferência, deixando a voz nítida mesmo em ambiente com muito rádio por perto.' },
      { n: '04', t: 'Teclado de navegação', d: 'Navegação direta pelos contatos e funções. Você acessa chamada individual, grupo público e grupo privativo pelo menu na tela.' },
      { n: '05', t: 'Botões programáveis', d: 'Configuramos os botões para a função favorita da sua operação. Com VibraCall, o rádio também avisa por vibração quando o ambiente é barulhento.' },
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

    /* ---- Kit (upsell + multi-produto) + formulário ÚNICO de cotação ----
       Fluxo real: kit marcado na página -> entra no formulário -> POST no n8n
       (webhook local /lead-abc) -> redireciona para obrigado.html (página que
       o Google usa para contar a conversão). Fallback: se o n8n estiver fora,
       o lead sai pelo WhatsApp comercial e segue para a confirmação. ---- */
    (function () {
      const LEAD_WEBHOOK = window.ABC_LEAD_WEBHOOK || 'http://localhost:5678/webhook/lead-abc';
      const WA_NUMBER    = '551139961976'; // número público do comercial (mesmo do site oficial)

      const checks   = $$('.kit-check');
      const qtdInp   = $('#kitQtd');
      const summList = $('#kitSummaryList');
      const ctaBtn   = $('#kitCtaBtn');
      const form     = $('#quoteForm');
      const formKit  = $('#quoteKitResumo');

      function radioQty() {
        const n = qtdInp ? parseInt(qtdInp.value, 10) : 1;
        return (isNaN(n) || n < 1) ? 1 : n;
      }
      function kitSelecionado() {
        return checks.filter(c => c.checked).map(c => ({ nome: c.dataset.name, pn: c.dataset.pn }));
      }

      function updateSummary() {
        const itens = kitSelecionado();
        const qty   = radioQty();
        let html = '<div class="kit-line"><span class="kit-line__name">Motorola DTR720'
          + (qty > 1 ? ' (' + qty + ' un.)' : '') + '</span><span class="kit-line__pn">DTR720</span></div>';
        if (itens.length) {
          html += itens.map(i =>
            '<div class="kit-line"><span class="kit-line__name">' + esc(i.nome) + '</span><span class="kit-line__pn">' + esc(i.pn) + '</span></div>'
          ).join('');
        } else {
          html += '<div style="margin-top:8px;color:var(--ink-4);font-size:0.8rem">Marque os acessórios ao lado (fone, bateria extra, capinha...) para acrescentar ao mesmo pedido.</div>';
        }
        if (summList) summList.innerHTML = html;
        if (formKit) {
          formKit.innerHTML = '<b>Seu pedido:</b> Motorola DTR720' + (qty > 1 ? ' (' + qty + ' un.)' : '')
            + (itens.length ? ' + ' + itens.map(i => esc(i.nome)).join(', ') : '')
            + ' &middot; <a href="#monte-kit" style="color:var(--brand-ink);font-weight:600;">ajustar kit</a>';
        }
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
            if (e.target.tagName === 'INPUT') return;
            c.checked = !c.checked;
            c.dispatchEvent(new Event('change'));
          });
        }
      });
      if (qtdInp) qtdInp.addEventListener('input', updateSummary);

      // CTA do kit: leva o visitante ao formulário único (o kit já vai junto)
      if (ctaBtn) ctaBtn.addEventListener('click', function () {
        const alvo = document.getElementById('cotacao');
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => { const n = $('#nome'); if (n) n.focus({ preventScroll: true }); }, 700);
      });

      /* ---- Envio do formulário (handler próprio; app.js respeita data-handler="custom") ---- */
      if (form) {
        const setError   = (field, on) => { const f = field.closest('.field'); if (f) f.classList.toggle('invalid', on); };
        const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

        $$('#quoteForm input').forEach(el => el.addEventListener('input', () => setError(el, false)));

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const nome  = $('#nome'), tel = $('#telefone'), email = $('#email');
          let ok = true;
          setError(nome, !nome.value.trim());  ok = ok && !!nome.value.trim();
          setError(tel,  !tel.value.trim());   ok = ok && !!tel.value.trim();
          const ev = validEmail(email.value.trim());
          setError(email, !ev);                ok = ok && ev;
          if (!ok) { const first = $('.field.invalid input'); if (first) first.focus(); return; }

          // Sandbox (validação CEO — ordem 10/06): não dispara n8n nem WhatsApp
          // real; segue direto para a página de conversão. Produção: ABC_SANDBOX=false.
          if (window.ABC_SANDBOX !== false) { location.href = 'obrigado.html'; return; }

          const itens = kitSelecionado();
          // "mensagem" leva o pedido completo: é o campo que o workflow do n8n grava
          const resumoPedido = 'Produto: Motorola DTR720 (' + radioQty() + ' un.)'
            + (itens.length ? ' | Acessórios: ' + itens.map(a => a.nome + ' [' + a.pn + ']').join('; ') : '')
            + (($('#cnpj') && $('#cnpj').value.trim()) ? ' | CNPJ: ' + $('#cnpj').value.trim() : '');
          const payload = {
            nome:       nome.value.trim(),
            telefone:   tel.value.trim(),
            email:      email.value.trim(),
            empresa:    ($('#empresa') ? $('#empresa').value.trim() : ''),
            cnpj:       ($('#cnpj') ? $('#cnpj').value.trim() : ''),
            produto:    'Motorola DTR720',
            quantidade: radioQty(),
            acessorios: itens,
            mensagem:   resumoPedido,
            origem:     'site-html/produto-dtr720',
            pagina:     location.href
          };

          const btn = $('#quoteSubmit');
          if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

          const ctl = new AbortController();
          const t   = setTimeout(() => ctl.abort(), 6000);
          fetch(LEAD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ctl.signal
          }).then(r => {
            clearTimeout(t);
            if (!r.ok) throw new Error('webhook ' + r.status);
            location.href = 'obrigado.html';
          }).catch(() => {
            clearTimeout(t);
            // Em sandbox (window.ABC_SANDBOX !== false, padrão do app.js) nenhum
            // canal real dispara: segue direto pra confirmação. Em produção o
            // lead não se perde: sai pelo WhatsApp comercial.
            if (window.ABC_SANDBOX !== false) { location.href = 'obrigado.html?via=sandbox-fallback'; return; }
            const linhas = ['Olá, ABC! Quero uma cotação do Motorola DTR720 (pela página do produto).', '',
              'Nome: ' + payload.nome, 'Telefone: ' + payload.telefone, 'E-mail: ' + payload.email];
            if (payload.empresa) linhas.push('Empresa: ' + payload.empresa);
            if (payload.cnpj)    linhas.push('CNPJ: ' + payload.cnpj);
            linhas.push('Quantidade: ' + payload.quantidade);
            if (payload.acessorios.length) linhas.push('Acessórios: ' + payload.acessorios.map(a => a.nome + ' (' + a.pn + ')').join('; '));
            window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
            location.href = 'obrigado.html?via=whatsapp';
          });
        });
      }

      updateSummary();
    })();

  })();
