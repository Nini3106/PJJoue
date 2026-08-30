/**
 * Démarrage, outils de base et noms Analytics.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
'use strict';

/**
 * Moteur principal de PJJoue V1.
 *
 * Organisation du fichier :
 * 1. utilitaires et sauvegarde locale ;
 * 2. navigation et fenêtres ;
 * 3. progression et préparation des sessions ;
 * 4. affichage et validation des activités ;
 * 5. jokers, bilans et révision ;
 * 6. paramètres, sons et branchement des commandes.
 *
 * Les noms appartenant à PJJoue sont rédigés en français. Les termes imposés
 * par les API du navigateur (history, localStorage, AudioContext, etc.) restent
 * naturellement ceux de la plateforme web.
 */
if ('scrollRestoration' in history)
    history.scrollRestoration = 'manual';
const { THEMES, PROGRAMMES, SOURCES, QUESTIONS, SIGLES = [] } = window.DONNEES_PJJ;
const TRACES_PICTOGRAMMES = Object.freeze({
    decouvertePjj: '<path d="M4 5.5h6.2c1.1 0 1.8.3 1.8 1.3v12.7c0-1-.7-1.5-1.8-1.5H4z"/><path d="M20 5.5h-6.2c-1.1 0-1.8.3-1.8 1.3v12.7c0-1 .7-1.5 1.8-1.5H20z"/><path d="M7 9h2.5M14.5 9H17M7 12h2.5M14.5 12H17"/>',
    procedureOrdinaire: '<path d="M5 3.5h9l4 4V20.5H5z"/><path d="M14 3.5v4h4M8 11h5M8 15h3"/><circle cx="16.5" cy="15.5" r="3.5"/><path d="m15 15.5 1 1 2-2"/>',
    informationJudiciaire: '<path d="M4 4h10l3 3v4.5M4 4v16h7"/><path d="M14 4v3h3M7 9h6M7 13h3"/><circle cx="16" cy="16" r="3.5"/><path d="m18.5 18.5 2 2"/>',
    jugementEducatif: '<circle cx="7.5" cy="7" r="2.5"/><path d="M3.5 17.5v-1c0-3 1.5-5 4-5 1.8 0 3.1 1 3.7 2.5"/><path d="M16 5v14M12 8h8M13.5 8 11 12h5zM18.5 8 16 12h5zM12.5 19h7"/>',
    crimesSanctionsPeines: '<path d="m7 5 4 4-2 2-4-4zM5.5 8.5 2.5 12M10 3.5l3-3"/><path d="M12 19.5h9M14 16.5h5"/><path d="M16.5 5.5v5M16.5 13.5h.01"/><path d="M13 3.5h7l2 3.5-2 7h-7l-2-7z"/>',
    executionDesPeines: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7 3v4M17 3v4M3.5 9h17M8 13h3M8 16h2"/><path d="m14 15 1.5 1.5 3-3"/>',
    reperesDossier: '<path d="M4 4h9l3 3v13H4zM13 4v3h3M7 11h6M7 15h4"/><path d="m18 12 2-2 2 2M20 10v8"/>',
    orientationParquet: '<path d="M3 5h7c3 0 3 5 6 5h5M3 19h7c3 0 3-5 6-5h5"/><path d="m18 7 3 3-3 3M18 11l3 3-3 3"/>',
    saisineJuridiction: '<path d="M3 9h15M5 9v9M9 9v9M14 9v9M18 9v9M2 18h18M10.5 3l8 4h-16z"/><path d="m19 14 3 2-3 2"/>',
    culpabiliteMiseEpreuve: '<path d="m5 4 5 5-2 2-5-5zM4 11l-2 2M10 3l2-2M3 20h9"/><path d="M17 20v-7M17 16c-3 0-4-2-4-4 3 0 4 2 4 4ZM17 15c3 0 4-2 4-4-3 0-4 2-4 4Z"/>',
    suiviMiseEpreuve: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 9h18M7 13h3M7 17h3"/><path d="m14 16 2 2 4-5"/>',
    audienceSanction: '<path d="M3 20h18M6 17h12M8 4h8v5c0 3-2 5-4 5s-4-2-4-5z"/><path d="M8 6H5v2c0 2 1 3 3 3M16 6h3v2c0 2-1 3-3 3"/>',
    audienceUnique: '<path d="M3 9h18M5 9v9M10 9v9M15 9v9M20 9v9M2 18h20M12 3l9 4H3z"/><circle cx="18" cy="5" r="3"/><path d="M18 3.5v3M16.5 5h3"/>',
    comparerProcedures: '<path d="M4 4v4c0 3 2 4 5 4h11M4 20v-4c0-3 2-4 5-4"/><path d="m17 9 3 3-3 3M11 7l2-2 2 2M11 17l2 2 2-2"/>',
    dossiersProcedure: '<path d="M3 7h7l2 2h9v11H3z"/><path d="m7 15 2 2 4-4M15 13h3M15 16h3"/>',
    voieJugement: '<path d="M12 21V9M12 12 5 7M12 15l7-5"/><path d="m3 5 2 2-2 2M17 8l2 2-2 2"/><circle cx="12" cy="4" r="2"/>',
    parcoursOrdinaireComplet: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="5" r="2"/><path d="M7 18h3c3 0 4-2 4-5V9c0-2 1-4 3-4"/><path d="m16 17 2 2 4-5"/>',
    ouvertureInformation: '<path d="M3 5h10l3 3v12H3zM13 5v3h3M6 11h5M6 15h3"/><circle cx="17" cy="16" r="3"/><path d="m19 18 2 2"/>',
    jugeInstructionEnquete: '<circle cx="9" cy="9" r="5"/><path d="m13 13 5 5M6 9h6"/><path d="M18 4v7M15 7h6"/>',
    mjieInformation: '<circle cx="7" cy="7" r="2.5"/><path d="M3 16c0-3 1.5-5 4-5s4 2 4 5"/><path d="M14 4h7v15h-7zM16.5 8h2M16.5 12h2M16.5 16h2"/>',
    mejpInformation: '<path d="M12 3 4 7v5c0 5 3 8 8 9 4.6-1 8-4 8-9V7z"/><path d="M8 11h8M8 15h5"/>',
    controleJudiciaire: '<path d="M12 3v18M5 7h14M7 7l-4 7h8zM17 7l-4 7h8zM7 21h10"/><circle cx="19" cy="18" r="2"/>',
    arseInformation: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3h6v4M9 17v4h6v-4M3 12h4M17 12h4M10 12h4"/>',
    detentionEnvisagee: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M15 3v18M5 9h14M5 15h14"/><path d="M21 7v5M21 15h.01"/>',
    jiSaisitJldStatue: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h5c3 0 5 2 5 5v5M15 13l3 3 3-3"/><path d="M4 18h8"/>',
    dureesEtDeferrement: '<circle cx="8" cy="12" r="5"/><path d="M8 9v3l2 1.5M15 5h6v14h-6M17 9h2M17 13h2"/>',
    finInformation: '<path d="M4 4h11l3 3v13H4zM15 4v3h3M7 11h8M7 15h5"/><path d="m15 17 2 2 4-5"/>',
    dossierInstructionComplet: '<path d="M3 7h7l2 2h9v11H3zM3 7V5h7l2 2"/><circle cx="15" cy="14" r="3"/><path d="m17 16 3 3"/>',
    jugeChambreConseil: '<path d="M3 10h18M5 10v9M10 10v9M15 10v9M20 10v9M2 19h20M12 4l9 4H3z"/><path d="M9 14h6"/>',
    mesureEducativeJudiciaire: '<path d="M12 21s-8-5-8-12a4 4 0 0 1 7-2.5A4 4 0 0 1 20 9c0 7-8 12-8 12z"/><path d="M9 12h6M12 9v6"/>',
    distinguerMejMejp: '<path d="M4 5h6v14H4zM14 5h6v14h-6z"/><path d="M6 9h2M6 13h2M16 9h2M16 13h2M10 12h4"/>',
    quatreModules: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="m5 6 1 1 2-2M16 6h3M5 17h3M17.5 16v3"/>',
    moduleInsertion: '<path d="M4 20V8h16v12M8 8V5h8v3"/><path d="M8 13h8M12 10v6M15 17l2 2 4-5"/>',
    moduleReparation: '<path d="m4 15 5-5 5 5-5 5zM12 7l2-2 5 5-2 2M13 12l4 4"/><path d="M3 5h5"/>',
    moduleSante: '<path d="M12 20S4 15 4 9a4 4 0 0 1 7-2.5A4 4 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M9 12h6M12 9v6"/><circle cx="20" cy="5" r="2"/>',
    modulePlacement: '<path d="M3 11 12 4l9 7v9H3zM9 20v-6h6v6"/><path d="M17 7v4h4"/>',
    obligationsMej: '<path d="M7 6h13M7 12h13M7 18h13"/><path d="m2.5 6 1 1 2-2M2.5 12l1 1 2-2M2.5 18l1 1 2-2"/><path d="M18 15v6"/>',
    tribunalEnfantsOrdinaire: '<path d="M3 9h18M5 9v9M9 9v9M15 9v9M19 9v9M2 18h20M12 3l9 4H3z"/><circle cx="12" cy="13" r="2"/>',
    tribunalPoliceCompetence: '<path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h4"/><path d="m16 15 2 2 4-5"/>',
    qualificationCrimeAge: '<path d="M12 3 2.5 20h19zM12 9v4M12 17h.01"/><circle cx="19" cy="6" r="3"/><path d="M19 4.5v3"/>',
    tpeCrimeMoinsSeize: '<path d="M3 9h18M5 9v9M10 9v9M15 9v9M20 9v9M2 18h20M12 3l9 4H3z"/><path d="M6 5h4M8 3v4"/>',
    courAssisesMineurs: '<path d="M2 9h20M4 9v10M9 9v10M15 9v10M20 9v10M2 19h20M12 2l10 5H2z"/><path d="M10 13h4"/>',
    avertissementConfiscationStage: '<path d="M12 3 3 20h18zM12 9v4M12 17h.01"/><path d="M16 4h5v5M18.5 4v5"/>',
    tigSanctionReparation: '<path d="M4 20V8h16v12M8 8V5h8v3M8 13h8"/><path d="m14 17 2 2 5-6"/>',
    amendePeinesComplementaires: '<circle cx="9" cy="12" r="6"/><path d="M12 9c-.8-.8-1.6-1-2.7-1A4 4 0 0 0 9.3 16c1.1 0 2-.3 2.7-1M4 10h7M4 14h7"/><path d="M17 6h4M19 4v4M17 14h4M17 18h4"/>',
    emprisonnementAttenuation: '<rect x="4" y="3" width="12" height="18" rx="2"/><path d="M8 3v18M12 3v18M4 9h12M4 15h12"/><path d="m18 15 2 2 2-4"/>',
    ddseEtArse: '<rect x="4" y="7" width="9" height="10" rx="2"/><path d="M6 3h5v4M6 17v4h5v-4M13 12h3"/><circle cx="19" cy="12" r="3"/>',
    sursisEtSuivi: '<circle cx="8" cy="12" r="5"/><path d="M8 9v3l2 2M15 5h6v14h-6M17 9h2M17 13h2"/><path d="m17 17 1 1 2-2"/>',
    comparerJuridictionsPeines: '<path d="M3 9h8M5 9v8M9 9v8M2 17h10M7 4l5 3H2z"/><path d="M15 5h6M15 10h6M15 15h6M15 20h6"/>',
    juridictionReponsePossible: '<path d="M3 7h7l2 2h9v11H3z"/><path d="M7 14h5M7 17h3M15 13l2 2 4-5"/>',
    apresCondamnation: '<path d="m4 5 5 5-2 2-5-5zM3 13l-2 2M9 4l2-2"/><path d="M13 19h9M15 16h5"/><path d="m16 9 2 2 4-5"/>',
    jeVersJap: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4c4 0 6 2 6 6v4M15 13l3 3 3-3"/><path d="M3 18h8"/>',
    suiviPeine: '<path d="M4 4h16v16H4zM8 8h8M8 12h5M8 16h4"/><path d="m15 16 2 2 4-5"/>',
    jugeEtCollege: '<circle cx="7" cy="7" r="2.5"/><path d="M3 16c0-3 1.5-5 4-5s4 2 4 5"/><circle cx="16" cy="8" r="2"/><circle cx="21" cy="9" r="1.5"/><path d="M13 17c0-3 1-5 3-5s3 2 3 5M18 17c0-2 1-3.5 3-3.5"/>',
    amenagementsHebergement: '<path d="M3 11 10 5l7 6v9H3zM7 20v-5h6v5"/><path d="M17 8h4v12h-4M17 12h4M17 16h4"/>',
    suspensionLiberation: '<circle cx="8" cy="12" r="6"/><path d="M6 9v6M10 9v6"/><path d="M15 7h6v10h-6M18 4v6M15 7l3-3 3 3"/>',
    conversionPermissions: '<path d="M4 7h12l-3-3M20 17H8l3 3M16 4l3 3-3 3M8 14l-3 3 3 3"/><path d="M12 11h5v5"/>',
    incidentsRevocation: '<path d="M12 3 2.5 20h19zM12 9v4M12 17h.01"/><path d="M18 4v5h-5M18 9a6 6 0 0 0-8-3"/>',
    majoriteDessaisissement: '<circle cx="7" cy="7" r="2.5"/><path d="M3 17c0-4 1.5-6 4-6s4 2 4 6"/><path d="M13 12h8M18 8l4 4-4 4"/><path d="M15 20h6"/>',
    articulationsCompetence: '<circle cx="12" cy="4" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="12" cy="13" r="2"/><path d="M12 6v5M10 14l-4 3M14 14l4 3M7 19h10"/>',
    parcoursJusquaExecution: '<circle cx="4" cy="18" r="2"/><circle cx="20" cy="5" r="2"/><path d="M6 18h3c4 0 4-5 8-5h3M17 10l3 3-3 3"/><path d="M8 5h6M11 2v6"/>',
    boussole: '<circle cx="12" cy="12" r="8.5"/><path d="m15.4 8.6-2.1 4.7-4.7 2.1 2.1-4.7z"/>',
    itineraire: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h2.5a3.5 3.5 0 0 0 3.5-3.5v-5A3.5 3.5 0 0 1 17.5 6H18"/>',
    dossierRecherche: '<path d="M3.5 7.5h6l2 2H20v5.2"/><path d="M3.5 7.5v11h9"/><circle cx="16.5" cy="16.5" r="3.2"/><path d="m18.9 18.9 2 2"/>',
    decisionEducative: '<circle cx="8.5" cy="7.5" r="3"/><path d="M3.5 20v-1.8c0-3 2-5 5-5 2 0 3.4.8 4.3 2"/><path d="m14.5 17 2 2 4-5"/>',
    justicePenale: '<path d="m13.8 4.2 6 6-2.8 2.8-6-6z"/><path d="m11.8 7.2-7.6 7.6"/><path d="m3 16 5 5"/><path d="M12.5 20.5H21"/>',
    execution: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/><path d="m8.5 16 1.8 1.8 4.2-4.2"/>',
    bouclier: '<path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    balance: '<path d="M12 3v18M5 7h14M7 7l-4 7h8zM17 7l-4 7h8zM7 21h10"/>',
    loupe: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m14.5 14.5 5 5M8 10.5h5"/>',
    tribunal: '<path d="M3 9h18M5 9v9M9 9v9M15 9v9M19 9v9M2 18h20M12 3l9 4H3z"/>',
    marteau: '<path d="m14 4 6 6-3 3-6-6zM10 8l-6 6M3 15l6 6M13 20h8"/>',
    horloge: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    dossier: '<path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2"/>',
    dossierValide: '<path d="M3 7h7l2 2h9v10H3z"/><path d="m8 14 2 2 5-5"/>',
    dossierLoupe: '<path d="M3 7h7l2 2h7v5"/><circle cx="16" cy="16" r="3.5"/><path d="m18.5 18.5 2 2"/>',
    personnes: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 2-6 5-6s5 2 5 6M13 20c.2-3 1.6-4.5 4-4.5 2.5 0 4 1.7 4 4.5"/>',
    professionnel: '<circle cx="9" cy="7" r="3"/><path d="M4 20v-2c0-3 2-5 5-5s5 2 5 5v2"/><path d="M16 7h5M18.5 4.5v5"/>',
    organigramme: '<path d="M12 3v4M5 10h14M5 10v4M12 10v4M19 10v4"/><rect x="2" y="14" width="6" height="6" rx="1.5"/><rect x="9" y="14" width="6" height="6" rx="1.5"/><rect x="16" y="14" width="6" height="6" rx="1.5"/>',
    maison: '<path d="M3 11 12 4l9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
    etoiles: '<path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
    reseau: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m11 7-5 9M13 7l5 9M7 18h10"/>',
    fleches: '<path d="M4 7h12l-3-3M20 17H8l3 3"/><path d="m16 4 3 3-3 3M8 14l-3 3 3 3"/>',
    bifurcation: '<path d="M5 4v4c0 3 2 4 5 4h8M5 20v-4c0-3 2-4 5-4"/><path d="m15 9 3 3-3 3"/>',
    validation: '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    alerte: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v4M12 17h.01"/>',
    cadenas: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/>',
    bracelet: '<path d="M7 7h10v10H7z"/><path d="M9 3h6v4M9 17v4h6v-4M3 12h4M17 12h4"/>',
    liste: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
    modules: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    insertion: '<path d="M4 20V8h16v12M8 8V5h8v3"/><path d="M8 13h8M12 10v6"/>',
    reparation: '<path d="m4 15 5-5 5 5-5 5zM12 7l2-2 5 5-2 2"/><path d="m13 12 4 4"/>',
    sante: '<path d="M12 20S4 15 4 9a4 4 0 0 1 7-2.5A4 4 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M9 12h6M12 9v6"/>',
    euro: '<circle cx="12" cy="12" r="8"/><path d="M16 8.5c-1-1-2.1-1.5-3.5-1.5-2.8 0-5 2.2-5 5s2.2 5 5 5c1.4 0 2.5-.5 3.5-1.5M6 10h7M6 14h7"/>',
    barreaux: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3v18M15 3v18M4 9h16M4 15h16"/>',
    pause: '<circle cx="12" cy="12" r="8"/><path d="M10 9v6M14 9v6"/>',
    actualiser: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.5 10A7 7 0 0 0 6 7M5.5 14A7 7 0 0 0 18 17"/>',
    utilisateurFleche: '<circle cx="9" cy="8" r="3"/><path d="M4 20v-2c0-3 2-5 5-5 2 0 3.5.8 4.4 2"/><path d="M14 17h7M18 14l3 3-3 3"/>',
    drapeau: '<path d="M5 21V4M5 5h11l-2 3 2 3H5"/>',
    cible: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 6-6M16 6h2v2"/>',
    trophee: '<path d="M8 4h8v5c0 3-1.8 5-4 5S8 12 8 9z"/><path d="M8 6H4v2c0 2 1.5 3 4 3M16 6h4v2c0 2-1.5 3-4 3M12 14v4M8 21h8M9 18h6"/>'
});
const ICONES_THEMES = Object.freeze({
    commun: 'decouvertePjj',
    procedure_ordinaire: 'procedureOrdinaire',
    information_judiciaire: 'informationJudiciaire',
    jugement_educatif_ordinaire: 'jugementEducatif',
    matiere_criminelle_peines: 'crimesSanctionsPeines',
    application_execution_peines: 'executionDesPeines'
});
function creerPictogrammeAuTrait(nomIcone, classeCss = 'pictogramme-au-trait', libelle = '') {
    const trace = TRACES_PICTOGRAMMES[nomIcone] || TRACES_PICTOGRAMMES.bouclier;
    const role = libelle ? ' role="img"' : '';
    const aria = libelle ? ` aria-label="${libelle}"` : ' aria-hidden="true"';
    return `<span class="${classeCss}"${role}${aria}><svg viewBox="0 0 24 24" focusable="false">${trace}</svg></span>`;
}
function creerIconeTheme(identifiant, libelle = '') {
    return creerPictogrammeAuTrait(ICONES_THEMES[identifiant] || 'bouclier', `theme-icone theme-icone-${identifiant}`, libelle);
}
const selectionner = selecteur => document.querySelector(selecteur);
const selectionnerTous = selecteur => [...document.querySelectorAll(selecteur)];
function envoyerEvenementPJJ(nom, parametres = {}) {
    return window.PJJ_ANALYTICS?.envoyer?.(nom, parametres) === true;
}
const LIBELLES_PAGES_ANALYTICS = Object.freeze({
    accueil: 'Accueil',
    parcours: 'Parcours PJJ',
    carnet: 'Carnet de parcours',
    entrainement: 'Entraînement libre',
    erreurs: 'Mes erreurs à retravailler',
    sigles: 'Mission Sigles',
    'sigles-revision': 'Réviser mes erreurs · Mission Sigles',
    supports: 'Supports de révision',
    progression: 'Progression',
    parametres: 'Paramètres',
    question: 'Question',
    bilan: 'Bilan de la session',
    consentement: 'Consentement Analytics',
    aucun: 'Aucune page précédente'
});
const LIBELLES_JOKERS_ANALYTICS = Object.freeze({
    '50_50': '50/50',
    indice: 'Indice',
    langue_au_chat: 'Langue au chat'
});
function obtenirLibellePageAnalytics(identifiant) {
    return LIBELLES_PAGES_ANALYTICS[identifiant] || String(identifiant || 'Page inconnue');
}
function obtenirLibelleTailleTexteAnalytics(echelle) {
    const valeur = Number(echelle);
    if (valeur <= 0.91)
        return 'Compacte';
    if (valeur >= 1.07)
        return 'Grande';
    return 'Normale';
}
function obtenirLibelleModeJeuAnalytics() {
    if (etat?.origineSessionAnalytics === 'defi_du_hasard')
        return 'Défi du hasard';
    if (etat?.mode === 'parcours')
        return 'Parcours PJJ';
    if (etat?.mode === 'libre')
        return 'Entraînement libre';
    if (etat?.mode === 'revision')
        return 'Révision des erreurs';
    if (etat?.mode === 'evaluation-finale')
        return 'Évaluation finale';
    return null;
}
function obtenirInformationsEtapeAnalytics(question = null) {
    const numeroVisible = Number(question?.etape ?? etat?.etape);
    if (!Number.isFinite(numeroVisible) || numeroVisible <= 0)
        return { numero: null, nom: null };
    if (numeroVisible === 12)
        return { numero: 12, nom: 'Évaluation finale' };
    const identifiantTheme = question?.theme || etat?.theme || 'commun';
    const etapeProgramme = obtenirEtapeProgramme(identifiantTheme, numeroVisible)
        || obtenirEtapeProgramme('commun', numeroVisible);
    // L'ordre visible peut évoluer sans recycler l'identité Analytics permanente.
    // L'identifiant permanent reste stable même si l'ordre d'affichage d'une étape change.
    const numeroPermanent = Number(
        question?.etapeAnalyticsPermanent
        ?? etapeProgramme?.idAnalyticsPermanent
        ?? numeroVisible
    );
    return {
        numero: Number.isFinite(numeroPermanent) && numeroPermanent > 0 ? numeroPermanent : numeroVisible,
        nom: etapeProgramme?.titre || `Étape ${numeroVisible}`
    };
}
function obtenirIdentifiantQuestionAnalytics(question) {
    const identifiant = Number(question?.id);
    if (!Number.isFinite(identifiant))
        return null;
    return `Q${String(Math.trunc(identifiant)).padStart(3, '0')}`;
}
function obtenirResultatReponseAnalytics(statut) {
    const correspondances = {
        correcte: 'Réussite autonome',
        correcte_autonome: 'Réussite autonome',
        aidee: 'Réussite avec aide',
        correcte_aidee: 'Réussite avec aide',
        incorrecte: 'Réponse incorrecte',
        passee: 'Question passée',
        a_repondre: 'À répondre'
    };
    return correspondances[statut] || null;
}
function obtenirDureeSessionAnalytics() {
    if (!Number.isFinite(etat?.debutSessionAnalytics))
        return null;
    return Math.max(0, Math.round((Date.now() - etat.debutSessionAnalytics) / 1000));
}
function obtenirContexteSessionAnalytics() {
    const modeDeJeu = obtenirLibelleModeJeuAnalytics();
    if (!modeDeJeu)
        return {};
    const identifiantTheme = etat?.theme || etat?.questionCourante?.theme || null;
    const contexte = {
        pjjoue_mode_de_jeu: modeDeJeu,
        pjjoue_parcours: identifiantTheme && PROGRAMMES[identifiantTheme]
            ? PROGRAMMES[identifiantTheme].titre
            : (etat?.perimetreEntrainement === 'tous' ? 'Parcours complet' : null),
        pjjoue_nombre_questions: Array.isArray(etat?.questionsSession) && etat.questionsSession.length
            ? etat.questionsSession.length
            : null,
        pjjoue_jokers: etat?.jokersSessionActifs === false ? 'Sans' : 'Avec'
    };
    if (etat.mode === 'parcours' || etat.mode === 'evaluation-finale') {
        const etape = obtenirInformationsEtapeAnalytics();
        contexte.pjjoue_numero_etape = etape.numero;
        contexte.pjjoue_nom_etape = etape.nom;
    }
    if (etat.mode === 'parcours') {
        contexte.pjjoue_defi_chrono = etat.chronometreSessionActif ? 'Chronométré' : 'Libre';
        contexte.pjjoue_temps_par_question_defi_chrono = etat.chronometreSessionActif
            ? Number(etat.dureeChronometreSession) || null
            : null;
    }
    if (etat.mode === 'libre' && etat.origineSessionAnalytics !== 'defi_du_hasard') {
        contexte.pjjoue_mode_entrainement = etat.organisationSession === 'ordonne'
            ? 'Par ordre d’étapes'
            : 'Mélangé';
        contexte.pjjoue_chrono = etat.chronometreSessionActif ? 'Avec' : 'Sans';
        contexte.pjjoue_temps_par_question = etat.chronometreSessionActif
            ? Number(etat.dureeChronometreSession) || null
            : null;
    }
    if (etat.origineSessionAnalytics === 'defi_du_hasard') {
        contexte.pjjoue_nombre_questions_defi_du_hasard = Number(etat.nombreQuestionsTirageDe) || null;
    }
    return contexte;
}
function obtenirContexteQuestionAnalytics(question) {
    const etape = obtenirInformationsEtapeAnalytics(question);
    const modeQuestion = question
        ? (question.modePresentation || obtenirModeQuestion(question))
        : null;
    return {
        ...obtenirContexteSessionAnalytics(),
        pjjoue_numero_etape: etape.numero,
        pjjoue_nom_etape: etape.nom,
        pjjoue_identifiant_question: obtenirIdentifiantQuestionAnalytics(question),
        pjjoue_nom_question: question?.enonce || null,
        pjjoue_position_question_session: Number.isFinite(Number(etat?.indexQuestion))
            ? Number(etat.indexQuestion) + 1
            : null,
        pjjoue_type_question: modeQuestion ? obtenirLibelleMode(modeQuestion) : null
    };
}
function envoyerUtilisationJoker(type) {
    envoyerEvenementPJJ('joker_utilise', {
        ...obtenirContexteQuestionAnalytics(etat.questionCourante),
        pjjoue_joker_utilise: LIBELLES_JOKERS_ANALYTICS[type] || type
    });
}
function estRouteAccueil() {
    if (typeof lireRoute === 'function')
        return lireRoute().ecran === 'accueil';
    const routeLocale = new URLSearchParams(location.search).get('pjjoue_route');
    return !routeLocale || routeLocale === 'accueil';
}
function remettreAccueilEnHaut() {
    const racineDefilement = document.scrollingElement || document.documentElement;
    if (racineDefilement)
        racineDefilement.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    if (document.body)
        document.body.scrollTop = 0;
    window.scrollTo(0, 0);
}
function garantirAccueilEnHaut() {
    if (!estRouteAccueil())
        return;
    remettreAccueilEnHaut();
    requestAnimationFrame(() => {
        remettreAccueilEnHaut();
        requestAnimationFrame(remettreAccueilEnHaut);
    });
    setTimeout(remettreAccueilEnHaut, 80);
    setTimeout(remettreAccueilEnHaut, 220);
}
function echapperHtml(valeur) {
    const caracteresEchappes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(valeur ?? '').replace(
        /[&<>"']/g,
        caractere => caracteresEchappes[caractere]
    );
}
const MESSAGES_REUSSITE = [
    'Solide ! Tu viens de sécuriser un vrai réflexe professionnel.',
    'Très bien raisonné. Ce point-là commence à devenir automatique.',
    'Exact. Tu as résisté au piège le plus tentant.',
    'Bien vu ! La fiabilité avant la précipitation.',
    'Excellent : tu as identifié ce qui devait être vérifié avant d’agir.'
];
const MESSAGES_ERREUR = [
    'Une erreur ici, c’est une erreur évitée sur le terrain.',
    'Relis l’acteur, la source, l’échéance et la limite du rôle concerné.',
    'Ce piège était crédible : repère l’indice qui permet de le distinguer.',
    'L’objectif maintenant : comprendre l’erreur et recommencer.',
    'Repère ce qui a orienté la réponse, puis vérifie la bonne règle.'
]
const CLE_SAUVEGARDE = 'pjjoue_v1_sauvegarde';
const CLE_SESSION_EN_COURS = 'pjjoue_v1_session_en_cours';
