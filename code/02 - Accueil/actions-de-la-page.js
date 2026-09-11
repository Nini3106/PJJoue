/**
 * PJJoue V1 — 02 - Accueil.
 *
 * Ce fichier est assemblé dans le moteur principal par le constructeur du site.
 * Les fonctions restent volontairement lisibles et nommées en français.
 * Les API natives du navigateur conservent leur nom technique.
 */
function accorderLibelle(nombre, singulier, pluriel) {
    return Number(nombre) === 1 ? singulier : pluriel;
}
function actualiserLibellesProgression() {
    const experience = selectionner('#experienceProgression');
    if (experience) {
        const nombreDecouvertes = Number((experience.textContent || '').match(/\d+/)?.[0] || 0);
        experience.textContent = String(nombreDecouvertes);
        const libelleExperience = experience.parentElement?.querySelector(':scope > span');
        if (libelleExperience)
            libelleExperience.textContent = accorderLibelle(nombreDecouvertes, 'Étape abordée', 'Étapes abordées');
    }
    const configurations = [
        ['questionsJoueesProgression', 'Question travaillée', 'Questions travaillées'],
        ['erreursProgression', 'Question à revoir', 'Questions à revoir'],
        ['etapesMaitriseesProgression', 'Étape maîtrisée', 'Étapes maîtrisées']
    ];
    configurations.forEach(([identifiant, singulier, pluriel]) => {
        const valeur = selectionner('#' + identifiant);
        const libelle = valeur?.parentElement?.querySelector('span');
        if (valeur && libelle)
            libelle.textContent = accorderLibelle(Number(valeur.textContent) || 0, singulier, pluriel);
    });
}
function actualiserAccueil() {
    Object.values(PROGRAMMES).forEach(programme => synchroniserEtapesReussiesEnAutonomie(programme));
    const experience = selectionner('#experienceProgression');
    const jouees = selectionner('#questionsJoueesProgression');
    const erreurs = selectionner('#erreursProgression');
    const maitrisees = selectionner('#etapesMaitriseesProgression');
    const decouvertes = compterEtapesDecouvertes();
    if (experience)
        experience.textContent = String(decouvertes);
    if (jouees)
        jouees.textContent = String(sauvegarde.nombreQuestionsJouees || 0);
    if (erreurs)
        erreurs.textContent = String(compterErreursActives());
    if (maitrisees)
        maitrisees.textContent = String(compterEtapesMaitrisees());
    actualiserLibellesProgression();
    actualiserBoutonCommencer();
    const boutonEntrainementLibreAccueil = selectionner('#boutonEntrainementLibreAccueil');
    if (boutonEntrainementLibreAccueil)
        boutonEntrainementLibreAccueil.hidden = sauvegarde.aDejaJoue !== true;
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
    if (nombreEtapesMaitrisees >= 22)
        return 'Éclaireur complet de la PJJ';
    if (nombreEtapesMaitrisees >= 17)
        return 'Guide du parcours judiciaire';
    if (nombreEtapesMaitrisees >= 11)
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
function obtenirProchaineActionParcoursComplet() {
    for (const theme of THEMES) {
        const programme = PROGRAMMES[theme.id];
        const etapeAReprendre = obtenirEtapeAReprendre(programme);
        if (etapeAReprendre)
            return { type: 'etape', theme: theme.id, etape: etapeAReprendre };
        if (!estEvaluationFinaleReussie(theme.id))
            return { type: 'evaluation', theme: theme.id };
    }
    return { type: 'carnet' };
}
function actualiserBoutonCommencer() {
    const bouton = selectionner('#boutonCommencer');
    if (!bouton)
        return;
    const action = obtenirProchaineActionParcoursComplet();
    const aucuneQuestionTraitee = THEMES.every(theme =>
        obtenirEtapesProgramme(theme.id).every(etape => compterQuestionsTraiteesEtape(theme.id, etape.id) === 0)
    );
    if (aucuneQuestionTraitee) {
        bouton.innerHTML = 'Choisir mon parcours <span aria-hidden="true">→</span>';
        bouton.onclick = () => ouvrirChoixParcours();
        return;
    }
    if (action.type === 'etape') {
        const numeroParcours = obtenirOrdreTheme(action.theme) + 1;
        bouton.innerHTML = `Reprendre le parcours ${numeroParcours} · étape ${action.etape.id} <span aria-hidden="true">→</span>`;
        bouton.onclick = () => ouvrirParcours(action.theme);
        return;
    }
    if (action.type === 'evaluation') {
        const numeroParcours = obtenirOrdreTheme(action.theme) + 1;
        bouton.innerHTML = `Passer l’évaluation du parcours ${numeroParcours} <span aria-hidden="true">→</span>`;
        bouton.onclick = () => ouvrirParcours(action.theme);
        return;
    }
    bouton.innerHTML = 'Voir mon carnet complet <span aria-hidden="true">→</span>';
    bouton.onclick = () => afficherEcran('carnet');
}
