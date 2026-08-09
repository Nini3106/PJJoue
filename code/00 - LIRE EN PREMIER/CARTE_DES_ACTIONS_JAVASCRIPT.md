# Carte des actions JavaScript

Ce fichier sert de **table des matières des actions**. Si tu cherches « qu’est-ce qui affiche une question ? » ou « qu’est-ce qui enregistre la progression ? », utilise la recherche dans cette page.

Les explications sont volontairement simples. Les mots techniques imposés par JavaScript ou Google restent techniques dans le vrai code lorsqu’ils ne peuvent pas être traduits.

## `code/01 - Éléments communs/JavaScript - Brancher les boutons.js`

| Action dans le code | Explication simple |
|---|---|
| `initialiserFenetreJokers()` | Prépare fenetre jokers. |
| `validerQuestionAvecEntree()` | Vérifie et valide question avec entree. |
| `verifierRenduQuestionActif()` | Action interne : verifier rendu question actif. |

## `code/01 - Éléments communs/JavaScript - Démarrage et Analytics.js`

| Action dans le code | Explication simple |
|---|---|
| `creerIconeTheme()` | Crée icone theme. |
| `envoyerEvenementPJJ()` | Envoie evenement pjj. |
| `obtenirLibellePageAnalytics()` | Cherche ou calcule libelle page analytics. |
| `obtenirLibelleTailleTexteAnalytics()` | Cherche ou calcule libelle taille texte analytics. |
| `obtenirLibelleModeJeuAnalytics()` | Cherche ou calcule libelle mode jeu analytics. |
| `obtenirInformationsEtapeAnalytics()` | Cherche ou calcule informations etape analytics. |
| `obtenirIdentifiantQuestionAnalytics()` | Cherche ou calcule identifiant question analytics. |
| `obtenirResultatReponseAnalytics()` | Cherche ou calcule resultat reponse analytics. |
| `obtenirDureeSessionAnalytics()` | Cherche ou calcule duree session analytics. |
| `obtenirContexteSessionAnalytics()` | Cherche ou calcule contexte session analytics. |
| `obtenirContexteQuestionAnalytics()` | Cherche ou calcule contexte question analytics. |
| `envoyerUtilisationJoker()` | Envoie utilisation joker. |
| `estRouteAccueil()` | Action interne : est route accueil. |
| `remettreAccueilEnHaut()` | Action interne : remettre accueil en haut. |
| `garantirAccueilEnHaut()` | Action interne : garantir accueil en haut. |
| `echapperHtml()` | Action interne : echapper html. |

## `code/01 - Éléments communs/JavaScript - Navigation et fenêtres.js`

| Action dans le code | Explication simple |
|---|---|
| `routePourEcran()` | Action interne : route pour ecran. |
| `creerEtatNavigation()` | Crée etat navigation. |
| `actualiserBoutonRetour()` | Met à jour bouton retour. |
| `mesurerHauteurEntete()` | Action interne : mesurer hauteur entete. |
| `fermerMenuMobile()` | Ferme menu mobile. |
| `basculerMenuMobile()` | Change l’état de menu mobile. |
| `actualiserNavigation()` | Met à jour navigation. |
| `ajusterQuestionAEcran()` | Action interne : ajuster question aecran. |
| `actualiserTitrePage()` | Met à jour titre page. |
| `afficherEcran()` | Affiche ecran. |
| `ouvrirFenetreMessage()` | Ouvre fenetre message. |
| `ouvrirFenetreQuitterSession()` | Ouvre fenetre quitter session. |
| `revenirEnArriere()` | Action interne : revenir en arriere. |
| `lireRoute()` | Lit route. |
| `restaurerRoute()` | Restaure route. |

## `code/01 - Éléments communs/JavaScript - Préparer les questions et sessions.js`

