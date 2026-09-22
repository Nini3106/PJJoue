'use strict';
/** Aperçu local uniquement : aucune publication et aucun appel à GitHub. */
const path = require('node:path');
const { spawn } = require('node:child_process');
const url = 'http://127.0.0.1:4173';
const serveur = spawn(process.execPath, [path.join(__dirname, 'serveur-previsualisation.js'), '--host', '127.0.0.1', '--port', '4173'], { cwd: path.join(__dirname, '..'), stdio: ['inherit', 'pipe', 'inherit'] });
let ouvert = false;
serveur.stdout.on('data', donnees => {
    process.stdout.write(donnees);
    if (ouvert || !String(donnees).includes(url)) return;
    ouvert = true;
    const commande = process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    const navigateur = spawn(commande[0], commande[1], { stdio: 'ignore' });
    navigateur.on('error', () => console.log('Ouvre cette adresse dans ton navigateur : '+url));
});
serveur.on('error', erreur => { console.error(erreur.message); process.exitCode = 1; });
serveur.on('exit', code => { process.exitCode = code || 0; });
process.on('SIGINT', () => serveur.kill('SIGINT'));
process.on('SIGTERM', () => serveur.kill('SIGTERM'));
