/**
 * Mettre à jour l’accueil et le bouton Commencer.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
function accorderLibelle(nombre, singulier, pluriel) {
    return Number(nombre) === 1 ? singulier : pluriel;
}
function actualiserLibellesProgression() {
    const experience = selectionner('#experienceProgression');
    if (experience) {
        const nombreDecouvertes = Number((experience.textContent || '').match(/\d+/)?.[0] || 0);
        const libelleDecouvertes = accorderLibelle(
            nombreDecouvertes,
            'découverte',
            'découvertes'
        );
        experience.innerHTML = `
            <span class="experience-valeur">${nombreDecouvertes}</span>
            <span class="experience-libelle">${libelleDecouvertes}</span>
        `;
    }
    const configurations = [
        ['questionsJoueesProgression', 'activité réalisée', 'activités réalisées'],
        ['erreursProgression', 'erreur active', 'erreurs actives'],
        ['etapesMaitriseesProgression', 'étape maîtrisée', 'étapes maîtrisées']
    ];
    configurations.forEach(([identifiant, singulier, pluriel]) => {
        const valeur = selectionner('#' + identifiant);
        const libelle = valeur?.parentElement?.querySelector('span');
        if (valeur && libelle)
            libelle.textContent = accorderLibelle(Number(valeur.textContent) || 0, singulier, pluriel);
    });
}
function actualiserAccueil() {
    if (PROGRAMMES.commun)
        synchroniserEtapesReussiesEnAutonomie(PROGRAMMES.commun);
    const experience = selectionner('#experienceProgression');
    const jouees = selectionner('#questionsJoueesProgression');
    const erreurs = selectionner('#erreursProgression');
    const maitrisees = selectionner('#etapesMaitriseesProgression');
    const decouvertes = compterEtapesDecouvertes();
    if (experience)
        experience.innerHTML = `<span class="experience-valeur">${decouvertes}</span><span class="experience-libelle">${accorderLibelle(decouvertes, 'découverte', 'découvertes')}</span>`;
    if (jouees)
        jouees.textContent = String(sauvegarde.nombreQuestionsJouees || 0);
    if (erreurs)
        erreurs.textContent = String(compterErreursActives());
    if (maitrisees)
        maitrisees.textContent = String(compterEtapesMaitrisees());
    actualiserLibellesProgression();
    actualiserBoutonCommencer();
    chargerParametres();
}
function calculerProgressionTheme(identifiantTheme) {
    initialiserProgression(identifiantTheme);
    const questionsTheme = QUESTIONS.filter(
        question => question.theme === identifiantTheme && !question.estEvaluationFinale
    );
    if (!questionsTheme.length)
        return 0;
    let nombreQuestionsTraitees = 0;
    obtenirEtapesProgramme(identifiantTheme).forEach(etapeProgramme => {
        nombreQuestionsTraitees += compterQuestionsTraiteesEtape(identifiantTheme, etapeProgramme.id);
    });
    return Math.round(nombreQuestionsTraitees / questionsTheme.length * 100);
}
function obtenirTitreSymboliqueParcours(nombreEtapesMaitrisees) {
    if (nombreEtapesMaitrisees >= 10)
        return 'Éclaireur de la PJJ';
    if (nombreEtapesMaitrisees >= 7)
        return 'Guide en devenir';
    if (nombreEtapesMaitrisees >= 4)
        return 'Connaisseur du parcours';
    if (nombreEtapesMaitrisees >= 1)
        return 'Explorateur de la PJJ';
    return 'Nouveau départ';
}
function obtenirEtapeAReprendre(programme) {
    return programme.etapes.find(etapeProgramme => {
        const nombreQuestions = obtenirQuestionsEtape(programme.id, etapeProgramme.id).length;
        const nombreQuestionsTraitees = compterQuestionsTraiteesEtape(programme.id, etapeProgramme.id);
        const bilanEtape = obtenirBilanEtape(programme.id, etapeProgramme.id);
        return nombreQuestionsTraitees < nombreQuestions || bilanEtape.termineeSansJoker !== true;
    }) || null;
}
function actualiserBoutonCommencer() {
    const bouton = selectionner('#boutonCommencer');
    const programme = PROGRAMMES.commun;
    if (!bouton || !programme)
        return;
    initialiserProgression(programme.id);
    const nombreQuestionsTraitees = programme.etapes.reduce(
        (total, etapeProgramme) => total + compterQuestionsTraiteesEtape(programme.id, etapeProgramme.id),
        0
    );
    if (nombreQuestionsTraitees === 0) {
        bouton.innerHTML = 'Commencer <span aria-hidden="true">→</span>';
        bouton.onclick = () => ouvrirParcours(programme.id);
        return;
    }
    const etapeAReprendre = obtenirEtapeAReprendre(programme);
    bouton.innerHTML = etapeAReprendre
        ? `Reprendre l’étape ${etapeAReprendre.id} <span aria-hidden="true">→</span>`
        : 'Voir mon carnet <span aria-hidden="true">→</span>';
    bouton.onclick = etapeAReprendre
        ? () => ouvrirParcours(programme.id)
        : () => afficherEcran('carnet');
}
