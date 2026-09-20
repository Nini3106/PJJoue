/**
 * Mission Sigles — mini-PJJoue V1.
 *
 * Principe pédagogique : un sigle n'est jamais demandé seul avant d'avoir été
 * introduit dans une activité antérieure avec son développement complet.
 * Il n'existe donc plus d'écran qui donne les réponses avant de jouer.
 */
const ETAPES_MISSION_SIGLES = Object.freeze({
    1: { numero:'01', titre:'Enquête et premiers repères', sousTitre:'Parcours 1 · De l’enquête à la sanction', domaine:'cjpm', couleur:'#d49a00', couleurTexte:'#ffd36a', couleurRgb:'212,154,0', icone:'justice' },
    2: { numero:'02', titre:'Instruction et mesures de sûreté', sousTitre:'Parcours 2 · Information judiciaire', domaine:'cjpm', couleur:'#0891b2', couleurTexte:'#70d7ea', couleurRgb:'8,145,178', icone:'justice' },
    3: { numero:'03', titre:'Jugement et réponse éducative', sousTitre:'Parcours 3 · Du jugement à la sanction', domaine:'cjpm', couleur:'#8b5cf6', couleurTexte:'#c7afff', couleurRgb:'139,92,246', icone:'mesures' },
    4: { numero:'04', titre:'Matière criminelle et garanties', sousTitre:'Parcours 4 · Crimes, peines et droits', domaine:'cjpm', couleur:'#e11d48', couleurTexte:'#ff91a8', couleurRgb:'225,29,72', icone:'justice' },
    5: { numero:'05', titre:'Application et exécution des peines', sousTitre:'Parcours 5 · Après la sanction', domaine:'cjpm', couleur:'#0f766e', couleurTexte:'#70d6ca', couleurRgb:'15,118,110', icone:'mesures' },
    6: { numero:'01', titre:'Organisation de la PJJ', sousTitre:'Directions, fonctions et pilotage', domaine:'pjj', etapePjj:5, ...obtenirCouleursEtapePJJ(5), icone:'organisation' },
    7: { numero:'02', titre:'Services, unités et formation', sousTitre:'Milieu ouvert, insertion et formation', domaine:'pjj', etapePjj:6, ...obtenirCouleursEtapePJJ(6), icone:'services' },
    8: { numero:'03', titre:'Placement et détention', sousTitre:'Structures et dispositifs de placement', domaine:'pjj', etapePjj:9, ...obtenirCouleursEtapePJJ(9), icone:'placement' },
    9: { numero:'04', titre:'Partenaires et repères professionnels', sousTitre:'Protection de l’enfance et accompagnement', domaine:'pjj', etapePjj:11, ...obtenirCouleursEtapePJJ(11), icone:'partenaires' }
});
function obtenirDomaineSigles() { return obtenirSauvegardeJeuSigles().domaine || 'cjpm'; }
function libelleDomaineSigles(domaine=obtenirDomaineSigles()) { return {cjpm:'CJPM',pjj:'PJJ',tous:'CJPM et PJJ'}[domaine] || 'CJPM'; }
function obtenirPoolDomaineSigles(domaine=obtenirDomaineSigles()) { return SIGLES.filter(x => domaine === 'tous' || x.domaine === domaine); }
function numerosEtapesSigles(domaine=obtenirDomaineSigles()) { return Object.keys(ETAPES_MISSION_SIGLES).map(Number).filter(n => domaine === 'tous' || ETAPES_MISSION_SIGLES[n].domaine === domaine); }
function obtenirEvaluationSigles(domaine=obtenirDomaineSigles()) {
    const jeu=obtenirSauvegardeJeuSigles();
    if(domaine==='tous') return jeu.evaluation;
    jeu.evaluations ||= {};
    jeu.evaluations[domaine] ||= {meilleurScore:0,nombreTentatives:0,reussie:false};
    return jeu.evaluations[domaine];
}
function choisirDomaineSigles(domaine) {
    if(!['cjpm','pjj','tous'].includes(domaine)) return;
    obtenirSauvegardeJeuSigles().domaine=domaine;
    etatJeuSigles.tirageHasard=[];
    selectionnerSigles('#siglesJouerTirage')?.classList.add('masque');
    enregistrerSauvegarde(); actualiserAccueilSigles();
    construireRevisionMissionSiglesIndependante();
}
function actualiserChoixDomaineSigles() {
    selectionnerTousSigles('[data-choix-domaine-sigles]').forEach(zone => {
        zone.innerHTML=['cjpm','pjj','tous'].map(d => `<button type="button" class="choix-bouton${d===obtenirDomaineSigles()?' actif':''}" data-domaine-sigles="${d}" aria-pressed="${d===obtenirDomaineSigles()}"><b>${d==='tous'?'Tous':`Sigles ${libelleDomaineSigles(d)}`}</b><span>${obtenirPoolDomaineSigles(d).length} sigles · ${d==='cjpm'?'les 5 parcours':d==='pjj'?'option PJJ':'les deux domaines'}</span></button>`).join('');
        zone.querySelectorAll('button').forEach(b => b.addEventListener('click',()=>choisirDomaineSigles(b.dataset.domaineSigles)));
    });
}
const SEUIL_EVALUATION_SIGLES = 90;
const NOMBRE_QUESTIONS_EVALUATION_SIGLES = 30;

function creerEtatJeuSigles() {
    return {
        vue: 'accueil', mode: null, etape: null, titreSession: '',
        siglesSession: [], questions: [], indexQuestion: 0, score: 0,
        reponsesAutonomes: 0, reponsesAidees: 0, reponsesIncorrectes: 0,
        questionsPassees: 0, tentativesQuestion: 0, aideUtilisee: false,
        jokersActifs: true, questionValidee: false, configurationDerniereSession: null,
        tirageHasard: [], nombreTire: 0,
        chronoActif: false, secondesQuestion: 30, chronoRestant: 30, chronoIntervalle: null,
        celebrationEtapeADiffuser: null, evaluationReussie: false, evaluationParfaite: false
    };
}
let etatJeuSigles = creerEtatJeuSigles();

function selectionnerSigles(selecteur) { return document.querySelector(selecteur); }
function selectionnerTousSigles(selecteur) { return [...document.querySelectorAll(selecteur)]; }
function normaliserSigleJeu(sigle) { return String(sigle || '').trim().toUpperCase(); }
function obtenirSauvegardeJeuSigles() {
    if (!sauvegarde.siglesJeu) sauvegarde.siglesJeu = creerProgressionSiglesInitiale();
    return sauvegarde.siglesJeu;
}
function obtenirSigleJeu(sigle) { const cle = normaliserSigleJeu(sigle); return SIGLES.find(element => normaliserSigleJeu(element.sigle) === cle) || null; }
function obtenirSiglesEtape(numero) { return SIGLES.filter(element => Number(element.etape) === Number(numero)).sort((a,b) => Number(a.id)-Number(b.id)); }
function melangerSigles(tableau) {
    const copie = [...tableau];
    for (let i = copie.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copie[i], copie[j]] = [copie[j], copie[i]]; }
    return copie;
}
function choisirSansDoublon(tableau, nombre) { return melangerSigles(tableau).slice(0, Math.min(Math.max(0, nombre), tableau.length)); }
function sigleEstIntroduit(sigle) { return obtenirSauvegardeJeuSigles().decouverts[normaliserSigleJeu(sigle)] === true; }
function marquerSigleIntroduit(sigle) { obtenirSauvegardeJeuSigles().decouverts[normaliserSigleJeu(sigle)] = true; }
function obtenirEtatEtapeSigles(numero) {
    const jeu = obtenirSauvegardeJeuSigles(); const cle = String(numero);
    if (!jeu.etapes[cle]) jeu.etapes[cle] = creerProgressionSiglesInitiale().etapes[cle];
    return jeu.etapes[cle];
}
function compterMaitrisesEtapeSigles(numero) {
    const etape = obtenirEtatEtapeSigles(numero);
    return obtenirSiglesEtape(numero).filter(element => etape.autonomes[normaliserSigleJeu(element.sigle)] === true).length;
}
function compterValidationsSansJokerEtapeSigles(numero) {
    const etape = obtenirEtatEtapeSigles(numero);
    return obtenirSiglesEtape(numero).filter(element => etape.validationsSansJoker[normaliserSigleJeu(element.sigle)] === true).length;
}
function etapeSiglesMaitrisee(numero) { return compterMaitrisesEtapeSigles(numero) === obtenirSiglesEtape(numero).length; }
function evaluationSiglesDebloquee() { return numerosEtapesSigles().every(etapeSiglesMaitrisee); }
function obtenirErreursSiglesActives(domaine=obtenirDomaineSigles()) {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs || {};
    return Object.entries(erreurs).filter(([,e]) => e?.active === true).map(([sigle]) => obtenirSigleJeu(sigle)).filter(c => c && (domaine==='tous' || c.domaine===domaine));
}
function obtenirSiglesNonMaitrisesEtape(numero) {
    const etape = obtenirEtatEtapeSigles(numero);
    return obtenirSiglesEtape(numero).filter(cible =>
        sigleEstIntroduit(cible.sigle)
        && etape.autonomes[normaliserSigleJeu(cible.sigle)] !== true
    );
}
function obtenirCiblesARejouerEtapeSigles(numero) {
    const cibles = [...obtenirErreursSiglesActives('tous').filter(cible => Number(cible.etape) === Number(numero)), ...obtenirSiglesNonMaitrisesEtape(numero)];
    return [...new Map(cibles.map(cible => [normaliserSigleJeu(cible.sigle), cible])).values()];
}
function enregistrerErreurSigles(cibles, motifRevision = 'incorrecte') {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserSigleJeu(cible.sigle);
        const actuelle = erreurs[cle] || { active:false, nombreErreurs:0, reussitesRevision:0 };
        erreurs[cle] = { ...actuelle, active:true, motifRevision, nombreErreurs:Number(actuelle.nombreErreurs || 0) + (motifRevision === 'incorrecte' ? 1 : 0), reussitesRevision:motifRevision === 'reprise' ? 1 : 0 };
    });
}
function validerRevisionSigles(cibles) {
    const erreurs = obtenirSauvegardeJeuSigles().erreurs;
    cibles.forEach(cible => {
        const cle = normaliserSigleJeu(cible.sigle);
        const actuelle = erreurs[cle];
        if (!actuelle?.active) return;
        // Une nouvelle réussite autonome suffit, dans tous les modes de jeu.
        actuelle.reussitesRevision = 1;
        actuelle.active = false;
        actuelle.motifRevision = null;
    });
}

