(function () {
    'use strict';

    /* -------------------------------------------------------------------------
       ROTEAMENTO: 3 canais de WhatsApp (Comercial · Vendas · Locação)
       Números confirmados: comercial=551139961976
       [CONFIRMAR] vendas e locação: Paulo fornece os números; até lá usam o comercial
       ABC-167 (Dev Senior, 2026-06-17)
       ------------------------------------------------------------------------- */
    var WA_CHANNELS = {
      locacao: {
        number: '551139961976',   // [CONFIRMAR] nº de Locação — comercial como placeholder
        label:  'Locação',
        ctx:    'pelo formulário de contato (locação)',
        confirmed: false
      },
      venda: {
        number: '551139961976',   // [CONFIRMAR] nº de Vendas — comercial como placeholder
        label:  'Vendas',
        ctx:    'pelo formulário de contato (vendas)',
        confirmed: false
      },
      assistencia: {
        number: '551139961976',   // confirmado
        label:  'Comercial',
        ctx:    'pelo formulário de contato (assistência)',
        confirmed: true
      },
      default: {
        number: '551139961976',   // confirmado
        label:  'Comercial',
        ctx:    'pelo formulário de contato',
        confirmed: true
      }
    };

    function getChannel(modalidade) {
      return WA_CHANNELS[modalidade] || WA_CHANNELS['default'];
    }

    /* --- Seleção de segmento (botões visuais) --- */
    var segBtns = document.querySelectorAll('.seg-btn');
    var segInput = document.getElementById('segmento');
    segBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isActive = btn.classList.contains('active');
        segBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        if (!isActive) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          if (segInput) segInput.value = btn.getAttribute('data-seg') || '';
        } else {
          if (segInput) segInput.value = '';
        }
      });
    });

    /* --- Routing hint: atualiza indicador dinâmico conforme Interesse selecionado --- */
    var modal   = document.getElementById('modalidade-c');
    var hint    = document.getElementById('routing-hint');
    var hintTxt = document.getElementById('routing-hint-team');

    function updateRoutingHint() {
      if (!hint || !modal) return;
      var ch = getChannel(modal.value);
      if (modal.value) {
        hint.style.display = '';
        if (hintTxt) hintTxt.textContent = 'Time de ' + ch.label;
      } else {
        hint.style.display = 'none';
      }
    }

    if (modal) {
      modal.addEventListener('change', updateRoutingHint);
      updateRoutingHint();
    }

    /* --- Form de contato: valida + monta mensagem e roteia para o WhatsApp certo --- */
    var form    = document.getElementById('contactForm');
    var success = document.getElementById('contactSuccess');
    var reset   = document.getElementById('contactReset');
    var btnSubmit     = form ? form.querySelector('button[type="submit"]') : null;
    var successTeam   = document.getElementById('success-team');
    if (!form) return;

    function setError(field, on) {
      if (field && field.closest) field.closest('.field').classList.toggle('invalid', on);
    }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var nome  = document.getElementById('nome-c');
      var tel   = document.getElementById('telefone-c');
      var email = document.getElementById('email-c');

      setError(nome,  nome  && !nome.value.trim());  ok = ok && !!(nome  && nome.value.trim());
      setError(tel,   tel   && !tel.value.trim());   ok = ok && !!(tel   && tel.value.trim());
      if (modal) { setError(modal, !modal.value); ok = ok && !!modal.value; }
      if (email && email.value.trim()) {
        var ev = validEmail(email.value.trim());
        setError(email, !ev); ok = ok && ev;
      } else if (email) { setError(email, false); }

      if (!ok) {
        var first = form.querySelector('.field.invalid input, .field.invalid select');
        if (first) first.focus();
        return;
      }

      /* --- Roteamento: escolhe o canal certo --- */
      var ch = getChannel(modal ? modal.value : '');

      var labelMod = { locacao: 'Locação de rádios', venda: 'Compra de rádios', ambos: 'Ainda decidindo', assistencia: 'Assistência / manutenção' };
      var lines = ['Olá, ABC! Quero uma cotação (' + ch.ctx + ').', ''];

      var seg = segInput && segInput.value ? segInput.value : null;
      if (seg) lines.push('Segmento: ' + seg);

      if (modal && modal.value) lines.push('Interesse: ' + (labelMod[modal.value] || modal.value));
      lines.push('Canal: ' + ch.label);

      var qtd = document.getElementById('qtd-c');
      if (qtd && qtd.value) lines.push('Quantidade de rádios: ' + qtd.value);

      lines.push('');
      lines.push('Nome: ' + nome.value.trim());
      var emp = document.getElementById('empresa-c');
      if (emp && emp.value.trim()) lines.push('Empresa: ' + emp.value.trim());
      lines.push('Telefone: ' + tel.value.trim());
      if (email && email.value.trim()) lines.push('E-mail: ' + email.value.trim());

      var msg = document.getElementById('msg-c');
      if (msg && msg.value.trim()) lines.push('', 'Observações: ' + msg.value.trim());

      /* Sandbox (CEO 10/06, ABC-167 17/06): sem disparo real em sandbox.
         Produção: window.ABC_SANDBOX = false. */
      if (window.ABC_SANDBOX !== false) {
        window.location.href = 'obrigado.html';
        return;
      }
      window.open('https://wa.me/' + ch.number + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
      form.style.display = 'none';
      if (successTeam) successTeam.textContent = ch.label;
      if (success) success.classList.add('show');
    });

    /* limpar erros ao digitar */
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () { setError(el, false); });
    });

    /* reset */
    if (reset) {
      reset.addEventListener('click', function () {
        form.reset();
        form.style.display = '';
        if (success) success.classList.remove('show');
        segBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        if (segInput) segInput.value = '';
        updateRoutingHint();
      });
    }
  })();
