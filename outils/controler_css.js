'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

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
const feuillesInterface = fs.readdirSync(dossierStyles)
    .filter(nom => nom.endsWith('.css'))
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
    for (const feuille of [interfaceComplete, path.resolve('ressources/administration.css')]) {
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