function iconeEtapeSigles(type) {
    const formes = {
        organisation:'<path d="M4 19h16M7 16V9h10v7M9 9V5h6v4M10 12h4"/>',
        services:'<path d="M4 20h16M6 20V8h12v12M9 8V4h6v4M9 12h2M13 12h2M9 16h2M13 16h2"/>',
        placement:'<path d="M4 11 12 5l8 6v9H4zM8 20v-6h8v6M9 10h6"/>',
        justice:'<path d="M12 4v16M6 7h12M7 7l-3 6h6zM17 7l-3 6h6zM8 20h8"/>',
        mesures:'<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6zM9 12l2 2 4-5"/>',
        partenaires:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-4 2-6 5-6s5 2 5 6M11 20c0-3 2-5 5-5s5 2 5 5"/>'
    };
    return `<svg viewBox="0 0 24 24" focusable="false">${formes[type] || formes.organisation}</svg>`;
}
function afficherVueSigles(nom) {
    const vues = { accueil:'#siglesAccueil', parcours:'#siglesParcoursVue', entrainement:'#siglesEntrainementVue', session:'#siglesSession', bilan:'#siglesBilan' };
    Object.entries(vues).forEach(([cle,selecteur]) => selectionnerSigles(selecteur)?.classList.toggle('masque', cle !== nom));
    etatJeuSigles.vue = nom;
    if (nom !== 'session') arreterChronoSigles();
    window.scrollTo?.({ top:0, behavior:'smooth' });
}

function actualiserAccueilSigles() {
    const jeu = obtenirSauvegardeJeuSigles();
    const pool=obtenirPoolDomaineSigles();
    const introduits = pool.filter(x=>jeu.decouverts[x.sigle]).length;
    actualiserChoixDomaineSigles();
    selectionnerSigles('#siglesTitreProgression').textContent=`${libelleDomaineSigles()} · ${pool.length} sigles`;
    selectionnerSigles('#siglesTitreEtapes').textContent=`${libelleDomaineSigles()} · ${numerosEtapesSigles().length} étapes`;
    selectionnerSigles('#siglesDescriptionParcours').textContent=`${numerosEtapesSigles().length} étapes progressives pour apprendre les ${pool.length} sigles ${libelleDomaineSigles()}.`;
    if(!etatJeuSigles.tirageHasard.length) selectionnerSigles('#siglesDeResultat').textContent=`Lance le dé pour tirer de 1 à 6 questions parmi les ${pool.length} sigles ${libelleDomaineSigles()}.`;
    const maitrises = numerosEtapesSigles().reduce((total,n) => total + compterMaitrisesEtapeSigles(n), 0);
    const etapes = numerosEtapesSigles().filter(etapeSiglesMaitrisee).length;
    const erreurs = obtenirErreursSiglesActives().length;
    const pourcentage = Math.round(maitrises / pool.length * 100);
    if (selectionnerSigles('#siglesResumeProgression')) selectionnerSigles('#siglesResumeProgression').textContent = `${maitrises} sigle${maitrises===1?'':'s'} maîtrisé${maitrises===1?'':'s'} · ${etapes} étape${etapes===1?'':'s'} maîtrisée${etapes===1?'':'s'}`;
    if (selectionnerSigles('#siglesNombreDecouverts')) selectionnerSigles('#siglesNombreDecouverts').textContent = introduits;
    if (selectionnerSigles('#siglesNombreMaitrises')) selectionnerSigles('#siglesNombreMaitrises').textContent = maitrises;
    if (selectionnerSigles('#siglesNombreErreurs')) selectionnerSigles('#siglesNombreErreurs').textContent = erreurs;
    if (selectionnerSigles('#siglesMeilleurScore')) selectionnerSigles('#siglesMeilleurScore').textContent = `${obtenirEvaluationSigles().meilleurScore || 0}%`;
    if (selectionnerSigles('#siglesJaugeValeur')) selectionnerSigles('#siglesJaugeValeur').style.width = `${pourcentage}%`;
    if (selectionnerSigles('#siglesProgressionGlobale')) selectionnerSigles('#siglesProgressionGlobale').setAttribute('aria-valuenow', String(pourcentage));
    if (selectionnerSigles('#siglesTexteRevision')) selectionnerSigles('#siglesTexteRevision').textContent = erreurs ? `${erreurs} sigle${erreurs===1?'':'s'} à consolider.` : 'Aucun sigle à revoir pour le moment.';
    construireCartesEtapesSigles(); actualiserCarteEvaluationSigles(); construireChoixPerimetreSigles();
}
function construireCartesEtapesSigles() {
    const zone = selectionnerSigles('#siglesEtapes'); if (!zone) return;
    zone.dataset.domaine = obtenirDomaineSigles();
    zone.innerHTML = numerosEtapesSigles().map(numero => {
        const identite = ETAPES_MISSION_SIGLES[numero]; const maitrises = compterMaitrisesEtapeSigles(numero); const sansJoker = compterValidationsSansJokerEtapeSigles(numero); const nombre = obtenirSiglesEtape(numero).length; const pc = Math.round(maitrises/nombre*100);
        const erreurs = obtenirCiblesARejouerEtapeSigles(numero).length;
        const etoile = sansJoker === obtenirSiglesEtape(numero).length ? creerEtoileFilanteProgression() : '';
        const revision = `<button class="sigles-etape-revision" data-action="reviser-etape-sigles" data-etape="${numero}" type="button"${erreurs ? '' : ' disabled'}>${erreurs ? '↻ Consolider mes réponses' : 'Aucune question à consolider'}${erreurs ? ` <strong>${erreurs}</strong>` : ''}</button>`;
        return `<article class="sigles-etape-carte" data-sigles-etape="${numero}" style="--sigles-etape-accent:${identite.couleur};--sigles-etape-accent-lisible:${identite.couleurTexte};--sigles-etape-rgb:${identite.couleurRgb}"><button class="sigles-etape-ouvrir" data-sigles-etape="${numero}" type="button"><span class="sigles-etape-carte-entete"><span class="sigles-etape-icone" aria-hidden="true">${iconeEtapeSigles(identite.icone)}</span><span class="sigles-etape-numero">${libelleDomaineSigles(identite.domaine)} · ÉTAPE ${identite.numero}</span>${etoile}</span><h3>${identite.titre}</h3><p>${identite.sousTitre}<br>${nombre} sigles · ${nombre*2} activités de parcours.</p><span class="sigles-etape-progression"><i style="width:${pc}%"></i></span><span class="sigles-etape-pied"><span>${maitrises}/${nombre} bonnes réponses · ${sansJoker}/${nombre} sans joker</span><span>${maitrises===nombre?'Maîtrisée ✓':'Ouvrir →'}</span></button>${revision}</article>`;
    }).join('');
    zone.querySelectorAll('.sigles-etape-ouvrir').forEach(b => b.addEventListener('click', () => lancerEtapeSigles(Number(b.dataset.siglesEtape))));
}
function actualiserCarteEvaluationSigles() {
    const bouton = selectionnerSigles('#siglesLancerEvaluation'); const carte = selectionnerSigles('#siglesEvaluationCarte'); const statut = selectionnerSigles('#siglesEvaluationStatut'); const ok = evaluationSiglesDebloquee();
    if (bouton) { bouton.disabled = !ok; bouton.textContent = ok ? 'Commencer l’évaluation' : `Maîtrise les ${numerosEtapesSigles().length} étapes ${libelleDomaineSigles()}`; }
    carte?.classList.toggle('verrouillee', !ok);
    if (statut) statut.textContent = ok ? 'Évaluation débloquée.' : `Disponible après la maîtrise des ${numerosEtapesSigles().length} étapes ${libelleDomaineSigles()}.`;
}
function construireChoixPerimetreSigles() {
    const zone = selectionnerSigles('#siglesChoixPerimetre'); if (!zone) return;
    const actuel = zone.querySelector('[aria-pressed="true"]')?.dataset.perimetre || 'tous';
    zone.innerHTML = `<button class="choix-bouton entrainement-perimetre-global" data-perimetre="tous" type="button" style="--parcours-accent:#4f8cff;--parcours-accent-lisible:#9fc2ff;--parcours-accent-rgb:79,140,255"><b>Tous les sigles</b><span>Les ${numerosEtapesSigles().length} étapes</span></button>` + numerosEtapesSigles().map(n => { const e=ETAPES_MISSION_SIGLES[n]; return `<button class="choix-bouton" data-perimetre="${n}" type="button" style="--parcours-accent:${e.couleur};--parcours-accent-lisible:${e.couleurTexte};--parcours-accent-rgb:${e.couleurRgb}"><b>${e.numero} · ${e.titre}</b><span>${obtenirSiglesEtape(n).length} sigles</span></button>`; }).join('');
    zone.querySelectorAll('button').forEach(b => { const actif = b.dataset.perimetre === actuel; b.classList.toggle('actif', actif); b.setAttribute('aria-pressed', actif?'true':'false'); b.addEventListener('click', () => { activerBoutonGroupeSigles(zone,b); actualiserDisponibiliteNombreSigles(); }); });
    actualiserDisponibiliteNombreSigles();
}
function activerBoutonGroupeSigles(zone, bouton) { zone?.querySelectorAll('button').forEach(b => { const actif=b===bouton; b.classList.toggle('actif',actif); b.setAttribute('aria-pressed',actif?'true':'false'); }); }
function valeurGroupeSigles(selecteur, attribut, defaut) { const actif = selectionnerSigles(`${selecteur} button[aria-pressed="true"]`); return actif?.dataset?.[attribut] ?? defaut; }
function actualiserDisponibiliteNombreSigles() {
    const perimetre = valeurGroupeSigles('#siglesChoixPerimetre','perimetre','tous'); const max = obtenirPoolEntrainementMissionSigles(perimetre).length; const info=selectionnerSigles('#siglesNombreDisponible'); if(info) info.textContent=`${max} sigles disponibles dans ce périmètre.`;
    const zone=selectionnerSigles('#siglesChoixNombre'); if(!zone)return; let actif=zone.querySelector('[aria-pressed="true"]');
    zone.querySelectorAll('button').forEach(b=>{ const n=b.dataset.nombre==='tous'?max:Number(b.dataset.nombre); b.disabled=n>max; });
    if (actif?.disabled) { actif = [...zone.querySelectorAll('button:not(:disabled)')].pop(); if(actif) activerBoutonGroupeSigles(zone,actif); }
}
function actualiserChoixChronoSigles() { const avec = valeurGroupeSigles('#siglesChoixChrono','chrono','non') === 'oui'; selectionnerSigles('#siglesChoixSecondes')?.classList.toggle('masque', !avec); }

