import { type LegalPageData } from "./types";

export const EUDR_PAGE: Record<"fr" | "en", LegalPageData> = {
  fr: {
    title: "Guide de Conformité EUDR",
    subtitle:
      "Guide complet de mise en conformité avec le Règlement (UE) 2023/1115 du Parlement européen et du Conseil du 31 mai 2023 relatif à la mise à disposition sur le marché de l'Union et à l'exportation à partir de l'Union de certains produits de base et produits associés à la déforestation et à la dégradation des forêts.",
    badge: "Règlementation EUDR",
    sections: [
      {
        id: "overview",
        title: "1. Aperçu du Règlement EUDR",
        paragraphs: [
          "Le Règlement (UE) 2023/1115, communément appelé EUDR (EU Deforestation Regulation), a été adopté par le Parlement européen et le Conseil de l'Union européenne le 31 mai 2023 et est entré en vigueur le 29 juin 2023. Il abroge et remplace le Règlement (UE) n° 995/2010 (règlement bois) et établit des règles strictes concernant la mise sur le marché de l'Union européenne et l'exportation à partir de l'Union de certains produits de base et produits associés à la déforestation et à la dégradation des forêts. Ce règlement s'inscrit dans le cadre du Green Deal européen et de la stratégie De la ferme à la table, et vise à garantir que les produits consommés dans l'UE ne contribuent pas à la déforestation mondiale ou à la dégradation des forêts.",
          "Les produits couverts par le règlement sont énumérés à l'annexe I et incluent les matières premières suivantes : bovins, cacao, café, palmier à huile, caoutchouc, soja, et bois, ainsi que les produits dérivés listés à ladite annexe (cuir, chocolat, café transformé, huile de palme et ses fractions, pneumatiques, meubles, papier, etc.). Pour la plateforme ATB AgriTrace, les filières pertinentes sont principalement le cacao (fèves de cacao, beurre de cacao, pâte de cacao, chocolat), le café (café vert, café torréfié), l'huile de palme (huile de palme brute, raffinée et leurs fractions), le caoutchouc naturel, et le soja. Le règlement impose aux opérateurs (producteurs, importateurs, exportateurs) de démontrer que leurs produits sont sans déforestation (produits sur des terres n'ayant pas fait l'objet de conversion forestière après le 31 décembre 2020) et légaux au regard de la législation du pays de production.",
          "Le calendrier d'application du règlement prévoit : (a) pour les grandes entreprises et opérateurs (non-PME), l'obligation de conformité s'applique à compter du 30 décembre 2025 ; (b) pour les petites et moyennes entreprises (PME) et les micro-entreprises, l'obligation s'applique à compter du 30 juin 2026. La Commission européenne a mis en place un système de catégorisation des pays par niveau de risque (bas, standard, élevé) sur la base d'une évaluation objective fondée sur des critères tels que le taux de déforestation, le taux d'expansion agricole, et les tendances de production des produits de base concernés. Les pays classés à risque élevé (high risk) feront l'objet de contrôles renforcés, avec un niveau d'obligations de diligence raisonnée accru (article 29). À ce jour, aucun pays d'Afrique de l'Ouest n'a encore été formellement catégorisé par la Commission, mais ATB suit activement l'évolution des classifications qui seront publiées au Journal Officiel de l'Union européenne.",
        ],
      },
      {
        id: "compliance-requirements",
        title: "2. Exigences de conformité",
        paragraphs: [
          "Le Règlement (UE) 2023/1115 impose trois exigences cumulatives pour qu'un produit puisse être mis sur le marché de l'Union européenne ou exporté depuis celui-ci : la légalité, l'absence de déforestation, et la production d'une déclaration de diligence raisonnée (due diligence statement). Ces trois exigences sont indissociables et doivent être satisfaites pour chaque Lot de produits, de la parcelle de production jusqu'à la mise sur le marché.",
        ],
        subsections: [
          {
            title: "2.1 Exigence de légalité",
            paragraphs: [
              "L'article 2(40) du Règlement (UE) 2023/1115 définit la légalité comme la conformité du produit avec la législation en vigueur dans le pays de production. Cette exigence couvre six domaines juridiques distincts que le Vendeur et ATB doivent vérifier : (1) les droits d'utilisation des terres (land use rights) — vérification que les parcelles de production sont exploitées conformément aux titres fonciers, permis d'exploitation ou conventions de mise à disposition valides ; (2) les lois environnementales (environmental laws) — respect des études d'impact environnemental, des normes de gestion des déchets, des règles de protection des ressources en eau et de la biodiversité ; (3) le droit du travail et les conditions sociales (labour and social laws) — conformité au droit du travail national (Code du travail béninois Loi n° 98-004 du 28 janvier 1998, conventions collectives applicables), interdiction du travail des enfants et du travail forcé conformément aux conventions de l'OIT (n° 138, 182, 29, 105) ; (4) les droits fonciers (land tenure rights) — respect des droits des communautés locales et des populations autochtones, conformément à la Loi n° 2017-15 du 10 août 2017 portant code foncier et domanial en République du Bénin ; (5) la réglementation fiscale (tax laws) — paiement des taxes et impôts dus au titre de l'exploitation agricole ; (6) les droits des communautés locales (local community rights) — respect des droits coutumiers et des procédures de consultation préalable des communautés affectées, en particulier dans les zones de production où les terres font l'objet de régimes fonciers coutumiers.",
              "ATB a développé un module de vérification de légalité intégré à la Plateforme, qui croise les données déclaratives du Vendeur avec les bases de données officielles disponibles (registres fonciers nationaux, registres RCCM, bases de données des ministères de l'agriculture, plateformes gouvernementales de délivrance de permis). En l'absence de données officielles numérisées, ATB requiert la production de documents originaux (certificat foncier, autorisation d'exploitation, quitus fiscal, certificat de conformité sociale) soumis à une vérification documentaire par l'équipe conformité et, si nécessaire, à une inspection de terrain réalisée par un partenaire local agréé.",
            ],
          },
          {
            title: "2.2 Exigence d'absence de déforestation",
            paragraphs: [
              "L'article 2(13) du Règlement (UE) 2023/1115 définit un produit sans déforestation comme un produit dont les matières premières ont été produites sur des terres n'ayant pas fait l'objet d'une conversion forestière (déforestation) ou d'une dégradation des forêts après le 31 décembre 2020, date butoir fixée par le règlement (cut-off date). ATB utilise un système propriétaire de monitoring satellite basé sur l'architecture U-Net (encodeur ResNet-34) déployée sur GPU NVIDIA A100, analysant les images Sentinel-2 du programme Copernicus de l'Agence Spatiale Européenne (résolution 10 mètres par pixel, revisite tous les 5 jours). L'algorithme atteint une performance de mIoU (mean Intersection over Union) de 0,89, avec un seuil de détection minimal de 0,5 hectare de changement de couverture forestière.",
              "La forêt est définie conformément à la définition FAO (Organisation des Nations Unies pour l'Alimentation et l'Agriculture) comme une terre s'étendant sur plus de 0,5 hectare, avec des arbres atteignant une hauteur supérieure à 5 mètres et un couvert forestier supérieur à 10 %. Pour chaque Lot commercialisé via la Plateforme, ATB réalise une analyse diachronique (avant/après) couvrant une période allant du 1er janvier 2020 à la date de la transaction, avec une fréquence d'analyse trimestrielle. Les résultats de l'analyse (images, cartes de changement, scores de confiance) sont horodatés, hashés via SHA-256, et inscrits sur la blockchain Hyperledger Besu d'ATB, constituant ainsi une preuve immuable et vérifiable de la conformité du Lot à l'exigence d'absence de déforestation.",
            ],
          },
          {
            title: "2.3 Déclaration de diligence raisonnée (Due Diligence Statement)",
            paragraphs: [
              "Conformément à l'article 4(2) du Règlement (UE) 2023/1115, chaque opérateur doit soumettre une déclaration de diligence raisonnée (Due Diligence Statement — DDS) via le système d'information de la Commission européenne avant de mettre un produit sur le marché de l'Union ou de l'exporter. La DDS doit confirmer que l'opérateur a exercé la diligence raisonnée conformément à l'article 8 du règlement et qu'aucun risque ou seulement un risque négligeable de non-conformité a été constaté. La déclaration doit inclure les informations suivantes : les coordonnées complètes de l'opérateur (nom, adresse, email, numéro d'enregistrement EUDR attribué par la Commission), le code SH (Système Harmonisé) du produit, la quantité, le pays de production, les coordonnées de géolocalisation (latitude/longitude) de toutes les parcelles de production avec une précision de 6 mètres (et les polygones correspondants), les certificats de légalité, les résultats de l'analyse satellite, la date de la déclaration, et la signature électronique qualifiée.",
              "La Plateforme ATB AgriTrace automatise entièrement la génération et la soumission de la DDS. Dès que la vérification de conformité est finalisée (légalité vérifiée, analyse satellite validée, due diligence exercée), la Plateforme génère la déclaration au format XML conforme au système TRACES de la Commission européenne, la signe électroniquement (QES conforme eIDAS), et la transmet automatiquement via l'API du système d'information EUDR. Un accusé de réception émis par la Commission, contenant le numéro d'enregistrement unique de la déclaration, est automatiquement rattaché au Certificat Blockchain du Lot. La DDS est conservée dans le registre blockchain de la Plateforme pour une durée de 7 ans conformément à l'article 9 du règlement.",
            ],
          },
        ],
      },
      {
        id: "due-diligence-process",
        title: "3. Processus de diligence raisonnée sur ATB",
        paragraphs: [
          "Le processus de diligence raisonnée mis en oeuvre par ATB pour chaque transaction sur la Plateforme suit les trois étapes prescrites par l'article 8 du Règlement (UE) 2023/1115 : collecte d'informations, analyse des risques, et mesures d'atténuation des risques (le cas échéant). Ce processus est intégré de bout en bout dans le flux de transaction de la Plateforme et est entièrement traçable, auditable et certifié sur la blockchain.",
        ],
        subsections: [
          {
            title: "3.1 Collecte d'informations",
            paragraphs: [
              "La première étape du processus de diligence raisonnée consiste en la collecte exhaustive des informations suivantes pour chaque Lot, conformément à l'article 8(1)(a) du Règlement (UE) 2023/1115 : (a) la description complète du produit incluant la dénomination commerciale, le type de produit, la quantité, le code SH (Système Harmonisé à 6 chiffres minimum), et le pays de production ; (b) les coordonnées de géolocalisation de toutes les parcelles de production (latitude/longitude en degrés décimaux, précision 6 mètres, format GeoJSON) et les dates de production correspondantes ; (c) les informations sur le Vendeur (nom, adresse, email, numéro d'enregistrement RCCM, certification EUDR le cas échéant) ; (d) les certificats de conformité (GlobalG.A.P., Rainforest Alliance, Bio, Fairtrade, certification FLEGT le cas échéant) ; (e) les autorisations de récolte et permis d'exploitation délivrés par les autorités compétentes ; (f) les documents de légalité (certificat foncier, permis environnemental, quitus fiscal) ; (g) toute information additionnelle permettant d'établir la conformité du Lot au règlement.",
              "Les informations collectées font l'objet d'une vérification automatisée par la Plateforme (validation des formats, cohérence géographique, absence de doublons) et d'une vérification manuelle par l'équipe conformité d'ATB pour les Lots présentant un risque supérieur au seuil défini. Les documents originaux sont hashés (SHA-256) et stockés de manière chiffrée (AES-256) dans le système de gestion documentaire d'ATB, accessible aux autorités compétentes sur requête motivée conformément à l'article 9 du règlement.",
            ],
          },
          {
            title: "3.2 Analyse des risques",
            paragraphs: [
              "La deuxième étape consiste en une analyse de risque documentée et reproductible, conformément à l'article 8(1)(b) du Règlement (UE) 2023/1115, visant à déterminer si le Lot présente un risque négligeable ou non-négligeable de non-conformité. ATB utilise un système de scoring propriétaire combinant plusieurs sources de données : (a) les données satellite U-Net/Sentinel-2 avec analyse diachronique de la couverture forestière depuis le 1er janvier 2020, avec détection des hotspots de déforestation ; (b) les données Global Forest Watch (GFW) — analyse des alertes de déforestation en temps réel (GLAD alerts, RADD alerts) avec un seuil de 0,5 hectare ; (c) les indicateurs de gouvernance et de corruption (Indice de Perception de la Corruption de Transparency International, Worldwide Governance Indicators de la Banque mondiale) ; (d) la catégorisation du pays de production par la Commission européenne (lorsqu'elle sera publiée) ; (e) l'historique des transactions et des conformités du Vendeur sur la Plateforme ; (f) les données de déforestation historique (Global Forest Change de l'Université du Maryland, données Hansen) ; (g) les informations socio-économiques locales (zones de conflit, présence de populations autochtones, litiges fonciers).",
              "Le système d'analyse produit un score de risque global sur une échelle de 0 à 100, avec les seuils suivants : risque négligeable (score 0-30) — validation automatique et émission du Certificat sans intervention humaine requise ; risque faible (score 31-50) — validation après vérification documentaire renforcée par l'équipe conformité ; risque modéré (score 51-70) — validation après inspection de terrain obligatoire réalisée par un partenaire local agréé dans un délai de 30 jours ; risque élevé (score 71-100) — refus de la transaction et blocage du Lot jusqu'à la fourniture d'informations complémentaires suffisantes pour ramener le risque à un niveau acceptable. Pour les Lots présentant un risque modéré ou élevé, ATB peut exiger la mise en oeuvre de mesures d'atténuation supplémentaires (certification par un tiers, analyse de sol, audit de traçabilité renforcé) avant toute validation.",
            ],
          },
          {
            title: "3.3 Décision et certification",
            paragraphs: [
              "À l'issue de l'analyse des risques, la troisième étape est la prise de décision (article 8(1)(c) du Règlement (UE) 2023/1115) et la certification. Si le risque est jugé négligeable, ATB procède à : (a) la validation de la conformité du Lot ; (b) l'émission du Certificat Blockchain contenant l'ensemble des données de due diligence horodatées et signées ; (c) la génération et la soumission automatique de la DDS au système TRACES de la Commission européenne via l'API EUDR ; (d) l'activation du Lot pour la mise en marché. Le Certificat Blockchain est immédiatement accessible à l'Acheteur, au Vendeur, et aux autorités compétentes via le portail de vérification (verify.agritrace.africa).",
              "Si le risque est jugé non-négligeable, ATB applique les mesures d'atténuation nécessaires conformément à l'article 8(2) du règlement : demande d'informations complémentaires au Vendeur, recours à un expert indépendant, inspection de terrain, audit de traçabilité, ou refus de la transaction avec notification motivée. Le Vendeur dispose d'un délai de 30 jours pour fournir les informations ou mesures correctives demandées. Passé ce délai sans réponse satisfaisante, la transaction est définitivement refusée et le Lot est marqué comme non conforme dans le registre blockchain d'ATB, avec notification à l'Acheteur et, si la réglementation l'exige, aux autorités compétentes.",
            ],
          },
        ],
      },
    ],
  },
  en: {
    title: "EUDR Compliance Guide",
    subtitle:
      "Complete compliance guide for Regulation (EU) 2023/1115 of the European Parliament and of the Council of May 31, 2023 on the making available on the Union market and the export from the Union of certain commodities and products associated with deforestation and forest degradation.",
    badge: "EUDR Regulation",
    sections: [
      {
        id: "overview",
        title: "1. Overview of the EUDR",
        paragraphs: [
          "Regulation (EU) 2023/1115, commonly referred to as the EUDR (EU Deforestation Regulation), was adopted by the European Parliament and the Council of the European Union on May 31, 2023 and entered into force on June 29, 2023. It repeals and replaces Regulation (EU) No 995/2010 (the Timber Regulation) and establishes strict rules concerning the placing on the European Union market and the export from the Union of certain commodities and products associated with deforestation and forest degradation. This regulation is part of the European Green Deal and the Farm to Fork strategy, and aims to ensure that products consumed in the EU do not contribute to global deforestation or forest degradation.",
          "Products covered by the regulation are listed in Annex I and include the following raw materials: cattle, cocoa, coffee, oil palm, rubber, soya, and wood, as well as derivative products listed in said annex (leather, chocolate, processed coffee, palm oil and its fractions, tires, furniture, paper, etc.). For the ATB AgriTrace platform, the relevant supply chains are primarily cocoa (cocoa beans, cocoa butter, cocoa paste, chocolate), coffee (green coffee, roasted coffee), palm oil (crude and refined palm oil and their fractions), natural rubber, and soya. The regulation requires operators (producers, importers, exporters) to demonstrate that their products are deforestation-free (produced on land that has not been subject to forest conversion after December 31, 2020) and legal under the legislation of the country of production.",
          "The regulation application timeline provides for: (a) for large enterprises and operators (non-SMEs), compliance obligations apply from December 30, 2025; (b) for small and medium-sized enterprises (SMEs) and micro-enterprises, obligations apply from June 30, 2026. The European Commission has established a country benchmarking system categorizing countries by risk level (low, standard, high) based on an objective assessment using criteria such as deforestation rate, agricultural expansion rate, and production trends for relevant commodities. Countries classified as high risk will be subject to enhanced scrutiny, with an increased level of due diligence obligations (Article 29). To date, no West African country has yet been formally categorized by the Commission, but ATB is actively monitoring the evolution of classifications that will be published in the Official Journal of the European Union.",
        ],
      },
      {
        id: "compliance-requirements",
        title: "2. Compliance Requirements",
        paragraphs: [
          "Regulation (EU) 2023/1115 imposes three cumulative requirements for a product to be placed on the European Union market or exported from it: legality, deforestation-free status, and the production of a due diligence statement. These three requirements are inseparable and must be satisfied for each Batch of products, from the production plot to the market placement.",
        ],
        subsections: [
          {
            title: "2.1 Legality Requirement",
            paragraphs: [
              "Article 2(40) of Regulation (EU) 2023/1115 defines legality as the conformity of the product with the legislation in force in the country of production. This requirement covers six distinct legal domains that the Seller and ATB must verify: (1) land use rights — verification that production plots are operated in accordance with valid land titles, operating permits, or land use agreements; (2) environmental laws — compliance with environmental impact assessments, waste management standards, water resource protection rules, and biodiversity conservation requirements; (3) labor and social laws — compliance with national labor law (Beninese Labor Code Law No. 98-004 of January 28, 1998, applicable collective agreements), prohibition of child labor and forced labor in accordance with ILO conventions (No. 138, 182, 29, 105); (4) land tenure rights — respect for the rights of local communities and indigenous peoples, in accordance with Law No. 2017-15 of August 10, 2017 on the Land and Domain Code of the Republic of Benin; (5) tax laws — payment of taxes and duties due in respect of agricultural operations; (6) local community rights — respect for customary rights and prior consultation procedures for affected communities, particularly in production areas subject to customary land tenure systems.",
              "ATB has developed a legality verification module integrated into the Platform, which cross-references the Seller declarative data with available official databases (national land registries, RCCM registers, agriculture ministry databases, government permit platforms). In the absence of digitized official data, ATB requires the production of original documents (land certificate, operating permit, tax clearance, social compliance certificate) subject to documentary verification by the compliance team and, if necessary, field inspection carried out by an approved local partner.",
            ],
          },
          {
            title: "2.2 Deforestation-Free Requirement",
            paragraphs: [
              "Article 2(13) of Regulation (EU) 2023/1115 defines a deforestation-free product as a product whose raw materials have been produced on land that has not been subject to forest conversion (deforestation) or forest degradation after December 31, 2020, the cut-off date set by the regulation. ATB uses a proprietary satellite monitoring system based on the U-Net architecture (ResNet-34 encoder) deployed on NVIDIA A100 GPUs, analyzing Sentinel-2 imagery from the European Space Agency Copernicus program (10-meter resolution, 5-day revisit frequency). The algorithm achieves a performance of mIoU (mean Intersection over Union) of 0.89, with a minimum detection threshold of 0.5 hectares of forest cover change.",
              "Forest is defined in accordance with the FAO (Food and Agriculture Organization of the United Nations) definition as land spanning more than 0.5 hectares, with trees reaching a height exceeding 5 meters and a forest cover exceeding 10%. For each Batch traded on the Platform, ATB performs a diachronic (before/after) analysis covering a period from January 1, 2020 to the transaction date, with a quarterly analysis frequency. Analysis results (images, change maps, confidence scores) are timestamped, hashed via SHA-256, and recorded on the ATB Hyperledger Besu blockchain, constituting an immutable and verifiable proof of the Batch compliance with the deforestation-free requirement.",
            ],
          },
          {
            title: "2.3 Due Diligence Statement",
            paragraphs: [
              "In accordance with Article 4(2) of Regulation (EU) 2023/1115, each operator must submit a due diligence statement (DDS) through the European Commission information system before placing a product on the Union market or exporting it. The DDS must confirm that the operator has exercised due diligence in accordance with Article 8 of the regulation and that no or only negligible risk of non-compliance has been found. The declaration must include the following information: full contact details of the operator (name, address, email, EUDR registration number assigned by the Commission), HS (Harmonized System) code of the product, quantity, country of production, geolocation coordinates (latitude/longitude) of all production plots with 6-meter precision (and corresponding polygons), legality certificates, satellite analysis results, date of declaration, and qualified electronic signature.",
              "The ATB AgriTrace Platform fully automates the generation and submission of the DDS. As soon as the compliance verification is finalized (legality verified, satellite analysis validated, due diligence exercised), the Platform generates the declaration in XML format compliant with the European Commission TRACES system, electronically signs it (eIDAS-compliant QES), and automatically transmits it via the EUDR information system API. An acknowledgment of receipt issued by the Commission, containing the unique registration number of the declaration, is automatically attached to the Batch Blockchain Certificate. The DDS is stored in the Platform blockchain register for a period of 7 years in accordance with Article 9 of the regulation.",
            ],
          },
        ],
      },
      {
        id: "due-diligence-process",
        title: "3. Due Diligence Process on ATB",
        paragraphs: [
          "The due diligence process implemented by ATB for each transaction on the Platform follows the three steps prescribed by Article 8 of Regulation (EU) 2023/1115: information collection, risk analysis, and risk mitigation measures (where applicable). This process is end-to-end integrated into the Platform transaction flow and is fully traceable, auditable, and certified on the blockchain.",
        ],
        subsections: [
          {
            title: "3.1 Information Collection",
            paragraphs: [
              "The first step of the due diligence process consists of the exhaustive collection of the following information for each Batch, in accordance with Article 8(1)(a) of Regulation (EU) 2023/1115: (a) a complete product description including commercial name, product type, quantity, HS code (minimum 6-digit Harmonized System), and country of production; (b) geolocation coordinates of all production plots (latitude/longitude in decimal degrees, 6-meter precision, GeoJSON format) and corresponding production dates; (c) information on the Seller (name, address, email, RCCM registration number, EUDR certification if applicable); (d) compliance certificates (GlobalG.A.P., Rainforest Alliance, Organic, Fairtrade, FLEGT certification where applicable); (e) harvest permits and operating permits issued by competent authorities; (f) legality documents (land certificate, environmental permit, tax clearance); (g) any additional information enabling the establishment of the Batch conformity to the regulation.",
              "The collected information is subject to automated verification by the Platform (format validation, geographical consistency, duplicate detection) and manual verification by the ATB compliance team for Batches presenting a risk above the defined threshold. Original documents are hashed (SHA-256) and stored encrypted (AES-256) in the ATB document management system, accessible to competent authorities upon reasoned request in accordance with Article 9 of the regulation.",
            ],
          },
          {
            title: "3.2 Risk Analysis",
            paragraphs: [
              "The second step consists of a documented and reproducible risk analysis, in accordance with Article 8(1)(b) of Regulation (EU) 2023/1115, aimed at determining whether the Batch presents a negligible or non-negligible risk of non-compliance. ATB uses a proprietary scoring system combining multiple data sources: (a) U-Net/Sentinel-2 satellite data with diachronic forest cover analysis since January 1, 2020, with deforestation hotspot detection; (b) Global Forest Watch (GFW) data — real-time deforestation alert analysis (GLAD alerts, RADD alerts) with a 0.5-hectare threshold; (c) governance and corruption indicators (Transparency International Corruption Perception Index, World Bank Worldwide Governance Indicators); (d) country categorization by the European Commission (when published); (e) Seller transaction and compliance history on the Platform; (f) historical deforestation data (Global Forest Change, University of Maryland Hansen data); (g) local socio-economic information (conflict zones, presence of indigenous populations, land disputes).",
              "The analysis system produces an overall risk score on a scale of 0 to 100, with the following thresholds: negligible risk (score 0-30) — automatic validation and Certificate issuance without human intervention required; low risk (score 31-50) — validation after enhanced documentary verification by the compliance team; moderate risk (score 51-70) — validation after mandatory field inspection by an approved local partner within 30 days; high risk (score 71-100) — transaction rejection and Batch blocking until sufficient additional information is provided to bring the risk to an acceptable level. For Batches presenting moderate or high risk, ATB may require the implementation of additional mitigation measures (third-party certification, soil analysis, enhanced traceability audit) before any validation.",
            ],
          },
          {
            title: "3.3 Decision and Certification",
            paragraphs: [
              "Upon completion of the risk analysis, the third step is the decision-making (Article 8(1)(c) of Regulation (EU) 2023/1115) and certification. If the risk is deemed negligible, ATB proceeds with: (a) validation of Batch compliance; (b) issuance of the Blockchain Certificate containing all timestamped and signed due diligence data; (c) generation and automatic submission of the DDS to the European Commission TRACES system via the EUDR API; (d) activation of the Batch for market placement. The Blockchain Certificate is immediately accessible to the Buyer, Seller, and competent authorities via the verification portal (verify.agritrace.africa).",
              "If the risk is deemed non-negligible, ATB applies the necessary mitigation measures in accordance with Article 8(2) of the regulation: request for additional information from the Seller, recourse to an independent expert, field inspection, traceability audit, or transaction refusal with a reasoned notification. The Seller has a period of 30 days to provide the requested information or corrective measures. Failing a satisfactory response within this period, the transaction is permanently refused and the Batch is marked as non-compliant in the ATB blockchain register, with notification to the Buyer and, if regulation requires, to the competent authorities.",
            ],
          },
        ],
      },
    ],
  },
};
