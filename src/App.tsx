import React, { useState, useEffect, useRef } from 'react';

interface PatientDossier {
  id: string;
  namePseudonym: string;
  consentSigned: boolean;
  consentDate: string;
  consentType: string;
  age: string;
  seizureOnset: string;
  eeg: string;
  hpoTerms: string[];
  gene: string;
  mutation: string;
  acmg: string;
  prediction: string;
  confidence: number;
  badgeColor: string;
  status: 'Nouveau' | 'Analyse en cours' | 'À valider en RCP' | 'Validé & Transmis';
  vcfFile: string;
  fileSize?: string;
  sha256: string;
  coverage: string;
  treatmentHistory: string;
  familyHistory: string;
  validationComment?: string;
  validationDecision?: 'Approuvé' | 'Rejeté' | 'En attente';
  validatedBy?: string;
  therapeutics: { type: string; text: string }[];
  contraindications: { text: string }[];
  clinicalTrial: {
    title: string;
    center: string;
    status: string;
  };
}

// Bibliothèque de cas calibrée avec la littérature SCN2A (Berecki et al. 2022, Kim et al. 2023)
const CLINICAL_PRESETS: Record<string, Partial<PatientDossier>> = {
  case1: {
    namePseudonym: 'Cas 1 : EDE à début néonatal (GoF)',
    age: '3 mois (Né le 02/07/2026)',
    seizureOnset: 'J0 (premier jour de vie)',
    eeg: 'Burst-suppression précoce, décharges multifocales asynchrones continues',
    hpoTerms: [
      'HP:0001250 (Seizures / Crises convulsives)',
      'HP:0007359 (Focal clonic seizures / Convulsions cloniques focales)',
      'HP:0001290 (Generalized hypotonia / Hypotonie axiale)',
      'HP:0002187 (Intellectual disability, profound / Déficit cognitif sévère)'
    ],
    gene: 'SCN2A',
    mutation: 'c.5645G>A (p.Arg1882Gln)',
    acmg: 'Classe 5 — Pathogène (ClinVar : RCV000148921 [illustratif])',
    prediction: 'Gain de Fonction (GoF)',
    confidence: 94,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    familyHistory: 'Aucun antécédent familial d\'épilepsie. Grossesse et accouchement à terme sans anoxie (de novo).',
    treatmentHistory: 'Échec du Phénobarbital et du Lévétiracétam. Amélioration partielle observée sous Phénytoïne IV.',
    therapeutics: [
      { type: 'indicate', text: 'Bloqueur de canaux sodiques à discuter en RCP (réponse variable rapportée dans la littérature : Phénytoïne).' },
      { type: 'warning', text: 'Surveillance cardiaque (tracé ECG) requise (évaluation du rythme et de la conduction).' }
    ],
    contraindications: [
      { text: 'Aucune contre-indication formelle liée au profil GoF.' }
    ],
    clinicalTrial: {
      title: 'Programme d\'oligonucléotides antisens individualisés (n-of-1 trial) ciblant SCN2A (Kim et al., 2023)',
      center: 'Centre de référence DéfiScience — Hôpital Necker-Enfants Malades (Paris)',
      status: 'Programme translationnel / Cohorte compassionnelle'
    }
  },
  case2: {
    namePseudonym: 'Cas 2 : Convulsions Familiales Bénignes BFNIS (GoF Modéré)',
    age: '5 mois (Né le 05/05/2026)',
    seizureOnset: '2,5 mois (J + 75 jours)',
    eeg: 'Tracé intercritique normal, anomalies focales rolandiques brèves transitoires',
    hpoTerms: [
      'HP:0001250 (Seizures / Convulsions cloniques focales brèves)',
      'HP:0007359 (Focal clonic seizures / Secousses unilatérales)'
    ],
    gene: 'SCN2A',
    mutation: 'c.788C>T (p.Ala263Val)',
    acmg: 'Classe 5 — Pathogène (ClinVar : RCV000219482 [illustratif])',
    prediction: 'Gain de Fonction (GoF)',
    confidence: 91,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    familyHistory: 'Épisodes similaires résolutifs chez le père et la tante paternelle en première année.',
    treatmentHistory: 'Contrôle complet rapide sous Oxcarbazépine à posologie standard.',
    therapeutics: [
      { type: 'indicate', text: 'Bloqueurs des canaux sodiques en monothérapie à discuter (Carbamazépine, Oxcarbazépine).' },
      { type: 'warning', text: 'Surveillance cardiaque (ECG) standard lors de l\'instauration.' }
    ],
    contraindications: [
      { text: 'Éviter les polythérapies sédatives non justifiées.' }
    ],
    clinicalTrial: {
      title: 'Étude observationnelle de cohorte familiale BFNIS',
      center: 'AP-HP Necker / Inserm',
      status: 'Suivi prospectif observationnel'
    }
  },
  case3: {
    namePseudonym: 'Cas 3 : Spasmes Infantiles / Syndrome de West (Effet Intermédiaire)',
    age: '7 mois (Né le 01/03/2026)',
    seizureOnset: '5 mois (J + 150 jours)',
    eeg: 'Hypsarythmie typique continue, ondes lentes de très grande amplitude asynchrones',
    hpoTerms: [
      'HP:0011097 (Epileptic spasms / Spasmes en salves)',
      'HP:0002521 (Hypsarrhythmia / Hypsarythmie)',
      'HP:0002376 (Developmental regression / Régression motrice)',
      'HP:0001252 (Hypotonia / Hypotonie axiale)'
    ],
    gene: 'SCN2A',
    mutation: 'c.2558G>A (p.Arg853Gln)',
    acmg: 'Classe 5 — Pathogène (Variant récurrent syndrome de West, effet fonctionnel complexe)',
    prediction: 'Effet Fonctionnel Complexe (Composante LoF/GoF)',
    confidence: 86,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    familyHistory: 'Néant, mutation de novo confirmée.',
    treatmentHistory: 'Résistance à la Vigabatrine et aux corticoïdes seuls. Discussion d\'adjonction en RCP.',
    therapeutics: [
      { type: 'indicate', text: 'Arbitrage multidisciplinaire obligatoire en RCP neurométabolique avant toute ligne sodique.' },
      { type: 'warning', text: 'Surveillance rapprochée du tracé électro-clinique (vigilance sur le risque d\'aggravation).' }
    ],
    contraindications: [
      { text: 'Prudence extrême sur les bloqueurs sodiques purs sans consensus d\'équipe.' }
    ],
    clinicalTrial: {
      title: 'Protocole translationnel ERN EpiCARE — Encéphalopathies Précoces',
      center: 'Hôpital Femme Mère Enfant (HCL Lyon)',
      status: 'Recrutement actif'
    }
  },
  case4: {
    namePseudonym: 'Cas 4 : Trouble du Spectre de l\'Autisme Pur (LoF Non-Épileptique)',
    age: '3 ans (Né le 15/09/2023)',
    seizureOnset: 'Aucune crise d\'épilepsie signalée',
    eeg: 'Tracé de veille et de sommeil normal, absence de bouffées paroxystiques',
    hpoTerms: [
      'HP:0000729 (Autistic behavior / Spectre de l\'autisme)',
      'HP:0000750 (Delayed speech and language / Absence de langage)',
      'HP:0001256 (Intellectual disability / Déficience cognitive)',
      'HP:0002019 (Constipation / Dysmotilité gastro-intestinale)'
    ],
    gene: 'SCN2A',
    mutation: 'c.2995C>T (p.Arg999Ter)',
    acmg: 'Classe 5 — Pathogène (Mutation non-sens / Perte d\'allèle LoF)',
    prediction: 'Perte de Fonction (LoF)',
    confidence: 96,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    familyHistory: 'Néant.',
    treatmentHistory: 'Aucun traitement antiépileptique prescrit. Suivi pédopsychiatrique et psychomoteur.',
    therapeutics: [
      { type: 'indicate', text: 'Prise en charge rééducative globale : orthophonie, psychomotricité, interventions ciblées.' },
      { type: 'warning', text: 'Surveillance EEG si apparition de ruptures de contact inhabituelles.' }
    ],
    contraindications: [
      { text: 'CONTRE-INDICATION STRICTE : Ne pas introduire de bloqueur sodique (risque d\'induire des paroxysmes).' }
    ],
    clinicalTrial: {
      title: 'Cohorte nationale SCN2A-Autisme : Histoire naturelle et biomarqueurs',
      center: 'Centre Expert Autisme — CHU Necker',
      status: 'Recrutement de cohorte ouvert'
    }
  },
  case5: {
    namePseudonym: 'Cas 5 : Épilepsie Tardive avec Autisme & Alerte Iatrogène (LoF Sévère)',
    age: '14 mois (Né le 12/08/2025)',
    seizureOnset: '9 mois (J + 270 jours)',
    eeg: 'Ondes lentes postérieures diffuses, bouffées de pointes-ondes temporales lentes',
    hpoTerms: [
      'HP:0001250 (Seizures / Crises focales hypomobiles)',
      'HP:0002376 (Developmental regression / Perte des acquis)',
      'HP:0000717 (Autism spectrum disorder / Signes autistiques)',
      'HP:0001272 (Motor delay / Retard de la marche)'
    ],
    gene: 'SCN2A',
    mutation: 'c.563G>A (p.Arg188Gln)',
    acmg: 'Classe 5 — Pathogène (ClinVar : RCV000492110 [illustratif])',
    prediction: 'Perte de Fonction (LoF)',
    confidence: 89,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    familyHistory: 'Néant, mutation de novo confirmée.',
    treatmentHistory: 'Aggravation iatrogène majeure sous Carbamazépine (état de mal). Amélioration sous Dépakine + Keppra.',
    therapeutics: [
      { type: 'indicate', text: 'Thérapies de soutien : Acide Valproïque, Lévétiracétam, Clobazam.' },
      { type: 'warning', text: 'Bilan neurodéveloppemental et dépistage TSA renforcé.' }
    ],
    contraindications: [
      { text: 'CONTRE-INDICATION FORMELLE : Bloqueurs des canaux sodiques (Carbamazépine, Phénytoïne).' },
      { text: 'Danger clinique : Risque d\'aggravation sévère des crises et d\'induction d\'un état de mal épileptique.' }
    ],
    clinicalTrial: {
      title: 'Protocole translationnel ERN EpiCARE : Thérapie génique d\'amplification LoF',
      center: 'Hôpital Femme Mère Enfant (HCL Lyon) / AP-HP',
      status: 'Recrutement de cohorte d\'histoire naturelle'
    }
  }
};

