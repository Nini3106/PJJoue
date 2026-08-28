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
