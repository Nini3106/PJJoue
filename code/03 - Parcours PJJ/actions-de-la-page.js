/**
 * PJJoue V1 — 03 - Parcours PJJ.
 * Choix d’un parcours puis affichage détaillé du parcours sélectionné.
 * Le moteur pédagogique et les données restent inchangés.
 */
const IDENTITES_PARCOURS = Object.freeze({
    commun: {
        numero: '01',
        titre: 'Découvrir la PJJ',
        chapitre: 'Point de départ',
        description: 'Missions, publics, professionnels, structures et logique éducative de la PJJ.',
        niveau: 'Débutant',
        duree: '≈ 1 h 20',
        couleur: '#4f8cff',
        couleurTexte: '#9fc2ff',
        couleurRgb: '79,140,255'
    },
    procedure_ordinaire: {
        numero: '02',
        titre: 'De l’enquête à la sanction',
        chapitre: 'Procédure ordinaire',
        description: 'Suis le dossier depuis l’enquête et l’orientation du parquet jusqu’à la culpabilité, la MEE éventuelle et la sanction.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 40',
        couleur: '#d49a00',
        couleurTexte: '#ffd36a',
        couleurRgb: '212,154,0'
    },
    information_judiciaire: {
        numero: '03',
        titre: 'Avant le jugement : l’information judiciaire',
        chapitre: 'Avant le jugement',
        description: 'Situe l’information judiciaire avant le jugement et repère le rôle du JI, du JLD et les décisions provisoires.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 45',
        couleur: '#0891b2',
        couleurTexte: '#70d7ea',
        couleurRgb: '8,145,178'
    },
    jugement_educatif_ordinaire: {
        numero: '04',
        titre: 'Du jugement à la sanction',
        chapitre: 'Jugement éducatif',
        description: 'Comprends le rôle du JE et du TPE et construis la réponse éducative au stade du jugement et de la sanction.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 45',
        couleur: '#8b5cf6',
        couleurTexte: '#c7afff',
        couleurRgb: '139,92,246'
    },
    matiere_criminelle_peines: {
        numero: '05',
        titre: 'De la qualification criminelle aux peines',
        chapitre: 'Matière criminelle',
        description: 'Pars de la qualification et de l’âge aux faits pour identifier la juridiction, puis la sanction ou la peine possible.',
        niveau: 'Avancé',
        duree: '≈ 1 h 50',
        couleur: '#e11d48',
        couleurTexte: '#ff91a8',
        couleurRgb: '225,29,72'
    },
    application_execution_peines: {
        numero: '06',
        titre: 'Après la sanction : application et exécution',
        chapitre: 'Application des peines',
        description: 'Après la sanction, suis l’exécution, les aménagements, les incidents et l’articulation entre JE et JAP.',
        niveau: 'Avancé',
        duree: '≈ 1 h 40',
        couleur: '#0f766e',
        couleurTexte: '#70d6ca',
        couleurRgb: '15,118,110'
    }
});
function obtenirIdentiteParcours(identifiantTheme) {
    return IDENTITES_PARCOURS[identifiantTheme] || IDENTITES_PARCOURS.commun;
}
/**
 * Construit le repère de maîtrise autonome. Les deux traits derrière l'étoile
 * font partie du symbole : il s'agit volontairement d'une étoile filante,
 * jamais d'une étoile seule. Le nombre est réservé au résumé d'un parcours.
 */
