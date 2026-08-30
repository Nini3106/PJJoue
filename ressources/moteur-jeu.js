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
// -----------------------------------------------------------------------------
// Sauvegarde locale et état général
// -----------------------------------------------------------------------------
function creerEtatEvaluationFinale() {
    return { meilleurScore: 0, nombreTentatives: 0, reussie: false };
}
function creerEvaluationsFinalesInitiales() {
    return Object.fromEntries(THEMES.map(theme => [theme.id, creerEtatEvaluationFinale()]));
}
function creerProgressionSiglesInitiale() {
    return {
        decouverts: {},
        etapes: Object.fromEntries([1, 2, 3, 4, 5, 6].map(numero => [String(numero), {
            autonomes: {},
            validationsSansJoker: {},
            celebrationAffichee: false,
            nombreTentatives: 0,
            meilleurScore: 0
        }])),
        erreurs: {},
        evaluation: { meilleurScore: 0, nombreTentatives: 0, reussie: false },
        statistiques: { questionsJouees: 0 }
    };
}
function creerSauvegardeInitiale() {
    return {
        version: 'V1',
        xp: 0,
        meilleureSerie: 0,
        nombreQuestionsJouees: 0,
        aDejaJoue: false,
        erreurs: {},
        progression: { apprenant: {} },
        parametres: { son: true, volume: .65, echelleTexte: 1 },
        dernierTheme: null,
        etapesDecouvertes: {},
        questionsJouees: {},
        evaluationsFinales: creerEvaluationsFinalesInitiales(),
        siglesJeu: creerProgressionSiglesInitiale()
    };
}
function estObjetSimple(valeur) {
    return Boolean(valeur) && typeof valeur === 'object' && !Array.isArray(valeur);
}
function estThemeConnu(identifiantTheme) {
    return typeof identifiantTheme === 'string'
        && THEMES.some(theme => theme.id === identifiantTheme);
}
function convertirEntierBorne(valeur, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
    const nombre = Number(valeur);
    if (!Number.isFinite(nombre))
        return minimum;
    return Math.min(maximum, Math.max(minimum, Math.trunc(nombre)));
}
function filtrerIndicateurs(ensemble, identifiantsAutorises) {
    if (!estObjetSimple(ensemble))
        return {};
    return Object.fromEntries(
        Object.entries(ensemble).filter(([identifiant, actif]) =>
            identifiantsAutorises.has(String(identifiant)) && actif === true
        )
    );
}
function filtrerResultats(ensemble, identifiantsAutorises) {
    if (!estObjetSimple(ensemble))
        return {};
    return Object.fromEntries(
        Object.entries(ensemble).filter(([identifiant, resultat]) =>
            identifiantsAutorises.has(String(identifiant)) && typeof resultat === 'boolean'
        )
    );
}
function nettoyerProgression(progression) {
    const progressionNettoyee = { apprenant: {} };
    const progressionApprenant = estObjetSimple(progression?.apprenant)
        ? progression.apprenant
        : {};
    for (const [theme, etapesProgramme] of Object.entries(progressionApprenant)) {
        if (!estThemeConnu(theme) || !estObjetSimple(etapesProgramme))
            continue;
        progressionNettoyee.apprenant[theme] = {};
        for (const [numeroEtape, enregistrement] of Object.entries(etapesProgramme)) {
            const etape = Number(numeroEtape);
            const questionsEtape = QUESTIONS.filter(question =>
                question.theme === theme && Number(question.etape) === etape
                && question.estEvaluationFinale !== true
            );
            if (!Number.isInteger(etape)
                || !PROGRAMMES[theme]?.etapes?.some(element => Number(element.id) === etape)
                || !estObjetSimple(enregistrement))
                continue;
            const identifiantsQuestions = new Set(questionsEtape.map(question => String(question.id)));
            const resultats = filtrerResultats(enregistrement.resultats, identifiantsQuestions);
            const validationsSansJoker = estObjetSimple(enregistrement.validationsSansJoker)
                ? filtrerIndicateurs(enregistrement.validationsSansJoker, identifiantsQuestions)
                : Object.fromEntries(Object.entries(resultats).filter(([_identifiant, resultat]) => resultat === true));
            const celebrationSansJokerAffichee = typeof enregistrement.celebrationSansJokerAffichee === 'boolean'
                ? enregistrement.celebrationSansJokerAffichee
                : enregistrement.termineeSansJoker === true;
            progressionNettoyee.apprenant[theme][numeroEtape] = {
                meilleurScore: convertirEntierBorne(enregistrement.meilleurScore, 0, 100),
                nombreTentatives: convertirEntierBorne(enregistrement.nombreTentatives),
                questionsTraitees: filtrerIndicateurs(enregistrement.questionsTraitees, identifiantsQuestions),
                resultats,
                validationsSansJoker,
                celebrationSansJokerAffichee,
                termineeSansJoker: enregistrement.termineeSansJoker === true,
                jokersUtilises: enregistrement.termineeSansJoker !== true
            };
        }
    }
    return progressionNettoyee;
}
function nettoyerErreurs(erreurs) {
    const erreursNettoyees = {};
    if (!estObjetSimple(erreurs))
        return erreursNettoyees;
    for (const [identifiant, enregistrement] of Object.entries(erreurs)) {
        const identifiantQuestion = Number(identifiant);
        const questionCorrespondante = QUESTIONS.find(question => Number(question.id) === identifiantQuestion);
        if (!Number.isInteger(identifiantQuestion)
            || identifiantQuestion < 1
            || !questionCorrespondante
            || questionCorrespondante.estEvaluationFinale === true
            || !estObjetSimple(enregistrement))
            continue;
        erreursNettoyees[String(identifiantQuestion)] = {
            reussites: convertirEntierBorne(enregistrement.reussites),
            maitrisee: enregistrement.maitrisee === true,
            nombreErreurs: convertirEntierBorne(enregistrement.nombreErreurs),
            nombrePassages: convertirEntierBorne(enregistrement.nombrePassages),
            theme: estThemeConnu(enregistrement.theme) ? enregistrement.theme : questionCorrespondante.theme
        };
    }
    return erreursNettoyees;
}
function nettoyerEvaluationsFinales(sauvegardeBrute) {
    const nettoyees = creerEvaluationsFinalesInitiales();
    const nouvelles = estObjetSimple(sauvegardeBrute?.evaluationsFinales)
        ? sauvegardeBrute.evaluationsFinales
        : {};
    THEMES.forEach(theme => {
        const brute = estObjetSimple(nouvelles[theme.id]) ? nouvelles[theme.id] : {};
        nettoyees[theme.id] = {
            meilleurScore: convertirEntierBorne(brute.meilleurScore, 0, 100),
            nombreTentatives: convertirEntierBorne(brute.nombreTentatives),
            reussie: brute.reussie === true
        };
    });
    return nettoyees;
}
function normaliserEtapesDecouvertes(sauvegardeBrute) {
    const resultat = {};
    const etapesDecouvertesEnregistrees = estObjetSimple(sauvegardeBrute?.etapesDecouvertes)
        ? sauvegardeBrute.etapesDecouvertes
        : {};
    for (const [cle, actif] of Object.entries(etapesDecouvertesEnregistrees)) {
        if (actif !== true)
            continue;
        if (cle.includes(':')) {
            const [theme, numero] = cle.split(':');
            if (estThemeConnu(theme) && obtenirEtapeProgramme?.(theme, Number(numero)))
                resultat[`${theme}:${Number(numero)}`] = true;
        }
    }
    return resultat;
}
function nettoyerProgressionSigles(sauvegardeBrute) {
    const initiale = creerProgressionSiglesInitiale();
    const brute = estObjetSimple(sauvegardeBrute?.siglesJeu) ? sauvegardeBrute.siglesJeu : {};
    const identifiants = new Set((SIGLES || []).map(element => String(element.sigle || '').toUpperCase()));
    const filtrerSiglesActifs = valeur => estObjetSimple(valeur)
        ? Object.fromEntries(Object.entries(valeur).filter(([sigle, actif]) => identifiants.has(String(sigle).toUpperCase()) && actif === true))
        : {};
    const erreurs = {};
    if (estObjetSimple(brute.erreurs)) {
        for (const [sigle, valeur] of Object.entries(brute.erreurs)) {
            const cle = String(sigle).toUpperCase();
            if (!identifiants.has(cle) || !estObjetSimple(valeur))
                continue;
            erreurs[cle] = {
                active: valeur.active === true,
                nombreErreurs: convertirEntierBorne(valeur.nombreErreurs),
                reussitesRevision: convertirEntierBorne(valeur.reussitesRevision, 0, 2)
            };
        }
    }
    const etapes = {};
    for (let numero = 1; numero <= 6; numero += 1) {
        const cle = String(numero);
        const source = estObjetSimple(brute.etapes?.[cle]) ? brute.etapes[cle] : {};
        const autorises = new Set((SIGLES || []).filter(element => Number(element.etape) === numero).map(element => String(element.sigle).toUpperCase()));
        const filtrerEtape = valeur => estObjetSimple(valeur)
            ? Object.fromEntries(Object.entries(valeur).filter(([sigle, actif]) => autorises.has(String(sigle).toUpperCase()) && actif === true))
            : {};
        etapes[cle] = {
            autonomes: filtrerEtape(source.autonomes),
            validationsSansJoker: filtrerEtape(source.validationsSansJoker),
            celebrationAffichee: source.celebrationAffichee === true,
            nombreTentatives: convertirEntierBorne(source.nombreTentatives),
            meilleurScore: convertirEntierBorne(source.meilleurScore, 0, 100)
        };
    }
    const evaluation = estObjetSimple(brute.evaluation) ? brute.evaluation : {};
    const statistiques = estObjetSimple(brute.statistiques) ? brute.statistiques : {};
    return {
        decouverts: filtrerSiglesActifs(brute.decouverts),
        etapes,
        erreurs,
        evaluation: {
            meilleurScore: convertirEntierBorne(evaluation.meilleurScore, 0, 100),
            nombreTentatives: convertirEntierBorne(evaluation.nombreTentatives),
            reussie: evaluation.reussie === true
        },
        statistiques: { questionsJouees: convertirEntierBorne(statistiques.questionsJouees) }
    };
}
function nettoyerSauvegarde(sauvegardeBrute) {
    const sauvegardeInitiale = creerSauvegardeInitiale();
    if (!estObjetSimple(sauvegardeBrute))
        return sauvegardeInitiale;
    const parametres = estObjetSimple(sauvegardeBrute.parametres)
        ? sauvegardeBrute.parametres
        : {};
    const nombreQuestionsJouees = convertirEntierBorne(sauvegardeBrute.nombreQuestionsJouees);
    const identifiantsQuestions = new Set(QUESTIONS.map(question => String(question.id)));
    return {
        ...sauvegardeInitiale,
        version: 'V1',
        xp: convertirEntierBorne(sauvegardeBrute.xp),
        meilleureSerie: convertirEntierBorne(sauvegardeBrute.meilleureSerie),
        nombreQuestionsJouees,
        aDejaJoue: sauvegardeBrute.aDejaJoue === true || nombreQuestionsJouees > 0,
        erreurs: nettoyerErreurs(sauvegardeBrute.erreurs),
        progression: nettoyerProgression(sauvegardeBrute.progression),
        parametres: {
            son: parametres.son !== false,
            volume: Number.isFinite(Number(parametres.volume))
                ? Math.min(1, Math.max(0, Number(parametres.volume)))
                : .65,
            echelleTexte: [.9, 1, 1.08, 1.15].includes(Number(parametres.echelleTexte))
                ? Number(parametres.echelleTexte)
                : 1
        },
        dernierTheme: estThemeConnu(sauvegardeBrute.dernierTheme)
            ? sauvegardeBrute.dernierTheme
            : null,
        etapesDecouvertes: normaliserEtapesDecouvertes(sauvegardeBrute),
        questionsJouees: filtrerIndicateurs(sauvegardeBrute.questionsJouees, identifiantsQuestions),
        evaluationsFinales: nettoyerEvaluationsFinales(sauvegardeBrute),
        siglesJeu: nettoyerProgressionSigles(sauvegardeBrute)
    };
}
function chargerSauvegarde() {
    try {
        const contenu = localStorage.getItem(CLE_SAUVEGARDE);
        return contenu
            ? nettoyerSauvegarde(JSON.parse(contenu))
            : creerSauvegardeInitiale();
    }
    catch (erreur) {
        return creerSauvegardeInitiale();
    }
}
let sauvegarde = chargerSauvegarde();
let etat = {
    ecran: 'accueil',
    theme: null,
    etape: 1,
    chapitre: 1,
    mode: null,
    questionsSession: [],
    indexQuestion: 0,
    score: 0,
    serie: 0,
    meilleureSerie: 0,
    questionCourante: null,
    erreursSession: new Set(),
    questionsPassees: new Set(),
    reponsesSession: new Map(),
    optionsSession: new Map(),
    jokers: { cinquanteCinquante: true, indice: true, langueAuChat: true },
    identifiantMinuteur: null,
    tempsRestant: 0,
    organisationSession: 'melange',
    nombreReponsesAidees: 0,
    chronometreSessionActif: false,
    dureeChronometreSession: 15,
    chronometreParcoursActif: false,
    dureeChronometreParcours: 15,
    nombreQuestionsTirageDe: 0,
    origineSessionAnalytics: null,
    perimetreEntrainement: 'tous',
    brouillonsEcrits: new Map()
};
let minuteurRappelJokers = null;
let minuteurFinRappelJokers = null;
let minuteurTransitionParcours = null;
let stockageLocalAverti = false;
function effacerSauvegardeDuNavigateur() {
    try {
        localStorage.removeItem(CLE_SAUVEGARDE);
    }
    catch (erreur) {
        // L’indisponibilité du stockage sera signalée par l’enregistrement suivant.
    }
}
function enregistrerSauvegarde() {
    sauvegarde.version = 'V1';
    try {
        localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(sauvegarde));
        return true;
    }
    catch (erreur) {
        if (!stockageLocalAverti) {
            stockageLocalAverti = true;
            afficherNotification('Sauvegarde locale indisponible · pense à exporter ta progression avant de fermer PJJoue.');
        }
        return false;
    }
}
function serialiserTableauAssociatif(carte) {
    return carte instanceof Map ? [...carte.entries()] : [];
}
function serialiserEnsemble(ensemble) {
    return ensemble instanceof Set ? [...ensemble.values()] : [];
}
function restaurerTableauAssociatif(valeur) {
    return Array.isArray(valeur) ? new Map(valeur) : new Map();
}
function restaurerEnsemble(valeur) {
    return Array.isArray(valeur) ? new Set(valeur) : new Set();
}
function effacerSessionEnCours() {
    try {
        localStorage.removeItem(CLE_SESSION_EN_COURS);
    }
    catch (erreur) {
        // Une session technique ne doit jamais bloquer le jeu si le stockage est indisponible.
    }
}
function enregistrerSessionEnCours() {
    if (estSessionMissionSigles())
        return false;
    if (etat.ecran !== 'question' || !etat.questionsSession?.length || !etat.questionCourante)
        return false;
    const saisieActive = selectionner('#reponseEcrite');
    if (saisieActive && etat.questionCourante?.id) {
        etat.brouillonsEcrits = etat.brouillonsEcrits || new Map();
        etat.brouillonsEcrits.set(etat.questionCourante.id, saisieActive.value || '');
    }
    const instantane = {
        version: 1,
        enregistreLe: Date.now(),
        theme: etat.theme,
        etape: etat.etape,
        chapitre: etat.chapitre,
        mode: etat.mode,
        organisationSession: etat.organisationSession,
        origineSessionAnalytics: etat.origineSessionAnalytics,
        perimetreRevision: etat.perimetreRevision || null,
        indexQuestion: etat.indexQuestion,
        questionValidee: etat.questionValidee === true,
        score: etat.score,
        serie: etat.serie,
        meilleureSerie: etat.meilleureSerie,
        nombreReponsesAidees: etat.nombreReponsesAidees,
        sessionAvecJoker: etat.sessionAvecJoker === true,
        etapeAvecJoker: etat.etapeAvecJoker === true,
        jokersSessionActifs: etat.jokersSessionActifs !== false,
        chronometreSessionActif: etat.chronometreSessionActif === true,
        dureeChronometreSession: etat.dureeChronometreSession,
        tempsRestant: etat.tempsRestant,
        delaiDepasse: etat.delaiDepasse === true,
        debutSessionAnalytics: etat.debutSessionAnalytics,
        nombreQuestionsTirageDe: etat.nombreQuestionsTirageDe || 0,
        decalageReponses: etat.decalageReponses || 0,
        questions: etat.questionsSession.map(question => Number(question.id)).filter(Number.isFinite),
        erreursSession: serialiserEnsemble(etat.erreursSession),
        questionsPassees: serialiserEnsemble(etat.questionsPassees),
        reponsesSession: serialiserTableauAssociatif(etat.reponsesSession),
        optionsSession: serialiserTableauAssociatif(etat.optionsSession),
        tentativesQuestions: serialiserTableauAssociatif(etat.tentativesQuestions),
        jokersQuestions: serialiserTableauAssociatif(etat.jokersQuestions),
        brouillonsEcrits: serialiserTableauAssociatif(etat.brouillonsEcrits),
        brouillonActivite: etat.brouillonActivite || null
    };
    try {
        localStorage.setItem(CLE_SESSION_EN_COURS, JSON.stringify(instantane));
        return true;
    }
    catch (erreur) {
        return false;
    }
}
function chargerSessionEnCours() {
    try {
        const contenu = localStorage.getItem(CLE_SESSION_EN_COURS);
        if (!contenu)
            return null;
        const instantane = JSON.parse(contenu);
        if (!instantane || instantane.version !== 1 || !Array.isArray(instantane.questions))
            return null;
        return instantane;
    }
    catch (erreur) {
        return null;
    }
}
function restaurerSessionEnCours() {
    const instantane = chargerSessionEnCours();
    if (!instantane)
        return false;
    const questions = instantane.questions
        .map(identifiant => QUESTIONS.find(question => Number(question.id) === Number(identifiant)))
        .filter(Boolean)
        .map(question => ({ ...question, modePresentation: question.modePrefere || obtenirModeQuestion(question) }));
    if (!questions.length || questions.length !== instantane.questions.length) {
        effacerSessionEnCours();
        return false;
    }
    const positionQuestion = Math.min(questions.length - 1, Math.max(0, Number(instantane.indexQuestion) || 0));
    etat.theme = instantane.theme || questions[positionQuestion]?.theme || 'commun';
    etat.etape = Number(instantane.etape) || Number(questions[positionQuestion]?.etape) || 1;
    etat.chapitre = Number(instantane.chapitre) || 1;
    etat.mode = instantane.mode || 'parcours';
    etat.organisationSession = instantane.organisationSession || 'ordonne';
    etat.origineSessionAnalytics = instantane.origineSessionAnalytics || null;
    etat.perimetreRevision = instantane.perimetreRevision || null;
    etat.questionsSession = questions;
    etat.indexQuestion = positionQuestion;
    etat.score = Math.max(0, Number(instantane.score) || 0);
    etat.serie = Math.max(0, Number(instantane.serie) || 0);
    etat.meilleureSerie = Math.max(0, Number(instantane.meilleureSerie) || 0);
    etat.nombreReponsesAidees = Math.max(0, Number(instantane.nombreReponsesAidees) || 0);
    etat.sessionAvecJoker = instantane.sessionAvecJoker === true;
    etat.etapeAvecJoker = instantane.etapeAvecJoker === true;
    etat.jokersSessionActifs = instantane.jokersSessionActifs !== false;
    etat.chronometreSessionActif = instantane.chronometreSessionActif === true;
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number(instantane.dureeChronometreSession) || 15));
    etat.tempsRestant = Math.max(0, Number(instantane.tempsRestant) || 0);
    etat.delaiDepasse = instantane.delaiDepasse === true;
    etat.debutSessionAnalytics = Number(instantane.debutSessionAnalytics) || Date.now();
    etat.nombreQuestionsTirageDe = Math.max(0, Number(instantane.nombreQuestionsTirageDe) || 0);
    etat.decalageReponses = Number(instantane.decalageReponses) || 0;
    etat.erreursSession = restaurerEnsemble(instantane.erreursSession);
    etat.questionsPassees = restaurerEnsemble(instantane.questionsPassees);
    etat.reponsesSession = restaurerTableauAssociatif(instantane.reponsesSession);
    etat.optionsSession = restaurerTableauAssociatif(instantane.optionsSession);
    etat.tentativesQuestions = restaurerTableauAssociatif(instantane.tentativesQuestions);
    etat.jokersQuestions = restaurerTableauAssociatif(instantane.jokersQuestions);
    etat.brouillonsEcrits = restaurerTableauAssociatif(instantane.brouillonsEcrits);
    etat.brouillonActivite = instantane.brouillonActivite || null;
    etat.questionCourante = questions[positionQuestion];
    etat.questionValidee = Boolean(instantane.questionValidee);
    etat.jokers = etat.jokersQuestions.get(etat.questionCourante.id)
        || { cinquanteCinquante: true, indice: true, langueAuChat: true };
    actualiserIndicateurSerie();
    return true;
}
function melanger(elements) {
    const elementsMelanges = [...elements];
    for (let indice = elementsMelanges.length - 1; indice > 0; indice--) {
        const indiceAleatoire = Math.floor(Math.random() * (indice + 1));
        [elementsMelanges[indice], elementsMelanges[indiceAleatoire]] = [
            elementsMelanges[indiceAleatoire],
            elementsMelanges[indice]
        ];
    }
    return elementsMelanges;
}
function annoncer(message) {
    const zoneDirecte = selectionner('#statutAccessibilite');
    if (!zoneDirecte)
        return;
    zoneDirecte.textContent = '';
    requestAnimationFrame(() => {
        zoneDirecte.textContent = String(message || '');
    });
}
function afficherNotification(message) {
    const notification = selectionner('#notification');
    notification.textContent = message;
    notification.classList.add('visible');
    setTimeout(() => notification.classList.remove('visible'), 2600);
}
let historiqueNavigation = [];
let confirmationRetourEnCours = false;
function annulerRappelJokers() {
    clearTimeout(minuteurRappelJokers);
    clearTimeout(minuteurFinRappelJokers);
    minuteurRappelJokers = null;
    minuteurFinRappelJokers = null;
    selectionner('#boutonJokers')?.classList.remove('rappel-jokers');
}
function compterJokersDisponibles() {
    if (etat.jokersSessionActifs === false || !etat.jokers)
        return 0;
    return ['cinquanteCinquante', 'indice', 'langueAuChat'].filter(cle => etat.jokers[cle] === true).length;
}
function actualiserBoutonJokers() {
    const declencheur = selectionner('#boutonJokers');
    const fenetre = selectionner('#fenetreJokers');
    const statut = selectionner('#statutFenetreJokers');
    if (!declencheur)
        return;
    const actif = etat.ecran === 'question' && etat.jokersSessionActifs !== false;
    const disponibles = compterJokersDisponibles();
    declencheur.classList.toggle('masque', !actif);
    declencheur.disabled = !actif || etat.questionValidee || disponibles === 0;
    declencheur.setAttribute('aria-expanded', String(!!fenetre?.open));
    const libelleNombreJokers = `${disponibles} joker${disponibles > 1 ? 's' : ''}`;
    const libelleDisponibilite = `${libelleNombreJokers}`
        + ` disponible${disponibles > 1 ? 's' : ''}`;
    declencheur.setAttribute(
        'aria-label',
        disponibles > 0 ? `Ouvrir les jokers — ${libelleDisponibilite}` : 'Aucun joker disponible'
    );
    if (etat.questionValidee) {
        declencheur.title = 'Les jokers ne sont plus disponibles après validation.';
    }
    else {
        declencheur.title = disponibles > 0
            ? libelleDisponibilite
            : 'Tous les jokers ont été utilisés pour cette activité.';
    }
    if (statut) {
        statut.textContent = disponibles > 0
            ? `${libelleNombreJokers} encore disponible${disponibles > 1 ? 's' : ''}`
                + ' pour cette activité.'
            : 'Tous les jokers ont été utilisés pour cette activité.';
    }
}
function fermerFenetreJokers({ restaurerFocus = true } = {}) {
    const fenetre = selectionner('#fenetreJokers');
    const declencheur = selectionner('#boutonJokers');
    if (fenetre?.open)
        fenetre.close();
    declencheur?.setAttribute('aria-expanded', 'false');
    if (restaurerFocus && declencheur && !declencheur.classList.contains('masque'))
        requestAnimationFrame(() => declencheur.focus({ preventScroll: true }));
}
function ouvrirFenetreJokers() {
    const fenetre = selectionner('#fenetreJokers');
    const declencheur = selectionner('#boutonJokers');
    actualiserBoutonJokers();
    if (!fenetre || !declencheur || declencheur.disabled)
        return;
    if (!fenetre.open)
        fenetre.showModal();
    declencheur.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
        const premier = ['boutonJoker5050', 'boutonJokerIndice', 'boutonJokerLangueAuChat']
            .map(identifiant => selectionner('#' + identifiant))
            .find(bouton => bouton && !bouton.disabled);
        (premier || selectionner('#fermerFenetreJokers'))?.focus({ preventScroll: true });
    });
}
function programmerRappelJokers() {
    annulerRappelJokers();
    minuteurRappelJokers = setTimeout(() => {
        if (etat.ecran !== 'question' || etat.questionValidee)
            return;
        const declencheur = selectionner('#boutonJokers');
        if (!declencheur || declencheur.disabled || declencheur.classList.contains('masque'))
            return;
        declencheur.classList.add('rappel-jokers');
        minuteurFinRappelJokers = setTimeout(() => declencheur.classList.remove('rappel-jokers'), 1300);
        minuteurRappelJokers = setTimeout(programmerRappelJokers, 8500);
    }, 5200);
}
let restaurationNavigation = false;
// -----------------------------------------------------------------------------
// Navigation, historique et fenêtres de confirmation
// -----------------------------------------------------------------------------
let navigationLocaleEnCours = false;
function utiliserNavigationLocaleSansServeur() {
    return window.location.protocol === 'file:' || !/^https?:$/.test(window.location.protocol);
}
function obtenirRacineApplication() {
    try {
        return new URL('.', document.baseURI);
    }
    catch (erreur) {
        // Les recettes Chromium avec set_content utilisent about:blank.
        // Cette racine neutre évite qu'un contexte de test sans URL HTTP interrompe le script.
        return new URL('https://pjjoue.local/');
    }
}
const URL_RACINE_APPLICATION = obtenirRacineApplication();
const ROUTES_APPLICATION_PROPRES = Object.freeze({
    accueil: '',
    parcours: 'parcours',
    carnet: 'carnet',
    entrainement: 'entrainement',
    erreurs: 'revision',
    sigles: 'mission-sigles',
    'sigles-revision': 'mission-sigles/revision',
    supports: 'supports',
    progression: 'progression',
    parametres: 'parametres',
    question: 'question',
    bilan: 'resultats'
});
const ECRANS_PAR_ROUTE_PROPRE = Object.freeze(
    Object.fromEntries(
        Object.entries(ROUTES_APPLICATION_PROPRES)
            .filter(([, route]) => route)
            .map(([ecran, route]) => [route, ecran])
    )
);
function routeLocalePourEcran(identifiant) {
    const routeRelative = routeRelativePourEcran(identifiant) || 'accueil';
    return '?pjjoue_route=' + encodeURIComponent(routeRelative);
}
function routeRelativePourEcran(identifiant) {
    if (identifiant === 'parcours' && etat.theme)
        return 'parcours/' + encodeURIComponent(etat.theme);
    return ROUTES_APPLICATION_PROPRES[identifiant] ?? '';
}
function routePourEcran(identifiant) {
    if (utiliserNavigationLocaleSansServeur())
        return routeLocalePourEcran(identifiant);
    const routeRelative = routeRelativePourEcran(identifiant);
    return new URL(routeRelative ? `${routeRelative}/` : './', URL_RACINE_APPLICATION).pathname;
}
function creerEtatNavigation(identifiant) {
    return {
        pjjoue: true,
        ecran: identifiant,
        theme: etat.theme,
        etape: etat.etape
    };
}
function mettreAJourAdresseNavigation(identifiant, remplacer = false) {
    const route = routePourEcran(identifiant);
    const methode = remplacer ? 'replaceState' : 'pushState';
    if (utiliserNavigationLocaleSansServeur()) {
        // En file://, Chrome attribue une origine de sécurité unique à chaque URL locale.
        // Modifier l'historique avec pushState/replaceState peut donc produire un avertissement
        // « Unsafe attempt to load URL ». La navigation interne reste en mémoire et ne génère
        // aucun fragment #. Lors d'un retour à l'accueil depuis un relais local, on recharge
        // simplement index.html sans paramètre afin que la barre d'adresse soit cohérente.
        if (identifiant === 'accueil' && window.location.search) {
            const accueilLocal = new URL('index.html', URL_RACINE_APPLICATION);
            window.location[remplacer ? 'replace' : 'assign'](accueilLocal.href);
            return;
        }
        navigationLocaleEnCours = false;
        return;
    }
    if (window.location.pathname === route && !window.location.search && !window.location.hash)
        return;
    history[methode](creerEtatNavigation(identifiant), '', route);
}
function actualiserBoutonRetour() {
    const boutonRetour = selectionner('#boutonRetour');
    if (!boutonRetour)
        return;
    const detailParcoursOuvert = etat.ecran === 'parcours'
        && !selectionner('#vueDetailParcours')?.classList.contains('masque');
    const retourDisponible = etat.ecran !== 'accueil' && !detailParcoursOuvert;
    boutonRetour.classList.toggle('masque', !retourDisponible);
    boutonRetour.disabled = !retourDisponible;
}
function mesurerHauteurEntete() {
    const entete = document.querySelector('header.entete');
    const hauteur = Math.ceil(entete?.getBoundingClientRect().height || 66);
    document.documentElement.style.setProperty('--hauteur-entete', hauteur + 'px');
}
function fermerMenuPrincipal() {
    const entete = document.querySelector('header.entete');
    const bouton = selectionner('#boutonMenuMobile');
    entete?.classList.remove('menu-mobile-ouvert');
    document.documentElement.classList.remove('menu-principal-ouvert');
    bouton?.setAttribute('aria-expanded', 'false');
    bouton?.setAttribute('aria-label', 'Ouvrir le menu principal');
    const libelle = bouton?.querySelector('.bouton-menu-libelle');
    if (libelle)
        libelle.textContent = 'Menu';
}
function basculerMenuPrincipal() {
    const entete = document.querySelector('header.entete');
    const bouton = selectionner('#boutonMenuMobile');
    const navigation = selectionner('#menuPrincipal');
    if (!entete || !bouton || !navigation)
        return;
    const ouvert = entete.classList.toggle('menu-mobile-ouvert');
    document.documentElement.classList.toggle('menu-principal-ouvert', ouvert);
    bouton.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    bouton.setAttribute('aria-label', ouvert ? 'Fermer le menu principal' : 'Ouvrir le menu principal');
    const libelle = bouton.querySelector('.bouton-menu-libelle');
    if (libelle)
        libelle.textContent = ouvert ? 'Fermer' : 'Menu';
    mesurerHauteurEntete();
    if (ouvert)
        requestAnimationFrame(() => navigation.querySelector('button:not(:disabled), a[href]')?.focus());
}
function actualiserNavigation(identifiant) {
    selectionnerTous('.navigation [data-ecran]').forEach(bouton => {
        const actif = bouton.dataset.ecran === identifiant;
        bouton.classList.toggle('actif', actif);
        if (actif)
            bouton.setAttribute('aria-current', 'page');
        else
            bouton.removeAttribute('aria-current');
    });
}
function ajusterQuestionAEcran() {
    const zoneQuestion = document.getElementById('question');
    const conteneur = zoneQuestion?.querySelector('.question-conteneur');
    if (!zoneQuestion || !conteneur || !zoneQuestion.classList.contains('actif'))
        return;
    const entete = document.querySelector('header.entete');
    const basEntete = entete ? entete.getBoundingClientRect().bottom : 0;
    const boutonRetour = selectionner('#boutonRetour');
    const hauteurRetour = boutonRetour && !boutonRetour.classList.contains('masque')
        ? boutonRetour.getBoundingClientRect().height + 8
        : 0;
    const basSecurise = 12;
    const disponibles = Math.max(
        320,
        window.innerHeight - basEntete - hauteurRetour - basSecurise
    );
    // Réinitialise avant mesure pour ne pas accumuler les réductions.
    zoneQuestion.style.setProperty('--densite-question', '1');
    requestAnimationFrame(() => {
        const hauteurNaturelle = conteneur.scrollHeight;
        let densite = Math.min(1, disponibles / Math.max(hauteurNaturelle, 1));
        // Marge de sécurité légère pour éviter le pixel de scroll.
        densite = Math.max(.82, densite * .97);
        // Les questions normales restent à taille pleine.
        if (densite > .97)
            densite = 1;
        zoneQuestion.style.setProperty('--densite-question', densite.toFixed(3));
    });
}
const TITRES_ECRANS = {
    accueil: 'Accueil',
    parcours: 'Parcours PJJ',
    carnet: 'Carnet de parcours',
    entrainement: 'Choisis ton mode d’entraînement',
    erreurs: 'Mes erreurs à retravailler',
    sigles: 'Mission Sigles',
    'sigles-revision': 'Réviser mes erreurs · Mission Sigles',
    supports: 'Supports de révision',
    progression: 'Progression',
    parametres: 'Paramètres',
    question: 'Question',
    bilan: 'Résultats'
};
function actualiserTitrePage(ecran) {
    document.title = `${TITRES_ECRANS[ecran] || 'PJJoue'} — PJJoue`;
}
function afficherEcran(identifiant, optionsAffichage = {}) {
    fermerMenuPrincipal();
    if (identifiant === 'supports')
        initialiserRechercheSupports();
    clearInterval(etat.identifiantMinuteur);
    if (identifiant !== 'question')
        fermerFenetreJokers({ restaurerFocus: false });
    const courant = etat.ecran;
    const doitMemoriserEcran = courant
        && courant !== identifiant
        && !optionsAffichage.remplacerHistorique
        && !optionsAffichage.depuisHistorique
        && !restaurationNavigation;
    if (doitMemoriserEcran) {
        historiqueNavigation.push({ ecran: courant, theme: etat.theme, etape: etat.etape });
        if (historiqueNavigation.length > 30)
            historiqueNavigation.shift();
    }
    const doitAbandonnerSession = courant === 'question'
        && identifiant !== 'question'
        && !optionsAffichage.remplacerHistorique
        && !optionsAffichage.forcerSortieQuestion
        && !optionsAffichage.depuisHistorique;
    if (doitAbandonnerSession) {
        envoyerEvenementPJJ('session_quittee', {
            ...obtenirContexteSessionAnalytics(),
            pjjoue_reussites_autonomes: etat.score,
            pjjoue_questions_passees: etat.questionsPassees?.size || 0,
            pjjoue_reussites_avec_aide: etat.nombreReponsesAidees || 0,
            pjjoue_joker_utilise_session: sessionAUtiliseJoker() ? 'Oui' : 'Non',
            pjjoue_duree_session_secondes: obtenirDureeSessionAnalytics(),
            pjjoue_resultat_session: 'Session quittée'
        });
        etat.questionsSession = [];
        etat.questionCourante = null;
        etat.questionValidee = false;
        etat.delaiDepasse = false;
        effacerSessionEnCours();
    }
    selectionnerTous('.ecran').forEach(ecran => ecran.classList.remove('actif'));
    const cible = selectionner('#' + identifiant);
    if (!cible)
        return false;
    cible.classList.add('actif');
    etat.ecran = identifiant;
    document.body.dataset.ecranActif = identifiant;
    if (courant !== identifiant) {
        envoyerEvenementPJJ('page_consultee', {
            pjjoue_page_consultee: obtenirLibellePageAnalytics(identifiant),
            pjjoue_page_precedente: obtenirLibellePageAnalytics(courant || 'aucun')
        });
    }
    actualiserTitrePage(identifiant);
    mesurerHauteurEntete();
    if (identifiant === 'erreurs')
        afficherErreurs();
    if (identifiant === 'sigles-revision')
        afficherRevisionMissionSigles();
    if (identifiant === 'progression')
        afficherProgression();
    if (identifiant === 'sigles')
        actualiserAccueilSigles();
    if (identifiant === 'carnet') {
        THEMES.forEach(theme => initialiserProgression(theme.id));
        actualiserCarnetParcours();
    }
    actualiserGroupesChoix();
    actualiserNavigation(identifiant);
    actualiserBoutonRetour();
    if (!optionsAffichage.depuisHistorique && !restaurationNavigation)
        mettreAJourAdresseNavigation(identifiant, Boolean(optionsAffichage.remplacerHistorique));
    if (identifiant === 'accueil')
        garantirAccueilEnHaut();
    else
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (identifiant !== 'question') {
        requestAnimationFrame(() => {
            const titre = [...cible.querySelectorAll('h1,h2')]
                .find(element => !element.closest('.masque'));
            titre?.setAttribute('tabindex', '-1');
            titre?.focus?.({ preventScroll: true });
        });
    }
    return true;
}
function ouvrirFenetreMessage({
    titre = 'Information',
    message = '',
    libelleConfirmer = 'Compris',
    libelleAnnuler = 'Annuler',
    afficherAnnuler = false,
    variante = 'standard',
    apresConfirmation,
    apresAnnulation
} = {}) {
    const fenetre = selectionner('#fenetreMessage');
    const elementTitre = selectionner('#titreFenetreMessage');
    const elementTexte = selectionner('#texteFenetreMessage');
    const boutonConfirmer = selectionner('#confirmerFenetreMessage');
    const boutonAnnuler = selectionner('#annulerFenetreMessage');
    const boutonFermer = selectionner('#fermerFenetreMessage');
    if (!fenetre || !elementTitre || !elementTexte || !boutonConfirmer || !boutonAnnuler || !boutonFermer) {
        afficherNotification(message || titre);
        apresAnnulation?.();
        return;
    }
    if (fenetre.open)
        fenetre.close();
    elementTitre.textContent = titre;
    elementTexte.textContent = message;
    boutonConfirmer.textContent = libelleConfirmer;
    boutonAnnuler.textContent = libelleAnnuler;
    boutonAnnuler.classList.toggle('masque', !afficherAnnuler);
    boutonConfirmer.className = variante === 'danger' ? 'danger' : 'principal';
    fenetre.classList.toggle('fenetre-danger', variante === 'danger');
    fenetre.classList.toggle('fenetre-reussite', variante === 'reussite');
    fenetre.classList.toggle('fenetre-avertissement', variante === 'avertissement');
    let resolu = false;
    const resoudre = confirme => {
        if (resolu)
            return;
        resolu = true;
        if (fenetre.open)
            fenetre.close();
        fenetre.oncancel = null;
        boutonConfirmer.onclick = null;
        boutonAnnuler.onclick = null;
        boutonFermer.onclick = null;
        if (confirme)
            apresConfirmation?.();
        else
            apresAnnulation?.();
    };
    fenetre.oncancel = evenement => { evenement.preventDefault(); resoudre(false); };
    boutonConfirmer.onclick = () => resoudre(true);
    boutonAnnuler.onclick = () => resoudre(false);
    boutonFermer.onclick = () => resoudre(false);
    fenetre.showModal();
    requestAnimationFrame(() => (afficherAnnuler ? boutonAnnuler : boutonConfirmer).focus());
}
function ouvrirFenetreQuitterSession({ message, apresConfirmation, apresAnnulation } = {}) {
    const fenetre = selectionner('#fenetreQuitterSession');
    const texte = selectionner('#texteFenetreQuitterSession');
    const boutonAnnuler = selectionner('#annulerQuitterSession');
    const boutonConfirmer = selectionner('#confirmerQuitterSession');
    const boutonFermer = selectionner('#fermerFenetreQuitterSession');
    if (!fenetre || !texte || !boutonAnnuler || !boutonConfirmer || !boutonFermer) {
        ouvrirFenetreMessage({
            titre: 'Quitter cette session ?',
            message: message || 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.',
            libelleConfirmer: 'Quitter la session',
            libelleAnnuler: 'Annuler',
            afficherAnnuler: true,
            apresConfirmation,
            apresAnnulation
        });
        return;
    }
    texte.textContent = message || 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.';
    let resolu = false;
    const nettoyerEcouteurs = () => {
        fenetre.removeEventListener('cancel', gererAnnulation);
        boutonAnnuler.removeEventListener('click', gererClicAnnulation);
        boutonFermer.removeEventListener('click', gererClicAnnulation);
        boutonConfirmer.removeEventListener('click', gererConfirmation);
    };
    const terminerFenetre = confirme => {
        if (resolu)
            return;
        resolu = true;
        nettoyerEcouteurs();
        if (fenetre.open)
            fenetre.close();
        if (confirme)
            apresConfirmation?.();
        else
            apresAnnulation?.();
    };
    const gererAnnulation = evenement => { evenement.preventDefault(); terminerFenetre(false); };
    const gererClicAnnulation = () => terminerFenetre(false);
    const gererConfirmation = () => terminerFenetre(true);
    fenetre.addEventListener('cancel', gererAnnulation);
    boutonAnnuler.addEventListener('click', gererClicAnnulation);
    boutonFermer.addEventListener('click', gererClicAnnulation);
    boutonConfirmer.addEventListener('click', gererConfirmation);
    fenetre.showModal();
    requestAnimationFrame(() => boutonAnnuler.focus());
}
function revenirEnArriere() {
    if (confirmationRetourEnCours)
        return;
    if (etat.ecran === 'question' && etat.questionsSession?.length && !etat.questionValidee) {
        confirmationRetourEnCours = true;
        ouvrirFenetreQuitterSession({
            message: 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.',
            apresAnnulation: () => { confirmationRetourEnCours = false; },
            apresConfirmation: () => {
                clearInterval(etat.identifiantMinuteur);
                etat.identifiantMinuteur = null;
                etat.questionsSession = [];
                etat.questionCourante = null;
                etat.questionValidee = false;
                confirmationRetourEnCours = false;
                revenirEnArriere();
            }
        });
        return;
    }
    while (historiqueNavigation.length && historiqueNavigation[historiqueNavigation.length - 1]?.ecran === etat.ecran)
        historiqueNavigation.pop();
    if (historiqueNavigation.length) {
        const precedent = historiqueNavigation.pop();
        if (precedent.theme)
            etat.theme = precedent.theme;
        if (precedent.etape)
            etat.etape = Number(precedent.etape);
        if (precedent.ecran === 'parcours' && etat.theme) {
            afficherEtapes();
        }
        afficherEcran(precedent.ecran || 'accueil', { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    if (etat.ecran === 'question') {
        const secours = etat.mode === 'parcours' || etat.mode === 'evaluation-finale' ? 'parcours' : (etat.mode === 'revision' ? 'erreurs' : (etat.mode === 'sigles-revision' ? 'sigles-revision' : 'entrainement'));
        if (secours === 'parcours') {
            ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || 'commun', { remplacerHistorique: true });
            return;
        }
        afficherEcran(secours, { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    if (etat.ecran === 'parcours' || etat.ecran === 'carnet' || etat.ecran === 'entrainement') {
        afficherEcran('accueil', { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    if (etat.ecran === 'bilan') {
        if (etat.mode === 'parcours' || etat.mode === 'evaluation-finale') {
            ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || 'commun', { remplacerHistorique: true });
            return;
        }
        afficherEcran(etat.mode === 'revision' ? 'erreurs' : (etat.mode === 'sigles-revision' ? 'sigles-revision' : 'entrainement'), { forcerSortieQuestion: true, remplacerHistorique: true });
        return;
    }
    afficherEcran('accueil', { forcerSortieQuestion: true, remplacerHistorique: true });
}
function decoderSegmentRoute(segment) {
    try {
        return decodeURIComponent(segment);
    }
    catch (erreur) {
        return '';
    }
}
function lireRouteDepuisChemin(chemin) {
    const parties = String(chemin || '')
        .replace(/^\/+|\/+$/g, '')
        .split('/')
        .filter(Boolean)
        .map(decoderSegmentRoute);
    if (!parties.length)
        return { pjjoue: true, ecran: 'accueil' };
    if (parties[0] === 'parcours')
        return { pjjoue: true, ecran: 'parcours', theme: parties[1] || null };
    const routeComplete = parties.join('/');
    return {
        pjjoue: true,
        ecran: ECRANS_PAR_ROUTE_PROPRE[routeComplete] || 'accueil'
    };
}
function lireRouteDepuisFragment() {
    const parties = location.hash.replace(/^#/, '').split('/').map(decoderSegmentRoute);
    if (parties[0] === 'parcours')
        return { pjjoue: true, ecran: 'parcours', theme: parties[1] || null };
    const ecransAutorises = ['accueil', 'parcours', 'carnet', 'entrainement', 'erreurs', 'sigles', 'sigles-revision', 'supports', 'progression', 'parametres', 'question', 'bilan'];
    return { pjjoue: true, ecran: ecransAutorises.includes(parties[0]) ? parties[0] : 'accueil' };
}
function lireRoute() {
    const routeRelayee = new URLSearchParams(location.search).get('pjjoue_route');
    if (routeRelayee)
        return lireRouteDepuisChemin(routeRelayee === 'accueil' ? '' : routeRelayee);

    // Compatibilité silencieuse avec d’anciens favoris locaux : on sait encore les lire,
    // mais l’adresse est immédiatement réécrite sans # par restaurerRoute().
    if (location.hash && /^#(?:accueil|parcours|carnet|entrainement|erreurs|sigles|sigles-revision|supports|progression|parametres|question|bilan)(?:\/|$)/.test(location.hash))
        return lireRouteDepuisFragment();

    if (utiliserNavigationLocaleSansServeur())
        return { pjjoue: true, ecran: 'accueil' };

    let chemin = location.pathname;
    const base = URL_RACINE_APPLICATION.pathname.endsWith('/')
        ? URL_RACINE_APPLICATION.pathname
        : URL_RACINE_APPLICATION.pathname + '/';
    if (chemin.startsWith(base))
        chemin = chemin.slice(base.length);
    return lireRouteDepuisChemin(chemin);
}
function restaurerRoute(route) {
    const etatRoute = route?.pjjoue ? route : lireRoute();
    if (etatRoute.theme)
        etat.theme = etatRoute.theme;
    if (etatRoute.etape)
        etat.etape = Number(etatRoute.etape);
    restaurationNavigation = true;
    if (etatRoute.ecran === 'question') {
        if (restaurerSessionEnCours()) {
            afficherEcran('question', { depuisHistorique: true, forcerSortieQuestion: true });
            afficherQuestion({ suivreAnalytics: false, reprendreChronometre: true });
        }
        else {
            ouvrirParcours(etatRoute.theme || 'commun', { remplacerHistorique: true });
        }
    }
    else if (etatRoute.ecran === 'parcours') {
        if (etatRoute.theme)
            ouvrirParcours(etatRoute.theme);
        else
            ouvrirChoixParcours({ depuisHistorique: true, forcerSortieQuestion: true });
    }
    else if (etatRoute.ecran === 'bilan') {
        if (etat.questionsSession?.length)
            afficherEcran('bilan', { depuisHistorique: true, forcerSortieQuestion: true });
        else
            afficherEcran('accueil', { depuisHistorique: true, forcerSortieQuestion: true, remplacerHistorique: true });
    }
    else
        afficherEcran(etatRoute.ecran || 'accueil', { depuisHistorique: true, forcerSortieQuestion: true });
    restaurationNavigation = false;
    mettreAJourAdresseNavigation(etat.ecran, true);
}
window.addEventListener('hashchange', () => {
    if (restaurationNavigation || navigationLocaleEnCours || !window.location.hash)
        return;
    restaurerRoute(lireRouteDepuisFragment());
});
window.addEventListener('popstate', evenement => {
    if (navigationLocaleEnCours)
        return;
    if (etat.ecran === 'question' && etat.questionsSession?.length) {
        history.forward();
        ouvrirFenetreQuitterSession({
            message: 'Les réponses déjà données restent enregistrées, mais la session en cours sera interrompue.',
            apresConfirmation: () => {
                clearInterval(etat.identifiantMinuteur);
                etat.identifiantMinuteur = null;
                etat.questionsSession = [];
                etat.questionCourante = null;
                etat.questionValidee = false;
                effacerSessionEnCours();
                history.back();
            }
        });
        return;
    }
    restaurerRoute(evenement.state);
});
// -----------------------------------------------------------------------------
// Progression du parcours et affichage des étapes
// -----------------------------------------------------------------------------
function obtenirEtapesProgramme(identifiantTheme) {
    return PROGRAMMES[identifiantTheme]?.etapes || [];
}
function obtenirEtapeProgramme(identifiantTheme, identifiantEtape) {
    return obtenirEtapesProgramme(identifiantTheme).find(
        etapeProgramme => etapeProgramme.id === Number(identifiantEtape)
    );
}
function obtenirProgressionApprenant() { return 'apprenant'; }
function initialiserProgression(theme) {
    const proprietaire = obtenirProgressionApprenant();
    sauvegarde.progression[proprietaire] = sauvegarde.progression[proprietaire] || {};
    sauvegarde.progression[proprietaire][theme] = sauvegarde.progression[proprietaire][theme] || {};
    obtenirEtapesProgramme(theme).forEach(etapeProgramme => {
        const progressionExistante = sauvegarde.progression[proprietaire][theme][etapeProgramme.id] || {};
        const progressionEtape = {
            meilleurScore: 0,
            nombreTentatives: 0,
            deverrouillee: true,
            questionsTraitees: {},
            resultats: {},
            validationsSansJoker: {},
            celebrationSansJokerAffichee: false,
            termineeSansJoker: false,
            jokersUtilises: true,
            ...progressionExistante
        };
        progressionEtape.questionsTraitees = progressionEtape.questionsTraitees || {};
        progressionEtape.resultats = progressionEtape.resultats || {};
        progressionEtape.validationsSansJoker = progressionEtape.validationsSansJoker || {};
        progressionEtape.celebrationSansJokerAffichee = progressionEtape.celebrationSansJokerAffichee === true;
        sauvegarde.progression[proprietaire][theme][etapeProgramme.id] = progressionEtape;
    });
}
function obtenirBilanEtape(theme, etape) {
    initialiserProgression(theme);
    return sauvegarde.progression[obtenirProgressionApprenant()][theme][etape];
}
function obtenirSeuilMaitrise() { return 90; }
function obtenirQuestionsEtape(identifiantTheme, etape) {
    return QUESTIONS.filter(
        question => question.theme === identifiantTheme && question.etape === Number(etape)
    );
}
function compterQuestionsTraiteesEtape(identifiantTheme, etape) {
    const nombreTraitees = obtenirBilanEtape(identifiantTheme, etape)?.questionsTraitees || {};
    return obtenirQuestionsEtape(identifiantTheme, etape).filter(question => nombreTraitees[question.id]).length;
}
function obtenirQuestionsChapitre(identifiantTheme, etape, chapitre) {
    return obtenirQuestionsEtape(identifiantTheme, etape).filter(question =>
        (Number(question.chapitre) || 1) === Number(chapitre)
    );
}
function determinerProchainChapitre(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    for (let chapitre = 1; chapitre <= 5; chapitre++) {
        const questionsChapitre = obtenirQuestionsChapitre(identifiantTheme, etape, chapitre);
        const contientQuestionNonTraitee = questionsChapitre.some(question => !bilanEtape.questionsTraitees?.[question.id]);
        if (contientQuestionNonTraitee)
            return chapitre;
    }
    let chapitreARevoir = 1;
    let scoreLePlusFaible = Infinity;
    for (let chapitre = 1; chapitre <= 5; chapitre++) {
        const questionsChapitre = obtenirQuestionsChapitre(identifiantTheme, etape, chapitre);
        const scoreChapitre = questionsChapitre.length
            ? questionsChapitre.filter(question => bilanEtape.resultats?.[question.id] === true).length / questionsChapitre.length
            : 1;
        if (scoreChapitre < scoreLePlusFaible) {
            scoreLePlusFaible = scoreChapitre;
            chapitreARevoir = chapitre;
        }
    }
    return chapitreARevoir;
}
function etapeNecessiteAutreChapitre(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    return obtenirQuestionsEtape(identifiantTheme, etape).some(question => !bilanEtape.questionsTraitees?.[question.id]);
}
function estEtapeMaitrisee(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    const questionsEtape = obtenirQuestionsEtape(identifiantTheme, etape);
    return Boolean(bilanEtape)
        && questionsEtape.length > 0
        && questionsEtape.every(question => bilanEtape.questionsTraitees?.[question.id])
        && bilanEtape.termineeSansJoker === true;
}
function synchroniserEtapesReussiesEnAutonomie(programme) {
    let validationCorrigee = false;
    programme.etapes.forEach(etapeProgramme => {
        const questionsEtape = obtenirQuestionsEtape(programme.id, etapeProgramme.id);
        const bilanEtape = obtenirBilanEtape(programme.id, etapeProgramme.id);
        const toutesReussiesEnAutonomie = questionsEtape.length > 0
            && questionsEtape.every(question => bilanEtape.resultats?.[question.id] === true);
        if (!toutesReussiesEnAutonomie || bilanEtape.termineeSansJoker === true)
            return;
        bilanEtape.termineeSansJoker = true;
        bilanEtape.jokersUtilises = false;
        validationCorrigee = true;
    });
    if (validationCorrigee)
        enregistrerSauvegarde();
}
function compterReussitesAutonomesEtape(identifiantTheme, numeroEtape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, numeroEtape);
    return obtenirQuestionsEtape(identifiantTheme, numeroEtape)
        .filter(question => bilanEtape?.resultats?.[question.id] === true)
        .length;
}
function reinitialiserValidationSansJokerEtape(identifiantTheme, numeroEtape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, numeroEtape);
    const questionsEtape = obtenirQuestionsEtape(identifiantTheme, numeroEtape);
    if (!bilanEtape || !questionsEtape.length)
        return;
    questionsEtape.forEach(question => {
        delete bilanEtape.resultats[question.id];
        delete bilanEtape.validationsSansJoker?.[question.id];
    });
    bilanEtape.celebrationSansJokerAffichee = false;
    bilanEtape.termineeSansJoker = false;
    bilanEtape.jokersUtilises = true;
    enregistrerSauvegarde();
    actualiserSuiviEtapeQuestion(etat.questionCourante);
    actualiserAccueil();
}
function compterErreursActives() {
    return Object.values(sauvegarde.erreurs || {}).filter(erreur => !erreur.maitrisee).length;
}
function compterEtapesMaitrisees() {
    let nombreEtapesMaitrisees = 0;
    THEMES.forEach(theme => {
        obtenirEtapesProgramme(theme.id).forEach(etapeProgramme => {
            if (estEtapeMaitrisee(theme.id, etapeProgramme.id))
                nombreEtapesMaitrisees++;
        });
    });
    return nombreEtapesMaitrisees;
}
function marquerQuestionJouee(question) {
    if (!question || !question.id)
        return;
    sauvegarde.questionsJouees = sauvegarde.questionsJouees || {};
    sauvegarde.questionsJouees[String(question.id)] = true;
}
function marquerEtapeDecouverte(question) {
    if (!question)
        return;
    const etape = Number(question.etape);
    const theme = question.theme;
    if (!estThemeConnu(theme) || !Number.isFinite(etape) || etape < 1 || !obtenirEtapeProgramme(theme, etape))
        return;
    sauvegarde.etapesDecouvertes = sauvegarde.etapesDecouvertes || {};
    sauvegarde.etapesDecouvertes[`${theme}:${etape}`] = true;
}
function compterEtapesDecouvertes() {
    const etapes = new Set();
    const ajouterQuestion = question => {
        if (!question || question.estEvaluationFinale === true)
            return;
        const etape = Number(question.etape);
        if (estThemeConnu(question.theme) && Number.isFinite(etape))
            etapes.add(`${question.theme}:${etape}`);
    };
    Object.keys(sauvegarde.questionsJouees || {}).forEach(identifiant => {
        if (sauvegarde.questionsJouees[identifiant])
            ajouterQuestion(QUESTIONS.find(element => String(element.id) === String(identifiant)));
    });
    Object.keys(sauvegarde.erreurs || {}).forEach(identifiant =>
        ajouterQuestion(QUESTIONS.find(element => String(element.id) === String(identifiant)))
    );
    THEMES.forEach(theme => {
        obtenirEtapesProgramme(theme.id).forEach(etapeProgramme => {
            if ((Number(compterQuestionsTraiteesEtape(theme.id, etapeProgramme.id)) || 0) > 0)
                etapes.add(`${theme.id}:${etapeProgramme.id}`);
        });
    });
    Object.entries(sauvegarde.etapesDecouvertes || {}).forEach(([cle, actif]) => {
        if (actif === true && cle.includes(':'))
            etapes.add(cle);
    });
    return etapes.size;
}
function estProgrammeMaitrise(identifiantTheme) {
    const programme = PROGRAMMES[identifiantTheme];
    return Boolean(programme?.etapes?.length)
        && programme.etapes.every(etapeProgramme => estEtapeMaitrisee(identifiantTheme, etapeProgramme.id));
}
function obtenirEvaluationFinaleTheme(identifiantTheme) {
    sauvegarde.evaluationsFinales = sauvegarde.evaluationsFinales || creerEvaluationsFinalesInitiales();
    sauvegarde.evaluationsFinales[identifiantTheme] = sauvegarde.evaluationsFinales[identifiantTheme] || creerEtatEvaluationFinale();
    return sauvegarde.evaluationsFinales[identifiantTheme];
}
function estEvaluationFinaleReussie(identifiantTheme) {
    return obtenirEvaluationFinaleTheme(identifiantTheme)?.reussie === true;
}
function estParcoursCompletReussi() {
    return THEMES.every(theme => estProgrammeMaitrise(theme.id) && estEvaluationFinaleReussie(theme.id));
}
function obtenirProchainThemeIncomplet() {
    return THEMES.find(theme => !estProgrammeMaitrise(theme.id) || !estEvaluationFinaleReussie(theme.id))?.id || null;
}
function accorderLibelle(nombre, singulier, pluriel) {
    return Number(nombre) === 1 ? singulier : pluriel;
}
function actualiserLibellesProgression() {
    const experience = selectionner('#experienceProgression');
    if (experience) {
        const nombreDecouvertes = Number((experience.textContent || '').match(/\d+/)?.[0] || 0);
        experience.textContent = String(nombreDecouvertes);
        const libelleExperience = experience.parentElement?.querySelector(':scope > span');
        if (libelleExperience)
            libelleExperience.textContent = accorderLibelle(nombreDecouvertes, 'Étape abordée', 'Étapes abordées');
    }
    const configurations = [
        ['questionsJoueesProgression', 'Question travaillée', 'Questions travaillées'],
        ['erreursProgression', 'Question à revoir', 'Questions à revoir'],
        ['etapesMaitriseesProgression', 'Étape maîtrisée', 'Étapes maîtrisées']
    ];
    configurations.forEach(([identifiant, singulier, pluriel]) => {
        const valeur = selectionner('#' + identifiant);
        const libelle = valeur?.parentElement?.querySelector('span');
        if (valeur && libelle)
            libelle.textContent = accorderLibelle(Number(valeur.textContent) || 0, singulier, pluriel);
    });
}
function actualiserAccueil() {
    Object.values(PROGRAMMES).forEach(programme => synchroniserEtapesReussiesEnAutonomie(programme));
    const experience = selectionner('#experienceProgression');
    const jouees = selectionner('#questionsJoueesProgression');
    const erreurs = selectionner('#erreursProgression');
    const maitrisees = selectionner('#etapesMaitriseesProgression');
    const decouvertes = compterEtapesDecouvertes();
    if (experience)
        experience.textContent = String(decouvertes);
    if (jouees)
        jouees.textContent = String(sauvegarde.nombreQuestionsJouees || 0);
    if (erreurs)
        erreurs.textContent = String(compterErreursActives());
    if (maitrisees)
        maitrisees.textContent = String(compterEtapesMaitrisees());
    actualiserLibellesProgression();
    actualiserBoutonCommencer();
    const boutonEntrainementLibreAccueil = selectionner('#boutonEntrainementLibreAccueil');
    if (boutonEntrainementLibreAccueil)
        boutonEntrainementLibreAccueil.hidden = sauvegarde.aDejaJoue !== true;
    chargerParametres();
}
function calculerProgressionTheme(identifiantTheme) {
    initialiserProgression(identifiantTheme);
    const questionsTheme = QUESTIONS.filter(
        question => question.theme === identifiantTheme && !question.estEvaluationFinale
    );
    if (!questionsTheme.length)
        return 0;
    let nombreQuestionsTraitees = 0;
    obtenirEtapesProgramme(identifiantTheme).forEach(etapeProgramme => {
        nombreQuestionsTraitees += compterQuestionsTraiteesEtape(identifiantTheme, etapeProgramme.id);
    });
    return Math.round(nombreQuestionsTraitees / questionsTheme.length * 100);
}
function obtenirTitreSymboliqueParcours(nombreEtapesMaitrisees) {
    if (nombreEtapesMaitrisees >= 22)
        return 'Éclaireur complet de la PJJ';
    if (nombreEtapesMaitrisees >= 17)
        return 'Guide du parcours judiciaire';
    if (nombreEtapesMaitrisees >= 11)
        return 'Éclaireur de la PJJ';
    if (nombreEtapesMaitrisees >= 7)
        return 'Guide en devenir';
    if (nombreEtapesMaitrisees >= 4)
        return 'Connaisseur du parcours';
    if (nombreEtapesMaitrisees >= 1)
        return 'Explorateur de la PJJ';
    return 'Nouveau départ';
}
function obtenirEtapeAReprendre(programme) {
    return programme.etapes.find(etapeProgramme => {
        const nombreQuestions = obtenirQuestionsEtape(programme.id, etapeProgramme.id).length;
        const nombreQuestionsTraitees = compterQuestionsTraiteesEtape(programme.id, etapeProgramme.id);
        const bilanEtape = obtenirBilanEtape(programme.id, etapeProgramme.id);
        return nombreQuestionsTraitees < nombreQuestions || bilanEtape.termineeSansJoker !== true;
    }) || null;
}
function obtenirProchaineActionParcoursComplet() {
    for (const theme of THEMES) {
        const programme = PROGRAMMES[theme.id];
        const etapeAReprendre = obtenirEtapeAReprendre(programme);
        if (etapeAReprendre)
            return { type: 'etape', theme: theme.id, etape: etapeAReprendre };
        if (!estEvaluationFinaleReussie(theme.id))
            return { type: 'evaluation', theme: theme.id };
    }
    return { type: 'carnet' };
}
function actualiserBoutonCommencer() {
    const bouton = selectionner('#boutonCommencer');
    if (!bouton)
        return;
    const action = obtenirProchaineActionParcoursComplet();
    const aucuneQuestionTraitee = THEMES.every(theme =>
        obtenirEtapesProgramme(theme.id).every(etape => compterQuestionsTraiteesEtape(theme.id, etape.id) === 0)
    );
    if (aucuneQuestionTraitee) {
        bouton.innerHTML = 'Choisir mon parcours <span aria-hidden="true">→</span>';
        bouton.onclick = () => ouvrirChoixParcours();
        return;
    }
    if (action.type === 'etape') {
        const numeroParcours = obtenirOrdreTheme(action.theme) + 1;
        bouton.innerHTML = `Reprendre le parcours ${numeroParcours} · étape ${action.etape.id} <span aria-hidden="true">→</span>`;
        bouton.onclick = () => ouvrirParcours(action.theme);
        return;
    }
    if (action.type === 'evaluation') {
        const numeroParcours = obtenirOrdreTheme(action.theme) + 1;
        bouton.innerHTML = `Passer l’évaluation du parcours ${numeroParcours} <span aria-hidden="true">→</span>`;
        bouton.onclick = () => ouvrirParcours(action.theme);
        return;
    }
    bouton.innerHTML = 'Voir mon carnet complet <span aria-hidden="true">→</span>';
    bouton.onclick = () => afficherEcran('carnet');
}
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
        titre: 'Du parquet à la sanction',
        chapitre: 'Procédure ordinaire',
        description: 'Suis le dossier depuis l’orientation du parquet jusqu’au jugement et à la sanction.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 40',
        couleur: '#d49a00',
        couleurTexte: '#ffd36a',
        couleurRgb: '212,154,0'
    },
    information_judiciaire: {
        numero: '03',
        titre: 'Comprendre l’information judiciaire',
        chapitre: 'Instruction',
        description: 'Repère le rôle du JI, du JLD et les principales décisions provisoires pendant l’instruction.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 45',
        couleur: '#0891b2',
        couleurTexte: '#70d7ea',
        couleurRgb: '8,145,178'
    },
    jugement_educatif_ordinaire: {
        numero: '04',
        titre: 'Juger et construire la réponse éducative',
        chapitre: 'Jugement éducatif',
        description: 'Comprends le rôle du JE et du TPE, les mesures éducatives et les réponses ordinaires.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 45',
        couleur: '#8b5cf6',
        couleurTexte: '#c7afff',
        couleurRgb: '139,92,246'
    },
    matiere_criminelle_peines: {
        numero: '05',
        titre: 'Crimes, sanctions et peines',
        chapitre: 'Matière criminelle',
        description: 'Distingue les juridictions compétentes et les sanctions ou peines applicables aux mineurs.',
        niveau: 'Avancé',
        duree: '≈ 1 h 50',
        couleur: '#e11d48',
        couleurTexte: '#ff91a8',
        couleurRgb: '225,29,72'
    },
    application_execution_peines: {
        numero: '06',
        titre: 'De la décision à l’exécution',
        chapitre: 'Application des peines',
        description: 'Suis la décision après le jugement : exécution, aménagements, incidents et articulation JE / JAP.',
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
function calculerProgressionParcours(identifiantTheme) {
    const programme = PROGRAMMES[identifiantTheme];
    if (!programme)
        return { maitrisees: 0, total: 0, pourcentage: 0 };
    synchroniserEtapesReussiesEnAutonomie(programme);
    const maitrisees = programme.etapes.filter(etapeProgramme => estEtapeMaitrisee(identifiantTheme, etapeProgramme.id)).length;
    const total = programme.etapes.length;
    return { maitrisees, total, pourcentage: total ? Math.round(maitrisees / total * 100) : 0 };
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
        const statut = progression.pourcentage === 100 ? 'Terminé' : progression.pourcentage > 0 ? 'En cours' : 'À découvrir';
        bouton.type = 'button';
        const estDernierParcours = theme.id === THEMES[THEMES.length - 1].id;
        bouton.className = `selecteur-parcours-bouton${theme.id === 'commun' ? ' parcours-recommande' : ''}${estDernierParcours ? ' parcours-cloture' : ''}`;
        bouton.dataset.theme = theme.id;
        bouton.style.setProperty('--parcours-accent', identite.couleur);
        bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
        bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        bouton.setAttribute('aria-label', `${identite.titre}. ${progression.maitrisees} étapes maîtrisées sur ${progression.total}.`);
        bouton.innerHTML = `
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
        carte.setAttribute('aria-label', `Étape ${etapeProgramme.id} — ${etapeProgramme.titre} — ${nombreTraitees} questions réalisées sur ${total}`);
        carte.innerHTML = `
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
function synchroniserCurseurNombreQuestions(nombreMax = null) {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const sortie = selectionner('#valeurNombreQuestions');
    const borne = selectionner('#borneMaxQuestions');
    if (!selectNombre || !curseur)
        return;
    const max = Number(nombreMax) || Number(curseur.max) || 660;
    curseur.max = String(max);
    const valeur = Math.min(max, Math.max(10, Number(selectNombre.value) || 10));
    curseur.value = String(valeur);
    if (sortie)
        sortie.textContent = `${valeur} question${valeur === 1 ? '' : 's'}`;
    if (borne)
        borne.textContent = `${max} max`;
}
function initialiserCurseurNombreQuestions() {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const groupe = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (!selectNombre || !curseur || curseur.dataset.initialise === 'true')
        return;
    curseur.dataset.initialise = 'true';
    if (groupe)
        groupe.dataset.selectionEffectuee = 'true';
    curseur.oninput = () => {
        const valeur = Number(curseur.value) || 10;
        selectNombre.value = String(valeur);
        groupe?.setAttribute('data-selection-effectuee', 'true');
        groupe?.querySelectorAll('.choix-bouton').forEach(bouton => {
            const actif = Number(bouton.dataset.valeur) === valeur;
            bouton.classList.toggle('actif', actif);
            bouton.classList.toggle('selectionne', actif);
            bouton.setAttribute('aria-pressed', String(actif));
        });
        synchroniserCurseurNombreQuestions();
    };
    const positionnerCurseurAuPointeur = evenement => {
        if (evenement.button !== undefined && evenement.button !== 0)
            return;
        const limites = curseur.getBoundingClientRect();
        if (!limites.width)
            return;
        const minimum = Number(curseur.min) || 10;
        const maximum = Number(curseur.max) || 660;
        const pas = Number(curseur.step) || 10;
        const proportion = Math.min(1, Math.max(0, (evenement.clientX - limites.left) / limites.width));
        const valeurBrute = minimum + proportion * (maximum - minimum);
        const valeur = Math.min(maximum, Math.max(minimum, minimum + Math.round((valeurBrute - minimum) / pas) * pas));
        if (Number(curseur.value) !== valeur) {
            curseur.value = String(valeur);
            curseur.oninput();
        }
    };
    curseur.addEventListener('pointerdown', positionnerCurseurAuPointeur);
    synchroniserCurseurNombreQuestions();
}
function appliquerCouleursParcoursEntrainement() {
    const groupe = document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    if (!groupe)
        return;
    if (etat.contexteEntrainement === 'sigles') {
        groupe.querySelectorAll('.choix-bouton[data-valeur]').forEach(bouton => {
            const numero = Number(bouton.dataset.valeur);
            if (!Number.isFinite(numero) || numero < 1 || numero > 6)
                return;
            const identite = obtenirIdentiteEtapeMissionSigles(numero);
            bouton.style.setProperty('--parcours-accent', identite.couleur);
            bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
            bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        });
        return;
    }
    groupe.querySelectorAll('.choix-bouton[data-valeur]').forEach(bouton => {
        const theme = bouton.dataset.valeur;
        if (!theme || theme === 'tous')
            return;
        const identite = obtenirIdentiteParcours(theme);
        bouton.style.setProperty('--parcours-accent', identite.couleur);
        bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte || identite.couleur);
        bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
    });
}

function actualiserLimiteQuestionsEntrainement() {
    const selectPerimetre = selectionner('#perimetreEntrainement');
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const groupeNombre = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (!selectPerimetre || !selectNombre || !groupeNombre)
        return;
    if (etat.contexteEntrainement === 'sigles') {
        const perimetre = selectPerimetre.value || 'tous';
        const reserve = obtenirPoolEntrainementMissionSigles(perimetre);
        const nombreMax = reserve.length;
        const libellePerimetre = perimetre === 'tous' ? 'Mission Sigles complète' : `l’étape ${Number(perimetre)}`;
        const boutons = [...groupeNombre.querySelectorAll('.choix-bouton')];
        boutons.forEach((bouton, index) => {
            if (index === 3) {
                bouton.dataset.valeur = String(nombreMax);
                bouton.textContent = 'Tous';
            }
            const valeur = Number(bouton.dataset.valeur);
            const disponible = valeur <= nombreMax;
            bouton.hidden = !disponible;
            bouton.disabled = !disponible;
        });
        let nombreSelectionne = Math.min(nombreMax, Math.max(1, Number(selectNombre.value) || 10));
        if (nombreSelectionne > nombreMax || ![...selectNombre.options].some(option => Number(option.value) === nombreSelectionne))
            nombreSelectionne = Math.min(10, nombreMax);
        selectNombre.value = String(nombreSelectionne);
        groupeNombre.querySelectorAll('.choix-bouton:not([hidden])').forEach(bouton => {
            const actif = Number(bouton.dataset.valeur) === nombreSelectionne;
            bouton.classList.toggle('actif', actif);
            bouton.classList.toggle('selectionne', actif);
            bouton.setAttribute('aria-pressed', String(actif));
        });
        const curseur = selectionner('#curseurNombreQuestions');
        if (curseur) {
            curseur.min = String(Math.min(10, nombreMax));
            curseur.max = String(nombreMax);
            curseur.step = '1';
            curseur.value = String(nombreSelectionne);
        }
        const resume = selectionner('#limiteQuestionsEntrainement');
        if (resume)
            resume.textContent = `${nombreMax} sigles disponibles dans ${libellePerimetre}.`;
        synchroniserCurseurNombreQuestions(nombreMax);
        return;
    }
    const perimetre = selectPerimetre.value || 'tous';
    const reserve = obtenirQuestionsEntrainement(perimetre);
    const nombreMax = reserve.length;
    const libellePerimetre = perimetre === 'tous'
        ? 'le parcours complet'
        : `le parcours ${obtenirOrdreTheme(perimetre) + 1}`;
    Array.from(selectNombre.options).forEach(option => {
        const disponible = Number(option.value) <= nombreMax;
        option.disabled = !disponible;
        option.hidden = !disponible;
    });
    groupeNombre.querySelectorAll('.choix-bouton').forEach(bouton => {
        const disponible = Number(bouton.dataset.valeur) <= nombreMax;
        bouton.hidden = !disponible;
        bouton.disabled = !disponible;
    });
    let nombreSelectionne = Number(selectNombre.value) || 10;
    if (nombreSelectionne > nombreMax) {
        nombreSelectionne = nombreMax;
        selectNombre.value = String(nombreMax);
        groupeNombre.dataset.selectionEffectuee = 'true';
    }
    groupeNombre.querySelectorAll('.choix-bouton:not([hidden])').forEach(bouton => {
        const actif = groupeNombre.dataset.selectionEffectuee === 'true'
            && Number(bouton.dataset.valeur) === nombreSelectionne;
        bouton.classList.toggle('actif', actif);
        bouton.classList.toggle('selectionne', actif);
        bouton.setAttribute('aria-pressed', String(actif));
    });
    const resume = selectionner('#limiteQuestionsEntrainement');
    if (resume)
        resume.textContent = `${nombreMax} questions d’apprentissage disponibles dans ${libellePerimetre}.`;
    synchroniserCurseurNombreQuestions(nombreMax);
}
function initialiserGroupesChoix() {
    selectionnerTous('[data-groupe-choix]').forEach(groupe => {
        const listeDeroulante = selectionner('#' + groupe.dataset.groupeChoix);
        groupe.setAttribute('role', 'group');
        groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
            bouton.setAttribute('aria-pressed', 'false');
            bouton.onclick = () => {
                listeDeroulante.value = bouton.dataset.valeur;
                groupe.dataset.selectionEffectuee = 'true';
                groupe.querySelectorAll('.choix-bouton').forEach(proposition => {
                    const actif = proposition === bouton;
                    proposition.classList.toggle('actif', actif);
                    proposition.classList.toggle('selectionne', actif);
                    proposition.setAttribute('aria-pressed', String(actif));
                });
                if (listeDeroulante.id === 'perimetreEntrainement')
                    actualiserLimiteQuestionsEntrainement();
                if (listeDeroulante.id === 'echelleTexte' || listeDeroulante.id === 'sonActif')
                    enregistrerParametres();
            };
        });
    });
    appliquerCouleursParcoursEntrainement();
    initialiserCurseurNombreQuestions();
}
function actualiserGroupesChoix() {
    selectionnerTous('[data-groupe-choix]').forEach(groupe => {
        const listeDeroulante = selectionner('#' + groupe.dataset.groupeChoix);
        if (!listeDeroulante)
            return;
        const attendSelectionUtilisateur = groupe.dataset.selectionVisuelle === 'au-clic'
            && groupe.dataset.selectionEffectuee !== 'true';
        groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
            const actif = !attendSelectionUtilisateur
                && String(bouton.dataset.valeur) === String(listeDeroulante.value);
            bouton.classList.toggle('actif', actif);
            bouton.classList.toggle('selectionne', actif);
            bouton.setAttribute('aria-pressed', String(actif));
        });
    });
    appliquerCouleursParcoursEntrainement();
    actualiserLimiteQuestionsEntrainement();
}
// -----------------------------------------------------------------------------
// Sélection des questions et préparation des sessions
// -----------------------------------------------------------------------------
function filtrerQuestions(filtre) { return QUESTIONS.filter(filtre); }
function selectionnerQuestionsEquilibrees(reserve, nombre) {
    const groupes = {};
    reserve.forEach(question => {
        const cle = `${question.theme}-${question.etape}`;
        (groupes[cle] = groupes[cle] || []).push(question);
    });
    let cles = melanger(Object.keys(groupes));
    const resultat = [];
    for (let tour = 0; tour < 3 && resultat.length < nombre; tour++) {
        for (const cle of cles) {
            const groupe = melanger(groupes[cle]);
            const question = groupe[tour % groupe.length];
            if (question && !resultat.some(element => element.id === question.id))
                resultat.push(question);
            if (resultat.length >= nombre)
                break;
        }
        cles = melanger(cles);
    }
    if (resultat.length < nombre) {
        for (const question of melanger(reserve)) {
            if (!resultat.some(element => element.id === question.id))
                resultat.push(question);
            if (resultat.length >= nombre)
                break;
        }
    }
    return resultat.slice(0, nombre);
}
function obtenirOrdrePedagogiqueQuestion(question) {
    const ordreExplicite = Number(question?.ordreEtape);
    if (Number.isFinite(ordreExplicite) && ordreExplicite > 0)
        return ordreExplicite;
    const identifiant = Number(question?.id) || 0;
    const etape = Number(question?.etape) || 1;
    return identifiant - ((etape - 1) * 10);
}
function ordonnerQuestionsParcours(reserve) {
    return [...reserve].sort((questionA, questionB) => (Number(questionA.chapitre) || 1) - (Number(questionB.chapitre) || 1) ||
        obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB) ||
        (Number(questionA.id) || 0) - (Number(questionB.id) || 0));
}
function classerLongueurReponse(question) {
    if (question.activite)
        return 'equilibree';
    const textes = [raccourcirTexteReponse(question.bonneReponse), ...question.mauvaisesReponses.map(raccourcirTexteReponse)];
    const longueurBonneReponse = textes[0].length, mauvaises = textes.slice(1).map(texte => texte.length);
    const longueurMaxMauvaises = Math.max(...mauvaises), longueurMinMauvaises = Math.min(...mauvaises);
    const manifestementLongue = longueurBonneReponse > longueurMaxMauvaises + 14 && longueurBonneReponse > longueurMaxMauvaises * 1.18;
    const manifestementCourte = longueurBonneReponse + 14 < longueurMinMauvaises && longueurBonneReponse * 1.18 < longueurMinMauvaises;
    return manifestementLongue ? 'longue' : manifestementCourte ? 'courte' : 'equilibree';
}
function selectionnerSansIndiceLongueur(reserve, nombre, { conserverOrdre = false } = {}) {
    if (nombre >= reserve.length)
        return conserverOrdre ? [...reserve] : melanger([...reserve]);
    const source = conserverOrdre ? [...reserve] : melanger([...reserve]);
    const limite = Math.max(1, Math.floor(nombre * 0.27));
    const choisis = [], reportees = [];
    let longues = 0, courtes = 0;
    for (const question of source) {
        const categorieLongueur = classerLongueurReponse(question);
        if (categorieLongueur === 'longue' && longues >= limite) {
            reportees.push(question);
            continue;
        }
        if (categorieLongueur === 'courte' && courtes >= limite) {
            reportees.push(question);
            continue;
        }
        choisis.push(question);
        if (categorieLongueur === 'longue')
            longues++;
        if (categorieLongueur === 'courte')
            courtes++;
        if (choisis.length === nombre)
            break;
    }
    if (choisis.length < nombre) {
        for (const question of reportees) {
            choisis.push(question);
            if (choisis.length === nombre)
                break;
        }
    }
    return choisis;
}
function obtenirQuestionsSessionEtape(identifiantTheme, etape, chapitre) {
    const questionsEtape = filtrerQuestions(question => question.theme === identifiantTheme && question.etape === Number(etape));
    if (questionsEtape.length >= 20)
        return questionsEtape.filter(question => (Number(question.chapitre) || 1) === Number(chapitre));
    return questionsEtape;
}
function lancerEtape(identifiantTheme, etape, chapitre = null) {
    // Une étape demandée explicitement remplace toute ancienne session mémorisée.
    // Cela évite qu'une session précédente intercepte l'ouverture de la nouvelle étape.
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.questionsSession = [];
    etat.questionCourante = null;
    etat.questionValidee = false;
    effacerSessionEnCours();
    etat.theme = identifiantTheme;
    etat.etape = Number(etape);
    etat.etapeAvecJoker = false;
    etat.chapitre = Number(chapitre) || determinerProchainChapitre(identifiantTheme, etape);
    etat.mode = 'parcours';
    etat.origineSessionAnalytics = 'parcours_pjj';
    etat.organisationSession = 'melange';
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = !!etat.chronometreParcoursActif;
    const secondesParcoursActives = Number(document.querySelector('#secondesChronometreParcours .choix-bouton.actif')?.dataset.secondes);
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number.isFinite(secondesParcoursActives)
        ? secondesParcoursActives
        : (Number(etat.dureeChronometreParcours) || 15)));
    etat.dureeChronometreParcours = etat.dureeChronometreSession;
    const reserve = obtenirQuestionsSessionEtape(identifiantTheme, etape, etat.chapitre);
    lancerSession(ordonnerQuestionsParcours(reserve));
}
function obtenirQuestionsEvaluationFinale(identifiantTheme = etat.theme || 'commun') {
    return QUESTIONS
        .filter(question => question.estEvaluationFinale === true && question.theme === identifiantTheme)
        .sort((questionA, questionB) =>
            obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB)
            || questionA.id - questionB.id
        );
}
function lancerEvaluationFinale(identifiantTheme = etat.theme || sauvegarde.dernierTheme || 'commun') {
    if (!PROGRAMMES[identifiantTheme])
        identifiantTheme = 'commun';
    const session = obtenirQuestionsEvaluationFinale(identifiantTheme);
    if (session.length !== 50) {
        afficherNotification('L’évaluation finale de ce parcours est indisponible : banque incomplète.');
        return;
    }
    etat.theme = identifiantTheme;
    etat.etape = 12;
    etat.chapitre = 1;
    etat.mode = 'evaluation-finale';
    etat.origineSessionAnalytics = 'evaluation_finale';
    etat.organisationSession = 'ordonne';
    etat.jokersSessionActifs = false;
    etat.chronometreSessionActif = false;
    lancerSession(session);
}
function obtenirQuestionsEntrainement(perimetre = 'tous') {
    const reserve = QUESTIONS.filter(question => !question.estEvaluationFinale);
    if (perimetre === 'tous')
        return reserve;
    return reserve.filter(question => question.theme === perimetre);
}
function obtenirOrdreTheme(identifiantTheme) {
    const index = THEMES.findIndex(theme => theme.id === identifiantTheme);
    return index < 0 ? 999 : index;
}
function lancerEntrainementLibre() {
    if (etat.contexteEntrainement === 'sigles') {
        lancerEntrainementMissionSiglesNatif();
        return;
    }
    etat.mode = 'libre';
    etat.origineSessionAnalytics = 'entrainement_libre';
    const perimetre = selectionner('#perimetreEntrainement')?.value || etat.perimetreEntrainement || 'tous';
    etat.perimetreEntrainement = perimetre;
    etat.theme = perimetre === 'tous' ? null : perimetre;
    const style = etat.organisationSession || 'ordonne';
    const reserve = obtenirQuestionsEntrainement(perimetre);
    const nombreMax = reserve.length;
    const nombre = Math.min(nombreMax, Math.max(10, Number(selectionner('#nombreQuestionsEntrainement')?.value) || 10));
    let session = [];
    if (style === 'ordonne') {
        session = [...reserve]
            .sort((questionA, questionB) =>
                obtenirOrdreTheme(questionA.theme) - obtenirOrdreTheme(questionB.theme)
                || (Number(questionA.etape) || 0) - (Number(questionB.etape) || 0)
                || obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB)
                || (Number(questionA.id) || 0) - (Number(questionB.id) || 0))
            .slice(0, nombre);
    }
    else {
        const candidats = selectionnerQuestionsEquilibrees(reserve, Math.min(reserve.length, Math.max(nombre, nombre * 4)));
        session = selectionnerSansIndiceLongueur(candidats, Math.min(nombre, candidats.length));
    }
    lancerSession(session);
}
function lancerDeParcours() {
    const face = selectionner('#faceDeParcours');
    const resultat = selectionner('#resultatDeParcours');
    const boutonLancer = selectionner('#boutonLancerLeDe');
    const boutonJouer = selectionner('#boutonJouerLeTirage');
    if (!face || !resultat || !boutonLancer || !boutonJouer)
        return;
    const nombreTire = Math.floor(Math.random() * 6) + 1;
    boutonLancer.disabled = true;
    boutonJouer.classList.add('masque');
    face.classList.remove('de-en-lancer');
    void face.offsetWidth;
    face.classList.add('de-en-lancer');
    window.setTimeout(() => {
        etat.nombreQuestionsTirageDe = nombreTire;
        envoyerEvenementPJJ('defi_du_hasard_lance', {
            pjjoue_mode_de_jeu: 'Défi du hasard',
            pjjoue_parcours: 'Parcours complet',
            pjjoue_nombre_questions_defi_du_hasard: nombreTire
        });
        face.dataset.face = String(nombreTire);
        face.classList.remove('de-en-lancer');
        resultat.textContent = `${nombreTire} question${nombreTire === 1 ? '' : 's'} aléatoire${nombreTire === 1 ? '' : 's'} tirée${nombreTire === 1 ? '' : 's'} dans les six parcours.`;
        boutonJouer.textContent = `Jouer ${nombreTire} question${nombreTire === 1 ? '' : 's'}`;
        boutonLancer.textContent = 'Relancer le dé';
        boutonLancer.classList.remove('principal');
        boutonLancer.classList.add('secondaire');
        boutonJouer.classList.remove('masque');
        boutonLancer.disabled = false;
        boutonJouer.focus({ preventScroll: true });
        annoncer(`Le dé indique ${nombreTire}. Questions tirées dans les six parcours.`);
    }, 420);
}
function jouerTirageDeParcours() {
    const nombreQuestions = Math.min(6, Math.max(1, Number(etat.nombreQuestionsTirageDe) || 1));
    const reserve = QUESTIONS.filter(question => !question.estEvaluationFinale);
    const session = selectionnerQuestionsEquilibrees(reserve, nombreQuestions);
    etat.mode = 'libre';
    etat.origineSessionAnalytics = 'defi_du_hasard';
    etat.theme = null;
    etat.perimetreEntrainement = 'tous';
    etat.organisationSession = 'melange';
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    lancerSession(session);
}
function lancerRevision(identifiantTheme = 'toutes') {
    const actif = Object.entries(sauvegarde.erreurs || {}).filter(([, erreur]) => !erreur.maitrisee);
    if (!sauvegarde.aDejaJoue && actif.length === 0) {
        afficherNotification('Tu n’as pas encore joué. Commence une partie avant de pouvoir rejouer tes erreurs.');
        return;
    }
    if (actif.length === 0) {
        afficherNotification('Bravo : aucune erreur active à rejouer pour le moment.');
        return;
    }
    const identifiants = actif.map(([id]) => Number(id));
    let reserve = QUESTIONS.filter(question => identifiants.includes(question.id) && !question.estEvaluationFinale);
    if (identifiantTheme !== 'toutes')
        reserve = reserve.filter(question => question.theme === identifiantTheme);
    if (reserve.length === 0) {
        const theme = THEMES.find(themeCandidat => themeCandidat.id === identifiantTheme);
        afficherNotification(theme ? `Aucune erreur active dans « ${theme.titre} ».` : 'Aucune erreur active dans ce thème.');
        return;
    }
    etat.mode = 'revision';
    etat.origineSessionAnalytics = 'revision_des_erreurs';
    etat.theme = identifiantTheme === 'toutes' ? null : identifiantTheme;
    etat.perimetreRevision = identifiantTheme;
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    lancerSession(melanger(reserve));
}
function lancerRevisionEtape(identifiantTheme, etape = null) {
    // Accepte aussi l’appel avec uniquement le numéro de l’étape.
    if (etape === null) {
        etape = identifiantTheme;
        identifiantTheme = etat.theme || sauvegarde.dernierTheme || 'commun';
    }
    const etapeCible = Number(etape);
    const actif = Object.entries(sauvegarde.erreurs || {}).filter(([, erreur]) => !erreur.maitrisee);
    if (!sauvegarde.aDejaJoue && actif.length === 0) {
        afficherNotification('Tu n’as pas encore joué. Commence une partie avant de pouvoir rejouer tes erreurs.');
        return;
    }
    const identifiants = actif.map(([id]) => Number(id));
    const reserve = QUESTIONS.filter(question =>
        identifiants.includes(question.id)
        && question.theme === identifiantTheme
        && Number(question.etape) === etapeCible
        && !question.estEvaluationFinale
    );
    if (!reserve.length) {
        afficherNotification(`Aucune erreur active à l’étape ${etapeCible} de ce parcours.`);
        return;
    }
    etat.mode = 'revision';
    etat.origineSessionAnalytics = 'revision_des_erreurs';
    etat.theme = identifiantTheme;
    etat.perimetreRevision = `${identifiantTheme}:etape:${etapeCible}`;
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    lancerSession(melanger(reserve));
}
// -----------------------------------------------------------------------------
// Validation des réponses et données communes aux activités
// -----------------------------------------------------------------------------
function obtenirModeQuestion(question) {
    return question?.activite?.type || 'choix-unique';
}
const LIBELLES_MODES_QUESTION = {
    'choix-unique': 'Choix unique',
    'selection-multiple': 'Sélection multiple',
    association: 'Relier',
    eliminer: 'Retirer des choix',
    'reponse-ecrite': 'Réponse écrite',
    'remettre-ordre': 'Remettre dans l’ordre',
    'choisir-ordre': 'Choisir puis ordonner',
    classer: 'Classer'
};
function obtenirLibelleMode(mode) {
    return LIBELLES_MODES_QUESTION[mode] || 'Activité';
}
function preparerSession(questionsInitiales) {
    if (!questionsInitiales?.length)
        return questionsInitiales || [];
    // Banque finale : chaque question conserve strictement son mode éditorial.
    return questionsInitiales.map(question => ({ ...question, modePresentation: question.modePrefere || obtenirModeQuestion(question) }));
}
function normaliserReponseEcrite(texte) {
    return String(texte || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
function normaliserReponseEvaluation(valeur) { return normaliserReponseEcrite(valeur).replace(/\b(le|la|les|un|une|des|du|de|d|l)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
function extraireSiglesSaisis(champ) {
    const mots = normaliserReponseEcrite(champ).split(' ').filter(Boolean);
    const formes = new Set(mots);
    for (let debut = 0; debut < mots.length; debut++) {
        let concatene = '';
        for (let fin = debut; fin < Math.min(mots.length, debut + 6); fin++) {
            if (mots[fin].length !== 1)
                break;
            concatene += mots[fin];
            if (concatene.length >= 2)
                formes.add(concatene);
        }
    }
    return formes;
}
function validerListeSiglesDistincts(champ, question) {
    if (!Array.isArray(question.siglesDistinctsAttendus) || !question.siglesDistinctsAttendus.length)
        return null;
    const formes = extraireSiglesSaisis(champ);
    const nombreTrouves = new Set(
        question.siglesDistinctsAttendus
            .map(compacterSigle)
            .filter(sigle => formes.has(sigle))
    ).size;
    return nombreTrouves >= Number(question.nombreSiglesRequis || question.siglesDistinctsAttendus.length);
}
function compacterSigle(valeur) {
    return normaliserReponseEcrite(valeur).replace(/\s+/g, '');
}
function validerFormeSigle(champ, question) {
    const forme = question.typeReponseAttendue || 'general';
    const saisieCompacte = compacterSigle(champ);
    const sigle = compacterSigle(question.sigleAttendu || question.bonneReponse);
    if (forme === 'sigle') {
        const siglesAcceptes = [question.bonneReponse, ...(question.reponsesAcceptees || [])]
            .map(compacterSigle)
            .filter(Boolean);
        return siglesAcceptes.includes(saisieCompacte);
    }
    if (forme === 'developpement-sigle' && sigle && saisieCompacte === sigle)
        return false;
    return null;
}
function respecteOrdreConcepts(champ, groupes) {
    if (!Array.isArray(groupes) || !groupes.length)
        return true;
    const motsSaisis = normaliserReponseEvaluation(champ).split(' ').filter(Boolean);
    let positionMinimale = 0;
    for (const groupe of groupes) {
        const variantes = Array.isArray(groupe) ? groupe : [groupe];
        let meilleurePosition = -1;
        let meilleureFin = -1;
        for (const variante of variantes) {
            const motsAttendus = normaliserReponseEvaluation(variante).split(' ').filter(Boolean);
            if (!motsAttendus.length)
                continue;
            for (let debut = positionMinimale; debut <= motsSaisis.length - motsAttendus.length; debut++) {
                const correspond = motsAttendus.every((motAttendu, decalage) =>
                    motsCorrespondentSouplement(motsSaisis[debut + decalage], motAttendu)
                );
                if (correspond && (meilleurePosition < 0 || debut < meilleurePosition)) {
                    meilleurePosition = debut;
                    meilleureFin = debut + motsAttendus.length;
                    break;
                }
            }
        }
        if (meilleurePosition < 0)
            return false;
        positionMinimale = meilleureFin;
    }
    return true;
}

const MOTS_NEGATION_REPONSE = new Set([
    'aucun', 'aucune', 'aucuns', 'aucunes', 'jamais', 'n', 'ne', 'ni', 'non', 'pas', 'sans'
]);
function contientExpressionComplete(texte, expression) {
    return (` ${texte} `).includes(` ${expression} `);
}
function contientNegation(texte) {
    return normaliserReponseEvaluation(texte)
        .split(' ')
        .some(mot => MOTS_NEGATION_REPONSE.has(mot));
}
function contientNegationInattendue(champ, variantesAttendues) {
    return contientNegation(champ)
        && !variantesAttendues.some(variante => contientNegation(variante));
}
function calculerDistanceTextes(texteA, texteB) {
    if (texteA === texteB)
        return 0;
    if (!texteA.length)
        return texteB.length;
    if (!texteB.length)
        return texteA.length;
    const lignePrecedente = Array.from({ length: texteB.length + 1 }, (_valeur, indice) => indice);
    const ligneCourante = new Array(texteB.length + 1);
    for (let indiceA = 1; indiceA <= texteA.length; indiceA++) {
        ligneCourante[0] = indiceA;
        for (let indiceB = 1; indiceB <= texteB.length; indiceB++) {
            const coutRemplacement = texteA[indiceA - 1] === texteB[indiceB - 1] ? 0 : 1;
            ligneCourante[indiceB] = Math.min(
                ligneCourante[indiceB - 1] + 1,
                lignePrecedente[indiceB] + 1,
                lignePrecedente[indiceB - 1] + coutRemplacement
            );
        }
        for (let indiceB = 0; indiceB <= texteB.length; indiceB++)
            lignePrecedente[indiceB] = ligneCourante[indiceB];
    }
    return lignePrecedente[texteB.length];
}
function obtenirMotsSignificatifsReponse(texte) {
    const motsVides = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'd', 'l', 'et', 'ou', 'a', 'au', 'aux',
        'en', 'dans', 'pour', 'par', 'sur', 'avec', 'sans', 'est', 'sont', 'etre', 'elle', 'il',
        'qui', 'que', 'ce', 'cette', 'ces', 'se', 'sa', 'son', 'ses'
    ]);
    return normaliserReponseEvaluation(texte)
        .split(' ')
        .filter(mot => mot.length > 1 && !motsVides.has(mot));
}
function obtenirRacineSouple(mot) {
    let racine = String(mot || '');
    const terminaisons = [
        'issements', 'issement', 'atrices', 'ateurs', 'atrice', 'ateur',
        'iquement', 'ements', 'ement', 'ations', 'ation', 'itions', 'ition',
        'aires', 'aire', 'alites', 'alite', 'ilites', 'ilite', 'ites', 'ite',
        'iennes', 'ienne', 'iels', 'iel', 'ives', 'ive', 'ifs', 'if',
        'euses', 'euse', 'eux', 'iques', 'ique', 'istes', 'iste',
        'elles', 'elle', 'aux', 'ales', 'ale', 'es', 's', 'x', 'e'
    ];
    for (const terminaison of terminaisons) {
        if (racine.length - terminaison.length >= 5 && racine.endsWith(terminaison)) {
            racine = racine.slice(0, -terminaison.length);
            break;
        }
    }
    return racine;
}
function motsCorrespondentSouplement(motSaisi, motAttendu) {
    if (motSaisi === motAttendu)
        return true;
    const longueurMaximale = Math.max(motSaisi.length, motAttendu.length);
    if (longueurMaximale >= 4) {
        const tolerance = longueurMaximale >= 9 ? 2 : 1;
        if (calculerDistanceTextes(motSaisi, motAttendu) <= tolerance)
            return true;
    }
    const racineSaisie = obtenirRacineSouple(motSaisi);
    const racineAttendue = obtenirRacineSouple(motAttendu);
    if (racineSaisie.length >= 5 && racineAttendue.length >= 5) {
        if (racineSaisie === racineAttendue)
            return true;
        if (calculerDistanceTextes(racineSaisie, racineAttendue) <= 1)
            return true;
        const longueurCommune = Math.min(racineSaisie.length, racineAttendue.length);
        const seuilPrefixe = Math.max(5, Math.ceil(longueurCommune * .78));
        if (racineSaisie.slice(0, seuilPrefixe) === racineAttendue.slice(0, seuilPrefixe))
            return true;
    }
    return false;
}
function compterMotsAttendusPresents(motsSaisis, motsAttendus) {
    const dejaUtilises = new Set();
    let correspondances = 0;
    for (const motAttendu of motsAttendus) {
        const indice = motsSaisis.findIndex((motSaisi, position) =>
            !dejaUtilises.has(position) && motsCorrespondentSouplement(motSaisi, motAttendu)
        );
        if (indice >= 0) {
            dejaUtilises.add(indice);
            correspondances++;
        }
    }
    return correspondances;
}
function correspondAVarianteEvaluation(champ, variante) {
    const reponseSaisie = normaliserReponseEvaluation(champ);
    const reponseAttendue = normaliserReponseEvaluation(variante);
    if (!reponseSaisie || !reponseAttendue)
        return false;
    if (reponseSaisie === reponseAttendue || contientExpressionComplete(reponseSaisie, reponseAttendue))
        return true;
    const motsSaisis = obtenirMotsSignificatifsReponse(reponseSaisie);
    const motsAttendus = obtenirMotsSignificatifsReponse(reponseAttendue);
    if (!motsAttendus.length)
        return false;
    const correspondances = compterMotsAttendusPresents(motsSaisis, motsAttendus);
    const minimum = motsAttendus.length === 1
        ? 1
        : Math.max(2, Math.ceil(motsAttendus.length * .6));
    return correspondances >= minimum;
}
function validerReponseEcriteEvaluation(champ, question) {
    const controleForme = validerFormeSigle(champ, question);
    if (controleForme !== null)
        return controleForme;
    const controleListeSigles = validerListeSiglesDistincts(champ, question);
    if (controleListeSigles !== null)
        return controleListeSigles;
    const reponseNormalisee = normaliserReponseEvaluation(champ);
    if (!reponseNormalisee)
        return false;
    if (question.sigleSeulRefuse && reponseNormalisee === normaliserReponseEvaluation(question.sigleSeulRefuse))
        return false;
    const reponsesDeclarees = [
        question.bonneReponse,
        ...(Array.isArray(question.reponsesAcceptees) ? question.reponsesAcceptees : [])
    ].filter(Boolean);
    const groupesConcepts = Array.isArray(question.conceptsEvaluation) ? question.conceptsEvaluation : [];
    const variantesAttendues = [
        ...reponsesDeclarees,
        ...groupesConcepts.flatMap(groupe => Array.isArray(groupe) ? groupe : [])
    ];
    if (contientNegationInattendue(champ, variantesAttendues))
        return false;
    const expressionsInterditesExactes = Array.isArray(question.expressionsInterditesExactes)
        ? question.expressionsInterditesExactes
        : [];
    const contientExpressionInterditeExacte = expressionsInterditesExactes.some(expression => {
        const expressionNormalisee = normaliserReponseEvaluation(expression);
        return expressionNormalisee && reponseNormalisee === expressionNormalisee;
    });
    if (contientExpressionInterditeExacte)
        return false;
    const conceptsInterdits = Array.isArray(question.conceptsInterdits) ? question.conceptsInterdits : [];
    const contientConceptInterdit = conceptsInterdits.some(groupe => {
        const variantes = Array.isArray(groupe) ? groupe : [groupe];
        return variantes.some(variante => correspondAVarianteEvaluation(champ, variante));
    });
    if (contientConceptInterdit)
        return false;
    const correspondanceDeclaree = reponsesDeclarees.some(variante => correspondAVarianteEvaluation(champ, variante));
    const correspondanceDeclareeExacte = reponsesDeclarees.some(variante => {
        const reponseAttendue = normaliserReponseEvaluation(variante);
        return reponseNormalisee === reponseAttendue || contientExpressionComplete(reponseNormalisee, reponseAttendue);
    });
    if (!groupesConcepts.length)
        return correspondanceDeclaree;
    if (correspondanceDeclareeExacte)
        return true;
    const nombreCorrespondances = groupesConcepts.filter(groupe =>
        Array.isArray(groupe) && groupe.some(variante => correspondAVarianteEvaluation(champ, variante))
    ).length;
    if (nombreCorrespondances < Number(question.nombreConceptsRequis || groupesConcepts.length))
        return false;
    return respecteOrdreConcepts(champ, question.conceptsOrdonnes);
}
function validerReponseEcriteSouple(champ, question) {
    // La même compréhension sémantique est appliquée pendant l'apprentissage et l'évaluation.
    // Les accents, accords, pluriels, variantes morphologiques et petites fautes sont tolérés,
    // mais les négations inattendues et les réponses qui ne contiennent pas assez de concepts restent refusées.
    return validerReponseEcriteEvaluation(champ, question);
}
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
        <div class="retournee-note">Cette activité a déjà été jouée. Tu peux la relire, mais son résultat ne peut plus être modifié.</div>
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
function rejouerQuestionCourante() {
    const question = etat.questionCourante;
    if (!question || !etat.questionValidee)
        return;
    const nombreReprises = etat.tentativesQuestions?.get(question.id) || 0;
    if (nombreReprises >= 1) {
        afficherNotification('Cette question a déjà été rejouée une fois.');
        return;
    }
    const precedent = etat.reponsesSession.get(question.id);
    envoyerEvenementPJJ('question_rejouee', {
        ...obtenirContexteQuestionAnalytics(question),
        pjjoue_resultat_reponse: obtenirResultatReponseAnalytics(precedent?.statut || 'incorrecte')
    });
    etat.tentativesQuestions = etat.tentativesQuestions || new Map();
    etat.tentativesQuestions.set(question.id, 1);
    etat.reponsesSession.set(question.id, { ...(precedent || {}), statut: 'passee' });
    etat.questionValidee = false;
    etat.brouillonActivite = null;
    afficherQuestion();
    enregistrerSessionEnCours();
    annoncer('Question prête à être rejouée.');
}
// -----------------------------------------------------------------------------
// Déroulement d’une question, chronomètre et correction
// -----------------------------------------------------------------------------
function preparerQuestionCourante() {
    fermerFenetreJokers({ restaurerFocus: false });
    const boutonValiderCourant = selectionner('#boutonValider');
    if (boutonValiderCourant) {
        boutonValiderCourant.classList.add('masque');
        boutonValiderCourant.removeAttribute('data-action');
    }

    clearInterval(etat.identifiantMinuteur);
    etat.questionCourante = etat.questionsSession[etat.indexQuestion];
    if (!etat.questionCourante?.missionSigles) {
        marquerEtapeDecouverte(etat.questionCourante);
        marquerQuestionJouee(etat.questionCourante);
    }
    enregistrerSauvegarde();

    const question = etat.questionCourante;
    const reponse = etat.reponsesSession.get(question.id);
    const dejaPassee = reponse?.statut === 'passee';

    etat.jokersQuestions = etat.jokersQuestions || new Map();
    if (!etat.jokersQuestions.has(question.id)) {
        etat.jokersQuestions.set(question.id, {
            cinquanteCinquante: true,
            indice: true,
            langueAuChat: true
        });
    }
    etat.jokers = etat.jokersQuestions.get(question.id);
    etat.questionValidee = Boolean(reponse) && !dejaPassee;

    const carteQuestion = document.querySelector('#question .question');
    carteQuestion?.classList.remove('jalon-valide');
    carteQuestion?.classList.remove('question-apparition');
    void carteQuestion?.offsetWidth;
    carteQuestion?.classList.add('question-apparition');

    return { question, reponse, dejaPassee };
}

function afficherReperesQuestion(question) {
    if (question?.missionSigles) {
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        const ecranQuestion = selectionner('#question');
        ecranQuestion?.style.setProperty('--parcours-accent', identite.couleur);
        ecranQuestion?.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        const valeurProgression = Math.round((etat.indexQuestion + 1) / etat.questionsSession.length * 100);
        selectionner('#compteurQuestion').textContent = `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
        selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
        selectionner('#progressionQuestion').parentElement?.setAttribute('aria-valuenow', String(valeurProgression));
        selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
        selectionner('#reperesQuestion').innerHTML = `<span class="repere repere-theme"><span class="icone-theme" aria-hidden="true">Aa</span><b>Mission Sigles · Étape ${identite.numero}</b></span>`;
        return;
    }
    const theme = THEMES.find(themeCandidat => themeCandidat.id === question.theme);
    const identite = obtenirIdentiteParcours(question.theme);
    const ecranQuestion = selectionner('#question');
    ecranQuestion?.style.setProperty('--parcours-accent', identite.couleur);
    ecranQuestion?.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
    const valeurProgression = Math.round(
        (etat.indexQuestion + 1) / etat.questionsSession.length * 100
    );
    const repereProcedureLocale = question.procedureLocale
        ? '<span class="repere local repere-locale">Procédure locale</span>'
        : '';

    selectionner('#compteurQuestion').textContent =
        `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
    selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
    selectionner('#progressionQuestion').parentElement?.setAttribute(
        'aria-valuenow',
        String(valeurProgression)
    );
    selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
    selectionner('#reperesQuestion').innerHTML =
        `<span class="repere repere-theme">${creerIconeTheme(theme.id, identite.titre)}`
        + `<b>Parcours ${identite.numero} · ${identite.titre}</b></span>`
        + repereProcedureLocale;
}
function creerBoutonChoixUnique(proposition, indice, reponse, dejaPassee) {
    const bouton = document.createElement('button');
    bouton.className = 'reponse';
    bouton.dataset.indiceReponse = indice;
    bouton.dataset.estCorrecte = proposition.estCorrecte ? '1' : '0';
    bouton.setAttribute('role', 'radio');
    bouton.setAttribute(
        'aria-checked',
        reponse?.texteReponse === proposition.texte ? 'true' : 'false'
    );
    bouton.innerHTML =
        `<span class="lettre">${'ABCD'[indice]}</span>`
        + `<span>${proposition.texte}</span>`;

    const donneesJoker = obtenirDonneesJoker5050();
    if (
        donneesJoker?.nature === 'choix-unique'
        && donneesJoker.textesRetires?.includes(proposition.texte)
    ) {
        bouton.classList.add('retire');
    }

    if (reponse && !dejaPassee) {
        bouton.disabled = true;
    }
    else {
        bouton.onclick = () => choisirReponse(bouton, proposition);
    }
    return bouton;
}

function afficherChoixUnique(question, reponse, dejaPassee) {
    const zone = selectionner('#zoneReponses');
    zone.setAttribute('role', 'radiogroup');
    zone.setAttribute('aria-label', 'Choix de réponse');
    obtenirChoixQuestion(question).forEach((proposition, indice) => {
        zone.appendChild(creerBoutonChoixUnique(proposition, indice, reponse, dejaPassee));
    });
}

function afficherModeReponseQuestion(question, reponse, dejaPassee) {
    const zone = selectionner('#zoneReponses');
    zone.className = 'reponses';
    zone.innerHTML = '';

    const modePresentation = question.modePresentation || obtenirModeQuestion(question);
    const libelleMode = question.libelleMode || obtenirLibelleMode(modePresentation);
    if (modePresentation === 'choix-unique') {
        selectionner('#reperesQuestion').insertAdjacentHTML(
            'beforeend',
            `<span class="repere mode-repere">${libelleMode}</span>`
        );
    }

    if (modePresentation === 'reponse-ecrite') {
        afficherActiviteEcrite(reponse);
    }
    else if (modePresentation === 'eliminer') {
        afficherActiviteEliminer(question, reponse);
    }
    else if (question.activite && question.activite.type !== 'choix-unique') {
        afficherActiviteInteractive(question, reponse);
    }
    else {
        afficherChoixUnique(question, reponse, dejaPassee);
    }
}

function configurerNavigationQuestion(dejaPassee, modeEvaluationFinale) {
    selectionner('#zoneIndice').className = 'correction masque';
    selectionner('#zoneCorrection').className = 'correction masque';
    selectionner('#boutonQuestionPrecedente').disabled = etat.indexQuestion === 0;

    const boutonPasser = selectionner('#boutonPasser');
    const boutonSuivant = selectionner('#boutonQuestionSuivante');
    boutonPasser.classList.toggle('masque', etat.questionValidee || modeEvaluationFinale);
    boutonPasser.disabled = etat.questionValidee || modeEvaluationFinale;
    boutonSuivant.classList.toggle('masque', !etat.questionValidee);

    if (dejaPassee) {
        boutonSuivant.classList.add('masque');
        boutonPasser.classList.remove('masque');
        boutonPasser.disabled = false;
    }
}

function configurerJokersQuestion(jokersActifs) {
    const bouton5050 = selectionner('#boutonJoker5050');
    const boutonIndice = selectionner('#boutonJokerIndice');
    const boutonLangueAuChat = selectionner('#boutonJokerLangueAuChat');

    bouton5050.classList.remove('masque');
    bouton5050.disabled =
        !jokersActifs || etat.questionValidee || !etat.jokers.cinquanteCinquante;
    bouton5050.title = !etat.jokers.cinquanteCinquante
        ? 'Joker déjà utilisé pour cette activité.'
        : 'Donner environ la moitié de la résolution, quel que soit le mode de réponse.';

    boutonIndice.disabled = !jokersActifs || etat.questionValidee || !etat.jokers.indice;
    boutonIndice.title = !etat.jokers.indice
        ? 'Indice déjà utilisé pour cette activité.'
        : 'Afficher un indice adapté à cette activité.';

    boutonLangueAuChat.disabled =
        !jokersActifs || etat.questionValidee || !etat.jokers.langueAuChat;
    boutonLangueAuChat.title = !etat.jokers.langueAuChat
        ? 'Joker déjà utilisé pour cette activité.'
        : 'Dévoiler toute la réponse attendue grâce au joker « Langue au chat ».';

    actualiserBoutonJokers();
}

function configurerChronometreEtFocusQuestion(jokersActifs, modeEvaluationFinale) {
    if (!etat.questionValidee) {
        demarrerChronometreQuestion();
        if (jokersActifs && !modeEvaluationFinale) {
            programmerRappelJokers();
        }
    }
    else {
        selectionner('#chronometreQuestion').textContent = '';
        annulerRappelJokers();
    }

    const enonce = selectionner('#enonceQuestion');
    enonce.setAttribute('tabindex', '-1');
    enonce.focus({ preventScroll: true });
}

function appliquerIdentiteVisuelleEtape(question) {
    if (question?.missionSigles) {
        const identite = obtenirIdentiteEtapeMissionSigles(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        document.documentElement.style.setProperty('--couleur-etape-active', identite.couleur);
        document.body.dataset.etapeActive = `sigles-${question.missionSiglesMeta?.numeroEtape || question.etape || 1}`;
        return;
    }
    const programme = PROGRAMMES[question?.theme];
    const etapeProgramme = programme?.etapes?.find(
        etape => Number(etape.id) === Number(question?.etape)
    );
    const couleurEtape = question?.theme === 'commun'
        ? (etapeProgramme?.couleur || '#2d7379')
        : obtenirCouleurTitreEtape(question?.etape);
    document.documentElement.style.setProperty('--couleur-etape-active', couleurEtape);
    document.body.dataset.etapeActive = String(question?.etape || 'libre');
}
function actualiserSuiviEtapeQuestion(question) {
    const conteneur = selectionner('#contexteEtapeQuestion');
    const identiteParcoursQuestion = selectionner('#identiteParcoursQuestion');
    const numeroParcours = selectionner('#numeroParcoursQuestion');
    const titreParcours = selectionner('#titreParcoursQuestion');
    const numero = selectionner('#numeroEtapeQuestion');
    const titre = selectionner('#titreEtapeQuestion');
    const suivi = selectionner('#suiviSansJokerQuestion');
    const compteur = selectionner('#compteurSansJokerQuestion');
    const boutonReinitialiser = selectionner('#boutonReinitialiserValidationsSansJoker');
    if (!conteneur || !identiteParcoursQuestion || !numeroParcours || !titreParcours || !numero || !titre || !suivi || !compteur || !boutonReinitialiser || !question)
        return;
    if (question.missionSigles) {
        identiteParcoursQuestion.classList.remove('masque');
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        const finaleMission = obtenirModeMissionSigles() === 'evaluation';
        numeroParcours.textContent = 'Mission Sigles';
        titreParcours.textContent = 'Mission Sigles';
        numero.textContent = finaleMission ? 'Évaluation finale' : `Étape ${numeroEtape}`;
        titre.textContent = finaleMission ? 'Expert des sigles' : identite.titre;
        suivi.classList.toggle('masque', finaleMission || obtenirModeMissionSigles() !== 'parcours');
        if (!finaleMission && obtenirModeMissionSigles() === 'parcours') {
            compteur.textContent = `${compterMaitrisesEtapeSigles(numeroEtape)}/${NOMBRE_SIGLES_PAR_ETAPE}`;
            boutonReinitialiser.disabled = compterMaitrisesEtapeSigles(numeroEtape) === 0;
        }
        return;
    }
    identiteParcoursQuestion.classList.remove('masque');
    const finale = etat.mode === 'evaluation-finale' || Number(question.etape) === 12;
    const etapeProgramme = obtenirEtapeProgramme(question.theme, question.etape);
    const identite = obtenirIdentiteParcours(question.theme);
    numeroParcours.textContent = `Parcours ${identite.numero}`;
    titreParcours.textContent = identite.titre;
    const ecranQuestion = selectionner('#question');
    ecranQuestion?.style.setProperty('--parcours-accent', identite.couleur);
    ecranQuestion?.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
    numero.textContent = finale ? 'Étape 12' : `Étape ${question.etape}`;
    titre.textContent = finale ? 'Évaluation finale' : (etapeProgramme?.titre || 'Parcours PJJ');
    suivi.classList.toggle('masque', finale || etat.mode !== 'parcours');
    if (finale || etat.mode !== 'parcours')
        return;
    const questionsEtape = obtenirQuestionsEtape(question.theme, question.etape);
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    compteur.textContent = `${nombreAutonomes}/${questionsEtape.length}`;
    boutonReinitialiser.disabled = nombreAutonomes === 0;
    boutonReinitialiser.setAttribute(
        'aria-label',
        `Réinitialiser les ${nombreAutonomes} questions maîtrisées sans aide de l’étape ${question.etape}`
    );
}
function demanderReinitialisationSansJoker() {
    const question = etat.questionCourante;
    if (question?.missionSigles) {
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const nombreAutonomes = compterMaitrisesEtapeSigles(numeroEtape);
        if (!nombreAutonomes) return;
        ouvrirFenetreMessage({
            titre:'Réinitialiser la maîtrise sans aide ?',
            message:`Les ${nombreAutonomes} validations autonomes de cette étape Mission Sigles seront effacées.`,
            libelleConfirmer:'Réinitialiser', libelleAnnuler:'Annuler', afficherAnnuler:true, variante:'avertissement',
            apresConfirmation:()=>reinitialiserMaitriseEtapeMissionSigles(numeroEtape)
        });
        return;
    }
    if (!question || etat.mode !== 'parcours')
        return;
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    if (!nombreAutonomes)
        return;
    ouvrirFenetreMessage({
        titre: 'Réinitialiser la maîtrise sans aide ?',
        message: `Les ${nombreAutonomes} validations autonomes de cette étape seront effacées. Les questions déjà travaillées et ta progression générale restent conservées.`,
        libelleConfirmer: 'Réinitialiser',
        libelleAnnuler: 'Annuler',
        afficherAnnuler: true,
        variante: 'avertissement',
        apresConfirmation: () => reinitialiserValidationSansJokerEtape(question.theme, question.etape)
    });
}
function afficherQuestion({ suivreAnalytics = true, reprendreChronometre = false } = {}) {
    const { question, reponse, dejaPassee } = preparerQuestionCourante();
    if (suivreAnalytics) {
        envoyerEvenementPJJ('question_affichee', {
            ...obtenirContexteQuestionAnalytics(question),
            pjjoue_resultat_reponse: obtenirResultatReponseAnalytics(
                reponse?.statut || (dejaPassee ? 'passee' : 'a_repondre')
            )
        });
    }
    appliquerIdentiteVisuelleEtape(question);
    actualiserSuiviEtapeQuestion(question);
    const modeEvaluationFinale = etat.mode === 'evaluation-finale' || etat.mode === 'sigles-evaluation';
    const jokersActifs = etat.jokersSessionActifs !== false;

    afficherReperesQuestion(question);
    afficherModeReponseQuestion(question, reponse, dejaPassee);
    configurerNavigationQuestion(dejaPassee, modeEvaluationFinale);
    configurerJokersQuestion(jokersActifs);

    if (reponse) {
        afficherCorrectionEnregistree(question, reponse);
    }

    if (reprendreChronometre && etat.chronometreSessionActif && !etat.questionValidee && etat.tempsRestant > 0) {
        reprendreChronometreQuestion(etat.tempsRestant);
        const enonce = selectionner('#enonceQuestion');
        enonce?.setAttribute('tabindex', '-1');
        enonce?.focus?.({ preventScroll: true });
    }
    else {
        configurerChronometreEtFocusQuestion(jokersActifs, modeEvaluationFinale);
    }
    enregistrerSessionEnCours();
}
function gererTempsEcoule() {
    if (etat.questionValidee)
        return;
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.tempsRestant = 0;
    const minuteur = selectionner('#chronometreQuestion');
    if (minuteur)
        minuteur.textContent = '0s';
    // Son d'échec
    if (typeof jouerSonErreur === 'function')
        jouerSonErreur();
    // La question est traitée comme une réponse incorrecte,
    // afin de déclencher la correction complète et l'explication.
    const question = etat.questionCourante;
    if (!question)
        return;
    const mode = question.modePresentation || obtenirModeQuestion(question);
    // Mémoriser le dépassement du temps pour adapter la correction.
    etat.delaiDepasse = true;
    if (mode === 'choix-unique') {
        finaliserReponse(false, 'Temps écoulé');
        return;
    }
    if (mode === 'selection-multiple' || mode === 'association' || mode === 'classer' || mode === 'remettre-ordre' || mode === 'eliminer' || mode === 'reponse-ecrite') {
        finaliserReponse(false, 'Temps écoulé');
        return;
    }
    finaliserReponse(false, 'Temps écoulé');
}
function reprendreChronometreQuestion(secondesRestantes = etat.tempsRestant) {
    if (!etat.chronometreSessionActif || etat.questionValidee || secondesRestantes <= 0)
        return;
    clearInterval(etat.identifiantMinuteur);
    etat.tempsRestant = secondesRestantes;
    const chronometre = selectionner('#chronometreQuestion');
    if (chronometre)
        chronometre.textContent = etat.tempsRestant + 's';
    etat.identifiantMinuteur = setInterval(() => {
        etat.tempsRestant--;
        if (chronometre)
            chronometre.textContent = etat.tempsRestant + 's';
        if (etat.tempsRestant <= 0) {
            clearInterval(etat.identifiantMinuteur);
            etat.identifiantMinuteur = null;
            gererTempsEcoule();
        }
    }, 1000);
}
function demarrerChronometreQuestion() {
    const chronometre = selectionner('#chronometreQuestion');
    etat.delaiDepasse = false;
    if (!etat.chronometreSessionActif) {
        chronometre.textContent = '';
        return;
    }
    etat.tempsRestant = Math.min(30, Math.max(5, Number(etat.dureeChronometreSession) || 15));
    chronometre.textContent = etat.tempsRestant + 's';
    etat.identifiantMinuteur = setInterval(() => {
        etat.tempsRestant--;
        chronometre.textContent = etat.tempsRestant + 's';
        if (etat.tempsRestant <= 0) {
            clearInterval(etat.identifiantMinuteur);
            etat.identifiantMinuteur = null;
            gererTempsEcoule();
        }
    }, 1000);
}
function preparerValidationReponse(question, bouton) {
    annulerRappelJokers();
    const precedente = etat.reponsesSession.get(question.id);
    const etaitPassee = precedente?.statut === 'passee';
    const tentatives = etat.tentativesQuestions?.get(question.id) || 0;
    const aideUtilisee = Object.values(etat.jokers || {}).some(valeur => valeur === false);
    etat.questionValidee = true;
    fermerFenetreJokers({ restaurerFocus: false });
    actualiserBoutonJokers();
    clearInterval(etat.identifiantMinuteur);
    sauvegarde.aDejaJoue = true;
    if (!question?.missionSigles) {
        marquerEtapeDecouverte(question);
        marquerQuestionJouee(question);
        if (!precedente)
            sauvegarde.nombreQuestionsJouees = (sauvegarde.nombreQuestionsJouees || 0) + 1;
    }
    selectionnerTous(
        '.reponse,.multiple-choix,.activite-valider,.ordre-commandes button,'
        + '.association-colonne button,.classement-element button'
    ).forEach(commande => commande.disabled = true);
    if (bouton)
        bouton.setAttribute('aria-checked', 'true');
    selectionner('#boutonPasser').classList.add('masque');
    selectionner('#boutonValider')?.classList.add('masque');
    return { etaitPassee, tentatives, aideUtilisee };
}
function enregistrerResultatReponse(question, texteChoisi, precisions, resultat) {
    const { estCorrecte, reussiteAutonome, reussiteAidee, tentatives, aideUtilisee } = resultat;
    etat.reponsesSession.set(question.id, {
        statut: reussiteAutonome ? 'correcte' : (reussiteAidee ? 'aidee' : 'incorrecte'),
        texteReponse: texteChoisi,
        precisions: {
            ...precisions,
            aidee: reussiteAidee,
            tentatives,
            aideUtilisee
        }
    });
    if (resultat.etaitPassee)
        etat.questionsPassees.delete(question.id);
    etat.brouillonsEcrits?.delete(question.id);
    if (question?.missionSigles) {
        enregistrerResultatMissionSiglesNatif(question, resultat);
        enregistrerSessionEnCours();
        return;
    }
    if (etat.mode !== 'parcours') {
        enregistrerSessionEnCours();
        return;
    }
    const bilan = obtenirBilanEtape(question.theme, question.etape);
    bilan.questionsTraitees[question.id] = true;
    bilan.resultats[question.id] = bilan.resultats?.[question.id] === true || reussiteAutonome;
    bilan.validationsSansJoker = bilan.validationsSansJoker || {};
    // Pour la célébration d'étape, une réponse finalement correcte compte dès lors
    // qu'aucun joker n'a été utilisé sur cette tentative, même après avoir rejoué.
    bilan.validationsSansJoker[question.id] = bilan.validationsSansJoker[question.id] === true
        || (estCorrecte && !aideUtilisee);
    if (aideUtilisee)
        etat.etapeAvecJoker = true;
    synchroniserEtapesReussiesEnAutonomie(PROGRAMMES[question.theme]);
    actualiserSuiviEtapeQuestion(question);
    enregistrerSessionEnCours();
}
function obtenirSuiviErreur(question) {
    sauvegarde.erreurs[question.id] = sauvegarde.erreurs[question.id] || {
        reussites: 0,
        maitrisee: false,
        nombreErreurs: 0,
        theme: question.theme
    };
    return sauvegarde.erreurs[question.id];
}
function traiterReussiteAutonome(question, etaitPassee) {
    etat.score++;
    etat.serie++;
    etat.meilleureSerie = Math.max(etat.meilleureSerie, etat.serie);
    sauvegarde.meilleureSerie = Math.max(sauvegarde.meilleureSerie || 0, etat.serie);
    etat.erreursSession.delete(question.id);
    jouerSonReussite();
    if (etaitPassee && sauvegarde.erreurs[question.id]
        && (sauvegarde.erreurs[question.id].nombreErreurs || 0) <= 1) {
        delete sauvegarde.erreurs[question.id];
        return;
    }
    if (etat.mode === 'revision' && sauvegarde.erreurs[question.id]) {
        const suiviErreur = sauvegarde.erreurs[question.id];
        // En mode Révision, une réussite autonome suffit : la question n’a plus besoin de rester active.
        suiviErreur.reussites = 1;
        suiviErreur.maitrisee = true;
    }
}
function traiterReussiteAidee(question, etaitPassee) {
    etat.nombreReponsesAidees = (etat.nombreReponsesAidees || 0) + 1;
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    jouerSonReussite();
    if (question?.missionSigles || etat.mode === 'evaluation-finale')
        return;
    const suiviErreur = obtenirSuiviErreur(question);
    if (!etaitPassee)
        suiviErreur.nombreErreurs = (suiviErreur.nombreErreurs || 0) + 1;
    suiviErreur.reussites = 0;
    suiviErreur.maitrisee = false;
}
function traiterReponseIncorrecte(question, etaitPassee) {
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    jouerSonErreur();
    if (question?.missionSigles || etat.mode === 'evaluation-finale')
        return;
    const suiviErreur = obtenirSuiviErreur(question);
    if (!etaitPassee)
        suiviErreur.nombreErreurs = (suiviErreur.nombreErreurs || 0) + 1;
    suiviErreur.reussites = 0;
    suiviErreur.maitrisee = false;
}
function actualiserIndicateurSerie() {
    const indicateur = selectionner('#indicateurSerie');
    const valeur = indicateur?.querySelector('strong');
    if (!indicateur || !valeur)
        return;
    const nombreReussites = Number(etat.serie) || 0;
    const serieVisible = nombreReussites >= 2;
    indicateur.classList.toggle('masque', !serieVisible);
    indicateur.classList.toggle('serie-remarquable', nombreReussites >= 5);
    valeur.textContent = serieVisible ? `Série ×${nombreReussites}` : '';
    indicateur.setAttribute(
        'aria-label',
        serieVisible ? `${nombreReussites} réussites autonomes consécutives` : ''
    );
}
function obtenirTexteCorrection(question, resultat, texteChoisi, precisions) {
    const { estCorrecte, reussiteAutonome, reussiteAidee } = resultat;
    const banniereTempsEcoule = etat.delaiDepasse
        ? '<div class="temps-ecoule-correction"><strong>Temps écoulé</strong>'
            + '<span>La bonne réponse et l’explication sont affichées ci-dessous.</span></div>'
        : '';
    const reponseAttendueDetaillee = construireCorrectionDetaillee(question, echapperHtml);
    const reponseJoueur = !estCorrecte
        && !precisions.langueAuChatUtilisee
        && texteChoisi
        ? `<p><b>Ta réponse :</b> ${echapperHtml(texteChoisi)}</p>`
        : '';
    const titre = precisions.langueAuChatUtilisee
        ? 'Langue au chat — réponse dévoilée'
        : (reussiteAutonome
            ? 'Bonne réponse'
            : (reussiteAidee ? 'Compris avec aide — à consolider' : 'Pas cette fois'));
    const message = precisions.langueAuChatUtilisee
        ? 'Toute la réponse est affichée. Cette activité est enregistrée avec aide et reviendra dans tes révisions pour être retravaillée seule.'
        : (reussiteAidee
            ? 'La notion a été comprise, mais cette réponse ne compte pas comme une réussite autonome. Elle rejoint tes révisions.'
            : (reussiteAutonome
                ? MESSAGES_REUSSITE[Math.floor(Math.random() * MESSAGES_REUSSITE.length)]
                : MESSAGES_ERREUR[Math.floor(Math.random() * MESSAGES_ERREUR.length)]));
    const repriseDisponible = (etat.tentativesQuestions?.get(question.id) || 0) < 1;
    const boutonRejouer = !estCorrecte
        && !reussiteAidee
        && etat.mode !== 'evaluation-finale'
        && repriseDisponible
        ? '<button class="principal reessayer-question-bouton" id="rejouerQuestion" '
            + 'type="button">Rejouer la question</button>'
        : '';
    const procedureLocale = question.procedureLocale
        ? '<p><b>Procédure locale :</b> le circuit exact du service réel doit toujours primer sur ce scénario pédagogique.</p>'
        : '';
    const contenu = `<div class="correction-entete"><h3>${titre}</h3>`
        + `<div class="correction-entete-actions">${boutonRejouer}`
        + '<button class="correction-fermer" id="correction-fermer" type="button" '
        + 'aria-label="Fermer l’explication" title="Fermer l’explication">×</button></div></div>'
        + '<div class="correction-separateur" aria-hidden="true"></div>'
        + `<div class="correction-corps"><p class="encouragement">${message}</p>`
        + `${banniereTempsEcoule}${reponseJoueur}${reponseAttendueDetaillee}`
        + `<p><b>Explication :</b> ${question.explication}</p>${procedureLocale}</div>`;
    return { titre, contenu };
}
function afficherCorrectionReponse(question, resultat, texteChoisi, precisions) {
    const correction = selectionner('#zoneCorrection');
    document.querySelector('#question .question-carte')?.classList.toggle(
        'jalon-valide',
        resultat.reussiteAutonome
    );
    const { titre, contenu } = obtenirTexteCorrection(question, resultat, texteChoisi, precisions);
    correction.className = 'correction '
        + (resultat.reussiteAutonome ? 'bon' : (resultat.reussiteAidee ? 'aidee' : 'incorrecte'));
    correction.classList.remove(
        'correction-correcte',
        'correction-incorrecte',
        'langue-chat-calque'
    );
    if (precisions.langueAuChatUtilisee)
        correction.classList.add('langue-chat-calque');
    else
        correction.classList.add(resultat.estCorrecte ? 'correction-correcte' : 'correction-incorrecte');
    correction.innerHTML = contenu;
    const boutonRejouer = selectionner('#rejouerQuestion');
    if (boutonRejouer)
        boutonRejouer.onclick = rejouerQuestionCourante;
    const boutonFermerCorrection = selectionner('#correction-fermer');
    if (boutonFermerCorrection) {
        boutonFermerCorrection.onclick = () => {
            correction.classList.add('masque');
            correction.innerHTML = '';
            const boutonSuivant = selectionner('#boutonQuestionSuivante');
            if (boutonSuivant)
                boutonSuivant.focus({ preventScroll: true });
            annoncer('Explication fermée. La question est de nouveau affichée.');
        };
    }
    selectionner('#boutonQuestionSuivante').classList.remove('masque');
    annoncer(`${titre}. ${question.explication}`);
    requestAnimationFrame(() => correction.focus({ preventScroll: true }));
}
function finaliserReponse(estCorrecte, texteChoisi, { bouton = null, precisions = {} } = {}) {
    if (etat.questionValidee)
        return false;
    const question = etat.questionCourante;
    const preparation = preparerValidationReponse(question, bouton);
    const reussiteAidee = estCorrecte
        && (preparation.tentatives > 0 || preparation.aideUtilisee);
    const resultat = {
        ...preparation,
        estCorrecte,
        reussiteAidee,
        reussiteAutonome: estCorrecte && !reussiteAidee
    };
    if (bouton?.classList.contains('reponse')) {
        bouton.classList.add(estCorrecte ? 'bonne-reponse' : 'mauvaise-reponse');
        if (!estCorrecte) {
            document.querySelectorAll('#zoneReponses .reponse[data-est-correcte="1"]').forEach(
                bonneReponse => bonneReponse.classList.add('bonne-reponse')
            );
        }
    }
    envoyerEvenementPJJ('reponse_validee', {
        ...obtenirContexteQuestionAnalytics(question),
        pjjoue_resultat_reponse: resultat.reussiteAutonome
            ? 'Réussite autonome'
            : (resultat.reussiteAidee ? 'Réussite avec aide' : 'Réponse incorrecte'),
        pjjoue_nombre_tentatives: Math.max(1, Number(resultat.tentatives) + 1),
        pjjoue_temps_ecoule: etat.delaiDepasse ? 'Oui' : 'Non'
    });
    enregistrerResultatReponse(question, texteChoisi, precisions, resultat);
    if (resultat.reussiteAutonome)
        traiterReussiteAutonome(question, resultat.etaitPassee);
    else if (resultat.reussiteAidee)
        traiterReussiteAidee(question, resultat.etaitPassee);
    else
        traiterReponseIncorrecte(question, resultat.etaitPassee);
    actualiserIndicateurSerie();
    afficherCorrectionReponse(question, resultat, texteChoisi, precisions);
    enregistrerSauvegarde();
    return true;
}
function choisirReponse(bouton, proposition) {
    finaliserReponse(Boolean(proposition.estCorrecte), proposition.texte, { bouton });
}
function obtenirLibelleNombreJokers(nombre) {
    return nombre === 1 ? 'un joker' : nombre === 2 ? 'deux jokers' : nombre === 3 ? 'trois jokers' : `${nombre} jokers`;
}
function demanderPassageQuestion() {
    if (etat.questionValidee)
        return;
    const disponibles = compterJokersDisponibles();
    const tempsEnPause = etat.tempsRestant;
    const minuteurEtaitActif = !!etat.identifiantMinuteur;
    if (minuteurEtaitActif) {
        clearInterval(etat.identifiantMinuteur);
        etat.identifiantMinuteur = null;
    }
    const rappelJoker = disponibles > 0
        ? ` N’oublie pas qu’il te reste ${obtenirLibelleNombreJokers(disponibles)}.`
        : '';
    ouvrirFenetreMessage({
        titre: '',
        message: `Es-tu sûr de vouloir passer cette question ?${rappelJoker}`,
        libelleConfirmer: 'Oui',
        libelleAnnuler: 'Annuler',
        afficherAnnuler: true,
        variante: 'avertissement',
        apresConfirmation: passerQuestion,
        apresAnnulation: () => {
            if (minuteurEtaitActif && !etat.questionValidee)
                reprendreChronometreQuestion(tempsEnPause);
        }
    });
}
function passerQuestion() {
    if (etat.questionValidee)
        return;
    annulerRappelJokers();
    const question = etat.questionCourante, precedente = etat.reponsesSession.get(question.id);
    envoyerEvenementPJJ('question_passee', {
        ...obtenirContexteQuestionAnalytics(question),
        pjjoue_resultat_reponse: 'Question passée'
    });
    clearInterval(etat.identifiantMinuteur);
    sauvegarde.aDejaJoue = true;
    if (question?.missionSigles) {
        enregistrerPassageMissionSiglesNatif(question);
    }
    else {
        marquerEtapeDecouverte(question);
        marquerQuestionJouee(question);
        if (!precedente)
            sauvegarde.nombreQuestionsJouees = (sauvegarde.nombreQuestionsJouees || 0) + 1;
    }
    etat.reponsesSession.set(question.id, { statut: 'passee', texteReponse: '' });
    etat.questionsPassees.add(question.id);
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    actualiserIndicateurSerie();
    if (!question?.missionSigles) {
        sauvegarde.erreurs[question.id] = sauvegarde.erreurs[question.id] || { reussites: 0, maitrisee: false, nombreErreurs: 0, theme: question.theme };
        if (!precedente) {
            sauvegarde.erreurs[question.id].nombreErreurs = (sauvegarde.erreurs[question.id].nombreErreurs || 0) + 1;
            sauvegarde.erreurs[question.id].nombrePassages = (sauvegarde.erreurs[question.id].nombrePassages || 0) + 1;
        }
        sauvegarde.erreurs[question.id].reussites = 0;
        sauvegarde.erreurs[question.id].maitrisee = false;
    }
    enregistrerSauvegarde();
    enregistrerSessionEnCours();
    afficherQuestionSuivante();
}
function afficherQuestionPrecedente() {
    if (etat.indexQuestion <= 0)
        return;
    clearInterval(etat.identifiantMinuteur);
    annulerRappelJokers();
    etat.indexQuestion--;
    afficherQuestion();
}
function afficherQuestionSuivante() {
    clearInterval(etat.identifiantMinuteur);
    annulerRappelJokers();
    etat.indexQuestion++;
    if (etat.indexQuestion >= etat.questionsSession.length)
        terminerSession();
    else
        afficherQuestion();
}
// -----------------------------------------------------------------------------
// Jokers et aides pendant une question
// -----------------------------------------------------------------------------
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
// -----------------------------------------------------------------------------
// Fin de session, bilan, révision et progression détaillée
// -----------------------------------------------------------------------------
function afficherCelebration({ titre = 'Bravo !', message = '', finale = false } = {}) {
    const fenetre = selectionner('#fenetreCelebration');
    const elementTitre = selectionner('#titreFenetreCelebration');
    const elementTexte = selectionner('#texteFenetreCelebration');
    const fermer = selectionner('#fermerFenetreCelebration');
    const boutonContinuer = selectionner('#continuerFenetreCelebration');
    if (!fenetre || !elementTitre || !elementTexte || !fermer || !boutonContinuer) {
        afficherNotification(message || titre);
        return;
    }
    elementTitre.textContent = titre;
    elementTexte.textContent = message;
    fenetre.classList.toggle('grande-finale', !!finale);
    const fermerFenetre = () => {
        if (fenetre.open)
            fenetre.close();
        fenetre.classList.remove('grande-finale');
    };
    fermer.onclick = fermerFenetre;
    boutonContinuer.onclick = fermerFenetre;
    fenetre.oncancel = evenement => {
        evenement.preventDefault();
        fermerFenetre();
    };
    if (!fenetre.open)
        fenetre.showModal();
    requestAnimationFrame(() => boutonContinuer.focus({ preventScroll: true }));
    return fenetre;
}
function obtenirCelebrationEtape(etape, jokerUtilise, evaluationDeverrouillee = false) {
    const etapeProgramme = Number(etape);
    if (jokerUtilise) {
        return {
            titre: `Étape ${etapeProgramme} explorée`,
            message: `Ton carnet avance. Tu pourras rejouer cette étape sans aide pour consolider sa maîtrise.`,
            confetti: false
        };
    }
    const titreSymbolique = obtenirTitreSymboliqueParcours(compterEtapesMaitrisees());
    if (evaluationDeverrouillee) {
        return {
            titre: 'Destination finale atteinte !',
            message: `Les onze étapes de ce parcours sont validées en autonomie. Ton carnet te reconnaît comme « ${titreSymbolique} » et l’évaluation finale est maintenant ouverte.`,
            confetti: true
        };
    }
    return {
        titre: `Étape ${etapeProgramme} terminée sans joker !`,
        message: `Toutes les questions de cette étape ont été validées sans joker. Ton titre actuel : « ${titreSymbolique} ». Le chemin continue vers l’étape suivante.`,
        confetti: true
    };
}
function sessionAUtiliseJoker() {
    if (etat.jokersSessionActifs === false)
        return false;
    return etat.sessionAvecJoker === true;
}
function obtenirContexteFinSession() {
    if (etat.mode === 'evaluation-finale')
        return 'Étape 12 · Évaluation finale';
    if (etat.mode === 'parcours') {
        const etapeProgramme = obtenirEtapeProgramme(etat.theme, etat.etape);
        return `Étape ${etat.etape}${etapeProgramme?.titre ? ' · ' + etapeProgramme.titre : ''}`;
    }
    if (etat.mode === 'revision')
        return 'Révision des erreurs';
    return 'Entraînement libre';
}
function obtenirStatutErreurBilan(reponse, estQuestionPassee) {
    if (estQuestionPassee)
        return 'Activité passée';
    if (reponse?.statut === 'aidee') {
        if (reponse.precisions?.aideUtilisee)
            return 'Réussite avec joker — à reprendre';
        if ((reponse.precisions?.tentatives || 0) > 0)
            return 'Réussite après une nouvelle tentative — à consolider';
        return 'Réussite avec aide — à consolider';
    }
    return 'Réponse incorrecte';
}
function afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees) {
    const zone = selectionner('#listeErreursBilan');
    const nombre = selectionner('#nombreErreursBilan');
    const boutonContinuer = selectionner('#boutonContinuer');
    const boutonRejouer = selectionner('#boutonRejouerMesErreurs');
    const aDesQuestionsAReprendre = questionsAReprendre.length > 0;
    boutonContinuer?.classList.toggle('principal', !aDesQuestionsAReprendre);
    boutonContinuer?.classList.toggle('secondaire', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('principal', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('secondaire', !aDesQuestionsAReprendre);
    if (nombre)
        nombre.textContent = `${questionsAReprendre.length} question${questionsAReprendre.length === 1 ? '' : 's'} à reprendre`;
    if (!zone)
        return;
    const regleLecture = `<div class="bilan-correction-regle">
    <strong>À savoir</strong>
    <span>Les questions passées sont listées sans dévoiler leur réponse. La correction apparaît seulement lorsqu’une réponse a été tentée et qu’elle était incorrecte.</span>
  </div>`;
    const accordActivitesPassees = nombreQuestionsPassees === 1 ? '' : 's';
    const sujetActivitesPassees = nombreQuestionsPassees > 1 ? 'Elles ne comptent' : 'Elle ne compte';
    const accordRealisees = nombreQuestionsPassees === 1 ? '' : 's';
    const informationReponsesCachees = nombreQuestionsPassees > 1
        ? 'Leurs réponses restent cachées.'
        : 'Sa réponse reste cachée.';
    const informationPassage = nombreQuestionsPassees
        ? `<div class="bilan-passage-information">
        <b>${nombreQuestionsPassees} activité${accordActivitesPassees} passée${accordActivitesPassees}</b>
        <span>${sujetActivitesPassees} pas comme réalisée${accordRealisees} pour la maîtrise de l’étape. ${informationReponsesCachees}</span>
      </div>`
        : '';
    if (!questionsAReprendre.length) {
        zone.innerHTML = regleLecture
            + informationPassage
            + '<div class="bilan-parfait">'
            + '<span aria-hidden="true">✓</span>'
            + '<div><h3>Aucune question à reprendre</h3>'
            + '<p>Toutes les activités de cette session ont été réussies de manière autonome.</p>'
            + '</div></div>';
        return;
    }
    zone.innerHTML = regleLecture + informationPassage + `<div class="bilan-erreurs-liste">${questionsAReprendre.map((question, indice) => {
        const reponse = etat.reponsesSession.get(question.id);
        const estPassee = etat.questionsPassees?.has(question.id) || reponse?.statut === 'passee';
        const contenuResultat = estPassee
            ? `<div class="bilan-reponse-passee">
          <strong>Réponse non dévoilée</strong>
          <span>Tu as passé cette question sans proposer de réponse. Rejoue-la pour essayer de trouver la solution.</span>
        </div>`
            : `<div class="bilan-attendue-reponse">${construireCorrectionDetaillee(question, echapperHtml)}</div>`;
        return `<article class="bilan-erreur-element ${estPassee ? 'bilan-erreur-passee' : ''}">
      <div class="bilan-erreur-numero" aria-hidden="true">${indice + 1}</div>
      <div class="bilan-erreur-corps">
        <div class="bilan-erreur-meta"><span>Question ${question.id}</span><strong>${obtenirStatutErreurBilan(reponse, estPassee)}</strong></div>
        <h3>${echapperHtml(nettoyerEnonce(question))}</h3>
        ${contenuResultat}
      </div>
    </article>`;
    }).join('')}</div>`;
}
function mettreAJourProgressionFinSession(pourcentage, nombreQuestionsPassees, jokerUtilise) {
    let evaluationFinaleReussie = false;
    let celebration = null;
    if (etat.mode === 'parcours') {
        const bilanEtape = obtenirBilanEtape(etat.theme, etat.etape);
        bilanEtape.meilleurScore = Math.max(bilanEtape.meilleurScore || 0, pourcentage);
        bilanEtape.nombreTentatives = (bilanEtape.nombreTentatives || 0) + 1;
        const etapeTerminee = !etapeNecessiteAutreChapitre(etat.theme, etat.etape)
            && nombreQuestionsPassees === 0;
        if (etapeTerminee) {
            const questionsEtape = obtenirQuestionsEtape(etat.theme, etat.etape);
            const toutesReussiesEnAutonomie = questionsEtape.length > 0
                && questionsEtape.every(question => bilanEtape.resultats?.[question.id] === true);
            const etaitDejaValideeSansJoker = bilanEtape.termineeSansJoker === true;
            bilanEtape.termineeSansJoker = etaitDejaValideeSansJoker || toutesReussiesEnAutonomie;
            bilanEtape.jokersUtilises = !bilanEtape.termineeSansJoker;
            const validationsSansJoker = bilanEtape.validationsSansJoker || {};
            const toutesValideesSansJoker = questionsEtape.length > 0
                && questionsEtape.every(question => validationsSansJoker[question.id] === true);
            const celebrationDejaAffichee = bilanEtape.celebrationSansJokerAffichee === true;
            if (toutesValideesSansJoker && !celebrationDejaAffichee) {
                // Mémoriser avant les calculs globaux : ceux-ci réinitialisent les objets
                // de progression pour garantir leur structure et pourraient sinon perdre
                // le drapeau porté par l'ancienne référence JavaScript.
                bilanEtape.celebrationSansJokerAffichee = true;
                const evaluationDeverrouillee = estProgrammeMaitrise(etat.theme);
                celebration = obtenirCelebrationEtape(etat.etape, false, evaluationDeverrouillee);
            }
        }
    }
    if (etat.mode === 'evaluation-finale') {
        const seuil = obtenirSeuilMaitrise();
        const evaluation = obtenirEvaluationFinaleTheme(etat.theme);
        evaluation.meilleurScore = Math.max(evaluation.meilleurScore || 0, pourcentage);
        evaluation.nombreTentatives = (evaluation.nombreTentatives || 0) + 1;
        evaluationFinaleReussie = pourcentage >= seuil && nombreQuestionsPassees === 0;
        evaluation.reussie = Boolean(evaluation.reussie) || evaluationFinaleReussie;
    }
    return { evaluationFinaleReussie, celebration };
}
function construireBilanEvaluationFinale(pourcentage, evaluationFinaleReussie) {
    const numeroParcours = obtenirOrdreTheme(etat.theme) + 1;
    if (evaluationFinaleReussie) {
        const toutReussi = estParcoursCompletReussi();
        return {
            titre: `Évaluation du parcours ${numeroParcours} terminée`,
            messageResultat: `Résultat : ${pourcentage} %. Les connaissances de ce parcours sont validées.`,
            celebration: toutReussi ? {
                titre: 'Parcours complet accompli !',
                message: `Tu as validé les ${THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0)} étapes et réussi les ${THEMES.length} évaluations finales. Ton carnet PJJoue est complet.`,
                confetti: true,
                finale: true
            } : {
                titre: `Parcours ${numeroParcours} validé !`,
                message: (() => {
                    const prochainTheme = THEMES[numeroParcours];
                    if (!prochainTheme) return 'L’évaluation de ce parcours est validée.';
                    const titreSuivant = (PROGRAMMES[prochainTheme.id]?.titre || prochainTheme.titre || `Parcours ${numeroParcours + 1}`).replace(/^Parcours \d+ ·\s*/, '');
                    return `Ce parcours est validé. Le parcours ${numeroParcours + 1} « ${titreSuivant} » est maintenant ta prochaine destination.`;
                })(),
                confetti: true,
                finale: false
            }
        };
    }
    jouerSonErreur();
    return {
        titre: `Évaluation du parcours ${numeroParcours} terminée`,
        messageResultat: `Résultat : ${pourcentage} %. Le seuil attendu est de ${obtenirSeuilMaitrise()} %.`,
        celebration: null
    };
}
function construireBilanSessionOrdinaire({
    pourcentage,
    nombreQuestionsPassees,
    nombreReponsesAidees,
    jokerUtilise,
    celebration
}) {
    const titre = jokerUtilise
        ? 'Session terminée avec jokers'
        : 'Session terminée sans joker';
    const autonomes = `${etat.score} réussite${etat.score === 1 ? '' : 's'} autonome${etat.score === 1 ? '' : 's'}`;
    const reussitesAidees = `${nombreReponsesAidees} réussite${nombreReponsesAidees === 1 ? '' : 's'} avec aide`;
    let messageResultat;
    if (nombreQuestionsPassees > 0) {
        const activitesPassees = `${nombreQuestionsPassees} activité${nombreQuestionsPassees === 1 ? '' : 's'} passée${nombreQuestionsPassees === 1 ? '' : 's'}`;
        messageResultat = `${autonomes}, ${reussitesAidees} et ${activitesPassees}. Les activités à reprendre sont détaillées ci-dessous.`;
        jouerSonReussite();
    }
    else if (etat.mode === 'parcours') {
        const conclusion = jokerUtilise
            ? 'Les réponses aidées rejoignent la révision.'
            : 'L’étape a été réalisée sans utiliser de joker.';
        messageResultat = `${autonomes} et ${reussitesAidees}. ${conclusion}`;
        if (!celebration?.confetti)
            jouerSonReussite();
    }
    else if (pourcentage >= 80) {
        messageResultat = `${autonomes} et ${reussitesAidees}. Les erreurs restent disponibles dans la révision.`;
        jouerSonReussite();
    }
    else {
        messageResultat = `${autonomes} et ${reussitesAidees}. Reprends les réponses attendues ci-dessous, puis rejoue les activités concernées.`;
        jouerSonErreur();
    }
    return { titre, messageResultat, celebration };
}
function configurerBoutonContinuerBilan() {
    const boutonContinuer = selectionner('#boutonContinuer');
    if (!boutonContinuer)
        return;
    const programme = PROGRAMMES[etat.theme];
    if (etat.mode === 'evaluation-finale') {
        const evaluationReussie = estEvaluationFinaleReussie(etat.theme);
        const indexTheme = obtenirOrdreTheme(etat.theme);
        const themeSuivant = THEMES[indexTheme + 1]?.id;
        if (evaluationReussie && themeSuivant) {
            boutonContinuer.textContent = `Commencer le parcours ${indexTheme + 2} →`;
            boutonContinuer.onclick = () => ouvrirParcours(themeSuivant, { remplacerHistorique: true });
        }
        else if (evaluationReussie && estParcoursCompletReussi()) {
            boutonContinuer.textContent = 'Voir le carnet complet →';
            boutonContinuer.onclick = () => afficherEcran('carnet', { remplacerHistorique: true });
        }
        else {
            boutonContinuer.textContent = 'Refaire cette évaluation';
            boutonContinuer.onclick = () => lancerEvaluationFinale(etat.theme);
        }
        return;
    }
    if (etat.mode === 'parcours') {
        const etapeCourante = Number(etat.etape);
        const nombreEtapes = programme?.etapes?.length || 11;
        if (etapeNecessiteAutreChapitre(etat.theme, etat.etape))
            boutonContinuer.textContent = 'Continuer l’étape →';
        else if (etapeCourante < nombreEtapes)
            boutonContinuer.textContent = `Passer à l’étape ${etapeCourante + 1} →`;
        else
            boutonContinuer.textContent = 'Retour au parcours →';
        boutonContinuer.onclick = () => {
            if (etapeNecessiteAutreChapitre(etat.theme, etat.etape)) {
                lancerEtape(etat.theme, etat.etape);
                return;
            }
            if (etapeCourante < nombreEtapes) {
                lancerTransitionVersEtape(etat.theme, etapeCourante + 1);
                return;
            }
            ouvrirParcours(etat.theme, { remplacerHistorique: true });
        };
        return;
    }
    boutonContinuer.textContent = 'Retour à l’accueil';
    boutonContinuer.onclick = () => afficherEcran('accueil');
}
function lancerTransitionVersEtape(identifiantTheme, numeroEtape) {
    clearTimeout(minuteurTransitionParcours);
    ouvrirParcours(identifiantTheme, { remplacerHistorique: true });
    const ecranParcours = selectionner('#parcours');
    const carteDestination = ecranParcours?.querySelector(`[data-etape="${numeroEtape}"]`);
    ecranParcours?.classList.add('transition-vers-etape');
    carteDestination?.classList.add('destination-en-vue');
    carteDestination?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    minuteurTransitionParcours = setTimeout(() => {
        ecranParcours?.classList.remove('transition-vers-etape');
        carteDestination?.classList.remove('destination-en-vue');
        lancerEtape(identifiantTheme, numeroEtape);
    }, 900);
}
function actualiserProchaineDestinationBilan() {
    const destination = selectionner('#prochaineDestinationBilan');
    if (!destination)
        return;
    if (etat.mode === 'evaluation-finale') {
        const indexTheme = obtenirOrdreTheme(etat.theme);
        const suivant = THEMES[indexTheme + 1];
        destination.textContent = estEvaluationFinaleReussie(etat.theme) && suivant
            ? `Prochaine destination : parcours ${indexTheme + 2} · ${PROGRAMMES[suivant.id].titre}.`
            : (estParcoursCompletReussi() ? 'Ton parcours complet est validé.' : 'Tu peux retravailler les erreurs puis refaire cette évaluation.');
        return;
    }
    if (etat.mode === 'parcours') {
        if (etapeNecessiteAutreChapitre(etat.theme, etat.etape)) {
            destination.textContent = `Reprends les activités non maîtrisées de l’étape ${etat.etape}.`;
            return;
        }
        const programme = PROGRAMMES[etat.theme];
        if (Number(etat.etape) < programme.etapes.length) {
            const prochaineEtape = obtenirEtapeProgramme(etat.theme, Number(etat.etape) + 1);
            destination.textContent = `Étape ${prochaineEtape.id} · ${prochaineEtape.titre}`;
            return;
        }
        destination.textContent = 'Retourne au parcours : son évaluation finale devient disponible dès que les 11 étapes sont terminées.';
        return;
    }
    if (etat.mode === 'revision') {
        destination.textContent = 'Continue la révision pour consolider les activités encore fragiles.';
        return;
    }
    destination.textContent = 'Choisis une nouvelle session ou rejoins le parcours guidé.';
}
function ouvrirSouvenirDepuisCarteFinale(identifiantTheme, numeroEtape) {
    afficherEcran('carnet', { remplacerHistorique: true });
    requestAnimationFrame(() => {
        const souvenir = selectionner(`#souvenirsParcours [data-theme="${identifiantTheme}"][data-etape="${numeroEtape}"]`);
        if (!souvenir)
            return;
        souvenir.open = true;
        souvenir.scrollIntoView({ behavior: 'smooth', block: 'center' });
        souvenir.querySelector('summary')?.focus({ preventScroll: true });
    });
}
function afficherCarteVoyageFinale() {
    const carte = selectionner('#carteVoyageFinale');
    const destinations = selectionner('#destinationsVoyageFinal');
    const doitAfficher = etat.mode === 'evaluation-finale' && estParcoursCompletReussi();
    if (!carte || !destinations)
        return;
    carte.classList.toggle('masque', !doitAfficher);
    destinations.innerHTML = '';
    if (!doitAfficher)
        return;
    THEMES.forEach((theme, indexTheme) => {
        PROGRAMMES[theme.id].etapes.forEach(etapeProgramme => {
            const bouton = document.createElement('button');
            bouton.type = 'button';
            bouton.className = 'carte-voyage-etape';
            bouton.style.setProperty('--couleur-etape', etapeProgramme.couleur || '#2d7379');
            bouton.innerHTML = `${obtenirBaliseIconeEtape(etapeProgramme.id, theme.id)}<span>P${indexTheme + 1}·${etapeProgramme.id}</span>`;
            bouton.setAttribute('aria-label', `Ouvrir les souvenirs du parcours ${indexTheme + 1}, étape ${etapeProgramme.id} · ${etapeProgramme.titre}`);
            bouton.onclick = () => ouvrirSouvenirDepuisCarteFinale(theme.id, etapeProgramme.id);
            destinations.appendChild(bouton);
        });
        const finaleParcours = document.createElement('span');
        finaleParcours.className = 'carte-voyage-etape carte-voyage-evaluation';
        finaleParcours.innerHTML = `<span aria-hidden="true">★</span><strong>P${indexTheme + 1}</strong>`;
        finaleParcours.setAttribute('role', 'img');
        finaleParcours.setAttribute('aria-label', `Évaluation finale du parcours ${indexTheme + 1} réussie`);
        destinations.appendChild(finaleParcours);
    });
}
function lancerCelebrationBilan(celebration) {
    if (!celebration)
        return;
    setTimeout(() => {
        const coucheCelebration = afficherCelebration(celebration);
        if (!celebration.confetti)
            return;
        requestAnimationFrame(() => {
            lancerConfettis(
                celebration.finale ? 3 : 1,
                coucheCelebration || document.body
            );
            if (celebration.finale)
                jouerSonEvaluationFinale();
            else
                jouerSonEtapeSansJoker();
        });
    }, 180);
}
function terminerSession() {
    if (estSessionMissionSigles()) {
        terminerSessionMissionSiglesNative();
        return;
    }
    clearInterval(etat.identifiantMinuteur);
    const total = etat.questionsSession.length;
    const nombreQuestionsPassees = etat.questionsPassees?.size || 0;
    const pourcentage = total ? Math.round(etat.score / total * 100) : 0;
    const gain = etat.score * 4 + etat.meilleureSerie * 2;
    const nombreReponsesAidees = etat.nombreReponsesAidees || 0;
    const jokerUtilise = sessionAUtiliseJoker();
    sauvegarde.xp = (sauvegarde.xp || 0) + gain;
    const progression = mettreAJourProgressionFinSession(
        pourcentage,
        nombreQuestionsPassees,
        jokerUtilise
    );
    const bilan = etat.mode === 'evaluation-finale'
        ? construireBilanEvaluationFinale(pourcentage, progression.evaluationFinaleReussie)
        : construireBilanSessionOrdinaire({
            pourcentage,
            nombreQuestionsPassees,
            nombreReponsesAidees,
            jokerUtilise,
            celebration: progression.celebration
        });
    envoyerEvenementPJJ('session_terminee', {
        ...obtenirContexteSessionAnalytics(),
        pjjoue_score: pourcentage,
        pjjoue_reussites_autonomes: etat.score,
        pjjoue_questions_passees: nombreQuestionsPassees,
        pjjoue_reussites_avec_aide: nombreReponsesAidees,
        pjjoue_joker_utilise_session: jokerUtilise ? 'Oui' : 'Non',
        pjjoue_duree_session_secondes: obtenirDureeSessionAnalytics(),
        pjjoue_resultat_session: etat.mode === 'evaluation-finale'
            ? (progression.evaluationFinaleReussie ? 'Évaluation réussie' : 'Évaluation terminée')
            : 'Session terminée'
    });
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent = pourcentage + '%';
    selectionner('#bonnesReponsesBilan').textContent = etat.score + '/' + total;
    selectionner('#meilleureSerieBilan').textContent = etat.meilleureSerie;
    selectionner('#gainExperienceBilan').textContent = '+' + gain;
    selectionner('#contexteBilan').textContent = obtenirContexteFinSession();
    selectionner('#titreBilan').textContent = bilan.titre;
    selectionner('#rangBilan').textContent = bilan.messageResultat;
    const questionsAReprendre = etat.questionsSession.filter(question =>
        etat.erreursSession.has(question.id)
    );
    afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees);
    configurerBoutonContinuerBilan();
    actualiserProchaineDestinationBilan();
    afficherCarteVoyageFinale();
    effacerSessionEnCours();
    afficherEcran('bilan', { remplacerHistorique: true });
    actualiserAccueil();
    lancerCelebrationBilan(bilan.celebration);
}
function afficherEtatVideErreurs(zone, aucunePartieJouee) {
    if (aucunePartieJouee) {
        zone.innerHTML = `<div class="revision-vide">
            <span class="revision-vide-icone" aria-hidden="true">↺</span>
            <span class="surtitre">Révision</span>
            <h2>Tu n’as pas encore joué.</h2>
            <p>Commence un parcours : les erreurs à consolider apparaîtront ici automatiquement.</p>
            <button class="principal" data-action="ouvrir-parcours-depuis-erreurs">Commencer un parcours →</button>
        </div>`;
        return;
    }
    zone.innerHTML = `<div class="revision-vide revision-vide-ok">
        <span class="revision-vide-icone" aria-hidden="true">✓</span>
        <span class="surtitre">À jour</span>
        <h2>Aucune erreur active.</h2>
        <p>Tout ce qui avait besoin d’être retravaillé a été consolidé.</p>
    </div>`;
}
function obtenirQuestionsAvecErreursActives() {
    return Object.entries(sauvegarde.erreurs || {})
        .filter(([_identifiantQuestion, suiviErreur]) => !suiviErreur.maitrisee)
        .map(([identifiantQuestion, suiviErreur]) => ({
            question: QUESTIONS.find(question => question.id === Number(identifiantQuestion)),
            suiviErreur
        }))
        .filter(element => element.question && !element.question.estEvaluationFinale);
}
function regrouperErreursParParcoursEtEtape(elements) {
    const resultat = {};
    elements.forEach(element => {
        const theme = element.question.theme;
        const numeroEtape = Number(element.question.etape);
        resultat[theme] = resultat[theme] || {};
        (resultat[theme][numeroEtape] = resultat[theme][numeroEtape] || []).push(element);
    });
    return resultat;
}
function construireBoutonsRevisionParcours(groupes) {
    return THEMES.map((theme, index) => {
        const total = Object.values(groupes[theme.id] || {}).reduce((somme, liste) => somme + liste.length, 0);
        if (!total)
            return '';
        const identite = obtenirIdentiteParcours(theme.id);
        return `<button class="revision-parcours-bouton" data-action="reviser-theme" data-theme="${theme.id}" style="--parcours-accent:${identite.couleur};--parcours-accent-rgb:${identite.couleurRgb}">
            <span class="revision-parcours-numero">${String(index + 1).padStart(2, '0')}</span>
            <span class="revision-parcours-texte"><strong>${identite.titre}</strong><small>${total} ${accorderLibelle(total, 'erreur', 'erreurs')}</small></span>
            <span class="revision-parcours-action">Réviser →</span>
        </button>`;
    }).join('');
}
function construireBoutonsRevisionParEtape(groupes) {
    return THEMES.map((theme, index) => {
        const erreursParEtape = groupes[theme.id] || {};
        return Object.keys(erreursParEtape).sort((a, b) => Number(a) - Number(b)).map(numeroEtape => {
            const total = erreursParEtape[numeroEtape].length;
            return `<button class="revision-etape-bouton" data-action="reviser-etape" data-theme="${theme.id}" data-etape="${numeroEtape}">
                <span>P${index + 1} · Étape ${numeroEtape}</span><strong>${total}</strong>
            </button>`;
        }).join('');
    }).join('');
}
function construireModesRevisionErreurs(total, groupes) {
    const libelleErreurs = accorderLibelle(total, 'erreur active', 'erreurs actives');
    return `<div class="revision-workspace">
        <article class="revision-toutes-erreurs">
            <div class="revision-toutes-erreurs-icone" aria-hidden="true">↻</div>
            <div class="revision-toutes-erreurs-texte">
                <span class="surtitre">Révision rapide</span>
                <h2>Mélange mes erreurs</h2>
                <p>Une session aléatoire avec tes ${total} ${libelleErreurs}, tous parcours confondus.</p>
            </div>
            <button class="principal" data-action="reviser-toutes-erreurs">Lancer ${total} ${total > 1 ? 'questions' : 'question'} →</button>
        </article>

        <section class="revision-choix" aria-labelledby="titreRevisionParcours">
            <div class="revision-section-entete">
                <div><span class="surtitre">Cibler</span><h2 id="titreRevisionParcours">Choisis ce que tu veux renforcer</h2></div>
                <p>Un parcours complet ou une étape précise.</p>
            </div>
            <div class="revision-parcours-boutons">${construireBoutonsRevisionParcours(groupes)}</div>
            <details class="revision-etapes-details">
                <summary>Choisir directement une étape</summary>
                <div class="revision-etape-boutons">${construireBoutonsRevisionParEtape(groupes)}</div>
            </details>
        </section>
    </div>`;
}
function construireListeErreursEtape(theme, numeroEtape, elements) {
    const titreEtape = obtenirEtapeProgramme(theme, numeroEtape)?.titre || '';
    const cartes = elements.map(({ question, suiviErreur }) => `
        <li class="revision-erreur-ligne">
            <span>${question.enonce.split('\n')[0]}</span>
            <small>Ratée ${suiviErreur.nombreErreurs || 1} fois · à revoir jusqu’à réussite</small>
        </li>`).join('');
    return `<div class="revision-etape-groupe">
        <div class="revision-etape-groupe-entete"><strong>Étape ${numeroEtape} · ${titreEtape}</strong><span>${elements.length}</span></div>
        <ul>${cartes}</ul>
    </div>`;
}
function construireParcoursErreurs(groupes) {
    const dossiers = THEMES.map((theme, index) => {
        const erreursParEtape = groupes[theme.id] || {};
        const total = Object.values(erreursParEtape).reduce((somme, liste) => somme + liste.length, 0);
        if (!total)
            return '';
        const identite = obtenirIdentiteParcours(theme.id);
        const etapes = Object.keys(erreursParEtape)
            .sort((a, b) => Number(a) - Number(b))
            .map(numero => construireListeErreursEtape(theme.id, numero, erreursParEtape[numero]))
            .join('');
        return `<details class="revision-dossier" style="--parcours-accent:${identite.couleur};--parcours-accent-rgb:${identite.couleurRgb}">
            <summary>
                <span class="revision-dossier-numero">${String(index + 1).padStart(2, '0')}</span>
                <span><strong>${identite.titre}</strong><small>${total} ${accorderLibelle(total, 'erreur active', 'erreurs actives')}</small></span>
                <span class="revision-dossier-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div class="revision-dossier-contenu">${etapes}</div>
        </details>`;
    }).join('');
    return `<section class="revision-inventaire" aria-labelledby="titreInventaireErreurs">
        <div class="revision-section-entete"><div><span class="surtitre">Détail</span><h2 id="titreInventaireErreurs">Tes erreurs actives</h2></div><p>Consulte les questions qui restent à consolider, parcours par parcours.</p></div>
        <div class="revision-dossiers">${dossiers}</div>
    </section>`;
}
function afficherErreurs() {
    const zone = selectionner('#contenuErreurs');
    const questionsAvecErreurs = obtenirQuestionsAvecErreursActives();
    if (questionsAvecErreurs.length === 0) {
        afficherEtatVideErreurs(zone, !sauvegarde.aDejaJoue);
        return;
    }
    const groupes = regrouperErreursParParcoursEtEtape(questionsAvecErreurs);
    zone.innerHTML = construireModesRevisionErreurs(questionsAvecErreurs.length, groupes) + construireParcoursErreurs(groupes);
}

function normaliserRechercheSupports(texte) {
    return String(texte || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}
const PARCOURS_PAR_CATEGORIE_SUPPORT = Object.freeze({
    'supports-reperes-pjj': ['1', '4'],
    'supports-je': ['2', '4', '6'],
    'supports-tpe': ['2', '4', '5', '6'],
    'supports-ji': ['3'],
    'supports-jld': ['3'],
    'supports-cam': ['5'],
    'supports-jap': ['6'],
    'supports-transversaux': ['2', '3', '4', '5', '6']
});
function obtenirIndexRechercheCategorie(categorie) {
    const titreCategorie = categorie.querySelector(':scope > summary')?.textContent || '';
    const motsCles = categorie.dataset.motsCles || '';
    const parcours = (categorie.dataset.parcoursSupports || '')
        .split(' ')
        .filter(Boolean)
        .map(numero => `P${numero} parcours ${numero}`)
        .join(' ');
    return normaliserRechercheSupports(`${titreCategorie} ${motsCles} ${parcours}`);
}
function obtenirIndexRechercheSupport(categorie, ressource) {
    return normaliserRechercheSupports(`${obtenirIndexRechercheCategorie(categorie)} ${ressource.textContent}`);
}
function correspondARechercheSupport(indexRecherche, termesRecherches) {
    if (!termesRecherches.length)
        return true;
    const motsIndex = new Set(indexRecherche.split(' ').filter(Boolean));
    return termesRecherches.every(terme => terme.length <= 3
        ? motsIndex.has(terme)
        : indexRecherche.includes(terme));
}
function synchroniserFiltreSupports(zone, filtre) {
    const filtreActif = filtre || 'tous';
    zone.dataset.filtreSupports = filtreActif;
    zone.querySelectorAll('[data-filtre-supports]').forEach(bouton => {
        const actif = bouton.dataset.filtreSupports === filtreActif;
        bouton.classList.toggle('actif', actif);
        bouton.setAttribute('aria-pressed', actif ? 'true' : 'false');
    });
}
function synchroniserOuvertureSupports(zone) {
    zone.querySelectorAll('.supports-juridiction').forEach(categorie => {
        const action = categorie.querySelector(':scope > summary .support-juridiction-action');
        if (action)
            action.textContent = categorie.open ? 'Fermer' : 'Ouvrir';
    });
    const boutonRefermer = selectionner('#boutonRefermerSupports');
    if (boutonRefermer)
        boutonRefermer.disabled = !zone.querySelector('details[open]');
}
function initialiserClassementSupports() {
    const zone = selectionner('#supports');
    if (!zone || zone.dataset.classementInitialise === 'true')
        return;
    zone.dataset.classementInitialise = 'true';
    zone.querySelectorAll('.supports-juridiction').forEach(categorie => {
        const parcours = PARCOURS_PAR_CATEGORIE_SUPPORT[categorie.id] || [];
        categorie.dataset.parcoursSupports = parcours.join(' ');
        const titre = categorie.querySelector('.support-juridiction-titre');
        if (!titre || !parcours.length)
            return;
        const badges = document.createElement('span');
        badges.className = 'supports-parcours-badges';
        badges.innerHTML = parcours.map(numero => `<i class="support-parcours-badge support-parcours-${numero}">P${numero}</i>`).join('');
        titre.appendChild(badges);
    });
}
function appliquerRechercheSupports() {
    const zone = selectionner('#supports');
    const champ = selectionner('#rechercheSupports');
    if (!zone || !champ)
        return;
    const recherche = normaliserRechercheSupports(champ.value);
    const termesRecherches = recherche.split(' ').filter(Boolean);
    const filtre = zone.dataset.filtreSupports || 'tous';
    let categoriesVisibles = 0;
    let ressourcesVisibles = 0;
    const categories = [...zone.querySelectorAll('.supports-juridiction')];
    const correspondancesDirectes = new Map(categories.map(categorie => [
        categorie,
        correspondARechercheSupport(obtenirIndexRechercheCategorie(categorie), termesRecherches)
    ]));
    const rechercheCourte = termesRecherches.length === 1 && termesRecherches[0].length <= 3;
    const limiterAuxCategoriesDirectes = rechercheCourte
        && [...correspondancesDirectes.values()].some(Boolean);
    categories.forEach((categorie, ordreInitial) => {
        const correspondAuFiltre = filtre === 'tous'
            || (categorie.dataset.parcoursSupports || '').split(' ').includes(filtre);
        const correspondDirectement = correspondancesDirectes.get(categorie);
        let ressourcesCorrespondantes = 0;
        categorie.querySelectorAll(':scope > .supports-juridiction-contenu > .support-revision').forEach(ressource => {
            const indexRecherche = obtenirIndexRechercheSupport(categorie, ressource);
            const correspond = !termesRecherches.length
                || correspondDirectement
                || (!limiterAuxCategoriesDirectes && correspondARechercheSupport(indexRecherche, termesRecherches));
            ressource.classList.toggle('masque-recherche-support', !correspond);
            if (correspond)
                ressourcesCorrespondantes += 1;
        });
        const categorieVisible = correspondAuFiltre && ressourcesCorrespondantes > 0;
        categorie.classList.toggle('masque-recherche-support', !categorieVisible);
        categorie.style.order = termesRecherches.length
            ? String((correspondDirectement ? 0 : categories.length) + ordreInitial)
            : '';
        if (categorieVisible) {
            categoriesVisibles += 1;
            ressourcesVisibles += ressourcesCorrespondantes;
            if (termesRecherches.length)
                categorie.open = true;
        }
    });
    const statut = selectionner('#statutRechercheSupports');
    if (statut)
        statut.textContent = ressourcesVisibles
            ? `${categoriesVisibles} ${accorderLibelle(categoriesVisibles, 'catégorie', 'catégories')} · ${ressourcesVisibles} ${accorderLibelle(ressourcesVisibles, 'ressource', 'ressources')}`
            : 'Aucune ressource ne correspond à cette recherche.';
    synchroniserOuvertureSupports(zone);
}
function rechercherDansSupportsFiltres() {
    appliquerRechercheSupports();
}
function initialiserRechercheSupports() {
    const zone = selectionner('#supports');
    if (!zone || zone.dataset.rechercheInitialisee === 'true') {
        appliquerRechercheSupports();
        return;
    }
    zone.dataset.rechercheInitialisee = 'true';
    initialiserClassementSupports();
    const filtreInitial = zone.dataset.filtreSupports
        || zone.querySelector('[data-filtre-supports][aria-pressed="true"]')?.dataset.filtreSupports
        || 'tous';
    synchroniserFiltreSupports(zone, filtreInitial);
    const champ = selectionner('#rechercheSupports');
    champ?.addEventListener('input', rechercherDansSupportsFiltres);
    champ?.addEventListener('search', rechercherDansSupportsFiltres);
    zone.querySelectorAll('[data-filtre-supports]').forEach(bouton => bouton.addEventListener('click', () => {
        synchroniserFiltreSupports(zone, bouton.dataset.filtreSupports);
        appliquerRechercheSupports();
    }));
    zone.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
        synchroniserOuvertureSupports(zone);
    }));
    selectionner('#boutonRefermerSupports')?.addEventListener('click', () => {
        zone.querySelectorAll('details[open]').forEach(detail => detail.open = false);
        synchroniserOuvertureSupports(zone);
        selectionner('#rechercheSupports')?.focus();
    });
    appliquerRechercheSupports();
    synchroniserOuvertureSupports(zone);
}
const ETAPES_MISSION_SIGLES = Object.freeze({
    1: { numero:'01', titre:'Organisation de la PJJ', sousTitre:'Directions, fonctions et pilotage', couleur:'#4f8cff', couleurTexte:'#9fc2ff', couleurRgb:'79,140,255', icone:'organisation' },
    2: { numero:'02', titre:'Services, unités et formation', sousTitre:'Milieu ouvert, insertion et formation', couleur:'#d49a00', couleurTexte:'#ffd36a', couleurRgb:'212,154,0', icone:'services' },
    3: { numero:'03', titre:'Placement, hébergement et détention', sousTitre:'Structures et dispositifs de placement', couleur:'#0891b2', couleurTexte:'#70d7ea', couleurRgb:'8,145,178', icone:'placement' },
    4: { numero:'04', titre:'Justice, juridictions et procédure', sousTitre:'Acteurs judiciaires et repères de procédure', couleur:'#8b5cf6', couleurTexte:'#c7afff', couleurRgb:'139,92,246', icone:'justice' },
    5: { numero:'05', titre:'Mesures, sûreté et sanctions', sousTitre:'Mesures éducatives, sûreté et peines', couleur:'#e11d48', couleurTexte:'#ff91a8', couleurRgb:'225,29,72', icone:'mesures' },
    6: { numero:'06', titre:'Partenaires, publics et repères professionnels', sousTitre:'Partenaires et vocabulaire transversal', couleur:'#0f766e', couleurTexte:'#70d6ca', couleurRgb:'15,118,110', icone:'partenaires' }
});
const NOMBRE_SIGLES_PAR_ETAPE = 12;
const SEUIL_EVALUATION_SIGLES = 90;
const NOMBRE_QUESTIONS_EVALUATION_SIGLES = 30;

function creerEtatJeuSigles() {
    return {
        vue: 'accueil', mode: null, etape: null, titreSession: '',
        siglesSession: [], questions: [], indexQuestion: 0, score: 0,
        reponsesAutonomes: 0, reponsesAidees: 0, reponsesIncorrectes: 0,
        questionsPassees: 0, tentativesQuestion: 0, aideUtilisee: false,
        jokersActifs: true, questionValidee: false, configurationDerniereSession: null,
        tirageHasard: [], nombreTire: 0,
        chronoActif: false, secondesQuestion: 30, chronoRestant: 30, chronoIntervalle: null,
        celebrationEtapeADiffuser: null, evaluationReussie: false, evaluationParfaite: false
    };
}
let etatJeuSigles = creerEtatJeuSigles();

function selectionnerSigles(selecteur) { return document.querySelector(selecteur); }
function selectionnerTousSigles(selecteur) { return [...document.querySelectorAll(selecteur)]; }
function normaliserSigleJeu(sigle) { return String(sigle || '').trim().toUpperCase(); }
function obtenirSauvegardeJeuSigles() {
    if (!sauvegarde.siglesJeu) sauvegarde.siglesJeu = creerProgressionSiglesInitiale();
    return sauvegarde.siglesJeu;
}
function obtenirSigleJeu(sigle) { const cle = normaliserSigleJeu(sigle); return SIGLES.find(element => normaliserSigleJeu(element.sigle) === cle) || null; }
function obtenirSiglesEtape(numero) { return SIGLES.filter(element => Number(element.etape) === Number(numero)).sort((a,b) => Number(a.id)-Number(b.id)); }
function melangerSigles(tableau) {
    const copie = [...tableau];
    for (let i = copie.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copie[i], copie[j]] = [copie[j], copie[i]]; }
    return copie;
}
function choisirSansDoublon(tableau, nombre) { return melangerSigles(tableau).slice(0, Math.min(Math.max(0, nombre), tableau.length)); }
function sigleEstIntroduit(sigle) { return obtenirSauvegardeJeuSigles().decouverts[normaliserSigleJeu(sigle)] === true; }
function marquerSigleIntroduit(sigle) { obtenirSauvegardeJeuSigles().decouverts[normaliserSigleJeu(sigle)] = true; }
function obtenirEtatEtapeSigles(numero) {
    const jeu = obtenirSauvegardeJeuSigles(); const cle = String(numero);
    if (!jeu.etapes[cle]) jeu.etapes[cle] = creerProgressionSiglesInitiale().etapes[cle];
    return jeu.etapes[cle];
}
function compterMaitrisesEtapeSigles(numero) {
    const etape = obtenirEtatEtapeSigles(numero);
    return obtenirSiglesEtape(numero).filter(element => etape.autonomes[normaliserSigleJeu(element.sigle)] === true).length;
}
function compterValidationsSansJokerEtapeSigles(numero) {
    const etape = obtenirEtatEtapeSigles(numero);
    return obtenirSiglesEtape(numero).filter(element => etape.validationsSansJoker[normaliserSigleJeu(element.sigle)] === true).length;
}
function etapeSiglesMaitrisee(numero) { return compterMaitrisesEtapeSigles(numero) === NOMBRE_SIGLES_PAR_ETAPE; }
function evaluationSiglesDebloquee() { return [1,2,3,4,5,6].every(etapeSiglesMaitrisee); }
function obtenirErreursSiglesActives() {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs || {};
    return Object.entries(erreurs).filter(([,e]) => e?.active === true).map(([sigle]) => obtenirSigleJeu(sigle)).filter(Boolean);
}
function enregistrerErreurSigles(cibles) {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserSigleJeu(cible.sigle);
        const actuelle = erreurs[cle] || { active:false, nombreErreurs:0, reussitesRevision:0 };
        erreurs[cle] = { active:true, nombreErreurs:Number(actuelle.nombreErreurs||0)+1, reussitesRevision:0 };
    });
}
function validerRevisionSigles(cibles) {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserSigleJeu(cible.sigle);
        const actuelle = erreurs[cle];
        if (!actuelle?.active) return;
        // Comme dans Réviser PJJoue, une réussite autonome en révision suffit.
        actuelle.reussitesRevision = 1;
        actuelle.active = false;
    });
}