function creerFauxDeveloppementsIntroduction(cible, nombre=3) {
    const vrai = String(cible.signification || '').trim();
    const remplacements = [
        ['Protection', ['Prévention','Accompagnement','Coordination']],
        ['Direction', ['Délégation','Division','Mission']],
        ['Unité', ['Service','Équipe','Pôle']],
        ['Service', ['Unité','Mission','Pôle']],
        ['Établissement', ['Service','Centre','Unité']],
        ['Etablissement', ['Service','Centre','Unité']],
        ['Centre', ['Service','Établissement','Unité']],
        ['Mesure', ['Mission','Modalité','Dispositif']],
        ['Mise', ['Phase','Période','Mesure']],
        ['Juge', ['Magistrat','Tribunal','Délégué']],
        ['Cour', ['Tribunal','Chambre','Commission']],
        ['Tribunal', ['Commission','Chambre','Service']],
        ['Contrôle', ['Suivi','Cadre','Accompagnement']],
        ['Détention', ['Placement','Rétention','Hébergement']],
        ['Secteur', ['Service','Pôle','Dispositif']],
        ['Aménagement', ['Application','Adaptation','Exécution']],
        ['Assignation', ['Placement','Convocation','Admission']],
        ['Assistance', ['Accompagnement','Intervention','Aide']],
        ['Aide', ['Action','Assistance','Protection']],
        ['Correspondant', ['Référent','Responsable','Chargé']],
        ['Justice', ['Médiation','Action','Intervention']],
        ['Placement', ['Hébergement','Accompagnement','Accueil']],
        ['Quartier', ['Unité','Secteur','Espace']],
        ['Semi-Liberté', ['Liberté surveillée','Placement extérieur','Sortie encadrée']],
        ['Référent', ['Responsable','Correspondant','Chargé']],
        ['Responsable', ['Référent','Directeur','Correspondant']],
        ['Directeur', ['Référent','Responsable','Coordonnateur']],
        ['Directeurs', ['Référents','Responsables','Coordonnateurs']],
        ['Mission', ['Service','Dispositif','Programme']],
        ['Recueil', ['Rapport','Relevé','Dossier']],
        ['Officier', ['Agent','Responsable','Inspecteur']],
        ['Convocation', ['Notification','Citation','Décision']],
        ['Ordonnance', ['Décision','Mesure','Notification']],
        ['Travail', ['Service','Activité','Emploi']],
        ['Sursis', ['Suivi','Régime','Contrôle']],
        ['Administration', ['Direction','Organisation','Service']],
        ['Mineurs', ['Jeunes','Enfants','Adolescents']],
        ['Projet', ['Programme','Parcours','Plan']],
        ['Pôle', ['Service','Unité','Secteur']],
        ['Suivi', ['Accompagnement','Contrôle','Parcours']],
        ['École', ['Institut','Centre','Service']]
    ];
    const faux = [];
    const ajouter = texte => { const t=String(texte||'').trim(); if(t && t!==vrai && !faux.includes(t)) faux.push(t); };
    for (const [mot, variantes] of remplacements) {
        if (!vrai.includes(mot)) continue;
        variantes.forEach(variante => ajouter(vrai.replace(mot,variante)));
        if (faux.length >= nombre) break;
    }
    // Repli lexical : on modifie un qualificatif courant sans introduire un autre sigle.
    const qualifs = [
        ['judiciaire',['juridique','administrative','éducative']],
        ['éducative',['sociale','judiciaire','administrative']],
        ['territorial',['régional','départemental','local']],
        ['territoriale',['régionale','départementale','locale']],
        ['provisoire',['temporaire','préalable','initiale']],
        ['associatif',['territorial','public','éducatif']]
    ];
    for (const [mot, variantes] of qualifs) {
        if (faux.length >= nombre) break;
        if (!vrai.toLowerCase().includes(mot.toLowerCase())) continue;
        const re = new RegExp(mot,'i');
        variantes.forEach(v => ajouter(vrai.replace(re,v)));
    }
    while (faux.length < nombre) ajouter(`${vrai} complémentaire ${faux.length+1}`);
    return faux.slice(0,nombre);
}
function significationMissionSigles(cible) { return String(cible?.significationJeu || cible?.signification || '').trim(); }
function creerQuestionIntroductionSigles(cible) {
    const faux = Array.isArray(cible.distracteursIntroduction) ? cible.distracteursIntroduction.map(String) : [];
    if (faux.length !== 3 || new Set(faux.map(x=>x.trim().toLowerCase())).size !== 3) throw new Error(`Mission Sigles : trois distracteurs uniques sont requis pour ${cible.sigle}.`);
    const consigne = String(cible.questionIntroduction || '').trim();
    if (!consigne) throw new Error(`Mission Sigles : question d’introduction manquante pour ${cible.sigle}.`);
    const signification = significationMissionSigles(cible);
    const options = melangerSigles([signification,...faux]).map((texte,i)=>({id:`intro-${i}`,texte,correcte:texte===signification}));
    return {
        type:'introduction',
        cibles:[cible],
        cible,
        estIntroduction:true,
        compteMaitrise:false,
        consigne,
        options,
        explication:`La bonne appellation est « ${signification} ». Elle s’abrège ${cible.sigle}. ${cible.repere || ''}`.trim(),
        indice:'Appuie-toi sur la situation décrite et élimine les appellations qui changent le rôle, le cadre ou le niveau concerné.'
    };
}
function poolSiglesConnus(extras=[]) {
    const domaines = new Set(extras.map(x=>x.domaine));
    const connus = SIGLES.filter(x=>sigleEstIntroduit(x.sigle) && (domaines.size ? domaines.has(x.domaine) : obtenirPoolDomaineSigles().includes(x)));
    const map = new Map([...connus,...extras].map(x=>[normaliserSigleJeu(x.sigle),x])); return [...map.values()];
}
function creerQuestionRappelDirectSigles(cible, pool=SIGLES) {
    pool=pool.filter(x=>x.domaine===cible.domaine);
    if(pool.length<4) pool=obtenirPoolDomaineSigles(cible.domaine);
    const autres = choisirSansDoublon(pool.filter(x=>normaliserSigleJeu(x.sigle)!==normaliserSigleJeu(cible.sigle)),3);
    const options = melangerSigles([cible,...autres]).map((x,i)=>({id:`dev-${i}`,texte:significationMissionSigles(x),correcte:normaliserSigleJeu(x.sigle)===normaliserSigleJeu(cible.sigle)}));
    return { type:'choix', cibles:[cible], cible, compteMaitrise:true, consigne:`Que signifie ${cible.sigle} ?`, options, explication:`${cible.sigle} signifie « ${significationMissionSigles(cible)} ». ${cible.repere || ''}`.trim(), indice:cible.repere || `Cherche le développement exact de ${cible.sigle}.` };
}
function creerQuestionRappelInverseSigles(cible, poolConnus) {
    const eligibles = poolConnus.filter(x=>x.domaine===cible.domaine && normaliserSigleJeu(x.sigle)!==normaliserSigleJeu(cible.sigle) && sigleEstIntroduit(x.sigle));
    if (eligibles.length < 3) return creerQuestionRappelDirectSigles(cible, poolConnus.length>=4?poolConnus:SIGLES);
    const autres=choisirSansDoublon(eligibles,3); const options=melangerSigles([cible,...autres]).map((x,i)=>({id:`sig-${i}`,texte:x.sigle,correcte:normaliserSigleJeu(x.sigle)===normaliserSigleJeu(cible.sigle)}));
    return { type:'choix', cibles:[cible], cible, compteMaitrise:true, consigne:`Quel sigle correspond à « ${significationMissionSigles(cible)} » ?`, options, explication:`Le sigle attendu est ${cible.sigle}. ${cible.repere || ''}`.trim(), indice:cible.repere || 'Repère le sigle correspondant au développement déjà travaillé.' };
}
function creerQuestionAssociationSigles(cibles) {
    const liste=cibles.slice(0,4); return { type:'association', cibles:liste, compteMaitrise:false, consigne:'Relie chaque sigle à son développement.', explication:'Chaque sigle doit être associé à son développement exact.', indice:'Commence par les associations dont tu es sûre.' };
}
function creerQuestionsEtapeSigles(numero) {
    const pool=obtenirSiglesEtape(numero); const questions=[];
    for(let debut=0;debut<pool.length;debut+=4){ const bloc=pool.slice(debut,debut+4); bloc.forEach(c=>questions.push(creerQuestionIntroductionSigles(c))); bloc.forEach(c=>questions.push(creerQuestionRappelDirectSigles(c,bloc))); }
    return questions;
}
function creerQuestionsEntrainementSigles(cibles, melange=false) {
    const ordre = melange ? melangerSigles(cibles) : [...cibles];
    const connusAvant=poolSiglesConnus(ordre.filter(x=>sigleEstIntroduit(x.sigle)));
    // Comme l'entraînement PJJoue, le nombre choisi correspond exactement au
    // nombre de questions jouées. Un sigle encore inconnu est d'abord introduit
    // par une question développement → sigle ; il sera rappelé lors d'une session
    // ultérieure, jamais testé avant cette première rencontre.
    return ordre.map((cible,index)=>{
        if(!sigleEstIntroduit(cible.sigle)) return creerQuestionIntroductionSigles(cible);
        return index%2===0
            ? creerQuestionRappelDirectSigles(cible,ordre)
            : creerQuestionRappelInverseSigles(cible,connusAvant);
    });
}
function creerQuestionsHasardSigles(cibles) {
    const connus=poolSiglesConnus(cibles);
    return cibles.map((cible,index)=> sigleEstIntroduit(cible.sigle) ? (index%2?creerQuestionRappelInverseSigles(cible,connus):creerQuestionRappelDirectSigles(cible,cibles)) : creerQuestionIntroductionSigles(cible));
}
function creerQuestionsRevisionSigles(cibles) { const connus=poolSiglesConnus(cibles); return cibles.map((cible,index)=>index%2?creerQuestionRappelInverseSigles(cible,connus):creerQuestionRappelDirectSigles(cible,cibles)); }
function creerQuestionsEvaluationSigles() {
    const connus=obtenirPoolDomaineSigles(); const cibles=choisirSansDoublon(connus,NOMBRE_QUESTIONS_EVALUATION_SIGLES);
    return cibles.map((cible,index)=> index>0 && index%6===5 ? creerQuestionAssociationSigles(choisirSansDoublon(connus,4)) : (index%2?creerQuestionRappelInverseSigles(cible,connus):creerQuestionRappelDirectSigles(cible,connus))).slice(0,NOMBRE_QUESTIONS_EVALUATION_SIGLES);
}

function questionSiglesAReprendre(question) {
    const cibles = question?.cibles || [];
    return cibles.some(cible => {
        const etape = obtenirEtatEtapeSigles(Number(cible.etape));
        const cle = normaliserSigleJeu(cible.sigle);
        // Une introduction déjà découverte n'a pas besoin d'être rejouée.
        // Les activités de rappel restent nécessaires tant que le sigle n'est
        // pas maîtrisé en autonomie, sans joker.
        return question.estIntroduction
            ? !sigleEstIntroduit(cle)
            : etape.autonomes[cle] !== true;
    });
}

function obtenirQuestionsRestantesEtapeSigles(numero, questions) {
    return questions.filter(questionSiglesAReprendre);
}

