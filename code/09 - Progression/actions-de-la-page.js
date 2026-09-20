/**
 * Calculer et lire la progression.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
// -----------------------------------------------------------------------------
// Progression du parcours et affichage des étapes
// -----------------------------------------------------------------------------
function obtenirEtapesProgramme(identifiantTheme) {
    return PROGRAMMES[identifiantTheme]?.etapes || [];
}
function obtenirEtapeProgramme(identifiantTheme, identifiantEtape) {
    return obtenirEtapesProgramme(identifiantTheme).find(
        etapeProgramme => etapeProgramme.id === Number(identifiantEtape)
    );
}
function obtenirProgressionApprenant() { return 'apprenant'; }
function initialiserProgression(theme) {
    const proprietaire = obtenirProgressionApprenant();
    sauvegarde.progression[proprietaire] = sauvegarde.progression[proprietaire] || {};
    sauvegarde.progression[proprietaire][theme] = sauvegarde.progression[proprietaire][theme] || {};
    obtenirEtapesProgramme(theme).forEach(etapeProgramme => {
        const progressionExistante = sauvegarde.progression[proprietaire][theme][etapeProgramme.id] || {};
        const progressionEtape = {
            meilleurScore: 0,
            nombreTentatives: 0,
            deverrouillee: true,
            questionsTraitees: {},
            resultats: {},
            validationsSansJoker: {},
            celebrationSansJokerAffichee: false,
            termineeSansJoker: false,
            jokersUtilises: true,
            ...progressionExistante
        };
        progressionEtape.questionsTraitees = progressionEtape.questionsTraitees || {};
        progressionEtape.resultats = progressionEtape.resultats || {};
        progressionEtape.validationsSansJoker = progressionEtape.validationsSansJoker || {};
        progressionEtape.celebrationSansJokerAffichee = progressionEtape.celebrationSansJokerAffichee === true;
        sauvegarde.progression[proprietaire][theme][etapeProgramme.id] = progressionEtape;
    });
}
function obtenirBilanEtape(theme, etape) {
    initialiserProgression(theme);
    return sauvegarde.progression[obtenirProgressionApprenant()][theme][etape];
}
/**
 * Retrouver l'étape PJJ concernée lorsqu'une révision a été lancée depuis
 * la carte d'une étape. Une révision générale ne doit pas modifier la
 * progression d'une étape : seul le périmètre explicite « thème:etape:n »
 * autorise cette synchronisation.
 */
function obtenirContexteRevisionEtape(question = etat.questionCourante) {
    if (etat.mode !== 'revision')
        return null;
    const correspondance = /^([^:]+):etape:(\d+)$/.exec(String(etat.perimetreRevision || ''));
    if (!correspondance)
        return null;
    const contexte = {
        theme: correspondance[1],
        etape: Number(correspondance[2])
    };
    if (!question
        || question.missionSigles
        || question.missionMesures
        || question.theme !== contexte.theme
        || Number(question.etape) !== contexte.etape)
        return null;
    return contexte;
}
function obtenirSeuilMaitrise() { return 90; }
function obtenirQuestionsEtape(identifiantTheme, etape) {
    return QUESTIONS.filter(
        question => question.theme === identifiantTheme && question.etape === Number(etape)
    );
}
function compterQuestionsTraiteesEtape(identifiantTheme, etape) {
    const nombreTraitees = obtenirBilanEtape(identifiantTheme, etape)?.questionsTraitees || {};
    return obtenirQuestionsEtape(identifiantTheme, etape).filter(question => nombreTraitees[question.id]).length;
}
/**
 * Questions déjà travaillées mais qui ne sont pas encore validées sans aide.
 *
 * Une étape peut afficher 10/10 questions réalisées tout en n'affichant que
 * 9/10 maîtrisées sans aide. Ces questions doivent rester rejouables, même si
 * une ancienne sauvegarde ne possède pas (ou plus) d'entrée correspondante
 * dans la liste globale des erreurs.
 */
