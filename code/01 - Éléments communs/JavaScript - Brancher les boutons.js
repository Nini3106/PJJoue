/**
 * Relier les boutons visibles aux actions du jeu.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
// -----------------------------------------------------------------------------
// Branchement des commandes de l’interface
// -----------------------------------------------------------------------------
selectionnerTous('[data-ecran]').forEach(bouton => bouton.onclick = () => {
    if (etat.ecran === 'parametres')
        enregistrerParametres();
    if (bouton.dataset.ecran === 'parcours') {
        ouvrirChoixParcours();
        return;
    }
    if (bouton.dataset.ecran === 'entrainement' && bouton.id === 'boutonEntrainementLibre')
        restaurerEntrainementPJJoueNatif();
    if (bouton.dataset.ecran === 'erreurs' && bouton.id === 'boutonReviser')
        etat.contexteRevision = null;
    afficherEcran(bouton.dataset.ecran);
});
const lienEvitement = selectionner('.passer-lien');
if (lienEvitement)
    lienEvitement.addEventListener('click', evenement => {
        evenement.preventDefault();
        const cible = selectionner('#contenuPrincipal');
        cible?.focus({ preventScroll: true });
        cible?.scrollIntoView({ block: 'start' });
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
selectionner('#boutonReprendreEtapeDepuisDebut')?.addEventListener('click', reprendreEtapeDepuisDebutQuestion);
selectionner('#boutonRejouerMesErreurs').onclick = () => afficherEcran('erreurs');
selectionner('#boutonRevenirAuParcours').onclick = () => ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || 'commun', { remplacerHistorique: true });
selectionner('#boutonOuvrirParcours').onclick = () => ouvrirChoixParcours();
selectionner('#boutonExporterMaProgression').onclick = exporterProgression;
const boutonImporterProgression = selectionner('#boutonImporterProgression');
const fichierImporterProgression = selectionner('#fichierImporterProgression');
boutonImporterProgression.onclick = () => {
    fichierImporterProgression.value = '';
    fichierImporterProgression.click();
};
fichierImporterProgression.onchange = evenement => evenement.target.files[0] && importerProgression(evenement.target.files[0]);
selectionner('#volumeSon').onchange = enregistrerParametres;
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
        effacerSauvegardeDuNavigateur();
        effacerSauvegardeDeSecours();
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
    else if (action === 'reviser-etape')
        lancerRevisionEtape(cible.dataset.theme || 'commun', cible.dataset.etape);
    else if (action === 'reviser-toutes-erreurs-sigles')
        lancerToutesErreursSiglesDepuisRevision();
    else if (action === 'reviser-etape-sigles')
        lancerRevisionEtapeSiglesDepuisRevision(cible.dataset.etape);
    else if (action === 'reviser-etape-mesures')
        lancerRevisionEtapeMesuresDepuisRevision(cible.dataset.etape);
    else if (action === 'ouvrir-parcours-depuis-erreurs')
        ouvrirChoixParcours();
    else if (action === 'ouvrir-mission-sigles-depuis-erreurs')
        afficherEcran('sigles');
    else if (action === 'rejouer-erreurs-etape')
        rejouerErreursEtapeCourante();
});
mesurerHauteurEntete();
selectionner('#boutonMenuMobile')?.addEventListener('click', evenement => {
    evenement.stopPropagation();
    basculerMenuPrincipal();
});
document.addEventListener('click', evenement => {
    const entete = document.querySelector('header.entete');
    if (entete?.classList.contains('menu-mobile-ouvert') && !entete.contains(evenement.target))
        fermerMenuPrincipal();
});
document.addEventListener('keydown', evenement => {
    const entete = document.querySelector('header.entete');
    if (!entete?.classList.contains('menu-mobile-ouvert'))
        return;
    if (evenement.key === 'Escape') {
        fermerMenuPrincipal();
        selectionner('#boutonMenuMobile')?.focus();
        return;
    }
    if (evenement.key !== 'Tab')
        return;
    const elements = [
        selectionner('#boutonMenuMobile'),
        ...selectionnerTous('#menuPrincipal button:not(:disabled), #menuPrincipal a[href]')
    ].filter(Boolean);
    if (!elements.length)
        return;
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (evenement.shiftKey && document.activeElement === premier) {
        evenement.preventDefault();
        dernier.focus();
    } else if (!evenement.shiftKey && document.activeElement === dernier) {
        evenement.preventDefault();
        premier.focus();
    }
});

/*
 * Aides courtes affichées au survol des actions qui demandent un peu de contexte.
 * Les boutons dont le libellé suffit à comprendre l'action ne reçoivent volontairement
 * pas d'infobulle : l'interface reste légère et les aides restent utiles.
 */