function preparerSessionSigles({mode,etape=null,sigles,questions,jokersActifs=true,titre,chronoActif=false,secondesQuestion=30}) {
    arreterChronoSigles();
    etatJeuSigles = { ...creerEtatJeuSigles(), mode, etape, titreSession:titre, siglesSession:[...sigles], questions:[...questions], jokersActifs, chronoActif, secondesQuestion, chronoRestant:secondesQuestion, configurationDerniereSession:{mode,etape,sigles:[...sigles],jokersActifs,titre,chronoActif,secondesQuestion} };
    afficherVueSigles('session'); afficherQuestionSigles();
}
function afficherQuestionSigles() {
    const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; if(!q){ terminerSessionSigles(); return; }
    etatJeuSigles.questionValidee=false; etatJeuSigles.tentativesQuestion=0; etatJeuSigles.aideUtilisee=false;
    enregistrerSauvegarde();
    const total=etatJeuSigles.questions.length, index=etatJeuSigles.indexQuestion+1;
    if(selectionnerSigles('#siglesSessionMode')) selectionnerSigles('#siglesSessionMode').textContent=etatJeuSigles.titreSession;
    if(selectionnerSigles('#siglesQuestionTitre')) selectionnerSigles('#siglesQuestionTitre').textContent=q.estIntroduction?'Découvrir un repère':'Question';
    if(selectionnerSigles('#siglesQuestionCompteur')) selectionnerSigles('#siglesQuestionCompteur').textContent=`${index} / ${total}`;
    if(selectionnerSigles('#siglesSessionJauge')) selectionnerSigles('#siglesSessionJauge').style.width=`${Math.round((index-1)/total*100)}%`;
    if(selectionnerSigles('#siglesQuestionConsigne')) selectionnerSigles('#siglesQuestionConsigne').textContent=q.consigne;
    selectionnerSigles('#siglesAide')?.classList.add('masque'); selectionnerSigles('#siglesFeedback')?.classList.add('masque'); selectionnerSigles('#siglesQuestionSuivante')?.classList.add('masque'); selectionnerSigles('#siglesValiderActivite')?.classList.add('masque');
    const jokers=selectionnerSigles('#siglesJokers'); if(jokers){ jokers.classList.toggle('masque',!etatJeuSigles.jokersActifs); jokers.querySelectorAll('button').forEach(b=>b.disabled=false); }
    const passer=selectionnerSigles('#siglesPasserQuestion'); if(passer) passer.classList.toggle('masque',etatJeuSigles.mode==='evaluation');
    rendreQuestionSigles(q); demarrerChronoSigles();
}
function rendreQuestionSigles(q) {
    const zone=selectionnerSigles('#siglesZoneQuestion'); if(!zone)return; zone.innerHTML='';
    if(q.type==='association') {
        const devs=melangerSigles(q.cibles.map(c=>significationMissionSigles(c)));
        zone.innerHTML=`<div class="sigles-association">${q.cibles.map((c,i)=>`<label><strong>${c.sigle}</strong><select data-association-sigles="${i}"><option value="">Choisir…</option>${devs.map(d=>`<option value="${String(d).replaceAll('&','&amp;').replaceAll('"','&quot;')}">${d}</option>`).join('')}</select></label>`).join('')}</div>`;
        selectionnerSigles('#siglesValiderActivite')?.classList.remove('masque'); return;
    }
    zone.innerHTML=`<div class="sigles-reponses">${q.options.map((o,i)=>`<button class="sigles-reponse" data-sigles-reponse="${i}" type="button">${o.texte}</button>`).join('')}</div>`;
    zone.querySelectorAll('[data-sigles-reponse]').forEach(b=>b.addEventListener('click',()=>repondreChoixSigles(Number(b.dataset.siglesReponse))));
}
function repondreChoixSigles(index) {
    if(etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion], option=q.options[index]; if(!option)return;
    etatJeuSigles.tentativesQuestion += 1;
    if(option.correcte) finaliserQuestionSigles(true,q.cibles); else { const b=selectionnerSigles(`[data-sigles-reponse="${index}"]`); b?.classList.add('sigles-reponse-incorrecte'); b && (b.disabled=true); etatJeuSigles.reponsesIncorrectes += 1; enregistrerErreurSigles(q.cibles); afficherFeedbackSigles('erreur','Pas encore. Relis les propositions et essaie de nouveau.'); }
}
function validerAssociationSigles() {
    if(etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; if(q?.type!=='association')return;
    const valeurs=selectionnerTousSigles('[data-association-sigles]').map(s=>s.value); if(valeurs.some(v=>!v)){ afficherNotification('Associe chaque sigle avant de valider.'); return; }
    etatJeuSigles.tentativesQuestion += 1; const mauvaises=q.cibles.filter((c,i)=>valeurs[i]!==significationMissionSigles(c));
    if(!mauvaises.length) finaliserQuestionSigles(true,q.cibles); else { etatJeuSigles.reponsesIncorrectes += 1; enregistrerErreurSigles(mauvaises); afficherFeedbackSigles('erreur','Certaines associations sont encore à corriger.'); }
}
function finaliserQuestionSigles(correcte,cibles,{parJoker=false,passage=false,tempsEcoule=false}={}) {
    if(etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; etatJeuSigles.questionValidee=true; arreterChronoSigles();
    if(correcte){ if(q.estIntroduction && q.cible) marquerSigleIntroduit(q.cible.sigle); etatJeuSigles.score += 1; const autonome=!etatJeuSigles.aideUtilisee && !parJoker; if(autonome) etatJeuSigles.reponsesAutonomes += 1; else etatJeuSigles.reponsesAidees += 1;
        if(q.compteMaitrise){ cibles.forEach(cible=>{ const etape=obtenirEtatEtapeSigles(Number(cible.etape)), cle=normaliserSigleJeu(cible.sigle); if(!etatJeuSigles.aideUtilisee&&!parJoker) etape.validationsSansJoker[cle]=true; if(autonome) etape.autonomes[cle]=true; }); verifierCelebrationEtapeSigles(cibles); }
        if(autonome && etatJeuSigles.tentativesQuestion > 1) enregistrerErreurSigles(cibles, 'reprise'); else if(!q.estIntroduction && autonome) validerRevisionSigles(cibles); else if(!autonome) enregistrerErreurSigles(cibles, 'joker'); afficherFeedbackSigles('succes',q.explication || 'Bonne réponse.');
    } else { if(passage||tempsEcoule){ etatJeuSigles.questionsPassees += 1; enregistrerErreurSigles(cibles, 'passage'); afficherFeedbackSigles('erreur',tempsEcoule?'Temps écoulé. Cette question rejoint tes révisions.':'Question passée. Elle rejoint tes révisions.'); } }
    obtenirSauvegardeJeuSigles().statistiques.questionsJouees += 1; enregistrerSauvegarde();
    selectionnerTousSigles('#siglesZoneQuestion button, #siglesZoneQuestion select').forEach(e=>e.disabled=true); selectionnerSigles('#siglesValiderActivite')?.classList.add('masque'); selectionnerSigles('#siglesQuestionSuivante')?.classList.remove('masque'); selectionnerSigles('#siglesPasserQuestion')?.classList.add('masque'); selectionnerSigles('#siglesJokers')?.querySelectorAll('button').forEach(b=>b.disabled=true);
}
function afficherFeedbackSigles(type,texte){ const z=selectionnerSigles('#siglesFeedback'); if(!z)return; z.dataset.type=type; z.textContent=texte; z.classList.remove('masque'); }
function passerQuestionSigles(){ if(etatJeuSigles.mode==='evaluation'||etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; finaliserQuestionSigles(false,q.cibles,{passage:true}); }
function questionSuivanteSigles(){ etatJeuSigles.indexQuestion += 1; afficherQuestionSigles(); }
function verifierCelebrationEtapeSigles(cibles){ const numeros=[...new Set(cibles.map(c=>Number(c.etape)))]; numeros.forEach(n=>{ const e=obtenirEtatEtapeSigles(n); if(compterValidationsSansJokerEtapeSigles(n)===obtenirSiglesEtape(n).length && !e.celebrationAffichee){ e.celebrationAffichee=true; etatJeuSigles.celebrationEtapeADiffuser=n; } }); }

function utiliserJokerSigles(type) {
    if(!etatJeuSigles.jokersActifs||etatJeuSigles.questionValidee)return; const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; etatJeuSigles.aideUtilisee=true; const bouton=selectionnerSigles(`[data-joker-sigles="${type}"]`); if(bouton)bouton.disabled=true;
    if(type==='5050') { if(q.type!=='choix'&&q.type!=='introduction'){ afficherAideSigles('Le 50/50 est disponible sur les questions à choix.'); return; } const mauvaises=selectionnerTousSigles('#siglesZoneQuestion .sigles-reponse').filter((b,i)=>!q.options[i]?.correcte&&!b.disabled); choisirSansDoublon(mauvaises,Math.min(2,mauvaises.length)).forEach(b=>{b.disabled=true;b.classList.add('sigles-reponse-ecartee');}); afficherAideSigles('Deux propositions ont été écartées.'); return; }
    if(type==='indice'){ afficherAideSigles(q.indice || q.cibles[0]?.repere || 'Repère le développement du sigle et les initiales utiles.'); return; }
    if(type==='langue'){ if(q.type==='association'){ const c=q.cibles[0]; afficherAideSigles(`Premier coup de pouce : ${c.sigle} correspond à « ${significationMissionSigles(c)} ».`); return; } const bon=q.options.findIndex(o=>o.correcte); if(bon>=0){ selectionnerSigles(`[data-sigles-reponse="${bon}"]`)?.classList.add('sigles-reponse-correcte'); finaliserQuestionSigles(true,q.cibles,{parJoker:true}); } }
}
function afficherAideSigles(texte){ const z=selectionnerSigles('#siglesAide'); if(!z)return; z.textContent=texte; z.classList.remove('masque'); }

function demarrerChronoSigles(){ arreterChronoSigles(); const zone=selectionnerSigles('#siglesChrono'); if(!etatJeuSigles.chronoActif){ zone?.classList.add('masque'); return; } etatJeuSigles.chronoRestant=etatJeuSigles.secondesQuestion; if(zone){zone.textContent=`${etatJeuSigles.chronoRestant} s`;zone.classList.remove('masque');} etatJeuSigles.chronoIntervalle=window.setInterval(()=>{ etatJeuSigles.chronoRestant-=1; if(zone)zone.textContent=`${Math.max(0,etatJeuSigles.chronoRestant)} s`; if(etatJeuSigles.chronoRestant<=0){ arreterChronoSigles(); if(!etatJeuSigles.questionValidee){ const q=etatJeuSigles.questions[etatJeuSigles.indexQuestion]; finaliserQuestionSigles(false,q.cibles,{tempsEcoule:true}); } } },1000); }
function arreterChronoSigles(){ if(etatJeuSigles.chronoIntervalle){ clearInterval(etatJeuSigles.chronoIntervalle); etatJeuSigles.chronoIntervalle=null; } }

function terminerSessionSigles(){ arreterChronoSigles(); const total=etatJeuSigles.questions.length, pc=total?Math.round(etatJeuSigles.score/total*100):0; const jeu=obtenirSauvegardeJeuSigles();
    if(etatJeuSigles.mode==='parcours'&&etatJeuSigles.etape){ const e=obtenirEtatEtapeSigles(etatJeuSigles.etape); e.nombreTentatives+=1;e.meilleurScore=Math.max(e.meilleurScore||0,pc); }
    if(etatJeuSigles.mode==='evaluation'){ obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).nombreTentatives+=1;obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).meilleurScore=Math.max(obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).meilleurScore||0,pc);etatJeuSigles.evaluationReussie=pc>=SEUIL_EVALUATION_SIGLES&&etatJeuSigles.questionsPassees===0;etatJeuSigles.evaluationParfaite=pc===100&&etatJeuSigles.questionsPassees===0;if(etatJeuSigles.evaluationReussie)obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).reussie=true; }
    enregistrerSauvegarde(); afficherVueSigles('bilan'); afficherBilanSigles(pc); actualiserAccueilSigles(); }
