'use strict';

/**
 * Moteur principal de PJJoue V1.
 *
 * Organisation du fichier :
 * 1. utilitaires et sauvegarde locale ;
 * 2. navigation et fenêtres ;
 * 3. progression et préparation des sessions ;
 * 4. affichage et validation des activités ;
 * 5. jokers, bilans et révision ;
 * 6. paramètres, sons et branchement des commandes.
 *
 * Les noms appartenant à PJJoue sont rédigés en français. Les termes imposés
 * par les API du navigateur (history, localStorage, AudioContext, etc.) restent
 * naturellement ceux de la plateforme web.
 */
if ('scrollRestoration' in history)
    history.scrollRestoration = 'manual';
const { THEMES, PROGRAMMES, SOURCES, QUESTIONS } = window.DONNEES_PJJ;
const TRACES_ICONE_THEME = {
    commun: '<path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7z"/>'
        + '<path d="M8 12h8M12 8v8"/>'
};
function creerIconeTheme(identifiant, libelle = '') {
    const trace = TRACES_ICONE_THEME[identifiant] || TRACES_ICONE_THEME.commun;
    return `<span class="theme-icone theme-icone-${identifiant}" role="img"`
        + ` aria-label="${libelle}"><svg viewBox="0 0 24 24" aria-hidden="true">`
        + `${trace}</svg></span>`;
}
const selectionner = selecteur => document.querySelector(selecteur);
const selectionnerTous = selecteur => [...document.querySelectorAll(selecteur)];
function envoyerEvenementPJJ(nom, parametres = {}) {
    return window.PJJ_ANALYTICS?.envoyer?.(nom, parametres) === true;
}
const LIBELLES_PAGES_ANALYTICS = Object.freeze({
    accueil: 'Accueil',
    parcours: 'Parcours PJJ',
    carnet: 'Carnet de voyage',
    entrainement: 'Entraînement libre',
    erreurs: 'Mes erreurs à retravailler',
    progression: 'Progression',
    parametres: 'Paramètres',
    question: 'Question',
    bilan: 'Bilan de la session',
    consentement: 'Consentement Analytics',
    aucun: 'Aucune page précédente'
});
const LIBELLES_JOKERS_ANALYTICS = Object.freeze({
    '50_50': '50/50',
    indice: 'Indice',
    langue_au_chat: 'Langue au chat'
});
function obtenirLibellePageAnalytics(identifiant) {
    return LIBELLES_PAGES_ANALYTICS[identifiant] || String(identifiant || 'Page inconnue');
}
function obtenirLibelleTailleTexteAnalytics(echelle) {
    const valeur = Number(echelle);
    if (valeur <= 0.91)
        return 'Compacte';
    if (valeur >= 1.07)
        return 'Grande';
    return 'Normale';
}
function obtenirLibelleModeJeuAnalytics() {
    if (etat?.origineSessionAnalytics === 'defi_du_hasard')
        return 'Défi du hasard';
    if (etat?.mode === 'parcours')
        return 'Parcours PJJ';
    if (etat?.mode === 'libre')
        return 'Entraînement libre';
    if (etat?.mode === 'revision')
        return 'Révision des erreurs';
    if (etat?.mode === 'evaluation-finale')
        return 'Évaluation finale';
    return null;
}
function obtenirInformationsEtapeAnalytics(question = null) {
    const numeroVisible = Number(question?.etape ?? etat?.etape);
    if (!Number.isFinite(numeroVisible) || numeroVisible <= 0)
        return { numero: null, nom: null };
    if (numeroVisible === 12)
        return { numero: 12, nom: 'Évaluation finale' };
    const identifiantTheme = question?.theme || etat?.theme || 'commun';
    const etapeProgramme = obtenirEtapeProgramme(identifiantTheme, numeroVisible)
        || obtenirEtapeProgramme('commun', numeroVisible);
    // L'ordre visible peut évoluer sans recycler l'identité Analytics historique.
    // Ex. l'ancienne étape 8 de placement est désormais visible en étape 9,
    // mais conserve l'identité permanente Analytics 8.
    const numeroPermanent = Number(
        question?.etapeAnalyticsPermanent
        ?? etapeProgramme?.idAnalyticsPermanent
        ?? numeroVisible
    );
    return {
        numero: Number.isFinite(numeroPermanent) && numeroPermanent > 0 ? numeroPermanent : numeroVisible,
        nom: etapeProgramme?.titre || `Étape ${numeroVisible}`
    };
}
function obtenirIdentifiantQuestionAnalytics(question) {
    const identifiant = Number(question?.id);
    if (!Number.isFinite(identifiant))
        return null;
    return `Q${String(Math.trunc(identifiant)).padStart(3, '0')}`;
}
function obtenirResultatReponseAnalytics(statut) {
    const correspondances = {
        correcte: 'Réussite autonome',
        correcte_autonome: 'Réussite autonome',
        aidee: 'Réussite avec aide',
        correcte_aidee: 'Réussite avec aide',
        incorrecte: 'Réponse incorrecte',
        passee: 'Question passée',
        a_repondre: 'À répondre'
    };
    return correspondances[statut] || null;
}
function obtenirDureeSessionAnalytics() {
    if (!Number.isFinite(etat?.debutSessionAnalytics))
        return null;
    return Math.max(0, Math.round((Date.now() - etat.debutSessionAnalytics) / 1000));
}
function obtenirContexteSessionAnalytics() {
    const modeDeJeu = obtenirLibelleModeJeuAnalytics();
    if (!modeDeJeu)
        return {};
    const contexte = {
        pjjoue_mode_de_jeu: modeDeJeu,
        pjjoue_nombre_questions: Array.isArray(etat?.questionsSession) && etat.questionsSession.length
            ? etat.questionsSession.length
            : null,
        pjjoue_jokers: etat?.jokersSessionActifs === false ? 'Sans' : 'Avec'
    };
    if (etat.mode === 'parcours' || etat.mode === 'evaluation-finale') {
        const etape = obtenirInformationsEtapeAnalytics();
        contexte.pjjoue_numero_etape = etape.numero;
        contexte.pjjoue_nom_etape = etape.nom;
    }
    if (etat.mode === 'parcours') {
        contexte.pjjoue_defi_chrono = etat.chronometreSessionActif ? 'Chronométré' : 'Libre';
        contexte.pjjoue_temps_par_question_defi_chrono = etat.chronometreSessionActif
            ? Number(etat.dureeChronometreSession) || null
            : null;
    }
    if (etat.mode === 'libre' && etat.origineSessionAnalytics !== 'defi_du_hasard') {
        contexte.pjjoue_mode_entrainement = etat.organisationSession === 'ordonne'
            ? 'Par ordre d’étapes'
            : 'Mélangé';
        contexte.pjjoue_chrono = etat.chronometreSessionActif ? 'Avec' : 'Sans';
        contexte.pjjoue_temps_par_question = etat.chronometreSessionActif
            ? Number(etat.dureeChronometreSession) || null
            : null;
    }
    if (etat.origineSessionAnalytics === 'defi_du_hasard') {
        contexte.pjjoue_nombre_questions_defi_du_hasard = Number(etat.nombreQuestionsTirageDe) || null;
    }
    return contexte;
}
function obtenirContexteQuestionAnalytics(question) {
    const etape = obtenirInformationsEtapeAnalytics(question);
    const modeQuestion = question
        ? (question.modePresentation || obtenirModeQuestion(question))
        : null;
    return {
        ...obtenirContexteSessionAnalytics(),
        pjjoue_numero_etape: etape.numero,
        pjjoue_nom_etape: etape.nom,
        pjjoue_identifiant_question: obtenirIdentifiantQuestionAnalytics(question),
        pjjoue_nom_question: question?.enonce || null,
        pjjoue_position_question_session: Number.isFinite(Number(etat?.indexQuestion))
            ? Number(etat.indexQuestion) + 1
            : null,
        pjjoue_type_question: modeQuestion ? obtenirLibelleMode(modeQuestion) : null
    };
}
function envoyerUtilisationJoker(type) {
    envoyerEvenementPJJ('joker_utilise', {
        ...obtenirContexteQuestionAnalytics(etat.questionCourante),
        pjjoue_joker_utilise: LIBELLES_JOKERS_ANALYTICS[type] || type
    });
}
function estRouteAccueil() {
    const fragment = location.hash || '#accueil';
    return fragment === '#accueil' || fragment === '#' || fragment === '';
}
function remettreAccueilEnHaut() {
    const racineDefilement = document.scrollingElement || document.documentElement;
    if (racineDefilement)
        racineDefilement.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    if (document.body)
        document.body.scrollTop = 0;
    window.scrollTo(0, 0);
}
function garantirAccueilEnHaut() {
    if (!estRouteAccueil())
        return;
    remettreAccueilEnHaut();
    requestAnimationFrame(() => {
        remettreAccueilEnHaut();
        requestAnimationFrame(remettreAccueilEnHaut);
    });
    setTimeout(remettreAccueilEnHaut, 80);
    setTimeout(remettreAccueilEnHaut, 220);
}
function echapperHtml(valeur) {
    const caracteresEchappes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(valeur ?? '').replace(
        /[&<>"']/g,
        caractere => caracteresEchappes[caractere]
    );
}
const MESSAGES_REUSSITE = [
    'Solide ! Tu viens de sécuriser un vrai réflexe professionnel.',
    'Très bien raisonné. Ce point-là commence à devenir automatique.',
    'Exact. Tu as résisté au piège le plus tentant.',
    'Bien vu ! La fiabilité avant la précipitation.',
    'Excellent : tu as identifié ce qui devait être vérifié avant d’agir.'
];
const MESSAGES_ERREUR = [
    'Une erreur ici, c’est une erreur évitée sur le terrain.',
    'Respire : relis l’acteur, la source, l’échéance et la limite de ton rôle.',
    'Ce piège était crédible. C’est précisément pour ça qu’il faut l’entraîner.',
    'Pas grave : transforme l’erreur en règle de contrôle.',
    'Tu n’as pas raté la PJJ : tu viens de trouver un point à consolider.'
];
const CLE_SAUVEGARDE = 'pjjoue_V1_sauvegarde';
const CLE_SESSION_EN_COURS = 'pjjoue_session_en_cours_v1';
// -----------------------------------------------------------------------------
// Sauvegarde locale et état général
// -----------------------------------------------------------------------------
function creerSauvegardeInitiale() {
    return {
        version: 'V3-activites-educatives',
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
        evaluationFinale: { meilleurScore: 0, nombreTentatives: 0, reussie: false }
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
            );
            if (!Number.isInteger(etape)
                || !PROGRAMMES[theme]?.etapes?.some(element => Number(element.id) === etape)
                || !estObjetSimple(enregistrement))
                continue;
            const identifiantsQuestions = new Set(
                questionsEtape.map(question => String(question.id))
            );
            progressionNettoyee.apprenant[theme][numeroEtape] = {
                meilleurScore: convertirEntierBorne(
                    enregistrement.meilleurScore,
                    0,
                    questionsEtape.length
                ),
                nombreTentatives: convertirEntierBorne(enregistrement.nombreTentatives),
                questionsTraitees: filtrerIndicateurs(
                    enregistrement.questionsTraitees,
                    identifiantsQuestions
                ),
                resultats: filtrerResultats(
                    enregistrement.resultats,
                    identifiantsQuestions
                ),
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
            theme: estThemeConnu(enregistrement.theme) ? enregistrement.theme : 'commun'
        };
    }
    return erreursNettoyees;
}

function migrerSauvegardeV1VersV2(sauvegardeBrute) {
    if (!estObjetSimple(sauvegardeBrute) || ['V2-12-etapes', 'V3-activites-educatives'].includes(sauvegardeBrute.version))
        return sauvegardeBrute;
    const copie = JSON.parse(JSON.stringify(sauvegardeBrute));
    copie.version = 'V2-12-etapes';
    copie.erreurs = {};
    copie.progression = { apprenant: {} };
    copie.etapesDecouvertes = {};
    copie.questionsJouees = {};
    copie.evaluationFinale = { meilleurScore: 0, nombreTentatives: 0, reussie: false };
    return copie;
}
function migrerSauvegardeV2VersV3(sauvegardeBrute) {
    if (!estObjetSimple(sauvegardeBrute) || sauvegardeBrute.version === 'V3-activites-educatives')
        return sauvegardeBrute;
    if (sauvegardeBrute.version !== 'V2-12-etapes')
        return sauvegardeBrute;
    const copie = JSON.parse(JSON.stringify(sauvegardeBrute));
    const progressionCommun = copie.progression?.apprenant?.commun;
    if (estObjetSimple(progressionCommun)) {
        const ancienne8 = progressionCommun['8'];
        const ancienne9 = progressionCommun['9'];
        const ancienne10 = progressionCommun['10'];
        // L'ancienne étape 11 est remplacée par un nouveau thème : son progrès n'est pas transféré.
        delete progressionCommun['11'];
        delete progressionCommun['8'];
        delete progressionCommun['9'];
        delete progressionCommun['10'];
        if (ancienne8) progressionCommun['9'] = ancienne8;
        if (ancienne9) progressionCommun['10'] = ancienne9;
        if (ancienne10) progressionCommun['11'] = ancienne10;
    }
    if (estObjetSimple(copie.etapesDecouvertes)) {
        const anciennes = { ...copie.etapesDecouvertes };
        delete copie.etapesDecouvertes['8'];
        delete copie.etapesDecouvertes['9'];
        delete copie.etapesDecouvertes['10'];
        delete copie.etapesDecouvertes['11'];
        if (anciennes['8']) copie.etapesDecouvertes['9'] = true;
        if (anciennes['9']) copie.etapesDecouvertes['10'] = true;
        if (anciennes['10']) copie.etapesDecouvertes['11'] = true;
    }
    copie.version = 'V3-activites-educatives';
    return copie;
}

