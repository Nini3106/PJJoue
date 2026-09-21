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
// Les identifiants historiques restent inchangés pour préserver les
// sauvegardes et les routes. Seul l'ordre visible évolue avec le rebranding.
const IDENTIFIANT_PARCOURS_RECOMMANDE = 'procedure_ordinaire';
const IDENTIFIANT_PARCOURS_OPTIONNEL = 'commun';
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
    // Tous les événements métier partagent le même contexte lisible. Les
    // paramètres fournis par l'action restent prioritaires : cela permet à
    // une navigation de décrire la page qui vient réellement d'être ouverte,
    // et non l'écran précédent encore actif au moment du clic.
    const contexte = typeof obtenirContexteAnalyticsGlobal === 'function'
        ? obtenirContexteAnalyticsGlobal()
        : {};
    return window.PJJ_ANALYTICS?.envoyer?.(nom, { ...contexte, ...parametres }) === true;
}

// Ces libellés sont exactement ceux du menu dépliant. Un écran interne
// (question, résultats ou révision ciblée) n'est pas une page publique : il
// est décrit séparément par pjjoue_ecran et rattaché à sa page d'origine.
const LIBELLES_PAGES_ANALYTICS = Object.freeze({
    accueil: 'Accueil',
    parcours: 'Parcours CJPM',
    entrainement: 'Entraînement libre',
    erreurs: 'Réviser',
    progression: 'Progression',
    carnet: 'Carnet de parcours',
    supports: 'Supports de révision',
    guides: 'Guides',
    sigles: 'Mission Sigles',
    mesures: 'Mission Mesures',
    parametres: 'Paramètres'
});
const LIBELLES_ECRANS_ANALYTICS = Object.freeze({
    question: 'Question',
    bilan: 'Résultats',
    'sigles-revision': 'Révision des erreurs · Mission Sigles',
    'mesures-revision': 'Révision des erreurs · Mission Mesures'
});
const LIBELLES_JOKERS_ANALYTICS = Object.freeze({
    '50_50': '50/50',
    indice: 'Indice',
    langue_au_chat: 'Langue au chat'
});
function obtenirLibellePageAnalytics(identifiant) {
    return LIBELLES_PAGES_ANALYTICS[identifiant] || null;
}
function obtenirLibelleEcranAnalytics(identifiant) {
    return LIBELLES_ECRANS_ANALYTICS[identifiant] || obtenirLibellePageAnalytics(identifiant) || null;
}
function obtenirPageMenuAnalytics(identifiant = etat?.ecran) {
    const pageDirecte = obtenirLibellePageAnalytics(identifiant);
    if (pageDirecte)
        return pageDirecte;
    if (identifiant === 'sigles-revision')
        return 'Mission Sigles';
    if (identifiant === 'mesures-revision')
        return 'Mission Mesures';

    const origine = String(etat?.origineSessionAnalytics || '');
    if (origine.startsWith('mission_sigles_') || String(etat?.mode || '').startsWith('sigles-'))
        return 'Mission Sigles';
    if (origine.startsWith('mission_mesures_') || String(etat?.mode || '').startsWith('mesures-'))
        return 'Mission Mesures';
    if (etat?.mode === 'parcours' || etat?.mode === 'evaluation-finale' || origine === 'evaluation_finale')
        return 'Parcours CJPM';
    if (etat?.mode === 'libre' || origine === 'entrainement_libre' || origine === 'defi_du_hasard')
        return 'Entraînement libre';
    if (etat?.mode === 'revision' || origine === 'revision_des_erreurs')
        return 'Réviser';
    return null;
}
function obtenirLibelleParcoursAnalytics(question = null) {
    const origine = String(etat?.origineSessionAnalytics || '');
    if (origine.startsWith('mission_sigles_') || question?.missionSigles || String(etat?.mode || '').startsWith('sigles-'))
        return 'Mission Sigles';
    if (origine.startsWith('mission_mesures_') || question?.missionMesures || String(etat?.mode || '').startsWith('mesures-'))
        return 'Mission Mesures';
    const identifiantTheme = question?.theme || etat?.theme || null;
    if (identifiantTheme && PROGRAMMES[identifiantTheme])
        return PROGRAMMES[identifiantTheme].titre;
    return etat?.perimetreEntrainement === 'tous' ? 'Parcours complet' : null;
}
function obtenirNomQuestionAnalytics(question) {
    const nom = question?.nom || question?.titre || question?.enonce || question?.question;
    if (!nom)
        return null;
    return String(nom).replace(/\s+/g, ' ').trim();
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
    const origine = String(etat?.origineSessionAnalytics || '');
    const mode = String(etat?.mode || '');
    if (origine === 'defi_du_hasard' || mode === 'sigles-hasard' || mode === 'mesures-hasard')
        return 'Défi du hasard';
    if (mode === 'parcours' || mode === 'sigles-parcours' || mode === 'mesures-parcours')
        return 'Parcours CJPM';
    if (mode === 'libre' || mode === 'sigles-entrainement' || mode === 'mesures-entrainement')
        return 'Entraînement libre';
    if (mode === 'revision' || mode === 'sigles-revision' || mode === 'mesures-revision')
        return 'Révision des erreurs';
    if (mode === 'evaluation-finale' || mode === 'sigles-evaluation' || mode === 'mesures-evaluation')
        return 'Évaluation finale';
    return null;
}
function obtenirInformationsEtapeAnalytics(question = null) {
    const evaluationFinale = question?.estEvaluationFinale === true
        || etat?.mode === 'evaluation-finale'
        || /^(sigles|mesures)-evaluation$/.test(String(etat?.mode || ''));
    if (evaluationFinale)
        return { numero: 12, nom: 'Évaluation finale' };

    if (question?.missionSigles || String(etat?.mode || '').startsWith('sigles-')) {
        const numero = Number(question?.missionSiglesMeta?.numeroEtape || question?.etape || etat?.etape);
        const numeroValide = Number.isFinite(numero) && numero > 0;
        const identite = numeroValide && typeof obtenirIdentiteEtapeMissionSigles === 'function'
            ? obtenirIdentiteEtapeMissionSigles(numero)
            : null;
        return {
            numero: numeroValide ? numero : null,
            nom: identite?.titre || (numeroValide ? `Étape ${numero}` : null)
        };
    }
    if (question?.missionMesures || String(etat?.mode || '').startsWith('mesures-')) {
        const numero = Number(question?.missionMesuresMeta?.numeroEtape || question?.etape || etat?.etape);
        const numeroValide = Number.isFinite(numero) && numero > 0;
        const identite = numeroValide && typeof obtenirIdentiteEtapeMissionMesures === 'function'
            ? obtenirIdentiteEtapeMissionMesures(numero)
            : null;
        return {
            numero: numeroValide ? numero : null,
            nom: identite?.titre || (numeroValide ? `Étape ${numero}` : null)
        };
    }

    const numeroVisible = Number(question?.etape ?? etat?.etape);
    if (!Number.isFinite(numeroVisible) || numeroVisible <= 0)
        return { numero: null, nom: null };
    const identifiantTheme = question?.theme || etat?.theme || IDENTIFIANT_PARCOURS_RECOMMANDE;
    const etapeProgramme = obtenirEtapeProgramme(identifiantTheme, numeroVisible)
        || obtenirEtapeProgramme(IDENTIFIANT_PARCOURS_RECOMMANDE, numeroVisible);
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
    const identifiant = Number(question?.identifiantHistorique ?? question?.id);
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
    const parcours = obtenirLibelleParcoursAnalytics();
    const contexte = {
        pjjoue_page_consultee: obtenirPageMenuAnalytics(),
        pjjoue_ecran: obtenirLibelleEcranAnalytics(etat?.ecran),
        pjjoue_mode_de_jeu: modeDeJeu,
        pjjoue_type_session: modeDeJeu,
        pjjoue_parcours: parcours,
        pjjoue_parcours_selectionne: parcours,
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
    if (etat.mode === 'parcours' || /^(sigles|mesures)-parcours$/.test(String(etat.mode || ''))) {
        contexte.pjjoue_defi_chrono = etat.chronometreSessionActif ? 'Chronométré' : 'Libre';
        contexte.pjjoue_temps_par_question_defi_chrono = etat.chronometreSessionActif
            ? Number(etat.dureeChronometreSession) || null
            : null;
    }
    if ((etat.mode === 'libre' || /^(sigles|mesures)-entrainement$/.test(String(etat.mode || '')))
        && etat.origineSessionAnalytics !== 'defi_du_hasard') {
        contexte.pjjoue_mode_entrainement = etat.organisationSession === 'ordonne'
            ? 'Par ordre d’étapes'
            : 'Mélangé';
        contexte.pjjoue_chrono = etat.chronometreSessionActif ? 'Avec' : 'Sans';
        contexte.pjjoue_temps_par_question = etat.chronometreSessionActif
            ? Number(etat.dureeChronometreSession) || null
            : null;
    }
    if (etat.origineSessionAnalytics === 'defi_du_hasard' || /^(sigles|mesures)-hasard$/.test(String(etat.mode || ''))) {
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
        pjjoue_nom_question: obtenirNomQuestionAnalytics(question),
        pjjoue_position_question_session: Number.isFinite(Number(etat?.indexQuestion))
            ? Number(etat.indexQuestion) + 1
            : null,
        pjjoue_type_question: modeQuestion ? obtenirLibelleMode(modeQuestion) : null
    };
}
function envoyerUtilisationJoker(type) {
    envoyerEvenementPJJ('joker_utilise', {
        ...obtenirContexteQuestionAnalytics(etat.questionCourante),
        pjjoue_joker_utilise: LIBELLES_JOKERS_ANALYTICS[type] || type,
        pjjoue_option_de_jeu: `Joker · ${LIBELLES_JOKERS_ANALYTICS[type] || type}`
    });
}
function envoyerOptionDeJeuAnalytics(option, parametres = {}) {
    const libelle = String(option || '').trim();
    if (!libelle)
        return false;
    return envoyerEvenementPJJ('option_de_jeu_selectionnee', {
        pjjoue_option_de_jeu: libelle,
        ...parametres
    });
}
function obtenirContexteAnalyticsGlobal() {
    return {
        pjjoue_page_consultee: obtenirPageMenuAnalytics(),
        pjjoue_ecran: obtenirLibelleEcranAnalytics(etat?.ecran)
    };
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
// Copie de sécurité conservée avant une éventuelle réécriture de la sauvegarde.
// Elle permet de récupérer une progression si un navigateur ou une migration
// rencontre une erreur au chargement.
const CLE_SAUVEGARDE_SECOURS = 'pjjoue_v1_sauvegarde_secours';
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
        organisation: 2,
        domaine: 'cjpm',
        evaluations: {cjpm:creerEtatEvaluationFinale(),pjj:creerEtatEvaluationFinale()},
        decouverts: {},
        etapes: Object.fromEntries([...new Set(SIGLES.map(x=>Number(x.etape)))].map(numero => [String(numero), {
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
        erreursSynchronisees: true,
        reprisesSansJokerValidees: true,
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
function normaliserMotifRevision(motif) {
    return ['reprise', 'joker', 'passage', 'incorrecte'].includes(motif) ? motif : null;
}
function obtenirLibelleConsolidation(suivi) {
    const libelles = {
        reprise: 'Question rejouée après erreur · à consolider',
        joker: 'Validée avec joker · à consolider',
        passage: 'Passée — non répondue',
        incorrecte: 'Incorrecte — erreur à réviser'
    };
    return libelles[suivi?.motifRevision] || 'Motif non enregistré · à consolider';
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
            motifRevision: normaliserMotifRevision(enregistrement.motifRevision),
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
                motifRevision: normaliserMotifRevision(valeur.motifRevision),
                nombreErreurs: convertirEntierBorne(valeur.nombreErreurs),
                reussitesRevision: convertirEntierBorne(valeur.reussitesRevision, 0, 2)
            };
        }
    }
    const migration=brute.organisation !== 2;
    const anciennesEtapes=estObjetSimple(brute.etapes)?Object.values(brute.etapes):[];
    // Reclasser les acquis par sigle, jamais par l'ancien numéro d'étape.
    const acquisHistoriques=Object.assign({},...anciennesEtapes.map(e=>filtrerSiglesActifs(e?.autonomes)));
    const sansJokerHistoriques=Object.assign({},...anciennesEtapes.map(e=>filtrerSiglesActifs(e?.validationsSansJoker)));
    const etapes = {};
    for (const numero of new Set(SIGLES.map(x=>Number(x.etape)))) {
        const cle = String(numero);
        const source = estObjetSimple(brute.etapes?.[cle]) ? brute.etapes[cle] : {};
        const autorises = new Set((SIGLES || []).filter(element => Number(element.etape) === numero).map(element => String(element.sigle).toUpperCase()));
        const filtrerEtape = valeur => estObjetSimple(valeur)
            ? Object.fromEntries(Object.entries(valeur).filter(([sigle, actif]) => autorises.has(String(sigle).toUpperCase()) && actif === true))
            : {};
        etapes[cle] = {
            autonomes: filtrerEtape(migration?acquisHistoriques:source.autonomes),
            validationsSansJoker: filtrerEtape(migration?sansJokerHistoriques:source.validationsSansJoker),
            celebrationAffichee: migration ? [...autorises].every(c=>sansJokerHistoriques[c]) : source.celebrationAffichee === true,
            nombreTentatives: migration ? 0 : convertirEntierBorne(source.nombreTentatives),
            meilleurScore: migration ? 0 : convertirEntierBorne(source.meilleurScore, 0, 100)
        };
    }
    const evaluation = estObjetSimple(brute.evaluation) ? brute.evaluation : {};
    const statistiques = estObjetSimple(brute.statistiques) ? brute.statistiques : {};
    const nettoyerEvaluation = source => ({
        meilleurScore:convertirEntierBorne(source?.meilleurScore,0,100),
        nombreTentatives:convertirEntierBorne(source?.nombreTentatives),
        reussie:source?.reussie===true
    });
    return {
        organisation:2,
        domaine:['cjpm','pjj','tous'].includes(brute.domaine)?brute.domaine:'cjpm',
        evaluations:{cjpm:nettoyerEvaluation(brute.evaluations?.cjpm),pjj:nettoyerEvaluation(brute.evaluations?.pjj)},
        historiqueEtapes:migration ? brute.etapes || {} : brute.historiqueEtapes || {},
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
                motifRevision: normaliserMotifRevision(valeur.motifRevision),
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
function archiverErreursDejaMaitrisees(sauvegardeNettoyee) {
    // Les anciennes sauvegardes ne datent pas les réussites et les erreurs.
    // Cette remise en cohérence unique privilégie les acquis autonomes conservés,
    // sans supprimer l’historique des erreurs ni modifier les validations.
    for (const [identifiant, erreur] of Object.entries(sauvegardeNettoyee.erreurs)) {
        const question = QUESTIONS.find(element => String(element.id) === identifiant);
        const bilan = sauvegardeNettoyee.progression.apprenant[question?.theme]?.[question?.etape];
        if (!erreur.maitrisee && bilan?.resultats?.[identifiant] === true) {
            erreur.maitrisee = true;
            erreur.reussites = Math.max(1, erreur.reussites);
        }
    }
    for (const jeu of [sauvegardeNettoyee.siglesJeu, sauvegardeNettoyee.mesuresJeu]) {
        const acquis = Object.assign({}, ...Object.values(jeu.etapes).map(etape => etape.autonomes));
        for (const [cle, erreur] of Object.entries(jeu.erreurs)) {
            if (erreur.active && acquis[cle] === true) {
                erreur.active = false;
                erreur.reussitesRevision = Math.max(1, erreur.reussitesRevision);
            }
        }
    }
}
function validerAnciennesReprisesSansJoker(sauvegardeNettoyee) {
    // L'ancien moteur conservait la validation sans joker mais écartait la
    // reprise du score autonome. On reconnaît cet acquis une seule fois,
    // en conservant la question parmi les notions à consolider.
    for (const etapes of Object.values(sauvegardeNettoyee.progression.apprenant)) {
        for (const bilan of Object.values(etapes)) {
            for (const [identifiant, validee] of Object.entries(bilan.validationsSansJoker || {})) {
                if (!validee || bilan.resultats[identifiant] === true) continue;
                const question = QUESTIONS.find(element => String(element.id) === identifiant);
                if (!question || question.estEvaluationFinale) continue;
                bilan.resultats[identifiant] = true;
                sauvegardeNettoyee.erreurs[identifiant] = Object.assign(sauvegardeNettoyee.erreurs[identifiant] || {
                    reussites: 0, maitrisee: false, motifRevision: null,
                    nombreErreurs: 0, nombrePassages: 0, theme: question.theme
                }, {
                    maitrisee: false, reussites: 1, motifRevision: 'reprise'
                });
            }
        }
    }
    for (const jeu of [sauvegardeNettoyee.siglesJeu, sauvegardeNettoyee.mesuresJeu]) {
        for (const etape of Object.values(jeu.etapes)) {
            for (const [cle, validee] of Object.entries(etape.validationsSansJoker || {})) {
                if (!validee || etape.autonomes[cle] === true) continue;
                etape.autonomes[cle] = true;
                jeu.erreurs[cle] = Object.assign(jeu.erreurs[cle] || {
                    active: false, motifRevision: null, nombreErreurs: 0, reussitesRevision: 0
                }, {
                    active: true, reussitesRevision: 1, motifRevision: 'reprise'
                });
            }
        }
    }
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
    const nettoyee = {
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
    // Ne jamais réappliquer cette correction aux nouvelles erreurs : un acquis
    // reste validé, mais un nouvel échec doit rester disponible pour être rejoué.
    if (sauvegardeBrute.erreursSynchronisees !== true)
        archiverErreursDejaMaitrisees(nettoyee);
    if (sauvegardeBrute.reprisesSansJokerValidees !== true)
        validerAnciennesReprisesSansJoker(nettoyee);
    return nettoyee;
}
function conserverSauvegardeBrute(contenu) {
    if (!contenu)
        return;
    try {
        // La première copie est conservée volontairement : une sauvegarde
        // antérieure reste ainsi disponible même après une mauvaise écriture.
        if (!localStorage.getItem(CLE_SAUVEGARDE_SECOURS))
            localStorage.setItem(CLE_SAUVEGARDE_SECOURS, contenu);
    }
    catch (erreur) {
        // Le stockage peut être indisponible en navigation privée.
    }
}
function chargerSauvegarde() {
    try {
        const contenu = localStorage.getItem(CLE_SAUVEGARDE);
        conserverSauvegardeBrute(contenu);
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
    chronometreToutesQuestions: false,
    chronometresQuestions: new Map(),
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
function effacerSauvegardeDeSecours() {
    try {
        localStorage.removeItem(CLE_SAUVEGARDE_SECOURS);
    }
    catch (erreur) {
        // L’indisponibilité du stockage sera signalée par l’enregistrement suivant.
    }
}
function enregistrerSauvegarde() {
    sauvegarde.version = 'V1';
    try {
        conserverSauvegardeBrute(localStorage.getItem(CLE_SAUVEGARDE));
        localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(sauvegarde));
        return true;
    }
    catch (erreur) {
        if (!stockageLocalAverti) {
            stockageLocalAverti = true;
            afficherNotification('Sauvegarde locale indisponible · pense à exporter ta progression avant de fermer Quiz CJPM.');
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
    etat.progressionAvantRevision = null;
    try { sessionStorage.removeItem(CLE_SESSION_EN_COURS); } catch (erreur) { /* Stockage par onglet indisponible. */ }
    try {
        localStorage.removeItem(CLE_SESSION_EN_COURS);
    }
    catch (erreur) {
        // Une session technique ne doit jamais bloquer le jeu si le stockage est indisponible.
    }
}
function creerInstantaneSessionEnCours() {
    if (etat.ecran !== 'question' || !etat.questionsSession?.length || !etat.questionCourante)
        return false;
    const saisieActive = selectionner('#reponseEcrite');
    if (saisieActive && etat.questionCourante?.id) {
        etat.brouillonsEcrits = etat.brouillonsEcrits || new Map();
        etat.brouillonsEcrits.set(etat.questionCourante.id, saisieActive.value || '');
    }
    return {
        version: 2,
        progressionAvantRevision: etat.progressionAvantRevision || null,
        enregistreLe: Date.now(),
        theme: etat.theme,
        etape: etat.etape,
        chapitre: etat.chapitre,
        mode: etat.mode,
        missionSiglesConfiguration: estSessionMissionSigles() ? etat.missionSiglesConfiguration : null,
        missionMesuresConfiguration: estSessionMissionMesures() ? etat.missionMesuresConfiguration : null,
        questionsMission: estSessionMissionSigles() || estSessionMissionMesures() ? etat.questionsSession : null,
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
        chronometreToutesQuestions: etat.chronometreToutesQuestions === true,
        chronometresQuestions: serialiserTableauAssociatif(etat.chronometresQuestions),
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
}
function ecrireInstantaneSessionEnCours(instantane) {
    try {
        const contenu = JSON.stringify(instantane);
        localStorage.setItem(CLE_SESSION_EN_COURS, contenu);
        // Chaque onglet retrouve sa propre session après une mise à jour.
        try { sessionStorage.setItem(CLE_SESSION_EN_COURS, contenu); } catch (erreur) { /* Repli sur la sauvegarde locale. */ }
        return true;
    }
    catch (erreur) {
        return false;
    }
}
function enregistrerSessionEnCours() {
    const instantane = creerInstantaneSessionEnCours();
    return instantane ? ecrireInstantaneSessionEnCours(instantane) : false;
}
function terminerSauvegardeSession() {
    // Le bilan de révision conserve le point de retour, y compris après une mise à jour.
    if (etat.progressionAvantRevision)
        return ecrireInstantaneSessionEnCours({ ...etat.progressionAvantRevision, retourDepuisBilanRevision: true });
    effacerSessionEnCours();
    return true;
}
function preparerMiseAJourAutomatique() {
    // Les actions ont déjà enregistré la progression. Ne pas réécrire ici
    // une ancienne copie en mémoire si un autre onglet a joué entre-temps.
    return etat.ecran !== 'question' || enregistrerSessionEnCours();
}
window.preparerMiseAJourPJJoue = preparerMiseAJourAutomatique;
function chargerSessionEnCours() {
    try {
        let contenuOnglet = null;
        try { contenuOnglet = sessionStorage.getItem(CLE_SESSION_EN_COURS); } catch (erreur) { /* Repli local. */ }
        const contenu = contenuOnglet || localStorage.getItem(CLE_SESSION_EN_COURS);
        if (!contenu)
            return null;
        const instantane = JSON.parse(contenu);
        if (!instantane || ![1, 2].includes(instantane.version) || !Array.isArray(instantane.questions))
            return null;
        return instantane;
    }
    catch (erreur) {
        return null;
    }
}
function restaurerSessionEnCours(instantane = chargerSessionEnCours()) {
    if (!instantane)
        return false;
    const mission = String(instantane.mode || '').match(/^(sigles|mesures)-(parcours|revision|evaluation|entrainement|hasard)$/);
    const questionsMission = mission && instantane.version === 2 && Array.isArray(instantane.questionsMission)
        ? instantane.questionsMission.filter(question => {
            const meta = mission[1] === 'sigles' ? question?.missionSiglesMeta : question?.missionMesuresMeta;
            return estObjetSimple(question) && Number.isSafeInteger(question.id)
                && typeof question.enonce === 'string' && typeof question.bonneReponse === 'string'
                && Array.isArray(meta?.cibles) && meta.mode === mission[2]
                && meta.cibles.every(cle => mission[1] === 'sigles' ? obtenirSigleJeu(cle) : obtenirRepereMesure(cle));
        }) : null;
    const questions = questionsMission || instantane.questions
        .map(identifiant => QUESTIONS.find(question => Number(question.id) === Number(identifiant)))
        .filter(Boolean)
        .map(question => ({ ...question, modePresentation: question.modePrefere || obtenirModeQuestion(question) }));
    if (!questions.length || questions.length > 1000 || questions.length !== instantane.questions.length
        || new Set(questions.map(question => question.id)).size !== questions.length) {
        effacerSessionEnCours();
        return false;
    }
    const positionQuestion = Math.min(questions.length - 1, Math.max(0, Number(instantane.indexQuestion) || 0));
    etat.theme = instantane.theme || questions[positionQuestion]?.theme || IDENTIFIANT_PARCOURS_RECOMMANDE;
    etat.etape = Number(instantane.etape) || Number(questions[positionQuestion]?.etape) || 1;
    etat.chapitre = Number(instantane.chapitre) || 1;
    etat.mode = instantane.mode || 'parcours';
    etat.missionSiglesConfiguration = instantane.missionSiglesConfiguration || null;
    etat.missionMesuresConfiguration = instantane.missionMesuresConfiguration || null;
    if (mission?.[1] === 'sigles') {
        const configuration = etat.missionSiglesConfiguration;
        if (!configuration || configuration.mode !== mission[2]) { effacerSessionEnCours(); return false; }
        choisirDomaineSigles(configuration.domaine || 'cjpm');
        etatJeuSigles = { ...creerEtatJeuSigles(), ...configuration,
            titreSession: configuration.titre, siglesSession: configuration.sigles || [],
            configurationDerniereSession: configuration };
    }
    if (mission?.[1] === 'mesures') {
        const configuration = etat.missionMesuresConfiguration;
        if (!configuration || configuration.mode !== mission[2]) { effacerSessionEnCours(); return false; }
        etatJeuMesures = { ...creerEtatJeuMesures(), ...configuration,
            titreSession: configuration.titre, reperesSession: configuration.reperes || [],
            configurationDerniereSession: configuration };
    }
    const progression = instantane.progressionAvantRevision;
    etat.progressionAvantRevision = progression
        && ['parcours', 'sigles-parcours', 'mesures-parcours'].includes(progression.mode)
        && Array.isArray(progression.questions)
        ? { ...progression, progressionAvantRevision: null } : null;
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
    etat.jokersSessionActifs = !estSessionEvaluation() && instantane.jokersSessionActifs !== false;
    etat.chronometreSessionActif = instantane.chronometreSessionActif === true;
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number(instantane.dureeChronometreSession) || 15));
    etat.tempsRestant = Math.max(0, Number(instantane.tempsRestant) || 0);
    etat.chronometreToutesQuestions = typeof instantane.chronometreToutesQuestions === 'boolean'
        ? instantane.chronometreToutesQuestions : etat.chronometreSessionActif;
    etat.chronometresQuestions = restaurerTableauAssociatif(instantane.chronometresQuestions);
    if (etat.chronometreSessionActif && !etat.chronometresQuestions.has(questions[positionQuestion].id)) {
        etat.chronometresQuestions.set(questions[positionQuestion].id, {
            actif: true, dureeAccordee: etat.dureeChronometreSession,
            tempsRestant: etat.tempsRestant, termine: instantane.questionValidee === true
        });
    }
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
    let reprisesCorrigees = false;
    for (const question of questions) {
        const reponse = etat.reponsesSession.get(question.id);
        const precisions = reponse?.precisions;
        const jokerUtilise = Object.values(etat.jokersQuestions.get(question.id) || {}).some(valeur => valeur === false);
        if (reponse?.statut !== 'aidee' || !(precisions?.tentatives > 0)
            || precisions.aideUtilisee !== false || jokerUtilise) continue;
        reponse.statut = 'correcte';
        precisions.aidee = false;
        precisions.aConsolider = true;
        etat.erreursSession.delete(question.id);
        etat.questionsPassees.delete(question.id);
        if (!question.estEvaluationFinale && !question.missionSigles && !question.missionMesures) {
            const bilan = obtenirBilanEtape(question.theme, question.etape);
            if (etat.mode === 'parcours' || bilan.questionsTraitees[question.id] === true) {
                bilan.questionsTraitees[question.id] = true;
                bilan.resultats[question.id] = true;
                bilan.validationsSansJoker[question.id] = true;
            }
            Object.assign(obtenirSuiviErreur(question), { maitrisee:false, reussites:1, motifRevision:'reprise' });
        }
        reprisesCorrigees = true;
    }
    // Les anciennes sessions pouvaient être enregistrées avant le calcul du
    // score. Les réponses conservées constituent la source de vérité.
    etat.score = questions.filter(question => etat.reponsesSession.get(question.id)?.statut === 'correcte').length;
    etat.nombreReponsesAidees = questions.filter(question => etat.reponsesSession.get(question.id)?.statut === 'aidee').length;
    if (reprisesCorrigees) {
        Object.values(PROGRAMMES).forEach(synchroniserEtapesReussiesEnAutonomie);
        enregistrerSauvegarde();
    }
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
    const aide = etat.questionValidee
        ? 'Les jokers ne sont plus disponibles après validation.'
        : disponibles > 0
            ? libelleDisponibilite
            : 'Tous les jokers ont été utilisés pour cette activité.';
    if (typeof definirAideSurvolBouton === 'function')
        definirAideSurvolBouton(declencheur, aide);
    else
        declencheur.title = aide;
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
    if (identifiant === 'carnet') identifiant = 'progression';
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
    parcours: 'Parcours CJPM',
    entrainement: 'Choisis ton mode d’entraînement',
    erreurs: 'Mes questions à consolider',
    sigles: 'Mission Sigles',
    'sigles-revision': 'Questions à consolider · Mission Sigles',
    mesures: 'Mission Mesures',
    'mesures-revision': 'Questions à consolider · Mission Mesures',
    supports: 'Supports de révision',
    progression: 'Progression',
    parametres: 'Paramètres',
    question: 'Question',
    bilan: 'Résultats'
};
function actualiserTitrePage(ecran) {
    // L’accueil conserve un titre descriptif après le rendu JavaScript et le retour au menu.
    document.title = ecran === 'accueil'
        ? 'Quiz CJPM — Justice pénale des mineurs'
        : `${TITRES_ECRANS[ecran] || 'Quiz CJPM'} — Quiz CJPM`;
}
function afficherEcran(identifiant, optionsAffichage = {}) {
    if (identifiant === 'carnet') identifiant = 'progression';
    masquerInfobullePJJoue();
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
            pjjoue_page_consultee: obtenirPageMenuAnalytics(identifiant),
            pjjoue_ecran: obtenirLibelleEcranAnalytics(identifiant),
            pjjoue_page_precedente: obtenirPageMenuAnalytics(courant),
            pjjoue_ecran_precedent: obtenirLibelleEcranAnalytics(courant)
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
            ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || IDENTIFIANT_PARCOURS_RECOMMANDE, { remplacerHistorique: true });
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
            ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || IDENTIFIANT_PARCOURS_RECOMMANDE, { remplacerHistorique: true });
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
    const parametres = new URLSearchParams(location.search);
    const routeRelayee = parametres.get('pjjoue_route');
    if (routeRelayee) {
        const route = lireRouteDepuisChemin(routeRelayee === 'accueil' ? '' : routeRelayee);
        const etape = Number(parametres.get('etape'));
        if (route.ecran === 'parcours' && PROGRAMMES[route.theme]?.etapes.some(e => e.id === etape))
            route.etapeGuide = etape;
        if (route.ecran === 'sigles' && ['cjpm', 'pjj'].includes(parametres.get('domaine')))
            route.domaine = parametres.get('domaine');
        return route;
    }

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
            ouvrirParcours(etatRoute.theme || IDENTIFIANT_PARCOURS_RECOMMANDE, { remplacerHistorique: true });
        }
    }
    else if (etatRoute.ecran === 'parcours') {
        if (etatRoute.theme && PROGRAMMES[etatRoute.theme]?.etapes.some(e => e.id === Number(etatRoute.etapeGuide)))
            lancerEtape(etatRoute.theme, Number(etatRoute.etapeGuide));
        else if (etatRoute.theme)
            ouvrirParcours(etatRoute.theme);
        else
            ouvrirChoixParcours({ depuisHistorique: true, forcerSortieQuestion: true });
    }
    else if (etatRoute.ecran === 'bilan') {
        const reprise = chargerSessionEnCours();
        if (!etat.questionsSession?.length && reprise?.retourDepuisBilanRevision && restaurerSessionEnCours(reprise)) {
            afficherEcran('question', { depuisHistorique: true, forcerSortieQuestion: true });
            afficherQuestion({ suivreAnalytics: false, reprendreChronometre: true });
        }
        else if (etat.questionsSession?.length)
            afficherEcran('bilan', { depuisHistorique: true, forcerSortieQuestion: true });
        else
            afficherEcran('accueil', { depuisHistorique: true, forcerSortieQuestion: true, remplacerHistorique: true });
    }
    else {
        if (etatRoute.ecran === 'sigles' && ['cjpm', 'pjj'].includes(etatRoute.domaine))
            choisirDomaineSigles(etatRoute.domaine);
        afficherEcran(etatRoute.ecran || 'accueil', { depuisHistorique: true, forcerSortieQuestion: true });
    }
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
/**
 * Retrouver l'étape PJJ concernée lorsqu'une révision a été lancée depuis
 * la carte d'une étape. Ce contexte permet d’enregistrer les questions
 * travaillées dans cette étape. Par ailleurs, une nouvelle réussite autonome
 * peut consolider une question déjà travaillée, dans tous les modes.
 */
function obtenirContexteRevisionEtape(question = etat.questionCourante) {
    if (etat.mode !== 'revision')
        return null;
    const correspondance = /^([^:]+):etape:(\d+)$/.exec(String(etat.perimetreRevision || ''));
    if (!correspondance)
        return null;
    const contexte = {
        theme: correspondance[1],
        etape: Number(correspondance[2])
    };
    if (!question
        || question.missionSigles
        || question.missionMesures
        || question.theme !== contexte.theme
        || Number(question.etape) !== contexte.etape)
        return null;
    return contexte;
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
/**
 * Questions déjà travaillées mais qui ne sont pas encore validées sans aide.
 *
 * Une étape peut afficher 10/10 questions réalisées tout en n'affichant que
 * 9/10 maîtrisées sans aide. Ces questions doivent rester rejouables, même si
 * une ancienne sauvegarde ne possède pas (ou plus) d'entrée correspondante
 * dans la liste globale des erreurs.
 */
function obtenirQuestionsNonMaitriseesEtape(identifiantTheme, etape) {
    const bilanEtape = obtenirBilanEtape(identifiantTheme, etape);
    return obtenirQuestionsEtape(identifiantTheme, etape).filter(question =>
        bilanEtape?.questionsTraitees?.[question.id] === true
        && bilanEtape?.resultats?.[question.id] !== true
    );
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
function compterQuestionsAConsolider() {
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
        ['erreursProgression', 'Question à consolider', 'Questions à consolider'],
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
        erreurs.textContent = String(compterQuestionsAConsolider());
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
    return { type: 'progression' };
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
    bouton.innerHTML = 'Voir ma progression <span aria-hidden="true">→</span>';
    bouton.onclick = () => afficherEcran('progression');
}
const IDENTITES_PARCOURS = Object.freeze({
    procedure_ordinaire: {
        numero: '01',
        titre: 'De l’enquête à la sanction',
        chapitre: 'Procédure ordinaire',
        description: 'Suis le dossier depuis l’enquête et l’orientation du parquet jusqu’à la culpabilité, la MEE éventuelle et la sanction.',
        niveau: 'Intermédiaire',
        duree: '≈ 1 h 40',
        couleur: '#d49a00',
        couleurTexte: '#ffd36a',
        couleurRgb: '212,154,0',
        recommande: true
    },
    information_judiciaire: {
        numero: '02',
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
        numero: '03',
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
        numero: '04',
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
        numero: '05',
        titre: 'Après la sanction : application et exécution',
        chapitre: 'Application des peines',
        description: 'Après la sanction, suis l’exécution, les aménagements, les incidents et l’articulation entre JE et JAP.',
        niveau: 'Avancé',
        duree: '≈ 1 h 40',
        couleur: '#0f766e',
        couleurTexte: '#70d6ca',
        couleurRgb: '15,118,110'
    },
    commun: {
        numero: '06',
        libelleNumero: 'Option : Parcours 06',
        titre: 'Découvrir la PJJ',
        chapitre: '',
        description: 'Missions, publics, professionnels, structures et logique éducative de la PJJ.',
        niveau: 'Débutant',
        duree: '≈ 1 h 20',
        couleur: '#4f8cff',
        couleurTexte: '#9fc2ff',
        couleurRgb: '79,140,255',
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
        bouton.className = `selecteur-parcours-bouton${theme.id === IDENTIFIANT_PARCOURS_RECOMMANDE ? ' parcours-recommande' : ''}${estDernierParcours ? ' parcours-cloture' : ''}`;
        bouton.dataset.theme = theme.id;
        bouton.style.setProperty('--parcours-accent', identite.couleur);
        bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
        bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        bouton.setAttribute('aria-label', `${identite.titre}. ${progression.maitrisees} étapes maîtrisées sans joker sur ${progression.total}.${progression.evaluationReussie ? ' Évaluation finale réussie.' : ''}`);
        bouton.innerHTML = `
            ${progression.jalonsMaitrises > 0 ? creerEtoileFilanteProgression(progression.jalonsMaitrises) : ''}
            <span class="selecteur-parcours-numero">${identite.libelleNumero || `Parcours ${identite.numero}`}</span>
            <span class="selecteur-parcours-icone">${creerIconeTheme(theme.id, '')}</span>
            <span class="selecteur-parcours-statut">${statut}</span>
            <span class="selecteur-parcours-texte">
                ${theme.id === IDENTIFIANT_PARCOURS_RECOMMANDE ? '<b>Recommandé pour commencer</b>' : (identite.chapitre ? `<b>${identite.chapitre}</b>` : '')}
                <strong>${identite.titre}</strong>
                <small>${identite.description}</small>
            </span>
            <span class="selecteur-parcours-informations"><span>${identite.niveau}</span><span>${identite.duree}</span></span>
            <span class="selecteur-parcours-progression" aria-hidden="true"><i style="width:${progression.pourcentage}%"></i></span>
            <span class="selecteur-parcours-pied"><span>${progression.maitrisees}/${progression.total} étapes</span><span>Explorer →</span></span>`;
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
    return COULEURS_THEMES_ETAPES[(Number(numeroEtape) - 1) % COULEURS_THEMES_ETAPES.length];
}
function obtenirCouleurIconeEtape(numeroEtape) {
    return COULEURS_THEMES_ETAPES[Number(numeroEtape) % COULEURS_THEMES_ETAPES.length];
}
function obtenirCouleursEtapePJJ(numeroEtape) {
    const couleur = PROGRAMMES.commun.etapes.find(etape => etape.id === Number(numeroEtape)).couleur;
    const couleurRgb = couleur.slice(1).match(/.{2}/g).map(valeur => parseInt(valeur, 16)).join(',');
    return { couleur, couleurTexte: couleur, couleurRgb };
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
            carte.style.setProperty('--couleur-etape', etapeProgramme.couleur);
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
function garantirOptionNombreQuestions(selectNombre, valeur) {
    if (!selectNombre)
        return;
    const valeurTexte = String(valeur);
    if ([...selectNombre.options].some(option => option.value === valeurTexte))
        return;
    selectNombre.querySelector('option[data-option-personnalisee="true"]')?.remove();
    const option = document.createElement('option');
    option.value = valeurTexte;
    option.textContent = valeurTexte;
    option.dataset.optionPersonnalisee = 'true';
    selectNombre.appendChild(option);
}
function obtenirMaximumNombreQuestions() {
    const curseur = selectionner('#curseurNombreQuestions');
    return Math.max(1, Number(curseur?.max) || 1);
}
function obtenirValeurBoutonNombreQuestions(bouton) {
    if (!bouton)
        return null;
    if (bouton.dataset.choixNombre === 'tous')
        return obtenirMaximumNombreQuestions();
    const valeur = Number(bouton.dataset.valeur);
    return Number.isFinite(valeur) ? valeur : null;
}
function actualiserEtatBoutonsNombreQuestions(valeur, modeSelection = null) {
    const groupe = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (!groupe)
        return;
    const mode = modeSelection || groupe.dataset.modeSelectionNombre || 'rapide';
    groupe.dataset.modeSelectionNombre = mode;
    groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
        let actif = false;
        if (!bouton.disabled) {
            if (mode === 'tous')
                actif = bouton.dataset.choixNombre === 'tous';
            else if (mode === 'rapide')
                actif = bouton.dataset.choixNombre !== 'tous' && Number(bouton.dataset.valeur) === Number(valeur);
        }
        bouton.classList.toggle('actif', actif);
        bouton.classList.toggle('selectionne', actif);
        bouton.setAttribute('aria-pressed', String(actif));
    });
}
function calculerReperesNombreQuestions(minimum, maximum) {
    const min = Math.max(1, Number(minimum) || 1);
    const max = Math.max(min, Number(maximum) || min);
    if (max === min)
        return [min];
    if (max <= 8)
        return Array.from({ length: max - min + 1 }, (_, index) => min + index);

    const amplitude = max - min;
    const granularite = max <= 20 ? 1 : max <= 100 ? 5 : 10;
    const arrondir = valeur => Math.max(min, Math.min(max, Math.round(valeur / granularite) * granularite));
    const valeurs = [
        min,
        arrondir(min + amplitude * .25),
        arrondir(min + amplitude * .5),
        arrondir(min + amplitude * .75),
        max
    ];
    return [...new Set(valeurs)].sort((a, b) => a - b);
}
function actualiserReperesNombreQuestions(minimum, maximum) {
    const zone = selectionner('#reperesNombreQuestions');
    if (!zone)
        return;
    const min = Math.max(1, Number(minimum) || 1);
    const max = Math.max(min, Number(maximum) || min);
    const amplitude = Math.max(1, max - min);
    const reperes = calculerReperesNombreQuestions(min, max);
    zone.innerHTML = reperes.map((valeur, index) => {
        const position = max === min ? 0 : ((valeur - min) / amplitude) * 100;
        const classe = index === 0 ? ' debut' : index === reperes.length - 1 ? ' fin' : '';
        return `<span class="entrainement-repere${classe}" style="--position-repere:${position}%"><i></i><b>${valeur}</b></span>`;
    }).join('');
}
function synchroniserCurseurNombreQuestions(nombreMax = null) {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const sortie = selectionner('#valeurNombreQuestions');
    const borneMin = selectionner('#borneMinQuestions');
    const borneMax = selectionner('#borneMaxQuestions');
    if (!selectNombre || !curseur)
        return;
    const minimum = Math.max(1, Number(curseur.min) || 1);
    const max = Math.max(minimum, Number(nombreMax) || Number(curseur.max) || minimum);
    curseur.min = String(minimum);
    curseur.max = String(max);
    const valeur = Math.min(max, Math.max(minimum, Number(selectNombre.value) || minimum));
    garantirOptionNombreQuestions(selectNombre, valeur);
    selectNombre.value = String(valeur);
    curseur.value = String(valeur);
    if (sortie)
        sortie.textContent = `${valeur} question${valeur === 1 ? '' : 's'}`;
    if (borneMin)
        borneMin.textContent = String(minimum);
    if (borneMax)
        borneMax.textContent = `${max} max`;
    actualiserReperesNombreQuestions(minimum, max);
}
function initialiserCurseurNombreQuestions() {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const groupe = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (!selectNombre || !curseur || curseur.dataset.initialise === 'true')
        return;
    curseur.dataset.initialise = 'true';
    if (groupe) {
        groupe.dataset.selectionEffectuee = 'true';
        groupe.dataset.modeSelectionNombre ||= 'rapide';
    }
    const appliquerValeurCurseur = () => {
        const minimum = Math.max(1, Number(curseur.min) || 1);
        const maximum = Math.max(minimum, Number(curseur.max) || minimum);
        const valeur = Math.min(maximum, Math.max(minimum, Number(curseur.value) || minimum));
        garantirOptionNombreQuestions(selectNombre, valeur);
        selectNombre.value = String(valeur);
        if (groupe) {
            groupe.dataset.selectionEffectuee = 'true';
            groupe.dataset.modeSelectionNombre = 'personnalise';
        }
        synchroniserCurseurNombreQuestions(maximum);
        actualiserEtatBoutonsNombreQuestions(valeur, 'personnalise');
    };
    curseur.addEventListener('input', appliquerValeurCurseur);
    curseur.addEventListener('change', appliquerValeurCurseur);
    synchroniserCurseurNombreQuestions();
    actualiserEtatBoutonsNombreQuestions(Number(selectNombre.value) || 10, groupe?.dataset.modeSelectionNombre || 'rapide');
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
    if (etat.contexteEntrainement === 'mesures') {
        groupe.querySelectorAll('.choix-bouton[data-valeur]').forEach(bouton => {
            const numero = Number(bouton.dataset.valeur);
            if (!Number.isFinite(numero) || !ETAPES_MISSION_MESURES[numero]) return;
            const identite = obtenirIdentiteEtapeMissionMesures(numero);
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

    let nombreMax = 0;
    const minimumCurseur = 1;
    const pasCurseur = 1;
    let texteDisponibilite = '';

    if (etat.contexteEntrainement === 'sigles') {
        const perimetre = selectPerimetre.value || 'tous';
        nombreMax = obtenirPoolEntrainementMissionSigles(perimetre).length;
        const libellePerimetre = ['cjpm','pjj','tous'].includes(perimetre) ? `le domaine ${libelleDomaineSigles(perimetre)}` : libelleEtapeSigles(Number(perimetre));
        texteDisponibilite = `${nombreMax} sigles disponibles dans ${libellePerimetre}.`;
    } else if (etat.contexteEntrainement === 'mesures') {
        const perimetre = selectPerimetre.value || 'tous';
        nombreMax = obtenirPoolEntrainementMissionMesures(perimetre).length;
        const libellePerimetre = perimetre === 'tous' ? 'Mission Mesures complète' : `l’étape ${Number(perimetre)}`;
        texteDisponibilite = `${nombreMax} repères disponibles dans ${libellePerimetre}.`;
    } else {
        const perimetre = selectPerimetre.value || 'tous';
        nombreMax = obtenirQuestionsEntrainement(perimetre).length;
        const libellePerimetre = perimetre === 'tous'
            ? 'le parcours complet'
            : `le parcours ${obtenirOrdreTheme(perimetre) + 1}`;
        texteDisponibilite = `${nombreMax} questions d’apprentissage disponibles dans ${libellePerimetre}.`;
    }

    if (!nombreMax)
        return;

    const curseur = selectionner('#curseurNombreQuestions');
    if (curseur) {
        curseur.min = String(minimumCurseur);
        curseur.max = String(nombreMax);
        curseur.step = String(pasCurseur);
    }

    const boutonTous = groupeNombre.querySelector('[data-choix-nombre="tous"]');
    if (boutonTous) {
        boutonTous.dataset.valeur = 'tous';
        boutonTous.dataset.nombreMax = String(nombreMax);
        boutonTous.textContent = 'Tous';
        boutonTous.hidden = false;
        boutonTous.disabled = false;
        boutonTous.removeAttribute('aria-disabled');
    }
    groupeNombre.querySelectorAll('.choix-bouton:not([data-choix-nombre="tous"])').forEach(bouton => {
        const disponible = Number(bouton.dataset.valeur) <= nombreMax;
        bouton.hidden = false;
        bouton.disabled = !disponible;
        bouton.setAttribute('aria-disabled', String(!disponible));
    });

    let modeSelection = groupeNombre.dataset.modeSelectionNombre || 'rapide';
    let nombreSelectionne = Number(selectNombre.value) || Math.min(10, nombreMax);
    if (modeSelection === 'tous')
        nombreSelectionne = nombreMax;
    else
        nombreSelectionne = Math.min(nombreMax, Math.max(minimumCurseur, nombreSelectionne));

    if (modeSelection === 'rapide') {
        const raccourciDisponible = [...groupeNombre.querySelectorAll('.choix-bouton:not([data-choix-nombre="tous"])')]
            .some(bouton => !bouton.disabled && Number(bouton.dataset.valeur) === nombreSelectionne);
        if (!raccourciDisponible)
            modeSelection = nombreSelectionne === nombreMax ? 'tous' : 'personnalise';
    }

    garantirOptionNombreQuestions(selectNombre, nombreSelectionne);
    selectNombre.value = String(nombreSelectionne);
    groupeNombre.dataset.modeSelectionNombre = modeSelection;

    const resume = selectionner('#limiteQuestionsEntrainement');
    if (resume)
        resume.textContent = texteDisponibilite;
    synchroniserCurseurNombreQuestions(nombreMax);
    actualiserEtatBoutonsNombreQuestions(nombreSelectionne, modeSelection);
}
function initialiserGroupesChoix() {
    selectionnerTous('[data-groupe-choix]').forEach(groupe => {
        const listeDeroulante = selectionner('#' + groupe.dataset.groupeChoix);
        if (!listeDeroulante)
            return;
        groupe.setAttribute('role', 'group');
        groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
            bouton.setAttribute('aria-pressed', 'false');
            bouton.onclick = () => {
                if (bouton.disabled)
                    return;
                groupe.dataset.selectionEffectuee = 'true';

                if (listeDeroulante.id === 'nombreQuestionsEntrainement') {
                    const valeur = obtenirValeurBoutonNombreQuestions(bouton);
                    if (!Number.isFinite(valeur))
                        return;
                    garantirOptionNombreQuestions(listeDeroulante, valeur);
                    listeDeroulante.value = String(valeur);
                    const mode = bouton.dataset.choixNombre === 'tous' ? 'tous' : 'rapide';
                    groupe.dataset.modeSelectionNombre = mode;
                    synchroniserCurseurNombreQuestions(obtenirMaximumNombreQuestions());
                    actualiserEtatBoutonsNombreQuestions(valeur, mode);
                    envoyerOptionDeJeuAnalytics(`Nombre de questions : ${bouton.textContent.trim() || valeur}`);
                    return;
                }

                listeDeroulante.value = bouton.dataset.valeur;
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
                const nomsOptions = {
                    perimetreEntrainement: 'Périmètre',
                    echelleTexte: 'Taille du texte',
                    sonActif: 'Sons'
                };
                const nomOption = nomsOptions[listeDeroulante.id];
                if (nomOption)
                    envoyerOptionDeJeuAnalytics(`${nomOption} : ${bouton.textContent.trim() || listeDeroulante.value}`);
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
        if (listeDeroulante.id === 'nombreQuestionsEntrainement') {
            actualiserEtatBoutonsNombreQuestions(
                Number(listeDeroulante.value) || 1,
                groupe.dataset.modeSelectionNombre || 'rapide'
            );
            return;
        }
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
function obtenirQuestionsRestantesEtape(reserve, identifiantTheme, etape) {
    const bilan = obtenirBilanEtape(identifiantTheme, etape);
    const questionsTraitees = bilan?.questionsTraitees || {};
    // La reprise normale regroupe les deux catégories qui nécessitent encore
    // un passage : questions jamais vues et questions déjà vues mais pas encore
    // maîtrisées sans joker. Une question validée sans aide reste exclue.
    return reserve.filter(question =>
        !questionsTraitees[question.id]
        || bilan?.resultats?.[question.id] !== true
    );
}
function lancerEtape(identifiantTheme, etape, chapitre = null, options = {}) {
    // Une étape demandée explicitement remplace toute ancienne session mémorisée.
    // Cela évite qu'une session précédente intercepte l'ouverture de la nouvelle étape.
    const depuisDebut = options?.depuisDebut === true;
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.questionsSession = [];
    etat.questionCourante = null;
    etat.questionValidee = false;
    effacerSessionEnCours();
    etat.theme = identifiantTheme;
    etat.etape = Number(etape);
    etat.etapeAvecJoker = false;
    etat.chapitre = depuisDebut
        ? 1
        : Number(chapitre) || determinerProchainChapitre(identifiantTheme, etape);
    etat.mode = 'parcours';
    etat.origineSessionAnalytics = 'parcours_pjj';
    etat.organisationSession = 'melange';
    etat.jokersSessionActifs = true;
    etat.chronometreSessionActif = false;
    etat.dureeChronometreSession = 15;
    const reserve = obtenirQuestionsSessionEtape(identifiantTheme, etape, etat.chapitre);
    const questionsRestantes = depuisDebut
        ? reserve
        : obtenirQuestionsRestantesEtape(reserve, identifiantTheme, etape);
    // Une étape déjà parcourue peut encore nécessiter une validation sans joker.
    // Dans ce cas, on conserve la réserve des questions jamais vues ou encore
    // non maîtrisées, au lieu de relancer toute l'étape.
    lancerSession(ordonnerQuestionsParcours(questionsRestantes.length ? questionsRestantes : reserve));
}
function lancerEtapeDepuisDebut(identifiantTheme, etape) {
    lancerEtape(identifiantTheme, etape, 1, { depuisDebut: true });
}
function obtenirQuestionsEvaluationFinale(identifiantTheme = etat.theme || IDENTIFIANT_PARCOURS_RECOMMANDE) {
    return QUESTIONS
        .filter(question => question.estEvaluationFinale === true && question.theme === identifiantTheme)
        .sort((questionA, questionB) =>
            obtenirOrdrePedagogiqueQuestion(questionA) - obtenirOrdrePedagogiqueQuestion(questionB)
            || questionA.id - questionB.id
        );
}
function lancerEvaluationFinale(identifiantTheme = etat.theme || sauvegarde.dernierTheme || IDENTIFIANT_PARCOURS_RECOMMANDE) {
    if (!PROGRAMMES[identifiantTheme])
        identifiantTheme = IDENTIFIANT_PARCOURS_RECOMMANDE;
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
    if (etat.contexteEntrainement === 'mesures') {
        lancerEntrainementMissionMesuresNatif();
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
    const nombre = Math.min(nombreMax, Math.max(1, Number(selectionner('#nombreQuestionsEntrainement')?.value) || 10));
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
        boutonLancer.classList.add('principal');
        boutonLancer.classList.remove('secondaire');
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
function lancerRevision(identifiantTheme = 'toutes', categorie = null, numeroEtape = 'toutes') {
    const actif = Object.entries(sauvegarde.erreurs || {}).filter(([, erreur]) => !erreur.maitrisee);
    if (!sauvegarde.aDejaJoue && actif.length === 0) {
        afficherNotification('Tu n’as pas encore joué. Commence une partie avant de pouvoir consolider tes réponses.');
        return;
    }
    if (actif.length === 0) {
        afficherNotification('Bravo : aucune question à consolider pour le moment.');
        return;
    }
    const identifiants = actif.map(([id]) => Number(id));
    let reserve = QUESTIONS.filter(question => identifiants.includes(question.id) && !question.estEvaluationFinale);
    if (identifiantTheme !== 'toutes')
        reserve = reserve.filter(question => question.theme === identifiantTheme);
    if (numeroEtape !== 'toutes')
        reserve = reserve.filter(question => Number(question.etape) === Number(numeroEtape));
    if (categorie !== null)
        reserve = reserve.filter(question => obtenirCategorieRevision(sauvegarde.erreurs[question.id]) === categorie);
    if (reserve.length === 0) {
        const theme = THEMES.find(themeCandidat => themeCandidat.id === identifiantTheme);
        afficherNotification(theme ? `Aucune question à consolider dans « ${theme.titre} ».` : 'Aucune question à consolider dans ce thème.');
        return;
    }
    etat.mode = 'revision';
    etat.origineSessionAnalytics = 'revision_des_erreurs';
    etat.theme = identifiantTheme === 'toutes' ? null : identifiantTheme;
    etat.perimetreRevision = identifiantTheme;
    etat.jokersSessionActifs = false;
    etat.chronometreSessionActif = false;
    lancerSession(melanger(reserve));
}
function lancerRevisionEtape(identifiantTheme, etape = null) {
    // Accepte aussi l’appel avec uniquement le numéro de l’étape.
    if (etape === null) {
        etape = identifiantTheme;
        identifiantTheme = etat.theme || sauvegarde.dernierTheme || IDENTIFIANT_PARCOURS_RECOMMANDE;
    }
    const etapeCible = Number(etape);
    const actif = Object.entries(sauvegarde.erreurs || {}).filter(([, erreur]) => !erreur.maitrisee);
    if (!sauvegarde.aDejaJoue && actif.length === 0) {
        afficherNotification('Tu n’as pas encore joué. Commence une partie avant de pouvoir consolider tes réponses.');
        return;
    }
    const identifiants = new Set(actif.map(([id]) => Number(id)));
    // Une question peut être traitée avec aide (ou passée) sans disposer
    // d'une entrée d'erreur dans une ancienne sauvegarde. Elle reste pourtant
    // à consolider dès lors qu'elle n'est pas validée sans aide.
    obtenirQuestionsNonMaitriseesEtape(identifiantTheme, etapeCible)
        .forEach(question => identifiants.add(Number(question.id)));
    const reserve = QUESTIONS.filter(question =>
        identifiants.has(question.id)
        && question.theme === identifiantTheme
        && Number(question.etape) === etapeCible
        && !question.estEvaluationFinale
    );
    if (!reserve.length) {
        afficherNotification(`Aucune question à consolider à l’étape ${etapeCible} de ce parcours.`);
        return;
    }
    etat.mode = 'revision';
    etat.origineSessionAnalytics = 'revision_des_erreurs';
    etat.theme = identifiantTheme;
    etat.perimetreRevision = `${identifiantTheme}:etape:${etapeCible}`;
    etat.jokersSessionActifs = false;
    etat.chronometreSessionActif = false;
    lancerSession(melanger(reserve));
}
// -----------------------------------------------------------------------------
// Validation des réponses et données communes aux activités
// -----------------------------------------------------------------------------
function estSessionEvaluation() {
    return ['evaluation-finale', 'sigles-evaluation', 'mesures-evaluation'].includes(etat.mode);
}
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
        .some(mot => MOTS_NEGATION_REPONSE.has(mot)
            // Tolérer « aucne » sans assimiler « une » ou « autre » à une négation.
            || (mot.startsWith('auc') && ['aucun', 'aucune'].some(
                negation => calculerDistanceTextes(mot, negation) <= 1)));
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
    if (/\d/.test(motSaisi + motAttendu))
        return false;
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
function extraireNombresReponse(texte) {
    // 7 500, 7 500 et 7500 représentent le même montant ; aucun chiffre
    // n'est toléré comme faute de frappe ou éliminé comme petit mot.
    const nombres = String(texte).replace(/(\d)[ \u00a0\u202f](?=\d{3}(?:\D|$))/g, '$1')
        .match(/\d+(?:[.,]\d+)?/g) || [];
    return nombres.map(nombre => Number(nombre.replace(',', '.')));
}
function respecteSensEtNombres(champ, variante, { concepts = false } = {}) {
    const attendus = extraireNombresReponse(variante);
    const saisis = extraireNombresReponse(champ);
    if (attendus.some(nombre => !saisis.includes(nombre))) return false;
    if (!concepts && saisis.some(nombre => !attendus.includes(nombre))) return false;
    // Une négation requise ne peut pas disparaître, ni une négation contraire
    // être ajoutée. Les synonymes positifs restent possibles via les variantes.
    if (!concepts && contientNegation(champ) !== contientNegation(variante)) return false;
    if (contientExpressionComplete(normaliserReponseEvaluation(variante), 'sans delai')
        && /\b(avec|dans)\b.*\bdelai\b/.test(normaliserReponseEvaluation(champ))) return false;
    return true;
}
function correspondAVarianteEvaluation(champ, variante, options = {}) {
    const reponseSaisie = normaliserReponseEvaluation(champ);
    const reponseAttendue = normaliserReponseEvaluation(variante);
    if (!reponseSaisie || !reponseAttendue || !respecteSensEtNombres(champ, variante, options))
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
        return respecteSensEtNombres(champ, variante)
            && (reponseNormalisee === reponseAttendue || contientExpressionComplete(reponseNormalisee, reponseAttendue));
    });
    if (!groupesConcepts.length)
        return correspondanceDeclaree;
    if (correspondanceDeclareeExacte)
        return true;
    const nombreCorrespondances = groupesConcepts.filter(groupe =>
        Array.isArray(groupe) && groupe.some(variante => correspondAVarianteEvaluation(champ, variante, { concepts: true }))
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
        return { libelle: 'Valider', action: 'valider-activite' };
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
        <div class="elimination-compteur">${elementsElimines.length}/${nombreAttendu} proposition${nombreAttendu > 1 ? 's' : ''} écartée${nombreAttendu > 1 ? 's' : ''}</div>
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
    reinitialiserChronometresSession();
    etat.progressionAvantRevision = null;
    etat.brouillonActivite = null;
    if (estSessionEvaluation()) etat.jokersSessionActifs = false;
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
    if (!question || !etat.questionValidee || estSessionEvaluation())
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
    if (!etat.questionCourante?.missionSigles && !etat.questionCourante?.missionMesures) {
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

const IDENTITE_PARCOURS_MINI_JEUX = Object.freeze({
    couleur: '#4f8cff',
    couleurTexte: '#9fc2ff',
    couleurRgb: '79,140,255'
});

function obtenirIdentiteParcoursQuestion(question) {
    if (question?.missionSigles) {
        return obtenirIdentiteEtapeMissionSigles(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
    }
    if (question?.missionMesures) {
        return IDENTITE_PARCOURS_MINI_JEUX;
    }
    return obtenirIdentiteParcours(question?.theme);
}

function appliquerIdentiteParcoursQuestion(question) {
    const identite = obtenirIdentiteParcoursQuestion(question);
    const ecranQuestion = selectionner('#question');
    ecranQuestion?.style.setProperty('--parcours-accent', identite.couleur);
    ecranQuestion?.style.setProperty(
        '--parcours-accent-lisible',
        identite.couleurTexte || identite.couleur
    );
    ecranQuestion?.style.setProperty('--parcours-accent-rgb', identite.couleurRgb || '79,140,255');
}

function afficherReperesQuestion(question) {
    if (question?.missionSigles) {
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        const valeurProgression = Math.round((etat.indexQuestion + 1) / etat.questionsSession.length * 100);
        selectionner('#compteurQuestion').textContent = `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
        selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
        selectionner('#progressionQuestion').parentElement?.setAttribute('aria-valuenow', String(valeurProgression));
        selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
        selectionner('#reperesQuestion').innerHTML = `<span class="repere repere-theme"><span class="icone-theme" aria-hidden="true">Aa</span><b>Mission Sigles · Étape ${identite.numero}</b></span>`;
        return;
    }
    if (question?.missionMesures) {
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionMesures(numeroEtape);
        const valeurProgression = Math.round((etat.indexQuestion + 1) / etat.questionsSession.length * 100);
        selectionner('#compteurQuestion').textContent = `${etat.indexQuestion + 1} / ${etat.questionsSession.length}`;
        selectionner('#progressionQuestion').style.width = `${valeurProgression}%`;
        selectionner('#progressionQuestion').parentElement?.setAttribute('aria-valuenow', String(valeurProgression));
        selectionner('#enonceQuestion').textContent = nettoyerEnonce(question);
        selectionner('#reperesQuestion').innerHTML = `<span class="repere repere-theme"><b>Mission Mesures · Étape ${String(numeroEtape).padStart(2,'0')}</b></span>`;
        return;
    }
    const theme = THEMES.find(themeCandidat => themeCandidat.id === question.theme);
    const identite = obtenirIdentiteParcours(question.theme);
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
        demarrerChronometreQuestion();
        annulerRappelJokers();
    }

    const enonce = selectionner('#enonceQuestion');
    enonce.setAttribute('tabindex', '-1');
    enonce.focus({ preventScroll: true });
}

function appliquerIdentiteVisuelleEtape(question) {
    let couleurEtape = '#2d7379';
    let couleurEtapeLisible = couleurEtape;
    let identifiantEtape = String(question?.etape || 'libre');

    if (question?.missionSigles) {
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        couleurEtape = identite.couleur;
        couleurEtapeLisible = identite.couleurTexte || identite.couleur;
        identifiantEtape = `sigles-${numeroEtape}`;
    }
    else if (question?.missionMesures) {
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionMesures(numeroEtape);
        couleurEtape = identite.couleur;
        couleurEtapeLisible = identite.couleurTexte || identite.couleur;
        identifiantEtape = `mesures-${numeroEtape}`;
    }
    else {
        const programme = PROGRAMMES[question?.theme];
        const etapeProgramme = programme?.etapes?.find(
            etape => Number(etape.id) === Number(question?.etape)
        );
        couleurEtape = etapeProgramme?.couleur || obtenirCouleurTitreEtape(question?.etape);
        couleurEtapeLisible = couleurEtape;
    }

    document.documentElement.style.setProperty('--couleur-etape-active', couleurEtape);
    document.documentElement.style.setProperty('--couleur-etape-active-lisible', couleurEtapeLisible);
    document.documentElement.style.setProperty('--couleur-fil-association', couleurEtape);
    document.body.dataset.etapeActive = identifiantEtape;
    appliquerIdentiteParcoursQuestion(question);
}
function obtenirErreursActivesEtapeQuestion(question) {
    if (!question)
        return [];
    const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.missionMesuresMeta?.numeroEtape || question.etape || 1);
    if (question.missionSigles)
        return obtenirCiblesARejouerEtapeSigles(numeroEtape);
    if (question.missionMesures)
        return obtenirCiblesARejouerEtapeMesures(numeroEtape);
    const erreursEnregistrees = Object.entries(sauvegarde.erreurs || {})
        .filter(([_identifiant, suivi]) => suivi?.maitrisee !== true)
        .map(([identifiant]) => QUESTIONS.find(element => String(element.id) === String(identifiant)))
        .filter(element => element && !element.estEvaluationFinale
            && element.theme === question.theme && Number(element.etape) === numeroEtape);
    const erreursDeProgression = obtenirQuestionsNonMaitriseesEtape(question.theme, numeroEtape);
    return [...new Map([...erreursEnregistrees, ...erreursDeProgression]
        .filter(Boolean)
        .map(element => [element.id, element])).values()];
}
function rejouerErreursEtapeCourante() {
    const question = etat.questionCourante;
    if (!question || !['parcours', 'sigles-parcours', 'mesures-parcours'].includes(etat.mode)
        || !obtenirErreursActivesEtapeQuestion(question).length)
        return;
    const progression = creerInstantaneSessionEnCours();
    if (!progression)
        return;
    // Une copie indépendante empêche les brouillons de révision de modifier le parcours suspendu.
    const retour = JSON.parse(JSON.stringify(progression));
    const questionsAvant = etat.questionsSession;
    const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.missionMesuresMeta?.numeroEtape || question.etape || 1);
    if (question.missionSigles)
        lancerRevisionEtapeSiglesDepuisQuestion(numeroEtape);
    else if (question.missionMesures)
        lancerRevisionEtapeMesuresDepuisQuestion(numeroEtape);
    else
        lancerRevisionEtape(question.theme, numeroEtape);
    if (etat.questionsSession !== questionsAvant) {
        etat.progressionAvantRevision = retour;
        actualiserBoutonReprendreEtapeDepuisDebut(etat.questionCourante);
        enregistrerSessionEnCours();
    }
}
function reprendreProgressionApresRevision() {
    const progression = etat.progressionAvantRevision;
    if (!progression)
        return false;
    clearInterval(etat.identifiantMinuteur);
    if (!restaurerSessionEnCours(progression))
        return false;
    afficherEcran('question', { remplacerHistorique: true, forcerSortieQuestion: true });
    afficherQuestion({ suivreAnalytics: false, reprendreChronometre: true });
    enregistrerSessionEnCours();
    return true;
}
function reprendreEtapeDepuisDebutQuestion() {
    if (etat.progressionAvantRevision) {
        reprendreProgressionApresRevision();
        return;
    }
    const question = etat.questionCourante;
    if (!question)
        return;
    const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.missionMesuresMeta?.numeroEtape || question.etape || 1);
    if (question.missionSigles) {
        lancerEtapeSigles(numeroEtape, { depuisDebut: true });
        return;
    }
    if (question.missionMesures) {
        lancerEtapeMesures(numeroEtape, { depuisDebut: true });
        return;
    }
    lancerEtapeDepuisDebut(question.theme, numeroEtape);
}
function actualiserBoutonReprendreEtapeDepuisDebut(question) {
    const bouton = selectionner('#boutonReprendreEtapeDepuisDebut');
    if (!bouton)
        return;
    const retourDisponible = Boolean(etat.progressionAvantRevision);
    bouton.textContent = retourDisponible ? 'Reprendre ma progression' : 'Reprendre depuis le début';
    const modeParcours = question?.missionSigles
        ? obtenirModeMissionSigles() === 'parcours'
        : question?.missionMesures
            ? obtenirModeMissionMesures() === 'parcours'
            : etat.mode === 'parcours';
    const visible = Boolean(question)
        && !question.estEvaluationFinale
        && (modeParcours || retourDisponible);
    bouton.classList.toggle('masque', !visible);
    bouton.disabled = !visible;
    bouton.setAttribute('aria-label', retourDisponible
        ? 'Reprendre ma progression à la question où je me suis arrêté'
        : visible
        ? `Reprendre l’étape ${Number(question.etape || 1)} depuis la première question`
        : 'Reprendre cette étape depuis la première question');
    definirAideSurvolBouton(bouton, retourDisponible
        ? 'Revenir à la question laissée dans le parcours, avec les réponses et le brouillon conservés.'
        : 'Recommencer l’étape à la première question : les questions déjà maîtrisées restent validées tant qu’elles ne sont pas réinitialisées.');
}
function actualiserBoutonRevisionEtapeQuestion(question) {
    const bouton = selectionner('#boutonRejouerErreursEtape');
    if (!bouton)
        return;
    const mode = question?.missionSigles
        ? obtenirModeMissionSigles()
        : question?.missionMesures
            ? obtenirModeMissionMesures()
            : etat.mode;
    const erreurs = obtenirErreursActivesEtapeQuestion(question);
    // Le bouton fait partie de l'interface de chaque étape : il reste donc
    // visible même avant la première erreur, mais il est désactivé tant
    // qu'aucune erreur active n'est disponible à rejouer.
    const visible = Boolean(question)
        && !question.estEvaluationFinale
        && mode === 'parcours';
    const disponible = visible && erreurs.length > 0;
    bouton.classList.toggle('masque', !visible);
    bouton.disabled = !disponible;
    bouton.textContent = 'Réviser cette étape';
    bouton.setAttribute('aria-label', `Réviser les questions à consolider de l’étape ${Number(question.etape || 1)}`);
    definirAideSurvolBouton(bouton, disponible
        ? `Rejouer les ${erreurs.length} questions à consolider : réponses rejouées, passées ou aidées et notions non maîtrisées. Les maîtrises sans joker sont conservées.`
        : 'Aucune question à consolider ou question non maîtrisée sans joker à rejouer dans cette étape');
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
    actualiserBoutonReprendreEtapeDepuisDebut(question);
    if (question.missionSigles) {
        identiteParcoursQuestion.classList.remove('masque');
        const numeroEtape = Number(question.missionSiglesMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionSigles(numeroEtape);
        const finaleMission = obtenirModeMissionSigles() === 'evaluation';
        numeroParcours.textContent = 'Mission Sigles';
        titreParcours.textContent = 'Mission Sigles';
        numero.textContent = finaleMission ? `Évaluation ${libelleDomaineSigles(etat.missionSiglesConfiguration?.domaine)}` : libelleEtapeSigles(numeroEtape);
        titre.textContent = finaleMission ? 'Expert des sigles' : identite.titre;
        const modeMission = obtenirModeMissionSigles();
        suivi.classList.toggle('masque', finaleMission || !['parcours', 'revision'].includes(modeMission));
        if (!finaleMission && ['parcours', 'revision'].includes(modeMission)) {
            compteur.textContent = `${compterMaitrisesEtapeSigles(numeroEtape)}/${obtenirSiglesEtape(numeroEtape).length}`;
            boutonReinitialiser.disabled = compterMaitrisesEtapeSigles(numeroEtape) === 0;
            boutonReinitialiser.setAttribute('aria-label', `Réinitialiser la maîtrise sans joker de l’étape ${numeroEtape} de Mission Sigles`);
        }
        actualiserBoutonRevisionEtapeQuestion(question);
        return;
    }
    if (question.missionMesures) {
        identiteParcoursQuestion.classList.remove('masque');
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const identite = obtenirIdentiteEtapeMissionMesures(numeroEtape);
        const finaleMission = obtenirModeMissionMesures() === 'evaluation';
        numeroParcours.textContent = 'Mission Mesures';
        titreParcours.textContent = 'Mission Mesures';
        numero.textContent = finaleMission ? 'Évaluation finale' : `Étape ${String(numeroEtape).padStart(2,'0')}`;
        titre.textContent = finaleMission ? 'Maîtriser les mesures' : identite.titre;
        const modeMission = obtenirModeMissionMesures();
        suivi.classList.toggle('masque', finaleMission || !['parcours', 'revision'].includes(modeMission));
        if (!finaleMission && ['parcours', 'revision'].includes(modeMission)) {
            const total = obtenirReperesMesuresEtape(numeroEtape).length;
            compteur.textContent = `${compterMaitrisesEtapeMesures(numeroEtape)}/${total}`;
            boutonReinitialiser.disabled = compterMaitrisesEtapeMesures(numeroEtape) === 0;
            boutonReinitialiser.setAttribute('aria-label', `Réinitialiser la maîtrise sans joker de l’étape ${numeroEtape} de Mission Mesures`);
        }
        actualiserBoutonRevisionEtapeQuestion(question);
        return;
    }
    identiteParcoursQuestion.classList.remove('masque');
    const finale = etat.mode === 'evaluation-finale' || Number(question.etape) === 12;
    const etapeProgramme = obtenirEtapeProgramme(question.theme, question.etape);
    const identite = obtenirIdentiteParcours(question.theme);
    numeroParcours.textContent = `Parcours ${identite.numero}`;
    titreParcours.textContent = identite.titre;
    numero.textContent = finale ? 'Étape 12' : `Étape ${question.etape}`;
    titre.textContent = finale ? 'Évaluation finale' : (etapeProgramme?.titre || 'Parcours CJPM');
    suivi.classList.toggle('masque', finale || !['parcours', 'revision'].includes(etat.mode));
    if (finale || !['parcours', 'revision'].includes(etat.mode)) {
        actualiserBoutonRevisionEtapeQuestion(question);
        return;
    }
    const questionsEtape = obtenirQuestionsEtape(question.theme, question.etape);
    const nombreAutonomes = compterReussitesAutonomesEtape(question.theme, question.etape);
    compteur.textContent = `${nombreAutonomes}/${questionsEtape.length}`;
    boutonReinitialiser.disabled = nombreAutonomes === 0;
    boutonReinitialiser.setAttribute(
        'aria-label',
        `Réinitialiser la maîtrise sans joker de l’étape ${question.etape}`
    );
    actualiserBoutonRevisionEtapeQuestion(question);
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
    if (question?.missionMesures) {
        const numeroEtape = Number(question.missionMesuresMeta?.numeroEtape || question.etape || 1);
        const nombreAutonomes = compterMaitrisesEtapeMesures(numeroEtape);
        if (!nombreAutonomes) return;
        ouvrirFenetreMessage({
            titre:'Réinitialiser la maîtrise sans aide ?',
            message:`Les ${nombreAutonomes} validations autonomes de cette étape Mission Mesures seront effacées.`,
            libelleConfirmer:'Réinitialiser', libelleAnnuler:'Annuler', afficherAnnuler:true, variante:'avertissement',
            apresConfirmation:()=>reinitialiserMaitriseEtapeMissionMesures(numeroEtape)
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
    const modeEvaluationFinale = estSessionEvaluation();
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
// Chaque question conserve son propre temps, même après un retour ou une reprise.
function reinitialiserChronometresSession() {
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.chronometresQuestions = new Map();
    etat.chronometreToutesQuestions = false;
    etat.chronometreSessionActif = false;
    etat.dureeChronometreSession = 15;
    etat.tempsRestant = 0;
}
function obtenirChronometreQuestion() {
    etat.chronometresQuestions = etat.chronometresQuestions || new Map();
    return etat.chronometresQuestions.get(etat.questionCourante?.id);
}
function actualiserCommandeChronometreQuestion() {
    const commande = selectionner('#boutonChronometreQuestion');
    const portee = selectionner('#boutonChronometreToutesQuestions');
    const arret = selectionner('#boutonArreterChronometre');
    const libelle = selectionner('#chronometreQuestion');
    if (!commande || !portee || !arret || !libelle) return;
    const chrono = obtenirChronometreQuestion();
    const actif = chrono?.actif === true;
    const plafond = actif && chrono.dureeAccordee >= 30;
    libelle.textContent = actif ? `${Math.max(0, etat.tempsRestant)} s` : 'Chrono';
    commande.classList.toggle('est-actif', actif);
    commande.classList.toggle('temps-court', actif && etat.tempsRestant <= 5 && !etat.questionValidee);
    commande.disabled = etat.questionValidee || plafond;
    commande.setAttribute('aria-label', actif
        ? (plafond ? 'Chronomètre : limite de 30 secondes atteinte' : 'Ajouter 5 secondes au chronomètre, jusqu’à 30 secondes')
        : 'Activer le chronomètre : 15 secondes');
    portee.setAttribute('aria-pressed', String(etat.chronometreToutesQuestions === true));
    portee.setAttribute('aria-label', etat.chronometreToutesQuestions
        ? 'Garder le chrono pour cette question seulement'
        : 'Activer le chrono pour toutes les questions de cette session');
    definirAideSurvolBouton(commande, actif
        ? (plafond ? 'Budget maximal : 30 secondes.' : 'Clique pour ajouter 5 secondes, jusqu’à 30 secondes au total.')
        : 'Clique pour activer 15 secondes sur cette question.');
    definirAideSurvolBouton(portee, etat.chronometreToutesQuestions
        ? 'Le chrono s’applique à toutes les questions de cette session. Clique pour le garder seulement sur cette question.'
        : 'Appliquer le chrono à toutes les questions de cette session.');
    portee.disabled = etat.questionValidee;
    arret.classList.toggle('masque', !actif);
    arret.disabled = etat.questionValidee;
}
function animerAjoutChronometre(secondes) {
    const ajout = selectionner('#ajoutChronometreQuestion');
    if (ajout) {
        ajout.classList.remove('est-visible');
        ajout.textContent = `+${secondes} s`;
        void ajout.offsetWidth;
        ajout.classList.add('est-visible');
    }
    annoncer(`${secondes} secondes ajoutées. ${etat.tempsRestant} secondes restantes.`);
}
function ajouterTempsChronometreQuestion() {
    if (etat.ecran !== 'question' || etat.questionValidee) return;
    let chrono = obtenirChronometreQuestion();
    const ajout = chrono?.actif ? Math.min(5, 30 - chrono.dureeAccordee) : 15;
    if (ajout <= 0) return;
    if (!chrono?.actif) {
        chrono = { actif: true, dureeAccordee: 15, tempsRestant: 15, termine: false };
        etat.chronometresQuestions.set(etat.questionCourante.id, chrono);
    }
    else {
        chrono.dureeAccordee += ajout;
        chrono.tempsRestant = Math.min(chrono.dureeAccordee, etat.tempsRestant + ajout);
    }
    etat.chronometreSessionActif = true;
    etat.delaiDepasse = false;
    etat.dureeChronometreSession = chrono.dureeAccordee;
    reprendreChronometreQuestion(chrono.tempsRestant);
    animerAjoutChronometre(ajout);
    enregistrerSessionEnCours();
}
function basculerChronometreToutesQuestions() {
    if (etat.ecran !== 'question' || etat.questionValidee) return;
    etat.chronometreToutesQuestions = !etat.chronometreToutesQuestions;
    if (etat.chronometreToutesQuestions && !obtenirChronometreQuestion()?.actif) {
        ajouterTempsChronometreQuestion();
    }
    if (etat.chronometreToutesQuestions) {
        etat.dureeChronometreSession = obtenirChronometreQuestion()?.dureeAccordee || 15;
    }
    actualiserCommandeChronometreQuestion();
    annoncer(etat.chronometreToutesQuestions
        ? `Chronomètre activé pour toutes les questions de cette session : ${etat.dureeChronometreSession} secondes par question.`
        : 'Chronomètre conservé pour cette question seulement.');
    enregistrerSessionEnCours();
}
function desactiverChronometreQuestion() {
    if (etat.ecran !== 'question' || etat.questionValidee) return;
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.chronometreToutesQuestions = false;
    etat.chronometreSessionActif = false;
    etat.tempsRestant = 0;
    etat.chronometresQuestions.set(etat.questionCourante.id, { actif: false, dureeAccordee: 0, tempsRestant: 0 });
    actualiserCommandeChronometreQuestion();
    annoncer('Chronomètre arrêté.');
    enregistrerSessionEnCours();
}
function terminerChronometreQuestion() {
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    const chrono = obtenirChronometreQuestion();
    if (chrono) {
        chrono.tempsRestant = etat.tempsRestant;
        chrono.termine = true;
    }
    actualiserCommandeChronometreQuestion();
}
function gererTempsEcoule() {
    if (etat.questionValidee) return;
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    etat.tempsRestant = 0;
    const chrono = obtenirChronometreQuestion();
    if (chrono) chrono.tempsRestant = 0;
    if (!etat.questionCourante) return;
    if (typeof jouerSonErreur === 'function') jouerSonErreur();
    etat.delaiDepasse = true;
    // La même correction complète s’applique aux sept modes de réponse.
    finaliserReponse(false, 'Temps écoulé');
}
function reprendreChronometreQuestion(secondesRestantes = etat.tempsRestant) {
    clearInterval(etat.identifiantMinuteur);
    etat.identifiantMinuteur = null;
    if (!etat.chronometreSessionActif || etat.questionValidee) {
        actualiserCommandeChronometreQuestion();
        return;
    }
    etat.tempsRestant = Math.min(30, Math.max(0, Number(secondesRestantes) || 0));
    let chrono = obtenirChronometreQuestion();
    if (!chrono) {
        chrono = { actif: true, dureeAccordee: etat.dureeChronometreSession, tempsRestant: etat.tempsRestant, termine: false };
        etat.chronometresQuestions.set(etat.questionCourante.id, chrono);
    }
    chrono.tempsRestant = etat.tempsRestant;
    actualiserCommandeChronometreQuestion();
    if (!etat.tempsRestant) { gererTempsEcoule(); return; }
    const echeance = Date.now() + etat.tempsRestant * 1000;
    etat.identifiantMinuteur = setInterval(() => {
        const restant = Math.max(0, Math.ceil((echeance - Date.now()) / 1000));
        if (restant === etat.tempsRestant) return;
        etat.tempsRestant = restant;
        chrono.tempsRestant = restant;
        actualiserCommandeChronometreQuestion();
        if (!restant) gererTempsEcoule();
        enregistrerSessionEnCours();
    }, 250);
}
function demarrerChronometreQuestion() {
    etat.delaiDepasse = false;
    let chrono = obtenirChronometreQuestion();
    // Rejouer une réponse corrigée ouvre une nouvelle tentative, avec le même budget.
    if (chrono?.termine && !etat.questionValidee) {
        chrono.termine = false;
        chrono.tempsRestant = chrono.dureeAccordee;
    }
    if (!chrono && etat.chronometreToutesQuestions) {
        const duree = Math.min(30, Math.max(5, Number(etat.dureeChronometreSession) || 15));
        chrono = { actif: true, dureeAccordee: duree, tempsRestant: duree, termine: false };
        etat.chronometresQuestions.set(etat.questionCourante.id, chrono);
    }
    etat.chronometreSessionActif = chrono?.actif === true;
    etat.tempsRestant = chrono?.tempsRestant || 0;
    if (etat.chronometreSessionActif && !etat.questionValidee) reprendreChronometreQuestion();
    else actualiserCommandeChronometreQuestion();
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
    terminerChronometreQuestion();
    sauvegarde.aDejaJoue = true;
    if (!question?.missionSigles && !question?.missionMesures) {
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
            aConsolider: reussiteAutonome && tentatives > 0,
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
    if (question?.missionMesures) {
        enregistrerResultatMissionMesuresNatif(question, resultat);
        enregistrerSessionEnCours();
        return;
    }
    const dejaTravaillee = sauvegarde.progression?.apprenant?.[question.theme]?.[question.etape]?.questionsTraitees?.[question.id] === true;
    const contexteEtape = etat.mode === 'parcours'
        ? { theme: question.theme, etape: question.etape }
        : (obtenirContexteRevisionEtape(question)
            || (reussiteAutonome && (dejaTravaillee || etat.mode === 'revision') && !question.estEvaluationFinale
                ? { theme: question.theme, etape: question.etape }
                : null));
    if (!contexteEtape) {
        enregistrerSessionEnCours();
        return;
    }
    const bilan = obtenirBilanEtape(contexteEtape.theme, contexteEtape.etape);
    bilan.questionsTraitees[question.id] = true;
    bilan.resultats[question.id] = bilan.resultats?.[question.id] === true || reussiteAutonome;
    bilan.validationsSansJoker = bilan.validationsSansJoker || {};
    // Pour la célébration d'étape, une réponse finalement correcte compte dès lors
    // qu'aucun joker n'a été utilisé sur cette tentative, même après avoir rejoué.
    bilan.validationsSansJoker[question.id] = bilan.validationsSansJoker[question.id] === true
        || (estCorrecte && !aideUtilisee);
    if (aideUtilisee)
        etat.etapeAvecJoker = true;
    synchroniserEtapesReussiesEnAutonomie(PROGRAMMES[contexteEtape.theme]);
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
function traiterReussiteAutonome(question) {
    etat.score++;
    etat.serie++;
    etat.meilleureSerie = Math.max(etat.meilleureSerie, etat.serie);
    sauvegarde.meilleureSerie = Math.max(sauvegarde.meilleureSerie || 0, etat.serie);
    etat.erreursSession.delete(question.id);
    jouerSonReussite();
    if (!question?.missionSigles && !question?.missionMesures && etat.mode !== 'evaluation-finale') {
        const apresReprise = (etat.tentativesQuestions?.get(question.id) || 0) > 0;
        if (!apresReprise && !sauvegarde.erreurs[question.id]) return;
        const suiviErreur = obtenirSuiviErreur(question);
        // Validation et révision sont indépendantes : la reprise réussie compte
        // au score, tout en gardant la notion disponible pour consolidation.
        suiviErreur.reussites = 1;
        suiviErreur.maitrisee = !apresReprise;
        suiviErreur.motifRevision = apresReprise ? 'reprise' : null;
    }
}
function traiterReussiteAidee(question) {
    etat.nombreReponsesAidees = (etat.nombreReponsesAidees || 0) + 1;
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    jouerSonReussite();
    if (question?.missionSigles || question?.missionMesures || etat.mode === 'evaluation-finale')
        return;
    const suiviErreur = obtenirSuiviErreur(question);
    suiviErreur.reussites = 0;
    suiviErreur.maitrisee = false;
    suiviErreur.motifRevision = 'joker';
}
function traiterReponseIncorrecte(question, etaitPassee) {
    etat.erreursSession.add(question.id);
    etat.serie = 0;
    jouerSonErreur();
    if (question?.missionSigles || question?.missionMesures || etat.mode === 'evaluation-finale')
        return;
    const suiviErreur = obtenirSuiviErreur(question);
    if (!etaitPassee)
        suiviErreur.nombreErreurs = (suiviErreur.nombreErreurs || 0) + 1;
    suiviErreur.reussites = 0;
    suiviErreur.maitrisee = false;
    suiviErreur.motifRevision = 'incorrecte';
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
    const { estCorrecte, reussiteAutonome, reussiteAidee, tentatives } = resultat;
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
                ? (tentatives > 0
                    ? 'Bonne réponse validée sans joker. Cette question reste à consolider, sans empêcher la validation de la session.'
                    : MESSAGES_REUSSITE[Math.floor(Math.random() * MESSAGES_REUSSITE.length)])
                : MESSAGES_ERREUR[Math.floor(Math.random() * MESSAGES_ERREUR.length)]));
    const repriseDisponible = (etat.tentativesQuestions?.get(question.id) || 0) < 1;
    const boutonRejouer = !estCorrecte
        && !reussiteAidee
        && !estSessionEvaluation()
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
    // Rejouer ne constitue pas une aide : seul l’usage d’un joker rend la réussite assistée.
    const reussiteAidee = estCorrecte && preparation.aideUtilisee;
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
        traiterReussiteAutonome(question);
    else if (resultat.reussiteAidee)
        traiterReussiteAidee(question);
    else
        traiterReponseIncorrecte(question, resultat.etaitPassee);
    actualiserSuiviEtapeQuestion(question);
    actualiserIndicateurSerie();
    afficherCorrectionReponse(question, resultat, texteChoisi, precisions);
    enregistrerSauvegarde();
    enregistrerSessionEnCours();
    return true;
}
function choisirReponse(bouton, proposition) {
    finaliserReponse(Boolean(proposition.estCorrecte), proposition.texte, { bouton });
}
function obtenirLibelleNombreJokers(nombre) {
    return nombre === 1 ? 'un joker' : nombre === 2 ? 'deux jokers' : nombre === 3 ? 'trois jokers' : `${nombre} jokers`;
}
function demanderPassageQuestion() {
    if (etat.questionValidee || estSessionEvaluation())
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
    if (estSessionEvaluation()) return;
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
    else if (question?.missionMesures) {
        enregistrerPassageMissionMesuresNatif(question);
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
    if (!question?.missionSigles && !question?.missionMesures) {
        sauvegarde.erreurs[question.id] = sauvegarde.erreurs[question.id] || { reussites: 0, maitrisee: false, nombreErreurs: 0, theme: question.theme };
        if (!precedente) {
            sauvegarde.erreurs[question.id].nombrePassages = (sauvegarde.erreurs[question.id].nombrePassages || 0) + 1;
        }
        sauvegarde.erreurs[question.id].reussites = 0;
        sauvegarde.erreurs[question.id].maitrisee = false;
        sauvegarde.erreurs[question.id].motifRevision = 'passage';
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
            message: `Ta progression avance. Tu pourras rejouer cette étape sans aide pour consolider sa maîtrise.`,
            confetti: false
        };
    }
    const titreSymbolique = obtenirTitreSymboliqueParcours(compterEtapesMaitrisees());
    if (evaluationDeverrouillee) {
        return {
            titre: 'Destination finale atteinte !',
            message: `Les onze étapes de ce parcours sont validées en autonomie. Tu as obtenu le titre « ${titreSymbolique} » et l’évaluation finale est maintenant ouverte.`,
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
        return 'Consolidation';
    return 'Entraînement libre';
}
function obtenirQuestionsAConsoliderSession() {
    return etat.questionsSession.filter(question => {
        const reponse = etat.reponsesSession.get(question.id);
        return etat.erreursSession.has(question.id)
            || etat.questionsPassees.has(question.id)
            || reponse?.precisions?.aConsolider === true;
    });
}
function obtenirStatutErreurBilan(reponse, estQuestionPassee) {
    if (reponse?.statut === 'correcte' && reponse.precisions?.aConsolider)
        return obtenirLibelleConsolidation({ motifRevision: 'reprise' });
    if (estQuestionPassee || reponse?.statut === 'passee')
        return obtenirLibelleConsolidation({ motifRevision: 'passage' });
    if (reponse?.statut === 'aidee') {
        if (reponse.precisions?.aideUtilisee)
            return obtenirLibelleConsolidation({ motifRevision: 'joker' });
        return 'Validée avec aide · à consolider';
    }
    if (reponse?.statut === 'incorrecte')
        return obtenirLibelleConsolidation({ motifRevision: 'incorrecte' });
    return obtenirLibelleConsolidation();
}
function revenirAuParcoursDuBilan() {
    if (estSessionMissionSigles()) return afficherEcran('sigles', { remplacerHistorique: true });
    if (estSessionMissionMesures()) return afficherEcran('mesures', { remplacerHistorique: true });
    ouvrirParcours(etat.theme || sauvegarde.dernierTheme || obtenirProchainThemeIncomplet() || IDENTIFIANT_PARCOURS_RECOMMANDE, { remplacerHistorique: true });
}
function collecterCelebrationMission(jeu) {
    const sigles = jeu === 'sigles';
    const cibles = etat.questionsSession.flatMap(question => sigles
        ? obtenirCiblesMissionQuestion(question) : obtenirCiblesMissionMesuresQuestion(question));
    const numeros = [...new Set(cibles.map(cible => Number(cible.etape)))];
    const validees = numeros.filter(numero => {
        const maitrisee = sigles ? compterMaitrisesEtapeSigles(numero) === obtenirSiglesEtape(numero).length
            : etapeMesuresMaitrisee(numero);
        const etape = sigles ? obtenirEtatEtapeSigles(numero) : obtenirEtatEtapeMesures(numero);
        if (!maitrisee || etape.celebrationAffichee) return false;
        etape.celebrationAffichee = true;
        return true;
    });
    if (!validees.length) return null;
    return {
        titre: validees.length === 1 ? `${sigles ? libelleEtapeSigles(validees[0]) : `Étape ${validees[0]}`} maîtrisée !` : `${validees.length} étapes maîtrisées !`,
        message: `Mission ${sigles ? 'Sigles' : 'Mesures'} : toutes les notions de ${validees.length === 1 ? 'cette étape ont' : 'ces étapes ont'} été réussies sans joker.`,
        confetti: true
    };
}
function afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees) {
    const zone = selectionner('#listeErreursBilan');
    const nombre = selectionner('#nombreErreursBilan');
    const boutonContinuer = selectionner('#boutonContinuer');
    const boutonRejouer = selectionner('#boutonRejouerMesErreurs');
    const boutonReprendre = selectionner('#boutonReprendreProgressionBilan');
    const progression = etat.progressionAvantRevision;
    const reponsesAvantRevision = restaurerTableauAssociatif(progression?.reponsesSession);
    const resteUneProgression = Boolean(progression?.questions?.some(identifiant => !reponsesAvantRevision.has(identifiant)));
    if (boutonReprendre) {
        boutonReprendre.classList.toggle('masque', !resteUneProgression);
        boutonReprendre.disabled = !resteUneProgression;
    }
    const jeu = estSessionMissionSigles() ? 'sigles' : estSessionMissionMesures() ? 'mesures' : 'parcours';
    if (boutonRejouer) {
        boutonRejouer.textContent = 'Refaire les questions à consolider';
        boutonRejouer.onclick = rejouerQuestionsAConsoliderBilan;
        boutonRejouer.classList.toggle('masque', !questionsAReprendre.length);
    }
    const retour = selectionner('#boutonRevenirAuParcours');
    retour?.classList.toggle('masque', jeu !== 'parcours');
    if (retour) retour.onclick = revenirAuParcoursDuBilan;
    const aDesQuestionsAReprendre = questionsAReprendre.length > 0;
    boutonContinuer?.classList.toggle('principal', !aDesQuestionsAReprendre);
    boutonContinuer?.classList.toggle('secondaire', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('principal', aDesQuestionsAReprendre);
    boutonRejouer?.classList.toggle('secondaire', !aDesQuestionsAReprendre);
    if (nombre)
        nombre.textContent = `${questionsAReprendre.length} question${questionsAReprendre.length === 1 ? '' : 's'} à consolider`;
    if (!zone)
        return;
    const regleLecture = `<div class="bilan-correction-regle">
    <strong>À savoir</strong>
    <span>Les questions passées sont listées sans dévoiler leur réponse. Les réponses validées après reprise restent à consolider, sans empêcher la validation de la session.</span>
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
            + '<div><h3>Aucune question à consolider</h3>'
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
        const classeConsolidation = reponse?.statut === 'correcte'
            ? 'bilan-consolidation-validee'
            : (estPassee || reponse?.statut === 'aidee' ? 'bilan-erreur-passee' : '');
        return `<article class="bilan-erreur-element ${classeConsolidation}">
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
    const contexteEtape = etat.mode === 'parcours'
        ? { theme: etat.theme, etape: etat.etape }
        : obtenirContexteRevisionEtape(etat.questionCourante);
    if (contexteEtape) {
        const etapeTerminee = (etat.mode === 'revision'
            || !etapeNecessiteAutreChapitre(contexteEtape.theme, contexteEtape.etape))
            && nombreQuestionsPassees === 0;
        // Lire le bilan après le contrôle des chapitres, qui normalise les
        // objets de progression, pour conserver le score et la célébration.
        const bilanEtape = obtenirBilanEtape(contexteEtape.theme, contexteEtape.etape);
        bilanEtape.meilleurScore = Math.max(bilanEtape.meilleurScore || 0, pourcentage);
        bilanEtape.nombreTentatives = (bilanEtape.nombreTentatives || 0) + 1;
        if (etapeTerminee) {
            const questionsEtape = obtenirQuestionsEtape(contexteEtape.theme, contexteEtape.etape);
            const toutesReussiesEnAutonomie = questionsEtape.length > 0
                && questionsEtape.every(question => bilanEtape.resultats?.[question.id] === true);
            const etaitDejaValideeSansJoker = bilanEtape.termineeSansJoker === true;
            bilanEtape.termineeSansJoker = etaitDejaValideeSansJoker || toutesReussiesEnAutonomie;
            bilanEtape.jokersUtilises = !bilanEtape.termineeSansJoker;
            const validationsSansJoker = bilanEtape.validationsSansJoker || {};
            // Les anciennes sauvegardes peuvent ne pas avoir le détail des
            // validations sans joker, alors que le résultat autonome est déjà
            // enregistré. Ce résultat constitue bien une maîtrise sans aide.
            questionsEtape.forEach(question => {
                if (bilanEtape.resultats?.[question.id] === true)
                    validationsSansJoker[question.id] = true;
            });
            bilanEtape.validationsSansJoker = validationsSansJoker;
            const toutesValideesSansJoker = questionsEtape.length > 0
                && questionsEtape.every(question => validationsSansJoker[question.id] === true);
            const celebrationDejaAffichee = bilanEtape.celebrationSansJokerAffichee === true;
            if (toutesValideesSansJoker && !celebrationDejaAffichee) {
                // Mémoriser avant les calculs globaux : ceux-ci réinitialisent les objets
                // de progression pour garantir leur structure et pourraient sinon perdre
                // le drapeau porté par l'ancienne référence JavaScript.
                bilanEtape.celebrationSansJokerAffichee = true;
                const evaluationDeverrouillee = estProgrammeMaitrise(contexteEtape.theme);
                celebration = obtenirCelebrationEtape(contexteEtape.etape, false, evaluationDeverrouillee);
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
    // Une révision globale, une catégorie ou un entraînement peut achever
    // plusieurs étapes. Leur validation ne dépend pas du chemin emprunté.
    const celebrations = celebration ? [celebration] : [];
    const etapesVues = new Set();
    for (const question of etat.questionsSession) {
        if (question.estEvaluationFinale || question.missionSigles || question.missionMesures) continue;
        const cle = `${question.theme}:${question.etape}`;
        if (etapesVues.has(cle)) continue;
        etapesVues.add(cle);
        if (!estEtapeMaitrisee(question.theme, question.etape)) continue;
        const bilan = obtenirBilanEtape(question.theme, question.etape);
        if (bilan.celebrationSansJokerAffichee) continue;
        bilan.celebrationSansJokerAffichee = true;
        celebrations.push(obtenirCelebrationEtape(question.etape, false, estProgrammeMaitrise(question.theme)));
    }
    celebration = celebrations.length > 1 ? {
        titre: `${celebrations.length} étapes maîtrisées !`,
        message: 'Toutes les questions de ces étapes ont été validées sans joker. Ta progression est à jour.',
        confetti: true
    } : celebrations[0] || null;
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
                message: `Tu as validé les ${THEMES.reduce((total, theme) => total + (PROGRAMMES[theme.id]?.etapes?.length || 0), 0)} étapes et réussi les ${THEMES.length} évaluations finales. Tous tes parcours Quiz CJPM sont terminés.`,
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
        messageResultat = `${autonomes}, ${reussitesAidees} et ${activitesPassees}. Les activités à consolider sont détaillées ci-dessous.`;
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
        messageResultat = `${autonomes} et ${reussitesAidees}. Les questions à consolider restent disponibles dans la révision.`;
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
            boutonContinuer.textContent = 'Voir ma progression →';
            boutonContinuer.onclick = () => afficherEcran('progression', { remplacerHistorique: true });
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
            : (estParcoursCompletReussi() ? 'Ton parcours complet est validé.' : 'Tu peux retravailler les questions à consolider puis refaire cette évaluation.');
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
function ouvrirEtapeDepuisCarteFinale(identifiantTheme, numeroEtape) {
    ouvrirParcours(identifiantTheme, { remplacerHistorique: true });
    requestAnimationFrame(() => {
        const etape = selectionner(`#parcours [data-etape="${numeroEtape}"]`);
        etape?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        etape?.focus({ preventScroll: true });
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
            bouton.setAttribute('aria-label', `Ouvrir le parcours ${indexTheme + 1}, étape ${etapeProgramme.id} · ${etapeProgramme.titre}`);
            bouton.onclick = () => ouvrirEtapeDepuisCarteFinale(theme.id, etapeProgramme.id);
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
    if (estSessionMissionMesures()) {
        terminerSessionMissionMesuresNative();
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
    selectionner('#contexteBilan').textContent = obtenirContexteFinSession();
    selectionner('#titreBilan').textContent = bilan.titre;
    selectionner('#rangBilan').textContent = bilan.messageResultat;
    const questionsAReprendre = obtenirQuestionsAConsoliderSession();
    afficherErreursBilan(questionsAReprendre, nombreQuestionsPassees);
    configurerBoutonContinuerBilan();
    actualiserProchaineDestinationBilan();
    afficherCarteVoyageFinale();
    terminerSauvegardeSession();
    afficherEcran('bilan', { remplacerHistorique: true });
    actualiserAccueil();
    lancerCelebrationBilan(bilan.celebration);
}

function rejouerQuestionsAConsoliderBilan() {
    const questions = obtenirQuestionsAConsoliderSession();
    if (!questions.length)
        return;
    const progression = etat.progressionAvantRevision;
    const titre = 'Questions à consolider de ma session';
    if (estSessionMissionSigles() || estSessionMissionMesures()) {
        const sigles = estSessionMissionSigles();
        const cleMeta = sigles ? 'missionSiglesMeta' : 'missionMesuresMeta';
        const cibles = [...new Map(questions.flatMap(question => sigles
            ? obtenirCiblesMissionQuestion(question) : obtenirCiblesMissionMesuresQuestion(question))
            .map(cible => [sigles ? cible.sigle : cible.cle, cible])).values()];
        const reprises = questions.map(question => ({ ...question, estEvaluationFinale: false,
            [cleMeta]: { ...question[cleMeta], mode: 'revision' } }));
        const configuration = { mode: 'revision', questions: reprises, questionsDejaConverties: true,
            jokersActifs: false, titre };
        if (sigles)
            preparerSessionMissionSiglesNative({ ...configuration, sigles: cibles });
        else
            preparerSessionMissionMesuresNative({ ...configuration, reperes: cibles });
    }
    else {
        etat.mode = 'revision';
        etat.perimetreRevision = null;
        etat.origineSessionAnalytics = 'revision_des_erreurs';
        etat.jokersSessionActifs = false;
        etat.chronometreSessionActif = false;
        lancerSession(questions);
    }
    etat.progressionAvantRevision = progression || null;
    actualiserBoutonReprendreEtapeDepuisDebut(etat.questionCourante);
    enregistrerSessionEnCours();
}
function afficherEtatVideErreurs(zone, aucunePartieJouee) {
    if (aucunePartieJouee) {
        zone.innerHTML = `<div class="revision-vide">
            <span class="revision-vide-icone" aria-hidden="true">↺</span>
            <span class="surtitre">Révision</span>
            <h2>Tu n’as pas encore joué.</h2>
            <p>Commence un parcours : les questions à consolider apparaîtront ici automatiquement.</p>
            <button class="principal" data-action="ouvrir-parcours-depuis-erreurs">Commencer un parcours →</button>
        </div>`;
        return;
    }
    zone.innerHTML = `<div class="revision-vide revision-vide-ok">
        <span class="revision-vide-icone" aria-hidden="true">✓</span>
        <span class="surtitre">À jour</span>
        <h2>Aucune question à consolider.</h2>
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
function obtenirCategorieRevision(suivi) {
    return normaliserMotifRevision(suivi?.motifRevision) || 'inconnu';
}
function obtenirElementsCategoriesRevision(jeu) {
    if (jeu === 'parcours') {
        return obtenirQuestionsAvecErreursActives().map(({ question, suiviErreur }) => ({
            cible: question,
            suivi: suiviErreur,
            libelle: question.enonce.split('\n')[0],
            repere: `Parcours ${obtenirOrdreTheme(question.theme) + 1} · Étape ${question.etape}`
        }));
    }
    if (jeu === 'sigles') {
        return obtenirErreursSiglesActives().map(cible => ({
            cible,
            suivi: obtenirSauvegardeJeuSigles().erreurs[normaliserSigleJeu(cible.sigle)],
            libelle: `${cible.sigle} · ${significationMissionSigles(cible)}`,
            repere: libelleEtapeSigles(cible.etape)
        }));
    }
    if (jeu === 'mesures') {
        return obtenirErreursMesuresActives().map(cible => ({
            cible,
            suivi: obtenirSauvegardeJeuMesures().erreurs[normaliserCleMesure(cible.cle)],
            libelle: cible.titre,
            repere: `Étape ${String(cible.etape).padStart(2, '0')}`
        }));
    }
    return [];
}
function construireReperesRevision(jeu, element) {
    const cible = element.cible;
    const badge = (libelle, couleur, couleurTexte = couleur) =>
        `<span class="revision-repere" style="--repere-accent:${couleur};--repere-texte:${couleurTexte}">${echapperHtml(libelle)}</span>`;
    if (jeu === 'parcours') {
        const parcours = obtenirIdentiteParcours(cible.theme);
        const couleurEtape = obtenirEtapeProgramme(cible.theme, cible.etape)?.couleur || obtenirCouleurTitreEtape(cible.etape);
        return `<small class="revision-reperes">${badge(`Parcours ${obtenirOrdreTheme(cible.theme) + 1}`, parcours.couleur, parcours.couleurTexte)}${badge(`Étape ${cible.etape}`, couleurEtape)}</small>`;
    }
    const etape = jeu === 'sigles' ? obtenirIdentiteEtapeMissionSigles(cible.etape)
        : obtenirIdentiteEtapeMissionMesures(cible.etape);
    return `<small class="revision-reperes">${badge(element.repere, etape.couleur, etape.couleurTexte)}</small>`;
}
function obtenirFiltresRevision(jeu) {
    etat.filtresRevision = etat.filtresRevision || {};
    etat.filtresRevision[jeu] = etat.filtresRevision[jeu] || { theme: 'toutes', etape: 'toutes' };
    return etat.filtresRevision[jeu];
}
function filtrerElementsRevision(jeu, elements) {
    const filtres = obtenirFiltresRevision(jeu);
    return elements.filter(({ cible }) => (jeu !== 'parcours' || filtres.theme === 'toutes' || cible.theme === filtres.theme)
        && (filtres.etape === 'toutes' || Number(cible.etape) === Number(filtres.etape)));
}
function construireMenuFiltreRevision(jeu, champ, libelle, choix, valeur) {
    const id = `filtreRevision${champ === 'theme' ? 'Parcours' : 'Etape'}-${jeu}`;
    const courant = choix.find(option => String(option.valeur) === String(valeur)) || choix[0];
    return `<div class="revision-filtre"><span id="${id}-libelle">${libelle}</span>
        <details class="revision-selecteur" data-filtre-revision="${champ}">
            <summary id="${id}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-options" aria-labelledby="${id}-libelle ${id}-valeur" ${courant.couleur ? `style="--filtre-accent:${courant.couleur}"` : ''}>
                <span id="${id}-valeur">${echapperHtml(courant.libelle)}</span><span class="revision-selecteur-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div id="${id}-options" class="revision-selecteur-options" role="listbox" aria-labelledby="${id}-libelle">
                ${choix.map(option => `<button type="button" role="option" aria-selected="${String(option.valeur) === String(valeur)}" tabindex="${String(option.valeur) === String(valeur) ? '0' : '-1'}" data-valeur-filtre="${echapperHtml(String(option.valeur))}" ${option.couleur ? `style="--filtre-accent:${option.couleur}"` : ''}><span>${echapperHtml(option.libelle)}</span><span aria-hidden="true">${String(option.valeur) === String(valeur) ? '✓' : ''}</span></button>`).join('')}
            </div>
        </details></div>`;
}
function fermerMenusRevisionAuClic(evenement) {
    document.querySelectorAll('.revision-selecteur[open]').forEach(menu => {
        if (!menu.contains(evenement.target)) menu.open = false;
    });
}
function construireEspaceRevision(jeu, zone) {
    const elements = obtenirElementsCategoriesRevision(jeu);
    const filtres = obtenirFiltresRevision(jeu);
    const themes = jeu === 'parcours' ? THEMES.filter(theme => elements.some(({ cible }) => cible.theme === theme.id)) : [];
    if (jeu === 'parcours' && !themes.some(theme => theme.id === filtres.theme)) filtres.theme = 'toutes';
    const etapes = [...new Set(elements.filter(({ cible }) => filtres.theme === 'toutes' || cible.theme === filtres.theme)
        .map(({ cible }) => Number(cible.etape)))].sort((a,b) => a-b);
    if (!etapes.includes(Number(filtres.etape))) filtres.etape = 'toutes';
    const selection = filtrerElementsRevision(jeu, elements);
    const choixParcours = [{ valeur:'toutes', libelle:'Tous les parcours' }, ...themes.map(theme => {
        const identite = obtenirIdentiteParcours(theme.id);
        return { valeur:theme.id, libelle:identite.titre, couleur:identite.couleurTexte || identite.couleur };
    })];
    const choixEtapes = [{ valeur:'toutes', libelle:'Toutes les étapes' }, ...etapes.map(numero => ({
        valeur:String(numero), libelle:jeu === 'sigles' ? libelleEtapeSigles(numero) : `Étape ${numero}`,
        couleur:jeu === 'parcours' ? (obtenirEtapeProgramme(filtres.theme, numero)?.couleur || obtenirCouleurTitreEtape(numero))
            : (jeu === 'sigles' ? obtenirIdentiteEtapeMissionSigles(numero) : obtenirIdentiteEtapeMissionMesures(numero)).couleur
    }))];
    zone.innerHTML = `<section class="revision-filtres" aria-label="Choisir les questions à réviser">
        <p>Choisis un périmètre, puis révise toute la sélection ou une catégorie ci-dessous. Chaque question apparaît une seule fois.</p>
        <div class="revision-filtres-champs">
        ${jeu === 'parcours' ? construireMenuFiltreRevision(jeu, 'theme', 'Parcours', choixParcours, filtres.theme) : ''}
        ${construireMenuFiltreRevision(jeu, 'etape', 'Étape', choixEtapes, filtres.etape)}
        </div>
        <button class="principal" type="button" data-revision-selection="${jeu}">Réviser la sélection · ${selection.length} ${accorderLibelle(selection.length, 'question', 'questions')} →</button>
        </section>${construireCategoriesRevision(jeu)}`;
    zone.querySelectorAll('[data-filtre-revision]').forEach(menu => {
        const entete = menu.querySelector('summary');
        const options = [...menu.querySelectorAll('[role="option"]')];
        menu.ontoggle = () => entete.setAttribute('aria-expanded', String(menu.open));
        menu.onfocusout = evenement => {
            if (evenement.relatedTarget && !menu.contains(evenement.relatedTarget)) menu.open = false;
        };
        menu.onkeydown = evenement => {
            if (evenement.key === 'Escape') { evenement.preventDefault(); menu.open = false; entete.focus(); return; }
            if (!['ArrowDown','ArrowUp','Home','End'].includes(evenement.key)) return;
            evenement.preventDefault(); menu.open = true;
            const index = options.indexOf(document.activeElement);
            const suivant = evenement.key === 'Home' ? 0 : evenement.key === 'End' ? options.length - 1
                : index < 0 ? Math.max(0, options.findIndex(option => option.getAttribute('aria-selected') === 'true'))
                    : (index + (evenement.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
            options.forEach((option, position) => { option.tabIndex = position === suivant ? 0 : -1; });
            options[suivant]?.focus();
        };
        options.forEach(option => { option.onclick = () => {
            filtres[menu.dataset.filtreRevision] = option.dataset.valeurFiltre;
            if (menu.dataset.filtreRevision === 'theme') filtres.etape = 'toutes';
            construireEspaceRevision(jeu, zone);
            selectionner(`#${entete.id}`)?.focus();
        }; });
    });
    document.addEventListener('click', fermerMenusRevisionAuClic);
    const bouton = zone.querySelector('[data-revision-selection]');
    if (bouton) bouton.onclick = () => lancerRevisionSelection(jeu);
}
function lancerRevisionSelection(jeu, categorie = null) {
    const cibles = filtrerElementsRevision(jeu, obtenirElementsCategoriesRevision(jeu))
        .filter(element => categorie === null || obtenirCategorieRevision(element.suivi) === categorie)
        .map(element => element.cible);
    if (!cibles.length) { afficherNotification('Aucune question dans cette sélection.'); return; }
    if (jeu === 'parcours') {
        const filtres = obtenirFiltresRevision(jeu);
        lancerRevision(filtres.theme, categorie, filtres.etape);
        return;
    }
    const titre = categorie ? obtenirLibelleConsolidation({ motifRevision: categorie }) : 'Questions à consolider';
    if (jeu === 'sigles') preparerSessionMissionSiglesNative({ mode: 'revision', sigles: cibles,
        questions: creerQuestionsRevisionSigles(cibles), jokersActifs: false, titre });
    if (jeu === 'mesures') preparerSessionMissionMesuresNative({ mode: 'revision', reperes: cibles,
        questions: creerQuestionsRevisionMesures(cibles), jokersActifs: false, titre });
}
function construireCategoriesRevision(jeu) {
    const elements = filtrerElementsRevision(jeu, obtenirElementsCategoriesRevision(jeu));
    if (!elements.length) return '';
    const categories = ['reprise', 'joker', 'passage', 'incorrecte'];
    if (elements.some(element => obtenirCategorieRevision(element.suivi) === 'inconnu'))
        categories.push('inconnu');
    const dossiers = categories.map(categorie => {
        const selection = elements.filter(element => obtenirCategorieRevision(element.suivi) === categorie);
        const total = selection.length;
        if (!total) return '';
        const libelle = obtenirLibelleConsolidation({ motifRevision: categorie });
        const contenu = `<ul>${selection.map(element => `<li><span>${echapperHtml(element.libelle)}</span>${construireReperesRevision(jeu, element)}</li>`).join('')}</ul>
               <button class="secondaire" type="button" data-action="reviser-categorie" data-jeu-revision="${jeu}" data-categorie-revision="${categorie}">Réviser ${total} ${accorderLibelle(total, 'question', 'questions')} →</button>`;
        return `<details class="revision-categorie" data-categorie-revision="${categorie}">
            <summary><span><strong>${libelle}</strong><small>${total} ${accorderLibelle(total, 'question', 'questions')}</small></span><span class="revision-categorie-chevron" aria-hidden="true">⌄</span></summary>
            <div class="revision-categorie-contenu">${contenu}</div>
        </details>`;
    }).join('');
    return `<section class="revision-categories" aria-labelledby="titreCategoriesRevision-${jeu}">
        <h2 id="titreCategoriesRevision-${jeu}">Réviser par catégorie</h2>
        <p>Ouvre une catégorie pour voir ses questions et les rejouer.</p>
        <div class="revision-categories-grille">${dossiers}</div>
    </section>`;
}
function lancerRevisionCategorie(jeu, categorie) {
    if (!['parcours', 'sigles', 'mesures'].includes(jeu)
        || !['reprise', 'joker', 'passage', 'incorrecte', 'inconnu'].includes(categorie)) return;
    // Les mêmes filtres servent à la liste et à la session, relus au clic.
    lancerRevisionSelection(jeu, categorie);
}

function afficherErreurs() {
    const zone = selectionner('#contenuErreurs');
    const questionsAvecErreurs = obtenirQuestionsAvecErreursActives();
    if (questionsAvecErreurs.length === 0) {
        afficherEtatVideErreurs(zone, !sauvegarde.aDejaJoue);
        return;
    }
    construireEspaceRevision('parcours', zone);
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
    'supports-reperes-pjj': ['commun', 'jugement_educatif_ordinaire'],
    'supports-je': ['procedure_ordinaire', 'jugement_educatif_ordinaire', 'application_execution_peines'],
    'supports-tpe': ['procedure_ordinaire', 'jugement_educatif_ordinaire', 'matiere_criminelle_peines', 'application_execution_peines'],
    'supports-ji': ['information_judiciaire'],
    'supports-jld': ['information_judiciaire'],
    'supports-cam': ['matiere_criminelle_peines'],
    'supports-jap': ['application_execution_peines'],
    'supports-transversaux': ['procedure_ordinaire', 'information_judiciaire', 'jugement_educatif_ordinaire', 'matiere_criminelle_peines', 'application_execution_peines']
});
function obtenirIndexIdentiteCategorieSupport(categorie) {
    const titreCategorie = categorie.querySelector(':scope > summary')?.textContent || '';
    const parcours = (categorie.dataset.parcoursSupports || '')
        .split(' ')
        .filter(Boolean)
        .map(identifiant => {
            const identite = obtenirIdentiteParcours(identifiant);
            return `P${Number(identite.numero)} parcours ${Number(identite.numero)} parcours ${identite.numero} ${identite.titre}`;
        })
        .join(' ');
    return normaliserRechercheSupports(`${titreCategorie} ${parcours}`);
}
function obtenirIndexRechercheCategorie(categorie) {
    return normaliserRechercheSupports(`${obtenirIndexIdentiteCategorieSupport(categorie)} ${categorie.dataset.motsCles || ''}`);
}
function obtenirIndexIdentiteSupport(ressource) {
    const entete = ressource.matches('details')
        ? ressource.querySelector(':scope > summary')?.textContent || ''
        : ressource.textContent || '';
    return normaliserRechercheSupports(`${entete} ${ressource.dataset.motsCles || ''}`);
}
function obtenirIndexRechercheSupport(ressource) {
    return normaliserRechercheSupports(`${ressource.textContent} ${ressource.dataset.motsCles || ''}`);
}
function obtenirVariantesTermeRechercheSupport(terme) {
    if (terme.length <= 3)
        return [terme];
    const variantes = new Set([terme]);
    if (terme.endsWith('s') && terme.length > 4)
        variantes.add(terme.slice(0, -1));
    else
        variantes.add(`${terme}s`);
    return [...variantes];
}
function correspondARechercheSupport(indexRecherche, termesRecherches) {
    if (!termesRecherches.length)
        return true;
    const motsIndex = new Set(indexRecherche.split(' ').filter(Boolean));
    return termesRecherches.every(terme => obtenirVariantesTermeRechercheSupport(terme).some(variante =>
        variante.length <= 3 ? motsIndex.has(variante) : indexRecherche.includes(variante)
    ));
}
function calculerPrioriteRechercheSupport(ressource, termesRecherches, ordreInitial) {
    if (!termesRecherches.length)
        return ordreInitial;
    const correspondIdentite = correspondARechercheSupport(obtenirIndexIdentiteSupport(ressource), termesRecherches);
    return (correspondIdentite ? 0 : 1000) + ordreInitial;
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
    // Numéros, ordre et couleurs viennent du même catalogue que la page Parcours.
    // Les filtres ciblent les identifiants stables, jamais les anciens numéros.
    const filtres = zone.querySelector('.supports-filtres');
    THEMES.forEach(theme => {
        const identite = obtenirIdentiteParcours(theme.id);
        const libelle = `${identite.libelleNumero || `Parcours ${identite.numero}`} — ${identite.titre}`;
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'support-filtre-parcours';
        bouton.dataset.filtreSupports = theme.id;
        bouton.textContent = `${identite.optionnel ? 'Option : ' : ''}P${Number(identite.numero)}`;
        bouton.title = libelle;
        bouton.setAttribute('aria-label', `Filtrer : ${libelle}`);
        bouton.setAttribute('aria-pressed', 'false');
        bouton.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
        bouton.style.setProperty('--parcours-accent-rgb', identite.couleurRgb);
        filtres?.appendChild(bouton);
    });
    zone.querySelectorAll('.supports-juridiction').forEach(categorie => {
        const rattachements = PARCOURS_PAR_CATEGORIE_SUPPORT[categorie.id] || [];
        const parcours = THEMES.filter(theme => rattachements.includes(theme.id)).map(theme => theme.id);
        categorie.dataset.parcoursSupports = parcours.join(' ');
        const titre = categorie.querySelector('.support-juridiction-titre');
        if (!titre || !parcours.length)
            return;
        const badges = document.createElement('span');
        badges.className = 'supports-parcours-badges';
        parcours.forEach(identifiant => {
            const identite = obtenirIdentiteParcours(identifiant);
            const badge = document.createElement('i');
            badge.className = 'support-parcours-badge';
            badge.textContent = `P${Number(identite.numero)}`;
            badge.title = `${identite.libelleNumero || `Parcours ${identite.numero}`} — ${identite.titre}`;
            badge.style.setProperty('--parcours-accent-lisible', identite.couleurTexte);
            badges.appendChild(badge);
        });
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
    const correspondancesIdentite = new Map(categories.map(categorie => [
        categorie,
        correspondARechercheSupport(obtenirIndexIdentiteCategorieSupport(categorie), termesRecherches)
    ]));
    const correspondancesCategorie = new Map(categories.map(categorie => [
        categorie,
        correspondARechercheSupport(obtenirIndexRechercheCategorie(categorie), termesRecherches)
    ]));
    const rechercheCourte = termesRecherches.length === 1 && termesRecherches[0].length <= 3;
    const limiterAuxCategoriesIdentifiees = rechercheCourte
        && [...correspondancesIdentite.values()].some(Boolean);
    categories.forEach((categorie, ordreInitial) => {
        const correspondAuFiltre = filtre === 'tous'
            || (categorie.dataset.parcoursSupports || '').split(' ').includes(filtre);
        const correspondIdentite = correspondancesIdentite.get(categorie);
        const correspondCategorie = correspondancesCategorie.get(categorie);
        let ressourcesCorrespondantes = 0;
        let meilleurePrioriteRessource = 2000;
        categorie.querySelectorAll(':scope > .supports-juridiction-contenu > .support-revision').forEach((ressource, ordreRessource) => {
            const correspondContenu = correspondARechercheSupport(obtenirIndexRechercheSupport(ressource), termesRecherches);
            const correspond = !termesRecherches.length
                || (rechercheCourte && correspondIdentite)
                || (!limiterAuxCategoriesIdentifiees && correspondContenu);
            const prioriteRessource = calculerPrioriteRechercheSupport(ressource, termesRecherches, ordreRessource);
            ressource.classList.toggle('masque-recherche-support', !correspond);
            ressource.style.order = termesRecherches.length && correspond ? String(prioriteRessource) : '';
            if (correspond) {
                ressourcesCorrespondantes += 1;
                meilleurePrioriteRessource = Math.min(meilleurePrioriteRessource, prioriteRessource);
            }
        });
        const categorieVisible = correspondAuFiltre && ressourcesCorrespondantes > 0;
        categorie.classList.toggle('masque-recherche-support', !categorieVisible);
        categorie.style.order = termesRecherches.length
            ? String(((correspondIdentite || correspondCategorie) ? 0 : 10000) + meilleurePrioriteRessource + ordreInitial)
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
    1: { numero:'01', titre:'Enquête et premiers repères', sousTitre:'Parcours 1 · De l’enquête à la sanction', domaine:'cjpm', couleur:'#d49a00', couleurTexte:'#ffd36a', couleurRgb:'212,154,0', icone:'justice' },
    2: { numero:'02', titre:'Instruction et mesures de sûreté', sousTitre:'Parcours 2 · Information judiciaire', domaine:'cjpm', couleur:'#0891b2', couleurTexte:'#70d7ea', couleurRgb:'8,145,178', icone:'justice' },
    3: { numero:'03', titre:'Jugement et réponse éducative', sousTitre:'Parcours 3 · Du jugement à la sanction', domaine:'cjpm', couleur:'#8b5cf6', couleurTexte:'#c7afff', couleurRgb:'139,92,246', icone:'mesures' },
    4: { numero:'04', titre:'Matière criminelle et garanties', sousTitre:'Parcours 4 · Crimes, peines et droits', domaine:'cjpm', couleur:'#e11d48', couleurTexte:'#ff91a8', couleurRgb:'225,29,72', icone:'justice' },
    5: { numero:'05', titre:'Application et exécution des peines', sousTitre:'Parcours 5 · Après la sanction', domaine:'cjpm', couleur:'#0f766e', couleurTexte:'#70d6ca', couleurRgb:'15,118,110', icone:'mesures' },
    6: { numero:'01', titre:'Organisation de la PJJ', sousTitre:'Directions, fonctions et pilotage', domaine:'pjj', etapePjj:5, ...obtenirCouleursEtapePJJ(5), icone:'organisation' },
    7: { numero:'02', titre:'Services, unités et formation', sousTitre:'Milieu ouvert, insertion et formation', domaine:'pjj', etapePjj:6, ...obtenirCouleursEtapePJJ(6), icone:'services' },
    8: { numero:'03', titre:'Placement et détention', sousTitre:'Structures et dispositifs de placement', domaine:'pjj', etapePjj:9, ...obtenirCouleursEtapePJJ(9), icone:'placement' },
    9: { numero:'04', titre:'Partenaires et repères professionnels', sousTitre:'Protection de l’enfance et accompagnement', domaine:'pjj', etapePjj:11, ...obtenirCouleursEtapePJJ(11), icone:'partenaires' }
});
function obtenirDomaineSigles() { return obtenirSauvegardeJeuSigles().domaine || 'cjpm'; }
function libelleDomaineSigles(domaine=obtenirDomaineSigles()) { return {cjpm:'CJPM',pjj:'PJJ',tous:'CJPM et PJJ'}[domaine] || 'CJPM'; }
function obtenirPoolDomaineSigles(domaine=obtenirDomaineSigles()) { return SIGLES.filter(x => domaine === 'tous' || x.domaine === domaine); }
function numerosEtapesSigles(domaine=obtenirDomaineSigles()) { return Object.keys(ETAPES_MISSION_SIGLES).map(Number).filter(n => domaine === 'tous' || ETAPES_MISSION_SIGLES[n].domaine === domaine); }
function obtenirEvaluationSigles(domaine=obtenirDomaineSigles()) {
    const jeu=obtenirSauvegardeJeuSigles();
    if(domaine==='tous') return jeu.evaluation;
    jeu.evaluations ||= {};
    jeu.evaluations[domaine] ||= {meilleurScore:0,nombreTentatives:0,reussie:false};
    return jeu.evaluations[domaine];
}
function choisirDomaineSigles(domaine) {
    if(!['cjpm','pjj','tous'].includes(domaine)) return;
    obtenirSauvegardeJeuSigles().domaine=domaine;
    etatJeuSigles.tirageHasard=[];
    selectionnerSigles('#siglesJouerTirage')?.classList.add('masque');
    enregistrerSauvegarde(); actualiserAccueilSigles();
    construireRevisionMissionSiglesIndependante();
}
function actualiserChoixDomaineSigles() {
    selectionnerTousSigles('[data-choix-domaine-sigles]').forEach(zone => {
        zone.innerHTML=['cjpm','pjj','tous'].map(d => `<button type="button" class="choix-bouton${d===obtenirDomaineSigles()?' actif':''}" data-domaine-sigles="${d}" aria-pressed="${d===obtenirDomaineSigles()}"><b>${d==='tous'?'Tous':`Sigles ${libelleDomaineSigles(d)}`}</b><span>${obtenirPoolDomaineSigles(d).length} sigles · ${d==='cjpm'?'les 5 parcours':d==='pjj'?'option PJJ':'les deux domaines'}</span></button>`).join('');
        zone.querySelectorAll('button').forEach(b => b.addEventListener('click',()=>choisirDomaineSigles(b.dataset.domaineSigles)));
    });
}
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
function etapeSiglesMaitrisee(numero) { return compterMaitrisesEtapeSigles(numero) === obtenirSiglesEtape(numero).length; }
function evaluationSiglesDebloquee() { return numerosEtapesSigles().every(etapeSiglesMaitrisee); }
function obtenirErreursSiglesActives(domaine=obtenirDomaineSigles()) {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs || {};
    return Object.entries(erreurs).filter(([,e]) => e?.active === true).map(([sigle]) => obtenirSigleJeu(sigle)).filter(c => c && (domaine==='tous' || c.domaine===domaine));
}
function obtenirSiglesNonMaitrisesEtape(numero) {
    const etape = obtenirEtatEtapeSigles(numero);
    return obtenirSiglesEtape(numero).filter(cible =>
        sigleEstIntroduit(cible.sigle)
        && etape.autonomes[normaliserSigleJeu(cible.sigle)] !== true
    );
}
function obtenirCiblesARejouerEtapeSigles(numero) {
    const cibles = [...obtenirErreursSiglesActives('tous').filter(cible => Number(cible.etape) === Number(numero)), ...obtenirSiglesNonMaitrisesEtape(numero)];
    return [...new Map(cibles.map(cible => [normaliserSigleJeu(cible.sigle), cible])).values()];
}
function enregistrerErreurSigles(cibles, motifRevision = 'incorrecte') {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserSigleJeu(cible.sigle);
        const actuelle = erreurs[cle] || { active:false, nombreErreurs:0, reussitesRevision:0 };
        erreurs[cle] = { ...actuelle, active:true, motifRevision, nombreErreurs:Number(actuelle.nombreErreurs || 0) + (motifRevision === 'incorrecte' ? 1 : 0), reussitesRevision:motifRevision === 'reprise' ? 1 : 0 };
    });
}
function validerRevisionSigles(cibles) {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserSigleJeu(cible.sigle);
        const actuelle = erreurs[cle];
        if (!actuelle?.active) return;
        // Une nouvelle réussite autonome suffit, dans tous les modes de jeu.
        actuelle.reussitesRevision = 1;
        actuelle.active = false;
        actuelle.motifRevision = null;
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
    const pool=obtenirPoolDomaineSigles();
    const introduits = pool.filter(x=>jeu.decouverts[x.sigle]).length;
    actualiserChoixDomaineSigles();
    selectionnerSigles('#siglesTitreProgression').textContent=`${libelleDomaineSigles()} · ${pool.length} sigles`;
    selectionnerSigles('#siglesTitreEtapes').textContent=`${libelleDomaineSigles()} · ${numerosEtapesSigles().length} étapes`;
    selectionnerSigles('#siglesDescriptionParcours').textContent=`${numerosEtapesSigles().length} étapes progressives pour apprendre les ${pool.length} sigles ${libelleDomaineSigles()}.`;
    if(!etatJeuSigles.tirageHasard.length) selectionnerSigles('#siglesDeResultat').textContent=`Lance le dé pour tirer de 1 à 6 questions parmi les ${pool.length} sigles ${libelleDomaineSigles()}.`;
    const maitrises = numerosEtapesSigles().reduce((total,n) => total + compterMaitrisesEtapeSigles(n), 0);
    const etapes = numerosEtapesSigles().filter(etapeSiglesMaitrisee).length;
    const erreurs = obtenirErreursSiglesActives().length;
    const pourcentage = Math.round(maitrises / pool.length * 100);
    if (selectionnerSigles('#siglesResumeProgression')) selectionnerSigles('#siglesResumeProgression').textContent = `${maitrises} sigle${maitrises===1?'':'s'} maîtrisé${maitrises===1?'':'s'} · ${etapes} étape${etapes===1?'':'s'} maîtrisée${etapes===1?'':'s'}`;
    if (selectionnerSigles('#siglesNombreDecouverts')) selectionnerSigles('#siglesNombreDecouverts').textContent = introduits;
    if (selectionnerSigles('#siglesNombreMaitrises')) selectionnerSigles('#siglesNombreMaitrises').textContent = maitrises;
    if (selectionnerSigles('#siglesNombreErreurs')) selectionnerSigles('#siglesNombreErreurs').textContent = erreurs;
    if (selectionnerSigles('#siglesMeilleurScore')) selectionnerSigles('#siglesMeilleurScore').textContent = `${obtenirEvaluationSigles().meilleurScore || 0}%`;
    if (selectionnerSigles('#siglesJaugeValeur')) selectionnerSigles('#siglesJaugeValeur').style.width = `${pourcentage}%`;
    if (selectionnerSigles('#siglesProgressionGlobale')) selectionnerSigles('#siglesProgressionGlobale').setAttribute('aria-valuenow', String(pourcentage));
    if (selectionnerSigles('#siglesTexteRevision')) selectionnerSigles('#siglesTexteRevision').textContent = erreurs ? `${erreurs} sigle${erreurs===1?'':'s'} à consolider.` : 'Aucun sigle à revoir pour le moment.';
    construireCartesEtapesSigles(); actualiserCarteEvaluationSigles(); construireChoixPerimetreSigles();
}
function construireCartesEtapesSigles() {
    const zone = selectionnerSigles('#siglesEtapes'); if (!zone) return;
    zone.dataset.domaine = obtenirDomaineSigles();
    zone.innerHTML = numerosEtapesSigles().map(numero => {
        const identite = ETAPES_MISSION_SIGLES[numero]; const maitrises = compterMaitrisesEtapeSigles(numero); const sansJoker = compterValidationsSansJokerEtapeSigles(numero); const nombre = obtenirSiglesEtape(numero).length; const pc = Math.round(maitrises/nombre*100);
        const erreurs = obtenirCiblesARejouerEtapeSigles(numero).length;
        const etoile = sansJoker === obtenirSiglesEtape(numero).length ? creerEtoileFilanteProgression() : '';
        const revision = `<button class="sigles-etape-revision" data-action="reviser-etape-sigles" data-etape="${numero}" type="button"${erreurs ? '' : ' disabled'}>${erreurs ? '↻ Consolider mes réponses' : 'Aucune question à consolider'}${erreurs ? ` <strong>${erreurs}</strong>` : ''}</button>`;
        return `<article class="sigles-etape-carte" data-sigles-etape="${numero}" style="--sigles-etape-accent:${identite.couleur};--sigles-etape-accent-lisible:${identite.couleurTexte};--sigles-etape-rgb:${identite.couleurRgb}"><button class="sigles-etape-ouvrir" data-sigles-etape="${numero}" type="button"><span class="sigles-etape-carte-entete"><span class="sigles-etape-icone" aria-hidden="true">${iconeEtapeSigles(identite.icone)}</span><span class="sigles-etape-numero">${libelleDomaineSigles(identite.domaine)} · ÉTAPE ${identite.numero}</span>${etoile}</span><h3>${identite.titre}</h3><p>${identite.sousTitre}<br>${nombre} sigles · ${nombre*2} activités de parcours.</p><span class="sigles-etape-progression"><i style="width:${pc}%"></i></span><span class="sigles-etape-pied"><span>${maitrises}/${nombre} bonnes réponses · ${sansJoker}/${nombre} sans joker</span><span>${maitrises===nombre?'Maîtrisée ✓':'Ouvrir →'}</span></button>${revision}</article>`;
    }).join('');
    zone.querySelectorAll('.sigles-etape-ouvrir').forEach(b => b.addEventListener('click', () => lancerEtapeSigles(Number(b.dataset.siglesEtape))));
}
function actualiserCarteEvaluationSigles() {
    const bouton = selectionnerSigles('#siglesLancerEvaluation'); const carte = selectionnerSigles('#siglesEvaluationCarte'); const statut = selectionnerSigles('#siglesEvaluationStatut'); const ok = evaluationSiglesDebloquee();
    if (bouton) { bouton.disabled = !ok; bouton.textContent = ok ? 'Commencer l’évaluation' : `Maîtrise les ${numerosEtapesSigles().length} étapes ${libelleDomaineSigles()}`; }
    carte?.classList.toggle('verrouillee', !ok);
    if (statut) statut.textContent = ok ? 'Évaluation débloquée.' : `Disponible après la maîtrise des ${numerosEtapesSigles().length} étapes ${libelleDomaineSigles()}.`;
}
function construireChoixPerimetreSigles() {
    const zone = selectionnerSigles('#siglesChoixPerimetre'); if (!zone) return;
    const actuel = zone.querySelector('[aria-pressed="true"]')?.dataset.perimetre || 'tous';
    zone.innerHTML = `<button class="choix-bouton entrainement-perimetre-global" data-perimetre="tous" type="button" style="--parcours-accent:#4f8cff;--parcours-accent-lisible:#9fc2ff;--parcours-accent-rgb:79,140,255"><b>Tous les sigles</b><span>Les ${numerosEtapesSigles().length} étapes</span></button>` + numerosEtapesSigles().map(n => { const e=ETAPES_MISSION_SIGLES[n]; return `<button class="choix-bouton" data-perimetre="${n}" type="button" style="--parcours-accent:${e.couleur};--parcours-accent-lisible:${e.couleurTexte};--parcours-accent-rgb:${e.couleurRgb}"><b>${e.numero} · ${e.titre}</b><span>${obtenirSiglesEtape(n).length} sigles</span></button>`; }).join('');
    zone.querySelectorAll('button').forEach(b => { const actif = b.dataset.perimetre === actuel; b.classList.toggle('actif', actif); b.setAttribute('aria-pressed', actif?'true':'false'); b.addEventListener('click', () => { activerBoutonGroupeSigles(zone,b); actualiserDisponibiliteNombreSigles(); }); });
    actualiserDisponibiliteNombreSigles();
}
function activerBoutonGroupeSigles(zone, bouton) { zone?.querySelectorAll('button').forEach(b => { const actif=b===bouton; b.classList.toggle('actif',actif); b.setAttribute('aria-pressed',actif?'true':'false'); }); }
function valeurGroupeSigles(selecteur, attribut, defaut) { const actif = selectionnerSigles(`${selecteur} button[aria-pressed="true"]`); return actif?.dataset?.[attribut] ?? defaut; }
function actualiserDisponibiliteNombreSigles() {
    const perimetre = valeurGroupeSigles('#siglesChoixPerimetre','perimetre','tous'); const max = obtenirPoolEntrainementMissionSigles(perimetre).length; const info=selectionnerSigles('#siglesNombreDisponible'); if(info) info.textContent=`${max} sigles disponibles dans ce périmètre.`;
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
    const domaines = new Set(extras.map(x=>x.domaine));
    const connus = SIGLES.filter(x=>sigleEstIntroduit(x.sigle) && (domaines.size ? domaines.has(x.domaine) : obtenirPoolDomaineSigles().includes(x)));
    const map = new Map([...connus,...extras].map(x=>[normaliserSigleJeu(x.sigle),x])); return [...map.values()];
}
function creerQuestionRappelDirectSigles(cible, pool=SIGLES) {
    pool=pool.filter(x=>x.domaine===cible.domaine);
    if(pool.length<4) pool=obtenirPoolDomaineSigles(cible.domaine);
    const autres = choisirSansDoublon(pool.filter(x=>normaliserSigleJeu(x.sigle)!==normaliserSigleJeu(cible.sigle)),3);
    const options = melangerSigles([cible,...autres]).map((x,i)=>({id:`dev-${i}`,texte:significationMissionSigles(x),correcte:normaliserSigleJeu(x.sigle)===normaliserSigleJeu(cible.sigle)}));
    return { type:'choix', cibles:[cible], cible, compteMaitrise:true, consigne:`Que signifie ${cible.sigle} ?`, options, explication:`${cible.sigle} signifie « ${significationMissionSigles(cible)} ». ${cible.repere || ''}`.trim(), indice:cible.repere || `Cherche le développement exact de ${cible.sigle}.` };
}
function creerQuestionRappelInverseSigles(cible, poolConnus) {
    const eligibles = poolConnus.filter(x=>x.domaine===cible.domaine && normaliserSigleJeu(x.sigle)!==normaliserSigleJeu(cible.sigle) && sigleEstIntroduit(x.sigle));
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
    const connus=obtenirPoolDomaineSigles(); const cibles=choisirSansDoublon(connus,NOMBRE_QUESTIONS_EVALUATION_SIGLES);
    return cibles.map((cible,index)=> index>0 && index%6===5 ? creerQuestionAssociationSigles(choisirSansDoublon(connus,4)) : (index%2?creerQuestionRappelInverseSigles(cible,connus):creerQuestionRappelDirectSigles(cible,connus))).slice(0,NOMBRE_QUESTIONS_EVALUATION_SIGLES);
}

function questionSiglesAReprendre(question) {
    const cibles = question?.cibles || [];
    return cibles.some(cible => {
        const etape = obtenirEtatEtapeSigles(Number(cible.etape));
        const cle = normaliserSigleJeu(cible.sigle);
        // Une introduction déjà découverte n'a pas besoin d'être rejouée.
        // Les activités de rappel restent nécessaires tant que le sigle n'est
        // pas maîtrisé en autonomie, sans joker.
        return question.estIntroduction
            ? !sigleEstIntroduit(cle)
            : etape.autonomes[cle] !== true;
    });
}

function obtenirQuestionsRestantesEtapeSigles(numero, questions) {
    return questions.filter(questionSiglesAReprendre);
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
    if(correcte){ if(q.estIntroduction && q.cible) marquerSigleIntroduit(q.cible.sigle); etatJeuSigles.score += 1; const autonome=!etatJeuSigles.aideUtilisee && !parJoker; if(autonome) etatJeuSigles.reponsesAutonomes += 1; else etatJeuSigles.reponsesAidees += 1;
        if(q.compteMaitrise){ cibles.forEach(cible=>{ const etape=obtenirEtatEtapeSigles(Number(cible.etape)), cle=normaliserSigleJeu(cible.sigle); if(!etatJeuSigles.aideUtilisee&&!parJoker) etape.validationsSansJoker[cle]=true; if(autonome) etape.autonomes[cle]=true; }); verifierCelebrationEtapeSigles(cibles); }
        if(autonome && etatJeuSigles.tentativesQuestion > 1) enregistrerErreurSigles(cibles, 'reprise'); else if(!q.estIntroduction && autonome) validerRevisionSigles(cibles); else if(!autonome) enregistrerErreurSigles(cibles, 'joker'); afficherFeedbackSigles('succes',q.explication || 'Bonne réponse.');
    } else { if(passage||tempsEcoule){ etatJeuSigles.questionsPassees += 1; enregistrerErreurSigles(cibles, 'passage'); afficherFeedbackSigles('erreur',tempsEcoule?'Temps écoulé. Cette question rejoint tes révisions.':'Question passée. Elle rejoint tes révisions.'); } }
    obtenirSauvegardeJeuSigles().statistiques.questionsJouees += 1; enregistrerSauvegarde();
    selectionnerTousSigles('#siglesZoneQuestion button, #siglesZoneQuestion select').forEach(e=>e.disabled=true); selectionnerSigles('#siglesValiderActivite')?.classList.add('masque'); selectionnerSigles('#siglesQuestionSuivante')?.classList.remove('masque'); selectionnerSigles('#siglesPasserQuestion')?.classList.add('masque'); selectionnerSigles('#siglesJokers')?.querySelectorAll('button').forEach(b=>b.disabled=true);
}
function afficherFeedbackSigles(type,texte){ const z=selectionnerSigles('#siglesFeedback'); if(!z)return; z.dataset.type=type; z.textContent=texte; z.classList.remove('masque'); }
function passerQuestionSigles(){ if(etatJeuSigles.mode==='evaluation'||etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; finaliserQuestionSigles(false,q.cibles,{passage:true}); }
function questionSuivanteSigles(){ etatJeuSigles.indexQuestion += 1; afficherQuestionSigles(); }
function verifierCelebrationEtapeSigles(cibles){ const numeros=[...new Set(cibles.map(c=>Number(c.etape)))]; numeros.forEach(n=>{ const e=obtenirEtatEtapeSigles(n); if(compterValidationsSansJokerEtapeSigles(n)===obtenirSiglesEtape(n).length && !e.celebrationAffichee){ etatJeuSigles.celebrationEtapeADiffuser=n; } }); }

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
    if(etatJeuSigles.mode==='evaluation'){ obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).nombreTentatives+=1;obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).meilleurScore=Math.max(obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).meilleurScore||0,pc);etatJeuSigles.evaluationReussie=pc>=SEUIL_EVALUATION_SIGLES&&etatJeuSigles.questionsPassees===0;etatJeuSigles.evaluationParfaite=pc===100&&etatJeuSigles.questionsPassees===0;if(etatJeuSigles.evaluationReussie)obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).reussie=true; }
    enregistrerSauvegarde(); afficherVueSigles('bilan'); afficherBilanSigles(pc); actualiserAccueilSigles(); }
function afficherBilanSigles(pc){ const total=etatJeuSigles.questions.length; if(selectionnerSigles('#siglesBilanScore'))selectionnerSigles('#siglesBilanScore').textContent=`${etatJeuSigles.score} / ${total} · ${pc}%`; if(selectionnerSigles('#siglesBilanDetails'))selectionnerSigles('#siglesBilanDetails').textContent=`${etatJeuSigles.reponsesAutonomes} réussites autonomes · ${etatJeuSigles.reponsesAidees} avec aide · ${etatJeuSigles.questionsPassees} passées`;
    let surtitre='Mission Sigles', titre='Session terminée', texte='Les sigles difficiles restent disponibles dans « Questions à consolider ».', icone='✓';
    if(etatJeuSigles.mode==='parcours'){ const m=etapeSiglesMaitrisee(etatJeuSigles.etape); titre=m?`${libelleEtapeSigles(etatJeuSigles.etape)} maîtrisée`:`${libelleEtapeSigles(etatJeuSigles.etape)} terminée`; texte=m?'Tous les sigles de cette étape sont maîtrisés en autonomie.':'Tu peux rejouer l’étape ou retrouver tes questions à consolider dans la révision.'; }
    if(etatJeuSigles.celebrationEtapeADiffuser){ icone='★'; titre=`${libelleEtapeSigles(etatJeuSigles.celebrationEtapeADiffuser)} validée sans joker !`; texte='Tous les sigles de cette étape ont finalement été réussis sans joker. Bravo !'; lancerConfettis(1.35); jouerSonEtapeSansJoker(); }
    if(etatJeuSigles.mode==='evaluation'){ surtitre='Évaluation finale'; if(etatJeuSigles.evaluationReussie){ titre=etatJeuSigles.evaluationParfaite?'Mission accomplie. Même pas peur.':'Évaluation réussie !';texte=etatJeuSigles.evaluationParfaite?'30 / 30. Mission accomplie.':'Tu dépasses le seuil de 90 %. Bravo !';icone='🏆';lancerConfettis(etatJeuSigles.evaluationParfaite?3:2);jouerSonEvaluationFinale(); } else { titre='Évaluation à consolider';texte='Il faut 90 % pour réussir. Les sigles manqués rejoignent tes révisions.';icone='↻'; } }
    if(etatJeuSigles.mode==='hasard'){ titre='Défi du hasard terminé';texte=pc===100?'Tirage parfait ! Le dé était avec toi.':'Le dé a parlé. Tu peux relancer un nouveau tirage quand tu veux.'; }
    if(etatJeuSigles.mode==='revision'){ titre='Révision terminée';texte=obtenirErreursSiglesActives().length?'Il reste quelques sigles à consolider.':'Bravo : aucun sigle actif à revoir.'; }
    if(etatJeuSigles.mode==='entrainement'&&pc===100&&total>=10){ titre='Entraînement parfait !';texte='Toutes les réponses de cette session sont validées.';lancerConfettis(1);jouerSonEtapeSansJoker(); }
    if(selectionnerSigles('#siglesBilanSurtitre'))selectionnerSigles('#siglesBilanSurtitre').textContent=surtitre; if(selectionnerSigles('#siglesBilanTitre'))selectionnerSigles('#siglesBilanTitre').textContent=titre; if(selectionnerSigles('#siglesBilanTexte'))selectionnerSigles('#siglesBilanTexte').textContent=texte; if(selectionnerSigles('#siglesBilanIcone'))selectionnerSigles('#siglesBilanIcone').textContent=icone;
}

function lancerEtapeSigles(numero, { depuisDebut = false } = {}){
    const sigles = obtenirSiglesEtape(numero);
    const questionsCompletes = creerQuestionsEtapeSigles(numero);
    const questions = depuisDebut
        ? questionsCompletes
        : obtenirQuestionsRestantesEtapeSigles(numero, questionsCompletes);
    // Si tout est déjà maîtrisé, conserver une session complète permet encore
    // d'accéder au bouton « Reprendre depuis le début » depuis l'écran des
    // questions, sans modifier la progression enregistrée.
    preparerSessionMissionSiglesNative({mode:'parcours',etape:numero,sigles,questions:questions.length ? questions : questionsCompletes,jokersActifs:true,titre:`${libelleEtapeSigles(numero)} · ${ETAPES_MISSION_SIGLES[numero].titre}`});
}
function lancerEntrainementSigles(){ const perimetre=valeurGroupeSigles('#siglesChoixPerimetre','perimetre','tous'); const pool=perimetre==='tous'?[...SIGLES]:obtenirSiglesEtape(Number(perimetre)); const nombreBrut=valeurGroupeSigles('#siglesChoixNombre','nombre','10'); const nombre=nombreBrut==='tous'?pool.length:Math.min(pool.length,Number(nombreBrut)||10); const organisation=valeurGroupeSigles('#siglesChoixOrganisation','organisation','etapes'); let cibles=choisirSansDoublon(pool,nombre); if(organisation==='etapes')cibles=cibles.sort((a,b)=>Number(a.etape)-Number(b.etape)||Number(a.id)-Number(b.id)); const chrono=valeurGroupeSigles('#siglesChoixChrono','chrono','non')==='oui'; const secondes=Number(valeurGroupeSigles('#siglesChoixSecondes','secondes','30'))||30; const jokers=valeurGroupeSigles('#siglesChoixJokers','jokers','oui')==='oui'; const questions=creerQuestionsEntrainementSigles(cibles,organisation==='melange'); preparerSessionSigles({mode:'entrainement',sigles:cibles,questions,jokersActifs:jokers,titre:`Entraînement Sigles · ${nombre} sigle${nombre===1?'':'s'}`,chronoActif:chrono,secondesQuestion:secondes}); }
function lancerDeSigles(){ const face=selectionnerSigles('#siglesFaceDe'),resultat=selectionnerSigles('#siglesDeResultat'),lancer=selectionnerSigles('#siglesLancerDe'),jouer=selectionnerSigles('#siglesJouerTirage'); if(!face||!resultat||!lancer||!jouer)return; const valeur=1+Math.floor(Math.random()*6); lancer.disabled=true;jouer.classList.add('masque');face.classList.remove('de-en-lancer');void face.offsetWidth;face.classList.add('de-en-lancer');window.setTimeout(()=>{ etatJeuSigles.nombreTire=valeur;etatJeuSigles.tirageHasard=choisirSansDoublon(obtenirPoolDomaineSigles(),valeur);face.dataset.face=String(valeur);face.classList.remove('de-en-lancer');resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard parmi les ${obtenirPoolDomaineSigles().length} sigles ${libelleDomaineSigles()}.`;jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`;lancer.textContent='Relancer le dé';lancer.classList.add('principal');lancer.classList.remove('sigles-bouton-secondaire');jouer.classList.remove('masque');lancer.disabled=false;jouer.focus({preventScroll:true}); },420); }
function jouerTirageDeSigles(){ const cibles=[...etatJeuSigles.tirageHasard]; if(!cibles.length)return; preparerSessionMissionSiglesNative({mode:'hasard',sigles:cibles,questions:creerQuestionsHasardSigles(cibles),jokersActifs:true,titre:`Défi du hasard · ${cibles.length} question${cibles.length===1?'':'s'}`,chronoActif:false}); }
function lancerRevisionSigles(){
    afficherEcran('sigles-revision');
}
function lancerToutesErreursSiglesDepuisRevision(){
    const cibles = obtenirErreursSiglesActives();
    if(!cibles.length){ afficherNotification('Aucun sigle à consolider pour le moment.'); return; }
    preparerSessionMissionSiglesNative({mode:'revision', sigles:cibles, questions:creerQuestionsRevisionSigles(cibles), jokersActifs:false, titre:'Questions à consolider'});
}
function lancerRevisionEtapeSiglesDepuisRevision(numeroEtape){
    const numero = Number(numeroEtape);
    const cibles = obtenirCiblesARejouerEtapeSigles(numero);
    if(!cibles.length){ afficherNotification(`Aucune question à consolider à l’étape ${numero} de Mission Sigles.`); return; }
    preparerSessionMissionSiglesNative({mode:'revision', etape:numero, sigles:cibles, questions:creerQuestionsRevisionSigles(cibles), jokersActifs:false, titre:`Questions à consolider · ${libelleEtapeSigles(numero)}`});
}
function lancerRevisionEtapeSiglesDepuisQuestion(numeroEtape){
    lancerRevisionEtapeSiglesDepuisRevision(numeroEtape);
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
        <h2>Aucune question à consolider.</h2>
        <p>Tous les sigles qui avaient besoin d’être retravaillés sont consolidés.</p>
    </div>`;
}
function construireRevisionMissionSiglesIndependante() {
    const zone = selectionner('#contenuErreursSigles');
    if (!zone) return;
    if (!obtenirErreursSiglesActives().length) {
        zone.innerHTML = '<div class="revision-vide"><strong>Aucune question à consolider.</strong><p>Les sigles à retravailler apparaîtront ici.</p></div>';
        return;
    }
    construireEspaceRevision('sigles', zone);
}

function afficherRevisionMissionSigles(){
    construireRevisionMissionSiglesIndependante();
}

function lancerEvaluationSigles(){ if(!evaluationSiglesDebloquee()){ouvrirFenetreMessage({titre:'Évaluation encore verrouillée',message:'Maîtrise d’abord les étapes du domaine sélectionné en autonomie.',libelleConfirmer:'Compris'});return;} const questions=creerQuestionsEvaluationSigles(); const sigles=[...new Map(questions.flatMap(q=>q.cibles).map(c=>[normaliserSigleJeu(c.sigle),c])).values()]; preparerSessionMissionSiglesNative({mode:'evaluation',sigles,questions,jokersActifs:false,titre:'Évaluation finale · Expert des sigles'}); }
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
function libelleEtapeSigles(numero) {
    const e=obtenirIdentiteEtapeMissionSigles(numero);
    return `${libelleDomaineSigles(e.domaine)} · Étape ${e.numero}`;
}
function obtenirIdentiteEtapeMissionSigles(numero) {
    return ETAPES_MISSION_SIGLES[Number(numero)] || ETAPES_MISSION_SIGLES[1];
}
function obtenirThemeVisuelMissionSigles(numero) {
    return ['procedure_ordinaire','information_judiciaire','jugement_educatif_ordinaire','matiere_criminelle_peines','application_execution_peines','commun'][Math.max(0, Math.min(5, Number(numero || 1) - 1))];
}
function liensSourcesQuestionSigles(cibles) {
    const sources=[...new Map(cibles.filter(c=>c.source).map(c=>[c.source.url,c.source])).values()];
    return sources.map(source=>` <a href="${source.url}" target="_blank" rel="noopener noreferrer">Source officielle · ${echapperHtml(source.reference)}</a>`).join('');
}
function convertirQuestionMissionSiglesVersPJJoue(questionSigles, index, configuration) {
    const cible = questionSigles.cible || questionSigles.cibles?.[0] || null;
    const numeroEtape = Number(cible?.etape || configuration.etape || 1);
    // Une activité possède sa propre clé de session, même si elle porte sur
    // une notion déjà rencontrée. L'identité Analytics historique reste distincte.
    const identifiantHistorique = 900000 + (Number(cible?.id || 0) * 20) + (index % 20);
    const identifiant = 900000000 + index;
    const base = {
        id: identifiant,
        identifiantHistorique,
        theme: obtenirThemeVisuelMissionSigles(numeroEtape),
        etape: numeroEtape,
        chapitre: 1,
        ordreEtape: index + 1,
        enonce: questionSigles.consigne,
        explication: (questionSigles.explication || '') + liensSourcesQuestionSigles(questionSigles.cibles || []),
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
function preparerSessionMissionSiglesNative({ questionsDejaConverties = false, mode, etape = null, sigles, questions, jokersActifs = true, titre, chronoActif = false, secondesQuestion = 30 }) {
    const configuration = { domaine:obtenirDomaineSigles(), mode, etape, sigles:[...sigles], jokersActifs, titre, chronoActif, secondesQuestion };
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
    const questionsPJJoue = questionsDejaConverties ? questions
        : questions.map((question, index) => convertirQuestionMissionSiglesVersPJJoue(question, index, configuration));
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
        enregistrerErreurSigles(cibles, resultat.reussiteAidee ? 'joker' : 'incorrecte');
    if (resultat.reussiteAutonome && resultat.tentatives > 0)
        enregistrerErreurSigles(cibles, 'reprise');
    else if (!meta.estIntroduction && resultat.reussiteAutonome)
        validerRevisionSigles(cibles);
    enregistrerSauvegarde();
}
function enregistrerPassageMissionSiglesNatif(question) {
    if (!question?.missionSigles) return;
    enregistrerErreurSigles(obtenirCiblesMissionQuestion(question), 'passage');
    enregistrerSauvegarde();
}
function reinitialiserMaitriseEtapeMissionSigles(numeroEtape) {
    const etape = obtenirEtatEtapeSigles(numeroEtape);
    etape.autonomes = {};
    etape.validationsSansJoker = {};
    etape.celebrationAffichee = false;
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
                titre: `${libelleEtapeSigles(numero)} terminée sans joker !`,
                message: 'Tous les sigles de cette étape ont finalement été réussis sans joker.',
                confetti: true
            };
        }
        titre = `${libelleEtapeSigles(numero)} · ${obtenirIdentiteEtapeMissionSigles(numero).titre}`;
    }
    if (mode === 'evaluation') {
        obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).meilleurScore = Math.max(Number(obtenirEvaluationSigles().meilleurScore || 0), pourcentage);
        obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).nombreTentatives = Number(obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).nombreTentatives || 0) + 1;
        const reussie = pourcentage >= SEUIL_EVALUATION_SIGLES && passees === 0;
        obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).reussie = Boolean(obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).reussie) || reussie;
        titre = 'Évaluation finale · Expert des sigles';
        resultat = reussie
            ? `Résultat : ${pourcentage} %. Mission Sigles est validée.`
            : `Résultat : ${pourcentage} %. Le seuil attendu est de ${SEUIL_EVALUATION_SIGLES} %.`;
        if (reussie) {
            celebration = pourcentage === 100
                ? { titre:'Mission accomplie. Même pas peur.', message:'30 / 30. Mission accomplie.', confetti:true, finale:true }
                : { titre:'Évaluation Mission Sigles réussie !', message:`Tu as obtenu ${pourcentage} %.`, confetti:true };
        }
    }
    if (mode === 'hasard') {
        titre = 'Défi du hasard · Mission Sigles';
        resultat = pourcentage === 100 ? 'Tirage parfait !' : `Résultat : ${pourcentage} %.`;
    }
    if (mode === 'revision') {
        titre = 'Questions à consolider · Mission Sigles';
        resultat = obtenirErreursSiglesActives().length
            ? `${obtenirErreursSiglesActives().length} sigle(s) restent à consolider.`
            : 'Aucun sigle actif à revoir.';
        if (etatJeuSigles.celebrationEtapeADiffuser) {
            const numero = Number(etatJeuSigles.celebrationEtapeADiffuser);
            celebration = {
                titre: `Étape ${String(numero).padStart(2, '0')} maîtrisée !`,
                message: 'Les questions rejouées ont été réussies sans joker : la progression de l’étape est à jour.',
                confetti: true
            };
        }
    }
    if (mode !== 'evaluation') celebration = collecterCelebrationMission('sigles');
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent = `${pourcentage}%`;
    selectionner('#bonnesReponsesBilan').textContent = `${etat.score}/${total}`;
    selectionner('#meilleureSerieBilan').textContent = etat.meilleureSerie;
    selectionner('#contexteBilan').textContent = `Mission Sigles · ${titre}`;
    selectionner('#titreBilan').textContent = titre;
    selectionner('#rangBilan').textContent = resultat;
    afficherErreursBilan(obtenirQuestionsAConsoliderSession(), passees);
    const continuer = selectionner('#boutonContinuer');
    continuer.textContent = 'Retour à Mission Sigles →';
    continuer.onclick = () => { etat.missionSiglesConfiguration = null; afficherEcran('sigles', { remplacerHistorique:true }); };
    const destination = selectionner('#prochaineDestinationBilan');
    if (destination) destination.textContent = mode === 'parcours' ? 'Continue Mission Sigles ou rejoue les sigles à consolider.' : 'Choisis une nouvelle session dans Mission Sigles.';
    selectionner('#carteVoyageFinale')?.classList.add('masque');
    terminerSauvegardeSession();
    afficherEcran('bilan', { remplacerHistorique:true });
    actualiserAccueilSigles();
    lancerCelebrationBilan(celebration);
}
function obtenirPoolEntrainementMissionSigles(perimetre) {
    return ['cjpm','pjj','tous'].includes(String(perimetre)) ? obtenirPoolDomaineSigles(String(perimetre)) : obtenirSiglesEtape(Number(perimetre));
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
    entete?.querySelector('p') && (entete.querySelector('p').textContent = 'Entraîne-toi sur les sigles avec exactement les mêmes réglages que dans Quiz CJPM.');
    const resultatDe = selectionner('#resultatDeParcours');
    if (resultatDe) resultatDe.textContent = `Lance le dé pour tirer de 1 à 6 questions aléatoires parmi les ${obtenirPoolDomaineSigles().length} sigles ${libelleDomaineSigles()}.`;
    const selectPerimetre = selectionner('#perimetreEntrainement');
    const groupePerimetre = document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    if (selectPerimetre && groupePerimetre) {
        const options=[...['cjpm','pjj','tous'].map(d=>({valeur:d,titre:d==='tous'?'Tous les sigles':`Sigles ${libelleDomaineSigles(d)}`,detail:`${obtenirPoolDomaineSigles(d).length} sigles`,couleur:d==='cjpm'?'#d49a00':'#4f8cff',couleurTexte:d==='cjpm'?'#ffd36a':'#9fc2ff',couleurRgb:d==='cjpm'?'212,154,0':'79,140,255'})),
            ...numerosEtapesSigles('tous').map(n=>({...ETAPES_MISSION_SIGLES[n],valeur:String(n),titre:`${libelleDomaineSigles(ETAPES_MISSION_SIGLES[n].domaine)} ${ETAPES_MISSION_SIGLES[n].numero} · ${ETAPES_MISSION_SIGLES[n].titre}`,detail:`${obtenirSiglesEtape(n).length} sigles`}))];
        selectPerimetre.innerHTML=options.map(o=>`<option value="${o.valeur}">${o.titre}</option>`).join('');
        groupePerimetre.innerHTML=options.map(o=>`<button class="choix-bouton" data-valeur="${o.valeur}" type="button" style="--parcours-accent:${o.couleur};--parcours-accent-lisible:${o.couleurTexte};--parcours-accent-rgb:${o.couleurRgb}"><b>${o.titre}</b><span>${o.detail}</span></button>`).join('');
        selectPerimetre.value=obtenirDomaineSigles();
        groupePerimetre.dataset.selectionEffectuee='true';
        initialiserGroupesChoix();
    }
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const groupeNombre = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (selectNombre && groupeNombre) {
        selectNombre.innerHTML = Array.from({length:SIGLES.length},(_,i)=>i+1).map(n=>`<option value="${n}">${n}</option>`).join('');
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
                const perimetre=selectPerimetre.value;
                obtenirSauvegardeJeuSigles().domaine=['cjpm','pjj','tous'].includes(perimetre)?perimetre:ETAPES_MISSION_SIGLES[Number(perimetre)].domaine;
                etatJeuSigles.tirageHasard=[];
                selectionner('#boutonJouerLeTirage')?.classList.add('masque');
                resultatDe.textContent=`Lance le dé dans ce périmètre de ${obtenirPoolEntrainementMissionSigles(perimetre).length} sigles.`;
                enregistrerSauvegarde();
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
        ['tous','Tout Quiz CJPM','Les 6 parcours'],
        ['procedure_ordinaire','01 · De l’enquête à la sanction',''],
        ['information_judiciaire','02 · Information judiciaire','Avant le jugement'],
        ['jugement_educatif_ordinaire','03 · Du jugement à la sanction','Réponse éducative'],
        ['matiere_criminelle_peines','04 · De la qualification criminelle aux peines','Matière criminelle'],
        ['application_execution_peines','05 · Après la sanction','Application et exécution'],
        ['commun','Option · Parcours 06 · Découvrir la PJJ','Culture commune PJJ']
    ];
    if (selectPerimetre && groupePerimetre) {
        selectPerimetre.innerHTML = donnees.map(([v,b])=>`<option value="${v}">${b.replace(/^\d+ · /,'')}</option>`).join('');
        groupePerimetre.innerHTML = donnees.map(([v,b,sp],index)=>`<button class="choix-bouton${index===0?' actif entrainement-perimetre-global':''}" data-valeur="${v}" type="button"><b>${b}</b>${sp ? `<span>${sp}</span>` : ''}</button>`).join('');
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
    const pool=obtenirPoolEntrainementMissionSigles(selectionner('#perimetreEntrainement').value);
    const valeur=1+Math.floor(Math.random()*Math.min(6,pool.length));
    lancer.disabled=true; jouer.classList.add('masque'); face.classList.remove('de-en-lancer'); void face.offsetWidth; face.classList.add('de-en-lancer');
    window.setTimeout(()=>{
        etat.nombreQuestionsTirageDe=valeur;
        etatJeuSigles.nombreTire=valeur;
        etatJeuSigles.tirageHasard=choisirSansDoublon(pool,valeur);
        face.dataset.face=String(valeur); face.classList.remove('de-en-lancer');
        resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard parmi les ${pool.length} sigles du périmètre choisi.`;
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
    selectionnerSigles('#siglesOuvrirParcours')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Ouvrir le parcours des étapes');actualiserAccueilSigles();afficherVueSigles('parcours');});
    selectionnerSigles('#siglesOuvrirEntrainement')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Configurer un entraînement');actualiserAccueilSigles();ouvrirEntrainementMissionSiglesNatif();});
    selectionnerSigles('#siglesRetourDepuisParcours')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesRetourDepuisEntrainement')?.addEventListener('click',retourAccueilSigles);
    selectionnerSigles('#siglesLancerEntrainement')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Lancer un entraînement');lancerEntrainementSigles();}); selectionnerSigles('#siglesLancerDe')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Défi du hasard · lancer le dé');lancerDeSigles();}); selectionnerSigles('#siglesJouerTirage')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Défi du hasard · jouer le tirage');jouerTirageDeSigles();}); selectionnerSigles('#siglesLancerRevision')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Réviser les erreurs');lancerRevisionSigles();}); selectionnerSigles('#siglesLancerEvaluation')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Évaluation finale');lancerEvaluationSigles();});
    selectionnerSigles('#siglesQuitterSession')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesPasserQuestion')?.addEventListener('click',passerQuestionSigles); selectionnerSigles('#siglesValiderActivite')?.addEventListener('click',validerAssociationSigles); selectionnerSigles('#siglesQuestionSuivante')?.addEventListener('click',questionSuivanteSigles); selectionnerSigles('#siglesRetourAccueil')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesRejouerSession')?.addEventListener('click',rejouerDerniereSessionSigles);
    selectionnerTousSigles('#siglesChoixNombre button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixNombre'),b);envoyerOptionDeJeuAnalytics(`Nombre de questions : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixOrganisation button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixOrganisation'),b);envoyerOptionDeJeuAnalytics(`Organisation : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixChrono button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixChrono'),b);actualiserChoixChronoSigles();envoyerOptionDeJeuAnalytics(`Chronomètre : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixSecondes button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixSecondes'),b);envoyerOptionDeJeuAnalytics(`Durée par question : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixJokers button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixJokers'),b);envoyerOptionDeJeuAnalytics(`Jokers : ${b.textContent.trim()}`);})); selectionnerTousSigles('[data-joker-sigles]').forEach(b=>b.addEventListener('click',()=>utiliserJokerSigles(b.dataset.jokerSigles)));
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
function obtenirReperesNonMaitrisesEtapeMesures(numero) {
    const etape = obtenirEtatEtapeMesures(numero);
    return obtenirReperesMesuresEtape(numero).filter(cible =>
        repereMesureEstIntroduit(cible.cle)
        && etape.autonomes[normaliserCleMesure(cible.cle)] !== true
    );
}
function obtenirCiblesARejouerEtapeMesures(numero) {
    const cibles = [...obtenirErreursMesuresActives().filter(cible => Number(cible.etape) === Number(numero)), ...obtenirReperesNonMaitrisesEtapeMesures(numero)];
    return [...new Map(cibles.map(cible => [normaliserCleMesure(cible.cle), cible])).values()];
}
function enregistrerErreurMesures(cibles, motifRevision = 'incorrecte') {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserCleMesure(cible.cle);
        const actuelle = erreurs[cle] || { active:false, nombreErreurs:0, reussitesRevision:0 };
        erreurs[cle] = { ...actuelle, active:true, motifRevision, nombreErreurs:Number(actuelle.nombreErreurs || 0) + (motifRevision === 'incorrecte' ? 1 : 0), reussitesRevision:motifRevision === 'reprise' ? 1 : 0 };
    });
}
function validerRevisionMesures(cibles) {
    const erreurs = obtenirSauvegardeJeuMesures().erreurs;
    cibles.forEach(cible => {
        const actuelle = erreurs[normaliserCleMesure(cible.cle)];
        if (!actuelle?.active) return;
        actuelle.reussitesRevision = 1;
        actuelle.active = false;
        actuelle.motifRevision = null;
    });
}

function obtenirIdentiteEtapeMissionMesures(numero) { return ETAPES_MISSION_MESURES[Number(numero)] || ETAPES_MISSION_MESURES[1]; }
function obtenirThemeVisuelMissionMesures(numero) {
    const themes = ['procedure_ordinaire','information_judiciaire','jugement_educatif_ordinaire','matiere_criminelle_peines','application_execution_peines','commun'];
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

function questionMesuresAReprendre(question) {
    const cibles = question?.cibles || [];
    return cibles.some(cible => {
        const etape = obtenirEtatEtapeMesures(Number(cible.etape));
        const cle = normaliserCleMesure(cible.cle);
        // Une introduction déjà découverte n'est pas répétée par défaut.
        // Les rappels et réponses écrites restent proposés tant que le repère
        // n'est pas maîtrisé en autonomie, sans joker.
        return question.estIntroduction
            ? !repereMesureEstIntroduit(cle)
            : etape.autonomes[cle] !== true;
    });
}

function obtenirQuestionsRestantesEtapeMesures(questions) {
    return questions.filter(questionMesuresAReprendre);
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
        const erreurs = obtenirCiblesARejouerEtapeMesures(numero).length;
        const etoile = total > 0 && sansJoker === total ? creerEtoileFilanteProgression() : '';
        const revision = `<button class="mesures-etape-revision" data-action="reviser-etape-mesures" data-etape="${numero}" type="button"${erreurs ? '' : ' disabled'}>${erreurs ? '↻ Consolider mes réponses' : 'Aucune question à consolider'}${erreurs ? ` <strong>${erreurs}</strong>` : ''}</button>`;
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
    // Une activité possède sa propre clé de session, même si elle porte sur
    // une notion déjà rencontrée. L'identité Analytics historique reste distincte.
    const identifiantHistorique = 920000 + (Number(cible?.id || numeroEtape * 100) * 20) + (index % 20);
    const identifiant = 920000000 + index;
    const source = questionMesures.source || cible?.source || '';
    const base = {
        id: identifiant,
        identifiantHistorique,
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
function preparerSessionMissionMesuresNative({ questionsDejaConverties = false, mode, etape=null, reperes, questions, jokersActifs=true, titre, chronoActif=false, secondesQuestion=30, organisation='ordonne' }) {
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
    lancerSession(questionsDejaConverties ? questions
        : questions.map((question,index) => convertirQuestionMissionMesuresVersPJJoue(question,index,configuration)));
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
                etatJeuMesures.celebrationEtapeADiffuser = numero;
            }
        });
    }
    if (!resultat.estCorrecte || resultat.reussiteAidee) enregistrerErreurMesures(cibles, resultat.reussiteAidee ? 'joker' : 'incorrecte');
    if (resultat.reussiteAutonome && resultat.tentatives > 0) enregistrerErreurMesures(cibles, 'reprise');
    else if (!meta.estIntroduction && resultat.reussiteAutonome) validerRevisionMesures(cibles);
    enregistrerSauvegarde();
}
function enregistrerPassageMissionMesuresNatif(question) {
    if (!question?.missionMesures) return;
    enregistrerErreurMesures(obtenirCiblesMissionMesuresQuestion(question), 'passage');
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

function lancerEtapeMesures(numero, { depuisDebut = false } = {}) {
    const reperes = obtenirReperesMesuresEtape(numero);
    const identite = obtenirIdentiteEtapeMissionMesures(numero);
    const questionsCompletes = creerQuestionsEtapeMesures(numero);
    const questions = depuisDebut
        ? questionsCompletes
        : obtenirQuestionsRestantesEtapeMesures(questionsCompletes);
    // Une étape entièrement maîtrisée reste rejouable depuis l'écran des
    // questions, sans effacer les validations conservées.
    preparerSessionMissionMesuresNative({ mode:'parcours', etape:numero, reperes, questions:questions.length ? questions : questionsCompletes, jokersActifs:true, titre:`Étape ${identite.numeroFormate} · ${identite.titre}` });
}
function lancerRevisionMesures() {
    const reperes = obtenirErreursMesuresActives();
    if (!reperes.length) {
        ouvrirFenetreMessage({ titre:'Aucune question à consolider', message:'Aucun repère de Mission Mesures n’est actuellement à revoir.', libelleConfirmer:'Très bien' });
        return;
    }
    preparerSessionMissionMesuresNative({ mode:'revision', reperes, questions:creerQuestionsRevisionMesures(reperes), jokersActifs:false, titre:'Questions à consolider · Mission Mesures' });
}
function lancerRevisionEtapeMesuresDepuisRevision(numeroEtape) {
    const numero = Number(numeroEtape);
    const reperes = obtenirCiblesARejouerEtapeMesures(numero);
    if (!reperes.length) {
        afficherNotification(`Aucune question à consolider à l’étape ${String(numero).padStart(2, '0')} de Mission Mesures.`);
        return;
    }
    const identite = obtenirIdentiteEtapeMissionMesures(numero);
    preparerSessionMissionMesuresNative({ mode:'revision', etape:numero, reperes, questions:creerQuestionsRevisionMesures(reperes), jokersActifs:false, titre:`Questions à consolider · Étape ${identite.numeroFormate}` });
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
    entete?.querySelector('p') && (entete.querySelector('p').textContent='Entraîne-toi sur les mesures et leurs modules avec les mêmes réglages que Quiz CJPM.');
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
    if(!erreurs.length){zone.innerHTML='<div class="revision-vide"><strong>Aucune question à consolider.</strong><p>Les repères manqués apparaîtront ici pour être retravaillés.</p></div>';return;}
    construireEspaceRevision('mesures', zone);
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
        titre='Questions à consolider · Mission Mesures';
        resultat=obtenirErreursMesuresActives().length?`${obtenirErreursMesuresActives().length} repère(s) restent à consolider.`:'Aucun repère actif à revoir.';
        if(etatJeuMesures.celebrationEtapeADiffuser){
            const numero=Number(etatJeuMesures.celebrationEtapeADiffuser), identite=obtenirIdentiteEtapeMissionMesures(numero);
            celebration={titre:`Étape ${identite.numeroFormate} maîtrisée !`,message:'Les questions rejouées ont été réussies sans joker : la progression de l’étape est à jour.',confetti:true};
        }
    }
    if(mode==='hasard'){titre='Défi du hasard · Mission Mesures';resultat=pourcentage===100?'Tirage parfait !':`Résultat : ${pourcentage} %.`;}
    if (mode !== 'evaluation') celebration = collecterCelebrationMission('mesures');
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent=`${pourcentage}%`; selectionner('#bonnesReponsesBilan').textContent=`${etat.score}/${total}`; selectionner('#meilleureSerieBilan').textContent=etat.meilleureSerie; selectionner('#contexteBilan').textContent=`Mission Mesures · ${titre}`; selectionner('#titreBilan').textContent=titre; selectionner('#rangBilan').textContent=resultat;
    afficherErreursBilan(obtenirQuestionsAConsoliderSession(),passees);
    const continuer=selectionner('#boutonContinuer'); continuer.textContent='Retour à Mission Mesures →'; continuer.onclick=()=>{etat.missionMesuresConfiguration=null;afficherEcran('mesures',{remplacerHistorique:true});};
    selectionner('#prochaineDestinationBilan') && (selectionner('#prochaineDestinationBilan').textContent='Continue Mission Mesures ou retravaille les repères à consolider.');
    selectionner('#carteVoyageFinale')?.classList.add('masque'); terminerSauvegardeSession(); afficherEcran('bilan',{remplacerHistorique:true}); actualiserAccueilMesures(); lancerCelebrationBilan(celebration);
}

function initialiserJeuMesures() {
    const racine=selectionnerMesures('#mesures'); if(!racine||racine.dataset.initialise==='true')return; racine.dataset.initialise='true';
    selectionnerMesures('#mesuresOuvrirParcours')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Ouvrir le parcours des étapes');actualiserAccueilMesures();selectionnerMesures('#mesuresAccueil')?.classList.add('masque');selectionnerMesures('#mesuresParcoursVue')?.classList.remove('masque');window.scrollTo?.({top:0,behavior:'smooth'});});
    selectionnerMesures('#mesuresRetourDepuisParcours')?.addEventListener('click',()=>{selectionnerMesures('#mesuresParcoursVue')?.classList.add('masque');selectionnerMesures('#mesuresAccueil')?.classList.remove('masque');actualiserAccueilMesures();});
    selectionnerMesures('#mesuresOuvrirEntrainement')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Configurer un entraînement');ouvrirEntrainementMissionMesuresNatif();});
    selectionnerMesures('#mesuresLancerDe')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Défi du hasard · lancer le dé');lancerDeMesures();});
    selectionnerMesures('#mesuresJouerTirage')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Défi du hasard · jouer le tirage');jouerTirageDeMesures();});
    selectionnerMesures('#mesuresLancerRevision')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Réviser les erreurs');afficherEcran('mesures-revision');});
    selectionnerMesures('#mesuresLancerEvaluation')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Évaluation finale');lancerEvaluationMesures();});
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
            <div><span class="progression-parcours-mis-en-avant-chapitre">${identite.libelleNumero || identite.chapitre}</span><h3>${identite.titre}</h3></div>
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
    const ouvrir = document.createElement('button');
    ouvrir.type = 'button';
    ouvrir.className = 'principal progression-ouvrir-selection';
    ouvrir.textContent = 'Ouvrir ce parcours →';
    ouvrir.setAttribute('aria-label', `Ouvrir le parcours ${identite.titre}`);
    ouvrir.onclick = () => ouvrirParcours(theme.id);
    carte.appendChild(ouvrir);
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
    const parcoursCJPM = avancees.filter(({ theme }) => !obtenirIdentiteParcours(theme.id).optionnel);
    const cjpmValides = parcoursCJPM.filter(({ avancee }) => avancee.estComplet).length;
    const parcoursComplet = estParcoursCompletReussi();
    const carte = document.createElement('div');
    carte.className = 'progression-global';
    carte.innerHTML = `
        <div class="progression-score">
            <strong>${progression}<span>%</span></strong>
            <span>des objectifs validés</span>
        </div>
        <div class="progression-global-corps">
            <p><strong>${cjpmValides}/${parcoursCJPM.length} parcours CJPM validés${cjpmValides === parcoursCJPM.length ? " · CJPM terminé ✓" : ""}</strong></p>
            <div class="progression-global-entete">
                <div><strong>${jalonsValides}/${totalJalons} ${libelleObjectifs}</strong><span>${totalEtapes} étapes · ${totalEvaluations} évaluations</span></div>
            </div>
        </div>
        <div class="progression-rail" role="progressbar" aria-label="Progression globale" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progression}" aria-valuetext="${jalonsValides} ${libelleObjectifs} sur ${totalJalons} : ${totalEtapes} étapes et ${totalEvaluations} évaluations">
            <span class="progression-rail-remplissage" style="width:${progression}%"></span>
            <div class="progression-jalons">${jalons}</div>
        </div>
        <p class="progression-global-note">${parcoursComplet ? 'Parcours complet validé ✓ · Les cinq parcours CJPM et l’option Découvrir la PJJ sont validés.' : 'Le total inclut l’option Découvrir la PJJ, indépendante de la validation des cinq parcours CJPM.'}</p>`;
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
    lienTelechargement.download = 'Quiz_CJPM_progression.json';
    lienTelechargement.click();
    URL.revokeObjectURL(lienTelechargement.href);
    envoyerEvenementPJJ('progression_exportee', {
        pjjoue_page_consultee: 'Progression'
    });
}
const CLE_SAUVEGARDE_AVANT_IMPORT = 'pjjoue_v1_sauvegarde_avant_import';
function validerFichierProgression(importee) {
    if (!estObjetSimple(importee) || importee.version !== 'V1'
        || !estObjetSimple(importee.progression?.apprenant) || !estObjetSimple(importee.erreurs))
        throw Error('Ce fichier n’est pas une sauvegarde Quiz CJPM V1. Ta progression est conservée.');
    return nettoyerSauvegarde(importee);
}
function appliquerProgressionImportee(progression) {
    const ancienne = JSON.stringify(sauvegarde);
    // Écrire avant de remplacer l'état en mémoire : une panne de stockage
    // laisse la progression courante intacte et n'annonce jamais un faux succès.
    localStorage.setItem(CLE_SAUVEGARDE_AVANT_IMPORT, ancienne);
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(progression));
    sauvegarde = progression;
    effacerSessionEnCours();
    etat.questionsSession = [];
    etat.questionCourante = null;
    etat.mode = null;
    chargerParametres();
    actualiserAccueil();
    envoyerEvenementPJJ('progression_importee', { pjjoue_page_consultee: 'Progression' });
    afficherNotification('Progression importée et vérifiée');
    actualiserRestaurationAvantImport();
}
function actualiserRestaurationAvantImport() {
    const bouton = selectionner('#boutonAnnulerDernierImport');
    if (!bouton) return;
    try { bouton.hidden = !localStorage.getItem(CLE_SAUVEGARDE_AVANT_IMPORT); }
    catch (erreur) { bouton.hidden = true; }
}
function annulerDernierImport() {
    try {
        const contenu = localStorage.getItem(CLE_SAUVEGARDE_AVANT_IMPORT);
        if (!contenu) return;
        const ancienne = validerFichierProgression(JSON.parse(contenu));
        localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(ancienne));
        sauvegarde = ancienne;
        effacerSessionEnCours();
        etat.questionsSession = [];
        etat.questionCourante = null;
        etat.mode = null;
        localStorage.removeItem(CLE_SAUVEGARDE_AVANT_IMPORT);
        chargerParametres();
        actualiserAccueil();
        actualiserRestaurationAvantImport();
        afficherNotification('Progression précédant l’import restaurée');
    } catch (erreur) {
        ouvrirFenetreMessage({ titre: 'Restauration impossible', message: erreur.message, libelleConfirmer: 'Fermer' });
    }
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
            const progression = validerFichierProgression(importee);
            const nombre = Number(progression.nombreQuestionsJouees || 0);
            ouvrirFenetreMessage({
                titre: 'Importer cette progression ?',
                message: `Cette sauvegarde contient ${nombre} question${nombre === 1 ? '' : 's'} jouée${nombre === 1 ? '' : 's'}. Elle remplacera la progression de cet appareil. Tu pourras annuler cet import.`,
                libelleConfirmer: 'Importer', libelleAnnuler: 'Annuler', afficherAnnuler: true,
                apresConfirmation: () => {
                    try { appliquerProgressionImportee(progression); }
                    catch (erreur) { ouvrirFenetreMessage({ titre: 'Import impossible', message: 'Le stockage est indisponible. Ta progression actuelle est conservée.', libelleConfirmer: 'Fermer' }); }
                }
            });
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
selectionner('#boutonReprendreEtapeDepuisDebut')?.addEventListener('click', reprendreEtapeDepuisDebutQuestion);
selectionner('#boutonReprendreProgressionBilan')?.addEventListener('click', reprendreProgressionApresRevision);
selectionner('#boutonRejouerMesErreurs').onclick = rejouerQuestionsAConsoliderBilan;
selectionner('#boutonRevenirAuParcours').onclick = revenirAuParcoursDuBilan;
selectionner('#boutonOuvrirParcours').onclick = () => ouvrirChoixParcours();
selectionner('#boutonExporterMaProgression').onclick = exporterProgression;
selectionner('#boutonAnnulerDernierImport')?.addEventListener('click', annulerDernierImport);
actualiserRestaurationAvantImport();
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
    message: 'Les scores, les étapes validées et les questions à consolider enregistrées seront définitivement supprimés de ce navigateur.',
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
        effacerSauvegardeDeSecours();
        try { localStorage.removeItem(CLE_SAUVEGARDE_AVANT_IMPORT); } catch (erreur) { /* Stockage indisponible. */ }
        actualiserRestaurationAvantImport();
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
    else if (action === 'reviser-categorie')
        lancerRevisionCategorie(cible.dataset.jeuRevision, cible.dataset.categorieRevision);
    else if (action === 'reviser-toutes-erreurs')
        lancerRevision('toutes');
    else if (action === 'reviser-theme')
        lancerRevision(cible.dataset.theme);
    else if (action === 'reviser-etape')
        lancerRevisionEtape(cible.dataset.theme || IDENTIFIANT_PARCOURS_RECOMMANDE, cible.dataset.etape);
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

/*
 * Aides courtes affichées au survol des actions qui demandent un peu de contexte.
 * Les boutons dont le libellé suffit à comprendre l'action ne reçoivent volontairement
 * pas d'infobulle : l'interface reste légère et les aides restent utiles.
 */
const TITRES_BOUTONS_SURVOL = Object.freeze({
    boutonInstallerPJJoue: 'Installer Quiz CJPM comme application sur cet appareil.',
    boutonChangerParcours: 'Revenir à la liste pour choisir un autre parcours.',
    boutonActionParcours: 'Commencer ou reprendre l’étape actuellement proposée.',
    boutonParcoursLibre: 'Jouer cette étape sans limite de temps.',
    boutonParcoursChronometre: 'Jouer cette étape avec une limite de temps par question.',
    boutonParcours15Secondes: 'Limiter chaque réponse à 15 secondes.',
    boutonParcours20Secondes: 'Limiter chaque réponse à 20 secondes.',
    boutonParcours25Secondes: 'Limiter chaque réponse à 25 secondes.',
    boutonParcours30Secondes: 'Limiter chaque réponse à 30 secondes.',
    boutonLancerLeDe: 'Tirer au hasard un défi parmi les parcours.',
    boutonJouerLeTirage: 'Démarrer le défi tiré par le dé.',
    boutonRejouerErreursEtape: 'Rejouer les questions à consolider : réponses rejouées, passées ou aidées et notions non maîtrisées. Les maîtrises sans joker sont conservées.',
    boutonReprendreEtapeDepuisDebut: 'Recommencer l’étape à la première question : les questions déjà maîtrisées restent validées tant qu’elles ne sont pas réinitialisées.',
    boutonReprendreProgressionBilan: 'Revenir à la question laissée dans le parcours, avec les réponses et le brouillon conservés.',
    boutonReinitialiserValidationsSansJoker: 'Réinitialiser les validations sans joker de cette étape. Les questions travaillées, les questions à consolider et la progression générale restent conservées.',
    boutonJokers: 'Ouvrir les aides disponibles pour cette question.',
    boutonPasser: 'Passer cette question : elle restera à consolider et ne sera pas validée.',
    boutonRejouerMesErreurs: 'Refaire directement les questions ratées, passées ou à consolider de cette session.',
    boutonRevenirAuParcours: 'Retourner à la carte du parcours.',
    boutonRefermerSupports: 'Fermer toutes les fiches de support ouvertes.',
    boutonOuvrirParcours: 'Choisir un parcours pour consulter sa progression détaillée.',
    boutonExporterMaProgression: 'Télécharger une copie de ta progression pour la conserver ou la transférer.',
    boutonImporterProgression: 'Charger une progression précédemment exportée.',
    boutonEnregistrerEtRevenir: 'Enregistrer les réglages et revenir à l’accueil.',
    boutonReinitialiserTouteLaProgression: 'Effacer toute la progression enregistrée sur cet appareil.',
    boutonJoker5050: 'Retirer deux réponses incorrectes pour faciliter le choix.',
    boutonJokerIndice: 'Afficher un indice pédagogique sans valider la réponse.',
    boutonJokerLangueAuChat: 'Obtenir une explication reformulée comme un conseil.',
    siglesOuvrirParcours: 'Ouvrir la carte des étapes de Mission Sigles.',
    siglesOuvrirEntrainement: 'Choisir les sigles, le nombre de questions et les aides.',
    siglesLancerDe: 'Tirer au hasard une étape et un nombre de sigles.',
    siglesJouerTirage: 'Démarrer le défi tiré par le dé.',
    siglesLancerRevision: 'Rejouer uniquement les sigles à consolider.',
    siglesRetourDepuisParcours: 'Revenir à l’accueil de Mission Sigles.',
    siglesLancerEvaluation: 'Passer l’évaluation finale après la maîtrise autonome des étapes.',
    mesuresOuvrirParcours: 'Ouvrir la carte des étapes de Mission Mesures.',
    mesuresOuvrirEntrainement: 'Choisir les mesures, le nombre de questions et les aides.',
    mesuresLancerDe: 'Tirer au hasard une étape et un nombre de repères.',
    mesuresJouerTirage: 'Démarrer le défi tiré par le dé.',
    mesuresLancerRevision: 'Rejouer uniquement les repères à consolider.',
    mesuresRetourDepuisParcours: 'Revenir à l’accueil de Mission Mesures.',
    mesuresLancerEvaluation: 'Passer l’évaluation finale après la maîtrise autonome des étapes.',
    carteEvaluationFinale: 'Évaluation finale verrouillée jusqu’à la maîtrise de toutes les étapes.'
});

const TITRES_ACTIONS_SURVOL = Object.freeze({
    'rejouer-erreurs-etape': 'Rejouer les questions à consolider : réponses rejouées, passées ou aidées et notions non maîtrisées. Les maîtrises sans joker sont conservées.',
    'reviser-categorie': 'Rejouer uniquement les questions de cette catégorie. Les acquis restent validés.',
    'reviser-theme': 'Ouvrir les questions à consolider de ce parcours.',
    'reviser-etape': 'Rejouer les questions à consolider de cette étape.',
    'reviser-toutes-erreurs': 'Rejouer toutes les questions encore à revoir.',
    'ouvrir-parcours-depuis-erreurs': 'Choisir une étape du parcours pour la réviser.',
    'reviser-etape-sigles': 'Rejouer les sigles à consolider dans cette étape.',
    'reviser-toutes-erreurs-sigles': 'Rejouer tous les sigles à consolider.',
    'ouvrir-mission-sigles-depuis-erreurs': 'Choisir une étape de Mission Sigles pour la réviser.',
    'reviser-etape-mesures': 'Rejouer les repères à consolider dans cette étape.',
    'reviser-toutes-erreurs-mesures': 'Rejouer tous les repères à consolider.',
    'ouvrir-mission-mesures-depuis-erreurs': 'Choisir une étape de Mission Mesures pour la réviser.'
});

function obtenirTitreSurvolBouton(bouton) {
    if (bouton.id === 'boutonReprendreEtapeDepuisDebut' && etat.progressionAvantRevision)
        return 'Revenir à la question laissée dans le parcours, avec les réponses et le brouillon conservés.';
    if (TITRES_BOUTONS_SURVOL[bouton.id])
        return TITRES_BOUTONS_SURVOL[bouton.id];

    const action = bouton.dataset.action;
    if (action && TITRES_ACTIONS_SURVOL[action])
        return TITRES_ACTIONS_SURVOL[action];

    if (bouton.matches('.selecteur-parcours-bouton'))
        return 'Ouvrir ce parcours et consulter ses étapes.';
    if (bouton.matches('.progression-pastille'))
        return 'Afficher la progression détaillée de ce parcours.';
    if (bouton.matches('.carte-voyage-etape'))
        return 'Retrouver cette étape dans son parcours.';
    if (bouton.matches('.sigles-etape-ouvrir, .mesures-etape-ouvrir'))
        return 'Ouvrir cette étape et reprendre sa progression.';
    if (bouton.matches('.sigles-etape-revision'))
        return 'Rejouer uniquement les sigles à consolider dans cette étape.';
    if (bouton.matches('.mesures-etape-revision'))
        return 'Rejouer uniquement les repères à consolider dans cette étape.';
    if (bouton.matches('.revision-parcours-bouton'))
        return 'Ouvrir les questions à consolider de ce parcours.';
    if (bouton.matches('.revision-etape-bouton'))
        return 'Rejouer les questions à consolider de cette étape.';

    const groupe = bouton.closest('[data-proposition]');
    if (groupe?.dataset.proposition === 'jokers')
        return 'Choisir si les aides sont disponibles pendant la session.';
    if (groupe?.dataset.proposition === 'chronometre')
        return 'Choisir si une limite de temps s’applique à chaque question.';
    if (bouton.closest('.entrainement-secondes-groupe, #secondesChronometreParcours, #siglesChoixSecondes, #mesuresChoixSecondes'))
        return `Limiter chaque réponse à ${bouton.textContent.trim()}.`;
    if (bouton.closest('.entrainement-perimetre-choix, #siglesChoixPerimetre, #mesuresChoixPerimetre'))
        return 'Choisir le périmètre de questions à travailler.';
    if (bouton.closest('.entrainement-nombre-choix, #siglesChoixNombre, #mesuresChoixNombre'))
        return 'Choisir le nombre de questions de la session.';
    if (bouton.closest('#siglesChoixOrganisation, #mesuresChoixOrganisation'))
        return 'Choisir l’ordre de présentation des questions.';
    if (bouton.closest('#siglesChoixChrono, #mesuresChoixChrono'))
        return 'Activer ou désactiver le chronomètre de la session.';
    if (bouton.closest('#siglesChoixJokers, #mesuresChoixJokers'))
        return 'Activer ou désactiver les jokers de la session.';

    return '';
}

let compteurInfobullePJJoue = 0;
let infobullePJJoueActive = null;

function positionnerInfobullePJJoue() {
    const active = infobullePJJoueActive;
    if (!active?.element?.isConnected || !active.declencheur?.isConnected)
        return;
    const declencheur = active.declencheur;
    const element = active.element;
    const marge = 10;
    const rect = declencheur.getBoundingClientRect();
    const largeur = element.offsetWidth;
    const hauteur = element.offsetHeight;
    const espaceHaut = rect.top - marge;
    const afficherDessous = espaceHaut < hauteur + marge;
    const haut = afficherDessous
        ? Math.min(window.innerHeight - hauteur - marge, rect.bottom + marge)
        : rect.top - hauteur - marge;
    const gauche = Math.min(
        Math.max(marge, rect.left + rect.width / 2 - largeur / 2),
        Math.max(marge, window.innerWidth - largeur - marge)
    );
    const fleche = Math.min(
        Math.max(16, rect.left + rect.width / 2 - gauche),
        Math.max(16, largeur - 16)
    );
    element.dataset.position = afficherDessous ? 'dessous' : 'dessus';
    element.style.left = `${gauche}px`;
    element.style.top = `${Math.max(marge, haut)}px`;
    element.style.setProperty('--position-fleche', `${fleche}px`);
}

function masquerInfobullePJJoue() {
    const active = infobullePJJoueActive;
    if (!active)
        return;
    const { declencheur, element, ariaDescribedBy } = active;
    if (declencheur?.isConnected) {
        if (ariaDescribedBy)
            declencheur.setAttribute('aria-describedby', ariaDescribedBy);
        else
            declencheur.removeAttribute('aria-describedby');
    }
    element?.remove();
    infobullePJJoueActive = null;
}

function afficherInfobullePJJoue(declencheur) {
    const texte = declencheur?.dataset.infobulle;
    if (!(declencheur instanceof HTMLButtonElement) || !texte)
        return;
    const ecran = declencheur.closest('.ecran');
    if (!declencheur.isConnected
        || !declencheur.getClientRects().length
        || declencheur.closest('.masque')
        || (ecran && !ecran.classList.contains('actif'))) {
        if (infobullePJJoueActive?.declencheur === declencheur)
            masquerInfobullePJJoue();
        return;
    }
    if (infobullePJJoueActive?.declencheur === declencheur) {
        infobullePJJoueActive.element.textContent = texte;
        positionnerInfobullePJJoue();
        return;
    }
    masquerInfobullePJJoue();
    const element = document.createElement('span');
    element.className = 'infobulle-pjjoue';
    element.id = `infobullePJJoue-${++compteurInfobullePJJoue}`;
    element.setAttribute('role', 'tooltip');
    element.textContent = texte;
    const ariaDescribedBy = declencheur.getAttribute('aria-describedby') || '';
    declencheur.setAttribute('aria-describedby', element.id);
    document.body.appendChild(element);
    infobullePJJoueActive = { declencheur, element, ariaDescribedBy };
    positionnerInfobullePJJoue();
    requestAnimationFrame(() => element.classList.add('est-visible'));
}

function definirAideSurvolBouton(bouton, texte) {
    if (!(bouton instanceof HTMLButtonElement))
        return;
    if (texte) {
        bouton.dataset.infobulle = texte;
        // Les infobulles natives sont remplacées par l'aide intégrée à PJJoue.
        bouton.removeAttribute('title');
        if (infobullePJJoueActive?.declencheur === bouton)
            afficherInfobullePJJoue(bouton);
    }
    else {
        delete bouton.dataset.infobulle;
        if (infobullePJJoueActive?.declencheur === bouton)
            masquerInfobullePJJoue();
    }
}

function appliquerAideSurvolBouton(bouton) {
    if (!(bouton instanceof HTMLButtonElement))
        return;
    const texte = obtenirTitreSurvolBouton(bouton);
    if (texte)
        definirAideSurvolBouton(bouton, texte);
}

function appliquerAidesSurvol(racine = document) {
    if (racine instanceof HTMLButtonElement)
        appliquerAideSurvolBouton(racine);
    racine.querySelectorAll?.('button').forEach(appliquerAideSurvolBouton);
}

function activerAidesAuSurvol() {
    appliquerAidesSurvol();
    document.addEventListener('pointerover', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton && !bouton.contains(evenement.relatedTarget))
            afficherInfobullePJJoue(bouton);
    });
    document.addEventListener('pointerout', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton && !bouton.contains(evenement.relatedTarget))
            masquerInfobullePJJoue();
    });
    document.addEventListener('click', evenement => {
        if (evenement.target.closest?.('button[data-infobulle]'))
            masquerInfobullePJJoue();
    });
    document.addEventListener('focusin', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton)
            afficherInfobullePJJoue(bouton);
    });
    document.addEventListener('focusout', evenement => {
        const bouton = evenement.target.closest?.('button[data-infobulle]');
        if (bouton && !bouton.matches(':hover'))
            masquerInfobullePJJoue();
    });
    document.addEventListener('keydown', evenement => {
        if (evenement.key === 'Escape')
            masquerInfobullePJJoue();
    });
    window.addEventListener('resize', positionnerInfobullePJJoue, { passive: true });
    window.addEventListener('scroll', positionnerInfobullePJJoue, { passive: true, capture: true });
    const observateur = new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(noeud => {
            if (noeud.nodeType === Node.ELEMENT_NODE)
                appliquerAidesSurvol(noeud);
        }));
    });
    observateur.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', activerAidesAuSurvol, { once: true });
else
    activerAidesAuSurvol();
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
        pjjoue_page_consultee: obtenirPageMenuAnalytics(etat.ecran),
        pjjoue_ecran: obtenirLibelleEcranAnalytics(etat.ecran)
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
        groupe.querySelectorAll('.option-bouton').forEach(boutonDuGroupe => {
            const actif = boutonDuGroupe === boutonBascule;
            boutonDuGroupe.classList.toggle('actif', actif);
            boutonDuGroupe.setAttribute('aria-pressed', String(actif));
        });
        envoyerOptionDeJeuAnalytics(`${groupe.dataset.proposition === 'jokers' ? 'Jokers' : 'Chronomètre'} : ${boutonBascule.textContent.trim()}`);
        return;
    }
    const boutonLancer = evenement.target.closest('.entrainement-lancer');
    if (boutonLancer) {
        const carte = boutonLancer.closest('[data-carte-entrainement]');
        const valeurJokers = carte.querySelector('[data-proposition="jokers"] .option-bouton.actif')?.dataset.valeur || 'oui';
        etat.organisationSession = boutonLancer.dataset.organisationSession || 'ordonne';
        etat.jokersSessionActifs = valeurJokers === 'oui';
        etat.chronometreSessionActif = false;
        etat.dureeChronometreSession = 15;
        envoyerOptionDeJeuAnalytics(`Lancer la session · ${boutonLancer.dataset.organisationSession === 'melange' ? 'Mélangé' : 'Par ordre d’étapes'}`, {
            pjjoue_jokers: etat.jokersSessionActifs ? 'Avec' : 'Sans',
            pjjoue_chrono: etat.chronometreSessionActif ? 'Avec' : 'Sans',
            pjjoue_temps_par_question: etat.chronometreSessionActif ? etat.dureeChronometreSession : null
        });
        lancerEntrainementLibre();
        return;
    }
});

document.addEventListener('click', evenement => {
    if (evenement.target.closest('#boutonChronometreQuestion')) ajouterTempsChronometreQuestion();
    else if (evenement.target.closest('#boutonChronometreToutesQuestions')) basculerChronometreToutesQuestions();
    else if (evenement.target.closest('#boutonArreterChronometre')) desactiverChronometreQuestion();
});
