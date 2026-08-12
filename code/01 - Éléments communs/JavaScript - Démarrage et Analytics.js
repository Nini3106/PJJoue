/**
 * Démarrage, outils de base et noms Analytics.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
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
    'Ce piège était crédible. C’est précisément pour ça qu’il faut l’entraîner.',
    'Pas grave : transforme l’erreur en règle de contrôle.',
    'Tu n’as pas raté la PJJ : tu viens de trouver un point à consolider.'
];
const CLE_SAUVEGARDE = 'pjjoue_V1_sauvegarde';
const CLE_SESSION_EN_COURS = 'pjjoue_session_en_cours_v1';
