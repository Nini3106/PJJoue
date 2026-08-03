'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const cheminFeuille = process.argv[2];
if (!cheminFeuille) {
    console.error('Usage : node outils/analyser_structure_css.js <feuille.css>');
    process.exit(2);
}

const cheminAbsolu = path.resolve(cheminFeuille);
const exigerPropre = process.argv.includes('--exiger-propre');
const appliquerDeclarations = process.argv.includes('--appliquer-declarations');
const fusionnerMediasAdjacents = process.argv.includes(
    '--fusionner-medias-adjacents'
);
const racine = postcss.parse(
    fs.readFileSync(cheminAbsolu, 'utf8'),
    { from: cheminAbsolu }
);

function normaliserEspaces(texte) {
    return String(texte).trim().replace(/\s+/g, ' ');
}

function obtenirContexte(noeud) {
    const contextes = [];
    let parent = noeud.parent;
    while (parent && parent.type !== 'root') {
        if (parent.type === 'atrule') {
            contextes.unshift(
                `@${parent.name.toLowerCase()} ${normaliserEspaces(parent.params)}`.trim()
            );
        }
        parent = parent.parent;
    }
    return contextes;
}

function appartientAUneAnimation(noeud) {
    return obtenirContexte(noeud).some(contexte => contexte.includes('keyframes'));
}

const conditionsMedia = new Map();
racine.walkAtRules('media', regle => {
    const condition = normaliserEspaces(regle.params);
    if (!conditionsMedia.has(condition))
        conditionsMedia.set(condition, []);
    conditionsMedia.get(condition).push(regle.source.start.line);
});

const declarationsParSignature = new Map();
racine.walkRules(regle => {
    if (appartientAUneAnimation(regle))
        return;
    const contexte = obtenirContexte(regle).join(' | ') || 'global';
    const selecteur = regle.selectors.map(normaliserEspaces).join(', ');
    regle.nodes.forEach(noeud => {
        if (noeud.type !== 'decl')
            return;
        const signature = JSON.stringify({
            contexte,
            selecteur,
            propriete: noeud.prop.toLowerCase(),
            valeur: normaliserEspaces(noeud.value),
            prioritaire: Boolean(noeud.important),
        });
        if (!declarationsParSignature.has(signature))
            declarationsParSignature.set(signature, []);
        declarationsParSignature.get(signature).push({
            noeud,
            description: {
                ligne: noeud.source.start.line,
                propriete: noeud.prop,
                selecteur: regle.selector,
                contexte,
                regleAvecCommentaire: regle.nodes.some(
                    enfant => enfant.type === 'comment'
                ),
            },
        });
    });
});

const declarationsRepetees = [];
const declarationsASupprimer = [];
for (const occurrences of declarationsParSignature.values()) {
    if (occurrences.length < 2)
        continue;
    const derniere = occurrences.at(-1);
    occurrences.slice(0, -1).forEach(occurrence => {
        declarationsASupprimer.push(occurrence.noeud);
        declarationsRepetees.push({
            ...occurrence.description,
            derniereOccurrence: derniere.description.ligne,
        });
    });
}
declarationsRepetees.sort((gauche, droite) => gauche.ligne - droite.ligne);

let reglesVidesSupprimees = 0;
let groupesVidesSupprimes = 0;
if (appliquerDeclarations) {
    const avecCommentaire = declarationsRepetees.filter(
        declaration => declaration.regleAvecCommentaire
    );
    if (avecCommentaire.length > 0) {
        console.error(
            'Nettoyage refusé : une règle concernée contient un commentaire.'
        );
        process.exit(1);
    }
    declarationsASupprimer.forEach(declaration => declaration.remove());
    const reglesVides = [];
    racine.walkRules(regle => {
        if (!regle.nodes.some(noeud => noeud.type !== 'comment'))
            reglesVides.push(regle);
    });
    reglesVides.forEach(regle => {
        regle.remove();
        reglesVidesSupprimees += 1;
    });
    let suppressionEffectuee = true;
    while (suppressionEffectuee) {
        suppressionEffectuee = false;
        const groupesVides = [];
        racine.walkAtRules(regle => {
            if (regle.nodes && regle.nodes.length === 0)
                groupesVides.push(regle);
        });
        groupesVides.forEach(regle => {
            regle.remove();
            groupesVidesSupprimes += 1;
            suppressionEffectuee = true;
        });
    }
    fs.writeFileSync(cheminAbsolu, racine.toString(), 'utf8');
}

