export interface Article {
  id: string;
  category: "market" | "regulatory" | "tech";
  author: string;
  date: string;
  readTime: number;
  imageLabel: string;
  tags: string[];
  featured?: boolean;
}

export interface ArticleContent {
  title: string;
  summary: string;
  body?: string;
}

export interface AuthorInfo {
  name: string;
  role: string;
  bio: { fr: string; en: string };
  initials: string;
  color: string;
}

export interface ActionGroup {
  labelKey: string;
  icon: "MagnifyingGlass" | "BellRinging" | "FileText" | "SealCheck" | "UserSwitch" | "ChartBar";
  path: string;
  params?: Record<string, string>;
  requiresAuth?: boolean;
  badge?: (count: number) => string;
}

export interface ArticleEntities {
  crops: string[];
  regions: string[];
  regulations: string[];
  actions: ActionGroup[];
}

export const ARTICLES: Article[] = [
  { id: "a1", category: "market", author: "Dr. Amadou Kouassi", date: "2026-05-12", readTime: 8, imageLabel: "Anacarde", tags: ["anacarde", "prix-marche", "export", "inde", "vietnam", "fcfa"], featured: true },
  { id: "a2", category: "market", author: "Fatou Diallo", date: "2026-05-05", readTime: 6, imageLabel: "Soja", tags: ["soja-bio", "protein-transition", "tracabilite", "certification-bio", "marche-ue"] },
  { id: "a3", category: "regulatory", author: "Gilles Aholou", date: "2026-04-28", readTime: 9, imageLabel: "EUDR", tags: ["eudr-2027", "zero-deforestation", "postgis", "sentinel-2", "cartographie", "conformite"] },
  { id: "a4", category: "regulatory", author: "Gilles Aholou", date: "2026-04-21", readTime: 7, imageLabel: "Blockchain", tags: ["hyperledger-besu", "due-diligence", "preuve-blockchain", "piste-audit", "certificat-eudr"] },
  { id: "a5", category: "tech", author: "Dr. Sébastien Hounkpatin", date: "2026-04-14", readTime: 10, imageLabel: "IA", tags: ["u-net", "sentinel-2", "deep-learning", "segmentation", "deforestation", "ia-satellite"] },
  { id: "a6", category: "tech", author: "Dr. Souleymane Gado", date: "2026-04-08", readTime: 7, imageLabel: "IoT", tags: ["lstm", "deep-learning", "prediction-rendement", "ia", "big-data"] },
  { id: "a7", category: "tech", author: "Amadou Kouassi", date: "2026-04-01", readTime: 5, imageLabel: "IoT", tags: ["iot", "balances-connectees", "lorawan", "tracabilite", "cooperatives"] },
];

