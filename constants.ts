
import { Commune, DepartmentMap, StatusMap, Organization } from './types';

export const communesData: Record<Organization, Commune[]> = {
  msf: [
    {
        id: 1, nom: 'Paris 11e', departement: '75', population: 149102, passage: '2024-01-15', statut: 'fait', maire: 'Anne Hidalgo', revenue: '38 540 €', lat: 48.8566, lng: 2.3522,
        email: 'contact@mairie-paris.fr', phone: '01 42 76 40 40',
        historiquePassages: { msf: ['2024-01-15', '2023-02-10', '2022-03-05'], unicef: ['2022-05-20'], mdm: ['2021-11-11'] }
    },
    {
        id: 2, nom: 'Marseille 1er', departement: '13', population: 873076, passage: '2024-03-02', statut: 'informe', maire: 'Benoît Payan', revenue: '23 120 €', lat: 43.2965, lng: 5.3698,
        email: 'maire@marseille.fr', phone: '04 91 55 11 11',
        historiquePassages: { msf: ['2024-03-02'], wwf: ['2023-08-19', '2022-08-15'] }
    },
    {
        id: 3, nom: 'Lyon 3e', departement: '69', population: 522250, passage: '2024-05-18', statut: 'pas_demande', maire: 'Grégory Doucet', revenue: '27 860 €', lat: 45.7640, lng: 4.8357,
        email: 'cabinet@mairie-lyon.fr', phone: '04 72 10 30 30',
        historiquePassages: { msf: ['2022-01-10'], mdm: ['2023-04-12'] }
    },
    {
        id: 4, nom: 'Lille', departement: '59', population: 236234, passage: '2024-06-22', statut: 'refuse', maire: 'Martine Aubry', revenue: '21 550 €', lat: 50.6292, lng: 3.0573,
        email: 'contact@lille.fr', phone: '03 20 49 50 00',
        historiquePassages: { unicef: ['2023-09-01'] }
    },
    {
        id: 5, nom: 'Bordeaux', departement: '33', population: 260958, passage: '2024-09-01', statut: 'telescope', maire: 'Pierre Hurmic', revenue: '26 980 €', lat: 44.8378, lng: -0.5792,
        email: 'mairie@bordeaux.fr', phone: '05 56 10 20 30',
        historiquePassages: { wwf: ['2024-09-01'] }
    },
    { id: 6, nom: 'Strasbourg', departement: '67', population: 290576, passage: '2024-10-14', statut: 'informe', maire: 'Jeanne Barseghian', revenue: '25 430 €', lat: 48.5734, lng: 7.7521, email: 'ville@strasbourg.eu', phone: '03 68 98 50 00' },
    { id: 7, nom: 'Toulouse', departement: '31', population: 504078, passage: '2023-11-05', statut: 'fait', maire: 'Jean-Luc Moudenc', revenue: '26 110 €', lat: 43.6047, lng: 1.4442, email: 'contact@toulouse.fr', phone: '05 61 22 29 22' },
    { id: 8, nom: 'Nantes', departement: '44', population: 323204, passage: '2024-01-20', statut: 'pas_demande', maire: 'Johanna Rolland', revenue: '25 780 €', lat: 47.2184, lng: -1.5536, email: 'accueil@nantes.fr', phone: '02 40 41 90 00' },
    { id: 9, nom: 'Nice', departement: '06', population: 342669, passage: '2024-04-10', statut: 'refuse', maire: 'Christian Estrosi', revenue: '24 990 €', lat: 43.7102, lng: 7.2620, email: 'maire@nice.fr', phone: '04 97 13 20 00' },
    { id: 10, nom: 'Toulon', departement: '83', population: 180639, passage: '2024-07-30', statut: 'pas_demande', maire: 'Hubert Falco', revenue: '24 150 €', lat: 43.1242, lng: 5.9280, email: 'contact@toulon.fr', phone: '04 94 36 30 00' },
  ],
  unicef: [
    { id: 11, nom: 'Neuilly-sur-Seine', departement: '92', population: 60454, passage: '2024-02-10', statut: 'informe', maire: 'Jean-Christophe Fromantin', revenue: '45 670 €', lat: 48.8787, lng: 2.2393, email: 'neuilly@neuillysurseine.fr', phone: '01 40 88 88 88', historiquePassages: { unicef: ['2024-02-10', '2023-01-15'], msf: ['2022-04-12'] } },
    { id: 12, nom: 'Saint-Denis', departement: '93', population: 113567, passage: '2024-02-11', statut: 'telescope', maire: 'Mathieu Hanotin', revenue: '18 340 €', lat: 48.9357, lng: 2.3600, email: 'contact@saint-denis.fr', phone: '01 49 33 66 66' },
    { id: 13, nom: 'Créteil', departement: '94', population: 92448, passage: '2024-03-12', statut: 'fait', maire: 'Laurent Cathala', revenue: '20 890 €', lat: 48.7904, lng: 2.4494, email: 'mairie@creteil.fr', phone: '01 49 80 92 94' },
    { id: 14, nom: 'Versailles', departement: '78', population: 84808, passage: '2024-04-14', statut: 'pas_demande', maire: 'François de Mazières', revenue: '42 130 €', lat: 48.8014, lng: 2.1301, email: 'versailles@versailles.fr', phone: '01 30 97 80 00' },
    { id: 15, nom: 'Cergy', departement: '95', population: 67519, passage: '2024-05-15', statut: 'refuse', maire: 'Jean-Paul Jeandon', revenue: '22 560 €', lat: 49.0384, lng: 2.0809, email: 'cergy@cergy.fr', phone: '01 34 33 44 00' },
  ],
  wwf: [
    { id: 16, nom: 'Montpellier', departement: '34', population: 299096, passage: '2024-01-05', statut: 'pas_demande', maire: 'Michaël Delafosse', revenue: '23 450 €', lat: 43.6108, lng: 3.8767, email: 'montpellier@montpellier.fr', phone: '04 67 34 70 00', historiquePassages: { wwf: ['2024-01-05'] } },
    { id: 17, nom: 'Avignon', departement: '84', population: 93671, passage: '2024-02-06', statut: 'fait', maire: 'Cécile Helle', revenue: '20 120 €', lat: 43.9493, lng: 4.8055, email: 'contact@avignon.fr', phone: '04 90 80 80 00' },
    { id: 18, nom: 'Nîmes', departement: '30', population: 148236, passage: '2024-03-07', statut: 'informe', maire: 'Jean-Paul Fournier', revenue: '21 330 €', lat: 43.8367, lng: 4.3601, email: 'nimes@nimes.fr', phone: '04 66 76 70 01' },
    { id: 19, nom: 'Carcassonne', departement: '11', population: 47268, passage: '2024-04-08', statut: 'refuse', maire: 'Gérard Larrat', revenue: '20 980 €', lat: 43.2130, lng: 2.3491, email: 'contact@carcassonne.fr', phone: '04 68 77 71 11' },
    { id: 20, nom: 'Perpignan', departement: '66', population: 121875, passage: '2024-05-09', statut: 'fait', maire: 'Louis Aliot', revenue: '20 540 €', lat: 42.6887, lng: 2.8948, email: 'mairie@perpignan.fr', phone: '04 68 66 30 66' },
  ],
  mdm: [
    { id: 21, nom: 'Rennes', departement: '35', population: 225081, passage: '2024-03-21', statut: 'fait', maire: 'Nathalie Appéré', revenue: '26 760 €', lat: 48.1173, lng: -1.6778, email: 'rennes@rennes.fr', phone: '02 23 62 10 10' },
    { id: 22, nom: 'Brest', departement: '29', population: 142279, passage: '2024-04-22', statut: 'pas_demande', maire: 'François Cuillandre', revenue: '24 110 €', lat: 48.3904, lng: -4.4861, email: 'brest@brest.fr', phone: '02 98 00 80 80' },
    { id: 23, nom: 'Saint-Brieuc', departement: '22', population: 44372, passage: '2024-05-23', statut: 'informe', maire: 'Hervé Guihard', revenue: '22 990 €', lat: 48.5134, lng: -2.7602, email: 'contact@saint-brieuc.fr', phone: '02 96 62 54 00' },
    { id: 24, nom: 'Vannes', departement: '56', population: 55383, passage: '2024-06-24', statut: 'fait', maire: 'David Robo', revenue: '24 560 €', lat: 47.6583, lng: -2.7609, email: 'mairie@vannes.fr', phone: '02 97 01 60 00' },
    { id: 25, nom: 'Cherbourg-en-Cotentin', departement: '50', population: 79200, passage: '2024-07-25', statut: 'refuse', maire: 'Benoît Arrivé', revenue: '23 870 €', lat: 49.6337, lng: -1.6222, email: 'cherbourg@cherbourg.fr', phone: '02 33 08 26 00' },
  ],
};