function iconeEtapeSigles(type) {
    const formes = {
        organisation:'<path d="M4 19h16M7 16V9h10v7M9 9V5h6v4M10 12h4"/>',
        services:'<path d="M4 20h16M6 20V8h12v12M9 8V4h6v4M9 12h2M13 12h2M9 16h2M13 16h2"/>',
        placement:'<path d="M4 11 12 5l8 6v9H4zM8 20v-6h8v6M9 10h6"/>',
        justice:'<path d="M12 4v16M6 7h12M7 7l-3 6h6zM17 7l-3 6h6zM8 20h8"/>',
        mesures:'<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6zM9 12l2 2 4-5"/>',
        partenaires:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-4 2-6 5-6s5 2 5 6M11 20c0-3 2-5 5-5s5 2 5 5"/>'
    };
    return `<svg viewBox="0 0 24 24" focusable="false">${formes[type] || formes.organisation}</svg>`;
}
function afficherVueSigles(nom) {
    const vues = { accueil:'#siglesAccueil', parcours:'#siglesParcoursVue', entrainement:'#siglesEntrainementVue', session:'#siglesSession', bilan:'#siglesBilan' };
    Object.entries(vues).forEach(([cle,selecteur]) => selectionnerSigles(selecteur)?.classList.toggle('masque', cle !== nom));
    etatJeuSigles.vue = nom;
    if (nom !== 'session') arreterChronoSigles();
    window.scrollTo?.({ top:0, behavior:'smooth' });
}