const INITIAL_PATIENT: PatientDossier = {
  id: 'FR-EDE-89F2A1',
  namePseudonym: CLINICAL_PRESETS.case1.namePseudonym!,
  consentSigned: true,
  consentDate: '2026-10-06 08:30:12 UTC',
  consentType: 'Consentement parental éclairé (WGS Trio Diagnostique & Recherche DéfiScience)',
  age: CLINICAL_PRESETS.case1.age!,
  seizureOnset: CLINICAL_PRESETS.case1.seizureOnset!,
  eeg: CLINICAL_PRESETS.case1.eeg!,
  hpoTerms: CLINICAL_PRESETS.case1.hpoTerms!,
  gene: 'SCN2A',
  mutation: CLINICAL_PRESETS.case1.mutation!,
  acmg: CLINICAL_PRESETS.case1.acmg!,
  prediction: CLINICAL_PRESETS.case1.prediction!,
  confidence: CLINICAL_PRESETS.case1.confidence!,
  badgeColor: CLINICAL_PRESETS.case1.badgeColor!,
  status: 'À valider en RCP',
  vcfFile: 'SCN2A_TRIO_FR89F2A1.vcf.gz',
  fileSize: '412 Mo (fictif/démonstration)',
  sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  coverage: '42.4x (rapport QC labo conforme au seuil de qualité standard 30x)',
  treatmentHistory: CLINICAL_PRESETS.case1.treatmentHistory!,
  familyHistory: CLINICAL_PRESETS.case1.familyHistory!,
  validationDecision: 'En attente',
  therapeutics: CLINICAL_PRESETS.case1.therapeutics!,
  contraindications: CLINICAL_PRESETS.case1.contraindications!,
  clinicalTrial: CLINICAL_PRESETS.case1.clinicalTrial!
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentScreen, setCurrentScreen] = useState<
    'upload' | 'queue' | 'ecrf' | 'dashboard' | 'validation' | 'audit'
  >('ecrf');

  const [patient, setPatient] = useState<PatientDossier>(INITIAL_PATIENT);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('case1');

  // Gestion Upload Labo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userUploadedFile, setUserUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadMode, setUploadMode] = useState<'success' | 'error_checksum' | 'error_coverage'>('success');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  // Validation humaine
  const [humanDecision, setHumanDecision] = useState<'Approuvé' | 'Rejeté' | ''>('');
  const [humanComment, setHumanComment] = useState<string>('');
  const [hasValidated, setHasValidated] = useState<boolean>(false);

  // Message de confirmation d'export
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    const preset = CLINICAL_PRESETS[key];
    if (preset) {
      setPatient((prev) => ({
        ...prev,
        ...preset,
        namePseudonym: preset.namePseudonym || prev.namePseudonym,
        age: preset.age || prev.age,
        seizureOnset: preset.seizureOnset || prev.seizureOnset,
        eeg: preset.eeg || prev.eeg,
        hpoTerms: preset.hpoTerms || prev.hpoTerms,
        mutation: preset.mutation || prev.mutation,
        acmg: preset.acmg || prev.acmg,
        prediction: preset.prediction || prev.prediction,
        confidence: preset.confidence || prev.confidence,
        badgeColor: preset.badgeColor || prev.badgeColor,
        familyHistory: preset.familyHistory || prev.familyHistory,
        treatmentHistory: preset.treatmentHistory || prev.treatmentHistory,
        therapeutics: preset.therapeutics || prev.therapeutics,
        contraindications: preset.contraindications || prev.contraindications,
        clinicalTrial: preset.clinicalTrial || prev.clinicalTrial,
        status: 'À valider en RCP'
      }));
      setHasValidated(false);
      setExportNotification(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUserUploadedFile(file);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUserUploadedFile(file);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };

  const handleStartUpload = () => {
    setIsUploading(true);
    setUploadStatus('running');
    setUploadProgress(0);
  };

  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            if (uploadMode === 'success') {
              setUploadStatus('success');
              if (userUploadedFile) {
                setPatient((prevPt) => ({
                  ...prevPt,
                  vcfFile: userUploadedFile.name,
                  fileSize: `${(userUploadedFile.size / (1024 * 1024)).toFixed(1)} Mo`
                }));
              }
            } else {
              setUploadStatus('error');
            }
            return 100;
          }
          return prev + 25;
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isUploading, uploadMode, userUploadedFile]);

  const submitHumanValidation = () => {
    if (!humanDecision) {
      setExportNotification('Veuillez sélectionner une décision formelle (Approuver ou Rejeter) avant de signer.');
      return;
    }
    setPatient((prev) => ({
      ...prev,
      validationDecision: humanDecision,
      validationComment: humanComment,
      validatedBy: 'Dr. T. Neuropédiatre (RPPS : 100928341)',
      status: humanDecision === 'Approuvé' ? 'Validé & Transmis' : 'À valider en RCP'
    }));
    setHasValidated(true);
    setExportNotification(null);
  };

  const activeFileName = userUploadedFile ? userUploadedFile.name : patient.vcfFile;
  const activeFileSize = userUploadedFile
    ? `${(userUploadedFile.size / (1024 * 1024)).toFixed(1)} Mo`
    : patient.fileSize || '350 Mo';

  // Mire Pro Santé Connect si déconnecté
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl mb-1 shadow-sm">
              S
            </div>
            <h1 className="text-xl font-bold text-slate-800">SCN-Precision | SaMD</h1>
            <p className="text-xs text-slate-500">
              Système d'Aide à la Décision Clinique pour Canalopathies Épileptiques SCN2A
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-semibold text-slate-700">Authentification Forte e-Santé</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">MDR Classe IIa visée</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              L'accès aux données génomiques hébergées sur le cloud HDS (cible) requiert l'identification sécurisée du praticien via Pro Santé Connect.
            </p>
            <button
              onClick={() => {
                setIsAuthenticated(true);
                setCurrentScreen('ecrf');
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#000091] hover:bg-[#1212ff] text-white py-3 px-4 rounded-xl text-xs font-bold transition shadow-md"
            >
              <span className="bg-white text-[#000091] px-1.5 py-0.5 rounded text-[10px] font-black">e-CPS</span>
              Se connecter avec Pro Santé Connect
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-400 space-y-1">
            <p>Conforme PGSSI-S • Décret HDS 2018-137 • RGPD Art. 9 • AI Act Règlement (UE) 2024/1689</p>
            <p className="font-mono text-[10px]">Version SaMD prototype : 2.4.0-demo (Audit SHA : 9f8a2b)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                SCN-Precision | Plateforme SaMD de Diagnostic Pédiatrique
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dispositif Médical Logiciel (Classe IIa visée — Règle 11 MDR 2017/745) | Hébergement HDS (cible)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right border-r border-slate-200 pr-3">
              <span className="text-xs font-bold text-slate-800 block">Dr. T. Neuropédiatre</span>
              <span className="text-[10px] text-slate-500 block font-mono">RPPS : 100928341 • Necker (AP-HP)</span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Dossier en cours :</span>
              <span className="text-xs font-bold text-blue-700 font-mono">{patient.id}</span>
            </div>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 transition border border-slate-200 hover:border-rose-200 px-2.5 py-1 rounded-lg ml-2"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* NAVIGATION */}
        <nav className="flex flex-wrap border-b border-slate-200 gap-1 text-xs font-semibold">
          <button
            onClick={() => setCurrentScreen('upload')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              currentScreen === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">1</span>
            Dépôt Labo & Contrôle Séquençage
          </button>

          <button
            onClick={() => setCurrentScreen('queue')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              currentScreen === 'queue' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">2</span>
            File d'Attente des Patients
          </button>

          <button
            onClick={() => setCurrentScreen('ecrf')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              currentScreen === 'ecrf' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
            Consentement RGPD & e-CRF Phénotypique
          </button>

          <button
            onClick={() => setCurrentScreen('dashboard')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              currentScreen === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">4</span>
            Dashboard Décisionnel & Risques
          </button>

          <button
            onClick={() => setCurrentScreen('validation')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              currentScreen === 'validation' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">5</span>
            Supervision Humaine MDR & AI Act
          </button>

          <button
            onClick={() => setCurrentScreen('audit')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              currentScreen === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">6</span>
            Gouvernance HDS & Audit RGPD
          </button>
        </nav>

        {/* ÉCRAN 3 : CONSENTEMENT RGPD & FORMULAIRE e-CRF */}
        {currentScreen === 'ecrf' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block">
                  Bibliothèque Clinique SCN2A (Profils Électro-Cliniques Types)
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sélectionnez un cas documenté pour observer la mise à jour des paramètres e-CRF et du modèle :
                </p>
              </div>

              <div className="w-full md:w-auto min-w-[340px]">
                <select
                  value={selectedPresetKey}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="w-full bg-white border-2 border-blue-600 text-blue-900 text-xs font-bold rounded-lg p-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="case1">Cas 1 : EDE à début néonatal (J0 — p.Arg1882Gln GoF)</option>
                  <option value="case2">Cas 2 : Convulsions Bénignes BFNIS (2,5 mois — GoF)</option>
                  <option value="case3">Cas 3 : Syndrome de West (5 mois — Effet fonctionnel complexe)</option>
                  <option value="case4">Cas 4 : Autisme Pur / Non-Épileptique (3 ans — LoF)</option>
                  <option value="case5">Cas 5 : Épilepsie Tardive & TSA (14 mois — LoF Alerte)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Consentement Parental Éclairé aux Données Génomiques (RGPD Art. 9)
                </span>
                <span className="text-[11px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                  Statut : Valide & Signé
                </span>
              </div>
              <p className="text-xs text-slate-700">{patient.consentType}</p>
              <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 pt-1 font-mono">
                <span>Horodatage officiel : {patient.consentDate}</span>
                <span>ID Signature Électronique : SIG-NECK-{patient.id}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">
                F4 — Saisie Phénotypique Structurée (e-CRF Hospitalier)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
                    1. Chronologie & Électrophysiologie
                  </h4>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Âge actuel du patient :</label>
                    <input
                      type="text"
                      value={patient.age}
                      onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Âge d'apparition des premières crises :
                    </label>
                    <input
                      type="text"
                      value={patient.seizureOnset}
                      onChange={(e) => setPatient({ ...patient, seizureOnset: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-blue-700 font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Orientation clinique : Début néonatal précoce (&lt; 3 mois) corrélé aux variants GoF récurrents.
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tracé EEG (Électroencéphalogramme) :</label>
                    <textarea
                      rows={2}
                      value={patient.eeg}
                      onChange={(e) => setPatient({ ...patient, eeg: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Antécédents Familiaux Neurologiques :</label>
                    <input
                      type="text"
                      value={patient.familyHistory}
                      onChange={(e) => setPatient({ ...patient, familyHistory: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
                    2. Ontologies HPO & Réponses Thérapeutiques
                  </h4>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Termes HPO (Human Phenotype Ontology) validés :
                    </label>
                    <div className="flex flex-wrap gap-1.5 min-h-[70px] p-2 bg-white border border-slate-300 rounded">
                      {patient.hpoTerms.map((term, index) => (
                        <span key={index} className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 text-[11px] font-medium">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Réponse aux lignes de traitements antérieures :
                    </label>
                    <textarea
                      rows={2}
                      value={patient.treatmentHistory}
                      onChange={(e) => setPatient({ ...patient, treatmentHistory: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800"
                    />
                    {patient.treatmentHistory.toLowerCase().includes('aggravation') && (
                      <span className="text-[10px] text-rose-600 font-bold mt-1 block">
                        ⚠️ Alerte pharmacogénétique : Notion d'aggravation iatrogène rapportée sous bloqueur sodique !
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Variant génomique corrélé :</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {patient.gene} : {patient.mutation} ({patient.acmg})
                    </span>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Variables intégrées aux modèles de prédiction fonctionnelle (random forest illustratif).
              </span>
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow flex items-center gap-2"
              >
                <span>Calculer l'Inférence & Voir le Dashboard</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ÉCRAN 4 : DASHBOARD CLINIQUE */}
        {currentScreen === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                    1. Phénotype Clinique (e-CRF)
                  </h2>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    ID : {patient.id}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Profil :</span>
                    <span className="font-medium text-slate-800">{patient.namePseudonym}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Début des crises :</span>
                    <span className="font-bold text-blue-600">{patient.seizureOnset}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Tracé EEG :</span>
                    <span className="text-slate-800 text-xs font-medium text-right max-w-[260px] truncate">{patient.eeg}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 text-xs block mb-1">Termes HPO saisis :</span>
                    <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                      {patient.hpoTerms.map((term, index) => (
                        <span key={index} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                    2. Résultat Génomique (WGS Trio)
                  </h2>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                    Qualité NGS : OK (&gt;30x)
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Gène ciblé :</span>
                    <span className="font-bold text-slate-800">{patient.gene} (Canal Nav1.2)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Variant identifié :</span>
                    <span className="font-mono text-slate-800 font-bold">{patient.mutation}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Fichier VCF source :</span>
                    <span className="font-mono text-xs text-slate-600 truncate max-w-[200px]">{patient.vcfFile}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 text-xs block mb-1">Score ClinVar / ACMG :</span>
                    <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded block border border-slate-200">
                      {patient.acmg}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    3. Moteur d'Aide à la Décision & Inférence Multivariée
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modèle multivarié Random Forest (Berecki et al., 2022) | Valeur illustrative pour prototype de démonstration
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Indice de confiance illustratif</span>
                    <span className="text-lg font-black text-slate-800">{patient.confidence} %</span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg border font-bold text-sm ${patient.badgeColor}`}>
                    {patient.prediction}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Recommandations Thérapeutiques Électro-Cliniques
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {patient.therapeutics.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="text-slate-700">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border ${
                  patient.prediction.includes('LoF') ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${
                    patient.prediction.includes('LoF') ? 'text-rose-800' : 'text-slate-600'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${patient.prediction.includes('LoF') ? 'bg-rose-600' : 'bg-slate-400'}`}></span>
                    Alertes de Sécurité & Risque Iatrogène
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {patient.contraindications.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className={patient.prediction.includes('LoF') ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                          {patient.prediction.includes('LoF') ? '⚠️' : '•'}
                        </span>
                        <span className={patient.prediction.includes('LoF') ? 'text-rose-900 font-semibold' : 'text-slate-600'}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    Opportunité d'Essai Clinique & Recherche Translationnelle
                  </h4>
                  <span className="text-[11px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-medium">
                    {patient.clinicalTrial.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{patient.clinicalTrial.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{patient.clinicalTrial.center}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center pt-2 gap-3">
              <button
                onClick={() => setCurrentScreen('ecrf')}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
              >
                ← Modifier le Phénotype Clinique (e-CRF)
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setExportNotification('Compte-rendu médical PDF/A-1b signé généré avec succès.')}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition shadow-sm"
                >
                  Télécharger Compte-Rendu (PDF/A-1b)
                </button>
                <button
                  onClick={() => setCurrentScreen('validation')}
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition shadow"
                >
                  Passer à la Validation Humaine MDR & AI Act →
                </button>
              </div>
            </div>

            {exportNotification && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium">
                {exportNotification}
              </div>
            )}
          </div>
        )}

        {/* ÉCRAN 1 : DÉPÔT LABO */}
        {currentScreen === 'upload' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Mission 02 — Réception & Contrôle d'Intégrité des Données Génomiques
                </h2>
                <p className="text-xs text-slate-500">
                  Dépôt sécurisé des fichiers de séquençage WGS Trio. La vérification du checksum s'exécute côté serveur.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs">
                <span className="font-semibold text-slate-600 block mb-1">Simulateur de contrôle qualité (démonstration) :</span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMode"
                      checked={uploadMode === 'success'}
                      onChange={() => { setUploadMode('success'); setUploadStatus('idle'); }}
                    />
                    <span>Cas Nominal (OK)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-amber-700">
                    <input
                      type="radio"
                      name="uploadMode"
                      checked={uploadMode === 'error_checksum'}
                      onChange={() => { setUploadMode('error_checksum'); setUploadStatus('idle'); }}
                    />
                    <span>Erreur Checksum</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-rose-700">
                    <input
                      type="radio"
                      name="uploadMode"
                      checked={uploadMode === 'error_coverage'}
                      onChange={() => { setUploadMode('error_coverage'); setUploadStatus('idle'); }}
                    />
                    <span>Couverture &lt;30x (Rapport QC)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Patient Cible (UUID Anonymisé) :</label>
                  <input
                    type="text"
                    readOnly
                    value={patient.id}
                    className="w-full bg-slate-100 border border-slate-200 rounded p-2 font-mono text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Laboratoire Émetteur :</label>
                  <input
                    type="text"
                    readOnly
                    value="Plateforme Génomique Hospitalière (SeqOIA / CHU)"
                    className="w-full bg-slate-100 border border-slate-200 rounded p-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Protocole Sécurisé :</label>
                  <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-700 font-mono">
                    SFTP HDS / TLS 1.3 Chiffré
                  </span>
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`md:col-span-2 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition ${
                  isDragging ? 'border-blue-600 bg-blue-50/50' : 'border-slate-300 bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <svg className="w-10 h-10 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p className="text-sm font-semibold text-slate-700">
                  Glissez-déposez le fichier VCF Trio et le rapport de contrôle qualité
                </p>
                <p className="text-xs text-slate-500 mt-0.5">ou sélectionnez un fichier local :</p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
                >
                  📁 Parcourir mes fichiers locaux...
                </button>

                <div className="mt-3 p-2 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700 w-full max-w-md">
                  Fichier sélectionné : <strong className="text-blue-700">{activeFileName}</strong> ({activeFileSize})
                </div>

                {uploadStatus === 'idle' && (
                  <button
                    onClick={handleStartUpload}
                    className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow"
                  >
                    Lancer le téléversement & contrôle d'intégrité SHA-256
                  </button>
                )}

                {uploadStatus === 'running' && (
                  <div className="w-full max-w-md mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Calcul de l'empreinte SHA-256 et vérification des métriques QC...</span>
                      <span className="font-bold">{uploadProgress} %</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-left text-xs text-emerald-900 w-full max-w-lg space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <span>✓ Fichier Téléversé & Contrôle Qualité Réussi</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-mono">
                      Fichier enregistré : <strong>{activeFileName}</strong> ({activeFileSize})
                    </p>
                    <p className="text-[11px] font-mono text-slate-600">
                      SHA-256 : {patient.sha256.substring(0, 36)}...
                    </p>
                    <p className="text-[11px]">
                      Métriques QC associées : <strong>{patient.coverage}</strong>
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setCurrentScreen('queue')}
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800"
                      >
                        Consulter dans la file d'attente →
                      </button>
                    </div>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="mt-4 p-4 bg-rose-50 border border-rose-300 rounded-lg text-left text-xs text-rose-900 w-full max-w-lg space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                      <span>⚠️ Fichier Rejeté — Blocage Pré-Analytique</span>
                    </div>
                    {uploadMode === 'error_checksum' && (
                      <p className="text-[11px]">
                        <strong>Erreur d'intégrité :</strong> L'empreinte SHA-256 calculée ne correspond pas au bordereau labo. Fichier altéré ou incomplet.
                      </p>
                    )}
                    {uploadMode === 'error_coverage' && (
                      <p className="text-[11px]">
                        <strong>Rapport QC non conforme :</strong> La profondeur de couverture mesurée sur les fichiers alignés est de 18.4x (seuil de qualité standard : 30x). Risque de faux négatif.
                      </p>
                    )}
                    <p className="text-[11px] text-slate-600 font-mono">
                      Notification automatique de non-conformité émise vers la plateforme génomique.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ÉCRAN 2 : FILE D'ATTENTE */}
        {currentScreen === 'queue' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  File d'Attente du Service de Neuropédiatrie & Génétique
                </h2>
                <p className="text-xs text-slate-500">
                  Dossiers génomiques réceptionnés en attente d'arbitrage RCP.
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
                Dossier actif sélectionné
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID Patient</th>
                    <th className="p-3">Cas Préréglé</th>
                    <th className="p-3">Début Crises</th>
                    <th className="p-3">Variant Détecté</th>
                    <th className="p-3">Statut Dossier</th>
                    <th className="p-3">Action Clinique</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-blue-50/40">
                    <td className="p-3 font-mono font-bold text-slate-800">{patient.id}</td>
                    <td className="p-3 font-semibold text-slate-800">{patient.namePseudonym}</td>
                    <td className="p-3">{patient.seizureOnset}</td>
                    <td className="p-3 font-mono text-slate-600">{patient.mutation}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        patient.prediction.includes('LoF') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setCurrentScreen('ecrf')}
                        className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                      >
                        Consulter e-CRF →
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ÉCRAN 5 : VALIDATION HUMAINE EXPLICITE (MDR & AI ACT) */}
        {currentScreen === 'validation' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Supervision Humaine Obligatoire (MDR 2017/745 Règle 11 & AI Act Règlement UE 2024/1689)
              </h2>
              <p className="text-xs text-slate-500">
                En tant que SaMD d'aide à la décision, l'algorithme n'émet pas de prescription autonome. La responsabilité médicale incombe au praticien signataire.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-700">Proposition du modèle :</span>
                <span className="font-bold text-slate-900">{patient.prediction} ({patient.confidence} % confiance illustrative)</span>
              </div>
              <p className="text-xs text-slate-600">
                Recommandation principale : {patient.therapeutics[0].text}
              </p>
            </div>

            {!hasValidated ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-2">Décision du Praticien Référent :</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setHumanDecision('Approuvé')}
                      className={`px-4 py-2 rounded-lg font-bold border transition ${
                        humanDecision === 'Approuvé'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                          : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      ✓ Approuver la proposition d'orientation
                    </button>
                    <button
                      onClick={() => setHumanDecision('Rejeté')}
                      className={`px-4 py-2 rounded-lg font-bold border transition ${
                        humanDecision === 'Rejeté'
                          ? 'bg-rose-600 text-white border-rose-600 shadow'
                          : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      ✗ Rejeter la proposition (Orientation RCP requise)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Motivation Clinique & Commentaire Médical (Obligatoire) :
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Exemple : Concordance clinique avec le début néonatal à J0. Validation de la discussion en RCP pour essai prudent de phénytoïne avec monitoring ECG continu."
                    value={humanComment}
                    onChange={(e) => setHumanComment(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                  />
                </div>

                {exportNotification && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
                    {exportNotification}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={submitHumanValidation}
                    className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow"
                  >
                    Signer électroniquement (e-CPS) & Transmettre au DPI (FHIR)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <span>✓ Dossier Validé et Signé Numériquement</span>
                </div>
                <p className="text-slate-700">
                  <strong>Décision enregistrée :</strong> {patient.validationDecision} par {patient.validatedBy}
                </p>
                <p className="text-slate-600 italic">« {patient.validationComment || 'Aucun commentaire renseigné.'} »</p>
                <p className="font-mono text-[10px] text-slate-500 pt-1">
                  Statut : Ressource HL7 FHIR `DiagnosticReport` transmise au Dossier Patient Informatisé (DPI).
                </p>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setCurrentScreen('audit')}
                    className="px-3 py-1.5 bg-emerald-700 text-white rounded font-bold hover:bg-emerald-800"
                  >
                    Voir l'enregistrement dans le journal d'audit →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ÉCRAN 6 : AUDIT HDS */}
        {currentScreen === 'audit' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Journal d'Audit Immuable (Conformité PGSSI-S & RGPD Art. 9)
              </h2>
              <p className="text-xs text-slate-500">
                Traçabilité des accès aux données génomiques pseudonymisées stockées sur l'infrastructure HDS (cible).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Horodatage (UTC)</th>
                    <th className="p-3">Utilisateur (Pro Santé Connect)</th>
                    <th className="p-3">Action Enregistrée</th>
                    <th className="p-3">ID Patient Pseudonyme</th>
                    <th className="p-3">Empreinte SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {hasValidated && (
                    <tr className="bg-emerald-50/50">
                      <td className="p-3">2026-10-08 11:15:00</td>
                      <td className="p-3 font-sans font-semibold text-slate-800">Dr. T. Neuropédiatre (RPPS : 100928341)</td>
                      <td className="p-3 text-emerald-700 font-sans font-bold">Validation Humaine Explicite ({humanDecision})</td>
                      <td className="p-3">{patient.id}</td>
                      <td className="p-3 text-slate-400">c4ca4238a0b923820dcc509a6f75849b...</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-3">2026-10-08 11:05:01</td>
                    <td className="p-3 font-sans font-medium text-slate-800">Dr. T. Neuropédiatre (RPPS : 100928341)</td>
                    <td className="p-3 text-emerald-600 font-sans font-semibold">Consultation Rapport Décisionnel</td>
                    <td className="p-3">{patient.id}</td>
                    <td className="p-3 text-slate-400">e3b0c44298fc1c149afbf4c8996fb92427ae...</td>
                  </tr>
                  <tr>
                    <td className="p-3">2026-10-08 10:45:11</td>
                    <td className="p-3 font-sans">Pipeline Bioinfo (Auto-Service)</td>
                    <td className="p-3 font-sans">Annotation VCF Trio & Inférence Modèle</td>
                    <td className="p-3">{patient.id}</td>
                    <td className="p-3 text-slate-400">8f434346648f6b96df89dda901c5176b10a6...</td>
                  </tr>
                  <tr>
                    <td className="p-3">2026-10-08 10:30:22</td>
                    <td className="p-3 font-sans">Plateforme SeqOIA (SFTP HDS)</td>
                    <td className="p-3 font-sans">Dépôt sécurisé FASTQ/VCF ({activeFileName})</td>
                    <td className="p-3">{patient.id}</td>
                    <td className="p-3 text-slate-400">{patient.sha256.substring(0, 36)}...</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500">
              Chiffrement des volumes au repos : <strong>AES-256</strong> | Clés maîtresses isolées sur <strong>HSM FIPS 140-2 Level 3</strong>.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}