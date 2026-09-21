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
