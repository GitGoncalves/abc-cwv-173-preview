/* home1.main.js — reveal-on-scroll próprio da home1 (sem depender do data-reveal
   global). IntersectionObserver leve; degrada mostrando tudo se indisponível.
   Sem funcionalidade fantasma: só anima o que já existe no DOM. */
(function () {
  'use strict';
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-rev]'));
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