| Action dans le code | Explication simple |
|---|---|
| `filtrerQuestions()` | Action interne : filtrer questions. |
| `selectionnerQuestionsEquilibrees()` | Sélectionne questions equilibrees. |
| `obtenirOrdrePedagogiqueQuestion()` | Cherche ou calcule ordre pedagogique question. |
| `ordonnerQuestionsParcours()` | Action interne : ordonner questions parcours. |
| `classerLongueurReponse()` | Action interne : classer longueur reponse. |
| `selectionnerSansIndiceLongueur()` | Sélectionne sans indice longueur. |
| `obtenirQuestionsSessionEtape()` | Cherche ou calcule questions session etape. |
| `lancerEtape()` | Lance etape. |
| `obtenirQuestionsEvaluationFinale()` | Cherche ou calcule questions evaluation finale. |
| `lancerEvaluationFinale()` | Lance evaluation finale. |
| `lancerEntrainementLibre()` | Lance entrainement libre. |
| `lancerDeParcours()` | Lance de parcours. |
| `jouerTirageDeParcours()` | Action interne : jouer tirage de parcours. |
| `lancerRevision()` | Lance revision. |
| `lancerRevisionEtape()` | Lance revision etape. |

## `code/01 - Éléments communs/JavaScript - Sauvegarde locale.js`

| Action dans le code | Explication simple |
|---|---|
| `creerSauvegardeInitiale()` | Crée sauvegarde initiale. |
| `estObjetSimple()` | Action interne : est objet simple. |
| `estThemeConnu()` | Action interne : est theme connu. |
| `convertirEntierBorne()` | Action interne : convertir entier borne. |
| `filtrerIndicateurs()` | Action interne : filtrer indicateurs. |
| `filtrerResultats()` | Action interne : filtrer resultats. |
| `nettoyerProgression()` | Nettoie progression. |
| `nettoyerErreurs()` | Nettoie erreurs. |
| `migrerSauvegardeV1VersV2()` | Action interne : migrer sauvegarde v1 vers v2. |
| `migrerSauvegardeV2VersV3()` | Action interne : migrer sauvegarde v2 vers v3. |
| `nettoyerSauvegarde()` | Nettoie sauvegarde. |
| `chargerSauvegarde()` | Charge sauvegarde. |
| `effacerSauvegardeV1DuNavigateur()` | Efface sauvegarde v1 du navigateur. |
| `enregistrerSauvegarde()` | Enregistre sauvegarde. |
| `serialiserTableauAssociatif()` | Prépare pour l’enregistrement tableau associatif. |
| `serialiserEnsemble()` | Prépare pour l’enregistrement ensemble. |
| `restaurerTableauAssociatif()` | Restaure tableau associatif. |
| `restaurerEnsemble()` | Restaure ensemble. |
| `effacerSessionEnCours()` | Efface session en cours. |
| `enregistrerSessionEnCours()` | Enregistre session en cours. |
| `chargerSessionEnCours()` | Charge session en cours. |
| `restaurerSessionEnCours()` | Restaure session en cours. |
| `melanger()` | Action interne : melanger. |
| `annoncer()` | Action interne : annoncer. |
| `afficherNotification()` | Affiche notification. |
| `annulerRappelJokers()` | Action interne : annuler rappel jokers. |
| `compterJokersDisponibles()` | Compte jokers disponibles. |
| `actualiserBoutonJokers()` | Met à jour bouton jokers. |
| `fermerFenetreJokers()` | Ferme fenetre jokers. |
| `ouvrirFenetreJokers()` | Ouvre fenetre jokers. |
| `programmerRappelJokers()` | Action interne : programmer rappel jokers. |

## `code/01 - Éléments communs/JavaScript - Sons et célébrations.js`

| Action dans le code | Explication simple |
|---|---|
| `initialiserAudio()` | Prépare audio. |
| `jouerTonalite()` | Action interne : jouer tonalite. |
| `jouerSonReussite()` | Action interne : jouer son reussite. |
| `jouerSonErreur()` | Action interne : jouer son erreur. |
| `jouerSonEtapeSansJoker()` | Action interne : jouer son etape sans joker. |
| `jouerSonEvaluationFinale()` | Action interne : jouer son evaluation finale. |
| `lancerConfettis()` | Lance confettis. |

## `code/02 - Accueil/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `accorderLibelle()` | Action interne : accorder libelle. |
| `actualiserLibellesProgression()` | Met à jour libelles progression. |
| `actualiserAccueil()` | Met à jour accueil. |
| `calculerProgressionTheme()` | Calcule progression theme. |
| `obtenirTitreSymboliqueParcours()` | Cherche ou calcule titre symbolique parcours. |
| `obtenirEtapeAReprendre()` | Cherche ou calcule etape areprendre. |
| `actualiserBoutonCommencer()` | Met à jour bouton commencer. |

