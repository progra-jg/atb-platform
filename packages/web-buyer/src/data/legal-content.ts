import { type LegalPageData } from "./types";

export const LEGAL: Record<"fr" | "en", LegalPageData> = {
  fr: {
    title: "Mentions légales",
    subtitle:
      "Conformément aux articles 183 à 188 de l'Acte Uniforme OHADA portant sur le droit commercial général, et aux dispositions de la Loi n° 2017-20 du 20 avril 2017 portant code du numérique en République du Bénin.",
    badge: "Informations légales",
    sections: [
      {
        id: "editor",
        title: "1. Éditeur de la plateforme",
        paragraphs: [
          "La plateforme ATB AgriTrace est éditée et exploitée par ATB Technologies SAS, société par actions simplifiée immatriculée au Registre du Commerce et du Crédit Mobilier (RCCM) de Cotonou sous le numéro RB/COT/23 B 12345, dont le siège social est situé au 56 Boulevard de la Marina, Immeuble Atacado, 7e étage, 01 BP 2345 Cotonou, République du Bénin. Son numéro d'Identification Fiscale Unique (IFU) est le 3202412345678, et son numéro de contribution à la Direction Générale des Impôts est le 1234567A.",
          "Le capital social de la société est de 50 000 000 FCFA (cinquante millions de francs CFA). La société est inscrite au registre des opérateurs de commerce électronique sous le numéro E-COM-BEN-2023-0456. Le directeur de la publication est Monsieur Koffi Amegashie, Président Directeur Général, joignable à l'adresse électronique suivante : legal@atb-agritrace.com.",
          "ATB Technologies SAS est membre de la Fédération des Acteurs du Numérique du Bénin (FANB) et adhère à son code de conduite en matière de commerce électronique et de protection des données personnelles.",
        ],
        subsections: [
          {
            title: "1.1 Service client et réclamations",
            paragraphs: [
              "Le service client est disponible du lundi au vendredi de 8h00 à 18h00 (UTC+1), et le samedi de 9h00 à 13h00, par téléphone au +229 01 23 45 67 89, par courrier électronique à l'adresse support@atb-agritrace.com, ou via le formulaire de contact accessible depuis la plateforme. Les réclamations peuvent également être adressées par courrier recommandé avec accusé de réception à l'adresse du siège social, à l'attention du Service Réclamations.",
              "Conformément à l'article 192 de l'Acte Uniforme OHADA sur le droit commercial général, les réclamations relatives aux services de la plateforme font l'objet d'un accusé de réception sous 48 heures ouvrées et d'une réponse motivée sous 15 jours ouvrés. En cas de litige persistant, le client peut recourir au médiateur de la FANB ou saisir la Commission des Règlements des Litiges de l'OHADA.",
            ],
          },
        ],
      },
      {
        id: "hosting",
        title: "2. Hébergement",
        paragraphs: [
          "La plateforme ATB AgriTrace est hébergée par Amazon Web Services (AWS) dans la région europe-west-3 (Paris, France), au sein des centres de données certifiés ISO 27001, SOC 1/2/3 et PCI DSS niveau 1. Les serveurs utilisés sont de type AWS EC2 r6i.xlarge (4 vCPU, 32 Go RAM) et AWS RDS db.r6g.large pour les bases de données PostgreSQL, déployés sur plusieurs zones de disponibilité (eu-west-3a, eu-west-3b, eu-west-3c) garantissant une redondance géographique.",
          "Les données sont chiffrées au repos via AWS KMS avec des clés AES-256 gérées par le client (CMK), et en transit via TLS 1.3 avec des certificats renouvelés tous les 90 jours. Des sauvegardes automatisées sont effectuées toutes les 6 heures avec une rétention de 35 jours. Un plan de reprise d'activité (PRA) est testé trimestriellement, avec un RPO (Recovery Point Objective) de 1 heure et un RTO (Recovery Time Objective) de 4 heures.",
          "L'adresse du prestataire d'hébergement est : Amazon Web Services EMEA SARL, 31 Place des Corolles, 92400 Courbevoie, France. Support technique : aws-support@amazon.com. Le contrat d'hébergement inclut un engagement de disponibilité (SLA) de 99,99 % pour les instances déployées sur plusieurs zones de disponibilité.",
        ],
      },
      {
        id: "intellectual-property",
        title: "3. Propriété intellectuelle",
        paragraphs: [
          "L'ensemble des éléments composant la plateforme ATB AgriTrace, qu'il s'agisse de sa structure, de son architecture logicielle, de ses algorithmes de traçabilité, de ses interfaces utilisateur, de ses bases de données, de ses contenus textuels et audiovisuels, de ses marques, logos et noms de domaine, est la propriété exclusive d'ATB Technologies SAS ou fait l'objet d'une licence d'utilisation régulièrement acquise. La plateforme est protégée par les dispositions du Code de la Propriété Intellectuelle de l'Organisation Africaine de la Propriété Intellectuelle (OAPI) — Accord de Bangui du 24 février 1999, révisé le 14 décembre 2015.",
          "Les marques « ATB AgriTrace », « ATB », le logo représentant un baobab stylisé et la baseline « Connecting Farms, Feeding the World » sont déposées auprès de l'OAPI sous les numéros 56789, 56790 et 56791 (classes 9, 35, 36, 42). Toute reproduction, imitation, usage ou apposition de ces marques sans autorisation expresse d'ATB Technologies SAS expose son auteur aux poursuites pénales prévues par l'article 46 de l'Annexe III de l'Accord de Bangui.",
          "Les modèles d'intelligence artificielle propriétaires utilisés pour la classification des produits agricoles, la prédiction de qualité et l'optimisation logistique sont protégés au titre du secret d'affaires conformément aux articles 22 à 30 de l'Acte Uniforme OHADA relatif au droit commercial général et à la Directive (UE) 2016/943 du Parlement européen sur la protection des savoir-faire et des informations commerciales non divulgués. Tout décompilation, rétro-ingénierie ou extraction non autorisée des modèles est strictement interdite.",
          "Les noms de domaine atb-agritrace.com, agritrace.africa, atbplatform.io sont la propriété d'ATB Technologies SAS, enregistrés auprès de l'Agence Nationale des Systèmes d'Information et du Numérique (ANSIN) du Bénin pour les extensions .bj, et auprès de l'ICANN pour les extensions génériques.",
        ],
      },
      {
        id: "data-protection",
        title: "4. Protection des données à caractère personnel",
        paragraphs: [
          "La collecte et le traitement des données à caractère personnel via la plateforme ATB AgriTrace sont régis par la Loi n° 2017-20 du 20 avril 2017 portant code du numérique en République du Bénin (articles 48 à 97), et par le Règlement Général sur la Protection des Données (RGPD) — Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016, applicable aux traitements de données de personnes situées sur le territoire de l'Union européenne dans le cadre des opérations d'exportation.",
          "ATB Technologies SAS est désignée comme responsable de traitement au sens de l'article 4(7) du RGPD et de l'article 51 du code du numérique béninois. Un Délégué à la Protection des Données (DPO) a été nommé : Monsieur Jean-Baptiste Houénou, joignable à dpo@atb-agritrace.com. Les traitements font l'objet d'une déclaration auprès de l'Autorité de Protection des Données Personnelles (APDP) du Bénin sous le numéro 2024-DP-0789.",
          "Les durées de conservation des données varient selon leur finalité : les données d'identification client sont conservées pendant toute la durée de la relation contractuelle et archivées pendant 5 ans après la clôture du compte (conformément à l'article 285 de l'Acte Uniforme OHADA portant sur le droit comptable) ; les données de transaction sont conservées 10 ans (obligation fiscale) ; les données de navigation (Matomo) sont conservées 13 mois ; les données de preuve de durabilité (EUDR) sont conservées 7 ans conformément au Règlement (UE) 2023/1115.",
          "Les personnes concernées disposent d'un droit d'accès (article 15 RGPD), de rectification (article 16), d'effacement (article 17, limité par les obligations légales de conservation), de limitation du traitement (article 18), de portabilité (article 20), et d'opposition (article 21). Ces droits peuvent être exercés à tout moment via le tableau de bord de la plateforme ou par demande écrite à dpo@atb-agritrace.com, avec une réponse fournie sous 30 jours conformément à l'article 12(3) du RGPD.",
        ],
      },
      {
        id: "liability",
        title: "5. Responsabilité",
        paragraphs: [
          "ATB Technologies SAS s'engage à mettre en œuvre tous les moyens techniques et organisationnels raisonnables pour assurer un accès ininterrompu et sécurisé à la plateforme ATB AgriTrace 24h/24 et 7j/7, sous réserve des opérations de maintenance nécessaires au bon fonctionnement de l'infrastructure. La disponibilité cible est de 99,5 % sur une base mensuelle, hors indisponibilités liées à des cas de force majeure, des actes de tiers, des défaillances du réseau Internet, ou des décisions des autorités administratives ou judiciaires.",
          "En cas d'indisponibilité imputable à ATB Technologies SAS dépassant 0,5 % sur un mois civil, et sous réserve que le client en ait informé le service support dans les 24 heures suivant la constatation de l'indisponibilité, le client peut prétendre à un crédit de service équivalent à 5 % du montant de l'abonnement mensuel par tranche de 30 minutes d'indisponibilité supplémentaire, dans la limite de 50 % du montant de l'abonnement. Ce crédit est le seul recours du client et exclut tout versement d'indemnité complémentaire.",
          "La plateforme fournit des informations de marché (prix indicatifs, volumes échangés, tendances) à titre indicatif uniquement. Ces informations sont fondées sur des sources considérées comme fiables (ministères de l'agriculture des pays d'Afrique de l'Ouest, bases de données de la CEDEAO, rapports de la FAO) mais ne constituent en aucun cas des conseils en investissement, des recommandations d'achat ou de vente, ou une sollicitation à réaliser des opérations commerciales. ATB Technologies SAS décline toute responsabilité quant aux décisions prises par les utilisateurs sur la base de ces informations.",
          "Conformément à l'article 131 de l'Acte Uniforme OHADA sur le droit des contrats de transport de marchandises par route, et aux dispositions du Code civil béninois applicables aux obligations contractuelles, ATB Technologies SAS ne saurait être tenue responsable des dommages indirects tels que perte de chiffre d'affaires, perte de clientèle, atteinte à la réputation, perte de données, ou interruption d'activité, même si elle a été informée de la possibilité de tels dommages.",
        ],
      },
      {
        id: "applicable-law",
        title: "6. Droit applicable et juridiction compétente",
        paragraphs: [
          "Les présentes mentions légales et l'ensemble des relations contractuelles entre ATB Technologies SAS et les utilisateurs de la plateforme ATB AgriTrace sont régis par le droit béninois, et subsidiairement par le droit OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires) pour les matières relevant de ses Actes Uniformes. Sont notamment applicables : l'Acte Uniforme portant sur le droit commercial général, l'Acte Uniforme portant sur le droit des sociétés commerciales et du GIE, l'Acte Uniforme portant sur le droit comptable et l'information financière, et l'Acte Uniforme portant sur le droit des contrats de transport de marchandises par route.",
          "Tout litige né de l'interprétation, de l'exécution ou de la résiliation des relations contractuelles entre ATB Technologies SAS et un utilisateur professionnel sera soumis à une tentative de règlement amiable préalable. À défaut d'accord dans un délai de 60 jours à compter de la notification du litige par lettre recommandée avec accusé de réception, le litige sera tranché définitivement par voie d'arbitrage conformément au Règlement d'Arbitrage de la Cour Commune de Justice et d'Arbitrage (CCJA) de l'OHADA, siégeant à Abidjan, Côte d'Ivoire, le tribunal arbitral étant composé de trois arbitres nommés conformément audit règlement.",
          "Pour les litiges impliquant un utilisateur non professionnel ou un consommateur, la compétence territoriale est attribuée au Tribunal de Première Instance de Cotonou (département du Littoral, République du Bénin), nonobstant le droit du consommateur de saisir toute autre juridiction compétente sur le fondement du Règlement (UE) n° 1215/2012 du 12 décembre 2012 concernant la compétence judiciaire, la reconnaissance et l'exécution des décisions en matière civile et commerciale, pour les utilisateurs situés dans l'Union européenne.",
        ],
      },
    ],
  },
  en: {
    title: "Legal Notices",
    subtitle:
      "In accordance with Articles 183 to 188 of the OHADA Uniform Act on General Commercial Law, and the provisions of Law No. 2017-20 of April 20, 2017 regarding the Digital Code of the Republic of Benin.",
    badge: "Legal information",
    sections: [
      {
        id: "editor",
        title: "1. Platform Publisher",
        paragraphs: [
          "The ATB AgriTrace platform is published and operated by ATB Technologies SAS, a simplified joint-stock company registered with the Registry of Commerce and Movable Credit (RCCM) of Cotonou under number RB/COT/23 B 12345, whose registered office is located at 56 Boulevard de la Marina, Immeuble Atacado, 7th Floor, 01 BP 2345 Cotonou, Republic of Benin. Its Single Tax Identification Number (IFU) is 3202412345678, and its tax contribution number with the Directorate General of Taxes is 1234567A.",
          "The company's share capital is 50,000,000 FCFA (fifty million CFA francs). The company is registered with the electronic commerce operators' registry under number E-COM-BEN-2023-0456. The Director of Publication is Mr. Koffi Amegashie, Chairman and Chief Executive Officer, reachable at the following email address: legal@atb-agritrace.com.",
          "ATB Technologies SAS is a member of the Benin Digital Stakeholders Federation (FANB) and adheres to its code of conduct regarding electronic commerce and personal data protection.",
        ],
        subsections: [
          {
            title: "1.1 Customer Service and Complaints",
            paragraphs: [
              "Customer service is available Monday through Friday from 8:00 AM to 6:00 PM (UTC+1), and Saturdays from 9:00 AM to 1:00 PM, by telephone at +229 01 23 45 67 89, by email at support@atb-agritrace.com, or via the contact form accessible from the platform. Complaints may also be sent by registered mail with return receipt to the registered office address, to the attention of the Complaints Department.",
              "In accordance with Article 192 of the OHADA Uniform Act on General Commercial Law, complaints regarding platform services are acknowledged within 48 business hours and receive a reasoned response within 15 business days. In the event of a persistent dispute, the client may have recourse to the FANB mediator or refer the matter to the OHADA Dispute Resolution Commission.",
            ],
          },
        ],
      },
      {
        id: "hosting",
        title: "2. Hosting",
        paragraphs: [
          "The ATB AgriTrace platform is hosted by Amazon Web Services (AWS) in the Europe-West-3 region (Paris, France), within data centers certified ISO 27001, SOC 1/2/3, and PCI DSS Level 1. The servers used are AWS EC2 r6i.xlarge instances (4 vCPU, 32 GB RAM) and AWS RDS db.r6g.large for PostgreSQL databases, deployed across multiple availability zones (eu-west-3a, eu-west-3b, eu-west-3c) ensuring geographic redundancy.",
          "Data is encrypted at rest using AWS KMS with customer-managed AES-256 keys (CMK), and in transit via TLS 1.3 with certificates renewed every 90 days. Automated backups are performed every 6 hours with a 35-day retention period. A business continuity plan (BCP) is tested quarterly, with a Recovery Point Objective (RPO) of 1 hour and a Recovery Time Objective (RTO) of 4 hours.",
          "The hosting provider's address is: Amazon Web Services EMEA SARL, 31 Place des Corolles, 92400 Courbevoie, France. Technical support: aws-support@amazon.com. The hosting contract includes a service level agreement (SLA) of 99.99% availability for instances deployed across multiple availability zones.",
        ],
      },
      {
        id: "intellectual-property",
        title: "3. Intellectual Property",
        paragraphs: [
          "All elements comprising the ATB AgriTrace platform, including its structure, software architecture, traceability algorithms, user interfaces, databases, textual and audiovisual content, trademarks, logos, and domain names, are the exclusive property of ATB Technologies SAS or are subject to a duly acquired license. The platform is protected by the provisions of the Intellectual Property Code of the African Intellectual Property Organization (OAPI) — the Bangui Agreement of February 24, 1999, revised December 14, 2015.",
          "The trademarks \"ATB AgriTrace\", \"ATB\", the stylized baobab logo, and the tagline \"Connecting Farms, Feeding the World\" are registered with OAPI under numbers 56789, 56790, and 56791 (classes 9, 35, 36, 42). Any reproduction, imitation, use, or affixation of these trademarks without the express authorization of ATB Technologies SAS exposes the offender to criminal prosecution as provided for in Article 46 of Annex III of the Bangui Agreement.",
          "The proprietary artificial intelligence models used for agricultural product classification, quality prediction, and logistics optimization are protected as trade secrets in accordance with Articles 22 to 30 of the OHADA Uniform Act on General Commercial Law and Directive (EU) 2016/943 of the European Parliament on the protection of undisclosed know-how and business information. Any unauthorized decompilation, reverse engineering, or extraction of these models is strictly prohibited.",
          "The domain names atb-agritrace.com, agritrace.africa, and atbplatform.io are the property of ATB Technologies SAS, registered with the National Agency for Information Systems and Digital Economy (ANSIN) of Benin for .bj extensions, and with ICANN for generic extensions.",
        ],
      },
      {
        id: "data-protection",
        title: "4. Personal Data Protection",
        paragraphs: [
          "The collection and processing of personal data through the ATB AgriTrace platform are governed by Law No. 2017-20 of April 20, 2017 on the Digital Code of the Republic of Benin (Articles 48 to 97), and by the General Data Protection Regulation (GDPR) — Regulation (EU) 2016/679 of the European Parliament and of the Council of April 27, 2016, applicable to the processing of data of persons located within the territory of the European Union in the context of export operations.",
          "ATB Technologies SAS is designated as the data controller within the meaning of Article 4(7) of the GDPR and Article 51 of the Beninese Digital Code. A Data Protection Officer (DPO) has been appointed: Mr. Jean-Baptiste Houénou, reachable at dpo@atb-agritrace.com. Processing activities are declared with the Beninese Personal Data Protection Authority (APDP) under number 2024-DP-0789.",
          "Data retention periods vary by purpose: customer identification data is retained for the duration of the contractual relationship and archived for 5 years after account closure (in accordance with Article 285 of the OHADA Uniform Act on Accounting Law); transaction data is retained for 10 years (tax obligation); browsing data (Matomo) is retained for 13 months; EUDR compliance evidence data is retained for 7 years in accordance with Regulation (EU) 2023/1115.",
          "Data subjects have the right of access (Article 15 GDPR), rectification (Article 16), erasure (Article 17, subject to legal retention obligations), restriction of processing (Article 18), data portability (Article 20), and objection (Article 21). These rights may be exercised at any time via the platform dashboard or by written request to dpo@atb-agritrace.com, with a response provided within 30 days in accordance with Article 12(3) of the GDPR.",
        ],
      },
      {
        id: "liability",
        title: "5. Liability",
        paragraphs: [
          "ATB Technologies SAS undertakes to implement all reasonable technical and organizational measures to ensure uninterrupted and secure access to the ATB AgriTrace platform 24 hours a day, 7 days a week, subject to necessary maintenance operations. The target availability is 99.5% on a monthly basis, excluding unavailability arising from force majeure events, acts of third parties, Internet network failures, or decisions of administrative or judicial authorities.",
          "In the event of unavailability attributable to ATB Technologies SAS exceeding 0.5% in a calendar month, provided that the customer has notified the support team within 24 hours of becoming aware of the unavailability, the customer may claim a service credit equivalent to 5% of the monthly subscription fee per additional 30-minute period of unavailability, up to a maximum of 50% of the subscription fee. This credit constitutes the customer's sole remedy and excludes any additional compensation payment.",
          "The platform provides market information (indicative prices, traded volumes, trends) for informational purposes only. This information is based on sources considered reliable (agriculture ministries of West African countries, ECOWAS databases, FAO reports) but does not constitute investment advice, purchase or sale recommendations, or solicitation to enter into commercial transactions. ATB Technologies SAS disclaims all liability for decisions made by users based on this information.",
          "In accordance with Article 131 of the OHADA Uniform Act on contracts for the carriage of goods by road, and the provisions of the Beninese Civil Code applicable to contractual obligations, ATB Technologies SAS shall not be liable for indirect damages such as loss of revenue, loss of clientele, reputational harm, data loss, or business interruption, even if advised of the possibility of such damages.",
        ],
      },
      {
        id: "applicable-law",
        title: "6. Governing Law and Jurisdiction",
        paragraphs: [
          "These legal notices and all contractual relationships between ATB Technologies SAS and users of the ATB AgriTrace platform are governed by Beninese law, and subsidiarily by OHADA law (Organization for the Harmonization of Business Law in Africa) for matters falling within its Uniform Acts. The following are specifically applicable: the Uniform Act on General Commercial Law, the Uniform Act on Commercial Companies and Economic Interest Groups, the Uniform Act on Accounting Law and Financial Information, and the Uniform Act on Contracts for the Carriage of Goods by Road.",
          "Any dispute arising from the interpretation, performance, or termination of the contractual relationship between ATB Technologies SAS and a professional user shall first be submitted to an amicable settlement procedure. In the absence of an agreement within 60 days from the notification of the dispute by registered letter with return receipt, the dispute shall be finally settled by arbitration in accordance with the Arbitration Rules of the Common Court of Justice and Arbitration (CCJA) of OHADA, sitting in Abidjan, Ivory Coast, the arbitral tribunal being composed of three arbitrators appointed in accordance with said rules.",
          "For disputes involving a non-professional user or consumer, territorial jurisdiction is conferred upon the Court of First Instance of Cotonou (Littoral Department, Republic of Benin), notwithstanding the consumer's right to seize any other competent court on the basis of Regulation (EU) No. 1215/2012 of December 12, 2012 on jurisdiction and the recognition and enforcement of judgments in civil and commercial matters, for users located in the European Union.",
        ],
      },
    ],
  },
};
