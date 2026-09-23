/**
 * PJJoue V1 — 03 - Parcours PJJ.
 * Choix d’un parcours puis affichage détaillé du parcours sélectionné.
 * Le moteur pédagogique et les données restent inchangés.
 */
const IDENTITES_PARCOURS = Object.freeze({
    procedure_ordinaire: {
        numero: '01',
        titre: 'De l’enquête à la sanction',
        chapitre: 'Procédure ordinaire',
        description: 'Suis le dossier depuis l’enquête et l’orientation du parquet jusqu’à la culpabilité, la MEE éventuelle et la sanction.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 40',
        ...obtenirCouleursAtlas('#c4a333'),
        recommande: true
    },
    information_judiciaire: {
        numero: '02',
        titre: 'Avant le jugement : l’information judiciaire',
        chapitre: 'Avant le jugement',
        description: 'Situe l’information judiciaire avant le jugement et repère le rôle du JI, du JLD et les décisions provisoires.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 45',
        ...obtenirCouleursAtlas('#55a4bb')
    },
    jugement_educatif_ordinaire: {
        numero: '03',
        titre: 'Du jugement à la sanction',
        chapitre: 'Jugement éducatif',
        description: 'Comprends le rôle du JE et du TPE et construis la réponse éducative au stade du jugement et de la sanction.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 45',
        ...obtenirCouleursAtlas('#a289c4')
    },
    matiere_criminelle_peines: {
        numero: '04',
        titre: 'De la qualification criminelle aux peines',
        chapitre: 'Matière criminelle',
        description: 'Pars de la qualification et de l’âge aux faits pour identifier la juridiction, puis la sanction ou la peine possible.',
        niveau: 'Avancé',
        duree: '≈ 1 h 50',
        ...obtenirCouleursAtlas('#d57d96')
    },
    application_execution_peines: {
        numero: '05',
        titre: 'Après la sanction : application et exécution',
        chapitre: 'Application des peines',
        description: 'Après la sanction, suis l’exécution, les aménagements, les incidents et l’articulation entre JE et JAP.',
        niveau: 'Avancé',
        duree: '≈ 1 h 40',
        ...obtenirCouleursAtlas('#55a396')
    },
    commun: {
        numero: '06',
        libelleNumero: 'Option : Parcours 06',
        titre: 'Découvrir la PJJ',
        chapitre: '',
        description: 'Missions, publics, professionnels, structures et logique éducative de la PJJ.',
        niveau: 'Débutant',
        duree: '≈ 1 h 20',
        ...obtenirCouleursAtlas('#789bd4'),
        optionnel: true
    }
});
function obtenirIdentiteParcours(identifiantTheme) {
    return IDENTITES_PARCOURS[identifiantTheme] || IDENTITES_PARCOURS[IDENTIFIANT_PARCOURS_RECOMMANDE];
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
function creerEtoileFilanteEvaluation() {
    return `<span class="etoile-filante-progression etoile-filante-evaluation" aria-hidden="true">
        <svg viewBox="0 0 112 58" focusable="false">
            <path class="etoile-filante-trainee etoile-filante-trainee-haute" d="M4 34 C22 32 37 24 50 12"></path>
            <path class="etoile-filante-trainee etoile-filante-trainee-basse" d="M10 48 C29 44 42 35 55 24"></path>
            <path class="etoile-filante-astre etoile-filante-astre-principale" d="M70 5 L74.5 14.6 L85 15.8 L77.2 23.1 L79.4 33.4 L70 28 L60.6 33.4 L62.8 23.1 L55 15.8 L65.5 14.6 Z"></path>
            <path class="etoile-filante-astre etoile-filante-astre-satellite" d="M94 7 L96 11.2 L100.6 11.8 L97.2 14.9 L98.1 19.4 L94 17.1 L89.9 19.4 L90.8 14.9 L87.4 11.8 L92 11.2 Z"></path>
            <path class="etoile-filante-astre etoile-filante-astre-satellite" d="M103 27 L104.5 30.2 L108 30.7 L105.4 33.1 L106.1 36.5 L103 34.7 L99.9 36.5 L100.6 33.1 L98 30.7 L101.5 30.2 Z"></path>
            <path class="etoile-filante-astre etoile-filante-astre-satellite" d="M89 39 L90.6 42.4 L94.3 42.9 L91.5 45.4 L92.3 49 L89 47.1 L85.7 49 L86.5 45.4 L83.7 42.9 L87.4 42.4 Z"></path>
            <path class="etoile-filante-astre etoile-filante-astre-satellite" d="M55 2 L56.4 5 L59.7 5.4 L57.3 7.7 L57.9 10.9 L55 9.2 L52.1 10.9 L52.7 7.7 L50.3 5.4 L53.6 5 Z"></path>
            <path class="etoile-filante-astre etoile-filante-astre-satellite" d="M47 29 L48.2 31.6 L51 32 L49 33.9 L49.5 36.7 L47 35.2 L44.5 36.7 L45 33.9 L43 32 L45.8 31.6 Z"></path>
        </svg>
    </span>`;
}
function obtenirProgressionEvaluationFinaleAffichee(identifiantTheme) {
    const questionsEvaluation = QUESTIONS.filter(question =>
        question.theme === identifiantTheme && question.estEvaluationFinale === true
    );
    const total = questionsEvaluation.length || 50;
    const identifiants = new Set(questionsEvaluation.map(question => Number(question.id)));
    const compter = (reponses, passees) => {
        const traitees = new Set();
        const entrees = reponses instanceof Map ? [...reponses.keys()]
            : Array.isArray(reponses) ? reponses.map(entree => Array.isArray(entree) ? entree[0] : entree) : [];
        entrees.forEach(id => { if (identifiants.has(Number(id))) traitees.add(Number(id)); });
        const passages = passees instanceof Set ? [...passees] : Array.isArray(passees) ? passees : [];
        passages.forEach(id => { if (identifiants.has(Number(id))) traitees.add(Number(id)); });
        return Math.min(total, traitees.size);
    };
    if (etat.mode === 'evaluation-finale' && etat.theme === identifiantTheme && etat.questionsSession?.length) {
        return { traitees: compter(etat.reponsesSession, etat.questionsPassees), total };
    }
    const instantane = typeof chargerSessionEnCours === 'function' ? chargerSessionEnCours() : null;
    if (instantane?.mode === 'evaluation-finale' && instantane.theme === identifiantTheme) {
        return { traitees: compter(instantane.reponsesSession, instantane.questionsPassees), total };
    }
    const evaluation = obtenirEvaluationFinaleTheme(identifiantTheme);
    return { traitees: (evaluation?.reussie === true || (evaluation?.nombreTentatives || 0) > 0) ? total : 0, total };
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
        pourcentage: totalJalons ? Math.round(jalonsMaitrises / totalJalons * 100) : 0,
        evaluationReussie,
        jalonsMaitrises,
        totalJalons
    };
}
function actualiserSelecteurParcours() {
    const zones = selectionnerTous('#selecteurParcours, #catalogueAtlas');
    zones.forEach(zone => {
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
        bouton.className = `selecteur-parcours-bouton${theme.id === IDENTIFIANT_PARCOURS_RECOMMANDE ? ' parcours-recommande' : ''}${estDernierParcours ? ' parcours-cloture' : ''}`;
        bouton.dataset.theme = theme.id;
        bouton.style.setProperty('--parcours-accent', identite.couleur);
        bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
        bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        bouton.setAttribute('aria-label', `${identite.titre}. ${progression.maitrisees} étapes maîtrisées sans joker sur ${progression.total}.${progression.evaluationReussie ? ' Évaluation finale réussie.' : ''}`);
        bouton.classList.add('q-chapter');
        const compact = zone.dataset.catalog === 'compact';
        bouton.innerHTML = `
            <span class="q-chapter-top"><span>${identite.numero}</span><span>${identite.optionnel ? 'OPTION PJJ' : identite.recommande ? 'POINT DE DÉPART' : 'PARCOURS CJPM'}</span></span>
            <h3 class="selecteur-parcours-titre">${identite.titre}</h3>
            ${compact ? '' : `<p>${identite.description}</p>`}
            <span class="q-chapter-bottom"><span>${progression.jalonsMaitrises > 0 ? `${progression.maitrisees} / ${progression.total} étapes maîtrisées` : identite.chapitre || 'Le parcours optionnel'}</span><span class="atlas-chapter-reperes">${progression.jalonsMaitrises > 0 ? creerEtoileFilanteProgression(progression.jalonsMaitrises) : ''}<span aria-hidden="true">↗</span></span></span>
            <span class="lecteur-ecran-seulement">${statut}. ${identite.niveau}. ${identite.duree}.</span>`;
        bouton.onclick = () => {
            envoyerEvenementPJJ('parcours_selectionne', {
                pjjoue_parcours: PROGRAMMES[theme.id]?.titre,
                pjjoue_parcours_selectionne: PROGRAMMES[theme.id]?.titre,
                pjjoue_numero_parcours: Number(identite.numero)
            });
            ouvrirParcours(theme.id);
        };
        zone.appendChild(bouton);
    });
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
    if (surtitre) surtitre.textContent = `${identite.optionnel ? 'Option · ' : ''}${identite.chapitre || identite.titre} · parcours ${obtenirOrdreTheme(programme.id) + 1} sur ${THEMES.length}`;
    if (icone) icone.innerHTML = creerIconeTheme(programme.id, '');
    const libelleProgression = selectionner('#libelleProgressionParcours');
    const pourcentageProgression = selectionner('#pourcentageProgressionParcours');
    const barre = selectionner('#progressionParcoursSelectionne');
    if (libelleProgression) libelleProgression.textContent = `${progression.jalonsMaitrises} / ${progression.totalJalons} objectifs · étapes et évaluation`;
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
        boutonAction.onclick = () => {
            envoyerEvenementPJJ('etape_selectionnee', {
                pjjoue_parcours: programme.titre,
                pjjoue_parcours_selectionne: programme.titre,
                pjjoue_numero_etape: prochaineEtape.id,
                pjjoue_nom_etape: prochaineEtape.titre
            });
            lancerEtape(programme.id, prochaineEtape.id);
        };
    }
    else if (!estEvaluationFinaleReussie(programme.id)) {
        boutonAction.textContent = 'Passer l’évaluation finale →';
        boutonAction.onclick = () => {
            envoyerEvenementPJJ('etape_selectionnee', {
                pjjoue_parcours: programme.titre,
                pjjoue_parcours_selectionne: programme.titre,
                pjjoue_numero_etape: 12,
                pjjoue_nom_etape: 'Évaluation finale'
            });
            lancerEvaluationFinale(programme.id);
        };
    }
    else {
        boutonAction.textContent = 'Parcours terminé ✓';
        boutonAction.disabled = true;
        boutonAction.onclick = null;
    }
}
function ouvrirParcours(identifiantTheme = sauvegarde.dernierTheme || IDENTIFIANT_PARCOURS_RECOMMANDE, optionsAffichage = {}) {
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
    return obtenirAccentAtlas(COULEURS_THEMES_ETAPES[(Number(numeroEtape) - 1) % COULEURS_THEMES_ETAPES.length]);
}
function obtenirCouleurIconeEtape(numeroEtape) {
    return obtenirAccentAtlas(COULEURS_THEMES_ETAPES[Number(numeroEtape) % COULEURS_THEMES_ETAPES.length]);
}
function obtenirCouleurEtapeAtlas(identifiantTheme, numeroEtape) {
    const programme = PROGRAMMES[identifiantTheme];
    const numero = Number(numeroEtape);
    if (programme && numero > programme.etapes.length) return obtenirIdentiteParcours(identifiantTheme).couleur;
    return identifiantTheme === 'commun'
        ? obtenirCouleursEtapePJJ(numero).couleur
        : obtenirCouleurTitreEtape(numero);
}
function obtenirCouleursEtapePJJ(numeroEtape) {
    const couleur = PROGRAMMES.commun.etapes.find(etape => etape.id === Number(numeroEtape)).couleur;
    return obtenirCouleursAtlas(couleur);
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
function obtenirNomIconeEtape(numeroEtape, identifiantTheme = etat.theme || IDENTIFIANT_PARCOURS_RECOMMANDE) {
    return ICONES_ETAPES_PARCOURS[identifiantTheme]?.[Number(numeroEtape)]
        || ICONES_ETAPES_PARCOURS.commun[Number(numeroEtape)]
        || 'dossier';
}
function obtenirBaliseIconeEtape(numeroEtape, identifiantTheme = etat.theme || IDENTIFIANT_PARCOURS_RECOMMANDE) {
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
        const carte = document.createElement('article');
        carte.setAttribute('role', 'button');
        carte.setAttribute('tabindex', '0');
        carte.dataset.etape = String(etapeProgramme.id);
        carte.dataset.theme = etat.theme;
        if (etat.theme === 'commun') {
            carte.style.setProperty('--couleur-etape', obtenirCouleurEtapeAtlas(etat.theme, etapeProgramme.id));
        } else {
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
          <span class="atlas-etape-repere"><span class="chemin-etape-numero">${String(etapeProgramme.id).padStart(2, '0')}</span>${etapeValideeEnAutonomie ? creerEtoileFilanteProgression() : ''}</span>
          <span class="chemin-etape-texte"><strong class="chemin-etape-titre">${etapeProgramme.titre}</strong><span class="chemin-nombre">${nombreTraitees}/${total} questions travaillées</span></span>
          <span class="chemin-statut">${etapeValideeEnAutonomie ? 'Maîtrisée sans aide' : estDestinationActuelle ? 'À travailler →' : pourcentageTermine === 100 ? 'À consolider' : 'À découvrir'}</span>
          <span class="chemin-progression" aria-label="${pourcentageTermine}%"><i style="width:${pourcentageTermine}%"></i></span>`;
        carte.addEventListener('click', evenement => {
            if (evenement.target.closest('button'))
                return;
            envoyerEvenementPJJ('etape_selectionnee', {
                pjjoue_parcours: programme.titre,
                pjjoue_parcours_selectionne: programme.titre,
                pjjoue_numero_etape: etapeProgramme.id,
                pjjoue_nom_etape: etapeProgramme.titre
            });
            lancerEtape(etat.theme, etapeProgramme.id);
        });
        carte.addEventListener('keydown', evenement => {
            if ((evenement.key === 'Enter' || evenement.key === ' ') && !evenement.target.closest('button')) {
                evenement.preventDefault();
                envoyerEvenementPJJ('etape_selectionnee', {
                    pjjoue_parcours: programme.titre,
                    pjjoue_parcours_selectionne: programme.titre,
                    pjjoue_numero_etape: etapeProgramme.id,
                    pjjoue_nom_etape: etapeProgramme.titre
                });
                lancerEtape(etat.theme, etapeProgramme.id);
            }
        });
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
    evaluation.style.setProperty('--couleur-etape', obtenirIdentiteParcours(etat.theme).couleur);
    const sceauEvaluation = evaluation.querySelector('.evaluation-sceau');
    if (sceauEvaluation) {
        sceauEvaluation.innerHTML = evaluationReussie ? creerEtoileFilanteEvaluation() : '';
    }
    const iconeEvaluation = evaluation.querySelector('.icone-evaluation');
    if (iconeEvaluation) iconeEvaluation.innerHTML = creerPictogrammeAuTrait('trophee', 'pictogramme-evaluation');
    evaluation.querySelector('.evaluation-etape-numero').textContent = '12';
    evaluation.querySelector('.evaluation-titre').textContent = 'Évaluation finale';
    const progressionEvaluation = obtenirProgressionEvaluationFinaleAffichee(etat.theme);
    const progressionEvaluationElement = evaluation.querySelector('.evaluation-progression');
    if (progressionEvaluationElement)
        progressionEvaluationElement.textContent = `${progressionEvaluation.traitees}/${progressionEvaluation.total} questions d’évaluation`;
    const evaluationEnregistree = obtenirEvaluationFinaleTheme(etat.theme);
    evaluation.querySelector('.evaluation-statut').textContent = evaluationReussie
        ? `Réussie · meilleur score ${evaluationEnregistree.meilleurScore}%`
        : (evaluationEnregistree.nombreTentatives > 0
            ? `Meilleur score ${evaluationEnregistree.meilleurScore}%`
            : (evaluationDeverrouillee ? 'Prête à commencer' : 'Termine les 11 étapes pour l’ouvrir'));
    evaluation.onclick = evaluationDeverrouillee ? () => {
        envoyerEvenementPJJ('etape_selectionnee', {
            pjjoue_parcours: programme.titre,
            pjjoue_parcours_selectionne: programme.titre,
            pjjoue_numero_etape: 12,
            pjjoue_nom_etape: 'Évaluation finale'
        });
        lancerEvaluationFinale(etat.theme);
    } : null;
    enregistrerSauvegarde();
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
