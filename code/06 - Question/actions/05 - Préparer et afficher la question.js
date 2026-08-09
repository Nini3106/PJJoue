/**
 * Préparer la question courante et les éléments visibles autour de la carte de question.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
function rejouerQuestionCourante() {
    const question = etat.questionCourante;
    if (!question || !etat.questionValidee)
        return;
    const nombreReprises = etat.tentativesQuestions?.get(question.id) || 0;
    if (nombreReprises >= 1) {
        afficherNotification('Cette question a déjà été rejouée une fois.');
        return;
    }
    const precedent = etat.reponsesSession.get(question.id);
    envoyerEvenementPJJ('question_rejouee', {
        ...obtenirContexteQuestionAnalytics(question),
        pjjoue_resultat_reponse: obtenirResultatReponseAnalytics(precedent?.statut || 'incorrecte')
    });
    etat.tentativesQuestions = etat.tentativesQuestions || new Map();
    etat.tentativesQuestions.set(question.id, 1);
    etat.reponsesSession.set(question.id, { ...(precedent || {}), statut: 'passee' });
    etat.questionValidee = false;
    etat.brouillonActivite = null;
    afficherQuestion();
    enregistrerSessionEnCours();
    annoncer('Question prête à être rejouée.');
}
// -----------------------------------------------------------------------------
// Déroulement d’une question, chronomètre et correction
// -----------------------------------------------------------------------------
function preparerQuestionCourante() {
    fermerFenetreJokers({ restaurerFocus: false });
    const boutonValiderCourant = selectionner('#boutonValider');
    if (boutonValiderCourant) {
        boutonValiderCourant.classList.add('masque');
        boutonValiderCourant.removeAttribute('data-action');
    }

    clearInterval(etat.identifiantMinuteur);
    etat.questionCourante = etat.questionsSession[etat.indexQuestion];
    marquerEtapeDecouverte(etat.questionCourante);
    marquerQuestionJouee(etat.questionCourante);
    enregistrerSauvegarde();

    const question = etat.questionCourante;
    const reponse = etat.reponsesSession.get(question.id);
    const dejaPassee = reponse?.statut === 'passee';

    etat.jokersQuestions = etat.jokersQuestions || new Map();
    if (!etat.jokersQuestions.has(question.id)) {
        etat.jokersQuestions.set(question.id, {
            cinquanteCinquante: true,
            indice: true,
            langueAuChat: true
        });
    }
    etat.jokers = etat.jokersQuestions.get(question.id);
    etat.questionValidee = Boolean(reponse) && !dejaPassee;

    const carteQuestion = document.querySelector('#question .question');
    carteQuestion?.classList.remove('jalon-valide');
    carteQuestion?.classList.remove('question-apparition');
    void carteQuestion?.offsetWidth;
    carteQuestion?.classList.add('question-apparition');

    return { question, reponse, dejaPassee };
}

function afficherReperesQuestion(question) {
    const theme = THEMES.find(themeCandidat => themeCandidat.id === question.theme);
    const etapeProgramme = obtenirEtapeProgramme(question.theme, question.etape);
    const valeurProgression = Math.round(
        (etat.indexQuestion + 1) / etat.questionsSession.length * 100
    );
    const modeEvaluationFinale = etat.mode === 'evaluation-finale';
    const positionParcours = modeEvaluationFinale
        ? `Évaluation finale · Défi ${etat.indexQuestion + 1}/${etat.questionsSession.length}`
        : `Étape ${question.etape} · Défi ${etat.indexQuestion + 1}/${etat.questionsSession.length}`;
    const nomDestination = modeEvaluationFinale
        ? 'Destination finale'
        : (etapeProgramme?.titre || 'Parcours guidé');
    const repereProcedureLocale = question.procedureLocale
        ? '<span class="repere local repere-locale">Procédure locale</span>'
        : '';

    selectionner('#compteurQuestion').textContent =
        `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
    selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
    selectionner('#progressionQuestion').parentElement?.setAttribute(
        'aria-valuenow',
        String(valeurProgression)
    );
    selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
    selectionner('#reperesQuestion').innerHTML =
        `<span class="repere repere-position"><small>Position actuelle</small>`
        + `<b>${positionParcours}</b></span>`
        + `<span class="repere repere-theme">${creerIconeTheme(theme.id, theme.titre)}`
        + `<span><small>${nomDestination}</small><b>${theme.titre}</b></span></span>`
        + repereProcedureLocale;
}

function creerBoutonChoixUnique(proposition, indice, reponse, dejaPassee) {
    const bouton = document.createElement('button');
    bouton.className = 'reponse';
    bouton.dataset.indiceReponse = indice;
    bouton.dataset.estCorrecte = proposition.estCorrecte ? '1' : '0';
    bouton.setAttribute('role', 'radio');
    bouton.setAttribute(
        'aria-checked',
        reponse?.texteReponse === proposition.texte ? 'true' : 'false'
    );
    bouton.innerHTML =
        `<span class="lettre">${'ABCD'[indice]}</span>`
        + `<span>${proposition.texte}</span>`;

    const donneesJoker = obtenirDonneesJoker5050();
    if (
        donneesJoker?.nature === 'choix-unique'
        && donneesJoker.textesRetires?.includes(proposition.texte)
    ) {
        bouton.classList.add('retire');
    }

    if (reponse && !dejaPassee) {
        bouton.disabled = true;
    }
    else {
        bouton.onclick = () => choisirReponse(bouton, proposition);
    }
    return bouton;
}

function afficherChoixUnique(question, reponse, dejaPassee) {
    const zone = selectionner('#zoneReponses');
    zone.setAttribute('role', 'radiogroup');
    zone.setAttribute('aria-label', 'Choix de réponse');
    obtenirChoixQuestion(question).forEach((proposition, indice) => {
        zone.appendChild(creerBoutonChoixUnique(proposition, indice, reponse, dejaPassee));
    });
}

function afficherModeReponseQuestion(question, reponse, dejaPassee) {
    const zone = selectionner('#zoneReponses');
    zone.className = 'reponses';
    zone.innerHTML = '';

    const modePresentation = question.modePresentation || obtenirModeQuestion(question);
    const libelleMode = question.libelleMode || obtenirLibelleMode(modePresentation);
    selectionner('#reperesQuestion').insertAdjacentHTML(
        'beforeend',
        `<span class="repere mode-repere">${libelleMode}</span>`
    );

    if (modePresentation === 'reponse-ecrite') {
        afficherActiviteEcrite(reponse);
    }
    else if (modePresentation === 'eliminer') {
        afficherActiviteEliminer(question, reponse);
    }
    else if (question.activite && question.activite.type !== 'choix-unique') {
        afficherActiviteInteractive(question, reponse);
    }
    else {
        afficherChoixUnique(question, reponse, dejaPassee);
    }
}

function configurerNavigationQuestion(dejaPassee, modeEvaluationFinale) {
    selectionner('#zoneIndice').className = 'correction masque';
    selectionner('#zoneCorrection').className = 'correction masque';
    selectionner('#boutonQuestionPrecedente').disabled = etat.indexQuestion === 0;

    const boutonPasser = selectionner('#boutonPasser');
    const boutonSuivant = selectionner('#boutonQuestionSuivante');
    boutonPasser.classList.toggle('masque', etat.questionValidee || modeEvaluationFinale);
    boutonPasser.disabled = etat.questionValidee || modeEvaluationFinale;
    boutonSuivant.classList.toggle('masque', !etat.questionValidee);

    if (dejaPassee) {
        boutonSuivant.classList.add('masque');
        boutonPasser.classList.remove('masque');
        boutonPasser.disabled = false;
    }
}

function configurerJokersQuestion(jokersActifs) {
    const bouton5050 = selectionner('#boutonJoker5050');
    const boutonIndice = selectionner('#boutonJokerIndice');
    const boutonLangueAuChat = selectionner('#boutonJokerLangueAuChat');

    bouton5050.classList.remove('masque');
    bouton5050.disabled =
        !jokersActifs || etat.questionValidee || !etat.jokers.cinquanteCinquante;
    bouton5050.title = !etat.jokers.cinquanteCinquante
        ? 'Joker déjà utilisé pour cette activité.'
        : 'Donner environ la moitié de la résolution, quel que soit le mode de réponse.';

    boutonIndice.disabled = !jokersActifs || etat.questionValidee || !etat.jokers.indice;
    boutonIndice.title = !etat.jokers.indice
        ? 'Indice déjà utilisé pour cette activité.'
        : 'Afficher un indice adapté à cette activité.';

    boutonLangueAuChat.disabled =
        !jokersActifs || etat.questionValidee || !etat.jokers.langueAuChat;
    boutonLangueAuChat.title = !etat.jokers.langueAuChat
        ? 'Joker déjà utilisé pour cette activité.'
        : 'Dévoiler toute la réponse attendue grâce au joker « Langue au chat ».';

    actualiserBoutonJokers();
}

function configurerChronometreEtFocusQuestion(jokersActifs, modeEvaluationFinale) {
    if (!etat.questionValidee) {
        demarrerChronometreQuestion();
        if (jokersActifs && !modeEvaluationFinale) {
            programmerRappelJokers();
        }
    }
    else {
        selectionner('#chronometreQuestion').textContent = '';
        annulerRappelJokers();
    }

    const enonce = selectionner('#enonceQuestion');
    enonce.setAttribute('tabindex', '-1');
    enonce.focus({ preventScroll: true });
}

function appliquerIdentiteVisuelleEtape(question) {
    const programme = PROGRAMMES[question?.theme];
    const etapeProgramme = programme?.etapes?.find(
        etape => Number(etape.id) === Number(question?.etape)
    );
    document.documentElement.style.setProperty(
        '--couleur-etape-active',
        etapeProgramme?.couleur || '#ffc83d'
    );
    document.body.dataset.etapeActive = String(question?.etape || 'libre');
}
function actualiserSuiviEtapeQuestion(question) {
    const conteneur = selectionner('#contexteEtapeQuestion');
    const numero = selectionner('#numeroEtapeQuestion');
    const titre = selectionner('#titreEtapeQuestion');
    const suivi = selectionner('#suiviSansJokerQuestion');
    const compteur = selectionner('#compteurSansJokerQuestion');
    const boutonReinitialiser = selectionner('#boutonReinitialiserValidationsSansJoker');
    if (!conteneur || !numero || !titre || !suivi || !compteur || !boutonReinitialiser || !question)
        return;
    const finale = etat.mode === 'evaluation-finale' || Number(question.etape) === 12;
    const etapeProgramme = obtenirEtapeProgramme(question.theme, question.etape);
    numero.textContent = finale ? 'Étape 12' : `Étape ${question.etape}`;
    titre.textContent = finale ? 'Évaluation finale' : (etapeProgramme?.titre || 'Parcours PJJ');
    suivi.classList.toggle('masque', finale || etat.mode !== 'parcours');
    if (finale || etat.mode !== 'parcours')
        return;
    const questionsEtape = obtenirQuestionsEtape(question.theme, question.etape);
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    compteur.textContent = `${nombreAutonomes}/${questionsEtape.length}`;
    boutonReinitialiser.disabled = nombreAutonomes === 0;
    boutonReinitialiser.setAttribute(
        'aria-label',
        `Réinitialiser les ${nombreAutonomes} questions validées sans joker de l’étape ${question.etape}`
    );
}
function demanderReinitialisationSansJoker() {
    const question = etat.questionCourante;
    if (!question || etat.mode !== 'parcours')
        return;
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    if (!nombreAutonomes)
        return;
    ouvrirFenetreMessage({
        titre: 'Réinitialiser le compteur sans joker ?',
        message: `Les ${nombreAutonomes} validations sans joker de cette étape ne compteront plus pour ouvrir l’évaluation finale. Ta progression générale reste conservée.`,
        libelleConfirmer: 'Réinitialiser',
        libelleAnnuler: 'Annuler',
        afficherAnnuler: true,
        variante: 'avertissement',
        apresConfirmation: () => reinitialiserValidationSansJokerEtape(question.theme, question.etape)
    });
}