function actualiserAccueilSigles() {
    const jeu = obtenirSauvegardeJeuSigles();
    const introduits = Object.values(jeu.decouverts || {}).filter(Boolean).length;
    const maitrises = [1,2,3,4,5,6].reduce((total,n) => total + compterMaitrisesEtapeSigles(n), 0);
    const etapes = [1,2,3,4,5,6].filter(etapeSiglesMaitrisee).length;
    const erreurs = obtenirErreursSiglesActives().length;
    const pourcentage = Math.round(maitrises / SIGLES.length * 100);
    if (selectionnerSigles('#siglesResumeProgression')) selectionnerSigles('#siglesResumeProgression').textContent = `${maitrises} sigle${maitrises===1?'':'s'} maîtrisé${maitrises===1?'':'s'} · ${etapes} étape${etapes===1?'':'s'} maîtrisée${etapes===1?'':'s'}`;
    if (selectionnerSigles('#siglesNombreDecouverts')) selectionnerSigles('#siglesNombreDecouverts').textContent = introduits;
    if (selectionnerSigles('#siglesNombreMaitrises')) selectionnerSigles('#siglesNombreMaitrises').textContent = maitrises;
    if (selectionnerSigles('#siglesNombreErreurs')) selectionnerSigles('#siglesNombreErreurs').textContent = erreurs;
    if (selectionnerSigles('#siglesMeilleurScore')) selectionnerSigles('#siglesMeilleurScore').textContent = `${jeu.evaluation.meilleurScore || 0}%`;
    if (selectionnerSigles('#siglesJaugeValeur')) selectionnerSigles('#siglesJaugeValeur').style.width = `${pourcentage}%`;
    if (selectionnerSigles('#siglesProgressionGlobale')) selectionnerSigles('#siglesProgressionGlobale').setAttribute('aria-valuenow', String(pourcentage));
    if (selectionnerSigles('#siglesTexteRevision')) selectionnerSigles('#siglesTexteRevision').textContent = erreurs ? `${erreurs} sigle${erreurs===1?'':'s'} à consolider dans tes erreurs.` : 'Aucun sigle à revoir pour le moment.';
    construireCartesEtapesSigles(); actualiserCarteEvaluationSigles(); construireChoixPerimetreSigles();
}
function construireCartesEtapesSigles() {
    const zone = selectionnerSigles('#siglesEtapes'); if (!zone) return;
    zone.innerHTML = [1,2,3,4,5,6].map(numero => {
        const identite = ETAPES_MISSION_SIGLES[numero]; const maitrises = compterMaitrisesEtapeSigles(numero); const sansJoker = compterValidationsSansJokerEtapeSigles(numero); const pc = Math.round(maitrises/12*100);
        return `<button class="sigles-etape-carte" data-sigles-etape="${numero}" type="button" style="--sigles-etape-accent:${identite.couleur};--sigles-etape-accent-lisible:${identite.couleurTexte};--sigles-etape-rgb:${identite.couleurRgb}"><span class="sigles-etape-carte-entete"><span class="sigles-etape-icone" aria-hidden="true">${iconeEtapeSigles(identite.icone)}</span><span class="sigles-etape-numero">ÉTAPE ${identite.numero}</span></span><h3>${identite.titre}</h3><p>${identite.sousTitre}<br>12 sigles · 24 activités de parcours.</p><span class="sigles-etape-progression"><i style="width:${pc}%"></i></span><span class="sigles-etape-pied"><span>${maitrises}/12 maîtrisés · ${sansJoker}/12 sans joker</span><span>${maitrises===12?'Maîtrisée ✓':'Ouvrir →'}</span></span></button>`;
    }).join('');
    zone.querySelectorAll('[data-sigles-etape]').forEach(b => b.addEventListener('click', () => lancerEtapeSigles(Number(b.dataset.siglesEtape))));
}
function actualiserCarteEvaluationSigles() {
    const bouton = selectionnerSigles('#siglesLancerEvaluation'); const carte = selectionnerSigles('#siglesEvaluationCarte'); const statut = selectionnerSigles('#siglesEvaluationStatut'); const ok = evaluationSiglesDebloquee();
    if (bouton) { bouton.disabled = !ok; bouton.textContent = ok ? 'Commencer l’évaluation' : 'Maîtrise d’abord les 6 étapes'; }
    carte?.classList.toggle('verrouillee', !ok);
    if (statut) statut.textContent = ok ? 'Évaluation débloquée.' : 'Disponible après la maîtrise autonome des 6 étapes.';
}
function construireChoixPerimetreSigles() {
    const zone = selectionnerSigles('#siglesChoixPerimetre'); if (!zone) return;
    const actuel = zone.querySelector('[aria-pressed="true"]')?.dataset.perimetre || 'tous';
    zone.innerHTML = `<button class="choix-bouton entrainement-perimetre-global" data-perimetre="tous" type="button" style="--parcours-accent:#4f8cff;--parcours-accent-lisible:#9fc2ff;--parcours-accent-rgb:79,140,255"><b>Tous les sigles</b><span>Les 6 étapes</span></button>` + [1,2,3,4,5,6].map(n => { const e=ETAPES_MISSION_SIGLES[n]; return `<button class="choix-bouton" data-perimetre="${n}" type="button" style="--parcours-accent:${e.couleur};--parcours-accent-lisible:${e.couleurTexte};--parcours-accent-rgb:${e.couleurRgb}"><b>${e.numero} · ${e.titre}</b><span>12 sigles</span></button>`; }).join('');
    zone.querySelectorAll('button').forEach(b => { const actif = b.dataset.perimetre === actuel; b.classList.toggle('actif', actif); b.setAttribute('aria-pressed', actif?'true':'false'); b.addEventListener('click', () => { activerBoutonGroupeSigles(zone,b); actualiserDisponibiliteNombreSigles(); }); });
    actualiserDisponibiliteNombreSigles();
}
function activerBoutonGroupeSigles(zone, bouton) { zone?.querySelectorAll('button').forEach(b => { const actif=b===bouton; b.classList.toggle('actif',actif); b.setAttribute('aria-pressed',actif?'true':'false'); }); }
function valeurGroupeSigles(selecteur, attribut, defaut) { const actif = selectionnerSigles(`${selecteur} button[aria-pressed="true"]`); return actif?.dataset?.[attribut] ?? defaut; }
function actualiserDisponibiliteNombreSigles() {
    const perimetre = valeurGroupeSigles('#siglesChoixPerimetre','perimetre','tous'); const max = perimetre === 'tous' ? SIGLES.length : obtenirSiglesEtape(Number(perimetre)).length; const info=selectionnerSigles('#siglesNombreDisponible'); if(info) info.textContent=`${max} sigles disponibles dans ce périmètre.`;
    const zone=selectionnerSigles('#siglesChoixNombre'); if(!zone)return; let actif=zone.querySelector('[aria-pressed="true"]');
    zone.querySelectorAll('button').forEach(b=>{ const n=b.dataset.nombre==='tous'?max:Number(b.dataset.nombre); b.disabled=n>max; });
    if (actif?.disabled) { actif = [...zone.querySelectorAll('button:not(:disabled)')].pop(); if(actif) activerBoutonGroupeSigles(zone,actif); }
}
function actualiserChoixChronoSigles() { const avec = valeurGroupeSigles('#siglesChoixChrono','chrono','non') === 'oui'; selectionnerSigles('#siglesChoixSecondes')?.classList.toggle('masque', !avec); }

