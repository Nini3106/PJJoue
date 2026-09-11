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
    if (!etat.questionCourante?.missionSigles && !etat.questionCourante?.missionMesures) {
        marquerEtapeDecouverte(etat.questionCourante);
        marquerQuestionJouee(etat.questionCourante);
    }
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

const IDENTITE_PARCOURS_MINI_JEUX = Object.freeze({
    couleur: '#4f8cff',
    couleurTexte: '#9fc2ff',
    couleurRgb: '79,140,255'
});

function obtenirIdentiteParcoursQuestion(question) {
    if (question?.missionSigles || question?.missionMesures) {
        return IDENTITE_PARCOURS_MINI_JEUX;
    }
    return obtenirIdentiteParcours(question?.theme);
}

function appliquerIdentiteParcoursQuestion(question) {
    const identite = obtenirIdentiteParcoursQuestion(question);
    const ecranQuestion = selectionner('#question');
    ecranQuestion?.style.setProperty('--parcours-accent', identite.couleur);
    ecranQuestion?.style.setProperty(
        '--parcours-accent-lisible',
        identite.couleurTexte || identite.couleur
    );
    ecranQuestion?.style.setProperty('--parcours-accent-rgb', identite.couleurRgb || '79,140,255');
}

function afficherReperesQuestion(question) {
    if (question?.missionSigles) {
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        const valeurProgression = Math.round((etat.indexQuestion + 1) / etat.questionsSession.length * 100);
        selectionner('#compteurQuestion').textContent = `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
        selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
        selectionner('#progressionQuestion').parentElement?.setAttribute('aria-valuenow', String(valeurProgression));
        selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
        selectionner('#reperesQuestion').innerHTML = `<span class="repere repere-theme"><span class="icone-theme" aria-hidden="true">Aa</span><b>Mission Sigles · Étape ${identite.numero}</b></span>`;
        return;
    }
    if (question?.missionMesures) {
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionMesures(numeroEtape);
        const valeurProgression = Math.round((etat.indexQuestion + 1) / etat.questionsSession.length * 100);
        selectionner('#compteurQuestion').textContent = `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
        selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
        selectionner('#progressionQuestion').parentElement?.setAttribute('aria-valuenow', String(valeurProgression));
        selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
        selectionner('#reperesQuestion').innerHTML = `<span class="repere repere-theme"><b>Mission Mesures · Étape ${String(numeroEtape).padStart(2,'0')}</b></span>`;
        return;
    }
    const theme = THEMES.find(themeCandidat => themeCandidat.id === question.theme);
    const identite = obtenirIdentiteParcours(question.theme);
    const valeurProgression = Math.round(
        (etat.indexQuestion + 1) / etat.questionsSession.length * 100
    );
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
        `<span class="repere repere-theme">${creerIconeTheme(theme.id, identite.titre)}`
        + `<b>Parcours ${identite.numero} · ${identite.titre}</b></span>`
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
    if (modePresentation === 'choix-unique') {
        selectionner('#reperesQuestion').insertAdjacentHTML(
            'beforeend',
            `<span class="repere mode-repere">${libelleMode}</span>`
        );
    }

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
    let couleurEtape = '#2d7379';
    let couleurEtapeLisible = couleurEtape;
    let identifiantEtape = String(question?.etape || 'libre');

    if (question?.missionSigles) {
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        couleurEtape = identite.couleur;
        couleurEtapeLisible = identite.couleurTexte || identite.couleur;
        identifiantEtape = `sigles-${numeroEtape}`;
    }
    else if (question?.missionMesures) {
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionMesures(numeroEtape);
        couleurEtape = identite.couleur;
        couleurEtapeLisible = identite.couleurTexte || identite.couleur;
        identifiantEtape = `mesures-${numeroEtape}`;
    }
    else {
        const programme = PROGRAMMES[question?.theme];
        const etapeProgramme = programme?.etapes?.find(
            etape => Number(etape.id) === Number(question?.etape)
        );
        couleurEtape = etapeProgramme?.couleur || obtenirCouleurTitreEtape(question?.etape);
        couleurEtapeLisible = couleurEtape;
    }

    document.documentElement.style.setProperty('--couleur-etape-active', couleurEtape);
    document.documentElement.style.setProperty('--couleur-etape-active-lisible', couleurEtapeLisible);
    document.documentElement.style.setProperty('--couleur-fil-association', couleurEtape);
    document.body.dataset.etapeActive = identifiantEtape;
    appliquerIdentiteParcoursQuestion(question);
}
function actualiserSuiviEtapeQuestion(question) {
    const conteneur = selectionner('#contexteEtapeQuestion');
    const identiteParcoursQuestion = selectionner('#identiteParcoursQuestion');
    const numeroParcours = selectionner('#numeroParcoursQuestion');
    const titreParcours = selectionner('#titreParcoursQuestion');
    const numero = selectionner('#numeroEtapeQuestion');
    const titre = selectionner('#titreEtapeQuestion');
    const suivi = selectionner('#suiviSansJokerQuestion');
    const compteur = selectionner('#compteurSansJokerQuestion');
    const boutonReinitialiser = selectionner('#boutonReinitialiserValidationsSansJoker');
    if (!conteneur || !identiteParcoursQuestion || !numeroParcours || !titreParcours || !numero || !titre || !suivi || !compteur || !boutonReinitialiser || !question)
        return;
    if (question.missionSigles) {
        identiteParcoursQuestion.classList.remove('masque');
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        const finaleMission = obtenirModeMissionSigles() === 'evaluation';
        numeroParcours.textContent = 'Mission Sigles';
        titreParcours.textContent = 'Mission Sigles';
        numero.textContent = finaleMission ? 'Évaluation finale' : `Étape ${numeroEtape}`;
        titre.textContent = finaleMission ? 'Expert des sigles' : identite.titre;
        suivi.classList.toggle('masque', finaleMission || obtenirModeMissionSigles() !== 'parcours');
        if (!finaleMission && obtenirModeMissionSigles() === 'parcours') {
            compteur.textContent = `${compterMaitrisesEtapeSigles(numeroEtape)}/${NOMBRE_SIGLES_PAR_ETAPE}`;
            boutonReinitialiser.disabled = compterMaitrisesEtapeSigles(numeroEtape) === 0;
        }
        return;
    }
    if (question.missionMesures) {
        identiteParcoursQuestion.classList.remove('masque');
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionMesures(numeroEtape);
        const finaleMission = obtenirModeMissionMesures() === 'evaluation';
        numeroParcours.textContent = 'Mission Mesures';
        titreParcours.textContent = 'Mission Mesures';
        numero.textContent = finaleMission ? 'Évaluation finale' : `Étape ${String(numeroEtape).padStart(2,'0')}`;
        titre.textContent = finaleMission ? 'Maîtriser les mesures' : identite.titre;
        suivi.classList.toggle('masque', finaleMission || obtenirModeMissionMesures() !== 'parcours');
        if (!finaleMission && obtenirModeMissionMesures() === 'parcours') {
            const total = obtenirReperesMesuresEtape(numeroEtape).length;
            compteur.textContent = `${compterMaitrisesEtapeMesures(numeroEtape)}/${total}`;
            boutonReinitialiser.disabled = compterMaitrisesEtapeMesures(numeroEtape) === 0;
        }
        return;
    }
    identiteParcoursQuestion.classList.remove('masque');
    const finale = etat.mode === 'evaluation-finale' || Number(question.etape) === 12;
    const etapeProgramme = obtenirEtapeProgramme(question.theme, question.etape);
    const identite = obtenirIdentiteParcours(question.theme);
    numeroParcours.textContent = `Parcours ${identite.numero}`;
    titreParcours.textContent = identite.titre;
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
        `Réinitialiser les ${nombreAutonomes} questions maîtrisées sans aide de l’étape ${question.etape}`
    );
}
function demanderReinitialisationSansJoker() {
    const question = etat.questionCourante;
    if (question?.missionSigles) {
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const nombreAutonomes = compterMaitrisesEtapeSigles(numeroEtape);
        if (!nombreAutonomes) return;
        ouvrirFenetreMessage({
            titre:'Réinitialiser la maîtrise sans aide ?',
            message:`Les ${nombreAutonomes} validations autonomes de cette étape Mission Sigles seront effacées.`,
            libelleConfirmer:'Réinitialiser', libelleAnnuler:'Annuler', afficherAnnuler:true, variante:'avertissement',
            apresConfirmation:()=>reinitialiserMaitriseEtapeMissionSigles(numeroEtape)
        });
        return;
    }
    if (question?.missionMesures) {
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const nombreAutonomes = compterMaitrisesEtapeMesures(numeroEtape);
        if (!nombreAutonomes) return;
        ouvrirFenetreMessage({
            titre:'Réinitialiser la maîtrise sans aide ?',
            message:`Les ${nombreAutonomes} validations autonomes de cette étape Mission Mesures seront effacées.`,
            libelleConfirmer:'Réinitialiser', libelleAnnuler:'Annuler', afficherAnnuler:true, variante:'avertissement',
            apresConfirmation:()=>reinitialiserMaitriseEtapeMissionMesures(numeroEtape)
        });
        return;
    }
    if (!question || etat.mode !== 'parcours')
        return;
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    if (!nombreAutonomes)
        return;
    ouvrirFenetreMessage({
        titre: 'Réinitialiser la maîtrise sans aide ?',
        message: `Les ${nombreAutonomes} validations autonomes de cette étape seront effacées. Les questions déjà travaillées et ta progression générale restent conservées.`,
        libelleConfirmer: 'Réinitialiser',
        libelleAnnuler: 'Annuler',
        afficherAnnuler: true,
        variante: 'avertissement',
        apresConfirmation: () => reinitialiserValidationSansJokerEtape(question.theme, question.etape)
    });
}
