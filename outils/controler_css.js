'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const postcss = require('postcss');

const mode = process.argv[2];
const analyseurs = {
    doublons: ['analyser_doublons_css.js', '--exiger-propre'],
    structure: ['analyser_structure_css.js', '--exiger-propre'],
};
if (!analyseurs[mode]) {
    console.error('Usage : node outils/controler_css.js doublons|structure');
    process.exit(2);
}

const dossierStyles = path.resolve('ressources/styles');
const feuillePrincipale = path.join(dossierStyles, 'pjjoue-principal.css');
const feuillesInterface = fs.readdirSync(dossierStyles)
    // La feuille principale est contrôlée séparément : elle est produite par le constructeur.
    .filter(nom => nom.endsWith('.css') && nom !== 'pjjoue-principal.css')
    .sort()
    .map(nom => path.join(dossierStyles, nom));
const dossierTemporaire = fs.mkdtempSync(path.join(os.tmpdir(), 'pjjoue-css-'));
const interfaceComplete = path.join(dossierTemporaire, 'interface-complete.css');
fs.writeFileSync(
    interfaceComplete,
    feuillesInterface.map(chemin => fs.readFileSync(chemin, 'utf8')).join(''),
    'utf8'
);

try {
    const [analyseur, option] = analyseurs[mode];
    const feuillesControlees = [
        feuillePrincipale,
        interfaceComplete,
        path.resolve('ressources/administration.css'),
    ];
    const selecteursSemantiques = new Set([
        '.masque',
        '.pjj-consentement[hidden],.pjj-consentement-preferences[hidden]',
    ]);
    const prioritesInterdites = [];
    for (const feuille of feuillesControlees) {
        const racine = postcss.parse(fs.readFileSync(feuille, 'utf8'), { from: feuille });
        racine.walkDecls(declaration => {
            if (!declaration.important) return;
            const selecteur = declaration.parent.selector?.replace(/\s+/g, '') || '';
            const exceptionValide = selecteursSemantiques.has(selecteur)
                && declaration.prop === 'display'
                && declaration.value.trim() === 'none';
            if (!exceptionValide)
                prioritesInterdites.push(`${path.relative(process.cwd(), feuille)}:${declaration.source.start.line}`);
        });
    }
    if (prioritesInterdites.length) {
        console.error(`CSS refusé : priorité forcée non sémantique : ${prioritesInterdites.join(', ')}`);
        process.exit(1);
    }
    for (const feuille of feuillesControlees) {
        const resultat = spawnSync(
            process.execPath,
            [path.resolve('outils', analyseur), feuille, option],
            { stdio: 'inherit' }
        );
        if (resultat.status !== 0)
            process.exit(resultat.status || 1);
    }
} finally {
    fs.rmSync(dossierTemporaire, { recursive: true, force: true });
}
