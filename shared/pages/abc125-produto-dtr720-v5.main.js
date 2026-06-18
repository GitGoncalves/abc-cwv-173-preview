/* =========================================================================
     produto-dtr720-v5.html — interações específicas (V5 Catálogo-Rápido)
     Apenas: Monte seu Kit (upsell + multi-produto) + formulário ÚNICO de cotação.
     (form/FAQ/header/footer/reveal já cobertas pelo ../shared/app.js)
     Sem galeria/lightbox/hotspots: o foco é o scan rápido e a performance.
     ========================================================================= */
  (function () {
    'use strict';
    // esc() canônico do shared/app.js (carregado acima, sem defer) — anti-XSS
    // em innerHTML. Sem fallback: se app.js não carregou, a página não opera.
    const esc = window.ABC.esc;
    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    /* ---- Kit (upsell + multi-produto) + formulário ÚNICO de cotação ----
       Fluxo real: kit marcado na página -> entra no formulário -> POST no n8n
       (webhook local /lead-abc) -> redireciona para ../obrigado.html (página que
       o Google usa para contar a conversão). Em sandbox segue direto para a
       confirmação; fallback de produção: o lead sai pelo WhatsApp comercial. ---- */
    const LEAD_WEBHOOK = window.ABC_LEAD_WEBHOOK || 'http://localhost:5678/webhook/lead-abc';
    const WA_NUMBER    = '551139961976'; // número público do comercial (mesmo do site oficial)
    const OBRIGADO     = ((typeof window !== 'undefined' && window.ABC_BASE) ? window.ABC_BASE : '') + 'obrigado.html';

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
        if (window.ABC_SANDBOX !== false) { location.href = OBRIGADO; return; }

        const itens = kitSelecionado();
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
          origem:     'site-html/variantes/produto-dtr720-v5',
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
          location.href = OBRIGADO;
        }).catch(() => {
          clearTimeout(t);
          if (window.ABC_SANDBOX !== false) { location.href = OBRIGADO + '?via=sandbox-fallback'; return; }
          const linhas = ['Olá, ABC! Quero uma cotação do Motorola DTR720 (pela página do produto).', '',
            'Nome: ' + payload.nome, 'Telefone: ' + payload.telefone, 'E-mail: ' + payload.email];
          if (payload.empresa) linhas.push('Empresa: ' + payload.empresa);
          if (payload.cnpj)    linhas.push('CNPJ: ' + payload.cnpj);
          linhas.push('Quantidade: ' + payload.quantidade);
          if (payload.acessorios.length) linhas.push('Acessórios: ' + payload.acessorios.map(a => a.nome + ' (' + a.pn + ')').join('; '));
          window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
          location.href = OBRIGADO + '?via=whatsapp';
        });
      });
    }

    updateSummary();
  })();
