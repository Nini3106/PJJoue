/**
 * Navigation entre les pages et fenêtres de confirmation.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
// -----------------------------------------------------------------------------
// Navigation, historique et fenêtres de confirmation
// -----------------------------------------------------------------------------
let navigationInterneParFragment = false;
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
function mettreAJourAdresseNavigation(identifiant, remplacer = false) {
    const route = routePourEcran(identifiant);
    // Un fichier ouvert directement dans Chrome n’a pas une origine HTTP classique.
    // On utilise donc uniquement son fragment (#...) et jamais pushState avec une URL file://.
    if (window.location.protocol === 'file:') {
        if (window.location.hash === route)
            return;
        navigationInterneParFragment = true;
        if (remplacer)
            window.location.replace(route);
        else
            window.location.hash = route;
        window.setTimeout(() => { navigationInterneParFragment = false; }, 0);
        return;
    }
    const methode = remplacer ? 'replaceState' : 'pushState';
    history[methode](creerEtatNavigation(identifiant), '', route);
}
function actualiserBoutonRetour() {
    const boutonRetour = selectionner('#boutonRetour');
    if (!boutonRetour)
        return;
    const detailParcoursOuvert = etat.ecran === 'parcours'
        && !selectionner('#vueDetailParcours')?.classList.contains('masque');
    const retourDisponible = etat.ecran !== 'accueil' && !detailParcoursOuvert;
    boutonRetour.classList.toggle('masque', !retourDisponible);
    boutonRetour.disabled = !retourDisponible;
}
function mesurerHauteurEntete() {
    const entete = document.querySelector('header.entete');
    const hauteur = Math.ceil(entete?.getBoundingClientRect().height || 66);
    document.documentElement.style.setProperty('--hauteur-entete', hauteur + 'px');
}
function fermerMenuPrincipal() {
    const entete = document.querySelector('header.entete');
    const bouton = selectionner('#boutonMenuMobile');
    entete?.classList.remove('menu-mobile-ouvert');
    document.documentElement.classList.remove('menu-principal-ouvert');
    bouton?.setAttribute('aria-expanded', 'false');
    bouton?.setAttribute('aria-label', 'Ouvrir le menu principal');
    const libelle = bouton?.querySelector('.bouton-menu-libelle');
    if (libelle)
        libelle.textContent = 'Menu';
}
function basculerMenuPrincipal() {
    const entete = document.querySelector('header.entete');
    const bouton = selectionner('#boutonMenuMobile');
    const navigation = selectionner('#menuPrincipal');
    if (!entete || !bouton || !navigation)
        return;
    const ouvert = entete.classList.toggle('menu-mobile-ouvert');
    document.documentElement.classList.toggle('menu-principal-ouvert', ouvert);
    bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    bouton.setAttribute('aria-label', ouvert ? 'Fermer le menu principal' : 'Ouvrir le menu principal');
    const libelle = bouton.querySelector('.bouton-menu-libelle');
    if (libelle)
        libelle.textContent = ouvert ? 'Fermer' : 'Menu';
    mesurerHauteurEntete();
    if (ouvert)
        requestAnimationFrame(() => navigation.querySelector('button:not(:disabled), a[href]')?.focus());
}
function actualiserNavigation(identifiant) {
    selectionnerTous('.navigation [data-ecran]').forEach(bouton => {
        const actif = bouton.dataset.ecran === identifiant;
        bouton.classList.toggle('actif', actif);
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
        densite = Math.max(.82, densite * .97);
        // Les questions normales restent à taille pleine.
        if (densite > .97)
            densite = 1;
        zoneQuestion.style.setProperty('--densite-question', densite.toFixed(3));
    });
}
const TITRES_ECRANS = {
    accueil: 'Accueil',
    parcours: 'Parcours PJJ',
    carnet: 'Carnet de parcours',
    entrainement: 'Choisis ton mode d’entraînement',
    erreurs: 'Mes erreurs à retravailler',
    sigles: 'Mission Sigles',
    'sigles-revision': 'Réviser mes erreurs · Mission Sigles',
    supports: 'Supports de révision',
    progression: 'Progression',
    parametres: 'Paramètres',
    question: 'Question',
    bilan: 'Résultats'
};
function actualiserTitrePage(ecran) {
    document.title = `${TITRES_ECRANS[ecran] || 'PJJoue'} — PJJoue`;
}
function afficherEcran(identifiant, optionsAffichage = {}) {
    fermerMenuPrincipal();
    if (identifiant === 'supports')
        initialiserRechercheSupports();
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
    if (identifiant === 'sigles-revision')
        afficherRevisionMissionSigles();
    if (identifiant === 'progression')
        afficherProgression();
    if (identifiant === 'sigles')
        actualiserAccueilSigles();
    if (identifiant === 'carnet') {
        THEMES.forEach(theme => initialiserProgression(theme.id));
        actualiserCarnetParcours();
    }
    actualiserGroupesChoix();
    actualiserNavigation(identifiant);
    actualiserBoutonRetour();
    if (!optionsAffichage.depuisHistorique && !restaurationNavigation)
        mettreAJourAdresseNavigation(identifiant, Boolean(optionsAffichage.remplacerHistorique));
    if (identifiant === 'accueil')
        garantirAccueilEnHaut();
    else
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (identifiant !== 'question') {
        requestAnimationFrame(() => {
            const titre = [...cible.querySelectorAll('h1,h2')]
                .find(element => !element.closest('.masque'));
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
        const secours = etat.mode === 'parcours' || etat.mode === 'evaluation-finale' ? 'parcours' : (etat.mode === 'revision' ? 'erreurs' : (etat.mode === 'sigles-revision' ? 'sigles-revision' : 'entrainement'));
        if (secours === 'parcours') {
            ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || 'commun', { remplacerHistorique: true });
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
            ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || 'commun', { remplacerHistorique: true });
            return;
        }
        afficherEcran(etat.mode === 'revision' ? 'erreurs' : (etat.mode === 'sigles-revision' ? 'sigles-revision' : 'entrainement'), { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    afficherEcran('accueil', { forcerSortieQuestion: true, remplacerHistorique: true });
}
function lireRoute() {
    const decoderSegment = segment => {
        try {
            return decodeURIComponent(segment);
        }
        catch (erreur) {
            return '';
        }
    };
    const parties = location.hash.replace(/^#/, '').split('/').map(decoderSegment);
    if (parties[0] === 'parcours')
        return { pjjoue: true, ecran: 'parcours', theme: parties[1] || null };
    const ecransAutorises = ['accueil', 'parcours', 'carnet', 'entrainement', 'erreurs', 'sigles', 'sigles-revision', 'supports', 'progression', 'parametres', 'question'];
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
    else if (etatRoute.ecran === 'parcours') {
        if (etatRoute.theme)
            ouvrirParcours(etatRoute.theme);
        else
            ouvrirChoixParcours({ depuisHistorique: true, forcerSortieQuestion: true });
    }
    else
        afficherEcran(etatRoute.ecran || 'accueil', { depuisHistorique: true, forcerSortieQuestion: true });
    restaurationNavigation = false;
    if (window.location.protocol !== 'file:')
        history.replaceState(creerEtatNavigation(etat.ecran), '', routePourEcran(etat.ecran));
}
window.addEventListener('hashchange', () => {
    if (window.location.protocol !== 'file:' || restaurationNavigation || navigationInterneParFragment)
        return;
    const fragmentCourant = window.location.hash || '#accueil';
    if (fragmentCourant === routePourEcran(etat.ecran))
        return;
    restaurerRoute(lireRoute());
});
window.addEventListener('popstate', evenement => {
    if (navigationInterneParFragment)
        return;
    // Chrome peut émettre popstate lors d'un simple changement de fragment sur un fichier local.
    // Si l'adresse correspond déjà à l'écran affiché, ce n'est pas une demande de sortie utilisateur.
    if (window.location.protocol === 'file:' && window.location.hash === routePourEcran(etat.ecran))
        return;
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