function obtenirQuestionsNonMaitriseesEtape(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    return obtenirQuestionsEtape(identifiantTheme, etape).filter(question =>
        bilanEtape?.questionsTraitees?.[question.id] === true
        && bilanEtape?.resultats?.[question.id] !== true
    );
}
function obtenirQuestionsChapitre(identifiantTheme, etape, chapitre) {
    return obtenirQuestionsEtape(identifiantTheme, etape).filter(question =>
        (Number(question.chapitre) || 1) === Number(chapitre)
    );
}
function determinerProchainChapitre(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    for (let chapitre = 1; chapitre <= 5; chapitre++) {
        const questionsChapitre = obtenirQuestionsChapitre(identifiantTheme, etape, chapitre);
        const contientQuestionNonTraitee = questionsChapitre.some(question => !bilanEtape.questionsTraitees?.[question.id]);
        if (contientQuestionNonTraitee)
            return chapitre;
    }
    let chapitreARevoir = 1;
    let scoreLePlusFaible = Infinity;
    for (let chapitre = 1; chapitre <= 5; chapitre++) {
        const questionsChapitre = obtenirQuestionsChapitre(identifiantTheme, etape, chapitre);
        const scoreChapitre = questionsChapitre.length
            ? questionsChapitre.filter(question => bilanEtape.resultats?.[question.id] === true).length / questionsChapitre.length
            : 1;
        if (scoreChapitre < scoreLePlusFaible) {
            scoreLePlusFaible = scoreChapitre;
            chapitreARevoir = chapitre;
        }
    }
    return chapitreARevoir;
}
function etapeNecessiteAutreChapitre(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    return obtenirQuestionsEtape(identifiantTheme, etape).some(question => !bilanEtape.questionsTraitees?.[question.id]);
}
function estEtapeMaitrisee(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    const questionsEtape = obtenirQuestionsEtape(identifiantTheme, etape);
    return Boolean(bilanEtape)
        && questionsEtape.length > 0
        && questionsEtape.every(question => bilanEtape.questionsTraitees?.[question.id])
        && bilanEtape.termineeSansJoker === true;
}
function synchroniserEtapesReussiesEnAutonomie(programme) {
    let validationCorrigee = false;
    programme.etapes.forEach(etapeProgramme => {
        const questionsEtape = obtenirQuestionsEtape(programme.id, etapeProgramme.id);
        const bilanEtape = obtenirBilanEtape(programme.id, etapeProgramme.id);
        const toutesReussiesEnAutonomie = questionsEtape.length > 0
            && questionsEtape.every(question => bilanEtape.resultats?.[question.id] === true);
        if (!toutesReussiesEnAutonomie || bilanEtape.termineeSansJoker === true)
            return;
        bilanEtape.termineeSansJoker = true;
        bilanEtape.jokersUtilises = false;
        validationCorrigee = true;
    });
    if (validationCorrigee)
        enregistrerSauvegarde();
}
function compterReussitesAutonomesEtape(identifiantTheme, numeroEtape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, numeroEtape);
    return obtenirQuestionsEtape(identifiantTheme, numeroEtape)
        .filter(question => bilanEtape?.resultats?.[question.id] === true)
        .length;
}
function reinitialiserValidationSansJokerEtape(identifiantTheme, numeroEtape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, numeroEtape);
    const questionsEtape = obtenirQuestionsEtape(identifiantTheme, numeroEtape);
    if (!bilanEtape || !questionsEtape.length)
        return;
    questionsEtape.forEach(question => {
        delete bilanEtape.resultats[question.id];
        delete bilanEtape.validationsSansJoker?.[question.id];
    });
    bilanEtape.celebrationSansJokerAffichee = false;
    bilanEtape.termineeSansJoker = false;
    bilanEtape.jokersUtilises = true;
    enregistrerSauvegarde();
    actualiserSuiviEtapeQuestion(etat.questionCourante);
    actualiserAccueil();
}
function compterErreursActives() {
    return Object.values(sauvegarde.erreurs || {}).filter(erreur => !erreur.maitrisee).length;
}
function compterEtapesMaitrisees() {
    let nombreEtapesMaitrisees = 0;
    THEMES.forEach(theme => {
        obtenirEtapesProgramme(theme.id).forEach(etapeProgramme => {
            if (estEtapeMaitrisee(theme.id, etapeProgramme.id))
                nombreEtapesMaitrisees++;
        });
    });
    return nombreEtapesMaitrisees;
}
function marquerQuestionJouee(question) {
    if (!question || !question.id)
        return;
    sauvegarde.questionsJouees = sauvegarde.questionsJouees || {};
    sauvegarde.questionsJouees[String(question.id)] = true;
}
function marquerEtapeDecouverte(question) {
    if (!question)
        return;
    const etape = Number(question.etape);
    const theme = question.theme;
    if (!estThemeConnu(theme) || !Number.isFinite(etape) || etape < 1 || !obtenirEtapeProgramme(theme, etape))
        return;
    sauvegarde.etapesDecouvertes = sauvegarde.etapesDecouvertes || {};
    sauvegarde.etapesDecouvertes[`${theme}:${etape}`] = true;
}
function compterEtapesDecouvertes() {
    const etapes = new Set();
    const ajouterQuestion = question => {
        if (!question || question.estEvaluationFinale === true)
            return;
        const etape = Number(question.etape);
        if (estThemeConnu(question.theme) && Number.isFinite(etape))
            etapes.add(`${question.theme}:${etape}`);
    };
    Object.keys(sauvegarde.questionsJouees || {}).forEach(identifiant => {
        if (sauvegarde.questionsJouees[identifiant])
            ajouterQuestion(QUESTIONS.find(element => String(element.id) === String(identifiant)));
    });
    Object.keys(sauvegarde.erreurs || {}).forEach(identifiant =>
        ajouterQuestion(QUESTIONS.find(element => String(element.id) === String(identifiant)))
    );
    THEMES.forEach(theme => {
        obtenirEtapesProgramme(theme.id).forEach(etapeProgramme => {
            if ((Number(compterQuestionsTraiteesEtape(theme.id, etapeProgramme.id)) || 0) > 0)
                etapes.add(`${theme.id}:${etapeProgramme.id}`);
        });
    });
    Object.entries(sauvegarde.etapesDecouvertes || {}).forEach(([cle, actif]) => {
        if (actif === true && cle.includes(':'))
            etapes.add(cle);
    });
    return etapes.size;
}
function estProgrammeMaitrise(identifiantTheme) {
    const programme = PROGRAMMES[identifiantTheme];
    return Boolean(programme?.etapes?.length)
        && programme.etapes.every(etapeProgramme => estEtapeMaitrisee(identifiantTheme, etapeProgramme.id));
}
function obtenirEvaluationFinaleTheme(identifiantTheme) {
    sauvegarde.evaluationsFinales = sauvegarde.evaluationsFinales || creerEvaluationsFinalesInitiales();
    sauvegarde.evaluationsFinales[identifiantTheme] = sauvegarde.evaluationsFinales[identifiantTheme] || creerEtatEvaluationFinale();
    return sauvegarde.evaluationsFinales[identifiantTheme];
}
function estEvaluationFinaleReussie(identifiantTheme) {
    return obtenirEvaluationFinaleTheme(identifiantTheme)?.reussie === true;
}
function estParcoursCompletReussi() {
    return THEMES.every(theme => estProgrammeMaitrise(theme.id) && estEvaluationFinaleReussie(theme.id));
}
function obtenirProchainThemeIncomplet() {
    return THEMES.find(theme => !estProgrammeMaitrise(theme.id) || !estEvaluationFinaleReussie(theme.id))?.id || null;
}
