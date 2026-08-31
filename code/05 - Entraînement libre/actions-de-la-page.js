/**
 * Préparer les choix de l’Entraînement libre.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
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
function synchroniserCurseurNombreQuestions(nombreMax = null) {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const sortie = selectionner('#valeurNombreQuestions');
    const borne = selectionner('#borneMaxQuestions');
    if (!selectNombre || !curseur)
        return;
    const minimum = Number(curseur.min) || 1;
    const max = Number(nombreMax) || Number(curseur.max) || 660;
    curseur.max = String(max);
    const valeur = Math.min(max, Math.max(minimum, Number(selectNombre.value) || minimum));
    garantirOptionNombreQuestions(selectNombre, valeur);
    selectNombre.value = String(valeur);
    curseur.value = String(valeur);
    if (sortie)
        sortie.textContent = `${valeur} question${valeur === 1 ? '' : 's'}`;
    if (borne)
        borne.textContent = `${max} max`;
}
function initialiserCurseurNombreQuestions() {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const groupe = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (!selectNombre || !curseur || curseur.dataset.initialise === 'true')
        return;
    curseur.dataset.initialise = 'true';
    if (groupe)
        groupe.dataset.selectionEffectuee = 'true';
    const appliquerValeurCurseur = () => {
        const minimum = Number(curseur.min) || 1;
        const maximum = Number(curseur.max) || 660;
        const valeur = Math.min(maximum, Math.max(minimum, Number(curseur.value) || minimum));
        garantirOptionNombreQuestions(selectNombre, valeur);
        selectNombre.value = String(valeur);
        groupe?.setAttribute('data-selection-effectuee', 'true');
        groupe?.querySelectorAll('.choix-bouton').forEach(bouton => {
            const actif = Number(bouton.dataset.valeur) === valeur;
            bouton.classList.toggle('actif', actif);
            bouton.classList.toggle('selectionne', actif);
            bouton.setAttribute('aria-pressed', String(actif));
        });
        synchroniserCurseurNombreQuestions(maximum);
    };
    /* Le navigateur gère lui-même le clic et le glisser du range. Ne pas recalculer
       la position sur pointerdown : cela entrait en concurrence avec le comportement
       natif et pouvait faire revenir le bouton rond à une autre valeur. */
    curseur.addEventListener('input', appliquerValeurCurseur);
    curseur.addEventListener('change', appliquerValeurCurseur);
    synchroniserCurseurNombreQuestions();
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
    let minimumCurseur = 10;
    let pasCurseur = 1;
    let texteDisponibilite = '';

    if (etat.contexteEntrainement === 'sigles') {
        const perimetre = selectPerimetre.value || 'tous';
        nombreMax = obtenirPoolEntrainementMissionSigles(perimetre).length;
        minimumCurseur = Math.min(10, nombreMax);
        pasCurseur = 1;
        const libellePerimetre = perimetre === 'tous' ? 'Mission Sigles complète' : `l’étape ${Number(perimetre)}`;
        texteDisponibilite = `${nombreMax} sigles disponibles dans ${libellePerimetre}.`;
    } else if (etat.contexteEntrainement === 'mesures') {
        const perimetre = selectPerimetre.value || 'tous';
        nombreMax = obtenirPoolEntrainementMissionMesures(perimetre).length;
        minimumCurseur = Math.min(10, nombreMax);
        pasCurseur = 1;
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

    garantirOptionNombreQuestions(selectNombre, nombreMax);
    const boutonTous = groupeNombre.querySelector('[data-choix-nombre="tous"]');
    if (boutonTous) {
        boutonTous.dataset.valeur = String(nombreMax);
        boutonTous.textContent = 'Tous';
        boutonTous.hidden = false;
        boutonTous.disabled = false;
    }
    groupeNombre.querySelectorAll('.choix-bouton:not([data-choix-nombre="tous"])').forEach(bouton => {
        const disponible = Number(bouton.dataset.valeur) <= nombreMax;
        bouton.hidden = !disponible;
        bouton.disabled = !disponible;
    });

    let nombreSelectionne = Number(selectNombre.value) || Math.min(10, nombreMax);
    if (nombreSelectionne > nombreMax || nombreSelectionne < 1)
        nombreSelectionne = Math.min(10, nombreMax);
    garantirOptionNombreQuestions(selectNombre, nombreSelectionne);
    selectNombre.value = String(nombreSelectionne);

    groupeNombre.querySelectorAll('.choix-bouton:not([hidden])').forEach(bouton => {
        const actif = groupeNombre.dataset.selectionEffectuee === 'true'
            && Number(bouton.dataset.valeur) === nombreSelectionne;
        bouton.classList.toggle('actif', actif);
        bouton.classList.toggle('selectionne', actif);
        bouton.setAttribute('aria-pressed', String(actif));
    });

    const curseur = selectionner('#curseurNombreQuestions');
    if (curseur) {
        curseur.min = String(minimumCurseur);
        curseur.max = String(nombreMax);
        curseur.step = String(pasCurseur);
        curseur.value = String(nombreSelectionne);
    }
    const resume = selectionner('#limiteQuestionsEntrainement');
    if (resume)
        resume.textContent = texteDisponibilite;
    synchroniserCurseurNombreQuestions(nombreMax);
}
function initialiserGroupesChoix() {
    selectionnerTous('[data-groupe-choix]').forEach(groupe => {
        const listeDeroulante = selectionner('#' + groupe.dataset.groupeChoix);
        groupe.setAttribute('role', 'group');
        groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
            bouton.setAttribute('aria-pressed', 'false');
            bouton.onclick = () => {
                listeDeroulante.value = bouton.dataset.valeur;
                groupe.dataset.selectionEffectuee = 'true';
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
