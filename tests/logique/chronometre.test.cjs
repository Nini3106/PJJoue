const test = require('node:test');
const assert = require('node:assert/strict');
const { creerMoteur } = require('./moteur-simule.cjs');
const objet = valeur => JSON.parse(JSON.stringify(valeur));

function preparer() {
    const moteur = creerMoteur();
    moteur.run('init(); demarrerChronometreQuestion();');
    return moteur;
}

test('Chrono à la demande : 15 secondes, ajouts de 5, plafond total de 30 sans recharge infinie', () => {
    const { run } = preparer();
    assert.equal(run('etat.chronometreSessionActif'), false);
    assert.deepEqual(objet(run(`(() => {
        ajouterTempsChronometreQuestion();
        const debut = etat.tempsRestant;
        etat.tempsRestant = 8;
        ajouterTempsChronometreQuestion();
        const apresAjout = etat.tempsRestant;
        ajouterTempsChronometreQuestion(); ajouterTempsChronometreQuestion();
        ajouterTempsChronometreQuestion();
        return [debut, apresAjout, etat.tempsRestant, obtenirChronometreQuestion().dureeAccordee];
    })()`)), [15, 13, 23, 30]);
});

test('Chrono sur une seule question : changement, retour et arrêt ne contaminent pas la suivante', () => {
    const { run } = preparer();
    assert.deepEqual(objet(run(`(() => {
        ajouterTempsChronometreQuestion();
        obtenirChronometreQuestion().tempsRestant = 9;
        etat.indexQuestion = 1; afficherQuestion(); demarrerChronometreQuestion();
        const suivante = etat.chronometreSessionActif;
        etat.indexQuestion = 0; afficherQuestion(); demarrerChronometreQuestion();
        const retour = etat.tempsRestant;
        desactiverChronometreQuestion();
        return [suivante, retour, etat.chronometreSessionActif, etat.chronometreToutesQuestions];
    })()`)), [false, 9, false, false]);
});

test('Portée session : activation en un clic, durée choisie, puis nouvelle session sans chrono', () => {
    const { run } = preparer();
    assert.deepEqual(objet(run(`(() => {
        basculerChronometreToutesQuestions(); ajouterTempsChronometreQuestion();
        etat.indexQuestion = 1; afficherQuestion(); demarrerChronometreQuestion();
        const suivante = [etat.chronometreSessionActif, etat.tempsRestant];
        basculerChronometreToutesQuestions();
        etat.indexQuestion = 2; afficherQuestion(); demarrerChronometreQuestion();
        const desactive = etat.chronometreSessionActif;
        basculerChronometreToutesQuestions(); lancerSession(etat.questionsSession);
        return [...suivante, desactive, etat.chronometreToutesQuestions, etat.chronometresQuestions.size];
    })()`)), [true, 20, false, false, 0]);
});

test('Reprise après rechargement : portée et temps de chaque question conservés', () => {
    const ancien = preparer();
    ancien.run(`basculerChronometreToutesQuestions(); ajouterTempsChronometreQuestion();
        etat.tempsRestant=12; obtenirChronometreQuestion().tempsRestant=12; enregistrerSessionEnCours();`);
    const nouveau = creerMoteur({ storage: ancien.storage, onglet: ancien.onglet });
    assert.equal(nouveau.run('restaurerSessionEnCours()'), true);
    assert.deepEqual(objet(nouveau.run(`demarrerChronometreQuestion(); [etat.tempsRestant, etat.chronometreToutesQuestions, obtenirChronometreQuestion().dureeAccordee]`)), [12, true, 20]);
});

test('Ancienne session chronométrée : migration avec durée et temps restant', () => {
    const { run } = preparer();
    assert.deepEqual(objet(run(`(() => {
        etat.chronometreSessionActif = true; etat.tempsRestant = 7; etat.dureeChronometreSession = 25;
        const ancien = creerInstantaneSessionEnCours();
        delete ancien.chronometresQuestions; delete ancien.chronometreToutesQuestions;
        restaurerSessionEnCours(ancien); demarrerChronometreQuestion();
        return [etat.chronometreToutesQuestions, etat.tempsRestant, obtenirChronometreQuestion().dureeAccordee];
    })()`)), [true, 7, 25]);
});

test('Expiration : correction et score uniques dans les sept modes ; rejouer garde un budget entier', () => {
    for (const mode of ['choix-unique', 'selection-multiple', 'association', 'classer', 'remettre-ordre', 'eliminer', 'reponse-ecrite']) {
        const { run } = preparer();
        assert.deepEqual(objet(run(`(() => {
            const question = QUESTIONS.find(q => (q.modePrefere || obtenirModeQuestion(q)) === '${mode}');
            lancerSession([question]); demarrerChronometreQuestion(); ajouterTempsChronometreQuestion();
            gererTempsEcoule(); gererTempsEcoule(); ajouterTempsChronometreQuestion();
            const correction = [etat.questionValidee, etat.delaiDepasse, etat.score, etat.reponsesSession.size, obtenirChronometreQuestion().tempsRestant];
            rejouerQuestionCourante(); demarrerChronometreQuestion();
            return [...correction, etat.tempsRestant];
        })()`)), [true, true, 0, 1, 0, 15], mode);
    }
});

test('Horloge réelle : un intervalle retardé ne rallonge pas le délai', () => {
    const { run, c } = preparer();
    let rappel;
    c.setInterval = fonction => { rappel = fonction; return 1; };
    run('var maintenantChrono = 1000; Date.now = () => maintenantChrono; ajouterTempsChronometreQuestion(); maintenantChrono += 4000;');
    rappel();
    assert.equal(run('etat.tempsRestant'), 11);
    run('maintenantChrono += 20000;');
    rappel();
    assert.deepEqual(objet(run('[etat.tempsRestant, etat.questionValidee, etat.reponsesSession.size]')), [0, true, 1]);
});