export const departmentMap: DepartmentMap = { '06': 'Alpes-Maritimes', '11': 'Aude', '13': 'Bouches-du-Rhône', '17': 'Charente-Maritime', '22': "Côtes-d'Armor", '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine', '44': 'Loire-Atlantique', '50': 'Manche', '56': 'Morbihan', '59': 'Nord', '60': 'Oise', '62': 'Pas-de-Calais', '66': "Pyrénées-Orientales", '67': 'Bas-Rhin', '69': 'Rhône', '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres', '80': 'Somme', '83': 'Var', '84': 'Vaucluse', '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise" };

export const statusMap: StatusMap = {
  'pas_demande': { text: 'Pas demandé', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  'informe': { text: 'Informé', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'refuse': { text: 'Refusé', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  'telescope': { text: 'Téléscopé', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  'fait': { text: 'Faites', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
};

export const departmentToRegionMap: { [key: string]: string } = {
  '69': 'Auvergne-Rhône-Alpes',
  '73': 'Auvergne-Rhône-Alpes',
  '74': 'Auvergne-Rhône-Alpes',
  '22': 'Bretagne',
  '29': 'Bretagne',
  '35': 'Bretagne',
  '56': 'Bretagne',
  '67': 'Grand Est',
  '59': 'Hauts-de-France',
  '60': 'Hauts-de-France',
  '62': 'Hauts-de-France',
  '80': 'Hauts-de-France',
  '75': 'Île-de-France',
  '77': 'Île-de-France',
  '78': 'Île-de-France',
  '91': 'Île-de-France',
  '92': 'Île-de-France',
  '93': 'Île-de-France',
  '94': 'Île-de-France',
  '95': 'Île-de-France',
  '50': 'Normandie',
  '76': 'Normandie',
  '17': 'Nouvelle-Aquitaine',
  '33': 'Nouvelle-Aquitaine',
  '79': 'Nouvelle-Aquitaine',
  '11': 'Occitanie',
  '30': 'Occitanie',
  '31': 'Occitanie',
  '34': 'Occitanie',
  '66': 'Occitanie',
  '44': 'Pays de la Loire',
  '06': "Provence-Alpes-Côte d'Azur",
  '13': "Provence-Alpes-Côte d'Azur",
  '83': "Provence-Alpes-Côte d'Azur",
  '84': "Provence-Alpes-Côte d'Azur",
};

export const regionalContextData = {
  regions: [
    {
      code: "44",
      nom: "Grand Est",
      donnees: {
        analyse_passee: {
          donateurs_signes: 420,
          periode: "S.40–42 (Octobre)",
          meteo: "Moy. 12°C, 5 jours de pluie. Conditions difficiles en Alsace, meilleures dans le sud de la région.",
          presse: "Foire européenne de Strasbourg (pic de contacts dép. 67). Marché de Noël de Colmar (affluence touristique élevée en novembre-décembre).",
          mairie: "Campagne 'Strasbourg Ville Verte' (WWF). Forte sensibilité environnementale de la population. Public réceptif aux causes humanitaires."
        },
        planification_future: {
          meteo_prevue: "Moy. 5°C en janvier, risque de neige en Alsace. Prévoir équipements grand froid. Redoux attendu mi-février.",
          reputation: "Région historiquement généreuse (don moyen 18€/mois) mais très sollicitée par les ONG. Climat continental marqué. Les zones rurales du Bas-Rhin restent sous-exploitées.",
          retours_equipes: "Centre-ville de Strasbourg excellent (taux de conversion 12%). Colmar très positif en période touristique. Mulhouse plus difficile, privilégier les quartiers résidentiels."
        }
      }
    },
    {
      code: "75",
      nom: "Île-de-France",
      donnees: {
        analyse_passee: {
          donateurs_signes: 680,
          periode: "S.36–39 (Septembre)",
          meteo: "Moy. 19°C, conditions idéales pour le terrain. Bonne météo = meilleurs résultats historiques (+15% vs moyenne).",
          presse: "Rentrée scolaire, forte mobilisation médiatique autour des causes enfance (UNICEF). Journée mondiale du cœur le 29/09.",
          mairie: "Partenariat actif avec Paris Centre pour les autorisations de prospection. Neuilly-sur-Seine réticent aux sollicitations de rue."
        },
        planification_future: {
          meteo_prevue: "Moy. 8°C en décembre, pluies fréquentes. Prévoir les abris et ajuster les créneaux horaires (privilégier 10h-15h).",
          reputation: "Zone à très haut potentiel (don moyen 22€/mois) mais forte concurrence entre ONG. Saturation dans les arrondissements centraux de Paris.",
          retours_equipes: "Le 11e et le 15e arrondissement sont les plus rentables. La Défense en semaine offre un bon taux de conversion sur les actifs. Éviter le samedi dans les zones touristiques."
        }
      }
    },
    {
      code: "35",
      nom: "Bretagne",
      donnees: {
        analyse_passee: {
          donateurs_signes: 310,
          periode: "S.24–27 (Juin)",
          meteo: "Moy. 18°C, quelques averses. Conditions globalement bonnes malgré la variabilité bretonne.",
          presse: "Festival Interceltique de Lorient (affluence massive en août). Fest-Noz et événements culturels locaux favorables au contact.",
          mairie: "Bonne coopération des mairies bretonnes, notamment Rennes et Vannes. Saint-Brieuc en cours d'information."
        },
        planification_future: {
          meteo_prevue: "Moy. 10°C en mars, averses fréquentes mais douces. Équipements imperméables indispensables.",
          reputation: "Région engagée et solidaire (don moyen 16€/mois). Population réceptive aux causes environnementales (WWF) et humanitaires (MDM). Forte identité locale.",
          retours_equipes: "Rennes centre excellent, surtout les jours de marché (samedi matin). Brest plus difficile hors centre-ville. Vannes sous-exploitée avec fort potentiel touristique estival."
        }
      }
    },
  ]
};

export const eventData = [
  { name: "Foire Européenne de Strasbourg", location: "Strasbourg", lat: 48.5734, lng: 7.7521, date: "Septembre", type: "foire" },
  { name: "Marché de Noël de Colmar", location: "Colmar", lat: 48.0794, lng: 7.3585, date: "Nov-Déc", type: "marché" },
  { name: "Fête des Lumières", location: "Lyon", lat: 45.7640, lng: 4.8357, date: "Décembre", type: "festival" },
  { name: "Braderie de Lille", location: "Lille", lat: 50.6292, lng: 3.0573, date: "Septembre", type: "braderie" },
  { name: "Festival d'Avignon", location: "Avignon", lat: 43.9493, lng: 4.8055, date: "Juillet", type: "festival" },
  { name: "Festival Interceltique", location: "Lorient", lat: 47.7482, lng: -3.3702, date: "Août", type: "festival" },
  { name: "Fête de la Musique", location: "Paris", lat: 48.8566, lng: 2.3522, date: "Juin", type: "festival" },
  { name: "Journées du Patrimoine", location: "Toute la France", lat: 46.603354, lng: 1.888334, date: "Septembre", type: "national" },
];

export const dataLibraryData = {
  categories: [
    { nom: "Géographie & Territoires", items: ["Région / Département", "Urbain / Rural / Péri-urbain", "Densité de population (hab/km²)", "Revenu médian par commune (INSEE)", "CSP dominante par zone", "Distance inter-communes (km)", "Taux de revisite par commune", "Donateurs signés / 1 000 hab."] },
    { nom: "Temporalité", items: ["Jour de la semaine (lun-dim)", "Créneau horaire optimal", "Événements locaux & marchés", "Vacances scolaires (zone A/B/C)", "Historique des passages par commune"] },
    { nom: "Météo", items: ["Température réelle (°C)", "Précipitations (mm/jour)", "Vitesse du vent (km/h)", "Indice UV & ensoleillement", "Corrélation météo ↔ conversion"] },
    { nom: "Équipes & Fundraisers", items: ["Ancienneté (semaines)", "Distance parcourue (km/jour)", "Temps effectif sur le terrain", "Score de bien-être équipe", "Taux de conversion individuel"] },
    { nom: "Interactions terrain", items: ["Portes frappées / jour", "Conversations > 1 min", "Durée moyenne de discussion", "Motifs de refus (catégorisés)", "Signatures obtenues / jour"] },
    { nom: "KPI de campagne", items: ["Taux de conversion global (%)", "Don moyen mensuel (€)", "Taux de rétention 1/3/6 mois", "Coût d'acquisition / signature", "Progression vs objectif semaine"] },
    { nom: "Logistique & Matériel", items: ["Véhicule : kilométrage & carburant", "État des tablettes & équipements", "Stock badges / tenues / flyers", "Distance logement ↔ zone de travail"] },
    { nom: "Population & Socio-démo", items: ["Âge médian par commune (INSEE)", "Niveau de diplôme (INSEE)", "Propriétaires vs locataires", "Indice de potentiel de don (calculé)"] },
    { nom: "Reporting client (ONG)", items: ["Donateurs signés par région", "Carte de chaleur nationale", "Coût par donateur acquis", "Impact estimé des campagnes"] },
    { nom: "Analyses croisées & IA", items: ["Meilleure commune prédite (IA)", "Corrélation météo ↔ conversion", "Performance binôme vs solo", "Créneaux horaires optimaux (ML)"] }
  ]
};