const TITRES_BOUTONS_SURVOL = Object.freeze({
    boutonInstallerPJJoue: 'Installer PJJoue comme application sur cet appareil.',
    boutonChangerParcours: 'Revenir à la liste pour choisir un autre parcours.',
    boutonActionParcours: 'Commencer ou reprendre l’étape actuellement proposée.',
    boutonParcoursLibre: 'Jouer cette étape sans limite de temps.',
    boutonParcoursChronometre: 'Jouer cette étape avec une limite de temps par question.',
    boutonParcours15Secondes: 'Limiter chaque réponse à 15 secondes.',
    boutonParcours20Secondes: 'Limiter chaque réponse à 20 secondes.',
    boutonParcours25Secondes: 'Limiter chaque réponse à 25 secondes.',
    boutonParcours30Secondes: 'Limiter chaque réponse à 30 secondes.',
    boutonLancerLeDe: 'Tirer au hasard un défi parmi les parcours.',
    boutonJouerLeTirage: 'Démarrer le défi tiré par le dé.',
    boutonRejouerErreursEtape: 'Rejouer les erreurs actives et les questions déjà introduites qui ne sont pas encore maîtrisées sans joker. Les maîtrises sans joker sont conservées.',
    boutonReprendreEtapeDepuisDebut: 'Recommencer l’étape à la première question : les questions déjà maîtrisées restent validées tant qu’elles ne sont pas réinitialisées.',
    boutonReinitialiserValidationsSansJoker: 'Réinitialiser les validations sans joker de cette étape. Les questions travaillées, les erreurs et la progression générale restent conservées.',
    boutonJokers: 'Ouvrir les aides disponibles pour cette question.',
    boutonPasser: 'Passer cette question : elle restera à reprendre et ne sera pas validée.',
    boutonRejouerMesErreurs: 'Rejouer les questions de la session qui restent à consolider.',
    boutonRevenirAuParcours: 'Retourner à la carte du parcours.',
    boutonRefermerSupports: 'Fermer toutes les fiches de support ouvertes.',
    boutonOuvrirParcours: 'Choisir un parcours pour consulter sa progression détaillée.',
    boutonExporterMaProgression: 'Télécharger une copie de ta progression pour la conserver ou la transférer.',
    boutonImporterProgression: 'Charger une progression précédemment exportée.',
    boutonEnregistrerEtRevenir: 'Enregistrer les réglages et revenir à l’accueil.',
    boutonReinitialiserTouteLaProgression: 'Effacer toute la progression enregistrée sur cet appareil.',
    boutonJoker5050: 'Retirer deux réponses incorrectes pour faciliter le choix.',
    boutonJokerIndice: 'Afficher un indice pédagogique sans valider la réponse.',
    boutonJokerLangueAuChat: 'Obtenir une explication reformulée comme un conseil.',
    siglesOuvrirParcours: 'Ouvrir la carte des étapes de Mission Sigles.',
    siglesOuvrirEntrainement: 'Choisir les sigles, le nombre de questions et les aides.',
    siglesLancerDe: 'Tirer au hasard une étape et un nombre de sigles.',
    siglesJouerTirage: 'Démarrer le défi tiré par le dé.',
    siglesLancerRevision: 'Rejouer uniquement les sigles encore en erreur.',
    siglesRetourDepuisParcours: 'Revenir à l’accueil de Mission Sigles.',
    siglesLancerEvaluation: 'Passer l’évaluation finale après la maîtrise autonome des étapes.',
    mesuresOuvrirParcours: 'Ouvrir la carte des étapes de Mission Mesures.',
    mesuresOuvrirEntrainement: 'Choisir les mesures, le nombre de questions et les aides.',
    mesuresLancerDe: 'Tirer au hasard une étape et un nombre de repères.',
    mesuresJouerTirage: 'Démarrer le défi tiré par le dé.',
    mesuresLancerRevision: 'Rejouer uniquement les repères encore en erreur.',
    mesuresRetourDepuisParcours: 'Revenir à l’accueil de Mission Mesures.',
    mesuresLancerEvaluation: 'Passer l’évaluation finale après la maîtrise autonome des étapes.',
    carteEvaluationFinale: 'Évaluation finale verrouillée jusqu’à la maîtrise de toutes les étapes.'
});

