/**
 * Construire et afficher le bilan de la session.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
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
            message: `Ton carnet avance. Tu pourras rejouer cette étape sans aide pour consolider sa maîtrise.`,
            confetti: false
        };
    }
    const titreSymbolique = obtenirTitreSymboliqueParcours(compterEtapesMaitrisees());
    if (evaluationDeverrouillee) {
        return {
            titre: 'Destination finale atteinte !',
            message: `Les onze étapes de ce parcours sont validées en autonomie. Ton carnet te reconnaît comme « ${titreSymbolique} » et l’évaluation finale est maintenant ouverte.`,
            confetti: true
        };
    }
    return {
        titre: `Étape ${etapeProgramme} terminée sans joker !`,
        message: `Toutes les questions de cette étape ont été validées sans joker. Ton titre actuel : « ${titreSymbolique} ». Le chemin continue vers l’étape suivante.`,
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
    const boutonContinuer = selectionner('#boutonContinuer');
    const boutonRejouer = selectionner('#boutonRejouerMesErreurs');
    const aDesQuestionsAReprendre = questionsAReprendre.length > 0;
    boutonContinuer?.classList.toggle('principal', !aDesQuestionsAReprendre);
    boutonContinuer?.classList.toggle('secondaire', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('principal', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('secondaire', !aDesQuestionsAReprendre);
    if (nombre)
        nombre.textContent = `${questionsAReprendre.length} question${questionsAReprendre.length === 1 ? '' : 's'} à reprendre`;
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
            const validationsSansJoker = bilanEtape.validationsSansJoker || {};
            const toutesValideesSansJoker = questionsEtape.length > 0
                && questionsEtape.every(question => validationsSansJoker[question.id] === true);
            const celebrationDejaAffichee = bilanEtape.celebrationSansJokerAffichee === true;
            if (toutesValideesSansJoker && !celebrationDejaAffichee) {
                // Mémoriser avant les calculs globaux : ceux-ci réinitialisent les objets
                // de progression pour garantir leur structure et pourraient sinon perdre
                // le drapeau porté par l'ancienne référence JavaScript.
                bilanEtape.celebrationSansJokerAffichee = true;
                const evaluationDeverrouillee = estProgrammeMaitrise(etat.theme);
                celebration = obtenirCelebrationEtape(etat.etape, false, evaluationDeverrouillee);
            }
        }
    }
    if (etat.mode === 'evaluation-finale') {
        const seuil = obtenirSeuilMaitrise();
        const evaluation = obtenirEvaluationFinaleTheme(etat.theme);
        evaluation.meilleurScore = Math.max(evaluation.meilleurScore || 0, pourcentage);
        evaluation.nombreTentatives = (evaluation.nombreTentatives || 0) + 1;
        evaluationFinaleReussie = pourcentage >= seuil && nombreQuestionsPassees === 0;
        evaluation.reussie = Boolean(evaluation.reussie) || evaluationFinaleReussie;
    }
    return { evaluationFinaleReussie, celebration };
}
function construireBilanEvaluationFinale(pourcentage, evaluationFinaleReussie) {
    const numeroParcours = obtenirOrdreTheme(etat.theme) + 1;
    if (evaluationFinaleReussie) {
        const toutReussi = estParcoursCompletReussi();
        return {
            titre: `Évaluation du parcours ${numeroParcours} terminée`,
            messageResultat: `Résultat : ${pourcentage} %. Les connaissances de ce parcours sont validées.`,
            celebration: toutReussi ? {
                titre: 'Parcours complet accompli !',
                message: `Tu as validé les ${THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0)} étapes et réussi les ${THEMES.length} évaluations finales. Ton carnet PJJoue est complet.`,
                confetti: true,
                finale: true
            } : {
                titre: `Parcours ${numeroParcours} validé !`,
                message: (() => {
                    const prochainTheme = THEMES[numeroParcours];
                    if (!prochainTheme) return 'L’évaluation de ce parcours est validée.';
                    const titreSuivant = (PROGRAMMES[prochainTheme.id]?.titre || prochainTheme.titre || `Parcours ${numeroParcours + 1}`).replace(/^Parcours \d+ ·\s*/, '');
                    return `Ce parcours est validé. Le parcours ${numeroParcours + 1} « ${titreSuivant} » est maintenant ta prochaine destination.`;
                })(),
                confetti: true,
                finale: false
            }
        };
    }
    jouerSonErreur();
    return {
        titre: `Évaluation du parcours ${numeroParcours} terminée`,
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
    if (!boutonContinuer)
        return;
    const programme = PROGRAMMES[etat.theme];
    if (etat.mode === 'evaluation-finale') {
        const evaluationReussie = estEvaluationFinaleReussie(etat.theme);
        const indexTheme = obtenirOrdreTheme(etat.theme);
        const themeSuivant = THEMES[indexTheme + 1]?.id;
        if (evaluationReussie && themeSuivant) {
            boutonContinuer.textContent = `Commencer le parcours ${indexTheme + 2} →`;
            boutonContinuer.onclick = () => ouvrirParcours(themeSuivant, { remplacerHistorique: true });
        }
        else if (evaluationReussie && estParcoursCompletReussi()) {
            boutonContinuer.textContent = 'Voir le carnet complet →';
            boutonContinuer.onclick = () => afficherEcran('carnet', { remplacerHistorique: true });
        }
        else {
            boutonContinuer.textContent = 'Refaire cette évaluation';
            boutonContinuer.onclick = () => lancerEvaluationFinale(etat.theme);
        }
        return;
    }
    if (etat.mode === 'parcours') {
        const etapeCourante = Number(etat.etape);
        const nombreEtapes = programme?.etapes?.length || 11;
        if (etapeNecessiteAutreChapitre(etat.theme, etat.etape))
            boutonContinuer.textContent = 'Continuer l’étape →';
        else if (etapeCourante < nombreEtapes)
            boutonContinuer.textContent = `Passer à l’étape ${etapeCourante + 1} →`;
        else
            boutonContinuer.textContent = 'Retour au parcours →';
        boutonContinuer.onclick = () => {
            if (etapeNecessiteAutreChapitre(etat.theme, etat.etape)) {
                lancerEtape(etat.theme, etat.etape);
                return;
            }
            if (etapeCourante < nombreEtapes) {
                lancerTransitionVersEtape(etat.theme, etapeCourante + 1);
                return;
            }
            ouvrirParcours(etat.theme, { remplacerHistorique: true });
        };
        return;
    }
    boutonContinuer.textContent = 'Retour à l’accueil';
    boutonContinuer.onclick = () => afficherEcran('accueil');
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
        const indexTheme = obtenirOrdreTheme(etat.theme);
        const suivant = THEMES[indexTheme + 1];
        destination.textContent = estEvaluationFinaleReussie(etat.theme) && suivant
            ? `Prochaine destination : parcours ${indexTheme + 2} · ${PROGRAMMES[suivant.id].titre}.`
            : (estParcoursCompletReussi() ? 'Ton parcours complet est validé.' : 'Tu peux retravailler les erreurs puis refaire cette évaluation.');
        return;
    }
    if (etat.mode === 'parcours') {
        if (etapeNecessiteAutreChapitre(etat.theme, etat.etape)) {
            destination.textContent = `Reprends les activités non maîtrisées de l’étape ${etat.etape}.`;
            return;
        }
        const programme = PROGRAMMES[etat.theme];
        if (Number(etat.etape) < programme.etapes.length) {
            const prochaineEtape = obtenirEtapeProgramme(etat.theme, Number(etat.etape) + 1);
            destination.textContent = `Étape ${prochaineEtape.id} · ${prochaineEtape.titre}`;
            return;
        }
        destination.textContent = 'Retourne au parcours : son évaluation finale devient disponible dès que les 11 étapes sont terminées.';
        return;
    }
    if (etat.mode === 'revision') {
        destination.textContent = 'Continue la révision pour consolider les activités encore fragiles.';
        return;
    }
    destination.textContent = 'Choisis une nouvelle session ou rejoins le parcours guidé.';
}
function ouvrirSouvenirDepuisCarteFinale(identifiantTheme, numeroEtape) {
    afficherEcran('carnet', { remplacerHistorique: true });
    requestAnimationFrame(() => {
        const souvenir = selectionner(`#souvenirsParcours [data-theme="${identifiantTheme}"][data-etape="${numeroEtape}"]`);
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
    const doitAfficher = etat.mode === 'evaluation-finale' && estParcoursCompletReussi();
    if (!carte || !destinations)
        return;
    carte.classList.toggle('masque', !doitAfficher);
    destinations.innerHTML = '';
    if (!doitAfficher)
        return;
    THEMES.forEach((theme, indexTheme) => {
        PROGRAMMES[theme.id].etapes.forEach(etapeProgramme => {
            const bouton = document.createElement('button');
            bouton.type = 'button';
            bouton.className = 'carte-voyage-etape';
            bouton.style.setProperty('--couleur-etape', etapeProgramme.couleur || '#2d7379');
            bouton.innerHTML = `${obtenirBaliseIconeEtape(etapeProgramme.id, theme.id)}<span>P${indexTheme + 1}·${etapeProgramme.id}</span>`;
            bouton.setAttribute('aria-label', `Ouvrir les souvenirs du parcours ${indexTheme + 1}, étape ${etapeProgramme.id} · ${etapeProgramme.titre}`);
            bouton.onclick = () => ouvrirSouvenirDepuisCarteFinale(theme.id, etapeProgramme.id);
            destinations.appendChild(bouton);
        });
        const finaleParcours = document.createElement('span');
        finaleParcours.className = 'carte-voyage-etape carte-voyage-evaluation';
        finaleParcours.innerHTML = `<span aria-hidden="true">★</span><strong>P${indexTheme + 1}</strong>`;
        finaleParcours.setAttribute('role', 'img');
        finaleParcours.setAttribute('aria-label', `Évaluation finale du parcours ${indexTheme + 1} réussie`);
        destinations.appendChild(finaleParcours);
    });
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