## `code/03 - Parcours PJJ/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `ouvrirParcours()` | Ouvre parcours. |
| `obtenirBaliseIconeEtape()` | Cherche ou calcule balise icone etape. |
| `afficherEtapes()` | Affiche etapes. |

## `code/04 - Carnet de voyage/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `obtenirProchaineDestinationParcours()` | Cherche ou calcule prochaine destination parcours. |
| `calculerAvancementCarnetParcours()` | Calcule avancement carnet parcours. |
| `actualiserCarnetParcours()` | Met à jour carnet parcours. |
| `actualiserResumeCarteParcours()` | Met à jour resume carte parcours. |
| `afficherSouvenirsParcours()` | Affiche souvenirs parcours. |
| `afficherDefisParcours()` | Affiche defis parcours. |

## `code/05 - Entraînement libre/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `initialiserGroupesChoix()` | Prépare groupes choix. |
| `actualiserGroupesChoix()` | Met à jour groupes choix. |

## `code/06 - Question/actions/01 - Comprendre et valider les réponses écrites.js`

| Action dans le code | Explication simple |
|---|---|
| `obtenirModeQuestion()` | Cherche ou calcule mode question. |
| `obtenirLibelleMode()` | Cherche ou calcule libelle mode. |
| `preparerSession()` | Prépare session. |
| `normaliserReponseEcrite()` | Action interne : normaliser reponse ecrite. |
| `normaliserReponseEvaluation()` | Action interne : normaliser reponse evaluation. |
| `extraireSiglesSaisis()` | Action interne : extraire sigles saisis. |
| `validerListeSiglesDistincts()` | Vérifie et valide liste sigles distincts. |
| `compacterSigle()` | Action interne : compacter sigle. |
| `validerFormeSigle()` | Vérifie et valide forme sigle. |
| `respecteOrdreConcepts()` | Action interne : respecte ordre concepts. |
| `contientExpressionComplete()` | Action interne : contient expression complete. |
| `contientNegation()` | Action interne : contient negation. |
| `contientNegationInattendue()` | Action interne : contient negation inattendue. |
| `calculerDistanceTextes()` | Calcule distance textes. |
| `obtenirMotsSignificatifsReponse()` | Cherche ou calcule mots significatifs reponse. |
| `obtenirRacineSouple()` | Cherche ou calcule racine souple. |
| `motsCorrespondentSouplement()` | Action interne : mots correspondent souplement. |
| `compterMotsAttendusPresents()` | Compte mots attendus presents. |
| `correspondAVarianteEvaluation()` | Action interne : correspond avariante evaluation. |
| `validerReponseEcriteEvaluation()` | Vérifie et valide reponse ecrite evaluation. |
| `validerReponseEcriteSouple()` | Vérifie et valide reponse ecrite souple. |

## `code/06 - Question/actions/02 - Activités écrites et éliminer des choix.js`

| Action dans le code | Explication simple |
|---|---|
| `masquerMoitiéTexte()` | Action interne : masquer moitiétexte. |
| `obtenirDonneesJoker5050()` | Cherche ou calcule donnees joker5050. |
| `marquerJokerUtilise()` | Action interne : marquer joker utilise. |
| `consommerJoker5050()` | Action interne : consommer joker5050. |
| `obtenirConfigurationValidation()` | Cherche ou calcule configuration validation. |
| `actualiserBoutonValider()` | Met à jour bouton valider. |
| `afficherActiviteEcrite()` | Affiche activite ecrite. |
| `validerActiviteEcrite()` | Vérifie et valide activite ecrite. |
| `obtenirNombreEliminationsAttendues()` | Cherche ou calcule nombre eliminations attendues. |
| `obtenirConsigneElimination()` | Cherche ou calcule consigne elimination. |
| `afficherActiviteEliminer()` | Affiche activite eliminer. |
| `basculerElimination()` | Change l’état de elimination. |
| `validerEliminations()` | Vérifie et valide eliminations. |

