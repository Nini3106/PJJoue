/* Banc métier sans navigateur : seuls le DOM, le son et Analytics sont neutralisés. */
const fs=require('fs'),vm=require('vm');
const path=require('node:path');
const root=path.resolve(__dirname,'../..')+'/';
function creerMoteur({storage=new Map(),onglet=new Map()}={}) {

const c={console, history:{},document:{querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},requestAnimationFrame:()=>{},navigator:{},location:{pathname:'/',hash:'',search:''}, URL, URLSearchParams};
c.sessionStorage={getItem:k=>onglet.get(k)||null,setItem:(k,v)=>onglet.set(k,v),removeItem:k=>onglet.delete(k)};
c.window=c;c.addEventListener=()=>{};vm.createContext(c);
vm.runInContext(fs.readFileSync(root+'donnees/donnees-pjj.js','utf8'),c);
let src=fs.readFileSync(root+'ressources/moteur-jeu.js','utf8');
src=src.slice(0,src.indexOf("selectionnerTous('[data-ecran]').forEach"));
vm.runInContext(src,c);
const nodes=new Map();
const node=()=>({value:'',style:{setProperty(){}},options:[],classList:{add(){},remove(){},toggle(){},contains(){return false}},querySelector(){return null},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},focus(){},dataset:{}});
c.document.querySelector=s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)};
c.document.querySelectorAll=()=>[];
vm.runInContext(`

annulerRappelJokers=()=>{};fermerFenetreJokers=()=>{};actualiserBoutonJokers=()=>{};
// Le branchement DOM est exclu du banc ; les vraies infobulles sont vérifiées dans Chromium.
definirAideSurvolBouton=(bouton,texte)=>{bouton.dataset.infobulle=texte;};
actualiserSuiviEtapeQuestion=()=>{};actualiserIndicateurSerie=()=>{};afficherCorrectionReponse=()=>{};
jouerSonReussite=()=>{};jouerSonErreur=()=>{};envoyerEvenementPJJ=()=>{};
afficherEcran=(e)=>{etat.ecran=e};
afficherQuestion=()=>{etat.questionCourante=etat.questionsSession[etat.indexQuestion];etat.questionValidee=false;};
annoncer=()=>{};
function init(mode='parcours',qs=obtenirQuestionsEtape('procedure_ordinaire',1)){
 sauvegarde=creerSauvegardeInitiale();etat.filtresRevision={};etat.mode=mode;etat.theme='procedure_ordinaire';etat.etape=1;etat.perimetreRevision=null;etat.jokersSessionActifs=true;etat.chronometreSessionActif=false;
 lancerSession(qs);return qs;
}
function resultState(){return {score:etat.score,aidees:etat.nombreReponsesAidees,questions:etat.questionsSession.length,serie:etat.serie,meilleureSerie:etat.meilleureSerie,erreurs:[...etat.erreursSession],passees:[...etat.questionsPassees],aConsolider:obtenirQuestionsAConsoliderSession().length};}
`,c);
function run(code){return vm.runInContext(code,c);}
return {run,storage,onglet,c,nodes};
}
module.exports={creerMoteur};
