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
