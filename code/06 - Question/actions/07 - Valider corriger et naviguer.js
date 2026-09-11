/**
 * Valider une réponse, enregistrer son résultat, afficher la correction et changer de question.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
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
    if (!question?.missionSigles) {
        marquerEtapeDecouverte(question);
        marquerQuestionJouee(question);
        if (!precedente)
            sauvegarde.nombreQuestionsJouees = (sauvegarde.nombreQuestionsJouees || 0) + 1;
    }
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
    const { estCorrecte, reussiteAutonome, reussiteAidee, tentatives, aideUtilisee } = resultat;
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
    if (question?.missionSigles) {
        enregistrerResultatMissionSiglesNatif(question, resultat);
        enregistrerSessionEnCours();
        return;
    }
    if (question?.missionMesures) {
        enregistrerResultatMissionMesuresNatif(question, resultat);
        enregistrerSessionEnCours();
        return;
    }
    if (etat.mode !== 'parcours') {
        enregistrerSessionEnCours();
        return;
    }
    const bilan = obtenirBilanEtape(question.theme, question.etape);
    bilan.questionsTraitees[question.id] = true;
    bilan.resultats[question.id] = bilan.resultats?.[question.id] === true || reussiteAutonome;
    bilan.validationsSansJoker = bilan.validationsSansJoker || {};
    // Pour la célébration d'étape, une réponse finalement correcte compte dès lors
    // qu'aucun joker n'a été utilisé sur cette tentative, même après avoir rejoué.
    bilan.validationsSansJoker[question.id] = bilan.validationsSansJoker[question.id] === true
        || (estCorrecte && !aideUtilisee);
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
        // En mode Révision, une réussite autonome suffit : la question n’a plus besoin de rester active.
        suiviErreur.reussites = 1;
        suiviErreur.maitrisee = true;
    }
}
function traiterReussiteAidee(question, etaitPassee) {
    etat.nombreReponsesAidees = (etat.nombreReponsesAidees || 0) + 1;
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    jouerSonReussite();
    if (question?.missionSigles || etat.mode === 'evaluation-finale')
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
    if (question?.missionSigles || etat.mode === 'evaluation-finale')
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
    if (bouton?.classList.contains('reponse')) {
        bouton.classList.add(estCorrecte ? 'bonne-reponse' : 'mauvaise-reponse');
        if (!estCorrecte) {
            document.querySelectorAll('#zoneReponses .reponse[data-est-correcte="1"]').forEach(
                bonneReponse => bonneReponse.classList.add('bonne-reponse')
            );
        }
    }
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
    if (question?.missionSigles) {
        enregistrerPassageMissionSiglesNatif(question);
    }
    else if (question?.missionMesures) {
        enregistrerPassageMissionMesuresNatif(question);
    }
    else {
        marquerEtapeDecouverte(question);
        marquerQuestionJouee(question);
        if (!precedente)
            sauvegarde.nombreQuestionsJouees = (sauvegarde.nombreQuestionsJouees || 0) + 1;
    }
    etat.reponsesSession.set(question.id, { statut: 'passee', texteReponse: '' });
    etat.questionsPassees.add(question.id);
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    actualiserIndicateurSerie();
    if (!question?.missionSigles && !question?.missionMesures) {
        sauvegarde.erreurs[question.id] = sauvegarde.erreurs[question.id] || { reussites: 0, maitrisee: false, nombreErreurs: 0, theme: question.theme };
        if (!precedente) {
            sauvegarde.erreurs[question.id].nombreErreurs = (sauvegarde.erreurs[question.id].nombreErreurs || 0) + 1;
            sauvegarde.erreurs[question.id].nombrePassages = (sauvegarde.erreurs[question.id].nombrePassages || 0) + 1;
        }
        sauvegarde.erreurs[question.id].reussites = 0;
        sauvegarde.erreurs[question.id].maitrisee = false;
    }
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
