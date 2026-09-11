import json
import unittest
from pathlib import Path

RACINE = Path(__file__).resolve().parents[1]
DATE_AUDIT = '2026-08-30'


class TestAuditJuridiqueMissionMesures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.donnees = json.loads((RACINE / 'donnees' / 'mesures.json').read_text(encoding='utf-8'))
        cls.sources = json.loads((RACINE / 'donnees' / 'sources.json').read_text(encoding='utf-8'))
        cls.par_cle = {r['cle']: r for r in cls.donnees['reperes']}
        cls.evaluation = {q['id']: q for q in cls.donnees['evaluation']}

    def test_audit_date_et_volume(self):
        self.assertEqual(self.donnees['derniereVerification'], DATE_AUDIT)
        self.assertEqual(self.donnees['auditJuridique']['date'], DATE_AUDIT)
        self.assertIn('2026-651', self.donnees['auditJuridique']['reformeIntegree'])
        self.assertGreaterEqual(len(self.donnees['reperes']), 126)
        self.assertGreaterEqual(len(self.donnees['evaluation']), 52)
        self.assertTrue(all(r.get('derniereVerification') == DATE_AUDIT for r in self.donnees['reperes']))

    def test_sources_legifrance_mission_mesures_reverifiees(self):
        refs = set()
        for element in [*self.donnees['reperes'], *self.donnees['evaluation']]:
            source = element.get('source')
            refs.update(source if isinstance(source, list) else [source])
        for ref in refs:
            self.assertTrue(ref.startswith('LEGIFRANCE_'), ref)
            self.assertEqual(self.sources[ref].get('dateVerification'), DATE_AUDIT, ref)
            self.assertIn('legifrance.gouv.fr', self.sources[ref].get('url', ''), ref)
            self.assertIn('30/08/2026', self.sources[ref].get('auditMissionMesures', ''), ref)

    def test_mejp_contenu_et_limites(self):
        r = self.par_cle['mejp_stades']
        self.assertIn('tous les stades avant le prononcé de la sanction', r['bonneReponseIntroduction'])
        self.assertIn('Insertion, réparation, santé et placement', self.par_cle['mejp_modules']['bonneReponseIntroduction'])
        self.assertIn('8° et 9°', self.par_cle['mejp_obligations_exclues']['explicationIntroduction'])
        self.assertIn('six mois', self.par_cle['mejp_presentation']['bonneReponseIntroduction'].casefold())
        self.assertIn('ase', self.par_cle['mejp_ase']['bonneReponseIntroduction'].casefold())
        self.assertIn('vingt-et-un ans', self.par_cle['mejp_majorite']['bonneReponseIntroduction'])

    def test_deferrement_ne_confond_pas_exception_arse_13_ans(self):
        r = self.par_cle['deferrement_arse']
        self.assertIn('Seize ans', r['bonneReponseIntroduction'])
        self.assertIn('L423-9', r['questionIntroduction'])
        self.assertIn('L333-1-1', r['questionRappel'])
        self.assertIn('Non', r['bonneReponseRappel'])
        self.assertIn('seize ans', r['bonneReponseRappel'])

    def test_cj_moins_de_seize_ans_debat_contradictoire(self):
        r = self.par_cle['cj_moins16_debat']
        self.assertIn('débat contradictoire', r['bonneReponseIntroduction'])
        self.assertIn('mineur et son avocat', r['bonneReponseIntroduction'])
        self.assertIn('L331-4', r['explicationIntroduction'])

    def test_dp_regles_ages_et_mejp_obligatoire(self):
        self.assertIn('moins de treize ans', self.par_cle['dp_age']['bonneReponseIntroduction'])
        self.assertIn('doit être prononcée', self.par_cle['dp_mejp_associee']['bonneReponseIntroduction'])
        self.assertIn('placement CEF', self.par_cle['dp_moins16_hypotheses']['bonneReponseIntroduction'])
        self.assertIn('au moins trois ans', self.par_cle['dp_16plus_hypotheses']['bonneReponseIntroduction'])

    def test_mee_revocation_et_mise_en_liberte(self):
        self.assertIn('débat contradictoire', self.par_cle['mee_revocation_debat']['bonneReponseIntroduction'])
        self.assertIn('quatre jours', self.par_cle['mee_debat_differe']['bonneReponseIntroduction'])
        self.assertIn('un mois', self.par_cle['mee_dp_un_mois']['bonneReponseIntroduction'].casefold())
        self.assertIn('Deux', self.par_cle['mee_max_deux_revocations']['bonneReponseIntroduction'])
        self.assertIn('dix jours', self.par_cle['mee_second_dp_sanction']['bonneReponseIntroduction'])
        self.assertIn('cinq jours', self.par_cle['mee_demande_mise_liberte']['bonneReponseIntroduction'])

    def test_mej_modules_et_conditions(self):
        self.assertIn('module réparation', self.par_cle['avertissement_mej_reparation']['bonneReponseIntroduction'])
        self.assertIn('plus de dix ans', self.par_cle['mej_age_10']['bonneReponseIntroduction'])
        self.assertIn('Cinq ans', self.par_cle['mej_duree']['bonneReponseIntroduction'])
        self.assertIn('accord de la victime', self.par_cle['module_reparation_victime']['bonneReponseIntroduction'].casefold())
        self.assertIn('avis médical circonstancié', self.par_cle['module_sante_avis_medical']['bonneReponseIntroduction'])
        self.assertIn('droits et de l’autonomie', self.par_cle['module_sante_cdaph']['bonneReponseIntroduction'])
        self.assertIn('exclut les CEF', self.par_cle['module_placement_cef_exclu']['bonneReponseIntroduction'])
        self.assertIn('quinze jours', self.par_cle['module_placement_urgence']['bonneReponseIntroduction'])

    def test_reforme_juillet_2026_reglement_instruction(self):
        self.assertIn('Deux mois, renouvelables une seule fois pour un mois', self.par_cle['dp_renvoi_correctionnel_moins16_2026']['bonneReponseIntroduction'])
        self.assertIn('Deux mois, renouvelables une fois', self.par_cle['dp_renvoi_correctionnel_16plus_2026']['bonneReponseIntroduction'])
        self.assertIn('Deux mois, renouvelables deux fois', self.par_cle['dp_renvoi_criminel_moins16_2026']['bonneReponseIntroduction'])
        self.assertIn('continue à produire ses effets', self.par_cle['cam_cj_arse_continuite_2026']['bonneReponseIntroduction'])
        self.assertIn('ordonnance distincte spécialement motivée', self.par_cle['cam_dp_reglement_2026']['bonneReponseIntroduction'])
        self.assertIn('Six mois', self.par_cle['cam_dp_delai_six_mois_2026']['bonneReponseIntroduction'])
        self.assertIn('chambre de l’instruction', self.par_cle['cam_mejp_apres_mise_accusation']['bonneReponseIntroduction'])

    def test_apres_sanction_mej_reste_sous_controle_je(self):
        self.assertIn('juge des enfants', self.par_cle['mej_execution_je']['bonneReponseIntroduction'].casefold())
        r = self.par_cle['jap_pas_controle_mej']
        self.assertTrue(r['bonneReponseIntroduction'].startswith('Non'))
        self.assertIn('juge des enfants', r['bonneReponseIntroduction'].casefold())

    def test_evaluation_contient_les_pieges_juridiques_actualises(self):
        for identifiant in [
            'MESEVAL38', 'MESEVAL39', 'MESEVAL40', 'MESEVAL41', 'MESEVAL42', 'MESEVAL43',
            'MESEVAL44', 'MESEVAL45', 'MESEVAL46', 'MESEVAL47', 'MESEVAL48', 'MESEVAL49',
            'MESEVAL50', 'MESEVAL51', 'MESEVAL52'
        ]:
            self.assertIn(identifiant, self.evaluation)
        self.assertIn('CDAPH', self.evaluation['MESEVAL45']['question'])
        self.assertIn('ordonnance distincte spécialement motivée', self.evaluation['MESEVAL50']['question'])


if __name__ == '__main__':
    unittest.main()
