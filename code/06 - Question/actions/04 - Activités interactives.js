/**
 * Gérer les activités à manipuler : sélection multiple, ordre, association et classement.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
function obtenirLibelleActivite(type) {
    return LIBELLES_ACTIVITES[type] || 'Question à choix';
}
function obtenirElementsActiviteMelanges(question, cle) {
    const cleEtat = `activite:${question.id}:${cle}`;
    if (!etat.optionsSession.has(cleEtat)) {
        etat.optionsSession.set(cleEtat, melanger(question.activite[cle] || []));
    }
    return etat.optionsSession.get(cleEtat);
}
function actualiserActiviteInteractive() {
    afficherActiviteInteractive(
        etat.questionCourante,
        etat.reponsesSession.get(etat.questionCourante.id)
    );
}
function deplacerElementOrdre(indice, direction) {
    const elements = etat.brouillonActivite.ordre || [], verrouilles = new Set(etat.brouillonActivite.positionsOrdreVerrouillees || []);
    if (verrouilles.has(indice))
        return;
    let cible = indice + direction;
    while (cible >= 0 && cible < elements.length && verrouilles.has(cible))
        cible += direction;
    if (cible < 0 || cible >= elements.length)
        return;
    [elements[indice], elements[cible]] = [elements[cible], elements[indice]];
    actualiserActiviteInteractive();
}
function selectionnerAssociation(cote, identifiant) {
    etat.brouillonActivite = etat.brouillonActivite || { associations: {} };
    const activite = etat.questionCourante.activite, verrouilles = new Set(etat.brouillonActivite.associationsVerrouillees || []);
    const droitesVerrouillees = new Set([...verrouilles].map(gauche => activite.associations[gauche]));
    if (cote === 'gauche') {
        if (verrouilles.has(identifiant))
            return;
        etat.brouillonActivite.colonneGauche = identifiant;
        return actualiserActiviteInteractive();
    }
    if (droitesVerrouillees.has(identifiant))
        return;
    if (!etat.brouillonActivite.colonneGauche)
        return;
    Object.keys(etat.brouillonActivite.associations || {}).forEach(gauche => { if (!verrouilles.has(gauche) && etat.brouillonActivite.associations[gauche] === identifiant)
        delete etat.brouillonActivite.associations[gauche]; });
    etat.brouillonActivite.associations[etat.brouillonActivite.colonneGauche] = identifiant;
    etat.brouillonActivite.colonneGauche = null;
    actualiserActiviteInteractive();
}
function redessinerFilsAssociation() {
    const panneau = document.querySelector('.association-panneau');
    const dessinFils = panneau?.querySelector('.association-lignes');
    if (!panneau || !dessinFils)
        return;
    const rectanglePanneau = panneau.getBoundingClientRect();
    dessinFils.setAttribute('viewBox', `0 0 ${rectanglePanneau.width} ${rectanglePanneau.height}`);
    dessinFils.innerHTML = '';
    Object.entries(etat.brouillonActivite?.associations || {}).forEach(([identifiantGauche, identifiantDroite]) => {
        const rectangleElementGauche = panneau
            .querySelector(`[data-gauche="${identifiantGauche}"]`)
            ?.getBoundingClientRect();
        const rectangleElementDroite = panneau
            .querySelector(`[data-droite="${identifiantDroite}"]`)
            ?.getBoundingClientRect();
        if (!rectangleElementGauche || !rectangleElementDroite)
            return;
        const fil = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const departHorizontal = rectangleElementGauche.right - rectanglePanneau.left;
        const departVertical = rectangleElementGauche.top + rectangleElementGauche.height / 2 - rectanglePanneau.top;
        const arriveeHorizontale = rectangleElementDroite.left - rectanglePanneau.left;
        const arriveeVerticale = rectangleElementDroite.top + rectangleElementDroite.height / 2 - rectanglePanneau.top;
        const pointControleHorizontal = (departHorizontal + arriveeHorizontale) / 2;
        fil.setAttribute(
            'd',
            `M ${departHorizontal} ${departVertical} C ${pointControleHorizontal} ${departVertical}, `
            + `${pointControleHorizontal} ${arriveeVerticale}, `
            + `${arriveeHorizontale} ${arriveeVerticale}`
        );
        fil.setAttribute('class', 'fil-association');
        dessinFils.appendChild(fil);
    });
}
function initialiserBrouillonActiviteInteractive(question) {
    const activite = question.activite;
    etat.brouillonActivite = {
        identifiantQuestion: question.id,
        associations: {},
        classements: {}
    };

    if (activite.type === 'remettre-ordre') {
        etat.brouillonActivite.ordre = obtenirElementsActiviteMelanges(question, 'elements')
            .map(element => element.id);
    }
    if (activite.type === 'choisir-ordre') {
        etat.brouillonActivite.ordre = [];
    }
    if (activite.type === 'selection-multiple') {
        etat.brouillonActivite.elementsSelectionnes = [];
    }

    const donneesJoker = obtenirDonneesJoker5050();
    if (donneesJoker?.nature === 'selection-multiple') {
        etat.brouillonActivite.elementsRetires = [...(donneesJoker.elementsRetires || [])];
    }
    if (donneesJoker?.nature === 'remettre-ordre') {
        etat.brouillonActivite.ordre = [
            ...(donneesJoker.ordre || etat.brouillonActivite.ordre || [])
        ];
        etat.brouillonActivite.positionsOrdreVerrouillees = [
            ...(donneesJoker.verrouilles || [])
        ];
    }
    if (donneesJoker?.nature === 'choisir-ordre') {
        etat.brouillonActivite.ordre = [...(donneesJoker.ordre || [])];
        etat.brouillonActivite.nombreChoixOrdreVerrouilles = Number(
            donneesJoker.nombreVerrouille || 0
        );
    }
    if (donneesJoker?.nature === 'association') {
        etat.brouillonActivite.associations = { ...(donneesJoker.associations || {}) };
        etat.brouillonActivite.associationsVerrouillees = [
            ...(donneesJoker.verrouilles || [])
        ];
    }
    if (donneesJoker?.nature === 'classer') {
        etat.brouillonActivite.classements = { ...(donneesJoker.classements || {}) };
        etat.brouillonActivite.classementsVerrouilles = [
            ...(donneesJoker.verrouilles || [])
        ];
    }
}

function construireConsigneActivite(activite) {
    const libelle = activite.libelleAffiche || obtenirLibelleActivite(activite.type);
    return `<div class="activite-consigne"><span>${libelle}</span>`
        + `<b>${activite.consigne}</b></div>`;
}

function construireSelectionMultiple() {
    const selectionnes = etat.brouillonActivite.elementsSelectionnes;
    const retires = etat.brouillonActivite.elementsRetires || [];
    const propositionsMelangees = obtenirElementsActiviteMelanges(etat.questionCourante, 'propositions');
    const boutons = propositionsMelangees.map(proposition => {
        const estSelectionnee = selectionnes.includes(proposition.id);
        const estRetiree = retires.includes(proposition.id);
        return `<button class="multiple-choix ${estSelectionnee ? 'selectionne' : ''} ${estRetiree ? 'retire' : ''}"`
            + ` aria-pressed="${estSelectionnee}" data-proposition="${proposition.id}"`
            + ' data-action="basculer-selection-multiple">'
            + '<span class="multiple-coche" aria-hidden="true">✓</span>'
            + `<span>${proposition.texte}</span></button>`;
    }).join('');
    return `<div class="multiple-grille" role="group"`
        + ` aria-label="Propositions à sélectionner">${boutons}</div>`;
}

function construireCommandesOrdre(indice, indicesDeplacables) {
    const desactiverMonter = indice === indicesDeplacables[0] ? 'disabled' : '';
    const desactiverDescendre = indice === indicesDeplacables.at(-1) ? 'disabled' : '';
    return `<button aria-label="Monter l’élément ${indice + 1}"`
        + ` data-action="deplacer-ordre" data-indice="${indice}" data-direction="-1"`
        + ` ${desactiverMonter}>↑</button>`
        + `<button aria-label="Descendre l’élément ${indice + 1}"`
        + ` data-action="deplacer-ordre" data-indice="${indice}" data-direction="1"`
        + ` ${desactiverDescendre}>↓</button>`;
}

function construireRemiseEnOrdre(activite) {
    const elementsParIdentifiant = Object.fromEntries(
        activite.elements.map(element => [element.id, element])
    );
    const positionsVerrouillees = new Set(
        etat.brouillonActivite.positionsOrdreVerrouillees || []
    );
    const indicesDeplacables = [...etat.brouillonActivite.ordre.keys()]
        .filter(indice => !positionsVerrouillees.has(indice));
    const lignes = etat.brouillonActivite.ordre.map((identifiant, indice) => {
        const estVerrouillee = positionsVerrouillees.has(indice);
        const indication = estVerrouillee
            ? '<small>Position confirmée par le 50/50</small>'
            : '';
        const commandes = estVerrouillee
            ? '<span class="ordre-verrou" aria-label="Position confirmée">✓</span>'
            : construireCommandesOrdre(indice, indicesDeplacables);
        return `<li class="${estVerrouillee ? 'ordre-verrouille' : ''}">`
            + `<span class="ordre-texte">${elementsParIdentifiant[identifiant].texte}${indication}</span>`
            + `<span class="ordre-commandes">${commandes}</span></li>`;
    }).join('');
    return `<ol class="ordre-liste">${lignes}</ol>`;
}

function construireCommandesChoisirOrdre(indice, nombreElements, nombreVerrouilles) {
    if (indice < nombreVerrouilles) {
        return '<span class="ordre-verrou" aria-label="Position confirmée">✓</span>';
    }
    const desactiverMonter = indice <= nombreVerrouilles ? 'disabled' : '';
    const desactiverDescendre = indice === nombreElements - 1 ? 'disabled' : '';
    return `<button type="button" aria-label="Monter l’élément ${indice + 1}"`
        + ` data-action="deplacer-choix-ordre" data-indice="${indice}" data-direction="-1"`
        + ` ${desactiverMonter}>↑</button>`
        + `<button type="button" aria-label="Descendre l’élément ${indice + 1}"`
        + ` data-action="deplacer-choix-ordre" data-indice="${indice}" data-direction="1"`
        + ` ${desactiverDescendre}>↓</button>`
        + `<button type="button" aria-label="Retirer l’élément ${indice + 1}"`
        + ` data-action="retirer-choix-ordre" data-indice="${indice}">×</button>`;
}

function construireChoisirPuisOrdonner(question, activite) {
    const elementsParIdentifiant = Object.fromEntries(
        activite.elements.map(element => [element.id, element])
    );
    const selectionnes = etat.brouillonActivite.ordre || [];
    const nombreVerrouilles = Number(
        etat.brouillonActivite.nombreChoixOrdreVerrouilles || 0
    );
    const disponibles = obtenirElementsActiviteMelanges(question, 'elements')
        .filter(element => !selectionnes.includes(element.id));
    const boutonsDisponibles = disponibles.map(element =>
        `<button type="button" class="choisir-ordre-proposition"`
        + ` data-action="ajouter-choix-ordre" data-element="${element.id}">`
        + `${element.texte}</button>`
    ).join('');
    const lignesSelectionnees = selectionnes.map((identifiant, indice) => {
        const estVerrouillee = indice < nombreVerrouilles;
        const indication = estVerrouillee
            ? '<small>Position confirmée par le 50/50</small>'
            : '';
        const commandes = construireCommandesChoisirOrdre(
            indice,
            selectionnes.length,
            nombreVerrouilles
        );
        return `<li class="${estVerrouillee ? 'ordre-verrouille' : ''}">`
            + `<span class="ordre-texte">${elementsParIdentifiant[identifiant]?.texte || identifiant}${indication}</span>`
            + `<span class="ordre-commandes">${commandes}</span></li>`;
    }).join('');
    return '<div class="choisir-ordre-activite">'
        + '<div class="choisir-ordre-reserve" role="group" aria-label="Éléments disponibles">'
        + boutonsDisponibles
        + '</div><ol class="ordre-choix-selectionne" aria-label="Éléments retenus dans l’ordre">'
        + lignesSelectionnees
        + `</ol><div class="choisir-ordre-compteur">${selectionnes.length}/${activite.ordre.length}`
        + ' éléments retenus</div></div>';
}

function construireBoutonAssociationGauche(element, verrouilles) {
    const estActif = etat.brouillonActivite.colonneGauche === element.id;
    const estAssocie = Boolean(etat.brouillonActivite.associations[element.id]);
    const estVerrouille = verrouilles.has(element.id);
    const numeroPaire = estAssocie
        ? etat.questionCourante.activite.colonneGauche.findIndex(candidat => candidat.id === element.id) + 1
        : 0;
    const classes = [
        estActif ? 'actif' : '',
        estAssocie ? 'associe' : '',
        estVerrouille ? 'verrouille-joker' : ''
    ].join(' ');
    return `<button data-gauche="${element.id}" aria-pressed="${estActif || estAssocie}"`
        + ` class="${classes}" data-action="selectionner-association" data-cote="gauche"`
        + ` data-element="${element.id}" ${estVerrouille ? 'disabled' : ''}>`
        + element.texte
        + (numeroPaire ? `<small class="association-repere">Paire ${numeroPaire}</small>` : '')
        + (estVerrouille ? '<small>Association confirmée</small>' : '')
        + '</button>';
}

function construireBoutonAssociationDroite(element, droitesVerrouillees) {
    const associationCorrespondante = Object.entries(etat.brouillonActivite.associations)
        .find(([, identifiantDroite]) => identifiantDroite === element.id);
    const estAssocie = Boolean(associationCorrespondante);
    const estVerrouille = droitesVerrouillees.has(element.id);
    const numeroPaire = estAssocie
        ? etat.questionCourante.activite.colonneGauche
            .findIndex(candidat => candidat.id === associationCorrespondante[0]) + 1
        : 0;
    const classes = [
        estAssocie ? 'associe' : '',
        estVerrouille ? 'verrouille-joker' : ''
    ].join(' ');
    return `<button data-droite="${element.id}" aria-pressed="${estAssocie}"`
        + ` class="${classes}" data-action="selectionner-association" data-cote="droite"`
        + ` data-element="${element.id}" ${estVerrouille ? 'disabled' : ''}>`
        + element.texte
        + (numeroPaire ? `<small class="association-repere">Paire ${numeroPaire}</small>` : '')
        + (estVerrouille ? '<small>Association confirmée</small>' : '')
        + '</button>';
}

function construireAssociation(question, activite) {
    const elementsDroite = obtenirElementsActiviteMelanges(question, 'colonneDroite');
    const elementsGaucheVerrouilles = new Set(
        etat.brouillonActivite.associationsVerrouillees || []
    );
    const elementsDroiteVerrouilles = new Set(
        [...elementsGaucheVerrouilles].map(identifiant => activite.associations[identifiant])
    );
    const colonneGauche = activite.colonneGauche
        .map(element => construireBoutonAssociationGauche(
            element,
            elementsGaucheVerrouilles
        ))
        .join('');
    const colonneDroite = elementsDroite
        .map(element => construireBoutonAssociationDroite(element, elementsDroiteVerrouilles))
        .join('');
    const elementSelectionne = activite.colonneGauche
        .find(element => element.id === etat.brouillonActivite.colonneGauche);
    const nombrePaires = Object.keys(etat.brouillonActivite.associations).length;
    const aideMobile = elementSelectionne
        ? `« ${elementSelectionne.texte} » est sélectionné. Choisis maintenant sa correspondance.`
        : (nombrePaires > 0
            ? `${nombrePaires} paire${nombrePaires > 1 ? 's' : ''} créée${nombrePaires > 1 ? 's' : ''}. Choisis un nouvel élément à relier.`
            : 'Choisis d’abord un élément, puis sa correspondance dans le groupe suivant.');
    return `<p class="association-aide" aria-live="polite">${aideMobile}</p>`
        + '<div class="association-panneau" role="group" aria-label="Éléments à associer">'
        + '<svg class="association-lignes" aria-hidden="true"></svg>'
        + '<div class="association-colonne" role="group" aria-label="Éléments à relier">'
        + `<p class="association-colonne-titre">1. Éléments à relier</p>${colonneGauche}</div>`
        + '<div class="association-colonne" role="group" aria-label="Correspondances possibles">'
        + `<p class="association-colonne-titre">2. Correspondances possibles</p>${colonneDroite}</div></div>`;
}

function construireClassement(activite) {
    const elementsVerrouilles = new Set(
        etat.brouillonActivite.classementsVerrouilles || []
    );
    const lignes = activite.elements.map((element, indiceElement) => {
        const estVerrouille = elementsVerrouilles.has(element.id);
        const categories = activite.categories.map(categorie => {
            const estSelectionnee =
                etat.brouillonActivite.classements[element.id] === categorie.id;
            return `<button aria-pressed="${estSelectionnee}"`
                + ` class="${estSelectionnee ? 'selectionne' : ''}"`
                + ` data-action="attribuer-categorie" data-element="${element.id}"`
                + ` data-categorie="${categorie.id}" ${estVerrouille ? 'disabled' : ''}>`
                + `${categorie.texte}</button>`;
        }).join('');
        const confirmation = estVerrouille
            ? '<small>Classement confirmé par le 50/50</small>'
            : '';
        return `<div class="classement-element ${estVerrouille ? 'verrouille-joker' : ''}">`
            + `<b>${element.texte}${confirmation}</b>`
            + `<div role="group" aria-label="Classement de la proposition ${indiceElement + 1}">`
            + `${categories}</div></div>`;
    }).join('');
    return `<div class="classement-liste">${lignes}</div>`;
}

function construireCorpsActiviteInteractive(question) {
    const activite = question.activite;
    const contenusParType = {
        'selection-multiple': () => construireSelectionMultiple(),
        'remettre-ordre': () => construireRemiseEnOrdre(activite),
        'choisir-ordre': () => construireChoisirPuisOrdonner(question, activite),
        association: () => construireAssociation(question, activite),
        classer: () => construireClassement(activite)
    };
    const construireContenu = contenusParType[activite.type];
    return construireConsigneActivite(activite) + (construireContenu?.() || '');
}

function afficherActiviteInteractive(question, reponse) {
    const zone = selectionner('#zoneReponses');
    const activiteVerrouillee = Boolean(reponse) && reponse.statut !== 'passee';
    zone.className = 'reponses activite-reponses';

    if (activiteVerrouillee) {
        const texteReponse = echapperHtml(reponse.texteReponse || question.bonneReponse);
        zone.innerHTML = '<div class="activite-verrouille"><b>Activité enregistrée</b>'
            + `<span>${texteReponse}</span></div>`;
        return;
    }

    if (
        !etat.brouillonActivite
        || etat.brouillonActivite.identifiantQuestion !== question.id
    ) {
        initialiserBrouillonActiviteInteractive(question);
    }

    zone.innerHTML = construireCorpsActiviteInteractive(question);
    if (question.activite.type === 'association') {
        requestAnimationFrame(redessinerFilsAssociation);
    }
    actualiserBoutonValider();
}
function basculerChoixMultiple(identifiant) { const selectionnes = etat.brouillonActivite.elementsSelectionnes, indice = selectionnes.indexOf(identifiant); if (indice >= 0)
    selectionnes.splice(indice, 1);
else
    selectionnes.push(identifiant); actualiserActiviteInteractive(); }
function ajouterChoixOrdre(identifiantElement) {
    const question = etat.questionCourante, activite = question?.activite;
    if (!activite || activite.type !== 'choisir-ordre')
        return;
    const selectionnes = etat.brouillonActivite.ordre || [];
    if (selectionnes.includes(identifiantElement))
        return;
    if (selectionnes.length >= activite.ordre.length) {
        afficherNotification(`Tu dois retenir ${activite.ordre.length} éléments.`);
        return;
    }
    selectionnes.push(identifiantElement);
    etat.brouillonActivite.ordre = selectionnes;
    actualiserActiviteInteractive();
}
function retirerChoixOrdre(indice) {
    const nombreVerrouilles = Number(etat.brouillonActivite.nombreChoixOrdreVerrouilles || 0);
    if (indice < nombreVerrouilles)
        return;
    const selectionnes = etat.brouillonActivite.ordre || [];
    selectionnes.splice(indice, 1);
    actualiserActiviteInteractive();
}
function deplacerChoixOrdre(indice, direction) {
    const selectionnes = etat.brouillonActivite.ordre || [], nombreVerrouilles = Number(etat.brouillonActivite.nombreChoixOrdreVerrouilles || 0);
    if (indice < nombreVerrouilles)
        return;
    const cible = indice + direction;
    if (cible < nombreVerrouilles || cible < 0 || cible >= selectionnes.length)
        return;
    [selectionnes[indice], selectionnes[cible]] = [selectionnes[cible], selectionnes[indice]];
    actualiserActiviteInteractive();
}
function attribuerCategorie(identifiantElement, identifiantCategorie) { if (etat.brouillonActivite.classementsVerrouilles?.includes(identifiantElement))
    return; etat.brouillonActivite.classements[identifiantElement] = identifiantCategorie; actualiserActiviteInteractive(); }
function tableauxEgaux(tableauA, tableauB) {
    return tableauA.length === tableauB.length
        && tableauA.every((valeur, indice) => valeur === tableauB[indice]);
}
function obtenirTexteAssociationDroite(activite, identifiantDroite) {
    return activite?.colonneDroite?.find(element => element.id === identifiantDroite)?.texte || '';
}
function associationElementCorrespond(activite, identifiantGauche, identifiantDroiteSaisi, schemaAttendu) {
    const identifiantDroiteAttendu = schemaAttendu?.[identifiantGauche];
    if (!identifiantDroiteAttendu || !identifiantDroiteSaisi)
        return false;
    if (identifiantDroiteSaisi === identifiantDroiteAttendu)
        return true;
    const equivalentsDeclares = activite?.equivalencesAssociation?.[identifiantGauche] || [];
    if (equivalentsDeclares.includes(identifiantDroiteSaisi))
        return true;
    // Deux cartes portant réellement le même libellé ont la même valeur pédagogique.
    // Le joueur n'est donc pas sanctionné pour avoir choisi l'autre identifiant technique.
    const texteAttendu = normaliserReponseEvaluation(obtenirTexteAssociationDroite(activite, identifiantDroiteAttendu));
    const texteSaisi = normaliserReponseEvaluation(obtenirTexteAssociationDroite(activite, identifiantDroiteSaisi));
    return Boolean(texteAttendu && texteSaisi && texteAttendu === texteSaisi);
}
function validerSchemaAssociations(activite, associationsSaisies, schemaAttendu) {
    return Object.keys(schemaAttendu || {}).length === Object.keys(associationsSaisies || {}).length
        && Object.keys(schemaAttendu || {}).every(identifiantGauche =>
            associationElementCorrespond(activite, identifiantGauche, associationsSaisies[identifiantGauche], schemaAttendu)
        );
}
function validerAssociationsActivite(activite, associationsSaisies) {
    const schemasAcceptes = [
        activite?.associations || {},
        ...(Array.isArray(activite?.associationsAcceptees) ? activite.associationsAcceptees : [])
    ];
    return schemasAcceptes.some(schema => validerSchemaAssociations(activite, associationsSaisies, schema));
}
function validerActiviteInteractive() {
    if (etat.questionValidee)
        return;
    const question = etat.questionCourante, activite = question.activite, brouillon = etat.brouillonActivite;
    let estCorrecte = false, texteChoisi = '', precisions = {};
    if (activite.type === 'selection-multiple') {
        if (!brouillon.elementsSelectionnes.length) {
            afficherNotification('Sélectionne au moins une proposition.');
            return;
        }
        estCorrecte = tableauxEgaux([...brouillon.elementsSelectionnes].sort(), [...activite.reponses].sort());
        texteChoisi = activite.propositions.filter(proposition => brouillon.elementsSelectionnes.includes(proposition.id)).map(proposition => proposition.texte).join(' · ');
        precisions = { elementsSelectionnes: [...brouillon.elementsSelectionnes] };
    }
    else if (activite.type === 'remettre-ordre') {
        estCorrecte = tableauxEgaux(brouillon.ordre, activite.ordre);
        const parIdentifiant = Object.fromEntries(activite.elements.map(element => [element.id, element.texte]));
        texteChoisi = brouillon.ordre.map(identifiant => parIdentifiant[identifiant]).join(' → ');
        precisions = { ordre: [...brouillon.ordre] };
    }
    else if (activite.type === 'choisir-ordre') {
        if ((brouillon.ordre || []).length !== activite.ordre.length) {
            afficherNotification(`Choisis exactement ${activite.ordre.length} éléments.`);
            return;
        }
        estCorrecte = tableauxEgaux(brouillon.ordre, activite.ordre);
        const parIdentifiant = Object.fromEntries(activite.elements.map(element => [element.id, element.texte]));
        texteChoisi = brouillon.ordre.map(identifiant => parIdentifiant[identifiant]).join(' → ');
        precisions = { ordre: [...brouillon.ordre] };
    }
    else if (activite.type === 'association') {
        if (Object.keys(brouillon.associations).length < activite.colonneGauche.length) {
            afficherNotification('Relie chaque élément avant de valider.');
            return;
        }
        estCorrecte = validerAssociationsActivite(activite, brouillon.associations);
        texteChoisi = 'Associations complétées';
        precisions = { associations: { ...brouillon.associations } };
    }
    else if (activite.type === 'classer') {
        if (Object.keys(brouillon.classements).length < activite.elements.length) {
            afficherNotification('Classe chaque élément avant de valider.');
            return;
        }
        estCorrecte = Object.entries(activite.classements).every(([identifiantElement, identifiantCategorie]) =>
            brouillon.classements[identifiantElement] === identifiantCategorie
        );
        texteChoisi = 'Classement complété';
        precisions = { classements: { ...brouillon.classements } };
    }
    finaliserReponse(estCorrecte, texteChoisi, { precisions: precisions });
}
