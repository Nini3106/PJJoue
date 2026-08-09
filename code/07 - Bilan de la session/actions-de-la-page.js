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