export const ARTICLE_CONTENT: Record<string, { fr: ArticleContent; en: ArticleContent }> = {
  a1: {
    fr: {
      title: "Anacarde béninoise 2026-2027 : Décryptage du rallye des prix et perspectives export vers l'Inde et le Vietnam",
      summary: "Alors que le cours de l'anacarde brise la barre des 3 350 FCFA/kg sur le marché de Parakou, cette analyse décortique les fondamentaux offre-demande, l'impact du déstockage indien et les stratégies de couverture à 6 mois pour les exportateurs.",
      body: "Le marché de l'anacarde béninoise traverse une phase historique. Depuis le début de la campagne 2026, les cours ont progressé de 22 % par rapport à la campagne précédente, portés par une demande indienne soutenue et une offre ouest-africaine structurellement sous tension.\n\nLa reprise économique indienne, combinée à la baisse des stocks de noix de cajou brutes dans les entrepôts de Kollam, a mécaniquement tiré les prix vers le haut. Les transformateurs indiens, qui représentent traditionnellement 55 % des volumes exportés depuis le Bénin, reconstituent leurs stocks après deux campagnes de déstockage.\n\nParallèlement, le Vietnam confirme son intérêt pour l'origine Bénin. Les acheteurs vietnamiens, traditionnellement tournés vers le Cambodge et la Côte d'Ivoire, diversifient leurs sources d'approvisionnement face à la hausse des coûts logistiques en Asie du Sud-Est. Cette diversification profite directement aux exportateurs béninois.\n\nPour les acheteurs, la recommandation est claire : sécuriser des contrats-cadre avec escrow sur les 6 prochains mois permet de verrouiller des prix encore inférieurs aux pics attendus pour le T4 2026. Les modèles LSTM d'ATB anticipent un plateau autour de 3 650 FCFA/kg d'ici novembre.",
    },
    en: {
      title: "Beninese Cashew 2026–2027: Decoding the Price Rally and Export Outlook to India and Vietnam",
      summary: "As cashew prices break through the 3,350 FCFA/kg barrier on the Parakou market, this analysis breaks down supply-demand fundamentals, the impact of Indian destocking, and six-month hedging strategies for exporters.",
      body: "The Beninese cashew market is experiencing a historic phase. Since the start of the 2026 campaign, prices have risen 22 % compared to the previous season, driven by strong Indian demand and structurally tight West African supply.\n\nIndia's economic recovery, combined with declining raw cashew nut inventories in Kollam warehouses, has mechanically pushed prices upward. Indian processors, who traditionally account for 55 % of volumes exported from Benin, are rebuilding stocks after two destocking campaigns.\n\nMeanwhile, Vietnam confirms its interest in the Benin origin. Vietnamese buyers, traditionally focused on Cambodia and Côte d'Ivoire, are diversifying their supply sources amid rising logistics costs in Southeast Asia. This diversification directly benefits Beninese exporters.\n\nFor buyers, the recommendation is clear: securing framework contracts with escrow over the next 6 months locks in prices still below the peaks expected for Q4 2026. ATB's LSTM models anticipate a plateau around 3,650 FCFA/kg by November.",
    },
  },
  a2: {
    fr: {
      title: "Soja bio béninois : le nouvel eldorado européen ? Analyse des flux 2025-2026 vers le marché Protein Transition",
      summary: "Avec une progression de +34 % des surfaces certifiées Bio dans les départements du Zou et du Borgou, le soja béninois devient un axe stratégique de la souveraineté protéique européenne.",
      body: "La demande européenne en protéines végétales connaît une mutation sans précédent. La stratégie « Farm to Fork » et l'objectif de souveraineté protéique du Green Deal européen ont créé un appel d'air pour les origines extra-européennes capables de fournir un soja non-OGM certifié Bio à grande échelle.\n\nLe Bénin occupe une position unique dans ce paysage. Avec 12 400 hectares certifiés Bio en 2025 — contre 9 200 ha en 2024 — le pays confirme son statut de fournisseur de référence pour le marché européen. Les départements du Zou et du Borgou concentrent 68 % des surfaces, portés par les coopératives membres du réseau ATB.\n\nLes flux vers l'Union européenne ont progressé de 41 % en volume sur le premier semestre 2026. Les ports de Anvers et Rotterdam captent 73 % des volumes, avec une prime Bio qui oscille entre 180 et 220 euros par tonne par rapport au soja conventionnel.\n\nPour les acheteurs, la fenêtre est étroite : les volumes disponibles sous contrat diminuent rapidement à mesure que la campagne avance. Verrouiller ses approvisionnements via des contrats-cadre avec traçabilité blockchain est désormais un impératif opérationnel.",
    },
    en: {
      title: "Beninese Organic Soybean: Europe's New Eldorado? Analysis of 2025–2026 Flows into the Protein Transition Market",
      summary: "With a 34% increase in organic-certified areas in the Zou and Borgou departments, Beninese soybean is becoming a strategic pillar of European protein sovereignty.",
      body: "European demand for vegetable proteins is undergoing an unprecedented shift. The Farm to Fork strategy and the protein sovereignty goal of the European Green Deal have created a vacuum for extra-European origins capable of supplying non-GMO certified organic soy on a large scale.\n\nBenin occupies a unique position in this landscape. With 12,400 hectares certified organic in 2025 — up from 9,200 ha in 2024 — the country confirms its status as a reference supplier for the European market. The Zou and Borgou departments concentrate 68 % of the area, driven by cooperatives in the ATB network.\n\nFlows to the European Union grew 41 % in volume in the first half of 2026. The ports of Antwerp and Rotterdam capture 73 % of volumes, with an organic premium ranging between 180 and 220 euros per tonne over conventional soy.\n\nFor buyers, the window is narrow: available contracted volumes are declining rapidly as the campaign progresses. Locking in supply through framework contracts with blockchain traceability is now an operational imperative.",
    },
  },
  a3: {
    fr: {
      title: "EUDR 2027 : Comment le Bénin prépare l'extension aux Petits États et PMA — le pari de la cartographie satellite 6 500 ha",
      summary: "Alors que l'EUDR entre en phase 2 avec l'inclusion des Petits États et PMA d'ici décembre 2027, la plateforme ATB dévoile les premiers résultats de son maillage PostGIS : 6 500 ha cartographiés à Glazoué.",
      body: "Le règlement européen contre la déforestation (EUDR) entre dans une phase décisive. Après l'entrée en vigueur de la phase 1 pour les grandes entreprises en décembre 2025, l'extension aux Petits États et PMA prévue pour décembre 2027 impose une préparation sans précédent aux origines ouest-africaines.\n\nLe Bénin a pris une longueur d'avance. La plateforme ATB a cartographié 6 500 hectares dans la région de Glazoué via PostGIS, avec une résolution parcellaire couplée aux images Sentinel-2 à 10 mètres par pixel. Le traitement par réseau U-Net permet une détection de la déforestation avec un mIoU de 0,89.\n\nPour les acheteurs européens, cette avance est un avantage concurrentiel direct : les lots béninois certifiés EUDR via ATB sont déjà conformes aux exigences de diligence raisonnable qui s'appliqueront à l'ensemble des opérateurs en 2027. Les certificats blockchain associés à chaque lot constituent une preuve opposable en douane.\n\nLes coûts de mise en conformité, estimés entre 2 et 5 euros par tonne, sont marginalisés par la prime EUDR qui se structure sur le marché européen. Les premiers contrats intégrant explicitement la clause EUDR tracent un premium de 8 à 12 % sur les prix de base.",
    },
    en: {
      title: "EUDR 2027: How Benin Is Preparing for the Small-State and LDC Extension — The 6,500 ha Satellite Mapping Bet",
      summary: "As EUDR enters phase 2 with the inclusion of Small States and LDCs by December 2027, the ATB platform reveals the first results of its PostGIS survey: 6,500 hectares mapped in Glazoué.",
      body: "The European Union Deforestation Regulation (EUDR) is entering a decisive phase. Following the phase 1 enforcement for large companies in December 2025, the extension to Small States and LDCs scheduled for December 2027 imposes unprecedented preparation on West African origins.\n\nBenin has taken a head start. The ATB platform has mapped 6,500 hectares in the Glazoué region via PostGIS, with parcel-level resolution coupled with Sentinel-2 imagery at 10 meters per pixel. U-Net network processing enables deforestation detection with an mIoU of 0.89.\n\nFor European buyers, this lead is a direct competitive advantage: Beninese EUDR-certified lots via ATB already comply with the due diligence requirements that will apply to all operators in 2027. The blockchain certificates associated with each lot constitute admissible evidence for customs.\n\nCompliance costs, estimated between 2 and 5 euros per tonne, are offset by the EUDR premium taking shape on the European market. Early contracts explicitly incorporating the EUDR clause show a premium of 8 to 12 % on base prices.",
    },
  },
  a4: {
    fr: {
      title: "L'ancrage blockchain comme preuve EUDR : de la parcelle au certificat, l'architecture de confiance ATB",
      summary: "Chaque étape — géolocalisation parcellaire, analyse NDVI U-Net, validation coopérative, inspection SGS — est horodatée et scellée sur Hyperledger Besu, créant une piste d'audit inaltérable opposable en douane.",
      body: "La traçabilité n'est plus un avantage concurrentiel : c'est une exigence réglementaire. Le règlement EUDR impose aux importateurs européens de démontrer que les produits mis sur le marché sont exempts de tout lien avec la déforestation. La blockchain offre la seule infrastructure capable de répondre à cette exigence à l'échelle industrielle.\n\nL'architecture ATB repose sur Hyperledger Besu, une blockchain permissionnée compatible Ethereum Virtual Machine. Chaque lot est associé à un identifiant unique, lui-même lié à des parcelles géoréférencées. Les étapes clés — semis, récolte, pesée IoT, transport, inspection — sont horodatées et scellées dans des transactions blockchain.\n\nLe processus débute par l'acquisition d'images Sentinel-2 traitées par un réseau U-Net pour la segmentation parcellaire et la détection de la déforestation. Les résultats sont consolidés dans un rapport de conformité, lui-même ancré sur la blockchain. Le certificat final, téléchargeable au format PDF, intègre un QR code renvoyant vers la transaction de scellement.\n\nPour l'acheteur, la vérification est instantanée : un scan du QR code affiche la piste d'audit complète, de la parcelle au certificat. Cette transparence constitue un argument de vente décisif auprès des consommateurs finaux européens.",
    },
    en: {
      title: "Blockchain Anchoring as EUDR Evidence: From Parcel to Certificate — The ATB Trust Architecture",
      summary: "Every step — parcel geolocation, NDVI U-Net analysis, cooperative validation, SGS inspection — is timestamped and sealed on Hyperledger Besu, creating an immutable audit trail admissible by customs.",
      body: "Traceability is no longer a competitive advantage: it is a regulatory requirement. The EUDR requires European importers to demonstrate that products placed on the market are free from any link to deforestation. Blockchain offers the only infrastructure capable of meeting this requirement at industrial scale.\n\nThe ATB architecture is built on Hyperledger Besu, a permissioned blockchain compatible with the Ethereum Virtual Machine. Each lot is associated with a unique identifier, itself linked to georeferenced parcels. Key stages — planting, harvest, IoT weighing, transport, inspection — are timestamped and sealed in blockchain transactions.\n\nThe process begins with Sentinel-2 imagery acquisition processed by a U-Net network for parcel segmentation and deforestation detection. Results are consolidated into a compliance report, itself anchored on the blockchain. The final certificate, downloadable as PDF, embeds a QR code linking to the sealing transaction.\n\nFor buyers, verification is instant: scanning the QR code displays the full audit trail, from parcel to certificate. This transparency provides a decisive selling point with European end consumers.",
    },
  },
  a5: {
    fr: {
      title: "U-Net sur Sentinel-2 : comment un modèle de deep learning détecte la déforestation illégale à l'échelle parcellaire en 48 heures",
      summary: "Acquisition automatique des tuiles Sentinel-2 (10 m/pixel), segmentation sémantique par réseau U-Net entraîné sur 14 000 parcelles labellisées, et déclenchement d'alertes en quasi temps réel. mIoU 0,89.",
      body: "La détection de la déforestation par imagerie satellite a connu une révolution silencieuse portée par l'intelligence artificielle. Là où les méthodes traditionnelles nécessitaient des semaines d'analyse photo-interprétation, les modèles de deep learning permettent aujourd'hui un traitement automatisé en moins de 48 heures.\n\nLe système ATB repose sur une architecture U-Net, un modèle de segmentation sémantique convolutif spécifiquement conçu pour l'imagerie biomédicale mais dont les performances sur les données satellite sont remarquables. Entraîné sur un jeu de 14 000 parcelles labellisées manuellement par des photo-interprètes, le modèle atteint un mIoU (mean Intersection over Union) de 0,89.\n\nLes tuiles Sentinel-2, acquises automatiquement via l'API Copernicus Data Space Ecosystem, sont prétraitées pour éliminer la couverture nuageuse. Le modèle U-Net effectue ensuite une segmentation au niveau pixel, distinguant 5 classes : forêt dense, forêt secondaire, culture, sol nu, plan d'eau. Les zones de déforestation récente sont identifiées par changement de classe entre deux passages.\n\nLes alertes sont générées automatiquement et transmises aux équipes de conformité via la plateforme ATB. Chaque alerte inclut la localisation GPS, la surface concernée, le taux de confiance du modèle et les tuiles Sentinel-2 avant/après.",
    },
    en: {
      title: "U-Net on Sentinel-2: How a Deep Learning Model Detects Illegal Deforestation at Parcel Scale in 48 Hours",
      summary: "Automatic Sentinel-2 tile acquisition (10 m/pixel), semantic segmentation via U-Net trained on 14,000 labeled parcels, and near-real-time alert triggering. mIoU 0.89.",
      body: "Deforestation detection through satellite imagery has undergone a quiet revolution driven by artificial intelligence. While traditional methods required weeks of photo-interpretation analysis, deep learning models now enable automated processing in under 48 hours.\n\nThe ATB system is built on a U-Net architecture, a convolutional semantic segmentation model specifically designed for biomedical imaging but whose performance on satellite data is remarkable. Trained on a dataset of 14,000 parcels manually labeled by photo-interpreters, the model achieves an mIoU (mean Intersection over Union) of 0.89.\n\nSentinel-2 tiles, automatically acquired via the Copernicus Data Space Ecosystem API, are preprocessed to remove cloud cover. The U-Net model then performs pixel-level segmentation, distinguishing 5 classes: dense forest, secondary forest, cropland, bare soil, water body. Recent deforestation areas are identified by class change between two passes.\n\nAlerts are generated automatically and transmitted to compliance teams via the ATB platform. Each alert includes GPS location, affected area, model confidence score, and before/after Sentinel-2 tiles.",
    },
  },
  a6: {
    fr: {
      title: "Prédiction de rendement LSTM : comment ATB anticipe les récoltes à 6 mois avec 92% de précision",
      summary: "Le modèle LSTM v3.2, entraîné sur 4 saisons de données historiques, atteint une précision de 92 % pour les cultures d'anacarde, soja et coton.",
      body: "La prévision des rendements agricoles est l'un des défis les plus complexes de l'AgTech. Les modèles traditionnels, basés sur des régressions linéaires et des moyennes historiques, peinent à capturer la non-linéarité des interactions climat-sol-pratiques culturales.\n\nATB a développé un modèle LSTM (Long Short-Term Memory) v3.2 qui surpasse ces approches. Les LSTM sont des réseaux de neurones récurrents capables d'apprendre des dépendances à long terme dans des séquences temporelles — un atout décisif pour modéliser des cycles culturaux de 6 à 12 mois.\n\nLe modèle est entraîné sur 4 saisons complètes de données historiques, combinant : séries NDVI Sentinel-2, données météorologiques (température, précipitations, évapotranspiration), historiques de rendement coopératifs, et données de sol (type, pH, matière organique).\n\nLes résultats sont probants : 92 % de précision pour l'anacarde, le soja et le coton. Pour les acheteurs, ces prédictions permettent d'anticiper les volumes disponibles et d'ajuster leurs stratégies d'approvisionnement 6 mois à l'avance.",
    },
    en: {
      title: "LSTM Yield Prediction: How ATB Forecasts Harvests 6 Months Ahead with 92% Accuracy",
      summary: "The LSTM v3.2 model, trained on 4 seasons of historical data, achieves 92% accuracy for cashew, soybean, and cotton crops.",
      body: "Agricultural yield forecasting is one of the most complex challenges in AgTech. Traditional models, based on linear regressions and historical averages, struggle to capture the non-linearity of climate-soil-practice interactions.\n\nATB has developed an LSTM (Long Short-Term Memory) v3.2 model that outperforms these approaches. LSTMs are recurrent neural networks capable of learning long-term dependencies in time series — a decisive advantage for modeling 6 to 12 month crop cycles.\n\nThe model is trained on 4 complete seasons of historical data, combining: Sentinel-2 NDVI series, meteorological data (temperature, precipitation, evapotranspiration), cooperative yield histories, and soil data (type, pH, organic matter).\n\nResults are compelling: 92 % accuracy for cashew, soybean, and cotton. For buyers, these predictions enable anticipation of available volumes and adjustment of procurement strategies 6 months ahead.",
    },
  },
  a7: {
    fr: {
      title: "Traçabilité IoT : les nouvelles balances connectées ATB déployées dans 12 coopératives",
      summary: "120 nouvelles balances connectées déployées dans les coopératives du Zou, du Borgou et de l'Atlantique, avec transmission automatique des pesées via le réseau LoRaWAN.",
      body: "La traçabilité agricole repose sur la fiabilité des données de terrain. Sans pesées précises et horodatées à l'origine, les certificats blockchain perdent leur valeur probante. ATB a franchi une étape décisive avec le déploiement de 120 balances connectées dans les coopératives partenaires.\n\nLes balances, conçues pour résister aux conditions tropicales (température, humidité, poussière), sont équipées de capteurs de charge à jauge de contrainte avec une précision de ± 0,5 kg. Chaque pesée est automatiquement transmise via le réseau LoRaWAN, qui offre une portée de 5 à 10 km en milieu rural sans nécessiter d'abonnement cellulaire.\n\nLes coopératives équipées sont réparties dans trois départements : Zou (48 balances), Borgou (42 balances) et Atlantique (30 balances). Le déploiement a été réalisé en partenariat avec les unions coopératives locales et le soutien technique de l'Agence Béninoise de Normalisation.\n\nPour l'acheteur, l'impact est immédiat : chaque lot est désormais tracé depuis la pesée initiale jusqu'à la livraison, avec une piste d'audit IoT horodatée qui renforce la crédibilité des certificats blockchain.",
    },
    en: {
      title: "IoT Traceability: New ATB Connected Scales Deployed Across 12 Cooperatives",
      summary: "120 new connected scales deployed in cooperatives in Zou, Borgou, and Atlantique, with automatic weigh-in transmission via the LoRaWAN network.",
      body: "Agricultural traceability depends on the reliability of field data. Without accurate, timestamped weigh-ins at origin, blockchain certificates lose their evidentiary value. ATB has crossed a decisive milestone with the deployment of 120 connected scales in partner cooperatives.\n\nThe scales, designed to withstand tropical conditions (temperature, humidity, dust), are equipped with strain gauge load cells with ± 0.5 kg accuracy. Each weighing is automatically transmitted via the LoRaWAN network, which offers 5 to 10 km range in rural areas without requiring a cellular subscription.\n\nThe equipped cooperatives are spread across three departments: Zou (48 scales), Borgou (42 scales), and Atlantique (30 scales). The deployment was carried out in partnership with local cooperative unions and technical support from the Beninese Agency for Standardization.\n\nFor buyers, the impact is immediate: each lot is now traced from initial weighing to delivery, with a timestamped IoT audit trail that reinforces the credibility of blockchain certificates.",
    },
  },
};

