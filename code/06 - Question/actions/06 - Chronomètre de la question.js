/**
 * Afficher la question puis démarrer, reprendre ou arrêter son chronomètre.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
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
    const modeEvaluationFinale = estSessionEvaluation();
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
// Chaque question conserve son propre temps, même après un retour ou une reprise.
function reinitialiserChronometresSession() {
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.chronometresQuestions = new Map();
    etat.chronometreToutesQuestions = false;
    etat.chronometreSessionActif = false;
    etat.dureeChronometreSession = 15;
    etat.tempsRestant = 0;
}
function obtenirChronometreQuestion() {
    etat.chronometresQuestions = etat.chronometresQuestions || new Map();
    return etat.chronometresQuestions.get(etat.questionCourante?.id);
}
function actualiserCommandeChronometreQuestion() {
    const commande = selectionner('#boutonChronometreQuestion');
    const portee = selectionner('#boutonChronometreToutesQuestions');
    const arret = selectionner('#boutonArreterChronometre');
    const libelle = selectionner('#chronometreQuestion');
    if (!commande || !portee || !arret || !libelle) return;
    const chrono = obtenirChronometreQuestion();
    const actif = chrono?.actif === true;
    const plafond = actif && chrono.dureeAccordee >= 30;
    libelle.textContent = actif ? `${Math.max(0, etat.tempsRestant)} s` : 'Chrono';
    commande.classList.toggle('est-actif', actif);
    commande.classList.toggle('temps-court', actif && etat.tempsRestant <= 5 && !etat.questionValidee);
    commande.disabled = etat.questionValidee || plafond;
    commande.setAttribute('aria-label', actif
        ? (plafond ? 'Chronomètre : limite de 30 secondes atteinte' : 'Ajouter 5 secondes au chronomètre, jusqu’à 30 secondes')
        : 'Activer le chronomètre : 15 secondes');
    portee.setAttribute('aria-pressed', String(etat.chronometreToutesQuestions === true));
    portee.setAttribute('aria-label', etat.chronometreToutesQuestions
        ? 'Garder le chrono pour cette question seulement'
        : 'Activer le chrono pour toutes les questions de cette session');
    definirAideSurvolBouton(commande, actif
        ? (plafond ? 'Budget maximal : 30 secondes.' : 'Clique pour ajouter 5 secondes, jusqu’à 30 secondes au total.')
        : 'Clique pour activer 15 secondes sur cette question.');
    definirAideSurvolBouton(portee, etat.chronometreToutesQuestions
        ? 'Le chrono s’applique à toutes les questions de cette session. Clique pour le garder seulement sur cette question.'
        : 'Appliquer le chrono à toutes les questions de cette session.');
    portee.disabled = etat.questionValidee;
    arret.classList.toggle('masque', !actif);
    arret.disabled = etat.questionValidee;
}
function animerAjoutChronometre(secondes) {
    const ajout = selectionner('#ajoutChronometreQuestion');
    if (ajout) {
        ajout.classList.remove('est-visible');
        ajout.textContent = `+${secondes} s`;
        void ajout.offsetWidth;
        ajout.classList.add('est-visible');
    }
    annoncer(`${secondes} secondes ajoutées. ${etat.tempsRestant} secondes restantes.`);
}
function ajouterTempsChronometreQuestion() {
    if (etat.ecran !== 'question' || etat.questionValidee) return;
    let chrono = obtenirChronometreQuestion();
    const ajout = chrono?.actif ? Math.min(5, 30 - chrono.dureeAccordee) : 15;
    if (ajout <= 0) return;
    if (!chrono?.actif) {
        chrono = { actif: true, dureeAccordee: 15, tempsRestant: 15, termine: false };
        etat.chronometresQuestions.set(etat.questionCourante.id, chrono);
    }
    else {
        chrono.dureeAccordee += ajout;
        chrono.tempsRestant = Math.min(chrono.dureeAccordee, etat.tempsRestant + ajout);
    }
    etat.chronometreSessionActif = true;
    etat.delaiDepasse = false;
    etat.dureeChronometreSession = chrono.dureeAccordee;
    reprendreChronometreQuestion(chrono.tempsRestant);
    animerAjoutChronometre(ajout);
    enregistrerSessionEnCours();
}
function basculerChronometreToutesQuestions() {
    if (etat.ecran !== 'question' || etat.questionValidee) return;
    etat.chronometreToutesQuestions = !etat.chronometreToutesQuestions;
    if (etat.chronometreToutesQuestions && !obtenirChronometreQuestion()?.actif) {
        ajouterTempsChronometreQuestion();
    }
    if (etat.chronometreToutesQuestions) {
        etat.dureeChronometreSession = obtenirChronometreQuestion()?.dureeAccordee || 15;
    }
    actualiserCommandeChronometreQuestion();
    annoncer(etat.chronometreToutesQuestions
        ? `Chronomètre activé pour toutes les questions de cette session : ${etat.dureeChronometreSession} secondes par question.`
        : 'Chronomètre conservé pour cette question seulement.');
    enregistrerSessionEnCours();
}
function desactiverChronometreQuestion() {
    if (etat.ecran !== 'question' || etat.questionValidee) return;
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.chronometreToutesQuestions = false;
    etat.chronometreSessionActif = false;
    etat.tempsRestant = 0;
    etat.chronometresQuestions.set(etat.questionCourante.id, { actif: false, dureeAccordee: 0, tempsRestant: 0 });
    actualiserCommandeChronometreQuestion();
    annoncer('Chronomètre arrêté.');
    enregistrerSessionEnCours();
}
function terminerChronometreQuestion() {
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    const chrono = obtenirChronometreQuestion();
    if (chrono) {
        chrono.tempsRestant = etat.tempsRestant;
        chrono.termine = true;
    }
    actualiserCommandeChronometreQuestion();
}
function gererTempsEcoule() {
    if (etat.questionValidee) return;
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.tempsRestant = 0;
    const chrono = obtenirChronometreQuestion();
    if (chrono) chrono.tempsRestant = 0;
    if (!etat.questionCourante) return;
    if (typeof jouerSonErreur === 'function') jouerSonErreur();
    etat.delaiDepasse = true;
    // La même correction complète s’applique aux sept modes de réponse.
    finaliserReponse(false, 'Temps écoulé');
}
function reprendreChronometreQuestion(secondesRestantes = etat.tempsRestant) {
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    if (!etat.chronometreSessionActif || etat.questionValidee) {
        actualiserCommandeChronometreQuestion();
        return;
    }
    etat.tempsRestant = Math.min(30, Math.max(0, Number(secondesRestantes) || 0));
    let chrono = obtenirChronometreQuestion();
    if (!chrono) {
        chrono = { actif: true, dureeAccordee: etat.dureeChronometreSession, tempsRestant: etat.tempsRestant, termine: false };
        etat.chronometresQuestions.set(etat.questionCourante.id, chrono);
    }
    chrono.tempsRestant = etat.tempsRestant;
    actualiserCommandeChronometreQuestion();
    if (!etat.tempsRestant) { gererTempsEcoule(); return; }
    const echeance = Date.now() + etat.tempsRestant * 1000;
    etat.identifiantMinuteur = setInterval(() => {
        const restant = Math.max(0, Math.ceil((echeance - Date.now()) / 1000));
        if (restant === etat.tempsRestant) return;
        etat.tempsRestant = restant;
        chrono.tempsRestant = restant;
        actualiserCommandeChronometreQuestion();
        if (!restant) gererTempsEcoule();
        enregistrerSessionEnCours();
    }, 250);
}
function demarrerChronometreQuestion() {
    etat.delaiDepasse = false;
    let chrono = obtenirChronometreQuestion();
    // Rejouer une réponse corrigée ouvre une nouvelle tentative, avec le même budget.
    if (chrono?.termine && !etat.questionValidee) {
        chrono.termine = false;
        chrono.tempsRestant = chrono.dureeAccordee;
    }
    if (!chrono && etat.chronometreToutesQuestions) {
        const duree = Math.min(30, Math.max(5, Number(etat.dureeChronometreSession) || 15));
        chrono = { actif: true, dureeAccordee: duree, tempsRestant: duree, termine: false };
        etat.chronometresQuestions.set(etat.questionCourante.id, chrono);
    }
    etat.chronometreSessionActif = chrono?.actif === true;
    etat.tempsRestant = chrono?.tempsRestant || 0;
    if (etat.chronometreSessionActif && !etat.questionValidee) reprendreChronometreQuestion();
    else actualiserCommandeChronometreQuestion();
}
