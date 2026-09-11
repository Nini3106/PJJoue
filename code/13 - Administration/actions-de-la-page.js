'use strict';

/**
 * Éditeur local de la banque de questions de PJJoue V1.
 *
 * Les modifications restent dans le navigateur. L’outil exporte ensuite un
 * fichier JSON qui doit être contrôlé avant d’être réintégré au projet.
 */

const CLE_BROUILLON_ADMINISTRATION = 'pjjoue_v1_brouillon_administration';
const themesAdministration = window.DONNEES_PJJ?.THEMES || [];
const questionsOriginales = window.DONNEES_PJJ?.QUESTIONS || [];
let questionsModifiables = structuredClone(questionsOriginales);

const selectionner = selecteur => document.querySelector(selecteur);

function afficherEtat(message) {
  selectionner('#etatAdministration').textContent = message;
}

function enregistrerBrouillon() {
  try {
    localStorage.setItem(CLE_BROUILLON_ADMINISTRATION, JSON.stringify(questionsModifiables));
    afficherEtat('Brouillon local enregistré.');
  } catch (_erreur) {
    afficherEtat('Le brouillon local ne peut pas être enregistré dans ce navigateur.');
  }
}

function validerBrouillon(brouillon) {
  if (!Array.isArray(brouillon) || brouillon.length !== questionsOriginales.length) return null;
  const questionsParIdentifiant = new Map(
    brouillon.map(question => [Number(question?.id), question])
  );
  const questionsValidees = [];
  for (const questionOriginale of questionsOriginales) {
    const questionBrouillon = questionsParIdentifiant.get(Number(questionOriginale.id));
    if (!questionBrouillon || typeof questionBrouillon !== 'object' || Array.isArray(questionBrouillon)) {
      return null;
    }
    questionsValidees.push({
      ...structuredClone(questionOriginale),
      ...structuredClone(questionBrouillon),
      id: questionOriginale.id,
      versionContenu: questionBrouillon.versionContenu || questionOriginale.versionContenu || 'V1'
    });
  }
  return questionsValidees;
}

function chargerBrouillon() {
  try {
    const contenu = localStorage.getItem(CLE_BROUILLON_ADMINISTRATION);
    if (!contenu) return;
    const brouillon = validerBrouillon(JSON.parse(contenu));
    if (brouillon) questionsModifiables = brouillon;
  } catch (_erreur) {
    // Un brouillon illisible est ignoré : la banque officielle reste disponible.
  }
}

function controlerQuestions() {
  const anomalies = [];
  const identifiants = new Set();
  questionsModifiables.forEach(question => {
    if (identifiants.has(question.id)) anomalies.push(`ID dupliqué : ${question.id}`);
    identifiants.add(question.id);
    if (!String(question.enonce || '').trim()) anomalies.push(`Q${question.id}: énoncé vide`);
    if (!String(question.bonneReponse || '').trim()) anomalies.push(`Q${question.id}: réponse correcte vide`);
    if (question.modePrefere === 'choix-unique'
      && (!Array.isArray(question.mauvaisesReponses) || question.mauvaisesReponses.length < 3)) {
      anomalies.push(`Q${question.id}: moins de 3 distracteurs`);
    }
    if (!String(question.explication || '').trim()) anomalies.push(`Q${question.id}: explication vide`);
    if (!question.source) anomalies.push(`Q${question.id}: source absente`);
  });
  afficherEtat(anomalies.length
    ? `${anomalies.length} anomalie(s) : ${anomalies.slice(0, 5).join(' | ')}`
    : 'Validation structurelle : OK.');
  return anomalies;
}

function exporterQuestions() {
  controlerQuestions();
  const fichier = new Blob([JSON.stringify(questionsModifiables, null, 2)], { type: 'application/json' });
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(fichier);
  lien.download = 'questions_pjjoue_validees.json';
  lien.click();
  URL.revokeObjectURL(lien.href);
}

function modifierChamp(question, champ, valeur) {
  question[champ] = champ === 'mauvaisesReponses'
    ? valeur.split('\n').map(texte => texte.trim()).filter(Boolean)
    : valeur;
  enregistrerBrouillon();
}

