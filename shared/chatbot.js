/* =========================================================================
   ABC Mais Telecom — Chatbot de Captação (protótipo, vanilla JS, sem backend)
   -------------------------------------------------------------------------
   O QUE É: um widget de QUALIFICAÇÃO de lead (estilo Leadster), 100% no
   navegador. NÃO conversa em tempo real, NÃO usa IA, NÃO salva nada em
   servidor. Faz 4 a 6 perguntas curtas de qualificação B2B, coleta nome/
   empresa/contato e, no fim, monta uma mensagem pré-preenchida e abre o
   WhatsApp do comercial (wa.me/551139961976) OU um e-mail (mailto). O lead
   chega "mastigado" para o time humano fechar.

   SEM FUNCIONALIDADE FANTASMA:
   - Entrada: cliques do usuário nas opções + 3 campos de texto (nome/empresa/contato).
   - Processamento: monta um resumo de texto (função buildSummary()).
   - Saída real: window.open(wa.me?text=...) e/ou location.href = mailto:...
   - Estados: boas-vindas, perguntas, formulário, validação de erro, sucesso.
   - Nada é persistido. Não há endpoint. Quando houver n8n/CRM, ver
     sendToN8n() (desligado por padrão — só ativa com URL + decisão do Paulo).

   COMO USAR numa página: antes de </body>, depois de shared/app.js:
       <script src="shared/chatbot.js" defer></script>
   (em subpastas, defina window.ABC_BASE = '../' como já é feito no site.)

   DOUTRINA (OPERACAO-RESPOSTAS-PAULO.md): não prometer preço/prazo, não
   comparar com concorrente, não pedir dado sensível à toa, sem fotos de
   pessoas. Tom: ABC ajuda a escolher pela operação do cliente.
   ========================================================================= */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     CONFIG — números/e-mails reais da ABC (iguais ao header do site)
  ---------------------------------------------------------------------- */
  var CFG = {
    waNumber: '551139961976',                 // WhatsApp comercial (E.164 sem +)
    email:    'comercial@abcmais.com.br',     // e-mail comercial
    // Integração n8n: quando em sandbox/localhost, envia para webhook local.
    // Quando em produção, URL será atualizada via .env ou config.
    n8nWebhookUrl: (typeof window !== 'undefined' && window.location.hostname === 'localhost')
      ? 'http://localhost:5678/webhook/lead-abc'
      : '',                                   // produção: desligado até aprovação
    autoOpenDelayMs: 0                        // 0 = não abre sozinho (proativo desligado p/ decisão do Paulo)
  };

  /* ----------------------------------------------------------------------
     PERSONA (opcional, opt-in por página) — sem número real, só copy.
     Uma página pode definir, ANTES de carregar este script:
         window.ABCBOT_PERSONA = { name:'Marina', title:'Atendimento ABC',
           greetingFirstName:true, ... }
     Se nada for definido, mantém o comportamento padrão (retrocompatível —
     nenhuma página existente muda). Aqui só ajustamos rótulos/copy; o fluxo,
     a coleta de dados e a saída (WhatsApp/e-mail) continuam idênticos.
  ---------------------------------------------------------------------- */
  var P = (typeof window !== 'undefined' && window.ABCBOT_PERSONA) ? window.ABCBOT_PERSONA : {};
  var PERSONA = {
    name:        P.name        || '',                       // ex.: 'Marina' (sem persona => vazio)
    title:       P.title       || 'Assistente ABC',
    sub:         P.sub         || 'Radiocomunicação: venda, locação e assistência',
    launch:      P.launch      || 'Posso ajudar?',
    askName:     P.askName     !== false,                   // pedir o nome primeiro (default: sim)
    greetByName: P.greetByName !== false                    // usar o nome do cliente nas mensagens (default: sim)
  };

  /* ----------------------------------------------------------------------
     FLUXO DE QUALIFICAÇÃO — perguntas curtas (editável sem mexer no resto)
     Baseado na doutrina: modalidade -> segmento -> quantidade -> prazo.
     Cada passo: id, pergunta, opções (com value salvo no lead).
  ---------------------------------------------------------------------- */
  // Saudação inicial — usa a persona quando definida (acolhedora, se apresenta)
  function greeting() {
    if (PERSONA.name) {
      return 'Oi! Eu sou a ' + PERSONA.name + ', do atendimento da ABC. 😊 '
        + 'Vou te ajudar a encontrar a melhor solução em pouquinhos cliques. '
        + 'Pra começar, como é o seu nome?';
    }
    return 'Oi! Sou o assistente da ABC Mais Telecom. Em 30 segundos eu já te encaminho pro comercial certo. O que você precisa?';
  }

  var STEPS = [
    {
      id: 'modalidade',
      // bot definido dinamicamente em renderStep (usa o nome quando já temos)
      options: [
        { v: 'Venda (comprar rádios)',           tag: 'venda' },
        { v: 'Locação (alugar para um período)', tag: 'locacao' },
        { v: 'Assistência / manutenção',         tag: 'assistencia' },
        { v: 'Ainda estou avaliando',            tag: 'avaliando' }
      ]
    },
    {
      id: 'segmento',
      bot: 'Perfeito. Pra qual tipo de operação é o uso?',
      options: [
        { v: 'Evento / produção' },
        { v: 'Indústria / construção' },
        { v: 'Condomínio / facilities' },
        { v: 'Segurança / portaria' },
        { v: 'Logística / transporte' },
        { v: 'Outro' }
      ]
    },
    {
      id: 'quantidade',
      bot: 'Mais ou menos quantos rádios/equipamentos você imagina?',
      options: [
        { v: 'Até 5' },
        { v: '6 a 20' },
        { v: '21 a 50' },
        { v: 'Mais de 50' },
        { v: 'Não sei ainda' }
      ]
    },
    {
      id: 'prazo',
      bot: 'E pra quando você precisa? (sem compromisso, é só pra priorizar)',
      options: [
        { v: 'É urgente (esta semana)' },
        { v: 'Nas próximas semanas' },
        { v: 'Este mês' },
        { v: 'Só pesquisando' }
      ]
    }
  ];

  // Mensagem de transição antes de pedir os dados (sem prometer preço/prazo)
  var ASK_DATA_INTRO =
    'Show! Já tenho o essencial. Me passa só seu contato que o comercial te responde com a melhor solução pra sua operação:';

  var SUCCESS_MSG =
    'Prontinho! Seu resumo foi montado e o canal abriu numa nova aba. Se não abrir, use os botões abaixo. O comercial da ABC vai te responder. 👍';

  /* ----------------------------------------------------------------------
     ESTADO em memória (nada é persistido)
  ---------------------------------------------------------------------- */
  var lead = {};          // respostas de qualificação por id
  var stepIndex = 0;
  var root, panel, body, launcher, sentChannel = null;

  /* ----------------------------------------------------------------------
     CSS scoped (prefixo .abcbot-*) — não conflita com o site
     Usa as cores reais do tema (brand #3E38F2, verde WhatsApp).
  ---------------------------------------------------------------------- */
  var CSS = ''
    + '.abcbot,.abcbot *{box-sizing:border-box;font-family:inherit}'
    + '.abcbot{position:fixed;right:20px;bottom:20px;z-index:9999;font-size:15px;line-height:1.45;color:#18181B}'
    + '.abcbot__launch{display:flex;align-items:center;gap:10px;border:0;cursor:pointer;'
    + 'background:linear-gradient(135deg,#3E38F2,#2A24C9);color:#fff;padding:13px 18px;border-radius:999px;'
    + 'box-shadow:0 18px 38px -16px rgba(62,56,242,.55);font-weight:600;font-size:15px;transition:transform .2s,box-shadow .2s}'
    + '.abcbot__launch:hover{transform:translateY(-2px);box-shadow:0 22px 44px -16px rgba(62,56,242,.6)}'
    + '.abcbot__launch svg{width:22px;height:22px;flex:0 0 auto}'
    + '.abcbot__badge{position:absolute;top:-6px;right:-6px;width:14px;height:14px;border-radius:50%;background:#22b15a;border:2px solid #fff}'
    + '.abcbot__panel{position:fixed;right:20px;bottom:20px;width:min(380px,calc(100vw - 32px));max-height:min(640px,calc(100vh - 32px));'
    + 'display:none;flex-direction:column;background:#fff;border:1px solid #E7E9EF;border-radius:22px;overflow:hidden;'
    + 'box-shadow:0 32px 64px -28px rgba(24,24,60,.45),0 6px 18px -10px rgba(24,24,50,.18)}'
    + '.abcbot.open .abcbot__panel{display:flex;animation:abcbot-in .22s cubic-bezier(.16,1,.3,1)}'
    + '.abcbot.open .abcbot__launch{display:none}'
    + '@keyframes abcbot-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}'
    + '.abcbot__head{display:flex;align-items:center;gap:11px;padding:15px 16px;background:linear-gradient(135deg,#3E38F2,#2A24C9);color:#fff}'
    + '.abcbot__avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;flex:0 0 auto}'
    + '.abcbot__avatar svg{width:21px;height:21px}'
    + '.abcbot__title{font-weight:700;font-size:15px}'
    + '.abcbot__sub{font-size:12px;opacity:.85;display:flex;align-items:center;gap:6px}'
    + '.abcbot__dot{width:7px;height:7px;border-radius:50%;background:#5cf08f;display:inline-block}'
    + '.abcbot__close{margin-left:auto;background:transparent;border:0;color:#fff;cursor:pointer;opacity:.85;padding:4px}'
    + '.abcbot__close:hover{opacity:1}.abcbot__close svg{width:20px;height:20px}'
    + '.abcbot__body{flex:1;overflow-y:auto;padding:16px 16px 8px;background:#F7F8FA;display:flex;flex-direction:column;gap:10px}'
    + '.abcbot__msg{max-width:85%;padding:10px 13px;border-radius:14px;font-size:14px}'
    + '.abcbot__msg--bot{align-self:flex-start;background:#fff;border:1px solid #EDEFF3;border-bottom-left-radius:5px;color:#27272A}'
    + '.abcbot__msg--user{align-self:flex-end;background:#3E38F2;color:#fff;border-bottom-right-radius:5px}'
    + '.abcbot__opts{display:flex;flex-direction:column;gap:8px;margin-top:2px}'
    + '.abcbot__opt{text-align:left;border:1px solid #D6DAE3;background:#fff;color:#2E29B8;font-weight:600;font-size:14px;'
    + 'padding:10px 13px;border-radius:12px;cursor:pointer;transition:border-color .15s,background .15s,transform .1s}'
    + '.abcbot__opt:hover{border-color:#3E38F2;background:rgba(62,56,242,.06);transform:translateX(2px)}'
    + '.abcbot__form{display:flex;flex-direction:column;gap:9px;margin-top:2px}'
    + '.abcbot__field label{display:block;font-size:12px;font-weight:600;color:#52525B;margin-bottom:4px}'
    + '.abcbot__field input{width:100%;border:1px solid #D6DAE3;border-radius:11px;padding:10px 12px;font-size:14px;color:#18181B;background:#fff}'
    + '.abcbot__field input:focus{outline:0;border-color:#3E38F2;box-shadow:0 0 0 3px rgba(62,56,242,.12)}'
    + '.abcbot__field.invalid input{border-color:#D23B3B;box-shadow:0 0 0 3px rgba(210,59,59,.12)}'
    + '.abcbot__err{display:none;font-size:11.5px;color:#D23B3B;margin-top:3px}'
    + '.abcbot__field.invalid .abcbot__err{display:block}'
    + '.abcbot__hint{font-size:11px;color:#71717A;margin-top:2px}'
    + '.abcbot__send{display:flex;flex-direction:column;gap:8px;margin-top:4px}'
    + '.abcbot__btn{display:flex;align-items:center;justify-content:center;gap:8px;border:0;cursor:pointer;font-weight:700;font-size:14px;padding:12px 14px;border-radius:12px;transition:transform .12s,filter .15s}'
    + '.abcbot__btn:hover{transform:translateY(-1px);filter:brightness(1.03)}'
    + '.abcbot__btn svg{width:18px;height:18px}'
    + '.abcbot__btn--wa{background:#22b15a;color:#fff}'
    + '.abcbot__btn--mail{background:#fff;color:#2E29B8;border:1px solid #D6DAE3}'
    + '.abcbot__foot{padding:9px 16px;background:#fff;border-top:1px solid #EDEFF3;font-size:11px;color:#71717A;text-align:center}'
    + '.abcbot__restart{background:none;border:0;color:#2E29B8;font-weight:600;cursor:pointer;font-size:12px;padding:6px}'
    + '@media (max-width:480px){.abcbot__panel{right:8px;bottom:8px;width:calc(100vw - 16px);max-height:calc(100vh - 16px)}.abcbot{right:12px;bottom:12px}}';

  /* ----------------------------------------------------------------------
     SVGs
  ---------------------------------------------------------------------- */
  var IC = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.2.84.85-3.12-.2-.32a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
  };

  /* ----------------------------------------------------------------------
     Helpers DOM
  ---------------------------------------------------------------------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function scrollDown() { if (body) body.scrollTop = body.scrollHeight; }
  // HTML-encode REAL (anti-XSS): el() injeta via innerHTML, então todo texto que
  // passa por esc() (nome livre do lead, mensagens, opções, persona) precisa ter
  // < > & " ' neutralizados. Sem isso, "Seu nome" = <img src=x onerror=...> executa.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function addBot(text)  { body.appendChild(el('div', 'abcbot__msg abcbot__msg--bot', esc(text))); scrollDown(); }
  function addUser(text) { body.appendChild(el('div', 'abcbot__msg abcbot__msg--user', esc(text))); scrollDown(); }

  /* ----------------------------------------------------------------------
     FLUXO
  ---------------------------------------------------------------------- */
  /* Pergunta acolhedora pelo nome ANTES da qualificação (só quando há persona
     com askName). Captura lead.nome para personalizar o resto da conversa. */
  function renderNameAsk() {
    addBot(greeting());
    var form = el('form', 'abcbot__form');
    form.noValidate = true;
    form.innerHTML =
      field('abcbot-firstname', 'Seu nome', 'text', 'Como posso te chamar?') +
      '<div class="abcbot__send">'
        + '<button type="submit" class="abcbot__btn abcbot__btn--wa" style="background:#3E38F2">Continuar</button>'
      + '</div>';
    body.appendChild(form);
    scrollDown();
    var fn = form.querySelector('#abcbot-firstname');
    fn.addEventListener('input', function () { fn.closest('.abcbot__field').classList.remove('invalid'); });
    setTimeout(function () { try { fn.focus(); } catch (e) {} }, 60);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = fn.value.trim();
      if (!v) { fn.closest('.abcbot__field').classList.add('invalid'); return; }
      lead.nome = v;
      addUser(v);
      form.remove();
      var hi = PERSONA.greetByName
        ? ('Prazer, ' + firstName(v) + '! Bora lá 👇')
        : 'Show, bora lá 👇';
      addBot(hi);
      setTimeout(renderStep, 280);
    });
  }

  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || n; }

  function renderStep() {
    var step = STEPS[stepIndex];
    if (!step) { renderDataForm(); return; }
    // pergunta dinâmica do 1º passo (incorpora o nome quando já temos)
    var prompt = step.bot;
    if (!prompt && step.id === 'modalidade') {
      if (lead.nome && PERSONA.greetByName) {
        prompt = 'O que você precisa hoje, ' + firstName(lead.nome) + '?';
      } else {
        prompt = greeting();
      }
    }
    addBot(prompt);
    var wrap = el('div', 'abcbot__opts');
    step.options.forEach(function (opt) {
      var b = el('button', 'abcbot__opt', esc(opt.v));
      b.type = 'button';
      b.addEventListener('click', function () {
        lead[step.id] = opt.v;
        addUser(opt.v);
        wrap.remove();           // remove as opções (já escolheu)
        stepIndex++;
        setTimeout(renderStep, 250);
      });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    scrollDown();
  }

  function renderDataForm() {
    // se já temos o nome (fluxo da persona), não pedimos de novo — só o contato
    var haveName = !!(lead.nome && lead.nome.trim());
    var intro = haveName
      ? (PERSONA.greetByName
          ? ('Perfeito, ' + firstName(lead.nome) + '! Me passa só um contato que o time da ABC já te retorna com a melhor opção pra sua operação:')
          : 'Perfeito! Me passa só um contato que o time da ABC já te retorna:')
      : ASK_DATA_INTRO;
    addBot(intro);

    var form = el('form', 'abcbot__form');
    form.noValidate = true;
    form.innerHTML =
      (haveName ? '' : field('abcbot-nome', 'Seu nome', 'text', 'Como podemos te chamar?')) +
      field('abcbot-empresa', 'Empresa (opcional)', 'text', 'Nome da empresa') +
      field('abcbot-contato', 'WhatsApp ou e-mail', 'text', '(11) 9 9999-9999 ou voce@empresa.com') +
      '<div class="abcbot__hint">Usamos só pra te responder. Sem spam.</div>' +
      '<div class="abcbot__send">'
        + '<button type="submit" class="abcbot__btn abcbot__btn--wa">' + IC.wa + 'Enviar pelo WhatsApp</button>'
        + '<button type="button" class="abcbot__btn abcbot__btn--mail" data-mail>' + IC.mail + 'Prefiro por e-mail</button>'
      + '</div>';
    body.appendChild(form);
    scrollDown();

    var fNome = form.querySelector('#abcbot-nome');   // pode não existir (persona)
    var fEmp  = form.querySelector('#abcbot-empresa');
    var fCon  = form.querySelector('#abcbot-contato');
    [fNome, fEmp, fCon].forEach(function (i) {
      if (!i) return;
      i.addEventListener('input', function () { i.closest('.abcbot__field').classList.remove('invalid'); });
    });

    function validate() {
      var ok = true;
      if (fNome && !fNome.value.trim()) { fNome.closest('.abcbot__field').classList.add('invalid'); ok = false; }
      if (!fCon.value.trim())  { fCon.closest('.abcbot__field').classList.add('invalid'); ok = false; }
      return ok;
    }
    function collect() {
      if (fNome) lead.nome = fNome.value.trim();        // mantém o nome já capturado se não houver campo
      lead.empresa = fEmp.value.trim();
      lead.contato = fCon.value.trim();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      collect();
      sendWhatsApp();
      finish(form, 'WhatsApp');
    });
    form.querySelector('[data-mail]').addEventListener('click', function () {
      if (!validate()) return;
      collect();
      sendEmail();
      finish(form, 'e-mail');
    });
  }

  function field(id, label, type, ph) {
    // esc() em TODOS os valores interpolados: hoje os callers passam literais, mas
    // sem isso um caller futuro com dado dinâmico (ex.: ph = lead.nome) viraria XSS
    // de atributo ("><img src=x onerror=...>). Defense-in-depth, ABC-150 H-1.
    return '<div class="abcbot__field">'
      + '<label for="' + esc(id) + '">' + esc(label) + '</label>'
      + '<input id="' + esc(id) + '" type="' + esc(type) + '" placeholder="' + esc(ph) + '" autocomplete="off">'
      + '<div class="abcbot__err">Campo obrigatório</div>'
      + '</div>';
  }

  /* ----------------------------------------------------------------------
     SAÍDA REAL — monta resumo e encaminha (WhatsApp / e-mail)
  ---------------------------------------------------------------------- */
  function buildSummary() {
    var labelMap = {
      modalidade: 'Interesse',
      segmento: 'Operação',
      quantidade: 'Quantidade',
      prazo: 'Prazo'
    };
    var lines = ['Olá, ABC! Vim pelo assistente do site. Resumo do meu pedido:', ''];
    STEPS.forEach(function (s) {
      if (lead[s.id]) lines.push(labelMap[s.id] + ': ' + lead[s.id]);
    });
    lines.push('');
    lines.push('Nome: ' + lead.nome);
    if (lead.empresa) lines.push('Empresa: ' + lead.empresa);
    lines.push('Contato: ' + lead.contato);
    var page = document.title ? ('Página: ' + document.title) : '';
    if (page) { lines.push(''); lines.push(page); }
    return lines.join('\n');
  }

  function sendWhatsApp() {
    var url = 'https://wa.me/' + CFG.waNumber + '?text=' + encodeURIComponent(buildSummary());
    sentChannel = { type: 'wa', url: url };
    window.open(url, '_blank', 'noopener');
    sendToN8n(); // só dispara se CFG.n8nWebhookUrl estiver configurado (e autorizado)
  }

  function sendEmail() {
    var subject = 'Novo lead pelo site — ' + (lead.nome || '') + (lead.empresa ? ' (' + lead.empresa + ')' : '');
    var url = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildSummary());
    sentChannel = { type: 'mail', url: url };
    window.location.href = url;
    sendToN8n();
  }

  /* Integração n8n (ativa em localhost): envia o lead a um webhook do n8n para
     registrar/notificar/Telegram. Só roda se a URL estiver configurada. */
  function sendToN8n() {
    if (!CFG.n8nWebhookUrl) return;
    try {
      // Prepara payload com estrutura flat que o n8n webhook espera
      var payload = {
        nome: lead.nome,
        empresa: lead.empresa,
        modalidade: lead.modalidade,
        segmento: lead.segmento,
        quantidade: lead.quantidade,
        prazo: lead.prazo,
        telefone: lead.contato, // o n8n procura 'telefone'
        email: lead.email || '',
        summary: buildSummary(),
        origem: 'chatbot-site',
        ts: Date.now(),
        url: location.href
      };
      fetch(CFG.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) { /* silencioso: o WhatsApp/e-mail já garantiram o encaminhamento */ }
  }

  function finish(form, canalNome) {
    form.remove();
    addBot(SUCCESS_MSG);
    var send = el('div', 'abcbot__send');
    if (sentChannel) {
      var reopen = el('a', 'abcbot__btn ' + (sentChannel.type === 'wa' ? 'abcbot__btn--wa' : 'abcbot__btn--mail'),
        (sentChannel.type === 'wa' ? IC.wa : IC.mail) + 'Abrir ' + canalNome + ' de novo');
      reopen.href = sentChannel.url;
      if (sentChannel.type === 'wa') { reopen.target = '_blank'; reopen.rel = 'noopener'; }
      send.appendChild(reopen);
    }
    body.appendChild(send);
    scrollDown();
  }

  /* ----------------------------------------------------------------------
     MONTAGEM do widget
  ---------------------------------------------------------------------- */
  function build() {
    if (document.querySelector('.abcbot')) return; // não duplicar

    var styleEl = el('style');
    styleEl.setAttribute('data-abcbot', '');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    root = el('div', 'abcbot');
    root.setAttribute('aria-live', 'polite');

    // Launcher
    launcher = el('button', 'abcbot__launch');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Abrir assistente de atendimento da ABC');
    launcher.innerHTML = IC.chat + '<span>' + esc(PERSONA.launch) + '</span><span class="abcbot__badge"></span>';
    launcher.addEventListener('click', openPanel);

    // Painel
    panel = el('div', 'abcbot__panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Assistente ABC Mais Telecom');
    panel.innerHTML =
      '<div class="abcbot__head">'
        + '<div class="abcbot__avatar">' + IC.chat + '</div>'
        + '<div>'
          + '<div class="abcbot__title">' + esc(PERSONA.title) + '</div>'
          + '<div class="abcbot__sub"><span class="abcbot__dot"></span>' + esc(PERSONA.sub) + '</div>'
        + '</div>'
        + '<button class="abcbot__close" type="button" aria-label="Fechar">' + IC.close + '</button>'
      + '</div>'
      + '<div class="abcbot__body" id="abcbotBody"></div>'
      + '<div class="abcbot__foot">Suas respostas vão direto pro comercial da ABC. '
        + '<button class="abcbot__restart" type="button" data-restart>Recomeçar</button></div>';

    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    body = panel.querySelector('#abcbotBody');
    panel.querySelector('.abcbot__close').addEventListener('click', closePanel);
    panel.querySelector('[data-restart]').addEventListener('click', restart);

    if (CFG.autoOpenDelayMs > 0) setTimeout(openPanel, CFG.autoOpenDelayMs);
  }

  function startFlow() {
    stepIndex = 0; lead = {};
    // se há persona com pedido de nome, começa acolhendo e pedindo o nome
    if (PERSONA.name && PERSONA.askName) renderNameAsk();
    else renderStep();
  }
  function openPanel() {
    root.classList.add('open');
    if (!body.childElementCount) startFlow();
  }
  function closePanel() { root.classList.remove('open'); }
  function restart() {
    sentChannel = null;
    body.innerHTML = '';
    startFlow();
  }

  /* Boot */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();

})();