export const CULTURE_GRADIENTS: Record<string, string> = {
  Anacarde: "linear-gradient(135deg, #e65100, #ff8f00)",
  Soja: "linear-gradient(135deg, #2e7d32, #66bb6a)",
  EUDR: "linear-gradient(135deg, #1565c0, #42a5f5)",
  Blockchain: "linear-gradient(135deg, #6a1b9a, #ab47bc)",
  IA: "linear-gradient(135deg, #1b5e20, #388e3c)",
  IoT: "linear-gradient(135deg, #37474f, #78909c)",
};

export const EUDR_TIMELINE = [
  { date: "2024-12-01", titleKey: "insights.eudrTimeline.item1Title", descKey: "insights.eudrTimeline.item1Desc" },
  { date: "2025-06-01", titleKey: "insights.eudrTimeline.item2Title", descKey: "insights.eudrTimeline.item2Desc" },
  { date: "2027-12-01", titleKey: "insights.eudrTimeline.item3Title", descKey: "insights.eudrTimeline.item3Desc" },
  { date: "2028-01-01", titleKey: "insights.eudrTimeline.item4Title", descKey: "insights.eudrTimeline.item4Desc" },
];

export const CATEGORIES = [
  { key: "all", labelKey: "insights.categories.all", icon: "Newspaper" as const },
  { key: "market", labelKey: "insights.categories.market", icon: "ChartBar" as const },
  { key: "regulatory", labelKey: "insights.categories.regulatory", icon: "SealCheck" as const },
  { key: "tech", labelKey: "insights.categories.tech", icon: "Cube" as const },
] as const;

