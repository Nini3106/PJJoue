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
function obtenirMaximumNombreQuestions() {
    const curseur = selectionner('#curseurNombreQuestions');
    return Math.max(1, Number(curseur?.max) || 1);
}
function obtenirValeurBoutonNombreQuestions(bouton) {
    if (!bouton)
        return null;
    if (bouton.dataset.choixNombre === 'tous')
        return obtenirMaximumNombreQuestions();
    const valeur = Number(bouton.dataset.valeur);
    return Number.isFinite(valeur) ? valeur : null;
}
function actualiserEtatBoutonsNombreQuestions(valeur, modeSelection = null) {
    const groupe = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (!groupe)
        return;
    const mode = modeSelection || groupe.dataset.modeSelectionNombre || 'rapide';
    groupe.dataset.modeSelectionNombre = mode;
    groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
        let actif = false;
        if (!bouton.disabled) {
            if (mode === 'tous')
                actif = bouton.dataset.choixNombre === 'tous';
            else if (mode === 'rapide')
                actif = bouton.dataset.choixNombre !== 'tous' && Number(bouton.dataset.valeur) === Number(valeur);
        }
        bouton.classList.toggle('actif', actif);
        bouton.classList.toggle('selectionne', actif);
        bouton.setAttribute('aria-pressed', String(actif));
    });
}
function calculerReperesNombreQuestions(minimum, maximum) {
    const min = Math.max(1, Number(minimum) || 1);
    const max = Math.max(min, Number(maximum) || min);
    if (max === min)
        return [min];
    if (max <= 8)
        return Array.from({ length: max - min + 1 }, (_, index) => min + index);

    const amplitude = max - min;
    const granularite = max <= 20 ? 1 : max <= 100 ? 5 : 10;
    const arrondir = valeur => Math.max(min, Math.min(max, Math.round(valeur / granularite) * granularite));
    const valeurs = [
        min,
        arrondir(min + amplitude * .25),
        arrondir(min + amplitude * .5),
        arrondir(min + amplitude * .75),
        max
    ];
    return [...new Set(valeurs)].sort((a, b) => a - b);
}
function actualiserReperesNombreQuestions(minimum, maximum) {
    const zone = selectionner('#reperesNombreQuestions');
    if (!zone)
        return;
    const min = Math.max(1, Number(minimum) || 1);
    const max = Math.max(min, Number(maximum) || min);
    const amplitude = Math.max(1, max - min);
    const reperes = calculerReperesNombreQuestions(min, max);
    zone.innerHTML = reperes.map((valeur, index) => {
        const position = max === min ? 0 : ((valeur - min) / amplitude) * 100;
        const classe = index === 0 ? ' debut' : index === reperes.length - 1 ? ' fin' : '';
        return `<span class="entrainement-repere${classe}" style="--position-repere:${position}%"><i></i><b>${valeur}</b></span>`;
    }).join('');
}
function synchroniserCurseurNombreQuestions(nombreMax = null) {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const sortie = selectionner('#valeurNombreQuestions');
    const borneMin = selectionner('#borneMinQuestions');
    const borneMax = selectionner('#borneMaxQuestions');
    if (!selectNombre || !curseur)
        return;
    const minimum = Math.max(1, Number(curseur.min) || 1);
    const max = Math.max(minimum, Number(nombreMax) || Number(curseur.max) || minimum);
    curseur.min = String(minimum);
    curseur.max = String(max);
    const valeur = Math.min(max, Math.max(minimum, Number(selectNombre.value) || minimum));
    garantirOptionNombreQuestions(selectNombre, valeur);
    selectNombre.value = String(valeur);
    curseur.value = String(valeur);
    if (sortie)
        sortie.textContent = `${valeur} question${valeur === 1 ? '' : 's'}`;
    if (borneMin)
        borneMin.textContent = String(minimum);
    if (borneMax)
        borneMax.textContent = `${max} max`;
    actualiserReperesNombreQuestions(minimum, max);
}
function initialiserCurseurNombreQuestions() {
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const curseur = selectionner('#curseurNombreQuestions');
    const groupe = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (!selectNombre || !curseur || curseur.dataset.initialise === 'true')
        return;
    curseur.dataset.initialise = 'true';
    if (groupe) {
        groupe.dataset.selectionEffectuee = 'true';
        groupe.dataset.modeSelectionNombre ||= 'rapide';
    }
    const appliquerValeurCurseur = () => {
        const minimum = Math.max(1, Number(curseur.min) || 1);
        const maximum = Math.max(minimum, Number(curseur.max) || minimum);
        const valeur = Math.min(maximum, Math.max(minimum, Number(curseur.value) || minimum));
        garantirOptionNombreQuestions(selectNombre, valeur);
        selectNombre.value = String(valeur);
        if (groupe) {
            groupe.dataset.selectionEffectuee = 'true';
            groupe.dataset.modeSelectionNombre = 'personnalise';
        }
        synchroniserCurseurNombreQuestions(maximum);
        actualiserEtatBoutonsNombreQuestions(valeur, 'personnalise');
    };
    curseur.addEventListener('input', appliquerValeurCurseur);
    curseur.addEventListener('change', appliquerValeurCurseur);
    synchroniserCurseurNombreQuestions();
    actualiserEtatBoutonsNombreQuestions(Number(selectNombre.value) || 10, groupe?.dataset.modeSelectionNombre || 'rapide');
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
    const minimumCurseur = 1;
    const pasCurseur = 1;
    let texteDisponibilite = '';

    if (etat.contexteEntrainement === 'sigles') {
        const perimetre = selectPerimetre.value || 'tous';
        nombreMax = obtenirPoolEntrainementMissionSigles(perimetre).length;
        const libellePerimetre = perimetre === 'tous' ? 'Mission Sigles complète' : `l’étape ${Number(perimetre)}`;
        texteDisponibilite = `${nombreMax} sigles disponibles dans ${libellePerimetre}.`;
    } else if (etat.contexteEntrainement === 'mesures') {
        const perimetre = selectPerimetre.value || 'tous';
        nombreMax = obtenirPoolEntrainementMissionMesures(perimetre).length;
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

    const curseur = selectionner('#curseurNombreQuestions');
    if (curseur) {
        curseur.min = String(minimumCurseur);
        curseur.max = String(nombreMax);
        curseur.step = String(pasCurseur);
    }

    const boutonTous = groupeNombre.querySelector('[data-choix-nombre="tous"]');
    if (boutonTous) {
        boutonTous.dataset.valeur = 'tous';
        boutonTous.dataset.nombreMax = String(nombreMax);
        boutonTous.textContent = 'Tous';
        boutonTous.hidden = false;
        boutonTous.disabled = false;
        boutonTous.removeAttribute('aria-disabled');
    }
    groupeNombre.querySelectorAll('.choix-bouton:not([data-choix-nombre="tous"])').forEach(bouton => {
        const disponible = Number(bouton.dataset.valeur) <= nombreMax;
        bouton.hidden = false;
        bouton.disabled = !disponible;
        bouton.setAttribute('aria-disabled', String(!disponible));
    });

    let modeSelection = groupeNombre.dataset.modeSelectionNombre || 'rapide';
    let nombreSelectionne = Number(selectNombre.value) || Math.min(10, nombreMax);
    if (modeSelection === 'tous')
        nombreSelectionne = nombreMax;
    else
        nombreSelectionne = Math.min(nombreMax, Math.max(minimumCurseur, nombreSelectionne));

    if (modeSelection === 'rapide') {
        const raccourciDisponible = [...groupeNombre.querySelectorAll('.choix-bouton:not([data-choix-nombre="tous"])')]
            .some(bouton => !bouton.disabled && Number(bouton.dataset.valeur) === nombreSelectionne);
        if (!raccourciDisponible)
            modeSelection = nombreSelectionne === nombreMax ? 'tous' : 'personnalise';
    }

    garantirOptionNombreQuestions(selectNombre, nombreSelectionne);
    selectNombre.value = String(nombreSelectionne);
    groupeNombre.dataset.modeSelectionNombre = modeSelection;

    const resume = selectionner('#limiteQuestionsEntrainement');
    if (resume)
        resume.textContent = texteDisponibilite;
    synchroniserCurseurNombreQuestions(nombreMax);
    actualiserEtatBoutonsNombreQuestions(nombreSelectionne, modeSelection);
}
function initialiserGroupesChoix() {
    selectionnerTous('[data-groupe-choix]').forEach(groupe => {
        const listeDeroulante = selectionner('#' + groupe.dataset.groupeChoix);
        if (!listeDeroulante)
            return;
        groupe.setAttribute('role', 'group');
        groupe.querySelectorAll('.choix-bouton').forEach(bouton => {
            bouton.setAttribute('aria-pressed', 'false');
            bouton.onclick = () => {
                if (bouton.disabled)
                    return;
                groupe.dataset.selectionEffectuee = 'true';

                if (listeDeroulante.id === 'nombreQuestionsEntrainement') {
                    const valeur = obtenirValeurBoutonNombreQuestions(bouton);
                    if (!Number.isFinite(valeur))
                        return;
                    garantirOptionNombreQuestions(listeDeroulante, valeur);
                    listeDeroulante.value = String(valeur);
                    const mode = bouton.dataset.choixNombre === 'tous' ? 'tous' : 'rapide';
                    groupe.dataset.modeSelectionNombre = mode;
                    synchroniserCurseurNombreQuestions(obtenirMaximumNombreQuestions());
                    actualiserEtatBoutonsNombreQuestions(valeur, mode);
                    envoyerOptionDeJeuAnalytics(`Nombre de questions : ${bouton.textContent.trim() || valeur}`);
                    return;
                }

                listeDeroulante.value = bouton.dataset.valeur;
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
                const nomsOptions = {
                    perimetreEntrainement: 'Périmètre',
                    echelleTexte: 'Taille du texte',
                    sonActif: 'Sons'
                };
                const nomOption = nomsOptions[listeDeroulante.id];
                if (nomOption)
                    envoyerOptionDeJeuAnalytics(`${nomOption} : ${bouton.textContent.trim() || listeDeroulante.value}`);
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
        if (listeDeroulante.id === 'nombreQuestionsEntrainement') {
            actualiserEtatBoutonsNombreQuestions(
                Number(listeDeroulante.value) || 1,
                groupe.dataset.modeSelectionNombre || 'rapide'
            );
            return;
        }
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