function creerFauxDeveloppementsIntroduction(cible, nombre=3) {
    const vrai = String(cible.signification || '').trim();
    const remplacements = [
        ['Protection', ['Prévention','Accompagnement','Coordination']],
        ['Direction', ['Délégation','Division','Mission']],
        ['Unité', ['Service','Équipe','Pôle']],
        ['Service', ['Unité','Mission','Pôle']],
        ['Établissement', ['Service','Centre','Unité']],
        ['Etablissement', ['Service','Centre','Unité']],
        ['Centre', ['Service','Établissement','Unité']],
        ['Mesure', ['Mission','Modalité','Dispositif']],
        ['Mise', ['Phase','Période','Mesure']],
        ['Juge', ['Magistrat','Tribunal','Délégué']],
        ['Cour', ['Tribunal','Chambre','Commission']],
        ['Tribunal', ['Commission','Chambre','Service']],
        ['Contrôle', ['Suivi','Cadre','Accompagnement']],
        ['Détention', ['Placement','Rétention','Hébergement']],
        ['Secteur', ['Service','Pôle','Dispositif']],
        ['Aménagement', ['Application','Adaptation','Exécution']],
        ['Assignation', ['Placement','Convocation','Admission']],
        ['Assistance', ['Accompagnement','Intervention','Aide']],
        ['Aide', ['Action','Assistance','Protection']],
        ['Correspondant', ['Référent','Responsable','Chargé']],
        ['Justice', ['Médiation','Action','Intervention']],
        ['Placement', ['Hébergement','Accompagnement','Accueil']],
        ['Quartier', ['Unité','Secteur','Espace']],
        ['Semi-Liberté', ['Liberté surveillée','Placement extérieur','Sortie encadrée']],
        ['Référent', ['Responsable','Correspondant','Chargé']],
        ['Responsable', ['Référent','Directeur','Correspondant']],
        ['Directeur', ['Référent','Responsable','Coordonnateur']],
        ['Directeurs', ['Référents','Responsables','Coordonnateurs']],
        ['Mission', ['Service','Dispositif','Programme']],
        ['Recueil', ['Rapport','Relevé','Dossier']],
        ['Officier', ['Agent','Responsable','Inspecteur']],
        ['Convocation', ['Notification','Citation','Décision']],
        ['Ordonnance', ['Décision','Mesure','Notification']],
        ['Travail', ['Service','Activité','Emploi']],
        ['Sursis', ['Suivi','Régime','Contrôle']],
        ['Administration', ['Direction','Organisation','Service']],
        ['Mineurs', ['Jeunes','Enfants','Adolescents']],
        ['Projet', ['Programme','Parcours','Plan']],
        ['Pôle', ['Service','Unité','Secteur']],
        ['Suivi', ['Accompagnement','Contrôle','Parcours']],
        ['École', ['Institut','Centre','Service']]
    ];
    const faux = [];
    const ajouter = texte => { const t=String(texte||'').trim(); if(t && t!==vrai && !faux.includes(t)) faux.push(t); };
    for (const [mot, variantes] of remplacements) {
        if (!vrai.includes(mot)) continue;
        variantes.forEach(variante => ajouter(vrai.replace(mot,variante)));
        if (faux.length >= nombre) break;
    }
    // Repli lexical : on modifie un qualificatif courant sans introduire un autre sigle.
    const qualifs = [
        ['judiciaire',['juridique','administrative','éducative']],
        ['éducative',['sociale','judiciaire','administrative']],
        ['territorial',['régional','départemental','local']],
        ['territoriale',['régionale','départementale','locale']],
        ['provisoire',['temporaire','préalable','initiale']],
        ['associatif',['territorial','public','éducatif']]
    ];
    for (const [mot, variantes] of qualifs) {
        if (faux.length >= nombre) break;
        if (!vrai.toLowerCase().includes(mot.toLowerCase())) continue;
        const re = new RegExp(mot,'i');
        variantes.forEach(v => ajouter(vrai.replace(re,v)));
    }
    while (faux.length < nombre) ajouter(`${vrai} complémentaire ${faux.length+1}`);
    return faux.slice(0,nombre);
}
function significationMissionSigles(cible) { return String(cible?.significationJeu || cible?.signification || '').trim(); }
function creerQuestionIntroductionSigles(cible) {
    const faux = Array.isArray(cible.distracteursIntroduction) ? cible.distracteursIntroduction.map(String) : [];
    if (faux.length !== 3 || new Set(faux.map(x=>x.trim().toLowerCase())).size !== 3) throw new Error(`Mission Sigles : trois distracteurs uniques sont requis pour ${cible.sigle}.`);
    const consigne = String(cible.questionIntroduction || '').trim();
    if (!consigne) throw new Error(`Mission Sigles : question d’introduction manquante pour ${cible.sigle}.`);
    const signification = significationMissionSigles(cible);
    const options = melangerSigles([signification,...faux]).map((texte,i)=>({id:`intro-${i}`,texte,correcte:texte===signification}));
    return {
        type:'introduction',
        cibles:[cible],
        cible,
        estIntroduction:true,
        compteMaitrise:false,
        consigne,
        options,
        explication:`La bonne appellation est « ${signification} ». Elle s’abrège ${cible.sigle}. ${cible.repere || ''}`.trim(),
        indice:'Appuie-toi sur la situation décrite et élimine les appellations qui changent le rôle, le cadre ou le niveau concerné.'
    };
}
function poolSiglesConnus(extras=[]) {
    const connus = SIGLES.filter(x=>sigleEstIntroduit(x.sigle));
    const map = new Map([...connus,...extras].map(x=>[normaliserSigleJeu(x.sigle),x])); return [...map.values()];
}
function creerQuestionRappelDirectSigles(cible, pool=SIGLES) {
    const autres = choisirSansDoublon(pool.filter(x=>normaliserSigleJeu(x.sigle)!==normaliserSigleJeu(cible.sigle)),3);
    const options = melangerSigles([cible,...autres]).map((x,i)=>({id:`dev-${i}`,texte:significationMissionSigles(x),correcte:normaliserSigleJeu(x.sigle)===normaliserSigleJeu(cible.sigle)}));
    return { type:'choix', cibles:[cible], cible, compteMaitrise:true, consigne:`Que signifie ${cible.sigle} ?`, options, explication:`${cible.sigle} signifie « ${significationMissionSigles(cible)} ». ${cible.repere || ''}`.trim(), indice:cible.repere || `Cherche le développement exact de ${cible.sigle}.` };
}
function creerQuestionRappelInverseSigles(cible, poolConnus) {
    const eligibles = poolConnus.filter(x=>normaliserSigleJeu(x.sigle)!==normaliserSigleJeu(cible.sigle) && sigleEstIntroduit(x.sigle));
    if (eligibles.length < 3) return creerQuestionRappelDirectSigles(cible, poolConnus.length>=4?poolConnus:SIGLES);
    const autres=choisirSansDoublon(eligibles,3); const options=melangerSigles([cible,...autres]).map((x,i)=>({id:`sig-${i}`,texte:x.sigle,correcte:normaliserSigleJeu(x.sigle)===normaliserSigleJeu(cible.sigle)}));
    return { type:'choix', cibles:[cible], cible, compteMaitrise:true, consigne:`Quel sigle correspond à « ${significationMissionSigles(cible)} » ?`, options, explication:`Le sigle attendu est ${cible.sigle}. ${cible.repere || ''}`.trim(), indice:cible.repere || 'Repère le sigle correspondant au développement déjà travaillé.' };
}
function creerQuestionAssociationSigles(cibles) {
    const liste=cibles.slice(0,4); return { type:'association', cibles:liste, compteMaitrise:false, consigne:'Relie chaque sigle à son développement.', explication:'Chaque sigle doit être associé à son développement exact.', indice:'Commence par les associations dont tu es sûre.' };
}
function creerQuestionsEtapeSigles(numero) {
    const pool=obtenirSiglesEtape(numero); const questions=[];
    for(let debut=0;debut<pool.length;debut+=4){ const bloc=pool.slice(debut,debut+4); bloc.forEach(c=>questions.push(creerQuestionIntroductionSigles(c))); bloc.forEach(c=>questions.push(creerQuestionRappelDirectSigles(c,bloc))); }
    return questions;
}
function creerQuestionsEntrainementSigles(cibles, melange=false) {
    const ordre = melange ? melangerSigles(cibles) : [...cibles];
    const connusAvant=poolSiglesConnus(ordre.filter(x=>sigleEstIntroduit(x.sigle)));
    // Comme l'entraînement PJJoue, le nombre choisi correspond exactement au
    // nombre de questions jouées. Un sigle encore inconnu est d'abord introduit
    // par une question développement → sigle ; il sera rappelé lors d'une session
    // ultérieure, jamais testé avant cette première rencontre.
    return ordre.map((cible,index)=>{
        if(!sigleEstIntroduit(cible.sigle)) return creerQuestionIntroductionSigles(cible);
        return index%2===0
            ? creerQuestionRappelDirectSigles(cible,ordre)
            : creerQuestionRappelInverseSigles(cible,connusAvant);
    });
}
function creerQuestionsHasardSigles(cibles) {
    const connus=poolSiglesConnus(cibles);
    return cibles.map((cible,index)=> sigleEstIntroduit(cible.sigle) ? (index%2?creerQuestionRappelInverseSigles(cible,connus):creerQuestionRappelDirectSigles(cible,cibles)) : creerQuestionIntroductionSigles(cible));
}
function creerQuestionsRevisionSigles(cibles) { const connus=poolSiglesConnus(cibles); return cibles.map((cible,index)=>index%2?creerQuestionRappelInverseSigles(cible,connus):creerQuestionRappelDirectSigles(cible,cibles)); }
function creerQuestionsEvaluationSigles() {
    const cibles=choisirSansDoublon(SIGLES,30); const connus=SIGLES;
    return cibles.map((cible,index)=> index>0 && index%6===5 ? creerQuestionAssociationSigles(choisirSansDoublon(SIGLES,4)) : (index%2?creerQuestionRappelInverseSigles(cible,connus):creerQuestionRappelDirectSigles(cible,SIGLES))).slice(0,30);
}

