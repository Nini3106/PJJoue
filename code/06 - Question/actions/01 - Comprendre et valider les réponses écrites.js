/**
 * Comprendre le type de question et valider les réponses écrites avec tolérance.
 *
 * Lis ce fichier comme une histoire : chaque fonction décrit une action visible ou utile.
 * Les mots imposés par JavaScript et le navigateur gardent leur nom technique.
 * Ce fichier est assemblé dans ressources/moteur-jeu.js par le constructeur.
 */
// -----------------------------------------------------------------------------
// Validation des réponses et données communes aux activités
// -----------------------------------------------------------------------------
function obtenirModeQuestion(question) {
    return question?.activite?.type || 'choix-unique';
}
const LIBELLES_MODES_QUESTION = {
    'choix-unique': 'Choix unique',
    'selection-multiple': 'Sélection multiple',
    association: 'Relier',
    eliminer: 'Retirer des choix',
    'reponse-ecrite': 'Réponse écrite',
    'remettre-ordre': 'Remettre dans l’ordre',
    'choisir-ordre': 'Choisir puis ordonner',
    classer: 'Classer'
};
function obtenirLibelleMode(mode) {
    return LIBELLES_MODES_QUESTION[mode] || 'Activité';
}
function preparerSession(questionsInitiales) {
    if (!questionsInitiales?.length)
        return questionsInitiales || [];
    // Banque finale : chaque question conserve strictement son mode éditorial.
    return questionsInitiales.map(question => ({ ...question, modePresentation: question.modePrefere || obtenirModeQuestion(question) }));
}
function normaliserReponseEcrite(texte) {
    return String(texte || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, ' ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}
function normaliserReponseEvaluation(valeur) { return normaliserReponseEcrite(valeur).replace(/\b(le|la|les|un|une|des|du|de|d|l)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
function extraireSiglesSaisis(champ) {
    const mots = normaliserReponseEcrite(champ).split(' ').filter(Boolean);
    const formes = new Set(mots);
    for (let debut = 0; debut < mots.length; debut++) {
        let concatene = '';
        for (let fin = debut; fin < Math.min(mots.length, debut + 6); fin++) {
            if (mots[fin].length !== 1)
                break;
            concatene += mots[fin];
            if (concatene.length >= 2)
                formes.add(concatene);
        }
    }
    return formes;
}
function validerListeSiglesDistincts(champ, question) {
    if (!Array.isArray(question.siglesDistinctsAttendus) || !question.siglesDistinctsAttendus.length)
        return null;
    const formes = extraireSiglesSaisis(champ);
    const nombreTrouves = new Set(
        question.siglesDistinctsAttendus
            .map(compacterSigle)
            .filter(sigle => formes.has(sigle))
    ).size;
    return nombreTrouves >= Number(question.nombreSiglesRequis || question.siglesDistinctsAttendus.length);
}
function compacterSigle(valeur) {
    return normaliserReponseEcrite(valeur).replace(/\s+/g, '');
}
function validerFormeSigle(champ, question) {
    const forme = question.typeReponseAttendue || 'general';
    const saisieCompacte = compacterSigle(champ);
    const sigle = compacterSigle(question.sigleAttendu || question.bonneReponse);
    if (forme === 'sigle') {
        const siglesAcceptes = [question.bonneReponse, ...(question.reponsesAcceptees || [])]
            .map(compacterSigle)
            .filter(Boolean);
        return siglesAcceptes.includes(saisieCompacte);
    }
    if (forme === 'developpement-sigle' && sigle && saisieCompacte === sigle)
        return false;
    return null;
}
function respecteOrdreConcepts(champ, groupes) {
    if (!Array.isArray(groupes) || !groupes.length)
        return true;
    const motsSaisis = normaliserReponseEvaluation(champ).split(' ').filter(Boolean);
    let positionMinimale = 0;
    for (const groupe of groupes) {
        const variantes = Array.isArray(groupe) ? groupe : [groupe];
        let meilleurePosition = -1;
        let meilleureFin = -1;
        for (const variante of variantes) {
            const motsAttendus = normaliserReponseEvaluation(variante).split(' ').filter(Boolean);
            if (!motsAttendus.length)
                continue;
            for (let debut = positionMinimale; debut <= motsSaisis.length - motsAttendus.length; debut++) {
                const correspond = motsAttendus.every((motAttendu, decalage) =>
                    motsCorrespondentSouplement(motsSaisis[debut + decalage], motAttendu)
                );
                if (correspond && (meilleurePosition < 0 || debut < meilleurePosition)) {
                    meilleurePosition = debut;
                    meilleureFin = debut + motsAttendus.length;
                    break;
                }
            }
        }
        if (meilleurePosition < 0)
            return false;
        positionMinimale = meilleureFin;
    }
    return true;
}

const MOTS_NEGATION_REPONSE = new Set([
    'aucun', 'aucune', 'aucuns', 'aucunes', 'jamais', 'n', 'ne', 'ni', 'non', 'pas', 'sans'
]);
function contientExpressionComplete(texte, expression) {
    return (` ${texte} `).includes(` ${expression} `);
}
function contientNegation(texte) {
    return normaliserReponseEvaluation(texte)
        .split(' ')
        .some(mot => MOTS_NEGATION_REPONSE.has(mot));
}
function contientNegationInattendue(champ, variantesAttendues) {
    return contientNegation(champ)
        && !variantesAttendues.some(variante => contientNegation(variante));
}
function calculerDistanceTextes(texteA, texteB) {
    if (texteA === texteB)
        return 0;
    if (!texteA.length)
        return texteB.length;
    if (!texteB.length)
        return texteA.length;
    const lignePrecedente = Array.from({ length: texteB.length + 1 }, (_valeur, indice) => indice);
    const ligneCourante = new Array(texteB.length + 1);
    for (let indiceA = 1; indiceA <= texteA.length; indiceA++) {
        ligneCourante[0] = indiceA;
        for (let indiceB = 1; indiceB <= texteB.length; indiceB++) {
            const coutRemplacement = texteA[indiceA - 1] === texteB[indiceB - 1] ? 0 : 1;
            ligneCourante[indiceB] = Math.min(
                ligneCourante[indiceB - 1] + 1,
                lignePrecedente[indiceB] + 1,
                lignePrecedente[indiceB - 1] + coutRemplacement
            );
        }
        for (let indiceB = 0; indiceB <= texteB.length; indiceB++)
            lignePrecedente[indiceB] = ligneCourante[indiceB];
    }
    return lignePrecedente[texteB.length];
}
function obtenirMotsSignificatifsReponse(texte) {
    const motsVides = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'd', 'l', 'et', 'ou', 'a', 'au', 'aux',
        'en', 'dans', 'pour', 'par', 'sur', 'avec', 'sans', 'est', 'sont', 'etre', 'elle', 'il',
        'qui', 'que', 'ce', 'cette', 'ces', 'se', 'sa', 'son', 'ses'
    ]);
    return normaliserReponseEvaluation(texte)
        .split(' ')
        .filter(mot => mot.length > 1 && !motsVides.has(mot));
}
function obtenirRacineSouple(mot) {
    let racine = String(mot || '');
    const terminaisons = [
        'issements', 'issement', 'atrices', 'ateurs', 'atrice', 'ateur',
        'iquement', 'ements', 'ement', 'ations', 'ation', 'itions', 'ition',
        'aires', 'aire', 'alites', 'alite', 'ilites', 'ilite', 'ites', 'ite',
        'iennes', 'ienne', 'iels', 'iel', 'ives', 'ive', 'ifs', 'if',
        'euses', 'euse', 'eux', 'iques', 'ique', 'istes', 'iste',
        'elles', 'elle', 'aux', 'ales', 'ale', 'es', 's', 'x', 'e'
    ];
    for (const terminaison of terminaisons) {
        if (racine.length - terminaison.length >= 5 && racine.endsWith(terminaison)) {
            racine = racine.slice(0, -terminaison.length);
            break;
        }
    }
    return racine;
}
function motsCorrespondentSouplement(motSaisi, motAttendu) {
    if (motSaisi === motAttendu)
        return true;
    const longueurMaximale = Math.max(motSaisi.length, motAttendu.length);
    if (longueurMaximale >= 4) {
        const tolerance = longueurMaximale >= 9 ? 2 : 1;
        if (calculerDistanceTextes(motSaisi, motAttendu) <= tolerance)
            return true;
    }
    const racineSaisie = obtenirRacineSouple(motSaisi);
    const racineAttendue = obtenirRacineSouple(motAttendu);
    if (racineSaisie.length >= 5 && racineAttendue.length >= 5) {
        if (racineSaisie === racineAttendue)
            return true;
        if (calculerDistanceTextes(racineSaisie, racineAttendue) <= 1)
            return true;
        const longueurCommune = Math.min(racineSaisie.length, racineAttendue.length);
        const seuilPrefixe = Math.max(5, Math.ceil(longueurCommune * .78));
        if (racineSaisie.slice(0, seuilPrefixe) === racineAttendue.slice(0, seuilPrefixe))
            return true;
    }
    return false;
}
function compterMotsAttendusPresents(motsSaisis, motsAttendus) {
    const dejaUtilises = new Set();
    let correspondances = 0;
    for (const motAttendu of motsAttendus) {
        const indice = motsSaisis.findIndex((motSaisi, position) =>
            !dejaUtilises.has(position) && motsCorrespondentSouplement(motSaisi, motAttendu)
        );
        if (indice >= 0) {
            dejaUtilises.add(indice);
            correspondances++;
        }
    }
    return correspondances;
}
function correspondAVarianteEvaluation(champ, variante) {
    const reponseSaisie = normaliserReponseEvaluation(champ);
    const reponseAttendue = normaliserReponseEvaluation(variante);
    if (!reponseSaisie || !reponseAttendue)
        return false;
    if (reponseSaisie === reponseAttendue || contientExpressionComplete(reponseSaisie, reponseAttendue))
        return true;
    const motsSaisis = obtenirMotsSignificatifsReponse(reponseSaisie);
    const motsAttendus = obtenirMotsSignificatifsReponse(reponseAttendue);
    if (!motsAttendus.length)
        return false;
    const correspondances = compterMotsAttendusPresents(motsSaisis, motsAttendus);
    const minimum = motsAttendus.length === 1
        ? 1
        : Math.max(2, Math.ceil(motsAttendus.length * .6));
    return correspondances >= minimum;
}
function validerReponseEcriteEvaluation(champ, question) {
    const controleForme = validerFormeSigle(champ, question);
    if (controleForme !== null)
        return controleForme;
    const controleListeSigles = validerListeSiglesDistincts(champ, question);
    if (controleListeSigles !== null)
        return controleListeSigles;
    const reponseNormalisee = normaliserReponseEvaluation(champ);
    if (!reponseNormalisee)
        return false;
    if (question.sigleSeulRefuse && reponseNormalisee === normaliserReponseEvaluation(question.sigleSeulRefuse))
        return false;
    const reponsesDeclarees = [
        question.bonneReponse,
        ...(Array.isArray(question.reponsesAcceptees) ? question.reponsesAcceptees : [])
    ].filter(Boolean);
    const groupesConcepts = Array.isArray(question.conceptsEvaluation) ? question.conceptsEvaluation : [];
    const variantesAttendues = [
        ...reponsesDeclarees,
        ...groupesConcepts.flatMap(groupe => Array.isArray(groupe) ? groupe : [])
    ];
    if (contientNegationInattendue(champ, variantesAttendues))
        return false;
    const expressionsInterditesExactes = Array.isArray(question.expressionsInterditesExactes)
        ? question.expressionsInterditesExactes
        : [];
    const contientExpressionInterditeExacte = expressionsInterditesExactes.some(expression => {
        const expressionNormalisee = normaliserReponseEvaluation(expression);
        return expressionNormalisee && reponseNormalisee === expressionNormalisee;
    });
    if (contientExpressionInterditeExacte)
        return false;
    const conceptsInterdits = Array.isArray(question.conceptsInterdits) ? question.conceptsInterdits : [];
    const contientConceptInterdit = conceptsInterdits.some(groupe => {
        const variantes = Array.isArray(groupe) ? groupe : [groupe];
        return variantes.some(variante => correspondAVarianteEvaluation(champ, variante));
    });
    if (contientConceptInterdit)
        return false;
    const correspondanceDeclaree = reponsesDeclarees.some(variante => correspondAVarianteEvaluation(champ, variante));
    const correspondanceDeclareeExacte = reponsesDeclarees.some(variante => {
        const reponseAttendue = normaliserReponseEvaluation(variante);
        return reponseNormalisee === reponseAttendue || contientExpressionComplete(reponseNormalisee, reponseAttendue);
    });
    if (!groupesConcepts.length)
        return correspondanceDeclaree;
    if (correspondanceDeclareeExacte)
        return true;
    const nombreCorrespondances = groupesConcepts.filter(groupe =>
        Array.isArray(groupe) && groupe.some(variante => correspondAVarianteEvaluation(champ, variante))
    ).length;
    if (nombreCorrespondances < Number(question.nombreConceptsRequis || groupesConcepts.length))
        return false;
    return respecteOrdreConcepts(champ, question.conceptsOrdonnes);
}
function validerReponseEcriteSouple(champ, question) {
    // La même compréhension sémantique est appliquée pendant l'apprentissage et l'évaluation.
    // Les accents, accords, pluriels, variantes morphologiques et petites fautes sont tolérés,
    // mais les négations inattendues et les réponses qui ne contiennent pas assez de concepts restent refusées.
    return validerReponseEcriteEvaluation(champ, question);
}
