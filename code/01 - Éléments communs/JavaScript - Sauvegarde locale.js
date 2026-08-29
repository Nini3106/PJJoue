/**
 * Sauvegarde locale : garder la progression dans le navigateur.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
// -----------------------------------------------------------------------------
// Sauvegarde locale et état général
// -----------------------------------------------------------------------------
function creerEtatEvaluationFinale() {
    return { meilleurScore: 0, nombreTentatives: 0, reussie: false };
}
function creerEvaluationsFinalesInitiales() {
    return Object.fromEntries(THEMES.map(theme => [theme.id, creerEtatEvaluationFinale()]));
}
function creerProgressionSiglesInitiale() {
    return {
        decouverts: {},
        etapes: Object.fromEntries([1, 2, 3, 4, 5, 6].map(numero => [String(numero), {
            autonomes: {},
            validationsSansJoker: {},
            celebrationAffichee: false,
            nombreTentatives: 0,
            meilleurScore: 0
        }])),
        erreurs: {},
        evaluation: { meilleurScore: 0, nombreTentatives: 0, reussie: false },
        statistiques: { questionsJouees: 0 }
    };
}
function creerSauvegardeInitiale() {
    return {
        version: 'V1',
        xp: 0,
        meilleureSerie: 0,
        nombreQuestionsJouees: 0,
        aDejaJoue: false,
        erreurs: {},
        progression: { apprenant: {} },
        parametres: { son: true, volume: .65, echelleTexte: 1 },
        dernierTheme: null,
        etapesDecouvertes: {},
        questionsJouees: {},
        evaluationsFinales: creerEvaluationsFinalesInitiales(),
        siglesJeu: creerProgressionSiglesInitiale()
    };
}
function estObjetSimple(valeur) {
    return Boolean(valeur) && typeof valeur === 'object' && !Array.isArray(valeur);
}
function estThemeConnu(identifiantTheme) {
    return typeof identifiantTheme === 'string'
        && THEMES.some(theme => theme.id === identifiantTheme);
}
function convertirEntierBorne(valeur, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
    const nombre = Number(valeur);
    if (!Number.isFinite(nombre))
        return minimum;
    return Math.min(maximum, Math.max(minimum, Math.trunc(nombre)));
}
function filtrerIndicateurs(ensemble, identifiantsAutorises) {
    if (!estObjetSimple(ensemble))
        return {};
    return Object.fromEntries(
        Object.entries(ensemble).filter(([identifiant, actif]) =>
            identifiantsAutorises.has(String(identifiant)) && actif === true
        )
    );
}
function filtrerResultats(ensemble, identifiantsAutorises) {
    if (!estObjetSimple(ensemble))
        return {};
    return Object.fromEntries(
        Object.entries(ensemble).filter(([identifiant, resultat]) =>
            identifiantsAutorises.has(String(identifiant)) && typeof resultat === 'boolean'
        )
    );
}
function nettoyerProgression(progression) {
    const progressionNettoyee = { apprenant: {} };
    const progressionApprenant = estObjetSimple(progression?.apprenant)
        ? progression.apprenant
        : {};
    for (const [theme, etapesProgramme] of Object.entries(progressionApprenant)) {
        if (!estThemeConnu(theme) || !estObjetSimple(etapesProgramme))
            continue;
        progressionNettoyee.apprenant[theme] = {};
        for (const [numeroEtape, enregistrement] of Object.entries(etapesProgramme)) {
            const etape = Number(numeroEtape);
            const questionsEtape = QUESTIONS.filter(question =>
                question.theme === theme && Number(question.etape) === etape
                && question.estEvaluationFinale !== true
            );
            if (!Number.isInteger(etape)
                || !PROGRAMMES[theme]?.etapes?.some(element => Number(element.id) === etape)
                || !estObjetSimple(enregistrement))
                continue;
            const identifiantsQuestions = new Set(questionsEtape.map(question => String(question.id)));
            const resultats = filtrerResultats(enregistrement.resultats, identifiantsQuestions);
            const validationsSansJoker = estObjetSimple(enregistrement.validationsSansJoker)
                ? filtrerIndicateurs(enregistrement.validationsSansJoker, identifiantsQuestions)
                : Object.fromEntries(Object.entries(resultats).filter(([_identifiant, resultat]) => resultat === true));
            const celebrationSansJokerAffichee = typeof enregistrement.celebrationSansJokerAffichee === 'boolean'
                ? enregistrement.celebrationSansJokerAffichee
                : enregistrement.termineeSansJoker === true;
            progressionNettoyee.apprenant[theme][numeroEtape] = {
                meilleurScore: convertirEntierBorne(enregistrement.meilleurScore, 0, 100),
                nombreTentatives: convertirEntierBorne(enregistrement.nombreTentatives),
                questionsTraitees: filtrerIndicateurs(enregistrement.questionsTraitees, identifiantsQuestions),
                resultats,
                validationsSansJoker,
                celebrationSansJokerAffichee,
                termineeSansJoker: enregistrement.termineeSansJoker === true,
                jokersUtilises: enregistrement.termineeSansJoker !== true
            };
        }
    }
    return progressionNettoyee;
}
function nettoyerErreurs(erreurs) {
    const erreursNettoyees = {};
    if (!estObjetSimple(erreurs))
        return erreursNettoyees;
    for (const [identifiant, enregistrement] of Object.entries(erreurs)) {
        const identifiantQuestion = Number(identifiant);
        const questionCorrespondante = QUESTIONS.find(question => Number(question.id) === identifiantQuestion);
        if (!Number.isInteger(identifiantQuestion)
            || identifiantQuestion < 1
            || !questionCorrespondante
            || questionCorrespondante.estEvaluationFinale === true
            || !estObjetSimple(enregistrement))
            continue;
        erreursNettoyees[String(identifiantQuestion)] = {
            reussites: convertirEntierBorne(enregistrement.reussites),
            maitrisee: enregistrement.maitrisee === true,
            nombreErreurs: convertirEntierBorne(enregistrement.nombreErreurs),
            nombrePassages: convertirEntierBorne(enregistrement.nombrePassages),
            theme: estThemeConnu(enregistrement.theme) ? enregistrement.theme : questionCorrespondante.theme
        };
    }
    return erreursNettoyees;
}
function nettoyerEvaluationsFinales(sauvegardeBrute) {
    const nettoyees = creerEvaluationsFinalesInitiales();
    const nouvelles = estObjetSimple(sauvegardeBrute?.evaluationsFinales)
        ? sauvegardeBrute.evaluationsFinales
        : {};
    THEMES.forEach(theme => {
        const brute = estObjetSimple(nouvelles[theme.id]) ? nouvelles[theme.id] : {};
        nettoyees[theme.id] = {
            meilleurScore: convertirEntierBorne(brute.meilleurScore, 0, 100),
            nombreTentatives: convertirEntierBorne(brute.nombreTentatives),
            reussie: brute.reussie === true
        };
    });
    return nettoyees;
}
function normaliserEtapesDecouvertes(sauvegardeBrute) {
    const resultat = {};
    const etapesDecouvertesEnregistrees = estObjetSimple(sauvegardeBrute?.etapesDecouvertes)
        ? sauvegardeBrute.etapesDecouvertes
        : {};
    for (const [cle, actif] of Object.entries(etapesDecouvertesEnregistrees)) {
        if (actif !== true)
            continue;
        if (cle.includes(':')) {
            const [theme, numero] = cle.split(':');
            if (estThemeConnu(theme) && obtenirEtapeProgramme?.(theme, Number(numero)))
                resultat[`${theme}:${Number(numero)}`] = true;
        }
    }
    return resultat;
}
function nettoyerProgressionSigles(sauvegardeBrute) {
    const initiale = creerProgressionSiglesInitiale();
    const brute = estObjetSimple(sauvegardeBrute?.siglesJeu) ? sauvegardeBrute.siglesJeu : {};
    const identifiants = new Set((SIGLES || []).map(element => String(element.sigle || '').toUpperCase()));
    const filtrerSiglesActifs = valeur => estObjetSimple(valeur)
        ? Object.fromEntries(Object.entries(valeur).filter(([sigle, actif]) => identifiants.has(String(sigle).toUpperCase()) && actif === true))
        : {};
    const erreurs = {};
    if (estObjetSimple(brute.erreurs)) {
        for (const [sigle, valeur] of Object.entries(brute.erreurs)) {
            const cle = String(sigle).toUpperCase();
            if (!identifiants.has(cle) || !estObjetSimple(valeur))
                continue;
            erreurs[cle] = {
                active: valeur.active === true,
                nombreErreurs: convertirEntierBorne(valeur.nombreErreurs),
                reussitesRevision: convertirEntierBorne(valeur.reussitesRevision, 0, 2)
            };
        }
    }
    const etapes = {};
    for (let numero = 1; numero <= 6; numero += 1) {
        const cle = String(numero);
        const source = estObjetSimple(brute.etapes?.[cle]) ? brute.etapes[cle] : {};
        const autorises = new Set((SIGLES || []).filter(element => Number(element.etape) === numero).map(element => String(element.sigle).toUpperCase()));
        const filtrerEtape = valeur => estObjetSimple(valeur)
            ? Object.fromEntries(Object.entries(valeur).filter(([sigle, actif]) => autorises.has(String(sigle).toUpperCase()) && actif === true))
            : {};
        etapes[cle] = {
            autonomes: filtrerEtape(source.autonomes),
            validationsSansJoker: filtrerEtape(source.validationsSansJoker),
            celebrationAffichee: source.celebrationAffichee === true,
            nombreTentatives: convertirEntierBorne(source.nombreTentatives),
            meilleurScore: convertirEntierBorne(source.meilleurScore, 0, 100)
        };
    }
    const evaluation = estObjetSimple(brute.evaluation) ? brute.evaluation : {};
    const statistiques = estObjetSimple(brute.statistiques) ? brute.statistiques : {};
    return {
        decouverts: filtrerSiglesActifs(brute.decouverts),
        etapes,
        erreurs,
        evaluation: {
            meilleurScore: convertirEntierBorne(evaluation.meilleurScore, 0, 100),
            nombreTentatives: convertirEntierBorne(evaluation.nombreTentatives),
            reussie: evaluation.reussie === true
        },
        statistiques: { questionsJouees: convertirEntierBorne(statistiques.questionsJouees) }
    };
}
function nettoyerSauvegarde(sauvegardeBrute) {
    const sauvegardeInitiale = creerSauvegardeInitiale();
    if (!estObjetSimple(sauvegardeBrute))
        return sauvegardeInitiale;
    const parametres = estObjetSimple(sauvegardeBrute.parametres)
        ? sauvegardeBrute.parametres
        : {};
    const nombreQuestionsJouees = convertirEntierBorne(sauvegardeBrute.nombreQuestionsJouees);
    const identifiantsQuestions = new Set(QUESTIONS.map(question => String(question.id)));
    return {
        ...sauvegardeInitiale,
        version: 'V1',
        xp: convertirEntierBorne(sauvegardeBrute.xp),
        meilleureSerie: convertirEntierBorne(sauvegardeBrute.meilleureSerie),
        nombreQuestionsJouees,
        aDejaJoue: sauvegardeBrute.aDejaJoue === true || nombreQuestionsJouees > 0,
        erreurs: nettoyerErreurs(sauvegardeBrute.erreurs),
        progression: nettoyerProgression(sauvegardeBrute.progression),
        parametres: {
            son: parametres.son !== false,
            volume: Number.isFinite(Number(parametres.volume))
                ? Math.min(1, Math.max(0, Number(parametres.volume)))
                : .65,
            echelleTexte: [.9, 1, 1.08, 1.15].includes(Number(parametres.echelleTexte))
                ? Number(parametres.echelleTexte)
                : 1
        },
        dernierTheme: estThemeConnu(sauvegardeBrute.dernierTheme)
            ? sauvegardeBrute.dernierTheme
            : null,
        etapesDecouvertes: normaliserEtapesDecouvertes(sauvegardeBrute),
        questionsJouees: filtrerIndicateurs(sauvegardeBrute.questionsJouees, identifiantsQuestions),
        evaluationsFinales: nettoyerEvaluationsFinales(sauvegardeBrute),
        siglesJeu: nettoyerProgressionSigles(sauvegardeBrute)
    };
}
function chargerSauvegarde() {
    try {
        const contenu = localStorage.getItem(CLE_SAUVEGARDE);
        return contenu
            ? nettoyerSauvegarde(JSON.parse(contenu))
            : creerSauvegardeInitiale();
    }
    catch (erreur) {
        return creerSauvegardeInitiale();
    }
}
let sauvegarde = chargerSauvegarde();
let etat = {
    ecran: 'accueil',
    theme: null,
    etape: 1,
    chapitre: 1,
    mode: null,
    questionsSession: [],
    indexQuestion: 0,
    score: 0,
    serie: 0,
    meilleureSerie: 0,
    questionCourante: null,
    erreursSession: new Set(),
    questionsPassees: new Set(),
    reponsesSession: new Map(),
    optionsSession: new Map(),
    jokers: { cinquanteCinquante: true, indice: true, langueAuChat: true },
    identifiantMinuteur: null,
    tempsRestant: 0,
    organisationSession: 'melange',
    nombreReponsesAidees: 0,
    chronometreSessionActif: false,
    dureeChronometreSession: 15,
    chronometreParcoursActif: false,
    dureeChronometreParcours: 15,
    nombreQuestionsTirageDe: 0,
    origineSessionAnalytics: null,
    perimetreEntrainement: 'tous',
    brouillonsEcrits: new Map()
};
let minuteurRappelJokers = null;
let minuteurFinRappelJokers = null;
let minuteurTransitionParcours = null;
let stockageLocalAverti = false;
function effacerSauvegardeDuNavigateur() {
    try {
        localStorage.removeItem(CLE_SAUVEGARDE);
    }
    catch (erreur) {
        // L’indisponibilité du stockage sera signalée par l’enregistrement suivant.
    }
}
function enregistrerSauvegarde() {
    sauvegarde.version = 'V1';
    try {
        localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(sauvegarde));
        return true;
    }
    catch (erreur) {
        if (!stockageLocalAverti) {
            stockageLocalAverti = true;
            afficherNotification('Sauvegarde locale indisponible · pense à exporter ta progression avant de fermer PJJoue.');
        }
        return false;
    }
}
function serialiserTableauAssociatif(carte) {
    return carte instanceof Map ? [...carte.entries()] : [];
}
function serialiserEnsemble(ensemble) {
    return ensemble instanceof Set ? [...ensemble.values()] : [];
}
function restaurerTableauAssociatif(valeur) {
    return Array.isArray(valeur) ? new Map(valeur) : new Map();
}
function restaurerEnsemble(valeur) {
    return Array.isArray(valeur) ? new Set(valeur) : new Set();
}
function effacerSessionEnCours() {
    try {
        localStorage.removeItem(CLE_SESSION_EN_COURS);
    }
    catch (erreur) {
        // Une session technique ne doit jamais bloquer le jeu si le stockage est indisponible.
    }
}
function enregistrerSessionEnCours() {
    if (estSessionMissionSigles())
        return false;
    if (etat.ecran !== 'question' || !etat.questionsSession?.length || !etat.questionCourante)
        return false;
    const saisieActive = selectionner('#reponseEcrite');
    if (saisieActive && etat.questionCourante?.id) {
        etat.brouillonsEcrits = etat.brouillonsEcrits || new Map();
        etat.brouillonsEcrits.set(etat.questionCourante.id, saisieActive.value || '');
    }
    const instantane = {
        version: 1,
        enregistreLe: Date.now(),
        theme: etat.theme,
        etape: etat.etape,
        chapitre: etat.chapitre,
        mode: etat.mode,
        organisationSession: etat.organisationSession,
        origineSessionAnalytics: etat.origineSessionAnalytics,
        perimetreRevision: etat.perimetreRevision || null,
        indexQuestion: etat.indexQuestion,
        questionValidee: etat.questionValidee === true,
        score: etat.score,
        serie: etat.serie,
        meilleureSerie: etat.meilleureSerie,
        nombreReponsesAidees: etat.nombreReponsesAidees,
        sessionAvecJoker: etat.sessionAvecJoker === true,
        etapeAvecJoker: etat.etapeAvecJoker === true,
        jokersSessionActifs: etat.jokersSessionActifs !== false,
        chronometreSessionActif: etat.chronometreSessionActif === true,
        dureeChronometreSession: etat.dureeChronometreSession,
        tempsRestant: etat.tempsRestant,
        delaiDepasse: etat.delaiDepasse === true,
        debutSessionAnalytics: etat.debutSessionAnalytics,
        nombreQuestionsTirageDe: etat.nombreQuestionsTirageDe || 0,
        decalageReponses: etat.decalageReponses || 0,
        questions: etat.questionsSession.map(question => Number(question.id)).filter(Number.isFinite),
        erreursSession: serialiserEnsemble(etat.erreursSession),
        questionsPassees: serialiserEnsemble(etat.questionsPassees),
        reponsesSession: serialiserTableauAssociatif(etat.reponsesSession),
        optionsSession: serialiserTableauAssociatif(etat.optionsSession),
        tentativesQuestions: serialiserTableauAssociatif(etat.tentativesQuestions),
        jokersQuestions: serialiserTableauAssociatif(etat.jokersQuestions),
        brouillonsEcrits: serialiserTableauAssociatif(etat.brouillonsEcrits),
        brouillonActivite: etat.brouillonActivite || null
    };
    try {
        localStorage.setItem(CLE_SESSION_EN_COURS, JSON.stringify(instantane));
        return true;
    }
    catch (erreur) {
        return false;
    }
}
function chargerSessionEnCours() {
    try {
        const contenu = localStorage.getItem(CLE_SESSION_EN_COURS);
        if (!contenu)
            return null;
        const instantane = JSON.parse(contenu);
        if (!instantane || instantane.version !== 1 || !Array.isArray(instantane.questions))
            return null;
        return instantane;
    }
    catch (erreur) {
        return null;
    }
}
function restaurerSessionEnCours() {
    const instantane = chargerSessionEnCours();
    if (!instantane)
        return false;
    const questions = instantane.questions
        .map(identifiant => QUESTIONS.find(question => Number(question.id) === Number(identifiant)))
        .filter(Boolean)
        .map(question => ({ ...question, modePresentation: question.modePrefere || obtenirModeQuestion(question) }));
    if (!questions.length || questions.length !== instantane.questions.length) {
        effacerSessionEnCours();
        return false;
    }
    const positionQuestion = Math.min(questions.length - 1, Math.max(0, Number(instantane.indexQuestion) || 0));
    etat.theme = instantane.theme || questions[positionQuestion]?.theme || 'commun';
    etat.etape = Number(instantane.etape) || Number(questions[positionQuestion]?.etape) || 1;
    etat.chapitre = Number(instantane.chapitre) || 1;
    etat.mode = instantane.mode || 'parcours';
    etat.organisationSession = instantane.organisationSession || 'ordonne';
    etat.origineSessionAnalytics = instantane.origineSessionAnalytics || null;
    etat.perimetreRevision = instantane.perimetreRevision || null;
    etat.questionsSession = questions;
    etat.indexQuestion = positionQuestion;
    etat.score = Math.max(0, Number(instantane.score) || 0);
    etat.serie = Math.max(0, Number(instantane.serie) || 0);
    etat.meilleureSerie = Math.max(0, Number(instantane.meilleureSerie) || 0);
    etat.nombreReponsesAidees = Math.max(0, Number(instantane.nombreReponsesAidees) || 0);
    etat.sessionAvecJoker = instantane.sessionAvecJoker === true;
    etat.etapeAvecJoker = instantane.etapeAvecJoker === true;
    etat.jokersSessionActifs = instantane.jokersSessionActifs !== false;
    etat.chronometreSessionActif = instantane.chronometreSessionActif === true;
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number(instantane.dureeChronometreSession) || 15));
    etat.tempsRestant = Math.max(0, Number(instantane.tempsRestant) || 0);
    etat.delaiDepasse = instantane.delaiDepasse === true;
    etat.debutSessionAnalytics = Number(instantane.debutSessionAnalytics) || Date.now();
    etat.nombreQuestionsTirageDe = Math.max(0, Number(instantane.nombreQuestionsTirageDe) || 0);
    etat.decalageReponses = Number(instantane.decalageReponses) || 0;
    etat.erreursSession = restaurerEnsemble(instantane.erreursSession);
    etat.questionsPassees = restaurerEnsemble(instantane.questionsPassees);
    etat.reponsesSession = restaurerTableauAssociatif(instantane.reponsesSession);
    etat.optionsSession = restaurerTableauAssociatif(instantane.optionsSession);
    etat.tentativesQuestions = restaurerTableauAssociatif(instantane.tentativesQuestions);
    etat.jokersQuestions = restaurerTableauAssociatif(instantane.jokersQuestions);
    etat.brouillonsEcrits = restaurerTableauAssociatif(instantane.brouillonsEcrits);
    etat.brouillonActivite = instantane.brouillonActivite || null;
    etat.questionCourante = questions[positionQuestion];
    etat.questionValidee = Boolean(instantane.questionValidee);
    etat.jokers = etat.jokersQuestions.get(etat.questionCourante.id)
        || { cinquanteCinquante: true, indice: true, langueAuChat: true };
    actualiserIndicateurSerie();
    return true;
}
function melanger(elements) {
    const elementsMelanges = [...elements];
    for (let indice = elementsMelanges.length - 1; indice > 0; indice--) {
        const indiceAleatoire = Math.floor(Math.random() * (indice + 1));
        [elementsMelanges[indice], elementsMelanges[indiceAleatoire]] = [
            elementsMelanges[indiceAleatoire],
            elementsMelanges[indice]
        ];
    }
    return elementsMelanges;
}
function annoncer(message) {
    const zoneDirecte = selectionner('#statutAccessibilite');
    if (!zoneDirecte)
        return;
    zoneDirecte.textContent = '';
    requestAnimationFrame(() => {
        zoneDirecte.textContent = String(message || '');
    });
}
function afficherNotification(message) {
    const notification = selectionner('#notification');
    notification.textContent = message;
    notification.classList.add('visible');
    setTimeout(() => notification.classList.remove('visible'), 2600);
}
let historiqueNavigation = [];
let confirmationRetourEnCours = false;
function annulerRappelJokers() {
    clearTimeout(minuteurRappelJokers);
    clearTimeout(minuteurFinRappelJokers);
    minuteurRappelJokers = null;
    minuteurFinRappelJokers = null;
    selectionner('#boutonJokers')?.classList.remove('rappel-jokers');
}
function compterJokersDisponibles() {
    if (etat.jokersSessionActifs === false || !etat.jokers)
        return 0;
    return ['cinquanteCinquante', 'indice', 'langueAuChat'].filter(cle => etat.jokers[cle] === true).length;
}
function actualiserBoutonJokers() {
    const declencheur = selectionner('#boutonJokers');
    const fenetre = selectionner('#fenetreJokers');
    const statut = selectionner('#statutFenetreJokers');
    if (!declencheur)
        return;
    const actif = etat.ecran === 'question' && etat.jokersSessionActifs !== false;
    const disponibles = compterJokersDisponibles();
    declencheur.classList.toggle('masque', !actif);
    declencheur.disabled = !actif || etat.questionValidee || disponibles === 0;
    declencheur.setAttribute('aria-expanded', String(!!fenetre?.open));
    const libelleNombreJokers = `${disponibles} joker${disponibles > 1 ? 's' : ''}`;
    const libelleDisponibilite = `${libelleNombreJokers}`
        + ` disponible${disponibles > 1 ? 's' : ''}`;
    declencheur.setAttribute(
        'aria-label',
        disponibles > 0 ? `Ouvrir les jokers — ${libelleDisponibilite}` : 'Aucun joker disponible'
    );
    if (etat.questionValidee) {
        declencheur.title = 'Les jokers ne sont plus disponibles après validation.';
    }
    else {
        declencheur.title = disponibles > 0
            ? libelleDisponibilite
            : 'Tous les jokers ont été utilisés pour cette activité.';
    }
    if (statut) {
        statut.textContent = disponibles > 0
            ? `${libelleNombreJokers} encore disponible${disponibles > 1 ? 's' : ''}`
                + ' pour cette activité.'
            : 'Tous les jokers ont été utilisés pour cette activité.';
    }
}
function fermerFenetreJokers({ restaurerFocus = true } = {}) {
    const fenetre = selectionner('#fenetreJokers');
    const declencheur = selectionner('#boutonJokers');
    if (fenetre?.open)
        fenetre.close();
    declencheur?.setAttribute('aria-expanded', 'false');
    if (restaurerFocus && declencheur && !declencheur.classList.contains('masque'))
        requestAnimationFrame(() => declencheur.focus({ preventScroll: true }));
}
function ouvrirFenetreJokers() {
    const fenetre = selectionner('#fenetreJokers');
    const declencheur = selectionner('#boutonJokers');
    actualiserBoutonJokers();
    if (!fenetre || !declencheur || declencheur.disabled)
        return;
    if (!fenetre.open)
        fenetre.showModal();
    declencheur.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
        const premier = ['boutonJoker5050', 'boutonJokerIndice', 'boutonJokerLangueAuChat']
            .map(identifiant => selectionner('#' + identifiant))
            .find(bouton => bouton && !bouton.disabled);
        (premier || selectionner('#fermerFenetreJokers'))?.focus({ preventScroll: true });
    });
}
function programmerRappelJokers() {
    annulerRappelJokers();
    minuteurRappelJokers = setTimeout(() => {
        if (etat.ecran !== 'question' || etat.questionValidee)
            return;
        const declencheur = selectionner('#boutonJokers');
        if (!declencheur || declencheur.disabled || declencheur.classList.contains('masque'))
            return;
        declencheur.classList.add('rappel-jokers');
        minuteurFinRappelJokers = setTimeout(() => declencheur.classList.remove('rappel-jokers'), 1300);
        minuteurRappelJokers = setTimeout(programmerRappelJokers, 8500);
    }, 5200);
}
let restaurationNavigation = false;
