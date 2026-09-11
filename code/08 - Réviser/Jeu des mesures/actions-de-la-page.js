/**
 * Mission Mesures — mini-PJJoue V1.
 *
 * Les repères suivent le temps juridique. Une notion n'est jamais testée sous
 * forme abrégée avant une première question qui l'a montrée en toutes lettres.
 */
const SEUIL_EVALUATION_MESURES = 90;
const NOMBRE_QUESTIONS_EVALUATION_MESURES = 30;
const REPERES_MISSION_MESURES = Object.freeze([...(MESURES_MISSION?.reperes || [])]);
const ETAPES_MISSION_MESURES = Object.freeze(Object.fromEntries(
    (MESURES_MISSION?.etapes || []).map(etape => [Number(etape.numero), Object.freeze({
        ...etape,
        numeroFormate: String(etape.numero).padStart(2, '0')
    })])
));
const DEVELOPPEMENTS_SIGLES_MESURES = Object.freeze({
    RRSE:'recueil de renseignements socio-éducatifs',
    MJIE:'mesure judiciaire d’investigation éducative',
    MEJP:'mesure éducative judiciaire provisoire',
    MEJ:'mesure éducative judiciaire',
    MEE:'mise à l’épreuve éducative',
    CJ:'contrôle judiciaire',
    ARSE:'assignation à résidence avec surveillance électronique',
    DP:'détention provisoire',
    JE:'juge des enfants',
    TPE:'tribunal pour enfants',
    JI:'juge d’instruction',
    JLD:'juge des libertés et de la détention',
    CAM:'cour d’assises des mineurs',
    JAP:'juge de l’application des peines',
    PJJ:'protection judiciaire de la jeunesse',
    ASE:'aide sociale à l’enfance',
    CEF:'centre éducatif fermé',
    DDSE:'détention à domicile sous surveillance électronique',
    TIG:'travail d’intérêt général',
    DUP:'dossier unique de personnalité',
    SPIP:'service pénitentiaire d’insertion et de probation'
});

function creerEtatJeuMesures() {
    return {
        mode:null, etape:null, titreSession:'', reperesSession:[], questions:[],
        tirageHasard:[], nombreTire:0, celebrationEtapeADiffuser:null,
        configurationDerniereSession:null
    };
}
let etatJeuMesures = creerEtatJeuMesures();

function selectionnerMesures(selecteur) { return document.querySelector(selecteur); }
function normaliserCleMesure(cle) { return String(cle || '').trim(); }
function obtenirReperesMesuresEtape(numero) {
    return REPERES_MISSION_MESURES.filter(element => Number(element.etape) === Number(numero)).sort((a,b) => Number(a.id) - Number(b.id));
}
function obtenirRepereMesure(cle) { return REPERES_MISSION_MESURES.find(element => normaliserCleMesure(element.cle) === normaliserCleMesure(cle)) || null; }
function melangerMesures(tableau) {
    const copie = [...tableau];
    for (let i = copie.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
}
function choisirMesuresSansDoublon(tableau, nombre) { return melangerMesures(tableau).slice(0, Math.min(Math.max(0, nombre), tableau.length)); }
function obtenirSauvegardeJeuMesures() {
    if (!sauvegarde.mesuresJeu) sauvegarde.mesuresJeu = creerProgressionMesuresInitiale();
    return sauvegarde.mesuresJeu;
}
function repereMesureEstIntroduit(cle) { return obtenirSauvegardeJeuMesures().decouverts[normaliserCleMesure(cle)] === true; }
function marquerRepereMesureIntroduit(cle) { obtenirSauvegardeJeuMesures().decouverts[normaliserCleMesure(cle)] = true; }
function obtenirEtatEtapeMesures(numero) {
    const jeu = obtenirSauvegardeJeuMesures();
    const cle = String(numero);
    if (!jeu.etapes[cle]) jeu.etapes[cle] = creerProgressionMesuresInitiale().etapes[cle];
    return jeu.etapes[cle];
}
function compterMaitrisesEtapeMesures(numero) {
    const etape = obtenirEtatEtapeMesures(numero);
    return obtenirReperesMesuresEtape(numero).filter(element => etape.autonomes[normaliserCleMesure(element.cle)] === true).length;
}
function compterValidationsSansJokerEtapeMesures(numero) {
    const etape = obtenirEtatEtapeMesures(numero);
    return obtenirReperesMesuresEtape(numero).filter(element => etape.validationsSansJoker[normaliserCleMesure(element.cle)] === true).length;
}
function etapeMesuresMaitrisee(numero) {
    const total = obtenirReperesMesuresEtape(numero).length;
    return total > 0 && compterMaitrisesEtapeMesures(numero) === total;
}
function numerosEtapesMissionMesures() { return Object.keys(ETAPES_MISSION_MESURES).map(Number).sort((a,b) => a-b); }
function evaluationMesuresDebloquee() { return numerosEtapesMissionMesures().every(etapeMesuresMaitrisee); }
function obtenirErreursMesuresActives() {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs || {};
    return Object.entries(erreurs).filter(([,erreur]) => erreur?.active === true).map(([cle]) => obtenirRepereMesure(cle)).filter(Boolean);
}
function enregistrerErreurMesures(cibles) {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserCleMesure(cible.cle);
        const actuelle = erreurs[cle] || { active:false, nombreErreurs:0, reussitesRevision:0 };
        erreurs[cle] = { active:true, nombreErreurs:Number(actuelle.nombreErreurs || 0) + 1, reussitesRevision:0 };
    });
}
function validerRevisionMesures(cibles) {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs;
    cibles.forEach(cible => {
        const actuelle = erreurs[normaliserCleMesure(cible.cle)];
        if (!actuelle?.active) return;
        actuelle.reussitesRevision = 1;
        actuelle.active = false;
    });
}

