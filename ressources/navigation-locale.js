(function () {
  'use strict';

  if (window.location.protocol !== 'file:') {
    return;
  }

  document.querySelectorAll('a[href]').forEach((lien) => {
    const href = lien.getAttribute('href');

    if (!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:|javascript:|data:|blob:)/i.test(href)) {
      return;
    }

    const correspondance = href.match(/^([^?#]*)([?#].*)?$/);
    if (!correspondance) {
      return;
    }

    const chemin = correspondance[1];
    const suffixe = correspondance[2] || '';

    if (!chemin.endsWith('/')) {
      return;
    }

    lien.setAttribute('href', `${chemin}index.html${suffixe}`);
  });
})();
