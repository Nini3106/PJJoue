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
    const modeEvaluationFinale = etat.mode === 'evaluation-finale' || etat.mode === 'sigles-evaluation';
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
