/**
 * PJJoue V1 — Progression.
 * Interface multi-parcours stable.
 */
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
