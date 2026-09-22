"""Contrat design-only par rapport à l'artefact GitHub Pages 10633915236."""
from __future__ import annotations
from html.parser import HTMLParser
from pathlib import Path
from hashlib import sha256
import base64,json,re,unittest
RACINE=Path(__file__).resolve().parents[1]
CONTRAT=json.loads((RACINE/'tests/atlas_integrite.json').read_text(encoding='utf-8'))
FINITIONS=json.loads((RACINE/'tests/v1_finitions_changements.json').read_text(encoding='utf-8'))
def revenir_avant_finitions(fichier, contenu):
    """Les seuls écarts autorisés sont inversés avant les contrôles historiques.
    Les empreintes d'origine ne sont pas modifiées. Les réglages de texte Grande
    sont la seule modification de défaut expressément demandée par la propriétaire.
    """
    modifications=FINITIONS.get(fichier,[])
    if not modifications:return contenu
    texte=contenu.decode('utf-8')
    for modification in reversed(modifications):
        if texte.count(modification['apres'])!=modification['occurrences']:
            raise AssertionError((fichier,'Substitution de finition inattendue',modification['apres']))
        texte=texte.replace(modification['apres'],modification['avant'])
    return texte.encode('utf-8')

class Identifiants(HTMLParser):
    def __init__(self,source):
        super().__init__();self.ids=[];self.feed(source)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
class IntegriteAtlas(unittest.TestCase):
    def test_aucun_identifiant_natif_perdu_ni_duplique(self):
        ids=Identifiants((RACINE/'index.html').read_text(encoding='utf-8')).ids
        self.assertEqual(len(ids),len(set(ids)))
        self.assertTrue(set(CONTRAT['identifiants_originaux'])<=set(ids))
    def test_donnees_et_moteurs_metier_inchanges(self):
        for fichier,empreinte in CONTRAT['fichiers_metier_inchanges'].items():
            with self.subTest(fichier=fichier):
                contenu=revenir_avant_finitions(fichier,(RACINE/fichier).read_bytes())
                modifications=json.loads((RACINE/'tests/atlas_v1_changements_presentation.json').read_text(encoding='utf-8')).get(fichier,[])
                if modifications:
                    texte=contenu.decode('utf-8')
                    for modification in reversed(modifications):
                        self.assertEqual(texte.count(modification['apres']),modification['occurrences'],fichier)
                        texte=texte.replace(modification['apres'],modification['avant'])
                    contenu=texte.encode('utf-8')
                self.assertEqual(sha256(contenu).hexdigest(),empreinte)
    def test_retouche_v1_limitee_a_la_presentation(self):
        changements=json.loads((RACINE/'tests/atlas_v1_changements_presentation.json').read_text(encoding='utf-8'))
        empreintes=json.loads((RACINE/'tests/atlas_v1_empreintes_presentation.json').read_text(encoding='utf-8'))
        self.assertEqual(set(changements),set(empreintes))
        for fichier,empreinte in empreintes.items():
            with self.subTest(fichier=fichier):
                texte=revenir_avant_finitions(fichier,(RACINE/fichier).read_bytes()).decode('utf-8')
                for modification in reversed(changements[fichier]):
                    self.assertEqual(texte.count(modification['apres']),1)
                    texte=texte.replace(modification['apres'],modification['avant'],1)
                self.assertEqual(sha256(texte.encode()).hexdigest(),empreinte)
        paquet=json.loads((RACINE/'package.json').read_text(encoding='utf-8'))
        self.assertEqual(paquet['version'],'1.0.0')

    def test_finitions_v1_js_exactement_recensees(self):
        empreintes=json.loads((RACINE/'tests/v1_finitions_empreintes.json').read_text(encoding='utf-8'))
        self.assertEqual(set(FINITIONS),set(empreintes))
        for fichier,empreinte in empreintes.items():
            with self.subTest(fichier=fichier):
                contenu=revenir_avant_finitions(fichier,(RACINE/fichier).read_bytes())
                self.assertEqual(sha256(contenu).hexdigest(),empreinte)

    def test_consentement_seul_le_nom_visible_a_change(self):
        c=CONTRAT['consentement_changement_presentation_uniquement']
        for fichier in ['code/01 - Éléments communs/Analytics/consentement-analytics.js','ressources/consentement-analytics.js']:
            contenu=(RACINE/fichier).read_text(encoding='utf-8')
            self.assertEqual(contenu.count(c['nouveau_fragment']),1)
            ancien=contenu.replace(c['nouveau_fragment'],c['ancien_fragment'])
            self.assertEqual(sha256(ancien.encode()).hexdigest(),c['sha256_avant'])
    def test_empreintes_analytics_actualisees(self):
        for fichier,empreinte in json.loads((RACINE/'tests/empreintes_analytics.json').read_text(encoding='utf-8')).items():
            self.assertEqual(sha256((RACINE/fichier).read_bytes()).hexdigest(),empreinte)
    def test_une_seule_base_visuelle_pas_de_surcouche_historique(self):
        source=(RACINE/'ressources/styles/pjjoue-principal.css').read_text(encoding='utf-8')
        self.assertLess(len(source.encode()),85000)
        self.assertNotIn('--bleu-nuit-950',source)
        self.assertNotIn('panorama-accueil',source)
        self.assertNotIn('@import',source)
        commun=(RACINE/'ressources/styles/atlas-systeme.css').read_text(encoding='utf-8')
        for couleur in ['#f4f0e8','#ebe4d8','#ffffff','#172d48','#214fba','#f3d86c']:
            self.assertIn(couleur,commun)
    def test_sources_securite_scripts_inline(self):
        plan=json.loads((RACINE/'code/plan-construction.json').read_text(encoding='utf-8'))
        pages=['index.html','parcours/index.html']+[item['sortie'] for item in plan['pages_autonomes']]
        for fichier in pages:
            page=(RACINE/fichier).read_text(encoding='utf-8')
            for attributs,corps in re.findall(r'<script\b([^>]*)>(.*?)</script>',page,re.S|re.I):
                if 'application/ld+json' in attributs:
                    json.loads(corps)
                elif 'src=' not in attributs and corps.strip():
                    empreinte=base64.b64encode(sha256(corps.encode()).digest()).decode()
                    self.assertIn('sha256-'+empreinte,page,fichier)
    def test_aucune_cle_de_stockage_fausse_progression(self):
        presentation=(RACINE/'code/01 - Éléments communs/Presentation-Atlas.js').read_text(encoding='utf-8')
        self.assertNotIn('localStorage.setItem',presentation)
        self.assertNotIn('sauvegarde =',presentation)
        self.assertIn('calculerProgressionParcours',presentation)
if __name__=='__main__':unittest.main()
