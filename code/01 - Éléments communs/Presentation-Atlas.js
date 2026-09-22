/**
 * Atlas — présentation uniquement.
 * Lit les indicateurs du moteur existant ; ne définit aucune règle de score,
 * de reprise, d’évaluation ni de stockage. Les commandes appellent les actions natives.
 */
function actualiserAccueilAtlas() {
    const action = obtenirProchaineActionParcoursComplet();
    const theme = action.theme || THEMES[0]?.id;
    const programme = PROGRAMMES[theme];
    const identite = obtenirIdentiteParcours(theme);
    const progression = calculerProgressionParcours(theme);
    const remplir = (id, valeur) => {
        const element = document.getElementById(id);
        if (element) element.textContent = valeur;
    };
    const dossier = document.getElementById('atlasItineraire');
    if (dossier) dossier.dataset.numero = identite.numero;
    remplir('atlasItineraireTitre', identite.titre);
    remplir('atlasItineraireSurTitre', progression.jalonsMaitrises ? 'Ton parcours en cours' : 'Ton point de départ');
    remplir('atlasEtapesMaitrisees', `${progression.maitrisees} ${accorderLibelle(progression.maitrisees, 'étape maîtrisée', 'étapes maîtrisées')}`);
    remplir('atlasEtapeCouranteNumero', action.type === 'etape' ? action.etape.id : '✓');
    remplir('atlasEtapeCourante', action.type === 'etape' ? `Tu es ici · étape ${action.etape.id}` : action.type === 'evaluation' ? 'Prêt pour l’évaluation' : 'Tous les parcours validés');
    remplir('atlasEtapeCouranteTitre', action.type === 'etape' ? action.etape.titre : 'À ton rythme, sans perdre tes acquis.');
    remplir('atlasEtatEvaluation', progression.evaluationReussie ? 'Évaluation réussie ✓' : `Après les ${programme?.etapes.length || 11} étapes`);
    const revisions = compterQuestionsAConsolider();
    remplir('atlasResumeRevision', revisions ? `${revisions} ${accorderLibelle(revisions, 'question à retravailler', 'questions à retravailler')}.` : 'Tes questions à retravailler se retrouveront ici.');
    actualiserSelecteurParcours();
}

function afficherVueEnsembleAtlas() {
    const liste = document.getElementById('atlasProgressionListe');
    if (!liste) return;
    liste.replaceChildren();
    THEMES.forEach(theme => {
        const identite = obtenirIdentiteParcours(theme.id);
        const progression = calculerProgressionParcours(theme.id);
        const ligne = document.createElement('button');
        ligne.type = 'button';
        ligne.className = 'q-statsrow atlas-progress-row';
        ligne.style.setProperty('--parcours-accent', identite.couleur);
        ligne.setAttribute('aria-label', `${identite.titre} : ${progression.maitrisees} étapes maîtrisées sur ${progression.total}. Ouvrir ce parcours.`);
        ligne.innerHTML = `<span class="atlas-progress-copy"><strong>${identite.numero} · ${identite.titre}</strong><span>${identite.optionnel ? 'Option PJJ · ' : ''}${progression.maitrisees}/${progression.total} étapes maîtrisées${progression.evaluationReussie ? ' · évaluation réussie ✓' : ''}</span></span><span class="atlas-progress-meter"><span class="q-small">${progression.pourcentage}%</span><span class="q-progress" aria-hidden="true"><span style="width:${progression.pourcentage}%;background:var(--parcours-accent)"></span></span></span>`;
        ligne.addEventListener('click', () => ouvrirParcours(theme.id));
        liste.appendChild(ligne);
    });
}

function actualiserLibelleSelecteurAtlas() {
    document.querySelectorAll('[data-atlas-select]').forEach(menu => {
        const select = document.getElementById(menu.dataset.atlasSelect);
        const etiquette = menu.querySelector('[data-atlas-select-label]');
        const choisi = menu.querySelector('.choix-bouton.actif');
        if (etiquette && select) etiquette.textContent = choisi?.querySelector('b')?.textContent || select.selectedOptions[0]?.textContent || 'Choisir';
        // Lire le repère du bouton natif : ni filtre supplémentaire, ni état de jeu dupliqué.
        const resume = menu.querySelector('summary');
        if (resume) resume.style.setProperty('--parcours-accent', choisi?.style.getPropertyValue('--parcours-accent') || 'var(--q-blue)');
    });
}

function initialiserPresentationAtlas() {
    const entrainement = document.getElementById('entrainement');
    if (!entrainement) return;
    entrainement.querySelectorAll('[data-atlas-order]').forEach(bouton => {
        bouton.addEventListener('click', () => {
            entrainement.dataset.ordreAtlas = bouton.dataset.atlasOrder;
            entrainement.querySelectorAll('[data-atlas-order]').forEach(autre => {
                autre.setAttribute('aria-pressed', String(autre === bouton));
            });
        });
    });
    document.querySelectorAll('[data-atlas-select]').forEach(menu => {
        // Délégation : les périmètres de Mission Sigles et Mesures sont générés
        // par le moteur dans le même configurateur, sans reconstruire un faux formulaire.
        menu.addEventListener('click', evenement => {
            if (!evenement.target.closest('.choix-bouton')) return;
            queueMicrotask(() => {
                actualiserLibelleSelecteurAtlas();
                menu.open = false;
                menu.querySelector('summary')?.focus();
            });
        });
        menu.addEventListener('keydown', evenement => {
            if (evenement.key === 'Escape') {
                menu.open = false;
                menu.querySelector('summary')?.focus();
            }
        });
        document.getElementById(menu.dataset.atlasSelect)?.addEventListener('change', () => queueMicrotask(actualiserLibelleSelecteurAtlas));
    });
    document.addEventListener('pointerdown', evenement => {
        document.querySelectorAll('.atlas-select[open]').forEach(menu => {
            if (!menu.contains(evenement.target)) menu.open = false;
        });
    });
    actualiserLibelleSelecteurAtlas();
}
