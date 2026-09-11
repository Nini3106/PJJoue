/**
 * PJJoue V1 — 04 - Carnet de parcours.
 *
 * Ce fichier est assemblé dans le moteur principal par le constructeur du site.
 * Les fonctions restent volontairement lisibles et nommées en français.
 * Les API natives du navigateur conservent leur nom technique.
 */
function obtenirProchaineDestinationParcours(programme) {
    const etapeAReprendre = obtenirEtapeAReprendre(programme);
    if (etapeAReprendre) {
        const nombreQuestions = obtenirQuestionsEtape(programme.id, etapeAReprendre.id).length;
        const nombreQuestionsTraitees = compterQuestionsTraiteesEtape(programme.id, etapeAReprendre.id);
        if (nombreQuestionsTraitees < nombreQuestions)
            return `Parcours ${obtenirOrdreTheme(programme.id) + 1} · étape ${etapeAReprendre.id} · ${etapeAReprendre.titre}`;
        return `Parcours ${obtenirOrdreTheme(programme.id) + 1} · rejoue l’étape ${etapeAReprendre.id} sans aide pour la consolider.`;
    }
    if (!estEvaluationFinaleReussie(programme.id))
        return `Parcours ${obtenirOrdreTheme(programme.id) + 1} · évaluation finale à réussir.`;
    return null;
}
function obtenirProchaineDestinationComplete() {
    for (const theme of THEMES) {
        const destination = obtenirProchaineDestinationParcours(PROGRAMMES[theme.id]);
        if (destination)
            return `Prochaine destination : ${destination}`;
    }
    const totalEtapes = THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0);
    return `Parcours complet réussi : les ${totalEtapes} étapes et les ${THEMES.length} évaluations sont validées.`;
}
function calculerAvancementCarnetComplet() {
    const questionsApprentissage = QUESTIONS.filter(question => !question.estEvaluationFinale);
    if (!questionsApprentissage.length)
        return 0;
    const traitees = THEMES.reduce((total, theme) => total + obtenirEtapesProgramme(theme.id).reduce(
        (sousTotal, etape) => sousTotal + compterQuestionsTraiteesEtape(theme.id, etape.id), 0
    ), 0);
    return Math.round(traitees / questionsApprentissage.length * 100);
}
function actualiserCarnetParcours(_programmeIgnore = null) {
    const titreSymbolique = selectionner('#titreSymboliqueParcours');
    const prochaineDestination = selectionner('#prochaineDestinationParcours');
    const route = selectionner('#routeCarnetParcours');
    const journal = selectionner('.carnet-journal');
    if (!titreSymbolique || !prochaineDestination || !route)
        return;
    const prochainTheme = THEMES.find(theme => obtenirProchaineDestinationParcours(PROGRAMMES[theme.id]));
    const identiteProchainParcours = obtenirIdentiteParcours(prochainTheme?.id || 'commun');
    const nombreEtapesMaitrisees = compterEtapesMaitrisees();
    const avancement = calculerAvancementCarnetComplet();
    titreSymbolique.textContent = obtenirTitreSymboliqueParcours(nombreEtapesMaitrisees);
    prochaineDestination.textContent = obtenirProchaineDestinationComplete();
    journal?.style.setProperty('--parcours-accent', identiteProchainParcours.couleur);
    route.style.setProperty('--avancement-carnet', `${avancement}%`);
    route.setAttribute('aria-valuenow', String(avancement));
    route.setAttribute('aria-label', `Avancement dans l’ensemble des parcours : ${avancement}%`);
    afficherSouvenirsParcoursComplet();
    afficherDefisParcoursComplet();
}
function actualiserResumeCarteParcours(programme) {
    const resumeCarte = selectionner('#resumeCarteParcours');
    if (!resumeCarte || !programme)
        return;
    const nombreEtapesMaitrisees = programme.etapes.filter(etapeProgramme =>
        estEtapeMaitrisee(programme.id, etapeProgramme.id)
    ).length;
    const nombreEtapesTerminees = programme.etapes.filter(etapeProgramme => {
        const total = obtenirQuestionsEtape(programme.id, etapeProgramme.id).length;
        return total > 0 && compterQuestionsTraiteesEtape(programme.id, etapeProgramme.id) >= total;
    }).length;
    const evaluationOuverte = nombreEtapesTerminees === programme.etapes.length;
    const evaluationReussie = estEvaluationFinaleReussie(programme.id);
    resumeCarte.textContent = evaluationReussie
        ? `${nombreEtapesTerminees}/${programme.etapes.length} étapes terminées · évaluation réussie.`
        : evaluationOuverte
            ? `${nombreEtapesTerminees}/${programme.etapes.length} étapes terminées · évaluation ouverte.`
            : `${nombreEtapesTerminees}/${programme.etapes.length} étapes terminées · ${nombreEtapesMaitrisees} maîtrisées sans aide.`;
}
function afficherSouvenirsParcoursComplet() {
    const zone = selectionner('#souvenirsParcours');
    if (!zone)
        return;
    const souvenirs = [];
    THEMES.forEach((theme, indexTheme) => {
        PROGRAMMES[theme.id].etapes.forEach(etapeProgramme => {
            if (estEtapeMaitrisee(theme.id, etapeProgramme.id))
                souvenirs.push({ theme, indexTheme, etapeProgramme });
        });
    });
    zone.innerHTML = '';
    if (!souvenirs.length) {
        const message = document.createElement('p');
        message.className = 'carnet-vide';
        message.textContent = 'Maîtrise une étape pour conserver ses trois repères essentiels.';
        zone.appendChild(message);
        return;
    }
    souvenirs.forEach(({ theme, indexTheme, etapeProgramme }, indice) => {
        const fiche = document.createElement('details');
        fiche.className = 'souvenir-etape';
        fiche.dataset.etape = String(etapeProgramme.id);
        fiche.dataset.theme = theme.id;
        fiche.style.setProperty('--couleur-etape', etapeProgramme.couleur || '#2d7379');
        fiche.open = indice === souvenirs.length - 1;
        const titre = document.createElement('summary');
        titre.textContent = `Parcours ${indexTheme + 1} · Étape ${etapeProgramme.id} · ${etapeProgramme.titre}`;
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
function afficherDefisParcoursComplet() {
    const zone = selectionner('#defisParcours');
    if (!zone)
        return;
    const nombreEtapesMaitrisees = compterEtapesMaitrisees();
    const evaluationsReussies = THEMES.filter(theme => estEvaluationFinaleReussie(theme.id)).length;
    const meilleureSerie = Number(sauvegarde.meilleureSerie) || 0;
    const aucuneErreurActive = sauvegarde.aDejaJoue && compterErreursActives() === 0;
    const defis = [
        {
            libelle: `Valider les ${THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0)} étapes sans joker`,
            termine: nombreEtapesMaitrisees === THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0),
            progression: `${nombreEtapesMaitrisees}/${THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0)}`
        },
        {
            libelle: `Réussir les ${THEMES.length} évaluations finales`,
            termine: evaluationsReussies === THEMES.length,
            progression: `${evaluationsReussies}/${THEMES.length}`
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
