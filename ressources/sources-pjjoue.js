(() => {
  'use strict';
  const zone = document.querySelector('#listeSources');
  const compteur = document.querySelector('#nombreSources');
  const sources = Object.values(window.DONNEES_PJJ?.SOURCES || {});

  function ajouterTexteDefinition(liste, titre, valeur) {
    const ligne = document.createElement('div');
    const terme = document.createElement('dt');
    const description = document.createElement('dd');
    terme.textContent = titre;
    description.textContent = valeur || 'Non renseigné';
    ligne.append(terme, description);
    liste.appendChild(ligne);
  }

  function construireFiche(source) {
    const fiche = document.createElement('article');
    const titre = document.createElement('h2');
    const lien = document.createElement('a');
    const details = document.createElement('dl');
    const libelle = source.titre || 'Source officielle';
    fiche.className = 'source-fiche';
    lien.textContent = libelle;
    lien.href = source.url || '#';
    lien.target = '_blank';
    lien.rel = 'noopener noreferrer';
    lien.setAttribute('aria-label', `${libelle} (nouvel onglet)`);
    titre.appendChild(lien);
    ajouterTexteDefinition(details, 'Repère précis', source.repere);
    ajouterTexteDefinition(details, 'Date de vérification', source.dateVerification);
    ajouterTexteDefinition(details, 'Statut', source.statutSource);
    ajouterTexteDefinition(details, 'Traitement pédagogique', source.traitementEditorial);
    fiche.append(titre, details);
    return fiche;
  }

  sources.sort((a, b) => String(a.titre).localeCompare(String(b.titre), 'fr'))
    .forEach(source => zone?.appendChild(construireFiche(source)));
  const recherche = document.querySelector('#rechercheSources');
  const normaliser = valeur => valeur.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const fiches = [...(zone?.querySelectorAll('.source-fiche') || [])].map(fiche => ({ fiche, texte: normaliser(fiche.textContent) }));
  const filtrer = () => {
    const mots = normaliser(recherche?.value.trim() || '').split(/\s+/).filter(Boolean);
    let visibles = 0;
    fiches.forEach(({ fiche, texte }) => {
      fiche.hidden = !mots.every(mot => texte.includes(mot));
      if (!fiche.hidden) visibles++;
    });
    if (compteur) compteur.textContent = mots.length ? `${visibles} source${visibles > 1 ? 's' : ''} trouvée${visibles > 1 ? 's' : ''} sur ${sources.length}` : `${sources.length} sources officielles référencées`;
  };
  recherche?.addEventListener('input', filtrer);
  filtrer();
})();
