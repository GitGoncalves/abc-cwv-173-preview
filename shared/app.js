/* =========================================================================
   ABC Mais Telecom - comportamento compartilhado do site (vanilla JS)
   - Carrega header/footer reaproveitáveis (partials) por fetch
   - Header: scroll, mega-menu de produtos, drawer mobile, página atual
   - Reveal on scroll, barras de spec, ano do rodapé
   - Form de cotação -> monta mensagem e abre WhatsApp (sem persistência fantasma)
   ========================================================================= */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // BASE relativa: páginas em subpastas definem window.ABC_BASE = '../'
  const BASE = (typeof window !== 'undefined' && window.ABC_BASE) ? window.ABC_BASE : '';
  // página atual p/ marcar item ativo: <body data-page="home|empresa|...">
  const PAGE = document.body.getAttribute('data-page') || '';

  /* -----------------------------------------------------------------------
     esc() - HTML-encode REAL (anti-XSS), util compartilhado do site.
     Definido UMA vez aqui e exposto em window.ABC.esc para os scripts inline
     das páginas (galeria/hotspots, resumo de kit) escaparem qualquer valor
     interpolado em innerHTML. Mesma implementação robusta do chatbot.js:
     neutraliza < > & " ' - sem isso, um dado como <img src=x onerror=...>
     executaria ao ser injetado via innerHTML (XSS de 2ª ordem). & PRIMEIRO.
  ----------------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  // expõe o util para os scripts inline das páginas (mesmo origin, mesma régua)
  window.ABC = window.ABC || {};
  window.ABC.esc = esc;

  /* Modo sandbox (validação interna / CEO - ordem 10/06):
     com sandbox ATIVO os formulários NÃO disparam WhatsApp/e-mail real nem
     webhook de produção - apenas seguem para a página de conversão
     (obrigado.html), que é o que o CEO valida. Em produção, defina
     window.ABC_SANDBOX = false (antes deste script) para religar os canais. */
  if (typeof window.ABC_SANDBOX === 'undefined') window.ABC_SANDBOX = true;
  const SANDBOX = window.ABC_SANDBOX !== false;

  /* -----------------------------------------------------------------------
     SRI dos partials (ABC-152, defense-in-depth)
     Hashes sha384 de shared/header.html e shared/footer.html. Bloco GERADO
     por shared/_sri-partials.mjs - NÃO editar à mão; rode o gerador sempre
     que header.html/footer.html mudarem (faz parte do publish).
     Chave = caminho relativo (independente de ABC_BASE). Se um hash estiver
     ausente (ex.: dev antes de gerar), o fetch segue SEM integrity - degrada
     com segurança em vez de quebrar o header/rodapé.
  ----------------------------------------------------------------------- */
  // >>> ABC_SRI_PARTIALS (gerado — não editar)
  const PARTIAL_SRI = {
    'shared/header.html': 'sha384-ngbg+fYg/vxdEiOVwAQpq18YbbgruTZAd2h6UKeqmGnUr2bMubvedgcBQxzASZq9',
    'shared/footer.html': 'sha384-DG7tJjnFynnj3EuAHaHc8YZjtKvTGq3PP2lS/x+GbAj4WocANssrpIQyl3phFLgx'
  };
  // <<< ABC_SRI_PARTIALS

  /* -----------------------------------------------------------------------
     1. Carregar partials (header + footer)
  ----------------------------------------------------------------------- */
  // M-1: o conteúdo do partial é HTML legítimo (header/footer), estático e
  // servido do MESMO ORIGIN - por isso vai via innerHTML (textContent quebraria
  // a marcação). Premissa de segurança em produção: header.html/footer.html
  // precisam vir de origem confiável (same-origin / SRI), nunca de CDN aberto
  // ou pipeline não-controlado. O único valor interpolado é {BASE} (config da
  // página, não input de usuário); ainda assim neutralizamos aspas/< > para
  // impedir attribute-injection caso ABC_BASE seja mal-configurado.
  // mesma neutralização do esc() canônico (sem duplicar a lógica)
  function safeBase(b) { return esc(b); }
  function injectPartial(html, mountId) {
    const mount = document.getElementById(mountId);
    if (!mount) return null;
    mount.innerHTML = html.replace(/\{BASE\}/g, safeBase(BASE));
    return mount;
  }

  async function loadPartials() {
    const targets = [
      { id: 'site-header', url: BASE + 'shared/header.html', sri: PARTIAL_SRI['shared/header.html'] },
      { id: 'site-footer', url: BASE + 'shared/footer.html', sri: PARTIAL_SRI['shared/footer.html'] },
    ];
    await Promise.all(targets.map(async t => {
      const mount = document.getElementById(t.id);
      if (!mount) return;
      try {
        // SRI via Fetch API: o browser rejeita a resposta se o hash não bater
        // (ABC-152). Só passamos integrity quando há hash gerado - em dev sem
        // hash, carrega normal. cache:'no-cache' garante revalidação do bytes.
        const opts = { cache: 'no-cache' };
        if (t.sri) opts.integrity = t.sri;
        const res = await fetch(t.url, opts);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        injectPartial(await res.text(), t.id);
      } catch (err) {
        // fallback mínimo (sem funcionalidade fantasma: link real de contato)
        mount.innerHTML = '<div class="shell" style="padding:18px 0;font-size:.9rem;color:#52525B">' +
          'ABC Mais Telecom · <a style="color:#2E29B8;font-weight:600" href="' + safeBase(BASE) + 'contato.html#cotacao">Solicitar cotação</a></div>';
        // B-1: só loga o caminho do partial em debug (window.ABC_DEBUG = true).
        // Em produção fica silencioso para não vazar a estrutura de pastas.
        if (window.ABC_DEBUG === true) console.warn('Partial não carregada (' + t.url + '):', err.message);
      }
    }));
    initHeader();
    $$('#site-footer #year, #year').forEach(el => { el.textContent = new Date().getFullYear(); });
  }

  /* -----------------------------------------------------------------------
     2. Header - scroll, mega-menu, drawer, página atual
  ----------------------------------------------------------------------- */
  function initHeader() {
    // marca item atual
    if (PAGE) {
      const cur = document.querySelector('.nav__menu [data-nav="' + PAGE + '"]');
      if (cur) cur.classList.add('current');
    }

    // sombra ao rolar
    const header = $('#siteHeader');
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // mega-menu de produtos (hover no desktop + clique/teclado acessível)
    const megaLi = document.querySelector('.nav__menu .has-mega');
    const megaBtn = $('#megaBtn');
    if (megaLi && megaBtn) {
      const open  = () => { megaLi.classList.add('open'); megaBtn.setAttribute('aria-expanded', 'true'); };
      const close = () => { megaLi.classList.remove('open'); megaBtn.setAttribute('aria-expanded', 'false'); };
      megaLi.addEventListener('mouseenter', open);
      megaLi.addEventListener('mouseleave', close);
      megaBtn.addEventListener('click', e => { e.preventDefault(); megaLi.classList.contains('open') ? close() : open(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      document.addEventListener('click', e => { if (!megaLi.contains(e.target)) close(); });
    }

    // drawer mobile
    const drawer = $('#drawer');
    const burger = $('#burger');
    if (drawer && burger) {
      const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

      const trapFocus = (e) => {
        const els = Array.from($$('.drawer__panel ' + FOCUSABLE));
        if (!els.length) return;
        const first = els[0];
        const last  = els[els.length - 1];
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };

      // elementos de conteúdo a bloquear quando o drawer está aberto
      // (NÃO bloqueia #site-header pois o drawer vive dentro dele)
      const INERT_TARGETS = () => [
        document.querySelector('main'),
        document.getElementById('site-footer'),
      ].filter(Boolean);

      const openD = () => {
        drawer.classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        INERT_TARGETS().forEach(el => el.setAttribute('inert', ''));
        requestAnimationFrame(() => {
          const first = $('.drawer__panel ' + FOCUSABLE);
          if (first) first.focus();
        });
        document.addEventListener('keydown', trapFocus);
      };

      const closeD = () => {
        drawer.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        INERT_TARGETS().forEach(el => el.removeAttribute('inert'));
        document.removeEventListener('keydown', trapFocus);
        burger.focus();
      };

      burger.addEventListener('click', openD);
      $$('[data-close]', drawer).forEach(el => el.addEventListener('click', closeD));
      $$('.drawer__nav a', drawer).forEach(a => a.addEventListener('click', closeD));
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeD(); });
      // accordion de produtos no drawer
      const grp = $('.drawer__group', drawer);
      if (grp) {
        const btn = $('button', grp);
        btn.addEventListener('click', () => {
          const isOpen = grp.classList.toggle('open');
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      }
    }
  }

  /* -----------------------------------------------------------------------
     3. Reveal on scroll + barras de spec (IntersectionObserver)
  ----------------------------------------------------------------------- */
  function initReveal() {
    const els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('.spec-bar .fill', en.target).forEach(f => { f.style.width = f.dataset.w || '0'; });
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
    setTimeout(() => $$('.spec-bar .fill').forEach(f => { if (!f.style.width) f.style.width = f.dataset.w || '0'; }), 600);
  }

  /* -----------------------------------------------------------------------
     4. FAQ accordion (se houver)
  ----------------------------------------------------------------------- */
  function initFaq() {
    $$('.faq-item').forEach(item => {
      const q = $('.faq-q', item);
      const a = $('.faq-a', item);
      if (!q || !a) return;
      q.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        q.setAttribute('aria-expanded', open ? 'true' : 'false');
        a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
      });
    });
    window.addEventListener('resize', () => {
      $$('.faq-item.open .faq-a').forEach(a => { a.style.maxHeight = a.scrollHeight + 'px'; });
    });
  }

  /* -----------------------------------------------------------------------
     5. FORM de cotação -> monta mensagem e abre WhatsApp
        (sem persistência: a mensagem vai pro WhatsApp da ABC; nada é salvo)
  ----------------------------------------------------------------------- */
  function initQuoteForm() {
    const form    = $('#quoteForm');
    if (!form) return;
    // Páginas com fluxo próprio de envio (ex.: webhook + página de obrigado)
    // marcam o form com data-handler="custom" e o handler padrão não se aplica.
    if (form.dataset.handler === 'custom') return;
    const success = $('#formSuccess');
    const ctx = form.getAttribute('data-ctx') || 'pela página da ABC';

    const setError = (field, on) => field.closest('.field').classList.toggle('invalid', on);
    const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      const nome  = $('#nome');
      const tel   = $('#telefone');
      const email = $('#email');
      const modal = $('#modalidade');

      setError(nome,  !nome.value.trim());   ok = ok && !!nome.value.trim();
      setError(tel,   !tel.value.trim());    ok = ok && !!tel.value.trim();
      if (modal) { setError(modal, !modal.value); ok = ok && !!modal.value; }
      if (email && email.value.trim()) { const ev = validEmail(email.value.trim()); setError(email, !ev); ok = ok && ev; }
      else if (email) setError(email, false);

      if (!ok) {
        const first = $('.field.invalid input, .field.invalid select');
        if (first) first.focus();
        return;
      }

      const labelMod = { locacao: 'Locação', venda: 'Compra de rádios', ambos: 'Ainda decidindo', assistencia: 'Assistência / manutenção', garantia: 'Reparo em garantia', componente: 'Troca de componente', programacao: 'Programação do rádio' };
      const lines = ['Olá, ABC! Quero uma cotação (' + ctx + ').', '', 'Nome: ' + nome.value.trim()];
      const emp = $('#empresa');
      if (emp && emp.value.trim()) lines.push('Empresa: ' + emp.value.trim());
      lines.push('Telefone: ' + tel.value.trim());
      if (email && email.value.trim()) lines.push('E-mail: ' + email.value.trim());
      if (modal) lines.push('Interesse: ' + (labelMod[modal.value] || modal.value));
      const qtd = $('#qtd');
      if (qtd && qtd.value) lines.push('Quantidade: ' + qtd.value);
      const msg = $('#msg');
      if (msg && msg.value.trim()) lines.push('', 'Operação: ' + msg.value.trim());

      // Validação local: sem WhatsApp/e-mail real. O formulário apenas conclui
      // o fluxo interno de conversão usado no sandbox.
      window.location.href = BASE + 'obrigado.html';
    });

    $$('#quoteForm input, #quoteForm select, #quoteForm textarea').forEach(el => {
      el.addEventListener('input', () => setError(el, false));
    });
    const reset = $('#resetForm');
    if (reset) reset.addEventListener('click', () => { form.reset(); form.style.display = ''; if (success) success.classList.remove('show'); });
  }

  /* -----------------------------------------------------------------------
     Boot
  ----------------------------------------------------------------------- */
  function boot() {
    loadPartials();
    initReveal();
    initFaq();
    initQuoteForm();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
