'use strict';

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const cheminFeuille = process.argv[2];
const appliquer = process.argv.includes('--appliquer');
const exigerPropre = process.argv.includes('--exiger-propre');
if (!cheminFeuille) {
    console.error('Usage : node outils/analyser_doublons_css.js <feuille.css>');
    process.exit(2);
}

const cheminAbsolu = path.resolve(cheminFeuille);
const texteCss = fs.readFileSync(cheminAbsolu, 'utf8');
const racine = postcss.parse(texteCss, { from: cheminAbsolu });

function normaliserEspaces(texte) {
    return String(texte).trim().replace(/\s+/g, ' ');
}

function obtenirContexte(regle) {
    const contextes = [];
    let parent = regle.parent;
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

function obtenirSignature(regle) {
    const noeudsSignificatifs = regle.nodes.filter(noeud => noeud.type !== 'comment');
    if (
        noeudsSignificatifs.length === 0
        || noeudsSignificatifs.some(noeud => noeud.type !== 'decl')
    ) {
        return null;
    }
    const selecteurs = regle.selectors.map(normaliserEspaces);
    const declarations = noeudsSignificatifs.map(declaration => ({
        propriete: declaration.prop.toLowerCase(),
        valeur: normaliserEspaces(declaration.value),
        prioritaire: Boolean(declaration.important),
    }));
    return JSON.stringify({
        contexte: obtenirContexte(regle),
        selecteurs,
        declarations,
    });
}

const groupes = new Map();
racine.walkRules(regle => {
    const signature = obtenirSignature(regle);
    if (!signature)
        return;
    if (!groupes.has(signature))
        groupes.set(signature, []);
    groupes.get(signature).push(regle);
});

const doublons = [];
const reglesASupprimer = [];
for (const occurrences of groupes.values()) {
    if (occurrences.length < 2)
        continue;
    const derniere = occurrences.at(-1);
    for (const regle of occurrences.slice(0, -1)) {
        reglesASupprimer.push(regle);
        doublons.push({
            ligneDebut: regle.source.start.line,
            ligneFin: regle.source.end.line,
            derniereOccurrence: derniere.source.start.line,
            contexte: obtenirContexte(regle).join(' | ') || 'global',
            selecteur: regle.selector,
            contientCommentaire: regle.nodes.some(noeud => noeud.type === 'comment'),
        });
    }
}

doublons.sort((gauche, droite) => gauche.ligneDebut - droite.ligneDebut);
let groupesVidesSupprimes = 0;
if (appliquer) {
    const avecCommentaire = doublons.filter(doublon => doublon.contientCommentaire);
    if (avecCommentaire.length > 0) {
        console.error(
            'Nettoyage refusé : au moins une règle dupliquée contient un commentaire.'
        );
        process.exit(1);
    }
    reglesASupprimer.forEach(regle => regle.remove());
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
const rapport = {
    feuille: path.relative(process.cwd(), cheminAbsolu).replaceAll('\\', '/'),
    nombreDoublons: doublons.length,
    doublonsSansCommentaire: doublons.filter(doublon => !doublon.contientCommentaire).length,
    applicationDemandee: appliquer,
    groupesVidesSupprimes,
    doublons,
};
if (exigerPropre && doublons.length === 0) {
    console.log('OK — aucun doublon CSS strict détecté.');
} else {
    console.log(JSON.stringify(rapport, null, 2));
}
if (exigerPropre && doublons.length > 0)
    process.exit(1);