function creerEtoileFilanteProgression(nombreJalons = null) {
    const nombre = Number(nombreJalons);
    const afficherNombre = Number.isFinite(nombre) && nombre > 0;
    return `<span class="etoile-filante-progression${afficherNombre ? ' etoile-filante-progression-compteur' : ''}" aria-hidden="true">
        <svg viewBox="0 0 76 46" focusable="false">
            <path class="etoile-filante-trainee etoile-filante-trainee-haute" d="M4 28 C16 27 25 21 34 12"></path>
            <path class="etoile-filante-trainee etoile-filante-trainee-basse" d="M8 40 C21 37 31 30 39 21"></path>
            <path class="etoile-filante-astre" d="M50 4 L54.4 13.4 L64.7 14.6 L57.1 21.7 L59.2 31.7 L50 26.5 L40.8 31.7 L42.9 21.7 L35.3 14.6 L45.6 13.4 Z"></path>
        </svg>
        ${afficherNombre ? `<b class="etoile-filante-nombre">${Math.round(nombre)}</b>` : ''}
    </span>`;
}
function calculerProgressionParcours(identifiantTheme) {
    const programme = PROGRAMMES[identifiantTheme];
    if (!programme)
        return { maitrisees: 0, total: 0, pourcentage: 0 };
    synchroniserEtapesReussiesEnAutonomie(programme);
    const maitrisees = programme.etapes.filter(etapeProgramme => estEtapeMaitrisee(identifiantTheme, etapeProgramme.id)).length;
    const total = programme.etapes.length;
    const evaluationReussie = estEvaluationFinaleReussie(identifiantTheme);
    const jalonsMaitrises = maitrisees + (evaluationReussie ? 1 : 0);
    const totalJalons = total + 1;
    return {
        maitrisees,
        total,
        pourcentage: total ? Math.round(maitrisees / total * 100) : 0,
        evaluationReussie,
        jalonsMaitrises,
        totalJalons
    };
}
function actualiserSelecteurParcours() {
    const zone = selectionner('#selecteurParcours');
    if (!zone)
        return;
    zone.innerHTML = '';
    THEMES.forEach(theme => {
        const identite = obtenirIdentiteParcours(theme.id);
        const progression = calculerProgressionParcours(theme.id);
        const bouton = document.createElement('button');
        const statut = progression.evaluationReussie
            ? 'Terminé'
            : progression.pourcentage === 100
                ? 'Évaluation à passer'
                : progression.pourcentage > 0 ? 'En cours' : 'À découvrir';
        bouton.type = 'button';
        const estDernierParcours = theme.id === THEMES[THEMES.length - 1].id;
        bouton.className = `selecteur-parcours-bouton${theme.id === 'commun' ? ' parcours-recommande' : ''}${estDernierParcours ? ' parcours-cloture' : ''}`;
        bouton.dataset.theme = theme.id;
        bouton.style.setProperty('--parcours-accent', identite.couleur);
        bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
        bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        bouton.setAttribute('aria-label', `${identite.titre}. ${progression.maitrisees} étapes maîtrisées sans joker sur ${progression.total}.${progression.evaluationReussie ? ' Évaluation finale réussie.' : ''}`);
        bouton.innerHTML = `
            ${progression.jalonsMaitrises > 0 ? creerEtoileFilanteProgression(progression.jalonsMaitrises) : ''}
            <span class="selecteur-parcours-numero">Parcours ${identite.numero}</span>
            <span class="selecteur-parcours-icone">${creerIconeTheme(theme.id, '')}</span>
            <span class="selecteur-parcours-statut">${statut}</span>
            <span class="selecteur-parcours-texte">
                <b>${theme.id === 'commun' ? 'Recommandé pour commencer' : identite.chapitre}</b>
                <strong>${identite.titre}</strong>
                <small>${identite.description}</small>
            </span>
            <span class="selecteur-parcours-informations"><span>${identite.niveau}</span><span>${identite.duree}</span></span>
            <span class="selecteur-parcours-progression" aria-hidden="true"><i style="width:${progression.pourcentage}%"></i></span>
            <span class="selecteur-parcours-pied"><span>${progression.maitrisees}/${progression.total} étapes</span><span>Explorer →</span></span>`;
        bouton.onclick = () => ouvrirParcours(theme.id);
        zone.appendChild(bouton);
    });
}
function ouvrirChoixParcours(optionsAffichage = {}) {
    etat.theme = null;
    selectionner('#vueChoixParcours')?.classList.remove('masque');
    selectionner('#vueDetailParcours')?.classList.add('masque');
    actualiserSelecteurParcours();
    afficherEcran('parcours', optionsAffichage);
}
function actualiserEnteteParcours(programme) {
    const identite = obtenirIdentiteParcours(programme.id);
    const progression = calculerProgressionParcours(programme.id);
    const prochaineEtape = obtenirEtapeAReprendre(programme);
    const detail = selectionner('#vueDetailParcours');
    if (detail) {
        detail.style.setProperty('--parcours-accent', identite.couleur);
        detail.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
        detail.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
    }
    const titre = selectionner('#titreParcours');
    const sousTitre = selectionner('#sousTitreParcours');
    const surtitre = selectionner('#surtitreParcours');
    const icone = selectionner('#iconeParcoursSelectionne');
    if (titre) titre.textContent = identite.titre;
    if (sousTitre) sousTitre.textContent = identite.description;
    if (surtitre) surtitre.textContent = `${identite.chapitre} · parcours ${obtenirOrdreTheme(programme.id) + 1} sur ${THEMES.length}`;
    if (icone) icone.innerHTML = creerIconeTheme(programme.id, '');
    const libelleProgression = selectionner('#libelleProgressionParcours');
    const pourcentageProgression = selectionner('#pourcentageProgressionParcours');
    const barre = selectionner('#progressionParcoursSelectionne');
    if (libelleProgression) libelleProgression.textContent = `${progression.maitrisees} / ${progression.total} étapes maîtrisées`;
    if (pourcentageProgression) pourcentageProgression.textContent = `${progression.pourcentage}%`;
    if (barre) {
        barre.setAttribute('aria-valuenow', String(progression.pourcentage));
        barre.querySelector('i')?.style.setProperty('width', `${progression.pourcentage}%`);
    }
    const boutonAction = selectionner('#boutonActionParcours');
    if (!boutonAction)
        return;
    boutonAction.disabled = false;
    if (prochaineEtape) {
        const dejaCommencee = compterQuestionsTraiteesEtape(programme.id, prochaineEtape.id) > 0;
        boutonAction.textContent = `${dejaCommencee ? 'Reprendre' : 'Commencer'} l’étape ${prochaineEtape.id} →`;
        boutonAction.onclick = () => lancerEtape(programme.id, prochaineEtape.id);
    }
    else if (!estEvaluationFinaleReussie(programme.id)) {
        boutonAction.textContent = 'Passer l’évaluation finale →';
        boutonAction.onclick = () => lancerEvaluationFinale(programme.id);
    }
    else {
        boutonAction.textContent = 'Parcours terminé ✓';
        boutonAction.disabled = true;
        boutonAction.onclick = null;
    }
}
function ouvrirParcours(identifiantTheme = sauvegarde.dernierTheme || 'commun', optionsAffichage = {}) {
    if (!PROGRAMMES[identifiantTheme]) {
        ouvrirChoixParcours(optionsAffichage);
        return;
    }
    etat.theme = identifiantTheme;
    sauvegarde.dernierTheme = identifiantTheme;
    enregistrerSauvegarde();
    const programme = PROGRAMMES[identifiantTheme];
    selectionner('#vueChoixParcours')?.classList.add('masque');
    selectionner('#vueDetailParcours')?.classList.remove('masque');
    const boutonChangerParcours = selectionner('#boutonChangerParcours');
    if (boutonChangerParcours) boutonChangerParcours.onclick = () => ouvrirChoixParcours();
    const objectif = selectionner('#texteObjectifParcours');
    if (objectif) objectif.textContent = `Complète les ${programme.etapes.length} étapes pour ouvrir l’évaluation finale. Les réussites sans aide restent distinguées dans ta progression.`;
    const titreDestinations = selectionner('#titreDestinationsParcours');
    if (titreDestinations) titreDestinations.textContent = `Les ${programme.etapes.length} étapes`;
    actualiserEnteteParcours(programme);
    actualiserResumeCarteParcours(programme);
    afficherEtapes();
    afficherEcran('parcours', optionsAffichage);
}
const ICONES_ETAPES_PARCOURS = Object.freeze({
    commun: {
        1: 'loupe', 2: 'personnes', 3: 'balance', 4: 'professionnel', 5: 'organigramme',
        6: 'reseau', 7: 'soleil', 8: 'etoiles', 9: 'maison', 10: 'dossierValide', 11: 'reseau'
    },
    procedure_ordinaire: {
        1: 'reperesDossier', 2: 'orientationParquet', 3: 'saisineJuridiction', 4: 'culpabiliteMiseEpreuve', 5: 'suiviMiseEpreuve',
        6: 'audienceSanction', 7: 'audienceUnique', 8: 'comparerProcedures', 9: 'dossiersProcedure', 10: 'voieJugement', 11: 'parcoursOrdinaireComplet'
    },
    information_judiciaire: {
        1: 'ouvertureInformation', 2: 'jugeInstructionEnquete', 3: 'mjieInformation', 4: 'mejpInformation', 5: 'controleJudiciaire',
        6: 'arseInformation', 7: 'detentionEnvisagee', 8: 'jiSaisitJldStatue', 9: 'dureesEtDeferrement', 10: 'finInformation', 11: 'dossierInstructionComplet'
    },
    jugement_educatif_ordinaire: {
        1: 'jugeChambreConseil', 2: 'mesureEducativeJudiciaire', 3: 'distinguerMejMejp', 4: 'quatreModules', 5: 'moduleInsertion',
        6: 'moduleReparation', 7: 'moduleSante', 8: 'modulePlacement', 9: 'obligationsMej', 10: 'tribunalEnfantsOrdinaire', 11: 'tribunalPoliceCompetence'
    },
    matiere_criminelle_peines: {
        1: 'qualificationCrimeAge', 2: 'tpeCrimeMoinsSeize', 3: 'courAssisesMineurs', 4: 'avertissementConfiscationStage', 5: 'tigSanctionReparation',
        6: 'amendePeinesComplementaires', 7: 'emprisonnementAttenuation', 8: 'ddseEtArse', 9: 'sursisEtSuivi', 10: 'comparerJuridictionsPeines', 11: 'juridictionReponsePossible'
    },
    application_execution_peines: {
        1: 'apresCondamnation', 2: 'jeVersJap', 3: 'suiviPeine', 4: 'jugeEtCollege', 5: 'amenagementsHebergement',
        6: 'suspensionLiberation', 7: 'conversionPermissions', 8: 'incidentsRevocation', 9: 'majoriteDessaisissement', 10: 'articulationsCompetence', 11: 'parcoursJusquaExecution'
    }
});
/* Séquence visuelle héritée du parcours 1. Le pictogramme annonce la couleur
   du thème suivant ; le titre conserve la couleur de son propre thème. */