function obtenirIdentiteEtapeMissionMesures(numero) { return ETAPES_MISSION_MESURES[Number(numero)] || ETAPES_MISSION_MESURES[1]; }
function obtenirThemeVisuelMissionMesures(numero) {
    const themes = ['commun','procedure_ordinaire','information_judiciaire','jugement_educatif_ordinaire','matiere_criminelle_peines','application_execution_peines'];
    return themes[(Math.max(1, Number(numero) || 1) - 1) % themes.length];
}
function iconeEtapeMesures(numero) {
    const traces = [
        '<path d="M4 19h16M7 16V8h10v8M9 8V5h6v3"/>',
        '<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6zM8 12h8"/>',
        '<path d="M4 4h10l3 3v13H4zM14 4v3h3M7 11h6"/>',
        '<path d="M12 3v18M5 7h14M7 7l-3 6h6zM17 7l-3 6h6z"/>',
        '<path d="M5 5h14v14H5zM8 9h8M8 13h5"/>',
        '<path d="M4 6h16M6 6v13M18 6v13M8 11h8M8 15h8"/>',
        '<path d="M3 19h18M7 16h10M9 4h6v5c0 3-1 5-3 5s-3-2-3-5z"/>',
        '<path d="M4 18h5V8h6v10h5M3 20h18"/>',
        '<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6zM9 12l2 2 4-5"/>',
        '<path d="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5"/>',
        '<path d="M4 12h16M8 5v14M16 5v14M6 7h4M14 7h4"/>',
        '<path d="M4 8a8 8 0 1 1 0 8M4 4v4H1M9 12l2 2 4-5"/>'
    ];
    return `<svg viewBox="0 0 24 24" focusable="false">${traces[(Number(numero)-1) % traces.length]}</svg>`;
}

