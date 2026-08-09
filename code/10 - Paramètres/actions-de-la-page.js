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
            effacerSauvegardeV1DuNavigateur();
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
