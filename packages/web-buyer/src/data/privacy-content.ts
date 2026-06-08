import { type LegalPageData } from "./types";

export const PRIVACY: Record<"fr" | "en", LegalPageData> = {
  fr: {
    title: "Politique de confidentialité",
    subtitle:
      "Dernière mise à jour : 15 mai 2026. Conformément à la Loi n° 2017-20 du 20 avril 2017 portant code du numérique en République du Bénin et au Règlement Général sur la Protection des Données (RGPD) de l'Union européenne.",
    badge: "Protection des données",
    sections: [
      {
        id: "scope",
        title: "1. Champ d'application et responsable de traitement",
        paragraphs: [
          "La présente Politique de confidentialité décrit la manière dont ATB Technologies SAS (« ATB », « nous », « notre »), en qualité de responsable de traitement, collecte, utilise, stocke et protège les données à caractère personnel des utilisateurs de la plateforme ATB AgriTrace (ci-après « la Plateforme »), accessible depuis les domaines atb-agritrace.com, agritrace.africa, et atbplatform.io, ainsi que depuis ses applications mobiles associées.",
          "Cette politique s'applique à l'ensemble des utilisateurs de la Plateforme, qu'ils soient acheteurs internationaux, producteurs ou coopératives agricoles basés en Afrique de l'Ouest, transporteurs, inspecteurs de durabilité, ou visiteurs du site. Elle couvre également les données des personnes morales dans la mesure où les informations collectées permettent d'identifier des personnes physiques agissant en leur nom.",
          "ATB Technologies SAS a nommé un Délégué à la Protection des Données (DPO) en la personne de Monsieur Jean-Baptiste Houénou, joignable à l'adresse dpo@atb-agritrace.com. La société est inscrite auprès de l'Autorité de Protection des Données Personnelles (APDP) du Bénin sous le numéro 2024-DP-0789, et désigne un représentant dans l'Union européenne conformément à l'article 27 du RGPD : ATB EU Rep GmbH, c/o DPO Services, Taunusanlage 12, 60325 Frankfurt am Main, Allemagne.",
        ],
      },
      {
        id: "categories",
        title: "2. Catégories de données collectées et finalités",
        paragraphs: [
          "ATB Technologies SAS collecte et traite les données à caractère personnel des utilisateurs uniquement pour les finalités décrites ci-après, sur le fondement des bases juridiques prévues par l'article 6 du RGPD et les articles 52 à 55 du code du numérique béninois. Chaque finalité fait l'objet d'une information préalable et, lorsque la loi l'exige, d'un consentement explicite recueilli via un mécanisme de case à cocher ou de double opt-in.",
        ],
        subsections: [
          {
            title: "2.1 Données d'identification et de création de compte",
            paragraphs: [
              "Lors de la création d'un compte utilisateur, nous collectons : nom, prénom, adresse électronique professionnelle, numéro de téléphone, fonction, nom de l'entreprise ou de l'organisation, adresse professionnelle, justificatif d'immatriculation (RCCM, IFU ou équivalent), et pièce d'identité pour les personnes physiques. La base légale est l'exécution du contrat (article 6(1)(b) RGPD) et le respect d'une obligation légale de connaissance du client (KYC) au titre de l'article 153 de l'Acte Uniforme OHADA sur le droit commercial général.",
              "Les données d'identification sont conservées pendant toute la durée de la relation contractuelle et archivées pendant 5 ans après la clôture du compte, conformément à l'article 285 de l'Acte Uniforme OHADA portant sur le droit comptable et l'information financière.",
            ],
          },
          {
            title: "2.2 Données de transaction et de traçabilité",
            paragraphs: [
              "Dans le cadre des opérations d'achat et de vente de produits agricoles, nous collectons : les informations relatives aux transactions (nature des produits, volumes, prix convenus, conditions de livraison, Incoterms), les documents douaniers (certificats d'origine, phytosanitaires, analyse de laboratoire), les informations logistiques (lieu de chargement, destination, numéros de conteneur, tracking B/L), et les certifications agricoles (GlobalG.A.P., Rainforest Alliance, Bio, Fairtrade).",
              "La base légale de ce traitement est l'exécution du contrat (article 6(1)(b) RGPD) et le respect des obligations réglementaires applicables au commerce international de produits agricoles. Les données de transaction sont conservées pour une durée de 10 ans conformément aux obligations fiscales béninoises (Code Général des Impôts) et aux règles de l'OHADA en matière de conservation des documents comptables.",
            ],
          },
          {
            title: "2.3 Données de conformité EUDR (Deforestation-Free)",
            paragraphs: [
              "Conformément au Règlement (UE) 2023/1115 du Parlement européen et du Conseil du 31 mai 2023 relatif à la mise à disposition sur le marché de l'Union et à l'exportation à partir de l'Union de certains produits de base et produits associés à la déforestation et à la dégradation des forêts, nous collectons les données suivantes : coordonnées de géolocalisation (latitude/longitude) des parcelles de production avec un niveau de précision de 6 mètres, les données de géotraçabilité (polygones), les images satellite datées, les autorisations de récolte, les certificats de légalité et de non-déforestation délivrés par les autorités compétentes des pays producteurs.",
              "Ces données sont conservées pendant une durée de 7 ans à compter de la date de la transaction concernée, conformément à l'article 9 du Règlement (UE) 2023/1115. La base légale est l'obligation légale à laquelle le responsable de traitement est soumis (article 6(1)(c) RGPD). Les données EUDR sont partagées avec les autorités compétentes des États membres de l'Union européenne sur requête motivée.",
            ],
          },
          {
            title: "2.4 Données de paiement",
            paragraphs: [
              "Les transactions financières sur la Plateforme sont traitées par nos partenaires de paiement agréés : Ecobank Bénin (établissement de crédit agréé par la BCEAO) et Lemonway SAS (établissement de paiement agréé par l'ACPR, France). ATB Technologies SAS ne stocke pas directement les données bancaires sensibles (numéros de carte bancaire, cryptogrammes, dates d'expiration). Ces données sont collectées et traitées directement via les interfaces sécurisées de nos prestataires de paiement, certifiées PCI DSS niveau 1.",
              "Seules les informations suivantes sont accessibles à ATB : les quatre derniers chiffres du numéro de carte, le type de carte, la date de la transaction, le montant, et le statut de la transaction. La base légale de ce traitement est l'exécution du contrat (article 6(1)(b) RGPD). Les données de transaction financière sont conservées conformément aux obligations de la BCEAO et de l'ACPR pour une durée de 10 ans.",
            ],
          },
          {
            title: "2.5 Données de navigation et d'audience",
            paragraphs: [
              "La Plateforme utilise Matomo, un outil de mesure d'audience auto-hébergé sur nos propres serveurs AWS, configuré en mode privacy-by-default. Nous collectons les données suivantes : adresse IP (anonymisée par troncature des 2 derniers octets), type et version du navigateur, système d'exploitation, pages visitées, durée de la session, provenance (référent), et résolution d'écran. Aucune donnée n'est transmise à des tiers, aucun cookie cross-site n'est déposé.",
              "La base légale de ce traitement est le consentement (article 6(1)(a) RGPD), recueilli via une bannière de consentement explicite lors de la première visite, conformément à la Délibération n° 2020-092 de la CNIL et aux recommandations de l'APDP du Bénin. Les données d'audience sont conservées pour une durée maximale de 13 mois, conformément à la Recommandation CNIL n° 2020-092. L'utilisateur peut retirer son consentement à tout moment depuis les paramètres de cookies.",
            ],
          },
        ],
      },
      {
        id: "recipients",
        title: "3. Destinataires des données et transferts internationaux",
        paragraphs: [
          "Les données collectées via la Plateforme sont destinées aux services internes habilités d'ATB Technologies SAS (équipes technique, juridique, conformité, support client, et commercial), ainsi qu'aux sous-traitants listés ci-dessous agissant en qualité de sous-traitants au sens de l'article 28 du RGPD. Chaque sous-traitant est lié par un contrat comportant des clauses de protection des données conformes à l'article 28(3) du RGPD et aux articles 58 à 62 du code du numérique béninois.",
          "Les sous-traitants suivants ont accès à certaines catégories de données dans le cadre de leurs prestations : (1) Amazon Web Services EMEA SARL (France) — hébergement et stockage, certifié ISO 27001 ; (2) Lemonway SAS (France) — traitement des paiements, agréé ACPR ; (3) Ecobank Bénin (Bénin) — traitement des paiements, agréé BCEAO ; (4) SendGrid / Twilio Inc. (États-Unis) — envoi d'emails transactionnels, certifié ISO 27001 ; (5) Zendesk Inc. (États-Unis) — gestion du support client, certifié ISO 27001 ; (6) OpenNode / Lextender (France) — vérification KYC et conformité réglementaire.",
          "Les données hébergées par AWS dans la région eu-west-3 (Paris, France) ne font pas l'objet de transferts en dehors de l'Espace Économique Européen (EEE). Pour les sous-traitants situés aux États-Unis, les transferts sont encadrés par des Clauses Contractuelles Types (CCT) de la Commission européenne conformément à la Décision d'exécution (UE) 2021/914 du 4 juin 2021. Une analyse d'impact relative à la protection des données (AIPD) a été réalisée pour chaque transfert conformément à l'article 35 du RGPD.",
        ],
      },
      {
        id: "security",
        title: "4. Mesures de sécurité",
        paragraphs: [
          "ATB Technologies SAS met en œuvre des mesures de sécurité techniques, organisationnelles et juridiques proportionnées à la nature des données traitées et aux risques identifiés dans le cadre de notre Analyse d'Impact Relative à la Protection des Données (AIPD) actualisée annuellement.",
        ],
        subsections: [
          {
            title: "4.1 Mesures techniques",
            paragraphs: [
              "L'ensemble des données est chiffré au repos (AES-256 avec AWS KMS et clés gérées par le client, rotation automatique tous les 90 jours) et en transit (TLS 1.3 uniquement, certificats X.509 signés par AWS Certificate Manager, interdiction stricte des protocoles TLS 1.2 et antérieurs). L'authentification des utilisateurs repose sur un mécanisme MFA (multi-factor authentication) obligatoire pour les comptes administrateurs et optionnel pour les comptes standard, via application d'authentification (TOTP conforme RFC 6238) ou clé de sécurité FIDO2/WebAuthn.",
              "L'infrastructure est protégée par un pare-feu applicatif (WAF) AWS Shield Advanced avec règles OWASP Top 10 personnalisées, un système de détection d'intrusion (IDS) basé sur AWS GuardDuty, et un système de prévention d'intrusion (IPS) au niveau réseau. Les accès aux serveurs sont restreints par un bastion host avec authentification par clé SSH (4096 bits RSA) et journalisation via AWS CloudTrail. Les bases de données sont isolées dans un sous-réseau privé sans accès Internet direct.",
              "Un plan de réponse aux incidents de sécurité est activé sous 15 minutes par l'équipe SOC (Security Operations Center) d'ATB, qui assure une veille 24/7. Les tests d'intrusion externes sont réalisés trimestriellement par un prestataire certifié CHECK ou PASSI. La politique de mots de passe impose un minimum de 12 caractères, incluant majuscules, minuscules, chiffres et caractères spéciaux, avec un hachage bcrypt (coût 12) pour le stockage.",
            ],
          },
          {
            title: "4.2 Mesures organisationnelles",
            paragraphs: [
              "L'accès aux données à caractère personnel est strictement limité aux seuls employés d'ATB Technologies SAS dont les fonctions le justifient, sur la base du principe du moindre privilège (least privilege). Chaque accès est nominatif, authentifié par MFA, horodaté, et fait l'objet d'une journalisation détaillée conservée pendant 12 mois. Les habilitations sont révisées mensuellement et immédiatement révoquées en cas de changement de fonction ou de départ.",
              "L'ensemble du personnel ayant accès à des données personnelles signe un engagement de confidentialité conforme à l'article L. 122-19 du Code du Travail béninois et suit une formation obligatoire à la protection des données d'une durée minimale de 8 heures par an, incluant les principes du RGPD, la gestion des incidents, et les gestes barrières contre l'hameçonnage. Un registre des activités de traitement est tenu à jour conformément à l'article 30 du RGPD.",
            ],
          },
        ],
      },
      {
        id: "cookies",
        title: "5. Gestion des cookies",
        paragraphs: [
          "La Plateforme utilise Matomo, un outil de mesure d'audience auto-hébergé, configuré pour respecter la vie privée des utilisateurs par défaut (privacy-by-design). Matomo est installé sur nos propres serveurs AWS à Paris (eu-west-3), et aucune donnée n'est transmise à un serveur tiers. Les cookies déposés par Matomo sont exclusivement first-party et ne permettent pas de tracer l'utilisateur au-delà de notre site.",
          "Conformément à la Délibération CNIL n° 2020-092 et aux recommandations de l'APDP du Bénin, les cookies sont classés en deux catégories : (A) Cookies strictement nécessaires au fonctionnement de la Plateforme (session, authentification, sécurité, préférences de langue) — ces cookies sont exemptés de consentement préalable au titre de l'article 82 de la Loi n° 78-17 du 6 janvier 1978 modifiée, et de l'article 58 du code du numérique béninois ; (B) Cookies de mesure d'audience (Matomo) — ces cookies sont soumis à consentement préalable, recueilli via une bannière de cookies explicite lors de la première visite.",
          "L'utilisateur peut à tout moment : (a) accepter ou refuser les cookies de mesure d'audience via la bannière de cookies ou le panneau de paramètres accessible depuis le pied de page ; (b) configurer son navigateur pour bloquer les cookies (voir les aides des navigateurs Chrome, Firefox, Safari, Edge) ; (c) désactiver le suivi Matomo en cliquant sur le lien de désinscription disponible dans le pied de page de chaque page de la Plateforme. Aucun cookie publicitaire, cookie tiers, ou cookie de réseaux sociaux n'est déposé par la Plateforme.",
        ],
      },
      {
        id: "rights",
        title: "6. Exercice de vos droits",
        paragraphs: [
          "Conformément aux articles 12 à 23 du RGPD et aux articles 60 à 72 du code du numérique béninois, vous disposez des droits suivants sur vos données à caractère personnel : droit d'accès (article 15 RGPD — obtenir la confirmation que vos données sont traitées et une copie des données) ; droit de rectification (article 16 RGPD — faire corriger les données inexactes ou incomplètes) ; droit à l'effacement (article 17 RGPD — obtenir la suppression de vos données, sous réserve des obligations légales de conservation) ; droit à la limitation du traitement (article 18 RGPD — marquer vos données comme « gelées » en cas de contestation de leur exactitude ou de la licéité du traitement) ; droit à la portabilité (article 20 RGPD — recevoir vos données dans un format structuré, couramment utilisé et lisible par machine, et les transmettre à un autre responsable de traitement) ; droit d'opposition (article 21 RGPD — vous opposer au traitement fondé sur l'intérêt légitime, y compris le profilage).",
          "Ces droits peuvent être exercés directement et gratuitement : (a) depuis votre tableau de bord utilisateur sur la Plateforme (pour l'accès, la rectification et la portabilité) ; (b) par courrier électronique à l'adresse dpo@atb-agritrace.com ; (c) par courrier postal à l'adresse : ATB Technologies SAS — DPO, 56 Boulevard de la Marina, Immeuble Atacado, 7e étage, 01 BP 2345 Cotonou, République du Bénin. Toute demande doit comporter votre nom, prénom, adresse électronique associée à votre compte, et une copie recto-verso d'un justificatif d'identité en cours de validité.",
          "Nous nous engageons à répondre à toute demande dans un délai maximum de 30 jours à compter de la réception de la demande complète, conformément à l'article 12(3) du RGPD. Ce délai peut être prolongé de 60 jours supplémentaires en raison de la complexité du nombre de demandes, auquel cas nous vous informerons des motifs de la prolongation. En cas de non-respect de vos droits, vous avez le droit d'introduire une réclamation auprès : (a) de l'Autorité de Protection des Données Personnelles (APDP) du Bénin — contact@apdp.bj ; (b) de la Commission Nationale de l'Informatique et des Libertés (CNIL) — 3 Place de Fontenoy, 75007 Paris, France — si vous résidez dans l'Union européenne.",
        ],
      },
      {
        id: "updates",
        title: "7. Mise à jour de la politique",
        paragraphs: [
          "La présente Politique de confidentialité est susceptible d'être modifiée à tout moment pour refléter les évolutions de notre Plateforme, des traitements de données, du cadre réglementaire applicable, ou des recommandations de l'APDP et de la CNIL. En cas de modification substantielle, nous vous en informerons par email à l'adresse associée à votre compte et/ou via une notification sur la Plateforme, au moins 30 jours avant l'entrée en vigueur des modifications.",
          "La date de dernière mise à jour est indiquée en tête de la présente politique (15 mai 2026). L'historique des versions antérieures est tenu à disposition sur demande auprès de notre DPO. Si vous continuez à utiliser la Plateforme après l'entrée en vigueur des modifications, celles-ci seront réputées acceptées. Si vous n'acceptez pas les modifications, vous pouvez supprimer votre compte conformément à la procédure décrite à la section 6.",
        ],
      },
      {
        id: "contact",
        title: "8. Contact et réclamation",
        paragraphs: [
          "Pour toute question relative à la présente Politique de confidentialité, à la protection de vos données à caractère personnel, ou pour exercer vos droits, vous pouvez contacter : (a) notre DPO par email à dpo@atb-agritrace.com ; (b) notre service client par email à support@atb-agritrace.com ou par téléphone au +229 01 23 45 67 89 (du lundi au vendredi, 8h-18h UTC+1) ; (c) par courrier postal à l'adresse du siège social indiquée à la section 1.",
          "Si vous estimez que le traitement de vos données à caractère personnel constitue une violation du RGPD ou du code du numérique béninois, vous avez le droit d'introduire une réclamation auprès : (a) de l'Autorité de Protection des Données Personnelles (APDP) de la République du Bénin — Immeuble Ex-BIAC, 5e étage, Avenue Clozel, 01 BP 2041 Cotonou, Bénin — contact@apdp.bj — Tél : +229 21 30 80 69 ; (b) de la CNIL pour les résidents européens — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France — Tél : +33 1 53 73 22 22.",
          "Conformément à l'article 77 du RGPD et à l'article 72 du code du numérique béninois, cette réclamation peut être introduite sans préjudice de tout recours administratif ou juridictionnel. Vous disposez également du droit d'introduire un recours juridictionnel effectif contre une décision de l'autorité de contrôle (article 78 RGPD) et d'obtenir réparation du préjudice matériel ou moral subi (article 82 RGPD).",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    subtitle:
      "Last updated: May 15, 2026. In accordance with Law No. 2017-20 of April 20, 2017 on the Digital Code of the Republic of Benin and the General Data Protection Regulation (GDPR) of the European Union.",
    badge: "Data protection",
    sections: [
      {
        id: "scope",
        title: "1. Scope and Data Controller",
        paragraphs: [
          "This Privacy Policy describes how ATB Technologies SAS (\"ATB\", \"we\", \"our\", \"us\"), as the data controller, collects, uses, stores, and protects the personal data of users of the ATB AgriTrace platform (hereinafter \"the Platform\"), accessible from the domains atb-agritrace.com, agritrace.africa, and atbplatform.io, as well as from its associated mobile applications.",
          "This policy applies to all users of the Platform, whether they are international buyers, agricultural producers or cooperatives based in West Africa, transporters, sustainability inspectors, or website visitors. It also covers the data of legal entities insofar as the information collected makes it possible to identify natural persons acting on their behalf.",
          "ATB Technologies SAS has appointed a Data Protection Officer (DPO), Mr. Jean-Baptiste Houénou, reachable at dpo@atb-agritrace.com. The company is registered with the Beninese Personal Data Protection Authority (APDP) under number 2024-DP-0789, and designates a representative in the European Union in accordance with Article 27 of the GDPR: ATB EU Rep GmbH, c/o DPO Services, Taunusanlage 12, 60325 Frankfurt am Main, Germany.",
        ],
      },
      {
        id: "categories",
        title: "2. Categories of Data Collected and Purposes",
        paragraphs: [
          "ATB Technologies SAS collects and processes users' personal data only for the purposes described below, on the basis of the legal bases provided for in Article 6 of the GDPR and Articles 52 to 55 of the Beninese Digital Code. Each purpose is subject to prior information and, where required by law, explicit consent obtained via a checkbox or double opt-in mechanism.",
        ],
        subsections: [
          {
            title: "2.1 Identification and Account Creation Data",
            paragraphs: [
              "When creating a user account, we collect: first name, last name, professional email address, telephone number, job title, company or organization name, business address, proof of business registration (RCCM, IFU or equivalent), and proof of identity for natural persons. The legal basis is the performance of the contract (Article 6(1)(b) GDPR) and compliance with a legal know-your-customer (KYC) obligation under Article 153 of the OHADA Uniform Act on General Commercial Law.",
              "Identification data is retained for the duration of the contractual relationship and archived for 5 years after account closure, in accordance with Article 285 of the OHADA Uniform Act on Accounting Law and Financial Information.",
            ],
          },
          {
            title: "2.2 Transaction and Traceability Data",
            paragraphs: [
              "In the context of purchase and sale operations for agricultural products, we collect: transaction information (product type, volumes, agreed prices, delivery terms, Incoterms), customs documents (certificates of origin, phytosanitary certificates, laboratory analyses), logistics information (loading location, destination, container numbers, bill of lading tracking), and agricultural certifications (GlobalG.A.P., Rainforest Alliance, Organic, Fairtrade).",
              "The legal basis for this processing is the performance of the contract (Article 6(1)(b) GDPR) and compliance with regulatory obligations applicable to international trade in agricultural products. Transaction data is retained for a period of 10 years in accordance with Beninese tax obligations (General Tax Code) and OHADA rules on the retention of accounting documents.",
            ],
          },
          {
            title: "2.3 EUDR Compliance Data (Deforestation-Free)",
            paragraphs: [
              "In accordance with Regulation (EU) 2023/1115 of the European Parliament and of the Council of May 31, 2023 on the making available on the Union market and the export from the Union of certain commodities and products associated with deforestation and forest degradation, we collect the following data: geolocation coordinates (latitude/longitude) of production plots with a precision level of 6 meters, geotraceability data (polygons), dated satellite imagery, harvest authorizations, legality and deforestation-free certificates issued by the competent authorities of producer countries.",
              "This data is retained for a period of 7 years from the date of the relevant transaction, in accordance with Article 9 of Regulation (EU) 2023/1115. The legal basis is the legal obligation to which the data controller is subject (Article 6(1)(c) GDPR). EUDR data is shared with the competent authorities of European Union member states upon reasoned request.",
            ],
          },
          {
            title: "2.4 Payment Data",
            paragraphs: [
              "Financial transactions on the Platform are processed by our authorized payment partners: Ecobank Benin (credit institution licensed by BCEAO) and Lemonway SAS (payment institution licensed by ACPR, France). ATB Technologies SAS does not directly store sensitive banking data (credit card numbers, CVV codes, expiration dates). This data is collected and processed directly through the secure interfaces of our payment providers, certified PCI DSS Level 1.",
              "Only the following information is accessible to ATB: the last four digits of the card number, card type, transaction date, amount, and transaction status. The legal basis for this processing is the performance of the contract (Article 6(1)(b) GDPR). Financial transaction data is retained in accordance with BCEAO and ACPR obligations for a period of 10 years.",
            ],
          },
          {
            title: "2.5 Browsing and Audience Data",
            paragraphs: [
              "The Platform uses Matomo, a self-hosted audience measurement tool installed on our own AWS servers, configured in privacy-by-default mode. We collect the following data: IP address (anonymized by truncating the last 2 octets), browser type and version, operating system, pages visited, session duration, referral source, and screen resolution. No data is transmitted to third parties, and no cross-site cookies are set.",
              "The legal basis for this processing is consent (Article 6(1)(a) GDPR), obtained via an explicit consent banner on first visit, in accordance with CNIL Deliberation No. 2020-092 and the recommendations of the APDP of Benin. Audience data is retained for a maximum period of 13 months, in accordance with CNIL Recommendation No. 2020-092. Users may withdraw their consent at any time from the cookie settings.",
            ],
          },
        ],
      },
      {
        id: "recipients",
        title: "3. Data Recipients and International Transfers",
        paragraphs: [
          "Data collected through the Platform is intended for authorized internal departments of ATB Technologies SAS (technical, legal, compliance, customer support, and commercial teams), as well as the processors listed below acting as data processors within the meaning of Article 28 of the GDPR. Each processor is bound by a contract containing data protection clauses compliant with Article 28(3) of the GDPR and Articles 58 to 62 of the Beninese Digital Code.",
          "The following processors have access to certain categories of data in the context of their services: (1) Amazon Web Services EMEA SARL (France) — hosting and storage, ISO 27001 certified; (2) Lemonway SAS (France) — payment processing, ACPR licensed; (3) Ecobank Benin (Benin) — payment processing, BCEAO licensed; (4) SendGrid / Twilio Inc. (United States) — transactional email delivery, ISO 27001 certified; (5) Zendesk Inc. (United States) — customer support management, ISO 27001 certified; (6) OpenNode / Lextender (France) — KYC verification and regulatory compliance.",
          "Data hosted by AWS in the eu-west-3 region (Paris, France) is not subject to transfers outside the European Economic Area (EEA). For processors located in the United States, transfers are governed by Standard Contractual Clauses (SCCs) adopted by the European Commission pursuant to Implementing Decision (EU) 2021/914 of June 4, 2021. A Data Protection Impact Assessment (DPIA) has been carried out for each transfer in accordance with Article 35 of the GDPR.",
        ],
      },
      {
        id: "security",
        title: "4. Security Measures",
        paragraphs: [
          "ATB Technologies SAS implements technical, organizational, and legal security measures proportionate to the nature of the data processed and the risks identified in our Data Protection Impact Assessment (DPIA), which is updated annually.",
        ],
        subsections: [
          {
            title: "4.1 Technical Measures",
            paragraphs: [
              "All data is encrypted at rest (AES-256 using AWS KMS with customer-managed keys, automatic rotation every 90 days) and in transit (TLS 1.3 only, X.509 certificates signed by AWS Certificate Manager, strict prohibition of TLS 1.2 and earlier protocols). User authentication relies on MFA (multi-factor authentication), mandatory for administrator accounts and optional for standard accounts, via authenticator application (TOTP compliant with RFC 6238) or FIDO2/WebAuthn security key.",
              "The infrastructure is protected by an AWS Shield Advanced web application firewall (WAF) with custom OWASP Top 10 rules, an AWS GuardDuty-based intrusion detection system (IDS), and a network-level intrusion prevention system (IPS). Server access is restricted via a bastion host with SSH key authentication (4096-bit RSA) and logging through AWS CloudTrail. Databases are isolated in a private subnet with no direct Internet access.",
              "A security incident response plan is activated within 15 minutes by the ATB Security Operations Center (SOC), which provides 24/7 monitoring. External penetration tests are conducted quarterly by a CHECK or PASSI certified provider. Password policy requires a minimum of 12 characters, including uppercase, lowercase, digits, and special characters, with bcrypt hashing (cost factor 12) for storage.",
            ],
          },
          {
            title: "4.2 Organizational Measures",
            paragraphs: [
              "Access to personal data is strictly limited to ATB Technologies SAS employees whose roles require it, based on the principle of least privilege. Each access is user-specific, MFA-authenticated, timestamped, and subject to detailed logging retained for 12 months. Authorizations are reviewed monthly and immediately revoked in the event of role change or departure.",
              "All personnel with access to personal data sign a confidentiality undertaking in accordance with Article L. 122-19 of the Beninese Labor Code and undergo mandatory data protection training of at least 8 hours per year, covering GDPR principles, incident management, and anti-phishing best practices. A register of processing activities is maintained in accordance with Article 30 of the GDPR.",
            ],
          },
        ],
      },
      {
        id: "cookies",
        title: "5. Cookie Management",
        paragraphs: [
          "The Platform uses Matomo, a self-hosted audience measurement tool, configured to respect user privacy by default (privacy-by-design). Matomo is installed on our own AWS servers in Paris (eu-west-3), and no data is transmitted to any third-party server. Cookies set by Matomo are exclusively first-party and do not track the user beyond our site.",
          "In accordance with CNIL Deliberation No. 2020-092 and the recommendations of the APDP of Benin, cookies are classified into two categories: (A) Strictly necessary cookies for the functioning of the Platform (session, authentication, security, language preferences) — these cookies are exempt from prior consent under Article 82 of French Law No. 78-17 of January 6, 1978, as amended, and Article 58 of the Beninese Digital Code; (B) Audience measurement cookies (Matomo) — these cookies require prior consent, obtained via an explicit cookie banner on first visit.",
          "Users may at any time: (a) accept or refuse audience measurement cookies via the cookie banner or the settings panel accessible from the footer; (b) configure their browser to block cookies (see help pages for Chrome, Firefox, Safari, Edge); (c) disable Matomo tracking by clicking the opt-out link available in the footer of every Platform page. No advertising cookies, third-party cookies, or social media cookies are set by the Platform.",
        ],
      },
      {
        id: "rights",
        title: "6. Exercising Your Rights",
        paragraphs: [
          "In accordance with Articles 12 to 23 of the GDPR and Articles 60 to 72 of the Beninese Digital Code, you have the following rights regarding your personal data: right of access (Article 15 GDPR — obtain confirmation that your data is being processed and a copy of the data); right of rectification (Article 16 GDPR — correct inaccurate or incomplete data); right to erasure (Article 17 GDPR — obtain deletion of your data, subject to legal retention obligations); right to restriction of processing (Article 18 GDPR — mark your data as \"frozen\" in case of dispute over its accuracy or the lawfulness of processing); right to data portability (Article 20 GDPR — receive your data in a structured, commonly used, machine-readable format and transmit it to another data controller); right to object (Article 21 GDPR — object to processing based on legitimate interest, including profiling).",
          "These rights may be exercised directly and free of charge: (a) from your user dashboard on the Platform (for access, rectification, and portability); (b) by email to dpo@atb-agritrace.com; (c) by postal mail to: ATB Technologies SAS — DPO, 56 Boulevard de la Marina, Immeuble Atacado, 7th Floor, 01 BP 2345 Cotonou, Republic of Benin. Any request must include your first name, last name, email address associated with your account, and a front-and-back copy of a valid proof of identity.",
          "We undertake to respond to any request within a maximum of 30 days from receipt of the complete request, in accordance with Article 12(3) of the GDPR. This period may be extended by 60 additional days due to the complexity or number of requests, in which case you will be informed of the reasons for the extension. In the event of a violation of your rights, you have the right to lodge a complaint with: (a) the Beninese Personal Data Protection Authority (APDP) — contact@apdp.bj; (b) the French Data Protection Authority (CNIL) — 3 Place de Fontenoy, 75007 Paris, France — if you reside in the European Union.",
        ],
      },
      {
        id: "updates",
        title: "7. Policy Updates",
        paragraphs: [
          "This Privacy Policy may be modified at any time to reflect changes to our Platform, data processing activities, the applicable regulatory framework, or recommendations from the APDP and CNIL. In the event of a material change, you will be notified by email at the address associated with your account and/or via a notification on the Platform, at least 30 days before the changes take effect.",
          "The date of the last update is indicated at the top of this policy (May 15, 2026). The history of previous versions is available upon request from our DPO. If you continue to use the Platform after the changes take effect, they will be deemed accepted. If you do not accept the changes, you may delete your account in accordance with the procedure described in Section 6.",
        ],
      },
      {
        id: "contact",
        title: "8. Contact and Complaints",
        paragraphs: [
          "For any questions regarding this Privacy Policy, the protection of your personal data, or to exercise your rights, you may contact: (a) our DPO by email at dpo@atb-agritrace.com; (b) our customer service by email at support@atb-agritrace.com or by telephone at +229 01 23 45 67 89 (Monday to Friday, 8 AM to 6 PM UTC+1); (c) by postal mail to the registered office address indicated in Section 1.",
          "If you believe that the processing of your personal data constitutes a violation of the GDPR or the Beninese Digital Code, you have the right to lodge a complaint with: (a) the Beninese Personal Data Protection Authority (APDP) — Immeuble Ex-BIAC, 5th Floor, Avenue Clozel, 01 BP 2041 Cotonou, Benin — contact@apdp.bj — Tel: +229 21 30 80 69; (b) the CNIL for European residents — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France — Tel: +33 1 53 73 22 22.",
          "In accordance with Article 77 of the GDPR and Article 72 of the Beninese Digital Code, this complaint may be submitted without prejudice to any administrative or judicial remedy. You also have the right to an effective judicial remedy against a decision of the supervisory authority (Article 78 GDPR) and to obtain compensation for material or non-material damage suffered (Article 82 GDPR).",
        ],
      },
    ],
  },
};
