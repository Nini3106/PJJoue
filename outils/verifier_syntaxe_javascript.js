'use strict';
/** Vérification syntaxique sans téléchargement ni dépendance de développement. */
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const racine=path.resolve(__dirname,'..');
function fichiers(dossier) {
    return fs.readdirSync(dossier,{withFileTypes:true}).flatMap(entree=> {
        const fichier=path.join(dossier,entree.name);
        return entree.isDirectory()?fichiers(fichier):fichier.endsWith('.js')?[fichier]:[];
    });
}
const liste=['code','ressources','donnees','outils'].flatMap(d=>fichiers(path.join(racine,d)));
liste.push(path.join(racine,'service-worker.js'));
let echecs=0;
for(const fichier of liste) {
    const test=spawnSync(process.execPath,['--check',fichier],{encoding:'utf8'});
    if(test.status!==0) {echecs++;console.error(path.relative(racine,fichier),test.stderr||test.error);}
}
console.log(`${liste.length-echecs}/${liste.length} fichiers JavaScript : syntaxe valide.`);
process.exitCode=echecs?1:0;
