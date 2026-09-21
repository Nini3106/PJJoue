(() => {
  'use strict';
  const tableau = document.querySelector('.page-sigles-cjpm .guide-tableau, .page-sigles-pjj .guide-tableau');
  if (!tableau) return;
  const lignes = [...tableau.querySelectorAll('tbody tr')];
  const normaliser = valeur => valeur.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const zone = document.createElement('label');
  zone.className = 'recherche-ressources';
  zone.textContent = 'Rechercher un sigle ou un mot';
  const champ = document.createElement('input');
  champ.type = 'search';
  champ.placeholder = 'Ex. : jugement, éducatif, service…';
  champ.autocomplete = 'off';
  const compteur = document.createElement('p');
  compteur.className = 'recherche-ressources-compteur';
  compteur.setAttribute('role', 'status');
  compteur.setAttribute('aria-live', 'polite');
  const entrees = lignes.map(ligne => ({ ligne, texte: normaliser(ligne.textContent) }));
  tableau.setAttribute('role', 'table');
  tableau.querySelectorAll('tr').forEach(ligne => ligne.setAttribute('role', 'row'));
  tableau.querySelectorAll('th').forEach(cellule => cellule.setAttribute('scope', 'col'));
  zone.append(champ);
  tableau.closest('.guide-tableau-conteneur').before(zone, compteur);
  const filtrer = () => {
    const mots = normaliser(champ.value.trim()).split(/\s+/).filter(Boolean);
    let visibles = 0;
    entrees.forEach(({ ligne, texte }) => {
      ligne.hidden = !mots.every(mot => texte.includes(mot));
      if (!ligne.hidden) visibles++;
    });
    compteur.textContent = visibles ? `${visibles} sigle${visibles > 1 ? 's' : ''} sur ${lignes.length}` : 'Aucun sigle trouvé. Essaie un autre mot.';
  };
  champ.addEventListener('input', filtrer);
  filtrer();
})();
