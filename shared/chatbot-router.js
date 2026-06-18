/* =========================================================================
   ABC Mais Telecom — Bot de PRÉ-ATENDIMENTO ROTEADOR (protótipo, vanilla JS)
   -------------------------------------------------------------------------
   ABC-56 (CEO). Evolução do shared/chatbot.js (single-número) para MULTI-NÚMERO.
   A empresa tem 3 WhatsApps: COMERCIAL, VENDAS e LOCAÇÃO. Este widget:
     1) acolhe humanizado (estilo Leadster, pede o nome, se apresenta);
     2) qualifica B2B (modalidade -> segmento -> quantidade -> prazo);
     3) faz STORYTELLING / quebra de objeção ("por que a ABC", commodity ->
        atendimento impecável) no momento certo, sem ser empurrão;
     4) ROTEIA para o número certo conforme a necessidade, com a mensagem
        de resumo já pronta — sem perder a qualidade do chat.

   ⚠️ SANDBOX (ordem do CEO, 10/06): CFG.sandbox = true => o bot NÃO dispara
   WhatsApp/e-mail real. Ele MOSTRA exatamente a mensagem e o número-destino
   que SERIAM abertos (preview/simulação). Toda a lógica de roteamento é real;
   só a transmissão fica desligada até o Paulo liberar (CFG.sandbox = false).
   Sem funcionalidade fantasma: a URL wa.me roteada é montada de verdade e
   exibida; apenas não é transmitida.

   SEM BACKEND, SEM IA, SEM DEPENDÊNCIA. 1 arquivo JS + 1 <script> por página.
   ========================================================================= */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     CONFIG
     ----------------------------------------------------------------------
     Os 3 canais. Números VENDAS e LOCAÇÃO são [CONFIRMAR com o Paulo] — até
     lá apontam para o número comercial conhecido (mesmo do header do site),
     para o protótipo funcionar sem inventar número. Marcados como confirmar:false.
  ---------------------------------------------------------------------- */
  var CFG = {
    sandbox: true,                 // true = não transmite (só simula). SÓ o Paulo muda para false.
    autoOpenDelayMs: 0,            // 0 = não abre sozinho (proativo é decisão do Paulo)
    email: 'comercial@abcmais.com.br',
    n8nWebhookUrl: ''              // futuro: registrar/distribuir via n8n (desligado)
  };

  // Catálogo de canais. number = E.164 sem '+'. confirmed=false => placeholder.
  var CHANNELS = {
    comercial: {
      key: 'comercial',
      label: 'Comercial / Geral',
      number: '551139961976',      // conhecido (header do site)
      confirmed: true,
      pitch: 'time comercial'
    },
    vendas: {
      key: 'vendas',
      label: 'Vendas',
      number: '551139961976',      // [CONFIRMAR] nº de Vendas — usando comercial até confirmar
      confirmed: false,
      pitch: 'time de vendas'
    },
    locacao: {
      key: 'locacao',
      label: 'Locação',
      number: '551139961976',      // [CONFIRMAR] nº de Locação — usando comercial até confirmar
      confirmed: false,
      pitch: 'time de locação'
    }
  };

  // Roteamento: modalidade escolhida -> canal de destino.
  // Assistência e "avaliando" caem no COMERCIAL (triagem/geral), pois os 3
  // números do CEO são comercial/vendas/locação (assistência ainda [CONFIRMAR]).
  function routeFor(lead) {
    switch (lead.modalidade_tag) {
      case 'venda':       return CHANNELS.vendas;
      case 'locacao':     return CHANNELS.locacao;
      case 'assistencia': return CHANNELS.comercial;
      default:            return CHANNELS.comercial; // avaliando / desconhecido
    }
  }

  /* ----------------------------------------------------------------------
     PERSONA (humanizada — nome real de atendente fica a critério do Paulo)
  ---------------------------------------------------------------------- */
  var PERSONA = {
    name: 'Marina',
    title: 'Marina · Atendimento ABC',
    sub: 'Radiocomunicação: venda, locação e assistência',
    launch: 'Posso ajudar?'
  };

  /* ----------------------------------------------------------------------
     FLUXO
  ---------------------------------------------------------------------- */
  function greeting() {
    return 'Oi! Eu sou a ' + PERSONA.name + ', do atendimento da ABC Mais Telecom. 😊 '
      + 'Em pouquinhos cliques eu já te encaminho pro time certo, sem enrolação. '
      + 'Pra começar, como é o seu nome?';
  }

  var STEPS = [
    {
      id: 'modalidade',
      // pergunta dinâmica (usa o nome) — ver renderStep
      options: [
        { v: 'Quero comprar rádios',            tag: 'venda' },
        { v: 'Quero alugar (locação)',          tag: 'locacao' },
        { v: 'Assistência / manutenção',        tag: 'assistencia' },
        { v: 'Ainda estou avaliando',           tag: 'avaliando' }
      ]
    },
    {
      id: 'segmento',
      bot: 'Perfeito. Pra qual tipo de operação é o uso? (isso me ajuda a indicar o rádio certo)',
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
      bot: 'Mais ou menos quantos rádios você imagina?',
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
      bot: 'E pra quando você precisa? (sem compromisso, é só pra eu priorizar seu atendimento)',
      options: [
        { v: 'É urgente (esta semana)' },
        { v: 'Nas próximas semanas' },
        { v: 'Este mês' },
        { v: 'Só pesquisando' }
      ]
    }
  ];

  // Storytelling / quebra de objeção por segmento — UMA frase de valor, no
  // momento certo (depois de qualificar, antes de pedir contato). Não agride
  // concorrente; conduz o cliente a valorizar o atendimento (doutrina ABC).
  var VALUE_BEAT = {
    venda:
      'Antes de te passar: todo mundo vende o mesmo rádio. O que muda é o pós. '
      + 'A ABC é revenda autorizada Motorola/Hytera há ~10 anos, com assistência '
      + 'especializada própria — se um dia der problema, você fala com gente que resolve, não some.',
    locacao:
      'Detalhe que faz diferença em locação: a ABC cuida da licença Anatel pra você e '
      + 'tem equipe local aqui no ABC. Você aluga e usa — sem dor de cabeça com burocracia.',
    assistencia:
      'Pode deixar comigo. A ABC tem assistência ESPECIALIZADA própria — '
      + 'a gente cuida de programação, bateria e reparo com quem entende de rádio.',
    avaliando:
      'Sem pressa! Pra te ajudar a decidir: a ABC é revenda autorizada há ~10 anos, '
      + 'atende aqui na região do ABC e dá suporte de verdade — não é loja de marketplace que some amanhã.'
  };

  var SUCCESS_MSG_LIVE =
    'Prontinho! Te encaminhei pro time certo e a conversa abriu numa nova aba com seu resumo. 👍';

  /* ----------------------------------------------------------------------
     ESTADO
  ---------------------------------------------------------------------- */
  var lead = {};
  var stepIndex = 0;
  var root, panel, body, launcher, routedPreview = null;

  /* ----------------------------------------------------------------------
     CSS scoped (.abcbot-*) — cores da marca (#3E38F2) + verde WhatsApp
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
    + '.abcbot__panel{position:fixed;right:20px;bottom:20px;width:min(390px,calc(100vw - 32px));max-height:min(660px,calc(100vh - 32px));'
    + 'display:none;flex-direction:column;background:#fff;border:1px solid #E7E9EF;border-radius:22px;overflow:hidden;'
    + 'box-shadow:0 32px 64px -28px rgba(24,24,60,.45),0 6px 18px -10px rgba(24,24,50,.18)}'
    + '.abcbot.open .abcbot__panel{display:flex;animation:abcbot-in .22s cubic-bezier(.16,1,.3,1)}'
    + '.abcbot.open .abcbot__launch{display:none}'
    + '@keyframes abcbot-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}'
    + '.abcbot__head{display:flex;align-items:center;gap:11px;padding:15px 16px;background:linear-gradient(135deg,#3E38F2,#2A24C9);color:#fff}'
    + '.abcbot__avatar{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;flex:0 0 auto;font-weight:700}'
    + '.abcbot__title{font-weight:700;font-size:14.5px}'
    + '.abcbot__sub{font-size:12px;opacity:.85;display:flex;align-items:center;gap:6px}'
    + '.abcbot__dot{width:7px;height:7px;border-radius:50%;background:#5cf08f;display:inline-block}'
    + '.abcbot__close{margin-left:auto;background:transparent;border:0;color:#fff;cursor:pointer;opacity:.85;padding:4px}'
    + '.abcbot__close:hover{opacity:1}.abcbot__close svg{width:20px;height:20px}'
    + '.abcbot__body{flex:1;overflow-y:auto;padding:16px 16px 8px;background:#F7F8FA;display:flex;flex-direction:column;gap:10px}'
    + '.abcbot__msg{max-width:88%;padding:10px 13px;border-radius:14px;font-size:14px}'
    + '.abcbot__msg--bot{align-self:flex-start;background:#fff;border:1px solid #EDEFF3;border-bottom-left-radius:5px;color:#27272A}'
    + '.abcbot__msg--user{align-self:flex-end;background:#3E38F2;color:#fff;border-bottom-right-radius:5px}'
    + '.abcbot__msg--value{align-self:flex-start;background:#F3F2FF;border:1px solid #DAD7FB;border-bottom-left-radius:5px;color:#2A2870;font-size:13.5px}'
    + '.abcbot__typing{align-self:flex-start;color:#9aa0ab;font-size:13px;padding:4px 6px}'
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
    + '.abcbot__route{align-self:stretch;background:#fff;border:1px solid #DCE0E8;border-radius:14px;padding:12px 13px;margin-top:2px}'
    + '.abcbot__route h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#2E29B8}'
    + '.abcbot__route .num{font-weight:700;color:#18181B;font-size:14px}'
    + '.abcbot__route pre{white-space:pre-wrap;word-break:break-word;background:#F7F8FA;border:1px solid #EDEFF3;border-radius:10px;padding:9px 11px;margin:8px 0 0;font-family:inherit;font-size:12.5px;color:#3F3F46}'
    + '.abcbot__sbx{align-self:stretch;background:#FFF8EC;border:1px solid #F0DDB4;color:#7a5a14;border-radius:10px;padding:8px 11px;font-size:12px;margin-top:2px}'
    + '.abcbot__foot{padding:9px 16px;background:#fff;border-top:1px solid #EDEFF3;font-size:11px;color:#71717A;text-align:center}'
    + '.abcbot__restart{background:none;border:0;color:#2E29B8;font-weight:600;cursor:pointer;font-size:12px;padding:6px}'
    + '@media (max-width:480px){.abcbot__panel{right:8px;bottom:8px;width:calc(100vw - 16px);max-height:calc(100vh - 16px)}.abcbot{right:12px;bottom:12px}}';

  var IC = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.2.84.85-3.12-.2-.32a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>'
  };

  /* Helpers DOM */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function scrollDown() { if (body) body.scrollTop = body.scrollHeight; }
  // Encoder idêntico ao chatbot.js (ABC-150 H-2): escapa os 5 chars (& < > " ')
  // para fechar também o contexto de atributo com aspas simples. Sem divergência
  // entre os dois chatbots.
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  }); }
  function addBot(text, variant) {
    body.appendChild(el('div', 'abcbot__msg ' + (variant === 'value' ? 'abcbot__msg--value' : 'abcbot__msg--bot'), esc(text)));
    scrollDown();
  }
  function addUser(text) { body.appendChild(el('div', 'abcbot__msg abcbot__msg--user', esc(text))); scrollDown(); }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || n; }

  /* "digitando..." humaniza o ritmo (curto, sem travar o fluxo) */
  function withTyping(fn) {
    var t = el('div', 'abcbot__typing', PERSONA.name + ' está digitando…');
    body.appendChild(t); scrollDown();
    setTimeout(function () { t.remove(); fn(); }, 480);
  }

  /* ----------------------------------------------------------------------
     FLUXO — nome -> qualificação -> value beat -> contato -> roteamento
  ---------------------------------------------------------------------- */
  function renderNameAsk() {
    addBot(greeting());
    var form = el('form', 'abcbot__form');
    form.noValidate = true;
    form.innerHTML =
      field('abcbot-firstname', 'Seu nome', 'text', 'Como posso te chamar?') +
      '<div class="abcbot__send"><button type="submit" class="abcbot__btn" style="background:#3E38F2;color:#fff">Continuar</button></div>';
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
      withTyping(function () {
        addBot('Prazer, ' + firstName(v) + '! Bora lá 👇');
        setTimeout(renderStep, 200);
      });
    });
  }

  function renderStep() {
    var step = STEPS[stepIndex];
    if (!step) { renderValueBeat(); return; }
    var prompt = step.bot;
    if (!prompt && step.id === 'modalidade') {
      prompt = 'O que você precisa hoje, ' + firstName(lead.nome) + '?';
    }
    addBot(prompt);
    var wrap = el('div', 'abcbot__opts');
    step.options.forEach(function (opt) {
      var b = el('button', 'abcbot__opt', esc(opt.v));
      b.type = 'button';
      b.addEventListener('click', function () {
        lead[step.id] = opt.v;
        if (opt.tag) lead[step.id + '_tag'] = opt.tag;
        addUser(opt.v);
        wrap.remove();
        stepIndex++;
        withTyping(renderStep);
      });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    scrollDown();
  }

  /* Storytelling / quebra de objeção: 1 frase de valor, conforme a modalidade */
  function renderValueBeat() {
    var beat = VALUE_BEAT[lead.modalidade_tag] || VALUE_BEAT.avaliando;
    addBot(beat, 'value');
    setTimeout(renderDataForm, 220);
  }

  function renderDataForm() {
    addBot('Me passa só um contato que o ' + routeFor(lead).pitch
      + ' da ABC já te retorna com a melhor opção, ' + firstName(lead.nome) + ':');
    var form = el('form', 'abcbot__form');
    form.noValidate = true;
    form.innerHTML =
      field('abcbot-empresa', 'Empresa (opcional)', 'text', 'Nome da empresa') +
      field('abcbot-contato', 'WhatsApp ou e-mail', 'text', '(11) 9 9999-9999 ou voce@empresa.com') +
      '<div class="abcbot__hint">Usamos só pra te responder. Sem spam.</div>' +
      '<div class="abcbot__send">'
        + '<button type="submit" class="abcbot__btn abcbot__btn--wa">' + IC.wa + 'Falar no WhatsApp certo</button>'
      + '</div>';
    body.appendChild(form);
    scrollDown();
    var fEmp = form.querySelector('#abcbot-empresa');
    var fCon = form.querySelector('#abcbot-contato');
    [fEmp, fCon].forEach(function (i) {
      i.addEventListener('input', function () { i.closest('.abcbot__field').classList.remove('invalid'); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!fCon.value.trim()) { fCon.closest('.abcbot__field').classList.add('invalid'); return; }
      lead.empresa = fEmp.value.trim();
      lead.contato = fCon.value.trim();
      form.remove();
      route();
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
     ROTEAMENTO + SAÍDA
  ---------------------------------------------------------------------- */
  function buildSummary(channel) {
    var labelMap = { modalidade: 'Interesse', segmento: 'Operação', quantidade: 'Quantidade', prazo: 'Prazo' };
    var lines = ['Olá, ABC! Vim pelo assistente do site (canal: ' + channel.label + '). Resumo:', ''];
    ['modalidade', 'segmento', 'quantidade', 'prazo'].forEach(function (k) {
      if (lead[k]) lines.push(labelMap[k] + ': ' + lead[k]);
    });
    lines.push('');
    lines.push('Nome: ' + (lead.nome || ''));
    if (lead.empresa) lines.push('Empresa: ' + lead.empresa);
    lines.push('Contato: ' + lead.contato);
    if (document.title) { lines.push(''); lines.push('Página: ' + document.title); }
    return lines.join('\n');
  }

  function route() {
    var channel = routeFor(lead);
    var summary = buildSummary(channel);
    var waUrl = 'https://wa.me/' + channel.number + '?text=' + encodeURIComponent(summary);
    routedPreview = { channel: channel, summary: summary, waUrl: waUrl };

    withTyping(function () {
      addBot('Achei o time certo pra você: ' + channel.label + '. '
        + (channel.confirmed ? '' : '(número em confirmação) ')
        + 'Vou te conectar com o resumo já preenchido 👇');

      if (CFG.sandbox) {
        renderSandboxPreview(channel, summary, waUrl);
      } else {
        window.open(waUrl, '_blank', 'noopener');
        sendToN8n(channel, summary);
        addBot(SUCCESS_MSG_LIVE);
        renderReopen(channel, waUrl);
      }
    });
  }

  /* SANDBOX: mostra exatamente o que SERIA enviado, sem transmitir. */
  function renderSandboxPreview(channel, summary, waUrl) {
    var box = el('div', 'abcbot__route');
    box.innerHTML =
      '<h4>Roteado para → ' + esc(channel.label) + '</h4>'
      + '<div class="num">WhatsApp destino: ' + esc(formatNum(channel.number))
      + (channel.confirmed ? '' : ' <span style="color:#b9892a">· a confirmar</span>') + '</div>'
      + '<pre>' + esc(summary) + '</pre>';
    body.appendChild(box);

    var sbx = el('div', 'abcbot__sbx',
      '🔒 <strong>Modo sandbox.</strong> Nada foi enviado. Quando o Paulo liberar '
      + '(<code>CFG.sandbox = false</code>), este passo abre o WhatsApp <strong>'
      + esc(formatNum(channel.number)) + '</strong> com a mensagem acima já preenchida.');
    body.appendChild(sbx);
    scrollDown();
  }

  function renderReopen(channel, waUrl) {
    var send = el('div', 'abcbot__send');
    var a = el('a', 'abcbot__btn abcbot__btn--wa', IC.wa + 'Abrir WhatsApp de novo');
    a.href = waUrl; a.target = '_blank'; a.rel = 'noopener';
    send.appendChild(a);
    body.appendChild(send);
    scrollDown();
  }

  function formatNum(n) {
    // 551139961976 -> +55 (11) 3996-1976  (best-effort, só exibição)
    var m = String(n).match(/^55(\d{2})(\d{4,5})(\d{4})$/);
    return m ? '+55 (' + m[1] + ') ' + m[2] + '-' + m[3] : '+' + n;
  }

  function sendToN8n(channel, summary) {
    if (!CFG.n8nWebhookUrl) return;
    try {
      fetch(CFG.n8nWebhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: lead, channel: channel.key, summary: summary, url: location.href })
      }).catch(function () {});
    } catch (e) {}
  }

  /* ----------------------------------------------------------------------
     MONTAGEM
  ---------------------------------------------------------------------- */
  function build() {
    if (document.querySelector('.abcbot')) return;
    var styleEl = el('style');
    styleEl.setAttribute('data-abcbot', '');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    root = el('div', 'abcbot');
    root.setAttribute('aria-live', 'polite');

    launcher = el('button', 'abcbot__launch');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Abrir atendimento da ABC');
    launcher.innerHTML = IC.chat + '<span>' + esc(PERSONA.launch) + '</span><span class="abcbot__badge"></span>';
    launcher.addEventListener('click', openPanel);

    panel = el('div', 'abcbot__panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Atendimento ABC Mais Telecom');
    panel.innerHTML =
      '<div class="abcbot__head">'
        + '<div class="abcbot__avatar">' + esc(PERSONA.name.charAt(0)) + '</div>'
        + '<div>'
          + '<div class="abcbot__title">' + esc(PERSONA.title) + '</div>'
          + '<div class="abcbot__sub"><span class="abcbot__dot"></span>' + esc(PERSONA.sub) + '</div>'
        + '</div>'
        + '<button class="abcbot__close" type="button" aria-label="Fechar">' + IC.close + '</button>'
      + '</div>'
      + '<div class="abcbot__body" id="abcbotBody"></div>'
      + '<div class="abcbot__foot">A ABC tem 3 canais — eu te levo no certo. '
        + '<button class="abcbot__restart" type="button" data-restart>Recomeçar</button></div>';

    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    body = panel.querySelector('#abcbotBody');
    panel.querySelector('.abcbot__close').addEventListener('click', closePanel);
    panel.querySelector('[data-restart]').addEventListener('click', restart);

    if (CFG.autoOpenDelayMs > 0) setTimeout(openPanel, CFG.autoOpenDelayMs);
  }

  function startFlow() { stepIndex = 0; lead = {}; routedPreview = null; renderNameAsk(); }
  function openPanel() { root.classList.add('open'); if (!body.childElementCount) startFlow(); }
  function closePanel() { root.classList.remove('open'); }
  function restart() { body.innerHTML = ''; startFlow(); }

  // expõe config p/ a página de demo poder mostrar o estado (read-only)
  window.ABCBOT_ROUTER = { CFG: CFG, CHANNELS: CHANNELS, getLead: function () { return lead; }, getRouted: function () { return routedPreview; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();

})();