export const AUTHORS: Record<string, AuthorInfo> = {
  "Dr. Amadou Kouassi": {
    name: "Dr. Amadou Kouassi",
    role: "Senior Market Analyst",
    initials: "AK",
    color: "#1565c0",
    bio: {
      fr: "Docteur en économie agricole, Dr. Kouassi compte 12 ans d'expérience dans l'analyse des marchés ouest-africains. Ancien chercheur à l'INRAB, il pilote les modèles de prévision de prix d'ATB.",
      en: "PhD in agricultural economics, Dr. Kouassi has 12 years of experience analyzing West African markets. Former researcher at INRAB, he leads ATB's price forecasting models.",
    },
  },
  "Fatou Diallo": {
    name: "Fatou Diallo",
    role: "Bio Trade Specialist",
    initials: "FD",
    color: "#2e7d32",
    bio: {
      fr: "Spécialiste des filières biologiques certifiées, Fatou Diallo a coordonné le déploiement de 12 400 ha de soja bio dans les départements du Zou et du Borgou.",
      en: "Certified organic supply chain specialist, Fatou Diallo coordinated the deployment of 12,400 ha of organic soy in the Zou and Borgou departments.",
    },
  },
  "Gilles Aholou": {
    name: "Gilles Aholou",
    role: "Regulatory Compliance Lead",
    initials: "GA",
    color: "#6a1b9a",
    bio: {
      fr: "Juriste spécialisé en droit agro-environnemental européen, Gilles Aholou accompagne les exportateurs béninois dans leur mise en conformité EUDR depuis 2023.",
      en: "Lawyer specializing in European agro-environmental law, Gilles Aholou has been supporting Beninese exporters in EUDR compliance since 2023.",
    },
  },
  "Dr. Sébastien Hounkpatin": {
    name: "Dr. Sébastien Hounkpatin",
    role: "AI & Remote Sensing Lead",
    initials: "SH",
    color: "#1b5e20",
    bio: {
      fr: "Docteur en vision par ordinateur, Dr. Hounkpatin a développé le modèle U-Net de détection de déforestation d'ATB. Ancien post-doctorant à l'INRIA Sophia Antipolis.",
      en: "PhD in computer vision, Dr. Hounkpatin developed ATB's U-Net deforestation detection model. Former post-doctoral researcher at INRIA Sophia Antipolis.",
    },
  },
  "Dr. Souleymane Gado": {
    name: "Dr. Souleymane Gado",
    role: "Data Science Lead",
    initials: "SG",
    color: "#37474f",
    bio: {
      fr: "Docteur en science des données, Dr. Gado conçoit les modèles de prédiction de rendement LSTM d'ATB. Expert en séries temporelles agricoles et deep learning.",
      en: "PhD in data science, Dr. Gado designs ATB's LSTM yield prediction models. Expert in agricultural time series and deep learning.",
    },
  },
};