## `code/06 - Question/actions/03 - Préparer la session et la correction.js`

| Action dans le code | Explication simple |
|---|---|
| `lancerSession()` | Lance session. |
| `nettoyerEnonce()` | Nettoie enonce. |
| `raccourcirTexteReponse()` | Action interne : raccourcir texte reponse. |
| `harmoniserPresentationReponses()` | Action interne : harmoniser presentation reponses. |
| `obtenirChoixQuestion()` | Cherche ou calcule choix question. |
| `construireCorrectionDetaillee()` | Prépare correction detaillee. |
| `afficherCorrectionEnregistree()` | Affiche correction enregistree. |

## `code/06 - Question/actions/04 - Activités interactives.js`

| Action dans le code | Explication simple |
|---|---|
| `obtenirLibelleActivite()` | Cherche ou calcule libelle activite. |
| `obtenirElementsActiviteMelanges()` | Cherche ou calcule elements activite melanges. |
| `actualiserActiviteInteractive()` | Met à jour activite interactive. |
| `deplacerElementOrdre()` | Déplace element ordre. |
| `selectionnerAssociation()` | Sélectionne association. |
| `redessinerFilsAssociation()` | Action interne : redessiner fils association. |
| `initialiserBrouillonActiviteInteractive()` | Prépare brouillon activite interactive. |
| `construireConsigneActivite()` | Prépare consigne activite. |
| `construireSelectionMultiple()` | Prépare selection multiple. |
| `construireCommandesOrdre()` | Prépare commandes ordre. |
| `construireRemiseEnOrdre()` | Prépare remise en ordre. |
| `construireCommandesChoisirOrdre()` | Prépare commandes choisir ordre. |
| `construireChoisirPuisOrdonner()` | Prépare choisir puis ordonner. |
| `construireBoutonAssociationGauche()` | Prépare bouton association gauche. |
| `construireBoutonAssociationDroite()` | Prépare bouton association droite. |
| `construireAssociation()` | Prépare association. |
| `construireClassement()` | Prépare classement. |
| `construireCorpsActiviteInteractive()` | Prépare corps activite interactive. |
| `afficherActiviteInteractive()` | Affiche activite interactive. |
| `basculerChoixMultiple()` | Change l’état de choix multiple. |
| `ajouterChoixOrdre()` | Ajoute choix ordre. |
| `retirerChoixOrdre()` | Retire choix ordre. |
| `deplacerChoixOrdre()` | Déplace choix ordre. |
| `attribuerCategorie()` | Action interne : attribuer categorie. |
| `tableauxEgaux()` | Action interne : tableaux egaux. |
| `obtenirTexteAssociationDroite()` | Cherche ou calcule texte association droite. |
| `associationElementCorrespond()` | Action interne : association element correspond. |
| `validerSchemaAssociations()` | Vérifie et valide schema associations. |
| `validerAssociationsActivite()` | Vérifie et valide associations activite. |
| `validerActiviteInteractive()` | Vérifie et valide activite interactive. |

## `code/06 - Question/actions/05 - Préparer et afficher la question.js`

| Action dans le code | Explication simple |
|---|---|
| `rejouerQuestionCourante()` | Relance question courante. |
| `preparerQuestionCourante()` | Prépare question courante. |
| `afficherReperesQuestion()` | Affiche reperes question. |
| `creerBoutonChoixUnique()` | Crée bouton choix unique. |
| `afficherChoixUnique()` | Affiche choix unique. |
| `afficherModeReponseQuestion()` | Affiche mode reponse question. |
| `configurerNavigationQuestion()` | Action interne : configurer navigation question. |
| `configurerJokersQuestion()` | Action interne : configurer jokers question. |
| `configurerChronometreEtFocusQuestion()` | Action interne : configurer chronometre et focus question. |
| `appliquerIdentiteVisuelleEtape()` | Applique identite visuelle etape. |
| `actualiserSuiviEtapeQuestion()` | Met à jour suivi etape question. |
| `demanderReinitialisationSansJoker()` | Action interne : demander reinitialisation sans joker. |

## `code/06 - Question/actions/06 - Chronomètre de la question.js`

