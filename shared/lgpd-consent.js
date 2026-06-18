/* =========================================================================
   ABC Mais Telecom - LGPD Consent Management  (ABC-232)

   Gerencia consentimento conforme LGPD (Lei 13.709/18) e diretrizes ANPD.
   Banner com 3 ações: aceitar / recusar / preferências (modal granular).
   Bloqueia Google Analytics/Tag Manager até consentimento explícito.

   Estados: 'not-asked' | 'rejected' | 'custom' | 'accepted'
   ========================================================================= */

(function () {
  'use strict';

  window.LGPD = window.LGPD || {};

  const CFG = {
    storageKey: 'abc-lgpd-consent',
    bannerDelay: 1000,
  };

  let consent = {
    status: 'not-asked',
    timestamp: null,
    categories: { analytics: false, marketing: false, preferences: false },
  };

  /* -----------------------------------------------------------------------
     Persistência
  ----------------------------------------------------------------------- */
  function loadConsent() {
    try {
      const raw = localStorage.getItem(CFG.storageKey);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.status && ['not-asked', 'rejected', 'custom', 'accepted'].includes(p.status)) {
          consent = p;
        }
      }
    } catch (e) {
      console.warn('[LGPD] Erro ao carregar localStorage:', e.message);
    }
  }

  function saveConsent() {
    try {
      consent.timestamp = new Date().toISOString();
      localStorage.setItem(CFG.storageKey, JSON.stringify(consent));
    } catch (e) {
      console.warn('[LGPD] Erro ao salvar localStorage:', e.message);
    }
  }

  /* -----------------------------------------------------------------------
     Carregar trackers deferred (só após consentimento)
  ----------------------------------------------------------------------- */
  function loadDeferredTrackers() {
    if (!window.LGPD.hasConsent('analytics')) return;

    /* Google Tag Manager — descomentar e preencher ID quando disponível
    if (!document.querySelector('script[src*="googletagmanager.com/gtm.js"]')) {
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-XXXXXXX');
    }
    */

    /* Google Analytics 4 — descomentar e preencher ID quando disponível
    if (!document.querySelector('script[src*="gtag/js"]')) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true });
      window.gtag = gtag;
    }
    */
  }

  /* -----------------------------------------------------------------------
     Banner HTML
  ----------------------------------------------------------------------- */
  const BANNER_STYLES = `
    <style id="lgpd-styles">
      .lgpd-banner {
        position: fixed; bottom: 0; left: 0; right: 0;
        z-index: 999999;
        background: rgba(10,10,18,0.97);
        border-top: 2px solid #3E38F2;
        padding: 18px 24px;
        animation: lgpdSlideUp 0.3s ease-out;
        backdrop-filter: blur(4px);
      }
      @keyframes lgpdSlideUp {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0); opacity: 1; }
      }
      .lgpd-banner__inner {
        max-width: 1200px; margin: 0 auto;
        display: flex; gap: 24px; align-items: center;
        justify-content: space-between;
      }
      .lgpd-banner__text { flex: 1; color: #f4f4f5; font-family: system-ui, sans-serif; }
      .lgpd-banner__title {
        margin: 0 0 6px; font-size: 15px; font-weight: 600; line-height: 1.3;
      }
      .lgpd-banner__desc {
        margin: 0; font-size: 13px; line-height: 1.55; color: rgba(244,244,245,0.82);
      }
      .lgpd-banner__desc a { color: #7b76f9; text-decoration: underline; }
      .lgpd-banner__desc a:hover { color: #a5a1fb; }
      .lgpd-banner__actions {
        display: flex; gap: 10px; flex-shrink: 0;
      }
      .lgpd-btn {
        padding: 9px 18px; border: none; border-radius: 6px;
        font-size: 13px; font-weight: 500; cursor: pointer;
        transition: all 0.2s; font-family: system-ui, sans-serif;
        white-space: nowrap;
      }
      .lgpd-btn:focus { outline: 2px solid #3E38F2; outline-offset: 2px; }
      .lgpd-btn--reject {
        background: transparent; color: #f4f4f5;
        border: 1px solid rgba(255,255,255,0.28);
      }
      .lgpd-btn--reject:hover { border-color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.06); }
      .lgpd-btn--prefs {
        background: rgba(62,56,242,0.15); color: #a5a1fb;
        border: 1px solid rgba(62,56,242,0.35);
      }
      .lgpd-btn--prefs:hover { background: rgba(62,56,242,0.25); }
      .lgpd-btn--accept { background: #3E38F2; color: #fff; border: 1px solid #3E38F2; }
      .lgpd-btn--accept:hover { background: #3531d5; box-shadow: 0 4px 14px rgba(62,56,242,0.4); }

      /* Modal de preferências */
      .lgpd-modal-backdrop {
        position: fixed; inset: 0; z-index: 1000000;
        background: rgba(0,0,0,0.72);
        display: flex; align-items: flex-end; justify-content: center;
        padding: 0;
        animation: lgpdFadeIn 0.2s ease;
      }
      @keyframes lgpdFadeIn { from { opacity: 0; } to { opacity: 1; } }
      .lgpd-modal {
        background: #18181b; border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px 16px 0 0;
        width: 100%; max-width: 520px;
        padding: 28px 28px 32px;
        font-family: system-ui, sans-serif;
        animation: lgpdSlideUp 0.28s ease-out;
      }
      .lgpd-modal__title {
        color: #f4f4f5; font-size: 17px; font-weight: 700;
        margin: 0 0 6px;
      }
      .lgpd-modal__sub {
        color: rgba(244,244,245,0.65); font-size: 13px; margin: 0 0 22px;
        line-height: 1.5;
      }
      .lgpd-modal__sub a { color: #7b76f9; }
      .lgpd-toggle-row {
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
        gap: 16px;
      }
      .lgpd-toggle-row:last-of-type { border-bottom: none; }
      .lgpd-toggle-label { flex: 1; }
      .lgpd-toggle-label b { display: block; color: #f4f4f5; font-size: 14px; margin-bottom: 3px; }
      .lgpd-toggle-label span { color: rgba(244,244,245,0.58); font-size: 12px; line-height: 1.45; }
      /* Toggle switch */
      .lgpd-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
      .lgpd-toggle input { opacity: 0; width: 0; height: 0; }
      .lgpd-toggle-track {
        position: absolute; inset: 0; border-radius: 99px;
        background: rgba(255,255,255,0.15); cursor: pointer;
        transition: background 0.2s;
      }
      .lgpd-toggle-track::before {
        content: ''; position: absolute;
        width: 18px; height: 18px; border-radius: 50%;
        background: #fff; top: 3px; left: 3px;
        transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      .lgpd-toggle input:checked + .lgpd-toggle-track { background: #3E38F2; }
      .lgpd-toggle input:checked + .lgpd-toggle-track::before { transform: translateX(20px); }
      .lgpd-toggle input:disabled + .lgpd-toggle-track { opacity: 0.5; cursor: not-allowed; }
      .lgpd-toggle input:focus + .lgpd-toggle-track { outline: 2px solid #3E38F2; outline-offset: 2px; }
      .lgpd-modal__footer {
        display: flex; gap: 10px; justify-content: flex-end; margin-top: 22px;
      }

      @media (max-width: 600px) {
        .lgpd-banner__inner { flex-direction: column; gap: 14px; align-items: flex-start; }
        .lgpd-banner__actions { width: 100%; flex-direction: column; }
        .lgpd-btn { width: 100%; text-align: center; padding: 11px 16px; }
        .lgpd-modal { padding: 22px 18px 28px; }
      }
    </style>`;

  function createBanner() {
    const div = document.createElement('div');
    div.innerHTML = BANNER_STYLES + `
      <aside class="lgpd-banner" role="dialog" aria-labelledby="lgpd-banner-title" aria-modal="true">
        <div class="lgpd-banner__inner">
          <div class="lgpd-banner__text">
            <p class="lgpd-banner__title" id="lgpd-banner-title">Privacidade e cookies</p>
            <p class="lgpd-banner__desc">
              Usamos cookies essenciais (necessários para o funcionamento do site) e, com seu consentimento, cookies de análise.
              Conforme a <strong>LGPD (Lei 13.709/18)</strong>, você decide quais categorias ativar.
              <a href="politica-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.
            </p>
          </div>
          <div class="lgpd-banner__actions">
            <button class="lgpd-btn lgpd-btn--reject" data-action="reject" aria-label="Recusar cookies de análise e marketing">Recusar</button>
            <button class="lgpd-btn lgpd-btn--prefs"  data-action="prefs"  aria-label="Gerenciar preferências de cookies">Preferências</button>
            <button class="lgpd-btn lgpd-btn--accept" data-action="accept" aria-label="Aceitar todos os cookies">Aceitar tudo</button>
          </div>
        </div>
      </aside>`;
    return div.firstElementChild.nextElementSibling; // skip <style>, get <aside>
  }

  function createModal() {
    const cats = consent.categories;
    const div = document.createElement('div');
    div.className = 'lgpd-modal-backdrop';
    div.setAttribute('role', 'dialog');
    div.setAttribute('aria-modal', 'true');
    div.setAttribute('aria-labelledby', 'lgpd-modal-title');
    div.innerHTML = `
      <div class="lgpd-modal">
        <h2 class="lgpd-modal__title" id="lgpd-modal-title">Gerenciar preferências de cookies</h2>
        <p class="lgpd-modal__sub">
          Controle quais tecnologias de rastreamento permitimos.
          <a href="politica-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.
        </p>

        <div class="lgpd-toggle-row">
          <div class="lgpd-toggle-label">
            <b>Cookies essenciais</b>
            <span>Necessários para o funcionamento do site (segurança, formulários, preferências de navegação). Sempre ativos.</span>
          </div>
          <label class="lgpd-toggle" aria-label="Cookies essenciais — sempre ativos">
            <input type="checkbox" checked disabled aria-checked="true">
            <span class="lgpd-toggle-track"></span>
          </label>
        </div>

        <div class="lgpd-toggle-row">
          <div class="lgpd-toggle-label">
            <b>Análise de tráfego</b>
            <span>Google Analytics — entender quais páginas são mais visitadas, tempo de sessão e origem do tráfego. Dados anonimizados.</span>
          </div>
          <label class="lgpd-toggle" aria-label="Análise de tráfego">
            <input type="checkbox" data-cat="analytics" ${cats.analytics ? 'checked' : ''} aria-checked="${cats.analytics}">
            <span class="lgpd-toggle-track"></span>
          </label>
        </div>

        <div class="lgpd-toggle-row">
          <div class="lgpd-toggle-label">
            <b>Marketing e remarketing</b>
            <span>Google Ads e plataformas similares para medir eficiência de campanhas e exibir anúncios relevantes. Não ativamos no momento.</span>
          </div>
          <label class="lgpd-toggle" aria-label="Marketing e remarketing">
            <input type="checkbox" data-cat="marketing" ${cats.marketing ? 'checked' : ''} aria-checked="${cats.marketing}">
            <span class="lgpd-toggle-track"></span>
          </label>
        </div>

        <div class="lgpd-modal__footer">
          <button class="lgpd-btn lgpd-btn--reject" data-action="reject-modal">Recusar tudo</button>
          <button class="lgpd-btn lgpd-btn--accept" data-action="save-prefs">Salvar preferências</button>
        </div>
      </div>`;
    return div;
  }

  /* -----------------------------------------------------------------------
     Injeção e remoção de banner
  ----------------------------------------------------------------------- */
  function injectBanner() {
    if (consentGiven() || window.LGPD._banner) return;
    const banner = createBanner();
    document.body.appendChild(banner);
    window.LGPD._banner = banner;

    banner.querySelector('[data-action="reject"]').addEventListener('click', () => handleConsent('rejected'));
    banner.querySelector('[data-action="accept"]').addEventListener('click', () => handleConsent('accepted'));
    banner.querySelector('[data-action="prefs"]').addEventListener('click', openModal);
  }

  function removeBanner() {
    if (window.LGPD._banner) {
      window.LGPD._banner.remove();
      window.LGPD._banner = null;
    }
  }

  function openModal() {
    if (window.LGPD._modal) return;
    const modal = createModal();
    document.body.appendChild(modal);
    window.LGPD._modal = modal;

    // Focus first interactive inside modal
    setTimeout(() => {
      const first = modal.querySelector('input:not([disabled]), button');
      if (first) first.focus();
    }, 50);

    modal.querySelector('[data-action="reject-modal"]').addEventListener('click', () => {
      handleConsent('rejected');
      closeModal();
    });

    modal.querySelector('[data-action="save-prefs"]').addEventListener('click', () => {
      const analytics = !!modal.querySelector('[data-cat="analytics"]').checked;
      const marketing = !!modal.querySelector('[data-cat="marketing"]').checked;
      handleConsentCustom({ analytics, marketing, preferences: false });
      closeModal();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Close on Escape
    const onKeydown = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKeydown); } };
    document.addEventListener('keydown', onKeydown);
  }

  function closeModal() {
    if (window.LGPD._modal) {
      window.LGPD._modal.remove();
      window.LGPD._modal = null;
    }
  }

  /* -----------------------------------------------------------------------
     Handlers de decisão
  ----------------------------------------------------------------------- */
  function handleConsent(decision) {
    if (decision === 'accepted') {
      consent.status = 'accepted';
      consent.categories = { analytics: true, marketing: true, preferences: true };
      loadDeferredTrackers();
    } else {
      consent.status = 'rejected';
      consent.categories = { analytics: false, marketing: false, preferences: false };
    }
    saveConsent();
    removeBanner();
    dispatchEvent();
  }

  function handleConsentCustom(cats) {
    const anyEnabled = cats.analytics || cats.marketing;
    consent.status = anyEnabled ? 'custom' : 'rejected';
    consent.categories = cats;
    saveConsent();
    removeBanner();
    if (cats.analytics) loadDeferredTrackers();
    dispatchEvent();
  }

  function dispatchEvent() {
    document.dispatchEvent(new CustomEvent('lgpd-consent-changed', {
      detail: { status: consent.status, categories: consent.categories }
    }));
  }

  function consentGiven() {
    return ['accepted', 'rejected', 'custom'].includes(consent.status);
  }

  /* -----------------------------------------------------------------------
     API Pública
  ----------------------------------------------------------------------- */
  window.LGPD.hasConsent = function (category = 'analytics') {
    return consentGiven() && consent.categories[category] === true;
  };

  window.LGPD.getConsent = function () {
    return JSON.parse(JSON.stringify(consent));
  };

  window.LGPD.reset = function () {
    consent = { status: 'not-asked', timestamp: null, categories: { analytics: false, marketing: false, preferences: false } };
    try { localStorage.removeItem(CFG.storageKey); } catch (e) {}
    setTimeout(injectBanner, 100);
  };

  window.LGPD.showBanner = function () { injectBanner(); };
  window.LGPD.openPreferences = function () { openModal(); };

  /* -----------------------------------------------------------------------
     Inicialização
  ----------------------------------------------------------------------- */
  function init() {
    loadConsent();
    if (consent.status === 'accepted' || (consent.status === 'custom' && consent.categories.analytics)) {
      loadDeferredTrackers();
    }
    if (!consentGiven()) {
      setTimeout(injectBanner, CFG.bannerDelay);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