function texteAvecSiglesDeveloppesSiNecessaire(texte, siglesDejaVus) {
    let resultat = String(texte || '');
    Object.entries(DEVELOPPEMENTS_SIGLES_MESURES).forEach(([sigle, developpement]) => {
        if (siglesDejaVus.has(sigle) || !new RegExp(`\\b${sigle}\\b`).test(resultat)) return;
        if (resultat.toLocaleLowerCase('fr').includes(developpement.toLocaleLowerCase('fr'))) return;
        resultat = resultat.replace(new RegExp(`\\b${sigle}\\b`, 'g'), `${developpement} (${sigle})`);
    });
    return resultat;
}
function releverSiglesVus(texte, siglesDejaVus) {
    Object.keys(DEVELOPPEMENTS_SIGLES_MESURES).forEach(sigle => {
        if (new RegExp(`\\b${sigle}\\b`).test(String(texte || ''))) siglesDejaVus.add(sigle);
    });
}
function creerQuestionChoixMesure(cible, nature, siglesDejaVus) {
    const introduction = nature === 'Introduction';
    const consigneBrute = cible[`question${nature}`];
    const bonneBrute = cible[`bonneReponse${nature}`];
    const distracteursBruts = cible[`distracteurs${nature}`] || [];
    const consigne = texteAvecSiglesDeveloppesSiNecessaire(consigneBrute, siglesDejaVus);
    const bonne = texteAvecSiglesDeveloppesSiNecessaire(bonneBrute, siglesDejaVus);
    const distracteurs = distracteursBruts.map(texte => texteAvecSiglesDeveloppesSiNecessaire(texte, siglesDejaVus));
    [consigne, bonne, ...distracteurs].forEach(texte => releverSiglesVus(texte, siglesDejaVus));
    return {
        type:'choix', cibles:[cible], cible,
        estIntroduction:introduction, compteMaitrise:!introduction,
        consigne,
        options:melangerMesures([bonne, ...distracteurs]).map((texte,index) => ({ id:`mes-${cible.id}-${nature}-${index}`, texte, correcte:texte === bonne })),
        explication:cible[`explication${nature}`] || '',
        indice:cible[`indice${nature}`] || ''
    };
}
function creerQuestionEcriteSigleMesure(cible) {
    const developpement = String(cible.developpement || '').trim();
    return {
        type:'ecrit', cibles:[cible], cible, estIntroduction:false, compteMaitrise:true,
        consigne:`Écris en toutes lettres ce que signifie ${cible.sigle}.`,
        bonneReponse:developpement,
        reponsesAcceptees:[developpement, developpement.toLocaleLowerCase('fr')],
        explication:`${cible.sigle} signifie « ${developpement} ».`,
        indice:'Le sigle a déjà été développé dans une question précédente de Mission Mesures.'
    };
}
function premiereClePourSigle(sigle) {
    return REPERES_MISSION_MESURES.find(element => element.sigle === sigle)?.cle || null;
}
function creerQuestionsEtapeMesures(numero) {
    const pool = obtenirReperesMesuresEtape(numero);
    const questions = [];
    const siglesVus = new Set();
    pool.forEach(cible => {
        if (!repereMesureEstIntroduit(cible.cle)) questions.push(creerQuestionChoixMesure(cible, 'Introduction', siglesVus));
        questions.push(creerQuestionChoixMesure(cible, 'Rappel', siglesVus));
        if (cible.sigle && cible.developpement && premiereClePourSigle(cible.sigle) === cible.cle) questions.push(creerQuestionEcriteSigleMesure(cible));
    });
    return questions;
}
function creerQuestionsEntrainementMesures(cibles, melange = false) {
    const ordre = melange ? melangerMesures(cibles) : [...cibles];
    const siglesVus = new Set();
    return ordre.map(cible => repereMesureEstIntroduit(cible.cle)
        ? creerQuestionChoixMesure(cible, 'Rappel', siglesVus)
        : creerQuestionChoixMesure(cible, 'Introduction', siglesVus));
}
function creerQuestionsRevisionMesures(cibles) {
    const siglesVus = new Set(Object.keys(DEVELOPPEMENTS_SIGLES_MESURES));
    return cibles.map(cible => creerQuestionChoixMesure(cible, 'Rappel', siglesVus));
}
function creerQuestionsEvaluationMesures() {
    return choisirMesuresSansDoublon(MESURES_MISSION.evaluation || [], NOMBRE_QUESTIONS_EVALUATION_MESURES).map(question => ({
        type:'evaluation', cibles:[], cible:null, compteMaitrise:false, estIntroduction:false,
        etape:Number(question.etape), identifiantEvaluation:question.id,
        consigne:question.question,
        options:melangerMesures([question.bonneReponse, ...(question.distracteurs || [])]).map((texte,index) => ({ id:`eval-mes-${question.id}-${index}`, texte, correcte:texte === question.bonneReponse })),
        explication:question.explication,
        indice:'', source:question.source
    }));
}