export const ARTICLE_ENTITIES: Record<string, ArticleEntities> = {
  a1: {
    crops: ["Anacarde"],
    regions: ["Parakou", "Inde", "Vietnam"],
    regulations: [],
    actions: [
      { labelKey: "insights.actions.viewLots", icon: "MagnifyingGlass", path: "/lots", params: { culture: "Anacarde" } },
      { labelKey: "insights.actions.priceAlert", icon: "BellRinging", path: "/alerts", params: { crop: "Anacarde", type: "price_alert" } },
      { labelKey: "insights.actions.viewContracts", icon: "FileText", path: "/contracts", params: { culture: "Anacarde" }, requiresAuth: true },
    ],
  },
  a2: {
    crops: ["Soja"],
    regions: ["Zou", "Borgou", "Anvers", "Rotterdam"],
    regulations: [],
    actions: [
      { labelKey: "insights.actions.viewLots", icon: "MagnifyingGlass", path: "/lots", params: { culture: "Soja", certification: "Bio" } },
      { labelKey: "insights.actions.priceAlert", icon: "BellRinging", path: "/alerts", params: { crop: "Soja", type: "price_drop" } },
      { labelKey: "insights.actions.viewContracts", icon: "FileText", path: "/contracts", params: { culture: "Soja" }, requiresAuth: true },
    ],
  },
  a3: {
    crops: [],
    regions: ["Glazoué"],
    regulations: ["EUDR"],
    actions: [
      { labelKey: "insights.actions.checkCompliance", icon: "SealCheck", path: "/certificates", requiresAuth: true },
      { labelKey: "insights.actions.viewLots", icon: "MagnifyingGlass", path: "/lots", params: { certification: "EUDR" } },
      { labelKey: "insights.actions.eudrGuide", icon: "FileText", path: "/eudr" },
    ],
  },
  a4: {
    crops: [],
    regions: [],
    regulations: ["EUDR"],
    actions: [
      { labelKey: "insights.actions.checkCompliance", icon: "SealCheck", path: "/certificates", requiresAuth: true },
      { labelKey: "insights.actions.viewLots", icon: "MagnifyingGlass", path: "/lots", params: { certification: "EUDR" } },
      { labelKey: "insights.actions.eudrGuide", icon: "FileText", path: "/eudr" },
    ],
  },
  a5: {
    crops: [],
    regions: [],
    regulations: [],
    actions: [
      { labelKey: "insights.actions.viewLots", icon: "MagnifyingGlass", path: "/lots" },
      { labelKey: "insights.actions.techGuide", icon: "FileText", path: "/about" },
    ],
  },
  a6: {
    crops: ["Anacarde", "Soja", "Coton"],
    regions: [],
    regulations: [],
    actions: [
      { labelKey: "insights.actions.viewLots", icon: "MagnifyingGlass", path: "/lots" },
      { labelKey: "insights.actions.priceAlert", icon: "BellRinging", path: "/alerts", params: { type: "new_lot" } },
      { labelKey: "insights.actions.viewContracts", icon: "FileText", path: "/contracts", requiresAuth: true },
    ],
  },
  a7: {
    crops: [],
    regions: ["Zou", "Borgou", "Atlantique"],
    regulations: [],
    actions: [
      { labelKey: "insights.actions.viewFarmers", icon: "UserSwitch", path: "/farmers", params: { region: "Zou" } },
      { labelKey: "insights.actions.viewLots", icon: "MagnifyingGlass", path: "/lots" },
    ],
  },
};

export function getArticleContent(id: string, lang: string): ArticleContent {
  const lookup = ARTICLE_CONTENT[id];
  if (!lookup) return { title: id, summary: "" };
  return lookup[lang as keyof typeof lookup] || lookup.fr;
}

import { formatDate } from "../utils/format";

export function formatArticleDate(dateStr: string, lang: string): string {
  try {
    const d = new Date(dateStr);
    return formatDate(d, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function getReadTimeLabel(minutes: number, lang: string): string {
  return lang === "en"
    ? `${minutes} min read`
    : `${minutes} min de lecture`;
}