function preparerSessionSigles({mode,etape=null,sigles,questions,jokersActifs=true,titre,chronoActif=false,secondesQuestion=30}) {
    arreterChronoSigles();
    etatJeuSigles = { ...creerEtatJeuSigles(), mode, etape, titreSession:titre, siglesSession:[...sigles], questions:[...questions], jokersActifs, chronoActif, secondesQuestion, chronoRestant:secondesQuestion, configurationDerniereSession:{mode,etape,sigles:[...sigles],jokersActifs,titre,chronoActif,secondesQuestion} };
    afficherVueSigles('session'); afficherQuestionSigles();
}
function afficherQuestionSigles() {
    const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; if(!q){ terminerSessionSigles(); return; }
    etatJeuSigles.questionValidee=false; etatJeuSigles.tentativesQuestion=0; etatJeuSigles.aideUtilisee=false;
    enregistrerSauvegarde();
    const total=etatJeuSigles.questions.length, index=etatJeuSigles.indexQuestion+1;
    if(selectionnerSigles('#siglesSessionMode')) selectionnerSigles('#siglesSessionMode').textContent=etatJeuSigles.titreSession;
    if(selectionnerSigles('#siglesQuestionTitre')) selectionnerSigles('#siglesQuestionTitre').textContent=q.estIntroduction?'Découvrir un repère':'Question';
    if(selectionnerSigles('#siglesQuestionCompteur')) selectionnerSigles('#siglesQuestionCompteur').textContent=`${index} / ${total}`;
    if(selectionnerSigles('#siglesSessionJauge')) selectionnerSigles('#siglesSessionJauge').style.width=`${Math.round((index-1)/total*100)}%`;
    if(selectionnerSigles('#siglesQuestionConsigne')) selectionnerSigles('#siglesQuestionConsigne').textContent=q.consigne;
    selectionnerSigles('#siglesAide')?.classList.add('masque'); selectionnerSigles('#siglesFeedback')?.classList.add('masque'); selectionnerSigles('#siglesQuestionSuivante')?.classList.add('masque'); selectionnerSigles('#siglesValiderActivite')?.classList.add('masque');
    const jokers=selectionnerSigles('#siglesJokers'); if(jokers){ jokers.classList.toggle('masque',!etatJeuSigles.jokersActifs); jokers.querySelectorAll('button').forEach(b=>b.disabled=false); }
    const passer=selectionnerSigles('#siglesPasserQuestion'); if(passer) passer.classList.toggle('masque',etatJeuSigles.mode==='evaluation');
    rendreQuestionSigles(q); demarrerChronoSigles();
}
function rendreQuestionSigles(q) {
    const zone=selectionnerSigles('#siglesZoneQuestion'); if(!zone)return; zone.innerHTML='';
    if(q.type==='association') {
        const devs=melangerSigles(q.cibles.map(c=>significationMissionSigles(c)));
        zone.innerHTML=`<div class="sigles-association">${q.cibles.map((c,i)=>`<label><strong>${c.sigle}</strong><select data-association-sigles="${i}"><option value="">Choisir…</option>${devs.map(d=>`<option value="${String(d).replaceAll('&','&amp;').replaceAll('"','&quot;')}">${d}</option>`).join('')}</select></label>`).join('')}</div>`;
        selectionnerSigles('#siglesValiderActivite')?.classList.remove('masque'); return;
    }
    zone.innerHTML=`<div class="sigles-reponses">${q.options.map((o,i)=>`<button class="sigles-reponse" data-sigles-reponse="${i}" type="button">${o.texte}</button>`).join('')}</div>`;
    zone.querySelectorAll('[data-sigles-reponse]').forEach(b=>b.addEventListener('click',()=>repondreChoixSigles(Number(b.dataset.siglesReponse))));
}
function repondreChoixSigles(index) {
    if(etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion], option=q.options[index]; if(!option)return;
    etatJeuSigles.tentativesQuestion += 1;
    if(option.correcte) finaliserQuestionSigles(true,q.cibles); else { const b=selectionnerSigles(`[data-sigles-reponse="${index}"]`); b?.classList.add('sigles-reponse-incorrecte'); b && (b.disabled=true); etatJeuSigles.reponsesIncorrectes += 1; enregistrerErreurSigles(q.cibles); afficherFeedbackSigles('erreur','Pas encore. Relis les propositions et essaie de nouveau.'); }
}
function validerAssociationSigles() {
    if(etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; if(q?.type!=='association')return;
    const valeurs=selectionnerTousSigles('[data-association-sigles]').map(s=>s.value); if(valeurs.some(v=>!v)){ afficherNotification('Associe chaque sigle avant de valider.'); return; }
    etatJeuSigles.tentativesQuestion += 1; const mauvaises=q.cibles.filter((c,i)=>valeurs[i]!==significationMissionSigles(c));
    if(!mauvaises.length) finaliserQuestionSigles(true,q.cibles); else { etatJeuSigles.reponsesIncorrectes += 1; enregistrerErreurSigles(mauvaises); afficherFeedbackSigles('erreur','Certaines associations sont encore à corriger.'); }
}
function finaliserQuestionSigles(correcte,cibles,{parJoker=false,passage=false,tempsEcoule=false}={}) {
    if(etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; etatJeuSigles.questionValidee=true; arreterChronoSigles();
    if(correcte){ if(q.estIntroduction && q.cible) marquerSigleIntroduit(q.cible.sigle); etatJeuSigles.score += 1; const autonome=!etatJeuSigles.aideUtilisee && !parJoker && etatJeuSigles.tentativesQuestion<=1; if(autonome) etatJeuSigles.reponsesAutonomes += 1; else etatJeuSigles.reponsesAidees += 1;
        if(q.compteMaitrise){ cibles.forEach(cible=>{ const etape=obtenirEtatEtapeSigles(Number(cible.etape)), cle=normaliserSigleJeu(cible.sigle); if(!etatJeuSigles.aideUtilisee&&!parJoker) etape.validationsSansJoker[cle]=true; if(autonome) etape.autonomes[cle]=true; }); verifierCelebrationEtapeSigles(cibles); }
        if(etatJeuSigles.mode==='revision') validerRevisionSigles(cibles); afficherFeedbackSigles('succes',q.explication || 'Bonne réponse.');
    } else { if(passage||tempsEcoule){ etatJeuSigles.questionsPassees += 1; enregistrerErreurSigles(cibles); afficherFeedbackSigles('erreur',tempsEcoule?'Temps écoulé. Cette question rejoint tes erreurs.':'Question passée. Elle rejoint tes erreurs.'); } }
    obtenirSauvegardeJeuSigles().statistiques.questionsJouees += 1; enregistrerSauvegarde();
    selectionnerTousSigles('#siglesZoneQuestion button, #siglesZoneQuestion select').forEach(e=>e.disabled=true); selectionnerSigles('#siglesValiderActivite')?.classList.add('masque'); selectionnerSigles('#siglesQuestionSuivante')?.classList.remove('masque'); selectionnerSigles('#siglesPasserQuestion')?.classList.add('masque'); selectionnerSigles('#siglesJokers')?.querySelectorAll('button').forEach(b=>b.disabled=true);
}
function afficherFeedbackSigles(type,texte){ const z=selectionnerSigles('#siglesFeedback'); if(!z)return; z.dataset.type=type; z.textContent=texte; z.classList.remove('masque'); }
function passerQuestionSigles(){ if(etatJeuSigles.mode==='evaluation'||etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; finaliserQuestionSigles(false,q.cibles,{passage:true}); }
function questionSuivanteSigles(){ etatJeuSigles.indexQuestion += 1; afficherQuestionSigles(); }
function verifierCelebrationEtapeSigles(cibles){ const numeros=[...new Set(cibles.map(c=>Number(c.etape)))]; numeros.forEach(n=>{ const e=obtenirEtatEtapeSigles(n); if(compterValidationsSansJokerEtapeSigles(n)===12 && !e.celebrationAffichee){ e.celebrationAffichee=true; etatJeuSigles.celebrationEtapeADiffuser=n; } }); }

function utiliserJokerSigles(type) {
    if(!etatJeuSigles.jokersActifs||etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; etatJeuSigles.aideUtilisee=true; const bouton=selectionnerSigles(`[data-joker-sigles="${type}"]`); if(bouton)bouton.disabled=true;
    if(type==='5050') { if(q.type!=='choix'&&q.type!=='introduction'){ afficherAideSigles('Le 50/50 est disponible sur les questions à choix.'); return; } const mauvaises=selectionnerTousSigles('#siglesZoneQuestion .sigles-reponse').filter((b,i)=>!q.options[i]?.correcte&&!b.disabled); choisirSansDoublon(mauvaises,Math.min(2,mauvaises.length)).forEach(b=>{b.disabled=true;b.classList.add('sigles-reponse-ecartee');}); afficherAideSigles('Deux propositions ont été écartées.'); return; }
    if(type==='indice'){ afficherAideSigles(q.indice || q.cibles[0]?.repere || 'Repère le développement du sigle et les initiales utiles.'); return; }
    if(type==='langue'){ if(q.type==='association'){ const c=q.cibles[0]; afficherAideSigles(`Premier coup de pouce : ${c.sigle} correspond à « ${significationMissionSigles(c)} ».`); return; } const bon=q.options.findIndex(o=>o.correcte); if(bon>=0){ selectionnerSigles(`[data-sigles-reponse="${bon}"]`)?.classList.add('sigles-reponse-correcte'); finaliserQuestionSigles(true,q.cibles,{parJoker:true}); } }
}
function afficherAideSigles(texte){ const z=selectionnerSigles('#siglesAide'); if(!z)return; z.textContent=texte; z.classList.remove('masque'); }

function demarrerChronoSigles(){ arreterChronoSigles(); const zone=selectionnerSigles('#siglesChrono'); if(!etatJeuSigles.chronoActif){ zone?.classList.add('masque'); return; } etatJeuSigles.chronoRestant=etatJeuSigles.secondesQuestion; if(zone){zone.textContent=`${etatJeuSigles.chronoRestant} s`;zone.classList.remove('masque');} etatJeuSigles.chronoIntervalle=window.setInterval(()=>{ etatJeuSigles.chronoRestant-=1; if(zone)zone.textContent=`${Math.max(0,etatJeuSigles.chronoRestant)} s`; if(etatJeuSigles.chronoRestant<=0){ arreterChronoSigles(); if(!etatJeuSigles.questionValidee){ const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; finaliserQuestionSigles(false,q.cibles,{tempsEcoule:true}); } } },1000); }
function arreterChronoSigles(){ if(etatJeuSigles.chronoIntervalle){ clearInterval(etatJeuSigles.chronoIntervalle); etatJeuSigles.chronoIntervalle=null; } }

function terminerSessionSigles(){ arreterChronoSigles(); const total=etatJeuSigles.questions.length, pc=total?Math.round(etatJeuSigles.score/total*100):0; const jeu=obtenirSauvegardeJeuSigles();
    if(etatJeuSigles.mode==='parcours'&&etatJeuSigles.etape){ const e=obtenirEtatEtapeSigles(etatJeuSigles.etape); e.nombreTentatives+=1;e.meilleurScore=Math.max(e.meilleurScore||0,pc); }
    if(etatJeuSigles.mode==='evaluation'){ jeu.evaluation.nombreTentatives+=1;jeu.evaluation.meilleurScore=Math.max(jeu.evaluation.meilleurScore||0,pc);etatJeuSigles.evaluationReussie=pc>=SEUIL_EVALUATION_SIGLES&&etatJeuSigles.questionsPassees===0;etatJeuSigles.evaluationParfaite=pc===100&&etatJeuSigles.questionsPassees===0;if(etatJeuSigles.evaluationReussie)jeu.evaluation.reussie=true; }
    enregistrerSauvegarde(); afficherVueSigles('bilan'); afficherBilanSigles(pc); actualiserAccueilSigles(); }
function afficherBilanSigles(pc){ const total=etatJeuSigles.questions.length; if(selectionnerSigles('#siglesBilanScore'))selectionnerSigles('#siglesBilanScore').textContent=`${etatJeuSigles.score} / ${total} · ${pc}%`; if(selectionnerSigles('#siglesBilanDetails'))selectionnerSigles('#siglesBilanDetails').textContent=`${etatJeuSigles.reponsesAutonomes} réussites autonomes · ${etatJeuSigles.reponsesAidees} avec aide · ${etatJeuSigles.questionsPassees} passées`;
    let surtitre='Mission Sigles', titre='Session terminée', texte='Les sigles difficiles restent disponibles dans « Réviser mes erreurs ».', icone='✓';
    if(etatJeuSigles.mode==='parcours'){ const m=etapeSiglesMaitrisee(etatJeuSigles.etape); titre=m?`Étape ${etatJeuSigles.etape} maîtrisée`:`Étape ${etatJeuSigles.etape} terminée`; texte=m?'Les 12 sigles de cette étape sont maîtrisés en autonomie.':'Tu peux rejouer l’étape ou retrouver tes erreurs dans la révision.'; }
    if(etatJeuSigles.celebrationEtapeADiffuser){ icone='★'; titre=`Étape ${etatJeuSigles.celebrationEtapeADiffuser} validée sans joker !`; texte='Tous les sigles de cette étape ont finalement été réussis sans joker. Bravo !'; lancerConfettis(1.35); jouerSonEtapeSansJoker(); }
    if(etatJeuSigles.mode==='evaluation'){ surtitre='Évaluation finale'; if(etatJeuSigles.evaluationReussie){ titre=etatJeuSigles.evaluationParfaite?'72 sigles. Même pas peur.':'Évaluation réussie !';texte=etatJeuSigles.evaluationParfaite?'30 / 30. Mission accomplie.':'Tu dépasses le seuil de 90 %. Bravo !';icone='🏆';lancerConfettis(etatJeuSigles.evaluationParfaite?3:2);jouerSonEvaluationFinale(); } else { titre='Évaluation à consolider';texte='Il faut 90 % pour réussir. Les sigles manqués rejoignent tes erreurs.';icone='↻'; } }
    if(etatJeuSigles.mode==='hasard'){ titre='Défi du hasard terminé';texte=pc===100?'Tirage parfait ! Le dé était avec toi.':'Le dé a parlé. Tu peux relancer un nouveau tirage quand tu veux.'; }
    if(etatJeuSigles.mode==='revision'){ titre='Révision terminée';texte=obtenirErreursSiglesActives().length?'Il reste quelques sigles à consolider.':'Bravo : aucun sigle actif à revoir.'; }
    if(etatJeuSigles.mode==='entrainement'&&pc===100&&total>=10){ titre='Entraînement parfait !';texte='Aucune erreur sur cette session.';lancerConfettis(1);jouerSonEtapeSansJoker(); }
    if(selectionnerSigles('#siglesBilanSurtitre'))selectionnerSigles('#siglesBilanSurtitre').textContent=surtitre; if(selectionnerSigles('#siglesBilanTitre'))selectionnerSigles('#siglesBilanTitre').textContent=titre; if(selectionnerSigles('#siglesBilanTexte'))selectionnerSigles('#siglesBilanTexte').textContent=texte; if(selectionnerSigles('#siglesBilanIcone'))selectionnerSigles('#siglesBilanIcone').textContent=icone;
}

function lancerEtapeSigles(numero){ const sigles=obtenirSiglesEtape(numero); preparerSessionMissionSiglesNative({mode:'parcours',etape:numero,sigles,questions:creerQuestionsEtapeSigles(numero),jokersActifs:true,titre:`Étape ${numero} · ${ETAPES_MISSION_SIGLES[numero].titre}`}); }
function lancerEntrainementSigles(){ const perimetre=valeurGroupeSigles('#siglesChoixPerimetre','perimetre','tous'); const pool=perimetre==='tous'?[...SIGLES]:obtenirSiglesEtape(Number(perimetre)); const nombreBrut=valeurGroupeSigles('#siglesChoixNombre','nombre','10'); const nombre=nombreBrut==='tous'?pool.length:Math.min(pool.length,Number(nombreBrut)||10); const organisation=valeurGroupeSigles('#siglesChoixOrganisation','organisation','etapes'); let cibles=choisirSansDoublon(pool,nombre); if(organisation==='etapes')cibles=cibles.sort((a,b)=>Number(a.etape)-Number(b.etape)||Number(a.id)-Number(b.id)); const chrono=valeurGroupeSigles('#siglesChoixChrono','chrono','non')==='oui'; const secondes=Number(valeurGroupeSigles('#siglesChoixSecondes','secondes','30'))||30; const jokers=valeurGroupeSigles('#siglesChoixJokers','jokers','oui')==='oui'; const questions=creerQuestionsEntrainementSigles(cibles,organisation==='melange'); preparerSessionSigles({mode:'entrainement',sigles:cibles,questions,jokersActifs:jokers,titre:`Entraînement Sigles · ${nombre} sigle${nombre===1?'':'s'}`,chronoActif:chrono,secondesQuestion:secondes}); }
function lancerDeSigles(){ const face=selectionnerSigles('#siglesFaceDe'),resultat=selectionnerSigles('#siglesDeResultat'),lancer=selectionnerSigles('#siglesLancerDe'),jouer=selectionnerSigles('#siglesJouerTirage'); if(!face||!resultat||!lancer||!jouer)return; const valeur=1+Math.floor(Math.random()*6); lancer.disabled=true;jouer.classList.add('masque');face.classList.remove('de-en-lancer');void face.offsetWidth;face.classList.add('de-en-lancer');window.setTimeout(()=>{ etatJeuSigles.nombreTire=valeur;etatJeuSigles.tirageHasard=choisirSansDoublon(SIGLES,valeur);face.dataset.face=String(valeur);face.classList.remove('de-en-lancer');resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard parmi les 72 sigles.`;jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`;lancer.textContent='Relancer le dé';lancer.classList.remove('principal');lancer.classList.add('sigles-bouton-secondaire');jouer.classList.remove('masque');lancer.disabled=false;jouer.focus({preventScroll:true}); },420); }
function jouerTirageDeSigles(){ const cibles=[...etatJeuSigles.tirageHasard]; if(!cibles.length)return; preparerSessionMissionSiglesNative({mode:'hasard',sigles:cibles,questions:creerQuestionsHasardSigles(cibles),jokersActifs:true,titre:`Défi du hasard · ${cibles.length} question${cibles.length===1?'':'s'}`,chronoActif:false}); }
function lancerRevisionSigles(){
    afficherEcran('sigles-revision');
}
function lancerToutesErreursSiglesDepuisRevision(){
    const cibles = obtenirErreursSiglesActives();
    if(!cibles.length){ afficherNotification('Aucune erreur Sigles à revoir pour le moment.'); return; }
    preparerSessionMissionSiglesNative({mode:'revision', sigles:cibles, questions:creerQuestionsRevisionSigles(cibles), jokersActifs:true, titre:'Réviser mes erreurs'});
}
function lancerRevisionEtapeSiglesDepuisRevision(numeroEtape){
    const numero = Number(numeroEtape);
    const cibles = obtenirErreursSiglesActives().filter(cible => Number(cible.etape) === numero);
    if(!cibles.length){ afficherNotification(`Aucune erreur active à l’étape ${numero} de Mission Sigles.`); return; }
    preparerSessionMissionSiglesNative({mode:'revision', etape:numero, sigles:cibles, questions:creerQuestionsRevisionSigles(cibles), jokersActifs:true, titre:`Réviser mes erreurs · Étape ${numero}`});
}
function missionSiglesADejaJoue(){
    const jeu = obtenirSauvegardeJeuSigles();
    return Object.keys(jeu.decouverts || {}).length > 0
        || Object.values(jeu.etapes || {}).some(etape => Object.keys(etape?.autonomes || {}).length > 0)
        || Number(jeu.evaluation?.nombreTentatives || 0) > 0;
}
function afficherEtatVideRevisionMissionSigles(zone){
    if (!zone) return;
    if (!missionSiglesADejaJoue()) {
        zone.innerHTML = `<div class="revision-vide">
            <span class="revision-vide-icone" aria-hidden="true">↺</span>
            <span class="surtitre">Révision</span>
            <h2>Tu n’as pas encore joué à Mission Sigles.</h2>
            <p>Commence une étape : les sigles à consolider apparaîtront ici automatiquement.</p>
            <button class="principal" data-action="ouvrir-mission-sigles-depuis-erreurs">Commencer Mission Sigles →</button>
        </div>`;
        return;
    }
    zone.innerHTML = `<div class="revision-vide revision-vide-ok">
        <span class="revision-vide-icone" aria-hidden="true">✓</span>
        <span class="surtitre">À jour</span>
        <h2>Aucune erreur active.</h2>
        <p>Tous les sigles qui avaient besoin d’être retravaillés sont consolidés.</p>
    </div>`;
}
function construireRevisionMissionSiglesIndependante(){
    const cibles = obtenirErreursSiglesActives();
    const zone = selectionner('#contenuErreursSigles');
    if(!zone) return;
    if(!cibles.length){ afficherEtatVideRevisionMissionSigles(zone); return; }
    const parEtape = {};
    cibles.forEach(cible => (parEtape[Number(cible.etape)] = parEtape[Number(cible.etape)] || []).push(cible));
    const total = cibles.length;
    const boutons = Object.keys(parEtape).sort((a,b)=>Number(a)-Number(b)).map(numero => {
        const identite = obtenirIdentiteEtapeMissionSigles(Number(numero));
        const liste = parEtape[numero];
        return `<button class="revision-parcours-bouton" data-action="reviser-etape-sigles" data-etape="${numero}" style="--parcours-accent:${identite.couleur};--parcours-accent-rgb:${identite.couleurRgb}"><span class="revision-parcours-numero">${identite.numero}</span><span class="revision-parcours-texte"><strong>${identite.titre}</strong><small>${liste.length} ${liste.length>1?'erreurs':'erreur'}</small></span><span class="revision-parcours-action">Réviser →</span></button>`;
    }).join('');
    const etapesDirectes = Object.keys(parEtape).sort((a,b)=>Number(a)-Number(b)).map(numero => {
        const liste = parEtape[numero];
        return `<button class="revision-etape-bouton" data-action="reviser-etape-sigles" data-etape="${numero}"><span>Étape ${numero}</span><strong>${liste.length}</strong></button>`;
    }).join('');
    const dossiers = Object.keys(parEtape).sort((a,b)=>Number(a)-Number(b)).map(numero => {
        const identite = obtenirIdentiteEtapeMissionSigles(Number(numero));
        const liste = parEtape[numero];
        const lignes = liste.map(cible => {
            const suivi = obtenirSauvegardeJeuSigles().erreurs?.[normaliserSigleJeu(cible.sigle)] || {};
            return `<li class="revision-erreur-ligne"><span><strong>${cible.sigle}</strong> · ${significationMissionSigles(cible)}</span><small>Raté ${Number(suivi.nombreErreurs||1)} fois · à revoir jusqu’à réussite</small></li>`;
        }).join('');
        return `<details class="revision-dossier" style="--parcours-accent:${identite.couleur};--parcours-accent-rgb:${identite.couleurRgb}"><summary><span class="revision-dossier-numero">${identite.numero}</span><span><strong>${identite.titre}</strong><small>${liste.length} ${liste.length>1?'erreurs actives':'erreur active'}</small></span><span class="revision-dossier-chevron" aria-hidden="true">⌄</span></summary><div class="revision-dossier-contenu"><div class="revision-etape-groupe"><div class="revision-etape-groupe-entete"><strong>Étape ${numero}</strong><span>${liste.length}</span></div><ul>${lignes}</ul></div></div></details>`;
    }).join('');
    zone.innerHTML = `<div class="revision-workspace">
        <article class="revision-toutes-erreurs">
            <div class="revision-toutes-erreurs-icone" aria-hidden="true">↻</div>
            <div class="revision-toutes-erreurs-texte"><span class="surtitre">Révision rapide</span><h2>Mélange mes erreurs</h2><p>Une session aléatoire avec tes ${total} ${total>1?'sigles à retravailler':'sigle à retravailler'}.</p></div>
            <button class="principal" data-action="reviser-toutes-erreurs-sigles">Lancer ${total} ${total>1?'questions':'question'} →</button>
        </article>
        <section class="revision-choix" aria-labelledby="titreRevisionSiglesEtapes">
            <div class="revision-section-entete"><div><span class="surtitre">Cibler</span><h2 id="titreRevisionSiglesEtapes">Choisis ce que tu veux renforcer</h2></div><p>Une étape précise de Mission Sigles.</p></div>
            <div class="revision-parcours-boutons">${boutons}</div>
            <details class="revision-etapes-details"><summary>Choisir directement une étape</summary><div class="revision-etape-boutons">${etapesDirectes}</div></details>
        </section>
    </div>
    <section class="revision-inventaire" aria-labelledby="titreInventaireErreursSigles"><div class="revision-section-entete"><div><span class="surtitre">Détail</span><h2 id="titreInventaireErreursSigles">Tes erreurs actives</h2></div><p>Consulte les sigles qui restent à consolider, étape par étape.</p></div><div class="revision-dossiers">${dossiers}</div></section>`;
}
function afficherRevisionMissionSigles(){
    construireRevisionMissionSiglesIndependante();
}

function lancerEvaluationSigles(){ if(!evaluationSiglesDebloquee()){ouvrirFenetreMessage({titre:'Évaluation encore verrouillée',message:'Maîtrise d’abord les 6 étapes de Mission Sigles en autonomie.',libelleConfirmer:'Compris'});return;} const questions=creerQuestionsEvaluationSigles(); const sigles=[...new Map(questions.flatMap(q=>q.cibles).map(c=>[normaliserSigleJeu(c.sigle),c])).values()]; preparerSessionMissionSiglesNative({mode:'evaluation',sigles,questions,jokersActifs:false,titre:'Évaluation finale · Expert des sigles'}); }
function rejouerDerniereSessionSigles(){ const ancienne=etatJeuSigles.configurationDerniereSession;if(!ancienne){retourAccueilSigles();return;} if(ancienne.mode==='parcours'){lancerEtapeSigles(ancienne.etape);return;}if(ancienne.mode==='evaluation'){lancerEvaluationSigles();return;}if(ancienne.mode==='revision'){lancerRevisionSigles();return;}if(ancienne.mode==='hasard'){const cibles=ancienne.sigles.map(x=>obtenirSigleJeu(x.sigle)).filter(Boolean);preparerSessionSigles({...ancienne,sigles:cibles,questions:creerQuestionsHasardSigles(cibles)});return;}const cibles=ancienne.sigles.map(x=>obtenirSigleJeu(x.sigle)).filter(Boolean);preparerSessionSigles({...ancienne,sigles:cibles,questions:creerQuestionsEntrainementSigles(cibles, false)}); }
function retourAccueilSigles(){ arreterChronoSigles(); etatJeuSigles=creerEtatJeuSigles(); afficherVueSigles('accueil'); actualiserAccueilSigles(); }


// -----------------------------------------------------------------------------
// Mission Sigles dans les composants natifs de PJJoue
// -----------------------------------------------------------------------------
function estSessionMissionSigles() {
    return String(etat?.mode || '').startsWith('sigles-');
}
function obtenirModeMissionSigles() {
    return estSessionMissionSigles() ? String(etat.mode).replace(/^sigles-/, '') : null;
}
function obtenirIdentiteEtapeMissionSigles(numero) {
    return ETAPES_MISSION_SIGLES[Number(numero)] || ETAPES_MISSION_SIGLES[1];
}
function obtenirThemeVisuelMissionSigles(numero) {
    return ['commun','procedure_ordinaire','information_judiciaire','jugement_educatif_ordinaire','matiere_criminelle_peines','application_execution_peines'][Math.max(0, Math.min(5, Number(numero || 1) - 1))];
}
function convertirQuestionMissionSiglesVersPJJoue(questionSigles, index, configuration) {
    const cible = questionSigles.cible || questionSigles.cibles?.[0] || null;
    const numeroEtape = Number(cible?.etape || configuration.etape || 1);
    const identifiant = 900000 + (Number(cible?.id || 0) * 20) + (index % 20);
    const base = {
        id: identifiant,
        theme: obtenirThemeVisuelMissionSigles(numeroEtape),
        etape: numeroEtape,
        chapitre: 1,
        ordreEtape: index + 1,
        enonce: questionSigles.consigne,
        explication: questionSigles.explication || '',
        indice: questionSigles.indice || '',
        bonneReponse: '',
        mauvaisesReponses: [],
        modePrefere: 'choix-unique',
        estEvaluationFinale: configuration.mode === 'evaluation',
        missionSigles: true,
        missionSiglesMeta: {
            mode: configuration.mode,
            numeroEtape,
            cibles: (questionSigles.cibles || []).map(element => normaliserSigleJeu(element.sigle)),
            compteMaitrise: questionSigles.compteMaitrise === true,
            estIntroduction: questionSigles.estIntroduction === true
        }
    };
    if (questionSigles.type === 'association') {
        const gauche = (questionSigles.cibles || []).map((element, i) => ({ id:`ms-g-${identifiant}-${i}`, texte: element.sigle }));
        const droite = (questionSigles.cibles || []).map((element, i) => ({ id:`ms-d-${identifiant}-${i}`, texte: significationMissionSigles(element) }));
        const associations = Object.fromEntries(gauche.map((element, i) => [element.id, droite[i].id]));
        return {
            ...base,
            bonneReponse: 'Chaque sigle est relié à son développement exact.',
            modePrefere: 'association',
            activite: { type:'association', colonneGauche:gauche, colonneDroite:droite, associations }
        };
    }
    const options = questionSigles.options || [];
    const correcte = options.find(option => option.correcte === true);
    return {
        ...base,
        bonneReponse: correcte?.texte || '',
        mauvaisesReponses: options.filter(option => option.correcte !== true).map(option => option.texte)
    };
}
function preparerSessionMissionSiglesNative({ mode, etape = null, sigles, questions, jokersActifs = true, titre, chronoActif = false, secondesQuestion = 30 }) {
    const configuration = { mode, etape, sigles:[...sigles], jokersActifs, titre, chronoActif, secondesQuestion };
    etatJeuSigles = {
        ...creerEtatJeuSigles(),
        mode,
        etape,
        titreSession: titre,
        siglesSession: [...sigles],
        questions: [...questions],
        jokersActifs,
        chronoActif,
        secondesQuestion,
        configurationDerniereSession: configuration
    };
    etat.mode = `sigles-${mode}`;
    etat.theme = obtenirThemeVisuelMissionSigles(etape || sigles?.[0]?.etape || 1);
    etat.etape = Number(etape || sigles?.[0]?.etape || 1);
    etat.chapitre = 1;
    etat.origineSessionAnalytics = `mission_sigles_${mode}`;
    etat.organisationSession = configuration.organisation || 'ordonne';
    etat.jokersSessionActifs = jokersActifs !== false;
    etat.chronometreSessionActif = chronoActif === true;
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number(secondesQuestion) || 30));
    etat.missionSiglesConfiguration = configuration;
    const questionsPJJoue = questions.map((question, index) => convertirQuestionMissionSiglesVersPJJoue(question, index, configuration));
    lancerSession(questionsPJJoue);
}
function obtenirCiblesMissionQuestion(question) {
    const cles = question?.missionSiglesMeta?.cibles || [];
    return cles.map(cle => obtenirSigleJeu(cle)).filter(Boolean);
}
function enregistrerResultatMissionSiglesNatif(question, resultat) {
    if (!question?.missionSigles) return;
    const cibles = obtenirCiblesMissionQuestion(question);
    const meta = question.missionSiglesMeta || {};
    if (resultat.estCorrecte && meta.estIntroduction && cibles[0])
        marquerSigleIntroduit(cibles[0].sigle);
    if (resultat.estCorrecte && meta.compteMaitrise) {
        cibles.forEach(cible => {
            const etape = obtenirEtatEtapeSigles(Number(cible.etape));
            const cle = normaliserSigleJeu(cible.sigle);
            if (!resultat.aideUtilisee)
                etape.validationsSansJoker[cle] = true;
            if (resultat.reussiteAutonome)
                etape.autonomes[cle] = true;
        });
        verifierCelebrationEtapeSigles(cibles);
    }
    if (!resultat.estCorrecte || resultat.reussiteAidee)
        enregistrerErreurSigles(cibles);
    if (obtenirModeMissionSigles() === 'revision' && resultat.reussiteAutonome)
        validerRevisionSigles(cibles);
    enregistrerSauvegarde();
}
function enregistrerPassageMissionSiglesNatif(question) {
    if (!question?.missionSigles) return;
    enregistrerErreurSigles(obtenirCiblesMissionQuestion(question));
    enregistrerSauvegarde();
}
function reinitialiserMaitriseEtapeMissionSigles(numeroEtape) {
    const etape = obtenirEtatEtapeSigles(numeroEtape);
    etape.autonomes = {};
    etape.validationsSansJoker = {};
    etape.celebrationSansJokerAffichee = false;
    enregistrerSauvegarde();
    if (etat.questionCourante?.missionSigles)
        actualiserSuiviEtapeQuestion(etat.questionCourante);
}
function terminerSessionMissionSiglesNative() {
    clearInterval(etat.identifiantMinuteur);
    const total = etat.questionsSession.length;
    const passees = etat.questionsPassees?.size || 0;
    const pourcentage = total ? Math.round(etat.score / total * 100) : 0;
    const mode = obtenirModeMissionSigles();
    const jeu = obtenirSauvegardeJeuSigles();
    let celebration = null;
    let titre = 'Mission Sigles terminée';
    let resultat = `${pourcentage} % · ${etat.score}/${total} réussites autonomes.`;
    if (mode === 'parcours') {
        const numero = Number(etat.missionSiglesConfiguration?.etape || etat.etape || 1);
        if (etatJeuSigles.celebrationEtapeADiffuser) {
            celebration = {
                titre: `Étape ${numero} terminée sans joker !`,
                message: 'Tous les sigles de cette étape ont finalement été réussis sans joker.',
                confetti: true
            };
        }
        titre = `Étape ${numero} · ${obtenirIdentiteEtapeMissionSigles(numero).titre}`;
    }
    if (mode === 'evaluation') {
        jeu.evaluation.meilleurScore = Math.max(Number(jeu.evaluation.meilleurScore || 0), pourcentage);
        jeu.evaluation.nombreTentatives = Number(jeu.evaluation.nombreTentatives || 0) + 1;
        const reussie = pourcentage >= SEUIL_EVALUATION_SIGLES && passees === 0;
        jeu.evaluation.reussie = Boolean(jeu.evaluation.reussie) || reussie;
        titre = 'Évaluation finale · Expert des sigles';
        resultat = reussie
            ? `Résultat : ${pourcentage} %. Mission Sigles est validée.`
            : `Résultat : ${pourcentage} %. Le seuil attendu est de ${SEUIL_EVALUATION_SIGLES} %.`;
        if (reussie) {
            celebration = pourcentage === 100
                ? { titre:'72 sigles. Même pas peur.', message:'30 / 30. Mission accomplie.', confetti:true, finale:true }
                : { titre:'Évaluation Mission Sigles réussie !', message:`Tu as obtenu ${pourcentage} %.`, confetti:true };
        }
    }
    if (mode === 'hasard') {
        titre = 'Défi du hasard · Mission Sigles';
        resultat = pourcentage === 100 ? 'Tirage parfait !' : `Résultat : ${pourcentage} %.`;
    }
    if (mode === 'revision') {
        titre = 'Réviser mes erreurs · Mission Sigles';
        resultat = obtenirErreursSiglesActives().length
            ? `${obtenirErreursSiglesActives().length} sigle(s) restent à consolider.`
            : 'Aucun sigle actif à revoir.';
    }
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent = `${pourcentage}%`;
    selectionner('#bonnesReponsesBilan').textContent = `${etat.score}/${total}`;
    selectionner('#meilleureSerieBilan').textContent = etat.meilleureSerie;
    selectionner('#gainExperienceBilan').textContent = '+0';
    selectionner('#contexteBilan').textContent = `Mission Sigles · ${titre}`;
    selectionner('#titreBilan').textContent = titre;
    selectionner('#rangBilan').textContent = resultat;
    afficherErreursBilan(etat.questionsSession.filter(question => etat.erreursSession.has(question.id)), passees);
    const continuer = selectionner('#boutonContinuer');
    continuer.textContent = 'Retour à Mission Sigles →';
    continuer.onclick = () => { etat.missionSiglesConfiguration = null; afficherEcran('sigles', { remplacerHistorique:true }); };
    const rejouer = selectionner('#boutonRejouerMesErreurs');
    if (rejouer) rejouer.onclick = lancerRevisionSigles;
    const destination = selectionner('#prochaineDestinationBilan');
    if (destination) destination.textContent = mode === 'parcours' ? 'Continue Mission Sigles ou rejoue les sigles à consolider.' : 'Choisis une nouvelle session dans Mission Sigles.';
    selectionner('#carteVoyageFinale')?.classList.add('masque');
    effacerSessionEnCours();
    afficherEcran('bilan', { remplacerHistorique:true });
    actualiserAccueilSigles();
    lancerCelebrationBilan(celebration);
}
function obtenirPoolEntrainementMissionSigles(perimetre) {
    return String(perimetre) === 'tous' ? [...SIGLES] : obtenirSiglesEtape(Number(perimetre));
}
function actualiserBoutonTousMissionSigles() {
    if (selectionner('#entrainement')?.dataset.contexteEntrainement !== 'sigles') return;
    const perimetre = selectionner('#perimetreEntrainement')?.value || 'tous';
    const maximum = obtenirPoolEntrainementMissionSigles(perimetre).length;
    const boutonTous = selectionner('#boutonEntrainement100Questions');
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    if (boutonTous) {
        boutonTous.dataset.valeur = String(maximum);
        boutonTous.textContent = 'Tous';
        boutonTous.hidden = false;
        boutonTous.disabled = false;
    }
    if (selectNombre && ![...selectNombre.options].some(option => Number(option.value) === maximum)) {
        const option = document.createElement('option');
        option.value = String(maximum);
        option.textContent = String(maximum);
        selectNombre.appendChild(option);
    }
}

function configurerEntrainementMissionSiglesNatif() {
    const ecran = selectionner('#entrainement');
    if (!ecran) return;
    etat.contexteEntrainement = 'sigles';
    ecran.dataset.contexteEntrainement = 'sigles';
    const entete = ecran.querySelector('.entrainement-entete');
    entete?.querySelector('.surtitre') && (entete.querySelector('.surtitre').textContent = 'Mission Sigles');
    entete?.querySelector('h1') && (entete.querySelector('h1').textContent = 'Choisis ta session');
    entete?.querySelector('p') && (entete.querySelector('p').textContent = 'Entraîne-toi sur les sigles avec exactement les mêmes réglages que dans PJJoue.');
    const resultatDe = selectionner('#resultatDeParcours');
    if (resultatDe) resultatDe.textContent = 'Lance le dé pour tirer de 1 à 6 questions aléatoires parmi les 72 sigles.';
    const selectPerimetre = selectionner('#perimetreEntrainement');
    const groupePerimetre = document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    if (selectPerimetre && groupePerimetre) {
        selectPerimetre.innerHTML = '<option value="tous">Mission Sigles complète</option>' + [1,2,3,4,5,6].map(numero => `<option value="${numero}">${obtenirIdentiteEtapeMissionSigles(numero).titre}</option>`).join('');
        const boutons = [...groupePerimetre.querySelectorAll('.choix-bouton')];
        boutons.forEach((bouton, index) => {
            if (index === 0) {
                bouton.dataset.valeur = 'tous';
                bouton.innerHTML = '<b>Toute Mission Sigles</b><span>Les 6 étapes</span>';
                bouton.classList.add('entrainement-perimetre-global');
                bouton.style.removeProperty('--parcours-accent');
                bouton.style.removeProperty('--parcours-accent-rgb');
                return;
            }
            const identite = obtenirIdentiteEtapeMissionSigles(index);
            bouton.dataset.valeur = String(index);
            bouton.innerHTML = `<b>${identite.numero} · ${identite.titre}</b><span>${identite.sousTitre}</span>`;
            bouton.style.setProperty('--parcours-accent', identite.couleur);
            bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
            bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        });
        selectPerimetre.value = 'tous';
        groupePerimetre.dataset.selectionEffectuee = 'true';
    }
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const groupeNombre = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (selectNombre && groupeNombre) {
        selectNombre.innerHTML = Array.from({length:63},(_,i)=>i+10).map(n=>`<option value="${n}">${n}</option>`).join('');
        const boutons = [...groupeNombre.querySelectorAll('.choix-bouton')];
        const valeurs = ['10','20','30','72'];
        boutons.forEach((bouton,index)=>{ bouton.dataset.valeur = valeurs[index]; bouton.textContent = index === 3 ? 'Tous' : valeurs[index]; bouton.hidden = false; bouton.disabled = false; });
        selectNombre.value = '10';
        groupeNombre.dataset.selectionEffectuee = 'true';
    }
    const carteOrdonnee = ecran.querySelector('[data-carte-entrainement="ordonne"]');
    const carteMelangee = ecran.querySelector('[data-carte-entrainement="melange"]');
    carteOrdonnee?.querySelector('h3') && (carteOrdonnee.querySelector('h3').textContent = 'Par ordre d’étapes');
    carteOrdonnee?.querySelector(':scope > p') && (carteOrdonnee.querySelector(':scope > p').textContent = 'Suis la progression des étapes de Mission Sigles.');
    carteMelangee?.querySelector('h3') && (carteMelangee.querySelector('h3').textContent = 'Mélangé');
    carteMelangee?.querySelector(':scope > p') && (carteMelangee.querySelector(':scope > p').textContent = 'Brasse les sigles du périmètre choisi.');
    selectionner('#boutonLancerLeDe').onclick = lancerDeSiglesEntrainementNatif;
    selectionner('#boutonJouerLeTirage').onclick = jouerTirageDeSiglesEntrainementNatif;
    if (groupePerimetre) {
        groupePerimetre.querySelectorAll('.choix-bouton').forEach(bouton => {
            const actionOriginale = bouton.onclick;
            bouton.onclick = () => {
                actionOriginale?.();
                actualiserBoutonTousMissionSigles();
                actualiserLimiteQuestionsEntrainement();
                actualiserBoutonTousMissionSigles();
                actualiserGroupesChoix();
            };
        });
    }
    actualiserBoutonTousMissionSigles();
    actualiserLimiteQuestionsEntrainement();
    actualiserBoutonTousMissionSigles();
    actualiserGroupesChoix();
}
function restaurerEntrainementPJJoueNatif() {
    const ecran = selectionner('#entrainement');
    if (!ecran || ecran.dataset.contexteEntrainement !== 'sigles') return;
    ecran.dataset.contexteEntrainement = 'pjjoue';
    etat.contexteEntrainement = null;
    const entete = ecran.querySelector('.entrainement-entete');
    entete?.querySelector('.surtitre') && (entete.querySelector('.surtitre').textContent = 'Entraînement libre');
    entete?.querySelector('h1') && (entete.querySelector('h1').textContent = 'Choisis ta session');
    entete?.querySelector('p') && (entete.querySelector('p').textContent = 'Lance un défi surprise en un clic ou compose précisément ce que tu veux travailler, la durée et l’ordre des questions.');
    const resultatDe = selectionner('#resultatDeParcours');
    if (resultatDe) resultatDe.textContent = 'Lance le dé pour tirer de 1 à 6 questions aléatoires dans les six parcours.';
    const selectPerimetre = selectionner('#perimetreEntrainement');
    const groupePerimetre = document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    const donnees = [
        ['tous','Tout PJJoue','Les 6 parcours'],
        ['commun','01 · Découvrir la PJJ','Point de départ'],
        ['procedure_ordinaire','02 · Du parquet à la sanction','Procédure ordinaire'],
        ['information_judiciaire','03 · Information judiciaire','Instruction'],
        ['jugement_educatif_ordinaire','04 · Réponse éducative','Jugement'],
        ['matiere_criminelle_peines','05 · Crimes et peines','Matière criminelle'],
        ['application_execution_peines','06 · Décision à l’exécution','Application des peines']
    ];
    if (selectPerimetre && groupePerimetre) {
        selectPerimetre.innerHTML = donnees.map(([v,b])=>`<option value="${v}">${b.replace(/^\d+ · /,'')}</option>`).join('');
        [...groupePerimetre.querySelectorAll('.choix-bouton')].forEach((bouton,index)=>{ const [v,b,sp]=donnees[index]; bouton.dataset.valeur=v; bouton.innerHTML=`<b>${b}</b><span>${sp}</span>`; });
        selectPerimetre.value = 'tous';
    }
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const groupeNombre = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (selectNombre && groupeNombre) {
        selectNombre.innerHTML = Array.from({length:65},(_,i)=>(i+1)*10).filter(n=>n<=540||n===660).concat([660]).filter((v,i,a)=>a.indexOf(v)===i).map(n=>`<option value="${n}">${n}</option>`).join('');
        const valeurs=['10','20','50','100'];
        [...groupeNombre.querySelectorAll('.choix-bouton')].forEach((bouton,index)=>{bouton.dataset.valeur=valeurs[index];bouton.textContent=valeurs[index];bouton.hidden=false;});
        selectNombre.value='10';
    }
    selectionner('#boutonLancerLeDe').onclick = lancerDeParcours;
    selectionner('#boutonJouerLeTirage').onclick = jouerTirageDeParcours;
    appliquerCouleursParcoursEntrainement();
    actualiserLimiteQuestionsEntrainement();
    actualiserGroupesChoix();
}
function ouvrirEntrainementMissionSiglesNatif() {
    configurerEntrainementMissionSiglesNatif();
    afficherEcran('entrainement');
}
function lancerDeSiglesEntrainementNatif() {
    const face=selectionner('#faceDeParcours'), resultat=selectionner('#resultatDeParcours'), lancer=selectionner('#boutonLancerLeDe'), jouer=selectionner('#boutonJouerLeTirage');
    if(!face||!resultat||!lancer||!jouer)return;
    const valeur=1+Math.floor(Math.random()*6);
    lancer.disabled=true; jouer.classList.add('masque'); face.classList.remove('de-en-lancer'); void face.offsetWidth; face.classList.add('de-en-lancer');
    window.setTimeout(()=>{
        etat.nombreQuestionsTirageDe=valeur;
        etatJeuSigles.nombreTire=valeur;
        etatJeuSigles.tirageHasard=choisirSansDoublon(SIGLES,valeur);
        face.dataset.face=String(valeur); face.classList.remove('de-en-lancer');
        resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard parmi les 72 sigles.`;
        jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`; jouer.classList.remove('masque');
        lancer.textContent='Relancer le dé'; lancer.disabled=false; jouer.focus({preventScroll:true});
    },420);
}
function jouerTirageDeSiglesEntrainementNatif() {
    const cibles=[...etatJeuSigles.tirageHasard]; if(!cibles.length)return;
    preparerSessionMissionSiglesNative({mode:'hasard',sigles:cibles,questions:creerQuestionsHasardSigles(cibles),jokersActifs:true,titre:`Défi du hasard · ${cibles.length} question${cibles.length===1?'':'s'}`,chronoActif:false});
}
function lancerEntrainementMissionSiglesNatif() {
    const perimetre = selectionner('#perimetreEntrainement')?.value || 'tous';
    const pool = obtenirPoolEntrainementMissionSigles(perimetre);
    const nombre = Math.min(pool.length, Math.max(1, Number(selectionner('#nombreQuestionsEntrainement')?.value) || 10));
    const organisation = etat.organisationSession || 'ordonne';
    let cibles = organisation === 'ordonne'
        ? [...pool].sort((a,b)=>Number(a.etape)-Number(b.etape)||Number(a.id)-Number(b.id)).slice(0,nombre)
        : choisirSansDoublon(pool,nombre);
    const questions = creerQuestionsEntrainementSigles(cibles, organisation === 'melange');
    preparerSessionMissionSiglesNative({
        mode:'entrainement', sigles:cibles, questions,
        jokersActifs: etat.jokersSessionActifs !== false,
        titre:`Entraînement Sigles · ${nombre} sigle${nombre===1?'':'s'}`,
        chronoActif: etat.chronometreSessionActif === true,
        secondesQuestion: etat.dureeChronometreSession || 30
    });
}

function initialiserJeuSigles(){ const racine=selectionnerSigles('#sigles');if(!racine||racine.dataset.initialise==='true')return;racine.dataset.initialise='true';
    selectionnerSigles('#siglesOuvrirParcours')?.addEventListener('click',()=>{actualiserAccueilSigles();afficherVueSigles('parcours');});
    selectionnerSigles('#siglesOuvrirEntrainement')?.addEventListener('click',()=>{actualiserAccueilSigles();ouvrirEntrainementMissionSiglesNatif();});
    selectionnerSigles('#siglesRetourDepuisParcours')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesRetourDepuisEntrainement')?.addEventListener('click',retourAccueilSigles);
    selectionnerSigles('#siglesLancerEntrainement')?.addEventListener('click',lancerEntrainementSigles); selectionnerSigles('#siglesLancerDe')?.addEventListener('click',lancerDeSigles); selectionnerSigles('#siglesJouerTirage')?.addEventListener('click',jouerTirageDeSigles); selectionnerSigles('#siglesLancerRevision')?.addEventListener('click',lancerRevisionSigles); selectionnerSigles('#siglesLancerEvaluation')?.addEventListener('click',lancerEvaluationSigles);
    selectionnerSigles('#siglesQuitterSession')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesPasserQuestion')?.addEventListener('click',passerQuestionSigles); selectionnerSigles('#siglesValiderActivite')?.addEventListener('click',validerAssociationSigles); selectionnerSigles('#siglesQuestionSuivante')?.addEventListener('click',questionSuivanteSigles); selectionnerSigles('#siglesRetourAccueil')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesRejouerSession')?.addEventListener('click',rejouerDerniereSessionSigles);
    selectionnerTousSigles('#siglesChoixNombre button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixNombre'),b);})); selectionnerTousSigles('#siglesChoixOrganisation button').forEach(b=>b.addEventListener('click',()=>activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixOrganisation'),b))); selectionnerTousSigles('#siglesChoixChrono button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixChrono'),b);actualiserChoixChronoSigles();})); selectionnerTousSigles('#siglesChoixSecondes button').forEach(b=>b.addEventListener('click',()=>activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixSecondes'),b))); selectionnerTousSigles('#siglesChoixJokers button').forEach(b=>b.addEventListener('click',()=>activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixJokers'),b))); selectionnerTousSigles('[data-joker-sigles]').forEach(b=>b.addEventListener('click',()=>utiliserJokerSigles(b.dataset.jokerSigles)));
    actualiserAccueilSigles(); actualiserChoixChronoSigles();
}
initialiserJeuSigles();
function obtenirEtatEvaluationProgression(theme) {
    const evaluation = obtenirEvaluationFinaleTheme(theme.id);
    if (evaluation.reussie)
        return { libelle: `Évaluation réussie · ${evaluation.meilleurScore}%`, classe: 'reussie' };
    const programmeTermine = obtenirEtapesProgramme(theme.id).every(etape => {
        const total = obtenirQuestionsEtape(theme.id, etape.id).length;
        return total > 0 && compterQuestionsTraiteesEtape(theme.id, etape.id) >= total;
    });
    if (programmeTermine)
        return { libelle: 'Évaluation ouverte', classe: 'ouverte' };
    return { libelle: 'Évaluation verrouillée', classe: 'verrouillee' };
}
function obtenirAvanceeJalonsProgression(identifiantTheme) {
    initialiserProgression(identifiantTheme);
    const etapes = obtenirEtapesProgramme(identifiantTheme);
    const etapesMaitrisees = etapes.filter(etape => estEtapeMaitrisee(identifiantTheme, etape.id)).length;
    const evaluation = obtenirEvaluationFinaleTheme(identifiantTheme);
    const evaluationReussie = evaluation.reussie === true;
    const jalonsTotal = etapes.length + 1;
    const jalonsValides = etapesMaitrisees + Number(evaluationReussie);
    const aCommence = jalonsValides > 0
        || Number(evaluation.nombreTentatives) > 0
        || etapes.some(etape => compterQuestionsTraiteesEtape(identifiantTheme, etape.id) > 0);
    const estComplet = jalonsTotal > 0 && jalonsValides === jalonsTotal;
    return {
        etapes,
        etapesMaitrisees,
        evaluationReussie,
        jalonsTotal,
        jalonsValides,
        aCommence,
        estComplet,
        pourcentage: jalonsTotal ? Math.round(jalonsValides / jalonsTotal * 100) : 0,
        classe: estComplet ? 'est-complet' : (aCommence ? 'est-entame' : 'est-a-decouvrir'),
        libelle: estComplet ? 'Complet' : (aCommence ? 'Entamé' : 'À découvrir')
    };
}
function construireCarteProgression(theme) {
    const identite = obtenirIdentiteParcours(theme.id);
    const avancee = obtenirAvanceeJalonsProgression(theme.id);
    const evaluation = obtenirEtatEvaluationProgression(theme);
    const carte = document.createElement('article');
    carte.className = `progression-parcours-mis-en-avant ${avancee.classe}`;
    carte.style.setProperty('--parcours-accent', identite.couleur);
    carte.style.setProperty('--parcours-accent-lisible', identite.couleurTexte || identite.couleur);
    carte.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
    const libelleObjectifs = accorderLibelle(avancee.jalonsValides, 'objectif validé', 'objectifs validés');
    carte.innerHTML = `
        <div class="progression-parcours-mis-en-avant-identite">
            <span class="progression-parcours-mis-en-avant-icone">${creerIconeTheme(theme.id, '')}</span>
            <div><span class="progression-parcours-mis-en-avant-chapitre">${identite.chapitre}</span><h3>${identite.titre}</h3></div>
        </div>
        <div class="progression-etats">
            <span class="progression-parcours-statut ${avancee.classe}">${avancee.libelle}</span>
            <span class="progression-etat progression-etat-${evaluation.classe}">${evaluation.libelle}</span>
        </div>
        <div class="progression-parcours-mis-en-avant-avancee">
            <div class="progression-parcours-mis-en-avant-pourcentage"><strong>${avancee.pourcentage}%</strong><span>du parcours</span></div>
            <div class="progression-parcours-mis-en-avant-etapes"><strong>${avancee.jalonsValides}/${avancee.jalonsTotal}</strong><span>${libelleObjectifs}</span></div>
        </div>
        <div class="barre" role="progressbar" aria-label="Progression dans ${identite.titre}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${avancee.pourcentage}" aria-valuetext="${avancee.jalonsValides} ${libelleObjectifs} sur ${avancee.jalonsTotal}"><i style="width:${avancee.pourcentage}%"></i></div>`;
    return carte;
}
function construireCarteProgressionComplete() {
    const avancees = THEMES.map(theme => ({
        theme,
        avancee: obtenirAvanceeJalonsProgression(theme.id)
    }));
    const totalEtapes = avancees.reduce((somme, element) => somme + element.avancee.etapes.length, 0);
    const totalEvaluations = THEMES.length;
    const totalJalons = totalEtapes + totalEvaluations;
    const maitrisees = avancees.reduce((somme, element) => somme + element.avancee.etapesMaitrisees, 0);
    const evaluations = avancees.filter(element => element.avancee.evaluationReussie).length;
    const jalonsValides = maitrisees + evaluations;
    const libelleObjectifs = accorderLibelle(jalonsValides, 'objectif validé', 'objectifs validés');
    const progression = totalJalons ? Math.round(jalonsValides / totalJalons * 100) : 0;
    const jalons = avancees.map(({ theme, avancee }, index) => {
        const identite = obtenirIdentiteParcours(theme.id);
        const libelleObjectifsParcours = accorderLibelle(avancee.jalonsValides, 'objectif validé', 'objectifs validés');
        return `<span class="progression-jalon ${avancee.classe}" style="--parcours-accent:${identite.couleur};--parcours-accent-lisible:${identite.couleurTexte || identite.couleur};--parcours-accent-rgb:${identite.couleurRgb}" aria-label="${identite.titre} : ${avancee.libelle.toLowerCase()}, ${avancee.jalonsValides} ${libelleObjectifsParcours} sur ${avancee.jalonsTotal}">
            <i aria-hidden="true">${String(index + 1).padStart(2, '0')}</i><b aria-hidden="true"></b>
        </span>`;
    }).join('');
    const parcoursComplet = estParcoursCompletReussi();
    const carte = document.createElement('div');
    carte.className = 'progression-global';
    carte.innerHTML = `
        <div class="progression-score">
            <strong>${progression}%</strong>
            <span>progression globale</span>
        </div>
        <div class="progression-global-corps">
            <div class="progression-global-entete">
                <div><strong>${jalonsValides}/${totalJalons} ${libelleObjectifs}</strong><span>${totalEtapes} étapes · ${totalEvaluations} évaluations</span></div>
                <span class="progression-global-statut">${parcoursComplet ? 'Parcours complet validé ✓' : 'En cours'}</span>
            </div>
            <div class="progression-rail" role="progressbar" aria-label="Progression globale" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progression}" aria-valuetext="${jalonsValides} ${libelleObjectifs} sur ${totalJalons} : ${totalEtapes} étapes et ${totalEvaluations} évaluations">
                <span class="progression-rail-remplissage" style="width:${progression}%"></span>
                <div class="progression-jalons">${jalons}</div>
            </div>
            <p>${parcoursComplet ? 'Les six parcours sont validés.' : 'Chaque parcours avance indépendamment et contribue à ta progression globale.'}</p>
        </div>`;
    return carte;
}
function obtenirThemeProgressionParDefaut() {
    const courant = THEMES.find(theme => theme.id === etat.theme);
    if (courant)
        return courant.id;
    const entame = THEMES.find(theme => obtenirAvanceeJalonsProgression(theme.id).aCommence);
    return (entame || THEMES[0]).id;
}
function activerPastilleProgression(identifiantTheme) {
    document.querySelectorAll('#listeProgressionParcours .progression-pastille').forEach(bouton => {
        const active = bouton.dataset.theme === identifiantTheme;
        bouton.classList.toggle('est-active', active);
        bouton.setAttribute('aria-selected', String(active));
        bouton.tabIndex = active ? 0 : -1;
    });
}
function afficherDetailProgressionParcours(identifiantTheme) {
    const zone = selectionner('#detailProgressionParcours');
    const theme = THEMES.find(candidat => candidat.id === identifiantTheme) || THEMES[0];
    if (!zone)
        return;
    zone.replaceChildren(construireCarteProgression(theme));
    zone.setAttribute('aria-labelledby', `ongletProgressionParcours-${theme.id}`);
    activerPastilleProgression(theme.id);
}
function gererClavierPastillesProgression(event) {
    const boutons = [...document.querySelectorAll('#listeProgressionParcours .progression-pastille')];
    const index = boutons.indexOf(event.currentTarget);
    if (!boutons.length || index < 0)
        return;
    let suivant = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') suivant = (index + 1) % boutons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') suivant = (index - 1 + boutons.length) % boutons.length;
    if (event.key === 'Home') suivant = 0;
    if (event.key === 'End') suivant = boutons.length - 1;
    if (suivant === null) return;
    event.preventDefault();
    boutons[suivant].focus();
    afficherDetailProgressionParcours(boutons[suivant].dataset.theme);
}
function remplirPastillesProgression() {
    const zone = selectionner('#listeProgressionParcours');
    if (!zone)
        return;
    zone.innerHTML = '';
    THEMES.forEach(theme => {
        const identite = obtenirIdentiteParcours(theme.id);
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'progression-pastille';
        bouton.dataset.theme = theme.id;
        bouton.id = `ongletProgressionParcours-${theme.id}`;
        bouton.style.setProperty('--parcours-accent', identite.couleur);
        bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte || identite.couleur);
        bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        bouton.setAttribute('role', 'tab');
        bouton.setAttribute('aria-controls', 'detailProgressionParcours');
        bouton.setAttribute('aria-selected', 'false');
        bouton.tabIndex = -1;
        bouton.innerHTML = `<span>${identite.numero}</span><strong>${identite.titre}</strong>`;
        bouton.onclick = () => afficherDetailProgressionParcours(theme.id);
        bouton.onkeydown = gererClavierPastillesProgression;
        zone.appendChild(bouton);
    });
    afficherDetailProgressionParcours(obtenirThemeProgressionParDefaut());
}
function afficherProgression() {
    actualiserAccueil();
    const zone = selectionner('#tableauProgression');
    if (!zone)
        return;
    zone.replaceChildren(construireCarteProgressionComplete());
    remplirPastillesProgression();
}
// -----------------------------------------------------------------------------
// Paramètres, import/export, sons et effets de célébration
// -----------------------------------------------------------------------------
function appliquerDisponibiliteVolumeSon() {
    const volume = selectionner('#volumeSon');
    const parametreVolume = volume?.closest('.parametre-volume');
    if (!volume)
        return;
    const sonActif = sauvegarde.parametres.son !== false;
    volume.disabled = !sonActif;
    volume.setAttribute('aria-disabled', String(!sonActif));
    parametreVolume?.classList.toggle('parametre-desactive', !sonActif);
}
function chargerParametres() {
    const parametres = sauvegarde.parametres;
    selectionner('#sonActif').value = String(parametres.son !== false);
    selectionner('#volumeSon').value = parametres.volume;
    selectionner('#echelleTexte').value = String(parametres.echelleTexte || 1);
    document.documentElement.style.setProperty('--echelle-texte', String(parametres.echelleTexte || 1));
    appliquerDisponibiliteVolumeSon();
    requestAnimationFrame(mesurerHauteurEntete);
    actualiserGroupesChoix();
}
function enregistrerParametres() {
    const sonEtaitActif = sauvegarde.parametres.son !== false;
    sauvegarde.parametres = {
        son: selectionner('#sonActif').value === 'true',
        volume: Number(selectionner('#volumeSon').value),
        echelleTexte: Number(selectionner('#echelleTexte').value)
    };
    enregistrerSauvegarde();
    chargerParametres();
    envoyerEvenementPJJ('parametres_enregistres', {
        pjjoue_page_consultee: 'Paramètres',
        pjjoue_son: sauvegarde.parametres.son ? 'Activé' : 'Désactivé',
        pjjoue_taille_texte: obtenirLibelleTailleTexteAnalytics(sauvegarde.parametres.echelleTexte)
    });
    if (!sonEtaitActif && sauvegarde.parametres.son) {
        initialiserAudio();
        jouerSonReussite();
    }
}
function exporterProgression() {
    const contenuFichier = new Blob([JSON.stringify(sauvegarde, null, 2)], { type: 'application/json' });
    const lienTelechargement = document.createElement('a');
    lienTelechargement.href = URL.createObjectURL(contenuFichier);
    lienTelechargement.download = 'PJJoue_progression.json';
    lienTelechargement.click();
    URL.revokeObjectURL(lienTelechargement.href);
    envoyerEvenementPJJ('progression_exportee', {
        pjjoue_page_consultee: 'Progression'
    });
}
function importerProgression(fichier) {
    if (!fichier)
        return;
    if (fichier.size > 5 * 1024 * 1024) {
        ouvrirFenetreMessage({ titre: 'Import impossible', message: 'Le fichier dépasse la limite autorisée de 5 Mo.', libelleConfirmer: 'Fermer' });
        return;
    }
    const lecteur = new FileReader();
    lecteur.onload = () => {
        try {
            const importee = JSON.parse(lecteur.result);
            if (!estObjetSimple(importee))
                throw Error('le contenu n’est pas un objet de sauvegarde');
            if (importee.progression != null && !estObjetSimple(importee.progression))
                throw Error('la progression est mal structurée');
            if (importee.erreurs != null && !estObjetSimple(importee.erreurs))
                throw Error('la banque de révision est mal structurée');
            sauvegarde = nettoyerSauvegarde(importee);
            effacerSauvegardeDuNavigateur();
            enregistrerSauvegarde();
            actualiserAccueil();
            envoyerEvenementPJJ('progression_importee', {
                pjjoue_page_consultee: 'Progression'
            });
            afficherNotification('Progression importée et vérifiée');
        }
        catch (erreur) {
            ouvrirFenetreMessage({ titre: 'Import impossible', message: erreur.message, libelleConfirmer: 'Fermer' });
        }
    };
    lecteur.onerror = () => ouvrirFenetreMessage({ titre: 'Import impossible', message: 'Le fichier n’a pas pu être lu.', libelleConfirmer: 'Fermer' });
    lecteur.readAsText(fichier);
}
let contexteAudio = null;
function initialiserAudio() {
    if (!contexteAudio)
        contexteAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (contexteAudio.state === 'suspended')
        contexteAudio.resume();
}
function jouerTonalite(frequence, demarrage, duree, formeOnde = 'sine', intensite = 1) {
    if (!sauvegarde.parametres.son)
        return;
    initialiserAudio();
    const oscillateur = contexteAudio.createOscillator();
    const amplificateur = contexteAudio.createGain();
    oscillateur.type = formeOnde;
    oscillateur.frequency.setValueAtTime(frequence, contexteAudio.currentTime + demarrage);
    const volume = Number(sauvegarde.parametres.volume || .65) * .18 * intensite;
    amplificateur.gain.setValueAtTime(.001, contexteAudio.currentTime + demarrage);
    amplificateur.gain.exponentialRampToValueAtTime(Math.max(.002, volume), contexteAudio.currentTime + demarrage + .025);
    amplificateur.gain.exponentialRampToValueAtTime(.001, contexteAudio.currentTime + demarrage + duree);
    oscillateur.connect(amplificateur).connect(contexteAudio.destination);
    oscillateur.start(contexteAudio.currentTime + demarrage);
    oscillateur.stop(contexteAudio.currentTime + demarrage + duree + .05);
}
function jouerSonReussite() {
    jouerTonalite(523, 0, .18, 'triangle', .9);
    jouerTonalite(659, .11, .22, 'triangle', 1);
    jouerTonalite(784, .25, .26, 'triangle', 1);
    jouerTonalite(1047, .4, .38, 'sine', .85);
}
function jouerSonErreur() {
    jouerTonalite(196, 0, .25, 'sawtooth', .65);
    jouerTonalite(155, .18, .3, 'sawtooth', .65);
    jouerTonalite(110, .41, .45, 'square', .45);
}
function jouerSonEtapeSansJoker() {
    if (!sauvegarde.parametres.son)
        return;
    const melodie = [523, 659, 784, 1047, 988, 1047, 1175, 1319];
    const demarrages = [0, .18, .36, .58, .82, 1.02, 1.22, 1.48];
    const durees = [.24, .24, .28, .34, .22, .25, .28, .58];
    melodie.forEach((frequence, indice) => jouerTonalite(frequence, demarrages[indice], durees[indice], indice < 4 ? 'triangle' : 'sine', indice === 7 ? .72 : .54));
    [[261.6, 329.6, 392], [349.2, 440, 523.3], [392, 493.9, 587.3], [523.3, 659.3, 784]].forEach((accord, indiceAccord) => {
        const demarrage = [0, .58, 1.02, 1.48][indiceAccord];
        accord.forEach((frequence, indiceNote) => jouerTonalite(frequence, demarrage, indiceAccord === 3 ? .72 : .38, indiceNote === 0 ? 'triangle' : 'sine', indiceNote === 0 ? .28 : .18));
    });
    [1319, 1568, 2093].forEach((frequence, indice) => jouerTonalite(frequence, 1.78 + indice * .12, .28, 'sine', .28));
}
function jouerSonEvaluationFinale() {
    if (!sauvegarde.parametres.son)
        return;
    const fanfare = [523, 523, 659, 784, 659, 784, 1047, 988, 1047, 1319, 1568, 2093];
    const demarrages = [0, .16, .32, .49, .72, .88, 1.05, 1.34, 1.50, 1.72, 2.02, 2.34];
    const durees = [.20, .20, .22, .36, .20, .22, .38, .20, .24, .42, .48, .82];
    fanfare.forEach((frequence, indice) => jouerTonalite(frequence, demarrages[indice], durees[indice], indice < 9 ? 'triangle' : 'sine', indice >= 9 ? .58 : .46));
    const accords = [
        { demarrage: 0, frequences: [261.6, 329.6, 392] },
        { demarrage: .49, frequences: [349.2, 440, 523.3] },
        { demarrage: 1.05, frequences: [392, 493.9, 587.3] },
        { demarrage: 1.50, frequences: [523.3, 659.3, 784] },
        { demarrage: 2.02, frequences: [392, 523.3, 659.3, 784] },
        { demarrage: 2.34, frequences: [523.3, 659.3, 784, 1047] }
    ];
    accords.forEach(({ demarrage, frequences }, indiceAccord) => {
        frequences.forEach((frequence, indiceNote) => {
            jouerTonalite(
                frequence,
                demarrage,
                indiceAccord >= 4 ? .86 : .42,
                indiceNote === 0 ? 'triangle' : 'sine',
                indiceNote === 0 ? .25 : .15
            );
        });
    });
    [130.8, 196, 261.6, 196, 261.6, 392].forEach((frequence, indice) => jouerTonalite(frequence, [0, .49, 1.05, 1.50, 2.02, 2.34][indice], .32, 'square', .11));
    [2093, 2349, 2637, 3136].forEach((frequence, indice) => jouerTonalite(frequence, 2.62 + indice * .14, .36, 'sine', .24));
}
function lancerConfettis(intensite = 1, cible = document.body) {
    const intensiteEffective = Math.max(1, Math.min(4, Number(intensite) || 1));
    const nombreConfettis = Math.round(70 * intensiteEffective);
    const conteneur = cible || document.body;
    const couleurs = ['#ffd166', '#3ddc97', '#ffffff', '#ff5b78', '#9b6cff', '#35d6ff'];
    for (let indiceConfetti = 0; indiceConfetti < nombreConfettis; indiceConfetti++) {
        const confetti = document.createElement('i');
        confetti.setAttribute('aria-hidden', 'true');
        Object.assign(confetti.style, {
            position: 'fixed',
            left: (Math.random() * 100) + 'vw',
            top: '-28px',
            width: (7 + Math.random() * 7) + 'px',
            height: (10 + Math.random() * 12) + 'px',
            borderRadius: Math.random() > .55 ? '50%' : '2px',
            background: couleurs[indiceConfetti % couleurs.length],
            pointerEvents: 'none',
            zIndex: '2147483647',
            opacity: '1',
            transform: `translate3d(0,0,0) rotate(${Math.random() * 180}deg)`
        });
        conteneur.appendChild(confetti);
        const deplacementHorizontal = Math.random() * (280 + intensiteEffective * 70) - (140 + intensiteEffective * 35);
        const deplacementVertical = window.innerHeight + 80 + Math.random() * 180;
        const nombreTours = (2 + Math.random() * 5) * (Math.random() > .5 ? 1 : -1);
        const duree = 1500 + Math.random() * 900 + intensiteEffective * 120;
        const delai = Math.random() * 300;
        const animation = confetti.animate([
            { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate3d(${deplacementHorizontal * .35}px,${deplacementVertical * .45}px,0) rotate(${nombreTours * 180}deg)`, opacity: 1, offset: .48 },
            { transform: `translate3d(${deplacementHorizontal}px,${deplacementVertical}px,0) rotate(${nombreTours * 360}deg)`, opacity: .92 }
        ], { duration: duree, delay: delai, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' });
        animation.onfinish = () => confetti.remove();
    }
}
// -----------------------------------------------------------------------------
// Branchement des commandes de l’interface
// -----------------------------------------------------------------------------
selectionnerTous('[data-ecran]').forEach(bouton => bouton.onclick = () => {
    if (etat.ecran === 'parametres')
        enregistrerParametres();
    if (bouton.dataset.ecran === 'parcours') {
        ouvrirChoixParcours();
        return;
    }
    if (bouton.dataset.ecran === 'entrainement' && bouton.id === 'boutonEntrainementLibre')
        restaurerEntrainementPJJoueNatif();
    if (bouton.dataset.ecran === 'erreurs' && bouton.id === 'boutonReviser')
        etat.contexteRevision = null;
    afficherEcran(bouton.dataset.ecran);
});
const lienEvitement = selectionner('.passer-lien');
if (lienEvitement)
    lienEvitement.addEventListener('click', evenement => {
        evenement.preventDefault();
        const cible = selectionner('#contenuPrincipal');
        cible?.focus({ preventScroll: true });
        cible?.scrollIntoView({ block: 'start' });
    });
const boutonLancerLeDe = selectionner('#boutonLancerLeDe');
if (boutonLancerLeDe)
    boutonLancerLeDe.onclick = lancerDeParcours;
const boutonJouerLeTirage = selectionner('#boutonJouerLeTirage');
if (boutonJouerLeTirage)
    boutonJouerLeTirage.onclick = jouerTirageDeParcours;
selectionner('#boutonQuestionSuivante').onclick = afficherQuestionSuivante;
selectionner('#boutonQuestionPrecedente').onclick = afficherQuestionPrecedente;
selectionner('#boutonPasser').onclick = demanderPassageQuestion;
selectionner('#boutonReinitialiserValidationsSansJoker')?.addEventListener('click', demanderReinitialisationSansJoker);
function initialiserFenetreJokers() {
    const declencheur = selectionner('#boutonJokers');
    const fenetre = selectionner('#fenetreJokers');
    const boutonFermer = selectionner('#fermerFenetreJokers');
    const boutonCinquanteCinquante = selectionner('#boutonJoker5050');
    const boutonIndice = selectionner('#boutonJokerIndice');
    const boutonLangueAuChat = selectionner('#boutonJokerLangueAuChat');
    if (!declencheur || !fenetre || !boutonFermer || !boutonCinquanteCinquante || !boutonIndice || !boutonLangueAuChat) {
        console.warn('PJJoue : interface des jokers incomplète ; le reste du site reste disponible.');
        return;
    }
    declencheur.onclick = ouvrirFenetreJokers;
    boutonFermer.onclick = () => fermerFenetreJokers();
    fenetre.oncancel = evenement => { evenement.preventDefault(); fermerFenetreJokers(); };
    fenetre.addEventListener('close', () => declencheur.setAttribute('aria-expanded', 'false'));
    boutonCinquanteCinquante.onclick = () => { fermerFenetreJokers({ restaurerFocus: false }); utiliserJoker5050(); actualiserBoutonJokers(); };
    boutonIndice.onclick = () => { fermerFenetreJokers({ restaurerFocus: false }); utiliserIndice('indice'); actualiserBoutonJokers(); };
    boutonLangueAuChat.onclick = () => { fermerFenetreJokers({ restaurerFocus: false }); utiliserLangueAuChat(); actualiserBoutonJokers(); };
}
initialiserFenetreJokers();
selectionner('#boutonRetour').onclick = revenirEnArriere;
selectionner('#boutonRejouerMesErreurs').onclick = () => afficherEcran('erreurs');
selectionner('#boutonRevenirAuParcours').onclick = () => ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || 'commun', { remplacerHistorique: true });
selectionner('#boutonOuvrirParcours').onclick = () => ouvrirChoixParcours();
selectionner('#boutonExporterMaProgression').onclick = exporterProgression;
const boutonImporterProgression = selectionner('#boutonImporterProgression');
const fichierImporterProgression = selectionner('#fichierImporterProgression');
boutonImporterProgression.onclick = () => {
    fichierImporterProgression.value = '';
    fichierImporterProgression.click();
};
fichierImporterProgression.onchange = evenement => evenement.target.files[0] && importerProgression(evenement.target.files[0]);
selectionner('#volumeSon').onchange = enregistrerParametres;
selectionner('#boutonReinitialiserTouteLaProgression').onclick = () => ouvrirFenetreMessage({
    titre: 'Réinitialiser toute la progression ?',
    message: 'Les scores, les étapes validées et les erreurs enregistrées seront définitivement supprimés de ce navigateur.',
    libelleConfirmer: 'Réinitialiser',
    libelleAnnuler: 'Annuler',
    afficherAnnuler: true,
    variante: 'danger',
    apresConfirmation: () => {
        envoyerEvenementPJJ('progression_reinitialisee', {
            pjjoue_page_consultee: 'Progression'
        });
        sauvegarde = creerSauvegardeInitiale();
        effacerSauvegardeDuNavigateur();
        effacerSessionEnCours();
        enregistrerSauvegarde();
        actualiserAccueil();
        requestAnimationFrame(() => ouvrirFenetreMessage({
            titre: 'Progression réinitialisée',
            message: 'Ta progression a bien été supprimée sur ce navigateur. Tu peux maintenant repartir de zéro.',
            libelleConfirmer: 'Compris',
            variante: 'reussite'
        }));
    }
});
function validerQuestionAvecEntree(evenement) {
    if (evenement.key !== 'Enter' || evenement.repeat || evenement.isComposing || etat.ecran !== 'question' || etat.questionValidee)
        return false;
    const cibleClavier = evenement.target;
    const commandeDistincte = cibleClavier?.closest?.('button:not(#boutonValider), a, select, textarea, [contenteditable="true"]');
    if (commandeDistincte)
        return false;
    const boutonValider = selectionner('#boutonValider');
    if (!boutonValider || boutonValider.disabled || boutonValider.classList.contains('masque'))
        return false;
    evenement.preventDefault();
    boutonValider.click();
    return true;
}
document.addEventListener('keydown', evenement => {
    if (etat.ecran !== 'question')
        return;
    if (validerQuestionAvecEntree(evenement))
        return;
    const cibleClavier = evenement.target;
    const saisieEnCours = cibleClavier && (cibleClavier.matches?.('input, textarea, select') || cibleClavier.isContentEditable);
    if (saisieEnCours)
        return;
    if (!etat.questionValidee) {
        const nombre = Number(evenement.key);
        if (nombre >= 1 && nombre <= 4)
            document.querySelector(`.reponse[data-indice-reponse="${nombre - 1}"]`)?.click();
        if (evenement.key.toLocaleLowerCase('fr-FR') === 'p' && !selectionner('#boutonPasser').classList.contains('masque'))
            selectionner('#boutonPasser').click();
    }
    if (evenement.key === 'ArrowLeft') {
        evenement.preventDefault();
        afficherQuestionPrecedente();
        return;
    }
    if (evenement.key === 'ArrowRight' && !selectionner('#boutonQuestionSuivante').classList.contains('masque')) {
        evenement.preventDefault();
        afficherQuestionSuivante();
    }
});
document.addEventListener('click', evenement => {
    const cible = evenement.target.closest('[data-action]');
    if (!cible)
        return;
    const action = cible.dataset.action;
    if (action === 'valider-reponse-ecrite')
        validerActiviteEcrite();
    else if (action === 'valider-eliminations')
        validerEliminations();
    else if (action === 'valider-activite')
        validerActiviteInteractive();
    else if (action === 'basculer-elimination')
        basculerElimination(Number(cible.dataset.indice));
    else if (action === 'basculer-selection-multiple')
        basculerChoixMultiple(cible.dataset.proposition);
    else if (action === 'deplacer-ordre')
        deplacerElementOrdre(Number(cible.dataset.indice), Number(cible.dataset.direction));
    else if (action === 'ajouter-choix-ordre')
        ajouterChoixOrdre(cible.dataset.element);
    else if (action === 'retirer-choix-ordre')
        retirerChoixOrdre(Number(cible.dataset.indice));
    else if (action === 'deplacer-choix-ordre')
        deplacerChoixOrdre(Number(cible.dataset.indice), Number(cible.dataset.direction));
    else if (action === 'selectionner-association')
        selectionnerAssociation(cible.dataset.cote, cible.dataset.element);
    else if (action === 'attribuer-categorie')
        attribuerCategorie(cible.dataset.element, cible.dataset.categorie);
    else if (action === 'reviser-toutes-erreurs')
        lancerRevision('toutes');
    else if (action === 'reviser-theme')
        lancerRevision(cible.dataset.theme);
    else if (action === 'reviser-etape')
        lancerRevisionEtape(cible.dataset.theme || 'commun', cible.dataset.etape);
    else if (action === 'reviser-toutes-erreurs-sigles')
        lancerToutesErreursSiglesDepuisRevision();
    else if (action === 'reviser-etape-sigles')
        lancerRevisionEtapeSiglesDepuisRevision(cible.dataset.etape);
    else if (action === 'ouvrir-parcours-depuis-erreurs')
        ouvrirChoixParcours();
    else if (action === 'ouvrir-mission-sigles-depuis-erreurs')
        afficherEcran('sigles');
});
mesurerHauteurEntete();
selectionner('#boutonMenuMobile')?.addEventListener('click', evenement => {
    evenement.stopPropagation();
    basculerMenuPrincipal();
});
document.addEventListener('click', evenement => {
    const entete = document.querySelector('header.entete');
    if (entete?.classList.contains('menu-mobile-ouvert') && !entete.contains(evenement.target))
        fermerMenuPrincipal();
});
document.addEventListener('keydown', evenement => {
    const entete = document.querySelector('header.entete');
    if (!entete?.classList.contains('menu-mobile-ouvert'))
        return;
    if (evenement.key === 'Escape') {
        fermerMenuPrincipal();
        selectionner('#boutonMenuMobile')?.focus();
        return;
    }
    if (evenement.key !== 'Tab')
        return;
    const elements = [
        selectionner('#boutonMenuMobile'),
        ...selectionnerTous('#menuPrincipal button:not(:disabled), #menuPrincipal a[href]')
    ].filter(Boolean);
    if (!elements.length)
        return;
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (evenement.shiftKey && document.activeElement === premier) {
        evenement.preventDefault();
        dernier.focus();
    } else if (!evenement.shiftKey && document.activeElement === dernier) {
        evenement.preventDefault();
        premier.focus();
    }
});
window.addEventListener('resize', mesurerHauteurEntete, { passive: true });
initialiserGroupesChoix();
initialiserRechercheSupports();
actualiserAccueil();
restaurerRoute(history.state || lireRoute());
garantirAccueilEnHaut();
window.addEventListener('pageshow', garantirAccueilEnHaut);
window.addEventListener('load', garantirAccueilEnHaut);
window.addEventListener('pjjoue:consentement-change', evenement => {
    if (evenement.detail?.analytics !== true)
        return;
    envoyerEvenementPJJ('page_consultee', {
        pjjoue_page_consultee: obtenirLibellePageAnalytics(etat.ecran),
        pjjoue_page_precedente: obtenirLibellePageAnalytics('consentement')
    });
});
window.addEventListener('hashchange', garantirAccueilEnHaut);
function verifierRenduQuestionActif() {
    if (etat.ecran !== 'question' || !etat.questionsSession?.length)
        return;
    const question = etat.questionsSession[etat.indexQuestion];
    const enonce = selectionner('#enonceQuestion');
    const zoneReponses = selectionner('#zoneReponses');
    if (!question)
        return;
    const contenuManquant = !enonce?.textContent?.trim() || !zoneReponses?.children?.length;
    if (!contenuManquant) {
        enregistrerSessionEnCours();
        return;
    }
    const tempsRestant = etat.tempsRestant;
    afficherQuestion({ suivreAnalytics: false, reprendreChronometre: true });
    etat.tempsRestant = tempsRestant;
}
window.addEventListener('resize', () => {
    clearTimeout(window.__pjjoueMinuteurAjustementQuestion);
    window.__pjjoueMinuteurAjustementQuestion = setTimeout(() => {
        verifierRenduQuestionActif();
        ajusterQuestionAEcran();
    }, 80);
});
window.addEventListener('pagehide', enregistrerSessionEnCours);
window.addEventListener('hashchange', () => {
    setTimeout(ajusterQuestionAEcran, 40);
});
document.addEventListener('click', () => {
    setTimeout(ajusterQuestionAEcran, 40);
});
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ajusterQuestionAEcran, 80);
});
document.addEventListener('click', evenement => {
    const boutonBascule = evenement.target.closest('.entrainement-bascule-groupe .option-bouton');
    if (boutonBascule) {
        const groupe = boutonBascule.closest('.entrainement-bascule-groupe');
        groupe.dataset.selectionEffectuee = 'true';
        groupe.querySelectorAll('.option-bouton').forEach(boutonDuGroupe => boutonDuGroupe.classList.toggle('actif', boutonDuGroupe === boutonBascule));
        if (groupe.dataset.proposition === 'chronometre') {
            const carte = groupe.closest('[data-carte-entrainement]');
            carte?.querySelector('[data-secondes-chronometre]')?.classList.toggle('masque', boutonBascule.dataset.valeur !== 'oui');
        }
        return;
    }
    const boutonSecondes = evenement.target.closest('.entrainement-secondes-groupe .choix-bouton');
    if (boutonSecondes && !boutonSecondes.closest('#secondesChronometreParcours')) {
        const groupe = boutonSecondes.closest('.entrainement-secondes-groupe');
        groupe.dataset.selectionEffectuee = 'true';
        groupe.querySelectorAll('.choix-bouton').forEach(boutonDuGroupe => boutonDuGroupe.classList.toggle('actif', boutonDuGroupe === boutonSecondes));
        return;
    }
    const boutonLancer = evenement.target.closest('.entrainement-lancer');
    if (boutonLancer) {
        const carte = boutonLancer.closest('[data-carte-entrainement]');
        const valeurJokers = carte.querySelector('[data-proposition="jokers"] .option-bouton.actif')?.dataset.valeur || 'oui';
        const valeurMinuteur = carte.querySelector('[data-proposition="chronometre"] .option-bouton.actif')?.dataset.valeur || 'non';
        const secondes = Number(carte.querySelector('.entrainement-secondes-groupe .choix-bouton.actif')?.dataset.secondes) || 15;
        etat.organisationSession = boutonLancer.dataset.organisationSession || 'ordonne';
        etat.jokersSessionActifs = valeurJokers === 'oui';
        etat.chronometreSessionActif = valeurMinuteur === 'oui';
        etat.dureeChronometreSession = Math.min(30, Math.max(5, secondes));
        lancerEntrainementLibre();
        return;
    }
    const choixChronometreParcours = evenement.target.closest('#choixChronometreParcours .option-bouton');
    if (choixChronometreParcours) {
        document.querySelectorAll('#choixChronometreParcours .option-bouton').forEach(boutonDuGroupe => boutonDuGroupe.classList.toggle('actif', boutonDuGroupe === choixChronometreParcours));
        etat.chronometreParcoursActif = choixChronometreParcours.dataset.valeur === 'oui';
        selectionner('#secondesChronometreParcours')?.classList.toggle('masque', !etat.chronometreParcoursActif);
        return;
    }
    const secondesParcours = evenement.target.closest('#secondesChronometreParcours .choix-bouton');
    if (secondesParcours) {
        document.querySelectorAll('#secondesChronometreParcours .choix-bouton').forEach(boutonDuGroupe => {
            const actif = boutonDuGroupe === secondesParcours;
            boutonDuGroupe.classList.toggle('actif', actif);
            boutonDuGroupe.setAttribute('aria-pressed', actif ? 'true' : 'false');
        });
        const secondes = Number(secondesParcours.dataset.secondes);
        etat.dureeChronometreParcours = Math.min(30, Math.max(5, Number.isFinite(secondes) ? secondes : 15));
        return;
    }
});