function afficherBilanSigles(pc){ const total=etatJeuSigles.questions.length; if(selectionnerSigles('#siglesBilanScore'))selectionnerSigles('#siglesBilanScore').textContent=`${etatJeuSigles.score} / ${total} · ${pc}%`; if(selectionnerSigles('#siglesBilanDetails'))selectionnerSigles('#siglesBilanDetails').textContent=`${etatJeuSigles.reponsesAutonomes} réussites autonomes · ${etatJeuSigles.reponsesAidees} avec aide · ${etatJeuSigles.questionsPassees} passées`;
    let surtitre='Mission Sigles', titre='Session terminée', texte='Les sigles difficiles restent disponibles dans « Questions à consolider ».', icone='✓';
    if(etatJeuSigles.mode==='parcours'){ const m=etapeSiglesMaitrisee(etatJeuSigles.etape); titre=m?`${libelleEtapeSigles(etatJeuSigles.etape)} maîtrisée`:`${libelleEtapeSigles(etatJeuSigles.etape)} terminée`; texte=m?'Tous les sigles de cette étape sont maîtrisés en autonomie.':'Tu peux rejouer l’étape ou retrouver tes questions à consolider dans la révision.'; }
    if(etatJeuSigles.celebrationEtapeADiffuser){ icone='★'; titre=`${libelleEtapeSigles(etatJeuSigles.celebrationEtapeADiffuser)} validée sans joker !`; texte='Tous les sigles de cette étape ont finalement été réussis sans joker. Bravo !'; lancerConfettis(1.35); jouerSonEtapeSansJoker(); }
    if(etatJeuSigles.mode==='evaluation'){ surtitre='Évaluation finale'; if(etatJeuSigles.evaluationReussie){ titre=etatJeuSigles.evaluationParfaite?'Mission accomplie. Même pas peur.':'Évaluation réussie !';texte=etatJeuSigles.evaluationParfaite?'30 / 30. Mission accomplie.':'Tu dépasses le seuil de 90 %. Bravo !';icone='🏆';lancerConfettis(etatJeuSigles.evaluationParfaite?3:2);jouerSonEvaluationFinale(); } else { titre='Évaluation à consolider';texte='Il faut 90 % pour réussir. Les sigles manqués rejoignent tes révisions.';icone='↻'; } }
    if(etatJeuSigles.mode==='hasard'){ titre='Défi du hasard terminé';texte=pc===100?'Tirage parfait ! Le dé était avec toi.':'Le dé a parlé. Tu peux relancer un nouveau tirage quand tu veux.'; }
    if(etatJeuSigles.mode==='revision'){ titre='Révision terminée';texte=obtenirErreursSiglesActives().length?'Il reste quelques sigles à consolider.':'Bravo : aucun sigle actif à revoir.'; }
    if(etatJeuSigles.mode==='entrainement'&&pc===100&&total>=10){ titre='Entraînement parfait !';texte='Toutes les réponses de cette session sont validées.';lancerConfettis(1);jouerSonEtapeSansJoker(); }
    if(selectionnerSigles('#siglesBilanSurtitre'))selectionnerSigles('#siglesBilanSurtitre').textContent=surtitre; if(selectionnerSigles('#siglesBilanTitre'))selectionnerSigles('#siglesBilanTitre').textContent=titre; if(selectionnerSigles('#siglesBilanTexte'))selectionnerSigles('#siglesBilanTexte').textContent=texte; if(selectionnerSigles('#siglesBilanIcone'))selectionnerSigles('#siglesBilanIcone').textContent=icone;
}

function lancerEtapeSigles(numero, { depuisDebut = false } = {}){
    const sigles = obtenirSiglesEtape(numero);
    const questionsCompletes = creerQuestionsEtapeSigles(numero);
    const questions = depuisDebut
        ? questionsCompletes
        : obtenirQuestionsRestantesEtapeSigles(numero, questionsCompletes);
    // Si tout est déjà maîtrisé, conserver une session complète permet encore
    // d'accéder au bouton « Reprendre depuis le début » depuis l'écran des
    // questions, sans modifier la progression enregistrée.
    preparerSessionMissionSiglesNative({mode:'parcours',etape:numero,sigles,questions:questions.length ? questions : questionsCompletes,jokersActifs:true,titre:`${libelleEtapeSigles(numero)} · ${ETAPES_MISSION_SIGLES[numero].titre}`});
}
function lancerEntrainementSigles(){ const perimetre=valeurGroupeSigles('#siglesChoixPerimetre','perimetre','tous'); const pool=perimetre==='tous'?[...SIGLES]:obtenirSiglesEtape(Number(perimetre)); const nombreBrut=valeurGroupeSigles('#siglesChoixNombre','nombre','10'); const nombre=nombreBrut==='tous'?pool.length:Math.min(pool.length,Number(nombreBrut)||10); const organisation=valeurGroupeSigles('#siglesChoixOrganisation','organisation','etapes'); let cibles=choisirSansDoublon(pool,nombre); if(organisation==='etapes')cibles=cibles.sort((a,b)=>Number(a.etape)-Number(b.etape)||Number(a.id)-Number(b.id)); const chrono=valeurGroupeSigles('#siglesChoixChrono','chrono','non')==='oui'; const secondes=Number(valeurGroupeSigles('#siglesChoixSecondes','secondes','30'))||30; const jokers=valeurGroupeSigles('#siglesChoixJokers','jokers','oui')==='oui'; const questions=creerQuestionsEntrainementSigles(cibles,organisation==='melange'); preparerSessionSigles({mode:'entrainement',sigles:cibles,questions,jokersActifs:jokers,titre:`Entraînement Sigles · ${nombre} sigle${nombre===1?'':'s'}`,chronoActif:chrono,secondesQuestion:secondes}); }
function lancerDeSigles(){ const face=selectionnerSigles('#siglesFaceDe'),resultat=selectionnerSigles('#siglesDeResultat'),lancer=selectionnerSigles('#siglesLancerDe'),jouer=selectionnerSigles('#siglesJouerTirage'); if(!face||!resultat||!lancer||!jouer)return; const valeur=1+Math.floor(Math.random()*6); lancer.disabled=true;jouer.classList.add('masque');face.classList.remove('de-en-lancer');void face.offsetWidth;face.classList.add('de-en-lancer');window.setTimeout(()=>{ etatJeuSigles.nombreTire=valeur;etatJeuSigles.tirageHasard=choisirSansDoublon(obtenirPoolDomaineSigles(),valeur);face.dataset.face=String(valeur);face.classList.remove('de-en-lancer');resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard parmi les ${obtenirPoolDomaineSigles().length} sigles ${libelleDomaineSigles()}.`;jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`;lancer.textContent='Relancer le dé';lancer.classList.add('principal');lancer.classList.remove('sigles-bouton-secondaire');jouer.classList.remove('masque');lancer.disabled=false;jouer.focus({preventScroll:true}); },420); }
function jouerTirageDeSigles(){ const cibles=[...etatJeuSigles.tirageHasard]; if(!cibles.length)return; preparerSessionMissionSiglesNative({mode:'hasard',sigles:cibles,questions:creerQuestionsHasardSigles(cibles),jokersActifs:true,titre:`Défi du hasard · ${cibles.length} question${cibles.length===1?'':'s'}`,chronoActif:false}); }
function lancerRevisionSigles(){
    afficherEcran('sigles-revision');
}
function lancerToutesErreursSiglesDepuisRevision(){
    const cibles = obtenirErreursSiglesActives();
    if(!cibles.length){ afficherNotification('Aucun sigle à consolider pour le moment.'); return; }
    preparerSessionMissionSiglesNative({mode:'revision', sigles:cibles, questions:creerQuestionsRevisionSigles(cibles), jokersActifs:false, titre:'Questions à consolider'});
}
function lancerRevisionEtapeSiglesDepuisRevision(numeroEtape){
    const numero = Number(numeroEtape);
    const cibles = obtenirCiblesARejouerEtapeSigles(numero);
    if(!cibles.length){ afficherNotification(`Aucune question à consolider à l’étape ${numero} de Mission Sigles.`); return; }
    preparerSessionMissionSiglesNative({mode:'revision', etape:numero, sigles:cibles, questions:creerQuestionsRevisionSigles(cibles), jokersActifs:false, titre:`Questions à consolider · ${libelleEtapeSigles(numero)}`});
}
function lancerRevisionEtapeSiglesDepuisQuestion(numeroEtape){
    lancerRevisionEtapeSiglesDepuisRevision(numeroEtape);
}
function missionSiglesADejaJoue(){
    const jeu = obtenirSauvegardeJeuSigles();
    return Object.keys(jeu.decouverts || {}).length > 0
        || Object.values(jeu.etapes || {}).some(etape => Object.keys(etape?.autonomes || {}).length > 0)
        || Number(jeu.evaluation?.nombreTentatives || 0) > 0;
}
function afficherEtatVideRevisionMissionSigles(zone){
    if (!zone) return;
    if (!missionSiglesADejaJoue()) {
        zone.innerHTML = `<div class="revision-vide">
            <span class="revision-vide-icone" aria-hidden="true">↺</span>
            <span class="surtitre">Révision</span>
            <h2>Tu n’as pas encore joué à Mission Sigles.</h2>
            <p>Commence une étape : les sigles à consolider apparaîtront ici automatiquement.</p>
            <button class="principal" data-action="ouvrir-mission-sigles-depuis-erreurs">Commencer Mission Sigles →</button>
        </div>`;
        return;
    }
    zone.innerHTML = `<div class="revision-vide revision-vide-ok">
        <span class="revision-vide-icone" aria-hidden="true">✓</span>
        <span class="surtitre">À jour</span>
        <h2>Aucune question à consolider.</h2>
        <p>Tous les sigles qui avaient besoin d’être retravaillés sont consolidés.</p>
    </div>`;
}
function construireRevisionMissionSiglesIndependante(){
    const cibles = obtenirErreursSiglesActives();
    const zone = selectionner('#contenuErreursSigles');
    if(!zone) return;
    if(!cibles.length){ afficherEtatVideRevisionMissionSigles(zone); return; }
    const parEtape = {};
    cibles.forEach(cible => (parEtape[Number(cible.etape)] = parEtape[Number(cible.etape)] || []).push(cible));
    const total = cibles.length;
    const boutons = Object.keys(parEtape).sort((a,b)=>Number(a)-Number(b)).map(numero => {
        const identite = obtenirIdentiteEtapeMissionSigles(Number(numero));
        const liste = parEtape[numero];
        return `<button class="revision-parcours-bouton" data-action="reviser-etape-sigles" data-etape="${numero}" style="--parcours-accent:${identite.couleur};--parcours-accent-lisible:${identite.couleurTexte};--parcours-accent-rgb:${identite.couleurRgb}"><span class="revision-parcours-numero">${identite.numero}</span><span class="revision-parcours-texte"><strong>${identite.titre}</strong><small>${liste.length} ${liste.length>1?'questions à consolider':'question à consolider'}</small></span><span class="revision-parcours-action">Réviser →</span></button>`;
    }).join('');
    const etapesDirectes = Object.keys(parEtape).sort((a,b)=>Number(a)-Number(b)).map(numero => {
        const liste = parEtape[numero];
        return `<button class="revision-etape-bouton" data-action="reviser-etape-sigles" data-etape="${numero}"><span>${libelleEtapeSigles(numero)}</span><strong>${liste.length}</strong></button>`;
    }).join('');
    const dossiers = Object.keys(parEtape).sort((a,b)=>Number(a)-Number(b)).map(numero => {
        const identite = obtenirIdentiteEtapeMissionSigles(Number(numero));
        const liste = parEtape[numero];
        const lignes = liste.map(cible => {
            const suivi = obtenirSauvegardeJeuSigles().erreurs?.[normaliserSigleJeu(cible.sigle)] || {};
            return `<li class="revision-erreur-ligne"><span><strong>${cible.sigle}</strong> · ${significationMissionSigles(cible)}</span><small>${obtenirLibelleConsolidation(suivi)}</small></li>`;
        }).join('');
        return `<details class="revision-dossier" style="--parcours-accent:${identite.couleur};--parcours-accent-lisible:${identite.couleurTexte};--parcours-accent-rgb:${identite.couleurRgb}"><summary><span class="revision-dossier-numero">${identite.numero}</span><span><strong>${identite.titre}</strong><small>${liste.length} ${liste.length>1?'questions à consolider':'question à consolider'}</small></span><span class="revision-dossier-chevron" aria-hidden="true">⌄</span></summary><div class="revision-dossier-contenu"><div class="revision-etape-groupe"><div class="revision-etape-groupe-entete"><strong>${libelleEtapeSigles(numero)}</strong><span>${liste.length}</span></div><ul>${lignes}</ul></div></div></details>`;
    }).join('');
    zone.innerHTML = `<div class="revision-workspace">
        <article class="revision-toutes-erreurs">
            <div class="revision-toutes-erreurs-icone" aria-hidden="true">↻</div>
            <div class="revision-toutes-erreurs-texte"><span class="surtitre">Révision rapide</span><h2>Mélange mes questions à consolider</h2><p>Une session aléatoire avec tes ${total} ${total>1?'sigles à retravailler':'sigle à retravailler'}.</p></div>
            <button class="principal" data-action="reviser-toutes-erreurs-sigles">Lancer ${total} ${total>1?'questions':'question'} →</button>
        </article>
        <section class="revision-choix" aria-labelledby="titreRevisionSiglesEtapes">
            <div class="revision-section-entete"><div><span class="surtitre">Cibler</span><h2 id="titreRevisionSiglesEtapes">Choisis ce que tu veux renforcer</h2></div><p>Une étape précise de Mission Sigles.</p></div>
            <div class="revision-parcours-boutons">${boutons}</div>
            <details class="revision-etapes-details"><summary>Choisir directement une étape</summary><div class="revision-etape-boutons">${etapesDirectes}</div></details>
        </section>
    </div>
    <section class="revision-inventaire" aria-labelledby="titreInventaireErreursSigles"><div class="revision-section-entete"><div><span class="surtitre">Détail</span><h2 id="titreInventaireErreursSigles">Tes questions à consolider</h2></div><p>Consulte les sigles qui restent à consolider, étape par étape.</p></div><div class="revision-dossiers">${dossiers}</div></section>`;
}
function afficherRevisionMissionSigles(){
    construireRevisionMissionSiglesIndependante();
}

