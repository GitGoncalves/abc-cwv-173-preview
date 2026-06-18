/* home2.main.js — comportamento próprio da HOME v2 (editorial-premium).
   1) reveal-on-scroll via IntersectionObserver (degrada mostrando tudo).
   2) drag-to-scroll no rail horizontal de equipamentos (desktop), sem libs.
   Sem funcionalidade fantasma: só anima/percorre o que já existe no DOM. */
(function () {
  'use strict';

  /* ---- 1. reveal ---- */
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-rev]'));
  if (els.length) {
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          io.unobserve(en.target);
        });
      }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
      els.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- 2. drag-to-scroll do rail ---- */
  var rail = document.querySelector('.h2rail');
  if (rail && window.matchMedia('(pointer:fine)').matches) {
    var down = false, startX = 0, startScroll = 0, moved = false;

    rail.addEventListener('mousedown', function (e) {
      down = true; moved = false;
      startX = e.pageX;
      startScroll = rail.scrollLeft;
      rail.classList.add('dragging');
    });
    window.addEventListener('mouseup', function () {
      down = false; rail.classList.remove('dragging');
    });
    rail.addEventListener('mouseleave', function () {
      down = false; rail.classList.remove('dragging');
    });
    rail.addEventListener('mousemove', function (e) {
      if (!down) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startScroll - dx;
      if (moved) e.preventDefault();
    });
    // evita que o clique "fantasma" após arrastar dispare o link do card
    rail.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
})();
