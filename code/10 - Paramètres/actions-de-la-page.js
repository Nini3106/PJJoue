/**
 * Enregistrer les paramètres et importer ou exporter la progression.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
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
    selectionner('#echelleTexte').value = String(parametres.echelleTexte || 1.15);
    document.documentElement.style.setProperty('--echelle-texte', String(parametres.echelleTexte || 1.15));
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
