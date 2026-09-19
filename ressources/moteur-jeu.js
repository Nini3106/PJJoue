Warning: truncated output (original token count: 113159)
Total output lines: 8264

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
const { THEMES, PROGRAMMES, SOURCES, QUESTIONS, SIGLES = [], MESURES_MISSION = { etapes:[], reperes:[], evaluation:[] } } = window.DONNEES_PJJ;
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
    mesures: 'Mission Mesures',
    'mesures-revision': 'Réviser mes erreurs · Mission Mesures',
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
function creerProgressionMesuresInitiale() {
    const numeros = (MESURES_MISSION?.etapes || []).map(etape => Number(etape.numero)).filter(Number.isFinite);
    return {
        decouverts: {},
        etapes: Object.fromEntries(numeros.map(numero => [String(numero), {
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
        siglesJeu: creerProgressionSiglesInitiale(),
        mesuresJeu: creerProgressionMesuresInitiale()
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
function nettoyerProgressionMesures(sauvegardeBrute) {
    const initiale = creerProgressionMesuresInitiale();
    const brute = estObjetSimple(sauvegardeBrute?.mesuresJeu) ? sauvegardeBrute.mesuresJeu : {};
    const reperes = MESURES_MISSION?.reperes || [];
    const identifiants = new Set(reperes.map(element => String(element.cle || '')));
    const filtrerActifs = valeur => estObjetSimple(valeur)
        ? Object.fromEntries(Object.entries(valeur).filter(([cle, actif]) => identifiants.has(String(cle)) && actif === true))
        : {};
    const erreurs = {};
    if (estObjetSimple(brute.erreurs)) {
        for (const [cle, valeur] of Object.entries(brute.erreurs)) {
            if (!identifiants.has(String(cle)) || !estObjetSimple(valeur)) continue;
            erreurs[String(cle)] = {
                active: valeur.active === true,
                nombreErreurs: convertirEntierBorne(valeur.nombreErreurs),
                reussitesRevision: convertirEntierBorne(valeur.reussitesRevision, 0, 2)
            };
        }
    }
    const etapes = {};
    for (const numero of (MESURES_MISSION?.etapes || []).map(etape => Number(etape.numero))) {
        const cleEtape = String(numero);
        const source = estObjetSimple(brute.etapes?.[cleEtape]) ? brute.etapes[cleEtape] : {};
        const autorises = new Set(reperes.filter(element => Number(element.etape) === numero).map(element => String(element.cle)));
        const filtrerEtape = valeur => estObjetSimple(valeur)
            ? Object.fromEntries(Object.entries(valeur).filter(([cle, actif]) => autorises.has(String(cle)) && actif === true))
            : {};
        etapes[cleEtape] = {
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
        decouverts: filtrerActifs(brute.decouverts),
        etapes: Object.keys(etapes).length ? etapes : initiale.etapes,
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
        siglesJeu: nettoyerProgressionSigles(sauvegardeBrute),
        mesuresJeu: nettoyerProgressionMesures(sauvegardeBrute)
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
    mesures: 'mission-mesures',
    'mesures-revision': 'mission-mesures/revision',
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
    mesures: 'Mission Mesures',
    'mesures-revision': 'Réviser mes erreurs · Mission Mesures',
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
    if (identifiant === 'mesures-revision')
        afficherRevisionMesures();
    if (identifiant === 'progression')
        afficherProgression();
    if (identifiant === 'sigles')
        actualiserAccueilSigles();
    if (identifiant === 'mesures')
        actualiserAccueilMesures();
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
        const secours = estSessionMissionMesures?.() ? 'mesures'
            : (estSessionMissionSigles?.() ? 'sigles'
            : (etat.mode === 'parcours' || etat.mode === 'evaluation-finale' ? 'parcours' : (etat.mode === 'revision' ? 'erreurs' : 'entrainement')));
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
    const ecransAutorises = ['accueil', 'parcours', 'carnet', 'entrainement', 'erreurs', 'sigles', 'sigles-revision', 'mesures', 'mesures-revision', 'supports', 'progression', 'parametres', 'question', 'bilan'];
    return { pjjoue: true, ecran: ecransAutorises.includes(parties[0]) ? parties[0] : 'accueil' };
}
function lireRoute() {
    const routeRelayee = new URLSearchParams(location.search).get('pjjoue_route');
    if (routeRelayee)
        return lireRouteDepuisChemin(routeRelayee === 'accueil' ? '' : routeRelayee);

    // Compatibilité silencieuse avec d’anciens favoris locaux : on sait encore les lire,
    // mais l’adresse est immédiatement réécrite sans # par restaurerRoute().
    if (location.hash && /^#(?:accueil|parcours|carnet|entrainement|erreurs|sigles|sigles-revision|mesures|mesures-revision|supports|progression|parametres|question|bilan)(?:\/|$)/.test(location.hash))
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
      …63159 tokens truncated…Directes}</div></details>
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
        if (etatJeuSigles.celebrationEtapeADiffuser) {
            const numero = Number(etatJeuSigles.celebrationEtapeADiffuser);
            celebration = {
                titre: `Étape ${String(numero).padStart(2, '0')} maîtrisée !`,
                message: 'Les erreurs rejouées ont été réussies sans joker : la progression de l’étape est à jour.',
                confetti: true
            };
        }
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
    const boutonTous = selectionner('#boutonEntrainementTousQuestions');
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    if (boutonTous) {
        boutonTous.dataset.valeur = 'tous';
        boutonTous.dataset.nombreMax = String(maximum);
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
                bouton.innerHTML = '<b>Tout Mission Sigles</b><span>Les 6 étapes</span>';
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
        const valeurs = ['10','20','30','tous'];
        boutons.forEach((bouton,index)=>{ bouton.dataset.valeur = valeurs[index]; bouton.textContent = index === 3 ? 'Tous' : valeurs[index]; bouton.hidden = false; bouton.disabled = false; });
        selectNombre.value = '10';
        groupeNombre.dataset.selectionEffectuee = 'true';
        groupeNombre.dataset.modeSelectionNombre = 'rapide';
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
    if (!ecran || !['sigles','mesures'].includes(ecran.dataset.contexteEntrainement)) return;
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
        groupePerimetre.innerHTML = donnees.map(([v,b,sp],index)=>`<button class="choix-bouton${index===0?' actif entrainement-perimetre-global':''}" data-valeur="${v}" type="button"><b>${b}</b><span>${sp}</span></button>`).join('');
        selectPerimetre.value = 'tous';
        groupePerimetre.dataset.selectionEffectuee = 'true';
    }
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const groupeNombre = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (selectNombre && groupeNombre) {
        selectNombre.innerHTML = Array.from({length:54},(_,i)=>(i+1)*10).concat([660]).map(n=>`<option value="${n}">${n}</option>`).join('');
        const valeurs=['10','20','30','tous'];
        [...groupeNombre.querySelectorAll('.choix-bouton')].forEach((bouton,index)=>{bouton.dataset.valeur=valeurs[index];bouton.textContent=index===3?'Tous':valeurs[index];bouton.hidden=false;bouton.disabled=false;});
        selectNombre.value='10';
        groupeNombre.dataset.modeSelectionNombre='rapide';
    }
    const carteOrdonnee = ecran.querySelector('[data-carte-entrainement="ordonne"]');
    const carteMelangee = ecran.querySelector('[data-carte-entrainement="melange"]');
    carteOrdonnee?.querySelector(':scope > p') && (carteOrdonnee.querySelector(':scope > p').textContent = 'Suis la progression pédagogique du parcours choisi.');
    carteMelangee?.querySelector(':scope > p') && (carteMelangee.querySelector(':scope > p').textContent = 'Brasse les questions du périmètre choisi.');
    initialiserGroupesChoix();
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
const SEUIL_EVALUATION_MESURES = 90;
const NOMBRE_QUESTIONS_EVALUATION_MESURES = 30;
const REPERES_MISSION_MESURES = Object.freeze([...(MESURES_MISSION?.reperes || [])]);
const ETAPES_MISSION_MESURES = Object.freeze(Object.fromEntries(
    (MESURES_MISSION?.etapes || []).map(etape => [Number(etape.numero), Object.freeze({
        ...etape,
        numeroFormate: String(etape.numero).padStart(2, '0')
    })])
));
const DEVELOPPEMENTS_SIGLES_MESURES = Object.freeze({
    RRSE:'recueil de renseignements socio-éducatifs',
    MJIE:'mesure judiciaire d’investigation éducative',
    MEJP:'mesure éducative judiciaire provisoire',
    MEJ:'mesure éducative judiciaire',
    MEE:'mise à l’épreuve éducative',
    CJ:'contrôle judiciaire',
    ARSE:'assignation à résidence avec surveillance électronique',
    DP:'détention provisoire',
    JE:'juge des enfants',
    TPE:'tribunal pour enfants',
    JI:'juge d’instruction',
    JLD:'juge des libertés et de la détention',
    CAM:'cour d’assises des mineurs',
    JAP:'juge de l’application des peines',
    PJJ:'protection judiciaire de la jeunesse',
    ASE:'aide sociale à l’enfance',
    CEF:'centre éducatif fermé',
    DDSE:'détention à domicile sous surveillance électronique',
    TIG:'travail d’intérêt général',
    DUP:'dossier unique de personnalité',
    SPIP:'service pénitentiaire d’insertion et de probation'
});

function creerEtatJeuMesures() {
    return {
        mode:null, etape:null, titreSession:'', reperesSession:[], questions:[],
        tirageHasard:[], nombreTire:0, celebrationEtapeADiffuser:null,
        configurationDerniereSession:null
    };
}
let etatJeuMesures = creerEtatJeuMesures();

function selectionnerMesures(selecteur) { return document.querySelector(selecteur); }
function normaliserCleMesure(cle) { return String(cle || '').trim(); }
function obtenirReperesMesuresEtape(numero) {
    return REPERES_MISSION_MESURES.filter(element => Number(element.etape) === Number(numero)).sort((a,b) => Number(a.id) - Number(b.id));
}
function obtenirRepereMesure(cle) { return REPERES_MISSION_MESURES.find(element => normaliserCleMesure(element.cle) === normaliserCleMesure(cle)) || null; }
function melangerMesures(tableau) {
    const copie = [...tableau];
    for (let i = copie.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
}
function choisirMesuresSansDoublon(tableau, nombre) { return melangerMesures(tableau).slice(0, Math.min(Math.max(0, nombre), tableau.length)); }
function obtenirSauvegardeJeuMesures() {
    if (!sauvegarde.mesuresJeu) sauvegarde.mesuresJeu = creerProgressionMesuresInitiale();
    return sauvegarde.mesuresJeu;
}
function repereMesureEstIntroduit(cle) { return obtenirSauvegardeJeuMesures().decouverts[normaliserCleMesure(cle)] === true; }
function marquerRepereMesureIntroduit(cle) { obtenirSauvegardeJeuMesures().decouverts[normaliserCleMesure(cle)] = true; }
function obtenirEtatEtapeMesures(numero) {
    const jeu = obtenirSauvegardeJeuMesures();
    const cle = String(numero);
    if (!jeu.etapes[cle]) jeu.etapes[cle] = creerProgressionMesuresInitiale().etapes[cle];
    return jeu.etapes[cle];
}
function compterMaitrisesEtapeMesures(numero) {
    const etape = obtenirEtatEtapeMesures(numero);
    return obtenirReperesMesuresEtape(numero).filter(element => etape.autonomes[normaliserCleMesure(element.cle)] === true).length;
}
function compterValidationsSansJokerEtapeMesures(numero) {
    const etape = obtenirEtatEtapeMesures(numero);
    return obtenirReperesMesuresEtape(numero).filter(element => etape.validationsSansJoker[normaliserCleMesure(element.cle)] === true).length;
}
function etapeMesuresMaitrisee(numero) {
    const total = obtenirReperesMesuresEtape(numero).length;
    return total > 0 && compterMaitrisesEtapeMesures(numero) === total;
}
function numerosEtapesMissionMesures() { return Object.keys(ETAPES_MISSION_MESURES).map(Number).sort((a,b) => a-b); }
function evaluationMesuresDebloquee() { return numerosEtapesMissionMesures().every(etapeMesuresMaitrisee); }
function obtenirErreursMesuresActives() {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs || {};
    return Object.entries(erreurs).filter(([,erreur]) => erreur?.active === true).map(([cle]) => obtenirRepereMesure(cle)).filter(Boolean);
}
function enregistrerErreurMesures(cibles) {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserCleMesure(cible.cle);
        const actuelle = erreurs[cle] || { active:false, nombreErreurs:0, reussitesRevision:0 };
        erreurs[cle] = { active:true, nombreErreurs:Number(actuelle.nombreErreurs || 0) + 1, reussitesRevision:0 };
    });
}
function validerRevisionMesures(cibles) {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs;
    cibles.forEach(cible => {
        const actuelle = erreurs[normaliserCleMesure(cible.cle)];
        if (!actuelle?.active) return;
        actuelle.reussitesRevision = 1;
        actuelle.active = false;
    });
}

function obtenirIdentiteEtapeMissionMesures(numero) { return ETAPES_MISSION_MESURES[Number(numero)] || ETAPES_MISSION_MESURES[1]; }
function obtenirThemeVisuelMissionMesures(numero) {
    const themes = ['commun','procedure_ordinaire','information_judiciaire','jugement_educatif_ordinaire','matiere_criminelle_peines','application_execution_peines'];
    return themes[(Math.max(1, Number(numero) || 1) - 1) % themes.length];
}
function iconeEtapeMesures(numero) {
    const traces = [
        '<path d="M4 19h16M7 16V8h10v8M9 8V5h6v3"/>',
        '<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6zM8 12h8"/>',
        '<path d="M4 4h10l3 3v13H4zM14 4v3h3M7 11h6"/>',
        '<path d="M12 3v18M5 7h14M7 7l-3 6h6zM17 7l-3 6h6z"/>',
        '<path d="M5 5h14v14H5zM8 9h8M8 13h5"/>',
        '<path d="M4 6h16M6 6v13M18 6v13M8 11h8M8 15h8"/>',
        '<path d="M3 19h18M7 16h10M9 4h6v5c0 3-1 5-3 5s-3-2-3-5z"/>',
        '<path d="M4 18h5V8h6v10h5M3 20h18"/>',
        '<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6zM9 12l2 2 4-5"/>',
        '<path d="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5"/>',
        '<path d="M4 12h16M8 5v14M16 5v14M6 7h4M14 7h4"/>',
        '<path d="M4 8a8 8 0 1 1 0 8M4 4v4H1M9 12l2 2 4-5"/>'
    ];
    return `<svg viewBox="0 0 24 24" focusable="false">${traces[(Number(numero)-1) % traces.length]}</svg>`;
}

function texteAvecSiglesDeveloppesSiNecessaire(texte, siglesDejaVus) {
    let resultat = String(texte || '');
    Object.entries(DEVELOPPEMENTS_SIGLES_MESURES).forEach(([sigle, developpement]) => {
        if (siglesDejaVus.has(sigle) || !new RegExp(`\\b${sigle}\\b`).test(resultat)) return;
        if (resultat.toLocaleLowerCase('fr').includes(developpement.toLocaleLowerCase('fr'))) return;
        resultat = resultat.replace(new RegExp(`\\b${sigle}\\b`, 'g'), `${developpement} (${sigle})`);
    });
    return resultat;
}
function releverSiglesVus(texte, siglesDejaVus) {
    Object.keys(DEVELOPPEMENTS_SIGLES_MESURES).forEach(sigle => {
        if (new RegExp(`\\b${sigle}\\b`).test(String(texte || ''))) siglesDejaVus.add(sigle);
    });
}
function creerQuestionChoixMesure(cible, nature, siglesDejaVus) {
    const introduction = nature === 'Introduction';
    const consigneBrute = cible[`question${nature}`];
    const bonneBrute = cible[`bonneReponse${nature}`];
    const distracteursBruts = cible[`distracteurs${nature}`] || [];
    const consigne = texteAvecSiglesDeveloppesSiNecessaire(consigneBrute, siglesDejaVus);
    const bonne = texteAvecSiglesDeveloppesSiNecessaire(bonneBrute, siglesDejaVus);
    const distracteurs = distracteursBruts.map(texte => texteAvecSiglesDeveloppesSiNecessaire(texte, siglesDejaVus));
    [consigne, bonne, ...distracteurs].forEach(texte => releverSiglesVus(texte, siglesDejaVus));
    return {
        type:'choix', cibles:[cible], cible,
        estIntroduction:introduction, compteMaitrise:!introduction,
        consigne,
        options:melangerMesures([bonne, ...distracteurs]).map((texte,index) => ({ id:`mes-${cible.id}-${nature}-${index}`, texte, correcte:texte === bonne })),
        explication:cible[`explication${nature}`] || '',
        indice:cible[`indice${nature}`] || ''
    };
}
function creerQuestionEcriteSigleMesure(cible) {
    const developpement = String(cible.developpement || '').trim();
    return {
        type:'ecrit', cibles:[cible], cible, estIntroduction:false, compteMaitrise:true,
        consigne:`Écris en toutes lettres ce que signifie ${cible.sigle}.`,
        bonneReponse:developpement,
        reponsesAcceptees:[developpement, developpement.toLocaleLowerCase('fr')],
        explication:`${cible.sigle} signifie « ${developpement} ».`,
        indice:'Le sigle a déjà été développé dans une question précédente de Mission Mesures.'
    };
}
function premiereClePourSigle(sigle) {
    return REPERES_MISSION_MESURES.find(element => element.sigle === sigle)?.cle || null;
}
function creerQuestionsEtapeMesures(numero) {
    const pool = obtenirReperesMesuresEtape(numero);
    const questions = [];
    const siglesVus = new Set();
    pool.forEach(cible => {
        if (!repereMesureEstIntroduit(cible.cle)) questions.push(creerQuestionChoixMesure(cible, 'Introduction', siglesVus));
        questions.push(creerQuestionChoixMesure(cible, 'Rappel', siglesVus));
        if (cible.sigle && cible.developpement && premiereClePourSigle(cible.sigle) === cible.cle) questions.push(creerQuestionEcriteSigleMesure(cible));
    });
    return questions;
}
function creerQuestionsEntrainementMesures(cibles, melange = false) {
    const ordre = melange ? melangerMesures(cibles) : [...cibles];
    const siglesVus = new Set();
    return ordre.map(cible => repereMesureEstIntroduit(cible.cle)
        ? creerQuestionChoixMesure(cible, 'Rappel', siglesVus)
        : creerQuestionChoixMesure(cible, 'Introduction', siglesVus));
}
function creerQuestionsRevisionMesures(cibles) {
    const siglesVus = new Set(Object.keys(DEVELOPPEMENTS_SIGLES_MESURES));
    return cibles.map(cible => creerQuestionChoixMesure(cible, 'Rappel', siglesVus));
}
function creerQuestionsEvaluationMesures() {
    return choisirMesuresSansDoublon(MESURES_MISSION.evaluation || [], NOMBRE_QUESTIONS_EVALUATION_MESURES).map(question => ({
        type:'evaluation', cibles:[], cible:null, compteMaitrise:false, estIntroduction:false,
        etape:Number(question.etape), identifiantEvaluation:question.id,
        consigne:question.question,
        options:melangerMesures([question.bonneReponse, ...(question.distracteurs || [])]).map((texte,index) => ({ id:`eval-mes-${question.id}-${index}`, texte, correcte:texte === question.bonneReponse })),
        explication:question.explication,
        indice:'', source:question.source
    }));
}

function construireCartesEtapesMesures() {
    const zone = selectionnerMesures('#mesuresEtapes');
    if (!zone) return;
    zone.innerHTML = numerosEtapesMissionMesures().map(numero => {
        const identite = obtenirIdentiteEtapeMissionMesures(numero);
        const total = obtenirReperesMesuresEtape(numero).length;
        const maitrises = compterMaitrisesEtapeMesures(numero);
        const sansJoker = compterValidationsSansJokerEtapeMesures(numero);
        const pourcentage = total ? Math.round(maitrises / total * 100) : 0;
        const erreurs = obtenirErreursMesuresActives().filter(cible => Number(cible.etape) === numero).length;
        const etoile = total > 0 && sansJoker === total ? creerEtoileFilanteProgression() : '';
        const revision = `<button class="mesures-etape-revision" data-action="reviser-etape-mesures" data-etape="${numero}" type="button"${erreurs ? '' : ' disabled'}>${erreurs ? '↻ Rejouer uniquement mes erreurs' : 'Aucune erreur à rejouer'}${erreurs ? ` <strong>${erreurs}</strong>` : ''}</button>`;
        return `<article class="mesures-etape-carte" data-mesures-etape="${numero}" style="--mesures-etape-accent:${identite.couleur};--mesures-etape-accent-lisible:${identite.couleurTexte};--mesures-etape-rgb:${identite.couleurRgb}"><button class="mesures-etape-ouvrir" data-mesures-etape="${numero}" type="button"><span class="mesures-etape-carte-entete"><span class="mesures-etape-icone" aria-hidden="true">${iconeEtapeMesures(numero)}</span><span class="mesures-etape-numero">ÉTAPE ${identite.numeroFormate}</span>${etoile}</span><h3>${identite.titre}</h3><p>${identite.sousTitre}<br>${total} repère${total===1?'':'s'} · progression juridique.</p><span class="mesures-etape-progression"><i style="width:${pourcentage}%"></i></span><span class="mesures-etape-pied"><span>${maitrises}/${total} bonnes réponses · ${sansJoker}/${total} sans joker</span><span>${maitrises===total?'Maîtrisée ✓':'Ouvrir →'}</span></button>${revision}</article>`;
    }).join('');
    zone.querySelectorAll('.mesures-etape-ouvrir').forEach(bouton => bouton.addEventListener('click', () => lancerEtapeMesures(Number(bouton.dataset.mesuresEtape))));
}
function actualiserCarteEvaluationMesures() {
    const bouton = selectionnerMesures('#mesuresLancerEvaluation');
    const statut = selectionnerMesures('#mesuresEvaluationStatut');
    const debloquee = evaluationMesuresDebloquee();
    if (bouton) bouton.disabled = !debloquee;
    if (statut) statut.textContent = debloquee ? 'Toutes les étapes sont maîtrisées : évaluation disponible.' : 'Disponible après la maîtrise autonome de toutes les étapes.';
}
function actualiserAccueilMesures() {
    const jeu = obtenirSauvegardeJeuMesures();
    const introduits = Object.values(jeu.decouverts || {}).filter(Boolean).length;
    const maitrises = numerosEtapesMissionMesures().reduce((total, numero) => total + compterMaitrisesEtapeMesures(numero), 0);
    const etapesMaitrisees = numerosEtapesMissionMesures().filter(etapeMesuresMaitrisee).length;
    const erreurs = obtenirErreursMesuresActives().length;
    const pourcentage = REPERES_MISSION_MESURES.length ? Math.round(maitrises / REPERES_MISSION_MESURES.length * 100) : 0;
    selectionnerMesures('#mesuresResumeProgression') && (selectionnerMesures('#mesuresResumeProgression').textContent = `${maitrises} repère${maitrises===1?'':'s'} maîtrisé${maitrises===1?'':'s'} · ${etapesMaitrisees} étape${etapesMaitrisees===1?'':'s'} maîtrisée${etapesMaitrisees===1?'':'s'}`);
    selectionnerMesures('#mesuresNombreDecouverts') && (selectionnerMesures('#mesuresNombreDecouverts').textContent = introduits);
    selectionnerMesures('#mesuresNombreMaitrises') && (selectionnerMesures('#mesuresNombreMaitrises').textContent = maitrises);
    selectionnerMesures('#mesuresNombreErreurs') && (selectionnerMesures('#mesuresNombreErreurs').textContent = erreurs);
    selectionnerMesures('#mesuresMeilleurScore') && (selectionnerMesures('#mesuresMeilleurScore').textContent = `${jeu.evaluation?.meilleurScore || 0}%`);
    selectionnerMesures('#mesuresJaugeValeur') && (selectionnerMesures('#mesuresJaugeValeur').style.width = `${pourcentage}%`);
    selectionnerMesures('#mesuresProgressionGlobale')?.setAttribute('aria-valuenow', String(pourcentage));
    selectionnerMesures('#mesuresTexteRevision') && (selectionnerMesures('#mesuresTexteRevision').textContent = erreurs ? `${erreurs} repère${erreurs===1?'':'s'} à consolider.` : 'Aucun repère à revoir pour le moment.');
    construireCartesEtapesMesures();
    actualiserCarteEvaluationMesures();
}

function convertirQuestionMissionMesuresVersPJJoue(questionMesures, index, configuration) {
    const cible = questionMesures.cible || questionMesures.cibles?.[0] || null;
    const numeroEtape = Number(questionMesures.etape || cible?.etape || configuration.etape || 1);
    const identifiant = 920000 + (Number(cible?.id || numeroEtape * 100) * 20) + (index % 20);
    const source = questionMesures.source || cible?.source || '';
    const base = {
        id:identifiant,
        theme:obtenirThemeVisuelMissionMesures(numeroEtape),
        etape:numeroEtape,
        chapitre:1,
        ordreEtape:index + 1,
        enonce:questionMesures.consigne,
        explication:questionMesures.explication || '',
        indice:configuration.mode === 'evaluation' ? '' : (questionMesures.indice || ''),
        source,
        referencesSources:Array.isArray(source) ? source : (source ? [source] : []),
        bonneReponse:'', mauvaisesReponses:[], modePrefere:'choix-unique',
        estEvaluationFinale:configuration.mode === 'evaluation',
        missionMesures:true,
        missionMesuresMeta:{
            mode:configuration.mode,
            numeroEtape,
            cibles:(questionMesures.cibles || []).map(element => normaliserCleMesure(element.cle)),
            compteMaitrise:questionMesures.compteMaitrise === true,
            estIntroduction:questionMesures.estIntroduction === true
        }
    };
    if (questionMesures.type === 'ecrit') {
        return {
            ...base,
            bonneReponse:questionMesures.bonneReponse,
            modePrefere:'reponse-ecrite',
            libelleMode:'Réponse écrite',
            reponsesAcceptees:questionMesures.reponsesAcceptees || [questionMesures.bonneReponse],
            conceptsEvaluation:[[String(questionMesures.bonneReponse).toLocaleLowerCase('fr')]],
            nombreConceptsRequis:1
        };
    }
    const options = questionMesures.options || [];
    const correcte = options.find(option => option.correcte === true);
    return { ...base, bonneReponse:correcte?.texte || '', mauvaisesReponses:options.filter(option => option.correcte !== true).map(option => option.texte) };
}
function preparerSessionMissionMesuresNative({ mode, etape=null, reperes, questions, jokersActifs=true, titre, chronoActif=false, secondesQuestion=30, organisation='ordonne' }) {
    const configuration = { mode, etape, reperes:[...reperes], jokersActifs, titre, chronoActif, secondesQuestion, organisation };
    etatJeuMesures = { ...creerEtatJeuMesures(), mode, etape, titreSession:titre, reperesSession:[...reperes], questions:[...questions], configurationDerniereSession:configuration };
    etat.mode = `mesures-${mode}`;
    etat.theme = obtenirThemeVisuelMissionMesures(etape || reperes?.[0]?.etape || questions?.[0]?.etape || 1);
    etat.etape = Number(etape || reperes?.[0]?.etape || questions?.[0]?.etape || 1);
    etat.chapitre = 1;
    etat.origineSessionAnalytics = `mission_mesures_${mode}`;
    etat.organisationSession = organisation;
    etat.jokersSessionActifs = jokersActifs !== false;
    etat.chronometreSessionActif = chronoActif === true;
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number(secondesQuestion) || 30));
    etat.missionMesuresConfiguration = configuration;
    lancerSession(questions.map((question,index) => convertirQuestionMissionMesuresVersPJJoue(question,index,configuration)));
}
function estSessionMissionMesures() { return String(etat?.mode || '').startsWith('mesures-'); }
function obtenirModeMissionMesures() { return estSessionMissionMesures() ? String(etat.mode).replace(/^mesures-/, '') : null; }
function obtenirCiblesMissionMesuresQuestion(question) {
    return (question?.missionMesuresMeta?.cibles || []).map(cle => obtenirRepereMesure(cle)).filter(Boolean);
}
function enregistrerResultatMissionMesuresNatif(question, resultat) {
    if (!question?.missionMesures) return;
    const cibles = obtenirCiblesMissionMesuresQuestion(question);
    const meta = question.missionMesuresMeta || {};
    if (resultat.estCorrecte && meta.estIntroduction && cibles[0]) marquerRepereMesureIntroduit(cibles[0].cle);
    if (resultat.estCorrecte && meta.compteMaitrise) {
        cibles.forEach(cible => {
            const etape = obtenirEtatEtapeMesures(Number(cible.etape));
            const cle = normaliserCleMesure(cible.cle);
            if (!resultat.aideUtilisee) etape.validationsSansJoker[cle] = true;
            if (resultat.reussiteAutonome) etape.autonomes[cle] = true;
        });
        const numeros = [...new Set(cibles.map(cible => Number(cible.etape)))];
        numeros.forEach(numero => {
            const etape = obtenirEtatEtapeMesures(numero);
            if (etapeMesuresMaitrisee(numero) && !etape.celebrationAffichee) {
                etape.celebrationAffichee = true;
                etatJeuMesures.celebrationEtapeADiffuser = numero;
            }
        });
    }
    if (!resultat.estCorrecte || resultat.reussiteAidee) enregistrerErreurMesures(cibles);
    if (obtenirModeMissionMesures() === 'revision' && resultat.reussiteAutonome) validerRevisionMesures(cibles);
    enregistrerSauvegarde();
}
function enregistrerPassageMissionMesuresNatif(question) {
    if (!question?.missionMesures) return;
    enregistrerErreurMesures(obtenirCiblesMissionMesuresQuestion(question));
    enregistrerSauvegarde();
}
function reinitialiserMaitriseEtapeMissionMesures(numeroEtape) {
    const etape = obtenirEtatEtapeMesures(numeroEtape);
    etape.autonomes = {};
    etape.validationsSansJoker = {};
    etape.celebrationAffichee = false;
    enregistrerSauvegarde();
    if (etat.questionCourante?.missionMesures) actualiserSuiviEtapeQuestion(etat.questionCourante);
}

function lancerEtapeMesures(numero) {
    const reperes = obtenirReperesMesuresEtape(numero);
    const identite = obtenirIdentiteEtapeMissionMesures(numero);
    preparerSessionMissionMesuresNative({ mode:'parcours', etape:numero, reperes, questions:creerQuestionsEtapeMesures(numero), jokersActifs:true, titre:`Étape ${identite.numeroFormate} · ${identite.titre}` });
}
function lancerRevisionMesures() {
    const reperes = obtenirErreursMesuresActives();
    if (!reperes.length) {
        ouvrirFenetreMessage({ titre:'Aucune erreur à réviser', message:'Aucun repère de Mission Mesures n’est actuellement à revoir.', libelleConfirmer:'Très bien' });
        return;
    }
    preparerSessionMissionMesuresNative({ mode:'revision', reperes, questions:creerQuestionsRevisionMesures(reperes), jokersActifs:false, titre:'Réviser mes erreurs · Mission Mesures' });
}
function lancerRevisionEtapeMesuresDepuisRevision(numeroEtape) {
    const numero = Number(numeroEtape);
    const reperes = obtenirErreursMesuresActives().filter(cible => Number(cible.etape) === numero);
    if (!reperes.length) {
        afficherNotification(`Aucune erreur active à l’étape ${String(numero).padStart(2, '0')} de Mission Mesures.`);
        return;
    }
    const identite = obtenirIdentiteEtapeMissionMesures(numero);
    preparerSessionMissionMesuresNative({ mode:'revision', etape:numero, reperes, questions:creerQuestionsRevisionMesures(reperes), jokersActifs:false, titre:`Réviser mes erreurs · Étape ${identite.numeroFormate}` });
}
function lancerRevisionEtapeMesuresDepuisQuestion(numeroEtape) {
    lancerRevisionEtapeMesuresDepuisRevision(numeroEtape);
}
function lancerEvaluationMesures() {
    if (!evaluationMesuresDebloquee()) {
        ouvrirFenetreMessage({ titre:'Évaluation encore verrouillée', message:'Maîtrise d’abord toutes les étapes de Mission Mesures en autonomie.', libelleConfirmer:'Compris' });
        return;
    }
    preparerSessionMissionMesuresNative({ mode:'evaluation', reperes:[], questions:creerQuestionsEvaluationMesures(), jokersActifs:false, titre:'Évaluation finale · Mission Mesures' });
}
function lancerDeMesures() {
    const face=selectionnerMesures('#mesuresFaceDe'), resultat=selectionnerMesures('#mesuresDeResultat'), lancer=selectionnerMesures('#mesuresLancerDe'), jouer=selectionnerMesures('#mesuresJouerTirage');
    if(!face||!resultat||!lancer||!jouer)return;
    const valeur=1+Math.floor(Math.random()*6);
    lancer.disabled=true; jouer.classList.add('masque'); face.classList.remove('de-en-lancer'); void face.offsetWidth; face.classList.add('de-en-lancer');
    window.setTimeout(()=>{
        etatJeuMesures.nombreTire=valeur;
        etatJeuMesures.tirageHasard=choisirMesuresSansDoublon(REPERES_MISSION_MESURES,valeur);
        face.dataset.face=String(valeur); face.classList.remove('de-en-lancer');
        resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard dans Mission Mesures.`;
        jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`; jouer.classList.remove('masque');
        lancer.textContent='Relancer le dé'; lancer.disabled=false; jouer.focus({preventScroll:true});
    },420);
}
function jouerTirageDeMesures() {
    const reperes=[...etatJeuMesures.tirageHasard]; if(!reperes.length)return;
    preparerSessionMissionMesuresNative({ mode:'hasard', reperes, questions:creerQuestionsEntrainementMesures(reperes,true), jokersActifs:true, titre:`Défi du hasard · ${reperes.length} question${reperes.length===1?'':'s'}` });
}

function obtenirPoolEntrainementMissionMesures(perimetre) { return String(perimetre) === 'tous' ? [...REPERES_MISSION_MESURES] : obtenirReperesMesuresEtape(Number(perimetre)); }
function configurerEntrainementMissionMesuresNatif() {
    const ecran = selectionner('#entrainement'); if (!ecran) return;
    restaurerEntrainementPJJoueNatif();
    etat.contexteEntrainement='mesures'; ecran.dataset.contexteEntrainement='mesures';
    const entete=ecran.querySelector('.entrainement-entete');
    entete?.querySelector('.surtitre') && (entete.querySelector('.surtitre').textContent='Mission Mesures');
    entete?.querySelector('h1') && (entete.querySelector('h1').textContent='Choisis ta session');
    entete?.querySelector('p') && (entete.querySelector('p').textContent='Entraîne-toi sur les mesures et leurs modules avec les mêmes réglages que PJJoue.');
    selectionner('#resultatDeParcours') && (selectionner('#resultatDeParcours').textContent='Lance le dé pour tirer de 1 à 6 questions aléatoires dans Mission Mesures.');
    const selectPerimetre=selectionner('#perimetreEntrainement');
    const groupe=document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    if(selectPerimetre&&groupe){
        selectPerimetre.innerHTML='<option value="tous">Mission Mesures complète</option>'+numerosEtapesMissionMesures().map(numero=>`<option value="${numero}">${obtenirIdentiteEtapeMissionMesures(numero).titre}</option>`).join('');
        groupe.innerHTML='<button class="choix-bouton actif entrainement-perimetre-global" data-valeur="tous" type="button"><b>Tout Mission Mesure</b><span>Les 12 étapes</span></button>'+numerosEtapesMissionMesures().map(numero=>{const i=obtenirIdentiteEtapeMissionMesures(numero);return `<button class="choix-bouton" data-valeur="${numero}" type="button" style="--parcours-accent:${i.couleur};--parcours-accent-lisible:${i.couleurTexte};--parcours-accent-rgb:${i.couleurRgb}"><b>${i.numeroFormate} · ${i.titre}</b><span>${i.sousTitre}</span></button>`;}).join('');
        selectPerimetre.value='tous'; groupe.dataset.selectionEffectuee='true';
    }
    initialiserGroupesChoix();
    const carteOrdonnee=ecran.querySelector('[data-carte-entrainement="ordonne"]');
    const carteMelangee=ecran.querySelector('[data-carte-entrainement="melange"]');
    carteOrdonnee?.querySelector(':scope > p') && (carteOrdonnee.querySelector(':scope > p').textContent='Suis le temps juridique de Mission Mesures.');
    carteMelangee?.querySelector(':scope > p') && (carteMelangee.querySelector(':scope > p').textContent='Brasse les repères du périmètre choisi.');
    selectionner('#boutonLancerLeDe').onclick=lancerDeMesuresEntrainementNatif;
    selectionner('#boutonJouerLeTirage').onclick=jouerTirageDeMesuresEntrainementNatif;
    actualiserLimiteQuestionsEntrainement(); actualiserGroupesChoix();
}
function ouvrirEntrainementMissionMesuresNatif() { configurerEntrainementMissionMesuresNatif(); afficherEcran('entrainement'); }
function lancerDeMesuresEntrainementNatif() {
    const face=selectionner('#faceDeParcours'), resultat=selectionner('#resultatDeParcours'), lancer=selectionner('#boutonLancerLeDe'), jouer=selectionner('#boutonJouerLeTirage'); if(!face||!resultat||!lancer||!jouer)return;
    const valeur=1+Math.floor(Math.random()*6); lancer.disabled=true; jouer.classList.add('masque'); face.classList.remove('de-en-lancer'); void face.offsetWidth; face.classList.add('de-en-lancer');
    window.setTimeout(()=>{etatJeuMesures.tirageHasard=choisirMesuresSansDoublon(REPERES_MISSION_MESURES,valeur);face.dataset.face=String(valeur);face.classList.remove('de-en-lancer');resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} dans Mission Mesures.`;jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`;jouer.classList.remove('masque');lancer.textContent='Relancer le dé';lancer.disabled=false;},420);
}
function jouerTirageDeMesuresEntrainementNatif() { jouerTirageDeMesures(); }
function lancerEntrainementMissionMesuresNatif() {
    const perimetre=selectionner('#perimetreEntrainement')?.value||'tous';
    const pool=obtenirPoolEntrainementMissionMesures(perimetre);
    const nombre=Math.min(pool.length,Math.max(1,Number(selectionner('#nombreQuestionsEntrainement')?.value)||10));
    const organisation=etat.organisationSession||'ordonne';
    const reperes=organisation==='ordonne'?[...pool].sort((a,b)=>Number(a.etape)-Number(b.etape)||Number(a.id)-Number(b.id)).slice(0,nombre):choisirMesuresSansDoublon(pool,nombre);
    preparerSessionMissionMesuresNative({mode:'entrainement',reperes,questions:creerQuestionsEntrainementMesures(reperes,organisation==='melange'),jokersActifs:etat.jokersSessionActifs!==false,titre:`Entraînement Mesures · ${nombre} question${nombre===1?'':'s'}`,chronoActif:etat.chronometreSessionActif===true,secondesQuestion:etat.dureeChronometreSession||30,organisation});
}

function afficherRevisionMesures() {
    const zone=selectionner('#contenuErreursMesures'); if(!zone)return;
    const erreurs=obtenirErreursMesuresActives();
    if(!erreurs.length){zone.innerHTML='<div class="revision-vide"><strong>Aucune erreur active.</strong><p>Les repères manqués apparaîtront ici pour être retravaillés.</p></div>';return;}
    zone.innerHTML=`<div class="mesures-revision-liste">${erreurs.map(cible=>`<article class="mesures-revision-item"><span class="surtitre">Étape ${String(cible.etape).padStart(2,'0')}</span><strong>${cible.titre}</strong><p>${cible.sigle&&cible.developpement?`${cible.developpement} (${cible.sigle})`:cible.questionRappel}</p></article>`).join('')}</div><button class="principal" id="mesuresRevisionDemarrer" type="button">Commencer la révision →</button>`;
    selectionner('#mesuresRevisionDemarrer')?.addEventListener('click',lancerRevisionMesures);
}
function terminerSessionMissionMesuresNative() {
    clearInterval(etat.identifiantMinuteur);
    const total=etat.questionsSession.length, passees=etat.questionsPassees?.size||0, pourcentage=total?Math.round(etat.score/total*100):0;
    const mode=obtenirModeMissionMesures(), jeu=obtenirSauvegardeJeuMesures();
    let celebration=null, titre='Mission Mesures terminée', resultat=`${pourcentage} % · ${etat.score}/${total} réussites autonomes.`;
    if(mode==='parcours'){
        const numero=Number(etat.missionMesuresConfiguration?.etape||etat.etape||1), identite=obtenirIdentiteEtapeMissionMesures(numero); titre=`Étape ${identite.numeroFormate} · ${identite.titre}`;
        if(etatJeuMesures.celebrationEtapeADiffuser===numero) celebration={titre:`Étape ${identite.numeroFormate} maîtrisée !`,message:'Tous les repères de cette étape ont été réussis en autonomie.',confetti:true};
    }
    if(mode==='evaluation'){
        jeu.evaluation.meilleurScore=Math.max(Number(jeu.evaluation.meilleurScore||0),pourcentage); jeu.evaluation.nombreTentatives=Number(jeu.evaluation.nombreTentatives||0)+1;
        const reussie=pourcentage>=SEUIL_EVALUATION_MESURES&&passees===0; jeu.evaluation.reussie=Boolean(jeu.evaluation.reussie)||reussie; titre='Évaluation finale · Mission Mesures'; resultat=reussie?`Résultat : ${pourcentage} %. Mission Mesures est validée.`:`Résultat : ${pourcentage} %. Le seuil attendu est de ${SEUIL_EVALUATION_MESURES} %.`;
        if(reussie) celebration={titre:'Évaluation Mission Mesures réussie !',message:`Tu as obtenu ${pourcentage} %.`,confetti:true,finale:pourcentage===100};
    }
    if(mode==='revision'){
        titre='Réviser mes erreurs · Mission Mesures';
        resultat=obtenirErreursMesuresActives().length?`${obtenirErreursMesuresActives().length} repère(s) restent à consolider.`:'Aucun repère actif à revoir.';
        if(etatJeuMesures.celebrationEtapeADiffuser){
            const numero=Number(etatJeuMesures.celebrationEtapeADiffuser), identite=obtenirIdentiteEtapeMissionMesures(numero);
            celebration={titre:`Étape ${identite.numeroFormate} maîtrisée !`,message:'Les erreurs rejouées ont été réussies sans joker : la progression de l’étape est à jour.',confetti:true};
        }
    }
    if(mode==='hasard'){titre='Défi du hasard · Mission Mesures';resultat=pourcentage===100?'Tirage parfait !':`Résultat : ${pourcentage} %.`;}
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent=`${pourcentage}%`; selectionner('#bonnesReponsesBilan').textContent=`${etat.score}/${total}`; selectionner('#meilleureSerieBilan').textContent=etat.meilleureSerie; selectionner('#gainExperienceBilan').textContent='+0'; selectionner('#contexteBilan').textContent=`Mission Mesures · ${titre}`; selectionner('#titreBilan').textContent=titre; selectionner('#rangBilan').textContent=resultat;
    afficherErreursBilan(etat.questionsSession.filter(question=>etat.erreursSession.has(question.id)),passees);
    const continuer=selectionner('#boutonContinuer'); continuer.textContent='Retour à Mission Mesures →'; continuer.onclick=()=>{etat.missionMesuresConfiguration=null;afficherEcran('mesures',{remplacerHistorique:true});};
    const rejouer=selectionner('#boutonRejouerMesErreurs'); if(rejouer) rejouer.onclick=lancerRevisionMesures;
    selectionner('#prochaineDestinationBilan') && (selectionner('#prochaineDestinationBilan').textContent='Continue Mission Mesures ou retravaille les repères à consolider.');
    selectionner('#carteVoyageFinale')?.classList.add('masque'); effacerSessionEnCours(); afficherEcran('bilan',{remplacerHistorique:true}); actualiserAccueilMesures(); lancerCelebrationBilan(celebration);
}

function initialiserJeuMesures() {
    const racine=selectionnerMesures('#mesures'); if(!racine||racine.dataset.initialise==='true')return; racine.dataset.initialise='true';
    selectionnerMesures('#mesuresOuvrirParcours')?.addEventListener('click',()=>{actualiserAccueilMesures();selectionnerMesures('#mesuresAccueil')?.classList.add('masque');selectionnerMesures('#mesuresParcoursVue')?.classList.remove('masque');window.scrollTo?.({top:0,behavior:'smooth'});});
    selectionnerMesures('#mesuresRetourDepuisParcours')?.addEventListener('click',()=>{selectionnerMesures('#mesuresParcoursVue')?.classList.add('masque');selectionnerMesures('#mesuresAccueil')?.classList.remove('masque');actualiserAccueilMesures();});
    selectionnerMesures('#mesuresOuvrirEntrainement')?.addEventListener('click',ouvrirEntrainementMissionMesuresNatif);
    selectionnerMesures('#mesuresLancerDe')?.addEventListener('click',lancerDeMesures);
    selectionnerMesures('#mesuresJouerTirage')?.addEventListener('click',jouerTirageDeMesures);
    selectionnerMesures('#mesuresLancerRevision')?.addEventListener('click',()=>afficherEcran('mesures-revision'));
    selectionnerMesures('#mesuresLancerEvaluation')?.addEventListener('click',lancerEvaluationMesures);
    actualiserAccueilMesures(); afficherRevisionMesures();
}
initialiserJeuMesures();
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
    else if (action === 'reviser-etape-mesures')
        lancerRevisionEtapeMesuresDepuisRevision(cible.dataset.etape);
    else if (action === 'ouvrir-parcours-depuis-erreurs')
        ouvrirChoixParcours();
    else if (action === 'ouvrir-mission-sigles-depuis-erreurs')
        afficherEcran('sigles');
    else if (action === 'rejouer-erreurs-etape')
        rejouerErreursEtapeCourante();
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
