'use strict';

/**
 * Couche d'événements métier de PJJoue.
 *
 * Les événements et paramètres métier utilisent le vocabulaire visible dans
 * PJJoue. Les libellés pédagogiques publics (page, parcours, étape, question
 * et type d'activité) peuvent être envoyés pour rendre les rapports lisibles.
 * La réponse saisie, le contenu d'une sauvegarde, l'adresse IP et toute donnée
 * d'identité restent exclus du suivi.
 */
(() => {
    const PREFIXE_EVENEMENT = 'pjjoue_';
    const LONGUEUR_MAXIMALE = 100;
    // Un événement ne reçoit que les données de l'action qui vient d'avoir lieu.
    // Les alias historiques ne sont plus expédiés : les clés GA4 existantes restent stables.
    const PAGE = ['pjjoue_page_consultee', 'pjjoue_ecran'];
    const PARCOURS = ['pjjoue_nom_parcours', 'pjjoue_identifiant_parcours', 'pjjoue_numero_parcours'];
    const ETAPE = ['pjjoue_numero_etape', 'pjjoue_numero_etape_visible', 'pjjoue_nom_etape'];
    const COMMUN = [...PAGE, ...PARCOURS];
    const SESSION = [...COMMUN, ...ETAPE, 'pjjoue_mode_de_jeu', 'pjjoue_perimetre_session',
        'pjjoue_nombre_questions', 'pjjoue_jokers', 'pjjoue_mode_entrainement',
        'pjjoue_chrono', 'pjjoue_temps_par_question', 'pjjoue_defi_chrono',
        'pjjoue_temps_par_question_defi_chrono', 'pjjoue_nombre_questions_defi_du_hasard'];
    const QUESTION = [...COMMUN, ...ETAPE, 'pjjoue_mode_de_jeu', 'pjjoue_perimetre_session',
        'pjjoue_nombre_questions', 'pjjoue_jokers', 'pjjoue_identifiant_question',
        'pjjoue_nom_question', 'pjjoue_reperes_question', 'pjjoue_position_question_session', 'pjjoue_type_question'];
    const RESULTAT = ['pjjoue_score', 'pjjoue_reussites_autonomes', 'pjjoue_questions_passees',
        'pjjoue_reussites_avec_aide', 'pjjoue_joker_utilise_session',
        'pjjoue_duree_session_secondes', 'pjjoue_resultat_session'];
    const VIDEO = [...PAGE, 'pjjoue_nom_guide', 'pjjoue_video_identifiant',
        'pjjoue_video_titre', 'pjjoue_video_source'];
    const SUPPORT = [...PAGE, 'pjjoue_categorie_support', 'pjjoue_nom_support'];
    const PLAN_MESURE = Object.freeze(Object.fromEntries(Object.entries({
        page_consultee: [...COMMUN, 'pjjoue_page_precedente', 'pjjoue_ecran_precedent', 'pjjoue_nom_guide'],
        parcours_selectionne: COMMUN,
        etape_selectionnee: [...COMMUN, ...ETAPE],
        option_de_jeu_selectionnee: [...COMMUN, 'pjjoue_mode_de_jeu', 'pjjoue_perimetre_session', 'pjjoue_option_de_jeu'],
        defi_du_hasard_lance: [...COMMUN, 'pjjoue_mode_de_jeu', 'pjjoue_perimetre_session', 'pjjoue_nombre_questions_defi_du_hasard'],
        session_commencee: [...SESSION, 'pjjoue_resultat_session'],
        session_terminee: [...SESSION, ...RESULTAT],
        session_quittee: [...SESSION, ...RESULTAT],
        session_suspendue: [...COMMUN, 'pjjoue_mode_de_jeu', 'pjjoue_motif_reprise'],
        session_reprise: [...COMMUN, 'pjjoue_mode_de_jeu', 'pjjoue_motif_reprise'],
        question_affichee: [...QUESTION, 'pjjoue_resultat_reponse'],
        question_rejouee: QUESTION,
        question_passee: [...QUESTION, 'pjjoue_resultat_reponse'],
        reponse_validee: [...QUESTION, 'pjjoue_resultat_reponse', 'pjjoue_nombre_tentatives', 'pjjoue_temps_ecoule', 'pjjoue_reponse_apres_reprise'],
        joker_utilise: [...QUESTION, 'pjjoue_joker_utilise', 'pjjoue_option_de_jeu'],
        revision_filtree: [...COMMUN, 'pjjoue_perimetre_session', 'pjjoue_categorie_revision'],
        revision_lancee: [...COMMUN, 'pjjoue_perimetre_session', 'pjjoue_categorie_revision', 'pjjoue_nombre_questions'],
        support_ouvert: SUPPORT,
        supports_filtres: [...PAGE, 'pjjoue_categorie_support'],
        supports_recherches: [...PAGE, 'pjjoue_categorie_support', 'pjjoue_nombre_resultats'],
        video_lancee: VIDEO,
        video_ouverte_youtube: VIDEO,
        parametres_enregistres: [...PAGE, 'pjjoue_son', 'pjjoue_volume_son', 'pjjoue_taille_texte'],
        progression_exportee: PAGE,
        progression_importee: PAGE,
        progression_restauree: PAGE,
        progression_reinitialisee: PAGE
    }).map(([nom, cles]) => [PREFIXE_EVENEMENT + nom, Object.freeze(cles)])));
    const PARAMETRES = Object.freeze([...new Set(Object.values(PLAN_MESURE).flat())]);
    const PARAMETRES_REINITIALISES = [...PARAMETRES, 'pjjoue_parcours', 'pjjoue_parcours_selectionne',
        'pjjoue_type_session', 'pjjoue_identifiant_etape', 'pjjoue_page_detail', 'pjjoue_video_page'];
    const PARAMETRES_INTERDITS = new Set([
        'adresse_ip', 'ip', 'ip_address', 'email', 'adresse_email',
        'nom', 'prenom', 'telephone', 'reponse_saisie', 'contenu_sauvegarde'
    ]);

    function consentementAccorde() {
        return window.PJJConsentement?.estAutorise?.() === true;
    }

    function normaliserValeur(valeur) {
        if (valeur === null || valeur === undefined || valeur === '')
            return null;
        if (typeof valeur === 'boolean')
            return valeur ? 1 : 0;
        if (typeof valeur === 'number')
            return Number.isFinite(valeur) ? valeur : null;
        return String(valeur).slice(0, LONGUEUR_MAXIMALE);
    }

    function normaliserParametres(parametres, clesAutorisees) {
        return Object.fromEntries(
            Object.entries(parametres || {})
                .filter(([cle]) => {
                    const cleNormalisee = String(cle).toLowerCase().replace(/^pjjoue_/, '');
                    return clesAutorisees.includes(cle) && !PARAMETRES_INTERDITS.has(cleNormalisee);
                })
                .map(([cle, valeur]) => [cle, normaliserValeur(valeur)])
                .filter(([, valeur]) => valeur !== null)
        );
    }

    function envoyer(nom, parametres = {}) {
        if (!consentementAccorde())
            return false;
        const nomNormalise = String(nom || '').trim().toLowerCase();
        const nomComplet = nomNormalise.startsWith(PREFIXE_EVENEMENT)
            ? nomNormalise : PREFIXE_EVENEMENT + nomNormalise;
        const clesAutorisees = PLAN_MESURE[nomComplet];
        if (!clesAutorisees || nomComplet.length > 40)
            return false;
        const valeurs = normaliserParametres(parametres, clesAutorisees);
        if (Object.keys(valeurs).length > 25)
            return false;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            // undefined remplace explicitement l'ancienne valeur dans le modèle GTM.
            // Le nettoyage et l'action sont atomiques ; le consentement et les clés GTM restent intacts.
            ...Object.fromEntries(PARAMETRES_REINITIALISES.map(cle => [cle, undefined])),
            event: nomComplet,
            ...valeurs
        });
        return true;
    }

    window.PJJ_ANALYTICS = Object.freeze({ envoyer, plan: PLAN_MESURE, parametres: PARAMETRES });
})();