function construireCartesEtapesMesures() {
    const zone = selectionnerMesures('#mesuresEtapes');
    if (!zone) return;
    zone.innerHTML = numerosEtapesMissionMesures().map(numero => {
        const identite = obtenirIdentiteEtapeMissionMesures(numero);
        const total = obtenirReperesMesuresEtape(numero).length;
        const maitrises = compterMaitrisesEtapeMesures(numero);
        const sansJoker = compterValidationsSansJokerEtapeMesures(numero);
        const pourcentage = total ? Math.round(maitrises / total * 100) : 0;
        return `<button class="mesures-etape-carte" data-mesures-etape="${numero}" type="button" style="--mesures-etape-accent:${identite.couleur};--mesures-etape-accent-lisible:${identite.couleurTexte};--mesures-etape-rgb:${identite.couleurRgb}"><span class="mesures-etape-carte-entete"><span class="mesures-etape-icone" aria-hidden="true">${iconeEtapeMesures(numero)}</span><span class="mesures-etape-numero">ÉTAPE ${identite.numeroFormate}</span></span><h3>${identite.titre}</h3><p>${identite.sousTitre}<br>${total} repère${total===1?'':'s'} · progression juridique.</p><span class="mesures-etape-progression"><i style="width:${pourcentage}%"></i></span><span class="mesures-etape-pied"><span>${maitrises}/${total} maîtrisés · ${sansJoker}/${total} sans joker</span><span>${maitrises===total?'Maîtrisée ✓':'Ouvrir →'}</span></span></button>`;
    }).join('');
    zone.querySelectorAll('[data-mesures-etape]').forEach(bouton => bouton.addEventListener('click', () => lancerEtapeMesures(Number(bouton.dataset.mesuresEtape))));
}
function actualiserCarteEvaluationMesures() {
    const bouton = selectionnerMesures('#mesuresLancerEvaluation');
    const statut = selectionnerMesures('#mesuresEvaluationStatut');
    const debloquee = evaluationMesuresDebloquee();
    if (bouton) bouton.disabled = !debloquee;
    if (statut) statut.textContent = debloquee ? 'Toutes les étapes sont maîtrisées : évaluation disponible.' : 'Disponible après la maîtrise autonome de toutes les étapes.';
}
function actualiserAccueilMesures() {
    const jeu = obtenirSauvegardeJeuMesures();
    const introduits = Object.values(jeu.decouverts || {}).filter(Boolean).length;
    const maitrises = numerosEtapesMissionMesures().reduce((total, numero) => total + compterMaitrisesEtapeMesures(numero), 0);
    const etapesMaitrisees = numerosEtapesMissionMesures().filter(etapeMesuresMaitrisee).length;
    const erreurs = obtenirErreursMesuresActives().length;
    const pourcentage = REPERES_MISSION_MESURES.length ? Math.round(maitrises / REPERES_MISSION_MESURES.length * 100) : 0;
    selectionnerMesures('#mesuresResumeProgression') && (selectionnerMesures('#mesuresResumeProgression').textContent = `${maitrises} repère${maitrises===1?'':'s'} maîtrisé${maitrises===1?'':'s'} · ${etapesMaitrisees} étape${etapesMaitrisees===1?'':'s'} maîtrisée${etapesMaitrisees===1?'':'s'}`);
    selectionnerMesures('#mesuresNombreDecouverts') && (selectionnerMesures('#mesuresNombreDecouverts').textContent = introduits);
    selectionnerMesures('#mesuresNombreMaitrises') && (selectionnerMesures('#mesuresNombreMaitrises').textContent = maitrises);
    selectionnerMesures('#mesuresNombreErreurs') && (selectionnerMesures('#mesuresNombreErreurs').textContent = erreurs);
    selectionnerMesures('#mesuresMeilleurScore') && (selectionnerMesures('#mesuresMeilleurScore').textContent = `${jeu.evaluation?.meilleurScore || 0}%`);
    selectionnerMesures('#mesuresJaugeValeur') && (selectionnerMesures('#mesuresJaugeValeur').style.width = `${pourcentage}%`);
    selectionnerMesures('#mesuresProgressionGlobale')?.setAttribute('aria-valuenow', String(pourcentage));
    selectionnerMesures('#mesuresTexteRevision') && (selectionnerMesures('#mesuresTexteRevision').textContent = erreurs ? `${erreurs} repère${erreurs===1?'':'s'} à consolider.` : 'Aucun repère à revoir pour le moment.');
    construireCartesEtapesMesures();
    actualiserCarteEvaluationMesures();
}

