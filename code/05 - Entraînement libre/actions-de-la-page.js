/**
 * Préparer les choix de l’Entraînement libre.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
function synchroniserCurseurNombreQuestions(nombreMax = null) {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const sortie = selectionner('#valeurNombreQuestions');
    const borne = selectionner('#borneMaxQuestions');
    if (!selectNombre || !curseur)
        return;
    const max = Number(nombreMax) || Number(curseur.max) || 660;
    curseur.max = String(max);
    const valeur = Math.min(max, Math.max(10, Number(selectNombre.value) || 10));
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
    curseur.oninput = () => {
        const valeur = Number(curseur.value) || 10;
        selectNombre.value = String(valeur);
        groupe?.setAttribute('data-selection-effectuee', 'true');
        groupe?.querySelectorAll('.choix-bouton').forEach(bouton => {
            const actif = Number(bouton.dataset.valeur) === valeur;
            bouton.classList.toggle('actif', actif);
            bouton.classList.toggle('selectionne', actif);
            bouton.setAttribute('aria-pressed', String(actif));
        });
        synchroniserCurseurNombreQuestions();
    };
    const positionnerCurseurAuPointeur = evenement => {
        if (evenement.button !== undefined && evenement.button !== 0)
            return;
        const limites = curseur.getBoundingClientRect();
        if (!limites.width)
            return;
        const minimum = Number(curseur.min) || 10;
        const maximum = Number(curseur.max) || 660;
        const pas = Number(curseur.step) || 10;
        const proportion = Math.min(1, Math.max(0, (evenement.clientX - limites.left) / limites.width));
        const valeurBrute = minimum + proportion * (maximum - minimum);
        const valeur = Math.min(maximum, Math.max(minimum, minimum + Math.round((valeurBrute - minimum) / pas) * pas));
        if (Number(curseur.value) !== valeur) {
            curseur.value = String(valeur);
            curseur.oninput();
        }
    };
    curseur.addEventListener('pointerdown', positionnerCurseurAuPointeur);
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
    if (etat.contexteEntrainement === 'sigles') {
        const perimetre = selectPerimetre.value || 'tous';
        const reserve = obtenirPoolEntrainementMissionSigles(perimetre);
        const nombreMax = reserve.length;
        const libellePerimetre = perimetre === 'tous' ? 'Mission Sigles complète' : `l’étape ${Number(perimetre)}`;
        const boutons = [...groupeNombre.querySelectorAll('.choix-bouton')];
        boutons.forEach((bouton, index) => {
            if (index === 3) {
                bouton.dataset.valeur = String(nombreMax);
                bouton.textContent = 'Tous';
            }
            const valeur = Number(bouton.dataset.valeur);
            const disponible = valeur <= nombreMax;
            bouton.hidden = !disponible;
            bouton.disabled = !disponible;
        });
        let nombreSelectionne = Math.min(nombreMax, Math.max(1, Number(selectNombre.value) || 10));
        if (nombreSelectionne > nombreMax || ![...selectNombre.options].some(option => Number(option.value) === nombreSelectionne))
            nombreSelectionne = Math.min(10, nombreMax);
        selectNombre.value = String(nombreSelectionne);
        groupeNombre.querySelectorAll('.choix-bouton:not([hidden])').forEach(bouton => {
            const actif = Number(bouton.dataset.valeur) === nombreSelectionne;
            bouton.classList.toggle('actif', actif);
            bouton.classList.toggle('selectionne', actif);
            bouton.setAttribute('aria-pressed', String(actif));
        });
        const curseur = selectionner('#curseurNombreQuestions');
        if (curseur) {
            curseur.min = String(Math.min(10, nombreMax));
            curseur.max = String(nombreMax);
            curseur.step = '1';
            curseur.value = String(nombreSelectionne);
        }
        const resume = selectionner('#limiteQuestionsEntrainement');
        if (resume)
            resume.textContent = `${nombreMax} sigles disponibles dans ${libellePerimetre}.`;
        synchroniserCurseurNombreQuestions(nombreMax);
        return;
    }
    const perimetre = selectPerimetre.value || 'tous';
    const reserve = obtenirQuestionsEntrainement(perimetre);
    const nombreMax = reserve.length;
    const libellePerimetre = perimetre === 'tous'
        ? 'le parcours complet'
        : `le parcours ${obtenirOrdreTheme(perimetre) + 1}`;
    Array.from(selectNombre.options).forEach(option => {
        const disponible = Number(option.value) <= nombreMax;
        option.disabled = !disponible;
        option.hidden = !disponible;
    });
    groupeNombre.querySelectorAll('.choix-bouton').forEach(bouton => {
        const disponible = Number(bouton.dataset.valeur) <= nombreMax;
        bouton.hidden = !disponible;
        bouton.disabled = !disponible;
    });
    let nombreSelectionne = Number(selectNombre.value) || 10;
    if (nombreSelectionne > nombreMax) {
        nombreSelectionne = nombreMax;
        selectNombre.value = String(nombreMax);
        groupeNombre.dataset.selectionEffectuee = 'true';
    }
    groupeNombre.querySelectorAll('.choix-bouton:not([hidden])').forEach(bouton => {
        const actif = groupeNombre.dataset.selectionEffectuee === 'true'
            && Number(bouton.dataset.valeur) === nombreSelectionne;
        bouton.classList.toggle('actif', actif);
        bouton.classList.toggle('selectionne', actif);
        bouton.setAttribute('aria-pressed', String(actif));
    });
    const resume = selectionner('#limiteQuestionsEntrainement');
    if (resume)
        resume.textContent = `${nombreMax} questions d’apprentissage disponibles dans ${libellePerimetre}.`;
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