function nettoyerSauvegarde(sauvegardeBrute) {
    sauvegardeBrute = migrerSauvegardeV1VersV2(sauvegardeBrute);
    sauvegardeBrute = migrerSauvegardeV2VersV3(sauvegardeBrute);
    const sauvegardeInitiale = creerSauvegardeInitiale();
    if (!estObjetSimple(sauvegardeBrute))
        return sauvegardeInitiale;
    const parametres = estObjetSimple(sauvegardeBrute.parametres)
        ? sauvegardeBrute.parametres
        : {};
    const evaluationFinale = estObjetSimple(sauvegardeBrute.evaluationFinale)
        ? sauvegardeBrute.evaluationFinale
        : {};
    const nombreQuestionsJouees = convertirEntierBorne(sauvegardeBrute.nombreQuestionsJouees);
    const identifiantsEtapes = new Set(
        Object.values(PROGRAMMES)
            .flatMap(programme => programme.etapes || [])
            .map(etape => String(etape.id))
    );
    const identifiantsQuestions = new Set(QUESTIONS.map(question => String(question.id)));
    return {
        ...sauvegardeInitiale,
        version: 'V3-activites-educatives',
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
            echelleTexte: [.9, 1, 1.08].includes(Number(parametres.echelleTexte))
                ? Number(parametres.echelleTexte)
                : 1
        },
        dernierTheme: estThemeConnu(sauvegardeBrute.dernierTheme)
            ? sauvegardeBrute.dernierTheme
            : null,
        etapesDecouvertes: filtrerIndicateurs(
            sauvegardeBrute.etapesDecouvertes,
            identifiantsEtapes
        ),
        questionsJouees: filtrerIndicateurs(
            sauvegardeBrute.questionsJouees,
            identifiantsQuestions
        ),
        evaluationFinale: {
            meilleurScore: convertirEntierBorne(evaluationFinale.meilleurScore, 0, 50),
            nombreTentatives: convertirEntierBorne(evaluationFinale.nombreTentatives),
            reussie: evaluationFinale.reussie === true
        }
    };
}
function chargerSauvegarde() {
    try {
        const contenu = localStorage.getItem(CLE_SAUVEGARDE);
        return contenu ? nettoyerSauvegarde(JSON.parse(contenu)) : creerSauvegardeInitiale();
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
    jokers: {
        cinquanteCinquante: true,
        indice: true,
        langueAuChat: true
    },
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
    brouillonsEcrits: new Map()
};
let minuteurRappelJokers = null;
let minuteurFinRappelJokers = null;
let minuteurTransitionParcours = null;
function effacerSauvegardeV1DuNavigateur() {
    try {
        localStorage.removeItem(CLE_SAUVEGARDE);
    }
    catch (erreur) {
        // L’indisponibilité du stockage sera signalée par l’enregistrement suivant.
    }
}
function enregistrerSauvegarde() {
    sauvegarde.version = 'V3-activites-educatives';
    try {
        localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(sauvegarde));
        return true;
    }
    catch (erreur) {
        afficherNotification('La sauvegarde locale est indisponible. Exporte ta progression avant de fermer la page.');
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
// -----------------------------------------------------------------------------
// Navigation, historique et fenêtres de confirmation
// -----------------------------------------------------------------------------
function routePourEcran(identifiant) {
    if (identifiant === 'parcours' && etat.theme)
        return '#parcours/' + encodeURIComponent(etat.theme);
    return '#' + identifiant;
}
function creerEtatNavigation(identifiant) {
    return {
        pjjoue: true,
        ecran: identifiant,
        theme: etat.theme,
        etape: etat.etape
    };
}
function actualiserBoutonRetour() {
    const boutonRetour = selectionner('#boutonRetour');
    if (!boutonRetour)
        return;
    const retourDisponible = etat.ecran !== 'accueil';
    boutonRetour.classList.toggle('masque', !retourDisponible);
    boutonRetour.disabled = !retourDisponible;
}
function mesurerHauteurEntete() {
    const entete = document.querySelector('header.entete');
    const hauteur = Math.ceil(entete?.getBoundingClientRect().height || 66);
    document.documentElement.style.setProperty('--hauteur-entete', hauteur + 'px');
}
function fermerMenuMobile() {
    const entete = document.querySelector('header.entete');
    const bouton = selectionner('#boutonMenuMobile');
    entete?.classList.remove('menu-mobile-ouvert');
    bouton?.setAttribute('aria-expanded', 'false');
    bouton?.setAttribute('aria-label', 'Ouvrir le menu');
}
function basculerMenuMobile() {
    const entete = document.querySelector('header.entete');
    const bouton = selectionner('#boutonMenuMobile');
    if (!entete || !bouton)
        return;
    const ouvert = entete.classList.toggle('menu-mobile-ouvert');
    bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    bouton.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    mesurerHauteurEntete();
}
function actualiserNavigation(identifiant) {
    selectionnerTous('.navigation [data-ecran]').forEach(bouton => {
        const actif = bouton.dataset.ecran === identifiant;
        if (actif)
            bouton.setAttribute('aria-current', 'page');
        else
            bouton.removeAttribute('aria-current');
    });
}
function ajusterQuestionAEcran() {
    const zoneQuestion = document.getElementById('question');
    const conteneur = zoneQuestion?.querySelector('.question-conteneur');
    if (!zoneQuestion || !conteneur || !zoneQuestion.classList.contains('actif'))
        return;
    const entete = document.querySelector('header.entete');
    const basEntete = entete ? entete.getBoundingClientRect().bottom : 0;
    const boutonRetour = selectionner('#boutonRetour');
    const hauteurRetour = boutonRetour && !boutonRetour.classList.contains('masque')
        ? boutonRetour.getBoundingClientRect().height + 8
        : 0;
    const basSecurise = 12;
    const disponibles = Math.max(
        320,
        window.innerHeight - basEntete - hauteurRetour - basSecurise
    );
    // Réinitialise avant mesure pour ne pas accumuler les réductions.
    zoneQuestion.style.setProperty('--densite-question', '1');
    requestAnimationFrame(() => {
        const hauteurNaturelle = conteneur.scrollHeight;
        let densite = Math.min(1, disponibles / Math.max(hauteurNaturelle, 1));
        // Marge de sécurité légère pour éviter le pixel de scroll.
        densite = Math.max(.68, densite * .97);
        // Les questions normales restent à taille pleine.
        if (densite > .97)
            densite = 1;
        zoneQuestion.style.setProperty('--densite-question', densite.toFixed(3));
    });
}
const TITRES_ECRANS = {
    accueil: 'Accueil',
    parcours: 'Parcours PJJ',
    carnet: 'Carnet de voyage',
    entrainement: 'Choisis ton mode d’entraînement',
    erreurs: 'Mes erreurs à retravailler',
    progression: 'Progression',
    parametres: 'Paramètres',
    question: 'Question',
    bilan: 'Résultats'
};
function actualiserTitrePage(ecran) {
    document.title = `${TITRES_ECRANS[ecran] || 'PJJoue'} — PJJoue`;
}
function afficherEcran(identifiant, optionsAffichage = {}) {
    fermerMenuMobile();
    clearInterval(etat.identifiantMinuteur);
    if (identifiant !== 'question')
        fermerFenetreJokers({ restaurerFocus: false });
    const courant = etat.ecran;
    const doitMemoriserEcran = courant
        && courant !== identifiant
        && !optionsAffichage.remplacerHistorique
        && !optionsAffichage.depuisHistorique
        && !restaurationNavigation;
    if (doitMemoriserEcran) {
        historiqueNavigation.push({ ecran: courant, theme: etat.theme, etape: etat.etape });
        if (historiqueNavigation.length > 30)
            historiqueNavigation.shift();
    }
    const doitAbandonnerSession = courant === 'question'
        && identifiant !== 'question'
        && !optionsAffichage.remplacerHistorique
        && !optionsAffichage.forcerSortieQuestion
        && !optionsAffichage.depuisHistorique;
    if (doitAbandonnerSession) {
        envoyerEvenementPJJ('session_quittee', {
            ...obtenirContexteSessionAnalytics(),
            pjjoue_reussites_autonomes: etat.score,
            pjjoue_questions_passees: etat.questionsPassees?.size || 0,
            pjjoue_reussites_avec_aide: etat.nombreReponsesAidees || 0,
            pjjoue_joker_utilise_session: sessionAUtiliseJoker() ? 'Oui' : 'Non',
            pjjoue_duree_session_secondes: obtenirDureeSessionAnalytics(),
            pjjoue_resultat_session: 'Session quittée'
        });
        etat.questionsSession = [];
        etat.questionCourante = null;
        etat.questionValidee = false;
        etat.delaiDepasse = false;
        effacerSessionEnCours();
    }
    selectionnerTous('.ecran').forEach(ecran => ecran.classList.remove('actif'));
    const cible = selectionner('#' + identifiant);
    if (!cible)
        return false;
    cible.classList.add('actif');
    etat.ecran = identifiant;
    document.body.dataset.ecranActif = identifiant;
    if (courant !== identifiant) {
        envoyerEvenementPJJ('page_consultee', {
            pjjoue_page_consultee: obtenirLibellePageAnalytics(identifiant),
            pjjoue_page_precedente: obtenirLibellePageAnalytics(courant || 'aucun')
        });
    }
    actualiserTitrePage(identifiant);
    mesurerHauteurEntete();
    if (identifiant === 'erreurs')
        afficherErreurs();
    if (identifiant === 'progression')
        afficherProgression();
    if (identifiant === 'parametres')
        afficherSources();
    if (identifiant === 'carnet') {
        initialiserProgression('commun');
        actualiserCarnetParcours(PROGRAMMES.commun);
    }
    actualiserGroupesChoix();
    actualiserNavigation(identifiant);
    actualiserBoutonRetour();
    if (!optionsAffichage.depuisHistorique && !restaurationNavigation) {
        const methode = optionsAffichage.remplacerHistorique ? 'replaceState' : 'pushState';
        history[methode](creerEtatNavigation(identifiant), '', routePourEcran(identifiant));
    }
    if (identifiant === 'accueil')
        garantirAccueilEnHaut();
    else
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (identifiant !== 'question') {
        requestAnimationFrame(() => {
            const titre = cible.querySelector('h1,h2');
            titre?.setAttribute('tabindex', '-1');
            titre?.focus?.({ preventScroll: true });
        });
    }
    return true;
}
function ouvrirFenetreMessage({
    titre = 'Information',
    message = '',
    libelleConfirmer = 'Compris',
    libelleAnnuler = 'Annuler',
    afficherAnnuler = false,
    variante = 'standard',
    apresConfirmation,
    apresAnnulation
} = {}) {
    const fenetre = selectionner('#fenetreMessage');
    const elementTitre = selectionner('#titreFenetreMessage');
    const elementTexte = selectionner('#texteFenetreMessage');
    const boutonConfirmer = selectionner('#confirmerFenetreMessage');
    const boutonAnnuler = selectionner('#annulerFenetreMessage');
    const boutonFermer = selectionner('#fermerFenetreMessage');
    if (!fenetre || !elementTitre || !elementTexte || !boutonConfirmer || !boutonAnnuler || !boutonFermer) {
        afficherNotification(message || titre);
        apresAnnulation?.();
        return;
    }
    if (fenetre.open)
        fenetre.close();
    elementTitre.textContent = titre;
    elementTexte.textContent = message;
    boutonConfirmer.textContent = libelleConfirmer;
    boutonAnnuler.textContent = libelleAnnuler;
    boutonAnnuler.classList.toggle('masque', !afficherAnnuler);
    boutonConfirmer.className = variante === 'danger' ? 'danger' : 'principal';
    fenetre.classList.toggle('fenetre-danger', variante === 'danger');
    fenetre.classList.toggle('fenetre-reussite', variante === 'reussite');
    fenetre.classList.toggle('fenetre-avertissement', variante === 'avertissement');
    let resolu = false;
    const resoudre = confirme => {
        if (resolu)
            return;
        resolu = true;
        if (fenetre.open)
            fenetre.close();
        fenetre.oncancel = null;
        boutonConfirmer.onclick = null;
        boutonAnnuler.onclick = null;
        boutonFermer.onclick = null;
        if (confirme)
            apresConfirmation?.();
        else
            apresAnnulation?.();
    };
    fenetre.oncancel = evenement => { evenement.preventDefault(); resoudre(false); };
    boutonConfirmer.onclick = () => resoudre(true);
    boutonAnnuler.onclick = () => resoudre(false);
    boutonFermer.onclick = () => resoudre(false);
    fenetre.showModal();
    requestAnimationFrame(() => (afficherAnnuler ? boutonAnnuler : boutonConfirmer).focus());
}
function ouvrirFenetreQuitterSession({ message, apresConfirmation, apresAnnulation } = {}) {
    const fenetre = selectionner('#fenetreQuitterSession');
    const texte = selectionner('#texteFenetreQuitterSession');
    const boutonAnnuler = selectionner('#annulerQuitterSession');
    const boutonConfirmer = selectionner('#confirmerQuitterSession');
    const boutonFermer = selectionner('#fermerFenetreQuitterSession');
    if (!fenetre || !texte || !boutonAnnuler || !boutonConfirmer || !boutonFermer) {
        ouvrirFenetreMessage({
            titre: 'Quitter cette session ?',
            message: message || 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.',
            libelleConfirmer: 'Quitter la session',
            libelleAnnuler: 'Annuler',
            afficherAnnuler: true,
            apresConfirmation,
            apresAnnulation
        });
        return;
    }
    texte.textContent = message || 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.';
    let resolu = false;
    const nettoyerEcouteurs = () => {
        fenetre.removeEventListener('cancel', gererAnnulation);
        boutonAnnuler.removeEventListener('click', gererClicAnnulation);
        boutonFermer.removeEventListener('click', gererClicAnnulation);
        boutonConfirmer.removeEventListener('click', gererConfirmation);
    };
    const terminerFenetre = confirme => {
        if (resolu)
            return;
        resolu = true;
        nettoyerEcouteurs();
        if (fenetre.open)
            fenetre.close();
        if (confirme)
            apresConfirmation?.();
        else
            apresAnnulation?.();
    };
    const gererAnnulation = evenement => { evenement.preventDefault(); terminerFenetre(false); };
    const gererClicAnnulation = () => terminerFenetre(false);
    const gererConfirmation = () => terminerFenetre(true);
    fenetre.addEventListener('cancel', gererAnnulation);
    boutonAnnuler.addEventListener('click', gererClicAnnulation);
    boutonFermer.addEventListener('click', gererClicAnnulation);
    boutonConfirmer.addEventListener('click', gererConfirmation);
    fenetre.showModal();
    requestAnimationFrame(() => boutonAnnuler.focus());
}
function revenirEnArriere() {
    if (confirmationRetourEnCours)
        return;
    if (etat.ecran === 'question' && etat.questionsSession?.length && !etat.questionValidee) {
        confirmationRetourEnCours = true;
        ouvrirFenetreQuitterSession({
            message: 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.',
            apresAnnulation: () => { confirmationRetourEnCours = false; },
            apresConfirmation: () => {
                clearInterval(etat.identifiantMinuteur);
                etat.identifiantMinuteur = null;
                etat.questionsSession = [];
                etat.questionCourante = null;
                etat.questionValidee = false;
                confirmationRetourEnCours = false;
                revenirEnArriere();
            }
        });
        return;
    }
    while (historiqueNavigation.length && historiqueNavigation[historiqueNavigation.length - 1]?.ecran === etat.ecran)
        historiqueNavigation.pop();
    if (historiqueNavigation.length) {
        const precedent = historiqueNavigation.pop();
        if (precedent.theme)
            etat.theme = precedent.theme;
        if (precedent.etape)
            etat.etape = Number(precedent.etape);
        if (precedent.ecran === 'parcours' && etat.theme) {
            afficherEtapes();
        }
        afficherEcran(precedent.ecran || 'accueil', { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    if (etat.ecran === 'question') {
        const secours = etat.mode === 'parcours' || etat.mode === 'evaluation-finale' ? 'parcours' : (etat.mode === 'revision' ? 'erreurs' : 'entrainement');
        if (secours === 'parcours') {
            ouvrirParcours('commun', { remplacerHistorique: true });
            return;
        }
        afficherEcran(secours, { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    if (etat.ecran === 'parcours' || etat.ecran === 'carnet' || etat.ecran === 'entrainement') {
        afficherEcran('accueil', { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    if (etat.ecran === 'bilan') {
        if (etat.mode === 'parcours' || etat.mode === 'evaluation-finale') {
            ouvrirParcours('commun', { remplacerHistorique: true });
            return;
        }
        afficherEcran(etat.mode === 'revision' ? 'erreurs' : 'entrainement', { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    afficherEcran('accueil', { forcerSortieQuestion: true, remplacerHistorique: true });
}
function lireRoute() {
    const parties = location.hash.replace(/^#/, '').split('/').map(decodeURIComponent);
    if (parties[0] === 'parcours')
        return { pjjoue: true, ecran: 'parcours', theme: parties[1] || 'commun' };
    const ecransAutorises = ['accueil', 'parcours', 'carnet', 'entrainement', 'erreurs', 'progression', 'parametres', 'question'];
    return { pjjoue: true, ecran: ecransAutorises.includes(parties[0]) ? parties[0] : 'accueil' };
}
function restaurerRoute(route) {
    const etatRoute = route?.pjjoue ? route : lireRoute();
    if (etatRoute.theme)
        etat.theme = etatRoute.theme;
    if (etatRoute.etape)
        etat.etape = Number(etatRoute.etape);
    restaurationNavigation = true;
    if (etatRoute.ecran === 'question') {
        if (restaurerSessionEnCours()) {
            afficherEcran('question', { depuisHistorique: true, forcerSortieQuestion: true });
            afficherQuestion({ suivreAnalytics: false, reprendreChronometre: true });
        }
        else {
            ouvrirParcours(etatRoute.theme || 'commun', { remplacerHistorique: true });
        }
    }
    else if (etatRoute.ecran === 'parcours' && etatRoute.theme)
        ouvrirParcours(etatRoute.theme);
    else
        afficherEcran(etatRoute.ecran || 'accueil', { depuisHistorique: true, forcerSortieQuestion: true });
    restaurationNavigation = false;
    history.replaceState(creerEtatNavigation(etat.ecran), '', routePourEcran(etat.ecran));
}
window.addEventListener('popstate', evenement => {
    if (etat.ecran === 'question' && etat.questionsSession?.length) {
        history.forward();
        ouvrirFenetreQuitterSession({
            message: 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.',
            apresConfirmation: () => {
                clearInterval(etat.identifiantMinuteur);
                etat.identifiantMinuteur = null;
                etat.questionsSession = [];
                etat.questionCourante = null;
                etat.questionValidee = false;
                effacerSessionEnCours();
                history.back();
            }
        });
        return;
    }
    restaurerRoute(evenement.state);
});
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
            termineeSansJoker: false,
            jokersUtilises: true,
            ...progressionExistante
        };
        progressionEtape.questionsTraitees = progressionEtape.questionsTraitees || {};
        progressionEtape.resultats = progressionEtape.resultats || {};
        sauvegarde.progression[proprietaire][theme][etapeProgramme.id] = progressionEtape;
    });
}
function obtenirBilanEtape(theme, etape) {
    initialiserProgression(theme);
    return sauvegarde.progression[obtenirProgressionApprenant()][theme][etape];
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
    });
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
    if (!Number.isFinite(etape) || etape < 1 || !obtenirEtapeProgramme(question.theme, etape))
        return;
    sauvegarde.etapesDecouvertes = sauvegarde.etapesDecouvertes || {};
    sauvegarde.etapesDecouvertes[etape] = true;
}
function compterEtapesDecouvertes() {
    const etapes = new Set();
    sauvegarde.questionsJouees = sauvegarde.questionsJouees || {};
    Object.keys(sauvegarde.questionsJouees).forEach(identifiant => {
        if (!sauvegarde.questionsJouees[identifiant])
            return;
        const question = QUESTIONS.find(element => String(element.id) === String(identifiant));
        if (question && Number.isFinite(Number(question.etape))) {
            etapes.add(Number(question.etape));
        }
    });
    Object.keys(sauvegarde.erreurs || {}).forEach(identifiant => {
        const question = QUESTIONS.find(element => String(element.id) === String(identifiant));
        if (question && Number.isFinite(Number(question.etape))) {
            etapes.add(Number(question.etape));
        }
    });
    const identifiantTheme = 'commun';
    const etapesProgramme = obtenirEtapesProgramme(identifiantTheme);
    if (Array.isArray(etapesProgramme)) {
        etapesProgramme.forEach(etapeProgramme => {
            if ((Number(compterQuestionsTraiteesEtape(identifiantTheme, etapeProgramme.id)) || 0) > 0) {
                etapes.add(Number(etapeProgramme.id));
            }
        });
    }
    return etapes.size;
}
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
function obtenirProchaineDestinationParcours(programme) {
    const etapeAReprendre = obtenirEtapeAReprendre(programme);
    if (etapeAReprendre) {
        const nombreQuestions = obtenirQuestionsEtape(programme.id, etapeAReprendre.id).length;
        const nombreQuestionsTraitees = compterQuestionsTraiteesEtape(programme.id, etapeAReprendre.id);
        if (nombreQuestionsTraitees < nombreQuestions)
            return `Prochaine destination : étape ${etapeAReprendre.id} · ${etapeAReprendre.titre}`;
        return `Défi d’autonomie : rejoue l’étape ${etapeAReprendre.id} sans joker.`;
    }
    return 'Toutes les étapes sont maîtrisées : l’évaluation finale t’attend.';
}
function calculerAvancementCarnetParcours(programme) {
    const questionsParcours = programme.etapes.flatMap(etapeProgramme =>
        obtenirQuestionsEtape(programme.id, etapeProgramme.id)
    );
    if (!questionsParcours.length)
        return 0;
    const nombreQuestionsTraitees = programme.etapes.reduce(
        (total, etapeProgramme) => total + compterQuestionsTraiteesEtape(programme.id, etapeProgramme.id),
        0
    );
    return Math.round(nombreQuestionsTraitees / questionsParcours.length * 100);
}
function actualiserCarnetParcours(programme) {
    const titreSymbolique = selectionner('#titreSymboliqueParcours');
    const prochaineDestination = selectionner('#prochaineDestinationParcours');
    const route = selectionner('#routeCarnetParcours');
    if (!titreSymbolique || !prochaineDestination || !route)
        return;
    const nombreEtapesMaitrisees = programme.etapes.filter(etapeProgramme =>
        estEtapeMaitrisee(programme.id, etapeProgramme.id)
    ).length;
    const avancement = calculerAvancementCarnetParcours(programme);
    titreSymbolique.textContent = obtenirTitreSymboliqueParcours(nombreEtapesMaitrisees);
    prochaineDestination.textContent = obtenirProchaineDestinationParcours(programme);
    route.style.setProperty('--avancement-carnet', `${avancement}%`);
    route.setAttribute('aria-valuenow', String(avancement));
    afficherSouvenirsParcours(programme);
    afficherDefisParcours(programme);
}
function actualiserResumeCarteParcours(programme) {
    const resumeCarte = selectionner('#resumeCarteParcours');
    if (!resumeCarte)
        return;
    const nombreEtapesMaitrisees = programme.etapes.filter(etapeProgramme =>
        estEtapeMaitrisee(programme.id, etapeProgramme.id)
    ).length;
    const evaluationOuverte = nombreEtapesMaitrisees === programme.etapes.length;
    resumeCarte.textContent = evaluationOuverte
        ? `${nombreEtapesMaitrisees}/${programme.etapes.length} destinations maîtrisées sans joker · Évaluation finale ouverte.`
        : `${nombreEtapesMaitrisees}/${programme.etapes.length} destinations maîtrisées sans joker · Le prochain jalon t’attend sur la carte.`;
}
function afficherSouvenirsParcours(programme) {
    const zone = selectionner('#souvenirsParcours');
    if (!zone)
        return;
    const etapesMaitrisees = programme.etapes.filter(etapeProgramme =>
        estEtapeMaitrisee(programme.id, etapeProgramme.id)
    );
    zone.innerHTML = '';
    if (!etapesMaitrisees.length) {
        const message = document.createElement('p');
        message.className = 'carnet-vide';
        message.textContent = 'Maîtrise une étape pour conserver ses trois repères essentiels.';
        zone.appendChild(message);
        return;
    }
    etapesMaitrisees.forEach((etapeProgramme, indice) => {
        const fiche = document.createElement('details');
        fiche.className = 'souvenir-etape';
        fiche.dataset.etape = String(etapeProgramme.id);
        fiche.style.setProperty('--couleur-etape', etapeProgramme.couleur || '#ffc83d');
        fiche.open = indice === etapesMaitrisees.length - 1;
        const titre = document.createElement('summary');
        titre.textContent = `Étape ${etapeProgramme.id} · ${etapeProgramme.titre}`;
        const liste = document.createElement('ul');
        (etapeProgramme.souvenirs || []).forEach(souvenir => {
            const element = document.createElement('li');
            element.textContent = souvenir;
            liste.appendChild(element);
        });
        fiche.append(titre, liste);
        zone.appendChild(fiche);
    });
}
function afficherDefisParcours(programme) {
    const zone = selectionner('#defisParcours');
    if (!zone)
        return;
    const etapeAReprendre = obtenirEtapeAReprendre(programme);
    const meilleureSerie = Number(sauvegarde.meilleureSerie) || 0;
    const aucuneErreurActive = sauvegarde.aDejaJoue && compterErreursActives() === 0;
    const defis = [
        {
            libelle: etapeAReprendre
                ? `Valider l’étape ${etapeAReprendre.id} sans joker`
                : 'Valider les onze étapes sans joker',
            termine: !etapeAReprendre,
            progression: etapeAReprendre ? 'En cours' : 'Réussi'
        },
        {
            libelle: 'Enchaîner 5 réussites autonomes',
            termine: meilleureSerie >= 5,
            progression: `${Math.min(meilleureSerie, 5)}/5`
        },
        {
            libelle: 'Ne garder aucune erreur active',
            termine: aucuneErreurActive,
            progression: aucuneErreurActive ? 'Réussi' : `${compterErreursActives()} à revoir`
        }
    ];
    zone.innerHTML = '';
    defis.forEach(defi => {
        const element = document.createElement('li');
        element.className = defi.termine ? 'defi-termine' : '';
        const indicateur = document.createElement('span');
        indicateur.className = 'defi-indicateur';
        indicateur.setAttribute('aria-hidden', 'true');
        indicateur.textContent = defi.termine ? '✓' : '○';
        const libelle = document.createElement('strong');
        libelle.textContent = defi.libelle;
        const progression = document.createElement('small');
        progression.textContent = defi.progression;
        element.append(indicateur, libelle, progression);
        zone.appendChild(element);
    });
}
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
function initialiserGroupesChoix() {
    selectionnerTous('[data-groupe-choix]').forEach(groupe => {
        const listeDeroulante = selectionner('#' + groupe.dataset.groupeChoix);
        groupe.setAttribute('role', 'group');
        groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
            bouton.setAttribute('aria-pressed', 'false');
            bouton.onclick = () => {
                listeDeroulante.value = bouton.dataset.valeur;
                groupe.dataset.selectionEffectuee = 'true';
                groupe.querySelectorAll('.choix-bouton').forEach(proposition => {
                    const actif = proposition === bouton;
                    proposition.classList.toggle('actif', actif);
                    proposition.classList.toggle('selectionne', actif);
                    proposition.setAttribute('aria-pressed', String(actif));
                });
                if (listeDeroulante.id === 'echelleTexte' || listeDeroulante.id === 'sonActif')
                    enregistrerParametres();
            };
        });
    });
}
function actualiserGroupesChoix() {
    selectionnerTous('[data-groupe-choix]').forEach(groupe => {
        const listeDeroulante = selectionner('#' + groupe.dataset.groupeChoix);
        if (!listeDeroulante)
            return;
        const attendSelectionUtilisateur = groupe.dataset.selectionVisuelle === 'au-clic'
            && groupe.dataset.selectionEffectuee !== 'true';
        groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
            const actif = !attendSelectionUtilisateur
                && String(bouton.dataset.valeur) === String(listeDeroulante.value);
            bouton.classList.toggle('actif', actif);
            bouton.classList.toggle('selectionne', actif);
            bouton.setAttribute('aria-pressed', String(actif));
        });
    });
}
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
function obtenirQuestionsEvaluationFinale() {
    return QUESTIONS
        .filter(question => question.estEvaluationFinale === true)
        .sort((questionA, questionB) =>
            obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB)
            || questionA.id - questionB.id
        );
}
function lancerEvaluationFinale() {
    const session = obtenirQuestionsEvaluationFinale();
    if (session.length !== 50) {
        afficherNotification('L’évaluation finale est indisponible : banque incomplète.');
        return;
    }
    etat.theme = 'commun';
    etat.etape = 12;
    etat.chapitre = 1;
    etat.mode = 'evaluation-finale';
    etat.origineSessionAnalytics = 'evaluation_finale';
    etat.organisationSession = 'ordonne';
    etat.jokersSessionActifs = false;
    etat.chronometreSessionActif = false;
    lancerSession(session);
}
function lancerEntrainementLibre() {
    etat.mode = 'libre';
    etat.origineSessionAnalytics = 'entrainement_libre';
    etat.theme = null;
    const style = etat.organisationSession || 'ordonne';
    const nombre = Math.min(110, Math.max(10, Number(selectionner('#nombreQuestionsEntrainement')?.value) || 10));
    let session = [];
    if (style === 'ordonne') {
        session = [...QUESTIONS.filter(question => !question.estEvaluationFinale)]
            .sort((questionA, questionB) => (Number(questionA.etape) || 0) - (Number(questionB.etape) || 0) ||
            obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB) ||
            (Number(questionA.id) || 0) - (Number(questionB.id) || 0))
            .slice(0, nombre);
    }
    else {
        const candidats = selectionnerQuestionsEquilibrees(QUESTIONS, Math.min(QUESTIONS.length, Math.max(nombre, nombre * 4)));
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
            pjjoue_nombre_questions_defi_du_hasard: nombreTire
        });
        face.dataset.face = String(nombreTire);
        face.classList.remove('de-en-lancer');
        resultat.textContent = `${nombreTire} question${nombreTire === 1 ? '' : 's'} aléatoire${nombreTire === 1 ? '' : 's'} à relever.`;
        boutonJouer.textContent = `Jouer ${nombreTire} question${nombreTire === 1 ? '' : 's'}`;
        boutonJouer.classList.remove('masque');
        boutonLancer.disabled = false;
        boutonJouer.focus({ preventScroll: true });
        annoncer(`Le dé indique ${nombreTire}. ${nombreTire} question${nombreTire === 1 ? '' : 's'} aléatoire${nombreTire === 1 ? '' : 's'}.`);
    }, 420);
}
function jouerTirageDeParcours() {
    const nombreQuestions = Math.min(6, Math.max(1, Number(etat.nombreQuestionsTirageDe) || 1));
    const reserve = QUESTIONS.filter(question => !question.estEvaluationFinale);
    const session = melanger(reserve).slice(0, nombreQuestions);
    etat.mode = 'libre';
    etat.origineSessionAnalytics = 'defi_du_hasard';
    etat.theme = null;
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
function lancerRevisionEtape(etape) {
    const etapeCible = Number(etape);
    const actif = Object.entries(sauvegarde.erreurs || {}).filter(([, erreur]) => !erreur.maitrisee);
    if (!sauvegarde.aDejaJoue && actif.length === 0) {
        afficherNotification('Tu n’as pas encore joué. Commence une partie avant de pouvoir rejouer tes erreurs.');
        return;
    }
    const identifiants = actif.map(([id]) => Number(id));
    const reserve = QUESTIONS.filter(question => identifiants.includes(question.id) && Number(question.etape) === etapeCible && !question.estEvaluationFinale);
    if (!reserve.length) {
        afficherNotification(`Aucune erreur active à l’étape ${etapeCible}.`);
        return;
    }
    etat.mode = 'revision';
    etat.origineSessionAnalytics = 'revision_des_erreurs';
    etat.theme = null;
    etat.perimetreRevision = 'etape:' + etapeCible;
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    lancerSession(melanger(reserve));
}
// -----------------------------------------------------------------------------
// Validation des réponses et données communes aux activités
// -----------------------------------------------------------------------------
function obtenirModeQuestion(question) {
    return question?.activite?.type || 'choix-unique';
}
const LIBELLES_MODES_QUESTION = {
    'choix-unique': 'Choix unique',
    'selection-multiple': 'Sélection multiple',
    association: 'Relier',
    eliminer: 'Retirer des choix',
    'reponse-ecrite': 'Réponse écrite',
    'remettre-ordre': 'Remettre dans l’ordre',
    'choisir-ordre': 'Choisir puis ordonner',
    classer: 'Classer'
};
function obtenirLibelleMode(mode) {
    return LIBELLES_MODES_QUESTION[mode] || 'Activité';
}
function preparerSession(questionsInitiales) {
    if (!questionsInitiales?.length)
        return questionsInitiales || [];
    // Banque finale : chaque question conserve strictement son mode éditorial.
    return questionsInitiales.map(question => ({ ...question, modePresentation: question.modePrefere || obtenirModeQuestion(question) }));
}
function normaliserReponseEcrite(texte) {
    return String(texte || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
function normaliserReponseEvaluation(valeur) { return normaliserReponseEcrite(valeur).replace(/\b(le|la|les|un|une|des|du|de|d|l)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
function extraireSiglesSaisis(champ) {
    const mots = normaliserReponseEcrite(champ).split(' ').filter(Boolean);
    const formes = new Set(mots);
    for (let debut = 0; debut < mots.length; debut++) {
        let concatene = '';
        for (let fin = debut; fin < Math.min(mots.length, debut + 6); fin++) {
            if (mots[fin].length !== 1)
                break;
            concatene += mots[fin];
            if (concatene.length >= 2)
                formes.add(concatene);
        }
    }
    return formes;
}
function validerListeSiglesDistincts(champ, question) {
    if (!Array.isArray(question.siglesDistinctsAttendus) || !question.siglesDistinctsAttendus.length)
        return null;
    const formes = extraireSiglesSaisis(champ);
    const nombreTrouves = new Set(
        question.siglesDistinctsAttendus
            .map(compacterSigle)
            .filter(sigle => formes.has(sigle))
    ).size;
    return nombreTrouves >= Number(question.nombreSiglesRequis || question.siglesDistinctsAttendus.length);
}
function compacterSigle(valeur) {
    return normaliserReponseEcrite(valeur).replace(/\s+/g, '');
}
function validerFormeSigle(champ, question) {
    const forme = question.typeReponseAttendue || 'general';
    const saisieCompacte = compacterSigle(champ);
    const sigle = compacterSigle(question.sigleAttendu || question.bonneReponse);
    if (forme === 'sigle') {
        const siglesAcceptes = [question.bonneReponse, ...(question.reponsesAcceptees || [])]
            .map(compacterSigle)
            .filter(Boolean);
        return siglesAcceptes.includes(saisieCompacte);
    }
    if (forme === 'developpement-sigle' && sigle && saisieCompacte === sigle)
        return false;
    return null;
}
function respecteOrdreConcepts(champ, groupes) {
    if (!Array.isArray(groupes) || !groupes.length)
        return true;
    const motsSaisis = normaliserReponseEvaluation(champ).split(' ').filter(Boolean);
    let positionMinimale = 0;
    for (const groupe of groupes) {
        const variantes = Array.isArray(groupe) ? groupe : [groupe];
        let meilleurePosition = -1;
        let meilleureFin = -1;
        for (const variante of variantes) {
            const motsAttendus = normaliserReponseEvaluation(variante).split(' ').filter(Boolean);
            if (!motsAttendus.length)
                continue;
            for (let debut = positionMinimale; debut <= motsSaisis.length - motsAttendus.length; debut++) {
                const correspond = motsAttendus.every((motAttendu, decalage) =>
                    motsCorrespondentSouplement(motsSaisis[debut + decalage], motAttendu)
                );
                if (correspond && (meilleurePosition < 0 || debut < meilleurePosition)) {
                    meilleurePosition = debut;
                    meilleureFin = debut + motsAttendus.length;
                    break;
                }
            }
        }
        if (meilleurePosition < 0)
            return false;
        positionMinimale = meilleureFin;
    }
    return true;
}

const MOTS_NEGATION_REPONSE = new Set([
    'aucun', 'aucune', 'aucuns', 'aucunes', 'jamais', 'n', 'ne', 'ni', 'non', 'pas', 'sans'
]);
function contientExpressionComplete(texte, expression) {
    return (` ${texte} `).includes(` ${expression} `);
}
function contientNegation(texte) {
    return normaliserReponseEvaluation(texte)
        .split(' ')
        .some(mot => MOTS_NEGATION_REPONSE.has(mot));
}
function contientNegationInattendue(champ, variantesAttendues) {
    return contientNegation(champ)
        && !variantesAttendues.some(variante => contientNegation(variante));
}
function calculerDistanceTextes(texteA, texteB) {
    if (texteA === texteB)
        return 0;
    if (!texteA.length)
        return texteB.length;
    if (!texteB.length)
        return texteA.length;
    const lignePrecedente = Array.from({ length: texteB.length + 1 }, (_valeur, indice) => indice);
    const ligneCourante = new Array(texteB.length + 1);
    for (let indiceA = 1; indiceA <= texteA.length; indiceA++) {
        ligneCourante[0] = indiceA;
        for (let indiceB = 1; indiceB <= texteB.length; indiceB++) {
            const coutRemplacement = texteA[indiceA - 1] === texteB[indiceB - 1] ? 0 : 1;
            ligneCourante[indiceB] = Math.min(
                ligneCourante[indiceB - 1] + 1,
                lignePrecedente[indiceB] + 1,
                lignePrecedente[indiceB - 1] + coutRemplacement
            );
        }
        for (let indiceB = 0; indiceB <= texteB.length; indiceB++)
            lignePrecedente[indiceB] = ligneCourante[indiceB];
    }
    return lignePrecedente[texteB.length];
}
function obtenirMotsSignificatifsReponse(texte) {
    const motsVides = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'd', 'l', 'et', 'ou', 'a', 'au', 'aux',
        'en', 'dans', 'pour', 'par', 'sur', 'avec', 'sans', 'est', 'sont', 'etre', 'elle', 'il',
        'qui', 'que', 'ce', 'cette', 'ces', 'se', 'sa', 'son', 'ses'
    ]);
    return normaliserReponseEvaluation(texte)
        .split(' ')
        .filter(mot => mot.length > 1 && !motsVides.has(mot));
}
function obtenirRacineSouple(mot) {
    let racine = String(mot || '');
    const terminaisons = [
        'issements', 'issement', 'atrices', 'ateurs', 'atrice', 'ateur',
        'iquement', 'ements', 'ement', 'ations', 'ation', 'itions', 'ition',
        'aires', 'aire', 'alites', 'alite', 'ilites', 'ilite', 'ites', 'ite',
        'iennes', 'ienne', 'iels', 'iel', 'ives', 'ive', 'ifs', 'if',
        'euses', 'euse', 'eux', 'iques', 'ique', 'istes', 'iste',
        'elles', 'elle', 'aux', 'ales', 'ale', 'es', 's', 'x', 'e'
    ];
    for (const terminaison of terminaisons) {
        if (racine.length - terminaison.length >= 5 && racine.endsWith(terminaison)) {
            racine = racine.slice(0, -terminaison.length);
            break;
        }
    }
    return racine;
}
function motsCorrespondentSouplement(motSaisi, motAttendu) {
    if (motSaisi === motAttendu)
        return true;
    const longueurMaximale = Math.max(motSaisi.length, motAttendu.length);
    if (longueurMaximale >= 4) {
        const tolerance = longueurMaximale >= 9 ? 2 : 1;
        if (calculerDistanceTextes(motSaisi, motAttendu) <= tolerance)
            return true;
    }
    const racineSaisie = obtenirRacineSouple(motSaisi);
    const racineAttendue = obtenirRacineSouple(motAttendu);
    if (racineSaisie.length >= 5 && racineAttendue.length >= 5) {
        if (racineSaisie === racineAttendue)
            return true;
        if (calculerDistanceTextes(racineSaisie, racineAttendue) <= 1)
            return true;
        const longueurCommune = Math.min(racineSaisie.length, racineAttendue.length);
        const seuilPrefixe = Math.max(5, Math.ceil(longueurCommune * .78));
        if (racineSaisie.slice(0, seuilPrefixe) === racineAttendue.slice(0, seuilPrefixe))
            return true;
    }
    return false;
}
function compterMotsAttendusPresents(motsSaisis, motsAttendus) {
    const dejaUtilises = new Set();
    let correspondances = 0;
    for (const motAttendu of motsAttendus) {
        const indice = motsSaisis.findIndex((motSaisi, position) =>
            !dejaUtilises.has(position) && motsCorrespondentSouplement(motSaisi, motAttendu)
        );
        if (indice >= 0) {
            dejaUtilises.add(indice);
            correspondances++;
        }
    }
    return correspondances;
}
function correspondAVarianteEvaluation(champ, variante) {
    const reponseSaisie = normaliserReponseEvaluation(champ);
    const reponseAttendue = normaliserReponseEvaluation(variante);
    if (!reponseSaisie || !reponseAttendue)
        return false;
    if (reponseSaisie === reponseAttendue || contientExpressionComplete(reponseSaisie, reponseAttendue))
        return true;
    const motsSaisis = obtenirMotsSignificatifsReponse(reponseSaisie);
    const motsAttendus = obtenirMotsSignificatifsReponse(reponseAttendue);
    if (!motsAttendus.length)
        return false;
    const correspondances = compterMotsAttendusPresents(motsSaisis, motsAttendus);
    const minimum = motsAttendus.length === 1
        ? 1
        : Math.max(2, Math.ceil(motsAttendus.length * .6));
    return correspondances >= minimum;
}
function validerReponseEcriteEvaluation(champ, question) {
    const controleForme = validerFormeSigle(champ, question);
    if (controleForme !== null)
        return controleForme;
    const controleListeSigles = validerListeSiglesDistincts(champ, question);
    if (controleListeSigles !== null)
        return controleListeSigles;
    const reponseNormalisee = normaliserReponseEvaluation(champ);
    if (!reponseNormalisee)
        return false;
    if (question.sigleSeulRefuse && reponseNormalisee === normaliserReponseEvaluation(question.sigleSeulRefuse))
        return false;
    const reponsesDeclarees = [
        question.bonneReponse,
        ...(Array.isArray(question.reponsesAcceptees) ? question.reponsesAcceptees : [])
    ].filter(Boolean);
    const groupesConcepts = Array.isArray(question.conceptsEvaluation) ? question.conceptsEvaluation : [];
    const variantesAttendues = [
        ...reponsesDeclarees,
        ...groupesConcepts.flatMap(groupe => Array.isArray(groupe) ? groupe : [])
    ];
    if (contientNegationInattendue(champ, variantesAttendues))
        return false;
    const expressionsInterditesExactes = Array.isArray(question.expressionsInterditesExactes)
        ? question.expressionsInterditesExactes
        : [];
    const contientExpressionInterditeExacte = expressionsInterditesExactes.some(expression => {
        const expressionNormalisee = normaliserReponseEvaluation(expression);
        return expressionNormalisee && reponseNormalisee === expressionNormalisee;
    });
    if (contientExpressionInterditeExacte)
        return false;
    const conceptsInterdits = Array.isArray(question.conceptsInterdits) ? question.conceptsInterdits : [];
    const contientConceptInterdit = conceptsInterdits.some(groupe => {
        const variantes = Array.isArray(groupe) ? groupe : [groupe];
        return variantes.some(variante => correspondAVarianteEvaluation(champ, variante));
    });
    if (contientConceptInterdit)
        return false;
    const correspondanceDeclaree = reponsesDeclarees.some(variante => correspondAVarianteEvaluation(champ, variante));
    const correspondanceDeclareeExacte = reponsesDeclarees.some(variante => {
        const reponseAttendue = normaliserReponseEvaluation(variante);
        return reponseNormalisee === reponseAttendue || contientExpressionComplete(reponseNormalisee, reponseAttendue);
    });
    if (!groupesConcepts.length)
        return correspondanceDeclaree;
    if (correspondanceDeclareeExacte)
        return true;
    const nombreCorrespondances = groupesConcepts.filter(groupe =>
        Array.isArray(groupe) && groupe.some(variante => correspondAVarianteEvaluation(champ, variante))
    ).length;
    if (nombreCorrespondances < Number(question.nombreConceptsRequis || groupesConcepts.length))
        return false;
    return respecteOrdreConcepts(champ, question.conceptsOrdonnes);
}
function validerReponseEcriteSouple(champ, question) {
    // La même compréhension sémantique est appliquée pendant l'apprentissage et l'évaluation.
    // Les accents, accords, pluriels, variantes morphologiques et petites fautes sont tolérés,
    // mais les négations inattendues et les réponses qui ne contiennent pas assez de concepts restent refusées.
    return validerReponseEcriteEvaluation(champ, question);
}
function masquerMoitiéTexte(texte) {
    const mots = String(texte || '').trim().split(/\s+/).filter(Boolean);
    if (!mots.length)
        return '';
    const nombreADevoiler = Math.max(1, Math.ceil(mots.length / 2));
    let devoilees = 0;
    return mots.map((mot, indice) => {
        const doitDevoiler = (indice % 2 === 0 && devoilees < nombreADevoiler) || (mots.length === 1 && indice === 0);
        if (doitDevoiler) {
            devoilees++;
            return mot;
        }
        return '____';
    }).join(' ');
}
function obtenirDonneesJoker5050() {
    return etat.jokers?.donneesJoker5050 || null;
}
function marquerJokerUtilise() {
    etat.sessionAvecJoker = true;
    if (etat.mode === 'parcours')
        etat.etapeAvecJoker = true;
}
function consommerJoker5050(donnees) {
    marquerJokerUtilise();
    envoyerUtilisationJoker('50_50');
    etat.jokers.cinquanteCinquante = false;
    etat.jokers.donneesJoker5050 = donnees;
    selectionner('#boutonJoker5050').disabled = true;
    actualiserBoutonJokers();
}
function obtenirConfigurationValidation() {
    const question = etat.questionCourante;
    if (!question || etat.questionValidee)
        return null;
    const mode = question.modePrefere || question.activite?.type || 'choix-unique';
    if (mode === 'reponse-ecrite') {
        return { libelle: 'Valider', action: 'valider-reponse-ecrite' };
    }
    if (mode === 'eliminer') {
        return { libelle: 'Valider mes retraits', action: 'valider-eliminations' };
    }
    if (['selection-multiple', 'remettre-ordre', 'association', 'classer'].includes(mode)) {
        return { libelle: 'Valider cette réponse', action: 'valider-activite' };
    }
    // Les questions à choix simple se valident directement au clic :
    // pas de bouton Valider supplémentaire.
    return null;
}
function actualiserBoutonValider() {
    const bouton = selectionner('#boutonValider');
    if (!bouton)
        return;
    const configuration = obtenirConfigurationValidation();
    if (!configuration) {
        bouton.classList.add('masque');
        bouton.removeAttribute('data-action');
        bouton.textContent = 'Valider';
        return;
    }
    bouton.textContent = configuration.libelle;
    bouton.dataset.action = configuration.action;
    bouton.disabled = false;
    bouton.classList.remove('masque');
}
// -----------------------------------------------------------------------------
// Affichage et manipulation des activités pédagogiques
// -----------------------------------------------------------------------------
function afficherActiviteEcrite(reponse) {
    const zone = selectionner('#zoneReponses');
    zone.className = 'reponses activite-reponses';
    if (reponse && reponse.statut !== 'passee') {
        const texteReponse = echapperHtml(reponse.texteReponse || '');
        zone.innerHTML = '<div class="activite-verrouille">'
            + '<b>Réponse écrite enregistrée</b>'
            + `<span>${texteReponse}</span></div>`;
        return;
    }
    const donneesJoker = obtenirDonneesJoker5050();
    const revelation = donneesJoker?.nature === 'reponse-ecrite'
        ? '<div class="revelation-cinquante-cinquante">'
            + '<b>50/50 :</b> la moitié des éléments de la réponse est révélée :<br>'
            + `${donneesJoker.texteDevoile}</div>`
        : '';
    zone.innerHTML = '<div class="ecrite-activite">'
        + '<div class="activite-consigne"><span>Réponse écrite</span>'
        + '<b>Écris la réponse essentielle avec tes mots. Les formulations proches sont acceptées.</b>'
        + `</div>${revelation}<div class="ecrite-zone">`
        + '<input id="reponseEcrite" autocomplete="off" aria-label="Ta réponse"'
        + ' placeholder="Écris ta réponse ici"></div></div>';
    const champEcrit = selectionner('#reponseEcrite');
    const brouillonEcrit = etat.brouillonsEcrits?.get(etat.questionCourante?.id) || '';
    if (champEcrit) {
        champEcrit.value = brouillonEcrit;
        champEcrit.addEventListener('input', () => {
            etat.brouillonsEcrits = etat.brouillonsEcrits || new Map();
            etat.brouillonsEcrits.set(etat.questionCourante.id, champEcrit.value);
            enregistrerSessionEnCours();
        });
    }
    actualiserBoutonValider();
}
function validerActiviteEcrite() {
    const champ = selectionner('#reponseEcrite');
    if (!champ || !champ.value.trim()) {
        afficherNotification('Écris une réponse avant de valider.');
        return;
    }
    const question = etat.questionCourante;
    const estCorrecte = question?.estEvaluationFinale
        ? validerReponseEcriteEvaluation(champ.value, question)
        : validerReponseEcriteSouple(champ.value, question);
    finaliserReponse(estCorrecte, champ.value.trim());
}
function obtenirNombreEliminationsAttendues(question) {
    const nombreConfigure = Number(question?.nombreEliminationsAttendues);
    if (Number.isInteger(nombreConfigure) && nombreConfigure > 0)
        return nombreConfigure;
    const mauvaisesReponses = Array.isArray(question?.mauvaisesReponses) ? question.mauvaisesReponses.length : 0;
    return Math.max(1, Math.min(2, mauvaisesReponses || 2));
}
function obtenirConsigneElimination(question, nombreAttendu) {
    if (String(question?.consigneElimination || '').trim())
        return String(question.consigneElimination).trim();
    return `Écarte exactement ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} qui ne convient${nombreAttendu > 1 ? 'nent' : ''} pas.`;
}
function afficherActiviteEliminer(question, reponse) {
    const zoneReponses = selectionner('#zoneReponses');
    zoneReponses.className = 'reponses activite-reponses';
    if (reponse && reponse.statut !== 'passee') {
        zoneReponses.innerHTML = `<div class="activite-verrouille"><b>Élimination enregistrée</b><span>${echapperHtml(reponse.texteReponse || '')}</span></div>`;
        return;
    }
    const donneesJoker = obtenirDonneesJoker5050();
    if (!etat.brouillonActivite || etat.brouillonActivite.identifiantQuestion !== question.id) {
        etat.brouillonActivite = { identifiantQuestion: question.id, elementsElimines: [], eliminationsVerrouillees: [] };
        if (donneesJoker?.nature === 'eliminer') {
            etat.brouillonActivite.elementsElimines = [...(donneesJoker.elementsElimines || [])];
            etat.brouillonActivite.eliminationsVerrouillees = [...(donneesJoker.verrouilles || [])];
        }
    }
    const propositions = obtenirChoixQuestion(question);
    const elementsElimines = etat.brouillonActivite.elementsElimines || [];
    const eliminationsVerrouillees = etat.brouillonActivite.eliminationsVerrouillees || [];
    const boutonsPropositions = propositions.map((proposition, indiceProposition) => `
        <button class="elimination-choix ${elementsElimines.includes(indiceProposition) ? 'elimine' : ''} ${eliminationsVerrouillees.includes(indiceProposition) ? 'verrouille-joker' : ''}"
                type="button"
                data-action="basculer-elimination"
                data-indice="${indiceProposition}"
                ${eliminationsVerrouillees.includes(indiceProposition) ? 'disabled' : ''}>
            ${proposition.texte}
        </button>`).join('');
    const rappelJoker = eliminationsVerrouillees.length
        ? '<div class="revelation-cinquante-cinquante"><b>50/50 :</b> une partie des retraits corrects est déjà confirmée et verrouillée.</div>'
        : '';
    const nombreAttendu = obtenirNombreEliminationsAttendues(question);
    const consigne = obtenirConsigneElimination(question, nombreAttendu);
    zoneReponses.innerHTML = `<div class="elimination-activite">
        <div class="activite-consigne"><span>Retirer des choix</span><b>${echapperHtml(consigne)}</b></div>
        ${rappelJoker}
        <div class="elimination-grille">${boutonsPropositions}</div>
        <div class="elimination-compteur">${elementsElimines.length}/${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} écartée${elementsElimines.length > 1 ? 's' : ''}</div>
    </div>`;
    actualiserBoutonValider();
}
function basculerElimination(indice) {
    const eliminationsVerrouillees = etat.brouillonActivite.eliminationsVerrouillees || [];
    if (eliminationsVerrouillees.includes(indice)) {
        afficherNotification('Ce retrait a été confirmé par le 50/50.');
        return;
    }
    const elementsElimines = etat.brouillonActivite.elementsElimines || [];
    const positionExistante = elementsElimines.indexOf(indice);
    if (positionExistante >= 0) {
        elementsElimines.splice(positionExistante, 1);
    }
    else {
        const nombreAttendu = obtenirNombreEliminationsAttendues(etat.questionCourante);
        if (elementsElimines.length >= nombreAttendu) {
            afficherNotification(`Tu peux retirer ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} maximum.`);
            return;
        }
        elementsElimines.push(indice);
    }
    etat.brouillonActivite.elementsElimines = elementsElimines;
    afficherActiviteEliminer(etat.questionCourante, null);
}
function validerEliminations() {
    const elementsElimines = etat.brouillonActivite?.elementsElimines || [];
    const nombreAttendu = obtenirNombreEliminationsAttendues(etat.questionCourante);
    if (elementsElimines.length !== nombreAttendu) {
        afficherNotification(`Retire exactement ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''}.`);
        return;
    }
    const propositions = obtenirChoixQuestion(etat.questionCourante);
    const estCorrecte = elementsElimines.every(indice => !propositions[indice].estCorrecte);
    const texteReponse = elementsElimines.map(indice => propositions[indice].texte).join(' · ');
    finaliserReponse(estCorrecte, texteReponse);
}
function lancerSession(session) {
    if (!session.length) {
        afficherNotification('Aucune question ne correspond à ce filtre.');
        return;
    }
    const questionsPreparees = preparerSession(session);
    etat.questionsSession = questionsPreparees;
    etat.indexQuestion = 0;
    etat.score = 0;
    etat.serie = 0;
    etat.meilleureSerie = 0;
    actualiserIndicateurSerie();
    etat.erreursSession = new Set();
    etat.questionsPassees = new Set();
    etat.reponsesSession = new Map();
    etat.optionsSession = new Map();
    etat.decalageReponses = Math.floor(Math.random() * 4);
    etat.tentativesQuestions = new Map();
    etat.jokersQuestions = new Map();
    etat.brouillonsEcrits = new Map();
    etat.nombreReponsesAidees = 0;
    etat.sessionAvecJoker = false;
    etat.debutSessionAnalytics = Date.now();
    etat.jokers = { cinquanteCinquante: true, indice: true, langueAuChat: true };
    envoyerEvenementPJJ('session_commencee', {
        ...obtenirContexteSessionAnalytics(),
        pjjoue_resultat_session: 'Session commencée'
    });
    afficherEcran('question', { remplacerHistorique: etat.ecran === 'bilan' });
    afficherQuestion();
    enregistrerSessionEnCours();
}
function nettoyerEnonce(question) {
    let enonce = (question.enonce || '').trim();
    const theme = THEMES.find(themeCandidat => themeCandidat.id === question.theme);
    if (theme) {
        const prefixes = [
            `${theme.iconee} ${theme.titre} — `,
            `${theme.titre} — `,
            `${theme.iconee} ${theme.titre} - `,
            `${theme.titre} - `
        ];
        for (const prefixe of prefixes) {
            if (enonce.startsWith(prefixe)) {
                enonce = enonce.slice(prefixe.length).trim();
                break;
            }
        }
    }
    return enonce.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();
}
function raccourcirTexteReponse(texte) {
    let texteRaccourci = String(texte || '').trim();
    const modeles = [
        /^Ici\s*:\s*/i,
        /^Dans ce cas\s*:\s*/i,
        /^Pour ce cas précis\s*:\s*/i,
        /^Dans cette situation\s*:\s*/i,
        /^Dans le contexte donné\s*:\s*/i,
        /^Au regard de la situation\s*:\s*/i,
        /^En se limitant aux éléments fournis\s*:\s*/i,
        /^Au regard des informations présentées\s*:\s*/i,
        /^Dans le cadre précis décrit par la question\s*:\s*/i,
        /^En tenant compte uniquement des éléments fournis ici\s*:\s*/i,
        /^Au regard des seules informations données dans cette situation\s*:\s*/i,
        /^En se fondant uniquement sur les éléments explicitement présentés dans cette situation\s*:\s*/i,
        /^Dans le cadre strict des informations disponibles, sans ajouter d[’']hypothèse extérieure\s*:\s*/i
    ];
    modeles.forEach(modele => {
        texteRaccourci = texteRaccourci.replace(modele, '');
    });
    return texteRaccourci.replace(/\s{2,}/g, ' ').trim();
}
function harmoniserPresentationReponses(propositions) {
    return propositions.map(proposition => ({
        ...proposition,
        texte: raccourcirTexteReponse(proposition.texte)
    }));
}
function obtenirChoixQuestion(question) {
    if (!etat.optionsSession.has(question.id)) {
        if (question.modePrefere === 'eliminer' && Array.isArray(question.propositionsAEliminer) && Array.isArray(question.propositionsAConserver)) {
            const conserver = new Set(question.propositionsAConserver);
            const propositions = harmoniserPresentationReponses(question.propositionsAEliminer.map(texte => ({ texte: texte, estCorrecte: conserver.has(texte) })));
            etat.optionsSession.set(question.id, melanger(propositions));
        }
        else {
            const propositions = harmoniserPresentationReponses([
                { texte: question.bonneReponse, estCorrecte: true },
                ...question.mauvaisesReponses.map(texte => ({
                    texte,
                    estCorrecte: false
                }))
            ]);
            const correcte = propositions.find(proposition => proposition.estCorrecte), mauvaises = melanger(propositions.filter(proposition => !proposition.estCorrecte));
            const position = ((etat.decalageReponses || 0) + etat.indexQuestion) % propositions.length;
            mauvaises.splice(position, 0, correcte);
            etat.optionsSession.set(question.id, mauvaises);
        }
    }
    return etat.optionsSession.get(question.id);
}
function construireCorrectionDetaillee(question, echapperTexte) {
    if (!question)
        return '';
    const mode = question.modePrefere || question.activite?.type || 'choix-unique';
    const activite = question.activite || {};
    const construireZone = (titre, lignes) => `
        <div class="detaillee-correction">
            <div class="detaillee-correction-titre"><b>${titre}</b></div>
            <div class="detaillee-correction-liste">${lignes.join('')}</div>
        </div>`;
    const construireLigneSimple = texte => `<div class="detaillee-correction-ligne unique-ligne">${echapperTexte(texte)}</div>`;
    const construireLigneFlechee = (gauche, droite) => `
        <div class="detaillee-correction-ligne">
            <span>${echapperTexte(gauche)}</span><span class="correction-fleche">→</span><strong>${echapperTexte(droite)}</strong>
        </div>`;
    if (mode === 'selection-multiple' && Array.isArray(activite.propositions) && Array.isArray(activite.reponses)) {
        const identifiantsReponses = new Set(activite.reponses);
        const reponsesAttendues = activite.propositions
            .filter(proposition => identifiantsReponses.has(proposition.id))
            .map(proposition => proposition.texte);
        return construireZone(
            reponsesAttendues.length > 1 ? 'Réponses attendues :' : 'Réponse attendue :',
            reponsesAttendues.map(construireLigneSimple)
        );
    }
    if (mode === 'eliminer') {
        const mauvaisesReponses = (question.mauvaisesReponses || []).filter(Boolean);
        const nombreAttendu = obtenirNombreEliminationsAttendues(question);
        const retraitsAffiches = mauvaisesReponses.slice(0, nombreAttendu);
        const lignes = retraitsAffiches.map(texte => `
            <div class="detaillee-correction-ligne ligne-eliminee">
                <span class="marque-erreur">✕</span><span>${echapperTexte(texte)}</span>
            </div>`);
        if (mauvaisesReponses.length > nombreAttendu) {
            const autresRetraits = mauvaisesReponses
                .slice(nombreAttendu)
                .map(echapperTexte)
                .join(' · ');
            const nombreAutres = mauvaisesReponses.length - nombreAttendu;
            lignes.push(
                '<div class="correction-note">'
                + `Autre${nombreAutres > 1 ? 's' : ''} retrait${nombreAutres > 1 ? 's' : ''} `
                + `également correct${nombreAutres > 1 ? 's' : ''} : ${autresRetraits}.`
                + '</div>'
            );
        }
        const propositionsAConserver = Array.isArray(question.propositionsAConserver) && question.propositionsAConserver.length
            ? question.propositionsAConserver
            : [question.bonneReponse];
        lignes.push(`<div class="correction-conserver"><b>À conserver :</b> ${propositionsAConserver.map(echapperTexte).join(' · ')}</div>`);
        return construireZone(
            `Il fallait éliminer ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} incorrecte${nombreAttendu > 1 ? 's' : ''} :`,
            lignes
        );
    }
    if (mode === 'association' && activite.type === 'association') {
        const textesGauche = Object.fromEntries((activite.colonneGauche || []).map(element => [element.id, element.texte]));
        const textesDroite = Object.fromEntries((activite.colonneDroite || []).map(element => [element.id, element.texte]));
        const lignes = Object.entries(activite.associations || {}).map(([identifiantGauche, identifiantDroite]) =>
            construireLigneFlechee(
                textesGauche[identifiantGauche] || identifiantGauche,
                textesDroite[identifiantDroite] || identifiantDroite
            )
        );
        return construireZone('Il fallait relier :', lignes);
    }
    if (mode === 'classer' && activite.type === 'classer') {
        const textesCategories = Object.fromEntries((activite.categories || []).map(categorie => [categorie.id, categorie.texte]));
        const textesElements = Object.fromEntries((activite.elements || []).map(element => [element.id, element.texte]));
        const lignes = Object.entries(activite.classements || {}).map(([identifiantElement, identifiantCategorie]) =>
            construireLigneFlechee(
                textesElements[identifiantElement] || identifiantElement,
                textesCategories[identifiantCategorie] || identifiantCategorie
            )
        );
        return construireZone('Classement attendu :', lignes);
    }
    if (mode === 'remettre-ordre' && (activite.type === 'remettre-ordre' || activite.type === 'choisir-ordre')) {
        const textesElements = Object.fromEntries((activite.elements || []).map(element => [element.id, element.texte]));
        const sequence = (activite.ordre || []).map(identifiant => textesElements[identifiant] || identifiant);
        return construireZone('Ordre attendu :', [
            `<div class="ordre-correction">${sequence.map(echapperTexte).join('<span class="correction-fleche">→</span>')}</div>`
        ]);
    }
    return construireZone('Réponse attendue :', [construireLigneSimple(question.bonneReponse)]);
}
function afficherCorrectionEnregistree(question, reponse) {
    const echapperTexte = echapperHtml;
    const zoneCorrection = selectionner('#zoneCorrection');
    if (reponse.statut === 'passee') {
        zoneCorrection.className = 'correction masque';
        zoneCorrection.innerHTML = '';
        return;
    }
    const estCorrecte = reponse.statut === 'correcte';
    const estAidee = reponse.statut === 'aidee';
    const texteChoisi = echapperTexte(reponse.texteReponse || '');
    zoneCorrection.className = 'correction ' + (estCorrecte ? 'bon' : (estAidee ? 'aidee' : 'incorrecte'));
    const reponseAttendueDetaillee = construireCorrectionDetaillee(question, echapperTexte);
    const ligneReponseUtilisateur = !estCorrecte && !estAidee && texteChoisi
        ? `<p><b>Ta réponse :</b> ${texteChoisi}</p>`
        : '';
    const titreStatut = reponse.precisions?.langueAuChatUtilisee
        ? 'Langue au chat — réponse dévoilée'
        : (estCorrecte ? 'Réussite autonome' : (estAidee ? 'Réussite avec aide — à consolider' : 'Réponse incorrecte'));
    zoneCorrection.innerHTML = `<div class="correction-corps">
        <div class="retournee-note">Tu consultes une activité déjà jouée. La réponse reste verrouillée afin de préserver le résultat de la session.</div>
        <h3>${titreStatut}</h3>
        ${ligneReponseUtilisateur}${reponseAttendueDetaillee}
        <p><b>Explication :</b> ${question.explication}</p>
        ${question.procedureLocale ? '<p><b>Procédure locale :</b> le circuit exact du service réel doit toujours primer sur ce scénario pédagogique.</p>' : ''}
    </div>`;
}
const LIBELLES_ACTIVITES = {
    'selection-multiple': 'Sélection multiple',
    'remettre-ordre': 'Remettre dans l’ordre',
    'choisir-ordre': 'Choisir puis ordonner',
    association: 'Association par fil',
    classer: 'Classement'
};
function obtenirLibelleActivite(type) {
    return LIBELLES_ACTIVITES[type] || 'Question à choix';
}
function obtenirElementsActiviteMelanges(question, cle) {
    const cleEtat = `activite:${question.id}:${cle}`;
    if (!etat.optionsSession.has(cleEtat)) {
        etat.optionsSession.set(cleEtat, melanger(question.activite[cle] || []));
    }
    return etat.optionsSession.get(cleEtat);
}
function actualiserActiviteInteractive() {
    afficherActiviteInteractive(
        etat.questionCourante,
        etat.reponsesSession.get(etat.questionCourante.id)
    );
}
function deplacerElementOrdre(indice, direction) {
    const elements = etat.brouillonActivite.ordre || [], verrouilles = new Set(etat.brouillonActivite.positionsOrdreVerrouillees || []);
    if (verrouilles.has(indice))
        return;
    let cible = indice + direction;
    while (cible >= 0 && cible < elements.length && verrouilles.has(cible))
        cible += direction;
    if (cible < 0 || cible >= elements.length)
        return;
    [elements[indice], elements[cible]] = [elements[cible], elements[indice]];
    actualiserActiviteInteractive();
}
function selectionnerAssociation(cote, identifiant) {
    etat.brouillonActivite = etat.brouillonActivite || { associations: {} };
    const activite = etat.questionCourante.activite, verrouilles = new Set(etat.brouillonActivite.associationsVerrouillees || []);
    const droitesVerrouillees = new Set([...verrouilles].map(gauche => activite.associations[gauche]));
    if (cote === 'gauche') {
        if (verrouilles.has(identifiant))
            return;
        etat.brouillonActivite.colonneGauche = identifiant;
        return actualiserActiviteInteractive();
    }
    if (droitesVerrouillees.has(identifiant))
        return;
    if (!etat.brouillonActivite.colonneGauche)
        return;
    Object.keys(etat.brouillonActivite.associations || {}).forEach(gauche => { if (!verrouilles.has(gauche) && etat.brouillonActivite.associations[gauche] === identifiant)
        delete etat.brouillonActivite.associations[gauche]; });
    etat.brouillonActivite.associations[etat.brouillonActivite.colonneGauche] = identifiant;
    etat.brouillonActivite.colonneGauche = null;
    actualiserActiviteInteractive();
}
function redessinerFilsAssociation() {
    const panneau = document.querySelector('.association-panneau');
    const dessinFils = panneau?.querySelector('.association-lignes');
    if (!panneau || !dessinFils)
        return;
    const rectanglePanneau = panneau.getBoundingClientRect();
    dessinFils.setAttribute('viewBox', `0 0 ${rectanglePanneau.width} ${rectanglePanneau.height}`);
    dessinFils.innerHTML = '';
    Object.entries(etat.brouillonActivite?.associations || {}).forEach(([identifiantGauche, identifiantDroite]) => {
        const rectangleElementGauche = panneau
            .querySelector(`[data-gauche="${identifiantGauche}"]`)
            ?.getBoundingClientRect();
        const rectangleElementDroite = panneau
            .querySelector(`[data-droite="${identifiantDroite}"]`)
            ?.getBoundingClientRect();
        if (!rectangleElementGauche || !rectangleElementDroite)
            return;
        const fil = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const departHorizontal = rectangleElementGauche.right - rectanglePanneau.left;
        const departVertical = rectangleElementGauche.top + rectangleElementGauche.height / 2 - rectanglePanneau.top;
        const arriveeHorizontale = rectangleElementDroite.left - rectanglePanneau.left;
        const arriveeVerticale = rectangleElementDroite.top + rectangleElementDroite.height / 2 - rectanglePanneau.top;
        const pointControleHorizontal = (departHorizontal + arriveeHorizontale) / 2;
        fil.setAttribute(
            'd',
            `M ${departHorizontal} ${departVertical} C ${pointControleHorizontal} ${departVertical}, `
            + `${pointControleHorizontal} ${arriveeVerticale}, `
            + `${arriveeHorizontale} ${arriveeVerticale}`
        );
        fil.setAttribute('class', 'fil-association');
        dessinFils.appendChild(fil);
    });
}
function initialiserBrouillonActiviteInteractive(question) {
    const activite = question.activite;
    etat.brouillonActivite = {
        identifiantQuestion: question.id,
        associations: {},
        classements: {}
    };

    if (activite.type === 'remettre-ordre') {
        etat.brouillonActivite.ordre = obtenirElementsActiviteMelanges(question, 'elements')
            .map(element => element.id);
    }
    if (activite.type === 'choisir-ordre') {
        etat.brouillonActivite.ordre = [];
    }
    if (activite.type === 'selection-multiple') {
        etat.brouillonActivite.elementsSelectionnes = [];
    }

    const donneesJoker = obtenirDonneesJoker5050();
    if (donneesJoker?.nature === 'selection-multiple') {
        etat.brouillonActivite.elementsRetires = [...(donneesJoker.elementsRetires || [])];
    }
    if (donneesJoker?.nature === 'remettre-ordre') {
        etat.brouillonActivite.ordre = [
            ...(donneesJoker.ordre || etat.brouillonActivite.ordre || [])
        ];
        etat.brouillonActivite.positionsOrdreVerrouillees = [
            ...(donneesJoker.verrouilles || [])
        ];
    }
    if (donneesJoker?.nature === 'choisir-ordre') {
        etat.brouillonActivite.ordre = [...(donneesJoker.ordre || [])];
        etat.brouillonActivite.nombreChoixOrdreVerrouilles = Number(
            donneesJoker.nombreVerrouille || 0
        );
    }
    if (donneesJoker?.nature === 'association') {
        etat.brouillonActivite.associations = { ...(donneesJoker.associations || {}) };
        etat.brouillonActivite.associationsVerrouillees = [
            ...(donneesJoker.verrouilles || [])
        ];
    }
    if (donneesJoker?.nature === 'classer') {
        etat.brouillonActivite.classements = { ...(donneesJoker.classements || {}) };
        etat.brouillonActivite.classementsVerrouilles = [
            ...(donneesJoker.verrouilles || [])
        ];
    }
}

function construireConsigneActivite(activite) {
    const libelle = activite.libelleAffiche || obtenirLibelleActivite(activite.type);
    return `<div class="activite-consigne"><span>${libelle}</span>`
        + `<b>${activite.consigne}</b></div>`;
}

function construireSelectionMultiple() {
    const selectionnes = etat.brouillonActivite.elementsSelectionnes;
    const retires = etat.brouillonActivite.elementsRetires || [];
    const propositionsMelangees = obtenirElementsActiviteMelanges(etat.questionCourante, 'propositions');
    const boutons = propositionsMelangees.map(proposition => {
        const estSelectionnee = selectionnes.includes(proposition.id);
        const estRetiree = retires.includes(proposition.id);
        return `<button class="multiple-choix ${estSelectionnee ? 'selectionne' : ''} ${estRetiree ? 'retire' : ''}"`
            + ` aria-pressed="${estSelectionnee}" data-proposition="${proposition.id}"`
            + ' data-action="basculer-selection-multiple">'
            + '<span class="multiple-coche" aria-hidden="true">✓</span>'
            + `<span>${proposition.texte}</span></button>`;
    }).join('');
    return `<div class="multiple-grille" role="group"`
        + ` aria-label="Propositions à sélectionner">${boutons}</div>`;
}

function construireCommandesOrdre(indice, indicesDeplacables) {
    const desactiverMonter = indice === indicesDeplacables[0] ? 'disabled' : '';
    const desactiverDescendre = indice === indicesDeplacables.at(-1) ? 'disabled' : '';
    return `<button aria-label="Monter l’élément ${indice + 1}"`
        + ` data-action="deplacer-ordre" data-indice="${indice}" data-direction="-1"`
        + ` ${desactiverMonter}>↑</button>`
        + `<button aria-label="Descendre l’élément ${indice + 1}"`
        + ` data-action="deplacer-ordre" data-indice="${indice}" data-direction="1"`
        + ` ${desactiverDescendre}>↓</button>`;
}

function construireRemiseEnOrdre(activite) {
    const elementsParIdentifiant = Object.fromEntries(
        activite.elements.map(element => [element.id, element])
    );
    const positionsVerrouillees = new Set(
        etat.brouillonActivite.positionsOrdreVerrouillees || []
    );
    const indicesDeplacables = [...etat.brouillonActivite.ordre.keys()]
        .filter(indice => !positionsVerrouillees.has(indice));
    const lignes = etat.brouillonActivite.ordre.map((identifiant, indice) => {
        const estVerrouillee = positionsVerrouillees.has(indice);
        const indication = estVerrouillee
            ? '<small>Position confirmée par le 50/50</small>'
            : '';
        const commandes = estVerrouillee
            ? '<span class="ordre-verrou" aria-label="Position confirmée">✓</span>'
            : construireCommandesOrdre(indice, indicesDeplacables);
        return `<li class="${estVerrouillee ? 'ordre-verrouille' : ''}">`
            + `<span class="ordre-texte">${elementsParIdentifiant[identifiant].texte}${indication}</span>`
            + `<span class="ordre-commandes">${commandes}</span></li>`;
    }).join('');
    return `<ol class="ordre-liste">${lignes}</ol>`;
}

function construireCommandesChoisirOrdre(indice, nombreElements, nombreVerrouilles) {
    if (indice < nombreVerrouilles) {
        return '<span class="ordre-verrou" aria-label="Position confirmée">✓</span>';
    }
    const desactiverMonter = indice <= nombreVerrouilles ? 'disabled' : '';
    const desactiverDescendre = indice === nombreElements - 1 ? 'disabled' : '';
    return `<button type="button" aria-label="Monter l’élément ${indice + 1}"`
        + ` data-action="deplacer-choix-ordre" data-indice="${indice}" data-direction="-1"`
        + ` ${desactiverMonter}>↑</button>`
        + `<button type="button" aria-label="Descendre l’élément ${indice + 1}"`
        + ` data-action="deplacer-choix-ordre" data-indice="${indice}" data-direction="1"`
        + ` ${desactiverDescendre}>↓</button>`
        + `<button type="button" aria-label="Retirer l’élément ${indice + 1}"`
        + ` data-action="retirer-choix-ordre" data-indice="${indice}">×</button>`;
}

function construireChoisirPuisOrdonner(question, activite) {
    const elementsParIdentifiant = Object.fromEntries(
        activite.elements.map(element => [element.id, element])
    );
    const selectionnes = etat.brouillonActivite.ordre || [];
    const nombreVerrouilles = Number(
        etat.brouillonActivite.nombreChoixOrdreVerrouilles || 0
    );
    const disponibles = obtenirElementsActiviteMelanges(question, 'elements')
        .filter(element => !selectionnes.includes(element.id));
    const boutonsDisponibles = disponibles.map(element =>
        `<button type="button" class="choisir-ordre-proposition"`
        + ` data-action="ajouter-choix-ordre" data-element="${element.id}">`
        + `${element.texte}</button>`
    ).join('');
    const lignesSelectionnees = selectionnes.map((identifiant, indice) => {
        const estVerrouillee = indice < nombreVerrouilles;
        const indication = estVerrouillee
            ? '<small>Position confirmée par le 50/50</small>'
            : '';
        const commandes = construireCommandesChoisirOrdre(
            indice,
            selectionnes.length,
            nombreVerrouilles
        );
        return `<li class="${estVerrouillee ? 'ordre-verrouille' : ''}">`
            + `<span class="ordre-texte">${elementsParIdentifiant[identifiant]?.texte || identifiant}${indication}</span>`
            + `<span class="ordre-commandes">${commandes}</span></li>`;
    }).join('');
    return '<div class="choisir-ordre-activite">'
        + '<div class="choisir-ordre-reserve" role="group" aria-label="Éléments disponibles">'
        + boutonsDisponibles
        + '</div><ol class="ordre-choix-selectionne" aria-label="Éléments retenus dans l’ordre">'
        + lignesSelectionnees
        + `</ol><div class="choisir-ordre-compteur">${selectionnes.length}/${activite.ordre.length}`
        + ' éléments retenus</div></div>';
}

function construireBoutonAssociationGauche(element, verrouilles) {
    const estActif = etat.brouillonActivite.colonneGauche === element.id;
    const estAssocie = Boolean(etat.brouillonActivite.associations[element.id]);
    const estVerrouille = verrouilles.has(element.id);
    const numeroPaire = estAssocie
        ? etat.questionCourante.activite.colonneGauche.findIndex(candidat => candidat.id === element.id) + 1
        : 0;
    const classes = [
        estActif ? 'actif' : '',
        estAssocie ? 'associe' : '',
        estVerrouille ? 'verrouille-joker' : ''
    ].join(' ');
    return `<button data-gauche="${element.id}" aria-pressed="${estActif || estAssocie}"`
        + ` class="${classes}" data-action="selectionner-association" data-cote="gauche"`
        + ` data-element="${element.id}" ${estVerrouille ? 'disabled' : ''}>`
        + element.texte
        + (numeroPaire ? `<small class="association-repere">Paire ${numeroPaire}</small>` : '')
        + (estVerrouille ? '<small>Association confirmée</small>' : '')
        + '</button>';
}

function construireBoutonAssociationDroite(element, droitesVerrouillees) {
    const associationCorrespondante = Object.entries(etat.brouillonActivite.associations)
        .find(([, identifiantDroite]) => identifiantDroite === element.id);
    const estAssocie = Boolean(associationCorrespondante);
    const estVerrouille = droitesVerrouillees.has(element.id);
    const numeroPaire = estAssocie
        ? etat.questionCourante.activite.colonneGauche
            .findIndex(candidat => candidat.id === associationCorrespondante[0]) + 1
        : 0;
    const classes = [
        estAssocie ? 'associe' : '',
        estVerrouille ? 'verrouille-joker' : ''
    ].join(' ');
    return `<button data-droite="${element.id}" aria-pressed="${estAssocie}"`
        + ` class="${classes}" data-action="selectionner-association" data-cote="droite"`
        + ` data-element="${element.id}" ${estVerrouille ? 'disabled' : ''}>`
        + element.texte
        + (numeroPaire ? `<small class="association-repere">Paire ${numeroPaire}</small>` : '')
        + (estVerrouille ? '<small>Association confirmée</small>' : '')
        + '</button>';
}

function construireAssociation(question, activite) {
    const elementsDroite = obtenirElementsActiviteMelanges(question, 'colonneDroite');
    const elementsGaucheVerrouilles = new Set(
        etat.brouillonActivite.associationsVerrouillees || []
    );
    const elementsDroiteVerrouilles = new Set(
        [...elementsGaucheVerrouilles].map(identifiant => activite.associations[identifiant])
    );
    const colonneGauche = activite.colonneGauche
        .map(element => construireBoutonAssociationGauche(
            element,
            elementsGaucheVerrouilles
        ))
        .join('');
    const colonneDroite = elementsDroite
        .map(element => construireBoutonAssociationDroite(element, elementsDroiteVerrouilles))
        .join('');
    const elementSelectionne = activite.colonneGauche
        .find(element => element.id === etat.brouillonActivite.colonneGauche);
    const nombrePaires = Object.keys(etat.brouillonActivite.associations).length;
    const aideMobile = elementSelectionne
        ? `« ${elementSelectionne.texte} » est sélectionné. Choisis maintenant sa correspondance.`
        : (nombrePaires > 0
            ? `${nombrePaires} paire${nombrePaires > 1 ? 's' : ''} créée${nombrePaires > 1 ? 's' : ''}. Choisis un nouvel élément à relier.`
            : 'Choisis d’abord un élément, puis sa correspondance dans le groupe suivant.');
    return `<p class="association-aide" aria-live="polite">${aideMobile}</p>`
        + '<div class="association-panneau" role="group" aria-label="Éléments à associer">'
        + '<svg class="association-lignes" aria-hidden="true"></svg>'
        + '<div class="association-colonne" role="group" aria-label="Éléments à relier">'
        + `<p class="association-colonne-titre">1. Éléments à relier</p>${colonneGauche}</div>`
        + '<div class="association-colonne" role="group" aria-label="Correspondances possibles">'
        + `<p class="association-colonne-titre">2. Correspondances possibles</p>${colonneDroite}</div></div>`;
}

function construireClassement(activite) {
    const elementsVerrouilles = new Set(
        etat.brouillonActivite.classementsVerrouilles || []
    );
    const lignes = activite.elements.map((element, indiceElement) => {
        const estVerrouille = elementsVerrouilles.has(element.id);
        const categories = activite.categories.map(categorie => {
            const estSelectionnee =
                etat.brouillonActivite.classements[element.id] === categorie.id;
            return `<button aria-pressed="${estSelectionnee}"`
                + ` class="${estSelectionnee ? 'selectionne' : ''}"`
                + ` data-action="attribuer-categorie" data-element="${element.id}"`
                + ` data-categorie="${categorie.id}" ${estVerrouille ? 'disabled' : ''}>`
                + `${categorie.texte}</button>`;
        }).join('');
        const confirmation = estVerrouille
            ? '<small>Classement confirmé par le 50/50</small>'
            : '';
        return `<div class="classement-element ${estVerrouille ? 'verrouille-joker' : ''}">`
            + `<b>${element.texte}${confirmation}</b>`
            + `<div role="group" aria-label="Classement de la proposition ${indiceElement + 1}">`
            + `${categories}</div></div>`;
    }).join('');
    return `<div class="classement-liste">${lignes}</div>`;
}

function construireCorpsActiviteInteractive(question) {
    const activite = question.activite;
    const contenusParType = {
        'selection-multiple': () => construireSelectionMultiple(),
        'remettre-ordre': () => construireRemiseEnOrdre(activite),
        'choisir-ordre': () => construireChoisirPuisOrdonner(question, activite),
        association: () => construireAssociation(question, activite),
        classer: () => construireClassement(activite)
    };
    const construireContenu = contenusParType[activite.type];
    return construireConsigneActivite(activite) + (construireContenu?.() || '');
}

function afficherActiviteInteractive(question, reponse) {
    const zone = selectionner('#zoneReponses');
    const activiteVerrouillee = Boolean(reponse) && reponse.statut !== 'passee';
    zone.className = 'reponses activite-reponses';

    if (activiteVerrouillee) {
        const texteReponse = echapperHtml(reponse.texteReponse || question.bonneReponse);
        zone.innerHTML = '<div class="activite-verrouille"><b>Activité enregistrée</b>'
            + `<span>${texteReponse}</span></div>`;
        return;
    }

    if (
        !etat.brouillonActivite
        || etat.brouillonActivite.identifiantQuestion !== question.id
    ) {
        initialiserBrouillonActiviteInteractive(question);
    }

    zone.innerHTML = construireCorpsActiviteInteractive(question);
    if (question.activite.type === 'association') {
        requestAnimationFrame(redessinerFilsAssociation);
    }
    actualiserBoutonValider();
}
function basculerChoixMultiple(identifiant) { const selectionnes = etat.brouillonActivite.elementsSelectionnes, indice = selectionnes.indexOf(identifiant); if (indice >= 0)
    selectionnes.splice(indice, 1);
else
    selectionnes.push(identifiant); actualiserActiviteInteractive(); }
function ajouterChoixOrdre(identifiantElement) {
    const question = etat.questionCourante, activite = question?.activite;
    if (!activite || activite.type !== 'choisir-ordre')
        return;
    const selectionnes = etat.brouillonActivite.ordre || [];
    if (selectionnes.includes(identifiantElement))
        return;
    if (selectionnes.length >= activite.ordre.length) {
        afficherNotification(`Tu dois retenir ${activite.ordre.length} éléments.`);
        return;
    }
    selectionnes.push(identifiantElement);
    etat.brouillonActivite.ordre = selectionnes;
    actualiserActiviteInteractive();
}
function retirerChoixOrdre(indice) {
    const nombreVerrouilles = Number(etat.brouillonActivite.nombreChoixOrdreVerrouilles || 0);
    if (indice < nombreVerrouilles)
        return;
    const selectionnes = etat.brouillonActivite.ordre || [];
    selectionnes.splice(indice, 1);
    actualiserActiviteInteractive();
}
function deplacerChoixOrdre(indice, direction) {
    const selectionnes = etat.brouillonActivite.ordre || [], nombreVerrouilles = Number(etat.brouillonActivite.nombreChoixOrdreVerrouilles || 0);
    if (indice < nombreVerrouilles)
        return;
    const cible = indice + direction;
    if (cible < nombreVerrouilles || cible < 0 || cible >= selectionnes.length)
        return;
    [selectionnes[indice], selectionnes[cible]] = [selectionnes[cible], selectionnes[indice]];
    actualiserActiviteInteractive();
}
function attribuerCategorie(identifiantElement, identifiantCategorie) { if (etat.brouillonActivite.classementsVerrouilles?.includes(identifiantElement))
    return; etat.brouillonActivite.classements[identifiantElement] = identifiantCategorie; actualiserActiviteInteractive(); }
function tableauxEgaux(tableauA, tableauB) {
    return tableauA.length === tableauB.length
        && tableauA.every((valeur, indice) => valeur === tableauB[indice]);
}
function obtenirTexteAssociationDroite(activite, identifiantDroite) {
    return activite?.colonneDroite?.find(element => element.id === identifiantDroite)?.texte || '';
}
function associationElementCorrespond(activite, identifiantGauche, identifiantDroiteSaisi, schemaAttendu) {
    const identifiantDroiteAttendu = schemaAttendu?.[identifiantGauche];
    if (!identifiantDroiteAttendu || !identifiantDroiteSaisi)
        return false;
    if (identifiantDroiteSaisi === identifiantDroiteAttendu)
        return true;
    const equivalentsDeclares = activite?.equivalencesAssociation?.[identifiantGauche] || [];
    if (equivalentsDeclares.includes(identifiantDroiteSaisi))
        return true;
    // Deux cartes portant réellement le même libellé ont la même valeur pédagogique.
    // Le joueur n'est donc pas sanctionné pour avoir choisi l'autre identifiant technique.
    const texteAttendu = normaliserReponseEvaluation(obtenirTexteAssociationDroite(activite, identifiantDroiteAttendu));
    const texteSaisi = normaliserReponseEvaluation(obtenirTexteAssociationDroite(activite, identifiantDroiteSaisi));
    return Boolean(texteAttendu && texteSaisi && texteAttendu === texteSaisi);
}
function validerSchemaAssociations(activite, associationsSaisies, schemaAttendu) {
    return Object.keys(schemaAttendu || {}).length === Object.keys(associationsSaisies || {}).length
        && Object.keys(schemaAttendu || {}).every(identifiantGauche =>
            associationElementCorrespond(activite, identifiantGauche, associationsSaisies[identifiantGauche], schemaAttendu)
        );
}
function validerAssociationsActivite(activite, associationsSaisies) {
    const schemasAcceptes = [
        activite?.associations || {},
        ...(Array.isArray(activite?.associationsAcceptees) ? activite.associationsAcceptees : [])
    ];
    return schemasAcceptes.some(schema => validerSchemaAssociations(activite, associationsSaisies, schema));
}
function validerActiviteInteractive() {
    if (etat.questionValidee)
        return;
    const question = etat.questionCourante, activite = question.activite, brouillon = etat.brouillonActivite;
    let estCorrecte = false, texteChoisi = '', precisions = {};
    if (activite.type === 'selection-multiple') {
        if (!brouillon.elementsSelectionnes.length) {
            afficherNotification('Sélectionne au moins une proposition.');
            return;
        }
        estCorrecte = tableauxEgaux([...brouillon.elementsSelectionnes].sort(), [...activite.reponses].sort());
        texteChoisi = activite.propositions.filter(proposition => brouillon.elementsSelectionnes.includes(proposition.id)).map(proposition => proposition.texte).join(' · ');
        precisions = { elementsSelectionnes: [...brouillon.elementsSelectionnes] };
    }
    else if (activite.type === 'remettre-ordre') {
        estCorrecte = tableauxEgaux(brouillon.ordre, activite.ordre);
        const parIdentifiant = Object.fromEntries(activite.elements.map(element => [element.id, element.texte]));
        texteChoisi = brouillon.ordre.map(identifiant => parIdentifiant[identifiant]).join(' → ');
        precisions = { ordre: [...brouillon.ordre] };
    }
    else if (activite.type === 'choisir-ordre') {
        if ((brouillon.ordre || []).length !== activite.ordre.length) {
            afficherNotification(`Choisis exactement ${activite.ordre.length} éléments.`);
            return;
        }
        estCorrecte = tableauxEgaux(brouillon.ordre, activite.ordre);
        const parIdentifiant = Object.fromEntries(activite.elements.map(element => [element.id, element.texte]));
        texteChoisi = brouillon.ordre.map(identifiant => parIdentifiant[identifiant]).join(' → ');
        precisions = { ordre: [...brouillon.ordre] };
    }
    else if (activite.type === 'association') {
        if (Object.keys(brouillon.associations).length < activite.colonneGauche.length) {
            afficherNotification('Relie chaque élément avant de valider.');
            return;
        }
        estCorrecte = validerAssociationsActivite(activite, brouillon.associations);
        texteChoisi = 'Associations complétées';
        precisions = { associations: { ...brouillon.associations } };
    }
    else if (activite.type === 'classer') {
        if (Object.keys(brouillon.classements).length < activite.elements.length) {
            afficherNotification('Classe chaque élément avant de valider.');
            return;
        }
        estCorrecte = Object.entries(activite.classements).every(([identifiantElement, identifiantCategorie]) =>
            brouillon.classements[identifiantElement] === identifiantCategorie
        );
        texteChoisi = 'Classement complété';
        precisions = { classements: { ...brouillon.classements } };
    }
    finaliserReponse(estCorrecte, texteChoisi, { precisions: precisions });
}
function rejouerQuestionCourante() {
    const question = etat.questionCourante;
    if (!question || !etat.questionValidee)
        return;
    const nombreReprises = etat.tentativesQuestions?.get(question.id) || 0;
    if (nombreReprises >= 1) {
        afficherNotification('Cette question a déjà été rejouée une fois.');
        return;
    }
    const precedent = etat.reponsesSession.get(question.id);
    envoyerEvenementPJJ('question_rejouee', {
        ...obtenirContexteQuestionAnalytics(question),
        pjjoue_resultat_reponse: obtenirResultatReponseAnalytics(precedent?.statut || 'incorrecte')
    });
    etat.tentativesQuestions = etat.tentativesQuestions || new Map();
    etat.tentativesQuestions.set(question.id, 1);
    etat.reponsesSession.set(question.id, { ...(precedent || {}), statut: 'passee' });
    etat.questionValidee = false;
    etat.brouillonActivite = null;
    afficherQuestion();
    enregistrerSessionEnCours();
    annoncer('Question prête à être rejouée.');
}
// -----------------------------------------------------------------------------
// Déroulement d’une question, chronomètre et correction
// -----------------------------------------------------------------------------
function preparerQuestionCourante() {
    fermerFenetreJokers({ restaurerFocus: false });
    const boutonValiderCourant = selectionner('#boutonValider');
    if (boutonValiderCourant) {
        boutonValiderCourant.classList.add('masque');
        boutonValiderCourant.removeAttribute('data-action');
    }

    clearInterval(etat.identifiantMinuteur);
    etat.questionCourante = etat.questionsSession[etat.indexQuestion];
    marquerEtapeDecouverte(etat.questionCourante);
    marquerQuestionJouee(etat.questionCourante);
    enregistrerSauvegarde();

    const question = etat.questionCourante;
    const reponse = etat.reponsesSession.get(question.id);
    const dejaPassee = reponse?.statut === 'passee';

    etat.jokersQuestions = etat.jokersQuestions || new Map();
    if (!etat.jokersQuestions.has(question.id)) {
        etat.jokersQuestions.set(question.id, {
            cinquanteCinquante: true,
            indice: true,
            langueAuChat: true
        });
    }
    etat.jokers = etat.jokersQuestions.get(question.id);
    etat.questionValidee = Boolean(reponse) && !dejaPassee;

    const carteQuestion = document.querySelector('#question .question');
    carteQuestion?.classList.remove('jalon-valide');
    carteQuestion?.classList.remove('question-apparition');
    void carteQuestion?.offsetWidth;
    carteQuestion?.classList.add('question-apparition');

    return { question, reponse, dejaPassee };
}

function afficherReperesQuestion(question) {
    const theme = THEMES.find(themeCandidat => themeCandidat.id === question.theme);
    const etapeProgramme = obtenirEtapeProgramme(question.theme, question.etape);
    const valeurProgression = Math.round(
        (etat.indexQuestion + 1) / etat.questionsSession.length * 100
    );
    const modeEvaluationFinale = etat.mode === 'evaluation-finale';
    const positionParcours = modeEvaluationFinale
        ? `Évaluation finale · Défi ${etat.indexQuestion + 1}/${etat.questionsSession.length}`
        : `Étape ${question.etape} · Défi ${etat.indexQuestion + 1}/${etat.questionsSession.length}`;
    const nomDestination = modeEvaluationFinale
        ? 'Destination finale'
        : (etapeProgramme?.titre || 'Parcours guidé');
    const repereProcedureLocale = question.procedureLocale
        ? '<span class="repere local repere-locale">Procédure locale</span>'
        : '';

    selectionner('#compteurQuestion').textContent =
        `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
    selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
    selectionner('#progressionQuestion').parentElement?.setAttribute(
        'aria-valuenow',
        String(valeurProgression)
    );
    selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
    selectionner('#reperesQuestion').innerHTML =
        `<span class="repere repere-position"><small>Position actuelle</small>`
        + `<b>${positionParcours}</b></span>`
        + `<span class="repere repere-theme">${creerIconeTheme(theme.id, theme.titre)}`
        + `<span><small>${nomDestination}</small><b>${theme.titre}</b></span></span>`
        + repereProcedureLocale;
}

function creerBoutonChoixUnique(proposition, indice, reponse, dejaPassee) {
    const bouton = document.createElement('button');
    bouton.className = 'reponse';
    bouton.dataset.indiceReponse = indice;
    bouton.dataset.estCorrecte = proposition.estCorrecte ? '1' : '0';
    bouton.setAttribute('role', 'radio');
    bouton.setAttribute(
        'aria-checked',
        reponse?.texteReponse === proposition.texte ? 'true' : 'false'
    );
    bouton.innerHTML =
        `<span class="lettre">${'ABCD'[indice]}</span>`
        + `<span>${proposition.texte}</span>`;

    const donneesJoker = obtenirDonneesJoker5050();
    if (
        donneesJoker?.nature === 'choix-unique'
        && donneesJoker.textesRetires?.includes(proposition.texte)
    ) {
        bouton.classList.add('retire');
    }

    if (reponse && !dejaPassee) {
        bouton.disabled = true;
    }
    else {
        bouton.onclick = () => choisirReponse(bouton, proposition);
    }
    return bouton;
}

function afficherChoixUnique(question, reponse, dejaPassee) {
    const zone = selectionner('#zoneReponses');
    zone.setAttribute('role', 'radiogroup');
    zone.setAttribute('aria-label', 'Choix de réponse');
    obtenirChoixQuestion(question).forEach((proposition, indice) => {
        zone.appendChild(creerBoutonChoixUnique(proposition, indice, reponse, dejaPassee));
    });
}

function afficherModeReponseQuestion(question, reponse, dejaPassee) {
    const zone = selectionner('#zoneReponses');
    zone.className = 'reponses';
    zone.innerHTML = '';

    const modePresentation = question.modePresentation || obtenirModeQuestion(question);
    const libelleMode = question.libelleMode || obtenirLibelleMode(modePresentation);
    selectionner('#reperesQuestion').insertAdjacentHTML(
        'beforeend',
        `<span class="repere mode-repere">${libelleMode}</span>`
    );

    if (modePresentation === 'reponse-ecrite') {
        afficherActiviteEcrite(reponse);
    }
    else if (modePresentation === 'eliminer') {
        afficherActiviteEliminer(question, reponse);
    }
    else if (question.activite && question.activite.type !== 'choix-unique') {
        afficherActiviteInteractive(question, reponse);
    }
    else {
        afficherChoixUnique(question, reponse, dejaPassee);
    }
}

function configurerNavigationQuestion(dejaPassee, modeEvaluationFinale) {
    selectionner('#zoneIndice').className = 'correction masque';
    selectionner('#zoneCorrection').className = 'correction masque';
    selectionner('#boutonQuestionPrecedente').disabled = etat.indexQuestion === 0;

    const boutonPasser = selectionner('#boutonPasser');
    const boutonSuivant = selectionner('#boutonQuestionSuivante');
    boutonPasser.classList.toggle('masque', etat.questionValidee || modeEvaluationFinale);
    boutonPasser.disabled = etat.questionValidee || modeEvaluationFinale;
    boutonSuivant.classList.toggle('masque', !etat.questionValidee);

    if (dejaPassee) {
        boutonSuivant.classList.add('masque');
        boutonPasser.classList.remove('masque');
        boutonPasser.disabled = false;
    }
}

function configurerJokersQuestion(jokersActifs) {
    const bouton5050 = selectionner('#boutonJoker5050');
    const boutonIndice = selectionner('#boutonJokerIndice');
    const boutonLangueAuChat = selectionner('#boutonJokerLangueAuChat');

    bouton5050.classList.remove('masque');
    bouton5050.disabled =
        !jokersActifs || etat.questionValidee || !etat.jokers.cinquanteCinquante;
    bouton5050.title = !etat.jokers.cinquanteCinquante
        ? 'Joker déjà utilisé pour cette activité.'
        : 'Donner environ la moitié de la résolution, quel que soit le mode de réponse.';

    boutonIndice.disabled = !jokersActifs || etat.questionValidee || !etat.jokers.indice;
    boutonIndice.title = !etat.jokers.indice
        ? 'Indice déjà utilisé pour cette activité.'
        : 'Afficher un indice adapté à cette activité.';

    boutonLangueAuChat.disabled =
        !jokersActifs || etat.questionValidee || !etat.jokers.langueAuChat;
    boutonLangueAuChat.title = !etat.jokers.langueAuChat
        ? 'Joker déjà utilisé pour cette activité.'
        : 'Dévoiler toute la réponse attendue grâce au joker « Langue au chat ».';

    actualiserBoutonJokers();
}

function configurerChronometreEtFocusQuestion(jokersActifs, modeEvaluationFinale) {
    if (!etat.questionValidee) {
        demarrerChronometreQuestion();
        if (jokersActifs && !modeEvaluationFinale) {
            programmerRappelJokers();
        }
    }
    else {
        selectionner('#chronometreQuestion').textContent = '';
        annulerRappelJokers();
    }

    const enonce = selectionner('#enonceQuestion');
    enonce.setAttribute('tabindex', '-1');
    enonce.focus({ preventScroll: true });
}

function appliquerIdentiteVisuelleEtape(question) {
    const programme = PROGRAMMES[question?.theme];
    const etapeProgramme = programme?.etapes?.find(
        etape => Number(etape.id) === Number(question?.etape)
    );
    document.documentElement.style.setProperty(
        '--couleur-etape-active',
        etapeProgramme?.couleur || '#ffc83d'
    );
    document.body.dataset.etapeActive = String(question?.etape || 'libre');
}
function actualiserSuiviEtapeQuestion(question) {
    const conteneur = selectionner('#contexteEtapeQuestion');
    const numero = selectionner('#numeroEtapeQuestion');
    const titre = selectionner('#titreEtapeQuestion');
    const suivi = selectionner('#suiviSansJokerQuestion');
    const compteur = selectionner('#compteurSansJokerQuestion');
    const boutonReinitialiser = selectionner('#boutonReinitialiserValidationsSansJoker');
    if (!conteneur || !numero || !titre || !suivi || !compteur || !boutonReinitialiser || !question)
        return;
    const finale = etat.mode === 'evaluation-finale' || Number(question.etape) === 12;
    const etapeProgramme = obtenirEtapeProgramme(question.theme, question.etape);
    numero.textContent = finale ? 'Étape 12' : `Étape ${question.etape}`;
    titre.textContent = finale ? 'Évaluation finale' : (etapeProgramme?.titre || 'Parcours PJJ');
    suivi.classList.toggle('masque', finale || etat.mode !== 'parcours');
    if (finale || etat.mode !== 'parcours')
        return;
    const questionsEtape = obtenirQuestionsEtape(question.theme, question.etape);
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    compteur.textContent = `${nombreAutonomes}/${questionsEtape.length}`;
    boutonReinitialiser.disabled = nombreAutonomes === 0;
    boutonReinitialiser.setAttribute(
        'aria-label',
        `Réinitialiser les ${nombreAutonomes} questions validées sans joker de l’étape ${question.etape}`
    );
}
function demanderReinitialisationSansJoker() {
    const question = etat.questionCourante;
    if (!question || etat.mode !== 'parcours')
        return;
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    if (!nombreAutonomes)
        return;
    ouvrirFenetreMessage({
        titre: 'Réinitialiser le compteur sans joker ?',
        message: `Les ${nombreAutonomes} validations sans joker de cette étape ne compteront plus pour ouvrir l’évaluation finale. Ta progression générale reste conservée.`,
        libelleConfirmer: 'Réinitialiser',
        libelleAnnuler: 'Annuler',
        afficherAnnuler: true,
        variante: 'avertissement',
        apresConfirmation: () => reinitialiserValidationSansJokerEtape(question.theme, question.etape)
    });
}
function afficherQuestion({ suivreAnalytics = true, reprendreChronometre = false } = {}) {
    const { question, reponse, dejaPassee } = preparerQuestionCourante();
    if (suivreAnalytics) {
        envoyerEvenementPJJ('question_affichee', {
            ...obtenirContexteQuestionAnalytics(question),
            pjjoue_resultat_reponse: obtenirResultatReponseAnalytics(
                reponse?.statut || (dejaPassee ? 'passee' : 'a_repondre')
            )
        });
    }
    appliquerIdentiteVisuelleEtape(question);
    actualiserSuiviEtapeQuestion(question);
    const modeEvaluationFinale = etat.mode === 'evaluation-finale';
    const jokersActifs = etat.jokersSessionActifs !== false;

    afficherReperesQuestion(question);
    afficherModeReponseQuestion(question, reponse, dejaPassee);
    configurerNavigationQuestion(dejaPassee, modeEvaluationFinale);
    configurerJokersQuestion(jokersActifs);

    if (reponse) {
        afficherCorrectionEnregistree(question, reponse);
    }

    if (reprendreChronometre && etat.chronometreSessionActif && !etat.questionValidee && etat.tempsRestant > 0) {
        reprendreChronometreQuestion(etat.tempsRestant);
        const enonce = selectionner('#enonceQuestion');
        enonce?.setAttribute('tabindex', '-1');
        enonce?.focus?.({ preventScroll: true });
    }
    else {
        configurerChronometreEtFocusQuestion(jokersActifs, modeEvaluationFinale);
    }
    enregistrerSessionEnCours();
}
function gererTempsEcoule() {
    if (etat.questionValidee)
        return;
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.tempsRestant = 0;
    const minuteur = selectionner('#chronometreQuestion');
    if (minuteur)
        minuteur.textContent = '0s';
    // Son d'échec
    if (typeof jouerSonErreur === 'function')
        jouerSonErreur();
    // La question est traitée comme une réponse incorrecte,
    // afin de déclencher la correction complète et l'explication.
    const question = etat.questionCourante;
    if (!question)
        return;
    const mode = question.modePresentation || obtenirModeQuestion(question);
    // Mémoriser le dépassement du temps pour adapter la correction.
    etat.delaiDepasse = true;
    if (mode === 'choix-unique') {
        finaliserReponse(false, 'Temps écoulé');
        return;
    }
    if (mode === 'selection-multiple' || mode === 'association' || mode === 'classer' || mode === 'remettre-ordre' || mode === 'eliminer' || mode === 'reponse-ecrite') {
        finaliserReponse(false, 'Temps écoulé');
        return;
    }
    finaliserReponse(false, 'Temps écoulé');
}
function reprendreChronometreQuestion(secondesRestantes = etat.tempsRestant) {
    if (!etat.chronometreSessionActif || etat.questionValidee || secondesRestantes <= 0)
        return;
    clearInterval(etat.identifiantMinuteur);
    etat.tempsRestant = secondesRestantes;
    const chronometre = selectionner('#chronometreQuestion');
    if (chronometre)
        chronometre.textContent = etat.tempsRestant + 's';
    etat.identifiantMinuteur = setInterval(() => {
        etat.tempsRestant--;
        if (chronometre)
            chronometre.textContent = etat.tempsRestant + 's';
        if (etat.tempsRestant <= 0) {
            clearInterval(etat.identifiantMinuteur);
            etat.identifiantMinuteur = null;
            gererTempsEcoule();
        }
    }, 1000);
}
function demarrerChronometreQuestion() {
    const chronometre = selectionner('#chronometreQuestion');
    etat.delaiDepasse = false;
    if (!etat.chronometreSessionActif) {
        chronometre.textContent = '';
        return;
    }
    etat.tempsRestant = Math.min(30, Math.max(5, Number(etat.dureeChronometreSession) || 15));
    chronometre.textContent = etat.tempsRestant + 's';
    etat.identifiantMinuteur = setInterval(() => {
        etat.tempsRestant--;
        chronometre.textContent = etat.tempsRestant + 's';
        if (etat.tempsRestant <= 0) {
            clearInterval(etat.identifiantMinuteur);
            etat.identifiantMinuteur = null;
            gererTempsEcoule();
        }
    }, 1000);
}
function preparerValidationReponse(question, bouton) {
    annulerRappelJokers();
    const precedente = etat.reponsesSession.get(question.id);
    const etaitPassee = precedente?.statut === 'passee';
    const tentatives = etat.tentativesQuestions?.get(question.id) || 0;
    const aideUtilisee = Object.values(etat.jokers || {}).some(valeur => valeur === false);
    etat.questionValidee = true;
    fermerFenetreJokers({ restaurerFocus: false });
    actualiserBoutonJokers();
    clearInterval(etat.identifiantMinuteur);
    sauvegarde.aDejaJoue = true;
    marquerEtapeDecouverte(question);
    marquerQuestionJouee(question);
    if (!precedente)
        sauvegarde.nombreQuestionsJouees = (sauvegarde.nombreQuestionsJouees || 0) + 1;
    selectionnerTous(
        '.reponse,.multiple-choix,.activite-valider,.ordre-commandes button,'
        + '.association-colonne button,.classement-element button'
    ).forEach(commande => commande.disabled = true);
    if (bouton)
        bouton.setAttribute('aria-checked', 'true');
    selectionner('#boutonPasser').classList.add('masque');
    selectionner('#boutonValider')?.classList.add('masque');
    return { etaitPassee, tentatives, aideUtilisee };
}
function enregistrerResultatReponse(question, texteChoisi, precisions, resultat) {
    const { reussiteAutonome, reussiteAidee, tentatives, aideUtilisee } = resultat;
    etat.reponsesSession.set(question.id, {
        statut: reussiteAutonome ? 'correcte' : (reussiteAidee ? 'aidee' : 'incorrecte'),
        texteReponse: texteChoisi,
        precisions: {
            ...precisions,
            aidee: reussiteAidee,
            tentatives,
            aideUtilisee
        }
    });
    if (resultat.etaitPassee)
        etat.questionsPassees.delete(question.id);
    etat.brouillonsEcrits?.delete(question.id);
    if (etat.mode !== 'parcours') {
        enregistrerSessionEnCours();
        return;
    }
    const bilan = obtenirBilanEtape(question.theme, question.etape);
    bilan.questionsTraitees[question.id] = true;
    bilan.resultats[question.id] = bilan.resultats?.[question.id] === true || reussiteAutonome;
    if (aideUtilisee)
        etat.etapeAvecJoker = true;
    synchroniserEtapesReussiesEnAutonomie(PROGRAMMES[question.theme]);
    actualiserSuiviEtapeQuestion(question);
    enregistrerSessionEnCours();
}
function obtenirSuiviErreur(question) {
    sauvegarde.erreurs[question.id] = sauvegarde.erreurs[question.id] || {
        reussites: 0,
        maitrisee: false,
        nombreErreurs: 0,
        theme: question.theme
    };
    return sauvegarde.erreurs[question.id];
}
function traiterReussiteAutonome(question, etaitPassee) {
    etat.score++;
    etat.serie++;
    etat.meilleureSerie = Math.max(etat.meilleureSerie, etat.serie);
    sauvegarde.meilleureSerie = Math.max(sauvegarde.meilleureSerie || 0, etat.serie);
    etat.erreursSession.delete(question.id);
    jouerSonReussite();
    if (etaitPassee && sauvegarde.erreurs[question.id]
        && (sauvegarde.erreurs[question.id].nombreErreurs || 0) <= 1) {
        delete sauvegarde.erreurs[question.id];
        return;
    }
    if (etat.mode === 'revision' && sauvegarde.erreurs[question.id]) {
        const suiviErreur = sauvegarde.erreurs[question.id];
        suiviErreur.reussites = (suiviErreur.reussites || 0) + 1;
        if (suiviErreur.reussites >= 2)
            suiviErreur.maitrisee = true;
    }
}
function traiterReussiteAidee(question, etaitPassee) {
    etat.nombreReponsesAidees = (etat.nombreReponsesAidees || 0) + 1;
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    jouerSonReussite();
    if (etat.mode === 'evaluation-finale')
        return;
    const suiviErreur = obtenirSuiviErreur(question);
    if (!etaitPassee)
        suiviErreur.nombreErreurs = (suiviErreur.nombreErreurs || 0) + 1;
    suiviErreur.reussites = 0;
    suiviErreur.maitrisee = false;
}
function traiterReponseIncorrecte(question, etaitPassee) {
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    jouerSonErreur();
    if (etat.mode === 'evaluation-finale')
        return;
    const suiviErreur = obtenirSuiviErreur(question);
    if (!etaitPassee)
        suiviErreur.nombreErreurs = (suiviErreur.nombreErreurs || 0) + 1;
    suiviErreur.reussites = 0;
    suiviErreur.maitrisee = false;
}
function actualiserIndicateurSerie() {
    const indicateur = selectionner('#indicateurSerie');
    const valeur = indicateur?.querySelector('strong');
    if (!indicateur || !valeur)
        return;
    const nombreReussites = Number(etat.serie) || 0;
    const serieVisible = nombreReussites >= 2;
    indicateur.classList.toggle('masque', !serieVisible);
    indicateur.classList.toggle('serie-remarquable', nombreReussites >= 5);
    valeur.textContent = serieVisible ? `Série ×${nombreReussites}` : '';
    indicateur.setAttribute(
        'aria-label',
        serieVisible ? `${nombreReussites} réussites autonomes consécutives` : ''
    );
}
function obtenirTexteCorrection(question, resultat, texteChoisi, precisions) {
    const { estCorrecte, reussiteAutonome, reussiteAidee } = resultat;
    const banniereTempsEcoule = etat.delaiDepasse
        ? '<div class="temps-ecoule-correction"><strong>Temps écoulé</strong>'
            + '<span>La bonne réponse et l’explication sont affichées ci-dessous.</span></div>'
        : '';
    const reponseAttendueDetaillee = construireCorrectionDetaillee(question, echapperHtml);
    const reponseJoueur = !estCorrecte
        && !precisions.langueAuChatUtilisee
        && texteChoisi
        ? `<p><b>Ta réponse :</b> ${echapperHtml(texteChoisi)}</p>`
        : '';
    const titre = precisions.langueAuChatUtilisee
        ? 'Langue au chat — réponse dévoilée'
        : (reussiteAutonome
            ? 'Bonne réponse'
            : (reussiteAidee ? 'Compris avec aide — à consolider' : 'Pas cette fois'));
    const message = precisions.langueAuChatUtilisee
        ? 'Toute la réponse est affichée. Cette activité est enregistrée avec aide et reviendra dans tes révisions pour être retravaillée seule.'
        : (reussiteAidee
            ? 'La notion a été comprise, mais cette réponse ne compte pas comme une réussite autonome. Elle rejoint tes révisions.'
            : (reussiteAutonome
                ? MESSAGES_REUSSITE[Math.floor(Math.random() * MESSAGES_REUSSITE.length)]
                : MESSAGES_ERREUR[Math.floor(Math.random() * MESSAGES_ERREUR.length)]));
    const repriseDisponible = (etat.tentativesQuestions?.get(question.id) || 0) < 1;
    const boutonRejouer = !estCorrecte
        && !reussiteAidee
        && etat.mode !== 'evaluation-finale'
        && repriseDisponible
        ? '<button class="principal reessayer-question-bouton" id="rejouerQuestion" '
            + 'type="button">Rejouer la question</button>'
        : '';
    const procedureLocale = question.procedureLocale
        ? '<p><b>Procédure locale :</b> le circuit exact du service réel doit toujours primer sur ce scénario pédagogique.</p>'
        : '';
    const contenu = `<div class="correction-entete"><h3>${titre}</h3>`
        + `<div class="correction-entete-actions">${boutonRejouer}`
        + '<button class="correction-fermer" id="correction-fermer" type="button" '
        + 'aria-label="Fermer l’explication" title="Fermer l’explication">×</button></div></div>'
        + '<div class="correction-separateur" aria-hidden="true"></div>'
        + `<div class="correction-corps"><p class="encouragement">${message}</p>`
        + `${banniereTempsEcoule}${reponseJoueur}${reponseAttendueDetaillee}`
        + `<p><b>Explication :</b> ${question.explication}</p>${procedureLocale}</div>`;
    return { titre, contenu };
}
function afficherCorrectionReponse(question, resultat, texteChoisi, precisions) {
    const correction = selectionner('#zoneCorrection');
    document.querySelector('#question .question-carte')?.classList.toggle(
        'jalon-valide',
        resultat.reussiteAutonome
    );
    const { titre, contenu } = obtenirTexteCorrection(question, resultat, texteChoisi, precisions);
    correction.className = 'correction '
        + (resultat.reussiteAutonome ? 'bon' : (resultat.reussiteAidee ? 'aidee' : 'incorrecte'));
    correction.classList.remove(
        'correction-correcte',
        'correction-incorrecte',
        'langue-chat-calque'
    );
    if (precisions.langueAuChatUtilisee)
        correction.classList.add('langue-chat-calque');
    else
        correction.classList.add(resultat.estCorrecte ? 'correction-correcte' : 'correction-incorrecte');
    correction.innerHTML = contenu;
    const boutonRejouer = selectionner('#rejouerQuestion');
    if (boutonRejouer)
        boutonRejouer.onclick = rejouerQuestionCourante;
    const boutonFermerCorrection = selectionner('#correction-fermer');
    if (boutonFermerCorrection) {
        boutonFermerCorrection.onclick = () => {
            correction.classList.add('masque');
            correction.innerHTML = '';
            const boutonSuivant = selectionner('#boutonQuestionSuivante');
            if (boutonSuivant)
                boutonSuivant.focus({ preventScroll: true });
            annoncer('Explication fermée. La question est de nouveau affichée.');
        };
    }
    selectionner('#boutonQuestionSuivante').classList.remove('masque');
    annoncer(`${titre}. ${question.explication}`);
    requestAnimationFrame(() => correction.focus({ preventScroll: true }));
}
function finaliserReponse(estCorrecte, texteChoisi, { bouton = null, precisions = {} } = {}) {
    if (etat.questionValidee)
        return false;
    const question = etat.questionCourante;
    const preparation = preparerValidationReponse(question, bouton);
    const reussiteAidee = estCorrecte
        && (preparation.tentatives > 0 || preparation.aideUtilisee);
    const resultat = {
        ...preparation,
        estCorrecte,
        reussiteAidee,
        reussiteAutonome: estCorrecte && !reussiteAidee
    };
    envoyerEvenementPJJ('reponse_validee', {
        ...obtenirContexteQuestionAnalytics(question),
        pjjoue_resultat_reponse: resultat.reussiteAutonome
            ? 'Réussite autonome'
            : (resultat.reussiteAidee ? 'Réussite avec aide' : 'Réponse incorrecte'),
        pjjoue_nombre_tentatives: Math.max(1, Number(resultat.tentatives) + 1),
        pjjoue_temps_ecoule: etat.delaiDepasse ? 'Oui' : 'Non'
    });
    enregistrerResultatReponse(question, texteChoisi, precisions, resultat);
    if (resultat.reussiteAutonome)
        traiterReussiteAutonome(question, resultat.etaitPassee);
    else if (resultat.reussiteAidee)
        traiterReussiteAidee(question, resultat.etaitPassee);
    else
        traiterReponseIncorrecte(question, resultat.etaitPassee);
    actualiserIndicateurSerie();
    afficherCorrectionReponse(question, resultat, texteChoisi, precisions);
    enregistrerSauvegarde();
    return true;
}
function choisirReponse(bouton, proposition) {
    finaliserReponse(Boolean(proposition.estCorrecte), proposition.texte, { bouton });
}
function obtenirLibelleNombreJokers(nombre) {
    return nombre === 1 ? 'un joker' : nombre === 2 ? 'deux jokers' : nombre === 3 ? 'trois jokers' : `${nombre} jokers`;
}
function demanderPassageQuestion() {
    if (etat.questionValidee)
        return;
    const disponibles = compterJokersDisponibles();
    const tempsEnPause = etat.tempsRestant;
    const minuteurEtaitActif = !!etat.identifiantMinuteur;
    if (minuteurEtaitActif) {
        clearInterval(etat.identifiantMinuteur);
        etat.identifiantMinuteur = null;
    }
    const rappelJoker = disponibles > 0
        ? ` N’oublie pas qu’il te reste ${obtenirLibelleNombreJokers(disponibles)}.`
        : '';
    ouvrirFenetreMessage({
        titre: '',
        message: `Es-tu sûr de vouloir passer cette question ?${rappelJoker}`,
        libelleConfirmer: 'Oui',
        libelleAnnuler: 'Annuler',
        afficherAnnuler: true,
        variante: 'avertissement',
        apresConfirmation: passerQuestion,
        apresAnnulation: () => {
            if (minuteurEtaitActif && !etat.questionValidee)
                reprendreChronometreQuestion(tempsEnPause);
        }
    });
}
function passerQuestion() {
    if (etat.questionValidee)
        return;
    annulerRappelJokers();
    const question = etat.questionCourante, precedente = etat.reponsesSession.get(question.id);
    envoyerEvenementPJJ('question_passee', {
        ...obtenirContexteQuestionAnalytics(question),
        pjjoue_resultat_reponse: 'Question passée'
    });
    clearInterval(etat.identifiantMinuteur);
    sauvegarde.aDejaJoue = true;
    marquerEtapeDecouverte(question);
    marquerQuestionJouee(question);
    if (!precedente)
        sauvegarde.nombreQuestionsJouees = (sauvegarde.nombreQuestionsJouees || 0) + 1;
    etat.reponsesSession.set(question.id, { statut: 'passee', texteReponse: '' });
    etat.questionsPassees.add(question.id);
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    actualiserIndicateurSerie();
    sauvegarde.erreurs[question.id] = sauvegarde.erreurs[question.id] || { reussites: 0, maitrisee: false, nombreErreurs: 0, theme: question.theme };
    if (!precedente) {
        sauvegarde.erreurs[question.id].nombreErreurs = (sauvegarde.erreurs[question.id].nombreErreurs || 0) + 1;
        sauvegarde.erreurs[question.id].nombrePassages = (sauvegarde.erreurs[question.id].nombrePassages || 0) + 1;
    }
    sauvegarde.erreurs[question.id].reussites = 0;
    sauvegarde.erreurs[question.id].maitrisee = false;
    enregistrerSauvegarde();
    enregistrerSessionEnCours();
    afficherQuestionSuivante();
}
function afficherQuestionPrecedente() {
    if (etat.indexQuestion <= 0)
        return;
    clearInterval(etat.identifiantMinuteur);
    annulerRappelJokers();
    etat.indexQuestion--;
    afficherQuestion();
}
function afficherQuestionSuivante() {
    clearInterval(etat.identifiantMinuteur);
    annulerRappelJokers();
    etat.indexQuestion++;
    if (etat.indexQuestion >= etat.questionsSession.length)
        terminerSession();
    else
        afficherQuestion();
}
// -----------------------------------------------------------------------------
// Jokers et aides pendant une question
// -----------------------------------------------------------------------------
function utiliserJoker5050PourReponseEcrite(question) {
    const texteDevoile = masquerMoitiéTexte(question.bonneReponse);
    consommerJoker5050({ nature: 'reponse-ecrite', texteDevoile });
    afficherActiviteEcrite(null);
    afficherNotification('La moitié des éléments de la réponse est révélée.');
}
function utiliserJoker5050PourElimination(question) {
    if (!etat.brouillonActivite || etat.brouillonActivite.identifiantQuestion !== question.id) {
        etat.brouillonActivite = {
            identifiantQuestion: question.id,
            elementsElimines: [],
            eliminationsVerrouillees: []
        };
    }
    const propositions = obtenirChoixQuestion(question);
    const nombreAttendu = obtenirNombreEliminationsAttendues(question);
    const nombreAConfirmer = Math.max(1, Math.ceil(nombreAttendu / 2));
    const propositionsIncorrectes = propositions
        .map((proposition, indice) => ({ proposition, indice }))
        .filter(element => !element.proposition.estCorrecte);
    const elementsDejaElimines = etat.brouillonActivite.elementsElimines || [];
    const eliminationsCorrectesExistantes = elementsDejaElimines.filter(indice =>
        !propositions[indice]?.estCorrecte
    );
    const dejaVerrouillees = (etat.brouillonActivite.eliminationsVerrouillees || []).filter(indice =>
        !propositions[indice]?.estCorrecte
    );
    const indicesAConfirmer = [...new Set([
        ...dejaVerrouillees,
        ...eliminationsCorrectesExistantes,
        ...propositionsIncorrectes.map(element => element.indice)
    ])].slice(0, nombreAConfirmer);
    if (!indicesAConfirmer.length) {
        consommerJoker5050({
            nature: 'eliminer',
            verrouilles: [],
            elementsElimines: [...eliminationsCorrectesExistantes]
        });
        afficherNotification('Le 50/50 confirme le travail déjà réalisé.');
        return;
    }
    etat.brouillonActivite.elementsElimines = [...new Set([
        ...eliminationsCorrectesExistantes,
        ...indicesAConfirmer
    ])].slice(0, nombreAttendu);
    etat.brouillonActivite.eliminationsVerrouillees = [...indicesAConfirmer];
    consommerJoker5050({
        nature: 'eliminer',
        verrouilles: [...indicesAConfirmer],
        elementsElimines: [...etat.brouillonActivite.elementsElimines]
    });
    afficherActiviteEliminer(question, null);
    afficherNotification('Une partie des retraits attendus est confirmée et verrouillée.');
}
function utiliserJoker5050PourSelectionMultiple(activite) {
    const propositionsIncorrectes = activite.propositions.filter(proposition =>
        !activite.reponses.includes(proposition.id)
    );
    const nombreARetirer = Math.max(1, Math.ceil(propositionsIncorrectes.length / 2));
    const identifiantsRetires = melanger(propositionsIncorrectes)
        .slice(0, nombreARetirer)
        .map(proposition => proposition.id);
    etat.brouillonActivite.elementsRetires = identifiantsRetires;
    etat.brouillonActivite.elementsSelectionnes = etat.brouillonActivite.elementsSelectionnes
        .filter(identifiant => !identifiantsRetires.includes(identifiant));
    consommerJoker5050({ nature: 'selection-multiple', elementsRetires: [...identifiantsRetires] });
    actualiserActiviteInteractive();
    afficherNotification('La moitié des propositions non pertinentes est écartée.');
}
function utiliserJoker5050PourChoisirOrdre(activite) {
    const nombreElementsVerrouilles = Math.max(1, Math.ceil(activite.ordre.length / 2));
    etat.brouillonActivite.ordre = [...activite.ordre.slice(0, nombreElementsVerrouilles)];
    etat.brouillonActivite.nombreChoixOrdreVerrouilles = nombreElementsVerrouilles;
    consommerJoker5050({
        nature: 'choisir-ordre',
        nombreVerrouille: nombreElementsVerrouilles,
        ordre: [...etat.brouillonActivite.ordre]
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié du bon ordre est donnée et verrouillée.');
}
function utiliserJoker5050PourOrdre(activite) {
    const ordreAttendu = [...activite.ordre];
    const nombrePositionsVerrouillees = Math.max(1, Math.ceil(ordreAttendu.length / 2));
    const positionsVerrouillees = melanger(ordreAttendu.map((_identifiant, indice) => indice))
        .slice(0, nombrePositionsVerrouillees)
        .sort((indiceA, indiceB) => indiceA - indiceB);
    const ensemblePositionsVerrouillees = new Set(positionsVerrouillees);
    const identifiantsVerrouilles = new Set(
        positionsVerrouillees.map(indice => ordreAttendu[indice])
    );
    const identifiantsRestants = (etat.brouillonActivite.ordre || [])
        .filter(identifiant => !identifiantsVerrouilles.has(identifiant));
    let indiceRestant = 0;
    etat.brouillonActivite.ordre = ordreAttendu.map((identifiant, indice) =>
        ensemblePositionsVerrouillees.has(indice)
            ? identifiant
            : identifiantsRestants[indiceRestant++]
    );
    etat.brouillonActivite.positionsOrdreVerrouillees = positionsVerrouillees;
    consommerJoker5050({
        nature: 'remettre-ordre',
        verrouilles: [...positionsVerrouillees],
        ordre: [...etat.brouillonActivite.ordre]
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié du bon ordre est complétée et verrouillée.');
}
function utiliserJoker5050PourAssociation(activite) {
    const identifiantsGauche = Object.keys(activite.associations);
    const associationsVerrouillees = melanger(identifiantsGauche)
        .slice(0, Math.max(1, Math.ceil(identifiantsGauche.length / 2)));
    etat.brouillonActivite.associationsVerrouillees = associationsVerrouillees;
    associationsVerrouillees.forEach(identifiantGauche => {
        const identifiantDroite = activite.associations[identifiantGauche];
        Object.keys(etat.brouillonActivite.associations).forEach(identifiantCandidat => {
            const utiliseMemeElementDroite = etat.brouillonActivite.associations[identifiantCandidat]
                === identifiantDroite;
            if (identifiantCandidat !== identifiantGauche && utiliseMemeElementDroite)
                delete etat.brouillonActivite.associations[identifiantCandidat];
        });
        etat.brouillonActivite.associations[identifiantGauche] = identifiantDroite;
    });
    if (associationsVerrouillees.includes(etat.brouillonActivite.colonneGauche))
        etat.brouillonActivite.colonneGauche = null;
    consommerJoker5050({
        nature: 'association',
        verrouilles: [...associationsVerrouillees],
        associations: { ...etat.brouillonActivite.associations }
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié des associations est donnée et verrouillée.');
}
function utiliserJoker5050PourClassement(activite) {
    const identifiantsElements = activite.elements.map(element => element.id);
    const classementsVerrouilles = melanger(identifiantsElements)
        .slice(0, Math.max(1, Math.ceil(identifiantsElements.length / 2)));
    etat.brouillonActivite.classementsVerrouilles = classementsVerrouilles;
    classementsVerrouilles.forEach(identifiant => {
        etat.brouillonActivite.classements[identifiant] = activite.classements[identifiant];
    });
    consommerJoker5050({
        nature: 'classer',
        verrouilles: [...classementsVerrouilles],
        classements: { ...etat.brouillonActivite.classements }
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié des classements est donnée et verrouillée.');
}
function utiliserJoker5050PourChoixUnique() {
    const boutonsIncorrects = Array.from(document.querySelectorAll('.reponse'))
        .filter(bouton => bouton.dataset.estCorrecte !== '1');
    const nombreBoutonsARetirer = Math.max(1, Math.ceil(boutonsIncorrects.length / 2));
    const boutonsRetires = melanger(boutonsIncorrects).slice(0, nombreBoutonsARetirer);
    consommerJoker5050({
        nature: 'choix-unique',
        textesRetires: boutonsRetires.map(bouton =>
            bouton.textContent.replace(/^[A-D]/, '').trim()
        )
    });
    boutonsRetires.forEach(bouton => bouton.classList.add('retire'));
    afficherNotification('La moitié des mauvaises propositions est écartée.');
}
function utiliserJoker5050() {
    activerCoucheJoker('cinquanteCinquante');
    if (etat.questionValidee || !etat.jokers.cinquanteCinquante)
        return;
    const question = etat.questionCourante;
    const mode = question.modePresentation || obtenirModeQuestion(question);
    const activite = question.activite;
    if (mode === 'reponse-ecrite')
        return utiliserJoker5050PourReponseEcrite(question);
    if (mode === 'eliminer')
        return utiliserJoker5050PourElimination(question);
    if (activite?.type === 'selection-multiple')
        return utiliserJoker5050PourSelectionMultiple(activite);
    if (activite?.type === 'choisir-ordre')
        return utiliserJoker5050PourChoisirOrdre(activite);
    if (activite?.type === 'remettre-ordre')
        return utiliserJoker5050PourOrdre(activite);
    if (activite?.type === 'association')
        return utiliserJoker5050PourAssociation(activite);
    if (activite?.type === 'classer')
        return utiliserJoker5050PourClassement(activite);
    return utiliserJoker5050PourChoixUnique();
}
function fermerAideJokerOuverte(sauf = null) {
    const zoneIndice = selectionner('#zoneIndice');
    if (!zoneIndice)
        return;
    if (sauf !== 'zoneIndice' && !zoneIndice.classList.contains('masque')) {
        zoneIndice.classList.add('masque');
        zoneIndice.replaceChildren();
        zoneIndice.classList.remove('indice-calque', 'langue-chat-calque');
    }
}
function activerCoucheJoker(type) {
    // Le dernier joker utilisé doit toujours être visible.
    // 50/50 n'a pas d'overlay : on ferme donc tout overlay précédent.
    if (type === 'cinquanteCinquante') {
        fermerAideJokerOuverte();
        return;
    }
    // Indice et Langue au chat partagent la même surface :
    // on nettoie systématiquement son contenu avant d'afficher le nouveau.
    if (type === 'indice' || type === 'langueAuChat') {
        const zoneIndice = selectionner('#zoneIndice');
        if (!zoneIndice)
            return;
        zoneIndice.replaceChildren();
        zoneIndice.classList.add('masque');
        zoneIndice.classList.remove('indice-calque', 'langue-chat-calque');
    }
}
function utiliserIndice(type) {
    activerCoucheJoker('indice');
    if (type !== 'indice' || etat.questionValidee || !etat.jokers.indice)
        return;
    marquerJokerUtilise();
    envoyerUtilisationJoker('indice');
    etat.jokers.indice = false;
    selectionner('#boutonJokerIndice').disabled = true;
    actualiserBoutonJokers();
    const zone = selectionner('#zoneIndice');
    zone.replaceChildren();
    zone.className = 'correction indice-calque';
    zone.setAttribute('role', 'dialog');
    zone.setAttribute('aria-label', 'Indice');
    const entete = document.createElement('div');
    entete.className = 'correction-entete';
    const titre = document.createElement('h3');
    titre.textContent = 'Indice';
    const fermer = document.createElement('button');
    fermer.type = 'button';
    fermer.className = 'indice-fermer';
    fermer.setAttribute('aria-label', 'Fermer l’indice');
    fermer.textContent = '×';
    entete.append(titre, fermer);
    const separateur = document.createElement('div');
    separateur.className = 'correction-separateur';
    separateur.setAttribute('aria-hidden', 'true');
    const message = document.createElement('p');
    message.className = 'encouragement';
    message.textContent = etat.questionCourante.indice || 'Repère les informations certaines de la situation avant d’examiner les choix.';
    zone.append(entete, separateur, message);
    zone.classList.remove('masque');
    fermer.onclick = () => { zone.classList.add('masque'); zone.replaceChildren(); selectionner('#boutonJokerIndice').focus({ preventScroll: true }); };
    annoncer(`Indice. ${message.textContent}`);
}
function utiliserLangueAuChat() {
    activerCoucheJoker('langueAuChat');
    if (etat.questionValidee || !etat.jokers.langueAuChat)
        return;
    annulerRappelJokers();
    marquerJokerUtilise();
    envoyerUtilisationJoker('langue_au_chat');
    etat.jokers.langueAuChat = false;
    selectionner('#boutonJokerLangueAuChat').disabled = true;
    actualiserBoutonJokers();
    const question = etat.questionCourante;
    finaliserReponse(true, question.bonneReponse || 'Réponse dévoilée', { precisions: { langueAuChatUtilisee: true } });
}
// -----------------------------------------------------------------------------
// Fin de session, bilan, révision et progression détaillée
// -----------------------------------------------------------------------------
function afficherCelebration({ titre = 'Bravo !', message = '', finale = false } = {}) {
    const fenetre = selectionner('#fenetreCelebration');
    const elementTitre = selectionner('#titreFenetreCelebration');
    const elementTexte = selectionner('#texteFenetreCelebration');
    const fermer = selectionner('#fermerFenetreCelebration');
    const boutonContinuer = selectionner('#continuerFenetreCelebration');
    if (!fenetre || !elementTitre || !elementTexte || !fermer || !boutonContinuer) {
        afficherNotification(message || titre);
        return;
    }
    elementTitre.textContent = titre;
    elementTexte.textContent = message;
    fenetre.classList.toggle('grande-finale', !!finale);
    const fermerFenetre = () => {
        if (fenetre.open)
            fenetre.close();
        fenetre.classList.remove('grande-finale');
    };
    fermer.onclick = fermerFenetre;
    boutonContinuer.onclick = fermerFenetre;
    fenetre.oncancel = evenement => {
        evenement.preventDefault();
        fermerFenetre();
    };
    if (!fenetre.open)
        fenetre.showModal();
    requestAnimationFrame(() => boutonContinuer.focus({ preventScroll: true }));
    return fenetre;
}
function obtenirCelebrationEtape(etape, jokerUtilise, evaluationDeverrouillee = false) {
    const etapeProgramme = Number(etape);
    if (jokerUtilise) {
        return {
            titre: `Étape ${etapeProgramme} explorée`,
            message: `Ton carnet avance. Reviens sur cette étape sans joker pour valider cette destination et poursuivre le parcours en autonomie.`,
            confetti: false
        };
    }
    const titreSymbolique = obtenirTitreSymboliqueParcours(compterEtapesMaitrisees());
    if (evaluationDeverrouillee) {
        return {
            titre: 'Destination finale atteinte !',
            message: `Les onze étapes sont validées en autonomie. Ton carnet te reconnaît comme « ${titreSymbolique} » et l’évaluation finale est maintenant ouverte.`,
            confetti: true
        };
    }
    return {
        titre: `Étape ${etapeProgramme} validée en autonomie !`,
        message: `Une nouvelle destination est inscrite dans ton carnet. Ton titre actuel : « ${titreSymbolique} ». Le chemin continue vers l’étape suivante.`,
        confetti: true
    };
}
function sessionAUtiliseJoker() {
    if (etat.jokersSessionActifs === false)
        return false;
    return etat.sessionAvecJoker === true;
}
function obtenirContexteFinSession() {
    if (etat.mode === 'evaluation-finale')
        return 'Étape 12 · Évaluation finale';
    if (etat.mode === 'parcours') {
        const etapeProgramme = obtenirEtapeProgramme(etat.theme, etat.etape);
        return `Étape ${etat.etape}${etapeProgramme?.titre ? ' · ' + etapeProgramme.titre : ''}`;
    }
    if (etat.mode === 'revision')
        return 'Révision des erreurs';
    return 'Entraînement libre';
}
function obtenirStatutErreurBilan(reponse, estQuestionPassee) {
    if (estQuestionPassee)
        return 'Activité passée';
    if (reponse?.statut === 'aidee') {
        if (reponse.precisions?.aideUtilisee)
            return 'Réussite avec joker — à reprendre';
        if ((reponse.precisions?.tentatives || 0) > 0)
            return 'Réussite après une nouvelle tentative — à consolider';
        return 'Réussite avec aide — à consolider';
    }
    return 'Réponse incorrecte';
}
function afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees) {
    const zone = selectionner('#listeErreursBilan');
    const nombre = selectionner('#nombreErreursBilan');
    if (nombre)
        nombre.textContent = `${questionsAReprendre.length} question${questionsAReprendre.length > 1 ? 's' : ''} à reprendre`;
    if (!zone)
        return;
    const regleLecture = `<div class="bilan-correction-regle">
    <strong>À savoir</strong>
    <span>Les questions passées sont listées sans dévoiler leur réponse. La correction apparaît seulement lorsqu’une réponse a été tentée et qu’elle était incorrecte.</span>
  </div>`;
    const accordActivitesPassees = nombreQuestionsPassees === 1 ? '' : 's';
    const sujetActivitesPassees = nombreQuestionsPassees > 1 ? 'Elles ne comptent' : 'Elle ne compte';
    const accordRealisees = nombreQuestionsPassees === 1 ? '' : 's';
    const informationReponsesCachees = nombreQuestionsPassees > 1
        ? 'Leurs réponses restent cachées.'
        : 'Sa réponse reste cachée.';
    const informationPassage = nombreQuestionsPassees
        ? `<div class="bilan-passage-information">
        <b>${nombreQuestionsPassees} activité${accordActivitesPassees} passée${accordActivitesPassees}</b>
        <span>${sujetActivitesPassees} pas comme réalisée${accordRealisees} pour la maîtrise de l’étape. ${informationReponsesCachees}</span>
      </div>`
        : '';
    if (!questionsAReprendre.length) {
        zone.innerHTML = regleLecture
            + informationPassage
            + '<div class="bilan-parfait">'
            + '<span aria-hidden="true">✓</span>'
            + '<div><h3>Aucune question à reprendre</h3>'
            + '<p>Toutes les activités de cette session ont été réussies de manière autonome.</p>'
            + '</div></div>';
        return;
    }
    zone.innerHTML = regleLecture + informationPassage + `<div class="bilan-erreurs-liste">${questionsAReprendre.map((question, indice) => {
        const reponse = etat.reponsesSession.get(question.id);
        const estPassee = etat.questionsPassees?.has(question.id) || reponse?.statut === 'passee';
        const contenuResultat = estPassee
            ? `<div class="bilan-reponse-passee">
          <strong>Réponse non dévoilée</strong>
          <span>Tu as passé cette question sans proposer de réponse. Rejoue-la pour essayer de trouver la solution.</span>
        </div>`
            : `<div class="bilan-attendue-reponse">${construireCorrectionDetaillee(question, echapperHtml)}</div>`;
        return `<article class="bilan-erreur-element ${estPassee ? 'bilan-erreur-passee' : ''}">
      <div class="bilan-erreur-numero" aria-hidden="true">${indice + 1}</div>
      <div class="bilan-erreur-corps">
        <div class="bilan-erreur-meta"><span>Question ${question.id}</span><strong>${obtenirStatutErreurBilan(reponse, estPassee)}</strong></div>
        <h3>${echapperHtml(nettoyerEnonce(question))}</h3>
        ${contenuResultat}
      </div>
    </article>`;
    }).join('')}</div>`;
}
function mettreAJourProgressionFinSession(pourcentage, nombreQuestionsPassees, jokerUtilise) {
    let evaluationFinaleReussie = false;
    let celebration = null;
    if (etat.mode === 'parcours') {
        const bilanEtape = obtenirBilanEtape(etat.theme, etat.etape);
        bilanEtape.meilleurScore = Math.max(bilanEtape.meilleurScore || 0, pourcentage);
        bilanEtape.nombreTentatives = (bilanEtape.nombreTentatives || 0) + 1;
        const etapeTerminee = !etapeNecessiteAutreChapitre(etat.theme, etat.etape)
            && nombreQuestionsPassees === 0;
        if (etapeTerminee) {
            const questionsEtape = obtenirQuestionsEtape(etat.theme, etat.etape);
            const toutesReussiesEnAutonomie = questionsEtape.length > 0
                && questionsEtape.every(question => bilanEtape.resultats?.[question.id] === true);
            const etaitDejaValideeSansJoker = bilanEtape.termineeSansJoker === true;
            bilanEtape.termineeSansJoker = etaitDejaValideeSansJoker || toutesReussiesEnAutonomie;
            bilanEtape.jokersUtilises = !bilanEtape.termineeSansJoker;
            const evaluationDeverrouillee = obtenirEtapesProgramme(etat.theme).every(etapeProgramme =>
                obtenirBilanEtape(etat.theme, etapeProgramme.id)?.termineeSansJoker === true
            );
            if (toutesReussiesEnAutonomie && !etaitDejaValideeSansJoker) {
                celebration = obtenirCelebrationEtape(
                    etat.etape,
                    false,
                    evaluationDeverrouillee
                );
            }
        }
    }
    if (etat.mode === 'evaluation-finale') {
        const seuil = obtenirSeuilMaitrise();
        sauvegarde.evaluationFinale = sauvegarde.evaluationFinale || {
            meilleurScore: 0,
            nombreTentatives: 0,
            reussie: false
        };
        sauvegarde.evaluationFinale.meilleurScore = Math.max(
            sauvegarde.evaluationFinale.meilleurScore || 0,
            pourcentage
        );
        sauvegarde.evaluationFinale.nombreTentatives =
            (sauvegarde.evaluationFinale.nombreTentatives || 0) + 1;
        evaluationFinaleReussie = pourcentage >= seuil && nombreQuestionsPassees === 0;
        sauvegarde.evaluationFinale.reussie = Boolean(sauvegarde.evaluationFinale.reussie)
            || evaluationFinaleReussie;
    }
    return { evaluationFinaleReussie, celebration };
}
function construireBilanEvaluationFinale(pourcentage, evaluationFinaleReussie) {
    if (evaluationFinaleReussie) {
        return {
            titre: 'Évaluation terminée',
            messageResultat: `Résultat : ${pourcentage} %. Les connaissances du parcours sont validées.`,
            celebration: {
                titre: 'Voyage accompli !',
                message: 'Tu as parcouru les onze étapes et réussi l’évaluation finale. Ton carnet est complet : tu es désormais Éclaireur de la PJJ.',
                confetti: true,
                finale: true
            }
        };
    }
    jouerSonErreur();
    return {
        titre: 'Évaluation terminée',
        messageResultat: `Résultat : ${pourcentage} %. Le seuil attendu est de ${obtenirSeuilMaitrise()} %.`,
        celebration: null
    };
}
function construireBilanSessionOrdinaire({
    pourcentage,
    nombreQuestionsPassees,
    nombreReponsesAidees,
    jokerUtilise,
    celebration
}) {
    const titre = jokerUtilise
        ? 'Session terminée avec jokers'
        : 'Session terminée sans joker';
    const autonomes = `${etat.score} réussite${etat.score === 1 ? '' : 's'} autonome${etat.score === 1 ? '' : 's'}`;
    const reussitesAidees = `${nombreReponsesAidees} réussite${nombreReponsesAidees === 1 ? '' : 's'} avec aide`;
    let messageResultat;
    if (nombreQuestionsPassees > 0) {
        const activitesPassees = `${nombreQuestionsPassees} activité${nombreQuestionsPassees === 1 ? '' : 's'} passée${nombreQuestionsPassees === 1 ? '' : 's'}`;
        messageResultat = `${autonomes}, ${reussitesAidees} et ${activitesPassees}. Les activités à reprendre sont détaillées ci-dessous.`;
        jouerSonReussite();
    }
    else if (etat.mode === 'parcours') {
        const conclusion = jokerUtilise
            ? 'Les réponses aidées rejoignent la révision.'
            : 'L’étape a été réalisée sans utiliser de joker.';
        messageResultat = `${autonomes} et ${reussitesAidees}. ${conclusion}`;
        if (!celebration?.confetti)
            jouerSonReussite();
    }
    else if (pourcentage >= 80) {
        messageResultat = `${autonomes} et ${reussitesAidees}. Les erreurs restent disponibles dans la révision.`;
        jouerSonReussite();
    }
    else {
        messageResultat = `${autonomes} et ${reussitesAidees}. Reprends les réponses attendues ci-dessous, puis rejoue les activités concernées.`;
        jouerSonErreur();
    }
    return { titre, messageResultat, celebration };
}
function configurerBoutonContinuerBilan() {
    const boutonContinuer = selectionner('#boutonContinuer');
    if (etat.mode === 'evaluation-finale')
        boutonContinuer.textContent = 'Refaire l’évaluation';
    else if (etat.mode === 'parcours') {
        const etapeCourante = Number(etat.etape);
        if (etapeNecessiteAutreChapitre(etat.theme, etat.etape))
            boutonContinuer.textContent = 'Continuer l’étape →';
        else if (etapeCourante < 11)
            boutonContinuer.textContent = `Passer à l’étape ${etapeCourante + 1} →`;
        else
            boutonContinuer.textContent = 'Retour au parcours →';
    }
    else
        boutonContinuer.textContent = 'Retour à l’accueil';
    boutonContinuer.onclick = () => {
        if (etat.mode === 'evaluation-finale') {
            lancerEvaluationFinale();
            return;
        }
        if (etat.mode === 'parcours') {
            if (etapeNecessiteAutreChapitre(etat.theme, etat.etape)) {
                lancerEtape(etat.theme, etat.etape);
                return;
            }
            const etapeCourante = Number(etat.etape);
            if (etapeCourante < 11) {
                lancerTransitionVersEtape(etat.theme, etapeCourante + 1);
                return;
            }
            ouvrirParcours('commun', { remplacerHistorique: true });
            return;
        }
        afficherEcran('accueil');
    };
}
function lancerTransitionVersEtape(identifiantTheme, numeroEtape) {
    clearTimeout(minuteurTransitionParcours);
    ouvrirParcours(identifiantTheme, { remplacerHistorique: true });
    const ecranParcours = selectionner('#parcours');
    const carteDestination = ecranParcours?.querySelector(`[data-etape="${numeroEtape}"]`);
    ecranParcours?.classList.add('transition-vers-etape');
    carteDestination?.classList.add('destination-en-vue');
    carteDestination?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    minuteurTransitionParcours = setTimeout(() => {
        ecranParcours?.classList.remove('transition-vers-etape');
        carteDestination?.classList.remove('destination-en-vue');
        lancerEtape(identifiantTheme, numeroEtape);
    }, 900);
}
function actualiserProchaineDestinationBilan() {
    const destination = selectionner('#prochaineDestinationBilan');
    if (!destination)
        return;
    if (etat.mode === 'evaluation-finale') {
        destination.textContent = 'Ton carnet est complet. Tu peux refaire l’évaluation ou revoir le parcours.';
        return;
    }
    if (etat.mode === 'parcours') {
        if (etapeNecessiteAutreChapitre(etat.theme, etat.etape)) {
            destination.textContent = `Poursuis l’étape ${etat.etape} pour découvrir les questions restantes.`;
            return;
        }
        if (Number(etat.etape) < 11) {
            const prochaineEtape = obtenirEtapeProgramme(etat.theme, Number(etat.etape) + 1);
            destination.textContent = `Étape ${prochaineEtape.id} · ${prochaineEtape.titre}`;
            return;
        }
        destination.textContent = 'Retourne au carnet pour vérifier l’ouverture de l’évaluation finale.';
        return;
    }
    if (etat.mode === 'revision') {
        destination.textContent = 'Continue la révision pour consolider les activités encore fragiles.';
        return;
    }
    destination.textContent = 'Choisis une nouvelle session ou rejoins le parcours guidé.';
}
function ouvrirSouvenirDepuisCarteFinale(numeroEtape) {
    ouvrirParcours('commun', { remplacerHistorique: true });
    requestAnimationFrame(() => {
        const souvenir = selectionner(`#souvenirsParcours [data-etape="${numeroEtape}"]`);
        if (!souvenir)
            return;
        souvenir.open = true;
        souvenir.scrollIntoView({ behavior: 'smooth', block: 'center' });
        souvenir.querySelector('summary')?.focus({ preventScroll: true });
    });
}
function afficherCarteVoyageFinale() {
    const carte = selectionner('#carteVoyageFinale');
    const destinations = selectionner('#destinationsVoyageFinal');
    const doitAfficher = etat.mode === 'evaluation-finale'
        && sauvegarde.evaluationFinale?.reussie === true;
    if (!carte || !destinations)
        return;
    carte.classList.toggle('masque', !doitAfficher);
    destinations.innerHTML = '';
    if (!doitAfficher)
        return;
    PROGRAMMES.commun.etapes.forEach(etapeProgramme => {
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'carte-voyage-etape';
        bouton.style.setProperty('--couleur-etape', etapeProgramme.couleur || '#ffc83d');
        bouton.innerHTML = `${obtenirBaliseIconeEtape(etapeProgramme.id)}<span>${etapeProgramme.id}</span>`;
        bouton.setAttribute('aria-label', `Ouvrir les souvenirs de l’étape ${etapeProgramme.id} · ${etapeProgramme.titre}`);
        bouton.onclick = () => ouvrirSouvenirDepuisCarteFinale(etapeProgramme.id);
        destinations.appendChild(bouton);
    });
    const finale = document.createElement('span');
    finale.className = 'carte-voyage-etape carte-voyage-evaluation';
    finale.innerHTML = '<span aria-hidden="true">★</span><strong>12</strong>';
    finale.setAttribute('role', 'img');
    finale.setAttribute('aria-label', 'Évaluation finale réussie');
    destinations.appendChild(finale);
}
function lancerCelebrationBilan(celebration) {
    if (!celebration)
        return;
    setTimeout(() => {
        const coucheCelebration = afficherCelebration(celebration);
        if (!celebration.confetti)
            return;
        requestAnimationFrame(() => {
            lancerConfettis(
                celebration.finale ? 3 : 1,
                coucheCelebration || document.body
            );
            if (celebration.finale)
                jouerSonEvaluationFinale();
            else
                jouerSonEtapeSansJoker();
        });
    }, 180);
}
function terminerSession() {
    clearInterval(etat.identifiantMinuteur);
    const total = etat.questionsSession.length;
    const nombreQuestionsPassees = etat.questionsPassees?.size || 0;
    const pourcentage = total ? Math.round(etat.score / total * 100) : 0;
    const gain = etat.score * 4 + etat.meilleureSerie * 2;
    const nombreReponsesAidees = etat.nombreReponsesAidees || 0;
    const jokerUtilise = sessionAUtiliseJoker();
    sauvegarde.xp = (sauvegarde.xp || 0) + gain;
    const progression = mettreAJourProgressionFinSession(
        pourcentage,
        nombreQuestionsPassees,
        jokerUtilise
    );
    const bilan = etat.mode === 'evaluation-finale'
        ? construireBilanEvaluationFinale(pourcentage, progression.evaluationFinaleReussie)
        : construireBilanSessionOrdinaire({
            pourcentage,
            nombreQuestionsPassees,
            nombreReponsesAidees,
            jokerUtilise,
            celebration: progression.celebration
        });
    envoyerEvenementPJJ('session_terminee', {
        ...obtenirContexteSessionAnalytics(),
        pjjoue_score: pourcentage,
        pjjoue_reussites_autonomes: etat.score,
        pjjoue_questions_passees: nombreQuestionsPassees,
        pjjoue_reussites_avec_aide: nombreReponsesAidees,
        pjjoue_joker_utilise_session: jokerUtilise ? 'Oui' : 'Non',
        pjjoue_duree_session_secondes: obtenirDureeSessionAnalytics(),
        pjjoue_resultat_session: etat.mode === 'evaluation-finale'
            ? (progression.evaluationFinaleReussie ? 'Évaluation réussie' : 'Évaluation terminée')
            : 'Session terminée'
    });
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent = pourcentage + '%';
    selectionner('#bonnesReponsesBilan').textContent = etat.score + '/' + total;
    selectionner('#meilleureSerieBilan').textContent = etat.meilleureSerie;
    selectionner('#gainExperienceBilan').textContent = '+' + gain;
    selectionner('#contexteBilan').textContent = obtenirContexteFinSession();
    selectionner('#titreBilan').textContent = bilan.titre;
    selectionner('#rangBilan').textContent = bilan.messageResultat;
    const questionsAReprendre = etat.questionsSession.filter(question =>
        etat.erreursSession.has(question.id)
    );
    afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees);
    configurerBoutonContinuerBilan();
    actualiserProchaineDestinationBilan();
    afficherCarteVoyageFinale();
    effacerSessionEnCours();
    afficherEcran('bilan', { remplacerHistorique: true });
    actualiserAccueil();
    lancerCelebrationBilan(bilan.celebration);
}
function afficherEtatVideErreurs(zone, aucunePartieJouee) {
    if (aucunePartieJouee) {
        zone.innerHTML = `
            <div class="carte vide">
                <div class="vide-icone" aria-hidden="true">
                    <svg viewBox="0 0 48 48">
                        <path d="M10 14h18a10 10 0 0 1 10 10v10"/>
                        <path d="m32 28 6 6 6-6"/>
                        <path d="M31 38H20A10 10 0 0 1 10 28v-4"/>
                        <circle cx="10" cy="12" r="4"/>
                        <path d="M18 12h7"/>
                    </svg>
                </div>
                <h2>Tu n’as pas encore joué.</h2>
                <p>Commence une partie avant de pouvoir rejouer tes erreurs.</p>
                <button class="principal" data-action="ouvrir-parcours-depuis-erreurs">
                    Commencer le parcours
                </button>
            </div>`;
        return;
    }
    zone.innerHTML = `
        <div class="carte vide">
            <div class="resultat-icone" aria-hidden="true"></div>
            <h2>Aucune erreur active</h2>
            <p>Pour le moment, tout ce que tu as raté a été retravaillé avec succès.</p>
        </div>`;
}

function obtenirQuestionsAvecErreursActives() {
    return Object.entries(sauvegarde.erreurs || {})
        .filter(([_identifiantQuestion, suiviErreur]) => !suiviErreur.maitrisee)
        .map(([identifiantQuestion, suiviErreur]) => ({
            question: QUESTIONS.find(question => question.id === Number(identifiantQuestion)),
            suiviErreur
        }))
        .filter(element => element.question);
}

function regrouperErreursParEtape(questionsAvecErreurs) {
    const erreursParEtape = {};
    questionsAvecErreurs.forEach(element => {
        const numeroEtape = Number(element.question.etape);
        (erreursParEtape[numeroEtape] = erreursParEtape[numeroEtape] || []).push(element);
    });
    return erreursParEtape;
}

function obtenirNumerosEtapesAvecErreurs(erreursParEtape) {
    return Object.keys(erreursParEtape)
        .sort((etapeA, etapeB) => Number(etapeA) - Number(etapeB));
}

function construireBoutonsRevisionParEtape(erreursParEtape) {
    return obtenirNumerosEtapesAvecErreurs(erreursParEtape)
        .map(numeroEtape => `
            <button class="revision-etape-bouton"
                data-action="reviser-etape" data-etape="${numeroEtape}">
                <span>Étape ${numeroEtape}</span>
                <b>${erreursParEtape[numeroEtape].length}</b>
            </button>`)
        .join('');
}

function construireModesRevisionErreurs(total, erreursParEtape) {
    const libelleErreurs = accorderLibelle(total, 'erreur active', 'erreurs actives');
    const boutonsEtapes = construireBoutonsRevisionParEtape(erreursParEtape);
    return `
        <div class="revision-mode-grille">
            <div class="carte revision-mode-carte revision-toutes-carte">
                <div>
                    <h2>
                        <span class="revision-mode-icone revision-mode-icone-aleatoire"
                            aria-hidden="true">
                            <svg viewBox="0 0 64 64">
                                <path d="M48 20a21 21 0 1 0 4 25"/>
                                <path d="m43 13 6 8 9-5"/>
                                <path d="M25 27a7 7 0 0 1 14 1c0 6-7 6-7 11"/>
                                <circle cx="32" cy="47" r="1.5"/>
                            </svg>
                        </span>
                        <span>Révision aléatoire — Toutes mes erreurs</span>
                    </h2>
                    <p>Mélange tes ${total} ${libelleErreurs}, toutes étapes confondues.</p>
                </div>
                <button class="principal" data-action="reviser-toutes-erreurs">
                    Lancer (${total})
                </button>
            </div>

            <div class="carte revision-mode-carte revision-par-etape-carte">
                <div>
                    <h2>
                        <span class="revision-mode-icone revision-mode-icone-etapes"
                            aria-hidden="true">
                            <svg viewBox="0 0 64 64">
                                <path d="M13 11h34a5 5 0 0 1 5 5v37H18a5 5 0 0 1-5-5z"/>
                                <path d="M18 53a5 5 0 0 1 0-10h34M23 11v32"/>
                                <path d="M32 21h12M32 29h9"/>
                            </svg>
                        </span>
                        <span>Révision par étape — Mes erreurs par étape</span>
                    </h2>
                    <p>Choisis une étape pour retravailler uniquement les erreurs encore actives de cette partie du parcours.</p>
                </div>
                <div class="revision-etape-boutons">${boutonsEtapes}</div>
            </div>
        </div>`;
}

function construireListeErreursEtape(numeroEtape, elements) {
    const cartesErreurs = elements.map(({ question, suiviErreur }) => `
        <div class="erreur-element erreurs-parcours-element">
            <div class="erreurs-parcours-enonce">${question.enonce.split('\\n')[0]}</div>
            <div class="mini">Ratée ${suiviErreur.nombreErreurs || 1} fois · révision ${suiviErreur.reussites || 0}/2</div>
        </div>`).join('');
    return `
        <section class="erreurs-parcours-etape">
            <div class="erreurs-parcours-etape-entete">
                <h4>Étape ${numeroEtape}</h4>
                <span>${elements.length} erreur${elements.length > 1 ? 's' : ''}</span>
            </div>
            <div class="erreurs-parcours-liste">${cartesErreurs}</div>
        </section>`;
}

function construireParcoursErreurs(total, erreursParEtape) {
    const sectionsEtapes = obtenirNumerosEtapesAvecErreurs(erreursParEtape)
        .map(numeroEtape => construireListeErreursEtape(
            numeroEtape,
            erreursParEtape[numeroEtape]
        ))
        .join('');
    const libelleErreurs = accorderLibelle(total, 'erreur active', 'erreurs actives');
    return `
        <div class="carte erreurs-parcours">
            <div class="erreurs-parcours-entete">
                <div>
                    <h2>Parcours PJJ</h2>
                    <p>${total} ${libelleErreurs} dans le parcours.</p>
                </div>
            </div>
            <h3 class="erreurs-parcours-titre">Visualiser mes erreurs</h3>
            <div class="erreurs-parcours-etapes">${sectionsEtapes}</div>
        </div>`;
}

function afficherErreurs() {
    const zone = selectionner('#contenuErreurs');
    const questionsAvecErreurs = obtenirQuestionsAvecErreursActives();
    if (questionsAvecErreurs.length === 0) {
        afficherEtatVideErreurs(zone, !sauvegarde.aDejaJoue);
        return;
    }

    const erreursParEtape = regrouperErreursParEtape(questionsAvecErreurs);
    const total = questionsAvecErreurs.length;
    zone.innerHTML = construireModesRevisionErreurs(total, erreursParEtape)
        + construireParcoursErreurs(total, erreursParEtape);
}

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

function construireLienSource(source) {
    if (!source.url)
        return source.titre;
    return `<a href="${source.url}" target="_blank" rel="noopener">${source.titre}</a>`;
}

function construireFicheSource(source) {
    const element = document.createElement('article');
    const repere = source.repere || 'Information présentée par la source';
    const dateVerification = source.dateVerification || 'Non renseignée';
    element.className = 'source';
    element.innerHTML = `
        <h3>${construireLienSource(source)}</h3>
        <dl>
            <div><dt>Repère précis</dt><dd>${repere}</dd></div>
            <div><dt>Date de vérification</dt><dd>${dateVerification}</dd></div>
            <div><dt>Statut</dt><dd>${source.statutSource}</dd></div>
            <div><dt>Traitement pédagogique</dt><dd>${source.traitementEditorial}</dd></div>
        </dl>`;
    return element;
}

function afficherSources() {
    const zone = selectionner('#listeSources');
    zone.innerHTML = '';
    Object.values(SOURCES).forEach(source => zone.appendChild(construireFicheSource(source)));
}
// -----------------------------------------------------------------------------
// Paramètres, import/export, sons et effets de célébration
// -----------------------------------------------------------------------------
function appliquerDisponibiliteVolumeSon() {
    const volume = selectionner('#volumeSon');
    const parametreVolume = volume?.closest('.parametre-volume');
    if (!volume)
        return;
    const sonActif = sauvegarde.parametres.son !== false;
    volume.disabled = !sonActif;
    volume.setAttribute('aria-disabled', String(!sonActif));
    parametreVolume?.classList.toggle('parametre-desactive', !sonActif);
}
function chargerParametres() {
    const parametres = sauvegarde.parametres;
    selectionner('#sonActif').value = String(parametres.son !== false);
    selectionner('#volumeSon').value = parametres.volume;
    selectionner('#echelleTexte').value = String(parametres.echelleTexte || 1);
    document.documentElement.style.setProperty('--echelle-texte', String(parametres.echelleTexte || 1));
    appliquerDisponibiliteVolumeSon();
    requestAnimationFrame(mesurerHauteurEntete);
    actualiserGroupesChoix();
}
function enregistrerParametres() {
    const sonEtaitActif = sauvegarde.parametres.son !== false;
    sauvegarde.parametres = {
        son: selectionner('#sonActif').value === 'true',
        volume: Number(selectionner('#volumeSon').value),
        echelleTexte: Number(selectionner('#echelleTexte').value)
    };
    enregistrerSauvegarde();
    chargerParametres();
    envoyerEvenementPJJ('parametres_enregistres', {
        pjjoue_page_consultee: 'Paramètres',
        pjjoue_son: sauvegarde.parametres.son ? 'Activé' : 'Désactivé',
        pjjoue_taille_texte: obtenirLibelleTailleTexteAnalytics(sauvegarde.parametres.echelleTexte)
    });
    if (!sonEtaitActif && sauvegarde.parametres.son) {
        initialiserAudio();
        jouerSonReussite();
    }
}
function exporterProgression() {
    const contenuFichier = new Blob([JSON.stringify(sauvegarde, null, 2)], { type: 'application/json' });
    const lienTelechargement = document.createElement('a');
    lienTelechargement.href = URL.createObjectURL(contenuFichier);
    lienTelechargement.download = 'PJJoue_progression.json';
    lienTelechargement.click();
    URL.revokeObjectURL(lienTelechargement.href);
    envoyerEvenementPJJ('progression_exportee', {
        pjjoue_page_consultee: 'Progression'
    });
}
function importerProgression(fichier) {
    if (!fichier)
        return;
    if (fichier.size > 5 * 1024 * 1024) {
        ouvrirFenetreMessage({ titre: 'Import impossible', message: 'Le fichier dépasse la limite autorisée de 5 Mo.', libelleConfirmer: 'Fermer' });
        return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
        try {
            const importee = JSON.parse(lecteur.result);
            if (!estObjetSimple(importee))
                throw Error('le contenu n’est pas un objet de sauvegarde');
            if (importee.progression != null && !estObjetSimple(importee.progression))
                throw Error('la progression est mal structurée');
            if (importee.erreurs != null && !estObjetSimple(importee.erreurs))
                throw Error('la banque de révision est mal structurée');
            sauvegarde = nettoyerSauvegarde(importee);
            effacerSauvegardeV1DuNavigateur();
            enregistrerSauvegarde();
            actualiserAccueil();
            envoyerEvenementPJJ('progression_importee', {
                pjjoue_page_consultee: 'Progression'
            });
            afficherNotification('Progression importée et vérifiée');
        }
        catch (erreur) {
            ouvrirFenetreMessage({ titre: 'Import impossible', message: erreur.message, libelleConfirmer: 'Fermer' });
        }
    };
    lecteur.onerror = () => ouvrirFenetreMessage({ titre: 'Import impossible', message: 'Le fichier n’a pas pu être lu.', libelleConfirmer: 'Fermer' });
    lecteur.readAsText(fichier);
}
let contexteAudio = null;
function initialiserAudio() {
    if (!contexteAudio)
        contexteAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (contexteAudio.state === 'suspended')
        contexteAudio.resume();
}
function jouerTonalite(frequence, demarrage, duree, formeOnde = 'sine', intensite = 1) {
    if (!sauvegarde.parametres.son)
        return;
    initialiserAudio();
    const oscillateur = contexteAudio.createOscillator();
    const amplificateur = contexteAudio.createGain();
    oscillateur.type = formeOnde;
    oscillateur.frequency.setValueAtTime(frequence, contexteAudio.currentTime + demarrage);
    const volume = Number(sauvegarde.parametres.volume || .65) * .18 * intensite;
    amplificateur.gain.setValueAtTime(.001, contexteAudio.currentTime + demarrage);
    amplificateur.gain.exponentialRampToValueAtTime(Math.max(.002, volume), contexteAudio.currentTime + demarrage + .025);
    amplificateur.gain.exponentialRampToValueAtTime(.001, contexteAudio.currentTime + demarrage + duree);
    oscillateur.connect(amplificateur).connect(contexteAudio.destination);
    oscillateur.start(contexteAudio.currentTime + demarrage);
    oscillateur.stop(contexteAudio.currentTime + demarrage + duree + .05);
}
function jouerSonReussite() {
    jouerTonalite(523, 0, .18, 'triangle', .9);
    jouerTonalite(659, .11, .22, 'triangle', 1);
    jouerTonalite(784, .25, .26, 'triangle', 1);
    jouerTonalite(1047, .4, .38, 'sine', .85);
}
function jouerSonErreur() {
    jouerTonalite(196, 0, .25, 'sawtooth', .65);
    jouerTonalite(155, .18, .3, 'sawtooth', .65);
    jouerTonalite(110, .41, .45, 'square', .45);
}
function jouerSonEtapeSansJoker() {
    if (!sauvegarde.parametres.son)
        return;
    const melodie = [523, 659, 784, 1047, 988, 1047, 1175, 1319];
    const demarrages = [0, .18, .36, .58, .82, 1.02, 1.22, 1.48];
    const durees = [.24, .24, .28, .34, .22, .25, .28, .58];
    melodie.forEach((frequence, indice) => jouerTonalite(frequence, demarrages[indice], durees[indice], indice < 4 ? 'triangle' : 'sine', indice === 7 ? .72 : .54));
    [[261.6, 329.6, 392], [349.2, 440, 523.3], [392, 493.9, 587.3], [523.3, 659.3, 784]].forEach((accord, indiceAccord) => {
        const demarrage = [0, .58, 1.02, 1.48][indiceAccord];
        accord.forEach((frequence, indiceNote) => jouerTonalite(frequence, demarrage, indiceAccord === 3 ? .72 : .38, indiceNote === 0 ? 'triangle' : 'sine', indiceNote === 0 ? .28 : .18));
    });
    [1319, 1568, 2093].forEach((frequence, indice) => jouerTonalite(frequence, 1.78 + indice * .12, .28, 'sine', .28));
}
function jouerSonEvaluationFinale() {
    if (!sauvegarde.parametres.son)
        return;
    const fanfare = [523, 523, 659, 784, 659, 784, 1047, 988, 1047, 1319, 1568, 2093];
    const demarrages = [0, .16, .32, .49, .72, .88, 1.05, 1.34, 1.50, 1.72, 2.02, 2.34];
    const durees = [.20, .20, .22, .36, .20, .22, .38, .20, .24, .42, .48, .82];
    fanfare.forEach((frequence, indice) => jouerTonalite(frequence, demarrages[indice], durees[indice], indice < 9 ? 'triangle' : 'sine', indice >= 9 ? .58 : .46));
    const accords = [
        { demarrage: 0, frequences: [261.6, 329.6, 392] },
        { demarrage: .49, frequences: [349.2, 440, 523.3] },
        { demarrage: 1.05, frequences: [392, 493.9, 587.3] },
        { demarrage: 1.50, frequences: [523.3, 659.3, 784] },
        { demarrage: 2.02, frequences: [392, 523.3, 659.3, 784] },
        { demarrage: 2.34, frequences: [523.3, 659.3, 784, 1047] }
    ];
    accords.forEach(({ demarrage, frequences }, indiceAccord) => {
        frequences.forEach((frequence, indiceNote) => {
            jouerTonalite(
                frequence,
                demarrage,
                indiceAccord >= 4 ? .86 : .42,
                indiceNote === 0 ? 'triangle' : 'sine',
                indiceNote === 0 ? .25 : .15
            );
        });
    });
    [130.8, 196, 261.6, 196, 261.6, 392].forEach((frequence, indice) => jouerTonalite(frequence, [0, .49, 1.05, 1.50, 2.02, 2.34][indice], .32, 'square', .11));
    [2093, 2349, 2637, 3136].forEach((frequence, indice) => jouerTonalite(frequence, 2.62 + indice * .14, .36, 'sine', .24));
}
function lancerConfettis(intensite = 1, cible = document.body) {
    const intensiteEffective = Math.max(1, Math.min(4, Number(intensite) || 1));
    const nombreConfettis = Math.round(70 * intensiteEffective);
    const conteneur = cible || document.body;
    const couleurs = ['#ffd166', '#3ddc97', '#ffffff', '#ff5b78', '#9b6cff', '#35d6ff'];
    for (let indiceConfetti = 0; indiceConfetti < nombreConfettis; indiceConfetti++) {
        const confetti = document.createElement('i');
        confetti.setAttribute('aria-hidden', 'true');
        Object.assign(confetti.style, {
            position: 'fixed',
            left: (Math.random() * 100) + 'vw',
            top: '-28px',
            width: (7 + Math.random() * 7) + 'px',
            height: (10 + Math.random() * 12) + 'px',
            borderRadius: Math.random() > .55 ? '50%' : '2px',
            background: couleurs[indiceConfetti % couleurs.length],
            pointerEvents: 'none',
            zIndex: '2147483647',
            opacity: '1',
            transform: `translate3d(0,0,0) rotate(${Math.random() * 180}deg)`
        });
        conteneur.appendChild(confetti);
        const deplacementHorizontal = Math.random() * (280 + intensiteEffective * 70) - (140 + intensiteEffective * 35);
        const deplacementVertical = window.innerHeight + 80 + Math.random() * 180;
        const nombreTours = (2 + Math.random() * 5) * (Math.random() > .5 ? 1 : -1);
        const duree = 1500 + Math.random() * 900 + intensiteEffective * 120;
        const delai = Math.random() * 300;
        const animation = confetti.animate([
            { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate3d(${deplacementHorizontal * .35}px,${deplacementVertical * .45}px,0) rotate(${nombreTours * 180}deg)`, opacity: 1, offset: .48 },
            { transform: `translate3d(${deplacementHorizontal}px,${deplacementVertical}px,0) rotate(${nombreTours * 360}deg)`, opacity: .92 }
        ], { duration: duree, delay: delai, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' });
        animation.onfinish = () => confetti.remove();
    }
}
// -----------------------------------------------------------------------------
// Branchement des commandes de l’interface
// -----------------------------------------------------------------------------
selectionnerTous('[data-ecran]').forEach(bouton => bouton.onclick = () => {
    if (etat.ecran === 'parametres')
        enregistrerParametres();
    if (bouton.dataset.ecran === 'parcours') {
        ouvrirParcours('commun');
        return;
    }
    afficherEcran(bouton.dataset.ecran);
});
const boutonLancerLeDe = selectionner('#boutonLancerLeDe');
if (boutonLancerLeDe)
    boutonLancerLeDe.onclick = lancerDeParcours;
const boutonJouerLeTirage = selectionner('#boutonJouerLeTirage');
if (boutonJouerLeTirage)
    boutonJouerLeTirage.onclick = jouerTirageDeParcours;
selectionner('#boutonQuestionSuivante').onclick = afficherQuestionSuivante;
selectionner('#boutonQuestionPrecedente').onclick = afficherQuestionPrecedente;
selectionner('#boutonPasser').onclick = demanderPassageQuestion;
selectionner('#boutonReinitialiserValidationsSansJoker')?.addEventListener('click', demanderReinitialisationSansJoker);
function initialiserFenetreJokers() {
    const declencheur = selectionner('#boutonJokers');
    const fenetre = selectionner('#fenetreJokers');
    const boutonFermer = selectionner('#fermerFenetreJokers');
    const boutonCinquanteCinquante = selectionner('#boutonJoker5050');
    const boutonIndice = selectionner('#boutonJokerIndice');
    const boutonLangueAuChat = selectionner('#boutonJokerLangueAuChat');
    if (!declencheur || !fenetre || !boutonFermer || !boutonCinquanteCinquante || !boutonIndice || !boutonLangueAuChat) {
        console.warn('PJJoue : interface des jokers incomplète ; le reste du site reste disponible.');
        return;
    }
    declencheur.onclick = ouvrirFenetreJokers;
    boutonFermer.onclick = () => fermerFenetreJokers();
    fenetre.oncancel = evenement => { evenement.preventDefault(); fermerFenetreJokers(); };
    fenetre.addEventListener('close', () => declencheur.setAttribute('aria-expanded', 'false'));
    boutonCinquanteCinquante.onclick = () => { fermerFenetreJokers({ restaurerFocus: false }); utiliserJoker5050(); actualiserBoutonJokers(); };
    boutonIndice.onclick = () => { fermerFenetreJokers({ restaurerFocus: false }); utiliserIndice('indice'); actualiserBoutonJokers(); };
    boutonLangueAuChat.onclick = () => { fermerFenetreJokers({ restaurerFocus: false }); utiliserLangueAuChat(); actualiserBoutonJokers(); };
}
initialiserFenetreJokers();
selectionner('#boutonRetour').onclick = revenirEnArriere;
selectionner('#boutonRejouerMesErreurs').onclick = () => afficherEcran('erreurs');
selectionner('#boutonRevenirAuParcours').onclick = () => ouvrirParcours('commun', { remplacerHistorique: true });
selectionner('#boutonOuvrirParcours').onclick = () => ouvrirParcours('commun');
selectionner('#boutonExporterMaProgression').onclick = exporterProgression;
selectionner('#fichierImporterProgression').onchange = evenement => evenement.target.files[0] && importerProgression(evenement.target.files[0]);
selectionner('#boutonReinitialiserTouteLaProgression').onclick = () => ouvrirFenetreMessage({
    titre: 'Réinitialiser toute la progression ?',
    message: 'Les scores, les étapes validées et les erreurs enregistrées seront définitivement supprimés de ce navigateur.',
    libelleConfirmer: 'Réinitialiser',
    libelleAnnuler: 'Annuler',
    afficherAnnuler: true,
    variante: 'danger',
    apresConfirmation: () => {
        envoyerEvenementPJJ('progression_reinitialisee', {
            pjjoue_page_consultee: 'Progression'
        });
        sauvegarde = creerSauvegardeInitiale();
        effacerSauvegardeV1DuNavigateur();
        effacerSessionEnCours();
        enregistrerSauvegarde();
        actualiserAccueil();
        requestAnimationFrame(() => ouvrirFenetreMessage({
            titre: 'Progression réinitialisée',
            message: 'Ta progression a bien été supprimée sur ce navigateur. Tu peux maintenant repartir de zéro.',
            libelleConfirmer: 'Compris',
            variante: 'reussite'
        }));
    }
});
function validerQuestionAvecEntree(evenement) {
    if (evenement.key !== 'Enter' || evenement.repeat || evenement.isComposing || etat.ecran !== 'question' || etat.questionValidee)
        return false;
    const cibleClavier = evenement.target;
    const commandeDistincte = cibleClavier?.closest?.('button:not(#boutonValider), a, select, textarea, [contenteditable="true"]');
    if (commandeDistincte)
        return false;
    const boutonValider = selectionner('#boutonValider');
    if (!boutonValider || boutonValider.disabled || boutonValider.classList.contains('masque'))
        return false;
    evenement.preventDefault();
    boutonValider.click();
    return true;
}
document.addEventListener('keydown', evenement => {
    if (etat.ecran !== 'question')
        return;
    if (validerQuestionAvecEntree(evenement))
        return;
    const cibleClavier = evenement.target;
    const saisieEnCours = cibleClavier && (cibleClavier.matches?.('input, textarea, select') || cibleClavier.isContentEditable);
    if (saisieEnCours)
        return;
    if (!etat.questionValidee) {
        const nombre = Number(evenement.key);
        if (nombre >= 1 && nombre <= 4)
            document.querySelector(`.reponse[data-indice-reponse="${nombre - 1}"]`)?.click();
        if (evenement.key.toLocaleLowerCase('fr-FR') === 'p' && !selectionner('#boutonPasser').classList.contains('masque'))
            selectionner('#boutonPasser').click();
    }
    if (evenement.key === 'ArrowLeft') {
        evenement.preventDefault();
        afficherQuestionPrecedente();
        return;
    }
    if (evenement.key === 'ArrowRight' && !selectionner('#boutonQuestionSuivante').classList.contains('masque')) {
        evenement.preventDefault();
        afficherQuestionSuivante();
    }
});
document.addEventListener('click', evenement => {
    const cible = evenement.target.closest('[data-action]');
    if (!cible)
        return;
    const action = cible.dataset.action;
    if (action === 'valider-reponse-ecrite')
        validerActiviteEcrite();
    else if (action === 'valider-eliminations')
        validerEliminations();
    else if (action === 'valider-activite')
        validerActiviteInteractive();
    else if (action === 'basculer-elimination')
        basculerElimination(Number(cible.dataset.indice));
    else if (action === 'basculer-selection-multiple')
        basculerChoixMultiple(cible.dataset.proposition);
    else if (action === 'deplacer-ordre')
        deplacerElementOrdre(Number(cible.dataset.indice), Number(cible.dataset.direction));
    else if (action === 'ajouter-choix-ordre')
        ajouterChoixOrdre(cible.dataset.element);
    else if (action === 'retirer-choix-ordre')
        retirerChoixOrdre(Number(cible.dataset.indice));
    else if (action === 'deplacer-choix-ordre')
        deplacerChoixOrdre(Number(cible.dataset.indice), Number(cible.dataset.direction));
    else if (action === 'selectionner-association')
        selectionnerAssociation(cible.dataset.cote, cible.dataset.element);
    else if (action === 'attribuer-categorie')
        attribuerCategorie(cible.dataset.element, cible.dataset.categorie);
    else if (action === 'reviser-toutes-erreurs')
        lancerRevision('toutes');
    else if (action === 'reviser-theme')
        lancerRevision(cible.dataset.theme);
});
mesurerHauteurEntete();
selectionner('#boutonMenuMobile')?.addEventListener('click', basculerMenuMobile);
window.addEventListener('resize', mesurerHauteurEntete, { passive: true });
initialiserGroupesChoix();
actualiserAccueil();
afficherSources();
restaurerRoute(history.state || lireRoute());
garantirAccueilEnHaut();
window.addEventListener('pageshow', garantirAccueilEnHaut);
window.addEventListener('load', garantirAccueilEnHaut);
window.addEventListener('pjjoue:consentement-change', evenement => {
    if (evenement.detail?.analytics !== true)
        return;
    envoyerEvenementPJJ('page_consultee', {
        pjjoue_page_consultee: obtenirLibellePageAnalytics(etat.ecran),
        pjjoue_page_precedente: obtenirLibellePageAnalytics('consentement')
    });
});
window.addEventListener('hashchange', garantirAccueilEnHaut);
function verifierRenduQuestionActif() {
    if (etat.ecran !== 'question' || !etat.questionsSession?.length)
        return;
    const question = etat.questionsSession[etat.indexQuestion];
    const enonce = selectionner('#enonceQuestion');
    const zoneReponses = selectionner('#zoneReponses');
    if (!question)
        return;
    const contenuManquant = !enonce?.textContent?.trim() || !zoneReponses?.children?.length;
    if (!contenuManquant) {
        enregistrerSessionEnCours();
        return;
    }
    const tempsRestant = etat.tempsRestant;
    afficherQuestion({ suivreAnalytics: false, reprendreChronometre: true });
    etat.tempsRestant = tempsRestant;
}
window.addEventListener('resize', () => {
    clearTimeout(window.__pjjoueMinuteurAjustementQuestion);
    window.__pjjoueMinuteurAjustementQuestion = setTimeout(() => {
        verifierRenduQuestionActif();
        ajusterQuestionAEcran();
    }, 80);
});
window.addEventListener('pagehide', enregistrerSessionEnCours);
window.addEventListener('hashchange', () => {
    setTimeout(ajusterQuestionAEcran, 40);
});
document.addEventListener('click', () => {
    setTimeout(ajusterQuestionAEcran, 40);
});
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ajusterQuestionAEcran, 80);
});
document.addEventListener('click', evenement => {
    const boutonRevisionEtape = evenement.target.closest('[data-action="reviser-etape"]');
    if (boutonRevisionEtape) {
        lancerRevisionEtape(boutonRevisionEtape.dataset.etape);
        return;
    }
    const boutonBascule = evenement.target.closest('.entrainement-bascule-groupe .option-bouton');
    if (boutonBascule) {
        const groupe = boutonBascule.closest('.entrainement-bascule-groupe');
        groupe.dataset.selectionEffectuee = 'true';
        groupe.querySelectorAll('.option-bouton').forEach(boutonDuGroupe => boutonDuGroupe.classList.toggle('actif', boutonDuGroupe === boutonBascule));
        if (groupe.dataset.proposition === 'chronometre') {
            const carte = groupe.closest('[data-carte-entrainement]');
            carte?.querySelector('[data-secondes-chronometre]')?.classList.toggle('masque', boutonBascule.dataset.valeur !== 'oui');
        }
        return;
    }
    const boutonSecondes = evenement.target.closest('.entrainement-secondes-groupe .choix-bouton');
    if (boutonSecondes && !boutonSecondes.closest('#secondesChronometreParcours')) {
        const groupe = boutonSecondes.closest('.entrainement-secondes-groupe');
        groupe.dataset.selectionEffectuee = 'true';
        groupe.querySelectorAll('.choix-bouton').forEach(boutonDuGroupe => boutonDuGroupe.classList.toggle('actif', boutonDuGroupe === boutonSecondes));
        return;
    }
    const boutonLancer = evenement.target.closest('.entrainement-lancer');
    if (boutonLancer) {
        const carte = boutonLancer.closest('[data-carte-entrainement]');
        const valeurJokers = carte.querySelector('[data-proposition="jokers"] .option-bouton.actif')?.dataset.valeur || 'oui';
        const valeurMinuteur = carte.querySelector('[data-proposition="chronometre"] .option-bouton.actif')?.dataset.valeur || 'non';
        const secondes = Number(carte.querySelector('.entrainement-secondes-groupe .choix-bouton.actif')?.dataset.secondes) || 15;
        etat.organisationSession = boutonLancer.dataset.organisationSession || 'ordonne';
        etat.jokersSessionActifs = valeurJokers === 'oui';
        etat.chronometreSessionActif = valeurMinuteur === 'oui';
        etat.dureeChronometreSession = Math.min(30, Math.max(5, secondes));
        lancerEntrainementLibre();
        return;
    }
    const choixChronometreParcours = evenement.target.closest('#choixChronometreParcours .option-bouton');
    if (choixChronometreParcours) {
        document.querySelectorAll('#choixChronometreParcours .option-bouton').forEach(boutonDuGroupe => boutonDuGroupe.classList.toggle('actif', boutonDuGroupe === choixChronometreParcours));
        etat.chronometreParcoursActif = choixChronometreParcours.dataset.valeur === 'oui';
        selectionner('#secondesChronometreParcours')?.classList.toggle('masque', !etat.chronometreParcoursActif);
        return;
    }
    const secondesParcours = evenement.target.closest('#secondesChronometreParcours .choix-bouton');
    if (secondesParcours) {
        document.querySelectorAll('#secondesChronometreParcours .choix-bouton').forEach(boutonDuGroupe => {
            const actif = boutonDuGroupe === secondesParcours;
            boutonDuGroupe.classList.toggle('actif', actif);
            boutonDuGroupe.setAttribute('aria-pressed', actif ? 'true' : 'false');
        });
        const secondes = Number(secondesParcours.dataset.secondes);
        etat.dureeChronometreParcours = Math.min(30, Math.max(5, Number.isFinite(secondes) ? secondes : 15));
        return;
    }
});
document.addEventListener('click', evenement => {
    const ouvrirParcoursDepuisErreurs = evenement.target.closest('[data-action="ouvrir-parcours-depuis-erreurs"]');
    if (!ouvrirParcoursDepuisErreurs)
        return;
    evenement.preventDefault();
    ouvrirParcours('commun');
});
