// Extensão do form para assistência: adiciona campo "marca" à mensagem do WhatsApp
    (function () {
      'use strict';
      // Aguarda a inicialização do app.js e sobrescreve o submit do form de assistência
      function extendForm() {
        const form = document.getElementById('quoteForm');
        if (!form) return;
        // Adiciona campo marca à mensagem — só precisa interceptar antes do submit do app.js
        // app.js já lida com o submit; aqui adicionamos o campo extra via data-ctx trick
        // O campo "marca" será incluído via textarea automático pelo script abaixo
        form.addEventListener('submit', function () {
          const marca = document.getElementById('marca');
          const msg = document.getElementById('msg');
          if (marca && marca.value && msg) {
            const labels = { motorola: 'Motorola', hytera: 'Hytera', intelbras: 'Intelbras' };
            const marcaLabel = labels[marca.value] || marca.value;
            if (msg.value && !msg.value.includes('Marca:')) {
              msg.value = 'Marca: ' + marcaLabel + '\n' + msg.value;
            } else if (!msg.value) {
              msg.value = 'Marca: ' + marcaLabel;
            }
          }
        }, true); // capture: true para rodar antes do app.js
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', extendForm);
      } else {
        extendForm();
      }
    })();