function convertirQuestionMissionMesuresVersPJJoue(questionMesures, index, configuration) {
    const cible = questionMesures.cible || questionMesures.cibles?.[0] || null;
    const numeroEtape = Number(questionMesures.etape || cible?.etape || configuration.etape || 1);
    const identifiant = 920000 + (Number(cible?.id || numeroEtape * 100) * 20) + (index % 20);
    const source = questionMesures.source || cible?.source || '';
    const base = {
        id:identifiant,
        theme:obtenirThemeVisuelMissionMesures(numeroEtape),
        etape:numeroEtape,
        chapitre:1,
        ordreEtape:index + 1,
        enonce:questionMesures.consigne,
        explication:questionMesures.explication || '',
        indice:configuration.mode === 'evaluation' ? '' : (questionMesures.indice || ''),
        source,
        referencesSources:Array.isArray(source) ? source : (source ? [source] : []),
        bonneReponse:'', mauvaisesReponses:[], modePrefere:'choix-unique',
        estEvaluationFinale:configuration.mode === 'evaluation',
        missionMesures:true,
        missionMesuresMeta:{
            mode:configuration.mode,
            numeroEtape,
            cibles:(questionMesures.cibles || []).map(element => normaliserCleMesure(element.cle)),
            compteMaitrise:questionMesures.compteMaitrise === true,
            estIntroduction:questionMesures.estIntroduction === true
        }
    };
    if (questionMesures.type === 'ecrit') {
        return {
            ...base,
            bonneReponse:questionMesures.bonneReponse,
            modePrefere:'reponse-ecrite',
            libelleMode:'Réponse écrite',
            reponsesAcceptees:questionMesures.reponsesAcceptees || [questionMesures.bonneReponse],
            conceptsEvaluation:[[String(questionMesures.bonneReponse).toLocaleLowerCase('fr')]],
            nombreConceptsRequis:1
        };
    }
    const options = questionMesures.options || [];
    const correcte = options.find(option => option.correcte === true);
    return { ...base, bonneReponse:correcte?.texte || '', mauvaisesReponses:options.filter(option => option.correcte !== true).map(option => option.texte) };
}
function preparerSessionMissionMesuresNative({ mode, etape=null, reperes, questions, jokersActifs=true, titre, chronoActif=false, secondesQuestion=30, organisation='ordonne' }) {
    const configuration = { mode, etape, reperes:[...reperes], jokersActifs, titre, chronoActif, secondesQuestion, organisation };
    etatJeuMesures = { ...creerEtatJeuMesures(), mode, etape, titreSession:titre, reperesSession:[...reperes], questions:[...questions], configurationDerniereSession:configuration };
    etat.mode = `mesures-${mode}`;
    etat.theme = obtenirThemeVisuelMissionMesures(etape || reperes?.[0]?.etape || questions?.[0]?.etape || 1);
    etat.etape = Number(etape || reperes?.[0]?.etape || questions?.[0]?.etape || 1);
    etat.chapitre = 1;
    etat.origineSessionAnalytics = `mission_mesures_${mode}`;
    etat.organisationSession = organisation;
    etat.jokersSessionActifs = jokersActifs !== false;
    etat.chronometreSessionActif = chronoActif === true;
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number(secondesQuestion) || 30));
    etat.missionMesuresConfiguration = configuration;
    lancerSession(questions.map((question,index) => convertirQuestionMissionMesuresVersPJJoue(question,index,configuration)));
}
function estSessionMissionMesures() { return String(etat?.mode || '').startsWith('mesures-'); }
function obtenirModeMissionMesures() { return estSessionMissionMesures() ? String(etat.mode).replace(/^mesures-/, '') : null; }
function obtenirCiblesMissionMesuresQuestion(question) {
    return (question?.missionMesuresMeta?.cibles || []).map(cle => obtenirRepereMesure(cle)).filter(Boolean);
}
function enregistrerResultatMissionMesuresNatif(question, resultat) {
    if (!question?.missionMesures) return;
    const cibles = obtenirCiblesMissionMesuresQuestion(question);
    const meta = question.missionMesuresMeta || {};
    if (resultat.estCorrecte && meta.estIntroduction && cibles[0]) marquerRepereMesureIntroduit(cibles[0].cle);
    if (resultat.estCorrecte && meta.compteMaitrise) {
        cibles.forEach(cible => {
            const etape = obtenirEtatEtapeMesures(Number(cible.etape));
            const cle = normaliserCleMesure(cible.cle);
            if (!resultat.aideUtilisee) etape.validationsSansJoker[cle] = true;
            if (resultat.reussiteAutonome) etape.autonomes[cle] = true;
        });
        const numeros = [...new Set(cibles.map(cible => Number(cible.etape)))];
        numeros.forEach(numero => {
            const etape = obtenirEtatEtapeMesures(numero);
            if (etapeMesuresMaitrisee(numero) && !etape.celebrationAffichee) {
                etape.celebrationAffichee = true;
                etatJeuMesures.celebrationEtapeADiffuser = numero;
            }
        });
    }
    if (!resultat.estCorrecte || resultat.reussiteAidee) enregistrerErreurMesures(cibles);
    if (obtenirModeMissionMesures() === 'revision' && resultat.reussiteAutonome) validerRevisionMesures(cibles);
    enregistrerSauvegarde();
}
function enregistrerPassageMissionMesuresNatif(question) {
    if (!question?.missionMesures) return;
    enregistrerErreurMesures(obtenirCiblesMissionMesuresQuestion(question));
    enregistrerSauvegarde();
}
function reinitialiserMaitriseEtapeMissionMesures(numeroEtape) {
    const etape = obtenirEtatEtapeMesures(numeroEtape);
    etape.autonomes = {};
    etape.validationsSansJoker = {};
    etape.celebrationAffichee = false;
    enregistrerSauvegarde();
    if (etat.questionCourante?.missionMesures) actualiserSuiviEtapeQuestion(etat.questionCourante);
}