function creerCarteQuestion(question) {
  const carte = document.createElement('article');
  carte.className = 'carte-question';
  const distracteurs = (question.mauvaisesReponses || []).join('\n');
  const numeroParcours = Math.max(1, themesAdministration.findIndex(theme => theme.id === question.theme) + 1);
  carte.innerHTML = `<h2>Q${question.id} · Parcours ${numeroParcours} · Étape ${question.etape}</h2><div class="grille-question">
   <label class="pleine-largeur">Énoncé<textarea data-champ="enonce"></textarea></label>
   <label>Bonne réponse<textarea data-champ="bonneReponse"></textarea></label>
   <label>Distracteurs (1 par ligne)<textarea data-champ="mauvaisesReponses"></textarea></label>
   <label class="pleine-largeur">Explication<textarea data-champ="explication"></textarea></label>
   <label>Indice<textarea data-champ="indice"></textarea></label>
   <label>Statut<select data-champ="statutContenu"><option>À valider métier</option><option>Validée métier</option><option>À revoir</option><option>Archivée</option></select></label>
   <label>Source<input data-champ="source"></label><label>Version<input data-champ="versionContenu"></label>
  </div>`;
  const valeurs = {
    enonce: question.enonce || '',
    bonneReponse: question.bonneReponse || '',
    mauvaisesReponses: distracteurs,
    explication: question.explication || '',
    indice: question.indice || '',
    statutContenu: question.statutContenu || 'À valider métier',
    source: question.source || '',
    versionContenu: question.versionContenu || 'V1'
  };
  carte.querySelectorAll('[data-champ]').forEach(element => {
    const champ = element.dataset.champ;
    element.value = valeurs[champ];
    element.addEventListener('change', () => modifierChamp(question, champ, element.value));
  });
  return carte;
}

function afficherQuestions() {
  const theme = selectionner('#filtreParcours')?.value || 'tous';
  const etape = Number(selectionner('#filtreEtape').value || 0);
  const recherche = selectionner('#rechercheQuestions').value.toLowerCase().trim();
  const questionsFiltrees = questionsModifiables.filter(question =>
    (theme === 'tous' || question.theme === theme)
    && (!etape || Number(question.etape) === etape)
    && (!recherche || JSON.stringify(question).toLowerCase().includes(recherche))
  );
  selectionner('#nombreQuestionsAffichees').textContent = `${questionsFiltrees.length} question(s) affichée(s)`;
  const liste = selectionner('#listeQuestions');
  liste.replaceChildren(...questionsFiltrees.map(creerCarteQuestion));
}

function ouvrirFenetreReinitialisation() {
  const fenetre = selectionner('#fenetreReinitialisation');
  const annuler = selectionner('#annulerReinitialisation');
  const confirmer = selectionner('#confirmerReinitialisation');
  const fermer = selectionner('#fermerReinitialisation');
  if (!fenetre || !annuler || !confirmer || !fermer) {
    afficherEtat('La confirmation de réinitialisation est indisponible.');
    return;
  }
  const fermerFenetre = () => { if (fenetre.open) fenetre.close(); };
  annuler.onclick = fermerFenetre;
  fermer.onclick = fermerFenetre;
  confirmer.onclick = () => {
    questionsModifiables = structuredClone(questionsOriginales);
    localStorage.removeItem(CLE_BROUILLON_ADMINISTRATION);
    afficherQuestions();
    afficherEtat('Brouillon local réinitialisé.');
    fermerFenetre();
  };
  fenetre.oncancel = evenement => { evenement.preventDefault(); fermerFenetre(); };
  fenetre.showModal();
  requestAnimationFrame(() => annuler.focus());
}

chargerBrouillon();
selectionner('#filtreParcours')?.addEventListener('change', afficherQuestions);
selectionner('#filtreEtape').addEventListener('change', afficherQuestions);
selectionner('#rechercheQuestions').addEventListener('input', afficherQuestions);
selectionner('#boutonControler').addEventListener('click', controlerQuestions);
selectionner('#boutonExporter').addEventListener('click', exporterQuestions);
selectionner('#boutonReinitialiser').addEventListener('click', ouvrirFenetreReinitialisation);
afficherQuestions();