const TITRES_ACTIONS_SURVOL = Object.freeze({
    'rejouer-erreurs-etape': 'Rejouer les erreurs actives et les questions déjà introduites qui ne sont pas encore maîtrisées sans joker. Les maîtrises sans joker sont conservées.',
    'reviser-theme': 'Ouvrir les erreurs de ce parcours.',
    'reviser-etape': 'Rejouer les erreurs de cette étape.',
    'reviser-toutes-erreurs': 'Rejouer toutes les questions encore à revoir.',
    'ouvrir-parcours-depuis-erreurs': 'Choisir une étape du parcours pour la réviser.',
    'reviser-etape-sigles': 'Rejouer les sigles encore en erreur dans cette étape.',
    'reviser-toutes-erreurs-sigles': 'Rejouer tous les sigles encore en erreur.',
    'ouvrir-mission-sigles-depuis-erreurs': 'Choisir une étape de Mission Sigles pour la réviser.',
    'reviser-etape-mesures': 'Rejouer les repères encore en erreur dans cette étape.',
    'reviser-toutes-erreurs-mesures': 'Rejouer tous les repères encore en erreur.',
    'ouvrir-mission-mesures-depuis-erreurs': 'Choisir une étape de Mission Mesures pour la réviser.'
});

function obtenirTitreSurvolBouton(bouton) {
    if (TITRES_BOUTONS_SURVOL[bouton.id])
        return TITRES_BOUTONS_SURVOL[bouton.id];

    const action = bouton.dataset.action;
    if (action && TITRES_ACTIONS_SURVOL[action])
        return TITRES_ACTIONS_SURVOL[action];

    if (bouton.matches('.selecteur-parcours-bouton'))
        return 'Ouvrir ce parcours et consulter ses étapes.';
    if (bouton.matches('.progression-pastille'))
        return 'Afficher la progression détaillée de ce parcours.';
    if (bouton.matches('.carte-voyage-etape'))
        return 'Ouvrir les souvenirs et les supports de cette étape.';
    if (bouton.matches('.sigles-etape-ouvrir, .mesures-etape-ouvrir'))
        return 'Ouvrir cette étape et reprendre sa progression.';
    if (bouton.matches('.sigles-etape-revision'))
        return 'Rejouer uniquement les sigles encore en erreur dans cette étape.';
    if (bouton.matches('.mesures-etape-revision'))
        return 'Rejouer uniquement les repères encore en erreur dans cette étape.';
    if (bouton.matches('.revision-parcours-bouton'))
        return 'Ouvrir les erreurs de ce parcours.';
    if (bouton.matches('.revision-etape-bouton'))
        return 'Rejouer les erreurs de cette étape.';

    const groupe = bouton.closest('[data-proposition]');
    if (groupe?.dataset.proposition === 'jokers')
        return 'Choisir si les aides sont disponibles pendant la session.';
    if (groupe?.dataset.proposition === 'chronometre')
        return 'Choisir si une limite de temps s’applique à chaque question.';
    if (bouton.closest('.entrainement-secondes-groupe, #secondesChronometreParcours, #siglesChoixSecondes, #mesuresChoixSecondes'))
        return `Limiter chaque réponse à ${bouton.textContent.trim()}.`;
    if (bouton.closest('.entrainement-perimetre-choix, #siglesChoixPerimetre, #mesuresChoixPerimetre'))
        return 'Choisir le périmètre de questions à travailler.';
    if (bouton.closest('.entrainement-nombre-choix, #siglesChoixNombre, #mesuresChoixNombre'))
        return 'Choisir le nombre de questions de la session.';
    if (bouton.closest('#siglesChoixOrganisation, #mesuresChoixOrganisation'))
        return 'Choisir l’ordre de présentation des questions.';
    if (bouton.closest('#siglesChoixChrono, #mesuresChoixChrono'))
        return 'Activer ou désactiver le chronomètre de la session.';
    if (bouton.closest('#siglesChoixJokers, #mesuresChoixJokers'))
        return 'Activer ou désactiver les jokers de la session.';

    return '';
}

let compteurInfobullePJJoue = 0;
let infobullePJJoueActive = null;

