/**
 * Choisir les questions et préparer une session.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
// -----------------------------------------------------------------------------
// Sélection des questions et préparation des sessions
// -----------------------------------------------------------------------------
function filtrerQuestions(filtre) { return QUESTIONS.filter(filtre); }
function selectionnerQuestionsEquilibrees(reserve, nombre) {
    const groupes = {};
    reserve.forEach(question => {
        const cle = `${question.theme}-${question.etape}`;
        (groupes[cle] = groupes[cle] || []).push(question);
    });
    let cles = melanger(Object.keys(groupes));
    const resultat = [];
    for (let tour = 0; tour < 3 && resultat.length < nombre; tour++) {
        for (const cle of cles) {
            const groupe = melanger(groupes[cle]);
            const question = groupe[tour % groupe.length];
            if (question && !resultat.some(element => element.id === question.id))
                resultat.push(question);
            if (resultat.length >= nombre)
                break;
        }
        cles = melanger(cles);
    }
    if (resultat.length < nombre) {
        for (const question of melanger(reserve)) {
            if (!resultat.some(element => element.id === question.id))
                resultat.push(question);
            if (resultat.length >= nombre)
                break;
        }
    }
    return resultat.slice(0, nombre);
}
function obtenirOrdrePedagogiqueQuestion(question) {
    const ordreExplicite = Number(question?.ordreEtape);
    if (Number.isFinite(ordreExplicite) && ordreExplicite > 0)
        return ordreExplicite;
    const identifiant = Number(question?.id) || 0;
    const etape = Number(question?.etape) || 1;
    return identifiant - ((etape - 1) * 10);
}
function ordonnerQuestionsParcours(reserve) {
    return [...reserve].sort((questionA, questionB) => (Number(questionA.chapitre) || 1) - (Number(questionB.chapitre) || 1) ||
        obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB) ||
        (Number(questionA.id) || 0) - (Number(questionB.id) || 0));
}
function classerLongueurReponse(question) {
    if (question.activite)
        return 'equilibree';
    const textes = [raccourcirTexteReponse(question.bonneReponse), ...question.mauvaisesReponses.map(raccourcirTexteReponse)];
    const longueurBonneReponse = textes[0].length, mauvaises = textes.slice(1).map(texte => texte.length);
    const longueurMaxMauvaises = Math.max(...mauvaises), longueurMinMauvaises = Math.min(...mauvaises);
    const manifestementLongue = longueurBonneReponse > longueurMaxMauvaises + 14 && longueurBonneReponse > longueurMaxMauvaises * 1.18;
    const manifestementCourte = longueurBonneReponse + 14 < longueurMinMauvaises && longueurBonneReponse * 1.18 < longueurMinMauvaises;
    return manifestementLongue ? 'longue' : manifestementCourte ? 'courte' : 'equilibree';
}
function selectionnerSansIndiceLongueur(reserve, nombre, { conserverOrdre = false } = {}) {
    if (nombre >= reserve.length)
        return conserverOrdre ? [...reserve] : melanger([...reserve]);
    const source = conserverOrdre ? [...reserve] : melanger([...reserve]);
    const limite = Math.max(1, Math.floor(nombre * 0.27));
    const choisis = [], reportees = [];
    let longues = 0, courtes = 0;
    for (const question of source) {
        const categorieLongueur = classerLongueurReponse(question);
        if (categorieLongueur === 'longue' && longues >= limite) {
            reportees.push(question);
            continue;
        }
        if (categorieLongueur === 'courte' && courtes >= limite) {
            reportees.push(question);
            continue;
        }
        choisis.push(question);
        if (categorieLongueur === 'longue')
            longues++;
        if (categorieLongueur === 'courte')
            courtes++;
        if (choisis.length === nombre)
            break;
    }
    if (choisis.length < nombre) {
        for (const question of reportees) {
            choisis.push(question);
            if (choisis.length === nombre)
                break;
        }
    }
    return choisis;
}
function obtenirQuestionsSessionEtape(identifiantTheme, etape, chapitre) {
    const questionsEtape = filtrerQuestions(question => question.theme === identifiantTheme && question.etape === Number(etape));
    if (questionsEtape.length >= 20)
        return questionsEtape.filter(question => (Number(question.chapitre) || 1) === Number(chapitre));
    return questionsEtape;
}
function lancerEtape(identifiantTheme, etape, chapitre = null) {
    // Une étape demandée explicitement remplace toute ancienne session mémorisée.
    // Cela évite qu'une session précédente intercepte l'ouverture de la nouvelle étape.
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.questionsSession = [];
    etat.questionCourante = null;
    etat.questionValidee = false;
    effacerSessionEnCours();
    etat.theme = identifiantTheme;
    etat.etape = Number(etape);
    etat.etapeAvecJoker = false;
    etat.chapitre = Number(chapitre) || determinerProchainChapitre(identifiantTheme, etape);
    etat.mode = 'parcours';
    etat.origineSessionAnalytics = 'parcours_pjj';
    etat.organisationSession = 'melange';
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = !!etat.chronometreParcoursActif;
    const secondesParcoursActives = Number(document.querySelector('#secondesChronometreParcours .choix-bouton.actif')?.dataset.secondes);
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number.isFinite(secondesParcoursActives)
        ? secondesParcoursActives
        : (Number(etat.dureeChronometreParcours) || 15)));
    etat.dureeChronometreParcours = etat.dureeChronometreSession;
    const reserve = obtenirQuestionsSessionEtape(identifiantTheme, etape, etat.chapitre);
    lancerSession(ordonnerQuestionsParcours(reserve));
}
function obtenirQuestionsEvaluationFinale(identifiantTheme = etat.theme || 'commun') {
    return QUESTIONS
        .filter(question => question.estEvaluationFinale === true && question.theme === identifiantTheme)
        .sort((questionA, questionB) =>
            obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB)
            || questionA.id - questionB.id
        );
}
function lancerEvaluationFinale(identifiantTheme = etat.theme || sauvegarde.dernierTheme || 'commun') {
    if (!PROGRAMMES[identifiantTheme])
        identifiantTheme = 'commun';
    const session = obtenirQuestionsEvaluationFinale(identifiantTheme);
    if (session.length !== 50) {
        afficherNotification('L’évaluation finale de ce parcours est indisponible : banque incomplète.');
        return;
    }
    etat.theme = identifiantTheme;
    etat.etape = 12;
    etat.chapitre = 1;
    etat.mode = 'evaluation-finale';
    etat.origineSessionAnalytics = 'evaluation_finale';
    etat.organisationSession = 'ordonne';
    etat.jokersSessionActifs = false;
    etat.chronometreSessionActif = false;
    lancerSession(session);
}
function obtenirQuestionsEntrainement(perimetre = 'tous') {
    const reserve = QUESTIONS.filter(question => !question.estEvaluationFinale);
    if (perimetre === 'tous')
        return reserve;
    return reserve.filter(question => question.theme === perimetre);
}
function obtenirOrdreTheme(identifiantTheme) {
    const index = THEMES.findIndex(theme => theme.id === identifiantTheme);
    return index < 0 ? 999 : index;
}
function lancerEntrainementLibre() {
    etat.mode = 'libre';
    etat.origineSessionAnalytics = 'entrainement_libre';
    const perimetre = selectionner('#perimetreEntrainement')?.value || etat.perimetreEntrainement || 'tous';
    etat.perimetreEntrainement = perimetre;
    etat.theme = perimetre === 'tous' ? null : perimetre;
    const style = etat.organisationSession || 'ordonne';
    const reserve = obtenirQuestionsEntrainement(perimetre);
    const nombreMax = reserve.length;
    const nombre = Math.min(nombreMax, Math.max(10, Number(selectionner('#nombreQuestionsEntrainement')?.value) || 10));
    let session = [];
    if (style === 'ordonne') {
        session = [...reserve]
            .sort((questionA, questionB) =>
                obtenirOrdreTheme(questionA.theme) - obtenirOrdreTheme(questionB.theme)
                || (Number(questionA.etape) || 0) - (Number(questionB.etape) || 0)
                || obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB)
                || (Number(questionA.id) || 0) - (Number(questionB.id) || 0))
            .slice(0, nombre);
    }
    else {
        const candidats = selectionnerQuestionsEquilibrees(reserve, Math.min(reserve.length, Math.max(nombre, nombre * 4)));
        session = selectionnerSansIndiceLongueur(candidats, Math.min(nombre, candidats.length));
    }
    lancerSession(session);
}
function lancerDeParcours() {
    const face = selectionner('#faceDeParcours');
    const resultat = selectionner('#resultatDeParcours');
    const boutonLancer = selectionner('#boutonLancerLeDe');
    const boutonJouer = selectionner('#boutonJouerLeTirage');
    if (!face || !resultat || !boutonLancer || !boutonJouer)
        return;
    const nombreTire = Math.floor(Math.random() * 6) + 1;
    boutonLancer.disabled = true;
    boutonJouer.classList.add('masque');
    face.classList.remove('de-en-lancer');
    void face.offsetWidth;
    face.classList.add('de-en-lancer');
    window.setTimeout(() => {
        etat.nombreQuestionsTirageDe = nombreTire;
        envoyerEvenementPJJ('defi_du_hasard_lance', {
            pjjoue_mode_de_jeu: 'Défi du hasard',
            pjjoue_parcours: 'Parcours complet',
            pjjoue_nombre_questions_defi_du_hasard: nombreTire
        });
        face.dataset.face = String(nombreTire);
        face.classList.remove('de-en-lancer');
        resultat.textContent = `${nombreTire} question${nombreTire === 1 ? '' : 's'} aléatoire${nombreTire === 1 ? '' : 's'} tirée${nombreTire === 1 ? '' : 's'} dans les six parcours.`;
        boutonJouer.textContent = `Jouer ${nombreTire} question${nombreTire === 1 ? '' : 's'}`;
        boutonLancer.textContent = 'Relancer le dé';
        boutonLancer.classList.remove('principal');
        boutonLancer.classList.add('secondaire');
        boutonJouer.classList.remove('masque');
        boutonLancer.disabled = false;
        boutonJouer.focus({ preventScroll: true });
        annoncer(`Le dé indique ${nombreTire}. Questions tirées dans les six parcours.`);
    }, 420);
}
function jouerTirageDeParcours() {
    const nombreQuestions = Math.min(6, Math.max(1, Number(etat.nombreQuestionsTirageDe) || 1));
    const reserve = QUESTIONS.filter(question => !question.estEvaluationFinale);
    const session = selectionnerQuestionsEquilibrees(reserve, nombreQuestions);
    etat.mode = 'libre';
    etat.origineSessionAnalytics = 'defi_du_hasard';
    etat.theme = null;
    etat.perimetreEntrainement = 'tous';
    etat.organisationSession = 'melange';
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    lancerSession(session);
}
function lancerRevision(identifiantTheme = 'toutes') {
    const actif = Object.entries(sauvegarde.erreurs || {}).filter(([, erreur]) => !erreur.maitrisee);
    if (!sauvegarde.aDejaJoue && actif.length === 0) {
        afficherNotification('Tu n’as pas encore joué. Commence une partie avant de pouvoir rejouer tes erreurs.');
        return;
    }
    if (actif.length === 0) {
        afficherNotification('Bravo : aucune erreur active à rejouer pour le moment.');
        return;
    }
    const identifiants = actif.map(([id]) => Number(id));
    let reserve = QUESTIONS.filter(question => identifiants.includes(question.id) && !question.estEvaluationFinale);
    if (identifiantTheme !== 'toutes')
        reserve = reserve.filter(question => question.theme === identifiantTheme);
    if (reserve.length === 0) {
        const theme = THEMES.find(themeCandidat => themeCandidat.id === identifiantTheme);
        afficherNotification(theme ? `Aucune erreur active dans « ${theme.titre} ».` : 'Aucune erreur active dans ce thème.');
        return;
    }
    etat.mode = 'revision';
    etat.origineSessionAnalytics = 'revision_des_erreurs';
    etat.theme = identifiantTheme === 'toutes' ? null : identifiantTheme;
    etat.perimetreRevision = identifiantTheme;
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    lancerSession(melanger(reserve));
}
function lancerRevisionEtape(identifiantTheme, etape = null) {
    // Accepte aussi l’appel avec uniquement le numéro de l’étape.
    if (etape === null) {
        etape = identifiantTheme;
        identifiantTheme = etat.theme || sauvegarde.dernierTheme || 'commun';
    }
    const etapeCible = Number(etape);
    const actif = Object.entries(sauvegarde.erreurs || {}).filter(([, erreur]) => !erreur.maitrisee);
    if (!sauvegarde.aDejaJoue && actif.length === 0) {
        afficherNotification('Tu n’as pas encore joué. Commence une partie avant de pouvoir rejouer tes erreurs.');
        return;
    }
    const identifiants = actif.map(([id]) => Number(id));
    const reserve = QUESTIONS.filter(question =>
        identifiants.includes(question.id)
        && question.theme === identifiantTheme
        && Number(question.etape) === etapeCible
        && !question.estEvaluationFinale
    );
    if (!reserve.length) {
        afficherNotification(`Aucune erreur active à l’étape ${etapeCible} de ce parcours.`);
        return;
    }
    etat.mode = 'revision';
    etat.origineSessionAnalytics = 'revision_des_erreurs';
    etat.theme = identifiantTheme;
    etat.perimetreRevision = `${identifiantTheme}:etape:${etapeCible}`;
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    lancerSession(melanger(reserve));
}
