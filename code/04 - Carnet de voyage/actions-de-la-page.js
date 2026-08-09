/**
 * Mettre à jour le Carnet de voyage.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
function obtenirProchaineDestinationParcours(programme) {
    const etapeAReprendre = obtenirEtapeAReprendre(programme);
    if (etapeAReprendre) {
        const nombreQuestions = obtenirQuestionsEtape(programme.id, etapeAReprendre.id).length;
        const nombreQuestionsTraitees = compterQuestionsTraiteesEtape(programme.id, etapeAReprendre.id);
        if (nombreQuestionsTraitees < nombreQuestions)
            return `Prochaine destination : étape ${etapeAReprendre.id} · ${etapeAReprendre.titre}`;
        return `Défi d’autonomie : rejoue l’étape ${etapeAReprendre.id} sans joker.`;
    }
    return 'Toutes les étapes sont maîtrisées : l’évaluation finale t’attend.';
}
function calculerAvancementCarnetParcours(programme) {
    const questionsParcours = programme.etapes.flatMap(etapeProgramme =>
        obtenirQuestionsEtape(programme.id, etapeProgramme.id)
    );
    if (!questionsParcours.length)
        return 0;
    const nombreQuestionsTraitees = programme.etapes.reduce(
        (total, etapeProgramme) => total + compterQuestionsTraiteesEtape(programme.id, etapeProgramme.id),
        0
    );
    return Math.round(nombreQuestionsTraitees / questionsParcours.length * 100);
}
function actualiserCarnetParcours(programme) {
    const titreSymbolique = selectionner('#titreSymboliqueParcours');
    const prochaineDestination = selectionner('#prochaineDestinationParcours');
    const route = selectionner('#routeCarnetParcours');
    if (!titreSymbolique || !prochaineDestination || !route)
        return;
    const nombreEtapesMaitrisees = programme.etapes.filter(etapeProgramme =>
        estEtapeMaitrisee(programme.id, etapeProgramme.id)
    ).length;
    const avancement = calculerAvancementCarnetParcours(programme);
    titreSymbolique.textContent = obtenirTitreSymboliqueParcours(nombreEtapesMaitrisees);
    prochaineDestination.textContent = obtenirProchaineDestinationParcours(programme);
    route.style.setProperty('--avancement-carnet', `${avancement}%`);
    route.setAttribute('aria-valuenow', String(avancement));
    afficherSouvenirsParcours(programme);
    afficherDefisParcours(programme);
}
function actualiserResumeCarteParcours(programme) {
    const resumeCarte = selectionner('#resumeCarteParcours');
    if (!resumeCarte)
        return;
    const nombreEtapesMaitrisees = programme.etapes.filter(etapeProgramme =>
        estEtapeMaitrisee(programme.id, etapeProgramme.id)
    ).length;
    const evaluationOuverte = nombreEtapesMaitrisees === programme.etapes.length;
    resumeCarte.textContent = evaluationOuverte
        ? `${nombreEtapesMaitrisees}/${programme.etapes.length} destinations maîtrisées sans joker · Évaluation finale ouverte.`
        : `${nombreEtapesMaitrisees}/${programme.etapes.length} destinations maîtrisées sans joker · Le prochain jalon t’attend sur la carte.`;
}
function afficherSouvenirsParcours(programme) {
    const zone = selectionner('#souvenirsParcours');
    if (!zone)
        return;
    const etapesMaitrisees = programme.etapes.filter(etapeProgramme =>
        estEtapeMaitrisee(programme.id, etapeProgramme.id)
    );
    zone.innerHTML = '';
    if (!etapesMaitrisees.length) {
        const message = document.createElement('p');
        message.className = 'carnet-vide';
        message.textContent = 'Maîtrise une étape pour conserver ses trois repères essentiels.';
        zone.appendChild(message);
        return;
    }
    etapesMaitrisees.forEach((etapeProgramme, indice) => {
        const fiche = document.createElement('details');
        fiche.className = 'souvenir-etape';
        fiche.dataset.etape = String(etapeProgramme.id);
        fiche.style.setProperty('--couleur-etape', etapeProgramme.couleur || '#ffc83d');
        fiche.open = indice === etapesMaitrisees.length - 1;
        const titre = document.createElement('summary');
        titre.textContent = `Étape ${etapeProgramme.id} · ${etapeProgramme.titre}`;
        const liste = document.createElement('ul');
        (etapeProgramme.souvenirs || []).forEach(souvenir => {
            const element = document.createElement('li');
            element.textContent = souvenir;
            liste.appendChild(element);
        });
        fiche.append(titre, liste);
        zone.appendChild(fiche);
    });
}
function afficherDefisParcours(programme) {
    const zone = selectionner('#defisParcours');
    if (!zone)
        return;
    const etapeAReprendre = obtenirEtapeAReprendre(programme);
    const meilleureSerie = Number(sauvegarde.meilleureSerie) || 0;
    const aucuneErreurActive = sauvegarde.aDejaJoue && compterErreursActives() === 0;
    const defis = [
        {
            libelle: etapeAReprendre
                ? `Valider l’étape ${etapeAReprendre.id} sans joker`
                : 'Valider les onze étapes sans joker',
            termine: !etapeAReprendre,
            progression: etapeAReprendre ? 'En cours' : 'Réussi'
        },
        {
            libelle: 'Enchaîner 5 réussites autonomes',
            termine: meilleureSerie >= 5,
            progression: `${Math.min(meilleureSerie, 5)}/5`
        },
        {
            libelle: 'Ne garder aucune erreur active',
            termine: aucuneErreurActive,
            progression: aucuneErreurActive ? 'Réussi' : `${compterErreursActives()} à revoir`
        }
    ];
    zone.innerHTML = '';
    defis.forEach(defi => {
        const element = document.createElement('li');
        element.className = defi.termine ? 'defi-termine' : '';
        const indicateur = document.createElement('span');
        indicateur.className = 'defi-indicateur';
        indicateur.setAttribute('aria-hidden', 'true');
        indicateur.textContent = defi.termine ? '✓' : '○';
        const libelle = document.createElement('strong');
        libelle.textContent = defi.libelle;
        const progression = document.createElement('small');
        progression.textContent = defi.progression;
        element.append(indicateur, libelle, progression);
        zone.appendChild(element);
    });
}
