'use strict';

/**
 * Serveur local réservé aux captures et aux contrôles visuels de PJJoue.
 * Il sert uniquement les fichiers du projet et n’intervient jamais en production.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const racine = path.resolve(__dirname, '..');
const argumentsLigneCommande = process.argv.slice(2);

function lireOption(nom, valeurParDefaut) {
    const position = argumentsLigneCommande.indexOf(nom);
    return position >= 0 && argumentsLigneCommande[position + 1]
        ? argumentsLigneCommande[position + 1]
        : valeurParDefaut;
}

const adresseEcoute = lireOption('--host', '0.0.0.0');
const portEcoute = Number(lireOption('--port', '4173'));
const typesContenu = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.webp': 'image/webp'
};

function resoudreFichier(adresseDemandee) {
    try {
        const cheminDemande = decodeURIComponent(new URL(adresseDemandee, 'http://pjjoue.local').pathname);
        if (cheminDemande.includes('\0'))
            return null;
        const cheminRelatif = cheminDemande.endsWith('/') ? `${cheminDemande}index.html` : cheminDemande;
        const cheminFichier = path.resolve(racine, `.${cheminRelatif}`);
        return cheminFichier.startsWith(`${racine}${path.sep}`) ? cheminFichier : null;
    } catch (_erreur) {
        return null;
    }
}

const serveur = http.createServer((requete, reponse) => {
    const cheminFichier = resoudreFichier(requete.url || '/');
    if (!cheminFichier || !fs.existsSync(cheminFichier) || !fs.statSync(cheminFichier).isFile()) {
        reponse.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        reponse.end('Page introuvable');
        return;
    }
    reponse.writeHead(200, {
        'Content-Type': typesContenu[path.extname(cheminFichier).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
    });
    fs.createReadStream(cheminFichier).pipe(reponse);
});

serveur.listen(portEcoute, adresseEcoute, () => {
    console.log(`Prévisualisation de PJJoue disponible sur le port ${portEcoute}.`);
});