function lancerEvaluationSigles(){ if(!evaluationSiglesDebloquee()){ouvrirFenetreMessage({titre:'Évaluation encore verrouillée',message:'Maîtrise d’abord les étapes du domaine sélectionné en autonomie.',libelleConfirmer:'Compris'});return;} const questions=creerQuestionsEvaluationSigles(); const sigles=[...new Map(questions.flatMap(q=>q.cibles).map(c=>[normaliserSigleJeu(c.sigle),c])).values()]; preparerSessionMissionSiglesNative({mode:'evaluation',sigles,questions,jokersActifs:false,titre:'Évaluation finale · Expert des sigles'}); }
function rejouerDerniereSessionSigles(){ const ancienne=etatJeuSigles.configurationDerniereSession;if(!ancienne){retourAccueilSigles();return;} if(ancienne.mode==='parcours'){lancerEtapeSigles(ancienne.etape);return;}if(ancienne.mode==='evaluation'){lancerEvaluationSigles();return;}if(ancienne.mode==='revision'){lancerRevisionSigles();return;}if(ancienne.mode==='hasard'){const cibles=ancienne.sigles.map(x=>obtenirSigleJeu(x.sigle)).filter(Boolean);preparerSessionSigles({...ancienne,sigles:cibles,questions:creerQuestionsHasardSigles(cibles)});return;}const cibles=ancienne.sigles.map(x=>obtenirSigleJeu(x.sigle)).filter(Boolean);preparerSessionSigles({...ancienne,sigles:cibles,questions:creerQuestionsEntrainementSigles(cibles, false)}); }
function retourAccueilSigles(){ arreterChronoSigles(); etatJeuSigles=creerEtatJeuSigles(); afficherVueSigles('accueil'); actualiserAccueilSigles(); }


