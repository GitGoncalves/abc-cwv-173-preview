/* ABC-153 — carregamento assíncrono de webfonts sem handler inline.
   Substitui onload="this.onload=null;this.rel='stylesheet'" (que dependia de
   'unsafe-inline' no script-src). Mesma técnica: o <link rel="preload" as="style"
   data-async-style> baixa a folha sem bloquear o render; ao terminar, vira
   rel="stylesheet" e aplica. <noscript> garante fallback sem JS.
   Robusto contra a corrida "load já disparou": além do listener, um fallback
   assíncrono promove o link mesmo que o evento load tenha passado. */
(function () {
  'use strict';
  function activate(link) {
    if (link.rel === 'stylesheet') return;
    link.onload = null;
    link.rel = 'stylesheet';
  }
  var links = document.querySelectorAll('link[rel="preload"][as="style"][data-async-style]');
  for (var i = 0; i < links.length; i++) {
    (function (link) {
      link.addEventListener('load', function () { activate(link); }, { once: true });
      /* fallback: se o load já disparou antes deste script, promove assim mesmo */
      (window.requestAnimationFrame || window.setTimeout)(function () { activate(link); }, 0);
    })(links[i]);
  }
})();
