(function () {
  'use strict';

  /* =========================================================================
     ABC Mais Telecom — Formulário de Captura de Lead
     ABC-231 · 2026-06-17

     Sandbox por padrão (window.ABC_SANDBOX = true, set em shared/app.js).
     Em sandbox: valida, mostra aviso e redireciona para /obrigado.html.
     Em live: POST JSON para FORM_CONFIG.webhookUrl → redireciona.
     Fallback: localStorage se webhook falhar (lead não é perdido).
     ========================================================================= */

  var FORM_CONFIG = {
    webhookUrl:  '',               /* preencher quando n8n estiver pronto — [CONFIRMAR] */
    redirectUrl: 'obrigado.html',
    sandboxMode: (window.ABC_SANDBOX !== false),
    sandboxDelay: 1500
  };

  /* ------------------------------------------------------------------
     Máscara de telefone: (XX) X XXXX-XXXX
     ------------------------------------------------------------------ */
  function applyPhoneMask(el) {
    if (!el) return;
    el.addEventListener('input', function () {
      var digits = el.value.replace(/\D/g, '').substring(0, 11);
      if (!digits) { el.value = ''; return; }
      if (digits.length <= 2)  { el.value = '(' + digits; return; }
      if (digits.length <= 6)  { el.value = '(' + digits.slice(0,2) + ') ' + digits.slice(2); return; }
      if (digits.length <= 10) { el.value = '(' + digits.slice(0,2) + ') ' + digits.slice(2,6) + '-' + digits.slice(6); return; }
      el.value = '(' + digits.slice(0,2) + ') ' + digits.slice(2,7) + '-' + digits.slice(7);
    });
  }

  /* ------------------------------------------------------------------
     LGPD: botão Enviar desabilitado até checkbox ser marcado
     ------------------------------------------------------------------ */
  function bindLgpd(checkbox, submitBtn) {
    if (!checkbox || !submitBtn) return;
    function syncState() {
      submitBtn.disabled = !checkbox.checked;
      submitBtn.setAttribute('aria-disabled', checkbox.checked ? 'false' : 'true');
      submitBtn.style.opacity = checkbox.checked ? '1' : '0.5';
      submitBtn.style.cursor  = checkbox.checked ? ''  : 'not-allowed';
    }
    checkbox.addEventListener('change', syncState);
    syncState();
  }

  /* ------------------------------------------------------------------
     Spinner de envio
     ------------------------------------------------------------------ */
  function setLoading(btn, on) {
    if (!btn) return;
    var spinner = btn.querySelector('.btn-spinner');
    var label   = btn.querySelector('.btn-label');
    btn.disabled = on;
    if (spinner) spinner.style.display = on ? 'inline-block' : 'none';
    if (label)   label.style.display   = on ? 'none' : '';
  }

  /* ------------------------------------------------------------------
     Validação inline
     ------------------------------------------------------------------ */
  function setFieldError(el, hasError) {
    if (!el) return;
    var wrap = el.closest('.field') || el.closest('.form-field');
    if (wrap) wrap.classList.toggle('invalid', hasError);
  }

  function clearError(el) { setFieldError(el, false); }

  /* ------------------------------------------------------------------
     Fallback: salvar lead no localStorage quando webhook falha
     ------------------------------------------------------------------ */
  function fallbackToStorage(data) {
    try {
      var key   = 'abc_leads_fallback';
      var saved = JSON.parse(localStorage.getItem(key) || '[]');
      saved.push(data);
      localStorage.setItem(key, JSON.stringify(saved));
      console.warn('[ABCForm] Webhook falhou — lead salvo em localStorage como fallback.');
    } catch (e) { /* silencioso */ }
  }

  /* ------------------------------------------------------------------
     Coleta payload do formulário
     ------------------------------------------------------------------ */
  function collectPayload(form) {
    function val(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? el.value.trim() : '';
    }
    var lgpd = form.querySelector('[name="lgpd"]');
    return {
      source:       'site-formulario',
      page:         window.location.href,
      timestamp:    new Date().toISOString(),
      nome:         val('nome'),
      whatsapp:     val('whatsapp'),
      modalidade:   val('modalidade'),
      empresa:      val('empresa'),
      segmento:     val('segmento'),
      quantidade:   val('quantidade'),
      mensagem:     val('mensagem'),
      lgpd_consent: !!(lgpd && lgpd.checked),
      sandbox:      FORM_CONFIG.sandboxMode
    };
  }

  /* ------------------------------------------------------------------
     Validação de campos obrigatórios
     Retorna true se tudo OK
     ------------------------------------------------------------------ */
  function validate(form) {
    var nome      = form.querySelector('[name="nome"]');
    var whatsapp  = form.querySelector('[name="whatsapp"]');
    var modalidade = form.querySelector('[name="modalidade"]');

    var nomeOk  = nome      && nome.value.trim().length >= 3;
    var waOk    = whatsapp  && whatsapp.value.replace(/\D/g,'').length >= 10;
    var modOk   = modalidade && !!modalidade.value;

    setFieldError(nome,      !nomeOk);
    setFieldError(whatsapp,  !waOk);
    setFieldError(modalidade,!modOk);

    if (!nomeOk || !waOk || !modOk) {
      var first = form.querySelector('.field.invalid input, .field.invalid select, .form-field.invalid input, .form-field.invalid select');
      if (first) first.focus();
      return false;
    }
    return true;
  }

  /* ------------------------------------------------------------------
     Exibe ou oculta mensagem de sandbox
     ------------------------------------------------------------------ */
  function showSandboxNotice(form) {
    var notice = form.querySelector('.sandbox-notice');
    if (notice) {
      notice.style.display = '';
      notice.textContent   = '[Modo sandbox — formulário não enviado]';
    }
  }

  /* ------------------------------------------------------------------
     Exibe mensagem de erro de envio
     ------------------------------------------------------------------ */
  function showSendError(form, msg) {
    var errEl = form.querySelector('.form-send-error');
    if (errEl) {
      errEl.textContent   = msg || 'Erro ao enviar. Tente pelo WhatsApp.';
      errEl.style.display = '';
    }
  }

  /* ------------------------------------------------------------------
     Inicialização do formulário
     ------------------------------------------------------------------ */
  function initForm(formEl) {
    if (!formEl) return;

    var btnSubmit   = formEl.querySelector('button[type="submit"]');
    var lgpdCheckbox = formEl.querySelector('[name="lgpd"]');
    var phoneInput  = formEl.querySelector('[name="whatsapp"]');

    /* Setup inicial */
    applyPhoneMask(phoneInput);
    bindLgpd(lgpdCheckbox, btnSubmit);

    /* Limpar erros ao editar */
    formEl.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input',  function () { clearError(el); });
      el.addEventListener('change', function () { clearError(el); });
    });

    /* Submit */
    formEl.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validate(formEl)) return;

      var data = collectPayload(formEl);

      /* --- MODO SANDBOX --- */
      if (FORM_CONFIG.sandboxMode) {
        showSandboxNotice(formEl);
        setTimeout(function () {
          window.location.href = FORM_CONFIG.redirectUrl;
        }, FORM_CONFIG.sandboxDelay);
        return;
      }

      /* --- MODO LIVE --- */
      setLoading(btnSubmit, true);

      /* Sem webhookUrl configurado: fallback direto */
      if (!FORM_CONFIG.webhookUrl) {
        fallbackToStorage(data);
        window.location.href = FORM_CONFIG.redirectUrl;
        return;
      }

      fetch(FORM_CONFIG.webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        window.location.href = FORM_CONFIG.redirectUrl;
      })
      .catch(function (err) {
        console.error('[ABCForm] Webhook erro:', err);
        fallbackToStorage(data);
        showSendError(formEl, 'Houve um problema técnico. Seus dados foram salvos localmente. Por favor, entre em contato pelo WhatsApp.');
        setLoading(btnSubmit, false);
        bindLgpd(lgpdCheckbox, btnSubmit); /* restaura estado do botão */
      });
    });
  }

  /* ------------------------------------------------------------------
     Auto-inicializar todos os formulários com [data-lead-capture]
     ------------------------------------------------------------------ */
  document.querySelectorAll('form[data-lead-capture]').forEach(function (form) {
    initForm(form);
  });

  /* Expor API para inicialização manual */
  window.ABCForm = { init: initForm };

})();
