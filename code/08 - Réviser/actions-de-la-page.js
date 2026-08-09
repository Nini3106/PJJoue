/**
 * Afficher et relancer les erreurs à réviser.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
function afficherEtatVideErreurs(zone, aucunePartieJouee) {
    if (aucunePartieJouee) {
        zone.innerHTML = `
            <div class="carte vide">
                <div class="vide-icone" aria-hidden="true">
                    <svg viewBox="0 0 48 48">
                        <path d="M10 14h18a10 10 0 0 1 10 10v10"/>
                        <path d="m32 28 6 6 6-6"/>
                        <path d="M31 38H20A10 10 0 0 1 10 28v-4"/>
                        <circle cx="10" cy="12" r="4"/>
                        <path d="M18 12h7"/>
                    </svg>
                </div>
                <h2>Tu n’as pas encore joué.</h2>
                <p>Commence une partie avant de pouvoir rejouer tes erreurs.</p>
                <button class="principal" data-action="ouvrir-parcours-depuis-erreurs">
                    Commencer le parcours
                </button>
            </div>`;
        return;
    }
    zone.innerHTML = `
        <div class="carte vide">
            <div class="resultat-icone" aria-hidden="true"></div>
            <h2>Aucune erreur active</h2>
            <p>Pour le moment, tout ce que tu as raté a été retravaillé avec succès.</p>
        </div>`;
}

function obtenirQuestionsAvecErreursActives() {
    return Object.entries(sauvegarde.erreurs || {})
        .filter(([_identifiantQuestion, suiviErreur]) => !suiviErreur.maitrisee)
        .map(([identifiantQuestion, suiviErreur]) => ({
            question: QUESTIONS.find(question => question.id === Number(identifiantQuestion)),
            suiviErreur
        }))
        .filter(element => element.question);
}

function regrouperErreursParEtape(questionsAvecErreurs) {
    const erreursParEtape = {};
    questionsAvecErreurs.forEach(element => {
        const numeroEtape = Number(element.question.etape);
        (erreursParEtape[numeroEtape] = erreursParEtape[numeroEtape] || []).push(element);
    });
    return erreursParEtape;
}

function obtenirNumerosEtapesAvecErreurs(erreursParEtape) {
    return Object.keys(erreursParEtape)
        .sort((etapeA, etapeB) => Number(etapeA) - Number(etapeB));
}

function construireBoutonsRevisionParEtape(erreursParEtape) {
    return obtenirNumerosEtapesAvecErreurs(erreursParEtape)
        .map(numeroEtape => `
            <button class="revision-etape-bouton"
                data-action="reviser-etape" data-etape="${numeroEtape}">
                <span>Étape ${numeroEtape}</span>
                <b>${erreursParEtape[numeroEtape].length}</b>
            </button>`)
        .join('');
}

function construireModesRevisionErreurs(total, erreursParEtape) {
    const libelleErreurs = accorderLibelle(total, 'erreur active', 'erreurs actives');
    const boutonsEtapes = construireBoutonsRevisionParEtape(erreursParEtape);
    return `
        <div class="revision-mode-grille">
            <div class="carte revision-mode-carte revision-toutes-carte">
                <div>
                    <h2>
                        <span class="revision-mode-icone revision-mode-icone-aleatoire"
                            aria-hidden="true">
                            <svg viewBox="0 0 64 64">
                                <path d="M48 20a21 21 0 1 0 4 25"/>
                                <path d="m43 13 6 8 9-5"/>
                                <path d="M25 27a7 7 0 0 1 14 1c0 6-7 6-7 11"/>
                                <circle cx="32" cy="47" r="1.5"/>
                            </svg>
                        </span>
                        <span>Révision aléatoire — Toutes mes erreurs</span>
                    </h2>
                    <p>Mélange tes ${total} ${libelleErreurs}, toutes étapes confondues.</p>
                </div>
                <button class="principal" data-action="reviser-toutes-erreurs">
                    Lancer (${total})
                </button>
            </div>

            <div class="carte revision-mode-carte revision-par-etape-carte">
                <div>
                    <h2>
                        <span class="revision-mode-icone revision-mode-icone-etapes"
                            aria-hidden="true">
                            <svg viewBox="0 0 64 64">
                                <path d="M13 11h34a5 5 0 0 1 5 5v37H18a5 5 0 0 1-5-5z"/>
                                <path d="M18 53a5 5 0 0 1 0-10h34M23 11v32"/>
                                <path d="M32 21h12M32 29h9"/>
                            </svg>
                        </span>
                        <span>Révision par étape — Mes erreurs par étape</span>
                    </h2>
                    <p>Choisis une étape pour retravailler uniquement les erreurs encore actives de cette partie du parcours.</p>
                </div>
                <div class="revision-etape-boutons">${boutonsEtapes}</div>
            </div>
        </div>`;
}

function construireListeErreursEtape(numeroEtape, elements) {
    const cartesErreurs = elements.map(({ question, suiviErreur }) => `
        <div class="erreur-element erreurs-parcours-element">
            <div class="erreurs-parcours-enonce">${question.enonce.split('\\n')[0]}</div>
            <div class="mini">Ratée ${suiviErreur.nombreErreurs || 1} fois · révision ${suiviErreur.reussites || 0}/2</div>
        </div>`).join('');
    return `
        <section class="erreurs-parcours-etape">
            <div class="erreurs-parcours-etape-entete">
                <h4>Étape ${numeroEtape}</h4>
                <span>${elements.length} erreur${elements.length > 1 ? 's' : ''}</span>
            </div>
            <div class="erreurs-parcours-liste">${cartesErreurs}</div>
        </section>`;
}

function construireParcoursErreurs(total, erreursParEtape) {
    const sectionsEtapes = obtenirNumerosEtapesAvecErreurs(erreursParEtape)
        .map(numeroEtape => construireListeErreursEtape(
            numeroEtape,
            erreursParEtape[numeroEtape]
        ))
        .join('');
    const libelleErreurs = accorderLibelle(total, 'erreur active', 'erreurs actives');
    return `
        <div class="carte erreurs-parcours">
            <div class="erreurs-parcours-entete">
                <div>
                    <h2>Parcours PJJ</h2>
                    <p>${total} ${libelleErreurs} dans le parcours.</p>
                </div>
            </div>
            <h3 class="erreurs-parcours-titre">Visualiser mes erreurs</h3>
            <div class="erreurs-parcours-etapes">${sectionsEtapes}</div>
        </div>`;
}

function afficherErreurs() {
    const zone = selectionner('#contenuErreurs');
    const questionsAvecErreurs = obtenirQuestionsAvecErreursActives();
    if (questionsAvecErreurs.length === 0) {
        afficherEtatVideErreurs(zone, !sauvegarde.aDejaJoue);
        return;
    }

    const erreursParEtape = regrouperErreursParEtape(questionsAvecErreurs);
    const total = questionsAvecErreurs.length;
    zone.innerHTML = construireModesRevisionErreurs(total, erreursParEtape)
        + construireParcoursErreurs(total, erreursParEtape);
}

