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
            message: `Ta progression avance. Tu pourras rejouer cette étape sans aide pour consolider sa maîtrise.`,
            confetti: false
        };
    }
    const titreSymbolique = obtenirTitreSymboliqueParcours(compterEtapesMaitrisees());
    if (evaluationDeverrouillee) {
        return {
            titre: 'Destination finale atteinte !',
            message: `Les onze étapes de ce parcours sont validées en autonomie. Tu as obtenu le titre « ${titreSymbolique} » et l’évaluation finale est maintenant ouverte.`,
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
        return 'Consolidation';
    return 'Entraînement libre';
}
function obtenirQuestionsAConsoliderSession() {
    return etat.questionsSession.filter(question => {
        const reponse = etat.reponsesSession.get(question.id);
        return etat.erreursSession.has(question.id)
            || etat.questionsPassees.has(question.id)
            || reponse?.precisions?.aConsolider === true;
    });
}
function obtenirStatutErreurBilan(reponse, estQuestionPassee) {
    if (reponse?.statut === 'correcte' && reponse.precisions?.aConsolider)
        return obtenirLibelleConsolidation({ motifRevision: 'reprise' });
    if (estQuestionPassee || reponse?.statut === 'passee')
        return obtenirLibelleConsolidation({ motifRevision: 'passage' });
    if (reponse?.statut === 'aidee') {
        if (reponse.precisions?.aideUtilisee)
            return obtenirLibelleConsolidation({ motifRevision: 'joker' });
        return 'Validée avec aide · à consolider';
    }
    if (reponse?.statut === 'incorrecte')
        return obtenirLibelleConsolidation({ motifRevision: 'incorrecte' });
    return obtenirLibelleConsolidation();
}
function revenirAuParcoursDuBilan() {
    if (estSessionMissionSigles()) return afficherEcran('sigles', { remplacerHistorique: true });
    if (estSessionMissionMesures()) return afficherEcran('mesures', { remplacerHistorique: true });
    ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || IDENTIFIANT_PARCOURS_RECOMMANDE, { remplacerHistorique: true });
}
function collecterCelebrationMission(jeu) {
    const sigles = jeu === 'sigles';
    const cibles = etat.questionsSession.flatMap(question => sigles
        ? obtenirCiblesMissionQuestion(question) : obtenirCiblesMissionMesuresQuestion(question));
    const numeros = [...new Set(cibles.map(cible => Number(cible.etape)))];
    const validees = numeros.filter(numero => {
        const maitrisee = sigles ? compterMaitrisesEtapeSigles(numero) === obtenirSiglesEtape(numero).length
            : etapeMesuresMaitrisee(numero);
        const etape = sigles ? obtenirEtatEtapeSigles(numero) : obtenirEtatEtapeMesures(numero);
        if (!maitrisee || etape.celebrationAffichee) return false;
        etape.celebrationAffichee = true;
        return true;
    });
    if (!validees.length) return null;
    return {
        titre: validees.length === 1 ? `${sigles ? libelleEtapeSigles(validees[0]) : `Étape ${validees[0]}`} maîtrisée !` : `${validees.length} étapes maîtrisées !`,
        message: `Mission ${sigles ? 'Sigles' : 'Mesures'} : toutes les notions de ${validees.length === 1 ? 'cette étape ont' : 'ces étapes ont'} été réussies sans joker.`,
        confetti: true
    };
}
function afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees) {
    const zone = selectionner('#listeErreursBilan');
    const nombre = selectionner('#nombreErreursBilan');
    const boutonContinuer = selectionner('#boutonContinuer');
    const boutonRejouer = selectionner('#boutonRejouerMesErreurs');
    const boutonReprendre = selectionner('#boutonReprendreProgressionBilan');
    const progression = etat.progressionAvantRevision;
    const reponsesAvantRevision = restaurerTableauAssociatif(progression?.reponsesSession);
    const resteUneProgression = Boolean(progression?.questions?.some(identifiant => !reponsesAvantRevision.has(identifiant)));
    if (boutonReprendre) {
        boutonReprendre.classList.toggle('masque', !resteUneProgression);
        boutonReprendre.disabled = !resteUneProgression;
    }
    const jeu = estSessionMissionSigles() ? 'sigles' : estSessionMissionMesures() ? 'mesures' : 'parcours';
    if (boutonRejouer) {
        boutonRejouer.textContent = 'Refaire les questions à consolider';
        boutonRejouer.onclick = rejouerQuestionsAConsoliderBilan;
        boutonRejouer.classList.toggle('masque', !questionsAReprendre.length);
    }
    const retour = selectionner('#boutonRevenirAuParcours');
    retour?.classList.toggle('masque', jeu !== 'parcours');
    if (retour) retour.onclick = revenirAuParcoursDuBilan;
    const aDesQuestionsAReprendre = questionsAReprendre.length > 0;
    boutonContinuer?.classList.toggle('principal', !aDesQuestionsAReprendre);
    boutonContinuer?.classList.toggle('secondaire', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('principal', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('secondaire', !aDesQuestionsAReprendre);
    if (nombre)
        nombre.textContent = `${questionsAReprendre.length} question${questionsAReprendre.length === 1 ? '' : 's'} à consolider`;
    if (!zone)
        return;
    const regleLecture = `<div class="bilan-correction-regle">
    <strong>À savoir</strong>
    <span>Les questions passées sont listées sans dévoiler leur réponse. Les réponses validées après reprise restent à consolider, sans empêcher la validation de la session.</span>
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
            + '<div><h3>Aucune question à consolider</h3>'
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
        const classeConsolidation = reponse?.statut === 'correcte'
            ? 'bilan-consolidation-validee'
            : (estPassee || reponse?.statut === 'aidee' ? 'bilan-erreur-passee' : '');
        return `<article class="bilan-erreur-element ${classeConsolidation}">
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
    const contexteEtape = etat.mode === 'parcours'
        ? { theme: etat.theme, etape: etat.etape }
        : obtenirContexteRevisionEtape(etat.questionCourante);
    if (contexteEtape) {
        const etapeTerminee = (etat.mode === 'revision'
            || !etapeNecessiteAutreChapitre(contexteEtape.theme, contexteEtape.etape))
            && nombreQuestionsPassees === 0;
        // Lire le bilan après le contrôle des chapitres, qui normalise les
        // objets de progression, pour conserver le score et la célébration.
        const bilanEtape = obtenirBilanEtape(contexteEtape.theme, contexteEtape.etape);
        bilanEtape.meilleurScore = Math.max(bilanEtape.meilleurScore || 0, pourcentage);
        bilanEtape.nombreTentatives = (bilanEtape.nombreTentatives || 0) + 1;
        if (etapeTerminee) {
            const questionsEtape = obtenirQuestionsEtape(contexteEtape.theme, contexteEtape.etape);
            const toutesReussiesEnAutonomie = questionsEtape.length > 0
                && questionsEtape.every(question => bilanEtape.resultats?.[question.id] === true);
            const etaitDejaValideeSansJoker = bilanEtape.termineeSansJoker === true;
            bilanEtape.termineeSansJoker = etaitDejaValideeSansJoker || toutesReussiesEnAutonomie;
            bilanEtape.jokersUtilises = !bilanEtape.termineeSansJoker;
            const validationsSansJoker = bilanEtape.validationsSansJoker || {};
            // Les anciennes sauvegardes peuvent ne pas avoir le détail des
            // validations sans joker, alors que le résultat autonome est déjà
            // enregistré. Ce résultat constitue bien une maîtrise sans aide.
            questionsEtape.forEach(question => {
                if (bilanEtape.resultats?.[question.id] === true)
                    validationsSansJoker[question.id] = true;
            });
            bilanEtape.validationsSansJoker = validationsSansJoker;
            const toutesValideesSansJoker = questionsEtape.length > 0
                && questionsEtape.every(question => validationsSansJoker[question.id] === true);
            const celebrationDejaAffichee = bilanEtape.celebrationSansJokerAffichee === true;
            if (toutesValideesSansJoker && !celebrationDejaAffichee) {
                // Mémoriser avant les calculs globaux : ceux-ci réinitialisent les objets
                // de progression pour garantir leur structure et pourraient sinon perdre
                // le drapeau porté par l'ancienne référence JavaScript.
                bilanEtape.celebrationSansJokerAffichee = true;
                const evaluationDeverrouillee = estProgrammeMaitrise(contexteEtape.theme);
                celebration = obtenirCelebrationEtape(contexteEtape.etape, false, evaluationDeverrouillee);
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
    // Une révision globale, une catégorie ou un entraînement peut achever
    // plusieurs étapes. Leur validation ne dépend pas du chemin emprunté.
    const celebrations = celebration ? [celebration] : [];
    const etapesVues = new Set();
    for (const question of etat.questionsSession) {
        if (question.estEvaluationFinale || question.missionSigles || question.missionMesures) continue;
        const cle = `${question.theme}:${question.etape}`;
        if (etapesVues.has(cle)) continue;
        etapesVues.add(cle);
        if (!estEtapeMaitrisee(question.theme, question.etape)) continue;
        const bilan = obtenirBilanEtape(question.theme, question.etape);
        if (bilan.celebrationSansJokerAffichee) continue;
        bilan.celebrationSansJokerAffichee = true;
        celebrations.push(obtenirCelebrationEtape(question.etape, false, estProgrammeMaitrise(question.theme)));
    }
    celebration = celebrations.length > 1 ? {
        titre: `${celebrations.length} étapes maîtrisées !`,
        message: 'Toutes les questions de ces étapes ont été validées sans joker. Ta progression est à jour.',
        confetti: true
    } : celebrations[0] || null;
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
                message: `Tu as validé les ${THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0)} étapes et réussi les ${THEMES.length} évaluations finales. Tous tes parcours Quiz CJPM sont terminés.`,
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
        messageResultat = `${autonomes}, ${reussitesAidees} et ${activitesPassees}. Les activités à consolider sont détaillées ci-dessous.`;
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
        messageResultat = `${autonomes} et ${reussitesAidees}. Les questions à consolider restent disponibles dans la révision.`;
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
            boutonContinuer.textContent = 'Voir ma progression →';
            boutonContinuer.onclick = () => afficherEcran('progression', { remplacerHistorique: true });
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
            : (estParcoursCompletReussi() ? 'Ton parcours complet est validé.' : 'Tu peux retravailler les questions à consolider puis refaire cette évaluation.');
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
function ouvrirEtapeDepuisCarteFinale(identifiantTheme, numeroEtape) {
    ouvrirParcours(identifiantTheme, { remplacerHistorique: true });
    requestAnimationFrame(() => {
        const etape = selectionner(`#parcours [data-etape="${numeroEtape}"]`);
        etape?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        etape?.focus({ preventScroll: true });
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
            bouton.style.setProperty('--couleur-etape', obtenirCouleurEtapeAtlas(theme.id, etapeProgramme.id));
            bouton.innerHTML = `${obtenirBaliseIconeEtape(etapeProgramme.id, theme.id)}<span>P${indexTheme + 1}·${etapeProgramme.id}</span>`;
            bouton.setAttribute('aria-label', `Ouvrir le parcours ${indexTheme + 1}, étape ${etapeProgramme.id} · ${etapeProgramme.titre}`);
            bouton.onclick = () => ouvrirEtapeDepuisCarteFinale(theme.id, etapeProgramme.id);
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
    if (estSessionMissionSigles()) {
        terminerSessionMissionSiglesNative();
        return;
    }
    if (estSessionMissionMesures()) {
        terminerSessionMissionMesuresNative();
        return;
    }
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
    selectionner('#contexteBilan').textContent = obtenirContexteFinSession();
    selectionner('#titreBilan').textContent = bilan.titre;
    selectionner('#rangBilan').textContent = bilan.messageResultat;
    const questionsAReprendre = obtenirQuestionsAConsoliderSession();
    afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees);
    configurerBoutonContinuerBilan();
    actualiserProchaineDestinationBilan();
    afficherCarteVoyageFinale();
    terminerSauvegardeSession();
    afficherEcran('bilan', { remplacerHistorique: true });
    actualiserAccueil();
    lancerCelebrationBilan(bilan.celebration);
}

function rejouerQuestionsAConsoliderBilan() {
    const questions = obtenirQuestionsAConsoliderSession();
    if (!questions.length)
        return;
    const progression = etat.progressionAvantRevision;
    const titre = 'Questions à consolider de ma session';
    if (estSessionMissionSigles() || estSessionMissionMesures()) {
        const sigles = estSessionMissionSigles();
        const cleMeta = sigles ? 'missionSiglesMeta' : 'missionMesuresMeta';
        const cibles = [...new Map(questions.flatMap(question => sigles
            ? obtenirCiblesMissionQuestion(question) : obtenirCiblesMissionMesuresQuestion(question))
            .map(cible => [sigles ? cible.sigle : cible.cle, cible])).values()];
        const reprises = questions.map(question => ({ ...question, estEvaluationFinale: false,
            [cleMeta]: { ...question[cleMeta], mode: 'revision' } }));
        const configuration = { mode: 'revision', questions: reprises, questionsDejaConverties: true,
            jokersActifs: false, titre };
        if (sigles)
            preparerSessionMissionSiglesNative({ ...configuration, sigles: cibles });
        else
            preparerSessionMissionMesuresNative({ ...configuration, reperes: cibles });
    }
    else {
        etat.mode = 'revision';
        etat.perimetreRevision = null;
        etat.origineSessionAnalytics = 'revision_des_erreurs';
        etat.jokersSessionActifs = false;
        etat.chronometreSessionActif = false;
        lancerSession(questions);
    }
    etat.progressionAvantRevision = progression || null;
    actualiserBoutonReprendreEtapeDepuisDebut(etat.questionCourante);
    enregistrerSessionEnCours();
}
