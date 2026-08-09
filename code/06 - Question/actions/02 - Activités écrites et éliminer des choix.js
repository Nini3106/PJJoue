/**
 * Afficher et valider les activités écrites et les activités où l’on retire des choix.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
function masquerMoitiéTexte(texte) {
    const mots = String(texte || '').trim().split(/\s+/).filter(Boolean);
    if (!mots.length)
        return '';
    const nombreADevoiler = Math.max(1, Math.ceil(mots.length / 2));
    let devoilees = 0;
    return mots.map((mot, indice) => {
        const doitDevoiler = (indice % 2 === 0 && devoilees < nombreADevoiler) || (mots.length === 1 && indice === 0);
        if (doitDevoiler) {
            devoilees++;
            return mot;
        }
        return '____';
    }).join(' ');
}
function obtenirDonneesJoker5050() {
    return etat.jokers?.donneesJoker5050 || null;
}
function marquerJokerUtilise() {
    etat.sessionAvecJoker = true;
    if (etat.mode === 'parcours')
        etat.etapeAvecJoker = true;
}
function consommerJoker5050(donnees) {
    marquerJokerUtilise();
    envoyerUtilisationJoker('50_50');
    etat.jokers.cinquanteCinquante = false;
    etat.jokers.donneesJoker5050 = donnees;
    selectionner('#boutonJoker5050').disabled = true;
    actualiserBoutonJokers();
}
function obtenirConfigurationValidation() {
    const question = etat.questionCourante;
    if (!question || etat.questionValidee)
        return null;
    const mode = question.modePrefere || question.activite?.type || 'choix-unique';
    if (mode === 'reponse-ecrite') {
        return { libelle: 'Valider', action: 'valider-reponse-ecrite' };
    }
    if (mode === 'eliminer') {
        return { libelle: 'Valider mes retraits', action: 'valider-eliminations' };
    }
    if (['selection-multiple', 'remettre-ordre', 'association', 'classer'].includes(mode)) {
        return { libelle: 'Valider cette réponse', action: 'valider-activite' };
    }
    // Les questions à choix simple se valident directement au clic :
    // pas de bouton Valider supplémentaire.
    return null;
}
function actualiserBoutonValider() {
    const bouton = selectionner('#boutonValider');
    if (!bouton)
        return;
    const configuration = obtenirConfigurationValidation();
    if (!configuration) {
        bouton.classList.add('masque');
        bouton.removeAttribute('data-action');
        bouton.textContent = 'Valider';
        return;
    }
    bouton.textContent = configuration.libelle;
    bouton.dataset.action = configuration.action;
    bouton.disabled = false;
    bouton.classList.remove('masque');
}
// -----------------------------------------------------------------------------
// Affichage et manipulation des activités pédagogiques
// -----------------------------------------------------------------------------
function afficherActiviteEcrite(reponse) {
    const zone = selectionner('#zoneReponses');
    zone.className = 'reponses activite-reponses';
    if (reponse && reponse.statut !== 'passee') {
        const texteReponse = echapperHtml(reponse.texteReponse || '');
        zone.innerHTML = '<div class="activite-verrouille">'
            + '<b>Réponse écrite enregistrée</b>'
            + `<span>${texteReponse}</span></div>`;
        return;
    }
    const donneesJoker = obtenirDonneesJoker5050();
    const revelation = donneesJoker?.nature === 'reponse-ecrite'
        ? '<div class="revelation-cinquante-cinquante">'
            + '<b>50/50 :</b> la moitié des éléments de la réponse est révélée :<br>'
            + `${donneesJoker.texteDevoile}</div>`
        : '';
    zone.innerHTML = '<div class="ecrite-activite">'
        + '<div class="activite-consigne"><span>Réponse écrite</span>'
        + '<b>Écris la réponse essentielle avec tes mots. Les formulations proches sont acceptées.</b>'
        + `</div>${revelation}<div class="ecrite-zone">`
        + '<input id="reponseEcrite" autocomplete="off" aria-label="Ta réponse"'
        + ' placeholder="Écris ta réponse ici"></div></div>';
    const champEcrit = selectionner('#reponseEcrite');
    const brouillonEcrit = etat.brouillonsEcrits?.get(etat.questionCourante?.id) || '';
    if (champEcrit) {
        champEcrit.value = brouillonEcrit;
        champEcrit.addEventListener('input', () => {
            etat.brouillonsEcrits = etat.brouillonsEcrits || new Map();
            etat.brouillonsEcrits.set(etat.questionCourante.id, champEcrit.value);
            enregistrerSessionEnCours();
        });
    }
    actualiserBoutonValider();
}
function validerActiviteEcrite() {
    const champ = selectionner('#reponseEcrite');
    if (!champ || !champ.value.trim()) {
        afficherNotification('Écris une réponse avant de valider.');
        return;
    }
    const question = etat.questionCourante;
    const estCorrecte = question?.estEvaluationFinale
        ? validerReponseEcriteEvaluation(champ.value, question)
        : validerReponseEcriteSouple(champ.value, question);
    finaliserReponse(estCorrecte, champ.value.trim());
}
function obtenirNombreEliminationsAttendues(question) {
    const nombreConfigure = Number(question?.nombreEliminationsAttendues);
    if (Number.isInteger(nombreConfigure) && nombreConfigure > 0)
        return nombreConfigure;
    const mauvaisesReponses = Array.isArray(question?.mauvaisesReponses) ? question.mauvaisesReponses.length : 0;
    return Math.max(1, Math.min(2, mauvaisesReponses || 2));
}
function obtenirConsigneElimination(question, nombreAttendu) {
    if (String(question?.consigneElimination || '').trim())
        return String(question.consigneElimination).trim();
    return `Écarte exactement ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} qui ne convient${nombreAttendu > 1 ? 'nent' : ''} pas.`;
}
function afficherActiviteEliminer(question, reponse) {
    const zoneReponses = selectionner('#zoneReponses');
    zoneReponses.className = 'reponses activite-reponses';
    if (reponse && reponse.statut !== 'passee') {
        zoneReponses.innerHTML = `<div class="activite-verrouille"><b>Élimination enregistrée</b><span>${echapperHtml(reponse.texteReponse || '')}</span></div>`;
        return;
    }
    const donneesJoker = obtenirDonneesJoker5050();
    if (!etat.brouillonActivite || etat.brouillonActivite.identifiantQuestion !== question.id) {
        etat.brouillonActivite = { identifiantQuestion: question.id, elementsElimines: [], eliminationsVerrouillees: [] };
        if (donneesJoker?.nature === 'eliminer') {
            etat.brouillonActivite.elementsElimines = [...(donneesJoker.elementsElimines || [])];
            etat.brouillonActivite.eliminationsVerrouillees = [...(donneesJoker.verrouilles || [])];
        }
    }
    const propositions = obtenirChoixQuestion(question);
    const elementsElimines = etat.brouillonActivite.elementsElimines || [];
    const eliminationsVerrouillees = etat.brouillonActivite.eliminationsVerrouillees || [];
    const boutonsPropositions = propositions.map((proposition, indiceProposition) => `
        <button class="elimination-choix ${elementsElimines.includes(indiceProposition) ? 'elimine' : ''} ${eliminationsVerrouillees.includes(indiceProposition) ? 'verrouille-joker' : ''}"
                type="button"
                data-action="basculer-elimination"
                data-indice="${indiceProposition}"
                ${eliminationsVerrouillees.includes(indiceProposition) ? 'disabled' : ''}>
            ${proposition.texte}
        </button>`).join('');
    const rappelJoker = eliminationsVerrouillees.length
        ? '<div class="revelation-cinquante-cinquante"><b>50/50 :</b> une partie des retraits corrects est déjà confirmée et verrouillée.</div>'
        : '';
    const nombreAttendu = obtenirNombreEliminationsAttendues(question);
    const consigne = obtenirConsigneElimination(question, nombreAttendu);
    zoneReponses.innerHTML = `<div class="elimination-activite">
        <div class="activite-consigne"><span>Retirer des choix</span><b>${echapperHtml(consigne)}</b></div>
        ${rappelJoker}
        <div class="elimination-grille">${boutonsPropositions}</div>
        <div class="elimination-compteur">${elementsElimines.length}/${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} écartée${elementsElimines.length > 1 ? 's' : ''}</div>
    </div>`;
    actualiserBoutonValider();
}
function basculerElimination(indice) {
    const eliminationsVerrouillees = etat.brouillonActivite.eliminationsVerrouillees || [];
    if (eliminationsVerrouillees.includes(indice)) {
        afficherNotification('Ce retrait a été confirmé par le 50/50.');
        return;
    }
    const elementsElimines = etat.brouillonActivite.elementsElimines || [];
    const positionExistante = elementsElimines.indexOf(indice);
    if (positionExistante >= 0) {
        elementsElimines.splice(positionExistante, 1);
    }
    else {
        const nombreAttendu = obtenirNombreEliminationsAttendues(etat.questionCourante);
        if (elementsElimines.length >= nombreAttendu) {
            afficherNotification(`Tu peux retirer ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} maximum.`);
            return;
        }
        elementsElimines.push(indice);
    }
    etat.brouillonActivite.elementsElimines = elementsElimines;
    afficherActiviteEliminer(etat.questionCourante, null);
}
function validerEliminations() {
    const elementsElimines = etat.brouillonActivite?.elementsElimines || [];
    const nombreAttendu = obtenirNombreEliminationsAttendues(etat.questionCourante);
    if (elementsElimines.length !== nombreAttendu) {
        afficherNotification(`Retire exactement ${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''}.`);
        return;
    }
    const propositions = obtenirChoixQuestion(etat.questionCourante);
    const estCorrecte = elementsElimines.every(indice => !propositions[indice].estCorrecte);
    const texteReponse = elementsElimines.map(indice => propositions[indice].texte).join(' · ');
    finaliserReponse(estCorrecte, texteReponse);
}
