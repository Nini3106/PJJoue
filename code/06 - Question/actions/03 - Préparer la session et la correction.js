/**
 * Préparer la session, présenter les réponses et construire les explications de correction.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
function lancerSession(session) {
    if (!session.length) {
        afficherNotification('Aucune question ne correspond à ce filtre.');
        return;
    }
    const questionsPreparees = preparerSession(session);
    etat.questionsSession = questionsPreparees;
    etat.indexQuestion = 0;
    etat.score = 0;
    etat.serie = 0;
    etat.meilleureSerie = 0;
    actualiserIndicateurSerie();
    etat.erreursSession = new Set();
    etat.questionsPassees = new Set();
    etat.reponsesSession = new Map();
    etat.optionsSession = new Map();
    etat.decalageReponses = Math.floor(Math.random() * 4);
    etat.tentativesQuestions = new Map();
    etat.jokersQuestions = new Map();
    etat.brouillonsEcrits = new Map();
    etat.nombreReponsesAidees = 0;
    etat.sessionAvecJoker = false;
    etat.debutSessionAnalytics = Date.now();
    etat.jokers = { cinquanteCinquante: true, indice: true, langueAuChat: true };
    envoyerEvenementPJJ('session_commencee', {
        ...obtenirContexteSessionAnalytics(),
        pjjoue_resultat_session: 'Session commencée'
    });
    afficherEcran('question', { remplacerHistorique: etat.ecran === 'bilan' });
    afficherQuestion();
    enregistrerSessionEnCours();
}
function nettoyerEnonce(question) {
    let enonce = (question.enonce || '').trim();
    const theme = THEMES.find(themeCandidat => themeCandidat.id === question.theme);
    if (theme) {
        const prefixes = [
            `${theme.iconee} ${theme.titre} — `,
            `${theme.titre} — `,
            `${theme.iconee} ${theme.titre} - `,
            `${theme.titre} - `
        ];
        for (const prefixe of prefixes) {
            if (enonce.startsWith(prefixe)) {
                enonce = enonce.slice(prefixe.length).trim();
                break;
            }
        }
    }
    return enonce.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();
}
function raccourcirTexteReponse(texte) {
    let texteRaccourci = String(texte || '').trim();
    const modeles = [
        /^Ici\s*:\s*/i,
        /^Dans ce cas\s*:\s*/i,
        /^Pour ce cas précis\s*:\s*/i,
        /^Dans cette situation\s*:\s*/i,
        /^Dans le contexte donné\s*:\s*/i,
        /^Au regard de la situation\s*:\s*/i,
        /^En se limitant aux éléments fournis\s*:\s*/i,
        /^Au regard des informations présentées\s*:\s*/i,
        /^Dans le cadre précis décrit par la question\s*:\s*/i,
        /^En tenant compte uniquement des éléments fournis ici\s*:\s*/i,
        /^Au regard des seules informations données dans cette situation\s*:\s*/i,
        /^En se fondant uniquement sur les éléments explicitement présentés dans cette situation\s*:\s*/i,
        /^Dans le cadre strict des informations disponibles, sans ajouter d[’']hypothèse extérieure\s*:\s*/i
    ];
    modeles.forEach(modele => {
        texteRaccourci = texteRaccourci.replace(modele, '');
    });
    return texteRaccourci.replace(/\s{2,}/g, ' ').trim();
}
function harmoniserPresentationReponses(propositions) {
    return propositions.map(proposition => ({
        ...proposition,
        texte: raccourcirTexteReponse(proposition.texte)
    }));
}
function obtenirChoixQuestion(question) {
    if (!etat.optionsSession.has(question.id)) {
        if (question.modePrefere === 'eliminer' && Array.isArray(question.propositionsAEliminer) && Array.isArray(question.propositionsAConserver)) {
            const conserver = new Set(question.propositionsAConserver);
            const propositions = harmoniserPresentationReponses(question.propositionsAEliminer.map(texte => ({ texte: texte, estCorrecte: conserver.has(texte) })));
            etat.optionsSession.set(question.id, melanger(propositions));
        }
        else {
            const propositions = harmoniserPresentationReponses([
                { texte: question.bonneReponse, estCorrecte: true },
                ...question.mauvaisesReponses.map(texte => ({
                    texte,
                    estCorrecte: false
                }))
            ]);
            const correcte = propositions.find(proposition => proposition.estCorrecte), mauvaises = melanger(propositions.filter(proposition => !proposition.estCorrecte));
            const position = ((etat.decalageReponses || 0) + etat.indexQuestion) % propositions.length;
            mauvaises.splice(position, 0, correcte);
            etat.optionsSession.set(question.id, mauvaises);
        }
    }
    return etat.optionsSession.get(question.id);
}
function construireCorrectionDetaillee(question, echapperTexte) {
    if (!question)
        return '';
    const mode = question.modePrefere || question.activite?.type || 'choix-unique';
    const activite = question.activite || {};
    const construireZone = (titre, lignes) => `
        <div class="detaillee-correction">
            <div class="detaillee-correction-titre"><b>${titre}</b></div>
            <div class="detaillee-correction-liste">${lignes.join('')}</div>
        </div>`;
    const construireLigneSimple = texte => `<div class="detaillee-correction-ligne unique-ligne">${echapperTexte(texte)}</div>`;
    const construireLigneFlechee = (gauche, droite) => `
        <div class="detaillee-correction-ligne">
            <span>${echapperTexte(gauche)}</span><span class="correction-fleche">→</span><strong>${echapperTexte(droite)}</strong>
        </div>`;
    if (mode === 'selection-multiple' && Array.isArray(activite.propositions) && Array.isArray(activite.reponses)) {
        const identifiantsReponses = new Set(activite.reponses);
        const reponsesAttendues = activite.propositions
            .filter(proposition => identifiantsReponses.has(proposition.id))
            .map(proposition => proposition.texte);
        return construireZone(
            reponsesAttendues.length > 1 ? 'Réponses attendues :' : 'Réponse attendue :',
            reponsesAttendues.map(construireLigneSimple)
        );
    }
    if (mode === 'eliminer') {
        const mauvaisesReponses = (question.mauvaisesReponses || []).filter(Boolean);
        const nombreAttendu = obtenirNombreEliminationsAttendues(question);
        const retraitsAffiches = mauvaisesReponses.slice(0, nombreAttendu);
        const lignes = retraitsAffiches.map(texte => `
            <div class="detaillee-correction-ligne ligne-eliminee">
                <span class="marque-erreur">✕</span><span>${echapperTexte(texte)}</span>
            </div>`);
        if (mauvaisesReponses.length > nombreAttendu) {
            const autresRetraits = mauvaisesReponses
                .slice(nombreAttendu)
                .map(echapperTexte)
                .join(' · ');
            const nombreAutres = mauvaisesReponses.length - nombreAttendu;
            lignes.push(
                '<div class="correction-note">'
                + `Autre${nombreAutres > 1 ? 's' : ''} retrait${nombreAutres > 1 ? 's' : ''} `
                + `également correct${nombreAutres > 1 ? 's' : ''} : ${autresRetraits}.`
                + '</div>'
            );
        }
        const propositionsAConserver = Array.isArray(question.propositionsAConserver) && question.propositionsAConserver.length
            ? question.propositionsAConserver
            : [question.bonneReponse];
        lignes.push(`<div class="correction-conserver"><b>À conserver :</b> ${propositionsAConserver.map(echapperTexte).join(' · ')}</div>`);
        return construireZone(
            `Il fallait éliminer ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} incorrecte${nombreAttendu > 1 ? 's' : ''} :`,
            lignes
        );
    }
    if (mode === 'association' && activite.type === 'association') {
        const textesGauche = Object.fromEntries((activite.colonneGauche || []).map(element => [element.id, element.texte]));
        const textesDroite = Object.fromEntries((activite.colonneDroite || []).map(element => [element.id, element.texte]));
        const lignes = Object.entries(activite.associations || {}).map(([identifiantGauche, identifiantDroite]) =>
            construireLigneFlechee(
                textesGauche[identifiantGauche] || identifiantGauche,
                textesDroite[identifiantDroite] || identifiantDroite
            )
        );
        return construireZone('Il fallait relier :', lignes);
    }
    if (mode === 'classer' && activite.type === 'classer') {
        const textesCategories = Object.fromEntries((activite.categories || []).map(categorie => [categorie.id, categorie.texte]));
        const textesElements = Object.fromEntries((activite.elements || []).map(element => [element.id, element.texte]));
        const lignes = Object.entries(activite.classements || {}).map(([identifiantElement, identifiantCategorie]) =>
            construireLigneFlechee(
                textesElements[identifiantElement] || identifiantElement,
                textesCategories[identifiantCategorie] || identifiantCategorie
            )
        );
        return construireZone('Classement attendu :', lignes);
    }
    if (mode === 'remettre-ordre' && (activite.type === 'remettre-ordre' || activite.type === 'choisir-ordre')) {
        const textesElements = Object.fromEntries((activite.elements || []).map(element => [element.id, element.texte]));
        const sequence = (activite.ordre || []).map(identifiant => textesElements[identifiant] || identifiant);
        return construireZone('Ordre attendu :', [
            `<div class="ordre-correction">${sequence.map(echapperTexte).join('<span class="correction-fleche">→</span>')}</div>`
        ]);
    }
    return construireZone('Réponse attendue :', [construireLigneSimple(question.bonneReponse)]);
}
function afficherCorrectionEnregistree(question, reponse) {
    const echapperTexte = echapperHtml;
    const zoneCorrection = selectionner('#zoneCorrection');
    if (reponse.statut === 'passee') {
        zoneCorrection.className = 'correction masque';
        zoneCorrection.innerHTML = '';
        return;
    }
    const estCorrecte = reponse.statut === 'correcte';
    const estAidee = reponse.statut === 'aidee';
    const texteChoisi = echapperTexte(reponse.texteReponse || '');
    zoneCorrection.className = 'correction ' + (estCorrecte ? 'bon' : (estAidee ? 'aidee' : 'incorrecte'));
    const reponseAttendueDetaillee = construireCorrectionDetaillee(question, echapperTexte);
    const ligneReponseUtilisateur = !estCorrecte && !estAidee && texteChoisi
        ? `<p><b>Ta réponse :</b> ${texteChoisi}</p>`
        : '';
    const titreStatut = reponse.precisions?.langueAuChatUtilisee
        ? 'Langue au chat — réponse dévoilée'
        : (estCorrecte ? 'Réussite autonome' : (estAidee ? 'Réussite avec aide — à consolider' : 'Réponse incorrecte'));
    zoneCorrection.innerHTML = `<div class="correction-corps">
        <div class="retournee-note">Tu consultes une activité déjà jouée. La réponse reste verrouillée afin de préserver le résultat de la session.</div>
        <h3>${titreStatut}</h3>
        ${ligneReponseUtilisateur}${reponseAttendueDetaillee}
        <p><b>Explication :</b> ${question.explication}</p>
        ${question.procedureLocale ? '<p><b>Procédure locale :</b> le circuit exact du service réel doit toujours primer sur ce scénario pédagogique.</p>' : ''}
    </div>`;
}
const LIBELLES_ACTIVITES = {
    'selection-multiple': 'Sélection multiple',
    'remettre-ordre': 'Remettre dans l’ordre',
    'choisir-ordre': 'Choisir puis ordonner',
    association: 'Association par fil',
    classer: 'Classement'
};
