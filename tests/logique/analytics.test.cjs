const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function collecteur(autorise = true) {
  const window = {PJJConsentement: {estAutorise: () => autorise}, dataLayer: []};
  vm.runInNewContext(fs.readFileSync('ressources/analytics-pjjoue.js', 'utf8'), {window});
  return window;
}
test('aucun envoi sans consentement ; événement inconnu et données personnelles exclus', () => {
  const refus = collecteur(false);
  assert.equal(refus.PJJ_ANALYTICS.envoyer('page_consultee', {pjjoue_page_consultee:'Accueil'}), false);
  assert.equal(refus.dataLayer.length, 0);
  const w = collecteur();
  assert.equal(w.PJJ_ANALYTICS.envoyer('inconnu'), false);
  w.PJJ_ANALYTICS.envoyer('page_consultee', {pjjoue_page_consultee:'Accueil', pjjoue_nom:'Identité', email:'secret',pjjoue_reponse_saisie:'Texte privé',pjjoue_score:100});
  assert.deepEqual(JSON.parse(JSON.stringify(w.dataLayer[0])), {event:'pjjoue_page_consultee',pjjoue_page_consultee:'Accueil'});
});
test('le modèle GTM perd le score, le résultat et le joker au changement d’événement', () => {
  const w=collecteur(), modele={consent:'conservé','gtm.uniqueEventId':7};
  w.PJJ_ANALYTICS.envoyer('session_terminee', {pjjoue_score:100,pjjoue_resultat_session:'Session terminée',pjjoue_joker_utilise_session:'Non',pjjoue_duree_session_secondes:20});
  Object.assign(modele,w.dataLayer.at(-1));
  assert.equal(modele.pjjoue_score,100);
  w.PJJ_ANALYTICS.envoyer('page_consultee',{pjjoue_page_consultee:'Supports de révision'});
  Object.assign(modele,w.dataLayer.at(-1));
  for (const k of ['score','resultat_session','joker_utilise_session','duree_session_secondes']) assert.equal(modele['pjjoue_'+k],undefined);
  assert.equal(modele.consent,'conservé');
  assert.equal(modele['gtm.uniqueEventId'],7);
});
test('toutes les combinaisons du plan respectent les limites GA4 et ne gardent aucun paramètre précédent', () => {
  const w=collecteur(), modele={};
  for (const [event,keys] of Object.entries(w.PJJ_ANALYTICS.plan)) {
    assert.ok(event.length<=40,event); assert.ok(keys.length<=25,event);
    assert.equal(new Set(keys).size,keys.length);
    for(const key of keys) assert.ok(key.length<=40,key);
    w.PJJ_ANALYTICS.envoyer(event,Object.fromEntries(w.PJJ_ANALYTICS.parametres.map(k=>[k,'x'.repeat(150)])));
    Object.assign(modele,w.dataLayer.at(-1));
    assert.deepEqual(Object.keys(modele).filter(k=>k.startsWith('pjjoue_')&&modele[k]!==undefined).sort(),Array.from(keys).sort());
    for(const key of keys) assert.equal(modele[key].length,100);
  }
});