// -----------------------------------------------------------------------------
// Mission Sigles dans les composants natifs de PJJoue
// -----------------------------------------------------------------------------
function estSessionMissionSigles() {
    return String(etat?.mode || '').startsWith('sigles-');
}
function obtenirModeMissionSigles() {
    return estSessionMissionSigles() ? String(etat.mode).replace(/^sigles-/, '') : null;
}
function libelleEtapeSigles(numero) {
    const e=obtenirIdentiteEtapeMissionSigles(numero);
    return `${libelleDomaineSigles(e.domaine)} · Étape ${e.numero}`;
}
function obtenirIdentiteEtapeMissionSigles(numero) {
    return ETAPES_MISSION_SIGLES[Number(numero)] || ETAPES_MISSION_SIGLES[1];
}
function obtenirThemeVisuelMissionSigles(numero) {
    return ['procedure_ordinaire','information_judiciaire','jugement_educatif_ordinaire','matiere_criminelle_peines','application_execution_peines','commun'][Math.max(0, Math.min(5, Number(numero || 1) - 1))];
}
function liensSourcesQuestionSigles(cibles) {
    const sources=[...new Map(cibles.filter(c=>c.source).map(c=>[c.source.url,c.source])).values()];
    return sources.map(source=>` <a href="${source.url}" target="_blank" rel="noopener noreferrer">Source officielle · ${echapperHtml(source.reference)}</a>`).join('');
}
function convertirQuestionMissionSiglesVersPJJoue(questionSigles, index, configuration) {
    const cible = questionSigles.cible || questionSigles.cibles?.[0] || null;
    const numeroEtape = Number(cible?.etape || configuration.etape || 1);
    const identifiant = 900000 + (Number(cible?.id || 0) * 20) + (index % 20);
    const base = {
        id: identifiant,
        theme: obtenirThemeVisuelMissionSigles(numeroEtape),
        etape: numeroEtape,
        chapitre: 1,
        ordreEtape: index + 1,
        enonce: questionSigles.consigne,
        explication: (questionSigles.explication || '') + liensSourcesQuestionSigles(questionSigles.cibles || []),
        indice: questionSigles.indice || '',
        bonneReponse: '',
        mauvaisesReponses: [],
        modePrefere: 'choix-unique',
        estEvaluationFinale: configuration.mode === 'evaluation',
        missionSigles: true,
        missionSiglesMeta: {
            mode: configuration.mode,
            numeroEtape,
            cibles: (questionSigles.cibles || []).map(element => normaliserSigleJeu(element.sigle)),
            compteMaitrise: questionSigles.compteMaitrise === true,
            estIntroduction: questionSigles.estIntroduction === true
        }
    };
    if (questionSigles.type === 'association') {
        const gauche = (questionSigles.cibles || []).map((element, i) => ({ id:`ms-g-${identifiant}-${i}`, texte: element.sigle }));
        const droite = (questionSigles.cibles || []).map((element, i) => ({ id:`ms-d-${identifiant}-${i}`, texte: significationMissionSigles(element) }));
        const associations = Object.fromEntries(gauche.map((element, i) => [element.id, droite[i].id]));
        return {
            ...base,
            bonneReponse: 'Chaque sigle est relié à son développement exact.',
            modePrefere: 'association',
            activite: { type:'association', colonneGauche:gauche, colonneDroite:droite, associations }
        };
    }
    const options = questionSigles.options || [];
    const correcte = options.find(option => option.correcte === true);
    return {
        ...base,
        bonneReponse: correcte?.texte || '',
        mauvaisesReponses: options.filter(option => option.correcte !== true).map(option => option.texte)
    };
}
function preparerSessionMissionSiglesNative({ mode, etape = null, sigles, questions, jokersActifs = true, titre, chronoActif = false, secondesQuestion = 30 }) {
    const configuration = { domaine:obtenirDomaineSigles(), mode, etape, sigles:[...sigles], jokersActifs, titre, chronoActif, secondesQuestion };
    etatJeuSigles = {
        ...creerEtatJeuSigles(),
        mode,
        etape,
        titreSession: titre,
        siglesSession: [...sigles],
        questions: [...questions],
        jokersActifs,
        chronoActif,
        secondesQuestion,
        configurationDerniereSession: configuration
    };
    etat.mode = `sigles-${mode}`;
    etat.theme = obtenirThemeVisuelMissionSigles(etape || sigles?.[0]?.etape || 1);
    etat.etape = Number(etape || sigles?.[0]?.etape || 1);
    etat.chapitre = 1;
    etat.origineSessionAnalytics = `mission_sigles_${mode}`;
    etat.organisationSession = configuration.organisation || 'ordonne';
    etat.jokersSessionActifs = jokersActifs !== false;
    etat.chronometreSessionActif = chronoActif === true;
    etat.dureeChronometreSession = Math.min(30, Math.max(5, Number(secondesQuestion) || 30));
    etat.missionSiglesConfiguration = configuration;
    const questionsPJJoue = questions.map((question, index) => convertirQuestionMissionSiglesVersPJJoue(question, index, configuration));
    lancerSession(questionsPJJoue);
}
function obtenirCiblesMissionQuestion(question) {
    const cles = question?.missionSiglesMeta?.cibles || [];
    return cles.map(cle => obtenirSigleJeu(cle)).filter(Boolean);
}
function enregistrerResultatMissionSiglesNatif(question, resultat) {
    if (!question?.missionSigles) return;
    const cibles = obtenirCiblesMissionQuestion(question);
    const meta = question.missionSiglesMeta || {};
    if (resultat.estCorrecte && meta.estIntroduction && cibles[0])
        marquerSigleIntroduit(cibles[0].sigle);
    if (resultat.estCorrecte && meta.compteMaitrise) {
        cibles.forEach(cible => {
            const etape = obtenirEtatEtapeSigles(Number(cible.etape));
            const cle = normaliserSigleJeu(cible.sigle);
            if (!resultat.aideUtilisee)
                etape.validationsSansJoker[cle] = true;
            if (resultat.reussiteAutonome)
                etape.autonomes[cle] = true;
        });
        verifierCelebrationEtapeSigles(cibles);
    }
    if (!resultat.estCorrecte || resultat.reussiteAidee)
        enregistrerErreurSigles(cibles, resultat.reussiteAidee ? 'joker' : 'incorrecte');
    if (resultat.reussiteAutonome && resultat.tentatives > 0)
        enregistrerErreurSigles(cibles, 'reprise');
    else if (!meta.estIntroduction && resultat.reussiteAutonome)
        validerRevisionSigles(cibles);
    enregistrerSauvegarde();
}
function enregistrerPassageMissionSiglesNatif(question) {
    if (!question?.missionSigles) return;
    enregistrerErreurSigles(obtenirCiblesMissionQuestion(question), 'passage');
    enregistrerSauvegarde();
}
function reinitialiserMaitriseEtapeMissionSigles(numeroEtape) {
    const etape = obtenirEtatEtapeSigles(numeroEtape);
    etape.autonomes = {};
    etape.validationsSansJoker = {};
    etape.celebrationAffichee = false;
    enregistrerSauvegarde();
    if (etat.questionCourante?.missionSigles)
        actualiserSuiviEtapeQuestion(etat.questionCourante);
}
function terminerSessionMissionSiglesNative() {
    clearInterval(etat.identifiantMinuteur);
    const total = etat.questionsSession.length;
    const passees = etat.questionsPassees?.size || 0;
    const pourcentage = total ? Math.round(etat.score / total * 100) : 0;
    const mode = obtenirModeMissionSigles();
    const jeu = obtenirSauvegardeJeuSigles();
    let celebration = null;
    let titre = 'Mission Sigles terminée';
    let resultat = `${pourcentage} % · ${etat.score}/${total} réussites autonomes.`;
    if (mode === 'parcours') {
        const numero = Number(etat.missionSiglesConfiguration?.etape || etat.etape || 1);
        if (etatJeuSigles.celebrationEtapeADiffuser) {
            celebration = {
                titre: `${libelleEtapeSigles(numero)} terminée sans joker !`,
                message: 'Tous les sigles de cette étape ont finalement été réussis sans joker.',
                confetti: true
            };
        }
        titre = `${libelleEtapeSigles(numero)} · ${obtenirIdentiteEtapeMissionSigles(numero).titre}`;
    }
    if (mode === 'evaluation') {
        obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).meilleurScore = Math.max(Number(obtenirEvaluationSigles().meilleurScore || 0), pourcentage);
        obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).nombreTentatives = Number(obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).nombreTentatives || 0) + 1;
        const reussie = pourcentage >= SEUIL_EVALUATION_SIGLES && passees === 0;
        obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).reussie = Boolean(obtenirEvaluationSigles(etat.missionSiglesConfiguration?.domaine || obtenirDomaineSigles()).reussie) || reussie;
        titre = 'Évaluation finale · Expert des sigles';
        resultat = reussie
            ? `Résultat : ${pourcentage} %. Mission Sigles est validée.`
            : `Résultat : ${pourcentage} %. Le seuil attendu est de ${SEUIL_EVALUATION_SIGLES} %.`;
        if (reussie) {
            celebration = pourcentage === 100
                ? { titre:'Mission accomplie. Même pas peur.', message:'30 / 30. Mission accomplie.', confetti:true, finale:true }
                : { titre:'Évaluation Mission Sigles réussie !', message:`Tu as obtenu ${pourcentage} %.`, confetti:true };
        }
    }
    if (mode === 'hasard') {
        titre = 'Défi du hasard · Mission Sigles';
        resultat = pourcentage === 100 ? 'Tirage parfait !' : `Résultat : ${pourcentage} %.`;
    }
    if (mode === 'revision') {
        titre = 'Questions à consolider · Mission Sigles';
        resultat = obtenirErreursSiglesActives().length
            ? `${obtenirErreursSiglesActives().length} sigle(s) restent à consolider.`
            : 'Aucun sigle actif à revoir.';
        if (etatJeuSigles.celebrationEtapeADiffuser) {
            const numero = Number(etatJeuSigles.celebrationEtapeADiffuser);
            celebration = {
                titre: `Étape ${String(numero).padStart(2, '0')} maîtrisée !`,
                message: 'Les questions rejouées ont été réussies sans joker : la progression de l’étape est à jour.',
                confetti: true
            };
        }
    }
    enregistrerSauvegarde();
    selectionner('#scoreBilan').textContent = `${pourcentage}%`;
    selectionner('#bonnesReponsesBilan').textContent = `${etat.score}/${total}`;
    selectionner('#meilleureSerieBilan').textContent = etat.meilleureSerie;
    selectionner('#gainExperienceBilan').textContent = '+0';
    selectionner('#contexteBilan').textContent = `Mission Sigles · ${titre}`;
    selectionner('#titreBilan').textContent = titre;
    selectionner('#rangBilan').textContent = resultat;
    afficherErreursBilan(obtenirQuestionsAConsoliderSession(), passees);
    const continuer = selectionner('#boutonContinuer');
    continuer.textContent = 'Retour à Mission Sigles →';
    continuer.onclick = () => { etat.missionSiglesConfiguration = null; afficherEcran('sigles', { remplacerHistorique:true }); };
    const rejouer = selectionner('#boutonRejouerMesErreurs');
    if (rejouer) rejouer.onclick = lancerRevisionSigles;
    const destination = selectionner('#prochaineDestinationBilan');
    if (destination) destination.textContent = mode === 'parcours' ? 'Continue Mission Sigles ou rejoue les sigles à consolider.' : 'Choisis une nouvelle session dans Mission Sigles.';
    selectionner('#carteVoyageFinale')?.classList.add('masque');
    effacerSessionEnCours();
    afficherEcran('bilan', { remplacerHistorique:true });
    actualiserAccueilSigles();
    lancerCelebrationBilan(celebration);
}
function obtenirPoolEntrainementMissionSigles(perimetre) {
    return ['cjpm','pjj','tous'].includes(String(perimetre)) ? obtenirPoolDomaineSigles(String(perimetre)) : obtenirSiglesEtape(Number(perimetre));
}
function actualiserBoutonTousMissionSigles() {
    if (selectionner('#entrainement')?.dataset.contexteEntrainement !== 'sigles') return;
    const perimetre = selectionner('#perimetreEntrainement')?.value || 'tous';
    const maximum = obtenirPoolEntrainementMissionSigles(perimetre).length;
    const boutonTous = selectionner('#boutonEntrainementTousQuestions');
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    if (boutonTous) {
        boutonTous.dataset.valeur = 'tous';
        boutonTous.dataset.nombreMax = String(maximum);
        boutonTous.textContent = 'Tous';
        boutonTous.hidden = false;
        boutonTous.disabled = false;
    }
    if (selectNombre && ![...selectNombre.options].some(option => Number(option.value) === maximum)) {
        const option = document.createElement('option');
        option.value = String(maximum);
        option.textContent = String(maximum);
        selectNombre.appendChild(option);
    }
}