| Action dans le code | Explication simple |
|---|---|
| `afficherQuestion()` | Affiche question. |
| `gererTempsEcoule()` | Action interne : gerer temps ecoule. |
| `reprendreChronometreQuestion()` | Action interne : reprendre chronometre question. |
| `demarrerChronometreQuestion()` | Action interne : demarrer chronometre question. |

## `code/06 - Question/actions/07 - Valider corriger et naviguer.js`

| Action dans le code | Explication simple |
|---|---|
| `preparerValidationReponse()` | Prépare validation reponse. |
| `enregistrerResultatReponse()` | Enregistre resultat reponse. |
| `obtenirSuiviErreur()` | Cherche ou calcule suivi erreur. |
| `traiterReussiteAutonome()` | Action interne : traiter reussite autonome. |
| `traiterReussiteAidee()` | Action interne : traiter reussite aidee. |
| `traiterReponseIncorrecte()` | Action interne : traiter reponse incorrecte. |
| `actualiserIndicateurSerie()` | Met à jour indicateur serie. |
| `obtenirTexteCorrection()` | Cherche ou calcule texte correction. |
| `afficherCorrectionReponse()` | Affiche correction reponse. |
| `finaliserReponse()` | Action interne : finaliser reponse. |
| `choisirReponse()` | Action interne : choisir reponse. |
| `obtenirLibelleNombreJokers()` | Cherche ou calcule libelle nombre jokers. |
| `demanderPassageQuestion()` | Action interne : demander passage question. |
| `passerQuestion()` | Action interne : passer question. |
| `afficherQuestionPrecedente()` | Affiche question precedente. |
| `afficherQuestionSuivante()` | Affiche question suivante. |

## `code/06 - Question/actions/08 - Jokers de la question.js`

| Action dans le code | Explication simple |
|---|---|
| `utiliserJoker5050PourReponseEcrite()` | Action interne : utiliser joker5050 pour reponse ecrite. |
| `utiliserJoker5050PourElimination()` | Action interne : utiliser joker5050 pour elimination. |
| `utiliserJoker5050PourSelectionMultiple()` | Action interne : utiliser joker5050 pour selection multiple. |
| `utiliserJoker5050PourChoisirOrdre()` | Action interne : utiliser joker5050 pour choisir ordre. |
| `utiliserJoker5050PourOrdre()` | Action interne : utiliser joker5050 pour ordre. |
| `utiliserJoker5050PourAssociation()` | Action interne : utiliser joker5050 pour association. |
| `utiliserJoker5050PourClassement()` | Action interne : utiliser joker5050 pour classement. |
| `utiliserJoker5050PourChoixUnique()` | Action interne : utiliser joker5050 pour choix unique. |
| `utiliserJoker5050()` | Action interne : utiliser joker5050. |
| `fermerAideJokerOuverte()` | Ferme aide joker ouverte. |
| `activerCoucheJoker()` | Action interne : activer couche joker. |
| `utiliserIndice()` | Action interne : utiliser indice. |
| `utiliserLangueAuChat()` | Action interne : utiliser langue au chat. |

## `code/07 - Bilan de la session/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `afficherCelebration()` | Affiche celebration. |
| `obtenirCelebrationEtape()` | Cherche ou calcule celebration etape. |
| `sessionAUtiliseJoker()` | Action interne : session autilise joker. |
| `obtenirContexteFinSession()` | Cherche ou calcule contexte fin session. |
| `obtenirStatutErreurBilan()` | Cherche ou calcule statut erreur bilan. |
| `afficherErreursBilan()` | Affiche erreurs bilan. |
| `mettreAJourProgressionFinSession()` | Action interne : mettre ajour progression fin session. |
| `construireBilanEvaluationFinale()` | Prépare bilan evaluation finale. |
| `construireBilanSessionOrdinaire()` | Prépare bilan session ordinaire. |
| `configurerBoutonContinuerBilan()` | Action interne : configurer bouton continuer bilan. |
| `lancerTransitionVersEtape()` | Lance transition vers etape. |
| `actualiserProchaineDestinationBilan()` | Met à jour prochaine destination bilan. |
| `ouvrirSouvenirDepuisCarteFinale()` | Ouvre souvenir depuis carte finale. |
| `afficherCarteVoyageFinale()` | Affiche carte voyage finale. |
| `lancerCelebrationBilan()` | Lance celebration bilan. |
| `terminerSession()` | Termine session. |