function lancerEtapeMesures(numero) {
    const reperes = obtenirReperesMesuresEtape(numero);
    const identite = obtenirIdentiteEtapeMissionMesures(numero);
    preparerSessionMissionMesuresNative({ mode:'parcours', etape:numero, reperes, questions:creerQuestionsEtapeMesures(numero), jokersActifs:true, titre:`Étape ${identite.numeroFormate} · ${identite.titre}` });
}
function lancerRevisionMesures() {
    const reperes = obtenirErreursMesuresActives();
    if (!reperes.length) {
        ouvrirFenetreMessage({ titre:'Aucune erreur à réviser', message:'Aucun repère de Mission Mesures n’est actuellement à revoir.', libelleConfirmer:'Très bien' });
        return;
    }
    preparerSessionMissionMesuresNative({ mode:'revision', reperes, questions:creerQuestionsRevisionMesures(reperes), jokersActifs:true, titre:'Réviser mes erreurs · Mission Mesures' });
}
function lancerEvaluationMesures() {
    if (!evaluationMesuresDebloquee()) {
        ouvrirFenetreMessage({ titre:'Évaluation encore verrouillée', message:'Maîtrise d’abord toutes les étapes de Mission Mesures en autonomie.', libelleConfirmer:'Compris' });
        return;
    }
    preparerSessionMissionMesuresNative({ mode:'evaluation', reperes:[], questions:creerQuestionsEvaluationMesures(), jokersActifs:false, titre:'Évaluation finale · Mission Mesures' });
}
function lancerDeMesures() {
    const face=selectionnerMesures('#mesuresFaceDe'), resultat=selectionnerMesures('#mesuresDeResultat'), lancer=selectionnerMesures('#mesuresLancerDe'), jouer=selectionnerMesures('#mesuresJouerTirage');
    if(!face||!resultat||!lancer||!jouer)return;
    const valeur=1+Math.floor(Math.random()*6);
    lancer.disabled=true; jouer.classList.add('masque'); face.classList.remove('de-en-lancer'); void face.offsetWidth; face.classList.add('de-en-lancer');
    window.setTimeout(()=>{
        etatJeuMesures.nombreTire=valeur;
        etatJeuMesures.tirageHasard=choisirMesuresSansDoublon(REPERES_MISSION_MESURES,valeur);
        face.dataset.face=String(valeur); face.classList.remove('de-en-lancer');
        resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard dans Mission Mesures.`;
        jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`; jouer.classList.remove('masque');
        lancer.textContent='Relancer le dé'; lancer.disabled=false; jouer.focus({preventScroll:true});
    },420);
}
function jouerTirageDeMesures() {
    const reperes=[...etatJeuMesures.tirageHasard]; if(!reperes.length)return;
    preparerSessionMissionMesuresNative({ mode:'hasard', reperes, questions:creerQuestionsEntrainementMesures(reperes,true), jokersActifs:true, titre:`Défi du hasard · ${reperes.length} question${reperes.length===1?'':'s'}` });
}

