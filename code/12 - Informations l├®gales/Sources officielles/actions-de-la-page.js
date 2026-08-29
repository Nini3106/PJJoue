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
  if (compteur)
    compteur.textContent = `${sources.length} sources officielles référencées`;
})();
