/**
 * PJJoue V1 — Réviser.
 * Interface multi-parcours stable.
 * Source assemblée dans ressources/moteur-jeu.js.
 * Les données pédagogiques ne sont pas modifiées.
 * Les fonctions restent lisibles et nommées en français.
 */
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
            <span class="revision-parcours-texte"><strong>${identite.titre}</strong><small>${total} ${accorderLibelle(total, 'question à consolider', 'questions à consolider')}</small></span>
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
    const libelleErreurs = accorderLibelle(total, 'question à consolider', 'questions à consolider');
    return `<div class="revision-workspace">
        <article class="revision-toutes-erreurs">
            <div class="revision-toutes-erreurs-icone" aria-hidden="true">↻</div>
            <div class="revision-toutes-erreurs-texte">
                <span class="surtitre">Révision rapide</span>
                <h2>Mélange mes questions à consolider</h2>
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
            <small>${obtenirLibelleConsolidation(suiviErreur)}</small>
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
                <span><strong>${identite.titre}</strong><small>${total} ${accorderLibelle(total, 'question à consolider', 'questions à consolider')}</small></span>
                <span class="revision-dossier-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div class="revision-dossier-contenu">${etapes}</div>
        </details>`;
    }).join('');
    return `<section class="revision-inventaire" aria-labelledby="titreInventaireErreurs">
        <div class="revision-section-entete"><div><span class="surtitre">Détail</span><h2 id="titreInventaireErreurs">Tes questions à consolider</h2></div><p>Consulte les questions qui restent à consolider, parcours par parcours.</p></div>
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