function obtenirPoolEntrainementMissionMesures(perimetre) { return String(perimetre) === 'tous' ? [...REPERES_MISSION_MESURES] : obtenirReperesMesuresEtape(Number(perimetre)); }
function configurerEntrainementMissionMesuresNatif() {
    const ecran = selectionner('#entrainement'); if (!ecran) return;
    restaurerEntrainementPJJoueNatif();
    etat.contexteEntrainement='mesures'; ecran.dataset.contexteEntrainement='mesures';
    const entete=ecran.querySelector('.entrainement-entete');
    entete?.querySelector('.surtitre') && (entete.querySelector('.surtitre').textContent='Mission Mesures');
    entete?.querySelector('h1') && (entete.querySelector('h1').textContent='Choisis ta session');
    entete?.querySelector('p') && (entete.querySelector('p').textContent='Entraîne-toi sur les mesures et leurs modules avec les mêmes réglages que PJJoue.');
    selectionner('#resultatDeParcours') && (selectionner('#resultatDeParcours').textContent='Lance le dé pour tirer de 1 à 6 questions aléatoires dans Mission Mesures.');
    const selectPerimetre=selectionner('#perimetreEntrainement');
    const groupe=document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    if(selectPerimetre&&groupe){
        selectPerimetre.innerHTML='<option value="tous">Mission Mesures complète</option>'+numerosEtapesMissionMesures().map(numero=>`<option value="${numero}">${obtenirIdentiteEtapeMissionMesures(numero).titre}</option>`).join('');
        groupe.innerHTML='<button class="choix-bouton actif entrainement-perimetre-global" data-valeur="tous" type="button"><b>Tout Mission Mesure</b><span>Les 12 étapes</span></button>'+numerosEtapesMissionMesures().map(numero=>{const i=obtenirIdentiteEtapeMissionMesures(numero);return `<button class="choix-bouton" data-valeur="${numero}" type="button" style="--parcours-accent:${i.couleur};--parcours-accent-lisible:${i.couleurTexte};--parcours-accent-rgb:${i.couleurRgb}"><b>${i.numeroFormate} · ${i.titre}</b><span>${i.sousTitre}</span></button>`;}).join('');
        selectPerimetre.value='tous'; groupe.dataset.selectionEffectuee='true';
    }
    initialiserGroupesChoix();
    const carteOrdonnee=ecran.querySelector('[data-carte-entrainement="ordonne"]');
    const carteMelangee=ecran.querySelector('[data-carte-entrainement="melange"]');
    carteOrdonnee?.querySelector(':scope > p') && (carteOrdonnee.querySelector(':scope > p').textContent='Suis le temps juridique de Mission Mesures.');
    carteMelangee?.querySelector(':scope > p') && (carteMelangee.querySelector(':scope > p').textContent='Brasse les repères du périmètre choisi.');
    selectionner('#boutonLancerLeDe').onclick=lancerDeMesuresEntrainementNatif;
    selectionner('#boutonJouerLeTirage').onclick=jouerTirageDeMesuresEntrainementNatif;
    actualiserLimiteQuestionsEntrainement(); actualiserGroupesChoix();
}
function ouvrirEntrainementMissionMesuresNatif() { configurerEntrainementMissionMesuresNatif(); afficherEcran('entrainement'); }
function lancerDeMesuresEntrainementNatif() {
    const face=selectionner('#faceDeParcours'), resultat=selectionner('#resultatDeParcours'), lancer=selectionner('#boutonLancerLeDe'), jouer=selectionner('#boutonJouerLeTirage'); if(!face||!resultat||!lancer||!jouer)return;
    const valeur=1+Math.floor(Math.random()*6); lancer.disabled=true; jouer.classList.add('masque'); face.classList.remove('de-en-lancer'); void face.offsetWidth; face.classList.add('de-en-lancer');
    window.setTimeout(()=>{etatJeuMesures.tirageHasard=choisirMesuresSansDoublon(REPERES_MISSION_MESURES,valeur);face.dataset.face=String(valeur);face.classList.remove('de-en-lancer');resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} dans Mission Mesures.`;jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`;jouer.classList.remove('masque');lancer.textContent='Relancer le dé';lancer.disabled=false;},420);
}
function jouerTirageDeMesuresEntrainementNatif() { jouerTirageDeMesures(); }
function lancerEntrainementMissionMesuresNatif() {
    const perimetre=selectionner('#perimetreEntrainement')?.value||'tous';
    const pool=obtenirPoolEntrainementMissionMesures(perimetre);
    const nombre=Math.min(pool.length,Math.max(1,Number(selectionner('#nombreQuestionsEntrainement')?.value)||10));
    const organisation=etat.organisationSession||'ordonne';
    const reperes=organisation==='ordonne'?[...pool].sort((a,b)=>Number(a.etape)-Number(b.etape)||Number(a.id)-Number(b.id)).slice(0,nombre):choisirMesuresSansDoublon(pool,nombre);
    preparerSessionMissionMesuresNative({mode:'entrainement',reperes,questions:creerQuestionsEntrainementMesures(reperes,organisation==='melange'),jokersActifs:etat.jokersSessionActifs!==false,titre:`Entraînement Mesures · ${nombre} question${nombre===1?'':'s'}`,chronoActif:etat.chronometreSessionActif===true,secondesQuestion:etat.dureeChronometreSession||30,organisation});
}