function positionnerInfobullePJJoue() {
    const active = infobullePJJoueActive;
    if (!active?.element?.isConnected || !active.declencheur?.isConnected)
        return;
    const declencheur = active.declencheur;
    const element = active.element;
    const marge = 10;
    const rect = declencheur.getBoundingClientRect();
    const largeur = element.offsetWidth;
    const hauteur = element.offsetHeight;
    const espaceHaut = rect.top - marge;
    const afficherDessous = espaceHaut < hauteur + marge;
    const haut = afficherDessous
        ? Math.min(window.innerHeight - hauteur - marge, rect.bottom + marge)
        : rect.top - hauteur - marge;
    const gauche = Math.min(
        Math.max(marge, rect.left + rect.width / 2 - largeur / 2),
        Math.max(marge, window.innerWidth - largeur - marge)
    );
    const fleche = Math.min(
        Math.max(16, rect.left + rect.width / 2 - gauche),
        Math.max(16, largeur - 16)
    );
    element.dataset.position = afficherDessous ? 'dessous' : 'dessus';
    element.style.left = `${gauche}px`;
    element.style.top = `${Math.max(marge, haut)}px`;
    element.style.setProperty('--position-fleche', `${fleche}px`);
}

function masquerInfobullePJJoue() {
    const active = infobullePJJoueActive;
    if (!active)
        return;
    const { declencheur, element, ariaDescribedBy } = active;
    if (declencheur?.isConnected) {
        if (ariaDescribedBy)
            declencheur.setAttribute('aria-describedby', ariaDescribedBy);
        else
            declencheur.removeAttribute('aria-describedby');
    }
    element?.remove();
    infobullePJJoueActive = null;
}

function afficherInfobullePJJoue(declencheur) {
    const texte = declencheur?.dataset.infobulle;
    if (!(declencheur instanceof HTMLButtonElement) || !texte)
        return;
    if (infobullePJJoueActive?.declencheur === declencheur) {
        infobullePJJoueActive.element.textContent = texte;
        positionnerInfobullePJJoue();
        return;
    }
    masquerInfobullePJJoue();
    const element = document.createElement('span');
    element.className = 'infobulle-pjjoue';
    element.id = `infobullePJJoue-${++compteurInfobullePJJoue}`;
    element.setAttribute('role', 'tooltip');
    element.textContent = texte;
    const ariaDescribedBy = declencheur.getAttribute('aria-describedby') || '';
    declencheur.setAttribute('aria-describedby', element.id);
    document.body.appendChild(element);
    infobullePJJoueActive = { declencheur, element, ariaDescribedBy };
    positionnerInfobullePJJoue();
    requestAnimationFrame(() => element.classList.add('est-visible'));
}

function definirAideSurvolBouton(bouton, texte) {
    if (!(bouton instanceof HTMLButtonElement))
        return;
    if (texte) {
        bouton.dataset.infobulle = texte;
        // Les infobulles natives sont remplacées par l'aide intégrée à PJJoue.
        bouton.removeAttribute('title');
        if (infobullePJJoueActive?.declencheur === bouton)
            afficherInfobullePJJoue(bouton);
    }
    else {
        delete bouton.dataset.infobulle;
        if (infobullePJJoueActive?.declencheur === bouton)
            masquerInfobullePJJoue();
    }
}

function appliquerAideSurvolBouton(bouton) {
    if (!(bouton instanceof HTMLButtonElement))
        return;
    const texte = obtenirTitreSurvolBouton(bouton);
    if (texte)
        definirAideSurvolBouton(bouton, texte);
}

function appliquerAidesSurvol(racine = document) {
    if (racine instanceof HTMLButtonElement)
        appliquerAideSurvolBouton(racine);
    racine.querySelectorAll?.('button').forEach(appliquerAideSurvolBouton);
}

function activerAidesAuSurvol() {
    appliquerAidesSurvol();
    document.addEventListener('pointerover', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton && !bouton.contains(evenement.relatedTarget))
            afficherInfobullePJJoue(bouton);
    });
    document.addEventListener('pointerout', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton && !bouton.contains(evenement.relatedTarget)
            && document.activeElement !== bouton)
            masquerInfobullePJJoue();
    });
    document.addEventListener('focusin', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton)
            afficherInfobullePJJoue(bouton);
    });
    document.addEventListener('focusout', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton && !bouton.matches(':hover'))
            masquerInfobullePJJoue();
    });
    document.addEventListener('keydown', evenement => {
        if (evenement.key === 'Escape')
            masquerInfobullePJJoue();
    });
    window.addEventListener('resize', positionnerInfobullePJJoue, { passive: true });
    window.addEventListener('scroll', positionnerInfobullePJJoue, { passive: true, capture: true });
    const observateur = new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(noeud => {
            if (noeud.nodeType === Node.ELEMENT_NODE)
                appliquerAidesSurvol(noeud);
        }));
    });
    observateur.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', activerAidesAuSurvol, { once: true });
else
    activerAidesAuSurvol();
window.addEventListener('resize', mesurerHauteurEntete, { passive: true });
initialiserGroupesChoix();
initialiserRechercheSupports();
actualiserAccueil();
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