const mediasAdjacents = [];
function parcourirConteneur(conteneur) {
    if (!conteneur.nodes)
        return;
    for (let indice = 0; indice < conteneur.nodes.length - 1; indice += 1) {
        const premier = conteneur.nodes[indice];
        if (premier.type !== 'atrule' || premier.name.toLowerCase() !== 'media')
            continue;
        let suivant = indice + 1;
        const commentaires = [];
        while (
            suivant < conteneur.nodes.length
            && conteneur.nodes[suivant].type === 'comment'
        ) {
            commentaires.push(conteneur.nodes[suivant].text.trim());
            suivant += 1;
        }
        const second = conteneur.nodes[suivant];
        if (
            second?.type === 'atrule'
            && second.name.toLowerCase() === 'media'
            && normaliserEspaces(premier.params) === normaliserEspaces(second.params)
        ) {
            mediasAdjacents.push({
                premiereLigne: premier.source.start.line,
                secondeLigne: second.source.start.line,
                condition: normaliserEspaces(premier.params),
                commentairesIntermediaires: commentaires,
            });
        }
    }
    conteneur.nodes.forEach(noeud => parcourirConteneur(noeud));
}
parcourirConteneur(racine);

let blocsMediaFusionnes = 0;
function fusionnerDansConteneur(conteneur) {
    if (!conteneur.nodes)
        return;
    let indice = 0;
    while (indice < conteneur.nodes.length - 1) {
        const premier = conteneur.nodes[indice];
        if (premier.type !== 'atrule' || premier.name.toLowerCase() !== 'media') {
            indice += 1;
            continue;
        }
        let suivant = indice + 1;
        const commentaires = [];
        while (
            suivant < conteneur.nodes.length
            && conteneur.nodes[suivant].type === 'comment'
        ) {
            commentaires.push(conteneur.nodes[suivant]);
            suivant += 1;
        }
        const second = conteneur.nodes[suivant];
        const memeCondition = (
            second?.type === 'atrule'
            && second.name.toLowerCase() === 'media'
            && normaliserEspaces(premier.params) === normaliserEspaces(second.params)
        );
        if (!memeCondition) {
            indice += 1;
            continue;
        }
        commentaires.forEach(commentaire => premier.append(commentaire));
        [...second.nodes].forEach(noeud => premier.append(noeud));
        second.remove();
        blocsMediaFusionnes += 1;
    }
    conteneur.nodes.forEach(noeud => fusionnerDansConteneur(noeud));
}
if (fusionnerMediasAdjacents) {
    fusionnerDansConteneur(racine);
    fs.writeFileSync(cheminAbsolu, racine.toString(), 'utf8');
}

const rapport = {
    feuille: path.relative(process.cwd(), cheminAbsolu).replaceAll('\\', '/'),
    nombreBlocsMedia: [...conditionsMedia.values()]
        .reduce((total, lignes) => total + lignes.length, 0),
    nombreConditionsMedia: conditionsMedia.size,
    conditionsMedia: [...conditionsMedia.entries()]
        .map(([condition, lignes]) => ({condition, nombre: lignes.length, lignes}))
        .sort((gauche, droite) => droite.nombre - gauche.nombre),
    nombreDeclarationsRepetees: declarationsRepetees.length,
    applicationDeclarationsDemandee: appliquerDeclarations,
    reglesVidesSupprimees,
    groupesVidesSupprimes,
    declarationsRepetees,
    nombrePairesMediaAdjacentes: mediasAdjacents.length,
    mediasAdjacents,
    fusionMediasDemandee: fusionnerMediasAdjacents,
    blocsMediaFusionnes,
};
const structurePropre = (
    declarationsRepetees.length === 0
    && mediasAdjacents.length === 0
);
if (exigerPropre && structurePropre) {
    console.log(
        'OK — aucune déclaration répétée ni paire de médias adjacents détectée.'
    );
} else {
    console.log(JSON.stringify(rapport, null, 2));
}
if (exigerPropre && !structurePropre)
    process.exit(1);