function configurerEntrainementMissionSiglesNatif() {
    const ecran = selectionner('#entrainement');
    if (!ecran) return;
    etat.contexteEntrainement = 'sigles';
    ecran.dataset.contexteEntrainement = 'sigles';
    const entete = ecran.querySelector('.entrainement-entete');
    entete?.querySelector('.surtitre') && (entete.querySelector('.surtitre').textContent = 'Mission Sigles');
    entete?.querySelector('h1') && (entete.querySelector('h1').textContent = 'Choisis ta session');
    entete?.querySelector('p') && (entete.querySelector('p').textContent = 'Entraîne-toi sur les sigles avec exactement les mêmes réglages que dans Quiz CJPM.');
    const resultatDe = selectionner('#resultatDeParcours');
    if (resultatDe) resultatDe.textContent = `Lance le dé pour tirer de 1 à 6 questions aléatoires parmi les ${obtenirPoolDomaineSigles().length} sigles ${libelleDomaineSigles()}.`;
    const selectPerimetre = selectionner('#perimetreEntrainement');
    const groupePerimetre = document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    if (selectPerimetre && groupePerimetre) {
        const options=[...['cjpm','pjj','tous'].map(d=>({valeur:d,titre:d==='tous'?'Tous les sigles':`Sigles ${libelleDomaineSigles(d)}`,detail:`${obtenirPoolDomaineSigles(d).length} sigles`,couleur:d==='cjpm'?'#d49a00':'#4f8cff',couleurTexte:d==='cjpm'?'#ffd36a':'#9fc2ff',couleurRgb:d==='cjpm'?'212,154,0':'79,140,255'})),
            ...numerosEtapesSigles('tous').map(n=>({...ETAPES_MISSION_SIGLES[n],valeur:String(n),titre:`${libelleDomaineSigles(ETAPES_MISSION_SIGLES[n].domaine)} ${ETAPES_MISSION_SIGLES[n].numero} · ${ETAPES_MISSION_SIGLES[n].titre}`,detail:`${obtenirSiglesEtape(n).length} sigles`}))];
        selectPerimetre.innerHTML=options.map(o=>`<option value="${o.valeur}">${o.titre}</option>`).join('');
        groupePerimetre.innerHTML=options.map(o=>`<button class="choix-bouton" data-valeur="${o.valeur}" type="button" style="--parcours-accent:${o.couleur};--parcours-accent-lisible:${o.couleurTexte};--parcours-accent-rgb:${o.couleurRgb}"><b>${o.titre}</b><span>${o.detail}</span></button>`).join('');
        selectPerimetre.value=obtenirDomaineSigles();
        groupePerimetre.dataset.selectionEffectuee='true';
        initialiserGroupesChoix();
    }
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const groupeNombre = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (selectNombre && groupeNombre) {
        selectNombre.innerHTML = Array.from({length:SIGLES.length},(_,i)=>i+1).map(n=>`<option value="${n}">${n}</option>`).join('');
        const boutons = [...groupeNombre.querySelectorAll('.choix-bouton')];
        const valeurs = ['10','20','30','tous'];
        boutons.forEach((bouton,index)=>{ bouton.dataset.valeur = valeurs[index]; bouton.textContent = index === 3 ? 'Tous' : valeurs[index]; bouton.hidden = false; bouton.disabled = false; });
        selectNombre.value = '10';
        groupeNombre.dataset.selectionEffectuee = 'true';
        groupeNombre.dataset.modeSelectionNombre = 'rapide';
    }
    const carteOrdonnee = ecran.querySelector('[data-carte-entrainement="ordonne"]');
    const carteMelangee = ecran.querySelector('[data-carte-entrainement="melange"]');
    carteOrdonnee?.querySelector('h3') && (carteOrdonnee.querySelector('h3').textContent = 'Par ordre d’étapes');
    carteOrdonnee?.querySelector(':scope > p') && (carteOrdonnee.querySelector(':scope > p').textContent = 'Suis la progression des étapes de Mission Sigles.');
    carteMelangee?.querySelector('h3') && (carteMelangee.querySelector('h3').textContent = 'Mélangé');
    carteMelangee?.querySelector(':scope > p') && (carteMelangee.querySelector(':scope > p').textContent = 'Brasse les sigles du périmètre choisi.');
    selectionner('#boutonLancerLeDe').onclick = lancerDeSiglesEntrainementNatif;
    selectionner('#boutonJouerLeTirage').onclick = jouerTirageDeSiglesEntrainementNatif;
    if (groupePerimetre) {
        groupePerimetre.querySelectorAll('.choix-bouton').forEach(bouton => {
            const actionOriginale = bouton.onclick;
            bouton.onclick = () => {
                actionOriginale?.();
                const perimetre=selectPerimetre.value;
                obtenirSauvegardeJeuSigles().domaine=['cjpm','pjj','tous'].includes(perimetre)?perimetre:ETAPES_MISSION_SIGLES[Number(perimetre)].domaine;
                etatJeuSigles.tirageHasard=[];
                selectionner('#boutonJouerLeTirage')?.classList.add('masque');
                resultatDe.textContent=`Lance le dé dans ce périmètre de ${obtenirPoolEntrainementMissionSigles(perimetre).length} sigles.`;
                enregistrerSauvegarde();
                actualiserBoutonTousMissionSigles();
                actualiserLimiteQuestionsEntrainement();
                actualiserBoutonTousMissionSigles();
                actualiserGroupesChoix();
            };
        });
    }
    actualiserBoutonTousMissionSigles();
    actualiserLimiteQuestionsEntrainement();
    actualiserBoutonTousMissionSigles();
    actualiserGroupesChoix();
}
function restaurerEntrainementPJJoueNatif() {
    const ecran = selectionner('#entrainement');
    if (!ecran || !['sigles','mesures'].includes(ecran.dataset.contexteEntrainement)) return;
    ecran.dataset.contexteEntrainement = 'pjjoue';
    etat.contexteEntrainement = null;
    const entete = ecran.querySelector('.entrainement-entete');
    entete?.querySelector('.surtitre') && (entete.querySelector('.surtitre').textContent = 'Entraînement libre');
    entete?.querySelector('h1') && (entete.querySelector('h1').textContent = 'Choisis ta session');
    entete?.querySelector('p') && (entete.querySelector('p').textContent = 'Lance un défi surprise en un clic ou compose précisément ce que tu veux travailler, la durée et l’ordre des questions.');
    const resultatDe = selectionner('#resultatDeParcours');
    if (resultatDe) resultatDe.textContent = 'Lance le dé pour tirer de 1 à 6 questions aléatoires dans les six parcours.';
    const selectPerimetre = selectionner('#perimetreEntrainement');
    const groupePerimetre = document.querySelector('[data-groupe-choix="perimetreEntrainement"]');
    const donnees = [
        ['tous','Tout Quiz CJPM','Les 6 parcours'],
        ['procedure_ordinaire','01 · De l’enquête à la sanction',''],
        ['information_judiciaire','02 · Information judiciaire','Avant le jugement'],
        ['jugement_educatif_ordinaire','03 · Du jugement à la sanction','Réponse éducative'],
        ['matiere_criminelle_peines','04 · De la qualification criminelle aux peines','Matière criminelle'],
        ['application_execution_peines','05 · Après la sanction','Application et exécution'],
        ['commun','Option · Parcours 06 · Découvrir la PJJ','Culture commune PJJ']
    ];
    if (selectPerimetre && groupePerimetre) {
        selectPerimetre.innerHTML = donnees.map(([v,b])=>`<option value="${v}">${b.replace(/^\d+ · /,'')}</option>`).join('');
        groupePerimetre.innerHTML = donnees.map(([v,b,sp],index)=>`<button class="choix-bouton${index===0?' actif entrainement-perimetre-global':''}" data-valeur="${v}" type="button"><b>${b}</b>${sp ? `<span>${sp}</span>` : ''}</button>`).join('');
        selectPerimetre.value = 'tous';
        groupePerimetre.dataset.selectionEffectuee = 'true';
    }
    const selectNombre = selectionner('#nombreQuestionsEntrainement');
    const groupeNombre = document.querySelector('[data-groupe-choix="nombreQuestionsEntrainement"]');
    if (selectNombre && groupeNombre) {
        selectNombre.innerHTML = Array.from({length:54},(_,i)=>(i+1)*10).concat([660]).map(n=>`<option value="${n}">${n}</option>`).join('');
        const valeurs=['10','20','30','tous'];
        [...groupeNombre.querySelectorAll('.choix-bouton')].forEach((bouton,index)=>{bouton.dataset.valeur=valeurs[index];bouton.textContent=index===3?'Tous':valeurs[index];bouton.hidden=false;bouton.disabled=false;});
        selectNombre.value='10';
        groupeNombre.dataset.modeSelectionNombre='rapide';
    }
    const carteOrdonnee = ecran.querySelector('[data-carte-entrainement="ordonne"]');
    const carteMelangee = ecran.querySelector('[data-carte-entrainement="melange"]');
    carteOrdonnee?.querySelector(':scope > p') && (carteOrdonnee.querySelector(':scope > p').textContent = 'Suis la progression pédagogique du parcours choisi.');
    carteMelangee?.querySelector(':scope > p') && (carteMelangee.querySelector(':scope > p').textContent = 'Brasse les questions du périmètre choisi.');
    initialiserGroupesChoix();
    selectionner('#boutonLancerLeDe').onclick = lancerDeParcours;
    selectionner('#boutonJouerLeTirage').onclick = jouerTirageDeParcours;
    appliquerCouleursParcoursEntrainement();
    actualiserLimiteQuestionsEntrainement();
    actualiserGroupesChoix();
}
function ouvrirEntrainementMissionSiglesNatif() {
    configurerEntrainementMissionSiglesNatif();
    afficherEcran('entrainement');
}
function lancerDeSiglesEntrainementNatif() {
    const face=selectionner('#faceDeParcours'), resultat=selectionner('#resultatDeParcours'), lancer=selectionner('#boutonLancerLeDe'), jouer=selectionner('#boutonJouerLeTirage');
    if(!face||!resultat||!lancer||!jouer)return;
    const pool=obtenirPoolEntrainementMissionSigles(selectionner('#perimetreEntrainement').value);
    const valeur=1+Math.floor(Math.random()*Math.min(6,pool.length));
    lancer.disabled=true; jouer.classList.add('masque'); face.classList.remove('de-en-lancer'); void face.offsetWidth; face.classList.add('de-en-lancer');
    window.setTimeout(()=>{
        etat.nombreQuestionsTirageDe=valeur;
        etatJeuSigles.nombreTire=valeur;
        etatJeuSigles.tirageHasard=choisirSansDoublon(pool,valeur);
        face.dataset.face=String(valeur); face.classList.remove('de-en-lancer');
        resultat.textContent=`${valeur} question${valeur===1?'':'s'} tirée${valeur===1?'':'s'} au hasard parmi les ${pool.length} sigles du périmètre choisi.`;
        jouer.textContent=`Lancer ${valeur} question${valeur===1?'':'s'}`; jouer.classList.remove('masque');
        lancer.textContent='Relancer le dé'; lancer.disabled=false; jouer.focus({preventScroll:true});
    },420);
}
function jouerTirageDeSiglesEntrainementNatif() {
    const cibles=[...etatJeuSigles.tirageHasard]; if(!cibles.length)return;
    preparerSessionMissionSiglesNative({mode:'hasard',sigles:cibles,questions:creerQuestionsHasardSigles(cibles),jokersActifs:true,titre:`Défi du hasard · ${cibles.length} question${cibles.length===1?'':'s'}`,chronoActif:false});
}
function lancerEntrainementMissionSiglesNatif() {
    const perimetre = selectionner('#perimetreEntrainement')?.value || 'tous';
    const pool = obtenirPoolEntrainementMissionSigles(perimetre);
    const nombre = Math.min(pool.length, Math.max(1, Number(selectionner('#nombreQuestionsEntrainement')?.value) || 10));
    const organisation = etat.organisationSession || 'ordonne';
    let cibles = organisation === 'ordonne'
        ? [...pool].sort((a,b)=>Number(a.etape)-Number(b.etape)||Number(a.id)-Number(b.id)).slice(0,nombre)
        : choisirSansDoublon(pool,nombre);
    const questions = creerQuestionsEntrainementSigles(cibles, organisation === 'melange');
    preparerSessionMissionSiglesNative({
        mode:'entrainement', sigles:cibles, questions,
        jokersActifs: etat.jokersSessionActifs !== false,
        titre:`Entraînement Sigles · ${nombre} sigle${nombre===1?'':'s'}`,
        chronoActif: etat.chronometreSessionActif === true,
        secondesQuestion: etat.dureeChronometreSession || 30
    });
}

function initialiserJeuSigles(){ const racine=selectionnerSigles('#sigles');if(!racine||racine.dataset.initialise==='true')return;racine.dataset.initialise='true';
    selectionnerSigles('#siglesOuvrirParcours')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Ouvrir le parcours des étapes');actualiserAccueilSigles();afficherVueSigles('parcours');});
    selectionnerSigles('#siglesOuvrirEntrainement')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Configurer un entraînement');actualiserAccueilSigles();ouvrirEntrainementMissionSiglesNatif();});
    selectionnerSigles('#siglesRetourDepuisParcours')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesRetourDepuisEntrainement')?.addEventListener('click',retourAccueilSigles);
    selectionnerSigles('#siglesLancerEntrainement')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Lancer un entraînement');lancerEntrainementSigles();}); selectionnerSigles('#siglesLancerDe')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Défi du hasard · lancer le dé');lancerDeSigles();}); selectionnerSigles('#siglesJouerTirage')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Défi du hasard · jouer le tirage');jouerTirageDeSigles();}); selectionnerSigles('#siglesLancerRevision')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Réviser les erreurs');lancerRevisionSigles();}); selectionnerSigles('#siglesLancerEvaluation')?.addEventListener('click',()=>{envoyerOptionDeJeuAnalytics('Évaluation finale');lancerEvaluationSigles();});
    selectionnerSigles('#siglesQuitterSession')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesPasserQuestion')?.addEventListener('click',passerQuestionSigles); selectionnerSigles('#siglesValiderActivite')?.addEventListener('click',validerAssociationSigles); selectionnerSigles('#siglesQuestionSuivante')?.addEventListener('click',questionSuivanteSigles); selectionnerSigles('#siglesRetourAccueil')?.addEventListener('click',retourAccueilSigles); selectionnerSigles('#siglesRejouerSession')?.addEventListener('click',rejouerDerniereSessionSigles);
    selectionnerTousSigles('#siglesChoixNombre button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixNombre'),b);envoyerOptionDeJeuAnalytics(`Nombre de questions : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixOrganisation button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixOrganisation'),b);envoyerOptionDeJeuAnalytics(`Organisation : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixChrono button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixChrono'),b);actualiserChoixChronoSigles();envoyerOptionDeJeuAnalytics(`Chronomètre : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixSecondes button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixSecondes'),b);envoyerOptionDeJeuAnalytics(`Durée par question : ${b.textContent.trim()}`);})); selectionnerTousSigles('#siglesChoixJokers button').forEach(b=>b.addEventListener('click',()=>{activerBoutonGroupeSigles(selectionnerSigles('#siglesChoixJokers'),b);envoyerOptionDeJeuAnalytics(`Jokers : ${b.textContent.trim()}`);})); selectionnerTousSigles('[data-joker-sigles]').forEach(b=>b.addEventListener('click',()=>utiliserJokerSigles(b.dataset.jokerSigles)));
    actualiserAccueilSigles(); actualiserChoixChronoSigles();
}
initialiserJeuSigles();
