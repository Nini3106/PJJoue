/**
 * Afficher le Parcours PJJ et ses étapes.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
function ouvrirParcours(identifiantTheme, optionsAffichage = {}) {
    etat.theme = identifiantTheme;
    sauvegarde.dernierTheme = identifiantTheme;
    enregistrerSauvegarde();
    const programme = PROGRAMMES[identifiantTheme];
    selectionner('#titreParcours').textContent = 'Parcours PJJ';
    selectionner('#sousTitreParcours').textContent = 'Explore, comprends et progresse à ton rythme à travers 11 étapes clés.';
    actualiserResumeCarteParcours(programme);
    afficherEtapes();
    afficherEcran('parcours', optionsAffichage);
}
const FICHIERS_ICONES_ETAPES = Object.freeze({
    1: 'icone-loupe-decouverte.svg',
    2: 'icone-public-accompagne.svg',
    3: 'icone-acteurs-justice.svg',
    4: 'icone-professionnels-pjj.svg',
    5: 'icone-organisation-pjj.svg',
    6: 'icone-formes-prise-en-charge.svg',
    7: 'icone-structure-ouverte-de-jour.svg',
    8: 'icone-activites-educatives.svg',
    9: 'icone-structures-placement.svg',
    10: 'icone-mesures-judiciaires.svg',
    11: 'icone-partenaires.svg'
});
function obtenirBaliseIconeEtape(numeroEtape) {
    const nomFichier = FICHIERS_ICONES_ETAPES[Number(numeroEtape)];
    if (!nomFichier)
        return '';
    return `<img src="ressources/icones-parcours/${nomFichier}" alt="" aria-hidden="true">`;
}
function afficherEtapes() {
    initialiserProgression(etat.theme);
    const ligneParcours1 = selectionner('#ligneParcours1');
    const ligneParcours2 = selectionner('#ligneParcours2');
    const ligneParcours3 = selectionner('#ligneParcours3');
    const cartesEtapesFinales = selectionner('#cartesEtapesFinales');
    ligneParcours1.innerHTML = '';
    ligneParcours2.innerHTML = '';
    ligneParcours3.innerHTML = '';
    cartesEtapesFinales.innerHTML = '';
    const programme = PROGRAMMES[etat.theme];
    synchroniserEtapesReussiesEnAutonomie(programme);
    let destinationActuelleSignalee = false;
    actualiserResumeCarteParcours(programme);
    function creerCarteEtape(etapeProgramme) {
        const nombreTraitees = compterQuestionsTraiteesEtape(etat.theme, etapeProgramme.id);
        const total = obtenirQuestionsEtape(etat.theme, etapeProgramme.id).length;
        const pourcentageTermine = total ? Math.round(nombreTraitees / total * 100) : 0;
        const etapeValideeEnAutonomie = obtenirBilanEtape(etat.theme, etapeProgramme.id)?.termineeSansJoker === true;
        const estDestinationActuelle = !destinationActuelleSignalee
            && (pourcentageTermine < 100 || !etapeValideeEnAutonomie);
        if (estDestinationActuelle)
            destinationActuelleSignalee = true;
        const carte = document.createElement('button');
        carte.type = 'button';
        carte.dataset.etape = String(etapeProgramme.id);
        carte.style.setProperty('--couleur-etape', etapeProgramme.couleur || '#ffc83d');
        carte.className = [
            'chemin-etape-carte',
            pourcentageTermine === 100 ? 'complete' : '',
            pourcentageTermine === 100 && !etapeValideeEnAutonomie ? 'a-valider' : '',
            etapeValideeEnAutonomie ? 'validee-sans-joker' : '',
            estDestinationActuelle ? 'destination-actuelle' : ''
        ].filter(Boolean).join(' ');
        carte.setAttribute('aria-label', `Étape ${etapeProgramme.id} — ${etapeProgramme.titre} — ${nombreTraitees} questions réalisées sur ${total}`);
        carte.innerHTML = `
      <span class="chemin-etape-icone" aria-hidden="true">${obtenirBaliseIconeEtape(etapeProgramme.id)}</span>
      <span class="chemin-etape-texte">
        <span class="chemin-etape-numero">ÉTAPE ${etapeProgramme.id}</span>
        <span class="chemin-etape-titre">${etapeProgramme.titre}</span>
      </span>
      ${estDestinationActuelle ? '<span class="chemin-position-actuelle">Tu es ici</span>' : ''}
      <span class="chemin-progression"><i style="width:${pourcentageTermine}%"></i></span>
      <span class="chemin-nombre">${etapeValideeEnAutonomie
            ? '<b>Validées sans jokers</b>'
            : `<b>${nombreTraitees}/${total}</b> questions`}</span>
    `;
        carte.onclick = () => lancerEtape(etat.theme, etapeProgramme.id);
        return carte;
    }
    for (const etapeProgramme of programme.etapes) {
        const carte = creerCarteEtape(etapeProgramme);
        if (etapeProgramme.id <= 3)
            ligneParcours1.appendChild(carte);
        else if (etapeProgramme.id <= 6)
            ligneParcours2.appendChild(carte);
        else if (etapeProgramme.id <= 9)
            ligneParcours3.appendChild(carte);
        else
            cartesEtapesFinales.appendChild(carte);
    }
    const evaluation = selectionner('#carteEvaluationFinale');
    const etapesTerminees = programme.etapes.filter(etapeProgramme =>
        compterQuestionsTraiteesEtape(etat.theme, etapeProgramme.id)
        === obtenirQuestionsEtape(etat.theme, etapeProgramme.id).length
    ).length;
    const parcoursSansJoker = programme.etapes.every(etapeProgramme => obtenirBilanEtape(etat.theme, etapeProgramme.id)?.termineeSansJoker === true);
    const evaluationDeverrouillee = etapesTerminees === programme.etapes.length && parcoursSansJoker;
    evaluation.disabled = !evaluationDeverrouillee;
    evaluation.setAttribute('aria-disabled', String(!evaluationDeverrouillee));
    evaluation.classList.toggle('deverrouillee', evaluationDeverrouillee);
    evaluation.querySelector('.evaluation-statut').textContent = evaluationDeverrouillee ? '50 questions · sans jokers' : 'Parcours sans jokers requis';
    evaluation.onclick = evaluationDeverrouillee ? lancerEvaluationFinale : null;
    actualiserCarnetParcours(programme);
    enregistrerSauvegarde();
}
