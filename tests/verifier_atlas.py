#!/usr/bin/env python3
"""Recette Atlas : le vrai DOM et le vrai moteur, servis en mémoire à Chromium.

Aucune assertion de score ou de reprise n'est réimplémentée dans le produit.
Les sorties sont enregistrées dans test-results/ (exclu des livraisons).
Le transport HTTP, les installations PWA réelles et les lecteurs d'écran ne sont
pas simulés comme des validations : ils demandent une recette sur l'appareil cible.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from atlas_support import construire_page_atlas, RACINE

MODES = ['choix-unique','selection-multiple','association','classer','remettre-ordre','eliminer','reponse-ecrite']
QUESTION = """mode => {
 const q = QUESTIONS.find(q => !q.estEvaluationFinale && q.modePrefere === mode);
 if (!q) throw Error('Mode absent : '+mode);
 lancerEtape(q.theme,q.etape);
 etat.indexQuestion=etat.questionsSession.findIndex(x=>x.id===q.id);
 afficherQuestion(); return q;
}"""

def verifier_geometrie(page):
    resultat=page.evaluate("""() => ({
      debordement:document.documentElement.scrollWidth-innerWidth,
      horsCadre:[...document.querySelectorAll('#qc-atlas button,#qc-atlas input:not([type=file]),#qc-atlas select,#qc-atlas h1,#qc-atlas h2,#qc-atlas summary')]
       .filter(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden' && !e.matches('.natif-masque'))
       .filter(e=>e.getBoundingClientRect().left < -2 || e.getBoundingClientRect().right > innerWidth+2)
       .map(e=>e.id||e.className)
    })""")
    assert resultat['debordement']<=1 and not resultat['horsCadre'], resultat


def fermer_fenetres(page):
    page.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>d.close())")


def bon_choix(page):
    page.locator('#zoneReponses .reponse[data-est-correcte="1"]').first.click()


def verifier_mode(page,mode):
    q=page.evaluate(QUESTION,mode)
    activite=q.get('activite') or {}
    if mode=='choix-unique':
        bon_choix(page)
    elif mode=='selection-multiple':
        for identifiant in activite['reponses']:
            page.locator(f'[data-proposition="{identifiant}"]').click()
        page.locator('#boutonValider').click()
    elif mode=='association':
        for gauche,droite in activite['associations'].items():
            page.locator(f'[data-gauche="{gauche}"]').click()
            page.locator(f'[data-droite="{droite}"]').click()
        verifier_geometrie(page)
        page.locator('#boutonValider').click()
    elif mode=='classer':
        for element,categorie in activite['classements'].items():
            page.locator(f'[data-action="attribuer-categorie"][data-element="{element}"][data-categorie="{categorie}"]').click()
        verifier_geometrie(page)
        page.locator('#boutonValider').click()
    elif mode=='remettre-ordre':
        for cible,identifiant in enumerate(activite['ordre']):
            actuel=page.evaluate('etat.brouillonActivite.ordre').index(identifiant)
            while actuel>cible:
                page.locator(f'[data-action="deplacer-ordre"][data-indice="{actuel}"][data-direction="-1"]').click()
                actuel-=1
        page.locator('#boutonValider').click()
    elif mode=='eliminer':
        # Les boutons portent les vrais indices du mélange de la session.
        indices=page.evaluate("""() => obtenirChoixQuestion(etat.questionCourante).map((texte,i)=>({texte,i})).filter(x=>!x.texte.estCorrecte).map(x=>x.i).slice(0,obtenirNombreEliminationsAttendues(etat.questionCourante))""")
        for indice in indices:
            page.locator(f'#zoneReponses [data-indice="{indice}"]').click()
        page.locator('#boutonValider').click()
    elif mode=='reponse-ecrite':
        page.locator('#reponseEcrite').fill(q['bonneReponse'])
        page.locator('#boutonValider').click()
    r=page.evaluate('''() => ({validee:etat.questionValidee,reponse:etat.reponsesSession.get(etat.questionCourante.id),correction:document.querySelector('#zoneCorrection').textContent})''')
    assert r['validee'] and r['reponse']['statut']=='correcte', r
    assert page.locator('#zoneCorrection').is_visible()
    verifier_geometrie(page)
    page.locator('#boutonQuestionSuivante').click()
    assert page.evaluate('etat.indexQuestion')>0
    page.locator('#boutonQuestionPrecedente').click()
    assert page.evaluate('etat.questionCourante.id')==q['id']


def cliquer_navigation_principale(page, identifiant_direct, ecran):
    bouton = page.locator(identifiant_direct)
    if bouton.is_visible():
        bouton.click()
        return
    page.locator('#boutonMenuMobile').click()
    assert page.locator('#menuPrincipal').is_visible()
    page.locator(f'#menuPrincipal [data-ecran="{ecran}"]').click()


def navigation(page):
    assert page.locator('#catalogueAtlas .q-chapter').count()==6
    assert page.evaluate("getComputedStyle(document.querySelector('#qc-atlas')).backgroundColor")=='rgb(244, 239, 230)'
    assert page.evaluate("getComputedStyle(document.querySelector('.q-hero h1')).fontFamily").startswith('Georgia')
    cliquer_navigation_principale(page, '#boutonParcoursPJJ', 'parcours')
    assert page.locator('#vueChoixParcours').is_visible()
    for theme in page.evaluate('THEMES.map(t=>t.id)'):
        page.evaluate('ouvrirChoixParcours()')
        page.locator(f'#selecteurParcours [data-theme="{theme}"]').click()
        assert page.locator('.chemin-etape-carte').count()==11
        assert page.locator('#carteEvaluationFinale').is_disabled()
        verifier_geometrie(page)
    page.locator('#boutonMenuMobile').click()
    assert page.locator('#menuPrincipal').is_visible()
    page.keyboard.press('Escape')
    assert not page.locator('#menuPrincipal').is_visible()
    page.locator('#boutonMenuMobile').click()
    page.locator('#boutonProgression').click()
    assert page.locator('#progression').is_visible()
    assert page.locator('#atlasProgressionListe button').count()==6
    assert not page.locator('#menuPrincipal').is_visible()


def training(page):
    cliquer_navigation_principale(page, '#boutonEntrainementLibre', 'entrainement')
    menu=page.locator('.atlas-select')
    menu.locator('summary').click()
    page.locator('[data-groupe-choix="perimetreEntrainement"] [data-valeur="procedure_ordinaire"]').click()
    assert page.locator('#perimetreEntrainement').input_value()=='procedure_ordinaire'
    assert not menu.get_attribute('open')
    assert 'enquête' in menu.locator('summary').inner_text()
    page.locator('#boutonEntrainement20Questions').click()
    assert page.locator('#nombreQuestionsEntrainement').input_value()=='20'
    menu.locator('summary').click();page.keyboard.press('Escape')
    assert not menu.get_attribute('open')
    page.locator('[data-atlas-order="melange"]').click()
    assert page.locator('#boutonLancerEntrainementMelange').is_visible()
    assert not page.locator('#boutonLancerEntrainementOrdonne').is_visible()
    opts=page.locator('#entrainement details').filter(has=page.locator('#boutonEntrainementMelangeSansJokers'))
    if opts.count() and not opts.get_attribute('open'): opts.locator('summary').click()
    page.locator('#boutonEntrainementMelangeSansJokers').click()
    page.locator('#boutonLancerEntrainementMelange').click()
    assert page.evaluate('etat.questionsSession.length')==20
    assert page.evaluate("etat.questionsSession.every(q=>q.theme==='procedure_ordinaire')")
    assert not page.locator('#boutonJokers').is_visible()
    verifier_geometrie(page)


def dice(page):
    cliquer_navigation_principale(page, '#boutonEntrainementLibre', 'entrainement')
    page.locator('#boutonLancerLeDe').click()
    page.wait_for_timeout(550)
    n=int(page.locator('#faceDeParcours').get_attribute('data-face'))
    assert 1<=n<=6
    page.locator('#boutonJouerLeTirage').click()
    assert page.evaluate('etat.questionsSession.length')==n
    verifier_geometrie(page)


def jokers(page):
    page.evaluate(QUESTION,'choix-unique')
    page.locator('#boutonJokers').click()
    assert page.locator('#fenetreJokers').is_visible()
    page.locator('#boutonJoker5050').click()
    assert page.evaluate('etat.questionCourante.id')==1
    assert len(page.locator('#zoneReponses .reponse:visible:not(:disabled)').all())<=2
    page.locator('#boutonJokers').click()
    page.locator('#boutonJokerIndice').click()
    assert page.locator('#zoneIndice').is_visible()
    page.locator('#boutonJokers').click()
    page.locator('#boutonJokerLangueAuChat').click()
    assert page.locator('#zoneCorrection').is_visible()
    assert page.evaluate('etat.questionValidee')
    verifier_geometrie(page)


def timer(page):
    page.evaluate(QUESTION,'choix-unique')
    page.locator('#boutonChronometreQuestion').click()
    assert page.locator('#boutonArreterChronometre').is_visible()
    assert '15' in page.locator('#chronometreQuestion').inner_text()
    page.locator('#boutonChronometreQuestion').click()
    assert '20' in page.locator('#chronometreQuestion').inner_text()
    page.locator('#boutonChronometreToutesQuestions').click()
    assert page.locator('#boutonChronometreToutesQuestions').get_attribute('aria-pressed')=='true'
    page.locator('#boutonArreterChronometre').click()
    assert not page.locator('#boutonArreterChronometre').is_visible()


def revision_reprise(page):
    page.evaluate(QUESTION,'choix-unique');bon_choix(page)
    identifiant=page.evaluate('etat.questionCourante.id')
    page.locator('#boutonQuestionSuivante').click()
    page.locator('#boutonPasser').click()
    page.locator('#confirmerFenetreMessage').click()
    avant=page.evaluate('etat.questionCourante.id')
    assert page.locator('#boutonRejouerErreursEtape').is_enabled()
    page.locator('#boutonRejouerErreursEtape').click()
    assert 'Reprendre ma progression' in page.locator('#boutonReprendreEtapeDepuisDebut').inner_text()
    page.locator('#boutonReprendreEtapeDepuisDebut').click()
    assert page.evaluate('etat.questionCourante.id')==avant
    assert page.evaluate('(id)=>obtenirBilanEtape("commun",1).validationsSansJoker[id]===true',identifiant)
    page.locator('#boutonReprendreEtapeDepuisDebut').click()
    assert page.evaluate('etat.indexQuestion')==0
    assert page.evaluate('(id)=>obtenirBilanEtape("commun",1).validationsSansJoker[id]===true',identifiant)
    page.locator('#boutonReinitialiserValidationsSansJoker').click()
    assert page.locator('#fenetreMessage').is_visible()
    page.locator('#annulerFenetreMessage').click()
    assert page.evaluate('(id)=>obtenirBilanEtape("commun",1).validationsSansJoker[id]===true',identifiant)


def sauvegarde_transfert(page):
    page.evaluate("afficherEcran('parametres')")
    page.locator('#boutonSonDesactive').click()
    assert page.locator('#volumeSon').is_disabled()
    page.locator('#boutonSonActive').click()
    page.locator('#boutonTailleTexteGrande').click()
    assert page.evaluate('sauvegarde.parametres.echelleTexte')==1.15
    verifier_geometrie(page)
    page.locator('#boutonTailleTexteNormale').click()
    # Capture du vrai Blob, sans prétendre tester une boîte de téléchargement OS.
    page.evaluate('''() => {const creer=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{window.__exportBlob=b;return creer(b)};HTMLAnchorElement.prototype.click=function(){window.__exportNom=this.download}}''')
    page.locator('#boutonExporterMaProgression').click()
    exportee=json.loads(page.evaluate('window.__exportBlob.text()'))
    assert exportee['version']=='V1' and page.evaluate('window.__exportNom')=='Quiz_CJPM_progression.json'
    exportee['xp']=777
    page.locator('#fichierImporterProgression').set_input_files({'name':'progression.json','mimeType':'application/json','buffer':json.dumps(exportee).encode()})
    page.locator('#confirmerFenetreMessage').click()
    assert page.evaluate('sauvegarde.xp')==777
    assert page.locator('#boutonAnnulerDernierImport').is_visible()
    page.locator('#boutonAnnulerDernierImport').click()
    assert page.evaluate('sauvegarde.xp')!=777
    avant=page.evaluate('JSON.stringify(sauvegarde)')
    page.locator('#fichierImporterProgression').set_input_files({'name':'invalide.json','mimeType':'application/json','buffer':b'{invalid'})
    assert page.locator('#titreFenetreMessage').inner_text()=='Import impossible'
    page.locator('#confirmerFenetreMessage').click()
    assert page.evaluate('JSON.stringify(sauvegarde)')==avant
    page.locator('#boutonReinitialiserTouteLaProgression').click()
    assert page.locator('#annulerFenetreMessage').is_visible()
    page.locator('#annulerFenetreMessage').click()
    assert page.evaluate('JSON.stringify(sauvegarde)')==avant


def mini(page,jeu):
    page.evaluate('j=>afficherEcran(j)',jeu)
    if jeu=='sigles':
        domaine=page.locator('#siglesAccueil [data-domaine-sigles="pjj"]');domaine.click()
        assert 'PJJ' in page.locator('#siglesTitreProgression').inner_text()
    page.locator('#'+jeu+'OuvrirParcours').click()
    cartes=page.locator('#'+jeu+'Etapes button.'+jeu+'-etape-ouvrir')
    assert cartes.count()==(4 if jeu=='sigles' else 12)
    cartes.first.click()
    assert page.locator('#question').is_visible()
    verifier_geometrie(page)
    page.evaluate("j=>{afficherEcran(j,{forcerSortieQuestion:true});}",jeu)
    page.locator('#'+jeu+'RetourDepuisParcours').click()
    page.locator('#'+jeu+'OuvrirEntrainement').click()
    assert page.locator('#entrainement').is_visible()
    menu=page.locator('.atlas-select');menu.locator('summary').click()
    assert page.locator('[data-groupe-choix="perimetreEntrainement"] .choix-bouton:visible').count()>1
    page.keyboard.press('Escape')
    assert page.locator('[data-atlas-select-label]').inner_text().strip()
    page.locator('#boutonLancerEntrainementOrdonne').click()
    assert page.evaluate('etat.questionsSession.length')>0
    assert page.locator('#zoneReponses').inner_text().strip()
    verifier_geometrie(page)
    page.evaluate('j=>afficherEcran(j,{forcerSortieQuestion:true})',jeu)
    if page.locator('#'+jeu+'RetourDepuisParcours').is_visible(): page.locator('#'+jeu+'RetourDepuisParcours').click()
    page.locator('#'+jeu+'LancerDe').click();page.wait_for_timeout(550)
    page.locator('#'+jeu+'JouerTirage').click()
    assert 1<=page.evaluate('etat.questionsSession.length')<=6
    assert page.locator('#question').is_visible()


def infobulle(page):
    page.evaluate(QUESTION,'choix-unique')
    bouton=page.locator('#boutonReprendreEtapeDepuisDebut')
    bouton.scroll_into_view_if_needed();page.wait_for_timeout(250)
    if page.viewport_size['width']<600:
        page.mouse.move(2,2);bouton.focus()
    else:bouton.hover()
    page.wait_for_timeout(150)
    assert page.locator('[role="tooltip"]').is_visible()
    page.mouse.move(2,2);bouton.evaluate('e=>e.blur()');page.wait_for_timeout(50)
    assert not page.locator('[role="tooltip"]').is_visible()

    # Une aide peut être « visible » dans le DOM tout en étant sous la modale.
    page.locator('#boutonJokers').click()
    for identifiant in ['boutonJoker5050', 'boutonJokerIndice', 'boutonJokerLangueAuChat']:
        joker=page.locator('#'+identifiant)
        if page.viewport_size['width']<600: joker.focus()
        else: joker.hover()
        bulle=page.locator('[role="tooltip"]')
        assert bulle.is_visible()
        assert bulle.evaluate('''e => {
            const r=e.getBoundingClientRect(), ancien=e.style.pointerEvents;
            e.style.pointerEvents='auto';
            try {
                return r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight
                    && e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));
            } finally { e.style.pointerEvents=ancien; }
        }'''), 'L’infobulle du joker doit être au-dessus de sa fenêtre et dans l’écran'
        page.mouse.move(2,2);joker.evaluate('e=>e.blur()')
        assert not page.locator('[role="tooltip"]').is_visible()
    page.locator('#fermerFenetreJokers').click()
    assert not page.locator('#fenetreJokers [role="tooltip"]').count()


def consentement(page):
    # Cookie jar vide pour l'origine opaque, comme Storage dans le chargeur.
    page.evaluate("Object.defineProperty(document,'cookie',{configurable:true,writable:true,value:''})")
    page.add_script_tag(content=(RACINE/'ressources/consentement-analytics.js').read_text(encoding='utf-8'))
    page.add_script_tag(content=(RACINE/'ressources/analytics-pjjoue.js').read_text(encoding='utf-8'))
    assert page.locator('#pjjoueConsentement').is_visible()
    assert 'quiz cjpm' in page.locator('.pjj-consentement-marque').inner_text().lower()
    assert page.locator('#pjjoue-google-tag-manager').count()==0
    page.locator('[data-consentement="refuser"]').click()
    assert not page.evaluate('PJJConsentement.estAutorise()')
    assert not page.evaluate("PJJ_ANALYTICS.envoyer('test_refus',{xp:1})")
    assert page.evaluate("localStorage.getItem('pjjoue_consentement_analytics_v1')")=='refuse'
    page.evaluate('PJJConsentement.ouvrir()')
    page.locator('[data-consentement="accepter"]').click()
    assert page.evaluate('PJJConsentement.estAutorise()')
    assert page.evaluate("PJJ_ANALYTICS.envoyer('test_consentement',{pjjoue_nom:'ne pas transmettre',xp:1})")
    assert page.evaluate("dataLayer.at(-1).pjjoue_nom===undefined")
    assert page.locator('#pjjoue-google-tag-manager').count()==0  # contexte non HTTP
    page.evaluate('PJJConsentement.ouvrir()');verifier_geometrie(page)
    page.locator('.pjj-consentement-fermer').click()
    assert not page.locator('#pjjoueConsentement').is_visible()


def installation_interface(page):
    assert page.locator('#boutonInstallerPJJoue').get_attribute('hidden') is not None
    page.evaluate("""() => {window.__promptInstallation=0;const evenement=new Event('beforeinstallprompt',{cancelable:true});evenement.prompt=()=>{window.__promptInstallation++};evenement.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(evenement)}""")
    page.locator('#boutonMenuMobile').click()
    assert page.locator('#boutonInstallerPJJoue').is_visible()
    page.locator('#boutonInstallerPJJoue').click()
    assert page.evaluate('window.__promptInstallation')==1
    assert not page.locator('#boutonInstallerPJJoue').is_visible()
    page.evaluate("window.dispatchEvent(new Event('offline'))")
    assert 'hors connexion' in page.locator('.message-connexion').inner_text()
    page.evaluate("window.dispatchEvent(new Event('online'))")
    assert 'retrouvée' in page.locator('.message-connexion').inner_text()


def pages_responsives(navigateur,html,sortie,captures):
    # Jeux de données fictifs seulement dans la recette : le site affiche toujours
    # les résultats réels du moteur. Réemploi des fixtures du dépôt d'origine.
    from verifier_regression_visuelle import scenarios
    conserver=['bureau-question','bureau-correction','bureau-jokers','bureau-quitter','bureau-progression-peuplee','bureau-supports-ouvert','bureau-bilan','bureau-revision','bureau-parcours-detail']
    cas=[(s.nom,s.action) for s in scenarios() if any(s.nom.startswith(prefixe) for prefixe in conserver)]
    cas += [(e,"() => afficherEcran('"+e+"',{remplacerHistorique:true})") for e in ['accueil','entrainement','parcours','sigles','mesures','parametres']]
    cas += [(j+'-etapes',"() => {afficherEcran('"+j+"');document.querySelector('#"+j+"OuvrirParcours').click()}") for j in ['sigles','mesures']]
    cas += [(j+'-entrainement',"() => {afficherEcran('"+j+"');document.querySelector('#"+j+"OuvrirEntrainement').click()}") for j in ['sigles','mesures']]
    resultats=[]
    for largeur in [1440,390]:
        for nom,action in cas:
            page=navigateur.new_page(viewport={'width':largeur,'height':900 if largeur>600 else 844},reduced_motion='reduce')
            erreurs=[];page.on('pageerror',lambda e:erreurs.append(str(e)))
            page.set_content(html,wait_until='domcontentloaded');page.evaluate(action);page.wait_for_timeout(120)
            verifier_geometrie(page);assert not erreurs, erreurs
            if captures:
                page.evaluate('document.activeElement?.blur()')
                page.screenshot(path=str(sortie/f'{largeur}-{nom}.png'),full_page=True)
            resultats.append({'nom':nom,'largeur':largeur,'statut':'OK'})
            page.close()
    for largeur in [320,768,1920]:
        for ecran in ['accueil','entrainement','parcours','parametres','progression','sigles','mesures','supports']:
            page=navigateur.new_page(viewport={'width':largeur,'height':900},reduced_motion='reduce')
            page.set_content(html,wait_until='domcontentloaded');page.evaluate('e=>afficherEcran(e)',ecran)
            verifier_geometrie(page)
            resultats.append({'nom':ecran,'largeur':largeur,'statut':'OK'});page.close()
    return resultats


def pages_autonomes(navigateur,sortie,captures):
    plan=json.loads((RACINE/'code/plan-construction.json').read_text(encoding='utf-8'));resultats=[]
    for largeur in [1440,390]:
        for item in plan['pages_autonomes']:
            nom=item['sortie'];page=navigateur.new_page(viewport={'width':largeur,'height':900},reduced_motion='reduce')
            erreurs=[];page.on('pageerror',lambda e:erreurs.append(str(e)))
            page.set_content(construire_page_atlas(nom),wait_until='domcontentloaded')
            if nom=='administration.html':
                page.locator('#filtreEtape').select_option('12');page.locator('#filtreParcours').select_option('commun')
            verifier_geometrie(page)
            assert not erreurs, (nom,erreurs)
            menu=page.locator('.atlas-static-menu')
            if menu.count():
                menu.locator('summary').click();assert menu.locator('.q-pop').is_visible()
                page.keyboard.press('Escape');assert menu.get_attribute('open') is None
            if captures: page.screenshot(path=str(sortie/f'{largeur}-{nom.replace("/","-")}.png'),full_page=nom!='administration.html')
            resultats.append({'nom':nom,'largeur':largeur,'statut':'OK'});page.close()
    return resultats


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--captures',action='store_true');parser.add_argument('--sortie',default='test-results/atlas');args=parser.parse_args()
    sortie=RACINE/args.sortie;sortie.mkdir(parents=True,exist_ok=True)
    html=construire_page_atlas();resultats=[]
    cas=[('navigation',navigation),('consentement',consentement),('installation-interface',installation_interface),('entrainement',training),('de',dice),('jokers',jokers),('chronometre',timer),('revision-et-reprise',revision_reprise),('sauvegarde-import-export',sauvegarde_transfert),('sigles',lambda p:mini(p,'sigles')),('mesures',lambda p:mini(p,'mesures')),('infobulle',infobulle)]
    cas += [(m,lambda p,m=m:verifier_mode(p,m)) for m in MODES]
    echec=False
    with sync_playwright() as p:
        exe=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
        navigateur=p.chromium.launch(**({'executable_path':exe} if exe else {}),args=['--no-sandbox'])
        for largeur in [1440,390]:
            for nom,verifier in cas:
                page=navigateur.new_page(viewport={'width':largeur,'height':900},reduced_motion='reduce');page.set_default_timeout(4500)
                erreurs=[];page.on('pageerror',lambda e:erreurs.append(str(e)))
                try:
                    page.set_content(html,wait_until='domcontentloaded');verifier(page);assert not erreurs,erreurs
                    resultats.append({'nom':nom,'largeur':largeur,'statut':'OK'});print('OK',largeur,nom,flush=True)
                except Exception as erreur:
                    echec=True;resultats.append({'nom':nom,'largeur':largeur,'statut':'ECHEC','detail':str(erreur)});print('ECHEC',largeur,nom,repr(erreur),flush=True);__import__('traceback').print_exc()
                    page.screenshot(path=str(sortie/f'echec-{largeur}-{nom}.png'),full_page=True)
                finally:page.close()
        for nom,appel in [('dispositions',lambda:pages_responsives(navigateur,html,sortie,args.captures)),('pages-autonomes',lambda:pages_autonomes(navigateur,sortie,args.captures))]:
            try:
                suite=appel();resultats+=suite;print('OK',nom,len(suite),'vues',flush=True)
            except Exception as erreur:
                echec=True;resultats.append({'nom':nom,'statut':'ECHEC','detail':str(erreur)});print('ECHEC',nom,str(erreur),flush=True)
        navigateur.close()
    rapport={'environnement':'Chromium, vrais fichiers construits, origine inline / Storage de test', 'exclus':['transport HTTP/file','installation PWA réelle','lecteur d’écran','autres navigateurs'], 'scenarios':resultats}
    (sortie/'rapport.json').write_text(json.dumps(rapport,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'{sum(r["statut"]=="OK" for r in resultats)}/{len(resultats)} scénarios validés.')
    return int(echec)
if __name__=='__main__':sys.exit(main())