function afficherRevisionMesures() {
    const zone=selectionner('#contenuErreursMesures'); if(!zone)return;
    const erreurs=obtenirErreursMesuresActives();
    if(!erreurs.length){zone.innerHTML='<div class="revision-vide"><strong>Aucune erreur active.</strong><p>Les repères manqués apparaîtront ici pour être retravaillés.</p></div>';return;}
    zone.innerHTML=`<div class="mesures-revision-liste">${erreurs.map(cible=>`<article class="mesures-revision-item"><span class="surtitre">Étape ${String(cible.etape).padStart(2,'0')}</span><strong>${cible.titre}</strong><p>${cible.sigle&&cible.developpement?`${cible.developpement} (${cible.sigle})`:cible.questionRappel}</p></article>`).join('')}</div><button class="principal" id="mesuresRevisionDemarrer" type="button">Commencer la révision →</button>`;
    selectionner('#mesuresRevisionDemarrer')?.addEventListener('click',lancerRevisionMesures);
}
function terminerSessionMissionMesuresNative() {
    clearInterval(etat.identifiantMinuteur);
    const total=etat.questionsSession.length, passees=etat.questionsPassees?.size||0, pourcentage=total?Math.round(etat.score/total*100):0;
    const mode=obtenirModeMissionMesures(), jeu=obtenirSauvegardeJeuMesures();
    let celebration=null, titre='Mission Mesures terminée', resultat=`${pourcentage} % · ${etat.score}/${total} réussites autonomes.`;
    if(mode==='parcours'){
        const numero=Number(etat.missionMesuresConfiguration?.etape||etat.etape||1), identite=obtenirIdentiteEtapeMissionMesures(numero); titre=`Étape ${identite.numeroFormate} · ${identite.titre}`;
        if(etatJeuMesures.celebrationEtapeADiffuser===numero) celebration={titre:`Étape ${identite.numeroFormate} maîtrisée !`,message:'Tous les repères de cette étape ont été réussis en autonomie.',confetti:true};
    }
    if(mode==='evaluation'){
        jeu.evaluation.meilleurScore=Math.max(Number(jeu.evaluation.meilleurScore||0),pourcentage); jeu.evaluation.nombreTentatives=Number(jeu.evaluation.nombreTentatives||0)+1;
        const reussie=pourcentage>=SEUIL_EVALUATION_MESURES&&passees===0; jeu.evaluation.reussie=Boolean(jeu.evaluation.reussie)||reussie; titre='Évaluation finale · Mission Mesures'; resultat=reussie?`Résultat : ${pourcentage} %. Mission Mesures est validée.`:`Résultat : ${pourcentage} %. Le seuil attendu est de ${SEUIL_EVALUATION_MESURES} %.`;
        if(reussie) celebration={titre:'Évaluation Mission Mesures réussie !',message:`Tu as obtenu ${pourcentage} %.`,confetti:true,finale:pourcentage===100};
    }
    if(mode==='revision'){titre='Réviser mes erreurs · Mission Mesures';resultat=obtenirErreursMesuresActives().length?`${obtenirErreursMesuresActives().length} repère(s) restent à consolider.`:'Aucun repère actif à revoir.';}
    if(mode==='hasard'){titre='Défi du hasard · Mission Mesures';resultat=pourcentage===100?'Tirage parfait !':`Résultat : ${pourcentage} %.`;}
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent=`${pourcentage}%`; selectionner('#bonnesReponsesBilan').textContent=`${etat.score}/${total}`; selectionner('#meilleureSerieBilan').textContent=etat.meilleureSerie; selectionner('#gainExperienceBilan').textContent='+0'; selectionner('#contexteBilan').textContent=`Mission Mesures · ${titre}`; selectionner('#titreBilan').textContent=titre; selectionner('#rangBilan').textContent=resultat;
    afficherErreursBilan(etat.questionsSession.filter(question=>etat.erreursSession.has(question.id)),passees);
    const continuer=selectionner('#boutonContinuer'); continuer.textContent='Retour à Mission Mesures →'; continuer.onclick=()=>{etat.missionMesuresConfiguration=null;afficherEcran('mesures',{remplacerHistorique:true});};
    const rejouer=selectionner('#boutonRejouerMesErreurs'); if(rejouer) rejouer.onclick=lancerRevisionMesures;
    selectionner('#prochaineDestinationBilan') && (selectionner('#prochaineDestinationBilan').textContent='Continue Mission Mesures ou retravaille les repères à consolider.');
    selectionner('#carteVoyageFinale')?.classList.add('masque'); effacerSessionEnCours(); afficherEcran('bilan',{remplacerHistorique:true}); actualiserAccueilMesures(); lancerCelebrationBilan(celebration);
}

function initialiserJeuMesures() {
    const racine=selectionnerMesures('#mesures'); if(!racine||racine.dataset.initialise==='true')return; racine.dataset.initialise='true';
    selectionnerMesures('#mesuresOuvrirParcours')?.addEventListener('click',()=>{actualiserAccueilMesures();selectionnerMesures('#mesuresAccueil')?.classList.add('masque');selectionnerMesures('#mesuresParcoursVue')?.classList.remove('masque');window.scrollTo?.({top:0,behavior:'smooth'});});
    selectionnerMesures('#mesuresRetourDepuisParcours')?.addEventListener('click',()=>{selectionnerMesures('#mesuresParcoursVue')?.classList.add('masque');selectionnerMesures('#mesuresAccueil')?.classList.remove('masque');actualiserAccueilMesures();});
    selectionnerMesures('#mesuresOuvrirEntrainement')?.addEventListener('click',ouvrirEntrainementMissionMesuresNatif);
    selectionnerMesures('#mesuresLancerDe')?.addEventListener('click',lancerDeMesures);
    selectionnerMesures('#mesuresJouerTirage')?.addEventListener('click',jouerTirageDeMesures);
    selectionnerMesures('#mesuresLancerRevision')?.addEventListener('click',()=>afficherEcran('mesures-revision'));
    selectionnerMesures('#mesuresLancerEvaluation')?.addEventListener('click',lancerEvaluationMesures);
    actualiserAccueilMesures(); afficherRevisionMesures();
}
initialiserJeuMesures();