const COULEURS_THEMES_ETAPES = Object.freeze([
    '#ffc83d', '#a986ff', '#62c5ff', '#ff9e5e', '#5fe0a0', '#ffcf66',
    '#f49ac2', '#52d6c8', '#78aef5', '#c59cff', '#ffc83d'
]);
function obtenirCouleurTitreEtape(numeroEtape) {
    return COULEURS_THEMES_ETAPES[(Number(numeroEtape) - 1) % COULEURS_THEMES_ETAPES.length];
}
function obtenirCouleurIconeEtape(numeroEtape) {
    return COULEURS_THEMES_ETAPES[Number(numeroEtape) % COULEURS_THEMES_ETAPES.length];
}
const FICHIERS_ICONES_PARCOURS_DECOUVERTE = Object.freeze({
    1: 'icone-loupe-decouverte.svg',
    2: 'icone-public-accompagne.svg',
    3: 'icone-acteurs-justice.svg',
    4: 'icone-professionnels-pjj.svg',
    5: 'icone-organisation-pjj.svg',
    6: 'icone-formes-prise-en-charge.svg',
    7: 'icone-structure-ouverte-de-jour.svg',
    8: 'icone-activites-educatives.svg',
    9: 'icone-structures-placement.svg',
    10: 'icone-mesures-judiciaires.svg',
    11: 'icone-partenaires.svg'
});
function obtenirNomIconeEtape(numeroEtape, identifiantTheme = etat.theme || 'commun') {
    return ICONES_ETAPES_PARCOURS[identifiantTheme]?.[Number(numeroEtape)]
        || ICONES_ETAPES_PARCOURS.commun[Number(numeroEtape)]
        || 'dossier';
}
function obtenirBaliseIconeEtape(numeroEtape, identifiantTheme = etat.theme || 'commun') {
    if (identifiantTheme === 'commun') {
        const nomFichier = FICHIERS_ICONES_PARCOURS_DECOUVERTE[Number(numeroEtape)];
        return nomFichier
            ? `<img src="ressources/icones-parcours/${nomFichier}" alt="" aria-hidden="true">`
            : '';
    }
    return creerPictogrammeAuTrait(obtenirNomIconeEtape(numeroEtape, identifiantTheme), 'pictogramme-etape');
}
function afficherEtapes() {
    initialiserProgression(etat.theme);
    const ligneParcours1 = selectionner('#ligneParcours1');
    const ligneParcours2 = selectionner('#ligneParcours2');
    const ligneParcours3 = selectionner('#ligneParcours3');
    const cartesEtapesFinales = selectionner('#cartesEtapesFinales');
    [ligneParcours1, ligneParcours2, ligneParcours3, cartesEtapesFinales].forEach(zone => {
        if (zone) zone.innerHTML = '';
    });
    const programme = PROGRAMMES[etat.theme];
    if (!programme)
        return;
    synchroniserEtapesReussiesEnAutonomie(programme);
    let destinationActuelleSignalee = false;
    actualiserSelecteurParcours();
    actualiserResumeCarteParcours(programme);
    function creerCarteEtape(etapeProgramme) {
        const nombreTraitees = compterQuestionsTraiteesEtape(etat.theme, etapeProgramme.id);
        const total = obtenirQuestionsEtape(etat.theme, etapeProgramme.id).length;
        const pourcentageTermine = total ? Math.round(nombreTraitees / total * 100) : 0;
        const etapeValideeEnAutonomie = obtenirBilanEtape(etat.theme, etapeProgramme.id)?.termineeSansJoker === true;
        const estDestinationActuelle = !destinationActuelleSignalee
            && (pourcentageTermine < 100 || !etapeValideeEnAutonomie);
        if (estDestinationActuelle)
            destinationActuelleSignalee = true;
        const carte = document.createElement('button');
        carte.type = 'button';
        carte.dataset.etape = String(etapeProgramme.id);
        carte.dataset.theme = etat.theme;
        if (etat.theme !== 'commun') {
            carte.style.setProperty('--couleur-etape', obtenirCouleurTitreEtape(etapeProgramme.id));
            carte.style.setProperty('--couleur-icone-etape', obtenirCouleurIconeEtape(etapeProgramme.id));
        }
        carte.className = [
            'chemin-etape-carte',
            pourcentageTermine === 100 ? 'complete' : '',
            pourcentageTermine === 100 && !etapeValideeEnAutonomie ? 'a-valider' : '',
            etapeValideeEnAutonomie ? 'validee-sans-joker' : '',
            estDestinationActuelle ? 'destination-actuelle' : ''
        ].filter(Boolean).join(' ');
        carte.setAttribute('aria-label', `Étape ${etapeProgramme.id} — ${etapeProgramme.titre} — ${nombreTraitees} questions réalisées sur ${total}${etapeValideeEnAutonomie ? ' — maîtrisée sans joker' : ''}`);
        carte.innerHTML = `
          ${etapeValideeEnAutonomie ? creerEtoileFilanteProgression() : ''}
          <span class="chemin-etape-icone" aria-hidden="true">${obtenirBaliseIconeEtape(etapeProgramme.id, etat.theme)}</span>
          <span class="chemin-etape-texte">
            <span class="chemin-etape-numero">ÉTAPE ${etapeProgramme.id}</span>
            <span class="chemin-etape-titre">${etapeProgramme.titre}</span>
          </span>
          ${estDestinationActuelle ? '<span class="chemin-position-actuelle">À travailler</span>' : ''}
          <span class="chemin-progression"><i style="width:${pourcentageTermine}%"></i></span>
          <span class="chemin-nombre">${etapeValideeEnAutonomie
            ? '<b>Maîtrisée sans aide</b>'
            : `<b>${nombreTraitees}/${total}</b> questions · environ 8 min`}</span>`;
        carte.onclick = () => lancerEtape(etat.theme, etapeProgramme.id);
        return carte;
    }
    for (const etapeProgramme of programme.etapes) {
        const carte = creerCarteEtape(etapeProgramme);
        if (etapeProgramme.id <= 3)
            ligneParcours1?.appendChild(carte);
        else if (etapeProgramme.id <= 6)
            ligneParcours2?.appendChild(carte);
        else if (etapeProgramme.id <= 9)
            ligneParcours3?.appendChild(carte);
        else
            cartesEtapesFinales?.appendChild(carte);
    }
    const evaluation = selectionner('#carteEvaluationFinale');
    if (!evaluation)
        return;
    const evaluationDeverrouillee = programme.etapes.every(etapeProgramme => {
        const total = obtenirQuestionsEtape(etat.theme, etapeProgramme.id).length;
        return total > 0 && compterQuestionsTraiteesEtape(etat.theme, etapeProgramme.id) >= total;
    });
    const evaluationReussie = estEvaluationFinaleReussie(etat.theme);
    evaluation.disabled = !evaluationDeverrouillee;
    evaluation.setAttribute('aria-disabled', String(!evaluationDeverrouillee));
    evaluation.classList.toggle('deverrouillee', evaluationDeverrouillee);
    evaluation.classList.toggle('complete', evaluationReussie);
    evaluation.querySelector(':scope > .etoile-filante-progression')?.remove();
    if (evaluationReussie)
        evaluation.insertAdjacentHTML('afterbegin', creerEtoileFilanteProgression());
    const iconeEvaluation = evaluation.querySelector('.icone-evaluation');
    if (iconeEvaluation) iconeEvaluation.innerHTML = creerPictogrammeAuTrait('trophee', 'pictogramme-evaluation');
    evaluation.querySelector('.evaluation-etape-numero').textContent = 'ÉTAPE 12';
    evaluation.querySelector('.evaluation-titre').textContent = `Évaluation du parcours ${obtenirOrdreTheme(etat.theme) + 1}`;
    evaluation.querySelector('.evaluation-statut').textContent = evaluationReussie
        ? `Réussie · meilleur score ${obtenirEvaluationFinaleTheme(etat.theme).meilleurScore}%`
        : (evaluationDeverrouillee ? '50 questions · évaluation complète' : 'Termine les 11 étapes pour l’ouvrir');
    evaluation.onclick = evaluationDeverrouillee ? () => lancerEvaluationFinale(etat.theme) : null;
    enregistrerSauvegarde();
}