## `code/08 - Réviser/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `afficherEtatVideErreurs()` | Affiche etat vide erreurs. |
| `obtenirQuestionsAvecErreursActives()` | Cherche ou calcule questions avec erreurs actives. |
| `regrouperErreursParEtape()` | Action interne : regrouper erreurs par etape. |
| `obtenirNumerosEtapesAvecErreurs()` | Cherche ou calcule numeros etapes avec erreurs. |
| `construireBoutonsRevisionParEtape()` | Prépare boutons revision par etape. |
| `construireModesRevisionErreurs()` | Prépare modes revision erreurs. |
| `construireListeErreursEtape()` | Prépare liste erreurs etape. |
| `construireParcoursErreurs()` | Prépare parcours erreurs. |
| `afficherErreurs()` | Affiche erreurs. |

## `code/09 - Progression/actions-affichage-progression.js`

| Action dans le code | Explication simple |
|---|---|
| `construireCarteProgression()` | Prépare carte progression. |
| `afficherProgression()` | Affiche progression. |

## `code/09 - Progression/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `obtenirEtapesProgramme()` | Cherche ou calcule etapes programme. |
| `obtenirEtapeProgramme()` | Cherche ou calcule etape programme. |
| `obtenirProgressionApprenant()` | Cherche ou calcule progression apprenant. |
| `initialiserProgression()` | Prépare progression. |
| `obtenirBilanEtape()` | Cherche ou calcule bilan etape. |
| `obtenirSeuilMaitrise()` | Cherche ou calcule seuil maitrise. |
| `obtenirQuestionsEtape()` | Cherche ou calcule questions etape. |
| `compterQuestionsTraiteesEtape()` | Compte questions traitees etape. |
| `obtenirQuestionsChapitre()` | Cherche ou calcule questions chapitre. |
| `determinerProchainChapitre()` | Action interne : determiner prochain chapitre. |
| `etapeNecessiteAutreChapitre()` | Action interne : etape necessite autre chapitre. |
| `estEtapeMaitrisee()` | Action interne : est etape maitrisee. |
| `synchroniserEtapesReussiesEnAutonomie()` | Synchronise etapes reussies en autonomie. |
| `compterReussitesAutonomesEtape()` | Compte reussites autonomes etape. |
| `reinitialiserValidationSansJokerEtape()` | Réinitialise validation sans joker etape. |
| `compterErreursActives()` | Compte erreurs actives. |
| `compterEtapesMaitrisees()` | Compte etapes maitrisees. |
| `marquerQuestionJouee()` | Action interne : marquer question jouee. |
| `marquerEtapeDecouverte()` | Action interne : marquer etape decouverte. |
| `compterEtapesDecouvertes()` | Compte etapes decouvertes. |

## `code/10 - Paramètres/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `construireLienSource()` | Prépare lien source. |
| `construireFicheSource()` | Prépare fiche source. |
| `afficherSources()` | Affiche sources. |
| `appliquerDisponibiliteVolumeSon()` | Applique disponibilite volume son. |
| `chargerParametres()` | Charge parametres. |
| `enregistrerParametres()` | Enregistre parametres. |
| `exporterProgression()` | Action interne : exporter progression. |
| `importerProgression()` | Action interne : importer progression. |

## `code/13 - Administration/actions-de-la-page.js`

| Action dans le code | Explication simple |
|---|---|
| `afficherEtat()` | Affiche etat. |
| `enregistrerBrouillon()` | Enregistre brouillon. |
| `validerBrouillon()` | Vérifie et valide brouillon. |
| `chargerBrouillon()` | Charge brouillon. |
| `controlerQuestions()` | Action interne : controler questions. |
| `exporterQuestions()` | Action interne : exporter questions. |
| `modifierChamp()` | Action interne : modifier champ. |
| `creerCarteQuestion()` | Crée carte question. |
| `afficherQuestions()` | Affiche questions. |
| `ouvrirFenetreReinitialisation()` | Ouvre fenetre reinitialisation. |
