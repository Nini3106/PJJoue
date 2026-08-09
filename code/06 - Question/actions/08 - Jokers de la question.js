/**
 * Utiliser les jokers 50/50, Indice et Langue au chat sans mélanger cette logique au reste.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
function utiliserJoker5050PourReponseEcrite(question) {
    const texteDevoile = masquerMoitiéTexte(question.bonneReponse);
    consommerJoker5050({ nature: 'reponse-ecrite', texteDevoile });
    afficherActiviteEcrite(null);
    afficherNotification('La moitié des éléments de la réponse est révélée.');
}
function utiliserJoker5050PourElimination(question) {
    if (!etat.brouillonActivite || etat.brouillonActivite.identifiantQuestion !== question.id) {
        etat.brouillonActivite = {
            identifiantQuestion: question.id,
            elementsElimines: [],
            eliminationsVerrouillees: []
        };
    }
    const propositions = obtenirChoixQuestion(question);
    const nombreAttendu = obtenirNombreEliminationsAttendues(question);
    const nombreAConfirmer = Math.max(1, Math.ceil(nombreAttendu / 2));
    const propositionsIncorrectes = propositions
        .map((proposition, indice) => ({ proposition, indice }))
        .filter(element => !element.proposition.estCorrecte);
    const elementsDejaElimines = etat.brouillonActivite.elementsElimines || [];
    const eliminationsCorrectesExistantes = elementsDejaElimines.filter(indice =>
        !propositions[indice]?.estCorrecte
    );
    const dejaVerrouillees = (etat.brouillonActivite.eliminationsVerrouillees || []).filter(indice =>
        !propositions[indice]?.estCorrecte
    );
    const indicesAConfirmer = [...new Set([
        ...dejaVerrouillees,
        ...eliminationsCorrectesExistantes,
        ...propositionsIncorrectes.map(element => element.indice)
    ])].slice(0, nombreAConfirmer);
    if (!indicesAConfirmer.length) {
        consommerJoker5050({
            nature: 'eliminer',
            verrouilles: [],
            elementsElimines: [...eliminationsCorrectesExistantes]
        });
        afficherNotification('Le 50/50 confirme le travail déjà réalisé.');
        return;
    }
    etat.brouillonActivite.elementsElimines = [...new Set([
        ...eliminationsCorrectesExistantes,
        ...indicesAConfirmer
    ])].slice(0, nombreAttendu);
    etat.brouillonActivite.eliminationsVerrouillees = [...indicesAConfirmer];
    consommerJoker5050({
        nature: 'eliminer',
        verrouilles: [...indicesAConfirmer],
        elementsElimines: [...etat.brouillonActivite.elementsElimines]
    });
    afficherActiviteEliminer(question, null);
    afficherNotification('Une partie des retraits attendus est confirmée et verrouillée.');
}
function utiliserJoker5050PourSelectionMultiple(activite) {
    const propositionsIncorrectes = activite.propositions.filter(proposition =>
        !activite.reponses.includes(proposition.id)
    );
    const nombreARetirer = Math.max(1, Math.ceil(propositionsIncorrectes.length / 2));
    const identifiantsRetires = melanger(propositionsIncorrectes)
        .slice(0, nombreARetirer)
        .map(proposition => proposition.id);
    etat.brouillonActivite.elementsRetires = identifiantsRetires;
    etat.brouillonActivite.elementsSelectionnes = etat.brouillonActivite.elementsSelectionnes
        .filter(identifiant => !identifiantsRetires.includes(identifiant));
    consommerJoker5050({ nature: 'selection-multiple', elementsRetires: [...identifiantsRetires] });
    actualiserActiviteInteractive();
    afficherNotification('La moitié des propositions non pertinentes est écartée.');
}
function utiliserJoker5050PourChoisirOrdre(activite) {
    const nombreElementsVerrouilles = Math.max(1, Math.ceil(activite.ordre.length / 2));
    etat.brouillonActivite.ordre = [...activite.ordre.slice(0, nombreElementsVerrouilles)];
    etat.brouillonActivite.nombreChoixOrdreVerrouilles = nombreElementsVerrouilles;
    consommerJoker5050({
        nature: 'choisir-ordre',
        nombreVerrouille: nombreElementsVerrouilles,
        ordre: [...etat.brouillonActivite.ordre]
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié du bon ordre est donnée et verrouillée.');
}
function utiliserJoker5050PourOrdre(activite) {
    const ordreAttendu = [...activite.ordre];
    const nombrePositionsVerrouillees = Math.max(1, Math.ceil(ordreAttendu.length / 2));
    const positionsVerrouillees = melanger(ordreAttendu.map((_identifiant, indice) => indice))
        .slice(0, nombrePositionsVerrouillees)
        .sort((indiceA, indiceB) => indiceA - indiceB);
    const ensemblePositionsVerrouillees = new Set(positionsVerrouillees);
    const identifiantsVerrouilles = new Set(
        positionsVerrouillees.map(indice => ordreAttendu[indice])
    );
    const identifiantsRestants = (etat.brouillonActivite.ordre || [])
        .filter(identifiant => !identifiantsVerrouilles.has(identifiant));
    let indiceRestant = 0;
    etat.brouillonActivite.ordre = ordreAttendu.map((identifiant, indice) =>
        ensemblePositionsVerrouillees.has(indice)
            ? identifiant
            : identifiantsRestants[indiceRestant++]
    );
    etat.brouillonActivite.positionsOrdreVerrouillees = positionsVerrouillees;
    consommerJoker5050({
        nature: 'remettre-ordre',
        verrouilles: [...positionsVerrouillees],
        ordre: [...etat.brouillonActivite.ordre]
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié du bon ordre est complétée et verrouillée.');
}
function utiliserJoker5050PourAssociation(activite) {
    const identifiantsGauche = Object.keys(activite.associations);
    const associationsVerrouillees = melanger(identifiantsGauche)
        .slice(0, Math.max(1, Math.ceil(identifiantsGauche.length / 2)));
    etat.brouillonActivite.associationsVerrouillees = associationsVerrouillees;
    associationsVerrouillees.forEach(identifiantGauche => {
        const identifiantDroite = activite.associations[identifiantGauche];
        Object.keys(etat.brouillonActivite.associations).forEach(identifiantCandidat => {
            const utiliseMemeElementDroite = etat.brouillonActivite.associations[identifiantCandidat]
                === identifiantDroite;
            if (identifiantCandidat !== identifiantGauche && utiliseMemeElementDroite)
                delete etat.brouillonActivite.associations[identifiantCandidat];
        });
        etat.brouillonActivite.associations[identifiantGauche] = identifiantDroite;
    });
    if (associationsVerrouillees.includes(etat.brouillonActivite.colonneGauche))
        etat.brouillonActivite.colonneGauche = null;
    consommerJoker5050({
        nature: 'association',
        verrouilles: [...associationsVerrouillees],
        associations: { ...etat.brouillonActivite.associations }
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié des associations est donnée et verrouillée.');
}
function utiliserJoker5050PourClassement(activite) {
    const identifiantsElements = activite.elements.map(element => element.id);
    const classementsVerrouilles = melanger(identifiantsElements)
        .slice(0, Math.max(1, Math.ceil(identifiantsElements.length / 2)));
    etat.brouillonActivite.classementsVerrouilles = classementsVerrouilles;
    classementsVerrouilles.forEach(identifiant => {
        etat.brouillonActivite.classements[identifiant] = activite.classements[identifiant];
    });
    consommerJoker5050({
        nature: 'classer',
        verrouilles: [...classementsVerrouilles],
        classements: { ...etat.brouillonActivite.classements }
    });
    actualiserActiviteInteractive();
    afficherNotification('La moitié des classements est donnée et verrouillée.');
}
function utiliserJoker5050PourChoixUnique() {
    const boutonsIncorrects = Array.from(document.querySelectorAll('.reponse'))
        .filter(bouton => bouton.dataset.estCorrecte !== '1');
    const nombreBoutonsARetirer = Math.max(1, Math.ceil(boutonsIncorrects.length / 2));
    const boutonsRetires = melanger(boutonsIncorrects).slice(0, nombreBoutonsARetirer);
    consommerJoker5050({
        nature: 'choix-unique',
        textesRetires: boutonsRetires.map(bouton =>
            bouton.textContent.replace(/^[A-D]/, '').trim()
        )
    });
    boutonsRetires.forEach(bouton => bouton.classList.add('retire'));
    afficherNotification('La moitié des mauvaises propositions est écartée.');
}
function utiliserJoker5050() {
    activerCoucheJoker('cinquanteCinquante');
    if (etat.questionValidee || !etat.jokers.cinquanteCinquante)
        return;
    const question = etat.questionCourante;
    const mode = question.modePresentation || obtenirModeQuestion(question);
    const activite = question.activite;
    if (mode === 'reponse-ecrite')
        return utiliserJoker5050PourReponseEcrite(question);
    if (mode === 'eliminer')
        return utiliserJoker5050PourElimination(question);
    if (activite?.type === 'selection-multiple')
        return utiliserJoker5050PourSelectionMultiple(activite);
    if (activite?.type === 'choisir-ordre')
        return utiliserJoker5050PourChoisirOrdre(activite);
    if (activite?.type === 'remettre-ordre')
        return utiliserJoker5050PourOrdre(activite);
    if (activite?.type === 'association')
        return utiliserJoker5050PourAssociation(activite);
    if (activite?.type === 'classer')
        return utiliserJoker5050PourClassement(activite);
    return utiliserJoker5050PourChoixUnique();
}
function fermerAideJokerOuverte(sauf = null) {
    const zoneIndice = selectionner('#zoneIndice');
    if (!zoneIndice)
        return;
    if (sauf !== 'zoneIndice' && !zoneIndice.classList.contains('masque')) {
        zoneIndice.classList.add('masque');
        zoneIndice.replaceChildren();
        zoneIndice.classList.remove('indice-calque', 'langue-chat-calque');
    }
}
function activerCoucheJoker(type) {
    // Le dernier joker utilisé doit toujours être visible.
    // 50/50 n'a pas d'overlay : on ferme donc tout overlay précédent.
    if (type === 'cinquanteCinquante') {
        fermerAideJokerOuverte();
        return;
    }
    // Indice et Langue au chat partagent la même surface :
    // on nettoie systématiquement son contenu avant d'afficher le nouveau.
    if (type === 'indice' || type === 'langueAuChat') {
        const zoneIndice = selectionner('#zoneIndice');
        if (!zoneIndice)
            return;
        zoneIndice.replaceChildren();
        zoneIndice.classList.add('masque');
        zoneIndice.classList.remove('indice-calque', 'langue-chat-calque');
    }
}
function utiliserIndice(type) {
    activerCoucheJoker('indice');
    if (type !== 'indice' || etat.questionValidee || !etat.jokers.indice)
        return;
    marquerJokerUtilise();
    envoyerUtilisationJoker('indice');
    etat.jokers.indice = false;
    selectionner('#boutonJokerIndice').disabled = true;
    actualiserBoutonJokers();
    const zone = selectionner('#zoneIndice');
    zone.replaceChildren();
    zone.className = 'correction indice-calque';
    zone.setAttribute('role', 'dialog');
    zone.setAttribute('aria-label', 'Indice');
    const entete = document.createElement('div');
    entete.className = 'correction-entete';
    const titre = document.createElement('h3');
    titre.textContent = 'Indice';
    const fermer = document.createElement('button');
    fermer.type = 'button';
    fermer.className = 'indice-fermer';
    fermer.setAttribute('aria-label', 'Fermer l’indice');
    fermer.textContent = '×';
    entete.append(titre, fermer);
    const separateur = document.createElement('div');
    separateur.className = 'correction-separateur';
    separateur.setAttribute('aria-hidden', 'true');
    const message = document.createElement('p');
    message.className = 'encouragement';
    message.textContent = etat.questionCourante.indice || 'Repère les informations certaines de la situation avant d’examiner les choix.';
    zone.append(entete, separateur, message);
    zone.classList.remove('masque');
    fermer.onclick = () => { zone.classList.add('masque'); zone.replaceChildren(); selectionner('#boutonJokerIndice').focus({ preventScroll: true }); };
    annoncer(`Indice. ${message.textContent}`);
}
function utiliserLangueAuChat() {
    activerCoucheJoker('langueAuChat');
    if (etat.questionValidee || !etat.jokers.langueAuChat)
        return;
    annulerRappelJokers();
    marquerJokerUtilise();
    envoyerUtilisationJoker('langue_au_chat');
    etat.jokers.langueAuChat = false;
    selectionner('#boutonJokerLangueAuChat').disabled = true;
    actualiserBoutonJokers();
    const question = etat.questionCourante;
    finaliserReponse(true, question.bonneReponse || 'Réponse dévoilée', { precisions: { langueAuChatUtilisee: true } });
}
