/**
 * Afficher la page Progression.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
function construireCarteProgression(theme) {
    const progression = calculerProgressionTheme(theme.id);
    initialiserProgression(theme.id);
    const etapesProgramme = obtenirEtapesProgramme(theme.id);
    const nombreEtapesMaitrisees = etapesProgramme.filter(etapeProgramme =>
        estEtapeMaitrisee(theme.id, etapeProgramme.id)
    ).length;
    const carte = document.createElement('div');
    carte.className = 'carte tableau-carte';
    carte.innerHTML = `
        <h3 class="tableau-titre">
            ${creerIconeTheme(theme.id, theme.titre)}
            <span>${theme.titre}</span>
        </h3>
        <div class="barre" role="progressbar" aria-label="Progression dans ${theme.titre}"
            aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progression}">
            <i style="width:${progression}%"></i>
        </div>
        <p><b>${progression}%</b> du parcours guidé ${nombreEtapesMaitrisees}/${etapesProgramme.length} étapes terminées sans joker</p>`;
    return carte;
}

function afficherProgression() {
    actualiserAccueil();
    const zone = selectionner('#tableauProgression');
    zone.innerHTML = '';
    THEMES.forEach(theme => zone.appendChild(construireCarteProgression(theme)));
}

